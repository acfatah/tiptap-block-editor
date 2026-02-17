import { describe, expect, it } from 'bun:test'
import { ref } from 'vue'

import { useBlockCommands } from './useBlockCommands'

function createChain(calls: Array<[string, unknown?]>) {
  const chain = {
    focus() {
      calls.push(['focus'])

      return chain
    },
    deleteRange(range: unknown) {
      calls.push(['deleteRange', range])

      return chain
    },
    insertContentAt(pos: number, content: unknown) {
      calls.push(['insertContentAt', { pos, content }])

      return chain
    },
    run() {
      calls.push(['run'])

      return true
    },
    setParagraph() {
      calls.push(['setParagraph'])

      return chain
    },
    insertTable(options: unknown) {
      calls.push(['insertTable', options])

      return chain
    },
  }

  return chain
}

function createEditor(node: any, calls: Array<[string, unknown?]>) {
  const chain = createChain(calls)

  return {
    state: {
      doc: {
        nodeAt: () => node,
      },
      selection: {
        from: 10,
      },
    },
    chain: () => chain,
    commands: {
      setTextSelection: (pos: number) => {
        calls.push(['setTextSelection', pos])
      },
    },
  }
}

describe('useBlockCommands turn-into conversion', () => {
  it('converts markdown paragraph into table content', () => {
    const calls: Array<[string, unknown?]> = []
    const node = {
      nodeSize: 20,
      textContent: '| Name | Age |\n| --- | --- |\n| Ari | 12 |',
      type: { name: 'paragraph' },
    }

    const editor = ref(createEditor(node, calls) as any)
    const slashRange = ref(null)
    const slashMenuSource = ref('turn-into' as const)
    const menuTargetBlockPos = ref(5)

    const { executeMenuCommand } = useBlockCommands({
      editor,
      slashRange,
      slashMenuSource,
      menuTargetBlockPos,
    })

    executeMenuCommand('table')

    const insertCall = calls.find(([name]) => name === 'insertContentAt')
    expect(insertCall).toBeDefined()

    const payload = insertCall?.[1] as { pos: number, content: any }
    expect(payload.pos).toBe(5)
    expect(payload.content.type).toBe('table')
    expect(payload.content.content[0].content[0].content[0].content[0].text).toBe('Name')
    expect(payload.content.content[1].content[1].content[0].content[0].text).toBe('12')
  })

  it('converts table node into flattened paragraph text', () => {
    const calls: Array<[string, unknown?]> = []
    const row1 = {
      childCount: 2,
      child: (index: number) => [{ textContent: 'H1' }, { textContent: 'H2' }][index],
    }
    const row2 = {
      childCount: 2,
      child: (index: number) => [{ textContent: 'v1' }, { textContent: 'v2' }][index],
    }
    const node = {
      nodeSize: 30,
      textContent: 'H1H2v1v2',
      type: { name: 'table' },
      childCount: 2,
      child: (index: number) => [row1, row2][index],
    }

    const editor = ref(createEditor(node, calls) as any)
    const slashRange = ref(null)
    const slashMenuSource = ref('turn-into' as const)
    const menuTargetBlockPos = ref(7)

    const { executeMenuCommand } = useBlockCommands({
      editor,
      slashRange,
      slashMenuSource,
      menuTargetBlockPos,
    })

    executeMenuCommand('paragraph')

    const insertCall = calls.find(([name]) => name === 'insertContentAt')
    expect(insertCall).toBeDefined()

    const payload = insertCall?.[1] as { content: any }
    expect(payload.content.type).toBe('paragraph')
    expect(payload.content.content[0].text).toBe('H1\tH2\nv1\tv2')
  })
})
