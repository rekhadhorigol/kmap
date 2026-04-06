import { useState, useRef, useEffect } from "react";

export default function KMapChatbot({ kmapState }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I can answer questions about your current K-Map. Try asking: 'Why is this the minimal SOP?' or 'Explain the prime implicants.'",
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
      return `You are a K-Map expert assistant. Help users understand K-Maps and boolean algebra. 
Be concise and clear. Use examples when helpful.`;
    }
    return `You are a K-Map expert assistant. The user has computed a K-Map with the following results:

- Variables: ${kmapState.variables}
- Minimal SOP: ${kmapState.sop}
- Minimal POS: ${kmapState.pos}
- Prime Implicants: ${JSON.stringify(kmapState.primeImplicants)}
- Essential Prime Implicants: ${JSON.stringify(kmapState.essentialPrimeImplicants || [])}
- Groups: ${JSON.stringify(kmapState.groups || [])}

Answer questions using this data. Be concise and educational. 
Explain your reasoning step by step when asked about minimization.`;
  };

  // Anthropic requires: no leading assistant messages, alternating user/assistant
  const buildApiMessages = (allMessages) => {
    const filtered = allMessages.filter(
      (m) => m.role === "user" || m.role === "assistant"
    );

    // Drop leading assistant messages
    let start = 0;
    while (start < filtered.length && filtered[start].role === "assistant") {
      start++;
    }
    const trimmed = filtered.slice(start);

    // Ensure alternating roles — merge consecutive same-role messages
    const result = [];
    for (const msg of trimmed) {
      if (result.length > 0 && result[result.length - 1].role === msg.role) {
        result[result.length - 1].content += "\n" + msg.content;
      } else {
        result.push({ role: msg.role, content: msg.content });
      }
    }

    return result;
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
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: buildApiMessages(updatedMessages),
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Chat API error:", err);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const reply =
        data.content?.[0]?.text ?? "Sorry, I couldn't get a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error connecting to AI. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "500px",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        background: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          background: "#4f46e5",
          color: "#fff",
          borderRadius: "12px 12px 0 0",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        🤖 K-Map AI Assistant
        {kmapState?.hasResult && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "11px",
              background: "#4ade80",
              color: "#14532d",
              padding: "2px 8px",
              borderRadius: "999px",
            }}
          >
            Live Data
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "8px 12px",
                borderRadius: "12px",
                fontSize: "14px",
                whiteSpace: "pre-wrap",
                lineHeight: "1.5",
                background: msg.role === "user" ? "#4f46e5" : "#f1f5f9",
                color: msg.role === "user" ? "#fff" : "#1e293b",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                background: "#f1f5f9",
                padding: "8px 12px",
                borderRadius: "12px",
                fontSize: "14px",
                color: "#94a3b8",
              }}
            >
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          style={{
            flex: 1,
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "14px",
            outline: "none",
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
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "14px",
            cursor: "pointer",
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
}
