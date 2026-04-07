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

  const domain = account.domain
  const companyProfile  = raw_visitor_data?._meta?.companyProfile
  const visitorProfile  = raw_visitor_data?._meta?.visitorProfileAnalysis
  const intentSignals: string[] = raw_visitor_data?._meta?.preComputedIntent?.signals ?? []
  const pagesVisited: string[]  = raw_visitor_data?.pages_visited ?? []

  const techEntries = tech_stack
    ? Object.entries(tech_stack).filter(([_, v]) => v)
    : []

  return (
    <div className={`bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col md:flex-row animate-slide-up ${className}`}>
      
      {/* LEFT PANE: Firmographics Foundation (Sticky) */}
      <div className="md:w-[35%] border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-6">
            <div className="h-14 w-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm text-xl font-bold text-slate-800 overflow-hidden">
              {account.logo_url ? <img src={account.logo_url} className="w-10 h-10 object-contain" /> : (
                domain ? domain.charAt(0).toUpperCase() : <Building className="h-6 w-6 text-slate-400" />
              )}
            </div>
            
            {/* Intent Score Ring */}
            {intent_score !== undefined && intent_score !== null && (
              <div className="flex flex-col items-center">
                <IntentScoreRing score={intent_score} size={56} />
                <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Intent</span>
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 mb-1">{account.name || domain || 'Unknown Company'}</h2>
          
          {domain && (
            <a href={`https://${domain}`} target="_blank" className="text-sm font-medium text-primary flex items-center gap-1 hover:underline mb-4 w-fit">
              <Globe className="h-3.5 w-3.5" /> {domain}
            </a>
          )}
          
          <div className="flex flex-wrap gap-2 mb-8">
             {intent_stage && <StageBadge stage={intent_stage} />}
             {likely_persona && (
               <span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-slate-300">
                 <Users className="h-3 w-3" /> {likely_persona}
               </span>
             )}
          </div>
          
          <div className="space-y-4">
            {account.industry && (
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Industry</div>
                <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> {account.industry}
                </div>
              </div>
            )}
            {account.headquarters && (
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Location</div>
                <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {account.headquarters}
                </div>
              </div>
            )}
            {account.size && (
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Company Size</div>
                <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" /> {account.size}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {raw_visitor_data && (
          <div className="mt-8 pt-5 border-t border-slate-200/50">
             <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 flex items-center justify-between">
               <span>Time on Site</span>
               <span className="text-slate-700 font-semibold text-xs">
                 {raw_visitor_data.dwell_time_seconds >= 60 
                   ? `${Math.floor(raw_visitor_data.dwell_time_seconds / 60)}m ${raw_visitor_data.dwell_time_seconds % 60}s` 
                   : `${raw_visitor_data.dwell_time_seconds}s`}
               </span>
             </div>
             <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 flex items-center justify-between">
               <span>Page Views</span>
               <span className="text-slate-700 font-semibold text-xs">{pagesVisited.length}</span>
             </div>
             <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center justify-between">
               <span>Visits (Week)</span>
               <span className="text-slate-700 font-semibold text-xs">{raw_visitor_data.visits_this_week}</span>
             </div>
          </div>
        )}
      </div>

      {/* RIGHT PANE: AI Intelligence Feed (Scrollable) */}
      <div className="md:w-[65%] flex flex-col bg-white">
        
        {/* Core Intelligence Feed */}
        <div className="p-6 md:p-8 flex-1">
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" /> AI Intelligence Summary
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              {ai_summary || 'No summary available.'}
            </p>
          </div>
          
          {/* Action List */}
          <div className="mb-8 p-5 bg-orange-50/50 rounded-2xl border border-orange-100/50">
            <h3 className="text-[11px] font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <Zap className="h-3.5 w-3.5" /> Recommended Sales Plays
            </h3>
            {recommended_actions && recommended_actions.length > 0 ? (
              <ul className="space-y-3">
                {recommended_actions.map((action, idx) => (
                  <li key={idx} className="flex gap-3 text-sm bg-white border border-orange-100 rounded-xl p-3 shadow-sm">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-slate-700 leading-snug">{action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic">No AI actions generated.</p>
            )}
          </div>
          
          {/* Visitor Analysis */}
          {visitorProfile && (
            <div className="mb-8">
              <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                <Users className="h-3.5 w-3.5" /> Granular Visitor Context
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Segments */}
                 <div className="md:col-span-2 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    <div className="text-[10px] font-bold text-blue-500 mb-2.5 uppercase tracking-widest flex items-center gap-1"><Tag className="h-3 w-3" /> Segments</div>
                    <div className="flex flex-wrap gap-1.5">
                      {visitorProfile.segments?.length > 0 ? visitorProfile.segments.map((s: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold">{s}</span>
                      )) : <span className="text-xs text-slate-400 italic">No segments identified</span>}
                    </div>
                 </div>
                 {/* Behaviours */}
                 <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 mb-2.5 uppercase tracking-widest flex items-center gap-1"><Zap className="h-3 w-3" /> Behaviours</div>
                    <div className="flex flex-wrap gap-1.5">
                      {visitorProfile.behaviours?.length > 0 ? visitorProfile.behaviours.map((b: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-xs">{b}</span>
                      )) : <span className="text-xs text-slate-400 italic">No behaviours detected</span>}
                    </div>
                 </div>
                 {/* Attributes */}
                 <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 mb-2.5 uppercase tracking-widest flex items-center gap-1"><Users className="h-3 w-3" /> Attributes</div>
                    <div className="flex flex-wrap gap-1.5">
                      {visitorProfile.attributes?.length > 0 ? visitorProfile.attributes.map((a: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-xs">{a}</span>
                      )) : <span className="text-xs text-slate-400 italic">No attributes identified</span>}
                    </div>
                 </div>
                 {/* Insights */}
                 <div className="md:col-span-2 bg-primary/5 rounded-xl p-4 border border-primary/10">
                    <div className="text-[10px] font-bold text-primary mb-2.5 uppercase tracking-widest flex items-center gap-1"><Sparkles className="h-3 w-3" /> Key Insights</div>
                    {visitorProfile.insights?.length > 0 ? (
                      <ul className="list-disc pl-4 text-xs space-y-1.5 text-slate-700 font-medium">
                        {visitorProfile.insights.map((ins: string, i: number) => (
                          <li key={i}>{ins}</li>
                        ))}
                      </ul>
                    ) : <span className="text-xs text-slate-400 italic">No insights available</span>}
                 </div>
              </div>
            </div>
          )}
          
          {/* Business Signals & Tech */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
             <div>
               <h3 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                 <TrendingUp className="h-3.5 w-3.5" /> Business Signals
               </h3>
               {business_signals && business_signals.length > 0 ? (
                 <ul className="space-y-2.5">
                   {business_signals.slice(0, 4).map((signal, idx) => (
                     <li key={idx} className="flex gap-2 text-xs">
                       <span className="text-emerald-500 mt-0.5 block flex-shrink-0">●</span>
                       <span className="text-slate-600 leading-snug">{typeof signal === 'string' ? signal : JSON.stringify(signal)}</span>
                     </li>
                   ))}
                 </ul>
               ) : (
                 <span className="text-xs text-slate-400">No signals detected.</span>
               )}
             </div>
             
             <div>
               <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                 <Shield className="h-3.5 w-3.5" /> Tech Stack
               </h3>
               <div className="flex flex-wrap gap-1.5">
                 {techEntries.slice(0, 8).map(([tech, _], i) => (
                   <span key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-medium text-slate-600">
                     {tech}
                   </span>
                 ))}
                 {techEntries.length > 8 && (
                   <span className="text-[10px] text-slate-400 py-0.5 ml-1">+{techEntries.length - 8} more</span>
                 )}
               </div>
             </div>
           </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-mono">ID: {account.id.substring(0, 8)}</span>
          <Link href={`/accounts/${account.id}`} className="text-primary font-bold hover:underline flex items-center gap-1">
            Open Full Dossier <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        
      </div>
    </div>
  )
}
