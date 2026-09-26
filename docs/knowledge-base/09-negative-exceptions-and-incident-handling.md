# Quy Chuẩn Xử Lý Các Trường Hợp Lỗi, Ngoại Lệ & Sự Cố Vận Hành (Negative Scenarios)

Hệ thống Logistics Nexus quy chuẩn hóa quy trình xử lý cho 06 kịch bản ngoại lệ (Negative Cases) phát sinh trong quá trình vận hành bưu chính:

## 1. Trường Hợp Người Nhận Không Nghe Máy / Không Liên Lạc Được (NDR Case)
- **Quy trình bưu tá:**
  - Bưu tá phải thực hiện tối thiểu **02 cuộc gọi cách nhau ít nhất 15 phút** vào các thời điểm thích hợp trong ca giao.
  - Nếu sau 2 cuộc gọi không liên lạc được, bưu tá cập nhật trạng thái `DELIVERY_FAILED` với lý do `CUSTOMER_UNREACHABLE` trên Courier Mobile.
  - Hệ thống tự động gửi tin nhắn SMS / Zalo ZNS thông báo cho người nhận kèm thông tin số điện thoại của bưu tá để người nhận chủ động liên hệ lại.
- **Giới hạn số lần phát:** Mỗi bưu gửi được hỗ trợ **giao lại tối đa 03 lần hoàn toàn miễn phí** trong vòng 3 ngày làm việc tiếp theo.
- **Thời hạn lưu kho:** Sau 3 lần giao bất thành, bưu gửi được chuyển về lưu giữ tại Bưu cục phát trong thời gian **tối đa 05 ngày làm việc** để chờ người nhận đến lấy trực tiếp. Quá 5 ngày sẽ tự động kích hoạt tiến trình chuyển hoàn về cho Shop.

## 2. Trường Hợp Người Nhận Từ Chối Nhận Hàng (Bom Hàng / Hủy Nhận)
- **Xác nhận từ chối:** Khi người nhận tuyên bố không mua nữa, không có tiền thanh toán hoặc đổi ý:
  - Bưu tá gọi điện xác nhận nhanh với Chủ Shop (Merchant) để shop có cơ hội thuyết phục khách hàng hoặc hỗ trợ giảm giá trực tiếp.
  - Nếu khách hàng kiên quyết không nhận, bưu tá chọn lý do `CUSTOMER_REJECTED` (Khách từ chối nhận hàng).
- **Tiến trình chuyển hoàn (Returning):**
  - Đơn hàng lập tức được đảo chiều luân chuyển về địa chỉ người gửi (Origin Hub).
  - **Cước phí chuyển hoàn:**
    - Khách lẻ / Shop Tiêu chuẩn: Thu **50% cước phí chiều đi** (áp dụng trừ vào kỳ đối soát COD tiếp theo hoặc trừ số dư ví shop).
    - Đối tác VIP Enterprise (Sản lượng lớn): **0 VNĐ (Miễn phí hoàn 100%)**.
  - **Thời gian hoàn trả hàng:** Từ 02 đến 04 ngày làm việc đối với nội tỉnh, 03 đến 05 ngày làm việc đối với liên tỉnh.

## 3. Trường Hợp Hàng Hóa Bể Vỡ, Móp Méo Khi Đồng Kiểm
- **Quy trình xử lý tại hiện trường:**
  - Khi người nhận đồng kiểm phát hiện sản phẩm bên trong bị nứt vỡ, móp méo, rò rỉ dung dịch hoặc bao bì bị rách toạc:
  - Bưu tá và người nhận **lập Biên bản ghi nhận sự cố bất thường (Irregularity Report)** ngay tại chỗ, ghi rõ tình trạng thiệt hại thực tế.
  - Bưu tá dùng ứng dụng chụp ảnh sắc nét 4 góc kiện hàng, mã barcode vận đơn và chi tiết vết nứt vỡ.
  - Bưu tá và người nhận ký xác nhận điện tử trên màn hình điện thoại. Người nhận **không phải thanh toán bất kỳ khoản tiền nào** và không nhận kiện hàng.
