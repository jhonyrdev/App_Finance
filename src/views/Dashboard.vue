<script setup lang="ts">
import { ref, computed, inject } from "vue";
import { useRouter } from "vue-router";
import { useFinanceStore } from "../stores/financeStore";
import DashboardCard from "../components/DashboardCard.vue";
import ExpenseModal from "../components/ExpenseModal.vue";
import IncomeModal from "../components/IncomeModal.vue";
import { formatCurrency, formatRelativeTime } from "../utils/calculations";

const router = useRouter();
const store = useFinanceStore();
const t: any = inject("translations");

const showExpenseModal = ref(false);
const showIncomeModal = ref(false);
const balanceInput = ref<number | "">("");
const showBalanceInput = ref(false);

const needsTotal = computed(() => store.totalNeeds);
const expensesTotal = computed(() => store.totalExpenses);
const savingsAmount = computed(() => store.currentSavings);

// Available amounts for display (never negative)
const availableNeeds = computed(() => store.availableNeeds);
const availableExpenses = computed(() => store.availableExpenses);
const availableSavings = computed(() => store.availableSavings);

const hasBalance = computed(() => store.balance > 0);
const hasBudgetConfig = computed(() => store.budgetDistribution !== null);

function navigateToNeeds() {
  router.push("/needs");
}

function navigateToExpenses() {
  router.push("/expenses");
}

function navigateToSavings() {
  router.push("/savings");
}

function setInitialBalance() {
  if (balanceInput.value) {
    store.setBalance(Number(balanceInput.value));
    showBalanceInput.value = false;
    balanceInput.value = "";
    router.push("/configuration");
  }
}

function showSetBalance() {
  showBalanceInput.value = true;
}
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="header-content">
        <h1>{{ t.home.title }}</h1>
        <p class="subtitle">{{ t.home.subtitle }}</p>
      </div>
    </header>

    <!-- Balance Section -->
    <section class="balance-section">
      <div v-if="!hasBalance" class="balance-setup">
        <div v-if="!showBalanceInput" class="empty-balance">
          <h2>{{ t.home.welcome }}</h2>
          <p>{{ t.home.setBalanceMsg }}</p>
          <button class="button-primary" @click="showSetBalance">
            {{ t.home.setBalanceBtn }}
          </button>
        </div>
        <div v-else class="balance-input-container">
          <label for="initial-balance" class="sr-only">
            {{ t.home.setBalanceBtn }}
          </label>
          <input
            id="initial-balance"
            v-model="balanceInput"
            type="number"
            step="0.01"
            placeholder="0.00"
            class="balance-input"
            @keyup.enter="setInitialBalance"
          />
          <button class="button-primary" @click="setInitialBalance">
            {{ t.common.ok }}
          </button>
        </div>
      </div>

      <div v-else class="balance-display">
        <span class="balance-label">{{ t.home.totalBalance }}</span>
        <h2 class="balance-amount">{{ formatCurrency(store.balance) }}</h2>
      </div>
    </section>

    <!-- Main Cards -->
    <section class="cards-section">
      <DashboardCard
        :title="t.needs"
        :amount="hasBudgetConfig ? availableNeeds : needsTotal"
        type="need"
        status="ok"
        @click="navigateToNeeds"
      />

      <DashboardCard
        :title="t.expenses"
        :amount="hasBudgetConfig ? availableExpenses : expensesTotal"
        type="expense"
        status="ok"
        @click="navigateToExpenses"
      />

      <DashboardCard
        :title="t.savings"
        :amount="hasBudgetConfig ? availableSavings : savingsAmount"
        type="saving"
        status="ok"
        @click="navigateToSavings"
      />
    </section>

    <!-- Quick Actions -->
    <section v-if="hasBalance" class="actions-section">
      <button
        class="action-button income"
        @click="showIncomeModal = true"
        :aria-label="t.home.addIncome"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        {{ t.home.addIncome }}
      </button>

      <button
        class="action-button secondary"
        @click="router.push('/analytics')"
        :aria-label="t.home.viewAnalytics"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
        </svg>
        {{ t.home.viewAnalytics }}
      </button>
    </section>

    <!-- Floating Add Expense Button -->
    <button
      v-if="hasBalance"
      class="fab"
      @click="showExpenseModal = true"
      :title="t.needsView.addExpense"
      :aria-label="t.needsView.addExpense"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        aria-hidden="true"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>

    <!-- Recent Transactions -->
    <section
      v-if="store.recentTransactions.length > 0"
      class="transactions-section"
    >
      <h2>{{ t.home.recentTransactions }}</h2>
      <div class="transactions-list">
        <div
          v-for="transaction in store.recentTransactions"
          :key="transaction.id"
          class="transaction-item"
        >
          <div class="transaction-info">
            <span class="transaction-category">{{
              t.categories[transaction.categoryName] || transaction.categoryName
            }}</span>
            <span class="transaction-description">{{
              transaction.description
            }}</span>
            <span class="transaction-date">{{
              formatRelativeTime(transaction.date)
            }}</span>
          </div>
          <span class="transaction-amount"
            >-{{ formatCurrency(transaction.amount) }}</span
          >
        </div>
      </div>
    </section>

    <ExpenseModal :show="showExpenseModal" @close="showExpenseModal = false" />
    <IncomeModal :show="showIncomeModal" @close="showIncomeModal = false" />
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.dashboard-header {
  margin-bottom: 32px;
}

