import type { Category, Transaction, BudgetStatus } from '../types'
import { BUDGET_THRESHOLDS } from './constants'

/**
 * Format number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount)
}

/**
 * Calculate total spent in a category
 */
export function calculateCategorySpent(
  categoryId: string,
  transactions: Transaction[]
): number {
  return transactions
    .filter(t => t.categoryId === categoryId)
    .reduce((sum, t) => sum + t.amount, 0)
}

/**
 * Calculate budget status for a category
 */
export function calculateBudgetStatus(
  spent: number,
  limit: number
): BudgetStatus {
  if (limit === 0) {
    return { status: 'ok', percentage: 0, remaining: 0 }
  }

  const percentage = (spent / limit) * 100
  const remaining = limit - spent

  let status: 'ok' | 'warning' | 'danger' = 'ok'
  if (percentage >= BUDGET_THRESHOLDS.danger * 100) {
    status = 'danger'
  } else if (percentage >= BUDGET_THRESHOLDS.warning * 100) {
    status = 'warning'
  }

  return { status, percentage, remaining }
}

/**
 * Calculate total for categories of a specific type
 */
export function calculateTypeTotal(
  categories: Category[],
  type: 'need' | 'expense' | 'saving'
): number {
  return categories
    .filter(c => c.type === type)
    .reduce((sum, c) => sum + c.spent, 0)
}

/**
 * Calculate percentage from total
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - new Date(date).getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return formatDate(date)
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
