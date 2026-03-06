import { supabase } from './supabase'
import type { Deal, FunnelMetrics, TripsFunnelMetrics, MonthlyTarget, ViewType } from './types'
import { getMonthDateRange } from './utils'

// ============================================
// PIPELINE IDs - Active Campaign
// ============================================
// Wedding Pipelines (WW):
//   1  = SDR Weddings
//   3  = Closer Weddings
//   4  = Planejamento Weddings
//   17 = WW - Internacional
//   31 = Outros Desqualificados | Wedding
//
// Elopement Pipeline:
//   12 = Elopment Wedding
//
// Trips Pipelines (WT):
//   6  = Consultoras TRIPS
//   8  = SDR - Trips
//   34 = WTN - Desqualificados
// ============================================

// Wedding Pipeline IDs (leads count in all, MQL only in 1, 3, 4)
const WW_PIPELINE_IDS = [1, 3, 4, 17, 31]
const WW_MQL_PIPELINE_IDS = [1, 3, 4]

// Elopement Pipeline ID
const ELOPEMENT_PIPELINE_ID = 12

// Trips Pipeline IDs (MQL excludes desqualificados)
const TRIPS_PIPELINE_IDS = [6, 8, 34]
const TRIPS_MQL_PIPELINE_IDS = [6, 8]

// Fetch deals for a specific month and view type
export async function fetchDealsForMonth(
  year: number,
  month: number,
  viewType: ViewType
): Promise<Deal[]> {
  const { start, end } = getMonthDateRange(year, month)

  if (viewType === 'elopement') {
    // Elopement: pipeline_id = 12 OR title starts with 'EW'
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .or(`pipeline_id.eq.${ELOPEMENT_PIPELINE_ID},title.ilike.EW%`)

    if (error) {
      console.error('Error fetching elopement deals:', error)
      return []
    }
    return data as Deal[]
  } else if (viewType === 'trips') {
    // Trips: pipeline_id IN (6, 8, 34)
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .in('pipeline_id', TRIPS_PIPELINE_IDS)

    if (error) {
      console.error('Error fetching trips deals:', error)
      return []
    }
    return data as Deal[]
  } else {
    // Wedding: pipeline_id IN (1, 3, 4, 17, 31) AND title NOT starts with 'EW'
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .in('pipeline_id', WW_PIPELINE_IDS)
      .not('title', 'ilike', 'EW%')

    if (error) {
      console.error('Error fetching wedding deals:', error)
      return []
    }
    return data as Deal[]
  }
}

// Pipeline names (for backwards compatibility with existing data)
const WW_PIPELINE_NAMES = ['SDR Weddings', 'Closer Weddings', 'Planejamento Weddings', 'WW - Internacional', 'Outros Desqualificados | Wedding']
const WW_MQL_PIPELINE_NAMES = ['SDR Weddings', 'Closer Weddings', 'Planejamento Weddings']
const TRIPS_PIPELINE_NAMES = ['Consultoras TRIPS', 'SDR - Trips', 'WTN - Desqualificados']
const TRIPS_MQL_PIPELINE_NAMES = ['Consultoras TRIPS', 'SDR - Trips']

// Helper to check if a date falls within a specific month
function isInMonth(dateStr: string | null, year: number, month: number): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  return date.getFullYear() === year && date.getMonth() + 1 === month
}

// Helper to check if deal is Elopement
// Elopement = title starts with EW OR pipeline_id = 12
function isElopement(deal: Deal): boolean {
  if (deal.pipeline_id === ELOPEMENT_PIPELINE_ID) return true
  if (deal.title?.startsWith('EW')) return true
  return false
}

// Helper to check if deal was created in a specific month
function isCreatedInMonth(deal: Deal, year: number, month: number): boolean {
  if (!deal.created_at) return false
  const date = new Date(deal.created_at)
  return date.getFullYear() === year && date.getMonth() + 1 === month
}

// Helper to check if deal is in WW pipeline
function isInWwPipeline(deal: Deal): boolean {
  if (deal.pipeline_id && WW_PIPELINE_IDS.includes(deal.pipeline_id)) return true
  if (deal.pipeline && WW_PIPELINE_NAMES.includes(deal.pipeline)) return true
  return false
}

// Helper to check if deal is in WW MQL pipeline
function isInWwMqlPipeline(deal: Deal): boolean {
  if (deal.pipeline_id && WW_MQL_PIPELINE_IDS.includes(deal.pipeline_id)) return true
  if (deal.pipeline && WW_MQL_PIPELINE_NAMES.includes(deal.pipeline)) return true
  return false
}

