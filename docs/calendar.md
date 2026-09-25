# Calendar

Calendar opens at `/calendar` from the desktop, dock, phone home screen, or the
terminal command `open calendar`. It uses an Apple Calendar-inspired dark layout:
day and week time grids, a month grid, a year overview, desktop calendar filters,
Today navigation, and event details. On phones, select a date in the compact month
grid to read its events below. Week view scrolls horizontally to preserve legibility.

## Managing events

Sign in as admin, then open Mission Control > Calendar > Add event.
Choose a title, Personal/Work/Events calendar, start and end, optional location and
notes, and whether to publish. New events start as drafts. Published events and
their full details are visible to every visitor. Uncheck Publish in Calendar and
save to hide an event. Drafts are readable only through the admin endpoint.

Timed events are entered and displayed in the viewer's local time zone and stored
as UTC timestamps. All-day events use calendar dates and include the end date.
There is no recurrence, notification delivery, external calendar sync, or permanent
deletion in this version.

An unsaved editor stays open while switching Mission Control sections or desktop
apps. Save before closing Mission Control, signing out, or reloading. Selecting
another event asks before discarding unsaved edits. Failed saves retain the draft.
Successful saves refresh open Calendar windows; other tabs refresh on focus or a
storage event. No sample events are inserted.

## Setup (site owner)

Apply `supabase/migrations/20260926000000_create_calendar_events.sql`, then deploy
`admin-calendar` before deploying the frontend. This uses the existing Supabase
project and `public.set_updated_at()` function from the blog migration.
The function reuses `ADMIN_POST_SECRET`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_CORS_ORIGINS` / `ADMIN_CORS_ORIGIN`.
Frontend configuration uses the existing Supabase URL and anonymous key.

Review all pending migrations, including any unrelated concurrent work, before
applying them:

```sh
supabase db push --dry-run
supabase db push
supabase functions deploy admin-calendar
npm run build
```

`supabase/config.toml` disables JWT verification for this function because every
management request is checked against the server's admin secret. Table grants and
row-level security permit visitors to read published events only; all writes use
the authenticated admin function. Do not remove its password check.

## Verification

Local checks, without a build or server:

```sh
CI=true node node_modules/react-scripts/scripts/test.js --watchAll=false --runInBand src/pages/Calendar.test.jsx src/pages/AdminCalendar.test.jsx src/pages/MissionControl.test.jsx src/App.test.jsx
node --test supabase/functions/admin-calendar/index.test.cjs
```

The endpoint tests use mocked database clients, not a live Supabase runtime. On
your test deployment, check the migration and public-read policies, create a
draft, publish it, edit it, and hide it while Calendar remains open. Confirm a
guest cannot read drafts or write directly. Check overnight and overlapping timed
events, all-day events, different time zones, keyboard focus, desktop window
resizing, and phone month/week layouts. Build, browser checks, migrations, and
deployment are reserved for the site owner.
