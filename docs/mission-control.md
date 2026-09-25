# Mission Control

Mission Control is the central site dashboard inside the desktop shell. It uses
the shell's verified admin session. Guests cannot open management views, and
backend operations still require `ADMIN_POST_SECRET` independently of the UI.

## Sections

- `/admin`: publishing totals, photo totals, recent posts, and management links.
- `/admin/posts`: search and filter published posts and drafts; open the editor.
- `/admin/new?slug=...`: edit an existing post. Without a slug, create a new post.
- `/admin/photos`: add or replace images, edit titles, alt text and captions,
  assign albums, adjust display order, and publish or hide photos. Create and
  rename albums and change their descriptions and order here too.
- `/admin/dogs`: the existing dog incident editor.
- `/admin/calendar`: create, edit, publish, and hide calendar events. See
  [Calendar setup and verification](calendar.md) for the required migration and function.
- `/admin/guestbook`: hide/show whole conversations, hide/show or delete their
  auto-published messages, and pause/resume submissions. There is no approval queue;
  see [Guestbook setup](guestbook.md) for
  its separate Turnstile, rate-limit, and profanity-filter configuration.

The in-app routes also work as entry links. Browser navigation remains controlled
by the desktop shell. Switching sections or minimizing retains an open post
editor and photo draft. Selecting another post replaces that editor. Closing,
signing out, or reloading discards unsaved changes. Save before doing any of those.

## Backend setup (run by the site owner)

The existing Supabase project, `blog-media` bucket (or `BLOG_MEDIA_BUCKET`), admin
password, and CORS configuration are reused. No new frontend secret is required.
The new function reads `ADMIN_POST_SECRET`, `SUPABASE_URL`, and
`SUPABASE_SERVICE_ROLE_KEY`, plus the existing optional bucket and CORS settings.

Apply `supabase/migrations/20260924000000_create_photo_library.sql` and deploy the
new photo function before deploying this frontend. The migration creates two
tables with public read policies, authenticated server-only writes, and seeds
the five existing photos and three albums with their existing IDs. Public album
queries return only albums with at least one published photo.

For the correct linked Supabase project, review pending migrations first, then
apply and deploy:

```sh
supabase db push --dry-run
supabase db push
supabase functions deploy admin-photo-library
supabase functions deploy admin-blog-post
npm run build
```

`supabase/config.toml` sets `verify_jwt = false` for these functions because they
use the existing server-checked admin password. Do not remove the password check
from either handler. The blog function update prevents new posts from overwriting
another post with the same title-derived URL.

These commands follow the official [Supabase migration workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
and [function deployment instructions](https://supabase.com/docs/guides/functions/deploy).
Deploy the resulting frontend using the site's usual workflow.

## Photo behavior

Photo uploads accept JPG, PNG, WebP and GIF up to 20 MB; the browser converts HEIC
and HEIF with the existing converter. Each replacement gets a new storage path.
Successful replacements retain old image files so existing external links keep
working. A failed database save attempts to remove only its newly uploaded file.

Hiding a photo removes its row from public reads and the camera roll. Storage is
public, so hiding is not a way to make an image URL private. This release does not
permanently delete photos, albums, or their files.

The public Photos app reads Supabase when it is configured. It uses the original
static collection only when Supabase is not configured. An empty published
library stays empty; failures display a retry message instead of restoring
hidden seed photos. Successful photo/album saves notify open Photos windows;
other tabs refresh on focus or the storage event.

## Verification

No build, server, migration, or deployment is run by the coding agent. The
following checks run without starting a server or connecting to production:

```sh
CI=true node node_modules/react-scripts/scripts/test.js --watchAll=false --runInBand src/pages/MissionControl.test.jsx src/pages/Photos.test.jsx
node --test supabase/functions/admin-photo-library/index.test.cjs
```

The endpoint tests execute the TypeScript handler with mocked database/storage
clients, not a live Deno/Supabase runtime. Verify the real migration, policies and
uploads on the user-managed test deployment:

1. Sign in as admin and open Mission Control. Guests must remain locked out.
2. Create a draft post, edit it, publish it, and confirm the counts and blog update.
3. Create an album, add a photo, edit its caption/alt text, and change its order.
4. Hide the photo and verify that it disappears from Photos (including an open
   viewer), then republish it. Empty albums should not appear publicly.
5. Check that an anonymous photo query cannot return hidden rows or modify data.
6. Check a rejected password, failed upload and unavailable photo endpoint.
   Drafts should remain editable, and blog management should still work.
7. Check desktop resizing and the phone layout, keyboard focus, and saving after
   switching between dashboard sections.

## Main files

- Dashboard: `src/pages/MissionControl.jsx`, `src/pages/MissionControl.css`.
- Blog tools: `src/pages/Admin.jsx`, `src/pages/NewPost.jsx`, `src/lib/useAdminAccess.js`.
- Photo tools: `src/pages/AdminPhotos.jsx`, `src/lib/adminPhotoLibrary.js`.
- Public library: `src/data/photos.js`, `src/pages/Photos.jsx`, `src/pages/Photos.css`.
- Public blog refresh: `src/pages/Blog.jsx`.
- Routes and login copy: `src/App.jsx`, `src/components/AdminLogin.jsx`.
- Backend: the new migration, `admin-photo-library`, the blog duplicate-title check,
  and `supabase/config.toml`.
