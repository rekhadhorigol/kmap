import { useState, useRef, useEffect } from "react";

export default function KMapChatbot({ kmapState }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I can answer questions about your current K-Map. Try asking: 'Why is this the minimal SOP?' or 'Explain the prime implicants.'",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildSystemPrompt = () => {
    if (!kmapState || !kmapState.hasResult) {
      return `You are a K-Map expert assistant. Help users understand K-Maps and boolean algebra.`;
    }
    return `You are a K-Map expert. Current K-Map: Variables=${kmapState.variables}, SOP=${kmapState.sop}, POS=${kmapState.pos}, Prime Implicants=${JSON.stringify(kmapState.primeImplicants)}. Answer questions using this data.`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text ?? "Sorry, I couldn't get a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to AI. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "500px",
      border: "1px solid #e2e8f0", borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)", background: "#fff"
    }}>
      <div style={{
        padding: "12px 16px", background: "#4f46e5", color: "#fff",
        borderRadius: "12px 12px 0 0", fontWeight: "600",
        display: "flex", alignItems: "center", gap: "8px"
      }}>
        🤖 K-Map AI Assistant
        {kmapState?.hasResult && (
          <span style={{
            marginLeft: "auto", fontSize: "11px", background: "#4ade80",
            color: "#14532d", padding: "2px 8px", borderRadius: "999px"
          }}>
            Live Data
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "80%", padding: "8px 12px", borderRadius: "12px",
              fontSize: "14px", whiteSpace: "pre-wrap",
              background: msg.role === "user" ? "#4f46e5" : "#f1f5f9",
              color: msg.role === "user" ? "#fff" : "#1e293b",
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "#f1f5f9", padding: "8px 12px", borderRadius: "12px", fontSize: "14px", color: "#94a3b8" }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "12px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "8px" }}>
        <input
          style={{
            flex: 1, border: "1px solid #e2e8f0", borderRadius: "8px",
            padding: "8px 12px", fontSize: "14px", outline: "none"
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about your K-Map..."
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            background: "#4f46e5", color: "#fff", border: "none",
            borderRadius: "8px", padding: "8px 16px", fontSize: "14px",
            cursor: "pointer", opacity: loading || !input.trim() ? 0.5 : 1
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}