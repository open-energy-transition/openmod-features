import type { ReactNode } from 'react'
import {
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { DashboardLayout } from '../components/dashboard-layout'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content: 'Dashboard for open energy modelling tool feature coverage.',
      },
      { title: 'Openmod Features Dashboard' },
    ],
    links: [
      { rel: 'icon', href: 'data:,' },
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
