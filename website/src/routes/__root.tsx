// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import type { ReactNode } from 'react'
import {
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { DashboardLayout } from '../components/dashboard-layout'
import appCss from '../styles.css?url'

// Public files sit under the deploy base (e.g. a GitHub Pages project path).
const publicUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content: 'Dashboard for energy system modelling tool feature coverage.',
      },
      { title: 'Openmod Features Dashboard' },
    ],
    links: [
      { rel: 'icon', href: publicUrl('favicon.svg'), type: 'image/svg+xml' },
      { rel: 'icon', href: publicUrl('favicon-32.png'), type: 'image/png', sizes: '32x32' },
      { rel: 'apple-touch-icon', href: publicUrl('apple-touch-icon.png') },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <DashboardLayout />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="root">{children}</div>
        <Scripts />
      </body>
    </html>
  )
}
