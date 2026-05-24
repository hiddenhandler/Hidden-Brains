/**
 * HiddenOS Data Layer v3
 * ─────────────────────────────────────────────
 * Supabase when authenticated, localStorage fallback.
 * All functions return promises when using Supabase.
 * Components call these via useEffect / event handlers.
 */
import { supabase } from './supabase'

// ── STATE ───────────────────────────────────────
let _userId = null
let _useCloud = false

export const setUserId = (id) => { _userId = id; _useCloud = !!id && !!supabase }
export const isCloud = () => _useCloud

// ── LOCAL STORAGE HELPERS ───────────────────────
const KEY = (k) => `hos_${k}`
const local = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(KEY(k))) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(KEY(k), JSON.stringify(v)) } catch {} },
  del: (k) => { try { localStorage.removeItem(KEY(k)) } catch {} },
}

// ═══════════════════════════════════════════════
// TRADES
// ═══════════════════════════════════════════════
export const getTrades = async () => {
  if (_useCloud) {
    const { data } = await supabase.from('trades').select('*').eq('user_id', _userId).order('ts', { ascending: true })
    return (data || []).map(mapTradeFromDB)
  }
  return local.get('trades') || []
}

export const addTrade = async (t) => {
  if (_useCloud) {
    const row = mapTradeToDBInsert(t)
    const { data, error } = await supabase.from('trades').insert(row).select().single()
    if (error) console.error('addTrade:', error)
    return data ? mapTradeFromDB(data) : null
  }
  const all = local.get('trades') || []
  local.set('trades', [...all, t])
  return t
}

export const updateTrade = async (id, patch) => {
  if (_useCloud) {
    const updates = mapTradeToDBUpdate(patch)
    const { error } = await supabase.from('trades').update(updates).eq('id', id).eq('user_id', _userId)
    if (error) console.error('updateTrade:', error)
    return
  }
  const all = local.get('trades') || []
  local.set('trades', all.map(t => t.id === id ? { ...t, ...patch } : t))
}

export const deleteTrade = async (id) => {
  if (_useCloud) {
    await supabase.from('trades').delete().eq('id', id).eq('user_id', _userId)
    return
  }
  const all = local.get('trades') || []
  local.set('trades', all.filter(t => t.id !== id))
}

export const bulkInsertTrades = async (trades) => {
  if (_useCloud) {
    const rows = trades.map(mapTradeToDBInsert)
    const { data, error } = await supabase.from('trades').insert(rows).select()
    if (error) console.error('bulkInsert:', error)
    return data?.map(mapTradeFromDB) || []
  }
  const all = local.get('trades') || []
  local.set('trades', [...all, ...trades])
  return trades
}

// DB column mapping (camelCase ↔ snake_case)
function mapTradeFromDB(row) {
  return {
    id: row.id, date: row.date, ts: row.ts, closedAt: row.closed_at,
    instrument: row.instrument, dir: row.dir, status: row.status, outcome: row.outcome,
    entry: row.entry, sl: row.sl, tp: row.tp, exit: row.exit_price,
    contracts: row.contracts, riskPct: row.risk_pct,
    pnl: row.pnl, mfe: row.mfe, mae: row.mae,
    marketCond: row.market_cond, newsCond: row.news_cond, volCond: row.vol_cond,
    setup: row.setup, htf: row.htf, htfpoi: row.htf_poi, htfLevels: row.htf_levels,
    ltf: row.ltf, ltfpoi: row.ltf_poi, exec3m: row.exec_3m,
    liquiditySweep: row.liquidity_sweep, premiumDiscount: row.premium_discount,
    smtDivergence: row.smt_divergence, bosChoch: row.bos_choch, volumeConfirm: row.volume_confirm,
    entryType: row.entry_type, confirmModel: row.confirm_model,
    partial: row.partial, trailingStop: row.trailing_stop, breakeven: row.breakeven,
    executionGrade: row.execution_grade, processGrade: row.process_grade, confidence: row.confidence,
    emotionsPre: row.emotions_pre || [], emotionsDuring: row.emotions_during || [], emotionsPost: row.emotions_post || [],
    story: row.story, notes: row.notes, tvLink: row.tv_link, replayLink: row.replay_link,
    photos: row.photos || [], account: row.account_id,
  }
}

