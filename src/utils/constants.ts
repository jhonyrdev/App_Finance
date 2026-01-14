import type { Category } from '../types'

export const COLORS = {
  needs: {
    primary: '#475569',    // Slate 600 - More formal
    light: '#64748b',
    dark: '#334155',
    gradient: 'linear-gradient(135deg, #475569 0%, #334155 100%)'
  },
  expenses: {
    primary: '#94a3b8',    // Slate 400
    light: '#cbd5e1',
    dark: '#64748b',
    gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
  },
  savings: {
    primary: '#10b981',    // Emerald 500 - The standout!
    light: '#34d399',
    dark: '#059669',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  danger: '#f43f5e',
  warning: '#f59e0b',
  success: '#10b981'
}

export const DEFAULT_NEEDS_CATEGORIES: Omit<Category, 'id' | 'spent'>[] = [
  { name: 'Housing', type: 'need', limit: 0 },
  { name: 'Food', type: 'need', limit: 0 },
  { name: 'Transportation', type: 'need', limit: 0 },
  { name: 'Utilities', type: 'need', limit: 0 },
  { name: 'Health', type: 'need', limit: 0 },
  { name: 'Education', type: 'need', limit: 0 }
]

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id' | 'spent'>[] = [
  { name: 'Shopping', type: 'expense', limit: 0 },
  { name: 'Going out', type: 'expense', limit: 0 },
  { name: 'Entertainment', type: 'expense', limit: 0 },
  { name: 'Subscriptions', type: 'expense', limit: 0 },
  { name: 'Travel', type: 'expense', limit: 0 },
  { name: 'Other', type: 'expense', limit: 0 }
]

export const BUDGET_THRESHOLDS = {
  warning: 0.8,  // 80% of budget
  danger: 1.0    // 100% of budget
}

export const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const
    }
  },
  animation: {
    duration: 750,
    easing: 'easeInOutQuart' as const
  }
}

export const STORAGE_KEYS = {
  FINANCE_STATE: 'finance-app-state',
  THEME: 'finance-app-theme'
}
