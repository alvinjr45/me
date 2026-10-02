# Site Map

AJT3.me is a single React application whose routes render inside the simulated
device in `src/components/DeviceShell.jsx`. `src/App.jsx` defines the route table.
See [Device shell and UI behavior](device-shell.md) for windowing, phone
navigation, account, and address-bar behavior.

## Public routes

| Path | Main component | Purpose | Primary data |
| --- | --- | --- | --- |
| `/` | `Home.jsx` | Paginated home screen for built-in and installed apps | `desktopApps` plus in-memory installs |
| `/tech` | `Tech.jsx` | Product engineering, creative systems, and experiments | Local component data |
| `/blog` | `Blog.jsx` | Searchable folder-style blog browser with embedded reader | Published Supabase posts or local fallback |
| `/blog/:slug` | `BlogPost.jsx` | Direct-link article reader | Published Supabase post or local fallback |
| `/dogs` | `Dogs.jsx` | Drake and Josh profiles, incident counter, and dog-tagged field notes | Supabase/local posts and Supabase incident data |
| `/music` | `Music.jsx` | Playlist collection and Apple Music links | `src/data/musicPlaylists.js` |
| `/photos` | `Photos.jsx` | Photo library, albums, favorites, search, and viewer | Published Supabase library or local fallback |
| `/calendar` | `Calendar.jsx` | Day, week, month, year, agenda, filters, and event details | Published Supabase events |
| `/guestbook` | `Guestbook.jsx` | Public conversation boards and participation flow | Supabase plus the `guestbook` Edge Function |
| `/mail` | `Mail.jsx` | Editable prefilled email that opens the visitor's mail client | Local defaults |
| `/resume` | `LinkedIn.jsx` | Professional profile, experience, projects, and skills | Local component data and public profile image |
| `/app-store` | `AppStore.jsx` | Catalog and in-memory installation of external projects | Local catalog and shell install state |
| `/terminal` | `Terminal.jsx` | Full interactive site terminal | Route, settings, and public content helpers |
| `/settings` | `Settings.jsx` | Appearance, scene, wallpaper, device, clock, motion, and power settings | Shell context and `localStorage` |
| `/terms` | `Policy.jsx` | Guestbook terms and conditions | `src/data/guestbookTerms.js` |
| `/privacy` | `Policy.jsx` | Privacy policy and provider links | `src/data/privacyPolicy.js` |
| `*` | `NotFound.jsx` | Glitch-styled 404 page | Local component data |

`/tech` is a reachable internal overview, primarily through Terminal. The home
screen's downloadable Build app instead opens `https://ajt3.website`.

Instagram and installed catalog projects are external destinations rather than
React routes.

## Mission Control routes

All `/admin/*` routes render `MissionControl.jsx`. Guests see an administrator
access dialog; a verified AJ Thompson session opens the workspace.

| Path | View | Behavior |
| --- | --- | --- |
| `/admin` | Overview | Profile photo, destinations, recent posts, and photo-service status |
| `/admin/posts` | Blog posts | Search/filter posts, open the editor, and confirm permanent deletion |
| `/admin/new` | New post | Create a draft or published post |
| `/admin/new?slug=:slug` | Post editor | Edit the selected existing post |
| `/admin/photos` | Photos | Manage photos, albums, favorites, order, visibility, and uploads |
| `/admin/dogs` | Dog incident | Load and publish the latest incident and increment the culprit counter |
| `/admin/guestbook` | Guestbook | Moderate messages/conversations and pause/resume submissions |
| `/admin/calendar` | Calendar | Create, edit, publish, or hide calendar events |

The post, photo, and calendar editors are intentionally kept mounted while their
Mission Control window remains open, so switching sections or desktop apps does
not immediately discard the current draft.

## App behavior

### Home and App Store

Home shows up to 12 apps per page. Desktop supports pagination buttons, arrow
keys, and pointer dragging between pages; phone uses a horizontally paged app
grid. App Store has Discover, Apps, Games, and Library sections, category filters,
product detail pages, and simulated installation for four external projects.

### Blog and direct articles

Blog excludes posts tagged `dogs`, derives folders from remaining tags, and
searches title, excerpt, and tags. Selecting a row opens an embedded article in
the third pane; narrow windows show it as a nested reader with local back
behavior. `/blog/:slug` supports direct article entry and not-found/error states.

### Dogs

Dog HQ loads dog-tagged posts and the current incident independently. It shows
Drake and Josh, days since the incident, the selected culprit's all-time incident
count, searchable field notes, retry states, and an embedded article reader.

### Music

Desktop uses an interactive solar-system collection and one playlist player.
Phone uses a playlist grid followed by a dedicated player screen. Playlist
actions leave the site for Apple Music; audio is not played directly by this app.

### Photos

Photos supports All Photos, Favorites, albums, title/album search, thumbnail
density, album cards, and a full viewer with keyboard arrows, touch swipes,
filmstrip navigation, captions, and optional metadata. Only a verified admin sees
the favorite toggle. The displayed library is shuffled once per app instance and
keeps that order through refreshes.

### Calendar

Calendar filters Personal, Work, and Events calendars and provides day, week,
month, and year views. It includes Today/previous/next navigation, a mini month,
local-time display for timed events, inclusive date display for all-day events,
event details, and a selected-day agenda.

### Guestbook

Guests complete the terms/age/Turnstile entry screen before conversation data is
requested. The app provides searchable public boards, per-conversation drafts,
new topics, replies, polling, manual refresh, pagination, and mobile list/chat
navigation. Verified admins bypass the guest entry screen and post with a
server-trusted administrator marker.

### Settings and Terminal

Settings is the graphical interface for shared device preferences and system
actions. Terminal exposes the same settings plus navigation and read-only content
commands. Both operate through `DeviceSettingsContext`.

### Mail and Resume

Mail edits a subject and body, then opens a `mailto:` link for
`alvinjr15@gmail.com`. Resume presents local professional content and reuses the
public admin profile image when one is available.

## Cross-app refresh events

- `ajt3-posts-updated` refreshes Blog and dog field notes after post changes.
- `ajt3-photos-updated` plus the `ajt3-photos-updated` storage key refreshes open
  Photos views in the same tab and other tabs.
- `ajt3-calendar-updated` plus the `ajt3-calendar-updated` storage key refreshes
  open Calendar views.
- `ajt3-guestbook-updated` refreshes guestbook conversation data.
- `ajt3_dog_incident_updated_at` is a storage key used to refresh Dog HQ across
  tabs; focus also refreshes incident data.
