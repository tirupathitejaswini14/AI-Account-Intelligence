import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: Request) {
  try {
    // Accept both JSON and text/plain (sendBeacon sends as text/plain)
    const contentType = request.headers.get('content-type') || ''
    const rawBody = await request.text()

    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      return new NextResponse(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const { api_key, visitor_id, pages_visited, dwell_time_seconds, visits_this_week, referral_source } = body

    if (!api_key || typeof api_key !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'api_key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // Validate API key using a security-definer RPC (bypasses RLS safely)
    const supabase = createClient()
    const { data: userId, error: rpcError } = await supabase.rpc('validate_api_key', { p_key: api_key })

    if (rpcError || !userId) {
      return new NextResponse(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // Extract real visitor IP from headers (works behind proxies/CDNs)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      '0.0.0.0'

    const enrichPayload = {
      type: 'visitor',
      input: {
        ip_address: ip,
        visitor_id: visitor_id || null,
        pages_visited: Array.isArray(pages_visited) ? pages_visited : [],
        dwell_time_seconds: Math.max(0, Number(dwell_time_seconds) || 0),
        visits_this_week: Math.max(1, Number(visits_this_week) || 1),
        referral_source: typeof referral_source === 'string' ? referral_source : 'direct',
      },
    }

    // Fire enrichment — we MUST await this on Vercel (Serverless Functions drop un-awaited promises)
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'

    try {
      await fetch(`${protocol}://${host}/api/enrich`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-user-id': userId as string,
        },
        body: JSON.stringify(enrichPayload),
      });
    } catch (err: any) {
      console.warn('[TRACK] Enrichment error:', err.message);
    }

    return new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (error: any) {
    console.error('[TRACK] Unexpected error:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
}
