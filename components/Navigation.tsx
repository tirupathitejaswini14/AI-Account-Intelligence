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

  return (
    <div className="w-full flex justify-center sticky top-4 z-50 px-4">
      <nav className="glass border border-white/10 rounded-2xl shadow-xl shadow-black/20 w-full max-w-5xl">
        <div className="flex h-14 items-center px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3 font-bold text-lg mr-8 group">
            <div className="gradient-primary p-2 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="gradient-text-primary tracking-tight">AccountIQ</span>
          </Link>
          <div className="flex items-center gap-1.5">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === href
                    ? "bg-primary/10 text-primary border border-primary/20 backdrop-blur-md shadow-[inset_0_0_20px_rgba(0,240,255,0.1)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-400/10 border border-transparent hover:border-red-400/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
