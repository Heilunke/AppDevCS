<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>PesoWise</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <p class="greeting">Hi, {{ firstName }}!</p>

      <!-- Budget summary -->
      <div class="card budget-card" :class="'bg-' + s.status">
        <p class="label">Remaining {{ s.label }}</p>
        <h1 class="remaining">{{ s.remaining < 0 ? '−' : '' }}{{ money(Math.abs(s.remaining)) }}</h1>
        <p class="label">of {{ money(s.allowance) }} · {{ rangeLabel(s.range) }}</p>

        <div class="bar"><div class="fill" :style="{ width: s.percent + '%' }" /></div>
        <div class="bar-legend">
          <span>Spent {{ money(s.spent) }}</span>
          <span>{{ s.percent }}%</span>
        </div>

        <p v-if="s.status === 'over'" class="status-msg">
          <ion-icon :icon="alertCircle" /> You're over budget by {{ money(-s.remaining) }}.
        </p>
        <p v-else-if="s.status === 'warn'" class="status-msg">
          <ion-icon :icon="warning" /> Careful, you've used {{ s.percent }}% of your budget.
        </p>
      </div>

      <!-- Quick stats -->
      <div class="stats">
        <div class="card stat">
          <p class="muted">Spent today</p>
          <h3>{{ money(s.spentToday) }}</h3>
        </div>
        <div class="card stat">
          <p class="muted">Safe to spend / day</p>
          <h3 :class="'status-' + s.status">{{ money(s.perDay) }}</h3>
        </div>
        <div class="card stat">
          <p class="muted">Days left</p>
          <h3>{{ s.daysLeft }}</h3>
        </div>
      </div>

      <!-- Recent expenses -->
      <div class="recent-head">
        <p class="section-title">Recent expenses</p>
        <ion-button fill="clear" size="small" router-link="/tabs/expenses">See all</ion-button>
      </div>

      <ion-list v-if="recent.length" class="card ion-no-padding" lines="full">
        <ExpenseItem v-for="e in recent" :key="e.id" :expense="e" show-date />
      </ion-list>
      <div v-else class="card empty">
        <ion-icon :icon="walletOutline" />
        <p>No expenses yet. Tap <b>+</b> to log your first one.</p>
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
import { computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonButton, IonIcon,
  IonFab, IonFabButton
} from '@ionic/vue'
import { add, alertCircle, warning, walletOutline } from 'ionicons/icons'
import ExpenseItem from '../components/ExpenseItem.vue'
import { currentUser } from '../services/auth'
import { data } from '../services/store'
import { summary, money, rangeLabel } from '../services/budget'
import { openEditor } from '../services/editor'

const s = summary
const firstName = computed(() => (currentUser.value?.name || '').split(' ')[0])
const recent = computed(() => data.expenses.slice(0, 5))
</script>

<style scoped>
.greeting {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 4px 4px 12px;
}
.budget-card {
  color: #fff;
  padding: 20px;
}
.bg-ok { background: linear-gradient(135deg, #1f8a4c, #14532d); }
.bg-warn { background: linear-gradient(135deg, #e9a23b, #b86e12); }
.bg-over { background: linear-gradient(135deg, #d64545, #8f1f1f); }
.label {
  margin: 0;
  opacity: 0.9;
  font-size: 0.9rem;
}
.remaining {
  margin: 6px 0;
  font-size: 2.4rem;
  font-weight: 800;
}
.bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  overflow: hidden;
  margin-top: 16px;
}
.fill {
  height: 100%;
  background: #fff;
  border-radius: 6px;
  transition: width 0.4s;
}
.bar-legend {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-top: 6px;
  opacity: 0.95;
}
.status-msg {
  margin: 12px 0 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
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
.recent-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
