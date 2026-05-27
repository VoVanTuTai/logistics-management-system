# Nexus Express - Thong Tin Phan Hoi Cho Doi Tac Tich Hop

Tai lieu nay la phan hoi cua Nexus Express cho cac thong tin doi tac can de tich hop API tao van don, huy van don, tracking, in label va webhook trang thai.

Luu y bao mat: API key va API secret that se duoc cap qua kenh bao mat rieng. Khong dua secret vao email, ticket cong khai hoac repository.

## 1. Credential Va Moi Truong

### Sandbox

```text
SANDBOX_NEXUS_BASE_URL=https://uat-api.nexus-ex.site
SANDBOX_NEXUS_PARTNER_CODE=<nexus_cap_rieng_cho_doi_tac>
SANDBOX_NEXUS_API_KEY=<cap_qua_kenh_bao_mat>
SANDBOX_NEXUS_API_SECRET=<cap_qua_kenh_bao_mat>
```

Neu domain UAT chua duoc kich hoat tai thoi diem test, Nexus se cung cap base URL tam thoi rieng.

### Production

```text
PROD_NEXUS_BASE_URL=https://ops.nexus-ex.site
PROD_NEXUS_PARTNER_CODE=<nexus_cap_rieng_cho_doi_tac>
PROD_NEXUS_API_KEY=<cap_qua_kenh_bao_mat>
PROD_NEXUS_API_SECRET=<cap_qua_kenh_bao_mat>
```

### IP whitelist

Sandbox:

```text
Can whitelist IP sandbox: Khong bat buoc trong phase test dau tien.
```

Production:

```text
Can whitelist IP production: Co, khuyen nghi bat buoc.
```

Doi tac gui danh sach IP theo format:

```text
environment,ip,description
sandbox,1.2.3.4,Sandbox outbound server
production,5.6.7.8,Production outbound server
production,5.6.7.9,Backup outbound server
```

Chap nhan ca IPv4 don le va CIDR, vi du:

```text
5.6.7.8
5.6.7.0/24
```

## 2. Mapping Seller/Shop Sang Merchant Nexus

Doi tac co the dung `sellerId` UUID hien tai lam `external.shopId`, voi dieu kien day la dinh danh on dinh va duy nhat cho tung shop.

Mapping chinh thuc theo format:

```csv
partner_code,shop_id,shop_name,merchant_id,sender_hub_code,active
<partner_code>,<seller_uuid>,<shop_name>,<nexus_merchant_id>,<hub_code>,true
```

Xac nhan:

1. Mot `sellerId` UUID ben doi tac mac dinh map voi mot `merchantId` Nexus rieng.
2. Neu seller chua co mapping, Nexus tra:

```http
404 MERCHANT_NOT_FOUND
```

3. Quy trinh onboard seller moi:
   - Doi tac gui danh sach seller/shop can ket noi.
   - Nexus tao hoac mapping merchant profile.
   - Nexus tra lai `merchantId`, `senderHubCode`, cau hinh dich vu va cau hinh COD.
   - Doi tac bat dau tao don cho seller do.

4. Phase dau chua bat buoc co API tra cuu mapping. Nexus se cung cap file mapping offline. Neu doi tac can API, endpoint de xuat:

```http
GET /merchant/integrations/shops/{platform}/{shopId}/mapping
```

Response mau:

```json
{
  "success": true,
  "data": {
    "platform": "PARTNER",
    "shopId": "550e8400-e29b-41d4-a716-446655440000",
    "shopName": "Cua hang A",
    "merchantId": "41100001",
    "senderHubCode": "HCM-001",
    "active": true
  }
}
```

## 3. Sender/Pickup Profile

### Field bat buoc

Sandbox toi thieu:

```text
sender.name       required
sender.phone      required
sender.address    required
sender.province   required
```

Production khuyen nghi/bat buoc:

```text
sender.name       required
sender.phone      required
sender.address    required
sender.ward       required
sender.district   required
sender.province   required
sender.hubCode    optional neu da co mapping shop -> hub
```

Xac nhan them:

1. `ward`, `district`, `province` gui text tieng Viet co dau hoac khong dau deu duoc.
2. Chua bat buoc ma hanh chinh trong phase dau. Neu doi tac co san ma hanh chinh, co the gui them:

```json
{
  "sender": {
    "province": "Ho Chi Minh",
    "district": "Quan 1",
    "ward": "Phuong Ben Nghe",
    "provinceCode": "79",
    "districtCode": "760",
    "wardCode": "26734"
  }
}
```

