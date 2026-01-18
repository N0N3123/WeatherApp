/**
 * AuthService - Obsługa rejestracji, logowania, sesji
 * localStorage bez backendu, simple hash (demo purposes)
 */

class AuthService {
    constructor() {
        this.USERS_KEY = 'weather_users';
        this.SESSION_KEY = 'weather_session';
        this.HISTORY_KEY = 'weather_search_history';
        this.FAVORITES_KEY = 'weather_favorites';

        // Pytania bezpieczeństwa
        this.SECURITY_QUESTIONS = [
            'Jak ma na imię Twoje pierwsze zwierzę domowe?',
            'W jakim mieście się urodziłeś?',
            'Jakie jest imię Twojej matki?',
            'Jak ma na imię Twój najlepszy przyjaciel ze szkoły?',
            'Jaka jest nazwa Twojej ulicy, na której mieszkasz?',
            'Jakie jest Twoje ulubione jedzenie?',
            'W którym roku skończyłeś/aś szkołę podstawową?',
            'Jakie jest imię Twojego ojca?',
        ];

        // Załaduj istniejące dane lub utwórz puste
        this.ensureStorageInitialized();
    }

    /**
     * Inicjalizuj storage jeśli pusty
     */
    ensureStorageInitialized() {
        if (!localStorage.getItem(this.USERS_KEY)) {
            // Stwórz demo usera
            const demoUser = {
                id: '1',
                username: 'test',
                email: 'test@test.com',
                passwordHash: this.hashPassword('test123'),
                securityQuestionIndex: 0,
                securityAnswerHash: this.hashPassword('mruczek'),
                createdAt: new Date().toISOString(),
            };
            localStorage.setItem(this.USERS_KEY, JSON.stringify([demoUser]));
        }
        if (!localStorage.getItem(this.HISTORY_KEY)) {
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify([]));
        }

        // NAPRAW strukturę ulubionych - powinna być obiektem {userId: [miasta]}
        const favKey = this.FAVORITES_KEY;
        const current = localStorage.getItem(favKey);

