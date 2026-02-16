<script setup lang="ts">
import type { MenuItemGroupProps } from '@ark-ui/vue/menu'

import { Menu } from '@ark-ui/vue/menu'

import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'

interface Props extends MenuItemGroupProps {}

const props = defineProps<Props>()
const forwardedProps = useForwardPropsEmits(props)
</script>

<template>
  <Menu.ItemGroup
    v-bind="forwardedProps"
    data-scope="dropdown-menu"
    data-part="group"
  >
    <slot />
  </Menu.ItemGroup>
</template>
