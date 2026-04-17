import { google } from "googleapis";
import { getCredential } from "./credentials";
import type { UnifiedEvent } from "@/types/calendar";

function buildOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export function getGoogleAuthUrl(): string {
  const oauth2 = buildOAuthClient();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.readonly"],
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<Record<string, string>> {
  const oauth2 = buildOAuthClient();
  const { tokens } = await oauth2.getToken(code);

  let refreshToken = tokens.refresh_token ?? "";
  if (!refreshToken) {
    const existing = await getCredential("google");
    if (existing?.refreshToken) {
      refreshToken = existing.refreshToken;
    }
  }

  return {
    accessToken: tokens.access_token ?? "",
    refreshToken: refreshToken,
    expiryDate: String(tokens.expiry_date ?? ""),
  };
}

export async function getGoogleCalendarEvents(
  from: Date,
  to: Date,
): Promise<UnifiedEvent[]> {
  console.log("Fetching google calendar events. from:", from, "to:", to);
  const cred = await getCredential("google");
  console.log(
    "Loaded google credential:",
    cred ? "EXISTS" : "NULL",
    cred ? `refreshToken: ${!!cred.refreshToken}` : "",
  );
  if (!cred?.refreshToken) return [];

  const oauth2 = buildOAuthClient();
  oauth2.setCredentials({
    refresh_token: cred.refreshToken,
    access_token: cred.accessToken,
    expiry_date: cred.expiryDate ? Number(cred.expiryDate) : undefined,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    return (response.data.items ?? []).map((event) => {
      const startStr = event.start?.dateTime ?? event.start?.date ?? "";
      const endStr = event.end?.dateTime ?? event.end?.date ?? "";
      const allDay = !event.start?.dateTime;

      return {
        id: `google-${event.id}`,
        source: "google" as const,
        title: event.summary ?? "No Title",
        start: new Date(startStr),
        end: endStr ? new Date(endStr) : undefined,
        allDay,
        color: "#1A73E8",
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        sourceUrl: event.htmlLink ?? undefined,
      };
    });
  } catch (err: unknown) {
    console.error("Error fetching Google Calendar events:", err);
    throw err;
  }
}
