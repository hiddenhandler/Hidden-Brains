import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardBody, StatCard, Gauge, Alert, CheckItem, PillSelect, ProgressBar, MetricRow, TradeCard } from '../ui/index'
import { getDailyLog, setDailyLog, getMacro, getQNotes, addQNote, deleteQNote, todayStr, fmtDate, fmtPnl, calcStats, getFilteredTrades } from '../../lib/db'
import { CHECKLIST, MOODS, MOOD_WARNINGS, SESSION_START, SESSION_END } from '../../data/constants'
import { toast } from '../ui/index'
import { useClock } from '../../hooks/useAppState'

export default function Dashboard({ refresh }) {
  const today = todayStr()
  const now = useClock()
  const [log, setLog] = useState({ checklist: {}, gameplan: '', mood: '', notes: '', bias: '' })
  const [qNote, setQNote] = useState('')
  const [qNotes, setQNotes] = useState([])
  const [trades, setTrades] = useState([])
  const [macro, setMacroState] = useState({})

  const loadData = useCallback(async () => {
    const [tds, dl, m, qn] = await Promise.all([
      getFilteredTrades(), getDailyLog(today), getMacro(today), getQNotes()
    ])
    setTrades(tds)
    setLog(dl)
    setMacroState(m)
    setQNotes(qn)
  }, [today])

  useEffect(() => { loadData() }, [loadData, refresh])

  const saveLog = async (patch) => {
    const updated = { ...log, ...patch }
    setLog(updated)
    await setDailyLog(today, updated)
  }

  const toggleCheck = (id) => {
    const cl = { ...(log.checklist || {}), [id]: !log.checklist?.[id] }
    saveLog({ checklist: cl })
  }

  const doneCount = CHECKLIST.filter(i => log.checklist?.[i.id]).length

  const saveNote = async () => {
    if (!qNote.trim()) return
    await addQNote({ id: Date.now(), dt: today, text: qNote })
    setQNotes(await getQNotes())
    setQNote('')
  }

  const stats = calcStats(trades)
  const todayTrades = trades.filter(t => t.date === today && t.status === 'closed')
  const todayPnl = todayTrades.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)
  const todayLosses = todayTrades.filter(t => t.outcome === 'loss').length
  const moodAlert = log.mood ? MOOD_WARNINGS[log.mood] : null

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
            <Gauge label="Z-Score" value={stats.zScore} min={-5} max={5} />
            <Gauge label="Sharpe" value={stats.sharpe} min={-2} max={5} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-bg-3 rounded p-2.5 text-center">
              <div className="text-emerald text-lg font-mono font-bold">{stats.maxConsecWins}</div>
              <div className="text-[8px] font-mono text-ink-5 uppercase tracking-widest">Consec W</div>
            </div>
            <div className="bg-bg-3 rounded p-2.5 text-center">
              <div className="text-red text-lg font-mono font-bold">{stats.maxConsecLosses}</div>
              <div className="text-[8px] font-mono text-ink-5 uppercase tracking-widest">Consec L</div>
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

      {/* Session Plan + Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-3">
          <Card>
            <CardHeader title="Session Plan" />
            <CardBody className="space-y-2.5">
              <div>
                <label className="label">Bias</label>
                <select className="input" value={log.bias || ''} onChange={e => saveLog({ bias: e.target.value })}>
                  <option value="">--</option>
                  <option value="bullish">Bullish</option>
                  <option value="bearish">Bearish</option>
                  <option value="range">Range</option>
                  <option value="news">News Day</option>
                  <option value="notrade">No Trade</option>
                </select>
              </div>
              <div>
                <label className="label">Gameplan</label>
                <textarea className="input min-h-[60px] resize-y" value={log.gameplan || ''} onChange={e => saveLog({ gameplan: e.target.value })} placeholder="Key levels, setups, thesis..." />
              </div>
              <div>
                <label className="label">Mood</label>
                <PillSelect options={MOODS} value={log.mood || ''} onChange={v => saveLog({ mood: v })} />
                {moodAlert && <div className="mt-1.5"><Alert type={moodAlert.type}>{moodAlert.msg}</Alert></div>}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Quick Notes" />
            <CardBody>
              <div className="flex gap-2 mb-2">
                <input className="input flex-1" value={qNote} onChange={e => setQNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveNote()} placeholder="Level, observation..." />
                <button onClick={saveNote} className="btn-primary">+</button>
              </div>
              {qNotes.slice(0, 5).map(n => (
                <div key={n.id} className="flex gap-2 items-start p-2 bg-bg-3 rounded mb-1 border-l-2 border-l-amber">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-mono text-ink-5">{n.dt}</div>
                    <div className="text-xs text-ink-2">{n.text}</div>
                  </div>
                  <button onClick={async () => { await deleteQNote(n.id); setQNotes(await getQNotes()) }} className="text-ink-5 hover:text-red text-xs">×</button>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader title="Pre-Trade Checklist" badge={`${doneCount}/${CHECKLIST.length}`} />
            <CardBody>
              <div className="mb-2"><ProgressBar pct={(doneCount / CHECKLIST.length) * 100} gradient /></div>
              {CHECKLIST.map(item => <CheckItem key={item.id} checked={!!log.checklist?.[item.id]} text={item.text} note={item.note} onToggle={() => toggleCheck(item.id)} />)}
            </CardBody>
          </Card>

          {(macro.bias || macro.event) && (
            <Card>
              <CardHeader title="Macro" badge="today" />
              <CardBody>
                {macro.bias && <MetricRow label="Bias" value={macro.bias} color="text-amber" />}
                {macro.event && <MetricRow label="Event" value={macro.event} color="text-cyan" />}
                {macro.sum && <div className="p-2 bg-bg-3 rounded text-xs text-ink-3 mt-1">{macro.sum}</div>}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader title="Recent Trades" badge={String(trades.length)} />
        <CardBody className="p-0">
          {trades.length === 0
            ? <p className="text-center text-ink-5 font-mono text-[10px] py-6">No trades logged</p>
            : trades.slice(-5).reverse().map(t => <TradeCard key={t.id} trade={t} />)
          }
        </CardBody>
      </Card>
    </div>
  )
}
