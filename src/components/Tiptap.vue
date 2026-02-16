<script setup lang="ts">
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { DragHandle } from '@tiptap/extension-drag-handle-vue-3'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { GripVertical, Pilcrow, Plus, Table2 } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

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
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const hoveredBlockPos = ref<number | null>(null)
const slashMenuOpen = ref(false)
const slashMenuPosition = ref({ x: 0, y: 0 })
const slashRange = ref<{ from: number, to: number } | null>(null)
const slashMenuHighlightedValue = ref<string | null>(null)
const slashMenuSource = ref<'slash' | 'insert' | 'turn-into' | null>(null)
const menuTargetBlockPos = ref<number | null>(null)
const isTableMenuVisible = ref(false)

const slashMenuAnchorStyle = computed(() => ({
  left: `${slashMenuPosition.value.x}px`,
  top: `${slashMenuPosition.value.y}px`,
}))

type BlockCommand = 'paragraph' | 'table'
type TableCommand = 'add-row-before' | 'add-row-after' | 'delete-row' | 'add-column-before' | 'add-column-after' | 'delete-column'
type MenuCommand = BlockCommand | TableCommand
const firstSlashMenuItem: MenuCommand = 'paragraph'

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
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
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
    syncMenuState(editor)
    syncSlashMenu(editor)
  },
  onSelectionUpdate: ({ editor }) => {
    syncMenuState(editor)
    syncSlashMenu(editor)
  },
  onCreate: ({ editor }) => {
    syncMenuState(editor)
    syncSlashMenu(editor)
  },
})

function onNodeChange(data: { node: ProseMirrorNode | null, pos: number }) {
  hoveredBlockPos.value = data?.node ? data.pos : null
}

