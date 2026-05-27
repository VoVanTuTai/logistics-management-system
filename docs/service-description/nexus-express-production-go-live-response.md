# Phản Hồi Go-Live Production - Nexus Express -> dt-commerce

> Ngày phản hồi: 2026-05-26
> Từ: Nexus Express - Đội ngũ Kỹ thuật Tích hợp
> Đến: dt-commerce - Đội ngũ Kỹ thuật
> Mục tiêu: Chốt adapter `/merchant/integrations/*` để dt-commerce bật outbound production

Chào team dt-commerce,

Nexus đã bổ sung adapter `/merchant/integrations/*` theo contract đã thống nhất. Sau khi deploy bản gateway mới lên production và cấu hình credential/marketplace merchant, dt-commerce có thể bật outbound giao hàng production với `autoCreatePickup=true`.

## 1. Endpoint Adapter

Các endpoint sau đã được implement trong `gateway-bff`:

```text
GET  /merchant/integrations/health
POST /merchant/integrations/orders
GET  /merchant/integrations/orders/{platform}/{shopId}/{externalOrderId}
POST /merchant/integrations/orders/{platform}/{shopId}/{externalOrderId}/cancel
GET  /merchant/integrations/shipments/{shipmentCode}/tracking
GET  /merchant/integrations/shipments/{shipmentCode}/label?format=A6
```

Trạng thái production:

```text
Endpoint adapter: đã implement, chờ deploy gateway-bff bản mới lên production
Base URL production: https://ops.nexus-ex.site
Whitelist IP 103.179.172.220: không yêu cầu ở tầng application hiện tại
```

## 2. Authentication / Signature

Adapter yêu cầu các header production:

```text
X-Nexus-Partner-Code: DT_COMMERCE
X-Nexus-Api-Key: <PROD_NEXUS_API_KEY>
X-Nexus-Timestamp: <ISO-8601>
X-Nexus-Nonce: <unique nonce>
X-Nexus-Signature: <HMAC-SHA256 hex lowercase>
Idempotency-Key: DT_COMMERCE:{shopId}:{externalOrderId}
```

Cách ký request:

```text
signature = HMAC_SHA256(
  PROD_NEXUS_API_SECRET,
  METHOD + "\n" +
  PATH + "\n" +
  X-Nexus-Timestamp + "\n" +
  X-Nexus-Nonce + "\n" +
  SHA256(raw_request_body)
)
```

Quy tắc:

```text
Timestamp lệch tối đa: 5 phút
Nonce không được dùng lại trong TTL 24 giờ
Signature output: hex lowercase
```

## 3. Credential Production

Partner code production:

```text
PROD_NEXUS_PARTNER_CODE=DT_COMMERCE
```

Credential cần cấp qua kênh bảo mật riêng:

```text
PROD_NEXUS_API_KEY=<gui_qua_kenh_bao_mat>
PROD_NEXUS_API_SECRET=<gui_qua_kenh_bao_mat>
PROD_NEXUS_WEBHOOK_SECRET=<gui_qua_kenh_bao_mat>
```

Không gửi `PROD_NEXUS_API_SECRET` và `PROD_NEXUS_WEBHOOK_SECRET` qua email/ticket/chat công khai.

## 4. Marketplace Merchant Production

Mô hình production mới của dt-commerce:

```text
merchant.merchantId: 41100000
merchant.shopName: DT Commerce Marketplace
external.shopId: sellerId/shopId của dt-commerce, chỉ dùng để đối soát và idempotency
sender.*: địa chỉ lấy hàng động theo hồ sơ seller/don hang
```

Gateway production có thể cấu hình tường minh:

```text
NEXUS_INTEGRATION_MARKETPLACE_MERCHANT_ID=41100000
```

Chốt mô hình:

```text
Một merchantId cố định được phép tạo vận đơn với nhiều sender pickup address khác nhau theo từng đơn.
external.shopId không cần mapping thành Nexus merchant riêng.
Nếu routing tự suy theo sender.province/sender.ward thì sender.hubCode không bắt buộc.
Nếu production bắt buộc sender.hubCode, hai bên cần chốt provinceCode -> hubCode mapping.
```

## 5. Tạo Giao Hàng Thật

Adapter đã hỗ trợ:

```text
options.autoCreatePickup=true
```

Khi request tạo vận đơn thành công và `autoCreatePickup=true`, adapter tự gọi service nội bộ để tạo pickup thật. dt-commerce không cần gọi thêm:

```text
POST /merchant/pickup/pickups
```

Default production:

```text
service.serviceType = STANDARD
service.pickupType = PICKUP
payment.payer = RECEIVER
COD order: codAmount = order.totalAmount
COD order: codIncludesShippingFee = true
ONLINE order: codAmount = 0
Default parcel khi sản phẩm chưa có cân nặng/kích thước:
  weightGram = 500
  lengthCm = 20
  widthCm = 15
  heightCm = 10
```

Định dạng địa chỉ:

```text
receiver.ward / receiver.district / receiver.province: chấp nhận tên text tiếng Việt.
Mã địa giới/mã Nexus: chưa bắt buộc trong adapter hiện tại.
```

