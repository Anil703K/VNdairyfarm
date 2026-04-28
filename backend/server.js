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
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(mongoSanitize());
app.use(hpp());

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
  standardHeaders: true,
  legacyHeaders: false,
});
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  message: { message: "Too many chat requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: { message: "Too many order requests. Please try again in a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);


// routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/orders", orderLimiter);
app.use("/api/chat", chatLimiter);
app.use("/api", orderRoutes);
app.use("/api", productRoutes);
app.use("/api", chatRoutes);


app.get("/", (req, res) => res.send("Dairy backend running"));


const PORT = process.env.PORT || 3001;


const start = async () => {
try {
await connectDB();
await seedProductsIfEmpty();
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
} catch (err) {
console.error("Failed to start server", err);
}
};


start();