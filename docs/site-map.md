# Site Map

This site is a single-page React app with route-based views. The router is defined in `src/App.jsx` and always renders the shared footer below the page content.

## Routes

| Path | Component | Purpose | Data source |
| --- | --- | --- | --- |
| `/` | `src/pages/Home.jsx` | Landing page with glitch background and featured links | Static component data |
| `/blog` | `src/pages/Blog.jsx` | Blog index with featured post and archive grid | `src/data/blogPosts.js` or Supabase |
| `/blog/:slug` | `src/pages/BlogPost.jsx` | Full blog post reader | `src/data/blogPosts.js` or Supabase |
| `/music` | `src/pages/Music.jsx` | Playlist and music embeds with scroll-driven cues | Static component data |
| `/dogs` | `src/pages/Dogs.jsx` | Dog-focused page with a banner video and tag-filtered posts | `src/data/blogPosts.js` or Supabase |
| `/admin` | `src/pages/Admin.jsx` | Protected blog manager for creating and editing posts | Supabase edge function |
| `*` | `src/pages/NotFound.jsx` | 404 screen using the same visual language as the home page | Static component data |

## Page Behavior

### Home

- Shows the AJT3.me brand mark and a short intro about A.J.
- Renders three internal feature cards for blog, music, and dogs.
- Renders one external `build` widget linking to the main site URL.
- Uses the animated `LetterGlitch` background layer from `src/components/LetterGlitch.jsx`.

### Blog index

- Loads all posts, then removes any post tagged with `dogs`.
- Treats the first returned post as the featured entry.
- Renders the rest of the posts in an archive grid using `BlogPostCard`.
- Shows loading, ready, and error states without blocking the rest of the app.

### Blog post reader

- Pulls the slug from the route and fetches one post.
- Shows a loading shell first, then either the post or a fallback error/not-found message.
- Uses `BlogPostArticle` to render the hero, post sections, and optional media gallery.

### Music

- Contains three content blocks: playlists, artists, and songs.
- Uses button-controlled iframe switching rather than rendering all embeds at once.
- Uses scroll cues to guide the user down the page.
- Uses timers and intersection observers to stage the reveal animations.

### Dogs

- Shows a banner video first.
- Loads only posts tagged `dogs`.
- Reuses the blog card component so dog posts look like the rest of the blog archive.

### Admin

- Starts behind a secret gate.
- Loads existing posts from the edge function after successful unlock.
- Supports editing title, excerpt, eyebrow, publish date, tags, cover image, sections, and media.
- Can upload cover images plus image or video media, or accept remote URLs.

### 404

- Uses the same glitch backdrop pattern as the home page.
- Gives a simple link back to `/`.

## Shared UI Rules

- `ScrollToTop` resets the scroll position on route changes.
- `Footer` is rendered by `AppShell` on every route.
- The app uses `react-router-dom` for navigation instead of a nested layout system.

