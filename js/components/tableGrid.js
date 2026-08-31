/**
 * Enterprise Project CRM - Reusable High-Performance Table Grid Component
 * Features: Sorting, search filtering, batch selection, pagination, and CSV export.
 */

export class TableGrid {
  constructor(options = {}) {
    this.container = options.container;
    if (typeof this.container === 'string') {
      this.container = document.querySelector(this.container);
    }
    this.columns = options.columns || []; // [{ key: 'id', label: 'ID', sortable: true, render: fn }]
    this.data = options.data || [];
    this.filteredData = [...this.data];
    this.pageSize = options.pageSize || 10;
    this.currentPage = 1;
    this.sortKey = options.defaultSortKey || null;
    this.sortAsc = options.defaultSortAsc !== undefined ? options.defaultSortAsc : true;
    this.searchQuery = '';
    this.selectedIds = new Set();
    this.onRowClick = options.onRowClick || null;
    this.batchActions = options.batchActions || []; // [{ label: 'Delete', action: fn, class: 'btn-danger' }]
    this.emptyMessage = options.emptyMessage || 'No records found';
    this.idKey = options.idKey || 'id';

    this.render();
  }

  setData(newData) {
    this.data = newData || [];
    this.selectedIds.clear();
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.data];

    // Search query filter
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(item => {
        return this.columns.some(col => {
          const val = item[col.key];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Sorting
    if (this.sortKey) {
      result.sort((a, b) => {
        let valA = a[this.sortKey];
        let valB = b[this.sortKey];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return this.sortAsc ? valA - valB : valB - valA;
        }

        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
        if (valA < valB) return this.sortAsc ? -1 : 1;
        if (valA > valB) return this.sortAsc ? 1 : -1;
        return 0;
      });
    }

    this.filteredData = result;
    this.currentPage = 1;
    this.render();
  }

  render() {
    if (!this.container) return;

    const totalPages = Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pageItems = this.filteredData.slice(startIndex, startIndex + this.pageSize);
    const allPageSelected = pageItems.length > 0 && pageItems.every(item => this.selectedIds.has(item[this.idKey]));

    let html = `
      <div class="table-grid-wrapper">
        <div class="table-grid-toolbar">
          <div class="table-grid-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="input table-search-input" placeholder="Search records..." value="${this.escapeHtml(this.searchQuery)}" />
          </div>
          <div class="table-grid-actions">
            ${this.selectedIds.size > 0 ? `
              <div class="table-batch-menu animate-fade-in">
                <span class="batch-count-badge">${this.selectedIds.size} selected</span>
                ${this.batchActions.map((act, i) => `
                  <button class="btn btn-sm ${act.class || 'btn-secondary'} table-batch-btn" data-batch-index="${i}">
                    ${act.icon || ''} ${act.label}
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="table-container">
          <table class="table crm-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align:center;">
                  <input type="checkbox" class="crm-checkbox table-select-all" ${allPageSelected ? 'checked' : ''} />
                </th>
                ${this.columns.map(col => {
                  const isSorted = this.sortKey === col.key;
                  const sortIcon = isSorted ? (this.sortAsc ? '▲' : '▼') : '↕';
                  return `
                    <th class="${col.sortable !== false ? 'sortable' : ''} ${col.headerClass || ''}" data-col-key="${col.key}">
                      <div class="th-content">
                        <span>${col.label}</span>
                        ${col.sortable !== false ? `<span class="sort-icon ${isSorted ? 'active' : ''}">${sortIcon}</span>` : ''}
                      </div>
                    </th>
                  `;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${pageItems.length === 0 ? `
                <tr>
                  <td colspan="${this.columns.length + 1}" class="table-empty-cell">
                    <div class="table-empty-state">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <div>${this.emptyMessage}</div>
                    </div>
                  </td>
                </tr>
              ` : pageItems.map(item => {
                const isSelected = this.selectedIds.has(item[this.idKey]);
                return `
                  <tr class="table-row ${isSelected ? 'row-selected' : ''}" data-id="${item[this.idKey]}">
                    <td style="text-align:center;" onclick="event.stopPropagation()">
                      <input type="checkbox" class="crm-checkbox table-row-select" data-id="${item[this.idKey]}" ${isSelected ? 'checked' : ''} />
                    </td>
                    ${this.columns.map(col => {
                      let content = '';
                      if (col.render && typeof col.render === 'function') {
                        content = col.render(item[col.key], item);
                      } else {
                        content = this.escapeHtml(item[col.key] !== undefined ? item[col.key] : '');
                      }
                      return `<td class="${col.cellClass || ''}">${content}</td>`;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="table-grid-pagination">
          <div class="pagination-info">
            Showing <strong>${this.filteredData.length === 0 ? 0 : startIndex + 1}</strong> to <strong>${Math.min(startIndex + this.pageSize, this.filteredData.length)}</strong> of <strong>${this.filteredData.length}</strong> entries
          </div>
          <div class="pagination-controls">
            <button class="btn btn-sm btn-secondary btn-prev" ${this.currentPage <= 1 ? 'disabled' : ''}>Previous</button>
            <span class="pagination-page-indicator">Page ${this.currentPage} of ${totalPages}</span>
            <button class="btn btn-sm btn-secondary btn-next" ${this.currentPage >= totalPages ? 'disabled' : ''}>Next</button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    // Search input
    const searchInput = this.container.querySelector('.table-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.applyFilters();
      });
      // Keep focus if user is typing
      if (this.searchQuery) {
        searchInput.focus();
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
      }
    }

    // Sort headers
    const sortHeaders = this.container.querySelectorAll('th.sortable');
    sortHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-col-key');
        if (this.sortKey === key) {
          this.sortAsc = !this.sortAsc;
        } else {
          this.sortKey = key;
          this.sortAsc = true;
        }
        this.applyFilters();
      });
    });

    // Select all checkbox
    const selectAll = this.container.querySelector('.table-select-all');
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const pageItems = this.filteredData.slice(startIndex, startIndex + this.pageSize);
        if (e.target.checked) {
          pageItems.forEach(item => this.selectedIds.add(item[this.idKey]));
        } else {
          pageItems.forEach(item => this.selectedIds.delete(item[this.idKey]));
        }
        this.render();
      });
    }

    // Row selection checkboxes
    const rowCheckboxes = this.container.querySelectorAll('.table-row-select');
    rowCheckboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = cb.getAttribute('data-id');
        if (e.target.checked) {
          this.selectedIds.add(id);
        } else {
          this.selectedIds.delete(id);
        }
        this.render();
      });
    });

    // Row click handler
    if (this.onRowClick) {
      const rows = this.container.querySelectorAll('tbody tr.table-row');
      rows.forEach(tr => {
        tr.addEventListener('click', () => {
          const id = tr.getAttribute('data-id');
          const item = this.data.find(d => String(d[this.idKey]) === String(id));
          if (item) this.onRowClick(item);
        });
      });
    }

    // Pagination Previous / Next
    const prevBtn = this.container.querySelector('.btn-prev');
    const nextBtn = this.container.querySelector('.btn-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.render();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.render();
        }
      });
    }

    // Batch Actions
    const batchBtns = this.container.querySelectorAll('.table-batch-btn');
    batchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-batch-index'));
        const act = this.batchActions[idx];
        if (act && act.action) {
          const selectedItems = this.data.filter(d => this.selectedIds.has(d[this.idKey]));
          act.action(selectedItems, Array.from(this.selectedIds));
        }
      });
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
