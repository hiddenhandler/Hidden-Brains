import { useState, useEffect, useCallback } from 'react'
import { getAccounts, getActiveAcc, setActiveAcc, getTrades, getFilteredTrades } from '../lib/db'

export function useAppState() {
  const [activeAcc, setActiveAccState] = useState(getActiveAcc())
  const [accounts, setAccountsState] = useState([])
  const [trades, setTradesState] = useState([])
  const [tick, setTick] = useState(0)
  const [ready, setReady] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [accs, tds] = await Promise.all([getAccounts(), getFilteredTrades()])
      setAccountsState(accs)
      setTradesState(tds)
      setActiveAccState(getActiveAcc())
      setReady(true)
    } catch (e) {
      console.error('loadData:', e)
      setReady(true)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const refresh = useCallback(async () => {
    await loadData()
    setTick(t => t + 1)
  }, [loadData])

  const switchAccount = useCallback((id) => {
    setActiveAcc(id)
    setActiveAccState(id)
  }, [])

  return { activeAcc, accounts, trades, refresh, switchAccount, tick, ready }
}

export function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}
