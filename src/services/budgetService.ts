import type { Category } from "../types";
import { calculateBudgetStatus } from "../utils/calculations";

export function validateExpense(
  amount: number,
  currentBalance: number
): {
  canAdd: boolean;
  willExceedBudget: boolean;
  requiredFromSavings: number;
  newBalance: number;
} {
  const newBalance = currentBalance - amount;

  return {
    canAdd: newBalance >= 0,
    willExceedBudget: false,
    requiredFromSavings: 0,
    newBalance,
  };
}

/**
 * Get budget status for all categories
 */
export function getCategoriesBudgetStatus(categories: Category[]) {
  return categories.map((category) => ({
    category,
    status: calculateBudgetStatus(category.spent, category.limit),
  }));
}

/**
 * Find categories exceeding their limits
 */
export function getCategoriesOverLimit(categories: Category[]): Category[] {
  return categories.filter((c) => c.limit > 0 && c.spent > c.limit);
}

/**
 * Find top spending categories
 */
export function getTopSpendingCategories(
  categories: Category[],
  limit: number = 5
): Category[] {
  return [...categories].sort((a, b) => b.spent - a.spent).slice(0, limit);
}

/**
 * Calculate budget distribution percentages
 */
export function calculateBudgetDistribution(categories: Category[]): {
  needs: number;
  expenses: number;
  savings: number;
} {
  const total = categories.reduce((sum, c) => sum + c.spent, 0);

  if (total === 0) {
    return { needs: 0, expenses: 0, savings: 0 };
  }

  const needsTotal = categories
    .filter((c) => c.type === "need")
    .reduce((sum, c) => sum + c.spent, 0);

  const expensesTotal = categories
    .filter((c) => c.type === "expense")
    .reduce((sum, c) => sum + c.spent, 0);

  return {
    needs: Math.round((needsTotal / total) * 100),
    expenses: Math.round((expensesTotal / total) * 100),
    savings: 0, // Calculated separately
  };
}
