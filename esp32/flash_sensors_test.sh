#!/usr/bin/env bash
# ============================================================
#  OASYS ESP32 - Test Sensores SHT31/SHT10
#  ------------------------------------------------------------
#  Flashea un firmware simple que lee:
#    - SHT31 ambiente: SDA GPIO 21, SCL GPIO 22
#    - SHT10 suelo: DATA GPIO 18, CLK GPIO 19
#
#  Uso:
#    ./flash_sensors_test.sh
#    ./flash_sensors_test.sh --port /dev/ttyUSB0
#    ./flash_sensors_test.sh --compile
#    ./flash_sensors_test.sh --monitor
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
ENVIRONMENT="sensors_test"

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
            echo -e "${CYAN}OASYS - Test Sensores SHT31/SHT10${NC}"
            echo ""
            echo "Uso: ./flash_sensors_test.sh [opciones]"
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

detect_port() {
    local candidate=""
    candidate=$(find /dev/serial/by-id -maxdepth 1 -type l 2>/dev/null | head -1 || true)
    if [[ -n "$candidate" ]]; then
        readlink -f "$candidate"
        return 0
    fi

    candidate=$(find /dev -maxdepth 1 \( -name 'ttyUSB*' -o -name 'ttyACM*' \) 2>/dev/null | sort | head -1 || true)
    if [[ -n "$candidate" ]]; then
        echo "$candidate"
        return 0
    fi

    return 1
}

require_port() {
    if [[ -n "$PORT" ]]; then
        return 0
    fi

    echo -e "${RED}ERROR: No se detectó el puerto USB del ESP32.${NC}"
    echo -e "${YELLOW}Conecta el ESP32 con cable de datos y cierra cualquier monitor serial/Web Serial.${NC}"
    echo "Revisa el puerto con:"
    echo "  find /dev -maxdepth 1 \\( -name 'ttyUSB*' -o -name 'ttyACM*' \\)"
    echo ""
    echo "Luego ejecuta, por ejemplo:"
    echo "  ./flash_sensors_test.sh --port /dev/ttyUSB0"
    exit 1
}

PORT_FLAG=""
MONITOR_PORT=""
if [[ -n "$PORT" ]]; then
    PORT_FLAG="--upload-port $PORT"
    MONITOR_PORT="--port $PORT"
    echo -e "${CYAN}Puerto especificado: ${PORT}${NC}"
else
    DETECTED=$(detect_port || true)
    if [[ -n "$DETECTED" ]]; then
        PORT="$DETECTED"
        PORT_FLAG="--upload-port $PORT"
        MONITOR_PORT="--port $PORT"
        echo -e "${CYAN}Puerto detectado: ${PORT}${NC}"
    else
        echo -e "${YELLOW}No se detectó puerto USB serial ESP32.${NC}"
    fi
fi

cd "$SCRIPT_DIR"
echo -e "${CYAN}Directorio de trabajo: $(pwd)${NC}"
echo ""

case $ACTION in
    compile)
        echo -e "${GREEN}═══ Compilando test de sensores... ═══${NC}"
        pio run -e "$ENVIRONMENT"
        echo -e "${GREEN}✓ Compilación exitosa${NC}"
        ;;
    monitor)
        require_port
        echo -e "${GREEN}═══ Monitor Serial Sensores ═══${NC}"
        echo -e "${YELLOW}Presiona Ctrl+C para salir${NC}"
        pio device monitor --baud 115200 $MONITOR_PORT
        ;;
    all)
        require_port
        echo -e "${GREEN}═══ OASYS - Flash Test Sensores ═══${NC}"
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
