<script setup lang="ts">
import type { MenuTriggerItemProps } from '@ark-ui/vue/menu'
import type { HTMLAttributes } from 'vue'

import { Menu } from '@ark-ui/vue/menu'
import { reactiveOmit } from '@vueuse/core'
import { ChevronRightIcon } from 'lucide-vue-next'

import { useForwardExpose } from '@/composables/useForwardExpose'
import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'
import { cn } from '@/lib/utils'

interface Props extends MenuTriggerItemProps {
  inset?: boolean
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const delegatedProps = reactiveOmit(props, 'class')
const forwardedProps = useForwardPropsEmits(delegatedProps)
useForwardExpose()
</script>

<template>
  <Menu.TriggerItem
    v-bind="forwardedProps"
    data-scope="dropdown-menu"
    data-part="sub-trigger"
    :class="cn(
      `
        relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm
        outline-hidden outline-none select-none
      `,
      `
        hover:bg-accent
        focus:bg-accent focus:text-accent-foreground
        data-inset:pl-8
        data-[state=open]:bg-accent data-[state=open]:text-accent-foreground
        [&_svg]:pointer-events-none [&_svg]:shrink-0
        [&_svg:not([class*=\'size-\'])]:size-4
        [&_svg:not([class*=\'text-\'])]:text-muted-foreground
      `,
      `
        data-[variant=destructive]:hover:bg-destructive!
        data-[variant=destructive]:*:[svg]:text-destructive!
      `,
      props.inset ? 'pl-8' : 'pl-2',
      props.class,
    )"
  >
    <slot />
    <ChevronRightIcon aria-hidden="true" class="ml-auto size-4" />
  </Menu.TriggerItem>
</template>
