require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const path = require("path");
const methodOverride = require("method-override");
const axios = require("axios");

const logger = require("./utils/logger");

const viewRoutes = require("./routes/viewRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Pug for templates
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Serve static assets (CSS/JS for modal, etc.)
app.use(express.static(path.join(__dirname, "public")));
// Serve uploaded files (images, PDFs, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Method‐override (to support PUT/DELETE via forms)
app.use(methodOverride("_method"));

// Sessions & Passport (same as before)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "uma_chavesecreta",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Local strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const apiBase = "http://backoffice:3001";
      const response = await axios.get(
        `${apiBase}/api/users/${encodeURIComponent(username)}`
      );
      const user = response.data;
      if (!user)
        return done(null, false, { message: "Utilizador não encontrado" });

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return done(null, false, { message: "Password incorreta" });

      return done(null, user);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return done(null, false, { message: "Utilizador não encontrado" });
      }
      return done(err);
    }
  })
);

// Serialize / deserialize
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const apiBase = "http://backoffice:3001";
    const response = await axios.get(`${apiBase}/api/users/id/${id}`);
    const user = response.data;
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Mount view & auth routes
app.use("/", authRoutes);
app.use("/", viewRoutes);

// Error handler (render a simple error page or redirect)
app.use((err, req, res, next) => {
  console.error("Front Error:", err);
  res.status(400).render("error", { message: err.message });
});

// Start listening on port 3000
const PORT = process.env.FRONT_PORT || 3000;
app.listen(PORT, () => console.log(`Front service listening on port ${PORT}`));
