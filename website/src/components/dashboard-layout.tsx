// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { Tooltip } from '@base-ui/react/tooltip'
import { Link, Outlet } from '@tanstack/react-router'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { FaChartColumn, FaGithub, FaMoon, FaSun } from 'react-icons/fa6'
import { defaultCoverageOptions } from '../data/coverage'
import {
  CUSTOM_USE_CASE_PARAM,
  decodeCustomUseCase,
  encodeCustomUseCase,
} from '../data/custom-use-case'
import type { CoverageOptions, DashboardData } from '../data/types'
import type { UseCaseRecord } from '../data/types'
import { useDashboardData } from '../data/useDashboardData'
import { ScoringMenu } from './ui'

type Theme = 'light' | 'dark'

export type DashboardOutletContext = {
  data: DashboardData
  coverageOptions: CoverageOptions
  customUseCase: UseCaseRecord | null
  setCustomUseCase: (useCase: UseCaseRecord) => void
  clearCustomUseCase: () => void
}

const DashboardContext = createContext<DashboardOutletContext | null>(null)
const CURRENT_TAXONOMY_VERSION = 'v0.3.0'
const REPOSITORY_URL = 'https://github.com/open-energy-transition/openmod-features'

export function useDashboardContext() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboardContext must be used within DashboardLayout')
  }
  return context
}

export function DashboardLayout() {
  const state = useDashboardData()
  const [coverageOptions, setCoverageOptions] = useState(defaultCoverageOptions)
  const [customUseCase, setCustomUseCaseState] = useState<UseCaseRecord | null>(null)
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const syncFromUrl = () => {
      setCustomUseCaseState(
        decodeCustomUseCase(
          new URLSearchParams(window.location.search).get(CUSTOM_USE_CASE_PARAM),
        ),
      )
    }

    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)

    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('openmod-dashboard-theme')
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme)
      return
    }

    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem('openmod-dashboard-theme', theme)
  }, [theme])

  const setCustomUseCase = (useCase: UseCaseRecord) => {
    setCustomUseCaseState(useCase)
    updateCustomUseCaseUrl(encodeCustomUseCase(useCase))
  }

  const clearCustomUseCase = () => {
    setCustomUseCaseState(null)
    updateCustomUseCaseUrl(null)
  }

  const dashboardData = useMemo(() => {
    if (state.status !== 'ready') {
      return null
    }

    if (!customUseCase) {
      return state.data
    }

    return {
      ...state.data,
      useCases: [
        customUseCase,
        ...state.data.useCases.filter((useCase) => useCase.id !== customUseCase.id),
      ],
    }
  }, [customUseCase, state])

  if (state.status === 'loading') {
    return <ShellState title="Loading dashboard data" />
  }

  if (state.status === 'error') {
    return (
      <ShellState
        title="Dashboard data could not load"
        detail={state.error.message}
      />
    )
  }

  if (!dashboardData) {
    return <ShellState title="Loading dashboard data" />
  }

  return (
    <Tooltip.Provider delay={0} closeDelay={80}>
      <main className="atlas-canvas flex min-h-screen flex-col">
        <TopBar
          customUseCase={customUseCase}
          coverageOptions={coverageOptions}
          onCoverageOptionsChange={setCoverageOptions}
          theme={theme}
          onThemeChange={setTheme}
        />
        <div className="mx-auto grid w-full max-w-[1600px] flex-1 content-start gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <DashboardContext.Provider
            value={{
              data: dashboardData,
              coverageOptions,
              customUseCase,
              setCustomUseCase,
              clearCustomUseCase,
            }}
          >
            <Outlet />
          </DashboardContext.Provider>
        </div>
        <SiteFooter data={dashboardData} />
      </main>
    </Tooltip.Provider>
  )
}

function TopBar({
  customUseCase,
  coverageOptions,
  onCoverageOptionsChange,
  theme,
  onThemeChange,
}: {
  customUseCase: UseCaseRecord | null
  coverageOptions: CoverageOptions
  onCoverageOptionsChange: (options: CoverageOptions) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
}) {
  return (
    <header className="atlas-topbar sticky top-0 z-50">
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:px-8">
        <Link to="/" className="atlas-wordmark atlas-focus inline-flex items-center gap-2 rounded-[6px] outline-none">
          <span className="atlas-wordmark-mark" aria-hidden="true">
            <FaChartColumn />
          </span>
          <span className="whitespace-nowrap text-sm font-semibold tracking-[-0.01em]">
            openmod<span className="atlas-caption font-medium">-features</span>
          </span>
        </Link>
        <div className="flex items-center justify-end gap-2 lg:order-3">
          <ScoringMenu options={coverageOptions} onChange={onCoverageOptionsChange} />
          <ThemeSwitch theme={theme} onThemeChange={onThemeChange} />
          <GithubLink />
        </div>
        <DashboardNav customUseCase={customUseCase} />
      </div>
    </header>
  )
}

