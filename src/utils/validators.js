export function isValidCity(city) {
    if (!city || typeof city !== 'string') return false;
    return city.trim().length >= 2 && city.trim().length <= 50;
}

export function isValidTemperature(temp) {
    return typeof temp === 'number' && temp > -100 && temp < 60;
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
