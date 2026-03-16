export type Account = {
  id: string
  user_id: string
  name: string
  domain: string | null
  industry: string | null
  size: string | null
  headquarters: string | null
  founded_year: number | null
  description: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export type Enrichment = {
  id: string
  account_id: string
  user_id: string
  intent_score: number | null
  intent_stage: 'Awareness' | 'Evaluation' | 'Decision' | null
  likely_persona: string | null
  persona_confidence: number | null
  ai_summary: string | null
  recommended_actions: string[] | null // JSONB in DB
  tech_stack: Record<string, any> | null // JSONB in DB
  business_signals: any[] | null // JSONB in DB
  raw_visitor_data: any | null // JSONB in DB
  created_at: string
  updated_at: string
}

export type Visitor = {
  id: string
  user_id: string
  ip_address: string | null
  visitor_id: string | null
  pages_visited: string[] | null // JSONB in DB
  dwell_time_seconds: number | null
  visits_this_week: number | null
  referral_source: string | null
  created_at: string
}

export type EnrichedAccount = Account & {
  enrichments?: Enrichment[]
}
