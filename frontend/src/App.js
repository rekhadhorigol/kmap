import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import KMapApp from "./components/KMapApp";
import KMapChatbot from "./components/KMapChatbot";

function App() {
  const [kmapState, setKmapState] = useState({ hasResult: false });
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <>
                {/* Main app takes full width */}
                <KMapApp
                  onResult={(result) =>
                    setKmapState({ hasResult: true, ...result })
                  }
                />

                {/* ── Floating chatbot panel ── */}
                {chatOpen && (
                  <div
                    style={{
                      position: "fixed",
                      bottom: "88px",
                      right: "24px",
                      width: "360px",
                      zIndex: 1000,
                      borderRadius: "16px",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Close button inside panel header area */}
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "12px",
                        zIndex: 10,
                      }}
                    >
                      <button
                        onClick={() => setChatOpen(false)}
                        title="Close chat"
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          border: "none",
                          borderRadius: "50%",
                          width: "28px",
                          height: "28px",
                          cursor: "pointer",
                          color: "#fff",
                          fontSize: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <KMapChatbot kmapState={kmapState} />
                  </div>
                )}

                {/* ── Floating robot button ── */}
                <button
                  onClick={() => setChatOpen((prev) => !prev)}
                  title={chatOpen ? "Close AI Assistant" : "Open AI Assistant"}
                  style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "24px",
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(79,70,229,0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    zIndex: 1001,
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(79,70,229,0.55)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(79,70,229,0.45)";
                  }}
                >
                  {chatOpen ? "✕" : "🤖"}
                </button>
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
