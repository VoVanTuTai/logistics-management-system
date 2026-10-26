# Quy Định Cước Phí Vận Chuyển & Công Thức Trọng Lượng IATA Nexus Logistics

## 1. Nguyên Tắc Chiết Tính Cước Cơ Sở
Nexus Logistics áp dụng mô hình định giá lũy tiến theo nấc bưu chính:
- **Nấc cơ sở (Base Weight):** Áp dụng cho 0.5 kg (500 gram) đầu tiên của kiện hàng.
  - Gói Tiêu Chuẩn (Standard Delivery): 18.000 VNĐ.
  - Gói Nhanh (Express Delivery): 28.000 VNĐ.
  - Gói Hỏa Tốc Trong Ngày (Same-day Delivery): 42.000 VNĐ.
- **Nấc vượt cân (Incremental Weight):** Mỗi 0.5 kg tiếp theo tính thêm:
  - Gói Tiêu Chuẩn: +3.500 VNĐ / nấc 0.5 kg.
  - Gói Nhanh: +5.000 VNĐ / nấc 0.5 kg.
  - Gói Hỏa Tốc: +8.000 VNĐ / nấc 0.5 kg.

## 2. Công Thức Quy Đổi Thể Tích Theo Chuẩn IATA
Đối với các bưu gửi có thể tích cồng kềnh nhưng trọng lượng nhẹ (như gấu bông, gối nệm, thùng xốp rỗng, đồ chơi nhựa), Nexus Logistics áp dụng quy chuẩn của Hiệp hội Vận tải Hàng không Quốc tế (IATA) và Hiệp hội Logistics Việt Nam (VLA):

$$\text{Khối lượng quy đổi (kg)} = \frac{\text{Chiều Dài (cm)} \times \text{Chiều Rộng (cm)} \times \text{Chiều Cao (cm)}}{6000}$$

**Nguyên tắc áp dụng Khối lượng tính cước (Chargeable Weight):**
$$\text{Khối lượng tính cước} = \max(\text{Cân nặng thực tế}, \text{Khối lượng quy đổi thể tích})$$
- Nếu Thể tích quy đổi > Cân thực tế: Áp dụng khối lượng quy đổi thể tích để tính cước.
- Nếu Cân thực tế >= Thể tích quy đổi: Áp dụng cân nặng thực tế.

## 3. Phụ Phí Tuyến Vùng Miền (Zone Surcharge)
Căn cứ vào hành trình điều phối từ Hub gốc (Origin Hub) đến Hub đích (Destination Hub):
- **Nội tỉnh / Nội đô (Intra-Province):** 0 VNĐ phụ phí. Áp dụng khi điểm gửi và nhận cùng thuộc một tỉnh/thành phố.
- **Tuyến trục chính liên tỉnh (Metro Corridor):** +7.000 VNĐ. Áp dụng cho các tuyến trọng điểm có đường bay/đường bộ cao tốc trực tiếp (Hà Nội - Đà Nẵng - TP.HCM).
- **Tuyến liên tỉnh phổ thông (Inter-Province):** +12.000 VNĐ. Áp dụng cho các tuyến kết nối các tỉnh vùng sâu, vùng xa hoặc khác khu vực địa lý.

## 4. Phí Dịch Vụ Thu Hộ COD
- Miễn phí thu hộ COD đối với đơn hàng có số tiền thu hộ dưới 1.000.000 VNĐ.
- Đơn hàng có tiền thu hộ từ 1.000.000 VNĐ trở lên: Phí COD bằng 0.5% số tiền thu hộ, trần tối đa 35.000 VNĐ / đơn.

## 5. Chính Sách Phân Tầng Khách Hàng & Chiết Khấu Theo Sản Lượng (Customer Tiering)
Để đảm bảo an toàn dòng tiền và kích cầu kinh doanh, Nexus Logistics phân định rõ 03 tầng đối tượng khách hàng:
- **Tầng 1: Khách vãng lai / Khách lẻ (Walk-in / Guest):**
  - Khách gửi tại bưu cục hoặc tạo đơn đơn lẻ trên website không qua đăng ký đối tác.
  - Cước vận chuyển: Áp dụng 100% Biểu giá cơ sở niêm yết (Không chiết khấu).
  - Cước chuyển hoàn: Thu 50% cước chiều đi, thu tiền mặt hoặc quét VietQR khi giao dịch viên/bưu tá trả lại hàng tận tay (POD Return).
- **Tầng 2: Merchant Tiêu Chuẩn (Standard Merchant - Shop vừa & nhỏ):**
  - Đã đăng ký tài khoản Shop trên portal, xác thực CCCD/MST, sản lượng dưới 1.000 đơn/tháng.
  - Cước vận chuyển: Hưởng chiết khấu thương mại 5% - 10% theo bảng cước Merchant; hỗ trợ shipper lấy hàng tận nơi miễn phí (First-mile pickup).
  - Cước chuyển hoàn: **Vẫn áp dụng thu 50% cước chiều đi** để bù đắp chi phí trung chuyển ngược. Khác với khách lẻ, phí hoàn được tự động khấu trừ vào Bảng kê đối soát tiền thu hộ COD (COD Settlement Batch) hoặc số dư Ví Merchant.
- **Tầng 3: Merchant VIP Doanh Nghiệp (VIP Enterprise / Key Account):**
  - Ký Hợp đồng Hợp tác Chiến lược (Master Service Agreement), cam kết sản lượng lớn (trên 1.000 đơn/tháng) hoặc ký quỹ bảo lãnh thanh toán.
  - Cước vận chuyển: Bảng cước ưu đãi riêng theo hợp đồng (Contract-based Pricing), chiết khấu bậc thang theo doanh số tháng (15% - 25%).
  - Cước chuyển hoàn: **Được Quản trị viên cấu hình Miễn phí 0 VNĐ (Free Return)** hoặc mức đồng giá siêu ưu đãi (10.000 VNĐ/đơn) đóng vai trò như chính sách hỗ trợ bán hàng và giữ chân khách hàng lớn (Customer Retention).
  - Tài khoản VIP được quản lý bởi Chuyên viên phụ trách riêng (Dedicated Key Account Manager) và chu kỳ đối soát COD nhanh (T+1).
