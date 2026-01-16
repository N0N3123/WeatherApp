/**
 * State Manager - Centralne zarządzanie stanem aplikacji
 * Observable pattern + Event Emitter
 */

class StateManager {
    constructor() {
        // Inicjalny stan
        this.state = {
            currentCity: 'Warsaw',
            currentWeather: null,
            forecast: null,
            historicalData: null, // Nowe - dane historyczne
            favorites: [],
            isLoading: false,
            error: null,
            theme: 'light',
            lastUpdated: null,
        };

        // Subscribers do zmian stanu
        this.subscribers = new Map();

        // Historia stanów (do debugowania)
        this.history = [];
        this.maxHistory = 50;
    }

    /**
     * Pobiera wartość ze stanu
     * @param {string} path - Ścieżka do wartości (może być zagnieżdżona)
     * @returns {*}
     */
    get(path) {
        if (!path) return this.state;

        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    /**
     * Ustawia wartość w stanie i powiadamia subscribers
     * @param {string} path - Ścieżka do wartości
     * @param {*} value - Nowa wartość
     */
    set(path, value) {
        const oldValue = this.get(path);

        if (oldValue === value) return; // Brak zmian

        // Ustawienie wartości
        const keys = path.split('.');
        const lastKey = keys.pop();
        let obj = this.state;

        for (const key of keys) {
            if (!(key in obj)) {
                obj[key] = {};
            }
            obj = obj[key];
        }

        obj[lastKey] = value;

        // Zapisanie w historii
        this.addToHistory(path, oldValue, value);

        // Powiadomienie subscribers
        this.notify(path, value, oldValue);

        console.log(`📍 State zmieniony: ${path}`, {
            old: oldValue,
            new: value,
        });
    }

    /**
     * Aktualizuje wiele wartości na raz
     * @param {Object} updates - Mapa zmian
     */
    setMultiple(updates) {
        Object.entries(updates).forEach(([path, value]) => {
            this.set(path, value);
        });
    }

    /**
     * Subskrypcja do zmian konkretnej ścieżki
     * @param {string} path - Ścieżka do nasłuchiwania
     * @param {Function} callback - Funkcja do wywołania
     * @returns {Function} Unsubscribe funkcja
     */
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, []);
        }

        this.subscribers.get(path).push(callback);

        // Zwróć funkcję do unsubscribe
        return () => {
            const callbacks = this.subscribers.get(path);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Powiadamia wszystkich subscribers o zmianach
     * @private
     */
    notify(path, newValue, oldValue) {
        // Powiadomienie dla konkretnej ścieżki
        if (this.subscribers.has(path)) {
            this.subscribers.get(path).forEach((callback) => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error('❌ Błąd w callback:', error);
                }
            });
        }

        // Powiadomienie dla zmian globalnych
        if (this.subscribers.has('*')) {
            this.subscribers.get('*').forEach((callback) => {
                try {
                    callback({ path, newValue, oldValue });
                } catch (error) {
                    console.error('❌ Błąd w global callback:', error);
                }
            });
        }
    }

    /**
     * Subskrypcja do wszystkich zmian
     * @param {Function} callback - Funkcja do wywołania
     * @returns {Function} Unsubscribe funkcja
     */
    subscribeToAll(callback) {
        return this.subscribe('*', callback);
    }

    /**
     * Akcje (metody które modyfikują stan)
     */

    setCurrentWeather(weatherData) {
        this.set('currentWeather', weatherData);
        this.set('lastUpdated', new Date().toISOString());
    }

    setForecast(forecastData) {
        this.set('forecast', forecastData);
    }

    setHistoricalData(historicalData) {
        this.set('historicalData', historicalData);
    }

    setCurrentCity(city) {
        this.set('currentCity', city);
    }

    setLoading(isLoading) {
        this.set('isLoading', isLoading);
    }

    setError(error) {
        this.set('error', error);
    }

    addFavorite(city) {
        const favorites = this.get('favorites');
        if (!favorites.includes(city)) {
            this.set('favorites', [...favorites, city]);
        }
    }

    removeFavorite(city) {
        const favorites = this.get('favorites');
        this.set(
            'favorites',
            favorites.filter((c) => c !== city)
        );
    }

    setTheme(theme) {
        this.set('theme', theme);
    }

    /**
     * Reset stanu
     */
    reset() {
        this.state = {
            currentCity: 'Warsaw',
            currentWeather: null,
            forecast: null,
            favorites: [],
            isLoading: false,
            error: null,
            theme: 'light',
            lastUpdated: null,
        };
        this.history = [];
        this.subscribers.clear();
    }

    /**
     * Historia zmian (dla debugowania)
     * @private
     */
    addToHistory(path, oldValue, newValue) {
        this.history.push({
            timestamp: new Date().toISOString(),
            path,
            oldValue,
            newValue,
        });

        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    /**
     * Zwraca historię zmian
     * @returns {Array}
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Debugowanie - wyświetl cały stan
     */
    debug() {
        console.group('🔍 StateManager Debug');
        console.log('State:', this.state);
        console.log('History:', this.history);
        console.log('Subscribers count:', this.subscribers.size);
        console.groupEnd();
    }
}

// Singleton
export const stateManager = new StateManager();
