import type { Editor } from '@tiptap/vue-3'
import type { Ref } from 'vue'

import { isInTable } from '@tiptap/pm/tables'

import { createTableNodeContent, parseTableText, rowsToPlainText } from './markdownTableParser'

export type BlockCommand = 'paragraph' | 'table' | 'bullet-list' | 'numbered-list'
export type DeleteCommand = 'delete-block'
export type TableCommand
  = | 'add-row-before'
    | 'add-row-after'
    | 'delete-row'
    | 'add-column-before'
    | 'add-column-after'
    | 'delete-column'
export type MenuCommand = BlockCommand | TableCommand | DeleteCommand

export interface MenuCommandContext {
  source: 'slash' | 'insert' | 'turn-into'
  slashRange: { from: number, to: number } | null
  targetBlockPos: number | null
}

interface UseBlockCommandsOptions {
  editor: Ref<Editor | null | undefined>
}

const menuCommands = new Set<MenuCommand>([
  'paragraph',
  'table',
  'bullet-list',
  'numbered-list',
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

export function useBlockCommands({ editor }: UseBlockCommandsOptions) {
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

  function createListNode(text: string, listType: 'bulletList' | 'orderedList') {
    const lines = text.split('\n')
    const listItems = lines.map((line) => {
      const paragraphContent = line
        ? [{
            type: 'text',
            text: line,
          }]
        : []

      return {
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: paragraphContent,
        }],
      }
    })

    return {
      type: listType,
      content: listItems,
    }
  }

  function executeTurnIntoCommand(command: BlockCommand, targetBlockPos: number | null) {
    const currentEditor = editor.value

    if (!currentEditor || targetBlockPos === null) {
      return
    }

    const node = currentEditor.state.doc.nodeAt(targetBlockPos)
    if (!node) {
      return
    }

    const from = targetBlockPos
    const to = targetBlockPos + node.nodeSize

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
    else if (command === 'paragraph') {
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
    else {
      const listText = node.type.name === 'table'
        ? rowsToPlainText(getTableNodeRows(node))
        : getNodeTextWithHardBreaks(node)
      const listType = command === 'bullet-list' ? 'bulletList' : 'orderedList'

      currentEditor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, createListNode(listText, listType))
        .run()

      currentEditor.commands.setTextSelection(from + 3)
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

  function resolveDeleteBlockPos(currentEditor: Editor, targetBlockPos: number | null) {
    if (targetBlockPos !== null) {
      return targetBlockPos
    }

    const { $from } = currentEditor.state.selection
    if ($from.depth < 1) {
      return null
    }

    return $from.before(1)
  }

  function executeDeleteCommand(targetBlockPos: number | null) {
    const currentEditor = editor.value
    if (!currentEditor) {
      return
    }

    const pos = resolveDeleteBlockPos(currentEditor, targetBlockPos)
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

  function getInsertPos(currentEditor: Editor, targetBlockPos: number | null) {
    if (targetBlockPos === null) {
      return currentEditor.state.selection.from
    }

    const node = currentEditor.state.doc.nodeAt(targetBlockPos)
    if (!node) {
      return currentEditor.state.selection.from
    }

    return targetBlockPos + node.nodeSize
  }

  function executeBlockCommand(command: BlockCommand, context: MenuCommandContext) {
    const currentEditor = editor.value

    if (!currentEditor) {
      return
    }

    if (context.source === 'turn-into') {
      executeTurnIntoCommand(command, context.targetBlockPos)
    }
    else if (context.slashRange) {
      const chain = currentEditor.chain().focus().deleteRange(context.slashRange)

      if (command === 'table') {
        chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      }
      else if (command === 'paragraph') {
        chain.setParagraph()
      }
      else if (command === 'bullet-list') {
        chain.toggleBulletList()
      }
      else {
        chain.toggleOrderedList()
      }

      chain.run()
    }
    else {
      const insertPos = getInsertPos(currentEditor, context.targetBlockPos)

      if (command === 'table') {
        currentEditor.chain().focus().setTextSelection(insertPos).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
      }
      else if (command === 'paragraph') {
        currentEditor.chain().focus().insertContentAt(insertPos, { type: 'paragraph' }).run()
        currentEditor.commands.setTextSelection(insertPos + 1)
      }
      else {
        const listType = command === 'bullet-list' ? 'bulletList' : 'orderedList'

        currentEditor.chain().focus().insertContentAt(insertPos, createListNode('', listType)).run()
        currentEditor.commands.setTextSelection(insertPos + 3)
      }
    }
  }

  function executeMenuCommand(command: MenuCommand, context: MenuCommandContext) {
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
      executeDeleteCommand(context.targetBlockPos)
    }
    else {
      executeBlockCommand(command, context)
    }
  }

  return {
    executeMenuCommand,
  }
}
