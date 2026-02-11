/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {

      // ===== ANIMACIONES GLOBALes TIPO iOS =====
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 }
        },
        pageIn: {
          "0%": { opacity: 0, transform: "scale(0.96)" },
          "100%": { opacity: 1, transform: "scale(1)" }
        },
        slideIn: {
          "0%": { opacity: 0, transform: "translateX(15px)" },
          "100%": { opacity: 1, transform: "translateX(0)" }
        },
        pop: {
          "0%": { transform: "scale(0.94)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 }
        }
      },

      animation: {
        fadeUp: "fadeUp .45s ease-out",
        fadeIn: "fadeIn .35s ease-out",
        pageIn: "pageIn .45s cubic-bezier(0.16,1,0.3,1)",
        slideIn: "slideIn .45s ease-out",
        pop: "pop .28s cubic-bezier(.18,.89,.32,1.28)"
      }

    },
  },
  plugins: [],
};
