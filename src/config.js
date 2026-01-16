/**
 * Configuration File
 * Centralizacja ustawień aplikacji
 */

export const CONFIG = {
    // API Settings - Open-Meteo (darmowy, bez klucza!)
    API: {
        // Current Weather API
        FORECAST_URL: 'https://api.open-meteo.com/v1/forecast',
        // Historical Data - archive API dla dużych zakresów (daily, ale 80 lat!)
        HISTORICAL_URL: 'https://archive-api.open-meteo.com/v1/archive',
        // Geocoding (miasta na współrzędne)
        GEOCODING_URL: 'https://geocoding-api.open-meteo.com/v1/search',
        // Parametry
        TIMEZONE: 'auto',
        UNITS: 'metric', // Celsjusze
        LANG: 'pl',
    },

    // App Settings
    APP: {
        CACHE_DURATION: 5 * 60 * 1000, // 5 minut
        DEFAULT_CITY: 'Warsaw',
        TIMEOUT: 10000, // 10 sekund
    },

    // UI Constants
    UI: {
        DEBOUNCE_DELAY: 300,
        ANIMATION_DURATION: 300,
    },

    // Storage Keys
    STORAGE: {
        FAVORITES: 'weather_favorites',
        LAST_SEARCH: 'weather_last_search',
        THEME: 'weather_theme',
    },
};

// CSS Variables dla dynamicznych wartości
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
