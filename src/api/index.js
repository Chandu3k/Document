import documentsData from '../data/documents.json'
import subscriptionsData from '../data/subscriptions.json'
import remindersData from '../data/reminders.json'
import categoriesData from '../data/categories.json'

const DATA_KEY = 'keepsafe:data:v1'

const delay = async (ms = 400) => {
  await new Promise((resolve) => setTimeout(resolve, ms))
  // Testing hook: set the "keepsafe:fail" flag in localStorage to simulate a network error
  try {
    if (localStorage.getItem('keepsafe:fail') === '1') throw new Error('Network error (simulated)')
  } catch (err) {
    if (err.message.startsWith('Network error')) throw err
  }
}
const seed = () => ({
  documents: structuredClone(documentsData),
  subscriptions: structuredClone(subscriptionsData),
  reminders: structuredClone(remindersData),
})

// Start from what was saved in the browser, or from the sample data
function loadSaved() {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    const valid = ['documents', 'subscriptions', 'reminders'].every((k) => Array.isArray(saved[k]))
    return valid ? saved : null
  } catch {
    return null
  }
}

const db = {
  ...(loadSaved() ?? seed()),
  categories: structuredClone(categoriesData),
}

function save() {
  try {
    localStorage.setItem(
      DATA_KEY,
      JSON.stringify({
        documents: db.documents,
        subscriptions: db.subscriptions,
        reminders: db.reminders,
      })
    )
  } catch {
    // storage full or blocked: changes still work for this session
  }
}

// Builds list / create / update / remove functions for one collection
function makeCrud(name) {
  return {
    async list() {
      await delay()
      return structuredClone(db[name])
    },
    async create(item) {
      await delay()
      const record = { ...item, id: `${name}-${crypto.randomUUID().slice(0, 8)}` }
      db[name].unshift(record)
      save()
      return structuredClone(record)
    },
    async update(id, changes) {
      await delay()
      const index = db[name].findIndex((r) => r.id === id)
      if (index === -1) throw new Error(`${name} item not found`)
      db[name][index] = { ...db[name][index], ...changes }
      save()
      return structuredClone(db[name][index])
    },
    async remove(id) {
      await delay()
      db[name] = db[name].filter((r) => r.id !== id)
      save()
      return id
    },
  }
}

export const api = {
  documents: makeCrud('documents'),
  subscriptions: makeCrud('subscriptions'),
  reminders: makeCrud('reminders'),
  categories: {
    async list() {
      await delay(200)
      return structuredClone(db.categories)
    },
  },
  // Puts the sample data back and forgets everything that was saved
  async resetData() {
    await delay(300)
    const fresh = seed()
    db.documents = fresh.documents
    db.subscriptions = fresh.subscriptions
    db.reminders = fresh.reminders
    try {
      localStorage.removeItem(DATA_KEY)
    } catch {
      // ignore
    }
  },
}