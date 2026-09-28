// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ChartCard, ChartLegend, ChartTabs, TooltipBody } from '../charts/chart-card'
import { ColumnChart, StackedColumnChart } from '../charts/column-chart'
import { Heatmap, HeatmapScale } from '../charts/heatmap'
import { ScatterChart } from '../charts/scatter-chart'
import { ExternalLink } from '../ui'
import type { StatusBreakdown, ToolRecord } from '../../data/types'
import {
  median,
  paretoFrontier,
  percentDomain,
  toolTypeColor,
  toolTypeLabel,
  toolTypeLegend,
} from '../../lib/chart-utils'
import { formatPercent, scoringNote, sentenceCase } from './home-data'
import type { HomeData, UseCaseSummary } from './home-data'
import { HomeSection, scoreCsv, toolScoreColumns } from './shared'

const unvalidatedSeries = {
  key: 'unvalidated',
  label: 'Implemented, unvalidated',
  color: 'var(--chart-status-unsourced)',
}
const devSeries = { key: 'dev', label: 'In development', color: 'var(--chart-status-dev)' }

export function CoverageSection({ home }: { home: HomeData }) {
  const anyUnvalidated = home.tools.some(({ breakdown }) => breakdown.unsourced > 0)
  const anyDev = home.tools.some(({ breakdown }) => breakdown.dev > 0)
  // The validated segment takes each tool's type colour; the legend lists only statuses present.
  const series = [
    { key: 'validated', label: 'Implemented, validated', color: 'var(--chart-open-source)' },
    unvalidatedSeries,
    devSeries,
  ]
  const legend = [
    ...toolTypeLegend,
    ...(anyUnvalidated ? [unvalidatedSeries] : []),
    ...(anyDev ? [devSeries] : []),
  ]

  return (
    <HomeSection
      id="coverage"
      title="Feature coverage"
      description={`How much of the ${home.data.taxonomyVersion} feature taxonomy each tool implements, across ${home.data.taxonomy.length} categories.`}
    >
      <ChartCard
        title="Feature coverage"
        subtitle={`Share of all ${home.featureCount} taxonomy features, by status`}
        direction="higher"
        info="Each column stacks a tool's validated features (coloured by tool type), then any unvalidated or in-development features. The label is the tool's coverage score under the active scoring rules."
        link={{ to: '/tools', label: 'Tool matrix' }}
        csv={{
          filename: 'feature-coverage',
          rows: [
            ['tool', 'open_source', 'score_percent', 'implemented_validated', 'implemented_unvalidated', 'in_development', 'missing', 'unknown', 'total'],
            ...home.tools.map(({ tool, coverage, breakdown }) => [
              tool.shortname,
              String(tool.openSource),
              coverage.percentage?.toFixed(1) ?? '',
              breakdown.sourced,
              breakdown.unsourced,
              breakdown.dev,
              breakdown.missing,
              breakdown.unknown,
              breakdown.total,
            ]),
          ],
        }}
        legend={<ChartLegend items={legend} />}
        footnote={`${scoringNote(home.options)} Missing and unknown features make up the rest of each column.`}
      >
        <StackedColumnChart
          label="Feature coverage by tool and status"
          series={series}
          data={home.tools.map(({ tool, coverage, breakdown }) => ({
            id: tool.id,
            label: tool.shortname,
            segments: {
              validated: share(breakdown.sourced, breakdown),
              unvalidated: share(breakdown.unsourced, breakdown),
              dev: share(breakdown.dev, breakdown),
            },
            colors: { validated: toolTypeColor(tool) },
            valueLabel: formatPercent(coverage),
            link: { to: '/tools' },
            tooltip: <StatusTooltip tool={tool} breakdown={breakdown} score={formatPercent(coverage)} />,
          }))}
        />
      </ChartCard>
    </HomeSection>
  )
}

