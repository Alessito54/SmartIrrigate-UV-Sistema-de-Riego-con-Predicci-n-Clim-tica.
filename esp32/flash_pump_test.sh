#!/usr/bin/env bash
# ============================================================
#  OASYS ESP32 - Test Bomba/Relevador
#  ------------------------------------------------------------
#  Flashea un firmware simple que alterna GPIO 26:
#    5s bomba apagada, 3s bomba encendida.
#
#  Uso:
#    ./flash_pump_test.sh
#    ./flash_pump_test.sh --port /dev/ttyUSB0
#    ./flash_pump_test.sh --compile
#    ./flash_pump_test.sh --monitor
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION="all"
PORT=""
ENVIRONMENT="pump_test"

while [[ $# -gt 0 ]]; do
    case $1 in
        --compile|-c)
            ACTION="compile"
            shift
            ;;
        --monitor|-m)
            ACTION="monitor"
            shift
            ;;
        --port|-p)
            PORT="$2"
            shift 2
            ;;
        --help|-h)
            echo -e "${CYAN}OASYS - Test Bomba/Relevador${NC}"
            echo ""
            echo "Uso: ./flash_pump_test.sh [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --compile, -c     Solo compilar"
            echo "  --monitor, -m     Solo monitor serial"
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

if ! command -v pio &> /dev/null; then
    echo -e "${RED}ERROR: PlatformIO CLI (pio) no está instalado.${NC}"
    exit 1
fi

PORT_FLAG=""
MONITOR_PORT=""
if [[ -n "$PORT" ]]; then
    PORT_FLAG="--upload-port $PORT"
    MONITOR_PORT="--port $PORT"
    echo -e "${CYAN}Puerto especificado: ${PORT}${NC}"
else
    DETECTED=$(ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null | head -1 || true)
    if [[ -n "$DETECTED" ]]; then
        PORT="$DETECTED"
        PORT_FLAG="--upload-port $PORT"
        MONITOR_PORT="--port $PORT"
        echo -e "${CYAN}Puerto detectado: ${PORT}${NC}"
    else
        echo -e "${YELLOW}No se detectó puerto serial. PlatformIO intentará auto-detectar.${NC}"
    fi
fi

cd "$SCRIPT_DIR"
echo -e "${CYAN}Directorio de trabajo: $(pwd)${NC}"
echo ""

case $ACTION in
    compile)
        echo -e "${GREEN}═══ Compilando test de bomba... ═══${NC}"
        pio run -e "$ENVIRONMENT"
        echo -e "${GREEN}✓ Compilación exitosa${NC}"
        ;;
    monitor)
        echo -e "${GREEN}═══ Monitor Serial ═══${NC}"
        echo -e "${YELLOW}Presiona Ctrl+C para salir${NC}"
        pio device monitor --baud 115200 $MONITOR_PORT
        ;;
    all)
        echo -e "${GREEN}═══ OASYS - Flash Test Bomba/Relevador ═══${NC}"
        echo -e "${YELLOW}Este firmware reemplaza temporalmente el firmware principal.${NC}"
        echo ""
        echo -e "${CYAN}[1/3] Compilando...${NC}"
        pio run -e "$ENVIRONMENT"
        echo ""
        echo -e "${CYAN}[2/3] Flasheando...${NC}"
        pio run -e "$ENVIRONMENT" -t upload $PORT_FLAG
        echo ""
        echo -e "${CYAN}[3/3] Abriendo monitor...${NC}"
        echo -e "${YELLOW}Presiona Ctrl+C para salir${NC}"
        pio device monitor --baud 115200 $MONITOR_PORT
        ;;
esac
