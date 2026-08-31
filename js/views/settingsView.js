/**
 * Enterprise Project CRM - System Settings & Data Management View Controller
 * Features: Dark/Light Theme Switcher, Company Profile, Pipeline Configuration,
 * JSON Backup / Import, and Database Reset to Default Seed.
 */

import { dataStore } from '../data/dataStore.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export class SettingsView {
  constructor(container) {
    this.container = container;
  }

  render() {
    const settings = dataStore.getSettings();

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">System Settings & Data Management</h1>
          <p class="view-subtitle">Manage organization preferences, visual theme, and database backup / restore</p>
        </div>
      </div>

      <div class="grid grid-2" style="gap:24px;">
        <!-- COMPANY PROFILE & GENERAL PREFERENCES -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Company Profile & Branding</h3>
          </div>
          <div class="card-body">
            <form id="settings-company-form">
              <div class="form-group">
                <label class="form-label required">Company Name</label>
                <input type="text" name="companyName" class="input" value="${this.escapeHtml(settings.companyName)}" required />
              </div>

              <div class="form-group-row">
                <div class="form-group">
                  <label class="form-label required">Support Email</label>
                  <input type="email" name="companyEmail" class="input" value="${this.escapeHtml(settings.companyEmail)}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input type="text" name="companyPhone" class="input" value="${this.escapeHtml(settings.companyPhone || '')}" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Headquarters Address</label>
                <input type="text" name="companyAddress" class="input" value="${this.escapeHtml(settings.companyAddress || '')}" />
              </div>

              <div class="form-group-row">
                <div class="form-group">
                  <label class="form-label required">Default Currency</label>
                  <select name="defaultCurrency" class="input">
                    <option value="USD" ${settings.defaultCurrency === 'USD' ? 'selected' : ''}>USD ($ - United States Dollar)</option>
                    <option value="EUR" ${settings.defaultCurrency === 'EUR' ? 'selected' : ''}>EUR (€ - Euro)</option>
                    <option value="GBP" ${settings.defaultCurrency === 'GBP' ? 'selected' : ''}>GBP (£ - British Pound)</option>
                    <option value="INR" ${settings.defaultCurrency === 'INR' ? 'selected' : ''}>INR (₹ - Indian Rupee)</option>
                    <option value="JPY" ${settings.defaultCurrency === 'JPY' ? 'selected' : ''}>JPY (¥ - Japanese Yen)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Default Tax Rate (%)</label>
                  <input type="number" name="taxRate" class="input" value="${settings.taxRate || 10}" min="0" step="0.5" />
                </div>
              </div>

              <button type="submit" class="btn btn-primary" style="margin-top:10px;">Save Profile</button>
            </form>
          </div>
        </div>

        <!-- APPEARANCE & THEME -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Appearance & Theme Engine</h3>
          </div>
          <div class="card-body">
            <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px;">
              Customize visual appearance for optimal high-contrast enterprise viewing.
            </p>

            <div class="theme-selector-grid">
              <div class="theme-option-card ${settings.theme === 'dark' ? 'theme-active' : ''}" data-theme-val="dark">
                <div class="theme-preview-box preview-dark">
                  <div class="preview-sidebar"></div>
                  <div class="preview-content"></div>
                </div>
                <strong style="margin-top:8px; font-size:13px;">Dark Mode</strong>
              </div>

              <div class="theme-option-card ${settings.theme === 'light' ? 'theme-active' : ''}" data-theme-val="light">
                <div class="theme-preview-box preview-light">
                  <div class="preview-sidebar"></div>
                  <div class="preview-content"></div>
                </div>
                <strong style="margin-top:8px; font-size:13px;">Light Mode</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- DATA MANAGEMENT & BACKUP -->
      <div class="card" style="margin-top:24px;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Data Storage, Backup & Synchronization</h3>
            <p class="card-subtitle">Zero-dependency client-side database management via HTML5 LocalStorage</p>
          </div>
        </div>
        <div class="card-body">
          <div class="grid grid-3" style="gap:20px;">
            <!-- EXPORT BACKUP -->
            <div class="data-action-box">
              <h4 style="margin:0 0 6px 0; font-size:14px;">1. Export JSON Database</h4>
              <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">
                Download your entire CRM records (Accounts, Deals, Projects, Invoices, Tasks, Tickets) as a standalone JSON backup.
              </p>
              <button class="btn btn-secondary btn-sm" id="settings-export-json-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download JSON Backup
              </button>
            </div>

            <!-- IMPORT BACKUP -->
            <div class="data-action-box">
              <h4 style="margin:0 0 6px 0; font-size:14px;">2. Restore / Import JSON</h4>
              <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">
                Upload and restore a previously saved CRM backup JSON file.
              </p>
              <input type="file" id="settings-import-file-input" accept=".json" style="display:none;" />
              <button class="btn btn-secondary btn-sm" id="settings-import-json-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload Backup File
              </button>
            </div>

            <!-- RESET TO DEFAULTS -->
            <div class="data-action-box" style="border-color:rgba(239,68,68,0.3);">
              <h4 style="margin:0 0 6px 0; font-size:14px; color:#ef4444;">3. Reset to Mock Dataset</h4>
              <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">
                Re-seed the entire database with the full enterprise seed records.
              </p>
              <button class="btn btn-danger btn-sm" id="settings-reset-data-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                Reset Database
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    // Theme options
    const themeCards = this.container.querySelectorAll('.theme-option-card');
    themeCards.forEach(card => {
      card.addEventListener('click', () => {
        const theme = card.getAttribute('data-theme-val');
        document.documentElement.setAttribute('data-theme', theme);
        dataStore.saveSettings({ theme });
        themeCards.forEach(c => c.classList.remove('theme-active'));
        card.classList.add('theme-active');
        toast.success('Theme Applied', `Switched to ${theme.toUpperCase()} mode.`);
      });
    });

    // Company form
    const form = this.container.querySelector('#settings-company-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const curr = formData.get('defaultCurrency');
        const symbolMap = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };

        dataStore.saveSettings({
          companyName: formData.get('companyName'),
          companyEmail: formData.get('companyEmail'),
          companyPhone: formData.get('companyPhone'),
          companyAddress: formData.get('companyAddress'),
          defaultCurrency: curr,
          currencySymbol: symbolMap[curr] || '$',
          taxRate: Number(formData.get('taxRate')) || 10
        });

        toast.success('Preferences Saved', 'Company profile and financial settings updated.');
      });
    }

    // Export JSON
    const exportBtn = this.container.querySelector('#settings-export-json-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const json = dataStore.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        toast.success('Backup Generated', 'Downloaded JSON database.');
      });
    }

    // Import JSON
    const importBtn = this.container.querySelector('#settings-import-json-btn');
    const fileInput = this.container.querySelector('#settings-import-file-input');
    if (importBtn && fileInput) {
      importBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const res = dataStore.importJSON(evt.target.result);
          if (res.success) {
            toast.success('Database Restored', res.message);
            this.render();
          } else {
            toast.error('Import Failed', res.message);
          }
        };
        reader.readAsText(file);
      });
    }

    // Reset Data
    const resetBtn = this.container.querySelector('#settings-reset-data-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        modal.confirm({
          title: 'Reset Database to Seed State?',
          message: 'All current changes will be overwritten with the default enterprise mock dataset.',
          confirmText: 'Reset Everything',
          confirmClass: 'btn-danger',
          onConfirm: () => {
            dataStore.resetToDefaultData(true);
            toast.success('Database Reset', 'Restored initial sample records.');
            this.render();
          }
        });
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
