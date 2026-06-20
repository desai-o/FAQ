import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { FAQProvider } from "./shared/context/FAQContext";
import { ThemeProvider } from "./shared/context/ThemeContext";
import { AuthProvider } from "./shared/context/AuthContext";
import "./shared/styles/style.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <FAQProvider>
          <App />
        </FAQProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);