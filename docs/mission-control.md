# Mission Control

Mission Control is the protected site-management app inside the device shell. It
uses the verified AJ Thompson session provided by `DeviceShell`. Guests receive
an administrator access dialog; backend functions still verify
`ADMIN_POST_SECRET` for every request.

## Sections

- `/admin`: profile photo, management shortcuts, recent posts, and photo-service
  status
- `/admin/posts`: post totals, published/draft filters, search, editing, and
  confirmed permanent deletion
- `/admin/new`: create a post
- `/admin/new?slug=...`: edit an existing post
- `/admin/photos`: upload or reference photos, edit metadata/order/visibility,
  manage albums, remove album assignments, and set shared favorites
- `/admin/dogs`: publish the latest dog incident and increment the culprit's
  all-time incident count
- `/admin/guestbook`: moderate messages and conversations and pause/resume public
  submissions
- `/admin/calendar`: create, edit, publish, or hide events

Internal route buttons use `useNavigate`; direct section routes also work as the
initial in-device destination.

## Editor lifetime

Mission Control intentionally keeps selected editor components mounted:

- An open post editor survives section changes and desktop app switches.
- The calendar editor is mounted after its first visit and survives section/app
  switches.
- Photo state is owned by Mission Control while its window remains mounted.

Closing the Mission Control window, signing out, restarting/shutting down, or
reloading unmounts the workspace and discards unsaved state. Selecting a different
record can also replace a draft. Photo/album and calendar selection prompt before
discarding dirty editors; the post editor does not provide a general unsaved-change
guard. Save before leaving the session.

## Blog publishing

The post editor supports:

- title-derived slug, excerpt, category, publication date, and published state
- cover URL or cover upload plus alternative text
- ordered sections with heading, paragraphs, and bullets
- existing media plus new image/video uploads, captions, alt text, and posters

Uploads are validated in the browser and server. HEIC/HEIF images are converted
in the browser with the existing `heic2any` dependency. A save refreshes the
admin post list and open public Blog/Dog HQ views.

Deletion is permanent at the row level and asks for confirmation. Uploaded media
is not removed as part of post deletion.

## Photo and profile behavior

The overview avatar opens a profile-image chooser. Saved profile photos are
public and reused on the AJ Thompson account card, Settings account panel, and
Resume. Each upload receives a new storage path; old successful images are kept.

Photo management supports individual URL/file saves and a multi-file upload
queue. A photo may have no album. Removing a photo from an album saves
immediately without hiding or deleting it. There is no permanent photo/album
delete action in this release.

Hiding a photo removes it from public table reads and the Photos app, but the
public storage URL remains reachable to anyone who already has it. Favorites are
also public values; only the verified admin can change them.

## Dog incident behavior

The editor calls `admin-dog-incident` with the admin secret in a header. Saving
replaces the single `latest` incident and increments the selected culprit's
counter. Dog HQ refreshes in the same tab after post/focus changes and in other
tabs through the incident storage revision.

## Calendar behavior

New events start as drafts. Timed values are entered in local time and converted
to UTC for storage; all-day values stay as inclusive dates. Saving refreshes open
Calendar windows and other tabs. Events are hidden by clearing Publish; there is
no delete, recurrence, sync, or notification delivery.

See [Calendar](calendar.md) for setup and live verification.

## Guestbook behavior

Mission Control has separate Messages and Conversations views. It can edit text,
hide/show entries, permanently delete messages, delete non-primary conversations,
and change the global submission state. Messages publish after automated checks;
there is no pending approval queue.

See [Guestbook](guestbook.md) before changing security, limits, policies,
Turnstile, migrations, or submission state.

## Backend requirements

Mission Control requires all database migrations and these functions:

- `admin-blog-post`
- `admin-dog-incident`
- `admin-photo-library`
- `admin-calendar`
- `guestbook`

The photo library also depends on the admin-profile, nullable-album, and favorite
follow-up migrations. Guestbook conversation moderation depends on the
conversation, admin-author, and cascade-delete follow-ups.

See [Admin and Supabase architecture](admin-and-supabase.md) for the complete
order, environment variables, and public boundaries.

## Verification

Lightweight local tests that do not start a server include:

```sh
CI=true node node_modules/react-scripts/scripts/test.js --watchAll=false --runInBand src/pages/MissionControl.test.jsx src/pages/AdminProfile.test.jsx src/pages/AdminPhotoUpload.test.jsx src/pages/AdminCalendar.test.jsx
node --test supabase/functions/admin-photo-library/index.test.cjs supabase/functions/admin-calendar/index.test.cjs supabase/functions/guestbook/index.test.cjs
```

The Edge Function tests use mocked database/storage clients. They do not verify a
live Supabase project, migrations, RLS, storage, CORS, secrets, or Turnstile.

Before production use, test rejected and accepted login, drafts/publishing,
uploads/conversion, cross-tab refresh, calendar time zones, guestbook pause and
moderation, public read restrictions, keyboard navigation, desktop window sizes,
and phone layouts in an owner-managed environment.

## Main files

- Shell session and access: `src/components/DeviceShell.jsx`,
  `src/lib/useAdminAccess.js`
- Workspace composition: `src/pages/MissionControl.jsx`
- Posts/dogs: `src/pages/Admin.jsx`, `src/pages/NewPost.jsx`
- Photos/profile: `src/pages/AdminPhotos.jsx`,
  `src/pages/AdminPhotoUpload.jsx`, `src/pages/AdminProfile.jsx`
- Calendar: `src/pages/AdminCalendar.jsx`
- Guestbook: `src/pages/AdminGuestbook.jsx`
- Browser service helpers: `src/lib/adminPostEditor.js`,
  `src/lib/adminPhotoLibrary.js`, `src/lib/adminCalendar.js`,
  `src/lib/guestbook.js`
