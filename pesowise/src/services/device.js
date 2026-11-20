// Phone features through Cordova plugins: camera, vibration and fingerprint.
// In the browser (npm run dev) these fall back to web versions where possible.
import { ref } from 'vue'

// true while a native screen (camera, fingerprint) is open, so the app does not lock itself
export const busy = ref(false)
const releaseBusy = () => setTimeout(() => (busy.value = false), 1500)

// Resolves true when Cordova is ready, false when running in a normal browser
export const ready = new Promise((resolve) => {
  if (!import.meta.env.PROD) return resolve(false)
  const script = document.createElement('script')
  script.src = 'cordova.js'
  script.onerror = () => resolve(false)
  document.addEventListener('deviceready', () => resolve(true), { once: true })
  document.head.appendChild(script)
  setTimeout(() => resolve(!!window.cordova), 8000)
})

/* ---------- Camera (receipt photos) ---------- */

export async function takePhoto(fromGallery = false) {
  await ready
  busy.value = true
  try {
    if (navigator.camera) return await cordovaPhoto(fromGallery)
    return await browserPhoto(fromGallery)
  } finally {
    releaseBusy()
  }
}

function cordovaPhoto(fromGallery) {
  return new Promise((resolve, reject) => {
    navigator.camera.getPicture(
      (base64) => resolve('data:image/jpeg;base64,' + base64),
      (message) => {
        const text = String(message || '').toLowerCase()
        if (text.includes('cancel') || text.includes('no image') || text.includes('selected'))
          resolve(null)
        else reject(new Error('Camera error: ' + message))
      },
      {
        quality: 50,
        destinationType: window.Camera.DestinationType.DATA_URL,
        sourceType: fromGallery
          ? window.Camera.PictureSourceType.PHOTOLIBRARY
          : window.Camera.PictureSourceType.CAMERA,
        encodingType: window.Camera.EncodingType.JPEG,
        targetWidth: 800,
        targetHeight: 800,
        correctOrientation: true
      }
    )
  })
}

function browserPhoto(fromGallery) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    if (!fromGallery) input.capture = 'environment'
    input.onchange = () => {
      const file = input.files && input.files[0]
      if (!file) return resolve(null)
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, 800 / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(img.src)
        resolve(canvas.toDataURL('image/jpeg', 0.5))
      }
      img.onerror = () => reject(new Error('Could not read that image.'))
      img.src = URL.createObjectURL(file)
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

/* ---------- Vibration (budget alerts) ---------- */

export const vibrationSupported = () =>
  !!(navigator.notification && navigator.notification.vibrate) || 'vibrate' in navigator

export function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern)
    else if (navigator.notification && navigator.notification.vibrate)
      navigator.notification.vibrate(Array.isArray(pattern) ? pattern[0] : pattern)
  } catch {
    /* vibration is optional */
  }
}

export const PATTERNS = {
  warn: [250],
  over: [400, 150, 400, 150, 400]
}

/* ---------- Fingerprint lock ---------- */

export async function biometricAvailable() {
  await ready
  if (!window.Fingerprint) return false
  return new Promise((resolve) =>
    window.Fingerprint.isAvailable(
      () => resolve(true),
      () => resolve(false)
    )
  )
}

export async function biometricVerify(reason = 'Confirm it is you') {
  await ready
  if (!window.Fingerprint) return false
  busy.value = true
  try {
    return await new Promise((resolve) =>
      window.Fingerprint.show(
        { title: 'PesoWise', description: reason, disableBackup: false },
        () => resolve(true),
        () => resolve(false)
      )
    )
  } finally {
    releaseBusy()
  }
}
