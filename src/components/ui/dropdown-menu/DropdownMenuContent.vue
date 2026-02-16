<script setup lang="ts">
import type { MenuContentProps } from '@ark-ui/vue/menu'
import type { HTMLAttributes } from 'vue'

import { Menu } from '@ark-ui/vue/menu'
import { reactiveOmit } from '@vueuse/core'

import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'
import { cn } from '@/lib/utils'

interface Props extends MenuContentProps {
  class?: HTMLAttributes['class']
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const props = withDefaults(defineProps<Props>(), {
  side: 'right',
})

const delegatedProps = reactiveOmit(props, 'class')
const forwardedProps = useForwardPropsEmits(delegatedProps)
</script>

<template>
  <Teleport to="body" defer>
    <Menu.Positioner>
      <Menu.Content
        v-bind="forwardedProps"
        data-scope="dropdown-menu"
        data-part="content"
        :class="cn(
          `
            z-50 max-h-(--available-height) min-w-32 origin-(--transform-origin) overflow-x-hidden
            overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md
            outline-none
          `,
          `
            data-[side=bottom]:slide-in-from-top-2
            data-[side=left]:slide-in-from-right-2
            data-[side=right]:slide-in-from-left-2
            data-[side=top]:slide-in-from-bottom-2
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0
            data-[state=closed]:zoom-out-95
            data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
          `,

          props.class,
        )"
      >
        <slot />
      </Menu.Content>
    </Menu.Positioner>
  </Teleport>
</template>