3. `hubCode` khong bat buoc neu Nexus da co mapping `shopId -> senderHubCode`.
4. Neu shop co nhieu kho lay hang, doi tac gui them `warehouseId` va thong tin kho trong `sender`:

```json
{
  "sender": {
    "warehouseId": "WH-HCM-001",
    "warehouseName": "Kho Quan 1",
    "name": "Cua hang A",
    "phone": "0909000000",
    "address": "86 Nguyen Hue",
    "ward": "Phuong Ben Nghe",
    "district": "Quan 1",
    "province": "Ho Chi Minh",
    "hubCode": "HCM-001"
  }
}
```

Nexus uu tien route theo:

```text
sender.hubCode -> mapping warehouseId/shopId -> auto route theo dia chi
```

## 4. Parcel Defaults Va Gioi Han

Nexus xac nhan chap nhan default sau trong sandbox va phase dau:

```text
weightGram=500
lengthCm=20
widthCm=15
heightCm=10
serviceType=STANDARD
pickupType=PICKUP
payment.payer=RECEIVER
```

Production khuyen nghi doi tac gui can nang/kich thuoc that neu co, de tinh phi, SLA va dieu phoi chinh xac.

Gioi han production de xuat:

```text
Max item/order=100
Max weightGram=30000
Max lengthCm=150
Max widthCm=150
Max heightCm=150
Max length+width+height=300
Max codAmount=50000000
Max declaredValue=100000000
```

Neu doi tac can nguong cao hon, hai ben chot rieng theo hop dong dich vu.

## 5. Payment/COD Rule

Xac nhan cach tinh `codAmount`:

1. Don da thanh toan online:

```text
codAmount = 0
```

2. Don COD nguoi nhan tra ca tien hang va phi ship:

```text
codAmount = totalAmount
```

3. Neu shipping fee do shop/san tra:

```text
codAmount = totalAmount - shippingFee
```

4. Nexus chap nhan field `codIncludesShippingFee` de lam ro cach tinh:

```json
{
  "payment": {
    "codAmount": 330000,
    "shippingFee": 30000,
    "payer": "RECEIVER",
    "codIncludesShippingFee": true
  }
}
```

Khuyen nghi:

- `declaredValue` = tong gia tri hang sau giam gia, khong bao gom phi ship.
- `codAmount` = so tien thuc te courier/Nexus can thu tu nguoi nhan.

## 6. Create Order Response Mapping

Xac nhan mapping doi tac du kien la dung:

```text
data.shipmentCode -> awb va trackingNumber
data.status=CREATED -> AWB_CREATED
data.trackingUrl -> shipment.metadata.nexus.trackingUrl
data.pickup.pickupCode -> shipment.metadata.nexus.pickupCode
data.label.url -> shipment.metadata.nexus.labelUrl
```

Tra loi chi tiet:

1. `shipmentCode` la ma van don chinh cua Nexus, dung lam AWB/tracking number.
2. `trackingUrl` khong het han.
3. `label.url` production nen co TTL. TTL mac dinh de xuat:

```text
24 gio
```

4. Neu label het han, endpoint lay label moi:

```http
GET /merchant/integrations/shipments/{shipmentCode}/label?format=A6
GET /merchant/integrations/shipments/{shipmentCode}/label.pdf?format=A6
```

Mac dinh khuyen nghi:

- Endpoint `.pdf` tra binary PDF.
- Endpoint khong co `.pdf` tra JSON chua signed URL.

## 7. Webhook Status

### Contract chinh thuc

```text
HTTP method: POST
Webhook path: doi tac cung cap, vi du /webhooks/nexus/shipment-status
Headers bat buoc:
  X-Nexus-Partner-Code
  X-Nexus-Timestamp
  X-Nexus-Nonce
  X-Nexus-Event-Id
  X-Nexus-Signature
  Content-Type: application/json
Signature algorithm: HMAC-SHA256 hex lowercase
Timeout: 10 seconds
```

String to sign:

```text
METHOD + "\n" +
PATH + "\n" +
X-Nexus-Timestamp + "\n" +
X-Nexus-Nonce + "\n" +
SHA256_HEX_LOWERCASE(raw_request_body)
```

Retry schedule:

```text
1m, 5m, 15m, 30m, 1h, 3h, 6h, 12h, 24h
```

Nexus retry khi:

```text
HTTP 5xx
Timeout
Network error
```

Nexus khong retry khi doi tac tra HTTP 2xx.

### Payload mau: shipment.status_changed

