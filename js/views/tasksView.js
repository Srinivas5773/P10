/**
 * Enterprise Project CRM - Tasks & Time Tracking View Controller
 * Features: Task Kanban Board with Drag & Drop, Eisenhower Priority Matrix,
 * List View, Subtasks Manager, and Live Time Tracking Stopwatch integration.
 */

import { dataStore } from '../data/dataStore.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { TableGrid } from '../components/tableGrid.js';

export class TasksView {
  constructor(container) {
    this.container = container;
    this.viewMode = 'kanban'; // 'kanban', 'matrix', 'table'
  }

  render() {
    const tasks = dataStore.getTasks();
    const settings = dataStore.getSettings();
    const statuses = settings.taskStatuses || [];

    const activeTimer = dataStore.getTimerState();

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Task & Delivery Management</h1>
          <p class="view-subtitle">
            <strong>${tasks.length}</strong> Tasks • 
            In Progress: <strong>${tasks.filter(t => t.status === 'in_progress').length}</strong> • 
            Completed: <strong style="color:var(--color-success);">${tasks.filter(t => t.status === 'completed').length}</strong>
          </p>
        </div>
        <div class="view-header-actions">
          <div class="view-mode-toggle">
            <button class="btn btn-sm ${this.viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}" id="tasks-toggle-kanban">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>
              Kanban
            </button>
            <button class="btn btn-sm ${this.viewMode === 'matrix' ? 'btn-primary' : 'btn-secondary'}" id="tasks-toggle-matrix">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Eisenhower Matrix
            </button>
            <button class="btn btn-sm ${this.viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}" id="tasks-toggle-table">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Table
            </button>
          </div>
          <button class="btn btn-primary" id="tasks-new-task-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Task
          </button>
        </div>
      </div>

      <!-- ACTIVE TIMER BANNER IF RUNNING -->
      ${activeTimer && activeTimer.isRunning ? `
        <div class="active-timer-banner animate-slide-in">
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="timer-pulse-dot"></span>
            <div>
              <strong style="color:var(--text-primary);">Timer Running:</strong>
              <span>${this.escapeHtml(activeTimer.taskName)}</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="timer-time-display" id="tasks-live-timer-counter">${this.formatDuration(activeTimer.elapsedSeconds)}</div>
            <button class="btn btn-sm btn-danger" id="tasks-stop-timer-btn">Stop & Log</button>
          </div>
        </div>
      ` : ''}

      <div id="tasks-view-content" class="animate-fade-in"></div>
    `;

    this.container.innerHTML = html;
    this.renderContent();
    this.bindHeaderEvents();
  }

  renderContent() {
    const contentEl = this.container.querySelector('#tasks-view-content');
    if (!contentEl) return;

    if (this.viewMode === 'kanban') {
      this.renderKanban(contentEl);
    } else if (this.viewMode === 'matrix') {
      this.renderMatrix(contentEl);
    } else {
      this.renderTable(contentEl);
    }
  }

  renderKanban(container) {
    const tasks = dataStore.getTasks();
    const settings = dataStore.getSettings();
    const statuses = settings.taskStatuses || [];

    let html = `
      <div class="kanban-board" id="tasks-kanban-board">
        ${statuses.map(st => {
          const colTasks = tasks.filter(t => t.status === st.id);

          return `
            <div class="kanban-column" data-task-status="${st.id}">
              <div class="kanban-column-header">
                <div class="kanban-column-title-wrap">
                  <span class="kanban-stage-indicator" style="background:${st.color};"></span>
                  <h4 class="kanban-column-title">${this.escapeHtml(st.name)}</h4>
                  <span class="kanban-count-pill">${colTasks.length}</span>
                </div>
              </div>

              <div class="kanban-cards-container" data-task-status="${st.id}">
                ${colTasks.map(t => {
                  const completedSubtasks = (t.subtasks || []).filter(s => s.done).length;
                  const totalSubtasks = (t.subtasks || []).length;
                  const isOverdue = t.status !== 'completed' && new Date(t.dueDate) < new Date();

                  return `
                    <div class="kanban-card cursor-grab animate-scale-up" draggable="true" data-task-id="${t.id}">
                      <div class="kanban-card-header">
                        <span class="badge badge-priority badge-${t.priority}">${t.priority.toUpperCase()}</span>
                        <span class="kanban-card-date ${isOverdue ? 'date-overdue' : ''}">
                          ${isOverdue ? '⚠️ ' : ''}${t.dueDate}
                        </span>
                      </div>

                      <div class="kanban-card-title">${this.escapeHtml(t.title)}</div>
                      
                      <div class="kanban-card-account">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        <span>${this.escapeHtml(t.projectName)}</span>
                      </div>

                      ${totalSubtasks > 0 ? `
                        <div class="task-checklist-preview">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                          <span>${completedSubtasks}/${totalSubtasks} subtasks</span>
                        </div>
                      ` : ''}

                      <div class="kanban-card-footer">
                        <div class="task-time-logged">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span>${t.loggedHours}h / ${t.estimatedHours}h</span>
                        </div>
                        <div class="avatar-pill" title="Assignee: ${t.assignee?.name || 'Unassigned'}">
                          ${t.assignee?.initials || 'UN'}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}

                ${colTasks.length === 0 ? `
                  <div class="kanban-empty-dropzone">Drop tasks here</div>
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

  renderMatrix(container) {
    const tasks = dataStore.getTasks().filter(t => t.status !== 'completed');

    const q1 = tasks.filter(t => (t.priority === 'urgent' || t.priority === 'high') && this.isDueSoon(t.dueDate));
    const q2 = tasks.filter(t => (t.priority === 'urgent' || t.priority === 'high') && !this.isDueSoon(t.dueDate));
    const q3 = tasks.filter(t => (t.priority === 'medium' || t.priority === 'low') && this.isDueSoon(t.dueDate));
    const q4 = tasks.filter(t => (t.priority === 'medium' || t.priority === 'low') && !this.isDueSoon(t.dueDate));

    let html = `
      <div class="matrix-grid">
        <!-- Q1: Urgent & Important (DO FIRST) -->
        <div class="card matrix-quadrant q1-border">
          <div class="matrix-header">
            <div>
              <h3 class="matrix-title" style="color:#ef4444;">Do First (Urgent & Critical)</h3>
              <p class="matrix-subtitle">Immediate deadlines and high business impact</p>
            </div>
            <span class="badge badge-danger">${q1.length} Tasks</span>
          </div>
          <div class="matrix-tasks-list">
            ${q1.map(t => this.renderMatrixTaskItem(t)).join('')}
            ${q1.length === 0 ? '<div class="matrix-empty">No urgent critical tasks</div>' : ''}
          </div>
        </div>

        <!-- Q2: Not Urgent but Important (SCHEDULE) -->
        <div class="card matrix-quadrant q2-border">
          <div class="matrix-header">
            <div>
              <h3 class="matrix-title" style="color:#3b82f6;">Schedule (Strategic & Important)</h3>
              <p class="matrix-subtitle">Long-term architecture, roadmaps & milestones</p>
            </div>
            <span class="badge badge-info">${q2.length} Tasks</span>
          </div>
          <div class="matrix-tasks-list">
            ${q2.map(t => this.renderMatrixTaskItem(t)).join('')}
            ${q2.length === 0 ? '<div class="matrix-empty">No strategic tasks</div>' : ''}
          </div>
        </div>

        <!-- Q3: Urgent but Low Importance (DELEGATE) -->
        <div class="card matrix-quadrant q3-border">
          <div class="matrix-header">
            <div>
              <h3 class="matrix-title" style="color:#f59e0b;">Delegate (Urgent / Support)</h3>
              <p class="matrix-subtitle">Quick requests, operational inquiries & minor fixes</p>
            </div>
            <span class="badge badge-warning">${q3.length} Tasks</span>
          </div>
          <div class="matrix-tasks-list">
            ${q3.map(t => this.renderMatrixTaskItem(t)).join('')}
            ${q3.length === 0 ? '<div class="matrix-empty">No delegated tasks</div>' : ''}
          </div>
        </div>

        <!-- Q4: Not Urgent & Low Importance (DON'T DO / BACKLOG) -->
        <div class="card matrix-quadrant q4-border">
          <div class="matrix-header">
            <div>
              <h3 class="matrix-title" style="color:#64748b;">Backlog (Low Priority)</h3>
              <p class="matrix-subtitle">Nice-to-have ideas and future optimizations</p>
            </div>
            <span class="badge badge-secondary">${q4.length} Tasks</span>
          </div>
          <div class="matrix-tasks-list">
            ${q4.map(t => this.renderMatrixTaskItem(t)).join('')}
            ${q4.length === 0 ? '<div class="matrix-empty">Backlog is clean</div>' : ''}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.bindCardClicks();
  }

  renderMatrixTaskItem(t) {
    return `
      <div class="matrix-task-card cursor-pointer" data-task-id="${t.id}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <strong style="font-size:13px; color:var(--text-primary);">${this.escapeHtml(t.title)}</strong>
          <span class="avatar-pill" style="width:22px; height:22px; font-size:10px;">${t.assignee?.initials || 'UN'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); margin-top:6px;">
          <span>${this.escapeHtml(t.projectName)}</span>
          <span>Due: ${t.dueDate}</span>
        </div>
      </div>
    `;
  }

  renderTable(container) {
    const tasks = dataStore.getTasks();

    container.innerHTML = '<div id="tasks-table-container"></div>';

    new TableGrid({
      container: '#tasks-table-container',
      data: tasks,
      pageSize: 10,
      defaultSortKey: 'dueDate',
      defaultSortAsc: true,
      columns: [
        {
          key: 'title',
          label: 'Task Title',
          sortable: true,
          render: (val, item) => `
            <div>
              <strong style="color:var(--text-primary); font-size:13px;">${this.escapeHtml(val)}</strong>
              <div style="font-size:11px; color:var(--text-muted);">${this.escapeHtml(item.projectName)}</div>
            </div>
          `
        },
        {
          key: 'priority',
          label: 'Priority',
          sortable: true,
          render: (val) => `<span class="badge badge-priority badge-${val}">${val.toUpperCase()}</span>`
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          render: (val) => `<span class="badge badge-status badge-${val}">${val.replace('_', ' ').toUpperCase()}</span>`
        },
        {
          key: 'dueDate',
          label: 'Due Date',
          sortable: true,
          render: (val, item) => {
            const isOverdue = item.status !== 'completed' && new Date(val) < new Date();
            return `<span style="font-weight:600; color:${isOverdue ? '#ef4444' : 'inherit'};">${val || 'TBD'}</span>`;
          }
        },
        {
          key: 'loggedHours',
          label: 'Logged / Est',
          sortable: true,
          render: (val, item) => `<span>${val}h / ${item.estimatedHours}h</span>`
        },
        {
          key: 'assignee',
          label: 'Assignee',
          sortable: true,
          render: (val) => `
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="avatar-pill">${val?.initials || 'UN'}</span>
              <span>${val?.name || 'Unassigned'}</span>
            </div>
          `
        }
      ],
      onRowClick: (t) => {
        this.openTaskDrawer(t.id);
      }
    });
  }

  initDragAndDrop() {
    const cards = this.container.querySelectorAll('.kanban-card');
    const containers = this.container.querySelectorAll('.kanban-cards-container');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('is-dragging');
        e.dataTransfer.setData('text/plain', card.getAttribute('data-task-id'));
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
        const taskId = e.dataTransfer.getData('text/plain');
        const targetStatus = dropzone.getAttribute('data-task-status');

        if (taskId && targetStatus) {
          const updated = dataStore.updateTaskStatus(taskId, targetStatus);
          if (updated) {
            toast.success('Task Status', `"${updated.title}" moved to ${targetStatus.replace('_', ' ').toUpperCase()}`);
            this.render();
          }
        }
      });
    });
  }

