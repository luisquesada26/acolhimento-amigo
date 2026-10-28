# API

Base: `http://localhost:3000/api`. Tudo em JSON.

Erros sempre vêm assim:

```json
{ "erro": "Mensagem em português", "detalhes": [] }
```

Em erro de validação, `detalhes` traz `{ "campo", "mensagem" }` de cada campo.

## Quem pode o quê

As rotas privadas pedem o header `Authorization: Bearer <token>`. O token sai do login e vale 7 dias.

A API descobre quem é a pessoa pelo token. Por isso ninguém manda `usuario_id` ou `voluntario_id` no corpo, e cada um só vê e altera o que é seu.

| Resposta | Quando |
| --- | --- |
| `401` | Sem token ou token inválido |
| `403` | Perfil errado (ex.: usuário criando serviço) ou tentando mexer no que é de outra pessoa |

## Login e meu perfil

| Método | Rota | Quem | Descrição |
| --- | --- | --- | --- |
| POST | `/auth/cadastro` | público | Cria a conta e já devolve `{ token, usuario }` |
| POST | `/auth/login` | público | Recebe `{ email, senha }` e devolve `{ token, usuario }` |
| GET | `/me` | os dois | Meus dados. O voluntário recebe junto `voluntario` com os dados profissionais |
| PUT | `/me` | os dois | Edita meus dados, inclusive a senha. O voluntário pode mandar `voluntario` com area_id, registro_profissional, idiomas, bio e ativo |
| DELETE | `/me` | os dois | Exclui a minha conta e libera os horários que eu tinha reservado |

A senha é salva com bcrypt na coluna `senha_hash` e nunca volta nas respostas. E-mail ou senha errados dão sempre a mesma mensagem: `401 "E-mail ou senha incorretos"`.

Cadastro de voluntário:

```json
{
  "nome": "Mariana Costa",
  "email": "mariana@email.com",
  "senha": "senha123",
  "telefone": "11999990000",
  "perfil": "voluntario",
  "idiomas": ["pt"],
  "aceite_lgpd": true,
  "voluntario": {
    "area_id": 1
  }
}
```

`voluntario` só é obrigatório quando `perfil` é `voluntario`, e no cadastro basta a `area_id`. Registro profissional, idiomas e bio o voluntário completa depois pelo `PUT /me`. Sem `"aceite_lgpd": true` o cadastro não passa.

Os idiomas aceitos são `pt`, `en`, `es` e `fr`, tanto nos `idiomas` do voluntário quanto nos `idiomas` do usuário, que é uma lista com pelo menos um (no cadastro, sem a lista, fica `["pt"]`). Qualquer outro responde `400`.

## Minhas coisas

Cada pessoa só recebe o que é dela.

| Método | Rota | Quem | Descrição |
| --- | --- | --- | --- |
| GET | `/meus-servicos` | voluntário | Meus serviços, ativos ou não |
| GET | `/meus-horarios?status=&de=&ate=` | voluntário | Minha agenda. Horário reservado vem com o `agendamento` (usuário, serviço e descrição do caso) |
| GET | `/meus-agendamentos?status=` | os dois | Usuário: os que ele marcou. Voluntário: os da agenda dele. `status=confirmado` mostra os próximos e `status=realizado` o histórico |

## Áreas

| Método | Rota | Quem | Descrição |
| --- | --- | --- | --- |
| GET | `/areas` | público | Lista as áreas |
| GET | `/areas/:id` | público | Uma área |
| POST | `/areas` | voluntário | Cria `{ nome }` |
| PUT | `/areas/:id` | voluntário | Edita `{ nome }` |
| DELETE | `/areas/:id` | voluntário | Exclui. `409` se tiver voluntários |

Ainda não existe perfil de administrador, então quem cuida das áreas são os voluntários.

## Busca de voluntários

| Método | Rota | Quem | Descrição |
| --- | --- | --- | --- |
| GET | `/voluntarios?q=&area=&idioma=&disponivel=semana` | público | Busca. Só aparece quem está ativo e tem serviço ativo |
| GET | `/voluntarios/:id` | público | Perfil com serviços ativos e horários livres futuros |

