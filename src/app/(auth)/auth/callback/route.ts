import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  // Check for errors returned by Supabase (e.g. expired link)
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  
  if (error) {
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    if (!sessionError) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    // If exchange fails
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(sessionError.message)}`)
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`)
}
