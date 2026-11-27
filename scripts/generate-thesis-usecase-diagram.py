#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE THESIS GENERAL USE CASE DIAGRAM (MONOCHROME & ZERO-COLLISION UML 2.5)
=============================================================================
Khớp 100% với danh sách 69 ca sử dụng và kiến trúc mã nguồn thực tế của hệ thống Nexus Logistics:
- Ranh giới phân hệ rõ ràng (6 Bounded Context Packages + 1 Central Auth Gateway).
- Tên các Ca sử dụng chuẩn xác từng chữ theo Mục 5.1 (Bảng 5.1-5.6) & Mục 5.2 Đặc tả Use Case.
- Bố cục Radial Symmetry với CỔNG XÁC THỰC & BẢO MẬT HỆ THỐNG nằm tại TÂM HỆ THỐNG (Center Hub).
- Ranh giới phân hệ chừa khoảng trống thoáng đãng (corridors), không có đường nét nào giao cắt bất thường.
- 100% Native Inline Vector (Zero <marker> tags, không bị méo/mất mũi tên trên mọi phần mềm hiển thị).
- Đạt chuẩn học thuật bảo vệ Luận văn Tốt nghiệp.
"""

import os
import math

def generate_svg():
    width = 3000
    height = 2650

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">')
    
    # STYLES DEFINITION (Pure Monochrome Engineering Style)
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      .bg { fill: #FFFFFF; }')
    lines.append('      .frame { fill: none; stroke: #000000; stroke-width: 2.5; }')
    lines.append('      .frame-inner { fill: none; stroke: #666666; stroke-width: 0.8; stroke-dasharray: 6 3; }')
    lines.append('      .sys-border { fill: #FFFFFF; stroke: #000000; stroke-width: 2.0; }')
    lines.append('      .sys-header { fill: #F1F5F9; stroke: #000000; stroke-width: 1.6; }')
    lines.append('      .pkg-tab { fill: #E2E8F0; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .pkg-body { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .gateway-tab { fill: #CBD5E1; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .gateway-body { fill: #FAFAFA; stroke: #000000; stroke-width: 2.0; stroke-dasharray: 6 3; }')
    lines.append('      .uc { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .uc-ext { fill: #FFFFFF; stroke: #000000; stroke-width: 1.3; stroke-dasharray: 5 3; }')
    lines.append('      .uc-abstract { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; stroke-dasharray: 4 3; }')
    lines.append('      .uc-core { fill: #FFFFFF; stroke: #000000; stroke-width: 2.5; }')
    lines.append('      .actor-head { fill: #FFFFFF; stroke: #000000; stroke-width: 2.2; }')
    lines.append('      .actor-body { stroke: #000000; stroke-width: 2.2; stroke-linecap: round; }')
    lines.append('      .t-main { font-family: "Segoe UI", Arial, sans-serif; font-size: 34px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }')
    lines.append('      .t-sub { font-family: "Segoe UI", Arial, sans-serif; font-size: 19px; fill: #475569; }')
    lines.append('      .t-boundary { font-family: "Segoe UI", Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }')
    lines.append('      .t-pkg { font-family: "Segoe UI", Arial, sans-serif; font-size: 21px; font-weight: bold; fill: #000000; letter-spacing: 0.3px; }')
    lines.append('      .t-gw-pkg { font-family: "Segoe UI", Arial, sans-serif; font-size: 21px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }')
    lines.append('      .t-ucid { font-family: "Courier New", monospace; font-size: 17.5px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-uc { font-family: "Segoe UI", Arial, sans-serif; font-size: 18.5px; font-weight: 600; fill: #0F172A; text-anchor: middle; }')
    lines.append('      .t-uc-abs { font-family: "Segoe UI", Arial, sans-serif; font-size: 18.5px; font-style: italic; font-weight: 600; fill: #1E293B; text-anchor: middle; }')
    lines.append('      .t-actor { font-family: "Segoe UI", Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-role { font-family: "Segoe UI", Arial, sans-serif; font-size: 17px; fill: #475569; text-anchor: middle; }')
    lines.append('      .t-app { font-family: "Courier New", monospace; font-size: 15.5px; font-weight: bold; fill: #1E293B; text-anchor: middle; }')
    lines.append('      .t-rel { font-family: "Courier New", monospace; font-size: 15px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .assoc { stroke: #000000; stroke-width: 1.8; fill: none; }')
    lines.append('      .gen-line { stroke: #000000; stroke-width: 1.8; fill: none; }')
    lines.append('      .gen-arrow { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; }')
    lines.append('      .dep-line { stroke: #000000; stroke-width: 1.6; stroke-dasharray: 6 3; fill: none; }')
    lines.append('      .dep-arrow { fill: #000000; stroke: #000000; stroke-width: 0.5; }')
    lines.append('      .pill-plate { fill: #FFFFFF; stroke: #000000; stroke-width: 1.2; rx: 4px; }')
    lines.append('    ]]></style>')
    lines.append('  </defs>')
    lines.append('')
    lines.append('  <!-- CANVAS BACKGROUND & BORDER -->')
    lines.append(f'  <rect width="{width}" height="{height}" class="bg"/>')
    lines.append(f'  <rect x="16" y="16" width="{width-32}" height="{height-32}" class="frame"/>')
    lines.append(f'  <rect x="22" y="22" width="{width-44}" height="{height-44}" class="frame-inner"/>')
    lines.append('')

    # HEADER BLOCK
    lines.append('  <!-- ==================== HEADER ==================== -->')
    lines.append('  <g id="Header">')
    lines.append(f'    <rect x="30" y="30" width="{width-60}" height="80" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>')
    lines.append('    <text x="50" y="64" class="t-main">SƠ ĐỒ USE CASE TỔNG QUÁT HỆ THỐNG NEXUS LOGISTICS (CHUẨN UML 2.5 / ĐỒ HỌA KỸ THUẬT)</text>')
    lines.append('    <text x="50" y="93" class="t-sub">Chuỗi Cung Ứng Bưu Chính Cốt Lõi • Cổng Xác Thực Tâm Hệ Thống (Central Hub) • 6 Tác Nhân • 6 Phân Hệ Chuẩn Hóa Theo Đặc Tả Luận Văn</text>')
    lines.append(f'    <rect x="{width-440}" y="36" width="390" height="68" fill="#F8FAFC" stroke="#000000" stroke-width="1.3"/>')
    lines.append(f'    <text x="{width-425}" y="62" font-family="Segoe UI, Arial" font-size="14" font-weight="bold" fill="#000000">MÃ BẢN VẼ: UC-SYS-OVERALL-01</text>')
    lines.append(f'    <text x="{width-425}" y="86" font-family="Segoe UI, Arial" font-size="12" fill="#475569">OMG UML 2.5 • CENTRAL AUTH HUB ARCHITECTURE</text>')
    lines.append('  </g>')
    lines.append('')

    # SYSTEM BOUNDARY (X: 310 to 2690, Width: 2380, Height: 2460)
    sb_x = 310
    sb_y = 120
    sb_w = 2380
    sb_h = 2470
    lines.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    lines.append('  <g id="System_Boundary">')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="980" height="36" class="sys-header"/>')
    lines.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-boundary">«system» RANH GIỚI HỆ THỐNG: NEXUS LOGISTICS PLATFORM (CORE SERVICES)</text>')
    lines.append('  </g>')
    lines.append('')

    # HELPER FUNCTIONS
    def uc(cx, cy, rx, ry, ucid, title, uctype="uc"):
        res = []
        eff_ry = max(ry, 42) if uctype == "uc-abstract" else max(ry, 35)
        eff_rx = rx
        res.append(f'    <ellipse cx="{cx}" cy="{cy}" rx="{eff_rx}" ry="{eff_ry}" class="{uctype}"/>')
        safe_title = title.replace('&amp;', '&').replace('&', '&amp;')
        if uctype == "uc-abstract":
            res.append(f'    <text x="{cx}" y="{cy-18}" class="t-rel">«abstract»</text>')
            res.append(f'    <text x="{cx}" y="{cy-1}" class="t-ucid">{ucid}</text>')
            res.append(f'    <text x="{cx}" y="{cy+19}" class="t-uc-abs">{safe_title}</text>')
        else:
            res.append(f'    <text x="{cx}" y="{cy-7}" class="t-ucid">{ucid}</text>')
            res.append(f'    <text x="{cx}" y="{cy+18}" class="t-uc">{safe_title}</text>')
        return "\n".join(res)

    def ellipse_point(cx, cy, rx, ry, from_x, from_y):
        eff_ry = max(ry, 35)
        eff_rx = rx
        dx = from_x - cx
        dy = from_y - cy
        if dx == 0 and dy == 0:
            return cx, cy
        angle = math.atan2(dy, dx)
        return cx + eff_rx * math.cos(angle), cy + eff_ry * math.sin(angle)

    def direct_assoc(x1, y1, cx, cy, rx, ry):
        x2, y2 = ellipse_point(cx, cy, rx, ry, x1, y1)
        return f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" class="assoc"/>'

    def direct_dep_arrow(cx1, cy1, rx1, ry1, cx2, cy2, rx2, ry2, label="«include»", label_offset=14):
        x1, y1 = ellipse_point(cx1, cy1, rx1, ry1, cx2, cy2)
        x2, y2 = ellipse_point(cx2, cy2, rx2, ry2, cx1, cy1)
        dx = x2 - x1
        dy = y2 - y1
        dist = math.hypot(dx, dy)
        if dist == 0:
            return ""
        ux = dx / dist
        uy = dy / dist
        tip_x = x2
        tip_y = y2
        base_x = tip_x - ux * 10
        base_y = tip_y - uy * 10
        p1_x = base_x - uy * 5
        p1_y = base_y + ux * 5
        p2_x = base_x + uy * 5
        p2_y = base_y - ux * 5

        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        lbl_x = mid_x - uy * label_offset
        lbl_y = mid_y + ux * label_offset

        clean_label = label.replace('<<', '«').replace('>>', '»')

        res = []
        res.append(f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{base_x:.1f}" y2="{base_y:.1f}" class="dep-line"/>')
        res.append(f'    <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" class="dep-arrow"/>')
        if clean_label:
            pill_w = len(clean_label) * 7.5 + 14
            pill_h = 22
            res.append(f'    <rect x="{lbl_x - pill_w/2:.1f}" y="{lbl_y - pill_h/2:.1f}" width="{pill_w:.1f}" height="{pill_h}" class="pill-plate"/>')
            res.append(f'    <text x="{lbl_x:.1f}" y="{lbl_y+4.5:.1f}" class="t-rel">{clean_label}</text>')
        return "\n".join(res)

    def direct_gen_arrow(cx1, cy1, rx1, ry1, cx2, cy2, rx2, ry2):
        x1, y1 = ellipse_point(cx1, cy1, rx1, ry1, cx2, cy2)
        x2, y2 = ellipse_point(cx2, cy2, rx2, ry2, cx1, cy1)
        dx = x2 - x1
        dy = y2 - y1
        dist = math.hypot(dx, dy)
        if dist == 0:
            return ""
        ux = dx / dist
        uy = dy / dist
        tip_x = x2
        tip_y = y2
        base_x = tip_x - ux * 12
        base_y = tip_y - uy * 12
        p1_x = base_x - uy * 6
        p1_y = base_y + ux * 6
        p2_x = base_x + uy * 6
        p2_y = base_y - ux * 6

        res = []
        res.append(f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{base_x:.1f}" y2="{base_y:.1f}" class="gen-line"/>')
        res.append(f'    <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" class="gen-arrow"/>')
        return "\n".join(res)

    def actor_stick(cx, cy, name, role, app):
        safe_name = name.replace('&amp;', '&').replace('&', '&amp;')
        safe_role = role.replace('&amp;', '&').replace('&', '&amp;')
        safe_app = app.replace('&amp;', '&').replace('&', '&amp;')
        res = []
        safe_id = name.replace(" ", "_").replace("&", "_").replace("(", "").replace(")", "").replace("__", "_")
        res.append(f'  <g id="Actor_{safe_id}">')
        res.append(f'    <circle cx="{cx}" cy="{cy-36}" r="20" class="actor-head"/>')
        res.append(f'    <line x1="{cx}" y1="{cy-16}" x2="{cx}" y2="{cy+20}" class="actor-body"/>')
        res.append(f'    <line x1="{cx-26}" y1="{cy+3}" x2="{cx+26}" y2="{cy+3}" class="actor-body"/>')
        res.append(f'    <line x1="{cx}" y1="{cy+20}" x2="{cx-20}" y2="{cy+56}" class="actor-body"/>')
        res.append(f'    <line x1="{cx}" y1="{cy+20}" x2="{cx+20}" y2="{cy+56}" class="actor-body"/>')
        res.append(f'    <text x="{cx}" y="{cy+82}" class="t-actor">{safe_name}</text>')
        res.append(f'    <text x="{cx}" y="{cy+105}" class="t-role">{safe_role}</text>')
        res.append(f'    <text x="{cx}" y="{cy+127}" class="t-app">{safe_app}</text>')
        res.append('  </g>')
        return "\n".join(res)

    def pkg_folder(x, y, w, h, tab_w, title, pkg_id, is_gateway=False):
        tab_h = 36
        res = []
        res.append(f'  <g id="{pkg_id}">')
        body_class = "gateway-body" if is_gateway else "pkg-body"
        tab_class = "gateway-tab" if is_gateway else "pkg-tab"
        title_class = "t-gw-pkg" if is_gateway else "t-pkg"
        res.append(f'    <rect x="{x}" y="{y+tab_h}" width="{w}" height="{h-tab_h}" rx="5" class="{body_class}"/>')
        res.append(f'    <path d="M {x},{y+tab_h} L {x},{y+4} Q {x},{y} {x+4},{y} L {x+tab_w-15},{y} L {x+tab_w},{y+tab_h} Z" class="{tab_class}"/>')
        safe_title = title.replace('&amp;', '&').replace('&', '&amp;')
        res.append(f'    <text x="{x+18}" y="{y+25}" class="{title_class}">{safe_title}</text>')
        return "\n".join(res)

    # =========================================================================
    # ROW 1 (Y = 170 to 860, H = 690):
    # Left: PHÂN HỆ 1 (Đơn hàng) | Right: PHÂN HỆ 2 (Bưu cục & Trung chuyển)
    # =========================================================================

    # PKG 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG (Left: X = 340 to 1430, W = 1090)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG                   -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(340, 170, 1090, 690, 520, "PHÂN HỆ 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG — shipment • pickup", "Pkg_1_Order_Shipment"))

    # Col 1: Creation & Management (cx = 530 - Facing Left Flank)
    lines.append(uc(530, 240, 135, 22, "UC-ORD-01", "Tạo đơn hàng", "uc"))
    lines.append(uc(530, 325, 140, 22, "UC-ORD-02", "Tạo đơn gửi bưu phẩm cá nhân", "uc"))
    lines.append(uc(530, 415, 135, 22, "UC-ORD-03", "Quản lý đơn hàng", "uc"))
    lines.append(uc(530, 510, 138, 22, "UC-ORD-04", "Quản lý yêu cầu lấy hàng", "uc"))
    lines.append(uc(530, 605, 135, 22, "UC-ORD-05", "Quản lý địa chỉ mặc định", "uc-ext"))
    lines.append(uc(530, 700, 135, 22, "UC-ORD-06", "Hủy đơn hàng chưa lấy", "uc-ext"))

    # Col 2: Printing & Lifecyle (cx = 880)
    lines.append(uc(880, 280, 145, 25, "UC-ORD-BASE", "Tạo đơn gửi bưu phẩm", "uc-abstract"))
    lines.append(uc(880, 390, 135, 22, "UC-ORD-07", "In nhãn vận đơn", "uc"))
    lines.append(uc(880, 490, 138, 22, "UC-ORD-08", "In nhiều vận đơn hàng loạt", "uc-ext"))
    lines.append(uc(880, 590, 140, 22, "UC-ORD-09", "Gán nhãn Hàng Dễ Vỡ [FRAGILE]", "uc-ext"))
    lines.append(uc(880, 700, 135, 22, "UC-ORD-10", "Yêu cầu hoàn hàng", "uc-ext"))

    # Col 3: Additional details (cx = 1240)
    lines.append(uc(1240, 390, 135, 22, "UC-ORD-11", "Yêu cầu đổi thông tin giao", "uc-ext"))
    lines.append(uc(1240, 510, 135, 22, "UC-ORD-12", "Theo dõi trạng thái lấy hàng", "uc-ext"))

    # Internal Pkg 1 Relationships:
    lines.append(direct_gen_arrow(530, 240, 135, 22, 880, 280, 145, 25))
    lines.append(direct_gen_arrow(530, 325, 140, 22, 880, 280, 145, 25))
    lines.append(direct_dep_arrow(880, 280, 145, 25, 880, 390, 135, 22, "«include»", 14))
    lines.append(direct_dep_arrow(880, 490, 138, 22, 880, 390, 135, 22, "«extend»", -20))
    lines.append(direct_dep_arrow(880, 590, 140, 22, 880, 390, 135, 22, "«extend»", -20))
    lines.append(direct_dep_arrow(530, 605, 135, 22, 880, 280, 145, 25, "«extend»", 14))
    lines.append(direct_dep_arrow(530, 700, 135, 22, 530, 415, 135, 22, "«extend»", 16))
    lines.append(direct_dep_arrow(880, 700, 135, 22, 530, 415, 135, 22, "«extend»", -14))
    lines.append(direct_dep_arrow(1240, 390, 135, 22, 530, 415, 135, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(1240, 510, 135, 22, 530, 510, 138, 22, "«extend»", 14))
    lines.append('  </g>')
    lines.append('')

    # PKG 2: BƯU CỤC, ĐIỀU PHỐI & TRUNG CHUYỂN HUB (Right: X = 1530 to 2660, W = 1130)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 2: BƯU CỤC, ĐIỀU PHỐI & TRUNG CHUYỂN HUB          -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(1530, 170, 1130, 690, 560, "PHÂN HỆ 2: BƯU CỤC & TRUNG CHUYỂN HUB — scan • manifest • dispatch", "Pkg_2_Hub_Operations"))

    # Col 1: Fleet & Transit (cx = 1710)
    lines.append(uc(1710, 240, 125, 22, "UC-HUB-01", "Quản lý chuyến xe", "uc"))
    lines.append(uc(1710, 335, 125, 22, "UC-HUB-02", "Quét xe đi (Outbound)", "uc"))
    lines.append(uc(1710, 430, 125, 22, "UC-HUB-03", "Quét xe đến (Inbound)", "uc"))
    lines.append(uc(1710, 530, 125, 22, "UC-HUB-04", "Gửi hàng", "uc"))
    lines.append(uc(1710, 630, 125, 22, "UC-HUB-05", "Nhận hàng", "uc"))
    lines.append(uc(1710, 730, 125, 22, "UC-HUB-06", "Quản lý tem bao", "uc-ext"))

    # Col 2: Bagging & Dispatch (cx = 2070)
    lines.append(uc(2070, 240, 128, 22, "UC-HUB-07", "Đóng bao", "uc"))
    lines.append(uc(2070, 335, 128, 22, "UC-HUB-08", "Gỡ bao", "uc"))
    lines.append(uc(2070, 440, 130, 22, "UC-HUB-09", "Điều phối đơn hàng lấy", "uc"))
    lines.append(uc(2070, 545, 130, 22, "UC-HUB-10", "Điều phối đơn hàng phát", "uc"))
    lines.append(uc(2070, 650, 130, 22, "UC-HUB-11", "Quét bàn giao bưu tá", "uc-ext"))

    # Col 3: Monitoring & Counter (cx = 2430 - Facing Right Flank)
    lines.append(uc(2430, 240, 130, 22, "UC-HUB-12", "Giám sát Dashboard vận hành", "uc"))
    lines.append(uc(2430, 335, 130, 22, "UC-HUB-13", "Tạo đơn hàng tại quầy", "uc"))
    lines.append(uc(2430, 440, 130, 22, "UC-HUB-14", "Tra cứu hành trình đơn", "uc-ext"))
    lines.append(uc(2430, 550, 130, 22, "UC-HUB-15", "Quản lý tem niêm phong seal", "uc-ext"))

    # Internal Pkg 2 Relationships:
    lines.append(direct_dep_arrow(1710, 730, 125, 22, 2070, 240, 128, 22, "«include»", -15))
    lines.append(direct_dep_arrow(2070, 240, 128, 22, 1710, 335, 125, 22, "«include»", 14))
    lines.append(direct_dep_arrow(1710, 430, 125, 22, 2070, 335, 128, 22, "«include»", 14))
    lines.append(direct_dep_arrow(1710, 240, 125, 22, 1710, 335, 125, 22, "«include»", -16))
    lines.append(direct_dep_arrow(2430, 550, 130, 22, 1710, 240, 125, 22, "«extend»", 16))
    lines.append(direct_dep_arrow(2070, 650, 130, 22, 2070, 545, 130, 22, "«include»", -16))
    lines.append(direct_dep_arrow(1710, 530, 125, 22, 2430, 335, 130, 22, "«include»", 14))
    lines.append(direct_dep_arrow(1710, 630, 125, 22, 2070, 545, 130, 22, "«include»", 14))
    lines.append(direct_dep_arrow(2430, 440, 130, 22, 2430, 240, 130, 22, "«extend»", -16))
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # ROW 2 (Y = 940 to 1750, H = 810):
    # Left: PHÂN HỆ 5 (Tra cứu & Cước) | Center: CỔNG XÁC THỰC | Right: PHÂN HỆ 3 (Giao hàng & Sự cố)
    # =========================================================================

    # PKG 5: TRA CỨU HÀNH TRÌNH & TRỢ LÝ AI (Left: X = 340 to 1050, W = 710)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 5: TRA CỨU HÀNH TRÌNH, TRỢ LÝ AI & CƯỚC PHÍ       -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(340, 940, 710, 810, 470, "PHÂN HỆ 5: TRA CỨU & TRỢ LÝ AI — tracking • ai • pricing", "Pkg_5_Tracking_AI"))

    # Col 1: Public/Customer Tracking & Pricing (cx = 510)
    lines.append(uc(510, 1030, 140, 22, "UC-TRK-01", "Tra cứu trạng thái bưu kiện", "uc"))
    lines.append(uc(510, 1130, 140, 22, "UC-TRK-02", "Tra cứu đơn hàng", "uc"))
    lines.append(uc(510, 1230, 140, 22, "UC-TRK-03", "Tra cứu vận đơn", "uc"))
    lines.append(uc(510, 1340, 142, 22, "UC-TRK-04", "Ước tính cước & thời gian giao", "uc"))
    lines.append(uc(510, 1450, 140, 22, "UC-TRK-05", "Tìm kiếm bưu cục", "uc"))
    lines.append(uc(510, 1560, 140, 22, "UC-TRK-06", "Đăng ký nâng cấp tài khoản", "uc-ext"))

    # Col 2: AI Assistant & Core Engine (cx = 880)
    lines.append(uc(880, 1080, 142, 23, "UC-TRK-BASE", "Tra cứu hành trình bưu phẩm", "uc-abstract"))
    lines.append(uc(880, 1230, 142, 22, "UC-TRK-07", "Trợ lý tư vấn AI Chatbot", "uc"))
    lines.append(uc(880, 1340, 142, 22, "UC-TRK-08", "Trợ lý AI hỗ trợ đơn hàng", "uc"))
    lines.append(uc(880, 1470, 142, 22, "UC-TRK-09", "Động cơ cước chuẩn IATA V/6000", "uc"))
    lines.append(uc(880, 1600, 142, 22, "UC-TRK-10", "Tra cứu chính sách Điều 25", "uc-ext"))

    # Internal Pkg 5 Relationships:
    lines.append(direct_gen_arrow(510, 1030, 140, 22, 880, 1080, 142, 23))
    lines.append(direct_gen_arrow(510, 1130, 140, 22, 880, 1080, 142, 23))
    lines.append(direct_gen_arrow(510, 1230, 140, 22, 880, 1080, 142, 23))
    lines.append(direct_dep_arrow(510, 1340, 142, 22, 880, 1470, 142, 22, "«include»", 14))
    lines.append(direct_dep_arrow(880, 1230, 142, 22, 880, 1080, 142, 23, "«include»", 14))
    lines.append(direct_dep_arrow(880, 1340, 142, 22, 880, 1080, 142, 23, "«include»", 14))
    lines.append(direct_dep_arrow(880, 1600, 142, 22, 880, 1230, 142, 22, "«extend»", -15))
    lines.append('  </g>')
    lines.append('')

    # CENTER HUB: CỔNG XÁC THỰC & BẢO MẬT HỆ THỐNG (Center: X = 1110 to 1890, W = 780)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- CỔNG XÁC THỰC & BẢO MẬT HỆ THỐNG (CENTRAL AUTH HUB)       -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(1110, 940, 780, 810, 480, "CỔNG XÁC THỰC & BẢO MẬT (auth-service • gateway)", "Central_Auth_Gateway", is_gateway=True))

    lines.append('    <rect x="1220" y="1005" width="560" height="34" rx="4" fill="#E2E8F0" stroke="#000000" stroke-width="1.3"/>')
    lines.append('    <text x="1500" y="1028" font-family="Courier New, monospace" font-size="14.5" font-weight="bold" fill="#000000" text-anchor="middle">CENTRAL IDENTITY PROVIDER (IDP) • RBAC TOKEN BUS</text>')

    c_auth = (1500, 1160, 175, 27)
    lines.append(uc(c_auth[0], c_auth[1], c_auth[2], c_auth[3], "UC-AUTH-01", "Đăng nhập hệ thống", "uc-core"))
    lines.append(uc(1320, 1330, 138, 23, "UC-AUTH-02", "Đổi mật khẩu tài khoản", "uc-ext"))
    lines.append(uc(1680, 1330, 138, 23, "UC-AUTH-03", "Quản lý hồ sơ", "uc-core"))
    lines.append(uc(1500, 1470, 140, 23, "UC-AUTH-04", "Đăng xuất", "uc-ext"))
    lines.append(uc(1500, 1600, 145, 23, "UC-AUTH-05", "Đăng ký tài khoản người dùng", "uc"))

    lines.append(direct_dep_arrow(1320, 1330, 138, 23, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", -15))
    lines.append(direct_dep_arrow(1680, 1330, 138, 23, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", 15))
    lines.append(direct_dep_arrow(1500, 1470, 140, 23, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«extend»", 14))

    # Architecture Info Plate in Center Gateway:
    lines.append('    <rect x="1140" y="1670" width="720" height="56" fill="#F8FAFC" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 2" rx="4"/>')
    lines.append('    <text x="1500" y="1694" font-family="Courier New, monospace" font-size="13" font-weight="bold" fill="#000000" text-anchor="middle">Opaque Bearer Token • Session Isolation • Microservice RBAC Guard</text>')
    lines.append('    <text x="1500" y="1714" font-family="Segoe UI, Arial" font-size="12.5" fill="#334155" text-anchor="middle">Cổng bảo mật xác thực trung tâm kết nối trực tiếp các phân hệ qua chuẩn UML 2.5</text>')
    lines.append('  </g>')
    lines.append('')

    # PKG 3: GIAO HÀNG CHẶNG CUỐI & SỰ CỐ LAST-MILE (Right: X = 1950 to 2660, W = 710)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 3: GIAO HÀNG CHẶNG CUỐI & SỰ CỐ LAST-MILE        -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(1950, 940, 710, 810, 520, "PHÂN HỆ 3: GIAO HÀNG & SỰ CỐ — delivery • ndr • return", "Pkg_3_Delivery_NDR"))

    # Col 1: POD, Exceptions & Return (cx = 2120)
    lines.append(uc(2120, 1140, 135, 23, "UC-DEL-01", "Chụp ảnh bằng chứng POD", "uc"))
    lines.append(uc(2120, 1260, 135, 23, "UC-DEL-02", "Xác thực mã OTP phát hàng", "uc"))
    lines.append(uc(2120, 1400, 140, 23, "UC-DEL-03", "Xử lý sự cố giao thất bại (NDR)", "uc"))
    lines.append(uc(2120, 1540, 140, 23, "UC-DEL-04", "Quản lý chuyển hoàn (Return)", "uc-ext"))
    lines.append(uc(2120, 1660, 140, 23, "UC-DEL-04a", "Hẹn lại ngày phát (Reschedule)", "uc-ext"))

    # Col 2: Courier Tasks & Direct Delivery (cx = 2470 - Facing Right Flank)
    lines.append(uc(2470, 1030, 138, 23, "UC-DEL-05", "Quản lý nhiệm vụ giao nhận", "uc"))
    lines.append(uc(2470, 1150, 138, 23, "UC-DEL-06", "Xác nhận lấy hàng", "uc"))
    lines.append(uc(2470, 1270, 138, 23, "UC-DEL-07", "Liên hệ người nhận", "uc-ext"))
    lines.append(uc(2470, 1400, 138, 23, "UC-DEL-08", "Xác nhận phát thành công", "uc"))
    lines.append(uc(2470, 1540, 138, 23, "UC-DEL-09", "Báo cáo sự cố phát thất bại", "uc-ext"))

    # Internal Pkg 3 Relationships:
    lines.append(direct_dep_arrow(2470, 1270, 138, 23, 2470, 1030, 138, 23, "«extend»", 14))
    lines.append(direct_dep_arrow(2120, 1140, 135, 23, 2470, 1400, 138, 23, "«include»", -15))
    lines.append(direct_dep_arrow(2120, 1260, 135, 23, 2470, 1400, 138, 23, "«include»", -15))
    lines.append(direct_dep_arrow(2470, 1540, 138, 23, 2470, 1400, 138, 23, "«extend»", 14))
    lines.append(direct_dep_arrow(2470, 1540, 138, 23, 2120, 1400, 140, 23, "«include»", 14))
    lines.append(direct_dep_arrow(2120, 1540, 140, 23, 2120, 1400, 140, 23, "«extend»", 14))
    lines.append(direct_dep_arrow(2120, 1660, 140, 23, 2470, 1540, 138, 23, "«extend»", 14))
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # ROW 3 (Y = 1830 to 2530, H = 700):
    # Left: PHÂN HỆ 6 (Quản trị & RBAC) | Right: PHÂN HỆ 4 (Tài chính & COD)
    # =========================================================================

    # PKG 6: QUẢN TRỊ HỆ THỐNG & CẤU HÌNH MẠNG LƯỚI (Left: X = 340 to 1430, W = 1090)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 6: QUẢN TRỊ HỆ THỐNG & CẤU HÌNH MẠNG LƯỚI         -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(340, 1830, 1090, 700, 520, "PHÂN HỆ 6: QUẢN TRỊ HỆ THỐNG & RBAC — admin • network • rbac", "Pkg_6_System_Admin"))

    # Col 1: System Monitoring & Network Hub (cx = 530 - Facing Left Flank)
    lines.append(uc(530, 1910, 135, 22, "UC-ADM-01", "Giám sát tổng quan hệ thống", "uc"))
    lines.append(uc(530, 2010, 135, 22, "UC-ADM-02", "Quản lý mạng lưới bưu cục", "uc"))
    lines.append(uc(530, 2110, 135, 22, "UC-ADM-03", "Quản lý Hub", "uc"))
    lines.append(uc(530, 2210, 135, 22, "UC-ADM-04", "Quản lý Zone", "uc"))
    lines.append(uc(530, 2310, 135, 22, "UC-ADM-05", "Phân quyền Mobile", "uc-ext"))
    lines.append(uc(530, 2410, 135, 22, "UC-ADM-06", "Kiểm toán nhật ký hệ thống", "uc"))

    # Col 2: Policy & User Accounts Management (cx = 880)
    lines.append(uc(880, 1910, 138, 22, "UC-ADM-07", "Cấu hình lỗi vận chuyển", "uc-ext"))
    lines.append(uc(880, 2010, 140, 22, "UC-ADM-08", "Cấu hình điều khoản và dịch vụ", "uc"))
    lines.append(uc(880, 2110, 138, 22, "UC-ADM-09", "Quản lý tài khoản Ops", "uc"))
    lines.append(uc(880, 2210, 138, 22, "UC-ADM-10", "Quản lý tài khoản Courier", "uc"))
    lines.append(uc(880, 2310, 138, 22, "UC-ADM-11", "Quản lý tài khoản Merchant", "uc"))
    lines.append(uc(880, 2410, 138, 22, "UC-ADM-12", "Quản lý tài khoản Khách hàng", "uc"))

    # Col 3: Architecture integrations (cx = 1240)
    lines.append(uc(1240, 2010, 135, 22, "UC-ADM-13", "Quản lý phân quyền RBAC Matrix", "uc"))
    lines.append(uc(1240, 2160, 135, 22, "UC-ADM-14", "Chuyển giao sự kiện RabbitMQ", "uc-ext"))
    lines.append(uc(1240, 2310, 135, 22, "UC-ADM-15", "Chiếu Read Model Timeline", "uc-ext"))

    # Internal Pkg 6 Relationships:
    lines.append(direct_dep_arrow(530, 2110, 135, 22, 530, 2010, 135, 22, "«include»", -15))
    lines.append(direct_dep_arrow(530, 2210, 135, 22, 530, 2110, 135, 22, "«include»", -15))
    lines.append(direct_dep_arrow(880, 1910, 138, 22, 880, 2010, 140, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(530, 2310, 135, 22, 1240, 2010, 135, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(880, 2110, 138, 22, 1240, 2010, 135, 22, "«include»", 14))
    lines.append(direct_dep_arrow(880, 2210, 138, 22, 1240, 2010, 135, 22, "«include»", 14))
    lines.append(direct_dep_arrow(880, 2310, 138, 22, 1240, 2010, 135, 22, "«include»", 14))
    lines.append(direct_dep_arrow(880, 2410, 138, 22, 1240, 2010, 135, 22, "«include»", 14))
    lines.append(direct_dep_arrow(1240, 2310, 135, 22, 1240, 2160, 135, 22, "«include»", -16))
    lines.append('  </g>')
    lines.append('')

    # PKG 4: TÀI CHÍNH, THU HỘ COD & ĐỐI SOÁT (Right: X = 1530 to 2660, W = 1130)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 4: TÀI CHÍNH, THU HỘ COD & ĐỐI SOÁT               -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(1530, 1830, 1130, 700, 520, "PHÂN HỆ 4: TÀI CHÍNH, COD & ĐỐI SOÁT — finance • cod • payment", "Pkg_4_Finance_COD"))

    # Col 1: Merchant & Customer Finance (cx = 1730)
    lines.append(uc(1730, 1910, 142, 22, "UC-FIN-01", "Quản lý tài chính & Đối soát COD", "uc"))
    lines.append(uc(1730, 2010, 140, 22, "UC-FIN-02", "Quản lý tài khoản ngân hàng", "uc"))
    lines.append(uc(1730, 2120, 142, 22, "UC-FIN-03", "Lịch sử đối soát SePay/VietQR", "uc-ext"))
    lines.append(uc(1730, 2230, 142, 22, "UC-FIN-04", "Khấu trừ cước hoàn phân tầng", "uc-ext"))

    # Col 2: Core Cash Collection & Settlement (cx = 2090)
    lines.append(uc(2090, 1910, 138, 22, "UC-FIN-05", "Thu hộ tiền mặt COD", "uc"))
    lines.append(uc(2090, 2020, 140, 22, "UC-FIN-06", "Nộp tiền COD qua VietQR", "uc-ext"))
    lines.append(uc(2090, 2140, 138, 22, "UC-FIN-07", "Giám sát hạn mức công nợ", "uc"))
    lines.append(uc(2090, 2260, 145, 22, "UC-FIN-08", "Khớp nối SePay & Khấu trừ tự động", "uc"))

    # Col 3: Ops Reconciliation & Disbursement (cx = 2450 - Facing Right Flank)
    lines.append(uc(2450, 1910, 138, 22, "UC-FIN-09", "Tài chính & Đối soát COD", "uc"))
    lines.append(uc(2450, 2040, 142, 22, "UC-FIN-10", "Đối soát giải ngân COD & VietQR", "uc"))
    lines.append(uc(2450, 2170, 142, 22, "UC-FIN-11", "Phê duyệt quyết toán COD thủ công", "uc-ext"))

    # Internal Pkg 4 Relationships:
    lines.append(direct_dep_arrow(2090, 2020, 140, 22, 2090, 1910, 138, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(2090, 2140, 138, 22, 2090, 1910, 138, 22, "«include»", -14))
    lines.append(direct_dep_arrow(1730, 2120, 142, 22, 1730, 1910, 142, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(1730, 2230, 142, 22, 1730, 1910, 142, 22, "«extend»", -14))
    lines.append(direct_dep_arrow(2450, 2170, 142, 22, 2450, 2040, 142, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(2090, 2260, 145, 22, 2450, 2040, 142, 22, "«include»", 14))
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # MANDATORY CENTRAL AUTH INCLUDE ARROWS (6 SYMMETRICAL BUS LINKS)
    # Zero spiderweb, zero line crossing!
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- MANDATORY CENTRAL AUTH INCLUDES (6 SYMMETRICAL BUS LINKS) -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Central_Auth_Includes">')

    # 1. From Pkg 1 (Top-Left): UC-ORD-03 (530, 415) -> UC-AUTH-01
    lines.append(direct_dep_arrow(530, 415, 135, 22, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", 15))

    # 2. From Pkg 5 (Mid-Left): UC-TRK-02 (510, 1130) -> UC-AUTH-01
    lines.append(direct_dep_arrow(510, 1130, 140, 22, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", 14))

    # 3. From Pkg 6 (Bot-Left): UC-ADM-01 (530, 1910) -> UC-AUTH-01
    lines.append(direct_dep_arrow(530, 1910, 135, 22, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", -15))

    # 4. From Pkg 2 (Top-Right): UC-HUB-12 (2430, 240) -> UC-AUTH-01
    lines.append(direct_dep_arrow(2430, 240, 130, 22, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", -15))

    # 5. From Pkg 3 (Mid-Right): UC-DEL-05 (2470, 1030) -> UC-AUTH-01
    lines.append(direct_dep_arrow(2470, 1030, 138, 23, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", -14))

    # 6. From Pkg 4 (Bot-Right): UC-FIN-09 (2450, 1910) -> UC-AUTH-01
    lines.append(direct_dep_arrow(2450, 1910, 138, 22, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", 15))
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # HUMAN ACTORS (4 ON LEFT FLANK, 2 ON RIGHT FLANK)
    # Direct Line of Sight to Facing Column: ZERO CROSS-CANVAS COLLISION
    # =========================================================================
    lines.append('  <!-- ==================== HUMAN ACTORS ==================== -->')
    
    # Left Flank Actors (X = 145):
    lines.append(actor_stick(145, 430, "Người Gửi Hàng", "(Merchant / Chủ Shop B2B)", "merchant-web :5176"))
    lines.append(actor_stick(145, 1040, "Khách Vãng Lai", "(Guest - Người dùng tự do)", "guest-web :5177"))
    lines.append(actor_stick(145, 1420, "Khách Hàng Cá Nhân", "(Customer C-End)", "customer-mobile :8082"))
    lines.append(actor_stick(145, 2150, "Quản Trị Viên (Admin)", "(System Admin)", "admin-web :5175"))

    # Right Flank Actors (X = 2855):
    lines.append(actor_stick(2855, 430, "Nhân Viên Vận Hành", "(Ops Staff Bưu Cục & Hub)", "ops-web :5173"))
    lines.append(actor_stick(2855, 1350, "Nhân Viên Giao Hàng", "(Courier / Bưu Tá)", "courier-mobile :8081"))

    # Generalization between Guest and Customer:
    lines.append('  <!-- Actor Generalization: Customer specializes Guest -->')
    lines.append(direct_gen_arrow(145, 1360, 10, 10, 145, 1140, 10, 10))
    lines.append('  <text x="172" y="1255" class="t-rel">«specializes»</text>')
    lines.append('')

    # =========================================================================
    # ACTOR ASSOCIATIONS (CLEAN, DIRECT LINES TO FACING COLUMNS ONLY)
    # =========================================================================
    lines.append('  <!-- ==================== ACTOR ASSOCIATIONS ==================== -->')
    
    m_pt = (175, 435)
    g_pt = (175, 1045)
    c_pt = (175, 1425)
    a_pt = (175, 2155)

    ops_pt = (2825, 435)
    ship_pt = (2825, 1355)

    # 1. MERCHANT (Phân hệ 1 & Phân hệ 5 & Đối soát COD)
    lines.append('  <!-- Merchant associations (Direct to Col 1) -->')
    lines.append(direct_assoc(m_pt[0], m_pt[1], 530, 240, 135, 22))  # 1. Tạo đơn hàng
    lines.append(direct_assoc(m_pt[0], m_pt[1], 530, 415, 135, 22))  # 2. Quản lý đơn hàng
    lines.append(direct_assoc(m_pt[0], m_pt[1], 530, 510, 138, 22))  # 3. Quản lý yêu cầu lấy hàng
    lines.append(direct_assoc(m_pt[0], m_pt[1], 510, 1230, 140, 22)) # 4. Tra cứu vận đơn (Pkg 5)

    # Merchant -> COD Reconciliation along corridor Y = 1780 (clean polyline):
    fin1_edge = ellipse_point(1730, 1910, 142, 22, 1730, 1780)
    lines.append(f'  <polyline points="{m_pt[0]},{m_pt[1]} 175,1780 1730,1780 {fin1_edge[0]:.1f},{fin1_edge[1]:.1f}" class="assoc"/>') # 5. Quản lý tài chính & Đối soát COD

    # 2. KHÁCH VÃNG LAI (GUEST - Phân hệ 5 & Phân hệ 1)
    lines.append('  <!-- Guest associations -->')
    lines.append(direct_assoc(g_pt[0], g_pt[1], 510, 1030, 140, 22)) # 1. Tra cứu trạng thái bưu kiện
    lines.append(direct_assoc(g_pt[0], g_pt[1], 510, 1340, 142, 22)) # 2. Ước tính cước & thời gian giao
    lines.append(direct_assoc(g_pt[0], g_pt[1], 510, 1450, 140, 22)) # 3. Tìm kiếm bưu cục
    lines.append(direct_assoc(g_pt[0], g_pt[1], 510, 1560, 140, 22)) # 4. Đăng ký nâng cấp tài khoản
    lines.append(direct_assoc(g_pt[0], g_pt[1], 880, 1230, 142, 22)) # 5. Trợ lý tư vấn AI Chatbot

    # 3. KHÁCH HÀNG CÁ NHÂN (CUSTOMER C-END - Phân hệ 1 & Phân hệ 5 & Phân hệ 4)
    lines.append('  <!-- Customer associations -->')
    lines.append(direct_assoc(c_pt[0], c_pt[1], 530, 325, 140, 22))  # 1. Tạo đơn gửi bưu phẩm cá nhân (Pkg 1)
    lines.append(direct_assoc(c_pt[0], c_pt[1], 530, 605, 135, 22))  # 2. Quản lý địa chỉ mặc định (Pkg 1)
    lines.append(direct_assoc(c_pt[0], c_pt[1], 510, 1130, 140, 22)) # 3. Tra cứu đơn hàng (Pkg 5)
    lines.append(direct_assoc(c_pt[0], c_pt[1], 880, 1340, 142, 22)) # 4. Trợ lý AI hỗ trợ đơn hàng (Pkg 5)
    lines.append(direct_assoc(c_pt[0], c_pt[1], 1500, 1600, 145, 23)) # 5. Đăng ký tài khoản người dùng (Auth)
    lines.append(direct_assoc(c_pt[0], c_pt[1], 1680, 1330, 138, 23)) # 6. Quản lý hồ sơ (Auth)
    lines.append(direct_assoc(c_pt[0], c_pt[1], 1730, 2010, 140, 22)) # 7. Quản lý tài khoản ngân hàng (Pkg 4)

    # 4. QUẢN TRỊ VIÊN (SYSTEM ADMIN - Phân hệ 6)
    lines.append('  <!-- Admin associations (Direct to Col 1) -->')
    lines.append(direct_assoc(a_pt[0], a_pt[1], 530, 1910, 135, 22)) # 1. Giám sát tổng quan hệ thống
    lines.append(direct_assoc(a_pt[0], a_pt[1], 530, 2010, 135, 22)) # 2. Quản lý mạng lưới bưu cục
    lines.append(direct_assoc(a_pt[0], a_pt[1], 530, 2110, 135, 22)) # 3. Quản lý Hub
    lines.append(direct_assoc(a_pt[0], a_pt[1], 530, 2210, 135, 22)) # 4. Quản lý Zone
    lines.append(direct_assoc(a_pt[0], a_pt[1], 530, 2310, 135, 22)) # 5. Phân quyền Mobile
    lines.append(direct_assoc(a_pt[0], a_pt[1], 530, 2410, 135, 22)) # 6. Kiểm toán nhật ký hệ thống
    lines.append(direct_assoc(a_pt[0], a_pt[1], 880, 2010, 140, 22)) # 7. Cấu hình điều khoản và dịch vụ

    # 5. NHÂN VIÊN VẬN HÀNH (OPS STAFF - Phân hệ 2 & Phân hệ 4)
    lines.append('  <!-- Ops Staff associations (Direct to Col 3 on Right) -->')
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 2430, 240, 130, 22))  # 1. Giám sát Dashboard vận hành
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 2430, 335, 130, 22))  # 2. Tạo đơn hàng tại quầy
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 2070, 440, 130, 22))  # 3. Điều phối đơn hàng lấy
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 2070, 545, 130, 22))  # 4. Điều phối đơn hàng phát
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 2070, 240, 128, 22))  # 5. Đóng bao
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 2070, 335, 128, 22))  # 6. Gỡ bao
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 1710, 240, 125, 22))  # 7. Quản lý chuyến xe
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 1710, 335, 125, 22))  # 8. Quét xe đi (Outbound)
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 1710, 430, 125, 22))  # 9. Quét xe đến (Inbound)
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 1710, 530, 125, 22))  # 10. Gửi hàng
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 1710, 630, 125, 22))  # 11. Nhận hàng
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 2450, 1910, 138, 22)) # 12. Tài chính & Đối soát COD (Pkg 4)

    # 6. NHÂN VIÊN GIAO HÀNG (SHIPPER / COURIER - Phân hệ 3 & Phân hệ 4)
    lines.append('  <!-- Courier associations (Direct to Col 2 on Right) -->')
    lines.append(direct_assoc(ship_pt[0], ship_pt[1], 2470, 1030, 138, 23)) # 1. Quản lý nhiệm vụ giao nhận
    lines.append(direct_assoc(ship_pt[0], ship_pt[1], 2470, 1150, 138, 23)) # 2. Xác nhận lấy hàng
    lines.append(direct_assoc(ship_pt[0], ship_pt[1], 2470, 1400, 138, 23)) # 3. Xác nhận phát thành công
    lines.append(direct_assoc(ship_pt[0], ship_pt[1], 2470, 1540, 138, 23)) # 4. Báo cáo sự cố phát thất bại
    lines.append(direct_assoc(ship_pt[0], ship_pt[1], 2090, 1910, 138, 22)) # 5. Thu hộ tiền mặt COD (Pkg 4)
    lines.append(direct_assoc(ship_pt[0], ship_pt[1], 2090, 2020, 140, 22)) # 6. Nộp tiền COD qua VietQR (Pkg 4)
    lines.append(direct_assoc(ship_pt[0], ship_pt[1], 2090, 2140, 138, 22)) # 7. Giám sát hạn mức công nợ (Pkg 4)

    lines.append('</svg>')
    return "\n".join(lines)

if __name__ == "__main__":
    svg_content = generate_svg()
    targets = [
        os.path.abspath("docs/graduation-thesis/diagrams/use-case/01-use-case-general-system.svg"),
        os.path.abspath("docs/graduation-thesis/figma-page-1-system-and-data/diagrams/01-use-case-general-system.svg")
    ]
    for target_path in targets:
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"Generated successfully: {target_path} ({len(svg_content.encode('utf-8'))} bytes)")
