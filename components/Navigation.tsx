'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, LayoutDashboard, Sparkles, Zap, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/enrich', label: 'Enrich', icon: Sparkles },
    { href: '/setup', label: 'Setup', icon: Code2 },
  ]

  // Hide sidebar on public pages
  const PUBLIC_PATHS = ['/home', '/about', '/contact', '/login']
  if (PUBLIC_PATHS.includes(pathname)) return null

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col p-4">
      {/* Brand Logo */}
      <div className="px-4 py-6 mb-6">
        <Link href="/" className="flex items-center gap-3 font-bold text-xl group">
          <div className="bg-primary p-2 rounded-xl shadow-sm group-hover:shadow-md transition-all text-white">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-slate-900 tracking-tight">AccountIQ</span>
        </Link>
      </div>

      {/* Nav Links */}
      <div className="flex-1 flex flex-col gap-2 px-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-2">Menu</div>
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Bottom Profile / Logout */}
      <div className="mt-auto px-2 pb-4">
        <div className="h-px w-full bg-slate-200 mb-4"></div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-between text-sm font-medium text-slate-500 hover:text-red-500 transition-colors px-3 py-2.5 rounded-xl hover:bg-red-50 border border-transparent"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </div>
        </button>
      </div>
    </aside>
  )
}
