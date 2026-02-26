'use client'

import { useState } from 'react'
import { formatPercent, formatCurrency, calcAchievement, calcShouldBe, calcTripsFunnelCVR } from '@/lib/utils'
import type { TripsFunnelMetrics, MonthlyTarget, Deal } from '@/lib/types'
import { DealsModal } from './DealsModal'

interface TripsTableProps {
  metrics: TripsFunnelMetrics
  target: MonthlyTarget | null
  previousMetrics: TripsFunnelMetrics | null
  monthProgress: number
  cpl: number
  deals?: Deal[]
  year?: number
  month?: number
  impressions?: number
  clicks?: number
}

const FUNNEL_COLUMNS = [
  'Leads',
  'MQL',
  'Agendamento',
  'Reuniões',
  'Taxa',
]

// Trips Pipelines
const TRIPS_LEADS_PIPELINES = ['Consultoras TRIPS', 'SDR - Trips', 'WTN - Desqualificados']
const TRIPS_MQL_PIPELINES = ['Consultoras TRIPS', 'SDR - Trips']

// Helper to check if a date falls within a specific month
function isInMonth(dateStr: string | null, year: number, month: number): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  return date.getFullYear() === year && date.getMonth() + 1 === month
}

type StageKey = 'leads' | 'mql' | 'agendamento' | 'reunioes' | 'taxa'

