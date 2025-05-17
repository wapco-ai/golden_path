import { defineConfig } from 'vite';  
import react from '@vitejs/plugin-react';  
import { VitePWA } from 'vite-plugin-pwa';  

export default defineConfig({  
  //base: process.env.BASE_URL || '/',  
  base: '/golden_path/',
  // Add this for PWA  
  publicDir: 'public',  
  //base: './', // This helps with relative paths in the production build
  plugins: [  
    react(),  
    VitePWA({  
      registerType: 'autoUpdate',  
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],  
      manifest: {  
        name: 'GPS Validity',  
        short_name: 'GPSValid',  
        description: 'اپلیکیشن GPS Validity برای ردیابی موقعیت با دقت بالا',  
        theme_color: '#ffffff',  
        background_color: '#f0f2f5',  
        display: 'standalone',  
        scope: './',  
        start_url: '/golden_path/',  
        icons: [  
          {  
            src: '/icons/pwa-192x192.png',  
            sizes: '192x192',  
            type: 'image/png'  
          },  
          {  
            src: '/icons/pwa-512x512.png',  
            sizes: '512x512',  
            type: 'image/png'  
          },  
          {  
            src: '/icons/pwa-512x512.png',  
            sizes: '512x512',  
            type: 'image/png',  
            purpose: 'maskable'  
          }  
        ]  
      },  
      workbox: {  
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],  
        runtimeCaching: [  
          {  
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/,   
            handler: 'CacheFirst',  
            options: {  
              cacheName: 'mapbox-cache',  
              expiration: {  
                maxEntries: 50,  
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 روز  
              }  
            }  
          },  
          {  
            urlPattern: /^https:\/\/unpkg\.com\/.*/,   
            handler: 'CacheFirst',  
            options: {  
              cacheName: 'unpkg-cache',  
              expiration: {  
                maxEntries: 10,  
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 روز  
              }  
            }  
          },  
          {  
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),  
            handler: 'NetworkFirst',  
            options: {  
              cacheName: 'api-cache',  
              expiration: {  
                maxEntries: 100,  
                maxAgeSeconds: 60 * 60 * 24 // 1 روز  
              },  
              networkTimeoutSeconds: 10  
            }  
          }  
        ]  
      }  
    })  
  ]  
});  