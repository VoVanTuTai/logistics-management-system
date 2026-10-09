#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE THESIS GENERAL USE CASE DIAGRAM (MONOCHROME & ZERO-COLLISION UML 2.5)
=============================================================================
Chuẩn hóa đồ họa UML 2.5 cho Đồ Án Tốt Nghiệp:
- Bố cục Radial Symmetry với CỔNG XÁC THỰC & BẢO MẬT HỆ THỐNG nằm tại TÂM HỆ THỐNG (Center Hub).
- Ranh giới phân hệ rõ ràng, chừa khoảng trống thoáng đãng (corridors) để các đường mũi tên không bị chồng chéo.
- Tất cả các đường mũi tên tính toán chính xác tiếp điểm ellipse, không đi xuyên qua use case khác.
- Đầy đủ 100% quan hệ «include» bắt buộc vào UC-AUTH-01 cho tất cả các phân hệ yêu cầu đăng nhập (6 radial links đối xứng, không mạng nhện).
- Đầy đủ quan hệ «extend» nghiệp vụ chuẩn UML trên toàn bộ 6 phân hệ.
- Phong cách đồ họa kỹ thuật chuẩn mực: Đen trắng thuần túy (#000000, #FFFFFF, viền sắc nét, không thẻ <marker>, 100% native vector).
"""

import os
import math

def generate_svg():
    width = 2800
    height = 2600

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
    lines.append('      .sys-header { fill: #F0F4F8; stroke: #000000; stroke-width: 1.6; }')
    lines.append('      .pkg-tab { fill: #E8E8E8; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .pkg-body { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .gateway-tab { fill: #E2E8F0; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .gateway-body { fill: #FAFAFA; stroke: #000000; stroke-width: 2.0; stroke-dasharray: 6 3; }')
    lines.append('      .uc { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .uc-ext { fill: #FFFFFF; stroke: #000000; stroke-width: 1.3; stroke-dasharray: 5 3; }')
    lines.append('      .uc-abstract { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; stroke-dasharray: 3 3; }')
    lines.append('      .uc-core { fill: #FFFFFF; stroke: #000000; stroke-width: 2.5; }')
    lines.append('      .actor-head { fill: #FFFFFF; stroke: #000000; stroke-width: 2.2; }')
    lines.append('      .actor-body { stroke: #000000; stroke-width: 2.2; stroke-linecap: round; }')
    lines.append('      .t-main { font-family: "Segoe UI", Arial, sans-serif; font-size: 36px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }')
    lines.append('      .t-sub { font-family: "Segoe UI", Arial, sans-serif; font-size: 20px; fill: #4B5563; }')
    lines.append('      .t-boundary { font-family: "Segoe UI", Arial, sans-serif; font-size: 25px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }')
    lines.append('      .t-pkg { font-family: "Segoe UI", Arial, sans-serif; font-size: 23px; font-weight: bold; fill: #000000; letter-spacing: 0.3px; }')
    lines.append('      .t-gw-pkg { font-family: "Segoe UI", Arial, sans-serif; font-size: 23px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }')
    lines.append('      .t-ucid { font-family: "Courier New", monospace; font-size: 18.5px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-uc { font-family: "Segoe UI", Arial, sans-serif; font-size: 19.5px; font-weight: 600; fill: #111111; text-anchor: middle; }')
    lines.append('      .t-uc-abs { font-family: "Segoe UI", Arial, sans-serif; font-size: 19.5px; font-style: italic; font-weight: 600; fill: #222222; text-anchor: middle; }')
    lines.append('      .t-actor { font-family: "Segoe UI", Arial, sans-serif; font-size: 26px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-role { font-family: "Segoe UI", Arial, sans-serif; font-size: 18px; fill: #4B5563; text-anchor: middle; }')
    lines.append('      .t-app { font-family: "Courier New", monospace; font-size: 16.5px; font-weight: bold; fill: #1F2937; text-anchor: middle; }')
    lines.append('      .t-rel { font-family: "Courier New", monospace; font-size: 16px; font-weight: bold; fill: #000000; text-anchor: middle; }')
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
    lines.append('    <text x="50" y="64" class="t-main">SƠ ĐỒ USE CASE TỔNG QUÁT HỆ THỐNG NEXUS LOGISTICS (CHUẨN UML 2.5 / ĐỒ HỌA TRẮNG ĐEN)</text>')
    lines.append('    <text x="50" y="93" class="t-sub">Nghiệp Vụ Chuỗi Cung Ứng Cốt Lõi • Cổng Xác Thực Tâm Hệ Thống (Central Hub) • 6 Tác Nhân Con Người • 6 Phân Hệ Chuẩn Hóa</text>')
    lines.append(f'    <rect x="{width-430}" y="36" width="380" height="68" fill="#F5F5F5" stroke="#000000" stroke-width="1.3"/>')
    lines.append(f'    <text x="{width-415}" y="62" font-family="Segoe UI, Arial" font-size="14" font-weight="bold" fill="#000000">MÃ BẢN VẼ: UC-SYS-MONO-01</text>')
    lines.append(f'    <text x="{width-415}" y="86" font-family="Segoe UI, Arial" font-size="12" fill="#444444">OMG UML 2.5 • CENTRAL AUTH HUB EDITION</text>')
    lines.append('  </g>')
    lines.append('')

    # SYSTEM BOUNDARY (X: 320 to 2480, Width: 2160, Height: 2420 - Tight Snug Bottom)
    sb_x = 320
    sb_y = 120
    sb_w = 2160
    sb_h = 2420
    lines.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    lines.append('  <g id="System_Boundary">')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="980" height="36" class="sys-header"/>')
    lines.append(f'    <text x="{sb_x+20}" y="{sb_y+24}" class="t-boundary">«system» RANH GIỚI HỆ THỐNG: NEXUS LOGISTICS PLATFORM (CORE ERP SERVICES)</text>')
    lines.append('  </g>')
    lines.append('')

    # HELPER FUNCTIONS
    def uc(cx, cy, rx, ry, ucid, title, uctype="uc"):
        res = []
        eff_ry = max(ry, 44) if uctype == "uc-abstract" else max(ry, 36)
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
        eff_ry = max(ry, 36)
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
    # ROW 1 (Y = 170 to 830, H = 660):
    # Left: PHÂN HỆ 1 (Đơn hàng) | Right: PHÂN HỆ 2 (Bưu cục & Trung chuyển)
    # =========================================================================

    # PKG 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG (Left: X = 360 to 1320, W = 960)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG                   -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(360, 170, 960, 660, 480, "PHÂN HỆ 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG — shipment • pickup", "Pkg_1_Order_Shipment"))

    # Col 1: Creation & Booking (cx = 570 - Facing Left Flank)
    lines.append(uc(570, 240, 140, 22, "UC-ORD-01a", "Tạo đơn hàng Web Portal", "uc"))
    lines.append(uc(570, 320, 140, 22, "UC-ORD-01b", "Tạo đơn gửi hàng lẻ", "uc"))
    lines.append(uc(570, 400, 140, 22, "UC-ORD-01c", "Tạo đơn khách vãng lai", "uc"))
    lines.append(uc(570, 485, 140, 22, "UC-ORD-08", "Quản lý sổ địa chỉ", "uc-ext"))
    lines.append(uc(570, 570, 142, 22, "UC-ORD-09", "Đặt lịch hẹn lấy hàng Pickup", "uc-ext"))
    lines.append(uc(570, 675, 145, 23, "UC-ORD-02", "Quản lý danh sách đơn hàng", "uc"))

    # Col 2: Abstract Hub & Printing & LifeCycle (cx = 1110)
    lines.append(uc(1110, 320, 155, 25, "UC-ORD-01", "Tạo đơn gửi bưu phẩm", "uc-abstract"))
    lines.append(uc(1110, 420, 142, 22, "UC-ORD-05", "In nhãn phiếu gửi A6/A7", "uc"))
    lines.append(uc(1110, 500, 145, 22, "UC-ORD-07", "Gắn tem Hàng Dễ Vỡ [FRAGILE]", "uc-ext"))
    lines.append(uc(1110, 580, 142, 22, "UC-ORD-06", "In nhiều vận đơn hàng loạt", "uc-ext"))
    lines.append(uc(880, 755, 140, 22, "UC-ORD-03", "Yêu cầu đổi thông tin giao", "uc-ext"))
    lines.append(uc(1140, 675, 135, 22, "UC-ORD-04", "Hủy đơn hàng chưa lấy", "uc-ext"))
    lines.append(uc(1140, 755, 135, 22, "UC-ORD-04a", "Yêu cầu hoàn hàng sớm", "uc-ext"))

    # Internal Pkg 1 Relationships (Clean, Non-Crossing):
    lines.append(direct_gen_arrow(570, 240, 140, 22, 1110, 320, 155, 25))
    lines.append(direct_gen_arrow(570, 320, 140, 22, 1110, 320, 155, 25))
    lines.append(direct_gen_arrow(570, 400, 140, 22, 1110, 320, 155, 25))
    lines.append(direct_dep_arrow(570, 485, 140, 22, 1110, 320, 155, 25, "«extend»", 14))
    lines.append(direct_dep_arrow(570, 570, 142, 22, 1110, 320, 155, 25, "«extend»", 14))
    lines.append(direct_dep_arrow(1110, 320, 155, 25, 1110, 420, 142, 22, "«include»", 14))
    lines.append(direct_dep_arrow(1110, 500, 145, 22, 1110, 420, 142, 22, "«extend»", -35))
    lines.append(direct_dep_arrow(1110, 580, 142, 22, 1110, 500, 145, 22, "«extend»", -35))

    # Extended from UC-ORD-02 and UC-ORD-04:
    lines.append(direct_dep_arrow(880, 755, 140, 22, 570, 675, 145, 23, "«extend»", -14))
    lines.append(direct_dep_arrow(1140, 675, 135, 22, 570, 675, 145, 23, "«extend»", 14))
    lines.append(direct_dep_arrow(1140, 755, 135, 22, 1140, 675, 135, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(570, 675, 145, 23, 1110, 420, 142, 22, "«extend»", 14))
    lines.append('  </g>')
    lines.append('')

    # PKG 2: QUẢN TRỊ BƯU CỤC & TRUNG CHUYỂN HUB (Right: X = 1480 to 2440, W = 960)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 2: QUẢN TRỊ BƯU CỤC & TRUNG CHUYỂN HUB            -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(1480, 170, 960, 660, 480, "PHÂN HỆ 2: BƯU CỤC & TRUNG CHUYỂN — scan • manifest • dispatch", "Pkg_2_Hub_Operations"))

    # Col 1 (Fleet & Security - Internal): cx = 1640
    lines.append(uc(1640, 240, 120, 22, "UC-HUB-05", "Cấp tem niêm phong xe tải (XT)", "uc-ext"))
    lines.append(uc(1640, 320, 120, 22, "UC-HUB-04", "Quản lý xe tải Linehaul", "uc"))
    lines.append(uc(1640, 410, 120, 22, "UC-HUB-03", "Đóng seal niêm chì an ninh", "uc-ext"))
    lines.append(uc(1640, 520, 120, 22, "UC-HUB-08", "Gỡ bao & Kiểm đếm chia chọn", "uc"))
    lines.append(uc(1640, 630, 120, 22, "UC-HUB-09", "Quét bàn giao bưu tá (handoff)", "uc"))

    # Center-Hub Node: UC-HUB-02
    lines.append(uc(1960, 360, 128, 23, "UC-HUB-02", "Bảng kê manifest & Đóng bao", "uc"))
    lines.append(uc(1960, 240, 128, 22, "UC-HUB-01a", "Tra cứu hành trình đơn nội bộ", "uc-ext"))
    lines.append(uc(1960, 480, 128, 22, "UC-HUB-02a", "Phê duyệt yêu cầu Pickup", "uc-ext"))

    # Col 2 (Station & Dispatch - Facing Right Flank): cx = 2280
    lines.append(uc(2280, 240, 120, 22, "UC-HUB-01", "Giám sát Dashboard realtime", "uc"))
    lines.append(uc(2280, 320, 120, 22, "UC-HUB-01b", "Tạo đơn tại quầy (Walk-In)", "uc"))
    lines.append(uc(2280, 410, 120, 22, "UC-HUB-02b", "Gán việc shipper lấy & phát", "uc"))
    lines.append(uc(2280, 500, 120, 22, "UC-HUB-02c", "Xác nhận lấy hàng (Scan Pickup)", "uc"))
    lines.append(uc(2280, 610, 120, 22, "UC-HUB-06", "Quét xuất kho Outbound", "uc"))
    lines.append(uc(2280, 710, 120, 22, "UC-HUB-07", "Quét nhập kho Inbound", "uc"))

    # Internal Pkg 2 Relationships:
    lines.append(direct_dep_arrow(1960, 240, 128, 22, 2280, 240, 120, 22, "«extend»", -18))
    lines.append(direct_dep_arrow(1640, 240, 120, 22, 1640, 320, 120, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(1640, 320, 120, 22, 1960, 360, 128, 23, "«include»", -18))
    lines.append(direct_dep_arrow(1640, 410, 120, 22, 1960, 360, 128, 23, "«extend»", 18))
    lines.append(direct_dep_arrow(1960, 480, 128, 22, 2280, 410, 120, 22, "«extend»", 16))
    lines.append(direct_dep_arrow(1640, 520, 120, 22, 2280, 710, 120, 22, "«include»", 16))
    lines.append(direct_dep_arrow(1640, 630, 120, 22, 2280, 410, 120, 22, "«include»", 16))
    lines.append(direct_dep_arrow(2280, 410, 120, 22, 1960, 360, 128, 23, "«include»", -18))
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # ROW 2 (Y = 950 to 1740, H = 790):
    # Left: PHÂN HỆ 5 (Tra cứu & Cước) | Center: CỔNG XÁC THỰC | Right: PHÂN HỆ 3 (Giao hàng & NDR)
    # =========================================================================

    # PKG 5: TRA CỨU HÀNH TRÌNH & ĐỊNH GIÁ CƯỚC (Left: X = 360 to 1040, W = 680)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 5: TRA CỨU HÀNH TRÌNH & ĐỊNH GIÁ CƯỚC             -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(360, 950, 680, 790, 430, "PHÂN HỆ 5: TRA CỨU & CƯỚC PHÍ — tracking • pricing", "Pkg_5_Tracking_Pricing"))

    lines.append(uc(500, 1050, 145, 24, "UC-TRK-01a", "Tra cứu bưu kiện công khai", "uc"))
    lines.append(uc(500, 1170, 145, 24, "UC-TRK-01b", "Tra cứu hành trình realtime", "uc"))
    lines.append(uc(500, 1290, 145, 24, "UC-TRK-01c", "Tra cứu tiến độ (Merchant)", "uc"))
    lines.append(uc(875, 1170, 155, 26, "UC-TRK-01", "Tra cứu hành trình bưu phẩm", "uc-abstract"))

    # Sub-divider for pricing engine (eliminates empty space)
    lines.append('    <line x1="380" y1="1390" x2="1020" y2="1390" stroke="#CCCCCC" stroke-dasharray="4 4" stroke-width="1.2"/>')
    lines.append('    <text x="500" y="1418" font-family="Segoe UI, Arial" font-size="14.5" font-weight="bold" fill="#666666" text-anchor="middle">ĐỘNG CƠ TÍNH CƯỚC TỰ ĐỘNG</text>')

    lines.append(uc(485, 1500, 145, 24, "UC-PRC-01", "Ước tính cước phí chuẩn IATA", "uc"))
    lines.append(uc(910, 1500, 150, 24, "UC-PRC-02", "Động cơ cước chuẩn IATA V/6000", "uc"))

    # Internal Pkg 5 Relationships:
    lines.append(direct_gen_arrow(500, 1050, 145, 24, 875, 1170, 155, 26))
    lines.append(direct_gen_arrow(500, 1170, 145, 24, 875, 1170, 155, 26))
    lines.append(direct_gen_arrow(500, 1290, 145, 24, 875, 1170, 155, 26))
    lines.append(direct_dep_arrow(485, 1500, 145, 24, 910, 1500, 150, 24, "«include»", 16))
    lines.append('  </g>')
    lines.append('')

    # CENTER HUB: CỔNG XÁC THỰC & BẢO MẬT HỆ THỐNG (Center: X = 1100 to 1700, W = 600, Gap: 60px from Pkg 5)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- CỔNG XÁC THỰC & BẢO MẬT HỆ THỐNG (CENTRAL AUTH HUB)       -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(1100, 950, 600, 790, 410, "CỔNG XÁC THỰC & BẢO MẬT (auth-service • gateway)", "Central_Auth_Gateway", is_gateway=True))

    lines.append('    <rect x="1200" y="1015" width="400" height="36" rx="4" fill="#E2E8F0" stroke="#000000" stroke-width="1.3"/>')
    lines.append('    <text x="1400" y="1039" font-family="Courier New, monospace" font-size="15" font-weight="bold" fill="#000000" text-anchor="middle">CENTRAL IDENTITY PROVIDER (IDP)</text>')

    c_auth = (1400, 1200, 175, 28)
    lines.append(uc(c_auth[0], c_auth[1], c_auth[2], c_auth[3], "UC-AUTH-01", "Đăng nhập hệ thống (Core Auth)", "uc-core"))
    lines.append(uc(1245, 1410, 145, 24, "UC-AUTH-03", "Quản lý thông tin tài khoản", "uc-core"))
    lines.append(uc(1555, 1410, 140, 24, "UC-AUTH-02", "Đăng xuất hệ thống", "uc-ext"))
    
    lines.append(direct_dep_arrow(1245, 1410, 145, 24, 1400, 1200, 175, 28, "«include»", -16))
    lines.append(direct_dep_arrow(1555, 1410, 140, 24, 1400, 1200, 175, 28, "«extend»", 16))

    # Architecture Info Plate in Center Gateway:
    lines.append('    <rect x="1120" y="1570" width="560" height="64" fill="#F8F8F8" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 2" rx="4"/>')
    lines.append('    <text x="1400" y="1596" font-family="Courier New, monospace" font-size="13" font-weight="bold" fill="#000000" text-anchor="middle">Opaque Bearer Token • Session Isolation • RBAC Guard</text>')
    lines.append('    <text x="1400" y="1618" font-family="Segoe UI, Arial" font-size="13" fill="#374151" text-anchor="middle">Cổng bảo mật xác thực trung tâm kết nối trực tiếp 5 Phân hệ nghiệp vụ</text>')
    lines.append('  </g>')
    lines.append('')

    # PKG 3: GIAO HÀNG CHẶNG CUỐI & XỬ LÝ SỰ CỐ (Right: X = 1760 to 2440, W = 680, Gap: 60px from Center Hub)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 3: GIAO HÀNG CHẶNG CUỐI & XỬ LÝ SỰ CỐ            -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(1760, 950, 680, 790, 520, "PHÂN HỆ 3: GIAO HÀNG & SỰ CỐ — delivery • shipment", "Pkg_3_Delivery_NDR"))

    # Col 1 (NDR, RTS, Proof - Internal): cx = 1895
    lines.append(uc(1895, 1240, 135, 24, "UC-DEL-03", "Xác thực mã OTP 6 chữ số", "uc"))
    lines.append(uc(1895, 1350, 138, 24, "UC-DEL-04", "Chụp ảnh POD & Chữ ký số", "uc"))
    lines.append(uc(1895, 1480, 138, 24, "UC-DEL-07", "Xử lý sự cố phát thất bại (NDR)", "uc"))
    lines.append(uc(1895, 1600, 138, 24, "UC-DEL-08", "Quản lý & Tạo chuyến hoàn RTS", "uc-ext"))

    # Col 2 (Shipper tasks - Facing Right Flank): cx = 2260
    lines.append(uc(2260, 1040, 135, 24, "UC-DEL-01a", "Bản đồ dẫn đường & Định tuyến GPS", "uc-ext"))
    lines.append(uc(2260, 1145, 135, 24, "UC-DEL-01", "Quản lý danh sách nhiệm vụ giao", "uc"))
    lines.append(uc(2260, 1250, 135, 24, "UC-DEL-02", "Liên hệ người nhận (ẩn số)", "uc-ext"))
    lines.append(uc(2260, 1380, 138, 24, "UC-DEL-05", "Xác nhận đã giao hàng thành công", "uc"))
    lines.append(uc(2260, 1510, 135, 24, "UC-DEL-06", "Cập nhật NDR / Sự cố phát thất bại", "uc-ext"))
    lines.append(uc(2260, 1630, 135, 24, "UC-DEL-06a", "Hẹn lại ngày phát (Reschedule)", "uc-ext"))

    # Internal Pkg 3 Relationships:
    lines.append(direct_dep_arrow(2260, 1040, 135, 24, 2260, 1145, 135, 24, "«extend»", 14))
    lines.append(direct_dep_arrow(2260, 1250, 135, 24, 2260, 1145, 135, 24, "«extend»", 14))
    lines.append(direct_dep_arrow(1895, 1240, 135, 24, 2260, 1380, 138, 24, "«include»", -14))
    lines.append(direct_dep_arrow(1895, 1350, 138, 24, 2260, 1380, 138, 24, "«include»", -14))
    lines.append(direct_dep_arrow(2260, 1510, 135, 24, 2260, 1380, 138, 24, "«extend»", 14))
    lines.append(direct_dep_arrow(2260, 1630, 135, 24, 2260, 1510, 135, 24, "«extend»", 14))
    lines.append(direct_dep_arrow(1895, 1600, 138, 24, 1895, 1480, 138, 24, "«extend»", 14))
    lines.append(direct_dep_arrow(2260, 1510, 135, 24, 1895, 1480, 138, 24, "«include»", 14))
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # ROW 3 (Y = 1860 to 2520, H = 660):
    # Left: PHÂN HỆ 6 (Quản trị & RBAC) | Right: PHÂN HỆ 4 (Tài chính & COD)
    # =========================================================================

    # PKG 6: QUẢN TRỊ TOÀN HỆ THỐNG & PHÂN QUYỀN RBAC (Left: X = 360 to 1320, W = 960)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 6: QUẢN TRỊ TOÀN HỆ THỐNG & PHÂN QUYỀN RBAC       -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(360, 1860, 960, 660, 480, "PHÂN HỆ 6: QUẢN TRỊ HỆ THỐNG & RBAC — masterdata • rbac", "Pkg_6_System_Admin"))

    # Col 1 (Primary Admin modules - Facing Left Flank): cx = 570
    lines.append(uc(570, 1940, 140, 22, "UC-ADM-01", "Quản lý tài khoản toàn hệ thống", "uc"))
    lines.append(uc(570, 2040, 142, 22, "UC-ADM-03", "Quản lý phân quyền RBAC Matrix", "uc"))
    lines.append(uc(570, 2140, 140, 22, "UC-ADM-05", "Quản lý danh mục Hub 4 cấp", "uc"))
    lines.append(uc(570, 2240, 140, 22, "UC-ADM-08", "Cấu hình tham số hệ thống", "uc"))
    lines.append(uc(570, 2340, 140, 22, "UC-ADM-09", "Kiểm toán nhật ký hệ thống", "uc"))

    # Col 2 (Extensions & Pipelines - Internal): cx = 1110
    lines.append(uc(1110, 1940, 140, 22, "UC-ADM-02", "Phân công nhân sự & Tuyến", "uc-ext"))
    lines.append(uc(1110, 2040, 140, 22, "UC-ADM-04", "Phân quyền mobile override", "uc-ext"))
    lines.append(uc(1110, 2140, 140, 22, "UC-ADM-06", "Quản lý khu vực / Zone địa lý", "uc"))
    lines.append(uc(1110, 2240, 140, 22, "UC-ADM-07", "Danh mục lý do giao NDR", "uc-ext"))
    lines.append(uc(1110, 2340, 140, 22, "UC-ADM-10", "Chuyển giao Outbox & RabbitMQ", "uc"))
    lines.append(uc(1110, 2430, 140, 22, "UC-ADM-11", "Chiếu Read Model Timeline & KPI", "uc"))

    # Internal Pkg 6 Relationships (Clean horizontal arrows):
    lines.append(direct_dep_arrow(1110, 1940, 140, 22, 570, 1940, 140, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(1110, 2040, 140, 22, 570, 2040, 142, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(1110, 2140, 140, 22, 570, 2140, 140, 22, "«include»", 14))
    lines.append(direct_dep_arrow(1110, 2240, 140, 22, 570, 2240, 140, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(1110, 2430, 140, 22, 1110, 2340, 140, 22, "«include»", 14))
    lines.append('  </g>')
    lines.append('')

    # PKG 4: TÀI CHÍNH, THU HỘ COD & ĐỐI SOÁT (Right: X = 1480 to 2440, W = 960)
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PHÂN HỆ 4: TÀI CHÍNH, THU HỘ COD & ĐỐI SOÁT               -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append(pkg_folder(1480, 1860, 960, 660, 480, "PHÂN HỆ 4: TÀI CHÍNH, COD & ĐỐI SOÁT — finance • payment", "Pkg_4_Finance_COD"))

    # Col 1 (Merchant & Engine - Internal): cx = 1690
    lines.append(uc(1690, 1940, 142, 22, "UC-FIN-05", "Lịch sử đối soát SePay/VietQR", "uc"))
    lines.append(uc(1690, 2040, 142, 22, "UC-FIN-07", "Khấu trừ cước hoàn phân tầng", "uc-ext"))
    lines.append(uc(1690, 2150, 145, 22, "UC-FIN-06", "Khớp nối SePay & Khấu trừ tự động", "uc"))

    # Col 2 (Shipper & Ops Staff - Facing Right Flank): cx = 2230
    lines.append(uc(2230, 1940, 140, 22, "UC-FIN-01", "Thu hộ tiền mặt COD", "uc"))
    lines.append(uc(2230, 2040, 140, 22, "UC-FIN-02", "Nộp tiền COD qua VietQR", "uc-ext"))
    lines.append(uc(2230, 2150, 145, 22, "UC-FIN-04", "Đối soát giải ngân COD & VietQR", "uc"))
    lines.append(uc(2230, 2260, 145, 22, "UC-FIN-03", "Phê duyệt quyết toán COD thủ công", "uc-ext"))

    # Internal Pkg 4 Relationships:
    lines.append(direct_dep_arrow(2230, 2040, 140, 22, 2230, 1940, 140, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(1690, 2040, 142, 22, 1690, 1940, 142, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(2230, 2260, 145, 22, 2230, 2150, 145, 22, "«extend»", 14))
    lines.append(direct_dep_arrow(1690, 2150, 145, 22, 2230, 2150, 145, 22, "«include»", 14))
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # MANDATORY CENTRAL AUTH INCLUDE ARROWS (6 SYMMETRICAL RADIAL LINKS)
    # Zero spiderweb, zero line crossing!
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- MANDATORY CENTRAL AUTH INCLUDES (6 SYMMETRICAL BUS LINKS) -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Central_Auth_Includes">')

    # 1. From Pkg 1 (Top-Left): UC-ORD-02 (570, 675) -> UC-AUTH-01
    lines.append(direct_dep_arrow(570, 675, 145, 23, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", 15))

    # 2. From Pkg 5 (Mid-Left): UC-TRK-01c (500, 1290) -> UC-AUTH-01
    lines.append(direct_dep_arrow(500, 1290, 145, 24, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", 14))

    # 3. From Pkg 6 (Bot-Left): UC-ADM-01 (570, 1940) -> UC-AUTH-01
    lines.append(direct_dep_arrow(570, 1940, 140, 22, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", -15))

    # 4. From Pkg 2 (Top-Right): UC-HUB-01 (2280, 240) -> UC-AUTH-01
    lines.append(direct_dep_arrow(2280, 240, 120, 22, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", -15))

    # 5. From Pkg 3 (Mid-Right): UC-DEL-01 (2260, 1145) -> UC-AUTH-01
    lines.append(direct_dep_arrow(2260, 1145, 135, 24, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", -14))

    # 6. From Pkg 4 (Bot-Right): UC-FIN-04 (2230, 2150) -> UC-AUTH-01
    lines.append(direct_dep_arrow(2230, 2150, 145, 22, c_auth[0], c_auth[1], c_auth[2], c_auth[3], "«include»", 15))
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # HUMAN ACTORS (4 ON LEFT FLANK, 2 ON RIGHT FLANK)
    # Direct Line of Sight to Facing Column: ZERO CROSS-CANVAS COLLISION
    # =========================================================================
    lines.append('  <!-- ==================== HUMAN ACTORS ==================== -->')
    
    # Left Flank Actors:
    lines.append(actor_stick(150, 480, "Người Gửi Hàng", "(Merchant / Chủ Shop B2B)", "merchant-web :5176"))
    lines.append(actor_stick(150, 1060, "Khách Vãng Lai", "(Guest - Người dùng tự do)", "guest-web :5177"))
    lines.append(actor_stick(150, 1400, "Khách Hàng Cá Nhân", "(Customer C-End)", "customer-mobile :8082"))
    lines.append(actor_stick(150, 2150, "Quản Trị Viên (Admin)", "(System Admin)", "admin-web :5175"))

    # Right Flank Actors:
    lines.append(actor_stick(2650, 480, "Nhân Viên Vận Hành", "(Ops Staff Bưu Cục & Hub)", "ops-web :5173"))
    lines.append(actor_stick(2650, 1350, "Nhân Viên Giao Hàng", "(Shipper / Tài Xế Chặng Cuối)", "courier-mobile :8081"))

    # Generalization between Guest and Customer:
    lines.append('  <!-- Actor Generalization: Customer specializes Guest -->')
    lines.append(direct_gen_arrow(150, 1340, 10, 10, 150, 1140, 10, 10))
    lines.append('  <text x="175" y="1245" class="t-rel">«specializes»</text>')
    lines.append('')

    # =========================================================================
    # ACTOR ASSOCIATIONS (CLEAN, DIRECT LINES TO FACING COLUMNS ONLY)
    # =========================================================================
    lines.append('  <!-- ==================== ACTOR ASSOCIATIONS ==================== -->')
    
    m_pt = (175, 485)
    g_pt = (175, 1065)
    c_pt = (175, 1405)
    a_pt = (175, 2155)

    ops_pt = (2625, 485)
    ship_pt = (2625, 1355)

    # 1. MERCHANT (Phân hệ 1 & Phân hệ 5 & Đối soát COD)
    lines.append('  <!-- Merchant associations (Direct to Col 1) -->')
    lines.append(direct_assoc(m_pt[0], m_pt[1], 570, 240, 140, 22))  # 1. Tạo đơn Web
    lines.append(direct_assoc(m_pt[0], m_pt[1], 570, 485, 140, 22))  # 2. Quản lý sổ địa chỉ
    lines.append(direct_assoc(m_pt[0], m_pt[1], 570, 570, 142, 22))  # 3. Đặt lịch hẹn lấy hàng
    lines.append(direct_assoc(m_pt[0], m_pt[1], 570, 675, 145, 23))  # 4. Quản lý danh sách đơn
    lines.append(direct_assoc(m_pt[0], m_pt[1], 500, 1290, 145, 24)) # 5. Tra cứu tiến độ B2B (Pkg 5)

    # Merchant -> COD Reconciliation along corridor Y = 1800 (clean polyline):
    fin5_edge = ellipse_point(1690, 1940, 142, 22, 1690, 1800)
    lines.append(f'  <polyline points="{m_pt[0]},{m_pt[1]} 175,1800 1690,1800 {fin5_edge[0]:.1f},{fin5_edge[1]:.1f}" class="assoc"/>') # 6. Lịch sử đối soát COD

    # 2. KHÁCH VÃNG LAI (GUEST - Phân hệ 1 & Phân hệ 5)
    lines.append('  <!-- Guest associations -->')
    lines.append(direct_assoc(g_pt[0], g_pt[1], 570, 400, 140, 22))  # 1. Tạo đơn khách vãng lai (Pkg 1)
    lines.append(direct_assoc(g_pt[0], g_pt[1], 500, 1050, 145, 24)) # 2. Tra cứu bưu kiện công khai (Pkg 5)
    lines.append(direct_assoc(g_pt[0], g_pt[1], 500, 1500, 145, 24)) # 3. Ước tính cước IATA (Pkg 5)

    # 3. KHÁCH HÀNG CÁ NHÂN (CUSTOMER C-END - Phân hệ 1 & Phân hệ 5)
    lines.append('  <!-- Customer associations -->')
    lines.append(direct_assoc(c_pt[0], c_pt[1], 570, 320, 140, 22))  # 1. Tạo đơn gửi hàng lẻ (Pkg 1)
    lines.append(direct_assoc(c_pt[0], c_pt[1], 500, 1170, 145, 24)) # 2. Tra cứu hành trình realtime (Pkg 5)
    lines.append(direct_assoc(c_pt[0], c_pt[1], 500, 1500, 145, 24)) # 3. Tính cước chuẩn IATA (Pkg 5)

    # 4. QUẢN TRỊ VIÊN (SYSTEM ADMIN - Phân hệ 6)
    lines.append('  <!-- Admin associations (Direct to Col 1) -->')
    lines.append(direct_assoc(a_pt[0], a_pt[1], 570, 1940, 140, 22)) # 1. Quản lý tài khoản toàn hệ thống
    lines.append(direct_assoc(a_pt[0], a_pt[1], 570, 2040, 142, 22)) # 2. Quản lý phân quyền RBAC Matrix
    lines.append(direct_assoc(a_pt[0], a_pt[1], 570, 2140, 140, 22)) # 3. Quản lý danh mục Hub 4 cấp
    lines.append(direct_assoc(a_pt[0], a_pt[1], 570, 2240, 140, 22)) # 4. Cấu hình tham số hệ thống
    lines.append(direct_assoc(a_pt[0], a_pt[1], 570, 2340, 140, 22)) # 5. Kiểm toán nhật ký hệ thống

    # 5. NHÂN VIÊN VẬN HÀNH (OPS STAFF - Phân hệ 2 & Phân hệ 4)
    lines.append('  <!-- Ops Staff associations (Direct to Col 2 on Right) -->')
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 2280, 240, 120, 22))  # 1. Giám sát Dashboard
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 2280, 320, 120, 22))  # 2. Tạo đơn tại quầy
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 2280, 410, 120, 22))  # 3. Gán việc shipper
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 2280, 500, 120, 22))  # 4. Xác nhận lấy hàng
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 2280, 610, 120, 22))  # 5. Quét xuất Outbound
    lines.append(direct_assoc(ops_pt[0], ops_pt[1], 2280, 710, 120, 22))  # 6. Quét nhập Inbound
        # Route Ops Staff -> COD Reconciliation along clean outer corridor X=2550:
    fin4_edge = ellipse_point(2230, 2150, 145, 22, 2550, 2150)
    lines.append(f'  <polyline points="{ops_pt[0]},{ops_pt[1]} 2550,{ops_pt[1]} 2550,2150 {fin4_edge[0]:.1f},{fin4_edge[1]:.1f}" class="assoc"/>') # 7. Đối soát giải ngân COD (Pkg 4)

    # 6. NHÂN VIÊN GIAO HÀNG (SHIPPER - Phân hệ 3 & Phân hệ 4)
    lines.append('  <!-- Shipper associations (Direct to Col 2 on Right) -->')
    lines.append(direct_assoc(ship_pt[0], ship_pt[1], 2260, 1145, 135, 24)) # 1. Quản lý danh sách nhiệm vụ (UC-DEL-01)
    lines.append(direct_assoc(ship_pt[0], ship_pt[1], 2260, 1380, 138, 24)) # 2. Xác nhận đã giao hàng (UC-DEL-05)
    lines.append(direct_assoc(ship_pt[0], ship_pt[1], 2260, 1510, 135, 24)) # 3. Cập nhật NDR thất bại (UC-DEL-06)
    lines.append(direct_assoc(ship_pt[0], ship_pt[1], 2230, 1940, 140, 22)) # 4. Thu hộ tiền mặt COD (UC-FIN-01)

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
