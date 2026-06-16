# Alexa + OASYS

Endpoint de Netlify Function:

```txt
https://TU-SITIO.netlify.app/.netlify/functions/alexa-oasys?token=TU_TOKEN
```

La función busca por nombre en Firebase y cambia:

```txt
invernaderos/{invId}/secciones/{secId}/control/riego
```

## Variables en Netlify

Configura estas variables en **Site configuration > Environment variables**:

```txt
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
FIREBASE_DATABASE_URL
ALEXA_CONTROL_TOKEN
```

Opcional, para limitar la búsqueda a los invernaderos de un usuario:

```txt
ALEXA_USER_ID
```

Opcional, si quieres permitir comandos sin decir nombres:

```txt
ALEXA_DEFAULT_INVERNADERO
ALEXA_DEFAULT_SECCION
```

`FIREBASE_PRIVATE_KEY` debe conservar los saltos como `\n` si la copias en una sola línea.

## Frases

Español:

```txt
Alexa, dile a OASYS que inicie riego en Orizaba en la sección Zanahorias.
Alexa, dile a OASYS que apague riego en Orizaba en la sección Zanahorias.
Alexa, dile a OASYS que prenda el riego en Orizaba en la sección Zanahorias.
```

Inglés:

```txt
Alexa, ask OASYS to start irrigation in Orizaba in section Carrots.
Alexa, ask OASYS to stop irrigation in Orizaba in section Carrots.
Alexa, ask OASYS to turn on irrigation in Orizaba in section Carrots.
```

## Prueba sin Alexa

```bash
curl -X POST "https://TU-SITIO.netlify.app/.netlify/functions/alexa-oasys?token=TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"inicie riego en Orizaba en la sección Zanahorias"}'
```

Apagar:

```bash
curl -X POST "https://TU-SITIO.netlify.app/.netlify/functions/alexa-oasys?token=TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"apaga riego en Orizaba en la sección Zanahorias"}'
```

También puedes mandar IDs directos:

```bash
curl -X POST "https://TU-SITIO.netlify.app/.netlify/functions/alexa-oasys?token=TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"start","invId":"-OmWileJriId0_USm0J9","secId":"-OmWileJriId0_USm0JA"}'
```

## Intents

Puedes usar los modelos listos:

```txt
docs/alexa-model-es-MX.json
docs/alexa-model-en-US.json
```

O crear manualmente dos intents:

- `StartIrrigationIntent`
- `StopIrrigationIntent`

Slots:

- `greenhouseName`: `AMAZON.SearchQuery`
- `sectionName`: `AMAZON.SearchQuery`

Sample utterances en español:

```txt
StartIrrigationIntent inicie riego en {greenhouseName} en la sección {sectionName}
StartIrrigationIntent prende el riego en {greenhouseName} en la sección {sectionName}
StartIrrigationIntent inicia el riego en {greenhouseName} sección {sectionName}
StopIrrigationIntent apague riego en {greenhouseName} en la sección {sectionName}
StopIrrigationIntent apaga el riego en {greenhouseName} en la sección {sectionName}
StopIrrigationIntent detén el riego en {greenhouseName} sección {sectionName}
```

Sample utterances en inglés:

```txt
StartIrrigationIntent start irrigation in {greenhouseName} in section {sectionName}
StartIrrigationIntent turn on irrigation in {greenhouseName} in section {sectionName}
StartIrrigationIntent begin irrigation in {greenhouseName} section {sectionName}
StopIrrigationIntent stop irrigation in {greenhouseName} in section {sectionName}
StopIrrigationIntent turn off irrigation in {greenhouseName} in section {sectionName}
StopIrrigationIntent end irrigation in {greenhouseName} section {sectionName}
```
