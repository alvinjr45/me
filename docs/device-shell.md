# Device Shell and UI Behavior

`src/components/DeviceShell.jsx` is the top-level product interface. It wraps
every route in a simulated device and provides shared navigation, account state,
settings, app installation, system controls, and responsive desktop/phone
behavior through `DeviceSettingsContext`.

## Routing model

`src/App.jsx` uses `MemoryRouter`, initialized from the browser's incoming path,
query, and hash. After mount, the browser history entry is replaced with `/`.
This lets direct links select an initial in-device app while keeping later app
navigation inside the simulation.

The shell maps known routes to app identities. Desktop navigation opens or
focuses one window per app. Phone navigation shows the active route as a single
full-screen app. Unknown routes use the generic Page window and render the 404
screen.

Mission Control is special: its component remains mounted while another desktop
app is active, which preserves open post, photo, and calendar editor state until
the Mission Control window is closed, the user signs out, or the page reloads.

## Desktop behavior

Desktop mode is used when the viewport is wider than 1024 pixels and taller than
500 pixels, unless Settings forces Mobile view.

- Each app has one window. Reopening it restores and focuses the existing window.
- Windows can be moved by their title bars and resized from four corner handles.
- Resize handles support arrow keys in 24-pixel steps.
- Title-bar controls close, minimize, and maximize/restore the window.
- Double-clicking a title bar toggles maximize.
- Window positions are clamped when the simulated screen changes size.
- Show desktop minimizes all windows without unmounting them.
- The dock marks open apps and magnifies around a fine pointer when motion is on.
- Right-clicking empty home-screen space opens Settings.
- Pressing backtick opens Terminal unless focus is in an editable control.

Window layout and open-app state last only for the current page session.

## Phone behavior

Phone mode is selected by the viewport media query or the Settings device-view
override. On real small viewports, the device opens on its lock screen.

- Swipe up or activate the unlock control to enter as Guest.
- Switch user opens the Guest/AJ Thompson account chooser.
- One app fills the device at a time; the home screen remains behind it.
- The bottom home gesture returns to the home screen.
- A left-edge back gesture follows app-local history or an app-provided back
  handler. Blog, Dogs, Music, Photos, Guestbook, and Settings register local back
  behavior for their nested panels.
- The phone dock contains Photos, Blog, Guestbook, and Calendar.
- Landscape phone layouts and iOS browser chrome receive dedicated safe-area and
  scene-entry handling.

## Accounts and system state

There are two local profiles:

- Guest opens public apps and cannot open Mission Control.
- AJ Thompson verifies `ADMIN_POST_SECRET` by listing posts through the
  `admin-blog-post` Edge Function.

The verified admin secret remains in React memory. It is cleared on logout,
restart, shutdown, or reload. The server checks the secret again for every admin
read or write; the UI session is not authorization by itself.

Settings and Terminal can invoke these simulated system actions:

- Logout closes apps and returns to the account screen.
- Restart closes apps, shows a short boot state, then returns to the account
  screen.
- Shut down closes apps and shows a power control. Power on boots to the account
  screen.

On desktop, the initial session starts as Guest. On phone, it starts locked.

## App registry and installation

`desktopApps` in `DeviceShell.jsx` is the source of truth for home icons, app
labels, dock entries, external destinations, and downloadability.

Built-in apps are always present. App Store offers four downloadable external
projects. Installation is a simulated in-memory progress sequence: the App Store
returns home, pages to the final app page, and increments progress to 100 percent.
Installed apps and partial downloads do not survive reloads. External projects
use a 2.5-second leaving-site screen with a Cancel action before
`window.location.assign`.

## Settings and persistence

Settings and Terminal read and update the same context values.

Persisted in `localStorage`:

- appearance: system, dark, or light
- device view: auto, mobile, or desktop
- accent palette
- wallpaper animation speed
- wallpaper brightness and color intensity
- 12/24-hour clock
- interface motion

Background scene and wallpaper selection intentionally reset to Random on each
page load. The resolved random choice stays stable for that visit until changed.
Available visual options are declared in `src/components/deviceSettings.js`.

## Terminal

Terminal can navigate, query public content, update settings, and run system
actions. The source of truth is `src/data/terminalCommands.js`.

Main command groups:

- Navigation: `ls`, `open`, `cd`, or a page name
- Content: `posts`, `read`, `playlists`, `listen`, `albums`, and `events`
- Settings: `get` and `set`
- Utilities: `whoami`, `pwd`, `date`, `history`, and `clear`
- System: `logout`, `restart`, and `shutdown`

The input supports Up/Down history and Tab completion. Commands that read blog,
photo, or calendar data use the same public data helpers as the graphical apps.

## Shared accessibility behavior

- App icons, window controls, resize handles, gestures, and major navigation
  controls have accessible names.
- Inactive desktop pages and covered phone surfaces are removed from interaction
  with `inert` and/or `aria-hidden`.
- Modal access errors trap keyboard focus and support Escape.
- Nested phone views return focus to the item that opened them where practical.
- The global reduced-motion media query collapses animations, and the in-app
  motion preference disables shell and wallpaper motion.
- The app keeps a 320-pixel minimum document width and uses viewport safe-area
  handling for the phone shell.

Visual focus treatment is defined by each active app and shell control. New
controls should include an explicit `:focus-visible` state because the global
stylesheet removes the browser's default `:focus` outline.
