# Domain Event Types (Slim Milestone Set)

Only the following events are published on `domain.events`.
Each event represents a business milestone in shipment lifecycle.

1. `shipment.created`
2. `pickup.requested`
3. `pickup.approved`
4. `task.assigned` (taskType=`PICKUP`)
5. `scan.pickup_confirmed`
6. `manifest.sealed`
7. `manifest.received`
8. `manifest.unsealed`
9. `scan.outbound`
10. `scan.inbound`
11. `task.assigned` (taskType=`DELIVERY`)
12. `delivery.attempted`
13. `delivery.delivered`
14. `delivery.failed`
15. `ndr.created`
16. `return.started`
17. `return.completed`

## Exception / Issue Variant

`ndr.created` is also used when courier reports a shipment issue from the mobile app.

Required payload fields for this variant:

- `ndrCase.status = PENDING_RESOLUTION`
- `ndrCase.issueType`
- `ndrCase.issueCategory`
- `ndrCase.reportedBy`
- `ndrCase.reportedHubCode`
- `ndrCase.attachments` when `issueCategory = PHYSICAL`

Consumers should treat this variant as `EXCEPTION`: tracking shows the customer-facing issue timeline, reporting updates issue KPI, and shipment-service locks the shipment until the issue is resolved.

## Removed Public Bus Events

The following are no longer published to avoid duplication/noise:

- `pickup.completed`
- `location.updated`
- `task.created`
- `shipment.updated`
- `pod.captured`
- `otp.sent`
- `otp.verified`
- `ndr.rescheduled`
- `manifest.created`
- `manifest.updated`
- `task.reassigned`
- `task.completed`
- `task.cancelled`
- `shipment.cancelled`
- `shipment.change_requested`
- `shipment.change_approved`
