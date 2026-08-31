/**
 * Enterprise Project CRM - Projects & Gantt Timeline View Controller
 * Features: Portfolio Cards, Interactive SVG Gantt Timeline View,
 * Milestone Tracking, Budget Burnup, and Project Workspace Drawer.
 */

import { dataStore } from '../data/dataStore.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { TableGrid } from '../components/tableGrid.js';

export class ProjectsView {
  constructor(container) {
    this.container = container;
    this.viewMode = 'cards'; // 'cards', 'gantt', 'table'
  }

  render() {
    const projects = dataStore.getProjects();
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (Number(p.spent) || 0), 0);
    const avgHealth = Math.round(projects.reduce((sum, p) => sum + (Number(p.health) || 85), 0) / Math.max(1, projects.length));

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Project Portfolio & Timeline</h1>
          <p class="view-subtitle">
            <strong>${projects.length}</strong> Total Portfolios • 
            Budget: <strong>${currency}${totalBudget.toLocaleString()}</strong> • 
            Spent: <strong>${currency}${totalSpent.toLocaleString()}</strong> • 
            Avg Health: <strong style="color:var(--color-success);">${avgHealth}%</strong>
          </p>
        </div>
        <div class="view-header-actions">
          <div class="view-mode-toggle">
            <button class="btn btn-sm ${this.viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}" id="proj-toggle-cards">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Cards
            </button>
            <button class="btn btn-sm ${this.viewMode === 'gantt' ? 'btn-primary' : 'btn-secondary'}" id="proj-toggle-gantt">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="6" y1="18" x2="18" y2="18"/></svg>
              Gantt Timeline
            </button>
            <button class="btn btn-sm ${this.viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}" id="proj-toggle-table">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Table
            </button>
          </div>
          <button class="btn btn-primary" id="proj-new-project-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Project
          </button>
        </div>
      </div>

