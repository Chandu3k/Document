import { createCollection } from './createCollection'

const subscriptions = createCollection('subscriptions')

export const {
  fetchAll: fetchSubscriptions,
  addItem: addSubscription,
  updateItem: updateSubscription,
  removeItem: deleteSubscription,
} = subscriptions

export default subscriptions.reducer