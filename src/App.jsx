import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import './index.css'

// Simple localStorage data layer
const ls = {
  get: (k) => { try { return JSON.parse(localStorage.getItem('hos_' + k)) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem('hos_' + k, JSON.stringify(v)) } catch {} },
}

function calcStats(trades) {
  const closed = (trades || []).filter(t => t.status === 'closed')
  const wins = closed.filter(t => t.outcome === 'win')
  const losses = closed.filter(t => t.outcome === 'loss')
  const gw = wins.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)
  const gl = Math.abs(losses.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0))
  const totalPnl = gw - gl
  const wr = closed.length ? (wins.length / closed.length * 100) : 0
  const avgWin = wins.length ? gw / wins.length : 0
  const avgLoss = losses.length ? gl / losses.length : 0
  const pf = gl > 0 ? gw / gl : 0
  const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0
  const expectancy = closed.length ? totalPnl / closed.length : 0
  
  // Max DD
  let peak = 0, eq = 0, maxDD = 0
  closed.forEach(t => { eq += parseFloat(t.pnl) || 0; peak = Math.max(peak, eq); maxDD = Math.max(maxDD, peak - eq) })
  
  // Equity curve
  const equity = [0]
  closed.forEach(t => equity.push(equity[equity.length - 1] + (parseFloat(t.pnl) || 0)))
  
  // Green/Red days
  const daily = {}
  closed.forEach(t => { daily[t.date] = (daily[t.date] || 0) + (parseFloat(t.pnl) || 0) })
  const greenDays = Object.values(daily).filter(p => p > 0).length
  const redDays = Object.values(daily).filter(p => p <= 0).length
  
  // Sharpe
  const dr = Object.values(daily)
  const mean = dr.length ? dr.reduce((s, r) => s + r, 0) / dr.length : 0
  const std = dr.length > 1 ? Math.sqrt(dr.reduce((s, r) => s + (r - mean) ** 2, 0) / (dr.length - 1)) : 0
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(252) : 0
  
  // Z-Score (recent performance vs mean)
  let zScore = 0
  if (dr.length > 5) {
    const last5 = dr.slice(-5)
    const recentMean = last5.reduce((s, r) => s + r, 0) / last5.length
    zScore = std > 0 ? Math.max(-3, Math.min(3, (recentMean - mean) / std)) : 0
  }
  
  // Consecutive
  let cw = 0, cl = 0, mcw = 0, mcl = 0
  closed.forEach(t => {
    if (t.outcome === 'win') { cw++; cl = 0; mcw = Math.max(mcw, cw) }
    else if (t.outcome === 'loss') { cl++; cw = 0; mcl = Math.max(mcl, cl) }
    else { cw = 0; cl = 0 }
  })
  
  return {
    closed, wins, losses, totalPnl, wr, avgWin, avgLoss, pf, avgRR, expectancy,
    maxDD, currentDD: peak - eq, equity, greenDays, redDays, sharpe, zScore,
    maxConsecWins: mcw, maxConsecLosses: mcl,
    open: trades.filter(t => t.status === 'open'), be: closed.filter(t => t.outcome === 'be'),
    grossWin: gw, grossLoss: gl, bestDay: dr.length ? Math.max(...dr) : 0,
    worstDay: dr.length ? Math.min(...dr) : 0, avgDayPnl: mean,
    payoff: avgLoss > 0 ? avgWin / avgLoss : 0, recovery: maxDD > 0 ? totalPnl / maxDD : 0,
    avgHoldMin: 0, ror: null,
  }
}

const fmtPnl = (n) => {
  if (n === undefined || n === null) return '$0'
  const a = Math.abs(n)
  const s = a >= 1000 ? `${(a / 1000).toFixed(1)}K` : a.toFixed(0)
  return (n >= 0 ? '+$' : '-$') + s
}

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── NAV ───────────────────────────────────
function Nav() {
  const cls = ({ isActive }) => `px-3 py-1.5 rounded-md text-[11px] font-medium tracking-wide transition-colors ${isActive ? 'bg-accent/10 text-accent' : 'text-ink-4 hover:text-ink-3'}`
  return (
    <nav className="flex items-center gap-1 px-4 py-2 border-b border-border bg-bg overflow-x-auto">
      <NavLink to="/" end className={cls}>Dash</NavLink>
      <NavLink to="/trade" className={cls}>Trade</NavLink>
      <NavLink to="/track" className={cls}>Track</NavLink>
      <NavLink to="/log" className={cls}>Log</NavLink>
      <NavLink to="/psych" className={cls}>Psych</NavLink>
    </nav>
  )
}

function MobileNav() {
  const cls = ({ isActive }) => `flex flex-col items-center gap-0.5 text-[9px] font-medium ${isActive ? 'text-accent' : 'text-ink-5'}`
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-bg/95 backdrop-blur border-t border-border flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <NavLink to="/" end className={cls}>Dash</NavLink>
      <NavLink to="/trade" className={cls}>Trade</NavLink>
      <NavLink to="/track" className={cls}>Track</NavLink>
      <NavLink to="/log" className={cls}>Log</NavLink>
      <NavLink to="/psych" className={cls}>Psych</NavLink>
    </nav>
  )
}

