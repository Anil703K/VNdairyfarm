import React, { useMemo, useState } from "react";
import "./AiChatBot.css";

const SUGGESTIONS = [
  "Show products",
  "How to place order?",
  "Delivery time",
  "How to login?",
  "Contact support",
];

const buildBotReply = (text) => {
  const q = text.toLowerCase();

  if (q.includes("product") || q.includes("milk") || q.includes("show")) {
    return "You can view all products on Home and Products page. We have Fresh Cow Milk, Buffalo Milk, Organic Milk and more.";
  }
  if (q.includes("order") || q.includes("buy")) {
    return "To place an order: open Products, click Order, choose quantity, then click Order Now. Please login first before ordering.";
  }
  if (q.includes("delivery") || q.includes("time")) {
    return "VN DAIRY delivers fresh products quickly. Delivery timing depends on your location and order volume.";
  }
  if (q.includes("login") || q.includes("register") || q.includes("account")) {
    return "Use Login from the top menu. If you are a new customer, open Register page and create your account first.";
  }
  if (q.includes("contact") || q.includes("support") || q.includes("help")) {
    return "You can use the Contact page from menu for support. Our team will help you with orders, login, and delivery issues.";
  }

  return "I can help with products, orders, login, delivery, and support. Try asking: 'How to place order?'";
};

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

function AiChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi, I am VN DAIRY AI Assistant. Ask me anything about products, ordering, login or support.",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const askBackendBot = async (question) => {
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Chat service error");
      return data.reply || buildBotReply(question);
    } catch (error) {
      return buildBotReply(question);
    }
  };

  const sendQuestion = async (question) => {
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);
    const answer = await askBackendBot(question);
    setMessages((prev) => [...prev, { role: "bot", text: answer }]);
    setLoading(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!canSend || loading) return;
    const question = input.trim();
    setInput("");
    await sendQuestion(question);
  };

  const handleSuggestion = async (text) => {
    if (loading) return;
    await sendQuestion(text);
  };

  return (
    <div className="ai-chat-root">
      <button
        type="button"
        className="ai-chat-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI Assistant"
      >
        <span className="ai-emoji" aria-hidden="true">🤖</span>
        <span>AI Assistant</span>
      </button>

      {open && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <h3>VN DAIRY AI Help</h3>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">x</button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((item, idx) => (
              <div key={`${item.role}-${idx}`} className={`ai-msg ${item.role}`}>
                {item.text}
              </div>
            ))}
            {loading && <div className="ai-msg bot">Thinking...</div>}
          </div>

          <div className="ai-chat-suggestions">
            {SUGGESTIONS.map((item) => (
              <button type="button" key={item} onClick={() => handleSuggestion(item)}>
                {item}
              </button>
            ))}
          </div>

          <form className="ai-chat-input-row" onSubmit={handleSend}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about orders, products, login..."
            />
            <button type="submit" disabled={!canSend || loading}>
              {loading ? "..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AiChatBot;