function syncMenuState(currentEditor: NonNullable<typeof editor.value>) {
  isTableMenuVisible.value = currentEditor.isActive('table')
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

function getSlashRange() {
  const currentEditor = editor.value

  if (!currentEditor || !currentEditor.state.selection.empty) {
    return null
  }

  const { $from } = currentEditor.state.selection
  const textBeforeCursor = $from.parent.textBetween(0, $from.parentOffset, undefined, '\uFFFC')
  const slashIndex = textBeforeCursor.lastIndexOf('/')

  if (slashIndex === -1) {
    return null
  }

  const commandText = textBeforeCursor.slice(slashIndex)
  if (!/^\/[\w-]*$/.test(commandText)) {
    return null
  }

  if (slashIndex > 0 && !/\s/.test(textBeforeCursor[slashIndex - 1])) {
    return null
  }

  const from = $from.start() + slashIndex
  const to = $from.pos

  return { from, to }
}

function syncSlashMenu(currentEditor: NonNullable<typeof editor.value>) {
  const range = getSlashRange()

  if (!range) {
    if (slashMenuSource.value === 'slash') {
      slashRange.value = null
      slashMenuOpen.value = false
      slashMenuHighlightedValue.value = null
      slashMenuSource.value = null
      menuTargetBlockPos.value = null
    }

    return
  }

  const coords = currentEditor.view.coordsAtPos(range.to)
  slashMenuSource.value = 'slash'
  menuTargetBlockPos.value = null
  slashRange.value = range
  slashMenuPosition.value = {
    x: coords.left,
    y: coords.bottom + 6,
  }

  if (!slashMenuOpen.value) {
    slashMenuHighlightedValue.value = firstSlashMenuItem
  }

  slashMenuOpen.value = true
}

function onSlashMenuOpenChange(open: boolean) {
  slashMenuOpen.value = open

  if (open) {
    slashMenuHighlightedValue.value = firstSlashMenuItem

    return
  }

  if (!open) {
    slashRange.value = null
    slashMenuHighlightedValue.value = null
    slashMenuSource.value = null
    menuTargetBlockPos.value = null
  }
}

function onSlashMenuHighlightedValueChange(value: string | null) {
  slashMenuHighlightedValue.value = value
}

function onSlashMenuSelect(details: { value: string }) {
  if (
    details.value === 'paragraph'
    || details.value === 'table'
    || details.value === 'add-row-before'
    || details.value === 'add-row-after'
    || details.value === 'delete-row'
    || details.value === 'add-column-before'
    || details.value === 'add-column-after'
    || details.value === 'delete-column'
  ) {
    executeMenuCommand(details.value)
  }
}

function getMenuLabel() {
  if (slashMenuSource.value === 'turn-into') {
    return 'Turn into'
  }

  return 'Insert'
}

function getHoveredBlockInsertPos(currentEditor: NonNullable<typeof editor.value>) {
  const pos = menuTargetBlockPos.value

  if (pos === null) {
    return null
  }

  const node = currentEditor.state.doc.nodeAt(pos)
  if (!node) {
    return null
  }

  return pos + node.nodeSize
}

function resolveBlockTargetPos(currentEditor: NonNullable<typeof editor.value>) {
  if (hoveredBlockPos.value !== null) {
    return hoveredBlockPos.value
  }

  const { $from } = currentEditor.state.selection
  if ($from.depth < 1) {
    return null
  }

  return $from.before(1)
}

function onDragHandleClick(event: MouseEvent) {
  const currentEditor = editor.value
  if (!currentEditor) {
    return
  }

  syncMenuState(currentEditor)

  const trigger = event.currentTarget
  if (!(trigger instanceof HTMLElement)) {
    return
  }

  const rect = trigger.getBoundingClientRect()
  slashMenuPosition.value = {
    x: rect.left,
    y: rect.bottom + 6,
  }
  slashRange.value = null
  menuTargetBlockPos.value = resolveBlockTargetPos(currentEditor)
  slashMenuSource.value = 'turn-into'
  slashMenuHighlightedValue.value = firstSlashMenuItem
  slashMenuOpen.value = true
}

function onAddHandleClick(event: MouseEvent) {
  const currentEditor = editor.value
  if (!currentEditor) {
    return
  }

  syncMenuState(currentEditor)

  const trigger = event.currentTarget
  if (!(trigger instanceof HTMLElement)) {
    return
  }

  const rect = trigger.getBoundingClientRect()
  slashMenuPosition.value = {
    x: rect.left,
    y: rect.bottom + 6,
  }
  slashRange.value = null
  menuTargetBlockPos.value = resolveBlockTargetPos(currentEditor)
  slashMenuSource.value = 'insert'
  slashMenuHighlightedValue.value = firstSlashMenuItem
  slashMenuOpen.value = true
}

function createTableNode() {
  return {
    type: 'table',
    content: [
      {
        type: 'tableRow',
        content: [
          { type: 'tableHeader', content: [{ type: 'paragraph' }] },
          { type: 'tableHeader', content: [{ type: 'paragraph' }] },
          { type: 'tableHeader', content: [{ type: 'paragraph' }] },
        ],
      },
      {
        type: 'tableRow',
        content: [
          { type: 'tableCell', content: [{ type: 'paragraph' }] },
          { type: 'tableCell', content: [{ type: 'paragraph' }] },
          { type: 'tableCell', content: [{ type: 'paragraph' }] },
        ],
      },
      {
        type: 'tableRow',
        content: [
          { type: 'tableCell', content: [{ type: 'paragraph' }] },
          { type: 'tableCell', content: [{ type: 'paragraph' }] },
          { type: 'tableCell', content: [{ type: 'paragraph' }] },
        ],
      },
    ],
  }
}

function executeTurnIntoCommand(command: BlockCommand) {
  const currentEditor = editor.value
  const pos = menuTargetBlockPos.value

  if (!currentEditor || pos === null) {
    return
  }

  const node = currentEditor.state.doc.nodeAt(pos)
  if (!node) {
    return
  }

  const from = pos
  const to = pos + node.nodeSize

  if (command === 'table') {
    currentEditor.chain().focus().deleteRange({ from, to }).insertContentAt(from, createTableNode()).run()
    currentEditor.commands.setTextSelection(from + 4)
  }
  else {
    currentEditor.chain().focus().deleteRange({ from, to }).insertContentAt(from, { type: 'paragraph' }).run()
    currentEditor.commands.setTextSelection(from + 1)
  }
}

function executeTableCommand(command: TableCommand) {
  const currentEditor = editor.value
  if (!currentEditor) {
    return
  }

  const chain = currentEditor.chain().focus()

  if (command === 'add-row-before') {
    chain.addRowBefore().run()
  }
  else if (command === 'add-row-after') {
    chain.addRowAfter().run()
  }
  else if (command === 'delete-row') {
    chain.deleteRow().run()
  }
  else if (command === 'add-column-before') {
    chain.addColumnBefore().run()
  }
  else if (command === 'add-column-after') {
    chain.addColumnAfter().run()
  }
  else {
    chain.deleteColumn().run()
  }
}

function executeBlockCommand(command: BlockCommand) {
  const currentEditor = editor.value
  const range = slashRange.value

  if (!currentEditor) {
    return
  }

  if (slashMenuSource.value === 'turn-into') {
    executeTurnIntoCommand(command)
  }
  else if (range) {
    const chain = currentEditor.chain().focus().deleteRange(range)

    if (command === 'table') {
      chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
    }
    else {
      chain.setParagraph()
    }

    chain.run()
  }
  else {
    const insertPos = getHoveredBlockInsertPos(currentEditor) ?? currentEditor.state.selection.from

    if (command === 'table') {
      currentEditor.chain().focus().setTextSelection(insertPos).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }
    else {
      currentEditor.chain().focus().insertContentAt(insertPos, { type: 'paragraph' }).run()
      currentEditor.commands.setTextSelection(insertPos + 1)
    }
  }
}

function executeMenuCommand(command: MenuCommand) {
  if (
    command === 'add-row-before'
    || command === 'add-row-after'
    || command === 'delete-row'
    || command === 'add-column-before'
    || command === 'add-column-after'
    || command === 'delete-column'
  ) {
    executeTableCommand(command)
  }
  else {
    executeBlockCommand(command)
  }

  slashMenuOpen.value = false
  slashRange.value = null
  slashMenuHighlightedValue.value = null
  slashMenuSource.value = null
  menuTargetBlockPos.value = null
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
  editor.value?.destroy()
})
</script>

