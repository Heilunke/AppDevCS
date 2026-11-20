<template>
  <ion-page>
    <ion-content>
      <form class="auth-wrap" novalidate @submit.prevent="submit">
        <div class="auth-logo"><ion-icon :icon="wallet" /></div>
        <h1 class="ion-text-center">Create account</h1>
        <p class="muted ion-text-center">Your data stays on this phone.</p>

        <ion-list lines="full" class="card ion-no-padding">
          <ion-item>
            <ion-input v-model="name" label="Name" label-placement="floating" :maxlength="40" />
          </ion-item>
          <ion-item>
            <ion-input v-model="email" type="email" label="Email" label-placement="floating" autocomplete="email" />
          </ion-item>
          <ion-item>
            <ion-input v-model="password" type="password" label="Password" label-placement="floating" helper-text="At least 8 characters, with letters and numbers">
              <ion-input-password-toggle slot="end" />
            </ion-input>
          </ion-item>
          <ion-item lines="none">
            <ion-input v-model="confirm" type="password" label="Confirm password" label-placement="floating" />
          </ion-item>
        </ion-list>

        <p class="error-text">{{ error }}</p>
        <ion-button type="submit" expand="block" :disabled="loading">
          <ion-spinner v-if="loading" name="crescent" />
          <span v-else>Register</span>
        </ion-button>
        <ion-button expand="block" fill="clear" router-link="/login" router-direction="back">
          I already have an account
        </ion-button>
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
import { register } from '../services/auth'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    await register(name.value, email.value, password.value)
    password.value = confirm.value = ''
    router.replace('/tabs/home')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
