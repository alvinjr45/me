# Guestbook

Guestbook is available from the home screen and dock at `/guestbook`. It now
uses a Messages-style conversation list and a separate public group-chat board
for each conversation. Visitors can create a topic with its first message or
reply to an existing topic. Messages publish immediately after server-side checks;
there is no approval queue. Guest names are unverified and all conversations are public,
not private messages. Blue bubbles identify sends in the current app visit by
their returned message IDs, never by matching a display name.

The desktop layout has a searchable sidebar and a chat pane. Narrow app windows
and phones switch between the conversation list and chat, with a back button.
Drafts stay separate per conversation while the app is open. Closing/reloading
discards drafts. Latest messages refresh every 15 seconds while the document is
visible and the feed is at the bottom, plus on focus, manual refresh, and local
changes. This is polling, not realtime delivery or a read receipt. Older messages
load using timestamp/ID cursors and preserve scroll position.

Mission Control > Guestbook provides separate Messages and Conversations views,
hide/show for whole boards, per-message hide/show and confirmed permanent
deletion, pagination, and a global pause/resume switch. Hiding a board hides its
messages and previews and blocks new replies; it does not delete its contents.

## Participation gate and site policies

Signed-in administrators open conversations directly using the existing shared
admin session. Their sender name is fixed to `AJ`, followed by a red
`(Administrator)` label. The server validates `ADMIN_POST_SECRET` on each send,
forces the name, and stores a trusted `is_admin` flag. Guest-supplied names and
role fields cannot create the badge. Existing posts are not retroactively marked.
Administrators skip the guest declarations and Turnstile check; pause, rate,
duplicate, and content checks still apply. Signing out restores the guest entry
screen. Admin requests share a stable, keyed administrator counter identity.

For guests, opening Messages starts on a dedicated "Before you join" screen. It contains
the display name, age declaration, readable policies, terms agreement, and a
visible Cloudflare Turnstile check.
"Continue to messages" opens the conversation browser after those requirements
are met. There is no option to skip joining. Conversation fetching starts only
after completing the entry screen. Both declarations are grouped together below
the policy readers. "Change details" returns to the same full entry screen,
preserving conversation drafts. Closing and reopening the app shows entry again.

Continue exchanges a Turnstile token with the server for a signed, one-hour
posting session. The session stays in memory and is reused across conversations
and messages. No Cloudflare widget runs in the composer. After expiry,
"Change details" returns to entry while preserving drafts and lets the visitor
verify again. Changing details retains a valid bot session.
The server checks the signature, expiry, origin, and current terms on each post.
The signed session carries the original limiter identity so routing and network
changes neither invalidate verification nor reset that session's counters.
All existing attempt and publishing limits still apply. The signing
key is the existing hash secret, with a separate session-specific signing prefix.
Legacy frontends can still submit a fresh, single-use Turnstile token per post.
Local previews without a Turnstile site key cannot continue past entry.

Before any message or new conversation title can be entered, visitors must give
a nonblank display name and explicitly check two initially unchecked boxes:
they are at least 18, and they have read and agree to the Terms and Conditions.
Messages requires these declarations before showing the public boards. This
entry screen is not authentication or a restriction on public database reads.
The name and declarations
last only while this Guestbook app instance is open; they are not saved to
browser storage. Switching conversations retains them. "Change details" resets
both checkboxes and locks the composer while preserving unsent drafts.

The Terms and Conditions are in `src/data/guestbookTerms.js`; the Privacy Policy
is in `src/data/privacyPolicy.js`. Both use version `2026-09-25` and are available
at `/terms` and `/privacy`, in dropdowns before joining, and through links in
Settings > System. Policy links open a separate tab to
preserve guestbook drafts and declarations on phones as well as desktop.
The policy pages currently use the site's existing public Instagram contact.
Confirm the contact method and the deployed host's logging, backups, and any
additional tracking before publishing; those settings cannot be inferred from
this repository. No jurisdiction-specific governing-law clause is assumed.

