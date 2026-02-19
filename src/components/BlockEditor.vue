<script setup lang="ts">
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { DragHandle } from '@tiptap/extension-drag-handle-vue-3'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { CellSelection } from '@tiptap/pm/tables'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import { Bold, Italic, Strikethrough, Underline as UnderlineIcon } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import BlockHandleButtons from '@/components/block-editor/BlockHandleButtons.vue'
import { createTableNodeContent, parseMarkdownTable } from '@/components/block-editor/composables/markdownTableParser'
import { isMenuCommand, useBlockCommands } from '@/components/block-editor/composables/useBlockCommands'
import { useSlashMenu } from '@/components/block-editor/composables/useSlashMenu'
import { useTableEdgeControls } from '@/components/block-editor/composables/useTableEdgeControls'
import { ActiveTableCell } from '@/components/block-editor/extensions/activeTableCell'
import SlashMenu from '@/components/block-editor/SlashMenu.vue'
import TableEdgeControls from '@/components/block-editor/TableEdgeControls.vue'
import { ToggleGroup } from '@/components/ui/toggle-group'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const hoveredBlockPos = ref<number | null>(null)
const blockEditorElement = ref<HTMLElement | null>(null)
const selectionTick = ref(0)
const isMouseDownInEditor = ref(false)
const shouldOpenTableMenuOnMouseUp = ref(false)

const bubbleMenuItems = [
  { value: 'bold', label: 'Bold', icon: Bold },
  { value: 'italic', label: 'Italic', icon: Italic },
  { value: 'underline', label: 'Underline', icon: UnderlineIcon },
  { value: 'strike', label: 'Strikethrough', icon: Strikethrough },
]

type MarkValue = (typeof bubbleMenuItems)[number]['value']

const {
  slashMenuOpen,
  slashMenuAnchorStyle,
  slashRange,
  slashMenuHighlightedValue,
  slashMenuSource,
  menuTargetBlockPos,
  isTableMenuVisible,
  isTableActionsEnabled,
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
  onCreate: () => {
    const currentEditor = editor.value
    if (!currentEditor)
      return

    syncMenuState(currentEditor)
    syncSlashMenu(currentEditor)

    selectionTick.value += 1
  },
})

const activeMarks = computed(() => {
  const selectionKey = selectionTick.value
  const currentEditor = editor.value

  if (!currentEditor || selectionKey < 0) {
    return []
  }

  return bubbleMenuItems
    .map(item => item.value)
    .filter(value => currentEditor.isActive(value))
})

const shouldShowBubbleMenu = computed(() => {
  const selectionKey = selectionTick.value
  const currentEditor = editor.value

  if (!currentEditor || selectionKey < 0 || currentEditor.state.selection.empty) {
    return false
  }

  return !isTableCellSelection(currentEditor)
})

const isAnyMenuOpen = computed(() => {
  return slashMenuOpen.value || shouldShowBubbleMenu.value
})

function isTableRowOrColumnSelection(currentEditor: NonNullable<typeof editor.value>) {
  const { selection } = currentEditor.state

  if (!(selection instanceof CellSelection)) {
    return false
  }

  return selection.isRowSelection() || selection.isColSelection()
}

function isTableCellSelection(currentEditor: NonNullable<typeof editor.value>) {
  return currentEditor.state.selection instanceof CellSelection
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

function shouldShowBubbleMenuForSelection() {
  return shouldShowBubbleMenu.value
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

  if (!currentEditor || event.key !== 'Tab') {
    return false
  }

  event.preventDefault()

  if (currentEditor.isActive('table')) {
    if (event.shiftKey) {
      currentEditor.commands.goToPreviousCell()
    }
    else {
      currentEditor.commands.goToNextCell()
    }

    return true
  }

  currentEditor.chain().focus().insertContent('\t').run()

  return true
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

function toggleMark(mark: MarkValue) {
  const currentEditor = editor.value
  if (!currentEditor) {
    return
  }

  const commandChain = currentEditor.chain().focus()

  switch (mark) {
    case 'bold':
      commandChain.toggleBold()
      break
    case 'italic':
      commandChain.toggleItalic()
      break
    case 'underline':
      commandChain.toggleUnderline()
      break
    case 'strike':
      commandChain.toggleStrike()
      break
  }

  commandChain.run()
}

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
    <BubbleMenu
      v-if="editor"
      :editor="editor"
      :tippy-options="{ duration: 120, placement: 'top' }"
      :should-show="shouldShowBubbleMenuForSelection"
    >
      <div
        class="rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      >
        <ToggleGroup.Root
          :model-value="activeMarks"
          multiple
          size="sm"
          variant="default"
          :spacing="4"
        >
          <ToggleGroup.Item
            v-for="item in bubbleMenuItems"
            :key="item.value"
            :value="item.value"
            type="button"
            :aria-label="item.label"
            @click="toggleMark(item.value)"
          >
            <component :is="item.icon" />
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
    </BubbleMenu>
    <SlashMenu
      :open="slashMenuOpen"
      :highlighted-value="slashMenuHighlightedValue"
      :anchor-style="slashMenuAnchorStyle"
      :menu-source="slashMenuSource"
      :is-table-menu-visible="isTableMenuVisible"
      :is-table-actions-enabled="isTableActionsEnabled"
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
