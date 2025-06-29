/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2F8580',
          dark: '#286F6C',
        },
        secondary: {
          DEFAULT: '#FFFFFF',
          off: '#F7FAFC',
        },
        accent: {
          dark: '#082C38',
          tan: '#C19976',
          light: '#FCDBB4',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

