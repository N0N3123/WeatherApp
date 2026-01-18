import { stateManager } from '../state/stateManager.js';
import { weatherService } from '../api/weatherService.js';

class ChartComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.chartData = null;
        this.hoveredPoint = null;
        this.padding = { top: 30, right: 20, bottom: 50, left: 50 };
    }

    static get observedAttributes() {
        return ['data-chart-type'];
    }

    async connectedCallback() {
        this.render();
        this.setupEventListeners();

        stateManager.subscribe('currentCity', async (city) => {
            await this.fetchLast7Days(city);
        });

        const currentCity = stateManager.get('currentCity');
        if (currentCity) {
            await this.fetchLast7Days(currentCity);
        }
    }

    async fetchLast7Days(city) {
        try {
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 7);

            const formatDate = (date) => date.toISOString().split('T')[0];

            const data = await weatherService.getHistoricalData(
                city,
                formatDate(start),
                formatDate(end),
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
                    cursor: crosshair;
                }
                .tooltip {
                    position: absolute;
                    background: rgba(0, 0, 0, 0.85);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.15s;
                    z-index: 100;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }
                .tooltip.visible {
                    opacity: 1;
                }
                .tooltip-label {
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: #FF6B6B;
                }
                .tooltip-value {
                    font-size: 14px;
                }
            </style>
            <div class="chart-container">
                <canvas id="chartCanvas"></canvas>
                <div class="tooltip" id="tooltip">
                    <div class="tooltip-label"></div>
                    <div class="tooltip-value"></div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const canvas = this.shadowRoot.querySelector('#chartCanvas');

        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    }

    handleMouseMove(e) {
        if (!this.chartData) return;

        const canvas = this.shadowRoot.querySelector('#chartCanvas');
        const tooltip = this.shadowRoot.querySelector('#tooltip');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = x * scaleX;
        const canvasY = y * scaleY;

        const chartWidth =
            canvas.width - this.padding.left - this.padding.right;
        const chartHeight =
            canvas.height - this.padding.top - this.padding.bottom;
        const pointSpacing = chartWidth / (this.chartData.labels.length - 1);

        let closestIndex = -1;
        let minDistance = Infinity;

        this.chartData.labels.forEach((_, i) => {
            const pointX = this.padding.left + i * pointSpacing;
            const normalizedValue =
                (this.chartData.values[i] - this.chartData.minValue) /
                (this.chartData.maxValue - this.chartData.minValue);
            const pointY =
                this.padding.top + chartHeight - normalizedValue * chartHeight;

            const distance = Math.sqrt(
                Math.pow(canvasX - pointX, 2) + Math.pow(canvasY - pointY, 2),
            );
            if (distance < minDistance && distance < 30) {
                minDistance = distance;
                closestIndex = i;
            }
        });

        if (closestIndex !== -1) {
            this.hoveredPoint = closestIndex;

            const tooltipLabel = tooltip.querySelector('.tooltip-label');
            const tooltipValue = tooltip.querySelector('.tooltip-value');

            tooltipLabel.textContent = this.chartData.labels[closestIndex];
            tooltipValue.textContent = `Temperatura: ${this.chartData.values[closestIndex].toFixed(1)}°C`;

            let tooltipX = e.clientX - rect.left + 15;
            let tooltipY = e.clientY - rect.top - 10;

            if (tooltipX + 150 > rect.width) {
                tooltipX = e.clientX - rect.left - 150;
            }

            tooltip.style.left = tooltipX + 'px';
            tooltip.style.top = tooltipY + 'px';
            tooltip.classList.add('visible');

            this.drawChart();
        } else {
            this.hoveredPoint = null;
            tooltip.classList.remove('visible');
            this.drawChart();
        }
    }

    handleMouseLeave() {
        const tooltip = this.shadowRoot.querySelector('#tooltip');
        tooltip.classList.remove('visible');
        this.hoveredPoint = null;
        this.drawChart();
    }

    updateChart(historicalData) {
        if (!historicalData || !historicalData.timestamps) return;

        const canvas = this.shadowRoot.querySelector('#chartCanvas');

        const labels = historicalData.timestamps.map((t) => {
            return new Date(t).toLocaleDateString('pl-PL', {
                weekday: 'short',
                day: 'numeric',
            });
        });

        const dataValues = historicalData.temperature;
        const minValue = Math.min(...dataValues) - 2;
        const maxValue = Math.max(...dataValues) + 2;

        this.chartData = {
            labels,
            values: dataValues,
            minValue,
            maxValue,
            color: '#FF6B6B',
        };

        this.drawChart();
    }

    drawChart() {
        if (!this.chartData) return;

        const canvas = this.shadowRoot.querySelector('#chartCanvas');
        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;

        canvas.width = container.clientWidth * 2;
        canvas.height = 280 * 2;
        ctx.scale(2, 2);

        const width = container.clientWidth;
        const height = 280;

        ctx.clearRect(0, 0, width, height);

        const chartWidth = width - this.padding.left - this.padding.right;
        const chartHeight = height - this.padding.top - this.padding.bottom;

        // Rysuj siatkę
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;

        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = this.padding.top + (chartHeight / ySteps) * i;
            ctx.beginPath();
            ctx.moveTo(this.padding.left, y);
            ctx.lineTo(width - this.padding.right, y);
            ctx.stroke();
        }

        // Etykiety osi Y
        ctx.fillStyle = '#666';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';

        for (let i = 0; i <= ySteps; i++) {
            const value =
                this.chartData.maxValue -
                (this.chartData.maxValue - this.chartData.minValue) *
                    (i / ySteps);
            const y = this.padding.top + (chartHeight / ySteps) * i;
            ctx.fillText(value.toFixed(1) + '°', this.padding.left - 8, y + 4);
        }

        // Etykiety osi X
        ctx.textAlign = 'center';
        const pointSpacing = chartWidth / (this.chartData.labels.length - 1);

        this.chartData.labels.forEach((label, i) => {
            const x = this.padding.left + i * pointSpacing;
            ctx.fillText(label, x, height - this.padding.bottom + 20);
        });

        // Rysuj wypełnienie pod linią
        ctx.beginPath();
        ctx.moveTo(this.padding.left, this.padding.top + chartHeight);

        this.chartData.values.forEach((value, i) => {
            const x = this.padding.left + i * pointSpacing;
            const normalizedValue =
                (value - this.chartData.minValue) /
                (this.chartData.maxValue - this.chartData.minValue);
            const y =
                this.padding.top + chartHeight - normalizedValue * chartHeight;

            if (i === 0) {
                ctx.lineTo(x, y);
            } else {
                const prevX = this.padding.left + (i - 1) * pointSpacing;
                const prevValue = this.chartData.values[i - 1];
                const prevNormalized =
                    (prevValue - this.chartData.minValue) /
                    (this.chartData.maxValue - this.chartData.minValue);
                const prevY =
                    this.padding.top +
                    chartHeight -
                    prevNormalized * chartHeight;

                const cpX = (prevX + x) / 2;
                ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
            }
        });

        ctx.lineTo(
            this.padding.left +
                (this.chartData.values.length - 1) * pointSpacing,
            this.padding.top + chartHeight,
        );
        ctx.closePath();

        const gradient = ctx.createLinearGradient(
            0,
            this.padding.top,
            0,
            this.padding.top + chartHeight,
        );
        gradient.addColorStop(0, this.chartData.color + '40');
        gradient.addColorStop(1, this.chartData.color + '05');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Rysuj linię
        ctx.beginPath();
        ctx.strokeStyle = this.chartData.color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        this.chartData.values.forEach((value, i) => {
            const x = this.padding.left + i * pointSpacing;
            const normalizedValue =
                (value - this.chartData.minValue) /
                (this.chartData.maxValue - this.chartData.minValue);
            const y =
                this.padding.top + chartHeight - normalizedValue * chartHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                const prevX = this.padding.left + (i - 1) * pointSpacing;
                const prevValue = this.chartData.values[i - 1];
                const prevNormalized =
                    (prevValue - this.chartData.minValue) /
                    (this.chartData.maxValue - this.chartData.minValue);
                const prevY =
                    this.padding.top +
                    chartHeight -
                    prevNormalized * chartHeight;

                const cpX = (prevX + x) / 2;
                ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
            }
        });
        ctx.stroke();

        // Rysuj punkty
        this.chartData.values.forEach((value, i) => {
            const x = this.padding.left + i * pointSpacing;
            const normalizedValue =
                (value - this.chartData.minValue) /
                (this.chartData.maxValue - this.chartData.minValue);
            const y =
                this.padding.top + chartHeight - normalizedValue * chartHeight;

            const isHovered = this.hoveredPoint === i;
            const radius = isHovered ? 7 : 4;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = isHovered ? this.chartData.color : 'white';
            ctx.fill();
            ctx.strokeStyle = this.chartData.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            if (isHovered) {
                ctx.beginPath();
                ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
                ctx.strokeStyle = this.chartData.color + '40';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        });
    }
}

customElements.define('weather-chart', ChartComponent);
export { ChartComponent };
