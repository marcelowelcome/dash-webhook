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
  fetchMonthlyTarget,
  fetchPreviousMonthMetrics,
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

function WeddingDashboardContent() {
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
      const [fetchedDeals, targetData, prevMetrics, vendasData, closersData, metaAds, googleAds] = await Promise.all([
        fetchDealsForMonth(selectedYear, selectedMonth, 'wedding'),
        fetchMonthlyTarget(selectedYear, selectedMonth, 'wedding'),
        fetchPreviousMonthMetrics(selectedYear, selectedMonth, 'wedding'),
        fetchVendasForMonth(selectedYear, selectedMonth, 'wedding'),
        fetchClosersForMonth(selectedYear, selectedMonth, 'wedding'),
        fetchMetaAdsSpend(selectedYear, selectedMonth),
        fetchGoogleAdsSpend(selectedYear, selectedMonth),
      ])

      // Combine deals: created_at deals + vendas deals + closer deals (deduplicated)
      const existingIds = new Set(fetchedDeals.map(d => d.id))
      const allDeals = [
        ...fetchedDeals,
        ...vendasData.deals.filter(d => !existingIds.has(d.id)),
        ...closersData.deals.filter(d => !existingIds.has(d.id) && !vendasData.deals.some(vd => vd.id === d.id))
      ]
      setDeals(allDeals)

      // Calculate metrics using allDeals (includes deals closed in month)
      const baseMetrics = calculateFunnelMetrics(allDeals, selectedYear, selectedMonth)
      setMetrics({ ...baseMetrics, vendas: vendasData.count })
      setTarget(targetData)
      setPreviousMetrics(prevMetrics)

      // Combine Meta + Google Ads
      setTotalSpend(metaAds.spend + googleAds.spend)
      setTotalImpressions(metaAds.impressions + googleAds.impressions)
      setTotalClicks(metaAds.clicks + googleAds.clicks)
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
    router.push(`/wedding?year=${year}&month=${month}`, { scroll: false })
  }

  return (
    <main className="dash-page">
      <div className="dash-container">
        {/* Header */}
        <div className="dash-header">
          <div className="flex items-center gap-3">
            <BusinessToggle current="ww" year={selectedYear} month={selectedMonth} />
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
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function WeddingDashboard() {
  return (
    <Suspense fallback={<div className="dash-page flex items-center justify-center loading-text">Carregando...</div>}>
      <WeddingDashboardContent />
    </Suspense>
  )
}
