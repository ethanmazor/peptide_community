import { Routes, Route, Navigate } from 'react-router-dom'
import { useSession } from './contexts/SessionContext'
import AuthPage from './pages/AuthPage'
import AuthCallback from './pages/AuthCallback'
import ProtectedLayout from './components/ProtectedLayout'
import TabLayout from './layouts/TabLayout'
import Home from './pages/Home'

function App() {
  const { loading } = useSession()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="w-6 h-6 border-2 border-teal rounded-full border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route element={<ProtectedLayout />}>
        <Route element={<TabLayout />}>
          <Route index element={<Home />} />
          <Route path="history" element={<div className="p-4 text-[var(--color-text-secondary)]">History (coming soon)</div>} />
          <Route path="calc" element={<div className="p-4 text-[var(--color-text-secondary)]">Calculator (coming soon)</div>} />
          <Route path="photos" element={<div className="p-4 text-[var(--color-text-secondary)]">Photos (coming soon)</div>} />
          <Route path="settings" element={<div className="p-4 text-[var(--color-text-secondary)]">Settings (coming soon)</div>} />
          <Route path="settings/protocols/new" element={<div className="p-4 text-[var(--color-text-secondary)]">New Protocol (coming soon)</div>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
