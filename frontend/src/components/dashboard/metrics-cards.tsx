"use client"

import { Ticket, Send, AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

const metrics = [
  {
    label: "Open Tickets",
    value: "24",
    change: "+3",
    trend: "up",
    icon: Ticket,
    description: "Pending dispatch",
  },
  {
    label: "Dispatched",
    value: "156",
    change: "+12",
    trend: "up",
    icon: Send,
    description: "Today",
  },
  {
    label: "Failed",
    value: "3",
    change: "-2",
    trend: "down",
    icon: AlertCircle,
    description: "Needs attention",
    alert: true,
  },
  {
    label: "Resolved",
    value: "89",
    change: "+18%",
    trend: "up",
    icon: CheckCircle2,
    description: "Past 7 days",
  },
]

export function MetricsCards() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={cn(
            "rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30",
            metric.alert && "border-amber-500/30"
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn(
              "p-2 rounded-md",
              metric.alert ? "bg-amber-500/10" : "bg-muted"
            )}>
              <metric.icon className={cn(
                "w-4 h-4",
                metric.alert ? "text-amber-500" : "text-muted-foreground"
              )} />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-xs",
              metric.trend === "up" 
                ? metric.alert ? "text-amber-500" : "text-emerald-500"
                : "text-emerald-500"
            )}>
              {metric.trend === "up" && !metric.alert ? (
                <TrendingUp className="w-3 h-3" />
              ) : metric.trend === "down" || metric.alert ? (
                <TrendingDown className="w-3 h-3" />
              ) : null}
              <span>{metric.change}</span>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">{metric.value}</h3>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="text-[10px] text-muted-foreground/60">{metric.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
