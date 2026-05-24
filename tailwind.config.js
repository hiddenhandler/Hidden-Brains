/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      { DEFAULT: '#111827', 2: '#1a2233', 3: '#1F2937', 4: '#273449' },
        surface: { DEFAULT: '#1F2937', 2: '#273449', 3: '#2d3a4f', hover: '#313d52' },
        border:  { DEFAULT: '#2d3a4f', 2: '#374357', 3: '#435064', active: '#526075' },
        ink:     { DEFAULT: '#F3F4F6', 2: '#E5E7EB', 3: '#9CA3AF', 4: '#6B7280', 5: '#4B5563' },
        // Trading colors — muted, professional
        emerald: { DEFAULT: '#3FA66B', dim: '#3FA66B12', mid: '#3FA66B25' },
        red:     { DEFAULT: '#C65B5B', dim: '#C65B5B12', mid: '#C65B5B25' },
        amber:   { DEFAULT: '#B89B72', dim: '#B89B7212', mid: '#B89B7225' },
        steel:   { DEFAULT: '#5B7FA3', dim: '#5B7FA312', mid: '#5B7FA325' },
        warn:    { DEFAULT: '#C89B3C' },
        // Accent — sand gold, used sparingly
        accent:  { DEFAULT: '#B89B72' },
      },
      fontFamily: {
        sans:    ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', '"SF Mono"', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
      },
      animation: {
        'fade-up': 'fadeUp 0.15s ease-out',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(3px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
