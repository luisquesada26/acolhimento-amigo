# API

Base: `http://localhost:3000/api`. Tudo em JSON.

Erros sempre vêm assim:

```json
{ "erro": "Mensagem em português", "detalhes": [] }
```

Em erro de validação, `detalhes` traz `{ "campo", "mensagem" }` de cada campo.

## Login

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/auth/cadastro` | Cria a conta (mesmo corpo de `POST /usuarios`) e já devolve `{ token, usuario }` |
| POST | `/auth/login` | Recebe `{ email, senha }` e devolve `{ token, usuario }` |
| GET | `/me` | Dados de quem está logado |
| PUT | `/me` | Edita os próprios dados (inclusive a senha) |
| DELETE | `/me` | Exclui a própria conta |

As rotas `/me` precisam do header `Authorization: Bearer <token>`. O token vale 7 dias.

A senha é salva com bcrypt na coluna `senha_hash` e nunca volta nas respostas. E-mail ou senha errados dão sempre a mesma mensagem: `401 "E-mail ou senha incorretos"`.

## Áreas

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/areas` | Lista as áreas |
| GET | `/areas/:id` | Uma área |
| POST | `/areas` | Cria `{ nome }` |
| PUT | `/areas/:id` | Edita `{ nome }` |
| DELETE | `/areas/:id` | Exclui. `409` se tiver voluntários |

## Usuários

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/usuarios?perfil=` | Lista (`usuario` ou `voluntario`) |
| GET | `/usuarios/:id` | Um usuário. Se for voluntário, vem com `voluntario` |
| POST | `/usuarios` | Cria conta |
| PUT | `/usuarios/:id` | Edita nome, email, senha, telefone, pais_origem, idioma |
| DELETE | `/usuarios/:id` | Exclui a conta e libera os horários que ele tinha reservado |

`senha_hash` nunca aparece nas respostas.

```json
{
  "nome": "Mariana Costa",
  "email": "mariana@email.com",
  "senha": "senha123",
  "telefone": "11999990000",
  "perfil": "voluntario",
  "idioma": "pt",
  "aceite_lgpd": true,
  "voluntario": {
    "area_id": 1,
    "registro_profissional": "OAB/SP 000000",
    "idiomas": ["pt", "es"],
    "bio": "Advogada com experiência em direito migratório."
  }
}
```

`voluntario` só é obrigatório quando `perfil` é `voluntario`.

## Voluntários

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/voluntarios?q=&area=&idioma=&disponivel=semana` | Busca. Só aparece quem está ativo e tem serviço ativo |
| GET | `/voluntarios/:id` | Perfil com serviços ativos e horários livres futuros |
| POST | `/voluntarios` | Cria conta de voluntário (mesmo corpo de `/usuarios`, sem `perfil`) |
| PUT | `/voluntarios/:id` | Edita area_id, registro_profissional, idiomas, bio, ativo |
| DELETE | `/voluntarios/:id` | Exclui a conta inteira |

`q` procura no nome, na bio e no título e descrição dos serviços.

## Serviços

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/servicos?voluntario_id=` | Lista |
| GET | `/servicos/:id` | Um serviço |
| POST | `/servicos` | Cria `{ voluntario_id, titulo, descricao, duracao_min }` (duração padrão 45) |
| PUT | `/servicos/:id` | Edita titulo, descricao, duracao_min, ativo |
| DELETE | `/servicos/:id` | Exclui. Se já tiver agendamento, só desativa e responde `200` com o serviço |

## Horários

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/horarios?voluntario_id=&status=&de=&ate=` | Agenda. Horário reservado vem com o `agendamento` |
| GET | `/horarios/:id` | Um horário |
| POST | `/horarios` | Cria `{ voluntario_id, data, hora_inicio, hora_fim }` |
| PUT | `/horarios/:id` | Edita um horário livre |
| DELETE | `/horarios/:id?confirmar=true` | Exclui |

Regras:

- Data `AAAA-MM-DD` e hora `HH:MM`, no horário de Brasília
- `hora_fim` maior que `hora_inicio`, nada no passado e sem sobrepor outro horário do mesmo voluntário
- Excluir um horário reservado responde `409` com `{ "precisaConfirmar": true }`. Reenviando com `?confirmar=true`, o horário e o agendamento dele são excluídos

## Agendamentos

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/agendamentos?usuario_id=&voluntario_id=&status=` | Lista |
| GET | `/agendamentos/:id` | Um agendamento |
| POST | `/agendamentos` | Cria `{ usuario_id, horario_id, servico_id, descricao }` |
| PUT | `/agendamentos/:id` | Remarca (`horario_id`), marca `status: "realizado"` ou edita `descricao` |
| DELETE | `/agendamentos/:id` | Cancela: status vira `cancelado` e o horário volta a ficar livre |

Regras:

- Só perfil `usuario` cria agendamento
- O horário precisa estar livre e no futuro. Se já foi reservado: `409 "Este horário acabou de ser reservado. Escolha outro."`
- O serviço precisa ser do mesmo voluntário do horário
- No máximo 3 agendamentos `confirmado` por usuário
- Descrição com pelo menos 20 caracteres
- Remarcar só para outro horário livre do mesmo voluntário
- `realizado` só depois que o horário terminou
- Só agendamento `confirmado` pode ser alterado ou cancelado

Resposta de `POST /agendamentos`:

```json
{
  "id": 9,
  "status": "confirmado",
  "descricao": "Meu protocolo de refúgio vence mês que vem e não sei como renovar.",
  "criado_em": "2026-10-17 23:29:10",
  "horario": { "id": 21, "data": "2026-10-19", "hora_inicio": "19:00", "hora_fim": "19:45" },
  "voluntario": { "id": 2, "nome": "Mariana Costa" },
  "servico": { "id": 3, "titulo": "Visto e residência" },
  "usuario": { "id": 1, "nome": "Carlos Mendoza" }
}
```
