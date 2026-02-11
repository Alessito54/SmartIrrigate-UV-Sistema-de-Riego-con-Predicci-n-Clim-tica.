export default function SensorCard({ title, value, unit }) {
  return (
    <div className="bg-gray-800 p-5 rounded-xl shadow-md text-center border border-gray-700">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-3xl font-bold text-green-400">
        {value}
        <span className="text-lg text-gray-300 ml-1">{unit}</span>
      </p>
    </div>
  );
}
