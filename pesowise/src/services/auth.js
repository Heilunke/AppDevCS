import { ref } from 'vue'
import { read, write, remove } from './storage'
import { loadUserData, clearUserData, deleteUserData } from './store'

export const currentUser = ref(null)
export const locked = ref(false)

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30000

const encoder = new TextEncoder()
const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')

const randomSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)))

// PBKDF2 with SHA-256: the password itself is never saved, only the salted hash
async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits'
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    key,
    256
  )
  return toHex(bits)
}

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt })

function startSession(user) {
  write('session', { userId: user.id })
  currentUser.value = publicUser(user)
  loadUserData(user.id)
}

export function restoreSession() {
  const session = read('session', null)
  if (!session) return
  const user = read('users', []).find((u) => u.id === session.userId)
  if (user) {
    currentUser.value = publicUser(user)
    loadUserData(user.id)
  } else {
    remove('session')
  }
}

export function validatePassword(password) {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    return 'Password must contain letters and numbers.'
  return ''
}

export async function register(name, email, password) {
  name = name.trim()
  email = email.trim().toLowerCase()
  if (!name) throw new Error('Please enter your name.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email.')
  const problem = validatePassword(password)
  if (problem) throw new Error(problem)

  const users = read('users', [])
  if (users.some((u) => u.email === email)) throw new Error('That email is already registered.')

  const salt = randomSalt()
  const user = {
    id: Date.now().toString(36),
    name,
    email,
    salt,
    hash: await hashPassword(password, salt),
    createdAt: Date.now()
  }
  users.push(user)
  write('users', users)
  startSession(user)
}

export async function login(email, password) {
  email = email.trim().toLowerCase()

  const guard = read('login_guard', { fails: 0, until: 0 })
  if (guard.until > Date.now()) {
    const secs = Math.ceil((guard.until - Date.now()) / 1000)
    throw new Error(`Too many attempts. Try again in ${secs} seconds.`)
  }

  const user = read('users', []).find((u) => u.email === email)
  const ok = user && (await hashPassword(password, user.salt)) === user.hash
  if (!ok) {
    guard.fails += 1
    if (guard.fails >= MAX_ATTEMPTS) {
      guard.fails = 0
      guard.until = Date.now() + LOCKOUT_MS
    }
    write('login_guard', guard)
    throw new Error('Wrong email or password.')
  }

  remove('login_guard')
  startSession(user)
}

export async function changePassword(oldPassword, newPassword) {
  const users = read('users', [])
  const user = users.find((u) => u.id === currentUser.value?.id)
  if (!user || (await hashPassword(oldPassword, user.salt)) !== user.hash)
    throw new Error('Current password is wrong.')
  const problem = validatePassword(newPassword)
  if (problem) throw new Error(problem)
  user.salt = randomSalt()
  user.hash = await hashPassword(newPassword, user.salt)
  write('users', users)
}

export function logout() {
  remove('session')
  currentUser.value = null
  locked.value = false
  clearUserData()
}

export function deleteAccount() {
  const id = currentUser.value?.id
  if (!id) return
  write('users', read('users', []).filter((u) => u.id !== id))
  deleteUserData(id)
  logout()
}
