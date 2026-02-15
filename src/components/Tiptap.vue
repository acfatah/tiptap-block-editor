<script setup lang="ts">
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { DragHandle } from '@tiptap/extension-drag-handle-vue-3'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { GripVertical, Plus } from 'lucide-vue-next'
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const hoveredBlockPos = ref<number | null>(null)

const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit],
  editorProps: {
    attributes: {
      class: 'simple-editor',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
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
