export function generarPrediccionIA(clima, sensores, riego, malla) {
  return new Promise((resolve) => {
    try {
      const { humedad, lluvia_prob } = clima;
      const { temperatura, humedad: hum_suelo, radiacion } = sensores;

      let texto = "Predicción del estado del invernadero:\n\n";

      // Temperatura
      if (temperatura > 32) {
        texto += "- La temperatura interna es alta, podría requerirse ventilación.\n";
      } else if (temperatura < 15) {
        texto += "- La temperatura está baja, el crecimiento podría ralentizarse.\n";
      } else {
        texto += "- La temperatura es adecuada para la mayoría de cultivos.\n";
      }

      // Humedad del aire
      if (humedad > 80) {
        texto += "- Humedad ambiental elevada, posible sensación de encierro.\n";
      } else if (humedad < 40) {
        texto += "- Humedad baja, puede aumentar la evaporación.\n";
      }

      // Probabilidad de lluvia
      if (lluvia_prob > 60) {
        texto += `- Alta probabilidad de lluvia (${lluvia_prob}%).\n`;
      }

      // Humedad del suelo
      if (hum_suelo < 30) {
        texto += "- El suelo está seco, sería recomendable revisar el riego.\n";
      } else if (hum_suelo > 70) {
        texto += "- El suelo tiene buena humedad.\n";
      }

      // Radiación solar
      if (radiacion > 700) {
        texto += "- Radiación alta, la malla sombra podría ser necesaria.\n";
      }

      // Estado actual de actuadores
      texto += `\nEstado actual:\n- Riego: ${riego ? "Activado" : "Desactivado"}\n`;
      texto += `- Malla sombra: ${malla ? "Abierta" : "Cerrada"}\n`;

      resolve(texto.trim());
    } catch {
      resolve("No se pudo generar la predicción.");
    }
  });
}
