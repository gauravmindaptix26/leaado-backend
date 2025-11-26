import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import leadsRoutes from "./routes/leadsRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⭐ 100% VERCEL COMPATIBLE CORS FIX (NO "*")
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "https://leaado-frontend-5kt3.vercel.app",
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // PRE-FLIGHT FIX
  if (req.method === "OPTIONS") {
    return res.status(200).json({});
  }

  next();
});

// Body parsing
app.use(bodyParser.json());
app.use(express.json());

// === Mongo Connection (Run once)
if (!global._mongooseConnected) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB connected");
      global._mongooseConnected = true;
    })
    .catch((err) => console.error("Mongo error", err));
}

// Static folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadsRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("API running successfully (Vercel Serverless)");
});

// Export for Vercel serverless
export default app;
