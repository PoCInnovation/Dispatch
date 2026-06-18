"use client"

import { GitBranch, MessageSquare, GitPullRequest, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const activities = [
  {
    id: "DIS-108",
    action: "successfully routed to",
    target: "Frontend Team",
    integration: "GitHub",
    time: "2m ago",
    status: "success",
    icon: GitBranch,
  },
  {
    id: "DIS-107",
    action: "escalated to",
    target: "Backend Team",
    integration: "Linear",
    time: "4m ago",
    status: "success",
    icon: GitPullRequest,
  },
  {
    id: "DIS-106",
    action: "notification sent via",
    target: "#engineering",
    integration: "Slack",
    time: "8m ago",
    status: "success",
    icon: MessageSquare,
  },
  {
    id: "DIS-105",
    action: "failed to route",
    target: "Infrastructure Team",
    integration: "GitLab",
    time: "12m ago",
    status: "failed",
    icon: AlertCircle,
  },
  {
    id: "DIS-104",
    action: "successfully routed to",
    target: "DevOps Team",
    integration: "GitHub",
    time: "15m ago",
    status: "success",
    icon: GitBranch,
  },
  {
    id: "DIS-103",
    action: "resolved by",
    target: "Platform Team",
    integration: "Linear",
    time: "23m ago",
    status: "resolved",
    icon: CheckCircle2,
  },
  {
    id: "DIS-102",
    action: "pending review in",
    target: "Design Team",
    integration: "Linear",
    time: "34m ago",
    status: "pending",
    icon: Clock,
  },
]

const integrationColors: Record<string, string> = {
  GitHub: "bg-zinc-700 text-zinc-200",
  Linear: "bg-indigo-500/20 text-indigo-400",
  Slack: "bg-green-500/20 text-green-400",
  GitLab: "bg-orange-500/20 text-orange-400",
}

const statusColors: Record<string, string> = {
  success: "text-emerald-500",
  failed: "text-red-400",
  resolved: "text-blue-400",
  pending: "text-amber-500",
}

export function ActivityFeed() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">Recent Activity</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Real-time dispatch events</p>
      </div>
      <div className="divide-y divide-border">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="px-4 py-3 hover:bg-accent/30 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-1.5 rounded-md bg-muted mt-0.5",
                activity.status === "failed" && "bg-red-500/10"
              )}>
                <activity.icon className={cn(
                  "w-3.5 h-3.5",
                  statusColors[activity.status] || "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="font-medium text-blue-400 hover:underline cursor-pointer">
                    Ticket #{activity.id}
                  </span>
                  {" "}{activity.action}{" "}
                  <span className="font-medium text-foreground">{activity.target}</span>
                  {" "}via{" "}
                  <span className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                    integrationColors[activity.integration]
                  )}>
                    {activity.integration}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-border">
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          View all activity →
        </button>
      </div>
    </div>
  )
}
