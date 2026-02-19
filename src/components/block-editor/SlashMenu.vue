<script setup lang="ts">
import {
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Pilcrow,
  Table2,
  Trash2,
} from 'lucide-vue-next'

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
  isTableActionsEnabled: boolean
  canDeleteTableRow: boolean
  canDeleteTableColumn: boolean
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

    <DropdownMenuContent
      side="bottom" align="start" class="
        w-44
        data-[side=bottom]:-mt-3
      "
    >
      <DropdownMenuGroup>
        <DropdownMenuLabel>{{ props.menuLabel }}</DropdownMenuLabel>
        <DropdownMenuItem
          v-if="props.menuSource !== 'turn-into' || props.isTableMenuVisible"
          value="paragraph"
        >
          <Pilcrow />
          Paragraph
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="props.menuSource !== 'turn-into' || !props.isTableMenuVisible"
          value="table"
        >
          <Table2 />
          Table
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <template v-if="props.menuSource !== 'slash'">
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem value="delete-block">
            <Trash2 />
            Remove
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </template>

      <template v-if="props.isTableActionsEnabled">
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Table</DropdownMenuLabel>
          <DropdownMenuItem value="add-row-before">
            <BetweenHorizontalStart class="[&>rect:first-of-type]:stroke-primary" />
            Add Row Above
          </DropdownMenuItem>
          <DropdownMenuItem value="add-row-after">
            <BetweenHorizontalEnd class="[&>rect:last-of-type]:stroke-primary" />
            Add Row Below
          </DropdownMenuItem>
          <DropdownMenuItem v-if="props.canDeleteTableRow" value="delete-row">
            <Trash2 />
            Delete Row
          </DropdownMenuItem>
          <DropdownMenuItem value="add-column-before">
            <BetweenVerticalStart class="[&>rect:first-of-type]:stroke-primary" />
            Add Column Left
          </DropdownMenuItem>
          <DropdownMenuItem value="add-column-after">
            <BetweenVerticalEnd class="[&>rect:last-of-type]:stroke-primary" />
            Add Column Right
          </DropdownMenuItem>
          <DropdownMenuItem v-if="props.canDeleteTableColumn" value="delete-column">
            <Trash2 />
            Delete Column
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </template>
    </DropdownMenuContent>
  </DropdownMenuRoot>
</template>
