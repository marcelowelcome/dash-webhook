import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const GOOGLE_ADS_API_VERSION = 'v17'

const QuerySchema = z.object({
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().min(1).max(12),
})

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  error?: string
  error_description?: string
}

interface GoogleAdsResponse {
  results?: Array<{
    metrics: {
      costMicros: string
      impressions: string
      clicks: string
    }
  }>
  error?: {
    message: string
    code: number
  }
}

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('Missing Google OAuth credentials')
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

  if (data.error) {
    console.error('Token error:', data.error_description)
    return null
  }

  return data.access_token
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const parsed = QuerySchema.safeParse({
      year: searchParams.get('year'),
      month: searchParams.get('month'),
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { year, month } = parsed.data
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID
    const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN

    if (!customerId || !developerToken) {
      return NextResponse.json(
        { error: 'Google Ads credentials not configured' },
        { status: 500 }
      )
    }

    const accessToken = await getAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to get access token' },
        { status: 500 }
      )
    }

    // Calculate date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // Google Ads Query Language (GAQL)
    const query = `
      SELECT
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks
      FROM customer
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    `

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    }

    // Add login-customer-id header if using MCC
    if (loginCustomerId) {
      headers['login-customer-id'] = loginCustomerId
    }

    const response = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      }
    )

    const data: GoogleAdsResponse = await response.json()

    if (data.error) {
      console.error('Google Ads API Error:', data.error)
      return NextResponse.json(
        { error: data.error.message },
        { status: 400 }
      )
    }

    // Parse the response - aggregate all results
    let totalCostMicros = 0
    let totalImpressions = 0
    let totalClicks = 0

    if (data.results) {
      for (const result of data.results) {
        totalCostMicros += parseInt(result.metrics.costMicros || '0')
        totalImpressions += parseInt(result.metrics.impressions || '0')
        totalClicks += parseInt(result.metrics.clicks || '0')
      }
    }

    // Convert micros to actual currency (divide by 1,000,000)
    const spend = totalCostMicros / 1_000_000

    return NextResponse.json({
      spend,
      impressions: totalImpressions,
      clicks: totalClicks,
      cpc: totalClicks > 0 ? spend / totalClicks : 0,
      cpm: totalImpressions > 0 ? (spend / totalImpressions) * 1000 : 0,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      source: 'google_ads',
    })
  } catch (error) {
    console.error('Error fetching Google Ads data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Google Ads data' },
      { status: 500 }
    )
  }
}
