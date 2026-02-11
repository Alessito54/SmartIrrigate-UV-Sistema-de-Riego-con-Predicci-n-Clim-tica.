import { useEffect, useState } from "react";
import { ref, get, set, push, serverTimestamp } from "firebase/database";
import { db } from "../services/firebase";
import { FiPlus, FiSettings, FiList, FiHelpCircle } from "react-icons/fi";

/* ---------------------------- FAB ---------------------------- */
function FAB() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-10 right-10 z-40 flex flex-col items-end gap-4">
      <div
        className={`
          flex flex-col items-end gap-4 mb-4 transition-all duration-300
          ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5 pointer-events-none"}
        `}
      >
        <button className="flex items-center gap-3 bg-white dark:bg-gray-800 shadow-lg px-4 py-2 rounded-xl border hover:shadow-xl transition">
          <FiList className="text-green-600 dark:text-green-300" size={20} />
          <span className="text-gray-700 dark:text-gray-300">Historial</span>
        </button>

        <button className="flex items-center gap-3 bg-white dark:bg-gray-800 shadow-lg px-4 py-2 rounded-xl border hover:shadow-xl transition">
          <FiSettings className="text-green-600 dark:text-green-300" size={20} />
          <span className="text-gray-700 dark:text-gray-300">Ajustes</span>
        </button>

        <button className="flex items-center gap-3 bg-white dark:bg-gray-800 shadow-lg px-4 py-2 rounded-xl border hover:shadow-xl transition">
          <FiHelpCircle className="text-green-600 dark:text-green-300" size={20} />
          <span className="text-gray-700 dark:text-gray-300">Ayuda</span>
        </button>
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="bg-green-600 hover:bg-green-500 text-white w-16 h-16 rounded-full shadow-2xl
        flex items-center justify-center active:scale-95 transition-all duration-300"
      >
        <FiPlus
          className={`transform transition-all duration-300 ${open ? "rotate-45" : ""}`}
          size={32}
        />
      </button>
    </div>
  );
}

/* ---------------------------- MODAL ---------------------------- */
function ModalConfirm({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl w-[90%] max-w-md animate-pop border border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-8">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200
            hover:bg-gray-300 dark:hover:bg-gray-600 transition active:scale-95"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white transition active:scale-95"
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- CONTROL ---------------------------- */
export default function Control() {
  const [riego, setRiego] = useState(null);
  const [malla, setMalla] = useState(null);
  const [inicioRiego, setInicioRiego] = useState(null);

  const [modal, setModal] = useState({
    open: false,
    type: null,
    value: null,
  });

  useEffect(() => {
    const cargar = async () => {
      const r = await get(ref(db, "invernadero/control/riego"));
      const m = await get(ref(db, "invernadero/control/malla"));
      if (r.exists()) setRiego(r.val());
      if (m.exists()) setMalla(m.val());
    };
    cargar();
  }, []);

  function pedirConfirmacion(type, value) {
    setModal({ open: true, type, value });
  }

  async function confirmarAccion() {
    // --- SI ES RIEGO ---
    if (modal.type === "riego") {
      const nuevoEstado = modal.value;

      // Guardar el nuevo estado
      await set(ref(db, "invernadero/control/riego"), nuevoEstado);
      setRiego(nuevoEstado);

      // --- REGISTRO DE INICIO ---
      if (nuevoEstado === true) {
        setInicioRiego(Date.now());
      }

      // --- REGISTRO DE FIN ---
      if (nuevoEstado === false && inicioRiego) {
        const fin = Date.now();
        const duracionSeg = Math.floor((fin - inicioRiego) / 1000);

        // Cálculo de litros por bomba (80–120 L/h ≈ 0.022–0.033 L/s)
        const caudal = 0.028; // promedio L/s
        const litros = parseFloat((duracionSeg * caudal).toFixed(2));

        // Guardar registro en Firebase
        await push(ref(db, "invernadero/historial_riego"), {
          inicio: new Date(inicioRiego).toISOString(),
          fin: new Date(fin).toISOString(),
          duracion_seg: duracionSeg,
          litros,
          timestamp: serverTimestamp(),
        });

        setInicioRiego(null);
      }
    }

    if (modal.type === "malla") {
      await set(ref(db, "invernadero/control/malla"), modal.value);
      setMalla(modal.value);
    }

    setModal({ open: false, type: null, value: null });
  }

  return (
    <div className="space-y-16 animate-fadeUp">
      <ModalConfirm
        open={modal.open}
        onClose={() => setModal({ open: false })}
        onConfirm={confirmarAccion}
        title="Confirmar acción"
        message="¿Seguro que quieres continuar?"
      />

      <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent animate-fadeUp">
        Control del Sistema
      </h1>

      {/* TARJETA DE RIEGO */}
      <div className="relative overflow-hidden bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700 p-8 rounded-3xl shadow-xl animate-fadeUp transition-all duration-500 hover:shadow-2xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl"></div>

        <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-50 flex items-center gap-2">
           Riego
        </h2>

        <p className="text-lg mb-6 font-medium text-gray-700 dark:text-gray-300">
          Estado actual:{" "}
          <span
            className={`
              px-3 py-1 rounded-full font-semibold
              ${
                riego
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              }
            `}
          >
            {riego ? "Activado" : "Desactivado"}
          </span>
        </p>

        <div className="flex gap-4">
          <button
            className="px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md hover:shadow-xl transition-all duration-300 active:scale-95"
            onClick={() => pedirConfirmacion("riego", true)}
          >
            Activar
          </button>

          <button
            className="px-6 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-500 shadow-md hover:shadow-xl transition-all duration-300 active:scale-95"
            onClick={() => pedirConfirmacion("riego", false)}
          >
            Desactivar
          </button>
        </div>
      </div>

      {/* TARJETA MALLA */}
      <div className="relative overflow-hidden bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700 p-8 rounded-3xl shadow-xl animate-fadeUp transition-all duration-500 hover:shadow-2xl">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-2xl"></div>

        <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-50 flex items-center gap-2">
          Malla Sombra
        </h2>

        <p className="text-lg mb-6 font-medium text-gray-700 dark:text-gray-300">
          Estado actual:{" "}
          <span
            className={`
              px-3 py-1 rounded-full font-semibold
              ${
                malla
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
              }
            `}
          >
            {malla ? "Abierta" : "Cerrada"}
          </span>
        </p>

        <div className="flex gap-4">
          <button
            className="px-6 py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-500 shadow-md hover:shadow-xl transition-all duration-300 active:scale-95"
            onClick={() => pedirConfirmacion("malla", true)}
          >
            Abrir
          </button>

          <button
            className="px-6 py-3 rounded-xl font-semibold text-white bg-yellow-600 hover:bg-yellow-500 shadow-md hover:shadow-xl transition-all duration-300 active:scale-95"
            onClick={() => pedirConfirmacion("malla", false)}
          >
            Cerrar
          </button>
        </div>
      </div>

      <FAB />
    </div>
  );
}
