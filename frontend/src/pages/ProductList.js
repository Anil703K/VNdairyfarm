import React, { useEffect, useMemo, useState } from "react";
import MilkCard from "./MilkCard";
import { fetchProducts } from "../services/apiClient";
import { resolveProductImage } from '../services/imageHelper';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProducts({ search, category })
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
          setError("");
        }
      })
      .catch((err) => !cancelled && setError(err.message || "Failed to load products"))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [search, category]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...set];
  }, [products]);

  const inStock = products.filter((p) => p.available).length;

  return (
    <>
      <section className="milk-page-head">
        <h1>Fresh Dairy Collection</h1>
        <p>Customer satisfaction first - browse items and place your order with full product details.</p>
        <div className="milk-toolbar">
          <input
            type="search"
            placeholder="Search milk type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All categories" : cat}
              </option>
            ))}
          </select>
        </div>
        <div className="milk-stats">
          <span>{products.length} products</span>
          <span>{inStock} in stock</span>
        </div>
      </section>

      {loading && <p className="milk-loading">Loading products...</p>}
      {error && <p className="milk-error">{error}</p>}
      <div className='products-list'>
        {!loading && !error && products.map((product) => {
          const img = resolveProductImage(product.image) || product.image;
          return (
            <MilkCard
              key={product._id || product.id}
              milk={{
                ...product,
                image: img
              }}
            />
          );
        })}
      </div>
    </>
  );
};

export default ProductList;
