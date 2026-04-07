'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, Home, Users, Mail, LayoutDashboard, ArrowRight, ChevronRight, Sparkles, Shield, Globe, TrendingUp, BarChart3, Target, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/home', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
]

export default function HomePage() {
  return (
    <div className="!p-0 -m-6 md:-m-10 lg:-m-12">
      {/* Public Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <Link href="/home" className="flex items-center gap-2.5 font-bold text-lg">
            <div className="bg-primary p-1.5 rounded-lg text-white"><Zap className="h-4 w-4" /></div>
            AccountIQ
          </Link>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{l.label}</Link>
            ))}
            <Link href="/login" className="text-sm font-semibold text-white bg-primary px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.06),transparent_50%)]" />
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 text-sm font-semibold text-indigo-700 mb-6">
              <Sparkles className="h-3.5 w-3.5" /> AI-Powered B2B Intelligence
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
              Turn anonymous visitors into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                qualified pipeline
              </span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-10 max-w-2xl">
              AccountIQ identifies companies visiting your website, enriches them with firmographic data, 
              scores buying intent, and recommends personalized sales actions — all powered by AI.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/enrich" className="inline-flex items-center gap-2 bg-primary text-white font-bold px-7 py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                Try the Pipeline <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/about" className="inline-flex items-center gap-2 border-2 border-slate-200 text-slate-700 font-bold px-7 py-3.5 rounded-xl text-sm hover:border-slate-300 transition-colors">
                Learn More <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-slate-900 mb-3">How AccountIQ Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From anonymous IP to actionable intelligence in under 30 seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: 'Identify', desc: 'Resolve visitor IPs to companies using reverse IP lookup. Works behind corporate firewalls and VPNs.', color: 'bg-blue-50 text-blue-600 border-blue-100' },
              { icon: BarChart3, title: 'Enrich & Score', desc: 'Pull firmographics from Wikipedia, tech stack from BuiltWith, news signals, and score intent 0-10.', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
              { icon: Target, title: 'Act', desc: 'Get AI-generated summaries, buyer persona inference, and 3 concrete recommended sales plays per account.', color: 'bg-violet-50 text-violet-600 border-violet-100' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 border', color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visitor Profile Analysis Highlight */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-full px-4 py-1.5 text-sm font-semibold text-violet-700 mb-4">
                <Users className="h-3.5 w-3.5" /> Visitor Profile Analysis
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Complete visitor intelligence, end-to-end</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Every visitor is analyzed across 4 dimensions — giving your sales team the full picture of who's browsing and why.
              </p>
              <div className="space-y-4">
                {[
                  { title: 'Segments', desc: 'Enterprise Evaluator, Technical Buyer, Pricing Researcher', emoji: '🏷️' },
                  { title: 'Behaviours', desc: 'Deeply reviewed pricing, compared enterprise tiers, read case studies', emoji: '⚡' },
                  { title: 'Attributes', desc: 'C-level executive, Technical decision maker, LinkedIn-sourced', emoji: '🎯' },
                  { title: 'Insights', desc: 'High purchase intent — prioritize for outreach, enterprise deal potential', emoji: '💡' },
                ].map(({ title, desc, emoji }) => (
                  <div key={title} className="flex gap-3 items-start">
                    <span className="text-xl mt-0.5">{emoji}</span>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{title}</div>
                      <div className="text-xs text-slate-500">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="space-y-4">
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                  <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Segments</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Enterprise Evaluator', 'Active Buyer', 'Technical Decision Maker'].map(s => (
                      <span key={s} className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Behaviours</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Reviewed pricing', 'Read case studies'].map(b => (
                        <span key={b} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-xs">{b}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Attributes</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['VP-level', 'LinkedIn sourced'].map(a => (
                        <span key={a} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-xs">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-violet-50/50 rounded-xl p-4 border border-violet-100">
                  <div className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-2">Key Insights</div>
                  <ul className="text-xs space-y-1.5 text-slate-700 font-medium list-disc pl-4">
                    <li>High purchase intent (8.2/10) — prioritize for immediate outreach</li>
                    <li>Enterprise deal potential: explored pricing + enterprise tiers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
        <div className="max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl font-black mb-4">Ready to see who's visiting your site?</h2>
          <p className="text-indigo-200 mb-8 text-lg">Start converting anonymous traffic into qualified accounts today.</p>
          <Link href="/enrich" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl text-sm hover:bg-indigo-50 transition-colors shadow-lg">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold">
            <div className="bg-indigo-600 p-1.5 rounded-lg"><Zap className="h-4 w-4" /></div>
            AccountIQ
          </div>
          <div className="flex gap-8 text-sm">
            <Link href="/home" className="hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
          <p className="text-xs">© 2026 AccountIQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
