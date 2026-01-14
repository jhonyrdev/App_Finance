import type { Category, Transaction } from '../types'
import { getTopSpendingCategories, getCategoriesOverLimit } from './budgetService'
import { formatCurrency } from '../utils/calculations'

export interface Alert {
  type: 'warning' | 'info' | 'success' | 'danger'
  title: string
  message: string
  categoryId?: string
}

/**
 * Generate budget warning alert
 */
export function createBudgetWarningAlert(
  category: Category,
  savingsImpact: number
): Alert {
  return {
    type: 'warning',
    title: 'Attention',
    message: `Spending in ${category.name} exceeds your budget. This action will reduce your savings by ${formatCurrency(savingsImpact)}`,
    categoryId: category.id
  }
}

/**
 * Generate insights based on spending patterns
 */
export function generateSpendingInsights(
  categories: Category[],
  transactions: Transaction[]
): Alert[] {
  const insights: Alert[] = []

  // Check for over-limit categories
  const overLimit = getCategoriesOverLimit(categories)
  if (overLimit.length > 0) {
    insights.push({
      type: 'danger',
      title: 'Budget Alert',
      message: `${overLimit.length} ${overLimit.length === 1 ? 'category has' : 'categories have'} exceeded their limit`
    })
  }

  // Find top spending category
  const topCategories = getTopSpendingCategories(categories, 1)
  if (topCategories.length > 0 && topCategories[0] && topCategories[0].spent > 0) {
    insights.push({
      type: 'info',
      title: 'Spending Pattern',
      message: `You spent the most on ${topCategories[0].name} this month (${formatCurrency(topCategories[0].spent)})`,
      categoryId: topCategories[0].id
    })
  }

  // Check recent transaction trend
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
  
  const recentTotal = recentTransactions.reduce((sum, t) => sum + t.amount, 0)
  if (recentTransactions.length >= 5 && recentTotal > 0) {
    const avgTransaction = recentTotal / recentTransactions.length
    insights.push({
      type: 'info',
      title: 'Recent Activity',
      message: `Your average transaction in the last 10 entries is ${formatCurrency(avgTransaction)}`
    })
  }

  return insights
}

/**
 * Check if user should be alerted about savings decline
 */
export function checkSavingsDecline(
  currentSavings: number,
  previousSavings: number
): Alert | null {
  if (previousSavings === 0) return null

  const decline = ((previousSavings - currentSavings) / previousSavings) * 100

  if (decline > 10) {
    return {
      type: 'warning',
      title: 'Savings Alert',
      message: `Your savings decreased by ${Math.round(decline)}% recently`
    }
  }

  if (decline < -10) {
    return {
      type: 'success',
      title: 'Great Progress!',
      message: `Your savings increased by ${Math.round(Math.abs(decline))}%`
    }
  }

  return null
}
