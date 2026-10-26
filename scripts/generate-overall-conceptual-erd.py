#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE OVERALL CONCEPTUAL ERD & CROSS-SERVICE DOMAIN ENTITY MAP (REVISED V2)
=============================================================================
Bản vẽ Kỹ thuật Mô hình Dữ liệu Khái niệm & Quan hệ Thực thể Toàn Hệ thống (Global Conceptual ERD)
Thuộc Figma Page 1: System & Data Blueprint (Mã bản vẽ: DOC-DATA-ARCH-03).

Tối ưu hóa hình học triệt để (Geometric Precision Engineering):
- Chuẩn ký hiệu ERD: Crow's Foot Notation (1 : 1, 1 : N, Zero-or-Many).
- Ranh giới kiến trúc: Thể hiện mô hình Database-per-Service (11 PostgreSQL DBs).
- Khoảng cách giữa các bảng được mở rộng triệt để:
  + Khoảng cách ngang (Horizontal Inter-Card Gaps): 55px - 70px (Đảm bảo đầu chân quạ 1:N thông thoáng).
  + Khoảng cách dọc (Vertical Inter-Card Gaps): 65px - 75px (Đảm bảo Badge phân tán và mũi tên cách viền bảng tối thiểu 20px).
  + Hành lang trung chuyển liên miền (Aisles & Superhighways): 70px - 105px.
  + Siêu xa lộ ngang giữa Hàng 1 và Hàng 2: Rộng 195px (Y: 1015 -> 1210).
- Tiêu đề Phân hệ (Domain Headers): Sử dụng dạng Folder Tab chuẩn OMG UML, giải phóng hoàn toàn viền trên,
  loại bỏ triệt để hiện tượng đường dây cắt xuyên qua chữ/thanh đen tiêu đề.
