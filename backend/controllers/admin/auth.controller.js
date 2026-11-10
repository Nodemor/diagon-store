const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../prisma");
const env = require("../../config/env");
const { unauthorized, badRequest } = require("../../utils/httpError");

const publicAdmin = ({ id, name, email, role, lastLoginAt }) => ({ id, name, email, role, lastLoginAt });

// POST /api/admin/login
async function login(req, res) {
  const { email, password } = req.valid.body;
  const admin = await prisma.admin.findUnique({ where: { email } });

  // same message for unknown email / wrong password / disabled account
  const valid = admin && admin.isActive && (await bcrypt.compare(password, admin.password));
  if (!valid) throw unauthorized("Invalid email or password");

  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

  const token = jwt.sign({ id: admin.id, role: admin.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.json({ message: "Login successful", token, admin: publicAdmin(admin) });
}

// GET /api/admin/profile
async function profile(req, res) {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
  res.json({ admin: publicAdmin(admin) });
}

// PUT /api/admin/profile/password
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.valid.body;
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });

  if (!(await bcrypt.compare(currentPassword, admin.password))) {
    throw badRequest("Current password is incorrect", [{ path: "currentPassword", message: "Incorrect password" }]);
  }

  await prisma.admin.update({ where: { id: admin.id }, data: { password: await bcrypt.hash(newPassword, 10) } });
  res.json({ message: "Password updated" });
}

module.exports = { login, profile, changePassword };
