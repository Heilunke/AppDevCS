<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="card">
        <h3>{{ currentUser?.name }}</h3>
        <p class="muted">{{ currentUser?.email }}</p>
      </div>

      <p class="section-title">Budget</p>
      <ion-list class="card ion-no-padding" lines="full">
        <ion-item>
          <ion-input
            :value="data.settings.allowance"
            label="Allowance (₱)"
            label-placement="stacked"
            type="number"
            inputmode="decimal"
            min="1"
            :helper-text="'Your baon for one ' + (data.settings.period === 'month' ? 'month' : 'week')"
            @ionChange="setAllowance($event)"
          />
        </ion-item>
        <ion-item>
          <ion-select v-model="data.settings.period" label="Budget period" interface="popover">
            <ion-select-option value="week">Weekly</ion-select-option>
            <ion-select-option value="month">Monthly</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item v-if="data.settings.period === 'week'">
          <ion-select v-model="data.settings.weekStart" label="Week starts on" interface="popover">
            <ion-select-option :value="0">Sunday</ion-select-option>
            <ion-select-option :value="1">Monday</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-select v-model="data.settings.warnAt" label="Warn me at" interface="popover">
            <ion-select-option :value="50">50% used</ion-select-option>
            <ion-select-option :value="70">70% used</ion-select-option>
            <ion-select-option :value="80">80% used</ion-select-option>
            <ion-select-option :value="90">90% used</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item lines="none">
          <ion-toggle v-model="data.settings.vibrate">Vibrate on budget alerts</ion-toggle>
        </ion-item>
      </ion-list>

      <p class="section-title">Security</p>
      <ion-list class="card ion-no-padding" lines="full">
        <ion-item>
          <ion-toggle :checked="data.settings.biometric" @ionChange="toggleBiometric($event)">
            Fingerprint lock
          </ion-toggle>
        </ion-item>
        <ion-item button :detail="true" lines="none" @click="changePass">
          <ion-label>Change password</ion-label>
        </ion-item>
      </ion-list>

      <p class="section-title">Device access</p>
      <p class="muted">Tap a row to test it. Android will ask for permission the first time.</p>
      <ion-list class="card ion-no-padding" lines="full">
        <ion-item button :detail="false" @click="testCamera">
          <ion-icon slot="start" :icon="camera" color="medium" />
          <ion-label>
            <h2>Camera</h2>
            <p>{{ results.camera || 'Used for receipt photos' }}</p>
          </ion-label>
        </ion-item>
        <ion-item button :detail="false" @click="testVibration">
          <ion-icon slot="start" :icon="phonePortrait" color="medium" />
          <ion-label>
            <h2>Vibration</h2>
            <p>{{ results.vibration || 'Used for budget alerts' }}</p>
          </ion-label>
        </ion-item>
        <ion-item button :detail="false" lines="none" @click="testFingerprint">
          <ion-icon slot="start" :icon="fingerPrint" color="medium" />
          <ion-label>
            <h2>Fingerprint</h2>
            <p>{{ results.fingerprint || 'Used for the app lock' }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <p class="section-title">Data</p>
      <ion-list class="card ion-no-padding" lines="full">
        <ion-item button :detail="false" @click="addSamples">
          <ion-icon slot="start" :icon="flask" color="medium" />
          <ion-label>
            <h2>Add sample expenses</h2>
            <p>Fills this week and last week with demo data</p>
          </ion-label>
        </ion-item>
        <ion-item button :detail="false" lines="none" @click="confirmClear">
          <ion-icon slot="start" :icon="trash" color="danger" />
          <ion-label color="danger">Delete all expenses</ion-label>
        </ion-item>
      </ion-list>

      <p class="section-title">Account</p>
      <ion-list class="card ion-no-padding" lines="full">
        <ion-item button :detail="false" @click="signOut">
          <ion-icon slot="start" :icon="logOut" color="medium" />
          <ion-label>Log out</ion-label>
        </ion-item>
        <ion-item button :detail="false" lines="none" @click="confirmDeleteAccount">
          <ion-icon slot="start" :icon="personRemove" color="danger" />
          <ion-label color="danger">Delete account</ion-label>
        </ion-item>
      </ion-list>

      <p class="muted ion-text-center">PesoWise v1.0 · Data is stored on this phone only.</p>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonSelect,
  IonSelectOption, IonToggle, IonLabel, IonIcon, alertController, toastController
} from '@ionic/vue'
import { camera, phonePortrait, fingerPrint, flask, trash, logOut, personRemove } from 'ionicons/icons'
import { currentUser, logout, deleteAccount, changePassword } from '../services/auth'
import { data, addExpense, clearExpenses } from '../services/store'
import { periodRange, addDays, toKey, todayKey } from '../services/budget'
import {
  takePhoto, vibrate, vibrationSupported, biometricAvailable, biometricVerify, ready
} from '../services/device'

