'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  TripsTable,
  KPICards,
  MonthSelector,
  CleanupButton,
  BusinessToggle,
} from '@/components/dashboard'
import { getMonthProgress, calcAchievement } from '@/lib/utils'
import {
  fetchTripsDealsForMonth,
  calculateTripsFunnelMetrics,
  fetchTripsMonthlyTarget,
  fetchPreviousTripsMetrics,
  fetchTaxaForMonth,
  fetchMetaAdsSpend,
  fetchGoogleAdsSpend,
} from '@/lib/queries'
import type { TripsFunnelMetrics, MonthlyTarget } from '@/lib/types'

const EMPTY_METRICS: TripsFunnelMetrics = {
  leads: 0,
  mql: 0,
  agendamento: 0,
  reunioes: 0,
  taxa: 0,
}

function TripsDashboardContent() {
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
  const [metrics, setMetrics] = useState<TripsFunnelMetrics>(EMPTY_METRICS)
  const [target, setTarget] = useState<MonthlyTarget | null>(null)
  const [previousMetrics, setPreviousMetrics] = useState<TripsFunnelMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [deals, setDeals] = useState<import('@/lib/types').Deal[]>([])
  const [totalSpend, setTotalSpend] = useState(0)
  const [totalImpressions, setTotalImpressions] = useState(0)
  const [totalClicks, setTotalClicks] = useState(0)

  const monthProgress = getMonthProgress(selectedYear, selectedMonth)
  const resultProgress = target?.taxa
    ? calcAchievement(metrics.taxa, target.taxa)
    : 0

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [fetchedDeals, targetData, prevMetrics, taxaData, metaAds, googleAds] = await Promise.all([
        fetchTripsDealsForMonth(selectedYear, selectedMonth),
        fetchTripsMonthlyTarget(selectedYear, selectedMonth),
        fetchPreviousTripsMetrics(selectedYear, selectedMonth),
        fetchTaxaForMonth(selectedYear, selectedMonth),
        fetchMetaAdsSpend(selectedYear, selectedMonth),
        fetchGoogleAdsSpend(selectedYear, selectedMonth),
      ])

      // Combine deals: created_at deals + taxa deals (deduplicated)
      const allDeals = [
        ...fetchedDeals,
        ...taxaData.deals.filter(d => !fetchedDeals.some(fd => fd.id === d.id))
      ]
      setDeals(allDeals)

      // Calculate metrics
      const baseMetrics = calculateTripsFunnelMetrics(allDeals, selectedYear, selectedMonth)
      setMetrics({ ...baseMetrics, taxa: taxaData.count })
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
    router.push(`/trips?year=${year}&month=${month}`, { scroll: false })
  }

  return (
    <main className="dash-page">
      <div className="dash-container">
        {/* Header */}
        <div className="dash-header">
          <div className="flex items-center gap-3">
            <BusinessToggle current="trips" year={selectedYear} month={selectedMonth} />
          </div>
          <div className="flex gap-3 items-center">
            <CleanupButton />
            <MonthSelector
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onChange={handleMonthChange}
            />
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
              <TripsTable
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

export default function TripsDashboard() {
  return (
    <Suspense fallback={<div className="dash-page flex items-center justify-center loading-text">Carregando...</div>}>
      <TripsDashboardContent />
    </Suspense>
  )
}
