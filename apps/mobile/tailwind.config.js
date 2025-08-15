/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Base colors
        background: '#ffffff',
        'app-background': '#FFFCF2',
        foreground: '#171717',
        // Brand Primary - Yellow/Gold
        primary: {
          50: '#FFF8E6',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FEAD00',
          600: '#E69A00',
          700: '#CC8800',
          800: '#B37700',
          900: '#996600',
          950: '#805500',
        },
        // Brand Secondary - Orange
        secondary: {
          50: '#FFF0E6',
          100: '#FFD9B3',
          200: '#FFC380',
          300: '#FFAC4D',
          400: '#FF961A',
          500: '#D75200',
          600: '#C14A00',
          700: '#AA4100',
          800: '#943900',
          900: '#7D3000',
          950: '#662800',
        },
        // Neutral - Professional Gray
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Success - Green
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Warning - Amber
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Error - Red
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Surface colors
        surface: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
        },
        // Border colors
        border: {
          light: '#E5E5E5',
          DEFAULT: '#D4D4D4',
          strong: '#A3A3A3',
        },
        // Text color utilities
        text: {
          primary: '#171717',
          secondary: '#525252',
          tertiary: '#A3A3A3',
        },
      },
    },
  },
  plugins: [],
}