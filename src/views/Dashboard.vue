<script setup lang="ts">
import { ref, computed, inject } from "vue";
import { useRouter } from "vue-router";
import { useFinanceStore } from "../stores/financeStore";
import DashboardCard from "../components/DashboardCard.vue";
import ExpenseModal from "../components/ExpenseModal.vue";
import IncomeModal from "../components/IncomeModal.vue";
import {
  formatCurrency,
  formatRelativeTime,
  formatCompactCurrency,
} from "../utils/calculations";

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
        <h2 class="balance-amount">
          {{ formatCompactCurrency(store.balance) }}
        </h2>
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

    <ExpenseModal
      :show="showExpenseModal"
      custom-title="Registra tus movimientos"
      @close="showExpenseModal = false"
    />
    <IncomeModal :show="showIncomeModal" @close="showIncomeModal = false" />
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 75rem;
  margin: 0 auto;
  padding: 1.5rem;
  container-type: inline-size;
  container-name: dashboard;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.header-content h1 {
  font-size: clamp(1.5rem, 4cqi, 2rem);
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: clamp(0.875rem, 2cqi, 1rem);
}

.balance-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1.25rem;
  padding: 2.5rem;
  margin-bottom: 2.5rem;
  text-align: center;
  container-type: inline-size;
  container-name: balance;
}

.balance-setup .empty-balance h2 {
  font-size: clamp(1.25rem, 5cqi, 1.75rem);
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.balance-setup .empty-balance p {
  margin: 0 0 1.5rem 0;
  color: var(--text-secondary);
}

.balance-input-container {
  display: flex;
  gap: 0.75rem;
  max-width: 25rem;
  margin: 0 auto;
}

.balance-input {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  font-size: clamp(1rem, 3cqi, 1.125rem);
  color: var(--text-primary);
  background: var(--input-bg);
}

.balance-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.balance-display .balance-label {
  font-size: clamp(0.75rem, 2cqi, 0.875rem);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.balance-amount {
  font-size: clamp(1.5rem, 10cqi, 3.5rem);
  font-weight: 800;
  margin: 0.75rem 0 0 0;
  color: #10b981;
  text-shadow: 0 0 1.25rem rgba(16, 185, 129, 0.2);
}

.cards-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18.75rem, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.actions-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2.5rem;
  container-type: inline-size;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  font-size: clamp(0.875rem, 3cqi, 0.9375rem);
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
  box-shadow: 0 0.5rem 1.25rem -0.3125rem rgba(16, 185, 129, 0.4);
}

.action-button svg {
  width: 1.25rem;
  height: 1.25rem;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.25rem 0.75rem rgba(16, 185, 129, 0.3);
}

.action-button.secondary {
  background: var(--button-secondary-bg);
  color: var(--text-primary);
}

.action-button.secondary:hover {
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.1);
}

.button-primary {
  padding: 0.875rem 2rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
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
  border-radius: 1.25rem;
  padding: 1.5rem;
  container-type: inline-size;
}

.transactions-section h2 {
  font-size: clamp(1rem, 4cqi, 1.25rem);
  font-weight: 700;
  margin: 0 0 1.25rem 0;
  color: var(--text-primary);
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--input-bg);
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

.transaction-item:hover {
  transform: translateX(0.25rem);
  box-shadow: 0 2px 0.5rem rgba(0, 0, 0, 0.05);
}

.transaction-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.transaction-category {
  font-weight: 600;
  color: var(--text-primary);
  font-size: clamp(0.875rem, 2.5vw, 0.9375rem);
}

.transaction-description {
  font-size: clamp(0.75rem, 2vw, 0.8125rem);
  color: var(--text-secondary);
}

.transaction-date {
  font-size: clamp(0.6875rem, 1.5vw, 0.75rem);
  color: var(--text-secondary);
}

.transaction-amount {
  font-size: clamp(0.875rem, 2.5vw, 1.125rem);
  font-weight: 700;
  color: #ef4444;
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
  border: none;
  box-shadow: 0 0.5rem 1.5rem rgba(249, 115, 22, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 999;
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 0.75rem 2rem rgba(249, 115, 22, 0.5);
}

.fab:active {
  transform: scale(0.95);
}

.fab svg {
  width: 1.75rem;
  height: 1.75rem;
}

.distribution-info {
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.1),
    rgba(5, 150, 105, 0.1)
  );
  border: 2px solid rgba(16, 185, 129, 0.2);
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-primary);
  font-weight: 600;
  font-size: clamp(0.8125rem, 2vw, 0.875rem);
}

.info-header svg {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .dashboard-header h1 {
    font-size: clamp(1.25rem, 5vw, 1.5rem);
  }

  .balance-amount {
    font-size: clamp(1.75rem, 8cqi, 2.25rem);
  }

  .cards-section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .actions-section {
    flex-direction: column;
  }
  .balance-input-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 357px) {
  .dashboard-header h1 {
    font-size: clamp(1.125rem, 6vw, 1.5rem);
  }

  .balance-amount {
    font-size: clamp(1.25rem, 12cqi, 2.5rem);
  }
}

@container balance (max-width: 400px) {
  .balance-amount {
    font-size: clamp(1rem, 10cqi, 2rem);
  }
}
</style>
