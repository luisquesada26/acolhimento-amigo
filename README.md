# Acolhimento Amigo

Plataforma web gratuita que conecta migrantes e refugiados a profissionais voluntários para atendimentos online: orientação jurídica, psicologia, assistência social, aulas de português, saúde, moradia e apoio para trabalho e carreira.

Projeto final do curso Full Stack da Toti, turma 58, grupo 5.

## Tecnologias

- Backend: Node.js, Express, Zod, bcrypt e JWT
- Banco: SQLite com better-sqlite3
- Frontend: React + Vite, React Router e Axios

## Como rodar

Precisa ter o Node.js (versão LTS) e o Git instalados.

### Primeira vez

```bash
git clone https://github.com/luisquesada26/acolhimento-amigo.git
cd acolhimento-amigo
npm run install:all
cp backend/.env.example backend/.env    # no Windows: copy backend\.env.example backend\.env
npm run db:reset
npm run dev
```

O `npm run dev` sobe as duas partes juntas:

| Parte | Endereço |
| --- | --- |
| Frontend (React) | `http://localhost:5173/login` |
| API (Express) | `http://localhost:3000/api` (teste em `/api/saude`) |

Para entrar, use um dos usuários de teste abaixo ou crie uma conta nova como usuário ou como voluntário.

### Dia a dia

1. `git checkout main` e `git pull`
2. `git checkout -b feature/nome-da-tarefa`
3. Se o `schema.sql` ou o `seed.js` mudou, rodar `npm run db:reset`. Se o `package.json` mudou, rodar `npm run install:all`
4. Programar e testar com `npm run dev`
5. `git add .`, `git commit -m "feat(xx): ..."` e `git push`
6. Abrir o pull request para a `main` e esperar a aprovação do Luis

## Banco de dados

O arquivo `.db` não vai para o GitHub. Cada pessoa gera o seu com `npm run db:reset`, que apaga as tabelas, recria tudo pelo `schema.sql` e roda o `seed.js`. Pode rodar com o servidor ligado.

O seed cria 12 áreas, 5 voluntários por área (cada um com 2 serviços e horários nas próximas 2 semanas), 5 usuários e alguns agendamentos.

As senhas são salvas com bcrypt, nunca em texto puro.

Só quem cuida do banco altera o `schema.sql`. Toda mudança vai em um pull request próprio e, depois do merge, todos rodam `npm run db:reset`.

### Usuários de teste

Senha de todos: `senha123`

| Perfil | E-mail |
| --- | --- |
| Usuário | `usuario@teste.com` |
| Voluntário (Jurídico) | `voluntario@teste.com` |

## Organização no GitHub

- `main`: a única branch fixa, com a versão que vai ser apresentada
- `feature/nome-da-tarefa` e `fix/nome-do-erro`: uma branch por tarefa, criada a partir da `main`
- Ninguém faz push direto na `main`. Tudo entra por pull request, e só o Luis aprova
- Na descrição do pull request, escrever `Closes #12` com o número da tarefa: no merge a tarefa fecha sozinha. Tem que ser em inglês (`Closes`, `Fixes` ou `Resolves`), o GitHub não entende `Fecha`
- Depois do merge, a branch da tarefa é apagada

### Padrão de commits

Tipo, iniciais de quem fez entre parênteses e a descrição:

```
feat(lq): cria crud de horarios
fix(lq): corrige conflito de agendamento
docs(lq): atualiza readme
refactor(lq): separa services do controller
chore(lq): atualiza dependencias
```

## API

As rotas estão em [docs/api.md](docs/api.md).

Para testar pelo VS Code, instale a extensão **REST Client**, rode `npm run dev`, abra o arquivo [backend/api.http](backend/api.http) e clique em **Send Request** em cima de cada requisição. Rode primeiro os logins: o token é usado sozinho nas rotas que precisam dele.

Para usar pelo Postman, importe a coleção [docs/acolhimento-amigo.postman_collection.json](docs/acolhimento-amigo.postman_collection.json), com `npm run dev` rodando:

- tem GET, POST, PUT e DELETE de cada tabela, uma pasta por tabela
- não precisa fazer login: antes de cada envio a coleção entra sozinha com os usuários de teste
- PUT e DELETE trabalham no que o POST da mesma pasta criou (se não tiver, a coleção cria na hora), então os dados do seed não são apagados
- depois de um `npm run db:reset`, se alguma requisição der 401 ou 404, é só mandar de novo
- quando a coleção mudar, importe de novo e escolha **Replace** para substituir a antiga

Os casos de erro (403, 409, dados inválidos) ficam no `api.http`.

## Integrantes

- Achille Landa Kintenda (al)
- Giovanni Antonio Vielma Vivas (av)
- Jesus Eduardo Oliveros Vicent (jo)
- Luis Alberto Quesada González (lq)

