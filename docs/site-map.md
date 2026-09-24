# Site Map

This site is a single-page React app with route-based views. The router is defined in `src/App.jsx`. Inner public routes render the shared navigation and footer; the home and admin routes use focused layouts.

## Routes

| Path | Component | Purpose | Data source |
| --- | --- | --- | --- |
| `/` | `src/pages/Home.jsx` | Personal-system home with interactive terminal and four pillars | Static component data and dog incident data |
| `/tech` | `src/pages/Tech.jsx` | Technical interests, focus areas, and external portfolio link | Static component data |
| `/blog` | `src/pages/Blog.jsx` | Blog index with featured post and archive grid | `src/data/blogPosts.js` or Supabase |
| `/blog/:slug` | `src/pages/BlogPost.jsx` | Full blog post reader | `src/data/blogPosts.js` or Supabase |
| `/music` | `src/pages/Music.jsx` | Tabbed Apple Music library for playlists, artists, and songs | Static component data |
| `/dogs` | `src/pages/Dogs.jsx` | Drake and Josh portraits, live incident monitor, and dog posts | `src/data/blogPosts.js`, dog incident data, or Supabase |
| `/admin` | `src/pages/Admin.jsx` | Protected blog manager for creating and editing posts | Supabase edge function |
| `*` | `src/pages/NotFound.jsx` | 404 screen using the same visual language as the home page | Static component data |

## Page Behavior

### Home

- Presents Tech, Music, Dogs, and Blog as interactive nodes on one animated signal ribbon.
- Includes a working command terminal that accepts navigation and utility commands.
- Reflows the horizontal desktop signal into a vertical mobile path and bottom-sheet terminal.

### Tech

- Introduces A.J.'s technical focus areas.
- Links to the external AJT3 website and relevant build notes.
- Uses the existing Tech Week photography as its primary visual.

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

- Organizes playlists, artists, and songs into one compact library interface.
- Keeps one Apple Music embed active at a time.
- Preserves a specific selection for each collection while visitors browse.

### Dogs

- Introduces Drake and Josh with their supplied portraits.
- Displays the current dog incident record when Supabase is configured.
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
- `SiteHeader` provides direct pillar links and opens the terminal from inner public routes.
- `Footer` is rendered by `AppShell` on inner public routes.
- The app uses `react-router-dom` for navigation instead of a nested layout system.
