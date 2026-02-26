import { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { FiSliders } from "react-icons/fi";

export default function Automatico() {
  const { sectionPath } = useAuth();
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sectionPath) return;
    const unsub = onValue(ref(db, `${sectionPath}/controlAutomatico`), (snap) =>
      setConfig(snap.val())
    );
    return () => unsub();
  }, [sectionPath]);

  async function guardarCambios() {
    if (!sectionPath) return;
    setSaving(true);
    await set(ref(db, `${sectionPath}/controlAutomatico`), config);
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
    <div className="animate-fadeUp space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <header>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight flex items-center gap-3">
          <FiSliders size={32} />
          Automatización
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configura las reglas de automatización de tu invernadero.
        </p>
      </header>

      {/* Toggle activo */}
      <div className="glass rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">
            Control automático
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Activa o desactiva toda la automatización
          </p>
        </div>
        <button
          onClick={() => setConfig({ ...config, activo: !config.activo })}
          className={`
            relative inline-flex h-8 w-14 rounded-full transition-all duration-300
            ${config.activo ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}
          `}
        >
          <span
            className={`
              absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md
              transform transition-all duration-300
              ${config.activo ? "translate-x-6" : ""}
            `}
          />
        </button>
      </div>

      {/* Umbrales */}
      {config.umbrales && (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Temperatura */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
              Temperatura
            </h3>
            <div>
              <p className="text-xs text-gray-500 mb-1">Máxima (°C)</p>
              <input
                type="range"
                min={20}
                max={50}
                value={config.umbrales.temperatura?.max || 35}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    umbrales: {
                      ...config.umbrales,
                      temperatura: {
                        ...config.umbrales.temperatura,
                        max: parseInt(e.target.value),
                      },
                    },
                  })
                }
                className="w-full accent-emerald-500"
              />
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {config.umbrales.temperatura?.max || 35}°C
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Mínima (°C)</p>
              <input
                type="range"
                min={0}
                max={20}
                value={config.umbrales.temperatura?.min || 10}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    umbrales: {
                      ...config.umbrales,
                      temperatura: {
                        ...config.umbrales.temperatura,
                        min: parseInt(e.target.value),
                      },
                    },
                  })
                }
                className="w-full accent-emerald-500"
              />
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {config.umbrales.temperatura?.min || 10}°C
              </p>
            </div>
          </div>

          {/* Humedad */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
              Humedad
            </h3>
            <div>
              <p className="text-xs text-gray-500 mb-1">Mínima (%)</p>
              <input
                type="range"
                min={0}
                max={100}
                value={config.umbrales.humedad?.min || 40}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    umbrales: {
                      ...config.umbrales,
                      humedad: {
                        ...config.umbrales.humedad,
                        min: parseInt(e.target.value),
                      },
                    },
                  })
                }
                className="w-full accent-emerald-500"
              />
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {config.umbrales.humedad?.min || 40}%
              </p>
            </div>
          </div>

          {/* Radiación */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
              Radiación solar
            </h3>
            <div>
              <p className="text-xs text-gray-500 mb-1">Máxima (W/m²)</p>
              <input
                type="range"
                min={0}
                max={1200}
                value={config.umbrales.radiacion?.max || 900}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    umbrales: {
                      ...config.umbrales,
                      radiacion: {
                        ...config.umbrales.radiacion,
                        max: parseInt(e.target.value),
                      },
                    },
                  })
                }
                className="w-full accent-emerald-500"
              />
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {config.umbrales.radiacion?.max || 900} W/m²
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
              Acciones automáticas
            </h3>
            {config.acciones && (
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={config.acciones.riego?.bajoHumedad || false}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        acciones: {
                          ...config.acciones,
                          riego: {
                            ...config.acciones.riego,
                            bajoHumedad: e.target.checked,
                          },
                        },
                      })
                    }
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Riego por humedad baja
                  </span>
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={config.acciones.malla?.altaRadiacion || false}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        acciones: {
                          ...config.acciones,
                          malla: {
                            ...config.acciones.malla,
                            altaRadiacion: e.target.checked,
                          },
                        },
                      })
                    }
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Malla por radiación alta
                  </span>
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={config.acciones.malla?.altaTemperatura || false}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        acciones: {
                          ...config.acciones,
                          malla: {
                            ...config.acciones.malla,
                            altaTemperatura: e.target.checked,
                          },
                        },
                      })
                    }
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Malla por temperatura alta
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={guardarCambios}
        className="
          w-full py-3.5 rounded-xl text-sm font-semibold text-white
          bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97]
          transition-all shadow-lg shadow-emerald-600/20
        "
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}
