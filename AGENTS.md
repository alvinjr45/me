# Agent Instructions

## Repository Control
- Do not run git commands in this repository.
- The user controls repository state, commits, branches, pushes, pulls, diffs, and all other git operations.
- If repository status or history is needed, ask the user to provide it instead of running git.

## Builds And Servers
- Do not run `npm run build`.
- Do not start, stop, or deploy test servers.
- The user will run the npm build and deploy any test servers.

## Working Style
- Keep edits scoped to the requested files and behavior.
- Preserve unrelated user changes.
- Explain changed files and any verification that can be done without git, builds, or servers.
- Prefer existing project patterns, naming, file structure, and styling conventions over introducing new abstractions.
- Do not perform broad refactors unless the user explicitly asks for them or they are required for the requested change.
- Ask before making destructive or large-scale changes.

## Code Standards
- Write clear, maintainable React code using functional components and existing local component patterns.
- Keep component state local unless shared state is clearly needed.
- Avoid adding dependencies unless the user explicitly approves them.
- Prefer simple data structures and readable JSX over clever abstractions.
- Keep comments sparse and useful. Do not add comments that restate obvious code.
- Maintain ASCII-only edits unless the file already uses non-ASCII content or the user specifically requests it.

## Styling And UI
- Use the existing CSS files and class naming style for page-specific styling.
- Preserve the site's visual identity: dark background, orange primary accent, blue secondary accent, and code-inspired tone.
- Mobile layouts should be designed intentionally, not treated as compressed desktop layouts.
- Ensure text does not overflow, overlap, or become unreadable at small viewport widths.
- Avoid excessive blur, heavy transparency, visual clutter, and nested card layouts.
- Prefer accessible contrast, predictable spacing, and stable dimensions for interactive controls.
- Keep desktop behavior intact when making mobile-only changes unless the user asks otherwise.

## Accessibility
- Use semantic HTML where practical.
- Preserve keyboard navigation and visible focus states.
- Links and buttons should have clear accessible names.
- Do not remove ARIA labels unless they are incorrect or replaced with better semantics.
- Avoid relying on color alone to communicate meaning.

## Verification
- Do not run git commands, `npm run build`, or dev/test server commands.
- When possible, run lightweight checks that do not build or start servers, such as reading files or inspecting syntax manually.
- If a change should be verified with a build, browser check, or deployed test server, tell the user exactly what to run or check.
- Report any verification that was not performed because it is reserved for the user.

## File Editing
- Use focused patches for manual edits.
- Do not rewrite whole files when a smaller change is sufficient.
- Do not edit generated files, build artifacts, dependency lockfiles, or environment files unless the user explicitly requests it.
- Keep secrets, tokens, API keys, and private configuration out of source files.

## Communication
- Be concise and specific about what changed.
- Mention affected files in the final response.
- Call out assumptions, risks, and user-owned verification steps clearly.
