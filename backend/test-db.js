// Checks the database connection: npm run db:test
const prisma = require("./prisma");

async function testDatabase() {
  try {
    // $connect() is lazy with driver adapters, so run a real query
    const [row] = await prisma.$queryRaw`SELECT VERSION() AS version`;
    console.log(`✅ Database connected — server version ${row.version}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("   Is MySQL running (XAMPP Control Panel → MySQL → Start) and is DATABASE_URL correct?");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
