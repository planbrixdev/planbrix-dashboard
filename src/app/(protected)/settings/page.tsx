"use client"

import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "@/components/settings/ProfileSettings"
import { AppearanceSettings } from "@/components/settings/AppearanceSettings"
import { NotificationSettings } from "@/components/settings/NotificationSettings"

export default function SettingsPage() {
  return (
    <div className="space-y-6 pb-16 block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
           {/* Sidebar or simple description for now */}
           <p className="px-4 text-sm text-muted-foreground hidden lg:block">
             Customize how the workspace looks and works for you.
           </p>
        </aside>
        <div className="flex-1 lg:max-w-2xl">
           <Tabs defaultValue="profile" className="space-y-4">
               <TabsList className="w-full justify-start bg-transparent p-0 border-b rounded-none h-auto">
                   <TabsTrigger value="profile" className="relative h-9 rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
                     Profile
                   </TabsTrigger>
                   <TabsTrigger value="appearance" className="relative h-9 rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
                     Appearance
                   </TabsTrigger>
                   <TabsTrigger value="notifications" className="relative h-9 rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
                     Notifications
                   </TabsTrigger>
               </TabsList>
               <TabsContent value="profile" className="pt-4 animate-in fade-in-50">
                   <ProfileSettings />
               </TabsContent>
               <TabsContent value="appearance" className="pt-4 animate-in fade-in-50">
                   <AppearanceSettings />
               </TabsContent>
               <TabsContent value="notifications" className="pt-4 animate-in fade-in-50">
                   <NotificationSettings />
               </TabsContent>
           </Tabs>
        </div>
      </div>
    </div>
  )
}
