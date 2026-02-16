<script setup lang="ts">
import type { PolymorphicProps } from '@ark-ui/vue'
import type { HTMLAttributes } from 'vue'

import { ark } from '@ark-ui/vue'
import { reactiveOmit } from '@vueuse/core'

import { useForwardProps } from '@/composables/useForwardProps'
import { cn } from '@/lib/utils'

interface Props extends PolymorphicProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const delegatedProps = reactiveOmit(props, 'class')
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <ark.span
    data-scope="dropdown-menu"
    data-part="shortcut"
    v-bind="forwardedProps"
    :class="cn(
      'ml-auto text-xs tracking-widest text-muted-foreground',
      props.class,
    )"
  >
    <slot />
  </ark.span>
</template>
