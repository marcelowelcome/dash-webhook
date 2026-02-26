'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import type { Deal } from '@/lib/types'

// WW stages + Trips stage (taxa)
type StageKey = 'leads' | 'mql' | 'agendamento' | 'reunioes' | 'qualificado' | 'closerAgendada' | 'closerRealizada' | 'vendas' | 'taxa'

interface DealsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  deals: Deal[]
  stageKey?: StageKey
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

export function DealsModal({ isOpen, onClose, title, deals, stageKey }: DealsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')

  const filteredDeals = useMemo(() => {
    if (!search.trim()) return deals
    const term = search.toLowerCase()
    return deals.filter(d =>
      d.id.toString().includes(term) ||
      d.title?.toLowerCase().includes(term) ||
      d.pipeline?.toLowerCase().includes(term) ||
      d.stage?.toLowerCase().includes(term) ||
      d.nome_noivo?.toLowerCase().includes(term)
    )
  }, [deals, search])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      setTimeout(() => searchRef.current?.focus(), 100)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) setSearch('')
  }, [isOpen])

  if (!isOpen) return null

  const getStatusBadge = (status: string | undefined) => {
    const s = status || 'Open'
    if (s === 'Won') return <span className="badge-won">{s}</span>
    if (s === 'Lost') return <span className="badge-lost">{s}</span>
    return <span className="badge-open">{s}</span>
  }

  // Get extra columns based on stage
  const getExtraColumns = (): { header: string; getValue: (d: Deal) => string }[] => {
    switch (stageKey) {
      case 'agendamento':
      case 'reunioes':
        return [
          { header: 'Data Reunião', getValue: (d) => formatDateTime(d.data_reuniao_1 || d.data_e_hor_rio_do_agendamento_da_1a_reuni_o_sdr_trips) },
          { header: 'Como foi', getValue: (d) => d.como_reuniao_1 || d.como_foi_feita_a_1a_reuni_o_sdr_trips || '-' },
        ]
      case 'qualificado':
        return [
          { header: 'Data Qualificação', getValue: (d) => formatDate(d.data_qualificado) },
          { header: 'SQL', getValue: (d) => d.qualificado_sql ? 'Sim' : 'Não' },
        ]
      case 'closerAgendada':
      case 'closerRealizada':
        return [
          { header: 'Data Closer', getValue: (d) => formatDateTime(d.data_closer) },
          { header: 'Como foi Closer', getValue: (d) => d.reuniao_closer || '-' },
        ]
      case 'vendas':
        return [
          { header: 'Data Fechamento', getValue: (d) => formatDateTime(d.data_fechamento) },
        ]
      case 'taxa':
        return [
          { header: 'Pagou Taxa', getValue: (d) => d.pagou_a_taxa ? 'Sim' : 'Não' },
          { header: 'Data Reunião', getValue: (d) => formatDateTime(d.data_e_hor_rio_do_agendamento_da_1a_reuni_o_sdr_trips) },
        ]
      default:
        return []
    }
  }

  const extraColumns = getExtraColumns()

  const exportToCSV = () => {
    const baseHeaders = ['ID', 'Título', 'Pipeline', 'Stage', 'Status', 'Criado']
    const extraHeaders = extraColumns.map(c => c.header)
    const headers = [...baseHeaders, ...extraHeaders, 'Nome Noivo', 'Destino', 'Orçamento']

    const rows = filteredDeals.map(d => [
      d.id,
      d.title || '',
      d.pipeline || '',
      d.stage || '',
      d.status || 'Open',
      d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : '',
      ...extraColumns.map(c => c.getValue(d)),
      d.nome_noivo || '',
      d.destino || '',
      d.orcamento || ''
    ])

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalColumns = 6 + extraColumns.length

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div ref={modalRef} className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {title} ({filteredDeals.length}{search ? ` de ${deals.length}` : ''})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="px-3 py-1.5 text-sm bg-wedding-gold text-white rounded hover:bg-wedding-gold/90 transition-colors"
              title="Exportar CSV"
            >
              Exportar CSV
            </button>
            <button onClick={onClose} className="modal-close">
              ×
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pt-4">
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar por ID, título, pipeline, stage ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="modal-search"
          />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-5 pb-5">
          <table className="modal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Pipeline</th>
                <th>Stage</th>
                <th>Status</th>
                <th>Criado</th>
                {extraColumns.map((col, i) => (
                  <th key={i} style={{ color: 'var(--gold)' }}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal) => (
                <tr key={deal.id}>
                  <td className="font-mono text-xs">{deal.id}</td>
                  <td>{deal.title || '-'}</td>
                  <td>{deal.pipeline || '-'}</td>
                  <td>{deal.stage || '-'}</td>
                  <td>{getStatusBadge(deal.status ?? undefined)}</td>
                  <td className="text-xs">
                    {deal.created_at
                      ? new Date(deal.created_at).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </td>
                  {extraColumns.map((col, i) => (
                    <td key={i} className="text-xs" style={{ color: 'var(--gold)' }}>{col.getValue(deal)}</td>
                  ))}
                </tr>
              ))}
              {filteredDeals.length === 0 && (
                <tr>
                  <td colSpan={totalColumns} className="text-center py-8 !text-txt-muted dark:!text-txt-dark-muted">
                    {search ? 'Nenhum resultado encontrado' : 'Nenhum deal encontrado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
