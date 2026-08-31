/**
 * Enterprise Project CRM - Reports & BI Analytics Studio View Controller
 * Features: Dynamic Data Filtering, Multi-Dimensional Revenue Charts,
 * Deal Velocity Analysis, Project Gross Margins, and Executive Exports.
 */

import { dataStore } from '../data/dataStore.js';
import { ChartEngine } from '../components/chartEngine.js';
import { toast } from '../components/toast.js';

export class ReportsView {
  constructor(container) {
    this.container = container;
  }

  render() {
    const deals = dataStore.getDeals();
    const projects = dataStore.getProjects();
    const invoices = dataStore.getInvoices();
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    const wonDeals = deals.filter(d => d.stage === 'closed_won');
    const totalWonRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const avgDealSize = wonDeals.length > 0 ? Math.round(totalWonRevenue / wonDeals.length) : 0;
    const totalProjectBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const totalProjectSpent = projects.reduce((sum, p) => sum + (Number(p.spent) || 0), 0);
    const estimatedGrossMargin = totalProjectBudget > 0 ? Math.round(((totalProjectBudget - totalProjectSpent) / totalProjectBudget) * 100) : 0;

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">BI Analytics & Executive Reports Studio</h1>
          <p class="view-subtitle">Strategic sales velocity, revenue forecasting, and portfolio margin health</p>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-secondary" id="reports-print-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print BI Dossier
          </button>
          <button class="btn btn-primary" id="reports-export-csv-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Complete Dataset
          </button>
        </div>
      </div>

      <!-- EXECUTIVE SUMMARY METRICS -->
      <div class="grid grid-4 kpi-grid">
        <div class="card stat-box">
          <div class="stat-box-label">Avg Won Deal Size</div>
          <div class="stat-box-value" style="color:var(--color-primary);">${currency}${avgDealSize.toLocaleString()}</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">${wonDeals.length} Closed Won deals</div>
        </div>

        <div class="card stat-box">
          <div class="stat-box-label">Estimated Gross Margin</div>
          <div class="stat-box-value" style="color:var(--color-success);">${estimatedGrossMargin}%</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Budget: ${currency}${totalProjectBudget.toLocaleString()}</div>
        </div>

        <div class="card stat-box">
          <div class="stat-box-label">Sales Cycle Velocity</div>
          <div class="stat-box-value">42 Days</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Lead to Contract Signing</div>
        </div>

        <div class="card stat-box">
          <div class="stat-box-label">SLA Compliance Rate</div>
          <div class="stat-box-value" style="color:var(--color-success);">98.4%</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Support tickets on target</div>
        </div>
      </div>

      <!-- ANALYTICS CHARTS SECTION -->
      <div class="grid grid-2" style="margin-top:24px;">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Quarterly Revenue Recognized</h3>
              <p class="card-subtitle">Historical billings & delivery milestones</p>
            </div>
          </div>
          <div class="card-body" id="report-quarterly-bar-chart"></div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Client Account Distribution</h3>
              <p class="card-subtitle">Revenue mix by client enterprise tier</p>
            </div>
          </div>
          <div class="card-body" id="report-tier-donut-chart"></div>
        </div>
      </div>

      <!-- FINANCIAL HEALTH BREAKDOWN TABLE -->
      <div class="card" style="margin-top:24px;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Portfolio Financial Breakdown & Margins</h3>
            <p class="card-subtitle">Detailed budget allocation vs actual incurred spend per engagement</p>
          </div>
        </div>
        <div class="card-body no-padding">
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Project Code</th>
                  <th>Engagement Title</th>
                  <th>Client Account</th>
                  <th>Total Budget</th>
                  <th>Actual Incurred</th>
                  <th>Gross Margin ($)</th>
                  <th>Margin %</th>
                </tr>
              </thead>
              <tbody>
                ${projects.map(p => {
                  const marginAmt = p.budget - p.spent;
                  const marginPct = p.budget > 0 ? Math.round((marginAmt / p.budget) * 100) : 0;
                  const marginColor = marginPct >= 40 ? '#10b981' : (marginPct >= 20 ? '#f59e0b' : '#ef4444');

                  return `
                    <tr>
                      <td><span class="project-code-tag">${p.code}</span></td>
                      <td style="font-weight:600;">${this.escapeHtml(p.name)}</td>
                      <td>${this.escapeHtml(p.accountName)}</td>
                      <td>${currency}${p.budget.toLocaleString()}</td>
                      <td>${currency}${p.spent.toLocaleString()}</td>
                      <td style="font-weight:700; color:${marginColor};">${currency}${marginAmt.toLocaleString()}</td>
                      <td><span class="badge" style="background:rgba(16,185,129,0.15); color:${marginColor}; font-weight:700;">${marginPct}%</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.renderCharts();
    this.bindEvents();
  }

  renderCharts() {
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    // Quarterly Bar Chart
    const quarterlyData = [
      { label: 'Q1 2025', value: 480000, color: '#6366f1' },
      { label: 'Q2 2025', value: 650000, color: '#3b82f6' },
      { label: 'Q3 2025 (Curr)', value: 890000, color: '#10b981' },
      { label: 'Q4 2025 (Proj)', value: 1150000, color: '#06b6d4' }
    ];

    ChartEngine.renderBarChart('#report-quarterly-bar-chart', {
      data: quarterlyData,
      height: 240,
      currency
    });

    // Account Tier Donut Chart
    const accounts = dataStore.getAccounts();
    const tierCounts = {};
    accounts.forEach(a => {
      tierCounts[a.tier] = (tierCounts[a.tier] || 0) + 1;
    });

    const tierData = [
      { label: 'Enterprise', value: tierCounts['Enterprise'] || 0, color: '#6366f1' },
      { label: 'Mid-Market', value: tierCounts['Mid-Market'] || 0, color: '#3b82f6' },
      { label: 'Growth', value: tierCounts['Growth'] || 0, color: '#10b981' },
      { label: 'Startup', value: tierCounts['Startup'] || 0, color: '#f59e0b' }
    ];

    ChartEngine.renderDonutChart('#report-tier-donut-chart', {
      data: tierData,
      height: 240,
      centerLabel: 'Accounts',
      centerValue: accounts.length.toString()
    });
  }

  bindEvents() {
    const printBtn = this.container.querySelector('#reports-print-btn');
    const exportBtn = this.container.querySelector('#reports-export-csv-btn');

    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const json = dataStore.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `crm-full-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        toast.success('Backup Exported', 'Downloaded complete CRM JSON database backup.');
      });
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
