import { z } from 'zod'

// Deal schema matching our Supabase table
export const DealSchema = z.object({
  id: z.number(),
  title: z.string().nullable(),
  pipeline: z.string().nullable(),
  stage: z.string().nullable(),
  group_id: z.string().nullable(),
  stage_id: z.string().nullable(),
  owner_id: z.string().nullable(),
  status: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  nome_noivo: z.string().nullable(),
  num_convidados: z.number().nullable(),
  orcamento: z.number().nullable(),
  destino: z.string().nullable(),
  motivo_perda: z.string().nullable(),
  motivos_qualificacao_sdr: z.string().nullable(),
  data_reuniao_1: z.string().nullable(),
  como_reuniao_1: z.string().nullable(),
  data_qualificado: z.string().nullable(),
  qualificado_sql: z.boolean().nullable(),
  data_closer: z.string().nullable(),
  reuniao_closer: z.string().nullable(),
  data_fechamento: z.string().nullable(),
  is_elopement: z.boolean().nullable(),
  // Trips fields
  data_e_hor_rio_do_agendamento_da_1a_reuni_o_sdr_trips: z.string().nullable(),
  como_foi_feita_a_1a_reuni_o_sdr_trips: z.string().nullable(),
  pagou_a_taxa: z.boolean().nullable(),
})

export type Deal = z.infer<typeof DealSchema>

// Monthly target schema
export const MonthlyTargetSchema = z.object({
  id: z.number().optional(),
  month: z.string(), // YYYY-MM-DD format
  pipeline_type: z.enum(['elopement', 'wedding', 'trips']),
  leads: z.number(),
  mql: z.number(),
  agendamento: z.number(),
  reunioes: z.number(),
  qualificado: z.number(),
  closer_agendada: z.number(),
  closer_realizada: z.number(),
  vendas: z.number(),
  cpl: z.number(),
  taxa: z.number().optional(), // Trips-specific
})

export type MonthlyTarget = z.infer<typeof MonthlyTargetSchema>

// Funnel metrics for display (WW)
export interface FunnelMetrics {
  leads: number
  mql: number
  agendamento: number
  reunioes: number
  qualificado: number
  closerAgendada: number
  closerRealizada: number
  vendas: number
}

// Funnel metrics for Trips (5 stages)
export interface TripsFunnelMetrics {
  leads: number
  mql: number
  agendamento: number
  reunioes: number
  taxa: number
}

// Dashboard row types
export interface FunnelRow {
  label: string
  rowClass: string
  values: (number | string)[]
}

// View types
export type ViewType = 'wedding' | 'elopement' | 'trips'

// Month selection
export interface MonthSelection {
  year: number
  month: number // 1-12
}
