<script setup lang="ts">
import type { MenuRadioItemProps } from '@ark-ui/vue/menu'
import type { HTMLAttributes } from 'vue'

import { Menu } from '@ark-ui/vue/menu'
import { reactiveOmit } from '@vueuse/core'
import { CircleIcon } from 'lucide-vue-next'

import { useForwardExpose } from '@/composables/useForwardExpose'
import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'
import { cn } from '@/lib/utils'

interface Props extends MenuRadioItemProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const delegatedProps = reactiveOmit(props, 'class')
const forwardedProps = useForwardPropsEmits(delegatedProps)
useForwardExpose()
</script>

<template>
  <Menu.RadioItem
    data-scope="dropdown-menu"
    data-part="radio-item"
    v-bind="forwardedProps"
    :value="props.value"
    :class="cn(
      `
        relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm
        outline-hidden select-none
      `,
      `
        hover:bg-accent
        focus:bg-accent focus:text-accent-foreground
        data-disabled:pointer-events-none data-disabled:opacity-50
        [&_svg]:pointer-events-none [&_svg]:shrink-0
        [&_svg:not([class*=\'size-\'])]:size-4
      `,

      props.class,
    )"
  >
    <Menu.ItemIndicator
      class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center"
    >
      <slot name="indicator-icon">
        <CircleIcon aria-hidden="true" class="size-2 fill-current" />
      </slot>
    </Menu.ItemIndicator>
    <Menu.ItemText>
      <slot />
    </Menu.ItemText>
  </Menu.RadioItem>
</template>
