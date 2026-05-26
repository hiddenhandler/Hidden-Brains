import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardBody, StatCard, Gauge, Alert, TradeCard } from '../ui/index'
import { getDailyLog, getFilteredTrades, todayStr, fmtDate, fmtPnl, calcStats } from '../../lib/db'
import { SESSION_START, SESSION_END } from '../../data/constants'
import { useClock } from '../../hooks/useAppState'

export default function Dashboard({ refresh }) {
  const today = todayStr()
  const [trades, setTrades] = useState([])

  useEffect(() => {
    (async () => setTrades(await getFilteredTrades()))()
  }, [refresh])

  const stats = calcStats(trades)
  const todayTrades = trades.filter(t => t.date === today && t.status === 'closed')
  const todayPnl = todayTrades.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)
  const todayLosses = todayTrades.filter(t => t.outcome === 'loss').length

  return (
    <div className="fade-up space-y-3">
      {todayLosses >= 3 && <Alert type="error">3 LOSSES — SESSION OVER</Alert>}
      {todayLosses === 2 && <Alert type="warn">2 losses today. Next = done.</Alert>}

      {/* Gauges */}
      <Card>
        <CardHeader title="Risk Monitor" badge={fmtDate(today)} />
        <CardBody>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Gauge label="Profit Factor" value={stats.pf === Infinity ? 0 : stats.pf} min={0} max={5} />
            <Gauge label="Z-Score" value={stats.zScore} min={-3} max={3} />
            <Gauge label="Sharpe" value={stats.sharpe} min={-2} max={5} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-bg-3 rounded-md p-2.5 text-center">
              <div className="text-emerald text-lg font-mono font-semibold">{stats.maxConsecWins}</div>
              <div className="text-[8px] text-ink-5 tracking-wide uppercase">Consec W</div>
            </div>
            <div className="bg-bg-3 rounded-md p-2.5 text-center">
              <div className="text-red text-lg font-mono font-semibold">{stats.maxConsecLosses}</div>
              <div className="text-[8px] text-ink-5 tracking-wide uppercase">Consec L</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Key Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <StatCard label="P&L" value={fmtPnl(stats.totalPnl)} sub={`${stats.closed.length} trades`} accent={stats.totalPnl >= 0 ? 'green' : 'red'} />
        <StatCard label="Win Rate" value={`${stats.wr.toFixed(0)}%`} sub={`${stats.wins.length}W ${stats.losses.length}L`} accent="cyan" />
        <StatCard label="Expectancy" value={`$${stats.expectancy.toFixed(0)}`} accent={stats.expectancy >= 0 ? 'green' : 'red'} />
        <StatCard label="Avg RR" value={stats.avgRR.toFixed(2)} accent="amber" />
        <StatCard label="Max DD" value={`-$${stats.maxDD.toFixed(0)}`} accent="red" />
        <StatCard label="Today" value={fmtPnl(todayPnl)} accent={todayPnl >= 0 ? 'green' : 'red'} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Avg Win" value={`+$${stats.avgWin.toFixed(0)}`} accent="green" />
        <StatCard label="Avg Loss" value={`-$${stats.avgLoss.toFixed(0)}`} accent="red" />
        <StatCard label="Green Days" value={stats.greenDays} accent="green" />
        <StatCard label="Red Days" value={stats.redDays} accent="red" />
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader title="Recent Trades" badge={String(trades.length)} />
        <CardBody className="p-0">
          {trades.length === 0
            ? <p className="text-center text-ink-5 text-[10px] py-6">No trades logged</p>
            : trades.slice(-8).reverse().map(t => <TradeCard key={t.id} trade={t} />)
          }
        </CardBody>
      </Card>
    </div>
  )
}
