# Design System and Active Components

The current visual identity combines a room-scale device scene with app-specific
interfaces. The shell carries the dark, code-inspired AJT3 identity; individual
apps borrow familiar desktop and phone patterns while retaining shared accents,
type, spacing, and interaction behavior.

## Global tokens

`src/index.css` defines the base tokens:

- `--color-main`: orange primary accent, configurable through Settings
- `--color-accent`: blue secondary accent, configurable through Settings
- `--color-background`, `--color-surface`, and `--color-surface-strong`
- `--color-line` and `--color-line-strong`
- `--color-text`, `--color-muted`, and `--color-muted-strong`
- `--font-sans` and `--font-mono`
- `--radius-sm`, `--radius-md`, and `--shadow-panel`

The default Signal palette is orange and blue. Settings also provides Ocean,
Mint, Violet, and Rose pairs. `DeviceShell` applies the selected values directly
to the simulated screen, so app styles that use the shared tokens update without
their own theme state.

Light appearance replaces the main background, surface, line, muted, and text
tokens inside the device. Apps with a deliberate fixed identity, such as Resume,
Mail, App Store, and parts of Music, use their own scoped variables.

## Typography and visual language

- Body and application text use the native `Inter`/Helvetica/Arial stack.
- Technical labels, paths, terminal output, and code-flavored annotations use
  `Source Code Pro` and system monospace fallbacks.
- The shell uses compact menu and dock UI, rounded app icons, dark glass/surface
  treatments, and restrained accent glows.
- Content apps use different native metaphors: Blogs resembles Notes, Guestbook
  resembles Messages, Photos resembles a camera library, and Calendar resembles
  a desktop calendar.
- The outer scene supports nine room/window environments while the device screen
  supports twenty wallpapers.

Avoid introducing another full visual system for shared shell controls. New apps
may establish a focused internal identity but should continue to use the shell's
spacing, accessibility, and responsive conventions.

## Layout layers

The visible product has four layers:

1. `SceneBackground` renders the room, window, desk, and themed landscape.
2. `DeviceShell` renders the monitor/phone hardware, system screens, wallpaper,
   menu/status bar, home screen, dock, and gestures.
3. `DeviceWindow` frames each desktop app or the current phone app.
4. Each page renders its own app workspace, generally using `.app-view` and
   `.app-scroll` from `src/components/AppWorkspace.css`.

The app root is fixed to the dynamic viewport. Scrollable content belongs inside
the active window/app rather than on the document body.

## Active shared components

### `DeviceShell`

The application frame and state owner. It provides windowing, phone lock/home
navigation, the dock, accounts, settings context, installation, redirect, and
system actions.

### `SceneBackground`

Renders desktop and mobile versions of Alpine Lake, Coastal Retreat, Desert
Sunset, Forest Cabin, City After Dark, Snowbound, Northern Lights, and Spring
Garden. Random resolves to one of those themes for the current visit.

### `PhoneBackGesture` and `PhoneHomeIndicator`

Provide edge-back and bottom-home interactions for the phone shell. App-local
back handlers take priority over route history.

### `CommandTerminal`

Implements site navigation, content lookup, settings, command completion,
history, and system actions. `src/data/terminalCommands.js` owns the command and
page definitions.

### `BlogPostArticle`

Renders direct and embedded article views with a hero, cover, structured
sections, image/video media, captions, and image enlargement. Embedded readers
receive an app-local Back action.

### Guestbook components

- `GuestbookParticipation` owns name, declarations, policy readers, and
  Turnstile verification.
- `GuestbookConversation` owns message pagination, polling, drafts, and posting.
- `GuestbookAuthor` renders the trusted administrator label.

### Photo and admin helpers

- `PhotoImage` selects responsive local derivatives where available and keeps
  remote URLs unchanged.
- `AdminProfile` and the admin page components are composed by Mission Control.

## Responsive model

The primary product breakpoint is `(max-width: 1024px), (max-height: 500px)`.
That breakpoint selects phone behavior, not merely compressed desktop styling.

Desktop:

- Multiple persistent windows can overlap.
- Apps commonly use two- or three-pane layouts.
- The menu bar and full dock remain available.
- Window size, not only browser size, drives many app-level responsive rules.

Phone:

- The monitor becomes phone hardware with safe areas and status elements.
- One app is visible at a time.
- Sidebars become list/detail navigation or compact toolbars.
- Home and back gestures replace desktop window controls.
- App content owns vertical scrolling inside the available screen.

Short landscape viewports use a side-positioned phone and separate scene sizing.
iOS non-standalone entry applies a decorative scroll offset so browser chrome
does not obscure the phone.

## Motion and accessibility

- `prefers-reduced-motion: reduce` shortens global animations and smooth scroll.
- The Interface motion setting also disables shell and wallpaper motion.
- Window resize handles are keyboard operable and named by corner.
- Nested readers restore focus to their originating item where implemented.
- Covered, launching, or inactive surfaces use `inert` and `aria-hidden`.
- Dynamic loading, opening, and error states use status/alert semantics.
- Touch targets and layouts are specifically restyled for coarse pointers.

`src/index.css` removes the default `:focus` outline. Every new interactive
control must therefore receive a clear app-appropriate `:focus-visible` style;
do not rely on color alone for selected, error, or published states.

## Styling ownership

- Global foundations: `src/index.css` and `src/App.css`
- Device and window chrome: `src/components/DeviceShell.css`
- Shared app workspace rules: `src/components/AppWorkspace.css`
- Room/landscape scene: `src/components/SceneBackground.css`
- App-specific UI: the CSS file beside each page/component

Keep app-specific rules in the existing page stylesheet. Reuse shared tokens and
context before adding global selectors or new dependencies.
