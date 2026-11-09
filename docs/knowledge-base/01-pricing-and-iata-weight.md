# Quy Định Cước Phí Vận Chuyển & Công Thức Trọng Lượng IATA Nexus Logistics

## 1. Nguyên Tắc Chiết Tính Cước Cơ Sở
Nexus Logistics áp dụng mô hình định giá lũy tiến theo nấc bưu chính:
- **Nấc cơ sở (Base Weight):** Áp dụng cho 0.5 kg (500 gram) đầu tiên của kiện hàng.
  - Gói Tiêu Chuẩn (Standard Delivery): 18.000 VNĐ.
  - Gói Nhanh (Express Delivery): 28.000 VNĐ.
  - Gói Hỏa Tốc Trong Ngày (Same-day Delivery): 42.000 VNĐ.
- **Nấc vượt cân (Incremental Weight):** Mỗi 0.5 kg tiếp theo tính thêm:
  - Gói Tiêu Chuẩn: +3.500 VNĐ / nấc 0.5 kg.
  - Gói Nhanh (Express): +5.000 VNĐ / nấc 0.5 kg.
  - Gói Hỏa Tốc: +8.000 VNĐ / nấc 0.5 kg.
- **Gói Hỏa Tốc nội thành / cùng thành phố:** Giao ngay trong ngày có giá cơ sở từ 30.000 VNĐ đến 42.000 VNĐ tùy khu vực quận huyện.

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

## 6. Quy Chuẩn 3 Tầng Trần Vật Lý Tối Đa Của Mạng Lưới Bưu Cục
Để bảo đảm an toàn giao thông và quy chuẩn cơ sở vật chất Hub, Nexus Logistics quy định 3 tầng trần vật lý tối đa:
- **Trần vật lý tối đa của mạng lưới bưu cục tiêu chuẩn:**
  - Khối lượng thực tế: $\le 70\text{ kg}$ / kiện.
  - Chiều dài 1 cạnh lớn nhất: $\le 150\text{ cm}$.
  - Tổng kích thước 3 chiều: Dài + Rộng + Cao $\le 300\text{ cm}$.
- **Phân định 03 Tầng kiểm soát vận hành:**
  1. **Tầng 1 - Tiêu chuẩn (Standard Courier):** Khối lượng $\le 20\text{ kg}$ và mỗi cạnh $\le 60\text{ cm}$ $\rightarrow$ Bưu tá (Shipper) đi xe máy giao nhận bình thường tận nhà. Hàng nặng trên 20kg hoặc cồng kềnh GHN và Nexus không nhận giao bằng xe máy mà bắt buộc chuyển sang xe tải.
  2. **Tầng 2 - Cồng kềnh trong hạn mức (Bulky / Truck Dispatch):** Khối lượng từ $21\text{ kg} - 70\text{ kg}$ HOẶC cạnh lớn nhất từ $61\text{ cm} - 150\text{ cm}$ $\rightarrow$ Vẫn được bưu cục nhận gửi nhưng bắt buộc điều động xe tải chuyên dụng (Truck Dispatch) để vận chuyển hàng cồng kềnh, tự động tính cước thể tích IATA và gắn nhãn "CẦN XE TẢI / HÀNG CỒNG KỀNH". (Ví dụ kiện hàng đúng 70kg, kích thước 150x60x50cm thuộc đúng Tầng 2, được tiếp nhận nhưng đi xe tải).
  3. **Tầng 3 - VƯỢT TRẦN MẠNG LƯỚI (Over-limit Block):** Khối lượng $> 70\text{ kg}$ (ví dụ 70.5kg hoặc 95kg) HOẶC cạnh lớn nhất $> 150\text{ cm}$ (ví dụ 180cm) HOẶC tổng 3 chiều $> 300\text{ cm}$ (ví dụ 320cm) $\rightarrow$ **Chặn tạo đơn (Validation Error)**, hệ thống tự động từ chối tiếp nhận chuyển phát bưu phẩm thông thường, hướng dẫn khách hàng tách kiện hoặc chuyển sang dịch vụ Vận tải nguyên chuyến (FTL/Truckload).

- **Ví dụ tính cước thể tích IATA thực tế:**
  - Kiện hàng có kích thước $35\text{ cm} \times 25\text{ cm} \times 15\text{ cm}$, khối lượng thực tế $3\text{ kg}$:
  - Thể tích quy đổi IATA = $(35 \times 25 \times 15) / 6000 = 13.125 / 6000 = 2.18\text{ kg}$ (chính xác là 2.1875 kg quy tròn).
  - So sánh: Khối lượng thực tế ($3\text{ kg}$) lớn hơn khối lượng thể tích ($2.18\text{ kg}$).
  - Cân nặng tính cước (Chargeable Weight) = $\max(3, 2.18) = 3\text{ kg}$.

## 7. Phụ Phí Tuyến Huyện Đảo & Vùng Sâu Vùng Xa
- Tuyến gửi hàng ra các huyện đảo (Phú Quốc, Côn Đảo, Lý Sơn, Cát Bà...): Bưu gửi phát sinh thêm phụ phí kết nối tuyến hải đảo / biển đảo từ 10.000 VNĐ đến 25.000 VNĐ/đơn hàng tùy vào khối lượng và phương thức trung chuyển đường thủy/hàng không.
- Tuyến liên tỉnh phổ thông kết nối khác vùng địa lý: Phụ phí định mức từ 10.000 VNĐ đến 12.000 VNĐ.
