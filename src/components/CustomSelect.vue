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
}

.custom-select.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.select-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
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
  width: 20px;
  height: 20px;
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
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  max-height: 250px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.option {
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--text-primary);
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
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
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
