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
- consume event tu RabbitMQ exchange `domain.events`
- queue chinh: `tracking-service.q`
- retry queue: `tracking-service.retry.10s`, `tracking-service.retry.1m`
- dead-letter queue: `tracking-service.dlq`
- current view o day la projection read-model, khong co ownership domain
