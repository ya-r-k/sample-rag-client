/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-color)',
        foreground: 'var(--fg-color)',
        primary: 'var(--primary-color)',
        'primary-foreground': 'var(--primary-foreground-color)',
        muted: 'var(--muted-color)',
        'muted-foreground': 'var(--muted-foreground-color)',
      },
    },
  },
  plugins: [],
}
