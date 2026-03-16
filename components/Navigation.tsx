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
    router.refresh()
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/enrich', label: 'Enrich', icon: Sparkles },
    { href: '/setup', label: 'Setup', icon: Code2 },
  ]

  return (
    <nav className="sticky top-0 z-50 glass border-b">
      <div className="flex h-16 items-center px-4 md:px-6 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg mr-8 group">
          <div className="gradient-primary p-2 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="gradient-text">AccountIQ</span>
        </Link>
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                pathname === href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
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
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted/80"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
