import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
import type { Plugin } from 'vite'

// Identificador desta versão publicada. Na Netlify usa o commit; no computador, a hora do build.
// O app compara este valor com /version.json para saber se saiu versão nova (UpdateWatcher.tsx).
const BUILD_ID = (process.env.COMMIT_REF || '').slice(0, 12) || String(Date.now())

function ritmoVersionFile(): Plugin {
  return {
    name: 'ritmo-version-file',
    apply: 'build',
    generateBundle() {
      // Só no build do navegador (dist/client), que a Netlify publica como arquivo estático.
      if ((this as any).environment && (this as any).environment.name !== 'client') return
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) })
    },
  }
}

const config = defineConfig({
  define: {
    __RITMO_BUILD__: JSON.stringify(BUILD_ID),
  },
  plugins: [
    ritmoVersionFile(),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    // O projeto não usa Edge Functions; desligar a emulação local evita o erro do Deno
    // ("unexpected argument '--allow-scripts'") que derrubava o `npm run dev`. Não afeta o deploy.
    netlify({ dev: { edgeFunctions: { enabled: false } } }),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
