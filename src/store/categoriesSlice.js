import { createCollection } from './createCollection'

const categories = createCollection('categories')

export const { fetchAll: fetchCategories } = categories

export default categories.reducer