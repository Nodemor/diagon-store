// Creates the first admin (SUPER_ADMIN), or resets an admin's password.
// No credentials are stored in files: the password is typed at the prompt (hidden).
//
//   npm run create-admin               create a super admin
//   npm run create-admin -- --reset    set a new password for an existing admin (also unlocks it
//                                      and signs it out everywhere)
//
// For automated setups only, ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME environment variables are
// accepted instead of the prompt. Never put them in .env files that are kept around.
require("dotenv/config");
const readline = require("readline");
const bcrypt = require("bcryptjs");
const prisma = require("./prisma");
const { passwordProblem } = require("./utils/password");

const RESET = process.argv.includes("--reset");

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // print the question, then hide every typed character
      rl._writeToOutput = (text) => {
        if (text.includes(question)) rl.output.write(question);
        else if (text === "\r\n" || text === "\n") rl.output.write(text);
        else rl.output.write("*".repeat(text.length ? 1 : 0));
      };
    }
    rl.question(question, (answer) => {
      if (hidden) rl.output.write("\n");
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function promptPassword(account) {
  if (process.env.ADMIN_PASSWORD) {
    const problem = passwordProblem(process.env.ADMIN_PASSWORD, account);
    if (problem) throw new Error(`ADMIN_PASSWORD: ${problem}`);
    return process.env.ADMIN_PASSWORD;
  }
  for (;;) {
    const password = await ask("Password (hidden): ", { hidden: true });
    const problem = passwordProblem(password, account);
    if (problem) {
      console.log(`  ✗ ${problem}`);
      continue;
    }
    const again = await ask("Repeat password: ", { hidden: true });
    if (again !== password) {
      console.log("  ✗ The passwords don't match. Try again.");
      continue;
    }
    return password;
  }
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || (await ask("Admin email: "))).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");

  const existing = await prisma.admin.findUnique({ where: { email } });

  if (RESET) {
    if (!existing) throw new Error(`No admin with the email ${email}.`);
    const password = await promptPassword(existing);
    await prisma.admin.update({
      where: { id: existing.id },
      data: { password: await bcrypt.hash(password, 12), tokenVersion: { increment: 1 }, failedLogins: 0, lockedUntil: null, isActive: true },
    });
    console.log(`✅ Password reset for ${email}. The account is unlocked and signed out on all devices.`);
    return;
  }

  if (existing) throw new Error(`An admin with the email ${email} already exists. Use --reset to change its password.`);
  const name = process.env.ADMIN_NAME || (await ask("Display name (e.g. Kasun): ")) || "Diagon Store Admin";
  const password = await promptPassword({ email, name });

  await prisma.admin.create({
    data: { name, email, password: await bcrypt.hash(password, 12), role: "SUPER_ADMIN" },
  });
  console.log(`✅ Super admin created: ${email}`);
}

main()
  .catch((error) => {
    console.error("❌", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
