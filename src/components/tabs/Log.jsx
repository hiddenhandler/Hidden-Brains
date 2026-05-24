import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardBody, SubTabs, CheckItem, PillSelect, Alert, MetricRow } from '../ui/index'
import { getDailyLog, setDailyLog, getJournal, addJournalEntry, deleteJournalEntry, getMacro, setMacro, todayStr } from '../../lib/db'
import { toast } from '../ui/index'
import { SESSION_CHECKLIST, MACRO_EVENTS } from '../../data/constants'

export default function Log({ refresh }) {
  const [sub, setSub] = useState('daily')
  return (
    <div className="fade-up">
      <SubTabs tabs={[
        { id: 'daily', label: 'Daily Log' },
        { id: 'journal', label: 'Journal' },
        { id: 'macro', label: 'Macro' },
      ]} active={sub} onChange={setSub} />
      {sub === 'daily' && <DailyLog refresh={refresh} />}
      {sub === 'journal' && <Journal />}
      {sub === 'macro' && <Macro />}
    </div>
  )
}

// ── DAILY LOG ─────────────────────────────────
function DailyLog({ refresh }) {
  const [date, setDate] = useState(todayStr())
  const [log, setLogState] = useState({ checklist: {}, gameplan: '', mood: '', notes: '', bias: '' })

  useEffect(() => {
    (async () => setLogState(await getDailyLog(date)))()
  }, [date, refresh])

  const save = async (patch) => {
    const updated = { ...log, ...patch }
    setLogState(updated)
    await setDailyLog(date, updated)
  }

  const toggleCheck = async (id) => {
    const cl = { ...(log.checklist || {}), [id]: !log.checklist?.[id] }
    await save({ checklist: cl })
  }

  const doneCount = SESSION_CHECKLIST.filter(i => log.checklist?.[i.id]).length

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
        <span className="text-[9px] font-mono text-ink-5">{doneCount}/{SESSION_CHECKLIST.length} done</span>
      </div>
      <Card>
        <CardHeader title="EOD Checklist" badge={`${doneCount}/${SESSION_CHECKLIST.length}`} />
        <CardBody>
          {SESSION_CHECKLIST.map(item => (
            <CheckItem key={item.id} checked={!!log.checklist?.[item.id]} text={item.text} onToggle={() => toggleCheck(item.id)} />
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Session Notes" />
        <CardBody>
          <textarea className="input min-h-[80px] resize-y" value={log.notes || ''} onChange={e => save({ notes: e.target.value })} placeholder="What happened today..." />
        </CardBody>
      </Card>
    </div>
  )
}

// ── JOURNAL ───────────────────────────────────
function Journal() {
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({ text: '', lesson: '', comp: '', res: '' })

  useEffect(() => { (async () => setEntries(await getJournal()))() }, [])

  const save = async () => {
    if (!form.text.trim()) { toast('Write something first', 'warn'); return }
    await addJournalEntry({ id: Date.now(), dt: new Date().toISOString(), ...form })
    setEntries(await getJournal())
    setForm({ text: '', lesson: '', comp: '', res: '' })
    toast('Journal entry saved')
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader title="New Entry" />
        <CardBody className="space-y-2">
          <textarea className="input min-h-[80px] resize-y" value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="What did you learn today?" />
          <input className="input" value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))} placeholder="Key lesson..." />
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={form.comp} onChange={e => setForm(f => ({ ...f, comp: e.target.value }))}>
              <option value="">Compliance</option>
              <option>Followed Plan</option><option>Deviated</option><option>No Plan</option>
            </select>
            <select className="input" value={form.res} onChange={e => setForm(f => ({ ...f, res: e.target.value }))}>
              <option value="">Result</option>
              <option>Green Day</option><option>Red Day</option><option>Break Even</option><option>No Trade</option>
            </select>
          </div>
          <button onClick={save} className="btn-primary w-full">Save Entry</button>
        </CardBody>
      </Card>
      {entries.map(e => (
        <Card key={e.id}>
          <CardBody>
            <div className="flex justify-between items-start mb-1">
              <span className="text-[9px] font-mono text-ink-5">{new Date(e.dt).toLocaleDateString()}</span>
              <button onClick={async () => { await deleteJournalEntry(e.id); setEntries(await getJournal()) }} className="text-ink-5 hover:text-red text-xs">×</button>
            </div>
            <div className="text-sm text-ink-2 mb-1">{e.text}</div>
            {e.lesson && <div className="text-xs text-amber mt-1">Lesson: {e.lesson}</div>}
            <div className="flex gap-2 mt-1">
              {e.comp && <span className="badge badge-cyan">{e.comp}</span>}
              {e.res && <span className={`badge ${e.res === 'Green Day' ? 'badge-green' : e.res === 'Red Day' ? 'badge-red' : 'badge-gray'}`}>{e.res}</span>}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

// ── MACRO ─────────────────────────────────────
function Macro() {
  const today = todayStr()
  const [form, setForm] = useState({})
  const [macroSub, setMacroSub] = useState('input')

  useEffect(() => { (async () => setForm(await getMacro(today)))() }, [today])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const saveMacro = async () => {
    await setMacro(today, form)
    toast('Macro saved')
  }

  return (
    <div className="space-y-3">
      <SubTabs tabs={[
        { id: 'input', label: 'Today' },
        { id: 'cheat', label: 'Cheat Sheet' },
      ]} active={macroSub} onChange={setMacroSub} />

      {macroSub === 'input' && (
        <div className="space-y-3">
          {/* DXY + Bias */}
          <Card>
            <CardHeader title="Macro Context" badge={today} />
            <CardBody className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label">DXY Bias</label>
                  <select className="input" value={form.dxy || ''} onChange={e => set('dxy', e.target.value)}>
                    <option value="">--</option>
                    <option>Rising</option><option>Falling</option><option>At Key Level</option><option>DXY + VIX Rising</option>
                  </select>
                </div>
                <div><label className="label">Market Bias</label>
                  <select className="input" value={form.bias || ''} onChange={e => set('bias', e.target.value)}>
                    <option value="">--</option>
                    <option>Bullish</option><option>Bearish</option><option>Neutral</option><option>Risk-Off</option><option>No Trade</option>
                  </select>
                </div>
              </div>
              <div><label className="label">VIX Level</label>
                <select className="input" value={form.vix || ''} onChange={e => set('vix', e.target.value)}>
                  <option value="">--</option>
                  <option>{'< 15 (Calm)'}</option><option>15-25 (Normal)</option><option>25-35 (Elevated — 50% size)</option><option>{'> 35 (High — flat or Gold only)'}</option><option>Spike Intraday (Wait)</option>
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Event Input — Previous / Forecast / Actual */}
          <Card>
            <CardHeader title="Economic Event" />
            <CardBody className="space-y-3">
              <div><label className="label">Event</label>
                <select className="input" value={form.event || ''} onChange={e => set('event', e.target.value)}>
                  <option value="">-- Select Event --</option>
                  <option>CPI</option><option>PPI</option><option>NFP</option><option>FOMC</option>
                  <option>GDP</option><option>Jobless Claims</option><option>PCE</option>
                  <option>ISM/PMI</option><option>Retail Sales</option><option>Philly Fed</option>
                  <option>Consumer Confidence</option><option>None</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="label">Previous</label>
                  <input className="input" value={form.eventPrev || ''} onChange={e => set('eventPrev', e.target.value)} placeholder="3.2%" />
                </div>
                <div><label className="label">Forecast</label>
                  <input className="input" value={form.eventForecast || ''} onChange={e => set('eventForecast', e.target.value)} placeholder="3.1%" />
                </div>
                <div><label className="label">Actual</label>
                  <input className="input" value={form.eventActual || ''} onChange={e => set('eventActual', e.target.value)} placeholder="3.3%" />
                </div>
              </div>

              {/* Auto-signal based on actual vs forecast */}
              {form.event && form.eventActual && form.eventForecast && (() => {
                const act = parseFloat(form.eventActual)
                const fore = parseFloat(form.eventForecast)
                if (isNaN(act) || isNaN(fore)) return null
                const hot = act > fore
                const cool = act < fore
                const inline = Math.abs(act - fore) < 0.05

                const signals = {
                  'CPI': hot ? { label: 'CPI HOT', us30: '↓', nas: '↓↓', gold: '↑', usd: '↑', action: 'Fade rallies. Short on LTF BOS post-sweep.' }
                    : cool ? { label: 'CPI COOL', us30: '↑', nas: '↑↑', gold: '↓', usd: '↓', action: 'Buy LTF pullback to 5M OB after sweep.' }
                    : { label: 'CPI INLINE', us30: 'Mixed', nas: 'Mixed', gold: 'Mixed', usd: 'Mixed', action: 'No news trade. Wait for HTF structure.' },
                  'NFP': hot ? { label: 'NFP STRONG', us30: 'Mixed', nas: '↓', gold: '↓', usd: '↑', action: 'NAS short after reaction sweep.' }
                    : { label: 'NFP WEAK', us30: '↑', nas: '↑', gold: '↑', usd: '↓', action: 'Buy dips. LTF ChoCH + BOS entry.' },
                  'FOMC': { label: 'FOMC', us30: '↓↓', nas: '↓↓', gold: 'Vol', usd: 'Vol', action: 'Wait 15 min after Powell ends.' },
                  'PPI': hot ? { label: 'PPI HOT', us30: '↓', nas: '↓', gold: '↑', usd: '↑', action: 'CPI leading signal. Moderate impact.' }
                    : { label: 'PPI COOL', us30: '↑', nas: '↑', gold: '↓', usd: '↓', action: 'Positive signal. Trade normal.' },
                }

                const sig = signals[form.event]
                if (!sig) return null

                return (
                  <div className="border border-border rounded-lg p-3 mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${hot ? 'text-red' : cool ? 'text-emerald' : 'text-ink-3'}`}>
                        {hot ? '🔥' : cool ? '❄️' : '→'} {sig.label}
                      </span>
                      <span className="text-[9px] font-mono text-ink-5">
                        {form.eventActual} vs {form.eventForecast} (prev: {form.eventPrev || '—'})
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[['US30', sig.us30], ['NAS', sig.nas], ['Gold', sig.gold], ['USD', sig.usd]].map(([label, val]) => (
                        <div key={label} className="text-center">
                          <div className="text-[8px] font-mono text-ink-5">{label}</div>
                          <div className={`text-xs font-mono font-bold ${val.includes('↑') ? 'text-emerald' : val.includes('↓') ? 'text-red' : 'text-ink-3'}`}>{val}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] font-mono text-amber">→ {sig.action}</div>
                  </div>
                )
              })()}
            </CardBody>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader title="Macro Notes" />
            <CardBody>
              <textarea className="input min-h-[60px] resize-y" value={form.sum || ''} onChange={e => set('sum', e.target.value)} placeholder="Macro thesis, key levels, correlations..." />
              <button onClick={saveMacro} className="btn-primary w-full mt-2">Save Macro</button>
            </CardBody>
          </Card>
        </div>
      )}

      {macroSub === 'cheat' && <MacroCheatSheet />}
    </div>
  )
}

// ── MACRO CHEAT SHEET ─────────────────────────
function MacroCheatSheet() {
  const events = [
    { emoji: '🔥', event: 'CPI Hot', us30: '↓', nas: '↓↓', gold: '↑', usd: '↑', action: 'Fade rallies. Short on LTF BOS post-sweep.' },
    { emoji: '❄️', event: 'CPI Cool', us30: '↑', nas: '↑↑', gold: '↓', usd: '↓', action: 'Buy LTF pullback to 5M OB after sweep.' },
    { emoji: '→', event: 'CPI Inline', us30: 'Mixed', nas: 'Mixed', gold: 'Mixed', usd: 'Mixed', action: 'No news trade. Wait for HTF structure.' },
    { emoji: '🔥', event: 'NFP Strong', us30: 'Mixed', nas: '↓', gold: '↓', usd: '↑', action: 'NAS short after reaction sweep then LTF BOS.' },
    { emoji: '📉', event: 'NFP Weak', us30: '↑', nas: '↑', gold: '↑', usd: '↓', action: 'Buy dips. LTF ChoCh + BOS entry.' },
    { emoji: '🏦', event: 'FOMC Hike', us30: '↓↓', nas: '↓↓', gold: 'Vol', usd: '↑', action: 'Wait 15 min after Powell ends.' },
    { emoji: '🏦', event: 'FOMC Cut', us30: '↑↑', nas: '↑↑', gold: '↑', usd: '↓↓', action: 'Buy first LTF pullback to 15M OB.' },
    { emoji: '🔥', event: 'PPI Hot', us30: '↓', nas: '↓', gold: '↑', usd: '↑', action: 'CPI leading signal. Moderate impact.' },
    { emoji: '📉', event: 'PPI Cool', us30: '↑', nas: '↑', gold: '↓', usd: '↓', action: 'Positive signal. Trade normal.' },
    { emoji: '📊', event: 'PCE Hot', us30: '↓', nas: '↓', gold: '↑', usd: '↑', action: 'Fed preferred gauge. React like CPI lite.' },
    { emoji: '📊', event: 'GDP Miss', us30: '↓', nas: '↓', gold: '↑', usd: '↓', action: 'Recession fear. Gold up, indices volatile.' },
    { emoji: '📊', event: 'Claims Rising', us30: '↓', nas: '↓', gold: '↑', usd: '↓', action: 'Economy weakening. Gold up, indices down.' },
  ]

  const dxy = [
    { cond: 'DXY Rising', effect: 'Headwind for indices and Gold', action: 'Reduce long exposure. Short bias for YM/NQ.' },
    { cond: 'DXY Falling', effect: 'Tailwind for indices and Gold', action: 'Long bias. Buy dips at HTF POIs.' },
    { cond: 'DXY at Key Level', effect: 'Major S/R on DXY chart', action: 'Wait for confirmation before committing.' },
    { cond: 'DXY + VIX Rising', effect: 'Risk-off environment', action: 'Reduce size 50% or No-Trade Day.' },
  ]

  const vix = [
    { level: 'VIX < 15', env: 'Calm market', rule: 'Normal size 0.5-1% risk' },
    { level: 'VIX 15-25', env: 'Moderate volatility', rule: 'Normal size — stay alert' },
    { level: 'VIX 25-35', env: 'Elevated fear', rule: '50% size on ALL trades' },
    { level: 'VIX > 35', env: 'High fear', rule: 'Indices flat. Gold at POI only or cash.' },
    { level: 'VIX Spike', env: 'News-driven volatility', rule: 'Do not enter on the spike. Wait for settlement.' },
  ]

  return (
    <div className="space-y-3">
      {/* Quick Reference Table */}
      <Card>
        <CardHeader title="Quick Reference Table" />
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-amber">Event</th>
                <th className="p-2 text-ink-4">US30</th>
                <th className="p-2 text-ink-4">NAS</th>
                <th className="p-2 text-ink-4">Gold</th>
                <th className="p-2 text-ink-4">USD</th>
                <th className="text-left p-2 text-ink-4">Trade Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-surface-2 transition-colors">
                  <td className="p-2 font-semibold text-ink">{e.emoji} {e.event}</td>
                  <td className={`p-2 text-center font-bold ${e.us30.includes('↑') ? 'text-emerald' : e.us30.includes('↓') ? 'text-red' : 'text-ink-4'}`}>{e.us30}</td>
                  <td className={`p-2 text-center font-bold ${e.nas.includes('↑') ? 'text-emerald' : e.nas.includes('↓') ? 'text-red' : 'text-ink-4'}`}>{e.nas}</td>
                  <td className={`p-2 text-center font-bold ${e.gold.includes('↑') ? 'text-emerald' : e.gold.includes('↓') ? 'text-red' : 'text-ink-4'}`}>{e.gold}</td>
                  <td className={`p-2 text-center font-bold ${e.usd.includes('↑') ? 'text-emerald' : e.usd.includes('↓') ? 'text-red' : 'text-ink-4'}`}>{e.usd}</td>
                  <td className="p-2 text-ink-3">{e.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* DXY Framework */}
      <Card>
        <CardHeader title="DXY — The Master Driver" />
        <CardBody className="p-0">
          <table className="w-full text-[10px] font-mono">
            <thead><tr className="border-b border-border">
              <th className="text-left p-2 text-amber">Condition</th>
              <th className="text-left p-2 text-ink-4">Effect</th>
              <th className="text-left p-2 text-ink-4">Action</th>
            </tr></thead>
            <tbody>
              {dxy.map((d, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="p-2 font-semibold text-ink">{d.cond}</td>
                  <td className="p-2 text-ink-3">{d.effect}</td>
                  <td className="p-2 text-ink-3">{d.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* VIX Framework */}
      <Card>
        <CardHeader title="VIX — Position Sizing" />
        <CardBody className="p-0">
          <table className="w-full text-[10px] font-mono">
            <thead><tr className="border-b border-border">
              <th className="text-left p-2 text-amber">Level</th>
              <th className="text-left p-2 text-ink-4">Environment</th>
              <th className="text-left p-2 text-ink-4">Rule</th>
            </tr></thead>
            <tbody>
              {vix.map((v, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="p-2 font-semibold text-ink">{v.level}</td>
                  <td className="p-2 text-ink-3">{v.env}</td>
                  <td className="p-2 text-ink-3">{v.rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  )
}
