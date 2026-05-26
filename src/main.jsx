import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

function App() {
  const [ready, setReady] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [trades, setTrades] = React.useState([])

  React.useEffect(() => {
    try {
      // Try to load seed data
      const stored = localStorage.getItem('hos_trades')
      if (stored) {
        setTrades(JSON.parse(stored))
      } else {
        // Dynamically import seed to avoid blocking render
        import('./data/seedTrades.js').then(mod => {
          localStorage.setItem('hos_trades', JSON.stringify(mod.SEED_TRADES))
          localStorage.setItem('hos_accounts', JSON.stringify(mod.SEED_ACCOUNTS))
          localStorage.setItem('hos_seeded', '1')
          setTrades(mod.SEED_TRADES)
        }).catch(e => setError('Seed: ' + e.message))
      }
      setReady(true)
    } catch (e) {
      setError(e.message)
      setReady(true)
    }
  }, [])

  if (error) {
    return React.createElement('div', { style: { padding: 40, color: '#ef5350', fontFamily: 'monospace', fontSize: 12 } }, 
      'Error: ' + error)
  }

  if (!ready) {
    return React.createElement('div', { style: { minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontFamily: 'monospace', fontSize: 12 } }, 
      'Loading...')
  }

  // If we get here, render the full app
  return React.createElement(FullApp, { initialTrades: trades })
}

// Lazy load the full app to isolate any crashes
const FullApp = React.lazy(() => import('./App.jsx'))

function Root() {
  return React.createElement(React.Suspense, 
    { fallback: React.createElement('div', { style: { minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#26a69a', fontFamily: 'monospace' } }, 'HiddenOS...') },
    React.createElement(App)
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(Root)
)
