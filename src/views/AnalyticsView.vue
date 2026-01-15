<script setup lang="ts">
import { computed, ref, inject } from "vue";
import { useFinanceStore } from "../stores/financeStore";
import BarChart from "../components/charts/BarChart.vue";
import DonutChart from "../components/charts/DonutChart.vue";
import AlertModal from "../components/AlertModal.vue";
import {
  getCategoriesOverLimit,
  getTopSpendingCategories,
} from "../services/budgetService";
import { generateSpendingInsights } from "../services/alertService";
import type { Alert } from "../services/alertService";
import { COLORS } from "../utils/constants";
import { formatCompactCurrency } from "../utils/calculations";

const store = useFinanceStore();
const t: any = inject("translations");

const selectedAlert = ref<Alert | null>(null);
const showAlertModal = ref(false);

const allCategories = computed(() => store.categories);
const transactions = computed(() => store.transactions);

const overLimitCategories = computed(() =>
  getCategoriesOverLimit(allCategories.value)
);

const topSpending = computed(() =>
  getTopSpendingCategories(allCategories.value, 5)
);

const insights = computed(() =>
  generateSpendingInsights(allCategories.value, transactions.value)
);

const distributionLabels = computed(() => [
  t.value.analyticsView.needs,
  t.value.analyticsView.expenses,
]);
const distributionData = computed(() => [
  store.totalNeeds,
  store.totalExpenses,
]);
const distributionColors = computed(() => [
  COLORS.needs.primary,
  COLORS.expenses.primary,
]);

const topSpendingLabels = computed(() =>
  topSpending.value.map((c) => t.value.categories[c.name] || c.name)
);
const topSpendingData = computed(() => topSpending.value.map((c) => c.spent));

function viewInsight(insight: Alert) {
  selectedAlert.value = insight;
  showAlertModal.value = true;
}

function closeAlert() {
  showAlertModal.value = false;
  selectedAlert.value = null;
}
</script>

