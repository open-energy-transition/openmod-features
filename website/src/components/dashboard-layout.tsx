import { Tooltip } from '@base-ui/react/tooltip'
import { Switch } from '@base-ui/react/switch'
import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  FaClipboardCheck,
  FaFileCircleCheck,
  FaGithub,
  FaMoon,
  FaListCheck,
  FaScrewdriverWrench,
  FaSun,
} from 'react-icons/fa6'
import { defaultCoverageOptions } from '../data/coverage'
import {
  CUSTOM_USE_CASE_PARAM,
  decodeCustomUseCase,
  encodeCustomUseCase,
} from '../data/custom-use-case'
import type { CoverageOptions, DashboardData } from '../data/types'
import type { UseCaseRecord } from '../data/types'
import { useDashboardData } from '../data/useDashboardData'
import { CoverageControls } from './ui'

type Theme = 'light' | 'dark'

export type DashboardOutletContext = {
  data: DashboardData
  coverageOptions: CoverageOptions
  customUseCase: UseCaseRecord | null
  setCustomUseCase: (useCase: UseCaseRecord) => void
  clearCustomUseCase: () => void
}

const DashboardContext = createContext<DashboardOutletContext | null>(null)

export function useDashboardContext() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboardContext must be used within DashboardLayout')
  }
  return context
}

export function DashboardLayout() {
  const location = useLocation()
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
      <main className="atlas-canvas">
        <DashboardHeader
          data={dashboardData}
          theme={theme}
          onThemeChange={setTheme}
        />
        <div className="mx-auto grid max-w-[1800px] gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <DashboardNav customUseCase={customUseCase} />
            <CoverageControls options={coverageOptions} onChange={setCoverageOptions} />
          </div>
          {location.pathname === '/' ? <HomeIntro data={dashboardData} /> : null}
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
      </main>
    </Tooltip.Provider>
  )
}

function HomeIntro({ data }: { data: DashboardData }) {
  return (
    <section className="atlas-preamble grid gap-5 p-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:items-center">
      <div className="max-w-4xl">
        <p className="atlas-eyebrow">Project Preamble</p>
        <h2 className="atlas-panel-title mt-1 text-lg font-semibold sm:text-xl">
          Open energy modelling feature coverage
        </h2>
        <p className="atlas-copy mt-2 max-w-3xl text-sm leading-6">
          Explore and compare open-source energy modelling tools by capability,
          evidence, and planning use-case fit. The dashboard is generated from
          repository feature inventory files, with coverage percentages controlled
          by the rules beside the navigation.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <PreambleLink
            href="https://github.com/open-energy-transition/openmod-features#add-your-tool"
            icon={<FaScrewdriverWrench aria-hidden="true" />}
            text="Contribute or update a tool"
          />
          <PreambleLink
            href="https://github.com/open-energy-transition/openmod-features#add-a-use-case"
            icon={<FaFileCircleCheck aria-hidden="true" />}
            text="Contribute or update a use case"
          />
          <PreambleLink
            href="https://github.com/open-energy-transition/openmod-features/blob/main/GOVERNANCE.md"
            icon={<FaClipboardCheck aria-hidden="true" />}
            text="Governance"
          />
        </div>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
        <ProvenanceItem
          label="Generated"
          value={new Date(data.generatedAt).toLocaleString()}
        />
        <ProvenanceItem
          label="Inventory"
          value={`${data.tools.length} tools / ${data.useCases.length} use cases`}
        />
        <ProvenanceItem
          label="Validation"
          value="Docs + source evidence"
        />
      </dl>
    </section>
  )
}

function PreambleLink({
  href,
  icon,
  text,
}: {
  href: string
  icon: React.ReactNode
  text: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="atlas-preamble-point atlas-focus inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium outline-none"
    >
      <span className="atlas-muted">{icon}</span>
      <span>{text}</span>
    </a>
  )
}

