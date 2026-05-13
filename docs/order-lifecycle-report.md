# Báo cáo luồng nghiệp vụ đơn hàng qua nhiều hub

Tài liệu này mô tả ngắn gọn hành trình một đơn hàng từ lúc khách tạo đơn đến khi giao tận tay người nhận, trong trường hợp đơn phải đi qua một hoặc nhiều hub trung chuyển.

## 1. Khách tạo đơn

Khách tạo đơn trên hệ thống và đơn được cấp mã vận đơn.

Trạng thái:

- `CREATED` - Mới tạo

## 2. Phân công lấy hàng

Hệ thống hoặc nhân viên điều phối tạo nhiệm vụ lấy hàng và gán cho courier.

Trạng thái:

- `UPDATED` / `PICKUP_REQUESTED` - Đang chờ lấy hàng
- `TASK_ASSIGNED` / `PICKUP_ASSIGNED` - Đã phân công lấy hàng

## 3. Courier nhận hàng từ khách

Courier dùng chức năng `Nhận hàng` trong nhóm đơn đợi lấy. Khi thao tác xong, hệ thống ghi log kèm tên nhân viên, mã nhân viên và mã hub.

Trạng thái:

- `PICKUP_COMPLETED` - Nhận hàng

## 4. Hàng được xử lý tại hub đầu

Khi hàng về hub, nhân viên có thể đóng hàng vào tem bao hoặc xử lý như kiện rời.

Trạng thái có thể phát sinh:

- `MANIFEST_SEALED` - Đã niêm phong bao
- `MANIFEST_UNSEALED` - Đã gỡ bao

## 5. Gửi hàng lên xe

Nhân viên dùng chức năng `Gửi hàng`: quét tem xe, quét tem bao hoặc kiện rời, sau đó xác nhận gửi hàng.

Trạng thái:

- Tem xe: `Đang mở`
- Tem bao trong xe: `Đã lên xe`
- Kiện rời trong xe: `Đã lên xe`
- Đơn hàng liên quan: `SEND_GOODS` - Đã gửi hàng lên xe

## 6. Xe đi

Nhân viên dùng chức năng `Xe đi`: quét tem xe, chụp minh chứng ngoại quan, quét seal xe và xác nhận xe đi.

Trạng thái:

- Tem xe: từ `Đang mở` sang `Đang luân chuyển`
- Tem bao trong xe: từ `Đã lên xe` sang `Đang luân chuyển`
- Kiện rời trong xe: từ `Đã lên xe` sang `Đang luân chuyển`
- Đơn hàng trong tem bao hoặc kiện rời: `IN_TRANSIT` - Đang luân chuyển

Ý nghĩa: đây là mốc khách hàng thấy đơn đã thực sự rời hub và đang di chuyển.

## 7. Xe đến hub tiếp theo

Nhân viên dùng chức năng `Xe đến`: quét tem xe, chụp minh chứng seal còn nguyên, quét seal xe và xác nhận xe đến.

Trạng thái:

- Tem xe: chuyển sang trạng thái đã đến hub hiện tại

Log ghi nhận:

- Tên nhân viên thao tác
- Mã nhân viên
- Mã hub
- Seal đã quét
- Kết quả đối chứng seal

## 8. Hàng đến hub

Sau khi xe đến, nhân viên dùng chức năng `Hàng đến` để xác nhận hàng thực tế đã vào hub.

Trạng thái:

- `SCAN_INBOUND` - Hàng đến

Áp dụng:

- Nếu quét tem bao: toàn bộ đơn trong bao chuyển sang hàng đến.
- Nếu quét kiện rời: kiện đó chuyển sang hàng đến.

## 9. Trung chuyển qua nhiều hub

Nếu đơn chưa đến hub giao cuối, quy trình trung chuyển sẽ lặp lại.

Chu kỳ trạng thái:

```text
SCAN_INBOUND -> SEND_GOODS -> IN_TRANSIT -> SCAN_INBOUND
```

Ý nghĩa:

- `SCAN_INBOUND`: hàng đã đến hub hiện tại.
- `SEND_GOODS`: hàng đã được đưa lên xe đi hub tiếp theo.
- `IN_TRANSIT`: xe đã xuất bến, hàng đang luân chuyển.
- `SCAN_INBOUND`: hàng đến hub kế tiếp.

## 10. Phân công giao hàng

Khi hàng đến hub giao cuối, hệ thống hoặc điều phối tạo nhiệm vụ giao hàng cho courier.

Trạng thái:

- `TASK_ASSIGNED` / `OUT_FOR_DELIVERY` - Đang giao hàng

## 11. Giao thành công

Courier giao hàng cho người nhận và hoàn tất bằng chứng giao hàng nếu có.

Trạng thái:

- `DELIVERED` - Giao hàng thành công

## Luồng tổng quát

```text
CREATED
-> PICKUP_REQUESTED / UPDATED
-> TASK_ASSIGNED
-> PICKUP_COMPLETED
-> MANIFEST_SEALED
-> SEND_GOODS
-> IN_TRANSIT
-> SCAN_INBOUND
-> SEND_GOODS
-> IN_TRANSIT
-> SCAN_INBOUND
-> OUT_FOR_DELIVERY / TASK_ASSIGNED
-> DELIVERED
```

## Các trạng thái phụ

- `INVENTORY_CHECK` - Kiểm tra hàng tồn.
- `DELIVERY_FAILED` - Giao thất bại.
- `NDR_CREATED` - Tạo xử lý giao thất bại.
- `RETURN_STARTED` - Bắt đầu hoàn hàng.
- `RETURN_COMPLETED` - Hoàn hàng thành công.
