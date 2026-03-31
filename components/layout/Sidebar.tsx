'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getTerms } from '@/lib/terminology'
import type { Organization, Profile } from '@/types'

const mainNav = (terms: ReturnType<typeof getTerms>) => [
  { href: '/dashboard', label: 'Home',        icon: '🏠' },
  { href: '/clients',   label: terms.clients, icon: '👥' },
  { href: '/jobs',      label: terms.jobs,    icon: terms.jobIcon },
  { href: '/schedule',  label: terms.schedule, icon: '📅' },
  { href: '/billing',   label: 'Billing',     icon: '💰' },
  { href: '/documents', label: 'Documents',   icon: '📁' },
]

const toolsNav = [
  { href: '/marketing',   label: 'Marketing',   icon: '📣' },
  { href: '/automations', label: 'Automations', icon: '⚡' },
]

interface SidebarProps {
  org: Organization
  profile: Profile
}

export default function Sidebar({ org, profile }: SidebarProps) {
  const pathname = usePathname()
  const terms = getTerms(org.industry)

  return (
    <aside className="w-[210px] flex-shrink-0 flex flex-col h-full" style={{ backgroundColor: '#1e3a5f' }}>
      {/* Header */}
      <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
            {org.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-bold truncate">{org.name}</div>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {org.industry}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5">
        <p className="text-[9px] font-bold uppercase tracking-widest px-3 py-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Main</p>
        {mainNav(terms).map((item) => {
          const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all mb-0.5"
              style={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                fontWeight: isActive ? 600 : 500,
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)' } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' } }}
            >
              <span className="text-sm w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        <div className="my-2 mx-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
        <p className="text-[9px] font-bold uppercase tracking-widest px-3 py-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Tools</p>

        <button
          onClick={() => document.dispatchEvent(new CustomEvent('open-ai'))}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all mb-0.5 text-left"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
        >
          <span className="text-sm w-4 text-center">🤖</span>
          AI Assistant
        </button>

        {toolsNav.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all mb-0.5"
              style={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                fontWeight: isActive ? 600 : 500,
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)' } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' } }}
            >
              <span className="text-sm w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        <div className="my-2 mx-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
        <Link href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
        >
          <span className="text-sm w-4 text-center">⚙️</span>
          Settings
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ backgroundColor: '#3b6cb0', border: '1px solid rgba(255,255,255,0.2)' }}>
            {profile.full_name?.slice(0, 2).toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{profile.full_name}</div>
            <div className="text-[10px] capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>{profile.role} · {org.industry}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
