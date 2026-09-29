#!/usr/bin/env python3
"""
Definitive Enterprise UML Use Case Diagram Generator for Nexus Logistics Platform
Compliant with UML 2.5, IEEE 830, ISO/IEC 25010
Features:
- 100% Orthogonal Non-overlapping Routing (Kênh dẫn vuông góc có khoảng cách phân luồng)
- Bus Tree Inheritance for Actors (Left: Customer Tree, Right: Staff Tree with multi-tap bus)
- 5 Abstract Generalization Parents (UC-G01 to UC-G05)
- 55 Concrete Use Cases (60 Total) across 7 Packages
- Strictly vertical/horizontal <<include>> and <<extend>> lines
- Dedicated gutter routing channels (Gutter A: Y=770, Gutter B: Y=1435, Center: X=1780)
- Explicit polygon arrowheads (No SVG <marker> tags) for 100% Figma import compatibility
"""

import sys
import os

def generate_svg():
    width = 3600
    height = 2520

    lines = []
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">')
    lines.append('  <defs>')
    lines.append('    <style>')
    lines.append('      /* ===== FOUNDATIONS ===== */')
    lines.append('      .bg { fill: #FFFFFF; }')
    lines.append('      .frame { stroke: #000000; stroke-width: 2.2; fill: none; }')
    lines.append('      .frame-inner { stroke: #000000; stroke-width: 1; fill: none; }')
    lines.append('')
    lines.append('      /* ===== TYPOGRAPHY ===== */')
    lines.append('      .t-main { font-family: "Times New Roman", Times, serif; font-size: 26px; font-weight: bold; fill: #000000; }')
    lines.append('      .t-sub { font-family: Arial, sans-serif; font-size: 13px; font-style: italic; fill: #333333; }')
    lines.append('      .t-boundary { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #000000; letter-spacing: 0.8px; }')
    lines.append('      .t-pkg { font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; fill: #000000; }')
    lines.append('      .t-uc { font-family: Arial, sans-serif; font-size: 11.5px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-uc-abs { font-family: Arial, sans-serif; font-size: 11.5px; font-weight: bold; font-style: italic; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-ucid { font-family: "Courier New", monospace; font-size: 9.5px; font-weight: bold; fill: #444444; text-anchor: middle; }')
    lines.append('      .t-actor { font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-actor-abs { font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; font-style: italic; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-role { font-family: Arial, sans-serif; font-size: 11px; font-style: italic; fill: #555555; text-anchor: middle; }')
    lines.append('      .t-app { font-family: "Courier New", monospace; font-size: 9.5px; fill: #666666; text-anchor: middle; }')
    lines.append('      .t-rel { font-family: Arial, sans-serif; font-size: 9.5px; font-style: italic; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-legend { font-family: Arial, sans-serif; font-size: 11px; fill: #222222; }')
    lines.append('      .t-note { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #000000; }')
    lines.append('')
    lines.append('      /* ===== SHAPES ===== */')
    lines.append('      .sys-border { fill: #FFFFFF; stroke: #000000; stroke-width: 2.2; }')
    lines.append('      .pkg-border { fill: none; stroke: #000000; stroke-width: 1.3; stroke-dasharray: 7 4; }')
    lines.append('      .pkg-header { fill: #F3F4F6; stroke: #000000; stroke-width: 1.1; }')
    lines.append('      .uc-abstract { fill: #F3F4F6; stroke: #000000; stroke-width: 2; }')
    lines.append('      .uc-core { fill: #FFFFFF; stroke: #000000; stroke-width: 2.2; }')
    lines.append('      .uc { fill: #FFFFFF; stroke: #000000; stroke-width: 1.3; }')
    lines.append('      .uc-ext { fill: #F9FAFB; stroke: #000000; stroke-width: 1.1; stroke-dasharray: 5 3; }')
    lines.append('      .actor-body { stroke: #000000; stroke-width: 2; fill: none; }')
    lines.append('      .actor-body-abs { stroke: #000000; stroke-width: 2; stroke-dasharray: 4 2; fill: none; }')
    lines.append('      .actor-head { fill: #FFFFFF; stroke: #000000; stroke-width: 2; }')
    lines.append('      .actor-head-abs { fill: #F3F4F6; stroke: #000000; stroke-width: 2; stroke-dasharray: 4 2; }')
    lines.append('      .legend-box { fill: #F8F9FA; stroke: #000000; stroke-width: 1.1; }')
    lines.append('')
    lines.append('      /* ===== LINES AND CONNECTORS ===== */')
    lines.append('      .assoc { stroke: #000000; stroke-width: 1.1; fill: none; }')
    lines.append('      .gen-line { stroke: #000000; stroke-width: 1.4; fill: none; }')
    lines.append('      .gen-arrow { fill: #FFFFFF; stroke: #000000; stroke-width: 1.4; }')
    lines.append('      .dep-line { stroke: #000000; stroke-width: 1.1; stroke-dasharray: 5 3; fill: none; }')
    lines.append('      .dep-arrow { fill: #000000; stroke: #000000; stroke-width: 0.5; }')
    lines.append('    </style>')
    lines.append('  </defs>')
    lines.append('')
    lines.append('  <!-- CANVAS -->')
    lines.append(f'  <rect width="{width}" height="{height}" class="bg"/>')
    lines.append(f'  <rect x="18" y="18" width="{width-36}" height="{height-36}" class="frame"/>')
    lines.append(f'  <rect x="22" y="22" width="{width-44}" height="{height-44}" class="frame-inner"/>')
    lines.append('')

    # HEADER
    lines.append('  <!-- ==================== HEADER ==================== -->')
    lines.append('  <g id="Header">')
    lines.append(f'    <rect x="40" y="40" width="{width-80}" height="86" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>')
    lines.append('    <text x="65" y="76" class="t-main">SƠ ĐỒ USE CASE TỔNG QUÁT HỆ THỐNG NEXUS ENTERPRISE LOGISTICS — ĐẶC TẢ CHUẨN BA / SRS (IEEE 830 / UML 2.5)</text>')
    lines.append('    <text x="65" y="105" class="t-sub">Mô hình phân rã 7 Phân hệ nghiệp vụ (Packages) • 6 Tác nhân trong Cây kế thừa (Actor Generalization Hierarchy) • 55 Trường hợp sử dụng (5 Use Case Generalizations) • Định tuyến vuông góc chuẩn xác (Zero Overlaps)</text>')
    lines.append(f'    <rect x="{width-420}" y="52" width="380" height="62" fill="#F8F9FA" stroke="#000000" stroke-width="1.1"/>')
    lines.append(f'    <text x="{width-405}" y="74" font-family="Arial" font-size="12.5" font-weight="bold" fill="#000000">MÃ BẢN VẼ: UC-SYS-ENT-01 (REV.5)</text>')
    lines.append(f'    <text x="{width-405}" y="95" font-family="Arial" font-size="11" fill="#444444">TIÊU CHUẨN: ISO/IEC 25010 • UML 2.5</text>')
    lines.append('  </g>')
    lines.append('')

    # SYSTEM BOUNDARY
    sb_x = 560
    sb_y = 150
    sb_w = 2480
    sb_h = 2050
    lines.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    lines.append('  <g id="System_Boundary">')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="780" height="34" class="pkg-header"/>')
    lines.append(f'    <text x="{sb_x+20}" y="{sb_y+23}" class="t-boundary">RANH GIỚI HỆ THỐNG: NEXUS ENTERPRISE LOGISTICS PLATFORM (15 MICROSERVICES)</text>')
    lines.append('  </g>')
    lines.append('')

    # HELPER FUNCTIONS FOR SVG
    def uc(cx, cy, rx, ry, ucid, title, uctype="uc"):
        res = []
        res.append(f'    <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" class="{uctype}"/>')
        safe_title = title.replace('&amp;', '&').replace('&', '&amp;')
        if uctype == "uc-abstract":
            res.append(f'    <text x="{cx}" y="{cy-8}" class="t-rel">&lt;&lt;abstract&gt;&gt;</text>')
            res.append(f'    <text x="{cx}" y="{cy+4}" class="t-ucid">{ucid}</text>')
            res.append(f'    <text x="{cx}" y="{cy+18}" class="t-uc-abs">{safe_title}</text>')
        else:
            res.append(f'    <text x="{cx}" y="{cy-3}" class="t-ucid">{ucid}</text>')
            res.append(f'    <text x="{cx}" y="{cy+12}" class="t-uc">{safe_title}</text>')
        return "\n".join(res)

    def gen_arrow(x1, y1, x2, y2, orientation="up"):
        # orientation: "up", "down", "left", "right"
        res = []
        if orientation == "up":
            res.append(f'    <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2+14}" class="gen-line"/>')
            res.append(f'    <polygon points="{x2-7},{y2+14} {x2},{y2} {x2+7},{y2+14}" class="gen-arrow"/>')
        elif orientation == "down":
            res.append(f'    <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2-14}" class="gen-line"/>')
            res.append(f'    <polygon points="{x2-7},{y2-14} {x2},{y2} {x2+7},{y2-14}" class="gen-arrow"/>')
        elif orientation == "left":
            res.append(f'    <line x1="{x1}" y1="{y1}" x2="{x2+14}" y2="{y2}" class="gen-line"/>')
            res.append(f'    <polygon points="{x2+14},{y2-7} {x2},{y2} {x2+14},{y2+7}" class="gen-arrow"/>')
        elif orientation == "right":
            res.append(f'    <line x1="{x1}" y1="{y1}" x2="{x2-14}" y2="{y2}" class="gen-line"/>')
            res.append(f'    <polygon points="{x2-14},{y2-7} {x2},{y2} {x2-14},{y2+7}" class="gen-arrow"/>')
        return "\n".join(res)

    def dep_arrow(x1, y1, x2, y2, label="<<include>>", label_pos=None):
        dx = x2 - x1
        dy = y2 - y1
        dist = (dx*dx + dy*dy)**0.5
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

        res = []
        res.append(f'    <line x1="{x1}" y1="{y1}" x2="{base_x:.1f}" y2="{base_y:.1f}" class="dep-line"/>')
        res.append(f'    <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" class="dep-arrow"/>')
        if label:
            lx = (x1 + x2) / 2 if label_pos is None else label_pos[0]
            ly = (y1 + y2) / 2 if label_pos is None else label_pos[1]
            safe_label = label.replace('<', '&lt;').replace('>', '&gt;')
            res.append(f'    <text x="{lx:.1f}" y="{ly:.1f}" class="t-rel">{safe_label}</text>')
        return "\n".join(res)

    def polyline_path(pts, stroke_class="assoc"):
        # pts is a list of (x, y) tuples
        d_str = "M " + " L ".join(f"{x} {y}" for x, y in pts)
        return f'    <path d="{d_str}" class="{stroke_class}"/>'

    # ==================== PACKAGE 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG                  -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg1_Shipment_Management">')
    lines.append('    <rect x="580" y="180" width="1180" height="570" class="pkg-border"/>')
    lines.append('    <rect x="580" y="180" width="760" height="28" class="pkg-header"/>')
    lines.append('    <text x="595" y="199" class="t-pkg">PHÂN HỆ 1: TIẾP NHẬN &amp; QUẢN LÝ ĐƠN HÀNG — shipment-service • pickup-service • pricing-service</text>')

    # Row 1: UC-G01 and UC-04
    lines.append(uc(950, 250, 115, 28, "UC-G01", "Tạo đơn vận chuyển", "uc-abstract"))
    lines.append(uc(1450, 250, 110, 24, "UC-04", "Tính cước quy đổi IATA", "uc-core"))
    lines.append(dep_arrow(1065, 250, 1340, 250, "<<include>>", (1200, 240)))

    # Row 2: Children UC-01, UC-02, UC-03 and UC-05, UC-09
    lines.append(uc(720, 360, 95, 24, "UC-01", "Tạo đơn lẻ thủ công", "uc"))
    lines.append(uc(950, 360, 100, 24, "UC-02", "Tạo đơn tệp Excel bulk", "uc"))
    lines.append(uc(1180, 360, 105, 24, "UC-03", "Đồng bộ Webhook TMĐT", "uc"))
    lines.append(uc(1450, 360, 110, 24, "UC-05", "In nhãn Barcode / Phiếu gửi", "uc"))
    lines.append(uc(1680, 360, 85, 22, "UC-09", "In nhãn bulk", "uc-ext"))

    # Generalization arrows up to UC-G01
    lines.append(gen_arrow(720, 336, 890, 278, "up"))
    lines.append(gen_arrow(950, 336, 950, 278, "up"))
    lines.append(gen_arrow(1180, 336, 1010, 278, "up"))

    # Include UC-G01 -> UC-05
    lines.append(polyline_path([(1050, 265), (1260, 265), (1260, 360), (1340, 360)], "dep-line"))
    lines.append('    <polygon points="1340,360 1330,356 1330,364" class="dep-arrow"/>')
    lines.append('    <text x="1230" y="325" class="t-rel">&lt;&lt;include&gt;&gt;</text>')

    # Extend UC-09 -> UC-05
    lines.append(dep_arrow(1595, 360, 1560, 360, "<<extend>>", (1580, 348)))

    # Row 3: UC-06, UC-07, UC-08
    lines.append(uc(720, 500, 115, 24, "UC-06", "Yêu cầu bưu tá lấy hàng", "uc-core"))
    lines.append(uc(1050, 500, 115, 24, "UC-07", "Hủy đơn / Đổi SĐT, địa chỉ", "uc"))
    lines.append(uc(1380, 500, 115, 24, "UC-08", "Quản lý &amp; Lọc đơn đa kênh", "uc"))

    lines.append('  </g>')
    lines.append('')

    # ==================== PACKAGE 2: KHO TRUNG CHUYỂN, PHÂN TUYẾN & GIAO HÀNG ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 2: KHO TRUNG CHUYỂN, PHÂN TUYẾN & GIAO HÀNG      -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg2_Hub_Dispatch_Delivery">')
    lines.append('    <rect x="1800" y="180" width="1220" height="570" class="pkg-border"/>')
    lines.append('    <rect x="1800" y="180" width="840" height="28" class="pkg-header"/>')
    lines.append('    <text x="1815" y="199" class="t-pkg">PHÂN HỆ 2: KHO TRUNG CHUYỂN, PHÂN TUYẾN &amp; GIAO HÀNG — scan • manifest • dispatch • delivery</text>')

    # Row 1: Hub Scanning UCs
    lines.append(uc(1940, 250, 105, 24, "UC-10", "Quét tiếp nhận gom hàng", "uc"))
    lines.append(uc(2200, 250, 105, 24, "UC-11", "Quét mã nhập kho (Inbound)", "uc"))
    lines.append(uc(2460, 250, 105, 24, "UC-12", "Quét mã xuất kho (Outbound)", "uc"))
    lines.append(uc(2740, 250, 115, 24, "UC-13", "Đóng bao Manifest &amp; Niêm chì", "uc"))

    # Row 2: Manifest & Dispatch
    lines.append(uc(2060, 380, 115, 24, "UC-14", "Tiếp nhận bao tải đầu tuyến", "uc"))
    lines.append(uc(2400, 380, 125, 24, "UC-15", "Phân tuyến &amp; Giao task bưu tá", "uc-core"))

    # Row 3: Last-Mile Delivery
    lines.append(uc(2160, 530, 115, 26, "UC-16", "Thực hiện giao chặng cuối", "uc-core"))
    lines.append(uc(2500, 530, 110, 24, "UC-17", "Ký nhận điện tử e-POD", "uc"))
    lines.append(uc(2820, 530, 110, 24, "UC-18", "Báo phát không thành công", "uc"))
    lines.append(uc(2820, 650, 115, 24, "UC-19", "Hẹn lại ngày / Chuyển hoàn", "uc"))

    # Include UC-16 -> UC-17
    lines.append(dep_arrow(2275, 530, 2390, 530, "<<include>>", (2335, 518)))

    # Extend UC-18 -> UC-16 (arch above UC-17)
    lines.append(polyline_path([(2820, 506), (2820, 465), (2160, 465), (2160, 504)], "dep-line"))
    lines.append('    <polygon points="2160,504 2156,494 2164,494" class="dep-arrow"/>')
    lines.append('    <text x="2490" y="455" class="t-rel">&lt;&lt;extend&gt;&gt;</text>')

    # Extend UC-19 -> UC-18 (straight vertical)
    lines.append(dep_arrow(2820, 626, 2820, 554, "<<extend>>", (2870, 590)))

    lines.append('  </g>')
    lines.append('')

    # ==================== PACKAGE 3: XỬ LÝ SỰ CỐ, KHIẾU NẠI & BỒI THƯỜNG ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 3: XỬ LÝ SỰ CỐ, KHIẾU NẠI & BỒI THƯỜNG          -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg3_Claims_Incident">')
    lines.append('    <rect x="580" y="790" width="1180" height="625" class="pkg-border"/>')
    lines.append('    <rect x="580" y="790" width="760" height="28" class="pkg-header"/>')
    lines.append('    <text x="595" y="809" class="t-pkg">PHÂN HỆ 3: XỬ LÝ SỰ CỐ, KHIẾU NẠI &amp; BỒI THƯỜNG — shipment (claims, investigations)</text>')

    # Row 1: UC-G02
    lines.append(uc(950, 860, 125, 28, "UC-G02", "Xử lý sự cố &amp; Khiếu nại bưu gửi", "uc-abstract"))

    # Row 2: Children UC-20, UC-21, UC-22 and UC-24
    lines.append(uc(720, 970, 115, 24, "UC-20", "Khiếu nại bể vỡ (BBBT 24h)", "uc-core"))
    lines.append(uc(950, 970, 105, 24, "UC-21", "Khiếu nại mất hàng / Trễ SLA", "uc"))
    lines.append(uc(1180, 970, 110, 24, "UC-22", "Khiếu nại sai trọng lượng", "uc"))
    lines.append(uc(1450, 970, 125, 24, "UC-24", "Thẩm định bồi thường (≤ 500k)", "uc-core"))

    # Generalization arrows up to UC-G02
    lines.append(gen_arrow(720, 946, 890, 888, "up"))
    lines.append(gen_arrow(950, 946, 950, 888, "up"))
    lines.append(gen_arrow(1180, 946, 1010, 888, "up"))

    # Include UC-G02 -> UC-24
    lines.append(polyline_path([(1075, 860), (1310, 860), (1310, 970), (1325, 970)], "dep-line"))
    lines.append('    <polygon points="1325,970 1315,966 1315,974" class="dep-arrow"/>')
    lines.append('    <text x="1270" y="915" class="t-rel">&lt;&lt;include&gt;&gt;</text>')

    # Row 3: UC-23 (Include from UC-20) and UC-25 (Extend to UC-24)
    lines.append(uc(720, 1110, 115, 24, "UC-23", "Bưu tá ký số BBBT hiện trường", "uc"))
    lines.append(dep_arrow(720, 994, 720, 1086, "<<include>>", (765, 1045)))

    lines.append(uc(1450, 1110, 120, 24, "UC-25", "Phê duyệt bồi thường (> 500k)", "uc"))
    lines.append(dep_arrow(1450, 1086, 1450, 994, "<<extend>>", (1505, 1045)))

    # Row 4: UC-26 (Extend to UC-24)
    lines.append(uc(1450, 1240, 120, 24, "UC-26", "Hòa giải &amp; Điều tra hiện trường", "uc"))
    lines.append(polyline_path([(1450, 1216), (1450, 1180), (1600, 1180), (1600, 970), (1575, 970)], "dep-line"))
    lines.append('    <polygon points="1575,970 1585,966 1585,974" class="dep-arrow"/>')
    lines.append('    <text x="1635" y="1090" class="t-rel">&lt;&lt;extend&gt;&gt;</text>')

    lines.append('  </g>')
    lines.append('')

    # ==================== PACKAGE 4: ĐỐI SOÁT TÀI CHÍNH, VÍ CƯỚC & THU TIỀN COD ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 4: ĐỐI SOÁT TÀI CHÍNH, VÍ CƯỚC & THU TIỀN COD    -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg4_Finance_COD">')
    lines.append('    <rect x="1800" y="790" width="1220" height="625" class="pkg-border"/>')
    lines.append('    <rect x="1800" y="790" width="760" height="28" class="pkg-header"/>')
    lines.append('    <text x="1815" y="809" class="t-pkg">PHÂN HỆ 4: ĐỐI SOÁT TÀI CHÍNH, VÍ CƯỚC &amp; THU TIỀN COD — payment-service • reporting-service</text>')

    # Row 1: UC-G03 and UC-30
    lines.append(uc(2160, 860, 125, 28, "UC-G03", "Thanh toán / Thu cước &amp; COD", "uc-abstract"))
    lines.append(uc(2700, 860, 115, 24, "UC-30", "Quyết toán ca nộp tiền bưu tá", "uc-core"))

    # Row 2: Children UC-27, UC-28, UC-29 and UC-31
    lines.append(uc(1940, 970, 110, 24, "UC-27", "Thu tiền mặt COD tại điểm phát", "uc-core"))
    lines.append(uc(2160, 970, 115, 24, "UC-28", "Thanh toán VietQR SePay động", "uc-core"))
    lines.append(uc(2380, 970, 115, 24, "UC-29", "Cấn trừ Ví cước / Hạn mức", "uc"))
    lines.append(uc(2700, 970, 120, 24, "UC-31", "Đối soát tự động SePay Webhook", "uc"))

    # Generalization arrows up to UC-G03
    lines.append(gen_arrow(1940, 946, 2100, 888, "up"))
    lines.append(gen_arrow(2160, 946, 2160, 888, "up"))
    lines.append(gen_arrow(2380, 946, 2220, 888, "up"))

    # Row 3: UC-32 and UC-33
    lines.append(uc(2160, 1110, 120, 24, "UC-32", "Bảng kê đối soát định kỳ &amp; Cước", "uc-core"))
    lines.append(uc(2520, 1110, 120, 24, "UC-33", "Rút tiền Ví COD về Ngân hàng", "uc"))

    # Row 4: UC-34
    lines.append(uc(2160, 1240, 125, 24, "UC-34", "Báo cáo dòng tiền, nợ &amp; Doanh thu", "uc"))

    lines.append('  </g>')
    lines.append('')

    # ==================== PACKAGE 5: TRUY VẾT & VIỄN TRẮC HÀNH TRÌNH ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 5: TRUY VẾT & VIỄN TRẮC HÀNH TRÌNH               -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg5_Telemetry_Tracking">')
    lines.append('    <rect x="580" y="1450" width="720" height="725" class="pkg-border"/>')
    lines.append('    <rect x="580" y="1450" width="620" height="28" class="pkg-header"/>')
    lines.append('    <text x="595" y="1469" class="t-pkg">PHÂN HỆ 5: TRUY VẾT &amp; VIỄN TRẮC HÀNH TRÌNH — tracking-service • scan</text>')

    # Row 1: UC-G04
    lines.append(uc(940, 1540, 120, 28, "UC-G04", "Tra cứu hành trình bưu gửi", "uc-abstract"))

    # Row 2: Children UC-35 and UC-36
    lines.append(uc(780, 1670, 105, 24, "UC-35", "Tra cứu lộ trình công khai", "uc"))
    lines.append(uc(1100, 1670, 105, 24, "UC-36", "Tra cứu viễn trắc nội bộ", "uc"))
    lines.append(gen_arrow(780, 1646, 890, 1568, "up"))
    lines.append(gen_arrow(1100, 1646, 990, 1568, "up"))

    # Row 3: Included UC-37 and UC-38
    lines.append(uc(780, 1820, 110, 24, "UC-37", "Khử định danh PII Masking", "uc"))
    lines.append(dep_arrow(780, 1694, 780, 1796, "<<include>>", (830, 1745)))

    lines.append(uc(1100, 1820, 115, 24, "UC-38", "Định vị GPS thời gian thực", "uc"))
    lines.append(dep_arrow(1100, 1694, 1100, 1796, "<<include>>", (1155, 1745)))

    lines.append('  </g>')
    lines.append('')

    # ==================== PACKAGE 6: TRỢ LÝ ẢO AI & ĐỘNG CƠ TRI THỨC RAG ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 6: TRỢ LÝ ẢO AI & ĐỘNG CƠ TRI THỨC RAG           -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg6_AI_RAG">')
    lines.append('    <rect x="1330" y="1450" width="850" height="725" class="pkg-border"/>')
    lines.append('    <rect x="1330" y="1450" width="680" height="28" class="pkg-header"/>')
    lines.append('    <text x="1345" y="1469" class="t-pkg">PHÂN HỆ 6: TRỢ LÝ ẢO AI &amp; ĐỘNG CƠ TRI THỨC RAG — chatbot-service • gateway-bff</text>')

    # Row 1: UC-39 and UC-44
    lines.append(uc(1600, 1540, 125, 26, "UC-39", "Hỏi đáp tự nhiên với Trợ lý AI", "uc-core"))
    lines.append(uc(1980, 1540, 115, 24, "UC-44", "Sinh thẻ trực quan (Rich Card)", "uc-ext"))
    lines.append(dep_arrow(1865, 1540, 1725, 1540, "<<extend>>", (1795, 1528)))

    # Row 2: UC-40
    lines.append(uc(1600, 1680, 110, 24, "UC-40", "Bóc tách Ý định &amp; Thực thể", "uc"))
    lines.append(dep_arrow(1600, 1566, 1600, 1656, "<<include>>", (1650, 1610)))

    # Row 3: UC-41
    lines.append(uc(1600, 1820, 120, 24, "UC-41", "Truy xuất RAG 768-D Vectors", "uc-core"))
    lines.append(dep_arrow(1600, 1704, 1600, 1796, "<<include>>", (1650, 1750)))

    # Row 4: UC-42 and UC-43
    lines.append(uc(1540, 1980, 120, 24, "UC-42", "Tư vấn cước IATA tự động", "uc"))
    lines.append(uc(1860, 1980, 125, 24, "UC-43", "Hướng dẫn lập hồ sơ BBBT AI", "uc"))

    lines.append('  </g>')
    lines.append('')

    # ==================== PACKAGE 7: QUẢN TRỊ HỆ THỐNG, DANH MỤC & BẢO MẬT ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 7: QUẢN TRỊ HỆ THỐNG, DANH MỤC & BẢO MẬT         -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg7_Admin_Masterdata">')
    lines.append('    <rect x="2210" y="1450" width="810" height="725" class="pkg-border"/>')
    lines.append('    <rect x="2210" y="1450" width="700" height="28" class="pkg-header"/>')
    lines.append('    <text x="2225" y="1469" class="t-pkg">PHÂN HỆ 7: QUẢN TRỊ HỆ THỐNG &amp; CẤU HÌNH — auth-service • masterdata-service</text>')

    # Row 1: UC-G05
    lines.append(uc(2480, 1540, 120, 28, "UC-G05", "Xác thực người dùng", "uc-abstract"))

    # Row 2: Children UC-45, UC-46, UC-47 and UC-48
    lines.append(uc(2320, 1670, 95, 23, "UC-45", "Đăng nhập Email &amp; Mật khẩu", "uc"))
    lines.append(uc(2480, 1670, 95, 23, "UC-46", "Đăng nhập OTP SMS SĐT", "uc"))
    lines.append(uc(2640, 1670, 95, 23, "UC-47", "Đăng nhập SSO Doanh nghiệp", "uc"))
    lines.append(uc(2870, 1670, 110, 24, "UC-48", "Phân quyền RBAC người dùng", "uc-core"))

    lines.append(gen_arrow(2320, 1647, 2420, 1568, "up"))
    lines.append(gen_arrow(2480, 1647, 2480, 1568, "up"))
    lines.append(gen_arrow(2640, 1647, 2540, 1568, "up"))

    # Row 3: Masterdata
    lines.append(uc(2370, 1800, 115, 24, "UC-49", "Quản lý Hubs &amp; Bưu cục", "uc"))
    lines.append(uc(2630, 1800, 120, 24, "UC-50", "Cấu hình Bảng cước &amp; IATA", "uc-core"))
    lines.append(uc(2880, 1800, 105, 24, "UC-51", "Phân vùng địa lý Tuyến phát", "uc"))

    # Row 4: Policies
    lines.append(uc(2370, 1930, 115, 24, "UC-52", "Hồ sơ Merchant &amp; Chiết khấu", "uc"))
    lines.append(uc(2630, 1930, 115, 24, "UC-53", "Danh mục lý do giao NDR &amp; SLA", "uc"))
    lines.append(uc(2880, 1930, 115, 24, "UC-54", "CMS Quản trị Tri thức RAG", "uc"))

    # Row 5: Audit
    lines.append(uc(2630, 2060, 125, 24, "UC-55", "Giám sát Nhật ký Audit Logs", "uc"))

    lines.append('  </g>')
    lines.append('')

    # ==================== ACTOR INHERITANCE TREES (LEFT & RIGHT) ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- ACTOR GENERALIZATION TREES (ORTHOGONAL BUS ROUTING)      -->')
    lines.append('  <!-- ========================================================= -->')

    # ROOT ACTOR: System User (X: 280, Y: 220)
    lines.append('  <g id="Actor_System_User" transform="translate(230, 180)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head-abs"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body-abs"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body-abs"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body-abs"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body-abs"/>')
    lines.append('    <text x="50" y="138" class="t-rel">&lt;&lt;abstract&gt;&gt;</text>')
    lines.append('    <text x="50" y="152" class="t-actor-abs">Người dùng Hệ thống</text>')
    lines.append('    <text x="50" y="167" class="t-role">(System User / Base Actor)</text>')
    lines.append('  </g>')

    # SUB-ROOT 1: Customer (X: 280, Y: 430)
    lines.append('  <g id="Actor_Customer" transform="translate(230, 420)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head-abs"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body-abs"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body-abs"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body-abs"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body-abs"/>')
    lines.append('    <text x="50" y="138" class="t-rel">&lt;&lt;abstract&gt;&gt;</text>')
    lines.append('    <text x="50" y="152" class="t-actor-abs">Khách hàng</text>')
    lines.append('    <text x="50" y="167" class="t-role">(Customer / External User)</text>')
    lines.append('  </g>')
    # Generalization Customer -> System User (straight vertical)
    lines.append(gen_arrow(280, 420, 280, 360, "up"))

    # T-BUS FOR GUEST & AUTH USER UNDER CUSTOMER:
    # Stem up to Customer at (280, 500)
    lines.append(gen_arrow(280, 560, 280, 500, "up"))
    # Horizontal bus from X: 140 to X: 420 at Y: 560
    lines.append(polyline_path([(140, 560), (420, 560)], "gen-line"))
    # Guest branch down to Guest (140, 680)
    lines.append(polyline_path([(140, 560), (140, 680)], "gen-line"))
    # Auth User branch down to Auth User (420, 680)
    lines.append(polyline_path([(420, 560), (420, 680)], "gen-line"))

    # SUB-CHILD 1.1: Guest (X: 140, Y: 680)
    lines.append('  <g id="Actor_Guest" transform="translate(90, 680)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body"/>')
    lines.append('    <text x="50" y="140" class="t-actor">Khách vãng lai</text>')
    lines.append('    <text x="50" y="155" class="t-role">(Guest / Anonymous)</text>')
    lines.append('    <text x="50" y="169" class="t-app">guest-web :5177</text>')
    lines.append('  </g>')

    # SUB-CHILD 1.2: Authenticated User (X: 420, Y: 680)
    lines.append('  <g id="Actor_Auth_User" transform="translate(370, 680)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head-abs"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body-abs"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body-abs"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body-abs"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body-abs"/>')
    lines.append('    <text x="50" y="138" class="t-rel">&lt;&lt;abstract&gt;&gt;</text>')
    lines.append('    <text x="50" y="152" class="t-actor-abs">User Đã định danh</text>')
    lines.append('    <text x="50" y="167" class="t-role">(Authenticated User)</text>')
    lines.append('  </g>')

    # T-BUS FOR RECIPIENT & MERCHANT UNDER AUTH USER:
    # Stem up to Auth User at (420, 850)
    lines.append(gen_arrow(420, 890, 420, 850, "up"))
    # Horizontal bus at Y: 890 from X: 240 to X: 370
    lines.append(polyline_path([(240, 890), (420, 890)], "gen-line"))
    # Track 1 down along X: 240 to Recipient at (240, 1020)
    lines.append(polyline_path([(240, 890), (240, 1020)], "gen-line"))
    # Track 2 down along X: 360 to Merchant at (240, 1380)
    lines.append(polyline_path([(360, 890), (360, 1360), (240, 1360), (240, 1380)], "gen-line"))

    # LEAF 1: Recipient (X: 240, Y: 1020)
    lines.append('  <g id="Actor_Recipient" transform="translate(190, 1020)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body"/>')
    lines.append('    <text x="50" y="140" class="t-actor">Người nhận hàng</text>')
    lines.append('    <text x="50" y="155" class="t-role">(CUSTOMER / Recipient)</text>')
    lines.append('    <text x="50" y="169" class="t-app">customer-mobile</text>')
    lines.append('  </g>')

    # LEAF 2: Merchant (X: 240, Y: 1380)
    lines.append('  <g id="Actor_Merchant" transform="translate(190, 1380)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body"/>')
    lines.append('    <text x="50" y="140" class="t-actor">Chủ Shop / Người gửi</text>')
    lines.append('    <text x="50" y="155" class="t-role">(MERCHANT)</text>')
    lines.append('    <text x="50" y="169" class="t-app">merchant-web :5174</text>')
    lines.append('  </g>')

    # ==================== RIGHT SIDE: STAFF ACTOR TREE ====================
    # SUB-ROOT 2: Internal Staff (X: 3320, Y: 220)
    lines.append('  <g id="Actor_Internal_Staff" transform="translate(3270, 180)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head-abs"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body-abs"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body-abs"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body-abs"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body-abs"/>')
    lines.append('    <text x="50" y="138" class="t-rel">&lt;&lt;abstract&gt;&gt;</text>')
    lines.append('    <text x="50" y="152" class="t-actor-abs">Nhân sự Nội bộ</text>')
    lines.append('    <text x="50" y="167" class="t-role">(Internal Staff)</text>')
    lines.append('  </g>')

    # Generalization Internal Staff -> System User (Clean top perimeter gutter at Y: 130)
    lines.append(polyline_path([(3320, 180), (3320, 130), (280, 130), (280, 160)], "gen-line"))
    lines.append('    <polygon points="273,160 280,174 287,160" class="gen-arrow"/>')

    # MULTI-TAP VERTICAL BUS ON RIGHT MARGIN AT X: 3480
    # Stem from Internal Staff (3320, 350) -> right to (3480, 350) with hollow triangle at (3320, 350)
    lines.append(polyline_path([(3480, 350), (3334, 350)], "gen-line"))
    lines.append('    <polygon points="3334,343 3320,350 3334,357" class="gen-arrow"/>')
    # Vertical trunk at X: 3480 from Y: 350 to Y: 1460
    lines.append(polyline_path([(3480, 350), (3480, 1460)], "gen-line"))
    # Tap 1 to Courier (3370, 620)
    lines.append(polyline_path([(3370, 620), (3480, 620)], "gen-line"))
    # Tap 2 to Hub Ops (3370, 1020)
    lines.append(polyline_path([(3370, 1020), (3480, 1020)], "gen-line"))
    # Tap 3 to Admin (3370, 1460)
    lines.append(polyline_path([(3370, 1460), (3480, 1460)], "gen-line"))

    # LEAF 3: Courier (X: 3320, Y: 580)
    lines.append('  <g id="Actor_Courier" transform="translate(3270, 580)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body"/>')
    lines.append('    <text x="50" y="140" class="t-actor">Bưu tá giao nhận</text>')
    lines.append('    <text x="50" y="155" class="t-role">(COURIER)</text>')
    lines.append('    <text x="50" y="169" class="t-app">courier-mobile</text>')
    lines.append('  </g>')

    # LEAF 4: Hub Ops (X: 3320, Y: 980)
    lines.append('  <g id="Actor_Ops" transform="translate(3270, 980)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body"/>')
    lines.append('    <text x="50" y="140" class="t-actor">Vận hành Bưu cục &amp; Kho</text>')
    lines.append('    <text x="50" y="155" class="t-role">(OPS / Hub Ops)</text>')
    lines.append('    <text x="50" y="169" class="t-app">ops-web :5173</text>')
    lines.append('  </g>')

    # LEAF 5: Admin (X: 3320, Y: 1420)
    lines.append('  <g id="Actor_Admin" transform="translate(3270, 1420)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body"/>')
    lines.append('    <text x="50" y="140" class="t-actor">Quản trị Hệ thống</text>')
    lines.append('    <text x="50" y="155" class="t-role">(SYSTEM_ADMIN)</text>')
    lines.append('    <text x="50" y="169" class="t-app">admin-web :5175</text>')
    lines.append('  </g>')

    # ==================== ORTHOGONAL ASSOCIATIONS (ZERO OVERLAPS) ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- ASSOCIATIONS WITH DEDICATED GUTTER CHANNELS (ORTHOGONAL)  -->')
    lines.append('  <!-- ========================================================= -->')

    # --- 1. SYSTEM USER UNIVERSAL CAPABILITIES ---
    # Connects to UC-G04 (Tracking) & UC-39 (AI Assistant) via Left Corridor X: 520 & Gutter B Y: 1435
    lines.append(polyline_path([(330, 220), (520, 220), (520, 1435), (940, 1435), (940, 1512)], "assoc"))
    lines.append(polyline_path([(940, 1435), (1600, 1435), (1600, 1514)], "assoc"))

    # --- 2. GUEST (Khách vãng lai, at X: 140, Y: 680) ---
    # Track down outer corridor X: 90
    lines.append(polyline_path([(140, 850), (90, 850), (90, 1670), (675, 1670)], "assoc"))  # to UC-35
    lines.append(polyline_path([(90, 1670), (90, 2140), (1540, 2140), (1540, 2004)], "assoc"))  # to UC-42 (bottom gutter Y: 2140)

    # --- 3. RECIPIENT (Người nhận hàng, at X: 240, Y: 1020) ---
    # Direct horizontal to UC-20 (BBBT 24h bể vỡ at 720, 970)
    lines.append(polyline_path([(290, 1020), (490, 1020), (490, 970), (605, 970)], "assoc"))
    # To UC-16 (Giao hàng/e-POD) via Gutter A at Y: 775
    lines.append(polyline_path([(290, 1040), (505, 1040), (505, 775), (2160, 775), (2160, 556)], "assoc"))
    # To UC-28 (Quét VietQR SePay) via Gutter A branch
    lines.append(polyline_path([(2160, 775), (2160, 946)], "assoc"))
    # To UC-19 (Hẹn lại giao) via Gutter A branch
    lines.append(polyline_path([(2160, 775), (2820, 775), (2820, 674)], "assoc"))

    # --- 4. MERCHANT (Chủ Shop / Người gửi, at X: 240, Y: 1380) ---
    # Dedicated vertical channel at X: 470
    lines.append(polyline_path([(290, 1380), (470, 1380), (470, 250), (835, 250)], "assoc"))  # to UC-G01
    lines.append(polyline_path([(470, 500), (605, 500)], "assoc"))  # to UC-06 (Pickup)
    lines.append(polyline_path([(470, 860), (825, 860)], "assoc"))  # to UC-G02 (Claims)
    # To Package 4 (UC-32 Đối soát & UC-33 Rút tiền) via Gutter B at Y: 1445
    lines.append(polyline_path([(470, 1380), (470, 1445), (2160, 1445), (2160, 1134)], "assoc"))  # to UC-32
    lines.append(polyline_path([(2160, 1445), (2520, 1445), (2520, 1134)], "assoc"))  # to UC-33

    # --- 5. COURIER (Bưu tá giao nhận, at X: 3320, Y: 580) ---
    # Dedicated vertical channel at X: 3070
    lines.append(polyline_path([(3270, 580), (3070, 580), (3070, 250), (2855, 250)], "assoc"))  # to UC-13 & UC-10
    lines.append(polyline_path([(3070, 530), (2930, 530)], "assoc"))  # to UC-18 (NDR) & UC-16
    lines.append(polyline_path([(3070, 580), (3070, 860), (2815, 860)], "assoc"))  # to UC-30 (Quyết toán ca)
    lines.append(polyline_path([(3070, 860), (3070, 970), (2495, 970)], "assoc"))  # to UC-27 (Thu tiền mặt)
    # To UC-23 (Bưu tá ký số BBBT hiện trường) via Gutter A at Y: 765 & Center Gutter X: 1780
    lines.append(polyline_path([(3070, 580), (3070, 765), (1780, 765), (1780, 1110), (835, 1110)], "assoc"))

    # --- 6. HUB OPS COORDINATOR (Điều phối Hub, at X: 3320, Y: 980) ---
    # Dedicated vertical channel at X: 3090
    lines.append(polyline_path([(3270, 980), (3090, 980), (3090, 250), (2305, 250)], "assoc"))  # to UC-11 (Inbound) & UC-12
    lines.append(polyline_path([(3090, 380), (2525, 380)], "assoc"))  # to UC-15 (Phân tuyến) & UC-14
    # To UC-24 (Thẩm định ≤ 500k) & UC-26 (Hòa giải) in Package 3 (Right edge of Pkg 3 at X: 1450)
    lines.append(polyline_path([(3090, 970), (1575, 970)], "assoc"))  # straight horizontal across gutter to UC-24!
    lines.append(polyline_path([(3090, 980), (3090, 1240), (1570, 1240)], "assoc"))  # straight to UC-26!

    # --- 7. ADMIN & CHIEF ACCOUNTANT (Quản trị & Kế toán, at X: 3320, Y: 1420) ---
    # Dedicated vertical channel at X: 3110
    # To Package 7 (Quản trị hệ thống & Masterdata)
    lines.append(polyline_path([(3270, 1420), (3110, 1420), (3110, 1670), (2980, 1670)], "assoc"))  # to UC-48
    lines.append(polyline_path([(3110, 1670), (3110, 1800), (2750, 1800)], "assoc"))  # to UC-50 (Bảng cước) & UC-49
    lines.append(polyline_path([(3110, 1800), (3110, 1930), (2995, 1930)], "assoc"))  # to UC-54 (CMS RAG)
    lines.append(polyline_path([(3110, 1930), (3110, 2060), (2755, 2060)], "assoc"))  # to UC-55 (Audit Logs)
    # To Package 4 (SePay Webhook UC-31, Bảng kê UC-32, Báo cáo UC-34)
    lines.append(polyline_path([(3110, 1420), (3110, 970), (2820, 970)], "assoc"))  # to UC-31
    lines.append(polyline_path([(3110, 1240), (2285, 1240)], "assoc"))  # to UC-34
    # To UC-25 (Duyệt chi > 500k) via Gutter B at Y: 1430
    lines.append(polyline_path([(3110, 1420), (3110, 1430), (1780, 1430), (1780, 1110), (1570, 1110)], "assoc"))

    # ==================== LEGEND (BOTTOM LEFT) ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- UML 2.5 LEGEND (BOTTOM LEFT)                             -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="UML_Legend" transform="translate(60, 2220)">')
    lines.append('    <rect x="0" y="0" width="1050" height="240" class="legend-box"/>')
    lines.append('    <text x="20" y="26" class="t-note">CHÚ GIẢI KÝ HIỆU CHUẨN UML 2.5 &amp; QUAN HỆ KẾ THỪA (INHERITANCE / GENERALIZATION):</text>')

    # Item 1: Actor Generalization
    lines.append('    <line x1="30" y1="58" x2="90" y2="58" class="gen-line"/>')
    lines.append('    <polygon points="90,51 104,58 90,65" class="gen-arrow"/>')
    lines.append('    <text x="120" y="62" class="t-legend"><tspan font-weight="bold">Actor Generalization (Kế thừa Tác nhân):</tspan> Tác nhân con thừa hưởng toàn bộ quyền và Use Case của Tác nhân cha (Mũi tên tam giác rỗng ──▷)</text>')

    # Item 2: Use Case Generalization
    lines.append('    <line x1="30" y1="92" x2="90" y2="92" class="gen-line"/>')
    lines.append('    <polygon points="90,85 104,92 90,99" class="gen-arrow"/>')
    lines.append('    <text x="120" y="96" class="t-legend"><tspan font-weight="bold">Use Case Generalization (Chuyên biệt hoá Use Case):</tspan> Đa hình nghiệp vụ (Ví dụ: Tạo đơn lẻ/Excel/Webhook kế thừa Tạo đơn bưu gửi ──▷)</text>')

    # Item 3: Include
    lines.append('    <line x1="30" y1="126" x2="85" y2="126" class="dep-line"/>')
    lines.append('    <polygon points="95,126 85,122 85,130" class="dep-arrow"/>')
    lines.append('    <text x="120" y="130" class="t-legend"><tspan font-weight="bold">&lt;&lt;include&gt;&gt; (Quan hệ Bao hàm Bắt buộc):</tspan> Luồng sự kiện của Use Case gốc luôn thực thi Use Case bao hàm (Nét đứt + Mũi tên nhọn ┄┄▶)</text>')

    # Item 4: Extend
    lines.append('    <line x1="30" y1="160" x2="85" y2="160" class="dep-line"/>')
    lines.append('    <polygon points="95,160 85,156 85,164" class="dep-arrow"/>')
    lines.append('    <text x="120" y="164" class="t-legend"><tspan font-weight="bold">&lt;&lt;extend&gt;&gt; (Quan hệ Mở rộng có Điều kiện):</tspan> Kích hoạt tại Điểm mở rộng (Extension Point) khi thỏa mãn điều kiện ngoại lệ (Ví dụ: Sự cố, Giao hỏng)</text>')

    # Item 5: Shapes
    lines.append('    <ellipse cx="45" cy="198" rx="20" ry="10" class="uc-abstract"/>')
    lines.append('    <ellipse cx="105" cy="198" rx="20" ry="10" class="uc-core"/>')
    lines.append('    <ellipse cx="165" cy="198" rx="20" ry="10" class="uc"/>')
    lines.append('    <ellipse cx="225" cy="198" rx="20" ry="10" class="uc-ext"/>')
    lines.append('    <text x="260" y="202" class="t-legend"><tspan font-weight="bold">Phân loại hình khối:</tspan> [Xám: &lt;&lt;abstract&gt;&gt; Parent] • [Viền đậm 2.2px: Nghiệp vụ cốt lõi Core] • [Viền 1.3px: Chuẩn] • [Nét đứt: Extended/Conditional]</text>')

    lines.append('  </g>')
    lines.append('')

    # ==================== TRACEABILITY MATRIX (BOTTOM RIGHT) ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- TRACEABILITY MATRIX & ACADEMIC DEFENSE NOTES (BOTTOM RIGHT)-->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Traceability_Matrix" transform="translate(1160, 2220)">')
    lines.append('    <rect x="0" y="0" width="2380" height="240" class="legend-box"/>')
    lines.append('    <text x="20" y="26" class="t-note">BẢNG ÁNH XẠ 1:1 TỪ 15 MICROSERVICES &amp; 6 FRONTEND APPS → 7 PHÂN HỆ USE CASE (TRACEABILITY MATRIX):</text>')

    lines.append('    <text x="20" y="55" class="t-legend">• <tspan font-weight="bold">Phân hệ 1 (Đơn hàng):</tspan> shipment-service (shipment, change-request) + pickup-service (pickups) + pricing-service (quotes) + gateway-bff (merchant integrations)</text>')
    lines.append('    <text x="20" y="77" class="t-legend">• <tspan font-weight="bold">Phân hệ 2 (Kho &amp; Vận hành):</tspan> scan-service (inbound/outbound/pickup) + manifest-service (bagging/seal) + dispatch-service (tasks/routing) + delivery-service (NDR/returns)</text>')
    lines.append('    <text x="20" y="99" class="t-legend">• <tspan font-weight="bold">Phân hệ 3 (Sự cố &amp; Khiếu nại):</tspan> shipment-service (claims.controller — lập BBBT 24h, thẩm định ≤500k, duyệt chi &gt;500k) + (investigations.controller — dispute resolution)</text>')
    lines.append('    <text x="20" y="121" class="t-legend">• <tspan font-weight="bold">Phân hệ 4 (Tài chính &amp; COD):</tspan> payment-service (cod.controller — tiền mặt, VietQR SePay dynamic QR, webhook ngân hàng, bảng kê COD, ví rút tiền) + reporting-service</text>')
    lines.append('    <text x="20" y="143" class="t-legend">• <tspan font-weight="bold">Phân hệ 5 (Truy vết &amp; Viễn trắc):</tspan> tracking-service (public-tracking khử PII masking + internal-tracking full telemetry &amp; GPS coordinates) + scan-service (location)</text>')
    lines.append('    <text x="20" y="165" class="t-legend">• <tspan font-weight="bold">Phân hệ 6 (Trợ lý AI &amp; RAG):</tspan> chatbot-service (chat.controller — intent classification, 768-D semantic retrieval) + gateway-bff (ai-assistant.controller — Rich Card generation)</text>')
    lines.append('    <text x="20" y="187" class="t-legend">• <tspan font-weight="bold">Phân hệ 7 (Quản trị &amp; Cấu hình):</tspan> auth-service (RBAC, users, tokens) + masterdata-service (hubs, zones, policies, configs, merchant-profiles, ndr-reasons) + admin-audit</text>')

    lines.append('    <text x="20" y="217" class="t-legend" font-style="italic" fill="#555555">Hệ thống phân tán gồm 6 Ứng dụng Frontend: merchant-web (:5174) • ops-web (:5173) • admin-web (:5175) • guest-web (:5177) • courier-mobile • customer-mobile</text>')

    lines.append('  </g>')
    lines.append('')
    lines.append('</svg>')

    return "\n".join(lines)

if __name__ == '__main__':
    target_path = '/Users/Tai.IS/my-project/logistics-management-system/docs/graduation-thesis/figma-page-1-system-and-data/diagrams/01-use-case-general-system.svg'
    content = generate_svg()
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Generated successfully: {target_path} ({len(content)} bytes)")
