module.exports = {
  content: ['./public/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f7f4f1',
        ink: '#111111',
        accent: '#c1121f',
        panel: '#fffdfb',
        border: '#1f1f1f'
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        panel: '6px 6px 0 0 #111111'
      }
    }
  },
  plugins: []
};
