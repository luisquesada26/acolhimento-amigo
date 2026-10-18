const express = require("express");
const cors = require("./middlewares/cors");
const rotas = require("./routes");
const { rotaNaoEncontrada, tratarErros } = require("./middlewares/erros");

const app = express();

app.use(cors);
app.use(express.json());

app.use("/api", rotas);

app.use(rotaNaoEncontrada);
app.use(tratarErros);

module.exports = app;
