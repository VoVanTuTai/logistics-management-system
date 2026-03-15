# tracking-service

`tracking-service` la read model cho public/internal tracking.

## Scope

- dung `TimelineEvent` tu domain events
- dung `TrackingCurrent` tu projection cua domain events
- dung `TrackingIndex` de tra cuu nhanh theo `shipmentCode`
- expose API doc cho public/internal tracking

## Ownership

- day la `read model`, khong phai source of truth
- `shipment-service` van la canonical owner cua `current_status`
- `scan-service` van la source of truth cua `current_location`
- `tracking-service` chi dung lai current view tu events da consume

## APIs

- `GET /public/track/:shipmentCode`
- `GET /tracking/:shipmentCode/timeline`
- `GET /tracking/:shipmentCode/current`
- `GET /health`

## Events consume

- `shipment.*`
- `pickup.*`
- `task.*`
- `manifest.*`
- `scan.*`
- `delivery.*`
- `ndr.*`
- `return.*`

## Notes

- khong publish event
- khong co business logic write-side
- current view o day la projection skeleton, khong co ownership domain
