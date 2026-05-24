// Theme system — stores preference, applies data-theme attribute
const THEMES = [
  { id: 'slate', name: 'Institutional Slate' },
  { id: 'sand', name: 'Black & Sand' },
  { id: 'military', name: 'Military Analyst' },
  { id: 'paper', name: 'Paper & Ink' },
]

export function getTheme() {
  return localStorage.getItem('hos_theme') || 'slate'
}

export function setTheme(id) {
  localStorage.setItem('hos_theme', id)
  // For now just store — full CSS variable theming in next version
}

export function getThemeList() {
  return THEMES
}
