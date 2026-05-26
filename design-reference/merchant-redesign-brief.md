# Merchant UI Redesign Brief

Use this folder as visual reference:

/design-reference/stitch_nexus_merchant_dashboard_redesign

Some screens have HTML code, some screens only have PNG images.

Goal:
Update the existing ReactJS merchant interface to visually match the Stitch design.

Important rules:
- Do not change API calls.
- Do not change request/response data mapping.
- Do not change routes.
- Do not change authentication or authorization logic.
- Do not change order status business logic.
- Do not change form validation rules.
- Do not rewrite the app.
- Only change layout, styling, presentational components, icons, spacing, typography, colors, empty/loading/error UI.

For screens that only have PNG:
- Use the PNG as visual reference.
- Recreate the layout using the existing React components and data.

For screens that have HTML:
- Use the HTML as reference for structure and style.
- Do not blindly paste HTML if it breaks the current React architecture.
- Convert only the useful visual structure into existing React components.

Implementation approach:
- Work screen by screen.
- Keep each diff small.
- Preserve all current functionality.
- After each screen, run lint/build if available.