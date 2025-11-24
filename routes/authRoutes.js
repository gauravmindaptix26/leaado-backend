import express from "express";
import { signup, login, dashboard } from "../controllers/authController.js";
import authenticateJWT from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/dashboard", authenticateJWT, dashboard);

export default router;
