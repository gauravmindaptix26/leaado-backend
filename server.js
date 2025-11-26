

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

// === CORS FIX ===
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://leaado-frontend-5kt3.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);
app.options("*", cors());

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

// Static folder (uploads)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadsRoutes);

// Root check
app.get("/", (_, res) => {
  res.send("API running successfully (Serverless Mode)");
});

// === MOST IMPORTANT ===
// Instead of app.listen() → Export default handler
export default app;
