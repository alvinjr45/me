# Legacy and Unused Files

The repository still contains some older component files that are not wired into the current route tree.

## Unused Components

These files are present in `src/components` but are not imported by the active app code:

- `src/components/Button.jsx`
- `src/components/Button.css`
- `src/components/Cards.jsx`
- `src/components/Cards.css`
- `src/components/CardItem.jsx`
- `src/components/FullWidhtImg.jsx`
- `src/components/FullWidhtImg.css`
- `src/components/HeroSection.jsx`
- `src/components/MusicPlayerSlider.jsx`
- `src/components/VideoPlayer.jsx`
- `src/components/VideoPlayer.css`
- `src/components/text.jsx`
- `src/components/ex.html`

## Why This Matters

- These files are not part of the current site experience.
- They should be treated as legacy or experimental scaffolding unless they are explicitly wired back in.
- The active documentation in this repo focuses on the live route tree, blog content model, and Supabase publishing flow.

## Asset Notes

The `public/` and `src/assets/` directories contain the current site images and videos used by the live pages. The documentation elsewhere in this repo describes how those assets are consumed, but this file exists to prevent the legacy component set from being mistaken for the current UI.

