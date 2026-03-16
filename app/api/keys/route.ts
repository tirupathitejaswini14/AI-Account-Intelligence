import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return 'aiq_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// GET — list the user's API keys
export async function GET() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error: keysError } = await supabase
    .from('api_keys')
    .select('id, name, key, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (keysError) return NextResponse.json({ error: keysError.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — create a new API key
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const name = (body.name || 'Default Key').toString().slice(0, 80)

  const { data, error: insertError } = await supabase
    .from('api_keys')
    .insert({ user_id: user.id, key: generateApiKey(), name })
    .select('id, name, key, created_at')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — delete an API key by id
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error: deleteError } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
