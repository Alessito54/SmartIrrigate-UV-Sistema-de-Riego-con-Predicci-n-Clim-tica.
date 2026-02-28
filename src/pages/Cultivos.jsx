import { useState, useEffect } from "react";
import { ref, onValue, set, push, remove, get } from "firebase/database";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { FiPlus, FiTrash2, FiCheckCircle, FiBook, FiSettings } from "react-icons/fi";
import { PiPlantLight } from "react-icons/pi";

const DIASEMANA = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

export default function Cultivos() {
  const API_KEY = import.meta.env.VITE_CULTIVOS_API_KEY;
  const { sectionPath, invPath, invId, secId } = useAuth();

  const [tab, setTab] = useState("catalogo");

  // ─── Catalog state ───────────────────────────────────────────────
  const [cultivos, setCultivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [search, setSearch] = useState("");
  const [sensores, setSensores] = useState(null);

  // ─── Config state ────────────────────────────────────────────────
  const [cultivoActual, setCultivoActual] = useState("");
  const [searchConfig, setSearchConfig] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [riegos, setRiegos] = useState({}); // { dia: [{hora, duracion_seg}] }
  const [newRiego, setNewRiego] = useState({ dia: "lunes", hora: "08:00", duracion: 30 });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState("");

  // ─── Load sensors ─────────────────────────────────────────────────
  useEffect(() => {
    if (!sectionPath) return;
    const unsub = onValue(ref(db, `${sectionPath}/sensores`), (s) => setSensores(s.val()));
    return () => unsub();
  }, [sectionPath]);

  // ─── Load section config (crop + scheduled irrigations) ──────────
  useEffect(() => {
    if (!sectionPath) return;
    const unsub = onValue(ref(db, `${sectionPath}/cultivoActual`), (s) => {
      if (s.exists()) setCultivoActual(s.val());
    });
    const unsub2 = onValue(ref(db, `${invPath}/riegosProgramados/${secId}`), (s) => {
      setRiegos(s.val() || {});
    });
    return () => { unsub(); unsub2(); };
  }, [sectionPath, invPath, secId]);

  // ─── Load catalog pages ───────────────────────────────────────────
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
          data.push(...(json.data || []));
        }
        const filtrado = data.filter((p) => {
          const type = (p.type || "").toLowerCase();
          const sci = (p.scientific_name?.[0] || "").toLowerCase();
          if (type.includes("tree")) return false;
          if (sci.includes("pinus") || sci.includes("abies") || sci.includes("cedrus")) return false;
          return true;
        });
        setCultivos(filtrado);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    cargar();
  }, []);

  async function cargarDetalles(id) {
    setSelected(id);
    setDetails(null);
    try {
      const resp = await fetch(`https://perenual.com/api/species/details/${id}?key=${API_KEY}`);
      const json = await resp.json();
      setDetails(json);
    } catch (e) { console.error(e); }
  }

  function factibilidad(details) {
    if (!sensores) return null;
    let puntos = 0, total = 3;
    if (details.hardiness && sensores.temperatura) {
      const temp = sensores.temperatura;
      const zone = details.hardiness.min || 10;
      if (temp >= zone - 5 && temp <= zone + 10) puntos++;
    }
    if (details.sunlight && sensores.radiacion) {
      if (details.sunlight.includes("full sun") && sensores.radiacion > 500) puntos++;
      if (details.sunlight.includes("part shade") && sensores.radiacion < 700) puntos++;
    }
    if (details.watering && sensores.humedad) {
      if (details.watering.includes("Average") && sensores.humedad >= 40) puntos++;
      if (details.watering.includes("Frequent") && sensores.humedad >= 60) puntos++;
    }
    return Math.round((puntos / total) * 100);
  }

  // ─── Config handlers ──────────────────────────────────────────────
  async function guardarCultivoActual(nombre) {
    if (!sectionPath) return;
    await set(ref(db, `${sectionPath}/cultivoActual`), nombre);
    setCultivoActual(nombre);
    setShowDropdown(false);
    flashConfig(`Cultivo actualizado a "${nombre}"`);
  }

  async function agregarRiego() {
    if (!invPath || !secId) return;
    setSavingConfig(true);
    try {
      const riegoRef = push(ref(db, `${invPath}/riegosProgramados/${secId}/${newRiego.dia}`));
      await set(riegoRef, { hora: newRiego.hora, duracion_seg: Number(newRiego.duracion) });
      flashConfig("Riego programado agregado");
    } finally { setSavingConfig(false); }
  }

  async function eliminarRiego(dia, key) {
    await remove(ref(db, `${invPath}/riegosProgramados/${secId}/${dia}/${key}`));
    flashConfig("Riego eliminado");
  }

  function flashConfig(msg) {
    setConfigSuccess(msg);
    setTimeout(() => setConfigSuccess(""), 3000);
  }

  const listaFiltrada = search.trim() === ""
    ? cultivos
    : cultivos.filter((c) => (c.common_name || "").toLowerCase().includes(search.toLowerCase()));

  const dropdownFiltrado = searchConfig.trim() === ""
    ? cultivos.slice(0, 30)
    : cultivos.filter((c) => (c.common_name || "").toLowerCase().includes(searchConfig.toLowerCase())).slice(0, 20);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeUp">
      {/* Header */}
      <header>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight flex items-center gap-3">
          <PiPlantLight size={36} className="text-emerald-500" />
          Cultivos
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Explora el catálogo y configura los cultivos de tu sección activa.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700">
        {[
          { key: "catalogo", label: "Catálogo", icon: FiBook },
          { key: "config", label: "Mi Configuración", icon: FiSettings },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition -mb-px ${tab === key ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: CATÁLOGO ═══ */}
      {tab === "catalogo" && (
        <div className="space-y-6">
          <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border rounded-2xl shadow-xl p-4 flex items-center gap-4">
            <svg className="w-6 h-6 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar cultivo por nombre..."
              className="flex-1 px-3 py-2 bg-transparent outline-none text-gray-800 dark:text-gray-100 text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading && <p className="text-gray-500 dark:text-gray-300">Cargando cultivos...</p>}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listaFiltrada.map((p) => (
                <div
                  key={p.id}
                  onClick={() => cargarDetalles(p.id)}
                  className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border rounded-3xl shadow-xl cursor-pointer transition hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
                >
                  <div className="flex h-44">
                    <div className="flex-1 flex items-center justify-center p-4">
                      <h2 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-200">{p.common_name || "Sin nombre"}</h2>
                    </div>
                    <div className="flex-1">
                      <img
                        src={p.default_image?.thumbnail || p.default_image?.original_url || "https://placehold.co/150x150/e2e8f0/94a3b8?text=🌿"}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Plant detail modal */}
          {selected && details && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl w-[90%] max-w-lg shadow-2xl border animate-pop">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{details.common_name}</h2>
                <img
                  src={details.default_image?.regular || details.default_image?.medium || details.default_image?.small}
                  className="w-full h-56 object-cover rounded-2xl mb-5 shadow-lg"
                />
                <div className="space-y-3 text-gray-700 dark:text-gray-300 text-lg">
                  {details.scientific_name && <p><b>Nombre científico:</b> {details.scientific_name}</p>}
                  {details.family && <p><b>Familia:</b> {details.family}</p>}
                  {details.watering && details.watering !== "N/A" && <p><b>Riego recomendado:</b> {details.watering}</p>}
                  {details.sunlight?.length > 0 && <p><b>Luz ideal:</b> {details.sunlight.join(", ")}</p>}
                  {factibilidad(details) !== null && (
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 pt-4">Factibilidad: {factibilidad(details)}%</p>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold transition"
                    onClick={() => { guardarCultivoActual(details.common_name); setSelected(null); setDetails(null); setTab("config"); }}
                  >
                    Seleccionar para mi sección
                  </button>
                  <button className="px-5 py-3 rounded-xl font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition" onClick={() => { setSelected(null); setDetails(null); }}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: MI CONFIGURACIÓN ═══ */}
      {tab === "config" && (
        <div className="space-y-6">
          {!sectionPath && (
            <div className="glass rounded-2xl p-8 text-center text-gray-400">
              No tienes una sección activa seleccionada. Ve a Invernaderos para configurar.
            </div>
          )}

          {sectionPath && (
            <>
              {configSuccess && (
                <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 rounded-2xl text-emerald-700 dark:text-emerald-300 animate-fadeUp">
                  <FiCheckCircle className="text-xl flex-shrink-0" /> {configSuccess}
                </div>
              )}

              {/* Crop selector */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <h2 className="font-bold text-gray-900 dark:text-white text-xl flex items-center gap-2">
                  🌱 Cultivo Activo
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">¿Qué está cultivando en esta sección actualmente?</p>
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full flex items-center justify-between bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-left transition focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <span className={cultivoActual ? "font-semibold text-gray-800 dark:text-gray-100" : "text-gray-400"}>
                      {cultivoActual || "Buscar y seleccionar cultivo..."}
                    </span>
                    <span className="text-gray-400">▾</span>
                  </button>
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                      <div className="p-3 border-b border-gray-100 dark:border-slate-800">
                        <input
                          autoFocus
                          type="text"
                          value={searchConfig}
                          onChange={(e) => setSearchConfig(e.target.value)}
                          placeholder="Buscar cultivo..."
                          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 rounded-xl outline-none"
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {dropdownFiltrado.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => guardarCultivoActual(c.common_name)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition text-gray-700 dark:text-gray-300"
                          >
                            {c.common_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduled irrigations */}
              <div className="glass rounded-2xl p-6 space-y-5">
                <h2 className="font-bold text-gray-900 dark:text-white text-xl flex items-center gap-2">
                  <span>💧</span> Riegos Programados
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Define días, horarios y duración. El ESP32 ejecutará el riego automáticamente.</p>

                {/* New irrigation form */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Día</label>
                    <select
                      value={newRiego.dia}
                      onChange={(e) => setNewRiego({ ...newRiego, dia: e.target.value })}
                      className="bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                    >
                      {DIASEMANA.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Hora</label>
                    <input
                      type="time"
                      value={newRiego.hora}
                      onChange={(e) => setNewRiego({ ...newRiego, hora: e.target.value })}
                      className="bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Duración (seg)</label>
                    <input
                      type="number"
                      min={5}
                      max={3600}
                      value={newRiego.duracion}
                      onChange={(e) => setNewRiego({ ...newRiego, duracion: e.target.value })}
                      className="bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                    />
                  </div>
                  <button
                    onClick={agregarRiego}
                    disabled={savingConfig}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    <FiPlus /> Agregar
                  </button>
                </div>

                {/* Scheduled list */}
                <div className="space-y-3">
                  {Object.keys(riegos).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Sin riegos programados todavía.</p>
                  ) : (
                    Object.entries(riegos).map(([dia, entries]) => (
                      <div key={dia} className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{dia}</p>
                        {Object.entries(entries).map(([key, entry]) => (
                          <div key={key} className="flex items-center justify-between bg-white/30 dark:bg-slate-800/30 rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-4">
                              <span className="text-lg">⏰</span>
                              <div>
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{entry.hora}</p>
                                <p className="text-xs text-gray-400">{entry.duracion_seg} seg ({Math.round(entry.duracion_seg / 60 * 10) / 10} min)</p>
                              </div>
                            </div>
                            <button
                              onClick={() => eliminarRiego(dia, key)}
                              className="text-gray-400 hover:text-red-500 transition p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
