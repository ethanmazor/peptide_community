import { Routes, Route, Navigate } from 'react-router-dom'
import { useSession } from './contexts/SessionContext'
import AuthPage from './pages/AuthPage'
import AuthCallback from './pages/AuthCallback'
import ProtectedLayout from './components/ProtectedLayout'
import TabLayout from './layouts/TabLayout'
import Home from './pages/Home'
import History from './pages/History'
import Calculator from './pages/Calculator'
import Photos from './pages/Photos'
import Settings from './pages/Settings'
import ProtocolBuilder from './pages/ProtocolBuilder'
import VialSetup from './pages/VialSetup'

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
        {/* Full-screen flows outside the tab bar */}
        <Route path="settings/protocols/new" element={<ProtocolBuilder />} />
        <Route path="vial-setup" element={<VialSetup />} />

        <Route element={<TabLayout />}>
          <Route index element={<Home />} />
          <Route path="history" element={<History />} />
          <Route path="calc" element={<Calculator />} />
          <Route path="photos" element={<Photos />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