```json
{
  "eventId": "evt_01HYZP7A4N7YB9S3K5F9ZK8W2Q",
  "eventType": "shipment.status_changed",
  "occurredAt": "2026-05-26T15:10:00+07:00",
  "partnerCode": "PARTNER",
  "data": {
    "platform": "PARTNER",
    "shopId": "550e8400-e29b-41d4-a716-446655440000",
    "externalOrderId": "240526ABC",
    "shipmentCode": "SHP260526A1B2C3",
    "previousStatus": "TASK_ASSIGNED",
    "currentStatus": "PICKUP_COMPLETED",
    "partnerStatus": "PICKED_UP",
    "statusDescription": "Da lay hang thanh cong",
    "location": {
      "hubCode": "HCM-001",
      "hubName": "Ho Chi Minh Hub"
    },
    "reason": null,
    "trackingUrl": "https://tracking.nexus-ex.site/SHP260526A1B2C3"
  }
}
```

### Payload mau: shipment.delivered

```json
{
  "eventId": "evt_01HYZP8K2P6F0R9E4S2Q1N7M3A",
  "eventType": "shipment.delivered",
  "occurredAt": "2026-05-27T09:20:00+07:00",
  "partnerCode": "PARTNER",
  "data": {
    "platform": "PARTNER",
    "shopId": "550e8400-e29b-41d4-a716-446655440000",
    "externalOrderId": "240526ABC",
    "shipmentCode": "SHP260526A1B2C3",
    "currentStatus": "DELIVERED",
    "partnerStatus": "DELIVERED",
    "deliveredAt": "2026-05-27T09:20:00+07:00",
    "receiverName": "Nguyen Van A",
    "podUrl": "https://minio.nexus-ex.site/nexus-pod-images/pod/SHP260526A1B2C3.jpg"
  }
}
```

### Payload mau: shipment.cancelled

```json
{
  "eventId": "evt_01HYZP91Z2CANCELLED",
  "eventType": "shipment.cancelled",
  "occurredAt": "2026-05-26T11:00:00+07:00",
  "partnerCode": "PARTNER",
  "data": {
    "platform": "PARTNER",
    "shopId": "550e8400-e29b-41d4-a716-446655440000",
    "externalOrderId": "240526ABC",
    "shipmentCode": "SHP260526A1B2C3",
    "currentStatus": "CANCELLED",
    "partnerStatus": "CANCELLED",
    "reason": "CUSTOMER_CANCELLED"
  }
}
```

### Payload mau: shipment.returned

```json
{
  "eventId": "evt_01HYZP92RETURNED",
  "eventType": "shipment.returned",
  "occurredAt": "2026-05-28T16:30:00+07:00",
  "partnerCode": "PARTNER",
  "data": {
    "platform": "PARTNER",
    "shopId": "550e8400-e29b-41d4-a716-446655440000",
    "externalOrderId": "240526ABC",
    "shipmentCode": "SHP260526A1B2C3",
    "currentStatus": "RETURN_COMPLETED",
    "partnerStatus": "RETURNED",
    "reason": "CUSTOMER_REFUSED",
    "returnedAt": "2026-05-28T16:30:00+07:00"
  }
}
```

### Payload mau: shipment.delivery_failed

```json
{
  "eventId": "evt_01HYZP93FAILED",
  "eventType": "shipment.delivery_failed",
  "occurredAt": "2026-05-27T14:00:00+07:00",
  "partnerCode": "PARTNER",
  "data": {
    "platform": "PARTNER",
    "shopId": "550e8400-e29b-41d4-a716-446655440000",
    "externalOrderId": "240526ABC",
    "shipmentCode": "SHP260526A1B2C3",
    "currentStatus": "DELIVERY_FAILED",
    "partnerStatus": "FAILED",
    "reason": "CUSTOMER_NOT_HOME",
    "failedAt": "2026-05-27T14:00:00+07:00",
    "nextAction": "NDR_CREATED"
  }
}
```

### Mapping status Nexus -> partner status

