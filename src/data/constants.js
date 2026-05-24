// ── SESSION & TIMING ──────────────────────────
export const SESSION_START = 7 * 60   // 7:00 AM ET
export const SESSION_END   = 12 * 60  // 12:00 PM ET

export const SESSIONS = [
  'Pre-Market (07:00–08:29)',
  'NY Open KZ (08:30–10:00)',
  'NY AM Mid (10:01–11:00)',
  'NY Late AM (11:01–12:00)',
]

// ── INSTRUMENTS ───────────────────────────────
export const INSTRUMENTS = ['US30', 'NQ', 'ES', 'Gold', 'Silver', 'BTC', 'Oil', 'EUR/USD', 'GBP/USD', 'Other']

// ── ENTRY MODELS (from your playbook) ─────────
export const ENTRY_MODELS = [
  { id: 'model1', name: 'Model 1 — Liquidity Grab + MSS', desc: 'Liq grab → MSS → FVG/OB entry. Short in premium, long in discount.' },
  { id: 'model2', name: 'Model 2 — EQH/EQL Sweep', desc: 'Equal highs/lows magnet → rejection → retrace to FVG/OB. Highest probability with both matching.' },
  { id: 'model3', name: 'Model 3 — Breaker Block (FVG+BB)', desc: 'Failed OB becomes BB → FVG lines up with BB → entry at confluence. Your favorite model.' },
  { id: 'bonus', name: 'Bonus — Mitigation Block', desc: 'Failed OB (no liq grab) → MSS → FVG+MB entry. More common than BB setups.' },
]

// ── SETUPS ─────────────────────────────────────
export const SETUPS = {
  'SMC': ['OB Retest', 'FVG Fill', 'BOS Continuation', 'CHoCH Reversal', 'Breaker Block', 'Mitigation Block'],
  'Liquidity': ['Sweep & Reverse', 'EQH/EQL Grab', 'Stop Hunt', 'PDH/PDL Run'],
  'Pattern': ['In-Out Candle', 'Engulfing', 'Pin Bar', 'Spring/Upthrust'],
}

// ── HTF / LTF ──────────────────────────────────
export const HTF_OPTIONS = ['Bullish', 'Bearish', 'Ranging', 'Unclear']
export const HTF_POI_OPTIONS = ['4H OB', '4H FVG', '1H OB', '1H FVG', 'Daily Level', 'Weekly Level', 'None']
export const LTF_OPTIONS = ['15m CHoCH', '15m BOS', '5m CHoCH', '5m BOS', '3m BOS', 'None']
export const LTF_POI_OPTIONS = ['15m OB', '15m FVG', '5m OB', '5m FVG', '3m OB', '3m FVG', 'None']
export const EXEC_3M_OPTIONS = ['Clean In-Out', 'Engulfing', 'Pin Bar', 'BOS Retest', 'FVG Fill', 'No Pattern']

// ── SMC CONFLUENCES (toggles) ──────────────────
export const SMC_TOGGLES = [
  { id: 'liquiditySweep', label: 'Liquidity Sweep' },
  { id: 'orderBlock', label: 'Order Block' },
  { id: 'fvg', label: 'FVG' },
  { id: 'bos', label: 'BOS' },
  { id: 'choch', label: 'CHoCH' },
  { id: 'smtDivergence', label: 'SMT Divergence' },
  { id: 'eqhEql', label: 'EQH/EQL' },
  { id: 'volumeConfirm', label: 'Volume Confirm' },
  { id: 'premiumDiscount', label: 'Premium/Discount' },
  { id: 'breakerBlock', label: 'Breaker Block' },
  { id: 'mitigationBlock', label: 'Mitigation Block' },
]

// ── CONDITIONS ──────────────────────────────────
export const MARKET_CONDITIONS = ['Trending', 'Ranging', 'Choppy', 'Low Volume', 'High Volatility', 'News-Driven', 'Pre-Market']
export const NEWS_CONDITIONS = ['No News', 'Pre-News (30min)', 'Post-News Reaction', 'FOMC Day', 'CPI/NFP Day', 'Low Impact', 'High Impact']
export const VOLATILITY_CONDITIONS = ['Normal', 'Low Vol', 'High Vol', 'VIX > 20', 'VIX > 25', 'VIX > 30']

// ── ENTRY / CONFIRMATION ───────────────────────
export const ENTRY_TYPES = ['Limit Order', 'Market Order', 'Stop Order', 'Scaled Entry']
export const CONFIRMATION_MODELS = ['In-Out Candle', 'Engulfing', 'Pin Bar', 'BOS Retest', 'FVG Fill', 'Spring/Upthrust', 'SMT + OB']

// ── MANAGEMENT ──────────────────────────────────
export const MANAGEMENT_OPTIONS = {
  partial: ['None', '50% at 1R', '50% at 2R', '33/33/33', 'Runner with BE'],
  trailingStop: ['None', 'Manual', 'Structure-Based', 'ATR Trail'],
  breakeven: ['Not Used', 'At 1R', 'At Entry +5pts', 'After Partial'],
}

