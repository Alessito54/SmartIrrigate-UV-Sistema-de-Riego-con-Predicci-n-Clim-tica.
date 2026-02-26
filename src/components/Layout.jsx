import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiHome, FiSliders, FiSettings, FiLogOut } from "react-icons/fi";
import { PiPlantLight } from "react-icons/pi";
import { LuClock } from "react-icons/lu";
import { GrConfigure } from "react-icons/gr";
import { useAuth } from "../context/AuthContext";

const menu = [
  { path: "/", label: "Inicio", icon: FiHome },
  { path: "/control", label: "Control", icon: FiSliders },
  { path: "/cultivos", label: "Cultivos", icon: PiPlantLight },
  { path: "/historial", label: "Historial", icon: LuClock },
  { path: "/automatico", label: "Auto", icon: GrConfigure },
  { path: "/ajustes", label: "Ajustes", icon: FiSettings },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userData, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-sky-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40 text-gray-800 dark:text-gray-100">

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside
        className="
          hidden md:flex
          group relative z-30
          bg-white/50 dark:bg-slate-900/50
          backdrop-blur-2xl
          border-r border-white/60 dark:border-slate-800/50
          shadow-[0_0_40px_rgba(0,0,0,0.06)]
          w-[72px] hover:w-60
          transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          flex-col
          rounded-r-[2rem]
        "
      >
        {/* Decorative glow */}
        <div className="absolute inset-0 pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity duration-700">
          <div className="absolute -top-20 left-4 w-52 h-52 bg-emerald-400/20 blur-[80px] rounded-full" />
          <div className="absolute bottom-10 right-0 w-36 h-36 bg-sky-400/15 blur-[60px] rounded-full" />
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center py-6 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/20 blur-xl rounded-full scale-125" />
            <img src="/lis-logo.png" alt="Lis" className="relative w-10 h-10 drop-shadow-lg" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-2 space-y-1 px-2.5 relative z-10 flex-1">
          {menu.map((item) => {
            const active = pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3.5 px-3 py-2.5 rounded-xl
                  text-[13px] font-semibold tracking-wide
                  transition-all duration-300 relative overflow-hidden
                  ${active
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                    : "text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-gray-100"
                  }
                `}
              >
                <span className="flex-shrink-0">
                  <Icon size={20} />
                </span>
                <span
                  className="
                    whitespace-nowrap
                    opacity-0 group-hover:opacity-100
                    translate-x-2 group-hover:translate-x-0
                    transition-all duration-300
                  "
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom — user + logout */}
        <div className="px-3 py-4 relative z-10 space-y-2">
          {userData && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center truncate opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              {userData.nombre}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="
              flex items-center gap-3.5 px-3 py-2.5 rounded-xl w-full
              text-[13px] font-semibold tracking-wide
              text-gray-500 dark:text-gray-400
              hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400
              transition-all duration-300
            "
          >
            <FiLogOut size={20} className="flex-shrink-0" />
            <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-pageIn">
          {children}
        </div>
      </main>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <nav
        className="
          fixed bottom-0 inset-x-0 z-50
          md:hidden
          glass safe-bottom
          border-t border-white/20 dark:border-slate-800/40
          shadow-[0_-4px_30px_rgba(0,0,0,0.1)]
        "
      >
        <div className="flex items-center justify-around px-2 py-2">
          {menu.map((item) => {
            const active = pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl
                  transition-all duration-300 min-w-[48px]
                  ${active
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  }
                `}
              >
                <div className={`relative p-1 rounded-xl transition-all duration-300 ${active ? "bg-emerald-100/80 dark:bg-emerald-900/40" : ""}`}>
                  <Icon size={20} />
                </div>
                <span className={`text-[10px] font-medium tracking-wide ${active ? "font-semibold" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
