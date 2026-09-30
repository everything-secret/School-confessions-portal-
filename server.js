// server.js
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const db = new sqlite3.Map(":memory:"); // In-memory DB for demo

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

db.serialize(() => {
  db.run(
    "CREATE TABLE confessions (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT, status TEXT)"
  );
});

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  const { password } = req.body;
  const match = await bcrypt.compare(
    password,
    await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
  );
  if (match) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Invalid password" });
  }
});

// Post Confession
app.post("/api/confessions", (req, res) => {
  const { text } = req.body;
  db.run(
    "INSERT INTO confessions (text, status) VALUES (?, ?)",
    [text, "pending"],
    function () {
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Get Confessions (Admin only)
app.get("/api/admin/confessions", (req, res) => {
  if (!req.session.isAdmin) return res.status(401).send("Unauthorized");
  db.all("SELECT * FROM confessions", (err, rows) => {
    res.json(rows);
  });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