// ── HEADER ────────────────────────────────
function Header({ trades }) {
  const { totalPnl } = calcStats(trades)
  const now = new Date()
  const etH = (now.getUTCHours() + 20) % 24
  const etM = now.getUTCMinutes()
  const isLive = etH >= 7 && etH < 12
  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border">
      <div className="flex items-center h-10 px-3">
        <span className="text-sm font-semibold"><span className="text-accent">Hidden</span><span className="text-ink-4">OS</span></span>
        <div className="w-px h-4 bg-border mx-2" />
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface border border-border">
          <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald' : 'bg-ink-5'}`} />
          <span className="font-mono text-[9px] text-ink-4">{isLive ? 'LIVE' : 'CLOSED'}</span>
        </div>
        <span className={`ml-auto font-mono text-sm font-semibold ${totalPnl >= 0 ? 'text-emerald' : 'text-red'}`}>{fmtPnl(totalPnl)}</span>
      </div>
    </header>
  )
}

// ── STAT CARD ─────────────────────────────
function Stat({ label, value, color = 'text-ink-3' }) {
  return (
    <div className="bg-surface border border-border rounded-md p-3">
      <div className="text-[9px] font-medium text-ink-5 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-base font-semibold font-mono ${color}`}>{value}</div>
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────
function Dashboard({ trades }) {
  const s = calcStats(trades)
  return (
    <div className="space-y-3 fade-up">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Stat label="P&L" value={fmtPnl(s.totalPnl)} color={s.totalPnl >= 0 ? 'text-emerald' : 'text-red'} />
        <Stat label="Win Rate" value={`${s.wr.toFixed(0)}%`} color="text-accent" />
        <Stat label="Profit Factor" value={s.pf.toFixed(2)} color="text-accent" />
        <Stat label="Avg RR" value={s.avgRR.toFixed(2)} color="text-amber" />
        <Stat label="Max DD" value={`-$${s.maxDD.toFixed(0)}`} color="text-red" />
        <Stat label="Trades" value={s.closed.length} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Avg Win" value={`+$${s.avgWin.toFixed(0)}`} color="text-emerald" />
        <Stat label="Avg Loss" value={`-$${s.avgLoss.toFixed(0)}`} color="text-red" />
        <Stat label="Expectancy" value={`$${s.expectancy.toFixed(0)}`} color={s.expectancy >= 0 ? 'text-emerald' : 'text-red'} />
        <Stat label="Sharpe" value={s.sharpe.toFixed(2)} />
        <Stat label="Green Days" value={s.greenDays} color="text-emerald" />
        <Stat label="Red Days" value={s.redDays} color="text-red" />
        <Stat label="Z-Score" value={s.zScore.toFixed(2)} />
        <Stat label="Recovery" value={s.recovery.toFixed(2)} />
      </div>
      <div className="card">
        <div className="px-4 py-2.5 border-b border-border text-[11px] font-semibold text-ink-2 uppercase tracking-wide">Recent Trades</div>
        <div className="p-0">
          {trades.slice(-8).reverse().map(t => (
            <div key={t.id} className="flex items-center gap-3 py-2 px-4 border-b border-border/40 last:border-0">
              <div className={`w-0.5 h-6 rounded-full ${t.outcome === 'win' ? 'bg-emerald' : t.outcome === 'loss' ? 'bg-red' : 'bg-ink-5'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{t.instrument}</span>
                  <span className={`text-[9px] font-mono ${t.dir === 'long' ? 'text-emerald' : 'text-red'}`}>{t.dir}</span>
                </div>
                <div className="text-[9px] text-ink-5">{t.date}</div>
              </div>
              <span className={`font-mono text-sm font-semibold ${(parseFloat(t.pnl) || 0) >= 0 ? 'text-emerald' : 'text-red'}`}>{fmtPnl(parseFloat(t.pnl))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Placeholder({ title }) {
  return <div className="text-center py-16 text-ink-5 text-xs font-mono">{title} — coming soon</div>
}

// ── MAIN APP ──────────────────────────────
export default function FullApp() {
  const [trades, setTrades] = useState([])
  
  useEffect(() => {
    const stored = ls.get('trades')
    if (stored) setTrades(stored)
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg font-sans">
        <Header trades={trades} />
        <div className="hidden sm:block"><Nav /></div>
        <main className="max-w-5xl mx-auto px-3 py-4 pb-24 sm:pb-6">
          <Routes>
            <Route path="/" element={<Dashboard trades={trades} />} />
            <Route path="/trade" element={<Placeholder title="Trade" />} />
            <Route path="/track" element={<Placeholder title="Track" />} />
            <Route path="/log" element={<Placeholder title="Log" />} />
            <Route path="/psych" element={<Placeholder title="Psychology" />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </BrowserRouter>
  )
}
