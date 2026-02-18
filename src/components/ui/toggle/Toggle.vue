<script setup lang="ts">
import type { ToggleRootEmits, ToggleRootProps } from '@ark-ui/vue/toggle'
import type { HTMLAttributes } from 'vue'

import { Toggle } from '@ark-ui/vue/toggle'
import { reactiveOmit } from '@vueuse/core'

import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'
import { cn } from '@/lib/utils'

import type { ToggleVariants } from '.'

import { toggleVariants } from '.'

interface Props extends ToggleRootProps {
  class?: HTMLAttributes['class']
  variant?: ToggleVariants['variant']
  size?: ToggleVariants['size']
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
})

const emit = defineEmits<ToggleRootEmits>()
const delegatedProps = reactiveOmit(props, ['class', 'size', 'variant'])
const forwardedProps = useForwardPropsEmits(delegatedProps, emit)
</script>

<template>
  <Toggle.Root
    v-bind="forwardedProps"
    :class="cn(
      toggleVariants({ variant: props.variant, size: props.size }),
      props.class,
    )"
  >
    <slot />
  </Toggle.Root>
</template>
