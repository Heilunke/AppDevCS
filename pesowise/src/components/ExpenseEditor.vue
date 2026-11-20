<template>
  <ion-modal :is-open="editor.open" @didDismiss="closeEditor" @willPresent="fill">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="closeEditor">Cancel</ion-button>
        </ion-buttons>
        <ion-title>{{ editing ? 'Edit expense' : 'Add expense' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :strong="true" @click="save">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="card amount-card">
        <span class="peso">₱</span>
        <input
          ref="amountInput"
          v-model="form.amount"
          class="amount-input"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.01"
          placeholder="0.00"
        />
      </div>

      <p class="section-title">Category</p>
      <div class="cat-grid">
        <button
          v-for="c in CATEGORIES"
          :key="c.id"
          type="button"
          class="cat-btn"
          :class="{ active: form.category === c.id }"
          :style="form.category === c.id ? { borderColor: c.color, background: c.color + '1a' } : {}"
          @click="form.category = c.id"
        >
          <CategoryIcon :category="c.id" />
          <span>{{ c.label }}</span>
        </button>
      </div>

      <ion-list class="card ion-no-padding" lines="full">
        <ion-item>
          <ion-input v-model="form.note" label="Note (optional)" label-placement="stacked" placeholder="e.g. Lunch at canteen" :maxlength="40" />
        </ion-item>
        <ion-item lines="none">
          <ion-input v-model="form.date" label="Date" label-placement="stacked" type="date" :max="todayKey()" />
        </ion-item>
      </ion-list>

      <p class="section-title">Receipt photo (optional)</p>
      <div class="card">
        <img v-if="form.photo" :src="form.photo" class="receipt" alt="Receipt" @click="viewPhoto = true" />
        <div class="photo-actions">
          <ion-button fill="outline" size="small" @click="addPhoto(false)">
            <ion-icon slot="start" :icon="camera" /> {{ form.photo ? 'Retake' : 'Take photo' }}
          </ion-button>
          <ion-button fill="outline" size="small" @click="addPhoto(true)">
            <ion-icon slot="start" :icon="images" /> Gallery
          </ion-button>
          <ion-button v-if="form.photo" fill="clear" size="small" color="danger" @click="form.photo = null">
            Remove
          </ion-button>
        </div>
      </div>

      <p class="error-text">{{ error }}</p>

      <ion-button v-if="editing" expand="block" fill="outline" color="danger" @click="confirmDelete">
        <ion-icon slot="start" :icon="trash" /> Delete expense
      </ion-button>
    </ion-content>

    <div v-if="viewPhoto" class="photo-viewer" @click="viewPhoto = false">
      <img :src="form.photo" alt="Receipt" />
      <p>Tap anywhere to close</p>
    </div>
  </ion-modal>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
  IonList, IonItem, IonInput, IonIcon, alertController, toastController
} from '@ionic/vue'
import { camera, images, trash } from 'ionicons/icons'
import CategoryIcon from './CategoryIcon.vue'
import { editor, closeEditor } from '../services/editor'
import { CATEGORIES, data, addExpense, updateExpense, removeExpense } from '../services/store'
import { todayKey, summary, money } from '../services/budget'
import { takePhoto, vibrate, PATTERNS } from '../services/device'

const form = reactive({ amount: '', category: 'food', note: '', date: todayKey(), photo: null })
const error = ref('')
const viewPhoto = ref(false)
const amountInput = ref(null)
const editing = computed(() => !!editor.expense)

function fill() {
  const e = editor.expense
  form.amount = e ? String(e.amount) : ''
  form.category = e ? e.category : 'food'
  form.note = e ? e.note : ''
  form.date = e ? e.date : todayKey()
  form.photo = e ? e.photo : null
  error.value = ''
  viewPhoto.value = false
  if (!e) setTimeout(() => amountInput.value?.focus(), 400)
}

async function toast(message, color = 'dark', duration = 2200) {
  const t = await toastController.create({ message, color, duration, position: 'top' })
  t.present()
}

async function addPhoto(fromGallery) {
  try {
    const photo = await takePhoto(fromGallery)
    if (photo) form.photo = photo
  } catch (e) {
    toast(e.message, 'danger')
  }
}

// Vibrate and show a message when this save pushed the budget into "warn" or "over"
function budgetAlert(before) {
  const after = summary.value.status
  const rank = { ok: 0, warn: 1, over: 2 }
  if (rank[after] <= rank[before]) return
  if (data.settings.vibrate) vibrate(PATTERNS[after])
  if (after === 'over')
    toast(`Over budget! You've spent ${money(summary.value.spent)} of ${money(summary.value.allowance)} ${summary.value.label}.`, 'danger', 4000)
  else
    toast(`Heads up: ${summary.value.percent}% of your budget is used. ${money(summary.value.remaining)} left.`, 'warning', 4000)
}

function save() {
  const amount = Math.round(parseFloat(form.amount) * 100) / 100
  if (!amount || amount <= 0) return (error.value = 'Enter an amount greater than zero.')
  if (amount > 1000000) return (error.value = 'That amount is too large.')
  if (!form.date) return (error.value = 'Pick a date.')
  if (form.date > todayKey()) return (error.value = 'The date cannot be in the future.')

  const before = summary.value.status
  const values = {
    amount,
    category: form.category,
    note: form.note.trim(),
    date: form.date,
    photo: form.photo
  }
  const result = editing.value ? updateExpense(editor.expense.id, values) : addExpense(values)
  closeEditor()

  if (!result.photoSaved) toast('Saved, but the photo was too big for the phone storage.', 'warning')
  else toast(editing.value ? 'Expense updated' : `Added ${money(amount)}`)
  budgetAlert(before)
}

async function confirmDelete() {
  const alert = await alertController.create({
    header: 'Delete expense?',
    message: 'This cannot be undone.',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => {
          removeExpense(editor.expense.id)
          closeEditor()
          toast('Expense deleted')
        }
      }
    ]
  })
  alert.present()
}
</script>

<style scoped>
.amount-card {
  display: flex;
  align-items: center;
  gap: 8px;
}
.peso {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ion-color-primary);
}
.amount-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 2.2rem;
  font-weight: 700;
  width: 100%;
  background: transparent;
  color: #1d2733;
}
.cat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}
.cat-btn {
  background: #fff;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 10px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #1d2733;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.receipt {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 8px;
}
.photo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.photo-viewer {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ccc;
}
.photo-viewer img {
  max-width: 100%;
  max-height: 85%;
}
</style>
