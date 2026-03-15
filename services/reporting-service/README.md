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
- `GET /health`

## Events consume

- `shipment.created`
- `pickup.completed`
- `delivery.delivered`
- `delivery.failed`
- `ndr.created`
- `scan.inbound`
- `scan.outbound`

## Notes

- khong publish event
- projection hien tai la skeleton
- duplicate event duoc chan o muc projection ledger bang `AggregationJob`
