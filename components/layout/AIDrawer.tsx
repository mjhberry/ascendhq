'use client'
import { useEffect, useRef, useState } from 'react'
import { useAI } from '@/hooks/useAI'
import type { Organization, Profile } from '@/types'

interface AIDrawerProps {
  org: Organization
  profile: Profile
}

export default function AIDrawer({ org, profile }: AIDrawerProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, loading, sendMessage, clearMessages } = useAI()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setOpen(true)
    document.addEventListener('open-ai', handler)
    return () => document.removeEventListener('open-ai', handler)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput('')
    await sendMessage(msg)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div className="fixed right-0 top-0 h-full w-[380px] z-50 flex flex-col shadow-2xl"
        style={{ backgroundColor: '#ffffff', borderLeft: '1px solid #e8ebf4' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #e8ebf4' }}>
          <div>
            <div className="text-sm font-bold" style={{ color: '#1a1f2e' }}>🤖 AI Assistant</div>
            <div className="text-[10px]" style={{ color: '#8891aa' }}>Powered by Claude · {org.name}</div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={clearMessages} className="text-[10px] px-2 py-1 rounded"
                style={{ color: '#8891aa', backgroundColor: '#f8f9fc', border: '1px solid #e8ebf4' }}>
                Clear
              </button>
            )}
            <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-sm"
              style={{ color: '#8891aa', backgroundColor: '#f8f9fc', border: '1px solid #e8ebf4' }}>
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🤖</div>
              <div className="text-sm font-semibold mb-1" style={{ color: '#1a1f2e' }}>
                Hi {profile.full_name?.split(' ')[0]}!
              </div>
              <div className="text-xs" style={{ color: '#8891aa' }}>
                Ask me anything about your {org.industry.toLowerCase()} business.
              </div>
              <div className="mt-4 space-y-2">
                {['What should I focus on today?', 'How can I improve lead conversion?', 'Help me write a follow-up email'].map(q => (
                  <button key={q} onClick={() => sendMessage(q)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg transition-all"
                    style={{ backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4' }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white rounded-br-sm'
                  : 'rounded-bl-sm'
              }`} style={
                msg.role === 'user'
                  ? { backgroundColor: '#1e3a5f' }
                  : { backgroundColor: '#f2f4f9', color: '#1a1f2e', border: '1px solid #e8ebf4' }
              }>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-xl rounded-bl-sm text-xs" style={{ backgroundColor: '#f2f4f9', color: '#8891aa', border: '1px solid #e8ebf4' }}>
                <span className="animate-pulse">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4" style={{ borderTop: '1px solid #e8ebf4' }}>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything…"
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
              style={{ backgroundColor: '#f8f9fc', border: '1px solid #e8ebf4', color: '#1a1f2e' }}
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              style={{ backgroundColor: '#1e3a5f', color: 'white' }}>
              Send
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