`q` procura no nome, na bio e no título e descrição dos serviços. O voluntário edita os próprios dados pelo `PUT /me`.

## Serviços

| Método | Rota | Quem | Descrição |
| --- | --- | --- | --- |
| GET | `/servicos?voluntario_id=` | público | Serviços ativos |
| GET | `/servicos/:id` | público | Um serviço |
| POST | `/servicos` | voluntário | Cria `{ titulo, descricao, duracao_min }` (duração padrão 45) |
| PUT | `/servicos/:id` | voluntário dono | Edita titulo, descricao, duracao_min, ativo |
| DELETE | `/servicos/:id` | voluntário dono | Exclui. Se já tiver agendamento, só desativa e responde `200` com o serviço |

## Horários

| Método | Rota | Quem | Descrição |
| --- | --- | --- | --- |
| POST | `/horarios` | voluntário | Cria `{ data, hora_inicio, hora_fim }` |
| PUT | `/horarios/:id` | voluntário dono | Edita um horário livre |
| DELETE | `/horarios/:id?confirmar=true` | voluntário dono | Exclui |

A agenda é lida em `GET /meus-horarios`. Regras:

- Data `AAAA-MM-DD` e hora `HH:MM`, no horário de Brasília
- `hora_fim` maior que `hora_inicio`, nada no passado e sem sobrepor outro horário do mesmo voluntário
- Excluir um horário reservado responde `409` com `{ "precisaConfirmar": true }`. Reenviando com `?confirmar=true`, o horário e o agendamento dele são excluídos

## Agendamentos

| Método | Rota | Quem | Descrição |
| --- | --- | --- | --- |
| POST | `/agendamentos` | usuário | Marca `{ horario_id, servico_id, descricao }` |
| GET | `/agendamentos/:id` | quem marcou e o voluntário do horário | Um agendamento |
| PUT | `/agendamentos/:id` | ver abaixo | Remarca, marca como realizado ou edita a descrição |
| DELETE | `/agendamentos/:id` | quem marcou e o voluntário do horário | Cancela: status vira `cancelado` e o horário volta a ficar livre |

A lista de cada um fica em `GET /meus-agendamentos`. Regras:

- Só perfil `usuario` marca atendimento
- O horário precisa estar livre e no futuro. Se já foi reservado: `409 "Este horário acabou de ser reservado. Escolha outro."`
- O serviço precisa ser do mesmo voluntário do horário
- Descrição com pelo menos 20 caracteres
- Só quem marcou remarca (`horario_id`) ou edita a `descricao`, e só para outro horário livre do mesmo voluntário
- Só o voluntário marca `"status": "realizado"` (ao concluir o atendimento, a qualquer momento)
- Só agendamento `confirmado` pode ser alterado ou cancelado
- A descrição do caso e o contato da pessoa (e-mail, telefone e foto) só aparecem para quem marcou e para o voluntário daquele horário
- O voluntário escreve a `anotacao` (o que foi feito, o que recomendou e o próximo passo, até 1000 caracteres). Pode mandar junto com `"status": "realizado"` ao concluir, ou depois, com o atendimento já realizado. Quem marcou lê a anotação, mas não altera

Resposta de `POST /agendamentos`:

```json
{
  "id": 11,
  "status": "confirmado",
  "descricao": "Preciso entender como renovar meu protocolo de refúgio.",
  "criado_em": "2026-10-18 16:20:00",
  "horario": { "id": 2, "data": "2026-10-19", "hora_inicio": "10:00", "hora_fim": "10:45" },
  "voluntario": { "id": 1, "nome": "Rafael Almeida" },
  "servico": { "id": 2, "titulo": "Protocolo de refúgio" },
  "usuario": { "id": 1, "nome": "Luis Quesada", "email": "usuario@teste.com", "telefone": "11987654321", "pais_origem": "Venezuela", "idiomas": ["es", "pt"] }
}
```
