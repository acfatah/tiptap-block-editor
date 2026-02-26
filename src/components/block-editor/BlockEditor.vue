<script setup lang="ts">
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { DragHandle } from '@tiptap/extension-drag-handle-vue-3'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { CellSelection } from '@tiptap/pm/tables'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import BlockHandleButtons from '@/components/block-editor/BlockHandleButtons.vue'
import { createTableNodeContent, parseMarkdownTable } from '@/components/block-editor/composables/markdownTableParser'
import { isMenuCommand, useBlockCommands } from '@/components/block-editor/composables/useBlockCommands'
import { useSlashMenu } from '@/components/block-editor/composables/useSlashMenu'
import { useTableEdgeControls } from '@/components/block-editor/composables/useTableEdgeControls'
import { ActiveTableCell } from '@/components/block-editor/extensions/activeTableCell'
import FormatingMenu from '@/components/block-editor/FormatingMenu.vue'
import SlashMenu from '@/components/block-editor/SlashMenu.vue'
import TableEdgeControls from '@/components/block-editor/TableEdgeControls.vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const hoveredBlockPos = ref<number | null>(null)
const blockEditorElement = ref<HTMLElement | null>(null)
const formatingMenuRef = ref<InstanceType<typeof FormatingMenu> | null>(null)
const selectionTick = ref(0)
const isMouseDownInEditor = ref(false)
const shouldOpenTableMenuOnMouseUp = ref(false)
const isDragging = ref(false)

const {
  slashMenuOpen,
  slashMenuAnchorStyle,
  slashRange,
  slashMenuHighlightedValue,
  slashMenuSource,
  menuTargetBlockPos,
  isTableMenuVisible,
  isTableActionsEnabled,
  canDeleteTableRow,
  canDeleteTableColumn,
  syncMenuState,
  syncSlashMenu,
  onSlashMenuOpenChange,
  onSlashMenuHighlightedValueChange,
  getMenuLabel,
  openMenuFromHandle,
  openMenuFromTrigger,
  closeMenu,
} = useSlashMenu({
  hoveredBlockPos,
})

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder ?? '',
    }),
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
    handleKeyDown: (_, event) => {
      return onEditorKeyDown(event)
    },
    handlePaste: (_, event) => {
      return onEditorPaste(event)
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

    selectionTick.value += 1
  },
  onSelectionUpdate: () => {
    const currentEditor = editor.value
    if (!currentEditor)
      return

    syncMenuState(currentEditor)
    syncSlashMenu(currentEditor)
    queueOrOpenSlashMenuForTableSelection(currentEditor)

    selectionTick.value += 1
  },
  onTransaction: ({ transaction }) => {
    if (transaction.getMeta('history$')) {
      const currentEditor = editor.value
      if (currentEditor) {
        requestAnimationFrame(() => {
          currentEditor.commands.focus()
        })
      }
    }
  },
  onCreate: () => {
    const currentEditor = editor.value
    if (!currentEditor)
      return

    syncMenuState(currentEditor)
    syncSlashMenu(currentEditor)

    selectionTick.value += 1
  },
})

const isAnyMenuOpen = computed(() => {
  return slashMenuOpen.value
    || (formatingMenuRef.value?.shouldShowBubbleMenu ?? false)
})

function isTableRowOrColumnSelection(currentEditor: NonNullable<typeof editor.value>) {
  const { selection } = currentEditor.state

  if (!(selection instanceof CellSelection)) {
    return false
  }

  return selection.isRowSelection() || selection.isColSelection()
}

function maybeOpenSlashMenuForTableSelection(currentEditor: NonNullable<typeof editor.value>) {
  if (!isTableRowOrColumnSelection(currentEditor) || slashMenuOpen.value) {
    return
  }

  openMenuFromHandle(currentEditor, 'turn-into')
}

function queueOrOpenSlashMenuForTableSelection(currentEditor: NonNullable<typeof editor.value>) {
  const isRowOrColumnSelection = isTableRowOrColumnSelection(currentEditor)

  if (!isRowOrColumnSelection || slashMenuOpen.value) {
    shouldOpenTableMenuOnMouseUp.value = false

    return
  }

  if (isMouseDownInEditor.value) {
    shouldOpenTableMenuOnMouseUp.value = true

    return
  }

  maybeOpenSlashMenuForTableSelection(currentEditor)
}

function onBlockEditorMouseDown() {
  isMouseDownInEditor.value = true
}

function onGlobalMouseUp() {
  isMouseDownInEditor.value = false

  if (!shouldOpenTableMenuOnMouseUp.value) {
    return
  }

  shouldOpenTableMenuOnMouseUp.value = false

  const currentEditor = editor.value
  if (!currentEditor) {
    return
  }

  maybeOpenSlashMenuForTableSelection(currentEditor)
}

function onEditorPaste(event: ClipboardEvent) {
  const currentEditor = editor.value
  const clipboardData = event.clipboardData

  if (!currentEditor || !clipboardData) {
    return false
  }

  const htmlContent = clipboardData.getData('text/html').toLowerCase()

  if (htmlContent.includes('<table')) {
    return false
  }

  const plainText = clipboardData.getData('text/plain')
  const parsedTable = parseMarkdownTable(plainText)

  if (!parsedTable) {
    return false
  }

  event.preventDefault()
  currentEditor
    .chain()
    .focus()
    .insertContent(createTableNodeContent(parsedTable.rows, parsedTable.withHeaderRow))
    .run()

  return true
}

