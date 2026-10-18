# Acolhimento Amigo

Plataforma web gratuita que conecta migrantes e refugiados a profissionais voluntários para atendimentos online: orientação jurídica, psicologia, assistência social, aulas de português, saúde, moradia e apoio para trabalho e carreira.

Projeto final do curso Full Stack da Toti, turma 58, grupo 5.

## Tecnologias

- Backend: Node.js, Express, Zod, bcrypt e JWT
- Banco: SQLite com better-sqlite3
- Frontend: React + Vite (em construção)

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

A API sobe em `http://localhost:3000/api`. Para testar: `http://localhost:3000/api/saude`.

### Dia a dia

1. `git checkout develop` e `git pull`
2. `git checkout -b feature/nome-da-tarefa`
3. Se o `schema.sql` ou o `seed.js` mudou, rodar `npm run db:reset`. Se o `package.json` mudou, rodar `npm run install:all`
4. Programar e testar com `npm run dev`
5. `git add .`, `git commit -m "feat(xx): ..."` e `git push`
6. Abrir o pull request para a `develop`

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

- `main`: versão estável, a que vai ser apresentada
- `develop`: onde o trabalho de todos se junta
- `feature/nome-da-tarefa` e `fix/nome-do-erro`: uma branch por tarefa, criada a partir da `develop`
- Ninguém faz push direto na `main` nem na `develop`. Tudo entra por pull request com 1 aprovação, citando a tarefa (`Fecha #12`)
- No fim de cada semana a `develop` vai para a `main`

### Padrão de commits

Tipo, iniciais de quem fez entre parênteses e a descrição:

```
feat(lq): cria crud de horarios
fix(lq): corrige conflito de agendamento
docs(lq): atualiza readme
refactor(lq): separa services do controller
chore(lq): atualiza dependencias
```

## Integrantes

- Achille Landa Kintenda (al)
- Giovanni Antonio Vielma Vivas (av)
- Jesus Eduardo Oliveros Vicent (jo)
- Luis Alberto Quesada González (lq)
