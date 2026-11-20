<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon :icon="home" />
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="expenses" href="/tabs/expenses">
          <ion-icon :icon="receipt" />
          <ion-label>Expenses</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="reports" href="/tabs/reports">
          <ion-icon :icon="pieChart" />
          <ion-label>Reports</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="settings" href="/tabs/settings">
          <ion-icon :icon="settings" />
          <ion-label>Settings</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>

    <!-- Add / Edit expense sheet, opened from any tab -->
    <ExpenseEditor />
  </ion-page>
</template>

<script setup>
import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, useBackButton } from '@ionic/vue'
import { home, receipt, pieChart, settings } from 'ionicons/icons'
import ExpenseEditor from '../components/ExpenseEditor.vue'
import { editor, closeEditor } from '../services/editor'

// Back button closes the expense sheet first
useBackButton(101, (next) => {
  if (editor.open) closeEditor()
  else next()
})
</script>
