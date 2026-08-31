/**
 * Enterprise Project CRM - Clients & Contacts 360° Directory View Controller
 * Features: Accounts Directory, Contacts Address Book, Tier Filters,
 * Health Scoring, and 360° Comprehensive Client Drawer.
 */

import { dataStore } from '../data/dataStore.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { TableGrid } from '../components/tableGrid.js';

export class ClientsView {
  constructor(container) {
    this.container = container;
    this.tabMode = 'accounts'; // 'accounts' or 'contacts'
  }

  render() {
    const accounts = dataStore.getAccounts();
    const contacts = dataStore.getContacts();

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Client & Contact Directory (CRM 360°)</h1>
          <p class="view-subtitle">
            <strong>${accounts.length}</strong> Accounts • 
            <strong>${contacts.length}</strong> Key Contacts • 
            Enterprise Accounts: <strong>${accounts.filter(a => a.tier === 'Enterprise').length}</strong>
          </p>
        </div>
        <div class="view-header-actions">
          <div class="view-mode-toggle">
            <button class="btn btn-sm ${this.tabMode === 'accounts' ? 'btn-primary' : 'btn-secondary'}" id="clients-tab-accounts">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              Companies (${accounts.length})
            </button>
            <button class="btn btn-sm ${this.tabMode === 'contacts' ? 'btn-primary' : 'btn-secondary'}" id="clients-tab-contacts">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Contacts (${contacts.length})
            </button>
          </div>
          <button class="btn btn-primary" id="clients-new-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ${this.tabMode === 'accounts' ? 'New Account' : 'New Contact'}
          </button>
        </div>
      </div>

      <div id="clients-view-content" class="animate-fade-in"></div>
    `;

    this.container.innerHTML = html;
    this.renderContent();
    this.bindHeaderEvents();
  }

  renderContent() {
    const contentEl = this.container.querySelector('#clients-view-content');
    if (!contentEl) return;

    if (this.tabMode === 'accounts') {
      this.renderAccounts(contentEl);
    } else {
      this.renderContacts(contentEl);
    }
  }

  renderAccounts(container) {
    const accounts = dataStore.getAccounts();

    let html = `
      <div class="grid grid-3" style="gap: 20px;">
        ${accounts.map(acc => {
          const summary = dataStore.getAccount360(acc.id);
          const healthColor = acc.healthScore >= 90 ? '#10b981' : (acc.healthScore >= 75 ? '#f59e0b' : '#ef4444');

          return `
            <div class="card account-card cursor-pointer animate-scale-up" data-account-id="${acc.id}">
              <div class="account-card-header">
                <div class="account-logo-avatar" style="background:${acc.logoBg || '#6366f1'};">
                  ${acc.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span class="badge badge-tier">${acc.tier}</span>
                </div>
              </div>

              <h3 class="account-card-title">${this.escapeHtml(acc.name)}</h3>
              <p class="account-card-industry">${this.escapeHtml(acc.industry)}</p>

              <div class="account-stats-row">
                <div>
                  <div class="meta-label">Health Score</div>
                  <div style="font-weight:700; color:${healthColor}; font-size:15px;">${acc.healthScore}%</div>
                </div>
                <div>
                  <div class="meta-label">Est. Revenue</div>
                  <div style="font-weight:700; color:var(--text-primary); font-size:14px;">${acc.annualRevenue}</div>
                </div>
                <div>
                  <div class="meta-label">Deals Pipeline</div>
                  <div style="font-weight:700; color:var(--color-primary); font-size:14px;">$${summary.stats.totalDealValue.toLocaleString()}</div>
                </div>
              </div>

              <div class="account-tags-wrap">
                ${(acc.tags || []).map(t => `<span class="tag-pill">${this.escapeHtml(t)}</span>`).join('')}
              </div>

              <div class="account-card-footer">
                <div style="font-size:11px; color:var(--text-muted);">
                  ${summary.projects.length} Projects • ${summary.contacts.length} Contacts
                </div>
                <button class="btn btn-sm btn-ghost view-360-btn" data-account-id="${acc.id}">360° View →</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
    this.bindAccountClicks();
  }

  renderContacts(container) {
    const contacts = dataStore.getContacts();

    container.innerHTML = '<div id="contacts-table-container"></div>';

    new TableGrid({
      container: '#contacts-table-container',
      data: contacts,
      pageSize: 10,
      defaultSortKey: 'name',
      defaultSortAsc: true,
      columns: [
        {
          key: 'name',
          label: 'Contact Name',
          sortable: true,
          render: (val, item) => `
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="avatar-pill" style="width:32px; height:32px; font-size:12px;">${item.initials || 'CT'}</span>
              <div>
                <strong style="color:var(--text-primary); font-size:13px;">${this.escapeHtml(val)}</strong>
                ${item.isPrimary ? `<span class="badge badge-success" style="font-size:9px; margin-left:4px;">PRIMARY</span>` : ''}
                <div style="font-size:11px; color:var(--text-muted);">${this.escapeHtml(item.title || '')}</div>
              </div>
            </div>
          `
        },
        {
          key: 'accountName',
          label: 'Company',
          sortable: true,
          render: (val) => `<span style="font-weight:600;">${this.escapeHtml(val)}</span>`
        },
        {
          key: 'email',
          label: 'Email',
          sortable: true,
          render: (val) => `<a href="mailto:${val}" class="link-styled" onclick="event.stopPropagation()">${this.escapeHtml(val)}</a>`
        },
        {
          key: 'phone',
          label: 'Phone',
          sortable: true,
          render: (val) => `<span style="font-family:monospace; font-size:12px;">${val || '—'}</span>`
        },
        {
          key: 'department',
          label: 'Department',
          sortable: true,
          render: (val) => val || 'General'
        },
        {
          key: 'lastContacted',
          label: 'Last Contact',
          sortable: true,
          render: (val) => val || 'Recently'
        }
      ],
      onRowClick: (cnt) => {
        this.openContactModal(cnt);
      }
    });
  }

  bindAccountClicks() {
    const cards = this.container.querySelectorAll('[data-account-id]');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-account-id');
        this.openAccount360Drawer(id);
      });
    });
  }

  bindHeaderEvents() {
    const tabAccounts = this.container.querySelector('#clients-tab-accounts');
    const tabContacts = this.container.querySelector('#clients-tab-contacts');
    const newBtn = this.container.querySelector('#clients-new-btn');

    if (tabAccounts) {
      tabAccounts.addEventListener('click', () => {
        this.tabMode = 'accounts';
        this.render();
      });
    }

    if (tabContacts) {
      tabContacts.addEventListener('click', () => {
        this.tabMode = 'contacts';
        this.render();
      });
    }

    if (newBtn) {
      newBtn.addEventListener('click', () => {
        if (this.tabMode === 'accounts') {
          this.openNewAccountModal();
        } else {
          this.openNewContactModal();
        }
      });
    }
  }

  openAccount360Drawer(accountId) {
    const summary = dataStore.getAccount360(accountId);
    if (!summary) return;

    const { account, contacts, deals, projects, invoices, tickets, stats } = summary;
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    const drawerContent = `
      <div class="client-360-container">
        <!-- 360 OVERVIEW STRIP -->
        <div class="grid grid-4" style="margin-bottom: 20px; gap:10px;">
          <div class="card stat-box" style="padding:12px;">
            <div class="stat-box-label">Pipeline Value</div>
            <div class="stat-box-value">${currency}${stats.totalDealValue.toLocaleString()}</div>
          </div>
          <div class="card stat-box" style="padding:12px;">
            <div class="stat-box-label">Total Invoiced</div>
            <div class="stat-box-value">${currency}${stats.totalInvoiced.toLocaleString()}</div>
          </div>
          <div class="card stat-box" style="padding:12px;">
            <div class="stat-box-label">Paid Revenue</div>
            <div class="stat-box-value" style="color:var(--color-success);">${currency}${stats.totalPaid.toLocaleString()}</div>
          </div>
          <div class="card stat-box" style="padding:12px;">
            <div class="stat-box-label">Health Score</div>
            <div class="stat-box-value" style="color:${account.healthScore >= 85 ? '#10b981' : '#f59e0b'};">${account.healthScore}%</div>
          </div>
        </div>

        <!-- ACCOUNT INFO -->
        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Industry & Tier</label>
            <div class="readonly-pill">${this.escapeHtml(account.industry)} • ${account.tier}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Website & Phone</label>
            <div class="readonly-pill">${account.phone || '—'}</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Account Notes</label>
          <div class="deal-notes-box">${this.escapeHtml(account.notes || 'No notes added.')}</div>
        </div>

        <!-- ASSOCIATED CONTACTS -->
        <div class="section-divider" style="margin:20px 0;"></div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <h4 style="font-size:14px; font-weight:700;">Contacts (${contacts.length})</h4>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${contacts.map(c => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--bg-card-hover); border-radius:8px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="avatar-pill">${c.initials}</span>
                <div>
                  <div style="font-weight:600; font-size:13px;">${this.escapeHtml(c.name)} ${c.isPrimary ? '<span class="badge badge-success" style="font-size:8px;">PRIMARY</span>' : ''}</div>
                  <div style="font-size:11px; color:var(--text-muted);">${c.title} • ${c.email}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- ACTIVE PROJECTS & DEALS -->
        <div class="section-divider" style="margin:20px 0;"></div>
        <h4 style="font-size:14px; font-weight:700; margin-bottom:10px;">Active Deals & Projects</h4>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${deals.map(d => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px;">
              <div>
                <div style="font-weight:600; font-size:13px;">${this.escapeHtml(d.title)}</div>
                <div style="font-size:11px; color:var(--text-muted);">Stage: ${d.stage} • Close: ${d.expectedCloseDate}</div>
              </div>
              <strong style="color:var(--color-primary);">${currency}${d.amount.toLocaleString()}</strong>
            </div>
          `).join('')}
        </div>

        <!-- INVOICES & PAYMENTS -->
        <div class="section-divider" style="margin:20px 0;"></div>
        <h4 style="font-size:14px; font-weight:700; margin-bottom:10px;">Invoices & Billing History</h4>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${invoices.map(inv => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px;">
              <div>
                <div style="font-weight:600; font-size:13px;">${inv.invoiceNumber}</div>
                <div style="font-size:11px; color:var(--text-muted);">Due: ${inv.dueDate}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:700;">${currency}${inv.total.toLocaleString()}</div>
                <span class="badge badge-status badge-${inv.status}">${inv.status.toUpperCase()}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- DRAWER FOOTER ACTIONS -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:30px; padding-top:16px; border-top:1px solid var(--border-color);">
          <button class="btn btn-danger btn-sm" id="drawer-delete-acc-btn">Delete Account</button>
          <button class="btn btn-secondary btn-sm" id="drawer-edit-acc-btn">Edit Account</button>
        </div>
      </div>
    `;

    modal.openDrawer({
      title: account.name,
      subtitle: `${account.industry} • Tier: ${account.tier}`,
      content: drawerContent,
      onOpen: (el) => {
        const delBtn = el.querySelector('#drawer-delete-acc-btn');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            modal.confirm({
              title: `Delete "${account.name}"?`,
              message: 'Are you sure? This will remove the account from your CRM.',
              onConfirm: () => {
                dataStore.deleteAccount(account.id);
                modal.closeDrawer();
                toast.success('Account Deleted', 'Removed company record.');
                this.render();
              }
            });
          });
        }

        const editBtn = el.querySelector('#drawer-edit-acc-btn');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            modal.closeDrawer();
            this.openEditAccountModal(account);
          });
        }
      }
    });
  }

