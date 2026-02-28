import { useState, useEffect } from "react";
import { ref, set } from "firebase/database";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { isModuleOnline } from "../services/modulos";
import {
  FiUser, FiMoon, FiSun, FiLayers, FiChevronRight,
  FiLogOut, FiEdit2, FiCheck, FiWifi, FiWifiOff,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ emoji, label, value, colorClass }) {
  return (
    <div className={`glass rounded-2xl p-4 flex flex-col items-center gap-1 border-t-2 ${colorClass}`}>
      <span className="text-2xl">{emoji}</span>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-50">{value}</p>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">{label}</p>
    </div>
  );
}

export default function Ajustes() {
  const { user, userData, invernaderos, invId, secId, selectInvernadero, selectSeccion, logout, modulos } = useAuth();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [nombre, setNombre] = useState(userData?.nombre || "");
  const [savingNombre, setSavingNombre] = useState(false);
  const [savedNombre, setSavedNombre] = useState(false);
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    if (userData?.nombre) setNombre(userData.nombre);
  }, [userData]);

  async function guardarNombre() {
    if (!user || !nombre.trim()) return;
    setSavingNombre(true);
    try {
      await set(ref(db, `usuarios/${user.uid}/nombre`), nombre.trim());
      setSavedNombre(true);
      setEditingName(false);
      setTimeout(() => setSavedNombre(false), 2500);
    } finally { setSavingNombre(false); }
  }

  const invEntries = Object.entries(invernaderos || {});
  const totalSecs = invEntries.reduce((acc, [, inv]) => acc + Object.keys(inv?.secciones || {}).length, 0);
  const onlineModules = Object.values(modulos).filter(isModuleOnline).length;
  const initials = (userData?.nombre || user?.email || "?")[0].toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeUp">

      {/* ═══ HEADER ═══ */}
      <header>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight flex items-center gap-3">
          <FiUser size={30} className="text-emerald-500" />
          Ajustes
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personaliza tu cuenta y preferencias.</p>
      </header>

      {/* ═══ STATS ROW ═══ */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard emoji="🏠" label="Invernaderos" value={invEntries.length} colorClass="border-emerald-400/50" />
        <StatCard emoji="🌱" label="Secciones" value={totalSecs} colorClass="border-sky-400/50" />
        <StatCard emoji="📡" label={onlineModules === 1 ? "Módulo online" : "Módulos online"} value={onlineModules} colorClass="border-violet-400/50" />
      </div>

      {/* ═══ PROFILE ═══ */}
      <section className="glass rounded-3xl overflow-hidden">
        {/* Gradient banner */}
        <div className="relative h-24 bg-gradient-to-br from-emerald-500/30 via-sky-400/20 to-violet-500/20 overflow-hidden">
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-emerald-400/30 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 right-12 w-24 h-24 bg-sky-400/30 rounded-full blur-2xl" />
          <div className="absolute top-2 right-4 w-16 h-16 bg-violet-400/20 rounded-full blur-xl" />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="-mt-9 mb-5 flex items-end gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl ring-4 ring-white dark:ring-slate-900">
                {initials}
              </div>
              {/* Online dot */}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>
            <div className="pb-1">
              <p className="text-base font-extrabold text-gray-900 dark:text-white leading-none">{userData?.nombre || "Usuario"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email || "—"}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                Nombre para mostrar
              </label>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") guardarNombre(); if (e.key === "Escape") setEditingName(false); }}
                    className="flex-1 bg-white/60 dark:bg-slate-800/60 border border-emerald-400/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                  />
                  <button
                    onClick={guardarNombre}
                    disabled={savingNombre || !nombre.trim()}
                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <FiCheck size={14} />
                    {savingNombre ? "..." : savedNombre ? "Guardado" : "Guardar"}
                  </button>
                  <button onClick={() => { setEditingName(false); setNombre(userData?.nombre || ""); }}
                    className="px-3 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-500 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition text-sm">
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white/40 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-2.5">
                  <span className="text-sm text-gray-700 dark:text-gray-200">{userData?.nombre || "—"}</span>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-gray-400 hover:text-emerald-500 transition p-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    <FiEdit2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Correo */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Correo electrónico</label>
              <div className="flex items-center gap-2 bg-white/40 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-2.5">
                <span className="text-sm text-gray-500 dark:text-gray-400 flex-1 truncate">{user?.email || "—"}</span>
                <span className="text-[10px] font-bold text-gray-300 dark:text-slate-600 uppercase tracking-wide">Solo lectura</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ APPEARANCE ═══ */}
      <section className="glass rounded-3xl p-6 space-y-5">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {darkMode ? <FiMoon className="text-violet-500" /> : <FiSun className="text-amber-500" />}
          Apariencia
        </h2>

        {/* Theme selector cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Light mode card */}
          <button
            onClick={() => setDarkMode(false)}
            className={`rounded-2xl border-2 p-4 transition-all text-left ${!darkMode ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-900/20 shadow-md" : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"}`}
          >
            {/* Mini preview - light */}
            <div className="rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm mb-3 h-16 flex flex-col">
              <div className="h-4 bg-white border-b border-gray-100 flex items-center gap-1 px-2">
                <span className="w-6 h-1.5 bg-emerald-400 rounded-full" />
                <span className="w-10 h-1.5 bg-gray-200 rounded-full" />
              </div>
              <div className="flex-1 flex gap-1.5 p-2">
                <div className="w-6 bg-gray-50 rounded" />
                <div className="flex-1 space-y-1">
                  <div className="h-2 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                </div>
              </div>
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <FiSun size={12} className="text-amber-500" /> Claro
            </p>
            {!darkMode && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Activo</p>}
          </button>

          {/* Dark mode card */}
          <button
            onClick={() => setDarkMode(true)}
            className={`rounded-2xl border-2 p-4 transition-all text-left ${darkMode ? "border-violet-500 bg-violet-50/30 dark:bg-violet-900/20 shadow-md" : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"}`}
          >
            {/* Mini preview - dark */}
            <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-sm mb-3 h-16 flex flex-col">
              <div className="h-4 bg-slate-800 border-b border-slate-700 flex items-center gap-1 px-2">
                <span className="w-6 h-1.5 bg-emerald-500 rounded-full" />
                <span className="w-10 h-1.5 bg-slate-600 rounded-full" />
              </div>
              <div className="flex-1 flex gap-1.5 p-2">
                <div className="w-6 bg-slate-800 rounded" />
                <div className="flex-1 space-y-1">
                  <div className="h-2 bg-slate-700 rounded-full w-3/4" />
                  <div className="h-2 bg-slate-700 rounded-full w-1/2" />
                </div>
              </div>
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <FiMoon size={12} className="text-violet-500" /> Oscuro
            </p>
            {darkMode && <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold mt-0.5">Activo</p>}
          </button>
        </div>
      </section>

      {/* ═══ INVERNADEROS Y SECCIONES ═══ */}
      <section className="glass rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiLayers className="text-emerald-500" /> Invernaderos y Secciones
          </h2>
          {invEntries.length > 0 && (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {invEntries.length} invernadero{invEntries.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {invEntries.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 p-8 text-center space-y-2">
            <p className="text-3xl">🏠</p>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Sin invernaderos aún</p>
            <p className="text-xs text-gray-400">Ve a <b>Invernaderos</b> para crear el primero.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invEntries.map(([id, inv]) => {
              const secs = Object.entries(inv?.secciones || {});
              const isActiveInv = invId === id;
              const online = isModuleOnline(modulos[inv?.moduloId]);
              return (
                <div key={id} className={`rounded-2xl border-2 overflow-hidden transition-all ${isActiveInv ? "border-emerald-400/60 shadow-md shadow-emerald-500/10" : "border-gray-100 dark:border-slate-700"}`}>
                  {/* Greenhouse header */}
                  <div className={`flex items-center justify-between px-4 py-3 ${isActiveInv ? "bg-emerald-50/60 dark:bg-emerald-900/20" : "bg-white/50 dark:bg-slate-800/50"}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-base ${isActiveInv ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-gray-100 dark:bg-slate-700"}`}>
                        🏠
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-none">
                          {inv?.nombre || `Invernadero ${id.slice(-6)}`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {online
                            ? <FiWifi size={9} className="text-emerald-500" />
                            : <FiWifiOff size={9} className="text-gray-400" />
                          }
                          <span className={`text-[9px] font-semibold ${online ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>
                            {online ? "Online" : "Sin módulo"}
                          </span>
                          <span className="text-[9px] text-gray-300 dark:text-slate-600">·</span>
                          <span className="text-[9px] text-gray-400">{secs.length} sección{secs.length !== 1 ? "es" : ""}</span>
                        </div>
                      </div>
                    </div>
                    {isActiveInv && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                        ✓ Activo
                      </span>
                    )}
                  </div>

                  {/* Sections list */}
                  <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                    {secs.map(([sId, sec]) => {
                      const isActiveSec = isActiveInv && secId === sId;
                      return (
                        <button
                          key={sId}
                          onClick={() => { selectInvernadero(id); selectSeccion(sId); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ${isActiveSec ? "bg-emerald-50/80 dark:bg-emerald-900/20" : ""}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base w-6 text-center">{sec?.cultivoActual?.split(" ")[0] || "🌱"}</span>
                            <div>
                              <p className={`text-sm leading-none ${isActiveSec ? "font-bold text-emerald-700 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"}`}>
                                {sec?.nombre || sId}
                              </p>
                              {sec?.cultivoActual && (
                                <p className="text-[10px] text-gray-400 mt-0.5">{sec.cultivoActual}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isActiveSec && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Seleccionada</span>}
                            <FiChevronRight className="text-gray-300 dark:text-slate-600" size={13} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══ CUENTA & APP INFO + LOGOUT ═══ */}
      <section className="glass rounded-3xl overflow-hidden">
        {/* Danger zone */}
        <div className="px-6 pt-6 pb-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiLogOut className="text-red-400" size={16} /> Sesión
          </h2>
          <button
            onClick={async () => { await logout(); navigate("/login"); }}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition active:scale-[0.98] border border-red-200/50 dark:border-red-800/50"
          >
            <FiLogOut size={16} />
            Cerrar sesión
          </button>
        </div>

        {/* App info footer */}
        <div className="border-t border-gray-100 dark:border-slate-800/60 px-6 py-4 bg-gray-50/50 dark:bg-slate-900/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wide">O.A.S.Y.S · v2.0</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">Sistema de riego inteligente con predicción climática</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Conectado</span>
          </div>
        </div>
      </section>

    </div>
  );
}
