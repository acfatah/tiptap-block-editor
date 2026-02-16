<script setup lang="ts">
import type { MenuTriggerProps } from '@ark-ui/vue/menu'
import type { HTMLAttributes } from 'vue'

import { Menu } from '@ark-ui/vue/menu'
import { reactiveOmit } from '@vueuse/core'

import { useForwardExpose } from '@/composables/useForwardExpose'
import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'
import { cn } from '@/lib/utils'

interface Props extends MenuTriggerProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const delegatedProps = reactiveOmit(props, 'class')
const forwardedProps = useForwardPropsEmits(delegatedProps)
useForwardExpose()
</script>

<template>
  <Menu.Trigger
    v-bind="forwardedProps"
    data-scope="dropdown-menu"
    data-part="trigger"
    :class="cn(
      `
        outline-none
        focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50
        [&_svg]:pointer-events-none [&_svg]:shrink-0
        [&_svg:not([class*=\'size-\'])]:size-4
      `,
      props.class,
    )"
  >
    <slot />
  </Menu.Trigger>
</template>
