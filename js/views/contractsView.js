/**
 * Enterprise Project CRM - Contracts & Legal Document Management View Controller
 * Features: Executed / Pending SOWs, MSAs, DPAs, E-Signature Status, and Contract Value Aggregations.
 */

import { dataStore } from '../data/dataStore.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { TableGrid } from '../components/tableGrid.js';

export class ContractsView {
  constructor(container) {
    this.container = container;
  }

  render() {
    const contracts = dataStore.data.contracts || [];
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    const totalValue = contracts.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
    const executedCount = contracts.filter(c => c.status === 'Executed').length;

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Contract & Legal Repository</h1>
          <p class="view-subtitle">
            <strong>${contracts.length}</strong> Total Agreements • 
            Active Portfolio Value: <strong>${currency}${totalValue.toLocaleString()}</strong> • 
            Executed & Signed: <strong style="color:var(--color-success);">${executedCount}</strong>
          </p>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-primary" id="ctr-new-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Draft Agreement
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-body no-padding" id="contracts-table-container"></div>
      </div>
    `;

    this.container.innerHTML = html;
    this.renderTable();
    this.bindHeaderEvents();
  }

  renderTable() {
    const contracts = dataStore.data.contracts || [];
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    new TableGrid({
      container: '#contracts-table-container',
      data: contracts,
      pageSize: 10,
      defaultSortKey: 'value',
      defaultSortAsc: false,
      columns: [
        {
          key: 'title',
          label: 'Agreement Title',
          sortable: true,
          render: (val, item) => `
            <div>
              <strong style="color:var(--text-primary); font-size:13px;">${this.escapeHtml(val)}</strong>
              <div style="font-size:11px; color:var(--text-muted);">${item.contractNumber} • Type: ${item.type}</div>
            </div>
          `
        },
        {
          key: 'accountName',
          label: 'Client Account',
          sortable: true,
          render: (val) => `<span style="font-weight:600;">${this.escapeHtml(val)}</span>`
        },
        {
          key: 'status',
          label: 'Signature Status',
          sortable: true,
          render: (val) => `<span class="badge badge-status badge-${val === 'Executed' ? 'paid' : (val === 'Pending Signature' ? 'pending' : 'delayed')}">${val.toUpperCase()}</span>`
        },
        {
          key: 'value',
          label: 'Contract Value',
          sortable: true,
          render: (val) => `<strong>${currency}${Number(val).toLocaleString()}</strong>`
        },
        {
          key: 'endDate',
          label: 'Term Expiration',
          sortable: true,
          render: (val) => val || 'Perpetual'
        }
      ],
      onRowClick: (ctr) => {
        this.openContractModal(ctr);
      }
    });
  }

  bindHeaderEvents() {
    const newBtn = this.container.querySelector('#ctr-new-btn');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        toast.info('Draft Contract', 'Opened contract drafting template.');
      });
    }
  }

  openContractModal(ctr) {
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    const content = `
      <div class="form-group-row">
        <div class="form-group">
          <label class="form-label">Contract Number</label>
          <div class="readonly-pill">${ctr.contractNumber}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <div class="readonly-pill">${ctr.status}</div>
        </div>
      </div>

      <div class="form-group-row">
        <div class="form-group">
          <label class="form-label">Client Account</label>
          <div class="readonly-pill">${this.escapeHtml(ctr.accountName)}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Contract Value</label>
          <div class="readonly-pill">${currency}${Number(ctr.value).toLocaleString()}</div>
        </div>
      </div>

      <div class="form-group-row">
        <div class="form-group">
          <label class="form-label">Start Date</label>
          <div class="readonly-pill">${ctr.startDate}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Expiration Date</label>
          <div class="readonly-pill">${ctr.endDate}</div>
        </div>
      </div>
    `;

    modal.openModal({
      title: ctr.title,
      content,
      confirmText: 'Done',
      cancelText: 'Close',
      onConfirm: () => true
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
