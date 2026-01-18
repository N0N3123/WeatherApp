/**
 * Historical Chart Component
 * Wykresy dla danych historycznych (80 lat wstecz!)
 * Selectory dat, różne metryki, zoom
 * Wersja bez Chart.js - czyste canvas z tooltipami
 */

import { stateManager } from '../state/stateManager.js';

class HistoricalChartComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.historicalData = null;
        this.unsubscribe = null;
        // Zoom i pan state
        this.zoomLevel = 1;
        this.panOffset = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartOffset = 0;
        // Chart data
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
        console.log('✅ HistoricalChartComponent mounted');
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
                    background-color: #f0f0f0;
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
                    cursor: crosshair;
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

                .tooltip-value {
                    font-weight: 500;
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
                    color: #333;
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

                <div class="legend" id="legend"></div>

                <div class="chart-wrapper">
                    <div class="loading">Wybierz zakres dat i metrikę...</div>
                    <canvas id="historicalCanvas"></canvas>
                    <div class="tooltip" id="tooltip"></div>
                </div>
                <small style="text-align: center; display: block; color: #666; margin-top: 0.5rem;">💡 Tip: Przytrzymaj LPM i przeciągnij aby przesunąć wykres</small>

                <div class="stats" id="statsContainer"></div>
            </div>
        `;
    }

    setupEventListeners() {
        const startDateInput = this.shadowRoot.querySelector('#startDate');
        const endDateInput = this.shadowRoot.querySelector('#endDate');
        const loadBtn = this.shadowRoot.querySelector('#loadBtn');
        const canvas = this.shadowRoot.querySelector('#historicalCanvas');

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
                }),
            );
        });

        // Zoom & Pan
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

        // Mouse events for tooltip and drag
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

        canvas?.addEventListener('mouseleave', () => {
            this.handleMouseLeave();
        });

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
                const canvas =
                    this.shadowRoot.querySelector('#historicalCanvas');
                if (canvas) canvas.style.cursor = 'crosshair';
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
        const tooltip = this.shadowRoot.querySelector('#tooltip');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const scaleX = canvas.width / rect.width;
        const canvasX = x * scaleX;

        const chartWidth =
            canvas.width - this.padding.left - this.padding.right;
        const pointCount = this.chartData.labels.length;

        if (pointCount === 0) return;

        const pointSpacing =
            pointCount > 1 ? chartWidth / (pointCount - 1) : chartWidth;

        // Find closest point index based on X position
        let closestIndex = Math.round(
            (canvasX - this.padding.left) / pointSpacing,
        );
        closestIndex = Math.max(0, Math.min(pointCount - 1, closestIndex));

        // Check if mouse is within reasonable distance
        const pointX = this.padding.left + closestIndex * pointSpacing;
        const distanceX = Math.abs(canvasX - pointX);

        if (distanceX < pointSpacing / 2 + 20) {
            this.hoveredPoint = closestIndex;
            this.showTooltip(closestIndex, e, rect);
            this.drawChart();
        } else {
            this.hoveredPoint = null;
            tooltip.classList.remove('visible');
            this.drawChart();
        }
    }

    showTooltip(index, e, rect) {
        const tooltip = this.shadowRoot.querySelector('#tooltip');

        let html = `<div class="tooltip-date">${this.chartData.labels[index]}</div>`;

        this.chartData.datasets.forEach((dataset) => {
            const value = dataset.data[index];
            if (value !== undefined && value !== null) {
                html += `
                    <div class="tooltip-item">
                        <span class="tooltip-color" style="background: ${dataset.borderColor}"></span>
                        <span class="tooltip-value">${dataset.label}: ${value.toFixed(1)}</span>
                    </div>
                `;
            }
        });

        tooltip.innerHTML = html;

        let tooltipX = e.clientX - rect.left + 15;
        let tooltipY = e.clientY - rect.top - 10;

        if (tooltipX + 200 > rect.width) {
            tooltipX = e.clientX - rect.left - 200;
        }
        if (tooltipY < 10) {
            tooltipY = e.clientY - rect.top + 20;
        }

        tooltip.style.left = tooltipX + 'px';
        tooltip.style.top = tooltipY + 'px';
        tooltip.classList.add('visible');
    }

    handleMouseLeave() {
        const tooltip = this.shadowRoot.querySelector('#tooltip');
        tooltip.classList.remove('visible');
        this.hoveredPoint = null;
        this.drawChart();
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
        canvas.height = 400 * 2;
        ctx.scale(2, 2);

        const width = container.clientWidth;
        const height = 400;

        ctx.clearRect(0, 0, width, height);

        const chartWidth = width - this.padding.left - this.padding.right;
        const chartHeight = height - this.padding.top - this.padding.bottom;

        // Calculate global min/max across all datasets
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

        // Add padding to min/max
        const range = globalMax - globalMin;
        globalMin -= range * 0.1;
        globalMax += range * 0.1;

        if (globalMin === globalMax) {
            globalMin -= 1;
            globalMax += 1;
        }

        // Draw grid
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;

        const ySteps = 6;
        for (let i = 0; i <= ySteps; i++) {
            const y = this.padding.top + (chartHeight / ySteps) * i;
            ctx.beginPath();
            ctx.moveTo(this.padding.left, y);
            ctx.lineTo(width - this.padding.right, y);
            ctx.stroke();
        }

        // Draw Y-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';

        for (let i = 0; i <= ySteps; i++) {
            const value = globalMax - (globalMax - globalMin) * (i / ySteps);
            const y = this.padding.top + (chartHeight / ySteps) * i;
            ctx.fillText(value.toFixed(1), this.padding.left - 10, y + 4);
        }

        // Draw X-axis labels
        ctx.textAlign = 'center';
        const pointCount = this.chartData.labels.length;
        const pointSpacing =
            pointCount > 1 ? chartWidth / (pointCount - 1) : chartWidth;

        // Determine label step based on data density
        const maxLabels = Math.floor(chartWidth / 80);
        const labelStep = Math.max(1, Math.ceil(pointCount / maxLabels));

        this.chartData.labels.forEach((label, i) => {
            if (i % labelStep === 0 || i === pointCount - 1) {
                const x = this.padding.left + i * pointSpacing;
                ctx.save();
                ctx.translate(x, height - this.padding.bottom + 15);
                ctx.rotate(-Math.PI / 6);
                ctx.textAlign = 'right';
                ctx.fillText(label, 0, 0);
                ctx.restore();
            }
        });

        // Draw each dataset
        this.chartData.datasets.forEach((dataset, datasetIndex) => {
            if (!dataset.data || dataset.data.length === 0) return;

            // Draw fill
            ctx.beginPath();
            ctx.moveTo(this.padding.left, this.padding.top + chartHeight);

            dataset.data.forEach((value, i) => {
                if (value === null || value === undefined) return;

                const x = this.padding.left + i * pointSpacing;
                const normalizedValue =
                    (value - globalMin) / (globalMax - globalMin);
                const y =
                    this.padding.top +
                    chartHeight -
                    normalizedValue * chartHeight;

                if (i === 0) {
                    ctx.lineTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            const lastValidIndex = dataset.data.length - 1;
            ctx.lineTo(
                this.padding.left + lastValidIndex * pointSpacing,
                this.padding.top + chartHeight,
            );
            ctx.closePath();
            ctx.fillStyle = dataset.backgroundColor;
            ctx.fill();

            // Draw line
            ctx.beginPath();
            ctx.strokeStyle = dataset.borderColor;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            let firstPoint = true;
            dataset.data.forEach((value, i) => {
                if (value === null || value === undefined) return;

                const x = this.padding.left + i * pointSpacing;
                const normalizedValue =
                    (value - globalMin) / (globalMax - globalMin);
                const y =
                    this.padding.top +
                    chartHeight -
                    normalizedValue * chartHeight;

                if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // Draw points (only if not too many, or if hovered)
            const showAllPoints = pointCount <= 50;

            dataset.data.forEach((value, i) => {
                if (value === null || value === undefined) return;

                const isHovered = this.hoveredPoint === i;

                if (!showAllPoints && !isHovered) return;

                const x = this.padding.left + i * pointSpacing;
                const normalizedValue =
                    (value - globalMin) / (globalMax - globalMin);
                const y =
                    this.padding.top +
                    chartHeight -
                    normalizedValue * chartHeight;

                const radius = isHovered ? 6 : 3;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = isHovered ? dataset.borderColor : 'white';
                ctx.fill();
                ctx.strokeStyle = dataset.borderColor;
                ctx.lineWidth = 2;
                ctx.stroke();

                if (isHovered) {
                    ctx.beginPath();
                    ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
                    ctx.strokeStyle = dataset.borderColor + '40';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            });
        });

        // Draw hover line
        if (this.hoveredPoint !== null && this.hoveredPoint >= 0) {
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
