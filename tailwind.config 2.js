/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // TradingView-matched dark palette
        bg:       { DEFAULT: '#131722', 2: '#161b26', 3: '#1c2030', 4: '#222738' },
        surface:  { DEFAULT: '#1a1e2e', 2: '#1e2335', 3: '#242a3c', hover: '#282f42' },
        border:   { DEFAULT: '#2a2e3e', 2: '#333848', 3: '#3e4455', active: '#4e5568' },
        ink:      { DEFAULT: '#d1d4dc', 2: '#b2b5be', 3: '#787b86', 4: '#5d606b', 5: '#434651' },
        // TradingView accent colors
        cyan:     { DEFAULT: '#2962ff', dim: '#2962ff15', mid: '#2962ff30' },
        emerald:  { DEFAULT: '#26a69a', dim: '#26a69a15', mid: '#26a69a30' },
        red:      { DEFAULT: '#ef5350', dim: '#ef535015', mid: '#ef535030' },
        amber:    { DEFAULT: '#f7c948', dim: '#f7c94815', mid: '#f7c94830' },
        purple:   { DEFAULT: '#ab47bc', dim: '#ab47bc15', mid: '#ab47bc30' },
        orange:   { DEFAULT: '#ff9800' },
        steel:    { DEFAULT: '#787b86' },
      },
      fontFamily: {
        sans:  ['-apple-system', 'BlinkMacSystemFont', '"Trebuchet MS"', 'Roboto', 'sans-serif'],
        mono:  ['"JetBrains Mono"', '"SF Mono"', '"Fira Code"', 'monospace'],
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)',
        'card-lg': '0 4px 12px rgba(0,0,0,0.5), 0 16px 48px rgba(0,0,0,0.35)',
        glow: '0 0 15px rgba(41,98,255,0.12)',
        'glow-green': '0 0 15px rgba(38,166,154,0.12)',
        'glow-red': '0 0 15px rgba(239,83,80,0.12)',
      },
      animation: {
        'fade-up': 'fadeUp 0.2s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
