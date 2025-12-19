"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SubmitButton } from "./SubmitButton"
import { GoogleButton } from "./GoogleButton"

interface AuthFormProps {
  email: string
  setEmail: (email: string) => void
  next: string
  errorMessage: string | null
  state: any
  cooldown: number
  hasSent: boolean
  formAction: (payload: FormData) => void
}

export function AuthForm({
  email,
  setEmail,
  next,
  errorMessage,
  state,
  cooldown,
  hasSent,
  formAction
}: AuthFormProps) {
  return (
    <Card className="glass border-muted/50 shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
        <CardDescription>
          Enter your email to sign in or create an account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              placeholder="m@example.com" 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          {errorMessage && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md text-center">
              {errorMessage}
            </div>
          )}

          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <SubmitButton cooldown={cooldown} hasSent={hasSent} />
        </form>

        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground uppercase">Or continue with</span>
          <Separator className="flex-1" />
        </div>

        <GoogleButton next={next} />
      </CardContent>
    </Card>
  )
}