function mapTradeToDBInsert(t) {
  return {
    user_id: _userId, date: t.date, ts: t.ts || new Date().toISOString(),
    instrument: t.instrument, dir: t.dir, status: t.status || 'open', outcome: t.outcome || null,
    entry: t.entry ? parseFloat(t.entry) : null, sl: t.sl ? parseFloat(t.sl) : null,
    tp: t.tp ? parseFloat(t.tp) : null, exit_price: t.exit ? parseFloat(t.exit) : null,
    contracts: t.contracts ? parseFloat(t.contracts) : null, risk_pct: t.riskPct ? parseFloat(t.riskPct) : 0.25,
    pnl: t.pnl ? parseFloat(t.pnl) : 0, mfe: t.mfe ? parseFloat(t.mfe) : null, mae: t.mae ? parseFloat(t.mae) : null,
    market_cond: t.marketCond || null, news_cond: t.newsCond || null, vol_cond: t.volCond || null,
    setup: t.setup || null, htf: t.htf || null, htf_poi: t.htfpoi || null, htf_levels: t.htfLevels || null,
    ltf: t.ltf || null, ltf_poi: t.ltfpoi || null, exec_3m: t.exec3m || null,
    liquidity_sweep: t.liquiditySweep || null, premium_discount: t.premiumDiscount || null,
    smt_divergence: t.smtDivergence || null, bos_choch: t.bosChoch || null, volume_confirm: t.volumeConfirm || null,
    entry_type: t.entryType || null, confirm_model: t.confirmModel || null,
    partial: t.partial || null, trailing_stop: t.trailingStop || null, breakeven: t.breakeven || null,
    execution_grade: t.executionGrade || null, process_grade: t.processGrade || null,
    confidence: t.confidence ? parseInt(t.confidence) : null,
    emotions_pre: t.emotionsPre || [], emotions_during: t.emotionsDuring || [], emotions_post: t.emotionsPost || [],
    story: t.story || null, notes: t.notes || null, tv_link: t.tvLink || null, replay_link: t.replayLink || null,
    photos: t.photos || [], account_id: t.account || null,
  }
}

function mapTradeToDBUpdate(patch) {
  const m = {}
  if (patch.status !== undefined) m.status = patch.status
  if (patch.outcome !== undefined) m.outcome = patch.outcome
  if (patch.exit !== undefined) m.exit_price = parseFloat(patch.exit)
  if (patch.pnl !== undefined) m.pnl = parseFloat(patch.pnl)
  if (patch.closedAt !== undefined) m.closed_at = patch.closedAt
  if (patch.notes !== undefined) m.notes = patch.notes
  if (patch.emotionsPost !== undefined) m.emotions_post = patch.emotionsPost
  if (patch.executionGrade !== undefined) m.execution_grade = patch.executionGrade
  if (patch.processGrade !== undefined) m.process_grade = patch.processGrade
  return m
}

// ═══════════════════════════════════════════════
// ACCOUNTS
// ═══════════════════════════════════════════════
export const DEFAULT_ACCOUNTS = [
  { id: 'funded_hive', name: 'Funded Hive', startBal: 25000, color: '#00e68a', type: 'funded', broker: 'Funded Hive', maxDD: 1500, trailingDD: true },
  { id: 'ftmo_chal', name: 'FTMO Challenge', startBal: 100000, color: '#00d4ff', type: 'challenge', broker: 'FTMO', maxDD: 10000, trailingDD: false },
  { id: 'ftmo_fund', name: 'FTMO Funded', startBal: 100000, color: '#a855f7', type: 'funded', broker: 'FTMO', maxDD: 5000, trailingDD: true },
  { id: 'topstep', name: 'TopStep', startBal: 50000, color: '#ffb830', type: 'funded', broker: 'TopStep', maxDD: 2000, trailingDD: true },
  { id: 'personal', name: 'Personal', startBal: 10000, color: '#64748b', type: 'personal', broker: 'Tradovate', maxDD: null, trailingDD: false },
  { id: 'sim', name: 'Sim', startBal: 100000, color: '#3d4858', type: 'sim', broker: 'Tradovate', maxDD: null, trailingDD: false },
]

export const getAccounts = async () => {
  if (_useCloud) {
    const { data } = await supabase.from('accounts').select('*').eq('user_id', _userId).eq('is_active', true).order('created_at')
    return (data || []).map(a => ({
      id: a.id, name: a.name, startBal: a.start_bal, color: a.color,
      type: a.type, broker: a.broker, maxDD: a.max_dd, trailingDD: a.trailing_dd,
    }))
  }
  return local.get('accounts') || DEFAULT_ACCOUNTS
}

