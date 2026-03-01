<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'

import { DragHandle } from '@tiptap/extension-drag-handle-vue-3'
import {
  List,
  ListOrdered,
  Pilcrow,
  Table2,
  Trash2,
} from 'lucide-vue-next'
import { toRef } from 'vue'

import BlockHandleButtons from '@/components/block-editor/BlockHandleButtons.vue'
import { isMenuCommand, useBlockCommands } from '@/components/block-editor/composables/useBlockCommands'
import { useDragHandleMenu } from '@/components/block-editor/composables/useDragHandleMenu'
import TableActionsMenu from '@/components/block-editor/TableActionsMenu.vue'
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const props = defineProps<{
  editor: Editor
}>()

const emit = defineEmits<{
  (event: 'menuOpen'): void
}>()

const editorRef = toRef(props, 'editor')

const {
  menuOpen,
  menuAnchorStyle,
  highlightedValue,
  menuSource,
  menuTargetBlockPos,
  hoveredBlockPos,
  isDragging,
  isTableContext,
  isTableActionsEnabled,
  canDeleteTableRow,
  canDeleteTableColumn,
  openMenuFromTrigger,
  openMenuFromHandle,
  onMenuOpenChange,
  onHighlightedValueChange,
  closeMenu,
  getMenuLabel,
  onNodeChange,
  onElementDragStart,
  onElementDragEnd,
} = useDragHandleMenu()

const { executeMenuCommand } = useBlockCommands({ editor: editorRef })

function onAddClick(event: MouseEvent) {
  openMenuFromTrigger(props.editor, event, 'insert')
  emit('menuOpen')
}

function onDragClick(event: MouseEvent) {
  openMenuFromTrigger(props.editor, event, 'turn-into')
  emit('menuOpen')
}

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
    source: menuSource.value ?? 'insert',
    slashRange: null,
    targetBlockPos: menuTargetBlockPos.value,
  })

  closeMenu()
}

function onDragEnd() {
  onElementDragEnd(props.editor)
}

function openMenuForTableSelection() {
  openMenuFromHandle(props.editor, 'turn-into')
  emit('menuOpen')
}

defineExpose({
  isMenuOpen: menuOpen,
  isDragging,
  hoveredBlockPos,
  openMenuForTableSelection,
})
</script>

<template>
  <DragHandle
    :editor="props.editor"
    class="z-20 flex -translate-x-[0.35rem] gap-(--handle-gap)"
    :compute-position-config="{ placement: 'left-start', middleware: [] }"
    :on-element-drag-start="onElementDragStart"
    :on-element-drag-end="onDragEnd"
    :on-node-change="onNodeChange"
  >
    <BlockHandleButtons
      @add="onAddClick"
      @drag="onDragClick"
    />
  </DragHandle>

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

    <DropdownMenuContent
      class="w-44"
    >
      <DropdownMenuGroup>
        <DropdownMenuLabel>{{ getMenuLabel() }}</DropdownMenuLabel>
        <DropdownMenuItem
          v-if="menuSource !== 'turn-into' || isTableContext"
          value="paragraph"
        >
          <Pilcrow />
          Paragraph
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="menuSource !== 'turn-into' || !isTableContext"
          value="table"
        >
          <Table2 />
          Table
        </DropdownMenuItem>
        <DropdownMenuItem value="bullet-list">
          <List />
          Bullet list
        </DropdownMenuItem>
        <DropdownMenuItem value="numbered-list">
          <ListOrdered />
          Numbered list
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem value="delete-block">
          <Trash2 />
          Remove
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <TableActionsMenu
        :is-enabled="isTableActionsEnabled"
        :can-delete-row="canDeleteTableRow"
        :can-delete-column="canDeleteTableColumn"
      />
    </DropdownMenuContent>
  </DropdownMenuRoot>
</template>
