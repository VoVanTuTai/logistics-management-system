#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE ACTOR-SPECIFIC USE CASE DIAGRAMS (A4 PORTRAIT / ZERO-COLLISION 2-SUBCOLUMN BLUEPRINT)
=============================================================================================
Bố cục định hướng DỌC A4 chuẩn hóa chống dính chùm, đè chữ, giao cắt mũi tên:
- Chiều rộng 1540px chuẩn hóa, tăng khoảng cách các khối (khoảng cách giữa các Phân hệ nghiệp vụ 50px,
  hành lang giữa Cụm Nghiệp vụ và Cụm Xác thực rộng 60px).
- Cột bên trái (Left Business Packages): pkg_x=245, pkg_w=580 (245..825).
  - Phân cột A (Base Use Cases): cx=365, rx=118, ry=40.
  - Phân cột B (Extension / Detail): cx=700, rx=118, ry=40.
  -> Khoảng cách giữa 2 phân cột nghiệp vụ rộng 100px (483..582), mũi tên và badge «include»/«extend» hoàn toàn thông thoáng.
- Cột bên phải (Auth / Account Cluster): auth_x=885, auth_w=615 (885..1500).
  - Phân cột A (Login / Base): cx=1005, rx=110, ry=42.
  - Phân cột B (Auth Extensions): cx=1380, rx=105, ry=34..36.
  -> Khoảng cách giữa Login và Extensions rộng 160px (1115..1275), tuyệt đối không va chạm hoặc đè chữ.
