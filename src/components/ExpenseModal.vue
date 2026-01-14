<script setup lang="ts">
import { ref, computed, inject } from "vue";
import Swal from "sweetalert2";
import { useFinanceStore } from "../stores/financeStore";
import { formatCurrency } from "../utils/calculations";
import type { TransactionType } from "../types";

interface Props {
  show: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

const store = useFinanceStore();
const t: any = inject("translations");

/* ================= STATE ================= */
const amount = ref<number | "">("");
const type = ref<TransactionType>("expense");
const categoryId = ref("");
const description = ref("");

/* ================= COMPUTED ================= */
const availableCategories = computed(() => {
  return type.value === "need"
    ? store.needsCategories
    : store.expensesCategories;
});

const selectedCategory = computed(() =>
  store.getCategoryById(categoryId.value)
);

/* ================= ACTIONS ================= */
async function validateAndSubmit() {
  if (!amount.value || !categoryId.value) return;

  const category = selectedCategory.value;
  if (!category) return;

  const expenseAmount = Number(amount.value);
  const allocatedBudget =
    category.type === "need"
      ? store.allocatedNeeds
      : store.allocatedExpenses;

  /* ====== DENTRO DEL PRESUPUESTO ====== */
  if (expenseAmount <= allocatedBudget) {
    submitExpense();
    return;
  }

  const requiredFromSavings = expenseAmount - allocatedBudget;
  const availableSavings = store.currentSavings;

  /* ====== USAR SAVINGS ====== */
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

  /* ====== NECESITA GOALS ====== */
  const neededFromGoal = requiredFromSavings - availableSavings;
  const goals = store.savingsGoals.filter(g => g.currentAmount > 0);

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
      goals.map(g => [
        g.id,
        `${g.name} (${formatCurrency(g.currentAmount)})`,
      ])
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
    category.type === "need"
      ? store.allocatedNeeds
      : store.allocatedExpenses;

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
  type.value = "expense";
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
            <h2>{{ t.expenseModal.title }}</h2>
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

            <div class="form-group">
              <label>{{ t.expenseModal.type }}</label>
              <select v-model="type" class="input-field">
                <option value="need">{{ t.expenseModal.typeNeed }}</option>
                <option value="expense">{{ t.expenseModal.typeExpense }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ t.expenseModal.category }}</label>
              <select v-model="categoryId" class="input-field">
                <option value="" disabled>
                  {{ t.expenseModal.selectCategory }}
                </option>
                <option
                  v-for="cat in availableCategories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ t.categories[cat.name] || cat.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ t.expenseModal.description }}</label>
              <textarea
                v-model="description"
                class="input-field"
                rows="3"
              />
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
