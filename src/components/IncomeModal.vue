<script setup lang="ts">
import { computed, ref, inject } from "vue";
import type { ComputedRef } from "vue";
import { useRouter } from "vue-router";
import { useFinanceStore } from "../stores/financeStore";
import Swal from "sweetalert2";

interface Props {
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

const store = useFinanceStore();
const router = useRouter();
const t = inject<ComputedRef<any>>(
  "translations",
  computed(() => ({}))
);
const amount = ref<number | "">("");
const description = ref("");

if (!t) {
  throw new Error("Translations provider not found");
}

async function submitIncome() {
  if (!amount.value) return;

  const distribution = store.budgetDistribution;

  if (!distribution) {
    // No hay configuración, solo agregar el ingreso
    store.addIncome(Number(amount.value), description.value);
    resetForm();
    emit("confirm");
    emit("close");
    return;
  }

  if (!t.value?.incomeModal?.swal) {
  console.error("Translations not loaded properly");
  store.addIncome(Number(amount.value), description.value);
  resetForm();
  emit("confirm");
  emit("close");
  return;
}


  // Mostrar diálogo con SweetAlert2
  const result = await Swal.fire({
    title: t?.value.incomeModal.swal.title,
    html: `
      <p style="margin-bottom: 20px;">${t?.value.incomeModal.swal.text}</p>
      <div style="background: var(--bg-primary); padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid var(--border-color); color: var(--text-primary);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>${t?.value.incomeModal.swal.needs}:</span>
          <strong>${distribution.needs}%</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>${t.value.incomeModal.swal.expenses}:</span>
          <strong>${distribution.expenses}%</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>${t?.value.incomeModal.swal.savings}:</span>
          <strong>${distribution.savings}%</strong>
        </div>
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: t?.value.incomeModal.swal.continue,
    denyButtonText: t.value.incomeModal.swal.config,
    cancelButtonText: t?.value.incomeModal.swal.cancel,
    confirmButtonColor: "#10b981",
    denyButtonColor: "#059669",
    cancelButtonColor: "#6b7280",
    background: "var(--modal-bg)",
    color: "var(--text-primary)",
  });

  if (result.isConfirmed) {
    store.addIncome(Number(amount.value), description.value);
    store.distributePendingIncome();

    Swal.fire({
      title: t?.value.incomeModal.swal.successTitle,
      text: t.value.incomeModal.swal.successText,
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      background: "var(--modal-bg)",
      color: "var(--text-primary)",
    });

    resetForm();
    emit("confirm");
    emit("close");
  } else if (result.isDenied) {
    // Ir a configuración
    store.addIncome(Number(amount.value), description.value);
    resetForm();
    emit("close");
    router.push("/configuration");
  }
}

function resetForm() {
  amount.value = "";
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
        <div
          class="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="income-modal-title"
        >
          <div class="modal-header">
            <h2 id="income-modal-title">💰 {{ t.incomeModal.title }}</h2>
            <button
              class="close-button"
              @click="handleClose"
              :aria-label="t.a11y.closeSidebar"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label for="income-amount">{{ t.incomeModal.amount }}</label>
              <input
                id="income-amount"
                v-model="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="input-field"
                autofocus
              />
            </div>

            <div class="form-group">
              <label for="income-description">{{
                t.incomeModal.description
              }}</label>
              <textarea
                id="income-description"
                v-model="description"
                :placeholder="t.incomeModal.placeholder"
                class="input-field"
                rows="3"
              ></textarea>
            </div>

            <div class="info-note">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                />
              </svg>
              <span>{{ t.incomeModal.infoNote }}</span>
            </div>
          </div>

          <div class="modal-footer">
            <button class="button button-secondary" @click="handleClose">
              {{ t.incomeModal.cancel }}
            </button>
            <button
              class="button button-primary"
              @click="submitIncome"
              :disabled="!amount"
            >
              {{ t.incomeModal.submit }}
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
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
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
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.close-button:hover {
  color: var(--text-primary);
}

.close-button svg {
  width: 24px;
  height: 24px;
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
  font-size: 14px;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 16px;
  color: var(--text-primary);
  background: var(--input-bg);
  transition: all 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

textarea.input-field {
  resize: vertical;
  font-family: inherit;
}

.info-note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 12px;
  margin-top: 16px;
}

.info-note svg {
  width: 20px;
  height: 20px;
  color: var(--primary-color);
  flex-shrink: 0;
  margin-top: 2px;
}

.info-note span {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid var(--border-color);
}

.button {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-primary {
  background: var(--primary-color);
  color: var(--text-primary-2);
}

.button-primary:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.button-secondary {
  background: var(--button-secondary-bg);
  color: var(--text-primary);
}

.button-secondary:hover {
  background: var(--button-secondary-hover-bg);
}

/* Transitions */
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
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(20px);
}

@media (max-width: 768px) {
  .modal-content {
    margin: 0;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }
}
</style>
