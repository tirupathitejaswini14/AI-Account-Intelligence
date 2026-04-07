'use client'

import { EnrichedAccount } from '@/lib/types'
import {
  CheckCircle2, TrendingUp, Users, Building, AlertCircle, Sparkles, Zap,
  Shield, Globe, Calendar, Briefcase, ChevronRight, MapPin, Hash,
  ExternalLink, Tag, Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TECH_CATEGORIES } from '@/lib/enrichment/techstack'
import Link from 'next/link'
import { ReactNode } from 'react'

interface AccountCardProps {
  account: EnrichedAccount
  className?: string
}

function IntentScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 10) * circumference
  const color = score >= 7 ? 'hsl(0,84%,60%)' : score >= 4 ? 'hsl(38,92%,50%)' : 'hsl(217,91%,60%)'
  const glowClass = score >= 7 ? 'intent-glow-high' : score >= 4 ? 'intent-glow-med' : 'intent-glow-low'

  return (
    <div className={cn('intent-ring rounded-full', glowClass)} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(220 13% 91%)" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="score-text flex flex-col items-center" style={{ color }}>
        <span className="text-lg font-bold leading-none">{score.toFixed(1)}</span>
        <span className="text-[9px] font-medium opacity-70 leading-none mt-0.5">/ 10</span>
      </div>
    </div>
  )
}

function StageBadge({ stage }: { stage: string | null }) {
  const config: Record<string, { bg: string; text: string; icon: string }> = {
    Decision:   { bg: 'bg-red-50 border-red-200',    text: 'text-red-700',    icon: '🔥' },
    Evaluation: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700',  icon: '⚡' },
    Awareness:  { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700',   icon: '👁️' },
  }
  const c = config[stage || ''] || config['Awareness']
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border', c.bg, c.text)}>
      {c.icon} {stage || 'Unknown'} Stage
    </span>
  )
}

