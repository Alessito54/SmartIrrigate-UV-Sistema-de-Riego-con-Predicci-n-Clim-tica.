import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiHome, FiSettings, FiLogOut, FiChevronDown, FiLink, FiLayers, FiChevronRight } from "react-icons/fi";
import { PiPlantLight } from "react-icons/pi";
import { LuClock } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import { isModuleOnline } from "../services/modulos";
import { PROJECT_LOGO } from "../config";

const menu = [
  { path: "/dashboard", label: "Inicio", icon: FiHome },
  { path: "/cultivos", label: "Cultivos", icon: PiPlantLight },
  { path: "/historial", label: "Historial", icon: LuClock },
  { path: "/invernaderos", label: "Invernaderos", icon: FiLayers },
  { path: "/vinculacion", label: "Vinculación", icon: FiLink },
  { path: "/ajustes", label: "Ajustes", icon: FiSettings },
];

function GreenhouseSelector() {
  const { invernaderos, invId, secId, selectInvernadero, selectSeccion, modulos } = useAuth();
  const [open, setOpen] = useState(false);

  const currentInv = invId ? invernaderos[invId] : null;
  const currentSec = invId && secId ? invernaderos[invId]?.secciones?.[secId] : null;
  const sectionName = currentSec?.nombre || "Sin sección";
  const invName = currentInv?.nombre || (invId ? invId.slice(-8) : "—");
  const invEntries = Object.entries(invernaderos || {});

  if (invEntries.length === 0) return (
    <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-dashed border-gray-200 dark:border-slate-700">
      <p className="text-[11px] text-gray-400 text-center">Sin invernaderos</p>
    </div>
  );

  return (
    <div className="relative mx-3 mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 transition text-left"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate leading-none">{sectionName}</p>
          <p className="text-[10px] text-gray-400 truncate mt-0.5">{invName}</p>
        </div>
        <FiChevronDown className={`flex-shrink-0 text-gray-400 text-xs transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          {invEntries.map(([id, inv]) => {
            const secs = Object.entries(inv?.secciones || {});
            const invMId = inv?.moduloId;
            const invOnline = invMId ? isModuleOnline(modulos[invMId]) : false;
            return (
              <div key={id}>
                <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${invOnline ? "bg-emerald-400" : "bg-gray-400"}`} />
                  🏠 {inv?.nombre || id.slice(-8)}
                </div>
                {secs.map(([sId, sec]) => (
                  <button
                    key={sId}
                    onClick={() => { selectInvernadero(id); selectSeccion(sId); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2
                      ${invId === id && secId === sId ? "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-900/10" : "text-gray-700 dark:text-gray-300"}`}
                  >
                    <span>{sec?.cultivoActual?.split(" ")[0] || "🌱"}</span>
                    <span className="truncate">{sec?.nombre || sId}</span>
                    {invId === id && secId === sId && <FiChevronRight className="ml-auto flex-shrink-0 text-emerald-500" size={10} />}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userData, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-sky-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40 text-gray-800 dark:text-gray-100 selection:bg-emerald-500/30">
      <div className="flex w-full min-h-screen flex-col md:flex-row">

        {/* ═══ DESKTOP SIDEBAR — static, fixed width ═══ */}
        <aside className="
          hidden md:flex flex-col
          relative z-30 flex-shrink-0
          w-56
          bg-white/60 dark:bg-slate-900/60
          backdrop-blur-2xl
          border-r border-white/60 dark:border-slate-800/50
          shadow-[2px_0_20px_rgba(0,0,0,0.04)]
        ">
          {/* Decorative glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-r-none">
            <div className="absolute -top-16 left-2 w-40 h-40 bg-emerald-400/15 blur-[60px] rounded-full" />
            <div className="absolute bottom-16 right-0 w-28 h-28 bg-sky-400/10 blur-[50px] rounded-full" />
          </div>

          {/* Logo + Brand */}
          <div className="flex items-center gap-3 px-5 py-5 relative z-10">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-emerald-400/20 blur-lg rounded-full scale-125" />
              <img src={PROJECT_LOGO} alt="Logo" className="relative w-8 h-8 drop-shadow-lg" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-gray-900 dark:text-gray-50 leading-none">SmartIrrigate</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">· Sistema de Riego</p>
            </div>
          </div>

          {/* Greenhouse selector */}
          <div className="relative z-10">
            <GreenhouseSelector />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 px-3 relative z-10 overflow-y-auto">
            {menu.map((item) => {
              const active = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    text-[13px] font-semibold tracking-wide
                    transition-all duration-200 relative
                    ${active
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                      : "text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-gray-100"
                    }
                  `}
                >
                  <Icon size={17} className="flex-shrink-0" />
                  {item.label}
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
                </Link>
              );
            })}
          </nav>

          {/* Bottom — user + logout */}
          <div className="px-3 py-4 relative z-10 border-t border-gray-100 dark:border-slate-800/60 mt-2">
            {userData && (
              <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0">
                  {(userData.nombre || "U")[0].toUpperCase()}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate font-medium">{userData.nombre}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="
                flex items-center gap-3 px-3 py-2.5 rounded-xl w-full
                text-[13px] font-semibold tracking-wide
                text-gray-500 dark:text-gray-400
                hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400
                transition-all duration-200
              "
            >
              <FiLogOut size={17} className="flex-shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0 flex flex-col min-h-screen">
          {/* Mobile greenhouse selector bar */}
          <div className="md:hidden px-4 pt-4">
            <GreenhouseSelector />
          </div>
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </main>

        {/* ═══ MOBILE BOTTOM NAV ═══ */}
        <nav className="
          fixed bottom-0 inset-x-0 z-50
          md:hidden
          bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
          border-t border-gray-100 dark:border-slate-800/40
          shadow-[0_-2px_20px_rgba(0,0,0,0.08)]
        ">
          <div className="flex items-center justify-around px-1 py-2 overflow-x-auto">
            {menu.map((item) => {
              const active = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl
                    transition-all duration-200 min-w-[44px]
                    ${active ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}
                  `}
                >
                  <div className={`relative p-1 rounded-xl transition-all ${active ? "bg-emerald-100/80 dark:bg-emerald-900/40" : ""}`}>
                    <Icon size={18} />
                    {active && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </div>
                  <span className={`text-[9px] font-medium ${active ? "font-semibold" : ""}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
