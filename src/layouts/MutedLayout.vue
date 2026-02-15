<script setup lang="ts">
/**
 * Layout with muted background.
 */

import { onMounted, onUnmounted } from 'vue'

function swapBodyClass(oldClass: string, newClass: string) {
  document.body.classList.remove(oldClass)
  document.body.classList.add(newClass)
}

onMounted(() => {
  swapBodyClass('bg-background', 'bg-muted')
})

onUnmounted(() => {
  swapBodyClass('bg-muted', 'bg-background')
})
</script>

<template>
  <RouterView />
</template>
