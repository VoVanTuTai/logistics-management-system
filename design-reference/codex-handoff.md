# Codex Handoff: Merchant Stitch Redesign

## Project context

This is a ReactJS/Vite merchant frontend for Nexus Logistics.

Current structure:
- Most UI, screen switching, handlers, and merchant views are centralized in `src/main.tsx`.
- Shared styling is in `src/styles.css`.
- API/data logic is in `src/api.ts`.
- Types/view IDs are in `src/types.ts`.

Design reference folder:
`design-reference/stitch_nexus_merchant_dashboard_redesign`

Some screens have HTML + PNG. Some screens only have PNG.

## Design screens

- Login: `nexus_logistic_ng_nh_p`
- Dashboard / Overview: `nexus_logistic_dashboard_t_ng_quan`
- Create shipment: `nexus_logistic_t_o_n_h_ng`
- Shipment list: `nexus_logistic_danh_s_ch_n_h_ng_updated_sidebar`
- Shipment detail: `nexus_logistic_chi_ti_t_n_h_ng_updated_sidebar`
- Pickup request: `nexus_logistic_t_o_y_u_c_u_l_y_h_ng_updated_flow`
- Tracking lookup: `nexus_logistic_tra_c_u_v_n_n`
- Change delivery info request: `nexus_logistic_y_u_c_u_i_th_ng_tin_giao`
- Return request: `nexus_logistic_y_u_c_u_ho_n_h_ng`
- Print shipment: `nexus_logistic_in_v_n_n`
- Account: `nexus_logistic_t_i_kho_n`
- Notifications: `nexus_logistic_th_ng_b_o`
- System style: `nexus_logistics_system/DESIGN.md`
- Brief: `design-reference/merchant-redesign-brief.md`

## Current React mapping

Because the app is monolithic, these are branches in `src/main.tsx`:

- Login: unauthenticated branch around line 1719
- Dashboard: `activeView === 'dashboard'`
- Create shipment: `activeView === 'create-shipment'`
- Shipment list: `activeView === 'shipments'`
- Shipment detail: `activeView === 'shipment-detail'`
- Pickup request: `activeView === 'pickups'`
- Tracking lookup: `activeView === 'tracking'`
- Change delivery info request: `activeView === 'change-requests'`
- Return request: `activeView === 'returns'`
- Print shipment: `activeView === 'print'`
- Account: `activeView === 'account'`
- Notifications: `activeView === 'notifications'`

## Allowed files for UI redesign

Only edit:
- `src/main.tsx`
- `src/styles.css`

Do not edit:
- `src/api.ts`
- `src/types.ts`
- `src/shippingLabelPrint.ts`
- package/config files
- any API/service/store/router/auth/config files

If another file seems necessary, stop and explain why first.

## Hard constraints

This is a UI-only redesign.

Do not change:
- API calls
- request payloads
- response mapping
- authentication logic
- activeView values
- screen switching behavior
- shipment/order status logic
- form validation rules
- submit handlers
- filtering logic
- pagination logic
- cancel behavior
- print behavior
- tracking behavior
- pickup behavior
- return behavior
- change-request behavior
- loading/empty/error/success states

Do not rewrite the whole app.
Do not introduce a new UI library.

## Design goal

Make all merchant screens visually consistent with the Stitch design system first.

Not pixel-perfect yet.

Update visual system for:
- app shell
- sidebar
- topbar/header
- cards
- metric cards
- buttons
- forms
- inputs/selects/textareas
- tables
- status badges
- tabs
- empty states
- loading/error/success states
- responsive layout

Use HTML references as structure/style inspiration.
Use PNG-only references as visual guidance.
Preserve all current behavior.