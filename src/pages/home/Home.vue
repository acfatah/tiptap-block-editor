<script setup>
import { ref } from 'vue'

import BlockEditor from '@/components/BlockEditor.vue'

const value = ref(`
<p>Try to paste data copied from a spreadsheet or a Markdown table.</p>
`)
</script>

<template>
  <main class="mx-auto mt-16 flex min-h-screen max-w-lg flex-1 flex-col">
    <BlockEditor v-model="value" />
  </main>
</template>
