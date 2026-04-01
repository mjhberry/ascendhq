export async function GET() {
  return Response.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'undefined',
    supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'defined' : 'undefined',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'defined' : 'undefined',
  })
}
