"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  return (
    <Card className="glass border-muted/50 shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Forgot password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="m@example.com" type="email" />
        </div>
        <Button className="w-full bg-primary hover:bg-primary/90 text-white">
          Send Reset Link
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
         <Link 
            href="/auth" 
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
         >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
         </Link>
      </CardFooter>
    </Card>
  )
}
