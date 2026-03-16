'use client'

import { EnrichedAccount } from '@/lib/types'
import { CheckCircle2, TrendingUp, Users, Building, AlertCircle, Sparkles, Zap, Shield, Globe, Calendar, Briefcase, ChevronRight, ExternalLink, MapPin, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TECH_CATEGORIES } from '@/lib/enrichment/techstack'

interface AccountCardProps {
  account: EnrichedAccount
  className?: string
}

function IntentScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 10) * circumference
  const color = score >= 7 ? 'hsl(0, 84%, 60%)' : score >= 4 ? 'hsl(38, 92%, 50%)' : 'hsl(217, 91%, 60%)'
  const glowClass = score >= 7 ? 'intent-glow-high' : score >= 4 ? 'intent-glow-med' : 'intent-glow-low'
  const displayScore = Number.isInteger(score) ? score.toFixed(1) : score.toFixed(1)

  return (
    <div className={cn("intent-ring rounded-full", glowClass)} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(220 13% 91%)"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="score-text flex flex-col items-center" style={{ color }}>
        <span className="text-lg font-bold leading-none">{displayScore}</span>
        <span className="text-[9px] font-medium opacity-70 leading-none mt-0.5">/ 10</span>
      </div>
    </div>
  )
}

function StageBadge({ stage }: { stage: string | null }) {
  const config: Record<string, { bg: string; text: string; icon: string }> = {
    'Decision': { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: '🔥' },
    'Evaluation': { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: '⚡' },
    'Awareness': { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: '👁️' },
  }
  const c = config[stage || ''] || config['Awareness']
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border", c.bg, c.text)}>
      {c.icon} {stage || 'Unknown'} Stage
    </span>
  )
}

