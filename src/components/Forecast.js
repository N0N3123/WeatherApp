/**
 * Forecast Component
 * Wyświetla prognozę na 5 dni (co 3h)
 */

import { stateManager } from '../state/stateManager.js';
import {
    formatTemperature,
    formatTime,
    getWeatherEmoji,
} from '../utils/formatters.js';

class ForecastComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.forecastData = null;
        this.unsubscribe = null;
    }

    connectedCallback() {
        this.render();

        this.unsubscribe = stateManager.subscribe('forecast', (data) => {
            this.forecastData = data;
            this.updateView();
        });

        console.log('✅ ForecastComponent mounted');
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
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .forecast-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 1rem;
                    padding: 1rem 0;
                }

                .forecast-item {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 1rem;
                    border-radius: 8px;
                    text-align: center;
                    cursor: pointer;
                    transition: transform 0.3s, box-shadow 0.3s;
                }

                .forecast-item:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
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
            </style>

            <div class="forecast-container">
                <div class="forecast-grid" id="forecastGrid">
                    <div class="loading">Ładowanie prognozy...</div>
                </div>
            </div>
        `;
    }

    updateView() {
        const grid = this.shadowRoot.querySelector('#forecastGrid');

        if (!this.forecastData || !this.forecastData.list) {
            grid.innerHTML = '<div class="empty">Brak danych prognozy</div>';
            return;
        }

        // Open-Meteo zwraca już daily data (pogodę po dniach), nie hourly
        // Nie trzeba filtrować - bierz wszystkie 7 dni
        const dailyForecast = this.forecastData.list;

        grid.innerHTML = dailyForecast
            .map((item) => this.createForecastItem(item))
            .join('');

        // Dodaj event listenery do itemów
        grid.querySelectorAll('.forecast-item').forEach((item) => {
            item.addEventListener('click', () => {
                const timestamp = item.dataset.timestamp;
                this.dispatchEvent(
                    new CustomEvent('forecast-selected', {
                        detail: { timestamp },
                        bubbles: true,
                        composed: true,
                    })
                );
            });
        });
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
}

customElements.define('weather-forecast', ForecastComponent);

export { ForecastComponent };
