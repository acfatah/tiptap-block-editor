import type { Editor } from '@tiptap/vue-3'

import { CellSelection, isInTable } from '@tiptap/pm/tables'
import { computed, ref } from 'vue'

export type SlashRange = { from: number, to: number } | null

export function useSlashMenu() {
  const slashMenuOpen = ref(false)
  const slashMenuPosition = ref({ x: 0, y: 0 })
  const slashRange = ref<SlashRange>(null)
  const slashMenuHighlightedValue = ref<string | null>(null)
  const isTableActionsEnabled = ref(false)
  const canDeleteTableRow = ref(true)
  const canDeleteTableColumn = ref(true)
  const firstSlashMenuItem = 'paragraph'

  const slashMenuAnchorStyle = computed(() => ({
    left: `${slashMenuPosition.value.x}px`,
    top: `${slashMenuPosition.value.y}px`,
  }))

  function getSlashRange(currentEditor: Editor) {
    if (!currentEditor.state.selection.empty) {
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

    const previousChar = textBeforeCursor.charAt(slashIndex - 1)

    if (slashIndex > 0 && previousChar && !/\s/.test(previousChar)) {
      return null
    }

    const from = $from.start() + slashIndex
    const to = $from.pos

    return { from, to }
  }

  function syncDeleteTableActionAvailability(currentEditor: Editor) {
    const { selection } = currentEditor.state

    if (!(selection instanceof CellSelection)) {
      canDeleteTableRow.value = true
      canDeleteTableColumn.value = true

      return
    }

    if (selection.isRowSelection()) {
      canDeleteTableRow.value = true
      canDeleteTableColumn.value = false

      return
    }

    if (selection.isColSelection()) {
      canDeleteTableRow.value = false
      canDeleteTableColumn.value = true

      return
    }

    canDeleteTableRow.value = true
    canDeleteTableColumn.value = true
  }

  function syncMenuState(currentEditor: Editor) {
    isTableActionsEnabled.value = isInTable(currentEditor.state)
    syncDeleteTableActionAvailability(currentEditor)
  }

  function closeMenu() {
    slashMenuOpen.value = false
    slashRange.value = null
    slashMenuHighlightedValue.value = null
  }

  function syncSlashMenu(currentEditor: Editor) {
    const range = getSlashRange(currentEditor)

    if (!range) {
      if (slashMenuOpen.value) {
        closeMenu()
      }

      return
    }

    const coords = currentEditor.view.coordsAtPos(range.to)
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

    closeMenu()
  }

  function onSlashMenuHighlightedValueChange(value: string | null) {
    slashMenuHighlightedValue.value = value
  }

  return {
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
  }
}
