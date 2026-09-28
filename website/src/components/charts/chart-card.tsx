// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { Tabs } from '@base-ui/react/tabs'
import { Tooltip } from '@base-ui/react/tooltip'
import { Link } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
import { FaArrowRight, FaCircleInfo, FaDownload } from 'react-icons/fa6'
import { toCsv } from '../../lib/chart-utils'

export type ChartLinkTarget = {
  to: string
  search?: Record<string, string>
}

export type CsvTable = {
  filename: string
  rows: Array<Array<string | number>>
}

export function ChartCard({
  title,
  subtitle,
  info,
  link,
  csv,
  legend,
  footnote,
  compact = false,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  info?: ReactNode
  link?: ChartLinkTarget & { label: string }
  csv?: CsvTable
  legend?: ReactNode
  footnote?: ReactNode
  compact?: boolean
  children: ReactNode
}) {
  return (
    <article className="atlas-chart-card" data-compact={compact || undefined}>
      <header className="atlas-chart-card-header">
        <div className="min-w-0">
          <h3 className="atlas-chart-title flex items-center gap-1.5">
            <span className="min-w-0">{title}</span>
            {info ? <ChartInfo label={info} /> : null}
          </h3>
          {subtitle ? <p className="atlas-chart-subtitle">{subtitle}</p> : null}
        </div>
        {csv || link ? (
          <div className="flex shrink-0 items-center gap-1">
            {csv ? <CsvButton table={csv} /> : null}
            {link ? (
              <Link
                to={link.to}
                search={link.search as never}
                className="atlas-chart-action atlas-focus inline-flex h-8 items-center gap-1.5 px-2 text-xs font-semibold outline-none"
              >
                {link.label}
                <FaArrowRight aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </header>
      <div className="atlas-chart-card-body">{children}</div>
      {legend || footnote ? (
        <footer className="atlas-chart-card-footer">
          {legend}
          {footnote ? <p className="atlas-chart-footnote">{footnote}</p> : null}
        </footer>
      ) : null}
    </article>
  )
}

export function ChartLegend({
  items,
}: {
  items: Array<{ label: string; color: string }>
}) {
  return (
    <ul className="atlas-chart-legend" aria-label="Legend">
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <span
            className="atlas-chart-swatch"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

/** A legend whose entries are grouped under a heading, e.g. statuses per tool type. */
export function ChartLegendGroups({
  groups,
}: {
  groups: Array<{ label: string; items: Array<{ label: string; color: string }> }>
}) {
  return (
    <ul className="atlas-chart-legend" aria-label="Legend">
      {groups.map((group) => (
        <li key={group.label} className="atlas-chart-legend-group">
          <span className="atlas-chart-legend-group-label">{group.label}</span>
          <ul className="contents">
            {group.items.map((item) => (
              <li key={item.label} className="inline-flex items-center gap-1.5">
                <span
                  className="atlas-chart-swatch"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                {item.label}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}

export function ChartTabs({
  label,
  tabs,
  value,
  onValueChange,
}: {
  label: string
  tabs: Array<{ value: string; label: string; content: ReactNode }>
  value?: string
  onValueChange?: (value: string) => void
}) {
  return (
    <Tabs.Root
      defaultValue={value === undefined ? tabs[0]?.value : undefined}
      value={value}
      onValueChange={(next) => onValueChange?.(String(next))}
      className="grid gap-3"
    >
      <Tabs.List aria-label={label} className="atlas-chart-tabs">
        {tabs.map((tab) => (
          <Tabs.Tab
            key={tab.value}
            value={tab.value}
            className="atlas-chart-tab atlas-focus outline-none"
          >
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Panel key={tab.value} value={tab.value} className="outline-none">
          {tab.content}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  )
}

export function ChartTooltip({
  content,
  render,
  children,
}: {
  content: ReactNode
  render: ReactElement<Record<string, unknown>>
  children: ReactNode
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={render}>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6}>
          <Tooltip.Popup className="atlas-popup atlas-chart-tooltip">{content}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export function TooltipBody({
  title,
  swatch,
  rows,
}: {
  title: string
  swatch?: string
  rows: Array<[string, string]>
}) {
  return (
    <div className="grid gap-1">
      <p className="flex items-center gap-1.5 font-semibold text-[var(--atlas-ink)]">
        {swatch ? (
          <span
            className="atlas-chart-swatch"
            style={{ backgroundColor: swatch }}
            aria-hidden="true"
          />
        ) : null}
        {title}
      </p>
      <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="atlas-caption">{label}</dt>
            <dd className="text-right font-medium tabular-nums text-[var(--atlas-ink)]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ChartInfo({ label }: { label: ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={<button type="button" />}
        aria-label="About this chart"
        className="atlas-chart-info atlas-focus grid h-6 w-6 shrink-0 place-items-center rounded-[6px] outline-none"
      >
        <FaCircleInfo aria-hidden="true" />
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

function CsvButton({ table }: { table: CsvTable }) {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(table)}
      aria-label="Download chart data as CSV"
      title="Download CSV"
      className="atlas-chart-action atlas-focus grid h-8 w-8 place-items-center outline-none"
    >
      <FaDownload aria-hidden="true" />
    </button>
  )
}

function downloadCsv(table: CsvTable) {
  const blob = new Blob([`${toCsv(table.rows)}\n`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = table.filename.endsWith('.csv') ? table.filename : `${table.filename}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
