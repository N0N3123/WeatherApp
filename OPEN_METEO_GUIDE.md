# 🌤️ Weather App - Open-Meteo Edition

Nowoczesna aplikacja pogodowa z **80 latami danych historycznych** - bez API Key!

## ✨ Co jest nowego

✅ **Open-Meteo API** - Darmowe, bez klucza!  
✅ **80 lat danych historycznych** - Archive API  
✅ **Geocoding** - Miasta na współrzędne GPS  
✅ **Wykresy historyczne** - Temperature, opady, wiatr  
✅ **Statystyki** - Min/max/średnia

## 🚀 Szybki Start

1. **Otwórz** `index.html` w przeglądarce (Live Server lub Python)
2. **Wyszukaj** miasto w search boxie
3. **Czekaj** na dane (może chwilę trwać - pobieramy z API)
4. **Wybierz** zakresy dat w sekcji "Historia pogody"
5. **Kliknij** "Załaduj" aby pobrać dane historyczne

## 📊 Co można robić

### Bieżąca Pogoda

- Temperatura, wiatr, wilgotność
- Ciśnienie, widoczność
- Feels like temperature

### Prognoza 7-Dniowa

- Temperatura min/max
- Warunki pogodowe
- Prędkość wiatru

### Historia (80 lat!)

- Wybierz zakres dat
- Wybierz metrikę (temperatura, opady, wiatr)
- Zobacz wykresy i statystyki
- Min/max/średnia dla okresu

## 🔧 Opis API

### Open-Meteo (Darmowy!)

**Current Weather:**

```
https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41...
```

**Historical Data (80 lat):**

```
https://archive-api.open-meteo.com/v1/archive?latitude=52.52&longitude=13.41&start_date=1950-01-01&end_date=2024-01-16...
```

**Geocoding:**

```
https://geocoding-api.open-meteo.com/v1/search?name=Warsaw&count=1...
```

Wszystkie endpointy są **DARMOWE** i **bez limitów!**

## 💻 Debug Mode

W konsoli (F12):

```javascript
// Aplikacja
DEBUG.app;

// State
DEBUG.getState('currentCity');
DEBUG.setState('currentCity', 'London');

// Pobierz dane historyczne
DEBUG.fetchHistorical('London', '2023-01-01', '2024-01-16');

// Cache statystyki
DEBUG.getCacheStats();
```

## 📁 Struktura Plików

```
src/
├── api/
│   └── weatherService.js    ✨ Geocoding, Current, Historical
├── components/
│   ├── CurrentWeather.js
│   ├── Forecast.js
│   ├── Search.js
│   ├── Chart.js
│   └── HistoricalChart.js   ✨ Nowy komponent dla historii
├── state/
│   └── stateManager.js       ✨ Dodano historicalData
└── config.js                 ✨ Open-Meteo URLs
```

## 🎓 Koncepty z Kursu

### Web Components

```javascript
class CurrentWeatherComponent extends HTMLElement {
  connectedCallback() {}
}
customElements.define('current-weather', CurrentWeatherComponent);
```

### State Management

```javascript
stateManager.subscribe('historicalData', (data) => {
  // Robi się coś gdy dane się zmienią
});
```

### Async/Await + Promises

```javascript
const [current, forecast] = await Promise.all([
  weatherService.getCurrentWeather(city),
  weatherService.getForecast(city),
]);
```

### ES6 Modules

```javascript
import { weatherService } from './api/weatherService.js';
export { weatherService };
```

### CSS Variables + Grid

```css
:root {
  --primary: #667eea;
  --space-lg: 1.5rem;
}

.container {
  display: grid;
  gap: var(--space-lg);
}
```

### Geocoding (Nowe!)

```javascript
const coords = await geocodeCity('Warsaw');
// { latitude: 52.22, longitude: 21.01, name: 'Warsaw', ... }
```

### Historical Data (Nowe!)

```javascript
const history = await weatherService.getHistoricalData(
  'Warsaw',
  '1950-01-01',
  '2024-01-16'
);
// { timestamps, temperatureMean, precipitation, windSpeed, ... }
```

## 🎨 Customization

### Zmień domyślne miasto

W `src/config.js`:

```javascript
DEFAULT_CITY: 'London',
```

### Dodaj więcej miast do sugestii

W `src/components/Search.js`:

```javascript
const cities = [
    'Warsaw', 'London', 'Tokyo', ..., 'TWOJE_MIASTO'
];
```

### Zmień kolory

W `src/styles/main.css`:

```css
:root {
  --primary: #YOUR_COLOR;
}
```

## ⚡ Ciekawostki

- **Geocoding Automatyczne** - Wpisz np. "Paris" a system skonwertuje na współrzędne
- **Caching** - Dane są cache'owane 5 minut
- **80 lat danych!** - Możesz zobaczć pogodę z roku 1950!
- **WMO Codes** - Używamy standardowych kodów pogody (0=sunny, 1=cloudy, etc.)
- **Timezone Support** - Każde miasto ma swój timezone

## 🚀 Co Dalej?

- [ ] LocalStorage dla ulubionych miast
- [ ] Dark mode
- [ ] Więcej metryk (UV index, visibility, humidity)
- [ ] Export do CSV
- [ ] Porównanie miast
- [ ] PWA (offline support)
- [ ] Mobile app (React Native?)

## 📚 Dokumentacja

- [Open-Meteo API](https://open-meteo.com/en/docs)
- [MDN Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Chart.js](https://www.chartjs.org/)
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

## 🐛 Troubleshooting

**"Nie znaleziono miasta"**

- Geocoding API może nie znać miasteczka
- Spróbuj większego miasta
- Sprawdź spelling

**Dane historyczne nie ładują się**

- Open-Meteo ma limity na request'y
- Czekaj kilka sekund między requestami
- Spróbuj mniejszy zakres dat

**Wykresy nie pojawiają się**

- Chart.js musi się załadować
- Sprawdź czy CDN jest dostępny
- Otwórz DevTools console

## 📝 Notatki Projektowe

### Architektura

```
App (DOMContentLoaded)
  ├── StateManager (Observable)
  ├── WeatherService (API + Geocoding)
  └── Komponenty (Web Components)
       ├── Search (Input + Events)
       ├── CurrentWeather (Shadow DOM)
       ├── Forecast (Daily data)
       ├── Chart (Chart.js wrapper)
       └── HistoricalChart (Nowy!)
```

### Data Flow

```
User Input
  ↓
Search Component
  ↓ (event: search)
App.fetchWeatherData()
  ↓
WeatherService.geocodeCity() + getCurrentWeather() + getForecast()
  ↓ (Promise.all)
StateManager.set()
  ↓ (subscribe notify)
Komponenty aktualizują UI
```

### Historical Data Flow

```
User Input (date range)
  ↓
HistoricalChart Component
  ↓ (event: historical-requested)
App.fetchHistoricalData()
  ↓
WeatherService.getHistoricalData()
  ↓
StateManager.setHistoricalData()
  ↓
HistoricalChart.updateChart()
  ↓
Chart.js renderuje wykres
```

---

**Made with ❤️ | Open-Meteo Forever | No API Key Required 🎉**
