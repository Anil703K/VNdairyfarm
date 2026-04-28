const WEBSITE_CONTEXT = `
You are VN DAIRY customer support assistant.
Website purpose: dairy e-commerce for fresh milk products.
Key pages:
- Home: highlights and featured products
- Products (/MilkList): browse and place order
- Login/Register: user authentication
- Profile: user details for logged-in users
- Contact: customer support

Order flow:
1) User logs in
2) User opens Products page
3) Clicks Order on a product
4) Chooses quantity and confirms order

Rules:
- Keep replies short and practical.
- Be friendly and clear.
- If asked unrelated or harmful content, politely refuse and redirect to website help.
`;

const localFallbackReply = (message) => {
  const q = String(message || "").toLowerCase();
  if (q.includes("product") || q.includes("milk") || q.includes("show")) {
    return "You can view products on Home and Products page. We have fresh cow milk, buffalo milk and organic options.";
  }
  if (q.includes("order") || q.includes("buy")) {
    return "To place an order: open Products, click Order, choose quantity, and click Order Now. Please login first.";
  }
  if (q.includes("delivery") || q.includes("time")) {
    return "Delivery time depends on your location and current order volume. We aim for quick fresh delivery.";
  }
  if (q.includes("login") || q.includes("register") || q.includes("account")) {
    return "Use Login from the top menu. New users can create an account on Register page.";
  }
  if (q.includes("contact") || q.includes("support") || q.includes("help")) {
    return "Please open the Contact page from the menu. Support team will help with orders, login, and delivery issues.";
  }
  return "I can help with products, orders, login, delivery, and support. Try asking: How to place order?";
};

export const chatbotReply = async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    if (!apiKey) {
      return res.json({
        reply: localFallbackReply(message),
        source: "fallback",
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 220,
        messages: [
          { role: "system", content: WEBSITE_CONTEXT.trim() },
          { role: "user", content: String(message) },
        ],
      }),
    });

    const body = await response.json().catch(() => ({}));
    const aiReply = body?.choices?.[0]?.message?.content?.trim();

    if (!response.ok || !aiReply) {
      return res.json({
        reply: localFallbackReply(message),
        source: "fallback",
      });
    }

    return res.json({
      reply: aiReply,
      source: "openai",
    });
  } catch (error) {
    return res.json({
      reply: localFallbackReply(req?.body?.message),
      source: "fallback",
    });
  }
};
