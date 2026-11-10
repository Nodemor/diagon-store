require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

// DATABASE_URL format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
// The same variable is used by the Prisma CLI (see prisma.config.ts).
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy backend/.env.example to backend/.env and fill it in.");
}

const dbUrl = new URL(process.env.DATABASE_URL);

const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace(/^\//, ""),
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 5,
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
