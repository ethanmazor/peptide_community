import { Routes, Route, Navigate } from 'react-router-dom'
import { useSession } from './contexts/SessionContext'
import AuthPage from './pages/AuthPage'
import AuthCallback from './pages/AuthCallback'
import ProtectedLayout from './components/ProtectedLayout'
import TabLayout from './layouts/TabLayout'
import Home from './pages/Home'
import Progress from './pages/Progress'
import Calculator from './pages/Calculator'
import PeptideDatabase from './pages/PeptideDatabase'
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
        <Route path="settings/protocols/:id/edit" element={<ProtocolBuilder />} />
        <Route path="vial-setup" element={<VialSetup />} />

        <Route element={<TabLayout />}>
          <Route index element={<Home />} />
          <Route path="progress" element={<Progress />} />
          <Route path="calc" element={<Calculator />} />
          <Route path="peptides" element={<PeptideDatabase />} />
          <Route path="settings" element={<Settings />} />
          {/* Redirects for old routes */}
          <Route path="history" element={<Navigate to="/progress" replace />} />
          <Route path="photos" element={<Navigate to="/progress?section=photos" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
