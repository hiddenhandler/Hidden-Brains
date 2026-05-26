import { useState, useEffect } from 'react'
import { getTrades, getAccIdFromTrade, fmtPnl, getAccounts, setAccounts } from '../../lib/db'
import { Modal } from './index'
import { toast } from './index'
import { ACCOUNT_TYPES, BROKERS } from '../../data/constants'

const COLORS = ['#00e68a','#00d4ff','#ffb830','#a855f7','#ff4757','#64748b','#f97316','#06b6d4']

export default function AccountBar({ accounts, activeAcc, onSwitch, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', startBal: '', color: COLORS[0], type: 'funded', broker: '', maxDD: '', trailingDD: false })
  const [trades, setTrades] = useState([])
  useEffect(() => { (async () => setTrades(await getTrades()))() }, [accounts])

  const accPnl = (id) =>
    trades.filter(t => t.status === 'closed' && getAccIdFromTrade(t, accounts) === id)
      .reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)

  const saveAcc = async () => {
    if (!form.name.trim()) { toast('Name required', 'warn'); return }
    const accs = await getAccounts()
    if (form.id) {
      await setAccounts(accs.map(a => a.id === form.id ? { ...a, ...form, startBal: parseFloat(form.startBal) || 0, maxDD: parseFloat(form.maxDD) || null } : a))
    } else {
      const id = form.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now()
      await setAccounts([...accs, { ...form, id, startBal: parseFloat(form.startBal) || 0, maxDD: parseFloat(form.maxDD) || null }])
    }
    setModalOpen(false)
    onRefresh()
    toast('Account saved')
  }

  const deleteAcc = async (id) => {
    await setAccounts((await getAccounts()).filter(a => a.id !== id))
    if (activeAcc === id) onSwitch('all')
    onRefresh()
  }

  return (
    <>
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border overflow-x-auto no-scrollbar bg-bg-2">
        <span className="text-[8px] font-mono font-semibold uppercase tracking-widest text-ink-5 flex-shrink-0 mr-1">ACCT</span>

        <button onClick={() => onSwitch('all')}
          className={`flex-shrink-0 px-2.5 py-1 rounded-md border text-[9px] font-mono font-semibold uppercase tracking-wider transition-all
            ${activeAcc === 'all' ? 'bg-surface-2 border-border-3 text-ink' : 'border-border text-ink-4 hover:border-border-3'}`}>
          ALL
        </button>

        {accounts.map(acc => {
          const isAct = activeAcc === acc.id
          return (
            <button key={acc.id} onClick={() => onSwitch(acc.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9px] font-mono font-semibold uppercase tracking-wider transition-all
                ${isAct ? 'border-border-active' : 'border-border text-ink-4 hover:border-border-3'}`}
              style={isAct ? { backgroundColor: acc.color + '15', borderColor: acc.color + '50', color: acc.color } : {}}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: acc.color }} />
              {acc.name.length > 12 ? acc.name.slice(0, 10) + '..' : acc.name}
            </button>
          )
        })}

        <button onClick={() => { setForm({ id: '', name: '', startBal: '', color: COLORS[0], type: 'funded', broker: '', maxDD: '', trailingDD: false }); setModalOpen(true) }}
          className="ml-auto flex-shrink-0 text-[9px] font-mono font-semibold text-ink-5 hover:text-cyan border border-border hover:border-cyan/30 rounded-md px-2 py-1 transition-colors">
          + MANAGE
        </button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Account Manager" maxWidth="max-w-xl">
        <div className="p-4 space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center gap-3 p-3 bg-bg-3 border border-border rounded-lg">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: acc.color }} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs font-semibold text-ink">{acc.name}</div>
                <div className="text-[10px] text-ink-5">${acc.startBal?.toLocaleString()} · {acc.type || 'funded'}</div>
              </div>
              <span className={`font-mono text-xs font-semibold ${accPnl(acc.id) >= 0 ? 'text-emerald' : 'text-red'}`}>{fmtPnl(accPnl(acc.id))}</span>
              <button onClick={() => { setForm({ ...acc, startBal: String(acc.startBal), maxDD: String(acc.maxDD || '') }); setModalOpen(true) }} className="text-[9px] font-mono text-cyan border border-cyan/20 rounded px-1.5 py-0.5 hover:bg-cyan/10">EDIT</button>
              <button onClick={() => deleteAcc(acc.id)} className="text-[9px] font-mono text-red border border-red/20 rounded px-1.5 py-0.5 hover:bg-red/10">×</button>
            </div>
          ))}

          <div className="border border-dashed border-border-3 rounded-lg p-4 mt-3">
            <div className="text-[9px] font-mono font-semibold uppercase tracking-widest text-cyan mb-3">
              {form.id ? 'EDIT ACCOUNT' : 'ADD ACCOUNT'}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="label">Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="FTMO 50K" /></div>
              <div><label className="label">Starting Balance ($)</label><input className="input" type="number" value={form.startBal} onChange={e => setForm(f => ({ ...f, startBal: e.target.value }))} /></div>
              <div><label className="label">Account Type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                </select>
              </div>
              <div><label className="label">Broker / Firm</label>
                <select className="input" value={form.broker} onChange={e => setForm(f => ({ ...f, broker: e.target.value }))}>
                  <option value="">—</option>
                  {BROKERS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div><label className="label">Max Drawdown ($)</label><input className="input" type="number" value={form.maxDD} onChange={e => setForm(f => ({ ...f, maxDD: e.target.value }))} /></div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.trailingDD} onChange={e => setForm(f => ({ ...f, trailingDD: e.target.checked }))} className="accent-cyan" />
                  <span className="text-xs text-ink-3">Trailing Drawdown</span>
                </label>
              </div>
            </div>
            <div className="mb-3">
              <label className="label">Color</label>
              <div className="flex gap-2">{COLORS.map(c => (
                <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-6 h-6 rounded-md cursor-pointer transition-all ${form.color === c ? 'ring-2 ring-offset-1 ring-offset-bg ring-cyan scale-110' : 'opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: c }} />
              ))}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveAcc} className="btn-primary flex-1">Save</button>
              <button onClick={() => setForm({ id: '', name: '', startBal: '', color: COLORS[0], type: 'funded', broker: '', maxDD: '', trailingDD: false })} className="btn-secondary">Clear</button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
