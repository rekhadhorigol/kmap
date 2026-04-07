import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import KMapApp from "./components/KMapApp";
import KMapChatbot from "./components/KMapChatbot";

function App() {
  const [kmapState, setKmapState] = useState({ hasResult: false });

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <div style={{ display: "flex", gap: "24px", padding: "24px" }}>
              {/* Existing K-Map app */}
              <div style={{ flex: 2 }}>
                <KMapApp onResult={(result) => setKmapState({ hasResult: true, ...result })} />
              </div>
              {/* Chatbot on the right */}
              <div style={{ flex: 1, minWidth: "320px" }}>
                <KMapChatbot kmapState={kmapState} />
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
