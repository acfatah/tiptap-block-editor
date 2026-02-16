<script setup lang="ts">
import type { MenuItemGroupLabelProps } from '@ark-ui/vue/menu'
import type { HTMLAttributes } from 'vue'

import { Menu } from '@ark-ui/vue/menu'
import { reactiveOmit } from '@vueuse/core'

import { useForwardExpose } from '@/composables/useForwardExpose'
import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'
import { cn } from '@/lib/utils'

interface Props extends MenuItemGroupLabelProps {
  inset?: boolean
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const delegatedProps = reactiveOmit(props, 'class')
const forwardedProps = useForwardPropsEmits(delegatedProps)
useForwardExpose()
</script>

<template>
  <Menu.ItemGroupLabel
    v-bind="forwardedProps"
    data-scope="dropdown-menu"
    data-part="label"
    :data-inset="props.inset || undefined"
    :class="cn(
      `
        px-2 py-1.5 pl-2 text-sm font-medium
        data-inset:pl-8
      `,
      props.class,
    )"
  >
    <slot />
  </Menu.ItemGroupLabel>
</template>
