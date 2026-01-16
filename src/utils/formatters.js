/**
 * Formatters - Funkcje pomocnicze do formatowania danych
 */

/**
 * Formatuje temperaturę
 * @param {number} temp - Temperatura w Celsjuszach
 * @returns {string}
 */
export function formatTemperature(temp) {
    return `${Math.round(temp)}°C`;
}

/**
 * Formatuje opis pogody
 * @param {string} description - Opis z API
 * @returns {string}
 */
export function formatWeatherDescription(description) {
    return description.charAt(0).toUpperCase() + description.slice(1);
}

/**
 * Konwertuje prędkość wiatru m/s na km/h
 * @param {number} mps - Metrów na sekundę
 * @returns {number}
 */
export function formatWindSpeed(mps) {
    return Math.round(mps * 3.6);
}

/**
 * Formatuje czas z timestamp'a
 * @param {number} timestamp - Unix timestamp
 * @param {string} format - Format ('time', 'date', 'datetime')
 * @returns {string}
 */
export function formatTime(timestamp, format = 'datetime') {
    const date = new Date(timestamp * 1000);

    const options = {
        time: { hour: '2-digit', minute: '2-digit' },
        date: { year: 'numeric', month: '2-digit', day: '2-digit' },
        datetime: {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        },
    };

    return date.toLocaleDateString('pl-PL', options[format]);
}

/**
 * Zwraca emoji dla warunku pogodowego
 * @param {string} main - Główny warunek (Rain, Snow, itd.)
 * @returns {string}
 */
export function getWeatherEmoji(main) {
    const emojiMap = {
        Clear: '☀️',
        Clouds: '☁️',
        Rain: '🌧️',
        Drizzle: '🌦️',
        Thunderstorm: '⛈️',
        Snow: '❄️',
        Mist: '🌫️',
        Smoke: '💨',
        Haze: '🌫️',
        Dust: '🌪️',
        Fog: '🌫️',
        Sand: '🌪️',
        Ash: '🌋',
        Squall: '💨',
        Tornado: '🌪️',
    };

    return emojiMap[main] || '🌤️';
}

/**
 * Formatuje kierunek wiatru na litery
 * @param {number} degrees - Stopnie (0-360)
 * @returns {string}
 */
export function formatWindDirection(degrees) {
    const directions = [
        'N',
        'NNE',
        'NE',
        'ENE',
        'E',
        'ESE',
        'SE',
        'SSE',
        'S',
        'SSW',
        'SW',
        'WSW',
        'W',
        'WNW',
        'NW',
        'NNW',
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

/**
 * Formatuje wilgotność
 * @param {number} humidity - Procenty
 * @returns {string}
 */
export function formatHumidity(humidity) {
    return `${humidity}%`;
}

/**
 * Formatuje ciśnienie
 * @param {number} pressure - hPa
 * @returns {string}
 */
export function formatPressure(pressure) {
    return `${pressure} hPa`;
}

/**
 * Zwraca dzień tygodnia
 * @param {number} timestamp - Unix timestamp
 * @returns {string}
 */
export function getDayOfWeek(timestamp) {
    const date = new Date(timestamp * 1000);
    const days = [
        'Niedziela',
        'Poniedziałek',
        'Wtorek',
        'Środa',
        'Czwartek',
        'Piątek',
        'Sobota',
    ];
    return days[date.getDay()];
}

/**
 * Formatuje sumę opadów
 * @param {number} rain - Milimetry
 * @returns {string}
 */
export function formatRain(rain) {
    return `${(rain || 0).toFixed(1)} mm`;
}

/**
 * Formatuje wskaźnik UV
 * @param {number} uvi - Indeks UV
 * @returns {string}
 */
export function formatUVIndex(uvi) {
    if (uvi <= 2) return '🟢 Niski';
    if (uvi <= 5) return '🟡 Umiarkowany';
    if (uvi <= 7) return '🟠 Wysoki';
    if (uvi <= 10) return '🔴 Bardzo wysoki';
    return '🟣 Ekstremalny';
}
