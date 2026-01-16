# 🔥 CHEAT SHEET - Open-Meteo Weather App

## 🎯 Problem Który Rozwiązaliśmy

**Było:**

```
❌ OpenWeatherMap - Potrzebny API Key
❌ Tylko 5 dni prognozy
❌ Brak historycznych danych
```

**Jest Teraz:**

```
✅ Open-Meteo - BEZ API KEY!
✅ 80 LAT DANYCH HISTORYCZNYCH
✅ Wykresy i statystyki
```

## 🌍 Jak Open-Meteo Działa

### Problem: URL się zmienia w zależności od parametrów

**Na screenie (static page):**

```
https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41
```

**Ale my budujemy dynamicznie:**

```javascript
const url = new URL('https://api.open-meteo.com/v1/forecast');
url.searchParams.append('latitude', 52.52);
url.searchParams.append('longitude', 13.41);
// Результат: https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41
```

### 3 Endpointy

```javascript
// 1. GEOCODING - Miasto → Współrzędne GPS
https://geocoding-api.open-meteo.com/v1/search?name=Warsaw

Odpowiedź:
{
  results: [
    {
      name: "Warsaw",
      latitude: 52.2297,
      longitude: 21.0122,
      country: "Poland",
      timezone: "Europe/Warsaw"
    }
  ]
}

// 2. CURRENT WEATHER - Teraz
https://api.open-meteo.com/v1/forecast?latitude=52.22&longitude=21.01&current=...

// 3. HISTORICAL - Ostatnie 80 lat!
https://archive-api.open-meteo.com/v1/archive?latitude=52.22&longitude=21.01&start_date=1950-01-01&end_date=2024-01-16
```

## 🔧 Architektura Aplikacji

### 1️⃣ WeatherService (API Layer)

```javascript
// Geocoding
const coords = await weatherService.geocodeCity('Warsaw');
// {latitude, longitude, name, country, timezone}

// Current Weather
const current = await weatherService.getCurrentWeather('Warsaw');
// {main: {temp, humidity, pressure}, weather: [...], wind, ...}

// Forecast
const forecast = await weatherService.getForecast('Warsaw');
// {list: [{dt, main, weather, wind, ...}], city}

// Historical (NOWE!)
const history = await weatherService.getHistoricalData(
  'Warsaw',
  '2023-01-01',
  '2024-01-16'
);
// {timestamps, temperatureMean, precipitation, windSpeed, ...}
```

### 2️⃣ StateManager (Observable Pattern)

```javascript
// Subscribe na zmiany
stateManager.subscribe('currentWeather', (newData) => {
  console.log('Pogoda się zmieniła!', newData);
});

// Set wartość
stateManager.set('currentCity', 'London');

// Powiadomienie (automatyczne)
// ↓ notify() → callback(newData)
```

### 3️⃣ Components (Web Components + Shadow DOM)

```javascript
class CurrentWeatherComponent extends HTMLElement {
  connectedCallback() {
    // Zarejestruj subscription
    this.unsubscribe = stateManager.subscribe('currentWeather', (data) => {
      this.weather = data;
      this.updateView();
    });
  }

  disconnectedCallback() {
    // Wyczyść
    this.unsubscribe();
  }
}
```

## 📊 Dane Historyczne - Formatowanie

Open-Meteo zwraca:

```json
{
  "daily": {
    "time": ["2023-01-01", "2023-01-02", ...],
    "temperature_2m_mean": [5.2, 4.8, 6.1, ...],
    "temperature_2m_max": [8.5, 7.3, 9.2, ...],
    "temperature_2m_min": [2.1, 1.3, 3.2, ...],
    "precipitation_sum": [0, 2.5, 0, ...],
    "wind_speed_10m_max": [15, 12, 18, ...]
  }
}
```

My transformujemy na:

```javascript
{
  timestamps: [...],           // time array
  temperatureMean: [...],      // do wykresu
  temperatureMax: [...],
  temperatureMin: [...],
  precipitation: [...],        // do innego wykresu
  windSpeed: [...]             // do jeszcze innego
}
```

## 🎨 WMO Weather Codes (Konwersja)

```javascript
// Open-Meteo używa WMO codes
0    → 'Clear'
1-2  → 'Clouds'
45   → 'Fog'
51-55 → 'Drizzle'
61-65 → 'Rain'
71-77 → 'Snow'
95-99 → 'Thunderstorm'

// My to konwertujemy na polski opis
0 → 'Jasno'
1 → 'Głównie jasno'
3 → 'Pochmurno'
etc.
```

## 🔐 Bezpieczeństwo & Limity

```javascript
// DARMOWY PLAN - Bez limitów!
// ✅ Unlimited requests
// ✅ Unlimited historical data
// ✅ No authentication needed
// ✅ No rate limiting

// Ale wciąż:
// • Timeout 10 sekund (jak wisi, abort)
// • Cache 5 minut (nie molestuj API)
```

## 💻 Debug Mode - Komendy

