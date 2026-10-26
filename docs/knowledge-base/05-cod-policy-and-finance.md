# Chính Sách Quản Lý Tiền Thu Hộ COD & Đối Soát Tài Chính Nexus Logistics

## 1. Nguyên Tắc Quản Lý Tiền Thu Hộ COD
Tiền thu hộ COD (Cash On Delivery) là khoản tiền bưu tá thay mặt Chủ shop/Người gửi thu từ Người nhận khi phát bưu phẩm thành công.
- **Tính pháp lý của tiền COD:** Tiền COD thuộc quyền sở hữu của Người gửi. Công ty bưu chính và bưu tá chỉ đóng vai trò là bên được ủy quyền thu hộ và có nghĩa vụ bảo toàn, chuyển giao đúng hạn.
- **Phương thức thanh toán khi nhận hàng:** Người nhận có thể trả bằng **Tiền mặt** hoặc **Quét mã VietQR động** trên màn hình điện thoại của bưu tá. Khi quét VietQR, tiền được chuyển thẳng vào tài khoản chuyên dụng của công ty và cập nhật trạng thái "Đã thanh toán" tức thì.

## 2. Quy Định Đối Với Bưu Tá (Courier / Shipper) Trong Ca Làm Việc
Để ngăn ngừa rủi ro thất thoát hoặc chiếm dụng tiền COD:
- **Trần giữ tiền mặt trong ca (15.000.000 VNĐ):** Trong ca làm việc, nếu tổng số tiền mặt COD bưu tá đã thu đạt từ 15.000.000 VNĐ trở lên, ứng dụng Courier Mobile sẽ phát tín hiệu cảnh báo màu đỏ. Bưu tá phải quay về bưu cục nộp két bưu tá hoặc sử dụng tính năng nộp tiền SePay VietQR trước khi được phép tiếp tục đi giao các đơn tiếp theo.
- **Quy định chốt ca cuối ngày (Daily Cut-off 23:59):** Bưu tá kết ca trước 20:00 hàng ngày phải hoàn tất bàn giao tiền mặt cho Thủ quỹ bưu cục (nộp két) hoặc hoàn tất chuyển khoản SePay VietQR đúng theo số tiền hiển thị trên màn hình "Quyết toán thu hộ COD".
- **Chế tài tự động khóa tài khoản bưu tá nợ COD qua ngày:** Nếu bước sang ngày mới (sau 23:59) mà bưu tá vẫn còn số dư nợ COD chưa quyết toán, hệ thống sẽ **TỰ ĐỘNG KHÓA TÀI KHOẢN COURIER**. Bưu tá sẽ không thể nhận đơn phát mới, không xem được chi tiết hành trình cho đến khi hoàn tất thanh toán 100% số tiền nợ.

## 3. Lịch Trình Đối Soát & Chi Trả Tiền COD Cho Chủ Shop (Merchant B2B)
- **Chu kỳ đối soát tiêu chuẩn (Thứ 2 - Thứ 4 - Thứ 6):**
  - Đơn giao thành công Thứ 7, Chủ nhật và Thứ 2: Đối soát và chi trả vào Thứ 4.
  - Đơn giao thành công Thứ 3 và Thứ 4: Đối soát và chi trả vào Thứ 6.
  - Đơn giao thành công Thứ 5 và Thứ 6: Đối soát và chi trả vào Thứ 2 tuần kế tiếp.
- **Đối tác VIP Doanh Nghiệp (Key Account):** Hưởng chu kỳ đối soát linh hoạt theo ngày làm việc kế tiếp (T+1) hoặc theo yêu cầu riêng trong hợp đồng khung.
- **Hình thức chi trả tiền COD:** Chuyển khoản tự động theo danh sách lệnh chi (Batch Transfer) trực tiếp về số tài khoản ngân hàng của Chủ shop đã đăng ký trên cổng thông tin Merchant Web.

## 4. Quản Lý Công Nợ Ví Cước & Trần Nợ (-500.000 VNĐ) Của Shop
- **Công nợ cước phát sinh:** Bao gồm cước phí gửi hàng, phụ phí vượt cân, phí bảo hiểm khai giá và cước phí chuyển hoàn (50% cước chiều đi đối với đơn giao thất bại).
- **Quy tắc cấn trừ tự động:** Tiền cước phát sinh được hệ thống tự động cấn trừ vào số tiền COD thu hộ được đối soát trong kỳ.
- **Trần nợ cước (-500.000 VNĐ):** Nếu số tiền cước phát sinh vượt quá số tiền COD thu hộ (Số dư ví âm vượt quá -500.000 VNĐ), hệ thống sẽ **TẠM KHÓA TÍNH NĂNG TẠO ĐƠN MỚI** của shop.
- **Mở khóa tạo đơn:** Chủ shop mở cổng Merchant Web, bấm vào nút "Thanh toán công nợ", màn hình sẽ hiện mã VietQR động với đúng số tiền nợ. Sau khi shop chuyển khoản thành công, hệ thống SePay tự động bắt webhook và mở khóa tạo đơn trong vòng 30 giây.
