import { Routes, Route } from 'react-router-dom'
import { useAppState } from './hooks/useAppState'
import { useAuth } from './hooks/useAuth'
import Header from './components/ui/Header'
import { TopNav, BottomNav } from './components/ui/Nav'
import AccountBar from './components/ui/AccountBar'
import LoginScreen from './components/ui/LoginScreen'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { ToastContainer } from './components/ui/index'
import Dashboard from './components/tabs/Dashboard'
import Trade from './components/tabs/Trade'
import Track from './components/tabs/Track'
import Log from './components/tabs/Log'
import Psychology from './components/tabs/Psychology'
import { supabase } from './lib/supabase'
import { needsSeed, runSeed } from './lib/seed'

try { if (needsSeed()) runSeed() } catch(e) { console.error('Seed:', e) }

export default function App() {
  const { user, loading } = useAuth()
  const isOffline = !supabase || window.location.hash === '#offline'
  const isAuthenticated = !!user || isOffline

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}><span style={{ color: '#26a69a' }}>Hidden</span><span style={{ color: '#555' }}>OS</span></div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>Loading...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <LoginScreen />
  return <AppShell user={user} />
}

function AppShell({ user }) {
  const { activeAcc, accounts, trades, refresh, switchAccount, ready } = useAppState()

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 10, color: '#555' }}>Loading data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg font-sans">
      <Header trades={trades} user={user} />
      <TopNav />
      <AccountBar accounts={accounts} activeAcc={activeAcc} onSwitch={switchAccount} onRefresh={refresh} />
      <main className="max-w-5xl mx-auto px-3 py-4 pb-24 sm:pb-6">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Dashboard refresh={refresh} />} />
            <Route path="/trade" element={<ErrorBoundary><Trade refresh={refresh} /></ErrorBoundary>} />
            <Route path="/track" element={<ErrorBoundary><Track refresh={refresh} /></ErrorBoundary>} />
            <Route path="/log" element={<ErrorBoundary><Log refresh={refresh} /></ErrorBoundary>} />
            <Route path="/psychology" element={<ErrorBoundary><Psychology refresh={refresh} /></ErrorBoundary>} />
          </Routes>
        </ErrorBoundary>
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  )
}