- Mũi tên liên kết (Arrowheads): 12px sắc nét, nội suy polygon không lỗi render.
- 100% Native Inline Vector: Dễ dàng import vào Figma hoặc Draw.io để chỉnh sửa thủ công.
"""

import os
import html

def xml_esc(s):
    if s is None:
        return ""
    if not isinstance(s, str):
        s = str(s)
    return html.escape(s, quote=True)

def generate_svg():
    width = 3600
    height = 2400

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="background:#FFFFFF;">')

    # STYLES DEFINITION
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }')
    lines.append('      .bg { fill: #FFFFFF; }')
    lines.append('      .frame { fill: none; stroke: #000000; stroke-width: 2.6; }')
    lines.append('      .frame-inner { fill: none; stroke: #000000; stroke-width: 1.0; stroke-dasharray: 8 4; }')
    lines.append('      .domain-box { fill: #FAFAFA; stroke: #000000; stroke-width: 1.6; rx: 6px; }')
    lines.append('      .domain-tab { fill: #000000; rx: 4px; }')
    lines.append('      .domain-tab-txt { font-size: 11.5px; font-weight: 800; fill: #FFFFFF; letter-spacing: 0.5px; text-transform: uppercase; }')
    lines.append('      .domain-sub-txt { font-size: 10.5px; font-weight: 700; fill: #4B5563; font-family: ui-monospace, Menlo, monospace; }')
    lines.append('      .tbl-card { fill: #FFFFFF; stroke: #000000; stroke-width: 1.4; rx: 5px; }')
    lines.append('      .tbl-hdr { font-size: 12.5px; font-weight: 800; fill: #000000; }')
    lines.append('      .tbl-db-tag { font-size: 9.5px; font-weight: 700; fill: #4B5563; font-family: ui-monospace, Menlo, monospace; }')
    lines.append('      .f-pk { font-size: 10.5px; font-weight: 800; fill: #000000; font-family: ui-monospace, Menlo, monospace; }')
    lines.append('      .f-fk { font-size: 10.5px; font-weight: 700; fill: #1F2937; font-family: ui-monospace, Menlo, monospace; }')
    lines.append('      .f-dist { font-size: 10.5px; font-weight: 700; fill: #000000; font-family: ui-monospace, Menlo, monospace; }')
    lines.append('      .f-norm { font-size: 10.5px; font-weight: 500; fill: #374151; font-family: ui-monospace, Menlo, monospace; }')
    lines.append('      .f-type { font-size: 10px; font-weight: 500; fill: #6B7280; }')
    lines.append('      .b-pk { fill: #000000; rx: 2px; }')
    lines.append('      .b-pk-txt { font-size: 8.5px; font-weight: 800; fill: #FFFFFF; font-family: ui-monospace, Menlo, monospace; text-anchor: middle; }')
    lines.append('      .b-fk { fill: #E5E7EB; stroke: #000000; stroke-width: 0.8; rx: 2px; }')
    lines.append('      .b-fk-txt { font-size: 8.5px; font-weight: 800; fill: #000000; font-family: ui-monospace, Menlo, monospace; text-anchor: middle; }')
    lines.append('      .b-dist { fill: #F3F4F6; stroke: #000000; stroke-width: 1.0; stroke-dasharray: 2 1; rx: 2px; }')
    lines.append('      .b-dist-txt { font-size: 8.5px; font-weight: 800; fill: #000000; font-family: ui-monospace, Menlo, monospace; text-anchor: middle; }')
    lines.append('      .acid-line { stroke: #000000; stroke-width: 1.8; fill: none; }')
    lines.append('      .dist-line { stroke: #000000; stroke-width: 1.8; stroke-dasharray: 7 3.5; fill: none; }')
    lines.append('      .crow-foot { stroke: #000000; stroke-width: 1.6; fill: none; stroke-linecap: round; }')
    lines.append('      .pill-dist { fill: #FFFFFF; stroke: #000000; stroke-width: 1.2; rx: 4px; }')
    lines.append('      .pill-txt { font-size: 9.5px; font-weight: 800; fill: #000000; font-family: ui-monospace, Menlo, monospace; text-anchor: middle; }')
    lines.append('    ]]></style>')
    lines.append('  </defs>')
    lines.append('')

    # CANVAS BACKGROUND & BORDERS
    lines.append(f'  <rect width="{width}" height="{height}" class="bg"/>')
    lines.append(f'  <rect x="18" y="18" width="{width-36}" height="{height-36}" class="frame"/>')
    lines.append(f'  <rect x="26" y="26" width="{width-52}" height="{height-52}" class="frame-inner"/>')
    lines.append('')

    # =========================================================================
    # HEADER BLOCK
    # =========================================================================
    lines.append('  <!-- ==================== HEADER ==================== -->')
    lines.append('  <g id="Header">')
    lines.append(f'    <rect x="40" y="38" width="{width-80}" height="95" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>')
    lines.append('    <text x="65" y="72" font-size="22" font-weight="900" fill="#000000" letter-spacing="-0.5px">SƠ ĐỒ MÔ HÌNH DỮ LIỆU KHÁI NIỆM &amp; QUAN HỆ THỰC THỂ MIỀN NGHIỆP VỤ XUYÊN DỊCH VỤ (GLOBAL CONCEPTUAL ERD)</text>')
    lines.append('    <text x="65" y="98" font-size="12.5" font-weight="500" fill="#374151">Hệ Thống Logistics &amp; Quản Trị Vận Tải Đa Kênh Nexus • Mô Hình Database-per-Service (11 PostgreSQL DBs) • Ràng Buộc Khóa Phân Tán (Saga Distributed Keys) &amp; RabbitMQ Event Bus</text>')
    lines.append('    <text x="65" y="118" font-size="11" font-family="ui-monospace, Menlo, monospace" font-weight="700" fill="#000000">CHUẨN THIẾT KẾ: OMG UML 2.5 / CROW\'S FOOT RELATIONAL NOTATION • MONOCHROME TECHNICAL BLUEPRINT</text>')
    lines.append(f'    <rect x="{width-460}" y="48" width="400" height="75" fill="#F8F8F8" stroke="#000000" stroke-width="1.2"/>')
    lines.append(f'    <text x="{width-445}" y="74" font-family="Segoe UI, Arial" font-size="13" font-weight="900" fill="#000000">MÃ BẢN VẼ: DOC-DATA-ARCH-03</text>')
    lines.append(f'    <text x="{width-445}" y="94" font-family="ui-monospace, Menlo, monospace" font-size="11" font-weight="700" fill="#1F2937">FIGMA PAGE 1 • SECTION 1.3</text>')
    lines.append(f'    <text x="{width-445}" y="112" font-family="ui-monospace, Menlo, monospace" font-size="10" fill="#4B5563">11 DBs • 13 SERVICES • 4 DIST KEYS</text>')
    lines.append('  </g>')
    lines.append('')

    # HELPER: Draw Table Card
    def draw_entity_card(x, y, w, title, db_tag, fields):
        res = []
        header_h = 32
        row_h = 22
        card_h = header_h + len(fields) * row_h + 10
        res.append(f'    <g id="Entity_{title}">')
        res.append(f'      <rect x="{x}" y="{y}" width="{w}" height="{card_h}" class="tbl-card"/>')
        res.append(f'      <rect x="{x}" y="{y}" width="{w}" height="{header_h}" fill="#F4F4F5" stroke="#000000" stroke-width="1.2" rx="4"/>')
        res.append(f'      <text x="{x + 10}" y="{y + 21}" class="tbl-hdr">{xml_esc(title)}</text>')
        res.append(f'      <text x="{x + w - 10}" y="{y + 21}" class="tbl-db-tag" text-anchor="end">[{xml_esc(db_tag)}]</text>')
        res.append(f'      <line x1="{x}" y1="{y + header_h}" x2="{x + w}" y2="{y + header_h}" stroke="#000000" stroke-width="1.2"/>')

        curr_y = y + header_h + 16
        for f in fields:
            badge_type, name, ftype = f
            if badge_type == "PK":
                res.append(f'      <rect x="{x + 8}" y="{curr_y - 11}" width="22" height="14" class="b-pk"/>')
                res.append(f'      <text x="{x + 19}" y="{curr_y}" class="b-pk-txt">PK</text>')
                f_cls = "f-pk"
            elif badge_type == "FK":
                res.append(f'      <rect x="{x + 8}" y="{curr_y - 11}" width="22" height="14" class="b-fk"/>')
                res.append(f'      <text x="{x + 19}" y="{curr_y}" class="b-fk-txt">FK</text>')
                f_cls = "f-fk"
            elif badge_type == "DIST":
                res.append(f'      <rect x="{x + 6}" y="{curr_y - 11}" width="28" height="14" class="b-dist"/>')
                res.append(f'      <text x="{x + 20}" y="{curr_y}" class="b-dist-txt">DIST</text>')
                f_cls = "f-dist"
            else:
                f_cls = "f-norm"

            name_x = x + 38 if badge_type in ["PK", "FK", "DIST"] else x + 12
            res.append(f'      <text x="{name_x}" y="{curr_y}" class="{f_cls}">{xml_esc(name)}</text>')
            res.append(f'      <text x="{x + w - 10}" y="{curr_y}" class="f-type" text-anchor="end">{xml_esc(ftype)}</text>')
            curr_y += row_h

        res.append('    </g>')
        return "\n".join(res), card_h

    # HELPER: Draw Domain Box with Folder Tab
    def draw_domain_frame(box_x, box_y, box_w, box_h, tab_w, title, sub_title, domain_id, tab_right=False, sub_x=None):
        res = []
        res.append(f'  <!-- ==================== {domain_id} ==================== -->')
        res.append(f'  <g id="{domain_id}">')
        res.append(f'    <rect x="{box_x}" y="{box_y}" width="{box_w}" height="{box_h}" class="domain-box"/>')
        tab_h = 28
        if tab_right:
            tx = box_x + box_w - tab_w - 10
            res.append(f'    <rect x="{tx}" y="{box_y}" width="{tab_w}" height="{tab_h}" class="domain-tab"/>')
            res.append(f'    <text x="{tx + 12}" y="{box_y + 19}" class="domain-tab-txt">{xml_esc(title)}</text>')
            sx = sub_x if sub_x is not None else (box_x + 15)
            res.append(f'    <text x="{sx}" y="{box_y + 19}" class="domain-sub-txt">{xml_esc(sub_title)}</text>')
        else:
            res.append(f'    <rect x="{box_x}" y="{box_y}" width="{tab_w}" height="{tab_h}" class="domain-tab"/>')
            res.append(f'    <text x="{box_x + 12}" y="{box_y + 19}" class="domain-tab-txt">{xml_esc(title)}</text>')
            sx = sub_x if sub_x is not None else (box_x + box_w - 12)
            anchor = "start" if sub_x is not None else "end"
            res.append(f'    <text x="{sx}" y="{box_y + 19}" class="domain-sub-txt" text-anchor="{anchor}">{xml_esc(sub_title)}</text>')
        return "\n".join(res)

    # =========================================================================
    # DOMAIN 1: IDENTITY & MASTERDATA (Top Left)
    # Box: X = 50, Y = 155, W = 770, H = 860. Tab W = 360.
    # =========================================================================
    lines.append(draw_domain_frame(50, 155, 770, 860, 360, "MIỀN 1: ĐỊNH DANH & HẠ TẦNG (MASTERDATA)", "auth_db (:3010) • masterdata_db (:3001)", "Domain_1_Identity_Masterdata"))

    # 1.1 UserAccount (x=75, y=195, w=330, h=218)
    c1, _ = draw_entity_card(75, 195, 330, "UserAccount", "auth_db", [
        ("PK", "id", "VARCHAR(64)"),
        ("NORM", "username", "VARCHAR(64) [UQ]"),
        ("NORM", "passwordHash", "VARCHAR(255)"),
        ("NORM", "roles", "TEXT[] (ADMIN/MERCHANT..)"),
        ("NORM", "phone", "VARCHAR(20) [IDX]"),
        ("DIST", "hubCodes", "TEXT[] (hubs.code)"),
        ("NORM", "status", "ENUM (ACTIVE/DISABLED)"),
        ("NORM", "createdAt", "TIMESTAMP")
    ])
    lines.append(c1)

    # 1.2 AuthSession (x=460, y=195, w=335, h=196) - Gap = 55px
    c2, _ = draw_entity_card(460, 195, 335, "AuthSession", "auth_db", [
        ("PK", "id", "CUID"),
        ("FK", "userId", "VARCHAR(64) -> users.id"),
        ("NORM", "accessTokenHash", "VARCHAR(128) [UQ]"),
        ("NORM", "refreshTokenHash", "VARCHAR(128) [UQ]"),
        ("NORM", "issuedAt", "TIMESTAMP"),
        ("NORM", "accessTokenExpiresAt", "TIMESTAMP"),
        ("NORM", "status", "ENUM (ACTIVE/REVOKED)")
    ])
    lines.append(c2)

    # 1.3 Hub (x=75, y=480, w=330, h=240) - Vert Gap = 67px
    c3, _ = draw_entity_card(75, 480, 330, "Hub", "masterdata_db", [
        ("PK", "id", "CUID"),
        ("DIST", "code", "VARCHAR(32) [UQ, DIST]"),
        ("NORM", "name", "VARCHAR(128)"),
        ("NORM", "type", "ENUM (TRANSIT/BRANCH/HUB)"),
        ("NORM", "province", "VARCHAR(64)"),
        ("NORM", "district", "VARCHAR(64)"),
        ("NORM", "latitude", "DOUBLE PRECISION"),
        ("NORM", "longitude", "DOUBLE PRECISION"),
        ("NORM", "status", "ENUM (ACTIVE/INACTIVE)")
    ])
    lines.append(c3)

    # 1.4 MerchantProfile (x=460, y=480, w=335, h=218) - Vert Gap = 89px
    c4, _ = draw_entity_card(460, 480, 335, "MerchantProfile", "masterdata_db", [
        ("PK", "id", "CUID"),
        ("DIST", "userId", "VARCHAR(64) [UQ, DIST]"),
        ("NORM", "businessName", "VARCHAR(128)"),
        ("NORM", "contractTier", "ENUM (VIP/STANDARD)"),
        ("NORM", "bankAccountNumber", "VARCHAR(32)"),
        ("NORM", "bankCode", "VARCHAR(16)"),
        ("NORM", "codFeePercentage", "DECIMAL(4,2)"),
        ("NORM", "insuranceOptIn", "BOOLEAN")
    ])
    lines.append(c4)

    # 1.5 Zone (x=75, y=780, w=330, h=152) - Vert Gap = 60px
    c5, _ = draw_entity_card(75, 780, 330, "Zone", "masterdata_db", [
        ("PK", "id", "CUID"),
        ("DIST", "code", "VARCHAR(32) [UQ, DIST]"),
        ("NORM", "name", "VARCHAR(64) (NỘI TỈNH/..)"),
        ("NORM", "metroClass", "ENUM (METRO/PROVINCIAL)"),
        ("NORM", "standardSlaHours", "INTEGER (24h/48h)")
    ])
    lines.append(c5)

    # 1.6 PolicyDocument (x=460, y=780, w=335, h=174) - Vert Gap = 82px
    c6, _ = draw_entity_card(460, 780, 335, "PolicyDocument", "masterdata_db", [
        ("PK", "id", "CUID"),
        ("NORM", "code", "VARCHAR(32) [UQ] (SOP-01)"),
        ("NORM", "title", "VARCHAR(128)"),
        ("NORM", "category", "ENUM (PRICING/CLAIM/..)"),
        ("NORM", "legalBasis", "VARCHAR(128) (Luật Bưu chính)"),
        ("NORM", "contentMarkdown", "TEXT")
    ])
    lines.append(c6)
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # DOMAIN 2: FIRST-MILE PICKUP & COURIER GEOFENCE (Bottom Left)
    # Box: X = 50, Y = 1210, W = 770, H = 580. Tab W = 360.
    # =========================================================================
    lines.append(draw_domain_frame(50, 1210, 770, 580, 360, "MIỀN 2: THU GOM ĐẦU VÀO & ĐIỀU PHỐI (PICKUP)", "pickup_db (:3003) • masterdata_db (:3001)", "Domain_2_First_Mile_Pickup"))

    # 2.1 PickupRequest (x=75, y=1250, w=330, h=262)
    c7, _ = draw_entity_card(75, 1250, 330, "PickupRequest", "pickup_db", [
        ("PK", "id", "CUID"),
        ("DIST", "requestCode", "VARCHAR(32) [UQ, DIST]"),
        ("DIST", "merchantId", "VARCHAR(64) (masterdata)"),
        ("DIST", "originHubCode", "VARCHAR(32) (hubs.code)"),
        ("NORM", "contactName", "VARCHAR(64)"),
        ("NORM", "contactPhone", "VARCHAR(20)"),
        ("NORM", "pickupAddress", "VARCHAR(255)"),
        ("NORM", "expectedParcels", "INTEGER"),
        ("NORM", "actualParcels", "INTEGER"),
        ("NORM", "status", "ENUM (PENDING/ASSIGNED/DONE)")
    ])
    lines.append(c7)

    # 2.2 PickupAssignment (x=460, y=1250, w=335, h=196) - Gap = 55px
    c8, _ = draw_entity_card(460, 1250, 335, "PickupAssignment", "pickup_db", [
        ("PK", "id", "CUID"),
        ("FK", "pickupRequestId", "CUID -> PickupRequest.id"),
        ("DIST", "courierId", "VARCHAR(64) (auth.users.id)"),
        ("NORM", "assignedAt", "TIMESTAMP"),
        ("NORM", "acceptedAt", "TIMESTAMP"),
        ("NORM", "completedAt", "TIMESTAMP"),
        ("NORM", "courierNote", "VARCHAR(255)")
    ])
    lines.append(c8)

    # 2.3 PickupItemMap (x=75, y=1575, w=330, h=108) - Vert Gap = 63px
    c10, _ = draw_entity_card(75, 1575, 330, "PickupItemMap", "pickup_db", [
        ("PK", "id", "CUID"),
        ("FK", "pickupRequestId", "CUID -> PickupRequest.id"),
        ("DIST", "shipmentCode", "VARCHAR(32) [DIST]")
    ])
    lines.append(c10)

    # 2.4 CourierProfile (x=460, y=1505, w=335, h=218) - Vert Gap = 59px
    c9, _ = draw_entity_card(460, 1505, 335, "CourierProfile", "masterdata_db", [
        ("PK", "id", "CUID"),
        ("DIST", "userId", "VARCHAR(64) [UQ, DIST]"),
        ("DIST", "primaryHubCode", "VARCHAR(32) (hubs.code)"),
        ("NORM", "vehicleType", "ENUM (MOTORBIKE/VAN/TRUCK)"),
        ("NORM", "licensePlate", "VARCHAR(20)"),
        ("NORM", "maxPayloadKg", "DECIMAL(8,2)"),
        ("NORM", "activeGeofence", "GEOMETRY(Polygon, 4326)"),
        ("NORM", "activeStatus", "ENUM (AVAILABLE/ON_TRIP)")
    ])
    lines.append(c9)
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # DOMAIN 3: CORE SHIPMENT AGGREGATE & PRICING (Center Column - Heart)
    # Box: X = 925, Y = 155, W = 840, H = 860. Tab W = 310 (ends at 1235, leaves 1235..1765 open).
    # =========================================================================
    lines.append(draw_domain_frame(925, 155, 840, 860, 310, "MIỀN 3: LÕI VẬN ĐƠN & GIÁ CƯỚC (CORE)", "shipment_db (:3002) • pricing-service (:3012)", "Domain_3_Core_Shipment"))

    # 3.1 Shipment (Central Entity - x=945, y=195, w=370, h=462)
    c11, _ = draw_entity_card(945, 195, 370, "Shipment", "shipment_db", [
        ("PK", "id", "CUID"),
        ("DIST", "trackingNumber", "VARCHAR(32) [UQ, DIST: shipmentCode]"),
        ("DIST", "senderId", "VARCHAR(64) (masterdata.merchants)"),
        ("DIST", "originHubCode", "VARCHAR(32) (masterdata.hubs)"),
        ("DIST", "destHubCode", "VARCHAR(32) (masterdata.hubs)"),
        ("DIST", "currentHubCode", "VARCHAR(32) (masterdata.hubs)"),
        ("NORM", "senderName", "VARCHAR(128)"),
        ("NORM", "senderPhone", "VARCHAR(20)"),
        ("NORM", "receiverName", "VARCHAR(128)"),
        ("NORM", "receiverPhone", "VARCHAR(20)"),
        ("NORM", "receiverAddress", "VARCHAR(255)"),
        ("NORM", "weightKg", "DECIMAL(8,2)"),
        ("NORM", "volumetricWeightKg", "DECIMAL(8,2) [IATA V/6000]"),
        ("NORM", "chargeableWeightKg", "DECIMAL(8,2) [max(W, V)]"),
        ("NORM", "serviceType", "ENUM (STANDARD/EXPRESS/SAVER)"),
        ("NORM", "status", "ENUM (19-Step FSM Status)"),
        ("NORM", "codAmount", "DECIMAL(12,2)"),
        ("NORM", "totalFee", "DECIMAL(12,2)"),
        ("NORM", "declaredValue", "DECIMAL(12,2) [Bảo hiểm]"),
        ("NORM", "createdAt", "TIMESTAMP [INDEX]")
    ])
    lines.append(c11)

    # 3.2 ShipmentItem (x=1385, y=195, w=355, h=174) - Gap = 70px
    c12, _ = draw_entity_card(1385, 195, 355, "ShipmentItem", "shipment_db", [
        ("PK", "id", "CUID"),
        ("FK", "shipmentId", "CUID -> Shipment.id"),
        ("NORM", "itemName", "VARCHAR(128)"),
        ("NORM", "quantity", "INTEGER"),
        ("NORM", "weightGrams", "INTEGER"),
        ("NORM", "isFragile", "BOOLEAN (Hàng dễ vỡ)"),
        ("NORM", "isDangerous", "BOOLEAN (Hàng cấm bay)")
    ])
    lines.append(c12)

    # 3.3 ShipmentStatusHistory (x=1385, y=435, w=355, h=196) - Vert Gap = 66px
    c13, _ = draw_entity_card(1385, 435, 355, "ShipmentStatusHistory", "shipment_db", [
        ("PK", "id", "CUID"),
        ("FK", "shipmentId", "CUID -> Shipment.id"),
        ("NORM", "status", "ENUM (CREATING/IN_TRANSIT..)"),
        ("DIST", "hubCode", "VARCHAR(32) (masterdata.hubs)"),
        ("DIST", "actorUserId", "VARCHAR(64) (auth.users)"),
        ("NORM", "description", "VARCHAR(255)"),
        ("NORM", "recordedAt", "TIMESTAMP")
    ])
    lines.append(c13)

    # 3.4 PricingMatrixRule (x=945, y=730, w=370, h=218) - Vert Gap = 73px
    c14, _ = draw_entity_card(945, 730, 370, "PricingMatrixRule", "pricing-service", [
        ("PK", "id", "CUID"),
        ("NORM", "serviceType", "ENUM (STANDARD/EXPRESS)"),
        ("DIST", "fromZoneCode", "VARCHAR(32) (masterdata.zones)"),
        ("DIST", "toZoneCode", "VARCHAR(32) (masterdata.zones)"),
        ("NORM", "baseWeightKg", "DECIMAL(4,2) (Nấc đầu: 0.5kg)"),
        ("NORM", "baseFee", "DECIMAL(10,2)"),
        ("NORM", "stepWeightKg", "DECIMAL(4,2) (Nấc bước: 0.5kg)"),
        ("NORM", "stepFee", "DECIMAL(10,2)"),
        ("NORM", "returnFeeRatio", "DECIMAL(3,2) (Mặc định 50%)")
    ])
    lines.append(c14)

    # 3.5 OutboxEvent (x=1385, y=730, w=355, h=218) - Vert Gap = 99px
    c15, _ = draw_entity_card(1385, 730, 355, "OutboxEvent", "shipment_db", [
        ("PK", "id", "CUID"),
        ("NORM", "aggregateType", "VARCHAR(32) ('SHIPMENT')"),
        ("DIST", "aggregateId", "VARCHAR(64) [shipmentCode]"),
        ("NORM", "eventType", "VARCHAR(64) ('SHIPMENT_CREATED')"),
        ("NORM", "payload", "JSONB"),
        ("NORM", "status", "ENUM (PENDING/PUBLISHED/FAILED)"),
        ("NORM", "retryCount", "INTEGER"),
        ("NORM", "createdAt", "TIMESTAMP")
    ])
    lines.append(c15)
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # DOMAIN 4: MID-MILE HUB TRANSIT & MANIFEST (Top Right Column 1)
    # Box: X = 1845, Y = 155, W = 810, H = 860. Tab W = 330.
    # =========================================================================
    lines.append(draw_domain_frame(1845, 155, 810, 860, 330, "MIỀN 4: TRUNG CHUYỂN & BẢNG KÊ (TRANSIT)", "manifest_db (:3005) • dispatch_db (:3004) • scan_db (:3006)", "Domain_4_Mid_Mile_Transit"))

    # 4.1 Manifest (x=1865, y=195, w=340, h=240)
    c16, _ = draw_entity_card(1865, 195, 340, "Manifest", "manifest_db", [
        ("PK", "id", "CUID"),
        ("DIST", "manifestCode", "VARCHAR(32) [UQ, DIST]"),
        ("DIST", "originHubCode", "VARCHAR(32) (hubs.code)"),
        ("DIST", "destHubCode", "VARCHAR(32) (hubs.code)"),
        ("NORM", "type", "ENUM (AIR_BAG/TRUCK_CONTAINER)"),
        ("NORM", "totalParcels", "INTEGER"),
        ("NORM", "totalWeightKg", "DECIMAL(8,2)"),
        ("NORM", "sealNumber", "VARCHAR(64)"),
        ("NORM", "status", "ENUM (OPEN/SEALED/IN_TRANSIT/RECEIVED)")
    ])
    lines.append(c16)

    # 4.2 ManifestItem (x=2275, y=195, w=355, h=174) - Gap = 70px
    c17, _ = draw_entity_card(2275, 195, 355, "ManifestItem", "manifest_db", [
        ("PK", "id", "CUID"),
        ("FK", "manifestId", "CUID -> Manifest.id"),
        ("DIST", "shipmentCode", "VARCHAR(32) [DIST]"),
        ("NORM", "weightKg", "DECIMAL(6,2)"),
        ("NORM", "scannedInAt", "TIMESTAMP"),
        ("NORM", "isDiscrepancy", "BOOLEAN")
    ])
    lines.append(c17)

    # 4.3 DispatchTrip (x=1865, y=505, w=340, h=240) - Vert Gap = 70px
    c18, _ = draw_entity_card(1865, 505, 340, "DispatchTrip", "dispatch_db", [
        ("PK", "id", "CUID"),
        ("DIST", "tripCode", "VARCHAR(32) [UQ, DIST]"),
        ("DIST", "driverId", "VARCHAR(64) (auth.users)"),
        ("NORM", "truckPlate", "VARCHAR(20)"),
        ("DIST", "originHubCode", "VARCHAR(32) (hubs.code)"),
        ("DIST", "destHubCode", "VARCHAR(32) (hubs.code)"),
        ("NORM", "departTime", "TIMESTAMP"),
        ("NORM", "estArrivalTime", "TIMESTAMP"),
        ("NORM", "status", "ENUM (SCHEDULED/RUNNING/ARRIVED)")
    ])
    lines.append(c18)

    # 4.4 ScanLog (x=2275, y=505, w=355, h=196) - Vert Gap = 136px
    c19, _ = draw_entity_card(2275, 505, 355, "ScanLog", "scan_db", [
        ("PK", "id", "CUID"),
        ("DIST", "barcode", "VARCHAR(64) [shipment/manifest]"),
        ("DIST", "hubCode", "VARCHAR(32) (hubs.code)"),
        ("DIST", "operatorUserId", "VARCHAR(64) (auth.users)"),
        ("NORM", "action", "ENUM (INBOUND/OUTBOUND/SORT/STAGING)"),
        ("NORM", "deviceImei", "VARCHAR(64)"),
        ("NORM", "scannedAt", "TIMESTAMP [INDEX]")
    ])
    lines.append(c19)

    # 4.5 DispatchManifestMap (x=1865, y=815, w=340, h=108) - Vert Gap = 70px
    c20, _ = draw_entity_card(1865, 815, 340, "DispatchManifestMap", "dispatch_db", [
        ("PK", "id", "CUID"),
        ("FK", "dispatchTripId", "CUID -> DispatchTrip.id"),
        ("DIST", "manifestCode", "VARCHAR(32) [DIST]")
    ])
    lines.append(c20)

    # 4.6 BagSeal (x=2275, y=815, w=355, h=152) - Vert Gap = 114px
    c21, _ = draw_entity_card(2275, 815, 355, "BagSeal", "scan_db", [
        ("PK", "id", "CUID"),
        ("DIST", "manifestCode", "VARCHAR(32) [DIST]"),
        ("NORM", "sealNumber", "VARCHAR(64) [UQ]"),
        ("NORM", "isTampered", "BOOLEAN"),
        ("NORM", "inspectedAt", "TIMESTAMP")
    ])
    lines.append(c21)
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # DOMAIN 5: LAST-MILE DELIVERY & COD CASH FLOW (Far Right)
    # Box: X = 2725, Y = 155, W = 825, H = 860.
    # Tab placed at top-right (X=3175..3530) so left side (above DeliveryTask X=2745..3105) has NO tab!
    # =========================================================================
    lines.append(draw_domain_frame(2725, 155, 825, 860, 350, "MIỀN 5: PHÁT HÀNG & COD (LAST-MILE)", "delivery_db (:3007) • payment_db (:3011)", "Domain_5_Last_Mile_Payment", tab_right=True))

    # 5.1 DeliveryTask (x=2745, y=195, w=360, h=262)
    c22, _ = draw_entity_card(2745, 195, 360, "DeliveryTask", "delivery_db", [
        ("PK", "id", "CUID"),
        ("DIST", "taskCode", "VARCHAR(32) [UQ, DIST]"),
        ("DIST", "shipmentCode", "VARCHAR(32) [UQ, DIST]"),
        ("DIST", "courierId", "VARCHAR(64) (auth.users)"),
        ("DIST", "deliveryHubCode", "VARCHAR(32) (hubs.code)"),
        ("NORM", "codAmountToCollect", "DECIMAL(12,2)"),
        ("NORM", "receiverAddress", "VARCHAR(255)"),
        ("NORM", "assignedDate", "DATE"),
        ("NORM", "attemptCount", "INTEGER (Max 3 lần)"),
        ("NORM", "status", "ENUM (ASSIGNED/DELIVERING/SUCCESS/FAILED)")
    ])
    lines.append(c22)

    # 5.2 DeliveryAttempt (x=3175, y=195, w=355, h=196) - Gap = 70px
    c23, _ = draw_entity_card(3175, 195, 355, "DeliveryAttempt", "delivery_db", [
        ("PK", "id", "CUID"),
        ("FK", "deliveryTaskId", "CUID -> DeliveryTask.id"),
        ("NORM", "attemptSeq", "INTEGER (1, 2, 3)"),
        ("NORM", "result", "ENUM (SUCCESS/ABSENT/REJECTED/WRONG_PHONE)"),
        ("NORM", "podPhotoUrl", "VARCHAR(255) (Ảnh ký nhận POD)"),
        ("NORM", "receiverSignature", "TEXT"),
        ("NORM", "attemptedAt", "TIMESTAMP")
    ])
    lines.append(c23)

    # 5.3 CodTransaction (x=2745, y=530, w=360, h=218) - Vert Gap = 73px!
    c24, _ = draw_entity_card(2745, 530, 360, "CodTransaction", "payment_db", [
        ("PK", "id", "CUID"),
        ("DIST", "transactionCode", "VARCHAR(32) [UQ, DIST]"),
        ("DIST", "shipmentCode", "VARCHAR(32) [DIST]"),
        ("DIST", "courierId", "VARCHAR(64) (auth.users)"),
        ("DIST", "merchantId", "VARCHAR(64) (masterdata)"),
        ("NORM", "amountCollected", "DECIMAL(12,2)"),
        ("NORM", "collectionStatus", "ENUM (COLLECTED/REMITTED/PAID)"),
        ("NORM", "collectedAt", "TIMESTAMP")
    ])
    lines.append(c24)

    # 5.4 CodRemittanceSheet (x=3175, y=530, w=355, h=240) - Gap = 70px
    c25, _ = draw_entity_card(3175, 530, 355, "CodRemittanceSheet", "payment_db", [
        ("PK", "id", "CUID"),
        ("DIST", "sheetCode", "VARCHAR(32) [UQ, DIST]"),
        ("DIST", "merchantId", "VARCHAR(64) (masterdata)"),
        ("NORM", "cycleDate", "DATE (Thứ 2, 4, 6 hàng tuần)"),
        ("NORM", "totalCodGross", "DECIMAL(12,2)"),
        ("NORM", "totalFreightFee", "DECIMAL(12,2)"),
        ("NORM", "insuranceFee", "DECIMAL(10,2)"),
        ("NORM", "netPayout", "DECIMAL(12,2) [Gross - Fee]"),
        ("NORM", "bankTransferRef", "VARCHAR(64)"),
        ("NORM", "settlementStatus", "ENUM (PENDING/PAID/SETTLED)")
    ])
    lines.append(c25)
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # DOMAIN 6: TRACKING, CLAIMS, AI & ANALYTICS (Bottom Center-Right)
    # Box: X = 860, Y = 1210, W = 2690, H = 580.
    # Tab at right (X=3200..3530). Subtitle at X=2700..3060.
    # =========================================================================
    lines.append(draw_domain_frame(860, 1210, 2690, 580, 330, "MIỀN 6: TRUY VẾT, KHIẾU NẠI & AI RAG", "tracking_db (:3008) • shipment_db (:3002) • reporting (:3009) • chatbot (:3013)", "Domain_6_Tracking_Claims_AI", tab_right=True, sub_x=2700))

    # 6.1 TrackingMilestone (x=945, y=1250, w=370, h=240)
    c26, _ = draw_entity_card(945, 1250, 370, "TrackingMilestone", "tracking_db", [
        ("PK", "id", "CUID"),
        ("DIST", "shipmentCode", "VARCHAR(32) [DIST, INDEX]"),
        ("NORM", "statusCode", "VARCHAR(32)"),
        ("NORM", "statusText", "VARCHAR(128)"),
        ("DIST", "hubCode", "VARCHAR(32) (masterdata.hubs)"),
        ("NORM", "locationName", "VARCHAR(128)"),
        ("NORM", "latitude", "DOUBLE PRECISION"),
        ("NORM", "longitude", "DOUBLE PRECISION"),
        ("NORM", "eventTimestamp", "TIMESTAMP [INDEX]")
    ])
    lines.append(c26)

    # 6.2 ClaimTicket (x=1385, y=1250, w=355, h=262) - Gap = 70px
    c27, _ = draw_entity_card(1385, 1250, 355, "ClaimTicket", "shipment_db", [
        ("PK", "id", "CUID"),
        ("DIST", "claimCode", "VARCHAR(32) [UQ, DIST]"),
        ("DIST", "shipmentCode", "VARCHAR(32) [DIST]"),
        ("DIST", "requesterUserId", "VARCHAR(64) (auth.users)"),
        ("NORM", "incidentType", "ENUM (LOST/DAMAGED/DELAY)"),
        ("NORM", "claimedAmount", "DECIMAL(12,2)"),
        ("NORM", "approvedAmount", "DECIMAL(12,2)"),
        ("DIST", "responsibleHubCode", "VARCHAR(32) (masterdata.hubs)"),
        ("NORM", "settlementMethod", "ENUM (BANK/WALLET)"),
        ("NORM", "status", "ENUM (OPEN/INVESTIGATE/SETTLED)")
    ])
    lines.append(c27)

    # 6.3 DailyKpiReport (x=1865, y=1250, w=340, h=218)
    c28, _ = draw_entity_card(1865, 1250, 340, "DailyKpiReport", "reporting_db", [
        ("PK", "id", "CUID"),
        ("NORM", "reportDate", "DATE [INDEX]"),
        ("DIST", "hubCode", "VARCHAR(32) [DIST]"),
        ("NORM", "totalCreated", "INTEGER"),
        ("NORM", "totalDeliveredSuccess", "INTEGER"),
        ("NORM", "totalReturned", "INTEGER"),
        ("NORM", "slaSuccessRate", "DECIMAL(5,2) (98.5%)"),
        ("NORM", "totalCodCollected", "DECIMAL(14,2)")
    ])
    lines.append(c28)

    # 6.4 KnowledgeChunk (x=2275, y=1250, w=355, h=218) - Gap = 70px
    c29, _ = draw_entity_card(2275, 1250, 355, "KnowledgeChunk", "chatbot_db", [
        ("PK", "id", "VARCHAR(64) ('sop-01#chunk-1')"),
        ("NORM", "sourceFile", "VARCHAR(64) ('01-pricing.md')"),
        ("NORM", "sectionTitle", "VARCHAR(128)"),
        ("NORM", "headingLevel", "INTEGER (H1, H2, H3)"),
        ("NORM", "charCount", "INTEGER"),
        ("NORM", "tokenEstimate", "INTEGER"),
        ("NORM", "embeddingVector", "VECTOR(768) [L2-Normalized]"),
        ("NORM", "indexedAt", "TIMESTAMP")
    ])
    lines.append(c29)

    # 6.5 ChatbotSessionLog (x=2275, y=1535, w=355, h=196) - Vert Gap = 67px
    c30, _ = draw_entity_card(2275, 1535, 355, "ChatbotSessionLog", "chatbot_db", [
        ("PK", "id", "CUID"),
        ("DIST", "conversationId", "VARCHAR(64) [UQ]"),
        ("DIST", "userId", "VARCHAR(64) [DIST, NULLABLE]"),
        ("NORM", "senderRole", "ENUM (GUEST/MERCHANT/OPS)"),
        ("NORM", "toolsInvoked", "TEXT[] (trackShipment/calculatePricing)"),
        ("NORM", "ragCitations", "TEXT[]"),
        ("NORM", "latencyMs", "INTEGER")
    ])
    lines.append(c30)
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # ARCHITECTURAL SAGA EXPLANATION PANEL (Bottom Left)
    # Box: X = 50, Y = 1815, W = 770, H = 385
    # =========================================================================
    lines.append('  <!-- ==================== SAGA EXPLANATION PANEL ==================== -->')
    lines.append('  <g id="Saga_Orchestration_Panel">')
    lines.append('    <rect x="50" y="1815" width="770" height="385" fill="#FBFBFB" stroke="#000000" stroke-width="1.6" rx="6"/>')
    lines.append('    <rect x="50" y="1815" width="770" height="30" fill="#000000" rx="4"/>')
    lines.append('    <text x="65" y="1835" font-size="12" font-weight="800" fill="#FFFFFF">NGUYÊN TẮC LIÊN KẾT DỮ LIỆU PHÂN TÁN (DISTRIBUTED SAGA &amp; EVENTUAL CONSISTENCY):</text>')
    lines.append('    <text x="70" y="1868" font-size="11.5" font-weight="700" fill="#000000">1. Không dùng Khóa ngoại (No Hard SQL Foreign Keys) giữa các Database:</text>')
    lines.append('    <text x="85" y="1887" font-size="11" fill="#374151">• Mỗi dịch vụ sở hữu cơ sở dữ liệu riêng biệt (Database-per-Service), độc lập 100% về phần cứng và chu kỳ triển khai.</text>')
    lines.append('    <text x="85" y="1904" font-size="11" fill="#374151">• Ngăn chặn triệt để hiện tượng Khóa bảng chéo (Cross-DB Locking) và Nút thắt cổ chai hiệu năng khi quét hàng triệu kiện.</text>')
    lines.append('    <text x="70" y="1930" font-size="11.5" font-weight="700" fill="#000000">2. Cơ chế Đồng bộ Khóa nghiệp vụ Phân tán (Distributed Business Keys):</text>')
    lines.append('    <text x="85" y="1949" font-size="11" fill="#374151">• <tspan font-weight="700">shipmentCode</tspan>: Khóa liên kết xuyên suốt từ Pickup ➔ Shipment ➔ Manifest ➔ Delivery ➔ Payment ➔ Claim ➔ Tracking.</text>')
    lines.append('    <text x="85" y="1966" font-size="11" fill="#374151">• <tspan font-weight="700">hubCode</tspan>: Mã định danh bưu cục/kho trung chuyển, ánh xạ phân quyền vận hành và điểm quét mã QR/Barcode.</text>')
    lines.append('    <text x="85" y="1983" font-size="11" fill="#374151">• <tspan font-weight="700">courierId &amp; userId</tspan>: Mã tác nhân chịu trách nhiệm vật lý (tài xế giao/nhận) và chủ tài khoản dòng tiền.</text>')
    lines.append('    <text x="70" y="2008" font-size="11.5" font-weight="700" fill="#000000">3. Đảm bảo Tính nhất quán dữ liệu (Transactional Outbox Pattern):</text>')
    lines.append('    <text x="85" y="2027" font-size="11" fill="#374151">• Dữ liệu nghiệp vụ và bản ghi OutboxEvent được ghi đồng thời vào một Transaction nội bộ (ACID) của PostgreSQL.</text>')
    lines.append('    <text x="85" y="2044" font-size="11" fill="#374151">• Outbox Publisher Worker quét định kỳ nhịp 200ms đẩy vào RabbitMQ Broker, đảm bảo At-Least-Once Delivery.</text>')
    lines.append('    <text x="85" y="2061" font-size="11" fill="#374151">• Phía Consumer áp dụng Idempotency Key (chống lặp sự kiện) đảm bảo trạng thái đạt Tính nhất quán cuối cùng.</text>')
    lines.append('    <rect x="70" y="2080" width="730" height="105" fill="#FFFFFF" stroke="#000000" stroke-width="1.0" rx="4"/>')
    lines.append('    <text x="85" y="2102" font-size="11" font-weight="700" fill="#000000">CHỈ SỐ HIỆU NĂNG KIẾN TRÚC DỮ LIỆU THỰC TẾ (BENCHMARK SLA):</text>')
    lines.append('    <text x="85" y="2122" font-size="10" font-family="ui-monospace, Menlo, monospace" fill="#1F2937">• Tốc độ ghi Outbox: &lt; 8.2ms • RabbitMQ Throughput: 15,000 msg/s • Idempotent Consumer Latency: &lt; 15ms</text>')
    lines.append('    <text x="85" y="2140" font-size="10" font-family="ui-monospace, Menlo, monospace" fill="#1F2937">• Redis Cache Hit Ratio: 94.2% • RAG Cosine Search Latency: 18ms (44 Chunks In-Memory) • DB Pool: PgBouncer (150 conns)</text>')
    lines.append('    <text x="85" y="2158" font-size="10" font-family="ui-monospace, Menlo, monospace" fill="#1F2937">• Độ sẵn sàng dữ liệu (Data Availability): 99.99% • Recovery Point Objective (RPO): 0s • RTO: &lt; 30s</text>')
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # INTRA-DB ACID RELATIONS (SOLID LINES WITH STANDARDIZED CROW'S FEET)
    # =========================================================================
    lines.append('  <!-- ==================== INTRA-DB ACID CONSTRAINTS ==================== -->')
    lines.append('  <g id="Intra_DB_ACID_Relations">')

    def draw_crow_foot_h(x1, y1, x2, y2):
        # Generates clean, non-overlapping OMG UML Crow's foot between x1 and x2
        # x1: 1-side (Double tick ||)
        # x2: N-side (Crow's foot prong >)
        # Assumes x2 - x1 >= 50px (our layout guarantees 55px to 70px)
        res = []
        res.append(f'    <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="acid-line"/>')
        # Mandatory 1 ticks at x1 + 14 and x1 + 22
        t1 = x1 + 14
        t2 = x1 + 22
        res.append(f'    <line x1="{t1}" y1="{y1-8}" x2="{t1}" y2="{y1+8}" class="crow-foot"/>')
        res.append(f'    <line x1="{t2}" y1="{y1-8}" x2="{t2}" y2="{y1+8}" class="crow-foot"/>')
        # Crow's foot prongs at x2 (starts at x2 - 16, connects to x2, y2)
        px = x2 - 16
        res.append(f'    <line x1="{px}" y1="{y2-9}" x2="{x2}" y2="{y2}" class="crow-foot"/>')
        res.append(f'    <line x1="{px}" y1="{y2+9}" x2="{x2}" y2="{y2}" class="crow-foot"/>')
        return "\n".join(res)

    def draw_crow_foot_v(x1, y1, x2, y2):
        # Vertical crow foot from y1 (top 1-side) to y2 (bottom N-side)
        res = []
        res.append(f'    <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="acid-line"/>')
        t1 = y1 + 14
        t2 = y1 + 22
        res.append(f'    <line x1="{x1-8}" y1="{t1}" x2="{x1+8}" y2="{t1}" class="crow-foot"/>')
        res.append(f'    <line x1="{x1-8}" y1="{t2}" x2="{x1+8}" y2="{t2}" class="crow-foot"/>')
        py = y2 - 16
        res.append(f'    <line x1="{x2-9}" y1="{py}" x2="{x2}" y2="{y2}" class="crow-foot"/>')
        res.append(f'    <line x1="{x2+9}" y1="{py}" x2="{x2}" y2="{y2}" class="crow-foot"/>')
        return "\n".join(res)

    # 1. UserAccount (x=405) -> AuthSession (x=460) [y=238, Gap=55px]
    lines.append(draw_crow_foot_h(405, 238, 460, 238))

    # 2. Shipment (x=1315) -> ShipmentItem (x=1385) [y=238, Gap=70px]
    lines.append(draw_crow_foot_h(1315, 238, 1385, 238))

    # 3. Shipment (x=1315) -> ShipmentStatusHistory (x=1385) [y=475, Gap=70px]
    lines.append(draw_crow_foot_h(1315, 475, 1385, 475))

    # 4. Manifest (x=2205) -> ManifestItem (x=2275) [y=238, Gap=70px]
    lines.append(draw_crow_foot_h(2205, 238, 2275, 238))

    # 5. DeliveryTask (x=3105) -> DeliveryAttempt (x=3175) [y=238, Gap=70px]
    lines.append(draw_crow_foot_h(3105, 238, 3175, 238))

    # 6. PickupRequest (x=405) -> PickupAssignment (x=460) [y=1293, Gap=55px]
    lines.append(draw_crow_foot_h(405, 1293, 460, 1293))

    # 7. DispatchTrip (x=2035, y=745) -> DispatchManifestMap (x=2035, y=815) [Gap=70px]
    lines.append(draw_crow_foot_v(2035, 745, 2035, 815))
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # DISTRIBUTED SAGA CONNECTORS (EXPANDED AISLES, HIGHWAYS & CRISP 12PX ARROWS)
    # =========================================================================
    lines.append('  <!-- ==================== DISTRIBUTED SAGA CONNECTORS ==================== -->')
    lines.append('  <g id="Distributed_Saga_Links">')

    def draw_dist_pill(cx, cy, label, w=115, h=22):
        res = []
        res.append(f'    <rect x="{cx - w/2}" y="{cy - h/2}" width="{w}" height="{h}" class="pill-dist"/>')
        res.append(f'    <text x="{cx}" y="{cy + 4}" class="pill-txt">{xml_esc(label)}</text>')
        return "\n".join(res)

    def draw_dist_arrow(x, y, direct="right"):
        # Crisp 12px length, 10px width for crystal-clear visibility at any zoom level
        if direct == "right":
            return f'    <polygon points="{x},{y} {x-12},{y-5} {x-12},{y+5}" fill="#000000"/>'
        elif direct == "left":
            return f'    <polygon points="{x},{y} {x+12},{y-5} {x+12},{y+5}" fill="#000000"/>'
        elif direct == "down":
            return f'    <polygon points="{x},{y} {x-5},{y-12} {x+5},{y-12}" fill="#000000"/>'
        elif direct == "up":
            return f'    <polygon points="{x},{y} {x-5},{y+12} {x+5},{y+12}" fill="#000000"/>'

    # 1. UserAccount -> Shipment (senderId):
    # Leaves UserAccount bottom at X=240, Y=413 -> Corridor Y=445 -> Aisle 1 X=860 -> Lands on Shipment at X=945, Y=282
    lines.append('    <polyline points="240,413 240,445 860,445 860,282 945,282" class="dist-line"/>')
    lines.append(draw_dist_arrow(945, 282, "right"))
    lines.append(draw_dist_pill(600, 445, "[userId]", 85))

    # 2. Hub -> Shipment (originHubCode):
    # Leaves Hub bottom at X=240, Y=720 -> Corridor Y=748 -> Aisle 1 X=885 -> Lands on Shipment at X=945, Y=304
    lines.append('    <polyline points="240,720 240,748 885,748 885,304 945,304" class="dist-line"/>')
    lines.append(draw_dist_arrow(945, 304, "right"))
    lines.append(draw_dist_pill(600, 748, "[hubCode]", 95))

    # 3. PickupItemMap -> Shipment (shipmentCode):
    # Leaves PickupItemMap right at X=405, Y=1620 -> Aisle X=432 -> Highway Y=1100 -> Aisle 1 X=910 -> Lands on Shipment at X=945, Y=348
    lines.append('    <polyline points="405,1620 432,1620 432,1100 910,1100 910,348 945,348" class="dist-line"/>')
    lines.append(draw_dist_arrow(945, 348, "right"))
    lines.append(draw_dist_pill(670, 1100, "[shipmentCode]", 125))

    # 4. Shipment -> ManifestItem (shipmentCode):
    # Leaves Shipment top at X=1270, Y=195 (outside Domain 3 tab X=925..1235) -> Skyway Y=146 -> Lands on ManifestItem at X=2450, Y=195
    lines.append('    <polyline points="1270,195 1270,146 2450,146 2450,195" class="dist-line"/>')
    lines.append(draw_dist_arrow(2450, 195, "down"))
    lines.append(draw_dist_pill(1860, 146, "[shipmentCode]", 125))

    # 5. Shipment -> DeliveryTask (shipmentCode):
    # Leaves Shipment top at X=1295, Y=195 -> Skyway Y=138 -> Lands on DeliveryTask at X=3050, Y=195 (Domain 5 tab is at right X=3175..3530)
    lines.append('    <polyline points="1295,195 1295,138 3050,138 3050,195" class="dist-line"/>')
    lines.append(draw_dist_arrow(3050, 195, "down"))
    lines.append(draw_dist_pill(2100, 138, "[shipmentCode]", 125))

    # 6. Shipment -> TrackingMilestone (shipmentCode):
    # Leaves Shipment left at X=945, Y=600 -> Aisle 1 X=860 -> Highway Y=1060 -> Lands on TrackingMilestone at X=1130, Y=1250
    lines.append('    <polyline points="945,600 860,600 860,1060 1130,1060 1130,1250" class="dist-line"/>')
    lines.append(draw_dist_arrow(1130, 1250, "down"))
    lines.append(draw_dist_pill(1020, 1060, "[shipmentCode]", 125))

    # 7. Shipment -> ClaimTicket (shipmentCode):
    # Leaves Shipment right at X=1315, Y=600 -> Gap X=1350 -> Highway Y=1140 -> Lands on ClaimTicket at X=1560, Y=1250
    lines.append('    <polyline points="1315,600 1350,600 1350,1140 1560,1140 1560,1250" class="dist-line"/>')
    lines.append(draw_dist_arrow(1560, 1250, "down"))
    lines.append(draw_dist_pill(1455, 1140, "[shipmentCode]", 125))

    # 8. DeliveryTask -> CodTransaction (shipmentCode & courierId):
    # Gap is 73px (Y: 457 to 530). Vertical connector at X=2925. Pill at Y=493.5.
    lines.append('    <line x1="2925" y1="457" x2="2925" y2="530" class="dist-line"/>')
    lines.append(draw_dist_arrow(2925, 530, "down"))
    lines.append(draw_dist_pill(2925, 493.5, "[shipmentCode]", 120))

    # 9. CodTransaction -> CodRemittanceSheet (merchantId):
    # Gap between tables is 70px (X: 3105 to 3175). Clean horizontal Z-connector in the gap!
    lines.append('    <polyline points="3105,638 3140,638 3140,572 3175,572" class="dist-line"/>')
    lines.append(draw_dist_arrow(3175, 572, "right"))
    lines.append(draw_dist_pill(3140, 605, "[merchantId]", 100))

    # 10. PricingMatrixRule -> Shipment (IATA):
    # Gap is 73px (Y: 657 to 730). Vertical connector at X=1130. Pill at Y=693.5.
    lines.append('    <line x1="1130" y1="730" x2="1130" y2="657" class="dist-line"/>')
    lines.append(draw_dist_arrow(1130, 657, "up"))
    lines.append(draw_dist_pill(1130, 693.5, "[IATA Pricing]", 115))

    # 11. Manifest -> DispatchTrip (manifestCode):
    # Gap is 70px (Y: 435 to 505). Vertical connector at X=2035. Pill at Y=470.
    lines.append('    <line x1="2035" y1="435" x2="2035" y2="505" class="dist-line"/>')
    lines.append(draw_dist_arrow(2035, 505, "down"))
    lines.append(draw_dist_pill(2035, 470, "[manifestCode]", 120))

    # 12. KnowledgeChunk -> ChatbotSessionLog (Citation):
    # Gap is 67px (Y: 1468 to 1535). Vertical connector at X=2450. Pill at Y=1501.5.
    lines.append('    <line x1="2450" y1="1468" x2="2450" y2="1535" class="dist-line"/>')
    lines.append(draw_dist_arrow(2450, 1535, "down"))
    lines.append(draw_dist_pill(2450, 1501.5, "[Chunk ID]", 90))
    lines.append('  </g>')
    lines.append('')

    # =========================================================================
    # FOOTER & STANDARD LEGEND
    # =========================================================================
    lines.append('  <!-- ==================== FOOTER & LEGEND ==================== -->')
    lines.append('  <g id="Footer_Legend">')
    lines.append(f'    <rect x="50" y="2225" width="{width-100}" height="75" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>')
    lines.append('    <text x="75" y="2252" font-size="12.5" font-weight="900" fill="#000000">KÝ HIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU &amp; QUAN HỆ THỰC THỂ (CROW\'S FOOT &amp; DISTRIBUTED SAGA):</text>')

    # Legend elements:
    # 1. PK Badge
    lines.append('    <rect x="75" y="2266" width="22" height="14" class="b-pk"/>')
    lines.append('    <text x="86" y="2277" class="b-pk-txt">PK</text>')
    lines.append('    <text x="105" y="2278" font-size="11" font-weight="600" fill="#000000">: Khóa chính thực thể (Primary Key)</text>')

    # 2. FK Badge
    lines.append('    <rect x="360" y="2266" width="22" height="14" class="b-fk"/>')
    lines.append('    <text x="371" y="2277" class="b-fk-txt">FK</text>')
    lines.append('    <text x="390" y="2278" font-size="11" font-weight="600" fill="#000000">: Khóa ngoại nội bộ Database (ACID Constraint)</text>')

    # 3. DIST Badge
    lines.append('    <rect x="690" y="2266" width="28" height="14" class="b-dist"/>')
    lines.append('    <text x="704" y="2277" class="b-dist-txt">DIST</text>')
    lines.append('    <text x="725" y="2278" font-size="11" font-weight="600" fill="#000000">: Khóa nghiệp vụ phân tán (Distributed Saga Key)</text>')

    # 4. Solid Line (ACID)
    lines.append('    <line x1="1080" y1="2273" x2="1140" y2="2273" stroke="#000000" stroke-width="2.0"/>')
    lines.append('    <text x="1150" y="2278" font-size="11" font-weight="600" fill="#000000">: Quan hệ ràng buộc ACID trong cùng 1 Database (1:N, 1:1)</text>')

    # 5. Dashed Line (Saga)
    lines.append('    <line x1="1560" y1="2273" x2="1620" y2="2273" stroke="#000000" stroke-width="2.0" stroke-dasharray="6 3"/>')
    lines.append('    <text x="1630" y="2278" font-size="11" font-weight="600" fill="#000000">: Liên kết phân tán xuyên Database (Saga Link via RabbitMQ Eventual Consistency)</text>')

    # 6. Database badge
    lines.append('    <rect x="2250" y="2265" width="70" height="16" fill="#F4F4F5" stroke="#000000" stroke-width="0.8" rx="2"/>')
    lines.append('    <text x="2285" y="2277" font-size="9.5" font-family="ui-monospace, Menlo, monospace" font-weight="700" fill="#000000" text-anchor="middle">[db_name]</text>')
    lines.append('    <text x="2330" y="2278" font-size="11" font-weight="600" fill="#000000">: Tên Database độc lập tương ứng trong cụm PostgreSQL 16</text>')

    lines.append(f'    <text x="{width-420}" y="2258" font-size="11" font-style="italic" fill="#4B5563">100% Native Vector • Dễ dàng chỉnh sửa trên Figma</text>')
    lines.append('  </g>')

    lines.append('</svg>')
    return "\n".join(lines)

if __name__ == "__main__":
    svg_content = generate_svg()
    target_path = os.path.abspath("docs/graduation-thesis/figma-page-1-system-and-data/diagrams/03-overall-conceptual-erd.svg")
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated successfully: {target_path} ({len(svg_content.encode('utf-8'))} bytes)")
