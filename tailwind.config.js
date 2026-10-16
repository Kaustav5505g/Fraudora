/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#4F46E5',
        obsidian: '#0b0f19',
        surface: '#1f2937',
        'border-soc': '#374151',
        ink: '#f9fafb',
        muted: '#9ca3af',
        'muted-dim': '#64748B',
        safe: '#059669',
        warn: '#D97706',
        crit: '#DC2626',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out forwards',
        'slide-up': 'slideUp 200ms ease-out forwards',
        'stagger-fade-in': 'staggerFadeIn 300ms ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        staggerFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
