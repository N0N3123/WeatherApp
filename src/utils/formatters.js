export function formatTemperature(temp) {
    return `${Math.round(temp)}°C`;
}

export function formatWeatherDescription(description) {
    return description.charAt(0).toUpperCase() + description.slice(1);
}

export function formatWindSpeed(mps) {
    return Math.round(mps * 3.6);
}

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

export function formatHumidity(humidity) {
    return `${humidity}%`;
}

export function formatPressure(pressure) {
    return `${pressure} hPa`;
}

export function formatRain(rain) {
    return `${(rain || 0).toFixed(1)} mm`;
}
