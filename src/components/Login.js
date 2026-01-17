import { stateManager } from '../state/stateManager.js';

// Definicja szablonu HTML (Wymóg z zajęć!)
const template = document.createElement('template');
template.innerHTML = `
    <style>
        .overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(5px);
        }
        .login-card {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            width: 90%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        h2 { margin-top: 0; color: #333; }
        p { color: #666; margin-bottom: 1.5rem; }
        input {
            width: 100%;
            padding: 12px;
            margin-bottom: 1rem;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            box-sizing: border-box; /* Ważne dla paddingu */
        }
        input:focus { border-color: #667eea; outline: none; }
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            width: 100%;
            font-weight: bold;
            transition: transform 0.2s;
        }
        button:hover { transform: scale(1.02); }
        .hidden { display: none !important; }
    </style>

    <div id="modal" class="overlay">
        <div class="login-card">
            <h2>Witaj Podróżniku! 🌍</h2>
            <p>Podaj swoje imię, aby uzyskać dostęp do panelu.</p>
            <form id="loginForm">
                <input type="text" id="username" placeholder="Twoje imię..." required minlength="2">
                <button type="submit">Rozpocznij podróż 🚀</button>
            </form>
        </div>
    </div>
`;

class LoginComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Klonowanie szablonu
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this.modal = this.shadowRoot.getElementById('modal');
        this.form = this.shadowRoot.getElementById('loginForm');
        this.input = this.shadowRoot.getElementById('username');

        // Sprawdź czy user już jest zalogowany
        const currentUser = stateManager.get('user');
        if (currentUser) {
            this.modal.classList.add('hidden');
        }

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = this.input.value.trim();
            if (name) {
                stateManager.loginUser(name);
                this.modal.classList.add('hidden');
            }
        });
    }
}

customElements.define('weather-login', LoginComponent);
