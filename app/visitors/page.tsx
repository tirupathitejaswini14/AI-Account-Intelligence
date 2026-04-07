'use client'

import { useState, useEffect } from 'react'
import { EnrichedAccount } from '@/lib/types'
import { Calendar, Globe, MapPin, Search, ArrowUpDown, Clock, MonitorSmartphone, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function VisitorsPage() {
  const [accounts, setAccounts] = useState<EnrichedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
    } finally {
      setLoading(false)
    }
  }

  // Filter accounts based on search
  const filtered = accounts.filter(acc => {
    const term = search.toLowerCase()
    const enrichment = acc.enrichments?.[0]
    const rawData = enrichment?.raw_visitor_data
    
    return (
      acc.name?.toLowerCase().includes(term) ||
      acc.domain?.toLowerCase().includes(term) ||
      rawData?.ip_address?.toLowerCase().includes(term) ||
      acc.industry?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Traffic Logs</h1>
          <p className="text-slate-500 mt-1">Raw visitor IP intelligence and session behaviors.</p>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search IPs, companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm animate-slide-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Visitor IP & Location</th>
                <th className="px-6 py-4">Company Resolution</th>
                <th className="px-6 py-4">Session Behavior</th>
                <th className="px-6 py-4">Source</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading traffic logs...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No visitor records found.</td>
                </tr>
              ) : (
                filtered.map((acc) => {
                  const enrichment = acc.enrichments?.[0]
                  const rawData = enrichment?.raw_visitor_data
                  const intent_score = enrichment?.intent_score || 0
                  
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Timestamp */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 whitespace-nowrap">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(acc.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* IP & Location */}
                      <td className="px-6 py-4 align-top">
                        <div className="font-mono text-sm font-semibold text-slate-900 mb-1">
                          {rawData?.ip_address || 'Mocked Localhost'}
                        </div>
                        {acc.headquarters && (
                          <div className="flex items-start gap-1 text-[11px] font-medium text-slate-500">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" /> {acc.headquarters}
                          </div>
                        )}
                      </td>

                      {/* Company Resolution */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2 mb-1">
                          {acc.logo_url && <img src={acc.logo_url} className="w-5 h-5 object-contain rounded" />}
                          <div className="font-bold text-slate-900 line-clamp-1">{acc.name || 'Unknown'}</div>
                        </div>
                        {acc.domain && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                            <Globe className="h-3 w-3" /> {acc.domain}
                          </div>
                        )}
                        {!acc.domain && rawData?._meta?.is_unknown && (
                          <div className="inline-flex px-2 py-0.5 mt-1 bg-amber-50 text-amber-600 rounded-md text-[10px] uppercase font-bold border border-amber-200">
                            Consumer ISP
                          </div>
                        )}
                      </td>

                      {/* Behavior */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Dwell Time</span>
                            <span className="text-xs font-semibold text-slate-700">{rawData?.dwell_time_seconds || 0}s</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Pages</span>
                            <span className="text-xs font-semibold text-slate-700">{rawData?.pages_visited?.length || 0}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
                            <span className={cn('text-xs font-bold', intent_score >= 7 ? 'text-red-500' : intent_score >= 4 ? 'text-amber-500' : 'text-blue-500')}>
                              {intent_score}/10
                            </span>
                          </div>
                        </div>
                        {rawData?.pages_visited && rawData.pages_visited.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {rawData.pages_visited.slice(0, 3).map((p: string, i: number) => (
                              <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                                {p}
                              </span>
                            ))}
                            {rawData.pages_visited.length > 3 && (
                              <span className="text-[10px] text-slate-400">+{(rawData.pages_visited.length - 3)}</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Source */}
                      <td className="px-6 py-4 align-top">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 capitalize">
                          <LinkIcon className="h-3 w-3 text-slate-400" />
                          {rawData?.referral_source || 'direct'}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
