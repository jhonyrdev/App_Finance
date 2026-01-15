<script setup lang="ts">
import { ref, computed, inject } from "vue";
import { useFinanceStore } from "../stores/financeStore";
import CategoryList from "../components/CategoryList.vue";
import CategoryItem from "../components/CategoryItem.vue";
import DonutChart from "../components/charts/DonutChart.vue";
import BarChart from "../components/charts/BarChart.vue";
import ExpenseModal from "../components/ExpenseModal.vue";
import { COLORS } from "../utils/constants";
import { formatCurrency } from "../utils/calculations";
import { getTopSpendingCategories } from "../services/budgetService";

const store = useFinanceStore();
const t: any = inject("translations");

const showExpenseModal = ref(false);
const selectedCategoryId = ref("");
const newLimit = ref<number | "">("");

const categories = computed(() => store.expensesCategories);
const canAddExpense = computed(
  () => store.balance > 0 && store.availableExpenses > 0
);

const chartLabels = computed(() =>
  categories.value
    .filter((c) => c.spent > 0)
    .map((c) => t.value.categories[c.name] || c.name)
);

const chartData = computed(() =>
  categories.value.filter((c) => c.spent > 0).map((c) => c.spent)
);

const chartColors = computed(() => [
  COLORS.expenses.primary,
  COLORS.expenses.light,
  COLORS.expenses.dark,
  "#FB923C",
  "#FDBA74",
]);

const hasData = computed(() => chartData.value.length > 0);

const categoriesWithSpending = computed(() =>
  categories.value.filter((c) => c.spent > 0)
);

const topSpendingCategories = computed(() =>
  getTopSpendingCategories(categoriesWithSpending.value, 5)
);

function setCategoryLimit(categoryId: string) {
  selectedCategoryId.value = categoryId;
  const category = store.getCategoryById(categoryId);
  if (category) {
    newLimit.value = category.limit;
  }
}

function saveLimit() {
  if (selectedCategoryId.value && newLimit.value) {
    store.updateCategoryLimit(selectedCategoryId.value, Number(newLimit.value));
    selectedCategoryId.value = "";
    newLimit.value = "";
  }
}

function cancelLimit() {
  selectedCategoryId.value = "";
  newLimit.value = "";
}
</script>

<template>
  <div class="expenses-view">
    <header class="view-header">
      <div>
        <h1>{{ t.expensesView.title }}</h1>
        <p class="subtitle">{{ t.expensesView.subtitle }}</p>
      </div>
      <button
        class="button-primary"
        @click="showExpenseModal = true"
        :disabled="!canAddExpense"
      >
        + {{ t.needsView.addExpense }}
      </button>
    </header>

    <!-- Top Spending Highlight -->
    <section v-if="categoriesWithSpending.length > 5" class="highlight-section">
      <h3>{{ t.expensesView.topSpending }}</h3>
      <div class="highlight-cards">
        <div
          v-for="(category, index) in topSpendingCategories"
          :key="category.id"
          class="highlight-card"
        >
          <div class="rank" aria-hidden="true">#{{ index + 1 }}</div>
          <div class="category-name">
            {{ t.categories[category.name] || category.name }}
          </div>
          <div class="category-amount">
            {{ formatCurrency(category.spent) }}
          </div>
        </div>
      </div>
    </section>

    <!-- Charts Section -->
    <section v-if="hasData" class="charts-section">
      <div class="chart-card">
        <h3>{{ t.expensesView.distribution }}</h3>
        <DonutChart
          :labels="chartLabels"
          :data="chartData"
          :backgroundColor="chartColors"
        />
      </div>

      <div class="chart-card">
        <h3>{{ t.expensesView.byCategory }}</h3>
        <BarChart
          :labels="chartLabels"
          :data="chartData"
          :backgroundColor="COLORS.expenses.primary"
          :label="t.analyticsView.amount"
        />
      </div>
    </section>

    <div v-else class="empty-chart">
      <p>{{ t.expensesView.noExpenses }}</p>
    </div>

    <!-- Categories List -->
    <section class="categories-section">
      <h2>{{ t.expensesView.categories }}</h2>

      <CategoryList :categories="categories">
        <template #category="{ category }">
          <CategoryItem :category="category" />
          <button
            class="set-limit-button"
            @click="setCategoryLimit(category.id)"
          >
            {{ t.expensesView.setLimit }}
          </button>
        </template>
      </CategoryList>
    </section>

    <!-- Set Limit Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="selectedCategoryId"
          class="modal-overlay"
          @click.self="cancelLimit"
        >
          <div
            class="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="limit-modal-title"
          >
            <h3 id="limit-modal-title">{{ t.needsView.setLimitModalTitle }}</h3>
            <label for="limit-input" class="sr-only">
              {{ t.needsView.enterLimit }}
            </label>
            <input
              id="limit-input"
              v-model="newLimit"
              type="number"
              :placeholder="t.needsView.enterLimit"
              class="input-field"
              @keyup.enter="saveLimit"
              step="0.01"
              autofocus
            />
            <div class="modal-actions">
              <button class="button-secondary" @click="cancelLimit">
                {{ t.needsView.cancel }}
              </button>
              <button class="button-primary" @click="saveLimit">
                {{ t.needsView.save }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Expense Modal -->
    <ExpenseModal
      :show="showExpenseModal"
      default-type="expense"
      custom-title="Registro de gasto"
      @close="showExpenseModal = false"
    />
  </div>
</template>

<style scoped>
.expenses-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.view-header h1 {
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

.highlight-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 40px;
  position: relative;
  overflow: hidden;
}

.highlight-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #f59e0b; 
}

.highlight-section h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 700;
}

.highlight-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.highlight-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  transition: transform 0.2s ease;
}

.highlight-card:hover {
  transform: translateY(-4px);
  border-color: #f59e0b;
}

.category-amount {
  font-size: 24px;
  font-weight: 800;
  color: #f59e0b;
}

.rank {
  font-size: 24px;
  font-weight: 800;
  opacity: 0.8;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  margin: 8px 0;
}
  
.button-primary {
  padding: 12px 24px;
  background: var(--primary-color);
  color: #0b0e14;
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
  box-shadow: 0 8px 20px -5px rgba(16, 185, 129, 0.4);
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.chart-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 24px;
  height: 450px;
  display: flex;
  flex-direction: column;
}

.chart-card h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: var(--text-primary);
  flex-shrink: 0;
}

.chart-card > div {
  flex: 1;
  min-height: 0;
}

.empty-chart {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 48px;
  text-align: center;
  margin-bottom: 32px;
}

.empty-chart p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
}

.categories-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 24px;
}

.categories-section h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: var(--text-primary);
}

.set-limit-button {
  margin-top: 8px;
  padding: 8px 16px;
  background: var(--button-secondary-bg);
  color: var(--text-primary);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.set-limit-button:hover {
  background: var(--button-secondary-hover-bg);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--modal-bg);
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 400px;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 16px;
  color: var(--text-primary);
  background: var(--input-bg);
  margin-bottom: 20px;
}

.input-field:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.button-secondary {
  flex: 1;
  padding: 12px 24px;
  background: var(--button-secondary-bg);
  color: var(--text-primary);
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-secondary:hover {
  background: var(--button-secondary-hover-bg);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .expenses-view {
    padding: 16px;
  }

  .view-header {
    flex-direction: column;
    gap: 16px;
  }

  .view-header h1 {
    font-size: 24px;
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .highlight-cards {
    grid-template-columns: 1fr;
  }
}
.button-primary:disabled {
  background: var(--text-secondary);
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
