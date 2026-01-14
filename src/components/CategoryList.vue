<script setup lang="ts">
import { inject } from "vue";
import type { Category } from "../types";

interface Props {
  categories: Category[];
}

defineProps<Props>();

const t: any = inject("translations");

const emit = defineEmits<{
  "category-click": [category: Category];
}>();

function handleKeydown(e: KeyboardEvent, category: Category) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    emit("category-click", category);
  }
}
</script>

<template>
  <div class="category-list">
    <slot name="header"></slot>

    <div class="categories-grid" role="list">
      <div
        v-for="category in categories"
        :key="category.id"
        class="category-wrapper"
        role="listitem"
        tabindex="0"
        :aria-label="
          t.a11y.clickToViewDetails +
          ': ' +
          (t.categories[category.name] || category.name)
        "
        @click="emit('category-click', category)"
        @keydown="handleKeydown($event, category)"
      >
        <slot name="category" :category="category"></slot>
      </div>
    </div>

    <div v-if="categories.length === 0" class="empty-state">
      <p>No categories yet</p>
    </div>
  </div>
</template>

<style scoped>
.category-list {
  width: 100%;
}

.categories-grid {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}

.category-wrapper {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.category-wrapper:hover {
  transform: translateX(4px);
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-secondary);
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

@media (max-width: 768px) {
  .categories-grid {
    gap: 12px;
  }
}
</style>
