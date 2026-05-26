import { SEED_ACCOUNTS, SEED_TRADES } from '../data/seedTrades'

const SEED_KEY = 'hos_seeded'

export function needsSeed() {
  return !localStorage.getItem(SEED_KEY)
}

export function runSeed() {
  if (!needsSeed()) return false
  
  // Set accounts
  localStorage.setItem('hos_accounts', JSON.stringify(SEED_ACCOUNTS))
  
  // Set trades
  localStorage.setItem('hos_trades', JSON.stringify(SEED_TRADES))
  
  // Mark as seeded
  localStorage.setItem(SEED_KEY, '1')
  
  console.log(`[HiddenOS] Seeded ${SEED_TRADES.length} trades, ${SEED_ACCOUNTS.length} accounts`)
  return true
}