export function TripsTable({
  metrics,
  target,
  previousMetrics,
  monthProgress,
  cpl,
  deals = [],
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1,
  impressions = 0,
  clicks = 0,
}: TripsTableProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalDeals, setModalDeals] = useState<Deal[]>([])
  const [modalStageKey, setModalStageKey] = useState<StageKey>('leads')

  // Helper to check if deal was created in the selected month
  const isCreatedInMonth = (d: Deal): boolean => {
    if (!d.created_at) return false
    const date = new Date(d.created_at)
    return date.getFullYear() === year && date.getMonth() + 1 === month
  }

  // Filter deals by stage - these are the deals that will appear in modal
  const getDealsForStage = (stage: StageKey): Deal[] => {
    switch (stage) {
      case 'leads':
        return deals.filter(d =>
          d.pipeline &&
          TRIPS_LEADS_PIPELINES.includes(d.pipeline) &&
          isCreatedInMonth(d)
        )
      case 'mql':
        return deals.filter(d =>
          d.pipeline &&
          TRIPS_MQL_PIPELINES.includes(d.pipeline) &&
          isCreatedInMonth(d)
        )
      case 'agendamento':
        return deals.filter(d => isInMonth(d.data_e_hor_rio_do_agendamento_da_1a_reuni_o_sdr_trips, year, month))
      case 'reunioes':
        return deals.filter(d =>
          isInMonth(d.data_e_hor_rio_do_agendamento_da_1a_reuni_o_sdr_trips, year, month) &&
          d.como_foi_feita_a_1a_reuni_o_sdr_trips !== null &&
          d.como_foi_feita_a_1a_reuni_o_sdr_trips !== ''
        )
      case 'taxa':
        return deals.filter(d => d.pagou_a_taxa === true)
      default:
        return []
    }
  }

  // Calculate actual metrics from deals (ensures table matches modal)
  const actualMetrics: TripsFunnelMetrics = {
    leads: getDealsForStage('leads').length,
    mql: getDealsForStage('mql').length,
    agendamento: getDealsForStage('agendamento').length,
    reunioes: getDealsForStage('reunioes').length,
    taxa: getDealsForStage('taxa').length,
  }

  const cvr = calcTripsFunnelCVR(actualMetrics)
  const prevCvr = previousMetrics ? calcTripsFunnelCVR(previousMetrics) : null

  const handleStageClick = (stage: StageKey, title: string) => {
    if (!deals.length) return
    setModalTitle(title)
    setModalDeals(getDealsForStage(stage))
    setModalStageKey(stage)
    setModalOpen(true)
  }

  // Default target if none exists
  const defaultTarget = {
    leads: target?.leads || 0,
    mql: target?.mql || 0,
    agendamento: target?.agendamento || 0,
    reunioes: target?.reunioes || 0,
    taxa: target?.taxa || 0,
    cpl: target?.cpl || 0,
  }

  // Clickable metrics for the "Realizado" row - use actualMetrics to match modal
  const clickableStages: { stage: StageKey; label: string; value: number }[] = [
    { stage: 'leads', label: 'Leads', value: actualMetrics.leads },
    { stage: 'mql', label: 'MQL', value: actualMetrics.mql },
    { stage: 'agendamento', label: 'Agendamento', value: actualMetrics.agendamento },
    { stage: 'reunioes', label: 'Reuniões', value: actualMetrics.reunioes },
    { stage: 'taxa', label: 'Taxa', value: actualMetrics.taxa },
  ]

  // Atingimento = Realizado / Deveria
  const shouldBeLeads = calcShouldBe(defaultTarget.leads, monthProgress)
  const shouldBeMql = calcShouldBe(defaultTarget.mql, monthProgress)
  const shouldBeAgendamento = calcShouldBe(defaultTarget.agendamento, monthProgress)
  const shouldBeReunioes = calcShouldBe(defaultTarget.reunioes, monthProgress)
  const shouldBeTaxa = calcShouldBe(defaultTarget.taxa, monthProgress)

  // Main funnel data (5 columns) - use actualMetrics to match modal
  const planejado = [
    defaultTarget.leads,
    defaultTarget.mql,
    defaultTarget.agendamento,
    defaultTarget.reunioes,
    defaultTarget.taxa,
  ]

  const realizado = [
    actualMetrics.leads,
    actualMetrics.mql,
    actualMetrics.agendamento,
    actualMetrics.reunioes,
    actualMetrics.taxa,
  ]

  const atingimento = [
    formatPercent(calcAchievement(actualMetrics.leads, shouldBeLeads) - 100),
    formatPercent(calcAchievement(actualMetrics.mql, shouldBeMql) - 100),
    formatPercent(calcAchievement(actualMetrics.agendamento, shouldBeAgendamento) - 100),
    formatPercent(calcAchievement(actualMetrics.reunioes, shouldBeReunioes) - 100),
    formatPercent(calcAchievement(actualMetrics.taxa, shouldBeTaxa) - 100),
  ]

  const deveria = [
    shouldBeLeads,
    shouldBeMql,
    shouldBeAgendamento,
    shouldBeReunioes,
    shouldBeTaxa,
  ]

  const periodoAnteriorPct = previousMetrics
    ? [
      formatPercent(calcAchievement(actualMetrics.leads, previousMetrics.leads) - 100),
      formatPercent(calcAchievement(actualMetrics.mql, previousMetrics.mql) - 100),
      formatPercent(calcAchievement(actualMetrics.agendamento, previousMetrics.agendamento) - 100),
      formatPercent(calcAchievement(actualMetrics.reunioes, previousMetrics.reunioes) - 100),
      formatPercent(calcAchievement(actualMetrics.taxa, previousMetrics.taxa) - 100),
    ]
    : Array(5).fill('')

  const periodoAnterior = previousMetrics
    ? [
      previousMetrics.leads,
      previousMetrics.mql,
      previousMetrics.agendamento,
      previousMetrics.reunioes,
      previousMetrics.taxa,
    ]
    : Array(5).fill('')

  const custos = [
    formatCurrency(cpl * actualMetrics.leads),
    formatCurrency(cpl * 1.5 * actualMetrics.mql),
    formatCurrency(cpl * 2 * actualMetrics.agendamento),
    formatCurrency(cpl * 2.5 * actualMetrics.reunioes),
    '',
  ]

  const rows = [
    { label: 'Planejado', data: planejado, className: 'row-planejado' },
    { label: 'Realizado', data: realizado, className: 'row-realizado' },
    { label: 'Atingimento (%)', data: atingimento, className: 'row-atingimento' },
    { label: 'Deveria', data: deveria, className: 'row-deveria' },
    { label: 'Período anterior (%)', data: periodoAnteriorPct, className: 'row-periodo-anterior-pct' },
    { label: 'Período Anterior', data: periodoAnterior, className: 'row-periodo-anterior' },
    { label: 'Custos', data: custos, className: 'row-custos' },
  ]

  // CVR cards data (4 conversions for Trips)
  const cvrCards = [
    { label: 'Leads → MQL', value: cvr.cvrMql, prev: prevCvr?.cvrMql, target: 60 },
    { label: 'MQL → Agend.', value: cvr.cvrAg, prev: prevCvr?.cvrAg, target: 40 },
    { label: 'Agend. → Reunião', value: cvr.cvrReu, prev: prevCvr?.cvrReu, target: 80 },
    { label: 'Reunião → Taxa', value: cvr.cvrTaxa, prev: prevCvr?.cvrTaxa, target: 20 },
  ]

  return (
    <>
      {/* Main Funnel Table */}
      <div className="overflow-x-auto">
        <table className="funnel-table">
          <thead>
            <tr>
              <th className="w-32"></th>
              {FUNNEL_COLUMNS.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={row.className}>
                <td className="row-label">{row.label}</td>
                {row.data.map((value, colIndex) => {
                  const isRealizadoRow = row.label === 'Realizado'
                  const isClickable = isRealizadoRow && colIndex < 5 && deals.length > 0

                  return (
                    <td
                      key={colIndex}
                      className={`${typeof value === 'string' && value.startsWith('-') ? 'negative' : ''
                        } ${isClickable ? 'cell-clickable' : ''}`}
                      onClick={isClickable ? () => handleStageClick(clickableStages[colIndex].stage, clickableStages[colIndex].label) : undefined}
                    >
                      {isClickable ? (
                        <span className="underline decoration-dotted decoration-wedding-gold/50">{value}</span>
                      ) : (
                        value
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Metrics Cards Section */}
      <div className="mt-6 space-y-4">
        {/* CPL & Conversão Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="metric-card">
            <div className="metric-card-label">CPL</div>
            <div className="metric-card-value">{formatCurrency(cpl)}</div>
            <div className="metric-card-target">Meta: {formatCurrency(defaultTarget.cpl)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-label">Conversão Total</div>
            <div className="metric-card-value text-wedding-gold">{formatPercent(cvr.conversaoTotal)}</div>
            <div className="metric-card-target">Leads → Taxa</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-label">Custo por Taxa</div>
            <div className="metric-card-value">
              {actualMetrics.taxa > 0 ? formatCurrency((cpl * actualMetrics.leads) / actualMetrics.taxa) : '—'}
            </div>
            <div className="metric-card-target">Investimento / Taxas</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-label">Média Score</div>
            <div className="metric-card-value">50</div>
            <div className="metric-card-target">Qualidade dos Leads</div>
          </div>
        </div>

        {/* CVR Flow */}
        <div className="cvr-flow">
          <div className="cvr-flow-title">Taxas de Conversão do Funil</div>
          <div className="cvr-flow-cards">
            {cvrCards.map((card, i) => {
              const isAboveTarget = card.value >= card.target
              const diff = card.prev !== undefined ? card.value - card.prev : null

              return (
                <div key={i} className="cvr-card">
                  <div className="cvr-card-label">{card.label}</div>
                  <div className={`cvr-card-value ${isAboveTarget ? 'text-success' : 'text-danger'}`}>
                    {formatPercent(card.value)}
                  </div>
                  <div className="cvr-card-meta">
                    <span className="cvr-card-target">Meta: {card.target}%</span>
                    {diff !== null && (
                      <span className={`cvr-card-diff ${diff >= 0 ? 'text-success' : 'text-danger'}`}>
                        {diff >= 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Meta Ads Stats */}
        {impressions > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="metric-card">
              <div className="metric-card-label">Impressões</div>
              <div className="metric-card-value">{impressions.toLocaleString('pt-BR')}</div>
              <div className="metric-card-target">Meta Ads</div>
            </div>
            <div className="metric-card">
              <div className="metric-card-label">Cliques</div>
              <div className="metric-card-value">{clicks.toLocaleString('pt-BR')}</div>
              <div className="metric-card-target">Meta Ads</div>
            </div>
            <div className="metric-card">
              <div className="metric-card-label">CTR</div>
              <div className="metric-card-value">
                {impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0'}%
              </div>
              <div className="metric-card-target">Cliques / Impressões</div>
            </div>
            <div className="metric-card">
              <div className="metric-card-label">CPC</div>
              <div className="metric-card-value">
                {clicks > 0 ? formatCurrency((cpl * actualMetrics.leads) / clicks) : '—'}
              </div>
              <div className="metric-card-target">Custo por Clique</div>
            </div>
          </div>
        )}
      </div>

      <DealsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        deals={modalDeals}
        stageKey={modalStageKey}
      />
    </>
  )
}
