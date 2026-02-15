<script setup lang="ts">
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'

const props = defineProps<{
  modelValue: string
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit],
})
</script>

<template>
  <EditorContent :editor="editor" />
</template>