- Hành lang liên kết (Cross-column corridor): Rãnh rộng 60px (825..885) dẫn các đường «include» liên kết ngang sang cụm Đăng nhập.
- Tác nhân (Actor) bên trái: Tỏa các đường liên kết (Association) từ dải tọa độ trải đều theo trục dọc, không chụm một điểm.
"""

import os
import sys
from actor_usecase_helpers import (
    wrap_svg, draw_header, draw_actor, draw_package,
    draw_usecase, draw_assoc_line, draw_dependency_arrow,
    draw_manhattan_dep_arrow, draw_distributed_actor_assocs,
    draw_footer_legend, xml_esc
)

# =============================================================================
# 1. SYSTEM ADMIN (A4 PORTRAIT)
# =============================================================================
def generate_admin_diagram():
    width = 1540
    height = 980
    drawing_code = "UC-ACT-ADM-01"
    actor_code = "ACT-ADM"
    main_title = "SƠ ĐỒ USE CASE TÁC NHÂN: QUẢN TRỊ VIÊN (SYSTEM ADMIN)"
    sub_title = "Cột trái: Nghiệp vụ Quản trị & Mạng lưới • Cột phải: Cụm Xác thực & Bảo mật • Mũi tên phân tách chuẩn UML 2.5"
    
    parts = []
    parts.append(draw_header(width, main_title, sub_title, drawing_code, actor_code))
    
    # System Boundary (Generous margins, comfortable package spacing)
    sb_x, sb_y, sb_w, sb_h = 230, 115, 1285, 775
    parts.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    parts.append('  <g id="System_Boundary">')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="650" height="38" class="sys-header"/>')
    parts.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-sys">«system» PHÂN HỆ QUẢN TRỊ TOÀN HỆ THỐNG (ADMIN-WEB PORTAL)</text>')
    parts.append('  </g>')
    
    # Actor stick figure
    actor_cx, actor_cy = 120, 500
    parts.append(draw_actor(actor_cx, actor_cy, "Quản Trị Viên", "System Admin", "admin-web (:3001)", "13 Use Cases (Dọc A4)"))
    
    # Left Column: Business Area (x=245, w=580)
    # Pkg 1: Tài Khoản & Phân Quyền RBAC (y=160, h=260)
    parts.append(draw_package(245, 160, 580, 260, 380, "PHÂN HỆ 1: TÀI KHOẢN &amp; PHÂN QUYỀN RBAC", "Pkg_User_RBAC"))
    parts.append(draw_usecase(365, 240, 118, 40, "UC-ADM-03", "Quản lý tài khoản toàn hệ thống", "Kế thừa"))
    parts.append(draw_usecase(700, 240, 118, 40, "UC-ADM-04", "Phân công nhân sự &amp; tuyến giao", "Kế thừa"))
    parts.append(draw_usecase(365, 355, 118, 40, "UC-ADM-05", "Quản lý phân quyền vai trò RBAC", "MỚI"))
    parts.append(draw_usecase(700, 355, 118, 40, "UC-ADM-06", "Cấu hình Permission Override", "Kế thừa"))
    
    # Pkg 2: Mạng Lưới Hub, Vùng Cước & Cấu Hình (y=470, h=390) -> Gap 50px between Pkg 1 & Pkg 2
    parts.append(draw_package(245, 470, 580, 390, 410, "PHÂN HỆ 2: MẠNG LƯỚI HUB &amp; THAM SỐ HỆ THỐNG", "Pkg_Network_Config"))
    parts.append(draw_usecase(365, 550, 118, 40, "UC-ADM-07", "Quản lý mạng lưới Hub 4 cấp", "Kế thừa"))
    parts.append(draw_usecase(700, 550, 118, 40, "UC-ADM-08", "Quản trị phân vùng 3 vùng cước", "Kế thừa"))
    parts.append(draw_usecase(365, 660, 118, 40, "UC-ADM-10", "Cấu hình tham số toàn hệ thống", "MỚI"))
    parts.append(draw_usecase(700, 660, 118, 40, "UC-ADM-09", "Cấu hình danh mục lý do NDR", "MỚI"))
    parts.append(draw_usecase(365, 770, 118, 40, "UC-ADM-11", "Kiểm toán nhật ký hệ thống", "MỚI"))
    
    # Right Column: Auth Cluster (x=885, w=615, y=410, h=390) -> 60px corridor between left & right
    parts.append(draw_package(885, 410, 615, 390, 340, "CỤM XÁC THỰC &amp; BẢO MẬT", "Pkg_Auth_Sec", tab_x_offset=180))
    parts.append(draw_usecase(1005, 605, 110, 42, "UC-ADM-01", "Đăng nhập hệ thống (Token)", "Kế thừa"))
    parts.append(draw_usecase(1380, 495, 105, 34, "UC-ADM-01a", "Đổi mật khẩu &amp; 2FA", "MỚI"))
    parts.append(draw_usecase(1380, 605, 105, 34, "UC-ADM-01b", "Khôi phục mật khẩu quản trị", "Kế thừa"))
    parts.append(draw_usecase(1380, 715, 105, 34, "UC-ADM-02", "Đăng xuất an toàn hệ thống", "Kế thừa"))
    
    # Actor Associations (Distributed origins along vertical spine)
    actor_targets = [
        (365, 240, 118, 40),
        (365, 355, 118, 40),
        (365, 550, 118, 40),
        (365, 660, 118, 40),
        (365, 770, 118, 40)
    ]
    parts.append('  <!-- Actor Associations (Distributed) -->')
    parts.append(draw_distributed_actor_assocs(actor_cx, actor_cy, actor_targets))
    
    # Internal Dependencies (Horizontal or Direct Adjacent)
    parts.append('  <!-- Internal Dependencies -->')
    parts.append(draw_dependency_arrow(700, 240, 118, 40, 365, 240, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(700, 355, 118, 40, 365, 355, 118, 40, "«extend»", 14))
    parts.append(draw_dependency_arrow(700, 550, 118, 40, 365, 550, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(700, 660, 118, 40, 365, 660, 118, 40, "«include»", 14))
    
    # Dependencies inside Auth Cluster (Generous 160px gap, perfectly separated)
    parts.append('  <!-- Auth Cluster Dependencies -->')
    parts.append(draw_dependency_arrow(1380, 495, 105, 34, 1005, 605, 110, 42, "«extend»", 14))
    parts.append(draw_dependency_arrow(1380, 605, 105, 34, 1005, 605, 110, 42, "«extend»", 14))
    parts.append(draw_dependency_arrow(1380, 715, 105, 34, 1005, 605, 110, 42, "«extend»", 14))
    
    # Cross-Column Includes to Login (Diagonal Fan-In to UC-ADM-01 at 1005, 605)
    parts.append('  <!-- Cross-Column Auth Includes (Diagonal Fan-In) -->')
    # Track 1: UC-ADM-03 -> UC-ADM-01 (Step down to y=295 in inter-row channel, diagonal into top-left arc)
    parts.append(draw_manhattan_dep_arrow([(483, 240), (510, 240), (510, 295), (855, 295), (965.0, 570.0)], "«include»", 550, 295))
    # Track 2: UC-ADM-05 -> UC-ADM-01 (Step down to y=405, under UC-ADM-06, diagonal into upper-left shoulder)
    parts.append(draw_manhattan_dep_arrow([(483, 355), (510, 355), (510, 405), (855, 405), (930.0, 580.0)], "«include»", 550, 405))
    # Track 3: UC-ADM-07 -> UC-ADM-01 (Step down to y=585, under UC-ADM-08, straight into left tip of Login)
    parts.append(draw_manhattan_dep_arrow([(483, 550), (510, 550), (510, 585), (855, 585), (895.0, 605.0)], "«include»", 550, 585))
    # Track 4: UC-ADM-11 -> UC-ADM-01 (Diagonal up-right into bottom-left arc)
    parts.append(draw_manhattan_dep_arrow([(483, 770), (855, 770), (935.0, 630.0)], "«include»", 670, 770))
    
    parts.append(draw_footer_legend(width, height))
    return wrap_svg(width, height, "\n".join(parts))


# =============================================================================
# 2. OPS STAFF (A4 PORTRAIT)
# =============================================================================
def generate_ops_diagram():
    width = 1540
    height = 1550
    drawing_code = "UC-ACT-OPS-01"
    actor_code = "ACT-OPS"
    main_title = "SƠ ĐỒ USE CASE TÁC NHÂN: NHÂN VIÊN VẬN HÀNH (OPS STAFF)"
    sub_title = "Cột trái: Quy trình Bưu cục, Đóng bao, Xe tải Linehaul & COD • Cột phải: Cụm Xác thực bưu cục • Mũi tên phân tách chuẩn UML 2.5"
    
    parts = []
    parts.append(draw_header(width, main_title, sub_title, drawing_code, actor_code))
    
    # System Boundary (Tightly proportioned, spacious block separation)
    sb_x, sb_y, sb_w, sb_h = 230, 115, 1285, 1335
    parts.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    parts.append('  <g id="System_Boundary">')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="700" height="38" class="sys-header"/>')
    parts.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-sys">«system» ĐIỀU HÀNH &amp; VẬN HÀNH BƯU CỤC - HUB (OPS-WEB PORTAL)</text>')
    parts.append('  </g>')
    
    # Actor stick figure
    actor_cx, actor_cy = 120, 780
    parts.append(draw_actor(actor_cx, actor_cy, "Nhân Viên Vận Hành", "Ops Staff / Bưu Cục", "ops-web (:3002)", "21 Use Cases (Dọc A4)"))
    
    # Left Column: Business Area (x=245, w=580)
    # Pkg 1: Quầy Bưu Cục & Điều Phối (y=160, h=360, ends at 520)
    parts.append(draw_package(245, 160, 580, 360, 380, "PHÂN HỆ 1: TIẾP NHẬN QUẦY &amp; ĐIỀU PHỐI", "Pkg_Ops_Counter"))
    parts.append(draw_usecase(365, 235, 118, 40, "UC-OPS-05", "Tạo đơn hàng tại quầy", "Kế thừa"))
    parts.append(draw_usecase(365, 345, 118, 40, "UC-OPS-06", "Phê duyệt yêu cầu Pickup", "MỚI"))
    parts.append(draw_usecase(700, 345, 118, 40, "UC-OPS-07", "Phân công nhiệm vụ shipper", "Kế thừa"))
    parts.append(draw_usecase(365, 455, 118, 40, "UC-OPS-03", "Giám sát Dashboard vận hành", "Kế thừa"))
    parts.append(draw_usecase(700, 455, 118, 40, "UC-OPS-04", "Tra cứu hành trình đơn GPS", "Kế thừa"))
    
    # Pkg 2: Đóng Bao & Xe Tải Linehaul (y=570, h=440, ends at 1010) -> Gap 50px between Pkg 1 & Pkg 2!
    parts.append(draw_package(245, 570, 580, 440, 400, "PHÂN HỆ 2: ĐÓNG BAO &amp; XE TẢI LINEHAUL", "Pkg_Ops_Hub"))
    parts.append(draw_usecase(365, 650, 118, 40, "UC-OPS-08", "Quản lý manifest / Đóng bao", "Kế thừa"))
    parts.append(draw_usecase(700, 650, 118, 40, "UC-OPS-09", "Đóng seal niêm phong chì", "MỚI"))
    parts.append(draw_usecase(700, 745, 118, 38, "UC-OPS-14", "Gỡ bao &amp; kiểm đếm chia chọn", "Kế thừa"))
    parts.append(draw_usecase(365, 835, 118, 40, "UC-OPS-10", "Quản lý chuyến xe tải trung chuyển", "MỚI"))
    parts.append(draw_usecase(700, 835, 118, 40, "UC-OPS-11", "Cấp tem niêm phong xe (XT)", "MỚI"))
    parts.append(draw_usecase(365, 945, 118, 40, "UC-OPS-12", "Quét xuất kho xe đi (Outbound)", "Kế thừa"))
    parts.append(draw_usecase(700, 945, 118, 40, "UC-OPS-13", "Quét nhập kho xe đến (Inbound)", "Kế thừa"))
    
    # Pkg 3: Bàn Giao Phát, NDR & COD (y=1060, h=360, ends at 1420) -> Gap 50px between Pkg 2 & Pkg 3!
    parts.append(draw_package(245, 1060, 580, 360, 420, "PHÂN HỆ 3: BÀN GIAO PHÁT, NDR &amp; ĐỐI SOÁT COD", "Pkg_Ops_Lastmile"))
    parts.append(draw_usecase(365, 1135, 118, 40, "UC-OPS-15", "Quét bàn giao cho bưu tá", "MỚI"))
    parts.append(draw_usecase(700, 1135, 118, 40, "UC-OPS-16", "Xử lý sự cố giao thất bại (NDR)", "MỚI"))
    parts.append(draw_usecase(700, 1235, 118, 38, "UC-OPS-17", "Quản lý chuyển hoàn (Return)", "Kế thừa"))
    parts.append(draw_usecase(365, 1335, 118, 40, "UC-OPS-18", "Đối soát COD &amp; Mã VietQR", "Kế thừa"))
    parts.append(draw_usecase(700, 1335, 118, 40, "UC-OPS-19", "Phê duyệt quyết toán COD mặt", "MỚI"))
    
    # Right Column: Auth Cluster Centered in Middle (x=885, w=615, y=660, h=380, ends at 1040)
    parts.append(draw_package(885, 660, 615, 380, 360, "CỤM XÁC THỰC &amp; CA TRỰC BƯU CỤC", "Pkg_Ops_Auth", tab_x_offset=180))
    parts.append(draw_usecase(1005, 850, 110, 42, "UC-OPS-01", "Đăng nhập hệ thống bưu cục", "Kế thừa"))
    parts.append(draw_usecase(1380, 740, 105, 34, "UC-OPS-01a", "Đổi mật khẩu nhân viên", "MỚI"))
    parts.append(draw_usecase(1380, 850, 105, 34, "UC-OPS-01b", "Quên / Khôi phục mật khẩu", "Kế thừa"))
    parts.append(draw_usecase(1380, 960, 105, 34, "UC-OPS-02", "Đăng xuất an toàn hệ thống", "Kế thừa"))
    
    # Actor Associations
    actor_targets = [
        (365, 235, 118, 40),
        (365, 345, 118, 40),
        (365, 650, 118, 40),
        (365, 835, 118, 40),
        (365, 1135, 118, 40),
        (365, 1335, 118, 40)
    ]
    parts.append('  <!-- Actor Associations (Distributed) -->')
    parts.append(draw_distributed_actor_assocs(actor_cx, actor_cy, actor_targets))
    
    # Internal Dependencies
    parts.append('  <!-- Internal Dependencies -->')
    parts.append(draw_dependency_arrow(700, 345, 118, 40, 365, 345, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(700, 455, 118, 40, 365, 455, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(700, 650, 118, 40, 365, 650, 118, 40, "«extend»", 14))
    parts.append(draw_dependency_arrow(700, 745, 118, 38, 365, 650, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(700, 835, 118, 40, 365, 835, 118, 40, "«extend»", 14))
    parts.append(draw_dependency_arrow(700, 945, 118, 40, 365, 945, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(700, 1135, 118, 40, 365, 1135, 118, 40, "«extend»", 14))
    parts.append(draw_dependency_arrow(700, 1235, 118, 38, 700, 1135, 118, 40, "«extend»", 20))
    parts.append(draw_dependency_arrow(700, 1335, 118, 40, 365, 1335, 118, 40, "«extend»", 14))
    
    # Auth Cluster Dependencies (Generous 160px gap, no collision!)
    parts.append('  <!-- Auth Cluster Dependencies -->')
    parts.append(draw_dependency_arrow(1380, 740, 105, 34, 1005, 850, 110, 42, "«extend»", 14))
    parts.append(draw_dependency_arrow(1380, 850, 105, 34, 1005, 850, 110, 42, "«extend»", 14))
    parts.append(draw_dependency_arrow(1380, 960, 105, 34, 1005, 850, 110, 42, "«extend»", 14))
    
    # Cross-Column Includes to Login (Diagonal Fan-In)
    parts.append('  <!-- Cross-Column Auth Includes (Diagonal Fan-In) -->')
    # Track 1: Quầy Walk-in (Diagonal down-right into top-left arc of Login)
    parts.append(draw_manhattan_dep_arrow([(483, 235), (855, 235), (980.0, 815.0)], "«include»", 670, 235))
    # Track 2: Đóng bao manifest (via generous y=545 corridor between Pkg 1 & Pkg 2)
    parts.append(draw_manhattan_dep_arrow([(365, 610), (365, 545), (855, 545), (935.0, 825.0)], "«include»", 550, 545))
    # Track 3: Xe tải linehaul (Gentle diagonal into middle-left tip of Login)
    parts.append(draw_manhattan_dep_arrow([(483, 835), (510, 835), (510, 885), (855, 885), (895.0, 850.0)], "«include»", 550, 885))
    # Track 4: Bàn giao phát (via generous y=1035 corridor between Pkg 2 & Pkg 3)
    parts.append(draw_manhattan_dep_arrow([(365, 1095), (365, 1035), (855, 1035), (935.0, 875.0)], "«include»", 550, 1035))
    # Track 5: Đối soát COD (via bottom corridor at y=1395)
    parts.append(draw_manhattan_dep_arrow([(365, 1375), (365, 1395), (855, 1395), (980.0, 885.0)], "«include»", 550, 1395))
    
    parts.append(draw_footer_legend(width, height))
    return wrap_svg(width, height, "\n".join(parts))


# =============================================================================
# 3. SHIPPER / COURIER (A4 PORTRAIT)
# =============================================================================
def generate_courier_diagram():
    width = 1540
    height = 1290
    drawing_code = "UC-ACT-DRV-01"
    actor_code = "ACT-DRV"
    main_title = "SƠ ĐỒ USE CASE TÁC NHÂN: NHÂN VIÊN GIAO HÀNG (COURIER)"
    sub_title = "Cột trái: Quy trình Scan Pickup, Phát hàng OTP & POD, Nộp COD • Cột phải: Cụm Xác thực Mobile • Mũi tên phân tách chuẩn UML 2.5"
    
    parts = []
    parts.append(draw_header(width, main_title, sub_title, drawing_code, actor_code))
    
    # System Boundary (Tightly proportioned, no empty bottom void)
    sb_x, sb_y, sb_w, sb_h = 230, 115, 1285, 1080
    parts.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    parts.append('  <g id="System_Boundary">')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="680" height="38" class="sys-header"/>')
    parts.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-sys">«system» ỨNG DỤNG DI ĐỘNG BƯU TÁ GIAO NHẬN (COURIER-MOBILE)</text>')
    parts.append('  </g>')
    
    # Actor stick figure
    actor_cx, actor_cy = 120, 650
    parts.append(draw_actor(actor_cx, actor_cy, "Nhân Viên Giao Hàng", "Bưu Tá (Courier)", "courier-mobile", "15 Use Cases (Dọc A4)"))
    
    # Left Column: Business Area (x=245, w=580)
    # Pkg 1: Ca Trực & Thu Gom (y=160, h=155, ends at 315)
    parts.append(draw_package(245, 160, 580, 155, 380, "PHÂN HỆ 1: NHIỆM VỤ &amp; THU GOM SHOP", "Pkg_Courier_Pickup"))
    parts.append(draw_usecase(365, 240, 118, 40, "UC-DRV-03", "Quản lý danh sách nhiệm vụ ngày", "Kế thừa"))
    parts.append(draw_usecase(700, 240, 118, 40, "UC-DRV-04", "Xác nhận lấy hàng (Scan Pickup)", "Kế thừa"))
    
    # Pkg 2: Giao Hàng, OTP & Bằng Chứng POD (y=365, h=375, ends at 740) -> Gap 50px between Pkg 1 & Pkg 2!
    parts.append(draw_package(245, 365, 580, 375, 410, "PHÂN HỆ 2: GIAO HÀNG, OTP 6 SỐ &amp; BẰNG CHỨNG POD", "Pkg_Courier_Delivery"))
    parts.append(draw_usecase(365, 445, 118, 40, "UC-DRV-05", "Liên hệ người nhận hẹn phát", "Kế thừa"))
    parts.append(draw_usecase(700, 445, 118, 40, "UC-DRV-09", "Báo cáo sự cố phát thất bại", "Kế thừa"))
    parts.append(draw_usecase(365, 565, 118, 40, "UC-DRV-08", "Xác nhận phát thành công", "Kế thừa"))
    parts.append(draw_usecase(700, 565, 118, 40, "UC-DRV-06", "Xác thực mã OTP 6 số", "MỚI"))
    parts.append(draw_usecase(700, 675, 118, 38, "UC-DRV-07", "Chụp ảnh bằng chứng POD", "MỚI"))
    
    # Pkg 3: Thu Hộ Tiền Mặt & Nộp COD (y=790, h=375, ends at 1165) -> Gap 50px between Pkg 2 & Pkg 3!
    parts.append(draw_package(245, 790, 580, 375, 400, "PHÂN HỆ 3: QUẢN LÝ TIỀN THU HỘ COD &amp; NỘP TIỀN", "Pkg_Courier_COD"))
    parts.append(draw_usecase(365, 870, 118, 40, "UC-DRV-10", "Thu hộ tiền mặt COD", "MỚI"))
    parts.append(draw_usecase(365, 990, 118, 40, "UC-DRV-11", "Nộp tiền COD qua VietQR", "Kế thừa"))
    parts.append(draw_usecase(700, 990, 118, 40, "UC-DRV-12", "Quyết toán tiền mặt tại két", "Kế thừa"))
    parts.append(draw_usecase(700, 1090, 118, 38, "UC-DRV-13", "Giám sát hạn mức công nợ", "MỚI"))
    
    # Right Column: Auth Cluster Centered in Middle (x=885, w=615, y=475, h=380, ends at 855)
    parts.append(draw_package(885, 475, 615, 380, 340, "CỤM XÁC THỰC ỨNG DỤNG DI ĐỘNG", "Pkg_Courier_Auth", tab_x_offset=180))
    parts.append(draw_usecase(1005, 665, 110, 42, "UC-DRV-01", "Đăng nhập ứng dụng di động", "Kế thừa"))
    parts.append(draw_usecase(1380, 555, 105, 34, "UC-DRV-01a", "Đổi mật khẩu tài xế", "MỚI"))
    parts.append(draw_usecase(1380, 665, 105, 34, "UC-DRV-01b", "Quên mật khẩu qua SMS OTP", "MỚI"))
    parts.append(draw_usecase(1380, 775, 105, 34, "UC-DRV-02", "Đăng xuất và chốt ca trực", "Kế thừa"))
    
    # Actor Associations
    actor_targets = [
        (365, 240, 118, 40),
        (365, 445, 118, 40),
        (365, 565, 118, 40),
        (365, 870, 118, 40),
        (365, 990, 118, 40)
    ]
    parts.append('  <!-- Actor Associations (Distributed) -->')
    parts.append(draw_distributed_actor_assocs(actor_cx, actor_cy, actor_targets))
    
    # Internal Dependencies
    parts.append('  <!-- Internal Dependencies -->')
    parts.append(draw_dependency_arrow(700, 240, 118, 40, 365, 240, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(700, 445, 118, 40, 365, 445, 118, 40, "«extend»", 14))
    parts.append(draw_dependency_arrow(365, 565, 118, 40, 365, 445, 118, 40, "«include»", 24))
    parts.append(draw_dependency_arrow(365, 565, 118, 40, 700, 565, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(365, 565, 118, 40, 700, 675, 118, 38, "«include»", 14))
    parts.append(draw_dependency_arrow(365, 565, 118, 40, 365, 870, 118, 40, "«include»", 24))
    parts.append(draw_dependency_arrow(700, 990, 118, 40, 365, 990, 118, 40, "«extend»", 14))
    parts.append(draw_dependency_arrow(700, 1090, 118, 38, 365, 990, 118, 40, "«extend»", 14))
    
    # Auth Cluster Dependencies (Generous 160px gap, no collision!)
    parts.append('  <!-- Auth Cluster Dependencies -->')
    parts.append(draw_dependency_arrow(1380, 555, 105, 34, 1005, 665, 110, 42, "«extend»", 14))
    parts.append(draw_dependency_arrow(1380, 665, 105, 34, 1005, 665, 110, 42, "«extend»", 14))
    parts.append(draw_dependency_arrow(1380, 775, 105, 34, 1005, 665, 110, 42, "«extend»", 14))
    
    # Cross-Column Includes to Login (Diagonal Fan-In)
    parts.append('  <!-- Cross-Column Auth Includes (Diagonal Fan-In) -->')
    # Track 1: UC-DRV-03 -> UC-DRV-01 (Step down to y=295 in inter-row channel, diagonal down into top-left arc)
    parts.append(draw_manhattan_dep_arrow([(483, 240), (510, 240), (510, 295), (855, 295), (965.0, 630.0)], "«include»", 550, 295))
    # Track 2: UC-DRV-08 -> UC-DRV-01 (Step up to y=510, between row 1 & row 2, diagonal into upper-left arc)
    parts.append(draw_manhattan_dep_arrow([(483, 565), (510, 565), (510, 510), (855, 510), (930.0, 640.0)], "«include»", 550, 510))
    # Track 3: UC-DRV-11 -> UC-DRV-01 (Step down to y=1130, under UC-DRV-13, diagonal up into lower-left arc)
    parts.append(draw_manhattan_dep_arrow([(483, 990), (510, 990), (510, 1130), (855, 1130), (965.0, 700.0)], "«include»", 550, 1130))
    
    parts.append(draw_footer_legend(width, height))
    return wrap_svg(width, height, "\n".join(parts))


# =============================================================================
# 4. MERCHANT (A4 PORTRAIT)
# =============================================================================
def generate_merchant_diagram():
    width = 1540
    height = 1180
    drawing_code = "UC-ACT-MER-01"
    actor_code = "ACT-MER"
    main_title = "SƠ ĐỒ USE CASE TÁC NHÂN: NGƯỜI GỬI HÀNG (MERCHANT / CHỦ SHOP)"
    sub_title = "Cột trái: Tạo đơn, In nhãn, Quản lý vòng đời & Đối soát SePay • Cột phải: Cụm Đăng ký & Xác thực Shop • Mũi tên phân tách chuẩn UML 2.5"
    
    parts = []
    parts.append(draw_header(width, main_title, sub_title, drawing_code, actor_code))
    
    # System Boundary (Tightly proportioned, no empty bottom void)
    sb_x, sb_y, sb_w, sb_h = 230, 115, 1285, 955
    parts.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    parts.append('  <g id="System_Boundary">')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="700" height="38" class="sys-header"/>')
    parts.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-sys">«system» CỔNG QUẢN TRỊ DÀNH CHO KHÁCH HÀNG DOANH NGHIỆP (MERCHANT-WEB)</text>')
    parts.append('  </g>')
    
    # Actor stick figure
    actor_cx, actor_cy = 120, 590
    parts.append(draw_actor(actor_cx, actor_cy, "Người Gửi Hàng", "Chủ Shop B2B", "merchant-web (:3003)", "18 Use Cases (Dọc A4)"))
    
    # Left Column: Business Area (x=245, w=580)
    # Pkg 1: Tạo Đơn Hàng & In Ấn (y=160, h=255, ends at 415)
    parts.append(draw_package(245, 160, 580, 255, 380, "PHÂN HỆ 1: TẠO ĐƠN &amp; IN ẤN NHÃN BƯU PHẨM", "Pkg_Merchant_Creation"))
    parts.append(draw_usecase(365, 235, 118, 40, "UC-MER-04", "Tạo đơn hàng (Web Form)", "Kế thừa"))
    parts.append(draw_usecase(700, 235, 118, 40, "UC-MER-05", "In nhãn đơn lẻ (A6/A7)", "Kế thừa"))
    parts.append(draw_usecase(365, 355, 118, 40, "UC-MER-07", "Tem Hàng Dễ Vỡ [FRAGILE]", "MỚI"))
    parts.append(draw_usecase(700, 355, 118, 40, "UC-MER-06", "In nhiều vận đơn hàng loạt", "MỚI"))
    
    # Pkg 2: Vòng Đời Đơn Hàng & Xử Lý Sự Cố (y=465, h=365, ends at 830) -> Gap 50px between Pkg 1 & Pkg 2!
    parts.append(draw_package(245, 465, 580, 365, 400, "PHÂN HỆ 2: QUẢN LÝ ĐƠN &amp; VÒNG ĐỜI VẬN CHUYỂN", "Pkg_Merchant_Lifecycle"))
    parts.append(draw_usecase(365, 545, 118, 40, "UC-MER-08", "Quản lý danh sách đơn hàng", "Kế thừa"))
    parts.append(draw_usecase(700, 545, 118, 40, "UC-MER-10", "Tra cứu hành trình realtime", "Kế thừa"))
    parts.append(draw_usecase(365, 655, 118, 40, "UC-MER-09", "Đặt lịch hẹn lấy hàng tận nơi", "Kế thừa"))
    parts.append(draw_usecase(700, 655, 118, 40, "UC-MER-11", "Yêu cầu đổi thông tin giao", "Kế thừa"))
    parts.append(draw_usecase(365, 765, 118, 40, "UC-MER-12", "Hủy đơn hàng chưa lấy", "MỚI"))
    parts.append(draw_usecase(700, 765, 118, 40, "UC-MER-13", "Yêu cầu hoàn hàng sớm", "Kế thừa"))
    
    # Pkg 3: Tài Chính, COD & Khấu Trừ Hoàn (y=880, h=160, ends at 1040) -> Gap 50px between Pkg 2 & Pkg 3!
    parts.append(draw_package(245, 880, 580, 160, 390, "PHÂN HỆ 3: TÀI CHÍNH &amp; ĐỐI SOÁT COD SEPAY", "Pkg_Merchant_Finance"))
    parts.append(draw_usecase(365, 965, 118, 40, "UC-MER-14", "Lịch sử đối soát SePay", "MỚI"))
    parts.append(draw_usecase(700, 965, 118, 40, "UC-MER-15", "Tự động trừ cước hoàn", "MỚI"))
    
    # Right Column: Auth Cluster Centered in Middle (x=885, w=615, y=400, h=480, ends at 880)
    parts.append(draw_package(885, 400, 615, 480, 340, "CỤM ĐĂNG KÝ &amp; HỒ SƠ SHOP B2B", "Pkg_Merchant_Profile", tab_x_offset=180))
    parts.append(draw_usecase(1005, 640, 110, 42, "UC-MER-01", "Đăng nhập cổng Merchant", "Kế thừa"))
    parts.append(draw_usecase(1380, 475, 105, 34, "UC-MER-00", "Đăng ký tài khoản Shop B2B", "MỚI"))
    parts.append(draw_usecase(1380, 560, 105, 34, "UC-MER-01a", "Khôi phục mật khẩu qua Email", "Kế thừa"))
    parts.append(draw_usecase(1380, 640, 105, 34, "UC-MER-01b", "Đổi mật khẩu tài khoản shop", "Kế thừa"))
    parts.append(draw_usecase(1380, 720, 105, 34, "UC-MER-02", "Đăng xuất an toàn hệ thống", "Kế thừa"))
    parts.append(draw_usecase(1380, 800, 105, 34, "UC-MER-03", "Quản lý hồ sơ &amp; Kho hàng", "Kế thừa"))
    
    # Actor Associations
    actor_targets = [
        (365, 235, 118, 40),
        (365, 545, 118, 40),
        (365, 655, 118, 40),
        (365, 965, 118, 40)
    ]
    parts.append('  <!-- Actor Associations (Distributed) -->')
    parts.append(draw_distributed_actor_assocs(actor_cx, actor_cy, actor_targets))
    
    # Internal Dependencies
    parts.append('  <!-- Internal Dependencies -->')
    parts.append(draw_dependency_arrow(365, 355, 118, 40, 365, 235, 118, 40, "«extend»", 24))
    parts.append(draw_dependency_arrow(365, 235, 118, 40, 700, 235, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(700, 355, 118, 40, 700, 235, 118, 40, "«extend»", 24))
    parts.append(draw_dependency_arrow(365, 655, 118, 40, 365, 545, 118, 40, "«include»", 24))
    parts.append(draw_dependency_arrow(700, 545, 118, 40, 365, 545, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(700, 655, 118, 40, 700, 545, 118, 40, "«extend»", 24))
    # UC-MER-12 extends UC-MER-08 via corridor at x=510 (bypassing UC-MER-09 at y=655)
    parts.append(draw_manhattan_dep_arrow([(483, 765), (510, 765), (510, 565), (483, 550)], "«extend»", 510, 660))
    # UC-MER-13 extends UC-MER-10 via corridor at x=835 (bypassing UC-MER-11 at y=655)
    parts.append(draw_manhattan_dep_arrow([(818, 765), (835, 765), (835, 565), (818, 550)], "«extend»", 835, 660))
    parts.append(draw_dependency_arrow(700, 965, 118, 40, 365, 965, 118, 40, "«include»", 14))
    
    # Auth Cluster Dependencies (Generous 160px gap, no collision!)
    parts.append('  <!-- Auth Cluster Dependencies -->')
    parts.append(draw_dependency_arrow(1380, 475, 105, 34, 1005, 640, 110, 42, "«extend»", 16))
    parts.append(draw_dependency_arrow(1380, 560, 105, 34, 1005, 640, 110, 42, "«extend»", 14))
    parts.append(draw_dependency_arrow(1380, 640, 105, 34, 1005, 640, 110, 42, "«extend»", 14))
    parts.append(draw_dependency_arrow(1380, 720, 105, 34, 1005, 640, 110, 42, "«extend»", 14))
    parts.append(draw_dependency_arrow(1380, 800, 105, 34, 1005, 640, 110, 42, "«include»", 16))
    
    # Cross-Column Includes to Login (Diagonal Fan-In)
    parts.append('  <!-- Cross-Column Auth Includes (Diagonal Fan-In) -->')
    # Track 1: UC-MER-04 -> UC-MER-01 (Step down to y=295 in inter-row channel, diagonal down into top-left arc)
    parts.append(draw_manhattan_dep_arrow([(483, 235), (510, 235), (510, 295), (855, 295), (965.0, 605.0)], "«include»", 550, 295))
    # Track 2: UC-MER-08 -> UC-MER-01 (Step down to y=595, over UC-MER-10, gentle diagonal into upper-left arc)
    parts.append(draw_manhattan_dep_arrow([(483, 545), (510, 545), (510, 595), (855, 595), (925.0, 620.0)], "«include»", 580, 595))
    # Track 3: UC-MER-14 -> UC-MER-01 (Step down to y=1005, under UC-MER-15, diagonal up into lower-left arc)
    parts.append(draw_manhattan_dep_arrow([(483, 965), (510, 965), (510, 1005), (855, 1005), (965.0, 675.0)], "«include»", 670, 1005))
    
    parts.append(draw_footer_legend(width, height))
    return wrap_svg(width, height, "\n".join(parts))


# =============================================================================
# 5. CUSTOMER C-END (A4 PORTRAIT)
# =============================================================================
def generate_customer_diagram():
    width = 1540
    height = 910
    drawing_code = "UC-ACT-CUS-01"
    actor_code = "ACT-CUS"
    main_title = "SƠ ĐỒ USE CASE TÁC NHÂN: KHÁCH HÀNG CÁ NHÂN (CUSTOMER C-END)"
    sub_title = "Cột trái: Gửi hàng lẻ, Tra cứu real-time & Trợ lý AI RAG • Cột phải: Cụm Đăng ký SĐT / OTP • Mũi tên phân tách chuẩn UML 2.5"
    
    parts = []
    parts.append(draw_header(width, main_title, sub_title, drawing_code, actor_code))
    
    # System Boundary (Tightly wrapping content, zero bottom void)
    sb_x, sb_y, sb_w, sb_h = 230, 115, 1285, 675
    parts.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    parts.append('  <g id="System_Boundary">')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="650" height="38" class="sys-header"/>')
    parts.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-sys">«system» ỨNG DỤNG KHÁCH HÀNG CÁ NHÂN (CUSTOMER WEB &amp; MOBILE APP)</text>')
    parts.append('  </g>')
    
    # Actor stick figure
    actor_cx, actor_cy = 120, 460
    parts.append(draw_actor(actor_cx, actor_cy, "Khách Hàng Cá Nhân", "Người Gửi / Nhận Lẻ", "customer-app", "9 Use Cases (Dọc A4)"))
    
    # Left Column: Business Area (x=245, w=580)
    # Pkg 1: Gửi Hàng Lẻ & Tra Cứu (y=160, h=260, ends at 420)
    parts.append(draw_package(245, 160, 580, 260, 380, "PHÂN HỆ 1: GỬI HÀNG LẺ &amp; ĐỊNH VỊ", "Pkg_Customer_Ship"))
    parts.append(draw_usecase(365, 240, 118, 40, "UC-CUS-02", "Tạo đơn gửi bưu phẩm cá nhân", "Kế thừa"))
    parts.append(draw_usecase(700, 240, 118, 40, "UC-CUS-03", "Tra cứu đơn hàng Realtime", "Kế thừa"))
    parts.append(draw_usecase(365, 355, 118, 40, "UC-CUS-04", "Ước tính cước &amp; thời gian giao", "Kế thừa"))
    parts.append(draw_usecase(700, 355, 118, 40, "UC-CUS-05", "Quản lý danh bạ địa chỉ lưu", "Kế thừa"))
    
    # Pkg 2: Nhận Hàng & Trợ Lý AI RAG (y=470, h=290, ends at 760) -> Gap 50px between Pkg 1 & Pkg 2!
    parts.append(draw_package(245, 470, 580, 290, 410, "PHÂN HỆ 2: THÔNG BÁO REALTIME &amp; AI TRỢ LÝ", "Pkg_Customer_Notify"))
    parts.append(draw_usecase(365, 550, 118, 40, "UC-CUS-06", "Nhận mã OTP nhận hàng 6 số", "MỚI"))
    parts.append(draw_usecase(700, 550, 118, 40, "UC-CUS-07", "Đánh giá chất lượng bưu tá", "MỚI"))
    parts.append(draw_usecase(365, 660, 118, 40, "UC-CUS-08", "Trợ lý AI hỗ trợ đơn hàng", "MỚI"))
    parts.append(draw_usecase(700, 660, 118, 40, "UC-CUS-09", "Gửi phản ánh bưu phẩm", "Kế thừa"))
    
    # Right Column: Auth Cluster Centered in Middle (x=885, w=615, y=410, h=380, ends at 790)
    parts.append(draw_package(885, 410, 615, 380, 360, "CỤM XÁC THỰC SĐT &amp; HỒ SƠ CÁ NHÂN", "Pkg_Customer_Auth", tab_x_offset=180))
    parts.append(draw_usecase(1005, 600, 110, 42, "UC-CUS-01", "Đăng nhập SĐT qua OTP", "Kế thừa"))
    parts.append(draw_usecase(1380, 490, 105, 34, "UC-CUS-00", "Đăng ký tài khoản người dùng", "MỚI"))
    parts.append(draw_usecase(1380, 600, 105, 34, "UC-CUS-01a", "Cập nhật hồ sơ &amp; Địa chỉ mặc định", "Kế thừa"))
    parts.append(draw_usecase(1380, 710, 105, 34, "UC-CUS-01b", "Đăng xuất tài khoản khách hàng", "Kế thừa"))
    
    # Actor Associations
    actor_targets = [
        (365, 240, 118, 40),
        (365, 355, 118, 40),
        (365, 550, 118, 40),
        (365, 660, 118, 40)
    ]
    parts.append('  <!-- Actor Associations (Distributed) -->')
    parts.append(draw_distributed_actor_assocs(actor_cx, actor_cy, actor_targets))
    
    # Internal Dependencies
    parts.append('  <!-- Internal Dependencies -->')
    parts.append(draw_dependency_arrow(700, 240, 118, 40, 365, 240, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(700, 355, 118, 40, 365, 355, 118, 40, "«extend»", 14))
    parts.append(draw_dependency_arrow(700, 550, 118, 40, 365, 550, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(700, 660, 118, 40, 365, 660, 118, 40, "«include»", 14))
    
    # Auth Cluster Dependencies (Generous 160px gap, no collision!)
    parts.append('  <!-- Auth Cluster Dependencies -->')
    parts.append(draw_dependency_arrow(1380, 490, 105, 34, 1005, 600, 110, 42, "«extend»", 14))
    parts.append(draw_dependency_arrow(1380, 600, 105, 34, 1005, 600, 110, 42, "«extend»", 14))
    parts.append(draw_dependency_arrow(1380, 710, 105, 34, 1005, 600, 110, 42, "«extend»", 14))
    
    # Cross-Column Includes to Login (Diagonal Fan-In)
    parts.append('  <!-- Cross-Column Auth Includes (Diagonal Fan-In) -->')
    # Track 1: UC-CUS-02 -> UC-CUS-01 (Step down to y=295 in inter-row channel, diagonal into top-left arc)
    parts.append(draw_manhattan_dep_arrow([(483, 240), (510, 240), (510, 295), (855, 295), (965.0, 565.0)], "«include»", 550, 295))
    # Track 2: UC-CUS-04 -> UC-CUS-01 (Step down to y=405, under UC-CUS-05, diagonal into upper-left arc)
    parts.append(draw_manhattan_dep_arrow([(483, 355), (510, 355), (510, 405), (855, 405), (930.0, 575.0)], "«include»", 550, 405))
    # Track 3: UC-CUS-08 -> UC-CUS-01 (Step down to y=705, under UC-CUS-09, diagonal up into lower-left arc)
    parts.append(draw_manhattan_dep_arrow([(483, 660), (510, 660), (510, 705), (855, 705), (935.0, 625.0)], "«include»", 550, 705))
    
    parts.append(draw_footer_legend(width, height))
    return wrap_svg(width, height, "\n".join(parts))


# =============================================================================
# 6. GUEST (A4 PORTRAIT)
# =============================================================================
def generate_guest_diagram():
    width = 1540
    height = 1050
    drawing_code = "UC-ACT-GST-01"
    actor_code = "ACT-GST"
    main_title = "SƠ ĐỒ USE CASE TÁC NHÂN: KHÁCH VÃNG LAI (GUEST)"
    sub_title = "Cột trái: Tra cứu công khai & Trợ lý AI RAG 5 Dynamic Tools • Cột phải: Cụm Chuyển đổi tài khoản • Mũi tên phân tách chuẩn UML 2.5"
    
    parts = []
    parts.append(draw_header(width, main_title, sub_title, drawing_code, actor_code))
    
    # System Boundary (Tightly wrapping content, zero bottom void)
    sb_x, sb_y, sb_w, sb_h = 230, 115, 1285, 835
    parts.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    parts.append('  <g id="System_Boundary">')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="680" height="38" class="sys-header"/>')
    parts.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-sys">«system» CỔNG TRA CỨU CÔNG KHAI HỆ THỐNG (PUBLIC-TRACKING)</text>')
    parts.append('  </g>')
    
    # Actor stick figure
    actor_cx, actor_cy = 120, 530
    parts.append(draw_actor(actor_cx, actor_cy, "Khách Vãng Lai", "Người Dùng Công Khai", "public-tracking (:3000)", "11 Use Cases (Dọc A4)"))
    
    # Left Column: Business Area (x=245, w=580)
    # Pkg 1: Tra Cứu Công Khai & Ước Tính (y=160, h=255, ends at 415)
    parts.append(draw_package(245, 160, 580, 255, 380, "PHÂN HỆ 1: TIỆN ÍCH TRA CỨU CÔNG KHAI", "Pkg_Guest_Public"))
    parts.append(draw_usecase(365, 235, 118, 40, "UC-GST-01", "Tra cứu trạng thái bưu kiện", "Kế thừa"))
    parts.append(draw_usecase(365, 350, 118, 40, "UC-GST-03", "Tạo đơn khách vãng lai", "MỚI"))
    parts.append(draw_usecase(700, 350, 118, 40, "UC-GST-02", "Ước tính cước IATA 3 vùng", "MỚI"))
    
    # Pkg 2: AI RAG & 5 Dynamic Tools (y=470, h=450, ends at 920) -> Gap 55px between Pkg 1 & Pkg 2!
    parts.append(draw_package(245, 470, 580, 450, 410, "PHÂN HỆ 2: TRỢ LÝ AI RAG &amp; 5 DYNAMIC TOOLS", "Pkg_Guest_AIRAG"))
    parts.append(draw_usecase(365, 695, 122, 44, "UC-GST-04", "Trợ lý AI Logistics (SSE)", "MỚI"))
    parts.append(draw_usecase(700, 555, 115, 28, "UC-GST-05", "Tra cứu vận đơn AI (`track`)", "MỚI"))
    parts.append(draw_usecase(700, 625, 115, 28, "UC-GST-06", "Tính cước tự động (`rate`)", "MỚI"))
    parts.append(draw_usecase(700, 695, 115, 28, "UC-GST-07", "Tra cứu hàng cấm (`prohibited`)", "MỚI"))
    parts.append(draw_usecase(700, 765, 115, 28, "UC-GST-08", "Chính sách bồi thường (`claim`)", "MỚI"))
    parts.append(draw_usecase(700, 835, 115, 28, "UC-GST-09", "Tìm kiếm bưu cục Hub/Post", "MỚI"))
    
    # Right Column: Auth / Account Conversion Cluster (x=885, w=615, y=580, h=210, ends at 790)
    parts.append(draw_package(885, 580, 615, 210, 380, "CỤM CHUYỂN ĐỔI TÀI KHOẢN CHÍNH THỨC", "Pkg_Guest_Conversion", tab_x_offset=180))
    parts.append(draw_usecase(1005, 685, 110, 42, "UC-GST-00", "Đăng ký nâng cấp tài khoản", "MỚI"))
    parts.append(draw_usecase(1380, 685, 105, 34, "UC-GST-00a", "Điều hướng Đăng nhập", "MỚI"))
    
    # Actor Associations
    actor_targets = [
        (365, 235, 118, 40),
        (365, 350, 118, 40),
        (365, 695, 122, 44)
    ]
    parts.append('  <!-- Actor Associations (Distributed) -->')
    parts.append(draw_distributed_actor_assocs(actor_cx, actor_cy, actor_targets))
    
    # Internal Dependencies
    parts.append('  <!-- Internal Dependencies -->')
    parts.append(draw_dependency_arrow(365, 350, 118, 40, 700, 350, 118, 40, "«include»", 14))
    
    # AI RAG 5 Extension tools fan-out from UC-GST-04 (cx=365, cy=695)
    rag_tools = [555, 625, 695, 765, 835]
    for ty in rag_tools:
        parts.append(draw_dependency_arrow(700, ty, 115, 28, 365, 695, 122, 44, "«extend»", 12))
        
    # Conversion cluster internal dependency (Generous 160px gap, perfectly separated!)
    parts.append('  <!-- Conversion Cluster Dependency -->')
    parts.append(draw_dependency_arrow(1380, 685, 105, 34, 1005, 685, 110, 42, "«extend»", 14))
    
    # Cross-Column Conversion Extend (Public Track / Create -> Register)
    parts.append('  <!-- Cross-Column Conversion Extends -->')
    # Track: UC-GST-01 & 03 to Conversion (Step down to generous y=440 corridor between Pkg 1 & Pkg 2, into UC-GST-00)
    parts.append(draw_manhattan_dep_arrow([(365, 390), (365, 440), (855, 440), (940.0, 655.0)], "«extend»", 550, 440))
    
    parts.append(draw_footer_legend(width, height))
    return wrap_svg(width, height, "\n".join(parts))


# =============================================================================
# MAIN EXPORT RUNNER
# =============================================================================
def main():
    generators = [
        ("03-use-case-actor-system-admin.svg", generate_admin_diagram),
        ("04-use-case-actor-ops-staff.svg", generate_ops_diagram),
        ("05-use-case-actor-courier.svg", generate_courier_diagram),
        ("06-use-case-actor-merchant.svg", generate_merchant_diagram),
        ("07-use-case-actor-customer.svg", generate_customer_diagram),
        ("08-use-case-actor-guest.svg", generate_guest_diagram),
    ]
    
    out_dirs = [
        os.path.abspath("docs/graduation-thesis/diagrams/use-case"),
        os.path.abspath("docs/graduation-thesis/figma-page-1-system-and-data/diagrams")
    ]
    
    for d in out_dirs:
        os.makedirs(d, exist_ok=True)
        
    for filename, gen_fn in generators:
        svg_content = gen_fn()
        for d in out_dirs:
            p = os.path.join(d, filename)
            with open(p, "w", encoding="utf-8") as f:
                f.write(svg_content)
        print(f"Generated: {filename} (synchronized across directories)")

if __name__ == "__main__":
    main()
