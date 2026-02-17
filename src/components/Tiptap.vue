<script setup lang="ts">
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { DragHandle } from '@tiptap/extension-drag-handle-vue-3'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { onBeforeUnmount, ref, watch } from 'vue'

import BlockHandleButtons from '@/components/tiptap/BlockHandleButtons.vue'
import { isMenuCommand, useBlockCommands } from '@/components/tiptap/composables/useBlockCommands'
import { useSlashMenu } from '@/components/tiptap/composables/useSlashMenu'
import { useTableEdgeControls } from '@/components/tiptap/composables/useTableEdgeControls'
import { ActiveTableCell } from '@/components/tiptap/extensions/activeTableCell'
import SlashMenu from '@/components/tiptap/SlashMenu.vue'
import TableEdgeControls from '@/components/tiptap/TableEdgeControls.vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const hoveredBlockPos = ref<number | null>(null)
const blockEditorElement = ref<HTMLElement | null>(null)

const {
  slashMenuOpen,
  slashMenuAnchorStyle,
  slashRange,
  slashMenuHighlightedValue,
  slashMenuSource,
  menuTargetBlockPos,
  isTableMenuVisible,
  syncMenuState,
  syncSlashMenu,
  onSlashMenuOpenChange,
  onSlashMenuHighlightedValueChange,
  getMenuLabel,
  openMenuFromTrigger,
  closeMenu,
} = useSlashMenu({
  hoveredBlockPos,
})

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    ActiveTableCell,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
  ],
  editorProps: {
    attributes: {
      class: 'simple-editor',
    },
  },
  onUpdate: ({ editor: coreEditor }) => {
    emit('update:modelValue', coreEditor.getHTML())

    const currentEditor = editor.value
    if (!currentEditor) {
      return
    }

    syncMenuState(currentEditor)
    syncSlashMenu(currentEditor)
  },
  onSelectionUpdate: () => {
    const currentEditor = editor.value
    if (!currentEditor)
      return

    syncMenuState(currentEditor)
    syncSlashMenu(currentEditor)
  },
  onCreate: () => {
    const currentEditor = editor.value
    if (!currentEditor)
      return

    syncMenuState(currentEditor)
    syncSlashMenu(currentEditor)
  },
})

const {
  showAddColumnButton,
  showAddRowButton,
  addColumnButtonStyle,
  addRowButtonStyle,
  addColumnRailStyle,
  addRowRailStyle,
  onBlockEditorMouseMove,
  resetTableEdgeButtons,
  onAddColumnFromEdge,
  onAddRowFromEdge,
} = useTableEdgeControls({
  editor,
  container: blockEditorElement,
})

const { executeMenuCommand } = useBlockCommands({
  editor,
  slashRange,
  slashMenuSource,
  menuTargetBlockPos,
})

function onNodeChange(data: { node: ProseMirrorNode | null, pos: number }) {
  hoveredBlockPos.value = data?.node ? data.pos : null
}

function onElementDragEnd() {
  const currentEditor = editor.value
  if (!currentEditor) {
    return
  }

  requestAnimationFrame(() => {
    currentEditor.commands.focus()
    const { from } = currentEditor.state.selection
    currentEditor.commands.setTextSelection(from)
  })
}

function onSlashMenuSelect(details: { value: string }) {
  if (!isMenuCommand(details.value)) {
    return
  }

  executeMenuCommand(details.value)
  closeMenu()
}

function onDragHandleClick(event: MouseEvent) {
  const currentEditor = editor.value
  if (!currentEditor) {
    return
  }

  openMenuFromTrigger(currentEditor, event, 'turn-into')
}

function onAddHandleClick(event: MouseEvent) {
  const currentEditor = editor.value
  if (!currentEditor) {
    return
  }

  openMenuFromTrigger(currentEditor, event, 'insert')
}

watch(
  () => props.modelValue,
  (value) => {
    const currentEditor = editor.value
    if (!currentEditor) {
      return
    }

    if (currentEditor.getHTML() !== value) {
      currentEditor.commands.setContent(value, { emitUpdate: false })
    }
  },
)

onBeforeUnmount(() => {
  resetTableEdgeButtons()
  editor.value?.destroy()
})
</script>

<template>
  <div
    ref="blockEditorElement"
    class="block-editor"
    @mousemove="onBlockEditorMouseMove"
    @mouseleave="resetTableEdgeButtons"
  >
    <EditorContent :editor="editor" class="editor-content" />
    <SlashMenu
      :open="slashMenuOpen"
      :highlighted-value="slashMenuHighlightedValue"
      :anchor-style="slashMenuAnchorStyle"
      :menu-source="slashMenuSource"
      :is-table-menu-visible="isTableMenuVisible"
      :menu-label="getMenuLabel()"
      @update:open="onSlashMenuOpenChange"
      @update:highlighted-value="onSlashMenuHighlightedValueChange"
      @select="onSlashMenuSelect"
    />

    <DragHandle
      v-if="editor"
      :editor="editor"
      class="z-20 flex -translate-x-[0.35rem] gap-(--handle-gap)"
      :compute-position-config="{ placement: 'left-start', middleware: [] }"
      :on-element-drag-end="onElementDragEnd"
      :on-node-change="onNodeChange"
    >
      <BlockHandleButtons
        @add="onAddHandleClick"
        @drag="onDragHandleClick"
      />
    </DragHandle>
    <TableEdgeControls
      :show-add-column-button="showAddColumnButton"
      :show-add-row-button="showAddRowButton"
      :add-column-button-style="addColumnButtonStyle"
      :add-row-button-style="addRowButtonStyle"
      :add-column-rail-style="addColumnRailStyle"
      :add-row-rail-style="addRowRailStyle"
      @add-column="onAddColumnFromEdge"
      @add-row="onAddRowFromEdge"
    />
  </div>
</template>

<style scoped>
.block-editor {
  --block-gutter: 2rem;
  --handle-size: 1.5rem;
  --handle-gap: 0.25rem;
  position: relative;
}

.editor-content :deep(.ProseMirror) {
  min-height: 12rem;
  padding-left: var(--block-gutter);
}

.editor-content :deep(.ProseMirror > *) {
  margin-block: 0.3rem;
}

.editor-content :deep(.ProseMirror table) {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.editor-content :deep(.ProseMirror th),
.editor-content :deep(.ProseMirror td) {
  border: 1px solid var(--border);
  padding: 0.4rem 0.5rem;
  vertical-align: top;
}

.editor-content :deep(.ProseMirror-hideselection *::selection) {
  color: inherit;
  -webkit-text-fill-color: inherit;
}

.editor-content :deep(.ProseMirror-hideselection .ProseMirror-selectednode),
.editor-content :deep(.ProseMirror-hideselection .ProseMirror-selectednode *) {
  opacity: 1;
  color: inherit;
}

.editor-content :deep(.ProseMirror-hideselection .ProseMirror-selectednode) {
  outline: none;
}

.editor-content :deep(.ProseMirror td.selectedCell),
.editor-content :deep(.ProseMirror th.selectedCell) {
  background: color-mix(in srgb, var(--primary) 18%, transparent);
  box-shadow: inset 0 0 0 2px var(--primary);
}
</style>
