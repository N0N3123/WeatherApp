export const CONFIG = {
    API: {
        FORECAST_URL: 'https://api.open-meteo.com/v1/forecast',
        HISTORICAL_URL: 'https://archive-api.open-meteo.com/v1/archive',
        GEOCODING_URL: 'https://geocoding-api.open-meteo.com/v1/search',
        TIMEZONE: 'auto',
        UNITS: 'metric',
        LANG: 'pl',
    },

    APP: {
        CACHE_DURATION: 5 * 60 * 1000,
        DEFAULT_CITY: 'Warsaw',
        TIMEOUT: 10000,
    },

    UI: {
        DEBOUNCE_DELAY: 300,
        ANIMATION_DURATION: 300,
    },

    STORAGE: {
        FAVORITES: 'weather_favorites',
        LAST_SEARCH: 'weather_last_search',
        THEME: 'weather_theme',
    },
};

export const CSS_VARIABLES = {
    PRIMARY: '#3498db',
    SECONDARY: '#e74c3c',
    SUCCESS: '#2ecc71',
    WARNING: '#f39c12',
    DARK: '#2c3e50',
    LIGHT: '#ecf0f1',
    RADIUS: '8px',
    SHADOW: '0 2px 8px rgba(0, 0, 0, 0.1)',
};
