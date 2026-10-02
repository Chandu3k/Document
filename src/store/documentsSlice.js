import { createCollection } from './createCollection'

const documents = createCollection('documents')

export const {
  fetchAll: fetchDocuments,
  addItem: addDocument,
  updateItem: updateDocument,
  removeItem: deleteDocument,
} = documents

export default documents.reducer