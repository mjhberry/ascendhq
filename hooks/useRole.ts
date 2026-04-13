'use client'
import { useOrg } from './useOrg'
import type { OrgRole } from '@/types'

export function useRole() {
  const { profile } = useOrg()
  const role = profile?.role as OrgRole | undefined

  return {
    role,
    isOwner: role === 'owner',
    canManageTeam: role === 'owner' || role === 'office',
    canViewBilling: role === 'owner' || role === 'office',
    canViewAllJobs: role === 'owner' || role === 'office' || role === 'sales',
    canViewMarketing: role === 'owner' || role === 'office' || role === 'sales',
    canEditClients: role === 'owner' || role === 'office' || role === 'sales',
  }
}
