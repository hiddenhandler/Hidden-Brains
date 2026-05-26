import { useState } from 'react'

// ── TOAST ─────────────────────────────────────
let _addToast = () => {}
export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  _addToast = (msg, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2200)
  }
  if (!toasts.length) return null
  return (
    <div className="fixed top-12 right-3 z-50 space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={`px-3 py-2 rounded-md text-xs font-mono border fade-up ${
          t.type === 'error' ? 'bg-red/8 border-red/15 text-red'
          : t.type === 'warn' ? 'bg-amber/8 border-amber/15 text-amber'
          : 'bg-emerald/8 border-emerald/15 text-emerald'
        }`}>{t.msg}</div>
      ))}
    </div>
  )
}
export const toast = (msg, type) => _addToast(msg, type)

// ── CARD ──────────────────────────────────────
export function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>
}
export function CardHeader({ title, badge }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
      <h3 className="text-[11px] font-semibold tracking-wide text-ink-2 uppercase">{title}</h3>
      {badge && <span className="text-[9px] font-mono text-ink-5 tracking-wide">{badge}</span>}
    </div>
  )
}
export function CardBody({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>
}

// ── STAT CARD ─────────────────────────────────
export function StatCard({ label, value, sub, accent = 'gray' }) {
  const c = { green: 'text-emerald', red: 'text-red', cyan: 'text-steel', amber: 'text-amber', gray: 'text-ink-3', purple: 'text-ink-3' }
  return (
    <div className="bg-surface border border-border rounded-md p-3">
      <div className="text-[9px] font-medium text-ink-5 tracking-wide uppercase mb-1">{label}</div>
      <div className={`text-base font-semibold font-mono ${c[accent] || c.gray}`}>{value}</div>
      {sub && <div className="text-[9px] text-ink-5 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── GAUGE ─────────────────────────────────────
export function Gauge({ label, value, min = 0, max = 5, color = 'dynamic' }) {
  const clamped = Math.max(min, Math.min(max, value || 0))
  const pct = max !== min ? (clamped - min) / (max - min) : 0
  const circumference = 251
  const offset = circumference * (1 - pct)
  const getColor = () => {
    if (color !== 'dynamic') return color
    if (pct > 0.6) return '#3FA66B'
    if (pct > 0.3) return '#B89B72'
    return '#C65B5B'
  }
  const c = getColor()
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 60" className="w-full max-w-[100px]">
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#2d3a4f" strokeWidth="5" strokeLinecap="round" />
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="font-mono text-sm font-semibold -mt-2" style={{ color: c }}>{typeof value === 'number' ? value.toFixed(2) : '0.00'}</div>
      <div className="text-[8px] font-medium text-ink-5 uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  )
}

// ── PROGRESS BAR ──────────────────────────────
export function ProgressBar({ pct, gradient }) {
  return (
    <div className="w-full h-1 bg-bg-3 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, pct)}%`, background: gradient ? 'linear-gradient(90deg, #C65B5B, #B89B72, #3FA66B)' : '#5B7FA3' }} />
    </div>
  )
}

// ── ALERT ─────────────────────────────────────
export function Alert({ type = 'info', children }) {
  const cls = { error: 'bg-red/6 border-red/12 text-red', warn: 'bg-amber/6 border-amber/12 text-amber', info: 'bg-steel/6 border-steel/12 text-steel' }
  return <div className={`px-3 py-2 rounded-md border text-xs ${cls[type] || cls.info}`}>{children}</div>
}

// ── CHECK ITEM ────────────────────────────────
export function CheckItem({ checked, text, note, onToggle }) {
  return (
    <div onClick={onToggle} className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors ${checked ? 'bg-emerald/4' : 'hover:bg-surface-2'}`}>
      <div className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center ${checked ? 'bg-emerald/15 border-emerald/30 text-emerald' : 'border-border-2'}`}>
        {checked && <span className="text-[10px]">✓</span>}
      </div>
      <div>
        <div className={`text-xs ${checked ? 'text-ink-4 line-through' : 'text-ink-2'}`}>{text}</div>
        {note && <div className="text-[10px] text-ink-5 mt-0.5">{note}</div>}
      </div>
    </div>
  )
}

// ── TRADE CARD ────────────────────────────────
export function TradeCard({ trade: t }) {
  const isWin = t.outcome === 'win'
  const isLoss = t.outcome === 'loss'
  return (
    <div className="flex items-center gap-3 py-2 px-3 border-b border-border/40 last:border-0">
      <div className={`w-0.5 h-7 rounded-full ${isWin ? 'bg-emerald' : isLoss ? 'bg-red' : 'bg-ink-5'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink">{t.instrument}</span>
          <span className={`text-[9px] font-mono ${t.dir === 'long' ? 'text-emerald' : 'text-red'}`}>{t.dir}</span>
        </div>
        <div className="text-[9px] text-ink-5">{t.date}</div>
      </div>
      <div className={`text-sm font-mono font-semibold ${isWin ? 'text-emerald' : isLoss ? 'text-red' : 'text-ink-4'}`}>
        {(parseFloat(t.pnl) || 0) >= 0 ? '+' : ''}{parseFloat(t.pnl || 0).toFixed(0)}
      </div>
    </div>
  )
}

// ── PILL SELECT ───────────────────────────────
export function PillSelect({ options, value, onChange, multi = false }) {
  const selected = multi ? (value || []) : [value]
  const toggle = (v) => {
    if (multi) { onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]) }
    else { onChange(value === v ? '' : v) }
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.value
        const label = typeof o === 'string' ? o : o.label
        const active = selected.includes(val)
        return (
          <button key={val} onClick={() => toggle(val)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
              active ? 'bg-accent/12 text-accent border border-accent/20' : 'text-ink-5 border border-border hover:border-border-3 hover:text-ink-4'
            }`}>{label}</button>
        )
      })}
    </div>
  )
}

// ── MODAL ─────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-surface border border-border rounded-lg w-full max-w-md max-h-[85vh] overflow-y-auto shadow-card" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold tracking-wide text-ink-2 uppercase">{title}</h3>
          <button onClick={onClose} className="text-ink-5 hover:text-ink text-lg">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// ── SUB TABS ──────────────────────────────────
export function SubTabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-0.5 mb-4 p-0.5 bg-bg-3 rounded-md">
      {tabs.map(t => {
        const id = typeof t === 'string' ? t : t.id
        const label = typeof t === 'string' ? t : t.label
        return (
          <button key={id} onClick={() => onChange(id)}
            className={`flex-1 px-3 py-1.5 rounded text-[10px] font-medium tracking-wide transition-colors ${
              active === id ? 'bg-surface text-accent shadow-sm' : 'text-ink-5 hover:text-ink-4'
            }`}>{label}</button>
        )
      })}
    </div>
  )
}

// ── METRIC ROW ────────────────────────────────
export function MetricRow({ label, value, color = 'text-ink-2' }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[10px] text-ink-4 tracking-wide">{label}</span>
      <span className={`text-xs font-mono font-medium ${color}`}>{value}</span>
    </div>
  )
}
