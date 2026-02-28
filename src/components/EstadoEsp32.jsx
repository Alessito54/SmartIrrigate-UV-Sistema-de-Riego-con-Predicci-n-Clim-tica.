import { useAuth } from "../context/AuthContext";
import { isModuleOnline } from "../services/modulos";
import { FiWifi, FiWifiOff } from "react-icons/fi";

// Componente renombrado internamente a EstadoModulo.
// El archivo mantiene su nombre original para no romper imports existentes.
export default function EstadoModulo({ moduloId }) {
  const { modulos } = useAuth();
  const online = isModuleOnline(moduloId ? modulos[moduloId] : null);

  return (
    <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
      online
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
        : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400"
    }`}>
      {online
        ? <FiWifi size={10} className="animate-pulse" />
        : <FiWifiOff size={10} />
      }
      OASYS Módulo {online ? "Online" : "Offline"}
    </div>
  );
}
