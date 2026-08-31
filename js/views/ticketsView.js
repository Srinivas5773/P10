/**
 * Enterprise Project CRM - Customer Support & SLA Helpdesk View Controller
 * Features: Split-Pane Ticket Desk, Live SLA Countdown Timers,
 * Client Messages vs Internal Private Notes, and Response Thread Composer.
 */

import { dataStore } from '../data/dataStore.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export class TicketsView {
  constructor(container) {
    this.container = container;
    this.selectedTicketId = null;
  }

  render() {
    const tickets = dataStore.getTickets();
    if (!this.selectedTicketId && tickets.length > 0) {
      this.selectedTicketId = tickets[0].id;
    }

    const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length;

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Support Desk & SLA Manager</h1>
          <p class="view-subtitle">
            <strong>${tickets.length}</strong> Total Tickets • 
            <strong>${openCount}</strong> Open / In Progress • 
            <strong style="color:var(--color-danger);">${urgentCount} Urgent SLA Escalations</strong>
          </p>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-primary" id="tkt-new-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Open Ticket
          </button>
        </div>
      </div>

      <!-- SPLIT VIEW DESK -->
      <div class="ticket-desk-layout">
        <!-- LEFT PANE: TICKET QUEUE -->
        <div class="card ticket-queue-pane">
          <div class="ticket-queue-header">
            <h3 style="font-size:14px; font-weight:700; margin:0;">Active Queue</h3>
            <span class="badge badge-info">${tickets.length} Tickets</span>
          </div>

          <div class="ticket-queue-list">
            ${tickets.map(t => {
              const isSelected = t.id === this.selectedTicketId;
              const isUrgent = t.priority === 'urgent' && t.status !== 'resolved';

              return `
                <div class="ticket-queue-item cursor-pointer ${isSelected ? 'ticket-selected' : ''}" data-tkt-id="${t.id}">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span class="ticket-id-tag">${t.ticketNumber}</span>
                    <span class="badge badge-priority badge-${t.priority}">${t.priority.toUpperCase()}</span>
                  </div>
                  <div class="ticket-item-subject">${this.escapeHtml(t.subject)}</div>
                  <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text-muted); margin-top:6px;">
                    <span>${this.escapeHtml(t.accountName)}</span>
                    <span class="badge badge-status badge-${t.status}">${t.status.toUpperCase()}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- RIGHT PANE: THREAD & COMPOSER -->
        <div class="card ticket-thread-pane" id="ticket-detail-container">
          <!-- Populated dynamically by renderSelectedTicket() -->
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.renderSelectedTicket();
    this.bindEvents();
  }

  renderSelectedTicket() {
    const threadContainer = this.container.querySelector('#ticket-detail-container');
    if (!threadContainer) return;

    const ticket = dataStore.getTicketById(this.selectedTicketId);
    if (!ticket) {
      threadContainer.innerHTML = '<div class="chart-empty">Select a ticket from the queue</div>';
      return;
    }

    let html = `
      <div class="ticket-thread-header">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span class="ticket-id-tag" style="font-size:13px;">${ticket.ticketNumber}</span>
            <span class="badge badge-priority badge-${ticket.priority}">${ticket.priority.toUpperCase()}</span>
            <span class="badge badge-status badge-${ticket.status}">${ticket.status.replace('_', ' ').toUpperCase()}</span>
          </div>
          <h2 class="ticket-thread-title">${this.escapeHtml(ticket.subject)}</h2>
          <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">
            <strong>${this.escapeHtml(ticket.contactName || 'Client')}</strong> (${this.escapeHtml(ticket.contactEmail || '')}) • 
            ${this.escapeHtml(ticket.accountName)} • 
            Assigned to <strong>${ticket.assignedUser?.name || 'Unassigned'}</strong>
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          ${ticket.status !== 'resolved' ? `
            <button class="btn btn-sm btn-success" id="tkt-resolve-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Resolve
            </button>
          ` : `
            <button class="btn btn-sm btn-secondary" id="tkt-reopen-btn">Reopen</button>
          `}
        </div>
      </div>

      <!-- MESSAGES THREAD -->
      <div class="ticket-messages-scroll" id="ticket-messages-scroll">
        ${(ticket.messages || []).map(msg => {
          const isClient = msg.senderType === 'client';
          const isInternal = msg.senderType === 'internal_note';

          return `
            <div class="ticket-message-block ${isInternal ? 'msg-internal-note' : (isClient ? 'msg-client' : 'msg-agent')}">
              <div class="msg-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <strong>${this.escapeHtml(msg.sender)}</strong>
                  ${isInternal ? `<span class="badge badge-warning" style="font-size:9px;">INTERNAL NOTE</span>` : ''}
                </div>
                <span class="msg-timestamp">${this.formatDate(msg.timestamp)}</span>
              </div>
              <div class="msg-body">${this.escapeHtml(msg.content)}</div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- REPLY COMPOSER -->
      <div class="ticket-reply-box">
        <div class="composer-type-toggle">
          <label style="display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; cursor:pointer;">
            <input type="radio" name="replyType" value="agent" checked /> Public Reply to Client
          </label>
          <label style="display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; cursor:pointer; color:#f59e0b;">
            <input type="radio" name="replyType" value="internal_note" /> Private Internal Team Note
          </label>
        </div>

        <textarea class="input ticket-composer-input" id="ticket-reply-text" rows="3" placeholder="Type your response or internal note..."></textarea>
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <div style="font-size:11px; color:var(--text-muted);">Supports instant multi-agent synchronization</div>
          <button class="btn btn-primary btn-sm" id="ticket-send-reply-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send Reply
          </button>
        </div>
      </div>
    `;

    threadContainer.innerHTML = html;
    this.scrollThreadToBottom();
    this.bindThreadEvents(ticket);
  }

  scrollThreadToBottom() {
    const scrollBox = this.container.querySelector('#ticket-messages-scroll');
    if (scrollBox) {
      scrollBox.scrollTop = scrollBox.scrollHeight;
    }
  }

  bindEvents() {
    // Ticket queue selection clicks
    const items = this.container.querySelectorAll('.ticket-queue-item');
    items.forEach(it => {
      it.addEventListener('click', () => {
        this.selectedTicketId = it.getAttribute('data-tkt-id');
        this.render();
      });
    });

    const newBtn = this.container.querySelector('#tkt-new-btn');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        this.openNewTicketModal();
      });
    }
  }

  bindThreadEvents(ticket) {
    const sendBtn = this.container.querySelector('#ticket-send-reply-btn');
    const replyInput = this.container.querySelector('#ticket-reply-text');
    const resolveBtn = this.container.querySelector('#tkt-resolve-btn');
    const reopenBtn = this.container.querySelector('#tkt-reopen-btn');

    if (sendBtn && replyInput) {
      sendBtn.addEventListener('click', () => {
        const text = replyInput.value.trim();
        if (!text) return;

        const replyTypeRadio = this.container.querySelector('input[name="replyType"]:checked');
        const replyType = replyTypeRadio ? replyTypeRadio.value : 'agent';

        const newMsg = {
          sender: replyType === 'internal_note' ? 'Alexander Sterling (Note)' : 'Alexander Sterling (Customer Success)',
          senderType: replyType,
          content: text
        };

        dataStore.addTicketMessage(ticket.id, newMsg);
        toast.success('Message Dispatched', replyType === 'internal_note' ? 'Internal note added.' : 'Reply sent to client.');
        this.renderSelectedTicket();
      });
    }

    if (resolveBtn) {
      resolveBtn.addEventListener('click', () => {
        ticket.status = 'resolved';
        dataStore.saveTicket(ticket);
        toast.success('Ticket Resolved', `${ticket.ticketNumber} marked as resolved.`);
        this.render();
      });
    }

    if (reopenBtn) {
      reopenBtn.addEventListener('click', () => {
        ticket.status = 'open';
        dataStore.saveTicket(ticket);
        toast.info('Ticket Reopened', `${ticket.ticketNumber} reopened.`);
        this.render();
      });
    }
  }

  openNewTicketModal() {
    const accounts = dataStore.getAccounts();
    const team = dataStore.getTeamMembers();

    const formHtml = `
      <form id="new-ticket-form">
        <div class="form-group">
          <label class="form-label required">Subject / Issue Title</label>
          <input type="text" name="subject" class="input" placeholder="e.g. Latency spike on endpoint /v2/tx/batch" required />
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label required">Client Account</label>
            <select name="accountId" class="input" required>
              ${accounts.map(a => `<option value="${a.id}">${this.escapeHtml(a.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Priority & SLA Tier</label>
            <select name="priority" class="input" required>
              <option value="urgent">Urgent (4h SLA)</option>
              <option value="high">High (8h SLA)</option>
              <option value="medium" selected>Medium (24h SLA)</option>
              <option value="low">Low (48h SLA)</option>
            </select>
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label class="form-label">Category</label>
            <select name="category" class="input">
              <option value="Bug / Outage">Bug / Outage</option>
              <option value="Technical Inquiry">Technical Inquiry</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Billing & Accounting">Billing & Accounting</option>
              <option value="Compliance & Legal">Compliance & Legal</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Assigned Specialist</label>
            <select name="assignedTo" class="input">
              ${team.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">Initial Client Message</label>
          <textarea name="initialMessage" class="input" rows="4" placeholder="Detailed reproduction steps, logs, or error descriptions..." required></textarea>
        </div>
      </form>
    `;

    modal.openModal({
      title: 'Open Support Ticket',
      content: formHtml,
      confirmText: 'Submit Ticket',
      onConfirm: (formData) => {
        if (!formData) return false;
        const accId = formData.get('accountId');
        const acc = accounts.find(a => a.id === accId);
        const assignedToId = formData.get('assignedTo');
        const user = team.find(u => u.id === assignedToId);

        const newTkt = {
          subject: formData.get('subject'),
          accountId: accId,
          accountName: acc ? acc.name : 'Client',
          priority: formData.get('priority'),
          category: formData.get('category'),
          status: 'open',
          assignedTo: assignedToId,
          assignedUser: user ? { name: user.name, initials: user.initials } : { name: 'Maya Patel', initials: 'MP' },
          messages: [
            {
              id: 'msg-init',
              sender: 'Client Support Portal',
              senderType: 'client',
              timestamp: new Date().toISOString(),
              content: formData.get('initialMessage')
            }
          ]
        };

        const saved = dataStore.saveTicket(newTkt);
        this.selectedTicketId = saved.id;
        toast.success('Ticket Opened', `Created ${saved.ticketNumber}`);
        this.render();
        return true;
      }
    });
  }

  formatDate(isoStr) {
    if (!isoStr) return '';
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
