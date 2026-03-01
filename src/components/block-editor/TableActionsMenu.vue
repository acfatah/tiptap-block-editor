<script setup lang="ts">
import {
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Trash2,
} from 'lucide-vue-next'

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

const props = defineProps<{
  isEnabled: boolean
  canDeleteRow: boolean
  canDeleteColumn: boolean
}>()
</script>

<template>
  <template v-if="props.isEnabled">
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuLabel>Table</DropdownMenuLabel>
      <DropdownMenuItem value="add-row-before">
        <BetweenHorizontalStart class="[&>rect:first-of-type]:stroke-primary" />
        Add Row Above
      </DropdownMenuItem>
      <DropdownMenuItem value="add-row-after">
        <BetweenHorizontalEnd class="[&>rect:last-of-type]:stroke-primary" />
        Add Row Below
      </DropdownMenuItem>
      <DropdownMenuItem v-if="props.canDeleteRow" value="delete-row">
        <Trash2 />
        Delete Row
      </DropdownMenuItem>
      <DropdownMenuItem value="add-column-before">
        <BetweenVerticalStart class="[&>rect:first-of-type]:stroke-primary" />
        Add Column Left
      </DropdownMenuItem>
      <DropdownMenuItem value="add-column-after">
        <BetweenVerticalEnd class="[&>rect:last-of-type]:stroke-primary" />
        Add Column Right
      </DropdownMenuItem>
      <DropdownMenuItem v-if="props.canDeleteColumn" value="delete-column">
        <Trash2 />
        Delete Column
      </DropdownMenuItem>
    </DropdownMenuGroup>
  </template>
</template>
