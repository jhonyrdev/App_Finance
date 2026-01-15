<script setup lang="ts">
import { ref, computed, inject } from "vue";
import Swal from "sweetalert2";
import { useFinanceStore } from "../stores/financeStore";
import { formatCompactCurrency } from "../utils/calculations";
import type { TransactionType } from "../types";
import CustomSelect from "./CustomSelect.vue";

interface Props {
  show: boolean;
  defaultType?: TransactionType;
  customTitle?: string;
}

const props = defineProps<Props>();

const modalTitle = computed(
  () => props.customTitle || t.value.expenseModal.title
);

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

const store = useFinanceStore();
const t: any = inject("translations");

const amount = ref<number | "">("");
const type = ref<TransactionType>(props.defaultType || "expense");
const categoryId = ref("");
const description = ref("");

const showTypeSelector = computed(() => !props.defaultType);

const typeOptions = computed(() => [
  { value: "need", label: t.value.expenseModal.typeNeed },
  { value: "expense", label: t.value.expenseModal.typeExpense },
]);

const availableCategories = computed(() => {
  return type.value === "need"
    ? store.needsCategories
    : store.expensesCategories;
});

const categoryOptions = computed(() => [
  { value: "", label: t.value.expenseModal.selectCategory },
  ...availableCategories.value.map((cat) => ({
    value: cat.id,
    label: t.value.categories[cat.name] || cat.name,
  })),
]);

const selectedCategory = computed(() =>
  store.getCategoryById(categoryId.value)
);

async function validateAndSubmit() {
  if (!amount.value || !categoryId.value) return;

  const category = selectedCategory.value;
  if (!category) return;

  const expenseAmount = Number(amount.value);
  const allocatedBudget =
    category.type === "need" ? store.allocatedNeeds : store.allocatedExpenses;

  /* ====== DENTRO DEL PRESUPUESTO ====== */
  if (expenseAmount <= allocatedBudget) {
    submitExpense();
    return;
  }

  const requiredFromSavings = expenseAmount - allocatedBudget;
  const availableSavings = store.currentSavings;

  if (availableSavings >= requiredFromSavings) {
    const result = await Swal.fire({
      icon: "warning",
      title: t.value.expenseModal.warning.title,
      text: t.value.expenseModal.warning.text
        .replace("{category}", category.name)
        .replace("{amount}", formatCompactCurrency(requiredFromSavings)),
      showCancelButton: true,
      confirmButtonText: t.value.expenseModal.warning.useSavings,
      cancelButtonText: t.value.expenseModal.cancel,
    });

    if (result.isConfirmed) {
      submitExpense();
    }
    return;
  }

  const neededFromGoal = requiredFromSavings - availableSavings;
  const goals = store.savingsGoals.filter((g) => g.currentAmount > 0);

  if (!goals.length) {
    await Swal.fire({
      icon: "error",
      title: t.value.common.error,
      text: t.value.expenseModal.warning.noSavings.replace(
        "{amount}",
        formatCompactCurrency(neededFromGoal)
      ),
    });
    return;
  }

  const { value: goalId } = await Swal.fire({
    icon: "warning",
    title: t.value.expenseModal.goalSelection.title,
    text: t.value.expenseModal.goalSelection.text.replace(
      "{amount}",
      formatCompactCurrency(neededFromGoal)
    ),
    input: "select",
    inputOptions: Object.fromEntries(
      goals.map((g) => [
        g.id,
        `${g.name} (${formatCompactCurrency(g.currentAmount)})`,
      ])
    ),
    inputPlaceholder: t.value.expenseModal.goalSelection.select,
    showCancelButton: true,
    confirmButtonText: t.value.expenseModal.goalSelection.confirm,
    cancelButtonText: t.value.expenseModal.cancel,
  });

  if (!goalId) return;

  submitExpense(goalId);
}

function submitExpense(goalId?: string) {
  if (!amount.value || !categoryId.value) return;

  const category = selectedCategory.value;
  if (!category) return;

  const expenseAmount = Number(amount.value);
  const allocatedBudget =
    category.type === "need" ? store.allocatedNeeds : store.allocatedExpenses;

  /* ====== MANEJO DE SAVINGS / GOALS ====== */
  if (expenseAmount > allocatedBudget) {
    const amountFromSavings = expenseAmount - allocatedBudget;
    const availableSavings = store.currentSavings;

    if (availableSavings > 0) {
      const toWithdraw = Math.min(availableSavings, amountFromSavings);
      store.withdrawFromSavings(
        toWithdraw,
        `${t.value.expenseModal.typeExpense} - ${category.name}`
      );
    }

    if (amountFromSavings > availableSavings && goalId) {
      store.withdrawFromGoal(goalId, amountFromSavings - availableSavings);
    }
  }

  /* ====== TRANSACCIÓN ====== */
  store.addTransaction({
    amount: expenseAmount,
    type: type.value,
    categoryId: categoryId.value,
    categoryName: category.name,
    description: description.value,
  });

  resetForm();
  emit("confirm");
  emit("close");

  Swal.fire({
    icon: "success",
    title: t.value.common.success,
    text: t.value.expenseModal.success,
    timer: 2000,
    showConfirmButton: false,
  });
}

function resetForm() {
  amount.value = "";
  type.value = props.defaultType || "expense";
  categoryId.value = "";
  description.value = "";
}

function handleClose() {
  resetForm();
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="handleClose">
        <div class="modal-content" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2>{{ modalTitle }}</h2>
            <button class="close-button" @click="handleClose">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>{{ t.expenseModal.amount }}</label>
              <input
                v-model="amount"
                type="number"
                step="0.01"
                min="0"
                class="input-field"
              />
            </div>

            <div v-if="showTypeSelector" class="form-group">
              <label>{{ t.expenseModal.type }}</label>
              <CustomSelect
                v-model="type"
                :options="typeOptions"
                :placeholder="t.expenseModal.type"
              />
            </div>

            <div class="form-group">
              <label>{{ t.expenseModal.category }}</label>
              <CustomSelect
                v-model="categoryId"
                :options="categoryOptions"
                :placeholder="t.expenseModal.selectCategory"
              />
            </div>

            <div class="form-group">
              <label>{{ t.expenseModal.description }}</label>
              <textarea v-model="description" class="input-field" rows="3" />
            </div>
          </div>

          <div class="modal-footer">
            <button class="button button-secondary" @click="handleClose">
              {{ t.expenseModal.cancel }}
            </button>
            <button
              class="button button-primary"
              @click="validateAndSubmit"
              :disabled="!amount || !categoryId"
            >
              {{ t.expenseModal.submit }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1.25rem;
  container-type: inline-size;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  max-width: 31.25rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: clamp(1.25rem, 4cqi, 1.75rem);
  font-weight: 700;
  color: var(--text-primary);
}

.close-button {
  background: transparent;
  border: none;
  font-size: clamp(1.25rem, 4cqi, 1.5rem);
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-button:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.input-field {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
  transition: all 0.2s;
  font-family: inherit;
}

.input-field:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
}

.input-field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.button {
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.button-primary {
  background: var(--primary-color);
  color: #0b0e14;
}

.button-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-0.0625rem);
}

.button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-secondary {
  background: transparent;
  color: var(--text-primary);
}

.button-secondary:hover {
  background: transparent;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

@media (max-width: 640px) {
  .modal-content {
    max-width: 100%;
    margin: 0 1rem;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
}
</style>
