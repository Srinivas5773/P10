/**
 * Enterprise Project CRM - Modal & Drawer Manager
 * Supports accessible dialogs, slide-over side drawers, confirmation prompts,
 * backdrop animations, and form validation bindings.
 */

class ModalManager {
  constructor() {
    this.activeModal = null;
    this.activeDrawer = null;
    this.init();
  }

  init() {
    // Listen for Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.activeModal) {
          this.closeModal();
        } else if (this.activeDrawer) {
          this.closeDrawer();
        }
      }
    });
  }

  /**
   * Opens a standard centered modal
   */
  openModal(options = {}) {
    const {
      title = 'Dialog',
      content = '',
      width = '640px',
      showFooter = true,
      confirmText = 'Save Changes',
      confirmClass = 'btn-primary',
      cancelText = 'Cancel',
      onConfirm = null,
      onOpen = null
    } = options;

    this.closeModal(false);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay animate-fade-in';
    overlay.id = 'crm-active-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal-dialog animate-scale-up';
    modal.style.maxWidth = width;

    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${this.escapeHtml(title)}</h3>
        <button class="modal-close-btn" aria-label="Close dialog">&times;</button>
      </div>
      <div class="modal-body">
        ${typeof content === 'string' ? content : ''}
      </div>
      ${showFooter ? `
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel-btn">${this.escapeHtml(cancelText)}</button>
          <button class="btn ${confirmClass} modal-confirm-btn">${this.escapeHtml(confirmText)}</button>
        </div>
      ` : ''}
    `;

    if (typeof content !== 'string' && content instanceof HTMLElement) {
      modal.querySelector('.modal-body').appendChild(content);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this.activeModal = overlay;
    document.body.classList.add('modal-open');

    // Event Listeners
    const closeBtn = modal.querySelector('.modal-close-btn');
    const cancelBtn = modal.querySelector('.modal-cancel-btn');
    const confirmBtn = modal.querySelector('.modal-confirm-btn');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal();
    });

    if (confirmBtn && onConfirm) {
      confirmBtn.addEventListener('click', async () => {
        const bodyEl = modal.querySelector('.modal-body');
        const form = bodyEl.querySelector('form');
        let formData = null;
        if (form) {
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }
          formData = new FormData(form);
        }
        const shouldClose = await onConfirm(formData, bodyEl);
        if (shouldClose !== false) {
          this.closeModal();
        }
      });
    }

    if (onOpen) {
      setTimeout(() => onOpen(modal.querySelector('.modal-body')), 50);
    }
  }

  closeModal(animate = true) {
    if (!this.activeModal) return;
    const overlay = this.activeModal;
    this.activeModal = null;
    document.body.classList.remove('modal-open');

    if (animate) {
      overlay.classList.add('animate-fade-out');
      setTimeout(() => {
        if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
      }, 200);
    } else {
      if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
    }
  }

  /**
   * Opens a slide-over side drawer (perfect for 360 views and details)
   */
  openDrawer(options = {}) {
    const {
      title = 'Details',
      subtitle = '',
      content = '',
      width = '680px',
      onOpen = null
    } = options;

    this.closeDrawer(false);

    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay animate-fade-in';
    overlay.id = 'crm-active-drawer-overlay';

    const drawer = document.createElement('div');
    drawer.className = 'drawer-panel animate-slide-left';
    drawer.style.maxWidth = width;

    drawer.innerHTML = `
      <div class="drawer-header">
        <div>
          <h3 class="drawer-title">${this.escapeHtml(title)}</h3>
          ${subtitle ? `<div class="drawer-subtitle">${this.escapeHtml(subtitle)}</div>` : ''}
        </div>
        <button class="drawer-close-btn" aria-label="Close drawer">&times;</button>
      </div>
      <div class="drawer-body">
        ${typeof content === 'string' ? content : ''}
      </div>
    `;

    if (typeof content !== 'string' && content instanceof HTMLElement) {
      drawer.querySelector('.drawer-body').appendChild(content);
    }

    overlay.appendChild(drawer);
    document.body.appendChild(overlay);
    this.activeDrawer = overlay;
    document.body.classList.add('modal-open');

    const closeBtn = drawer.querySelector('.drawer-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeDrawer());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeDrawer();
    });

    if (onOpen) {
      setTimeout(() => onOpen(drawer.querySelector('.drawer-body')), 50);
    }
  }

  closeDrawer(animate = true) {
    if (!this.activeDrawer) return;
    const overlay = this.activeDrawer;
    this.activeDrawer = null;
    document.body.classList.remove('modal-open');

    if (animate) {
      const panel = overlay.querySelector('.drawer-panel');
      if (panel) panel.classList.add('animate-slide-right');
      overlay.classList.add('animate-fade-out');
      setTimeout(() => {
        if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
      }, 250);
    } else {
      if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
    }
  }

  /**
   * Displays a confirmation prompt
   */
  confirm(options = {}) {
    const {
      title = 'Are you sure?',
      message = 'This action cannot be undone.',
      confirmText = 'Confirm',
      confirmClass = 'btn-danger',
      cancelText = 'Cancel',
      onConfirm = null
    } = options;

    this.openModal({
      title,
      width: '450px',
      content: `<p class="confirm-modal-message">${this.escapeHtml(message)}</p>`,
      confirmText,
      confirmClass,
      cancelText,
      onConfirm: async () => {
        if (onConfirm) await onConfirm();
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

export const modal = new ModalManager();
