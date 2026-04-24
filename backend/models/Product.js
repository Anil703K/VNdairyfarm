import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, trim: true },
    quantityLabel: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    available: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", category: "text" });

const Product = mongoose.model("Product", productSchema);
export default Product;
