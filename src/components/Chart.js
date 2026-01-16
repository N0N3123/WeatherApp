/**
 * Chart Component
 * Wykresy (wymaga Chart.js)
 */

import { stateManager } from '../state/stateManager.js';

class ChartComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.chart = null;
        this.unsubscribe = null;
    }

    static get observedAttributes() {
        return ['data-chart-type'];
    }

    connectedCallback() {
        this.render();

        this.unsubscribe = stateManager.subscribe('forecast', (data) => {
            if (data) {
                this.updateChart(data);
            }
        });

        console.log('✅ ChartComponent mounted');
    }

    disconnectedCallback() {
        if (this.chart) {
            this.chart.destroy();
        }
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .chart-container {
                    position: relative;
                    height: 300px;
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                canvas {
                    display: block;
                    width: 100% !important;
                    height: 280px !important;
                }

                .loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 280px;
                    color: #999;
                    position: absolute;
                    top: 1rem;
                    left: 1rem;
                    right: 1rem;
                    background: white;
                    border-radius: 4px;
                }

                .loading.hidden {
                    display: none;
                }
            </style>

            <div class="chart-container">
                <div class="loading">Ładowanie wykresu...</div>
                <canvas id="chartCanvas"></canvas>
            </div>
        `;
    }

    updateChart(forecastData) {
        if (!forecastData || !forecastData.list) return;

        const chartType = this.getAttribute('data-chart-type') || 'temperature';
        const labels = [];
        const data = [];

        // Przygotuj dane do wykresu - 7 dni prognozy
        forecastData.list.forEach((item) => {
            const date = new Date(item.dt * 1000);
            const dayName = date.toLocaleDateString('pl-PL', {
                weekday: 'short',
                month: '2-digit',
                day: '2-digit',
            });
            labels.push(dayName);

            if (chartType === 'temperature') {
                // Średnia z max i min dla daily data
                data.push((item.main.temp_max + item.main.temp_min) / 2);
            } else if (chartType === 'humidity') {
                // Dla daily data użyjemy main.humidity jeśli dostępne
                data.push(item.main.humidity || 0);
            } else if (chartType === 'pressure') {
                data.push(item.main.pressure || 0);
            }
        });

        this.renderChart(labels, data, chartType);
    }

    renderChart(labels, data, chartType) {
        const canvas = this.shadowRoot.querySelector('#chartCanvas');
        const loading = this.shadowRoot.querySelector('.loading');

        if (!canvas) return;

        // Ukryj loading
        if (loading) {
            loading.classList.add('hidden');
        }

        // Zniszcz stary chart
        if (this.chart) {
            this.chart.destroy();
        }

        // Konfiguracja wg typu wykresu
        const configs = {
            temperature: {
                label: 'Temperatura (°C)',
                borderColor: '#FF6B6B',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
            },
            humidity: {
                label: 'Wilgotność (%)',
                borderColor: '#4ECDC4',
                backgroundColor: 'rgba(78, 205, 196, 0.1)',
            },
            pressure: {
                label: 'Ciśnienie (hPa)',
                borderColor: '#FFE66D',
                backgroundColor: 'rgba(255, 230, 109, 0.1)',
            },
        };

        const config = configs[chartType] || configs.temperature;

        // Tworzenie wykresu - Chart.js musi być załadowany
        if (typeof Chart !== 'undefined') {
            this.chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: config.label,
                            data,
                            borderColor: config.borderColor,
                            backgroundColor: config.backgroundColor,
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: config.borderColor,
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grace: '5%',
                        },
                        x: {
                            max: 20,
                        },
                    },
                },
            });
        }
    }
}

customElements.define('weather-chart', ChartComponent);

export { ChartComponent };
