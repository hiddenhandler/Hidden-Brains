/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      { DEFAULT: '#0d0d0d', 2: '#111111', 3: '#171717', 4: '#1e1e1e' },
        surface: { DEFAULT: '#141414', 2: '#1a1a1a', 3: '#222222', hover: '#252525' },
        border:  { DEFAULT: '#222222', 2: '#2a2a2a', 3: '#333333', active: '#444444' },
        ink:     { DEFAULT: '#e8e8e8', 2: '#cccccc', 3: '#888888', 4: '#666666', 5: '#444444' },
        emerald: { DEFAULT: '#26a69a' },
        red:     { DEFAULT: '#ef5350' },
        amber:   { DEFAULT: '#b89b72' },
        accent:  { DEFAULT: '#26a69a' },
        steel:   { DEFAULT: '#5b7fa3' },
        warn:    { DEFAULT: '#c89b3c' },
      },
      fontFamily: {
        sans:  ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        mono:  ['"IBM Plex Mono"', '"SF Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
