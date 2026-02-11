/* eslint-disable no-undef */
const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const app = express();
app.use(express.json());
app.use(cors());

// Ruta IA local
app.post("/ia", (req, res) => {
  const prompt = req.body.prompt;

  exec(`ollama run llama3 "${prompt}"`, (error, stdout) => {
    if (error) {
      return res.json({ error: error.message });
    }
    res.json({ result: stdout });
  });
});

// IMPORTANTE: escuchar en 0.0.0.0 para permitir celulares
app.listen(3001, "0.0.0.0", () => {
  console.log("Servidor IA local corriendo en http://192.168.100.5:3001");
});
