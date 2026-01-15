<script setup lang="ts">
import { ref, computed, inject } from "vue";
import { useFinanceStore } from "../stores/financeStore";
import LineChart from "../components/charts/LineChart.vue";
import { formatCompactCurrency } from "../utils/calculations";

const store = useFinanceStore();
const t: any = inject("translations");

const showGoalModal = ref(false);
const showAllocateModal = ref(false);
const selectedGoal = ref<any>(null);
const goalName = ref("");
const goalAmount = ref<number | "">();
const allocateAmount = ref<number | "">();

const currentSavings = computed(() => store.currentSavings);
const savingsWithdrawn = computed(() => store.totalSavingsWithdrawn);
const savingsAllocatedToGoals = computed(
  () => store.totalSavingsAllocatedToGoals
);
const savingsHistory = computed(() => store.savingsHistory);
const savingsGoals = computed(() => store.savingsGoals);
const completedGoals = computed(() => store.completedGoals);

const savingsChange = computed(() => {
  if (savingsHistory.value.length < 2) return 0;
  const latest = savingsHistory.value[0]?.amount ?? 0;
  const previous = savingsHistory.value[1]?.amount ?? 0;
  return latest - previous;
});

const savingsChangePercentage = computed(() => {
  if (savingsHistory.value.length < 2) return 0;
  const latest = savingsHistory.value[0]?.amount ?? 0;
  const previous = savingsHistory.value[1]?.amount ?? 0;
  if (previous === 0) return 0;
  return ((latest - previous) / previous) * 100;
});

const isPositiveChange = computed(() => savingsChange.value >= 0);

function addGoal() {
  if (goalName.value && goalAmount.value) {
    store.addSavingsGoal({
      name: goalName.value,
      targetAmount: Number(goalAmount.value),
      currentAmount: 0,
    });
    goalName.value = "";
    goalAmount.value = "";
    showGoalModal.value = false;
  }
}

function openAllocateModal(goal: any) {
  selectedGoal.value = goal;
  allocateAmount.value = "";
  showAllocateModal.value = true;
}

function allocateToGoal() {
  if (selectedGoal.value && allocateAmount.value) {
    try {
      store.allocateToGoal(selectedGoal.value.id, Number(allocateAmount.value));
      showAllocateModal.value = false;
      allocateAmount.value = "";
      selectedGoal.value = null;
    } catch (error: any) {
      alert(error.message);
    }
  }
}

function getGoalProgress(goal: any) {
  if (goal.targetAmount === 0) return 0;
  return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
}
</script>

