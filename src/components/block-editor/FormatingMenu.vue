<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import type { Ref } from 'vue'

import { BubbleMenu } from '@tiptap/vue-3/menus'
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-vue-next'
import { toRef } from 'vue'

import type { MarkValue } from '@/components/block-editor/composables/useFormattingMenu'

import { useFormattingMenu } from '@/components/block-editor/composables/useFormattingMenu'
import { ToggleGroup } from '@/components/ui/toggle-group'

const props = defineProps<{
  editor: Editor
  selectionTick: number
  isDragging: boolean
}>()

const bubbleMenuItems: {
  value: MarkValue
  label: string
  icon: typeof Bold
}[] = [
  { value: 'bold', label: 'Bold', icon: Bold },
  { value: 'italic', label: 'Italic', icon: Italic },
  { value: 'underline', label: 'Underline', icon: UnderlineIcon },
  { value: 'strike', label: 'Strikethrough', icon: Strikethrough },
]

const {
  activeMarks,
  shouldShowBubbleMenu,
  shouldShowBubbleMenuForSelection,
  toggleMark,
} = useFormattingMenu({
  editor: toRef(props, 'editor') as Ref<Editor | undefined>,
  selectionTick: toRef(props, 'selectionTick'),
  isDragging: toRef(props, 'isDragging'),
})

defineExpose({ shouldShowBubbleMenu })
</script>

<template>
  <BubbleMenu
    :editor="editor"
    :tippy-options="{ duration: 120, placement: 'top' }"
    :should-show="shouldShowBubbleMenuForSelection"
  >
    <div
      class="rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
    >
      <ToggleGroup.Root
        :model-value="activeMarks"
        multiple
        size="sm"
        variant="default"
        :spacing="4"
      >
        <ToggleGroup.Item
          v-for="item in bubbleMenuItems"
          :key="item.value"
          :value="item.value"
          type="button"
          :aria-label="item.label"
          @click="toggleMark(item.value)"
        >
          <component :is="item.icon" />
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>
  </BubbleMenu>
</template>
