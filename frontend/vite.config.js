import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// depois do build, o public/sw.js copiado para a saída recebe a versão e a lista de arquivos deste build.
// Um deploy com mudança gera outro sw.js, e o navegador troca o service worker e apaga o cache antigo
function serviceWorkerDoBuild() {
  return {
    name: "service-worker-do-build",
    apply: "build",
    writeBundle(saida, pacote) {
      const arquivos = Object.keys(pacote)
        .filter((nome) => nome.startsWith("assets/"))
        .sort()
        .map((nome) => `/${nome}`);
      const html = pacote["index.html"]?.source ?? "";
      const versao = createHash("sha256").update(arquivos.join("\n") + html).digest("hex").slice(0, 12);

      const caminho = join(saida.dir, "sw.js");
      const original = readFileSync(caminho, "utf8");
      // cada marcador aparece uma vez só; se alguém mexer neles, o build para em vez de publicar um sw.js quebrado
      for (const marcador of ['"acolhimento-__VERSAO__"', '["__ARQUIVOS__"]']) {
        if (original.split(marcador).length !== 2) throw new Error(`sw.js: marcador ${marcador} ausente ou repetido`);
      }
      writeFileSync(
        caminho,
        original.replace('"acolhimento-__VERSAO__"', `"acolhimento-${versao}"`).replace('["__ARQUIVOS__"]', JSON.stringify(arquivos)),
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorkerDoBuild()],
  server: { port: 5173 },
});
