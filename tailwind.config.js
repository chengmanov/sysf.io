/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{njk,md,html}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand palette from the sysf.ai identity: teal primary, muted dark-red
        // accent, cool slate neutrals. `swiss` token kept as the primary accent
        // name across templates; it now maps to the brand teal.
        swiss: {
          DEFAULT: "#3C8B96",
          600: "#2F7580",
          700: "#245D66",
        },
        accent: {
          DEFAULT: "#8B2A34",
          600: "#742229",
        },
        tealsoft: "#A5C9CE",
        ink: {
          950: "#14212A",
          900: "#1D2D36",
          800: "#284049",
          700: "#3A525C",
          500: "#5F757F",
          300: "#AEC0C7",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "system-ui",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: {
        container: "72rem",
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
    },
  },
  plugins: [],
};
