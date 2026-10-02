import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Documents from './pages/Documents'
import DocumentDetails from './pages/DocumentDetails'
import Subscriptions from './pages/Subscriptions'
import SubscriptionDetails from './pages/SubscriptionDetails'
import Calendar from './pages/Calendar'
import Reminders from './pages/Reminders'
import Settings from './pages/Settings'
import Search from './pages/Search'
import NotFound from './pages/NotFound'
import ThemeApplier from './components/ThemeApplier'
import { fetchDocuments } from './store/documentsSlice'
import { fetchSubscriptions } from './store/subscriptionsSlice'
import { fetchReminders } from './store/remindersSlice'
import { fetchCategories } from './store/categoriesSlice'

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchDocuments())
    dispatch(fetchSubscriptions())
    dispatch(fetchReminders())
    dispatch(fetchCategories())
  }, [dispatch])

  return (
    <>
      <ThemeApplier />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/documents/:id" element={<DocumentDetails />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetails />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/search" element={<Search />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}