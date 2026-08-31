/**
 * Enterprise Project CRM - Central Reactive DataStore
 * Handles LocalStorage persistence, state reactivity, CRUD APIs,
 * automation triggers, time tracking, CSV/JSON export, and global search.
 */

import { INITIAL_MOCK_DATA } from './mockData.js';

const STORAGE_KEY = 'APEXFLOW_CRM_DB_V1';

class DataStore {
  constructor() {
    this.subscribers = new Map();
    this.activeTimer = null;
    this.timerInterval = null;
    this.init();
  }

  init() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.data = JSON.parse(stored);
          ['settings', 'team', 'accounts', 'contacts', 'deals', 'projects', 'tasks', 'invoices', 'tickets', 'contracts', 'campaigns', 'knowledgeBase', 'automations', 'activities'].forEach(key => {
            if (!this.data[key]) {
              this.data[key] = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA[key] || []));
            }
          });
        } else {
          this.resetToDefaultData(false);
        }
      } else {
        this.resetToDefaultData(false);
      }
    } catch (e) {
      this.resetToDefaultData(false);
    }

    // Load active timer if any
    try {
      if (typeof localStorage !== 'undefined') {
        const storedTimer = localStorage.getItem(STORAGE_KEY + '_TIMER');
        if (storedTimer) {
          this.activeTimer = JSON.parse(storedTimer);
          if (this.activeTimer && this.activeTimer.isRunning) {
            this.resumeTimer();
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      // ignore
    }
  }

  // --- PUB/SUB EVENT SYSTEM ---
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);
    return () => {
      this.subscribers.get(event).delete(callback);
    };
  }

  notify(event, payload = {}) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in subscriber for event ${event}:`, err);
        }
      });
    }
    // Also notify global wildcard
    if (this.subscribers.has('*')) {
      this.subscribers.get('*').forEach(cb => {
        try {
          cb({ event, payload });
        } catch (err) {
          console.error('Error in wildcard subscriber:', err);
        }
      });
    }
  }

  // --- SETTINGS ---
  getSettings() {
    return { ...this.data.settings };
  }

  saveSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    this.notify('settings:updated', this.data.settings);
    this.logActivity({
      type: 'settings',
      action: 'Updated Settings',
      title: 'Company and system preferences updated',
      details: `Theme: ${this.data.settings.theme}, Currency: ${this.data.settings.defaultCurrency}`,
      icon: 'settings',
      color: '#6366f1'
    });
    return this.data.settings;
  }

  // --- ACCOUNTS (CLIENTS) ---
  getAccounts() {
    return [...this.data.accounts];
  }

  getAccountById(id) {
    return this.data.accounts.find(a => a.id === id) || null;
  }

  saveAccount(account) {
    let isNew = false;
    if (!account.id) {
      account.id = 'acc-' + String(Date.now()).slice(-6);
      account.createdAt = new Date().toISOString();
      account.logoBg = account.logoBg || this.getRandomColor();
      this.data.accounts.unshift(account);
      isNew = true;
    } else {
      const idx = this.data.accounts.findIndex(a => a.id === account.id);
      if (idx !== -1) {
        this.data.accounts[idx] = { ...this.data.accounts[idx], ...account };
      } else {
        this.data.accounts.unshift(account);
        isNew = true;
      }
    }
    this.save();
    this.notify('accounts:updated', account);
    this.logActivity({
      type: 'account',
      action: isNew ? 'Created Account' : 'Updated Account',
      title: `${isNew ? 'Added' : 'Updated'} company "${account.name}"`,
      details: `Tier: ${account.tier}, Health: ${account.healthScore || 85}%`,
      icon: 'briefcase',
      color: '#10b981'
    });
    return account;
  }

  deleteAccount(id) {
    const acc = this.getAccountById(id);
    this.data.accounts = this.data.accounts.filter(a => a.id !== id);
    this.save();
    this.notify('accounts:updated', { id, deleted: true });
    if (acc) {
      this.logActivity({
        type: 'account',
        action: 'Deleted Account',
        title: `Removed company "${acc.name}"`,
        details: `Account ID: ${id}`,
        icon: 'trash-2',
        color: '#ef4444'
      });
    }
  }

  getAccount360(accountId) {
    const account = this.getAccountById(accountId);
    if (!account) return null;
    const contacts = this.data.contacts.filter(c => c.accountId === accountId);
    const deals = this.data.deals.filter(d => d.accountId === accountId);
    const projects = this.data.projects.filter(p => p.accountId === accountId);
    const invoices = this.data.invoices.filter(i => i.accountId === accountId);
    const tickets = this.data.tickets.filter(t => t.accountId === accountId);

    const totalDealValue = deals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const wonDealValue = deals.filter(d => d.stage === 'closed_won').reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
    const totalOutstanding = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + (Number(i.total) || 0), 0);

    return {
      account,
      contacts,
      deals,
      projects,
      invoices,
      tickets,
      stats: {
        totalDealValue,
        wonDealValue,
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        activeProjectsCount: projects.filter(p => p.status !== 'completed').length,
        openTicketsCount: tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length
      }
    };
  }

  // --- CONTACTS ---
  getContacts() {
    return [...this.data.contacts];
  }

  getContactById(id) {
    return this.data.contacts.find(c => c.id === id) || null;
  }

  saveContact(contact) {
    let isNew = false;
    if (!contact.id) {
      contact.id = 'cnt-' + String(Date.now()).slice(-6);
      contact.initials = (contact.firstName?.[0] || '') + (contact.lastName?.[0] || '');
      contact.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.name || 'Unnamed';
      this.data.contacts.unshift(contact);
      isNew = true;
    } else {
      const idx = this.data.contacts.findIndex(c => c.id === contact.id);
      contact.initials = (contact.firstName?.[0] || '') + (contact.lastName?.[0] || '') || contact.initials;
      contact.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.name;
      if (idx !== -1) {
        this.data.contacts[idx] = { ...this.data.contacts[idx], ...contact };
      } else {
        this.data.contacts.unshift(contact);
        isNew = true;
      }
    }
    this.save();
    this.notify('contacts:updated', contact);
    this.logActivity({
      type: 'contact',
      action: isNew ? 'Created Contact' : 'Updated Contact',
      title: `${isNew ? 'Added' : 'Updated'} contact "${contact.name}"`,
      details: `${contact.title || 'Contact'} at ${contact.accountName || 'Company'}`,
      icon: 'user-plus',
      color: '#8b5cf6'
    });
    return contact;
  }

  deleteContact(id) {
    const cnt = this.getContactById(id);
    this.data.contacts = this.data.contacts.filter(c => c.id !== id);
    this.save();
    this.notify('contacts:updated', { id, deleted: true });
    if (cnt) {
      this.logActivity({
        type: 'contact',
        action: 'Deleted Contact',
        title: `Removed contact "${cnt.name}"`,
        details: `Contact ID: ${id}`,
        icon: 'user-minus',
        color: '#ef4444'
      });
    }
  }

  // --- DEALS / OPPORTUNITIES ---
  getDeals() {
    return [...this.data.deals];
  }

  getDealById(id) {
    return this.data.deals.find(d => d.id === id) || null;
  }

  saveDeal(deal) {
    let isNew = false;
    const stages = this.data.settings.pipelineStages;
    const stageObj = stages.find(s => s.id === deal.stage) || { probability: 50 };
    deal.probability = deal.probability !== undefined ? deal.probability : stageObj.probability;
    deal.amount = Number(deal.amount) || 0;
    deal.weightedAmount = Math.round((deal.amount * deal.probability) / 100);

    if (!deal.id) {
      deal.id = 'deal-' + String(Date.now()).slice(-6);
      deal.createdAt = new Date().toISOString();
      deal.history = [{
        date: new Date().toISOString().split('T')[0],
        stage: deal.stage,
        note: 'Opportunity created'
      }];
      this.data.deals.unshift(deal);
      isNew = true;
    } else {
      const idx = this.data.deals.findIndex(d => d.id === deal.id);
      if (idx !== -1) {
        const old = this.data.deals[idx];
        if (old.stage !== deal.stage) {
          deal.history = [...(old.history || []), {
            date: new Date().toISOString().split('T')[0],
            stage: deal.stage,
            note: `Stage transitioned from ${old.stage} to ${deal.stage}`
          }];
          if (deal.stage === 'closed_won') {
            deal.actualCloseDate = new Date().toISOString().split('T')[0];
            this.triggerAutomations('deal_won', { deal });
          }
        }
        this.data.deals[idx] = { ...old, ...deal };
      } else {
        this.data.deals.unshift(deal);
        isNew = true;
      }
    }
    this.save();
    this.notify('deals:updated', deal);
    this.logActivity({
      type: 'deal',
      action: isNew ? 'Created Deal' : 'Updated Deal',
      title: `${isNew ? 'Created' : 'Updated'} deal "${deal.title}"`,
      details: `Value: $${deal.amount.toLocaleString()} | Stage: ${deal.stage}`,
      icon: 'dollar-sign',
      color: deal.stage === 'closed_won' ? '#10b981' : '#6366f1'
    });
    return deal;
  }

  updateDealStage(dealId, newStage) {
    const deal = this.getDealById(dealId);
    if (!deal) return null;
    deal.stage = newStage;
    return this.saveDeal(deal);
  }

  deleteDeal(id) {
    const deal = this.getDealById(id);
    this.data.deals = this.data.deals.filter(d => d.id !== id);
    this.save();
    this.notify('deals:updated', { id, deleted: true });
    if (deal) {
      this.logActivity({
        type: 'deal',
        action: 'Deleted Deal',
        title: `Removed deal "${deal.title}"`,
        details: `Deal ID: ${id}`,
        icon: 'trash-2',
        color: '#ef4444'
      });
    }
  }

  getPipelineMetrics() {
    const deals = this.data.deals;
    const stages = this.data.settings.pipelineStages;

    let totalPipelineValue = 0;
    let weightedPipelineValue = 0;
    let wonValue = 0;
    let wonCount = 0;
    let lostCount = 0;
    let openCount = 0;

    const byStage = {};
    stages.forEach(s => {
      byStage[s.id] = { count: 0, totalAmount: 0, weightedAmount: 0, deals: [], stageInfo: s };
    });

    deals.forEach(d => {
      const amt = Number(d.amount) || 0;
      const wAmt = Number(d.weightedAmount) || 0;

      if (d.stage === 'closed_won') {
        wonValue += amt;
        wonCount++;
      } else if (d.stage === 'closed_lost') {
        lostCount++;
      } else {
        totalPipelineValue += amt;
        weightedPipelineValue += wAmt;
        openCount++;
      }

      if (byStage[d.stage]) {
        byStage[d.stage].count++;
        byStage[d.stage].totalAmount += amt;
        byStage[d.stage].weightedAmount += wAmt;
        byStage[d.stage].deals.push(d);
      }
    });

    const totalClosed = wonCount + lostCount;
    const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;
    const avgDealSize = wonCount > 0 ? Math.round(wonValue / wonCount) : (deals.length > 0 ? Math.round(totalPipelineValue / deals.length) : 0);

    return {
      totalPipelineValue,
      weightedPipelineValue,
      wonValue,
      wonCount,
      lostCount,
      openCount,
      winRate,
      avgDealSize,
      byStage
    };
  }

  // --- PROJECTS ---
  getProjects() {
    return [...this.data.projects];
  }

  getProjectById(id) {
    return this.data.projects.find(p => p.id === id) || null;
  }

  saveProject(project) {
    let isNew = false;
    project.budget = Number(project.budget) || 0;
    project.spent = Number(project.spent) || 0;
    project.progress = Number(project.progress) || 0;
    project.health = Number(project.health) || (project.status === 'delayed' ? 60 : (project.status === 'at_risk' ? 75 : 95));

    if (!project.id) {
      project.id = 'prj-' + String(Date.now()).slice(-6);
      project.code = project.code || 'PRJ-' + String(Math.floor(100 + Math.random() * 900));
      project.milestones = project.milestones || [];
      this.data.projects.unshift(project);
      isNew = true;
    } else {
      const idx = this.data.projects.findIndex(p => p.id === project.id);
      if (idx !== -1) {
        this.data.projects[idx] = { ...this.data.projects[idx], ...project };
      } else {
        this.data.projects.unshift(project);
        isNew = true;
      }
    }
    this.save();
    this.notify('projects:updated', project);
    this.logActivity({
      type: 'project',
      action: isNew ? 'Created Project' : 'Updated Project',
      title: `${isNew ? 'Launched' : 'Updated'} project "${project.name}"`,
      details: `Status: ${project.status} | Budget: $${project.budget.toLocaleString()} | Progress: ${project.progress}%`,
      icon: 'folder-plus',
      color: '#06b6d4'
    });
    return project;
  }

  toggleMilestone(projectId, milestoneId) {
    const prj = this.getProjectById(projectId);
    if (!prj || !prj.milestones) return null;
    const ms = prj.milestones.find(m => m.id === milestoneId);
    if (ms) {
      ms.completed = !ms.completed;
      // recalculate project progress based on completed milestones
      const total = prj.milestones.length;
      const completed = prj.milestones.filter(m => m.completed).length;
      if (total > 0) {
        prj.progress = Math.round((completed / total) * 100);
        if (prj.progress === 100) prj.status = 'completed';
      }
      this.saveProject(prj);
      if (ms.completed) {
        this.triggerAutomations('milestone_completed', { project: prj, milestone: ms });
      }
    }
    return prj;
  }

  deleteProject(id) {
    const prj = this.getProjectById(id);
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    this.save();
    this.notify('projects:updated', { id, deleted: true });
    if (prj) {
      this.logActivity({
        type: 'project',
        action: 'Deleted Project',
        title: `Removed project "${prj.name}"`,
        details: `Project Code: ${prj.code}`,
        icon: 'trash-2',
        color: '#ef4444'
      });
    }
  }

  // --- TASKS ---
  getTasks() {
    return [...this.data.tasks];
  }

  getTaskById(id) {
    return this.data.tasks.find(t => t.id === id) || null;
  }

  saveTask(task) {
    let isNew = false;
    task.estimatedHours = Number(task.estimatedHours) || 0;
    task.loggedHours = Number(task.loggedHours) || 0;
    task.subtasks = task.subtasks || [];
    task.tags = task.tags || [];

    if (!task.id) {
      task.id = 'tsk-' + String(Date.now()).slice(-6);
      this.data.tasks.unshift(task);
      isNew = true;
    } else {
      const idx = this.data.tasks.findIndex(t => t.id === task.id);
      if (idx !== -1) {
        this.data.tasks[idx] = { ...this.data.tasks[idx], ...task };
      } else {
        this.data.tasks.unshift(task);
        isNew = true;
      }
    }
    this.save();
    this.notify('tasks:updated', task);
    this.logActivity({
      type: 'task',
      action: isNew ? 'Created Task' : 'Updated Task',
      title: `${isNew ? 'Created' : 'Updated'} task "${task.title}"`,
      details: `Priority: ${task.priority} | Status: ${task.status}`,
      icon: 'check-square',
      color: '#3b82f6'
    });
    return task;
  }

  updateTaskStatus(taskId, newStatus) {
    const task = this.getTaskById(taskId);
    if (!task) return null;
    task.status = newStatus;
    return this.saveTask(task);
  }

  toggleSubtask(taskId, subtaskId) {
    const task = this.getTaskById(taskId);
    if (!task || !task.subtasks) return null;
    const st = task.subtasks.find(s => s.id === subtaskId);
    if (st) {
      st.done = !st.done;
      // If all subtasks done, optionally prompt or mark complete
      const allDone = task.subtasks.every(s => s.done);
      if (allDone && task.status !== 'completed') {
        task.status = 'review';
      }
      this.saveTask(task);
    }
    return task;
  }

  logTaskTime(taskId, additionalHours, note = '') {
    const task = this.getTaskById(taskId);
    if (!task) return null;
    task.loggedHours = (Number(task.loggedHours) || 0) + Number(additionalHours);
    this.saveTask(task);
    this.logActivity({
      type: 'task',
      action: 'Logged Time',
      title: `Logged ${additionalHours}h on "${task.title}"`,
      details: note || `Total logged: ${task.loggedHours}h`,
      icon: 'clock',
      color: '#10b981'
    });
    return task;
  }

  deleteTask(id) {
    const task = this.getTaskById(id);
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.save();
    this.notify('tasks:updated', { id, deleted: true });
    if (task) {
      this.logActivity({
        type: 'task',
        action: 'Deleted Task',
        title: `Removed task "${task.title}"`,
        details: `Task ID: ${id}`,
        icon: 'trash-2',
        color: '#ef4444'
      });
    }
  }

  // --- TIME TRACKER LIVE STOPWATCH ---
  startTimer(taskId, taskName = 'General Task') {
    if (this.activeTimer && this.activeTimer.isRunning) {
      this.pauseTimer();
    }
    this.activeTimer = {
      taskId,
      taskName,
      startTime: Date.now(),
      elapsedSeconds: this.activeTimer && this.activeTimer.taskId === taskId ? this.activeTimer.elapsedSeconds : 0,
      isRunning: true
    };
    this.saveTimer();
    this.resumeTimer();
    this.notify('timer:change', this.activeTimer);
  }

  resumeTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.activeTimer && this.activeTimer.isRunning) {
        this.activeTimer.elapsedSeconds++;
        this.saveTimer();
        this.notify('timer:tick', this.activeTimer);
      }
    }, 1000);
  }

  pauseTimer() {
    if (this.activeTimer) {
      this.activeTimer.isRunning = false;
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.saveTimer();
      this.notify('timer:change', this.activeTimer);
    }
  }

  stopAndLogTimer() {
    if (!this.activeTimer) return null;
    const hours = (this.activeTimer.elapsedSeconds / 3600).toFixed(2);
    if (this.timerInterval) clearInterval(this.timerInterval);

    if (Number(hours) > 0 && this.activeTimer.taskId) {
      this.logTaskTime(this.activeTimer.taskId, Number(hours), 'Logged via live stopwatch timer');
    }

    const recorded = { ...this.activeTimer, loggedHours: hours };
    this.activeTimer = null;
    localStorage.removeItem(STORAGE_KEY + '_TIMER');
    this.notify('timer:change', null);
    return recorded;
  }

  getTimerState() {
    return this.activeTimer;
  }

  saveTimer() {
    try {
      localStorage.setItem(STORAGE_KEY + '_TIMER', JSON.stringify(this.activeTimer));
    } catch (e) {
      console.warn('Failed to save timer:', e);
    }
  }

  // --- INVOICES ---
  getInvoices() {
    return [...this.data.invoices];
  }

  getInvoiceById(id) {
    return this.data.invoices.find(i => i.id === id) || null;
  }

  saveInvoice(invoice) {
    let isNew = false;
    invoice.items = invoice.items || [];
    invoice.subtotal = invoice.items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.unitPrice || 0)), 0);
    invoice.taxRate = Number(invoice.taxRate) || 0;
    invoice.taxAmount = (invoice.subtotal * invoice.taxRate) / 100;
    invoice.discount = Number(invoice.discount) || 0;
    invoice.total = Math.max(0, invoice.subtotal + invoice.taxAmount - invoice.discount);
    invoice.paidAmount = invoice.status === 'paid' ? invoice.total : (Number(invoice.paidAmount) || 0);

    if (!invoice.id) {
      invoice.id = 'inv-' + String(Date.now()).slice(-6);
      invoice.invoiceNumber = invoice.invoiceNumber || 'INV-2025-' + String(Math.floor(100 + Math.random() * 900));
      this.data.invoices.unshift(invoice);
      isNew = true;
    } else {
      const idx = this.data.invoices.findIndex(i => i.id === invoice.id);
      if (idx !== -1) {
        this.data.invoices[idx] = { ...this.data.invoices[idx], ...invoice };
      } else {
        this.data.invoices.unshift(invoice);
        isNew = true;
      }
    }
    this.save();
    this.notify('invoices:updated', invoice);
    this.logActivity({
      type: 'invoice',
      action: isNew ? 'Created Invoice' : 'Updated Invoice',
      title: `${isNew ? 'Generated' : 'Updated'} invoice ${invoice.invoiceNumber}`,
      details: `Total: $${invoice.total.toLocaleString()} | Status: ${invoice.status} | Client: ${invoice.accountName}`,
      icon: 'receipt',
      color: invoice.status === 'paid' ? '#10b981' : '#f59e0b'
    });
    return invoice;
  }

  markInvoicePaid(invoiceId, paymentMethod = 'Direct ACH / Wire') {
    const inv = this.getInvoiceById(invoiceId);
    if (!inv) return null;
    inv.status = 'paid';
    inv.paidAmount = inv.total;
    inv.paymentDate = new Date().toISOString().split('T')[0];
    inv.paymentMethod = paymentMethod;
    this.saveInvoice(inv);
    this.triggerAutomations('invoice_paid', { invoice: inv });
    return inv;
  }

  deleteInvoice(id) {
    const inv = this.getInvoiceById(id);
    this.data.invoices = this.data.invoices.filter(i => i.id !== id);
    this.save();
    this.notify('invoices:updated', { id, deleted: true });
    if (inv) {
      this.logActivity({
        type: 'invoice',
        action: 'Deleted Invoice',
        title: `Removed invoice ${inv.invoiceNumber}`,
        details: `Invoice ID: ${id}`,
        icon: 'trash-2',
        color: '#ef4444'
      });
    }
  }

  // --- SUPPORT TICKETS ---
  getTickets() {
    return [...this.data.tickets];
  }

  getTicketById(id) {
    return this.data.tickets.find(t => t.id === id) || null;
  }

  saveTicket(ticket) {
    let isNew = false;
    ticket.messages = ticket.messages || [];

    if (!ticket.id) {
      ticket.id = 'tkt-' + String(Date.now()).slice(-6);
      ticket.ticketNumber = ticket.ticketNumber || 'TKT-' + String(Math.floor(1000 + Math.random() * 9000));
      ticket.createdAt = new Date().toISOString();
      ticket.slaDeadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      this.data.tickets.unshift(ticket);
      isNew = true;
      this.triggerAutomations('ticket_created', { ticket });
    } else {
      const idx = this.data.tickets.findIndex(t => t.id === ticket.id);
      if (idx !== -1) {
        this.data.tickets[idx] = { ...this.data.tickets[idx], ...ticket };
      } else {
        this.data.tickets.unshift(ticket);
        isNew = true;
      }
    }
    this.save();
    this.notify('tickets:updated', ticket);
    this.logActivity({
      type: 'ticket',
      action: isNew ? 'Created Ticket' : 'Updated Ticket',
      title: `${isNew ? 'Opened' : 'Updated'} ticket ${ticket.ticketNumber}`,
      details: `${ticket.subject} | Priority: ${ticket.priority}`,
      icon: 'life-buoy',
      color: ticket.priority === 'urgent' ? '#ef4444' : '#3b82f6'
    });
    return ticket;
  }

  addTicketMessage(ticketId, message) {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) return null;
    message.id = 'msg-' + String(Date.now()).slice(-6);
    message.timestamp = new Date().toISOString();
    ticket.messages.push(message);
    if (message.senderType === 'agent' && ticket.status === 'open') {
      ticket.status = 'in_progress';
    }
    this.saveTicket(ticket);
    return ticket;
  }

  deleteTicket(id) {
    const tkt = this.getTicketById(id);
    this.data.tickets = this.data.tickets.filter(t => t.id !== id);
    this.save();
    this.notify('tickets:updated', { id, deleted: true });
    if (tkt) {
      this.logActivity({
        type: 'ticket',
        action: 'Deleted Ticket',
        title: `Removed ticket ${tkt.ticketNumber}`,
        details: `Ticket ID: ${id}`,
        icon: 'trash-2',
        color: '#ef4444'
      });
    }
  }

  // --- TEAM & RESOURCES ---
  getTeamMembers() {
    return [...this.data.team];
  }

  getTeamMemberById(id) {
    return this.data.team.find(u => u.id === id) || null;
  }

  saveTeamMember(member) {
    if (!member.id) {
      member.id = 'usr-' + String(Date.now()).slice(-4);
      member.initials = member.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
      this.data.team.push(member);
    } else {
      const idx = this.data.team.findIndex(u => u.id === member.id);
      member.initials = member.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
      if (idx !== -1) {
        this.data.team[idx] = { ...this.data.team[idx], ...member };
      } else {
        this.data.team.push(member);
      }
    }
    this.save();
    this.notify('team:updated', member);
    return member;
  }

  // --- AUTOMATIONS ENGINE ---
  getAutomations() {
    return [...this.data.automations];
  }

  saveAutomation(rule) {
    if (!rule.id) {
      rule.id = 'auto-' + String(Date.now()).slice(-4);
      rule.executionCount = 0;
      this.data.automations.push(rule);
    } else {
      const idx = this.data.automations.findIndex(a => a.id === rule.id);
      if (idx !== -1) {
        this.data.automations[idx] = { ...this.data.automations[idx], ...rule };
      } else {
        this.data.automations.push(rule);
      }
    }
    this.save();
    this.notify('automations:updated', rule);
    return rule;
  }

  toggleAutomation(id) {
    const rule = this.data.automations.find(a => a.id === id);
    if (rule) {
      rule.isEnabled = !rule.isEnabled;
      this.save();
      this.notify('automations:updated', rule);
    }
    return rule;
  }

  triggerAutomations(triggerType, payload) {
    const activeRules = this.data.automations.filter(a => a.isEnabled && a.trigger === triggerType);
    activeRules.forEach(rule => {
      // Execute condition check
      let matches = true;
      if (rule.conditions && rule.conditions.length > 0) {
        rule.conditions.forEach(cond => {
          const val = this.getNestedValue(payload, cond.field);
          if (cond.operator === 'greater_than') {
            if (!(Number(val) > Number(cond.value))) matches = false;
          } else if (cond.operator === 'equals') {
            if (String(val).toLowerCase() !== String(cond.value).toLowerCase()) matches = false;
          }
        });
      }

      if (matches) {
        rule.executionCount = (rule.executionCount || 0) + 1;
        rule.lastRun = new Date().toISOString();

        // Perform side-effects if applicable
        if (rule.trigger === 'deal_won' && payload.deal) {
          // auto-create project if rule has create_project action
          const hasCreateProject = rule.actions.some(a => a.type === 'create_project');
          if (hasCreateProject) {
            this.saveProject({
              name: `Client Onboarding: ${payload.deal.title}`,
              accountId: payload.deal.accountId,
              accountName: payload.deal.accountName,
              dealId: payload.deal.id,
              status: 'on_track',
              progress: 10,
              budget: payload.deal.amount,
              spent: 0,
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
              description: `Automated onboarding project spawned from Closed Won deal ${payload.deal.title}.`,
              milestones: [
                { id: 'm-auto-1', title: 'Executive Kickoff Call', dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0], completed: false },
                { id: 'm-auto-2', title: 'Technical Architecture Sign-off', dueDate: new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString().split('T')[0], completed: false }
              ]
            });
          }
        }

        this.logActivity({
          type: 'automation',
          action: 'Automation Executed',
          title: `Rule "${rule.name}" triggered`,
          details: `Trigger: ${rule.triggerLabel || rule.trigger} | Actions: ${rule.actions.length}`,
          icon: 'zap',
          color: '#ec4899'
        });
      }
    });
    this.save();
  }

  getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  // --- ACTIVITIES & AUDIT LOGS ---
  getActivities(limit = 50) {
    return [...this.data.activities].slice(0, limit);
  }

  logActivity(activity) {
    activity.id = 'act-' + String(Date.now()).slice(-6);
    activity.timestamp = activity.timestamp || new Date().toISOString();
    activity.user = activity.user || 'Alexander Sterling';
    activity.userInitials = activity.userInitials || 'AS';
    this.data.activities.unshift(activity);
    if (this.data.activities.length > 200) {
      this.data.activities.pop();
    }
    this.save();
    this.notify('activities:new', activity);
  }

  // --- GLOBAL SEARCH ---
  searchAll(query) {
    if (!query || query.trim().length === 0) return { total: 0, results: [] };
    const q = query.trim().toLowerCase();
    const results = [];

    // Search Accounts
    this.data.accounts.forEach(a => {
      if (a.name.toLowerCase().includes(q) || a.industry.toLowerCase().includes(q) || a.tier.toLowerCase().includes(q)) {
        results.push({ type: 'account', id: a.id, title: a.name, subtitle: `${a.industry} • ${a.tier}`, icon: 'briefcase', color: a.logoBg || '#6366f1' });
      }
    });

    // Search Contacts
    this.data.contacts.forEach(c => {
      if (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)) {
        results.push({ type: 'contact', id: c.id, title: c.name, subtitle: `${c.title} @ ${c.accountName}`, icon: 'user', color: '#8b5cf6' });
      }
    });

    // Search Deals
    this.data.deals.forEach(d => {
      if (d.title.toLowerCase().includes(q) || d.accountName.toLowerCase().includes(q) || d.stage.toLowerCase().includes(q)) {
        results.push({ type: 'deal', id: d.id, title: d.title, subtitle: `$${d.amount.toLocaleString()} • Stage: ${d.stage}`, icon: 'dollar-sign', color: '#10b981' });
      }
    });

    // Search Projects
    this.data.projects.forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.accountName.toLowerCase().includes(q)) {
        results.push({ type: 'project', id: p.id, title: `${p.code}: ${p.name}`, subtitle: `Status: ${p.status} • Progress: ${p.progress}%`, icon: 'folder', color: '#06b6d4' });
      }
    });

    // Search Tasks
    this.data.tasks.forEach(t => {
      if (t.title.toLowerCase().includes(q) || t.projectName.toLowerCase().includes(q) || t.priority.toLowerCase().includes(q)) {
        results.push({ type: 'task', id: t.id, title: t.title, subtitle: `${t.projectName} • Priority: ${t.priority}`, icon: 'check-square', color: '#3b82f6' });
      }
    });

    // Search Invoices
    this.data.invoices.forEach(i => {
      if (i.invoiceNumber.toLowerCase().includes(q) || i.accountName.toLowerCase().includes(q) || i.status.toLowerCase().includes(q)) {
        results.push({ type: 'invoice', id: i.id, title: `${i.invoiceNumber} - ${i.accountName}`, subtitle: `$${i.total.toLocaleString()} • ${i.status.toUpperCase()}`, icon: 'receipt', color: '#f59e0b' });
      }
    });

    // Search Tickets
    this.data.tickets.forEach(t => {
      if (t.ticketNumber.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.accountName.toLowerCase().includes(q)) {
        results.push({ type: 'ticket', id: t.id, title: `${t.ticketNumber}: ${t.subject}`, subtitle: `${t.accountName} • Priority: ${t.priority}`, icon: 'life-buoy', color: '#ef4444' });
      }
    });

    return { total: results.length, results: results.slice(0, 15) };
  }

  // --- DATA MANAGEMENT / IMPORT / EXPORT / RESET ---
  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.accounts && parsed.deals) {
        this.data = parsed;
        this.save();
        this.notify('*', { action: 'import' });
        return { success: true, message: 'Database imported successfully!' };
      }
      return { success: false, message: 'Invalid JSON format for CRM database.' };
    } catch (e) {
      return { success: false, message: 'JSON Parse Error: ' + e.message };
    }
  }

  resetToDefaultData(notifyUser = true) {
    this.data = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    this.save();
    if (notifyUser) {
      this.notify('*', { action: 'reset' });
      this.logActivity({
        type: 'system',
        action: 'Reset System',
        title: 'Database reset to default seed state',
        details: 'All collections re-seeded with initial mock records',
        icon: 'refresh-cw',
        color: '#6366f1'
      });
    }
  }

  exportCollectionCSV(collectionName) {
    const list = this.data[collectionName];
    if (!list || !Array.isArray(list) || list.length === 0) return '';
    const headers = Object.keys(list[0]).filter(k => typeof list[0][k] !== 'object');
    const rows = list.map(item => {
      return headers.map(h => {
        let val = item[h] !== undefined ? String(item[h]) : '';
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      }).join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }

  getRandomColor() {
    const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6', '#f97316'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export const dataStore = new DataStore();
