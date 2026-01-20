import { CONFIG } from './config.js';
import { weatherService } from './api/weatherService.js';
import { authService } from './api/authService.js';
import { stateManager } from './state/stateManager.js';

import './components/Login.js';
import './components/SearchHistory.js';
import './components/CurrentWeather.js';
import './components/Search.js';
import './components/Forecast.js';
import './components/DetailedForecast.js';
import './components/TodayHighlights.js';
import './components/Chart.js';
import './components/HistoricalChart.js';
import './components/Favorites.js';
import './components/UserProfile.js';

class WeatherApp {
    constructor() {
        this.elements = {};
        this.setupElements();
        this.setupStateListeners();
        this.setupEventListeners();
        this.init();
    }

    setupElements() {
        this.elements = {
            root: document.getElementById('root'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            errorNotification: document.getElementById('errorNotification'),
            loginWidget: document.getElementById('loginWidget'),
            searchWidget: document.getElementById('searchWidget'),
            currentWeather: document.getElementById('currentWeather'),
            forecastWidget: document.getElementById('forecastWidget'),
            chartWidget: document.getElementById('chartWidget'),
            historicalChart: document.getElementById('historicalChart'),
            searchHistory: document.getElementById('searchHistory'),
            authBtn: document.getElementById('authBtn'),
            themeToggle: document.getElementById('themeToggle'),
        };

        if (this.elements.authBtn) {
            this.elements.authBtn.textContent = authService.isAuthenticated()
                ? 'Wyloguj się'
                : 'Zaloguj się';
        }

        this.initTheme();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('weather_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme =
            document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('weather_theme', newTheme);
        this.updateThemeIcon(newTheme);

        const chartWidget = document.querySelector('weather-chart');
        if (chartWidget && chartWidget.drawChart) {
            chartWidget.drawChart();
        }

        const historicalChart = document.querySelector('historical-chart');
        if (historicalChart && historicalChart.drawChart) {
            historicalChart.drawChart();
        }
    }

    updateThemeIcon(theme) {
        if (this.elements.themeToggle) {
            this.elements.themeToggle.textContent =
                theme === 'dark' ? '☀️' : '🌙';
            this.elements.themeToggle.title =
                theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny';
        }
    }

    setupStateListeners() {
        stateManager.subscribe('isLoading', (isLoading) => {
            this.toggleLoading(isLoading);
        });

        stateManager.subscribe('error', (error) => {
            if (error) {
                this.showError(error);
            }
        });

        stateManager.subscribe('currentCity', () => {});

        stateManager.subscribe('user', (user) => {
            const btn = this.elements.authBtn;
            if (btn) {
                btn.textContent = user ? 'Wyloguj się' : 'Zaloguj się';
            }
        });
    }

    setupEventListeners() {
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        this.elements.searchWidget.addEventListener('search', (e) => {
            const city = e.detail.city;
            this.fetchWeatherData(city);
        });

        this.elements.searchWidget.addEventListener('error', (e) => {
            this.showError(e.detail.message);
        });

        if (this.elements.searchHistory) {
            this.elements.searchHistory.addEventListener(
                'history-select',
                (e) => {
                    const city = e.detail.city;
                    this.fetchWeatherData(city);
                },
            );
        }

        document.addEventListener('favorite-selected', (e) => {
            this.fetchWeatherData(e.detail.city);
        });

        this.elements.currentWeather.addEventListener(
            'weather-loaded',
            () => {},
        );

        this.elements.forecastWidget.addEventListener(
            'forecast-selected',
            () => {},
        );

        const historicalChart = document.querySelector('historical-chart');
        if (historicalChart) {
            historicalChart.addEventListener('historical-requested', (e) => {
                const { city, startDate, endDate } = e.detail;
                this.fetchHistoricalData(city, startDate, endDate);
            });
        }

        if (this.elements.loginWidget) {
            this.elements.loginWidget.addEventListener('auth-complete', () => {
                if (this.elements.authBtn) {
                    this.elements.authBtn.textContent = 'Wyloguj się';
                }
                if (this.elements.searchHistory) {
                    this.elements.searchHistory.refresh();
                }
                stateManager.set('favorites', authService.getFavorites());
            });
        }

        if (this.elements.authBtn) {
            this.elements.authBtn.addEventListener('click', () => {
                if (authService.isAuthenticated()) {
                    authService.logout();
                    stateManager.logoutUser();
                    stateManager.set('favorites', []);
                    if (this.elements.searchHistory) {
                        this.elements.searchHistory.refresh();
                    }
                    if (this.elements.authBtn) {
                        this.elements.authBtn.textContent = 'Zaloguj się';
                    }
                    return;
                }

                const loginComp = this.elements.loginWidget;
                if (loginComp?.showModal) {
                    loginComp.showModal();
                } else if (loginComp?.shadowRoot) {
                    loginComp.shadowRoot
                        .getElementById('modal')
                        ?.classList.remove('hidden');
                }
            });
        }
    }

    async init() {
        const session = authService.getCurrentSession();
        if (session) {
            stateManager.loginUser({
                id: session.id,
                username: session.username,
                email: session.email,
            });
        }

        const savedCity = stateManager.get('currentCity');
        const cityToLoad = savedCity || CONFIG.APP.DEFAULT_CITY;

        await this.fetchWeatherData(cityToLoad);
    }

    async fetchWeatherData(city) {
        try {
            stateManager.setLoading(true);
            stateManager.setError(null);
            stateManager.setCurrentCity(city);

            const [currentData, forecastData] = await Promise.all([
                weatherService.getCurrentWeather(city),
                weatherService.getForecast(city),
            ]);

            stateManager.setMultiple({
                currentWeather: currentData,
                forecast: forecastData,
                isLoading: false,
            });

            this.updateUIWithWeatherData(currentData);
        } catch (error) {
            stateManager.setMultiple({
                error: error.message,
                isLoading: false,
            });
        }
    }

    updateUIWithWeatherData(weatherData) {
        if (authService.isAuthenticated()) {
            authService.addToHistory(weatherData.name, weatherData);

            const historyComponent = document.querySelector('search-history');
            if (historyComponent) {
                historyComponent.refresh();
            }
        }
    }

    async fetchHistoricalData(city, startDate, endDate) {
        try {
            stateManager.setLoading(true);
            stateManager.setError(null);

            const historicalData = await weatherService.getHistoricalData(
                city,
                startDate,
                endDate,
            );
            stateManager.setHistoricalData(historicalData);
            stateManager.setLoading(false);
        } catch (error) {
            stateManager.setMultiple({
                error: error.message,
                isLoading: false,
            });
        }
    }

    toggleLoading(isLoading) {
        if (isLoading) {
            this.elements.loadingOverlay.classList.remove('hidden');
        } else {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }

    showError(message) {
        const errorEl = this.elements.errorNotification;
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');

        setTimeout(() => {
            errorEl.classList.add('hidden');
        }, 5000);
    }

    debug() {}
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new WeatherApp();

    window.DEBUG = {
        app: window.app,
        state: stateManager,
        api: weatherService,
        getState: (path) => stateManager.get(path),
        setState: (path, value) => stateManager.set(path, value),
        fetchHistorical: (city, startDate, endDate) =>
            window.app.fetchHistoricalData(city, startDate, endDate),
        getCacheStats: () => weatherService.getCacheStats(),
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(() => {
        location.reload();
    });
}

export { WeatherApp };
