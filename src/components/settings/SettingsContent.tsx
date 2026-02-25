"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Circle, ExternalLink, AlertCircle, Calendar } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useSettings } from "@/stores/settings"
import { Switch } from "@/components/ui/switch"

interface Integration {
  key: string
  name: string
  description: string
  color: string
  setupUrl?: string
}

const INTEGRATIONS: Integration[] = [
  {
    key: "notion",
    name: "Notion",
    description: "Connect your Notion workspace to view databases and tasks.",
    color: "bg-black dark:bg-white",
    setupUrl: "https://www.notion.so/profile/integrations",
  },
  {
    key: "google",
    name: "Google Calendar",
    description: "View your Google Calendar events alongside everything else.",
    color: "bg-blue-500",
    setupUrl: "https://console.cloud.google.com",
  },
  {
    key: "apple",
    name: "Apple Calendar",
    description: "Connect via iCloud CalDAV using an app-specific password.",
    color: "bg-red-500",
    setupUrl: "https://appleid.apple.com",
  },
  {
    key: "obsidian",
    name: "Obsidian",
    description: "Read your vault notes. Requires the Local REST API plugin.",
    color: "bg-purple-600",
    setupUrl: "obsidian://",
  },
]

export function SettingsContent() {
  const [statuses, setStatuses] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Notion
  const [notionKey, setNotionKey] = useState("")

  // Google — redirect-based
  const [googleReady] = useState(
    !!(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
  )

  // Apple
  const [appleUser, setAppleUser] = useState("")
  const [applePass, setApplePass] = useState("")

  // Obsidian
  const [obsidianKey, setObsidianKey] = useState("")
  const [obsidianUrl, setObsidianUrl] = useState("http://localhost:27123")
  const { selectedAppleCalendars, setSelectedAppleCalendars } = useSettings()

  const { data: appleCalendarsData } = useQuery({
    queryKey: ["apple", "calendars"],
    queryFn: () => fetch("/api/calendar/apple/list").then((r) => r.json()),
    enabled: statuses.apple === "saved",
  })

  async function saveNotion() {
    setStatuses((s) => ({ ...s, notion: "saving" }))
    setErrors((e) => ({ ...e, notion: "" }))
    try {
      const res = await fetch("/api/auth/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: notionKey }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Failed to save")
      }
      setStatuses((s) => ({ ...s, notion: "saved" }))
      setNotionKey("")
    } catch (err) {
      setStatuses((s) => ({ ...s, notion: "error" }))
      setErrors((e) => ({ ...e, notion: String(err) }))
    }
  }

  async function saveApple() {
    setStatuses((s) => ({ ...s, apple: "saving" }))
    setErrors((e) => ({ ...e, apple: "" }))
    try {
      console.log("Saving Apple credentials for:", appleUser.trim())
      const res = await fetch("/api/auth/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: appleUser.trim(), 
          password: applePass.trim() 
        }),
      })
      console.log("Apple auth response status:", res.status)
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        console.error("Apple auth error data:", data)
        throw new Error(data.error ?? "Failed to save")
      }
      setStatuses((s) => ({ ...s, apple: "saved" }))
      setAppleUser("")
      setApplePass("")
    } catch (err) {
      console.error("Caught error in saveApple:", err)
      setStatuses((s) => ({ ...s, apple: "error" }))
      setErrors((e) => ({ ...e, apple: String(err) }))
    }
  }

  async function saveObsidian() {
    setStatuses((s) => ({ ...s, obsidian: "saving" }))
    setErrors((e) => ({ ...e, obsidian: "" }))
    try {
      const res = await fetch("/api/auth/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          apiKey: obsidianKey.trim(), 
          apiUrl: obsidianUrl.trim() 
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Failed to save")
      }
      setStatuses((s) => ({ ...s, obsidian: "saved" }))
      setObsidianKey("")
    } catch (err) {
      setStatuses((s) => ({ ...s, obsidian: "error" }))
      setErrors((e) => ({ ...e, obsidian: String(err) }))
    }
  }

  async function disconnect(key: string) {
    setStatuses((s) => ({ ...s, [key]: "saving" }))
    try {
      const endpoint = key === "google" ? "/api/auth/google" : `/api/auth/${key}`
      await fetch(endpoint, { method: "DELETE" })
      setStatuses((s) => ({ ...s, [key]: "idle" }))
    } catch {
      setStatuses((s) => ({ ...s, [key]: "error" }))
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground mt-1">
          Connect your tools. Credentials are stored encrypted in a local SQLite database.
        </p>
      </div>

      <Separator />

      {/* Notion */}
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <div className="h-10 w-10 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-lg flex-shrink-0">
            N
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Notion
              {statuses.notion === "saved" && (
                <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Connect your Notion workspace to view databases and tasks.</CardDescription>
          </div>
          <a
            href="https://www.notion.so/profile/integrations"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="notion-key">Integration API Key</Label>
            <div className="flex gap-2">
              <Input
                id="notion-key"
                type="password"
                placeholder="secret_..."
                value={notionKey}
                onChange={(e) => setNotionKey(e.target.value)}
              />
              <Button
                onClick={saveNotion}
                disabled={!notionKey || statuses.notion === "saving"}
              >
                {statuses.notion === "saving" ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
          {errors.notion && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.notion}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Create an integration at notion.so → Settings → Integrations. Then share your databases with it.
          </p>
        </CardContent>
      </Card>

      {/* Google Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
              <path d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3H4.5A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM9 16.5H6v-3h3v3zm0-4.5H6v-3h3v3zm4.5 4.5h-3v-3h3v3zm0-4.5h-3v-3h3v3zm4.5 4.5h-3v-3h3v3zm0-4.5h-3v-3h3v3z" />
            </svg>
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Google Calendar
              {statuses.google === "saved" && (
                <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>View your Google Calendar events alongside everything else.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => { window.location.href = "/api/auth/google" }}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Connect with Google
          </Button>
          <p className="text-xs text-muted-foreground">
            You&apos;ll be redirected to Google to authorize read-only calendar access. Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env.local first.
          </p>
          {statuses.google === "saved" && (
            <Button variant="outline" size="sm" onClick={() => disconnect("google")}>
              Disconnect
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Apple Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <div className="h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Apple Calendar
              {statuses.apple === "saved" && (
                <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Connect via iCloud CalDAV using an app-specific password.</CardDescription>
          </div>
          <a
            href="https://appleid.apple.com"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="apple-user">iCloud Email</Label>
            <Input
              id="apple-user"
              type="email"
              placeholder="you@icloud.com"
              value={appleUser}
              onChange={(e) => setAppleUser(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="apple-pass">App-Specific Password</Label>
            <Input
              id="apple-pass"
              type="password"
              placeholder="xxxx-xxxx-xxxx-xxxx"
              value={applePass}
              onChange={(e) => setApplePass(e.target.value)}
            />
          </div>
          <Button
            onClick={saveApple}
            disabled={!appleUser || !applePass || statuses.apple === "saving"}
          >
            {statuses.apple === "saving" ? "Saving…" : "Save"}
          </Button>

          {appleCalendarsData?.calendars && appleCalendarsData.calendars.length > 0 && (
            <div className="pt-4 space-y-3">
              <Separator />
              <div className="space-y-2">
                <Label>Select Calendars to Show</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {appleCalendarsData.calendars.map((cal: any) => (
                    <div key={cal.id} className="flex items-center justify-between p-2 rounded-lg border border-border bg-accent/50">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cal.color }}
                        />
                        <span className="text-sm font-medium">{cal.name}</span>
                      </div>
                      <Switch
                        checked={selectedAppleCalendars.includes(cal.name)}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            setSelectedAppleCalendars([...selectedAppleCalendars, cal.name])
                          } else {
                            setSelectedAppleCalendars(selectedAppleCalendars.filter((n) => n !== cal.name))
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {errors.apple && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.apple}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Generate an app-specific password at appleid.apple.com → Sign-In and Security → App-Specific Passwords.
            Your iCloud password is never stored.
          </p>
        </CardContent>
      </Card>

      {/* Obsidian */}
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <div className="h-10 w-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
            O
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Obsidian
              {statuses.obsidian === "saved" && (
                <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Read your vault notes via the Local REST API plugin.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="obs-url">API URL</Label>
            <Input
              id="obs-url"
              value={obsidianUrl}
              onChange={(e) => setObsidianUrl(e.target.value)}
              placeholder="http://localhost:27123"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="obs-key">API Key (optional)</Label>
            <Input
              id="obs-key"
              type="password"
              value={obsidianKey}
              onChange={(e) => setObsidianKey(e.target.value)}
              placeholder="From plugin settings"
            />
          </div>
          <Button
            onClick={saveObsidian}
            disabled={statuses.obsidian === "saving"}
          >
            {statuses.obsidian === "saving" ? "Saving…" : "Save"}
          </Button>
          {errors.obsidian && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.obsidian}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            In Obsidian: Settings → Community Plugins → &quot;Local REST API&quot; (by coddingtonbear) → Install &amp; Enable.
            Keep Obsidian running while using Mist.
          </p>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h2 className="text-lg font-semibold">About</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Mist v0.1.0 — All data stays local. Credentials are AES-256 encrypted in{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">prisma/dev.db</code>.
        </p>
      </div>
    </div>
  )
}
