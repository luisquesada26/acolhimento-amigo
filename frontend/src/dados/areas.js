// cor e ícone de cada área, pelo nome que vem da API
const VISUAL = {
  "Jurídico": { cor: "#1e5bd8", fundo: "#eaf1fe", icone: "M12 4v16 M8 20h8 M5 7h14 M5 7l-3 6h6z M19 7l-3 6h6z" },
  "Psicologia": { cor: "#8b3fd9", fundo: "#f4ecfe", icone: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" },
  "Assistência social": { cor: "#16924b", fundo: "#e8f7ee", icone: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M23 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8" },
  "Aulas de português": { cor: "#d9661c", fundo: "#fff2e6", icone: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" },
  "Recolocação profissional": { cor: "#0e8a80", fundo: "#e4f6f4", icone: "M2 7h20v14H2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" },
  "Mentoria de carreira": { cor: "#5046d6", fundo: "#eeedfe", icone: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z" },
  "Revalidação de diplomas": { cor: "#c72a6e", fundo: "#fdedf4", icone: "M22 10L12 5 2 10l10 5 10-5z M6 12v5c3 3 9 3 12 0v-5" },
  "Educação financeira": { cor: "#a87a0a", fundo: "#fdf6e3", icone: "M3 6h15a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z M3 6l12-3v3 M16 13.5h2" },
  "Empreendedorismo": { cor: "#0b84a5", fundo: "#e3f4f9", icone: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0" },
  "Orientação em saúde": { cor: "#d63a3a", fundo: "#fdeeee", icone: "M12 8v8 M8 12h8 M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  "Moradia": { cor: "#5e8c16", fundo: "#f0f7e4", icone: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" },
  "Informática básica": { cor: "#3b5bb5", fundo: "#ecf0fa", icone: "M2 3h20v14H2z M8 21h8 M12 17v4" },
};

const PADRAO = { cor: "#4a5b78", fundo: "#eef3fb", icone: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z" };

export function visualDaArea(nome) {
  return VISUAL[nome] ?? PADRAO;
}
