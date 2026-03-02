<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'

import {
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Trash2,
} from 'lucide-vue-next'
import { toRef } from 'vue'

import { isMenuCommand, useBlockCommands } from '@/components/block-editor/composables/useBlockCommands'
import { useTableSelectionMenu } from '@/components/block-editor/composables/useTableSelectionMenu'
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const props = defineProps<{
  editor: Editor
}>()

const editorRef = toRef(props, 'editor')

const {
  menuOpen,
  menuAnchorStyle,
  highlightedValue,
  canDeleteTableRow,
  canDeleteTableColumn,
  openMenu,
  closeMenu,
  onMenuOpenChange,
  onHighlightedValueChange,
} = useTableSelectionMenu()

const { executeMenuCommand } = useBlockCommands({ editor: editorRef })

function onOpenChange(open: boolean) {
  onMenuOpenChange(open)

  if (open) {
    return
  }

  requestAnimationFrame(() => {
    props.editor.commands.focus()
  })
}

function onSelect(details: { value: string }) {
  if (!isMenuCommand(details.value)) {
    return
  }

  executeMenuCommand(details.value, {
    source: 'turn-into',
    slashRange: null,
    targetBlockPos: null,
  })

  closeMenu()
}

function openMenuForTableSelection() {
  openMenu(props.editor)
}

defineExpose({
  isMenuOpen: menuOpen,
  openMenuForTableSelection,
})
</script>

<template>
  <DropdownMenuRoot
    :open="menuOpen"
    :highlighted-value="highlightedValue ?? undefined"
    @update:open="onOpenChange"
    @update:highlighted-value="onHighlightedValueChange"
    @select="onSelect"
  >
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        tabindex="-1"
        class="pointer-events-none fixed z-30 size-px opacity-0"
        :style="menuAnchorStyle"
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent class="w-44">
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
        <DropdownMenuItem v-if="canDeleteTableRow" value="delete-row">
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
        <DropdownMenuItem v-if="canDeleteTableColumn" value="delete-column">
          <Trash2 />
          Delete Column
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenuRoot>
</template>
