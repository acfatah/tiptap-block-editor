import type { VNode } from 'vue'

import { mergeProps } from '@zag-js/vue'
import { cloneVNode, defineComponent, Fragment } from 'vue'

/**
 * A dynamic component that renders its first child with merged props.
 * Useful for forwarding props to a single child component.
 *
 * Docs: https://ark-ui.com/docs/guides/composition
 *
 * Source: https://github.com/chakra-ui/ark/blob/main/packages/vue/src/utils/dynamic.ts
 */
export const Dynamic = defineComponent({
  name: 'Dynamic',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => {
      if (!slots.default)
        return null

      const children = renderSlotFragments(slots.default())
      const [firstChildren, ...otherChildren] = children

      if (!firstChildren)
        return children

      if (Object.keys(attrs).length > 0) {
        delete firstChildren.props?.ref
        const mergedProps = mergeProps(attrs, firstChildren.props ?? {})
        const cloned = cloneVNode(firstChildren, mergedProps)
        for (const prop in mergedProps) {
          if (prop.startsWith('on')) {
            cloned.props ||= {}
            cloned.props[prop] = mergedProps[prop]
          }
        }

        return children.length === 1 ? cloned : [cloned, ...otherChildren]
      }

      return children
    }
  },
})

function renderSlotFragments(children?: VNode[]): VNode[] {
  if (!children)
    return []

  return children.flatMap((child) => {
    if (child.type === Fragment)
      return renderSlotFragments(child.children as VNode[])

    return [child]
  })
}
