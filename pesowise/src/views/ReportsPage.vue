<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Reports</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Period picker -->
      <div class="card picker">
        <ion-button fill="clear" @click="offset--"><ion-icon slot="icon-only" :icon="chevronBack" /></ion-button>
        <div class="ion-text-center">
          <b>{{ periodName }}</b>
          <p class="muted">{{ rangeLabel(range) }}</p>
        </div>
        <ion-button fill="clear" :disabled="offset >= 0" @click="offset++">
          <ion-icon slot="icon-only" :icon="chevronForward" />
        </ion-button>
      </div>

      <!-- Totals -->
      <div class="stats">
        <div class="card stat">
          <p class="muted">Spent</p>
          <h3>{{ money(total) }}</h3>
        </div>
        <div class="card stat">
          <p class="muted">{{ saved >= 0 ? 'Saved' : 'Over by' }}</p>
          <h3 :class="saved >= 0 ? 'status-ok' : 'status-over'">{{ money(Math.abs(saved)) }}</h3>
        </div>
        <div class="card stat">
          <p class="muted">Average / day</p>
          <h3>{{ money(average) }}</h3>
        </div>
      </div>

      <!-- Daily chart -->
      <p class="section-title">Spending per day</p>
      <div class="card">
        <div v-if="total > 0" class="chart" :class="{ dense: days.length > 7 }">
          <div v-for="d in days" :key="d.key" class="col">
            <span v-if="days.length <= 7" class="col-value">{{ d.amount ? shortMoney(d.amount) : '' }}</span>
            <div class="col-bar-wrap">
              <div
                class="col-bar"
                :class="{ over: dailyLimit && d.amount > dailyLimit, today: d.key === todayKey() }"
                :style="{ height: (d.amount / maxDay) * 100 + '%' }"
              />
            </div>
            <span class="col-label">{{ d.label }}</span>
          </div>
        </div>
        <p v-else class="muted ion-text-center">No spending in this period.</p>
        <p v-if="total > 0" class="muted legend">
          <span class="dot red" /> above your daily share of {{ money(dailyLimit) }}
        </p>
      </div>

      <!-- Category breakdown -->
      <p class="section-title">Where your baon went</p>
      <div class="card">
        <template v-if="cats.length">
          <div v-for="c in cats" :key="c.id" class="cat-row">
            <CategoryIcon :category="c.id" />
            <div class="cat-info">
              <div class="cat-top">
                <span>{{ c.label }}</span>
                <span><b>{{ money(c.amount) }}</b> · {{ c.percent }}%</span>
              </div>
              <div class="cat-bar"><div :style="{ width: c.percent + '%', background: c.color }" /></div>
            </div>
          </div>
          <p class="muted tip">
            Most of your money went to <b>{{ cats[0].label }}</b> this period.
          </p>
        </template>
        <p v-else class="muted ion-text-center">Nothing to show yet.</p>
      </div>

      <!-- Past periods -->
      <p class="section-title">Past {{ data.settings.period === 'month' ? 'months' : 'weeks' }}</p>
      <ion-list class="card ion-no-padding" lines="full">
        <ion-item v-for="p in history" :key="p.offset" button :detail="false" @click="offset = p.offset">
          <ion-label>
            <h2>{{ rangeLabel(p.range) }}</h2>
            <p>Spent {{ money(p.spent) }}</p>
          </ion-label>
          <ion-note slot="end" :class="p.saved >= 0 ? 'status-ok' : 'status-over'">
            {{ p.saved >= 0 ? 'Saved ' : 'Over ' }}{{ money(Math.abs(p.saved)) }}
          </ion-note>
        </ion-item>
      </ion-list>
      <p class="muted">Saved / over is compared with your current allowance of {{ money(data.settings.allowance) }}.</p>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonList, IonItem,
  IonLabel, IonNote
} from '@ionic/vue'
import { chevronBack, chevronForward } from 'ionicons/icons'
import CategoryIcon from '../components/CategoryIcon.vue'
import { data } from '../services/store'
import {
  periodRange, rangeLabel, expensesIn, daysIn, sum, money, byCategory, fromKey, todayKey
} from '../services/budget'

const offset = ref(0)
const isMonth = computed(() => data.settings.period === 'month')

const periodName = computed(() => {
  const unit = isMonth.value ? 'month' : 'week'
  if (offset.value === 0) return `This ${unit}`
  if (offset.value === -1) return `Last ${unit}`
  return `${-offset.value} ${unit}s ago`
})

const range = computed(() => periodRange(new Date(), offset.value))
const list = computed(() => expensesIn(range.value))
const total = computed(() => sum(list.value))
const allowance = computed(() => Number(data.settings.allowance) || 0)
const saved = computed(() => Math.round((allowance.value - total.value) * 100) / 100)

// For the current period only count days up to today
const countedDays = computed(() => {
  const keys = daysIn(range.value)
  return offset.value === 0 ? keys.filter((k) => k <= todayKey()) : keys
})
const average = computed(() => (countedDays.value.length ? total.value / countedDays.value.length : 0))

const dailyLimit = computed(() => {
  const n = daysIn(range.value).length
  return n ? Math.round((allowance.value / n) * 100) / 100 : 0
})

const days = computed(() =>
  daysIn(range.value).map((key) => {
    const d = fromKey(key)
    return {
      key,
      amount: sum(list.value.filter((e) => e.date === key)),
      label: isMonth.value
        ? d.getDate() % 5 === 1 ? String(d.getDate()) : ''
        : d.toLocaleDateString('en-PH', { weekday: 'narrow' })
    }
  })
)
const maxDay = computed(() => Math.max(1, ...days.value.map((d) => d.amount)))

const shortMoney = (n) => (n >= 1000 ? '₱' + (n / 1000).toFixed(1) + 'k' : '₱' + Math.round(n))

const cats = computed(() => byCategory(list.value))

const history = computed(() =>
  [-1, -2, -3, -4, -5, -6].map((o) => {
    const r = periodRange(new Date(), o)
    const spent = sum(expensesIn(r))
    return { offset: o, range: r, spent, saved: Math.round((allowance.value - spent) * 100) / 100 }
  })
)
</script>

<style scoped>
.picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
}
.picker p {
  margin: 2px 0 0;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.stat {
  padding: 12px;
  margin-bottom: 0;
}
.stat p {
  margin: 0;
  font-size: 0.75rem;
}
.stat h3 {
  margin: 4px 0 0;
  font-size: 1.05rem;
  font-weight: 700;
}
.chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 180px;
}
.chart.dense {
  gap: 2px;
}
.col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  min-width: 0;
}
.col-value {
  font-size: 0.65rem;
  color: #6b7480;
  height: 14px;
}
.col-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
}
.col-bar {
  width: 100%;
  background: var(--ion-color-primary);
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  transition: height 0.4s;
}
.col-bar.over {
  background: var(--bb-over);
}
.col-bar.today {
  outline: 2px solid #1d2733;
  outline-offset: 1px;
}
.col-label {
  font-size: 0.7rem;
  color: #6b7480;
  height: 16px;
  margin-top: 4px;
}
.legend {
  font-size: 0.75rem;
  margin: 10px 0 0;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  vertical-align: -1px;
}
.dot.red {
  background: var(--bb-over);
}
.cat-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
.cat-info {
  flex: 1;
}
.cat-top {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 4px;
}
.cat-bar {
  height: 8px;
  background: #eef1ef;
  border-radius: 5px;
  overflow: hidden;
}
.cat-bar div {
  height: 100%;
  border-radius: 5px;
}
.tip {
  margin: 4px 0 0;
}
</style>
