import { useState, useEffect } from "react";
import { ref, set } from "firebase/database";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { isModuleOnline } from "../services/modulos";
import { FiUser, FiMoon, FiSun, FiLayers, FiChevronRight, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function Ajustes() {
  const { user, userData, invernaderos, invId, secId, selectInvernadero, selectSeccion, logout, modulos } = useAuth();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [nombre, setNombre] = useState(userData?.nombre || "");
  const [savingNombre, setSavingNombre] = useState(false);
  const [savedNombre, setSavedNombre] = useState(false);

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
      setTimeout(() => setSavedNombre(false), 2500);
    } finally { setSavingNombre(false); }
  }

  const invEntries = Object.entries(invernaderos || {});
  const currentSec = invId && secId ? invernaderos[invId]?.secciones?.[secId] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeUp">
      {/* Header */}
      <header>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight flex items-center gap-3">
          <FiUser size={30} className="text-emerald-500" />
          Ajustes
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personaliza tu cuenta y preferencias.</p>
      </header>

      {/* Profile */}
      <section className="glass rounded-3xl p-6 space-y-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiUser className="text-emerald-500" /> Perfil
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0 shadow-lg">
            {(userData?.nombre || user?.email || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Nombre</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && guardarNombre()}
                  className="flex-1 bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                />
                <button
                  onClick={guardarNombre}
                  disabled={savingNombre || !nombre.trim()}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {savedNombre ? "✓ Guardado" : savingNombre ? "..." : "Guardar"}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Correo</label>
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-white/40 dark:bg-slate-800/40 rounded-xl px-4 py-2.5 border border-gray-100 dark:border-slate-700">
                {user?.email || "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Greenhouse overview */}
      <section className="glass rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiLayers className="text-emerald-500" /> Invernaderos y Secciones
        </h2>
        {invEntries.length === 0 ? (
          <p className="text-sm text-gray-400">No tienes invernaderos. Ve a <b>Invernaderos</b> para crear uno.</p>
        ) : (
          <div className="space-y-3">
            {invEntries.map(([id, inv]) => {
              const secs = Object.entries(inv?.secciones || {});
              const isActiveInv = invId === id;
              return (
                <div key={id} className={`rounded-2xl border-2 overflow-hidden transition ${isActiveInv ? "border-emerald-400/50" : "border-gray-100 dark:border-slate-700"}`}>
                  <div className="flex items-center justify-between px-4 py-3 bg-white/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isModuleOnline(modulos[inv?.moduloId]) ? "bg-emerald-400 animate-pulse" : "bg-gray-300"}`} />
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {inv?.nombre || `Invernadero ${id.slice(-6)}`}
                      </p>
                    </div>
                    {isActiveInv && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Activo</span>}
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                    {secs.map(([sId, sec]) => {
                      const isActiveSec = isActiveInv && secId === sId;
                      return (
                        <button
                          key={sId}
                          onClick={() => { selectInvernadero(id); selectSeccion(sId); }}
                          className={`w-full flex items-center justify-between px-5 py-2.5 text-left transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ${isActiveSec ? "bg-emerald-50/80 dark:bg-emerald-900/20" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{sec?.cultivoActual?.split(" ")[0] || "🌱"}</span>
                            <div>
                              <p className={`text-sm ${isActiveSec ? "font-bold text-emerald-700 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"}`}>
                                {sec?.nombre || sId}
                              </p>
                              {sec?.cultivoActual && (
                                <p className="text-[10px] text-gray-400">{sec.cultivoActual}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isActiveSec && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Seleccionada</span>}
                            <FiChevronRight className="text-gray-300" size={14} />
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

      {/* Appearance */}
      <section className="glass rounded-3xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          {darkMode ? <FiMoon className="text-violet-500" /> : <FiSun className="text-amber-500" />}
          Apariencia
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Modo oscuro</p>
            <p className="text-xs text-gray-400">Activa el tema oscuro de la aplicación</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex h-8 w-14 rounded-full transition-all duration-300 ${darkMode ? "bg-violet-500" : "bg-gray-300 dark:bg-gray-600"}`}
          >
            <span className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${darkMode ? "translate-x-6" : ""}`} />
          </button>
        </div>
      </section>

      {/* Logout Button (For Mobile Accessibility) */}
      <section className="glass rounded-3xl p-6">
        <button
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition active:scale-[0.98]"
        >
          <FiLogOut size={18} />
          Cerrar sesión
        </button>
      </section>

      {/* App info */}
      <section className="glass rounded-3xl p-6 text-center space-y-1">
        <p className="text-xs text-gray-400">O.A.S.Y.S · v2.0</p>
        <p className="text-xs text-gray-300 dark:text-gray-600">Sistema de riego inteligente con predicción climática</p>
      </section>
    </div>
  );
}
