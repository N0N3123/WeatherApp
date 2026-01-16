/**
 * Search Component
 * Wyszukiwanie miast
 */

import { stateManager } from '../state/stateManager.js';
import { isValidCity } from '../utils/validators.js';

class SearchComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.debounceTimer = null;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        console.log('✅ SearchComponent mounted');
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .search-container {
                    display: flex;
                    gap: 0.5rem;
                }

                .search-input {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.3s;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .search-btn {
                    padding: 0.75rem 1.5rem;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.3s;
                }

                .search-btn:hover {
                    background: #5568d3;
                }

                .search-btn:active {
                    transform: scale(0.98);
                }

                .suggestions {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-top: none;
                    border-radius: 0 0 8px 8px;
                    max-height: 200px;
                    overflow-y: auto;
                    display: none;
                    z-index: 10;
                }

                .suggestions.active {
                    display: block;
                }

                .suggestion-item {
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    transition: background 0.2s;
                    border-bottom: 1px solid #f0f0f0;
                }

                .suggestion-item:hover {
                    background: #f5f5f5;
                }

                .suggestion-item:last-child {
                    border-bottom: none;
                }
            </style>

            <div class="search-container">
                <input 
                    type="text" 
                    class="search-input" 
                    placeholder="Wpisz nazwę miasta..."
                    id="searchInput"
                >
                <button class="search-btn" id="searchBtn">Szukaj</button>
            </div>
            <div class="suggestions" id="suggestions"></div>
        `;
    }

    setupEventListeners() {
        const input = this.shadowRoot.querySelector('#searchInput');
        const btn = this.shadowRoot.querySelector('#searchBtn');
        const suggestionsBox = this.shadowRoot.querySelector('#suggestions');

        // Enter - szukaj
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.search();
            }
        });

        // Debounced input - sugestie
        input.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            const value = e.target.value.trim();

            if (value.length < 2) {
                suggestionsBox.classList.remove('active');
                return;
            }

            this.debounceTimer = setTimeout(() => {
                this.showSuggestions(value);
            }, 300);
        });

        // Click na przycisk
        btn.addEventListener('click', () => this.search());

        // Close suggestions na click poza
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                suggestionsBox.classList.remove('active');
            }
        });
    }

    search() {
        const input = this.shadowRoot.querySelector('#searchInput');
        const city = input.value.trim();

        if (!isValidCity(city)) {
            this.showError('Wpisz prawidłową nazwę miasta');
            return;
        }

        stateManager.setCurrentCity(city);
        stateManager.setLoading(true);

        // Emituj event
        this.dispatchEvent(
            new CustomEvent('search', {
                detail: { city },
                bubbles: true,
                composed: true,
            })
        );

        input.value = '';
        this.shadowRoot
            .querySelector('#suggestions')
            .classList.remove('active');
    }

    showSuggestions(value) {
        // Sugestie polskich miast
        const cities = [
            'Warsaw',
            'Krakow',
            'Wroclaw',
            'Poznan',
            'Gdansk',
            'Szczecin',
            'Lodz',
            'Bydgoszcz',
            'Lublin',
            'Katowice',
        ];

        const filtered = cities.filter((city) =>
            city.toLowerCase().includes(value.toLowerCase())
        );

        const suggestionsBox = this.shadowRoot.querySelector('#suggestions');

        if (filtered.length === 0) {
            suggestionsBox.classList.remove('active');
            return;
        }

        suggestionsBox.innerHTML = filtered
            .map(
                (city) => `
                <div class="suggestion-item" data-city="${city}">
                    ${city}
                </div>
            `
            )
            .join('');

        suggestionsBox.classList.add('active');

        // Click na sugestię
        suggestionsBox.querySelectorAll('.suggestion-item').forEach((item) => {
            item.addEventListener('click', () => {
                const city = item.dataset.city;
                this.shadowRoot.querySelector('#searchInput').value = city;
                this.search();
            });
        });
    }

    showError(message) {
        const input = this.shadowRoot.querySelector('#searchInput');
        input.style.borderColor = '#ff6b6b';

        setTimeout(() => {
            input.style.borderColor = '#e0e0e0';
        }, 2000);

        this.dispatchEvent(
            new CustomEvent('error', {
                detail: { message },
                bubbles: true,
                composed: true,
            })
        );
    }
}

customElements.define('weather-search', SearchComponent);

export { SearchComponent };