  openNewAccountModal() {
    const formHtml = `
      <form id="new-account-form">
        <div class="form-group">
          <label class="form-label required">Company / Account Name</label>
          <input type="text" name="name" class="input" placeholder="e.g. Apex BioSciences Inc." required />
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Industry</label>
            <input type="text" name="industry" class="input" placeholder="e.g. Fintech / AI SaaS" required />
          </div>
          <div class="form-group">
            <label class="form-label required">Account Tier</label>
            <select name="tier" class="input" required>
              <option value="Enterprise">Enterprise</option>
              <option value="Mid-Market">Mid-Market</option>
              <option value="Growth">Growth</option>
              <option value="Startup">Startup</option>
            </select>
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="text" name="phone" class="input" placeholder="+1 (555) 019-2831" />
          </div>
          <div class="form-group">
            <label class="form-label">Annual Revenue</label>
            <input type="text" name="annualRevenue" class="input" placeholder="$15.0M" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Office Address</label>
          <input type="text" name="address" class="input" placeholder="100 Market St, San Francisco, CA" />
        </div>

        <div class="form-group">
          <label class="form-label">Strategic Overview & Notes</label>
          <textarea name="notes" class="input" rows="3" placeholder="Key business focus and relationship history..."></textarea>
        </div>
      </form>
    `;

    modal.openModal({
      title: 'Add New Client Account',
      content: formHtml,
      confirmText: 'Save Account',
      onConfirm: (formData) => {
        if (!formData) return false;
        const newAcc = {
          name: formData.get('name'),
          industry: formData.get('industry'),
          tier: formData.get('tier'),
          phone: formData.get('phone'),
          annualRevenue: formData.get('annualRevenue') || '$5.0M',
          address: formData.get('address'),
          notes: formData.get('notes'),
          healthScore: 90,
          status: 'Active',
          tags: ['New Client', formData.get('tier')]
        };
        dataStore.saveAccount(newAcc);
        toast.success('Account Created', `Added "${newAcc.name}"`);
        this.render();
        return true;
      }
    });
  }

