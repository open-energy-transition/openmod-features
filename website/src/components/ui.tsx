import { Checkbox } from '@base-ui/react/checkbox'
import { Switch } from '@base-ui/react/switch'
import { Tooltip } from '@base-ui/react/tooltip'
import type { ReactNode } from 'react'
import {
  FaArrowUpRightFromSquare,
  FaCheck,
  FaCircleQuestion,
  FaCodeBranch,
  FaCircleInfo,
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
    <label className="group flex min-w-0 items-start gap-3 rounded-[6px] px-2 py-1.5 hover:bg-[var(--atlas-hydro-wash)]">
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 flex h-5 w-9 shrink-0 rounded-full bg-[var(--atlas-line-strong)] p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--atlas-hydro)] data-[checked]:bg-[var(--atlas-hydro)]"
      >
        <Switch.Thumb className="h-4 w-4 rounded-full bg-white transition-transform data-[checked]:translate-x-4" />
      </Switch.Root>
      <span className="grid gap-0.5">
        <span className="text-sm font-medium text-[var(--atlas-ink)]">{label}</span>
        <span className="atlas-caption text-xs leading-5">{description}</span>
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
    <label className="atlas-secondary-button flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
      <Checkbox.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="grid h-4 w-4 shrink-0 place-items-center rounded border border-[var(--atlas-line-strong)] text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-hydro)] data-[checked]:border-[var(--atlas-hydro)] data-[checked]:bg-[var(--atlas-hydro)]"
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
        className="cursor-help text-left underline decoration-[rgb(13_118_111_/_0.28)] decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--atlas-hydro)]"
      >
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8}>
          <Tooltip.Popup className="atlas-popup max-w-sm px-3 py-2 text-xs leading-5">
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
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--atlas-ink-soft)]">
      <LegendItem value="y" sourced label="Implemented" />
      <LegendItem value="y" sourced={false} label="Implemented, unvalidated" />
      <LegendItem value="dev" sourced label="In development" />
      <LegendItem value="n" sourced label="Missing" />
      <span className="inline-flex items-center gap-1.5">
        <FaMinus className="atlas-muted" aria-hidden="true" />
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
      <span className="inline-flex min-w-16 justify-center rounded bg-[var(--atlas-surface-inset)] px-2 py-1 text-xs font-semibold text-[var(--atlas-ink-muted)]">
        N/A
      </span>
    )
  }

  return (
    <span
      className="inline-flex min-w-16 justify-center rounded px-2 py-1 text-xs font-semibold text-[var(--atlas-badge-ink)] shadow-[inset_0_0_0_1px_rgb(22_37_32_/_0.08)]"
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
      className="atlas-secondary-button atlas-focus inline-flex h-9 w-9 items-center justify-center"
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
      className="atlas-reference-link atlas-focus inline-flex items-center gap-1 px-0.5 text-xs font-medium focus-visible:outline-none"
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
      <span className="font-medium text-[var(--atlas-ink)]">
        {compact ? tool.shortname : tool.name}
      </span>
      <span className="atlas-caption max-w-44 truncate text-xs">
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
      className="atlas-rule-switcher flex max-w-full flex-wrap items-center gap-2 p-1.5"
    >
      <h2
        id="coverage-options"
        className="atlas-rule-label whitespace-nowrap px-1.5 text-xs font-semibold uppercase tracking-[0.12em]"
      >
        Coverage Rules
      </h2>
      <CoverageRuleSwitch
        label="Unvalidated"
        checked={options.countUnsourced}
        onCheckedChange={(checked) => onChange({ ...options, countUnsourced: checked })}
        description="Include implemented values without source links."
      />
      <CoverageRuleSwitch
        label="In development"
        checked={options.countDev}
        onCheckedChange={(checked) => onChange({ ...options, countDev: checked })}
        description="Treat development status as meeting a requirement."
      />
    </section>
  )
}

function CoverageRuleSwitch({
  label,
  checked,
  onCheckedChange,
  description,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  description: string
}) {
  const descriptionId = `coverage-rule-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="flex items-center gap-1">
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-describedby={descriptionId}
        className="atlas-rule-switch atlas-focus inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-[6px] px-2.5 text-sm font-medium outline-none"
      >
        <span className="atlas-rule-track">
          <Switch.Thumb className="atlas-rule-thumb" />
        </span>
        <span>{label}</span>
        <span id={descriptionId} className="sr-only">
          {description}
        </span>
      </Switch.Root>
      <Tooltip.Root>
        <Tooltip.Trigger
          render={<button type="button" />}
          aria-label={`${label} coverage rule detail`}
          className="atlas-rule-info atlas-focus grid h-8 w-8 place-items-center rounded-[6px] outline-none"
        >
          <FaCircleInfo aria-hidden="true" />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className="atlas-popup max-w-xs px-3 py-2 text-xs leading-5">
              {description}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
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
