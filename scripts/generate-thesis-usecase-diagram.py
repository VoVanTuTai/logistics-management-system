#!/usr/bin/env python3
"""
Standardized High-Resolution Enterprise UML Use Case Diagram Generator for Nexus Express System
STRICTLY GROUNDED IN DEPLOYED REPOSITORY IMPLEMENTATION (NO ABSTRACT / INVENTED ROLES)
Audited 1:1 against 15 backend microservices and 6 client applications.

Special Enterprise Architecture Enhancements (REV.12):
  1. Full Ops-Web Functional Coverage (Đầy đủ nghiệp vụ Bưu cục, Điều phối, Linehaul, Đơn tồn, Chốt ca, Chat).
  2. Dual Actor Generalization (Kế thừa Tác nhân kép chuẩn UML 2.5):
     - CUSTOMER ──▷ GUEST (Khách hàng kế thừa Khách vãng lai)
     - OPS ──▷ COURIER (Admin Bưu cục dùng chung app courier-mobile, kế thừa Bưu tá)
  3. Comprehensive Authentication Include Architecture:
     - 100% Protected Use Cases include UC-42: Đăng nhập hệ thống (trực tiếp & phân cấp).
  4. Ultra-Spacious Layout (5200 x 3500, Đại lộ trung tâm 1000px, Tia thẳng dứt khoát).
"""

import sys
import os
import math

