import { stateManager } from '../state/stateManager.js';
import { authService } from '../api/authService.js';
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
    }

    static get observedAttributes() {
        return ['city', 'temp-unit'];
    }

    connectedCallback() {
        this.renderStructure();

        stateManager.subscribe('currentWeather', (data) => {
            this.weatherData = data;
            this.updateContent();
        });

        stateManager.subscribe('favorites', () => {
            this.updateHeartStatus();
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'city' && oldValue !== newValue) {
            this.dispatchEvent(
                new CustomEvent('city-changed', {
                    detail: { city: newValue },
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    renderStructure() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; width: 100%; }
                .card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 2rem;
                    color: white;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    min-height: 300px;
                    display: flex;
                    flex-direction: column;

                    overflow: hidden; 
                    position: relative;
                }
                .header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 1rem;
                }
                .city-info {
                    flex: 1;
                    min-width: 0;
                }
                .city-name {
                    font-size: 2rem; 
                    font-weight: 700; 
                    margin: 0 0 0.5rem 0;
                    word-wrap: break-word;
                    line-height: 1.2;
                }
                .date-label {
                    opacity: 0.8; font-size: 0.9rem; margin: 0;
                }
                .heart-btn {
                    background: none; border: none; font-size: 2rem;
                    cursor: pointer; transition: transform 0.2s;
                    color: rgba(255,255,255, 0.4);
                    padding: 0; line-height: 1; flex-shrink: 0;
                }
                .heart-btn.active { color: #ff4757; transform: scale(1.1); }
                
                .main-info {
                    display: flex; align-items: center; gap: 2rem; margin: 2rem 0;
                }
                .temperature { font-size: 4rem; font-weight: 700; line-height: 1; white-space: nowrap; }
                .weather-icon { font-size: 5rem; line-height: 1; flex-shrink: 0; }
                .description {
                    font-size: 1.3rem; opacity: 0.9; text-transform: capitalize; margin-top: 0.5rem;
                }

                .details-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                    gap: 1rem;
                    margin-top: auto;
                }
                .detail-item {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 1rem;
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                }
                .detail-label {
                    font-size: 0.75rem; opacity: 0.8; display: block; margin-bottom: 0.3rem; text-transform: uppercase; letter-spacing: 0.5px;
                }
                .detail-value { font-size: 1.1rem; font-weight: 600; }
                .detail-sub { font-size: 0.75rem; opacity: 0.7; margin-left: 0.2rem; font-weight: normal; }
                
                .loading { text-align: center; padding: 2rem; opacity: 0.7; }

                @media (max-width: 480px) {
                    .card { padding: 1.5rem; }
                    .city-name { font-size: 1.5rem; }
                    .main-info { gap: 1rem; margin: 1.5rem 0; }
                    .temperature { font-size: 3rem; }
                    .weather-icon { font-size: 3.5rem; }
                    .description { font-size: 1.1rem; }
                    .details-grid { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
                    .detail-item { padding: 0.8rem; }
                }
            </style>

            <div class="card">
                <div id="content">
                    <div class="loading">Ładowanie pogody...</div>
                </div>
            </div>
        `;
    }

    updateContent() {
        if (!this.weatherData) return;

        const main = this.weatherData.main;
        const weather = this.weatherData.weather[0];
        const wind = this.weatherData.wind;
        const sys = this.weatherData.sys;

        const content = this.shadowRoot.getElementById('content');

        content.innerHTML = `
            <div class="header-row">
                <div class="city-info">
                    <h2 class="city-name">${this.weatherData.name}, ${sys.country}</h2>
                    <p class="date-label">${new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <button class="heart-btn" id="favBtn" title="Dodaj do ulubionych">❤</button>
            </div>

            <div class="main-info">
                <div class="weather-icon">${getWeatherEmoji(weather.main)}</div>
                <div>
                    <div class="temperature">${formatTemperature(main.temp)}</div>
                    <div class="description">${formatWeatherDescription(weather.description)}</div>
                </div>
            </div>

            <div class="details-grid">
                <div class="detail-item">
                    <span class="detail-label">Odczuwalna</span>
                    <div class="detail-value">${formatTemperature(main.feels_like)}</div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Wilgotność</span>
                    <div class="detail-value">${formatHumidity(main.humidity)}</div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Wiatr</span>
                    <div class="detail-value">
                        ${formatWindSpeed(wind.speed)} <span class="detail-sub">km/h</span>
                    </div>
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.2rem;">
                        ${formatWindDirection(wind.deg)}
                    </div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ciśnienie</span>
                    <div class="detail-value">${formatPressure(main.pressure)}</div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Widzialność</span>
                    <div class="detail-value">${(this.weatherData.visibility / 1000).toFixed(1)} <span class="detail-sub">km</span></div>
                </div>
            </div>
        `;

        const favBtn = this.shadowRoot.getElementById('favBtn');
        const newFavBtn = favBtn.cloneNode(true);
        favBtn.parentNode.replaceChild(newFavBtn, favBtn);

        newFavBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!authService.isAuthenticated()) {
                const loginWidget = document.getElementById('loginWidget');
                const modal = loginWidget?.shadowRoot?.getElementById('modal');
                modal?.classList.remove('hidden');
                return;
            }
            stateManager.toggleFavorite(this.weatherData.name);
            this.updateHeartStatus();
        });

        this.updateHeartStatus();
    }

    updateHeartStatus() {
        const favBtn = this.shadowRoot.getElementById('favBtn');
        if (!favBtn || !this.weatherData) return;
        const favorites = stateManager.get('favorites') || [];
        const isFav = favorites.includes(this.weatherData.name);
        favBtn.classList.toggle('active', isFav);
    }
}

customElements.define('current-weather', CurrentWeatherComponent);
export { CurrentWeatherComponent };
