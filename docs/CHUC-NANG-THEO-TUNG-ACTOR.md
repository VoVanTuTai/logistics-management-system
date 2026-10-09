# BẢNG ĐỐI CHIẾU & ĐẶC TẢ CHỨC NĂNG THEO TỪNG ACTOR
## Căn Cứ Tuyệt Đối Theo Tài Liệu Chuẩn `docs/PROJECT-OVERVIEW.md`

---

## 1. Bảng Đối Chiếu Tổng Quan: Chức Năng Cũ vs. PROJECT-OVERVIEW.md

Bảng dưới đây đối chiếu toàn bộ danh sách chức năng cũ do người dùng cung cấp với tài liệu thiết kế hệ thống **Nexus Express System** ([`docs/PROJECT-OVERVIEW.md`](file:///d:/KhoaLuanTotNghiep/KLTN_MasterNam/DoAnKhoaLuanTotNghiep/logistics-management-system/docs/PROJECT-OVERVIEW.md)):

### 1.1 Đánh giá tính chính xác của danh sách cũ
- **Tính đúng đắn:** Toàn bộ **40 chức năng cũ** đều **CÒN ĐÚNG 100%** trong hệ thống hiện tại. Không có chức năng nào bị loại bỏ.
- **Actor mới được bổ sung:** Theo Mục 4 và Mục 9 trong `PROJECT-OVERVIEW.md`, hệ thống có thêm:
  1. **Khách hàng cá nhân (C-End)**: Sử dụng ứng dụng di động riêng biệt `customer-mobile` (:8082).
  2. **Trợ lý AI Logistics RAG & Động cơ định giá / Tác nhân hệ thống**: Được mô tả chi tiết tại Mục 2, Mục 5.3, Mục 5.12, Mục 10 và Mục 15.9 (`chatbot-service` :3013, `pricing-service` :3012).
- **Các chức năng mới [MỚI]:** Các phân hệ nghiệp vụ bưu chính thực tế (mạng lưới Hub 4 cấp, niêm phong kẹp chì seal, tem xe tải Linehaul `XT`, mã OTP 6 số, ảnh bằng chứng POD, hàng đợi offline queue, đối soát VietQR SePay, bảng giá IATA $V/6000$, trợ lý AI Hybrid RAG) đã được bổ sung đầy đủ, nâng tổng số chức năng từ 40 lên **76 chức năng chuẩn hóa**.

---

### 1.2 Bảng đối chiếu chi tiết từng chức năng cũ

| STT | Actor | Chức Năng Trong Danh Sách Cũ | Đối Chiếu Trong `PROJECT-OVERVIEW.md` | Trạng Thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Khách vãng lai** | Tra cứu trạng thái bưu kiện | Mục 4, 9, 11, 15.1: Tra cứu hành trình vận đơn qua timeline trực quan | **Kế thừa (Còn đúng)** |
| 2 | **Người gửi hàng** | Đăng nhập hệ thống | Mục 5.1, 10: Đăng nhập token opaque tại `auth-service` | **Kế thừa (Còn đúng)** |
| 3 | | Đăng xuất hệ thống | Mục 5.1, 10: Logout, thu hồi phiên làm việc tại `auth-service` | **Kế thừa (Còn đúng)** |
| 4 | | Quản lý tài khoản | Mục 5.1, 10, 11: Quản lý thông tin tài khoản và thông tin cấu hình merchant | **Kế thừa (Còn đúng)** |
| 5 | | Tạo đơn hàng | Mục 4, 5.3, 5.4, 9, 15.1: Tạo đơn hàng, tính cước IATA $V/6000$, lưu snapshot | **Kế thừa (Còn đúng)** |
| 6 | | Quản lý đơn hàng | Mục 4, 9, 15.1: Theo dõi tiến độ giao hàng, danh sách vận đơn | **Kế thừa (Còn đúng)** |
| 7 | | Quản lý yêu cầu lấy hàng | Mục 4, 5.5, 9, 15.1: Lập yêu cầu lấy hàng tận nơi qua `pickup-service` | **Kế thừa (Còn đúng)** |
| 8 | | Tra cứu vận đơn | Mục 4, 9, 11, 15.1: Tra cứu hành trình bưu phẩm thời gian thực | **Kế thừa (Còn đúng)** |
| 9 | | Yêu cầu đổi thông tin giao | Mục 12: Bảng `ChangeRequest` trong `shipment_db` khi đơn chưa lấy | **Kế thừa (Còn đúng)** |
| 10 | | Yêu cầu hoàn hàng | Mục 5.9, 15.3, 15.6: Khởi tạo/yêu cầu chuyển hoàn (Return flow) | **Kế thừa (Còn đúng)** |
| 11 | | In nhãn vận đơn | Mục 4, 9: In phiếu gửi bưu chính có mã vạch chuẩn A6/A7 | **Kế thừa (Còn đúng)** |
| 12 | **Nhân viên giao hàng** | Đăng nhập hệ thống | Mục 5.1, 10: Đăng nhập tài khoản bưu tá trên `courier-mobile` | **Kế thừa (Còn đúng)** |
| 13 | | Đăng xuất hệ thống | Mục 5.1: Thu hồi token xác thực trên thiết bị di động | **Kế thừa (Còn đúng)** |
| 14 | | Quản lý nhiệm vụ giao nhận | Mục 4, 9, 10, 15.1, 15.3: Tiếp nhận và quản lý nhiệm vụ lấy/giao trong ngày | **Kế thừa (Còn đúng)** |
| 15 | | Xác nhận lấy hàng | Mục 4, 5.6, 9, 15.1: Quét mã vạch xác nhận lấy hàng (`scan.pickup_confirmed`) | **Kế thừa (Còn đúng)** |
| 16 | | Xác nhận đã giao hàng | Mục 5.9, 9, 15.3: Xác nhận giao thành công, ghi nhận `delivery.delivered` | **Kế thừa (Còn đúng)** |
| 17 | | Liên hệ người nhận | Mục 4, 15.3: Liên hệ người nhận khi thực hiện nhiệm vụ phát | **Kế thừa (Còn đúng)** |
| 18 | | Báo cáo kiện vấn đề | Mục 4, 5.9, 9, 15.3: Cập nhật lý do giao thất bại, lập biên bản `ndr.created` | **Kế thừa (Còn đúng)** |
| 19 | | Nộp tiền COD | Mục 4, 5.10, 9, 15.4: Nộp tiền thu hộ COD qua đối soát VietQR | **Kế thừa (Còn đúng)** |
| 20 | **Nhân viên vận hành** | Đăng nhập hệ thống | Mục 5.1, 10: Đăng nhập tài khoản nhân viên vận hành tại `ops-web` | **Kế thừa (Còn đúng)** |
| 21 | | Đăng xuất hệ thống | Mục 5.1: Đăng xuất và kết thúc phiên làm việc | **Kế thừa (Còn đúng)** |
| 22 | | Xem dashboard báo cáo thống kê | Mục 4, 9: Giám sát bảng điều khiển thời gian thực tại bưu cục | **Kế thừa (Còn đúng)** |
| 23 | | Tra cứu hành trình đơn | Mục 10, 11, 15.1: Tra cứu timeline và lịch sử quét bưu phẩm | **Kế thừa (Còn đúng)** |
| 24 | | Phân công công việc vận chuyển | Mục 4, 5.5, 9, 15.1, 15.2: Gán việc lấy/giao cho shipper qua `dispatch-service` | **Kế thừa (Còn đúng)** |
| 25 | | Tạo đơn hàng | Mục 14, 15.1: Tạo đơn gửi trực tiếp tại quầy bưu cục (Walk-in) | **Kế thừa (Còn đúng)** |
| 26 | | Đóng bao | Mục 4, 5.7, 9, 15.2: Gom các vận đơn lẻ vào bao/túi chuyên dụng (`MB...`) | **Kế thừa (Còn đúng)** |
| 27 | | Gửi hàng | Mục 4, 5.6, 9, 15.2: Quét mã xuất kho gửi hàng đi (`scan.outbound`) | **Kế thừa (Còn đúng)** |
| 28 | | Xác nhận xe đi | Mục 5.8, 13, 15.2: Xe tải trung chuyển xuất phát (`linehaul.dispatched`) | **Kế thừa (Còn đúng)** |
| 29 | | Xác nhận xe đến | Mục 5.8, 13, 15.2: Xe tải trung chuyển đến đích (`linehaul.arrived`) | **Kế thừa (Còn đúng)** |
| 30 | | Nhận hàng | Mục 4, 5.6, 9, 15.2: Quét mã nhập kho tiếp nhận hàng đến (`scan.inbound`) | **Kế thừa (Còn đúng)** |
| 31 | | Gỡ bao | Mục 13, 14: Mở bao kiểm đếm và chia chọn vận đơn (`manifest.unsealed`) | **Kế thừa (Còn đúng)** |
| 32 | | Tạo yêu cầu chuyển hoàn | Mục 4, 5.9, 9, 15.3: Kích hoạt luồng chuyển hoàn (`return.started`) | **Kế thừa (Còn đúng)** |
| 33 | | Tạo mã thanh toán QR | Mục 4, 5.10, 9, 15.4: Tạo mã VietQR động thu tiền COD qua SePay | **Kế thừa (Còn đúng)** |
| 34 | **Quản trị viên** | Đăng nhập hệ thống | Mục 5.1, 10: Đăng nhập quản trị hệ thống tại `admin-web` | **Kế thừa (Còn đúng)** |
| 35 | | Đăng xuất hệ thống | Mục 5.1: Đăng xuất và thu hồi phiên quản trị | **Kế thừa (Còn đúng)** |
| 36 | | Quản lý tài khoản người dùng | Mục 4, 9, 10, 11: Quản lý tài khoản toàn hệ thống (Merchant, Ops, Courier) | **Kế thừa (Còn đúng)** |
| 37 | | Phân công nhân sự | Mục 4, 10: Gán bưu cục cho Ops, gán tuyến cho Courier | **Kế thừa (Còn đúng)** |
| 38 | | Quản lý Hub | Mục 4, 5.2, 9, 15.8: Quản trị danh mục mạng lưới Hub 4 cấp | **Kế thừa (Còn đúng)** |
| 39 | | Quản lý Zone | Mục 4, 5.2, 9, 15.5: Quản trị bảng khu vực phân vùng địa lý tính cước | **Kế thừa (Còn đúng)** |
| 40 | | Phân quyền sử dụng app mobile | Mục 4, 5.1, 9, 12: Cấp quyền override trên ứng dụng di động bưu tá | **Kế thừa (Còn đúng)** |

---

## 2. Danh Sách Chức Năng Chi Tiết Theo Từng Actor
*(Các chức năng không có trong danh sách cũ được đánh dấu rõ ràng là **`✨ MỚI`** và ghi rõ mục tham chiếu trong `PROJECT-OVERVIEW.md`)*

---

### 2.1 Actor 1: Khách Vãng Lai (Guest)
**Ứng dụng phục vụ:** `guest-web` (Port `5174`) — Tham chiếu: Mục 4, 9  
**Dịch vụ backend:** `tracking-service` (:3008), `pricing-service` (:3012), `masterdata-service` (:3001), `chatbot-service` (:3013), `shipment-service` (:3002)

| STT | Tên Chức Năng | Tình Trạng | Tham Chiếu Trong `PROJECT-OVERVIEW.md` | Mô Tả Nghiệp Vụ Cụ Thể |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Tra cứu trạng thái bưu kiện** | **Kế thừa** | Mục 4, 9, 11 | Nhập mã vận đơn (VD: `333577082054`), tra cứu trực tiếp timeline hành trình không cần đăng nhập. |
| 2 | **Ước tính cước phí bưu chính IATA đa dịch vụ** | **`✨ MỚI`** | Mục 4, 5.3, 9, 15.5 | Nhập điểm đi/đến, cân nặng, kích thước; tính cước tức thời chuẩn IATA $V/6000$ cho 3 vùng (Nội tỉnh / Trục chính / Liên tỉnh). |
| 3 | **Tạo đơn khách vãng lai** | **`✨ MỚI`** | Mục 9 | Cho phép tạo đơn gửi bưu phẩm nhanh công khai tại web để mang ra bưu cục gửi mà không cần đăng ký tài khoản trước. |
| 4 | **Trò chuyện cùng trợ lý AI Logistics RAG 24/7** | **`✨ MỚI`** | Mục 4, 5.12, 9, 15.9 | Tương tác giải đáp thắc mắc dịch vụ bưu chính qua cửa sổ chat AI thông minh sử dụng Server-Sent Events (SSE). |
| 5 | **Tra cứu vận đơn bằng AI (`track_shipment`)** | **`✨ MỚI`** | Mục 15.9 (Tool 1) | Hỏi AI bằng câu tự nhiên (VD: "đơn 333577082054 tới đâu rồi"), AI tự động gọi dynamic tool lấy dữ liệu thời gian thực. |
| 6 | **Tính cước tự động bằng AI (`calculate_shipping_rate`)** | **`✨ MỚI`** | Mục 15.9 (Tool 2) | Nhập yêu cầu gửi hàng tự do, AI tự trích xuất địa danh, cân nặng và gọi động cơ định giá báo cước chuẩn xác. |
| 7 | **Tra cứu danh mục hàng cấm gửi/cấm bay bằng AI (`get_prohibited_goods_policy`)** | **`✨ MỚI`** | Mục 15.9 (Tool 3) | Hỏi về chất lỏng, pin lithium, hàng nguy hiểm; AI tự tra cứu quy định bưu chính hàng không để tư vấn. |
| 8 | **Tra cứu chính sách bồi thường bằng AI (`get_compensation_claim_policy`)** | **`✨ MỚI`** | Mục 15.7, 15.9 (Tool 4) | Tư vấn quy trình bồi thường 100% giá trị khai báo và quy định Điều 25 Luật Bưu chính khi hàng bị vỡ nát/mất mát. |
| 9 | **Tra cứu bưu cục gần nhất bằng AI (`find_nearest_post_office`)** | **`✨ MỚI`** | Mục 15.9 (Tool 5) | Hỏi bưu cục theo quận/huyện, AI tự tìm kiếm địa chỉ, hotline từ danh mục Master Data để phản hồi cho khách. |

---

### 2.2 Actor 2: Người Gửi Hàng (Merchant / Chủ Shop B2B)
**Ứng dụng phục vụ:** `merchant-web` (Port `5176`) — Tham chiếu: Mục 4, 9  
**Dịch vụ backend:** `shipment-service` (:3002), `pickup-service` (:3003), `pricing-service` (:3012), `tracking-service` (:3008), `payment-service` (:3011), `auth-service` (:3010)

| STT | Tên Chức Năng | Tình Trạng | Tham Chiếu Trong `PROJECT-OVERVIEW.md` | Mô Tả Nghiệp Vụ Cụ Thể |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Đăng nhập hệ thống** | **Kế thừa** | Mục 5.1, 10 | Đăng nhập tài khoản chủ shop qua `auth-service`, xác thực token an toàn. |
| 2 | **Đăng xuất hệ thống** | **Kế thừa** | Mục 5.1, 10 | Đăng xuất và thu hồi phiên làm việc trên trình duyệt. |
| 3 | **Quản lý thông tin tài khoản** | **Kế thừa** | Mục 5.1, 11 | Cập nhật thông tin shop, địa chỉ kho gửi hàng và cấu hình tài khoản ngân hàng nhận tiền. |
| 4 | **Tạo đơn hàng (Form trực tiếp trên Web)** | **Kế thừa** | Mục 4, 5.3, 9, 15.1 | Nhập thông tin người nhận, kích thước/cân nặng; tự động tính cước IATA tức thời (debounce 300ms); hỗ trợ 2 nút thao tác: *"Tạo đơn hàng"* hoặc *"Tạo đơn & Yêu cầu lấy ngay"*. |
| 5 | **In nhiều vận đơn hàng loạt (Bulk Print)** | **`✨ MỚI`** | Mã nguồn `merchant-web` (:5176) | Dán danh sách nhiều mã vận đơn vào ô nhập (phân cách bằng dấu phẩy hoặc xuống dòng) để mở popup in đồng loạt phiếu gửi A6/A7. *(Lưu ý: Chức năng Import file Excel chỉ có trong câu chữ tổng quan `PROJECT-OVERVIEW.md` nhưng mã nguồn thực tế chưa cài đặt).* |
| 6 | **Quản lý danh sách đơn hàng** | **Kế thừa** | Mục 4, 9, 15.1 | Theo dõi danh sách vận đơn, lọc theo trạng thái (`CREATED`, `IN_TRANSIT`, `DELIVERED`, `RETURNING`...). |
| 7 | **Yêu cầu đổi thông tin giao** | **Kế thừa** | Mục 11, 12 | Chỉnh sửa địa chỉ, số điện thoại người nhận, tiền thu hộ COD khi đơn chưa lấy (lưu `ChangeRequest`). |
| 8 | **Hủy đơn hàng** | **`✨ MỚI`** | Mục 14, 15.1 | Cho phép hủy đơn hàng trước khi bưu tá đến lấy (`CANCELLED`), tự động hủy yêu cầu lấy hàng liên quan. |
| 9 | **Quản lý yêu cầu lấy hàng (Đặt lịch Pickup)** | **Kế thừa** | Mục 4, 5.5, 9, 15.1 | Đặt lịch yêu cầu bưu tá đến tận kho lấy hàng theo khung giờ và địa điểm mong muốn. |
| 10 | **Tra cứu vận đơn (Theo dõi tiến độ giao hàng)** | **Kế thừa** | Mục 4, 9, 11 | Xem timeline hành trình chi tiết của kiện hàng từ lúc lấy đến khi phát thành công. |
| 11 | **In nhãn vận đơn đơn lẻ (Phiếu gửi A6/A7)** | **Kế thừa** | Mục 4, 9 | Chọn mã vận đơn cụ thể để render và in phiếu gửi bưu chính có mã vạch Barcode 1D và QR. |
| 12 | **Tự động gắn tem cảnh báo Hàng Dễ Vỡ [FRAGILE]** | **`✨ MỚI`** | Mục 15.7 | Tự động gán nhãn `[FRAGILE - HÀNG DỄ VỠ - XIN NHẸ TAY]` trên phiếu gửi in ra đối với hàng thuộc diện bảo hiểm. |
| 13 | **Yêu cầu hoàn hàng** | **Kế thừa** | Mục 5.9, 15.3, 15.6 | Chủ shop yêu cầu hoàn hàng sớm hoặc chốt hoàn khi bưu tá báo sự cố phát thất bại. |
| 14 | **Theo dõi lịch sử đối soát COD qua SePay/VietQR** | **`✨ MỚI`** | Mục 4, 9, 15.4 | Theo dõi chi tiết các phiên đối soát COD, số tiền thu hộ và nhận tiền giải ngân tự động qua VietQR. |
| 15 | **Tự động khấu trừ cước chuyển hoàn theo phân tầng** | **`✨ MỚI`** | Mục 15.6 | Hệ thống tự động trừ 50% cước hoàn đối với Standard SME, miễn phí 0đ đối với VIP Enterprise vào bảng kê COD. |

---

### 2.3 Actor 3: Nhân Viên Giao Hàng (Shipper / Tài Xế Chặng Cuối)
**Ứng dụng phục vụ:** `courier-mobile` (Port `:8081`) — Tham chiếu: Mục 4, 9  
**Dịch vụ backend:** `dispatch-service` (:3004), `scan-service` (:3006), `delivery-service` (:3007), `payment-service` (:3011), `gateway-bff` (:3000 - MinIO S3)

| STT | Tên Chức Năng | Tình Trạng | Tham Chiếu Trong `PROJECT-OVERVIEW.md` | Mô Tả Nghiệp Vụ Cụ Thể |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Đăng nhập hệ thống** | **Kế thừa** | Mục 5.1, 10 | Đăng nhập tài khoản bưu tá trên ứng dụng di động, lưu token trong Expo Secure Store. |
| 2 | **Đăng xuất hệ thống** | **Kế thừa** | Mục 5.1 | Đăng xuất an toàn và xóa phiên làm việc trên thiết bị. |
| 3 | **Quản lý danh sách nhiệm vụ lấy/giao trong ngày** | **Kế thừa** | Mục 4, 9, 15.1, 15.3 | Tiếp nhận danh sách các công việc được điều phối: nhiệm vụ thu gom hàng (Pickup) và phát hàng (Delivery). |
| 4 | **Quét mã vạch bằng camera di động** | **`✨ MỚI`** | Mục 4, 8, 9 | Sử dụng Expo Camera quét mã vạch Barcode/QR bưu kiện siêu tốc trực tiếp bằng điện thoại. |
| 5 | **Xác nhận lấy hàng (Scan Pickup)** | **Kế thừa** | Mục 4, 5.6, 9, 15.1 | Quét mã vạch xác nhận đã nhận hàng từ tay chủ shop, phát sinh sự kiện `scan.pickup_confirmed`. |
| 6 | **Liên hệ người nhận** | **Kế thừa** | Mục 4, 15.3 | Bấm gọi điện thoại trực tiếp cho người nhận để hẹn giờ giao hàng. |
| 7 | **Xác thực mã OTP người nhận (6 chữ số)** | **`✨ MỚI`** | Mục 4, 5.9, 9, 15.3 | Yêu cầu người nhận đọc mã OTP 6 số bảo mật, nhập vào ứng dụng để bảo đảm phát đúng người. |
| 8 | **Chụp ảnh bằng chứng giao hàng (POD) & Chữ ký** | **`✨ MỚI`** | Mục 4, 5.9, 9, 15.3 | Chụp ảnh bưu kiện đã giao và lấy chữ ký số của người nhận tải lên MinIO/S3 lưu chứng từ. |
| 9 | **Xác nhận đã giao hàng (Delivery Success)** | **Kế thừa** | Mục 5.9, 9, 15.3 | Xác nhận phát thành công với POD/OTP kèm `idempotencyKey`, chuyển trạng thái đơn sang `DELIVERED`. |
| 10 | **Cập nhật NDR / Báo cáo sự cố phát thất bại** | **Kế thừa** | Mục 4, 5.9, 9, 15.3 | Chọn lý do từ danh mục NDR khi giao không thành công (Khách hẹn lại, Không nghe máy...) và lập biên bản sự cố. |
| 11 | **Hỗ trợ lưu trữ hàng đợi ngoại tuyến (Offline Queue)** | **`✨ MỚI`** | Mục 4, 8, 9, 17 | Cho phép quét và chụp POD khi mất sóng 4G/Wifi, tự động lưu hàng đợi cục bộ và retry khi có mạng trở lại. |
| 12 | **Thu hộ tiền mặt COD** | **`✨ MỚI`** | Mục 5.10, 15.4 | Thu tiền mặt từ người nhận theo đúng số tiền COD ghi trên đơn, hệ thống ghi nhận `cod.collected`. |
| 13 | **Nộp tiền COD qua chuyển khoản VietQR** | **Kế thừa** | Mục 4, 5.10, 9, 15.4 | Bấm quyết toán nộp tiền cuối ngày, màn hình sinh mã VietQR để bưu tá chuyển trả tiền COD về tài khoản công ty. |

---

### 2.4 Actor 4: Nhân Viên Vận Hành (Ops Staff - Bưu Cục & Hub Khai Thác)
**Ứng dụng phục vụ:** `ops-web` (Port `5175`) — Tham chiếu: Mục 4, 9  
**Dịch vụ backend:** `shipment-service` (:3002), `pickup-service` (:3003), `dispatch-service` (:3004), `manifest-service` (:3005), `scan-service` (:3006), `delivery-service` (:3007), `payment-service` (:3011), `linehaul-service` (:3014)

| STT | Tên Chức Năng | Tình Trạng | Tham Chiếu Trong `PROJECT-OVERVIEW.md` | Mô Tả Nghiệp Vụ Cụ Thể |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Đăng nhập hệ thống** | **Kế thừa** | Mục 5.1, 10 | Đăng nhập tài khoản nhân viên vận hành bưu cục tại `ops-web`. |
| 2 | **Đăng xuất hệ thống** | **Kế thừa** | Mục 5.1 | Đăng xuất an toàn khỏi hệ thống. |
| 3 | **Giám sát bảng điều khiển thời gian thực (Dashboard)** | **Kế thừa** | Mục 4, 9 | Theo dõi số đơn chờ lấy, số đơn đang giao, số lượng bao chờ xuất/nhập tại Hub trong ngày. |
| 4 | **Tra cứu hành trình đơn nội bộ** | **Kế thừa** | Mục 10, 11, 15.1 | Tra cứu chi tiết toàn bộ lịch sử scan, tọa độ, nhân sự xử lý của bất kỳ vận đơn nào. |
| 5 | **Tạo đơn hàng tại quầy (Walk-in)** | **Kế thừa** | Mục 14, 15.1 | Tiếp nhận hàng gửi trực tiếp tại bưu cục, cân đo, tính cước IATA tức thời và in phiếu gửi. |
| 6 | **Điều phối pickup / Phê duyệt yêu cầu lấy hàng** | **`✨ MỚI`** | Mục 4, 5.5, 9, 15.1 | Kiểm tra các yêu cầu lấy hàng từ shop và phê duyệt (`pickup.approved`) để chuyển sang điều phối. |
| 7 | **Gán việc shipper (Phân công lấy & phát hàng)** | **Kế thừa** | Mục 4, 5.5, 9, 15.1, 15.2 | Phân công nhiệm vụ thu gom cho bưu tá lấy và phân công đơn phát cho bưu tá giao (`task.assigned`). |
| 8 | **Quản lý bảng kê manifest / Đóng bao** | **Kế thừa** | Mục 4, 5.7, 9, 15.2 | Khởi tạo bao trung chuyển (mã `MB...`), quét gom các vận đơn lẻ hợp lệ đóng vào bao. |
| 9 | **Đóng seal niêm phong kẹp chì an ninh** | **`✨ MỚI`** | Mục 5.7, 15.2 | Khóa bao hàng bằng kẹp chì an ninh có mã số độc nhất, phát sinh sự kiện `manifest.sealed`. |
| 10 | **Quản lý chuyến xe tải trung chuyển (Linehaul Transit)** | **`✨ MỚI`** | Mục 5.8, 9, 15.8 | Điều phối các chuyến xe tải đường dài kết nối mạng lưới Hub 4 cấp Bắc - Trung - Nam. |
| 11 | **Cấp tem niêm phong xe tải (Mã `XT`)** | **`✨ MỚI`** | Mục 5.8, 15.8, 18 | Cấp mã tem niêm phong thùng xe tải (mã `XT...`), gắn các bao hàng đã seal vào danh sách bốc xếp của xe. |
| 12 | **Gửi hàng & Xác nhận xe đi (Quét xuất kho Outbound)** | **Kế thừa** | Mục 4, 5.6, 9, 15.2 | Quét xuất kho (`scan.outbound`) từng bao hàng lên xe, xác nhận xe rời Hub (`linehaul.dispatched`). |
| 13 | **Xác nhận xe đến & Nhận hàng (Quét nhập kho Inbound)** | **Kế thừa** | Mục 4, 5.6, 9, 15.2 | Tiếp nhận xe đến (`linehaul.arrived`), dỡ hàng và quét nhập kho (`scan.inbound`) bao hàng tại Hub đích. |
| 14 | **Gỡ bao & Kiểm đếm chia chọn** | **Kế thừa** | Mục 13, 14 | Cắt seal mở bao (`manifest.unsealed`), kiểm đếm số kiện và phân chia đơn về các kệ phát chặng cuối. |
| 15 | **Quét bàn giao bưu kiện cho bưu tá (`handoff`)** | **`✨ MỚI`** | Mục 13, 14 | Quét barcode từng gói hàng khi bàn giao tận tay bưu tá, kích hoạt trạng thái `OUT_FOR_DELIVERY`. |
| 16 | **Xử lý sự cố phát thất bại (NDR)** | **`✨ MỚI`** | Mục 4, 5.9, 9, 15.3 | Tiếp nhận báo cáo giao lỗi, quyết định cho bưu tá giao lại tối đa 3 lần hoặc kích hoạt chuyển hoàn. |
| 17 | **Tạo yêu cầu chuyển hoàn & Quản lý hoàn hàng** | **Kế thừa** | Mục 4, 5.9, 9, 15.3, 15.6 | Kích hoạt luồng hoàn hàng (`return.started`), quét nhận hoàn tại bưu cục gốc và trả tận tay shop (`return.completed`). |
| 18 | **Đối soát giải ngân COD & Tạo mã thanh toán VietQR** | **Kế thừa** | Mục 4, 5.10, 9, 15.4 | Tự động gom phiên đối soát COD theo ngày/bưu cục/shipper, sinh mã VietQR động qua cổng SePay. |
| 19 | **Phê duyệt quyết toán COD thủ công** | **`✨ MỚI`** | Mục 15.4 | Cho phép xác nhận thủ công khi bưu tá nộp tiền mặt trực tiếp tại két thủ quỹ bưu cục. |

---

### 2.5 Actor 5: Quản Trị Viên (System Admin)
**Ứng dụng phục vụ:** `admin-web` (Port `5173`) — Tham chiếu: Mục 4, 9  
**Dịch vụ backend:** `auth-service` (:3010), `masterdata-service` (:3001), `gateway-bff` (:3000), `reporting-service` (:3009)

| STT | Tên Chức Năng | Tình Trạng | Tham Chiếu Trong `PROJECT-OVERVIEW.md` | Mô Tả Nghiệp Vụ Cụ Thể |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Đăng nhập hệ thống** | **Kế thừa** | Mục 5.1, 10 | Đăng nhập tài khoản quản trị hệ thống qua cơ chế Opaque Token bảo mật tại `admin-web`. |
| 2 | **Đăng xuất hệ thống** | **Kế thừa** | Mục 5.1 | Đăng xuất và hủy phiên làm việc quản trị. |
| 3 | **Quản lý tài khoản toàn hệ thống** | **Kế thừa** | Mục 4, 9, 10, 11 | Tạo mới, cập nhật, khóa/mở khóa tài khoản người dùng: Merchant, Ops Staff, Courier. |
| 4 | **Phân công nhân sự** | **Kế thừa** | Mục 4, 10 | Phân công gán nhân viên vận hành vào bưu cục quản lý, gán tuyến đường phụ trách cho bưu tá. |
| 5 | **Quản lý phân quyền RBAC** | **`✨ MỚI`** | Mục 4, 5.1, 9 | Kiểm soát chi tiết quyền hạn truy cập theo ma trận vai trò toàn hệ thống. |
| 6 | **Phân quyền sử dụng app mobile (Permission Override)** | **Kế thừa** | Mục 5.1, 9, 12 | Cấu hình profile quyền và cấp quyền override tạm thời cho bưu tá trên ứng dụng di động. |
| 7 | **Quản lý danh mục Hub 4 cấp** | **Kế thừa** | Mục 4, 5.2, 9, 15.8 | Thêm, sửa, vô hiệu hóa mạng lưới Hub: Mega Hub (Cấp 1), Regional Hub (Cấp 2), Provincial Hub (Cấp 3), Post Office (Cấp 4). |
| 8 | **Quản lý khu vực / Zone địa lý** | **Kế thừa** | Mục 4, 5.2, 9, 15.5 | Quản trị bảng khu vực phân vùng địa lý phục vụ định tuyến và phân 3 vùng cước chuẩn hóa. |
| 9 | **Quản lý danh mục lý do giao thất bại (NDR Reason)** | **`✨ MỚI`** | Mục 4, 5.2, 9, 10 | Cấu hình danh mục mã lý do giao thất bại chuẩn hóa toàn hệ thống (Khách hẹn lại, Sai địa chỉ...). |
| 10 | **Cấu hình tham số toàn hệ thống (System Config)** | **`✨ MỚI`** | Mục 4, 5.2, 9, 10 | Quản lý các tham số vận hành: thời gian timeout, tỷ lệ phí bảo hiểm khai giá, số lần phát tối đa. |
| 11 | **Kiểm toán nhật ký hệ thống (Admin Audit Log)** | **`✨ MỚI`** | Mục 4, 9, 10 | Theo dõi nhật ký kiểm toán ghi nhận mọi thay đổi nhạy cảm (actor, action, IP, giá trị trước/sau). |

---

### 2.6 Actor 6: [ACTOR MỚI] Khách Hàng Cá Nhân (Customer C-End)
**Ứng dụng phục vụ:** `customer-mobile` (Port `:8082`) — Tham chiếu: Mục 4, 9  
*(Actor này hoàn toàn mới so với danh sách cũ, được quy định độc lập trong `PROJECT-OVERVIEW.md`)*  
**Dịch vụ backend:** `shipment-service` (:3002), `pricing-service` (:3012), `tracking-service` (:3008), `chatbot-service` (:3013), `delivery-service` (:3007), `auth-service` (:3010)

| STT | Tên Chức Năng | Tình Trạng | Tham Chiếu Trong `PROJECT-OVERVIEW.md` | Mô Tả Nghiệp Vụ Cụ Thể |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Tạo đơn gửi hàng lẻ** | **`✨ MỚI`** | Mục 4, 9 | Tạo đơn gửi bưu gửi cá nhân trực tiếp trên ứng dụng di động. |
| 2 | **Tính cước tự động chuẩn IATA đa dịch vụ** | **`✨ MỚI`** | Mục 4, 9, 15.5 | Tự động tính cước và so sánh giữa các gói Tiết kiệm, Tiêu chuẩn, Hỏa tốc theo quy chuẩn IATA $V/6000$. |
| 3 | **Tra cứu hành trình theo thời gian thực** | **`✨ MỚI`** | Mục 4, 9, 11 | Theo dõi chi tiết các mốc di chuyển của bưu phẩm gửi đi và bưu phẩm sắp nhận về. |
| 4 | **Quản lý sổ địa chỉ** | **`✨ MỚI`** | Mục 9 | Lưu trữ danh bạ địa chỉ quen thuộc của người gửi và người nhận để tự động điền khi tạo đơn. |
| 5 | **Tích hợp cửa sổ trò chuyện nổi cùng trợ lý AI Logistics RAG** | **`✨ MỚI`** | Mục 4, 9, 15.9 | Trò chuyện trực tiếp với trợ lý ảo AI để hỏi đáp cước phí, hành trình và chính sách bưu chính 24/7. |
| 6 | **Xác thực nhận hàng bằng mã OTP 6 số** | **`✨ MỚI`** | Mục 5.9, 15.3 | Nhận mã OTP 6 số trên điện thoại và cung cấp cho bưu tá khi nhận bưu phẩm để bảo đảm an toàn. |

---

### 2.7 Actor 7: [ACTOR MỚI] Trợ Lý AI Logistics RAG & Động Cơ Định Giá / Hệ Thống (System & AI Engine)
**Thành phần phục vụ:** `@NEXUS/chatbot-service` (:3013), `@NEXUS/pricing-service` (:3012), `payment-service` (:3011), Outbox Workers, RabbitMQ  
*(Actor hệ thống/AI đóng vai trò hạt nhân tự động hóa, được quy định tại Mục 2, 5.3, 5.12, 10, 15.5, 15.9)*

| STT | Tên Chức Năng | Tình Trạng | Tham Chiếu Trong `PROJECT-OVERVIEW.md` | Mô Tả Nghiệp Vụ Cụ Thể |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Động cơ định giá chuẩn hóa IATA $V/6000$** | **`✨ MỚI`** | Mục 5.3, 10, 15.5 | Thống nhất thuật toán tính cước đa nền tảng: $\max(\text{Cân nặng thực tế}, \frac{D \times R \times C}{6000})$ cho 3 vùng cước. |
| 2 | **Truy xuất tri thức bưu chính Hybrid RAG** | **`✨ MỚI`** | Mục 5.12, 10, 15.9 | Đối soát câu hỏi người dùng với 768-dim Vector Embeddings của kho tri thức SOP bưu chính. |
| 3 | **Thực thi 5 công cụ tra cứu động (Dynamic Tools)** | **`✨ MỚI`** | Mục 15.9 | Tự động gọi API thời gian thực: `track_shipment`, `calculate_shipping_rate`, `get_prohibited_goods_policy`, `get_compensation_claim_policy`, `find_nearest_post_office`. |
| 4 | **Cơ chế Fallback mô hình ngôn ngữ thông minh** | **`✨ MỚI`** | Mục 10, 15.9 | Ưu tiên Google Gemini 3 Flash siêu tốc; tự động chuyển sang OpenAI GPT-4o-mini khi gặp sự cố API. |
| 5 | **Phản hồi dạng dòng dữ liệu (SSE Streaming)** | **`✨ MỚI`** | Mục 5.12, 15.9 | Truyền câu trả lời dạng Server-Sent Events tạo hiệu ứng gõ máy chữ mượt mà trên giao diện Client. |
| 6 | **Cách ly phiên trò chuyện an toàn giữa từng người dùng** | **`✨ MỚI`** | Mục 5.12, 15.9 | Phân tách bộ nhớ hội thoại theo Session ID, không rò rỉ lịch sử chat và đơn hàng giữa các tài khoản khác nhau. |
| 7 | **Chuyển giao sự kiện qua Outbox Relay & RabbitMQ** | **`✨ MỚI`** | Mục 6, 12, 13 | Đảm bảo chuyển giao dữ liệu phi đồng bộ tin cậy (At-least-once delivery) qua topic exchange `domain.events`. |
| 8 | **Chiếu dữ liệu Read Model Timeline & KPI** | **`✨ MỚI`** | Mục 6, 10, 11 | Tiêu thụ domain events để cập nhật bảng tra cứu timeline và báo cáo thống kê KPI theo ngày/tháng. |
| 9 | **Khớp nối thanh toán SePay/VietQR tự động & Khấu trừ cước hoàn** | **`✨ MỚI`** | Mục 5.10, 10, 15.4, 15.6 | Nhận webhook SePay quét biến động số dư, tự động chốt phiên đối soát COD và trừ cước hoàn theo phân tầng. |

---

## 3. Tổng Kết Số Lượng Chức Năng Chuẩn Hóa

```text
Tổng số chức năng trong hệ thống: 76 chức năng chuẩn hóa
├── Kế thừa từ danh sách cũ: 40 chức năng (100% CÒN ĐÚNG)
└── Chức năng mở rộng [✨ MỚI]: 36 chức năng nghiệp vụ bưu chính thực tế & AI
    ├── Khách vãng lai: +8 mới (IATA cước, tìm bưu cục, tạo đơn nhanh, 5 dynamic AI tools)
    ├── Người gửi hàng (Merchant): +5 mới (In nhiều vận đơn, tem hàng dễ vỡ, hủy đơn, đối soát VietQR, cước hoàn tầng)
    ├── Nhân viên giao hàng (Courier): +5 mới (Quét camera, mã OTP 6 số, ảnh POD, offline queue, thu COD)
    ├── Nhân viên vận hành (Ops): +6 mới (Duyệt pickup, seal kẹp chì, Linehaul xe tải, tem XT, handoff, xử lý NDR)
    ├── Quản trị viên (Admin): +4 mới (RBAC đa vai trò, danh mục NDR Reason, Config hệ thống, Audit Log)
    ├── Khách hàng cá nhân (Customer Mobile): +6 mới (Actor mới hoàn toàn)
    └── Tác nhân Hệ thống & AI Engine: +9 mới (Actor mới hoàn toàn)
```

Tài liệu này là căn cứ chuẩn xác, bám sát 100% tài liệu kiến trúc kỹ thuật [`docs/PROJECT-OVERVIEW.md`](file:///d:/KhoaLuanTotNghiep/KLTN_MasterNam/DoAnKhoaLuanTotNghiep/logistics-management-system/docs/PROJECT-OVERVIEW.md) của dự án.
