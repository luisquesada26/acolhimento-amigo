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
