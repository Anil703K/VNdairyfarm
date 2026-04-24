import Product from "../models/Product.js";

const defaultProducts = [
  { name: "Fresh Cow Milk", price: 80, description: "Pure and fresh cow milk sourced from local farms.", image: "cowmilk.png", category: "Cow Milk", quantityLabel: "1 litre", available: true, featured: true },
  { name: "Fresh Cow Milk", price: 40, description: "Pure and fresh cow milk sourced from local farms.", image: "cowmilk.png", category: "Cow Milk", quantityLabel: "500 ml", available: true, featured: false },
  { name: "Buffalo Milk", price: 90, description: "Rich and creamy buffalo milk.", image: "buffalomilk.png", category: "Buffalo Milk", quantityLabel: "1 litre", available: true, featured: true },
  { name: "Buffalo Milk", price: 45, description: "Rich and creamy buffalo milk.", image: "buffalomilk.png", category: "Buffalo Milk", quantityLabel: "500 ml", available: true, featured: false },
  { name: "Organic Cow Milk", price: 100, description: "Certified organic cow milk.", image: "cowmilk.png", category: "Cow Milk", quantityLabel: "1 litre", available: true, featured: true },
  { name: "Organic Cow Milk", price: 50, description: "Certified organic cow milk.", image: "cowmilk.png", category: "Cow Milk", quantityLabel: "500 ml", available: false, featured: false },
  { name: "Organic Buffalo Milk", price: 100, description: "Certified organic buffalo milk.", image: "buffalomilk.png", category: "Buffalo Milk", quantityLabel: "1 litre", available: true, featured: true },
  { name: "Organic Buffalo Milk", price: 50, description: "Certified organic buffalo milk.", image: "buffalomilk.png", category: "Buffalo Milk", quantityLabel: "500 ml", available: false, featured: false },
  { name: "Milk Powder", price: 250, description: "High-quality milk powder for cooking and baking.", image: "milkpowder.png", category: "Dairy", quantityLabel: "500 grams", available: true, featured: true },
];

export const seedProductsIfEmpty = async () => {
  const total = await Product.countDocuments();
  if (total === 0) {
    await Product.insertMany(defaultProducts);
  }
};

export const getProducts = async (req, res) => {
  try {
    const { search = "", category = "all", available } = req.query;
    const query = {};

    if (search.trim()) {
      query.$text = { $search: search.trim() };
    }

    if (category !== "all") {
      query.category = category;
    }

    if (available === "true" || available === "false") {
      query.available = available === "true";
    }

    const products = await Product.find(query)
      .sort({ featured: -1, createdAt: -1 })
      .lean();
    return res.json(products);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};
