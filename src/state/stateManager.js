import { authService } from '../api/authService.js';

class StateManager {
    constructor() {
        const savedUserRaw = localStorage.getItem('weather_user');
        let savedUser = null;
        if (savedUserRaw) {
            try {
                savedUser = JSON.parse(savedUserRaw);
            } catch (e) {
                localStorage.removeItem('weather_user');
            }
        }
        const savedFavorites = authService.getFavorites();
        const lastCity = localStorage.getItem('weather_last_city');

        this.state = {
            user: savedUser || null,
            currentCity: lastCity || 'Warsaw',
            currentWeather: null,
            forecast: null,
            historicalData: null,
            favorites: savedFavorites,
            isLoading: false,
            error: null,
            theme: 'light',
            lastUpdated: null,
        };

        this.subscribers = new Map();
        this.history = [];
        this.maxHistory = 50;
    }

    get(path) {
        if (!path) return this.state;
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    set(path, value) {
        const oldValue = this.get(path);
        if (oldValue === value) return;

        const keys = path.split('.');
        const lastKey = keys.pop();
        let obj = this.state;

        for (const key of keys) {
            if (!(key in obj)) obj[key] = {};
            obj = obj[key];
        }

        obj[lastKey] = value;

        if (path === 'user') {
            if (value)
                localStorage.setItem('weather_user', JSON.stringify(value));
            else localStorage.removeItem('weather_user');
        }
        if (path === 'currentCity') {
            localStorage.setItem('weather_last_city', value);
        }

        this.addToHistory(path, oldValue, value);
        this.notify(path, value, oldValue);
    }

    setMultiple(updates) {
        Object.entries(updates).forEach(([path, value]) => {
            this.set(path, value);
        });
    }

    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, []);
        }
        this.subscribers.get(path).push(callback);
        return () => {
            const callbacks = this.subscribers.get(path);
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
        };
    }

    notify(path, newValue, oldValue) {
        if (this.subscribers.has(path)) {
            this.subscribers.get(path).forEach((cb) => {
                try {
                    cb(newValue, oldValue);
                } catch (e) {}
            });
        }
        if (this.subscribers.has('*')) {
            this.subscribers.get('*').forEach((cb) => {
                try {
                    cb({ path, newValue, oldValue });
                } catch (e) {}
            });
        }
    }

    loginUser(user) {
        this.set('user', user);
        this.set('favorites', authService.getFavorites());
    }
    logoutUser() {
        this.set('user', null);
        this.set('favorites', []);
    }

    setHistoricalData(data) {
        this.set('historicalData', data);
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

    toggleFavorite(city) {
        const favorites = authService.getFavorites();

        if (favorites.includes(city)) {
            authService.removeFavorite(city);
        } else {
            authService.addFavorite(city);
        }
        const updated = authService.getFavorites();
        this.set('favorites', updated);
    }

    addToHistory(path, oldValue, newValue) {
        this.history.push({
            timestamp: new Date().toISOString(),
            path,
            oldValue,
            newValue,
        });
        if (this.history.length > this.maxHistory) this.history.shift();
    }

    debug() {}
}

export const stateManager = new StateManager();
