<template>
  <ion-item button :detail="false" @click="openEditor(expense)">
    <CategoryIcon slot="start" :category="expense.category" />
    <ion-label>
      <h2>{{ expense.note || categoryOf(expense.category).label }}</h2>
      <p>
        {{ categoryOf(expense.category).label }}
        <span v-if="showDate"> · {{ formatDay(expense.date) }}</span>
        <ion-icon v-if="expense.photo" :icon="camera" class="photo-flag" />
      </p>
    </ion-label>
    <span slot="end" class="amount-neg">−{{ money(expense.amount) }}</span>
  </ion-item>
</template>

<script setup>
import { IonItem, IonLabel, IonIcon } from '@ionic/vue'
import { camera } from 'ionicons/icons'
import CategoryIcon from './CategoryIcon.vue'
import { categoryOf } from '../services/store'
import { money, formatDay } from '../services/budget'
import { openEditor } from '../services/editor'

defineProps({
  expense: { type: Object, required: true },
  showDate: { type: Boolean, default: false }
})
</script>

<style scoped>
.photo-flag {
  vertical-align: -2px;
  margin-left: 6px;
  color: var(--ion-color-primary);
}
</style>
