<script setup lang="ts">
import type { MenuCheckboxItemEmits, MenuCheckboxItemProps } from '@ark-ui/vue/menu'
import type { HTMLAttributes } from 'vue'

import { Menu } from '@ark-ui/vue/menu'
import { reactiveOmit } from '@vueuse/core'
import { CheckIcon } from 'lucide-vue-next'

import { useForwardExpose } from '@/composables/useForwardExpose'
import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'
import { cn } from '@/lib/utils'

interface Props extends MenuCheckboxItemProps {
  value: string
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const emit = defineEmits<MenuCheckboxItemEmits>()
const delegatedProps = reactiveOmit(props, ['checked', 'class', 'value'])
const forwardedProps = useForwardPropsEmits(delegatedProps, emit)
useForwardExpose()
</script>

<template>
  <Menu.CheckboxItem
    v-bind="forwardedProps"
    data-scope="dropdown-menu"
    data-part="checkbox-item"
    :value="props.value"
    :checked="props.checked"
    :class="cn(
      `
        relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm
        outline-hidden select-none
      `,
      `
        focus:bg-accent focus:text-accent-foreground
        data-disabled:pointer-events-none data-disabled:opacity-50
        [&_svg]:pointer-events-none [&_svg]:shrink-0
        [&_svg:not([class*=\'size-\'])]:size-4
      `,
      props.class,
    )"
  >
    <Menu.ItemIndicator
      data-scope="dropdown-menu"
      data-part="item-indicator"
      class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center"
    >
      <slot name="indicator-icon">
        <CheckIcon aria-hidden="true" class="size-4" />
      </slot>
    </Menu.ItemIndicator>
    <Menu.ItemText
      data-scope="dropdown-menu"
      data-part="item-text"
    >
      <slot />
    </Menu.ItemText>
  </Menu.CheckboxItem>
</template>
