<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Expenses</ion-title>
      </ion-toolbar>
      <ion-toolbar class="sub-toolbar">
        <ion-segment v-model="filter">
          <ion-segment-button value="period">
            <ion-label>{{ data.settings.period === 'month' ? 'This month' : 'This week' }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="last">
            <ion-label>{{ data.settings.period === 'month' ? 'Last month' : 'Last week' }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="all">
            <ion-label>All</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-searchbar v-model="search" placeholder="Search notes" class="ion-no-padding" />

      <div class="chips">
        <ion-chip :outline="category !== ''" @click="category = ''">All</ion-chip>
        <ion-chip
          v-for="c in CATEGORIES"
          :key="c.id"
          :outline="category !== c.id"
          @click="category = category === c.id ? '' : c.id"
        >
          {{ c.label }}
        </ion-chip>
      </div>

      <div class="card total-card">
        <span>{{ filtered.length }} expense{{ filtered.length === 1 ? '' : 's' }}</span>
        <b>{{ money(sum(filtered)) }}</b>
      </div>

      <template v-if="groups.length">
        <div v-for="g in groups" :key="g.date">
          <div class="day-head">
            <span>{{ formatDay(g.date) }}</span>
            <span>{{ money(g.total) }}</span>
          </div>
          <ion-list class="card ion-no-padding" lines="full">
            <ion-item-sliding v-for="e in g.items" :key="e.id">
              <ExpenseItem :expense="e" />
              <ion-item-options side="end">
                <ion-item-option color="danger" @click="confirmDelete(e)">
                  <ion-icon slot="icon-only" :icon="trash" />
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </ion-list>
        </div>
        <p class="muted ion-text-center">Tap an expense to edit. Swipe left to delete.</p>
      </template>
      <div v-else class="card empty">
        <ion-icon :icon="receiptOutline" />
        <p>No expenses found.</p>
      </div>

      <div style="height: 72px" />
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button @click="openEditor()">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel,
  IonSearchbar, IonChip, IonList, IonItemSliding, IonItemOptions, IonItemOption, IonIcon,
  IonFab, IonFabButton, alertController
} from '@ionic/vue'
import { add, trash, receiptOutline } from 'ionicons/icons'
import ExpenseItem from '../components/ExpenseItem.vue'
import { data, CATEGORIES, removeExpense } from '../services/store'
import { periodRange, expensesIn, sum, money, formatDay } from '../services/budget'
import { openEditor } from '../services/editor'

const filter = ref('period')
const search = ref('')
const category = ref('')

const filtered = computed(() => {
  let list = data.expenses
  if (filter.value === 'period') list = expensesIn(periodRange())
  if (filter.value === 'last') list = expensesIn(periodRange(new Date(), -1))
  if (category.value) list = list.filter((e) => e.category === category.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((e) => (e.note || '').toLowerCase().includes(q))
  return list
})

// Group by date (the list is already sorted newest first)
const groups = computed(() => {
  const map = new Map()
  for (const e of filtered.value) {
    if (!map.has(e.date)) map.set(e.date, [])
    map.get(e.date).push(e)
  }
  return [...map].map(([date, items]) => ({ date, items, total: sum(items) }))
})

async function confirmDelete(e) {
  const alert = await alertController.create({
    header: 'Delete expense?',
    message: `${e.note || 'This expense'} (${money(e.amount)}) will be removed.`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      { text: 'Delete', role: 'destructive', handler: () => removeExpense(e.id) }
    ]
  })
  alert.present()
}
</script>

<style scoped>
.sub-toolbar {
  --background: #fff;
  --color: #1d2733;
}
.chips {
  display: flex;
  overflow-x: auto;
  margin: 8px 0;
}
.chips ion-chip {
  flex-shrink: 0;
}
.total-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}
.day-head {
  display: flex;
  justify-content: space-between;
  margin: 14px 4px 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7480;
}
</style>
