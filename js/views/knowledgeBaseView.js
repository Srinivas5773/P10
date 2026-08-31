/**
 * Enterprise Project CRM - Knowledge Base & Technical Documentation View Controller
 */

import { dataStore } from '../data/dataStore.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export class KnowledgeBaseView {
  constructor(container) {
    this.container = container;
  }

  render() {
    const articles = dataStore.data.knowledgeBase || [];

    let html = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Knowledge Base & Engineering Runbooks</h1>
          <p class="view-subtitle">Technical standard operating procedures, architectural guides, and API integration manuals</p>
        </div>
      </div>

      <div class="kb-hero-search">
        <h2 style="font-size:20px; font-weight:800; color:var(--text-primary);">How can we assist your implementation?</h2>
        <div class="kb-search-input-wrap">
          <input type="text" class="input" placeholder="Search technical runbooks, microservices guides, compliance SOPs..." />
        </div>
      </div>

      <div class="grid grid-3" style="gap:20px;">
        ${articles.map(art => `
          <div class="card kb-article-card cursor-pointer" data-kb-id="${art.id}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span class="badge badge-info">${art.category}</span>
              <span style="font-size:11px; color:var(--text-muted);">${art.viewsCount} views</span>
            </div>
            <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin-bottom:6px; line-height:1.4;">${this.escapeHtml(art.title)}</h3>
            <p style="font-size:12px; color:var(--text-muted); line-height:1.5;">${this.escapeHtml(art.summary)}</p>
            <div style="font-size:11px; color:var(--text-muted); margin-top:14px; padding-top:8px; border-top:1px solid var(--border-color);">
              By ${art.author} • Updated ${art.lastUpdated}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.container.innerHTML = html;
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