```javascript
// 1. Sprawdź bieżące miasto
DEBUG.getState('currentCity');

// 2. Zmień miasto programistycznie
DEBUG.setState('currentCity', 'Tokyo');

// 3. Pobierz dane historyczne bezpośrednio
DEBUG.fetchHistorical('Paris', '2023-01-01', '2024-01-16');

// 4. Zobacz cache statystyki
DEBUG.getCacheStats();
// {cacheSize: 3, citiesCount: 2, cachedCities: ['Warsaw', 'London']}

// 5. Wyczyść cache
DEBUG.api.clearCache();

// 6. Sprawdź history State Manager'a
DEBUG.state.getHistory();
```

## 🚀 Event Flow

### Użytkownik szuka miasta

```
1. User pisze "London" w search boxie
   ↓
2. Search Component emituje event 'search'
   ↓
3. App.setupEventListeners() łapie event
   ↓
4. App.fetchWeatherData('London') uruchamia się
   ↓
5. WeatherService.geocodeCity('London')
   ↓ 🌍 Geocoding API → get coordinates
   ↓
6. Promise.all([getCurrentWeather, getForecast])
   ↓ 🌐 Current + Forecast API
   ↓
7. StateManager.setMultiple({currentWeather, forecast})
   ↓
8. Subscribers (komponenty) się aktualizują
   ↓
9. Shadow DOM się re-renderuje
   ↓
10. UI wyświetla nową pogodę ✨
```

### Użytkownik chce danych historycznych

```
1. User wybiera daty i klika "Załaduj"
   ↓
2. HistoricalChart Component emituje event 'historical-requested'
   ↓
3. App.setupEventListeners() łapie event
   ↓
4. App.fetchHistoricalData(city, startDate, endDate)
   ↓
5. WeatherService.getHistoricalData()
   ↓ 🏛️ Historical Archive API (80 lat!)
   ↓
6. StateManager.setHistoricalData(data)
   ↓
7. HistoricalChart subscriber się aktualizuje
   ↓
8. Chart.js renderuje wykres
   ↓
9. Stats (min/max/avg) się aktualizują
   ↓
10. UI pokazuje historyczne dane ✨
```

## 📈 Przykład: Pobierz dane z 1990

```javascript
DEBUG.fetchHistorical('London', '1990-01-01', '1990-12-31');

// Rezultat w konsoli: ✅ Dane historyczne załadowane

// Sprawdź co się załadowało
DEBUG.getState('historicalData');

// Powinno mieć:
// {
//   timestamps: ["1990-01-01", "1990-01-02", ...],
//   temperatureMean: [2.5, 1.8, ...],
//   ...
// }
```

## 🎓 Koncepty Edukacyjne

### 1. Web Components (Custom HTML)

```html
<current-weather id="weather"></current-weather>
```

```javascript
class CurrentWeatherComponent extends HTMLElement {}
customElements.define('current-weather', CurrentWeatherComponent);
```

### 2. State Management (Observable)

```javascript
// Emisja
stateManager.set('city', 'London');

// Subskrypcja
stateManager.subscribe('city', (newCity) => {
  console.log('Nowe miasto:', newCity);
});
```

### 3. Async/Await + Promises

```javascript
// Promise.all - Równolegle
const [current, forecast] = await Promise.all([
  weatherService.getCurrentWeather(city),
  weatherService.getForecast(city),
]);
```

### 4. ES6 Modules

```javascript
// Export
export const weatherService = new WeatherService();
export function formatTemperature(temp) {}

// Import
import { weatherService } from './api/weatherService.js';
import { formatTemperature } from './utils/formatters.js';
```

### 5. CSS Variables + Flexbox/Grid

```css
:root {
  --primary: #667eea;
  --space-lg: 1.5rem;
}

.main-content {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

## 🎯 Co Się Stało

| Feature        | Przed          | Po                    |
| -------------- | -------------- | --------------------- |
| **API**        | OpenWeatherMap | Open-Meteo            |
| **API Key**    | Wymagany       | NIE POTRZEBNY         |
| **Dane**       | 5 dni          | 80 LAT                |
| **Geocoding**  | Nie            | Tak ✓                 |
| **Wykresy**    | Bieżący dzień  | Dowolny zakres        |
| **Statystyki** | Nie            | Min/Max/Avg           |
| **Komponenty** | 3              | 5 (+ HistoricalChart) |

## ⚡ Performance Tips

```javascript
// 1. Cache - Dane cache'ują się 5 minut
stateManager.subscribe('currentCity', (city) => {
  // Przy ponownym wyszukiwaniu - szybko!
});

// 2. Promise.all - Wszystko równolegle
await Promise.all([current, forecast]);
// Szybciej niż: await current; await forecast

// 3. Web Components - Tylko na żądanie
// Shadow DOM - nie wpływa na global style

// 4. Debounce w search - 300ms
// Nie wysyłamy requestu na każdy keypress
```

## 🚀 Gotowe do Deployment!

```bash
# Build? NIE POTRZEBA!
# Transpile? NIE POTRZEBA!
# Bundler? NIE POTRZEBA!

# Po prostu:
# 1. Push na GitHub
# 2. GitHub Pages
# 3. LIVE! 🎉

# lub
# 1. Push na Netlify
# 2. LIVE! 🎉

# lub
# 1. Uruchom na serwerze
# 2. LIVE! 🎉
```

---

**💡 Pamiętaj: Wszystko jest JavaScript - brak magii, brak frameworków! 🎓**
