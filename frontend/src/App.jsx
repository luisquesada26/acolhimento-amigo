
import { Navigate, Route, Routes } from "react-router-dom";
import RotaProtegida from "./components/RotaProtegida";
import Login from "./pages/login/Login";
import BemVindo from "./pages/BemVindo";
import Inicio from "./pages/inicio/Inicio";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />

      <Route path="/login" element={<Login />} />

      <Route
        path="/bem-vindo"
        element={
          <RotaProtegida>
            <BemVindo />
          </RotaProtegida>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
