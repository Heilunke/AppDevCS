import { reactive, watch } from 'vue'
import { read, write, remove } from './storage'

// Expense categories shown in the app (icon names come from ionicons)
export const CATEGORIES = [
  { id: 'food', label: 'Food', icon: 'fastFood', color: '#e76f51' },
  { id: 'transport', label: 'Fare', icon: 'bus', color: '#2a9d8f' },
  { id: 'school', label: 'School', icon: 'school', color: '#457b9d' },
  { id: 'load', label: 'Load / Data', icon: 'phonePortrait', color: '#8e6bbf' },
  { id: 'snacks', label: 'Snacks', icon: 'cafe', color: '#e9a23b' },
  { id: 'others', label: 'Others', icon: 'ellipsisHorizontal', color: '#6b7480' }
]

export const categoryOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[5]

const defaultSettings = () => ({
  allowance: 1000, // budget per period, in pesos
  period: 'week', // 'week' or 'month'
  weekStart: 1, // 0 = Sunday, 1 = Monday
  warnAt: 80, // warn when this % of the budget is used
  vibrate: true,
  biometric: false
})

export const data = reactive({
  expenses: [],
  settings: defaultSettings()
})

let uid = null

export function loadUserData(userId) {
  uid = userId
  data.expenses = read(`expenses_${uid}`, [])
  data.settings = { ...defaultSettings(), ...read(`settings_${uid}`, {}) }
}

export function clearUserData() {
  uid = null
  data.expenses = []
  data.settings = defaultSettings()
}

export function deleteUserData(userId) {
  ;['expenses', 'settings'].forEach((k) => remove(`${k}_${userId}`))
}

// Settings are saved automatically whenever they change
watch(
  () => data.settings,
  (s) => uid && write(`settings_${uid}`, s),
  { deep: true }
)

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// Saves the list. If storage is full, the photo of the changed item is dropped and it tries again.
function saveExpenses(changedId) {
  if (write(`expenses_${uid}`, data.expenses)) return true
  const item = data.expenses.find((e) => e.id === changedId)
  if (item) item.photo = null
  write(`expenses_${uid}`, data.expenses)
  return false
}

const byNewest = (a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)

// Returns { item, photoSaved }
export function addExpense(expense) {
  const item = { id: newId(), createdAt: String(Date.now()), photo: null, ...expense }
  data.expenses.push(item)
  data.expenses.sort(byNewest)
  const photoSaved = saveExpenses(item.id)
  return { item, photoSaved }
}

export function updateExpense(id, patch) {
  const item = data.expenses.find((e) => e.id === id)
  if (!item) return { item: null, photoSaved: true }
  Object.assign(item, patch)
  data.expenses.sort(byNewest)
  const photoSaved = saveExpenses(id)
  return { item, photoSaved }
}

export function removeExpense(id) {
  data.expenses = data.expenses.filter((e) => e.id !== id)
  write(`expenses_${uid}`, data.expenses)
}

export function clearExpenses() {
  data.expenses = []
  write(`expenses_${uid}`, data.expenses)
}
