import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import leadsRoutes from "./routes/leadsRoutes.js";

// Load env values (Vercel will inject them)
dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⭐ VERCEL-SAFE CORS
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "https://leaado-frontend.vercel.app/",
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  next();
});

// Body parser
app.use(bodyParser.json());
app.use(express.json());

// ⭐ MongoDB Connect
if (!global._mongooseConnected) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB  is connected");
      global._mongooseConnected = true;
    })
    .catch((err) => console.error("MongoDB error:", err));
}

// Static
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadsRoutes);

// Ping route
app.get("/", (req, res) => {
  res.send("Backend running on Vercel...");
});

// Export
export default app;