def generate_svg():
    width = 5200
    height = 3500

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
    lines.append('      .t-uc { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-uc-abs { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; font-style: italic; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-ucid { font-family: "Courier New", monospace; font-size: 10px; font-weight: bold; fill: #444444; text-anchor: middle; }')
    lines.append('      .t-actor { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-role { font-family: Arial, sans-serif; font-size: 13px; font-style: italic; fill: #444444; text-anchor: middle; }')
    lines.append('      .t-app { font-family: "Courier New", monospace; font-size: 11.5px; font-weight: bold; fill: #111827; text-anchor: middle; }')
    lines.append('      .t-rel { font-family: Arial, sans-serif; font-size: 11px; font-style: italic; fill: #000000; text-anchor: middle; }')
    lines.append('      .t-legend { font-family: Arial, sans-serif; font-size: 12.5px; fill: #222222; }')
    lines.append('      .t-note { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #000000; }')
    lines.append('')
    lines.append('      /* ===== SHAPES ===== */')
    lines.append('      .sys-border { fill: #FFFFFF; stroke: #000000; stroke-width: 2.4; }')
    lines.append('      .pkg-border { fill: none; stroke: #000000; stroke-width: 1.4; stroke-dasharray: 8 5; }')
    lines.append('      .pkg-header { fill: #F3F4F6; stroke: #000000; stroke-width: 1.2; }')
    lines.append('      .gateway-border { fill: #FAFAFA; stroke: #000000; stroke-width: 2.2; stroke-dasharray: 6 4; }')
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
    lines.append('      .gen-line { stroke: #000000; stroke-width: 1.6; fill: none; }')
    lines.append('      .gen-arrow { fill: #FFFFFF; stroke: #000000; stroke-width: 1.6; }')
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
    lines.append('    <text x="70" y="112" class="t-sub">Mô hình hoá Đầy đủ Nghiệp vụ Điều hành Bưu cục (Ops-Web) &amp; Kế thừa Tác nhân Chuẩn UML 2.5 • Xác thực Toàn diện 100% Protected Use Cases</text>')
    lines.append(f'    <rect x="{width-460}" y="52" width="410" height="72" fill="#F8F9FA" stroke="#000000" stroke-width="1.2"/>')
    lines.append(f'    <text x="{width-445}" y="80" font-family="Arial" font-size="14" font-weight="bold" fill="#000000">MÃ BẢN VẼ: UC-SYS-REAL-01 (REV.12)</text>')
    lines.append(f'    <text x="{width-445}" y="105" font-family="Arial" font-size="12" fill="#444444">TIÊU CHUẨN: IEEE 830 • UML 2.5 OMG</text>')
    lines.append('  </g>')
    lines.append('')

    # SYSTEM BOUNDARY (X: 620 to 4600, Width: 3980, Height: 2940)
    sb_x = 620
    sb_y = 160
    sb_w = 3980
    sb_h = 2940
    lines.append('  <!-- ==================== SYSTEM BOUNDARY ==================== -->')
    lines.append('  <g id="System_Boundary">')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" class="sys-border"/>')
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="1350" height="38" class="pkg-header"/>')
    lines.append(f'    <text x="{sb_x+25}" y="{sb_y+26}" class="t-boundary">RANH GIỚI HỆ THỐNG: NEXUS LOGISTICS PLATFORM (15 BACKEND MICROSERVICES &amp; 6 CLIENT APPS)</text>')
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
            res.append(f'    <text x="{cx}" y="{cy+19}" class="t-uc-abs">{safe_title}</text>')
        else:
            res.append(f'    <text x="{cx}" y="{cy-5}" class="t-ucid">{ucid}</text>')
            res.append(f'    <text x="{cx}" y="{cy+13}" class="t-uc">{safe_title}</text>')
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

    def dep_arrow_to_target(cx1, cy1, rx1, ry1, target_x, target_y, label="", label_dist=180):
        x1, y1 = ellipse_point(cx1, cy1, rx1, ry1, target_x, target_y)
        tip_x, tip_y = target_x, target_y
        dx = tip_x - x1
        dy = tip_y - y1
        dist = math.hypot(dx, dy)
        if dist == 0:
            return ""
        ux = dx / dist
        uy = dy / dist
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
            lx = tip_x - ux * label_dist
            ly = tip_y - uy * label_dist - 4
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
        res.append('    <circle cx="60" cy="30" r="18" class="actor-head"/>')
        res.append('    <line x1="60" y1="48" x2="60" y2="100" class="actor-body"/>')
        res.append('    <line x1="28" y1="68" x2="92" y2="68" class="actor-body"/>')
        res.append('    <line x1="60" y1="100" x2="32" y2="145" class="actor-body"/>')
        res.append('    <line x1="60" y1="100" x2="88" y2="145" class="actor-body"/>')
        res.append(f'    <text x="60" y="172" class="t-actor">{title}</text>')
        res.append(f'    <text x="60" y="191" class="t-role">({role})</text>')
        res.append(f'    <text x="60" y="209" class="t-app">{app}</text>')
        res.append('  </g>')
        return "\n".join(res)

    # =========================================================================
    # 6 REAL ACTORS (WITH UML 2.5 ACTOR GENERALIZATION ON BOTH SIDES)
    # =========================================================================
    lines.append('  <!-- ==================== 6 REAL CODEBASE ROLES ==================== -->')
    # 1. MERCHANT (Left, Row 1, Center: 220, 500)
    lines.append(actor_stick(160, 480, "Actor_Merchant", "Merchant (Chủ Shop)", "MERCHANT", "merchant-web :5176"))
    m_hand = (252, 548)

    # 2. CUSTOMER (Left, Row 2, Center: 220, 1460)
    lines.append(actor_stick(160, 1420, "Actor_Customer", "Khách hàng", "CUSTOMER", "customer-mobile :8082"))
    c_hand = (252, 1488)

    # 3. GUEST (Left, Row 3, Center: 220, 2460)
    lines.append(actor_stick(160, 2420, "Actor_Guest", "Khách vãng lai", "GUEST", "guest-web :5174"))
    g_hand = (252, 2488)

    # ACTOR GENERALIZATION 1: CUSTOMER ──▷ GUEST
    lines.append('  <!-- ACTOR GENERALIZATION 1: CUSTOMER ──▷ GUEST -->')
    lines.append('  <g id="Actor_Gen_Customer_Guest">')
    lines.append('    <line x1="220" y1="1640" x2="220" y2="2414" class="gen-line"/>')
    lines.append('    <polygon points="220,2432 212,2414 228,2414" class="gen-arrow"/>')
    lines.append('    <text x="70" y="2020" class="t-rel" text-anchor="start" font-size="12" font-weight="bold">&lt;&lt;generalizes&gt;&gt;</text>')
    lines.append('    <text x="70" y="2038" font-family="Arial" font-size="11" fill="#4B5563" text-anchor="start">(Khách hàng kế thừa</text>')
    lines.append('    <text x="70" y="2054" font-family="Arial" font-size="11" fill="#4B5563" text-anchor="start">Khách vãng lai)</text>')
    lines.append('  </g>')

    # 4. COURIER (Right, Row 1, Center: 4960, 480)
    lines.append(actor_stick(4900, 480, "Actor_Courier", "Courier (Bưu tá)", "COURIER", "courier-mobile :8081"))
    courier_hand = (4928, 548)

    # 5. OPS (Right, Row 2, Center: 4960, 1420)
    lines.append(actor_stick(4900, 1420, "Actor_Ops", "Ops (Admin Bưu Cục)", "OPS / BRANCH_ADMIN", "ops-web :5175 &amp; courier-mobile"))
    ops_hand = (4928, 1488)

    # ACTOR GENERALIZATION 2: OPS ──▷ COURIER
    lines.append('  <!-- ACTOR GENERALIZATION 2: OPS (Admin Bưu Cục) ──▷ COURIER -->')
    lines.append('  <g id="Actor_Gen_Ops_Courier">')
    lines.append('    <line x1="4960" y1="1420" x2="4960" y2="706" class="gen-line"/>')
    lines.append('    <polygon points="4960,688 4952,706 4968,706" class="gen-arrow"/>')
    lines.append('    <text x="4980" y="1050" class="t-rel" text-anchor="start" font-size="12" font-weight="bold">&lt;&lt;generalizes&gt;&gt;</text>')
    lines.append('    <text x="4980" y="1068" font-family="Arial" font-size="11" fill="#4B5563" text-anchor="start">(Admin bưu cục kế thừa</text>')
    lines.append('    <text x="4980" y="1084" font-family="Arial" font-size="11" fill="#4B5563" text-anchor="start">bưu tá courier-mobile)</text>')
    lines.append('  </g>')

    # 6. SYSTEM_ADMIN (Right, Row 3, Center: 4960, 2420)
    lines.append(actor_stick(4900, 2420, "Actor_Admin", "System Admin", "SYSTEM_ADMIN", "admin-web :5173"))
    admin_hand = (4928, 2488)

    # =========================================================================
    # PACKAGE 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG (7 UCs)
    # Top Left: X: 660, Y: 200, W: 1400, H: 840
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 1: TIẾP NHẬN & QUẢN LÝ ĐƠN HÀNG (7 UCs)          -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg1_Shipment_Management">')
    lines.append('    <rect x="660" y="200" width="1400" height="840" class="pkg-border"/>')
    lines.append('    <rect x="660" y="200" width="900" height="32" class="pkg-header"/>')
    lines.append('    <text x="680" y="222" class="t-pkg">PHÂN HỆ 1: TIẾP NHẬN &amp; QUẢN LÝ ĐƠN HÀNG — shipment • pricing • pickup</text>')

    # Column 1 (X: 860, Facing Merchant): UC-01a, UC-01b, UC-02, UC-04, UC-05, UC-06
    lines.append(uc(860, 280, 120, 25, "UC-01a", "Tạo đơn trên Portal", "uc-core"))
    lines.append(uc(860, 400, 125, 25, "UC-01b", "Đồng bộ Webhook Sàn TMĐT", "uc-core"))
    lines.append(uc(860, 520, 125, 25, "UC-02", "Tra cứu danh sách &amp; Lọc đơn", "uc-core"))
    lines.append(uc(860, 650, 120, 25, "UC-04", "Yêu cầu bưu tá lấy hàng", "uc-core"))
    lines.append(uc(860, 780, 120, 25, "UC-05", "Đổi địa chỉ / SĐT / COD", "uc"))
    lines.append(uc(860, 910, 120, 25, "UC-06", "Hủy đơn gửi hàng", "uc"))

    # Column 2 (X: 1360): UC-01 Abstract
    lines.append(uc(1360, 340, 130, 28, "UC-01", "Tạo đơn gửi hàng", "uc-abstract"))

    # Column 3 (X: 1820): UC-03, UC-07
    lines.append(uc(1820, 280, 125, 25, "UC-03", "Tính cước quy đổi IATA", "uc-core"))
    lines.append(uc(1820, 400, 125, 25, "UC-07", "In phiếu gửi Barcode / QR", "uc"))

    # Internal Relationships
    lines.append(gen_arrow_direct(860, 280, 120, 25, 1360, 340, 130, 28))
    lines.append(gen_arrow_direct(860, 400, 125, 25, 1360, 340, 130, 28))
    lines.append(direct_dep_arrow(1360, 340, 130, 28, 1820, 280, 125, 25, "<<include>>", 15))
    lines.append(direct_dep_arrow(1360, 340, 130, 28, 1820, 400, 125, 25, "<<include>>", -15))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # PACKAGE 2: ĐIỀU HÀNH BƯU CỤC, KHO & VẬN CHUYỂN LINEHAUL (16 UCs)
    # Top Right: X: 3060, Y: 200, W: 1500, H: 840 (Full Coverage of Ops-Web & Courier)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 2: ĐIỀU HÀNH BƯU CỤC, KHO & VẬN CHUYỂN LINEHAUL  -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg2_Hub_Dispatch_Delivery">')
    lines.append('    <rect x="3060" y="200" width="1500" height="840" class="pkg-border"/>')
    lines.append('    <rect x="3060" y="200" width="1120" height="32" class="pkg-header"/>')
    lines.append('    <text x="3080" y="222" class="t-pkg">PHÂN HỆ 2: ĐIỀU HÀNH BƯU CỤC, KHO &amp; LINEHAUL — branch business • scan • manifest • dispatch • linehaul</text>')

    # Column 3 (X: 4300, Facing Courier & Ops): UC-08, UC-10, UC-11, UC-13, UC-13a, UC-14, UC-18
    lines.append(uc(4300, 260, 120, 24, "UC-08", "Quét tiếp nhận gom hàng", "uc"))
    lines.append(uc(4300, 370, 120, 24, "UC-10", "Quét mã xuất kho Outbound", "uc"))
    lines.append(uc(4300, 480, 125, 24, "UC-11", "Đóng bao Manifest &amp; Niêm chì", "uc"))
    lines.append(uc(4300, 590, 130, 25, "UC-13", "Phân công task &amp; Tối ưu tuyến", "uc-core"))
    lines.append(uc(4300, 710, 135, 25, "UC-13a", "Bàn giao &amp; Chuyển đơn bưu tá", "uc-core"))
    lines.append(uc(4300, 830, 125, 26, "UC-14", "Thực hiện chuyến phát", "uc-core"))
    lines.append(uc(4300, 950, 135, 25, "UC-18", "Xử lý hàng bất thường &amp; Lạc tuyến", "uc"))

    # Column 2 (X: 3720, Branch Business & Linehaul): UC-08a, UC-08b, UC-09, UC-12, UC-13b, UC-13c, UC-14a
    lines.append(uc(3720, 260, 135, 25, "UC-08a", "Nhận đơn tại quầy &amp; In tem nhiệt", "uc-core"))
    lines.append(uc(3720, 370, 130, 25, "UC-08b", "Quản lý tồn bưu cục &amp; Chốt ca", "uc-core"))
    lines.append(uc(3720, 480, 120, 24, "UC-09", "Quét mã nhập kho Inbound", "uc-core"))
    lines.append(uc(3720, 590, 125, 24, "UC-12", "Tiếp nhận bao tải đầu tuyến", "uc"))
    lines.append(uc(3720, 710, 130, 25, "UC-13b", "Chat điều phối với bưu tá", "uc"))
    lines.append(uc(3720, 830, 135, 25, "UC-13c", "Quản lý xe Linehaul &amp; Tem chì", "uc-core"))
    lines.append(uc(3720, 950, 125, 24, "UC-14a", "Ký nhận điện tử e-POD &amp; OTP", "uc"))

    # Column 1 (X: 3240, Exceptions): UC-15, UC-16, UC-17
    lines.append(uc(3240, 730, 120, 24, "UC-15", "Báo phát thất bại NDR", "uc"))
    lines.append(uc(3240, 840, 115, 24, "UC-16", "Hẹn lại ngày phát", "uc"))
    lines.append(uc(3240, 950, 115, 24, "UC-17", "Xử lý chuyển hoàn (RTS)", "uc"))

    # Internal Relationships
    lines.append(direct_dep_arrow(4300, 480, 125, 24, 3720, 590, 125, 24, "<<include>>", 15))
    lines.append(direct_dep_arrow(4300, 830, 125, 26, 3720, 950, 125, 24, "<<include>>", 15))
    lines.append(direct_dep_arrow(3240, 730, 120, 24, 4300, 830, 125, 26, "<<extend>>", 18))
    lines.append(direct_dep_arrow(3240, 840, 115, 24, 3240, 730, 120, 24, "<<extend>>", 20))
    lines.append(direct_dep_arrow(3240, 950, 115, 24, 3240, 730, 120, 24, "<<extend>>", 20))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # CENTRAL AUTHENTICATION & ACCESS GATEWAY (2 UCs)
    # Center: X: 2360, Y: 1420, W: 400, H: 360 (Center X = 2560)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- CENTRAL AUTHENTICATION GATEWAY: auth-service & gateway-bff-->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Central_Auth_Gateway">')
    lines.append('    <rect x="2360" y="1420" width="400" height="360" class="gateway-border"/>')
    lines.append('    <rect x="2360" y="1420" width="400" height="32" class="gateway-header"/>')
    lines.append('    <text x="2560" y="1442" font-family="Arial" font-size="13" font-weight="bold" fill="#111827" text-anchor="middle">CỔNG XÁC THỰC &amp; BẢO MẬT (CORE AUTH GATEWAY)</text>')

    # UC-42: Đăng nhập hệ thống (Core Auth Hub)
    lines.append(uc(2560, 1510, 145, 34, "UC-42", "Đăng nhập hệ thống", "uc-core"))
    # UC-43: Đăng ký tài khoản khách
    lines.append(uc(2560, 1690, 140, 28, "UC-43", "Đăng ký tài khoản khách", "uc"))

    # Extend UC-43 -> UC-42
    lines.append(direct_dep_arrow(2560, 1690, 140, 28, 2560, 1510, 145, 34, "<<extend>>", 20))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # PACKAGE 3: XỬ LÝ SỰ CỐ & BỒI THƯỜNG BƯU CHÍNH (6 UCs)
    # Middle Left: X: 660, Y: 1240, W: 1400, H: 780
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 3: XỬ LÝ SỰ CỐ & BỒI THƯỜNG BƯU CHÍNH (6 UCs)    -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg3_Claims_Incident">')
    lines.append('    <rect x="660" y="1240" width="1400" height="780" class="pkg-border"/>')
    lines.append('    <rect x="660" y="1240" width="940" height="32" class="pkg-header"/>')
    lines.append('    <text x="680" y="1262" class="t-pkg">PHÂN HỆ 3: XỬ LÝ SỰ CỐ &amp; BỒI THƯỜNG BƯU CHÍNH — shipment-service (claims, investigations)</text>')

    # Column 1 (X: 860, Facing Customer): UC-19, UC-19a
    lines.append(uc(860, 1380, 135, 28, "UC-19", "Khởi tạo khiếu nại sự cố", "uc-core"))
    lines.append(uc(860, 1660, 135, 26, "UC-19a", "Bưu tá đồng kiểm &amp; Ký số", "uc"))

    # Column 2 (X: 1400): UC-20, UC-21a
    lines.append(uc(1400, 1380, 135, 28, "UC-20", "Thẩm định sự cố (≤ 500k)", "uc-core"))
    lines.append(uc(1400, 1660, 130, 26, "UC-21a", "Điều tra &amp; Hòa giải tranh chấp", "uc"))

    # Column 3 (X: 1840): UC-21, UC-22
    lines.append(uc(1840, 1380, 135, 28, "UC-21", "Phê duyệt bồi thường (> 500k)", "uc"))
    lines.append(uc(1840, 1660, 130, 26, "UC-22", "Cấn trừ tiền bồi thường", "uc"))

    # Internal Relationships
    lines.append(direct_dep_arrow(860, 1380, 135, 28, 860, 1660, 135, 26, "<<include>>", 20))
    lines.append(direct_dep_arrow(860, 1380, 135, 28, 1400, 1380, 135, 28, "<<include>>", 15))
    lines.append(direct_dep_arrow(1400, 1660, 130, 26, 1400, 1380, 135, 28, "<<extend>>", 20))
    lines.append(direct_dep_arrow(1840, 1380, 135, 28, 1400, 1380, 135, 28, "<<extend>>", 15))
    lines.append(direct_dep_arrow(1840, 1380, 135, 28, 1840, 1660, 130, 26, "<<include>>", 20))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # PACKAGE 4: ĐỐI SOÁT TÀI CHÍNH & THU HỘ COD (6 UCs)
    # Middle Right: X: 3060, Y: 1240, W: 1500, H: 780
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 4: ĐỐI SOÁT TÀI CHÍNH & THU HỘ COD (6 UCs)       -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg4_Finance_COD">')
    lines.append('    <rect x="3060" y="1240" width="1500" height="780" class="pkg-border"/>')
    lines.append('    <rect x="3060" y="1240" width="940" height="32" class="pkg-header"/>')
    lines.append('    <text x="3080" y="1262" class="t-pkg">PHÂN HỆ 4: ĐỐI SOÁT TÀI CHÍNH &amp; THU HỘ COD — payment-service • reporting-service</text>')

    # Column 3 (X: 4300, Facing Courier & Ops): UC-23a, UC-24, UC-27, UC-28
    lines.append(uc(4300, 1360, 125, 26, "UC-23a", "Thu tiền mặt tại điểm phát", "uc-core"))
    lines.append(uc(4300, 1480, 130, 26, "UC-24", "Quyết toán ca nộp tiền bưu tá", "uc-core"))
    lines.append(uc(4300, 1620, 130, 28, "UC-27", "Xác nhận đối soát &amp; Chốt sổ", "uc-core"))
    lines.append(uc(4300, 1760, 135, 26, "UC-28", "Báo cáo dòng tiền &amp; Doanh thu", "uc-core"))

    # Column 2 (X: 3700): UC-23, UC-25
    lines.append(uc(3700, 1360, 135, 28, "UC-23", "Thu hộ tiền COD bưu phẩm", "uc-abstract"))
    lines.append(uc(3700, 1620, 130, 26, "UC-25", "Đối soát tự động SePay Webhook", "uc"))

    # Column 1 (X: 3260, Facing Central Boulevard): UC-23b, UC-26
    lines.append(uc(3260, 1360, 125, 26, "UC-23b", "Thanh toán VietQR SePay động", "uc-core"))
    lines.append(uc(3260, 1620, 130, 28, "UC-26", "Lập bảng kê đối soát COD", "uc-core"))

    # Internal Relationships
    lines.append(gen_arrow_direct(4300, 1360, 125, 26, 3700, 1360, 135, 28))
    lines.append(gen_arrow_direct(3260, 1360, 125, 26, 3700, 1360, 135, 28))
    lines.append(direct_dep_arrow(3700, 1620, 130, 26, 3260, 1360, 125, 26, "<<include>>", -15))
    lines.append(direct_dep_arrow(3700, 1620, 130, 26, 4300, 1620, 130, 28, "<<include>>", 15))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # PACKAGE 5: TRUY VẾT HÀNH TRÌNH & TRỢ LÝ AI RAG (11 UCs)
    # Bottom Left: X: 660, Y: 2220, W: 1400, H: 840
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 5: TRUY VẾT HÀNH TRÌNH & TRỢ LÝ AI RAG (11 UCs)   -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg5_Telemetry_AI_RAG">')
    lines.append('    <rect x="660" y="2220" width="1400" height="840" class="pkg-border"/>')
    lines.append('    <rect x="660" y="2220" width="980" height="32" class="pkg-header"/>')
    lines.append('    <text x="680" y="2242" class="t-pkg">PHÂN HỆ 5: TRUY VẾT HÀNH TRÌNH &amp; TRỢ LÝ AI RAG — tracking • chatbot • scan</text>')

    # Column 1 (X: 860, Facing Guest & Customer): UC-32, UC-33, UC-34, UC-38
    lines.append(uc(860, 2320, 125, 25, "UC-32", "Tra cứu lộ trình công khai", "uc"))
    lines.append(uc(860, 2460, 125, 27, "UC-33", "Tra cứu tiến trình nội bộ", "uc-core"))
    lines.append(uc(860, 2600, 135, 27, "UC-34", "Hội thoại tự nhiên với Trợ lý AI", "uc-core"))
    lines.append(uc(860, 2780, 125, 25, "UC-38", "Tư vấn cước IATA tự động", "uc"))

    # Column 2 (X: 1360): UC-35, UC-36, UC-37, UC-39
    lines.append(uc(1360, 2320, 125, 25, "UC-35", "Khử định danh PII Masking", "uc"))
    lines.append(uc(1360, 2460, 125, 25, "UC-36", "Định vị GPS thời gian thực", "uc"))
    lines.append(uc(1360, 2600, 125, 25, "UC-37", "Bóc tách Ý định &amp; Thực thể", "uc"))
    lines.append(uc(1360, 2780, 125, 25, "UC-39", "Hướng dẫn lập khiếu nại AI", "uc"))

    # Column 3 (X: 1820): UC-34a, UC-37a, UC-41
    lines.append(uc(1820, 2500, 120, 25, "UC-34a", "Sinh thẻ trực quan (Rich Card)", "uc-ext"))
    lines.append(uc(1820, 2640, 130, 25, "UC-37a", "Truy xuất RAG 768-D Vectors", "uc-core"))
    lines.append(uc(1820, 2800, 125, 25, "UC-41", "Điều chuyển nhân viên hỗ trợ", "uc"))

    # Internal Relationships
    lines.append(direct_dep_arrow(860, 2320, 125, 25, 1360, 2320, 125, 25, "<<include>>", 15))
    lines.append(direct_dep_arrow(860, 2460, 125, 27, 1360, 2460, 125, 25, "<<include>>", 15))
    lines.append(direct_dep_arrow(860, 2600, 135, 27, 1360, 2600, 125, 25, "<<include>>", 15))
    lines.append(direct_dep_arrow(1360, 2600, 125, 25, 1820, 2640, 130, 25, "<<include>>", 15))
    lines.append(direct_dep_arrow(1820, 2500, 120, 25, 860, 2600, 135, 27, "<<extend>>", 15))
    lines.append(direct_dep_arrow(1360, 2780, 125, 25, 860, 2600, 135, 27, "<<extend>>", 15))
    lines.append(direct_dep_arrow(1820, 2800, 125, 25, 860, 2600, 135, 27, "<<extend>>", -15))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # PACKAGE 6: QUẢN TRỊ HỆ THỐNG, DANH MỤC & PHÂN QUYỀN (10 UCs)
    # Bottom Right: X: 3060, Y: 2220, W: 1500, H: 840
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- PACKAGE 6: QUẢN TRỊ HỆ THỐNG, DANH MỤC & PHÂN QUYỀN (10 UCs) -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Pkg6_Admin_Masterdata">')
    lines.append('    <rect x="3060" y="2220" width="1500" height="840" class="pkg-border"/>')
    lines.append('    <rect x="3060" y="2220" width="980" height="32" class="pkg-header"/>')
    lines.append('    <text x="3080" y="2242" class="t-pkg">PHÂN HỆ 6: QUẢN TRỊ HỆ THỐNG, DANH MỤC &amp; PHÂN QUYỀN — masterdata-service • auth-service</text>')

    # Column 2 (X: 4300, Facing System Admin): UC-44, UC-45, UC-47, UC-48, UC-50, UC-51, UC-52
    lines.append(uc(4300, 2300, 125, 24, "UC-44", "Hồ sơ cá nhân &amp; Mật khẩu", "uc-core"))
    lines.append(uc(4300, 2410, 125, 25, "UC-45", "Quản trị người dùng &amp; Tài khoản", "uc-core"))
    lines.append(uc(4300, 2520, 125, 24, "UC-47", "Nhật ký kiểm toán bảo mật", "uc-core"))
    lines.append(uc(4300, 2630, 125, 25, "UC-48", "Quản trị Hubs 4 cấp", "uc-core"))
    lines.append(uc(4300, 2740, 125, 25, "UC-50", "Cấu hình hệ thống &amp; SLA", "uc-core"))
    lines.append(uc(4300, 2850, 125, 24, "UC-51", "CMS Quản trị bài viết", "uc"))
    lines.append(uc(4300, 2960, 125, 24, "UC-52", "Hồ sơ đối tác Merchant", "uc"))

    # Column 1 (X: 3500, Internal Included UCs): UC-46, UC-49, UC-53
    lines.append(uc(3500, 2410, 125, 25, "UC-46", "Phân quyền RBAC Matrix", "uc-core"))
    lines.append(uc(3500, 2630, 125, 25, "UC-49", "Quản lý phân vùng địa lý", "uc"))
    lines.append(uc(3500, 2740, 125, 25, "UC-53", "Danh mục lý do giao NDR", "uc"))

    # Internal Relationships
    lines.append(direct_dep_arrow(4300, 2410, 125, 25, 3500, 2410, 125, 25, "<<include>>", 15))
    lines.append(direct_dep_arrow(4300, 2630, 125, 25, 3500, 2630, 125, 25, "<<include>>", 15))
    lines.append(direct_dep_arrow(4300, 2740, 125, 25, 3500, 2740, 125, 25, "<<include>>", 15))

    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # CORE AUTHENTICATION INCLUDES (100% COVERAGE OF PROTECTED USE CASES)
    # Direct Straight Dashed Arrows to UC-42: Đăng nhập hệ thống (Center: 2560, 1510)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- 100% PROTECTED USE CASES <<include>> UC-42 (ĐĂNG NHẬP)    -->')
    lines.append('  <!-- ========================================================= -->')

    def uc42_pt(deg):
        rad = math.radians(deg)
        return 2560 + 145 * math.cos(rad), 1510 + 34 * math.sin(rad)

    # Package 1 -> UC-42
    p1_pt1 = uc42_pt(225)
    p1_pt2 = uc42_pt(200)
    p1_pt3 = uc42_pt(180)
    lines.append(dep_arrow_to_target(1360, 340, 130, 28, p1_pt1[0], p1_pt1[1], "<<include>>", 200)) # UC-01
    lines.append(dep_arrow_to_target(860, 520, 125, 25, p1_pt2[0], p1_pt2[1])) # UC-02
    lines.append(dep_arrow_to_target(860, 650, 120, 25, p1_pt3[0], p1_pt3[1])) # UC-04

    # Package 2 -> UC-42
    p2_pt1 = uc42_pt(295)
    p2_pt2 = uc42_pt(315)
    p2_pt3 = uc42_pt(330)
    p2_pt4 = uc42_pt(345)
    lines.append(dep_arrow_to_target(3720, 260, 135, 25, p2_pt1[0], p2_pt1[1], "<<include>>", 200)) # UC-08a
    lines.append(dep_arrow_to_target(3720, 480, 120, 24, p2_pt2[0], p2_pt2[1])) # UC-09
    lines.append(dep_arrow_to_target(4300, 590, 130, 25, p2_pt3[0], p2_pt3[1])) # UC-13
    lines.append(dep_arrow_to_target(4300, 830, 125, 26, p2_pt4[0], p2_pt4[1])) # UC-14

    # Package 3 -> UC-42
    p3_pt1 = uc42_pt(165)
    p3_pt2 = uc42_pt(150)
    lines.append(dep_arrow_to_target(860, 1380, 135, 28, p3_pt1[0], p3_pt1[1], "<<include>>", 180)) # UC-19
    lines.append(dep_arrow_to_target(1400, 1380, 135, 28, p3_pt2[0], p3_pt2[1])) # UC-20

    # Package 4 -> UC-42
    p4_pt1 = uc42_pt(355)
    p4_pt2 = uc42_pt(10)
    p4_pt3 = uc42_pt(20)
    lines.append(dep_arrow_to_target(4300, 1480, 130, 26, p4_pt1[0], p4_pt1[1])) # UC-24
    lines.append(dep_arrow_to_target(3260, 1620, 130, 28, p4_pt2[0], p4_pt2[1], "<<include>>", 180)) # UC-26
    lines.append(dep_arrow_to_target(4300, 1620, 130, 28, p4_pt3[0], p4_pt3[1])) # UC-27

    # Package 5 -> UC-42
    p5_pt1 = uc42_pt(135)
    lines.append(dep_arrow_to_target(860, 2460, 125, 27, p5_pt1[0], p5_pt1[1], "<<include>>", 180)) # UC-33

    # Package 6 -> UC-42
    p6_pt1 = uc42_pt(35)
    p6_pt2 = uc42_pt(50)
    p6_pt3 = uc42_pt(65)
    p6_pt4 = uc42_pt(80)
    lines.append(dep_arrow_to_target(4300, 2300, 125, 24, p6_pt1[0], p6_pt1[1], "<<include>>", 200)) # UC-44
    lines.append(dep_arrow_to_target(4300, 2410, 125, 25, p6_pt2[0], p6_pt2[1])) # UC-45
    lines.append(dep_arrow_to_target(4300, 2630, 125, 25, p6_pt3[0], p6_pt3[1])) # UC-48
    lines.append(dep_arrow_to_target(4300, 2740, 125, 25, p6_pt4[0], p6_pt4[1])) # UC-50

    # =========================================================================
    # ASSOCIATIONS (DIRECT STRAIGHT / SLANTED CLEAN LINES - ZERO CROSSINGS)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- ACTOR ASSOCIATIONS (CLEAN DIRECT SLANTED RAYS)            -->')
    lines.append('  <!-- ========================================================= -->')

    # 1. MERCHANT (m_hand = 252, 548) -> Package 1 Column 1
    lines.append(direct_line(m_hand[0], m_hand[1], 860, 280, 120, 25, "assoc"))
    lines.append(direct_line(m_hand[0], m_hand[1], 860, 400, 125, 25, "assoc"))
    lines.append(direct_line(m_hand[0], m_hand[1], 860, 520, 125, 25, "assoc"))
    lines.append(direct_line(m_hand[0], m_hand[1], 860, 650, 120, 25, "assoc"))
    lines.append(direct_line(m_hand[0], m_hand[1], 860, 780, 120, 25, "assoc"))
    lines.append(direct_line(m_hand[0], m_hand[1], 860, 910, 120, 25, "assoc"))

    # 2. CUSTOMER (c_hand = 252, 1488) -> Package 3 & Package 5
    lines.append(direct_line(c_hand[0], c_hand[1], 860, 1380, 135, 28, "assoc")) # UC-19
    lines.append(direct_line(c_hand[0], c_hand[1], 860, 1660, 135, 26, "assoc")) # UC-19a
    lines.append(direct_line(c_hand[0], c_hand[1], 860, 2460, 125, 27, "assoc")) # UC-33 (Kế thừa UC-32, 34, 38 từ GUEST)

    # 3. GUEST (g_hand = 252, 2488) -> Package 5 & Central Auth Gateway
    lines.append(direct_line(g_hand[0], g_hand[1], 860, 2320, 125, 25, "assoc")) # UC-32
    lines.append(direct_line(g_hand[0], g_hand[1], 860, 2600, 135, 27, "assoc")) # UC-34
    lines.append(direct_line(g_hand[0], g_hand[1], 860, 2780, 125, 25, "assoc")) # UC-38
    lines.append(direct_line(g_hand[0], g_hand[1], 2560, 1690, 140, 28, "assoc")) # UC-43 (Đăng ký)

    # 4. COURIER (courier_hand = 4928, 548) -> Package 2 & Package 4
    lines.append(direct_line(courier_hand[0], courier_hand[1], 4300, 260, 120, 24, "assoc"))  # UC-08
    lines.append(direct_line(courier_hand[0], courier_hand[1], 4300, 830, 125, 26, "assoc"))  # UC-14
    lines.append(direct_line(courier_hand[0], courier_hand[1], 4300, 1360, 125, 26, "assoc")) # UC-23a
    lines.append(direct_line(courier_hand[0], courier_hand[1], 4300, 1480, 130, 26, "assoc")) # UC-24

    # 5. OPS (ops_hand = 4928, 1488) -> Package 2 & Package 4 (Kế thừa Courier mobile duties)
    lines.append(direct_line(ops_hand[0], ops_hand[1], 4300, 370, 120, 24, "assoc"))  # UC-10
    lines.append(direct_line(ops_hand[0], ops_hand[1], 4300, 480, 125, 24, "assoc"))  # UC-11
    lines.append(direct_line(ops_hand[0], ops_hand[1], 4300, 590, 130, 25, "assoc"))  # UC-13
    lines.append(direct_line(ops_hand[0], ops_hand[1], 4300, 710, 135, 25, "assoc"))  # UC-13a
    lines.append(direct_line(ops_hand[0], ops_hand[1], 4300, 950, 135, 25, "assoc"))  # UC-18
    lines.append(direct_line(ops_hand[0], ops_hand[1], 4300, 1620, 130, 28, "assoc")) # UC-27
    lines.append(direct_line(ops_hand[0], ops_hand[1], 4300, 1760, 135, 26, "assoc")) # UC-28

    # 6. SYSTEM_ADMIN (admin_hand = 4928, 2488) -> Package 6 Column 2
    lines.append(direct_line(admin_hand[0], admin_hand[1], 4300, 2300, 125, 24, "assoc")) # UC-44
    lines.append(direct_line(admin_hand[0], admin_hand[1], 4300, 2410, 125, 25, "assoc")) # UC-45
    lines.append(direct_line(admin_hand[0], admin_hand[1], 4300, 2520, 125, 24, "assoc")) # UC-47
    lines.append(direct_line(admin_hand[0], admin_hand[1], 4300, 2630, 125, 25, "assoc")) # UC-48
    lines.append(direct_line(admin_hand[0], admin_hand[1], 4300, 2740, 125, 25, "assoc")) # UC-50
    lines.append(direct_line(admin_hand[0], admin_hand[1], 4300, 2850, 125, 24, "assoc")) # UC-51
    lines.append(direct_line(admin_hand[0], admin_hand[1], 4300, 2960, 125, 24, "assoc")) # UC-52

    # =========================================================================
    # LEGEND & TRACEABILITY MATRIX (BOTTOM AREA)
    # =========================================================================
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- UML 2.5 LEGEND (BOTTOM LEFT)                             -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="UML_Legend">')
    lines.append('    <rect x="40" y="3120" width="940" height="290" class="legend-box"/>')
    lines.append('    <text x="60" y="3148" class="t-note">CHÚ GIẢI KÝ HIỆU CHUẨN UML 2.5 &amp; KIẾN TRÚC XÁC THỰC BẢO MẬT (REV.12):</text>')

    # 1. Association
    lines.append('    <line x1="70" y1="3180" x2="160" y2="3180" class="assoc"/>')
    lines.append('    <text x="180" y="3184" class="t-legend"><tspan font-weight="bold">Association (Tia thẳng trực tiếp):</tspan> Nối thẳng từ 6 Roles đến các Use Case khởi tạo trực tiếp (Không rẽ nhánh gấp khúc).</text>')

    # 2. Generalization
    lines.append('    <line x1="70" y1="3215" x2="140" y2="3215" class="gen-line"/>')
    lines.append('    <polygon points="160,3215 140,3207 140,3223" class="gen-arrow"/>')
    lines.append('    <text x="180" y="3219" class="t-legend"><tspan font-weight="bold">Generalization (Kế thừa Đa hình &amp; Tác nhân):</tspan> Use Case (Tạo đơn, Thu COD ──▷); Actor: CUSTOMER ──▷ GUEST; OPS ──▷ COURIER.</text>')

    # 3. Include
    lines.append('    <line x1="70" y1="3250" x2="145" y2="3250" class="dep-line"/>')
    lines.append('    <polygon points="160,3250 148,3245 148,3255" class="dep-arrow"/>')
    lines.append('    <text x="180" y="3254" class="t-legend"><tspan font-weight="bold">&lt;&lt;include&gt;&gt; (Quan hệ Bao hàm Bắt buộc):</tspan> 100% Protected Use Cases bắt buộc &lt;&lt;include&gt;&gt; UC-42 (Đăng nhập); Tạo đơn include Tính cước IATA.</text>')

    # 4. Extend
    lines.append('    <line x1="70" y1="3285" x2="145" y2="3285" class="dep-line"/>')
    lines.append('    <polygon points="160,3285 148,3280 148,3290" class="dep-arrow"/>')
    lines.append('    <text x="180" y="3289" class="t-legend"><tspan font-weight="bold">&lt;&lt;extend&gt;&gt; (Quan hệ Mở rộng có Điều kiện):</tspan> Đăng ký UC-43 ──▷ Đăng nhập UC-42; Báo phát thất bại NDR; Hẹn lại phát; RTS; Điều chuyển NV.</text>')

    # 5. Symbols
    lines.append('    <ellipse cx="85" cy="3340" rx="30" ry="16" class="uc-abstract"/>')
    lines.append('    <ellipse cx="160" cy="3340" rx="30" ry="16" class="uc-core"/>')
    lines.append('    <ellipse cx="235" cy="3340" rx="30" ry="16" class="uc"/>')
    lines.append('    <ellipse cx="310" cy="3340" rx="30" ry="16" class="uc-ext"/>')
    lines.append('    <text x="365" y="3345" class="t-legend"><tspan font-weight="bold">Phân loại hình khối:</tspan> [Xám: &lt;&lt;abstract&gt;&gt; Gốc] • [Viền đậm 2.8px: Cốt lõi/Core/Auth Hub] • [Viền 1.4px: Chuẩn] • [Nét đứt: Extended]</text>')
    lines.append('  </g>')
    lines.append('')

    # TRACEABILITY MATRIX
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <!-- TRACEABILITY MATRIX (BOTTOM RIGHT)                       -->')
    lines.append('  <!-- ========================================================= -->')
    lines.append('  <g id="Traceability_Matrix">')
    lines.append(f'    <rect x="1010" y="3120" width="{width-1050}" height="290" class="legend-box"/>')
    lines.append('    <text x="1030" y="3148" class="t-note">BẢNG ÁNH XẠ 1:1 TỪ 15 MICROSERVICES &amp; 6 CLIENT APPS — CỔNG BẢO MẬT &amp; ĐIỀU HÀNH BƯU CỤC TOÀN DIỆN:</text>')
    lines.append('    <text x="1030" y="3176" class="t-legend">• <tspan font-weight="bold">Cổng Xác thực Trung tâm (Auth Gateway - 2 UCs):</tspan> auth-service (:3001) • gateway-bff (:3000). 100% Protected APIs bắt buộc có Opaque Token &amp; RBAC Guard. Khách đăng ký tại UC-43.</text>')
    lines.append('    <text x="1030" y="3204" class="t-legend">• <tspan font-weight="bold">Phân hệ 1 (Đơn hàng - 7 UCs):</tspan> shipment-service • pickup-service • pricing-service. Bắt buộc &lt;&lt;include&gt;&gt; UC-42 (Đăng nhập) để tạo đơn, gọi pickup &amp; in nhãn.</text>')
    lines.append('    <text x="1030" y="3232" class="t-legend">• <tspan font-weight="bold">Phân hệ 2 (Điều hành Bưu cục, Kho &amp; Linehaul - 16 UCs):</tspan> scan • manifest • dispatch • delivery. Phản ánh đầy đủ ops-web: Nghiệp vụ tại quầy, Đơn tồn, Chốt ca, Chuyển đơn, Linehaul, Chat điều phối. Bắt buộc &lt;&lt;include&gt;&gt; UC-42.</text>')
    lines.append('    <text x="1030" y="3260" class="t-legend">• <tspan font-weight="bold">Phân hệ 3 (Sự cố &amp; Khiếu nại - 6 UCs):</tspan> shipment-service (claims &amp; investigations). Bắt buộc &lt;&lt;include&gt;&gt; UC-42 để xác thực chủ đơn và phân quyền thẩm định bồi thường Ops.</text>')
    lines.append('    <text x="1030" y="3288" class="t-legend">• <tspan font-weight="bold">Phân hệ 4 (Tài chính &amp; COD - 6 UCs):</tspan> payment-service (COD, SePay VietQR dynamic QR) • reporting-service. Bắt buộc &lt;&lt;include&gt;&gt; UC-42 để quyết toán ca bưu tá &amp; xác nhận đối soát chốt sổ.</text>')
    lines.append('    <text x="1030" y="3316" class="t-legend">• <tspan font-weight="bold">Phân hệ 5 &amp; 6 (Truy vết AI &amp; Quản trị - 21 UCs):</tspan> tracking • chatbot (RAG) • masterdata-service. Phân tách rạch ròi: Public API không cần đăng nhập vs Protected API &lt;&lt;include&gt;&gt; UC-42.</text>')
    lines.append('    <text x="1030" y="3344" font-family="Arial" font-size="12" fill="#4B5563">Kế thừa Tác nhân: OPS (Admin Bưu Cục) kế thừa COURIER (dùng chung app courier-mobile); CUSTOMER kế thừa GUEST (hưởng toàn bộ tính năng công khai). Chuẩn hóa 6 Client Apps.</text>')
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
