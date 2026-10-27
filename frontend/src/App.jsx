
import { Navigate, Route, Routes } from "react-router-dom";
import RotaProtegida from "./components/RotaProtegida";
import Login from "./pages/login/Login";
import Inicio from "./pages/inicio/Inicio";
import LayoutVoluntario from "./pages/voluntario/LayoutVoluntario";
import PainelVoluntario from "./pages/voluntario/PainelVoluntario";
import Agenda from "./pages/voluntario/Agenda";
import Atendimentos from "./pages/voluntario/Atendimentos";
import Perfil from "./pages/voluntario/Perfil";
import Relatorios from "./pages/voluntario/Relatorios";
import LayoutUsuario from "./pages/usuario/LayoutUsuario";
import Buscar from "./pages/usuario/Buscar";
import PerfilVoluntario from "./pages/usuario/PerfilVoluntario";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />

      <Route path="/login" element={<Login />} />

      <Route
        path="/usuario"
        element={
          <RotaProtegida perfil="usuario">
            <LayoutUsuario />
          </RotaProtegida>
        }
      >
        <Route index element={<Buscar />} />
        <Route path="voluntario/:id" element={<PerfilVoluntario />} />
      </Route>
      <Route
        path="/voluntario"
        element={
          <RotaProtegida perfil="voluntario">
            <LayoutVoluntario />
          </RotaProtegida>
        }
      >
        <Route index element={<PainelVoluntario />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="atendimentos" element={<Atendimentos />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
