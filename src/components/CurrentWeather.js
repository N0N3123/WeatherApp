/**
 * CurrentWeather Component
 * Custom Web Component - wyświetla aktualną pogodę
 * Atrybuty, właściwości, eventy
 */

import { stateManager } from '../state/stateManager.js';
import {
    formatTemperature,
    formatWeatherDescription,
    formatWindSpeed,
    getWeatherEmoji,
    formatWindDirection,
    formatHumidity,
    formatPressure,
} from '../utils/formatters.js';

class CurrentWeatherComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.weatherData = null;
        this.unsubscribe = null;
    }

    // Obserwowane atrybuty
    static get observedAttributes() {
        return ['city', 'temp-unit'];
    }

    connectedCallback() {
        this.render();

        // Subskrybuj zmiany w state
        this.unsubscribe = stateManager.subscribe('currentWeather', (data) => {
            this.weatherData = data;
            this.updateView();
        });

        console.log('✅ CurrentWeatherComponent mounted');
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        console.log('❌ CurrentWeatherComponent unmounted');
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'city' && oldValue !== newValue) {
            this.dispatchEvent(
                new CustomEvent('city-changed', {
                    detail: { city: newValue },
                    bubbles: true,
                    composed: true,
                })
            );
        }
    }

    // Właściwości komponentu (settery/gettery)
    get weather() {
        return this.weatherData;
    }

    set weather(data) {
        this.weatherData = data;
        this.updateView();
    }

    get city() {
        return this.getAttribute('city');
    }

    set city(value) {
        this.setAttribute('city', value);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 2rem;
                    color: white;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    min-height: 300px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .city-name {
                    font-size: 2rem;
                    font-weight: 700;
                    margin: 0 0 1rem 0;
                }

                .main-info {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    margin: 1rem 0;
                }

                .temperature {
                    font-size: 4rem;
                    font-weight: 700;
                }

                .weather-icon {
                    font-size: 5rem;
                }

                .description {
                    font-size: 1.3rem;
                    opacity: 0.9;
                    text-transform: capitalize;
                }

                .details-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-top: 1.5rem;
                }

                .detail-item {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 1rem;
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                }

                .detail-label {
                    font-size: 0.85rem;
                    opacity: 0.8;
                    display: block;
                    margin-bottom: 0.5rem;
                }

                .detail-value {
                    font-size: 1.2rem;
                    font-weight: 600;
                }

                .loading {
                    text-align: center;
                    padding: 2rem;
                    opacity: 0.7;
                }

                .error {
                    background: rgba(255, 0, 0, 0.1);
                    color: #ff6b6b;
                    padding: 1rem;
                    border-radius: 8px;
                    text-align: center;
                }
            </style>

            <div class="card">
                <div id="content" class="loading">
                    Ładowanie pogody...
                </div>
            </div>
        `;
    }

    updateView() {
        const content = this.shadowRoot.querySelector('#content');

        if (!this.weatherData) {
            content.innerHTML =
                '<div class="loading">Ładowanie pogody...</div>';
            return;
        }

        const main = this.weatherData.main;
        const weather = this.weatherData.weather[0];
        const wind = this.weatherData.wind;

        content.innerHTML = `
            <h2 class="city-name">${this.weatherData.name}, ${
            this.weatherData.sys.country
        }</h2>

            <div class="main-info">
                <div class="weather-icon">${getWeatherEmoji(weather.main)}</div>
                <div>
                    <div class="temperature">${formatTemperature(
                        main.temp
                    )}</div>
                    <div class="description">${formatWeatherDescription(
                        weather.description
                    )}</div>
                </div>
            </div>

            <div class="details-grid">
                <div class="detail-item">
                    <span class="detail-label">Feels Like</span>
                    <div class="detail-value">${formatTemperature(
                        main.feels_like
                    )}</div>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Wilgotność</span>
                    <div class="detail-value">${formatHumidity(
                        main.humidity
                    )}</div>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Ciśnienie</span>
                    <div class="detail-value">${formatPressure(
                        main.pressure
                    )}</div>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Wiatr</span>
                    <div class="detail-value">${formatWindSpeed(
                        wind.speed
                    )} km/h</div>
                    <small>${formatWindDirection(wind.deg)}</small>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Chmury</span>
                    <div class="detail-value">${
                        this.weatherData.clouds.all
                    }%</div>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Widzialność</span>
                    <div class="detail-value">${(
                        this.weatherData.visibility / 1000
                    ).toFixed(1)} km</div>
                </div>
            </div>
        `;

        // Emituj event - pogoda się załadowała
        this.dispatchEvent(
            new CustomEvent('weather-loaded', {
                detail: { weather: this.weatherData },
                bubbles: true,
                composed: true,
            })
        );
    }
}

// Rejestracja komponentu
customElements.define('current-weather', CurrentWeatherComponent);

export { CurrentWeatherComponent };
