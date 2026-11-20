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

        <div class="card demo">
          <p class="muted">Starter accounts (tap to fill in):</p>
          <ion-button
            v-for="d in DEMO_ACCOUNTS"
            :key="d.email"
            size="small"
            fill="outline"
            expand="block"
            @click="useDemo(d)"
          >
            {{ d.name }} · {{ d.settings.period === 'month' ? 'monthly' : 'weekly' }}
          </ion-button>
        </div>
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
import { DEMO_ACCOUNTS } from '../services/demo'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

function useDemo(d) {
  email.value = d.email
  password.value = d.password
  error.value = ''
}

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

<style scoped>
.demo {
  margin-top: 16px;
}
.demo p {
  margin: 0 0 8px;
}
.demo ion-button {
  margin: 6px 0;
}
</style>
