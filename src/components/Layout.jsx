import { Link, useLocation } from "react-router-dom";
import { WiRaindrop } from "react-icons/wi";
import { FiHome, FiSliders, FiSettings } from "react-icons/fi";
import { PiPlantLight } from "react-icons/pi";
import { LuClock } from "react-icons/lu";
import { GrConfigure } from "react-icons/gr";



export default function Layout({ children }) {
  const { pathname } = useLocation();

  const menu = [
    { path: "/", label: "Menú Principal", icon: <FiHome size={22} /> },
    { path: "/control", label: "Control", icon: <FiSliders size={22} /> },
    { path: "/cultivos", label: "Cultivos", icon: <PiPlantLight size={22} /> },
        { path: "/historial", label: "Historial", icon: <LuClock size={22} /> },
        { path: "/automatico", label: "Automático", icon: <GrConfigure size={22} /> },
    { path: "/ajustes", label: "Ajustes", icon: <FiSettings size={22} /> },
    
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">

      {/* ▓▓▓ SIDEBAR PREMIUM ▓▓▓ */}
      <aside
        className="
          group relative
          bg-white/40 dark:bg-gray-800/30
          backdrop-blur-2xl
          border-r border-white/50 dark:border-gray-700/40
          shadow-[0_8px_30px_rgba(0,0,0,0.15)]
          w-20 hover:w-64
          transition-all duration-500
          flex flex-col
          rounded-r-3xl
        "
      >
        {/* Glow decorativo */}
        <div className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity">
          <div className="absolute -top-20 left-10 w-64 h-64 bg-green-400/20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-green-300/10 blur-2xl rounded-full"></div>
        </div>

        {/* LOGO */}
        <div className="flex items-center justify-center py-7 relative z-10">
          <WiRaindrop className="text-green-600 dark:text-green-400 w-12 h-12 drop-shadow-2xl" />
        </div>

        {/* NAVIGATION */}
        <nav className="mt-4 space-y-2 px-3 relative z-10">
          {menu.map((item) => {
            const active = pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-2xl
                  text-base font-medium transition-all duration-300 relative

                  ${
                    active
                      ? "bg-green-600 text-white shadow-xl scale-[1.03]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/40"
                  }
                `}
              >
                {/* Barra activa */}
                {active && (
                  <span className="
                    absolute left-0 top-0 h-full w-1 
                    bg-white dark:bg-green-300 
                    rounded-r-xl shadow-lg
                  " />
                )}

                {/* Icono */}
                <span
                  className={`${
                    active ? "text-white" : "text-green-700 dark:text-green-400"
                  }`}
                >
                  {item.icon}
                </span>

                {/* Texto expandible */}
                <span
                  className="
                    whitespace-nowrap text-lg 
                    opacity-0 group-hover:opacity-100 
                    transition-opacity duration-300
                  "
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 sm:p-10 animate-pageIn">
        {children}
      </main>
    </div>
  );
}
