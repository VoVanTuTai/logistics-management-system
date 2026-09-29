#!/usr/bin/env python3
"""
Generate Definitive Enterprise UML Use Case Diagram for Nexus Logistics Platform
Compliant with UML 2.5, IEEE 830, ISO/IEC 25010
Includes:
- 3-tier Actor Inheritance (Generalization)
- 5 Use Case Generalizations (UC-G01 to UC-G05)
- 55 Total Use Cases across 7 Packages
- 15 Backend Microservices + 6 Frontend Applications mapped 1:1
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
    lines.append('    <text x="65" y="105" class="t-sub">Mô hình phân rã 7 Phân hệ nghiệp vụ (Packages) • 6 Tác nhân trong Cây kế thừa (Actor Generalization Hierarchy) • 55 Trường hợp sử dụng (5 Use Case Generalizations) • Ánh xạ 1:1 từ 15 Microservices &amp; 6 Frontend Apps</text>')
    lines.append(f'    <rect x="{width-420}" y="52" width="380" height="62" fill="#F8F9FA" stroke="#000000" stroke-width="1.1"/>')
    lines.append(f'    <text x="{width-405}" y="74" font-family="Arial" font-size="12.5" font-weight="bold" fill="#000000">MÃ BẢN VẼ: UC-SYS-ENT-01 (REV.4)</text>')
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
        # uctype: "uc", "uc-core", "uc-abstract", "uc-ext"
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

    def gen_arrow_up(x1, y1, x2, y2):
        # Line from (x1, y1) to (x2, y2+14), hollow triangle at (x2, y2)
        res = []
        res.append(f'    <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2+14}" class="gen-line"/>')
        res.append(f'    <polygon points="{x2-7},{y2+14} {x2},{y2} {x2+7},{y2+14}" class="gen-arrow"/>')
        return "\n".join(res)

    def gen_arrow_left(x1, y1, x2, y2):
        # Line from (x1, y1) to (x2+14, y2), hollow triangle at (x2, y2)
        res = []
        res.append(f'    <line x1="{x1}" y1="{y1}" x2="{x2+14}" y2="{y2}" class="gen-line"/>')
        res.append(f'    <polygon points="{x2+14},{y2-7} {x2},{y2} {x2+14},{y2+7}" class="gen-arrow"/>')
        return "\n".join(res)

    def gen_arrow_right(x1, y1, x2, y2):
        # Line from (x1, y1) to (x2-14, y2), hollow triangle at (x2, y2)
        res = []
        res.append(f'    <line x1="{x1}" y1="{y1}" x2="{x2-14}" y2="{y2}" class="gen-line"/>')
        res.append(f'    <polygon points="{x2-14},{y2-7} {x2},{y2} {x2-14},{y2+7}" class="gen-arrow"/>')
        return "\n".join(res)

    def dep_arrow(x1, y1, x2, y2, label="<<include>>", label_pos=None):
        # Line from (x1, y1) to near (x2, y2) with solid arrowhead
        dx = x2 - x1
        dy = y2 - y1
        dist = (dx*dx + dy*dy)**0.5
        if dist == 0:
            return ""
        ux = dx / dist
        uy = dy / dist
        # end line 8px before target
        ex = x2 - ux * 4
        ey = y2 - uy * 4
        # arrowhead points
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

    # ==================== PACKAGE 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG                  -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg1_Shipment_Management">')
    lines.append('    <rect x="580" y="170" width="1180" height="580" class="pkg-border"/>')
    lines.append('    <rect x="580" y="170" width="760" height="28" class="pkg-header"/>')
    lines.append('    <text x="595" y="189" class="t-pkg">PHÂN HỆ 1: TIẾP NHẬN &amp; QUẢN LÝ ĐƠN HÀNG — shipment-service • pickup-service • pricing-service</text>')

    # UC-G01 (Abstract Parent)
    lines.append(uc(820, 245, 115, 28, "UC-G01", "Tạo đơn vận chuyển", "uc-abstract"))

    # Children of UC-G01
    lines.append(uc(640, 360, 95, 24, "UC-01", "Tạo đơn lẻ thủ công", "uc"))
    lines.append(uc(830, 360, 100, 24, "UC-02", "Tạo đơn tệp Excel bulk", "uc"))
    lines.append(uc(1040, 360, 110, 24, "UC-03", "Đồng bộ Webhook TMĐT", "uc"))

    # Generalization arrows up to UC-G01
    lines.append(gen_arrow_up(640, 336, 760, 273))
    lines.append(gen_arrow_up(830, 336, 820, 273))
    lines.append(gen_arrow_up(1040, 336, 880, 273))

    # Included UCs from UC-G01
    lines.append(uc(660, 470, 110, 24, "UC-04", "Tính cước quy đổi IATA", "uc-core"))
    lines.append(uc(940, 470, 110, 24, "UC-05", "In nhãn Barcode / Phiếu gửi", "uc"))
    lines.append(dep_arrow(770, 273, 680, 446, "<<include>>", (700, 360)))
    lines.append(dep_arrow(870, 273, 940, 446, "<<include>>", (930, 340)))

    # Extended from UC-05: UC-09 Bulk Batch Print
    lines.append(uc(1180, 470, 95, 22, "UC-09", "In nhãn hàng loạt (Bulk)", "uc-ext"))
    lines.append(dep_arrow(1085, 470, 1050, 470, "<<extend>>", (1110, 458)))

    # Other Shipment UCs
    lines.append(uc(670, 570, 115, 24, "UC-06", "Yêu cầu bưu tá lấy hàng", "uc-core"))
    lines.append(uc(940, 570, 115, 24, "UC-07", "Hủy đơn / Đổi SĐT, địa chỉ", "uc"))
    lines.append(uc(1200, 570, 115, 24, "UC-08", "Quản lý & Lọc đơn đa kênh", "uc"))

    lines.append('  </g>')
    lines.append('')

    # ==================== PACKAGE 2: KHO TRUNG CHUYỂN, PHÂN TUYẾN & GIAO HÀNG ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 2: KHO TRUNG CHUYỂN, PHÂN TUYẾN & GIAO HÀNG      -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg2_Hub_Dispatch_Delivery">')
    lines.append('    <rect x="1780" y="170" width="1240" height="580" class="pkg-border"/>')
    lines.append('    <rect x="1780" y="170" width="840" height="28" class="pkg-header"/>')
    lines.append('    <text x="1795" y="189" class="t-pkg">PHÂN HỆ 2: KHO TRUNG CHUYỂN, PHÂN TUYẾN &amp; GIAO HÀNG — scan • manifest • dispatch • delivery</text>')

    # Hub Scanning UCs
    lines.append(uc(1910, 245, 105, 24, "UC-10", "Quét mã tiếp nhận gom hàng", "uc"))
    lines.append(uc(2150, 245, 105, 24, "UC-11", "Quét mã nhập kho (Inbound)", "uc"))
    lines.append(uc(2390, 245, 105, 24, "UC-12", "Quét mã xuất kho (Outbound)", "uc"))
    lines.append(uc(2640, 245, 115, 24, "UC-13", "Đóng bao tải &amp; Niêm seal chì", "uc"))

    # Manifest & Dispatch
    lines.append(uc(2010, 360, 115, 24, "UC-14", "Tiếp nhận bao tải đầu tuyến", "uc"))
    lines.append(uc(2320, 360, 125, 24, "UC-15", "Phân tuyến &amp; Giao task bưu tá", "uc-core"))

    # Last-Mile Delivery
    lines.append(uc(2120, 480, 115, 26, "UC-16", "Thực hiện giao chặng cuối", "uc-core"))
    lines.append(uc(2420, 480, 110, 24, "UC-17", "Ký nhận điện tử e-POD", "uc"))
    lines.append(uc(2710, 480, 110, 24, "UC-18", "Báo phát không thành công", "uc"))
    lines.append(uc(2560, 580, 115, 24, "UC-19", "Hẹn lại ngày / Chuyển hoàn", "uc"))

    # Include e-POD from UC-16
    lines.append(dep_arrow(2235, 480, 2310, 480, "<<include>>", (2270, 468)))
    # Extend NDR to UC-16
    lines.append(dep_arrow(2600, 480, 2235, 480, "<<extend>>", (2420, 435)))
    # Extend Reschedule/Return to UC-18
    lines.append(dep_arrow(2640, 556, 2700, 504, "<<extend>>", (2710, 540)))

    lines.append('  </g>')
    lines.append('')

    # ==================== PACKAGE 3: XỬ LÝ SỰ CỐ, KHIẾU NẠI & BỒI THƯỜNG ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 3: XỬ LÝ SỰ CỐ, KHIẾU NẠI & BỒI THƯỜNG          -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg3_Claims_Incident">')
    lines.append('    <rect x="580" y="770" width="1180" height="640" class="pkg-border"/>')
    lines.append('    <rect x="580" y="770" width="760" height="28" class="pkg-header"/>')
    lines.append('    <text x="595" y="789" class="t-pkg">PHÂN HỆ 3: XỬ LÝ SỰ CỐ, KHIẾU NẠI &amp; BỒI THƯỜNG — shipment (claims, investigations)</text>')

    # UC-G02 (Abstract Parent)
    lines.append(uc(820, 850, 125, 28, "UC-G02", "Xử lý sự cố &amp; Khiếu nại bưu gửi", "uc-abstract"))

    # Children of UC-G02
    lines.append(uc(650, 970, 115, 24, "UC-20", "Khiếu nại bể vỡ (BBBT 24h)", "uc-core"))
    lines.append(uc(870, 970, 105, 24, "UC-21", "Khiếu nại mất hàng / Trễ SLA", "uc"))
    lines.append(uc(1090, 970, 110, 24, "UC-22", "Khiếu nại sai trọng lượng", "uc"))

    # Generalization arrows up to UC-G02
    lines.append(gen_arrow_up(650, 946, 760, 878))
    lines.append(gen_arrow_up(870, 946, 820, 878))
    lines.append(gen_arrow_up(1090, 946, 880, 878))

    # Dependencies
    lines.append(uc(650, 1100, 115, 24, "UC-23", "Bưu tá ký số BBBT hiện trường", "uc"))
    lines.append(dep_arrow(650, 994, 650, 1076, "<<include>>", (695, 1035)))

    lines.append(uc(940, 1100, 125, 24, "UC-24", "Thẩm định bồi thường (≤ 500k)", "uc-core"))
    lines.append(dep_arrow(860, 878, 940, 1076, "<<include>>", (945, 980)))

    lines.append(uc(750, 1230, 120, 24, "UC-25", "Phê duyệt bồi thường (> 500k)", "uc"))
    lines.append(dep_arrow(750, 1206, 900, 1124, "<<extend>>", (785, 1160)))

    lines.append(uc(1040, 1230, 120, 24, "UC-26", "Hòa giải &amp; Điều tra hiện trường", "uc"))
    lines.append(dep_arrow(1040, 1206, 970, 1124, "<<extend>>", (1045, 1160)))

    lines.append('  </g>')
    lines.append('')

    # ==================== PACKAGE 4: ĐỐI SOÁT TÀI CHÍNH, VÍ CƯỚC & THU TIỀN COD ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 4: ĐỐI SOÁT TÀI CHÍNH, VÍ CƯỚC & THU TIỀN COD    -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg4_Finance_COD">')
    lines.append('    <rect x="1780" y="770" width="1240" height="640" class="pkg-border"/>')
    lines.append('    <rect x="1780" y="770" width="760" height="28" class="pkg-header"/>')
    lines.append('    <text x="1795" y="789" class="t-pkg">PHÂN HỆ 4: ĐỐI SOÁT TÀI CHÍNH, VÍ CƯỚC &amp; THU TIỀN COD — payment-service • reporting-service</text>')

    # UC-G03 (Abstract Parent)
    lines.append(uc(2120, 850, 125, 28, "UC-G03", "Thanh toán / Thu cước &amp; COD", "uc-abstract"))

    # Children of UC-G03
    lines.append(uc(1910, 970, 110, 24, "UC-27", "Thu tiền mặt COD tại điểm phát", "uc-core"))
    lines.append(uc(2140, 970, 115, 24, "UC-28", "Thanh toán VietQR SePay động", "uc-core"))
    lines.append(uc(2390, 970, 115, 24, "UC-29", "Cấn trừ Ví cước / Hạn mức", "uc"))

    # Generalization arrows up to UC-G03
    lines.append(gen_arrow_up(1910, 946, 2060, 878))
    lines.append(gen_arrow_up(2140, 946, 2120, 878))
    lines.append(gen_arrow_up(2390, 946, 2180, 878))

    # Cash remittance & SePay webhook
    lines.append(uc(2670, 970, 115, 24, "UC-30", "Quyết toán ca nộp tiền bưu tá", "uc-core"))
    lines.append(uc(1940, 1100, 120, 24, "UC-31", "Đối soát tự động SePay Webhook", "uc"))
    lines.append(uc(2220, 1100, 120, 24, "UC-32", "Bảng kê đối soát định kỳ &amp; Cước", "uc-core"))
    lines.append(uc(2530, 1100, 120, 24, "UC-33", "Rút tiền Ví COD về Ngân hàng", "uc"))
    lines.append(uc(2220, 1230, 125, 24, "UC-34", "Báo cáo dòng tiền, nợ &amp; Doanh thu", "uc"))

    lines.append('  </g>')
    lines.append('')

    # ==================== PACKAGE 5: TRUY VẾT & VIỄN TRẮC HÀNH TRÌNH ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 5: TRUY VẾT & VIỄN TRẮC HÀNH TRÌNH               -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg5_Telemetry_Tracking">')
    lines.append('    <rect x="580" y="1430" width="720" height="740" class="pkg-border"/>')
    lines.append('    <rect x="580" y="1430" width="620" height="28" class="pkg-header"/>')
    lines.append('    <text x="595" y="1449" class="t-pkg">PHÂN HỆ 5: TRUY VẾT &amp; VIỄN TRẮC HÀNH TRÌNH — tracking-service • scan</text>')

    # UC-G04 (Abstract Parent)
    lines.append(uc(750, 1515, 120, 28, "UC-G04", "Tra cứu hành trình bưu gửi", "uc-abstract"))

    # Children of UC-G04
    lines.append(uc(670, 1630, 105, 24, "UC-35", "Tra cứu lộ trình công khai", "uc"))
    lines.append(uc(880, 1630, 105, 24, "UC-36", "Tra cứu viễn trắc nội bộ", "uc"))
    lines.append(gen_arrow_up(670, 1606, 710, 1543))
    lines.append(gen_arrow_up(880, 1606, 790, 1543))

    # PII Masking and GPS
    lines.append(uc(670, 1750, 110, 24, "UC-37", "Khử định danh PII Masking", "uc"))
    lines.append(dep_arrow(670, 1654, 670, 1726, "<<include>>", (715, 1690)))

    lines.append(uc(880, 1750, 115, 24, "UC-38", "Định vị GPS thời gian thực", "uc"))
    lines.append(dep_arrow(880, 1654, 880, 1726, "<<include>>", (930, 1690)))

    lines.append('  </g>')
    lines.append('')

    # ==================== PACKAGE 6: TRỢ LÝ ẢO AI & ĐỘNG CƠ TRI THỨC RAG ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 6: TRỢ LÝ ẢO AI & ĐỘNG CƠ TRI THỨC RAG           -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg6_AI_RAG">')
    lines.append('    <rect x="1320" y="1430" width="840" height="740" class="pkg-border"/>')
    lines.append('    <rect x="1320" y="1430" width="680" height="28" class="pkg-header"/>')
    lines.append('    <text x="1335" y="1449" class="t-pkg">PHÂN HỆ 6: TRỢ LÝ ẢO AI &amp; ĐỘNG CƠ TRI THỨC RAG — chatbot-service • gateway-bff</text>')

    # Core Chatbot
    lines.append(uc(1500, 1515, 125, 26, "UC-39", "Hỏi đáp tự nhiên với Trợ lý AI", "uc-core"))
    lines.append(uc(1480, 1630, 110, 24, "UC-40", "Bóc tách Ý định &amp; Thực thể", "uc"))
    lines.append(dep_arrow(1500, 1541, 1480, 1606, "<<include>>", (1530, 1575)))

    lines.append(uc(1480, 1750, 120, 24, "UC-41", "Truy xuất RAG 768-D Vectors", "uc-core"))
    lines.append(dep_arrow(1480, 1654, 1480, 1726, "<<include>>", (1525, 1690)))

    lines.append(uc(1800, 1630, 115, 24, "UC-44", "Sinh thẻ trực quan (Rich Card)", "uc-ext"))
    lines.append(dep_arrow(1800, 1606, 1625, 1530, "<<extend>>", (1760, 1555)))

    lines.append(uc(1500, 1880, 120, 24, "UC-42", "Tư vấn cước IATA tự động", "uc"))
    lines.append(uc(1800, 1880, 125, 24, "UC-43", "Hướng dẫn lập hồ sơ BBBT AI", "uc"))

    lines.append('  </g>')
    lines.append('')

    # ==================== PACKAGE 7: QUẢN TRỊ HỆ THỐNG, DANH MỤC & BẢO MẬT ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 7: QUẢN TRỊ HỆ THỐNG, DANH MỤC & BẢO MẬT         -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg7_Admin_Masterdata">')
    lines.append('    <rect x="2180" y="1430" width="840" height="740" class="pkg-border"/>')
    lines.append('    <rect x="2180" y="1430" width="700" height="28" class="pkg-header"/>')
    lines.append('    <text x="2195" y="1449" class="t-pkg">PHÂN HỆ 7: QUẢN TRỊ HỆ THỐNG &amp; CẤU HÌNH — auth-service • masterdata-service</text>')

    # UC-G05 (Abstract Parent)
    lines.append(uc(2400, 1515, 120, 28, "UC-G05", "Xác thực người dùng", "uc-abstract"))

    # Children of UC-G05
    lines.append(uc(2280, 1620, 95, 23, "UC-45", "Đăng nhập Email &amp; Mật khẩu", "uc"))
    lines.append(uc(2450, 1620, 95, 23, "UC-46", "Đăng nhập OTP SMS SĐT", "uc"))
    lines.append(uc(2630, 1620, 95, 23, "UC-47", "Đăng nhập SSO Doanh nghiệp", "uc"))
    lines.append(gen_arrow_up(2280, 1597, 2350, 1543))
    lines.append(gen_arrow_up(2450, 1597, 2400, 1543))
    lines.append(gen_arrow_up(2630, 1597, 2450, 1543))

    # RBAC & Masterdata
    lines.append(uc(2850, 1620, 110, 24, "UC-48", "Phân quyền RBAC người dùng", "uc-core"))
    lines.append(uc(2340, 1730, 115, 24, "UC-49", "Quản lý Hubs &amp; Bưu cục", "uc"))
    lines.append(uc(2630, 1730, 120, 24, "UC-50", "Cấu hình Bảng cước &amp; IATA", "uc-core"))
    lines.append(uc(2870, 1730, 105, 24, "UC-51", "Phân vùng địa lý Tuyến phát", "uc"))
    lines.append(uc(2340, 1850, 115, 24, "UC-52", "Hồ sơ Merchant &amp; Chiết khấu", "uc"))
    lines.append(uc(2630, 1850, 115, 24, "UC-53", "Danh mục lý do giao NDR &amp; SLA", "uc"))
    lines.append(uc(2870, 1850, 115, 24, "UC-54", "CMS Quản trị Tri thức RAG", "uc"))
    lines.append(uc(2550, 1980, 125, 24, "UC-55", "Giám sát Nhật ký Audit Logs", "uc"))

    lines.append('  </g>')
    lines.append('')

    # ==================== ACTOR INHERITANCE HIERARCHY (LEFT & RIGHT) ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- ACTOR GENERALIZATION HIERARCHY (LEFT: CUSTOMER, RIGHT: STAFF) -->')
    lines.append('  <!-- ========================================================= -->')

    # ROOT ACTOR: Người dùng Hệ thống (System User)
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

    # SUB-ROOT 1: Khách hàng (Customer / External Actor)
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
    # Generalization Customer -> System User
    lines.append(gen_arrow_up(280, 420, 280, 360))

    # SUB-CHILD 1.1: Khách vãng lai (Guest / Anonymous)
    lines.append('  <g id="Actor_Guest" transform="translate(70, 680)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body"/>')
    lines.append('    <text x="50" y="140" class="t-actor">Khách vãng lai</text>')
    lines.append('    <text x="50" y="155" class="t-role">(Guest / Anonymous)</text>')
    lines.append('    <text x="50" y="169" class="t-app">guest-web :5177</text>')
    lines.append('  </g>')
    # Generalization Guest -> Customer
    lines.append('  <path d="M 120 680 L 120 620 L 260 620" class="gen-line"/>')
    lines.append('  <polygon points="260,613 274,620 260,627" class="gen-arrow"/>')

    # SUB-CHILD 1.2: Người dùng Đã định danh (Authenticated User)
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
    # Generalization Auth User -> Customer
    lines.append('  <path d="M 420 680 L 420 620 L 300 620" class="gen-line"/>')
    lines.append('  <polygon points="300,627 286,620 300,613" class="gen-arrow"/>')

    # LEAF 1: Người nhận hàng (Consignee / Recipient)
    lines.append('  <g id="Actor_Recipient" transform="translate(180, 1020)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body"/>')
    lines.append('    <text x="50" y="140" class="t-actor">Người nhận hàng</text>')
    lines.append('    <text x="50" y="155" class="t-role">(Consignee / Recipient)</text>')
    lines.append('    <text x="50" y="169" class="t-app">customer-mobile</text>')
    lines.append('  </g>')
    # Generalization Recipient -> Auth User
    lines.append('  <path d="M 230 1020 L 230 920 L 400 920 L 400 870" class="gen-line"/>')
    lines.append('  <polygon points="393,870 400,856 407,870" class="gen-arrow"/>')

    # LEAF 2: Chủ Shop / Người gửi (Merchant / Shipper)
    lines.append('  <g id="Actor_Merchant" transform="translate(180, 1380)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body"/>')
    lines.append('    <text x="50" y="140" class="t-actor">Chủ Shop / Người gửi</text>')
    lines.append('    <text x="50" y="155" class="t-role">(Merchant / Shipper)</text>')
    lines.append('    <text x="50" y="169" class="t-app">merchant-web :5174</text>')
    lines.append('  </g>')
    # Generalization Merchant -> Auth User
    lines.append('  <path d="M 230 1380 L 230 940 L 430 940 L 430 870" class="gen-line"/>')
    lines.append('  <polygon points="423,870 430,856 437,870" class="gen-arrow"/>')

    # SUB-ROOT 2: Nhân sự Vận hành Nội bộ (Internal Staff) - RIGHT SIDE
    lines.append('  <g id="Actor_Internal_Staff" transform="translate(3280, 220)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head-abs"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body-abs"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body-abs"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body-abs"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body-abs"/>')
    lines.append('    <text x="50" y="138" class="t-rel">&lt;&lt;abstract&gt;&gt;</text>')
    lines.append('    <text x="50" y="152" class="t-actor-abs">Nhân sự Nội bộ</text>')
    lines.append('    <text x="50" y="167" class="t-role">(Internal Staff)</text>')
    lines.append('  </g>')
    # Generalization Internal Staff -> System User (via top bus line above system boundary)
    lines.append('  <path d="M 3330 220 L 3330 130 L 280 130 L 280 160" class="gen-line"/>')
    lines.append('  <polygon points="273,160 280,174 287,160" class="gen-arrow"/>')

    # LEAF 3: Bưu tá giao nhận (Courier / Driver) - RIGHT SIDE
    lines.append('  <g id="Actor_Courier" transform="translate(3280, 580)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body"/>')
    lines.append('    <text x="50" y="140" class="t-actor">Bưu tá giao nhận</text>')
    lines.append('    <text x="50" y="155" class="t-role">(Courier / Driver)</text>')
    lines.append('    <text x="50" y="169" class="t-app">courier-mobile</text>')
    lines.append('  </g>')
    lines.append(gen_arrow_up(3330, 580, 3330, 400))

    # LEAF 4: Điều phối viên Bưu cục (Hub Ops Coordinator) - RIGHT SIDE
    lines.append('  <g id="Actor_Ops" transform="translate(3280, 980)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body"/>')
    lines.append('    <text x="50" y="140" class="t-actor">Điều phối Bưu cục</text>')
    lines.append('    <text x="50" y="155" class="t-role">(Hub Ops Coordinator)</text>')
    lines.append('    <text x="50" y="169" class="t-app">ops-web :5173</text>')
    lines.append('  </g>')
    lines.append('  <path d="M 3330 980 L 3330 420" class="gen-line"/>')
    lines.append('  <polygon points="3323,420 3330,406 3337,420" class="gen-arrow"/>')

    # LEAF 5: Quản trị & Kế toán trưởng (Admin & Chief Accountant) - RIGHT SIDE
    lines.append('  <g id="Actor_Admin" transform="translate(3280, 1420)">')
    lines.append('    <circle cx="50" cy="25" r="16" class="actor-head"/>')
    lines.append('    <line x1="50" y1="41" x2="50" y2="85" class="actor-body"/>')
    lines.append('    <line x1="22" y1="58" x2="78" y2="58" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="28" y2="120" class="actor-body"/>')
    lines.append('    <line x1="50" y1="85" x2="72" y2="120" class="actor-body"/>')
    lines.append('    <text x="50" y="140" class="t-actor">Quản trị &amp; Kế toán</text>')
    lines.append('    <text x="50" y="155" class="t-role">(Admin / Accountant)</text>')
    lines.append('    <text x="50" y="169" class="t-app">admin-web :5175</text>')
    lines.append('  </g>')
    lines.append('  <path d="M 3330 1420 L 3330 440" class="gen-line"/>')
    lines.append('  <polygon points="3323,440 3330,426 3337,440" class="gen-arrow"/>')

    # ==================== ASSOCIATIONS (ACTORS TO USE CASES) ====================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- ASSOCIATIONS (ACTORS TO RELEVANT USE CASES)              -->')
    lines.append('  <!-- ========================================================= -->')

    # 1. System User (General) -> UC-G04 (Tra cứu), UC-39 (Chatbot AI)
    # Since System User is abstract, all users inherit tracking and chatbot access!
    lines.append('  <line x1="330" y1="280" x2="630" y2="1515" class="assoc"/>')
    lines.append('  <line x1="330" y1="290" x2="1375" y2="1515" class="assoc"/>')

    # 2. Guest -> UC-35 (Tra cứu lộ trình công khai), UC-42 (Tư vấn cước IATA AI)
    lines.append('  <line x1="170" y1="750" x2="565" y2="1630" class="assoc"/>')
    lines.append('  <line x1="170" y1="770" x2="1380" y2="1880" class="assoc"/>')

    # 3. Authenticated User -> UC-G05 (Xác thực đăng nhập), UC-48 (Xem phân quyền)
    lines.append('  <line x1="470" y1="750" x2="2280" y2="1515" class="assoc"/>')

    # 4. Recipient -> UC-16 (Nhận hàng), UC-19 (Hẹn lại giao), UC-20 (BBBT 24h bể vỡ), UC-28 (Quét VietQR)
    lines.append('  <line x1="280" y1="1080" x2="2005" y2="480" class="assoc"/>')
    lines.append('  <line x1="280" y1="1100" x2="2445" y2="580" class="assoc"/>')
    lines.append('  <line x1="280" y1="1120" x2="535" y2="970" class="assoc"/>')
    lines.append('  <line x1="280" y1="1140" x2="2025" y2="970" class="assoc"/>')

    # 5. Merchant -> UC-G01 (Tạo đơn), UC-06 (Yêu cầu lấy), UC-07 (Đổi địa chỉ/COD), UC-08 (Lọc đơn), UC-20 (Khiếu nại), UC-32 (Đối soát), UC-33 (Rút tiền)
    lines.append('  <line x1="280" y1="1420" x2="705" y2="245" class="assoc"/>')
    lines.append('  <line x1="280" y1="1440" x2="555" y2="570" class="assoc"/>')
    lines.append('  <line x1="280" y1="1460" x2="825" y2="570" class="assoc"/>')
    lines.append('  <line x1="280" y1="1480" x2="1085" y2="570" class="assoc"/>')
    lines.append('  <line x1="280" y1="1500" x2="535" y2="970" class="assoc"/>')
    lines.append('  <line x1="280" y1="1520" x2="2100" y2="1100" class="assoc"/>')
    lines.append('  <line x1="280" y1="1540" x2="2410" y2="1100" class="assoc"/>')

    # 6. Courier -> UC-10 (Gom hàng), UC-16 (Giao chặng cuối), UC-18 (NDR), UC-23 (Ký BBBT), UC-27 (Thu tiền mặt), UC-30 (Quyết toán ca)
    lines.append('  <line x1="3280" y1="640" x2="2015" y2="245" class="assoc"/>')
    lines.append('  <line x1="3280" y1="660" x2="2235" y2="480" class="assoc"/>')
    lines.append('  <line x1="3280" y1="680" x2="2820" y2="480" class="assoc"/>')
    lines.append('  <line x1="3280" y1="700" x2="765" y2="1100" class="assoc"/>')
    lines.append('  <line x1="3280" y1="720" x2="2020" y2="970" class="assoc"/>')
    lines.append('  <line x1="3280" y1="740" x2="2785" y2="970" class="assoc"/>')

    # 7. Hub Ops -> UC-11 (Inbound), UC-12 (Outbound), UC-13 (Manifest), UC-14 (Nhận bao tải), UC-15 (Phân tuyến), UC-24 (Thẩm định ≤ 500k), UC-26 (Hòa giải)
    lines.append('  <line x1="3280" y1="1040" x2="2255" y2="245" class="assoc"/>')
    lines.append('  <line x1="3280" y1="1060" x2="2495" y2="245" class="assoc"/>')
    lines.append('  <line x1="3280" y1="1080" x2="2755" y2="245" class="assoc"/>')
    lines.append('  <line x1="3280" y1="1100" x2="2125" y2="360" class="assoc"/>')
    lines.append('  <line x1="3280" y1="1120" x2="2445" y2="360" class="assoc"/>')
    lines.append('  <line x1="3280" y1="1140" x2="1065" y2="1100" class="assoc"/>')
    lines.append('  <line x1="3280" y1="1160" x2="1160" y2="1230" class="assoc"/>')

    # 8. Admin & Accountant -> UC-25 (Duyệt bồi thường >500k), UC-31 (Đối soát SePay), UC-32 (Bảng kê COD), UC-34 (Báo cáo doanh thu), UC-48..55 (Quản trị)
    lines.append('  <line x1="3280" y1="1480" x2="870" y2="1230" class="assoc"/>')
    lines.append('  <line x1="3280" y1="1500" x2="2060" y2="1100" class="assoc"/>')
    lines.append('  <line x1="3280" y1="1520" x2="2340" y2="1100" class="assoc"/>')
    lines.append('  <line x1="3280" y1="1540" x2="2345" y2="1230" class="assoc"/>')
    lines.append('  <line x1="3280" y1="1560" x2="2960" y2="1620" class="assoc"/>')
    lines.append('  <line x1="3280" y1="1580" x2="2750" y2="1730" class="assoc"/>')
    lines.append('  <line x1="3280" y1="1600" x2="2985" y2="1850" class="assoc"/>')
    lines.append('  <line x1="3280" y1="1620" x2="2675" y2="1980" class="assoc"/>')

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
