<script setup lang="ts">
import type { MenuItemProps } from '@ark-ui/vue/menu'
import type { HTMLAttributes } from 'vue'

import { Menu } from '@ark-ui/vue/menu'
import { reactiveOmit } from '@vueuse/core'

import { useForwardExpose } from '@/composables/useForwardExpose'
import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'
import { cn } from '@/lib/utils'

interface Props extends MenuItemProps {
  value: string
  inset?: boolean
  variant?: 'default' | 'destructive'
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})
const delegatedProps = reactiveOmit(props, ['class', 'inset', 'value'])
const forwardedProps = useForwardPropsEmits(delegatedProps)
useForwardExpose()
</script>

<template>
  <Menu.Item
    data-scope="dropdown-menu"
    data-part="item"
    :value="props.value"
    v-bind="forwardedProps"
    :data-inset="props.inset || undefined"
    :data-variant="props.variant"
    :class="cn(
      `
        relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 pl-2 text-sm
        outline-hidden select-none
        hover:bg-accent
        focus:bg-accent focus:text-accent-foreground
      `,
      `
        [&_svg]:pointer-events-none [&_svg]:shrink-0
        [&_svg:not([class*='size-'])]:size-4
        [&_svg:not([class*='text-'])]:text-muted-foreground
      `,
      `data-disabled:pointer-events-none data-disabled:opacity-50`,
      `
        data-inset:pl-8
        data-[variant=destructive]:text-destructive
        data-[variant=destructive]:hover:bg-destructive/10
        data-[variant=destructive]:focus:bg-destructive/10
        data-[variant=destructive]:focus:text-destructive
        data-[variant=destructive]:*:[svg]:text-destructive!
      `,
      `
        dark:data-[variant=destructive]:hover:bg-destructive/20
        dark:data-[variant=destructive]:focus:bg-destructive/20
      `,
      props.class,
    )"
  >
    <slot />
  </Menu.Item>
</template>