export function AccountCard({ account, className }: AccountCardProps) {
  const latestEnrichment = account.enrichments?.[0]

  if (!latestEnrichment) {
    return (
      <div className={cn('rounded-2xl border bg-card shadow-sm p-6', className)}>
        <h3 className="font-semibold">{account.name}</h3>
        <p className="text-sm text-muted-foreground mt-2">No enrichment data available.</p>
      </div>
    )
  }

  const {
    intent_score, intent_stage, likely_persona, persona_confidence,
    ai_summary, recommended_actions, tech_stack, business_signals, raw_visitor_data,
  } = latestEnrichment

  const companyProfile  = raw_visitor_data?._meta?.companyProfile
  const visitorProfile  = raw_visitor_data?._meta?.visitorProfileAnalysis
  const intentSignals: string[] = raw_visitor_data?._meta?.preComputedIntent?.signals ?? []
  const pagesVisited: string[]  = raw_visitor_data?.pages_visited ?? []

  const techEntries = tech_stack
    ? Object.entries(tech_stack).filter(([_, v]) => v)
    : []

  return (
    <div className={cn(
      'overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-all duration-300 animate-slide-up',
      className
    )}>
      {/* Top accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 gradient-primary pointer-events-none" style={{ position: 'relative', height: 4, marginBottom: -4 }}>
        <div className="h-full gradient-primary" />
      </div>

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="h-14 w-14 rounded-xl bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
            {account.logo_url
              ? <img src={account.logo_url} alt={account.name} className="object-contain w-10 h-10" />
              : <Building className="h-7 w-7 text-muted-foreground" />
            }
          </div>

          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 flex-wrap">
              {account.name}
              {intent_score !== null && intent_score !== undefined && intent_score >= 8 && (
                <span className="animate-pulse" title="High Intent">🔥</span>
              )}
              {companyProfile?.businessModel && (
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {companyProfile.businessModel}
                </span>
              )}
            </h3>

            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-1.5 mt-1">
              {account.domain && (
                <a
                  href={`https://${account.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <Globe className="h-3 w-3" />
                  {account.domain}
                  <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                </a>
              )}
              {account.industry && (
                <>
                  <span className="text-border">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />{account.industry}
                  </span>
                </>
              )}
              {account.headquarters && (
                <>
                  <span className="text-border">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{account.headquarters}
                  </span>
                </>
              )}
            </div>

            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
              {account.size && (
                <span className="inline-flex items-center gap-1">
                  <Hash className="h-3 w-3" />{account.size}
                </span>
              )}
              {account.founded_year && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />Est. {account.founded_year}
                </span>
              )}
            </div>

            {/* Pages visited chips */}
            {pagesVisited.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {pagesVisited.map((p, i) => (
                  <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: visitor stats + intent ring */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-5 shrink-0">
          {raw_visitor_data && (raw_visitor_data.dwell_time_seconds > 0 || raw_visitor_data.visits_this_week > 0) && (
            <div className="hidden sm:flex flex-col gap-1 text-right border-r border-border/50 pr-5 mr-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Visitor Behavior</div>
              {raw_visitor_data.dwell_time_seconds > 0 && (
                <div className="text-xs text-foreground/90 flex items-center justify-end gap-1.5">
                  <span className="font-medium">
                    {raw_visitor_data.dwell_time_seconds >= 60
                      ? `${Math.floor(raw_visitor_data.dwell_time_seconds / 60)}m ${raw_visitor_data.dwell_time_seconds % 60}s`
                      : `${raw_visitor_data.dwell_time_seconds}s`}
                  </span>
                  <span className="text-muted-foreground">on site ⏱️</span>
                </div>
              )}
              {raw_visitor_data.visits_this_week > 0 && (
                <div className="text-xs text-foreground/90 flex items-center justify-end gap-1.5">
                  <span className="font-medium">{raw_visitor_data.visits_this_week}</span>
                  <span className="text-muted-foreground">visits this week 📈</span>
                </div>
              )}
              {raw_visitor_data.referral_source && (
                <div className="text-xs text-foreground/90 flex items-center justify-end gap-1.5">
                  <span className="font-medium capitalize">{raw_visitor_data.referral_source}</span>
                  <span className="text-muted-foreground">source 🔗</span>
                </div>
              )}
            </div>
          )}

          {intent_score !== null && intent_score !== undefined && (
            <div className="flex flex-col items-center gap-2">
              <IntentScoreRing score={intent_score} />
              <StageBadge stage={intent_stage} />
            </div>
          )}
        </div>
      </div>

      {/* ── AI Summary + Persona ──────────────────────────────── */}
      <div className="border-t border-border/60 grid grid-cols-1 md:grid-cols-3">
        <div className="p-5 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-border/60">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Likely Persona
          </div>
          {likely_persona ? (
            <div>
              <div className="font-semibold text-sm">{likely_persona}</div>
              {persona_confidence != null && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Confidence</span>
                    <span>{persona_confidence}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-primary transition-all duration-700 ease-out"
                      style={{ width: `${persona_confidence}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Not identified</div>
          )}
        </div>

        <div className="p-5 md:col-span-2">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5" /> AI Account Intelligence Summary
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">
            {ai_summary || 'No summary available.'}
          </p>

          {/* Key products */}
          {companyProfile?.keyProducts?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {companyProfile.keyProducts.slice(0, 5).map((p: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-primary/8 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                  <Package className="h-2.5 w-2.5" />{p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Visitor Profile Analysis ──────────────────────────── */}
      {visitorProfile && (
        <div className="border-t border-border/60 bg-muted/10">
          <div className="px-5 py-4 border-b border-border/60">
             <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
               <Users className="h-3.5 w-3.5" /> Visitor Profile Analysis
             </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
            <div className="p-4">
              <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1"><Tag className="h-3 w-3" /> Segments</div>
              {visitorProfile.segments?.length > 0 ? (
                <ul className="space-y-1.5 list-disc pl-3">
                  {visitorProfile.segments.map((s: string, i: number) => <li key={i} className="text-xs text-foreground/80">{s}</li>)}
                </ul>
              ) : <div className="text-xs text-muted-foreground">None identified</div>}
            </div>
            <div className="p-4">
              <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1"><Zap className="h-3 w-3" /> Behaviours</div>
              {visitorProfile.behaviours?.length > 0 ? (
                <ul className="space-y-1.5 list-disc pl-3">
                  {visitorProfile.behaviours.map((b: string, i: number) => <li key={i} className="text-xs text-foreground/80">{b}</li>)}
                </ul>
              ) : <div className="text-xs text-muted-foreground">No specific behaviour</div>}
            </div>
            <div className="p-4">
              <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1"><Briefcase className="h-3 w-3" /> Attributes</div>
              {visitorProfile.attributes?.length > 0 ? (
                <ul className="space-y-1.5 list-disc pl-3">
                  {visitorProfile.attributes.map((a: string, i: number) => <li key={i} className="text-xs text-foreground/80">{a}</li>)}
                </ul>
              ) : <div className="text-xs text-muted-foreground">Unknown attributes</div>}
            </div>
            <div className="p-4">
              <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Insights</div>
              {visitorProfile.insights?.length > 0 ? (
                <ul className="space-y-1.5 list-disc pl-3">
                  {visitorProfile.insights.map((ins: string, i: number) => <li key={i} className="text-xs text-foreground/80 leading-tight">{ins}</li>)}
                </ul>
              ) : <div className="text-xs text-muted-foreground">No insights available</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Sales Playbook + Intent Signals ──────────────────── */}
      <div className="border-t border-border/60 grid grid-cols-1 md:grid-cols-2">
        <div className="p-5 border-b md:border-b-0 md:border-r border-border/60">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Recommended Sales Actions
          </div>
          {recommended_actions && recommended_actions.length > 0 ? (
            <div className="space-y-2.5">
              <div className="text-sm font-semibold text-foreground bg-primary/5 border border-primary/10 rounded-lg px-3 py-2 flex items-start gap-2">
                <span className="text-primary mt-0.5">⚡</span>
                {recommended_actions[0]}
              </div>
              {recommended_actions.slice(1).map((action, i) => (
                <div key={i} className="text-sm flex gap-2.5 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full gradient-primary flex items-center justify-center mt-0.5">
                    <ChevronRight className="h-3 w-3 text-white" />
                  </span>
                  <span className="text-foreground/80">{action}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> No actions recommended
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Intent Signals
          </div>
          {intentSignals.length > 0 ? (
            <ul className="space-y-2">
              {intentSignals.slice(0, 6).map((signal, i) => (
                <li key={i} className="text-sm flex gap-2 items-start">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/80">{signal}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> No signals detected
            </div>
          )}
        </div>
      </div>

      {/* ── Business Signals + Tech Stack + Leadership ────────── */}
      <div className="border-t border-border/60 grid grid-cols-1 md:grid-cols-3">
        {/* Business signals */}
        <div className="p-5 border-b md:border-b-0 md:border-r border-border/60">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Business Signals
          </div>
          {business_signals && business_signals.length > 0 ? (
            <ul className="space-y-2">
              {business_signals.slice(0, 5).map((signal, i) => (
                <li key={i} className="text-xs flex gap-2 items-start">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">📈</span>
                  <span className="text-foreground/80">
                    {typeof signal === 'string' ? signal : JSON.stringify(signal)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> No signals found
            </div>
          )}
        </div>

        {/* Tech stack */}
        <div className="p-5 border-b md:border-b-0 md:border-r border-border/60">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Technology Stack
          </div>
          {techEntries.length > 0 ? (
            <div className="space-y-1.5">
              {techEntries.slice(0, 8).map(([tech, v], i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-[100px] flex-shrink-0 truncate">
                    {typeof v === 'string' ? v : (TECH_CATEGORIES[tech] || 'Other')}:
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate">{tech}</span>
                </div>
              ))}
              {techEntries.length > 8 && (
                <div className="text-[10px] text-muted-foreground pt-1">
                  +{techEntries.length - 8} more via BuiltWith
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> No tech detected
            </div>
          )}
        </div>

        {/* Leadership */}
        <div className="p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Leadership
          </div>
          {companyProfile?.leadershipMentions?.length > 0 ? (
            <div className="space-y-2">
              {companyProfile.leadershipMentions.map((name: string, i: number) => (
                <div key={i} className="text-xs flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-primary">{name.charAt(0)}</span>
                  </span>
                  <span className="font-medium">{name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> No leadership data
            </div>
          )}
        </div>
      </div>

      {/* ── Footer: view full profile ─────────────────────────── */}
      <div className="border-t border-border/60 px-6 py-3 bg-muted/30 flex justify-end">
        <Link
          href={`/accounts/${account.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          View full profile <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
