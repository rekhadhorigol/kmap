import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import KMapApp from "./components/KMapApp";
<<<<<<< HEAD
import KMapChatbot from "./components/KMapChatbot";

function App() {
  const [kmapState, setKmapState] = useState({ hasResult: false });

=======

function App() {
>>>>>>> b10543bcef5f9a0b909ed57727a8156690ff67be
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
<<<<<<< HEAD
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
=======
          <Route path="/" element={<KMapApp />} />
>>>>>>> b10543bcef5f9a0b909ed57727a8156690ff67be
        </Routes>
      </BrowserRouter>
    </div>
  );
}

<<<<<<< HEAD
export default App;
=======
export default App;
>>>>>>> b10543bcef5f9a0b909ed57727a8156690ff67be