function onEditorKeyDown(event: KeyboardEvent) {
  const currentEditor = editor.value

  if (!currentEditor) {
    return false
  }

  if (event.key !== 'Tab') {
    return false
  }

  if (currentEditor.isActive('table')) {
    event.preventDefault()

    if (event.shiftKey) {
      currentEditor.commands.goToPreviousCell()
    }
    else {
      currentEditor.commands.goToNextCell()
    }

    return true
  }

  if (currentEditor.isActive('bulletList') || currentEditor.isActive('orderedList')) {
    event.preventDefault()

    if (event.shiftKey) {
      currentEditor.commands.liftListItem('listItem')
    }
    else {
      currentEditor.commands.sinkListItem('listItem')
    }

    return true
  }

  if (currentEditor.isActive('paragraph') || currentEditor.isActive('codeBlock')) {
    event.preventDefault()

    // Insert 4 non-breaking spaces as portable tab representation
    currentEditor.chain().focus().insertContent('\u00A0\u00A0\u00A0\u00A0').run()

    return true
  }

  return false
}

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
  isMenuOpen: isAnyMenuOpen,
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

function onElementDragStart() {
  isDragging.value = true
}

function onElementDragEnd() {
  isDragging.value = false

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

function onSlashMenuOpenChangeWithFocus(open: boolean) {
  const currentEditor = editor.value
  const range = slashRange.value

  onSlashMenuOpenChange(open)

  if (open || !currentEditor) {
    return
  }

  requestAnimationFrame(() => {
    currentEditor.commands.focus()

    if (range) {
      currentEditor.commands.setTextSelection(range.to)
    }
  })
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
  window.removeEventListener('mouseup', onGlobalMouseUp)
  resetTableEdgeButtons()
  editor.value?.destroy()
})

onMounted(() => {
  window.addEventListener('mouseup', onGlobalMouseUp)
})
</script>

<template>
  <div
    ref="blockEditorElement"
    class="block-editor"
    @mousedown="onBlockEditorMouseDown"
    @mousemove="onBlockEditorMouseMove"
    @mouseleave="resetTableEdgeButtons"
  >
    <EditorContent :editor="editor" class="editor-content" />
    <FormatingMenu
      v-if="editor"
      ref="formatingMenuRef"
      :editor="editor"
      :selection-tick="selectionTick"
      :is-dragging="isDragging"
    />
    <SlashMenu
      :open="slashMenuOpen"
      :highlighted-value="slashMenuHighlightedValue"
      :anchor-style="slashMenuAnchorStyle"
      :menu-source="slashMenuSource"
      :is-table-menu-visible="isTableMenuVisible"
      :is-table-actions-enabled="isTableActionsEnabled"
      :can-delete-table-row="canDeleteTableRow"
      :can-delete-table-column="canDeleteTableColumn"
      :menu-label="getMenuLabel()"
      @update:open="onSlashMenuOpenChangeWithFocus"
      @update:highlighted-value="onSlashMenuHighlightedValueChange"
      @select="onSlashMenuSelect"
    />

    <DragHandle
      v-if="editor"
      :editor="editor"
      class="z-20 flex -translate-x-[0.35rem] gap-(--handle-gap)"
      :compute-position-config="{ placement: 'left-start', middleware: [] }"
      :on-element-drag-start="onElementDragStart"
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

.editor-content :deep(.ProseMirror.simple-editor) {
  white-space: pre-wrap;
  tab-size: 4;
}

.editor-content :deep(.ProseMirror > *) {
  margin-block: 0.3rem;
}

.editor-content :deep(.ProseMirror ul),
.editor-content :deep(.ProseMirror ol) {
  margin-block: 0.4rem;
  padding-left: 1.5rem;
}

.editor-content :deep(.ProseMirror ul) {
  list-style-type: disc;
}

.editor-content :deep(.ProseMirror ol) {
  --ordered-marker-width: 2.4rem;
  list-style: none;
  padding-left: var(--ordered-marker-width);
  counter-reset: list-item;
}

.editor-content :deep(.ProseMirror ol li) {
  counter-increment: list-item;
  position: relative;
}

.editor-content :deep(.ProseMirror ol li::before) {
  content: counters(list-item, '.') '. ';
  position: absolute;
  left: calc(var(--ordered-marker-width) * -1);
  width: calc(var(--ordered-marker-width) - 0.3rem);
  text-align: right;
  white-space: nowrap;
}

.editor-content :deep(.ProseMirror ol ol),
.editor-content :deep(.ProseMirror ol ol ol) {
  list-style: none;
  padding-left: var(--ordered-marker-width);
  counter-reset: list-item;
}

.editor-content :deep(.ProseMirror ol ol li::before) {
  content: counters(list-item, '.') ' ';
}

.editor-content :deep(.ProseMirror ol ol ol ol) {
  list-style: decimal;
  padding-left: 1.5rem;
  counter-reset: none;
}

.editor-content :deep(.ProseMirror ol ol ol ol li::before) {
  content: none;
}

.editor-content :deep(.ProseMirror li) {
  margin-block: 0.25rem;
}

.editor-content :deep(.ProseMirror li > p) {
  margin: 0;
}

.editor-content :deep(.ProseMirror li > ul),
.editor-content :deep(.ProseMirror li > ol) {
  margin-top: 0.35rem;
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
  position: relative;
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

.editor-content :deep(.ProseMirror .column-resize-handle) {
  background-color: var(--primary);
  bottom: 0;
  pointer-events: none;
  position: absolute;
  right: -2px;
  top: 0;
  width: 4px;
  z-index: 20;
}

.editor-content :deep(.ProseMirror.resize-cursor),
.editor-content :deep(.ProseMirror.resize-cursor *) {
  cursor: col-resize !important;
}

.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: var(--muted-foreground);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
