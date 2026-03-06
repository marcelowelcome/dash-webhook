'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  FunnelTable,
  KPICards,
  MonthSelector,
  ViewToggle,
  CleanupButton,
  BusinessToggle,
} from '@/components/dashboard'
import { getMonthProgress, calcAchievement } from '@/lib/utils'
import {
  fetchDealsForMonth,
  calculateFunnelMetrics,
  calculateElopementMetrics,
  fetchMonthlyTarget,
  fetchVendasForMonth,
  fetchClosersForMonth,
  fetchMetaAdsSpend,
  fetchGoogleAdsSpend,
} from '@/lib/queries'
import type { FunnelMetrics, MonthlyTarget } from '@/lib/types'

const EMPTY_METRICS: FunnelMetrics = {
  leads: 0,
  mql: 0,
  agendamento: 0,
  reunioes: 0,
  qualificado: 0,
  closerAgendada: 0,
  closerRealizada: 0,
  vendas: 0,
}

// Merge WW (full funnel) with Elopement (only leads + vendas)
function mergeMetrics(ww: FunnelMetrics, elopement: FunnelMetrics): FunnelMetrics {
  return {
    leads: ww.leads + elopement.leads,
    mql: ww.mql, // WW only
    agendamento: ww.agendamento, // WW only
    reunioes: ww.reunioes, // WW only
    qualificado: ww.qualificado, // WW only
    closerAgendada: ww.closerAgendada, // WW only
    closerRealizada: ww.closerRealizada, // WW only
    vendas: ww.vendas + elopement.vendas,
  }
}

// Merge WW target (full) with Elopement target (only leads + vendas)
function mergeTargets(ww: MonthlyTarget | null, elopement: MonthlyTarget | null): MonthlyTarget | null {
  if (!ww && !elopement) return null
  if (!ww) return elopement
  if (!elopement) return ww
  return {
    ...ww,
    leads: ww.leads + elopement.leads,
    mql: ww.mql, // WW only
    agendamento: ww.agendamento, // WW only
    reunioes: ww.reunioes, // WW only
    qualificado: ww.qualificado, // WW only
    closer_agendada: ww.closer_agendada, // WW only
    closer_realizada: ww.closer_realizada, // WW only
    vendas: ww.vendas + elopement.vendas,
    cpl: ww.cpl, // WW only
  }
}

function TotalDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlYear = searchParams.get('year')
  const urlMonth = searchParams.get('month')
  const [selectedYear, setSelectedYear] = useState(
    urlYear ? parseInt(urlYear) : new Date().getFullYear()
  )
  const [selectedMonth, setSelectedMonth] = useState(
    urlMonth ? parseInt(urlMonth) : new Date().getMonth() + 1
  )
  const [metrics, setMetrics] = useState<FunnelMetrics>(EMPTY_METRICS)
  const [target, setTarget] = useState<MonthlyTarget | null>(null)
  const [previousMetrics, setPreviousMetrics] = useState<FunnelMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [deals, setDeals] = useState<import('@/lib/types').Deal[]>([])
  const [totalSpend, setTotalSpend] = useState(0)
  const [totalImpressions, setTotalImpressions] = useState(0)
  const [totalClicks, setTotalClicks] = useState(0)

  const monthProgress = getMonthProgress(selectedYear, selectedMonth)
  const resultProgress = target
    ? calcAchievement(metrics.vendas, target.vendas)
    : 0

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch both wedding and elopement data + vendas + closers + Meta Ads + Google Ads
      const [
        weddingDeals, elopementDeals,
        weddingTarget, elopementTarget,
        weddingVendas, elopementVendas,
        weddingClosers,
        weddingMetaAds, googleAds
      ] = await Promise.all([
        fetchDealsForMonth(selectedYear, selectedMonth, 'wedding'),
        fetchDealsForMonth(selectedYear, selectedMonth, 'elopement'),
        fetchMonthlyTarget(selectedYear, selectedMonth, 'wedding'),
        fetchMonthlyTarget(selectedYear, selectedMonth, 'elopement'),
        fetchVendasForMonth(selectedYear, selectedMonth, 'wedding'),
        fetchVendasForMonth(selectedYear, selectedMonth, 'elopement'),
        fetchClosersForMonth(selectedYear, selectedMonth, 'wedding'),
        fetchMetaAdsSpend(selectedYear, selectedMonth),
        fetchGoogleAdsSpend(selectedYear, selectedMonth),
      ])

      // Combine all deals (deduplicated)
      const allDealsMap = new Map<number, import('@/lib/types').Deal>()
      ;[...weddingDeals, ...elopementDeals, ...weddingVendas.deals, ...elopementVendas.deals, ...weddingClosers.deals]
        .forEach(d => allDealsMap.set(d.id, d))
      setDeals(Array.from(allDealsMap.values()))

      // Combine wedding deals with vendas and closer deals (deduplicated)
      const weddingIds = new Set(weddingDeals.map(d => d.id))
      const allWeddingDeals = [
        ...weddingDeals,
        ...weddingVendas.deals.filter(d => !weddingIds.has(d.id)),
        ...weddingClosers.deals.filter(d => !weddingIds.has(d.id) && !weddingVendas.deals.some(vd => vd.id === d.id))
      ]
      const allElopementDeals = [
        ...elopementDeals,
        ...elopementVendas.deals.filter(d => !elopementDeals.some(ed => ed.id === d.id))
      ]

      // Calculate metrics using allDeals (includes deals closed in month)
      const weddingMetrics = {
        ...calculateFunnelMetrics(allWeddingDeals, selectedYear, selectedMonth),
        vendas: weddingVendas.count,
      }
      // Use calculateElopementMetrics for elopement (simpler logic - all deals created in month)
      const elopementMetrics = {
        ...calculateElopementMetrics(allElopementDeals, selectedYear, selectedMonth),
        vendas: elopementVendas.count,
      }

      setMetrics(mergeMetrics(weddingMetrics, elopementMetrics))
      setTarget(mergeTargets(weddingTarget, elopementTarget))

      // Combine Meta + Google Ads (+ 9000 elopement fixed)
      setTotalSpend(weddingMetaAds.spend + googleAds.spend + 9000)
      setTotalImpressions(weddingMetaAds.impressions + googleAds.impressions)
      setTotalClicks(weddingMetaAds.clicks + googleAds.clicks)

      // Previous month
      let prevYear = selectedYear
      let prevMonth = selectedMonth - 1
      if (prevMonth === 0) {
        prevMonth = 12
        prevYear = selectedYear - 1
      }

      const [prevWedding, prevElopement, prevWeddingVendas, prevElopementVendas, prevWeddingClosers] = await Promise.all([
        fetchDealsForMonth(prevYear, prevMonth, 'wedding'),
        fetchDealsForMonth(prevYear, prevMonth, 'elopement'),
        fetchVendasForMonth(prevYear, prevMonth, 'wedding'),
        fetchVendasForMonth(prevYear, prevMonth, 'elopement'),
        fetchClosersForMonth(prevYear, prevMonth, 'wedding'),
      ])

      // Combine previous month deals with vendas and closer deals
      const prevWeddingIds = new Set(prevWedding.map(d => d.id))
      const allPrevWedding = [
        ...prevWedding,
        ...prevWeddingVendas.deals.filter(d => !prevWeddingIds.has(d.id)),
        ...prevWeddingClosers.deals.filter(d => !prevWeddingIds.has(d.id) && !prevWeddingVendas.deals.some(vd => vd.id === d.id))
      ]
      const allPrevElopement = [
        ...prevElopement,
        ...prevElopementVendas.deals.filter(d => !prevElopement.some(ed => ed.id === d.id))
      ]

      setPreviousMetrics(mergeMetrics(
        { ...calculateFunnelMetrics(allPrevWedding, prevYear, prevMonth), vendas: prevWeddingVendas.count },
        { ...calculateElopementMetrics(allPrevElopement, prevYear, prevMonth), vendas: prevElopementVendas.count }
      ))
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year)
    setSelectedMonth(month)
    router.push(`/total?year=${year}&month=${month}`, { scroll: false })
  }

  return (
    <main className="dash-page">
      <div className="dash-container">
        {/* Header */}
        <div className="dash-header">
          <div className="flex items-center gap-3">
            <BusinessToggle current="ww" year={selectedYear} month={selectedMonth} />
            <span className="text-xs font-medium px-2.5 py-1 rounded-full
              bg-wedding-gold/10 text-wedding-gold border border-wedding-gold/20">
              Total (WW + Elopement)
            </span>
          </div>
          <div className="flex gap-3 items-center">
            <CleanupButton />
            <MonthSelector
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onChange={handleMonthChange}
            />
            <ViewToggle year={selectedYear} month={selectedMonth} />
          </div>
        </div>

        {/* KPI Cards */}
        <KPICards
          monthProgress={monthProgress}
          resultProgress={resultProgress}
          investment={totalSpend}
        />

        {/* Dashboard Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-4">
            {loading ? (
              <div className="loading-text">
                Carregando dados...
              </div>
            ) : (
              <FunnelTable
                metrics={metrics}
                target={target}
                previousMetrics={previousMetrics}
                monthProgress={monthProgress}
                cpl={metrics.leads > 0 ? totalSpend / metrics.leads : 0}
                deals={deals}
                year={selectedYear}
                month={selectedMonth}
                impressions={totalImpressions}
                clicks={totalClicks}
                isTotal={true}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function TotalDashboard() {
  return (
    <Suspense fallback={<div className="dash-page flex items-center justify-center loading-text">Carregando...</div>}>
      <TotalDashboardContent />
    </Suspense>
  )
}
