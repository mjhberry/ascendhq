export type Industry =
  | 'HVAC' | 'Plumbing' | 'Electrical' | 'Roofing'
  | 'Landscaping' | 'Cleaning' | 'Painting' | 'Pest Control'
  | 'Legal' | 'Accounting' | 'Consulting' | 'Financial'
  | 'Medical' | 'Real Estate' | 'Insurance' | 'Marketing' | 'Other'

export type Category = 'home' | 'pro'

export interface Terminology {
  jobs: string
  job: string
  jobIcon: string
  clients: string
  client: string
  schedule: string
  assigned: string
}

export const terminology: Record<Industry, Terminology> = {
  HVAC:           { jobs: 'Pipeline', job: 'Job',         jobIcon: '🔧', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Technician' },
  Plumbing:       { jobs: 'Pipeline', job: 'Job',         jobIcon: '🔧', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Technician' },
  Electrical:     { jobs: 'Pipeline', job: 'Job',         jobIcon: '🔌', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Electrician' },
  Roofing:        { jobs: 'Pipeline', job: 'Job',         jobIcon: '🏠', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Crew' },
  Landscaping:    { jobs: 'Pipeline', job: 'Job',         jobIcon: '🌿', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Crew' },
  Cleaning:       { jobs: 'Pipeline', job: 'Job',         jobIcon: '🧹', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Cleaner' },
  Painting:       { jobs: 'Pipeline', job: 'Job',         jobIcon: '🎨', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Painter' },
  'Pest Control': { jobs: 'Pipeline', job: 'Job',         jobIcon: '🐛', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Technician' },
  Legal:          { jobs: 'Pipeline', job: 'Case',        jobIcon: '⚖️', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Attorney' },
  Accounting:     { jobs: 'Pipeline', job: 'Engagement',  jobIcon: '📊', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Accountant' },
  Consulting:     { jobs: 'Pipeline', job: 'Project',     jobIcon: '💡', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Consultant' },
  Financial:      { jobs: 'Pipeline', job: 'Engagement',  jobIcon: '💰', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Advisor' },
  Medical:        { jobs: 'Pipeline', job: 'Appointment', jobIcon: '🏥', clients: 'Patients', client: 'Patient', schedule: 'Calendar', assigned: 'Provider' },
  'Real Estate':  { jobs: 'Pipeline', job: 'Listing',     jobIcon: '🏢', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Agent' },
  Insurance:      { jobs: 'Pipeline', job: 'Policy',      jobIcon: '🛡️', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Agent' },
  Marketing:      { jobs: 'Pipeline', job: 'Campaign',    jobIcon: '📣', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Manager' },
  Other:          { jobs: 'Pipeline', job: 'Job',         jobIcon: '🛠️', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Staff' },
}

export function getTerms(industry: Industry | string): Terminology {
  return terminology[industry as Industry] ?? terminology['Other']
}
