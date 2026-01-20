import { stateManager } from '../state/stateManager.js';

class HistoricalChartComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.chart = null;
        this.historicalData = null;
        this.zoomLevel = 1;
        this.panOffset = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartOffset = 0;
        this.chartData = null;
        this.hoveredPoint = null;
        this.padding = { top: 40, right: 30, bottom: 60, left: 60 };
    }

    static get observedAttributes() {
        return ['data-chart-type'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();

        this.unsubscribe = stateManager.subscribe('historicalData', (data) => {
            if (data) {
                this.historicalData = data;
                this.updateChart(data);
            }
        });

        this.updateControlsVisibility();
    }

    disconnectedCallback() {
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
                    background: var(--hc-bg, white);
                    border-radius: 8px;
                    padding: 1rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    max-width: 100%;
                    overflow: hidden;
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

                .control-group > label {
                    font-weight: 600;
                    color: var(--hc-label, #333);
                    cursor: default;
                    font-size: 0.9rem;
                }

                input[type="date"],
                select {
                    padding: 0.5rem;
                    border: 1px solid var(--hc-border, #ddd);
                    border-radius: 4px;
                    font-size: 0.9rem;
                    background: var(--hc-input-bg, white);
                    color: var(--hc-text, #333);
                }

                .metrics-group {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .metrics-group > label {
                    font-weight: 600;
                    color: var(--hc-label, #333);
                    font-size: 0.9rem;
                    cursor: default;
                    margin-right: 0.5rem;
                }

                .metric-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    user-select: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                
                .metric-checkbox:hover {
                    background-color: var(--hc-hover, #f0f0f0);
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
                    color: var(--hc-text, #333);
                    font-size: 0.9rem;
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
                    font-size: 0.9rem;
                }

                button:hover {
                    background: #5568d3;
                }

                @media (max-width: 500px) {
                    .controls { flex-direction: column; align-items: stretch; gap: 0.8rem; }
                    .control-group { flex-direction: column; align-items: flex-start; width: 100%; }
                    .control-group label { margin-bottom: 0.2rem; }
                    .control-group input { width: 100%; }
                    .metrics-group { justify-content: flex-start; gap: 0.5rem; }
                    button#loadBtn { width: 100%; margin-top: 0.5rem; }
                }

                .zoom-controls {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    margin: 1rem 0;
                    padding: 1rem;
                    background: var(--hc-zoom-bg, #f9f9f9);
                    border-radius: 6px;
                    flex-wrap: wrap;
                }

                .zoom-controls button {
                    padding: 0.5rem 1rem;
                    font-size: 1rem;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .zoom-controls button:hover {
                    background: #5568d3;
                }

                .slider-container {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    flex: 1;
                    min-width: 200px;
                }

                .slider-container label {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: var(--hc-muted, #555);
                    white-space: nowrap;
                }

                .slider-container input[type="range"] {
                    flex: 1;
                    min-width: 100px;
                    cursor: pointer;
                }

                .chart-wrapper {
                    position: relative;
                    height: 350px;
                    margin-bottom: 1rem;
                    width: 100%;
                    overflow: hidden;
                }

                canvas {
                    display: block;
                    width: 100% !important;
                    height: 350px !important;
                    cursor: crosshair;
                }

                .loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 350px;
                    color: var(--hc-muted, #999);
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: var(--hc-bg, white);
                    border-radius: 4px;
                    z-index: 10;
                }

                .loading.hidden {
                    display: none;
                }

                .tooltip {
                    position: absolute;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 10px 14px;
                    border-radius: 6px;
                    font-size: 13px;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.15s;
                    z-index: 100;
                    white-space: nowrap;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    max-width: 250px;
                }

                .tooltip.visible {
                    opacity: 1;
                }

                .tooltip-date {
                    font-weight: 700;
                    margin-bottom: 6px;
                    padding-bottom: 6px;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }

                .tooltip-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 4px 0;
                }

                .tooltip-color {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 1rem;
                    margin-top: 1.5rem;
                    width: 100%;
                }

                .stat-box {
                    background: var(--hc-stat-bg, #f5f5f5);
                    padding: 1rem;
                    border-radius: 6px;
                    text-align: center;
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: var(--hc-muted, #666);
                    margin-bottom: 0.5rem;
                }

                .stat-value {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #667eea;
                }

                .legend {
                    display: flex;
                    gap: 1.5rem;
                    justify-content: center;
                    margin-bottom: 0.5rem;
                    flex-wrap: wrap;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: var(--hc-text, #333);
                }

                .legend-color {
                    width: 16px;
                    height: 3px;
                    border-radius: 2px;
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
                    <div class="metrics-group">
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
                    <button id="zoomInBtn" title="Powiększ">🔍 +</button>
                    <button id="zoomOutBtn" title="Pomniejsz">🔍 -</button>
                    <div class="slider-container" id="sliderContainer">
                        <label>Przesunięcie:</label>
                        <input type="range" id="rangeSlider" min="0" max="100" value="0">
                    </div>
                </div>

                <div class="legend" id="legend"></div>

                <div class="chart-wrapper">
                    <div class="loading">Wybierz zakres dat i metrikę...</div>
                    <canvas id="historicalCanvas"></canvas>
                    <div class="tooltip" id="tooltip"></div>
                </div>
                <small style="text-align: center; display: block; color: #666; margin-top: 0.5rem; font-size: 0.8rem;">
                    💡 Tip: Przytrzymaj LPM i przeciągnij aby przesunąć wykres
                </small>

                <div class="stats" id="statsContainer"></div>
            </div>
        `;
    }

    setupEventListeners() {
        const startDateInput = this.shadowRoot.querySelector('#startDate');
        const endDateInput = this.shadowRoot.querySelector('#endDate');
        const loadBtn = this.shadowRoot.querySelector('#loadBtn');
        const canvas = this.shadowRoot.querySelector('#historicalCanvas');

        const MIN_DATE = '1940-01-01';
        const today = new Date();
        const maxDateStr = today.toISOString().split('T')[0];

        startDateInput.min = MIN_DATE;
        startDateInput.max = maxDateStr;

        endDateInput.min = MIN_DATE;
        endDateInput.max = maxDateStr;

        const defaultEnd = new Date(today);
        defaultEnd.setDate(today.getDate() - 1);
        const defaultStart = new Date(defaultEnd);
        defaultStart.setDate(defaultEnd.getDate() - 7);

        startDateInput.valueAsDate = defaultStart;
        endDateInput.valueAsDate = defaultEnd;
        loadBtn.addEventListener('click', () => {
            const startVal = startDateInput.value;
            const endVal = endDateInput.value;
            const city = stateManager.get('currentCity');
            const selectedMetrics = this.getSelectedMetrics();

            if (!startVal || !endVal) {
                return alert('Wybierz oba zakresy dat!');
            }

            if (startVal < MIN_DATE) {
                return alert(
                    'Dane historyczne są dostępne dopiero od 01.01.1940 roku.',
                );
            }
            if (endVal > maxDateStr || startVal > maxDateStr) {
                return alert(
                    'Nie można pobrać prognozy w tym miejscu. Wybierz datę dzisiejszą lub z przeszłości.',
                );
            }
            if (startVal >= endVal) {
                return alert(
                    'Data początkowa musi być wcześniejsza niż data końcowa!',
                );
            }

            if (selectedMetrics.length === 0) {
                return alert(
                    'Zaznacz co najmniej jedną metrykę (np. Temperatura)!',
                );
            }

            stateManager.setHistoricalData(null);

            const loading = this.shadowRoot.querySelector('.loading');
            if (loading) {
                loading.textContent = 'Ładowanie danych historycznych...';
                loading.classList.remove('hidden');
            }

            this.dispatchEvent(
                new CustomEvent('historical-requested', {
                    detail: { city, startDate: startVal, endDate: endVal },
                    bubbles: true,
                    composed: true,
                }),
            );
        });

        const zoomInBtn = this.shadowRoot.querySelector('#zoomInBtn');
        const zoomOutBtn = this.shadowRoot.querySelector('#zoomOutBtn');
        const rangeSlider = this.shadowRoot.querySelector('#rangeSlider');

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

        canvas?.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.dragStartX;
                const sensitivity = 0.5;
                const newOffset = this.dragStartOffset - deltaX * sensitivity;
                this.panOffset = Math.max(0, Math.min(100, newOffset));
                if (rangeSlider) rangeSlider.value = this.panOffset;
                this.updateChartWithZoom();
            } else {
                this.handleMouseMove(e);
            }
        });

        canvas?.addEventListener('mouseleave', () => this.handleMouseLeave());

        canvas?.addEventListener('mousedown', (e) => {
            if (this.zoomLevel <= 1) return;
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartOffset = this.panOffset;
            canvas.style.cursor = 'grabbing';
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                const c = this.shadowRoot.querySelector('#historicalCanvas');
                if (c) c.style.cursor = 'crosshair';
            }
        });
    }

    handleMouseMove(e) {
        if (
            !this.chartData ||
            !this.chartData.datasets ||
            this.chartData.datasets.length === 0
        )
            return;

        const canvas = this.shadowRoot.querySelector('#historicalCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        const scaleX = canvas.width / rect.width;
        const canvasX = x * scaleX;

        const chartWidth =
            canvas.width - this.padding.left - this.padding.right;
        const pointCount = this.chartData.labels.length;
        if (pointCount === 0) return;

        const pointSpacing =
            pointCount > 1 ? chartWidth / (pointCount - 1) : chartWidth;
        let closestIndex = Math.round(
            (canvasX - this.padding.left) / pointSpacing,
        );
        closestIndex = Math.max(0, Math.min(pointCount - 1, closestIndex));

        const pointX = this.padding.left + closestIndex * pointSpacing;
        if (Math.abs(canvasX - pointX) < pointSpacing / 2 + 20) {
            this.hoveredPoint = closestIndex;
            this.showTooltip(closestIndex, e, rect);
            this.drawChart();
        } else {
            this.handleMouseLeave();
        }
    }

    showTooltip(index, e, rect) {
        const tooltip = this.shadowRoot.querySelector('#tooltip');
        let html = `<div class="tooltip-date">${this.chartData.labels[index]}</div>`;
        this.chartData.datasets.forEach((d) => {
            const val = d.data[index];
            if (val != null) {
                html += `
                    <div class="tooltip-item">
                        <span class="tooltip-color" style="background:${d.borderColor}"></span>
                        <span>${d.label}: ${val.toFixed(1)}</span>
                    </div>`;
            }
        });
        tooltip.innerHTML = html;

        let tx = e.clientX - rect.left + 15;
        let ty = e.clientY - rect.top - 10;
        if (tx + 180 > rect.width) tx = e.clientX - rect.left - 180;
        if (ty < 10) ty = e.clientY - rect.top + 20;

        tooltip.style.left = tx + 'px';
        tooltip.style.top = ty + 'px';
        tooltip.classList.add('visible');
    }

    handleMouseLeave() {
        const tooltip = this.shadowRoot.querySelector('#tooltip');
        tooltip.classList.remove('visible');
        this.hoveredPoint = null;
        this.drawChart();
    }

    updateControlsVisibility() {
        const container = this.shadowRoot.querySelector('#sliderContainer');
        const slider = this.shadowRoot.querySelector('#rangeSlider');
        if (this.zoomLevel <= 1) {
            container.style.display = 'none';
            this.panOffset = 0;
            if (slider) slider.value = 0;
        } else {
            container.style.display = 'flex';
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
            this.getChartDataset(historicalData, metric, totalDays),
        );

        this.zoomLevel = 1;
        this.panOffset = 0;
        this.updateControlsVisibility();

        this.chartData = { labels, datasets };
        this.renderLegend();
        this.drawChart();
        this.updateStats(historicalData, selectedMetrics, totalDays);

        const loading = this.shadowRoot.querySelector('.loading');
        if (loading) loading.classList.add('hidden');
    }

    updateChartWithZoom() {
        if (!this.historicalData) return;

        const totalPoints = this.historicalData.timestamps.length;
        const visiblePoints = Math.max(
            1,
            Math.floor(totalPoints / this.zoomLevel),
        );
        const startIndex = Math.floor(
            (this.panOffset / 100) * (totalPoints - visiblePoints),
        );
        const endIndex = startIndex + visiblePoints;

        const slicedData = {
            ...this.historicalData,
            timestamps: this.historicalData.timestamps.slice(
                startIndex,
                endIndex,
            ),
            temperature:
                this.historicalData.temperature?.slice(startIndex, endIndex) ||
                [],
            temperatureMin:
                this.historicalData.temperatureMin?.slice(
                    startIndex,
                    endIndex,
                ) || [],
            temperatureMax:
                this.historicalData.temperatureMax?.slice(
                    startIndex,
                    endIndex,
                ) || [],
            precipitation:
                this.historicalData.precipitation?.slice(
                    startIndex,
                    endIndex,
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
                    slicedData.timestamps.length,
                ),
            );
            this.chartData = { labels, datasets };
            this.drawChart();
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
                label: 'Temperatura (°C)',
                borderColor: '#FF6B6B',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                data: historicalData.temperature || [],
            },
            precipitation: {
                label: 'Opady (mm)',
                borderColor: '#87CEEB',
                backgroundColor: 'rgba(135, 206, 235, 0.1)',
                data: historicalData.precipitation || [],
            },
            wind: {
                label: 'Wiatr (km/h)',
                borderColor: '#95E1D3',
                backgroundColor: 'rgba(149, 225, 211, 0.1)',
                data: historicalData.windSpeed || [],
            },
        };

        const config = configs[chartType] || configs.temperature;

        return {
            label: config.label,
            data: config.data,
            borderColor: config.borderColor,
            backgroundColor: config.backgroundColor,
        };
    }

    renderLegend() {
        const legend = this.shadowRoot.querySelector('#legend');
        if (!this.chartData || !this.chartData.datasets) {
            legend.innerHTML = '';
            return;
        }

        legend.innerHTML = this.chartData.datasets
            .map(
                (dataset) => `
            <div class="legend-item">
                <span class="legend-color" style="background: ${dataset.borderColor}"></span>
                <span>${dataset.label}</span>
            </div>
        `,
            )
            .join('');
    }

    drawChart() {
        if (
            !this.chartData ||
            !this.chartData.datasets ||
            this.chartData.datasets.length === 0
        )
            return;

        const canvas = this.shadowRoot.querySelector('#historicalCanvas');
        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;

        canvas.width = container.clientWidth * 2;
        canvas.height = 350 * 2;
        ctx.scale(2, 2);

        const width = container.clientWidth;
        const height = 350;

        const isDark =
            document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? '#3a4a6b' : '#eee';
        const textColor = isDark ? '#aaa' : '#666';

        ctx.clearRect(0, 0, width, height);

        const chartWidth = width - this.padding.left - this.padding.right;
        const chartHeight = height - this.padding.top - this.padding.bottom;

        let globalMin = Infinity;
        let globalMax = -Infinity;

        this.chartData.datasets.forEach((dataset) => {
            const validData = dataset.data.filter(
                (v) => v !== null && v !== undefined,
            );
            if (validData.length > 0) {
                globalMin = Math.min(globalMin, ...validData);
                globalMax = Math.max(globalMax, ...validData);
            }
        });

        if (globalMin === Infinity) {
            globalMin = 0;
            globalMax = 10;
        }
        const range = globalMax - globalMin || 1;
        globalMin -= range * 0.1;
        globalMax += range * 0.1;

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'right';

        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = this.padding.top + (chartHeight / ySteps) * i;
            ctx.beginPath();
            ctx.moveTo(this.padding.left, y);
            ctx.lineTo(width - this.padding.right, y);
            ctx.stroke();

            const value = globalMax - (globalMax - globalMin) * (i / ySteps);
            ctx.fillText(value.toFixed(1), this.padding.left - 10, y + 4);
        }

        ctx.textAlign = 'center';
        const pointCount = this.chartData.labels.length;
        const pointSpacing =
            pointCount > 1 ? chartWidth / (pointCount - 1) : chartWidth;
        const maxLabels = Math.floor(chartWidth / 70);
        const labelStep = Math.max(1, Math.ceil(pointCount / maxLabels));

        this.chartData.labels.forEach((label, i) => {
            if (i % labelStep === 0) {
                const x = this.padding.left + i * pointSpacing;
                const date = new Date(label);
                const dateStr = date.toLocaleDateString(undefined, {
                    month: 'numeric',
                    day: 'numeric',
                });

                ctx.fillText(dateStr, x, height - this.padding.bottom + 20);
            }
        });
        this.chartData.datasets.forEach((dataset) => {
            if (!dataset.data || dataset.data.length === 0) return;

            ctx.beginPath();
            ctx.strokeStyle = dataset.borderColor;
            ctx.lineWidth = 2;

            let firstPoint = true;
            dataset.data.forEach((value, i) => {
                if (value === null || value === undefined) return;

                const x = this.padding.left + i * pointSpacing;
                const normalized =
                    (value - globalMin) / (globalMax - globalMin);
                const y =
                    this.padding.top + chartHeight - normalized * chartHeight;

                if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            const showAll = pointCount <= 30;
            dataset.data.forEach((value, i) => {
                if (value == null) return;
                if (!showAll && this.hoveredPoint !== i) return;

                const x = this.padding.left + i * pointSpacing;
                const normalized =
                    (value - globalMin) / (globalMax - globalMin);
                const y =
                    this.padding.top + chartHeight - normalized * chartHeight;
                const isHovered = this.hoveredPoint === i;
                const radius = isHovered ? 6 : 3;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = isHovered ? dataset.borderColor : 'white';
                ctx.fill();
                ctx.strokeStyle = dataset.borderColor;
                ctx.stroke();
            });
        });
        if (this.hoveredPoint !== null) {
            const x = this.padding.left + this.hoveredPoint * pointSpacing;
            ctx.beginPath();
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.moveTo(x, this.padding.top);
            ctx.lineTo(x, this.padding.top + chartHeight);
            ctx.stroke();
            ctx.setLineDash([]);
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
