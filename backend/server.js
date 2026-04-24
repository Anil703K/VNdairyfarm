import dotenv from "dotenv";
dotenv.config();


import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import { seedProductsIfEmpty } from "./controllers/productController.js";


const app = express();
app.use(cors());
app.use(express.json());


// routes
app.use("/api/auth", authRoutes);
app.use("/api", orderRoutes);
app.use("/api", productRoutes);


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