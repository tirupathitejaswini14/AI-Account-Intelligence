import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple mock for batch processing
// In a real app, this would use a background queue like Inngest, Upstash QStash, or Supabase Edge Functions
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companies } = await request.json()
    
    if (!Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json({ error: 'Array of company names required' }, { status: 400 })
    }

    // Limit batch size for prototype safety
    const maxBatch = 10
    const batchToProcess = companies.slice(0, maxBatch)

    // Trigger enrich API for each company asynchronously
    // Note: this is a naive implemention for hackathon demo purposes
    const promises = batchToProcess.map(async (companyName) => {
      try {
        const HOST = request.headers.get('host') || 'localhost:3000'
        const PROTOCOL = HOST.includes('localhost') ? 'http' : 'https'
        
        await fetch(`${PROTOCOL}://${HOST}/api/enrich`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Pass along cookies so the enrichment route has auth context
            cookie: request.headers.get('cookie') || ''
          },
          body: JSON.stringify({ type: 'company', input: companyName })
        })
        return { company: companyName, status: 'started' }
      } catch (e) {
        return { company: companyName, status: 'failed' }
      }
    })

    const results = await Promise.allSettled(promises)
    
    return NextResponse.json({ 
      message: `Started batch processing for ${batchToProcess.length} companies`,
      results 
    })

  } catch (error: any) {
    console.error('Batch API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
