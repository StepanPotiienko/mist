"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/shared/TopBar";
import { SourceFilter } from "@/components/calendar/SourceFilter";
import { UnifiedCalendar } from "@/components/calendar/UnifiedCalendar";
import { AlertCircle } from "lucide-react";
import type { UnifiedEvent, CalendarSource } from "@/types/calendar";

const DEFAULT_ENABLED: Record<CalendarSource, boolean> = {
  apple: true,
  google: true,
  notion: true,
  obsidian: true,
};

export default function CalendarPage() {
  const [enabled, setEnabled] = useState(DEFAULT_ENABLED);

  function toggleSource(source: CalendarSource) {
    setEnabled((prev) => ({ ...prev, [source]: !prev[source] }));
  }

  const { params } = useMemo(() => {
    const from = new Date();
    from.setMonth(from.getMonth() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setMonth(to.getMonth() + 2);
    to.setHours(0, 0, 0, 0);
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    return { from, to, params };
  }, []);

  const { data: appleEvents = [] } = useQuery({
    queryKey: ["calendar", "apple", params.get("from"), params.get("to")],
    queryFn: () =>
      fetch(`/api/calendar/apple?${params}`)
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || `HTTP error ${r.status}`);
          return d as { events: UnifiedEvent[] };
        })
        .then((d) =>
          (d.events ?? []).map((e) => ({
            ...e,
            start: new Date(e.start as Date),
            end: e.end ? new Date(e.end as Date) : undefined,
          })),
        ),
    enabled: enabled.apple,
    staleTime: 5 * 60 * 1000,
  });

  const { data: googleEvents = [] } = useQuery({
    queryKey: ["calendar", "google", params.get("from"), params.get("to")],
    queryFn: () =>
      fetch(`/api/calendar/google?${params}`)
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || `HTTP error ${r.status}`);
          return d as { events: UnifiedEvent[] };
        })
        .then((d) =>
          (d.events ?? []).map((e) => ({
            ...e,
            start: new Date(e.start as Date),
            end: e.end ? new Date(e.end as Date) : undefined,
          })),
        ),
    enabled: enabled.google,
    staleTime: 5 * 60 * 1000,
  });

  const { data: notionEvents = [], error: notionError } = useQuery({
    queryKey: ["calendar", "notion", params.get("from"), params.get("to")],
    queryFn: () =>
      fetch(`/api/calendar/notion?${params}`)
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || `HTTP error ${r.status}`);
          return d as { events: UnifiedEvent[] };
        })
        .then((d) =>
          (d.events ?? []).map((e) => ({
            ...e,
            start: new Date(e.start as Date),
            end: e.end ? new Date(e.end as Date) : undefined,
          })),
        ),
    enabled: enabled.notion,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: obsidianNotes = [], error: obsidianError } = useQuery({
    queryKey: ["obsidian", "notes", params.get("from"), params.get("to")],
    queryFn: () =>
      fetch(
        `/api/obsidian/notes?from=${params.get("from")}&to=${params.get("to")}`,
      )
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || `HTTP error ${r.status}`);
          return d as {
            notes: Array<{ path: string; title: string; date?: string }>;
          };
        })
        .then((d) =>
          (d.notes ?? []).map(
            (n): UnifiedEvent => ({
              id: `obsidian-${n.path}`,
              source: "obsidian",
              title: n.title,
              start: new Date(n.date ?? 0),
              allDay: true,
              color: "#7C3AED",
            }),
          ),
        ),
    enabled: enabled.obsidian,
    retry: false,
  });

  const allEvents: UnifiedEvent[] = [
    ...(enabled.apple ? appleEvents : []),
    ...(enabled.google ? googleEvents : []),
    ...(enabled.notion ? notionEvents : []),
    ...(enabled.obsidian ? obsidianNotes : []),
  ];

  const errors: string[] = [
    ...(notionError && enabled.notion
      ? [`Notion: ${(notionError as Error).message}`]
      : []),
    ...(obsidianError && enabled.obsidian
      ? [`Obsidian: ${(obsidianError as Error).message}`]
      : []),
  ];

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Calendar">
        <SourceFilter enabled={enabled} onToggle={toggleSource} />
      </TopBar>
      {errors.length > 0 && (
        <div className="mx-6 mt-4 space-y-1">
          {errors.map((e) => (
            <div
              key={e}
              className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {e}
            </div>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-hidden p-6">
        <UnifiedCalendar events={allEvents} />
      </div>
    </div>
  );
}
