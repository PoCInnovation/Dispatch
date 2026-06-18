import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MetricsCards } from "@/components/dashboard/metrics-cards"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { TeamsOverview } from "@/components/dashboard/teams-overview"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="mb-8">
              <h1 className="text-xl font-semibold text-foreground tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor your dispatch workflow and team performance
              </p>
            </div>

            <MetricsCards />

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <ActivityFeed />
              </div>

              <div className="space-y-6">
                <TeamsOverview />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
