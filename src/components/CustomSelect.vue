<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

interface Option {
  value: string;
  label: string;
}

interface Props {
  modelValue: string;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const isOpen = ref(false);
const selectRef = ref<HTMLDivElement | null>(null);

const selectedLabel = computed(() => {
  const option = props.options.find((opt) => opt.value === props.modelValue);
  return option?.label || props.placeholder || "Seleccionar";
});

function toggle() {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
}

function selectOption(value: string) {
  emit("update:modelValue", value);
  isOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div ref="selectRef" class="custom-select" :class="{ disabled: disabled }">
    <div class="select-header" @click="toggle" :class="{ open: isOpen }">
      <span :class="{ placeholder: !modelValue }">{{ selectedLabel }}</span>
      <svg
        class="arrow"
        :class="{ rotated: isOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>

    <Transition name="dropdown">
      <div v-if="isOpen" class="options-list">
        <div
          v-for="option in options"
          :key="option.value"
          class="option"
          :class="{ selected: option.value === modelValue }"
          @click="selectOption(option.value)"
        >
          {{ option.label }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
  container-type: inline-size;
}

.custom-select.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.select-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
}

.select-header:hover:not(.disabled) {
  border-color: var(--primary-color);
}

.select-header.open {
  border-color: var(--primary-color);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.select-header .placeholder {
  color: var(--text-secondary);
}

.arrow {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.2s;
  color: var(--text-secondary);
}

.arrow.rotated {
  transform: rotate(180deg);
}

.options-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--input-bg);
  border: 1px solid var(--primary-color);
  border-top: none;
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  max-height: 15.625rem;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1);
}

.option {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--text-primary);
  font-size: clamp(0.875rem, 2.5cqi, 1rem);
}

.option:hover {
  background: var(--selection-hover);
  color: var(--text-primary);
}

.option.selected {
  background: var(--selection-active);
  color: var(--text-primary);
  font-weight: 500;
}

.option.selected:hover {
  background: var(--selection-hover);
  color: var(--text-primary);
}

.option:last-child {
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
  transform-origin: top;
}

.dropdown-enter-from {
  opacity: 0;
  transform: scaleY(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}
</style>
