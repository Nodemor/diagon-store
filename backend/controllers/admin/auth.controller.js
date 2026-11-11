const bcrypt = require("bcryptjs");
const prisma = require("../../prisma");
const env = require("../../config/env");
const { startSession, endSession } = require("../../middleware/auth");
const { unauthorized, badRequest, HttpError } = require("../../utils/httpError");
const { passwordProblem } = require("../../utils/password");

const publicAdmin = ({ id, name, email, role, lastLoginAt }) => ({ id, name, email, role, lastLoginAt });

// Compared against when the email doesn't exist, so a wrong email takes as long as a wrong
// password and attackers can't discover which accounts exist by timing the response.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);
const GENERIC = "Invalid email or password";

// POST /api/admin/login
async function login(req, res) {
  const { email, password } = req.valid.body;
  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw unauthorized(GENERIC);
  }

  // locked after too many wrong passwords in a row
  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    await bcrypt.compare(password, DUMMY_HASH);
    const minutes = Math.ceil((admin.lockedUntil - Date.now()) / 60000);
    throw new HttpError(429, `Too many wrong passwords. This account is locked for ${minutes} more minute${minutes === 1 ? "" : "s"}.`);
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid || !admin.isActive) {
    if (!valid) {
      const failed = admin.failedLogins + 1;
      const lock = failed >= env.maxFailedLogins;
      await prisma.admin.update({
        where: { id: admin.id },
        data: lock
          ? { failedLogins: 0, lockedUntil: new Date(Date.now() + env.lockMinutes * 60000) }
          : { failedLogins: failed },
      });
      if (lock) {
        console.warn(`[security] admin account ${admin.id} locked after ${failed} failed sign-ins from ${req.ip}`);
        throw new HttpError(429, `Too many wrong passwords. This account is locked for ${env.lockMinutes} minutes.`);
      }
    }
    throw unauthorized(GENERIC);
  }

  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date(), failedLogins: 0, lockedUntil: null },
  });

  startSession(res, updated);
  res.json({ message: "Signed in", admin: publicAdmin(updated) });
}

// POST /api/admin/logout — ends this session and every other session of this admin
async function logout(req, res) {
  await prisma.admin.update({ where: { id: req.admin.id }, data: { tokenVersion: { increment: 1 } } });
  endSession(res);
  res.json({ message: "Signed out" });
}

// GET /api/admin/profile
async function profile(req, res) {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
  res.json({ admin: publicAdmin(admin) });
}

// PUT /api/admin/profile/password — signs out every other device, keeps this one signed in
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.valid.body;
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });

  if (!(await bcrypt.compare(currentPassword, admin.password))) {
    throw badRequest("Current password is incorrect", [{ path: "currentPassword", message: "Incorrect password" }]);
  }
  const problem = passwordProblem(newPassword, admin);
  if (problem) throw badRequest(problem, [{ path: "newPassword", message: problem }]);

  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: { password: await bcrypt.hash(newPassword, 12), tokenVersion: { increment: 1 } },
  });
  startSession(res, updated);
  res.json({ message: "Password updated. Other devices have been signed out." });
}

module.exports = { login, logout, profile, changePassword };
