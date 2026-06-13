/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {

      // ===== ANIMACIONES CUSTOM =====
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 }
        },
        pageIn: {
          "0%": { opacity: 0, transform: "scale(0.97)" },
          "100%": { opacity: 1, transform: "scale(1)" }
        },
        slideIn: {
          "0%": { opacity: 0, transform: "translateX(15px)" },
          "100%": { opacity: 1, transform: "translateX(0)" }
        },
        pop: {
          "0%": { transform: "scale(0.94)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },

      animation: {
        fadeUp: "fadeUp .5s ease-out both",
        fadeIn: "fadeIn .4s ease-out both",
        pageIn: "pageIn .5s cubic-bezier(0.16,1,0.3,1)",
        slideIn: "slideIn .45s ease-out both",
        pop: "pop .3s cubic-bezier(.18,.89,.32,1.28) both",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite"
      },

      // ===== SCREENS =====
      screens: {
        'xs': '475px',
      },

      // ===== CUSTOM COLORS & FONT =====
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        }
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
      },

    },
  },
  plugins: [],
};
