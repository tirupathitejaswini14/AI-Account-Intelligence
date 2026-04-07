'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, Mail, MapPin, Phone, Send, CheckCircle, Loader2 } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    // Simulate sending
    await new Promise(r => setTimeout(r, 1500))
    setStatus('sent')
  }

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
            <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">About Us</Link>
            <Link href="/contact" className="text-sm font-medium text-slate-900">Contact</Link>
            <Link href="/login" className="text-sm font-semibold text-white bg-primary px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-indigo-50/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Touch</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Have questions about AccountIQ? Want a demo? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
            {/* Contact Info */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-black text-slate-900 mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Email</div>
                    <div className="text-sm text-slate-500">hello@accountiq.ai</div>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Location</div>
                    <div className="text-sm text-slate-500">Hyderabad, India</div>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Phone</div>
                    <div className="text-sm text-slate-500">+91 98765 43210</div>
                  </div>
                </div>
              </div>

              <div className="mt-10 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <div className="text-sm font-bold text-indigo-900 mb-2">🕐 Response Time</div>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  We typically respond within 24 hours during business days. 
                  For urgent inquiries, please mention "URGENT" in the subject line.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-3">
              {status === 'sent' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-emerald-900 mb-2">Message Sent!</h3>
                  <p className="text-emerald-700 text-sm mb-6">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                  <button onClick={() => { setStatus('idle'); setFormData({ name: '', email: '', company: '', message: '' }); }} className="text-sm font-semibold text-emerald-700 hover:underline">
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                      <input
                        type="text" required
                        value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
                      <input
                        type="email" required
                        value={formData.email}
                        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                        placeholder="john@company.com"
                        className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                      placeholder="Acme Inc."
                      className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message *</label>
                    <textarea
                      required rows={5}
                      value={formData.message}
                      onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                      placeholder="Tell us about your needs..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-primary focus:outline-none resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {status === 'sending' ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="h-4 w-4" /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
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
