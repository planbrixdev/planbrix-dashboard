import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { TaskModalProvider } from "@/providers/task-modal-provider"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar for Desktop */}
      <Sidebar />

      <div className="flex w-full flex-col md:pl-64 h-full overflow-hidden">
        <Header user={user} profile={profile} />
        
        <main className="flex-1 p-4 md:p-8 pt-6 pb-24 md:pb-8 overflow-hidden min-h-0">
          {children}
        </main>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>

      {/* Global Modal Provider */}
      <TaskModalProvider />
    </div>
  )
}
