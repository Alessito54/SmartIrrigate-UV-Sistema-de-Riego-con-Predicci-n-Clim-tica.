import { useState } from "react";
import { FiPlus, FiSettings, FiList, FiHelpCircle } from "react-icons/fi";

export default function FAB() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50">

      {/* BOTONES SECUNDARIOS */}
      <div
        className={`
          flex flex-col items-end gap-4 mb-4
          transition-all duration-300
          ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5 pointer-events-none"}
        `}
      >
        {/* 1 — Historial */}
        <button className="flex items-center gap-3 bg-white dark:bg-gray-800 shadow-lg px-4 py-2 rounded-xl border hover:shadow-xl transition">
          <FiList className="text-green-600 dark:text-green-300" size={20} />
          <span className="text-gray-700 dark:text-gray-300">Historial</span>
        </button>

        {/* 2 — Ajustes rápidos */}
        <button className="flex items-center gap-3 bg-white dark:bg-gray-800 shadow-lg px-4 py-2 rounded-xl border hover:shadow-xl transition">
          <FiSettings className="text-green-600 dark:text-green-300" size={20} />
          <span className="text-gray-700 dark:text-gray-300">Ajustes</span>
        </button>

        {/* 3 — Ayuda */}
        <button className="flex items-center gap-3 bg-white dark:bg-gray-800 shadow-lg px-4 py-2 rounded-xl border hover:shadow-xl transition">
          <FiHelpCircle className="text-green-600 dark:text-green-300" size={20} />
          <span className="text-gray-700 dark:text-gray-300">Ayuda</span>
        </button>
      </div>

      {/* BOTÓN FLOTANTE PRINCIPAL */}
      <button
        onClick={() => setOpen(!open)}
        className="
          bg-green-600 hover:bg-green-500 text-white 
          w-16 h-16 rounded-full shadow-2xl flex items-center justify-center
          active:scale-95 transition-all duration-300
        "
      >
        <FiPlus
          className={`
            transform transition-all duration-300
            ${open ? "rotate-45" : ""}
          `}
          size={32}
        />
      </button>

    </div>
  );
}
