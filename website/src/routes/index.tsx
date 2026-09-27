// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { createFileRoute } from '@tanstack/react-router'
import { useHomeData } from '../components/home/home-data'
import { HomeHero, HomeHighlights, SectionNav } from '../components/home/overview'
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
      <HomeHighlights home={home} />
      <SectionNav />
      <CoverageSection home={home} />
      <UseCaseFitSection home={home} />
      <TradeOffSection home={home} />
      <CategorySection home={home} />
      <ToolsSection home={home} />
    </div>
  )
}