  openEditAccountModal(account) {
    const formHtml = `
      <form id="edit-account-form">
        <div class="form-group">
          <label class="form-label required">Company Name</label>
          <input type="text" name="name" class="input" value="${this.escapeHtml(account.name)}" required />
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Industry</label>
            <input type="text" name="industry" class="input" value="${this.escapeHtml(account.industry)}" required />
          </div>
          <div class="form-group">
            <label class="form-label required">Account Tier</label>
            <select name="tier" class="input" required>
              <option value="Enterprise" ${account.tier === 'Enterprise' ? 'selected' : ''}>Enterprise</option>
              <option value="Mid-Market" ${account.tier === 'Mid-Market' ? 'selected' : ''}>Mid-Market</option>
              <option value="Growth" ${account.tier === 'Growth' ? 'selected' : ''}>Growth</option>
              <option value="Startup" ${account.tier === 'Startup' ? 'selected' : ''}>Startup</option>
            </select>
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="text" name="phone" class="input" value="${account.phone || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Health Score (0-100%)</label>
            <input type="number" name="healthScore" class="input" min="0" max="100" value="${account.healthScore || 85}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea name="notes" class="input" rows="3">${this.escapeHtml(account.notes || '')}</textarea>
        </div>
      </form>
    `;

    modal.openModal({
      title: 'Edit Client Account',
      content: formHtml,
      confirmText: 'Save Changes',
      onConfirm: (formData) => {
        if (!formData) return false;
        const updated = {
          ...account,
          name: formData.get('name'),
          industry: formData.get('industry'),
          tier: formData.get('tier'),
          phone: formData.get('phone'),
          healthScore: Number(formData.get('healthScore')) || 85,
          notes: formData.get('notes')
        };
        dataStore.saveAccount(updated);
        toast.success('Changes Saved', `Updated "${updated.name}"`);
        this.render();
        return true;
      }
    });
  }