<template>
  <div class="savings-view">
    <header class="view-header">
      <div>
        <h1>{{ t.savingsView.title }}</h1>
        <p class="subtitle">{{ t.savingsView.subtitle }}</p>
      </div>
      <button class="button-primary" @click="showGoalModal = true">
        + {{ t.savingsView.addGoal }}
      </button>
    </header>

    <!-- Savings Overview -->
    <section class="overview-section">
      <div class="overview-card main">
        <span class="label">{{ t.savingsView.currentSavings }}</span>
        <h2 class="amount">{{ formatCompactCurrency(currentSavings) }}</h2>
        <div
          class="change-indicator"
          :class="{ positive: isPositiveChange, negative: !isPositiveChange }"
          aria-hidden="true"
        >
          <span class="change-icon">{{ isPositiveChange ? "↑" : "↓" }}</span>
          <span class="change-amount">{{
            formatCompactCurrency(Math.abs(savingsChange))
          }}</span>
          <span class="change-percentage"
            >({{ Math.abs(savingsChangePercentage).toFixed(1) }}%)</span
          >
        </div>
      </div>

      <div class="overview-card">
        <span class="label">{{ t.savingsView.withdrawn }}</span>
        <h3 class="value">{{ formatCompactCurrency(savingsWithdrawn) }}</h3>
      </div>

      <div class="overview-card">
        <span class="label">{{ t.savingsView.allocated }}</span>
        <h3 class="value">
          {{ formatCompactCurrency(savingsAllocatedToGoals) }}
        </h3>
      </div>
    </section>

    <!-- Savings Evolution Chart -->
    <section v-if="savingsHistory.length > 0" class="chart-section">
      <h2>{{ t.savingsView.evolution }}</h2>
      <div class="chart-container">
        <LineChart :data="savingsHistory" label="Savings" />
      </div>
    </section>

    <div v-else class="empty-chart">
      <p>
        {{ t.savingsView.noHistory }}
      </p>
    </div>

    <!-- Savings Goals -->
    <section v-if="savingsGoals.length > 0" class="goals-section">
      <h2>{{ t.savingsView.goals }}</h2>
      <div class="goals-list">
        <div v-for="goal in savingsGoals" :key="goal.id" class="goal-card">
          <div class="goal-header">
            <h3>{{ goal.name }}</h3>
            <span class="goal-target"
              >Target: {{ formatCompactCurrency(goal.targetAmount) }}</span
            >
          </div>
          <div class="goal-progress">
            <div
              class="progress-bar"
              role="progressbar"
              :aria-valuenow="Math.round(getGoalProgress(goal))"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`${goal.name} ${t.a11y.budgetProgress}`"
            >
              <div
                class="progress-fill"
                :style="{ width: `${getGoalProgress(goal)}%` }"
              ></div>
            </div>
            <div class="progress-info">
              <span>{{ formatCompactCurrency(goal.currentAmount) }} saved</span>
              <span>{{ Math.round(getGoalProgress(goal)) }}%</span>
            </div>
          </div>
          <button
            v-if="getGoalProgress(goal) < 100"
            class="allocate-button"
            @click="openAllocateModal(goal)"
            :disabled="currentSavings <= 0"
          >
            + {{ t.savingsView.allocateMoney }}
          </button>
        </div>
      </div>
    </section>

    <!-- Completed Goals History -->
    <section
      v-if="completedGoals.length > 0"
      class="goals-section completed-section"
    >
      <h2>{{ t.savingsView.completedGoals }}</h2>
      <div class="goals-list">
        <div
          v-for="goal in completedGoals"
          :key="goal.id"
          class="goal-card completed-card"
        >
          <div class="goal-header">
            <h3>{{ goal.name }}</h3>
            <span class="goal-target">{{
              formatCompactCurrency(goal.targetAmount)
            }}</span>
          </div>
          <div class="goal-progress">
            <div
              class="progress-bar"
              role="progressbar"
              aria-valuenow="100"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`${goal.name} ${t.a11y.budgetProgress}`"
            >
              <div class="progress-fill completed" style="width: 100%"></div>
            </div>
            <div class="progress-info">
              <span>{{ formatCompactCurrency(goal.currentAmount) }} saved</span>
              <span class="completed-badge">🎉 Completed</span>
            </div>
          </div>
          <div v-if="goal.completedDate" class="completed-date">
            Completed on {{ new Date(goal.completedDate).toLocaleDateString() }}
          </div>
        </div>
      </div>
    </section>

    <!-- Add Goal Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showGoalModal"
          class="modal-overlay"
          @click.self="showGoalModal = false"
        >
          <div
            class="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-modal-title"
          >
            <h3 id="goal-modal-title">{{ t.savingsView.addGoalModalTitle }}</h3>

            <div class="form-group">
              <label for="goal-name">{{ t.savingsView.goalName }}</label>
              <input
                id="goal-name"
                v-model="goalName"
                type="text"
                placeholder="e.g., Emergency Fund"
                class="input-field"
                autofocus
              />
            </div>

            <div class="form-group">
              <label for="goal-target">{{ t.savingsView.targetAmount }}</label>
              <input
                id="goal-target"
                v-model="goalAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                class="input-field"
              />
            </div>

            <div class="modal-actions">
              <button class="button-secondary" @click="showGoalModal = false">
                {{ t.needsView.cancel }}
              </button>
              <button
                class="button-primary"
                @click="addGoal"
                :disabled="!goalName || !goalAmount"
              >
                {{ t.savingsView.addGoal }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Allocate Money Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAllocateModal"
          class="modal-overlay"
          @click.self="showAllocateModal = false"
        >
          <div
            class="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="allocate-modal-title"
          >
            <h3 id="allocate-modal-title">
              {{ t.savingsView.allocateModalTitle }} {{ selectedGoal?.name }}
            </h3>

            <div class="info-box">
              <p>
                {{ t.savingsView.availableSavings }}:
                <strong>{{ formatCompactCurrency(currentSavings) }}</strong>
              </p>
              <p>
                {{ t.savingsView.goalProgress }}:
                <strong
                  >{{ formatCompactCurrency(selectedGoal?.currentAmount || 0) }}
                  /
                  {{
                    formatCompactCurrency(selectedGoal?.targetAmount || 0)
                  }}</strong
                >
              </p>
            </div>

            <div class="form-group">
              <label for="allocate-amount">{{
                t.savingsView.amountToAllocate
              }}</label>
              <input
                id="allocate-amount"
                v-model="allocateAmount"
                type="number"
                step="0.01"
                :max="currentSavings"
                placeholder="0.00"
                class="input-field"
                autofocus
              />
            </div>

            <div class="modal-actions">
              <button
                class="button-secondary"
                @click="showAllocateModal = false"
              >
                {{ t.needsView.cancel }}
              </button>
              <button
                class="button-primary"
                @click="allocateToGoal"
                :disabled="!allocateAmount || allocateAmount > currentSavings"
              >
                {{ t.savingsView.allocateModalTitle }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.savings-view {
  max-width: 75rem;
  margin: 0 auto;
  padding: 1.5rem;
  container-type: inline-size;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.view-header h1 {
  font-size: clamp(1.5rem, 4cqi, 2.5rem);
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
}

.button-primary {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: var(--text-primary-2);
  border: none;
  border-radius: 0.75rem;
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-primary:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-2px);
}

.button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.overview-section {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.overview-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1.25rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.overview-card.main {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.overview-card.main::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 0.25rem;
  height: 100%;
  background: var(--primary-color);
}

.overview-card.main .amount {
  color: var(--primary-color);
}

.label {
  font-size: clamp(0.75rem, 2cqi, 0.875rem);
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.amount {
  font-size: clamp(1.875rem, 5cqi, 3rem);
  font-weight: 800;
  margin: 0.75rem 0;
}

.value {
  font-size: clamp(1.25rem, 3cqi, 1.75rem);
  font-weight: 700;
  margin: 0.75rem 0 0 0;
  color: var(--text-primary);
}

.change-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 0.5rem;
  width: fit-content;
}

.change-indicator.positive {
  color: var(--primary-color);
}

.change-indicator.negative {
  background: rgba(244, 63, 94, 0.1);
  color: #f43f5e;
}

.change-icon {
  font-size: clamp(1rem, 2.5cqi, 1.5rem);
  font-weight: 800;
}

.change-amount {
  font-weight: 700;
}

.change-percentage {
  opacity: 0.8;
}

.chart-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1.25rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  height: 28.125rem;
  display: flex;
  flex-direction: column;
}

.chart-section h2 {
  font-size: clamp(1.125rem, 3cqi, 1.5rem);
  font-weight: 700;
  margin: 0 0 1.25rem 0;
  color: var(--text-primary);
  flex-shrink: 0;
}

.chart-container {
  flex: 1;
  min-height: 0;
}

.empty-chart {
  background: var(--card-bg);
  border-radius: 1.25rem;
  padding: 3rem;
  text-align: center;
  margin-bottom: 2rem;
}

.empty-chart p {
  margin: 0;
  color: var(--text-secondary);
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
  line-height: 1.6;
}

.goals-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1.25rem;
  padding: 1.5rem;
}

.goals-section h2 {
  font-size: clamp(1.125rem, 3cqi, 1.5rem);
  font-weight: 700;
  margin: 0 0 1.25rem 0;
  color: var(--text-primary);
}

.goals-list {
  display: grid;
  gap: 1rem;
}

.goal-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.25rem;
  border: 1px solid var(--border-color);
}

