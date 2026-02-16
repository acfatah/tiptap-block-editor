<script setup lang="ts">
import type { MenuRootEmits, MenuRootProps } from '@ark-ui/vue/menu'
import type { HTMLAttributes } from 'vue'

import { Menu } from '@ark-ui/vue/menu'

import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'

interface Props extends MenuRootProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const emit = defineEmits<MenuRootEmits>()
const forwardedProps = useForwardPropsEmits(props, emit)
</script>

<template>
  <Menu.Root
    v-bind="forwardedProps"
  >
    <slot />
  </Menu.Root>
</template>
