import Anthropic from '@anthropic-ai/sdk'
import { type NextRequest } from 'next/server'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { description } = await request.json()
  if (!description?.trim()) {
    return Response.json({ error: 'Description is required' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Generate line items for a service quote based on this job description: "${description}"

Return ONLY a JSON array — no explanation, no markdown. Format:
[{"description": "...", "quantity": 1, "unit_price": 150}]

Rules:
- 2–5 line items
- Be specific and realistic for the described service
- unit_price in USD as a number (no $ sign)
- quantity as a number`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    return Response.json({ error: 'Could not parse line items from AI response' }, { status: 500 })
  }

  try {
    const lineItems = JSON.parse(jsonMatch[0])
    return Response.json({ lineItems })
  } catch {
    return Response.json({ error: 'Invalid JSON from AI response' }, { status: 500 })
  }
}