// Helper to check if deal is in Trips pipeline
function isInTripsPipeline(deal: Deal): boolean {
  if (deal.pipeline_id && TRIPS_PIPELINE_IDS.includes(deal.pipeline_id)) return true
  if (deal.pipeline && TRIPS_PIPELINE_NAMES.includes(deal.pipeline)) return true
  return false
}

// Helper to check if deal is in Trips MQL pipeline
function isInTripsMqlPipeline(deal: Deal): boolean {
  if (deal.pipeline_id && TRIPS_MQL_PIPELINE_IDS.includes(deal.pipeline_id)) return true
  if (deal.pipeline && TRIPS_MQL_PIPELINE_NAMES.includes(deal.pipeline)) return true
  return false
}

// Calculate funnel metrics from deals
// WW Funnel: Lead -> MQL -> Agendamento -> Reuniao -> Qualificado -> Closer Agendada -> Closer Realizada -> Venda
export function calculateFunnelMetrics(deals: Deal[], year: number, month: number): FunnelMetrics {
  // Leads: pipes 1, 3, 4, 17, 31 + exclude Elopement + CREATED IN MONTH
  const leadsDeals = deals.filter(d =>
    isInWwPipeline(d) &&
    !isElopement(d) &&
    isCreatedInMonth(d, year, month)
  )

  // MQL: only pipes 1, 3, 4 + exclude Elopement + CREATED IN MONTH
  const mqlDeals = deals.filter(d =>
    isInWwMqlPipeline(d) &&
    !isElopement(d) &&
    isCreatedInMonth(d, year, month)
  )

  // All WW deals (for metrics that can include deals created in other months)
  const allWwDeals = deals.filter(d =>
    isInWwPipeline(d) &&
    !isElopement(d)
  )

  return {
    leads: leadsDeals.length,
    mql: mqlDeals.length,
    // Agendamento: data_reuniao_1 falls within the selected month (can be from other months)
    agendamento: allWwDeals.filter(d => isInMonth(d.data_reuniao_1, year, month)).length,
    // Reuniao: agendamento in month + como_reuniao_1 filled + not "Não teve reunião"
    reunioes: allWwDeals.filter(d =>
      isInMonth(d.data_reuniao_1, year, month) &&
      d.como_reuniao_1 !== null &&
      d.como_reuniao_1 !== '' &&
      d.como_reuniao_1 !== 'Não teve reunião'
    ).length,
    // Qualificado: data_qualificado in month
    qualificado: allWwDeals.filter(d => isInMonth(d.data_qualificado, year, month)).length,
    // Closer Agendada: data_closer falls within the selected month
    closerAgendada: allWwDeals.filter(d => isInMonth(d.data_closer, year, month)).length,
    // Closer Realizada: data_closer in month + reuniao_closer filled
    closerRealizada: allWwDeals.filter(d =>
      isInMonth(d.data_closer, year, month) &&
      d.reuniao_closer !== null &&
      d.reuniao_closer !== ''
    ).length,
    // Venda: data_fechamento falls within the selected month (can be from other months)
    vendas: allWwDeals.filter(d => isInMonth(d.data_fechamento, year, month)).length,
  }
}

// Calculate Elopement funnel metrics (simpler: just leads and vendas)
export function calculateElopementMetrics(deals: Deal[], year: number, month: number): FunnelMetrics {
  // Elopement leads: all deals created in month (no pipeline filter)
  const leadsCount = deals.filter(d => isCreatedInMonth(d, year, month)).length

  // Elopement vendas: data_fechamento in month
  const vendasCount = deals.filter(d => isInMonth(d.data_fechamento, year, month)).length

  return {
    leads: leadsCount,
    mql: 0,
    agendamento: 0,
    reunioes: 0,
    qualificado: 0,
    closerAgendada: 0,
    closerRealizada: 0,
    vendas: vendasCount,
  }
}

// Fetch deals with data_closer in the selected month (not created_at)
export async function fetchClosersForMonth(
  year: number,
  month: number,
  viewType: ViewType
): Promise<{ count: number; deals: Deal[] }> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

  if (viewType === 'elopement' || viewType === 'trips') {
    return { count: 0, deals: [] } // Elopement and Trips don't track closers
  }

  // Wedding: NOT (pipeline_id = 12 OR title starts with 'EW')
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .gte('data_closer', startDate)
    .lt('data_closer', endDate)
    .not('pipeline_id', 'eq', ELOPEMENT_PIPELINE_ID)
    .not('title', 'ilike', 'EW%')

  if (error) {
    console.error('Error fetching closers:', error)
    return { count: 0, deals: [] }
  }
  return { count: data?.length || 0, deals: data as Deal[] }
}

