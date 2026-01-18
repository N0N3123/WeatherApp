/**
 * Login Component - Register + Login
 * 2 karty: Rejestracja i Logowanie
 * Web Component z Shadow DOM
 */

import { authService } from '../api/authService.js';
import { stateManager } from '../state/stateManager.js';

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
        .overlay.hidden {
            display: none !important;
        }
        .login-card {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            width: 90%;
            max-width: 450px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            animation: slideUp 0.3s ease;
            position: relative;
        }
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        h2 {
            margin: 0 0 0.5rem 0;
            color: #333;
            text-align: center;
        }
        .tabs {
            display: flex;
            gap: 0;
            margin-bottom: 1.5rem;
            border-bottom: 2px solid #eee;
        }
        .tab-btn {
            flex: 1;
            padding: 1rem;
            background: none;
            border: none;
            cursor: pointer;
            font-weight: 600;
            color: #999;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
            font-size: 1rem;
        }
        .tab-btn.active {
            color: #667eea;
            border-bottom-color: #667eea;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        input {
            width: 100%;
            padding: 12px;
            margin-bottom: 1rem;
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
            width: 100%;
            font-weight: bold;
            transition: transform 0.2s;
        }
        button:hover {
            transform: scale(1.02);
        }
        button:active {
            transform: scale(0.98);
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
        .close-btn {
            position: absolute;
            top: 12px;
            right: 12px;
            background: transparent;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #999;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s;
            padding: 0;
        }
        .close-btn:hover { 
            color: #333; 
            background: #f0f0f0;
        }
        .login-hint {
            text-align: center;
            font-size: 0.9rem;
            color: #666;
            margin-top: 1rem;
        }
        .forgot-password {
            text-align: center;
            margin-top: 0.5rem;
        }
        .forgot-password a {
            color: #667eea;
            text-decoration: none;
            font-size: 0.85rem;
            cursor: pointer;
        }
        .forgot-password a:hover {
            text-decoration: underline;
        }
    </style>

    <div id="modal" class="overlay">
        <div class="login-card">
            <button class="close-btn" id="closeBtn" aria-label="Zamknij">✕</button>
            <h2>🌍 WeatherApp</h2>

            <div class="message" id="message"></div>

            <div class="tabs">
                <button class="tab-btn active" data-tab="login">Logowanie</button>
                <button class="tab-btn" data-tab="register">Rejestracja</button>
            </div>

            <!-- LOGOWANIE -->
            <form id="loginForm" class="tab-content active">
                <input type="text" id="loginUsername" placeholder="Nazwa użytkownika lub email" required>
                <input type="password" id="loginPassword" placeholder="Hasło" required>
                <button type="submit">Zaloguj się 🚀</button>
                <div class="login-hint">Demo: user "test" / hasło "test123"</div>
                <div class="forgot-password">
                    <a id="forgotLink">Zapomniałeś hasła?</a>
                </div>
            </form>

            <!-- REJESTRACJA -->
            <form id="registerForm" class="tab-content">
                <input type="text" id="registerUsername" placeholder="Nazwa użytkownika (min 3 znaki)" required>
                <input type="email" id="registerEmail" placeholder="Email" required>
                <input type="password" id="registerPassword" placeholder="Hasło (min 5 znaków)" required>
                <input type="password" id="registerPasswordConfirm" placeholder="Powtórz hasło" required>
                
                <label for="registerQuestion" style="display: block; margin-top: 1rem; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: #333;">Pytanie bezpieczeństwa (do resetu hasła):</label>
                <select id="registerQuestion" required style="width: 100%; padding: 12px; margin-bottom: 1rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">
                    <option value="">-- Wybierz pytanie --</option>
                </select>
                
                <input type="text" id="registerAnswer" placeholder="Twoja odpowiedź" required>
                
                <button type="submit">Zarejestruj się ✨</button>
            </form>
        </div>
    </div>
`;

class LoginComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this.modal = this.shadowRoot.getElementById('modal');
        this.loginForm = this.shadowRoot.getElementById('loginForm');
        this.registerForm = this.shadowRoot.getElementById('registerForm');
        this.messageEl = this.shadowRoot.getElementById('message');
        this.tabBtns = this.shadowRoot.querySelectorAll('.tab-btn');
        this.closeBtn = this.shadowRoot.getElementById('closeBtn');
        this.forgotLink = this.shadowRoot.getElementById('forgotLink');
        this.questionSelect =
            this.shadowRoot.getElementById('registerQuestion');

        // Załaduj pytania bezpieczeństwa
        this.loadSecurityQuestions();

        // Sprawdź czy user zalogowany
        if (authService.isAuthenticated()) {
            this.hideModal();
        }

        // Tab switching
        this.tabBtns.forEach((btn) => {
            btn.addEventListener('click', (e) =>
                this.switchTab(e.target.dataset.tab),
            );
        });

        // Login submit
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Register submit
        this.registerForm.addEventListener('submit', (e) =>
            this.handleRegister(e),
        );

        // Forgot password
        if (this.forgotLink) {
            this.forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPassword();
            });
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.clearMessage();
                this.hideModal();
            });
        }

        console.log('✅ LoginComponent mounted');
    }

    loadSecurityQuestions() {
        const questions = authService.getSecurityQuestions();
        questions.forEach((q, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = q;
            this.questionSelect.appendChild(option);
        });
    }

    switchTab(tabName) {
        // Update buttons
        this.tabBtns.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update forms
        const contents = this.shadowRoot.querySelectorAll('.tab-content');
        contents.forEach((content) => {
            content.classList.remove('active');
        });

        const activeForm = this.shadowRoot.querySelector(
            tabName === 'login' ? '#loginForm' : '#registerForm',
        );
        activeForm.classList.add('active');

        this.clearMessage();
    }

    handleLogin(e) {
        e.preventDefault();

        const username = this.shadowRoot
            .getElementById('loginUsername')
            .value.trim();
        const password = this.shadowRoot.getElementById('loginPassword').value;

        const result = authService.login(username, password);

        if (result.success) {
            this.showMessage(result.message, 'success');
            stateManager.loginUser(result.user);

            setTimeout(() => {
                this.hideModal();
                this.dispatchEvent(
                    new CustomEvent('auth-complete', {
                        detail: result.user,
                        bubbles: true,
                        composed: true,
                    }),
                );
            }, 800);
        } else {
            this.showMessage(result.message, 'error');
        }
    }

    handleRegister(e) {
        e.preventDefault();

        const username = this.shadowRoot
            .getElementById('registerUsername')
            .value.trim();
        const email = this.shadowRoot
            .getElementById('registerEmail')
            .value.trim();
        const password =
            this.shadowRoot.getElementById('registerPassword').value;
        const passwordConfirm = this.shadowRoot.getElementById(
            'registerPasswordConfirm',
        ).value;
        const questionIndex =
            this.shadowRoot.getElementById('registerQuestion').value;
        const answer = this.shadowRoot
            .getElementById('registerAnswer')
            .value.trim();

        if (password !== passwordConfirm) {
            this.showMessage('❌ Hasła się nie zgadzają!', 'error');
            return;
        }

        const result = authService.register(
            username,
            email,
            password,
            questionIndex,
            answer,
        );

        if (result.success) {
            this.showMessage(result.message + ' Teraz się zaloguj!', 'success');

            setTimeout(() => {
                this.switchTab('login');
                this.shadowRoot.getElementById('loginUsername').value =
                    username;
                this.shadowRoot.getElementById('loginPassword').value = '';
            }, 1000);
        } else {
            this.showMessage(result.message, 'error');
        }
    }

    showMessage(text, type) {
        this.messageEl.textContent = text;
        this.messageEl.className = `message show ${type}`;
    }

    clearMessage() {
        this.messageEl.className = 'message';
        this.messageEl.textContent = '';
    }

    hideModal() {
        this.modal.classList.add('hidden');
    }

    showModal() {
        this.modal.classList.remove('hidden');
    }

    showForgotPassword() {
        const email = prompt('📧 Wpisz swój email:');
        if (!email) return;

        // Pobierz pytanie bezpieczeństwa
        const questionData = authService.getSecurityQuestionByEmail(email);
        if (!questionData) {
            this.showMessage(
                '❌ Nie znaleziono użytkownika z takim emailem!',
                'error',
            );
            return;
        }

        // Zapytaj o odpowiedź
        const answer = prompt(
            `❓ ${questionData.question}\n\nWpisz odpowiedź:`,
        );
        if (!answer) return;

        // Weryfikuj odpowiedź
        const verifyResult = authService.verifySecurityAnswer(email, answer);
        if (!verifyResult.success) {
            this.showMessage(verifyResult.message, 'error');
            return;
        }

        // Jeśli OK, zapytaj o nowe hasło
        const newPassword = prompt('🔐 Wpisz nowe hasło (min 5 znaków):');
        if (!newPassword) return;

        if (newPassword.length < 5) {
            this.showMessage('❌ Hasło musi mieć min 5 znaków!', 'error');
            return;
        }

        // Zresetuj hasło
        const resetResult = authService.resetPasswordBySecurityQuestion(
            email,
            newPassword,
        );
        this.showMessage(
            resetResult.message,
            resetResult.success ? 'success' : 'error',
        );

        if (resetResult.success) {
            setTimeout(() => {
                this.switchTab('login');
            }, 1500);
        }
    }
}

customElements.define('weather-login', LoginComponent);
export { LoginComponent };
