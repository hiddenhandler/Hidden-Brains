import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardBody, SubTabs, CheckItem, MetricRow, Alert } from '../ui/index'
import { toast } from '../ui/index'
import {
  getDailyLog, setDailyLog, getJournal, addJournalEntry, deleteJournalEntry,
  getMacro, setMacro, getFilteredTrades, todayStr, fmtDate, fmtPnl
} from '../../lib/db'
import { SESSION_CHECKLIST, MACRO_EVENTS } from '../../data/constants'

// ── DAILY LOG ──────────────────────────────────────
function DailyLog({ refresh }) {
  const [date, setDate] = useState(todayStr())
  const [log, setLogState] = useState({ checklist: {}, gameplan: '', mood: '', notes: '', bias: '' })
  const [trades, setTrades] = useState([])

  useEffect(() => {
    (async () => {
      setLogState(await getDailyLog(date))
      const all = await getFilteredTrades()
      setTrades(all.filter(t => t.date === date && t.status === 'closed'))
    })()
  }, [date, refresh])
  const pnl = trades.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)
  const wins = trades.filter(t => t.outcome === 'win').length
  const doneCount = SESSION_CHECKLIST.filter(i => log.checklist?.[i.id]).length

  const load = (d) => { setDate(d) }
  const toggleCheck = async (id) => {
    const cl = { ...(log.checklist || {}), [id]: !log.checklist?.[id] }
    const updated = { ...log, checklist: cl }
    setLogState(updated); await setDailyLog(date, updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={e => load(e.target.value)} />
        </div>
        <button onClick={() => load(todayStr())} className="btn-secondary whitespace-nowrap">Today</button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="stat-box stat-box-cyan"><div className="text-[8px] font-mono text-ink-5 uppercase tracking-wider mb-1">P&L</div>
          <div className={`font-mono text-xl font-bold ${pnl >= 0 ? 'text-emerald' : 'text-red'}`}>{fmtPnl(pnl)}</div></div>
        <div className="stat-box stat-box-gray"><div className="text-[8px] font-mono text-ink-5 uppercase tracking-wider mb-1">Trades</div>
          <div className="font-mono text-xl font-bold text-ink">{trades.length}</div></div>
        <div className="stat-box stat-box-green"><div className="text-[8px] font-mono text-ink-5 uppercase tracking-wider mb-1">W / L</div>
          <div className="font-mono text-xl font-bold text-ink">{wins}W / {trades.length - wins}L</div></div>
      </div>

      {/* EOD Checklist */}
      <Card>
        <CardHeader title="Session Review" badge={`${doneCount}/${SESSION_CHECKLIST.length}`} />
        <CardBody>
          {SESSION_CHECKLIST.map(item => (
            <CheckItem key={item.id} checked={!!log.checklist?.[item.id]} text={item.text} onToggle={() => toggleCheck(item.id)} />
          ))}
        </CardBody>
      </Card>

      {/* Gameplan Review */}
      <Card>
        <CardHeader title="Gameplan" />
        <CardBody>
          {log.gameplan
            ? <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">{log.gameplan}</p>
            : <p className="text-sm text-ink-5 font-mono">No gameplan for {fmtDate(date)}</p>
          }
        </CardBody>
      </Card>

      {/* Day's Trades */}
      {trades.length > 0 && (
        <Card>
          <CardHeader title="Trades" badge={String(trades.length)} />
          <CardBody>
            {trades.map(t => {
              const p = parseFloat(t.pnl) || 0
              return (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <span className="font-mono text-sm font-bold text-ink w-16">{t.instrument}</span>
                  <span className={`badge ${t.dir === 'long' ? 'badge-green' : 'badge-red'}`}>{t.dir === 'long' ? 'L' : 'S'}</span>
                  <span className="text-xs text-ink-4 flex-1 truncate">{t.setup}</span>
                  <span className={`font-mono text-sm font-bold ${p >= 0 ? 'text-emerald' : 'text-red'}`}>{fmtPnl(p)}</span>
                </div>
              )
            })}
          </CardBody>
        </Card>
      )}
    </div>
  )
}

