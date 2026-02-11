import { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../services/firebase";
import { FiSliders } from "react-icons/fi";

export default function Automatico() {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = ref(db, "invernadero/config_automatico");
    onValue(q, (snap) => setConfig(snap.val()));
  }, []);

  async function guardarCambios() {
    setSaving(true);
    await set(ref(db, "invernadero/config_automatico"), config);
    setSaving(false);
  }

  if (!config) {
    return (
      <p className="animate-fadeUp text-gray-500 dark:text-gray-300">
        Cargando configuración…
      </p>
    );
  }

  return (
    <div className="animate-fadeUp space-y-10 max-w-4xl mx-auto">

      {/* TITULO */}
      <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent flex items-center gap-3">
        <FiSliders size={38} />
        Automatización del Sistema
      </h1>

      {/* ===================== TARJETA: MALLA ===================== */}
      <div className="
        bg-white/70 dark:bg-gray-900/60 
        backdrop-blur-2xl
        border border-gray-200/60 dark:border-gray-700/60
        rounded-3xl shadow-xl p-8
        space-y-6
      ">

        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Control automático de malla sombra
        </h2>

        <label className="flex items-center gap-3 text-lg">
          <input
            type="checkbox"
            checked={config.malla.activar_por_radiacion}
            onChange={(e) =>
              setConfig({
                ...config,
                malla: {
                  ...config.malla,
                  activar_por_radiacion: e.target.checked,
                },
              })
            }
            className="w-5 h-5"
          />
          Activar automáticamente según radiación
        </label>

        <div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Umbral de radiación solar (W/m²)
          </p>

          <input
            type="range"
            min={0}
            max={1200}
            value={config.malla.radiacion_umbral}
            onChange={(e) =>
              setConfig({
                ...config,
                malla: {
                  ...config.malla,
                  radiacion_umbral: parseInt(e.target.value),
                },
              })
            }
            className="w-full"
          />

          <p className="text-xl font-semibold mt-1 text-green-600 dark:text-green-400">
            {config.malla.radiacion_umbral} W/m²
          </p>
        </div>
      </div>

      {/* ===================== TARJETA: RIEGO ===================== */}
      <div className="
        bg-white/70 dark:bg-gray-900/60 
        backdrop-blur-2xl
        border border-gray-200/60 dark:border-gray-700/60
        rounded-3xl shadow-xl p-8
        space-y-6
      ">

        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
           Control automático de riego
        </h2>

        <label className="flex items-center gap-3 text-lg">
          <input
            type="checkbox"
            checked={config.riego.activar_por_humedad}
            onChange={(e) =>
              setConfig({
                ...config,
                riego: {
                  ...config.riego,
                  activar_por_humedad: e.target.checked,
                },
              })
            }
            className="w-5 h-5"
          />
          Activar automáticamente según humedad
        </label>

        <div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Umbral mínimo de humedad (%)
          </p>

          <input
            type="range"
            min={0}
            max={100}
            value={config.riego.humedad_umbral}
            onChange={(e) =>
              setConfig({
                ...config,
                riego: {
                  ...config.riego,
                  humedad_umbral: parseInt(e.target.value),
                },
              })
            }
            className="w-full"
          />

          <p className="text-xl font-semibold mt-1 text-green-600 dark:text-green-400">
            {config.riego.humedad_umbral} %
          </p>
        </div>
      </div>

      {/* BOTÓN GUARDAR */}
      <button
        onClick={guardarCambios}
        className="
          w-full py-4 rounded-2xl text-white text-xl font-semibold
          bg-green-600 hover:bg-green-500 active:scale-[0.97]
          transition-all shadow-lg
        "
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}
