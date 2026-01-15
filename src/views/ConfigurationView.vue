<script setup lang="ts">
import { ref, computed, inject } from "vue";
import { useFinanceStore } from "../stores/financeStore";

const store = useFinanceStore();
const t: any = inject("translations");

const showSaveNotification = ref(false);

// Budget distribution percentages
const needsPercentage = ref(50);
const expensesPercentage = ref(30);
const savingsPercentage = ref(20);

// Load saved distribution from store if exists
const budgetDistribution = computed(() => store.budgetDistribution);

// Initialize with saved values
if (budgetDistribution.value) {
  needsPercentage.value = budgetDistribution.value.needs;
  expensesPercentage.value = budgetDistribution.value.expenses;
  savingsPercentage.value = budgetDistribution.value.savings;
}

const totalPercentage = computed(
  () =>
    needsPercentage.value + expensesPercentage.value + savingsPercentage.value
);

const isValidDistribution = computed(() => totalPercentage.value === 100);

// Check if there's pending income to distribute OR initial balance not distributed
const hasPendingIncome = computed(() => {
  // If there's pending income, show button
  if (store.pendingIncome > 0) return true;

  // If there's balance but allocations are 0, it's initial balance not distributed
  if (
    store.balance > 0 &&
    store.budgetAllocations.needs === 0 &&
    store.budgetAllocations.expenses === 0 &&
    store.budgetAllocations.savings === 0
  ) {
    return true;
  }

  return false;
});

// Auto-adjust percentages to always sum to 100%
function adjustPercentages(changedSlider: "needs" | "expenses" | "savings") {
  const total =
    needsPercentage.value + expensesPercentage.value + savingsPercentage.value;

  if (total === 100) return;

  const diff = 100 - total;

  // Distribute the difference to other sliders
  if (changedSlider === "needs") {
    const remaining = expensesPercentage.value + savingsPercentage.value;
    if (remaining > 0) {
      const ratio = expensesPercentage.value / remaining;
      expensesPercentage.value = Math.round(
        expensesPercentage.value + diff * ratio
      );
      savingsPercentage.value =
        100 - needsPercentage.value - expensesPercentage.value;
    }
  } else if (changedSlider === "expenses") {
    const remaining = needsPercentage.value + savingsPercentage.value;
    if (remaining > 0) {
      const ratio = needsPercentage.value / remaining;
      needsPercentage.value = Math.round(needsPercentage.value + diff * ratio);
      savingsPercentage.value =
        100 - needsPercentage.value - expensesPercentage.value;
    }
  } else {
    const remaining = needsPercentage.value + expensesPercentage.value;
    if (remaining > 0) {
      const ratio = needsPercentage.value / remaining;
      needsPercentage.value = Math.round(needsPercentage.value + diff * ratio);
      expensesPercentage.value =
        100 - needsPercentage.value - savingsPercentage.value;
    }
  }
}

function saveConfiguration() {
  if (!isValidDistribution.value) return;

  store.setBudgetDistribution({
    needs: needsPercentage.value,
    expenses: expensesPercentage.value,
    savings: savingsPercentage.value,
  });

  // If there's no pending income but there's initial balance not distributed
  if (
    store.pendingIncome === 0 &&
    store.balance > 0 &&
    store.budgetAllocations.needs === 0
  ) {
    store.pendingIncome = store.balance;
  }

  // Distribute pending income
  store.distributePendingIncome();

  // Show success notification
  showSaveNotification.value = true;
  setTimeout(() => {
    showSaveNotification.value = false;
  }, 3000);
}
</script>