.header-content h1 {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
}

.balance-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 40px;
  text-align: center;
}

.balance-setup .empty-balance h2 {
  font-size: 28px;
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.balance-setup .empty-balance p {
  margin: 0 0 24px 0;
  color: var(--text-secondary);
}

.balance-input-container {
  display: flex;
  gap: 12px;
  max-width: 400px;
  margin: 0 auto;
}

.balance-input {
  flex: 1;
  padding: 14px 20px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 18px;
  color: var(--text-primary);
  background: var(--input-bg);
}

.balance-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.balance-display .balance-label {
  font-size: 14px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.balance-amount {
  font-size: 56px;
  font-weight: 800;
  margin: 12px 0 0 0;
  color: #10b981;
  text-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
}

.cards-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.actions-section {
  display: flex;
  gap: 16px;
  margin-bottom: 40px;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 24px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button.income {
  background: var(--primary-color);
  color: #0b0e14;
  border: none;
}

.action-button.income:hover {
  transform: translateY(-2px);
  background: var(--primary-hover);
  box-shadow: 0 8px 20px -5px rgba(16, 185, 129, 0.4);
}

.action-button svg {
  width: 20px;
  height: 20px;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.action-button.secondary {
  background: var(--button-secondary-bg);
  color: var(--text-primary);
}

.action-button.secondary:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.button-primary {
  padding: 14px 32px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.transactions-section {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 24px;
}

.transactions-section h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: var(--text-primary);
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--input-bg);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.transaction-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.transaction-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.transaction-category {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 15px;
}

.transaction-description {
  font-size: 13px;
  color: var(--text-secondary);
}

.transaction-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.transaction-amount {
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
  border: none;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 999;
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(249, 115, 22, 0.5);
}

.fab:active {
  transform: scale(0.95);
}

.fab svg {
  width: 28px;
  height: 28px;
}

.distribution-info {
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.1),
    rgba(5, 150, 105, 0.1)
  );
  border: 2px solid rgba(16, 185, 129, 0.2);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 32px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
}

.info-header svg {
  width: 20px;
  height: 20px;
  color: var(--primary-color);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .dashboard-header h1 {
    font-size: 24px;
  }

  .balance-amount {
    font-size: 36px;
  }

  .cards-section {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .actions-section {
    flex-direction: column;
  }
  .balance-input-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
