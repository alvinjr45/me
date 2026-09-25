export const privacyPolicy = {
  version: '2026-09-25',
  content: `1. Who operates this site
AJT3 is AJ Thompson's personal website. This policy explains the information used to display the site, remember your preferences, and operate its public guestbook. Contact AJ Thompson using the contact method linked on this page for privacy questions or requests.

2. Information you submit
The guestbook receives your display name, conversation title or selected conversation, message, age confirmation, acceptance of the terms, terms version, and a bot-verification token. Published names, titles, messages, identifiers, and timestamps are stored in Supabase. Only the text remaining after filtering is saved in the guestbook database. The original submission is still processed by the service to validate and filter it.
Your age confirmation is a self-declaration. The guestbook does not ask for a date of birth, identity document, email address, or visitor account. Age and terms declarations are checked for each submission but are not saved as a separate, durable consent record.

3. Public information
Published display names, titles, messages, and timestamps are publicly accessible. Anyone may copy them, and they may appear in search results. Hidden messages remain available to the site administrator until deleted. Avoid sharing personal or sensitive information, including information about someone else.

4. Security and technical information
The guestbook processes a network address to enforce spam limits. It stores a keyed hash of that address and a keyed hash of filtered message content, along with attempt or posting times. These private records help limit repeated submissions and detect duplicates; raw network addresses are not stored in the guestbook tables. Hashing does not make these records anonymous.
The website host and service providers may separately process network addresses, browser information, request details, and operational logs to deliver and protect their services. Their logging and backup retention are separate from the guestbook's database cleanup.

5. Cloudflare Turnstile and Supabase
Supabase provides the database and server functions used by the guestbook and other site features. Cloudflare Turnstile provides bot verification when the posting form is available after joining. Cloudflare processes technical signals such as a network address, browser headers, and the site origin to detect bots and improve its detection service. The guestbook server also verifies the challenge token with Cloudflare. Links to these providers' privacy notices appear below.

6. Browser storage and embedded content
The site uses local browser storage for features such as appearance and wallpaper preferences, photo favorites, and App Store selections. You can clear these through your browser's site-data controls; doing so resets saved preferences. Guestbook drafts, your chosen name, and participation declarations stay in the open guestbook's memory and are discarded when it closes or the page reloads.
Music players, artwork, and other external content can connect to third-party services, including Apple Music, when loaded. Those services receive connection information and may use cookies or other storage according to their own policies. External links take you to services with their own privacy practices.

7. Why information is used and shared
Information is used to publish conversations, remember choices, respond to requests, operate the site, and prevent abuse. Public posts are shared with visitors. Service providers process information needed to deliver hosting, storage, and security. Information may also be disclosed when legally required or reasonably necessary to investigate abuse or protect people's rights and safety. The guestbook does not use submissions or security hashes for advertising or sell them.

8. Retention and deletion
Guestbook posts and conversations have no automatic expiry and remain until removed by the administrator. Security and duplicate-detection records older than 24 hours are deleted on the next submission attempt; they can remain longer during inactivity. Provider logs and backups may persist under their separate retention settings. Clearing browser storage does not delete a published message. Removal from this site cannot erase copies held independently by visitors or search engines.

9. Your choices and requests
You can read the guestbook without posting, use a nickname, avoid submitting personal information, and clear saved browser preferences. Contact AJ Thompson privately to ask about access, correction, or deletion of information, or to report a post. Include enough context to locate the relevant content, such as its conversation title, display name, message, and approximate time. Names are unverified, so additional context may be needed before acting on a request.
Depending on the law that applies to you, you may have rights to access, correct, delete, or obtain a copy of personal information, restrict or object to processing, and complain to a data-protection authority. Requests will be handled subject to applicable law and any lawful retention obligations.

10. Children and international services
Posting is limited to adults aged 18 and over. If you believe a child has submitted personal information, contact AJ Thompson so it can be reviewed and removed as appropriate. Service providers may process information in countries other than yours. No online service can guarantee complete security.

11. Policy updates
The version date identifies this policy's latest revision. Changes to site features or information practices will be reflected here. Review this policy before submitting information.`
};
