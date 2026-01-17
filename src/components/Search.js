import { stateManager } from '../state/stateManager.js';
import { isValidCity } from '../utils/validators.js';

class SearchComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.debounceTimer = null;
        // Rozszerzona lista miast do podpowiedzi
        this.cities = [
            'Warszawa',
            'Kraków',
            'Łódź',
            'Wrocław',
            'Poznań',
            'Gdańsk',
            'Szczecin',
            'Bydgoszcz',
            'Lublin',
            'Białystok',
            'Katowice',
            'Gdynia',
            'Częstochowa',
            'Radom',
            'Toruń',
            'Sosnowiec',
            'Rzeszów',
            'Kielce',
            'Gliwice',
            'Olsztyn',
            'Zabrze',
            'Bielsko-Biała',
            'Bytom',
            'Zielona Góra',
            'Rybnik',
            'Ruda Śląska',
            'Opole',
            'Tychy',
            'Gorzów Wielkopolski',
            'Elbląg',
            'Płock',
            'Dąbrowa Górnicza',
            'Wałbrzych',
            'Włocławek',
            'Tarnów',
            'Chorzów',
            'Koszalin',
            'Kalisz',
            'Legnica',
            'Grudziądz',
            'Jaworzno',
            'Słupsk',
            'Jastrzębie-Zdrój',
            'Nowy Sącz',
            'Jelenia Góra',
            'Siedlce',
            'Mysłowice',
            'Konin',
            'Piła',
            'Piotrków Trybunalski',
            'Berlin',
            'Londyn',
            'Paryż',
            'Nowy Jork',
            'Tokio',
            'Rzym',
            'Madryt',
        ];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; position: relative; z-index: 100; }
                .search-container {
                    display: flex;
                    gap: 0.5rem;
                    position: relative;
                }
                input {
                    flex: 1;
                    padding: 0.8rem 1rem;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 1rem;
                    outline: none;
                    transition: border-color 0.3s;
                    width: 100%;
                }
                input:focus {
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                button {
                    padding: 0.8rem 1.5rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: transform 0.1s;
                }
                button:active { transform: scale(0.95); }
                
                /* Style dla listy podpowiedzi */
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
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    display: none; /* Domyślnie ukryte */
                    z-index: 1000;
                }
                .suggestions.active {
                    display: block;
                }
                .suggestion-item {
                    padding: 0.8rem 1rem;
                    cursor: pointer;
                    border-bottom: 1px solid #f0f0f0;
                    transition: background 0.2s;
                    color: #333;
                    text-align: left;
                }
                .suggestion-item:last-child { border-bottom: none; }
                .suggestion-item:hover { background: #f5f7fa; color: #667eea; }
            </style>

            <div class="search-container">
                <input 
                    part="input" 
                    type="text" 
                    id="searchInput" 
                    placeholder="Wpisz nazwę miasta..." 
                    autocomplete="off"
                >
                <button id="searchBtn">Szukaj</button>
            </div>
            <div id="suggestions" class="suggestions"></div>
        `;
    }

    setupEventListeners() {
        const input = this.shadowRoot.getElementById('searchInput');
        const btn = this.shadowRoot.getElementById('searchBtn');
        const suggestionsBox = this.shadowRoot.getElementById('suggestions');

        // Obsługa pisania (Input + Debounce)
        input.addEventListener('input', (e) => {
            const value = e.target.value.trim();

            // Ukryj jeśli pusto
            if (value.length < 2) {
                suggestionsBox.classList.remove('active');
                return;
            }

            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.showSuggestions(value);
            }, 300);
        });

        // Obsługa przycisku Szukaj
        btn.addEventListener('click', () => this.search());

        // Obsługa Entera
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.search();
                suggestionsBox.classList.remove('active');
            }
        });

        // Ukrywanie listy po kliknięciu poza
        document.addEventListener('click', (e) => {
            // Sprawdź czy kliknięcie było wewnątrz komponentu
            if (!this.contains(e.target)) {
                suggestionsBox.classList.remove('active');
            }
        });
    }

    showSuggestions(value) {
        const suggestionsBox = this.shadowRoot.getElementById('suggestions');
        const lowerValue = value.toLowerCase();

        // Filtrowanie miast
        const filtered = this.cities.filter(
            (city) =>
                city.toLowerCase().startsWith(lowerValue) ||
                city.toLowerCase().includes(lowerValue)
        );

        if (filtered.length === 0) {
            suggestionsBox.classList.remove('active');
            return;
        }

        // Generowanie HTML
        suggestionsBox.innerHTML = filtered
            .slice(0, 6) // Pokaż max 6 wyników
            .map((city) => `<div class="suggestion-item">${city}</div>`)
            .join('');

        suggestionsBox.classList.add('active');

        // Dodanie listenerów do nowych elementów
        suggestionsBox.querySelectorAll('.suggestion-item').forEach((item) => {
            item.addEventListener('click', () => {
                const city = item.textContent;
                this.shadowRoot.getElementById('searchInput').value = city;
                suggestionsBox.classList.remove('active');
                this.search();
            });
        });
    }

    search() {
        const input = this.shadowRoot.getElementById('searchInput');
        const city = input.value.trim();

        if (isValidCity(city)) {
            // Zapisz w managerze
            stateManager.setCurrentCity(city);

            // Wyemituj event
            this.dispatchEvent(
                new CustomEvent('search', {
                    detail: { city },
                    bubbles: true,
                    composed: true,
                })
            );

            input.value = '';
        } else {
            // Prosta animacja błędu
            input.style.borderColor = '#ff4757';
            setTimeout(() => (input.style.borderColor = '#e0e0e0'), 1000);
        }
    }
}

customElements.define('weather-search', SearchComponent);
