'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EnrichedAccount } from '@/lib/types'
import { AccountCard } from '@/components/AccountCard'
import Link from 'next/link'
import { Loader2, Plus, LayoutGrid, List, TrendingUp, Users, Zap, Building2, Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<EnrichedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'intent'>('date')

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
    } catch (e) {
      console.error('Error fetching accounts:', e)
    } finally {
      setLoading(false)
    }
  }

  // Computed stats
  const stats = useMemo(() => {
    const enriched = accounts.filter(a => a.enrichments && a.enrichments.length > 0)
    const avgIntent = enriched.length > 0
      ? enriched.reduce((sum, a) => sum + (a.enrichments?.[0]?.intent_score || 0), 0) / enriched.length
      : 0
    const highIntent = enriched.filter(a => (a.enrichments?.[0]?.intent_score || 0) >= 7).length
    const personas = new Set(enriched.map(a => a.enrichments?.[0]?.likely_persona).filter(Boolean))
    
    return {
      total: accounts.length,
      avgIntent: Math.round(avgIntent * 10) / 10,
      highIntent,
      uniquePersonas: personas.size
    }
  }, [accounts])

  // Filtered & sorted accounts
  const filteredAccounts = useMemo(() => {
    let result = [...accounts]
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a => 
        a.name.toLowerCase().includes(q) ||
        a.domain?.toLowerCase().includes(q) ||
        a.industry?.toLowerCase().includes(q)
      )
    }
    
    if (sortBy === 'intent') {
      result.sort((a, b) => 
        (b.enrichments?.[0]?.intent_score || 0) - (a.enrichments?.[0]?.intent_score || 0)
      )
    }
    
    return result
  }, [accounts, searchQuery, sortBy])

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading accounts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
            <span className="gradient-text-primary">Intelligence</span> Dashboard
          </h1>
          <p className="text-muted-foreground">Track enriched visitor signals and target account intel.</p>
        </div>
        <Link 
          href="/enrich"
          className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all gradient-primary text-white hover:opacity-90 h-10 px-5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
        >
          <Plus className="h-4 w-4" />
          New Enrichment
        </Link>
      </div>

      {/* Stats Cards */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children relative z-10">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground font-medium">Total Accounts</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgIntent}<span className="text-sm text-muted-foreground font-normal">/10</span></p>
                <p className="text-xs text-muted-foreground font-medium">Avg Intent Score</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10">
                <Zap className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.highIntent}</p>
                <p className="text-xs text-muted-foreground font-medium">High Intent (7+)</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniquePersonas}</p>
                <p className="text-xs text-muted-foreground font-medium">Unique Personas</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] glass-card rounded-2xl border-dashed text-center p-8">
          <div className="gradient-primary p-4 rounded-2xl mb-4 shadow-lg shadow-primary/20">
            <LayoutGrid className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">No accounts yet</h2>
          <p className="text-muted-foreground max-w-md mb-6 text-sm">
            Get started by analyzing a company name or visitor signals to generate your first Account Intelligence profile.
          </p>
          <Link 
            href="/enrich"
            className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all gradient-primary text-white hover:opacity-90 h-10 px-5 shadow-lg shadow-primary/20"
          >
            Run First Analysis
          </Link>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search accounts..."
                className="h-10 w-full pl-10 pr-4 rounded-xl border-2 bg-white/80 text-sm transition-colors focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'intent')}
                className="h-10 px-3 rounded-xl border-2 bg-white/80 text-sm focus:border-primary focus:outline-none appearance-none cursor-pointer"
              >
                <option value="date">Sort: Newest</option>
                <option value="intent">Sort: Highest Intent</option>
              </select>
              <div className="flex items-center bg-muted/80 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    viewMode === 'grid' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    viewMode === 'list' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Account Cards */}
          <div className={cn(
            "stagger-children",
            viewMode === 'grid' 
              ? "grid grid-cols-1 xl:grid-cols-2 gap-6" 
              : "flex flex-col gap-6"
          )}>
            {filteredAccounts.map(account => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>

          {filteredAccounts.length === 0 && searchQuery && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No accounts matching &quot;{searchQuery}&quot;
            </div>
          )}
        </>
      )}
    </div>
  )
}
