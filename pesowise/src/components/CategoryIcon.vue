<template>
  <span class="cat-icon" :style="{ background: cat.color }">
    <ion-icon :icon="ICONS[cat.icon]" />
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { fastFood, bus, school, phonePortrait, cafe, ellipsisHorizontal } from 'ionicons/icons'
import { categoryOf } from '../services/store'

const props = defineProps({ category: { type: String, default: 'others' } })
const ICONS = { fastFood, bus, school, phonePortrait, cafe, ellipsisHorizontal }
const cat = computed(() => categoryOf(props.category))
</script>

<style scoped>
.cat-icon {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 12px;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
</style>
