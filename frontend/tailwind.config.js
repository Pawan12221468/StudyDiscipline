/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        sage: {
          50: '#f6f8f6',
          100: '#e8efe9',
          200: '#d2dfd4',
          300: '#acc6b0',
          400: '#81a787',
          500: '#5e8965',
          600: '#486e4e',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 2px 6px -1px rgba(15, 23, 42, 0.04), 0 1px 3px -1px rgba(15, 23, 42, 0.02)',
        // 🧸 True Claymorphism Shadows (Warm taupe-clay outer depth + dual inner highlight/shadow)
        'clay-card': '0 16px 32px rgba(95, 78, 55, 0.24), 0 4px 12px rgba(95, 78, 55, 0.16), 0 1px 3px rgba(95, 78, 55, 0.10), inset 2px 2px 5px rgba(255, 255, 255, 0.95), inset -3px -3px 7px rgba(140, 125, 105, 0.16)',
        'clay-card-hover': '0 22px 42px rgba(95, 78, 55, 0.30), 0 6px 16px rgba(95, 78, 55, 0.20), 0 1px 3px rgba(95, 78, 55, 0.12), inset 2px 2px 5px rgba(255, 255, 255, 0.98), inset -3px -3px 7px rgba(140, 125, 105, 0.20)',
        'clay-card-sm': '0 8px 18px rgba(95, 78, 55, 0.18), 0 2px 6px rgba(95, 78, 55, 0.10), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.8), inset -2px -2px 4px rgba(140, 125, 105, 0.14)',
        'clay-btn': '0 6px 14px rgba(140, 125, 105, 0.22), 0 2px 4px rgba(140, 125, 105, 0.12), inset 2px 2px 4px rgba(255, 255, 255, 0.7), inset -2px -2px 5px rgba(0, 0, 0, 0.12)',
        'clay-btn-active': '0 2px 4px rgba(140, 125, 105, 0.25), inset 3px 3px 6px rgba(0, 0, 0, 0.18), inset -2px -2px 4px rgba(255, 255, 255, 0.6)',
        'clay-inset': 'inset 4px 4px 8px rgba(140, 125, 105, 0.22), inset -4px -4px 8px rgba(255, 255, 255, 0.9)',
        'clay-dial': '0 18px 42px rgba(140, 125, 105, 0.24), 0 6px 14px rgba(140, 125, 105, 0.14), inset 4px 4px 10px rgba(255, 255, 255, 0.85), inset -4px -4px 10px rgba(140, 125, 105, 0.16)',
        'clay-pill': '0 4px 10px rgba(140, 125, 105, 0.16), 0 1px 3px rgba(140, 125, 105, 0.10), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.7), inset -1.5px -1.5px 3px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'clay-bounce': 'clayBounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }
    },
  },
  plugins: [],
}
