# Kế hoạch Nắn nót Nghiệp vụ Cốt lõi (E2E Logistics Workflow)

Bản kế hoạch này chia nhỏ toàn bộ vòng đời của một đơn hàng thành 3 giai đoạn (Phases) chính. Đi kèm mỗi giai đoạn là một **Prompt chi tiết** mà bạn có thể copy/paste để yêu cầu AI thực hiện việc kiểm tra, refactor code, và tối ưu UI/UX cho từng tính năng.

---

## 📍 Giai đoạn 1: First Mile - Lấy hàng & Nhập kho (Pickup & Inbound)
**Mục tiêu:** Tối ưu hóa trải nghiệm của tài xế khi lấy hàng và nhân viên kho khi quét hàng vào trạm (Hub).

**Các bước nghiệp vụ:**
1. App Courier: Xác nhận Lấy hàng (Pickup) thành công.
2. Ops Web / App: Quét nhập kho (Inbound Scan) khi hàng mang về trạm.

> ### 📝 Prompt cho Giai đoạn 1:
> ```text
> Hãy giúp tôi "nắn nót" lại Giai đoạn 1 (First Mile) trong luồng nghiệp vụ cốt lõi của dự án Logistics.
> Tập trung vào 2 nghiệp vụ: "Lấy hàng (Pickup)" trên app courier-mobile và "Quét nhập kho (Inbound Scan)" trên ops-web.
>
> Yêu cầu chi tiết:
> 1. Với App Courier (Lấy hàng):
>    - Kiểm tra UI màn hình chi tiết nhiệm vụ Lấy hàng: Thêm validation để đảm bảo tài xế phải chụp ảnh hoặc nhập ghi chú trước khi bấm "Xác nhận lấy hàng".
>    - Hiển thị Toast message rõ ràng khi cập nhật trạng thái thành công/thất bại.
>    - Xử lý trạng thái loading button khi đang gọi API.
> 2. Với Ops Web (Nhập kho):
>    - Textbox quét mã cần tự động focus để thao tác rảnh tay.
>    - Hiển thị thông tin đơn hàng vừa quét thành công lên trên cùng (kèm hiệu ứng highlight mờ dần).
>    - Bắt lỗi khi mã không tồn tại, hiển thị Alert/Toast màu đỏ rõ ràng, kèm âm thanh báo lỗi.
> ```

**Báo cáo kết quả:** Xem [Phase 1: First Mile](./01-phase1-first-mile.md)

---

## 📍 Giai đoạn 2: Middle Mile - Trung chuyển & Điều xe (Hub Operations & Linehaul)
**Mục tiêu:** Đảm bảo tính chính xác trong việc đóng bao, dán seal, lên/xuống xe và luân chuyển giữa các trạm.

**Các bước nghiệp vụ:**
1. Đóng bao (Bagging/Manifesting).
2. Gửi hàng / Lên xe (Load to Vehicle / Dispatch).
3. Xe đi (Departure) & Xe đến (Arrival).
4. Gỡ bao / Nhận hàng tại trạm đích (Debagging / Receive).

> ### 📝 Prompt cho Giai đoạn 2:
> ```text
> Hãy giúp tôi "nắn nót" lại Giai đoạn 2 (Middle Mile) trên hệ thống ops-web.
> Đây là luồng luân chuyển hàng hóa giữa các Hub, bao gồm: Đóng bao, Lên xe, Xe đi, Xe đến, và Gỡ bao.
>
> Yêu cầu chi tiết:
> 1. Đóng bao (Bagging) & Gỡ bao (Debagging):
>    - UI phải hiển thị rõ: Số kiện đã quét / Tổng số kiện trong bao.
>    - Bắt lỗi cực chặt: Không cho đóng bao nếu kiện ở trạng thái sai, hoặc gỡ bao nếu bao chưa tới đích.
> 2. Quản lý Chuyến xe (Linehaul):
>    - Trạng thái xe hiển thị bằng Badge màu: Vàng → Xanh dương → Xanh lá.
>    - Khi bấm "Xe đi" hoặc "Xe đến", phải có Modal Confirm yêu cầu xác nhận biển số xe và mã seal.
>    - Form nhập liệu cần bắt buộc có mã Seal xe.
> ```

**Báo cáo kết quả:** Xem [Phase 2: Middle Mile](./02-phase2-middle-mile.md)

---

## 📍 Giai đoạn 3: Last Mile - Giao hàng & Thanh toán (Delivery & Payment)
**Mục tiêu:** Cung cấp công cụ cho nhân viên điều phối và tài xế giao hàng, xử lý chính xác dòng tiền (Thu hộ COD + Phí vận chuyển).

**Các bước nghiệp vụ:**
1. Ops Web: Phân công hàng vào app Courier (Assign for delivery).
2. App Courier: Đi giao hàng (Delivery process).
3. App Courier: Ký nhận & Chọn phương thức thanh toán (Tiền mặt hoặc QR Code).

> ### 📝 Prompt cho Giai đoạn 3:
> ```text
> Hãy giúp tôi "nắn nót" lại Giai đoạn 3 (Last Mile) - Giao hàng và Thanh toán.
> Đây là phần quan trọng nhất, liên quan đến ops-web (Điều phối) và courier-mobile (Giao hàng, Ký nhận, Thanh toán).
>
> Yêu cầu chi tiết:
> 1. Ops Web (Phân công Giao hàng):
>    - Check xem đơn đã đến trạm giao (Hub đích) chưa. Nếu sai trạm phải cảnh báo đỏ.
>    - Giao diện chọn Courier cần có thanh Search (tìm theo tên/SĐT).
> 2. App Courier (Giao hàng & Ký nhận):
>    - App phải tính TỔNG TIỀN PHẢI THU (COD + Phí vận chuyển - Đã trả trước).
>    - Yêu cầu nhập Tên người nhận và chụp ảnh bằng chứng (Proof of Delivery).
>    - Thanh toán: Chọn "Tiền mặt" (xác nhận thu đủ) hoặc "Chuyển khoản QR" (gen mã QR).
>    - Validate không cho hoàn tất nếu chưa chọn phương thức và chưa có bằng chứng.
> ```

**Báo cáo kết quả:** Xem [Phase 3: Last Mile](./03-phase3-last-mile.md)

---

## 💡 Hướng dẫn sử dụng

1. Copy nội dung **Prompt Giai đoạn 1** và gửi vào khung chat AI.
2. AI sẽ đọc code, phân tích và thực hiện sửa đổi cho Phase 1.
3. Sau khi Phase 1 hoàn tất, tiếp tục copy **Prompt Giai đoạn 2**, rồi **Giai đoạn 3**.
4. Chia nhỏ giúp AI giữ được context chính xác, code không xung đột và dễ test từng module.
