<script setup lang="ts">
import { ref, computed, inject } from "vue";
import Swal from "sweetalert2";
import { useFinanceStore } from "../stores/financeStore";
import { formatCurrency } from "../utils/calculations";
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
      title: t.expenseModal.warning.title,
      text: t.expenseModal.warning.text
        .replace("{category}", category.name)
        .replace("{amount}", formatCurrency(requiredFromSavings)),
      showCancelButton: true,
      confirmButtonText: t.expenseModal.warning.useSavings,
      cancelButtonText: t.expenseModal.cancel,
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
      title: t.common.error,
      text: t.expenseModal.warning.noSavings.replace(
        "{amount}",
        formatCurrency(neededFromGoal)
      ),
    });
    return;
  }

  const { value: goalId } = await Swal.fire({
    icon: "warning",
    title: t.expenseModal.goalSelection.title,
    text: t.expenseModal.goalSelection.text.replace(
      "{amount}",
      formatCurrency(neededFromGoal)
    ),
    input: "select",
    inputOptions: Object.fromEntries(
      goals.map((g) => [g.id, `${g.name} (${formatCurrency(g.currentAmount)})`])
    ),
    inputPlaceholder: t.expenseModal.goalSelection.select,
    showCancelButton: true,
    confirmButtonText: t.expenseModal.goalSelection.confirm,
    cancelButtonText: t.expenseModal.cancel,
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
        `${t.expenseModal.typeExpense} - ${category.name}`
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
    title: t.common.success,
    text: t.expenseModal.success,
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
  padding: 20px;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.close-button {
  background: transparent;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-button:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-primary);
}

.input-field {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 15px;
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
  gap: 12px;
  padding: 24px;
  border-top: 1px solid var(--border-color);
}

.button {
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
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
  transform: translateY(-1px);
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
    margin: 0 16px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px;
  }
}
</style>
