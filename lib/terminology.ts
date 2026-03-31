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
  HVAC:           { jobs: 'Jobs',         job: 'Job',         jobIcon: '🔧', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Technician' },
  Plumbing:       { jobs: 'Jobs',         job: 'Job',         jobIcon: '🔧', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Technician' },
  Electrical:     { jobs: 'Jobs',         job: 'Job',         jobIcon: '⚡', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Electrician' },
  Roofing:        { jobs: 'Jobs',         job: 'Job',         jobIcon: '🏠', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Crew' },
  Landscaping:    { jobs: 'Jobs',         job: 'Job',         jobIcon: '🌿', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Crew' },
  Cleaning:       { jobs: 'Jobs',         job: 'Job',         jobIcon: '🧹', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Cleaner' },
  Painting:       { jobs: 'Jobs',         job: 'Job',         jobIcon: '🎨', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Painter' },
  'Pest Control': { jobs: 'Jobs',         job: 'Job',         jobIcon: '🐛', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Technician' },
  Legal:          { jobs: 'Cases',        job: 'Case',        jobIcon: '⚖️', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Attorney' },
  Accounting:     { jobs: 'Engagements',  job: 'Engagement',  jobIcon: '📊', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Accountant' },
  Consulting:     { jobs: 'Projects',     job: 'Project',     jobIcon: '💡', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Consultant' },
  Financial:      { jobs: 'Engagements',  job: 'Engagement',  jobIcon: '💰', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Advisor' },
  Medical:        { jobs: 'Appointments', job: 'Appointment', jobIcon: '🏥', clients: 'Patients', client: 'Patient', schedule: 'Calendar', assigned: 'Provider' },
  'Real Estate':  { jobs: 'Listings',     job: 'Listing',     jobIcon: '🏢', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Agent' },
  Insurance:      { jobs: 'Policies',     job: 'Policy',      jobIcon: '🛡️', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Agent' },
  Marketing:      { jobs: 'Campaigns',    job: 'Campaign',    jobIcon: '📣', clients: 'Clients',  client: 'Client',  schedule: 'Calendar', assigned: 'Manager' },
  Other:          { jobs: 'Jobs',         job: 'Job',         jobIcon: '🛠️', clients: 'Clients',  client: 'Client',  schedule: 'Schedule', assigned: 'Staff' },
}

export function getTerms(industry: Industry | string): Terminology {
  return terminology[industry as Industry] ?? terminology['Other']
}
