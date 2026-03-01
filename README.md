# 🌫️ Mist

> One tab. All your tools.

Mist is a personal productivity dashboard that pulls together **Obsidian notes**, **Notion databases**, **Apple Calendar**, and **Google Calendar** into a single browser interface. No more switching between four apps to plan your week — everything is visible at a glance and updates in the background.

Built as a local Next.js app, Mist runs on your machine and communicates directly with your tools' APIs. Your data never leaves your computer.

---

## ✨ Features

- **Unified Calendar** — Day, Week, and Month views showing events from Apple Calendar, Google Calendar, Notion tasks with dates, and Obsidian notes with a `date:` frontmatter field. Color-coded by source, with per-source toggle filters.
- **Dashboard** — A GitHub-style activity heatmap spanning 6 months, a scrollable week strip, and stats cards (events this week, notes, Notion tasks).
- **Customizable Workspace** — A drag-and-resizable widget grid. Add Notion database tables, Obsidian note lists, or a calendar mini-view as widgets. Layouts persist between sessions.
- **Settings** — Connection cards for each integration. Credentials are stored locally in SQLite, AES-256 encrypted.
- **Dark & Light themes** — Toggled from the top bar on any page.

---

## 🏗️ How It Works

```
┌─────────────────────────────────────────────────────────┐
│                      Your Browser                       │
│  ┌───────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ Dashboard │  │  Calendar   │  │    Workspace     │  │
│  └─────┬─────┘  └──────┬──────┘  └────────┬─────────┘  │
└────────┼───────────────┼──────────────────┼────────────┘
         └───────────────┼──────────────────┘
                         │  Next.js API Routes
         ┌───────────────┼──────────────────┐
         │               │                  │
   ┌─────▼──────┐  ┌─────▼──────┐  ┌───────▼──────┐  ┌──────────────┐
   │   Notion   │  │  Google    │  │    Apple     │  │   Obsidian   │
   │ @notionhq/ │  │ Calendar   │  │  CalDAV      │  │ Local REST   │
   │   client   │  │ googleapis │  │  (tsdav)     │  │ API plugin   │
   └────────────┘  └────────────┘  └──────────────┘  └──────────────┘
                         │
                  ┌──────▼──────┐
                  │   SQLite    │
                  │  (Prisma)   │
                  │ credentials │
                  │   + links   │
                  └─────────────┘
```

Each integration has a dedicated Next.js API route under `src/app/api/`. The `unified-events.ts` library fetches all four sources in parallel and normalises them into a single `UnifiedEvent[]` array that the calendar and dashboard consume.

Credentials (Notion API key, Google OAuth tokens, Apple app-specific password, Obsidian API key) are stored locally in SQLite via Prisma. Before being written to disk they are encrypted with AES-256-GCM using an `ENCRYPTION_KEY` you set in `.env.local`.

---

## 🧰 Tech Stack

| Concern | Library |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui | | Client state | Zustand (with localStorage persistence) | | Data fetching | TanStack Query (React Query) |
| Local database | Prisma v7 + SQLite (via `better-sqlite3`) |
| Notion | `@notionhq/client` v5 |
| Apple Calendar | `tsdav` (CalDAV / iCloud) |
| Google Calendar | `@googleapis/calendar` (OAuth2) |
| Obsidian | Local REST API community plugin |
| Graphs | Recharts |
| Widget layout | `react-grid-layout` v2 |
| Themes | `next-themes` |

---

## 📋 Prerequisites

- **Node.js 22+** (check with `node --version`)
- **Docker + Docker Compose** — for the 24/7 container setup
- The accounts/apps you want to connect (you can add them incrementally — the app works fine with zero integrations connected)

### Per-integration prerequisites

