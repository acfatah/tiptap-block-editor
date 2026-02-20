<script setup>
import { watchDebounced } from '@vueuse/core'
import { ref } from 'vue'

import BlockEditor from '@/components/BlockEditor.vue'

const value = ref(`
<p>Try to paste data copied from a spreadsheet or a Markdown table.</p>
`)

watchDebounced(value, (newValue) => {
  // eslint-disable-next-line no-console
  console.log('Content updated:', newValue)
}, { debounce: 500 })
</script>

<template>
  <main class="mx-auto mt-16 flex min-h-screen max-w-lg flex-1 flex-col">
    <BlockEditor v-model="value" />
  </main>
</template>