  bindCardClicks() {
    const cards = this.container.querySelectorAll('[data-task-id]');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-task-id');
        this.openTaskDrawer(id);
      });
    });
  }

  bindHeaderEvents() {
    const toggleKanban = this.container.querySelector('#tasks-toggle-kanban');
    const toggleMatrix = this.container.querySelector('#tasks-toggle-matrix');
    const toggleTable = this.container.querySelector('#tasks-toggle-table');
    const newTaskBtn = this.container.querySelector('#tasks-new-task-btn');
    const stopTimerBtn = this.container.querySelector('#tasks-stop-timer-btn');

    if (toggleKanban) toggleKanban.addEventListener('click', () => { this.viewMode = 'kanban'; this.render(); });
    if (toggleMatrix) toggleMatrix.addEventListener('click', () => { this.viewMode = 'matrix'; this.render(); });
    if (toggleTable) toggleTable.addEventListener('click', () => { this.viewMode = 'table'; this.render(); });
    if (newTaskBtn) newTaskBtn.addEventListener('click', () => this.openNewTaskModal());

    if (stopTimerBtn) {
      stopTimerBtn.addEventListener('click', () => {
        const logged = dataStore.stopAndLogTimer();
        toast.success('Time Logged', `Recorded ${logged.loggedHours} hours to task.`);
        this.render();
      });
    }
  }

  openTaskDrawer(taskId) {
    const task = dataStore.getTaskById(taskId);
    if (!task) return;

    const drawerContent = `
      <div class="task-drawer-container">
        <!-- TIME TRACKER BAR -->
        <div class="task-stopwatch-box">
          <div>
            <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Live Stopwatch</div>
            <div style="font-size:18px; font-weight:700; color:var(--text-primary);">${task.loggedHours}h Logged (${task.estimatedHours}h Est.)</div>
          </div>
          <button class="btn btn-sm btn-primary" id="drawer-start-timer-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
            Start Timer
          </button>
        </div>

        <div class="form-group-row" style="margin-top:16px;">
          <div class="form-group">
            <label class="form-label">Project Portfolio</label>
            <div class="readonly-pill">${this.escapeHtml(task.projectName)}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <div class="readonly-pill">${task.status.replace('_', ' ').toUpperCase()}</div>
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Priority</label>
            <div class="readonly-pill">${task.priority.toUpperCase()}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Due Date</label>
            <div class="readonly-pill">${task.dueDate || 'TBD'}</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Task Details</label>
          <div class="deal-notes-box">${this.escapeHtml(task.description || 'No description.')}</div>
        </div>

        <!-- SUBTASKS CHECKLIST -->
        <div class="section-divider" style="margin:20px 0;"></div>
        <h4 style="font-size:14px; font-weight:700; margin-bottom:12px;">Subtasks Checklist (${(task.subtasks || []).filter(s => s.done).length}/${(task.subtasks || []).length})</h4>
        <div class="subtasks-list" style="display:flex; flex-direction:column; gap:8px;">
          ${(task.subtasks || []).map(st => `
            <div class="subtask-row" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--bg-card-hover); border-radius:8px;">
              <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px; font-weight:500;">
                <input type="checkbox" class="crm-checkbox subtask-check" data-subtask-id="${st.id}" ${st.done ? 'checked' : ''} />
                <span style="${st.done ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${this.escapeHtml(st.title)}</span>
              </label>
            </div>
          `).join('')}
          ${(!task.subtasks || task.subtasks.length === 0) ? '<div style="font-size:12px; color:var(--text-muted);">No subtasks defined.</div>' : ''}
        </div>

        <!-- FOOTER ACTIONS -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:30px; padding-top:16px; border-top:1px solid var(--border-color);">
          <button class="btn btn-danger btn-sm" id="drawer-delete-task-btn">Delete Task</button>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-secondary btn-sm" id="drawer-edit-task-btn">Edit Task</button>
          </div>
        </div>
      </div>
    `;

    modal.openDrawer({
      title: task.title,
      subtitle: `${task.projectName} • Assignee: ${task.assignee?.name || 'Unassigned'}`,
      content: drawerContent,
      onOpen: (el) => {
        // Subtask toggles
        const checks = el.querySelectorAll('.subtask-check');
        checks.forEach(cb => {
          cb.addEventListener('change', () => {
            const sId = cb.getAttribute('data-subtask-id');
            dataStore.toggleSubtask(task.id, sId);
            toast.success('Subtask Updated', 'Checklist state updated.');
            this.render();
          });
        });

        // Start stopwatch timer
        const timerBtn = el.querySelector('#drawer-start-timer-btn');
        if (timerBtn) {
          timerBtn.addEventListener('click', () => {
            dataStore.startTimer(task.id, task.title);
            modal.closeDrawer();
            toast.info('⏱️ Stopwatch Started', `Tracking time on "${task.title}".`);
            this.render();
          });
        }

        // Delete task
        const delBtn = el.querySelector('#drawer-delete-task-btn');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            modal.confirm({
              title: `Delete Task "${task.title}"?`,
              message: 'Are you sure you want to remove this task?',
              onConfirm: () => {
                dataStore.deleteTask(task.id);
                modal.closeDrawer();
                toast.success('Task Deleted', 'The task was removed.');
                this.render();
              }
            });
          });
        }

        // Edit task
        const editBtn = el.querySelector('#drawer-edit-task-btn');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            modal.closeDrawer();
            this.openEditTaskModal(task);
          });
        }
      }
    });
  }

  openNewTaskModal(preselectedProjectId = null) {
    const projects = dataStore.getProjects();
    const team = dataStore.getTeamMembers();

    const formHtml = `
      <form id="new-task-form">
        <div class="form-group">
          <label class="form-label required">Task Title</label>
          <input type="text" name="title" class="input" placeholder="e.g. Implement Kafka Failover Recovery Routine" required />
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Project Portfolio</label>
            <select name="projectId" class="input" required>
              ${projects.map(p => `<option value="${p.id}" ${p.id === preselectedProjectId ? 'selected' : ''}>${this.escapeHtml(p.code)}: ${this.escapeHtml(p.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Priority</label>
            <select name="priority" class="input" required>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Assignee</label>
            <select name="assigneeId" class="input">
              ${team.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Due Date</label>
            <input type="date" name="dueDate" class="input" required value="${new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]}" />
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Estimated Hours</label>
            <input type="number" name="estimatedHours" class="input" value="8" min="1" />
          </div>
          <div class="form-group">
            <label class="form-label">Initial Status</label>
            <select name="status" class="input">
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="backlog">Backlog</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Description & Acceptance Criteria</label>
          <textarea name="description" class="input" rows="3" placeholder="Technical specifications and testing requirements..."></textarea>
        </div>
      </form>
    `;

    modal.openModal({
      title: 'Create Delivery Task',
      content: formHtml,
      confirmText: 'Create Task',
      onConfirm: (formData) => {
        if (!formData) return false;
        const prjId = formData.get('projectId');
        const prj = projects.find(p => p.id === prjId);
        const assigneeId = formData.get('assigneeId');
        const user = team.find(u => u.id === assigneeId);

        const newTask = {
          title: formData.get('title'),
          projectId: prjId,
          projectName: prj ? prj.name : 'Project',
          status: formData.get('status') || 'todo',
          priority: formData.get('priority') || 'medium',
          assigneeId: assigneeId,
          assignee: user ? { name: user.name, initials: user.initials, avatar: user.avatar } : { name: 'Devon Wright', initials: 'DW' },
          dueDate: formData.get('dueDate'),
          estimatedHours: Number(formData.get('estimatedHours')) || 8,
          loggedHours: 0,
          description: formData.get('description'),
          subtasks: [
            { id: 'st-new-1', title: 'Technical Architecture Review', done: false },
            { id: 'st-new-2', title: 'Unit Tests and Code Coverage Sign-off', done: false }
          ],
          tags: ['Feature', 'Sprint 1']
        };

        dataStore.saveTask(newTask);
        toast.success('Task Created', `"${newTask.title}" added to board.`);
        this.render();
        return true;
      }
    });
  }

  openEditTaskModal(task) {
    const projects = dataStore.getProjects();
    const team = dataStore.getTeamMembers();

    const formHtml = `
      <form id="edit-task-form">
        <div class="form-group">
          <label class="form-label required">Task Title</label>
          <input type="text" name="title" class="input" value="${this.escapeHtml(task.title)}" required />
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Status</label>
            <select name="status" class="input" required>
              <option value="backlog" ${task.status === 'backlog' ? 'selected' : ''}>Backlog</option>
              <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
              <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="review" ${task.status === 'review' ? 'selected' : ''}>Review</option>
              <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Priority</label>
            <select name="priority" class="input" required>
              <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
              <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
              <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
            </select>
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Assignee</label>
            <select name="assigneeId" class="input">
              ${team.map(u => `<option value="${u.id}" ${u.id === task.assigneeId ? 'selected' : ''}>${u.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Due Date</label>
            <input type="date" name="dueDate" class="input" value="${task.dueDate || ''}" required />
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Estimated Hours</label>
            <input type="number" name="estimatedHours" class="input" value="${task.estimatedHours}" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Logged Hours</label>
            <input type="number" name="loggedHours" class="input" value="${task.loggedHours}" step="0.5" min="0" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea name="description" class="input" rows="3">${this.escapeHtml(task.description || '')}</textarea>
        </div>
      </form>
    `;

    modal.openModal({
      title: 'Edit Task',
      content: formHtml,
      confirmText: 'Save Changes',
      onConfirm: (formData) => {
        if (!formData) return false;
        const assigneeId = formData.get('assigneeId');
        const user = team.find(u => u.id === assigneeId);

        const updated = {
          ...task,
          title: formData.get('title'),
          status: formData.get('status'),
          priority: formData.get('priority'),
          dueDate: formData.get('dueDate'),
          estimatedHours: Number(formData.get('estimatedHours')) || 0,
          loggedHours: Number(formData.get('loggedHours')) || 0,
          description: formData.get('description'),
          assigneeId: assigneeId,
          assignee: user ? { name: user.name, initials: user.initials, avatar: user.avatar } : task.assignee
        };

        dataStore.saveTask(updated);
        toast.success('Changes Saved', `Updated "${updated.title}"`);
        this.render();
        return true;
      }
    });
  }

  isDueSoon(dateStr) {
    if (!dateStr) return false;
    const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 3600 * 24);
    return diff <= 5; // due within 5 days
  }

  formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
