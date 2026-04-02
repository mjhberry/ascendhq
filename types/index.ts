export type Industry =
  | 'HVAC' | 'Plumbing' | 'Electrical' | 'Roofing'
  | 'Landscaping' | 'Cleaning' | 'Painting' | 'Pest Control'
  | 'Legal' | 'Accounting' | 'Consulting' | 'Financial'
  | 'Medical' | 'Real Estate' | 'Insurance' | 'Marketing' | 'Other'

export type Category = 'home' | 'pro'

export type OrgRole = 'owner' | 'technician' | 'office' | 'sales'

export interface Organization {
  id: string
  name: string
  industry: Industry
  category: Category
  slug: string
  created_at: string
}

export interface Profile {
  id: string
  org_id: string
  full_name: string | null
  email: string | null
  role: OrgRole
  avatar_url: string | null
  created_at: string
  organizations?: Organization
}

export interface Contact {
  id: string
  org_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  type: 'residential' | 'commercial'
  status: 'active' | 'inactive' | 'lead'
  notes: string | null
  last_contact_at: string | null
  lifetime_value: number
  created_at: string
}

export type JobStatus = 'accepted' | 'in_progress' | 'complete' | 'invoiced' | 'cancelled'

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'converted'

export interface QuoteLineItem {
  description: string
  quantity: number
  unit_price: number
}

export interface Quote {
  id: string
  org_id: string
  contact_id: string | null
  title: string
  description: string | null
  status: QuoteStatus
  line_items: QuoteLineItem[]
  subtotal: number
  tax: number
  total: number
  valid_until: string | null
  accepted_at: string | null
  job_id: string | null
  notes: string | null
  token: string | null
  client_name: string | null
  client_email: string | null
  sent_at?: string | null
  created_at: string
  contacts?: { name: string }
}
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Job {
  id: string
  org_id: string
  contact_id: string | null
  title: string
  description: string | null
  status: JobStatus
  priority: JobPriority
  assigned_to: string | null
  value: number
  scheduled_at: string | null
  completed_at: string | null
  created_at: string
  contacts?: Contact
  profiles?: Profile
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface InvoiceItem {
  id: string
  org_id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  total: number
  created_at: string
}

export interface Invoice {
  id: string
  org_id: string
  contact_id: string | null
  job_id: string | null
  number: string
  status: InvoiceStatus
  subtotal: number
  tax: number
  total: number
  due_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  contacts?: Contact
  invoice_items?: InvoiceItem[]
}

export interface Appointment {
  id: string
  org_id: string
  job_id: string | null
  contact_id: string | null
  assigned_to: string | null
  title: string
  starts_at: string
  ends_at: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes: string | null
  created_at: string
  contacts?: Contact
  jobs?: Job
}

export interface Document {
  id: string
  org_id: string
  contact_id: string | null
  job_id: string | null
  name: string
  type: 'contract' | 'permit' | 'photo' | 'proposal' | 'warranty' | 'other' | null
  storage_path: string | null
  file_url: string | null
  size_bytes: number | null
  uploaded_by: string | null
  created_at: string
}

export interface Lead {
  id: string
  org_id: string
  name: string
  email: string | null
  phone: string | null
  source: 'website' | 'google' | 'referral' | 'facebook' | 'other' | null
  service: string | null
  status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost'
  value: number
  notes: string | null
  created_at: string
}

export interface Automation {
  id: string
  org_id: string
  name: string
  description: string | null
  trigger: 'job_complete' | 'invoice_overdue' | 'new_lead' | 'appointment_reminder'
  status: 'active' | 'paused'
  run_count: number
  last_run_at: string | null
  created_at: string
}

export interface AILog {
  id: string
  org_id: string
  user_id: string | null
  module: 'assistant' | 'automation' | 'briefing'
  prompt: string | null
  response: string | null
  tokens_used: number | null
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
