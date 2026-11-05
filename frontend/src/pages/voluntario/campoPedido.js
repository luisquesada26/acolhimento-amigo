import { useEffect, useEffectEvent } from "react";
import { useSearchParams } from "react-router-dom";

// os links das pendências (ONDE_RESOLVER, em comum.jsx) levam ao campo exato do Meu perfil.
// O link que chega com ?campo=<id> chama aoPedir no componente desse campo, uma vez.
// Depois o campo sai do endereço, para voltar à aba não abrir de novo
export function useCampoPedido(id, aoPedir) {
  const [parametros, setParametros] = useSearchParams();
  const pedido = parametros.get("campo") === id;
  const abrir = useEffectEvent(aoPedir);

  useEffect(() => {
    if (!pedido) return;
    abrir();
    setParametros(
      (atuais) => {
        const novos = new URLSearchParams(atuais);
        novos.delete("campo");
        return novos;
      },
      { replace: true },
    );
  }, [pedido, setParametros]);
}

// rola até o bloco e põe o foco no primeiro campo ou botão dele
export function mostrarEFocar(elemento) {
  if (!elemento) return;
  elemento.scrollIntoView({ block: "center", behavior: "smooth" });
  elemento.querySelector("input, textarea, select, button")?.focus({ preventScroll: true });
}