        if (!current) {
            localStorage.setItem(favKey, JSON.stringify({}));
        } else {
            try {
                const parsed = JSON.parse(current);
                // Jeśli to tablica, zamień na obiekt
                if (Array.isArray(parsed)) {
                    console.warn(
                        '⚠️ Stara struktura ulubionych (tablica), resetuję do obiektu',
                    );
                    localStorage.setItem(favKey, JSON.stringify({}));
                }
            } catch (e) {
                console.error('❌ Błąd parsowania ulubionych, resetuję');
                localStorage.setItem(favKey, JSON.stringify({}));
            }
        }
    }

    /**
     * Super prosty hash (demo! w production używaj bcrypt)
     * @param {string} password
     * @returns {string}
     */
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Rejestracja nowego użytkownika
     * @param {string} username
     * @param {string} email
     * @param {string} password
     * @param {number} securityQuestionIndex - indeks pytania z listy
     * @param {string} securityAnswer - odpowiedź na pytanie
     * @returns {Object} {success, message, user}
     */
    register(username, email, password, securityQuestionIndex, securityAnswer) {
        if (
            !username ||
            !email ||
            !password ||
            securityQuestionIndex === undefined ||
            !securityAnswer
        ) {
            return { success: false, message: '❌ Uzupełnij wszystkie pola!' };
        }

        if (username.length < 3) {
            return {
                success: false,
                message: '❌ Nazwa musi mieć min 3 znaki!',
            };
        }

        if (!this.isValidEmail(email)) {
            return {
                success: false,
                message: '❌ Wpisz poprawny email!',
            };
        }

        if (password.length < 5) {
            return {
                success: false,
                message: '❌ Hasło musi mieć min 5 znaków!',
            };
        }

        if (securityAnswer.trim().length < 2) {
            return {
                success: false,
                message: '❌ Odpowiedź na pytanie nie może być pusta!',
            };
        }

        const users = JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];

        // Sprawdź czy user już istnieje
        if (users.some((u) => u.username === username)) {
            return { success: false, message: '❌ Użytkownik już istnieje!' };
        }

        // Sprawdź czy email już istnieje
        if (users.some((u) => u.email === email)) {
            return {
                success: false,
                message: '❌ Ten email już jest w użyciu!',
            };
        }

        // Utwórz nowego użytkownika
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            passwordHash: this.hashPassword(password),
            securityQuestionIndex: parseInt(securityQuestionIndex),
            securityAnswerHash: this.hashPassword(
                securityAnswer.toLowerCase().trim(),
            ),
            createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

        console.log('✅ Użytkownik zarejestrowany:', username);
        return {
            success: true,
            message: '✅ Rejestracja udana!',
            user: { id: newUser.id, username: newUser.username },
        };
    }

    /**
     * Waliduj format emaila
     * @param {string} email
     * @returns {boolean}
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Logowanie
     * @param {string} usernameOrEmail - Nazwa użytkownika LUB email
     * @param {string} password
     * @returns {Object} {success, message, user}
     */
    login(usernameOrEmail, password) {
        if (!usernameOrEmail || !password) {
            return { success: false, message: '❌ Uzupełnij wszystkie pola!' };
        }

        const users = JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
        // Szukaj po username LUB email
        const user = users.find(
            (u) =>
                u.username === usernameOrEmail || u.email === usernameOrEmail,
        );

        if (!user) {
            return { success: false, message: '❌ Użytkownik nie istnieje!' };
        }

        const passwordHash = this.hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            return { success: false, message: '❌ Złe hasło!' };
        }

        // Utwórz sesję
        const session = {
            id: user.id,
            username: user.username,
            token: this.generateToken(),
            loginAt: new Date().toISOString(),
        };

        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

        console.log('✅ Zalogowano:', user.username);
        return {
            success: true,
            message: '✅ Zalogowano!',
            user: { id: user.id, username: user.username },
        };
    }

    /**
     * Wyloguj
     */
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        console.log('✅ Wylogowano');
    }

    /**
     * Ulubione miasta dla zalogowanego użytkownika
     */
    getFavorites() {
        const session = this.getCurrentSession();
        console.log('📖 getFavorites - session:', session);
        if (!session) {
            console.log('⚠️ Brak sesji w getFavorites!');
            return [];
        }
        const all = JSON.parse(localStorage.getItem(this.FAVORITES_KEY)) || {};
        console.log('📦 Cała tablica ulubionych z storage:', all);
        console.log('🔍 Szukam klucza:', session.id);
        const result = all[session.id] || [];
        console.log('✅ Zwracam:', result);
        return result;
    }

    addFavorite(city) {
        const session = this.getCurrentSession();
        console.log('💾 addFavorite:', city, 'session:', session);
        if (!session) {
            console.warn('⚠️ Brak sesji!');
            return;
        }
        const all = JSON.parse(localStorage.getItem(this.FAVORITES_KEY)) || {};
        const list = all[session.id] || [];
        if (!list.includes(city)) {
            list.push(city);
            all[session.id] = list;
            localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(all));
            console.log('✅ Dodano ulubione:', city, 'lista:', list);
        } else {
            console.log('ℹ️ Już w ulubionych:', city);
        }
    }

    removeFavorite(city) {
        const session = this.getCurrentSession();
        if (!session) return;
        const all = JSON.parse(localStorage.getItem(this.FAVORITES_KEY)) || {};
        const list = (all[session.id] || []).filter((c) => c !== city);
        all[session.id] = list;
        localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(all));
    }

    /**
     * Pobierz pytania bezpieczeństwa
     * @returns {Array}
     */
    getSecurityQuestions() {
        return this.SECURITY_QUESTIONS;
    }

    /**
     * Pobierz pytanie dla użytkownika po emailu
     * @param {string} email
     * @returns {Object} {questionIndex, question} lub null
     */
    getSecurityQuestionByEmail(email) {
        const users = JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
        const user = users.find((u) => u.email === email);

        if (!user) return null;

        return {
            questionIndex: user.securityQuestionIndex,
            question: this.SECURITY_QUESTIONS[user.securityQuestionIndex],
            email: user.email,
        };
    }

    /**
     * Weryfikuj odpowiedź na pytanie bezpieczeństwa
     * @param {string} email
     * @param {string} answer
     * @returns {Object} {success, message}
     */
    verifySecurityAnswer(email, answer) {
        const users = JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
        const user = users.find((u) => u.email === email);

        if (!user) {
            return { success: false, message: '❌ Użytkownik nie istnieje!' };
        }

        const answerHash = this.hashPassword(answer.toLowerCase().trim());
        if (user.securityAnswerHash !== answerHash) {
            return { success: false, message: '❌ Zła odpowiedź na pytanie!' };
        }

        return { success: true, message: '✅ Poprawna odpowiedź!' };
    }

    /**
     * Resetuj hasło po weryfikacji pytania
     * @param {string} email
     * @param {string} newPassword
     * @returns {Object}
     */
    resetPasswordBySecurityQuestion(email, newPassword) {
        if (!email || !newPassword) {
            return { success: false, message: '❌ Brak emailu lub hasła!' };
        }

        if (newPassword.length < 5) {
            return {
                success: false,
                message: '❌ Hasło musi mieć min 5 znaków!',
            };
        }

        const users = JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
        const user = users.find((u) => u.email === email);

        if (!user) {
            return { success: false, message: '❌ Użytkownik nie istnieje!' };
        }

        user.passwordHash = this.hashPassword(newPassword);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

        console.log('✅ Hasło zresetowane dla:', email);
        return {
            success: true,
            message:
                '✅ Hasło zostało zresetowane! Możesz się teraz zalogować.',
        };
    }

    /**
     * Pobierz obecną sesję
     * @returns {Object|null}
     */
    getCurrentSession() {
        const session = localStorage.getItem(this.SESSION_KEY);
        if (!session) return null;
        try {
            return JSON.parse(session);
        } catch (e) {
            console.warn('⚠️ Czyszczę stary format session', e);
            localStorage.removeItem(this.SESSION_KEY);
            return null;
        }
    }

    /**
     * Sprawdź czy user zalogowany
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.getCurrentSession();
    }

    /**
     * Generuj prosty token
     * @returns {string}
     */
    generateToken() {
        return Math.random().toString(36).substr(2) + Date.now().toString(36);
    }

    /**
     * Dodaj do historii wyszukań
     * @param {string} city
     * @param {Object} weatherData
     */
    addToHistory(city, weatherData) {
        const session = this.getCurrentSession();
        if (!session) return;

        const history =
            JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || [];

        const entry = {
            id: Date.now().toString(),
            userId: session.id,
            city,
            temperature: weatherData?.main?.temp || 0,
            condition: weatherData?.weather?.[0]?.main || 'N/A',
            timestamp: new Date().toISOString(),
        };

        history.unshift(entry); // Dodaj na początek
        localStorage.setItem(
            this.HISTORY_KEY,
            JSON.stringify(history.slice(0, 100)),
        ); // Max 100 pozycji

        console.log('✅ Dodano do historii:', city);
    }

    /**
     * Pobierz historię dla zalogowanego użytkownika
     * @returns {Array}
     */
    getHistory() {
        const session = this.getCurrentSession();
        if (!session) return [];

        const history =
            JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || [];
        return history.filter((entry) => entry.userId === session.id);
    }

    /**
     * Usuń wpis z historii
     * @param {string} entryId
     */
    deleteHistoryEntry(entryId) {
        const history =
            JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || [];
        const filtered = history.filter((entry) => entry.id !== entryId);
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(filtered));
        console.log('✅ Usunięto z historii');
    }

    /**
     * Wyczyść całą historię
     */
    clearHistory() {
        const session = this.getCurrentSession();
        if (!session) return;

        const history =
            JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || [];
        const filtered = history.filter((entry) => entry.userId !== session.id);
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(filtered));
        console.log('✅ Historia wyczyszczona');
    }

    /**
     * Zaproś reset hasła
     * @param {string} email
     * @returns {Object}
     */
    requestPasswordReset(email) {
        const users = JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
        const user = users.find((u) => u.email === email);

        if (!user) {
            // Nie zdradź czy email istnieje
            return {
                success: true,
                message:
                    '✅ Jeśli email istnieje, wysłaliśmy link do resetu hasła',
            };
        }

        // Wygeneruj token resetu
        const resetToken =
            Math.random().toString(36).substr(2) + Date.now().toString(36);
        const resetTokens =
            JSON.parse(localStorage.getItem('weather_reset_tokens')) || {};

        resetTokens[resetToken] = {
            userId: user.id,
            email: user.email,
            expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 godzina
            createdAt: new Date().toISOString(),
        };
        localStorage.setItem(
            'weather_reset_tokens',
            JSON.stringify(resetTokens),
        );

        // Symulacja wysłania emaila - w real app byś użył serwera
        console.log(
            `📧 Link do resetu: ${window.location.origin}?resetToken=${resetToken}`,
        );
        console.log(`📧 Wysłano email na: ${email}`);

        return {
            success: true,
            message: '✅ Jeśli email istnieje, wysłaliśmy link do resetu hasła',
        };
    }

    /**
     * Zresetuj hasło za pomocą tokena
     * @param {string} resetToken
     * @param {string} newPassword
     * @returns {Object}
     */
    resetPassword(resetToken, newPassword) {
        if (!resetToken || !newPassword) {
            return { success: false, message: '❌ Brak tokena lub hasła!' };
        }

        if (newPassword.length < 5) {
            return {
                success: false,
                message: '❌ Hasło musi mieć min 5 znaków!',
            };
        }

        const resetTokens =
            JSON.parse(localStorage.getItem('weather_reset_tokens')) || {};
        const tokenData = resetTokens[resetToken];

        if (!tokenData) {
            return {
                success: false,
                message: '❌ Nieprawidłowy token resetu!',
            };
        }

        if (new Date(tokenData.expiresAt) < new Date()) {
            delete resetTokens[resetToken];
            localStorage.setItem(
                'weather_reset_tokens',
                JSON.stringify(resetTokens),
            );
            return { success: false, message: '❌ Token resetu wygasł!' };
        }

        // Znajdź użytkownika i zmień hasło
        const users = JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
        const user = users.find((u) => u.id === tokenData.userId);

        if (user) {
            user.passwordHash = this.hashPassword(newPassword);
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        }

        // Usuń token
        delete resetTokens[resetToken];
        localStorage.setItem(
            'weather_reset_tokens',
            JSON.stringify(resetTokens),
        );

        console.log('✅ Hasło zostało zresetowane');
        return {
            success: true,
            message:
                '✅ Hasło zostało zresetowane! Możesz się teraz zalogować.',
        };
    }
}

export const authService = new AuthService();
