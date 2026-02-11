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
            className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition active:scale-95"
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
