const WMO_CODES = {
  0: { icon: '\u2600\uFE0F', desc: 'Clear sky' },
  1: { icon: '\uD83C\uDF24\uFE0F', desc: 'Mainly clear' },
  2: { icon: '\u26C5', desc: 'Partly cloudy' },
  3: { icon: '\u2601\uFE0F', desc: 'Overcast' },
  45: { icon: '\uD83C\uDF2B\uFE0F', desc: 'Fog' },
  48: { icon: '\uD83C\uDF2B\uFE0F', desc: 'Rime fog' },
  51: { icon: '\uD83C\uDF26\uFE0F', desc: 'Light drizzle' },
  53: { icon: '\uD83C\uDF26\uFE0F', desc: 'Drizzle' },
  55: { icon: '\uD83C\uDF27\uFE0F', desc: 'Dense drizzle' },
  61: { icon: '\uD83C\uDF27\uFE0F', desc: 'Light rain' },
  63: { icon: '\uD83C\uDF27\uFE0F', desc: 'Rain' },
  65: { icon: '\uD83C\uDF27\uFE0F', desc: 'Heavy rain' },
  71: { icon: '\uD83C\uDF28\uFE0F', desc: 'Light snow' },
  73: { icon: '\uD83C\uDF28\uFE0F', desc: 'Snow' },
  75: { icon: '\uD83C\uDF28\uFE0F', desc: 'Heavy snow' },
  80: { icon: '\uD83C\uDF26\uFE0F', desc: 'Rain showers' },
  81: { icon: '\uD83C\uDF26\uFE0F', desc: 'Rain showers' },
  82: { icon: '\u26C8\uFE0F', desc: 'Heavy showers' },
  95: { icon: '\u26C8\uFE0F', desc: 'Thunderstorm' },
  96: { icon: '\u26C8\uFE0F', desc: 'Thunderstorm + hail' },
  99: { icon: '\u26C8\uFE0F', desc: 'Heavy thunderstorm' },
};

function getWeatherInfo(code) {
  return WMO_CODES[code] || { icon: '\u2600\uFE0F', desc: 'Unknown' };
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function initWeather() {
  const container = document.getElementById('weather-content');

  async function fetchAndRender() {
    try {
      // Auto-detect location
      const geoRes = await fetch('https://ipapi.co/json/');
      const geo = await geoRes.json();
      const { latitude: lat, longitude: lon, city, country_name: country } = geo;

      // Fetch weather
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`;
      const weatherRes = await fetch(weatherUrl);
      const weather = await weatherRes.json();

      const current = weather.current;
      const daily = weather.daily;
      const info = getWeatherInfo(current.weather_code);

      let html = `
        <div class="weather-current">
          <span class="weather-icon">${info.icon}</span>
          <div>
            <div class="weather-temp">${Math.round(current.temperature_2m)}<span class="weather-temp-unit">\u00B0C</span></div>
          </div>
        </div>
        <div class="weather-desc">${info.desc}</div>
        <div class="weather-details">
          <span>Humidity ${current.relative_humidity_2m}%</span>
          <span>Wind ${Math.round(current.wind_speed_10m)} km/h</span>
        </div>
        <div class="weather-forecast">
      `;

      // Skip today (index 0), show next 3 days
      for (let i = 1; i < 4 && i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const dayInfo = getWeatherInfo(daily.weather_code[i]);
        html += `
          <div class="forecast-day">
            <div class="day-name">${DAYS[date.getDay()]}</div>
            <div class="day-icon">${dayInfo.icon}</div>
            <div class="day-temp">${Math.round(daily.temperature_2m_max[i])}\u00B0</div>
            <div class="day-low">${Math.round(daily.temperature_2m_min[i])}\u00B0</div>
          </div>
        `;
      }

      html += `</div>
        <div class="weather-location">${city}, ${country}</div>
      `;

      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<div class="weather-desc">Weather unavailable</div>`;
    }
  }

  await fetchAndRender();
  // Refresh every 15 minutes
  setInterval(fetchAndRender, 15 * 60 * 1000);
}
