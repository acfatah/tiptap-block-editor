<script setup lang="ts">
import { Pilcrow, Table2 } from 'lucide-vue-next'

import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SlashMenuProps {
  open: boolean
  highlightedValue: string | null
  anchorStyle: Record<string, string>
  isTableMenuVisible: boolean
  menuLabel: string
  menuSource: 'slash' | 'insert' | 'turn-into' | null
}

const props = defineProps<SlashMenuProps>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'update:highlighted-value', value: string | null): void
  (event: 'select', details: { value: string }): void
}>()
</script>

<template>
  <DropdownMenuRoot
    :open="props.open"
    :highlighted-value="props.highlightedValue"
    @update:open="emit('update:open', $event)"
    @update:highlighted-value="emit('update:highlighted-value', $event)"
    @select="emit('select', $event)"
  >
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        aria-hidden="true"
        tabindex="-1"
        class="pointer-events-none fixed z-30 size-px opacity-0"
        :style="props.anchorStyle"
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent side="bottom" align="start" class="w-44">
      <DropdownMenuGroup>
        <DropdownMenuLabel>{{ props.menuLabel }}</DropdownMenuLabel>
        <DropdownMenuItem
          v-if="props.menuSource !== 'turn-into' || props.isTableMenuVisible"
          value="paragraph"
        >
          <Pilcrow :size="14" />
          Paragraph
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="props.menuSource !== 'turn-into' || !props.isTableMenuVisible"
          value="table"
        >
          <Table2 :size="14" />
          Table
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <template v-if="props.isTableMenuVisible">
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Table</DropdownMenuLabel>
          <DropdownMenuItem value="add-row-before">
            Add Row Above
          </DropdownMenuItem>
          <DropdownMenuItem value="add-row-after">
            Add Row Below
          </DropdownMenuItem>
          <DropdownMenuItem value="delete-row">
            Delete Row
          </DropdownMenuItem>
          <DropdownMenuItem value="add-column-before">
            Add Column Left
          </DropdownMenuItem>
          <DropdownMenuItem value="add-column-after">
            Add Column Right
          </DropdownMenuItem>
          <DropdownMenuItem value="delete-column">
            Delete Column
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </template>
    </DropdownMenuContent>
  </DropdownMenuRoot>
</template>
