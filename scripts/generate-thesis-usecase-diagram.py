#!/usr/bin/env python3
"""
Standardized High-Resolution Enterprise UML Use Case Diagram Generator for Nexus Express System
STRICTLY GROUNDED IN DEPLOYED REPOSITORY IMPLEMENTATION (NO ABSTRACT / INVENTED ROLES)
Audited 1:1 against 15 backend microservices and 6 client applications.

Layout Optimization:
  - Massive Spacing between Packages:
      Horizontal Boulevard between Columns: 800px (X: 2000 to 2800)
      Vertical Gap between Rows: 200px (Y: 960 to 1160, Y: 1860 to 2060)
      Distance from Actors to Packages: 420px (Clear breathing room)
  - 100% Direct Straight / Slanted Clean Lines (Tia thẳng chéo trực tiếp - KHÔNG gấp khúc)
  - Zero Crossing over Use Case Ovals (Các đường nối không bao giờ cắt qua elip khác)
  - Mathematical Ellipse-edge Contact Point Calculation (Đường nối tiếp xúc chính xác viền ngoài elip)
  - Central Auth Gateway with Core Login <<include>> from all 6 packages.
"""

import sys
import os
import math

def generate_svg():
    width = 4800
    height = 3300

    lines = []
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%">')
    lines.append('  <defs>')
    lines.append('    <style>')
    lines.append('      /* ===== FOUNDATIONS ===== */')
    lines.append('      .bg { fill: #FFFFFF; }')
    lines.append('      .frame { stroke: #000000; stroke-width: 2.4; fill: none; }')
    lines.append('      .frame-inner { stroke: #000000; stroke-width: 1.1; fill: none; }')
    lines.append('')
    lines.append('      /* ===== TYPOGRAPHY ===== */')
    lines.append('      .t-main { font-family: "Times New Roman", Times, serif; font-size: 32px; font-weight: bold; fill: #000000; }')
    lines.append('      .t-sub { font-family: Arial, sans-serif; font-size: 15px; font-style: italic; fill: #333333; }')
    lines.append('      .t-boundary { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #000000; letter-spacing: 0.8px; }')
    lines.append('      .t-pkg { font-family: Arial, sans-serif; font-size: 14.5px; font-weight: bold; fill: #000000; }')
    lines.append('      .t-uc { font-family: Arial, sans-serif; font-size: 12.5px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-uc-abs { font-family: Arial, sans-serif; font-size: 12.5px; font-weight: bold; font-style: italic; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-ucid { font-family: "Courier New", monospace; font-size: 10.5px; font-weight: bold; fill: #444444; text-anchor: middle; }')
    lines.append('      .t-actor { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-role { font-family: Arial, sans-serif; font-size: 13px; font-style: italic; fill: #444444; text-anchor: middle; }')
    lines.append('      .t-app { font-family: "Courier New", monospace; font-size: 12px; font-weight: bold; fill: #111827; text-anchor: middle; }')
    lines.append('      .t-rel { font-family: Arial, sans-serif; font-size: 11px; font-style: italic; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-legend { font-family: Arial, sans-serif; font-size: 12.5px; fill: #222222; }')
    lines.append('      .t-note { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #000000; }')
    lines.append('')
    lines.append('      /* ===== SHAPES ===== */')
    lines.append('      .sys-border { fill: #FFFFFF; stroke: #000000; stroke-width: 2.4; }')
    lines.append('      .pkg-border { fill: none; stroke: #000000; stroke-width: 1.4; stroke-dasharray: 8 5; }')
    lines.append('      .pkg-header { fill: #F3F4F6; stroke: #000000; stroke-width: 1.2; }')
    lines.append('      .gateway-border { fill: #FAFAFA; stroke: #000000; stroke-width: 2.0; stroke-dasharray: 6 4; }')
    lines.append('      .gateway-header { fill: #E5E7EB; stroke: #000000; stroke-width: 1.4; }')
    lines.append('      .uc-abstract { fill: #F3F4F6; stroke: #000000; stroke-width: 2.2; }')
    lines.append('      .uc-core { fill: #FFFFFF; stroke: #000000; stroke-width: 2.8; }')
    lines.append('      .uc { fill: #FFFFFF; stroke: #000000; stroke-width: 1.4; }')
    lines.append('      .uc-ext { fill: #F9FAFB; stroke: #000000; stroke-width: 1.2; stroke-dasharray: 6 3; }')
    lines.append('      .actor-body { stroke: #000000; stroke-width: 2.4; fill: none; }')
    lines.append('      .actor-head { fill: #FFFFFF; stroke: #000000; stroke-width: 2.4; }')
    lines.append('      .legend-box { fill: #F8F9FA; stroke: #000000; stroke-width: 1.2; }')
    lines.append('')
    lines.append('      /* ===== LINES AND CONNECTORS ===== */')
    lines.append('      .assoc { stroke: #000000; stroke-width: 1.3; fill: none; }')
    lines.append('      .gen-line { stroke: #000000; stroke-width: 1.5; fill: none; }')
    lines.append('      .gen-arrow { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .dep-line { stroke: #000000; stroke-width: 1.2; stroke-dasharray: 6 4; fill: none; }')
    lines.append('      .dep-arrow { fill: #000000; stroke: #000000; stroke-width: 0.6; }')
    lines.append('    </style>')
    lines.append('  </defs>')
    lines.append('')
    lines.append('  <!-- CANVAS -->')
    lines.append(f'  <rect width="{width}" height="{height}" class="bg"/>')
    lines.append(f'  <rect x="20" y="20" width="{width-40}" height="{height-40}" class="frame"/>')
    lines.append(f'  <rect x="25" y="25" width="{width-50}" height="{height-50}" class="frame-inner"/>')
    lines.append('')

    # HEADER
    lines.append('  <!-- ==================== HEADER ==================== -->')
    lines.append('  <g id="Header">')
    lines.append(f'    <rect x="40" y="40" width="{width-80}" height="96" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>')
    lines.append('    <text x="70" y="78" class="t-main">SƠ ĐỒ USE CASE TỔNG QUÁT HỆ THỐNG NEXUS LOGISTICS (CHUẨN HOÁ HỆ THỐNG THỰC TẾ)</text>')
    lines.append('    <text x="70" y="112" class="t-sub">53 Use Cases thực tế từ 15 Backend Microservices &amp; 6 Client Applications • 6 Roles thực tế • Bố cục thoáng đãng &amp; Tia thẳng trực tiếp • Cổng Xác thực Trung tâm</text>')
    lines.append(f'    <rect x="{width-460}" y="52" width="410" height="72" fill="#F8F9FA" stroke="#000000" stroke-width="1.2"/>')
    lines.append(f'    <text x="{width-445}" y="80" font-family="Arial" font-size="14" font-weight="bold" fill="#000000">MÃ BẢN VẼ: UC-SYS-REAL-01 (REV.11)</text>')
    lines.append(f'    <text x="{width-445}" y="105" font-family="Arial" font-size="12" fill="#444444">TIÊU CHUẨN: IEEE 830 • UML 2.5 OMG</text>')
    lines.append('  </g>')
    lines.append('')

    # SYSTEM BOUNDARY (X: 620 to 4180, Width: 3560, Height: 2740)
    sb_x = 620
    sb_y = 160
    sb_w = 3560
    sb_h = 2740
    lines.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    lines.append('  <g id="System_Boundary">')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="1250" height="38" class="pkg-header"/>')
    lines.append(f'    <text x="{sb_x+25}" y="{sb_y+26}" class="t-boundary">RANH GIỚI HỆ THỐNG: NEXUS LOGISTICS PLATFORM (15 BACKEND MICROSERVICES)</text>')
    lines.append('  </g>')
    lines.append('')

    # HELPER FUNCTIONS
    def uc(cx, cy, rx, ry, ucid, title, uctype="uc"):
        res = []
        res.append(f'    <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" class="{uctype}"/>')
        safe_title = title.replace('&amp;', '&').replace('&', '&amp;')
        if uctype == "uc-abstract":
            res.append(f'    <text x="{cx}" y="{cy-10}" class="t-rel">&lt;&lt;abstract&gt;&gt;</text>')
            res.append(f'    <text x="{cx}" y="{cy+4}" class="t-ucid">{ucid}</text>')
            res.append(f'    <text x="{cx}" y="{cy+20}" class="t-uc-abs">{safe_title}</text>')
        else:
            res.append(f'    <text x="{cx}" y="{cy-5}" class="t-ucid">{ucid}</text>')
            res.append(f'    <text x="{cx}" y="{cy+14}" class="t-uc">{safe_title}</text>')
        return "\n".join(res)

    def ellipse_point(cx, cy, rx, ry, from_x, from_y):
        dx = from_x - cx
        dy = from_y - cy
        if dx == 0 and dy == 0:
            return cx, cy
        angle = math.atan2(dy, dx)
        return cx + rx * math.cos(angle), cy + ry * math.sin(angle)

    def direct_line(x1, y1, cx, cy, rx, ry, stroke_class="assoc"):
        x2, y2 = ellipse_point(cx, cy, rx, ry, x1, y1)
        return f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" class="{stroke_class}"/>'

    def direct_dep_arrow(cx1, cy1, rx1, ry1, cx2, cy2, rx2, ry2, label="<<include>>", label_offset=0):
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
        res.append(f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{base_x:.1f}" y2="{base_y:.1f}" class="dep-line"/>')
        res.append(f'    <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" class="dep-arrow"/>')
        if label:
            lx = (x1 + x2) / 2 - uy * label_offset
            ly = (y1 + y2) / 2 + ux * label_offset - 4
            safe_label = label.replace('<', '&lt;').replace('>', '&gt;')
            res.append(f'    <text x="{lx:.1f}" y="{ly:.1f}" class="t-rel">{safe_label}</text>')
        return "\n".join(res)

    def gen_arrow_direct(cx1, cy1, rx1, ry1, cx2, cy2, rx2, ry2):
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
        base_x = tip_x - ux * 16
        base_y = tip_y - uy * 16
        p1_x = base_x - uy * 8
        p1_y = base_y + ux * 8
        p2_x = base_x + uy * 8
        p2_y = base_y - ux * 8

        res = []
        res.append(f'    <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{base_x:.1f}" y2="{base_y:.1f}" class="gen-line"/>')
        res.append(f'    <polygon points="{tip_x:.1f},{tip_y:.1f} {p1_x:.1f},{p1_y:.1f} {p2_x:.1f},{p2_y:.1f}" class="gen-arrow"/>')
        return "\n".join(res)

    def actor_stick(x, y, actor_id, title, role, app):
        res = []
        res.append(f'  <g id="{actor_id}" transform="translate({x}, {y})">')
        res.append('    <circle cx="50" cy="30" r="18" class="actor-head"/>')
        res.append('    <line x1="50" y1="48" x2="50" y2="100" class="actor-body"/>')
        res.append('    <line x1="18" y1="68" x2="82" y2="68" class="actor-body"/>')
        res.append('    <line x1="50" y1="100" x2="22" y2="145" class="actor-body"/>')
        res.append('    <line x1="50" y1="100" x2="78" y2="145" class="actor-body"/>')
        res.append(f'    <text x="50" y="172" class="t-actor">{title}</text>')
        res.append(f'    <text x="50" y="191" class="t-role">({role})</text>')
        res.append(f'    <text x="50" y="209" class="t-app">{app}</text>')
        res.append('  </g>')
        return "\n".join(res)

    # =========================================================================
    # 6 REAL ACTORS (EXACTLY AS IMPLEMENTED IN CODEBASE)
    # =========================================================================
    lines.append('  <!-- ==================== 6 REAL CODEBASE ROLES ==================== -->')
    # 1. MERCHANT (Left, Row 1, Center: 242, 548)
    lines.append(actor_stick(160, 480, "Actor_Merchant", "Merchant (Chủ Shop)", "MERCHANT", "merchant-web :5176"))
    m_hand = (242, 548)

    # 2. CUSTOMER (Left, Row 2, Center: 242, 1488)
    lines.append(actor_stick(160, 1420, "Actor_Customer", "Khách hàng", "CUSTOMER", "customer-mobile :8082"))
    c_hand = (242, 1488)

    # 3. GUEST (Left, Row 3, Center: 242, 2428)
    lines.append(actor_stick(160, 2360, "Actor_Guest", "Khách vãng lai", "GUEST", "guest-web :5174"))
    g_hand = (242, 2428)

    # ACTOR GENERALIZATION: CUSTOMER ──▷ GUEST
    lines.append('  <!-- ACTOR GENERALIZATION: CUSTOMER ──▷ GUEST -->')
    lines.append('  <g id="Actor_Gen_Customer_Guest">')
    lines.append('    <line x1="210" y1="1640" x2="210" y2="2354" class="gen-line"/>')
    lines.append('    <polygon points="210,2372 202,2354 218,2354" class="gen-arrow"/>')
    lines.append('    <text x="225" y="1995" class="t-rel" text-anchor="start" font-size="12" font-weight="bold">&lt;&lt;generalizes&gt;&gt;</text>')
    lines.append('    <text x="225" y="2014" font-family="Arial" font-size="11" fill="#4B5563" text-anchor="start">(Khách hàng kế thừa Khách vãng lai)</text>')
    lines.append('  </g>')

    # 4. COURIER (Right, Row 1, Center: 4518, 548)
    lines.append(actor_stick(4500, 480, "Actor_Courier", "Courier (Bưu tá)", "COURIER", "courier-mobile :8081"))
    courier_hand = (4518, 548)

    # 5. OPS (Right, Row 2, Center: 4518, 1488)
    lines.append(actor_stick(4500, 1420, "Actor_Ops", "Ops các cấp", "OPS (Hub/Dispatch/Kho)", "ops-web :5175"))
    ops_hand = (4518, 1488)

    # 6. SYSTEM_ADMIN (Right, Row 3, Center: 4518, 2428)
    lines.append(actor_stick(4500, 2360, "Actor_Admin", "System Admin", "SYSTEM_ADMIN", "admin-web :5173"))
    admin_hand = (4518, 2428)

    # =========================================================================
    # PACKAGE 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG (7 UCs)
    # Top Left: X: 660, Y: 210, W: 1340, H: 750
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG (7 UCs)          -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg1_Shipment_Management">')
    lines.append('    <rect x="660" y="210" width="1340" height="750" class="pkg-border"/>')
    lines.append('    <rect x="660" y="210" width="880" height="32" class="pkg-header"/>')
    lines.append('    <text x="680" y="232" class="t-pkg">PHÂN HỆ 1: TIẾP NHẬN &amp; QUẢN LÝ ĐƠN HÀNG — shipment • pricing • pickup</text>')

    # Column 1 (X: 840, Facing Merchant): UC-01a, UC-01b, UC-02, UC-04, UC-05, UC-06
    lines.append(uc(840, 280, 120, 26, "UC-01a", "Tạo đơn trên Portal", "uc-core"))
    lines.append(uc(840, 390, 125, 26, "UC-01b", "Đồng bộ Webhook Sàn TMĐT", "uc-core"))
    lines.append(uc(840, 510, 125, 26, "UC-02", "Tra cứu danh sách &amp; Lọc đơn", "uc"))
    lines.append(uc(840, 630, 120, 26, "UC-04", "Yêu cầu bưu tá lấy hàng", "uc-core"))
    lines.append(uc(840, 750, 120, 26, "UC-05", "Đổi địa chỉ / SĐT / COD", "uc"))
    lines.append(uc(840, 870, 120, 26, "UC-06", "Hủy đơn gửi hàng", "uc"))

    # Column 2 (X: 1320): UC-01 Abstract
    lines.append(uc(1320, 335, 130, 28, "UC-01", "Tạo đơn gửi hàng", "uc-abstract"))

    # Column 3 (X: 1760): UC-03, UC-07
    lines.append(uc(1760, 280, 125, 26, "UC-03", "Tính cước quy đổi IATA", "uc-core"))
    lines.append(uc(1760, 400, 125, 26, "UC-07", "In phiếu gửi Barcode / QR", "uc"))

    # Internal Relationships
    lines.append(gen_arrow_direct(840, 280, 120, 26, 1320, 335, 130, 28))
    lines.append(gen_arrow_direct(840, 390, 125, 26, 1320, 335, 130, 28))
    lines.append(direct_dep_arrow(1320, 335, 130, 28, 1760, 280, 125, 26, "<<include>>", 15))
    lines.append(direct_dep_arrow(1320, 335, 130, 28, 1760, 400, 125, 26, "<<include>>", -15))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # PACKAGE 2: KHO TRUNG CHUYỂN, PHÂN TUYẾN & GIAO HÀNG (11 UCs)
    # Top Right: X: 2800, Y: 210, W: 1360, H: 750
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 2: KHO TRUNG CHUYỂN, PHÂN TUYẾN & GIAO HÀNG (11 UCs) -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg2_Hub_Dispatch_Delivery">')
    lines.append('    <rect x="2800" y="210" width="1360" height="750" class="pkg-border"/>')
    lines.append('    <rect x="2800" y="210" width="980" height="32" class="pkg-header"/>')
    lines.append('    <text x="2820" y="232" class="t-pkg">PHÂN HỆ 2: KHO TRUNG CHUYỂN, PHÂN TUYẾN &amp; GIAO HÀNG — scan • manifest • dispatch • delivery</text>')

    # Column 3 (X: 3940, Facing Courier & Ops): UC-08, UC-09, UC-10, UC-11, UC-13, UC-14
    lines.append(uc(3940, 260, 120, 25, "UC-08", "Quét tiếp nhận gom hàng", "uc"))
    lines.append(uc(3940, 360, 120, 25, "UC-09", "Quét mã nhập kho Inbound", "uc"))
    lines.append(uc(3940, 460, 120, 25, "UC-10", "Quét mã xuất kho Outbound", "uc"))
    lines.append(uc(3940, 560, 125, 25, "UC-11", "Đóng bao Manifest &amp; Niêm chì", "uc"))
    lines.append(uc(3940, 670, 130, 26, "UC-13", "Phân công task &amp; Tối ưu tuyến", "uc-core"))
    lines.append(uc(3940, 800, 125, 28, "UC-14", "Thực hiện chuyến phát", "uc-core"))

    # Column 2 (X: 3440): UC-12, UC-14a
    lines.append(uc(3440, 560, 125, 25, "UC-12", "Tiếp nhận bao tải đầu tuyến", "uc"))
    lines.append(uc(3440, 800, 125, 25, "UC-14a", "Ký nhận điện tử e-POD &amp; OTP", "uc"))

    # Column 1 (X: 2980): UC-15, UC-16, UC-17
    lines.append(uc(2980, 680, 120, 26, "UC-15", "Báo phát thất bại NDR", "uc"))
    lines.append(uc(2980, 800, 115, 26, "UC-16", "Hẹn lại ngày phát", "uc"))
    lines.append(uc(2980, 900, 115, 26, "UC-17", "Xử lý chuyển hoàn (RTS)", "uc"))

    # Internal Relationships
    lines.append(direct_dep_arrow(3940, 560, 125, 25, 3440, 560, 125, 25, "<<include>>", 15))
    lines.append(direct_dep_arrow(3940, 800, 125, 28, 3440, 800, 125, 25, "<<include>>", 15))
    lines.append(direct_dep_arrow(2980, 680, 120, 26, 3940, 800, 125, 28, "<<extend>>", 18))
    lines.append(direct_dep_arrow(2980, 800, 115, 26, 2980, 680, 120, 26, "<<extend>>", 20))
    lines.append(direct_dep_arrow(2980, 900, 115, 26, 2980, 680, 120, 26, "<<extend>>", 20))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # CENTRAL AUTHENTICATION & ACCESS GATEWAY (2 UCs)
    # Center: X: 2220, Y: 1380, W: 360, H: 300 (Center X = 2400)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- CENTRAL AUTHENTICATION GATEWAY: auth-service & gateway-bff-->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Central_Auth_Gateway">')
    lines.append('    <rect x="2220" y="1380" width="360" height="300" class="gateway-border"/>')
    lines.append('    <rect x="2220" y="1380" width="360" height="32" class="gateway-header"/>')
    lines.append('    <text x="2400" y="1402" font-family="Arial" font-size="13" font-weight="bold" fill="#111827" text-anchor="middle">CỔNG XÁC THỰC &amp; BẢO MẬT</text>')

    # UC-42: Đăng nhập hệ thống (Core Auth Hub)
    lines.append(uc(2400, 1460, 135, 30, "UC-42", "Đăng nhập hệ thống", "uc-core"))
    # UC-43: Đăng ký tài khoản khách
    lines.append(uc(2400, 1600, 135, 28, "UC-43", "Đăng ký tài khoản khách", "uc"))

    # Extend UC-43 -> UC-42
    lines.append(direct_dep_arrow(2400, 1600, 135, 28, 2400, 1460, 135, 30, "<<extend>>", 20))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # PACKAGE 3: XỬ LÝ SỰ CỐ & BỒI THƯỜNG BƯU CHÍNH (6 UCs)
    # Middle Left: X: 660, Y: 1160, W: 1340, H: 700
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 3: XỬ LÝ SỰ CỐ & BỒI THƯỜNG BƯU CHÍNH (6 UCs)    -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg3_Claims_Incident">')
    lines.append('    <rect x="660" y="1160" width="1340" height="700" class="pkg-border"/>')
    lines.append('    <rect x="660" y="1160" width="900" height="32" class="pkg-header"/>')
    lines.append('    <text x="680" y="1182" class="t-pkg">PHÂN HỆ 3: XỬ LÝ SỰ CỐ &amp; BỒI THƯỜNG BƯU CHÍNH — shipment-service (claims, investigations)</text>')

    # Column 1 (X: 860, Facing Customer): UC-19, UC-19a
    lines.append(uc(860, 1300, 135, 28, "UC-19", "Khởi tạo khiếu nại sự cố", "uc-core"))
    lines.append(uc(860, 1580, 135, 26, "UC-19a", "Bưu tá đồng kiểm &amp; Ký số", "uc"))

    # Column 2 (X: 1380): UC-20, UC-21a
    lines.append(uc(1380, 1300, 135, 28, "UC-20", "Thẩm định sự cố (≤ 500k)", "uc-core"))
    lines.append(uc(1380, 1580, 130, 26, "UC-21a", "Điều tra &amp; Hòa giải tranh chấp", "uc"))

    # Column 3 (X: 1800): UC-21, UC-22
    lines.append(uc(1800, 1300, 135, 28, "UC-21", "Phê duyệt bồi thường (> 500k)", "uc"))
    lines.append(uc(1800, 1580, 130, 26, "UC-22", "Cấn trừ tiền bồi thường", "uc"))

    # Internal Relationships
    lines.append(direct_dep_arrow(860, 1300, 135, 28, 860, 1580, 135, 26, "<<include>>", 20))
    lines.append(direct_dep_arrow(860, 1300, 135, 28, 1380, 1300, 135, 28, "<<include>>", 15))
    lines.append(direct_dep_arrow(1380, 1580, 130, 26, 1380, 1300, 135, 28, "<<extend>>", 20))
    lines.append(direct_dep_arrow(1800, 1300, 135, 28, 1380, 1300, 135, 28, "<<extend>>", 15))
    lines.append(direct_dep_arrow(1800, 1300, 135, 28, 1800, 1580, 130, 26, "<<include>>", 20))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # PACKAGE 4: ĐỐI SOÁT TÀI CHÍNH & THU HỘ COD (6 UCs)
    # Middle Right: X: 2800, Y: 1160, W: 1360, H: 700
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 4: ĐỐI SOÁT TÀI CHÍNH & THU HỘ COD (6 UCs)       -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg4_Finance_COD">')
    lines.append('    <rect x="2800" y="1160" width="1360" height="700" class="pkg-border"/>')
    lines.append('    <rect x="2800" y="1160" width="900" height="32" class="pkg-header"/>')
    lines.append('    <text x="2820" y="1182" class="t-pkg">PHÂN HỆ 4: ĐỐI SOÁT TÀI CHÍNH &amp; THU HỘ COD — payment-service • reporting-service</text>')

    # Column 3 (X: 3940, Facing Courier & Ops): UC-23a, UC-24, UC-27, UC-28
    lines.append(uc(3940, 1280, 125, 26, "UC-23a", "Thu tiền mặt tại điểm phát", "uc-core"))
    lines.append(uc(3940, 1420, 130, 26, "UC-24", "Quyết toán ca nộp tiền bưu tá", "uc-core"))
    lines.append(uc(3940, 1560, 130, 28, "UC-27", "Xác nhận đối soát &amp; Chốt sổ", "uc"))
    lines.append(uc(3940, 1700, 135, 26, "UC-28", "Báo cáo dòng tiền &amp; Doanh thu", "uc"))

    # Column 2 (X: 3440): UC-23, UC-25
    lines.append(uc(3440, 1280, 135, 28, "UC-23", "Thu hộ tiền COD bưu phẩm", "uc-abstract"))
    lines.append(uc(3440, 1560, 130, 26, "UC-25", "Đối soát tự động SePay Webhook", "uc"))

    # Column 1 (X: 2980, Facing Central Boulevard): UC-23b, UC-26
    lines.append(uc(2980, 1280, 125, 26, "UC-23b", "Thanh toán VietQR SePay động", "uc-core"))
    lines.append(uc(2980, 1560, 130, 28, "UC-26", "Lập bảng kê đối soát COD", "uc-core"))

    # Internal Relationships
    lines.append(gen_arrow_direct(3940, 1280, 125, 26, 3440, 1280, 135, 28))
    lines.append(gen_arrow_direct(2980, 1280, 125, 26, 3440, 1280, 135, 28))
    lines.append(direct_dep_arrow(3440, 1560, 130, 26, 2980, 1280, 125, 26, "<<include>>", -15))
    lines.append(direct_dep_arrow(3440, 1560, 130, 26, 3940, 1560, 130, 28, "<<include>>", 15))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # PACKAGE 5: TRUY VẾT HÀNH TRÌNH & TRỢ LÝ AI RAG (11 UCs)
    # Bottom Left: X: 660, Y: 2060, W: 1340, H: 800
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 5: TRUY VẾT HÀNH TRÌNH & TRỢ LÝ AI RAG (11 UCs)   -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg5_Telemetry_AI_RAG">')
    lines.append('    <rect x="660" y="2060" width="1340" height="800" class="pkg-border"/>')
    lines.append('    <rect x="660" y="2060" width="980" height="32" class="pkg-header"/>')
    lines.append('    <text x="680" y="2082" class="t-pkg">PHÂN HỆ 5: TRUY VẾT HÀNH TRÌNH &amp; TRỢ LÝ AI RAG — tracking • chatbot • scan</text>')

    # Column 1 (X: 860, Facing Guest & Customer): UC-32, UC-33, UC-34, UC-38
    lines.append(uc(860, 2160, 125, 26, "UC-32", "Tra cứu lộ trình công khai", "uc"))
    lines.append(uc(860, 2300, 125, 28, "UC-33", "Tra cứu tiến trình nội bộ", "uc"))
    lines.append(uc(860, 2440, 135, 28, "UC-34", "Hội thoại tự nhiên với Trợ lý AI", "uc-core"))
    lines.append(uc(860, 2640, 125, 26, "UC-38", "Tư vấn cước IATA tự động", "uc"))

    # Column 2 (X: 1340): UC-35, UC-36, UC-37, UC-39
    lines.append(uc(1340, 2160, 125, 26, "UC-35", "Khử định danh PII Masking", "uc"))
    lines.append(uc(1340, 2300, 125, 26, "UC-36", "Định vị GPS thời gian thực", "uc"))
    lines.append(uc(1340, 2440, 125, 26, "UC-37", "Bóc tách Ý định &amp; Thực thể", "uc"))
    lines.append(uc(1340, 2640, 125, 26, "UC-39", "Hướng dẫn lập khiếu nại AI", "uc"))

    # Column 3 (X: 1760): UC-34a, UC-37a, UC-41
    lines.append(uc(1760, 2340, 120, 26, "UC-34a", "Sinh thẻ trực quan (Rich Card)", "uc-ext"))
    lines.append(uc(1760, 2480, 130, 26, "UC-37a", "Truy xuất RAG 768-D Vectors", "uc-core"))
    lines.append(uc(1760, 2640, 125, 26, "UC-41", "Điều chuyển nhân viên hỗ trợ", "uc"))

    # Internal Relationships
    lines.append(direct_dep_arrow(860, 2160, 125, 26, 1340, 2160, 125, 26, "<<include>>", 15))
    lines.append(direct_dep_arrow(860, 2300, 125, 28, 1340, 2300, 125, 26, "<<include>>", 15))
    lines.append(direct_dep_arrow(860, 2440, 135, 28, 1340, 2440, 125, 26, "<<include>>", 15))
    lines.append(direct_dep_arrow(1340, 2440, 125, 26, 1760, 2480, 130, 26, "<<include>>", 15))
    lines.append(direct_dep_arrow(1760, 2340, 120, 26, 860, 2440, 135, 28, "<<extend>>", 15))
    lines.append(direct_dep_arrow(1340, 2640, 125, 26, 860, 2440, 135, 28, "<<extend>>", 15))
    lines.append(direct_dep_arrow(1760, 2640, 125, 26, 860, 2440, 135, 28, "<<extend>>", -15))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # PACKAGE 6: QUẢN TRỊ HỆ THỐNG, DANH MỤC & PHÂN QUYỀN (10 UCs)
    # Bottom Right: X: 2800, Y: 2060, W: 1360, H: 800
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 6: QUẢN TRỊ HỆ THỐNG, DANH MỤC & PHÂN QUYỀN (10 UCs) -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg6_Admin_Masterdata">')
    lines.append('    <rect x="2800" y="2060" width="1360" height="800" class="pkg-border"/>')
    lines.append('    <rect x="2800" y="2060" width="980" height="32" class="pkg-header"/>')
    lines.append('    <text x="2820" y="2082" class="t-pkg">PHÂN HỆ 6: QUẢN TRỊ HỆ THỐNG, DANH MỤC &amp; PHÂN QUYỀN — masterdata-service • auth-service</text>')

    # Column 2 (X: 3920, Facing System Admin): UC-44, UC-45, UC-47, UC-48, UC-50, UC-51, UC-52
    lines.append(uc(3920, 2150, 125, 25, "UC-44", "Hồ sơ cá nhân &amp; Mật khẩu", "uc"))
    lines.append(uc(3920, 2250, 125, 26, "UC-45", "Quản trị người dùng &amp; Tài khoản", "uc-core"))
    lines.append(uc(3920, 2350, 125, 25, "UC-47", "Nhật ký kiểm toán bảo mật", "uc"))
    lines.append(uc(3920, 2450, 125, 25, "UC-48", "Quản trị Hubs 4 cấp", "uc"))
    lines.append(uc(3920, 2550, 125, 26, "UC-50", "Cấu hình hệ thống &amp; SLA", "uc-core"))
    lines.append(uc(3920, 2650, 125, 25, "UC-51", "CMS Quản trị bài viết", "uc"))
    lines.append(uc(3920, 2750, 125, 25, "UC-52", "Hồ sơ đối tác Merchant", "uc"))

    # Column 1 (X: 3200, Internal Included UCs): UC-46, UC-49, UC-53
    lines.append(uc(3200, 2250, 125, 25, "UC-46", "Phân quyền RBAC Matrix", "uc-core"))
    lines.append(uc(3200, 2450, 125, 25, "UC-49", "Quản lý phân vùng địa lý", "uc"))
    lines.append(uc(3200, 2550, 125, 25, "UC-53", "Danh mục lý do giao NDR", "uc"))

    # Internal Relationships
    lines.append(direct_dep_arrow(3920, 2250, 125, 26, 3200, 2250, 125, 25, "<<include>>", 15))
    lines.append(direct_dep_arrow(3920, 2450, 125, 25, 3200, 2450, 125, 25, "<<include>>", 15))
    lines.append(direct_dep_arrow(3920, 2550, 125, 26, 3200, 2550, 125, 25, "<<include>>", 15))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # CORE AUTHENTICATION INCLUDES (6 PACKAGES -> UC-42: ĐĂNG NHẬP HỆ THỐNG)
    # Direct Straight Dashed Arrows (Đường thẳng chéo nét đứt trực tiếp)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- CORE AUTHENTICATION INCLUDES (DIRECT RADIAL ARROWS)       -->')
    lines.append('  <!-- ========================================================= -->')

    # 1. Pkg 1: UC-01 (Tạo đơn) -> UC-42 (Đăng nhập)
    lines.append(direct_dep_arrow(1320, 335, 130, 28, 2400, 1460, 135, 30, "<<include>>", 20))
    # 2. Pkg 2: UC-14 (Phát hàng) -> UC-42
    lines.append(direct_dep_arrow(3940, 780, 125, 28, 2400, 1460, 135, 30, "<<include>>", -20))
    # 3. Pkg 3: UC-19 (Khiếu nại) -> UC-42
    lines.append(direct_dep_arrow(860, 1300, 135, 28, 2400, 1460, 135, 30, "<<include>>", 20))
    # 4. Pkg 4: UC-26 (Đối soát COD) -> UC-42
    lines.append(direct_dep_arrow(2980, 1560, 130, 28, 2400, 1460, 135, 30, "<<include>>", -20))
    # 5. Pkg 5: UC-33 (Tiến trình nội bộ) -> UC-42
    lines.append(direct_dep_arrow(860, 2300, 125, 28, 2400, 1460, 135, 30, "<<include>>", 20))
    # 6. Pkg 6: UC-45 (Quản trị người dùng) -> UC-42
    lines.append(direct_dep_arrow(3920, 2250, 125, 26, 2400, 1460, 135, 30, "<<include>>", -20))

    # =========================================================================
    # ASSOCIATIONS (DIRECT STRAIGHT / SLANTED CLEAN LINES - ZERO CROSSINGS)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- ACTOR ASSOCIATIONS (CLEAN DIRECT SLANTED RAYS)            -->')
    lines.append('  <!-- ========================================================= -->')

    # 1. MERCHANT (m_hand = 242, 548) -> Package 1 Column 1
    lines.append(direct_line(m_hand[0], m_hand[1], 840, 280, 120, 26, "assoc"))
    lines.append(direct_line(m_hand[0], m_hand[1], 840, 390, 125, 26, "assoc"))
    lines.append(direct_line(m_hand[0], m_hand[1], 840, 510, 125, 26, "assoc"))
    lines.append(direct_line(m_hand[0], m_hand[1], 840, 630, 120, 26, "assoc"))
    lines.append(direct_line(m_hand[0], m_hand[1], 840, 750, 120, 26, "assoc"))
    lines.append(direct_line(m_hand[0], m_hand[1], 840, 870, 120, 26, "assoc"))

    # 2. CUSTOMER (c_hand = 242, 1488) -> Package 3 & Package 5
    lines.append(direct_line(c_hand[0], c_hand[1], 860, 1300, 135, 28, "assoc")) # UC-19
    lines.append(direct_line(c_hand[0], c_hand[1], 860, 1580, 135, 26, "assoc")) # UC-19a
    lines.append(direct_line(c_hand[0], c_hand[1], 860, 2300, 125, 28, "assoc")) # UC-33 (Kế thừa UC-32, 34, 38 từ GUEST)

    # 3. GUEST (g_hand = 242, 2428) -> Package 5 & Central Auth Gateway
    lines.append(direct_line(g_hand[0], g_hand[1], 860, 2160, 125, 26, "assoc")) # UC-32
    lines.append(direct_line(g_hand[0], g_hand[1], 860, 2440, 135, 28, "assoc")) # UC-34
    lines.append(direct_line(g_hand[0], g_hand[1], 860, 2640, 125, 26, "assoc")) # UC-38
    lines.append(direct_line(g_hand[0], g_hand[1], 2400, 1600, 135, 28, "assoc")) # UC-43 (Đăng ký)

    # 4. COURIER (courier_hand = 4518, 548) -> Package 2 & Package 4
    lines.append(direct_line(courier_hand[0], courier_hand[1], 3940, 260, 120, 25, "assoc"))  # UC-08
    lines.append(direct_line(courier_hand[0], courier_hand[1], 3940, 800, 125, 28, "assoc"))  # UC-14
    lines.append(direct_line(courier_hand[0], courier_hand[1], 3940, 1280, 125, 26, "assoc")) # UC-23a
    lines.append(direct_line(courier_hand[0], courier_hand[1], 3940, 1420, 130, 26, "assoc")) # UC-24

    # 5. OPS (ops_hand = 4518, 1488) -> Package 2 & Package 4
    lines.append(direct_line(ops_hand[0], ops_hand[1], 3940, 360, 120, 25, "assoc"))  # UC-09
    lines.append(direct_line(ops_hand[0], ops_hand[1], 3940, 460, 120, 25, "assoc"))  # UC-10
    lines.append(direct_line(ops_hand[0], ops_hand[1], 3940, 560, 125, 25, "assoc"))  # UC-11
    lines.append(direct_line(ops_hand[0], ops_hand[1], 3940, 670, 130, 26, "assoc"))  # UC-13
    lines.append(direct_line(ops_hand[0], ops_hand[1], 3940, 1420, 130, 26, "assoc")) # UC-24
    lines.append(direct_line(ops_hand[0], ops_hand[1], 3940, 1560, 130, 28, "assoc")) # UC-27
    lines.append(direct_line(ops_hand[0], ops_hand[1], 3940, 1700, 135, 26, "assoc")) # UC-28

    # 6. SYSTEM_ADMIN (admin_hand = 4518, 2428) -> Package 6 Column 2
    lines.append(direct_line(admin_hand[0], admin_hand[1], 3920, 2150, 125, 25, "assoc")) # UC-44
    lines.append(direct_line(admin_hand[0], admin_hand[1], 3920, 2250, 125, 26, "assoc")) # UC-45
    lines.append(direct_line(admin_hand[0], admin_hand[1], 3920, 2350, 125, 25, "assoc")) # UC-47
    lines.append(direct_line(admin_hand[0], admin_hand[1], 3920, 2450, 125, 25, "assoc")) # UC-48
    lines.append(direct_line(admin_hand[0], admin_hand[1], 3920, 2550, 125, 26, "assoc")) # UC-50
    lines.append(direct_line(admin_hand[0], admin_hand[1], 3920, 2650, 125, 25, "assoc")) # UC-51
    lines.append(direct_line(admin_hand[0], admin_hand[1], 3920, 2750, 125, 25, "assoc")) # UC-52

    # =========================================================================
    # LEGEND & TRACEABILITY MATRIX (BOTTOM AREA)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- UML 2.5 LEGEND (BOTTOM LEFT)                             -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="UML_Legend">')
    lines.append('    <rect x="40" y="2940" width="840" height="260" class="legend-box"/>')
    lines.append('    <text x="60" y="2968" class="t-note">CHÚ GIẢI KÝ HIỆU CHUẨN UML 2.5 &amp; KIẾN TRÚC XÁC THỰC BẢO MẬT:</text>')

    # 1. Association
    lines.append('    <line x1="70" y1="3000" x2="160" y2="3000" class="assoc"/>')
    lines.append('    <text x="180" y="3004" class="t-legend"><tspan font-weight="bold">Association (Tia thẳng trực tiếp):</tspan> Nối thẳng từ 6 Roles đến các Use Case khởi tạo trực tiếp (Không rẽ nhánh gấp khúc).</text>')

    # 2. Generalization
    lines.append('    <line x1="70" y1="3035" x2="140" y2="3035" class="gen-line"/>')
    lines.append('    <polygon points="160,3035 140,3027 140,3043" class="gen-arrow"/>')
    lines.append('    <text x="180" y="3039" class="t-legend"><tspan font-weight="bold">Generalization (Kế thừa Đa hình &amp; Tác nhân):</tspan> Base Use Case (Tạo đơn, Thu COD ──▷); Actor: Khách hàng (CUSTOMER) ──▷ Khách vãng lai (GUEST).</text>')

    # 3. Include
    lines.append('    <line x1="70" y1="3070" x2="145" y2="3070" class="dep-line"/>')
    lines.append('    <polygon points="160,3070 148,3065 148,3075" class="dep-arrow"/>')
    lines.append('    <text x="180" y="3074" class="t-legend"><tspan font-weight="bold">&lt;&lt;include&gt;&gt; (Quan hệ Bao hàm Bắt buộc):</tspan> 6 phân hệ nghiệp vụ bắt buộc &lt;&lt;include&gt;&gt; Đăng nhập trung tâm UC-42; Tạo đơn include Tính cước IATA.</text>')

    # 4. Extend
    lines.append('    <line x1="70" y1="3105" x2="145" y2="3105" class="dep-line"/>')
    lines.append('    <polygon points="160,3105 148,3100 148,3110" class="dep-arrow"/>')
    lines.append('    <text x="180" y="3109" class="t-legend"><tspan font-weight="bold">&lt;&lt;extend&gt;&gt; (Quan hệ Mở rộng có Điều kiện):</tspan> Đăng ký UC-43 ──▷ Đăng nhập UC-42; Báo phát thất bại NDR; Hẹn lại ngày phát; Điều chuyển NV.</text>')

    # 5. Symbols
    lines.append('    <ellipse cx="85" cy="3155" rx="30" ry="16" class="uc-abstract"/>')
    lines.append('    <ellipse cx="160" cy="3155" rx="30" ry="16" class="uc-core"/>')
    lines.append('    <ellipse cx="235" cy="3155" rx="30" ry="16" class="uc"/>')
    lines.append('    <ellipse cx="310" cy="3155" rx="30" ry="16" class="uc-ext"/>')
    lines.append('    <text x="365" y="3160" class="t-legend"><tspan font-weight="bold">Phân loại hình khối:</tspan> [Xám: &lt;&lt;abstract&gt;&gt; Gốc] • [Viền đậm 2.8px: Cốt lõi/Core/Auth Hub] • [Viền 1.4px: Chuẩn] • [Nét đứt: Extended]</text>')
    lines.append('  </g>')
    lines.append('')

    # TRACEABILITY MATRIX
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- TRACEABILITY MATRIX (BOTTOM RIGHT)                       -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Traceability_Matrix">')
    lines.append(f'    <rect x="910" y="2940" width="{width-950}" height="260" class="legend-box"/>')
    lines.append('    <text x="930" y="2968" class="t-note">BẢNG ÁNH XẠ 1:1 TỪ 15 MICROSERVICES &amp; 6 CLIENT APPS — CỔNG BẢO MẬT &amp; 6 PHÂN HỆ USE CASE:</text>')
    lines.append('    <text x="930" y="2996" class="t-legend">• <tspan font-weight="bold">Cổng Xác thực Trung tâm (Auth Gateway - 2 UCs):</tspan> auth-service (3001 - login Opaque token, register) • gateway-bff (3000 - RBAC Guard, PII Sanitizer). Cả 5 roles đều đăng nhập tại UC-42; Khách đăng ký tại UC-43.</text>')
    lines.append('    <text x="930" y="3024" class="t-legend">• <tspan font-weight="bold">Phân hệ 1 (Đơn hàng - 7 UCs):</tspan> shipment-service • pickup-service • pricing-service • gateway-bff. Bắt buộc &lt;&lt;include&gt;&gt; UC-42 (Đăng nhập) để tạo đơn &amp; in nhãn.</text>')
    lines.append('    <text x="930" y="3052" class="t-legend">• <tspan font-weight="bold">Phân hệ 2 (Kho &amp; Vận hành - 11 UCs):</tspan> scan-service • manifest-service • dispatch-service • delivery-service. Bưu tá bắt buộc &lt;&lt;include&gt;&gt; UC-42 để nhận task giao &amp; ký e-POD.</text>')
    lines.append('    <text x="930" y="3080" class="t-legend">• <tspan font-weight="bold">Phân hệ 3 (Sự cố &amp; Khiếu nại - 6 UCs):</tspan> shipment-service (claims &amp; investigations). Bắt buộc &lt;&lt;include&gt;&gt; UC-42 để xác thực chủ đơn nộp bồi thường.</text>')
    lines.append('    <text x="930" y="3108" class="t-legend">• <tspan font-weight="bold">Phân hệ 4 (Tài chính &amp; COD - 6 UCs):</tspan> payment-service (COD, SePay VietQR dynamic QR) • reporting-service. Bắt buộc &lt;&lt;include&gt;&gt; UC-42 lập đối soát COD &amp; quyết toán.</text>')
    lines.append('    <text x="930" y="3136" class="t-legend">• <tspan font-weight="bold">Phân hệ 5 &amp; 6 (Truy vết AI &amp; Quản trị - 21 UCs):</tspan> tracking • chatbot (RAG) • masterdata-service. Phân tách rạch ròi: Public API không cần đăng nhập vs Protected API &lt;&lt;include&gt;&gt; UC-42.</text>')
    lines.append('    <text x="930" y="3164" font-family="Arial" font-size="12" fill="#4B5563">Chuẩn hoá 6 Client Applications: admin-web (:5173) • ops-web (:5175) • merchant-web (:5176) • courier-mobile (:8081) • customer-mobile (:8082) • guest-web (:5174). Không có đường gấp khúc chồng đè.</text>')
    lines.append('  </g>')
    lines.append('')
    lines.append('</svg>')

    return "\n".join(lines)

def main():
    target_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../docs/graduation-thesis/figma-page-1-system-and-data/diagrams/01-use-case-general-system.svg")
    )
    svg_content = generate_svg()
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated successfully: {target_path} ({len(svg_content)} bytes)")

if __name__ == "__main__":
    main()
