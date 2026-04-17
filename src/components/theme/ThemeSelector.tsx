"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const followingSystem = theme === "system"

  function toggleSystemTheme(follow: boolean) {
    if (follow) {
      setTheme("system")
    } else {
      // Default to current resolved theme when disabling system follow
      setTheme(resolvedTheme ?? "dark")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          Appearance
        </CardTitle>
        <CardDescription>Control how Mist looks on your screen.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System theme toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="system-theme">Follow system theme</Label>
            <p className="text-xs text-muted-foreground">
              Automatically switch between light and dark based on your OS setting.
            </p>
          </div>
          <Switch
            id="system-theme"
            checked={followingSystem}
            onCheckedChange={toggleSystemTheme}
          />
        </div>

        {/* Manual light/dark picker — only shown when not following system */}
        {!followingSystem && (
          <div className="flex gap-2 pt-1">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4" />
              Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4" />
              Dark
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
