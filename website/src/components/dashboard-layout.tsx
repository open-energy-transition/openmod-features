import { Tooltip } from '@base-ui/react/tooltip'
import { Switch } from '@base-ui/react/switch'
import { Link, Outlet } from '@tanstack/react-router'
import { createContext, useContext, useState } from 'react'
import {
  FaClockRotateLeft,
  FaMoon,
  FaListCheck,
  FaScrewdriverWrench,
  FaSun,
  FaTableList,
} from 'react-icons/fa6'
import { countFeatures, defaultCoverageOptions } from '../data/coverage'
import type { CoverageOptions, DashboardData } from '../data/types'
import { useDashboardData } from '../data/useDashboardData'
import { CoverageControls } from './ui'

export type DashboardOutletContext = {
  data: DashboardData
  coverageOptions: CoverageOptions
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
  const state = useDashboardData()
  const [coverageOptions, setCoverageOptions] = useState(defaultCoverageOptions)

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

  return (
    <Tooltip.Provider>
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <DashboardHeader
          data={state.data}
          coverageOptions={coverageOptions}
          onCoverageChange={setCoverageOptions}
        />
        <div className="mx-auto grid max-w-[1800px] gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <DashboardNav />
          <DashboardContext.Provider value={{ data: state.data, coverageOptions }}>
            <Outlet />
          </DashboardContext.Provider>
        </div>
      </main>
    </Tooltip.Provider>
  )
}

function DashboardHeader({
  data,
  coverageOptions,
  onCoverageChange,
}: {
  data: DashboardData
  coverageOptions: CoverageOptions
  onCoverageChange: (options: CoverageOptions) => void
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[1800px] gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
              Open Energy Modelling
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">
              Tool Feature Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Compare modelling capabilities, source validation, and use-case
              fit from the repository feature inventory.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <ThemeSwitch />
            <DataStamp data={data} />
          </div>
        </div>
        <CoverageControls options={coverageOptions} onChange={onCoverageChange} />
      </div>
    </header>
  )
}

function ThemeSwitch() {
  const [dark, setDark] = useState(false)

  return (
    <label className="flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">
      <FaSun className="text-amber-500" aria-hidden="true" />
      <Switch.Root
        checked={dark}
        onCheckedChange={setDark}
        aria-label="Toggle dark theme"
        className="flex h-5 w-9 shrink-0 rounded-full bg-slate-300 p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-700 data-[checked]:bg-slate-800"
      >
        <Switch.Thumb className="h-4 w-4 rounded-full bg-white transition-transform data-[checked]:translate-x-4" />
      </Switch.Root>
      <FaMoon className="text-slate-500" aria-hidden="true" />
    </label>
  )
}

function DashboardNav() {
  return (
    <nav
      aria-label="Dashboard sections"
      className="flex w-fit max-w-full gap-1 overflow-x-auto border-b border-slate-200"
    >
      <NavLink to="/">Overview</NavLink>
      <NavLink to="/tools">Tool Matrix</NavLink>
      <NavLink to="/use-cases">Use-Case Fit</NavLink>
    </nav>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="h-10 whitespace-nowrap border-b-2 border-transparent px-3 text-sm font-medium leading-10 text-slate-600 outline-none hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-teal-700 [&.active]:border-teal-700 [&.active]:text-teal-800"
      activeOptions={{ exact: to === '/' }}
    >
      {children}
    </Link>
  )
}

function DataStamp({ data }: { data: DashboardData }) {
  return (
    <dl className="grid grid-cols-2 gap-2 text-xs text-slate-600 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
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
      <DataItem
        icon={<FaTableList aria-hidden="true" />}
        label="Feature rows"
        value={countFeatures(data).toString()}
      />
      <DataItem
        icon={<FaClockRotateLeft aria-hidden="true" />}
        label="Updated"
        value={new Date(data.generatedAt).toLocaleString()}
      />
    </dl>
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
    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
      <dt className="text-slate-400">{icon}</dt>
      <dd className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className="font-semibold tabular-nums text-slate-800">{value}</span>
        <span className="text-slate-500">{label}</span>
      </dd>
    </div>
  )
}

function ShellState({ title, detail }: { title: string; detail?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
      <div role="status" aria-live="polite">
        <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
        {detail ? <p className="mt-2 text-sm text-slate-600">{detail}</p> : null}
      </div>
    </main>
  )
}
