import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardBody, CheckItem, TradeCard, Alert, SubTabs, PillSelect, ProgressBar } from '../ui/index'
import { toast } from '../ui/index'
import { addTrade, updateTrade, getTrades, getAccounts, getActiveAcc, todayStr, deleteTrade, getDailyLog, setDailyLog, getQNotes, addQNote, deleteQNote, fmtPnl } from '../../lib/db'
import {
  CHECKLIST, INSTRUMENTS, SETUPS, HTF_OPTIONS, HTF_POI_OPTIONS,
  LTF_OPTIONS, LTF_POI_OPTIONS, EXEC_3M_OPTIONS,
  MARKET_CONDITIONS, NEWS_CONDITIONS, VOLATILITY_CONDITIONS,
  SMC_TOGGLES, ENTRY_TYPES, CONFIRMATION_MODELS, MANAGEMENT_OPTIONS,
  EXECUTION_GRADES, PROCESS_GRADES, EMOTION_TAGS
, MOODS, MOOD_WARNINGS } from '../../data/constants'

function calcRR(entry, sl, tp) {
  if (!entry || !sl || !tp || entry === sl) return null
  return (Math.abs(tp - entry) / Math.abs(entry - sl)).toFixed(2)
}

const EMPTY = {
  instrument: 'US30', dir: 'long', entry: '', sl: '', tp: '', contracts: '', riskPct: '0.25',
  setup: '', htf: '', htfpoi: '', htfLevels: '', ltf: '', ltfpoi: '', exec3m: '',
  marketCond: '', newsCond: '', volCond: '',
  liquiditySweep: '', premiumDiscount: '', smtDivergence: '', bosChoch: '', volumeConfirm: '',
  entryType: '', confirmModel: '',
  partial: '', trailingStop: '', breakeven: '', mfe: '', mae: '',
  executionGrade: '', processGrade: '', confidence: '',
  emotionsPre: [], emotionsDuring: [],
  story: '', account: '', photos: [],
  replayLink: '', tvLink: '',
}