export function UseCaseFitSection({ home }: { home: HomeData }) {
  const [selectedId, setSelectedId] = useState(home.useCases[0]?.useCase.id ?? '')
  const selected =
    home.useCases.find((item) => item.useCase.id === selectedId) ?? home.useCases[0]
  const matrixTools = home.tools.map(({ tool }) => tool)

  if (!selected) {
    return null
  }

  const rankedTools = rankBy(matrixTools, selected)

  return (
    <HomeSection
      id="use-case-fit"
      title="Use-case fit"
      description="Share of each planning use case's required features that a tool supports. Use cases describe typical studies; build your own to score a specific one."
    >
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <ChartTabs
          label="Use cases"
          value={selected.useCase.id}
          onValueChange={setSelectedId}
          tabs={home.useCases.map((item) => ({
            value: item.useCase.id,
            label: item.label,
            content: (
              <ChartCard
                title={item.useCase.name}
                subtitle={`Share of ${item.required} required features met`}
                direction="higher"
                info={item.useCase.description || undefined}
                link={{ to: '/tools', search: item.search, label: 'Matrix' }}
                csv={scoreCsv(`${item.useCase.id}-fit`, rankBy(matrixTools, item), (tool) =>
                  item.scores.get(tool.id),
                )}
                legend={<ChartLegend items={toolTypeLegend} />}
                footnote={scoringNote(home.options)}
              >
                <ColumnChart
                  label={`${item.useCase.name} fit by tool`}
                  data={toolScoreColumns(
                    item === selected ? rankedTools : rankBy(matrixTools, item),
                    (tool) => item.scores.get(tool.id),
                    { to: '/tools', search: item.search },
                    'Required features met',
                  )}
                />
              </ChartCard>
            ),
          }))}
        />
        <div className="grid content-start gap-3 2xl:pt-[2.85rem]">
          <ChartCard
            title="Fit matrix"
            subtitle="Every tool against every use case"
            direction="higher"
            info="Each cell is the share of that use case's required features the tool supports. Select a cell to open the matching rows in the tool matrix."
            legend={
              <span className="atlas-chart-legend">
                <HeatmapScale />
              </span>
            }
            csv={{
              filename: 'use-case-fit-matrix',
              rows: [
                ['tool', ...home.useCases.map((item) => item.useCase.id)],
                ...matrixTools.map((tool) => [
                  tool.shortname,
                  ...home.useCases.map((item) => item.scores.get(tool.id)?.percentage?.toFixed(1) ?? ''),
                ]),
              ],
            }}
          >
            <Heatmap
              label="Use-case fit by tool"
              rows={matrixTools.map((tool) => ({
                id: tool.id,
                label: tool.shortname,
                swatch: toolTypeColor(tool),
              }))}
              columns={home.useCases.map((item) => ({
                id: item.useCase.id,
                label: item.label,
                title: item.useCase.name,
              }))}
              cell={(row, column) => {
                const item = home.useCases.find((candidate) => candidate.useCase.id === column.id)
                const coverage = item?.scores.get(row.id)
                const tool = matrixTools.find((candidate) => candidate.id === row.id)
                return {
                  value: coverage?.percentage ?? null,
                  valueLabel: formatPercent(coverage),
                  link: item ? { to: '/tools', search: item.search } : undefined,
                  tooltip: (
                    <TooltipBody
                      title={`${tool?.name ?? row.label} · ${item?.useCase.name ?? column.label}`}
                      rows={[
                        ['Fit', formatPercent(coverage)],
                        ['Required features met', coverage ? `${coverage.met} of ${coverage.total}` : 'N/A'],
                      ]}
                    />
                  ),
                }
              }}
            />
          </ChartCard>
        </div>
      </div>
    </HomeSection>
  )
}

