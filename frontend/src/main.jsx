import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { IdiomaProvider } from "./context/IdiomaContext";
import App from "./App";
import AvisoSemInternet from "./components/AvisoSemInternet";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <IdiomaProvider>
          <AvisoSemInternet />
          <App />
        </IdiomaProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

// service worker só no site publicado (em desenvolvimento guardaria arquivos velhos) e depois do load,
// para não disputar a rede com o primeiro carregamento
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // sem service worker o site funciona igual, só não abre sem internet
    });
  });
}
