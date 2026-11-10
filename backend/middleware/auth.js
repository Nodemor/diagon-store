const jwt = require("jsonwebtoken");
const env = require("../config/env");
const prisma = require("../prisma");
const { unauthorized, forbidden } = require("../utils/httpError");

/**
 * Requires a valid admin JWT ("Authorization: Bearer <token>").
 * Re-checks the admin in the database so deactivated/deleted admins lose access immediately.
 * Sets req.admin = { id, name, email, role }.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw unauthorized("Access denied. No token provided.");

  let payload;
  try {
    payload = jwt.verify(header.slice(7), env.jwtSecret);
  } catch {
    throw unauthorized("Invalid or expired token.");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: payload.id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!admin || !admin.isActive) throw unauthorized("Account is not active.");

  req.admin = admin;
  next();
}

/** Restricts a route to the given roles, e.g. requireRole("SUPER_ADMIN"). */
const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) throw forbidden();
    next();
  };

module.exports = { requireAuth, requireRole };
