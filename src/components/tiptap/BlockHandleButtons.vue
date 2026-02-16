<script setup lang="ts">
import { GripVertical, Plus } from 'lucide-vue-next'

const emit = defineEmits<{
  (event: 'add', value: MouseEvent): void
  (event: 'drag', value: MouseEvent): void
}>()
</script>

<template>
  <button
    type="button"
    class="
      inline-flex h-(--handle-size) w-(--handle-size) items-center justify-center rounded-sm
      bg-transparent text-(--muted-foreground) transition-colors
      hover:bg-(--accent) hover:text-(--accent-foreground)
    "
    aria-label="Insert block"
    @mousedown.prevent
    @click.stop="emit('add', $event)"
  >
    <Plus :size="14" />
  </button>

  <button
    type="button"
    class="
      inline-flex h-(--handle-size) w-(--handle-size) items-center justify-center rounded-sm
      bg-transparent text-(--muted-foreground) transition-colors
      hover:bg-(--accent) hover:text-(--accent-foreground)
    "
    aria-label="Drag block"
    draggable="true"
    @click.stop="emit('drag', $event)"
  >
    <GripVertical :size="14" />
  </button>
</template>