export const setAccounts = async (accs) => {
  if (_useCloud) {
    // Sync: delete removed, upsert rest
    const existing = await getAccounts()
    const newIds = accs.map(a => a.id)
    const toDelete = existing.filter(a => !newIds.includes(a.id))
    for (const a of toDelete) {
      await supabase.from('accounts').update({ is_active: false }).eq('id', a.id)
    }
    for (const a of accs) {
      const row = { user_id: _userId, name: a.name, start_bal: a.startBal || 0, color: a.color, type: a.type, broker: a.broker, max_dd: a.maxDD, trailing_dd: a.trailingDD, is_active: true }
      if (a.id && !a.id.includes('_' + Date.now())) {
        await supabase.from('accounts').upsert({ id: a.id, ...row })
      } else {
        await supabase.from('accounts').insert(row)
      }
    }
    return
  }
  local.set('accounts', accs)
}

export const getActiveAcc = () => local.get('activeAcc') || 'all'
export const setActiveAcc = (v) => local.set('activeAcc', v)

// ═══════════════════════════════════════════════
// DAILY LOGS
// ═══════════════════════════════════════════════
export const getDailyLog = async (d) => {
  if (_useCloud) {
    const { data } = await supabase.from('daily_logs').select('*').eq('user_id', _userId).eq('date', d).single()
    if (data) return { checklist: data.checklist || {}, gameplan: data.gameplan || '', mood: data.mood || '', notes: data.notes || '', bias: data.bias || '' }
  }
  return local.get(`dl_${d}`) || { checklist: {}, gameplan: '', mood: '', notes: '', bias: '' }
}

export const setDailyLog = async (d, v) => {
  if (_useCloud) {
    await supabase.from('daily_logs').upsert({
      user_id: _userId, date: d, bias: v.bias, gameplan: v.gameplan, mood: v.mood, notes: v.notes, checklist: v.checklist,
    }, { onConflict: 'user_id,date' })
    return
  }
  local.set(`dl_${d}`, v)
}

// ═══════════════════════════════════════════════
// JOURNAL
// ═══════════════════════════════════════════════
export const getJournal = async () => {
  if (_useCloud) {
    const { data } = await supabase.from('journal_entries').select('*').eq('user_id', _userId).order('dt', { ascending: false })
    return (data || []).map(e => ({ id: e.id, dt: e.dt, text: e.text, lesson: e.lesson, emo: e.emo, comp: e.compliance, res: e.result }))
  }
  return local.get('journal') || []
}

export const addJournalEntry = async (e) => {
  if (_useCloud) {
    await supabase.from('journal_entries').insert({ user_id: _userId, dt: e.dt, text: e.text, lesson: e.lesson, emo: e.emo ? parseInt(e.emo) : null, compliance: e.comp, result: e.res })
    return
  }
  local.set('journal', [e, ...(local.get('journal') || [])])
}

export const deleteJournalEntry = async (id) => {
  if (_useCloud) {
    await supabase.from('journal_entries').delete().eq('id', id).eq('user_id', _userId)
    return
  }
  local.set('journal', (local.get('journal') || []).filter(e => e.id !== id))
}

// ═══════════════════════════════════════════════
// MACRO
// ═══════════════════════════════════════════════
export const getMacro = async (d) => {
  if (_useCloud) {
    const { data } = await supabase.from('macro_entries').select('*').eq('user_id', _userId).eq('date', d).single()
    if (data) return { dxy: data.dxy, bias: data.bias, event: data.event, spec: data.spec, sum: data.summary }
  }
  return local.get(`macro_${d}`) || {}
}

export const setMacro = async (d, v) => {
  if (_useCloud) {
    await supabase.from('macro_entries').upsert({
      user_id: _userId, date: d, dxy: v.dxy, bias: v.bias, event: v.event, spec: v.spec, summary: v.sum,
    }, { onConflict: 'user_id,date' })
    return
  }
  local.set(`macro_${d}`, v)
}

// ═══════════════════════════════════════════════
// PSYCHOLOGY
// ═══════════════════════════════════════════════
const PSY_DEFAULT = {
  preSleep: '', preStress: '', preEnergy: '', preMotivation: '', preConfidence: '',
  preEmotions: [], preMood: '', duringEmotions: [], duringNotes: '',
  postEmotions: [], postMood: '', postReflection: '', postLesson: '',
  executionGrade: '', processGrade: '', emotionalStability: '',
}

export const getPsychology = async (d) => {
  if (_useCloud) {
    const { data } = await supabase.from('psychology_entries').select('*').eq('user_id', _userId).eq('date', d).single()
    if (data) return {
      preSleep: data.pre_sleep, preStress: data.pre_stress, preEnergy: data.pre_energy,
      preMotivation: data.pre_motivation, preConfidence: data.pre_confidence,
      preEmotions: data.pre_emotions || [], preMood: data.pre_mood,
      duringEmotions: data.during_emotions || [], duringNotes: data.during_notes,
      postEmotions: data.post_emotions || [], postMood: data.post_mood,
      postReflection: data.post_reflection, postLesson: data.post_lesson,
      executionGrade: data.execution_grade, processGrade: data.process_grade,
      emotionalStability: data.emotional_stability,
    }
  }
  return local.get(`psy_${d}`) || PSY_DEFAULT
}

