/**
 * Validators - Funkcje do walidacji danych
 */

/**
 * Waliduje nazwę miasta
 * @param {string} city - Nazwa miasta
 * @returns {boolean}
 */
export function isValidCity(city) {
    if (!city || typeof city !== 'string') return false;
    return city.trim().length >= 2 && city.trim().length <= 50;
}

/**
 * Waliduje czy to poprawna temperatura
 * @param {number} temp - Temperatura
 * @returns {boolean}
 */
export function isValidTemperature(temp) {
    return typeof temp === 'number' && temp > -100 && temp < 60;
}

/**
 * Waliduje czy API key jest ustawiony
 * @param {string} apiKey - API Key
 * @returns {boolean}
 */
export function isValidAPIKey(apiKey) {
    if (!apiKey) return false;
    return apiKey.length > 10 && apiKey !== 'TU_WSTAW_TWOJ_KLUCZ_API';
}

/**
 * Waliduje dane pogodowe z API
 * @param {Object} data - Dane z API
 * @returns {boolean}
 */
export function isValidWeatherData(data) {
    return (
        data &&
        typeof data === 'object' &&
        'main' in data &&
        'weather' in data &&
        'name' in data
    );
}

/**
 * Waliduje dane prognozy
 * @param {Object} data - Dane prognozy
 * @returns {boolean}
 */
export function isValidForecastData(data) {
    return (
        data &&
        typeof data === 'object' &&
        'list' in data &&
        Array.isArray(data.list) &&
        data.list.length > 0
    );
}

/**
 * Waliduje format emaila
 * @param {string} email - Email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Waliduje URL
 * @param {string} url - URL
 * @returns {boolean}
 */
export function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Sanityzuje string'i (bezpieczeństwo)
 * @param {string} str - String do sanityzacji
 * @returns {string}
 */
export function sanitizeString(str) {
    if (typeof str !== 'string') return '';

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
