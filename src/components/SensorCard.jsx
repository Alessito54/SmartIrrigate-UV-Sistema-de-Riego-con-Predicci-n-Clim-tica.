export default function SensorCard({ title, value, unit }) {
  return (
    <div className="glass p-4 sm:p-5 rounded-xl shadow-md text-center border border-gray-200 dark:border-slate-700">
      <h2 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-2 truncate" title={title}>{title}</h2>
      <p className="text-2xl sm:text-3xl font-extrabold text-emerald-500 dark:text-emerald-400 leading-none">
        {value}
        <span className="text-sm sm:text-base text-gray-500 dark:text-gray-300 ml-2">{unit}</span>
      </p>
    </div>
  );
}
