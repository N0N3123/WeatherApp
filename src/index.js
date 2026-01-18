/**
 * Main Application Entry Point
 * Inicjalizacja aplikacji, event handling, życie komponentów
 */

// Importuj wszystko co potrzebne
import { CONFIG } from './config.js';
import { weatherService } from './api/weatherService.js';
import { authService } from './api/authService.js';
import { stateManager } from './state/stateManager.js';

// Importuj komponenty (rejestruje je automatycznie)
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

// ============================================================
// INICJALIZACJA
// ============================================================

class WeatherApp {
    constructor() {
        this.elements = {};
        this.setupElements();
        this.setupStateListeners();
        this.setupEventListeners();
        this.init();
    }

    /**
     * Pobierz referencje do elementów DOM
     */
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
        };

        if (this.elements.authBtn) {
            this.elements.authBtn.textContent = authService.isAuthenticated()
                ? 'Wyloguj się'
                : 'Zaloguj się';
        }

        console.log('✅ Elements setup');
    }

    /**
     * Subskrypcje do zmian stanu
     */
    setupStateListeners() {
        // Nasłuchuj na zmiany loading state
        stateManager.subscribe('isLoading', (isLoading) => {
            this.toggleLoading(isLoading);
        });

        // Nasłuchuj na błędy
        stateManager.subscribe('error', (error) => {
            if (error) {
                this.showError(error);
            }
        });

        // Nasłuchuj na zmiany miasta
        stateManager.subscribe('currentCity', (city) => {
            console.log('🏙️ Zmienione miasto:', city);
        });

        // User change -> toggle logout button
        stateManager.subscribe('user', (user) => {
            const btn = this.elements.authBtn;
            if (btn) {
                btn.textContent = user ? 'Wyloguj się' : 'Zaloguj się';
            }
        });

        console.log('✅ State listeners setup');
    }

    /**
     * Event listenery
     */
    setupEventListeners() {
        // Search component - wyszukiwanie
        this.elements.searchWidget.addEventListener('search', (e) => {
            const city = e.detail.city;
            this.fetchWeatherData(city);
        });

        // Search component - błędy
        this.elements.searchWidget.addEventListener('error', (e) => {
            this.showError(e.detail.message);
        });

        // Current weather - pogoda załadowana
        this.elements.currentWeather.addEventListener('weather-loaded', (e) => {
            console.log('⛅ Pogoda załadowana:', e.detail.weather);
        });

        // Forecast - kliknięcie na dzień
        this.elements.forecastWidget.addEventListener(
            'forecast-selected',
            (e) => {
                console.log('📅 Wybrany timestamp:', e.detail.timestamp);
            },
        );

        // Historical Chart - request danych historycznych
        const historicalChart = document.querySelector('historical-chart');
        if (historicalChart) {
            historicalChart.addEventListener('historical-requested', (e) => {
                const { city, startDate, endDate } = e.detail;
                this.fetchHistoricalData(city, startDate, endDate);
            });
        }

        // Auth complete from login component
        if (this.elements.loginWidget) {
            this.elements.loginWidget.addEventListener('auth-complete', () => {
                if (this.elements.authBtn) {
                    this.elements.authBtn.textContent = 'Wyloguj się';
                }
                if (this.elements.searchHistory) {
                    this.elements.searchHistory.refresh();
                }
                // Po zalogowaniu odśwież favorites z backendu localStorage
                stateManager.set('favorites', authService.getFavorites());
            });
        }

        // Auth button click
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

        console.log('✅ Event listeners setup');
    }

    /**
     * Inicjalizacja aplikacji
     */
    async init() {
        console.log('🚀 WeatherApp inicjalizacja - Open-Meteo API');

        // Jeśli sesja istnieje, ustaw user i favorites
        const session = authService.getCurrentSession();
        if (session) {
            stateManager.loginUser({
                id: session.id,
                username: session.username,
            });
        }

        // 1. Sprawdź, czy mamy zapisane miasto w StateManager (z LocalStorage)
        const savedCity = stateManager.get('currentCity');

        // 2. Jeśli jest zapisane, użyj go. Jeśli nie, weź z CONFIG (Warsaw)
        const cityToLoad = savedCity || CONFIG.APP.DEFAULT_CITY;

        console.log(`🌍 Wczytuję miasto startowe: ${cityToLoad}`);
        await this.fetchWeatherData(cityToLoad);

        console.log('✅ WeatherApp gotowa!');
    }

    /**
     * Pobierz dane pogody dla miasta
     * Asynchroniczne operacje - Promise.all
     */
    async fetchWeatherData(city) {
        try {
            stateManager.setLoading(true);
            stateManager.setError(null);
            stateManager.setCurrentCity(city);

            // Pobierz bieżącą pogodę i prognozę równolegle (Promise.all)
            const [currentData, forecastData] = await Promise.all([
                weatherService.getCurrentWeather(city),
                weatherService.getForecast(city),
            ]);

            // Zaktualizuj state jednocześnie
            stateManager.setMultiple({
                currentWeather: currentData,
                forecast: forecastData,
                isLoading: false,
            });

            // Powiadom UI
            this.updateUIWithWeatherData(currentData);

            console.log('✅ Dane załadowane dla:', city);
        } catch (error) {
            console.error('❌ Błąd pobierania danych:', error);
            stateManager.setMultiple({
                error: error.message,
                isLoading: false,
            });
        }
    }

    /**
     * Zaktualizuj UI danymi pogody
     */
    updateUIWithWeatherData(weatherData) {
        // Custom events do aktualizacji komponentów
        // Lub mogą sami się subskrybować do state

        // Pokaż komunikat o aktualizacji
        const time = new Date().toLocaleTimeString('pl-PL');
        console.log(`📍 Dane dla ${weatherData.name} zaktualizowane o ${time}`);

        // Dodaj do historii jeśli user zalogowany
        if (authService.isAuthenticated()) {
            authService.addToHistory(weatherData.name, weatherData);

            // Refresh historii w komponencie
            const historyComponent = document.querySelector('search-history');
            if (historyComponent) {
                historyComponent.refresh();
            }
        }
    }

    /**
     * Pobierz dane historyczne
     * @param {string} city - Miasto
     * @param {string} startDate - Data początkowa (YYYY-MM-DD)
     * @param {string} endDate - Data końcowa (YYYY-MM-DD)
     */
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

            console.log('✅ Dane historyczne załadowane');
        } catch (error) {
            console.error('❌ Błąd pobierania danych historycznych:', error);
            stateManager.setMultiple({
                error: error.message,
                isLoading: false,
            });
        }
    }

    /**
     * Toggle loading overlay
     */
    toggleLoading(isLoading) {
        if (isLoading) {
            this.elements.loadingOverlay.classList.remove('hidden');
        } else {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Pokaż error notification
     */
    showError(message) {
        const errorEl = this.elements.errorNotification;
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');

        // Ukryj po 5 sekundach
        setTimeout(() => {
            errorEl.classList.add('hidden');
        }, 5000);
    }

    /**
     * Debug mode
     */
    debug() {
        console.group('🔍 WeatherApp Debug');
        console.log('Config:', CONFIG);
        console.log('State:', stateManager.get());
        console.log('Elements:', this.elements);
        console.groupEnd();
    }
}

// ============================================================
// START APLIKACJI
// ============================================================

// Poczekaj aż DOM się załaduje
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WeatherApp();

    // Udostępnij debug w konsoli
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

    console.log('💡 Wpisz DEBUG w konsoli aby debugować aplikację');
});

// Hot reload w development (jeśli będziesz modyfikować pliki)
if (import.meta.hot) {
    import.meta.hot.accept((module) => {
        console.log('🔄 Reloading...');
        location.reload();
    });
}

export { WeatherApp };
