# Quy Tắc Deploy GitHub

Tài liệu này định nghĩa các quy tắc bắt buộc khi deploy qua GitHub Actions.

## 1. Nhánh và quyền merge

- Chỉ deploy từ nhánh `main`.
- Mọi thay đổi vào `main` phải đi qua Pull Request, không push trực tiếp.
- Pull Request cần tối thiểu 1 reviewer approve.
- Nhánh `main` phải bật branch protection:
- `Require a pull request before merging`
- `Require status checks to pass before merging`
- `Require linear history`

## 2. Điều kiện trước khi deploy

- Workflow `ci.yml` phải pass toàn bộ:
- Lint
- Unit test
- Build
- Nếu có migration, phải kèm file migration và script rollback.
- Không được hardcode secret trong code hoặc file `.env`.

## 3. Quy tắc trigger deploy

- Workflow `cd.yml` chỉ chạy khi:
- Có merge mới vào `main`, hoặc
- Có tag release theo format `v*.*.*` (ví dụ: `v1.4.0`).
- Mỗi lần deploy phải gắn với một commit SHA cụ thể để truy vết.
- Mỗi environment (`staging`, `production`) phải sử dụng GitHub Environment riêng và bắt buộc review gate cho `production`.

## 4. Quản lý secrets và biến môi trường

- Secrets chỉ lưu trong GitHub Secrets/Environment Secrets.
- Đặt tên secret theo convention in hoa: `SERVICE_DB_URL`, `JWT_SECRET`, `RABBITMQ_URL`.
- Cấm log giá trị secret ra console.
- Cập nhật secret phải có ticket và người chịu trách nhiệm rõ ràng.

## 5. Checklist deploy production

- Xác nhận `ci.yml` xanh trên commit sẽ deploy.
- Xác nhận release note và migration impact.
- Kiểm tra health endpoint sau deploy (`/health` hoặc endpoint tương ứng).
- Kiểm tra logs 15 phút đầu sau deploy.
- Nếu có lỗi nghiêm trọng, rollback ngay theo mục 6.

## 6. Rollback

- Rollback về tag/commit gần nhất ổn định (không rollback bằng tay trên server).
- Nếu migration không backward-compatible, phải chạy script rollback đã được review trước đó.
- Sau rollback, tạo incident note gồm:
- Thời gian
- Nguyên nhân
- Ảnh hưởng
- Hành động khắc phục

## 7. Trách nhiệm

- Người mở Pull Request chịu trách nhiệm theo dõi deploy đến khi ổn định.
- Reviewer chịu trách nhiệm verify risk kỹ thuật và migration.
- Khi deploy production, bắt buộc có 1 người on-call sẵn sàng xử lý sự cố.