      <div id="projects-view-content" class="animate-fade-in"></div>
    `;

    this.container.innerHTML = html;
    this.renderContent();
    this.bindHeaderEvents();
  }

  renderContent() {
    const contentEl = this.container.querySelector('#projects-view-content');
    if (!contentEl) return;

    if (this.viewMode === 'cards') {
      this.renderCards(contentEl);
    } else if (this.viewMode === 'gantt') {
      this.renderGantt(contentEl);
    } else {
      this.renderTable(contentEl);
    }
  }

  renderCards(container) {
    const projects = dataStore.getProjects();
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    let html = `
      <div class="grid grid-3" style="gap: 20px;">
        ${projects.map(p => {
          const healthColor = p.health >= 90 ? '#10b981' : (p.health >= 75 ? '#f59e0b' : '#ef4444');
          const completedMs = (p.milestones || []).filter(m => m.completed).length;
          const totalMs = (p.milestones || []).length;

          return `
            <div class="card project-card cursor-pointer animate-scale-up" data-proj-id="${p.id}">
              <div class="project-card-header">
                <div>
                  <span class="badge badge-status badge-${p.status}">${p.status.replace('_', ' ').toUpperCase()}</span>
                  <div class="project-code-tag">${p.code}</div>
                </div>
                <div class="health-score-circle" style="border-color:${healthColor}; color:${healthColor};">
                  ${p.health}%
                </div>
              </div>

              <h3 class="project-card-title">${this.escapeHtml(p.name)}</h3>
              <p class="project-card-client">${this.escapeHtml(p.accountName)}</p>

              <div class="project-progress-section">
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                  <span style="color:var(--text-muted);">Overall Progress</span>
                  <strong style="color:var(--text-primary);">${p.progress}%</strong>
                </div>
                <div class="progress-bar-wrapper">
                  <div class="progress-bar-fill" style="width:${p.progress}%; background:${healthColor};"></div>
                </div>
              </div>

              <div class="project-card-meta-grid">
                <div>
                  <div class="meta-label">Budget</div>
                  <div class="meta-val">${currency}${p.budget.toLocaleString()}</div>
                </div>
                <div>
                  <div class="meta-label">Spent</div>
                  <div class="meta-val">${currency}${p.spent.toLocaleString()}</div>
                </div>
                <div>
                  <div class="meta-label">Milestones</div>
                  <div class="meta-val">${completedMs} / ${totalMs}</div>
                </div>
              </div>

              <div class="project-card-footer">
                <div class="project-date-range">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>${p.startDate} → ${p.endDate}</span>
                </div>
                <div class="avatar-stack">
                  ${(p.teamMembers || []).map(uId => {
                    const u = dataStore.getTeamMemberById(uId);
                    return `<span class="avatar-mini" title="${u ? u.name : 'Team Member'}">${u ? u.initials : 'TM'}</span>`;
                  }).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
    this.bindCardClicks();
  }

  renderGantt(container) {
    const projects = dataStore.getProjects();
    const tasks = dataStore.getTasks();

    // Timeline range: August 2025 - January 2026 (6 months)
    const months = [
      { name: 'Aug 2025', days: 31, start: new Date('2025-08-01') },
      { name: 'Sep 2025', days: 30, start: new Date('2025-09-01') },
      { name: 'Oct 2025', days: 31, start: new Date('2025-10-01') },
      { name: 'Nov 2025', days: 30, start: new Date('2025-11-01') },
      { name: 'Dec 2025', days: 31, start: new Date('2025-12-01') },
      { name: 'Jan 2026', days: 31, start: new Date('2026-01-01') }
    ];

    const timelineStart = new Date('2025-08-01').getTime();
    const timelineEnd = new Date('2026-01-31').getTime();
    const totalDuration = timelineEnd - timelineStart;

    let html = `
      <div class="card gantt-wrapper">
        <div class="gantt-header-row">
          <div class="gantt-project-col">Project & Milestones</div>
          <div class="gantt-timeline-col">
            <div class="gantt-months-bar">
              ${months.map(m => `
                <div class="gantt-month-header" style="flex:${m.days};">
                  ${m.name}
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="gantt-body">
          ${projects.map(p => {
            const pStart = Math.max(timelineStart, new Date(p.startDate || '2025-08-01').getTime());
            const pEnd = Math.min(timelineEnd, new Date(p.endDate || '2025-12-31').getTime());
            const leftPct = ((pStart - timelineStart) / totalDuration) * 100;
            const widthPct = Math.max(2, ((pEnd - pStart) / totalDuration) * 100);
            const healthColor = p.health >= 90 ? '#10b981' : (p.health >= 75 ? '#f59e0b' : '#ef4444');

            return `
              <div class="gantt-project-row">
                <div class="gantt-project-cell cursor-pointer" data-proj-id="${p.id}">
                  <div style="font-weight:700; color:var(--text-primary); font-size:13px;">${this.escapeHtml(p.code)}: ${this.escapeHtml(p.name)}</div>
                  <div style="font-size:11px; color:var(--text-muted);">${this.escapeHtml(p.accountName)} • ${p.progress}%</div>
                </div>
                <div class="gantt-timeline-cell">
                  <!-- Project Main Bar -->
                  <div class="gantt-bar cursor-pointer" style="left:${leftPct}%; width:${widthPct}%; background:${healthColor};" data-proj-id="${p.id}">
                    <div class="gantt-bar-fill" style="width:${p.progress}%;"></div>
                    <span class="gantt-bar-label">${p.progress}%</span>
                  </div>

                  <!-- Milestones -->
                  ${(p.milestones || []).map(m => {
                    const mDate = new Date(m.dueDate).getTime();
                    if (mDate >= timelineStart && mDate <= timelineEnd) {
                      const mLeft = ((mDate - timelineStart) / totalDuration) * 100;
                      return `
                        <div class="gantt-milestone-marker ${m.completed ? 'completed' : ''}" style="left:${mLeft}%;" title="Milestone: ${this.escapeHtml(m.title)} (${m.dueDate})">
                          <span class="milestone-diamond"></span>
                        </div>
                      `;
                    }
                    return '';
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.bindCardClicks();
  }

  renderTable(container) {
    const projects = dataStore.getProjects();
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    container.innerHTML = '<div id="projects-table-container"></div>';

    new TableGrid({
      container: '#projects-table-container',
      data: projects,
      pageSize: 10,
      defaultSortKey: 'budget',
      defaultSortAsc: false,
      columns: [
        {
          key: 'name',
          label: 'Project Name',
          sortable: true,
          render: (val, item) => `
            <div>
              <strong style="color:var(--text-primary);">${this.escapeHtml(val)}</strong>
              <div style="font-size:11px; color:var(--text-muted);">${item.code}</div>
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
          label: 'Status',
          sortable: true,
          render: (val) => `<span class="badge badge-status badge-${val}">${val.replace('_', ' ').toUpperCase()}</span>`
        },
        {
          key: 'health',
          label: 'Health',
          sortable: true,
          render: (val) => {
            const color = val >= 90 ? '#10b981' : (val >= 75 ? '#f59e0b' : '#ef4444');
            return `<strong style="color:${color};">${val}%</strong>`;
          }
        },
        {
          key: 'progress',
          label: 'Progress',
          sortable: true,
          render: (val, item) => `
            <div style="width:120px;">
              <div class="progress-bar-wrapper">
                <div class="progress-bar-fill" style="width:${val}%; background:${item.health >= 85 ? '#10b981' : '#f59e0b'};"></div>
              </div>
              <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${val}% done</div>
            </div>
          `
        },
        {
          key: 'budget',
          label: 'Budget',
          sortable: true,
          render: (val, item) => `
            <div>
              <strong>${currency}${Number(val).toLocaleString()}</strong>
              <div style="font-size:11px; color:var(--text-muted);">${currency}${Number(item.spent || 0).toLocaleString()} spent</div>
            </div>
          `
        },
        {
          key: 'endDate',
          label: 'Deadline',
          sortable: true,
          render: (val) => val || 'TBD'
        }
      ],
      onRowClick: (p) => {
        this.openProjectDrawer(p.id);
      }
    });
  }

  bindCardClicks() {
    const cards = this.container.querySelectorAll('[data-proj-id]');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-proj-id');
        this.openProjectDrawer(id);
      });
    });
  }

  bindHeaderEvents() {
    const toggleCards = this.container.querySelector('#proj-toggle-cards');
    const toggleGantt = this.container.querySelector('#proj-toggle-gantt');
    const toggleTable = this.container.querySelector('#proj-toggle-table');
    const newProjBtn = this.container.querySelector('#proj-new-project-btn');

    if (toggleCards) {
      toggleCards.addEventListener('click', () => {
        this.viewMode = 'cards';
        this.render();
      });
    }

    if (toggleGantt) {
      toggleGantt.addEventListener('click', () => {
        this.viewMode = 'gantt';
        this.render();
      });
    }

    if (toggleTable) {
      toggleTable.addEventListener('click', () => {
        this.viewMode = 'table';
        this.render();
      });
    }

    if (newProjBtn) {
      newProjBtn.addEventListener('click', () => {
        this.openNewProjectModal();
      });
    }
  }

  openProjectDrawer(projectId) {
    const p = dataStore.getProjectById(projectId);
    if (!p) return;

    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';
    const projectTasks = dataStore.getTasks().filter(t => t.projectId === projectId);
    const healthColor = p.health >= 90 ? '#10b981' : (p.health >= 75 ? '#f59e0b' : '#ef4444');

    const drawerContent = `
      <div class="project-drawer-container">
        <div class="grid grid-3" style="margin-bottom: 20px; gap:12px;">
          <div class="card stat-box" style="padding:14px;">
            <div class="stat-box-label">Total Budget</div>
            <div class="stat-box-value">${currency}${p.budget.toLocaleString()}</div>
          </div>
          <div class="card stat-box" style="padding:14px;">
            <div class="stat-box-label">Budget Burned</div>
            <div class="stat-box-value" style="color:#f59e0b;">${currency}${p.spent.toLocaleString()}</div>
          </div>
          <div class="card stat-box" style="padding:14px;">
            <div class="stat-box-label">Health Index</div>
            <div class="stat-box-value" style="color:${healthColor};">${p.health}%</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Project Description</label>
          <div class="deal-notes-box">${this.escapeHtml(p.description || 'No description provided.')}</div>
        </div>

        <!-- MILESTONES CHECKLIST -->
        <div class="section-divider" style="margin:20px 0;"></div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="font-size:14px; font-weight:700;">Milestones & Deliverables</h4>
          <span class="badge badge-info">${(p.milestones || []).filter(m => m.completed).length} / ${(p.milestones || []).length} Completed</span>
        </div>

        <div class="milestones-list" style="display:flex; flex-direction:column; gap:8px;">
          ${(p.milestones || []).map(m => `
            <div class="milestone-item ${m.completed ? 'milestone-done' : ''}" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--bg-card-hover); border-radius:8px;">
              <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px; font-weight:500;">
                <input type="checkbox" class="crm-checkbox milestone-checkbox" data-milestone-id="${m.id}" ${m.completed ? 'checked' : ''} />
                <span style="${m.completed ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${this.escapeHtml(m.title)}</span>
              </label>
              <span style="font-size:11px; color:var(--text-muted);">${m.dueDate}</span>
            </div>
          `).join('')}
        </div>

        <!-- LINKED TASKS -->
        <div class="section-divider" style="margin:20px 0;"></div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="font-size:14px; font-weight:700;">Active Tasks (${projectTasks.length})</h4>
          <button class="btn btn-sm btn-secondary" id="proj-add-task-btn">+ Add Task</button>
        </div>

        <div class="project-tasks-list" style="display:flex; flex-direction:column; gap:8px;">
          ${projectTasks.map(t => `
            <div class="task-list-item" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px;">
              <div>
                <div style="font-weight:600; font-size:13px;">${this.escapeHtml(t.title)}</div>
                <div style="font-size:11px; color:var(--text-muted);">Assignee: ${t.assignee?.name || 'Unassigned'} • Due: ${t.dueDate}</div>
              </div>
              <span class="badge badge-status badge-${t.status}">${t.status.toUpperCase()}</span>
            </div>
          `).join('')}
          ${projectTasks.length === 0 ? `<div style="font-size:12px; color:var(--text-muted);">No tasks linked yet.</div>` : ''}
        </div>

        <!-- DRAWER FOOTER ACTIONS -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:30px; padding-top:16px; border-top:1px solid var(--border-color);">
          <button class="btn btn-danger btn-sm" id="drawer-delete-proj-btn">Delete Portfolio</button>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-secondary btn-sm" id="drawer-edit-proj-btn">Edit Project</button>
          </div>
        </div>
      </div>
    `;

    modal.openDrawer({
      title: p.name,
      subtitle: `${p.code} • Client: ${p.accountName}`,
      content: drawerContent,
      onOpen: (el) => {
        // Milestone toggle
        const msCheckboxes = el.querySelectorAll('.milestone-checkbox');
        msCheckboxes.forEach(cb => {
          cb.addEventListener('change', () => {
            const mId = cb.getAttribute('data-milestone-id');
            dataStore.toggleMilestone(p.id, mId);
            toast.success('Milestone Updated', 'Progress updated automatically.');
            this.render();
          });
        });

        // Add task button
        const addTaskBtn = el.querySelector('#proj-add-task-btn');
        if (addTaskBtn) {
          addTaskBtn.addEventListener('click', () => {
            modal.closeDrawer();
            window.crmApp.openNewTaskModal(p.id);
          });
        }

        // Delete project
        const delBtn = el.querySelector('#drawer-delete-proj-btn');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            modal.confirm({
              title: `Delete ${p.code}?`,
              message: 'Are you sure you want to remove this project and its milestones?',
              onConfirm: () => {
                dataStore.deleteProject(p.id);
                modal.closeDrawer();
                toast.success('Project Deleted', 'The project portfolio was deleted.');
                this.render();
              }
            });
          });
        }

        // Edit project
        const editBtn = el.querySelector('#drawer-edit-proj-btn');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            modal.closeDrawer();
            this.openEditProjectModal(p);
          });
        }
      }
    });
  }

  openNewProjectModal() {
    const accounts = dataStore.getAccounts();
    const team = dataStore.getTeamMembers();

    const formHtml = `
      <form id="new-project-form">
        <div class="form-group">
          <label class="form-label required">Project Name</label>
          <input type="text" name="name" class="input" placeholder="e.g. Distributed Core Banking Modernization" required />
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Client Account</label>
            <select name="accountId" class="input" required>
              <option value="">-- Select Client --</option>
              ${accounts.map(a => `<option value="${a.id}">${this.escapeHtml(a.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Project Code</label>
            <input type="text" name="code" class="input" placeholder="PRJ-ABC-01" required />
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Total Budget ($)</label>
            <input type="number" name="budget" class="input" placeholder="180000" min="0" required />
          </div>
          <div class="form-group">
            <label class="form-label">Project Lead / Manager</label>
            <select name="managerId" class="input">
              ${team.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Start Date</label>
            <input type="date" name="startDate" class="input" required value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label class="form-label required">Target End Date</label>
            <input type="date" name="endDate" class="input" required value="${new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0]}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Scope & Description</label>
          <textarea name="description" class="input" rows="3" placeholder="Key deliverables, architecture components, and constraints..."></textarea>
        </div>
      </form>
    `;

    modal.openModal({
      title: 'Create Project Portfolio',
      content: formHtml,
      confirmText: 'Launch Project',
      onConfirm: (formData) => {
        if (!formData) return false;
        const accountId = formData.get('accountId');
        const account = accounts.find(a => a.id === accountId);
        const managerId = formData.get('managerId');
        const manager = team.find(u => u.id === managerId);

        const newPrj = {
          name: formData.get('name'),
          code: formData.get('code') || 'PRJ-' + Math.floor(100 + Math.random() * 900),
          accountId: accountId,
          accountName: account ? account.name : 'Client',
          budget: Number(formData.get('budget')) || 0,
          spent: 0,
          progress: 5,
          health: 95,
          status: 'on_track',
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate'),
          managerId: managerId,
          managerName: manager ? manager.name : 'Elena Rostova',
          description: formData.get('description'),
          milestones: [
            { id: 'm-new-1', title: 'Architecture Blueprint Sign-off', dueDate: formData.get('startDate'), completed: true },
            { id: 'm-new-2', title: 'Phase 1 MVP Release', dueDate: formData.get('endDate'), completed: false }
          ],
          teamMembers: ['usr-102', 'usr-103', 'usr-105']
        };

        dataStore.saveProject(newPrj);
        toast.success('Project Launched', `"${newPrj.name}" created successfully.`);
        this.render();
        return true;
      }
    });
  }

  openEditProjectModal(project) {
    const accounts = dataStore.getAccounts();
    const team = dataStore.getTeamMembers();

    const formHtml = `
      <form id="edit-project-form">
        <div class="form-group">
          <label class="form-label required">Project Name</label>
          <input type="text" name="name" class="input" value="${this.escapeHtml(project.name)}" required />
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Status</label>
            <select name="status" class="input" required>
              <option value="on_track" ${project.status === 'on_track' ? 'selected' : ''}>On Track</option>
              <option value="at_risk" ${project.status === 'at_risk' ? 'selected' : ''}>At Risk</option>
              <option value="delayed" ${project.status === 'delayed' ? 'selected' : ''}>Delayed</option>
              <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Progress (%)</label>
            <input type="number" name="progress" class="input" min="0" max="100" value="${project.progress}" required />
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Budget ($)</label>
            <input type="number" name="budget" class="input" value="${project.budget}" required />
          </div>
          <div class="form-group">
            <label class="form-label required">Spent ($)</label>
            <input type="number" name="spent" class="input" value="${project.spent}" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea name="description" class="input" rows="3">${this.escapeHtml(project.description || '')}</textarea>
        </div>
      </form>
    `;

    modal.openModal({
      title: 'Edit Project',
      content: formHtml,
      confirmText: 'Save Changes',
      onConfirm: (formData) => {
        if (!formData) return false;
        const updated = {
          ...project,
          name: formData.get('name'),
          status: formData.get('status'),
          progress: Number(formData.get('progress')) || 0,
          budget: Number(formData.get('budget')) || 0,
          spent: Number(formData.get('spent')) || 0,
          description: formData.get('description')
        };
        dataStore.saveProject(updated);
        toast.success('Changes Saved', `Updated ${updated.name}`);
        this.render();
        return true;
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
