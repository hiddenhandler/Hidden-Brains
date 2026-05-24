import { useState } from 'react'
import { useClock } from '../../hooks/useAppState'
import { SESSION_START, SESSION_END } from '../../data/constants'
import { fmtPnl, calcStats } from '../../lib/db'
import { signOut } from '../../lib/supabase'
import { ProgressBar } from './index'
import { getTheme, setTheme, getThemeList } from '../../lib/theme'

export default function Header({ trades, user }) {
  const now = useClock()
  const [showTheme, setShowTheme] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(getTheme())

  const etOffset = -4
  const etHour = (now.getUTCHours() + 24 + etOffset) % 24
  const etMin = now.getUTCMinutes()
  const mins = etHour * 60 + etMin
  const isLive = mins >= SESSION_START && mins < SESSION_END
  const isPre = mins < SESSION_START
  const timeStr = `${String(etHour).padStart(2, '0')}:${String(etMin).padStart(2, '0')}`
  let timeLeft = ''
  if (isPre) { const r = SESSION_START - mins; timeLeft = `${Math.floor(r / 60)}h${String(r % 60).padStart(2, '0')}m` }
  else if (isLive) { const r = SESSION_END - mins; timeLeft = `${Math.floor(r / 60)}h${String(r % 60).padStart(2, '0')}m` }
  const pct = isLive ? ((mins - SESSION_START) / (SESSION_END - SESSION_START)) * 100 : isPre ? 0 : 100
  const { totalPnl } = calcStats(trades)

  const switchTheme = (id) => { setTheme(id); setCurrentTheme(id); setShowTheme(false) }

  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
      <div className="flex items-center h-10 px-3 gap-2">
        <div className="text-sm font-semibold tracking-wide">
          <span className="text-accent">Hidden</span><span className="text-ink-4">OS</span>
        </div>
        <div className="w-px h-4 bg-border mx-1" />
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface border border-border">
          <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald pulse-dot' : isPre ? 'bg-amber' : 'bg-ink-5'}`} />
          <span className="font-mono text-[9px] font-medium tracking-wide text-ink-4">
            {isLive ? 'LIVE' : isPre ? 'PRE' : 'CLOSED'}
          </span>
          {timeLeft && <span className="font-mono text-[9px] text-ink-5 hidden sm:inline">{timeLeft}</span>}
        </div>
        {isLive && <div className="hidden md:block flex-1 max-w-20"><ProgressBar pct={pct} gradient /></div>}

        <div className="ml-auto flex items-center gap-2">
          <span className={`font-mono text-sm font-semibold ${totalPnl >= 0 ? 'text-emerald' : 'text-red'}`}>{fmtPnl(totalPnl)}</span>
          <span className="font-mono text-[9px] text-ink-5 hidden sm:block">{timeStr} ET</span>

          <div className="relative">
            <button onClick={() => setShowTheme(!showTheme)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-ink-4 hover:text-ink-3" title="Theme">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
            </button>
            {showTheme && (
              <div className="absolute right-0 top-8 z-50 bg-surface border border-border rounded-lg shadow-lg p-1 min-w-[160px]">
                {getThemeList().map(t => (
                  <button key={t.id} onClick={() => switchTheme(t.id)}
                    className={`w-full text-left px-3 py-2 rounded text-[11px] font-medium transition-colors ${
                      currentTheme === t.id ? 'text-accent bg-accent/8' : 'text-ink-3 hover:text-ink-2 hover:bg-surface-2'
                    }`}>{t.name}</button>
                ))}
              </div>
            )}
          </div>

          {user && (
            <button onClick={async () => { await signOut(); window.location.reload() }} title="Sign out"
              className="w-6 h-6 rounded-md overflow-hidden border border-border">
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-surface-2 flex items-center justify-center text-[9px] font-mono text-ink-4">{(user.email || '?')[0].toUpperCase()}</div>}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
