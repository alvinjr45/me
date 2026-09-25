# Guestbook

Guestbook is available from the home screen and dock at `/guestbook`.
Messages publish immediately after server-side checks; there is no approval
queue. Mission Control > Guestbook provides hide/show, confirmed permanent
deletion, pagination, and a global pause/resume switch.

## Protection pipeline

1. Require JSON, an exact allowed browser origin, and a body of at most 12 KB.
2. Record an attempt against shared, transaction-locked database limits.
3. Reject the hidden spam field, invalid text, links/email addresses, and missing
   challenge tokens. Names are limited to 40 characters and messages to 500.
4. Validate Turnstile on the server, including success, action `guestbook`, and
   an allowed hostname. Invalid, expired, replayed, or unavailable verification
   never permits a post.
5. Normalize and scrub both fields; matching words become `***`. Only the
   scrubbed text is stored. Render all content as React text, never HTML.
6. Atomically recheck pause, posting limits, and duplicates, then publish.

Default rolling limits (not calendar-day resets):

| Scope | Attempts | Published posts |
| --- | --- | --- |
| Network address | 5 / 10 minutes and 20 / 24 hours | 1 / minute and 5 / 24 hours |
| Whole board | 60 / minute and 1,000 / 24 hours | 100 / 24 hours |

Identical scrubbed, case-normalized messages are rejected across the board for
24 hours. Deleting a message does not erase its temporary duplicate/limit record.
Attempts are counted before bot verification, including unsuccessful challenges.
The security-definer RPC is callable only with the service role; public roles
cannot write messages, inspect counters/settings, read hidden messages, or invoke
the publishing RPC directly. RPC counters and inserts share an advisory lock.

## Setup (user-owned)

No migration, secret changes, deployment, server, or build has been run by Codex.
New installations start with submissions **paused** until setup is verified.

1. Create a Cloudflare Turnstile widget for your actual site hostnames. Keep
   production and development widgets separate. Do not use testing keys in
   production. Add `REACT_APP_TURNSTILE_SITE_KEY` to your frontend environment,
   alongside the existing Supabase URL and public key. The site key is public.
2. Configure these Supabase Edge Function secrets through your normal secret
   management workflow; never commit them or paste private values into chat:
   - `TURNSTILE_SECRET_KEY`: private Turnstile key.
   - `GUESTBOOK_HASH_SECRET`: independent, cryptographically random secret of at
     least 32 bytes for keyed network/content hashes. Keep stable across workers;
     rotating it resets effective per-network/duplicate tracking.
   - `GUESTBOOK_ORIGINS`: comma-separated exact origins, including scheme and any
     port, with no paths/trailing slashes. Wildcards are not accepted. Include
     your Mission Control origin as well as the public form origin.
   - `GUESTBOOK_HOSTNAMES`: comma-separated Turnstile-verified hostnames, without
     scheme, port, or path.
   - Existing `ADMIN_POST_SECRET`: used only for management requests, not visitors.
   - Optional `GUESTBOOK_BLOCKED_WORDS`: extra comma-separated English words,
     letters only, 3-30 characters each. Core list is in `content.ts`.
3. Review pending migrations with `supabase db push --dry-run`, then apply through
   your normal database deployment workflow. The new migration is
   `supabase/migrations/20260925000000_create_guestbook.sql`.
4. Deploy `supabase functions deploy guestbook`. `supabase/config.toml` disables
   JWT verification for this public endpoint; admin actions still require the
   server-checked admin secret, and publication always requires Turnstile.
5. Run your normal frontend build/deployment with the new site key.
6. Verify the checklist below in a non-production environment, resolve the
   existing admin login issue, then use Mission Control to resume submissions.

## Required live verification

- Confirm allowed origins pass OPTIONS and other origins do not. CORS is not
  authentication: callers outside browsers can supply any Origin header.
- Verify the deployed Supabase gateway supplies the client address as the final
  `X-Forwarded-For` value. The handler ignores client-controlled prefixes and
  canonicalizes this final address. Test from two networks and with spoofed
  prefixes; the same client must retain the same bucket, different clients must
  get different buckets. Do not enable posting if this proxy trust assumption
  fails; adapt the trusted ingress first. Missing/invalid addresses fail closed.
- Verify real Turnstile passes only with the configured hostname and action.
  Attempt direct requests with no token, reused tokens, wrong hosts/actions, a
  filled honeypot, links, long bodies, and offline verification: none may publish.
- Check concurrent submissions from the same network: at most one new post per
  minute, five per rolling day. Check global caps and duplicate rejection.
- With the public API key, verify direct INSERT/UPDATE/DELETE and publishing RPC
  calls fail. SELECT must not expose hidden messages or private limit/settings
  tables. Repeat for an authenticated non-admin role if you introduce Auth.
- Verify hidden/show changes update the public board, deletion asks confirmation,
  and pause blocks writes even after a challenge has been completed.
- Try normal words such as `classic` and `Scunthorpe`, mixed-case profanity,
  leetspeak, spaced/dotted spellings, and malicious HTML in both fields. HTML must
  remain literal text in public and admin views. Check phone widths and keyboard
  access, token expiry, blocked scripts, retry, and error preservation of drafts.

## Limits and privacy

The built-in filter targets common English profanity and selected slurs. It is
not an exhaustive dictionary, multilingual moderation, or a threat/harassment
detector. Accents, Unicode compatibility forms, repeated letters, basic
leetspeak, and separators are handled, but creative evasion remains possible.
Context-dependent words and names can be false positives. Update the word list
as needed and use hide/delete for anything that slips through. Scrubbing applies
to new submissions, not retroactively to existing rows when the list changes.

No raw IPs or unsanitized submissions are stored by this feature. Private
HMAC-based counters are pruned after 24 hours on the next submission attempt;
they can remain longer while the board is idle. If you need fixed retention,
schedule a daily database cleanup of `ajt3_guestbook_limits` records older than
24 hours through your existing scheduled-job mechanism. Hosting/platform logs
and Cloudflare have their own retention; review those settings separately.

Shared networks share quotas; IPv6 address rotation and distributed bots can
evade per-address caps. Global caps bound stored attempts/posts, but attackers
can exhaust those caps and prevent legitimate posts. Turnstile is not a promise
that every visitor is human. Function requests and public reads can still incur
usage even when rejected; monitor platform usage and add ingress-level abuse
protection if traffic warrants it. Do not treat application limits as DDoS or
billing protection.

## Local verification

The Node edge tests run a mocked Deno handler and the real profanity filter.
The SQL check inspects migration invariants; it does not execute PostgreSQL or
prove concurrent behavior/RLS. Frontend tests mock the backend and challenge API.
No tests start a server.

```sh
node --test supabase/functions/guestbook/index.test.cjs
CI=true node node_modules/react-scripts/scripts/test.js --watchAll=false --runInBand --silent src/pages/Guestbook.test.jsx src/components/GuestbookChallenge.test.jsx
```

References: [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/),
[explicit widget rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/),
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
