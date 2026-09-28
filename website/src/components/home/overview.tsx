// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import {
  FaArrowRight,
  FaBookOpen,
  FaClipboardCheck,
  FaTableCells,
  FaWandMagicSparkles,
} from 'react-icons/fa6'
import { ChartCard, TooltipBody } from '../charts/chart-card'
import { ColumnChart } from '../charts/column-chart'
import { countScale, toolTypeColor } from '../../lib/chart-utils'
import type { HomeData } from './home-data'
import { HomeSection, scoreCsv, toolScoreColumns } from './shared'

export function HomeHero({ home }: { home: HomeData }) {
  const { data, featureCount, builtInUseCaseCount } = home
  const facts = [
    `${data.tools.length} tools`,
    `${featureCount} features`,
    `${data.taxonomy.length} categories`,
    `${builtInUseCaseCount} use cases`,
    `Taxonomy ${data.taxonomyVersion}`,
  ]

  return (
    <section className="atlas-hero grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="max-w-3xl">
        <p className="atlas-eyebrow">Energy system modelling tools</p>
        <h1 className="atlas-hero-title mt-2 text-3xl font-semibold sm:text-4xl">
          Compare modelling tools against real planning needs
        </h1>
        <p className="atlas-copy mt-3 text-sm leading-6 sm:text-base">
          Community-maintained feature coverage for open-source energy system
          modelling tools, with PLEXOS® as a proprietary reference point. Every
          score links to the feature evidence behind it.
        </p>
        <ul className="atlas-hero-facts mt-4" aria-label="Inventory size">
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-2">
        <HeroLink to="/tools" variant="primary">
          Open tool matrix
        </HeroLink>
        <HeroLink to="/builder">Build a custom use case</HeroLink>
      </div>
    </section>
  )
}

export function HomeHighlights({ home }: { home: HomeData }) {
  const tools = home.tools.map(({ tool }) => tool)
  const coverage = new Map(home.tools.map((item) => [item.tool.id, item.coverage]))
  const [allDefault] = home.useCases
  const byDev = [...home.tools].sort(
    (left, right) => right.breakdown.dev - left.breakdown.dev,
  )
  const maxDev = Math.max(1, ...byDev.map((item) => item.breakdown.dev))
  const fitTools = allDefault
    ? [...tools].sort(
        (left, right) =>
          (allDefault.scores.get(right.id)?.percentage ?? -1) -
          (allDefault.scores.get(left.id)?.percentage ?? -1),
      )
    : []

  return (
    <HomeSection
      id="highlights"
      title="Highlights"
      description="Headline scores at a glance. Select a chart title to jump to the full section."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="grid gap-4 md:grid-cols-3">
          <ChartCard
            compact
            title={<a href="#coverage" className="atlas-chart-title-link">Feature coverage</a>}
            subtitle={`Share of all ${home.featureCount} features`}
            direction="higher"
            csv={scoreCsv('feature-coverage', tools, (tool) => coverage.get(tool.id))}
          >
            <ColumnChart
              size="sm"
              label="Feature coverage by tool"
              data={toolScoreColumns(tools, (tool) => coverage.get(tool.id), { to: '/tools' })}
            />
          </ChartCard>
          {allDefault ? (
            <ChartCard
              compact
              title={<a href="#use-case-fit" className="atlas-chart-title-link">Use-case fit</a>}
              subtitle={`${home.builtInUseCaseCount} default use cases combined`}
              direction="higher"
              csv={scoreCsv('all-default-use-case-fit', fitTools, (tool) =>
                allDefault.scores.get(tool.id),
              )}
            >
              <ColumnChart
                size="sm"
                label="Fit for all default use cases by tool"
                data={toolScoreColumns(
                  fitTools,
                  (tool) => allDefault.scores.get(tool.id),
                  { to: '/tools', search: allDefault.search },
                  'Required features met',
                )}
              />
            </ChartCard>
          ) : null}
          <ChartCard
            compact
            title={<a href="#coverage" className="atlas-chart-title-link">In development</a>}
            subtitle="Features flagged as actively being built"
            csv={{
              filename: 'features-in-development',
              rows: [
                ['tool', 'features_in_development'],
                ...byDev.map(({ tool, breakdown }) => [tool.shortname, breakdown.dev]),
              ],
            }}
          >
            <ColumnChart
              size="sm"
              label="Features in development by tool"
              scale={countScale(maxDev)}
              data={byDev.map(({ tool, breakdown }) => ({
                id: tool.id,
                label: tool.shortname,
                value: breakdown.dev,
                valueLabel: String(breakdown.dev),
                color: toolTypeColor(tool),
                link: { to: '/tools' },
                tooltip: (
                  <TooltipBody
                    title={tool.name}
                    swatch={toolTypeColor(tool)}
                    rows={[['In development', `${breakdown.dev} features`]]}
                  />
                ),
              }))}
            />
          </ChartCard>
        </div>
        <aside className="grid content-start gap-3 md:grid-cols-2 xl:grid-cols-1" aria-label="Explore">
          <PromoCard
            to="/builder"
            icon={<FaWandMagicSparkles aria-hidden="true" />}
            title="Build your own use case"
            detail="Pick the features your study needs and score every tool against them."
            highlight
          />
          <div className="atlas-note-card gap-1 p-2">
            <ExploreLink to="/tools" icon={<FaTableCells aria-hidden="true" />}>
              Tool matrix
            </ExploreLink>
            <ExploreLink to="/use-cases" icon={<FaClipboardCheck aria-hidden="true" />}>
              Use-case fit details
            </ExploreLink>
            <ExploreLink to="/about" icon={<FaBookOpen aria-hidden="true" />}>
              Methodology
            </ExploreLink>
          </div>
        </aside>
      </div>
    </HomeSection>
  )
}

function PromoCard({
  to,
  icon,
  title,
  detail,
  highlight = false,
}: {
  to: string
  icon: ReactNode
  title: string
  detail: string
  highlight?: boolean
}) {
  return (
    <Link
      to={to}
      className="atlas-promo-card atlas-focus grid gap-2 p-4 outline-none"
      data-highlight={highlight || undefined}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="atlas-promo-icon">{icon}</span>
        <FaArrowRight className="atlas-promo-arrow" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-[var(--atlas-ink)]">{title}</span>
      <span className="atlas-caption text-xs leading-5">{detail}</span>
    </Link>
  )
}

function ExploreLink({
  to,
  icon,
  children,
}: {
  to: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className="atlas-explore-link atlas-focus flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium outline-none"
    >
      <span className="atlas-muted">{icon}</span>
      <span className="flex-1">{children}</span>
      <FaArrowRight className="atlas-muted text-xs" aria-hidden="true" />
    </Link>
  )
}

function HeroLink({
  to,
  variant = 'secondary',
  children,
}: {
  to: string
  variant?: 'primary' | 'secondary'
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className={`${variant === 'primary' ? 'atlas-primary-button' : 'atlas-secondary-button'} atlas-focus inline-flex h-10 items-center gap-2 px-4 text-sm font-semibold outline-none`}
    >
      {children}
      <FaArrowRight aria-hidden="true" />
    </Link>
  )
}
