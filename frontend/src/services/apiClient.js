import localProducts from "./ApisData";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5002";

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
  const fallbackProducts = localProducts.filter((item) => {
    const name = String(item.name || "").toLowerCase();
    const categoryName = String(item.category || "");
    const matchesSearch = !search.trim() || name.includes(search.trim().toLowerCase());
    const matchesCategory = !category || category === "all" || categoryName === category;
    const matchesAvailability =
      available === undefined ? true : Boolean(item.available) === Boolean(available);
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  try {
    const res = await fetch(`${API_BASE}/api/products${query ? `?${query}` : ""}`);
    const data = await parseResponse(res);
    return Array.isArray(data) ? data : fallbackProducts;
  } catch (error) {
    console.warn("Falling back to local products because API call failed.", error);
    return fallbackProducts;
  }
};

export const createOrder = async ({ product, quantity, checkout = {} }) => {
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
    customerName: checkout.customerName || "",
    customerPhone: checkout.customerPhone || "",
    deliveryAddress: checkout.deliveryAddress || "",
    paymentMethod: checkout.paymentMethod || "cod",
    paymentStatus: checkout.paymentStatus || "pending",
    paymentReference: checkout.paymentReference || "",
  };

  let res;
  try {
    res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(
      "Cannot connect to server. Please start backend and try again."
    );
  }

  return parseResponse(res);
};

export const createCartOrder = async ({ items = [], checkout = {} } = {}) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please login first to place an order");
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your cart is empty");
  }

  const payload = {
    items: items.map((item) => ({
      productId: item._id || String(item.id || ""),
      name: item.name,
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
    })),
    customerName: checkout.customerName || "",
    customerPhone: checkout.customerPhone || "",
    deliveryAddress: checkout.deliveryAddress || "",
    paymentMethod: checkout.paymentMethod || "cod",
    paymentStatus: checkout.paymentStatus || "pending",
    paymentReference: checkout.paymentReference || "",
  };

  let res;
  try {
    res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(
      "Cannot connect to server. Please start backend and try again."
    );
  }

  return parseResponse(res);
};

export const fetchUserOrders = async (userId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please login to view your orders");
  if (!userId) throw new Error("Missing user id");

  let res;
  try {
    res = await fetch(`${API_BASE}/api/orders/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    throw new Error("Cannot connect to server. Please start backend and try again.");
  }

  return parseResponse(res);
};

export const fetchOrderTracking = async (orderId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please login to track order");
  if (!orderId) throw new Error("Missing order id");

  let res;
  try {
    res = await fetch(`${API_BASE}/api/orders/track/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    throw new Error("Cannot connect to server. Please start backend and try again.");
  }

  return parseResponse(res);
};

export const createRazorpayPaymentOrder = async (amount) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please login first");

  let res;
  try {
    res = await fetch(`${API_BASE}/api/orders/payments/razorpay/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
  } catch (error) {
    throw new Error("Unable to connect payment service");
  }

  return parseResponse(res);
};

export const verifyRazorpayPayment = async (payload) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please login first");

  let res;
  try {
    res = await fetch(`${API_BASE}/api/orders/payments/razorpay/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error("Unable to verify payment");
  }

  return parseResponse(res);
};

export const getUserNotifications = async (userId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please login first");

  let res;
  try {
    res = await fetch(`${API_BASE}/api/notifications/user/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    throw new Error("Unable to fetch notifications");
  }

  return parseResponse(res);
};

export const markNotificationAsRead = async (notificationId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please login first");

  let res;
  try {
    res = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    throw new Error("Unable to mark notification as read");
  }

  return parseResponse(res);
};

export const cancelOrder = async (orderId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please login first");
  if (!orderId) throw new Error("Missing order id");

  let res;
  try {
    res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    throw new Error("Unable to connect to server");
  }

  return parseResponse(res);
};
