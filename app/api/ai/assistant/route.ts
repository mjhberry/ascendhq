import { NextRequest, NextResponse } from 'next/server'
import { anthropic, AI_MODEL } from '@/lib/ai/client'
import { createServerClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, history = [] } = await req.json()
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.organizations) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const systemPrompt = buildSystemPrompt(profile.organizations)

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      ...history,
      { role: 'user', content: message },
    ],
  })

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')

  await supabase.from('ai_logs').insert({
    org_id: profile.org_id,
    user_id: user.id,
    module: 'assistant',
    prompt: message,
    response: text,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens,
  })

  return NextResponse.json({ message: text })
}
