<script setup lang="ts">
import type {
  MenuRadioItemGroupEmits,
  MenuRadioItemGroupProps,
} from '@ark-ui/vue/menu'
import type { HTMLAttributes } from 'vue'

import { Menu } from '@ark-ui/vue/menu'
import { reactiveOmit } from '@vueuse/core'

import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'
import { cn } from '@/lib/utils'

interface Props extends MenuRadioItemGroupProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const emit = defineEmits<MenuRadioItemGroupEmits>()
const delegatedProps = reactiveOmit(props, 'class')
const forwardedProps = useForwardPropsEmits(delegatedProps, emit)
</script>

<template>
  <Menu.RadioItemGroup
    v-bind="forwardedProps"
    data-scope="dropdown-menu"
    data-part="radio-group"
    :class="cn(props.class)"
  >
    <slot />
  </Menu.RadioItemGroup>
</template>
