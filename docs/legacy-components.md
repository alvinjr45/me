# Legacy and Unused Files

The files below are not reachable from `src/index.js` through the current import
graph. They are not part of the live device shell, route tree, or Mission Control
UI. Treat them as legacy/experimental code unless they are deliberately restored
and tested.

## Unused components

- `src/components/AdminLogin.jsx`
- `src/components/BlogPostCard.jsx` and `BlogPostCard.css`
- `src/components/Button.jsx` and `Button.css`
- `src/components/CardItem.jsx`
- `src/components/Cards.jsx` and `Cards.css`
- `src/components/Footer.jsx` and `Footer.css`
- `src/components/FullWidhtImg.jsx` and `FullWidhtImg.css`
- `src/components/HeroSection.jsx`
- `src/components/HomeLink.jsx` and `HomeLink.css`
- `src/components/MusicPlayerSlider.jsx`
- `src/components/ScrollToTop.jsx`
- `src/components/SiteHeader.jsx` and `SiteHeader.css`
- `src/components/VideoPlayer.jsx` and `VideoPlayer.css`
- `src/components/VideoSection.jsx` and `VideoSection.css`
- `src/components/text.jsx`
- `src/components/ex.html`

`AdminLogin` was replaced by the Guest/AJ Thompson account chooser inside
`DeviceShell`. `SiteHeader`, `Footer`, `ScrollToTop`, and the old card/video
components belong to the pre-device-shell site structure. `BlogPostCard` was
replaced by the list/embedded-reader interfaces in Blog and Dog HQ.

Some legacy files contain stale paths or assumptions and should not be wired back
without review. For example, `HeroSection.jsx` imports `.Button`, and `Cards.jsx`
references routes/assets that are not part of the current app.

## Files that are active outside the production import graph

- `src/setupTests.js` is loaded by the Create React App test runner, not imported
  by `src/index.js`.
- `public/index.html`, `manifest.json`, icons, and `robots.txt` are consumed by
  the build/runtime rather than JavaScript imports.
- Supabase migrations, Edge Functions, and their Node tests are deployed or run
  independently of the browser bundle.
- Photo derivative filenames are assembled dynamically by
  `src/lib/photoImages.js`, so an asset search based only on literal imports will
  incorrectly label some `public/images/photos/` files as unused.

## Maintenance rule

When removing legacy code, verify whether its paired CSS and public media are
also unreferenced. Do not delete a public asset solely because it lacks a literal
JSX import: CSS URLs, manifest entries, dynamic paths, local data, migrations, or
external links may still depend on it.
