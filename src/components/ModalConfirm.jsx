export default function ModalConfirm({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
                    bg-black/40 backdrop-blur-sm animate-fadeIn">

      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl
                      w-[90%] max-w-md animate-pop border border-gray-200/50 dark:border-gray-700/50">

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h2>

        <p className="text-gray-700 dark:text-gray-300 mb-8">
          {message}
        </p>

        <div className="flex justify-end gap-4">
          <button
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            onClick={onClose}
            aria-label="Cancelar"
          >
            Cancelar
          </button>

          <button
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-300 dark:focus:ring-emerald-500"
            onClick={onConfirm}
            aria-label="Confirmar"
          >
            Confirmar
          </button>
        </div>

      </div>
    </div>
  );
}
