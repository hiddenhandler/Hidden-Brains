import { useClock } from '../../hooks/useAppState'
import { SESSION_START, SESSION_END } from '../../data/constants'
import { fmtPnl, calcStats } from '../../lib/db'
import { signOut } from '../../lib/supabase'
import { ProgressBar } from './index'

export default function Header({ trades, user }) {
  const now = useClock()
  const etOffset = -4
  const etHour = (now.getUTCHours() + 24 + etOffset) % 24
  const etMin = now.getUTCMinutes()
  const mins = etHour * 60 + etMin
  const isLive = mins >= SESSION_START && mins < SESSION_END
  const isPre = mins < SESSION_START
  const timeStr = `${String(etHour).padStart(2, '0')}:${String(etMin).padStart(2, '0')}`

  let timeLeft = ''
  if (isPre) { const r = SESSION_START - mins; timeLeft = `${Math.floor(r / 60)}h${String(r % 60).padStart(2, '0')}m` }
  else if (isLive) { const r = SESSION_END - mins; timeLeft = `${Math.floor(r / 60)}h${String(r % 60).padStart(2, '0')}m left` }

  const pct = isLive ? ((mins - SESSION_START) / (SESSION_END - SESSION_START)) * 100 : isPre ? 0 : 100
  const { totalPnl } = calcStats(trades)

  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
      <div className="flex items-center h-10 px-3 gap-2">
        <div className="font-display text-sm font-bold tracking-wide">
          <span className="text-amber">Hidden</span><span className="text-ink-4">OS</span>
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface border border-border">
          <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald pulse-dot' : isPre ? 'bg-amber' : 'bg-ink-5'}`} />
          <span className="font-mono text-[9px] font-medium tracking-wider text-ink-3">
            {isLive ? 'LIVE' : isPre ? 'PRE' : 'CLOSED'}
          </span>
          {timeLeft && <span className="font-mono text-[9px] text-ink-5 hidden sm:inline">{timeLeft}</span>}
        </div>

        {isLive && (
          <div className="hidden md:block flex-1 max-w-24">
            <ProgressBar pct={pct} gradient />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className={`font-mono text-sm font-semibold ${totalPnl >= 0 ? 'text-emerald' : 'text-red'}`}>
            {fmtPnl(totalPnl)}
          </span>
          <span className="font-mono text-[10px] text-ink-5 hidden sm:block">{timeStr} ET</span>
          {user && (
            <button onClick={async () => { await signOut(); window.location.reload() }} title="Sign out"
              className="w-6 h-6 rounded overflow-hidden border border-border hover:border-red/30 transition-colors">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-2 flex items-center justify-center text-[9px] font-mono text-ink-4">
                  {(user.email || '?')[0].toUpperCase()}
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
