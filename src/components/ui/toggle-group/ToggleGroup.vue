<script setup lang="ts">
import type { ToggleGroupRootEmits, ToggleGroupRootProps } from '@ark-ui/vue/toggle-group'
import type { HTMLAttributes } from 'vue'

import { ToggleGroup } from '@ark-ui/vue/toggle-group'
import { reactiveOmit } from '@vueuse/core'
import { computed } from 'vue'

import type { ToggleVariants } from '@/components/ui/toggle'

import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'
import { cn } from '@/lib/utils'

import { ToggleGroupOptionsProvider } from './context'

interface Props extends ToggleGroupRootProps {
  class?: HTMLAttributes['class']
  variant?: ToggleVariants['variant']
  size?: ToggleVariants['size']
  spacing?: number
}

const props = withDefaults(defineProps<Props>(), {
  spacing: 0,
  variant: 'default',
  size: 'default',
})

const emit = defineEmits<ToggleGroupRootEmits>()

const options = computed(() => ({
  variant: props.variant,
  size: props.size,
  spacing: props.spacing,
}))

ToggleGroupOptionsProvider(options)

const delegatedProps = reactiveOmit(props, ['class', 'size', 'variant', 'spacing'])
const forwardedProps = useForwardPropsEmits(delegatedProps, emit)
</script>

<template>
  <ToggleGroup.Root
    v-slot="slotProps"
    data-scope="toggle-group"
    data-part="root"
    :data-size="props.size"
    :data-variant="props.variant"
    :data-spacing="props.spacing"
    :style="{
      '--toggle-group-gap': `${props.spacing}px`,
    }"
    v-bind="forwardedProps"
    :class="cn(
      'group/toggle-group flex w-fit items-center gap-(--toggle-group-gap) rounded-md',
      'data-[spacing=0]:data-[variant=outline]:shadow-xs',
      props.class,
    )"
  >
    <slot v-bind="slotProps" />
  </ToggleGroup.Root>
</template>
