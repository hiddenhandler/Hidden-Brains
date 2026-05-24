import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowRightLeft, TrendingUp, ClipboardList, Brain } from 'lucide-react'

const TABS = [
  { to: '/', icon: LayoutDashboard, label: 'Dash' },
  { to: '/trade', icon: ArrowRightLeft, label: 'Trade' },
  { to: '/track', icon: TrendingUp, label: 'Track' },
  { to: '/log', icon: ClipboardList, label: 'Log' },
  { to: '/psychology', icon: Brain, label: 'Psych' },
]

const navClass = ({ isActive }) =>
  `flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider transition-colors ${
    isActive ? 'bg-cyan/10 text-cyan' : 'text-ink-4 hover:text-ink-2'
  }`

const mobileClass = ({ isActive }) =>
  `flex flex-col items-center gap-0.5 text-[9px] font-mono uppercase tracking-wider transition-colors ${
    isActive ? 'text-cyan' : 'text-ink-5'
  }`

export function TopNav() {
  return (
    <nav className="hidden sm:flex items-center gap-1 px-4 py-2 border-b border-border bg-bg">
      {TABS.map(t => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={navClass}>
          <t.icon size={13} strokeWidth={1.5} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function BottomNav() {
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-bg/95 backdrop-blur border-t border-border flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {TABS.map(t => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={mobileClass}>
          <t.icon size={18} strokeWidth={1.5} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
