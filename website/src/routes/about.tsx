// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import {
  FaArrowUpRightFromSquare,
  FaBookOpen,
  FaChartSimple,
  FaCheck,
  FaCircleQuestion,
  FaCodeBranch,
  FaCodeFork,
  FaFileCircleCheck,
  FaGavel,
  FaGithub,
  FaLink,
  FaRegCircleQuestion,
  FaRotate,
  FaScaleBalanced,
} from 'react-icons/fa6'
import { useDashboardContext } from '../components/dashboard-layout'
import { Panel } from '../components/page-shell'
import type { ToolRecord } from '../data/types'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  const { data } = useDashboardContext()
  const quality = useMemo(() => calculateQuality(data), [data])

  return (
    <div className="grid gap-5">
      <Panel
        title="Project Purpose"
        description="What openmod-features is built to answer."
      >
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
          <div>
            <p className="atlas-copy text-sm leading-6">
              openmod-features is a community-maintained feature inventory for
              open-source energy system modelling tools and common planning use
              cases. Matching tool feature lists to use-case requirements helps
              identify which tools fit a decision-making workflow and where
              feature gaps remain.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <AboutAction to="/tools" icon={<FaChartSimple aria-hidden="true" />}>
                Open tool matrix
              </AboutAction>
              <AboutAction to="/use-cases" icon={<FaFileCircleCheck aria-hidden="true" />}>
                Compare use cases
              </AboutAction>
              <AboutExternal
                href="https://github.com/open-energy-transition/openmod-features"
                icon={<FaGithub aria-hidden="true" />}
              >
                GitHub repository
              </AboutExternal>
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
            <AboutStat label="Tools" value={data.tools.length.toString()} />
            <AboutStat label="Use cases" value={data.useCases.length.toString()} />
            <AboutStat
              label="Generated data"
              value={new Date(data.generatedAt).toLocaleDateString()}
            />
          </dl>
        </div>
      </Panel>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="What The Scores Mean"
          description="Coverage is a feature-fit signal, not a runtime benchmark."
        >
          <div className="grid gap-3 p-4 text-sm">
            <InfoItem
              icon={<FaCheck aria-hidden="true" />}
              title="Tool lists describe availability"
              detail="A tool entry marks whether each taxonomy feature is implemented, missing, unknown, or in development."
            />
            <InfoItem
              icon={<FaFileCircleCheck aria-hidden="true" />}
              title="Use-case lists describe requirements"
              detail="A use-case entry marks which features are required for a modelling workflow."
            />
            <InfoItem
              icon={<FaChartSimple aria-hidden="true" />}
              title="Scores compare coverage"
              detail="Percentages show how many required features are met under the active coverage rules. They do not judge performance, scale, or solution quality."
            />
          </div>
        </Panel>

        <Panel
          title="Contribution Model"
          description="The repository is designed for distributed maintenance."
        >
          <div className="grid gap-3 p-4 text-sm">
            <InfoItem
              icon={<FaCodeFork aria-hidden="true" />}
              title="Add or update a tool"
              detail="Contributors maintain tool feature lists in YAML, with source links where possible."
              href="https://github.com/open-energy-transition/openmod-features#add-your-tool"
            />
            <InfoItem
              icon={<FaFileCircleCheck aria-hidden="true" />}
              title="Add or update a use case"
              detail="Use-case lists define the features needed by a planning workflow."
              href="https://github.com/open-energy-transition/openmod-features#add-a-use-case"
            />
            <InfoItem
              icon={<FaBookOpen aria-hidden="true" />}
              title="Propose taxonomy changes"
              detail="Taxonomy changes start as issues because they affect all tool and use-case lists."
              href="https://github.com/open-energy-transition/openmod-features/blob/main/CONTRIBUTING.md#proposing-taxonomy-changes"
            />
          </div>
        </Panel>

        <Panel
          title="Governance & Maintenance"
          description="How project and entry responsibilities are split."
        >
          <div className="grid gap-3 p-4 text-sm">
            <InfoItem
              icon={<FaGavel aria-hidden="true" />}
              title="Project maintainers"
              detail="Project maintainers oversee repository infrastructure, taxonomy evolution, releases, and final review of new submissions."
            />
            <InfoItem
              icon={<FaCodeBranch aria-hidden="true" />}
              title="Entry maintainers"
              detail="Each tool or use-case list has maintainers responsible for keeping sources and feature values current."
            />
            <InfoItem
              icon={<FaRegCircleQuestion aria-hidden="true" />}
              title="Consensus for taxonomy changes"
              detail="Feature taxonomy changes are discussed with maintainers because they alter the shared denominator."
              href="https://github.com/open-energy-transition/openmod-features/blob/main/GOVERNANCE.md"
            />
          </div>
        </Panel>

        <Panel
          title="Release, Taxonomy & Reuse"
          description="How the dataset evolves and how it can be reused."
        >
          <div className="grid gap-3 p-4 text-sm">
            <InfoItem
              icon={<FaRotate aria-hidden="true" />}
              title="Quarterly release rhythm"
              detail="The contribution guide describes approximately quarterly releases with pre-release windows for taxonomy updates."
            />
            <InfoItem
              icon={<FaBookOpen aria-hidden="true" />}
              title="v0.3.0 taxonomy overhaul"
              detail="The current changelog notes a ground-up recursive taxonomy and schema overhaul in the unreleased v0.3.0 work."
              href="https://github.com/open-energy-transition/openmod-features/blob/main/CHANGELOG.md"
            />
            <InfoItem
              icon={<FaScaleBalanced aria-hidden="true" />}
              title="Licensing"
              detail="Repository software is MIT licensed. Generated tool, use-case, and schema data are CC-BY-4.0 for reuse."
              href="https://github.com/open-energy-transition/openmod-features#license"
            />
          </div>
        </Panel>
      </section>

      <Panel
        title="Data Quality"
        description="Validation and maintenance signals for the feature inventory."
      >
        <dl className="grid gap-3 p-4 text-sm md:grid-cols-2 xl:grid-cols-4">
          <QualityItem
            icon={<FaLink aria-hidden="true" />}
            label="Source-backed values"
            value={`${quality.sourced} / ${quality.sourceEligible}`}
            detail="Implemented or in-development values with at least one validation link."
          />
          <QualityItem
            icon={<FaRegCircleQuestion aria-hidden="true" />}
            label="Unknown values"
            value={quality.unknown.toString()}
            detail="Feature cells still marked as unassessed."
          />
          <QualityItem
            icon={<FaCircleQuestion aria-hidden="true" />}
            label="Unsourced implemented values"
            value={quality.unsourced.toString()}
            detail="Implemented values without validation links."
          />
          <QualityItem
            icon={<FaCodeBranch aria-hidden="true" />}
            label="In-development values"
            value={quality.development.toString()}
            detail="Partial or planned support marked as dev."
          />
        </dl>
      </Panel>
    </div>
  )
}