// ── EMOTIONS ────────────────────────────────────
export const EMOTION_TAGS = [
  'Fear', 'Greed', 'Revenge', 'Hesitation', 'FOMO',
  'Confidence', 'Overconfidence', 'Anxiety', 'Calm',
  'Frustration', 'Patience', 'Discipline', 'Impulsive',
  'Focused', 'Distracted',
]

// ── GRADES ───────────────────────────────────────
export const EXECUTION_GRADES = ['A+', 'A', 'B', 'C', 'D', 'F']
export const PROCESS_GRADES   = ['A+', 'A', 'B', 'C', 'D', 'F']

// ── CHECKLIST ────────────────────────────────────
export const CHECKLIST = [
  { id: 'htf_bias', text: 'HTF bias confirmed (4H + 1H)', note: 'Both aligned, or 4H primary with 1H noting conflict' },
  { id: 'htf_poi', text: 'HTF POI identified (4H or 1H OB/FVG)', note: 'Price AT a defined institutional zone' },
  { id: 'ltf_confirm', text: 'LTF confirmation (15M CHoCH or BOS)', note: 'Structure shifting at HTF POI on 15M or 5M' },
  { id: 'setup_named', text: 'Named setup identified (from library)', note: 'Setup has a name — not "looks good"' },
  { id: 'candle_confirm', text: '3M in-out candle or pattern confirmed', note: 'Engulfing / pin bar / in-out at LTF POI' },
  { id: 'sl_structural', text: 'SL at structural level — NOT arbitrary', note: 'Behind swing, OB boundary, FVG extreme' },
  { id: 'rr_min', text: 'RR minimum 1:1.5 (calculator confirms)', note: 'No trade below 1:1.5 — walk away' },
  { id: 'risk_check', text: 'Risk ≤ 0.25% — position sized correctly', note: 'Dollar risk matches account + contract size' },
  { id: 'no_revenge', text: 'Not a revenge trade', note: 'Previous loss is not driving this entry' },
  { id: 'session_window', text: 'Within session window (07:00–12:00 ET)', note: 'No off-hours gambling' },
]

// ── SESSION EOD CHECKLIST ────────────────────────
export const SESSION_CHECKLIST = [
  { id: 'eod_journal', text: 'Journal entry written' },
  { id: 'eod_review', text: 'Reviewed all trades' },
  { id: 'eod_screenshot', text: 'Screenshots saved' },
  { id: 'eod_mistakes', text: 'Mistakes documented' },
  { id: 'eod_rules', text: 'Rules followed today?' },
  { id: 'eod_emotions', text: 'Emotional state logged' },
  { id: 'eod_plan', text: 'Tomorrow bias noted' },
  { id: 'eod_gratitude', text: 'One thing grateful for' },
]

// ── MOODS ─────────────────────────────────────────
export const MOODS = ['Focused', 'Calm', 'Confident', 'Anxious', 'Tired', 'Revenge']
export const MOOD_WARNINGS = {
  'Anxious': { type: 'warn', msg: 'Anxiety detected. Half size or sit out.' },
  'Tired': { type: 'warn', msg: 'Fatigue = poor decisions. Consider no trading.' },
  'Revenge': { type: 'error', msg: 'REVENGE MODE. DO NOT TRADE. Close charts NOW.' },
}

// ── MACRO EVENTS ──────────────────────────────────
export const MACRO_EVENTS = [
  { event: 'FOMC Decision', us30: '±500pts', nas: '±200pts', gold: '±$30', usd: '±1%', action: 'Sit out 30min post' },
  { event: 'CPI Release', us30: '±300pts', nas: '±150pts', gold: '±$20', usd: '±0.5%', action: 'Wait for reaction' },
  { event: 'NFP (Jobs)', us30: '±400pts', nas: '±180pts', gold: '±$25', usd: '±0.8%', action: 'Fade initial move' },
  { event: 'PCE Inflation', us30: '±200pts', nas: '±100pts', gold: '±$15', usd: '±0.3%', action: 'Trade post-settle' },
  { event: 'Jobless Claims', us30: '±150pts', nas: '±80pts', gold: '±$10', usd: '±0.2%', action: 'Trade if clean' },
  { event: 'GDP', us30: '±200pts', nas: '±100pts', gold: '±$12', usd: '±0.4%', action: 'Wait for direction' },
  { event: 'ISM/PMI', us30: '±150pts', nas: '±80pts', gold: '±$8', usd: '±0.2%', action: 'Trade normal' },
  { event: 'Retail Sales', us30: '±150pts', nas: '±70pts', gold: '±$8', usd: '±0.2%', action: 'Trade normal' },
]

// ── ACCOUNT CONFIG ────────────────────────────────
export const ACCOUNT_TYPES = ['Challenge', 'Funded', 'Evaluation', 'Personal', 'Sim']
export const BROKERS = ['Apex', 'Funded Hive', 'FTMO', 'TopStep', 'MyFundedFutures', 'Tradovate', 'NinjaTrader', 'Rithmic', 'Deriv', 'Pepperstone', 'Other']
