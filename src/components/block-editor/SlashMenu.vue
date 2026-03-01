<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'

import {
  List,
  ListOrdered,
  Pilcrow,
  Table2,
} from 'lucide-vue-next'
import { onBeforeUnmount, toRef } from 'vue'

import { isMenuCommand, useBlockCommands } from '@/components/block-editor/composables/useBlockCommands'
import { useSlashMenu } from '@/components/block-editor/composables/useSlashMenu'
import TableActionsMenu from '@/components/block-editor/TableActionsMenu.vue'
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
  slashMenuOpen,
  slashMenuAnchorStyle,
  slashRange,
  slashMenuHighlightedValue,
  isTableActionsEnabled,
  canDeleteTableRow,
  canDeleteTableColumn,
  syncMenuState,
  syncSlashMenu,
  onSlashMenuOpenChange,
  onSlashMenuHighlightedValueChange,
  closeMenu,
} = useSlashMenu()

const { executeMenuCommand } = useBlockCommands({ editor: editorRef })

function onEditorUpdate() {
  syncMenuState(props.editor)
  syncSlashMenu(props.editor)
}

function onEditorSelectionUpdate() {
  syncMenuState(props.editor)
  syncSlashMenu(props.editor)
}

props.editor.on('update', onEditorUpdate)
props.editor.on('selectionUpdate', onEditorSelectionUpdate)
props.editor.on('create', onEditorUpdate)

onBeforeUnmount(() => {
  props.editor.off('update', onEditorUpdate)
  props.editor.off('selectionUpdate', onEditorSelectionUpdate)
  props.editor.off('create', onEditorUpdate)
})

function onOpenChange(open: boolean) {
  const range = slashRange.value

  onSlashMenuOpenChange(open)

  if (open) {
    return
  }

  requestAnimationFrame(() => {
    props.editor.commands.focus()

    if (range) {
      props.editor.commands.setTextSelection(range.to)
    }
  })
}

function onSelect(details: { value: string }) {
  if (!isMenuCommand(details.value)) {
    return
  }

  executeMenuCommand(details.value, {
    source: 'slash',
    slashRange: slashRange.value,
    targetBlockPos: null,
  })

  closeMenu()
}

defineExpose({
  isOpen: slashMenuOpen,
  close: closeMenu,
})
</script>

<template>
  <DropdownMenuRoot
    :open="slashMenuOpen"
    :highlighted-value="slashMenuHighlightedValue ?? undefined"
    @update:open="onOpenChange"
    @update:highlighted-value="onSlashMenuHighlightedValueChange"
    @select="onSelect"
  >
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        tabindex="-1"
        class="pointer-events-none fixed z-30 size-px opacity-0"
        :style="slashMenuAnchorStyle"
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent
      class="w-44"
    >
      <DropdownMenuGroup>
        <DropdownMenuLabel>Insert</DropdownMenuLabel>
        <DropdownMenuItem value="paragraph">
          <Pilcrow />
          Paragraph
        </DropdownMenuItem>
        <DropdownMenuItem value="table">
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

      <TableActionsMenu
        :is-enabled="isTableActionsEnabled"
        :can-delete-row="canDeleteTableRow"
        :can-delete-column="canDeleteTableColumn"
      />
    </DropdownMenuContent>
  </DropdownMenuRoot>
</template>
