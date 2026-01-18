import { stateManager } from '../state/stateManager.js';
import { formatTime } from '../utils/formatters.js';

class TodayHighlightsComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.forecast = null;
        this.unsubscribe = null;
    }

    connectedCallback() {
        this.render();
        this.unsubscribe = stateManager.subscribe('forecast', (data) => {
            this.forecast = data;
            this.update();
        });
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
    }

    update() {
        const container = this.shadowRoot.querySelector('#highlights');
        if (!container) return;

        const today = this.forecast?.list?.[0] || null;
        const tomorrow = this.forecast?.list?.[1] || null;
        const sunrise = today?.sunrise_ts
            ? formatTime(today.sunrise_ts, 'time')
            : null;
        const sunset = today?.sunset_ts
            ? formatTime(today.sunset_ts, 'time')
            : null;
        const dayLength =
            today?.sunrise_ts && today?.sunset_ts
                ? (() => {
                      const diff = today.sunset_ts - today.sunrise_ts;
                      const hours = Math.floor(diff / 3600);
                      const minutes = Math.round((diff % 3600) / 60);
                      return `${hours} h ${minutes} min`;
                  })()
                : null;
        const nightLength =
            today?.sunset_ts && tomorrow?.sunrise_ts
                ? (() => {
                      const diff = tomorrow.sunrise_ts - today.sunset_ts;
                      const hours = Math.floor(diff / 3600);
                      const minutes = Math.round((diff % 3600) / 60);
                      return `${hours} h ${minutes} min`;
                  })()
                : null;

        if (!today || !sunrise || !sunset) {
            container.innerHTML =
                '<div class="empty">Brak danych o wschodzie/zachodzie</div>';
            return;
        }

        container.innerHTML = `
            <div class="card">
                <div class="icon">🌅</div>
                <div class="content">
                    <div class="label">Wschód słońca</div>
                    <div class="value">${sunrise}</div>
                </div>
            </div>
            <div class="card">
                <div class="icon">🌇</div>
                <div class="content">
                    <div class="label">Zachód słońca</div>
                    <div class="value">${sunset}</div>
                </div>
            </div>
            <div class="card">
                <div class="icon">☀️</div>
                <div class="content">
                    <div class="label">Długość dnia</div>
                    <div class="value">${dayLength || '—'}</div>
                </div>
            </div>
            <div class="card">
                <div class="icon">🌙</div>
                <div class="content">
                    <div class="label">Długość nocy</div>
                    <div class="value">${nightLength || '—'}</div>
                </div>
            </div>
        `;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .wrapper {
                    background: var(--white);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-md);
                    padding: 2rem;
                    animation: slideUp 0.4s ease;
                    display: flex;
                    flex-direction: column;
                    min-height: 300px;
                }

                .header { margin-bottom: var(--space-md); }
                .header h3 { margin: 0; }

                #highlights {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    height: 100%;
                    justify-content: space-between;
                }

                .card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 8px;
                    padding: 1rem;
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 0.75rem;
                    align-items: center;
                }
                .icon { font-size: 2rem; }
                .label { opacity: 0.9; font-size: 0.9rem; }
                .value { font-weight: 700; font-size: 1.2rem; }

                .empty { color: #666; text-align: center; padding: 2rem; }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>

            <div class="wrapper">
                <div class="header">
                    <h3>Cykl dzienny</h3>
                </div>
                <div id="highlights"></div>
            </div>
        `;
    }
}

customElements.define('today-highlights', TodayHighlightsComponent);
export { TodayHighlightsComponent };