## 6. Idempotency

Adapter dùng `Idempotency-Key` để tạo mã vận đơn deterministic.

```text
Idempotency-Key: DT_COMMERCE:{shopId}:{externalOrderId}
```

Nếu dt-commerce retry cùng key, adapter trả lại cùng `shipmentCode`. Nếu không gửi header, adapter tự dùng:

```text
{platform}:{shopId}:{externalOrderId}
```

## 7. Webhook Production

Webhook dt-commerce cần đăng ký:

```text
POST https://api.dt-commerce.site/api/v1/shipments/webhooks/nexus
```

Contract webhook giữ theo thống nhất:

```text
X-Nexus-Partner-Code: DT_COMMERCE
X-Nexus-Timestamp: <RFC3339 UTC timestamp>
X-Nexus-Nonce: <unique nonce>
X-Nexus-Event-Id: <event id>
X-Nexus-Signature: <HMAC-SHA256 hex lowercase>
X-Nexus-Event-Id phải bằng body.eventId
```

Cách ký webhook:

```text
canonical =
  "POST\n" +
  "/api/v1/shipments/webhooks/nexus\n" +
  X-Nexus-Timestamp + "\n" +
  X-Nexus-Nonce + "\n" +
  SHA256_HEX_LOWERCASE(raw_webhook_body)

signature = HMAC_SHA256(
  PROD_NEXUS_WEBHOOK_SECRET,
  canonical
)
```

Quy tắc ký:

```text
Không dùng full URL/domain trong signing string.
Không dùng X-Nexus-Event-Id thay nonce.
SHA256 body tính trên raw request body bytes đúng như payload gửi qua HTTP.
Header X-Nexus-Signature gửi lowercase hex trực tiếp.
```

Event production cần gửi:

```text
shipment.status_changed
shipment.delivered
shipment.cancelled
shipment.returned
shipment.delivery_failed
```

Trạng thái codebase:

```text
Webhook production sender: đã implement trong shipment-service
Webhook production runtime: chờ deploy shipment-service bản mới và set env production
```

## 8. Cấu Hình Gateway Production

Cần set env cho `gateway-bff`:

```text
NEXUS_INTEGRATION_AUTH_ENABLED=true
NEXUS_INTEGRATION_PARTNER_CODE=DT_COMMERCE
NEXUS_INTEGRATION_API_KEY=<PROD_NEXUS_API_KEY>
NEXUS_INTEGRATION_API_SECRET=<PROD_NEXUS_API_SECRET>
NEXUS_INTEGRATION_WEBHOOK_SECRET=<PROD_NEXUS_WEBHOOK_SECRET>
NEXUS_INTEGRATION_MARKETPLACE_MERCHANT_ID=41100000
NEXUS_INTEGRATION_TIMESTAMP_SKEW_MS=300000
NEXUS_INTEGRATION_NONCE_TTL_MS=86400000
OPS_PUBLIC_URL=https://ops.nexus-ex.site
PUBLIC_TRACKING_PUBLIC_URL=https://tracking.nexus-ex.site
```

Cần set env cho `shipment-service` để bật webhook sender:

```text
NEXUS_INTEGRATION_WEBHOOK_ENABLED=true
NEXUS_INTEGRATION_PARTNER_CODE=DT_COMMERCE
NEXUS_INTEGRATION_WEBHOOK_URL=https://api.dt-commerce.site/api/v1/shipments/webhooks/nexus
NEXUS_INTEGRATION_WEBHOOK_PATH=/api/v1/shipments/webhooks/nexus
NEXUS_INTEGRATION_WEBHOOK_SECRET=<PROD_NEXUS_WEBHOOK_SECRET>
NEXUS_INTEGRATION_WEBHOOK_MAX_ATTEMPTS=3
NEXUS_INTEGRATION_WEBHOOK_RETRY_DELAY_MS=1000
PUBLIC_TRACKING_PUBLIC_URL=https://tracking.nexus-ex.site
```

## 9. Chốt Cho dt-commerce

```text
Partner code production: DT_COMMERCE
Credential production đã gửi qua kênh bảo mật: chờ cấp qua kênh bảo mật

Base URL production: https://ops.nexus-ex.site
Whitelist IP 103.179.172.220: không yêu cầu ở tầng application hiện tại
Endpoint health: đã implement, chờ deploy production
Endpoint create order: đã implement, chờ deploy production
Endpoint query/cancel/tracking/label: đã implement, chờ deploy production

Marketplace merchantId production: 41100000
external.shopId dùng cho đối soát seller: xác nhận
sender pickup address động theo đơn: xác nhận

autoCreatePickup cho giao hàng thật: true
dt-commerce có cần gọi thêm API pickup không: không
Default service/pickup/payer/COD/parcel: xác nhận
Định dạng receiver ward/district/province: tên text tiếng Việt

Webhook production đã đăng ký: đã implement sender, chờ deploy production và set env webhook URL/secret
Webhook contract/signature không thay đổi: xác nhận
```

*Nexus Express - Integration Team*
