import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody, StatCard, Gauge, SubTabs, MetricRow, ProgressBar } from '../ui/index'
import { getAccounts, getTrades, getAccIdFromTrade, fmtPnl, calcStats, getFilteredTrades } from '../../lib/db'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler)

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1e2e', borderColor: '#333848', borderWidth: 1, titleFont: { family: 'JetBrains Mono', size: 10 }, bodyFont: { family: 'JetBrains Mono', size: 10 } } },
  scales: {
    x: { grid: { color: '#1e2a3a40' }, ticks: { color: '#5c6778', font: { family: 'JetBrains Mono', size: 9 }, maxRotation: 0 } },
    y: { grid: { color: '#1e2a3a40' }, ticks: { color: '#5c6778', font: { family: 'JetBrains Mono', size: 9 } } },
  }
}

// ── SCORE RING ────────────────────────────────
function ScoreRing({ value, label, color }) {
  const r = 32, c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, value)) / 100
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={r} fill="none" stroke="#222222" strokeWidth="5" />
        <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round" transform="rotate(-90 38 38)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        <text x="38" y="42" textAnchor="middle" fill={color} fontSize="16" fontWeight="700" fontFamily="JetBrains Mono">{value}</text>
      </svg>
      <span className="text-[8px] font-mono text-ink-4 uppercase tracking-widest">{label}</span>
    </div>
  )
}

