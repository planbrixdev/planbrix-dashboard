"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Mail, ArrowLeft } from "lucide-react"
import { SubmitButton } from "./SubmitButton"

interface AuthSuccessProps {
  email: string
  next: string
  errorMessage: string | null
  state: any
  cooldown: number
  hasSent: boolean
  formAction: (payload: FormData) => void
  onReset: () => void
}

export function AuthSuccess({ 
  email, 
  next, 
  errorMessage, 
  state, 
  cooldown, 
  hasSent, 
  formAction, 
  onReset 
}: AuthSuccessProps) {
  return (
    <Card className="glass border-muted/50 shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
        <CardDescription>
          We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center py-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Mail className="h-10 w-10 text-primary" />
          </div>
        </div>
        
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          
          {errorMessage && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md text-center">
              {errorMessage}
            </div>
          )}

          {state?.error && (
            <p className="text-sm text-red-500 text-center">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-green-500 text-center">Email sent successfully!</p>
          )}

          <SubmitButton cooldown={cooldown} hasSent={hasSent} />
        </form>

        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={onReset}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Change email
        </Button>
      </CardContent>
    </Card>
  )
}
