require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const apiRoutes = require("./routes/apiRoutes");
const User = require("./models/User");

const app = express();

// Enable CORS so front‐office (on another port) can call /api
app.use(
  cors({
    origin: process.env.FRONT_URL || "http://localhost:3000",
    credentials: true,
  })
);

async function seedAdmin() {
  const username = process.env.ADMIN_USER;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASS;

  if (!username || !email || !password) {
    console.warn(
      "ADMIN_USER / ADMIN_EMAIL / ADMIN_PASS não definidos — skipped seed admin"
    );
    return;
  }

  try {
    const existing = await User.findOne({ role: "admin" }).lean();
    if (existing) {
      console.log(`Admin já existe: ${existing.username}`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await User.create({
      username,
      email,
      passwordHash,
      role: "admin",
    });
    console.log(`Seeded admin user: ${admin.username}`);
  } catch (err) {
    console.error("Erro ao criar admin seed:", err);
  }
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://mongo:27017/eu-digital", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    await seedAdmin();
    console.log("API → Connected to MongoDB");
  })
  .catch((err) => {
    console.error("API → MongoDB connection error:", err);
    process.exit(1);
  });

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes under /api
app.use("/api", apiRoutes);

// Error handler (return JSON)
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res.status(400).json({ error: err.message });
});

// Start listening on port 3001 (or from env)
const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => console.log(`API service listening on port ${PORT}`));
