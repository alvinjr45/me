# Admin and Supabase

The admin system is a small publishing pipeline built on top of Supabase.

## Flow

1. The admin page collects a shared secret.
2. The page calls the `admin-blog-post` edge function.
3. The edge function validates the secret against `ADMIN_POST_SECRET`.
4. If the request is valid, the function reads or writes `ajt3_blog_posts`.
5. If uploads are included, the function stores them in the `blog-media` bucket and writes public URLs into the post record.

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
- save requests
- file upload to Supabase Storage
- slug conflict checks
- post upserts
- deletion of the old slug when a title change creates a new slug

## Database Migration

`supabase/migrations/20260505000000_create_blog_posts.sql` sets up:

- the blog post table
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
- Posts can be saved as published or draft.
- The public blog and dogs pages only show published posts.

## Failure Modes

- If the browser is not configured for Supabase, the admin page cannot unlock.
- If the shared secret is wrong, the edge function returns unauthorized.
- If a slug already exists, the save is rejected instead of silently overwriting another post.
- If uploads fail, the save fails rather than producing partial content.

