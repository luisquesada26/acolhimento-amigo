import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RotaProtegida({ children }) {
  const { logado } = useAuth();
  if (!logado) return <Navigate to="/login" replace />;
  return children;
}
