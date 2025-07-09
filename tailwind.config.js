const { heroui } = require('@heroui/theme');
const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    './node_modules/@heroui/theme/dist/components/(autocomplete|avatar|checkbox|dropdown|input|number-input|select|slider|spinner|button|ripple|form|listbox|divider|popover|scroll-shadow|menu|skeleton).js'
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',

      screens: {
        '2xl': '1400px'
      },
      maxWidth: {
        '3xl': '1600px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans]
      },
      spacing: {
        64: '64px',
        32: '32px',
        48: '48px',
        40: '40px',
        24: '24px',
        16: '16px',
        8: '8px'
      },
      fontSize: {
        14: '0.875rem',
        16: '1rem',
        18: '1.125rem',
        20: '1.25rem',
        24: '1.5rem',
        32: '2rem',
        40: '2.5rem',
        48: '3rem',
        56: '3.5rem'
      },
      colors: {
        fullwhite: '#FDFDFD',
        lightgrey: '#ECEFF5',
        smokygrey: '#CCD5DB',
        stonegrey: '#A4B4BB',
        articblue: '#58A4A7',
        darkgrey: '#26282A',
        oceanblue: '#235B68'
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      },
      borderRadius: {
        16: '1rem', // Exemple d'ajout d'un rayon de coin plus large
        12: '0.75rem', // Autre rayon personnalisé
        8: '0.5rem' // Ajout d'un petit rayon pour les coins
      }
    }
  },
  plugins: [require('tailwindcss-animate'), heroui()]
};
