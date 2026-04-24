import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";


const generateToken = (id) => {
return jwt.sign({ id }, process.env.JWT_SECRET, {
expiresIn: process.env.TOKEN_EXPIRES_IN || "7d",
});
};


export const register = async (req, res) => {
try {
const { name, email, password, phone, address } = req.body;
if (!name || !email || !password || !phone) {
return res.status(400).json({ message: "Name, email, password and phone are required" });
}


const existing = await User.findOne({ email: email.toLowerCase() });
if (existing) return res.status(400).json({ message: "User already exists" });


const salt = await bcrypt.genSalt(10);
const hashed = await bcrypt.hash(password, salt);


const user = await User.create({ name, email: email.toLowerCase(), password: hashed, phone, address });


const token = generateToken(user._id);


return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
} catch (err) {
console.error(err);
return res.status(500).json({ message: "Server error" });
}
};


export const login = async (req, res) => {
try {
const { email, password } = req.body;
if (!email || !password) return res.status(400).json({ message: "Email and password are required" });


const user = await User.findOne({ email: email.toLowerCase() });
if (!user) return res.status(400).json({ message: "Invalid credentials" });


const match = await bcrypt.compare(password, user.password);
if (!match) return res.status(400).json({ message: "Invalid credentials" });


const token = generateToken(user._id);
return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
} catch (err) {
console.error(err);
return res.status(500).json({ message: "Server error" });
}
};