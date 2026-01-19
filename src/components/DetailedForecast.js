import { stateManager } from '../state/stateManager.js';
import {
    formatTemperature,
    getWeatherEmoji,
    formatWindSpeed,
    formatRain,
} from '../utils/formatters.js';

class DetailedForecastComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.selectedForecast = null;
        this.forecast = null;
        this.isOpen = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();

        stateManager.subscribe('forecast', (data) => {
            this.forecast = data;
        });

        console.log('✅ DetailedForecastComponent mounted');
    }

    setupEventListeners() {
        document.addEventListener('forecast-selected', (e) => {
            console.log('📅 Event forecast-selected otrzymany:', e.detail);
            this.handleDaySelected(e.detail.timestamp);
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    --primary-color: #667eea;
                    --secondary-color: #764ba2;
                    --accent-color: #f093fb;
                    --text-dark: #2d3748;
                    --text-light: #718096;
                }

                .modal-overlay {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(5px);
                    z-index: 999;
                    animation: fadeIn 0.3s ease-out;
                }

                .modal-overlay.active {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                .modal-content {
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                    border-radius: 20px;
                    padding: 0;
                    color: white;
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(60px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .modal-header {
                    padding: 2rem 2rem 1rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                }

                .header-info {
                    flex: 1;
                }

                .day-name {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0;
                    text-transform: capitalize;
                }

                .day-date {
                    font-size: 0.9rem;
                    opacity: 0.85;
                    margin: 0.3rem 0 0 0;
                }

                .close-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.5rem 0.8rem;
                    border-radius: 8px;
                    transition: all 0.2s;
                    line-height: 1;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.05);
                }

                .modal-body {
                    padding: 2rem;
                }

                .main-weather {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    margin-bottom: 2.5rem;
                    padding: 1.5rem;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                }

                .weather-icon-large {
                    font-size: 4rem;
                }

                .weather-main-info {
                    flex: 1;
                }

                .weather-description {
                    font-size: 1.2rem;
                    opacity: 0.9;
                    text-transform: capitalize;
                    margin: 0.5rem 0;
                }

                .temperature-range {
                    display: flex;
                    gap: 2rem;
                    margin-top: 1rem;
                }

                .temp-item {
                    display: flex;
                    flex-direction: column;
                }

                .temp-label {
                    font-size: 0.8rem;
                    opacity: 0.7;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .temp-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-top: 0.2rem;
                }

                .details-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .detail-card {
                    background: rgba(255, 255, 255, 0.12);
                    padding: 1.2rem;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    transition: all 0.3s;
                }

                .detail-card:hover {
                    background: rgba(255, 255, 255, 0.18);
                    transform: translateY(-3px);
                }

                .detail-icon {
                    font-size: 1.8rem;
                    margin-bottom: 0.5rem;
                }

                .detail-label {
                    font-size: 0.75rem;
                    opacity: 0.7;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 0.3rem;
                }

                .detail-value {
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .day-navigation {
                    display: flex;
                    gap: 1rem;
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.2);
                }

                .nav-btn {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.15);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 0.8rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    font-weight: 600;
                }

                .nav-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.25);
                    transform: translateY(-2px);
                }

                .nav-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .forecast-preview {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
                    gap: 0.5rem;
                    margin-top: 1rem;
                }

                .preview-item {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 0.8rem;
                    border-radius: 8px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 2px solid transparent;
                }

                .preview-item:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .preview-item.active {
                    background: rgba(255, 255, 255, 0.3);
                    border-color: var(--accent-color);
                }

                .preview-date {
                    font-size: 0.7rem;
                    opacity: 0.8;
                    margin-bottom: 0.2rem;
                }

                .preview-icon {
                    font-size: 1.2rem;
                    margin: 0.2rem 0;
                }

                .preview-temp {
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .loading {
                    text-align: center;
                    padding: 2rem;
                    opacity: 0.7;
                }

                @media (max-width: 600px) {
                    .modal-content {
                        border-radius: 16px 16px 0 0;
                    }

                    .modal-header {
                        padding: 1.5rem 1.5rem 1rem 1.5rem;
                    }

                    .modal-body {
                        padding: 1.5rem;
                    }

                    .main-weather {
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .details-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>

            <div class="modal-overlay" id="modalOverlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="header-info">
                            <h2 class="day-name" id="dayName"></h2>
                            <p class="day-date" id="dayDate"></p>
                        </div>
                        <button class="close-btn" id="closeBtn" title="Zamknij">✕</button>
                    </div>

                    <div class="modal-body">
                        <div class="main-weather">
                            <div class="weather-icon-large" id="mainIcon"></div>
                            <div class="weather-main-info">
                                <div class="weather-description" id="weatherDesc"></div>
                                <div class="temperature-range">
                                    <div class="temp-item">
                                        <div class="temp-label">Maksimum</div>
                                        <div class="temp-value" id="tempMax"></div>
                                    </div>
                                    <div class="temp-item">
                                        <div class="temp-label">Minimum</div>
                                        <div class="temp-value" id="tempMin"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="details-grid">
                            <div class="detail-card">
                                <div class="detail-icon">💧</div>
                                <div class="detail-label">Opady</div>
                                <div class="detail-value" id="precipitation"></div>
                            </div>

                            <div class="detail-card">
                                <div class="detail-icon">💨</div>
                                <div class="detail-label">Wiatr</div>
                                <div class="detail-value" id="windSpeed"></div>
                            </div>

                            <div class="detail-card">
                                <div class="detail-icon">🌡️</div>
                                <div class="detail-label">Średnia temp.</div>
                                <div class="detail-value" id="tempMean"></div>
                            </div>

                            <div class="detail-card">
                                <div class="detail-icon">🔔</div>
                                <div class="detail-label">Status</div>
                                <div class="detail-value" id="weatherStatus"></div>
                            </div>
                        </div>

                        <h3 style="margin-top: 2rem; margin-bottom: 1rem; font-size: 0.95rem; opacity: 0.9;">Następne 7 dni</h3>
                        <div class="forecast-preview" id="forecastPreview"></div>

                        <div class="day-navigation">
                            <button class="nav-btn" id="prevBtn">← Poprzedni dzień</button>
                            <button class="nav-btn" id="nextBtn">Następny dzień →</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupInternalListeners();
    }

    setupInternalListeners() {
        const closeBtn = this.shadowRoot.getElementById('closeBtn');
        const prevBtn = this.shadowRoot.getElementById('prevBtn');
        const nextBtn = this.shadowRoot.getElementById('nextBtn');
        const overlay = this.shadowRoot.getElementById('modalOverlay');

        closeBtn.addEventListener('click', () => this.close());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });

        prevBtn.addEventListener('click', () => this.showPreviousDay());
        nextBtn.addEventListener('click', () => this.showNextDay());

        // Podgląd dni - kliknięcie
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.closest('.preview-item')) {
                const timestamp =
                    e.target.closest('.preview-item').dataset.timestamp;
                const day = this.forecast.list.find(
                    (d) => d.dt === parseInt(timestamp),
                );
                if (day) {
                    this.selectedForecast = day;
                    this.updateContent();
                }
            }
        });
    }

    handleDaySelected(timestamp) {
        if (!this.forecast || !this.forecast.list) {
            console.warn('Brak danych prognozy');
            return;
        }

        const day = this.forecast.list.find((d) => d.dt === timestamp);
        if (day) {
            this.selectedForecast = day;
            this.open();
            this.updateContent();
        }
    }

    updateContent() {
        if (!this.selectedForecast) return;

        const day = this.selectedForecast;
        const date = new Date(day.dt * 1000);

        // Nagłówek
        this.shadowRoot.getElementById('dayName').textContent =
            date.toLocaleDateString('pl-PL', { weekday: 'long' });
        this.shadowRoot.getElementById('dayDate').textContent =
            date.toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });

        // Główne informacje
        const emoji = getWeatherEmoji(day.weather[0].main);
        this.shadowRoot.getElementById('mainIcon').textContent = emoji;
        this.shadowRoot.getElementById('weatherDesc').textContent =
            day.weather[0].main;
        this.shadowRoot.getElementById('tempMax').textContent =
            formatTemperature(day.main.temp_max);
        this.shadowRoot.getElementById('tempMin').textContent =
            formatTemperature(day.main.temp_min);
        this.shadowRoot.getElementById('tempMean').textContent =
            formatTemperature(day.main.temp);

        // Szczegóły
        this.shadowRoot.getElementById('precipitation').textContent =
            formatRain(day.rain['1h']);
        this.shadowRoot.getElementById('windSpeed').textContent =
            formatWindSpeed(day.wind.speed);
        this.shadowRoot.getElementById('weatherStatus').textContent =
            day.weather[0].description;

        // Przycisk nawigacji
        const currentIndex = this.forecast.list.indexOf(day);
        this.shadowRoot.getElementById('prevBtn').disabled = currentIndex === 0;
        this.shadowRoot.getElementById('nextBtn').disabled =
            currentIndex === this.forecast.list.length - 1;

        // Podgląd kolejnych dni
        this.updateForecastPreview();
    }

    updateForecastPreview() {
        const preview = this.shadowRoot.getElementById('forecastPreview');
        const currentIndex = this.forecast.list.indexOf(this.selectedForecast);

        preview.innerHTML = this.forecast.list
            .map((day, index) => {
                const date = new Date(day.dt * 1000);
                const emoji = getWeatherEmoji(day.weather[0].main);
                const isActive = index === currentIndex;

                return `
                    <div class="preview-item ${
                        isActive ? 'active' : ''
                    }" data-timestamp="${day.dt}">
                        <div class="preview-date">${date.toLocaleDateString(
                            'pl-PL',
                            { day: 'numeric', month: 'short' },
                        )}</div>
                        <div class="preview-icon">${emoji}</div>
                        <div class="preview-temp">${formatTemperature(
                            day.main.temp_max,
                        )}</div>
                    </div>
                `;
            })
            .join('');
    }

    showPreviousDay() {
        if (!this.forecast) return;
        const currentIndex = this.forecast.list.indexOf(this.selectedForecast);
        if (currentIndex > 0) {
            this.selectedForecast = this.forecast.list[currentIndex - 1];
            this.updateContent();
        }
    }

    showNextDay() {
        if (!this.forecast) return;
        const currentIndex = this.forecast.list.indexOf(this.selectedForecast);
        if (currentIndex < this.forecast.list.length - 1) {
            this.selectedForecast = this.forecast.list[currentIndex + 1];
            this.updateContent();
        }
    }

    open() {
        this.isOpen = true;
        const overlay = this.shadowRoot.getElementById('modalOverlay');
        overlay.classList.add('active');
    }

    close() {
        this.isOpen = false;
        const overlay = this.shadowRoot.getElementById('modalOverlay');
        overlay.classList.remove('active');
    }
}

customElements.define('detailed-forecast', DetailedForecastComponent);

export { DetailedForecastComponent };
