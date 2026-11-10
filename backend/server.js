const env = require("./config/env");
const app = require("./app");
const prisma = require("./prisma");

const server = app.listen(env.port, env.host, () => {
  console.log(`Diagon Store API running on http://${env.host}:${env.port}`);
});

server.on("error", (error) => {
  console.error("Server error:", error.message);
  process.exit(1);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
