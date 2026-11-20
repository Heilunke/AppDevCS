// All the budget math: periods (week / month), totals and status.
import { computed } from 'vue'
import { data, CATEGORIES } from './store'

const pad = (n) => String(n).padStart(2, '0')

// Dates are stored as "YYYY-MM-DD" in local time
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const fromKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const todayKey = () => toKey(new Date())

export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
export const money = (n) => peso.format(Number(n) || 0)

export function formatDay(key) {
  const today = todayKey()
  if (key === today) return 'Today'
  if (key === toKey(addDays(new Date(), -1))) return 'Yesterday'
  return fromKey(key).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
}

// Start and end (inclusive) of the period that contains `date`.
// offset -1 = the period before, -2 = two periods before, and so on.
export function periodRange(date = new Date(), offset = 0, settings = data.settings) {
  if (settings.period === 'month') {
    const start = new Date(date.getFullYear(), date.getMonth() + offset, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    return { start, end }
  }
  const back = (date.getDay() - settings.weekStart + 7) % 7
  const start = addDays(date, -back + offset * 7)
  return { start, end: addDays(start, 6) }
}

export function rangeLabel({ start, end }) {
  const opts = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-PH', opts)} – ${end.toLocaleDateString('en-PH', opts)}`
}

export function daysIn({ start, end }) {
  const days = []
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(toKey(d))
  return days
}

export function expensesIn({ start, end }, list = data.expenses) {
  const from = toKey(start)
  const to = toKey(end)
  return list.filter((e) => e.date >= from && e.date <= to)
}

export const sum = (list) => Math.round(list.reduce((t, e) => t + Number(e.amount), 0) * 100) / 100

// 'ok' | 'warn' | 'over'
export function statusFor(spent, allowance = data.settings.allowance, warnAt = data.settings.warnAt) {
  if (allowance <= 0) return 'ok'
  if (spent > allowance) return 'over'
  if ((spent / allowance) * 100 >= warnAt) return 'warn'
  return 'ok'
}

// Summary of the current period, recalculated whenever data changes
export const summary = computed(() => {
  const range = periodRange()
  const list = expensesIn(range)
  const allowance = Number(data.settings.allowance) || 0
  const spent = sum(list)
  const remaining = Math.round((allowance - spent) * 100) / 100
  const today = new Date()
  const daysLeft = Math.round((range.end - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000) + 1
  const todayList = list.filter((e) => e.date === todayKey())
  return {
    range,
    label: data.settings.period === 'month' ? 'this month' : 'this week',
    allowance,
    spent,
    remaining,
    percent: allowance > 0 ? Math.min(100, Math.round((spent / allowance) * 100)) : 0,
    daysLeft,
    perDay: remaining > 0 ? Math.floor((remaining / daysLeft) * 100) / 100 : 0,
    spentToday: sum(todayList),
    count: list.length,
    status: statusFor(spent, allowance)
  }
})

// Totals per category, biggest first (categories with no spending are skipped)
export function byCategory(list) {
  const total = sum(list)
  return CATEGORIES.map((c) => {
    const amount = sum(list.filter((e) => e.category === c.id))
    return { ...c, amount, percent: total > 0 ? Math.round((amount / total) * 100) : 0 }
  })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}
