import { Checkbox } from '@base-ui/react/checkbox'
import { Switch } from '@base-ui/react/switch'
import { Tooltip } from '@base-ui/react/tooltip'
import type { ReactNode } from 'react'
import {
  FaArrowUpRightFromSquare,
  FaCheck,
  FaCircleQuestion,
  FaCodeBranch,
  FaMinus,
  FaXmark,
} from 'react-icons/fa6'
import type {
  CoverageOptions,
  CoverageResult,
  FeatureValue,
  ToolRecord,
} from '../data/types'
import { coverageColor } from '../lib/dashboard-utils'

export function Toggle({
  checked,
  onCheckedChange,
  label,
  description,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  description: string
}) {
  return (
    <label className="group flex min-w-0 items-start gap-3 rounded-md px-2 py-1.5 hover:bg-slate-100">
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 flex h-5 w-9 shrink-0 rounded-full bg-slate-300 p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-700 data-[checked]:bg-teal-700"
      >
        <Switch.Thumb className="h-4 w-4 rounded-full bg-white transition-transform data-[checked]:translate-x-4" />
      </Switch.Root>
      <span className="grid gap-0.5">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        <span className="text-xs leading-5 text-slate-500">{description}</span>
      </span>
    </label>
  )
}

export function CheckPill({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50">
      <Checkbox.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="grid h-4 w-4 shrink-0 place-items-center rounded border border-slate-400 text-white outline-none focus-visible:ring-2 focus-visible:ring-teal-700 data-[checked]:border-teal-700 data-[checked]:bg-teal-700"
      >
        <Checkbox.Indicator>
          <FaCheck className="text-[10px]" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <span className="min-w-0 truncate">{children}</span>
    </label>
  )
}

export function Hint({
  label,
  children,
}: {
  label?: string
  children: ReactNode
}) {
  if (!label) {
    return <>{children}</>
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={<span />}
        className="cursor-help text-left underline decoration-slate-300 decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
      >
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8}>
          <Tooltip.Popup className="max-w-sm rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs leading-5 text-white shadow-lg">
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export function StatusIcon({
  value,
  sourced,
  muted = false,
}: {
  value: FeatureValue
  sourced: boolean
  muted?: boolean
}) {
  const color = muted
    ? 'text-slate-400'
    : value === 'y' && sourced
      ? 'text-emerald-700'
      : value === 'y'
        ? 'text-amber-600'
        : value === 'dev'
          ? 'text-blue-700'
          : value === 'n'
            ? 'text-rose-700'
            : 'text-slate-400'

  const Icon =
    value === 'y'
      ? FaCheck
      : value === 'dev'
        ? FaCodeBranch
        : value === 'n'
          ? FaXmark
          : FaCircleQuestion

  return (
    <span className="inline-flex items-center justify-center">
      <Icon className={`text-base ${color}`} aria-hidden="true" />
      <span className="sr-only">{statusLabel(value, sourced)}</span>
    </span>
  )
}

export function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
      <LegendItem value="y" sourced label="Implemented" />
      <LegendItem value="y" sourced={false} label="Implemented, unvalidated" />
      <LegendItem value="dev" sourced label="In development" />
      <LegendItem value="n" sourced label="Missing" />
      <span className="inline-flex items-center gap-1.5">
        <FaMinus className="text-slate-400" aria-hidden="true" />
        Not required
      </span>
    </div>
  )
}

function LegendItem({
  value,
  sourced,
  label,
}: {
  value: FeatureValue
  sourced: boolean
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusIcon value={value} sourced={sourced} />
      {label}
    </span>
  )
}

export function CoverageBadge({ coverage }: { coverage: CoverageResult }) {
  if (coverage.percentage === null) {
    return (
      <span className="inline-flex min-w-16 justify-center rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
        N/A
      </span>
    )
  }

  return (
    <span
      className="inline-flex min-w-16 justify-center rounded px-2 py-1 text-xs font-semibold text-slate-950"
      style={{ backgroundColor: coverageColor(coverage.percentage) }}
    >
      {Math.round(coverage.percentage)}%
    </span>
  )
}

export function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
    >
      {children}
    </button>
  )
}

export function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
    >
      {label}
      <FaArrowUpRightFromSquare className="text-[10px]" aria-hidden="true" />
    </a>
  )
}

export function ToolName({
  tool,
  compact = false,
}: {
  tool: ToolRecord
  compact?: boolean
}) {
  return (
    <div className={compact ? 'grid justify-items-center gap-1' : 'grid gap-1'}>
      <span className="font-medium text-slate-900">
        {compact ? tool.shortname : tool.name}
      </span>
      <span className="max-w-44 truncate text-xs text-slate-500">
        {compact ? tool.name : tool.shortname}
      </span>
      {(tool.docs || tool.source) && compact ? (
        <div className="flex gap-2">
          {tool.docs ? <ExternalLink href={tool.docs} label="Docs" /> : null}
          {tool.source ? <ExternalLink href={tool.source} label="Source" /> : null}
        </div>
      ) : null}
    </div>
  )
}

export function CoverageControls({
  options,
  onChange,
}: {
  options: CoverageOptions
  onChange: (options: CoverageOptions) => void
}) {
  return (
    <section
      aria-labelledby="coverage-options"
      className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)]"
    >
      <div>
        <h2
          id="coverage-options"
          className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
        >
          Coverage Rules
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Percentages update across every view.
        </p>
      </div>
      <Toggle
        checked={options.countUnsourced}
        onCheckedChange={(checked) =>
          onChange({ ...options, countUnsourced: checked })
        }
        label="Count unvalidated"
        description="Include implemented values without source links."
      />
      <Toggle
        checked={options.countDev}
        onCheckedChange={(checked) => onChange({ ...options, countDev: checked })}
        label="Count in development"
        description="Treat development status as meeting a requirement."
      />
    </section>
  )
}

function statusLabel(value: FeatureValue, sourced: boolean) {
  if (value === 'y') {
    return sourced ? 'Implemented with source' : 'Implemented without source'
  }
  if (value === 'dev') {
    return 'In development'
  }
  if (value === 'n') {
    return 'Missing'
  }
  return 'Unknown'
}
