/**
 * Enterprise Project CRM - Marketing Campaigns & Lead Generation View Controller
 */

import { dataStore } from '../data/dataStore.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { TableGrid } from '../components/tableGrid.js';

export class CampaignsView {
  constructor(container) {
    this.container = container;
  }

  render() {
    const campaigns = dataStore.data.campaigns || [];
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    const totalAudience = campaigns.reduce((sum, c) => sum + (Number(c.audienceCount) || 0), 0);
    const totalPipeline = campaigns.reduce((sum, c) => sum + (Number(c.pipelineGenerated) || 0), 0);

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Marketing Campaigns & Lead Nurturing</h1>
          <p class="view-subtitle">
            <strong>${campaigns.length}</strong> Multi-Channel Campaigns • 
            Audience Reach: <strong>${totalAudience.toLocaleString()} Leads</strong> • 
            Sourced Pipeline: <strong style="color:var(--color-primary);">${currency}${totalPipeline.toLocaleString()}</strong>
          </p>
        </div>
      </div>

      <div class="card">
        <div class="card-body no-padding" id="campaigns-table-container"></div>
      </div>
    `;

    this.container.innerHTML = html;
    this.renderTable();
  }

  renderTable() {
    const campaigns = dataStore.data.campaigns || [];
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    new TableGrid({
      container: '#campaigns-table-container',
      data: campaigns,
      pageSize: 10,
      defaultSortKey: 'audienceCount',
      defaultSortAsc: false,
      columns: [
        {
          key: 'name',
          label: 'Campaign Name',
          sortable: true,
          render: (val, item) => `
            <div>
              <strong style="color:var(--text-primary); font-size:13px;">${this.escapeHtml(val)}</strong>
              <div style="font-size:11px; color:var(--text-muted);">${item.channel}</div>
            </div>
          `
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          render: (val) => `<span class="badge badge-status badge-${val === 'Active' ? 'paid' : (val === 'Scheduled' ? 'pending' : 'delayed')}">${val.toUpperCase()}</span>`
        },
        {
          key: 'audienceCount',
          label: 'Audience Reach',
          sortable: true,
          render: (val) => Number(val).toLocaleString()
        },
        {
          key: 'openRate',
          label: 'Open Rate',
          sortable: true,
          render: (val) => `<span style="font-weight:600; color:#10b981;">${val}</span>`
        },
        {
          key: 'clickRate',
          label: 'Click Rate',
          sortable: true,
          render: (val) => `<span style="font-weight:600; color:#3b82f6;">${val}</span>`
        },
        {
          key: 'pipelineGenerated',
          label: 'Pipeline Generated',
          sortable: true,
          render: (val) => `<strong>${currency}${Number(val).toLocaleString()}</strong>`
        }
      ]
    });
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
