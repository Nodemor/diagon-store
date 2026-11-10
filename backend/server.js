require("dotenv/config");

const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const adminRoutes = require("./routes/adminRoutes");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Copy backend/.env.example to backend/.env and fill it in.");
  process.exit(1);
}

const app = express();

// Comma-separated list of allowed frontend origins, e.g. http://localhost:5173
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(express.json());
app.use(cors({ origin: allowedOrigins }));
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

app.get("/", (req, res) => {
  res.send("Diagon Store Backend is Running!");
});

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "127.0.0.1";

console.log("Starting server...");

// ===============================
// 404 ROUTE HANDLER
// ===============================
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

server.on("error", (error) => {
  console.error("SERVER ERROR:", error);
});

process.on("exit", (code) => {
  console.log("PROCESS EXITED:", code);
});