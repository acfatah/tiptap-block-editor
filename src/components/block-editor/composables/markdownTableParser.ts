export interface ParsedTableResult {
  rows: string[][]
  withHeaderRow: boolean
}

interface TableNodeCell {
  type: 'tableHeader' | 'tableCell'
  content: Array<{
    type: 'paragraph'
    content: Array<{
      type: 'text'
      text: string
    }>
  }>
}

interface TableNodeRow {
  type: 'tableRow'
  content: TableNodeCell[]
}

export interface TableNodeContent {
  type: 'table'
  content: TableNodeRow[]
}

function normalizeRows(rows: string[][]) {
  if (!rows.length) {
    return [[
      '',
    ]]
  }

  const maxColumns = Math.max(...rows.map(row => row.length), 1)

  return rows.map((row) => {
    if (row.length >= maxColumns) {
      return row
    }

    return [
      ...row,
      ...Array.from({ length: maxColumns - row.length }, () => ''),
    ]
  })
}

function trimOuterPipes(line: string) {
  let output = line.trim()

  if (output.startsWith('|')) {
    output = output.slice(1)
  }

  if (output.endsWith('|') && !output.endsWith('\\|')) {
    output = output.slice(0, -1)
  }

  return output
}

function splitMarkdownRow(line: string) {
  const source = trimOuterPipes(line)
  const cells: string[] = []
  let currentCell = ''

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    const nextCharacter = source[index + 1]

    if (character === '\\' && nextCharacter === '|') {
      currentCell += '|'
      index += 1
      continue
    }

    if (character === '|') {
      cells.push(currentCell.trim())
      currentCell = ''
      continue
    }

    currentCell += character
  }

  cells.push(currentCell.trim())

  return cells
}

function isSeparatorCell(cell: string) {
  const normalized = cell.trim()

  return /^:?-{3,}:?$/.test(normalized)
}

function tryParseMarkdownTable(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)

  if (lines.length < 2) {
    return null
  }

  const headerLine = lines[0]
  const separatorLine = lines[1]

  if (!headerLine || !separatorLine) {
    return null
  }

  if (!headerLine.includes('|') || !separatorLine.includes('|')) {
    return null
  }

  const headerRow = splitMarkdownRow(headerLine)
  const separatorRow = splitMarkdownRow(separatorLine)

  if (!separatorRow.length || !separatorRow.every(isSeparatorCell)) {
    return null
  }

  const bodyRows = lines
    .slice(2)
    .filter(line => line.includes('|'))
    .map(splitMarkdownRow)

  return {
    rows: normalizeRows([
      headerRow,
      ...bodyRows,
    ]),
    withHeaderRow: true,
  } satisfies ParsedTableResult
}

export function parseMarkdownTable(text: string) {
  return tryParseMarkdownTable(text)
}

function parseDelimitedText(text: string): ParsedTableResult {
  const trimmed = text.trim()

  if (!trimmed) {
    return {
      rows: [[
        '',
      ]],
      withHeaderRow: true,
    }
  }

  const rows = trimmed
    .split(/\r?\n/)
    .map(line => line.split('\t').map(cell => cell.trim()))

  return {
    rows: normalizeRows(rows),
    withHeaderRow: true,
  }
}

export function parseTableText(text: string): ParsedTableResult {
  return tryParseMarkdownTable(text) ?? parseDelimitedText(text)
}

export function createTableNodeContent(rows: string[][], withHeaderRow = true): TableNodeContent {
  return {
    type: 'table',
    content: rows.map((row, rowIndex) => {
      const cellType = withHeaderRow && rowIndex === 0 ? 'tableHeader' : 'tableCell'

      return {
        type: 'tableRow',
        content: row.map((cellText) => {
          return {
            type: cellType,
            content: [{
              type: 'paragraph',
              content: cellText
                ? [{
                    type: 'text',
                    text: cellText,
                  }]
                : [],
            }],
          }
        }),
      }
    }),
  }
}

export function rowsToPlainText(rows: string[][]) {
  return rows
    .map(row => row.map(cell => cell.trim()).join('\t'))
    .join('\n')
}
