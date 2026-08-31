/**
 * Enterprise Project CRM - Custom Pure SVG & Canvas Chart Engine
 * Zero external libraries (100% self-contained).
 * Supports: Line/Area Charts, Bar Charts, Donut/Pie Charts, Pipeline Funnels, and Sparklines.
 */

export class ChartEngine {
  /**
   * Renders a sleek Line / Area Chart with gradient fill and tooltips
   */
  static renderAreaChart(container, options = {}) {
    const {
      data = [], // [{ label: 'Jan', value: 120000, value2?: 90000 }]
      series = [{ key: 'value', color: '#6366f1', label: 'Revenue' }],
      height = 240,
      currency = '$',
      showGrid = true
    } = options;

    if (!container) return;
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container || !data.length) {
      if (container) container.innerHTML = '<div class="chart-empty">No data available</div>';
      return;
    }

    const width = container.clientWidth || 500;
    const padding = { top: 20, right: 20, bottom: 35, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Find max value across all series
    let maxVal = 0;
    data.forEach(d => {
      series.forEach(s => {
        const v = Number(d[s.key]) || 0;
        if (v > maxVal) maxVal = v;
      });
    });
    maxVal = maxVal === 0 ? 100 : Math.ceil(maxVal * 1.15);

    const stepX = chartW / Math.max(1, data.length - 1);
    const getY = (val) => chartH - (val / maxVal) * chartH;

    // Build SVG
    let svg = `<svg viewBox="0 0 ${width} ${height}" class="crm-chart-svg" style="width:100%; height:${height}px;">`;

    // Gradients
    svg += '<defs>';
    series.forEach((s, idx) => {
      svg += `
        <linearGradient id="grad-${idx}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.color}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${s.color}" stop-opacity="0.0"/>
        </linearGradient>
      `;
    });
    svg += '</defs>';

    // Horizontal Grid Lines & Y-Axis Labels
    if (showGrid) {
      const gridSteps = 4;
      for (let i = 0; i <= gridSteps; i++) {
        const yVal = (maxVal / gridSteps) * (gridSteps - i);
        const yPos = padding.top + (chartH / gridSteps) * i;
        svg += `
          <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-width="1"/>
          <text x="${padding.left - 10}" y="${yPos + 4}" font-size="11" fill="var(--text-muted)" text-anchor="end">${currency}${this.formatNumber(yVal)}</text>
        `;
      }
    }

    // Series Paths
    series.forEach((s, sIdx) => {
      const points = data.map((d, i) => ({
        x: padding.left + i * stepX,
        y: padding.top + getY(Number(d[s.key]) || 0),
        val: Number(d[s.key]) || 0,
        label: d.label
      }));

      // Smooth Bezier Curve
      let pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
      }

      // Area path
      const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

      svg += `<path d="${areaD}" fill="url(#grad-${sIdx})" />`;
      svg += `<path d="${pathD}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linecap="round" class="chart-line-path" />`;

      // Data dots
      points.forEach((p, pIdx) => {
        svg += `
          <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${s.color}" stroke="var(--bg-card)" stroke-width="2" class="chart-dot" data-label="${p.label}" data-value="${currency}${p.val.toLocaleString()}" data-series="${s.label}"/>
        `;
      });
    });

    // X-Axis Labels
    data.forEach((d, i) => {
      const xPos = padding.left + i * stepX;
      svg += `
        <text x="${xPos}" y="${height - 10}" font-size="11" fill="var(--text-muted)" text-anchor="middle">${d.label}</text>
      `;
    });

    svg += '</svg>';
    container.innerHTML = svg;

