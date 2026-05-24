import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody, PillSelect, MetricRow, Alert, SubTabs, Gauge } from '../ui/index'
import { toast } from '../ui/index'
import { getPsychology, setPsychology, todayStr, fmtDate, getFilteredTrades, calcStats } from '../../lib/db'
import { EMOTION_TAGS } from '../../data/constants'

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function RatingBar({ label, value, onChange, lowLabel = 'Poor', highLabel = 'Great' }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <label className="label mb-0">{label}</label>
        <span className="font-mono text-xs font-semibold text-cyan">{value || '—'}/10</span>
      </div>
      <div className="flex gap-1">
        {RATINGS.map(r => (
          <button key={r} onClick={() => onChange(r)}
            className={`flex-1 h-7 rounded text-[10px] font-mono font-semibold transition-all border
              ${value === r
                ? r <= 3 ? 'bg-red/15 border-red/40 text-red'
                : r <= 6 ? 'bg-amber/15 border-amber/40 text-amber'
                : 'bg-emerald/15 border-emerald/40 text-emerald'
                : 'border-border bg-bg-3 text-ink-5 hover:border-border-3'}`}>
            {r}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[8px] font-mono text-ink-5">{lowLabel}</span>
        <span className="text-[8px] font-mono text-ink-5">{highLabel}</span>
      </div>
    </div>
  )
}

// ── PRE-SESSION ────────────────────────────────────
function PreSession({ date }) {
  const [psy, setPsy] = useState({})
  useEffect(() => { (async () => setPsy(await getPsychology(date)))() }, [date])
  const save = async (patch) => {
    const updated = { ...psy, ...patch }
    setPsy(updated)
    await setPsychology(date, updated)
  }

  return (
    <div className="space-y-4">
      <Alert type="info">Rate your state BEFORE trading. This data helps identify patterns between psychology and performance.</Alert>

      <Card>
        <CardHeader title="Pre-Session State" badge={fmtDate(date)} />
        <CardBody className="space-y-1">
          <RatingBar label="Sleep Quality" value={psy.preSleep} onChange={v => save({ preSleep: v })} lowLabel="Terrible" highLabel="Perfect" />
          <RatingBar label="Stress Level" value={psy.preStress} onChange={v => save({ preStress: v })} lowLabel="Calm" highLabel="Very Stressed" />
          <RatingBar label="Energy Level" value={psy.preEnergy} onChange={v => save({ preEnergy: v })} lowLabel="Exhausted" highLabel="Peak" />
          <RatingBar label="Motivation" value={psy.preMotivation} onChange={v => save({ preMotivation: v })} lowLabel="None" highLabel="Maximum" />
          <RatingBar label="Confidence" value={psy.preConfidence} onChange={v => save({ preConfidence: v })} lowLabel="No Confidence" highLabel="Very High" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Pre-Session Emotions" />
        <CardBody>
          <div className="flex flex-wrap gap-1.5">
            {EMOTION_TAGS.map(tag => {
              const active = (psy.preEmotions || []).includes(tag)
              return (
                <button key={tag} onClick={() => {
                  const arr = psy.preEmotions || []
                  save({ preEmotions: active ? arr.filter(t => t !== tag) : [...arr, tag] })
                }}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-all
                    ${active ? 'bg-cyan/10 border-cyan/30 text-cyan' : 'border-border text-ink-5 hover:border-border-3'}`}>
                  {tag}
                </button>
              )
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Pre-Session Mood" />
        <CardBody>
          <textarea className="input min-h-[80px] resize-y" value={psy.preMood || ''}
            onChange={e => save({ preMood: e.target.value })}
            placeholder="How are you feeling? Ready to trade? Any distractions? Emotional baggage?" />
        </CardBody>
      </Card>

      {/* Warnings */}
      {psy.preSleep && psy.preSleep <= 3 && <Alert type="warn">Low sleep detected. Consider half size or sitting out.</Alert>}
      {psy.preStress && psy.preStress >= 8 && <Alert type="error">High stress. Trading under stress leads to revenge trades. Consider skipping today.</Alert>}
      {(psy.preEmotions || []).includes('Revenge') && <Alert type="error">REVENGE FLAG. Do NOT trade. Close charts. Walk away.</Alert>}
      {(psy.preEmotions || []).includes('FOMO') && <Alert type="warn">FOMO detected. Wait for your setup. Do not chase.</Alert>}
    </div>
  )
}

// ── DURING SESSION ─────────────────────────────────
function DuringSession({ date }) {
  const [psy, setPsy] = useState({})
  useEffect(() => { (async () => setPsy(await getPsychology(date)))() }, [date])
  const save = async (patch) => {
    const updated = { ...psy, ...patch }
    setPsy(updated)
    await setPsychology(date, updated)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="During-Session Emotions" badge="LIVE" />
        <CardBody>
          <p className="text-xs text-ink-4 mb-3">Tag emotions you experienced during the session:</p>
          <div className="flex flex-wrap gap-1.5">
            {EMOTION_TAGS.map(tag => {
              const active = (psy.duringEmotions || []).includes(tag)
              const danger = ['Revenge', 'FOMO', 'Greed', 'Impulsive'].includes(tag)
              return (
                <button key={tag} onClick={() => {
                  const arr = psy.duringEmotions || []
                  save({ duringEmotions: active ? arr.filter(t => t !== tag) : [...arr, tag] })
                }}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-all
                    ${active
                      ? danger ? 'bg-red/10 border-red/30 text-red' : 'bg-emerald/10 border-emerald/30 text-emerald'
                      : 'border-border text-ink-5 hover:border-border-3'}`}>
                  {tag}
                </button>
              )
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Session Notes" />
        <CardBody>
          <textarea className="input min-h-[80px] resize-y" value={psy.duringNotes || ''}
            onChange={e => save({ duringNotes: e.target.value })}
            placeholder="What happened emotionally during the session? Any triggers? Did you follow the plan?" />
        </CardBody>
      </Card>
    </div>
  )
}

// ── POST SESSION ───────────────────────────────────
function PostSession({ date }) {
  const [psy, setPsy] = useState({})
  useEffect(() => { (async () => setPsy(await getPsychology(date)))() }, [date])
  const save = async (patch) => {
    const updated = { ...psy, ...patch }
    setPsy(updated)
    await setPsychology(date, updated)
  }

  const EXEC_GRADES = ['A+', 'A', 'B', 'C', 'D', 'F']

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Post-Session Emotions" />
        <CardBody>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {EMOTION_TAGS.map(tag => {
              const active = (psy.postEmotions || []).includes(tag)
              return (
                <button key={tag} onClick={() => {
                  const arr = psy.postEmotions || []
                  save({ postEmotions: active ? arr.filter(t => t !== tag) : [...arr, tag] })
                }}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-all
                    ${active ? 'bg-purple/10 border-purple/30 text-purple' : 'border-border text-ink-5 hover:border-border-3'}`}>
                  {tag}
                </button>
              )
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Session Grading" />
        <CardBody className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Execution Grade</label>
              <select className="input" value={psy.executionGrade || ''} onChange={e => save({ executionGrade: e.target.value })}>
                <option value="">--</option>{EXEC_GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label className="label">Process Grade</label>
              <select className="input" value={psy.processGrade || ''} onChange={e => save({ processGrade: e.target.value })}>
                <option value="">--</option>{EXEC_GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <RatingBar label="Emotional Stability" value={psy.emotionalStability} onChange={v => save({ emotionalStability: v })} lowLabel="Chaotic" highLabel="Rock Solid" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Reflection" />
        <CardBody className="space-y-3">
          <div><label className="label">What did you do well?</label>
            <textarea className="input min-h-[60px] resize-y" value={psy.postReflection || ''} onChange={e => save({ postReflection: e.target.value })}
              placeholder="Process wins, discipline moments, good entries..." />
          </div>
          <div><label className="label">Key Lesson (one sentence)</label>
            <input className="input" value={psy.postLesson || ''} onChange={e => save({ postLesson: e.target.value })}
              placeholder="The one thing to remember tomorrow..." />
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

// ── TRENDS ─────────────────────────────────────────
function Trends() {
  const [days, setDays] = useState([])
  const [trades, setTradesState] = useState([])

  useEffect(() => {
    (async () => {
      const result = []
      for (let i = 13; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const psy = await getPsychology(ds)
        if (psy.preSleep || psy.preEnergy || psy.emotionalStability) {
          result.push({ date: ds, ...psy })
        }
      }
      setDays(result)
      setTradesState((await getFilteredTrades()).filter(t => t.status === 'closed'))
    })()
  }, [])

  // Emotion frequency
  const emotionFreq = {}
  days.forEach(d => {
    ;[...(d.preEmotions || []), ...(d.duringEmotions || []), ...(d.postEmotions || [])].forEach(e => {
      emotionFreq[e] = (emotionFreq[e] || 0) + 1
    })
  })
  const topEmotions = Object.entries(emotionFreq).sort((a, b) => b[1] - a[1]).slice(0, 10)

  // Averages
  const avgSleep = days.filter(d => d.preSleep).reduce((s, d) => s + d.preSleep, 0) / (days.filter(d => d.preSleep).length || 1)
  const avgStress = days.filter(d => d.preStress).reduce((s, d) => s + d.preStress, 0) / (days.filter(d => d.preStress).length || 1)
  const avgEnergy = days.filter(d => d.preEnergy).reduce((s, d) => s + d.preEnergy, 0) / (days.filter(d => d.preEnergy).length || 1)
  const avgStability = days.filter(d => d.emotionalStability).reduce((s, d) => s + d.emotionalStability, 0) / (days.filter(d => d.emotionalStability).length || 1)

  // Cross-reference with trading performance
  // trades loaded in useEffect above
  const highSleepDays = days.filter(d => d.preSleep >= 7).map(d => d.date)
  const lowSleepDays = days.filter(d => d.preSleep && d.preSleep <= 4).map(d => d.date)
  const highSleepPnl = trades.filter(t => highSleepDays.includes(t.date)).reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)
  const lowSleepPnl = trades.filter(t => lowSleepDays.includes(t.date)).reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)

  // Revenge/FOMO correlation
  const revengeDays = days.filter(d => (d.duringEmotions || []).includes('Revenge') || (d.preEmotions || []).includes('Revenge')).map(d => d.date)
  const revengePnl = trades.filter(t => revengeDays.includes(t.date)).reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)

  if (days.length === 0) {
    return <div className="text-center py-16 text-ink-5 font-mono text-xs">Start logging psychology data to see trends.</div>
  }

  return (
    <div className="space-y-4">
      {/* Psychological Score */}
      <Card>
        <CardHeader title="Psychological Score" badge={`${days.length} days`} />
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Gauge label="Avg Sleep" value={avgSleep} min={0} max={10} color="dynamic" />
            <Gauge label="Avg Stress" value={10 - avgStress} min={0} max={10} color="dynamic" />
            <Gauge label="Avg Energy" value={avgEnergy} min={0} max={10} color="dynamic" />
            <Gauge label="Stability" value={avgStability} min={0} max={10} color="dynamic" />
          </div>
        </CardBody>
      </Card>

      {/* Pattern Detection */}
      <Card>
        <CardHeader title="Pattern Detection" badge="AUTO" />
        <CardBody className="space-y-2">
          {highSleepDays.length > 0 && lowSleepDays.length > 0 && (
            <div className="p-3 bg-bg-3 rounded-lg border border-border">
              <div className="text-xs font-semibold text-ink mb-1">Sleep vs Performance</div>
              <div className="text-sm text-ink-3">
                High sleep days ({highSleepDays.length}): <span className={highSleepPnl >= 0 ? 'text-emerald font-mono font-semibold' : 'text-red font-mono font-semibold'}>${highSleepPnl.toFixed(0)}</span> &nbsp;|&nbsp;
                Low sleep days ({lowSleepDays.length}): <span className={lowSleepPnl >= 0 ? 'text-emerald font-mono font-semibold' : 'text-red font-mono font-semibold'}>${lowSleepPnl.toFixed(0)}</span>
              </div>
            </div>
          )}
          {revengeDays.length > 0 && (
            <div className="p-3 bg-red/5 rounded-lg border border-red/20">
              <div className="text-xs font-semibold text-red mb-1">Revenge Trading Impact</div>
              <div className="text-sm text-ink-3">
                {revengeDays.length} revenge days detected. Total P&L on those days: <span className="text-red font-mono font-semibold">${revengePnl.toFixed(0)}</span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Emotion Frequency */}
      {topEmotions.length > 0 && (
        <Card>
          <CardHeader title="Emotion Frequency" badge="LAST 14 DAYS" />
          <CardBody>
            {topEmotions.map(([emotion, count]) => {
              const danger = ['Revenge', 'FOMO', 'Greed', 'Impulsive', 'Fear', 'Anxiety'].includes(emotion)
              const positive = ['Calm', 'Discipline', 'Patience', 'Focused', 'Confidence'].includes(emotion)
              return (
                <div key={emotion} className="flex items-center gap-3 py-1.5">
                  <span className={`text-xs flex-1 ${danger ? 'text-red' : positive ? 'text-emerald' : 'text-ink-3'}`}>{emotion}</span>
                  <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${danger ? 'bg-red' : positive ? 'bg-emerald' : 'bg-cyan'}`}
                      style={{ width: `${(count / Math.max(...topEmotions.map(e => e[1]))) * 100}%` }} />
                  </div>
                  <span className="font-mono text-[10px] text-ink-4 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </CardBody>
        </Card>
      )}

      {/* Daily Log */}
      <Card>
        <CardHeader title="Daily Psychology Log" />
        <CardBody>
          {days.slice().reverse().map(d => (
            <div key={d.date} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <span className="font-mono text-[10px] text-ink-4 w-20">{d.date.slice(5)}</span>
              <div className="flex gap-2 flex-1 flex-wrap">
                {d.preSleep && <span className="badge badge-gray">SLP:{d.preSleep}</span>}
                {d.preEnergy && <span className="badge badge-gray">NRG:{d.preEnergy}</span>}
                {d.emotionalStability && <span className="badge badge-cyan">STB:{d.emotionalStability}</span>}
                {d.executionGrade && <span className="badge badge-amber">EX:{d.executionGrade}</span>}
              </div>
              {(d.duringEmotions || []).some(e => ['Revenge', 'FOMO', 'Impulsive'].includes(e)) && (
                <span className="badge badge-red">FLAG</span>
              )}
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────
export default function Psychology({ refresh }) {
  const [sub, setSub] = useState('pre')
  const [date, setDate] = useState(todayStr())
  const tabs = [
    { id: 'pre', label: 'Pre-Session' },
    { id: 'during', label: 'During' },
    { id: 'post', label: 'Post-Session' },
    { id: 'trends', label: 'Trends' },
  ]

  return (
    <div className="fade-up space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <button onClick={() => setDate(todayStr())} className="btn-secondary whitespace-nowrap">Today</button>
      </div>

      <SubTabs tabs={tabs} active={sub} onChange={setSub} />

      {sub === 'pre' && <PreSession date={date} />}
      {sub === 'during' && <DuringSession date={date} />}
      {sub === 'post' && <PostSession date={date} />}
      {sub === 'trends' && <Trends />}
    </div>
  )
}
