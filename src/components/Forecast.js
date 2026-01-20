import { stateManager } from '../state/stateManager.js';
import {
    formatTemperature,
    formatTime,
    getWeatherEmoji,
    formatWindSpeed,
} from '../utils/formatters.js';

class ForecastComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.forecastData = null;
        this.selectedForecast = null;
        this.viewMode = 'list';
        this.unsubscribe = null;
    }

    connectedCallback() {
        this.render();

        this.unsubscribe = stateManager.subscribe('forecast', (data) => {
            this.forecastData = data;
            this.updateView();
        });
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    get forecast() {
        return this.forecastData;
    }

    set forecast(data) {
        this.forecastData = data;
        this.updateView();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .forecast-container {
                    position: relative;
                    overflow-y: hidden;
                    max-width: 100%;
                    -webkit-overflow-scrolling: touch;
                    animation: fadeIn 0.3s ease-out;
                    transition: height 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .forecast-grid {
                    display: grid;
                    grid-template-columns: repeat(7, minmax(120px, 1fr));
                    gap: 1rem;
                    padding: 1.5rem 0.5rem 3rem 0.5rem;
                    min-width: min-content;
                }

                .forecast-item {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 1rem;
                    border-radius: 8px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    transform-origin: center center;
                    will-change: transform;
                }

                .forecast-item:hover {
                    transform: scale(1.08);
                    box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
                    z-index: 10;
                }

                .forecast-time {
                    font-size: 0.85rem;
                    opacity: 0.9;
                    margin-bottom: 0.5rem;
                }

                .forecast-icon {
                    font-size: 2.5rem;
                    margin: 0.5rem 0;
                }

                .forecast-temp {
                    font-weight: 700;
                    font-size: 1.2rem;
                }

                .forecast-description {
                    font-size: 0.75rem;
                    opacity: 0.85;
                    margin-top: 0.5rem;
                    text-transform: capitalize;
                }

                .detail-view {
                    animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .detail-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 2px solid rgba(0, 0, 0, 0.1);
                }

                .detail-title {
                    flex: 1;
                }

                .detail-title h3 {
                    margin: 0;
                    font-size: 1.5rem;
                    text-transform: capitalize;
                }

                .detail-title p {
                    margin: 0.3rem 0 0 0;
                    opacity: 0.8;
                    font-size: 0.9rem;
                }

                .back-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    color: white;
                    padding: 0.8rem 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.95rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .back-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
                }

                .detail-main {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    margin-bottom: 2.5rem;
                    padding: 1.5rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px;
                }

                .detail-icon {
                    font-size: 4rem;
                }

                .detail-info {
                    flex: 1;
                }

                .detail-description {
                    font-size: 1.2rem;
                    opacity: 0.9;
                    margin-bottom: 1rem;
                    text-transform: capitalize;
                }

                .temp-range {
                    display: flex;
                    gap: 2rem;
                }

                .temp-box {
                    display: flex;
                    flex-direction: column;
                }

                .temp-label {
                    font-size: 0.8rem;
                    opacity: 0.7;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 0.2rem;
                }

                .temp-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                }

                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .detail-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 1rem;
                    border-radius: 10px;
                    text-align: center;
                    transition: all 0.2s;
                }

                .detail-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
                }

                .card-icon {
                    font-size: 1.8rem;
                    margin-bottom: 0.5rem;
                }

                .card-label {
                    font-size: 0.75rem;
                    opacity: 0.7;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 0.3rem;
                }

                .card-value {
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .nav-buttons {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 2px solid rgba(0, 0, 0, 0.1);
                }

                .nav-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    color: white;
                    padding: 0.8rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .nav-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
                }

                .nav-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .loading {
                    text-align: center;
                    padding: 2rem;
                    color: #999;
                }

                .empty {
                    text-align: center;
                    padding: 2rem;
                    color: #666;
                }

                #listView {
                                        position: absolute;
                                        top: 0;
                                        left: 0;
                                        right: 0;
                                        width: 100%;
                    will-change: opacity;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                    opacity: 1;
                    visibility: visible;
                }

                #listView.hidden {
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                }

                #detailView {
                                        position: absolute;
                                        top: 0;
                                        left: 0;
                                        right: 0;
                                        width: 100%;
                    will-change: opacity;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                }

                #detailView.active {
                    opacity: 1;
                    visibility: visible;
                    pointer-events: auto;
                }

                @media (max-width: 600px) {
                    .detail-main {
                        flex-direction: column;
                        text-align: center;
                    }

                    .detail-header {
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .detail-title {
                        text-align: center;
                    }

                    .detail-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>

            <div class="forecast-container" id="container">
                <div id="listView">
                    <div class="forecast-grid" id="forecastGrid">
                        <div class="loading">Ładowanie prognozy...</div>
                    </div>
                </div>
                <div id="detailView"></div>
            </div>
        `;
    }

    updateView() {
        if (this.viewMode === 'list') {
            this.renderListView();
        } else {
            this.renderDetailView();
        }
    }

    renderListView() {
        const grid = this.shadowRoot.querySelector('#forecastGrid');
        const detailView = this.shadowRoot.querySelector('#detailView');
        const listView = this.shadowRoot.querySelector('#listView');

        listView.classList.remove('hidden');
        detailView.classList.remove('active');

        if (!this.forecastData || !this.forecastData.list) {
            grid.innerHTML = '<div class="empty">Brak danych prognozy</div>';
            return;
        }

        const dailyForecast = this.forecastData.list;

        grid.innerHTML = dailyForecast
            .map((item) => this.createForecastItem(item))
            .join('');

        grid.querySelectorAll('.forecast-item').forEach((item) => {
            item.addEventListener('click', () => {
                const timestamp = parseInt(item.dataset.timestamp, 10);
                this.showDetail(timestamp);
            });
        });

        this.adjustContainerHeight();
    }

    renderDetailView() {
        const detailView = this.shadowRoot.querySelector('#detailView');
        const listView = this.shadowRoot.querySelector('#listView');

        listView.classList.add('hidden');
        detailView.classList.add('active');

        if (!this.selectedForecast) return;

        const day = this.selectedForecast;
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('pl-PL', { weekday: 'long' });
        const dateStr = date.toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const emoji = getWeatherEmoji(day.weather[0].main);
        const currentIndex = this.forecastData.list.indexOf(day);
        const canPrev = currentIndex > 0;
        const canNext = currentIndex < this.forecastData.list.length - 1;

        detailView.innerHTML = `
            <div class="detail-view">
                <div class="detail-header">
                    <div class="detail-title">
                        <h3>${dayName}</h3>
                        <p>${dateStr}</p>
                    </div>
                    <button class="back-btn" id="backBtn">← Wróć do listy</button>
                </div>

                <div class="detail-main">
                    <div class="detail-icon">${emoji}</div>
                    <div class="detail-info">
                        <div class="detail-description">${
                            day.weather[0].main
                        }</div>
                        <div class="temp-range">
                            <div class="temp-box">
                                <div class="temp-label">Maksimum</div>
                                <div class="temp-value">${formatTemperature(
                                    day.main.temp_max,
                                )}</div>
                            </div>
                            <div class="temp-box">
                                <div class="temp-label">Minimum</div>
                                <div class="temp-value">${formatTemperature(
                                    day.main.temp_min,
                                )}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="detail-grid">
                    <div class="detail-card">
                        <div class="card-icon">💧</div>
                        <div class="card-label">Opady</div>
                        <div class="card-value">${day.rain['1h']} mm</div>
                    </div>

                    <div class="detail-card">
                        <div class="card-icon">💨</div>
                        <div class="card-label">Wiatr</div>
                        <div class="card-value">${formatWindSpeed(
                            day.wind.speed,
                        )}</div>
                    </div>

                    <div class="detail-card">
                        <div class="card-icon">🌡️</div>
                        <div class="card-label">Średnia temp.</div>
                        <div class="card-value">${formatTemperature(
                            day.main.temp,
                        )}</div>
                    </div>

                    <div class="detail-card">
                        <div class="card-icon">📍</div>
                        <div class="card-label">Status</div>
                        <div class="card-value">${
                            day.weather[0].description
                        }</div>
                    </div>
                </div>

                <div class="nav-buttons">
                    <button class="nav-btn" id="prevBtn" ${
                        !canPrev ? 'disabled' : ''
                    }>
                        ← Poprzedni dzień
                    </button>
                    <button class="nav-btn" id="nextBtn" ${
                        !canNext ? 'disabled' : ''
                    }>
                        Następny dzień →
                    </button>
                </div>
            </div>
        `;

        detailView.querySelector('#backBtn').addEventListener('click', () => {
            this.backToList();
        });

        detailView.querySelector('#prevBtn')?.addEventListener('click', () => {
            this.showPreviousDay();
        });

        detailView.querySelector('#nextBtn')?.addEventListener('click', () => {
            this.showNextDay();
        });

        this.adjustContainerHeight();
    }

    showDetail(timestamp) {
        const day = this.forecastData.list.find((d) => d.dt === timestamp);
        if (day) {
            this.selectedForecast = day;
            this.viewMode = 'detail';
            this.updateView();
        }
    }

    backToList() {
        this.viewMode = 'list';
        this.selectedForecast = null;
        this.updateView();
    }

    showPreviousDay() {
        if (!this.forecastData) return;
        const currentIndex = this.forecastData.list.indexOf(
            this.selectedForecast,
        );
        if (currentIndex > 0) {
            this.selectedForecast = this.forecastData.list[currentIndex - 1];
            this.updateView();
        }
    }

    showNextDay() {
        if (!this.forecastData) return;
        const currentIndex = this.forecastData.list.indexOf(
            this.selectedForecast,
        );
        if (currentIndex < this.forecastData.list.length - 1) {
            this.selectedForecast = this.forecastData.list[currentIndex + 1];
            this.updateView();
        }
    }

    createForecastItem(item) {
        const temp = item.main.temp;
        const description = item.weather[0].main;
        const emoji = getWeatherEmoji(description);
        const time = formatTime(item.dt, 'date');

        return `
            <div class="forecast-item" data-timestamp="${item.dt}">
                <div class="forecast-time">${time}</div>
                <div class="forecast-icon">${emoji}</div>
                <div class="forecast-temp">${formatTemperature(temp)}</div>
                <div class="forecast-description">${description}</div>
            </div>
        `;
    }

    adjustContainerHeight() {
        const container = this.shadowRoot.querySelector('#container');
        const listView = this.shadowRoot.querySelector('#listView');
        const detailView = this.shadowRoot.querySelector('#detailView');
        const activeView = this.viewMode === 'detail' ? detailView : listView;
        if (!container || !activeView) return;
        requestAnimationFrame(() => {
            const height = activeView.scrollHeight;
            if (height > 0) {
                container.style.height = `${height}px`;
            }
        });
    }
}

customElements.define('weather-forecast', ForecastComponent);

export { ForecastComponent };