const router = useRouter()
const results = reactive({ camera: '', vibration: '', fingerprint: '' })

async function toast(message, color = 'dark') {
  const t = await toastController.create({ message, color, duration: 2200, position: 'top' })
  t.present()
}

function setAllowance(event) {
  const value = Math.round(parseFloat(event.detail.value) * 100) / 100
  if (value > 0 && value <= 1000000) {
    data.settings.allowance = value
    toast('Allowance saved')
  } else {
    event.target.value = data.settings.allowance
    toast('Enter an allowance greater than zero.', 'danger')
  }
}

async function toggleBiometric(event) {
  const on = event.detail.checked
  if (!on) {
    data.settings.biometric = false
    return
  }
  if (!(await biometricAvailable())) {
    event.target.checked = false
    toast('Fingerprint is not available on this device.', 'danger')
    return
  }
  if (await biometricVerify('Turn on fingerprint lock')) {
    data.settings.biometric = true
    toast('Fingerprint lock is on')
  } else {
    event.target.checked = false
  }
}

async function changePass() {
  const alert = await alertController.create({
    header: 'Change password',
    inputs: [
      { name: 'old', type: 'password', placeholder: 'Current password' },
      { name: 'next', type: 'password', placeholder: 'New password' },
      { name: 'confirm', type: 'password', placeholder: 'Confirm new password' }
    ],
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Save',
        handler: (v) => {
          if (v.next !== v.confirm) {
            toast('New passwords do not match.', 'danger')
            return false
          }
          changePassword(v.old, v.next)
            .then(() => {
              alert.dismiss()
              toast('Password changed')
            })
            .catch((e) => toast(e.message, 'danger'))
          return false
        }
      }
    ]
  })
  alert.present()
}

async function testCamera() {
  try {
    const photo = await takePhoto()
    results.camera = photo ? 'Working ✔' : 'Cancelled'
  } catch (e) {
    results.camera = e.message
  }
}

function testVibration() {
  if (!vibrationSupported()) {
    results.vibration = 'Not supported on this device'
    return
  }
  vibrate([300, 150, 300])
  results.vibration = 'Vibrated. Did you feel it?'
}

async function testFingerprint() {
  const onDevice = await ready
  if (!onDevice) {
    results.fingerprint = 'Only works in the installed app'
    return
  }
  if (!(await biometricAvailable())) {
    results.fingerprint = 'Not available (no fingerprint set up?)'
    return
  }
  results.fingerprint = (await biometricVerify('Test fingerprint')) ? 'Working ✔' : 'Not recognised'
}

// Demo data so the Home and Reports tabs have something to show during a presentation
function addSamples() {
  const samples = [
    ['food', 'Lunch at canteen', 65],
    ['transport', 'Jeep to school', 26],
    ['snacks', 'Milk tea', 49],
    ['school', 'Photocopy handouts', 35],
    ['food', 'Breakfast', 45],
    ['load', 'GoSURF 50', 50],
    ['transport', 'Tricycle', 30],
    ['food', 'Dinner', 80],
    ['snacks', 'Siomai', 30],
    ['others', 'Org fee', 100]
  ]
  const thisStart = periodRange().start
  const lastStart = periodRange(new Date(), -1).start
  const today = todayKey()
  let added = 0
  samples.forEach(([category, note, amount], i) => {
    ;[addDays(thisStart, i % 5), addDays(lastStart, (i * 3) % 7)].forEach((d) => {
      const date = toKey(d)
      if (date > today) return
      addExpense({ category, note, amount, date })
      added++
    })
  })
  toast(`Added ${added} sample expenses`)
}

async function confirmClear() {
  const alert = await alertController.create({
    header: 'Delete all expenses?',
    message: 'Every expense and receipt photo will be removed. This cannot be undone.',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete all',
        role: 'destructive',
        handler: () => {
          clearExpenses()
          toast('All expenses deleted')
        }
      }
    ]
  })
  alert.present()
}

function signOut() {
  logout()
  router.replace('/login')
}

async function confirmDeleteAccount() {
  const alert = await alertController.create({
    header: 'Delete account?',
    message: 'Your account, expenses and settings will be erased from this phone.',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => {
          deleteAccount()
          router.replace('/login')
        }
      }
    ]
  })
  alert.present()
}
</script>
