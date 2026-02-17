import '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraph: {
      setParagraph: () => ReturnType
    }
    table: {
      insertTable: (options: {
        rows: number
        cols: number
        withHeaderRow?: boolean
      }) => ReturnType
      addRowBefore: () => ReturnType
      addRowAfter: () => ReturnType
      deleteRow: () => ReturnType
      addColumnBefore: () => ReturnType
      addColumnAfter: () => ReturnType
      deleteColumn: () => ReturnType
    }
  }
}

export {}
