import type { Editor } from '@tiptap/vue-3'
import type { Ref } from 'vue'

import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import { CellSelection } from '@tiptap/pm/tables'
import { computed } from 'vue'

const markValues = ['bold', 'italic', 'underline', 'strike'] as const

export type MarkValue = (typeof markValues)[number]

export function useFormattingMenu(options: {
  editor: Ref<Editor | undefined>
  selectionTick: Ref<number>
  isDragging: Ref<boolean>
}) {
  const { editor, selectionTick, isDragging } = options

  function isTableCellSelection(
    currentEditor: NonNullable<typeof editor.value>,
  ) {
    return currentEditor.state.selection instanceof CellSelection
  }

  const activeMarks = computed(() => {
    const selectionKey = selectionTick.value
    const currentEditor = editor.value

    if (!currentEditor || selectionKey < 0) {
      return [] as MarkValue[]
    }

    return markValues.filter(
      value => currentEditor.isActive(value),
    )
  })

  const shouldShowBubbleMenu = computed(() => {
    const selectionKey = selectionTick.value
    const currentEditor = editor.value

    if (
      !currentEditor
      || selectionKey < 0
      || isDragging.value
      || currentEditor.state.selection.empty
    ) {
      return false
    }

    if (currentEditor.state.selection instanceof NodeSelection) {
      return false
    }

    return !isTableCellSelection(currentEditor)
  })

  function shouldShowBubbleMenuForSelection() {
    const currentEditor = editor.value
    const isTextSelection
      = currentEditor?.state.selection instanceof TextSelection

    if (
      !currentEditor
      || isDragging.value
      || currentEditor.state.selection.empty
      || !isTextSelection
    ) {
      return false
    }

    if (currentEditor.state.selection instanceof NodeSelection) {
      return false
    }

    return !isTableCellSelection(currentEditor)
  }

  function toggleMark(mark: MarkValue) {
    const currentEditor = editor.value
    if (!currentEditor) {
      return
    }

    currentEditor.chain().focus().toggleMark(mark).run()
  }

  return {
    activeMarks,
    shouldShowBubbleMenu,
    shouldShowBubbleMenuForSelection,
    toggleMark,
  }
}
