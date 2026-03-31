'use client'
import { useState } from 'react'
import type { ChatMessage } from '@/types'

export function useAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  async function sendMessage(content: string) {
    const userMsg: ChatMessage = { role: 'user', content }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      setMessages([...newHistory, { role: 'assistant', content: data.message }])
    } catch {
      setMessages([...newHistory, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function clearMessages() {
    setMessages([])
  }

  return { messages, loading, sendMessage, clearMessages }
}
