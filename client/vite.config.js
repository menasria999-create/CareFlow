import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    // هذا هو الحل الثابت: نمرر رابط الخادم الخلفي كمتغير أثناء البناء
    'import.meta.env.VITE_API_URL': JSON.stringify('https://careflow-production-3da8.up.railway.app/api')
  }
})
