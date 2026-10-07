# AJT3.me

AJT3.me is A.J. Thompson's personal site presented as an interactive desktop and
phone. The React app includes movable desktop windows, a phone lock screen,
system settings, an installable demo app catalog, a command terminal, public
content apps, and a password-protected Mission Control workspace.

## Product overview

The home screen exposes these built-in apps:

- Photos, Blog, Guestbook, Calendar, Music, Mail, Dogs, Resume, and Instagram
- App Store, Terminal, Settings, and Mission Control

The App Store can add four external projects to the current in-memory home
screen: Build, New Trinity Missionary Baptist Church, Lattaco Welding, and
Jazzed To Be Jones. Opening an external app shows a short redirect screen before
leaving the site.

Desktop-sized viewports use a window manager with focus order, dragging,
keyboard-accessible resize handles, minimize, maximize, close, and a dock.
Phone-sized viewports use a lock screen, one full-screen app at a time, local
back gestures, a home gesture, and a four-app dock. See
[Device shell and UI behavior](docs/device-shell.md) for the complete interaction
model.

## Application architecture

- `src/App.jsx` creates a `MemoryRouter`, captures the incoming path as the
  initial in-app route, and resets the browser address to `/`.
- `src/components/DeviceShell.jsx` owns the simulated device, app registry,
  desktop windows, phone navigation, user session, settings, and system actions.
- `src/pages/` contains the public apps and Mission Control screens.
- `src/data/` contains local fallback content plus public Supabase readers.
- `src/lib/` contains shared browser-side service clients and hooks.
- `supabase/migrations/` defines the database, RLS, storage, and publishing RPCs.
- `supabase/functions/` contains the five Edge Functions used by the site.

The use of `MemoryRouter` is intentional: a direct request such as
`/blog/example` opens that route inside the device, but subsequent navigation
does not rewrite the browser address bar.

## Data behavior

When browser Supabase configuration is absent:

- Blog and Photos use local fallback data.
- Calendar displays an empty event list.
- The dog incident monitor has no current incident.
- Guestbook and Mission Control report that their services are unavailable.
- The rest of the site remains usable because its content is local.

When Supabase is configured, public readers only request published or otherwise
public rows allowed by RLS. Administrative writes go through password-protected
Edge Functions using the service role on the server.

## Local configuration

Create `.env.local` without committing it:

```sh
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-public-anon-key
REACT_APP_TURNSTILE_SITE_KEY=your-public-turnstile-site-key
```

The Turnstile key is only needed to complete guest participation in Guestbook.
Production and local preview hostnames should use separate Turnstile widgets.
Private Supabase, admin, and Turnstile secrets belong in the Edge Function
environment, never in the frontend environment or repository.

## Available scripts

- `npm start` / `npm run dev` - start the Create React App development server
- `npm test` - run the Jest/React Testing Library suite
- `npm run build` - create a production bundle

Repository builds, servers, deployments, and database changes are owner-managed.

## Documentation

- [Device shell and UI behavior](docs/device-shell.md)
- [Routes and app behavior](docs/site-map.md)
- [Design system and active components](docs/design-system.md)
- [Data and content model](docs/content-model.md)
- [Mission Control](docs/mission-control.md)
- [Admin and Supabase architecture](docs/admin-and-supabase.md)
- [Calendar setup and behavior](docs/calendar.md)
- [YouTube app and API setup](docs/youtube.md)
- [Guestbook security and operations](docs/guestbook.md)
- [Legacy and unused files](docs/legacy-components.md)

## Verification scope

The documentation is maintained against the source tree, migrations, Edge
Functions, and tests. A live browser check is still required for visual layout,
real Supabase policies, uploads, Turnstile, cross-tab refresh, and deployment
configuration.
