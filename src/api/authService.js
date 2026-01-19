class AuthService {
    constructor() {
        this.USERS_KEY = 'weather_users';
        this.SESSION_KEY = 'weather_session';
        this.HISTORY_KEY = 'weather_search_history';
        this.FAVORITES_KEY = 'weather_favorites';

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

        this.ensureStorageInitialized();
    }

    ensureStorageInitialized() {
        if (!localStorage.getItem(this.USERS_KEY)) {
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

        const favKey = this.FAVORITES_KEY;
        const current = localStorage.getItem(favKey);

        if (!current) {
            localStorage.setItem(favKey, JSON.stringify({}));
        } else {
            try {
                const parsed = JSON.parse(current);
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

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

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

        if (users.some((u) => u.username === username)) {
            return { success: false, message: '❌ Użytkownik już istnieje!' };
        }

        if (users.some((u) => u.email === email)) {
            return {
                success: false,
                message: '❌ Ten email już jest w użyciu!',
            };
        }

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

    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    login(usernameOrEmail, password) {
        if (!usernameOrEmail || !password) {
            return { success: false, message: '❌ Uzupełnij wszystkie pola!' };
        }

        const users = JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
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

    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        console.log('✅ Wylogowano');
    }

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

    getSecurityQuestions() {
        return this.SECURITY_QUESTIONS;
    }

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

    isAuthenticated() {
        return !!this.getCurrentSession();
    }

    generateToken() {
        return Math.random().toString(36).substr(2) + Date.now().toString(36);
    }

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

        history.unshift(entry);
        localStorage.setItem(
            this.HISTORY_KEY,
            JSON.stringify(history.slice(0, 100)),
        );

        console.log('✅ Dodano do historii:', city);
    }

    getHistory() {
        const session = this.getCurrentSession();
        if (!session) return [];

        const history =
            JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || [];
        return history.filter((entry) => entry.userId === session.id);
    }

    deleteHistoryEntry(entryId) {
        const history =
            JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || [];
        const filtered = history.filter((entry) => entry.id !== entryId);
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(filtered));
        console.log('✅ Usunięto z historii');
    }

    clearHistory() {
        const session = this.getCurrentSession();
        if (!session) return;

        const history =
            JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || [];
        const filtered = history.filter((entry) => entry.userId !== session.id);
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(filtered));
        console.log('✅ Historia wyczyszczona');
    }

    requestPasswordReset(email) {
        const users = JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
        const user = users.find((u) => u.email === email);

        if (!user) {
            return {
                success: true,
                message:
                    '✅ Jeśli email istnieje, wysłaliśmy link do resetu hasła',
            };
        }

        const resetToken =
            Math.random().toString(36).substr(2) + Date.now().toString(36);
        const resetTokens =
            JSON.parse(localStorage.getItem('weather_reset_tokens')) || {};

        resetTokens[resetToken] = {
            userId: user.id,
            email: user.email,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            createdAt: new Date().toISOString(),
        };
        localStorage.setItem(
            'weather_reset_tokens',
            JSON.stringify(resetTokens),
        );

        console.log(
            `📧 Link do resetu: ${window.location.origin}?resetToken=${resetToken}`,
        );
        console.log(`📧 Wysłano email na: ${email}`);

        return {
            success: true,
            message: '✅ Jeśli email istnieje, wysłaliśmy link do resetu hasła',
        };
    }

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

        const users = JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
        const user = users.find((u) => u.id === tokenData.userId);

        if (user) {
            user.passwordHash = this.hashPassword(newPassword);
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        }

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
