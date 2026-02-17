<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

interface TableEdgeControlsProps {
  showAddColumnButton: boolean
  showAddRowButton: boolean
  addColumnButtonStyle: Record<string, string>
  addRowButtonStyle: Record<string, string>
  addColumnRailStyle: Record<string, string>
  addRowRailStyle: Record<string, string>
}

const props = defineProps<TableEdgeControlsProps>()

const emit = defineEmits<{
  (event: 'add-column'): void
  (event: 'add-row'): void
}>()
</script>

<template>
  <button
    v-if="props.showAddColumnButton"
    type="button"
    class="
      table-edge-button absolute z-30 inline-flex items-center justify-center rounded-sm border
      border-(--border) bg-popover text-(--muted-foreground)
      hover:bg-(--accent) hover:text-(--accent-foreground)
    "
    :style="props.addColumnButtonStyle"
    aria-label="Add column"
    @mousedown.prevent
    @click="emit('add-column')"
  >
    <Plus :size="12" />
  </button>

  <div
    v-if="props.showAddColumnButton"
    class="table-edge-rail absolute z-25 bg-transparent"
    :style="props.addColumnRailStyle"
    aria-hidden="true"
  />

  <button
    v-if="props.showAddRowButton"
    type="button"
    class="
      table-edge-button absolute z-30 inline-flex items-center justify-center rounded-sm border
      border-(--border) bg-popover text-(--muted-foreground)
      hover:bg-(--accent) hover:text-(--accent-foreground)
    "
    :style="props.addRowButtonStyle"
    aria-label="Add row"
    @mousedown.prevent
    @click="emit('add-row')"
  >
    <Plus :size="12" />
  </button>

  <div
    v-if="props.showAddRowButton"
    class="table-edge-rail absolute z-25 bg-transparent"
    :style="props.addRowRailStyle"
    aria-hidden="true"
  />
</template>