// ── OVERVIEW ──────────────────────────────────
function Overview() {
  const [trades, setTrades] = useState([])
  useEffect(() => { (async () => setTrades(await getFilteredTrades()))() }, [])
  const stats = calcStats(trades)
  const { closed, equity, wins, losses } = stats

  if (!closed.length) return <div className="text-center py-16 text-ink-5 font-mono text-xs">Log trades to see analytics</div>

  // By session
  const bySess = {}
  closed.forEach(t => {
    const h = t.ts ? new Date(t.ts).getHours() : 9
    let sess = 'Other'
    if (h >= 7 && h < 8.5) sess = 'Pre-Market'
    else if (h >= 8.5 && h < 10) sess = 'NY Open KZ'
    else if (h >= 10 && h < 11) sess = 'NY AM Mid'
    else if (h >= 11 && h < 12) sess = 'NY Late AM'
    if (!bySess[sess]) bySess[sess] = { w: 0, l: 0, pnl: 0, count: 0 }
    bySess[sess].count++
    bySess[sess].pnl += parseFloat(t.pnl) || 0
    if (t.outcome === 'win') bySess[sess].w++; else bySess[sess].l++
  })

  // By day of week
  const byDow = Array(5).fill(null).map(() => ({ pnl: 0, count: 0, w: 0 }))
  closed.forEach(t => {
    const d = new Date(t.date + 'T12:00:00').getDay()
    const idx = d - 1
    if (idx >= 0 && idx < 5) { byDow[idx].pnl += parseFloat(t.pnl) || 0; byDow[idx].count++; if (t.outcome === 'win') byDow[idx].w++ }
  })
  const dowLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const bestDay = dowLabels[byDow.indexOf(byDow.reduce((a, b) => a.pnl > b.pnl ? a : b))]

  // By hour
  const byHour = {}
  closed.forEach(t => {
    if (t.ts) { const h = new Date(t.ts).getHours(); byHour[h] = (byHour[h] || 0) + (parseFloat(t.pnl) || 0) }
  })
  const hourLabels = Object.keys(byHour).sort((a, b) => a - b)
  const bestHour = hourLabels.reduce((a, b) => (byHour[a] || 0) > (byHour[b] || 0) ? a : b, hourLabels[0])
  const worstHour = hourLabels.reduce((a, b) => (byHour[a] || 0) < (byHour[b] || 0) ? a : b, hourLabels[0])

  // Performance scores (derived from data)
  const execScore = Math.min(99, Math.round(stats.wr * 0.8 + (stats.pf > 1 ? 20 : 0)))
  const ruleScore = Math.min(99, Math.round(70 + (stats.maxConsecLosses < 4 ? 15 : 0) + (stats.pf > 1.3 ? 14 : 0)))
  const emoScore = Math.min(99, Math.round(60 + (stats.maxConsecLosses < 3 ? 20 : 5) + (stats.wr > 45 ? 19 : 5)))

  return (
    <div className="space-y-3">
      {/* Core Metrics — 2x2 grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card p-3 border-l-2 border-l-emerald">
          <div className="text-[9px] font-mono text-ink-4 uppercase tracking-wider">Win Rate</div>
          <div className="font-mono text-xl font-bold text-emerald">{stats.wr.toFixed(1)}%</div>
          <div className="text-[9px] font-mono text-ink-5">{wins.length}W / {losses.length}L</div>
        </div>
        <div className="card p-3 border-l-2 border-l-cyan">
          <div className="text-[9px] font-mono text-ink-4 uppercase tracking-wider">Profit Factor</div>
          <div className="font-mono text-xl font-bold text-cyan">{stats.pf === Infinity ? '∞' : stats.pf.toFixed(2)}</div>
          <div className="text-[9px] font-mono text-ink-5">gross W÷L</div>
        </div>
        <div className="card p-3 border-l-2 border-l-amber">
          <div className="text-[9px] font-mono text-ink-4 uppercase tracking-wider">Avg RR</div>
          <div className="font-mono text-xl font-bold text-amber">1:{stats.avgRR.toFixed(2)}</div>
          <div className="text-[9px] font-mono text-ink-5">realized</div>
        </div>
        <div className="card p-3 border-l-2 border-l-purple">
          <div className="text-[9px] font-mono text-ink-4 uppercase tracking-wider">Expectancy</div>
          <div className={`font-mono text-xl font-bold ${stats.expectancy >= 0 ? 'text-emerald' : 'text-red'}`}>
            {stats.expectancy >= 0 ? '+' : ''}${stats.expectancy.toFixed(0)}
          </div>
          <div className="text-[9px] font-mono text-ink-5">per trade</div>
        </div>
      </div>

      {/* Advanced Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Z-Score" value={stats.zScore.toFixed(1)} accent={Math.abs(stats.zScore) < 2 ? 'cyan' : 'amber'} sub={Math.abs(stats.zScore) < 1.5 ? 'neutral' : 'streaky'} />
        <StatCard label="Sharpe" value={stats.sharpe.toFixed(2)} accent="cyan" />
        <StatCard label="Best Day" value={fmtPnl(stats.bestDay)} accent="green" />
        <StatCard label="Worst Day" value={fmtPnl(stats.worstDay)} accent="red" />
      </div>

      {/* Risk Exposure */}
      <Card>
        <CardHeader title="Risk Exposure" />
        <CardBody>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] font-mono text-ink-4 uppercase tracking-wider mb-1">Max Drawdown</div>
              <div className="font-mono text-lg font-bold text-red">-{((stats.maxDD / 25000) * 100).toFixed(1)}%</div>
              <div className="text-[9px] font-mono text-ink-5">-${stats.maxDD.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-ink-4 uppercase tracking-wider mb-1">Current DD</div>
              <div className="font-mono text-lg font-bold text-amber">-{((stats.currentDD / 25000) * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-ink-4 uppercase tracking-wider mb-1">Con. Wins</div>
              <div className="font-mono text-lg font-bold text-emerald">{stats.maxConsecWins}</div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-ink-4 uppercase tracking-wider mb-1">Con. Losses</div>
              <div className="font-mono text-lg font-bold text-red">{stats.maxConsecLosses}</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Performance Scores */}
      <Card>
        <CardHeader title="Performance Scores" />
        <CardBody>
          <div className="flex justify-around">
            <ScoreRing value={execScore} label="Exec Score" color="#b89b72" />
            <ScoreRing value={ruleScore} label="Rule Adh." color="#5b7fa3" />
            <ScoreRing value={emoScore} label="Emo Stability" color="#26a69a" />
          </div>
        </CardBody>
      </Card>

      {/* Sessions + By Day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardHeader title="Sessions" />
          <CardBody className="space-y-2">
            {Object.entries(bySess).sort((a, b) => b[1].pnl - a[1].pnl).map(([sess, d]) => (
              <div key={sess} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-ink-3 flex-1 truncate">{sess}</span>
                <div className="w-16 h-1.5 bg-bg-3 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${d.pnl >= 0 ? 'bg-emerald' : 'bg-red'}`} style={{ width: `${Math.min(100, Math.abs(d.pnl) / Math.max(...Object.values(bySess).map(s => Math.abs(s.pnl))) * 100)}%` }} />
                </div>
                <span className={`font-mono text-xs font-bold w-16 text-right ${d.pnl >= 0 ? 'text-emerald' : 'text-red'}`}>{fmtPnl(d.pnl)}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="By Day" badge={`best: ${bestDay}`} />
          <CardBody className="space-y-2">
            {dowLabels.map((day, i) => (
              <div key={day} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-ink-3 w-8">{day}</span>
                <div className="w-16 h-1.5 bg-bg-3 rounded-full overflow-hidden flex-1">
                  <div className={`h-full rounded-full ${byDow[i].pnl >= 0 ? 'bg-emerald' : 'bg-red'}`}
                    style={{ width: `${Math.min(100, Math.abs(byDow[i].pnl) / Math.max(...byDow.map(d => Math.abs(d.pnl || 1))) * 100)}%` }} />
                </div>
                <span className={`font-mono text-xs font-bold w-16 text-right ${byDow[i].pnl >= 0 ? 'text-emerald' : 'text-red'}`}>{fmtPnl(byDow[i].pnl)}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Hour Performance */}
      <Card>
        <CardHeader title="Hour Performance" badge={`best: ${bestHour}:00  worst: ${worstHour}:00`} />
        <CardBody>
          <div className="h-32">
            <Bar data={{
              labels: hourLabels.map(h => `${h}:00`),
              datasets: [{ data: hourLabels.map(h => byHour[h] || 0),
                backgroundColor: hourLabels.map(h => (byHour[h] || 0) >= 0 ? '#26a69a80' : '#ef535080'), borderRadius: 3 }]
            }} options={{ ...CHART_OPTS, maintainAspectRatio: false }} />
          </div>
        </CardBody>
      </Card>

      {/* Equity Curve */}
      {equity.length > 2 && (
        <Card>
          <CardHeader title="Equity Curve" badge={fmtPnl(stats.totalPnl)} />
          <CardBody>
            <div className="h-44">
              <Line data={{
                labels: equity.map((_, i) => i),
                datasets: [{
                  data: equity,
                  borderColor: stats.totalPnl >= 0 ? '#26a69a' : '#ef5350',
                  backgroundColor: stats.totalPnl >= 0 ? 'rgba(38,166,154,0.08)' : 'rgba(239,83,80,0.08)',
                  borderWidth: 1.5, fill: true, tension: 0.3, pointRadius: 0
                }]
              }} options={{ ...CHART_OPTS, maintainAspectRatio: false }} />
            </div>
          </CardBody>
        </Card>
      )}

      {/* By Instrument + Monthly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardHeader title="By Instrument" />
          <CardBody className="space-y-1.5">
            {(() => {
              const bi = {}; closed.forEach(t => { bi[t.instrument] = (bi[t.instrument] || 0) + (parseFloat(t.pnl) || 0) })
              return Object.entries(bi).sort((a, b) => b[1] - a[1]).map(([inst, pnl]) => {
                const cnt = closed.filter(t => t.instrument === inst).length
                const w = closed.filter(t => t.instrument === inst && t.outcome === 'win').length
                return (
                  <div key={inst} className="flex items-center gap-2 py-1">
                    <span className="text-[10px] font-mono text-ink-2 w-14">{inst}</span>
                    <span className="text-[9px] font-mono text-ink-5">{cnt}t</span>
                    <span className="text-[9px] font-mono text-ink-5">{cnt ? Math.round(w/cnt*100) : 0}%</span>
                    <span className={`font-mono text-xs font-bold ml-auto ${pnl >= 0 ? 'text-emerald' : 'text-red'}`}>{fmtPnl(pnl)}</span>
                  </div>
                )
              })
            })()}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Monthly" />
          <CardBody>
            <div className="grid grid-cols-3 gap-1.5">
              {(() => {
                const bm = {}; closed.forEach(t => { const m = t.date?.slice(0, 7); if (m) bm[m] = (bm[m] || 0) + (parseFloat(t.pnl) || 0) })
                return Object.entries(bm).sort().map(([m, pnl]) => (
                  <div key={m} className={`p-2 rounded border text-center ${pnl >= 0 ? 'border-emerald/20 bg-emerald/5' : 'border-red/20 bg-red/5'}`}>
                    <div className="text-[8px] font-mono text-ink-5">{m}</div>
                    <div className={`font-mono text-[11px] font-bold ${pnl >= 0 ? 'text-emerald' : 'text-red'}`}>{fmtPnl(pnl)}</div>
                  </div>
                ))
              })()}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Avg Hold + Risk */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Avg Hold" value={stats.avgHoldMin > 0 ? `${Math.floor(stats.avgHoldMin / 60)}h ${Math.round(stats.avgHoldMin % 60)}m` : '—'} accent="cyan" />
        <StatCard label="Trades/Day" value={(closed.length / (new Set(closed.map(t => t.date)).size || 1)).toFixed(1)} accent="amber" />
        <StatCard label="Avg Win" value={`+$${stats.avgWin.toFixed(0)}`} accent="green" />
        <StatCard label="Avg Loss" value={`-$${stats.avgLoss.toFixed(0)}`} accent="red" />
      </div>
    </div>
  )
}

// ── CALENDAR ──────────────────────────────────
function Calendar() {
  const [trades, setTrades] = useState([])
  useEffect(() => { (async () => setTrades((await getFilteredTrades()).filter(t => t.status === 'closed')))() }, [])
  const [month, setMonth] = useState(() => { const d = new Date(); return [d.getFullYear(), d.getMonth()] })
  const [sel, setSel] = useState(null)
  const [y, m] = month
  const first = new Date(y, m, 1).getDay()
  const days = new Date(y, m + 1, 0).getDate()
  const monthName = new Date(y, m).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const byDay = {}
  trades.forEach(t => { byDay[t.date] = (byDay[t.date] || []).concat(t) })

  const selTrades = sel ? (byDay[sel] || []) : []
  const selPnl = selTrades.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)

  const monthTrades = trades.filter(t => t.date?.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`))
  const monthPnl = monthTrades.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)

  // Color intensity based on P&L magnitude
  const getColor = (pnl, count) => {
    if (!count) return 'bg-bg-3 border-border'
    const intensity = Math.min(1, Math.abs(pnl) / 300)
    if (pnl > 0) return `border-emerald/${Math.round(20 + intensity * 30)} bg-emerald/${Math.round(5 + intensity * 15)}`
    return `border-red/${Math.round(20 + intensity * 30)} bg-red/${Math.round(5 + intensity * 15)}`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <StatCard label="Month P&L" value={fmtPnl(monthPnl)} accent={monthPnl >= 0 ? 'green' : 'red'} />
        <StatCard label="Trades" value={monthTrades.length} accent="cyan" />
      </div>

      <Card>
        <CardHeader title="Monthly Heatmap" badge={monthName} />
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setMonth(([y, m]) => m === 0 ? [y - 1, 11] : [y, m - 1])} className="btn-secondary py-1 px-2 text-xs">&lt;</button>
            <span className="font-mono text-xs font-semibold text-ink">{monthName}</span>
            <button onClick={() => setMonth(([y, m]) => m === 11 ? [y + 1, 0] : [y, m + 1])} className="btn-secondary py-1 px-2 text-xs">&gt;</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[8px] font-mono text-ink-5 uppercase py-1">{d}</div>
            ))}
            {Array(first).fill(null).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: days }, (_, i) => i + 1).map(d => {
              const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              const dt = byDay[ds] || []
              const pnl = dt.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)
              const isS = sel === ds
              return (
                <div key={d} onClick={() => setSel(isS ? null : ds)}
                  className={`min-h-[44px] flex flex-col items-center justify-center rounded cursor-pointer border transition-all p-1 ${
                    isS ? 'border-amber ring-1 ring-amber/30' : dt.length ? pnl >= 0 ? 'border-emerald/25 bg-emerald/8' : 'border-red/25 bg-red/8' : 'border-border/50 bg-bg-3'
                  }`}>
                  <span className="font-mono text-[10px] text-ink-3">{d}</span>
                  {dt.length > 0 && <span className={`font-mono text-[8px] font-bold ${pnl >= 0 ? 'text-emerald' : 'text-red'}`}>${Math.abs(pnl).toFixed(0)}</span>}
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {sel && selTrades.length > 0 && (
        <Card>
          <CardHeader title={sel} badge={fmtPnl(selPnl)} />
          <CardBody className="p-0">
            {selTrades.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2 px-4 border-b border-border/50 last:border-0">
                <div className={`w-1 h-6 rounded-full ${t.outcome === 'win' ? 'bg-emerald' : 'bg-red'}`} />
                <span className="font-mono text-xs font-medium text-ink">{t.instrument}</span>
                <span className={`text-[9px] font-mono ${t.dir === 'long' ? 'text-emerald' : 'text-red'}`}>{t.dir === 'long' ? 'L' : 'S'}</span>
                <span className="flex-1" />
                <span className={`font-mono text-xs font-bold ${(parseFloat(t.pnl) || 0) >= 0 ? 'text-emerald' : 'text-red'}`}>{fmtPnl(parseFloat(t.pnl) || 0)}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  )
}

// ── MAIN ──────────────────────────────────────
export default function Track({ refresh }) {
  const [sub, setSub] = useState('overview')
  return (
    <div className="fade-up">
      <SubTabs tabs={[
        { id: 'overview', label: 'Analytics' },
        { id: 'calendar', label: 'Calendar' },
      ]} active={sub} onChange={setSub} />
      {sub === 'overview' && <Overview />}
      {sub === 'calendar' && <Calendar />}
    </div>
  )
}