    this.attachTooltipHandler(container);
  }

  /**
   * Renders a modern Vertical Bar Chart
   */
  static renderBarChart(container, options = {}) {
    const {
      data = [], // [{ label: 'Q1', value: 80, color: '#3b82f6' }]
      height = 240,
      currency = '',
      barColor = '#3b82f6'
    } = options;

    if (!container) return;
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container || !data.length) {
      if (container) container.innerHTML = '<div class="chart-empty">No data available</div>';
      return;
    }

    const width = container.clientWidth || 500;
    const padding = { top: 25, right: 20, bottom: 35, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.ceil((Math.max(...data.map(d => Number(d.value) || 0)) || 100) * 1.15);
    const barWidth = Math.min(42, Math.max(14, (chartW / data.length) * 0.55));
    const stepX = chartW / data.length;

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="crm-chart-svg" style="width:100%; height:${height}px;">`;

    // Grid lines
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const yVal = (maxVal / gridSteps) * (gridSteps - i);
      const yPos = padding.top + (chartH / gridSteps) * i;
      svg += `
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-width="1"/>
        <text x="${padding.left - 10}" y="${yPos + 4}" font-size="11" fill="var(--text-muted)" text-anchor="end">${currency}${this.formatNumber(yVal)}</text>
      `;
    }

    // Bars
    data.forEach((d, i) => {
      const val = Number(d.value) || 0;
      const bH = (val / maxVal) * chartH;
      const x = padding.left + i * stepX + (stepX - barWidth) / 2;
      const y = padding.top + chartH - bH;
      const color = d.color || barColor;

      svg += `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(2, bH)}" rx="5" ry="5" fill="${color}" class="chart-bar" data-label="${d.label}" data-value="${currency}${val.toLocaleString()}" />
        <text x="${x + barWidth / 2}" y="${height - 10}" font-size="11" fill="var(--text-muted)" text-anchor="middle">${d.label}</text>
      `;
    });

    svg += '</svg>';
    container.innerHTML = svg;

    this.attachTooltipHandler(container);
  }

  /**
   * Renders a Donut / Pie Chart with center metrics and legend
   */
  static renderDonutChart(container, options = {}) {
    const {
      data = [], // [{ label: 'Enterprise', value: 45, color: '#6366f1' }]
      height = 240,
      centerLabel = 'Total',
      centerValue = ''
    } = options;

    if (!container) return;
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container || !data.length) {
      if (container) container.innerHTML = '<div class="chart-empty">No data available</div>';
      return;
    }

    const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    const size = Math.min(220, height);
    const center = size / 2;
    const radius = size * 0.42;
    const innerRadius = size * 0.28;

    let cumulativeAngle = 0;
    let svgSegments = '';

    data.forEach(d => {
      const val = Number(d.value) || 0;
      if (val <= 0) return;
      const sliceAngle = (val / total) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle += sliceAngle;

      const path = this.describeDonutArc(center, center, radius, innerRadius, startAngle, endAngle);
      svgSegments += `
        <path d="${path}" fill="${d.color}" class="chart-donut-segment" data-label="${d.label}" data-value="${val} (${Math.round((val / total) * 100)}%)" />
      `;
    });

    const displayCenterVal = centerValue || total.toLocaleString();

    let html = `
      <div class="donut-chart-wrapper" style="display:flex; align-items:center; justify-content:center; gap:20px; flex-wrap:wrap;">
        <div style="position:relative; width:${size}px; height:${size}px;">
          <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
            ${svgSegments}
          </svg>
          <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center; pointer-events:none;">
            <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600;">${centerLabel}</div>
            <div style="font-size:18px; font-weight:700; color:var(--text-primary);">${displayCenterVal}</div>
          </div>
        </div>
        <div class="donut-legend" style="display:flex; flex-direction:column; gap:8px;">
          ${data.map(d => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return `
              <div class="legend-item" style="display:flex; align-items:center; gap:8px; font-size:12px;">
                <span style="width:10px; height:10px; border-radius:50%; background-color:${d.color}; display:inline-block;"></span>
                <span style="color:var(--text-secondary); min-width:110px;">${d.label}</span>
                <span style="font-weight:600; color:var(--text-primary);">${d.value}</span>
                <span style="color:var(--text-muted); font-size:11px;">(${pct}%)</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.attachTooltipHandler(container);
  }

  /**
   * Renders a Deal Pipeline Conversion Funnel
   */
  static renderFunnelChart(container, stages = [], deals = []) {
    if (!container) return;
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;

    // Filter out closed lost for funnel progression
    const validStages = stages.filter(s => s.id !== 'closed_lost');
    const counts = {};
    const amounts = {};
    validStages.forEach(s => {
      counts[s.id] = 0;
      amounts[s.id] = 0;
    });

    deals.forEach(d => {
      if (counts[d.stage] !== undefined) {
        counts[d.stage]++;
        amounts[d.stage] += Number(d.amount) || 0;
      }
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    let html = `
      <div class="funnel-container" style="display:flex; flex-direction:column; gap:12px; width:100%;">
        ${validStages.map((s, idx) => {
          const count = counts[s.id] || 0;
          const amt = amounts[s.id] || 0;
          const pct = Math.round((count / maxCount) * 100);
          const widthPct = Math.max(18, pct);

          return `
            <div class="funnel-stage-row" style="display:flex; align-items:center; gap:12px;">
              <div style="width:130px; font-size:12px; font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${s.name}
              </div>
              <div style="flex:1; background:var(--bg-card-hover); border-radius:8px; overflow:hidden; height:34px; display:flex; align-items:center; padding:2px;">
                <div style="width:${widthPct}%; height:100%; background:${s.color}; border-radius:6px; display:flex; align-items:center; justify-content:space-between; padding:0 12px; transition:width 0.5s ease;">
                  <span style="font-size:12px; font-weight:700; color:#fff;">${count} deals</span>
                  <span style="font-size:11px; font-weight:600; color:rgba(255,255,255,0.9);">$${amt.toLocaleString()}</span>
                </div>
              </div>
              <div style="width:45px; text-align:right; font-size:11px; font-weight:600; color:var(--text-muted);">
                ${s.probability}%
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Renders a lightweight SVG Sparkline for KPI cards
   */
  static renderSparkline(values = [], color = '#10b981', width = 100, height = 32) {
    if (!values || values.length < 2) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = width / (values.length - 1);

    const points = values.map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    }).join(' ');

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
        <polyline fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
      </svg>
    `;
  }

  // --- HELPER METHODS ---
  static describeDonutArc(cx, cy, r, ir, startAngle, endAngle) {
    // clamp angles
    if (endAngle - startAngle >= 359.99) endAngle = startAngle + 359.99;
    const startRad = (startAngle - 90) * Math.PI / 180.0;
    const endRad = (endAngle - 90) * Math.PI / 180.0;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const ix1 = cx + ir * Math.cos(endRad);
    const iy1 = cy + ir * Math.sin(endRad);
    const ix2 = cx + ir * Math.cos(startRad);
    const iy2 = cy + ir * Math.sin(startRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', x1, y1,
      'A', r, r, 0, largeArcFlag, 1, x2, y2,
      'L', ix1, iy1,
      'A', ir, ir, 0, largeArcFlag, 0, ix2, iy2,
      'Z'
    ].join(' ');
  }

  static formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    return Math.round(num);
  }

  static attachTooltipHandler(container) {
    let tooltip = document.getElementById('crm-chart-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'crm-chart-tooltip';
      tooltip.className = 'chart-tooltip';
      document.body.appendChild(tooltip);
    }

    const targets = container.querySelectorAll('.chart-dot, .chart-bar, .chart-donut-segment');
    targets.forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        const label = el.getAttribute('data-label') || '';
        const val = el.getAttribute('data-value') || '';
        const series = el.getAttribute('data-series') || '';

        tooltip.innerHTML = `
          <div class="tooltip-title">${label}</div>
          <div class="tooltip-value">${series ? `<strong>${series}:</strong> ` : ''}${val}</div>
        `;
        tooltip.style.opacity = '1';
      });

      el.addEventListener('mousemove', (e) => {
        tooltip.style.left = `${e.clientX + 14}px`;
        tooltip.style.top = `${e.clientY - 28}px`;
      });

      el.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
      });
    });
  }
}
