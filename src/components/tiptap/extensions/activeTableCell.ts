import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { CellSelection, isInTable } from '@tiptap/pm/tables'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const ActiveTableCell = Extension.create({
  name: 'activeTableCell',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            if (!isInTable(state)) {
              return null
            }

            if (state.selection instanceof CellSelection) {
              return null
            }

            const $pos = state.selection.$anchorCell || state.selection.$from
            if (!$pos) {
              return null
            }

            try {
              const cellNode = $pos.node(-1)
              const cellPos = $pos.before(-1)

              return DecorationSet.create(state.doc, [
                Decoration.node(cellPos, cellPos + cellNode.nodeSize, { class: 'selectedCell' }),
              ])
            }
            catch {
              return null
            }
          },
        },
      }),
    ]
  },
})
