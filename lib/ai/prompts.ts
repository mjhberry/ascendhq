export function buildSystemPrompt(org: { name: string; industry: string; category: string }) {
  const jobLabel =
    org.industry === 'Legal' ? 'case' :
    org.industry === 'Accounting' ? 'engagement' :
    org.industry === 'Consulting' ? 'project' :
    'job'

  return `You are an expert AI business assistant embedded in AscendHQ, an all-in-one business management platform.

Business context:
- Company: ${org.name}
- Industry: ${org.industry}
- Type: ${org.category === 'home' ? 'Home service business' : 'Professional service firm'}

Your role is to help this business with:
- Client and ${jobLabel} management
- Scheduling and dispatch
- Billing and invoicing
- Marketing and lead generation
- Document management
- Business automation

Be concise, practical, and action-oriented.
Always tailor your responses to the ${org.industry} industry.
Keep responses under 200 words unless the user asks for something longer.`
}

export const automationPrompts = {
  newLeadReply: (lead: { name: string; service: string; orgName: string }) =>
    `Write a warm, professional email reply to a new lead named ${lead.name} who is interested in ${lead.service} from ${lead.orgName}. Keep it under 150 words, friendly, and include a call to action to schedule a call.`,

  overdueInvoiceReminder: (invoice: { clientName: string; amount: number; daysOverdue: number }) =>
    `Write a polite but firm payment reminder email for ${invoice.clientName}. Invoice amount: $${invoice.amount}. Days overdue: ${invoice.daysOverdue}. Keep it professional and include a clear call to action.`,

  reviewRequest: (job: { clientName: string; service: string; orgName: string }) =>
    `Write a friendly review request email to ${job.clientName} after completing ${job.service} work. From ${job.orgName}. Ask for a Google review. Under 100 words.`,

  morningBriefing: (data: {
    orgName: string
    openJobs: number
    overdueInvoices: number
    newLeads: number
    todayAppointments: number
  }) =>
    `Create a concise morning briefing for ${data.orgName}. Today's stats: ${data.openJobs} open jobs, ${data.overdueInvoices} overdue invoices, ${data.newLeads} new leads, ${data.todayAppointments} appointments today. Write 3-4 sentences: what needs attention today, what's looking good, one action to prioritize.`,
}
