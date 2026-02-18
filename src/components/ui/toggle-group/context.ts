import type { ComputedRef } from 'vue'

import type { ToggleVariants } from '@/components/ui/toggle'

import { createContext } from '@/composables/createContext'

export interface ToggleGroupOptions {
  variant?: ToggleVariants['variant']
  size?: ToggleVariants['size']
  spacing?: number
}

export const [ToggleGroupOptionsProvider, useToggleGroupOptions]
  = createContext<ComputedRef<ToggleGroupOptions>>('ToggleGroupOptions')
