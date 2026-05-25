import { useState, useEffect, createContext, useContext } from 'react'

// ── TOAST SYSTEM ──────────────────────────────
const ToastCtx = createContext()
let _addToast = () => {}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  _addToast = (msg, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2500)
  }
  if (!toasts.length) return null
  return (
    <div className="fixed top-14 right-3 z-50 space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={`px-3 py-2 rounded text-xs font-mono border fade-up ${
          t.type === 'error' ? 'bg-red/10 border-red/20 text-red'
          : t.type === 'warn' ? 'bg-amber/10 border-amber/20 text-amber'
          : 'bg-emerald/10 border-emerald/20 text-emerald'
        }`}>{t.msg}</div>
      ))}
    </div>
  )
}
export const toast = (msg, type) => _addToast(msg, type)

// ── CARDS ─────────────────────────────────────
export function Card({ children, className = '' }) {
  return <div className={`card p-0 ${className}`}>{children}</div>
}

export function CardHeader({ title, badge }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
      <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-amber">{title}</h3>
      {badge && <span className="text-[9px] font-mono text-ink-4 uppercase tracking-wider">{badge}</span>}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>
}

// ── STAT CARD ─────────────────────────────────
export function StatCard({ label, value, sub, accent = 'gray' }) {
  const colors = {
    green: 'text-emerald', red: 'text-red', cyan: 'text-cyan',
    amber: 'text-amber', purple: 'text-purple', gray: 'text-ink-3',
  }
  const topColors = {
    green: 'bg-emerald', red: 'bg-red', cyan: 'bg-cyan',
    amber: 'bg-amber', purple: 'bg-purple', gray: 'bg-ink-5',
  }
  return (
    <div className="bg-surface border border-border rounded p-3 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${topColors[accent] || topColors.gray}`} />
      <div className="text-[9px] font-mono text-ink-4 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-base font-mono font-semibold ${colors[accent] || colors.gray}`}>{value}</div>
      {sub && <div className="text-[9px] font-mono text-ink-5 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── GAUGE (SVG ARC) ───────────────────────────
export function Gauge({ label, value, min = 0, max = 5, color = 'dynamic' }) {
  const clamped = Math.max(min, Math.min(max, value || 0))
  const pct = max !== min ? (clamped - min) / (max - min) : 0
  const circumference = 251
  const offset = circumference * (1 - pct)
  const getColor = () => {
    if (color !== 'dynamic') return color
    if (pct > 0.6) return '#26a69a'
    if (pct > 0.3) return '#f7c948'
    return '#ef5350'
  }
  const c = getColor()
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 60" className="w-full max-w-[100px]">
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#2a2e3e" strokeWidth="6" strokeLinecap="round" />
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke={c} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="font-mono text-sm font-semibold -mt-2" style={{ color: c }}>
        {typeof value === 'number' ? value.toFixed(2) : '0.00'}
      </div>
      <div className="text-[8px] font-mono text-ink-5 uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  )
}

// ── PROGRESS BAR ──────────────────────────────
export function ProgressBar({ pct, gradient }) {
  return (
    <div className="w-full h-1 bg-bg-3 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, pct)}%`,
          background: gradient ? 'linear-gradient(90deg, #ef5350, #f7c948, #26a69a)' : '#2962ff',
        }} />
    </div>
  )
}

// ── ALERT ─────────────────────────────────────
export function Alert({ type = 'info', children }) {
  const cls = {
    error: 'bg-red/8 border-red/20 text-red',
    warn: 'bg-amber/8 border-amber/20 text-amber',
    info: 'bg-cyan/8 border-cyan/20 text-cyan',
  }
  return <div className={`px-3 py-2 rounded border text-xs font-mono ${cls[type] || cls.info}`}>{children}</div>
}

// ── CHECK ITEM ────────────────────────────────
export function CheckItem({ checked, text, note, onToggle }) {
  return (
    <div onClick={onToggle} className={`flex items-start gap-2.5 p-2.5 rounded cursor-pointer transition-colors ${checked ? 'bg-emerald/5' : 'hover:bg-surface-2'}`}>
      <div className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
        checked ? 'bg-emerald/20 border-emerald/40 text-emerald' : 'border-border-2'
      }`}>
        {checked && <span className="text-[10px]">✓</span>}
      </div>
      <div className="min-w-0">
        <div className={`text-xs ${checked ? 'text-ink-3 line-through' : 'text-ink-2'}`}>{text}</div>
        {note && <div className="text-[10px] text-ink-5 mt-0.5">{note}</div>}
      </div>
    </div>
  )
}

// ── TRADE CARD ─────────────────────────────────
export function TradeCard({ trade: t }) {
  const isWin = t.outcome === 'win'
  const isLoss = t.outcome === 'loss'
  return (
    <div className="flex items-center gap-3 py-2 px-3 border-b border-border/50 last:border-0">
      <div className={`w-1 h-8 rounded-full flex-shrink-0 ${isWin ? 'bg-emerald' : isLoss ? 'bg-red' : 'bg-ink-5'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-ink">{t.instrument}</span>
          <span className={`text-[9px] font-mono uppercase ${t.dir === 'long' ? 'text-emerald' : 'text-red'}`}>{t.dir}</span>
          {t.setup && <span className="text-[9px] font-mono text-ink-5">{t.setup}</span>}
        </div>
        <div className="text-[9px] font-mono text-ink-5">{t.date}</div>
      </div>
      <div className={`text-sm font-mono font-semibold ${isWin ? 'text-emerald' : isLoss ? 'text-red' : 'text-ink-3'}`}>
        {t.pnl >= 0 ? '+' : ''}{parseFloat(t.pnl || 0).toFixed(0)}
      </div>
    </div>
  )
}

// ── PILL SELECT ───────────────────────────────
export function PillSelect({ options, value, onChange, multi = false }) {
  const selected = multi ? (value || []) : [value]
  const toggle = (v) => {
    if (multi) {
      const arr = selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]
      onChange(arr)
    } else {
      onChange(value === v ? '' : v)
    }
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.value
        const label = typeof o === 'string' ? o : o.label
        const active = selected.includes(val)
        return (
          <button key={val} onClick={() => toggle(val)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
              active ? 'bg-amber/15 text-amber border border-amber/25' : 'text-ink-4 border border-border hover:border-border-3'
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
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-surface border border-border rounded-lg w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-amber">{title}</h3>
          <button onClick={onClose} className="text-ink-4 hover:text-ink text-lg leading-none">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// ── SUB TABS ──────────────────────────────────
export function SubTabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 mb-4 p-0.5 bg-bg-3 rounded">
      {tabs.map(t => {
        const id = typeof t === 'string' ? t : t.id
        const label = typeof t === 'string' ? t : t.label
        return (
          <button key={id} onClick={() => onChange(id)}
            className={`flex-1 px-3 py-1.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider transition-colors ${
              active === id ? 'bg-surface text-amber' : 'text-ink-5 hover:text-ink-3'
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
      <span className="text-[10px] font-mono text-ink-4 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-mono font-medium ${color}`}>{value}</span>
    </div>
  )
}
