'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile, Organization } from '@/types'
import { getInitials } from '@/lib/utils'

interface TopBarProps {
  profile: Profile
  org?: Organization
}

export default function TopBar({ profile }: TopBarProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-12 bg-white flex items-center justify-between px-5 flex-shrink-0"
      style={{ borderBottom: '1px solid #e8ebf4' }}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#1e3a5f', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
          AscendHQ
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => document.dispatchEvent(new CustomEvent('open-ai'))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ backgroundColor: '#e4eef9', color: '#1e3a5f', border: '1px solid #c8ddf5' }}
        >
          <span>🤖</span>
          Ask AI
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4' }}
        >
          Sign out
        </button>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
          style={{ backgroundColor: '#1e3a5f' }}>
          {getInitials(profile.full_name)}
        </div>
      </div>
    </header>
  )
}
