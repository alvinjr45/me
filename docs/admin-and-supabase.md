# Admin and Supabase

The admin system is a small publishing pipeline built on top of Supabase.

## Mission Control app

Mission Control opens from the desktop or mobile home screen at `/admin`. The
post editor remains at `/admin/new` (with an optional `slug` query parameter).
Both views now run inside the device shell. Switching to another desktop app
or minimizing Mission Control keeps an open post draft in place. Closing the
window unmounts it, so save work before closing it.

The desktop's shared admin login uses the existing `ADMIN_POST_SECRET` password.
`useAdminAccess` verifies it against the server's post-list endpoint and keeps the
verified session in memory. Mission Control consumes that shared session, so its
sections do not ask for separate logins. The edge functions authorize every read
and write independently.

The dashboard now has Overview, Blog posts, Photos, and Dog incident sections.
See [Mission Control setup and verification](mission-control.md) before enabling
the database-backed photo library.

## Flow

1. The admin page collects a shared secret.
2. The page calls the `admin-blog-post` edge function.
3. The edge function validates the secret against `ADMIN_POST_SECRET`.
4. If the request is valid, the function reads or writes `ajt3_blog_posts`.
5. If uploads are included, the function stores them in the `blog-media` bucket and writes public URLs into the post record.
6. The same function also stores the latest dog incident used by the home page widget.

## Browser Side

`src/pages/Admin.jsx` handles:

- unlocking the editor
- listing posts
- selecting a post to edit
- creating a new post
- building the request payload for save operations
- uploading cover images and additional media

The browser sends:

- JSON for list requests
- `FormData` for save requests

## Edge Function

`supabase/functions/admin-blog-post/index.ts` handles:

- CORS
- secret validation
- list requests
- incident list and save requests
- save requests
- file upload to Supabase Storage
- slug conflict checks
- post upserts
- deletion of the old slug when a title change creates a new slug

## Database Migration

`supabase/migrations/20260505000000_create_blog_posts.sql` sets up:

- the blog post table
- the dog incidents table used by the home page widget
- the `updated_at` trigger
- row-level security
- a public-read policy for published posts
- the public `blog-media` bucket
- a public-read storage policy for bucket objects

## Environment Variables

### Browser

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

If either browser variable is missing, the public site uses the local blog data fallback.

### Edge Function

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_POST_SECRET`
- `BLOG_MEDIA_BUCKET`
- `BLOG_MEDIA_PREFIX`
- `ADMIN_CORS_ORIGINS`
- `ADMIN_CORS_ORIGIN`

The edge function uses Supabase-provided credentials on the server side and does not require a manually stored service role key in the repo.

### Troubleshooting sign-in

`Load failed` or `Failed to fetch` means the browser could not read the login
response; it does not establish that the password was rejected. Check the
Network panel for the `admin-blog-post` OPTIONS and POST requests.

- Confirm `REACT_APP_SUPABASE_URL` points to the project where `admin-blog-post`
  is deployed.
- Set the function secret `ADMIN_CORS_ORIGINS` to a comma-separated list of the
  exact allowed site origins (scheme, hostname, and port, without a path or
  trailing slash). Localhost, a LAN IP, and a deployed domain are different
  origins. Include both `https://ajt3.me` and `https://www.ajt3.me` for the
  production site, and preserve other allowed origins when adding either one.
- Confirm the OPTIONS response allows the browser's origin, POST method, and
  `authorization`, `apikey`, and `content-type` headers.
- A readable 401/403 response indicates rejected access; 404 indicates a missing
  endpoint, and 5xx requires checking function logs and server configuration.
- The password is the secret's value, not the literal text `ADMIN_POST_SECRET`.

AJ Thompson and Guest are separate, keyboard-selectable profile tiles. Selecting
Guest clears the password and login error without making an admin request.

## Storage Rules

The migration configures `blog-media` as a public bucket with file type limits for common image and video formats. The edge function writes uploads under a namespaced prefix and then stores the public URL in the post row.

Default storage path pattern:

```text
blog-media/ajt3/me/blog/{slug}/...
```

If `BLOG_MEDIA_PREFIX` is changed, the same slug-based structure is still used below that prefix.

## Publishing Notes

- Covers display best at 16:9.
- The admin page accepts either a cover upload or a remote cover URL.
- The admin page also edits the latest dog incident shown on the home page.
- Posts can be saved as published or draft.
- The public blog and dogs pages only show published posts.

## Failure Modes

- If the browser is not configured for Supabase, the admin page cannot unlock.
- If the shared secret is wrong, the edge function returns unauthorized.
- If a slug already exists, the save is rejected instead of silently overwriting another post.
- If uploads fail, the save fails rather than producing partial content.
