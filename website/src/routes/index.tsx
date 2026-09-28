// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { createFileRoute } from '@tanstack/react-router'
import { useHomeData } from '../components/home/home-data'
import { HomeHero, HomeHighlights } from '../components/home/overview'
import { SectionNav, SectionSidebar } from '../components/home/section-nav'
import {
  CategorySection,
  CoverageSection,
  ToolsSection,
  TradeOffSection,
  UseCaseFitSection,
} from '../components/home/sections'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const home = useHomeData()

  return (
    <div className="grid gap-8">
      <HomeHero home={home} />
      <SectionNav />
      <div className="grid gap-8 lg:grid-cols-[10.5rem_minmax(0,1fr)] xl:gap-10">
        <SectionSidebar />
        <div className="grid min-w-0 gap-14">
          <HomeHighlights home={home} />
          <CoverageSection home={home} />
          <UseCaseFitSection home={home} />
          <TradeOffSection home={home} />
          <CategorySection home={home} />
          <ToolsSection home={home} />
        </div>
      </div>
    </div>
  )
}
