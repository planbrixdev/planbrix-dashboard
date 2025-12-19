"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

interface SubmitButtonProps {
  cooldown: number
  hasSent: boolean
}

export function SubmitButton({ cooldown, hasSent }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  const isDisabled = pending || cooldown > 0

  return (
    <Button className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isDisabled}>
      {pending 
        ? "Sending link..." 
        : cooldown > 0 
          ? `Resend email in ${cooldown}s` 
          : hasSent 
            ? "Resend Email"
            : "Continue with Email"
      }
    </Button>
  )
}
