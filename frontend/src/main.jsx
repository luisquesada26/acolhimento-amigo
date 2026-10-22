import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { IdiomaProvider } from "./context/IdiomaContext";
import App from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <IdiomaProvider>
          <App />
        </IdiomaProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
