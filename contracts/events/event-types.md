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
