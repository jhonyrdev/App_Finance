import { defineStore } from "pinia";
import type {
  Category,
  Transaction,
  SavingsGoal,
  FinanceState,
  BudgetDistribution,
} from "../types";
import {
  DEFAULT_NEEDS_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  STORAGE_KEYS,
} from "../utils/constants";
import { generateId, calculateTypeTotal } from "../utils/calculations";

export const useFinanceStore = defineStore("finance", {
  state: (): FinanceState => {
    // Try to load from localStorage
    const saved = localStorage.getItem(STORAGE_KEYS.FINANCE_STATE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        parsed.transactions = parsed.transactions.map((t: any) => ({
          ...t,
          date: new Date(t.date),
        }));
        parsed.savingsHistory = parsed.savingsHistory.map((s: any) => ({
          ...s,
          date: new Date(s.date),
        }));

        // Ensure budgetAllocations exists (migration for old state)
        if (!parsed.budgetAllocations) {
          parsed.budgetAllocations = {
            needs: 0,
            expenses: 0,
            savings: 0,
          };
        }

        // Ensure pendingIncome exists (migration for old state)
        if (parsed.pendingIncome === undefined) {
          parsed.pendingIncome = 0;
        }

        // Ensure savings tracking fields exist (migration for old state)
        if (parsed.savingsWithdrawn === undefined) {
          parsed.savingsWithdrawn = 0;
        }
        if (parsed.savingsAllocatedToGoals === undefined) {
          parsed.savingsAllocatedToGoals = 0;
        }
        if (parsed.completedGoals === undefined) {
          parsed.completedGoals = [];
        }
        if (parsed.savingsInCompletedGoals === undefined) {
          parsed.savingsInCompletedGoals = 0;
        }

        return parsed;
      } catch (e) {
        console.error("Failed to parse saved state:", e);
      }
    }

    // Default initial state
    return {
      balance: 0,
      initialBalance: 0,
      categories: [
        ...DEFAULT_NEEDS_CATEGORIES.map((c) => ({
          ...c,
          id: generateId(),
          spent: 0,
        })),
        ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
          ...c,
          id: generateId(),
          spent: 0,
        })),
      ],
      transactions: [],
      savingsGoals: [],
      completedGoals: [],
      savingsHistory: [],
      budgetDistribution: null,
      budgetAllocations: {
        needs: 0,
        expenses: 0,
        savings: 0,
      },
      pendingIncome: 0,
      savingsWithdrawn: 0,
      savingsAllocatedToGoals: 0,
      savingsInCompletedGoals: 0,
    };
  },

  getters: {
    // Get categories by type
    needsCategories: (state): Category[] =>
      state.categories.filter((c) => c.type === "need"),

    expensesCategories: (state): Category[] =>
      state.categories.filter((c) => c.type === "expense"),

    // Get allocated amounts based on stored allocations
    allocatedNeeds: (state): number => state.budgetAllocations.needs,

    allocatedExpenses: (state): number => state.budgetAllocations.expenses,

    allocatedSavings: (state): number => state.budgetAllocations.savings,

    // Get available (remaining) amounts for display - never negative
    availableNeeds: (state): number =>
      Math.max(0, state.budgetAllocations.needs),

    availableExpenses: (state): number =>
      Math.max(0, state.budgetAllocations.expenses),

    availableSavings: (state): number =>
      Math.max(
        0,
        state.budgetAllocations.savings -
          state.savingsWithdrawn -
          state.savingsInCompletedGoals
      ),

    // Calculate totals
    totalNeeds: (state): number => calculateTypeTotal(state.categories, "need"),

    totalExpenses: (state): number =>
      calculateTypeTotal(state.categories, "expense"),

    totalSpent: (state): number =>
      state.transactions.reduce((sum, t) => sum + t.amount, 0),

    currentSavings: (state): number =>
      Math.max(
        0,
        state.budgetAllocations.savings -
          state.savingsWithdrawn -
          state.savingsAllocatedToGoals -
          state.savingsInCompletedGoals
      ),

    // Total withdrawn from savings
    totalSavingsWithdrawn: (state): number => state.savingsWithdrawn,

    // Total allocated to goals
    totalSavingsAllocatedToGoals: (state): number =>
      state.savingsAllocatedToGoals,

    // Get category by ID
    getCategoryById:
      (state) =>
      (id: string): Category | undefined =>
        state.categories.find((c) => c.id === id),

    // Get transactions by category
    getTransactionsByCategory:
      (state) =>
      (categoryId: string): Transaction[] =>
        state.transactions.filter((t) => t.categoryId === categoryId),

    // Get transactions by type
    getTransactionsByType:
      (state) =>
      (type: "need" | "expense"): Transaction[] =>
        state.transactions.filter((t) => t.type === type),

    // Get recent transactions
    recentTransactions: (state): Transaction[] =>
      [...state.transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10),
  },

  actions: {
    // Set initial balance
    setBalance(amount: number) {
      this.balance = amount;
      if (this.initialBalance === 0) {
        this.initialBalance = amount;
        // Mark initial balance as pending for distribution
        this.pendingIncome = amount;
      }

      this.saveToLocalStorage();
    },

    // Set budget distribution
    setBudgetDistribution(distribution: BudgetDistribution) {
      this.budgetDistribution = distribution;
      this.saveToLocalStorage();
    },

    // Add income (marks as pending for distribution)
    addIncome(amount: number, _description?: string) {
      this.balance += amount;
      this.pendingIncome += amount;

      this.updateSavingsHistory();
      this.saveToLocalStorage();
    },

    // Distribute pending income according to budget configuration
    distributePendingIncome() {
      if (this.pendingIncome === 0 || !this.budgetDistribution) return;

      const amount = this.pendingIncome;
      const needsAmount = (amount * this.budgetDistribution.needs) / 100;
      const expensesAmount = (amount * this.budgetDistribution.expenses) / 100;
      const savingsAmount = (amount * this.budgetDistribution.savings) / 100;

      // Update persistent allocations
      this.budgetAllocations.needs += needsAmount;
      this.budgetAllocations.expenses += expensesAmount;
      this.budgetAllocations.savings += savingsAmount;

      // Update category limits proportionally
      const needsCats = this.needsCategories;
      const expensesCats = this.expensesCategories;

      if (needsCats.length > 0) {
        const perNeedCategory = needsAmount / needsCats.length;
        needsCats.forEach((cat: Category) => {
          cat.limit += perNeedCategory;
        });
      }

      if (expensesCats.length > 0) {
        const perExpenseCategory = expensesAmount / expensesCats.length;
        expensesCats.forEach((cat: Category) => {
          cat.limit += perExpenseCategory;
        });
      }

      // Reset pending income
      this.pendingIncome = 0;
      this.saveToLocalStorage();
    },

    // Add a new transaction
    addTransaction(transaction: Omit<Transaction, "id" | "date">) {
      const newTransaction: Transaction = {
        ...transaction,
        id: generateId(),
        date: new Date(),
      };

      this.transactions.push(newTransaction);

      // Update category spent amount
      const category = this.categories.find(
        (c) => c.id === transaction.categoryId
      );
      if (category) {
        category.spent += transaction.amount;
      }

      // Update balance
      this.balance -= transaction.amount;

      // Reduce budget allocations based on transaction type
      if (transaction.type === "need") {
        this.budgetAllocations.needs -= transaction.amount;
      } else if (transaction.type === "expense") {
        this.budgetAllocations.expenses -= transaction.amount;
      }

      // Update savings history
      this.updateSavingsHistory();

      this.saveToLocalStorage();

      return newTransaction;
    },

    // Update category limit
    updateCategoryLimit(categoryId: string, limit: number) {
      const category = this.categories.find((c) => c.id === categoryId);
      if (category) {
        category.limit = limit;
        this.saveToLocalStorage();
      }
    },

    // Add custom category
    addCategory(category: Omit<Category, "id" | "spent">) {
      const newCategory: Category = {
        ...category,
        id: generateId(),
        spent: 0,
      };
      this.categories.push(newCategory);
      this.saveToLocalStorage();
      return newCategory;
    },

    // Remove transaction
    removeTransaction(transactionId: string) {
      const transaction = this.transactions.find((t) => t.id === transactionId);
      if (!transaction) return;

      // Restore category spent amount
      const category = this.categories.find(
        (c) => c.id === transaction.categoryId
      );
      if (category) {
        category.spent -= transaction.amount;
      }

      // Restore balance
      this.balance += transaction.amount;

      // Restore budget allocations based on transaction type
      if (transaction.type === "need") {
        this.budgetAllocations.needs += transaction.amount;
      } else if (transaction.type === "expense") {
        this.budgetAllocations.expenses += transaction.amount;
      }

      // Remove transaction
      this.transactions = this.transactions.filter(
        (t) => t.id !== transactionId
      );

      this.updateSavingsHistory();
      this.saveToLocalStorage();
    },

    // Add savings goal
    addSavingsGoal(goal: Omit<SavingsGoal, "id">) {
      const newGoal: SavingsGoal = {
        ...goal,
        id: generateId(),
      };
      this.savingsGoals.push(newGoal);
      this.saveToLocalStorage();
      return newGoal;
    },

    // Update savings goal progress (allocate money from savings to goal)
    allocateToGoal(goalId: string, amount: number) {
      const goal = this.savingsGoals.find((g) => g.id === goalId);
      if (!goal) return;

      // Check if there's enough available savings
      const availableSavings = this.currentSavings;
      if (amount > availableSavings) {
        throw new Error("Not enough savings available");
      }

      goal.currentAmount += amount;
      this.savingsAllocatedToGoals += amount;

      // Check if goal is completed
      if (goal.currentAmount >= goal.targetAmount) {
        goal.completed = true;
        goal.completedDate = new Date();

        // Move money from active goals to completed goals tracking
        this.savingsAllocatedToGoals -= goal.currentAmount;
        this.savingsInCompletedGoals += goal.currentAmount;

        // Remove from active balance since it's now locked
        this.balance -= goal.currentAmount;

        // Move to completed goals
        this.completedGoals.push(goal);
        this.savingsGoals = this.savingsGoals.filter((g) => g.id !== goalId);
      }

      this.saveToLocalStorage();
    },

    // Withdraw from savings
    withdrawFromSavings(amount: number, _description?: string) {
      const availableSavings = this.currentSavings;
      if (amount > availableSavings) {
        throw new Error("Not enough savings available");
      }

      this.savingsWithdrawn += amount;
      this.saveToLocalStorage();
    },

    // Withdraw from a specific goal
    withdrawFromGoal(goalId: string, amount: number) {
      const goal = this.savingsGoals.find((g) => g.id === goalId);
      if (!goal) {
        throw new Error("Goal not found");
      }

      if (amount > goal.currentAmount) {
        throw new Error("Not enough money in this goal");
      }

      goal.currentAmount -= amount;
      this.savingsAllocatedToGoals -= amount;
      // Also count this as withdrawn since it's being used for expenses
      this.savingsWithdrawn += amount;
      this.saveToLocalStorage();
    },

    // Update savings history
    updateSavingsHistory() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingEntry = this.savingsHistory.find(
        (s) => new Date(s.date).getTime() === today.getTime()
      );

      const currentSavings = this.currentSavings;

      if (existingEntry) {
        existingEntry.amount = currentSavings;
      } else {
        this.savingsHistory.push({
          date: today,
          amount: currentSavings,
        });
      }

      // Keep only last 30 days
      this.savingsHistory = this.savingsHistory
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30);
    },

    // Reset all data
    resetData() {
      this.balance = 0;
      this.initialBalance = 0;
      this.transactions = [];
      this.savingsHistory = [];
      this.categories.forEach((c) => (c.spent = 0));
      this.saveToLocalStorage();
    },

    // Save to localStorage
    saveToLocalStorage() {
      try {
        localStorage.setItem(
          STORAGE_KEYS.FINANCE_STATE,
          JSON.stringify(this.$state)
        );
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
    },
  },
});
