/**
 * Enterprise Project CRM - Team Workload & Resource Allocation View Controller
 * Features: Member Profiles, Capacity Utilization Heatmaps, Billable Rate Breakdown,
 * Skill Matrices, and Resource Planning.
 */

import { dataStore } from '../data/dataStore.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export class TeamView {
  constructor(container) {
    this.container = container;
  }

  render() {
    const team = dataStore.getTeamMembers();
    const tasks = dataStore.getTasks();
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    const totalHoursAllocated = team.reduce((sum, u) => sum + (Number(u.currentLoad) || 0), 0);
    const avgLoad = Math.round((totalHoursAllocated / (team.length * 40)) * 100);

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Team Workload & Resource Capacity</h1>
          <p class="view-subtitle">
            <strong>${team.length}</strong> Active Specialists • 
            Total Weekly Logged: <strong>${totalHoursAllocated}h / ${team.length * 40}h</strong> • 
            Team Utilization: <strong style="color:var(--color-primary);">${avgLoad}%</strong>
          </p>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-primary" id="team-add-member-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Team Member
          </button>
        </div>
      </div>

      <!-- TEAM MEMBERS GRID -->
      <div class="grid grid-3" style="gap: 20px;">
        ${team.map(member => {
          const userTasks = tasks.filter(t => t.assigneeId === member.id && t.status !== 'completed');
          const utilizationPct = Math.round((member.currentLoad / member.capacityHours) * 100);
          const utilColor = utilizationPct > 100 ? '#ef4444' : (utilizationPct >= 80 ? '#f59e0b' : '#10b981');

          return `
            <div class="card team-member-card cursor-pointer animate-scale-up" data-member-id="${member.id}">
              <div class="team-card-header">
                <div style="display:flex; align-items:center; gap:12px;">
                  <span class="avatar-pill" style="width:44px; height:44px; font-size:16px;">${member.initials}</span>
                  <div>
                    <h3 class="team-member-name">${this.escapeHtml(member.name)}</h3>
                    <div class="team-member-role">${this.escapeHtml(member.role)}</div>
                  </div>
                </div>
                <span class="badge badge-status badge-${member.status === 'active' ? 'on_track' : (member.status === 'busy' ? 'at_risk' : 'delayed')}">${member.status.toUpperCase()}</span>
              </div>

              <!-- UTILIZATION BAR -->
              <div class="team-utilization-box">
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                  <span style="color:var(--text-muted);">Weekly Capacity</span>
                  <strong style="color:${utilColor};">${member.currentLoad}h / ${member.capacityHours}h (${utilizationPct}%)</strong>
                </div>
                <div class="progress-bar-wrapper">
                  <div class="progress-bar-fill" style="width:${Math.min(100, utilizationPct)}%; background:${utilColor};"></div>
                </div>
              </div>

              <div class="team-card-meta-grid">
                <div>
                  <div class="meta-label">Billable Rate</div>
                  <div class="meta-val">${currency}${member.hourlyRate}/hr</div>
                </div>
                <div>
                  <div class="meta-label">Department</div>
                  <div class="meta-val">${this.escapeHtml(member.department)}</div>
                </div>
                <div>
                  <div class="meta-label">Active Tasks</div>
                  <div class="meta-val">${userTasks.length}</div>
                </div>
              </div>

              <div class="team-skills-tags">
                ${(member.skills || []).map(sk => `<span class="tag-pill">${this.escapeHtml(sk)}</span>`).join('')}
              </div>

              <div class="team-card-footer">
                <span style="font-size:11px; color:var(--text-muted);">${member.email}</span>
                <button class="btn btn-sm btn-ghost view-member-btn" data-member-id="${member.id}">Profile →</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    const addBtn = this.container.querySelector('#team-add-member-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openAddMemberModal();
      });
    }

    const cards = this.container.querySelectorAll('[data-member-id]');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-member-id');
        this.openMemberProfileModal(id);
      });
    });
  }

  openMemberProfileModal(memberId) {
    const member = dataStore.getTeamMemberById(memberId);
    if (!member) return;

    const tasks = dataStore.getTasks().filter(t => t.assigneeId === memberId);
    const settings = dataStore.getSettings();
    const currency = settings.currencySymbol || '$';

    const content = `
      <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
        <span class="avatar-pill" style="width:60px; height:60px; font-size:22px;">${member.initials}</span>
        <div>
          <h3 style="margin:0; font-size:18px; color:var(--text-primary);">${this.escapeHtml(member.name)}</h3>
          <div style="font-size:13px; color:var(--text-muted);">${this.escapeHtml(member.role)} • <strong>${this.escapeHtml(member.department)}</strong></div>
          <div style="font-size:12px; color:var(--color-primary); margin-top:2px;">Rate: ${currency}${member.hourlyRate}/hour</div>
        </div>
      </div>

      <h4 style="font-size:14px; font-weight:700; margin-bottom:10px;">Assigned Active Tasks (${tasks.length})</h4>
      <div style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto;">
        ${tasks.map(t => `
          <div style="padding:10px 14px; background:var(--bg-card-hover); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:600; font-size:13px;">${this.escapeHtml(t.title)}</div>
              <div style="font-size:11px; color:var(--text-muted);">${this.escapeHtml(t.projectName)} • Due: ${t.dueDate}</div>
            </div>
            <span class="badge badge-status badge-${t.status}">${t.status.toUpperCase()}</span>
          </div>
        `).join('')}
        ${tasks.length === 0 ? '<div style="font-size:12px; color:var(--text-muted);">No tasks assigned right now.</div>' : ''}
      </div>
    `;

    modal.openModal({
      title: 'Specialist Workload Profile',
      content,
      confirmText: 'Done',
      cancelText: 'Close',
      onConfirm: () => true
    });
  }

  openAddMemberModal() {
    const formHtml = `
      <form id="new-member-form">
        <div class="form-group">
          <label class="form-label required">Full Name</label>
          <input type="text" name="name" class="input" placeholder="e.g. Jordan Blake" required />
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Department</label>
            <select name="department" class="input" required>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="Project Management">Project Management</option>
              <option value="Design">Design</option>
              <option value="Support">Support</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Job Title</label>
            <input type="text" name="role" class="input" placeholder="e.g. Cloud Security Architect" required />
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Work Email</label>
            <input type="email" name="email" class="input" placeholder="j.blake@apexflow.io" required />
          </div>
          <div class="form-group">
            <label class="form-label required">Hourly Rate ($)</label>
            <input type="number" name="hourlyRate" class="input" value="160" min="0" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Core Skills (comma separated)</label>
          <input type="text" name="skills" class="input" placeholder="Kubernetes, Python, Kafka, Security" />
        </div>
      </form>
    `;

    modal.openModal({
      title: 'Add Team Specialist',
      content: formHtml,
      confirmText: 'Add Member',
      onConfirm: (formData) => {
        if (!formData) return false;
        const skills = (formData.get('skills') || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

        const newMember = {
          name: formData.get('name'),
          department: formData.get('department'),
          role: formData.get('role'),
          email: formData.get('email'),
          hourlyRate: Number(formData.get('hourlyRate')) || 150,
          capacityHours: 40,
          currentLoad: 15,
          skills: skills.length > 0 ? skills : ['General Operations'],
          status: 'active'
        };

        dataStore.saveTeamMember(newMember);
        toast.success('Team Member Added', `Welcomed ${newMember.name} to the directory.`);
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