| Integration | What you need before starting |
|---|---|
| **Notion** | A Notion account. Create an integration at [notion.so/profile/integrations](https://www.notion.so/profile/integrations). |
| **Google Calendar** | A Google Cloud project with the Calendar API enabled and an OAuth 2.0 Client ID. |
| **Apple Calendar** | An iCloud account. Generate an app-specific password at [appleid.apple.com](https://appleid.apple.com). |
| **Obsidian** | Obsidian installed with the [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) community plugin enabled. |

---

## 🚀 Quick Start (local dev)

```bash
git clone <your-repo-url>
cd mist
npm install

# Copy the example env file
cp .env.local.example .env.local
```

Open `.env.local` and set `ENCRYPTION_KEY` to a freshly generated 32-byte hex string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output as `ENCRYPTION_KEY`, then run migrations and start the dev server:

```bash
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You land on the Dashboard. Head to **Settings** to connect your integrations.

---

## 🐳 Docker — Running 24/7

This is the recommended setup for day-to-day use. The container auto-starts on machine boot and runs persistently in the background.

### 1. Fill in `.env.local`

Make sure `.env.local` has real values for all the integrations you want to use. See [Configuration](#-configuration) below.

> **Obsidian note:** Inside Docker, `localhost` refers to the container itself, not your Mac. The `docker-compose.yml` automatically overrides `OBSIDIAN_API_URL` to `http://host.docker.internal:27123`, so the container can reach the plugin running on your machine with no extra setup.

### 2. Build and start

```bash
docker compose up -d --build
```

The first build takes ~3 minutes (it compiles `better-sqlite3` from source). Subsequent starts are near-instant.

Open [http://localhost:3131](http://localhost:3131).

### 3. Day-to-day commands

```bash
# View live logs
docker compose logs -f

# Restart after editing .env.local
docker compose up -d

# Rebuild after pulling code changes
docker compose up -d --build

# Stop
docker compose down
```

### How data persists

The SQLite database lives in a named Docker volume (`mist-data`), mounted at `/data` inside the container. Rebuilding or updating the image **does not delete your data.**

```bash
# Inspect the volume
docker volume inspect mist_mist-data

# Back up the database to the current directory
docker run --rm \
  -v mist_mist-data:/data \
  -v $(pwd):/backup \
  alpine cp /data/mist.db /backup/mist-backup.db
```

`restart: unless-stopped` in `docker-compose.yml` ensures the container comes back up automatically after a reboot.

---

## 📱 Multi-Device & Remote Access

The default setup runs on your Mac and is only reachable at `localhost`. This section covers how to move the container to an always-on device (like a Raspberry Pi) so you can access Mist from your iPad, iPhone, or any browser — without your MacBook needing to be open.

### Architecture overview

```
┌──────────────┐        ┌─────────────────────────┐
│  iPad / any  │◄──────►│   Raspberry Pi / server  │
│   browser    │  local │   Docker container       │
└──────────────┘  or VPN│   :3131                  │
                        └─────────────────────────┘
                                    ▲
                                    │ (optional, same LAN or Tailscale)
                                    ▼
                        ┌─────────────────────────┐
                        │   MacBook (Obsidian)     │
                        │   :27123 REST API plugin │
                        └─────────────────────────┘
```

---

### Option A — Access on your local network (LAN)

If all your devices are on the same Wi-Fi, this is the simplest path.

1. Find your Mac or Pi's LAN IP:
   ```bash
   # macOS
   ipconfig getifaddr en0
   # Linux / Raspberry Pi
   hostname -I | awk '{print $1}'
   ```

2. In `.env.local`, set `BASE_URL` to that IP on port 3131 and update the dependent vars:
   ```env
   BASE_URL=http://192.168.1.100:3131
   NEXTAUTH_URL=http://192.168.1.100:3131
   GOOGLE_REDIRECT_URI=http://192.168.1.100:3131/api/auth/google
   NOTION_REDIRECT_URI=http://192.168.1.100:3131/api/auth/notion
   ```

3. Update the **Authorized Redirect URI** in Google Cloud Console to match `GOOGLE_REDIRECT_URI`.

4. Rebuild and restart:
   ```bash
   docker compose up -d --build
   ```

5. Open `http://192.168.1.100:3131` from any device on the network.

> **Limitation:** LAN access only works when all devices are on the same network. Use Option B for true remote access.

---

### Option B — Raspberry Pi + Tailscale (recommended for remote access)

[Tailscale](https://tailscale.com) creates an encrypted private network between all your devices with zero port-forwarding or router configuration. It is free for personal use.

#### 1. Set up Tailscale

```bash
# On your Raspberry Pi
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# On your Mac
# Download from https://tailscale.com/download

# On your iPad
# Install Tailscale from the App Store
```

After connecting all devices, each gets a stable Tailscale IP (e.g. `100.64.0.x`). Find the Pi's address in the Tailscale admin console or:
```bash
tailscale ip -4   # run on the Pi
```

#### 2. Build Mist on the Pi

```bash
# SSH into the Pi and clone or copy the repo
ssh pi@<pi-tailscale-ip>
git clone <your-repo-url> && cd mist
cp .env.local.example .env.local
```

#### 3. Configure `.env.local` on the Pi

```env
BASE_URL=http://100.64.0.x:3131          # Pi's Tailscale IP
NEXTAUTH_URL=http://100.64.0.x:3131
GOOGLE_REDIRECT_URI=http://100.64.0.x:3131/api/auth/google
NOTION_REDIRECT_URI=http://100.64.0.x:3131/api/auth/notion
```

Update the Authorized Redirect URI in Google Cloud Console to match.

#### 4. Configure the Obsidian URL (if Obsidian stays on your Mac)

The Pi's container cannot reach `host.docker.internal` to talk to Obsidian on your Mac. Instead, create a Docker Compose `.env` file on the Pi (this is separate from `.env.local`) so the compose file can substitute the correct URL:

```bash
# On the Pi, in the mist/ directory
echo "OBSIDIAN_API_URL=http://100.64.0.mac:27123" > .env
```

Replace `100.64.0.mac` with your Mac's Tailscale IP. Obsidian's Local REST API plugin must be running and have **Allow non-local requests** checked in its settings.

#### 5. Start the container

```bash
docker compose up -d --build
```

Open `http://100.64.0.x:3131` from any Tailscale-connected device — Mac, iPad, iPhone, or another computer.

---

### Building for Raspberry Pi (ARM64)

The `node:22-alpine` base image is multi-architecture, so the simplest approach is to build directly on the Pi:

```bash
ssh pi@<pi-ip> "cd mist && docker compose up -d --build"
```

If you prefer to cross-compile from your Mac (takes longer due to QEMU emulation):

```bash
# Install QEMU emulators once
docker run --privileged --rm tonistiigi/binfmt --install all

# Build for arm64 and load into local Docker
docker buildx build --platform linux/arm64 -t mist --load .
```

---

### Option C — HTTPS with a reverse proxy (for public or strict-OAuth deployments)

Google OAuth requires HTTPS for redirect URIs that are not `localhost`. If you want a clean domain name or need HTTPS, add a Caddy reverse proxy.

1. Point a domain at your server's IP (or use Tailscale + a custom domain via Tailscale HTTPS certificates).

2. Create a `Caddyfile` alongside `docker-compose.yml`:
   ```
   mist.yourdomain.com {
       reverse_proxy mist:3000
   }
   ```

3. Add Caddy to `docker-compose.yml`:
   ```yaml
   services:
     mist:
       # ... existing config unchanged ...

     caddy:
       image: caddy:2-alpine
       restart: unless-stopped
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./Caddyfile:/etc/caddy/Caddyfile
         - caddy-data:/data
       depends_on:
         - mist

   volumes:
     mist-data:
     caddy-data:
   ```

4. Set `BASE_URL=https://mist.yourdomain.com` and update all redirect URIs accordingly.

Caddy handles TLS certificate provisioning automatically via Let's Encrypt.

---

All configuration lives in `.env.local`. The Docker container reads this file automatically via `env_file`.

### Encryption key

```env
# Required — 64-char hex string (32 bytes)
ENCRYPTION_KEY=your_64_char_hex_here
```

All integration credentials are encrypted with this key before being stored in SQLite. **If you change it, previously saved credentials can no longer be decrypted** — you will need to re-enter them in Settings.

---

### Notion

1. Go to [notion.so/profile/integrations](https://www.notion.so/profile/integrations) → **New integration**
2. Give it a name, select your workspace, enable **Read content** capability
3. Copy the **Internal Integration Secret** (starts with `secret_…`)
4. In each Notion database you want Mist to access: open the database → `⋯` menu → **Connect to** → select your integration

```env
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

After connecting, add a **Notion Database** widget in the Workspace tab and paste the database ID from the URL (`notion.so/workspace/<database-id>` — the 32-char hex segment).

---

### Google Calendar

1. Open [Google Cloud Console](https://console.cloud.google.com) → create or select a project
2. **APIs & Services → Library** → search for and enable **Google Calendar API**
3. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3131/api/auth/google` (local Docker)
   - Add additional URIs for each deployment target (e.g. your Pi's IP or Tailscale address)
4. Copy the **Client ID** and **Client Secret**

```env
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3131/api/auth/google
```

Then in the app: **Settings → Google Calendar → Connect** — this opens the Google OAuth consent screen. After approving, tokens are stored encrypted in SQLite and refreshed automatically.

---

### Apple Calendar (iCloud)

Apple does not provide a REST API for Calendar, so Mist uses the CalDAV protocol over iCloud.

1. Go to [appleid.apple.com](https://appleid.apple.com) → **Sign-In and Security → App-Specific Passwords**
2. Generate a new password — label it "Mist"
3. In the app: **Settings → Apple Calendar** — enter your iCloud email and the app-specific password

The password is stored encrypted in SQLite and only ever sent to Apple's CalDAV server (`caldav.icloud.com`).

> **Two-factor authentication:** App-specific passwords require 2FA to be enabled on your Apple ID (which it should be). Your main Apple ID password will not work here.

---

### Obsidian

1. In Obsidian: **Settings → Community Plugins → Browse** → search **"Local REST API"** (by coddingtonbear)
2. Install and enable it. Note the **API key** shown in plugin settings.
3. In the app: **Settings → Obsidian** — enter the URL (`http://localhost:27123`) and the API key

Mist reads note titles, paths, and YAML frontmatter. Notes show up in the Calendar if they have a `date:` field:

```yaml
---
title: Weekly review
date: 2026-02-24
tags: [review, weekly]
---
```

Notes also appear in Obsidian widgets on the Workspace tab, filterable by tag.

> Obsidian must be open and running for this integration to work. If it is closed, all Obsidian sections gracefully show an empty state rather than erroring.

---

## 🗂️ Using the App

### Dashboard

The dashboard gives you a bird's-eye view of your week and recent activity.

- **Stats cards** — Events this week, upcoming events in the next 7 days, Obsidian notes with dates, Notion tasks
- **Activity heatmap** — A GitHub-style grid showing how many events/notes you had each day over the last 6 months. Darker = more activity.
- **Week strip** — A 7-day scrollable view with prev/next/today navigation. Each day shows up to 3 event dots.

### Calendar

Full calendar with Day, Week, and Month views.

- Use the **source filter toggles** at the top to show/hide events from specific integrations
- Click any event to open a detail card showing the title, time, source, and a direct link back to the original item
- Navigate between dates with the `‹ ›` arrows or jump back to today

### Workspace

A blank canvas of customizable widgets.

**Adding a widget:**
1. Click **Add Widget** (top-right)
2. Choose a type: *Notion Database*, *Obsidian Notes*, or *Calendar*
3. Fill in the config (e.g. paste a Notion database ID or an Obsidian tag)
4. The widget appears on the grid

**Rearranging:**
- Drag widgets by their title bar
- Resize from any edge or corner
- Layout is auto-saved to SQLite — it survives page reloads and container restarts

**Multiple pages:**
Click **+ New Page** in the workspace tab strip to create separate canvases for different contexts (e.g. "Study", "Projects", "Personal").

### Settings

One connection card per integration. Each card shows the current connection status, credential input fields, and a Connect / Disconnect button. You do not need to restart the app after connecting an integration — data starts loading immediately.

---

## 🗃️ Project Structure

```
mist/
├── src/
│   ├── app/
│   │   ├── (main)/               # Layout shell: sidebar + top bar
│   │   │   ├── dashboard/        # Activity heatmap, week view, stats
│   │   │   ├── calendar/         # Unified calendar with source filters
│   │   │   ├── workspace/        # Drag-and-drop widget grid
│   │   │   └── settings/         # Integration connection cards
│   │   └── api/
│   │       ├── notion/           # List databases, query with filters
│   │       ├── calendar/         # Apple CalDAV + Google Calendar routes
│   │       ├── obsidian/         # Vault file listing and note parsing
│   │       ├── links/            # Cross-source link CRUD
│   │       └── auth/             # OAuth callbacks + credential storage
│   ├── components/
│   │   ├── dashboard/            # ActivityHeatmap, WeekCalendarView, StatsCards
│   │   ├── calendar/             # UnifiedCalendar, EventCard, SourceFilter
│   │   ├── workspace/            # WidgetGrid + widget components
│   │   └── shared/               # Sidebar, TopBar
│   ├── lib/
│   │   ├── notion.ts             # Notion SDK wrapper
│   │   ├── caldav.ts             # Apple CalDAV via tsdav
│   │   ├── google-calendar.ts    # Google Calendar OAuth2 + events
│   │   ├── obsidian.ts           # Local REST API HTTP client
│   │   ├── unified-events.ts     # Merges all sources → UnifiedEvent[]
│   │   ├── credentials.ts        # Encrypted credential read/write
│   │   ├── crypto.ts             # AES-256-GCM helpers
│   │   └── db.ts                 # Prisma client singleton
│   ├── stores/
│   │   ├── settings.ts           # Zustand: integration connection status
│   │   └── workspace.ts          # Zustand: widget layouts per page
│   └── types/                    # UnifiedEvent, NotionEntry, ObsidianNote
├── prisma/
│   ├── schema.prisma             # Models: Credential, Link, WidgetLayout, WorkspacePage
│   └── migrations/               # SQL migration history
├── Dockerfile                    # 3-stage production image
├── docker-compose.yml            # Volume, env, restart policy
└── docker-entrypoint.sh          # Runs migrations then starts the server
```

---

## 🔧 Troubleshooting

**Container exits immediately after starting**

```bash
docker compose logs mist
```

Most common cause: `ENCRYPTION_KEY` in `.env.local` is still the placeholder value, or `DATABASE_URL` is missing.

---

**Apple Calendar returns no events**

- Confirm the app-specific password is correct — regenerate one at appleid.apple.com if unsure
- Make sure 2FA is enabled on your Apple ID; app-specific passwords require it
- Your main Apple ID password will not work here

---

**Google Calendar shows "Not connected" after the OAuth flow**

- Check that `GOOGLE_REDIRECT_URI` in `.env.local` exactly matches the redirect URI registered in Google Cloud Console (including the scheme, host, port, and no trailing slash)
- When running in Docker, the redirect URI must use port 3131 (e.g. `http://localhost:3131/api/auth/google`), not the internal container port 3000
- For remote deployments, the redirect URI must use the public URL — update both `.env.local` and the Google Cloud Console entry together

---

**Obsidian shows "not running"**

- Make sure Obsidian is open and the Local REST API plugin is enabled (green indicator in plugin settings)
- In Docker, `OBSIDIAN_API_URL` must be `http://host.docker.internal:27123` — `docker-compose.yml` sets this automatically, but a value in `.env.local` takes precedence

---

**Widget layouts disappear after restarting Docker**

The `mist-data` Docker volume may have been pruned. Check:

```bash
docker volume ls | grep mist
```

If it is gone, re-add your widgets in the Workspace tab. To prevent data loss, keep a regular backup (see the backup command in the Docker section above).

---

**Credentials fail to decrypt after changing `ENCRYPTION_KEY`**

Changing `ENCRYPTION_KEY` after credentials have been saved means the old encrypted blobs can no longer be read. Go to **Settings**, disconnect each integration, and reconnect with fresh credentials using the new key.
