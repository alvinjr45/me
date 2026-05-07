# Design System and Components

The site uses a small, consistent visual language:

- dark background surfaces
- orange primary accent
- blue secondary accent
- code-inspired typography and labels
- translucent panels with subtle blur
- full-width, mobile-aware layouts

## Global Tokens

Defined in `src/index.css`:

- `--color-main` for the orange accent
- `--color-accent` for the blue accent
- `--color-background` for the page background
- `--color-surface` for elevated surfaces
- `--color-text` for primary text
- `--color-muted` for secondary text

## Typography

- Body text uses a sans-serif stack centered on `PT Sans`.
- Code-flavored headings and technical labels often use `Source Code Pro`.
- Main headings commonly use oversized, condensed spacing or monospace treatment depending on the page.

## Shared Layout Rules

- The app root keeps a full-height dark canvas.
- Interactive elements keep a visible focus ring.
- Most buttons and links are sized for touch targets.
- Cards and surfaces use rounded corners, borders, and low-opacity gradients instead of hard flat fills.

## Active Components

### `LetterGlitch`

Used on the home page and the 404 page.

- Draws an animated canvas of changing characters
- Accepts configurable colors, speed, and vignette options
- Resizes with the viewport

### `BlogPostCard`

Used on the blog index and the dogs page.

- Renders a linked cover image
- Shows eyebrow, title, date, excerpt, and a read link
- Can render as a featured card

### `BlogPostArticle`

Used for individual blog posts.

- Renders the hero block, cover image, sections, and media
- Supports mixed paragraph and bullet content
- Ends with a link back to `/blog`

### `VideoSection`

Used on the dogs page.

- Plays a looping muted video banner
- Shows a scroll cue that hides after the user scrolls far enough
- Scrolls the page to the next section when the cue is clicked

### `Footer`

Rendered on every route.

- Shows the site name
- Includes a short signoff line
- Displays the current year

### `ScrollToTop`

Runs on route changes and smooth-scrolls the viewport back to the top.

## Page Styling Notes

- Home and 404 pages use the `LetterGlitch` backdrop with different intensity settings.
- Blog pages lean on glass-like panels and a technical terminal card.
- Music uses the most motion-heavy layout, with staged reveals and multiple iframe states.
- Admin uses stacked cards and form panels so content editing stays readable on smaller screens.
- Dogs keeps the layout simple and gives the banner video most of the attention.

## Responsive Behavior

- Home cards collapse from four columns to two and then to a vertical stack.
- Blog archive cards collapse to one column on narrower screens.
- The blog post article media grid collapses to one column below tablet widths.
- Music reduces iframe height at smaller breakpoints so the embeds stay usable on phones.
- Admin form rows collapse to single-column sections on mobile.