.allocate-button {
  margin-top: 1rem;
  width: 100%;
  padding: 0.75rem;
  background: var(--primary-color);
  color: #0b0e14;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.allocate-button:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem -0.25rem rgba(16, 185, 129, 0.4);
}

.allocate-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.goal-header h3 {
  margin: 0;
  font-size: clamp(1rem, 2.5cqi, 1.25rem);
  font-weight: 700;
  color: var(--text-primary);
}

.goal-target {
  font-size: clamp(0.75rem, 2cqi, 0.875rem);
  color: var(--text-secondary);
  font-weight: 600;
}

.goal-progress .progress-bar {
  height: 0.625rem;
  background: var(--progress-bg);
  border-radius: 0.3125rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 0.3125rem;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 0.625rem rgba(16, 185, 129, 0.3);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: clamp(0.75rem, 2cqi, 0.875rem);
  color: var(--text-secondary);
  font-weight: 600;
}

.completed-section {
  margin-top: 1.25rem;
}

.completed-section h2 {
  color: var(--text-primary);
}

.completed-card {
  opacity: 0.9;
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.1),
    rgba(52, 211, 153, 0.05)
  );
  border-color: rgba(16, 185, 129, 0.3);
}

.progress-fill.completed {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.completed-badge {
  color: #10b981;
  font-weight: 700;
}

.completed-date {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
  font-size: clamp(0.625rem, 1.5cqi, 0.75rem);
  color: var(--text-secondary);
  text-align: center;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(0.25rem);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.25rem;
}

.modal-content {
  background: var(--modal-bg);
  border-radius: 1.25rem;
  padding: 2rem;
  width: 100%;
  max-width: 25rem;
}

.modal-content h3 {
  margin: 0 0 1.25rem 0;
  font-size: clamp(1.25rem, 3cqi, 1.75rem);
  font-weight: 700;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: clamp(0.75rem, 2cqi, 0.875rem);
}

.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
  color: var(--text-primary);
  background: var(--input-bg);
}