// Fetch vendas count based on data_fechamento (not created_at)
export async function fetchVendasForMonth(
  year: number,
  month: number,
  viewType: ViewType
): Promise<{ count: number; deals: Deal[] }> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

  if (viewType === 'elopement') {
    // Elopement: pipeline_id = 12 OR title starts with 'EW'
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .gte('data_fechamento', startDate)
      .lt('data_fechamento', endDate)
      .or(`pipeline_id.eq.${ELOPEMENT_PIPELINE_ID},title.ilike.EW%`)

    if (error) {
      console.error('Error fetching elopement vendas:', error)
      return { count: 0, deals: [] }
    }
    return { count: data?.length || 0, deals: data as Deal[] }
  } else if (viewType === 'trips') {
    // Trips doesn't track vendas in the same way
    return { count: 0, deals: [] }
  } else {
    // Wedding: NOT (pipeline_id = 12 OR title starts with 'EW')
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .gte('data_fechamento', startDate)
      .lt('data_fechamento', endDate)
      .not('pipeline_id', 'eq', ELOPEMENT_PIPELINE_ID)
      .not('title', 'ilike', 'EW%')

    if (error) {
      console.error('Error fetching wedding vendas:', error)
      return { count: 0, deals: [] }
    }
    return { count: data?.length || 0, deals: data as Deal[] }
  }
}

// Fetch monthly target
export async function fetchMonthlyTarget(
  year: number,
  month: number,
  viewType: ViewType
): Promise<MonthlyTarget | null> {
  const monthStr = `${year}-${String(month).padStart(2, '0')}-01`
  const pipelineType = viewType === 'elopement' ? 'elopement' : 'wedding'

  const { data, error } = await supabase
    .from('monthly_targets')
    .select('*')
    .eq('month', monthStr)
    .eq('pipeline_type', pipelineType)
    .maybeSingle()

  if (error) {
    console.error('Error fetching target:', error)
    return null
  }

  return data as MonthlyTarget | null
}

// Fetch previous month metrics for comparison
export async function fetchPreviousMonthMetrics(
  year: number,
  month: number,
  viewType: ViewType
): Promise<FunnelMetrics> {
  let prevYear = year
  let prevMonth = month - 1

  if (prevMonth === 0) {
    prevMonth = 12
    prevYear = year - 1
  }

  const [deals, vendasData, closersData] = await Promise.all([
    fetchDealsForMonth(prevYear, prevMonth, viewType),
    fetchVendasForMonth(prevYear, prevMonth, viewType),
    fetchClosersForMonth(prevYear, prevMonth, viewType),
  ])

  // Combine deals with vendas and closer deals (deduplicated)
  const existingIds = new Set(deals.map(d => d.id))
  const allDeals = [
    ...deals,
    ...vendasData.deals.filter(d => !existingIds.has(d.id)),
    ...closersData.deals.filter(d => !existingIds.has(d.id) && !vendasData.deals.some(vd => vd.id === d.id))
  ]

  const metrics = calculateFunnelMetrics(allDeals, prevYear, prevMonth)
  return { ...metrics, vendas: vendasData.count }
}

// Get all available months with data
export async function getAvailableMonths(): Promise<{ year: number; month: number }[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('created_at')
    .order('created_at', { ascending: true })

  if (error || !data) {
    return []
  }

  const months = new Set<string>()
  data.forEach(d => {
    if (d.created_at) {
      const date = new Date(d.created_at)
      months.add(`${date.getFullYear()}-${date.getMonth() + 1}`)
    }
  })

  return Array.from(months).map(m => {
    const [year, month] = m.split('-').map(Number)
    return { year, month }
  })
}

// Meta Ads spend data
export interface MetaAdsData {
  spend: number
  impressions: number
  clicks: number
  cpc: number
  cpm: number
}

export async function fetchMetaAdsSpend(
  year: number,
  month: number
): Promise<MetaAdsData> {
  try {
    // Fetch from cache (updated daily by cron) - conta única
    const { data, error } = await supabase
      .from('ads_spend_cache')
      .select('spend, impressions, clicks, cpc, cpm')
      .eq('year', year)
      .eq('month', month)
      .eq('source', 'meta_ads')
      .is('pipeline', null)
      .maybeSingle()

    if (error || !data) {
      console.error('Error fetching Meta Ads from cache:', error)
      return { spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0 }
    }

    return {
      spend: Number(data.spend) || 0,
      impressions: data.impressions || 0,
      clicks: data.clicks || 0,
      cpc: Number(data.cpc) || 0,
      cpm: Number(data.cpm) || 0,
    }
  } catch (error) {
    console.error('Error fetching Meta Ads data:', error)
    return { spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0 }
  }
}

