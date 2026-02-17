import type { VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'vue'

import type { buttonVariants } from '.'

export interface ButtonProps {
  scope?: string
  class?: HTMLAttributes['class']
  asChild?: boolean
  disabled?: boolean
  loading?: boolean
  size?: ButtonVariants['size']
  variant?: ButtonVariants['variant']
}

export type ButtonVariants = VariantProps<typeof buttonVariants>
