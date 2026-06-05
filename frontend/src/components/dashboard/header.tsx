"use client"

import { Search, Bell, Command } from "lucide-react"

export function Header() {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
            <span className="text-background text-xs font-bold">D</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">Dispatch</span>
        </div>
        
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-muted-foreground text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>All systems operational</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 text-muted-foreground text-sm hover:bg-muted transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          <kbd className="ml-4 flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>
        
        <button className="relative p-2 rounded-md hover:bg-muted transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        </button>
        
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-1 ring-border"></div>
      </div>
    </header>
  )
}
