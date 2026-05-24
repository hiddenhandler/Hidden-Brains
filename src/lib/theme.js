const THEMES = {
  slate: {
    name: 'Institutional Slate',
    bg: '#111827', bg2: '#1a2233', bg3: '#1F2937', bg4: '#273449',
    surface: '#1F2937', surface2: '#273449',
    border: '#2d3a4f', border2: '#374357',
    ink: '#F3F4F6', ink2: '#E5E7EB', ink3: '#9CA3AF', ink4: '#6B7280', ink5: '#4B5563',
    emerald: '#3FA66B', red: '#C65B5B', accent: '#B89B72', steel: '#5B7FA3', warn: '#C89B3C',
  },
  sand: {
    name: 'Black & Sand',
    bg: '#0D0D0D', bg2: '#131313', bg3: '#171717', bg4: '#1e1e1e',
    surface: '#171717', surface2: '#1e1e1e',
    border: '#2a2a2a', border2: '#333333',
    ink: '#EAE7E1', ink2: '#D4D0C8', ink3: '#A8A29E', ink4: '#787470', ink5: '#5c5856',
    emerald: '#5D8A66', red: '#A35D5D', accent: '#B89B72', steel: '#8A9BAA', warn: '#C89B3C',
  },
  military: {
    name: 'Military Analyst',
    bg: '#101512', bg2: '#151a16', bg3: '#1B221D', bg4: '#232b25',
    surface: '#1B221D', surface2: '#232b25',
    border: '#2d362f', border2: '#3a4440',
    ink: '#D6D8D2', ink2: '#C4C7C0', ink3: '#9CA39A', ink4: '#6B7268', ink5: '#4B524A',
    emerald: '#4F8A5B', red: '#A35B5B', accent: '#5F6B4D', steel: '#7A8B7E', warn: '#B89B3C',
  },
  paper: {
    name: 'Paper & Ink',
    bg: '#F5F3EF', bg2: '#EDEBE5', bg3: '#FFFFFF', bg4: '#F0EDE8',
    surface: '#FFFFFF', surface2: '#F0EDE8',
    border: '#D4D0C8', border2: '#C4C0B8',
    ink: '#1F2937', ink2: '#374151', ink3: '#6B7280', ink4: '#9CA3AF', ink5: '#D1D5DB',
    emerald: '#4E8D72', red: '#B85C5C', accent: '#30475E', steel: '#5B7FA3', warn: '#B8883C',
  },
}

export function getTheme() {
  return localStorage.getItem('hos_theme') || 'slate'
}

export function setTheme(id) {
  localStorage.setItem('hos_theme', id)
  applyTheme(id)
}

export function applyTheme(id) {
  const t = THEMES[id] || THEMES.slate
  const root = document.documentElement
  Object.entries({
    '--c-bg': t.bg, '--c-bg2': t.bg2, '--c-bg3': t.bg3, '--c-bg4': t.bg4,
    '--c-surface': t.surface, '--c-surface2': t.surface2,
    '--c-border': t.border, '--c-border2': t.border2,
    '--c-ink': t.ink, '--c-ink2': t.ink2, '--c-ink3': t.ink3, '--c-ink4': t.ink4, '--c-ink5': t.ink5,
    '--c-emerald': t.emerald, '--c-red': t.red, '--c-accent': t.accent, '--c-steel': t.steel, '--c-warn': t.warn,
  }).forEach(([k, v]) => root.style.setProperty(k, v))

  // Handle light/dark color-scheme
  root.style.colorScheme = id === 'paper' ? 'light' : 'dark'
}

export function getThemeList() {
  return Object.entries(THEMES).map(([id, t]) => ({ id, name: t.name }))
}

// Apply on load
applyTheme(getTheme())
