# Kế hoạch Showcase: "Operations Analytics Dashboard" (Điểm nhấn Đồ án)

Tài liệu này hướng dẫn cách xây dựng trang **Dashboard Tổng quan Vận hành** cho ops-web. Đây sẽ là tính năng "Điểm nhấn" (Showcase) để trình diễn năng lực phân tích dữ liệu và thiết kế giao diện của hệ thống trong buổi bảo vệ đồ án.

---

## 1. Mục tiêu
- Tạo ấn tượng thị giác mạnh mẽ ngay khi người dùng đăng nhập vào ops-web.
- Thể hiện tư duy quản lý (Management/Ops level) bằng cách trực quan hóa các chỉ số vận hành quan trọng (Sản lượng, Tỷ lệ giao thành công, Ca bất thường).
- Chứng minh hệ thống có "Tầm nhìn" kiến trúc (Architecture vision) thông qua việc sử dụng trang Placeholder "Coming soon" cho các chức năng mở rộng khác.

---

## 2. Kế hoạch triển khai Dashboard

**Giao diện dự kiến:**
1. **Hàng trên cùng (Key Metrics):** 4 thẻ (Cards) hiển thị số liệu tổng quan.
   - Tổng đơn trong ngày (Ví dụ: 1,245)
   - Đang giao (Ví dụ: 65%)
   - Thành công (Ví dụ: 32%)
   - Bất thường/Cảnh báo (Ví dụ: 3%, màu đỏ nổi bật)
2. **Hàng giữa (Charts):** Sử dụng thư viện **Recharts**.
   - Biểu đồ Bar Chart: Sản lượng luân chuyển theo Hub trong 7 ngày qua.
   - Biểu đồ Donut/Pie Chart: Tỷ lệ các nguyên nhân giao hàng thất bại (NDR/Exception).
3. **Hàng dưới (Data Grid):**
   - Danh sách "Cảnh báo cần xử lý gấp" (5 đơn hàng lỗi/quá hạn) kèm nút "Xử lý ngay".

---

## 3. Prompt Yêu cầu Code (Cho lần làm việc tiếp theo)

> **Hướng dẫn sử dụng:** Copy đoạn nội dung trong khối blockquote dưới đây và gửi cho AI để bắt đầu triển khai Dashboard.

> ### 📝 Prompt: Triển khai Showcase Analytics Dashboard
>
> Hãy giúp tôi thiết kế và code trang Showcase "Operations Analytics Dashboard" cho ops-web. Đây sẽ là điểm nhấn báo cáo của đồ án.
>
> Yêu cầu các bước như sau:
>
> **Bước 1:** Cài đặt thư viện `recharts` vào workspace `ops-web`. (Chạy lệnh `npm install recharts --workspace=apps/ops-web` hoặc lệnh tương đương)
>
> **Bước 2:** Tạo một trang DashboardPage mới tại `apps/ops-web/src/pages/dashboard/DashboardPage.tsx`. Trang này sẽ bao gồm:
> - Hàng trên cùng: 4 Cards hiển thị Key Metrics (Tổng đơn, Tỷ lệ giao, Thành công, Cảnh báo). Dùng CSS Grid để bố cục.
> - Hàng giữa: 2 Biểu đồ dùng Recharts.
>   + Biểu đồ 1 (Bar Chart): Sản lượng luân chuyển theo Hub trong 7 ngày qua.
>   + Biểu đồ 2 (Donut Chart): Phân tích nguyên nhân giao hàng thất bại (NDR/Exception) (Ví dụ: Khách hẹn lại, Không nghe máy, Sai địa chỉ).
> - Tạo sẵn một cấu trúc dữ liệu Mock data chuyên nghiệp (trong file riêng hoặc trong component) cho các biểu đồ này để demo mượt mà.
> - Hàng dưới: Bảng hiển thị 5 "Cảnh báo cần xử lý gấp" với nút "Xử lý ngay".
>
> **Bước 3:** Đảm bảo trang này được gắn vào hệ thống Routing chính của ops-web để có thể truy cập được từ Sidebar hoặc coi như trang chủ sau khi đăng nhập.
>
> **Bước 4:** Tạo một component `ComingSoonPlaceholder.tsx` thật đẹp mắt (có icon/minh họa, câu thông báo "Tính năng đang được phát triển" và mô tả tầm nhìn). Dùng component này làm Placeholder cho 1-2 menu chưa làm kịp (ví dụ: Báo cáo công nợ).
>
> Hãy chú ý thiết kế UI thật "xịn", màu sắc hiện đại (dùng tông màu thương hiệu Nexus Logistics, thẻ Cảnh báo dùng màu đỏ/cam nổi bật) và có animation mượt mà.

---

## 4. Ý nghĩa của "Coming Soon Placeholder"
Việc có hàng chục chức năng báo cáo/quản lý là bình thường, nhưng thời gian làm đồ án có hạn. 
Trang Placeholder giải quyết vấn đề này:
- **Tránh màn hình trắng/lỗi:** Không để menu trống.
- **Chứng minh Tầm nhìn:** Hiển thị rằng bạn biết hệ thống cần tính năng đó (Ví dụ: "Module Báo cáo công nợ sẽ tích hợp AI dự đoán dòng tiền, ra mắt Phase 2").
- **Tạo cảm giác "Hệ thống lớn":** Giám khảo sẽ thấy khung sườn của một hệ thống Enterprise thực thụ dù bạn chỉ mới code xong các luồng cốt lõi.