<template>
  <div class="block-editor">
    <EditorContent :editor="editor" class="editor-content" />

    <DropdownMenuRoot
      :open="slashMenuOpen"
      :highlighted-value="slashMenuHighlightedValue"
      @update:open="onSlashMenuOpenChange"
      @update:highlighted-value="onSlashMenuHighlightedValueChange"
      @select="onSlashMenuSelect"
    >
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          aria-hidden="true"
          tabindex="-1"
          class="slash-menu-anchor"
          :style="slashMenuAnchorStyle"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="bottom" align="start" class="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{{ getMenuLabel() }}</DropdownMenuLabel>
          <DropdownMenuItem value="paragraph">
            <Pilcrow :size="14" />
            Paragraph
          </DropdownMenuItem>
          <DropdownMenuItem value="table">
            <Table2 :size="14" />
            Table
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <template v-if="isTableMenuVisible">
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

    <DragHandle
      v-if="editor"
      :editor="editor"
      class="block-handle"
      :compute-position-config="{ placement: 'left-start', middleware: [] }"
      :on-element-drag-end="onElementDragEnd"
      :on-node-change="onNodeChange"
    >
      <button
        type="button"
        class="block-handle-button"
        aria-label="Insert block"
        @mousedown.prevent
        @click.stop="onAddHandleClick"
      >
        <Plus :size="14" />
      </button>

      <button
        type="button"
        class="block-handle-button"
        aria-label="Drag block"
        draggable="true"
        @click.stop="onDragHandleClick"
      >
        <GripVertical :size="14" />
      </button>
    </DragHandle>
  </div>
</template>

<style scoped>
.block-editor {
  --block-gutter: 2rem;
  --handle-size: 1.5rem;
  --handle-gap: 0.25rem;
  position: relative;
}

.slash-menu-anchor {
  position: fixed;
  z-index: 30;
  height: 1px;
  width: 1px;
  opacity: 0;
  pointer-events: none;
}

.block-handle {
  z-index: 20;
  display: flex;
  gap: var(--handle-gap);
  transform: translateX(-0.35rem);
}

.block-handle-button {
  display: inline-flex;
  height: var(--handle-size);
  width: var(--handle-size);
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted-foreground);
  transition: background-color 0.15s ease;
}

.block-handle-button:hover {
  background: var(--accent);
  color: var(--accent-foreground);
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
</style>
