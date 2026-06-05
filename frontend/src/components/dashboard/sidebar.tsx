"use client"

import { 
  Home, 
  Inbox, 
  CircleDot, 
  Layers, 
  Settings,
  ChevronDown,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: Inbox, label: "Inbox", badge: 12 },
  { icon: CircleDot, label: "Active Tickets", badge: 8 },
  { icon: Layers, label: "All Issues" },
  { icon: Zap, label: "Automations" },
]

export function Sidebar() {
  return (
    <aside className="w-52 border-r border-border bg-sidebar flex flex-col h-[calc(100vh-56px)]">
      <div className="p-3">
        <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sidebar-foreground">Workspace</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      
      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
              item.active 
                ? "bg-sidebar-accent text-sidebar-foreground" 
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      
      <div className="p-2 border-t border-border">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  )
}