function AboutAction({
  to,
  icon,
  children,
}: {
  to: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className="atlas-secondary-button atlas-focus inline-flex h-9 items-center justify-center gap-2 px-3 text-sm font-medium outline-none"
    >
      <span className="atlas-muted">{icon}</span>
      {children}
    </Link>
  )
}

function AboutExternal({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="atlas-secondary-button atlas-focus inline-flex h-9 items-center justify-center gap-2 px-3 text-sm font-medium outline-none"
    >
      <span className="atlas-muted">{icon}</span>
      {children}
      <FaArrowUpRightFromSquare className="text-[10px]" aria-hidden="true" />
    </a>
  )
}

function AboutStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-[var(--atlas-line-strong)] px-3 py-2">
      <dt className="atlas-caption text-xs font-semibold uppercase tracking-[0.12em]">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums text-[var(--atlas-ink)]">
        {value}
      </dd>
    </div>
  )
}

function InfoItem({
  icon,
  title,
  detail,
  href,
}: {
  icon: React.ReactNode
  title: string
  detail: string
  href?: string
}) {
  const content = (
    <>
      <span className="atlas-muted mt-0.5">{icon}</span>
      <span className="grid gap-1">
        <span className="font-semibold text-[var(--atlas-ink)]">{title}</span>
        <span className="atlas-caption leading-5">{detail}</span>
      </span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="atlas-subtle-card atlas-focus grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 p-3 outline-none hover:border-[rgb(13_118_111_/_0.24)] hover:bg-[var(--atlas-hydro-wash)]"
      >
        {content}
      </a>
    )
  }

  return (
    <div className="atlas-subtle-card grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 p-3">
      {content}
    </div>
  )
}

function QualityItem({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="grid gap-1 border-l border-[var(--atlas-line-strong)] px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <dt className="flex min-w-0 items-center gap-2 text-[var(--atlas-ink-soft)]">
          <span className="atlas-muted">{icon}</span>
          <span className="truncate">{label}</span>
        </dt>
        <dd className="font-semibold tabular-nums text-[var(--atlas-ink)]">{value}</dd>
      </div>
      {detail ? <p className="atlas-caption pl-6 text-xs leading-5">{detail}</p> : null}
    </div>
  )
}

function calculateQuality(data: {
  tools: ToolRecord[]
}) {
  let unknown = 0
  let unsourced = 0
  let development = 0
  let sourceEligible = 0
  let sourced = 0

  for (const tool of data.tools) {
    for (const category of Object.values(tool.features)) {
      for (const feature of Object.values(category)) {
        if (feature.value === 'y' || feature.value === 'dev') {
          sourceEligible += 1
          if (feature.sources.length > 0) {
            sourced += 1
          }
        }

        if (feature.value === '?') {
          unknown += 1
        }

        if (feature.value === 'y' && feature.sources.length === 0) {
          unsourced += 1
        }

        if (feature.value === 'dev') {
          development += 1
        }
      }
    }
  }

  return { unknown, unsourced, development, sourceEligible, sourced }
}
