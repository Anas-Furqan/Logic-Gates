import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        wire: {
          high: '#22c55e',
          low: '#ef4444',
          neutral: '#6b7280',
        },
        gate: {
          and: '#3b82f6',
          or: '#8b5cf6',
          not: '#f59e0b',
          xor: '#10b981',
          nand: '#ec4899',
          nor: '#f97316',
          xnor: '#06b6d4',
        },
      },
      animation: {
        'pulse-signal': 'pulse-signal 0.5s ease-in-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
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
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};
