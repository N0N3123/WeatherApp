/**
 * SearchHistory Component - Historia wyszukań
 * Web Component - wyświetla i zarządza historią
 */

import { authService } from '../api/authService.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: block;
        }
        .history-container {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1rem 0;
        }
        .history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        h3 {
            margin: 0;
            color: #333;
            font-size: 1.1rem;
        }
        .clear-btn {
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.3s;
        }
        .clear-btn:hover {
            background: #ff5252;
        }
        .history-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
        }
        .history-item {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 1rem;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .history-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            border-color: #667eea;
        }
        .history-item-city {
            font-weight: 600;
            color: #333;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
        }
        .history-item-temp {
            color: #667eea;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
        }
        .history-item-condition {
            color: #999;
            font-size: 0.85rem;
            margin-bottom: 0.5rem;
        }
        .history-item-date {
            color: #ccc;
            font-size: 0.8rem;
        }
        .delete-btn {
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 0.3rem 0.6rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            margin-top: 0.5rem;
            width: 100%;
            transition: background 0.3s;
        }
        .delete-btn:hover {
            background: #ff5252;
        }
        .empty {
            text-align: center;
            color: #999;
            padding: 2rem;
            font-style: italic;
        }
        .hidden {
            display: none !important;
        }
    </style>

    <div class="history-container hidden" id="historyContainer">
        <div class="history-header">
            <h3>📝 Historia wyszukań</h3>
            <button class="clear-btn" id="clearBtn">Wyczyść</button>
        </div>
        <div class="history-list" id="historyList"></div>
    </div>
`;

class SearchHistoryComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this.container = this.shadowRoot.getElementById('historyContainer');
        this.historyList = this.shadowRoot.getElementById('historyList');
        this.clearBtn = this.shadowRoot.getElementById('clearBtn');

        this.clearBtn.addEventListener('click', () => this.handleClear());

        this.render();
        console.log('✅ SearchHistoryComponent mounted');
    }

    render() {
        const history = authService.getHistory();

        if (!authService.isAuthenticated()) {
            this.container.classList.add('hidden');
            return;
        }

        this.container.classList.remove('hidden');

        if (history.length === 0) {
            this.historyList.innerHTML =
                '<div class="empty">Brak historii wyszukań</div>';
            return;
        }

        this.historyList.innerHTML = history
            .map(
                (entry) => `
                <div class="history-item">
                    <div class="history-item-city">${entry.city}</div>
                    <div class="history-item-temp">🌡️ ${entry.temperature}°C</div>
                    <div class="history-item-condition">${entry.condition}</div>
                    <div class="history-item-date">${new Date(entry.timestamp).toLocaleDateString('pl-PL')}</div>
                    <button class="delete-btn" data-id="${entry.id}">Usuń</button>
                </div>
            `,
            )
            .join('');

        // Delete handlers
        this.shadowRoot.querySelectorAll('.delete-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const entryId = e.target.dataset.id;
                authService.deleteHistoryEntry(entryId);
                this.render();
            });
        });

        // Click to load
        this.shadowRoot
            .querySelectorAll('.history-item')
            .forEach((item, idx) => {
                item.addEventListener('click', () => {
                    const entry = history[idx];
                    this.dispatchEvent(
                        new CustomEvent('history-select', {
                            detail: { city: entry.city },
                            bubbles: true,
                            composed: true,
                        }),
                    );
                });
            });
    }

    handleClear() {
        if (confirm('Wyczyścić całą historię?')) {
            authService.clearHistory();
            this.render();
        }
    }

    refresh() {
        this.render();
    }
}

customElements.define('search-history', SearchHistoryComponent);
