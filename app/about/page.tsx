'use client'

import Link from 'next/link'
import { Zap, Users, Shield, Globe, Target, BarChart3, ArrowRight, Code2, Brain, Database, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AboutPage() {
  return (
    <div className="!p-0 -m-6 md:-m-10 lg:-m-12">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <Link href="/home" className="flex items-center gap-2.5 font-bold text-lg">
            <div className="bg-primary p-1.5 rounded-lg text-white"><Zap className="h-4 w-4" /></div>
            AccountIQ
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/home" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Home</Link>
            <Link href="/about" className="text-sm font-medium text-slate-900">About Us</Link>
            <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Contact</Link>
            <Link href="/login" className="text-sm font-semibold text-white bg-primary px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-indigo-50/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">AccountIQ</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            We're building the AI-powered intelligence layer that transforms anonymous web traffic into actionable B2B sales insights.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 text-sm font-semibold text-indigo-700 mb-4">
                <Target className="h-3.5 w-3.5" /> Our Mission
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Bridging the gap between traffic and revenue</h2>
              <p className="text-slate-500 leading-relaxed mb-4">
                Sales and marketing teams deal with two major data problems: anonymous website visitors provide little actionable insight, 
                and incomplete company data makes it hard to prioritize accounts.
              </p>
              <p className="text-slate-500 leading-relaxed">
                AccountIQ solves both by using AI to convert raw signals into structured account intelligence and recommended sales actions — 
                automatically and in real time.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '6', label: 'Enrichment Sources', sub: 'Wikipedia, BuiltWith, News, IP, Website Scraping, AI' },
                { num: '4', label: 'Profile Dimensions', sub: 'Segments, Behaviours, Attributes, Insights' },
                { num: '0-10', label: 'Intent Scoring', sub: 'Real-time buyer intent from page behavior' },
                { num: '3', label: 'Sales Plays', sub: 'AI-generated actions per account' },
              ].map(({ num, label, sub }) => (
                <div key={label} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <div className="text-2xl font-black text-indigo-600 mb-1">{num}</div>
                  <div className="text-sm font-bold text-slate-900 mb-1">{label}</div>
                  <div className="text-[11px] text-slate-400 leading-snug">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Our Intelligence Pipeline</h2>
            <p className="text-slate-500 max-w-xl mx-auto">A multi-layered system that combines deterministic scoring with AI analysis.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { icon: Globe, title: 'IP Resolution', desc: 'Reverse lookup to identify visitor companies', step: '1' },
              { icon: Users, title: 'Persona Inference', desc: 'Map page patterns to buyer roles', step: '2' },
              { icon: BarChart3, title: 'Intent Scoring', desc: 'Score behavior signals 0-10', step: '3' },
              { icon: Database, title: 'Profile Enrichment', desc: 'Wikipedia, news, tech stack, website', step: '4' },
              { icon: Brain, title: 'AI Analysis', desc: 'Summary, actions, visitor profile', step: '5' },
            ].map(({ icon: Icon, title, desc, step }) => (
              <div key={step} className="bg-white rounded-xl p-5 border border-slate-200 text-center relative">
                <div className="w-8 h-8 mx-auto rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold mb-3">{step}</div>
                <Icon className="h-5 w-5 mx-auto text-slate-400 mb-2" />
                <div className="text-sm font-bold text-slate-900 mb-1">{title}</div>
                <div className="text-[11px] text-slate-400 leading-snug">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Built With Modern Technology</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {['Next.js 14', 'React', 'TypeScript', 'Supabase', 'OpenRouter AI', 'Tailwind CSS', 'Wikipedia API', 'SerpAPI', 'BuiltWith', 'IP-API'].map(tech => (
              <span key={tech} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
        <div className="max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl font-black mb-4">See it in action</h2>
          <p className="text-indigo-200 mb-8">Run the intelligence pipeline on any company or visitor signal.</p>
          <Link href="/enrich" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl text-sm hover:bg-indigo-50 transition-colors shadow-lg">
            Try Intelligence Pipeline <ArrowRight className="h-4 w-4" />
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
