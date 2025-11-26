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

// ⭐ TOP LEVEL CORS (Vercel Serverless Fix)
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "https://leaado-frontend-5kt3.vercel.app"
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight (MOST IMPORTANT)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// ⭐ Needed for Express CORS compatibility

// Body parsing
app.use(bodyParser.json());
app.use(express.json());

// === Mongo Connection (Run once) ===
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

// Root check
app.get("/", (_, res) => {
  res.send("API running successfully (Serverless Mode)");
});

// 🚀 Export for Vercel (no app.listen)
export default app;
