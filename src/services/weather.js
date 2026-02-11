export async function obtenerPronostico(lat, lon) {
  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;


  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;

  const res = await fetch(url);
  const data = await res.json();

  const p = data.list[0]; // primer bloque (próximas 3 h)

  // Agrupar por día
  const dias = {};
  data.list.forEach((item) => {
    const fecha = item.dt_txt.split(" ")[0];
    if (!dias[fecha]) dias[fecha] = [];
    dias[fecha].push(item);
  });

  const pronosticoDias = Object.entries(dias).map(([fecha, valores]) => {
    const temps = valores.map((v) => v.main.temp);

    return {
      fecha,
      min: Math.min(...temps),
      max: Math.max(...temps),
      lluvia: Math.round((valores[0].pop || 0) * 100),
      icon: valores[0].weather[0].icon,
      descripcion: valores[0].weather[0].description
    };
  });

  return {
    ciudad: data.city.name,
    icon: p.weather[0].icon,
    descripcion: p.weather[0].description,

    temp: p.main.temp,
    temp_min: p.main.temp_min,
    temp_max: p.main.temp_max,
    feels_like: p.main.feels_like,

    humedad: p.main.humidity,
    viento: p.wind.speed,
    nubes: p.clouds.all,

    lluvia_prob: Math.round(p.pop * 100),
    lluvia_mm: p.rain?.["3h"] || 0,

    pronosticoDias
  };
}
