<template>
  <ion-app>
    <ion-router-outlet />

    <!-- Fingerprint lock screen -->
    <div v-if="locked" class="lock-screen">
      <ion-icon :icon="lockClosed" class="lock-icon" />
      <h2>PesoWise is locked</h2>
      <p>Hi {{ currentUser?.name }}, confirm it is you to see your expenses.</p>
      <ion-button expand="block" color="light" @click="unlock">
        <ion-icon slot="start" :icon="fingerPrint" />
        Unlock
      </ion-button>
      <ion-button expand="block" fill="clear" color="light" @click="signOut">Log out instead</ion-button>
    </div>
  </ion-app>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonApp, IonRouterOutlet, IonButton, IonIcon, useBackButton } from '@ionic/vue'
import { lockClosed, fingerPrint } from 'ionicons/icons'
import { currentUser, locked, logout } from './services/auth'
import { data } from './services/store'
import { ready, busy, biometricVerify } from './services/device'

const router = useRouter()

// Android back button: go back from Register, otherwise close the app
useBackButton(50, () => {
  if (router.currentRoute.value.path === '/register' && !locked.value) router.back()
  else if (navigator.app) navigator.app.exitApp()
})

const AUTO_LOCK_MS = 10000 // lock again if the app was in the background longer than this
let pausedAt = 0

const lockEnabled = () => !!currentUser.value && data.settings.biometric

async function unlock() {
  if (await biometricVerify('Unlock PesoWise')) locked.value = false
}

function signOut() {
  logout()
  router.replace('/login')
}

onMounted(async () => {
  const onDevice = await ready
  if (!onDevice) return

  if (lockEnabled()) {
    locked.value = true
    unlock()
  }

  document.addEventListener('pause', () => (pausedAt = Date.now()))
  document.addEventListener('resume', () => {
    if (busy.value || locked.value || !lockEnabled()) return
    if (Date.now() - pausedAt > AUTO_LOCK_MS) {
      locked.value = true
      unlock()
    }
  })
})
</script>

<style scoped>
.lock-screen {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: #14532d;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 32px;
  text-align: center;
}
.lock-icon {
  font-size: 64px;
  margin: 0 auto 8px;
}
.lock-screen p {
  color: #cfe3d6;
  margin-bottom: 24px;
}
</style>
