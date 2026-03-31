'use client'
import { createClient } from '@/lib/supabase/client'
import { getTerms } from '@/lib/terminology'
import type { Profile, Organization } from '@/types'
import { useEffect, useState } from 'react'

export function useOrg() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data as Profile)
            setOrg(data.organizations as Organization)
          }
          setLoading(false)
        })
    })
  }, [])

  const terms = org ? getTerms(org.industry) : getTerms('Other')

  return { profile, org, terms, loading }
}
