# Data and Content Model

Public content is split between local source data and Supabase. Each public
reader normalizes database rows into the shape expected by its page. RLS is the
public authorization boundary; admin writes use service-role Edge Functions.

## Source behavior by feature

| Feature | Supabase configured | Supabase absent |
| --- | --- | --- |
| Blog | Published `ajt3_blog_posts` rows | `src/data/blogPosts.js` fixtures |
| Photos | Published `ajt3_photos` and visible albums | `src/data/photos.js` fixtures |
| Calendar | Published `ajt3_calendar_events` | Empty list |
| Dog incident | `latest` incident plus culprit counter | No incident |
| Guestbook | Public conversation view and visible messages | Unavailable error |
| Admin profile | Public `image_url` row | Initials/local imagery |
| Music | Local `src/data/musicPlaylists.js` | Same local data |
| Policies | Local JavaScript strings | Same local data |

Supabase query failures do not silently fall back to local Blog or Photos data.
Fallback is only for an unconfigured client. This prevents hidden or empty
production libraries from being replaced by seed content.

## Blog posts

The normalized public post shape is:

- `slug`
- `title`
- `eyebrow`
- `excerpt`
- `date`
- `image`
- `imageAlt`
- `tags`
- `sections`
- `media`

Supabase fields are `slug`, `title`, `eyebrow`, `excerpt`, `published_at`,
`cover_image_url`, `cover_image_alt`, `tags`, `sections`, `media`,
`is_published`, `created_at`, and `updated_at`.

### Sections and media

Each section may contain:

- `heading`
- `paragraphs`: array of strings
- `bullets`: array of strings

Each media item may contain:

- `type`: `image` or `video`
- `src`
- `alt`
- `caption`
- `poster` for video

The article renderer treats all content as structured React text. It does not
accept arbitrary HTML.

### Dates, tags, and slugs

- Supabase results are sorted newest-first by `published_at`.
- ISO date-only values are formatted in UTC so display dates do not shift by the
  viewer's time zone.
- Blog hides posts tagged `dogs`; Dog HQ shows only posts tagged `dogs`.
- Blog folders are derived from the remaining post tags.
- Mission Control uses one Category field for the eyebrow and the normalized tag
  used for placement.
- Slugs are generated from titles by lowercasing and replacing non-alphanumeric
  groups with hyphens.
- The Edge Function rejects a title-derived slug already owned by another post.

## Dog incidents

`ajt3_dog_incidents` stores the single current row with `id = 'latest'`:

- `culprit`
- `incident`
- `incident_at`
- optional legacy `portrait_url` and `portrait_alt`
- `updated_at`

`ajt3_dog_incident_counters` stores one all-time count per culprit. The
`save_dog_incident` RPC updates the latest record and increments the selected
culprit atomically. The dedicated admin function can fall back to direct writes
if an older deployment does not provide the RPC, but the migration includes it.

The public UI derives portrait imagery locally from the culprit name and
calculates whole days since `incident_at`. Missing or future dates display a safe
empty/zero state.

## Photo library

`ajt3_photo_albums` contains:

- `id`, `title`, `description`, and `sort_order`
- `created_at` and `updated_at`

`ajt3_photos` contains:

- `id`, required `album_id`, `title`, `caption`, and `alt_text`
- `image_url`, optional `width` and `height`, and `sort_order`
- `is_published` and `is_favorite`
- `created_at` and `updated_at`

Public photo rows normalize `image_url` to `src`, `album_id` to `album`, and the
database boolean fields to camel-case UI fields. Public album policy only exposes
albums that contain at least one published photo. Every photo belongs to an album;
deleting it from that album also removes it from the main Library.

Favorites are a shared server value chosen by the admin, not per-visitor browser
storage. Everyone can view Favorites; only a verified administrator can change
them.

The local library includes five photos and three albums. Local image derivatives
under `public/images/photos/` are selected by `src/lib/photoImages.js` when an
appropriate generated size exists. Supabase Storage images request transformed
widths through the public render endpoint.

## Calendar events

`ajt3_calendar_events` contains:

- `id`, `title`, `calendar`, `location`, and `notes`
- `all_day` and `is_published`
- `start_date` and `end_date` for all-day events
- `start_at` and `end_at` for timed events
- `created_at` and `updated_at`

The `calendar` value is one of `personal`, `work`, or `events`. A database check
requires exactly one valid date pair for the chosen all-day mode.

Timed values are submitted as UTC timestamps and displayed in the viewer's local
time zone. All-day values remain calendar dates; their end date is inclusive in
the UI. There is no recurrence, notifications, deletion, or external sync.

## Guestbook

Guestbook uses four data surfaces:

- `ajt3_guestbook_conversations`: public boards with hidden state
- `ajt3_guestbook`: messages with conversation, author, trusted admin marker,
  hidden state, and creation time
- `ajt3_guestbook_conversation_list`: invoker-security public preview view
- private `ajt3_guestbook_settings` and `ajt3_guestbook_limits`

Public roles may read visible boards/messages but cannot publish or inspect
settings/limits. Guest publishing uses the service-role-only v3 RPC through the
Edge Function. The RPC atomically applies pause state, rate limits, duplicate
checks, conversation visibility, board creation, message creation, and trusted
administrator marking. See [Guestbook](guestbook.md) for the full security and
privacy model.

## Admin profile

`ajt3_admin_profile` is a single public row with `id = 'admin'`, `image_url`, and
`updated_at`. Public clients can read the image URL. Only the photo-library Edge
Function writes the row. The image is reused on the account chooser, Settings,
and Resume.

## Local-only product data

- `src/data/musicPlaylists.js` contains playlist keys, Apple Music URLs, artwork,
  colors, orbit placement, and track previews.
- `src/data/terminalCommands.js` contains terminal pages, aliases, setting
  mappings, and help copy.
- `src/data/guestbookTerms.js` and `src/data/privacyPolicy.js` contain the policy
  version and text rendered by Policy and the guestbook participation gate.
- The App Store catalog, professional profile, Tech focus areas, dog profiles,
  and mail defaults currently live in their page components.

## Storage

The public `blog-media` bucket is reused for:

- blog covers and media under the configurable blog prefix
- photos under `ajt3/me/photos/`
- the admin profile image under `ajt3/me/profile/`

Published URLs are public. Hiding a row removes it from public table reads and
the application UI, but it does not make an already known storage URL private.
Replacing media generally retains old objects so existing external URLs continue
to work.
