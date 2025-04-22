/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      // Tambahkan path ke semua file yang menggunakan class Tailwind
      './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    ],
    theme: {
      extend: {
        // Anda bisa kustomisasi tema di sini jika perlu
      },
    },
    plugins: [
      // Tambahkan plugin typography di sini
      require('@tailwindcss/typography'),
    ],
  };