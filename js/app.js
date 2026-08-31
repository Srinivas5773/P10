/**
 * Enterprise Project CRM - Application Core Orchestrator & Router
 * Connects all views, navigation state, global command palette (Ctrl+K),
 * notification center, live stopwatch widget, and quick modals.
 */

import { dataStore } from './data/dataStore.js';
import { toast } from './components/toast.js';
import { modal } from './components/modal.js';

// Import View Controllers
import { DashboardView } from './views/dashboardView.js';
import { DealsView } from './views/dealsView.js';
import { ProjectsView } from './views/projectsView.js';
import { TasksView } from './views/tasksView.js';
import { ClientsView } from './views/clientsView.js';
import { InvoicesView } from './views/invoicesView.js';
import { TicketsView } from './views/ticketsView.js';
import { ContractsView } from './views/contractsView.js';
import { CampaignsView } from './views/campaignsView.js';
import { KnowledgeBaseView } from './views/knowledgeBaseView.js';
import { AutomationsView } from './views/automationsView.js';
import { TeamView } from './views/teamView.js';
import { ReportsView } from './views/reportsView.js';
import { SettingsView } from './views/settingsView.js';

class CRMApp {
  constructor() {
    this.currentViewId = 'dashboard';
    this.activeViewController = null;
    this.views = {};
    this.mainContainer = null;
  }

  init() {
    this.mainContainer = document.getElementById('main-viewport');
    
    // Apply saved theme
    const settings = dataStore.getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');

    // Instantiate View Controllers
    this.views = {
      dashboard: new DashboardView(this.mainContainer),
      deals: new DealsView(this.mainContainer),
      projects: new ProjectsView(this.mainContainer),
      tasks: new TasksView(this.mainContainer),
      clients: new ClientsView(this.mainContainer),
      invoices: new InvoicesView(this.mainContainer),
      tickets: new TicketsView(this.mainContainer),
      contracts: new ContractsView(this.mainContainer),
      campaigns: new CampaignsView(this.mainContainer),
      knowledgeBase: new KnowledgeBaseView(this.mainContainer),
      automations: new AutomationsView(this.mainContainer),
      team: new TeamView(this.mainContainer),
      reports: new ReportsView(this.mainContainer),
      settings: new SettingsView(this.mainContainer)
    };

    this.bindNavigation();
    this.bindGlobalKeyboardShortcuts();
    this.bindTopNavControls();
    this.bindDataStoreEvents();

    // Default route
    this.navigate('dashboard');

    // Expose globally for cross-view triggers
    window.crmApp = this;
  }

