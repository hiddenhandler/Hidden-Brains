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

if (needsSeed()) runSeed()

export default function App() {
  const { user, loading } = useAuth()
  const isOffline = !supabase || window.location.hash === '#offline'
  const isAuthenticated = !!user || isOffline

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-lg font-bold tracking-wide mb-1">
            <span className="text-amber">Hidden</span><span className="text-ink-4">OS</span>
          </div>
          <div className="text-[10px] text-ink-5 font-mono">Loading...</div>
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
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-[10px] text-ink-5 font-mono">Loading data...</div>
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
