/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Logic gate colors
        'signal-high': '#22c55e',
        'signal-low': '#ef4444',
        'signal-unknown': '#6b7280',
        'wire': '#64748b',
        // UI colors
        'surface': {
          light: '#ffffff',
          dark: '#1e293b',
        },
        'background': {
          light: '#f1f5f9',
          dark: '#0f172a',
        },
        'accent': {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-signal': 'pulse-signal 0.5s ease-in-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'pulse-signal': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'slide-up': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'gate': '0 2px 8px rgba(0, 0, 0, 0.15)',
        'panel': '0 4px 20px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
