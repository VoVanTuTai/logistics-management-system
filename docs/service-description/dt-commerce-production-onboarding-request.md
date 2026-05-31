# Yêu Cầu Hoàn Tất Onboarding Production — dt-commerce → Nexus Express

> Ngày gửi: 2026-05-26
> Từ: dt-commerce — Đội ngũ Kỹ thuật
> Đến: Nexus Express — Đội ngũ Kỹ thuật Tích hợp
> Chủ đề: Hoàn tất credential, shop test, endpoint production, webhook và xác nhận no-pickup

Chào team Nexus,

Bên mình đã deploy integration Nexus lên production Kubernetes và chuẩn bị test một đơn có kiểm soát. Outbound tạo vận đơn hiện vẫn đang được giữ ở trạng thái tắt để đảm bảo an toàn.

Nhờ Nexus hoàn tất và phản hồi đủ 5 mục bên dưới để bên mình bắt đầu health check, webhook ping và gửi một đơn test production.

---

## 1. Credential Production Qua Kênh Bảo Mật

Nhờ Nexus gửi credential production qua kênh bảo mật riêng, không gửi trực tiếp trong email/chat công khai:

```text
PROD_NEXUS_API_KEY
PROD_NEXUS_API_SECRET
PROD_NEXUS_WEBHOOK_SECRET
```

Nhờ xác nhận partner code production:

```text
PROD_NEXUS_PARTNER_CODE=DT_COMMERCE
```

---

## 2. Một Shop Test Đã Mapping Đầy Đủ

Nhờ Nexus cấp một shop production dùng để test có kiểm soát, gồm đầy đủ thông tin sau:

```text
sellerId/shopId:
shopName:
merchantId:
sender.name:
sender.phone:
sender.address:
sender.ward:
sender.district:
sender.province:
sender.hubCode:
```

Các field `merchantId`, `sender.*` và `sender.hubCode` cần là dữ liệu đã được Nexus mapping hợp lệ để bên mình tạo đơn test không bị lỗi dữ liệu shop/người gửi.

---

## 3. Production Đã Sẵn Sàng

Base URL production bên mình sẽ sử dụng:

```text
https://ops.nexus-ex.site
```

Outbound IP production của bên mình:

```text
103.179.172.220
```

Nhờ Nexus xác nhận:

```text
Whitelist IP 103.179.172.220 đã xong
```

Hoặc nếu production không yêu cầu whitelist IP, nhờ phản hồi rõ:

```text
Production không yêu cầu whitelist IP
```

Nhờ xác nhận các endpoint production sau đã bật:

```text
GET  /merchant/integrations/health
POST /merchant/integrations/orders
```

---

## 4. Webhook Đã Đăng Ký

Nhờ Nexus đăng ký webhook production:

```text
POST https://api.dt-commerce.site/api/v1/shipments/webhooks/nexus
```

Sau khi bên mình xác nhận đã bật nhận webhook, nhờ Nexus gửi `webhook.ping` để hai bên kiểm tra endpoint và chữ ký webhook.

---

## 5. Xác Nhận An Toàn Khi Test

Nhờ Nexus xác nhận lần cuối: khi bên mình gửi request tạo đơn với cấu hình sau:

```json
{
  "options": {
    "autoCreatePickup": false
  }
}
```

Thì đơn test **không phát sinh lấy hàng thật hoặc giao hàng thật**.

---

## Checklist Cần Nexus Phản Hồi

Nhờ team Nexus phản hồi theo format ngắn gọn sau:

```text
Đã có credential: có/chưa
Partner code DT_COMMERCE: xác nhận/chưa xác nhận

sellerId/shopId:
shopName:
merchantId:
senderHubCode:
Đã có đầy đủ địa chỉ sender: có/chưa

Whitelist IP: đã xong/không cần/chưa xong
Endpoint production: đã bật/chưa bật
Webhook: đã đăng ký/chưa
No-pickup: đã xác nhận/chưa
```

Bên mình sẽ bắt đầu health check ngay khi nhận đủ credential, shop test đã mapping, xác nhận whitelist/endpoint, webhook và xác nhận no-pickup.

*dt-commerce — Integration Team*
