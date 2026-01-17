import { stateManager } from '../state/stateManager.js';
import { weatherService } from '../api/weatherService.js'; // Dodany import serwisu

class ChartComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.chart = null;
    }

    static get observedAttributes() {
        return ['data-chart-type'];
    }

    async connectedCallback() {
        this.render();

        // 1. Nasłuchuj na zmianę miasta, żeby pobrać dla niego historię ostatnich 7 dni
        stateManager.subscribe('currentCity', async (city) => {
            await this.fetchLast7Days(city);
        });

        // 2. Jeśli miasto już jest, pobierz dane od razu
        const currentCity = stateManager.get('currentCity');
        if (currentCity) {
            await this.fetchLast7Days(currentCity);
        }
    }

    async fetchLast7Days(city) {
        try {
            // Oblicz daty: dzisiaj i 7 dni temu
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 7);

            // Format YYYY-MM-DD
            const formatDate = (date) => date.toISOString().split('T')[0];

            const data = await weatherService.getHistoricalData(
                city,
                formatDate(start),
                formatDate(end)
            );

            this.updateChart(data);
        } catch (error) {
            console.error('Błąd pobierania wykresu historii:', error);
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .chart-container {
                    position: relative; height: 300px;
                    background: white; border-radius: 8px; padding: 1rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                canvas { display: block; width: 100% !important; height: 280px !important; }
            </style>
            <div class="chart-container">
                <canvas id="chartCanvas"></canvas>
            </div>
        `;
    }

    updateChart(historicalData) {
        if (!historicalData || !historicalData.timestamps) return;

        const canvas = this.shadowRoot.querySelector('#chartCanvas');
        const ctx = canvas.getContext('2d');
        const chartType = this.getAttribute('data-chart-type') || 'temperature';

        // Przygotuj dane (podobnie jak w HistoricalChart, ale prościej)
        const labels = historicalData.timestamps.map((t) => {
            return new Date(t).toLocaleDateString('pl-PL', {
                weekday: 'short',
                day: 'numeric',
            });
        });

        // Wybierz dane w zależności od atrybutu
        let dataValues = historicalData.temperature;
        let label = 'Temperatura (°C)';
        let color = '#FF6B6B';

        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: label,
                        data: dataValues,
                        borderColor: color,
                        backgroundColor: color + '20', // lekko przezroczysty
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false } },
            },
        });
    }
}

customElements.define('weather-chart', ChartComponent);
export { ChartComponent };
