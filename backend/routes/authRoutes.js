import express from "express";
import { register, login } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Get current authenticated user
router.get("/me", authMiddleware, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select("-password");
		if (!user) return res.status(404).json({ message: "User not found" });
		return res.json({ user });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "Server error" });
	}
});

export default router;