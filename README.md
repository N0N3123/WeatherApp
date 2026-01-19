# 🌤️ Weather App - JS SPA

Zaawansowana aplikacja pogodowa typu Single Page Application (SPA) napisana w **czystym JavaScript (Vanilla JS)**, bez użycia frameworków. Projekt demonstruje znajomość standardów webowych, wykorzystując **Web Components**, **Shadow DOM**.

Aplikacja oferuje szczegółowe prognozy, analizę danych historycznych z ponad 80 lat wstecz oraz w pełni funkcjonalny system kont użytkowników działający w oparciu o `localStorage`.

## 🚀 Demo Online

Aplikacja jest dostępna publicznie pod adresem:
**[https://n0n3123.github.io/WeatherApp/]**

_(Kliknij powyższy link, aby przetestować aplikację bez instalacji)_

## ✨ Kluczowe Funkcjonalności

### 🌍 Pogoda i Prognozy

- **Bieżąca pogoda:** Temperatura, odczuwalna, wiatr, wilgotność, ciśnienie, widoczność.
- **Inteligentne Wyszukiwanie:** Autouzupełnianie (autocomplete) z walidacją nazw miast.
- **Prognoza 7-dniowa:** Interaktywna lista z możliwością podglądu szczegółów każdego dnia (wschód/zachód słońca, opady, status).
- **Własny Silnik Wykresów:** Rysowane od zera na `HTML5 Canvas` (krzywe Beziera) wykresy trendów temperatury – bez zewnętrznych bibliotek.
- **Dane Historyczne:** Analiza pogody do **80 lat wstecz** z interaktywnym wykresem (zoom, przesuwanie).

### 👤 System Użytkownika (Client-Side Backend)

- **Pełna Autoryzacja:** Rejestracja i logowanie użytkowników.
- **Bezpieczeństwo:** Hasła są haszowane (symulacja) przed zapisaniem w przeglądarce.
- **Reset Hasła:** Mechanizm odzyskiwania hasła za pomocą pytań bezpieczeństwa (Security Questions).
- **Personalizacja:**
  - Ulubione miasta (dodawanie/usuwanie "serduszkiem").
  - Historia wyszukiwań przypisana do konkretnego konta.

## 🛠️ Stack Technologiczny

Projekt został zrealizowany w filozofii **"No Frameworks"**, aby pokazać zrozumienie natywnych mechanizmów przeglądarki.

- **Język:** JavaScript (ES6+ Modules).
- **Architektura:**
  - **Web Components:** Hermetyzacja logiki i stylów (Shadow DOM).
  - **State Management:** Autorska implementacja wzorca Obserwatora do reaktywnego odświeżania UI.
  - **Modularność:** Podział na serwisy (API, Auth), Utils i Komponenty.
- **API:** [Open-Meteo](https://open-meteo.com/) (Free Weather API).
- **CSS:** Natywne zmienne CSS (Custom Properties), Flexbox/Grid, RWD (Mobile First).
- **Storage:** `localStorage` jako baza danych.

## 🔐 Dane Testowe (Demo)

Aplikacja posiada wstępnie skonfigurowanego użytkownika demo:

- **Login:** test
- **Hasło:** test123

## 📂 Struktura Projektu

```text
src/
├── api/             # Logika komunikacji z API i symulacja Auth
├── components/      # Web Components (UI)
├── state/           # Zarządzanie stanem aplikacji
├── styles/          # Style CSS
├── utils/           # Formatterzy i Walidatory
├── config.js        # Konfiguracja API i stałe
└── index.js         # Punkt wejścia aplikacji
index.html               # Główny plik HTML
```

<small>Projekt zrealizowany w ramach zaliczenia przedmiotu</small>
