#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE ACTOR-SPECIFIC USE CASE DIAGRAMS (UML 2.5 / ZERO-COLLISION BLUEPRINT)
=============================================================================
Khớp 100% danh sách 69 tính năng từ Báo Cáo Đồ Án Tốt Nghiệp (Mục 5.1 & Mục 5.2):
1. Actor Khách Vãng Lai (Guest) - 5 Use Cases (5.2.1)
2. Actor Người Gửi Hàng (Merchant / Chủ Shop) - 12 Use Cases (5.2.2)
3. Actor Nhân Viên Giao Hàng (Courier / Bưu Tá) - 11 Use Cases (5.2.3)
4. Actor Nhân Viên Vận Hành (Ops Staff) - 19 Use Cases (5.2.4)
5. Actor Khách Hàng Cá Nhân (Customer C-End) - 10 Use Cases (5.2.5)
6. Actor Quản Trị Viên (System Admin) - 13 Use Cases (5.2.6)

Bố cục chuẩn A4 Portrait:
- Khung Phân hệ (Packages) rõ ràng theo Bounded Context.
- Cột bên trái: Nghiệp vụ cốt lõi của tác nhân.
- Cột bên phải: Cụm xác thực, hồ sơ và tài khoản.
- Tác nhân bên trái với các đường liên kết trực tiếp (Association lines) trải đều, không giao cắt.
- 100% Native Inline Vector (Zero <marker> tags, chuẩn in ấn 300 DPI).
"""

import os
import math
from actor_usecase_helpers import (
    wrap_svg, draw_header, draw_actor, draw_package,
    draw_usecase, draw_assoc_line, draw_dependency_arrow,
    draw_manhattan_dep_arrow, draw_distributed_actor_assocs,
    draw_footer_legend, xml_esc
)

# =============================================================================
# 1. GUEST ACTOR (5 USE CASES)
# =============================================================================
def generate_guest_diagram():
    width = 1540
    height = 950
    drawing_code = "UC-ACT-GST-01"
    actor_code = "ACT-GST"
    main_title = "SƠ ĐỒ USE CASE TÁC NHÂN: KHÁCH VÃNG LAI (GUEST)"
    sub_title = "Cột trái: Tra cứu công khai, Trợ lý AI & Tìm kiếm bưu cục • Cột phải: Cụm Đăng ký nâng cấp tài khoản • Chuẩn UML 2.5"
    
    parts = []
    parts.append(draw_header(width, main_title, sub_title, drawing_code, actor_code))
    
    sb_x, sb_y, sb_w, sb_h = 230, 115, 1285, 755
    parts.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    parts.append('  <g id="System_Boundary">')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="680" height="38" class="sys-header"/>')
    parts.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-sys">«system» CỔNG TRA CỨU CÔNG KHAI HỆ THỐNG (PUBLIC-TRACKING)</text>')
    parts.append('  </g>')
    
    actor_cx, actor_cy = 120, 480
    parts.append(draw_actor(actor_cx, actor_cy, "Khách Vãng Lai", "Người Dùng Công Khai", "public-tracking (:5177)", "5 Use Cases (Mục 5.2.1)"))
    
    # Left Column: Public Services (x=245, w=590)
    parts.append(draw_package(245, 160, 590, 680, 420, "PHÂN HỆ: TIỆN ÍCH TRA CỨU & DỊCH VỤ CÔNG KHAI", "Pkg_Guest_Public"))
    parts.append(draw_usecase(365, 250, 118, 40, "UC-GST-01", "Tra cứu trạng thái bưu kiện", "Kế thừa"))
    parts.append(draw_usecase(365, 380, 118, 40, "UC-GST-03", "Ước tính cước", "Kế thừa"))
    parts.append(draw_usecase(365, 520, 118, 40, "UC-GST-05", "Tìm kiếm bưu cục", "Kế thừa"))
    parts.append(draw_usecase(365, 660, 122, 42, "UC-GST-04", "Trợ lý AI Tra cứu (Chatbot)", "MỚI"))

    # Extensions in Left Column
    parts.append(draw_usecase(700, 380, 115, 36, "UC-PRC-BASE", "Động cơ cước IATA V/6000", "MỚI"))
    parts.append(draw_usecase(700, 660, 115, 36, "UC-AI-RAG", "Truy xuất chính sách RAG", "MỚI"))
    
    # Right Column: Account Conversion Cluster (x=885, w=615, y=300, h=300)
    parts.append(draw_package(885, 300, 615, 320, 380, "CỤM CHUYỂN ĐỔI TÀI KHOẢN CHÍNH THỨC", "Pkg_Guest_Conversion", tab_x_offset=180))
    parts.append(draw_usecase(1025, 450, 120, 44, "UC-GST-02", "Đăng ký nâng cấp tài khoản", "MỚI"))
    parts.append(draw_usecase(1370, 450, 110, 38, "UC-AUTH-NAV", "Điều hướng Cổng Merchant", "MỚI"))
    
    # Actor Associations
    actor_targets = [
        (365, 250, 118, 40),
        (365, 380, 118, 40),
        (365, 520, 118, 40),
        (365, 660, 122, 42)
    ]
    parts.append('  <!-- Actor Associations (Distributed) -->')
    parts.append(draw_distributed_actor_assocs(actor_cx, actor_cy, actor_targets))
    
    # Internal Dependencies
    parts.append('  <!-- Internal Dependencies -->')
    parts.append(draw_dependency_arrow(365, 380, 118, 40, 700, 380, 115, 36, "«include»", 14))
    parts.append(draw_dependency_arrow(365, 660, 122, 42, 700, 660, 115, 36, "«include»", 14))
    parts.append(draw_dependency_arrow(1370, 450, 110, 38, 1025, 450, 120, 44, "«extend»", 14))
    
    # Extend from UC-GST-01 & 04 to Conversion
    parts.append(draw_manhattan_dep_arrow([(483, 250), (900, 250), (1025, 406)], "«extend»", 720, 250))
    
    parts.append(draw_footer_legend(width, height))
    return wrap_svg(width, height, "\n".join(parts))


# =============================================================================
# 2. MERCHANT ACTOR (12 USE CASES)
# =============================================================================
def generate_merchant_diagram():
    width = 1540
    height = 1150
    drawing_code = "UC-ACT-MER-01"
    actor_code = "ACT-MER"
    main_title = "SƠ ĐỒ USE CASE TÁC NHÂN: NGƯỜI GỬI HÀNG (MERCHANT / CHỦ SHOP)"
    sub_title = "Cột trái: Tạo đơn, In ấn, Quản lý vòng đời & Đối soát COD • Cột phải: Cụm Xác thực & Hồ sơ • Chuẩn UML 2.5"
    
    parts = []
    parts.append(draw_header(width, main_title, sub_title, drawing_code, actor_code))
    
    sb_x, sb_y, sb_w, sb_h = 230, 115, 1285, 955
    parts.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    parts.append('  <g id="System_Boundary">')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="680" height="38" class="sys-header"/>')
    parts.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-sys">«system» CỔNG DÀNH CHO KHÁCH HÀNG DOANH NGHIỆP (MERCHANT-WEB)</text>')
    parts.append('  </g>')
    
    actor_cx, actor_cy = 120, 560
    parts.append(draw_actor(actor_cx, actor_cy, "Người Gửi Hàng", "Chủ Shop B2B", "merchant-web (:5176)", "12 Use Cases (Mục 5.2.2)"))
    
    # Left Column: Business Area (x=245, w=590)
    # Pkg 1: Tạo đơn & In ấn (y=160, h=250)
    parts.append(draw_package(245, 160, 590, 250, 360, "PHÂN HỆ 1: TẠO ĐƠN & IN NHÃN VẬN ĐƠN", "Pkg_Mer_Order"))
    parts.append(draw_usecase(365, 235, 118, 38, "UC-MER-05", "Tạo đơn hàng", "Kế thừa"))
    parts.append(draw_usecase(365, 345, 118, 38, "UC-MER-12", "Quản lý yêu cầu lấy hàng", "Kế thừa"))
    parts.append(draw_usecase(700, 235, 118, 38, "UC-MER-06", "In nhãn đơn", "Kế thừa"))
    parts.append(draw_usecase(700, 345, 118, 36, "UC-MER-06a", "In nhiều vận đơn hàng loạt", "MỚI"))

    # Pkg 2: Vòng đời đơn hàng (y=440, h=350)
    parts.append(draw_package(245, 440, 590, 350, 380, "PHÂN HỆ 2: QUẢN LÝ ĐƠN & VÒNG ĐỜI VẬN CHUYỂN", "Pkg_Mer_Lifecycle"))
    parts.append(draw_usecase(365, 515, 118, 38, "UC-MER-07", "Quản lý danh sách đơn hàng", "Kế thừa"))
    parts.append(draw_usecase(365, 625, 118, 38, "UC-MER-08", "Tra cứu hành trình đơn", "Kế thừa"))
    parts.append(draw_usecase(700, 515, 118, 38, "UC-MER-09", "Hủy đơn hàng chưa lấy", "MỚI"))
    parts.append(draw_usecase(700, 625, 118, 38, "UC-MER-10", "Yêu cầu hoàn hàng", "Kế thừa"))
    parts.append(draw_usecase(700, 725, 118, 36, "UC-MER-10a", "Gán nhãn [FRAGILE]", "MỚI"))

    # Pkg 3: Tài chính & COD (y=820, h=220)
    parts.append(draw_package(245, 820, 590, 220, 360, "PHÂN HỆ 3: TÀI CHÍNH & ĐỐI SOÁT COD", "Pkg_Mer_Finance"))
    parts.append(draw_usecase(365, 915, 118, 40, "UC-MER-11", "Đối soát & Tài chính", "Kế thừa"))
    parts.append(draw_usecase(700, 915, 118, 38, "UC-MER-11a", "Lịch sử đối soát SePay", "MỚI"))

    # Right Column: Auth Cluster (x=885, w=615, y=360, h=440)
    parts.append(draw_package(885, 360, 615, 440, 360, "CỤM XÁC THỰC & HỒ SƠ CHỦ SHOP", "Pkg_Mer_Auth", tab_x_offset=180))
    parts.append(draw_usecase(1005, 450, 115, 40, "UC-MER-01", "Đăng nhập cổng Merchant", "Kế thừa"))
    parts.append(draw_usecase(1005, 570, 115, 40, "UC-MER-04", "Quản lý hồ sơ", "Kế thừa"))
    parts.append(draw_usecase(1005, 690, 115, 40, "UC-MER-03", "Đăng xuất", "Kế thừa"))
    parts.append(draw_usecase(1365, 450, 110, 38, "UC-MER-02", "Đổi mật khẩu tài khoản", "Kế thừa"))
    parts.append(draw_usecase(1365, 570, 110, 38, "UC-MER-04a", "Quản lý sổ địa chỉ kho", "MỚI"))

    # Actor Associations
    actor_targets = [
        (365, 235, 118, 38),
        (365, 345, 118, 38),
        (365, 515, 118, 38),
        (365, 625, 118, 38),
        (365, 915, 118, 40)
    ]
    parts.append('  <!-- Actor Associations (Distributed) -->')
    parts.append(draw_distributed_actor_assocs(actor_cx, actor_cy, actor_targets))

    # Internal Dependencies
    parts.append('  <!-- Internal Dependencies -->')
    parts.append(draw_dependency_arrow(365, 235, 118, 38, 700, 235, 118, 38, "«include»", 14))
    parts.append(draw_dependency_arrow(700, 345, 118, 36, 700, 235, 118, 38, "«extend»", 14))
    parts.append(draw_dependency_arrow(700, 515, 118, 38, 365, 515, 118, 38, "«extend»", 14))
    parts.append(draw_dependency_arrow(700, 625, 118, 38, 365, 515, 118, 38, "«extend»", -14))
    parts.append(draw_dependency_arrow(700, 725, 118, 36, 700, 235, 118, 38, "«extend»", 14))
    parts.append(draw_dependency_arrow(700, 915, 118, 38, 365, 915, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(1365, 450, 110, 38, 1005, 450, 115, 40, "«extend»", 14))
    parts.append(draw_dependency_arrow(1365, 570, 110, 38, 1005, 570, 115, 40, "«include»", 14))

    # Auth Include cross-column
    parts.append(draw_dependency_arrow(365, 515, 118, 38, 1005, 450, 115, 40, "«include»", 14))

    parts.append(draw_footer_legend(width, height))
    return wrap_svg(width, height, "\n".join(parts))


# =============================================================================
# 3. COURIER ACTOR (11 USE CASES)
# =============================================================================
def generate_courier_diagram():
    width = 1540
    height = 1100
    drawing_code = "UC-ACT-DRV-01"
    actor_code = "ACT-DRV"
    main_title = "SƠ ĐỒ USE CASE TÁC NHÂN: NHÂN VIÊN GIAO HÀNG (COURIER / BƯU TÁ)"
    sub_title = "Cột trái: Lấy hàng, Phát hàng, Chụp ảnh POD & Thu hộ COD • Cột phải: Cụm Xác thực Mobile • Chuẩn UML 2.5"
    
    parts = []
    parts.append(draw_header(width, main_title, sub_title, drawing_code, actor_code))
    
    sb_x, sb_y, sb_w, sb_h = 230, 115, 1285, 905
    parts.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    parts.append('  <g id="System_Boundary">')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="680" height="38" class="sys-header"/>')
    parts.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-sys">«system» ỨNG DỤNG TÀI XẾ GIAO NHẬN (COURIER-MOBILE)</text>')
    parts.append('  </g>')
    
    actor_cx, actor_cy = 120, 520
    parts.append(draw_actor(actor_cx, actor_cy, "Nhân Viên Giao Hàng", "Courier / Bưu Tá", "courier-mobile (:8081)", "11 Use Cases (Mục 5.2.3)"))
    
    # Left Column: Business Area (x=245, w=590)
    # Pkg 1: Giao nhận & POD (y=160, h=480)
    parts.append(draw_package(245, 160, 590, 480, 420, "PHÂN HỆ 1: NHIỆM VỤ GIAO NHẬN & XÁC NHẬN POD", "Pkg_Drv_Delivery"))
    parts.append(draw_usecase(365, 235, 118, 38, "UC-DRV-04", "Quản lý danh sách nhiệm vụ ngày", "Kế thừa"))
    parts.append(draw_usecase(365, 345, 118, 38, "UC-DRV-05", "Xác nhận lấy hàng", "Kế thừa"))
    parts.append(draw_usecase(365, 455, 118, 38, "UC-DRV-08", "Xác nhận phát thành công", "Kế thừa"))
    parts.append(draw_usecase(365, 565, 118, 38, "UC-DRV-09", "Báo cáo sự cố phát thất bại", "MỚI"))

    parts.append(draw_usecase(700, 235, 115, 36, "UC-DRV-06", "Liên hệ người nhận", "MỚI"))
    parts.append(draw_usecase(700, 395, 118, 38, "UC-DRV-07", "Chụp ảnh bằng chứng POD", "Kế thừa"))
    parts.append(draw_usecase(700, 505, 115, 36, "UC-DRV-07a", "Xác thực mã OTP 6 số", "MỚI"))
    parts.append(draw_usecase(700, 595, 115, 34, "UC-DRV-09a", "Hẹn lại ngày phát", "MỚI"))

    # Pkg 2: COD & Công nợ (y=670, h=320)
    parts.append(draw_package(245, 670, 590, 320, 380, "PHÂN HỆ 2: THU HỘ COD & QUẢN LÝ CÔNG NỢ", "Pkg_Drv_Finance"))
    parts.append(draw_usecase(365, 765, 118, 38, "UC-DRV-10", "Nộp tiền COD qua VietQR", "MỚI"))
    parts.append(draw_usecase(365, 875, 118, 38, "UC-DRV-11", "Giám sát hạn mức công nợ", "Kế thừa"))
    parts.append(draw_usecase(700, 765, 118, 38, "UC-FIN-05", "Thu hộ tiền mặt COD", "Kế thừa"))

    # Right Column: Auth Cluster (x=885, w=615, y=320, h=380)
    parts.append(draw_package(885, 320, 615, 380, 360, "CỤM XÁC THỰC TÀI XẾ DI ĐỘNG", "Pkg_Drv_Auth", tab_x_offset=180))
    parts.append(draw_usecase(1005, 410, 115, 40, "UC-DRV-01", "Đăng nhập ứng dụng di động", "Kế thừa"))
    parts.append(draw_usecase(1005, 530, 115, 40, "UC-DRV-02", "Đổi mật khẩu tài xế", "Kế thừa"))
    parts.append(draw_usecase(1005, 640, 115, 40, "UC-DRV-03", "Đăng xuất", "Kế thừa"))
    parts.append(draw_usecase(1365, 410, 110, 38, "UC-DRV-01a", "Xác thực Token Mobile", "MỚI"))

    # Actor Associations
    actor_targets = [
        (365, 235, 118, 38),
        (365, 345, 118, 38),
        (365, 455, 118, 38),
        (365, 565, 118, 38),
        (365, 765, 118, 38),
        (365, 875, 118, 38)
    ]
    parts.append('  <!-- Actor Associations (Distributed) -->')
    parts.append(draw_distributed_actor_assocs(actor_cx, actor_cy, actor_targets))

    # Internal Dependencies
    parts.append('  <!-- Internal Dependencies -->')
    parts.append(draw_dependency_arrow(700, 235, 115, 36, 365, 235, 118, 38, "«extend»", 14))
    parts.append(draw_dependency_arrow(700, 395, 118, 38, 365, 455, 118, 38, "«include»", -14))
    parts.append(draw_dependency_arrow(700, 505, 115, 36, 365, 455, 118, 38, "«include»", -14))
    parts.append(draw_dependency_arrow(365, 565, 118, 38, 365, 455, 118, 38, "«extend»", 16))
    parts.append(draw_dependency_arrow(700, 595, 115, 34, 365, 565, 118, 38, "«extend»", 14))
    parts.append(draw_dependency_arrow(700, 765, 118, 38, 365, 765, 118, 38, "«include»", 14))
    parts.append(draw_dependency_arrow(365, 875, 118, 38, 365, 765, 118, 38, "«include»", 16))
    parts.append(draw_dependency_arrow(1365, 410, 110, 38, 1005, 410, 115, 40, "«include»", 14))

    # Auth Include cross-column
    parts.append(draw_dependency_arrow(365, 235, 118, 38, 1005, 410, 115, 40, "«include»", 14))

    parts.append(draw_footer_legend(width, height))
    return wrap_svg(width, height, "\n".join(parts))


# =============================================================================
# 4. OPS STAFF ACTOR (19 USE CASES)
# =============================================================================
def generate_ops_diagram():
    width = 1540
    height = 1420
    drawing_code = "UC-ACT-OPS-01"
    actor_code = "ACT-OPS"
    main_title = "SƠ ĐỒ USE CASE TÁC NHÂN: NHÂN VIÊN VẬN HÀNH (OPS STAFF)"
    sub_title = "Cột trái: Quầy giao dịch, Đóng/gỡ bao, Xe tải trung chuyển & NDR • Cột phải: Cụm Xác thực Bưu cục • Chuẩn UML 2.5"
    
    parts = []
    parts.append(draw_header(width, main_title, sub_title, drawing_code, actor_code))
    
    sb_x, sb_y, sb_w, sb_h = 230, 115, 1285, 1225
    parts.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    parts.append('  <g id="System_Boundary">')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="680" height="38" class="sys-header"/>')
    parts.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-sys">«system» HỆ THỐNG VẬN HÀNH BƯU CỤC &amp; HUB (OPS-WEB)</text>')
    parts.append('  </g>')
    
    actor_cx, actor_cy = 120, 680
    parts.append(draw_actor(actor_cx, actor_cy, "Nhân Viên Vận Hành", "Ops Staff Bưu Cục", "ops-web (:5173)", "19 Use Cases (Mục 5.2.4)"))
    
    # Left Column: Business Area (x=245, w=590)
    # Pkg 1: Quầy & Điều phối (y=160, h=410)
    parts.append(draw_package(245, 160, 590, 410, 410, "PHÂN HỆ 1: QUẦY GIAO DỊCH, TRA CỨU & ĐIỀU PHỐI", "Pkg_Ops_Counter"))
    parts.append(draw_usecase(365, 230, 118, 36, "UC-OPS-04", "Giám sát Dashboard vận hành", "Kế thừa"))
    parts.append(draw_usecase(365, 310, 118, 36, "UC-OPS-05", "Tra cứu hành trình đơn", "Kế thừa"))
    parts.append(draw_usecase(365, 395, 118, 36, "UC-OPS-06", "Tạo đơn hàng tại quầy", "Kế thừa"))
    parts.append(draw_usecase(365, 480, 118, 36, "UC-OPS-07", "Điều phối đơn hàng lấy", "Kế thừa"))
    parts.append(draw_usecase(700, 480, 118, 36, "UC-OPS-08", "Điều phối đơn hàng phát", "Kế thừa"))
    parts.append(draw_usecase(700, 310, 115, 34, "UC-OPS-18", "Gửi hàng", "Kế thừa"))
    parts.append(draw_usecase(700, 395, 115, 34, "UC-OPS-19", "Nhận hàng", "Kế thừa"))

    # Pkg 2: Khai thác bao & Trung chuyển xe (y=590, h=420)
    parts.append(draw_package(245, 590, 590, 420, 430, "PHÂN HỆ 2: ĐÓNG/GỠ BAO & XE TẢI TRUNG CHUYỂN", "Pkg_Ops_Hub"))
    parts.append(draw_usecase(365, 660, 118, 36, "UC-OPS-09", "Đóng bao", "Kế thừa"))
    parts.append(draw_usecase(365, 745, 118, 36, "UC-OPS-10", "Gỡ bao", "Kế thừa"))
    parts.append(draw_usecase(365, 835, 118, 36, "UC-OPS-11", "Quản lý chuyến xe", "Kế thừa"))
    parts.append(draw_usecase(365, 925, 118, 36, "UC-OPS-12", "Quét xe đi (Outbound)", "Kế thừa"))
    parts.append(draw_usecase(700, 660, 118, 36, "UC-OPS-17", "Quản lý tem bao", "MỚI"))
    parts.append(draw_usecase(700, 925, 118, 36, "UC-OPS-13", "Quét xe đến (Inbound)", "Kế thừa"))

    # Pkg 3: Sự cố & Tài chính (y=1030, h=280)
    parts.append(draw_package(245, 1030, 590, 280, 380, "PHÂN HỆ 3: XỬ LÝ SỰ CỐ NDR & TÀI CHÍNH COD", "Pkg_Ops_Exception"))
    parts.append(draw_usecase(365, 1105, 118, 36, "UC-OPS-14", "Xử lý sự cố giao thất bại (NDR)", "MỚI"))
    parts.append(draw_usecase(365, 1205, 118, 36, "UC-OPS-15", "Quản lý chuyển hoàn (Return)", "Kế thừa"))
    parts.append(draw_usecase(700, 1155, 118, 38, "UC-OPS-16", "Tài chính & Đối soát COD", "Kế thừa"))

    # Right Column: Auth Cluster (x=885, w=615, y=420, h=390)
    parts.append(draw_package(885, 420, 615, 390, 360, "CỤM XÁC THỰC NHÂN VIÊN VẬN HÀNH", "Pkg_Ops_Auth", tab_x_offset=180))
    parts.append(draw_usecase(1005, 510, 115, 40, "UC-OPS-01", "Đăng nhập hệ thống bưu cục", "Kế thừa"))
    parts.append(draw_usecase(1005, 625, 115, 40, "UC-OPS-02", "Đổi mật khẩu nhân viên", "Kế thừa"))
    parts.append(draw_usecase(1005, 735, 115, 40, "UC-OPS-03", "Đăng xuất", "Kế thừa"))
    parts.append(draw_usecase(1365, 510, 110, 38, "UC-OPS-01a", "Xác thực Session Bưu cục", "MỚI"))

    # Actor Associations
    actor_targets = [
        (365, 230, 118, 36),
        (365, 310, 118, 36),
        (365, 395, 118, 36),
        (365, 480, 118, 36),
        (365, 660, 118, 36),
        (365, 745, 118, 36),
        (365, 835, 118, 36),
        (365, 925, 118, 36),
        (365, 1105, 118, 36),
        (365, 1205, 118, 36)
    ]
    parts.append('  <!-- Actor Associations (Distributed) -->')
    parts.append(draw_distributed_actor_assocs(actor_cx, actor_cy, actor_targets))

    # Internal Dependencies
    parts.append('  <!-- Internal Dependencies -->')
    parts.append(draw_dependency_arrow(700, 660, 118, 36, 365, 660, 118, 36, "«include»", 14))
    parts.append(draw_dependency_arrow(365, 660, 118, 36, 365, 925, 118, 36, "«include»", 16))
    parts.append(draw_dependency_arrow(700, 925, 118, 36, 365, 745, 118, 36, "«include»", 14))
    parts.append(draw_dependency_arrow(365, 835, 118, 36, 365, 925, 118, 36, "«include»", 16))
    parts.append(draw_dependency_arrow(365, 1205, 118, 36, 365, 1105, 118, 36, "«extend»", 16))
    parts.append(draw_dependency_arrow(700, 1155, 118, 38, 365, 1105, 118, 36, "«include»", 14))
    parts.append(draw_dependency_arrow(1365, 510, 110, 38, 1005, 510, 115, 40, "«include»", 14))

    # Auth Include cross-column
    parts.append(draw_dependency_arrow(365, 230, 118, 36, 1005, 510, 115, 40, "«include»", 14))

    parts.append(draw_footer_legend(width, height))
    return wrap_svg(width, height, "\n".join(parts))


# =============================================================================
# 5. CUSTOMER ACTOR (10 USE CASES)
# =============================================================================
def generate_customer_diagram():
    width = 1540
    height = 1080
    drawing_code = "UC-ACT-CUS-01"
    actor_code = "ACT-CUS"
    main_title = "SƠ ĐỒ USE CASE TÁC NHÂN: KHÁCH HÀNG CÁ NHÂN (CUSTOMER C-END)"
    sub_title = "Cột trái: Đơn cá nhân, Tra cứu, Sổ địa chỉ, Trợ lý AI & Tài khoản NH • Cột phải: Cụm Tài khoản • Chuẩn UML 2.5"
    
    parts = []
    parts.append(draw_header(width, main_title, sub_title, drawing_code, actor_code))
    
    sb_x, sb_y, sb_w, sb_h = 230, 115, 1285, 885
    parts.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    parts.append('  <g id="System_Boundary">')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="680" height="38" class="sys-header"/>')
    parts.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-sys">«system» ỨNG DỤNG KHÁCH HÀNG CÁ NHÂN (CUSTOMER-MOBILE)</text>')
    parts.append('  </g>')
    
    actor_cx, actor_cy = 120, 520
    parts.append(draw_actor(actor_cx, actor_cy, "Khách Hàng Cá Nhân", "Customer C-End", "customer-mobile (:8082)", "10 Use Cases (Mục 5.2.5)"))
    
    # Left Column: Business Area (x=245, w=590)
    # Pkg 1: Dịch vụ cá nhân (y=160, h=520)
    parts.append(draw_package(245, 160, 590, 520, 390, "PHÂN HỆ 1: TIỆN ÍCH BƯU PHẨM & TRA CỨU CÁ NHÂN", "Pkg_Cus_Service"))
    parts.append(draw_usecase(365, 235, 118, 38, "UC-CUS-05", "Tạo đơn gửi bưu phẩm cá nhân", "Kế thừa"))
    parts.append(draw_usecase(365, 345, 118, 38, "UC-CUS-06", "Tra cứu đơn hàng", "Kế thừa"))
    parts.append(draw_usecase(365, 455, 118, 38, "UC-CUS-07", "Ước tính cước & thời gian giao", "Kế thừa"))
    parts.append(draw_usecase(365, 565, 118, 38, "UC-CUS-08", "Quản lý địa chỉ mặc định", "Kế thừa"))
    parts.append(draw_usecase(700, 345, 118, 38, "UC-CUS-09", "Trợ lý AI hỗ trợ đơn hàng", "MỚI"))
    parts.append(draw_usecase(700, 455, 115, 36, "UC-CUS-07a", "Định vị bưu tá giao hàng", "MỚI"))

    # Pkg 2: Tài chính cá nhân (y=705, h=265)
    parts.append(draw_package(245, 705, 590, 265, 380, "PHÂN HỆ 2: QUẢN LÝ TÀI CHÍNH & VÍ CÁ NHÂN", "Pkg_Cus_Finance"))
    parts.append(draw_usecase(365, 805, 118, 40, "UC-CUS-10", "Quản lý tài khoản ngân hàng", "Kế thừa"))
    parts.append(draw_usecase(700, 805, 118, 38, "UC-CUS-10a", "Nhận tiền hoàn tự động", "MỚI"))

    # Right Column: Auth Cluster (x=885, w=615, y=280, h=480)
    parts.append(draw_package(885, 280, 615, 480, 380, "CỤM TÀI KHOẢN KHÁCH HÀNG C-END", "Pkg_Cus_Auth", tab_x_offset=180))
    parts.append(draw_usecase(1005, 365, 115, 40, "UC-CUS-01", "Đăng ký tài khoản người dùng", "Kế thừa"))
    parts.append(draw_usecase(1005, 475, 115, 40, "UC-CUS-02", "Đăng nhập", "Kế thừa"))
    parts.append(draw_usecase(1005, 585, 115, 40, "UC-CUS-03", "Quản lý hồ sơ", "Kế thừa"))
    parts.append(draw_usecase(1005, 695, 115, 40, "UC-CUS-04", "Đăng xuất tài khoản khách hàng", "Kế thừa"))
    parts.append(draw_usecase(1365, 475, 110, 38, "UC-CUS-02a", "Đăng nhập qua OTP SMS", "MỚI"))

    # Actor Associations
    actor_targets = [
        (365, 235, 118, 38),
        (365, 345, 118, 38),
        (365, 455, 118, 38),
        (365, 565, 118, 38),
        (365, 805, 118, 40)
    ]
    parts.append('  <!-- Actor Associations (Distributed) -->')
    parts.append(draw_distributed_actor_assocs(actor_cx, actor_cy, actor_targets))

    # Internal Dependencies
    parts.append('  <!-- Internal Dependencies -->')
    parts.append(draw_dependency_arrow(700, 345, 118, 38, 365, 345, 118, 38, "«include»", 14))
    parts.append(draw_dependency_arrow(700, 455, 115, 36, 365, 345, 118, 38, "«extend»", -14))
    parts.append(draw_dependency_arrow(365, 565, 118, 38, 365, 235, 118, 38, "«extend»", 16))
    parts.append(draw_dependency_arrow(700, 805, 118, 38, 365, 805, 118, 40, "«include»", 14))
    parts.append(draw_dependency_arrow(1365, 475, 110, 38, 1005, 475, 115, 40, "«extend»", 14))
    parts.append(draw_dependency_arrow(1005, 365, 115, 40, 1005, 475, 115, 40, "«include»", -16))

    # Auth Include cross-column
    parts.append(draw_dependency_arrow(365, 235, 118, 38, 1005, 475, 115, 40, "«include»", 14))

    parts.append(draw_footer_legend(width, height))
    return wrap_svg(width, height, "\n".join(parts))


# =============================================================================
# 6. SYSTEM ADMIN ACTOR (13 USE CASES)
# =============================================================================
def generate_admin_diagram():
    width = 1540
    height = 1150
    drawing_code = "UC-ACT-ADM-01"
    actor_code = "ACT-ADM"
    main_title = "SƠ ĐỒ USE CASE TÁC NHÂN: QUẢN TRỊ VIÊN (SYSTEM ADMIN)"
    sub_title = "Cột trái: Mạng lưới Hub, Zone, Cấu hình chính sách & Quản trị tài khoản • Cột phải: Cụm Xác thực Admin • Chuẩn UML 2.5"
    
    parts = []
    parts.append(draw_header(width, main_title, sub_title, drawing_code, actor_code))
    
    sb_x, sb_y, sb_w, sb_h = 230, 115, 1285, 955
    parts.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    parts.append('  <g id="System_Boundary">')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    parts.append(f'    <rect x="{sb_x}" y="{sb_y}" width="680" height="38" class="sys-header"/>')
    parts.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-sys">«system» CỔNG QUẢN TRỊ HỆ THỐNG TOÀN DIỆN (ADMIN-WEB)</text>')
    parts.append('  </g>')
    
    actor_cx, actor_cy = 120, 560
    parts.append(draw_actor(actor_cx, actor_cy, "Quản Trị Viên (Admin)", "System Admin", "admin-web (:5175)", "13 Use Cases (Mục 5.2.6)"))
    
    # Left Column: Business Area (x=245, w=590)
    # Pkg 1: Mạng lưới & Vùng cước (y=160, h=330)
    parts.append(draw_package(245, 160, 590, 330, 410, "PHÂN HỆ 1: GIÁM SÁT TỔNG QUAN & MẠNG LƯỚI HUB", "Pkg_Adm_Network"))
    parts.append(draw_usecase(365, 230, 118, 36, "UC-ADM-03", "Giám sát tổng quan hệ thống", "Kế thừa"))
    parts.append(draw_usecase(365, 320, 118, 36, "UC-ADM-04", "Quản lý mạng lưới bưu cục", "Kế thừa"))
    parts.append(draw_usecase(365, 410, 118, 36, "UC-ADM-05", "Quản lý Hub", "Kế thừa"))
    parts.append(draw_usecase(700, 410, 118, 36, "UC-ADM-06", "Quản lý Zone", "Kế thừa"))

    # Pkg 2: Chính sách & Cấu hình (y=510, h=190)
    parts.append(draw_package(245, 510, 590, 190, 380, "PHÂN HỆ 2: CHÍNH SÁCH BỒI THƯỜNG & DỊCH VỤ", "Pkg_Adm_Policy"))
    parts.append(draw_usecase(365, 590, 118, 36, "UC-ADM-07", "Cấu hình lỗi vận chuyển", "MỚI"))
    parts.append(draw_usecase(700, 590, 118, 36, "UC-ADM-08", "Cấu hình điều khoản và dịch vụ", "Kế thừa"))

    # Pkg 3: Quản trị tài khoản & Phân quyền (y=720, h=320)
    parts.append(draw_package(245, 720, 590, 320, 420, "PHÂN HỆ 3: QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG & RBAC", "Pkg_Adm_Users"))
    parts.append(draw_usecase(365, 790, 118, 36, "UC-ADM-09", "Quản lý tài khoản Ops", "Kế thừa"))
    parts.append(draw_usecase(365, 875, 118, 36, "UC-ADM-10", "Quản lý tài khoản Courier", "Kế thừa"))
    parts.append(draw_usecase(365, 960, 118, 36, "UC-ADM-11", "Quản lý tài khoản Merchant", "Kế thừa"))
    parts.append(draw_usecase(700, 790, 118, 36, "UC-ADM-12", "Quản lý tài khoản Khách hàng", "Kế thừa"))
    parts.append(draw_usecase(700, 875, 118, 36, "UC-ADM-13", "Phân quyền Mobile", "MỚI"))

    # Right Column: Auth Cluster (x=885, w=615, y=360, h=320)
    parts.append(draw_package(885, 360, 615, 320, 360, "CỤM XÁC THỰC QUẢN TRỊ VIÊN HỆ THỐNG", "Pkg_Adm_Auth", tab_x_offset=180))
    parts.append(draw_usecase(1005, 450, 115, 40, "UC-ADM-01", "Đăng nhập", "Kế thừa"))
    parts.append(draw_usecase(1005, 570, 115, 40, "UC-ADM-02", "Đăng xuất", "Kế thừa"))
    parts.append(draw_usecase(1365, 450, 110, 38, "UC-ADM-01a", "Xác thực 2FA Quản trị", "MỚI"))

    # Actor Associations
    actor_targets = [
        (365, 230, 118, 36),
        (365, 320, 118, 36),
        (365, 410, 118, 36),
        (365, 590, 118, 36),
        (365, 790, 118, 36),
        (365, 875, 118, 36),
        (365, 960, 118, 36)
    ]
    parts.append('  <!-- Actor Associations (Distributed) -->')
    parts.append(draw_distributed_actor_assocs(actor_cx, actor_cy, actor_targets))

    # Internal Dependencies
    parts.append('  <!-- Internal Dependencies -->')
    parts.append(draw_dependency_arrow(365, 410, 118, 36, 365, 320, 118, 36, "«include»", 16))
    parts.append(draw_dependency_arrow(700, 410, 118, 36, 365, 410, 118, 36, "«include»", 14))
    parts.append(draw_dependency_arrow(365, 590, 118, 36, 700, 590, 118, 36, "«extend»", 14))
    parts.append(draw_dependency_arrow(700, 875, 118, 36, 365, 875, 118, 36, "«extend»", 14))
    parts.append(draw_dependency_arrow(1365, 450, 110, 38, 1005, 450, 115, 40, "«include»", 14))

    # Auth Include cross-column
    parts.append(draw_dependency_arrow(365, 230, 118, 36, 1005, 450, 115, 40, "«include»", 14))

    parts.append(draw_footer_legend(width, height))
    return wrap_svg(width, height, "\n".join(parts))


# =============================================================================
# EXPORT ALL 6 DIAGRAMS
# =============================================================================
if __name__ == "__main__":
    diagrams = {
        "08-use-case-actor-guest.svg": generate_guest_diagram(),
        "06-use-case-actor-merchant.svg": generate_merchant_diagram(),
        "05-use-case-actor-courier.svg": generate_courier_diagram(),
        "04-use-case-actor-ops-staff.svg": generate_ops_diagram(),
        "07-use-case-actor-customer.svg": generate_customer_diagram(),
        "03-use-case-actor-system-admin.svg": generate_admin_diagram()
    }
    
    out_dirs = [
        os.path.abspath("docs/graduation-thesis/diagrams/use-case/"),
        os.path.abspath("docs/graduation-thesis/figma-page-1-system-and-data/diagrams/")
    ]
    
    for filename, content in diagrams.items():
        for d in out_dirs:
            os.makedirs(d, exist_ok=True)
            out_path = os.path.join(d, filename)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Generated successfully: {out_path} ({len(content.encode('utf-8'))} bytes)")
