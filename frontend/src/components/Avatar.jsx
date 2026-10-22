// foto da pessoa ou, sem foto, as iniciais do nome
export function iniciaisDoNome(nome) {
  const partes = nome.trim().split(" ");
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

export default function Avatar({ nome, foto, className = "", children }) {
  return (
    <span className={`avatar ${className}`} aria-hidden="true">
      {foto ? <img src={foto} alt="" /> : iniciaisDoNome(nome)}
      {children}
    </span>
  );
}

// corta no meio em quadrado e reduz para a foto ir leve para a API
export function reduzirFoto(arquivo, lado = 256) {
  return new Promise((pronto, falhou) => {
    if (!arquivo.type.startsWith("image/")) {
      falhou(new Error("Escolha um arquivo de imagem (JPG, PNG ou WEBP)."));
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onload = () => {
        const tela = document.createElement("canvas");
        tela.width = lado;
        tela.height = lado;
        const menor = Math.min(imagem.width, imagem.height);
        tela.getContext("2d").drawImage(imagem, (imagem.width - menor) / 2, (imagem.height - menor) / 2, menor, menor, 0, 0, lado, lado);
        pronto(tela.toDataURL("image/jpeg", 0.85));
      };
      imagem.onerror = () => falhou(new Error("Não deu para abrir essa imagem."));
      imagem.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}
