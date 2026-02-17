<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import { computed } from 'vue'

import { Dynamic } from '@/composables/dynamic'
import { useForwardPropsEmits } from '@/composables/useForwardPropsEmits'
import { cn } from '@/lib/utils'

import type { ButtonProps } from './types'

import { buttonVariants } from '.'

const props = withDefaults(defineProps<ButtonProps>(), {
  scope: 'button',
})

const delegatedProps = reactiveOmit(props, [
  'class',
  'asChild',
  'disabled',
  'loading',
  'size',
  'variant',
])

const forwardedProps = useForwardPropsEmits(delegatedProps)
const nativeDisabled = computed(() => props.disabled || props.loading || undefined)
const ariaDisabled = computed(() => (nativeDisabled.value ? 'true' : undefined))
</script>

<template>
  <component
    :is="props.asChild ? Dynamic : 'button'"
    :data-scope="props.scope"
    v-bind="forwardedProps"
    :disabled="nativeDisabled"
    :aria-disabled="ariaDisabled"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </component>
</template>
