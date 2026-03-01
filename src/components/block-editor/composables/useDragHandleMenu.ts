import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/vue-3'

import { CellSelection, isInTable } from '@tiptap/pm/tables'
import { computed, ref } from 'vue'

export type DragHandleMenuSource = 'insert' | 'turn-into'

export function useDragHandleMenu() {
  const menuOpen = ref(false)
  const menuPosition = ref({ x: 0, y: 0 })
  const highlightedValue = ref<string | null>(null)
  const menuSource = ref<DragHandleMenuSource | null>(null)
  const menuTargetBlockPos = ref<number | null>(null)
  const hoveredBlockPos = ref<number | null>(null)
  const isDragging = ref(false)
  const isTableContext = ref(false)
  const isTableActionsEnabled = ref(false)
  const canDeleteTableRow = ref(true)
  const canDeleteTableColumn = ref(true)
  const firstMenuItem = 'paragraph'

  const menuAnchorStyle = computed(() => ({
    left: `${menuPosition.value.x}px`,
    top: `${menuPosition.value.y}px`,
  }))

  function resolveBlockTargetPos(currentEditor: Editor) {
    if (hoveredBlockPos.value !== null) {
      return hoveredBlockPos.value
    }

    const { $from } = currentEditor.state.selection
    if ($from.depth < 1) {
      return null
    }

    return $from.before(1)
  }

  function isTableContextAtPos(currentEditor: Editor, pos: number | null) {
    if (pos === null) {
      return currentEditor.isActive('table')
    }

    const { doc } = currentEditor.state
    const directNode = doc.nodeAt(pos)
    if (directNode?.type.name === 'table') {
      return true
    }

    const resolvedPos = doc.resolve(Math.min(pos + 1, doc.content.size))
    for (let depth = resolvedPos.depth; depth >= 0; depth -= 1) {
      if (resolvedPos.node(depth).type.name === 'table') {
        return true
      }
    }

    return false
  }

  function resolveMenuAnchorPosition(currentEditor: Editor, targetPos: number | null) {
    const targetNode = targetPos === null
      ? null
      : currentEditor.view.nodeDOM(targetPos)

    if (targetNode instanceof HTMLElement) {
      const rect = targetNode.getBoundingClientRect()

      return {
        x: rect.left,
        y: rect.top + 24,
      }
    }

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

  function closeMenu() {
    menuOpen.value = false
    highlightedValue.value = null
    menuSource.value = null
    menuTargetBlockPos.value = null
  }

  function openMenuFromTrigger(currentEditor: Editor, event: MouseEvent, source: DragHandleMenuSource) {
    const trigger = event.currentTarget
    if (!(trigger instanceof HTMLElement)) {
      return
    }

    const rect = trigger.getBoundingClientRect()
    menuPosition.value = {
      x: rect.left,
      y: rect.bottom + 6,
    }
    const targetPos = resolveBlockTargetPos(currentEditor)
    menuTargetBlockPos.value = targetPos
    menuSource.value = source
    isTableContext.value = isTableContextAtPos(currentEditor, targetPos)
    isTableActionsEnabled.value = isInTable(currentEditor.state)
    syncDeleteTableActionAvailability(currentEditor)
    highlightedValue.value = firstMenuItem
    menuOpen.value = true
  }

  function openMenuFromHandle(currentEditor: Editor, source: DragHandleMenuSource) {
    const targetPos = resolveBlockTargetPos(currentEditor)
    const position = resolveMenuAnchorPosition(currentEditor, targetPos)

    menuPosition.value = position
    menuTargetBlockPos.value = targetPos
    menuSource.value = source
    isTableContext.value = isTableContextAtPos(currentEditor, targetPos)
    isTableActionsEnabled.value = isInTable(currentEditor.state)
    syncDeleteTableActionAvailability(currentEditor)
    highlightedValue.value = firstMenuItem
    menuOpen.value = true
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

  function getMenuLabel() {
    if (menuSource.value === 'turn-into') {
      return 'Turn into'
    }

    return 'Insert'
  }

  function onNodeChange(data: { node: ProseMirrorNode | null, pos: number }) {
    hoveredBlockPos.value = data?.node ? data.pos : null
  }

  function onElementDragStart() {
    isDragging.value = true
  }

  function onElementDragEnd(currentEditor: Editor) {
    isDragging.value = false

    requestAnimationFrame(() => {
      currentEditor.commands.focus()
      const { from } = currentEditor.state.selection
      currentEditor.commands.setTextSelection(from)
    })
  }

  return {
    menuOpen,
    menuAnchorStyle,
    highlightedValue,
    menuSource,
    menuTargetBlockPos,
    hoveredBlockPos,
    isDragging,
    isTableContext,
    isTableActionsEnabled,
    canDeleteTableRow,
    canDeleteTableColumn,
    openMenuFromTrigger,
    openMenuFromHandle,
    onMenuOpenChange,
    onHighlightedValueChange,
    closeMenu,
    getMenuLabel,
    onNodeChange,
    onElementDragStart,
    onElementDragEnd,
  }
}
