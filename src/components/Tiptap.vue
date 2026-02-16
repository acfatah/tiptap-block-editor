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
  DropdownMenuItem,
  DropdownMenuRoot,
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

const slashMenuAnchorStyle = computed(() => ({
  left: `${slashMenuPosition.value.x}px`,
  top: `${slashMenuPosition.value.y}px`,
}))

type SlashCommand = 'paragraph' | 'table'

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
    syncSlashMenu(editor)
  },
  onSelectionUpdate: ({ editor }) => {
    syncSlashMenu(editor)
  },
  onCreate: ({ editor }) => {
    syncSlashMenu(editor)
  },
})

function onNodeChange(data: { node: ProseMirrorNode | null, pos: number }) {
  hoveredBlockPos.value = data?.node ? data.pos : null
}

function onAddBlock() {
  const currentEditor = editor.value
  const pos = hoveredBlockPos.value

  if (!currentEditor || pos === null) {
    return
  }

  const node = currentEditor.state.doc.nodeAt(pos)
  if (!node) {
    return
  }

  const insertPos = pos + node.nodeSize
  currentEditor.chain().focus().insertContentAt(insertPos, { type: 'paragraph' }).run()
  currentEditor.commands.setTextSelection(insertPos + 1)
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
    slashRange.value = null
    slashMenuOpen.value = false

    return
  }

  const coords = currentEditor.view.coordsAtPos(range.to)
  slashRange.value = range
  slashMenuPosition.value = {
    x: coords.left,
    y: coords.bottom + 6,
  }
  slashMenuOpen.value = true
}

function onSlashMenuOpenChange(open: boolean) {
  slashMenuOpen.value = open

  if (!open) {
    slashRange.value = null
  }
}

function onSlashMenuSelect(details: { value: string }) {
  if (details.value === 'paragraph' || details.value === 'table') {
    executeSlashCommand(details.value)
  }
}

function executeSlashCommand(command: SlashCommand) {
  const currentEditor = editor.value
  const range = slashRange.value

  if (!currentEditor || !range) {
    return
  }

  const chain = currentEditor.chain().focus().deleteRange(range)

  if (command === 'table') {
    chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
  }
  else {
    chain.setParagraph()
  }

  chain.run()
  slashMenuOpen.value = false
  slashRange.value = null
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
      @update:open="onSlashMenuOpenChange"
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
        <DropdownMenuItem value="paragraph">
          <Pilcrow :size="14" />
          Paragraph
        </DropdownMenuItem>
        <DropdownMenuItem value="table">
          <Table2 :size="14" />
          Table
        </DropdownMenuItem>
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
        @click="onAddBlock"
      >
        <Plus :size="14" />
      </button>

      <button
        type="button"
        class="block-handle-button"
        aria-label="Drag block"
        draggable="true"
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
