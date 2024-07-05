import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import { VitePWA } from 'vite-plugin-pwa';
import manifest from './manifest.json';


// https://vitejs.dev/config/
export default defineConfig({
  base: '/dinogame/',
  plugins: [
    glsl(),
    VitePWA({ 
      registerType: 'auto-update',
      manifest: manifest,
    })
  ],
})
