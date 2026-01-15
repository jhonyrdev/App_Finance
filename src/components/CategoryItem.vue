<script setup lang="ts">
import { computed, inject } from "vue";
import type { Category } from "../types";
import {
  formatCompactCurrency,
  calculateBudgetStatus,
} from "../utils/calculations";

interface Props {
  category: Category;
}

const props = defineProps<Props>();
const t: any = inject("translations");

const budgetStatus = computed(() =>
  calculateBudgetStatus(props.category.spent, props.category.limit)
);

const progressPercentage = computed(() =>
  Math.min(budgetStatus.value.percentage, 100)
);

const statusClass = computed(() => budgetStatus.value.status);

const hasLimit = computed(() => props.category.limit > 0);
</script>

<template>
  <div class="category-item" :class="statusClass">
    <div class="category-header">
      <h4 class="category-name">
        {{ t.categories[category.name] || category.name }}
      </h4>
      <span class="category-amount">{{
        formatCompactCurrency(category.spent)
      }}</span>
    </div>

    <div v-if="hasLimit" class="category-progress">
      <div
        class="progress-bar"
        role="progressbar"
        :aria-valuenow="Math.round(budgetStatus.percentage)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`${t.categories[category.name] || category.name} ${
          t.a11y.budgetProgress
        }`"
      >
        <div
          class="progress-fill"
          :class="statusClass"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
      <div class="progress-info">
        <span class="progress-text">
          {{ Math.round(budgetStatus.percentage) }}% {{ t.common.of }}
          {{ formatCompactCurrency(category.limit) }}
        </span>
        <span v-if="budgetStatus.remaining < 0" class="over-budget">
          {{ t.budgetStatus.overBy }}
          {{ formatCompactCurrency(Math.abs(budgetStatus.remaining)) }}
        </span>
        <span v-else class="remaining">
          {{ formatCompactCurrency(budgetStatus.remaining) }}
          {{ t.budgetStatus.left }}
        </span>
      </div>
    </div>

    <div v-else class="no-limit-text">
      {{ t.budgetStatus.noLimit }}
    </div>
  </div>
</template>

<style scoped>
.category-item {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  container-type: inline-size;
}

.category-item:hover {
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.08);
}

.category-item.danger {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.category-item.warning {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.05);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.category-name {
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.category-amount {
  font-size: clamp(1rem, 3cqi, 1.25rem);
  font-weight: 700;
  color: var(--text-primary);
}

.category-progress {
  margin-top: 0.75rem;
}

.progress-bar {
  height: 0.5rem;
  background: var(--progress-bg);
  border-radius: 0.25rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  border-radius: 0.25rem;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  background: #10b981;
}

.progress-fill.warning {
  background: #f59e0b;
}

.progress-fill.danger {
  background: #ef4444;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: clamp(0.75rem, 2cqi, 0.875rem);
}

.progress-text {
  color: var(--text-secondary);
}

.remaining {
  color: #10b981;
  font-weight: 600;
}

.over-budget {
  color: #ef4444;
  font-weight: 600;
}

.no-limit-text {
  font-size: clamp(0.8125rem, 2cqi, 0.875rem);
  color: var(--text-secondary);
  font-style: italic;
}

@media (max-width: 768px) {
  .category-item {
    padding: 0.875rem;
  }
}

@media (max-width: 360px) {
  /* Header en columna - título arriba, monto abajo */
  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }

  /* Textos debajo de la barra más pequeños */
  .progress-info {
    font-size: 0.5rem;
  }

  .progress-text,
  .remaining,
  .over-budget {
    font-size: 0.5rem;
  }

  .no-limit-text {
    font-size: 0.5rem;
  }
}
</style>
