import { stateManager } from '../state/stateManager.js';

class FavoritesComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        stateManager.subscribe('favorites', () => this.render());
    }

    render() {
        const favorites = stateManager.get('favorites') || [];

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; margin-bottom: 1.5rem; }
                .fav-container {
                    display: flex; gap: 0.8rem; flex-wrap: wrap; align-items: center;
                }
                h3 { 
                    font-size: 1rem; margin: 0 0 0.8rem 0; color: #555; font-weight: 600;
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .chip {
                    background: white;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: 1px solid #e0e0e0;
                    display: flex; align-items: center; gap: 0.5rem;
                    color: #333;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .chip:hover {
                    background: #667eea; color: white; border-color: #667eea;
                    transform: translateY(-2px); box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
                }
                .chip:active { transform: translateY(0); }
                .empty-msg {
                    font-size: 0.9rem; color: #888; font-style: italic;
                    background: rgba(0,0,0,0.03); padding: 0.5rem 1rem; border-radius: 8px;
                }
            </style>
            
            ${favorites.length > 0 ? '<h3>❤️ Twoje ulubione miejsca</h3>' : ''}
            <div class="fav-container">
                ${
                    favorites.length === 0
                        ? '<div class="empty-msg">Nie masz jeszcze ulubionych miast. Kliknij serduszko przy nazwie miasta!</div>'
                        : favorites
                              .map(
                                  (city) => `
                        <div class="chip" data-city="${city}">
                            <span>📍</span> ${city}
                        </div>
                    `
                              )
                              .join('')
                }
            </div>
        `;

        this.shadowRoot.querySelectorAll('.chip').forEach((chip) => {
            chip.addEventListener('click', () => {
                const city = chip.dataset.city;
                // Emituj event do SearchWidget (który nasłuchuje w index.js lub sam SearchWidget)
                // Najlepiej użyć globalnego eventu na window lub document, ale tutaj strzelamy w #searchWidget
                const searchWidget = document.getElementById('searchWidget');
                if (searchWidget) {
                    // Wymuś wpisanie tekstu i wysłanie
                    // Ale ponieważ searchWidget ma metodę search(), lepiej przez stateManager
                    stateManager.setCurrentCity(city);
                    // Ale żeby pobrać dane, musimy wywołać fetch w index.js.
                    // Emitujemy event 'search' z poziomu tego komponentu, który index.js wyłapie?
                    // Nie, index.js słucha na #searchWidget.
                    // Więc dispatchujemy na #searchWidget
                    searchWidget.dispatchEvent(
                        new CustomEvent('search', {
                            detail: { city },
                            bubbles: true,
                            composed: true,
                        })
                    );
                }
            });
        });
    }
}

customElements.define('weather-favorites', FavoritesComponent);
export { FavoritesComponent };
