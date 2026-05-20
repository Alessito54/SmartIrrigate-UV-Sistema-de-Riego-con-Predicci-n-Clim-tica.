import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Habilita HTTPS con certificado autofirmado.
    // Necesario para Web Bluetooth API (requiere Secure Context).
    // Chrome mostrará una advertencia de certificado — click en "Avanzado > Continuar" la primera vez.
    basicSsl(),
  ],
  server: {
    https: true,
    host: true,     // Expone en toda la red local (0.0.0.0), accesible desde cualquier dispositivo
    port: 5173,
    cors: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none"
    }
  }
})
