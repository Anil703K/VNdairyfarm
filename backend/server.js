import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { seedProductsIfEmpty } from "./controllers/productController.js";

const app = express();

// ✅ REQUIRED for Render (fix rate-limit + IP issues)
app.set("trust proxy", 1);

// ✅ CORS setup (production-ready)
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log("Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ✅ Security middlewares
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(mongoSanitize());
app.use(hpp());

// ✅ Rate limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 350,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many auth attempts. Please try again later." },
});

const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  message: { message: "Too many chat requests. Please slow down." },
});

const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: { message: "Too many order requests. Please try again later." },
});

app.use(globalLimiter);

// ✅ Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/orders", orderLimiter, orderRoutes);
app.use("/api/chat", chatLimiter, chatRoutes);
app.use("/api/products", productRoutes);

// ✅ Health check (IMPORTANT for Render)
app.get("/", (req, res) => {
  res.send("Dairy backend running ✅");
});

// ✅ Error handler (prevents crashes)
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ message: "Server Error" });
});

// ✅ Port setup (Render gives dynamic port)
const PORT = process.env.PORT || 3001;

// ✅ Start server
const start = async () => {
  try {
    await connectDB();
    await seedProductsIfEmpty();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  }
};

start();