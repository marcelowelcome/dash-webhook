import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const META_API_VERSION = 'v19.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`
const GOOGLE_ADS_API_VERSION = 'v17'

interface MetaInsightsResponse {
  data?: Array<{
    spend: string
    impressions: string
    clicks: string
    cpc: string
    cpm: string
  }>
  error?: { message: string }
}

interface GoogleAdsResponse {
  results?: Array<{
    metrics: {
      costMicros: string
      impressions: string
      clicks: string
    }
  }>
  error?: { message: string }
}

interface TokenResponse {
  access_token: string
  error?: string
}

async function getGoogleAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    return null
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  const data: TokenResponse = await response.json()
  return data.error ? null : data.access_token
}

async function fetchMetaAdsData(year: number, month: number) {
  const accessToken = process.env.META_ADS_ACCESS_TOKEN
  const accountId = process.env.META_ADS_ACCOUNT_ID

  if (!accessToken || !accountId) {
    console.log('Meta Ads: Missing credentials')
    return { spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0 }
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const url = new URL(`${META_API_BASE}/${accountId}/insights`)
  url.searchParams.set('fields', 'spend,impressions,clicks,cpc,cpm')
  url.searchParams.set('time_range', JSON.stringify({ since: startDate, until: endDate }))
  url.searchParams.set('access_token', accessToken)

  const response = await fetch(url.toString())
  const data: MetaInsightsResponse = await response.json()

  if (data.error || !data.data?.[0]) {
    return { spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0 }
  }

  const insights = data.data[0]
  return {
    spend: parseFloat(insights.spend) || 0,
    impressions: parseInt(insights.impressions) || 0,
    clicks: parseInt(insights.clicks) || 0,
    cpc: parseFloat(insights.cpc) || 0,
    cpm: parseFloat(insights.cpm) || 0,
  }
}

async function fetchGoogleAdsData(year: number, month: number) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN

  if (!customerId || !developerToken) {
    console.log('Google Ads: Missing credentials (customerId or developerToken)')
    return { spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0 }
  }

  const accessToken = await getGoogleAccessToken()
  if (!accessToken) {
    console.log('Google Ads: Failed to get access token')
    return { spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0 }
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const query = `
    SELECT metrics.cost_micros, metrics.impressions, metrics.clicks
    FROM customer
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
  `

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json',
  }

  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId
  }

  const response = await fetch(
    `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:search`,
    { method: 'POST', headers, body: JSON.stringify({ query }) }
  )

  const data: GoogleAdsResponse = await response.json()

  if (data.error || !data.results) {
    return { spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0 }
  }

  let totalCostMicros = 0
  let totalImpressions = 0
  let totalClicks = 0

  for (const result of data.results) {
    totalCostMicros += parseInt(result.metrics.costMicros || '0')
    totalImpressions += parseInt(result.metrics.impressions || '0')
    totalClicks += parseInt(result.metrics.clicks || '0')
  }

  const spend = totalCostMicros / 1_000_000

  return {
    spend,
    impressions: totalImpressions,
    clicks: totalClicks,
    cpc: totalClicks > 0 ? spend / totalClicks : 0,
    cpm: totalImpressions > 0 ? (spend / totalImpressions) * 1000 : 0,
  }
}

export async function GET(request: NextRequest) {
  // Verify authorization (Vercel Cron sends this header)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Allow Vercel Cron or manual call with secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // Refresh current month and previous month
    const monthsToRefresh = [
      { year: currentYear, month: currentMonth },
      { year: currentMonth === 1 ? currentYear - 1 : currentYear, month: currentMonth === 1 ? 12 : currentMonth - 1 },
    ]

    const results: Array<{ year: number; month: number; source: string; pipeline: string | null; success: boolean }> = []

    for (const { year, month } of monthsToRefresh) {
      // Meta Ads (conta única)
      const metaAds = await fetchMetaAdsData(year, month)
      const { error: metaError } = await supabase
        .from('ads_spend_cache')
        .upsert({
          year,
          month,
          source: 'meta_ads',
          pipeline: null,
          spend: metaAds.spend,
          impressions: metaAds.impressions,
          clicks: metaAds.clicks,
          cpc: metaAds.cpc,
          cpm: metaAds.cpm,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'year,month,source,pipeline' })

      results.push({ year, month, source: 'meta_ads', pipeline: null, success: !metaError })

      // Google Ads (conta única)
      const googleAds = await fetchGoogleAdsData(year, month)
      const { error: googleError } = await supabase
        .from('ads_spend_cache')
        .upsert({
          year,
          month,
          source: 'google_ads',
          pipeline: null,
          spend: googleAds.spend,
          impressions: googleAds.impressions,
          clicks: googleAds.clicks,
          cpc: googleAds.cpc,
          cpm: googleAds.cpm,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'year,month,source,pipeline' })

      results.push({ year, month, source: 'google_ads', pipeline: null, success: !googleError })
    }

    return NextResponse.json({
      success: true,
      refreshedAt: new Date().toISOString(),
      results,
    })
  } catch (error) {
    console.error('Error refreshing ads cache:', error)
    return NextResponse.json({ error: 'Failed to refresh ads cache' }, { status: 500 })
  }
}

// POST also works for manual triggers
export { GET as POST }
