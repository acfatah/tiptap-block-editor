<script setup lang="ts">
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { CellSelection } from '@tiptap/pm/tables'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { createTableNodeContent, parseMarkdownTable } from '@/components/block-editor/composables/markdownTableParser'
import { useTableEdgeControls } from '@/components/block-editor/composables/useTableEdgeControls'
import DragHandleMenu from '@/components/block-editor/DragHandleMenu.vue'
import { ActiveTableCell } from '@/components/block-editor/extensions/activeTableCell'
import FormatingMenu from '@/components/block-editor/FormatingMenu.vue'
import SlashMenu from '@/components/block-editor/SlashMenu.vue'
import TableEdgeControls from '@/components/block-editor/TableEdgeControls.vue'
import TableSelectionMenu from '@/components/block-editor/TableSelectionMenu.vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const blockEditorElement = ref<HTMLElement | null>(null)
const slashMenuRef = ref<InstanceType<typeof SlashMenu> | null>(null)
const dragHandleMenuRef = ref<InstanceType<typeof DragHandleMenu> | null>(null)
const tableSelectionMenuRef = ref<InstanceType<typeof TableSelectionMenu> | null>(null)
const formatingMenuRef = ref<InstanceType<typeof FormatingMenu> | null>(null)
const selectionTick = ref(0)
const isMouseDownInEditor = ref(false)
const shouldOpenTableMenuOnMouseUp = ref(false)
const refreshEdgeButtonPositionsRef = ref<() => void>(() => {})

const isDragging = computed(() => dragHandleMenuRef.value?.isDragging ?? false)

function refreshTableEdgeButtons() {
  refreshEdgeButtonPositionsRef.value()
}

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
    selectionTick.value += 1
    refreshTableEdgeButtons()
  },
  onSelectionUpdate: () => {
    const currentEditor = editor.value
    if (!currentEditor)
      return

    queueOrOpenMenuForTableSelection(currentEditor)
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
    selectionTick.value += 1
  },
})

const isAnyMenuOpen = computed(() => {
  return (slashMenuRef.value?.isOpen ?? false)
    || (dragHandleMenuRef.value?.isMenuOpen ?? false)
    || (tableSelectionMenuRef.value?.isMenuOpen ?? false)
    || (formatingMenuRef.value?.shouldShowBubbleMenu ?? false)
})

function isTableRowOrColumnSelection(currentEditor: NonNullable<typeof editor.value>) {
  const { selection } = currentEditor.state

  if (!(selection instanceof CellSelection)) {
    return false
  }

  return selection.isRowSelection() || selection.isColSelection()
}

function isAnyDropdownMenuOpen() {
  return (slashMenuRef.value?.isOpen ?? false)
    || (dragHandleMenuRef.value?.isMenuOpen ?? false)
    || (tableSelectionMenuRef.value?.isMenuOpen ?? false)
}

function maybeOpenMenuForTableSelection(currentEditor: NonNullable<typeof editor.value>) {
  if (!isTableRowOrColumnSelection(currentEditor) || isAnyDropdownMenuOpen()) {
    return
  }

  tableSelectionMenuRef.value?.openMenuForTableSelection()
}

function queueOrOpenMenuForTableSelection(currentEditor: NonNullable<typeof editor.value>) {
  const isRowOrColumnSelection = isTableRowOrColumnSelection(currentEditor)

  if (!isRowOrColumnSelection || isAnyDropdownMenuOpen()) {
    shouldOpenTableMenuOnMouseUp.value = false

    return
  }

  if (isMouseDownInEditor.value) {
    shouldOpenTableMenuOnMouseUp.value = true

    return
  }

  maybeOpenMenuForTableSelection(currentEditor)
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

  maybeOpenMenuForTableSelection(currentEditor)
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
  refreshEdgeButtonPositions: refreshEdgeButtonPositionsFromControls,
  resetTableEdgeButtons,
  onAddColumnFromEdge,
  onAddRowFromEdge,
} = useTableEdgeControls({
  editor,
  container: blockEditorElement,
  isMenuOpen: isAnyMenuOpen,
})

refreshEdgeButtonPositionsRef.value = refreshEdgeButtonPositionsFromControls

function onDragHandleMenuOpen() {
  slashMenuRef.value?.close()
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
      v-if="editor"
      ref="slashMenuRef"
      :editor="editor"
    />
    <DragHandleMenu
      v-if="editor"
      ref="dragHandleMenuRef"
      :editor="editor"
      @menu-open="onDragHandleMenuOpen"
    />
    <TableSelectionMenu
      v-if="editor"
      ref="tableSelectionMenuRef"
      :editor="editor"
    />
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
