<script setup lang="ts">
import type { ToggleGroupItemProps } from '@ark-ui/vue/toggle-group'
import type { HTMLAttributes } from 'vue'

import { ToggleGroup } from '@ark-ui/vue/toggle-group'
import { reactiveOmit } from '@vueuse/core'
import { computed } from 'vue'

import type { ToggleVariants } from '@/components/ui/toggle'

import { toggleVariants } from '@/components/ui/toggle'
import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'
import { cn } from '@/lib/utils'

import { useToggleGroupOptions } from './context'

interface Props extends ToggleGroupItemProps {
  class?: HTMLAttributes['class']
  variant?: ToggleVariants['variant']
  size?: ToggleVariants['size']
}

const props = defineProps<Props>()

const options = useToggleGroupOptions(
  computed(() => ({
    variant: undefined,
    size: undefined,
    spacing: undefined,
  })),
)

const delegatedProps = reactiveOmit(props, ['class', 'size', 'variant'])
const forwardedProps = useForwardPropsEmits(delegatedProps)
</script>

<template>
  <ToggleGroup.Item
    v-slot="slotProps"
    data-scope="toggle-group"
    data-part="item"
    :data-variant="options.variant || props.variant"
    :data-size="options.size || props.size"
    :data-spacing="options.spacing"
    :value="props.value"
    v-bind="forwardedProps"
    :class="cn(
      toggleVariants({
        variant: options.variant || props.variant,
        size: options.size || props.size,
      }),
      `
        w-auto min-w-0 shrink-0 px-3
        focus:z-10
        focus-visible:z-10
      `,
      'data-[spacing=0]:rounded-none data-[spacing=0]:shadow-none',
      `
        data-[spacing=0]:first:rounded-l-md
        data-[spacing=0]:last:rounded-r-md
      `,
      'data-[spacing=0]:data-[variant=outline]:border-l-0',
      'data-[spacing=0]:data-[variant=outline]:first:border-l',
      props.class,
    )"
  >
    <slot v-bind="slotProps" />
  </ToggleGroup.Item>
</template>