// Google Ads spend data (same interface as Meta)
export async function fetchGoogleAdsSpend(
  year: number,
  month: number
): Promise<MetaAdsData> {
  try {
    // Fetch from cache (updated daily by cron)
    const { data, error } = await supabase
      .from('ads_spend_cache')
      .select('spend, impressions, clicks, cpc, cpm')
      .eq('year', year)
      .eq('month', month)
      .eq('source', 'google_ads')
      .is('pipeline', null)
      .maybeSingle()

    if (error || !data) {
      console.error('Error fetching Google Ads from cache:', error)
      return { spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0 }
    }

    return {
      spend: Number(data.spend) || 0,
      impressions: data.impressions || 0,
      clicks: data.clicks || 0,
      cpc: Number(data.cpc) || 0,
      cpm: Number(data.cpm) || 0,
    }
  } catch (error) {
    console.error('Error fetching Google Ads data:', error)
    return { spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0 }
  }
}

// ============================================
// TRIPS FUNCTIONS
// ============================================

// Fetch Trips deals for a specific month
export async function fetchTripsDealsForMonth(
  year: number,
  month: number
): Promise<Deal[]> {
  const { start, end } = getMonthDateRange(year, month)

  // Use pipeline_id for more reliable filtering
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .in('pipeline_id', TRIPS_PIPELINE_IDS)

  if (error) {
    console.error('Error fetching trips deals:', error)
    return []
  }
  return data as Deal[]
}

// Calculate Trips funnel metrics (5 stages)
// Funnel: Lead -> MQL -> Agendamento -> Reunião -> Taxa
export function calculateTripsFunnelMetrics(deals: Deal[], year: number, month: number): TripsFunnelMetrics {
  // Leads: pipes 6, 8, 34 + CREATED IN MONTH
  const leadsDeals = deals.filter(d =>
    isInTripsPipeline(d) &&
    isCreatedInMonth(d, year, month)
  )

  // MQL: only pipes 6, 8 + CREATED IN MONTH
  const mqlDeals = deals.filter(d =>
    isInTripsMqlPipeline(d) &&
    isCreatedInMonth(d, year, month)
  )

  // All Trips deals (for metrics that can include deals created in other months)
  const allTripsDeals = deals.filter(d =>
    isInTripsPipeline(d)
  )

  return {
    leads: leadsDeals.length,
    mql: mqlDeals.length,
    // Agendamento: data_reuniao_trips falls within the selected month
    agendamento: allTripsDeals.filter(d => isInMonth(d.data_reuniao_trips, year, month)).length,
    // Reunião: agendamento in month + como_reuniao_trips filled
    reunioes: allTripsDeals.filter(d =>
      isInMonth(d.data_reuniao_trips, year, month) &&
      d.como_reuniao_trips !== null &&
      d.como_reuniao_trips !== ''
    ).length,
    // Taxa: pagou_taxa = true
    taxa: allTripsDeals.filter(d => d.pagou_taxa === true).length,
  }
}

// Fetch Taxa count for Trips (deals that paid the fee)
export async function fetchTaxaForMonth(
  year: number,
  month: number
): Promise<{ count: number; deals: Deal[] }> {
  // Taxa is not date-bound in the same way as vendas
  // We count all deals in Trips pipelines with pagou_taxa = true
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .in('pipeline_id', TRIPS_PIPELINE_IDS)
    .eq('pagou_taxa', true)

  if (error) {
    console.error('Error fetching trips taxa:', error)
    return { count: 0, deals: [] }
  }

  // Filter by created_at month if needed, or return all
  const filteredDeals = (data as Deal[]).filter(d => isCreatedInMonth(d, year, month))

  return { count: filteredDeals.length, deals: filteredDeals }
}

// Fetch previous month metrics for Trips
export async function fetchPreviousTripsMetrics(
  year: number,
  month: number
): Promise<TripsFunnelMetrics> {
  let prevYear = year
  let prevMonth = month - 1

  if (prevMonth === 0) {
    prevMonth = 12
    prevYear = year - 1
  }

  const deals = await fetchTripsDealsForMonth(prevYear, prevMonth)
  return calculateTripsFunnelMetrics(deals, prevYear, prevMonth)
}

// Fetch monthly target for Trips
export async function fetchTripsMonthlyTarget(
  year: number,
  month: number
): Promise<MonthlyTarget | null> {
  const monthStr = `${year}-${String(month).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('monthly_targets')
    .select('*')
    .eq('month', monthStr)
    .eq('pipeline_type', 'trips')
    .maybeSingle()

  if (error) {
    console.error('Error fetching trips target:', error)
    return null
  }

  return data as MonthlyTarget | null
}
