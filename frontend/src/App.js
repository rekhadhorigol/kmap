import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import KMapApp from "./components/KMapApp";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<KMapApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
