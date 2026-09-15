# Quy Định Cước Phí Vận Chuyển & Công Thức Trọng Lượng IATA Nexus Logistics

## 1. Nguyên Tắc Chiết Tính Cước Cơ Sở
Nexus Logistics áp dụng mô hình định giá lũy tiến theo nấc bưu chính:
- **Nấc cơ sở (Base Weight):** Áp dụng cho 0.5 kg (500 gram) đầu tiên của kiện hàng.
  - Gói Tiêu Chuẩn (Standard Delivery): 18.000 VNĐ.
  - Gói Nhanh (Express Delivery): 28.000 VNĐ.
  - Gói Hỏa Tốc Trong Ngày (Same-day Delivery): 42.000 VNĐ.
- **Nấc vượt cân (Incremental Weight):** Mỗi 0.5 kg tiếp theo tính thêm:
  - Gói Tiêu Chuẩn: +3.000 VNĐ / nấc 0.5 kg.
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