Set `GUESTBOOK_TERMS_VERSION=2026-09-25` on the server when publishing this
frontend and the `guestbook` function together. Change the version whenever
the terms change. Missing server configuration closes posting; outdated or
missing client versions are rejected with a reload/re-accept message. This
participation change needs no additional database migration.

Every guest submission must carry `ageConfirmed: true`, `termsAccepted: true`, and the
current `termsVersion`, in addition to a valid name. Strict booleans are required;
strings such as `"true"` are rejected. Checks run in the Edge Function for both
replies and new boards before publishing. Public database writes remain denied.

This is **self-declared age and terms acknowledgment**, not independent age or
identity verification or proof that someone actually read the terms. No date of
birth, identity document, or durable consent audit record is collected. Name and
message storage remains unchanged. Do not describe the checkbox as verified age.

## Protection pipeline

1. Require JSON, an exact allowed browser origin, and a body of at most 12 KB.
2. Require the explicit 18+ and terms declarations for the published terms
   version, then record an attempt against shared database limits.
3. Reject the hidden spam field, invalid text, links/email addresses, and missing
   verification credentials. Names are limited to 40 characters and messages to 500.
   A new conversation requires an 80-character-max title; a reply requires an
   existing conversation ID. Providing both or neither is rejected.
4. Validate Turnstile at entry, including success, action `guestbook`, and an
   allowed hostname, before issuing the signed posting session. Every post must
   from a guest must present a valid session or a fresh Turnstile token from a legacy frontend.
   Invalid or expired verification never permits a post.
5. Normalize and scrub names, messages, and new conversation titles; matching
   words become `***`. Only the
   scrubbed text is stored. Render all content as React text, never HTML.
6. Atomically recheck pause, posting limits, duplicates, and conversation
   visibility, then publish. A new board and first message are created together;
   failed sends cannot leave an empty new board behind.

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
Quotas are shared across conversations; creating a board uses the same post
budget as a reply. The chat-like layout does not relax the existing spam limits.

## Setup (user-owned)

The guestbook Edge Function was updated through the Supabase dashboard on
September 25, 2026 to use `ajt3_guestbook_submit_v2` and enforce the current
participation requirements. A follow-up deployment added the `verify` action and
signed one-hour posting sessions. The older deployed function called the retired RPC,
whose `upgrade_required` response was incorrectly displayed as a posting limit.
Only an explicit `limited` result now produces a rate-limit response. A Vercel
frontend deployment does not deploy this Supabase function.

The administrator author migration and v3 function update were applied through
the Supabase dashboard on September 25, 2026. Frontend publishing remains
user-owned. The administrator label and entry bypass need that frontend update.

The session format was subsequently updated to carry its signed limiter identity
instead of comparing it to each request's forwarded network address. An audit
showed that consecutive requests had different network hashes. The redundant
upper expiry bound was also removed so slight clock skew between servers cannot
reject a newly issued session; the signed expiration time remains enforced.

On September 25, 2026, browser setup created the managed "AJT3 Guestbook"
Turnstile widget for `ajt3.me`, saved its private `TURNSTILE_SECRET_KEY` in the
AJT3 Supabase project, and saved `REACT_APP_TURNSTILE_SITE_KEY` in the Vercel
`me` project's **Production** environment. `GUESTBOOK_TERMS_VERSION=2026-09-25`
was also saved in Supabase. Existing guestbook origin, hostname, and hash-secret
settings were present. No private key is stored in this repository.
The database's `submissions_open` setting was verified as `false` and left paused
until the updated frontend is deployed and live submission checks are complete.

The live frontend still showed pending terms at the time of setup. A new
frontend build/deployment is required to include the policies, entry screen,
and public site key. Production keys are not configured for local preview
origins. Use a separate development widget if testing real submissions locally.
Frontend builds, repository operations, and server management remain user-owned.
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
   - `GUESTBOOK_TERMS_VERSION`: must match the version of the actual published
     terms in `src/data/guestbookTerms.js`: `2026-09-25` for this release.
   - Existing `ADMIN_POST_SECRET`: authenticates management and administrator posts;
     never included in guest requests.
   - Optional `GUESTBOOK_BLOCKED_WORDS`: extra comma-separated English words,
     letters only, 3-30 characters each. Core list is in `content.ts`.
