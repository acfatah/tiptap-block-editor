import type { Editor } from '@tiptap/vue-3'
import type { Ref } from 'vue'

import { isInTable } from '@tiptap/pm/tables'

import type { SlashMenuSource, SlashRange } from './useSlashMenu'

import { createTableNodeContent, parseTableText, rowsToPlainText } from './markdownTableParser'

export type BlockCommand = 'paragraph' | 'table'
export type DeleteCommand = 'delete-block'
export type TableCommand
  = | 'add-row-before'
    | 'add-row-after'
    | 'delete-row'
    | 'add-column-before'
    | 'add-column-after'
    | 'delete-column'
export type MenuCommand = BlockCommand | TableCommand | DeleteCommand

interface UseBlockCommandsOptions {
  editor: Ref<Editor | null | undefined>
  slashRange: Ref<SlashRange>
  slashMenuSource: Ref<SlashMenuSource>
  menuTargetBlockPos: Ref<number | null>
}

const menuCommands = new Set<MenuCommand>([
  'paragraph',
  'table',
  'delete-block',
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
  function getNodeTextWithHardBreaks(node: { toJSON?: () => unknown, textContent: string }) {
    const nodeJson = node.toJSON?.() as
      | {
        type?: string
        text?: string
        content?: unknown[]
      }
      | undefined

    if (!nodeJson) {
      return node.textContent
    }

    function readNodeText(currentNode: {
      type?: string
      text?: string
      content?: unknown[]
    }): string {
      if (currentNode.type === 'text') {
        return currentNode.text ?? ''
      }

      if (currentNode.type === 'hardBreak') {
        return '\n'
      }

      if (!currentNode.content?.length) {
        return ''
      }

      return currentNode.content
        .map((childNode) => {
          return readNodeText(childNode as {
            type?: string
            text?: string
            content?: unknown[]
          })
        })
        .join('')
    }

    return readNodeText(nodeJson)
  }

  function getTableNodeRows(node: {
    childCount: number
    child: (index: number) => {
      childCount: number
      child: (childIndex: number) => { textContent: string }
    }
  }) {
    const rows: string[][] = []

    for (let rowIndex = 0; rowIndex < node.childCount; rowIndex += 1) {
      const rowNode = node.child(rowIndex)
      const row: string[] = []

      for (let columnIndex = 0; columnIndex < rowNode.childCount; columnIndex += 1) {
        const cellNode = rowNode.child(columnIndex)
        row.push(cellNode.textContent)
      }

      rows.push(row)
    }

    return rows
  }

  function createParagraphNode(text: string) {
    const lines = text.split('\n')
    const paragraphContent = lines.flatMap((line, lineIndex) => {
      const lineContent = line
        ? [{
            type: 'text',
            text: line,
          }]
        : []

      if (lineIndex === lines.length - 1) {
        return lineContent
      }

      return [
        ...lineContent,
        {
          type: 'hardBreak',
        },
      ]
    })

    return {
      type: 'paragraph',
      content: paragraphContent,
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
      const parsedTable = parseTableText(getNodeTextWithHardBreaks(node))

      currentEditor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, createTableNodeContent(parsedTable.rows, parsedTable.withHeaderRow))
        .run()

      currentEditor.commands.setTextSelection(from + 4)
    }
    else {
      const paragraphText = node.type.name === 'table'
        ? rowsToPlainText(getTableNodeRows(node))
        : node.textContent

      currentEditor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, createParagraphNode(paragraphText))
        .run()

      currentEditor.commands.setTextSelection(from + 1)
    }
  }

  function executeTableCommand(command: TableCommand) {
    const currentEditor = editor.value
    if (!currentEditor) {
      return
    }

    if (!isInTable(currentEditor.state)) {
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

  function resolveDeleteBlockPos(currentEditor: Editor) {
    if (menuTargetBlockPos.value !== null) {
      return menuTargetBlockPos.value
    }

    const { $from } = currentEditor.state.selection
    if ($from.depth < 1) {
      return null
    }

    return $from.before(1)
  }

  function executeDeleteCommand() {
    const currentEditor = editor.value
    if (!currentEditor) {
      return
    }

    const pos = resolveDeleteBlockPos(currentEditor)
    if (pos === null) {
      return
    }

    const node = currentEditor.state.doc.nodeAt(pos)
    if (!node) {
      return
    }

    currentEditor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + node.nodeSize })
      .run()
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
    else if (command === 'delete-block') {
      executeDeleteCommand()
    }
    else {
      executeBlockCommand(command)
    }
  }

  return {
    executeMenuCommand,
  }
}