.input-field:focus {
  outline: none;
  border-color: #10b981;
}

.info-box {
  background: var(--input-bg);
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.25rem;
}

.info-box p {
  margin: 0.5rem 0;
  color: var(--text-secondary);
  font-size: clamp(0.75rem, 2cqi, 0.875rem);
}

.info-box strong {
  color: var(--text-primary);
  font-weight: 700;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}

.button-secondary {
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: var(--button-secondary-bg);
  color: var(--text-primary);
  border: none;
  border-radius: 0.75rem;
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
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
  .savings-view {
    padding: 1rem;
  }

  .view-header {
    flex-direction: column;
    gap: 1rem;
  }

  .view-header h1 {
    font-size: clamp(1.25rem, 3cqi, 1.75rem);
  }

  .overview-section {
    grid-template-columns: 1fr;
  }

  .amount {
    font-size: clamp(1.5rem, 4cqi, 2.25rem);
  }
}

@media (max-width: 360px) {
  .change-indicator {
    padding: 0.375rem 0.5rem;
    gap: 0.25rem;
    font-size: 0.625rem;
  }

  .change-icon {
    font-size: 0.75rem;
  }

  .change-amount {
    font-size: 0.625rem;
  }

  .change-percentage {
    font-size: 0.5625rem;
  }

  /* Goal cards - título y monto uno debajo del otro */
  .goal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  /* Goal cards textos pequeños */
  .goal-target {
    font-size: 0.5rem;
  }

  .progress-info {
    font-size: 0.5rem;
  }

  .progress-info span {
    font-size: 0.5rem;
  }

  .allocate-button {
    font-size: 0.5rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>
