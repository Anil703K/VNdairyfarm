import React, { useEffect, useMemo, useState } from "react";
import MilkCard from "./MilkCard";
import { fetchProducts } from "../services/apiClient";
import { resolveProductImage } from '../services/imageHelper';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProducts({ search: debouncedSearch, category })
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
  }, [debouncedSearch, category]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...set];
  }, [products]);

  const inStock = products.filter((p) => p.available).length;
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === "priceLowToHigh") {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "priceHighToLow") {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === "ratingHighToLow") {
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sortBy === "nameAZ") {
      list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    }
    return list;
  }, [products, sortBy]);

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
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recommended">Sort: Recommended</option>
            <option value="priceLowToHigh">Price: Low to High</option>
            <option value="priceHighToLow">Price: High to Low</option>
            <option value="ratingHighToLow">Rating: High to Low</option>
            <option value="nameAZ">Name: A to Z</option>
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
        {!loading && !error && sortedProducts.map((product) => {
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