export const setPsychology = async (d, v) => {
  if (_useCloud) {
    await supabase.from('psychology_entries').upsert({
      user_id: _userId, date: d,
      pre_sleep: v.preSleep || null, pre_stress: v.preStress || null, pre_energy: v.preEnergy || null,
      pre_motivation: v.preMotivation || null, pre_confidence: v.preConfidence || null,
      pre_emotions: v.preEmotions || [], pre_mood: v.preMood || null,
      during_emotions: v.duringEmotions || [], during_notes: v.duringNotes || null,
      post_emotions: v.postEmotions || [], post_mood: v.postMood || null,
      post_reflection: v.postReflection || null, post_lesson: v.postLesson || null,
      execution_grade: v.executionGrade || null, process_grade: v.processGrade || null,
      emotional_stability: v.emotionalStability || null,
    }, { onConflict: 'user_id,date' })
    return
  }
  local.set(`psy_${d}`, v)
}

// ═══════════════════════════════════════════════
// QUICK NOTES
// ═══════════════════════════════════════════════
export const getQNotes = async () => {
  if (_useCloud) {
    const { data } = await supabase.from('quick_notes').select('*').eq('user_id', _userId).order('created_at', { ascending: false }).limit(30)
    return (data || []).map(n => ({ id: n.id, dt: n.dt, text: n.text }))
  }
  return local.get('qnotes') || []
}

export const addQNote = async (n) => {
  if (_useCloud) {
    await supabase.from('quick_notes').insert({ user_id: _userId, dt: n.dt, text: n.text })
    return
  }
  local.set('qnotes', [n, ...(local.get('qnotes') || [])].slice(0, 30))
}

export const deleteQNote = async (id) => {
  if (_useCloud) {
    await supabase.from('quick_notes').delete().eq('id', id).eq('user_id', _userId)
    return
  }
  local.set('qnotes', (local.get('qnotes') || []).filter(n => n.id !== id))
}

// ═══════════════════════════════════════════════
// HELPERS (sync — no DB calls)
// ═══════════════════════════════════════════════
export const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const fmtPnl = (n) => {
  if (n === undefined || n === null) return '$0'
  const a = Math.abs(n)
  const s = a >= 1000 ? `${(a / 1000).toFixed(1)}K` : a.toFixed(2)
  return (n >= 0 ? '+$' : '-$') + s
}

export const fmtDate = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })

export const getAccIdFromTrade = (t, accounts) => {
  if (!t.account) return 'unknown'
  const found = accounts.find(a => a.id === t.account || a.name === t.account)
  return found ? found.id : t.account
}

export const getFilteredTrades = async () => {
  const all = await getTrades()
  const active = getActiveAcc()
  if (active === 'all') return all
  const accounts = await getAccounts()
  return all.filter(t => getAccIdFromTrade(t, accounts) === active)
}

