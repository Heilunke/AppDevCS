// Starter (demo) accounts, created once on the first launch of the app.
// Each one gets settings and sample expenses so every screen has data to show.
import { read, write } from './storage'
import { periodRange, addDays, toKey, todayKey } from './budget'

export const DEMO_ACCOUNTS = [
  {
    name: 'Juan Dela Cruz',
    email: 'juan@pesowise.app',
    password: 'Juan12345',
    settings: { allowance: 1000, period: 'week', weekStart: 1, warnAt: 80 },
    // amounts per day of the period; spends a normal amount
    plan: [
      ['food', 'Lunch at canteen', 65], ['transport', 'Jeep to school', 26],
      ['snacks', 'Milk tea', 49], ['school', 'Photocopy handouts', 35],
      ['food', 'Breakfast', 45], ['load', 'GoSURF 50', 50],
      ['transport', 'Tricycle', 30], ['food', 'Dinner', 80],
      ['snacks', 'Siomai', 30], ['others', 'Org fee', 100]
    ]
  },
  {
    name: 'Maria Santos',
    email: 'maria@pesowise.app',
    password: 'Maria12345',
    settings: { allowance: 4000, period: 'month', weekStart: 1, warnAt: 70 },
    // a monthly budget that is already close to the limit
    plan: [
      ['transport', 'Bus to Tarlac City', 120], ['food', 'Lunch with friends', 180],
      ['school', 'Project materials', 350], ['load', 'Load 100', 100],
      ['food', 'Groceries', 420], ['snacks', 'Coffee', 95],
      ['transport', 'Grab ride', 210], ['others', 'Birthday gift', 300],
      ['food', 'Fast food', 160], ['school', 'Printing thesis draft', 240],
      ['snacks', 'Snacks for group study', 130], ['transport', 'Jeep fare', 52]
    ]
  }
]

const newId = (i) => Date.now().toString(36) + i + Math.random().toString(36).slice(2, 6)

// Spread the sample expenses over the current period and the 2 before it (never in the future)
function sampleExpenses(account) {
  const today = todayKey()
  const list = []
  let n = 0
  for (const offset of [0, -1, -2]) {
    const { start, end } = periodRange(new Date(), offset, account.settings)
    const length = Math.round((end - start) / 86400000) + 1
    account.plan.forEach(([category, note, amount], i) => {
      const date = toKey(addDays(start, Math.floor((i * length) / account.plan.length)))
      if (date > today) return
      list.push({ id: newId(n++), createdAt: String(Date.now() + n), category, note, amount, date, photo: null })
    })
  }
  return list.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))
}

// hashPassword is passed in from auth.js so passwords are stored the same way as real accounts
export async function seedDemoAccounts(hashPassword, randomSalt) {
  if (read('demo_seeded', false)) return
  const users = read('users', [])
  for (const [i, acc] of DEMO_ACCOUNTS.entries()) {
    if (users.some((u) => u.email === acc.email)) continue
    const salt = randomSalt()
    const user = {
      id: 'demo' + i + Date.now().toString(36),
      name: acc.name,
      email: acc.email,
      salt,
      hash: await hashPassword(acc.password, salt),
      createdAt: Date.now()
    }
    users.push(user)
    write(`settings_${user.id}`, { ...acc.settings, vibrate: true, biometric: false })
    write(`expenses_${user.id}`, sampleExpenses(acc))
  }
  write('users', users)
  write('demo_seeded', true) // only once: a deleted demo account is not created again
}
