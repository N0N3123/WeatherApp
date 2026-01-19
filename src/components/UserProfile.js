import { stateManager } from '../state/stateManager.js';
import { authService } from '../api/authService.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: block;
        }
        .profile-container {
            background: #f0f4ff;
            border-radius: 8px;
            padding: 1.25rem 1.5rem;
            margin: 1rem 0;
            border-left: 4px solid #667eea;
        }
        .profile-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        .profile-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #333;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .profile-info {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 0.8rem;
            background: white;
            border-radius: 6px;
            font-size: 0.95rem;
        }
        .info-label {
            font-weight: 600;
            color: #667eea;
        }
        .info-value {
            color: #333;
            text-align: right;
        }
        .hidden {
            display: none;
        }
    </style>

    <div class="profile-container hidden" id="profileContainer">
        <div class="profile-header">
            <h3 class="profile-title">👤 Profil użytkownika</h3>
        </div>
        <div class="profile-info">
            <div class="info-row">
                <span class="info-label">Zalogowany jako:</span>
                <span class="info-value" id="username">-</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value" id="email">-</span>
            </div>
            <div class="info-row">
                <span class="info-label">Ostatnie odwiedzenie:</span>
                <span class="info-value" id="lastVisit">-</span>
            </div>
            <div class="info-row">
                <span class="info-label">Liczba ulubionych:</span>
                <span class="info-value" id="favoritesCount">0</span>
            </div>
            <div class="info-row">
                <span class="info-label">Najczęściej wyszukiwane:</span>
                <span class="info-value" id="topCity">-</span>
            </div>
        </div>
    </div>
`;

class UserProfile extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this.subscribeToState();
        this.updateProfile();
    }

    subscribeToState() {
        stateManager.subscribe('user', (newUser) => {
            this.updateProfile();
        });

        stateManager.subscribe('favorites', (newFavorites) => {
            this.updateProfile();
        });

        stateManager.subscribe('lastUpdated', () => {
            this.updateProfile();
        });
    }

    updateProfile() {
        const user = stateManager.get('user');
        const container = this.shadowRoot.getElementById('profileContainer');

        if (!user) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        const username = this.shadowRoot.getElementById('username');
        const email = this.shadowRoot.getElementById('email');
        const lastVisit = this.shadowRoot.getElementById('lastVisit');
        const favoritesCount = this.shadowRoot.getElementById('favoritesCount');
        const topCity = this.shadowRoot.getElementById('topCity');

        username.textContent = user.name || 'Gość';
        email.textContent = user.email || '-';

        const lastVisitTime = localStorage.getItem('weather_last_visit');
        if (lastVisitTime) {
            const date = new Date(lastVisitTime);
            const formattedDate = date.toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
            lastVisit.textContent = formattedDate;
        } else {
            lastVisit.textContent = 'Dzisiaj';
        }

        const favorites = stateManager.get('favorites');
        favoritesCount.textContent = (favorites || []).length;

        const history = authService.getHistory();
        const mostSearched = this.getMostSearchedCity(history);
        topCity.textContent = mostSearched || '-';

        localStorage.setItem('weather_last_visit', new Date().toISOString());
    }

    getMostSearchedCity(history) {
        if (!history || history.length === 0) return null;

        const cityCount = {};
        history.forEach((entry) => {
            if (entry.city) {
                cityCount[entry.city] = (cityCount[entry.city] || 0) + 1;
            }
        });

        if (Object.keys(cityCount).length === 0) return null;
        let maxCity = null;
        let maxCount = 0;
        for (const [city, count] of Object.entries(cityCount)) {
            if (count > maxCount) {
                maxCount = count;
                maxCity = city;
            }
        }

        return maxCity;
    }
}

customElements.define('user-profile', UserProfile);
