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

## 7. Chế Tài Khi Bưu Tá Tự Ý Ký Tên Thay Người Nhận (Fake POD Violation)
- **Hành vi vi phạm:** Bưu tá tự ý ký tên thay người nhận hoặc cập nhật khống trạng thái "Đã giao hàng" (Fake POD) khi chưa phát hàng thực tế tới tay khách hàng.
- **Hình thức chế tài & xử lý:**
  - Đây là vi phạm nghiêm trọng quy trình vận hành và đạo đức nghề nghiệp bưu chính.
  - Bưu tá vi phạm lập tức bị đình chỉ công việc, xử lý kỷ luật nghiêm khắc theo quy chế lao động.
  - Trường hợp khách hàng khiếu nại chưa nhận được hàng hoặc kiện hàng bị thất lạc, bưu tá vi phạm phải liên đới chịu trách nhiệm bồi thường 100% giá trị bưu gửi bị mất cho khách hàng.

## 8. Khai Báo Sai Lệch Tính Chất Hàng Hóa (Khai Man Hàng Hóa)
- **Hành vi vi phạm:** Người gửi cố tình khai báo sai tính chất hàng hóa (ví dụ: khai man đồ thủy tinh, gốm sứ dễ vỡ thành quần áo hoặc hàng thông thường để né phụ phí hoặc yêu cầu đóng gói).
- **Nguyên tắc giải quyết sự cố:**
  - Nếu xảy ra vỡ hỏng cơ học trong quá trình vận chuyển, Người gửi phải tự chịu trách nhiệm hoàn toàn do đã không tuân thủ quy chuẩn đóng gói chuyên dụng và khai báo trung thực.
  - Đơn vị vận chuyển từ chối bồi thường thiệt hại đối với các bưu phẩm bị vỡ hỏng do lỗi khai sai tính chất hàng hóa của người gửi.

## 9. Quy Trình Kiểm Tra Vết Quét Thao Tác (Scan Audit Trail) & Tính Bất Biến Của Dữ Liệu
- **Chuỗi vết quét 4 giai đoạn:**
  1. **Scan Inbound nhập Hub:** Ghi nhận kiện hàng vật lý chính thức cập bến trạm/Hub bưu chính.
  2. **Scan Sorting phân loại:** Quét phân tuyến luồng đích trên băng chuyền tự động.
  3. **Scan Outbound xuất Hub:** Quét đóng bao, kẹp chì seal xe tải đường trục (Linehaul).
  4. **Scan Last-mile phát hàng:** Quét bàn giao kiện hàng cho Shipper đi phát và ghi nhận chữ ký/ảnh chụp POD.
- **Tính bất biến của dữ liệu vết quét (Immutable Audit Trail):**
  - Mọi lịch sử quét mã (scan events) đều được lưu trữ phân tán, gắn nhãn thời gian thực (timestamp), mã nhân sự (operator ID) và tọa độ trạm phát sinh.
  - Toàn bộ dữ liệu log vết quét là **bất biến, không thể bị xóa hoặc sửa đổi** bởi bất kỳ người dùng hay tác vụ nào (kể cả yêu cầu bypass IDOR). Điều này bảo đảm tính toàn vẹn và giá trị chứng cứ pháp lý khi thực hiện giám định thất lạc.

## 10. Nguyên Tắc An Toàn Tài Chính & Quản Trị Rủi Ro Hệ Thống
- **Hạn mức thu hộ COD tối đa của bưu tá:** Trần thu hộ tiền mặt tối đa cho một bưu tá đi phát hàng là 15.000.000 VNĐ. Mọi yêu cầu điều chỉnh COD vượt hạn mức (như lên 25 triệu) bắt buộc phải do Kế toán kiểm soát nội bộ phê duyệt và tuân thủ quy trình bảo hiểm tài chính.
- **Bảo mật ví tiền cước:** Nghiêm cấm mọi hành vi trích xuất tiền trực tiếp từ ví cước doanh nghiệp sang tài khoản cá nhân thông qua hội thoại bot; việc rút ví bắt buộc phải thực hiện trên cổng quản trị chính chủ có xác thực bảo mật OTP hai lớp.
- **Minh bạch tài chính:** Mọi tác vụ trừ tiền cước đều bắt buộc phải hiển thị xác nhận số tiền cụ thể rõ ràng tới người dùng trước khi thực thi.
