import type { Editor } from '@tiptap/vue-3'
import type { Ref } from 'vue'

import { CellSelection, isInTable } from '@tiptap/pm/tables'
import { computed, ref } from 'vue'

export type SlashRange = { from: number, to: number } | null
export type SlashMenuSource = 'slash' | 'insert' | 'turn-into' | null

type SlashMenuSourceValue = Exclude<SlashMenuSource, null>

interface UseSlashMenuOptions {
  hoveredBlockPos: Ref<number | null>
}

export function useSlashMenu({ hoveredBlockPos }: UseSlashMenuOptions) {
  const slashMenuOpen = ref(false)
  const slashMenuPosition = ref({ x: 0, y: 0 })
  const slashRange = ref<SlashRange>(null)
  const slashMenuHighlightedValue = ref<string | null>(null)
  const slashMenuSource = ref<SlashMenuSource>(null)
  const menuTargetBlockPos = ref<number | null>(null)
  const isTableMenuVisible = ref(false)
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

  function syncMenuState(currentEditor: Editor) {
    isTableMenuVisible.value = currentEditor.isActive('table')
    isTableActionsEnabled.value = isInTable(currentEditor.state)
    syncDeleteTableActionAvailability(currentEditor)
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

  function closeMenu() {
    slashMenuOpen.value = false
    slashRange.value = null
    slashMenuHighlightedValue.value = null
    slashMenuSource.value = null
    menuTargetBlockPos.value = null
  }

  function syncSlashMenu(currentEditor: Editor) {
    const range = getSlashRange(currentEditor)

    if (!range) {
      if (slashMenuSource.value === 'slash') {
        closeMenu()
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

    closeMenu()
  }

  function onSlashMenuHighlightedValueChange(value: string | null) {
    slashMenuHighlightedValue.value = value
  }

  function getMenuLabel() {
    if (slashMenuSource.value === 'turn-into') {
      return 'Turn into'
    }

    return 'Insert'
  }

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

  function openMenuFromTrigger(currentEditor: Editor, event: MouseEvent, source: SlashMenuSourceValue) {
    const trigger = event.currentTarget
    if (!(trigger instanceof HTMLElement)) {
      return
    }

    const rect = trigger.getBoundingClientRect()
    slashMenuPosition.value = {
      x: rect.left,
      y: rect.bottom + 6,
    }
    const targetPos = resolveBlockTargetPos(currentEditor)
    slashRange.value = null
    menuTargetBlockPos.value = targetPos
    slashMenuSource.value = source
    isTableMenuVisible.value = isTableContextAtPos(currentEditor, targetPos)
    isTableActionsEnabled.value = isInTable(currentEditor.state)
    syncDeleteTableActionAvailability(currentEditor)
    slashMenuHighlightedValue.value = firstSlashMenuItem
    slashMenuOpen.value = true
  }

  function openMenuFromHandle(currentEditor: Editor, source: SlashMenuSourceValue) {
    const targetPos = resolveBlockTargetPos(currentEditor)
    const position = resolveMenuAnchorPosition(currentEditor, targetPos)

    slashMenuPosition.value = position
    slashRange.value = null
    menuTargetBlockPos.value = targetPos
    slashMenuSource.value = source
    isTableMenuVisible.value = isTableContextAtPos(currentEditor, targetPos)
    isTableActionsEnabled.value = isInTable(currentEditor.state)
    syncDeleteTableActionAvailability(currentEditor)
    slashMenuHighlightedValue.value = firstSlashMenuItem
    slashMenuOpen.value = true
  }

  return {
    slashMenuOpen,
    slashMenuPosition,
    slashMenuAnchorStyle,
    slashRange,
    slashMenuHighlightedValue,
    slashMenuSource,
    menuTargetBlockPos,
    isTableMenuVisible,
    isTableActionsEnabled,
    canDeleteTableRow,
    canDeleteTableColumn,
    syncMenuState,
    syncSlashMenu,
    onSlashMenuOpenChange,
    onSlashMenuHighlightedValueChange,
    getMenuLabel,
    openMenuFromTrigger,
    openMenuFromHandle,
    closeMenu,
  }
}
