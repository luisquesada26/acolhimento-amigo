import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/login/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* por enquanto o site começa no login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