export function AccountCard({ account, className }: AccountCardProps) {
  const latestEnrichment = account.enrichments?.[0]
  
  if (!latestEnrichment) {
    return (
      <div className={cn("rounded-2xl border bg-card text-card-foreground shadow-sm", className)}>
        <div className="p-6">
          <h3 className="font-semibold leading-none tracking-tight">{account.name}</h3>
          <p className="text-sm text-muted-foreground mt-2">No enrichment data available.</p>
        </div>
      </div>
    )
  }

  const {
    intent_score,
    intent_stage,
    likely_persona,
    persona_confidence,
    ai_summary,
    recommended_actions,
    tech_stack,
    business_signals,
    raw_visitor_data
  } = latestEnrichment

  const companyProfile = raw_visitor_data?._meta?.companyProfile

  return (
    <div className={cn(
      "overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-all duration-300 animate-slide-up",
      className
    )}>
      {/* Header with gradient accent */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-1 gradient-primary" />
        <div className="p-6 pt-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
              {account.logo_url ? (
                <img src={account.logo_url} alt={`${account.name} logo`} className="object-contain w-10 h-10" />
              ) : (
                <Building className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {account.name}
                {intent_score && intent_score >= 8 && <span className="animate-pulse" title="High Intent">🔥</span>}
              </h3>
              <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-1.5 mt-1">
                {account.domain && (
                  <span className="inline-flex items-center gap-1">
                    <Globe className="h-3 w-3" />{account.domain}
                  </span>
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
                    <span>{account.headquarters}</span>
                  </>
                )}
              </div>
              {(account.size || account.founded_year) && (
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                  {account.size && <span>{account.size}</span>}
                  {account.size && account.founded_year && <span className="text-border">·</span>}
                  {account.founded_year && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />Founded {account.founded_year}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-end md:items-center gap-6 shrink-0">
            {/* Visitor Behavior */}
            {raw_visitor_data && (
              <div className="hidden md:flex flex-col gap-1.5 text-right border-r border-border/50 pr-6 mr-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Visitor Behavior</div>
                <div className="text-xs text-foreground/90 flex items-center justify-end gap-2">
                  <span>{raw_visitor_data.dwell_time_seconds >= 60 ? `${Math.floor(raw_visitor_data.dwell_time_seconds / 60)}m ${raw_visitor_data.dwell_time_seconds % 60}s` : `${raw_visitor_data.dwell_time_seconds}s`}</span>
                  <span className="text-muted-foreground">Time on site</span>
                  <span className="text-muted-foreground mt-0.5">⏱️</span>
                </div>
                <div className="text-xs text-foreground/90 flex items-center justify-end gap-2">
                  <span>{raw_visitor_data.visits_this_week}</span>
                  <span className="text-muted-foreground">Visits this week</span>
                  <span className="text-muted-foreground mt-0.5">📈</span>
                </div>
                {raw_visitor_data.referral_source && (
                  <div className="text-xs text-foreground/90 flex items-center justify-end gap-2">
                    <span className="capitalize">{raw_visitor_data.referral_source}</span>
                    <span className="text-muted-foreground">Source</span>
                    <span className="text-muted-foreground mt-0.5">🔗</span>
                  </div>
                )}
              </div>
            )}

            {/* Intent Score */}
            {intent_score !== null && intent_score !== undefined && (
              <div className="flex flex-col items-center gap-2">
                <IntentScoreRing score={intent_score} />
                <StageBadge stage={intent_stage} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company Profile Section */}
      <div className="border-y border-border/60">
        <div className="p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
            <Building className="h-3.5 w-3.5" /> Company Profile
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {account.domain && (
              <div className="flex items-start gap-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground">Website</div>
                  <div className="text-xs font-medium">{account.domain}</div>
                </div>
              </div>
            )}
            {account.industry && (
              <div className="flex items-start gap-2">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground">Industry</div>
                  <div className="text-xs font-medium">{account.industry}</div>
                </div>
              </div>
            )}
            {account.size && (
              <div className="flex items-start gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground">Company Size</div>
                  <div className="text-xs font-medium">{account.size}</div>
                </div>
              </div>
            )}
            {account.headquarters && (
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground">Headquarters</div>
                  <div className="text-xs font-medium">{account.headquarters}</div>
                </div>
              </div>
            )}
            {account.founded_year && (
              <div className="flex items-start gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground">Founded</div>
                  <div className="text-xs font-medium">{account.founded_year}</div>
                </div>
              </div>
            )}
          </div>
          {account.description && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-2">{account.description}</p>
          )}
        </div>
      </div>

      {/* Persona + AI Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border/60">
        {/* Likely Persona */}
        <div className="p-5 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-border/60">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Likely Persona
          </div>
          {likely_persona ? (
            <div>
              <div className="font-semibold text-sm">{likely_persona}</div>
              {persona_confidence && (
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

        {/* AI Summary */}
        <div className="p-5 flex flex-col gap-2 md:col-span-2">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> AI Summary
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">
            {ai_summary || 'No summary available.'}
          </p>
        </div>
      </div>

      {/* Recommended Actions + Intent Signals */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Recommended Actions */}
        <div className="p-5 border-b md:border-b-0 md:border-r border-border/60">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Sales Playbook
          </div>
          {recommended_actions && recommended_actions.length > 0 ? (
            <div className="space-y-3">
              {/* First action as a highlighted header */}
              <div className="text-sm font-semibold text-foreground bg-primary/5 border border-primary/10 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-primary">⚡</span>
                {recommended_actions[0]}
              </div>
              {recommended_actions.length > 1 && (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Suggested actions:</div>
                  <ul className="space-y-2 stagger-children">
                    {recommended_actions.slice(1).map((action, i) => (
                      <li key={i} className="text-sm flex gap-2.5 items-start group">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full gradient-primary flex items-center justify-center mt-0.5">
                          <ChevronRight className="h-3 w-3 text-white" />
                        </span>
                        <span className="group-hover:text-foreground transition-colors">{action}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> No actions recommended
            </div>
          )}
        </div>

        {/* Intent Signals */}
        <div className="p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Intent Signals
          </div>
          {business_signals && business_signals.length > 0 ? (
            <ul className="space-y-2 stagger-children">
              {business_signals.slice(0, 5).map((signal, i) => (
                <li key={i} className="text-sm flex gap-2 items-start">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-foreground/80">{typeof signal === 'string' ? signal : JSON.stringify(signal)}</span>
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

      {/* Business Signals + Tech Stack + Leadership */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-border/60">
        {/* Business Signals */}
        <div className="p-5 border-b md:border-b-0 md:border-r border-border/60">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Business Signals
          </div>
          {business_signals && business_signals.length > 0 ? (
            <ul className="space-y-2">
              {business_signals.map((signal, i) => (
                <li key={i} className="text-xs flex gap-2 items-start">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">📈</span>
                  <span className="text-foreground/80">{typeof signal === 'string' ? signal : JSON.stringify(signal)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> No business signals found
            </div>
          )}
        </div>

        {/* Technology Stack */}
        <div className="p-5 border-b md:border-b-0 md:border-r border-border/60">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Technology Stack
          </div>
          {tech_stack && Object.keys(tech_stack).filter(k => tech_stack[k]).length > 0 ? (
            <div className="space-y-1.5">
              {Object.entries(tech_stack)
                .filter(([_, found]) => found)
                .slice(0, 6)
                .map(([tech], i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground min-w-[100px]">{TECH_CATEGORIES[tech] || 'Other'}:</span>
                  <span className="text-xs font-semibold text-foreground">{tech}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> No tech detected
            </div>
          )}
        </div>

        {/* Leadership Discovery */}
        <div className="p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Leadership Discovery
          </div>
          {companyProfile && companyProfile.leadershipMentions?.length > 0 ? (
            <div className="space-y-2">
              {companyProfile.leadershipMentions.map((name: string, i: number) => (
                <div key={i} className="text-xs flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-primary">{name.charAt(0)}</span>
                  </span>
                  <span className="font-medium text-foreground">{name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> No leadership data found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
