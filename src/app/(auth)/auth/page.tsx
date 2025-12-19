"use client"

import { useActionState, useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { continueWithMagicLink } from "@/actions/auth"
import { useAuthCooldown } from "@/hooks/use-auth-cooldown"
import { AuthForm } from "@/components/auth/AuthForm"
import { AuthSuccess } from "@/components/auth/AuthSuccess"

function AuthContent() {
  const [state, formAction] = useActionState(continueWithMagicLink, null)
  const [email, setEmail] = useState("")
  const { cooldown, startCooldown } = useAuthCooldown()
  const [hasSent, setHasSent] = useState(false)
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/dashboard"
  const errorParam = searchParams.get("error")
  const [hashError, setHashError] = useState<string | null>(null)

  useEffect(() => {
    // Check hash for errors (Supabase sometimes returns errors in hash)
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1))
      const errorDescription = params.get("error_description")
      if (errorDescription) {
        setHashError(errorDescription.replace(/\+/g, " "))
      }
    }
  }, [])

  useEffect(() => {
    if (state?.success || state?.rateLimit) {
      startCooldown(60)
      if (state?.success) {
         setHasSent(true)
      }
    }
  }, [state, startCooldown])

  const errorMessage = hashError || errorParam

  if (hasSent) {
    return (
      <AuthSuccess 
        email={email}
        next={next}
        errorMessage={errorMessage}
        state={state}
        cooldown={cooldown}
        hasSent={hasSent}
        formAction={formAction}
        onReset={() => setHasSent(false)}
      />
    )
  }

  return (
    <AuthForm 
      email={email}
      setEmail={setEmail}
      next={next}
      errorMessage={errorMessage}
      state={state}
      cooldown={cooldown}
      hasSent={hasSent}
      formAction={formAction}
    />
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContent />
    </Suspense>
  )
}
