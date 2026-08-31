/**
 * Enterprise Project CRM - Toast Notifications Manager
 * Multi-type alerts (success, info, warning, error) with auto-dismiss and progress bar.
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    let existing = document.getElementById('crm-toast-container');
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'crm-toast-container';
      existing.className = 'toast-container';
      document.body.appendChild(existing);
    }
    this.container = existing;
  }

  show(options = {}) {
    const {
      type = 'info', // 'success', 'error', 'warning', 'info'
      title = 'Notification',
      message = '',
      duration = 4000
    } = typeof options === 'string' ? { message: options } : options;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-in`;

    const iconMap = {
      success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
    };

    toast.innerHTML = `
      <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
      <div class="toast-content">
        <div class="toast-title">${this.escapeHtml(title)}</div>
        ${message ? `<div class="toast-message">${this.escapeHtml(message)}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close">&times;</button>
      <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    };

    closeBtn.addEventListener('click', dismiss);

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }

  success(title, message = '') {
    this.show({ type: 'success', title, message });
  }

  error(title, message = '') {
    this.show({ type: 'error', title, message, duration: 6000 });
  }

  warning(title, message = '') {
    this.show({ type: 'warning', title, message });
  }

  info(title, message = '') {
    this.show({ type: 'info', title, message });
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

export const toast = new ToastManager();
