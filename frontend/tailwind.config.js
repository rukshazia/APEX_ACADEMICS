/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#26364A', // Deep muted navy
          800: '#34465A', // Slate navy
          700: '#45586E',
          600: '#566B83',
        },
        brand: {
          blue: '#647F9E', // Muted blue
          sage: '#8CA398', // Muted sage
          dusty: '#91A6BA', // Dusty blue
          taupe: '#B7A99A', // Soft taupe
        },
        bg: {
          main: '#F5F5F2', // Main background
          secondary: '#EEEFEB', // Secondary background
          card: '#FFFFFF', // Card background
          highlight: '#F0F2F1', // Subtle highlighted background
        },
        txt: {
          primary: '#303A46', // Primary text
          secondary: '#68727D', // Secondary text
          muted: '#89919A', // Muted text
        },
        brd: {
          DEFAULT: '#E1E4E2', // Default border
          subtle: '#EAEBE8', // Subtle border
        },
        status: {
          success: '#648773',
          warning: '#B69A65',
          danger: '#B87575',
          info: '#718CA5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(38, 54, 74, 0.05), 0 1px 2px 0 rgba(38, 54, 74, 0.03)',
        card: '0 2px 6px -1px rgba(38, 54, 74, 0.06), 0 2px 4px -2px rgba(38, 54, 74, 0.04)',
      }
    },
  },
  plugins: [],
}
