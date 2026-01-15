<script setup lang="ts">
import { inject } from "vue";
import type { Alert } from "../services/alertService";

interface Props {
  show: boolean;
  alert: Alert | null;
}

defineProps<Props>();

const t: any = inject("translations");

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show && alert"
        class="alert-overlay"
        @click.self="emit('close')"
      >
        <div
          class="alert-content"
          :class="alert.type"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="alert-title"
          aria-describedby="alert-message"
        >
          <div class="alert-icon" aria-hidden="true">
            <span v-if="alert.type === 'warning'"></span>
            <span v-else-if="alert.type === 'danger'"></span>
            <span v-else-if="alert.type === 'success'"></span>
            <span v-else>ℹ</span>
          </div>

          <h3 id="alert-title" class="alert-title">{{ alert.title }}</h3>
          <p id="alert-message" class="alert-message">{{ alert.message }}</p>

          <button class="alert-button" @click="emit('close')">
            {{ t.common.gotIt }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.alert-overlay {
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
  container-type: inline-size;
}

.alert-content {
  background: var(--modal-bg);
  border-radius: 1.25rem;
  padding: 2rem;
  width: 100%;
  max-width: 25rem;
  text-align: center;
  box-shadow: 0 1.25rem 3.75rem rgba(0, 0, 0, 0.3);
  border: 3px solid transparent;
}

.alert-content.warning {
  border-color: rgba(245, 158, 11, 0.5);
  background: linear-gradient(var(--modal-bg), var(--modal-bg)) padding-box,
    linear-gradient(135deg, #f59e0b, #d97706) border-box;
}

.alert-content.danger {
  border-color: rgba(239, 68, 68, 0.5);
  background: linear-gradient(var(--modal-bg), var(--modal-bg)) padding-box,
    linear-gradient(135deg, #ef4444, #dc2626) border-box;
}

.alert-content.success {
  border-color: rgba(16, 185, 129, 0.5);
  background: linear-gradient(var(--modal-bg), var(--modal-bg)) padding-box,
    linear-gradient(135deg, #10b981, #059669) border-box;
}

.alert-content.info {
  border-color: rgba(59, 130, 246, 0.5);
  background: linear-gradient(var(--modal-bg), var(--modal-bg)) padding-box,
    linear-gradient(135deg, #3b82f6, #2563eb) border-box;
}

.alert-icon {
  font-size: clamp(2.5rem, 8cqi, 3.5rem);
  margin-bottom: 1rem;
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-0.625rem);
  }
}

.alert-title {
  margin: 0 0 0.75rem 0;
  font-size: clamp(1.25rem, 4cqi, 1.75rem);
  font-weight: 700;
  color: var(--text-primary);
}

.alert-message {
  margin: 0 0 1.5rem 0;
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
}

.alert-button {
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--button-primary-bg);
  color: white;
}

.alert-button:hover {
  transform: translateY(-0.125rem);
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.15);
}

.alert-content.warning .alert-button {
  background: #f59e0b;
}

.alert-content.danger .alert-button {
  background: #ef4444;
}

.alert-content.success .alert-button {
  background: #10b981;
}

.alert-content.info .alert-button {
  background: #3b82f6;
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

.modal-enter-active .alert-content,
.modal-leave-active .alert-content {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from .alert-content,
.modal-leave-to .alert-content {
  transform: scale(0.9) translateY(1.25rem);
}

@media (max-width: 768px) {
  .alert-content {
    padding: 1.75rem;
  }
}
</style>
