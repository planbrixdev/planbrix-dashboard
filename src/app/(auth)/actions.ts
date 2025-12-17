'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function continueWithMagicLink(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const origin = (await headers()).get('origin')

  // Unified flow: 
  // - If user exists: sends login link
  // - If user doesn't exist: creates account and sends confirmation link
  // - If user exists but unconfirmed: sends confirmation link
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true,
    },
  })

  if (error) {
    // Handle Rate Limit (429)
    if (error.status === 429) {
      return { error: "Too many requests. Please wait before trying again.", rateLimit: true }
    }
    return { error: error.message }
  }

  return { success: true, message: 'Check your email for the magic link!' }
}


