/**
 * Enterprise Project CRM - Workflows & Automations Engine View Controller
 * Features: Visual Node Rule Builder (Trigger -> Condition -> Action),
 * Realtime Simulation Test Runner, Execution Counters, and Rule Creator.
 */

import { dataStore } from '../data/dataStore.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export class AutomationsView {
  constructor(container) {
    this.container = container;
  }

  render() {
    const automations = dataStore.getAutomations();
    const totalExecutions = automations.reduce((sum, a) => sum + (Number(a.executionCount) || 0), 0);
    const activeCount = automations.filter(a => a.isEnabled).length;

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Workflow Automation Engine</h1>
          <p class="view-subtitle">
            <strong>${activeCount}</strong> Active Rules • 
            Total Automated Triggers Fired: <strong style="color:var(--color-primary);">${totalExecutions.toLocaleString()}</strong>
          </p>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-primary" id="auto-new-rule-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Automation
          </button>
        </div>
      </div>

      <div class="automations-list" style="display:flex; flex-direction:column; gap:20px;">
        ${automations.map(rule => `
          <div class="card automation-rule-card ${!rule.isEnabled ? 'rule-disabled' : ''}">
            <!-- RULE HEADER -->
            <div class="rule-card-header">
              <div style="display:flex; align-items:center; gap:12px;">
                <div class="rule-icon-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <div>
                  <h3 class="rule-card-title">${this.escapeHtml(rule.name)}</h3>
                  <div class="rule-card-meta">
                    Fired <strong>${rule.executionCount || 0} times</strong> • 
                    Last triggered: <span>${rule.lastRun ? this.formatDate(rule.lastRun) : 'Never'}</span>
                  </div>
                </div>
              </div>

              <div style="display:flex; align-items:center; gap:14px;">
                <button class="btn btn-sm btn-secondary btn-test-rule" data-rule-id="${rule.id}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Simulate Trigger
                </button>
                <label class="switch-toggle" title="Enable / Disable Rule">
                  <input type="checkbox" class="rule-toggle-check" data-rule-id="${rule.id}" ${rule.isEnabled ? 'checked' : ''} />
                  <span class="switch-slider"></span>
                </label>
              </div>
            </div>

            <!-- VISUAL NODE DIAGRAM -->
            <div class="automation-node-flow">
              <!-- TRIGGER BLOCK -->
              <div class="node-block node-trigger">
                <div class="node-badge">1. TRIGGER</div>
                <div class="node-content">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>${this.escapeHtml(rule.triggerLabel || rule.trigger)}</span>
                </div>
              </div>

              <div class="node-arrow">→</div>

              <!-- CONDITION BLOCK -->
              <div class="node-block node-condition">
                <div class="node-badge">2. CONDITION</div>
                <div class="node-content">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  <span>${(rule.conditions || []).map(c => `${c.field} ${c.operator.replace('_', ' ')} ${c.value}`).join(' AND ') || 'Always execute'}</span>
                </div>
              </div>

              <div class="node-arrow">→</div>

              <!-- ACTIONS BLOCK -->
              <div class="node-block node-action">
                <div class="node-badge">3. ACTIONS (${(rule.actions || []).length})</div>
                <div class="node-content-list">
                  ${(rule.actions || []).map(a => `
                    <div class="node-action-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>${this.escapeHtml(a.label)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    const newBtn = this.container.querySelector('#auto-new-rule-btn');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        this.openNewAutomationModal();
      });
    }

    // Toggle switch
    const toggles = this.container.querySelectorAll('.rule-toggle-check');
    toggles.forEach(chk => {
      chk.addEventListener('change', () => {
        const id = chk.getAttribute('data-rule-id');
        const updated = dataStore.toggleAutomation(id);
        toast.info('Rule Updated', `Automation is now ${updated.isEnabled ? 'ACTIVE' : 'PAUSED'}.`);
        this.render();
      });
    });

    // Test simulation
    const testBtns = this.container.querySelectorAll('.btn-test-rule');
    testBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-rule-id');
        const automations = dataStore.getAutomations();
        const rule = automations.find(a => a.id === id);
        if (rule) {
          dataStore.triggerAutomations(rule.trigger, {
            deal: { id: 'deal-test', title: 'Enterprise Test Deal', amount: 95000, accountId: 'acc-001', accountName: 'Nexus BioHealth Technologies' },
            ticket: { id: 'tkt-test', priority: 'urgent', subject: 'Automated Test Simulation Ticket' }
          });
          toast.success('⚡ Simulation Succeeded', `Executed all ${(rule.actions || []).length} actions for "${rule.name}".`);
          this.render();
        }
      });
    });
  }

  openNewAutomationModal() {
    const formHtml = `
      <form id="new-automation-form">
        <div class="form-group">
          <label class="form-label required">Automation Name</label>
          <input type="text" name="name" class="input" placeholder="e.g. New Lead Inbound -> Send Slack Alert & Assign Rep" required />
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Trigger Event</label>
            <select name="trigger" class="input" required>
              <option value="deal_won">When Deal is moved to "Closed Won"</option>
              <option value="ticket_created">When Support Ticket is Created</option>
              <option value="invoice_overdue">When Invoice is Overdue > 7 days</option>
              <option value="milestone_completed">When Project Milestone is Completed</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Condition Filter</label>
            <input type="text" name="conditionValue" class="input" placeholder="e.g. Value > $50,000" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">Primary Automated Action</label>
          <select name="actionType" class="input" required>
            <option value="create_project">Create new Onboarding Project in Portfolio</option>
            <option value="create_task">Create Kickoff / Follow-up Tasks</option>
            <option value="notify_channel">Dispatch Alert to Slack / Microsoft Teams</option>
            <option value="update_account_status">Update Customer Health Score</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Action Description / Summary</label>
          <input type="text" name="actionLabel" class="input" placeholder="e.g. Auto-provision project and dispatch kickoff invites" required />
        </div>
      </form>
    `;

    modal.openModal({
      title: 'Create Workflow Automation',
      content: formHtml,
      confirmText: 'Save Automation',
      onConfirm: (formData) => {
        if (!formData) return false;
        const trigger = formData.get('trigger');
        const triggerLabel = formData.get('trigger') === 'deal_won' ? 'When Deal is moved to Closed Won' :
          (formData.get('trigger') === 'ticket_created' ? 'When Support Ticket is Created' : 'When Invoice is Overdue');

        const newRule = {
          name: formData.get('name'),
          trigger: trigger,
          triggerLabel: triggerLabel,
          conditions: [
            { field: 'deal.amount', operator: 'greater_than', value: '25000' }
          ],
          actions: [
            { type: formData.get('actionType'), label: formData.get('actionLabel') }
          ],
          isEnabled: true,
          executionCount: 0,
          lastRun: null
        };

        dataStore.saveAutomation(newRule);
        toast.success('Automation Saved', `"${newRule.name}" is now live.`);
        this.render();
        return true;
      }
    });
  }

  formatDate(isoStr) {
    if (!isoStr) return 'Never';
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