export default function Trade({ refresh }) {
  const [accounts, setAccountsState] = useState([])
  const activeAcc = getActiveAcc()

  useEffect(() => { (async () => setAccountsState(await getAccounts()))() }, [])
  const [sub, setSub] = useState('entry')
  const [form, setForm] = useState({ ...EMPTY, account: activeAcc !== 'all' ? activeAcc : 'main' })
  const [checks, setChecks] = useState({})
  const [clForm, setClForm] = useState({ id: '', exit: '', outcome: 'win', pnl: '', notes: '', emotionsPost: [] })
  const [filter, setFilter] = useState('all')
  const [showImport, setShowImport] = useState(false)
  const fileRef = useRef()

  const [allTrades, setAllTrades] = useState([])

  const loadTrades = useCallback(async () => {
    const tds = await getTrades()
    setAllTrades(tds)
  }, [])

  useEffect(() => { loadTrades() }, [loadTrades, refresh])

  const openTrades = allTrades.filter(t => t.status === 'open')
  const rr = calcRR(parseFloat(form.entry), parseFloat(form.sl), parseFloat(form.tp))
  const doneCount = CHECKLIST.filter(i => checks[i.id]).length
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const filtered = allTrades.filter(t => {
    if (filter === 'open') return t.status === 'open'
    if (filter === 'win') return t.outcome === 'win'
    if (filter === 'loss') return t.outcome === 'loss'
    return true
  }).slice().reverse()

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 4)
    Promise.all(files.map(f => new Promise(res => {
      const r = new FileReader()
      r.onload = e => res(e.target.result)
      r.readAsDataURL(f)
    }))).then(imgs => set('photos', imgs))
  }

  const logTrade = async () => {
    if (!form.entry || !form.sl || !form.tp) { toast('Entry, SL & TP required', 'warn'); return }
    if (doneCount < CHECKLIST.length) { toast('Complete checklist first', 'warn'); return }
    await addTrade({
      id: Date.now().toString(), ts: new Date().toISOString(), date: todayStr(),
      status: 'open', outcome: null, pnl: null, exit: null, closedAt: null,
      ...form,
    })
    setForm({ ...EMPTY, account: form.account })
    setChecks({})
    await refresh()
    toast('Trade logged')
  }

  const closeTrade = async () => {
    if (!clForm.id || !clForm.exit) { toast('Select trade + exit price', 'warn'); return }
    await updateTrade(clForm.id, {
      status: 'closed', exit: clForm.exit, outcome: clForm.outcome,
      pnl: parseFloat(clForm.pnl) || 0, notes: clForm.notes,
      emotionsPost: clForm.emotionsPost, closedAt: new Date().toISOString()
    })
    setClForm({ id: '', exit: '', outcome: 'win', pnl: '', notes: '', emotionsPost: [] })
    await refresh()
    toast('Trade closed')
  }

  const exportCSV = () => {
    const h = 'ACCOUNT,SYMBOL,DIR,DATE,CLOSE_DATE,ENTRY,EXIT,SL,TP,PNL,OUTCOME,SETUP,EXEC_GRADE,PROCESS_GRADE\n'
    const rows = allTrades.map(t =>
      [t.account||'',t.instrument||'',t.dir||'',t.date||'',t.closedAt?.split('T')[0]||'',
       t.entry||'',t.exit||'',t.sl||'',t.tp||'',t.pnl||'',t.outcome||'',
       (t.setup||'').replace(/,/g,' '),t.executionGrade||'',t.processGrade||''].join(',')
    ).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([h + rows], { type: 'text/csv' }))
    a.download = `HiddenOS_${todayStr()}.csv`
    a.click()
    toast('Exported')
  }

  // Session prep state
  const today = todayStr()
  const [log, setLog] = useState({ checklist: {}, gameplan: '', mood: '', notes: '', bias: '' })
  const [qNote, setQNote] = useState('')
  const [qNotes, setQNotesState] = useState([])

  useEffect(() => {
    (async () => {
      setLog(await getDailyLog(today))
      setQNotesState(await getQNotes())
    })()
  }, [today])

  const saveLog = async (patch) => {
    const updated = { ...log, ...patch }
    setLog(updated)
    await setDailyLog(today, updated)
  }

  const togglePrepCheck = (id) => {
    const cl = { ...(log.checklist || {}), [id]: !log.checklist?.[id] }
    saveLog({ checklist: cl })
  }

  const saveNote = async () => {
    if (!qNote.trim()) return
    await addQNote({ id: Date.now(), dt: today, text: qNote })
    setQNotesState(await getQNotes())
    setQNote('')
  }

  const prepDoneCount = CHECKLIST.filter(i => log.checklist?.[i.id]).length
  const moodAlert = log.mood ? MOOD_WARNINGS[log.mood] : null

  const tabs = [
    { id: 'prep', label: 'Session' },
    { id: 'entry', label: 'New Trade' },
    { id: 'close', label: `Close (${openTrades.length})` },
    { id: 'history', label: `History (${allTrades.length})` },
  ]

  return (
    <div className="fade-up space-y-4">
      <SubTabs tabs={tabs} active={sub} onChange={setSub} />

      {/* ── NEW TRADE ENTRY ────────────────────── */}
      {sub === 'prep' && (
        <div className="space-y-3">
          <Card>
            <CardHeader title="Session Plan" />
            <CardBody className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label">Session Bias</label>
                  <select className="input" value={log.bias || ''} onChange={e => saveLog({ bias: e.target.value })}>
                    <option value="">--</option>
                    <option value="bullish">Bullish</option><option value="bearish">Bearish</option>
                    <option value="range">Range</option><option value="news">News Day</option><option value="notrade">No Trade</option>
                  </select>
                </div>
                <div><label className="label">Mood</label>
                  <PillSelect options={MOODS} value={log.mood || ''} onChange={v => saveLog({ mood: v })} />
                </div>
              </div>
              {moodAlert && <Alert type={moodAlert.type}>{moodAlert.msg}</Alert>}
              <div><label className="label">Gameplan</label>
                <textarea className="input min-h-[60px] resize-y" value={log.gameplan || ''} onChange={e => saveLog({ gameplan: e.target.value })} placeholder="Key levels, setups, thesis..." />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Pre-Trade Checklist" badge={`${prepDoneCount}/${CHECKLIST.length}`} />
            <CardBody>
              <div className="mb-2"><ProgressBar pct={(prepDoneCount / CHECKLIST.length) * 100} gradient /></div>
              {CHECKLIST.map(item => <CheckItem key={item.id} checked={!!log.checklist?.[item.id]} text={item.text} note={item.note} onToggle={() => togglePrepCheck(item.id)} />)}
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
                <div key={n.id} className="flex gap-2 items-start p-2 bg-bg-3 rounded-md mb-1 border-l-2 border-l-accent">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-ink-5">{n.dt}</div>
                    <div className="text-xs text-ink-2">{n.text}</div>
                  </div>
                  <button onClick={async () => { await deleteQNote(n.id); setQNotesState(await getQNotes()) }} className="text-ink-5 hover:text-red text-xs">×</button>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {sub === 'entry' && (
        <>
          <Card>
            <CardHeader title="Trade Execution" badge="LOG ENTRY" />
            <CardBody className="space-y-4">
              {/* Row 1: Core fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className="label">Instrument</label>
                  <select className="input" value={form.instrument} onChange={e => set('instrument', e.target.value)}>
                    {INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div><label className="label">Direction</label>
                  <select className="input" value={form.dir} onChange={e => set('dir', e.target.value)}>
                    <option value="long">Long</option><option value="short">Short</option>
                  </select>
                </div>
                <div><label className="label">Account</label>
                  <select className="input" value={form.account} onChange={e => set('account', e.target.value)}>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Contracts</label>
                  <input className="input" type="number" value={form.contracts} onChange={e => set('contracts', e.target.value)} placeholder="1" />
                </div>
              </div>

              {/* Row 2: Price levels */}
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Entry Price</label>
                  <input className="input" type="number" step="0.01" value={form.entry} onChange={e => set('entry', e.target.value)} placeholder="42520" />
                </div>
                <div><label className="label">Stop Loss</label>
                  <input className="input" type="number" step="0.01" value={form.sl} onChange={e => set('sl', e.target.value)} placeholder="42438" />
                </div>
                <div><label className="label">Take Profit</label>
                  <input className="input" type="number" step="0.01" value={form.tp} onChange={e => set('tp', e.target.value)} placeholder="42706" />
                </div>
              </div>

              {/* RR Display */}
              {form.entry && form.sl && form.tp && (
                <div className="flex items-center justify-between p-3 bg-bg-3 border border-border rounded-lg">
                  <div>
                    <div className="text-[9px] font-mono text-ink-5 uppercase tracking-widest mb-0.5">Risk : Reward</div>
                    <div className="text-xs text-ink-3">
                      Risk {Math.abs(parseFloat(form.entry) - parseFloat(form.sl)).toFixed(1)} pts / Reward {Math.abs(parseFloat(form.tp) - parseFloat(form.entry)).toFixed(1)} pts
                    </div>
                  </div>
                  <div className={`font-mono text-2xl font-bold ${rr >= 2 ? 'text-emerald' : rr >= 1.5 ? 'text-amber' : 'text-red'}`}>
                    1:{rr}
                  </div>
                </div>
              )}

              {/* Market Context */}
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Market Conditions</label>
                  <select className="input" value={form.marketCond} onChange={e => set('marketCond', e.target.value)}>
                    <option value="">--</option>{MARKET_CONDITIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label className="label">News Conditions</label>
                  <select className="input" value={form.newsCond} onChange={e => set('newsCond', e.target.value)}>
                    <option value="">--</option>{NEWS_CONDITIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label className="label">Volatility</label>
                  <select className="input" value={form.volCond} onChange={e => set('volCond', e.target.value)}>
                    <option value="">--</option>{VOLATILITY_CONDITIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Setup */}
              <div><label className="label">Setup Type</label>
                <select className="input" value={form.setup} onChange={e => set('setup', e.target.value)}>
                  <option value="">-- Select --</option>
                  {Object.entries(SETUPS).map(([group, items]) => (
                    <optgroup key={group} label={group}>
                      {items.map(s => <option key={s}>{s}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Multi-Timeframe Analysis */}
              <div className="border border-border rounded-lg p-3 space-y-3">
                <div className="text-[9px] font-mono font-semibold uppercase tracking-widest text-cyan">Multi-Timeframe Analysis</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">HTF Alignment</label>
                    <select className="input" value={form.htf} onChange={e => set('htf', e.target.value)}>
                      <option value="">--</option>{HTF_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className="label">HTF POI</label>
                    <select className="input" value={form.htfpoi} onChange={e => set('htfpoi', e.target.value)}>
                      <option value="">--</option>{HTF_POI_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className="label">LTF Confirmation</label>
                    <select className="input" value={form.ltf} onChange={e => set('ltf', e.target.value)}>
                      <option value="">--</option>{LTF_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className="label">LTF POI</label>
                    <select className="input" value={form.ltfpoi} onChange={e => set('ltfpoi', e.target.value)}>
                      <option value="">--</option>{LTF_POI_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className="label">3M Execution</label>
                    <select className="input" value={form.exec3m} onChange={e => set('exec3m', e.target.value)}>
                      <option value="">--</option>{EXEC_3M_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className="label">HTF Key Levels</label>
                    <input className="input" value={form.htfLevels} onChange={e => set('htfLevels', e.target.value)} placeholder="42500 OB, 42650 FVG..." />
                  </div>
                </div>
              </div>

              {/* Multi-TF Alignment */}
              <div className="border border-border rounded-lg p-3 space-y-2">
                <div className="text-[9px] font-mono font-semibold uppercase tracking-widest text-accent">Timeframe Alignment</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div><label className="label">HTF Bias</label>
                    <select className="input" value={form.htf} onChange={e => set('htf', e.target.value)}>
                      <option value="">--</option>{HTF_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className="label">HTF POI</label>
                    <select className="input" value={form.htfpoi} onChange={e => set('htfpoi', e.target.value)}>
                      <option value="">--</option>{HTF_POI_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className="label">LTF Confirm</label>
                    <select className="input" value={form.ltf} onChange={e => set('ltf', e.target.value)}>
                      <option value="">--</option>{LTF_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className="label">LTF POI</label>
                    <select className="input" value={form.ltfpoi} onChange={e => set('ltfpoi', e.target.value)}>
                      <option value="">--</option>{LTF_POI_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className="label">3M Execution</label>
                    <select className="input" value={form.exec3m} onChange={e => set('exec3m', e.target.value)}>
                      <option value="">--</option>{EXEC_3M_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className="label">HTF Key Levels</label>
                    <input className="input" value={form.htfLevels || ''} onChange={e => set('htfLevels', e.target.value)} placeholder="42500 OB, 42650 FVG..." />
                  </div>
                </div>
              </div>

              {/* SMC Confluence Toggles */}
              <div className="border border-border rounded-lg p-3 space-y-2">
                <div className="text-[9px] font-mono font-semibold uppercase tracking-widest text-accent">SMC Confluence</div>
                <div className="flex flex-wrap gap-1.5">
                  {SMC_TOGGLES.map(({ id, label }) => {
                    const active = !!form[id]
                    return (
                      <button key={id} onClick={() => set(id, !form[id])}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                          active ? 'bg-emerald/12 text-emerald border border-emerald/25' : 'text-ink-5 border border-border hover:border-border-3'
                        }`}>{label}</button>
                    )
                  })}
                </div>
              </div>

              {/* Entry + Management */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><label className="label">Entry Type</label>
                  <select className="input" value={form.entryType} onChange={e => set('entryType', e.target.value)}>
                    <option value="">--</option>{ENTRY_TYPES.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label className="label">Confirmation Model</label>
                  <select className="input" value={form.confirmModel} onChange={e => set('confirmModel', e.target.value)}>
                    <option value="">--</option>{CONFIRMATION_MODELS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label className="label">Risk %</label>
                  <input className="input" type="number" step="0.05" value={form.riskPct} onChange={e => set('riskPct', e.target.value)} />
                </div>
              </div>

              {/* Trade Management */}
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Partials</label>
                  <select className="input" value={form.partial} onChange={e => set('partial', e.target.value)}>
                    <option value="">--</option>{MANAGEMENT_OPTIONS.partial.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label className="label">Trailing Stop</label>
                  <select className="input" value={form.trailingStop} onChange={e => set('trailingStop', e.target.value)}>
                    <option value="">--</option>{MANAGEMENT_OPTIONS.trailingStop.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label className="label">Breakeven</label>
                  <select className="input" value={form.breakeven} onChange={e => set('breakeven', e.target.value)}>
                    <option value="">--</option>{MANAGEMENT_OPTIONS.breakeven.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Grading + Emotions */}
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Execution Grade</label>
                  <select className="input" value={form.executionGrade} onChange={e => set('executionGrade', e.target.value)}>
                    <option value="">--</option>{EXECUTION_GRADES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div><label className="label">Process Grade</label>
                  <select className="input" value={form.processGrade} onChange={e => set('processGrade', e.target.value)}>
                    <option value="">--</option>{PROCESS_GRADES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div><label className="label">Confidence (1-10)</label>
                  <input className="input" type="number" min="1" max="10" value={form.confidence} onChange={e => set('confidence', e.target.value)} placeholder="7" />
                </div>
              </div>

              {/* Pre-Trade Emotions */}
              <div>
                <label className="label">Emotions at Entry</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOTION_TAGS.map(tag => (
                    <button key={tag} onClick={() => {
                      const arr = form.emotionsPre || []
                      set('emotionsPre', arr.includes(tag) ? arr.filter(t => t !== tag) : [...arr, tag])
                    }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all
                        ${(form.emotionsPre || []).includes(tag)
                          ? 'bg-cyan/10 border-cyan/30 text-cyan'
                          : 'border-border text-ink-5 hover:border-border-3'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Story + Links */}
              <div><label className="label">Setup Story</label>
                <textarea className="input min-h-[64px] resize-y" value={form.story} onChange={e => set('story', e.target.value)}
                  placeholder="Why this trade? HTF context, LTF trigger, news context..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">TradingView Link</label>
                  <input className="input" value={form.tvLink} onChange={e => set('tvLink', e.target.value)} placeholder="https://..." />
                </div>
                <div><label className="label">Replay Link</label>
                  <input className="input" value={form.replayLink} onChange={e => set('replayLink', e.target.value)} placeholder="https://..." />
                </div>
              </div>

              {/* Photos */}
              <div>
                <label className="label">Chart Screenshots (up to 4)</label>
                <div className="border border-dashed border-border-3 rounded-lg p-4 text-center cursor-pointer hover:border-cyan/30 transition-all"
                  onClick={() => fileRef.current?.click()}>
                  <div className="text-xs text-ink-4 font-mono">Tap to upload</div>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
                </div>
                {form.photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {form.photos.map((p, i) => <img key={i} src={p} alt="" className="rounded-lg border border-border object-cover h-20 w-full" />)}
                  </div>
                )}
              </div>

              {/* Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Pre-Trade Checklist</label>
                  <span className="badge badge-gray">{doneCount}/{CHECKLIST.length}</span>
                </div>
                {CHECKLIST.map(item => (
                  <CheckItem key={item.id} checked={!!checks[item.id]} text={item.text} note={item.note}
                    onToggle={() => setChecks(c => ({ ...c, [item.id]: !c[item.id] }))} />
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={logTrade} className="btn-primary flex-1">LOG TRADE</button>
                <button onClick={() => { setForm({ ...EMPTY, account: form.account }); setChecks({}) }} className="btn-secondary">Clear</button>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {/* ── CLOSE TRADE ────────────────────────── */}
      {sub === 'close' && (
        <Card>
          <CardHeader title="Close Open Trade" badge={`${openTrades.length} OPEN`} />
          <CardBody className="space-y-3">
            {openTrades.length === 0 ? (
              <p className="text-center text-ink-5 font-mono text-xs py-8">No open trades</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Select Trade</label>
                    <select className="input" value={clForm.id} onChange={e => setClForm(f => ({ ...f, id: e.target.value }))}>
                      <option value="">-- Pick --</option>
                      {openTrades.map(t => <option key={t.id} value={t.id}>{t.instrument} {t.dir.toUpperCase()} @ {t.entry}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Exit Price</label>
                    <input className="input" type="number" step="0.01" value={clForm.exit} onChange={e => setClForm(f => ({ ...f, exit: e.target.value }))} />
                  </div>
                  <div><label className="label">Outcome</label>
                    <select className="input" value={clForm.outcome} onChange={e => setClForm(f => ({ ...f, outcome: e.target.value }))}>
                      <option value="win">Win</option><option value="loss">Loss</option><option value="be">Breakeven</option>
                    </select>
                  </div>
                  <div><label className="label">P&L ($)</label>
                    <input className="input" type="number" step="0.01" value={clForm.pnl} onChange={e => setClForm(f => ({ ...f, pnl: e.target.value }))} />
                  </div>
                </div>
                <div><label className="label">Post-Trade Emotions</label>
                  <div className="flex flex-wrap gap-1.5">
                    {EMOTION_TAGS.map(tag => (
                      <button key={tag} onClick={() => {
                        const arr = clForm.emotionsPost || []
                        setClForm(f => ({ ...f, emotionsPost: arr.includes(tag) ? arr.filter(t => t !== tag) : [...arr, tag] }))
                      }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all
                          ${(clForm.emotionsPost || []).includes(tag) ? 'bg-cyan/10 border-cyan/30 text-cyan' : 'border-border text-ink-5'}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className="label">Notes</label>
                  <textarea className="input" value={clForm.notes} onChange={e => setClForm(f => ({ ...f, notes: e.target.value }))} placeholder="What happened? Managed correctly?" />
                </div>
                <button onClick={closeTrade} className="btn-primary w-full">CLOSE TRADE</button>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* ── HISTORY ────────────────────────────── */}
      {sub === 'history' && (
        <Card>
          <CardHeader title="Trade History" badge={String(allTrades.length)}
            right={
              <div className="flex gap-2">
                <select className="input py-1 text-xs w-20" value={filter} onChange={e => setFilter(e.target.value)}>
                  <option value="all">All</option><option value="open">Open</option>
                  <option value="win">Wins</option><option value="loss">Losses</option>
                </select>
                <button onClick={exportCSV} className="btn-secondary text-[9px] py-1 px-2">CSV</button>
              </div>
            }
          />
          <CardBody>
            {filtered.length === 0
              ? <p className="text-center text-ink-5 font-mono text-xs py-8">No trades</p>
              : filtered.map(t => (
                <div key={t.id} className="relative group">
                  <TradeCard trade={t} />
                  <button onClick={async () => { await deleteTrade(t.id); await refresh() }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red text-xs border border-red/20 rounded px-1.5 py-0.5 bg-bg hover:bg-red/10 transition-all">
                    DEL
                  </button>
                </div>
              ))
            }
          </CardBody>
        </Card>
      )}
    </div>
  )
}
