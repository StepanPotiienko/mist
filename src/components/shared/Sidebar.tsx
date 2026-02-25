"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  LayoutDashboard, 
  CalendarDays, 
  LayoutGrid, 
  Settings, 
  Cloud, 
  FileText 
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/workspace", label: "Workspace", icon: LayoutGrid },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  
  // Debug log to browser console
  if (typeof window !== "undefined") {
    console.log("Sidebar v5 rendering. Items:", navItems.map(n => n.label))
  }

  return (
    <aside className="relative flex h-full w-14 flex-col items-center border-r border-border bg-card py-4 gap-1 z-50">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm hover:brightness-110 transition-all"
      >
        <Cloud className="h-5 w-5" />
      </Link>

      <nav className="flex flex-col items-center gap-2 flex-1 w-full">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-110"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">{label}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    </aside>
  )
}
