import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

export default function Cultivos() {
  const API_KEY = import.meta.env.VITE_CULTIVOS_API_KEY;
  const { sectionPath } = useAuth();
  const [cultivos, setCultivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);

  const [search, setSearch] = useState("");

  // Sensores en tiempo real
  const [sensores, setSensores] = useState(null);

  useEffect(() => {
    if (!sectionPath) return;
    const unsub = onValue(ref(db, `${sectionPath}/sensores`), (s) => setSensores(s.val()));
    return () => unsub();
  }, [sectionPath]);

  // === CARGAR VARIAS PÁGINAS PARA OBTENER FRUTAS/VERDURAS ===
  useEffect(() => {
    async function cargar() {
      try {
        const pages = [1, 2, 3];

        const requests = pages.map((p) =>
          fetch(`https://perenual.com/api/species-list?key=${API_KEY}&page=${p}`)
        );

        const responses = await Promise.all(requests);
        let data = [];

        for (const r of responses) {
          const json = await r.json();
          data.push(...json.data);
        }

        // ==== FILTRAR ÁRBOLES Y CONÍFERAS ====
        const filtrado = data.filter((p) => {
          const name = (p.common_name || "").toLowerCase();
          const sci = (p.scientific_name || "").toLowerCase();
          const fam = (p.family || "").toLowerCase();
          const type = (p.type || "").toLowerCase();

          if (type.includes("tree")) return false;
          if (fam.includes("pinaceae")) return false;
          if (sci.includes("abies")) return false;
          if (sci.includes("pinus")) return false;
          if (sci.includes("cedrus")) return false;
          if (name.includes("pine")) return false;
          if (name.includes("fir")) return false;
          if (name.includes("spruce")) return false;

          return true;
        });

        setCultivos(filtrado);
      } catch (e) {
        console.log("Error:", e);
      }

      setLoading(false);
    }

    cargar();
  }, []);

  // === CARGAR DETALLES ===
  async function cargarDetalles(id) {
    setSelected(id);
    setDetails(null);

    try {
      const resp = await fetch(
        `https://perenual.com/api/species/details/${id}?key=${API_KEY}`
      );
      const json = await resp.json();
      setDetails(json);
    } catch (e) {
      console.log(e);
    }
  }

  // === BUSQUEDA POR NOMBRE ===
  const listaFiltrada =
    search.trim() === ""
      ? cultivos
      : cultivos.filter((c) =>
        (c.common_name || "").toLowerCase().includes(search.toLowerCase())
      );

  // === CALCULAR FACTIBILIDAD ===
  function factibilidad(details) {
    if (!sensores) return null;

    let puntos = 0;
    let total = 3;

    // Temperatura ideal
    if (details.hardiness && sensores.temperatura) {
      const temp = sensores.temperatura;
      const zone = details.hardiness.min || 10;

      if (temp >= zone - 5 && temp <= zone + 10) puntos++;
    }

    // Luz
    if (details.sunlight && sensores.radiacion) {
      if (details.sunlight.includes("full sun") && sensores.radiacion > 500)
        puntos++;
      if (details.sunlight.includes("part shade") && sensores.radiacion < 700)
        puntos++;
    }

    // Humedad
    if (details.watering && sensores.humedad) {
      if (details.watering.includes("Average") && sensores.humedad >= 40)
        puntos++;
      if (details.watering.includes("Frequent") && sensores.humedad >= 60)
        puntos++;
    }

    return Math.round((puntos / total) * 100);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fadeUp">
      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
        Catálogo de Cultivos
      </h1>

      {/* BUSQUEDA */}
      <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border rounded-2xl shadow-xl p-4 flex items-center gap-4">
        <svg
          className="w-6 h-6 text-gray-500 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <input
          type="text"
          placeholder="Buscar cultivo por nombre..."
          className="flex-1 px-3 py-2 bg-transparent outline-none text-gray-800 dark:text-gray-100 text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <p className="text-gray-500 dark:text-gray-300">Cargando cultivos...</p>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {listaFiltrada.map((p) => (
            <div
              key={p.id}
              onClick={() => cargarDetalles(p.id)}
              className="
                bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl 
                border rounded-3xl shadow-xl cursor-pointer
                transition hover:-translate-y-1 hover:shadow-2xl
                overflow-hidden
              "
            >
              <div className="flex h-44">
                <div className="flex-1 flex items-center justify-center p-4">
                  <h2 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-200">
                    {p.common_name || "Sin nombre"}
                  </h2>
                </div>

                <div className="flex-1">
                  <img
                    src={
                      p.default_image?.thumbnail ||
                      p.default_image?.original_url ||
                      "https://via.placeholder.com/150"
                    }
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {selected && details && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl w-[90%] max-w-lg shadow-2xl border animate-pop">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {details.common_name}
            </h2>

            <img
              src={
                details.default_image?.regular ||
                details.default_image?.medium ||
                details.default_image?.small
              }
              className="w-full h-56 object-cover rounded-2xl mb-5 shadow-lg"
            />

            <div className="space-y-3 text-gray-700 dark:text-gray-300 text-lg">
              {details.scientific_name && (
                <p><b>Nombre científico:</b> {details.scientific_name}</p>
              )}

              {details.family && (
                <p><b>Familia:</b> {details.family}</p>
              )}

              {details.watering && details.watering !== "N/A" && (
                <p><b>Riego recomendado:</b> {details.watering}</p>
              )}

              {details.sunlight && details.sunlight.length > 0 && (
                <p><b>Luz ideal:</b> {details.sunlight.join(", ")}</p>
              )}

              {/* FACTIBILIDAD */}
              {factibilidad(details) !== null && (
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 pt-4">
                  Factibilidad: {factibilidad(details)}%
                </p>
              )}
            </div>

            <button
              className="
                mt-6 w-full bg-green-600 hover:bg-green-500 text-white 
                py-3 rounded-xl font-semibold active:scale-95 transition
              "
              onClick={() => {
                setSelected(null);
                setDetails(null);
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
