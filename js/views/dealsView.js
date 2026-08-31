/**
 * Enterprise Project CRM - Deals & Sales Pipeline View Controller
 * Features: Interactive Drag-and-Drop Kanban Board, Table Grid View,
 * Deal 360° Drawer, Probability Calculation, and Stage History Stepper.
 */

import { dataStore } from '../data/dataStore.js';
import { TableGrid } from '../components/tableGrid.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export class DealsView {
  constructor(container) {
    this.container = container;
    this.viewMode = 'kanban'; // 'kanban' or 'table'
    this.tableGrid = null;
  }

  render() {
    const deals = dataStore.getDeals();
    const settings = dataStore.getSettings();
    const stages = settings.pipelineStages || [];
    const metrics = dataStore.getPipelineMetrics();
    const currency = settings.currencySymbol || '$';

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Deals & Opportunities Pipeline</h1>
          <p class="view-subtitle">
            Active: <strong>${currency}${metrics.totalPipelineValue.toLocaleString()}</strong> (${metrics.openCount} deals) • 
            Weighted: <strong>${currency}${metrics.weightedPipelineValue.toLocaleString()}</strong> • 
            Won: <strong style="color:var(--color-success);">${currency}${metrics.wonValue.toLocaleString()}</strong> (${metrics.winRate}% win rate)
          </p>
        </div>
        <div class="view-header-actions">
          <div class="view-mode-toggle">
            <button class="btn btn-sm ${this.viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}" id="deals-toggle-kanban">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>
              Kanban
            </button>
            <button class="btn btn-sm ${this.viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}" id="deals-toggle-table">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Table
            </button>
          </div>
          <button class="btn btn-secondary" id="deals-export-csv-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button class="btn btn-primary" id="deals-new-deal-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Opportunity
          </button>
        </div>
      </div>

      <div id="deals-view-content" class="animate-fade-in"></div>
    `;

    this.container.innerHTML = html;
    this.renderContent();
    this.bindHeaderEvents();
  }

  renderContent() {
    const contentEl = this.container.querySelector('#deals-view-content');
    if (!contentEl) return;

    if (this.viewMode === 'kanban') {
      this.renderKanban(contentEl);
    } else {
      this.renderTable(contentEl);
    }
  }

  renderKanban(container) {
    const deals = dataStore.getDeals();
    const settings = dataStore.getSettings();
    const stages = settings.pipelineStages || [];
    const currency = settings.currencySymbol || '$';

    let html = `
      <div class="kanban-board" id="deals-kanban-board">
        ${stages.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

          return `
            <div class="kanban-column" data-stage-id="${stage.id}">
              <div class="kanban-column-header">
                <div class="kanban-column-title-wrap">
                  <span class="kanban-stage-indicator" style="background:${stage.color};"></span>
                  <h4 class="kanban-column-title">${this.escapeHtml(stage.name)}</h4>
                  <span class="kanban-count-pill">${stageDeals.length}</span>
                </div>
                <div class="kanban-column-amount">${currency}${stageTotal.toLocaleString()}</div>
              </div>

              <div class="kanban-cards-container" data-stage-id="${stage.id}">
                ${stageDeals.map(deal => `
                  <div class="kanban-card cursor-grab animate-scale-up" draggable="true" data-deal-id="${deal.id}">
                    <div class="kanban-card-header">
                      <span class="badge badge-priority badge-${deal.priority || 'medium'}">${(deal.priority || 'medium').toUpperCase()}</span>
                      <span class="kanban-card-date">${this.formatDate(deal.expectedCloseDate)}</span>
                    </div>

                    <div class="kanban-card-title">${this.escapeHtml(deal.title)}</div>
                    
                    <div class="kanban-card-account">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      <span>${this.escapeHtml(deal.accountName)}</span>
                    </div>

                    <div class="kanban-card-footer">
                      <div class="kanban-card-amount">
                        ${currency}${Number(deal.amount || 0).toLocaleString()}
                        <span class="kanban-prob-hint">(${deal.probability}%)</span>
                      </div>
                      <div class="avatar-pill" title="Assigned to ${deal.assignedUser?.name || 'Unassigned'}">
                        ${deal.assignedUser?.initials || 'UN'}
                      </div>
                    </div>
                  </div>
                `).join('')}

                ${stageDeals.length === 0 ? `
                  <div class="kanban-empty-dropzone">Drop deals here</div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
    this.initDragAndDrop();
    this.bindCardClicks();
  }

  renderTable(container) {
    const deals = dataStore.getDeals();
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    container.innerHTML = '<div id="deals-table-container"></div>';

    this.tableGrid = new TableGrid({
      container: '#deals-table-container',
      data: deals,
      pageSize: 10,
      defaultSortKey: 'amount',
      defaultSortAsc: false,
      columns: [
        {
          key: 'title',
          label: 'Opportunity',
          sortable: true,
          render: (val, item) => `
            <div>
              <strong style="color:var(--text-primary); font-size:13px;">${this.escapeHtml(val)}</strong>
              <div style="font-size:11px; color:var(--text-muted);">${item.tags?.join(', ') || ''}</div>
            </div>
          `
        },
        {
          key: 'accountName',
          label: 'Company / Account',
          sortable: true,
          render: (val) => `<span style="font-weight:600;">${this.escapeHtml(val)}</span>`
        },
        {
          key: 'stage',
          label: 'Stage',
          sortable: true,
          render: (val) => {
            const st = settings.pipelineStages.find(s => s.id === val);
            const color = st ? st.color : '#6366f1';
            const name = st ? st.name : val;
            return `<span class="badge" style="background:rgba(99,102,241,0.15); color:${color}; font-weight:700;">${name}</span>`;
          }
        },
        {
          key: 'amount',
          label: 'Value',
          sortable: true,
          render: (val) => `<strong style="font-size:13px;">${currency}${Number(val).toLocaleString()}</strong>`
        },
        {
          key: 'probability',
          label: 'Probability',
          sortable: true,
          render: (val, item) => `
            <div>
              <span>${val}%</span>
              <div style="font-size:11px; color:var(--text-muted);">Weighted: ${currency}${Number(item.weightedAmount || 0).toLocaleString()}</div>
            </div>
          `
        },
        {
          key: 'expectedCloseDate',
          label: 'Close Date',
          sortable: true,
          render: (val) => this.formatDate(val)
        },
        {
          key: 'assignedTo',
          label: 'Rep',
          sortable: true,
          render: (val, item) => `
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="avatar-pill">${item.assignedUser?.initials || 'SC'}</span>
              <span>${item.assignedUser?.name || 'Sophia Chen'}</span>
            </div>
          `
        }
      ],
      onRowClick: (deal) => {
        this.openDealDrawer(deal.id);
      },
      batchActions: [
        {
          label: 'Delete Selected',
          class: 'btn-danger',
          action: (items, ids) => {
            modal.confirm({
              title: `Delete ${ids.length} Deals?`,
              message: 'This will permanently remove the selected deals from your CRM pipeline.',
              onConfirm: () => {
                ids.forEach(id => dataStore.deleteDeal(id));
                toast.success('Deals deleted', `Successfully removed ${ids.length} records.`);
                this.render();
              }
            });
          }
        }
      ]
    });
  }

  initDragAndDrop() {
    const cards = this.container.querySelectorAll('.kanban-card');
    const containers = this.container.querySelectorAll('.kanban-cards-container');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('is-dragging');
        e.dataTransfer.setData('text/plain', card.getAttribute('data-deal-id'));
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
        containers.forEach(c => c.classList.remove('drag-over'));
      });
    });

    containers.forEach(dropzone => {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dropzone.classList.add('drag-over');
      });

      dropzone.addEventListener('dragleave', (e) => {
        if (!dropzone.contains(e.relatedTarget)) {
          dropzone.classList.remove('drag-over');
        }
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        const dealId = e.dataTransfer.getData('text/plain');
        const targetStage = dropzone.getAttribute('data-stage-id');

        if (dealId && targetStage) {
          const updated = dataStore.updateDealStage(dealId, targetStage);
          if (updated) {
            toast.success('Stage Updated', `Deal "${updated.title}" moved to ${targetStage.replace('_', ' ').toUpperCase()}`);
            this.render();
          }
        }
      });
    });
  }

  bindCardClicks() {
    const cards = this.container.querySelectorAll('.kanban-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        const id = card.getAttribute('data-deal-id');
        this.openDealDrawer(id);
      });
    });
  }

  bindHeaderEvents() {
    const toggleKanban = this.container.querySelector('#deals-toggle-kanban');
    const toggleTable = this.container.querySelector('#deals-toggle-table');
    const exportBtn = this.container.querySelector('#deals-export-csv-btn');
    const newDealBtn = this.container.querySelector('#deals-new-deal-btn');

    if (toggleKanban) {
      toggleKanban.addEventListener('click', () => {
        this.viewMode = 'kanban';
        this.render();
      });
    }

    if (toggleTable) {
      toggleTable.addEventListener('click', () => {
        this.viewMode = 'table';
        this.render();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const csv = dataStore.exportCollectionCSV('deals');
        this.downloadCSV(csv, 'crm-deals-export.csv');
        toast.info('CSV Exported', 'Downloaded deals data to CSV.');
      });
    }

    if (newDealBtn) {
      newDealBtn.addEventListener('click', () => {
        this.openNewDealModal();
      });
    }
  }

  openDealDrawer(dealId) {
    const deal = dataStore.getDealById(dealId);
    if (!deal) return;

    const settings = dataStore.getSettings();
    const stages = settings.pipelineStages || [];
    const currency = settings.currencySymbol || '$';
    const currentStageIdx = stages.findIndex(s => s.id === deal.stage);

    const drawerContent = `
      <div class="deal-drawer-container">
        <!-- STAGE STEPPER -->
        <div class="deal-stepper">
          ${stages.map((st, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            return `
              <div class="stepper-step ${isCurrent ? 'step-current' : (isCompleted ? 'step-completed' : '')}" data-step-stage="${st.id}">
                <div class="step-dot" style="background:${isCurrent || isCompleted ? st.color : 'var(--border-color)'};"></div>
                <div class="step-label">${st.name}</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- DEAL METRICS STRIP -->
        <div class="grid grid-3" style="margin: 20px 0; gap:12px;">
          <div class="card stat-box" style="padding:14px;">
            <div class="stat-box-label">Deal Value</div>
            <div class="stat-box-value">${currency}${deal.amount.toLocaleString()}</div>
          </div>
          <div class="card stat-box" style="padding:14px;">
            <div class="stat-box-label">Win Probability</div>
            <div class="stat-box-value" style="color:var(--color-primary);">${deal.probability}%</div>
          </div>
          <div class="card stat-box" style="padding:14px;">
            <div class="stat-box-label">Weighted Value</div>
            <div class="stat-box-value">${currency}${deal.weightedAmount.toLocaleString()}</div>
          </div>
        </div>

        <!-- DETAILS TAB -->
        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Client Account</label>
            <div class="readonly-pill">${this.escapeHtml(deal.accountName)}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Primary Contact</label>
            <div class="readonly-pill">${this.escapeHtml(deal.contactName || 'None assigned')}</div>
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Expected Close Date</label>
            <div class="readonly-pill">${deal.expectedCloseDate || 'Not set'}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Deal Owner</label>
            <div class="readonly-pill">${deal.assignedUser?.name || 'Sophia Chen'}</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes & Next Steps</label>
          <div class="deal-notes-box">${this.escapeHtml(deal.notes || 'No notes added yet.')}</div>
        </div>

        <!-- STAGE HISTORY LOG -->
        <div class="section-divider" style="margin:20px 0;"></div>
        <h4 style="font-size:14px; font-weight:700; margin-bottom:12px;">Stage History & Timeline</h4>
        <div class="activity-timeline">
          ${(deal.history || []).map(h => `
            <div class="activity-item">
              <div class="activity-icon" style="background:#6366f1;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="activity-content">
                <div class="activity-title">${this.escapeHtml(h.stage.toUpperCase().replace('_', ' '))}</div>
                <div class="activity-details">${this.escapeHtml(h.note || '')}</div>
                <div class="activity-meta">${h.date}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- DRAWER ACTIONS -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:30px; padding-top:16px; border-top:1px solid var(--border-color);">
          <button class="btn btn-danger btn-sm" id="drawer-delete-deal-btn">Delete Opportunity</button>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-secondary btn-sm" id="drawer-edit-deal-btn">Edit Deal</button>
            ${deal.stage !== 'closed_won' ? `
              <button class="btn btn-success btn-sm" id="drawer-mark-won-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Mark as Closed Won
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    modal.openDrawer({
      title: deal.title,
      subtitle: `${deal.accountName} • Priority: ${deal.priority.toUpperCase()}`,
      content: drawerContent,
      onOpen: (el) => {
        // Step click transitions
        const steps = el.querySelectorAll('[data-step-stage]');
        steps.forEach(st => {
          st.addEventListener('click', () => {
            const newStage = st.getAttribute('data-step-stage');
            dataStore.updateDealStage(deal.id, newStage);
            modal.closeDrawer();
            toast.success('Stage Updated', `Moved deal to ${newStage.replace('_', ' ').toUpperCase()}`);
            this.render();
          });
        });

        // Mark won
        const wonBtn = el.querySelector('#drawer-mark-won-btn');
        if (wonBtn) {
          wonBtn.addEventListener('click', () => {
            dataStore.updateDealStage(deal.id, 'closed_won');
            modal.closeDrawer();
            toast.success('🎉 Deal Won!', `Congratulations! ${deal.title} marked as Closed Won.`);
            this.render();
          });
        }

        // Delete
        const delBtn = el.querySelector('#drawer-delete-deal-btn');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            modal.confirm({
              title: `Delete "${deal.title}"?`,
              message: 'Are you sure you want to remove this deal from the system?',
              onConfirm: () => {
                dataStore.deleteDeal(deal.id);
                modal.closeDrawer();
                toast.success('Deal Deleted', 'The deal was removed.');
                this.render();
              }
            });
          });
        }

        // Edit
        const editBtn = el.querySelector('#drawer-edit-deal-btn');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            modal.closeDrawer();
            this.openEditDealModal(deal);
          });
        }
      }
    });
  }

  openNewDealModal() {
    const accounts = dataStore.getAccounts();
    const settings = dataStore.getSettings();
    const stages = settings.pipelineStages || [];
    const team = dataStore.getTeamMembers();

    const formHtml = `
      <form id="new-deal-form">
        <div class="form-group">
          <label class="form-label required">Opportunity Title</label>
          <input type="text" name="title" class="input" placeholder="e.g. Cloud Security License & Migration" required />
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Client Account</label>
            <select name="accountId" class="input" required>
              <option value="">-- Select Company --</option>
              ${accounts.map(a => `<option value="${a.id}">${this.escapeHtml(a.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Deal Amount ($)</label>
            <input type="number" name="amount" class="input" placeholder="150000" min="0" required />
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Pipeline Stage</label>
            <select name="stage" class="input" required>
              ${stages.map(s => `<option value="${s.id}">${s.name} (${s.probability}%)</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Expected Close Date</label>
            <input type="date" name="expectedCloseDate" class="input" required value="${new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]}" />
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Assigned Account Executive</label>
            <select name="assignedTo" class="input">
              ${team.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select name="priority" class="input">
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Strategic Notes</label>
          <textarea name="notes" class="input" rows="3" placeholder="Key decision makers, requirements, and next steps..."></textarea>
        </div>
      </form>
    `;

    modal.openModal({
      title: 'Create New Opportunity',
      content: formHtml,
      confirmText: 'Create Opportunity',
      onConfirm: (formData) => {
        if (!formData) return false;
        const accountId = formData.get('accountId');
        const account = accounts.find(a => a.id === accountId);
        const assignedToId = formData.get('assignedTo');
        const user = team.find(u => u.id === assignedToId);

        const newDeal = {
          title: formData.get('title'),
          accountId: accountId,
          accountName: account ? account.name : 'Client',
          amount: Number(formData.get('amount')) || 0,
          stage: formData.get('stage'),
          expectedCloseDate: formData.get('expectedCloseDate'),
          priority: formData.get('priority') || 'medium',
          notes: formData.get('notes'),
          assignedTo: assignedToId,
          assignedUser: user ? { name: user.name, initials: user.initials } : { name: 'Sophia Chen', initials: 'SC' },
          tags: ['Inbound', 'New Deal']
        };

        dataStore.saveDeal(newDeal);
        toast.success('Opportunity Created', `"${newDeal.title}" added to pipeline.`);
        this.render();
        return true;
      }
    });
  }

  openEditDealModal(deal) {
    const accounts = dataStore.getAccounts();
    const settings = dataStore.getSettings();
    const stages = settings.pipelineStages || [];
    const team = dataStore.getTeamMembers();

    const formHtml = `
      <form id="edit-deal-form">
        <div class="form-group">
          <label class="form-label required">Opportunity Title</label>
          <input type="text" name="title" class="input" value="${this.escapeHtml(deal.title)}" required />
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Client Account</label>
            <select name="accountId" class="input" required>
              ${accounts.map(a => `<option value="${a.id}" ${a.id === deal.accountId ? 'selected' : ''}>${this.escapeHtml(a.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Deal Amount ($)</label>
            <input type="number" name="amount" class="input" value="${deal.amount}" min="0" required />
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Pipeline Stage</label>
            <select name="stage" class="input" required>
              ${stages.map(s => `<option value="${s.id}" ${s.id === deal.stage ? 'selected' : ''}>${s.name} (${s.probability}%)</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Expected Close Date</label>
            <input type="date" name="expectedCloseDate" class="input" required value="${deal.expectedCloseDate || ''}" />
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select name="priority" class="input">
              <option value="low" ${deal.priority === 'low' ? 'selected' : ''}>Low</option>
              <option value="medium" ${deal.priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="high" ${deal.priority === 'high' ? 'selected' : ''}>High</option>
              <option value="urgent" ${deal.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Assigned Rep</label>
            <select name="assignedTo" class="input">
              ${team.map(u => `<option value="${u.id}" ${u.id === deal.assignedTo ? 'selected' : ''}>${u.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea name="notes" class="input" rows="3">${this.escapeHtml(deal.notes || '')}</textarea>
        </div>
      </form>
    `;

    modal.openModal({
      title: 'Edit Opportunity',
      content: formHtml,
      confirmText: 'Save Changes',
      onConfirm: (formData) => {
        if (!formData) return false;
        const accountId = formData.get('accountId');
        const account = accounts.find(a => a.id === accountId);
        const assignedToId = formData.get('assignedTo');
        const user = team.find(u => u.id === assignedToId);

        const updated = {
          ...deal,
          title: formData.get('title'),
          accountId: accountId,
          accountName: account ? account.name : deal.accountName,
          amount: Number(formData.get('amount')) || 0,
          stage: formData.get('stage'),
          expectedCloseDate: formData.get('expectedCloseDate'),
          priority: formData.get('priority'),
          notes: formData.get('notes'),
          assignedTo: assignedToId,
          assignedUser: user ? { name: user.name, initials: user.initials } : deal.assignedUser
        };

        dataStore.saveDeal(updated);
        toast.success('Changes Saved', `Updated "${updated.title}"`);
        this.render();
        return true;
      }
    });
  }

  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  formatDate(dateStr) {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
