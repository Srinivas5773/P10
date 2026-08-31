/**
 * Enterprise Project CRM - Executive Dashboard View Controller
 * Displays key performance indicator cards, interactive charts, quick action bar,
 * active projects health matrix, and real-time audit feed.
 */

import { dataStore } from '../data/dataStore.js';
import { ChartEngine } from '../components/chartEngine.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export class DashboardView {
  constructor(container) {
    this.container = container;
  }

  render() {
    const pipeline = dataStore.getPipelineMetrics();
    const projects = dataStore.getProjects();
    const tasks = dataStore.getTasks();
    const invoices = dataStore.getInvoices();
    const activities = dataStore.getActivities(8);
    const settings = dataStore.getSettings();

    // Calculate metrics
    const activeProjects = projects.filter(p => p.status !== 'completed');
    const delayedProjects = projects.filter(p => p.status === 'delayed' || p.status === 'at_risk');
    const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date());
    const totalPaidRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
    const outstandingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + (Number(i.total) || 0), 0);

    const currency = settings.currencySymbol || '$';

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Executive Command Center</h1>
          <p class="view-subtitle">Real-time pipeline analytics, project portfolio health, and financial velocity</p>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-secondary" id="dash-quick-time-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Track Time
          </button>
          <button class="btn btn-primary" id="dash-new-deal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Deal
          </button>
        </div>
      </div>

      <!-- KPI METRIC CARDS -->
      <div class="grid grid-4 kpi-grid">
        <div class="card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Active Pipeline Value</span>
            <div class="kpi-icon-badge" style="background: rgba(99, 102, 241, 0.15); color: #6366f1;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="kpi-value">${currency}${pipeline.totalPipelineValue.toLocaleString()}</div>
          <div class="kpi-footer">
            <span class="badge badge-success">+18.4% vs last month</span>
            <span class="kpi-subtext">Weighted: ${currency}${pipeline.weightedPipelineValue.toLocaleString()}</span>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Total Revenue Recognized</span>
            <div class="kpi-icon-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
          </div>
          <div class="kpi-value">${currency}${totalPaidRevenue.toLocaleString()}</div>
          <div class="kpi-footer">
            <span class="badge badge-warning">${currency}${outstandingInvoices.toLocaleString()} pending</span>
            <span class="kpi-subtext">Win Rate: ${pipeline.winRate}%</span>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Active Projects</span>
            <div class="kpi-icon-badge" style="background: rgba(6, 182, 212, 0.15); color: #06b6d4;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
          </div>
          <div class="kpi-value">${activeProjects.length}</div>
          <div class="kpi-footer">
            ${delayedProjects.length > 0 ? `<span class="badge badge-danger">${delayedProjects.length} At Risk</span>` : `<span class="badge badge-success">All On Track</span>`}
            <span class="kpi-subtext">Total: ${projects.length} portfolios</span>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Tasks & Overdue Queue</span>
            <div class="kpi-icon-badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
          </div>
          <div class="kpi-value">${tasks.filter(t => t.status !== 'completed').length}</div>
          <div class="kpi-footer">
            ${overdueTasks.length > 0 ? `<span class="badge badge-danger">${overdueTasks.length} Overdue</span>` : `<span class="badge badge-success">Zero Overdue</span>`}
            <span class="kpi-subtext">Completed: ${tasks.filter(t => t.status === 'completed').length}</span>
          </div>
        </div>
      </div>

      <!-- MAIN CHARTS SECTION -->
      <div class="grid grid-2" style="margin-top: 24px;">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Monthly Revenue & Cashflow</h3>
              <p class="card-subtitle">Actual billings vs forecasted milestone recognized value</p>
            </div>
            <div class="chart-legend-inline">
              <span class="legend-dot" style="background:#6366f1;"></span> Revenue
              <span class="legend-dot" style="background:#06b6d4; margin-left:12px;"></span> Target
            </div>
          </div>
          <div class="card-body" id="dash-revenue-chart-container"></div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Sales Pipeline Conversion Funnel</h3>
              <p class="card-subtitle">Active opportunities progression by stage</p>
            </div>
          </div>
          <div class="card-body" id="dash-funnel-chart-container"></div>
        </div>
      </div>

      <!-- BOTTOM ROW: ACTIVE PROJECTS & AUDIT ACTIVITY FEED -->
      <div class="grid grid-3" style="margin-top: 24px;">
        <!-- ACTIVE PROJECTS (2 COLUMNS) -->
        <div class="card" style="grid-column: span 2;">
          <div class="card-header">
            <div>
              <h3 class="card-title">Project Portfolio Health</h3>
              <p class="card-subtitle">High-priority engagements and delivery progress</p>
            </div>
            <button class="btn btn-sm btn-ghost" id="dash-view-all-projects-btn">View All →</button>
          </div>
          <div class="card-body no-padding">
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Budget</th>
                    <th>Progress</th>
                    <th>Health</th>
                  </tr>
                </thead>
                <tbody>
                  ${projects.slice(0, 5).map(p => {
                    const healthColor = p.health >= 90 ? '#10b981' : (p.health >= 75 ? '#f59e0b' : '#ef4444');
                    return `
                      <tr class="table-row cursor-pointer" data-project-id="${p.id}">
                        <td>
                          <div style="font-weight:600; color:var(--text-primary);">${this.escapeHtml(p.name)}</div>
                          <div style="font-size:11px; color:var(--text-muted);">${p.code}</div>
                        </td>
                        <td>${this.escapeHtml(p.accountName)}</td>
                        <td>
                          <span class="badge badge-status badge-${p.status}">${p.status.replace('_', ' ').toUpperCase()}</span>
                        </td>
                        <td>
                          <div style="font-weight:600;">${currency}${p.budget.toLocaleString()}</div>
                          <div style="font-size:11px; color:var(--text-muted);">${currency}${p.spent.toLocaleString()} spent</div>
                        </td>
                        <td style="width: 140px;">
                          <div class="progress-bar-wrapper">
                            <div class="progress-bar-fill" style="width:${p.progress}%; background:${healthColor};"></div>
                          </div>
                          <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${p.progress}% complete</div>
                        </td>
                        <td>
                          <span style="font-weight:700; color:${healthColor};">${p.health}%</span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- REAL-TIME AUDIT FEED (1 COLUMN) -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Live Activity Feed</h3>
              <p class="card-subtitle">Real-time audit log & automations</p>
            </div>
          </div>
          <div class="card-body">
            <div class="activity-timeline">
              ${activities.map(act => `
                <div class="activity-item">
                  <div class="activity-icon" style="background:${act.color || '#6366f1'};">
                    ${this.getActivityIcon(act.icon)}
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">${this.escapeHtml(act.title)}</div>
                    <div class="activity-details">${this.escapeHtml(act.details || '')}</div>
                    <div class="activity-meta">
                      <span>${this.escapeHtml(act.user)}</span> •
                      <span>${this.formatTimeAgo(act.timestamp)}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
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

    // Revenue Area Chart
    const revenueData = [
      { label: 'Mar', value: 240000, value2: 210000 },
      { label: 'Apr', value: 310000, value2: 280000 },
      { label: 'May', value: 290000, value2: 300000 },
      { label: 'Jun', value: 420000, value2: 350000 },
      { label: 'Jul', value: 390000, value2: 380000 },
      { label: 'Aug', value: 520000, value2: 450000 },
      { label: 'Sep (Est)', value: 610000, value2: 500000 }
    ];

    ChartEngine.renderAreaChart('#dash-revenue-chart-container', {
      data: revenueData,
      series: [
        { key: 'value', color: '#6366f1', label: 'Revenue' },
        { key: 'value2', color: '#06b6d4', label: 'Target' }
      ],
      height: 240,
      currency
    });

    // Funnel Chart
    const stages = settings.pipelineStages || [];
    const deals = dataStore.getDeals();
    ChartEngine.renderFunnelChart('#dash-funnel-chart-container', stages, deals);
  }

  bindEvents() {
    const quickTimeBtn = this.container.querySelector('#dash-quick-time-btn');
    if (quickTimeBtn) {
      quickTimeBtn.addEventListener('click', () => {
        window.crmApp.openTimeTrackerModal();
      });
    }

    const newDealBtn = this.container.querySelector('#dash-new-deal-btn');
    if (newDealBtn) {
      newDealBtn.addEventListener('click', () => {
        window.crmApp.openNewDealModal();
      });
    }

    const viewProjectsBtn = this.container.querySelector('#dash-view-all-projects-btn');
    if (viewProjectsBtn) {
      viewProjectsBtn.addEventListener('click', () => {
        window.crmApp.navigate('projects');
      });
    }

    // Row clicks on projects
    const projectRows = this.container.querySelectorAll('[data-project-id]');
    projectRows.forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-project-id');
        window.crmApp.openProjectDrawer(id);
      });
    });
  }

  getActivityIcon(icon) {
    const icons = {
      briefcase: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      ticket: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>`,
      clock: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      zap: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
      'check-circle': `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      'user-plus': `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
      award: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
      'dollar-sign': `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
    };
    return icons[icon] || icons.briefcase;
  }

  formatTimeAgo(isoString) {
    if (!isoString) return 'recently';
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
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