function SiteFooter({ data }: { data: DashboardData }) {
  return (
    <footer className="atlas-footer">
      <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:px-8">
        <div className="max-w-sm">
          <p className="text-sm font-semibold text-[var(--atlas-ink)]">openmod-features</p>
          <p className="atlas-caption mt-2 text-xs leading-5">
            A community-maintained feature inventory for energy system modelling
            tools and planning use cases. Feature lists are maintained by tool
            developers and users; every value links to its evidence.
          </p>
        </div>
        <FooterColumn title="Explore">
          <FooterLink to="/" customUseCase={null}>Home</FooterLink>
          <FooterLink to="/tools" customUseCase={null}>Tool Matrix</FooterLink>
          <FooterLink to="/use-cases" customUseCase={null}>Use-Case Fit</FooterLink>
          <FooterLink to="/builder" customUseCase={null}>Use Case Builder</FooterLink>
        </FooterColumn>
        <FooterColumn title="Project">
          <FooterLink to="/about" customUseCase={null}>About &amp; methodology</FooterLink>
          <FooterExternalLink href={`${REPOSITORY_URL}/blob/main/CONTRIBUTING.md`}>
            Contributing
          </FooterExternalLink>
          <FooterExternalLink href={`${REPOSITORY_URL}/blob/main/GOVERNANCE.md`}>
            Governance
          </FooterExternalLink>
          <FooterExternalLink href={`${REPOSITORY_URL}/issues/new/choose`}>
            Report an issue
          </FooterExternalLink>
        </FooterColumn>
        <FooterColumn title="Data">
          <p>Taxonomy {data.taxonomyVersion || CURRENT_TAXONOMY_VERSION}</p>
          <p>Generated {new Date(data.generatedAt).toLocaleDateString()}</p>
          <p>Feature lists CC-BY-4.0 · Code MIT</p>
          <FooterExternalLink href={REPOSITORY_URL}>GitHub repository</FooterExternalLink>
        </FooterColumn>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="atlas-caption text-xs font-semibold uppercase tracking-[0.12em]">{title}</p>
      <div className="atlas-footer-links mt-3 grid gap-2 text-sm">{children}</div>
    </div>
  )
}

function FooterLink({
  to,
  customUseCase,
  children,
}: {
  to: string
  customUseCase: UseCaseRecord | null
  children: React.ReactNode
}) {
  return (
    <NavLink to={to} customUseCase={customUseCase} className="atlas-footer-link w-fit">
      {children}
    </NavLink>
  )
}

function FooterExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="atlas-footer-link w-fit">
      {children}
    </a>
  )
}

function ThemeSwitch({
  theme,
  onThemeChange,
}: {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}) {
  const dark = theme === 'dark'
  const label = dark ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <button
      type="button"
      onClick={() => onThemeChange(dark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      className="atlas-topbar-button atlas-focus grid h-9 w-9 place-items-center outline-none"
    >
      {dark ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
    </button>
  )
}

function DashboardNav({ customUseCase }: { customUseCase: UseCaseRecord | null }) {
  return (
    <nav
      aria-label="Dashboard sections"
      className="atlas-topbar-nav col-span-2 -mx-1 flex min-w-0 gap-0.5 overflow-x-auto px-1 lg:col-span-1"
    >
      <NavLink to="/" customUseCase={customUseCase} className="atlas-topbar-link">
        Home
      </NavLink>
      <NavLink to="/tools" customUseCase={customUseCase} className="atlas-topbar-link">
        Tool Matrix
      </NavLink>
      <NavLink to="/use-cases" customUseCase={customUseCase} className="atlas-topbar-link">
        Use-Case Fit
      </NavLink>
      <NavLink to="/builder" customUseCase={customUseCase} className="atlas-topbar-link">
        Use Case Builder
      </NavLink>
      <NavLink to="/about" customUseCase={customUseCase} className="atlas-topbar-link">
        About
      </NavLink>
    </nav>
  )
}

function NavLink({
  to,
  customUseCase,
  className,
  children,
}: {
  to: string
  customUseCase: UseCaseRecord | null
  className: string
  children: React.ReactNode
}) {
  const customFeatures = customUseCase ? encodeCustomUseCase(customUseCase) : null

  return (
    <Link
      to={to}
      search={
        customFeatures
          ? ({ [CUSTOM_USE_CASE_PARAM]: customFeatures } as never)
          : undefined
      }
      className={`${className} atlas-focus outline-none`}
      activeOptions={{ exact: to === '/' }}
    >
      {children}
    </Link>
  )
}

function updateCustomUseCaseUrl(encoded: string | null) {
  const url = new URL(window.location.href)

  if (encoded) {
    url.searchParams.set(CUSTOM_USE_CASE_PARAM, encoded)
  } else {
    url.searchParams.delete(CUSTOM_USE_CASE_PARAM)
  }

  window.history.replaceState(null, '', url)
}

function GithubLink() {
  return (
    <a
      href={REPOSITORY_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Open the openmod-features repository on GitHub"
      title="Open GitHub repository"
      className="atlas-topbar-button atlas-focus grid h-9 w-9 place-items-center outline-none"
    >
      <FaGithub aria-hidden="true" />
    </a>
  )
}

function ShellState({ title, detail }: { title: string; detail?: string }) {
  return (
    <main className="atlas-canvas grid place-items-center px-4 text-center">
      <div role="status" aria-live="polite">
        <h1 className="text-xl font-semibold text-[var(--atlas-ink)]">{title}</h1>
        {detail ? <p className="atlas-copy mt-2 text-sm">{detail}</p> : null}
      </div>
    </main>
  )
}
