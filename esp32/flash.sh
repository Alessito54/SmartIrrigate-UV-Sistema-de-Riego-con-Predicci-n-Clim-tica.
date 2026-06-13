#!/usr/bin/env bash
# ============================================================
#  OASYS ESP32 — Compilar y Flashear
#  -----------------------------------------------------------
#  Uso:
#    ./flash.sh              → Compilar + flashear + monitor
#    ./flash.sh --compile    → Solo compilar (sin flash)
#    ./flash.sh --upload     → Solo flash (sin compilar)
#    ./flash.sh --monitor    → Solo abrir monitor serial
#    ./flash.sh --port /dev/ttyUSB0  → Especificar puerto
#    ./flash.sh --clean      → Limpiar build y recompilar
# ============================================================

set -e

# ── Colores ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── Directorio del script ────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Valores por defecto ──────────────────────────────────────
ACTION="all"        # all | compile | upload | monitor | clean
PORT=""             # Auto-detect si está vacío
ENVIRONMENT="esp32dev"

# ── Parsear argumentos ───────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case $1 in
        --compile|-c)
            ACTION="compile"
            shift
            ;;
        --upload|-u)
            ACTION="upload"
            shift
            ;;
        --monitor|-m)
            ACTION="monitor"
            shift
            ;;
        --clean)
            ACTION="clean"
            shift
            ;;
        --port|-p)
            PORT="$2"
            shift 2
            ;;
        --help|-h)
            echo -e "${CYAN}OASYS ESP32 — Compilar y Flashear${NC}"
            echo ""
            echo "Uso: ./flash.sh [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --compile, -c     Solo compilar"
            echo "  --upload, -u      Solo flashear"
            echo "  --monitor, -m     Solo monitor serial"
            echo "  --clean           Limpiar y recompilar"
            echo "  --port, -p PORT   Especificar puerto (ej: /dev/ttyUSB0)"
            echo "  --help, -h        Mostrar esta ayuda"
            exit 0
            ;;
        *)
            echo -e "${RED}Argumento desconocido: $1${NC}"
            echo "Usa --help para ver las opciones."
            exit 1
            ;;
    esac
done

# ── Verificar que PlatformIO está instalado ──────────────────
if ! command -v pio &> /dev/null; then
    echo -e "${RED}ERROR: PlatformIO CLI (pio) no está instalado.${NC}"
    echo -e "${YELLOW}Instálalo con:${NC}"
    echo "  pip install platformio"
    echo "  o"
    echo "  curl -fsSL -o get-platformio.py https://raw.githubusercontent.com/platformio/platformio-core-installer/master/get-platformio.py && python3 get-platformio.py"
    exit 1
fi

# ── Puerto serial ────────────────────────────────────────────
PORT_FLAG=""
if [[ -n "$PORT" ]]; then
    PORT_FLAG="--upload-port $PORT"
    echo -e "${CYAN}Puerto especificado: ${PORT}${NC}"
else
    # Auto-detectar
    DETECTED=$(ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null | head -1 || true)
    if [[ -n "$DETECTED" ]]; then
        PORT="$DETECTED"
        PORT_FLAG="--upload-port $PORT"
        echo -e "${CYAN}Puerto detectado: ${PORT}${NC}"
    else
        echo -e "${YELLOW}No se detectó puerto serial. PlatformIO intentará auto-detectar.${NC}"
    fi
fi

# ── Ir al directorio del proyecto ESP32 ──────────────────────
cd "$SCRIPT_DIR"
echo -e "${CYAN}Directorio de trabajo: $(pwd)${NC}"
echo ""

# ── Ejecutar acción ──────────────────────────────────────────
case $ACTION in
    compile)
        echo -e "${GREEN}═══ Compilando... ═══${NC}"
        pio run -e "$ENVIRONMENT"
        echo -e "${GREEN}✓ Compilación exitosa${NC}"
        ;;

    upload)
        echo -e "${GREEN}═══ Flasheando ESP32... ═══${NC}"
        pio run -e "$ENVIRONMENT" -t upload $PORT_FLAG
        echo -e "${GREEN}✓ Flash exitoso${NC}"
        ;;

    monitor)
        echo -e "${GREEN}═══ Monitor Serial ═══${NC}"
        echo -e "${YELLOW}Presiona Ctrl+C para salir${NC}"
        MONITOR_PORT=""
        if [[ -n "$PORT" ]]; then
            MONITOR_PORT="--port $PORT"
        fi
        pio device monitor --baud 115200 $MONITOR_PORT
        ;;

    clean)
        echo -e "${GREEN}═══ Limpiando build... ═══${NC}"
        pio run -e "$ENVIRONMENT" -t clean
        echo ""
        echo -e "${GREEN}═══ Recompilando... ═══${NC}"
        pio run -e "$ENVIRONMENT"
        echo ""
        echo -e "${GREEN}═══ Flasheando ESP32... ═══${NC}"
        pio run -e "$ENVIRONMENT" -t upload $PORT_FLAG
        echo -e "${GREEN}✓ Clean build + flash exitoso${NC}"
        echo ""
        echo -e "${GREEN}═══ Abriendo monitor serial... ═══${NC}"
        echo -e "${YELLOW}Presiona Ctrl+C para salir${NC}"
        MONITOR_PORT=""
        if [[ -n "$PORT" ]]; then
            MONITOR_PORT="--port $PORT"
        fi
        pio device monitor --baud 115200 $MONITOR_PORT
        ;;

    all)
        echo -e "${GREEN}═══ OASYS — Build + Flash + Monitor ═══${NC}"
        echo ""

        # Compilar
        echo -e "${CYAN}[1/3] Compilando...${NC}"
        pio run -e "$ENVIRONMENT"
        echo -e "${GREEN}✓ Compilación exitosa${NC}"
        echo ""

        # Flashear
        echo -e "${CYAN}[2/3] Flasheando ESP32...${NC}"
        pio run -e "$ENVIRONMENT" -t upload $PORT_FLAG
        echo -e "${GREEN}✓ Flash exitoso${NC}"
        echo ""

        # Monitor
        echo -e "${CYAN}[3/3] Abriendo monitor serial...${NC}"
        echo -e "${YELLOW}Presiona Ctrl+C para salir${NC}"
        echo ""
        MONITOR_PORT=""
        if [[ -n "$PORT" ]]; then
            MONITOR_PORT="--port $PORT"
        fi
        pio device monitor --baud 115200 $MONITOR_PORT
        ;;
esac
