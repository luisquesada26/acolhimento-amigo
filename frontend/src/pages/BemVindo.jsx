import { useAuth } from "../context/AuthContext";

export default function BemVindo() {
  const { usuario } = useAuth();
  const primeiroNome = usuario.nome.split(" ")[0];

  return (
    <main className="bem-vindo">
      <h1>Olá, {primeiroNome}! Bem-vindo.</h1>
    </main>
  );
}
