import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const SECRET_KEY = process.env.JWT_SECRET || "default_secret_key";

const generateToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: "2h" });

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, mobile, country } = req.body;

    if (!fullName || !email || !password)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser)
      return res.status(409).json({ success: false, message: "Email exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      mobile,
      country,
    });

    return res.status(201).json({ success: true, message: "Signup success" });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) return res.status(401).json({ success: false, message: "Invalid details" });

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) return res.status(401).json({ success: false, message: "Invalid details" });

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
};

export const dashboard = (req, res) => {
  res.json({ message: `Welcome ${req.user.email} !` });
};
