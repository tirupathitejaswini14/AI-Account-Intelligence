'use client'

import { useState } from 'react'
import { PipelineProgress, type PipelineStep } from '@/components/PipelineProgress'
import { AccountCard } from '@/components/AccountCard'
import { EnrichedAccount } from '@/lib/types'
import { Building2, MousePointerClick, Sparkles, Loader2, AlertTriangle, CheckCircle, ListPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

type BatchResult = {
  company: string
  status: 'pending' | 'processing' | 'success' | 'error'
  data?: EnrichedAccount
  error?: string
}

export default function EnrichPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'visitor' | 'batch'>('company')
  const [inputData, setInputData] = useState('')
  const [domainInput, setDomainInput] = useState('')
  const [batchInput, setBatchInput] = useState('')
  const [visitorData, setVisitorData] = useState({
    ip_address: '',
    pages_visited: '',
    dwell_time_seconds: 120,
    visits_this_week: 1,
    referral_source: 'direct'
  })
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<EnrichedAccount | null>(null)
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const initialSteps: PipelineStep[] = [
    { id: 'ident', label: '🏢 Company Identification', status: 'pending' },
    { id: 'persona', label: '🎯 Persona Inference', status: 'pending' },
    { id: 'intent', label: '📊 Intent Scoring (0–10)', status: 'pending' },
    { id: 'enrich', label: '🔍 Profile Enrichment', status: 'pending' },
    { id: 'ai', label: '🤖 AI Summary & Actions', status: 'pending' },
  ]
  const [steps, setSteps] = useState<PipelineStep[]>(initialSteps)

  const updateStep = (id: string, status: PipelineStep['status']) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  const handleEnrich = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setResult(null)
    setErrorMessage(null)
    setSteps(initialSteps.map(s => ({ ...s, status: 'pending' })))

    try {
      // Animate pipeline steps with realistic timing
      updateStep('ident', 'processing')
      
      const payload = activeTab === 'company' 
        ? { type: 'company', input: inputData, domain: domainInput.trim() || undefined }
        : { 
            type: 'visitor', 
            input: {
              ...visitorData,
              pages_visited: visitorData.pages_visited.split(',').map(s => s.trim()).filter(Boolean)
            }
          }

      // Simulate step-by-step progress for UX
      const stepTimers = [
        setTimeout(() => {
          updateStep('ident', 'completed')
          updateStep('persona', 'processing')
        }, 800),
        setTimeout(() => {
          updateStep('persona', 'completed')
          updateStep('intent', 'processing')
        }, 1500),
        setTimeout(() => {
          updateStep('intent', 'completed')
          updateStep('enrich', 'processing')
        }, 2200),
        setTimeout(() => {
          updateStep('enrich', 'completed')
          updateStep('ai', 'processing')
        }, 3500),
      ]

      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      // Clear any remaining timers
      stepTimers.forEach(clearTimeout)

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(errBody.error || `Request failed (${res.status})`)
      }

      const data = await res.json()
      
      // Complete all steps
      setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })))
      setResult(data)
      
    } catch (error: any) {
      console.error(error)
      setErrorMessage(error.message || 'An unexpected error occurred.')
      setSteps(prev => {
        const currentIdx = prev.findIndex(s => s.status === 'processing')
        return prev.map((s, i) => ({
          ...s,
          status: i === currentIdx ? 'error' : i < currentIdx ? 'completed' : s.status
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

    const companies = batchInput
      .split(/[,\n]/)
      .map(c => c.trim())
      .filter(Boolean)

    if (companies.length === 0) { setIsProcessing(false); return }

    // Initialize batch results
    const initial: BatchResult[] = companies.map(c => ({ company: c, status: 'pending' }))
    setBatchResults(initial)

    // Process sequentially for clear UX feedback
    for (let i = 0; i < companies.length; i++) {
      setBatchResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'processing' } : r
      ))

      try {
        const res = await fetch('/api/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'company', input: companies[i] })
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: res.statusText }))
          throw new Error(errBody.error || `Failed (${res.status})`)
        }

        const data = await res.json()
        setBatchResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'success', data } : r
        ))
      } catch (error: any) {
        setBatchResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'error', error: error.message } : r
        ))
      }
    }

    setIsProcessing(false)
  }

  const tabs = [
    { key: 'company' as const, label: 'Company Name', icon: Building2 },
    { key: 'visitor' as const, label: 'Visitor Signals', icon: MousePointerClick },
    { key: 'batch' as const, label: 'Batch Import', icon: ListPlus },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="gradient-primary p-2.5 rounded-xl shadow-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Intelligence Pipeline</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Convert raw visitor data or company names into actionable sales intelligence.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-3 space-y-5">
          {/* Tab Selector */}
          <div className="bg-muted/80 p-1.5 rounded-xl inline-flex w-full">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setResult(null); setErrorMessage(null); setBatchResults([]); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === key 
                    ? 'bg-white text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Form Card */}
          <form
            onSubmit={activeTab === 'batch' ? handleBatchEnrich : handleEnrich}
            className="glass-card rounded-2xl p-6 space-y-5"
          >
            {activeTab === 'company' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Company Name</label>
                    <input
                      type="text"
                      required
                      disabled={isProcessing}
                      value={inputData}
                      onChange={(e) => setInputData(e.target.value)}
                      placeholder="e.g. Acme Mortgage"
                      className="flex h-12 w-full rounded-xl border-2 bg-white/80 px-4 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-muted-foreground">Domain <span className="text-xs font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      disabled={isProcessing}
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      placeholder="e.g. acmemortgage.com"
                      className="flex h-12 w-full rounded-xl border-2 bg-white/80 px-4 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Provide the domain to force exact match enrichment. Use &quot;Batch Import&quot; for multiple companies.
                </p>
              </div>
            )}

            {activeTab === 'visitor' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Visitor IP Address</label>
                    <input
                      type="text"
                      required
                      disabled={isProcessing}
                      value={visitorData.ip_address}
                      onChange={(e) => setVisitorData({...visitorData, ip_address: e.target.value})}
                      placeholder="e.g. 76.221.X.X"
                      className="flex h-11 w-full rounded-xl border-2 bg-white/80 px-4 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Dwell Time (seconds)</label>
                    <input
                      type="number"
                      required
                      disabled={isProcessing}
                      value={visitorData.dwell_time_seconds}
                      onChange={(e) => setVisitorData({...visitorData, dwell_time_seconds: parseInt(e.target.value)})}
                      className="flex h-11 w-full rounded-xl border-2 bg-white/80 px-4 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Pages Visited</label>
                  <input
                    type="text"
                    required
                    disabled={isProcessing}
                    value={visitorData.pages_visited}
                    onChange={(e) => setVisitorData({...visitorData, pages_visited: e.target.value})}
                    placeholder="/pricing, /enterprise, /docs/api, /blog"
                    className="flex h-11 w-full rounded-xl border-2 bg-white/80 px-4 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-0"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Comma-separated URLs. Pages like /pricing indicate high buyer intent.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Visits This Week</label>
                    <input
                      type="number"
                      required
                      disabled={isProcessing}
                      value={visitorData.visits_this_week}
                      onChange={(e) => setVisitorData({...visitorData, visits_this_week: parseInt(e.target.value)})}
                      className="flex h-11 w-full rounded-xl border-2 bg-white/80 px-4 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Referral Source</label>
                    <input
                      type="text"
                      disabled={isProcessing}
                      value={visitorData.referral_source}
                      onChange={(e) => setVisitorData({...visitorData, referral_source: e.target.value})}
                      placeholder="e.g. google, linkedin, direct"
                      className="flex h-11 w-full rounded-xl border-2 bg-white/80 px-4 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'batch' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Company Names (comma or newline separated)</label>
                  <textarea
                    required
                    disabled={isProcessing}
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    placeholder={`Rocket Mortgage, Redfin, Compass\n\nOr one per line:\nStripe\nNotion\nFigma`}
                    rows={5}
                    className="flex w-full rounded-xl border-2 bg-white/80 px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-0 resize-none placeholder:text-muted-foreground/60"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Max 10 companies per batch. Each will be enriched sequentially.
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {errorMessage && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-slide-up">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Pipeline Error</p>
                  <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isProcessing || 
                (activeTab === 'company' && !inputData) || 
                (activeTab === 'visitor' && !visitorData.ip_address) ||
                (activeTab === 'batch' && !batchInput.trim())
              }
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus:outline-none disabled:pointer-events-none disabled:opacity-50 gradient-primary text-white hover:opacity-90 h-12 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing Pipeline...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {activeTab === 'batch' ? 'Run Batch Analysis' : 'Run Analysis Pipeline'}
                </>
              )}
            </button>
          </form>

          {/* Single Result */}
          {result && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Generated Intelligence
              </h2>
              <AccountCard account={result} />
            </div>
          )}

          {/* Batch Results */}
          {batchResults.length > 0 && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="text-xl font-bold">Batch Results</h2>
              
              {/* Batch Progress Bar */}
              <div className="glass-card rounded-2xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Processing {batchResults.length} companies</span>
                  <span className="font-medium">
                    {batchResults.filter(r => r.status === 'success').length}/{batchResults.length} completed
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full gradient-primary rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(batchResults.filter(r => r.status === 'success' || r.status === 'error').length / batchResults.length) * 100}%` 
                    }}
                  />
                </div>
                <div className="mt-3 space-y-2">
                  {batchResults.map((br, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      {br.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-muted" />}
                      {br.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      {br.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      {br.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      <span className={cn(
                        br.status === 'processing' && 'font-medium text-primary',
                        br.status === 'error' && 'text-red-600',
                      )}>
                        {br.company}
                      </span>
                      {br.error && <span className="text-xs text-red-400">— {br.error}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Render completed batch cards */}
              <div className="space-y-4 stagger-children">
                {batchResults
                  .filter(br => br.status === 'success' && br.data)
                  .map((br, i) => (
                    <AccountCard key={i} account={br.data!} />
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Pipeline Progress */}
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
                <p className="text-xs mt-2">Progress tracked per-company above.</p>
              </div>
            ) : !isProcessing && !result ? (
              <div className="text-sm text-muted-foreground flex flex-col items-center justify-center py-8 text-center bg-slate-50/80 border border-dashed rounded-xl">
                <Sparkles className="h-8 w-8 mb-3 text-muted-foreground/40" />
                <p>Submit data to start the intelligence pipeline.</p>
                <p className="text-xs mt-2">
                  Each step runs in sequence: identify → infer → score → enrich → AI analyze.
                </p>
              </div>
            ) : (
              <PipelineProgress steps={steps} />
            )}

            {/* How It Works */}
            <div className="mt-6 pt-6 border-t border-border/60">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">How It Works</h4>
              <ol className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-bold text-primary shrink-0">1.</span>
                  <span><strong>Identify</strong> — Resolve IP to company or look up by name</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary shrink-0">2.</span>
                  <span><strong>Persona</strong> — Map page visits to buyer roles (deterministic engine)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary shrink-0">3.</span>
                  <span><strong>Intent (0–10)</strong> — Score based on visits, dwell time, pages</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary shrink-0">4.</span>
                  <span><strong>Enrich</strong> — Wikipedia, tech stack, news, logo in parallel</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary shrink-0">5.</span>
                  <span><strong>AI Analyze</strong> — LLM generates summary, actions, profile</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
