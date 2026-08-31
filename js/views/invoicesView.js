/**
 * Enterprise Project CRM - Invoices & Billing Operations View Controller
 * Features: Dynamic Invoice Builder, Tax/Discount Calculations,
 * Payment Status Tracking, Multi-Currency Selector, and Printable Invoice View.
 */

import { dataStore } from '../data/dataStore.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { TableGrid } from '../components/tableGrid.js';

export class InvoicesView {
  constructor(container) {
    this.container = container;
  }

  render() {
    const invoices = dataStore.getInvoices();
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
    const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (Number(i.total) || 0), 0);

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Invoicing & Financial Operations</h1>
          <p class="view-subtitle">Billing milestones, receivables tracking, and payment reconciliations</p>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-secondary" id="inv-export-csv-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button class="btn btn-primary" id="inv-create-new-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Invoice
          </button>
        </div>
      </div>

      <!-- STATS SUMMARY -->
      <div class="grid grid-3" style="margin-bottom: 24px;">
        <div class="card stat-box" style="border-left: 4px solid #10b981;">
          <div class="stat-box-label">Total Revenue Collected</div>
          <div class="stat-box-value" style="color:#10b981;">${currency}${totalPaid.toLocaleString()}</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">${invoices.filter(i => i.status === 'paid').length} Paid Invoices</div>
        </div>

        <div class="card stat-box" style="border-left: 4px solid #f59e0b;">
          <div class="stat-box-label">Pending Receivables (Net-30)</div>
          <div class="stat-box-value" style="color:#f59e0b;">${currency}${totalPending.toLocaleString()}</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">${invoices.filter(i => i.status === 'pending').length} Invoices Awaiting Payment</div>
        </div>

        <div class="card stat-box" style="border-left: 4px solid #ef4444;">
          <div class="stat-box-label">Overdue & Collections</div>
          <div class="stat-box-value" style="color:#ef4444;">${currency}${totalOverdue.toLocaleString()}</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">${invoices.filter(i => i.status === 'overdue').length} Invoices Requiring Follow-up</div>
        </div>
      </div>

