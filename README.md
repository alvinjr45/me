# AJT3.me

AJT3.me is a dark, code-flavored personal site for A.J. Thompson. The public experience is split into a home page, a blog, a music page, a dogs page, an admin blog manager, and a 404 screen. The app uses a single React router, a shared footer, a scroll-to-top helper, and a Supabase-backed blog system with a local fallback data set for offline or unconfigured development.

## What lives on the site

- `/` Home landing page with animated glitch background and featured links
- `/blog` Blog index with a featured entry and archive cards
- `/blog/:slug` Long-form blog post reader with sections and optional media
- `/music` Playlist, artist, and songs embeds with scroll cues
- `/dogs` Dog-focused content page with a banner video and tag-filtered posts
- `/admin` Protected blog editor for managing Supabase posts and uploads
- `*` 404 page with the same visual language as the rest of the site

## Docs

- [Site map and page behavior](docs/site-map.md)
- [Content model and post data](docs/content-model.md)
- [Admin workflow and Supabase setup](docs/admin-and-supabase.md)
- [Design system and component notes](docs/design-system.md)
- [Legacy and unused files](docs/legacy-components.md)

## Runtime model

The blog system resolves content in this order:

1. If Supabase is configured in the browser, public blog pages read published posts from `ajt3_blog_posts`.
2. If Supabase is not configured, the app falls back to the local post data in `src/data/blogPosts.js`.
3. The admin page writes back through the `admin-blog-post` Supabase Edge Function, which checks a shared secret before listing or saving posts.

This means the public site can render with local content during development, while production can use Supabase as the source of truth.

## Local environment

Create a `.env.local` file with:

```bash
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-public-anon-key
```

If these values are missing, the blog pages use the local data set instead of Supabase.

## Supabase setup

The migration at `supabase/migrations/20260505000000_create_blog_posts.sql` creates:

- `public.ajt3_blog_posts`
- row-level security that exposes published posts to public clients
- a public `blog-media` storage bucket for uploaded post assets
- a public select policy for media objects in that bucket

The admin edge function lives at `supabase/functions/admin-blog-post/index.ts`. It supports:

- `list` requests for the admin panel
- `save` requests for creating or updating posts
- optional cover image uploads
- optional media uploads for images and videos

Deployment secrets used by the function:

- `ADMIN_POST_SECRET`
- `BLOG_MEDIA_PREFIX` `or` default path `ajt3/me/blog`
- `BLOG_MEDIA_BUCKET` `or` default bucket `blog-media`
- `ADMIN_CORS_ORIGINS` `or` `ADMIN_CORS_ORIGIN`

Important security note:

- The browser sends the shared admin secret to the edge function.
- The function validates that secret server-side before touching the database or storage.
- Public reads are limited to published posts by row-level security.

## Content conventions

- Blog posts use slugs generated from titles.
- Cover images are displayed as 16:9 crops in cards and post headers.
- Sections are stored as structured content with headings, paragraphs, and optional bullet lists.
- Media items can be images or videos and support captions plus optional video posters.
- The dogs section uses the `dogs` tag to filter posts from the main blog data.

## Verification

I did not run the app build or a browser server. The documentation and metadata updates were made by reading the source files directly.

