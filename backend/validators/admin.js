const { z } = require("./common");

const ROLES = ["SUPER_ADMIN", "ADMIN"];
const password = z.string().min(10, "Password must be at least 10 characters").max(200);

const login = z.object({
  email: z.email("Enter a valid email").max(191),
  password: z.string().min(1, "Password is required").max(200),
});

const createAdmin = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(191),
  password,
  role: z.enum(ROLES).default("ADMIN"),
  isActive: z.boolean().optional(),
});

const updateAdmin = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.email().max(191).optional(),
  password: password.optional(),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
});

const changePassword = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: password,
});

module.exports = { ROLES, login, createAdmin, updateAdmin, changePassword };