  navigate(viewId) {
    if (!this.views[viewId]) return;

    this.currentViewId = viewId;
    this.activeViewController = this.views[viewId];

    // Update active state in sidebar
    const navItems = document.querySelectorAll('.nav-link');
    navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Render the view
    this.activeViewController.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile sidebar if open
    const sidebar = document.getElementById('crm-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
  }

  bindNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-view]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        this.navigate(view);
      });
    });

    // Mobile hamburger menu toggle
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('crm-sidebar');
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }
  }

  bindGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K: Open Search Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      }
    });
  }

  bindTopNavControls() {
    // Search bar trigger
    const searchTrigger = document.getElementById('topbar-search-trigger');
    if (searchTrigger) {
      searchTrigger.addEventListener('click', () => {
        this.openCommandPalette();
      });
    }

    // Quick Action button (+)
    const quickActionBtn = document.getElementById('topbar-quick-add-btn');
    if (quickActionBtn) {
      quickActionBtn.addEventListener('click', () => {
        this.openQuickAddMenu();
      });
    }

    // Theme Toggle quick button
    const themeBtn = document.getElementById('topbar-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = curr === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        dataStore.saveSettings({ theme: next });
        toast.info('Theme Toggled', `Switched to ${next.toUpperCase()} mode.`);
      });
    }

    // Notifications Center dropdown
    const notifBtn = document.getElementById('topbar-notif-btn');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        this.openNotificationCenter();
      });
    }
  }

  bindDataStoreEvents() {
    dataStore.subscribe('timer:tick', (timer) => {
      const liveCounter = document.getElementById('tasks-live-timer-counter');
      if (liveCounter && timer) {
        liveCounter.textContent = this.formatDuration(timer.elapsedSeconds);
      }
    });
  }

  openCommandPalette() {
    const paletteHtml = `
      <div class="command-palette-wrapper">
        <div class="palette-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="palette-search-input" class="palette-input" placeholder="Search accounts, deals, projects, tasks, invoices, tickets..." autofocus />
          <span class="palette-esc-badge">ESC to close</span>
        </div>

        <div id="palette-results-container" class="palette-results-list">
          <div class="palette-hint">Type to search across all CRM entities in real-time...</div>
        </div>
      </div>
    `;

    modal.openModal({
      title: 'Global Record Search',
      content: paletteHtml,
      width: '600px',
      showFooter: false,
      onOpen: (body) => {
        const input = body.querySelector('#palette-search-input');
        const resultsBox = body.querySelector('#palette-results-container');

        if (input) {
          input.focus();
          input.addEventListener('input', () => {
            const query = input.value.trim();
            if (!query) {
              resultsBox.innerHTML = '<div class="palette-hint">Type to search across all CRM entities in real-time...</div>';
              return;
            }

            const searchRes = dataStore.searchAll(query);
            if (searchRes.total === 0) {
              resultsBox.innerHTML = `<div class="palette-empty">No matching records found for "${this.escapeHtml(query)}"</div>`;
              return;
            }

            resultsBox.innerHTML = `
              <div class="palette-results-header">Found ${searchRes.total} matching records</div>
              ${searchRes.results.map(r => `
                <div class="palette-result-item cursor-pointer" data-result-type="${r.type}" data-result-id="${r.id}">
                  <div class="palette-result-icon" style="background:${r.color};">
                    ${this.getSearchIcon(r.icon)}
                  </div>
                  <div style="flex:1;">
                    <div class="palette-result-title">${this.escapeHtml(r.title)}</div>
                    <div class="palette-result-sub">${this.escapeHtml(r.subtitle)}</div>
                  </div>
                  <span class="badge badge-secondary" style="font-size:10px; text-transform:uppercase;">${r.type}</span>
                </div>
              `).join('')}
            `;

            // Result clicks
            resultsBox.querySelectorAll('.palette-result-item').forEach(item => {
              item.addEventListener('click', () => {
                const type = item.getAttribute('data-result-type');
                const id = item.getAttribute('data-result-id');
                modal.closeModal();
                this.handleSearchResultClick(type, id);
              });
            });
          });
        }
      }
    });
  }

  handleSearchResultClick(type, id) {
    if (type === 'deal') {
      this.navigate('deals');
      setTimeout(() => this.views.deals.openDealDrawer(id), 100);
    } else if (type === 'project') {
      this.navigate('projects');
      setTimeout(() => this.views.projects.openProjectDrawer(id), 100);
    } else if (type === 'task') {
      this.navigate('tasks');
      setTimeout(() => this.views.tasks.openTaskDrawer(id), 100);
    } else if (type === 'account') {
      this.navigate('clients');
      setTimeout(() => this.views.clients.openAccount360Drawer(id), 100);
    } else if (type === 'invoice') {
      this.navigate('invoices');
      setTimeout(() => this.views.invoices.openPrintableInvoiceModal(id), 100);
    } else if (type === 'ticket') {
      this.navigate('tickets');
      this.views.tickets.selectedTicketId = id;
      this.views.tickets.render();
    } else if (type === 'contact') {
      this.navigate('clients');
      this.views.clients.tabMode = 'contacts';
      this.views.clients.render();
    }
  }

  openQuickAddMenu() {
    const content = `
      <div class="quick-add-grid">
        <button class="quick-add-btn" id="qa-deal">
          <div class="qa-icon" style="background:#6366f1;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <strong>New Opportunity</strong>
            <div style="font-size:11px; color:var(--text-muted);">Add new sales deal</div>
          </div>
        </button>

        <button class="quick-add-btn" id="qa-project">
          <div class="qa-icon" style="background:#06b6d4;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div>
            <strong>New Project</strong>
            <div style="font-size:11px; color:var(--text-muted);">Launch portfolio</div>
          </div>
        </button>

        <button class="quick-add-btn" id="qa-task">
          <div class="qa-icon" style="background:#3b82f6;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div>
            <strong>New Task</strong>
            <div style="font-size:11px; color:var(--text-muted);">Create deliverable</div>
          </div>
        </button>

        <button class="quick-add-btn" id="qa-invoice">
          <div class="qa-icon" style="background:#10b981;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <div>
            <strong>New Invoice</strong>
            <div style="font-size:11px; color:var(--text-muted);">Bill milestone</div>
          </div>
        </button>
      </div>
    `;

    modal.openModal({
      title: 'Quick Create Action',
      content,
      width: '480px',
      showFooter: false,
      onOpen: (body) => {
        body.querySelector('#qa-deal').addEventListener('click', () => {
          modal.closeModal();
          this.views.deals.openNewDealModal();
        });
        body.querySelector('#qa-project').addEventListener('click', () => {
          modal.closeModal();
          this.views.projects.openNewProjectModal();
        });
        body.querySelector('#qa-task').addEventListener('click', () => {
          modal.closeModal();
          this.views.tasks.openNewTaskModal();
        });
        body.querySelector('#qa-invoice').addEventListener('click', () => {
          modal.closeModal();
          this.views.invoices.openCreateInvoiceModal();
        });
      }
    });
  }

  openNotificationCenter() {
    const activities = dataStore.getActivities(15);

    const content = `
      <div class="notifications-center-list" style="max-height:400px; overflow-y:auto; display:flex; flex-direction:column; gap:10px;">
        ${activities.map(act => `
          <div style="display:flex; gap:12px; padding:10px; background:var(--bg-card-hover); border-radius:8px;">
            <div class="activity-icon" style="background:${act.color || '#6366f1'}; width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div style="flex:1;">
              <strong style="font-size:13px; color:var(--text-primary);">${this.escapeHtml(act.title)}</strong>
              <div style="font-size:11px; color:var(--text-muted);">${this.escapeHtml(act.details || '')}</div>
              <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">${this.formatTimeAgo(act.timestamp)} by ${act.user}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    modal.openModal({
      title: 'Activity Notifications & Audit Trail',
      content,
      width: '540px',
      showFooter: false
    });
  }

  openTimeTrackerModal() {
    const tasks = dataStore.getTasks().filter(t => t.status !== 'completed');
    const timer = dataStore.getTimerState();

    const formHtml = `
      <div class="timer-modal-content">
        ${timer && timer.isRunning ? `
          <div style="text-align:center; padding:20px; background:rgba(99,102,241,0.1); border-radius:12px; margin-bottom:20px;">
            <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Currently Tracking</div>
            <h3 style="margin:6px 0; font-size:16px;">${this.escapeHtml(timer.taskName)}</h3>
            <div class="timer-time-display" style="font-size:32px; font-weight:900; margin:10px 0;">${this.formatDuration(timer.elapsedSeconds)}</div>
            <button class="btn btn-danger" id="modal-stop-timer-btn">Stop & Log to Task</button>
          </div>
        ` : `
          <form id="start-timer-form">
            <div class="form-group">
              <label class="form-label required">Select Task to Track</label>
              <select name="taskId" id="timer-task-select" class="input" required>
                ${tasks.map(t => `<option value="${t.id}">${this.escapeHtml(t.projectName)}: ${this.escapeHtml(t.title)}</option>`).join('')}
              </select>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              Start Live Stopwatch
            </button>
          </form>
        `}
      </div>
    `;

    modal.openModal({
      title: 'Time Tracking Stopwatch',
      content: formHtml,
      width: '460px',
      showFooter: false,
      onOpen: (body) => {
        const stopBtn = body.querySelector('#modal-stop-timer-btn');
        if (stopBtn) {
          stopBtn.addEventListener('click', () => {
            const logged = dataStore.stopAndLogTimer();
            modal.closeModal();
            toast.success('Time Recorded', `Logged ${logged.loggedHours} hours.`);
            if (this.activeViewController) this.activeViewController.render();
          });
        }

        const startForm = body.querySelector('#start-timer-form');
        if (startForm) {
          startForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const taskId = startForm.querySelector('#timer-task-select').value;
            const task = tasks.find(t => t.id === taskId);
            dataStore.startTimer(taskId, task ? task.title : 'General Task');
            modal.closeModal();
            toast.info('⏱️ Stopwatch Running', `Tracking time on "${task ? task.title : 'Task'}".`);
            if (this.activeViewController) this.activeViewController.render();
          });
        }
      }
    });
  }

  openNewDealModal() {
    this.views.deals.openNewDealModal();
  }

  openProjectDrawer(id) {
    this.views.projects.openProjectDrawer(id);
  }

  openNewTaskModal(preselectedProjectId = null) {
    this.views.tasks.openNewTaskModal(preselectedProjectId);
  }

  getSearchIcon(icon) {
    const icons = {
      briefcase: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      user: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      'dollar-sign': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
      'check-square': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
      receipt: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/></svg>`,
      'life-buoy': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>`
    };
    return icons[icon] || icons.briefcase;
  }

  formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new CRMApp();
  app.init();
});