3. Review pending migrations with `supabase db push --dry-run`, then apply through
   your normal database deployment workflow. The new migration is
   `supabase/migrations/20260925000000_create_guestbook.sql`, followed by
   `supabase/migrations/20260927000000_guestbook_conversations.sql`. The second
   migration preserves existing entries under "The Guestbook" and keeps the
   current paused/open setting. It adds the conversation foreign key, parent-aware
   RLS, and an invoker-security preview view (requires PostgreSQL 15+).
   `supabase/migrations/20260928000000_guestbook_admin_author.sql` adds the public
   author flag and a service-role-only v3 publishing wrapper that preserves the
   v2 limits and atomically marks authenticated administrator posts. Apply it
   before deploying the updated function and frontend.
   If the board is live, pause submissions during migration/deployment. The old
   RPC is retained but denies legacy posts lacking a conversation; deploy the
   updated function and frontend together before resuming. Do not reapply the
   original migration to an existing database.
4. Deploy `supabase functions deploy guestbook`. `supabase/config.toml` disables
   JWT verification for this public endpoint; admin actions still require the
   server-checked admin secret, and publication always requires Turnstile.
5. Run your normal frontend build/deployment with the new site key.
6. Verify the checklist below in a non-production environment, resolve
   any admin login issues, then use Mission Control > Guestbook > Resume
   submissions. Having policies in source does not enable a paused database.

## Required live verification

- Open `/terms` and `/privacy` directly and from the guestbook on desktop and
  phone. Verify both policies can be read before checking any boxes, and that
  opening their separate tabs preserves an unsent guestbook draft. Verify
  a name plus both declarations are needed before typing. Check whitespace-only
  names, unchecked boxes, missing/false/string-valued declarations, and old terms
  versions on both reply and new-board requests. Changing details or reloading
  must require fresh declarations, and no age/date-of-birth data may be exposed.
- Confirm allowed origins pass OPTIONS and other origins do not. CORS is not
  authentication: callers outside browsers can supply any Origin header.
- Verify the deployed Supabase gateway supplies the client address as the final
  `X-Forwarded-For` value. The handler ignores client-controlled prefixes and
  canonicalizes this final address. Test from two networks and with spoofed
  prefixes; the same client must retain the same bucket, different clients must
  get different buckets. Do not enable posting if this proxy trust assumption
  fails; adapt the trusted ingress first. Missing/invalid addresses fail closed.
- Verify real Turnstile passes only with the configured hostname and action.
  Verify multiple messages reuse one session, and tampered/expired sessions fail.
  Attempt direct requests with no session/token, reused Cloudflare tokens, wrong hosts/actions, a
  filled honeypot, links, long bodies, and offline verification: none may publish.
- Check concurrent submissions from the same network: at most one new post per
  minute, five per rolling day. Check global caps and duplicate rejection.
- With the public API key, verify direct INSERT/UPDATE/DELETE and publishing RPC
  calls fail. SELECT must not expose hidden messages or private limit/settings
  tables. Repeat for an authenticated non-admin role if you introduce Auth.
- Verify hidden/show changes update the public board, deletion asks confirmation,
  and pause blocks writes even after a challenge has been completed.
- Create two boards and reply to each. Verify no cross-board messages, drafts,
  late network responses, or pagination results appear in the wrong chat. Check
  title filtering, failed first-message rollback, hidden/nonexistent-board reply
  rejection, and new boards counting toward the same spam quota.
- With the public API key, query both the conversation preview view and message
  table after hiding a board or message: no hidden text may appear. The view uses
  `security_invoker = true` so it obeys the underlying RLS. Verify this on the
  deployed PostgreSQL version, including grants for the added conversation column.
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
[Supabase RLS and invoker-security views](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Turnstile interaction-only appearance](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/).

Policy references: [Cloudflare Turnstile Privacy Addendum](https://www.cloudflare.com/turnstile-privacy-policy/)
and [FTC consumer privacy guidance](https://www.ftc.gov/business-guidance/privacy-security/consumer-privacy).
