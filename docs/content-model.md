# Content Model

The public blog content is intentionally simple: posts can come from Supabase or from the local fallback array in `src/data/blogPosts.js`. Both sources normalize into the same shape so the page components do not care where the content came from.

The home page also reads a separate single-row dog-incident record from Supabase when configured.

## Blog Post Shape

Current fields used by the app:

- `slug`
- `title`
- `eyebrow`
- `excerpt`
- `date` or `published_at`
- `image` or `cover_image_url`
- `imageAlt` or `cover_image_alt`
- `tags`
- `sections`
- `media`

## Local Fallback Data

`src/data/blogPosts.js` contains a built-in list of posts for local development and offline behavior.

Notes:

- `getBlogPosts()` returns Supabase posts when Supabase is configured and falls back to the local array otherwise.
- `getBlogPostBySlug(slug)` behaves the same way for single post lookups.
- `getBlogPostsByTag(tag)` filters the resolved post list by tag membership.
- Dog posts are identified by the `dogs` tag.

## Date Formatting

The data layer formats dates for display:

- ISO-like date strings are parsed as UTC dates.
- Arbitrary date strings are passed through `Date` parsing.
- If parsing fails, the original value is preserved.

That keeps the UI readable whether a post comes from the local fixtures or from Supabase.

## Section Structure

Each blog post section can contain:

- `heading`
- `paragraphs`
- `bullets`

The article renderer treats these as:

- a section heading
- zero or more paragraphs
- an optional bullet list

This allows posts to mix narrative text and quick lists without introducing a richer CMS schema.

## Media Structure

Post media items can contain:

- `type` set to `image` or `video`
- `src`
- `alt`
- `caption`
- `poster` for videos

The post article page renders:

- `<img>` for image media
- `<video controls>` for video media
- an optional `<figcaption>` for captions

## Supabase Schema Mapping

The migration creates `public.ajt3_blog_posts` with these fields:

- `slug`
- `title`
- `eyebrow`
- `excerpt`
- `published_at`
- `cover_image_url`
- `cover_image_alt`
- `tags`
- `sections`
- `media`
- `is_published`
- `created_at`
- `updated_at`

Important behavior:

- `slug` is the primary key.
- `published_at` is used to sort posts newest-first.
- `is_published` controls whether public clients can read the post.
- `updated_at` is maintained by a trigger.

The migration also creates `public.ajt3_dog_incidents` with these fields:

- `id`
- `culprit`
- `incident`
- `incident_at`
- `portrait_url`
- `portrait_alt`
- `updated_at`

Important behavior:

- The home page uses the row with `id = 'latest'`.
- The admin page updates that same row so the widget always shows the latest incident.

## Tagging Rules

- Tags are stored as a string array in Supabase.
- The admin UI accepts comma-separated tags and converts them to an array.
- The blog index hides posts tagged `dogs`.
- The dogs page only shows posts tagged `dogs`.

## Slug Rules

- Slugs are derived from the title by lowercasing, trimming, and replacing non-alphanumeric groups with hyphens.
- The admin panel previews the resulting URL while editing.
- If a title change would collide with an existing slug, the edge function rejects the save.
