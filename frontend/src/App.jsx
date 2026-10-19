import { Navigate, Route, Routes } from "react-router-dom";
import RotaProtegida from "./components/RotaProtegida";
import Login from "./pages/login/Login";
import BemVindo from "./pages/BemVindo";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/bem-vindo"
        element={
          <RotaProtegida>
            <BemVindo />
          </RotaProtegida>
        }
      />
      {/* por enquanto o site começa no login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
