'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Key, Trash2, Plus, Code2, Globe, Zap, Shield, ChevronRight, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ApiKey = {
  id: string
  name: string
  key: string
  created_at: string
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all',
        copied
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function SetupPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/keys')
      if (res.ok) setKeys(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      if (res.ok) {
        const newKey = await res.json()
        setKeys(prev => [newKey, ...prev])
        setNewKeyName('')
        setShowCreateForm(false)
      }
    } finally {
      setCreating(false)
    }
  }

  const deleteKey = async (id: string) => {
    if (!confirm('Delete this API key? Any websites using it will stop tracking.')) return
    const res = await fetch('/api/keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setKeys(prev => prev.filter(k => k.id !== id))
  }

  const activeKey = keys[0]

  const snippetScript = activeKey
    ? `<script src="${origin}/tracker.js"\n        data-api-key="${activeKey.key}" async></script>`
    : `<!-- Generate an API key below first -->`

  const snippetFull = activeKey
    ? `<!-- AccountIQ Visitor Tracker -->
<!-- Add this snippet before </body> on every page of your website -->
<script src="${origin}/tracker.js"
        data-api-key="${activeKey.key}" async></script>`
    : ''

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="gradient-primary p-2.5 rounded-xl shadow-sm">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tracking Setup</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Install the AccountIQ tracker on your website to automatically identify and score B2B visitors.
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-bold mb-4">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Globe,
              step: '1',
              title: 'Visitor lands on your site',
              desc: 'The tracker script captures page views, dwell time, and referral source anonymously.',
            },
            {
              icon: Zap,
              step: '2',
              title: 'IP resolved to company',
              desc: 'AccountIQ resolves the visitor\'s IP to their company using reverse IP lookup.',
            },
            {
              icon: Shield,
              step: '3',
              title: 'Intelligence appears in dashboard',
              desc: 'The company is enriched and scored. High-intent accounts surface automatically.',
            },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                {step}
              </div>
              <div>
                <div className="font-semibold text-sm mb-1">{title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: API Key */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">1</div>
            <h2 className="font-bold">Your API Keys</h2>
          </div>
          <button
            onClick={() => setShowCreateForm(v => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg gradient-primary text-white hover:opacity-90 transition-all"
          >
            <Plus className="h-4 w-4" /> New Key
          </button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <form onSubmit={createKey} className="flex gap-3 p-4 bg-muted/60 rounded-xl animate-slide-up">
            <input
              type="text"
              placeholder="Key name, e.g. Production Website"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              required
              className="flex-1 h-10 px-3 rounded-lg border-2 bg-white text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={creating || !newKeyName.trim()}
              className="h-10 px-4 rounded-lg gradient-primary text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-all"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="h-10 px-3 rounded-lg border text-sm hover:bg-muted transition-all">
              Cancel
            </button>
          </form>
        )}

        {/* Keys list */}
        {loading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />Loading keys…
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
            <Key className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No API keys yet.</p>
            <p className="text-xs mt-1">Create one above to get your embed snippet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map(k => (
              <div key={k.id} className={cn(
                'flex items-center gap-3 p-3 rounded-xl border bg-white/80',
                k.id === activeKey?.id && 'border-primary/30 bg-primary/5'
              )}>
                <Key className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{k.name}</span>
                    {k.id === activeKey?.id && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                  <code className="text-xs text-muted-foreground font-mono">{k.key}</code>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <CopyButton text={k.key} />
                  <button
                    onClick={() => deleteKey(k.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Install the script */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">2</div>
          <h2 className="font-bold">Add the tracking snippet</h2>
        </div>

        {!activeKey ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Create an API key above first to see your personalised embed code.
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Paste this snippet before the <code className="bg-muted px-1 rounded text-xs">&lt;/body&gt;</code> tag on{' '}
              <strong>every page</strong> of your website. That&apos;s all — no other configuration needed.
            </p>

            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 text-xs rounded-xl p-5 overflow-x-auto leading-relaxed font-mono">
                <span className="text-slate-500">{`<!-- AccountIQ Visitor Tracker -->\n`}</span>
                <span className="text-slate-500">{`<!-- Paste before </body> on every page -->\n`}</span>
                <span className="text-green-400">{`<script`}</span>
                {` src="`}<span className="text-yellow-300">{origin}/tracker.js</span>{`"\n`}
                {'        data-api-key="'}<span className="text-yellow-300">{activeKey.key}</span>{'" '}
                <span className="text-green-400">async</span>
                <span className="text-green-400">{`></script>`}</span>
              </pre>
              <div className="absolute top-3 right-3">
                <CopyButton text={snippetFull} />
              </div>
            </div>

            {/* WordPress / Tag Manager alternatives */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-xl border bg-white/80 text-sm">
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  <span className="text-base">🏷️</span> Google Tag Manager
                </div>
                <p className="text-xs text-muted-foreground mb-2">Create a new Custom HTML tag, paste the snippet, and set it to fire on All Pages.</p>
                <div className="text-xs text-primary font-medium flex items-center gap-1">GTM → Tags → New → Custom HTML <ChevronRight className="h-3 w-3" /></div>
              </div>
              <div className="p-4 rounded-xl border bg-white/80 text-sm">
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  <span className="text-base">🔌</span> WordPress
                </div>
                <p className="text-xs text-muted-foreground mb-2">Use a plugin like &quot;Insert Headers and Footers&quot; and paste the snippet in the Footer section.</p>
                <div className="text-xs text-primary font-medium flex items-center gap-1">Settings → Insert Headers & Footers <ChevronRight className="h-3 w-3" /></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Step 3: What gets tracked */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">3</div>
          <h2 className="font-bold">What gets collected</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { emoji: '🌐', label: 'IP address', desc: 'Used to identify the visitor\'s company. Never stored permanently.' },
            { emoji: '📄', label: 'Pages visited', desc: 'Page paths (e.g. /pricing, /demo) — not full URLs with query strings.' },
            { emoji: '⏱️', label: 'Dwell time', desc: 'Seconds spent on the session. Used for intent scoring.' },
            { emoji: '🔗', label: 'Referral source', desc: 'Where the visitor came from (google, linkedin, direct, etc.).' },
            { emoji: '📊', label: 'Visit frequency', desc: 'How many times this browser visited your site this week.' },
            { emoji: '🚫', label: 'Not collected', desc: 'No personal data, no cookies, no form inputs, no mouse tracking.' },
          ].map(({ emoji, label, desc }) => (
            <div key={label} className="flex gap-3 p-3 rounded-xl bg-muted/40">
              <span className="text-lg flex-shrink-0">{emoji}</span>
              <div>
                <div className="text-sm font-semibold">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 4: Verify */}
      <div className="glass-card rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">4</div>
          <h2 className="font-bold">Verify installation</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          After adding the snippet, visit your website normally. Within a minute, new accounts should appear in your{' '}
          <a href="/dashboard" className="text-primary hover:underline font-medium">Intelligence Dashboard</a>.
        </p>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <strong>Tip:</strong> Visitor signals from consumer ISPs (Comcast, Verizon, AT&T, etc.) won&apos;t generate company profiles — only B2B corporate IPs do.
          Test with your office Wi-Fi or a VPN connected to a corporate network.
        </div>
      </div>
    </div>
  )
}
