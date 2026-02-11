import { useEffect, useState } from "react";
import { ref, onValue, remove } from "firebase/database";
import { db } from "../services/firebase";

export default function Historial() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = ref(db, "invernadero/historial_riego");
    onValue(q, (snap) => {
      const val = snap.val() || {};
      const arr = Object.values(val).sort(
        (a, b) => new Date(b.inicio) - new Date(a.inicio)
      );
      setItems(arr);
      setLoading(false);
    });
  }, []);

  // Totales
  const totalLitros = items.reduce((a, b) => a + b.litros, 0).toFixed(2);
  const totalRiegos = items.length;
  const totalMin = Math.floor(
    items.reduce((a, b) => a + b.duracion_seg, 0) / 60
  );

  // === LIMPIAR HISTORIAL ===
  async function limpiarHistorial() {
    if (!confirm("¿Seguro que deseas borrar TODO el historial?")) return;
    await remove(ref(db, "invernadero/historial_riego"));
    alert("Historial eliminado.");
  }

  return (
    <div className="animate-fadeUp space-y-10 max-w-5xl mx-auto">

      {/* TÍTULO */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
          Historial de Riego
        </h1>

        <button
          className="
            px-4 py-2 rounded-xl text-white bg-red-600 hover:bg-red-500 
            shadow-md transition active:scale-95
          "
          onClick={limpiarHistorial}
        >
          Limpiar historial
        </button>
      </div>

      {/* RESUMEN */}
      <div
        className="
        grid sm:grid-cols-3 gap-5 
        bg-white/60 dark:bg-gray-900/50 
        backdrop-blur-xl p-6 rounded-3xl
        border border-gray-200/50 dark:border-gray-700/50 shadow-xl
      "
      >
        <div>
          <p className="text-gray-500 text-sm">Total riegos</p>
          <p className="text-3xl font-bold">{totalRiegos}</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Litros gastados</p>
          <p className="text-3xl font-bold">{totalLitros} L</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Minutos total</p>
          <p className="text-3xl font-bold">{totalMin} min</p>
        </div>
      </div>

      {/* LISTA */}
      <div className="space-y-4">
        {loading && (
          <p className="text-gray-500 dark:text-gray-300">Cargando historial...</p>
        )}

        {!loading && items.length === 0 && (
          <p className="text-gray-500 dark:text-gray-300 text-lg">
            No hay registros aún.
          </p>
        )}

        {items.map((i, x) => (
          <div
            key={x}
            className="
              bg-white/70 dark:bg-gray-900/60 
              backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50
              p-5 rounded-2xl shadow-md hover:shadow-xl transition-all
            "
          >
            <h3 className="font-semibold text-lg text-green-600 dark:text-green-300">
              {new Date(i.inicio).toLocaleString("es-MX")}
            </h3>

            <p className="text-gray-700 dark:text-gray-300 mt-1">
              Duración: <b>{i.duracion_seg} s</b>
            </p>

            <p className="text-gray-700 dark:text-gray-300">
              Litros usados: <b>{i.litros} L</b>
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