// ── JOURNAL ──────────────────────────────────────
function Journal() {
  const [entries, setEntries] = useState([])
  useEffect(() => { (async () => setEntries(await getJournal()))() }, [])
  const [form, setForm] = useState({ text: '', lesson: '', emo: '', comp: 'Full', res: 'Green' })

  const save = async () => {
    if (!form.text.trim()) { toast('Entry required', 'warn'); return }
    await addJournalEntry({ id: Date.now(), dt: new Date().toISOString(), ...form })
    setEntries(await getJournal())
    setForm({ text: '', lesson: '', emo: '', comp: 'Full', res: 'Green' })
    toast('Journal saved')
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="New Entry" />
        <CardBody className="space-y-3">
          <div><label className="label">What Happened?</label>
            <textarea className="input min-h-[100px] resize-y" value={form.text}
              onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              placeholder="Session review. Setups taken, skipped. Emotional state..." />
          </div>
          <div><label className="label">Key Lesson</label>
            <input className="input" value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))} placeholder="One sentence takeaway" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Emotional Score (1-10)</label>
              <input className="input" type="number" min="1" max="10" value={form.emo} onChange={e => setForm(f => ({ ...f, emo: e.target.value }))} />
            </div>
            <div><label className="label">Compliance</label>
              <select className="input" value={form.comp} onChange={e => setForm(f => ({ ...f, comp: e.target.value }))}>
                <option>Full</option><option>Partial</option><option>None</option>
              </select>
            </div>
            <div><label className="label">Result</label>
              <select className="input" value={form.res} onChange={e => setForm(f => ({ ...f, res: e.target.value }))}>
                <option>Green</option><option>Red</option><option>Flat</option><option>No Trade</option>
              </select>
            </div>
          </div>
          <button onClick={save} className="btn-primary w-full">Save Entry</button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Past Entries" badge={String(entries.length)} />
        <CardBody>
          {entries.length === 0
            ? <p className="text-center text-ink-5 font-mono text-xs py-8">No entries</p>
            : entries.slice(0, 15).map(e => (
              <div key={e.id} className="py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-mono text-ink-4">
                    {new Date(e.dt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className={`badge ${e.res === 'Green' ? 'badge-green' : e.res === 'Red' ? 'badge-red' : 'badge-gray'}`}>{e.res}</span>
                  <span className="badge badge-gray">{e.comp}</span>
                  {e.emo && <span className="badge badge-amber">EMO: {e.emo}/10</span>}
                  <button onClick={async () => { await deleteJournalEntry(e.id); setEntries(await getJournal()) }}
                    className="ml-auto text-ink-5 hover:text-red text-xs">×</button>
                </div>
                <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap mb-1">{e.text}</p>
                {e.lesson && <div className="p-2 bg-cyan/5 border border-cyan/15 rounded-lg text-sm text-cyan">{e.lesson}</div>}
              </div>
            ))
          }
        </CardBody>
      </Card>
    </div>
  )
}

