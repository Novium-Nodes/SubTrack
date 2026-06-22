/**
 * Copyright (c) 2026 NoviumNodes
 * Developed for team "NoviumNodes" by Yousef & Mohamed.
 * All rights reserved.
 *
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// SubTrack JS Core Logic (Pure Vanilla JS)
// ==========================================

// Realistic Mock Data for Popular Services
const INITIAL_PRESETS = [
  { id: 'netflix', name: 'Netflix Premium', cost: 22.99, cycle: 'monthly', category: 'entertainment', color: '#ff4757' },
  { id: 'spotify', name: 'Spotify Premium', cost: 11.99, cycle: 'monthly', category: 'entertainment', color: '#1db954' },
  { id: 'github', name: 'GitHub Pro', cost: 4.00, cycle: 'monthly', category: 'dev-tools', color: '#24292e' },
  { id: 'chatgpt', name: 'ChatGPT Plus', cost: 20.00, cycle: 'monthly', category: 'productivity', color: '#10a37f' },
  { id: 'youtube', name: 'YouTube Premium', cost: 13.99, cycle: 'monthly', category: 'entertainment', color: '#ff0000' },
  { id: 'canva', name: 'Canva Pro', cost: 14.99, cycle: 'monthly', category: 'productivity', color: '#00c4cc' },
  { id: 'aws', name: 'AWS Cloud Hosting', cost: 120.00, cycle: 'yearly', category: 'dev-tools', color: '#ff9900' },
  { id: 'figma', name: 'Figma Professional', cost: 15.00, cycle: 'monthly', category: 'productivity', color: '#f24e1e' }
];

// Pre-fill State Mock subscriptions
const DEFAULT_SUBSCRIPTIONS = [
  { id: 'sub-1', name: 'Netflix Premium', cost: 22.99, cycle: 'monthly', renewalDate: getOffsetDateString(8), category: 'entertainment' },
  { id: 'sub-2', name: 'Spotify Premium', cost: 11.99, cycle: 'monthly', renewalDate: getOffsetDateString(14), category: 'entertainment' },
  { id: 'sub-3', name: 'GitHub Pro', cost: 48.00, cycle: 'yearly', renewalDate: getOffsetDateString(28), category: 'dev-tools' },
  { id: 'sub-4', name: 'Figma Professional', cost: 15.00, cycle: 'monthly', renewalDate: getOffsetDateString(2), category: 'productivity' }
];

// Helper to calculate offset date
function getOffsetDateString(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

// Application State Manager
class SubTrackController {
  constructor() {
    this.subscriptions = JSON.parse(localStorage.getItem('subtrack_data')) || DEFAULT_SUBSCRIPTIONS;
    this.currentTheme = localStorage.getItem('subtrack_theme') || 'light';
    this.activeTab = 'dashboard';
    
    // UI selection references
    this.dom = {
      themeToggleBtn: document.getElementById('themeToggleBtn'),
      themeIcon: document.getElementById('themeIcon'),
      menuToggleBtn: document.getElementById('menuToggleBtn'),
      closeSidebarBtn: document.getElementById('closeSidebarBtn'),
      sidebar: document.getElementById('sidebar'),
      navItems: document.querySelectorAll('.nav-item'),
      
      // Metric elements
      statsMonthlySpend: document.getElementById('statsMonthlySpend'),
      statsYearlySpend: document.getElementById('statsYearlySpend'),
      statsActiveCount: document.getElementById('statsActiveCount'),
      statsNextName: document.getElementById('statsNextName'),
      statsNextDays: document.getElementById('statsNextDays'),
      
      // Form panel elements
      subscriptionForm: document.getElementById('subscriptionForm'),
      subName: document.getElementById('subName'),
      subCost: document.getElementById('subCost'),
      subCycle: document.getElementById('subCycle'),
      subCategory: document.getElementById('subCategory'),
      subRenewalDate: document.getElementById('subRenewalDate'),
      
      // Control items
      searchBar: document.getElementById('searchBar'),
      filterCategory: document.getElementById('filterCategory'),
      sortField: document.getElementById('sortField'),
      
      // Body structures
      subTableBody: document.getElementById('subTableBody'),
      subGridMobile: document.getElementById('subGridMobile'),
      emptyState: document.getElementById('emptyState'),
      
      // Presets
      presetsGrid: document.getElementById('presetsGrid'),
      
      // Tab references
      tabPanes: document.querySelectorAll('.tab-pane'),
      tabTitle: document.getElementById('tabTitle'),
      tabSubtitle: document.getElementById('tabSubtitle'),
      
      // Analytics
      categoryBars: document.getElementById('categoryBars'),
      analyticsInsights: document.getElementById('analyticsInsights')
    };
  }

  init() {
    // Inject local initial values
    if (!localStorage.getItem('subtrack_data')) {
      this.saveToStorage();
    }
    
    // Setup Theme Mode
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    this.updateThemeTogglerUI();

    // Set Default input renewal date to today
    if (this.dom.subRenewalDate) {
      this.dom.subRenewalDate.value = new Date().toISOString().split('T')[0];
    }

    this.registerEventListeners();
    this.renderCurrentView();
    this.renderPresets();
    
    // Re-initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  registerEventListeners() {
    // Theme setup
    if (this.dom.themeToggleBtn) {
      this.dom.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Sidebar triggers
    if (this.dom.menuToggleBtn) {
      this.dom.menuToggleBtn.addEventListener('click', () => this.openSidebar());
    }
    if (this.dom.closeSidebarBtn) {
      this.dom.closeSidebarBtn.addEventListener('click', () => this.closeSidebar());
    }

    // Tab Navigation switching
    this.dom.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab');
        this.switchTab(tab);
        this.closeSidebar();
      });
    });

    // Form inputs and Submission
    if (this.dom.subscriptionForm) {
      this.dom.subscriptionForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Dynamic filtering updates
    if (this.dom.searchBar) {
      this.dom.searchBar.addEventListener('input', () => this.renderCurrentView());
    }
    if (this.dom.filterCategory) {
      this.dom.filterCategory.addEventListener('change', () => this.renderCurrentView());
    }
    if (this.dom.sortField) {
      this.dom.sortField.addEventListener('change', () => this.renderCurrentView());
    }
  }

  // Dark/Light toggle
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('subtrack_theme', this.currentTheme);
    this.updateThemeTogglerUI();
  }

  updateThemeTogglerUI() {
    if (!this.dom.themeIcon) return;
    if (this.currentTheme === 'dark') {
      this.dom.themeIcon.setAttribute('data-lucide', 'sun');
    } else {
      this.dom.themeIcon.setAttribute('data-lucide', 'moon');
    }
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Sidebar Controls
  openSidebar() {
    if (this.dom.sidebar) {
      this.dom.sidebar.classList.add('open');
    }
  }

  closeSidebar() {
    if (this.dom.sidebar) {
      this.dom.sidebar.classList.remove('open');
    }
  }

  // Tab management
  switchTab(tabId) {
    this.activeTab = tabId;
    
    // Update menu bar visual active class
    this.dom.navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Toggle Tab Panes visibility
    this.dom.tabPanes.forEach(pane => {
      if (pane.id === tabId + 'Tab') {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Update Header subtitles meta-text
    if (tabId === 'dashboard') {
      this.dom.tabTitle.textContent = 'Dashboard';
      this.dom.tabSubtitle.textContent = 'Manage, analyze, and optimize your repeating payments';
      this.renderCurrentView();
    } else if (tabId === 'analytics') {
      this.dom.tabTitle.textContent = 'Analytics';
      this.dom.tabSubtitle.textContent = 'Segment insights, distribution analysis, and spending warnings';
      this.renderAnalytics();
    } else if (tabId === 'presets') {
      this.dom.tabTitle.textContent = 'Quick Import Presets';
      this.dom.tabSubtitle.textContent = 'Create trackings easily with popular global services';
    }
  }

  saveToStorage() {
    localStorage.setItem('subtrack_data', JSON.stringify(this.subscriptions));
  }

  // Days till upcoming calculation handling rollover
  calculateDaysRemaining(dateStr, cycle) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let renewal = new Date(dateStr);
    renewal.setHours(0, 0, 0, 0);

    // If date is in the past, roll forward automatically based on cycle
    while (renewal < today) {
      if (cycle === 'monthly') {
        renewal.setMonth(renewal.getMonth() + 1);
      } else {
        renewal.setFullYear(renewal.getFullYear() + 1);
      }
    }

    const diffTime = renewal - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      days: diffDays,
      nextDateString: renewal.toISOString().split('T')[0]
    };
  }

  // Metrics Calculations & Update
  updateMetrics() {
    let totalMonthlySpend = 0;
    const count = this.subscriptions.length;
    let closestSub = null;
    let minDaysLeft = Infinity;

    this.subscriptions.forEach(sub => {
      // Calculate monthly equivalence cost
      const costNum = parseFloat(sub.cost);
      if (sub.cycle === 'monthly') {
        totalMonthlySpend += costNum;
      } else {
        totalMonthlySpend += (costNum / 12);
      }

      // Calculate upcoming closest renewal date
      const daysInfo = this.calculateDaysRemaining(sub.renewalDate, sub.cycle);
      if (daysInfo.days < minDaysLeft) {
        minDaysLeft = daysInfo.days;
        closestSub = {
          name: sub.name,
          daysLeft: daysInfo.days,
          renewalDate: daysInfo.nextDateString
        };
      }
    });

    // Write metric metrics
    if (this.dom.statsMonthlySpend) this.dom.statsMonthlySpend.textContent = '$' + totalMonthlySpend.toFixed(2);
    if (this.dom.statsYearlySpend) this.dom.statsYearlySpend.textContent = 'Yearly equivalent: $' + (totalMonthlySpend * 12).toFixed(2);
    if (this.dom.statsActiveCount) this.dom.statsActiveCount.textContent = count;

    if (this.dom.statsNextName && this.dom.statsNextDays) {
      if (closestSub) {
        this.dom.statsNextName.textContent = closestSub.name;
        this.dom.statsNextDays.textContent = closestSub.daysLeft === 0 
          ? 'Renewing today!' 
          : 'In ' + closestSub.daysLeft + ' day' + (closestSub.daysLeft > 1 ? 's' : '') + ' (' + closestSub.renewalDate + ')';
      } else {
        this.dom.statsNextName.textContent = 'None';
        this.dom.statsNextDays.textContent = 'No upcoming renewals';
      }
    }
  }

  // Form handling & validation
  handleFormSubmit(e) {
    if (e) e.preventDefault();
    
    const name = this.dom.subName.value.trim();
    const cost = parseFloat(this.dom.subCost.value);
    const cycle = this.dom.subCycle.value;
    const category = this.dom.subCategory.value;
    const renewalDate = this.dom.subRenewalDate.value;
    
    let isValid = true;

    // Direct error field rendering
    if (!name || name.length < 2) {
      this.dom.subName.classList.add('invalid');
      const err = document.getElementById('subNameError');
      if (err) err.style.display = 'block';
      isValid = false;
    } else {
      this.dom.subName.classList.remove('invalid');
      const err = document.getElementById('subNameError');
      if (err) err.style.display = 'none';
    }

    if (isNaN(cost) || cost <= 0) {
      this.dom.subCost.classList.add('invalid');
      const err = document.getElementById('subCostError');
      if (err) err.style.display = 'block';
      isValid = false;
    } else {
      this.dom.subCost.classList.remove('invalid');
      const err = document.getElementById('subCostError');
      if (err) err.style.display = 'none';
    }

    if (!renewalDate) {
      this.dom.subRenewalDate.classList.add('invalid');
      const err = document.getElementById('subRenewalError');
      if (err) err.style.display = 'block';
      isValid = false;
    } else {
      this.dom.subRenewalDate.classList.remove('invalid');
      const err = document.getElementById('subRenewalError');
      if (err) err.style.display = 'none';
    }

    if (!isValid) return;

    // Create the instance
    const newSub = {
      id: 'sub-' + Date.now(),
      name: name,
      cost: cost,
      cycle: cycle,
      category: category,
      renewalDate: renewalDate
    };

    this.subscriptions.push(newSub);
    this.saveToStorage();
    this.renderCurrentView();
    
    // Reset Form Input Parameters
    if (this.dom.subscriptionForm) {
      this.dom.subscriptionForm.reset();
    }
    if (this.dom.subRenewalDate) {
      this.dom.subRenewalDate.value = new Date().toISOString().split('T')[0];
    }
  }

  // Add Preset Click
  addPreset(presetId) {
    const preset = INITIAL_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const newSub = {
      id: 'sub-' + Date.now(),
      name: preset.name,
      cost: preset.cost,
      cycle: preset.cycle,
      category: preset.category,
      renewalDate: getOffsetDateString(7) // Defaults to exactly one week away
    };

    this.subscriptions.push(newSub);
    this.saveToStorage();
    this.switchTab('dashboard');
  }

  deleteSubscription(id) {
    this.subscriptions = this.subscriptions.filter(sub => sub.id !== id);
    this.saveToStorage();
    this.renderCurrentView();
  }

  // Dynamic filter lists
  renderCurrentView() {
    this.updateMetrics();

    const searchQuery = this.dom.searchBar ? this.dom.searchBar.value.toLowerCase().trim() : '';
    const catFilter = this.dom.filterCategory ? this.dom.filterCategory.value : 'all';
    const sortBy = this.dom.sortField ? this.dom.sortField.value : 'daysLeft';

    let filtered = this.subscriptions.filter(sub => {
      const matchSearch = sub.name.toLowerCase().includes(searchQuery);
      const matchCategory = catFilter === 'all' || sub.category === catFilter;
      return matchSearch && matchCategory;
    });

    // Sorting logic
    filtered.sort((a, b) => {
      const infoA = this.calculateDaysRemaining(a.renewalDate, a.cycle);
      const infoB = this.calculateDaysRemaining(b.renewalDate, b.cycle);

      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'cost') {
        const costA = a.cycle === 'monthly' ? a.cost : a.cost / 12;
        const costB = b.cycle === 'monthly' ? b.cost : b.cost / 12;
        return costB - costA;
      } else if (sortBy === 'renewalDate') {
        return new Date(infoA.nextDateString) - new Date(infoB.nextDateString);
      } else { // 'daysLeft'
        return infoA.days - infoB.days;
      }
    });

    // Check emptystate visibility
    if (this.dom.emptyState) {
      if (filtered.length === 0) {
        if (this.dom.subTableBody) this.dom.subTableBody.innerHTML = '';
        if (this.dom.subGridMobile) this.dom.subGridMobile.innerHTML = '';
        this.dom.emptyState.classList.remove('hidden');
      } else {
        this.dom.emptyState.classList.add('hidden');
        this.renderDesktopTable(filtered);
        this.renderMobileCards(filtered);
      }
    }

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Draw table view on wide viewports (desktops/laptops)
  renderDesktopTable(list) {
    if (!this.dom.subTableBody) return;
    let rowsHTML = '';
    for (let i = 0; i < list.length; i++) {
      const sub = list[i];
      const daysInfo = this.calculateDaysRemaining(sub.renewalDate, sub.cycle);
      const initial = sub.name.charAt(0);
      
      let timerClass = 'relaxed';
      if (daysInfo.days <= 3) {
        timerClass = 'urgent';
      } else if (daysInfo.days <= 7) {
        timerClass = 'normal';
      }

      // Format clean renewal dates
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      const formattedDate = new Date(daysInfo.nextDateString).toLocaleDateString('en-US', options);

      rowsHTML += `<tr>
        <td>
          <div class="service-cell">
            <div class="service-icon-fallback" style="background-color: var(--cat-${sub.category})">${initial}</div>
            <span class="service-name-text">${sub.name}</span>
          </div>
        </td>
        <td>
          <span class="category-badge badge-${sub.category}">${sub.category.replace('-', ' ')}</span>
        </td>
        <td>
          <span class="cycle-label">
            <i data-lucide="refresh-cw"></i>
            ${sub.cycle}
          </span>
        </td>
        <td>
          <div class="renewal-timer-container">
            <span class="renewal-days ${timerClass}">
              ${daysInfo.days === 0 ? 'Renewing today' : daysInfo.days + ' days left'}
            </span>
            <span class="renewal-date-meta">Next billing: ${formattedDate}</span>
          </div>
        </td>
        <td>
          <span class="table-cost-box">$${parseFloat(sub.cost).toFixed(2)}</span>
        </td>
        <td class="text-right">
          <button class="delete-btn" onclick="appController.deleteSubscription('${sub.id}')" aria-label="Delete subscription">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
        </tr>`;
    }
    this.dom.subTableBody.innerHTML = rowsHTML;
  }

  // Mobile Grid Cards
  renderMobileCards(list) {
    if (!this.dom.subGridMobile) return;
    let cardsHTML = '';
    for (let i = 0; i < list.length; i++) {
      const sub = list[i];
      const daysInfo = this.calculateDaysRemaining(sub.renewalDate, sub.cycle);
      const initial = sub.name.charAt(0);
      
      let timerClass = 'relaxed';
      if (daysInfo.days <= 3) {
        timerClass = 'urgent';
      } else if (daysInfo.days <= 7) {
        timerClass = 'normal';
      }

      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      const formattedDate = new Date(daysInfo.nextDateString).toLocaleDateString('en-US', options);

      cardsHTML += `<div class="mobile-sub-card">
        <div class="card-top-row">
          <div class="service-cell">
            <div class="service-icon-fallback" style="background-color: var(--cat-${sub.category})">${initial}</div>
            <div>
              <div class="service-name-text">${sub.name}</div>
              <span class="category-badge badge-${sub.category}" style="margin-top: 4px; display: inline-block;">${sub.category.replace('-', ' ')}</span>
            </div>
          </div>
          <button class="delete-btn" onclick="appController.deleteSubscription('${sub.id}')" aria-label="Delete subscription">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
        <div class="card-middle-row">
          <div class="renewal-timer-container">
            <span class="renewal-days ${timerClass}">
              ${daysInfo.days === 0 ? 'Renewing today' : daysInfo.days + ' days left'}
            </span>
            <span class="renewal-date-meta">${formattedDate}</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; display: block;">$${parseFloat(sub.cost).toFixed(2)}</span>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">/${sub.cycle === 'monthly' ? 'mo' : 'yr'}</div>
          </div>
        </div>
        <div class="card-bottom-row">
          <span class="cycle-label">
            <i data-lucide="refresh-cw"></i>
            ${sub.cycle}
          </span>
        </div>
      </div>`;
    }
    this.dom.subGridMobile.innerHTML = cardsHTML;
  }

  // Pre-load preset options list
  renderPresets() {
    if (!this.dom.presetsGrid) return;
    let presetsHTML = '';
    for (let i = 0; i < INITIAL_PRESETS.length; i++) {
      const preset = INITIAL_PRESETS[i];
      const initial = preset.name.charAt(0);
      presetsHTML += `<div class="preset-card shadow-sm">
        <div class="preset-service-info">
          <div class="preset-logo" style="background-color: ${preset.color || 'var(--accent-primary)'}">${initial}</div>
          <div class="preset-meta">
            <span class="preset-name">${preset.name}</span>
            <span class="preset-category">${preset.category.replace('-', ' ')}</span>
          </div>
        </div>
        <div class="preset-price-tag">
          <span class="preset-cost">$${preset.cost.toFixed(2)}</span>
          <span class="preset-cycle-sub">/${preset.cycle === 'monthly' ? 'mo' : 'yr'}</span>
        </div>
        <button class="import-btn" onclick="appController.addPreset('${preset.id}')">
          <i data-lucide="plus"></i>
          <span>Import Preset</span>
        </button>
      </div>`;
    }
    this.dom.presetsGrid.innerHTML = presetsHTML;
  }

  // Analytics distribution
  renderAnalytics() {
    if (!this.dom.categoryBars || !this.dom.analyticsInsights) return;
    let totals = { entertainment: 0, utilities: 0, 'dev-tools': 0, productivity: 0, other: 0 };
    let grandMonthlyEquiv = 0;

    this.subscriptions.forEach(sub => {
      const costNum = parseFloat(sub.cost);
      const monthlyCost = sub.cycle === 'monthly' ? costNum : costNum / 12;
      totals[sub.category] = (totals[sub.category] || 0) + monthlyCost;
      grandMonthlyEquiv += monthlyCost;
    });

    // Create Category comparison stats rows
    let listHTML = '';
    const keys = ['entertainment', 'utilities', 'dev-tools', 'productivity', 'other'];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = totals[key] || 0;
      const percentage = grandMonthlyEquiv > 0 ? (value / grandMonthlyEquiv) * 100 : 0;
      
      listHTML += `<div class="chart-bar-row">
        <div class="bar-info">
          <span style="text-transform: capitalize;">${key.replace('-', ' ')}</span>
          <span>$${value.toFixed(2)} (${percentage.toFixed(0)}%)</span>
        </div>
        <div class="bar-bg">
          <div class="bar-fill" style="width: ${percentage}%; background-color: var(--cat-${key})"></div>
        </div>
      </div>`;
    }
    this.dom.categoryBars.innerHTML = listHTML;

    // Smart calculated suggestions insights
    let yearlyCycles = this.subscriptions.filter(sub => sub.cycle === 'yearly').length;
    let savingsInsightHTML = `<div class="insights-list">
      <div class="insight-item" style="border-left-color: #2ed573">
        <div class="insight-icon" style="color: #2ed573"><i data-lucide="shield-check"></i></div>
        <div class="insight-text">
          <h4>Monthly Tracking Report</h4>
          <p>Your grand absolute monthly spend is standardly projected at <strong>$${grandMonthlyEquiv.toFixed(2)}</strong>. Regularly auditing these ensures zero accidental waste.</p>
        </div>
      </div>`;

    if (yearlyCycles > 0) {
      savingsInsightHTML += `  <div class="insight-item" style="border-left-color: #3742fa">
        <div class="insight-icon" style="color: #3742fa"><i data-lucide="info"></i></div>
        <div class="insight-text">
          <h4>Billing Optimizations Available</h4>
          <p>You have <strong>${yearlyCycles}</strong> yearly billing subscription${yearlyCycles > 1 ? 's' : ''}. Long-term plans usually save an average of 15% to 25% over month-to-month layouts!</p>
        </div>
      </div>`;
    } else {
      savingsInsightHTML += `  <div class="insight-item" style="border-left-color: #ffa502">
        <div class="insight-icon" style="color: #ffa502"><i data-lucide="alert-triangle"></i></div>
        <div class="insight-text">
          <h4>Consolidation Insights</h4>
          <p>None of your custom integrations currently utilize yearly payment steps. Think about shifting popular tools to annual subscriptions to save valuable capital.</p>
        </div>
      </div>`;
    }

    savingsInsightHTML += '</div>';
    this.dom.analyticsInsights.innerHTML = savingsInsightHTML;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Instantiate global app controller
let appController;
document.addEventListener('DOMContentLoaded', () => {
  appController = new SubTrackController();
  appController.init();
});