export function TradeOffSection({ home }: { home: HomeData }) {
  const options = home.useCases
  const [xId, setXId] = useState(() => defaultAxis(options, 'integrated_resource_planning', 1))
  const [yId, setYId] = useState(() => defaultAxis(options, 'network_development_plan', 2))
  const x = options.find((item) => item.useCase.id === xId) ?? options[0]
  const y = options.find((item) => item.useCase.id === yId) ?? options[0]

  if (!x || !y) {
    return null
  }

  const points = home.tools.map(({ tool }) => ({
    id: tool.id,
    label: tool.shortname,
    x: x.scores.get(tool.id)?.percentage ?? 0,
    y: y.scores.get(tool.id)?.percentage ?? 0,
    color: toolTypeColor(tool),
    link: { to: '/tools', search: { use_cases: [x.useCase.id, y.useCase.id].join(',') } },
    tooltip: (
      <TooltipBody
        title={tool.name}
        swatch={toolTypeColor(tool)}
        rows={[
          [x.label, formatPercent(x.scores.get(tool.id))],
          [y.label, formatPercent(y.scores.get(tool.id))],
        ]}
      />
    ),
  }))
  const frontier = paretoFrontier(points)

  return (
    <HomeSection
      id="trade-offs"
      title="Use-case trade-offs"
      description="Compare fit for two use cases at once. Tools towards the top right fit both well."
      controls={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <UseCaseSelect label="Horizontal axis" value={x.useCase.id} options={options} onChange={setXId} />
          <UseCaseSelect label="Vertical axis" value={y.useCase.id} options={options} onChange={setYId} />
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <ChartCard
          title={`${x.useCase.name} vs. ${y.useCase.name}`}
          subtitle="Share of required features met on each axis"
          direction="higher"
          csv={{
            filename: `${x.useCase.id}-vs-${y.useCase.id}`,
            rows: [
              ['tool', `${x.useCase.id}_percent`, `${y.useCase.id}_percent`],
              ...points.map((point) => [point.label, point.x.toFixed(1), point.y.toFixed(1)]),
            ],
          }}
          legend={<ChartLegend items={toolTypeLegend} />}
        >
          <ScatterChart
            label={`Fit for ${x.useCase.name} against ${y.useCase.name}`}
            data={points}
            xLabel={`${x.label} fit`}
            yLabel={`${y.label} fit`}
            xDomain={percentDomain(points.map((point) => point.x))}
            yDomain={percentDomain(points.map((point) => point.y))}
            quadrant={{
              x: median(points.map((point) => point.x)),
              y: median(points.map((point) => point.y)),
              label: 'Strongest on both',
            }}
            frontier
          />
        </ChartCard>
        <aside className="atlas-note-card gap-3 p-4 text-sm" aria-label="How to read this chart">
          <h3 className="atlas-chart-title">How to read this chart</h3>
          <p className="atlas-copy text-sm leading-6">
            Each point is a tool. Further right means a better fit for{' '}
            {x.useCase.name}; higher means a better fit for {y.useCase.name}. The
            shaded area holds tools above the median on both.
          </p>
          <p className="atlas-copy text-sm leading-6">
            {frontier.length === 1 ? (
              <>
                <span className="font-medium text-[var(--atlas-ink)]">{frontier[0].label}</span>{' '}
                fits both use cases at least as well as every other tool.
              </>
            ) : (
              <>
                The line joins tools that no other tool beats on both use cases:{' '}
                <span className="font-medium text-[var(--atlas-ink)]">
                  {frontier.map((point) => point.label).join(', ')}
                </span>
                .
              </>
            )}
          </p>
        </aside>
      </div>
    </HomeSection>
  )
}

export function CategorySection({ home }: { home: HomeData }) {
  const tools = home.tools.map(({ tool }) => tool)

  return (
    <HomeSection
      id="categories"
      title="Category breakdown"
      description={`Coverage within each of the ${home.categories.length} taxonomy categories. Tools keep the same order in every chart, ranked by overall coverage.`}
    >
      <ChartLegend items={toolTypeLegend} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {home.categories.map(({ category, scores }) => {
          const search = { category: category.id }
          return (
            <ChartCard
              key={category.id}
              compact
              title={sentenceCase(category.label)}
              subtitle={`${category.members.length} features`}
              info={category.description || undefined}
              link={{ to: '/tools', search, label: 'Matrix' }}
              csv={scoreCsv(`${category.id}-coverage`, tools, (tool) => scores.get(tool.id))}
            >
              <ColumnChart
                size="sm"
                label={`${sentenceCase(category.label)} coverage by tool`}
                data={toolScoreColumns(tools, (tool) => scores.get(tool.id), { to: '/tools', search })}
              />
            </ChartCard>
          )
        })}
      </div>
    </HomeSection>
  )
}

export function ToolsSection({ home }: { home: HomeData }) {
  const [allUseCases] = home.useCases
  const proprietary = home.tools.some(({ tool }) => !tool.openSource)

  return (
    <HomeSection
      id="tools"
      title="Tools"
      description="Each tool's feature list, who maintains it, and its headline scores."
    >
      <div className="atlas-chart-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="atlas-directory">
            <thead>
              <tr>
                <th scope="col">Tool</th>
                <th scope="col">Type</th>
                <th scope="col">Version</th>
                <th scope="col" className="text-right">Coverage</th>
                {allUseCases ? <th scope="col" className="text-right">Use-case fit</th> : null}
                <th scope="col" className="text-right">Validated</th>
                <th scope="col" className="text-right">In dev.</th>
                <th scope="col">List maintainers</th>
                <th scope="col">Links</th>
              </tr>
            </thead>
            <tbody>
              {home.tools.map(({ tool, coverage, breakdown, evidence }) => (
                <tr key={tool.id}>
                  <th scope="row">
                    <Link to="/tools" className="atlas-directory-tool atlas-focus outline-none">
                      <span className="font-semibold text-[var(--atlas-ink)]">{tool.shortname}</span>
                      {tool.name !== tool.shortname ? (
                        <span className="atlas-caption block text-xs font-normal">{tool.name}</span>
                      ) : null}
                    </Link>
                  </th>
                  <td>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        className="atlas-chart-swatch"
                        style={{ backgroundColor: toolTypeColor(tool) }}
                        aria-hidden="true"
                      />
                      {toolTypeLabel(tool)}
                    </span>
                  </td>
                  <td className="tabular-nums">{tool.version ?? '—'}</td>
                  <td className="text-right tabular-nums">{formatPercent(coverage)}</td>
                  {allUseCases ? (
                    <td className="text-right tabular-nums">
                      {formatPercent(allUseCases.scores.get(tool.id))}
                    </td>
                  ) : null}
                  <td className="text-right tabular-nums">{formatPercent(evidence)}</td>
                  <td className="text-right tabular-nums">{breakdown.dev}</td>
                  <td>
                    <span className="flex flex-wrap gap-x-2 gap-y-0.5">
                      {tool.maintainers.map((maintainer) => (
                        <a
                          key={maintainer}
                          href={`https://github.com/${maintainer}`}
                          target="_blank"
                          rel="noreferrer"
                          className="atlas-reference-link text-xs font-medium"
                        >
                          @{maintainer}
                        </a>
                      ))}
                    </span>
                  </td>
                  <td>
                    <span className="flex gap-2 whitespace-nowrap">
                      {tool.docs && tool.docs !== 'none' ? <ExternalLink href={tool.docs} label="Docs" /> : null}
                      {tool.source ? <ExternalLink href={tool.source} label="Source" /> : null}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="atlas-chart-card-footer">
          <p className="atlas-chart-footnote">
            Validated is the share of implemented features that cite documentation,
            code or a study as a source. {scoringNote(home.options)}
            {proprietary
              ? ' PLEXOS® is a registered trademark of Energy Exemplar; its list is compiled by contributors from public documentation and is not reviewed or endorsed by Energy Exemplar.'
              : null}
          </p>
        </footer>
      </div>
    </HomeSection>
  )
}

function UseCaseSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: UseCaseSummary[]
  onChange: (value: string) => void
}) {
  return (
    <label className="atlas-label grid w-full gap-1 text-xs font-medium sm:w-64">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="atlas-control h-9 w-full px-2 text-sm"
      >
        {options.map((item) => (
          <option key={item.useCase.id} value={item.useCase.id}>
            {item.useCase.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function StatusTooltip({
  tool,
  breakdown,
  score,
}: {
  tool: ToolRecord
  breakdown: StatusBreakdown
  score: string
}) {
  return (
    <TooltipBody
      title={tool.name}
      swatch={toolTypeColor(tool)}
      rows={[
        ['Coverage score', score],
        ['Implemented, validated', String(breakdown.sourced)],
        ['Implemented, unvalidated', String(breakdown.unsourced)],
        ['In development', String(breakdown.dev)],
        ['Missing', String(breakdown.missing)],
        ['Unknown', String(breakdown.unknown)],
      ]}
    />
  )
}

function defaultAxis(options: UseCaseSummary[], preferredId: string, fallbackIndex: number) {
  return (
    options.find((item) => item.useCase.id === preferredId)?.useCase.id ??
    options[fallbackIndex]?.useCase.id ??
    options[0]?.useCase.id ??
    ''
  )
}

function share(count: number, breakdown: StatusBreakdown) {
  return breakdown.total > 0 ? (count / breakdown.total) * 100 : 0
}

function rankBy(tools: ToolRecord[], useCase: UseCaseSummary) {
  return [...tools].sort(
    (left, right) =>
      (useCase.scores.get(right.id)?.percentage ?? -1) -
      (useCase.scores.get(left.id)?.percentage ?? -1),
  )
}
