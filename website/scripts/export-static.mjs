// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const websiteDir = path.resolve(currentDir, '..')
const clientDir = path.join(websiteDir, 'dist', 'client')
const serverEntry = path.join(websiteDir, 'dist', 'server', 'server.js')
const deployBase = normalizeDeployBase(process.env.DEPLOY_BASE)

const prerenderRoutes = [
  { path: '/', output: 'index.html' },
  { path: '/tools', output: path.join('tools', 'index.html') },
  { path: '/use-cases', output: path.join('use-cases', 'index.html') },
  { path: '/builder', output: path.join('builder', 'index.html') },
]

const serverModule = await import(pathToFileURL(serverEntry).href)
const server = serverModule.default

if (!server?.fetch) {
  throw new Error(`Expected fetch export from ${serverEntry}`)
}

for (const route of prerenderRoutes) {
  await renderHtml({
    pathname: route.path,
    output: route.output,
  })
}

await renderHtml({
  pathname: '/',
  output: '_shell.html',
  headers: { 'X-TSS_SHELL': 'true' },
})

await copyShellTo404()

async function renderHtml({ pathname, output, headers = {} }) {
  const response = await server.fetch(
    new Request(new URL(withDeployBase(pathname), 'http://localhost'), {
      headers,
    }),
  )

  if (!response.ok) {
    throw new Error(`Failed to prerender ${pathname}: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('text/html')) {
    throw new Error(`Expected HTML for ${pathname}, received ${contentType}`)
  }

  const html = sanitizeHtml(await response.text())
  const outputPath = path.join(clientDir, output)

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, html)

  console.log(`export:static ${pathname} -> ${path.relative(clientDir, outputPath)}`)
}

async function copyShellTo404() {
  const shellPath = path.join(clientDir, '_shell.html')
  const html = await readFile(shellPath, 'utf8')

  await writeFile(shellPath, html)
  await writeFile(path.join(clientDir, '404.html'), html)

  console.log('export:static / -> 404.html')
}

function sanitizeHtml(html) {
  return injectIndexHtmlCanonicalizer(html).replaceAll('\0', '\\u0000')
}

function injectIndexHtmlCanonicalizer(html) {
  const script = `<script>(function(){var p=window.location.pathname;if(p.endsWith('/index.html')){window.history.replaceState(null,'',p.slice(0,-10)+window.location.search+window.location.hash)}})();</script>`

  return html.replace('</head>', `${script}</head>`)
}

function withDeployBase(pathname) {
  if (deployBase === '/') return pathname

  const base = deployBase.slice(0, -1)
  const suffix = pathname === '/' ? '/' : pathname

  return `${base}${suffix}`
}

function normalizeDeployBase(value) {
  if (!value) return '/'

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`

  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}
