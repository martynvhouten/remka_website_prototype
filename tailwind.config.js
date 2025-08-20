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
        // brand palette
        brand: '#9E0059',
        accent: '#F77F00',
        teal: '#00A99D',
        dark: '#333333',
        light: '#E6E6E6',
        // service tier accents
        tier: {
          bronze: '#b7792b',
          silver: '#9aa0a6',
          gold: '#c28e00',
          platinum: '#8e9aa6'
        }
      },
      spacing: {
        // custom steps occasionally used in designs
        '1.5': '0.375rem',
        '2.5': '0.625rem',
        '3.5': '0.875rem',
        '4.5': '1.125rem'
      },
      fontSize: {
        // semantic sizes used in content defaults
        copy: ['1.0625rem', { lineHeight: '1.7' }],
        subheading: ['1.25rem', { lineHeight: '1.5' }]
      },
      borderRadius: {
        brand: '0.5rem', // matches --radius
        mdplus: '0.625rem',
        xlplus: '0.9rem'
      },
      boxShadow: {
        card: '0 2px 10px rgba(0,0,0,0.04)',
        lift: '0 12px 28px rgba(0,0,0,0.12)'
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


