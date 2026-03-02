import type { Editor } from '@tiptap/vue-3'

import { CellSelection } from '@tiptap/pm/tables'
import { computed, ref } from 'vue'

export function useTableSelectionMenu() {
  const menuOpen = ref(false)
  const menuPosition = ref({ x: 0, y: 0 })
  const highlightedValue = ref<string | null>(null)
  const canDeleteTableRow = ref(true)
  const canDeleteTableColumn = ref(true)
  const firstMenuItem = 'add-row-before'

  const menuAnchorStyle = computed(() => ({
    left: `${menuPosition.value.x}px`,
    top: `${menuPosition.value.y}px`,
  }))

  function resolveMenuAnchorPosition(currentEditor: Editor) {
    const coords = currentEditor.view.coordsAtPos(currentEditor.state.selection.from)

    return {
      x: coords.left,
      y: coords.bottom + 6,
    }
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

  function openMenu(currentEditor: Editor) {
    const position = resolveMenuAnchorPosition(currentEditor)

    menuPosition.value = position
    syncDeleteTableActionAvailability(currentEditor)
    highlightedValue.value = firstMenuItem
    menuOpen.value = true
  }

  function closeMenu() {
    menuOpen.value = false
    highlightedValue.value = null
  }

  function onMenuOpenChange(open: boolean) {
    menuOpen.value = open

    if (open) {
      highlightedValue.value = firstMenuItem

      return
    }

    closeMenu()
  }

  function onHighlightedValueChange(value: string | null) {
    highlightedValue.value = value
  }

  return {
    menuOpen,
    menuAnchorStyle,
    highlightedValue,
    canDeleteTableRow,
    canDeleteTableColumn,
    openMenu,
    closeMenu,
    onMenuOpenChange,
    onHighlightedValueChange,
  }
}
