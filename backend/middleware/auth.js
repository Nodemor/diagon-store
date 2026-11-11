const jwt = require("jsonwebtoken");
const env = require("../config/env");
const prisma = require("../prisma");
const { unauthorized, forbidden } = require("../utils/httpError");

// ---------------------------------------------------------------------------
// Admin sessions
// - The session token lives in an httpOnly, SameSite=Strict cookie, so page scripts can never
//   read it (an XSS bug can't steal it) and other sites can't send it.
// - Each token carries the admin's tokenVersion. Signing out, changing the password or being
//   blocked bumps the version in the database, which invalidates every older token at once.
// ---------------------------------------------------------------------------

const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: env.sessionCookie.secure,
  sameSite: "strict",
  path: "/api/admin",
  ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
});

/** Converts "8h" / "30m" / "1d" / seconds to milliseconds for the cookie lifetime. */
function durationMs(value) {
  const m = /^(\d+)\s*([smhd])?$/.exec(String(value).trim());
  if (!m) return 8 * 60 * 60 * 1000;
  const unit = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2] || "s"];
  return Number(m[1]) * unit;
}

/** Signs a session for the admin and sets the cookie. */
function startSession(res, admin) {
  const token = jwt.sign({ id: admin.id, tv: admin.tokenVersion }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.cookie(env.sessionCookie.name, token, cookieOptions(durationMs(env.jwtExpiresIn)));
}

function endSession(res) {
  res.clearCookie(env.sessionCookie.name, cookieOptions());
}

/**
 * Requires a signed-in, active admin whose session hasn't been revoked.
 * Sets req.admin = { id, name, email, role, tokenVersion }.
 */
async function requireAuth(req, res, next) {
  const token = req.cookies?.[env.sessionCookie.name];
  if (!token) throw unauthorized("Please sign in.");

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    endSession(res);
    throw unauthorized("Your session has expired. Please sign in again.");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: payload.id },
    select: { id: true, name: true, email: true, role: true, isActive: true, tokenVersion: true },
  });

  if (!admin || !admin.isActive || admin.tokenVersion !== payload.tv) {
    endSession(res);
    throw unauthorized("Your session has ended. Please sign in again.");
  }

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

/**
 * Cross-site request forgery guard for the admin API.
 * Every state-changing request must carry the X-Requested-With header that only our own
 * frontend sends. Browsers don't allow other sites to add custom headers without a CORS
 * pre-flight, which our CORS policy rejects — so forged form posts are refused.
 * (SameSite=Strict on the cookie is the first line of defence; this is the second.)
 */
function requireCsrfHeader(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.get("X-Requested-With") !== "DiagonStore") throw forbidden("Request blocked. Please reload the page and try again.");
  next();
}

module.exports = { requireAuth, requireRole, requireCsrfHeader, startSession, endSession };
