import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { FAQProvider } from "./context/FAQContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles/style.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <FAQProvider>
        <App />
      </FAQProvider>
    </ThemeProvider>
  </BrowserRouter>
);