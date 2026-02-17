import type { Editor } from '@tiptap/vue-3'
import type { Ref } from 'vue'

import { ref } from 'vue'

interface UseTableEdgeControlsOptions {
  editor: Ref<Editor | null>
  container: Ref<HTMLElement | null>
}

const EDGE_GAP_PX = 6
const EDGE_BUTTON_SIZE_REM = 1
const EDGE_RAIL_SIZE_REM = 4

function buildTableEdgeStyles(tableRect: DOMRect, containerRect: DOMRect) {
  return {
    addColumnButtonStyle: {
      left: `${tableRect.right - containerRect.left + EDGE_GAP_PX}px`,
      top: `${tableRect.top - containerRect.top}px`,
      height: `${tableRect.height}px`,
      width: `${EDGE_BUTTON_SIZE_REM}rem`,
    },
    addRowButtonStyle: {
      left: `${tableRect.left - containerRect.left}px`,
      top: `${tableRect.bottom - containerRect.top + EDGE_GAP_PX}px`,
      width: `${tableRect.width}px`,
      height: `${EDGE_BUTTON_SIZE_REM}rem`,
    },
    addColumnRailStyle: {
      left: `${tableRect.right - containerRect.left}px`,
      top: `${tableRect.top - containerRect.top}px`,
      height: `${tableRect.height}px`,
      width: `${EDGE_RAIL_SIZE_REM}rem`,
    },
    addRowRailStyle: {
      left: `${tableRect.left - containerRect.left}px`,
      top: `${tableRect.bottom - containerRect.top}px`,
      width: `${tableRect.width}px`,
      height: `${EDGE_RAIL_SIZE_REM}rem`,
    },
  }
}

export function useTableEdgeControls({ editor, container }: UseTableEdgeControlsOptions) {
  const showAddColumnButton = ref(false)
  const showAddRowButton = ref(false)
  const addColumnButtonStyle = ref<Record<string, string>>({})
  const addRowButtonStyle = ref<Record<string, string>>({})
  const addColumnRailStyle = ref<Record<string, string>>({})
  const addRowRailStyle = ref<Record<string, string>>({})
  const tableEdgeCellPos = ref<number | null>(null)
  const lastTableCellElement = ref<HTMLElement | null>(null)

  function resetTableEdgeButtons() {
    showAddColumnButton.value = false
    showAddRowButton.value = false
    tableEdgeCellPos.value = null
    addColumnRailStyle.value = {}
    addRowRailStyle.value = {}
    lastTableCellElement.value = null
  }

  function updateTableEdgeButtons(target: EventTarget | null) {
    const currentEditor = editor.value
    const containerElement = container.value
    const targetElement = target instanceof Element ? target : null

    if (!currentEditor || !containerElement || !targetElement) {
      resetTableEdgeButtons()

      return
    }

    if (targetElement.closest('.table-edge-button') || targetElement.closest('.table-edge-rail')) {
      return
    }

    const proseMirrorRoot = targetElement.closest('.ProseMirror')
    if (!proseMirrorRoot) {
      resetTableEdgeButtons()

      return
    }

    const cellElement = targetElement.closest('td, th') as HTMLTableCellElement | null
    if (!cellElement) {
      resetTableEdgeButtons()

      return
    }

    lastTableCellElement.value = cellElement

    const rowElement = cellElement.parentElement as HTMLTableRowElement | null
    const tableElement = cellElement.closest('table') as HTMLTableElement | null

    if (!rowElement || !tableElement) {
      resetTableEdgeButtons()

      return
    }

    const rowIndex = Array.from(tableElement.rows).indexOf(rowElement)
    const colIndex = Array.from(rowElement.cells).indexOf(cellElement)

    if (rowIndex === -1 || colIndex === -1) {
      resetTableEdgeButtons()

      return
    }

    const isLastRow = rowIndex === tableElement.rows.length - 1
    const isLastColumn = colIndex === rowElement.cells.length - 1

    if (!isLastRow && !isLastColumn) {
      resetTableEdgeButtons()

      return
    }

    try {
      tableEdgeCellPos.value = currentEditor.view.posAtDOM(cellElement, 0)
    }
    catch {
      resetTableEdgeButtons()

      return
    }

    const tableRect = tableElement.getBoundingClientRect()
    const containerRect = containerElement.getBoundingClientRect()
    const tableEdgeStyles = buildTableEdgeStyles(tableRect, containerRect)

    addColumnButtonStyle.value = tableEdgeStyles.addColumnButtonStyle
    addRowButtonStyle.value = tableEdgeStyles.addRowButtonStyle
    addColumnRailStyle.value = tableEdgeStyles.addColumnRailStyle
    addRowRailStyle.value = tableEdgeStyles.addRowRailStyle

    showAddColumnButton.value = isLastColumn
    showAddRowButton.value = isLastRow
  }

  function updateTableEdgeButtonsForTable(tableElement: HTMLTableElement | null) {
    const currentEditor = editor.value
    const containerElement = container.value

    if (!currentEditor || !containerElement || !tableElement) {
      resetTableEdgeButtons()

      return
    }

    const lastRow = tableElement.rows[tableElement.rows.length - 1]
    if (!lastRow) {
      resetTableEdgeButtons()

      return
    }

    const lastCell = lastRow.cells[lastRow.cells.length - 1]
    if (!lastCell) {
      resetTableEdgeButtons()

      return
    }

    lastTableCellElement.value = lastCell

    try {
      tableEdgeCellPos.value = currentEditor.view.posAtDOM(lastCell, 0)
    }
    catch {
      resetTableEdgeButtons()

      return
    }

    const tableRect = tableElement.getBoundingClientRect()
    const containerRect = containerElement.getBoundingClientRect()
    const tableEdgeStyles = buildTableEdgeStyles(tableRect, containerRect)

    addColumnButtonStyle.value = tableEdgeStyles.addColumnButtonStyle
    addRowButtonStyle.value = tableEdgeStyles.addRowButtonStyle
    addColumnRailStyle.value = tableEdgeStyles.addColumnRailStyle
    addRowRailStyle.value = tableEdgeStyles.addRowRailStyle

    showAddColumnButton.value = true
    showAddRowButton.value = true
  }

  function onBlockEditorMouseMove(event: MouseEvent) {
    updateTableEdgeButtons(event.target)
  }

  function onAddColumnFromEdge() {
    const currentEditor = editor.value
    const cellPos = tableEdgeCellPos.value

    if (!currentEditor || cellPos === null) {
      return
    }

    currentEditor.chain().focus().setTextSelection(cellPos + 1).addColumnAfter().run()

    requestAnimationFrame(() => {
      updateTableEdgeButtonsForTable(lastTableCellElement.value?.closest('table') ?? null)
    })
  }

  function onAddRowFromEdge() {
    const currentEditor = editor.value
    const cellPos = tableEdgeCellPos.value

    if (!currentEditor || cellPos === null) {
      return
    }

    currentEditor.chain().focus().setTextSelection(cellPos + 1).addRowAfter().run()

    requestAnimationFrame(() => {
      updateTableEdgeButtonsForTable(lastTableCellElement.value?.closest('table') ?? null)
    })
  }

  return {
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
  }
}