<template>
  <div class="configuration-view">
    <header class="view-header">
      <div>
        <h1>{{ t.configView.title }}</h1>
        <p class="subtitle">{{ t.configView.subtitle }}</p>
      </div>
    </header>

    <!-- Info Section -->
    <section class="info-section">
      <div class="info-card">
        <h3>💡 {{ t.configView.howItWorks }}</h3>
        <p>
          {{ t.configView.howItWorksDesc }}
        </p>
      </div>
    </section>

    <section class="distribution-section">
      <h2>{{ t.configView.incomeDist }}</h2>

      <!-- Needs Slider -->
      <div class="slider-group needs">
        <div class="slider-header">
          <div class="slider-info">
            <div class="icon-wrapper needs" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
            <div>
              <h3 id="needs-label">{{ t.configView.needs }}</h3>
            </div>
          </div>
          <span class="percentage" aria-live="polite"
            >{{ needsPercentage }}%</span
          >
        </div>
        <input
          v-model.number="needsPercentage"
          type="range"
          min="0"
          max="100"
          step="5"
          class="slider needs"
          @input="adjustPercentages('needs')"
          aria-labelledby="needs-label"
        />
      </div>

      <!-- Expenses Slider -->
      <div class="slider-group expenses">
        <div class="slider-header">
          <div class="slider-info">
            <div class="icon-wrapper expenses" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
                />
              </svg>
            </div>
            <div>
              <h3 id="expenses-label">{{ t.configView.expenses }}</h3>
            </div>
          </div>
          <span class="percentage" aria-live="polite"
            >{{ expensesPercentage }}%</span
          >
        </div>
        <input
          v-model.number="expensesPercentage"
          type="range"
          min="0"
          max="100"
          step="5"
          class="slider expenses"
          @input="adjustPercentages('expenses')"
          aria-labelledby="expenses-label"
        />
      </div>

      <!-- Savings Slider -->
      <div class="slider-group savings">
        <div class="slider-header">
          <div class="slider-info">
            <div class="icon-wrapper savings" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z"
                />
              </svg>
            </div>
            <div>
              <h3 id="savings-label">{{ t.configView.savings }}</h3>
            </div>
          </div>
          <span class="percentage" aria-live="polite"
            >{{ savingsPercentage }}%</span
          >
        </div>
        <input
          v-model.number="savingsPercentage"
          type="range"
          min="0"
          max="100"
          step="5"
          class="slider savings"
          @input="adjustPercentages('savings')"
          aria-labelledby="savings-label"
        />
      </div>

      <!-- Save Button - Only show when there's pending income -->
      <button
        v-if="hasPendingIncome"
        class="save-button"
        :class="{ disabled: !isValidDistribution }"
        :disabled="!isValidDistribution"
        @click="saveConfiguration"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
          />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        {{ t.configView.saveConfig }}
      </button>

      <!-- Info message when no pending income -->
      <div v-else class="info-message">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
          />
        </svg>
        <span>{{ t.configView.addIncomeMsg }}</span>
      </div>
    </section>

    <!-- Success Notification -->
    <Transition name="toast">
      <div
        v-if="showSaveNotification"
        class="toast-notification"
        role="status"
        aria-live="polite"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
        </svg>
        <span>{{ t.configView.successMsg }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.configuration-view {
  max-width: 50rem;
  margin: 0 auto;
  padding: 1.5rem;
  container-type: inline-size;
}

.view-header h1 {
  font-size: clamp(1.5rem, 4cqi, 2.5rem);
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.subtitle {
  margin: 0 0 2rem 0;
  color: var(--text-secondary);
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
}

.distribution-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1.25rem;
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.distribution-section h2 {
  font-size: clamp(1.125rem, 3cqi, 1.5rem);
  font-weight: 700;
  margin: 0 0 2rem 0;
  color: var(--text-primary);
}

.slider-group {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.slider-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon-wrapper {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.icon-wrapper.needs {
  color: #64748b;
}

.icon-wrapper.expenses {
  color: #94a3b8;
}

.icon-wrapper.savings {
  color: var(--primary-color);
}

.icon-wrapper svg {
  width: 1.5rem;
  height: 1.5rem;
}

.slider-header h3 {
  margin: 0;
  font-size: clamp(1rem, 2.5cqi, 1.25rem);
  font-weight: 700;
  color: var(--text-primary);
}

.percentage {
  font-size: clamp(1.5rem, 4cqi, 2.25rem);
  font-weight: 800;
  color: var(--text-primary);
}

.slider {
  width: 100%;
  height: 0.5rem;
  border-radius: 0.25rem;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider.needs {
  background: linear-gradient(
    to right,
    #64748b 0%,
    #64748b var(--value),
    var(--border-color) var(--value),
    var(--border-color) 100%
  );
}

.slider.expenses {
  background: linear-gradient(
    to right,
    #94a3b8 0%,
    #94a3b8 var(--value),
    var(--border-color) var(--value),
    var(--border-color) 100%
  );
}

.slider.savings {
  background: linear-gradient(
    to right,
    var(--primary-color) 0%,
    var(--primary-color) var(--value),
    var(--border-color) var(--value),
    var(--border-color) 100%
  );
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 0.5rem rgba(0, 0, 0, 0.2);
  border: 3px solid currentColor;
}

.slider.needs::-webkit-slider-thumb {
  color: #64748b;
}

.slider.expenses::-webkit-slider-thumb {
  color: #94a3b8;
}

.slider.savings::-webkit-slider-thumb {
  color: var(--primary-color);
}

.slider::-moz-range-thumb {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 0.5rem rgba(0, 0, 0, 0.2);
  border: 3px solid currentColor;
}

.total-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
  border-radius: 0.75rem;
  margin-top: 1.5rem;
  font-size: clamp(1rem, 2.5cqi, 1.25rem);
  font-weight: 700;
  color: #ef4444;
}

.total-display.valid {
  background: rgba(16, 185, 129, 0.1);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.total-display svg {
  width: 1.5rem;
  height: 1.5rem;
}

.save-button {
  width: 100%;
  margin-top: 1.5rem;
  padding: 1rem 1.5rem;
  background: var(--primary-color);
  color: #0b0e14;
  border: none;
  border-radius: 0.75rem;
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  background: var(--primary-hover);
  box-shadow: 0 0.5rem 1.25rem rgba(16, 185, 129, 0.4);
}

.save-button:active:not(:disabled) {
  transform: translateY(0);
}

.save-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-button svg {
  width: 1.25rem;
  height: 1.25rem;
}

.toast-notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary-color);
  color: #0b0e14;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 0.5rem 1.5rem rgba(16, 185, 129, 0.4);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  z-index: 1000;
}

.toast-notification svg {
  width: 1.25rem;
  height: 1.25rem;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.info-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--bg-primary);
  border: 2px dashed var(--border-color);
  border-radius: 0.75rem;
  color: var(--text-secondary);
  font-size: clamp(0.75rem, 2cqi, 0.875rem);
  margin-top: 1rem;
}

.info-message svg {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  opacity: 0.7;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(1.25rem);
}

.info-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1.25rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.info-card h3 {
  margin: 0 0 0.75rem 0;
  font-size: clamp(1rem, 2.5cqi, 1.25rem);
  font-weight: 700;
  color: var(--text-primary);
}

.info-card p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .configuration-view {
    padding: 1rem;
  }

  .view-header h1 {
    font-size: clamp(1.25rem, 3cqi, 1.75rem);
  }

  .distribution-section {
    padding: 1.5rem 1rem;
  }

  .slider-group {
    padding: 1rem;
  }

  .percentage {
    font-size: clamp(1.25rem, 3cqi, 1.75rem);
  }
}

@media (max-width: 360px) {
  .slider-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .slider-info {
    flex-direction: column;
    align-items: center;
  }
}
</style>
