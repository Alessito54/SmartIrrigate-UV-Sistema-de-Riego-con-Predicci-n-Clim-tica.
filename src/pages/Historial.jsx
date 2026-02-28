import { useEffect, useState } from "react";
import { ref, onValue, remove } from "firebase/database";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { FiDroplet, FiClock, FiTrash2, FiBarChart2, FiChevronDown } from "react-icons/fi";
import { LuClock } from "react-icons/lu";

// ─── Mini bar chart ───────────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: "width 0.6s ease" }} />
    </div>
  );
}

function fmtDuracion(seg) {
  if (seg >= 3600) return `${Math.floor(seg / 3600)}h ${Math.floor((seg % 3600) / 60)}min`;
  if (seg >= 60) return `${Math.floor(seg / 60)} min ${seg % 60}s`;
  return `${seg}s`;
}

function fmtFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function Historial() {
  const { invernaderos, invId, secId, selectInvernadero, selectSeccion } = useAuth();
  const sectionPath = invId && secId ? `invernaderos/${invId}/secciones/${secId}` : null;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);

  // ─── All invernaderos totals (aggregate) ─────────────────────────────
  const [globalStats, setGlobalStats] = useState({ riegos: 0, litros: 0, seg: 0 });

  useEffect(() => {
    let allItems = [];
    let pending = 0;
    const invEntries = Object.entries(invernaderos || {});
    if (invEntries.length === 0) { setGlobalStats({ riegos: 0, litros: 0, seg: 0 }); return; }

    const unsubs = [];
    invEntries.forEach(([iId, inv]) => {
      Object.keys(inv?.secciones || {}).forEach((sId) => {
        pending++;
        const unsub = onValue(ref(db, `invernaderos/${iId}/secciones/${sId}/historial_riego`), (snap) => {
          const val = snap.val() || {};
          const arr = Object.values(val);
          allItems = [...allItems.filter((x) => x._path !== `${iId}/${sId}`), ...arr.map((x) => ({ ...x, _path: `${iId}/${sId}` }))];
          pending--;
          if (pending <= 0) {
            setGlobalStats({
              riegos: allItems.length,
              litros: allItems.reduce((a, b) => a + (b.litros || 0), 0),
              seg: allItems.reduce((a, b) => a + (b.duracion_seg || 0), 0),
            });
          }
        });
        unsubs.push(unsub);
      });
    });
    return () => unsubs.forEach((u) => u());
  }, [invernaderos]);

  // ─── Current section items ────────────────────────────────────────────
  useEffect(() => {
    if (!sectionPath) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const unsub = onValue(ref(db, `${sectionPath}/historial_riego`), (snap) => {
      const val = snap.val() || {};
      const arr = Object.entries(val)
        .map(([key, v]) => ({ key, ...v }))
        .sort((a, b) => new Date(b.inicio) - new Date(a.inicio));
      setItems(arr);
      setLoading(false);
    });
    return () => unsub();
  }, [sectionPath]);

  // ─── Filter ───────────────────────────────────────────────────────────
  const ahora = new Date();
  const filtered = items.filter((i) => {
    const d = new Date(i.inicio);
    if (filter === "hoy") return d.toDateString() === ahora.toDateString();
    if (filter === "semana") return (ahora - d) < 7 * 24 * 60 * 60 * 1000;
    return true;
  });

  const totalLitros = filtered.reduce((a, b) => a + (b.litros || 0), 0);
  const totalSeg = filtered.reduce((a, b) => a + (b.duracion_seg || 0), 0);
  const maxLitros = Math.max(...filtered.map((i) => i.litros || 0), 1);

  async function limpiarHistorial() {
    if (!sectionPath) return;
    await remove(ref(db, `${sectionPath}/historial_riego`));
    setConfirmDelete(false);
  }

  // Flat list of all sections for picker
  const invEntries = Object.entries(invernaderos || {});
  const currentSecName = invId && secId ? invernaderos?.[invId]?.secciones?.[secId]?.nombre || secId : null;
  const currentInvName = invId ? invernaderos?.[invId]?.nombre || invId.slice(-8) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeUp">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight flex items-center gap-3">
            <LuClock size={32} className="text-emerald-500" />
            Historial de Riego
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registro de eventos de riego de tus invernaderos.</p>
        </div>
        {items.length > 0 && (
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 hover:bg-red-100 dark:hover:bg-red-900/40 transition">
            <FiTrash2 size={14} /> Limpiar sección
          </button>
        )}
      </header>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="glass rounded-2xl p-5 border border-red-200 dark:border-red-800/40 flex items-center justify-between gap-4 animate-fadeUp">
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">⚠️ ¿Borrar todo el historial de esta sección?</p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={limpiarHistorial} className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-500 transition">Sí, borrar</button>
            <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition">Cancelar</button>
          </div>
        </div>
      )}

      {/* ─── GLOBAL TOTALS (all invernaderos) ─── */}
      <div className="glass rounded-3xl p-6">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">📊 Total general — todos los invernaderos</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Riegos totales", value: globalStats.riegos, unit: "", icon: FiBarChart2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Litros totales", value: globalStats.litros.toFixed(1), unit: "L", icon: FiDroplet, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-900/20" },
            { label: "Tiempo total", value: fmtDuracion(globalStats.seg), unit: "", icon: FiClock, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
          ].map(({ label, value, unit, icon: Icon, color, bg }) => (
            <div key={label} className="flex flex-col gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`text-sm ${color}`} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className={`text-xl font-extrabold ${color}`}>{value}<span className="text-sm font-medium text-gray-400 ml-1">{unit}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECTION SELECTOR ─── */}
      <div className="relative">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ver historial de sección:</p>
        <button
          onClick={() => setShowSectionPicker(!showSectionPicker)}
          className="w-full flex items-center justify-between bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-left hover:border-emerald-400 transition"
        >
          {invId && secId ? (
            <div className="flex items-center gap-3">
              <span className="text-xl">{invernaderos?.[invId]?.secciones?.[secId]?.cultivoActual?.split(" ")[0] || "🌱"}</span>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{currentSecName}</p>
                <p className="text-xs text-gray-400">{currentInvName}</p>
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">Selecciona invernadero y sección...</span>
          )}
          <FiChevronDown className={`text-gray-400 transition ${showSectionPicker ? "rotate-180" : ""}`} />
        </button>

        {showSectionPicker && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            {invEntries.map(([iId, inv]) => {
              const secs = Object.entries(inv?.secciones || {});
              return (
                <div key={iId}>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${inv?.estado?.online ? "bg-emerald-400" : "bg-gray-400"}`} />
                    🏠 {inv?.nombre || iId.slice(-8)}
                  </div>
                  {secs.map(([sId, sec]) => (
                    <button
                      key={sId}
                      onClick={() => { selectInvernadero(iId); selectSeccion(sId); setShowSectionPicker(false); }}
                      className={`w-full text-left px-6 py-2.5 text-sm transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2 ${invId === iId && secId === sId ? "text-emerald-600 font-bold bg-emerald-50/50 dark:bg-emerald-900/10" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      <span>{sec?.cultivoActual?.split(" ")[0] || "🌱"}</span>
                      {sec?.nombre || sId}
                      {invId === iId && secId === sId && <span className="ml-auto text-[10px] font-bold text-emerald-500">✓ Activa</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── SECTION STATS ─── */}
      {sectionPath && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Riegos", value: filtered.length, unit: "", icon: FiBarChart2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Litros", value: totalLitros.toFixed(1), unit: "L", icon: FiDroplet, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-900/20" },
            { label: "Tiempo", value: fmtDuracion(totalSeg), unit: "", icon: FiClock, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
          ].map(({ label, value, unit, icon: Icon, color, bg }) => (
            <div key={label} className="glass rounded-2xl p-4 flex flex-col gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`text-sm ${color}`} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className={`text-xl font-extrabold ${color}`}>{value}<span className="text-sm font-medium text-gray-400 ml-1">{unit}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {sectionPath && (
        <div className="flex gap-1.5 bg-gray-100 dark:bg-slate-800/60 rounded-2xl p-1 w-fit">
          {[
            { key: "todos", label: "Todo" },
            { key: "semana", label: "Esta semana" },
            { key: "hoy", label: "Hoy" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filter === key ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ─── EVENTS LIST ─── */}
      {!sectionPath && (
        <div className="glass rounded-3xl p-12 text-center space-y-3">
          <div className="text-5xl">🏠</div>
          <p className="text-gray-500 font-medium">Selecciona un invernadero y sección arriba para ver su historial.</p>
        </div>
      )}

      {sectionPath && (
        <div className="space-y-3">
          {loading && [1, 2, 3].map((i) => <div key={i} className="glass rounded-2xl h-20 animate-pulse" />)}

          {!loading && filtered.length === 0 && (
            <div className="glass rounded-3xl p-12 text-center space-y-2">
              <div className="text-4xl">💧</div>
              <p className="text-gray-500 font-medium">Sin registros en este período.</p>
              <p className="text-xs text-gray-400">Los riegos aparecerán aquí automáticamente.</p>
            </div>
          )}

          {!loading && filtered.map((item, idx) => (
            <div key={item.key || idx} className="glass rounded-2xl p-5 hover:shadow-lg transition">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                    <FiDroplet className="text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{fmtFecha(item.inicio)}</p>
                    {item.fin && <p className="text-[11px] text-gray-400">Fin: {fmtFecha(item.fin)}</p>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-extrabold text-sky-600 dark:text-sky-400">{(item.litros || 0).toFixed(2)} L</p>
                  <p className="text-xs text-gray-400">{fmtDuracion(item.duracion_seg || 0)}</p>
                </div>
              </div>
              <MiniBar value={item.litros || 0} max={maxLitros} color="bg-sky-400" />
              {item.modo && (
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${item.modo === "automatico" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400" : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400"}`}>
                    {item.modo === "automatico" ? "⚡ Automático" : "👆 Manual"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