// ── MACRO ──────────────────────────────────────
function Macro() {
  const today = todayStr()
  const [form, setForm] = useState({})
  useEffect(() => { (async () => setForm(await getMacro(today)))() }, [today])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Today's Macro Context" badge="SAVED PER DAY" />
        <CardBody className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">DXY Direction</label>
              <select className="input" value={form.dxy || ''} onChange={e => set('dxy', e.target.value)}>
                <option value="">--</option><option>Rising - Headwind</option><option>Falling - Tailwind</option><option>Flat / Consolidating</option>
              </select>
            </div>
            <div><label className="label">Macro Bias</label>
              <select className="input" value={form.bias || ''} onChange={e => set('bias', e.target.value)}>
                <option value="">--</option><option>Risk-On</option><option>Risk-Off</option><option>Neutral</option><option>News Day</option>
              </select>
            </div>
            <div><label className="label">Key Event</label>
              <input className="input" value={form.event || ''} onChange={e => set('event', e.target.value)} placeholder="CPI 8:30AM, FOMC..." />
            </div>
            <div><label className="label">Speculation</label>
              <select className="input" value={form.spec || ''} onChange={e => set('spec', e.target.value)}>
                <option value="">--</option><option>Expecting Beat - Long</option><option>Expecting Miss - Short</option><option>Uncertain - Wait</option><option>Volatility play</option>
              </select>
            </div>
          </div>
          <div><label className="label">Analysis</label>
            <textarea className="input min-h-[80px] resize-y" value={form.sum || ''} onChange={e => set('sum', e.target.value)}
              placeholder="DXY, key events, bias, news thesis. Write like a 7AM briefing." />
          </div>
          <button onClick={async () => { await setMacro(today, form); toast('Macro saved') }} className="btn-primary w-full">SAVE MACRO</button>
        </CardBody>
      </Card>

      {/* Event Reference */}
      <Card>
        <CardHeader title="Event Reference" badge="CHEATSHEET" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="border-b border-border">
                {['Event', 'US30', 'NAS', 'Gold', 'USD', 'Action'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[9px] font-mono font-semibold uppercase tracking-widest text-cyan">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MACRO_EVENTS.map(({ event, us30, nas, gold, usd, action }) => (
                <tr key={event} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                  <td className="px-3 py-2 font-medium text-ink-2 whitespace-nowrap">{event}</td>
                  <td className="px-3 py-2 font-mono font-semibold text-ink-3">{us30}</td>
                  <td className="px-3 py-2 font-mono font-semibold text-ink-3">{nas}</td>
                  <td className="px-3 py-2 font-mono text-amber">{gold}</td>
                  <td className="px-3 py-2 font-mono text-ink-4">{usd}</td>
                  <td className="px-3 py-2 text-ink-4 text-[11px]">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* News Protocol */}
      <Card>
        <CardHeader title="News Protocol" badge="HIDDEN OS" />
        <CardBody className="space-y-3">
          {[
            ['PRE', 'cyan', '30-60 MIN BEFORE', 'Form thesis. Mark HTF OB/FVG. Define Scenario A (beat) and B (miss). Pre-news spec entry requires price at HTF POI.'],
            ['STOP', 'red', '15 MIN BEFORE > 2 MIN AFTER', 'Spreads widen. Algos hunt stops. No edge. If open trade, SL to breakeven.'],
            ['RCT', 'emerald', 'REACTION ENTRY (POST-NEWS)', 'Wait for: (1) Spike exhaustion (2) 3M/5M ChoCh confirming direction (3) Pullback to LTF POI (4) 3M in-out at retest.'],
            ['CNT', 'emerald', 'CONTINUATION (15-60 MIN)', 'After confirmed: BOS on 15M confirms continuation. Pullback to 15M/5M FVG/OB. Standard HiddenOS execution.'],
          ].map(([code, color, title, desc]) => (
            <div key={code} className="flex gap-3 pb-3 border-b border-border last:border-0">
              <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center font-mono text-[9px] font-bold
                ${color === 'red' ? 'bg-red/10 border border-red/30 text-red' : color === 'cyan' ? 'bg-cyan/10 border border-cyan/30 text-cyan' : 'bg-emerald/10 border border-emerald/30 text-emerald'}`}>
                {code}
              </div>
              <div>
                <div className="font-mono text-[10px] font-semibold text-ink mb-0.5 tracking-wide">{title}</div>
                <p className="text-sm text-ink-3 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────
export default function Log({ refresh }) {
  const [sub, setSub] = useState('daily')
  const tabs = [
    { id: 'daily', label: 'Daily Log' },
    { id: 'journal', label: 'Journal' },
    { id: 'macro', label: 'Macro' },
  ]
  return (
    <div className="fade-up">
      <SubTabs tabs={tabs} active={sub} onChange={setSub} />
      {sub === 'daily' && <DailyLog refresh={refresh} />}
      {sub === 'journal' && <Journal />}
      {sub === 'macro' && <Macro />}
    </div>
  )
}
