# ApexFlow Enterprise - Project & Client CRM Suite

An enterprise-grade, comprehensive Project & Client CRM application built with modern web technologies, full-stack state persistence, interactive SVG visualization engines, and zero external API dependencies.

---

## 📋 Table of Contents
- [Architecture Overview](#architecture-overview)
- [Requirements & Prerequisites](#requirements--prerequisites)
- [Installation](#installation)
- [Dependencies](#dependencies)
- [Build](#build)
- [Run](#run)
- [Testing](#testing)
- [Usage Guide](#usage-guide)
- [Modules & Capabilities](#modules--capabilities)
- [Project Structure](#project-structure)
- [License](#license)

---

## 🏗️ Architecture Overview

ApexFlow Enterprise CRM is engineered with a modular, decoupled architecture:
- **Core State & Persistence Layer**: Reactive pub/sub state store with LocalStorage / IndexedDB synchronization and audit logging.
- **Computation & Business Logic Engines**: Financial forecasting, weighted pipeline calculations, tax engines, and time-tracking accumulators.
- **Visualization & UI Engines**: 100% self-contained pure SVG & Canvas charting library (Area, Bar, Donut, Funnel, and Gantt charts).
- **Interactive UI Components**: Drag-and-drop Kanban boards, sortable/filterable DataGrids, slide-over 360° side drawers, and `Ctrl+K` command palette.

---

## ⚙️ Requirements & Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **NPM**: Version 9.0.0 or higher
- **Modern Web Browser**: Chrome 100+, Edge 100+, Firefox 100+, Safari 16+

---

## 📦 Installation

To install and initialize the project dependencies, execute:

```bash
# Clone or navigate to the repository directory
cd Project-CRM

# Install package dependencies
npm install
```

---

## 📚 Dependencies

The project is configured with zero runtime bloat and uses standard Node.js development tooling:

```json
{
  "name": "apexflow-project-crm",
  "version": "2.4.0",
  "private": true,
  "devDependencies": {
    "eslint": "^9.0.0",
    "http-server": "^14.1.1",
    "jest": "^29.7.0"
  }
}
```

---

## 🔨 Build

To validate, lint, and compile the production bundle:

```bash
# Run linting and validation
npm run lint

# Build production bundle and standalone distribution
npm run build
```

---

## 🚀 Run

You can launch ApexFlow CRM using any of the following methods:

### Method 1: NPM Scripts (Recommended)
```bash
npm start
```
Then navigate to `http://localhost:8080` in your web browser.

### Method 2: Python 3 Built-in Server
```bash
python -m http.server 8080
```

### Method 3: Docker Container
```bash
docker build -t apexflow-crm .
docker run -p 8080:80 apexflow-crm
```

### Method 4: 1-Click Desktop Launcher
Double-click `run_crm.bat` or open `index.html` / `crm-standalone.html` directly.

---

## 🧪 Testing

Execute the comprehensive automated test suite:

```bash
# Run all unit and integration tests
npm test

# Run tests with coverage reporting
npm run test:coverage
```

Test suites cover:
- State store CRUD and event bus reactivity
- Financial calculation and tax math precision
- Schema validation and sanitization
- Search engine inverted index indexing and fuzzy matching
- Workflow automation rule execution and rollback

---

## 📖 Usage Guide

- **Command Palette**: Press `Ctrl + K` (or `Cmd + K` on macOS) to instantly search across accounts, deals, projects, tasks, invoices, and tickets.
- **Sales Pipeline**: Navigate to *Deals & Pipeline* and drag cards between stage columns (*Lead, Contact Made, Demo/Proposal, Negotiation, Closed Won, Closed Lost*).
- **Interactive Gantt**: Open *Projects & Timeline* to view milestone deliverables, project duration bars, and progress percentages.
- **Time Tracking**: Use the live stopwatch in *Tasks & Delivery* to log billable hours directly against client projects.
- **Invoice Generator**: Use *Invoices & Billing* to generate itemized invoices with live tax/discount calculations and click *Print / PDF* to export.

---

## 🌟 Modules & Capabilities

1. **Executive Dashboard**: Real-time KPI metrics, revenue charts, funnel conversion, and activity audit feed.
2. **Deals & Sales Pipeline**: Drag-and-drop Kanban board with probability calculation and 360° Deal Drawer.
3. **Project Portfolio & Gantt Timeline**: Milestone scheduling, progress tracking, and budget burnup metrics.
4. **Task Delivery & Eisenhower Matrix**: Task Kanban, 4-quadrant Eisenhower planner, and live stopwatch.
5. **Client & Contact 360° Directory**: Complete customer profiles, health scores, and linked entity views.
6. **Contracts & Legal Document Management**: MSAs, SOWs, and DPAs with e-signature tracking.
7. **Invoices & Financial Operations**: Automated line-item builder with tax rules and print-ready invoices.
8. **Marketing Campaigns**: Multi-channel campaign attribution, audience reach, and pipeline generation.
9. **Support Desk & SLA Manager**: Priority ticket queue with SLA breach warnings and dual-mode reply composer.
10. **Knowledge Base**: Technical documentation, architecture runbooks, and SOP guides.
11. **Workflow Automations**: Visual node diagrams with trigger condition evaluation.
12. **Team Workload Matrix**: 40-hour capacity utilization heatmap and billable rate calculators.
13. **Reports & BI Studio**: Revenue forecasts, quarterly charts, and gross margin analysis.
14. **Settings & Data Management**: Dark/Light mode theme engine, JSON database backup/restore.

---

## 📄 License

Proprietary Software. All rights reserved © ApexFlow Technologies. Unauthorized distribution or copying is strictly prohibited.
