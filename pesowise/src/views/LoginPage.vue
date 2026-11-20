<template>
  <ion-page>
    <ion-content>
      <form class="auth-wrap" novalidate @submit.prevent="submit">
        <div class="auth-logo"><ion-icon :icon="wallet" /></div>
        <h1 class="ion-text-center">PesoWise</h1>
        <p class="muted ion-text-center">Track your baon. Spend smart, save more.</p>

        <ion-list lines="full" class="card ion-no-padding">
          <ion-item>
            <ion-input v-model="email" type="email" label="Email" label-placement="floating" autocomplete="email" />
          </ion-item>
          <ion-item lines="none">
            <ion-input v-model="password" type="password" label="Password" label-placement="floating">
              <ion-input-password-toggle slot="end" />
            </ion-input>
          </ion-item>
        </ion-list>

        <p class="error-text">{{ error }}</p>
        <ion-button type="submit" expand="block" :disabled="loading">
          <ion-spinner v-if="loading" name="crescent" />
          <span v-else>Log in</span>
        </ion-button>
        <ion-button expand="block" fill="clear" router-link="/register">Create an account</ion-button>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonContent, IonList, IonItem, IonInput, IonInputPasswordToggle,
  IonButton, IonIcon, IonSpinner
} from '@ionic/vue'
import { wallet } from 'ionicons/icons'
import { login } from '../services/auth'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Enter your email and password.'
    return
  }
  loading.value = true
  try {
    await login(email.value, password.value)
    password.value = ''
    router.replace('/tabs/home')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
