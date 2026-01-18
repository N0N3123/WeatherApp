/**
 * Reset Password Component
 * Obsługuje reset hasła za pomocą tokena
 */

import { authService } from '../api/authService.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }

        .reset-card {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            width: 100%;
            max-width: 450px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }

        h2 {
            margin: 0 0 1rem 0;
            color: #333;
            text-align: center;
        }

        .message {
            text-align: center;
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 6px;
            font-weight: 600;
            display: none;
        }

        .message.show {
            display: block;
        }

        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        input {
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            box-sizing: border-box;
            transition: border 0.3s;
        }

        input:focus {
            outline: none;
            border-color: #667eea;
        }

        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            font-weight: bold;
            transition: transform 0.2s;
        }

        button:hover {
            transform: scale(1.02);
        }

        button:active {
            transform: scale(0.98);
        }

        .back-link {
            text-align: center;
            margin-top: 1rem;
        }

        .back-link a {
            color: #667eea;
            text-decoration: none;
            font-size: 0.9rem;
            cursor: pointer;
        }

        .back-link a:hover {
            text-decoration: underline;
        }

        .info {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            color: #004085;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
        }
    </style>

    <div class="reset-card">
        <h2>🔐 Reset Hasła</h2>
        <div class="message" id="message"></div>

        <div class="info" id="info" style="display: none;">
            Sprawdź swoją skrzynkę email - link resetu powinien tam być!
        </div>

        <form id="resetForm">
            <input type="password" id="newPassword" placeholder="Nowe hasło (min 5 znaków)" required>
            <input type="password" id="newPasswordConfirm" placeholder="Powtórz nowe hasło" required>
            <button type="submit">Resetuj Hasło 🔄</button>
        </form>

        <div class="back-link">
            <a id="backLink">Wróć do logowania</a>
        </div>
    </div>
`;

class ResetPasswordComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.resetToken = null;
    }

    connectedCallback() {
        this.messageEl = this.shadowRoot.getElementById('message');
        this.infoEl = this.shadowRoot.getElementById('info');
        this.form = this.shadowRoot.getElementById('resetForm');
        this.backLink = this.shadowRoot.getElementById('backLink');

        // Pobierz token z URL
        const params = new URLSearchParams(window.location.search);
        this.resetToken = params.get('resetToken');

        if (!this.resetToken) {
            this.showMessage('❌ Brak tokena resetu w URL!', 'error');
            this.form.style.display = 'none';
            this.infoEl.style.display = 'block';
        }

        this.form.addEventListener('submit', (e) => this.handleReset(e));
        this.backLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = window.location.origin;
        });

        console.log('✅ ResetPasswordComponent mounted');
    }

    handleReset(e) {
        e.preventDefault();

        const newPassword = this.shadowRoot.getElementById('newPassword').value;
        const newPasswordConfirm =
            this.shadowRoot.getElementById('newPasswordConfirm').value;

        if (newPassword !== newPasswordConfirm) {
            this.showMessage('❌ Hasła się nie zgadzają!', 'error');
            return;
        }

        const result = authService.resetPassword(this.resetToken, newPassword);

        if (result.success) {
            this.showMessage(result.message, 'success');
            this.form.style.display = 'none';

            setTimeout(() => {
                window.location.href = window.location.origin;
            }, 2000);
        } else {
            this.showMessage(result.message, 'error');
        }
    }

    showMessage(text, type) {
        this.messageEl.textContent = text;
        this.messageEl.className = `message show ${type}`;
    }
}

customElements.define('reset-password', ResetPasswordComponent);
export { ResetPasswordComponent };
