import { supabase } from './supabase'
import type { Deal, FunnelMetrics, TripsFunnelMetrics, MonthlyTarget, ViewType } from './types'
import { getMonthDateRange } from './utils'

// Fetch deals for a specific month and view type
export async function fetchDealsForMonth(
  year: number,
  month: number,
  viewType: ViewType
): Promise<Deal[]> {
  const { start, end } = getMonthDateRange(year, month)

  if (viewType === 'elopement') {
    // Elopement: is_elopement = true OR title starts with 'EW'
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .or('is_elopement.eq.true,title.ilike.EW%')

    if (error) {
      console.error('Error fetching elopement deals:', error)
      return []
    }
    return data as Deal[]
  } else {
    // Wedding: is_elopement = false AND title doesn't start with 'EW'
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .eq('is_elopement', false)
      .not('title', 'ilike', 'EW%')

    if (error) {
      console.error('Error fetching wedding deals:', error)
      return []
    }
    return data as Deal[]
  }
}

// WW Pipelines
// Leads Pipelines: 1 (SDR), 3 (Closer), 4 (Planejamento), 17 (Internacional), 31 (Desqualificados)
const LEADS_PIPELINES = ['SDR Weddings', 'Closer Weddings', 'Planejamento Weddings', 'WW - Internacional', 'Outros Desqualificados | Wedding']

// MQL Pipelines: only 1 (SDR), 3 (Closer), 4 (Planejamento)
const MQL_PIPELINES = ['SDR Weddings', 'Closer Weddings', 'Planejamento Weddings']

// Trips Pipelines
// Leads: Pipe 6 (Consultoras), Pipe 8 (SDR), Pipe 34 (Desqualificados)
const TRIPS_LEADS_PIPELINES = ['Consultoras TRIPS', 'SDR - Trips', 'WTN - Desqualificados']

// MQL: Pipe 6 (Consultoras), Pipe 8 (SDR) - excludes desqualificados
const TRIPS_MQL_PIPELINES = ['Consultoras TRIPS', 'SDR - Trips']

// Helper to check if a date falls within a specific month
function isInMonth(dateStr: string | null, year: number, month: number): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  return date.getFullYear() === year && date.getMonth() + 1 === month
}

// Helper to check if deal is Elopement (title starts with EW only)
// DW = Destination Wedding, counts in WW General
function isElopementTitle(title: string | null): boolean {
  if (!title) return false
  return title.startsWith('EW')
}

// Helper to check if deal was created in a specific month
function isCreatedInMonth(deal: Deal, year: number, month: number): boolean {
  if (!deal.created_at) return false
  const date = new Date(deal.created_at)
  return date.getFullYear() === year && date.getMonth() + 1 === month
}

// Calculate funnel metrics from deals
// WW Funnel: Lead -> MQL -> Agendamento -> Reuniao -> Qualificado -> Closer Agendada -> Closer Realizada -> Venda
export function calculateFunnelMetrics(deals: Deal[], year: number, month: number): FunnelMetrics {
  // Leads: pipes 1, 3, 4, 17, 31 + exclude EW titles + CREATED IN MONTH
  const leadsDeals = deals.filter(d =>
    d.pipeline &&
    LEADS_PIPELINES.includes(d.pipeline) &&
    !isElopementTitle(d.title) &&
    isCreatedInMonth(d, year, month)
  )

  // MQL: only pipes 1, 3, 4 + exclude EW titles + CREATED IN MONTH
  const mqlDeals = deals.filter(d =>
    d.pipeline &&
    MQL_PIPELINES.includes(d.pipeline) &&
    !isElopementTitle(d.title) &&
    isCreatedInMonth(d, year, month)
  )

  // All WW deals (for metrics that can include deals created in other months)
  const allWwDeals = deals.filter(d =>
    d.pipeline &&
    LEADS_PIPELINES.includes(d.pipeline) &&
    !isElopementTitle(d.title)
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

  if (viewType === 'elopement') {
    return { count: 0, deals: [] } // Elopement doesn't track closers
  }

  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .gte('data_closer', startDate)
    .lt('data_closer', endDate)
    .eq('is_elopement', false)
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
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .gte('data_fechamento', startDate)
      .lt('data_fechamento', endDate)
      .or('is_elopement.eq.true,title.ilike.EW%')

    if (error) {
      console.error('Error fetching elopement vendas:', error)
      return { count: 0, deals: [] }
    }
    return { count: data?.length || 0, deals: data as Deal[] }
  } else {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .gte('data_fechamento', startDate)
      .lt('data_fechamento', endDate)
      .eq('is_elopement', false)
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
  month: number,
  pipeline: ViewType
): Promise<MetaAdsData> {
  try {
    // Fetch from cache (updated daily by cron)
    const { data, error } = await supabase
      .from('ads_spend_cache')
      .select('spend, impressions, clicks, cpc, cpm')
      .eq('year', year)
      .eq('month', month)
      .eq('source', 'meta_ads')
      .eq('pipeline', pipeline)
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

  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .in('pipeline', TRIPS_LEADS_PIPELINES)

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
    d.pipeline &&
    TRIPS_LEADS_PIPELINES.includes(d.pipeline) &&
    isCreatedInMonth(d, year, month)
  )

  // MQL: only pipes 6, 8 + CREATED IN MONTH
  const mqlDeals = deals.filter(d =>
    d.pipeline &&
    TRIPS_MQL_PIPELINES.includes(d.pipeline) &&
    isCreatedInMonth(d, year, month)
  )

  // All Trips deals (for metrics that can include deals created in other months)
  const allTripsDeals = deals.filter(d =>
    d.pipeline &&
    TRIPS_LEADS_PIPELINES.includes(d.pipeline)
  )

  return {
    leads: leadsDeals.length,
    mql: mqlDeals.length,
    // Agendamento: data_e_hor_rio_do_agendamento_da_1a_reuni_o_sdr_trips falls within the selected month
    agendamento: allTripsDeals.filter(d => isInMonth(d.data_e_hor_rio_do_agendamento_da_1a_reuni_o_sdr_trips, year, month)).length,
    // Reunião: agendamento in month + como_foi_feita_a_1a_reuni_o_sdr_trips filled
    reunioes: allTripsDeals.filter(d =>
      isInMonth(d.data_e_hor_rio_do_agendamento_da_1a_reuni_o_sdr_trips, year, month) &&
      d.como_foi_feita_a_1a_reuni_o_sdr_trips !== null &&
      d.como_foi_feita_a_1a_reuni_o_sdr_trips !== ''
    ).length,
    // Taxa: pagou_a_taxa = true
    taxa: allTripsDeals.filter(d => d.pagou_a_taxa === true).length,
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
    .in('pipeline', TRIPS_LEADS_PIPELINES)
    .eq('pagou_a_taxa', true)

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
