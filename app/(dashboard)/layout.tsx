import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import AIDrawer from '@/components/layout/AIDrawer'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  const org = profile.organizations

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar org={org} profile={profile} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar profile={profile} org={org} />
        <main className="flex-1 overflow-y-auto p-5" style={{ backgroundColor: '#f2f4f9' }}>
          {children}
        </main>
      </div>
      <AIDrawer org={org} profile={profile} />
    </div>
  )
}
