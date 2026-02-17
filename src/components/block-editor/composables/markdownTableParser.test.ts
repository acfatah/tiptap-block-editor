/// <reference types="bun-types" />
import { describe, expect, it } from 'bun:test'

import { parseMarkdownTable, parseTableText, rowsToPlainText } from './markdownTableParser'

describe('parseTableText', () => {
  it('parses markdown table and skips separator row', () => {
    const result = parseTableText(`| Name | Note |
| --- | :---: |
| A\\|B | hello |`)

    expect(result.withHeaderRow).toBeTrue()
    expect(result.rows).toEqual([
      ['Name', 'Note'],
      ['A|B', 'hello'],
    ])
  })

  it('parses tab and newline delimited text', () => {
    const result = parseTableText('name\tage\nAri\t12')

    expect(result.rows).toEqual([
      ['name', 'age'],
      ['Ari', '12'],
    ])
  })

  it('normalizes uneven rows with empty cells', () => {
    const result = parseTableText('name\tage\nAri')

    expect(result.rows).toEqual([
      ['name', 'age'],
      ['Ari', ''],
    ])
  })

  it('returns single empty cell for empty input', () => {
    const result = parseTableText('   ')

    expect(result.rows).toEqual([
      [''],
    ])
  })

  it('parses markdown table with inline code cells', () => {
    const result = parseMarkdownTable(`| Command | Description |
| --- | --- |
| \`bun install\` | Install dependencies |
| \`bun test\` | Run tests |`)

    expect(result).not.toBeNull()
    expect(result?.rows).toEqual([
      ['Command', 'Description'],
      ['`bun install`', 'Install dependencies'],
      ['`bun test`', 'Run tests'],
    ])
  })
})

describe('rowsToPlainText', () => {
  it('flattens rows into tab/newline text', () => {
    const text = rowsToPlainText([
      ['A', 'B'],
      ['1', '2'],
    ])

    expect(text).toBe('A\tB\n1\t2')
  })
})