| Nexus status | Partner status | Ghi chu |
| --- | --- | --- |
| `CREATED` | `AWB_CREATED` | Da tao van don. |
| `UPDATED` | `PENDING` | Don duoc cap nhat/cho xu ly. |
| `TASK_ASSIGNED` | `PENDING` | Phase dau map `PENDING`; neu doi tac can co the map pickup/delivery task sang `OUT_FOR_DELIVERY` theo event rieng. |
| `PICKUP_COMPLETED` | `PICKED_UP` | Da lay hang. |
| `MANIFEST_SEALED` | `IN_TRANSIT` | Da dong bang ke/chuyen tuyen. |
| `SEND_GOODS` | `IN_TRANSIT` | Dang gui hang. |
| `IN_TRANSIT` | `IN_TRANSIT` | Dang van chuyen. |
| `MANIFEST_RECEIVED` | `IN_TRANSIT` | Hub dich da nhan bang ke. |
| `MANIFEST_UNSEALED` | `IN_TRANSIT` | Hub dich da mo bang ke. |
| `SCAN_INBOUND` | `IN_TRANSIT` | Nhap hub/kho. |
| `SCAN_OUTBOUND` | `IN_TRANSIT` | Xuat hub/kho. |
| `INVENTORY_CHECK` | `IN_TRANSIT` | Dang kiem kho/xu ly ton. |
| `DELIVERED` | `DELIVERED` | Giao thanh cong. |
| `DELIVERY_FAILED` | `FAILED` | Giao that bai. |
| `NDR_CREATED` | `FAILED` | Da tao xu ly giao that bai. |
| `EXCEPTION` | `FAILED` | Su co bat thuong. |
| `RETURN_STARTED` | `RETURNED` | Bat dau hoan hang. |
| `RETURN_COMPLETED` | `RETURNED` | Hoan hang thanh cong. |
| `CANCELLED` | `CANCELLED` | Da huy. |

## 8. Cancel, Tracking Va Label API

Nexus xac nhan cac endpoint production de xuat:

```http
POST /merchant/integrations/orders/{platform}/{shopId}/{externalOrderId}/cancel
GET /merchant/integrations/orders/{platform}/{shopId}/{externalOrderId}
GET /merchant/integrations/shipments/{shipmentCode}/tracking
GET /merchant/integrations/shipments/{shipmentCode}/label?format=A6
GET /merchant/integrations/shipments/{shipmentCode}/label.pdf?format=A6
```

Can xac nhan:

1. Trang thai con duoc phep cancel:
   - Cho phep khi don chua `DELIVERED`, `RETURN_COMPLETED`, `CANCELLED`.
   - Production khuyen nghi chi cho cancel truoc khi `PICKUP_COMPLETED`; sau khi da lay hang thi xu ly theo flow return/NDR.

2. Neu cancel bi tu choi, error code:

```text
CANNOT_CANCEL
```

3. Tracking API co can HMAC signature giong create order:

```text
Co. Tat ca endpoint /merchant/integrations/* deu can HMAC signature.
```

4. Label API tra JSON URL hay PDF binary:

```text
GET /label?format=A6       -> JSON chua labelUrl
GET /label.pdf?format=A6   -> PDF binary
```

## 9. Retry, Timeout Va Rate Limit

Production values de xuat:

```text
Request timeout khuyen nghi=10 seconds
Retry backoff khuyen nghi=1s, 3s, 10s, 30s, 2m
Rate limit per shop=100 requests/minute
Rate limit per partner=1000 requests/minute
Retry-After header khi 429=Co
Idempotency key duoc luu=30 ngay
```

Doi tac retry create order khi:

```text
Timeout
HTTP 408
HTTP 429
HTTP 500/502/503/504
```

Doi tac khong retry tu dong khi:

```text
HTTP 400
HTTP 401
HTTP 403
HTTP 404 MERCHANT_NOT_FOUND
HTTP 409 DUPLICATE_ORDER
```

Moi retry tao don phai giu nguyen:

```text
Idempotency-Key
external.platform
external.shopId
external.externalOrderId
```

Neu request truoc timeout nhung Nexus da tao van don thanh cong, retry cung `Idempotency-Key` se tra lai `shipmentCode` cu.

## 10. Thong Tin Uu Tien Cung Cap Truoc

De doi tac bat dau code va test sandbox, Nexus se uu tien cung cap:

```text
1. Sandbox base URL, partner code, API key, API secret.
2. File mapping sellerId UUID -> Nexus merchantId/hubCode.
3. Xac nhan sender field bat buoc trong sandbox:
   sender.name, sender.phone, sender.address, sender.province.
4. Xac nhan default parcel:
   weightGram=500, lengthCm=20, widthCm=15, heightCm=10.
5. Payload webhook status va cach ky webhook:
   HMAC-SHA256 hex lowercase, cung co che voi request API.
```

## 11. Ghi Chu Trien Khai

Endpoint tich hop doi tac de xuat la:

```http
/merchant/integrations/*
```

Lop endpoint nay dong vai tro adapter cho doi tac. Ben trong Nexus se map sang cac service hien co:

```http
POST /merchant/shipment/shipments
POST /merchant/pickup/pickups
GET /public/tracking/public/track/{shipmentCode}
```

Truoc go-live, hai ben can chot:

- Partner code chinh thuc.
- Credential sandbox/production.
- Mapping seller/shop.
- Danh sach IP whitelist production.
- Webhook URL cua doi tac.
