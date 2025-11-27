import bcrypt from "bcryptjs";
import User from "../models/User.js";

const sanitizePhone = (phone = "") => phone.replace(/\D/g, "").slice(0, 10);

export const getProfile = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.mobile || "",
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ success: false, message: "Unable to load profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { fullName, email, phone, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (phone) {
      const cleanedPhone = sanitizePhone(phone);
      if (cleanedPhone.length !== 10) {
        return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits" });
      }
      user.mobile = cleanedPhone;
    }

    if (fullName) {
      user.fullName = fullName.trim();
    }

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== user.email) {
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser && existingUser.id !== String(user._id)) {
          return res.status(409).json({ success: false, message: "Email already in use" });
        }
        user.email = normalizedEmail;
      }
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: "Current password is required to set a new password" });
      }
      const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentValid) {
        return res.status(400).json({ success: false, message: "Current password is incorrect" });
      }
      user.password = await bcrypt.hash(newPassword, 12);
    }

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.mobile || "",
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, message: "Unable to update profile" });
  }
};
