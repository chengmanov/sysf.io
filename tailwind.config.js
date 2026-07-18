/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{njk,md,html}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // sysf.ai Design System — palette sampled from the branding proposal.
        // Swiss red = primary/brand accent; teal = secondary/supporting; warm neutrals.
        red: {
          50: "#fdf1f2", 100: "#f9e1e3", 200: "#f2c3c7", 400: "#e0525d",
          500: "#c81e2d", 600: "#b4232f", 700: "#8d2d39", 800: "#7a232e",
        },
        teal: {
          50: "#eaf2f0", 100: "#d3e3e1", 200: "#b1cecc", 300: "#93babc",
          400: "#6e9ba0", 500: "#5a8288", 600: "#466e78", 700: "#3c626b",
        },
        ink: {
          950: "#1b242c", 900: "#2d3945", 800: "#34505b", 700: "#3f5f6b",
          // warm muted greys for secondary/subtle text
          500: "#847e70", 300: "#a8a294",
        },
        neutral: {
          0: "#ffffff", 25: "#faf9f6", 50: "#f5f3ee", 100: "#eeebe4",
          200: "#e2ded4", 300: "#cec9bd", 400: "#a8a294", 500: "#847e70",
          600: "#605b50", 700: "#464239", 800: "#2f2c26", 900: "#1e1c18",
        },
        // Alias kept so existing `*-swiss` accent classes now resolve to brand teal.
        swiss: { DEFAULT: "#466e78", 600: "#3c626b", 700: "#34555d" },
      },
      fontFamily: {
        sans: ["'Nunito Sans'", "'Segoe UI'", "system-ui", "-apple-system", "sans-serif"],
        display: ["'Nunito Sans'", "'Segoe UI'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "'SF Mono'", "Menlo", "monospace"],
      },
      borderRadius: {
        DEFAULT: "10px", sm: "6px", md: "10px", lg: "14px", xl: "20px", "2xl": "28px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(29,36,44,0.06)",
        sm: "0 1px 3px rgba(29,36,44,0.08),0 1px 2px rgba(29,36,44,0.05)",
        md: "0 4px 12px rgba(29,36,44,0.09),0 2px 4px rgba(29,36,44,0.05)",
        lg: "0 12px 28px rgba(29,36,44,0.12),0 4px 8px rgba(29,36,44,0.06)",
        xl: "0 24px 56px rgba(29,36,44,0.16),0 8px 16px rgba(29,36,44,0.08)",
      },
      maxWidth: { container: "1200px" },
      letterSpacing: { tightest: "-0.03em" },
    },
  },
  plugins: [],
};
