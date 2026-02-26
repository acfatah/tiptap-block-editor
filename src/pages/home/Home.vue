<script setup>
import { watchDebounced } from '@vueuse/core'
import { ref } from 'vue'

import { BlockEditor } from '@/components/block-editor'

import sample from './sample.txt?raw'

const value = ref(sample)

watchDebounced(value, (newValue) => {
  // eslint-disable-next-line no-console
  console.log('Content updated:', newValue)
}, { debounce: 1000 })
</script>

<template>
  <main class="mx-auto mt-16 flex min-h-screen max-w-lg flex-1 flex-col">
    <BlockEditor v-model="value" placeholder="Type '/' to insert blocks" />
  </main>
</template>
