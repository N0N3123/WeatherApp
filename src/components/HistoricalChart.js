/**
 * Historical Chart Component
 * Wykresy dla danych historycznych (80 lat wstecz!)
 * Selectory dat, różne metryki, zoom
 */

import { stateManager } from '../state/stateManager.js';

class HistoricalChartComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.chart = null;
        this.historicalData = null;
        this.unsubscribe = null;
        // Zoom i pan state
        this.zoomLevel = 1; // 1 = pełny zakres
        this.panOffset = 0; // Przesunięcie od 0 do 100%
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartOffset = 0;
    }

    static get observedAttributes() {
        return ['data-chart-type'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();

        this.unsubscribe = stateManager.subscribe('historicalData', (data) => {
            // Jeśli dane przyjdą (nie są null), rysuj wykres
            if (data) {
                this.historicalData = data;
                this.updateChart(data);
            }
        });

        // Ukryj slider na starcie
        this.updateControlsVisibility();

        console.log('✅ HistoricalChartComponent mounted');
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

                .historical-container {
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .controls {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .control-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                /* Ogólny styl dla etykiet inputów (Daty) */
                .control-group > label {
                    font-weight: 600;
                    color: #333;
                    cursor: default;
                }

                input[type="date"],
                select {
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 0.9rem;
                }

                .metrics-group {
                    display: flex;
                    gap: 1.5rem;
                    align-items: center;
                }

                /* --- ZMIANA: Styl dla labela obejmującego checkbox --- */
                .metric-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer; /* Łapka na całym obszarze */
                    user-select: none;
                    padding: 4px 8px; /* Powiększenie obszaru kliknięcia */
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                
                .metric-checkbox:hover {
                    background-color: #f0f0f0; /* Lekkie podświetlenie po najechaniu */
                }

                .metric-checkbox input[type="checkbox"] {
                    cursor: pointer;
                    width: 1rem;
                    height: 1rem;
                    flex-shrink: 0;
                }

                .metric-checkbox span {
                    cursor: pointer;
                    font-weight: 500;
                    color: #333;
                }

                button {
                    padding: 0.5rem 1rem;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.3s;
                }

                button:hover {
                    background: #5568d3;
                }

                .zoom-controls {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    margin: 1rem 0;
                    padding: 1rem;
                    background: #f9f9f9;
                    border-radius: 6px;
                    flex-wrap: wrap;
                }

                .zoom-controls button {
                    padding: 0.5rem 1rem;
                    font-size: 14px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background 0.3s;
                }

                .zoom-controls button:hover {
                    background: #5568d3;
                }

                .slider-container {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex: 1;
                    min-width: 200px;
                }

                .slider-container label {
                    font-weight: 600;
                    font-size: 14px;
                }

                .slider-container input[type="range"] {
                    flex: 1;
                    min-width: 150px;
                    cursor: pointer;
                }

                .chart-wrapper {
                    position: relative;
                    height: 400px;
                    margin-bottom: 1rem;
                }

                canvas {
                    display: block;
                    width: 100% !important;
                    height: 400px !important;
                }

                .loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 400px;
                    color: #999;
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    border-radius: 4px;
                    z-index: 10;
                }

                .loading.hidden {
                    display: none;
                }

                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 1rem;
                    margin-top: 1.5rem;
                    width: 100%;
                }

                .stat-box {
                    background: #f5f5f5;
                    padding: 1rem;
                    border-radius: 6px;
                    text-align: center;
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: #666;
                    margin-bottom: 0.5rem;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #667eea;
                }
            </style>

            <div class="historical-container">
                <div class="controls">
                    <div class="control-group">
                        <label>Od daty:</label>
                        <input type="date" id="startDate">
                    </div>
                    <div class="control-group">
                        <label>Do daty:</label>
                        <input type="date" id="endDate">
                    </div>
                    <div class="control-group metrics-group">
                        <label>Metryki:</label>
                        <label class="metric-checkbox">
                            <input type="checkbox" id="tempCheckbox" value="temperature" checked>
                            <span>Temperatura</span>
                        </label>
                        <label class="metric-checkbox">
                            <input type="checkbox" id="precipCheckbox" value="precipitation">
                            <span>Opady</span>
                        </label>
                        <label class="metric-checkbox">
                            <input type="checkbox" id="windCheckbox" value="wind">
                            <span>Wiatr</span>
                        </label>
                    </div>
                    <button id="loadBtn">Załaduj dane</button>
                </div>

                <div class="zoom-controls">
                    <button id="zoomInBtn" title="Powiększ (Zoom In)">🔍+</button>
                    <button id="zoomOutBtn" title="Pomniejsz (Zoom Out)">🔍-</button>
                    <div class="slider-container" id="sliderContainer">
                        <label>Przesunięcie:</label>
                        <input type="range" id="rangeSlider" min="0" max="100" value="0">
                    </div>
                </div>

                <div class="chart-wrapper">
                    <div class="loading">Wybierz zakres dat i metrikę...</div>
                    <canvas id="historicalCanvas"></canvas>
                    <small style="text-align: center; color: #666; margin-top: 0.5rem;">💡 Tip: Przytrzymaj LPM i przeciągnij aby przesunąć wykres</small>
                </div>

                <div class="stats" id="statsContainer"></div>
            </div>
        `;
    }

    setupEventListeners() {
        const startDateInput = this.shadowRoot.querySelector('#startDate');
        const endDateInput = this.shadowRoot.querySelector('#endDate');
        const loadBtn = this.shadowRoot.querySelector('#loadBtn');

        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() - 1);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);

        startDateInput.valueAsDate = startDate;
        endDateInput.valueAsDate = endDate;

        loadBtn.addEventListener('click', () => {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const city = stateManager.get('currentCity');
            const selectedMetrics = this.getSelectedMetrics();

            if (!startDate || !endDate)
                return alert('Wybierz oba zakresy dat!');
            if (new Date(startDate) >= new Date(endDate))
                return alert('Data początkowa musi być przed datą końcową!');
            if (selectedMetrics.length === 0)
                return alert('Wybierz co najmniej jedną metryką!');

            stateManager.setHistoricalData(null);

            const loading = this.shadowRoot.querySelector('.loading');
            if (loading) {
                loading.textContent = 'Ładowanie danych...';
                loading.classList.remove('hidden');
            }

            this.dispatchEvent(
                new CustomEvent('historical-requested', {
                    detail: { city, startDate, endDate },
                    bubbles: true,
                    composed: true,
                })
            );
        });

        // Zoom & Pan
        const zoomInBtn = this.shadowRoot.querySelector('#zoomInBtn');
        const zoomOutBtn = this.shadowRoot.querySelector('#zoomOutBtn');
        const rangeSlider = this.shadowRoot.querySelector('#rangeSlider');
        const canvas = this.shadowRoot.querySelector('#historicalCanvas');

        zoomInBtn?.addEventListener('click', () => {
            this.zoomLevel = Math.min(10, this.zoomLevel + 1);
            this.updateControlsVisibility();
            this.updateChartWithZoom();
        });

        zoomOutBtn?.addEventListener('click', () => {
            this.zoomLevel = Math.max(1, this.zoomLevel - 1);
            this.updateControlsVisibility();
            this.updateChartWithZoom();
        });

        rangeSlider?.addEventListener('input', (e) => {
            this.panOffset = parseInt(e.target.value);
            this.updateChartWithZoom();
        });

        // Drag to pan
        canvas?.addEventListener('mousedown', (e) => {
            if (this.zoomLevel <= 1) return;
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartOffset = this.panOffset;
            canvas.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const canvas = this.shadowRoot.querySelector('#historicalCanvas');
            const deltaX = e.clientX - this.dragStartX;
            const sensitivity = 0.5;
            const newOffset = this.dragStartOffset - deltaX * sensitivity;

            this.panOffset = Math.max(0, Math.min(100, newOffset));
            if (rangeSlider) rangeSlider.value = this.panOffset;

            this.updateChartWithZoom();
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                canvas.style.cursor = 'grab';
            }
        });
    }

    updateControlsVisibility() {
        const sliderContainer =
            this.shadowRoot.querySelector('#sliderContainer');
        const rangeSlider = this.shadowRoot.querySelector('#rangeSlider');

        if (this.zoomLevel <= 1) {
            sliderContainer.style.display = 'none';
            this.panOffset = 0;
            if (rangeSlider) rangeSlider.value = 0;
        } else {
            sliderContainer.style.display = 'flex';
        }
    }

    updateChart(historicalData) {
        if (!historicalData || !historicalData.timestamps) return;

        const selectedMetrics = this.getSelectedMetrics();
        if (selectedMetrics.length === 0)
            return alert('Zaznacz co najmniej jedną metrikę!');

        const totalDays = historicalData.timestamps.length;
        const labels = historicalData.timestamps;
        const datasets = selectedMetrics.map((metric) =>
            this.getChartDataset(historicalData, metric, totalDays)
        );

        this.zoomLevel = 1;
        this.panOffset = 0;
        this.updateControlsVisibility();

        this.renderChart(labels, datasets);
        this.updateStats(historicalData, selectedMetrics, totalDays);
    }

    updateChartWithZoom() {
        if (!this.historicalData) return;

        const totalPoints = this.historicalData.timestamps.length;
        const visiblePoints = Math.max(
            1,
            Math.floor(totalPoints / this.zoomLevel)
        );
        const startIndex = Math.floor(
            (this.panOffset / 100) * (totalPoints - visiblePoints)
        );
        const endIndex = startIndex + visiblePoints;

        const slicedData = {
            ...this.historicalData,
            timestamps: this.historicalData.timestamps.slice(
                startIndex,
                endIndex
            ),
            temperature:
                this.historicalData.temperature?.slice(startIndex, endIndex) ||
                [],
            temperatureMin:
                this.historicalData.temperatureMin?.slice(
                    startIndex,
                    endIndex
                ) || [],
            temperatureMax:
                this.historicalData.temperatureMax?.slice(
                    startIndex,
                    endIndex
                ) || [],
            precipitation:
                this.historicalData.precipitation?.slice(
                    startIndex,
                    endIndex
                ) || [],
            windSpeed:
                this.historicalData.windSpeed?.slice(startIndex, endIndex) ||
                [],
            humidity:
                this.historicalData.humidity?.slice(startIndex, endIndex) || [],
            dewPoint:
                this.historicalData.dewPoint?.slice(startIndex, endIndex) || [],
            uvIndex:
                this.historicalData.uvIndex?.slice(startIndex, endIndex) || [],
        };

        const selectedMetrics = this.getSelectedMetrics();
        if (selectedMetrics.length > 0) {
            const labels = slicedData.timestamps;
            const datasets = selectedMetrics.map((metric) =>
                this.getChartDataset(
                    slicedData,
                    metric,
                    slicedData.timestamps.length
                )
            );
            this.renderChart(labels, datasets);
            this.updateStats(this.historicalData, selectedMetrics, totalPoints);
        }
    }

    getSelectedMetrics() {
        const tempCheckbox = this.shadowRoot.querySelector('#tempCheckbox');
        const precipCheckbox = this.shadowRoot.querySelector('#precipCheckbox');
        const windCheckbox = this.shadowRoot.querySelector('#windCheckbox');

        const metrics = [];
        if (tempCheckbox?.checked) metrics.push('temperature');
        if (precipCheckbox?.checked) metrics.push('precipitation');
        if (windCheckbox?.checked) metrics.push('wind');

        return metrics;
    }

    getChartDataset(historicalData, chartType, limit) {
        const configs = {
            temperature: {
                label: 'Średnia Temperatura (°C)',
                borderColor: '#FF6B6B',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                data: historicalData.temperature || [],
            },
            precipitation: {
                label: 'Średnie Opady (mm)',
                borderColor: '#87CEEB',
                backgroundColor: 'rgba(135, 206, 235, 0.1)',
                data: historicalData.precipitation || [],
            },
            wind: {
                label: 'Średnia Prędkość Wiatru (km/h)',
                borderColor: '#95E1D3',
                backgroundColor: 'rgba(149, 225, 211, 0.1)',
                data: historicalData.windSpeed || [],
            },
        };

        const config = configs[chartType] || configs.temperature;
        const isSinglePoint = config.data.length === 1;

        return {
            label: config.label,
            data: config.data,
            borderColor: config.borderColor,
            backgroundColor: config.backgroundColor,
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: isSinglePoint ? 8 : 1,
            pointHoverRadius: isSinglePoint ? 10 : 4,
            pointBackgroundColor: config.borderColor,
        };
    }

    renderChart(labels, datasets) {
        const canvas = this.shadowRoot.querySelector('#historicalCanvas');
        const loading = this.shadowRoot.querySelector('.loading');

        if (!canvas) return;

        if (loading) loading.classList.add('hidden');

        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        if (typeof Chart !== 'undefined') {
            const step = Math.max(1, Math.floor(labels.length / 50));

            this.chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: labels.map((label, i) =>
                        i % step === 0 ? label : ''
                    ),
                    datasets: datasets,
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: { display: true, position: 'top' },
                        tooltip: { enabled: true },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grace: '5%',
                        },
                        x: {
                            ticks: { autoSkip: false },
                            offset: true,
                        },
                    },
                },
            });
        }
    }

    updateStats(historicalData, metrics, limit) {
        const statsContainer = this.shadowRoot.querySelector('#statsContainer');
        if (!metrics || metrics.length === 0) {
            statsContainer.innerHTML = '';
            return;
        }

        let statsHTML = '';
        metrics.forEach((metric) => {
            let data, label, unit, minData, maxData;

            if (metric === 'temperature') {
                data = historicalData.temperature || [];
                minData = historicalData.temperatureMin || [];
                maxData = historicalData.temperatureMax || [];
                label = 'Temperatura';
                unit = '°C';
            } else if (metric === 'precipitation') {
                data = historicalData.precipitation || [];
                label = 'Opady';
                unit = 'mm';
            } else if (metric === 'wind') {
                data = historicalData.windSpeed || [];
                label = 'Wiatr';
                unit = 'km/h';
            }

            if (data && data.length > 0) {
                let avg, max, min;
                if (metric === 'temperature' && minData.length > 0) {
                    avg = (
                        data.reduce((a, b) => a + b, 0) / data.length
                    ).toFixed(1);
                    max = Math.max(...maxData).toFixed(1);
                    min = Math.min(...minData).toFixed(1);
                } else {
                    avg = (
                        data.reduce((a, b) => a + b, 0) / data.length
                    ).toFixed(1);
                    max = Math.max(...data).toFixed(1);
                    min = Math.min(...data).toFixed(1);
                }

                statsHTML += `
                    <div class="stat-box">
                        <div class="stat-label">${label} - Śr.</div>
                        <div class="stat-value">${avg}${unit}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">${label} - Max</div>
                        <div class="stat-value">${max}${unit}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">${label} - Min</div>
                        <div class="stat-value">${min}${unit}</div>
                    </div>
                `;
            }
        });
        statsContainer.innerHTML = statsHTML;
    }
}

customElements.define('historical-chart', HistoricalChartComponent);

export { HistoricalChartComponent };
