# reporting-service

`reporting-service` la read model cho KPI va dashboard.

## Scope

- projection domain events thanh KPI daily/monthly
- aggregate theo courier/hub/zone khi event payload co dimension tuong ung
- expose API doc cho report va ops dashboard

## Ownership

- day la `read model`, khong phai source of truth
- khong chua business logic write flow
- khong phat sinh nghiep vu moi tu reporting-service

## APIs

- `GET /reports/daily`
- `GET /reports/monthly`
- `GET /reports/ops-dashboard`
- `GET /reports/courier`
- `GET /reports/hub`
- `GET /reports/shipment-status`
- `GET /health`

## Events consume

- `shipment.created`
- `shipment.updated`
- `shipment.cancelled`
- `pickup.completed`
- `task.assigned`
- `task.reassigned`
- `manifest.sealed`
- `manifest.received`
- `scan.pickup_confirmed`
- `delivery.delivered`
- `delivery.failed`
- `ndr.created`
- `return.started`
- `return.completed`
- `scan.inbound`
- `scan.outbound`

## Notes

- khong publish event
- projection cap nhat KPI daily/monthly + shipment current status summary
- duplicate event duoc chan o muc projection ledger bang `AggregationJob`
