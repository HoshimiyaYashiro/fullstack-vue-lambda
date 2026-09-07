import { dirname, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig, type PluginOption } from 'vite';
import Layouts from 'vite-plugin-vue-layouts-next';
import VueMacros from 'vue-macros/vite';
import VueRouter from 'vue-router/vite';

export default defineConfig({
  plugins: [
    UnoCSS(),
    VueRouter({
      routesFolder: 'src/pages',
      dts: 'src/typed-router.d.ts',
    }) as unknown as PluginOption,
    Layouts(),
    VueI18nPlugin({
      include: resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**'),
    }),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', '@vueuse/core', 'vue-i18n'],
      dts: 'src/auto-imports.d.ts',
      dirs: ['./src/composables/**', './src/stores/**', './src/features/**/queries/**'],
      vueTemplate: true,
    }),
    Components({
      resolvers: [
        NaiveUiResolver(),
        (name) => {
          if (name.startsWith('App')) {
            return { name, from: '@repo/ui' };
          }
        },
      ],
      dts: 'src/components.d.ts',
      globs: ['src/components/**/*.vue', 'src/features/**/components/**/*.vue'],
    }),
    VueMacros({
      plugins: {
        vue: vue(),
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  esbuild: {
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
