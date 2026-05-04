import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo_custom.png'],
      manifest: {
        name: 'QuickPDF Mobile Scanner',
        short_name: 'QuickPDF',
        description: 'Turn photos into clean PDFs in seconds.',
        theme_color: '#6366f1',
        background_color: '#020617',
        display: 'standalone',
        icons: [
          {
            src: '/logo_custom.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true
  }
})
