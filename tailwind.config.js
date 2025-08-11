/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './partials/**/*.html',
    './components/**/*.html',
    './assets/js/**/*.js',
    './**/*.phtml'
  ],
  theme: {
    extend: {
      colors: {
        brand: '#9E0059',
        accent: '#F77F00',
        teal: '#00A99D',
        dark: '#333333',
        light: '#E6E6E6'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      zIndex: {
        header: '70',
        mega: '65',
        overlay: '60'
      }
    }
  },
  corePlugins: {
    preflight: true
  }
};


