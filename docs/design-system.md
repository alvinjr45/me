# Design System and Components

The site uses a small, consistent visual language:

- dark background surfaces
- orange primary accent
- blue secondary accent
- code-inspired typography and labels
- thin rule-based panels with restrained glow
- wide editorial layouts with intentional mobile compositions

## Global Tokens

Defined in `src/index.css`:

- `--color-main` for the orange accent
- `--color-accent` for the blue accent
- `--color-background` for the page background
- `--color-surface` for elevated surfaces
- `--color-line` and `--color-line-strong` for interface rules
- `--color-text` for primary text
- `--color-muted` for secondary text

## Typography

- Body text uses the native sans-serif stack defined by `--font-sans`.
- Code-flavored headings and technical labels often use `Source Code Pro`.
- Main headings use oversized, tightly spaced sans-serif type; utility labels use the mono stack.

## Shared Layout Rules

- The app root keeps a full-height dark canvas.
- Interactive elements keep a visible focus ring.
- Most buttons and links are sized for touch targets.
- Cards and surfaces use crisp borders, mostly square geometry, and low-opacity gradients.

## Active Components

### `SiteHeader`

- Provides persistent access to the four pillars.
- Opens the site terminal from a button or the backtick key.
- Collapses into a deliberate two-column menu on mobile.

### `CommandTerminal`

- Runs real commands such as `ls`, `whoami`, `open music`, and `cd /dogs`.
- Navigates through React Router without reloading the page.
- Appears inline on home and in a modal from other public routes.

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

### `Footer`

Rendered on every public route.

- Shows the site name
- Includes a short signoff line
- Displays the current year

### `ScrollToTop`

Runs on route changes and smooth-scrolls the viewport back to the top.

## Page Styling Notes

- Home uses a responsive luminous signal ribbon with interactive pillar nodes and a working terminal.
- Blog pages use an editorial archive layout with system-status details.
- Music uses a focused console with collection tabs and one active player.
- Admin uses stacked cards and form panels so content editing stays readable on smaller screens.
- Dogs pairs editorial portraits with the live incident monitor and field notes.

## Responsive Behavior

- Home's split hero stacks before tablet widths and the pillar grid becomes a single column on mobile.
- Blog archive cards collapse to one column on narrower screens.
- The blog post article media grid collapses to one column below tablet widths.
- Music moves its sidebar above the player and reduces the iframe height on phones.
- Admin form rows collapse to single-column sections on mobile.
