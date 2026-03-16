'use client'

import { useState, useRef, useEffect } from 'react'
import { PipelineProgress, type PipelineStep } from '@/components/PipelineProgress'
import { AccountCard } from '@/components/AccountCard'
import { EnrichedAccount } from '@/lib/types'
import {
  Building2, MousePointerClick, Sparkles, Loader2, AlertTriangle,
  CheckCircle, ListPlus, ExternalLink, RotateCcw, ChevronDown, Plus, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type BatchResult = {
  company: string
  status: 'pending' | 'processing' | 'success' | 'error'
  data?: EnrichedAccount
  error?: string
}

const EXAMPLE_COMPANIES = [
  { name: 'Stripe', domain: 'stripe.com' },
  { name: 'Notion', domain: 'notion.so' },
  { name: 'Figma', domain: 'figma.com' },
  { name: 'HubSpot', domain: 'hubspot.com' },
  { name: 'Salesforce', domain: 'salesforce.com' },
]

const REFERRAL_OPTIONS = [
  { value: 'direct', label: 'Direct / Typed URL' },
  { value: 'google', label: 'Google Search' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'bing', label: 'Bing' },
  { value: 'facebook', label: 'Facebook' },
]

const HIGH_INTENT_PAGES = ['/pricing', '/demo', '/enterprise', '/contact', '/get-started']
const LOW_INTENT_PAGES = ['/blog', '/about', '/docs', '/case-studies', '/security']

const initialSteps: PipelineStep[] = [
  { id: 'ident',   label: '🏢 Company Identification', status: 'pending' },
  { id: 'persona', label: '🎯 Persona Inference',       status: 'pending' },
  { id: 'intent',  label: '📊 Intent Scoring (0–10)',   status: 'pending' },
  { id: 'enrich',  label: '🔍 Profile Enrichment',      status: 'pending' },
  { id: 'ai',      label: '🤖 AI Summary & Actions',    status: 'pending' },
]

export default function EnrichPage() {
  const [activeTab, setActiveTab]     = useState<'company' | 'visitor' | 'batch'>('company')
  const [inputData, setInputData]     = useState('')
  const [domainInput, setDomainInput] = useState('')
  const [batchInput, setBatchInput]   = useState('')

  const [visitorData, setVisitorData] = useState({
    ip_address:          '',
    pages_visited:       [] as string[],
    dwell_time_seconds:  120,
    visits_this_week:    1,
    referral_source:     'direct',
  })
  const [customPage, setCustomPage] = useState('')

  const [isProcessing, setIsProcessing]   = useState(false)
  const [result, setResult]               = useState<EnrichedAccount | null>(null)
  const [batchResults, setBatchResults]   = useState<BatchResult[]>([])
  const [errorMessage, setErrorMessage]   = useState<string | null>(null)
  const [steps, setSteps]                 = useState<PipelineStep[]>(initialSteps)

  const resultRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to result when it appears
  useEffect(() => {
    if (result) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [result])

  const updateStep = (id: string, status: PipelineStep['status']) =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s))

  const resetForm = () => {
    setResult(null)
    setErrorMessage(null)
    setSteps(initialSteps.map(s => ({ ...s, status: 'pending' })))
  }

  const handleEnrich = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setResult(null)
    setErrorMessage(null)
    setSteps(initialSteps.map(s => ({ ...s, status: 'pending' })))

    try {
      updateStep('ident', 'processing')

      const payload = activeTab === 'company'
        ? { type: 'company', input: inputData.trim(), domain: domainInput.trim() || undefined }
        : {
            type: 'visitor',
            input: {
              ...visitorData,
              pages_visited: visitorData.pages_visited,
            },
          }

      const stepTimers = [
        setTimeout(() => { updateStep('ident', 'completed'); updateStep('persona', 'processing') }, 800),
        setTimeout(() => { updateStep('persona', 'completed'); updateStep('intent', 'processing') }, 1600),
        setTimeout(() => { updateStep('intent', 'completed'); updateStep('enrich', 'processing') }, 2400),
        setTimeout(() => { updateStep('enrich', 'completed'); updateStep('ai', 'processing') }, 3600),
      ]

      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      stepTimers.forEach(clearTimeout)

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(errBody.error || `Request failed (${res.status})`)
      }

      const data = await res.json()
      setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })))
      setResult(data)
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred.')
      setSteps(prev => {
        const idx = prev.findIndex(s => s.status === 'processing')
        return prev.map((s, i) => ({
          ...s,
          status: i === idx ? 'error' : i < idx ? 'completed' : s.status,
        }))
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBatchEnrich = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setErrorMessage(null)

    const companies = batchInput.split(/[,\n]/).map(c => c.trim()).filter(Boolean)
    if (companies.length === 0) { setIsProcessing(false); return }

    const initial: BatchResult[] = companies.slice(0, 10).map(c => ({ company: c, status: 'pending' }))
    setBatchResults(initial)

    for (let i = 0; i < initial.length; i++) {
      setBatchResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'processing' } : r))
      try {
        const res = await fetch('/api/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'company', input: initial[i].company }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }))
          throw new Error(err.error || `Failed (${res.status})`)
        }
        const data = await res.json()
        setBatchResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'success', data } : r))
      } catch (error: any) {
        setBatchResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', error: error.message } : r))
      }
    }
    setIsProcessing(false)
  }

  const togglePage = (page: string) => {
    setVisitorData(prev => ({
      ...prev,
      pages_visited: prev.pages_visited.includes(page)
        ? prev.pages_visited.filter(p => p !== page)
        : [...prev.pages_visited, page],
    }))
  }

  const addCustomPage = () => {
    const p = customPage.trim()
    if (!p) return
    const normalized = p.startsWith('/') ? p : '/' + p
    if (!visitorData.pages_visited.includes(normalized)) {
      setVisitorData(prev => ({ ...prev, pages_visited: [...prev.pages_visited, normalized] }))
    }
    setCustomPage('')
  }

  const tabs = [
    { key: 'company' as const, label: 'Company Name',   icon: Building2 },
    { key: 'visitor' as const, label: 'Visitor Signals', icon: MousePointerClick },
    { key: 'batch'   as const, label: 'Batch Import',    icon: ListPlus },
  ]

  const dwellLabel = (s: number) =>
    s >= 3600 ? `${Math.floor(s / 3600)}h` :
    s >= 60   ? `${Math.floor(s / 60)}m ${s % 60}s` :
    `${s}s`

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="gradient-primary p-2.5 rounded-xl shadow-sm">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intelligence Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Turn a company name or visitor IP into a full B2B intelligence profile.
          </p>
        </div>
      </div>

      {/* Top grid: form (3) + pipeline sidebar (2) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Input Form ───────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Tabs */}
          <div className="bg-muted/80 p-1.5 rounded-xl inline-flex w-full">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); resetForm(); setBatchResults([]) }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === key ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Form card */}
          <form
            onSubmit={activeTab === 'batch' ? handleBatchEnrich : handleEnrich}
            className="glass-card rounded-2xl p-6 space-y-5"
          >

            {/* ── Company tab ── */}
            {activeTab === 'company' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Company Name *</label>
                    <input
                      type="text"
                      required
                      disabled={isProcessing}
                      value={inputData}
                      onChange={e => setInputData(e.target.value)}
                      placeholder="e.g. Acme Mortgage"
                      className="flex h-12 w-full rounded-xl border-2 bg-white/80 px-4 text-sm transition-colors focus:border-primary focus:outline-none disabled:opacity-50 placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-muted-foreground">
                      Domain <span className="text-xs font-normal">(optional — improves accuracy)</span>
                    </label>
                    <input
                      type="text"
                      disabled={isProcessing}
                      value={domainInput}
                      onChange={e => setDomainInput(e.target.value)}
                      placeholder="e.g. acmemortgage.com"
                      className="flex h-12 w-full rounded-xl border-2 bg-white/80 px-4 text-sm transition-colors focus:border-primary focus:outline-none disabled:opacity-50 placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>

                {/* Quick examples */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Quick try:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_COMPANIES.map(ex => (
                      <button
                        key={ex.name}
                        type="button"
                        disabled={isProcessing}
                        onClick={() => { setInputData(ex.name); setDomainInput(ex.domain) }}
                        className="text-xs px-3 py-1.5 rounded-lg border bg-white/80 hover:border-primary hover:text-primary transition-all disabled:opacity-40"
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Visitor signals tab ── */}
            {activeTab === 'visitor' && (
              <div className="space-y-5">
                {/* IP */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Visitor IP Address *</label>
                  <input
                    type="text"
                    required
                    disabled={isProcessing}
                    value={visitorData.ip_address}
                    onChange={e => setVisitorData(p => ({ ...p, ip_address: e.target.value }))}
                    placeholder="e.g. 203.0.113.42"
                    className="flex h-11 w-full rounded-xl border-2 bg-white/80 px-4 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The visitor's IP from your server logs. Corporate IPs resolve to a company; consumer ISPs (Comcast, Verizon) won't.
                  </p>
                </div>

                {/* Pages visited — chips */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Pages Visited
                    {visitorData.pages_visited.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({visitorData.pages_visited.length} selected)
                      </span>
                    )}
                  </label>

                  <div className="space-y-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600 mb-1.5">🔥 High intent</p>
                      <div className="flex flex-wrap gap-2">
                        {HIGH_INTENT_PAGES.map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => togglePage(p)}
                            className={cn(
                              'text-xs px-3 py-1.5 rounded-lg border font-medium transition-all',
                              visitorData.pages_visited.includes(p)
                                ? 'bg-red-500 text-white border-red-500'
                                : 'bg-white/80 border-red-200 text-red-600 hover:border-red-400'
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-500 mb-1.5">👁 Low intent</p>
                      <div className="flex flex-wrap gap-2">
                        {LOW_INTENT_PAGES.map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => togglePage(p)}
                            className={cn(
                              'text-xs px-3 py-1.5 rounded-lg border font-medium transition-all',
                              visitorData.pages_visited.includes(p)
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white/80 border-blue-200 text-blue-600 hover:border-blue-400'
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Selected pages chips */}
                  {visitorData.pages_visited.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-muted/40 rounded-lg">
                      {visitorData.pages_visited.map(p => (
                        <span key={p} className="inline-flex items-center gap-1 text-xs bg-white border rounded-md px-2 py-0.5">
                          {p}
                          <button type="button" onClick={() => togglePage(p)} className="text-muted-foreground hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Custom page input */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={customPage}
                      onChange={e => setCustomPage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomPage() } }}
                      placeholder="Add custom page e.g. /roi-calculator"
                      className="flex-1 h-9 px-3 rounded-lg border-2 bg-white/80 text-xs focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addCustomPage}
                      disabled={!customPage.trim()}
                      className="h-9 px-3 rounded-lg border-2 text-xs font-medium hover:border-primary hover:text-primary disabled:opacity-40 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Dwell time slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold">Time on Site</label>
                    <span className="text-sm font-bold text-primary tabular-nums">
                      {dwellLabel(visitorData.dwell_time_seconds)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={600}
                    step={5}
                    value={visitorData.dwell_time_seconds}
                    onChange={e => setVisitorData(p => ({ ...p, dwell_time_seconds: parseInt(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span>5s (bounce)</span>
                    <span>5m (engaged)</span>
                    <span>10m+</span>
                  </div>
                </div>

                {/* Visits this week */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold">Visits This Week</label>
                    <span className="text-sm font-bold text-primary">{visitorData.visits_this_week}</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setVisitorData(p => ({ ...p, visits_this_week: n }))}
                        className={cn(
                          'flex-1 h-9 rounded-lg border text-sm font-semibold transition-all',
                          visitorData.visits_this_week === n
                            ? 'gradient-primary text-white border-transparent'
                            : 'bg-white/80 hover:border-primary hover:text-primary'
                        )}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setVisitorData(p => ({ ...p, visits_this_week: Math.min(20, p.visits_this_week + 1) }))}
                      className={cn(
                        'flex-1 h-9 rounded-lg border text-sm font-semibold transition-all',
                        visitorData.visits_this_week > 7
                          ? 'gradient-primary text-white border-transparent'
                          : 'bg-white/80 hover:border-primary hover:text-primary'
                      )}
                    >
                      {visitorData.visits_this_week > 7 ? visitorData.visits_this_week : '8+'}
                    </button>
                  </div>
                </div>

                {/* Referral source */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Referral Source</label>
                  <div className="grid grid-cols-3 gap-2">
                    {REFERRAL_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setVisitorData(p => ({ ...p, referral_source: opt.value }))}
                        className={cn(
                          'px-3 py-2 rounded-lg border text-xs font-medium transition-all text-center',
                          visitorData.referral_source === opt.value
                            ? 'gradient-primary text-white border-transparent'
                            : 'bg-white/80 hover:border-primary hover:text-primary'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Batch tab ── */}
            {activeTab === 'batch' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Company Names
                    <span className="text-xs font-normal text-muted-foreground ml-2">comma or one per line, max 10</span>
                  </label>
                  <textarea
                    required
                    disabled={isProcessing}
                    value={batchInput}
                    onChange={e => setBatchInput(e.target.value)}
                    placeholder={'Stripe\nNotion\nFigma\nHubSpot'}
                    rows={6}
                    className="flex w-full rounded-xl border-2 bg-white/80 px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none placeholder:text-muted-foreground/60 disabled:opacity-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {batchInput.split(/[,\n]/).filter(c => c.trim()).length} companies entered
                    {batchInput.split(/[,\n]/).filter(c => c.trim()).length > 10 && (
                      <span className="text-amber-600 ml-1">— only first 10 will run</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {errorMessage && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Pipeline Error</p>
                  <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={
                isProcessing ||
                (activeTab === 'company' && !inputData.trim()) ||
                (activeTab === 'visitor' && !visitorData.ip_address.trim()) ||
                (activeTab === 'batch' && !batchInput.trim())
              }
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 gradient-primary text-white hover:opacity-90 h-12 shadow-lg shadow-primary/20"
            >
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing Pipeline…</>
              ) : (
                <><Sparkles className="h-4 w-4" />
                  {activeTab === 'batch' ? 'Run Batch Analysis' : 'Run Analysis Pipeline'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Pipeline sidebar ─────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-6 sticky top-24">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <div className="gradient-primary p-1.5 rounded-lg">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              Pipeline Execution
            </h3>

            {activeTab === 'batch' ? (
              <div className="text-sm text-muted-foreground flex flex-col items-center justify-center py-8 text-center bg-slate-50/80 border border-dashed rounded-xl">
                <ListPlus className="h-8 w-8 mb-3 text-muted-foreground/40" />
                <p>Batch mode processes each company through the full pipeline sequentially.</p>
              </div>
            ) : !isProcessing && !result ? (
              <div className="text-sm text-muted-foreground flex flex-col items-center justify-center py-8 text-center bg-slate-50/80 border border-dashed rounded-xl">
                <Sparkles className="h-8 w-8 mb-3 text-muted-foreground/40" />
                <p>Submit data to start the intelligence pipeline.</p>
              </div>
            ) : (
              <PipelineProgress steps={steps} />
            )}

            <div className="mt-6 pt-5 border-t border-border/60">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">How It Works</h4>
              <ol className="space-y-2.5 text-xs text-muted-foreground">
                {[
                  ['Identify', 'Resolve IP to company or look up by name'],
                  ['Persona', 'Map page visits to buyer roles'],
                  ['Intent (0–10)', 'Score visits, dwell time, pages'],
                  ['Enrich', 'Wikipedia, BuiltWith, news, logo'],
                  ['AI Analyze', 'LLM generates summary + actions'],
                ].map(([bold, rest], i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                    <span><strong>{bold}</strong> — {rest}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* ── Full-width result ─────────────────────────────────────── */}
      {result && (
        <div ref={resultRef} className="space-y-4 animate-slide-up">
          {/* Result header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Intelligence Generated
            </h2>
            <div className="flex items-center gap-3">
              <Link
                href={`/accounts/${result.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border-2 border-primary text-primary hover:bg-primary/5 transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Full Profile
              </Link>
              <button
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border hover:bg-muted/80 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New Analysis
              </button>
            </div>
          </div>

          <AccountCard account={result} />
        </div>
      )}

      {/* ── Batch results ─────────────────────────────────────────── */}
      {batchResults.length > 0 && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Batch Results</h2>
            <span className="text-sm text-muted-foreground">
              {batchResults.filter(r => r.status === 'success').length} / {batchResults.length} completed
            </span>
          </div>

          {/* Progress */}
          <div className="glass-card rounded-2xl p-4">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full gradient-primary rounded-full transition-all duration-500"
                style={{ width: `${(batchResults.filter(r => r.status !== 'pending').length / batchResults.length) * 100}%` }}
              />
            </div>
            <div className="space-y-2">
              {batchResults.map((br, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  {br.status === 'pending'    && <div className="w-4 h-4 rounded-full border-2 border-muted flex-shrink-0" />}
                  {br.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />}
                  {br.status === 'success'    && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                  {br.status === 'error'      && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  <span className={cn(
                    'flex-1',
                    br.status === 'processing' && 'font-medium text-primary',
                    br.status === 'error' && 'text-red-600',
                  )}>
                    {br.company}
                  </span>
                  {br.status === 'success' && br.data && (
                    <Link href={`/accounts/${br.data.id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                      View <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  {br.error && <span className="text-xs text-red-400">{br.error}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Batch result cards */}
          <div className="space-y-6">
            {batchResults.filter(br => br.status === 'success' && br.data).map((br, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-muted-foreground">{br.company}</span>
                  <Link href={`/accounts/${br.data!.id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                    View Full Profile <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <AccountCard account={br.data!} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