      <div class="card">
        <div class="card-body no-padding" id="invoices-table-container"></div>
      </div>
    `;

    this.container.innerHTML = html;
    this.renderTable();
    this.bindHeaderEvents();
  }

  renderTable() {
    const invoices = dataStore.getInvoices();
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    new TableGrid({
      container: '#invoices-table-container',
      data: invoices,
      pageSize: 10,
      defaultSortKey: 'dueDate',
      defaultSortAsc: false,
      columns: [
        {
          key: 'invoiceNumber',
          label: 'Invoice #',
          sortable: true,
          render: (val) => `<strong style="color:var(--color-primary);">${val}</strong>`
        },
        {
          key: 'accountName',
          label: 'Client Account',
          sortable: true,
          render: (val) => `<span style="font-weight:600;">${this.escapeHtml(val)}</span>`
        },
        {
          key: 'issueDate',
          label: 'Issued Date',
          sortable: true,
          render: (val) => val || '—'
        },
        {
          key: 'dueDate',
          label: 'Due Date',
          sortable: true,
          render: (val, item) => {
            const isOverdue = item.status === 'overdue';
            return `<span style="font-weight:600; color:${isOverdue ? '#ef4444' : 'inherit'};">${val || '—'}</span>`;
          }
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          render: (val) => `<span class="badge badge-status badge-${val}">${val.toUpperCase()}</span>`
        },
        {
          key: 'total',
          label: 'Total Amount',
          sortable: true,
          render: (val) => `<strong style="font-size:13px;">${currency}${Number(val).toLocaleString()}</strong>`
        },
        {
          key: 'id',
          label: 'Actions',
          sortable: false,
          render: (val, item) => `
            <div style="display:flex; gap:8px;" onclick="event.stopPropagation()">
              <button class="btn btn-sm btn-secondary btn-print-inv" data-inv-id="${val}" title="Print / View Invoice">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                View
              </button>
              ${item.status !== 'paid' ? `
                <button class="btn btn-sm btn-success btn-mark-paid" data-inv-id="${val}">
                  Mark Paid
                </button>
              ` : ''}
            </div>
          `
        }
      ],
      onRowClick: (inv) => {
        this.openPrintableInvoiceModal(inv.id);
      }
    });

    this.bindTableActionButtons();
  }

  bindTableActionButtons() {
    const printBtns = this.container.querySelectorAll('.btn-print-inv');
    printBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-inv-id');
        this.openPrintableInvoiceModal(id);
      });
    });

    const paidBtns = this.container.querySelectorAll('.btn-mark-paid');
    paidBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-inv-id');
        dataStore.markInvoicePaid(id);
        toast.success('Payment Received', 'Invoice marked as paid and logged to ledger.');
        this.render();
      });
    });
  }

  bindHeaderEvents() {
    const createBtn = this.container.querySelector('#inv-create-new-btn');
    const exportBtn = this.container.querySelector('#inv-export-csv-btn');

    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.openCreateInvoiceModal();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const csv = dataStore.exportCollectionCSV('invoices');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'crm-invoices-export.csv';
        link.click();
        toast.info('CSV Exported', 'Downloaded invoices ledger.');
      });
    }
  }

  openCreateInvoiceModal() {
    const accounts = dataStore.getAccounts();
    const projects = dataStore.getProjects();
    const settings = dataStore.getSettings();

    const formHtml = `
      <form id="new-invoice-form">
        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Client Account</label>
            <select name="accountId" id="inv-form-account" class="input" required>
              <option value="">-- Select Client --</option>
              ${accounts.map(a => `<option value="${a.id}">${this.escapeHtml(a.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Linked Project</label>
            <select name="projectId" class="input">
              <option value="">-- General Retainer / None --</option>
              ${projects.map(p => `<option value="${p.id}">${this.escapeHtml(p.code)}: ${this.escapeHtml(p.name)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Issue Date</label>
            <input type="date" name="issueDate" class="input" required value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label class="form-label required">Due Date</label>
            <input type="date" name="dueDate" class="input" required value="${new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]}" />
          </div>
        </div>

        <!-- LINE ITEMS SECTION -->
        <div class="section-divider" style="margin:20px 0;"></div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <label class="form-label" style="margin:0; font-weight:700;">Line Items & Deliverables</label>
          <button type="button" class="btn btn-sm btn-secondary" id="inv-add-line-btn">+ Add Item</button>
        </div>

        <div id="inv-line-items-container" style="display:flex; flex-direction:column; gap:10px;">
          <div class="inv-line-row" style="display:flex; gap:8px; align-items:center;">
            <input type="text" name="item_desc[]" class="input" placeholder="Description of service / milestone" style="flex:3;" required value="Enterprise Architecture & Milestone Delivery" />
            <input type="number" name="item_qty[]" class="input item-qty" placeholder="Qty" style="width:70px;" min="1" value="1" required />
            <input type="number" name="item_rate[]" class="input item-rate" placeholder="Rate ($)" style="width:110px;" min="0" value="25000" required />
            <button type="button" class="btn btn-sm btn-ghost btn-remove-line" style="color:#ef4444;">&times;</button>
          </div>
        </div>

        <!-- TOTALS & TAX -->
        <div class="section-divider" style="margin:20px 0;"></div>
        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Tax Rate (%)</label>
            <input type="number" name="taxRate" id="inv-tax-rate" class="input" value="${settings.taxRate || 8.5}" step="0.1" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Discount ($)</label>
            <input type="number" name="discount" id="inv-discount" class="input" value="0" min="0" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Payment Terms & Notes</label>
          <textarea name="notes" class="input" rows="2">Net-30. Please remit wire payment to Chase Treasury wire account.</textarea>
        </div>
      </form>
    `;

    modal.openModal({
      title: 'Generate New Invoice',
      content: formHtml,
      width: '720px',
      confirmText: 'Generate Invoice',
      onOpen: (body) => {
        const addBtn = body.querySelector('#inv-add-line-btn');
        const container = body.querySelector('#inv-line-items-container');

        addBtn.addEventListener('click', () => {
          const row = document.createElement('div');
          row.className = 'inv-line-row animate-slide-in';
          row.style.cssText = 'display:flex; gap:8px; align-items:center;';
          row.innerHTML = `
            <input type="text" name="item_desc[]" class="input" placeholder="Service / Consulting" style="flex:3;" required />
            <input type="number" name="item_qty[]" class="input item-qty" placeholder="Qty" style="width:70px;" min="1" value="1" required />
            <input type="number" name="item_rate[]" class="input item-rate" placeholder="Rate ($)" style="width:110px;" min="0" value="150" required />
            <button type="button" class="btn btn-sm btn-ghost btn-remove-line" style="color:#ef4444;">&times;</button>
          `;
          container.appendChild(row);
          row.querySelector('.btn-remove-line').addEventListener('click', () => row.remove());
        });

        body.querySelectorAll('.btn-remove-line').forEach(btn => {
          btn.addEventListener('click', (e) => e.target.closest('.inv-line-row').remove());
        });
      },
      onConfirm: (formData, body) => {
        if (!formData) return false;
        const accountId = formData.get('accountId');
        const account = accounts.find(a => a.id === accountId);

        const descs = Array.from(body.querySelectorAll('input[name="item_desc[]"]')).map(el => el.value);
        const qtys = Array.from(body.querySelectorAll('input[name="item_qty[]"]')).map(el => Number(el.value) || 1);
        const rates = Array.from(body.querySelectorAll('input[name="item_rate[]"]')).map(el => Number(el.value) || 0);

        const items = descs.map((desc, i) => ({
          description: desc,
          quantity: qtys[i],
          unitPrice: rates[i],
          amount: qtys[i] * rates[i]
        }));

        const newInvoice = {
          accountId: accountId,
          accountName: account ? account.name : 'Client',
          projectId: formData.get('projectId'),
          issueDate: formData.get('issueDate'),
          dueDate: formData.get('dueDate'),
          status: 'pending',
          currency: settings.defaultCurrency || 'USD',
          taxRate: Number(formData.get('taxRate')) || 0,
          discount: Number(formData.get('discount')) || 0,
          items: items,
          notes: formData.get('notes')
        };

        dataStore.saveInvoice(newInvoice);
        toast.success('Invoice Generated', 'New invoice created and added to records.');
        this.render();
        return true;
      }
    });
  }

  openPrintableInvoiceModal(invoiceId) {
    const inv = dataStore.getInvoiceById(invoiceId);
    if (!inv) return;

    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    const printHtml = `
      <div class="printable-invoice-sheet" id="printable-invoice-content">
        <!-- INVOICE HEADER -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid var(--border-color); padding-bottom:20px; margin-bottom:20px;">
          <div>
            <h2 style="margin:0; font-size:22px; font-weight:800; color:var(--color-primary);">${this.escapeHtml(settings.companyName)}</h2>
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${this.escapeHtml(settings.companyAddress)}</div>
            <div style="font-size:12px; color:var(--text-muted);">${this.escapeHtml(settings.companyEmail)} • ${this.escapeHtml(settings.companyPhone)}</div>
          </div>
          <div style="text-align:right;">
            <h1 style="margin:0; font-size:26px; font-weight:900; color:var(--text-primary); letter-spacing:1px;">INVOICE</h1>
            <div style="font-size:14px; font-weight:700; color:var(--color-primary); margin-top:4px;">${inv.invoiceNumber}</div>
            <span class="badge badge-status badge-${inv.status}" style="margin-top:6px;">${inv.status.toUpperCase()}</span>
          </div>
        </div>

        <!-- CLIENT & DATES -->
        <div class="grid grid-2" style="margin-bottom:24px; gap:20px;">
          <div>
            <div style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--text-muted);">Billed To:</div>
            <h3 style="margin:4px 0 0 0; font-size:16px; color:var(--text-primary);">${this.escapeHtml(inv.accountName)}</h3>
          </div>
          <div style="text-align:right;">
            <div><span style="color:var(--text-muted); font-size:12px;">Issue Date:</span> <strong>${inv.issueDate}</strong></div>
            <div><span style="color:var(--text-muted); font-size:12px;">Payment Due:</span> <strong>${inv.dueDate}</strong></div>
          </div>
        </div>

        <!-- ITEMS TABLE -->
        <table class="table" style="width:100%; margin-bottom:20px;">
          <thead>
            <tr style="border-bottom:2px solid var(--border-color);">
              <th style="text-align:left;">Description</th>
              <th style="text-align:center; width:60px;">Qty</th>
              <th style="text-align:right; width:120px;">Unit Price</th>
              <th style="text-align:right; width:130px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(inv.items || []).map(item => `
              <tr style="border-bottom:1px solid var(--border-color);">
                <td style="font-weight:500;">${this.escapeHtml(item.description)}</td>
                <td style="text-align:center;">${item.quantity}</td>
                <td style="text-align:right;">${currency}${Number(item.unitPrice).toLocaleString()}</td>
                <td style="text-align:right; font-weight:700;">${currency}${Number(item.amount || (item.quantity * item.unitPrice)).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- TOTALS BREAKDOWN -->
        <div style="display:flex; justify-content:flex-end; margin-bottom:30px;">
          <div style="width:280px; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; font-size:13px;">
              <span style="color:var(--text-muted);">Subtotal:</span>
              <strong>${currency}${Number(inv.subtotal).toLocaleString()}</strong>
            </div>
            ${inv.taxAmount > 0 ? `
              <div style="display:flex; justify-content:space-between; font-size:13px;">
                <span style="color:var(--text-muted);">Tax (${inv.taxRate}%):</span>
                <span>${currency}${Number(inv.taxAmount).toLocaleString()}</span>
              </div>
            ` : ''}
            ${inv.discount > 0 ? `
              <div style="display:flex; justify-content:space-between; font-size:13px; color:#10b981;">
                <span>Discount:</span>
                <span>-${currency}${Number(inv.discount).toLocaleString()}</span>
              </div>
            ` : ''}
            <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:800; border-top:2px solid var(--border-color); padding-top:8px; color:var(--text-primary);">
              <span>Total Due:</span>
              <span style="color:var(--color-primary);">${currency}${Number(inv.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- NOTES -->
        <div style="padding:12px 16px; background:var(--bg-card-hover); border-radius:8px; font-size:12px; color:var(--text-secondary);">
          <strong>Payment Terms:</strong> ${this.escapeHtml(inv.notes || 'Net-30 wire transfer terms.')}
        </div>
      </div>
    `;

    modal.openModal({
      title: `Invoice ${inv.invoiceNumber}`,
      content: printHtml,
      width: '800px',
      confirmText: 'Print / Save PDF',
      confirmClass: 'btn-primary',
      cancelText: 'Close',
      onConfirm: () => {
        window.print();
        return false;
      }
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
