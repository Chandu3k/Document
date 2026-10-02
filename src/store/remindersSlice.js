import { createCollection } from './createCollection'

const reminders = createCollection('reminders')

export const {
  fetchAll: fetchReminders,
  addItem: addReminder,
  updateItem: updateReminder,
  removeItem: deleteReminder,
} = reminders

export default reminders.reducer