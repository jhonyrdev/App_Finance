export type TransactionType = "need" | "expense" | "saving";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  limit: number;
  spent: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  description: string;
  date: Date;
}

export interface BudgetStatus {
  status: "ok" | "warning" | "danger";
  percentage: number;
  remaining: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  completed?: boolean;
  completedDate?: Date;
}

export interface BudgetDistribution {
  needs: number;
  expenses: number;
  savings: number;
}

export interface BudgetAllocations {
  needs: number;
  expenses: number;
  savings: number;
}

export interface FinanceState {
  balance: number;
  initialBalance: number;
  categories: Category[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  completedGoals: SavingsGoal[];
  savingsHistory: Array<{ date: Date; amount: number }>;
  budgetDistribution: BudgetDistribution | null;
  budgetAllocations: BudgetAllocations;
  pendingIncome: number;
  savingsWithdrawn: number;
  savingsAllocatedToGoals: number;
  savingsInCompletedGoals: number;
}
