# YouTube channel app

The YouTube app at `/youtube` displays the public `@ajt3-tech` channel through
YouTube Data API v3. No video list is maintained in the frontend. Opening the app
or using Refresh requests the current uploads. New videos require no site rebuild.

## One-time owner setup

1. Create or select a Google Cloud project and enable **YouTube Data API v3**.
2. Create an API key and restrict its API access to **YouTube Data API v3**.
   This key is used by a server function, so browser HTTP referrer restrictions
   do not apply. Apply an IP restriction only if your backend has fixed egress.
3. In the Supabase project's Edge Function secrets, set `YOUTUBE_API_KEY` to
   that key. Do not put it in a `REACT_APP_*` variable or source file.
4. Deploy the new function from this repository: `supabase functions deploy youtube-channel`.
   Its read endpoint verifies the existing Supabase anon JWT, as configured in
   `supabase/config.toml`. The frontend sends that key in the Authorization header.
5. Use the existing frontend `REACT_APP_SUPABASE_URL` and
   `REACT_APP_SUPABASE_ANON_KEY`, then build and deploy the frontend yourself.

Public channel reads require no YouTube account login or OAuth consent.
The Visit channel link remains available before the feed is configured.

## Behavior and limits

The function resolves the channel by handle using `channels.list`, fetches its
uploads playlist using `playlistItems.list`, and retrieves public video details
using `videos.list`. Each page contains up to 24 uploads. Deleted and nonpublic
videos are omitted; videos with embedding disabled link to YouTube.

Responses and channel metadata are cached for 10 minutes in each warm function
instance, with concurrent requests for the same page sharing a request. A new
function instance has a cold cache. This reduces quota use but is not a global
cache or abuse rate limit. Monitor API quota in Google Cloud; high traffic may
require a shared cache and rate limiting. Refresh can return a cached response.

Search filters loaded video titles; Load older videos extends the searchable
set. Playback uses YouTube's privacy-enhanced embed and preserves its controls.
Comments, likes, and subscriptions happen on YouTube via the channel/video links.

## Verification

Run `node --test supabase/functions/youtube-channel/index.test.cjs` for mocked
function checks. After owner deployment, check the desktop window and phone app:
channel metadata, newest uploads, Load older videos, search, video playback,
fullscreen, back navigation, and retry after a failed request. Confirm that a
new public upload appears after reopening or refreshing once the cache expires.

API references:
- https://developers.google.com/youtube/v3/docs/channels/list
- https://developers.google.com/youtube/v3/docs/playlistItems/list
- https://developers.google.com/youtube/v3/docs/videos/list
