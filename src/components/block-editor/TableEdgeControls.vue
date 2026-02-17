<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'

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
  (event: 'addColumn'): void
  (event: 'addRow'): void
}>()
</script>

<template>
  <Button
    v-if="props.showAddColumnButton"
    type="button"
    variant="outline"
    size="icon-sm"
    class="table-edge-button absolute z-30 rounded-sm"
    :style="props.addColumnButtonStyle"
    aria-label="Add column"
    @mousedown.prevent
    @click="emit('addColumn')"
  >
    <Plus :size="12" class="opacity-50" />
  </Button>

  <div
    v-if="props.showAddColumnButton"
    class="table-edge-rail absolute z-25 bg-transparent"
    :style="props.addColumnRailStyle"
    aria-hidden="true"
  />

  <Button
    v-if="props.showAddRowButton"
    type="button"
    variant="outline"
    size="icon-sm"
    class="table-edge-button absolute z-30 rounded-sm"
    :style="props.addRowButtonStyle"
    aria-label="Add row"
    @mousedown.prevent
    @click="emit('addRow')"
  >
    <Plus :size="12" class="opacity-50" />
  </Button>

  <div
    v-if="props.showAddRowButton"
    class="table-edge-rail absolute z-25 bg-transparent"
    :style="props.addRowRailStyle"
    aria-hidden="true"
  />
</template>