  openNewContactModal() {
    const accounts = dataStore.getAccounts();

    const formHtml = `
      <form id="new-contact-form">
        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">First Name</label>
            <input type="text" name="firstName" class="input" placeholder="Sarah" required />
          </div>
          <div class="form-group">
            <label class="form-label required">Last Name</label>
            <input type="text" name="lastName" class="input" placeholder="Connor" required />
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Company / Account</label>
            <select name="accountId" class="input" required>
              ${accounts.map(a => `<option value="${a.id}">${this.escapeHtml(a.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Professional Title</label>
            <input type="text" name="title" class="input" placeholder="VP of Infrastructure" required />
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Email</label>
            <input type="email" name="email" class="input" placeholder="s.connor@example.com" required />
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="text" name="phone" class="input" placeholder="+1 (415) 555-9011" />
          </div>
        </div>

        <div class="form-group">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" name="isPrimary" class="crm-checkbox" />
            <span style="font-size:13px; font-weight:600;">Set as Primary Decision Maker for this Account</span>
          </label>
        </div>
      </form>
    `;

    modal.openModal({
      title: 'Add New Contact',
      content: formHtml,
      confirmText: 'Save Contact',
      onConfirm: (formData) => {
        if (!formData) return false;
        const accId = formData.get('accountId');
        const acc = accounts.find(a => a.id === accId);

        const newCnt = {
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          accountId: accId,
          accountName: acc ? acc.name : 'Company',
          title: formData.get('title'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          isPrimary: formData.get('isPrimary') === 'on',
          status: 'Active'
        };

        dataStore.saveContact(newCnt);
        toast.success('Contact Added', `Created ${newCnt.firstName} ${newCnt.lastName}`);
        this.render();
        return true;
      }
    });
  }

  openContactModal(cnt) {
    const modalContent = `
      <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
        <span class="avatar-pill" style="width:54px; height:54px; font-size:20px;">${cnt.initials}</span>
        <div>
          <h3 style="margin:0; font-size:18px; color:var(--text-primary);">${this.escapeHtml(cnt.name)}</h3>
          <div style="font-size:13px; color:var(--text-muted);">${this.escapeHtml(cnt.title || '')} @ <strong>${this.escapeHtml(cnt.accountName)}</strong></div>
        </div>
      </div>

      <div class="form-group-row">
        <div class="form-group">
          <label class="form-label">Email</label>
          <div class="readonly-pill"><a href="mailto:${cnt.email}" class="link-styled">${cnt.email}</a></div>
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <div class="readonly-pill">${cnt.phone || '—'}</div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Notes</label>
        <div class="deal-notes-box">${this.escapeHtml(cnt.notes || 'No notes available.')}</div>
      </div>
    `;

    modal.openModal({
      title: 'Contact Profile',
      content: modalContent,
      showFooter: true,
      confirmText: 'Done',
      cancelText: 'Delete Contact',
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