- **Tiến trình bồi thường tự động:**
  - Bưu gửi được chuyển về Bộ phận Giám định Bồi thường của Hub trong vòng 24 giờ.
  - Hệ thống tự động tạo Hồ sơ bồi thường (Claim Ticket) dạng `CLM-YYYYMM-XXXX`.
  - Phê duyệt và giải ngân bồi thường trong vòng **24h - 48h** nếu hàng đã mua bảo hiểm khai giá.

## 4. Trường Hợp Bưu Phẩm Bị Thất Lạc Quá Hạn Trên Mạng Lưới (Lost Parcel)
- **Cơ chế phát hiện thất lạc tự động:**
  - Nếu một bưu gửi quá **07 ngày làm việc** kể từ lần quét barcode gần nhất tại Hub trung chuyển mà không có bất kỳ tín hiệu quét mã phát sinh nào tại các trạm tiếp theo:
  - Hệ thống tự động kích hoạt cờ cảnh báo `INVESTIGATING_LOST` (Đang điều tra thất lạc).
  - Bộ phận An ninh Vận hành truy xuất camera tại Hub xuất bến và xe tải Linehaul tương ứng để truy vết.
- **Phán quyết bồi thường:**
  - Nếu sau 48 giờ điều tra không tìm thấy bưu phẩm, đơn hàng chuyển sang trạng thái chính thức `LOST_IN_TRANSIT` (Mất bưu gửi).
  - Nexus Logistics chủ động chi trả **100% tiền bồi thường** cho Chủ shop/Người gửi theo hạn mức bảo hiểm mà không cần chờ người gửi khiếu nại.

## 5. Trường Hợp Gian Lận Trọng Lượng & Kích Thước (Weight/Dimension Fraud)
- **Cơ chế cân quét tự động DWS (Dimension Weight Scanner):**
  - Mọi kiện hàng khi nhập Hub trung tâm đều đi qua cổng máy quét laser DWS tự động cân đo trọng lượng và kích thước 3 chiều Dài x Rộng x Cao.
- **Chế tài xử lý sai lệch:**
  - Nếu trọng lượng thực tế hoặc thể tích quy đổi IATA vượt quá **15%** so với số liệu Người gửi đã tự khai báo khi tạo đơn:
  - Hệ thống tự động ghi đè trọng lượng tính cước chuẩn (Audit Chargeable Weight).
  - Tự động phát sinh khoản **Truy thu chênh lệch cước phí** + **Phí phạt vi phạm khai khống 10%** trừ thẳng vào số dư ví của shop.
  - Trường hợp shop cố tình vi phạm liên tiếp trên 05 đơn hàng, hệ thống sẽ tạm khóa quyền tạo đơn hàng loạt qua API.

## 6. Trường Hợp Phát Hiện Bưu Gửi Chứa Hàng Cấm Vận Chuyển
- **Hành vi vi phạm:** Bưu gửi chứa vũ khí quân dụng, chất ma túy, chất dễ cháy nổ (pháo hoa, xăng dầu, pin lithium trần không cách điện), văn hóa phẩm đồi trụy hoặc động vật hoang dã.
- **Xử lý pháp lý:**
  - Bưu tá hoặc nhân viên soi chiếu Hub lập tức phong tỏa hiện trường và lập biên bản niêm phong tang vật.
  - Bàn giao ngay toàn bộ tang vật cho cơ quan chức năng có thẩm quyền (Công an, Quản lý thị trường).
  - **Tuyệt đối không bồi thường** giá trị bưu gửi và không hoàn lại cước phí.
  - Khóa vĩnh viễn tài khoản người gửi và chuyển giao toàn bộ thông tin định danh cho cơ quan điều tra.
