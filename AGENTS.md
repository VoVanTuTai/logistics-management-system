
## Project context

This is a ReactJS logistics/merchant frontend.

The redesign reference is located at:

/design-reference/stitch_nexus_merchant_dashboard_redesign

Additional instructions are in:

/design-reference/merchant-redesign-brief.md

## Hard constraints

When implementing the merchant redesign:

- Do not change API calls.
- Do not change API service files unless explicitly asked.
- Do not change request payloads.
- Do not change response mapping.
- Do not change routes.
- Do not change auth, permissions, or role logic.
- Do not change order status logic.
- Do not change validation logic.
- Do not remove existing loading, empty, error, and success states.
- Do not rewrite the whole app.
- Do not introduce a new UI library unless explicitly approved.

## Allowed changes

You may change:

- JSX layout
- CSS / SCSS / Tailwind classes
- Presentational components
- Icons
- Typography
- Spacing
- Colors
- Tables
- Cards
- Buttons
- Empty states
- Loading skeletons
- Responsive layout

## Workflow

Before editing:
1. Inspect the current React app structure.
2. Inspect the design-reference folder.
3. Map each Stitch screen to current React page/component files.
4. Propose a small implementation plan.

When editing:
1. Work one screen at a time.
2. Keep diffs small.
3. Preserve existing business behavior.
4. Run lint/build/test commands if available.
## Current redesign handoff

Before continuing the merchant UI redesign, read:

`design-reference/codex-handoff.md`