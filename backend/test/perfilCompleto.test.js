// voluntario so aparece na busca com o perfil completo. Roda contra um Postgres local descartavel:
// DATABASE_URL=postgres://postgres@127.0.0.1:<porta>/<banco> node --test
// Sem banco local, os testes ficam de fora; endereco que nao e desta maquina e recusado, para nunca gravar na producao
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");

function ehLocal(url) {
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

const bancoLocal = ehLocal(process.env.DATABASE_URL ?? "");
process.env.JWT_SECRET ||= "segredo-dos-testes";
process.env.TRADUCAO_DESLIGADA = "1";

describe("perfil completo para aparecer na busca", { skip: !bancoLocal && "precisa de DATABASE_URL de um Postgres local" }, () => {
  let servidor;
  let base;
  let conexao;
  const tokens = [];

  async function pedir(metodo, caminho, { token, corpo } = {}) {
    const resposta = await fetch(`${base}${caminho}`, {
      method: metodo,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const texto = await resposta.text();
    return { status: resposta.status, corpo: texto ? JSON.parse(texto) : null };
  }

  const amanha = () => require("../src/utils/datas").formatarData(require("../src/utils/datas").diaMais(2));

  async function novoVoluntario(nome) {
    const email = `${nome.toLowerCase().replace(/\s/g, ".")}.${Date.now()}@teste.local`;
    const { status, corpo } = await pedir("POST", "/auth/cadastro", {
      corpo: { nome, email, senha: "senha123", perfil: "voluntario", aceite_lgpd: true, voluntario: { area_id: 1 } },
    });
    assert.equal(status, 201, JSON.stringify(corpo));
    tokens.push(corpo.token);
    return { token: corpo.token, usuario: corpo.usuario, nome };
  }

  async function completar(token) {
    assert.equal((await pedir("PUT", "/me", { token, corpo: { pais_origem: "Venezuela", voluntario: { idiomas: ["pt", "es"], bio: "Ajudo com documentos e regularização." } } })).status, 200);
    assert.equal((await pedir("POST", "/servicos", { token, corpo: { titulo: "Orientação inicial", descricao: "Conversa para entender o seu caso." } })).status, 201);
    assert.equal((await pedir("POST", "/horarios", { token, corpo: { data: amanha(), hora_inicio: "10:00", hora_fim: "10:45" } })).status, 201);
  }

  const naBusca = async (nome, filtros = "") => (await pedir("GET", `/voluntarios${filtros}`)).corpo.some((v) => v.nome === nome);
  const meuPerfil = async (token) => (await pedir("GET", "/me", { token })).corpo.voluntario;

  before(async () => {
    const app = require("../src/app");
    conexao = require("../src/database/conexao");
    await new Promise((pronto) => {
      servidor = app.listen(0, "127.0.0.1", pronto);
    });
    base = `http://127.0.0.1:${servidor.address().port}/api`;
  });

  after(async () => {
    for (const token of tokens) await pedir("DELETE", "/me", { token });
    await new Promise((pronto) => servidor.close(pronto));
    await conexao.pool.end();
  });

  test("conta nova nasce fora da busca, com os 5 itens pendentes", async () => {
    const { token, usuario, nome } = await novoVoluntario("Ana Nova");

    assert.equal(usuario.voluntario.ativo, false);
    assert.equal(usuario.voluntario.na_busca, false);
    assert.equal(usuario.voluntario.perfil_completo, false);
    assert.deepEqual(usuario.voluntario.requisitos, { nacionalidade: false, idiomas: false, bio: false, servico: false, horario: false });
    assert.equal(await naBusca(nome), false);

    const { rows } = await conexao.consulta("SELECT v.ativo FROM voluntarios v WHERE v.usuario_id = ?", [usuario.id]);
    assert.equal(rows[0].ativo, 0, "no banco, a conta nova fica com ativo = 0");
    assert.equal((await meuPerfil(token)).ativo, false);
  });

  test("ligar a busca com algo faltando: 400 dizendo o que falta, e nada muda", async () => {
    const { token, usuario, nome } = await novoVoluntario("Beto Incompleto");
    await pedir("PUT", "/me", { token, corpo: { pais_origem: "Haiti" } });

    const { status, corpo } = await pedir("PUT", "/me", { token, corpo: { voluntario: { ativo: true } } });

    assert.equal(status, 400);
    assert.equal(corpo.erro, "Complete o perfil para aparecer na busca");
    assert.deepEqual(
      corpo.detalhes.map((d) => d.campo),
      ["voluntario.idiomas", "voluntario.bio", "servicos", "horarios"],
      "a nacionalidade já está preenchida e não aparece"
    );
    assert.ok(corpo.detalhes.every((d) => d.mensagem), "cada item traz a mensagem");
    assert.equal((await meuPerfil(token)).ativo, false);
    assert.equal(await naBusca(nome), false);
    assert.equal((await conexao.consulta("SELECT ativo FROM voluntarios WHERE usuario_id = ?", [usuario.id])).rows[0].ativo, 0);
  });

  test("com os 5 itens prontos a busca não liga sozinha; o voluntário liga e aparece", async () => {
    const { token, nome } = await novoVoluntario("Carla Completa");
    await completar(token);

    const antes = await meuPerfil(token);
    assert.equal(antes.perfil_completo, true);
    assert.deepEqual(antes.requisitos, { nacionalidade: true, idiomas: true, bio: true, servico: true, horario: true });
    assert.equal(antes.ativo, false, "completar não liga a busca");
    assert.equal(await naBusca(nome), false);

    const { status, corpo } = await pedir("PUT", "/me", { token, corpo: { voluntario: { ativo: true } } });
    assert.equal(status, 200, JSON.stringify(corpo));
    assert.equal(corpo.voluntario.na_busca, true);
    assert.equal(await naBusca(nome), true);
    assert.equal(await naBusca(nome, "?q=documentos"), true, "a busca por texto também acha");
  });

  test("a bio e o ligar no mesmo PUT valem juntos, quando a bio era o que faltava", async () => {
    const { token, nome } = await novoVoluntario("Davi Junto");
    await completar(token);
    await pedir("PUT", "/me", { token, corpo: { voluntario: { bio: null } } });

    const { status } = await pedir("PUT", "/me", { token, corpo: { voluntario: { bio: "Professor de português.", ativo: true } } });
    assert.equal(status, 200);
    assert.equal(await naBusca(nome), true);
  });

  test("ativo que apaga a bio ou o último serviço some da busca e o status mostra o motivo", async () => {
    const { token, nome } = await novoVoluntario("Elisa Ativa");
    await completar(token);
    await pedir("PUT", "/me", { token, corpo: { voluntario: { ativo: true } } });
    assert.equal(await naBusca(nome), true);

    await pedir("PUT", "/me", { token, corpo: { voluntario: { bio: "  " } } });
    let v = await meuPerfil(token);
    assert.equal(v.ativo, true, "a escolha dele fica guardada");
    assert.equal(v.na_busca, false);
    assert.equal(v.requisitos.bio, false);
    assert.equal(await naBusca(nome), false, "bio só com espaços não conta");

    await pedir("PUT", "/me", { token, corpo: { voluntario: { bio: "Voltei com a bio." } } });
    assert.equal(await naBusca(nome), true);

    const [servico] = (await pedir("GET", "/meus-servicos", { token })).corpo;
    await pedir("PUT", `/servicos/${servico.id}`, { token, corpo: { ativo: false } });
    v = await meuPerfil(token);
    assert.equal(v.na_busca, false);
    assert.equal(v.requisitos.servico, false);
    assert.equal(await naBusca(nome), false);
  });

  test("sem nacionalidade ou sem idiomas, a busca também esconde", async () => {
    const { token, usuario, nome } = await novoVoluntario("Fabio Sem Pais");
    await completar(token);
    await pedir("PUT", "/me", { token, corpo: { voluntario: { ativo: true } } });

    await pedir("PUT", "/me", { token, corpo: { pais_origem: null } });
    assert.equal(await naBusca(nome), false);
    await pedir("PUT", "/me", { token, corpo: { pais_origem: "Angola" } });
    assert.equal(await naBusca(nome), true);

    // o PUT /me não aceita lista vazia de idiomas; a conta antiga sem idioma fica assim no banco
    await conexao.consulta("UPDATE voluntarios SET idiomas = '' WHERE usuario_id = ?", [usuario.id]);
    assert.equal(await naBusca(nome), false);
  });

  test("horário que passou não tira da busca, mas volta a faltar para ligar", async () => {
    const { token, usuario, nome } = await novoVoluntario("Gil Sem Horario");
    await completar(token);
    await pedir("PUT", "/me", { token, corpo: { voluntario: { ativo: true } } });

    await conexao.consulta(
      "UPDATE horarios SET data = '2020-01-06' WHERE voluntario_id = (SELECT id FROM voluntarios WHERE usuario_id = ?)",
      [usuario.id]
    );

    const v = await meuPerfil(token);
    assert.equal(await naBusca(nome), true, "a busca não exige horário futuro");
    assert.equal(v.na_busca, true);
    assert.equal(v.requisitos.horario, false);
    assert.equal(v.perfil_completo, false);

    await pedir("PUT", "/me", { token, corpo: { voluntario: { ativo: false } } });
    const religar = await pedir("PUT", "/me", { token, corpo: { voluntario: { ativo: true } } });
    assert.equal(religar.status, 400);
    assert.deepEqual(religar.corpo.detalhes.map((d) => d.campo), ["horarios"]);
  });

  test("desligar a busca sempre pode, mesmo com o perfil incompleto", async () => {
    const { token } = await novoVoluntario("Hugo Desliga");
    const { status, corpo } = await pedir("PUT", "/me", { token, corpo: { voluntario: { ativo: false } } });
    assert.equal(status, 200);
    assert.equal(corpo.voluntario.ativo, false);
  });

  test("perfil público de quem está fora da busca: aparece, mas sem horários para marcar", async () => {
    const { token, nome } = await novoVoluntario("Iara Publica");
    await completar(token);
    const id = (await meuPerfil(token)).id;

    let publico = await pedir("GET", `/voluntarios/${id}`);
    assert.equal(publico.status, 200);
    assert.equal(publico.corpo.nome, nome);
    assert.equal(publico.corpo.servicos.length, 1);
    assert.deepEqual(publico.corpo.horarios, [], "fora da busca, ninguém marca pelo link direto");

    await pedir("PUT", "/me", { token, corpo: { voluntario: { ativo: true } } });
    publico = await pedir("GET", `/voluntarios/${id}`);
    assert.equal(publico.corpo.horarios.length, 1);
  });

  test("agendamento novo com voluntário fora da busca: 409, e o que já existia continua", async () => {
    const vol = await novoVoluntario("Joana Agenda");
    await completar(vol.token);
    assert.equal((await pedir("POST", "/horarios", { token: vol.token, corpo: { data: amanha(), hora_inicio: "11:00", hora_fim: "11:45" } })).status, 201);
    const [primeiro, segundo] = (await pedir("GET", "/meus-horarios", { token: vol.token })).corpo;
    const [servico] = (await pedir("GET", "/meus-servicos", { token: vol.token })).corpo;

    const cadastro = await pedir("POST", "/auth/cadastro", {
      corpo: { nome: "Kauã Usuario", email: `kaua.${Date.now()}@teste.local`, senha: "senha123", perfil: "usuario", aceite_lgpd: true },
    });
    assert.equal(cadastro.status, 201);
    tokens.push(cadastro.corpo.token);
    const usuario = cadastro.corpo.token;
    const marcar = (horario) =>
      pedir("POST", "/agendamentos", {
        token: usuario,
        corpo: { horario_id: horario.id, servico_id: servico.id, descricao: "Preciso de ajuda com a renovação do meu protocolo." },
      });

    // completo, mas a busca ainda está desligada
    let resposta = await marcar(primeiro);
    assert.equal(resposta.status, 409, JSON.stringify(resposta.corpo));
    assert.equal(resposta.corpo.erro, "Este voluntário não está recebendo agendamentos agora");
    assert.ok((await pedir("GET", "/meus-horarios", { token: vol.token })).corpo.every((h) => h.status === "livre"), "o horário continua livre");

    await pedir("PUT", "/me", { token: vol.token, corpo: { voluntario: { ativo: true } } });
    resposta = await marcar(primeiro);
    assert.equal(resposta.status, 201, JSON.stringify(resposta.corpo));
    const marcado = resposta.corpo.id;

    // desligou depois: o que já estava marcado fica, o novo não entra
    await pedir("PUT", "/me", { token: vol.token, corpo: { voluntario: { ativo: false } } });
    resposta = await marcar(segundo);
    assert.equal(resposta.status, 409);
    const meus = (await pedir("GET", "/meus-agendamentos", { token: usuario })).corpo;
    assert.deepEqual(meus.map((a) => [a.id, a.status]), [[marcado, "confirmado"]]);
  });

  test("na_busca e os requisitos vêm como booleano, nunca null, mesmo com idiomas NULL no banco", async () => {
    const { token, usuario, nome } = await novoVoluntario("Lia Nula");
    await completar(token);
    await pedir("PUT", "/me", { token, corpo: { voluntario: { ativo: true } } });
    const id = (await meuPerfil(token)).id;

    // a coluna é NOT NULL; aqui ela aceita NULL só durante o teste, no banco local
    await conexao.consulta("ALTER TABLE voluntarios ALTER COLUMN idiomas DROP NOT NULL");
    try {
      await conexao.consulta("UPDATE voluntarios SET idiomas = NULL WHERE usuario_id = ?", [usuario.id]);

      const v = await meuPerfil(token);
      assert.strictEqual(v.na_busca, false);
      assert.strictEqual(v.requisitos.idiomas, false);
      assert.strictEqual(v.perfil_completo, false);
      assert.deepEqual(v.idiomas, []);

      const publico = (await pedir("GET", `/voluntarios/${id}`)).corpo;
      assert.strictEqual(publico.na_busca, false);
      assert.deepEqual(publico.horarios, []);
      assert.equal(await naBusca(nome), false);
    } finally {
      await conexao.consulta("UPDATE voluntarios SET idiomas = 'pt' WHERE idiomas IS NULL");
      await conexao.consulta("ALTER TABLE voluntarios ALTER COLUMN idiomas SET NOT NULL");
    }
  });

  test("os voluntários do seed continuam todos na busca", async () => {
    const { rows } = await conexao.consulta(
      "SELECT v.id FROM voluntarios v JOIN usuarios u ON u.id = v.usuario_id WHERE u.email NOT LIKE '%@teste.local'"
    );
    const naLista = new Set((await pedir("GET", "/voluntarios")).corpo.map((v) => v.id));
    assert.ok(rows.length > 0);
    assert.deepEqual(rows.filter((r) => !naLista.has(r.id)), [], "nenhum voluntário do seed some");
  });
});
