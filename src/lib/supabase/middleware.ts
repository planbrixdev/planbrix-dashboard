import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // 1. Protected Routes: Must be logged in
  // If user is NOT logged in AND trying to access a protected route (not /auth*)
  if (!user && !path.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    // Preserve the original URL as a 'next' param so we can redirect back after login
    url.searchParams.set('next', path)
    
    const response = NextResponse.redirect(url)
    
    // Copy cookies to ensure we don't lose any session clearing/updates
    const cookiesToSet = supabaseResponse.cookies.getAll()
    cookiesToSet.forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value, cookie)
    })
    
    return response
  }

  // 2. Auth Routes: Must NOT be logged in
  // If user IS logged in AND trying to access auth pages (/auth*)
  if (user && path.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    
    const response = NextResponse.redirect(url)
    
    // IMPORTANT: Copy cookies from supabaseResponse to the redirect response
    // This ensures that if the token was refreshed during getUser(), 
    // the new token is passed to the browser along with the redirect.
    const cookiesToSet = supabaseResponse.cookies.getAll()
    cookiesToSet.forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value, cookie)
    })
    
    return response
  }

  return supabaseResponse
}
