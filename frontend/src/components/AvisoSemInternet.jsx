import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { useTextos } from "../context/IdiomaContext";
import { traducoes } from "./aviso-sem-internet-traducoes";
import "./aviso-sem-internet.css";

// navigator.onLine acompanhado pelos eventos online e offline da janela
function assinar(avisar) {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
}

const estaOnline = () => navigator.onLine;

// faixa fina no alto da página quando a internet cai; ocupa o próprio espaço, então não cobre botão nenhum.
// A região de status fica sempre na página, para o leitor de tela anunciar quando o aviso aparece
export default function AvisoSemInternet() {
  const online = useSyncExternalStore(assinar, estaOnline, () => true);
  const t = useTextos(traducoes);

  return (
    <div role="status" className="pwa-conexao">
      {online ? null : (
        <p className="pwa-sem-internet">
          <WifiOff size={16} aria-hidden="true" />
          <span>{t.semInternet}</span>
        </p>
      )}
    </div>
  );
}
