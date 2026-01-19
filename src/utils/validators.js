export function isValidCity(city) {
    if (!city || typeof city !== 'string') return false;
    return city.trim().length >= 2 && city.trim().length <= 50;
}

export function isValidTemperature(temp) {
    return typeof temp === 'number' && temp > -100 && temp < 60;
}

export function isValidAPIKey(apiKey) {
    if (!apiKey) return false;
    return apiKey.length > 10 && apiKey !== 'TU_WSTAW_TWOJ_KLUCZ_API';
}

export function isValidWeatherData(data) {
    return (
        data &&
        typeof data === 'object' &&
        'main' in data &&
        'weather' in data &&
        'name' in data
    );
}

export function isValidForecastData(data) {
    return (
        data &&
        typeof data === 'object' &&
        'list' in data &&
        Array.isArray(data.list) &&
        data.list.length > 0
    );
}

export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

export function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function sanitizeString(str) {
    if (typeof str !== 'string') return '';

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
