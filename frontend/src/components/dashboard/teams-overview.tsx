"use client"

import { cn } from "@/lib/utils"

const teams = [
  {
    name: "Frontend Team",
    members: [
      { initials: "JD", color: "bg-blue-500" },
      { initials: "AK", color: "bg-emerald-500" },
      { initials: "MR", color: "bg-violet-500" },
      { initials: "LS", color: "bg-amber-500" },
    ],
    activeTickets: 8,
    status: "active",
  },
  {
    name: "Backend Team",
    members: [
      { initials: "TP", color: "bg-rose-500" },
      { initials: "NW", color: "bg-cyan-500" },
      { initials: "RH", color: "bg-orange-500" },
    ],
    activeTickets: 5,
    status: "active",
  },
  {
    name: "DevOps Team",
    members: [
      { initials: "KC", color: "bg-indigo-500" },
      { initials: "BM", color: "bg-pink-500" },
    ],
    activeTickets: 3,
    status: "active",
  },
  {
    name: "Platform Team",
    members: [
      { initials: "SG", color: "bg-teal-500" },
      { initials: "EL", color: "bg-yellow-500" },
      { initials: "JK", color: "bg-red-500" },
    ],
    activeTickets: 6,
    status: "busy",
  },
]

export function TeamsOverview() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">Teams Overview</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Active development teams</p>
      </div>
      <div className="divide-y divide-border">
        {teams.map((team) => (
          <div
            key={team.name}
            className="px-4 py-3 hover:bg-accent/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  team.status === "active" ? "bg-emerald-500" : "bg-amber-500"
                )} />
                <span className="text-sm font-medium text-foreground">{team.name}</span>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {team.activeTickets} active
              </span>
            </div>
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {team.members.map((member, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium text-white ring-2 ring-card",
                      member.color
                    )}
                  >
                    {member.initials}
                  </div>
                ))}
              </div>
              <span className="ml-2 text-xs text-muted-foreground">
                {team.members.length} members
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
