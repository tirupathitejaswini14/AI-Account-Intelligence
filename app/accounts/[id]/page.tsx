'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EnrichedAccount } from '@/lib/types'
import { AccountCard } from '@/components/AccountCard'
import { ArrowLeft, Loader2, Trash2, Calendar, Link as LinkIcon, Users, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function AccountDetailView() {
  const params = useParams()
  const router = useRouter()
  const [account, setAccount] = useState<EnrichedAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchAccount(params.id as string)
    }
  }, [params.id])

  const fetchAccount = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('accounts')
        .select(`
          *,
          enrichments (*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      
      // Sort enrichments to get latest first if multiple
      if (data && data.enrichments) {
         data.enrichments.sort((a: any, b: any) => 
           new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
         )
      }
      
      setAccount(data)
    } catch (e) {
      console.error('Failed to fetch account detail:', e)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this account intelligence profile?')) return

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', params.id as string)
        .eq('user_id', user.id)
        
      if (error) throw error
      
      router.push('/dashboard')
    } catch (e) {
      console.error('Failed to delete:', e)
      alert("Failed to delete account.")
      setLoading(false)
    }
  }

  if (loading) {
     return (
       <div className="flex justify-center items-center py-20">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     )
  }

  if (!account) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold mb-2">Account Not Found</h2>
        <p className="text-muted-foreground mb-6">This intelligence profile may have been deleted or doesn't exist.</p>
        <Link href="/dashboard" className="text-primary hover:underline">Return to Dashboard</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <button 
          onClick={handleDelete}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-destructive/10 hover:text-destructive h-9 px-3"
          aria-label="Delete Account"
          title="Delete Account"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Account Dossier</h1>
        <p className="text-muted-foreground">Detailed intelligence profile and historical data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card View */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AccountCard account={account} className="shadow-md" />
          </div>
          
          {/* Company Description */}
          {account.description && (
            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-semibold mb-3">Company Background</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {account.description}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Firmographics</h3>
            <div className="space-y-4 text-sm">
              {account.domain && (
                <div className="flex items-start gap-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Website</div>
                    <a href={`https://${account.domain}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {account.domain}
                    </a>
                  </div>
                </div>
              )}
              {account.headquarters && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Headquarters</div>
                    <div className="text-muted-foreground">{account.headquarters}</div>
                  </div>
                </div>
              )}
              {account.size && (
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Company Size</div>
                    <div className="text-muted-foreground">{account.size} employees</div>
                  </div>
                </div>
              )}
              {account.founded_year && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Founded</div>
                    <div className="text-muted-foreground">{account.founded_year}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            Profile created on {new Date(account.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
