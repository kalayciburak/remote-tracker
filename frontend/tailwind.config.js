/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        remote: {
          bg: "hsl(var(--remote-bg))",
          fg: "hsl(var(--remote-fg))",
          line: "hsl(var(--remote-line))",
        },
        office: {
          bg: "hsl(var(--office-bg))",
          fg: "hsl(var(--office-fg))",
          line: "hsl(var(--office-line))",
        },
        deploy: {
          bg: "hsl(var(--deploy-bg))",
          fg: "hsl(var(--deploy-fg))",
          line: "hsl(var(--deploy-line))",
        },
        holiday: {
          bg: "hsl(var(--holiday-bg))",
          fg: "hsl(var(--holiday-fg))",
          line: "hsl(var(--holiday-line))",
        },
        groupA: {
          DEFAULT: "hsl(var(--group-a-fg))",
          bg: "hsl(var(--group-a-bg))",
        },
        groupB: {
          DEFAULT: "hsl(var(--group-b-fg))",
          bg: "hsl(var(--group-b-bg))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      keyframes: {
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.24s cubic-bezier(0.32, 0.72, 0, 1)",
        "slide-in": "slide-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
