import { Navigate } from "react-router-dom";
import { paginaInicial, useAuth } from "../context/AuthContext";

// perfil: quando a página é só de um perfil, quem é do outro volta para a sua página inicial
export default function RotaProtegida({ perfil, children }) {
  const { logado, usuario } = useAuth();
  if (!logado) return <Navigate to="/login" replace />;
  if (perfil && usuario.perfil !== perfil) return <Navigate to={paginaInicial(usuario.perfil)} replace />;
  return children;
}
