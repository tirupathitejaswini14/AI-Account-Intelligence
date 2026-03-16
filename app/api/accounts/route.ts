import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Check auth — return empty array if not logged in (demo mode)
    let userId: string | null = null
    try {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null
    } catch {
      // Not authenticated
    }

    if (!userId) {
      // In demo mode, return empty array (accounts aren't persisted without auth)
      return NextResponse.json([])
    }

    const { data, error } = await supabase
      .from('accounts')
      .select(`
        *,
        enrichments (*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Accounts API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
