require("dotenv/config");

const bcrypt = require("bcryptjs");
const prisma = require("./prisma");

// Creates the first admin account from the ADMIN_* values in backend/.env.
// Run once: npm run create-admin
async function createAdmin() {
  const name = process.env.ADMIN_NAME || "Diagon Store Admin";
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env first.");
    process.exitCode = 1;
    return;
  }

  if (password.length < 10) {
    console.error("❌ ADMIN_PASSWORD must be at least 10 characters.");
    process.exitCode = 1;
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: {
        name,
        email: email.trim(),
        password: hashedPassword,
        role: "SUPER_ADMIN", // first admin can manage other admins
      },
    });

    console.log("✅ Admin created successfully!");
    console.log("Email:", admin.email);
  } catch (error) {
    if (error.code === "P2002") {
      console.error("❌ An admin with this email already exists.");
    } else {
      console.error("❌ Failed to create admin:", error);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
