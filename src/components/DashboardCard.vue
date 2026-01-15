<script setup lang="ts">
import { computed, inject } from "vue";
import { COLORS } from "../utils/constants";
import { formatCompactCurrency } from "../utils/calculations";
import type { TransactionType } from "../types";

interface Props {
  title: string;
  amount: number;
  type: TransactionType;
  status?: "ok" | "warning" | "danger";
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  status: "ok",
  icon: "",
});

const emit = defineEmits<{
  click: [];
}>();

const cardColor = computed(() => {
  switch (props.type) {
    case "need":
      return COLORS.needs;
    case "expense":
      return COLORS.expenses;
    case "saving":
      return COLORS.savings;
    default:
      return COLORS.needs;
  }
});

const statusColor = computed(() => {
  switch (props.status) {
    case "danger":
      return COLORS.danger;
    case "warning":
      return COLORS.warning;
    default:
      return COLORS.success;
  }
});

const formattedAmount = computed(() => {
  return formatCompactCurrency(props.amount);
});

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    emit("click");
  }
}

const t = inject<any>("translations");

const cardAriaLabel = computed(() => {
  if (!t) return props.title;

  return `${props.title}: ${formattedAmount.value}. ${
    props.status === "ok"
      ? t.value.budgetStatus.healthy
      : props.status === "warning"
      ? t.value.budgetStatus.watchOut
      : t.value.budgetStatus.overLimit
  }. ${t.value.a11y.clickToViewDetails}`;
});
</script>

<template>
  <div
    class="dashboard-card"
    :style="{
      '--accent-color': cardColor.primary,
    }"
    role="button"
    tabindex="0"
    :aria-label="cardAriaLabel"
    @click="emit('click')"
    @keydown="handleKeydown"
  >
    <div class="accent-bar"></div>

    <div class="card-content">
      <div class="card-header">
        <h3 class="card-title">{{ title }}</h3>
        <div class="card-icon-wrapper" aria-hidden="true">
          <i v-if="type === 'need'" class="fas fa-home"></i>
          <i v-else-if="type === 'expense'" class="fas fa-shopping-cart"></i>
          <i v-else-if="type === 'saving'" class="fas fa-piggy-bank"></i>
        </div>
      </div>

      <div class="card-amount">
        {{ formattedAmount }}
      </div>

      <div class="card-status-info" aria-hidden="true">
        <div
          class="status-indicator"
          :class="status"
          :style="{ backgroundColor: statusColor }"
        ></div>
        <span class="status-text">
          {{
            status === "ok"
              ? t.budgetStatus.healthy
              : status === "warning"
              ? t.budgetStatus.watchOut
              : t.budgetStatus.overLimit
          }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-card {
  background: var(--bg-secondary);
  border-radius: 1rem;
  padding: 1.5rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 0.25rem;
  height: 100%;
  background: var(--accent-color);
  opacity: 0.8;
  transition: width 0.2s ease;
}

.dashboard-card:hover {
  transform: translateY(-0.25rem);
  border-color: var(--accent-color);
  box-shadow: 0 0.625rem 1.875rem -0.625rem rgba(0, 0, 0, 0.5);
}

.dashboard-card:hover .accent-bar {
  width: 0.375rem;
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.card-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-icon-wrapper {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-color);
  font-size: 0.875rem;
}

.card-amount {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.card-status-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background-color: var(--status-color);
  box-shadow: 0 0 0.5rem var(--status-color);
}

.status-text {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .dashboard-card {
    padding: 1.25rem;
  }

  .card-amount {
    font-size: 1.5rem;
  }
}
</style>