function ProvenanceItem({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div>
      <dt className="atlas-caption text-xs font-semibold uppercase tracking-[0.12em]">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-[var(--atlas-ink)]">{value}</dd>
      {detail ? <p className="atlas-caption mt-1 text-xs leading-5">{detail}</p> : null}
    </div>
  )
}

function DashboardHeader({
  data,
  theme,
  onThemeChange,
}: {
  data: DashboardData
  theme: Theme
  onThemeChange: (theme: Theme) => void
}) {
  return (
    <header className="atlas-header">
      <div className="mx-auto grid max-w-[1800px] gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="atlas-eyebrow">
              Open Energy Modelling
            </p>
            <h1 className="atlas-title mt-1 text-2xl font-semibold sm:text-3xl">
              Tool Feature Dashboard
            </h1>
            <p className="atlas-copy mt-2 max-w-3xl text-sm leading-6">
              Compare modelling capabilities, source validation, and use-case
              fit from the repository feature inventory.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <ThemeSwitch theme={theme} onThemeChange={onThemeChange} />
            <HeaderLinks data={data} />
          </div>
        </div>
      </div>
    </header>
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

  return (
    <label
      className="atlas-theme-switch"
      data-theme-state={theme}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span className="atlas-theme-icon atlas-theme-sun" aria-hidden="true">
        <FaSun />
      </span>
      <Switch.Root
        checked={dark}
        onCheckedChange={(checked) => onThemeChange(checked ? 'dark' : 'light')}
        aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
        className="atlas-theme-track atlas-focus"
      >
        <Switch.Thumb className="atlas-theme-thumb" />
      </Switch.Root>
      <span className="atlas-theme-icon atlas-theme-moon" aria-hidden="true">
        <FaMoon />
      </span>
    </label>
  )
}

function DashboardNav({ customUseCase }: { customUseCase: UseCaseRecord | null }) {
  return (
    <nav
      aria-label="Dashboard sections"
      className="atlas-nav flex gap-1 p-1"
    >
      <NavLink to="/" customUseCase={customUseCase}>
        Overview
      </NavLink>
      <NavLink to="/tools" customUseCase={customUseCase}>
        Tool Matrix
      </NavLink>
      <NavLink to="/use-cases" customUseCase={customUseCase}>
        Use-Case Fit
      </NavLink>
      <NavLink to="/builder" customUseCase={customUseCase}>
        Use Case Builder
      </NavLink>
    </nav>
  )
}

function NavLink({
  to,
  customUseCase,
  children,
}: {
  to: string
  customUseCase: UseCaseRecord | null
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
      className="atlas-nav-link atlas-focus h-9 whitespace-nowrap rounded-[6px] px-3 text-sm font-medium leading-9 outline-none"
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

function HeaderLinks({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs text-[var(--atlas-ink-soft)] sm:flex sm:flex-wrap sm:items-center sm:justify-end">
      <DataItem
        icon={<FaScrewdriverWrench aria-hidden="true" />}
        label="Tools"
        value={data.tools.length.toString()}
      />
      <DataItem
        icon={<FaListCheck aria-hidden="true" />}
        label="Use cases"
        value={data.useCases.length.toString()}
      />
      <GithubLink />
    </div>
  )
}

function DataItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="atlas-subtle-card flex min-w-0 items-center gap-2 px-2.5 py-1.5">
      <dt className="atlas-muted">{icon}</dt>
      <dd className="flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
        <span className="truncate font-semibold tabular-nums text-[var(--atlas-ink)]">{value}</span>
        <span className="atlas-caption shrink-0">{label}</span>
      </dd>
    </div>
  )
}

function GithubLink() {
  return (
    <a
      href="https://github.com/open-energy-transition/openmod-features"
      target="_blank"
      rel="noreferrer"
      aria-label="Open the openmod-features repository on GitHub"
      title="Open GitHub repository"
      className="atlas-github-button atlas-focus inline-flex h-10 w-10 items-center justify-center rounded-[6px] text-lg outline-none"
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