// ═══════════════════════════════════════════════
// ADVANCED STATS (pure function, no DB)
// ═══════════════════════════════════════════════
export const calcStats = (trades) => {
  const EMPTY = {
    closed: [], open: [], wins: [], losses: [], be: [], totalPnl: 0, grossWin: 0, grossLoss: 0,
    pf: 0, wr: 0, avgWin: 0, avgLoss: 0, avgRR: 0, expectancy: 0,
    maxConsecWins: 0, maxConsecLosses: 0, maxDD: 0, currentDD: 0, equity: [0],
    zScore: 0, sharpe: 0, payoff: 0, recovery: 0, avgHoldMin: 0, ror: null,
    bestDay: 0, worstDay: 0, greenDays: 0, redDays: 0, avgDayPnl: 0,
  }
  if (!trades || !trades.length) return EMPTY
  const closed = trades.filter(t => t.status === 'closed')
  const open = trades.filter(t => t.status === 'open')
  const wins = closed.filter(t => t.outcome === 'win')
  const losses = closed.filter(t => t.outcome === 'loss')
  const be = closed.filter(t => t.outcome === 'be')
  const pnls = closed.map(t => parseFloat(t.pnl) || 0)
  const totalPnl = pnls.reduce((s, p) => s + p, 0)
  const grossWin = wins.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0))
  const pf = grossLoss > 0 ? grossWin / grossLoss : Infinity
  const wr = closed.length ? (wins.length / closed.length) * 100 : 0
  const avgWin = wins.length ? grossWin / wins.length : 0
  const avgLoss = losses.length ? grossLoss / losses.length : 0

  const rrs = closed.map(t => {
    const e = parseFloat(t.entry), sl = parseFloat(t.sl)
    if (!e || !sl) return null
    const risk = Math.abs(e - sl)
    const pnl = parseFloat(t.pnl) || 0
    return risk > 0 ? pnl / (risk * (parseFloat(t.contracts) || 1)) : null
  }).filter(Boolean)
  // Use payoff ratio (avgWin/avgLoss) when no SL data available
  const avgRR = rrs.length ? rrs.reduce((s, r) => s + r, 0) / rrs.length : (avgLoss > 0 ? avgWin / avgLoss : 0)

  const wrDec = wr / 100
  const expectancy = closed.length ? (wrDec * avgWin) - ((1 - wrDec) * avgLoss) : 0

  let maxConsecWins = 0, maxConsecLosses = 0, cw = 0, cl = 0
  closed.forEach(t => {
    if (t.outcome === 'win') { cw++; cl = 0; maxConsecWins = Math.max(maxConsecWins, cw) }
    else if (t.outcome === 'loss') { cl++; cw = 0; maxConsecLosses = Math.max(maxConsecLosses, cl) }
    else { cw = 0; cl = 0 }
  })

  let peak = 0, maxDD = 0, currentDD = 0
  const equity = [0]
  pnls.forEach(p => {
    const cur = equity[equity.length - 1] + p
    equity.push(cur)
    peak = Math.max(peak, cur)
    currentDD = peak - cur
    maxDD = Math.max(maxDD, currentDD)
  })

  const n = closed.length
  const w = wins.length, l = losses.length
  let runs = 0
  if (n > 1) { runs = 1; for (let i = 1; i < n; i++) { if (closed[i].outcome !== closed[i - 1].outcome) runs++ } }
  let zScore = 0
  if (n > 1 && w > 0 && l > 0) {
    const denom = (2 * w * l * (2 * w * l - n)) / (n * n - n)
    if (denom > 0) {
      zScore = (n * (runs - 0.5) - 2 * w * l) / Math.sqrt(denom)
      zScore = Math.max(-10, Math.min(10, zScore))
    }
  }

  const dailyReturns = {}
  closed.forEach(t => { if (!dailyReturns[t.date]) dailyReturns[t.date] = 0; dailyReturns[t.date] += parseFloat(t.pnl) || 0 })
  const drArr = Object.values(dailyReturns)
  const drMean = drArr.length ? drArr.reduce((s, r) => s + r, 0) / drArr.length : 0
  const drStd = drArr.length > 1 ? Math.sqrt(drArr.reduce((s, r) => s + (r - drMean) ** 2, 0) / (drArr.length - 1)) : 0
  const sharpe = drStd > 0 ? (drMean / drStd) * Math.sqrt(252) : 0

  const downside = drArr.filter(r => r < 0)
  const dsStd = downside.length > 1 ? Math.sqrt(downside.reduce((s, r) => s + r ** 2, 0) / downside.length) : 0
  const sortino = dsStd > 0 ? (drMean / dsStd) * Math.sqrt(252) : 0

  const kelly = avgLoss > 0 ? wrDec - ((1 - wrDec) / (avgWin / avgLoss)) : 0
  const payoff = avgLoss > 0 ? avgWin / avgLoss : Infinity
  const recovery = maxDD > 0 ? totalPnl / maxDD : 0

  const holdTimes = closed.filter(t => t.ts && t.closedAt).map(t => (new Date(t.closedAt) - new Date(t.ts)) / (1000 * 60)).filter(m => m > 0 && m < 60 * 24)
  const avgHoldMin = holdTimes.length ? holdTimes.reduce((s, m) => s + m, 0) / holdTimes.length : 0
  const ror = n > 10 && avgLoss > 0 ? Math.pow((1 - wrDec) / wrDec, 20) : null

  return {
    closed, open, wins, losses, be, totalPnl, grossWin, grossLoss,
    pf, wr, avgWin, avgLoss, avgRR, expectancy,
    maxConsecWins, maxConsecLosses, maxDD, currentDD, equity,
    zScore, sharpe, payoff, recovery, avgHoldMin, ror,
    bestDay: drArr.length ? Math.max(...drArr) : 0,
    worstDay: drArr.length ? Math.min(...drArr) : 0,
    greenDays: drArr.filter(r => r > 0).length,
    redDays: drArr.filter(r => r <= 0).length,
    avgDayPnl: drMean,
  }
}
