const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const parseResponse = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return body;
};

export const fetchProducts = async ({ search = "", category = "all", available } = {}) => {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (category && category !== "all") params.set("category", category);
  if (available !== undefined) params.set("available", String(available));

  const query = params.toString();
  const res = await fetch(`${API_BASE}/api/products${query ? `?${query}` : ""}`);
  return parseResponse(res);
};

export const createOrder = async ({ product, quantity }) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please login first to place an order");

  const payload = {
    items: [
      {
        productId: product._id || String(product.id || ""),
        name: product.name,
        quantity,
        price: Number(product.price),
      },
    ],
  };

  const res = await fetch(`${API_BASE}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res);
};
