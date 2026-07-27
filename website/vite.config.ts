import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const deployBase = normalizeDeployBase(process.env.DEPLOY_BASE)
const routerBasepath = deployBase === '/' ? undefined : deployBase.slice(0, -1)

export default defineConfig({
  base: deployBase,
  server: {
    port: 3000,
  },
  plugins: [
    tanstackStart({
      router: {
        basepath: routerBasepath,
      },
      pages: [
        { path: '/' },
        { path: '/tools' },
        { path: '/use-cases' },
        { path: '/builder' },
      ],
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
      },
      spa: {
        enabled: true,
        maskPath: '/',
        prerender: {
          outputPath: '/_shell',
        },
      },
    }),
    tailwindcss(),
    viteReact(),
  ],
})

function normalizeDeployBase(value: string | undefined) {
  if (!value) return '/'

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`

  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}
