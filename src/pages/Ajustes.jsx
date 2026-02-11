import { useState, useEffect } from "react";

export default function Ajustes() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="max-w-4xl mx-auto animate-fadeUp">

      <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent mb-12">
        Ajustes
      </h1>

      {/* TARJETA */}
      <section
        className="
          relative overflow-hidden
          bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl
          p-8 rounded-3xl shadow-xl border border-gray-200/60 dark:border-gray-700/60
          transition-all duration-500 hover:shadow-2xl
        "
      >
        <div className="absolute -top-14 right-0 w-40 h-40 bg-green-500/20 rounded-full blur-2xl"></div>

        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-50">
          Tema visual
        </h2>

        {/* SWITCH iOS */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Activar modo oscuro
          </span>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`
              relative inline-flex h-9 w-16 rounded-full transition-all duration-300
              ${darkMode ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}
            `}
          >
            <span
              className={`
                absolute top-1 left-1 h-7 w-7 rounded-full bg-white dark:bg-gray-200 shadow-md 
                transform transition-all duration-300
                ${darkMode ? "translate-x-7" : ""}
              `}
            />
          </button>
        </div>
      </section>
    </div>
  );
}
