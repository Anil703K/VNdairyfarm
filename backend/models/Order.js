import mongoose from "mongoose";


const itemSchema = new mongoose.Schema({
productId: { type: String },
name: { type: String, required: true },
quantity: { type: Number, required: true, min: 1 },
price: { type: Number, required: true, min: 0 },
});


const orderSchema = new mongoose.Schema(
{
user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
items: [itemSchema],
totalPrice: { type: Number, required: true },
status: { type: String, default: "pending" },
customerName: { type: String },
customerPhone: { type: String },
deliveryAddress: { type: String },
notificationStatus: {
  sms: { type: String, default: "pending" }, // pending, sent, failed
  whatsapp: { type: String, default: "pending" },
},
},
{ timestamps: true }
);


const Order = mongoose.model("Order", orderSchema);
export default Order;