<template>
  <div class="analytics-view">
    <header class="view-header">
      <div>
        <h1>{{ t.analyticsView.title }}</h1>
        <p class="subtitle">{{ t.analyticsView.subtitle }}</p>
      </div>
    </header>

    <!-- Summary Cards -->
    <section
      class="summary-section"
      role="region"
      :aria-label="t.analyticsView.title"
    >
      <div
        class="summary-card"
        role="text"
        :aria-label="`${t.analyticsView.totalBalance}: ${formatCompactCurrency(
          store.balance
        )}`"
      >
        <div class="summary-info">
          <span class="label">{{ t.analyticsView.totalBalance }}</span>
          <span class="value">{{ formatCompactCurrency(store.balance) }}</span>
        </div>
      </div>

      <div
        class="summary-card"
        role="text"
        :aria-label="`${t.analyticsView.needs}: ${formatCompactCurrency(
          store.totalNeeds
        )}`"
      >
        <div class="summary-info">
          <span class="label">{{ t.analyticsView.needs }}</span>
          <span class="value">{{
            formatCompactCurrency(store.totalNeeds)
          }}</span>
        </div>
      </div>

      <div
        class="summary-card"
        role="text"
        :aria-label="`${t.analyticsView.expenses}: ${formatCompactCurrency(
          store.totalExpenses
        )}`"
      >
        <div class="summary-info">
          <span class="label">{{ t.analyticsView.expenses }}</span>
          <span class="value">{{
            formatCompactCurrency(store.totalExpenses)
          }}</span>
        </div>
      </div>

      <div
        class="summary-card"
        role="text"
        :aria-label="`${t.analyticsView.savings}: ${formatCompactCurrency(
          store.currentSavings
        )}`"
      >
        <div class="summary-info">
          <span class="label">{{ t.analyticsView.savings }}</span>
          <span class="value">{{
            formatCompactCurrency(store.currentSavings)
          }}</span>
        </div>
      </div>
    </section>

    <!-- Budget Distribution -->
    <section class="charts-grid">
      <div class="chart-card">
        <h2>{{ t.analyticsView.budgetDistribution }}</h2>
        <DonutChart
          v-if="distributionData.some((d) => d > 0)"
          :labels="distributionLabels"
          :data="distributionData"
          :backgroundColor="distributionColors"
        />
        <div v-else class="empty-chart-message">
          <p>{{ t.analyticsView.noData }}</p>
        </div>
      </div>

      <div class="chart-card">
        <h2>{{ t.analyticsView.topSpending }}</h2>
        <BarChart
          v-if="topSpendingData.length > 0"
          :labels="topSpendingLabels"
          :data="topSpendingData"
          :backgroundColor="[
            '#475569',
            '#94a3b8',
            '#10B981',
            '#1e293b',
            '#64748b',
          ]"
          :label="t.analyticsView.amount"
        />
        <div v-else class="empty-chart-message">
          <p>{{ t.analyticsView.noData }}</p>
        </div>
      </div>
    </section>

    <!-- Categories Over Limit -->
    <section v-if="overLimitCategories.length > 0" class="alert-section danger">
      <h2>⚠️ {{ t.analyticsView.categoriesOverLimit }}</h2>
      <div class="alert-list" role="list">
        <div
          v-for="category in overLimitCategories"
          :key="category.id"
          class="alert-item"
          role="listitem"
        >
          <div class="alert-info">
            <span class="alert-title">{{
              t.categories[category.name] || category.name
            }}</span>
            <span class="alert-detail">
              {{ t.analyticsView.spent }}
              {{ formatCompactCurrency(category.spent) }} /
              {{ t.analyticsView.limit }}
              {{ formatCompactCurrency(category.limit) }}
            </span>
          </div>
          <span class="over-amount" aria-label="Amount over limit">
            +{{ formatCompactCurrency(category.spent - category.limit) }}
          </span>
        </div>
      </div>
    </section>

    <!-- Insights -->
    <section v-if="insights.length > 0" class="insights-section">
      <h2>💡 {{ t.analyticsView.insights }}</h2>
      <div class="insights-grid" role="list">
        <div
          v-for="(insight, index) in insights"
          :key="index"
          class="insight-card"
          :class="insight.type"
          role="button"
          tabindex="0"
          :aria-label="`${t.a11y.clickViewDetails}: ${insight.title}`"
          @click="viewInsight(insight)"
          @keydown.enter="viewInsight(insight)"
          @keydown.space.prevent="viewInsight(insight)"
        >
          <div class="insight-icon" aria-hidden="true">
            <span v-if="insight.type === 'warning'">⚠️</span>
            <span v-else-if="insight.type === 'danger'">🚨</span>
            <span v-else-if="insight.type === 'success'">✅</span>
            <span v-else>ℹ️</span>
          </div>
          <div class="insight-content">
            <h3>{{ insight.title }}</h3>
            <p>{{ insight.message }}</p>
          </div>
          <svg
            class="arrow-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </section>

    <div v-else class="empty-insights">
      <p>{{ t.analyticsView.noInsights }}</p>
    </div>

    <!-- Alert Modal -->
    <AlertModal
      :show="showAlertModal"
      :alert="selectedAlert"
      @close="closeAlert"
    />
  </div>
</template>

<style scoped>
.analytics-view {
  max-width: 75rem;
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

.summary-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13.75rem, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-card .icon {
  font-size: 2rem;
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-info .label {
  font-size: clamp(0.75rem, 2cqi, 0.875rem);
  color: var(--text-secondary);
  font-weight: 600;
}

.summary-info .value {
  font-size: clamp(1.25rem, 3cqi, 1.75rem);
  font-weight: 800;
  color: var(--text-primary);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(25rem, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1.25rem;
  padding: 1.5rem;
  height: 28.125rem;
  display: flex;
  flex-direction: column;
}

.chart-card h2 {
  font-size: clamp(1rem, 2.5cqi, 1.25rem);
  font-weight: 700;
  margin: 0 0 1.25rem 0;
  color: var(--text-primary);
  flex-shrink: 0;
}

.chart-card > div {
  flex: 1;
  min-height: 0;
}

.empty-chart-message {
  height: 18.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-chart-message p {
  margin: 0;
  color: var(--text-secondary);
}

.alert-section {
  background: var(--card-bg);
  border-radius: 1.25rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 3px solid transparent;
}

.alert-section.danger {
  border: 1px solid rgba(244, 63, 94, 0.3);
  background: rgba(244, 63, 94, 0.05);
}

.alert-section h2 {
  font-size: clamp(1.125rem, 3cqi, 1.5rem);
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: #f43f5e;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
}

.alert-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.alert-title {
  font-weight: 700;
  color: var(--text-primary);
}

.alert-detail {
  font-size: clamp(0.75rem, 2cqi, 0.875rem);
  color: var(--text-secondary);
}

.over-amount {
  font-size: clamp(1rem, 2.5cqi, 1.25rem);
  font-weight: 800;
  color: #f43f5e;
}

.insights-section {
  background: var(--card-bg);
  border-radius: 1.25rem;
  padding: 1.5rem;
}

.insights-section h2 {
  font-size: clamp(1.125rem, 3cqi, 1.5rem);
  font-weight: 700;
  margin: 0 0 1.25rem 0;
  color: var(--text-primary);
}

.insights-grid {
  display: grid;
  gap: 1rem;
}

.insight-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-primary);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
}

.insight-card:hover {
  transform: translateX(0.25rem);
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.1);
}

.insight-card.warning {
  border-color: rgba(245, 158, 11, 0.3);
}

.insight-card.danger {
  border-color: rgba(239, 68, 68, 0.3);
}

.insight-card.info {
  border-color: rgba(59, 130, 246, 0.3);
}

.insight-icon {
  font-size: clamp(1.5rem, 4cqi, 2.25rem);
  flex-shrink: 0;
}

.insight-content {
  flex: 1;
}

.insight-content h3 {
  margin: 0 0 0.25rem 0;
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
  font-weight: 700;
  color: var(--text-primary);
}

.insight-content p {
  margin: 0;
  font-size: clamp(0.75rem, 2cqi, 0.875rem);
  color: var(--text-secondary);
  line-height: 1.5;
}

.arrow-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.insight-card:hover .arrow-icon {
  transform: translateX(0.25rem);
}

.empty-insights {
  background: var(--card-bg);
  border-radius: 1.25rem;
  padding: 3rem;
  text-align: center;
}

.empty-insights p {
  margin: 0;
  color: var(--text-secondary);
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .analytics-view {
    padding: 1rem;
  }

  .view-header h1 {
    font-size: clamp(1.25rem, 3cqi, 1.75rem);
  }

  .summary-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 464px) {
  .analytics-view {
    padding: 1rem;
  }

  .view-header h1 {
    font-size: clamp(1.125rem, 3cqi, 1.5rem);
  }

  .summary-section {
    grid-template-columns: repeat(1, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
