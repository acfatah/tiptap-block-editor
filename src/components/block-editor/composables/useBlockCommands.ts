import type { Editor } from '@tiptap/vue-3'
import type { Ref } from 'vue'

import type { SlashMenuSource, SlashRange } from './useSlashMenu'

export type BlockCommand = 'paragraph' | 'table'
export type TableCommand
  = | 'add-row-before'
    | 'add-row-after'
    | 'delete-row'
    | 'add-column-before'
    | 'add-column-after'
    | 'delete-column'
export type MenuCommand = BlockCommand | TableCommand

interface UseBlockCommandsOptions {
  editor: Ref<Editor | null>
  slashRange: Ref<SlashRange>
  slashMenuSource: Ref<SlashMenuSource>
  menuTargetBlockPos: Ref<number | null>
}

const menuCommands = new Set<MenuCommand>([
  'paragraph',
  'table',
  'add-row-before',
  'add-row-after',
  'delete-row',
  'add-column-before',
  'add-column-after',
  'delete-column',
])

export function isMenuCommand(value: string): value is MenuCommand {
  return menuCommands.has(value as MenuCommand)
}

export function useBlockCommands({ editor, slashRange, slashMenuSource, menuTargetBlockPos }: UseBlockCommandsOptions) {
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

  function getHoveredBlockInsertPos(currentEditor: Editor) {
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
  }

  return {
    executeMenuCommand,
  }
}
