# Admin and Supabase Architecture

Supabase provides the public content store and the server-side publishing
boundary. Public pages read through the anonymous client under RLS. Mission
Control sends every management request to an Edge Function, which verifies the
shared admin password and then uses the service role.

## Authentication model

The AJ Thompson account screen verifies a password by sending
`{ action: "list", adminSecret }` to `admin-blog-post`. A successful response
creates an in-memory React session containing the secret and current post list.

- The secret is not written to `localStorage` or committed source.
- Reload, logout, restart, and shutdown clear the session.
- The UI session only controls access to screens. Every Edge Function verifies
  `ADMIN_POST_SECRET` again before privileged work.
- Guestbook administrator posts also require the secret and receive their trusted
  `is_admin` value on the server.
- Public RLS policies do not permit browser-side writes.

`supabase/config.toml` sets `verify_jwt = false` for all five functions because
the application uses its own password or Turnstile/session checks. Do not remove
those checks when changing a function.

## Browser configuration

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_TURNSTILE_SITE_KEY` for guest participation

`src/lib/supabaseClient.js` creates no client unless both Supabase values exist.
See [Data and content model](content-model.md) for per-feature fallback behavior.

## Edge Functions

### `admin-blog-post`

Used for login verification and blog publishing.

- `list`: returns all posts, including drafts, for Mission Control
- `save`: validates and upserts a post, optional cover, and optional media
- `delete`: permanently deletes the selected post row
- rejects a new title-derived slug already owned by another post
- removes the old row after a successful slug change
- still contains compatible dog-incident actions, although the current UI uses
  the dedicated dog function

JSON is used for list/delete. Post saves use `FormData` so files can be included.
On successful saves/deletes, the browser dispatches `ajt3-posts-updated`.

### `admin-dog-incident`

Used by Mission Control > Dog incident.

- GET loads the `latest` incident and selected culprit's all-time count.
- POST validates culprit, incident text, and date, then saves the latest incident
  and increments the counter.
- Prefers the transactional `save_dog_incident` RPC and includes compatibility
  fallbacks for older deployments.

Authentication uses the `x-admin-secret` header. Successful browser saves update
the `ajt3_dog_incident_updated_at` storage key for other tabs.

### `admin-photo-library`

Used by Mission Control and the admin favorite control in Photos.

- `list`
- `save_photo`
- `save_album`
- `delete_photo`
- `set_favorite`
- `save_profile`

Photo and profile uploads accept JPG, PNG, WebP, or GIF up to 20 MB after any
browser-side HEIC/HEIF conversion. A failed row save removes only the new upload.
Replaced files are otherwise retained. Successful changes dispatch and persist
the `ajt3-photos-updated` revision signal.

### `admin-calendar`

Used by Mission Control > Calendar.

- `list` returns published and draft events.
- `save` validates and upserts timed or all-day events.

There is no delete action. Hiding an event means saving it with
`is_published = false`. Successful changes dispatch and persist the
`ajt3-calendar-updated` revision signal.

### `guestbook`

Used for guest verification/posting and administrator moderation.

- Public verification exchanges Turnstile for a signed, one-hour posting session.
- Public publishing validates declarations, session/token, text, limits,
  duplicate rules, pause state, and conversation visibility.
- Admin actions list hidden content, update visibility/text/title, delete
  messages/conversations, and change the global submission state.
- Admin publishing forces the trusted AJ author identity on the server.

Guestbook uses stricter origin/hostname configuration and its own keyed hashing
secret. See [Guestbook](guestbook.md) before deployment or moderation changes.

## Server environment

Shared admin-function values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_POST_SECRET`
- `ADMIN_CORS_ORIGINS`, falling back to `ADMIN_CORS_ORIGIN`

Optional media values used by blog/photo workflows:

- `BLOG_MEDIA_BUCKET` (default `blog-media`)
- `BLOG_MEDIA_PREFIX` (default `ajt3/me/blog`)

Guestbook-specific values:

- `TURNSTILE_SECRET_KEY`
- `GUESTBOOK_HASH_SECRET`
- `GUESTBOOK_ORIGINS`
- `GUESTBOOK_HOSTNAMES`
- `GUESTBOOK_TERMS_VERSION`
- optional `GUESTBOOK_BLOCKED_WORDS`

Supabase supplies `SUPABASE_URL` and service-role credentials in a deployed
function environment, but the functions still fail closed if required values are
missing. Never expose any server secret through a `REACT_APP_` variable.

## Migrations

Apply migrations in filename order:

| Migration | Purpose |
| --- | --- |
| `20260505000000_create_blog_posts.sql` | Blog posts, dog incidents/counters/RPCs, update trigger, RLS, and `blog-media` bucket |
| `20260924000000_create_photo_library.sql` | Photo albums/photos, public policies, and seed library |
| `20260925000000_create_admin_profile.sql` | Public admin profile image row |
| `20260925000000_create_guestbook.sql` | Messages, settings, limits, RLS, and original publishing RPC |
| `20260926000000_create_calendar_events.sql` | Calendar event table, range constraint, and published-read policy |
| `20260927000000_guestbook_conversations.sql` | Conversation boards, preview view, and v2 publishing RPC |
| `20260928000000_allow_photos_without_album.sql` | Nullable photo album assignment |
| `20260928000000_guestbook_admin_author.sql` | Trusted administrator marker and v3 publishing RPC |
| `20260929000000_add_photo_favorites.sql` | Shared admin-selected photo favorites |
| `20261001000000_guestbook_conversation_delete.sql` | Cascading message deletion with non-primary conversations |
| `20261002000000_require_photo_albums.sql` | Remove legacy unassigned photos and require an album for every photo |

The initial blog migration creates `public.set_updated_at()`, which later photo
and calendar migrations reuse. Review the complete pending migration set before
applying it to an existing project.

Two migrations currently share the version prefix `20260928000000`. Before using
an automated migration runner, confirm how the linked project's migration history
records them. If the runner requires unique versions, resolve the filename/version
collision in coordination with the already-applied production history; do not
blindly rename or reapply a migration on a live database.

## Public read boundaries

- Blog: published posts only
- Dogs: current incident and public counters
- Photos: published photos and albums containing a published photo
- Calendar: published events only
- Guestbook: visible conversations and visible messages under visible parents
- Admin profile: image URL only
- Storage: public objects in `blog-media`

Because storage is public, hiding a database row is curation rather than file
revocation. Use a private bucket and signed URLs if media confidentiality becomes
a requirement.

## CORS and sign-in troubleshooting

`Load failed` or `Failed to fetch` means the browser could not read the response;
it does not prove the password was rejected.

- Confirm the frontend URL targets the Supabase project containing the functions.
- Configure the exact scheme, hostname, and port for each allowed origin.
- Include both `https://ajt3.me` and `https://www.ajt3.me` when both are served.
- Preserve local/LAN origins separately; they are not equivalent.
- Confirm OPTIONS permits POST (and GET for dog incident) plus `authorization`,
  `apikey`, `content-type`, and `x-admin-secret` as needed.
- A readable 401/403 means the secret was rejected. A 404 means the function is
  missing. A 5xx requires checking configuration, migrations, and function logs.

The login password is the value of `ADMIN_POST_SECRET`, not the variable name.

## Deployment order

For a new environment:

1. Review and apply the migrations in order.
2. Create/configure the required secrets and exact origins.
3. Deploy all functions listed in `supabase/config.toml`.
4. Configure the three public frontend variables.
5. Build and deploy the frontend through the owner-managed workflow.
6. Complete the live checks in the Calendar, Guestbook, and Mission Control docs
   before publishing content or resuming guest submissions.
