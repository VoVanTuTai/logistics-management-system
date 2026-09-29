#!/usr/bin/env python3
"""
generate-individual-service-erds.py
Generates individual, standalone ERD SVG diagrams for each microservice
in the Nexus Logistics Management System graduation thesis.

Outputs to:
  docs/graduation-thesis/figma-page-1-system-and-data/diagrams/erd/

Generated files:
  01-auth-service-erd.svg
  02-masterdata-service-erd.svg
  03-shipment-service-erd.svg
  04-pickup-service-erd.svg
  05-dispatch-service-erd.svg
  06-manifest-service-erd.svg
  07-scan-service-erd.svg
  08-delivery-service-erd.svg
  09-payment-service-erd.svg
  10-tracking-service-erd.svg
  11-reporting-service-erd.svg
  12-pricing-service-erd.svg
  13-chatbot-service-erd.svg
"""

import xml.etree.ElementTree as ET
import html
import os
import re

OUTPUT_DIR = "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/erd"

def escape(text):
    return html.escape(str(text))

def sanitize_xml_text(s):
    return re.sub(r'&(?!(?:amp|lt|gt|quot|apos);)', '&amp;', str(s))

def render_table(tx, ty, tw, tname, entity_label, columns, header_color=None):
    row_height = 24
    header_height = 36
    th = header_height + len(columns) * row_height + 8
    out = []
    out.append(f'<g transform="translate({tx}, {ty})">')
    # Table Box - Pure white, crisp black stroke
    out.append(f'  <rect width="{tw}" height="{th}" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>')
    # Table Header - NO background fill (per user requirement), just clean divider line
    out.append(f'  <line x1="0" y1="{header_height}" x2="{tw}" y2="{header_height}" stroke="#000000" stroke-width="1.2"/>')
    out.append(f'  <text x="14" y="23" class="tbl-header">{escape(tname)}</text>')
    if entity_label:
        out.append(f'  <text x="{tw - 14}" y="23" class="tbl-tag" text-anchor="end">{escape(entity_label)}</text>')
    
    # Columns
    for i, col in enumerate(columns):
        cy = header_height + 18 + i * row_height
        
        # Key indicator in Monochrome
        ktype = col.get("key", "")
        if ktype == "PK":
            out.append(f'  <rect x="10" y="{cy - 11}" width="20" height="14" rx="2" fill="#000000"/>')
            out.append(f'  <text x="20" y="{cy}" class="badge-pk" text-anchor="middle">PK</text>')
            name_class = "tbl-field-pk"
        elif ktype == "FK":
            out.append(f'  <rect x="10" y="{cy - 11}" width="20" height="14" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>')
            out.append(f'  <text x="20" y="{cy}" class="badge-fk" text-anchor="middle">FK</text>')
            name_class = "tbl-field-fk"
        elif ktype == "DIST":
            out.append(f'  <rect x="8" y="{cy - 11}" width="28" height="14" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="1" stroke-dasharray="2 1.5"/>')
            out.append(f'  <text x="22" y="{cy}" class="badge-dist" text-anchor="middle">DIST</text>')
            name_class = "tbl-field-dist"
        else:
            out.append(f'  <circle cx="18" cy="{cy - 4}" r="1.8" fill="#000000"/>')
            name_class = "tbl-field-normal"
        
        col_x = 42 if ktype else 30
        out.append(f'  <text x="{col_x}" y="{cy}" class="{name_class}">{escape(col["name"])}</text>')
        
        type_str = col.get("type", "")
        attr_str = col.get("attr", "")
        full_type = f"{type_str} {attr_str}".strip()
        out.append(f'  <text x="{tw - 12}" y="{cy}" class="tbl-type" text-anchor="end">{escape(full_type)}</text>')
        
    out.append('</g>')
    return "\n".join(out), th

def render_explanation_panel(px, py, pw, ph, title, badge_text, badge_color, sections, stats_footer=None):
    out = []
    out.append(f'<g transform="translate({px}, {py})">')
    # Panel box
    out.append(f'  <rect width="{pw}" height="{ph}" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>')
    # Header bar
    out.append(f'  <rect x="0" y="0" width="{pw}" height="42" rx="6" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>')
    out.append(f'  <rect x="14" y="12" width="6" height="18" rx="1" fill="#000000"/>')
    out.append(f'  <text x="28" y="26" class="panel-header">{escape(title)}</text>')
    out.append(f'  <rect x="{pw - 180}" y="9" width="166" height="24" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>')
    out.append(f'  <text x="{pw - 97}" y="25" font-size="11" font-weight="700" fill="#000000" text-anchor="middle">{escape(badge_text)}</text>')
    
    # Sections
    curr_y = 66
    for sec in sections:
        out.append(f'  <text x="18" y="{curr_y}" class="panel-sec-title">▶ {escape(sec["title"])}</text>')
        curr_y += 20
        for bullet in sec["bullets"]:
            out.append(f'  <circle cx="25" cy="{curr_y - 4}" r="2" fill="#000000"/>')
            b_text = sanitize_xml_text(bullet)
            out.append(f'  <text x="36" y="{curr_y}" class="panel-body">{b_text}</text>')
            curr_y += 20
        curr_y += 8
    
    # Stats footer chip
    if stats_footer:
        out.append(f'  <rect x="14" y="{ph - 38}" width="{pw - 28}" height="26" rx="4" fill="#F9FAFB" stroke="#000000" stroke-width="1"/>')
        out.append(f'  <text x="{pw/2}" y="{ph - 21}" font-size="11" font-weight="600" fill="#111827" text-anchor="middle">{escape(stats_footer)}</text>')
        
    out.append('</g>')
    return "\n".join(out)

def build_standalone_svg(filename, width, height, svc_name, port_str, db_str, desc_str, color_accent, 
                         tables_markup, connectors_markup, panel_title, badge_text, sections, stats_footer,
                         saga_footer_text):
    lines = []
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')
    lines.append(f'''
  <defs>
    <marker id="crow-many" markerWidth="14" markerHeight="14" refX="10" refY="7" orient="auto">
      <path d="M 0 0 L 10 7 L 0 14 M 10 0 L 10 14" stroke="#000000" stroke-width="1.8" fill="none"/>
    </marker>
    <marker id="crow-one" markerWidth="14" markerHeight="14" refX="10" refY="7" orient="auto">
      <line x1="5" y1="2" x2="5" y2="12" stroke="#000000" stroke-width="1.8"/>
      <line x1="9" y1="2" x2="9" y2="12" stroke="#000000" stroke-width="1.8"/>
    </marker>
    <marker id="arrow-dist" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto">
      <path d="M 0 1 L 9 6 L 0 11 z" fill="#000000"/>
    </marker>
  </defs>

  <!-- Technical Blueprint Frame -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <rect x="15" y="15" width="{width - 30}" height="{height - 30}" fill="none" stroke="#000000" stroke-width="2"/>
  <rect x="20" y="20" width="{width - 40}" height="{height - 40}" fill="none" stroke="#000000" stroke-width="0.8"/>

  <style>
    text {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }}
    .doc-badge {{ font-size: 11.5px; font-weight: 700; fill: #000000; letter-spacing: 1.2px; text-transform: uppercase; }}
    .doc-title {{ font-size: 23px; font-weight: 800; fill: #000000; letter-spacing: -0.5px; }}
    .doc-subtitle {{ font-size: 13px; font-weight: 400; fill: #374151; }}
    
    .tbl-header {{ font-size: 13.5px; font-weight: 700; fill: #000000; }}
    .tbl-tag {{ font-size: 10.5px; font-weight: 600; fill: #4B5563; text-transform: uppercase; }}
    .tbl-field-pk {{ font-size: 11.5px; font-weight: 700; fill: #000000; font-family: ui-monospace, Menlo, monospace; }}
    .tbl-field-fk {{ font-size: 11.5px; font-weight: 600; fill: #000000; font-family: ui-monospace, Menlo, monospace; }}
    .tbl-field-dist {{ font-size: 11.5px; font-weight: 600; fill: #000000; font-style: italic; font-family: ui-monospace, Menlo, monospace; }}
    .tbl-field-normal {{ font-size: 11.5px; font-weight: 500; fill: #1F2937; font-family: ui-monospace, Menlo, monospace; }}
    .tbl-type {{ font-size: 11px; font-weight: 500; fill: #4B5563; }}

    .badge-pk {{ font-size: 9.5px; font-weight: 800; fill: #FFFFFF; }}
    .badge-fk {{ font-size: 9.5px; font-weight: 800; fill: #000000; }}
    .badge-dist {{ font-size: 9.5px; font-weight: 800; fill: #000000; }}

    .panel-header {{ font-size: 13.5px; font-weight: 800; fill: #000000; text-transform: uppercase; letter-spacing: 0.5px; }}
    .panel-sec-title {{ font-size: 12px; font-weight: 700; fill: #000000; }}
    .panel-body {{ font-size: 11.5px; font-weight: 400; fill: #1F2937; }}
    .panel-bold {{ font-weight: 700; fill: #000000; }}
    .panel-code {{ font-family: ui-monospace, Menlo, monospace; font-size: 11px; font-weight: 700; fill: #000000; }}
  </style>
''')

    # Grand Service Header
    lines.append(f'''
  <!-- HEADER -->
  <g id="Header" transform="translate(40, 32)">
    <rect width="{width - 80}" height="100" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <line x1="0" y1="32" x2="{width - 80}" y2="32" stroke="#E5E7EB" stroke-width="1"/>
    <text x="24" y="22" class="doc-badge">NEXUS LOGISTICS SYSTEM ARCHITECTURE • DATABASE-PER-SERVICE SPECIFICATION</text>
    <text x="24" y="58" class="doc-title">{escape(svc_name)}</text>
    <text x="24" y="82" class="doc-subtitle">{escape(desc_str)}</text>
    
    <!-- Badges -->
    <rect x="{width - 430}" y="32" width="160" height="36" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1.2"/>
    <text x="{width - 350}" y="55" font-size="12.5" font-weight="700" fill="#000000" text-anchor="middle">PORT :{escape(port_str)}</text>

    <rect x="{width - 250}" y="32" width="170" height="36" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
    <text x="{width - 165}" y="55" font-size="12.5" font-weight="700" fill="#000000" text-anchor="middle">DB: {escape(db_str)}</text>
  </g>
''')

    # Main Content Area
    content_y = 150
    # Big Container Card
    container_h = height - content_y - 90
    lines.append(f'''
  <!-- MAIN SERVICE CONTAINER -->
  <g id="ServiceBody" transform="translate(40, {content_y})">
    <rect width="{width - 80}" height="{container_h}" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>
''')

    # Tables & Connectors
    lines.append(tables_markup)
    lines.append(connectors_markup)

    # Explanation Panel
    panel_x = 1010
    panel_w = width - 80 - panel_x - 20
    panel_h = container_h - 40
    panel_svg = render_explanation_panel(panel_x, 20, panel_w, panel_h, panel_title, badge_text, color_accent, sections, stats_footer)
    lines.append(panel_svg)

    lines.append('  </g>')

    # Bottom Saga Context Banner
    banner_y = height - 70
    lines.append(f'''
  <!-- SAGA CONTEXT FOOTER -->
  <g id="FooterSaga" transform="translate(40, {banner_y})">
    <rect width="{width - 80}" height="50" rx="6" fill="#F9FAFB" stroke="#000000" stroke-width="1.4"/>
    <circle cx="25" cy="25" r="5" fill="#000000"/>
    <text x="42" y="29" font-size="12" font-weight="700" fill="#000000">CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA):</text>
    <text x="310" y="29" font-size="11.5" fill="#1F2937">{escape(saga_footer_text)}</text>
    <text x="{width - 100}" y="29" font-size="11" font-weight="600" fill="#4B5563" text-anchor="end">Nexus Software Engineering Thesis</text>
  </g>
</svg>
''')

    full_svg = "\n".join(lines)
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(full_svg)
    
    ET.fromstring(full_svg)
    print(f"Generated and validated: {filepath} ({len(full_svg)} bytes)")


def generate_all_individual_erds():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # =========================================================================
    # 1. AUTH-SERVICE (:3010 | auth_db)
    # =========================================================================
    user_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "NOT NULL"},
        {"key": "", "name": "username", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "passwordHash", "type": "VARCHAR(255)", "attr": "ARGON2ID"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "ACTIVE, DISABLED"},
        {"key": "", "name": "roles", "type": "TEXT[]", "attr": "ADMIN, COURIER, OPS..."},
        {"key": "", "name": "displayName", "type": "VARCHAR(128)", "attr": "NULLABLE"},
        {"key": "", "name": "phone", "type": "VARCHAR(20)", "attr": "INDEX"},
        {"key": "DIST", "name": "hubCodes", "type": "TEXT[]", "attr": "FK-dist masterdata.hubs"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"},
        {"key": "", "name": "updatedAt", "type": "TIMESTAMP", "attr": "ON UPDATE"}
    ]
    t1, _ = render_table(20, 20, 470, "UserAccount", "users", user_cols, "#312E81")

    session_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "userId", "type": "VARCHAR(64)", "attr": "FK -> UserAccount.id"},
        {"key": "", "name": "accessTokenHash", "type": "VARCHAR(128)", "attr": "UNIQUE"},
        {"key": "", "name": "refreshTokenHash", "type": "VARCHAR(128)", "attr": "UNIQUE"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "ACTIVE, REVOKED"},
        {"key": "", "name": "issuedAt", "type": "TIMESTAMP", "attr": "NOT NULL"},
        {"key": "", "name": "accessTokenExpiresAt", "type": "TIMESTAMP", "attr": "NOT NULL"},
        {"key": "", "name": "refreshTokenExpiresAt", "type": "TIMESTAMP", "attr": "NOT NULL"},
        {"key": "", "name": "lastUsedAt", "type": "TIMESTAMP", "attr": "NULLABLE"},
        {"key": "", "name": "revokedAt", "type": "TIMESTAMP", "attr": "NULLABLE"},
        {"key": "", "name": "revokeReason", "type": "VARCHAR(128)", "attr": "NULLABLE"}
    ]
    t2, _ = render_table(510, 20, 470, "AuthSession", "auth_sessions", session_cols, "#312E81")

    perm_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "actor", "type": "VARCHAR(32)", "attr": "UNIQUE (COURIER/OPS)"},
        {"key": "", "name": "permissions", "type": "JSONB", "attr": "ALLOWED ACTIONS"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"},
        {"key": "", "name": "updatedAt", "type": "TIMESTAMP", "attr": "ON UPDATE"}
    ]
    t3, _ = render_table(20, 340, 470, "MobilePermissionProfile", "mobile_profiles", perm_cols, "#4338CA")

    override_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "userId", "type": "VARCHAR(64)", "attr": "UNIQUE FK -> UserAccount"},
        {"key": "", "name": "permissions", "type": "JSONB", "attr": "OVERRIDE ACTIONS"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"},
        {"key": "", "name": "updatedAt", "type": "TIMESTAMP", "attr": "ON UPDATE"}
    ]
    t4, _ = render_table(510, 340, 470, "MobilePermissionOverride", "perm_overrides", override_cols, "#4338CA")

    audit_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "actorId / actorUsername", "type": "VARCHAR(64)", "attr": "INDEX"},
        {"key": "", "name": "action / targetType", "type": "VARCHAR(64)", "attr": "LOGIN, GRANT, REVOKE"},
        {"key": "", "name": "targetId / ipAddress", "type": "VARCHAR(64)", "attr": "NULLABLE"},
        {"key": "", "name": "before / after", "type": "JSONB", "attr": "AUDIT DIFF"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "INDEX"}
    ]
    t5, _ = render_table(20, 540, 470, "AdminAuditLog", "admin_audit_logs", audit_cols, "#475569")

    outbox_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType / routingKey", "type": "VARCHAR(64)", "attr": "USER.CREATED, ..."},
        {"key": "", "name": "aggregateType / aggregateId", "type": "VARCHAR(64)", "attr": "UserAccount / id"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "EVENT PAYLOAD"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, PUBLISHED"},
        {"key": "", "name": "retryCount / occurredAt", "type": "INT / TIME", "attr": "SLA RESILIENT"}
    ]
    t6, _ = render_table(510, 560, 470, "OutboxEvent (Auth)", "outbox_events", outbox_cols, "#475569")

    auth_connectors = '''
    <path d="M 490 60 L 510 60" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <path d="M 450 290 L 450 385 L 510 385" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>
    '''

    auth_sections = [
        {
            "title": "VAI TRÒ & TRÁCH NHIỆM DỮ LIỆU",
            "bullets": [
                '<tspan class="panel-bold">Trung tâm định danh:</tspan> Lưu trữ tài khoản, mật khẩu băm Argon2id và quản lý phiên đăng nhập tại <tspan class="panel-code">auth_sessions</tspan>.',
                '<tspan class="panel-bold">Phân quyền 2 lớp (Dual Authorization):</tspan> RBAC cho Web kết hợp phân quyền chi tiết (Granular Mobile Permissions) cho tài xế và nhân viên bưu cục trên app di động.',
                '<tspan class="panel-bold">Nhật ký an ninh (Audit Trail):</tspan> Bảng <tspan class="panel-code">admin_audit_logs</tspan> ghi nhận chính xác vết diff (before/after) mọi thay đổi quyền hạn.'
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                '<tspan class="panel-code">hubCodes</tspan>: Mảng mã bưu cục gắn cho nhân sự, ánh xạ sang <tspan class="panel-code">masterdata.hubs.code</tspan> để kiểm soát phạm vi tác nghiệp.',
                '<tspan class="panel-code">userId</tspan>: Khóa định danh nhúng trong JWT claims, dùng đối soát quyền tại tất cả các Microservices khác.'
            ]
        },
        {
            "title": "QUY TẮC TOÀN VẸN & BẢO MẬT",
            "bullets": [
                '<tspan class="panel-bold">Thu hồi phiên tức thì:</tspan> Khi phát hiện gian lận hoặc đăng xuất, cờ <tspan class="panel-code">status = REVOKED</tspan> được kích hoạt ngay lập tức.',
                '<tspan class="panel-bold">Transactional Outbox:</tspan> Sự kiện tài khoản được lưu đồng thời cùng transaction DB, luồng Outbox Publisher đảm bảo đồng bộ 100% sang RabbitMQ.'
            ]
        }
    ]

    build_standalone_svg(
        filename="01-auth-service-erd.svg",
        width=2000, height=1100,
        svc_name="1. AUTH-SERVICE (DỊCH VỤ ĐỊNH DANH & PHÂN QUYỀN TRUY CẬP)",
        port_str="3010", db_str="auth_db",
        desc_str="Quản lý vòng đời tài khoản, xác thực Argon2id, quản lý phiên JWT kép & phân quyền Mobile",
        color_accent="#4338CA",
        tables_markup=t1 + "\n" + t2 + "\n" + t3 + "\n" + t4 + "\n" + t5 + "\n" + t6,
        connectors_markup=auth_connectors,
        panel_title="GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: AUTH-SERVICE",
        badge_text="SECURITY BOUNDARY",
        sections=auth_sections,
        stats_footer="Engine: PostgreSQL 16 | Isolation: Read Committed | Password: Argon2id | Auth: Dual JWT Bearer",
        saga_footer_text="Phát hành sự kiện USER.CREATED, USER.STATUS_CHANGED qua RabbitMQ tới masterdata-service & dispatch-service"
    )

    # =========================================================================
    # 2. MASTERDATA-SERVICE (:3001 | masterdata_db)
    # =========================================================================
    hub_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "code", "type": "VARCHAR(32)", "attr": "UNIQUE (HUB-SGN-01)"},
        {"key": "", "name": "name", "type": "VARCHAR(128)", "attr": "TÊN BƯU CỤC"},
        {"key": "", "name": "level", "type": "INT", "attr": "0:HQ, 1:REG, 2:PROV, 3:WARD"},
        {"key": "FK", "name": "parentCode", "type": "VARCHAR(32)", "attr": "SELF-REF (Tree Structure)"},
        {"key": "FK", "name": "zoneCode", "type": "VARCHAR(32)", "attr": "FK -> zones.code"},
        {"key": "", "name": "district / ward", "type": "VARCHAR(64)", "attr": "ĐỊA BÀN HÀNH CHÍNH"},
        {"key": "", "name": "coverageRadiusKm", "type": "FLOAT", "attr": "BÁN KÍNH PHỤC VỤ (KM)"},
        {"key": "", "name": "boundaryPolygon", "type": "JSONB", "attr": "GEOJSON TẬP TỌA ĐỘ"},
        {"key": "", "name": "latitude / longitude", "type": "FLOAT", "attr": "TỌA ĐỘ TRUNG TÂM"},
        {"key": "", "name": "isActive", "type": "BOOLEAN", "attr": "DEFAULT TRUE"}
    ]
    t_hub, _ = render_table(20, 20, 470, "Hub (hubs)", "CÂY BƯU CỤC 4 CẤP", hub_cols, "#0369A1")

    zone_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "code", "type": "VARCHAR(32)", "attr": "UNIQUE (MIEN_NAM, NOI_TINH)"},
        {"key": "", "name": "name", "type": "VARCHAR(64)", "attr": "TÊN VÙNG CƯỚC"},
        {"key": "", "name": "parentCode", "type": "VARCHAR(32)", "attr": "NULLABLE"},
        {"key": "", "name": "isActive", "type": "BOOLEAN", "attr": "DEFAULT TRUE"}
    ]
    t_zone, _ = render_table(510, 20, 470, "Zone (zones)", "VÙNG TÍNH CƯỚC", zone_cols, "#0369A1")

    area_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "FK-dist auth.users.id"},
        {"key": "FK", "name": "hubCode", "type": "VARCHAR(32)", "attr": "FK -> hubs.code"},
        {"key": "", "name": "province / district / ward", "type": "VARCHAR", "attr": "ĐỊA BÀN PHÂN CÔNG"},
        {"key": "", "name": "zoneName / colorHex", "type": "VARCHAR", "attr": "MÃ MÀU BẢN ĐỒ"},
        {"key": "", "name": "boundaryPolygon", "type": "JSONB", "attr": "ĐA GIÁC TUYẾN GIAO"},
        {"key": "", "name": "isActive", "type": "BOOLEAN", "attr": "DEFAULT TRUE"}
    ]
    t_area, _ = render_table(510, 190, 470, "CourierAreaAssignment", "PHÂN TUYẾN TÀI XẾ", area_cols, "#0284C7")

    merchant_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "username", "type": "VARCHAR(64)", "attr": "UNIQUE (auth_db)"},
        {"key": "", "name": "citizenId", "type": "VARCHAR(20)", "attr": "CCCD CHỦ SHOP"},
        {"key": "", "name": "regionCode / regionLabel", "type": "VARCHAR", "attr": "VÙNG HOẠT ĐỘNG"},
        {"key": "FK", "name": "defaultHubCode / HubName", "type": "VARCHAR", "attr": "BƯU CỤC MẶC ĐỊNH"},
        {"key": "", "name": "defaultSenderAddress", "type": "TEXT", "attr": "ĐỊA CHỈ KHO GOM"},
        {"key": "", "name": "latitude / longitude", "type": "FLOAT", "attr": "GPS VỊ TRÍ KHO"}
    ]
    t_merch, _ = render_table(20, 340, 470, "MerchantProfile", "HỒ SƠ CHỦ SHOP", merchant_cols, "#0284C7")

    cust_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "userId", "type": "VARCHAR(64)", "attr": "UNIQUE (auth_db)"},
        {"key": "", "name": "fullName / email", "type": "VARCHAR", "attr": "HỌ TÊN & EMAIL"},
        {"key": "", "name": "phone", "type": "VARCHAR(20)", "attr": "UNIQUE INDEX [PII]"},
        {"key": "", "name": "defaultAddress", "type": "TEXT", "attr": "ĐỊA CHỈ GIAO TẬN NƠI"}
    ]
    t_cust, _ = render_table(510, 420, 470, "CustomerProfile", "HỒ SƠ KHÁCH HÀNG", cust_cols, "#0284C7")

    policy_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "title / slug", "type": "VARCHAR", "attr": "UNIQUE SLUG"},
        {"key": "", "name": "category", "type": "ENUM", "attr": "COMPENSATION, RETURN..."},
        {"key": "", "name": "summary / content", "type": "TEXT", "attr": "NỘI DUNG MARKDOWN"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "DRAFT, PUBLISHED"},
        {"key": "", "name": "version / displayOrder", "type": "INT", "attr": "SỐ HIỆU PHIÊN BẢN"}
    ]
    t_pol, _ = render_table(20, 575, 470, "Policy (policies)", "CHÍNH SÁCH BƯU CHÍNH", policy_cols, "#0C4A6E")

    pver_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "policyId", "type": "CUID", "attr": "FK -> policies.id CASCADE"},
        {"key": "", "name": "version", "type": "INT", "attr": "LỊCH SỬ PHIÊN BẢN"},
        {"key": "", "name": "title / content", "type": "TEXT", "attr": "NỘI DUNG LƯU TRỮ"},
        {"key": "", "name": "status / changeNote", "type": "VARCHAR", "attr": "GHI CHÚ SỬA ĐỔI"}
    ]
    t_pver, _ = render_table(510, 610, 470, "PolicyVersion", "LỊCH SỬ CHÍNH SÁCH", pver_cols, "#0C4A6E")

    ndr_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "code", "type": "VARCHAR(32)", "attr": "UNIQUE (NDR_KH_HEN_LAI)"},
        {"key": "", "name": "description", "type": "VARCHAR(255)", "attr": "LÝ DO GIAO KHÔNG THÀNH"},
        {"key": "", "name": "isActive", "type": "BOOLEAN", "attr": "DEFAULT TRUE"}
    ]
    t_ndr, _ = render_table(20, 785, 470, "NdrReason", "LÝ DO SỰ CỐ NDR", ndr_cols, "#475569")

    cfg_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "key", "type": "VARCHAR(64)", "attr": "UNIQUE (MAX_SLA_DAYS...)"},
        {"key": "", "name": "value", "type": "JSONB", "attr": "THAM SỐ HỆ THỐNG"},
        {"key": "", "name": "scope", "type": "VARCHAR(32)", "attr": "GLOBAL, REGIONAL"}
    ]
    t_cfg, _ = render_table(510, 790, 470, "Config (configs)", "CẤU HÌNH ĐIỀU HÀNH", cfg_cols, "#475569")

    md_connectors = '''
    <path d="M 490 60 L 510 60" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-many)" marker-end="url(#crow-one)"/>
    <path d="M 490 645 L 510 645" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <path d="M 490 105 L 500 105 L 500 220 L 510 220" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    '''

    md_sections = [
        {
            "title": "VAI TRÒ & TRÁCH NHIỆM DỮ LIỆU",
            "bullets": [
                '<tspan class="panel-bold">Phân cấp bưu cục 4 cấp (Hub Hierarchy):</tspan> Mô hình cây: Cấp 0 (Tổng công ty), Cấp 1 (Trung tâm khai thác liên vùng), Cấp 2 (Bưu cục tỉnh/thành), Cấp 3 (Điểm phục vụ phường/xã).',
                '<tspan class="panel-bold">Geo-Fencing &amp; Tuyến giao:</tspan> Lưu tọa độ và đa giác <tspan class="panel-code">boundaryPolygon</tspan> phân chia ranh giới phục vụ cho tài xế Courier, chống chồng chéo tuyến.',
                '<tspan class="panel-bold">Kho tri thức chính sách (RAG Base):</tspan> Bảng <tspan class="panel-code">policies</tspan> và <tspan class="panel-code">policy_versions</tspan> cung cấp dữ liệu tham chiếu cho Chatbot RAG AI (IATA, bồi thường, chuyển hoàn).'
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                '<tspan class="panel-code">hubCode</tspan>: Khóa phân tán liên kết đến <tspan class="panel-code">manifests</tspan>, <tspan class="panel-code">scan_events</tspan>, <tspan class="panel-code">tasks</tspan>, <tspan class="panel-code">cod_settlements</tspan>.',
                '<tspan class="panel-code">courierId</tspan>: Ánh xạ tài xế trong bảng <tspan class="panel-code">courier_area_assignments</tspan> với nhiệm vụ điều phối tại <tspan class="panel-code">dispatch_tasks</tspan>.',
                '<tspan class="panel-code">ndr_reasons.code</tspan>: Danh mục mã lý do giao không thành chuẩn hóa dùng trong <tspan class="panel-code">delivery.ndr_cases</tspan>.'
            ]
        },
        {
            "title": "QUY TẮC TOÀN VẸN & ĐẶC THÙ NGHIỆP VỤ",
            "bullets": [
                '<tspan class="panel-bold">Chống trùng địa bàn:</tspan> Ràng buộc <tspan class="panel-code">UNIQUE(courierId, province, district, ward)</tspan> ngăn ngừa phân công chồng chéo tuyến.',
                '<tspan class="panel-bold">Bảo lưu lịch sử chính sách:</tspan> Bảng phiên bản <tspan class="panel-code">policy_versions</tspan> lưu vết nguyên vẹn từng câu chữ điều khoản bưu chính theo thời gian áp dụng.'
            ]
        }
    ]

    build_standalone_svg(
        filename="02-masterdata-service-erd.svg",
        width=2000, height=1280,
        svc_name="2. MASTERDATA-SERVICE (DỊCH VỤ DỮ LIỆU DANH MỤC & CHÍNH SÁCH CỐT LÕI)",
        port_str="3001", db_str="masterdata_db",
        desc_str="Quản lý cây phân cấp Bưu cục, Tuyến giao GeoJSON, Hồ sơ đối tác & Kho văn bản chính sách",
        color_accent="#0284C7",
        tables_markup=t_hub + "\n" + t_zone + "\n" + t_area + "\n" + t_merch + "\n" + t_cust + "\n" + t_pol + "\n" + t_pver + "\n" + t_ndr + "\n" + t_cfg,
        connectors_markup=md_connectors,
        panel_title="GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: MASTERDATA-SERVICE",
        badge_text="FOUNDATION DOMAIN",
        sections=md_sections,
        stats_footer="Engine: PostgreSQL 16 | Entities: 10 Tables | Geo: WGS84 GeoJSON Polygons | RAG: Versioned Policy Store",
        saga_footer_text="Cung cấp dữ liệu danh mục tĩnh cho toàn bộ 10 microservice còn lại; phát sự kiện HUB.UPDATED, POLICY.PUBLISHED"
    )

    # =========================================================================
    # 3. SHIPMENT-SERVICE (:3002 | shipment_db)
    # =========================================================================
    shipment_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "code", "type": "VARCHAR(32)", "attr": "UNIQUE (NX-123456)"},
        {"key": "", "name": "currentStatus", "type": "ENUM", "attr": "19 STATUSES (CANONICAL OWNER)"},
        {"key": "", "name": "isLocked", "type": "BOOLEAN", "attr": "KHÓA ĐƠN TRÁNH ĐUA LỆNH"},
        {"key": "DIST", "name": "createdByUserId", "type": "VARCHAR(64)", "attr": "FK-dist auth.users"},
        {"key": "", "name": "createdByType", "type": "VARCHAR(32)", "attr": "MERCHANT / GUEST"},
        {"key": "", "name": "receiverPhone", "type": "VARCHAR(20)", "attr": "INDEX [PII]"},
        {"key": "", "name": "pickupLat / pickupLng", "type": "FLOAT", "attr": "GPS ĐIỂM GỬI"},
        {"key": "", "name": "deliveryLat / deliveryLng", "type": "FLOAT", "attr": "GPS ĐIỂM GIAO"},
        {"key": "", "name": "metadata", "type": "JSONB", "attr": "ITEMS, WEIGHT, DIMS, COD"},
        {"key": "", "name": "cancellationReason", "type": "TEXT", "attr": "LÝ DO HỦY ĐƠN"},
        {"key": "", "name": "createdAt / updatedAt", "type": "TIMESTAMP", "attr": "INDEX"}
    ]
    t_shp, _ = render_table(20, 20, 470, "Shipment (shipments)", "VẬN ĐƠN BƯU CHÍNH", shipment_cols, "#065F46")

    change_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK -> shipments.code"},
        {"key": "", "name": "requestType", "type": "VARCHAR(64)", "attr": "CHANGE_ADDRESS, COD..."},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "DỮ LIỆU ĐỀ XUẤT ĐỔI"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, APPROVED..."},
        {"key": "DIST", "name": "requestedBy / approvedBy", "type": "VARCHAR", "attr": "FK-dist auth.users"},
        {"key": "", "name": "approvedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM DUYỆT"}
    ]
    t_chg, _ = render_table(510, 20, 470, "ChangeRequest", "YÊU CẦU ĐỔI ĐỊA CHỈ/COD", change_cols, "#047857")

    inv_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "investigationCode", "type": "VARCHAR(32)", "attr": "UNIQUE (INV-2026-001)"},
        {"key": "FK", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK -> shipments.code"},
        {"key": "DIST", "name": "originHubCode / destHubCode", "type": "VARCHAR", "attr": "FK-dist masterdata"},
        {"key": "", "name": "declaredValue / WeightKg", "type": "FLOAT", "attr": "GIÁ TRỊ & CÂN NẶNG"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "ANALYZING, IN_HEARING..."},
        {"key": "", "name": "priority / breakPointType", "type": "ENUM", "attr": "CRITICAL, LOSS..."},
        {"key": "", "name": "suspectPartyType / Name", "type": "VARCHAR", "attr": "ĐỐI TƯỢNG NGHI VẤN"},
        {"key": "", "name": "confidenceScorePercent", "type": "INT", "attr": "ĐỘ TIN CẬY AI (%)"},
        {"key": "", "name": "suggestedRootCause", "type": "ENUM", "attr": "NGUYÊN NHÂN GỐC"},
        {"key": "", "name": "suggestedCompensationAmount", "type": "FLOAT", "attr": "ĐỀ XUẤT ĐỀN BÙ"}
    ]
    t_inv, _ = render_table(20, 365, 470, "InvestigationCase", "HỒ SƠ ĐIỀU TRA SỰ CỐ", inv_cols, "#064E3B")

    inv_scan_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "investigationCaseId", "type": "CUID", "attr": "FK -> investigations"},
        {"key": "", "name": "timestamp / locationCode", "type": "TIME / VARCHAR", "attr": "ĐỊA ĐIỂM QUÉT"},
        {"key": "", "name": "action / operator", "type": "VARCHAR", "attr": "THAO TÁC / NHÂN SỰ"},
        {"key": "", "name": "recordedWeightKg / DeltaKg", "type": "FLOAT", "attr": "ĐỘ LỆCH CÂN NẶNG"},
        {"key": "", "name": "isBreakPoint / anomalyNote", "type": "BOOL / TEXT", "attr": "ĐIỂM GÃY BƯU GỬI"}
    ]
    t_iscan, _ = render_table(510, 280, 470, "InvestigationAuditScan", "VẾT QUÉT ĐIỀU TRA", inv_scan_cols, "#047857")

    disp_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "investigationCaseId", "type": "CUID", "attr": "FK -> investigations"},
        {"key": "", "name": "submittedBy / partyName", "type": "VARCHAR", "attr": "BƯU CỤC GIẢI TRÌNH"},
        {"key": "", "name": "cctvVideoUrl / timestamp", "type": "VARCHAR / RANGE", "attr": "BẰNG CHỨNG CAMERA"},
        {"key": "", "name": "handoverSlipUrl / notes", "type": "VARCHAR / TEXT", "attr": "BIÊN BẢN BÀN GIAO"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, ACCEPTED..."}
    ]
    t_disp, _ = render_table(510, 500, 470, "InvestigationDispute", "BẰNG CHỨNG GIẢI TRÌNH", disp_cols, "#047857")

    claim_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "claimCode", "type": "VARCHAR(32)", "attr": "UNIQUE (CLM-2026-001)"},
        {"key": "FK", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK -> shipments.code"},
        {"key": "", "name": "incidentType", "type": "ENUM", "attr": "DAMAGED, LOST..."},
        {"key": "", "name": "declaredValue / codAmount", "type": "FLOAT", "attr": "GIÁ TRỊ ĐƠN HÀNG"},
        {"key": "", "name": "claimRequestedAmount", "type": "FLOAT", "attr": "SỐ TIỀN KHÁCH ĐÒI"},
        {"key": "", "name": "approvedCompensationAmount", "type": "FLOAT", "attr": "SỐ TIỀN DUYỆT ĐỀN"},
        {"key": "", "name": "penaltyAmount", "type": "FLOAT", "attr": "TIỀN PHẠT ĐƠN VỊ LỖI"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "LIABILITY_DETERMINED..."},
        {"key": "", "name": "responsibleParty / Entity", "type": "VARCHAR", "attr": "BÊN CHỊU TRÁCH NHIỆM"},
        {"key": "", "name": "liabilityRatioPercent", "type": "INT", "attr": "TỶ LỆ LỖI (%)"},
        {"key": "", "name": "rootCause", "type": "ENUM", "attr": "NGUYÊN NHÂN SỰ CỐ"}
    ]
    t_clm, _ = render_table(20, 720, 470, "CompensationClaim", "HỒ SƠ BỒI THƯỜNG", claim_cols, "#065F46")

    s_outbox_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType / routingKey", "type": "VARCHAR", "attr": "SHIPMENT.CREATED, ..."},
        {"key": "", "name": "aggregateType / aggregateId", "type": "VARCHAR", "attr": "Shipment / code"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "SNAPSHOT ĐƠN HÀNG"}
    ]
    t_sout, _ = render_table(510, 740, 470, "OutboxEvent (Shipment)", "outbox_events", s_outbox_cols, "#475569")

    shp_connectors = '''
    <path d="M 490 60 L 510 60" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <path d="M 250 340 L 250 365" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <path d="M 490 395 L 510 395" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <path d="M 490 495 L 500 495 L 500 555 L 510 555" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <path d="M 250 685 L 250 720" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    '''

    shp_sections = [
        {
            "title": "VAI TRÒ & QUYỀN SỞ HỮU TRẠNG THÁI VẬN ĐƠN (CANONICAL STATUS OWNER)",
            "bullets": [
                '<tspan class="panel-bold">Chủ quyền trạng thái duy nhất:</tspan> <tspan class="panel-code">shipment-service</tspan> là nơi duy nhất giữ chân lý (Single Source of Truth) cho trạng thái đơn qua 19 trạng thái máy FSM.',
                '<tspan class="panel-bold">Khóa bi quan (Pessimistic Lock):</tspan> Cờ <tspan class="panel-code">isLocked = true</tspan> tự động kích hoạt khi có yêu cầu đổi địa chỉ hoặc điều tra sự cố để ngăn chặn tài xế tiếp tục phát hàng.',
                '<tspan class="panel-bold">Xử lý yêu cầu thay đổi (ChangeRequest):</tspan> Cho phép Shop đổi SĐT, địa chỉ nhận hoặc tiền COD trước khi bưu kiện xuất kho giao chặng cuối.'
            ]
        },
        {
            "title": "QUY TRÌNH ĐIỀU TRA ĐIỂM GÃY (BREAKPOINT ANALYSIS) & BỒI THƯỜNG",
            "bullets": [
                '<tspan class="panel-bold">Xác định điểm gãy:</tspan> Khi phát hiện bưu kiện chênh lệch cân nặng hoặc thất lạc, tạo <tspan class="panel-code">InvestigationCase</tspan> quét ngược toàn bộ lịch sử quét qua <tspan class="panel-code">investigation_audit_scans</tspan>.',
                '<tspan class="panel-bold">Cơ chế đối tụng nội bộ (Dispute Hearing):</tspan> Các đơn vị liên quan (Bưu cục gửi, Đội xe Linehaul, Bưu cục phát) nộp video camera và biên bản bàn giao giải trình.',
                '<tspan class="panel-bold">Xử lý khiếu nại bồi thường:</tspan> Bảng <tspan class="panel-code">compensation_claims</tspan> phân bổ tỷ lệ lỗi và phạt trừ trực tiếp vào tài khoản bưu cục vi phạm.'
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                '<tspan class="panel-code">shipmentCode</tspan>: Khóa phân tán xuyên suốt toàn hệ thống liên kết tới 10 microservice còn lại.',
                '<tspan class="panel-code">createdByUserId</tspan>: Ánh xạ chủ đơn sang tài khoản <tspan class="panel-code">auth.users</tspan> để đối chiếu quyền hạn.'
            ]
        }
    ]

    build_standalone_svg(
        filename="03-shipment-service-erd.svg",
        width=2000, height=1350,
        svc_name="3. SHIPMENT-SERVICE (DỊCH VỤ VẬN ĐƠN, KHIẾU NẠI & ĐIỀU TRA SỰ CỐ)",
        port_str="3002", db_str="shipment_db",
        desc_str="Trọng tâm nghiệp vụ: Máy trạng thái 19 bước FSM, Điều tra thất lạc điểm gãy & Quyết toán bồi thường",
        color_accent="#059669",
        tables_markup=t_shp + "\n" + t_chg + "\n" + t_inv + "\n" + t_iscan + "\n" + t_disp + "\n" + t_clm + "\n" + t_sout,
        connectors_markup=shp_connectors,
        panel_title="GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: SHIPMENT-SERVICE",
        badge_text="CORE AGGREGATE ROOT",
        sections=shp_sections,
        stats_footer="Engine: shipment_db (PostgreSQL) | Canonical State Machine: 19 Statuses | Lock: Pessimistic Concurrency",
        saga_footer_text="Phát sinh khóa nghiệp vụ trung tâm shipmentCode kết nối toàn bộ luồng gom, vận chuyển, giao hàng và đối soát tiền"
    )

    # =========================================================================
    # 4. PICKUP-SERVICE (:3003 | pickup_db)
    # =========================================================================
    pickup_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "pickupCode", "type": "VARCHAR(32)", "attr": "UNIQUE (PKP-001)"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "REQUESTED, APPROVED..."},
        {"key": "", "name": "requesterName", "type": "VARCHAR(128)", "attr": "TÊN CHỦ SHOP"},
        {"key": "", "name": "contactPhone", "type": "VARCHAR(20)", "attr": "SĐT LIÊN HỆ [PII]"},
        {"key": "", "name": "pickupAddress", "type": "TEXT", "attr": "ĐỊA CHỈ KHO GOM"},
        {"key": "", "name": "pickupLatitude / Longitude", "type": "FLOAT", "attr": "GPS VỊ TRÍ GOM"},
        {"key": "DIST", "name": "approvedBy", "type": "VARCHAR(64)", "attr": "FK-dist auth.users"},
        {"key": "", "name": "approvedAt / completedAt", "type": "TIMESTAMP", "attr": "MỐC THỜI GIAN"}
    ]
    t_pck, _ = render_table(20, 20, 470, "PickupRequest", "PHIẾU YÊU CẦU GOM", pickup_cols, "#B45309")

    pitem_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "pickupRequestId", "type": "CUID", "attr": "FK -> pickup_requests.id"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "", "name": "quantity", "type": "INT", "attr": "SỐ LƯỢNG GOM"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    t_pitem, _ = render_table(510, 20, 470, "PickupItem", "KIỆN HÀNG CẦN GOM", pitem_cols, "#B45309")

    p_outbox_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType / routingKey", "type": "VARCHAR(64)", "attr": "PICKUP.APPROVED, ..."},
        {"key": "", "name": "aggregateType / aggregateId", "type": "VARCHAR(64)", "attr": "PickupRequest / id"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "DATA GOM HÀNG"}
    ]
    t_pout, _ = render_table(510, 210, 470, "OutboxEvent (Pickup)", "outbox_events", p_outbox_cols, "#475569")

    pck_connectors = '''
    <path d="M 490 60 L 510 60" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    '''

    pck_sections = [
        {
            "title": "VAI TRÒ & QUY TRÌNH GOM HÀNG ĐẦU VÀO (FIRST-MILE PICKUP)",
            "bullets": [
                '<tspan class="panel-bold">Tiếp nhận yêu cầu gom:</tspan> Merchant gom hàng chục bưu kiện thành 1 yêu cầu gom mang mã <tspan class="panel-code">pickupCode</tspan>.',
                '<tspan class="panel-bold">Phê duyệt điều phối:</tspan> Khi điều phối viên duyệt đơn gom, trạng thái chuyển <tspan class="panel-code">APPROVED</tspan> và bắn sự kiện tạo nhiệm vụ sang dispatch-service.',
                '<tspan class="panel-bold">Hoàn tất gom tận nơi:</tspan> Tài xế đến kho shop quét nhận mã từng kiện, hoàn thành gom hàng chuyển sang <tspan class="panel-code">COMPLETED</tspan>.'
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                '<tspan class="panel-code">shipmentCode</tspan>: Danh mục các mã vận đơn cấu thành lô gom trong bảng <tspan class="panel-code">pickup_items</tspan>.',
                '<tspan class="panel-code">pickupRequestId</tspan>: Khóa tham chiếu để <tspan class="panel-code">dispatch-service</tspan> giao việc cho tài xế đến lấy.'
            ]
        }
    ]

    build_standalone_svg(
        filename="04-pickup-service-erd.svg",
        width=2000, height=880,
        svc_name="4. PICKUP-SERVICE (DỊCH VỤ THU GOM HÀNG ĐẦU VÀO)",
        port_str="3003", db_str="pickup_db",
        desc_str="Tiếp nhận yêu cầu gom hàng theo lô từ Merchant & điều phối Courier lấy hàng tận nơi",
        color_accent="#D97706",
        tables_markup=t_pck + "\n" + t_pitem + "\n" + t_pout,
        connectors_markup=pck_connectors,
        panel_title="GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: PICKUP-SERVICE",
        badge_text="FIRST-MILE PICKUP",
        sections=pck_sections,
        stats_footer="Engine: pickup_db (PostgreSQL 16) | Pattern: Batch Aggregation | Events: PICKUP.APPROVED, PICKUP.COMPLETED",
        saga_footer_text="Bắn sự kiện PICKUP.APPROVED sang dispatch-service để tự động phân bổ tài xế theo khu vực"
    )

    # =========================================================================
    # 5. DISPATCH-SERVICE (:3004 | dispatch_db)
    # =========================================================================
    task_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "taskCode", "type": "VARCHAR(32)", "attr": "UNIQUE (TSK-2026-001)"},
        {"key": "", "name": "taskType", "type": "ENUM", "attr": "PICKUP, DELIVERY, RETURN"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "CREATED, ASSIGNED, COMPLETED"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "DIST", "name": "pickupRequestId", "type": "VARCHAR(32)", "attr": "FK-dist pickup_requests"},
        {"key": "", "name": "note", "type": "TEXT", "attr": "GHI CHÚ GIAO HÀNG"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    t_tsk, _ = render_table(20, 20, 470, "Task (tasks)", "NHIỆM VỤ COURIER", task_cols, "#6D28D9")

    task_asgn_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "taskId", "type": "CUID", "attr": "FK -> tasks.id"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "FK-dist auth.users"},
        {"key": "", "name": "assignedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM GÁN"},
        {"key": "", "name": "unassignedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM ĐỔI TÀI XẾ"}
    ]
    t_tasgn, _ = render_table(510, 20, 470, "TaskAssignment", "LỊCH SỬ GÁN TÀI XẾ", task_asgn_cols, "#6D28D9")

    d_audit_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "actorId / actorUsername", "type": "VARCHAR(64)", "attr": "ĐIỀU PHỐI VIÊN"},
        {"key": "", "name": "action / targetType", "type": "VARCHAR(64)", "attr": "ASSIGN_TASK, REASSIGN"},
        {"key": "", "name": "targetId / ipAddress", "type": "VARCHAR(64)", "attr": "NULLABLE"},
        {"key": "", "name": "before / after", "type": "JSONB", "attr": "AUDIT DIFF"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "INDEX"}
    ]
    t_daud, _ = render_table(20, 280, 470, "OpsAuditLog (Dispatch)", "ops_audit_logs", d_audit_cols, "#475569")

    d_outbox_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType / routingKey", "type": "VARCHAR(64)", "attr": "TASK.ASSIGNED, ..."},
        {"key": "", "name": "aggregateType / aggregateId", "type": "VARCHAR(64)", "attr": "Task / id"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "TASK PAYLOAD"}
    ]
    t_dout2, _ = render_table(510, 220, 470, "OutboxEvent (Dispatch)", "outbox_events", d_outbox_cols, "#475569")

    dsp_connectors = '''
    <path d="M 490 60 L 510 60" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    '''

    dsp_sections = [
        {
            "title": "VAI TRÒ ĐIỀU PHỐI NHIỆM VỤ TỰ ĐỘNG (DISPATCH MANAGEMENT)",
            "bullets": [
                '<tspan class="panel-bold">Phân công 3 loại nhiệm vụ:</tspan> Quản lý tập trung: <tspan class="panel-code">PICKUP</tspan> (Gom hàng shop), <tspan class="panel-code">DELIVERY</tspan> (Phát hàng cho khách), <tspan class="panel-code">RETURN</tspan> (Chuyển hoàn).',
                '<tspan class="panel-bold">Lịch sử điều chuyển (Re-assignment):</tspan> Bảng <tspan class="panel-code">task_assignments</tspan> cho phép đổi tài xế nếu Courier bị sự cố xe cộ mà vẫn bảo toàn lịch sử bàn giao.'
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                '<tspan class="panel-code">courierId</tspan>: Ánh xạ tài xế di động nhận việc trên mobile app.',
                '<tspan class="panel-code">shipmentCode / pickupRequestId</tspan>: Khóa liên kết đối tượng cần giao hoặc cần lấy.'
            ]
        }
    ]

    build_standalone_svg(
        filename="05-dispatch-service-erd.svg",
        width=2000, height=880,
        svc_name="5. DISPATCH-SERVICE (DỊCH VỤ ĐIỀU PHỐI NHIỆM VỤ COURIER)",
        port_str="3004", db_str="dispatch_db",
        desc_str="Phân bổ và điều phối nhiệm vụ gom/phát/hoàn cho tài xế theo khu vực địa bàn",
        color_accent="#7C3AED",
        tables_markup=t_tsk + "\n" + t_tasgn + "\n" + t_daud + "\n" + t_dout2,
        connectors_markup=dsp_connectors,
        panel_title="GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: DISPATCH-SERVICE",
        badge_text="TASK DISPATCHING",
        sections=dsp_sections,
        stats_footer="Engine: dispatch_db (PostgreSQL 16) | Task Types: PICKUP, DELIVERY, RETURN | Audit: Full Ops Log",
        saga_footer_text="Bắn sự kiện TASK.ASSIGNED thông báo đẩy (Push Notification) đến Courier Mobile App"
    )

    # =========================================================================
    # 6. MANIFEST-SERVICE (:3005 | manifest_db)
    # =========================================================================
    mnf_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "manifestCode", "type": "VARCHAR(32)", "attr": "UNIQUE (MNF-2026-001)"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "CREATED, SEALED, RECEIVED"},
        {"key": "DIST", "name": "originHubCode", "type": "VARCHAR(32)", "attr": "FK-dist masterdata.hubs"},
        {"key": "DIST", "name": "destinationHubCode", "type": "VARCHAR(32)", "attr": "FK-dist masterdata.hubs"},
        {"key": "", "name": "note", "type": "TEXT", "attr": "GHI CHÚ CHUYẾN XE"},
        {"key": "", "name": "sealedAt / receivedAt", "type": "TIMESTAMP", "attr": "MỐC BÀN GIAO"},
        {"key": "", "name": "createdAt / updatedAt", "type": "TIMESTAMP", "attr": "INDEX"}
    ]
    t_mnf, _ = render_table(20, 20, 470, "Manifest (manifests)", "BẢNG KÊ LIÊN BƯU CỤC", mnf_cols, "#0E7490")

    mnf_item_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "manifestId", "type": "CUID", "attr": "FK -> manifests.id CASCADE"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    t_mitem, _ = render_table(510, 20, 470, "ManifestItem", "DANH SÁCH KIỆN TRONG BẢNG KÊ", mnf_item_cols, "#0891B2")

    seal_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "manifestId", "type": "CUID", "attr": "UNIQUE FK -> manifests.id"},
        {"key": "DIST", "name": "sealedBy", "type": "VARCHAR(64)", "attr": "FK-dist auth.users"},
        {"key": "", "name": "note", "type": "VARCHAR(255)", "attr": "MÃ CHÌ SEAL TRUCK"},
        {"key": "", "name": "sealedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM NIÊM PHONG"}
    ]
    t_seal, _ = render_table(20, 280, 470, "SealRecord", "BIÊN BẢN NIÊM PHONG KẸP CHÌ", seal_cols, "#155E75")

    recv_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "manifestId", "type": "CUID", "attr": "UNIQUE FK -> manifests.id"},
        {"key": "DIST", "name": "receivedBy", "type": "VARCHAR(64)", "attr": "FK-dist auth.users"},
        {"key": "", "name": "note", "type": "VARCHAR(255)", "attr": "TÌNH TRẠNG KẸP CHÌ XE"},
        {"key": "", "name": "receivedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM MỞ NIÊM PHONG"}
    ]
    t_recv, _ = render_table(510, 200, 470, "ReceiveRecord", "BIÊN BẢN NHẬN BẢNG KÊ ĐÍCH", recv_cols, "#155E75")

    m_outbox_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType / routingKey", "type": "VARCHAR(64)", "attr": "MANIFEST.SEALED, ..."},
        {"key": "", "name": "aggregateType / aggregateId", "type": "VARCHAR(64)", "attr": "Manifest / id"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "DANH SÁCH MÃ VẬN ĐƠN"}
    ]
    t_mout, _ = render_table(510, 395, 470, "OutboxEvent (Manifest)", "outbox_events", m_outbox_cols, "#475569")

    mnf_connectors = '''
    <path d="M 490 60 L 510 60" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <path d="M 250 245 L 250 280" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>
    <path d="M 490 120 L 500 120 L 500 230 L 510 230" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>
    '''

    mnf_sections = [
        {
            "title": "VAI TRÒ VẬN CHUYỂN TRUNG CHUYỂN ĐƯỜNG TRỤC (MIDDLE-MILE LINEHAUL)",
            "bullets": [
                '<tspan class="panel-bold">Gom kiện theo lô:</tspan> Khi hàng xuất kho trung chuyển, hàng trăm kiện được đóng vào bao tải hoặc container có chung <tspan class="panel-code">manifestCode</tspan>.',
                '<tspan class="panel-bold">Quy trình kẹp chì niêm phong (Seal):</tspan> Nhân viên bưu cục xuất ghi nhận số niêm phong kẹp chì vào <tspan class="panel-code">seal_records</tspan>, chuyển trạng thái <tspan class="panel-code">SEALED</tspan>.',
                '<tspan class="panel-bold">Mở niêm phong &amp; Bàn giao đích:</tspan> Bưu cục nhận kiểm tra tính nguyên vẹn của kẹp chì trước khi quét nhận vào <tspan class="panel-code">receive_records</tspan>.'
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                '<tspan class="panel-code">originHubCode / destinationHubCode</tspan>: Khóa tham chiếu xác định tuyến vận chuyển từ Bưu cục A sang Bưu cục B.',
                '<tspan class="panel-code">shipmentCode</tspan>: Mảng bưu phẩm nằm trong lô, khi bảng kê được niêm phong, toàn bộ đơn hàng đồng loạt chuyển trạng thái <tspan class="panel-code">MANIFEST_SEALED / IN_TRANSIT</tspan>.'
            ]
        },
        {
            "title": "QUY TẮC TOÀN VẸN & TRUY VẾT PHÁP LÝ",
            "bullets": [
                '<tspan class="panel-bold">Quan hệ 1-1 bắt buộc:</tspan> Mỗi bảng kê chỉ có duy nhất 1 bản ghi niêm phong và 1 bản ghi mở bao nhận hàng để gắn chặt trách nhiệm cá nhân điều phối viên.'
            ]
        }
    ]

    build_standalone_svg(
        filename="06-manifest-service-erd.svg",
        width=2000, height=1050,
        svc_name="6. MANIFEST-SERVICE (DỊCH VỤ BẢNG KÊ & VẬN CHUYỂN ĐƯỜNG TRỤC - LINEHAUL)",
        port_str="3005", db_str="manifest_db",
        desc_str="Đóng chuyến thư, kẹp chì niêm phong xe tải (Seal) & bàn giao trung chuyển liên bưu cục",
        color_accent="#0891B2",
        tables_markup=t_mnf + "\n" + t_mitem + "\n" + t_seal + "\n" + t_recv + "\n" + t_mout,
        connectors_markup=mnf_connectors,
        panel_title="GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: MANIFEST-SERVICE",
        badge_text="LINEHAUL LOGISTICS",
        sections=mnf_sections,
        stats_footer="Engine: manifest_db (PostgreSQL 16) | Seal: Physical Truck Lead Seal | Dispatch: Inter-hub Linehaul",
        saga_footer_text="Bắn sự kiện MANIFEST.SEALED đồng loạt cập nhật trạng thái IN_TRANSIT cho hàng trăm vận đơn trong lô"
    )

    # =========================================================================
    # 7. SCAN-SERVICE (:3006 | scan_db)
    # =========================================================================
    scan_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "", "name": "scanType", "type": "ENUM", "attr": "PICKUP, INBOUND, OUTBOUND"},
        {"key": "DIST", "name": "locationCode", "type": "VARCHAR(32)", "attr": "FK-dist masterdata.hubs"},
        {"key": "DIST", "name": "manifestCode", "type": "VARCHAR(32)", "attr": "FK-dist manifests"},
        {"key": "", "name": "idempotencyKey", "type": "VARCHAR(64)", "attr": "UNIQUE (CHỐNG TRÙNG)"},
        {"key": "", "name": "occurredAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM QUÉT"}
    ]
    t_scan, _ = render_table(20, 20, 470, "ScanEvent", "SỰ KIỆN QUÉT BƯU PHẨM", scan_cols, "#0D9488")

    loc_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "UNIQUE (VỊ TRÍ HIỆN TẠI)"},
        {"key": "", "name": "locationCode / lastScanType", "type": "VARCHAR / ENUM", "attr": "BƯU CỤC MỚI NHẤT"},
        {"key": "DIST", "name": "courierId / taskId", "type": "VARCHAR", "attr": "TÀI XẾ ĐANG GIỮ"},
        {"key": "", "name": "latitude / longitude", "type": "FLOAT", "attr": "TỌA ĐỘ GPS WGS84"},
        {"key": "", "name": "source", "type": "ENUM", "attr": "GPS, SCAN, MANUAL"}
    ]
    t_loc, _ = render_table(510, 20, 470, "CurrentLocation", "VỊ TRÍ BƯU KIỆN REALTIME", loc_cols, "#0D9488")

    cloc_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "UNIQUE (GPS TÀI XẾ)"},
        {"key": "DIST", "name": "taskId / shipmentCode", "type": "VARCHAR", "attr": "ĐANG GIAO ĐƠN NÀO"},
        {"key": "", "name": "latitude / longitude / accuracy", "type": "FLOAT", "attr": "GPS & ĐỘ CHÍNH XÁC (M)"},
        {"key": "", "name": "capturedAt", "type": "TIMESTAMP", "attr": "THỜI GIAN NHẬN GPS"}
    ]
    t_cloc, _ = render_table(20, 250, 470, "CourierCurrentLocation", "GPS TÀI XẾ TRỰC TIẾP", cloc_cols, "#0F766E")

    cloc_hist_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "INDEX (TÀI XẾ)"},
        {"key": "", "name": "latitude / longitude", "type": "FLOAT", "attr": "VẾT GPS DI CHUYỂN"},
        {"key": "", "name": "capturedAt", "type": "TIMESTAMP", "attr": "INDEX THỜI GIAN"}
    ]
    t_chist, _ = render_table(510, 230, 470, "CourierLocationHistory", "LỊCH SỬ TUYẾN DI CHUYỂN", cloc_hist_cols, "#0F766E")

    scan_sections = [
        {
            "title": "HỆ THỐNG QUÉT MÃ BĂM NHỎ & ĐỊNH VỊ REALTIME (SCAN-SERVICE)",
            "bullets": [
                '<tspan class="panel-bold">Chống trùng lặp tuyệt đối (Idempotency):</tspan> Sử dụng <tspan class="panel-code">idempotencyKey</tspan> duy nhất trong mỗi sự kiện quét. Ngăn chặn việc nhân viên bấm quét 2 lần liên tiếp làm sai lệch dòng trạng thái.',
                '<tspan class="panel-bold">Vị trí tức thời (Read-optimized):</tspan> Bảng <tspan class="panel-code">CurrentLocation</tspan> được cập nhật mỗi khi phát sinh quét mã hoặc tín hiệu GPS từ điện thoại Courier để phục vụ bản đồ theo dõi Live Tracking.'
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                '<tspan class="panel-code">courierId</tspan>: Khóa liên kết tài xế nhận việc và phát tín hiệu GPS trực tiếp.',
                '<tspan class="panel-code">locationCode</tspan>: Mã bưu cục quét kiểm nhập/xuất kho liên kết sang <tspan class="panel-code">masterdata.hubs</tspan>.'
            ]
        }
    ]

    build_standalone_svg(
        filename="07-scan-service-erd.svg",
        width=2000, height=880,
        svc_name="7. SCAN-SERVICE (DỊCH VỤ QUÉT MÃ BĂM NHỎ & ĐỊNH VỊ REALTIME)",
        port_str="3006", db_str="scan_db",
        desc_str="Ghi nhận sự kiện quét bưu kiện tại bưu cục & theo dõi tọa độ GPS di chuyển thời gian thực",
        color_accent="#0D9488",
        tables_markup=t_scan + "\n" + t_loc + "\n" + t_cloc + "\n" + t_chist,
        connectors_markup="",
        panel_title="GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: SCAN-SERVICE",
        badge_text="SCAN & GPS ENGINE",
        sections=scan_sections,
        stats_footer="Engine: scan_db (PostgreSQL 16) | Idempotency: Unique UUID | Location: Realtime WGS84 GPS",
        saga_footer_text="Bắn sự kiện SCAN.INBOUND / SCAN.OUTBOUND tới tracking-service để ghi vết dòng thời gian kiện hàng"
    )

    # =========================================================================
    # 8. DELIVERY-SERVICE (:3007 | delivery_db)
    # =========================================================================
    dlv_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "DIST", "name": "taskId / courierId", "type": "VARCHAR(64)", "attr": "FK-dist dispatch / auth"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "ATTEMPTED, DELIVERED, FAILED"},
        {"key": "DIST", "name": "failReasonCode", "type": "VARCHAR(32)", "attr": "FK-dist masterdata.ndr"},
        {"key": "", "name": "note", "type": "TEXT", "attr": "GHI CHÚ LẦN GIAO"},
        {"key": "", "name": "occurredAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM GIAO"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    t_dlv, _ = render_table(20, 20, 470, "DeliveryAttempt", "LẦN GIAO HÀNG", dlv_cols, "#BE123C")

    pod_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "deliveryAttemptId", "type": "CUID", "attr": "UNIQUE FK -> DeliveryAttempt"},
        {"key": "", "name": "imageUrl", "type": "VARCHAR(255)", "attr": "ẢNH CHỤP GIAO HÀNG"},
        {"key": "DIST", "name": "capturedBy", "type": "VARCHAR(64)", "attr": "FK-dist auth.users"},
        {"key": "", "name": "capturedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM CHỤP"}
    ]
    t_pod, _ = render_table(510, 20, 470, "Pod (Proof of Delivery)", "BẰNG CHỨNG PHÁT THÀNH CÔNG", pod_cols, "#BE123C")

    otp_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "", "name": "otpCode", "type": "VARCHAR(10)", "attr": "MÃ OTP XÁC NHẬN GIAO"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "SENT, VERIFIED"},
        {"key": "", "name": "sentAt / verifiedAt", "type": "TIMESTAMP", "attr": "MỐC XÁC THỰC"}
    ]
    t_otp, _ = render_table(510, 190, 470, "OtpRecord", "XÁC NHẬN MÃ OTP", otp_cols, "#E11D48")

    ndr_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "FK", "name": "deliveryAttemptId", "type": "CUID", "attr": "FK -> DeliveryAttempt.id"},
        {"key": "DIST", "name": "reasonCode", "type": "VARCHAR(32)", "attr": "FK-dist masterdata.ndr"},
        {"key": "", "name": "issueType / Category", "type": "VARCHAR", "attr": "KHONG_LIEN_LAC_DUOC..."},
        {"key": "", "name": "attachments", "type": "JSONB", "attr": "ẢNH CUỘC GỌI, GHI ÂM"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "RESCHEDULED, RETURN..."},
        {"key": "", "name": "rescheduleAt", "type": "TIMESTAMP", "attr": "HẸN GIAO LẠI LẦN TIẾP"}
    ]
    t_ndrc, _ = render_table(20, 275, 470, "NdrCase", "HỒ SƠ SỰ CỐ GIAO (NDR)", ndr_cols, "#9F1239")

    ret_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "FK", "name": "ndrCaseId", "type": "CUID", "attr": "UNIQUE FK -> NdrCase"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "STARTED, COMPLETED"},
        {"key": "", "name": "startedAt / completedAt", "type": "TIMESTAMP", "attr": "MỐC CHUYỂN HOÀN"}
    ]
    t_ret, _ = render_table(510, 365, 470, "ReturnCase", "QUY TRÌNH CHUYỂN HOÀN", ret_cols, "#9F1239")

    d_outbox_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType / routingKey", "type": "VARCHAR(64)", "attr": "DELIVERY.DELIVERED, ..."},
        {"key": "", "name": "aggregateType / aggregateId", "type": "VARCHAR(64)", "attr": "DeliveryAttempt / id"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "POD & COD COLLECTED"}
    ]
    t_dout, _ = render_table(510, 530, 470, "OutboxEvent (Delivery)", "outbox_events", d_outbox_cols, "#475569")

    dlv_connectors = '''
    <path d="M 490 60 L 510 60" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>
    <path d="M 250 245 L 250 275" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <path d="M 490 395 L 510 395" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>
    '''

    dlv_sections = [
        {
            "title": "VAI TRÒ PHÁT HÀNG CHẶNG CUỐI & BẢO ĐẢM PHÁP LÝ (LAST-MILE)",
            "bullets": [
                '<tspan class="panel-bold">Bằng chứng giao hàng (POD):</tspan> Lưu trữ ảnh chụp người nhận hoặc vị trí đặt bưu phẩm tại <tspan class="panel-code">pods</tspan> để giải quyết tranh chấp sau phát.',
                '<tspan class="panel-bold">Xác thực OTP 2 lớp:</tspan> Đối với đơn hàng giá trị cao hoặc hàng cồng kềnh, Courier bắt buộc phải nhập mã OTP gửi tới máy khách hàng vào <tspan class="panel-code">otp_records</tspan>.'
            ]
        },
        {
            "title": "QUY TRÌNH XỬ LÝ SỰ CỐ GIAO KHÔNG THÀNH (NDR) & CHUYỂN HOÀN",
            "bullets": [
                '<tspan class="panel-bold">Tối đa 3 lần giao (SLA):</tspan> Khi phát thất bại, hệ thống sinh bản ghi <tspan class="panel-code">NdrCase</tspan> lưu lý do chuẩn hóa và hẹn giờ giao lại <tspan class="panel-code">rescheduleAt</tspan>.',
                '<tspan class="panel-bold">Tự động kích hoạt chuyển hoàn:</tspan> Quá 3 lần giao bất thành hoặc khách từ chối nhận, hệ thống sinh <tspan class="panel-code">ReturnCase</tspan> đưa bưu phẩm vào luồng quay đầu trả shop.'
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                '<tspan class="panel-code">DELIVERY.DELIVERED Event</tspan>: Kích hoạt sang <tspan class="panel-code">payment-service</tspan> tạo trạng thái thu tiền COD và cập nhật <tspan class="panel-code">shipment.currentStatus = DELIVERED</tspan>.'
            ]
        }
    ]

    build_standalone_svg(
        filename="08-delivery-service-erd.svg",
        width=2000, height=1100,
        svc_name="8. DELIVERY-SERVICE (DỊCH VỤ PHÁT HÀNG CHẶNG CUỐI, POD & NDR)",
        port_str="3007", db_str="delivery_db",
        desc_str="Giao hàng tận tay người nhận (Last-mile), bằng chứng POD, OTP xác thực & quy trình sự cố NDR",
        color_accent="#E11D48",
        tables_markup=t_dlv + "\n" + t_pod + "\n" + t_otp + "\n" + t_ndrc + "\n" + t_ret + "\n" + t_dout,
        connectors_markup=dlv_connectors,
        panel_title="GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: DELIVERY-SERVICE",
        badge_text="LAST-MILE FULFILLMENT",
        sections=dlv_sections,
        stats_footer="Engine: delivery_db (PostgreSQL 16) | SLA: 3 Delivery Attempts Max | Verification: Photo POD + SMS OTP",
        saga_footer_text="Bắn sự kiện DELIVERY.DELIVERED kích hoạt luồng thanh toán COD và chuyển shipment sang trạng thái DELIVERED"
    )

    # =========================================================================
    # 9. PAYMENT-SERVICE (:3011 | payment_db)
    # =========================================================================
    cod_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "UNIQUE (FK-dist shipment)"},
        {"key": "DIST", "name": "merchantId", "type": "VARCHAR(64)", "attr": "FK-dist masterdata"},
        {"key": "", "name": "codAmount", "type": "FLOAT", "attr": "TIỀN HÀNG CẦN THU"},
        {"key": "", "name": "paymentMethod", "type": "ENUM", "attr": "COD, BANK_TRANSFER, PREPAID"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, COLLECTED, REMITTED"},
        {"key": "DIST", "name": "hubCode / courierId", "type": "VARCHAR", "attr": "BƯU CỤC & TÀI XẾ THU"},
        {"key": "", "name": "collectedAt / Amount", "type": "TIME / FLOAT", "attr": "TIỀN THỰC THU TỪ KHÁCH"},
        {"key": "", "name": "remittedAt / remittedBy", "type": "TIME / VARCHAR", "attr": "ĐỐI SOÁT VỀ TỔNG CÔNG TY"}
    ]
    t_cod, _ = render_table(20, 20, 470, "CodRecord (cod_records)", "HỒ SƠ THU HỘ COD", cod_cols, "#15803D")

    batch_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "settlementCode", "type": "VARCHAR(32)", "attr": "UNIQUE (SETTLE-2026-001)"},
        {"key": "", "name": "reportDate", "type": "DATE", "attr": "NGÀY ĐỐI SOÁT PHIÊN"},
        {"key": "DIST", "name": "hubCode / courierId", "type": "VARCHAR", "attr": "FK-dist masterdata / auth"},
        {"key": "", "name": "totalAmount", "type": "FLOAT", "attr": "TỔNG TIỀN COURIER PHẢI NỘP"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "WAITING_PAYMENT, PAID..."},
        {"key": "", "name": "qrUrl", "type": "TEXT", "attr": "LINK VIETQR CHUYỂN KHOẢN"},
        {"key": "", "name": "transferMemo", "type": "VARCHAR(64)", "attr": "CÚ PHÁP ĐỐI SOÁT DUY NHẤT"},
        {"key": "", "name": "confirmedAt / confirmedBy", "type": "TIME / VARCHAR", "attr": "KẾ TOÁN XÁC NHẬN"}
    ]
    t_bat, _ = render_table(510, 20, 470, "CodSettlementBatch", "PHIÊN KẾT TOÁN TIỀN TÀI XẾ", batch_cols, "#15803D")

    sitem_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "batchId", "type": "CUID", "attr": "FK -> CodSettlementBatch"},
        {"key": "FK", "name": "codRecordId", "type": "CUID", "attr": "UNIQUE FK -> CodRecord"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "", "name": "amount", "type": "FLOAT", "attr": "TIỀN TỪNG ĐƠN"}
    ]
    t_sitem, _ = render_table(510, 300, 470, "CodSettlementItem", "CHI TIẾT VẬN ĐƠN NỘP TIỀN", sitem_cols, "#166534")

    pay_evt_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "provider / providerEventId", "type": "VARCHAR", "attr": "UNIQUE (PAYOS_WEBHOOK)"},
        {"key": "", "name": "settlementCode / BatchId", "type": "VARCHAR", "attr": "MÃ PHIÊN NỘP TIỀN"},
        {"key": "", "name": "amount / accountNumber", "type": "FLOAT / STR", "attr": "SỐ TIỀN & STK NGÂN HÀNG"},
        {"key": "", "name": "referenceCode / memo", "type": "VARCHAR", "attr": "NỘI DUNG CHUYỂN KHOẢN"},
        {"key": "", "name": "processingStatus", "type": "VARCHAR", "attr": "PROCESSED, DUPLICATE..."}
    ]
    t_pevt, _ = render_table(20, 325, 470, "CodSettlementPaymentEvent", "WEBHOOK BIẾN ĐỘNG SỐ DƯ", pay_evt_cols, "#166534")

    p_out_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType / routingKey", "type": "VARCHAR(64)", "attr": "COD.SETTLED, ..."},
        {"key": "", "name": "aggregateType / aggregateId", "type": "VARCHAR(64)", "attr": "CodSettlementBatch / id"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "DATA QUYẾT TOÁN CHO SHOP"}
    ]
    t_pout2, _ = render_table(510, 475, 470, "OutboxEvent (Payment)", "outbox_events", p_out_cols, "#475569")

    pay_connectors = '''
    <path d="M 745 270 L 745 300" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <path d="M 490 145 L 500 145 L 500 335 L 510 335" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>
    '''

    pay_sections = [
        {
            "title": "VAI TRÒ QUẢN LÝ DÒNG TIỀN THU HỘ (CASH-ON-DELIVERY FINANCIAL MESH)",
            "bullets": [
                '<tspan class="panel-bold">Thu tiền mặt chặng cuối:</tspan> Khi phát hàng thành công, bản ghi <tspan class="panel-code">CodRecord</tspan> ghi nhận số tiền Courier thu hộ từ người nhận.',
                '<tspan class="panel-bold">Chốt ca nộp tiền cuối ngày:</tspan> Điều phối viên bưu cục tổng hợp toàn bộ tiền mặt các đơn giao trong ngày vào một phiên <tspan class="panel-code">CodSettlementBatch</tspan>.'
            ]
        },
        {
            "title": "CÔNG NGHỆ QUYẾT TOÁN TỰ ĐỘNG VIETQR & PAYOS WEBHOOK",
            "bullets": [
                '<tspan class="panel-bold">Tạo mã VietQR động:</tspan> Hệ thống nhúng chính xác số tiền và cú pháp <tspan class="panel-code">transferMemo</tspan> vào mã QR chuẩn ngân hàng NAPAS.',
                '<tspan class="panel-bold">Khớp lệnh tự động (Zero-latency):</tspan> Webhook ngân hàng bắn vào <tspan class="panel-code">cod_settlement_payment_events</tspan>, hệ thống tự động đối chiếu memo để gạch nợ cho Courier trong vòng 2 giây.'
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                '<tspan class="panel-code">COD.SETTLED Event</tspan>: Bắn sang ví điện tử của Merchant, kích hoạt chuyển tiền về tài khoản ngân hàng của chủ shop.'
            ]
        }
    ]

    build_standalone_svg(
        filename="09-payment-service-erd.svg",
        width=2000, height=1050,
        svc_name="9. PAYMENT-SERVICE (DỊCH VỤ THANH TOÁN, ĐỐI SOÁT COD & QUYẾT TOÁN TỰ ĐỘNG)",
        port_str="3011", db_str="payment_db",
        desc_str="Quản lý tiền thu hộ COD, đối soát phiên nộp tiền Courier & quyết toán tự động qua VietQR PayOS",
        color_accent="#16A34A",
        tables_markup=t_cod + "\n" + t_bat + "\n" + t_sitem + "\n" + t_pevt + "\n" + t_pout2,
        connectors_markup=pay_connectors,
        panel_title="GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: PAYMENT-SERVICE",
        badge_text="FINANCIAL SETTLEMENT",
        sections=pay_sections,
        stats_footer="Engine: payment_db (PostgreSQL 16) | Payment Gateway: VietQR PayOS Webhook | Settlement: Zero-Touch Auto Match",
        saga_footer_text="Bắn sự kiện COD.SETTLED kích hoạt giải ngân số dư ví điện tử của Merchant và gửi tin nhắn sao kê"
    )

    # =========================================================================
    # 10. TRACKING-SERVICE (:3008 | tracking_db)
    # =========================================================================
    tl_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType", "type": "VARCHAR(64)", "attr": "MANIFEST, SCAN, DELIVERY..."},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "INDEX (MÃ ĐƠN)"},
        {"key": "", "name": "actor / locationCode", "type": "VARCHAR", "attr": "NGƯỜI LÀM / BƯU CỤC"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "SNAPSHOT DỮ LIỆU"},
        {"key": "", "name": "occurredAt", "type": "TIMESTAMP", "attr": "INDEX TIME"}
    ]
    t_tl, _ = render_table(20, 20, 470, "TimelineEvent", "LỊCH TRÌNH BƯU PHẨM", tl_cols, "#1D4ED8")

    tcurr_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "UNIQUE (READ-MODEL)"},
        {"key": "", "name": "currentStatus / Location", "type": "VARCHAR", "attr": "TRẠNG THÁI HIỆN TẠI"},
        {"key": "", "name": "lastEventType / lastEventAt", "type": "VARCHAR / TIME", "attr": "SỰ KIỆN MỚI NHẤT"},
        {"key": "", "name": "viewPayload", "type": "JSONB", "attr": "DỮ LIỆU ĐÃ CHE PII"}
    ]
    t_tcur, _ = render_table(510, 20, 470, "TrackingCurrent", "BẢN GHI TRA CỨU NHANH", tcurr_cols, "#1D4ED8")

    tidx_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "UNIQUE"},
        {"key": "", "name": "latestEventType", "type": "VARCHAR(64)", "attr": "INDEX LOẠI SỰ KIỆN"},
        {"key": "", "name": "latestEventAt", "type": "TIMESTAMP", "attr": "MỐC SỰ KIỆN GẦN NHẤT"}
    ]
    t_tidx, _ = render_table(510, 230, 470, "TrackingIndex", "CHỈ MỤC TÌM KIẾM NHANH", tidx_cols, "#2563EB")

    trk_sections = [
        {
            "title": "MÔ HÌNH DÒNG SỰ KIỆN BẤT BIẾN (EVENT SOURCING READ-MODEL)",
            "bullets": [
                '<tspan class="panel-bold">Nhật ký bất biến (Append-only):</tspan> Bảng <tspan class="panel-code">TimelineEvent</tspan> lưu giữ toàn bộ các sự kiện xảy ra với bưu phẩm theo đúng trật tự thời gian chính xác.',
                '<tspan class="panel-bold">Bảo mật thông tin cá nhân (PII Masking):</tspan> Bảng <tspan class="panel-code">TrackingCurrent</tspan> tự động che giấu số điện thoại và địa chỉ nhà chi tiết khi trả về cho khách tra cứu công khai (Guest Tracking).'
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                '<tspan class="panel-code">shipmentCode</tspan>: Khóa tìm kiếm chính xác bưu phẩm trên cổng Web và ứng dụng di động.',
                '<tspan class="panel-bold">Đồng bộ từ RabbitMQ:</tspan> Lắng nghe sự kiện từ tất cả các dịch vụ: scan, manifest, dispatch, delivery.'
            ]
        }
    ]

    build_standalone_svg(
        filename="10-tracking-service-erd.svg",
        width=2000, height=850,
        svc_name="10. TRACKING-SERVICE (DỊCH VỤ TRA CỨU HÀNH TRÌNH BƯU PHẨM)",
        port_str="3008", db_str="tracking_db",
        desc_str="Mô hình Event Sourcing Read-Model, lưu vết chuỗi thời gian & bảo vệ dữ liệu cá nhân PI",
        color_accent="#2563EB",
        tables_markup=t_tl + "\n" + t_tcur + "\n" + t_tidx,
        connectors_markup="",
        panel_title="GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: TRACKING-SERVICE",
        badge_text="PUBLIC TRACKING",
        sections=trk_sections,
        stats_footer="Engine: tracking_db (PostgreSQL 16) | Architecture: Event Sourcing CQRS Read Model | Privacy: Automated PII Masking",
        saga_footer_text="Tiếp nhận sự kiện từ toàn bộ hệ thống để xây dựng dòng thời gian lịch trình phục vụ Web/Mobile"
    )

    # =========================================================================
    # 11. REPORTING-SERVICE (:3009 | reporting_db)
    # =========================================================================
    kpi_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "metricDate", "type": "DATE", "attr": "NGÀY THỐNG KÊ"},
        {"key": "DIST", "name": "hubCode / zoneCode / courierCode", "type": "VARCHAR", "attr": "4 ĐỐI TƯỢNG PHÂN TÍCH"},
        {"key": "", "name": "shipmentsCreated / Picked", "type": "INT", "attr": "SỐ ĐƠN TẠO / GOM"},
        {"key": "", "name": "deliveriesDelivered / Failed", "type": "INT", "attr": "GIAO THÀNH CÔNG / THẤT BẠI"},
        {"key": "", "name": "codCollected / codRemitted", "type": "INT", "attr": "TIỀN COD THU / NỘP"}
    ]
    t_kpi, _ = render_table(20, 20, 470, "KpiDaily (reporting_db)", "CHỈ SỐ KPI NGÀY", kpi_cols, "#7E22CE")

    kpim_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "monthKey", "type": "VARCHAR(10)", "attr": "THÁNG THỐNG KÊ (2026-09)"},
        {"key": "DIST", "name": "hubCode / zoneCode / courierCode", "type": "VARCHAR", "attr": "TỔNG HỢP THEO THÁNG"},
        {"key": "", "name": "shipmentsCreated / Picked", "type": "INT", "attr": "TỔNG ĐƠN TẠO / GOM"},
        {"key": "", "name": "deliveriesDelivered / Failed", "type": "INT", "attr": "TỔNG PHÁT THÀNH CÔNG"}
    ]
    t_kpim, _ = render_table(510, 20, 470, "KpiMonthly", "CHỈ SỐ KPI THÁNG", kpim_cols, "#7E22CE")

    proj_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "UNIQUE (CQRS PROJECTION)"},
        {"key": "", "name": "currentStatus / lastEventAt", "type": "VARCHAR / TIME", "attr": "TRẠNG THÁI BÁO CÁO"},
        {"key": "DIST", "name": "courierCode / hubCode", "type": "VARCHAR", "attr": "PHÂN QUYỀN TRUY VẤN"}
    ]
    t_proj, _ = render_table(20, 240, 470, "ShipmentStatusProjection", "BẢN CHIẾU CQRS BÁO CÁO", proj_cols, "#7E22CE")

    agg_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "jobType / jobKey", "type": "VARCHAR", "attr": "UNIQUE JOB TỔNG HỢP"},
        {"key": "", "name": "status / occurredAt", "type": "VARCHAR / TIME", "attr": "TIẾN TRÌNH CRONJOB"}
    ]
    t_agg, _ = render_table(510, 210, 470, "AggregationJob", "LỊCH TRÌNH CRON TÍNH TOÁN", agg_cols, "#581C87")

    rep_sections = [
        {
            "title": "KIẾN TRÚC TÁCH BIỆT TRUY VẤN (CQRS) & BÁO CÁO KINH DOANH BI",
            "bullets": [
                '<tspan class="panel-bold">Không nghẽn DB vận hành:</tspan> Toàn bộ báo cáo KPI và bảng điều khiển của Giám đốc bưu cục đọc từ <tspan class="panel-code">reporting_db</tspan>, tuyệt đối không truy vấn vào các database giao dịch nghiệp vụ.',
                '<tspan class="panel-bold">Tổng hợp đa chiều:</tspan> Thống kê theo ngày, tháng, bưu cục, vùng địa bàn và từng tài xế giúp đánh giá chính xác năng suất lao động và tỷ lệ giao thành công.'
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                '<tspan class="panel-bold">Bản chiếu CQRS:</tspan> Nhận sự kiện đồng bộ từ RabbitMQ để cập nhật số lượng kiện bưu phẩm nhập/xuất kho theo thời gian thực.'
            ]
        }
    ]

    build_standalone_svg(
        filename="11-reporting-service-erd.svg",
        width=2000, height=850,
        svc_name="11. REPORTING-SERVICE (DỊCH VỤ BÁO CÁO THỐNG KÊ & PHÂN TÍCH BI)",
        port_str="3009", db_str="reporting_db",
        desc_str="Kiến trúc CQRS Projections, tổng hợp chỉ số KPI vận hành bưu chính theo ngày và tháng",
        color_accent="#9333EA",
        tables_markup=t_kpi + "\n" + t_kpim + "\n" + t_proj + "\n" + t_agg,
        connectors_markup="",
        panel_title="GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: REPORTING-SERVICE",
        badge_text="BI & KPI ANALYTICS",
        sections=rep_sections,
        stats_footer="Engine: reporting_db (PostgreSQL 16) | Architecture: CQRS Read-Side Projections | Aggregation: Daily/Monthly Multi-dimensional",
        saga_footer_text="Tổng hợp số liệu thống kê bất đồng bộ từ các sự kiện nghiệp vụ toàn hệ thống để hiển thị biểu đồ"
    )

    # =========================================================================
    # 12. PRICING-SERVICE (:3012 | in-memory stateless)
    # =========================================================================
    pricing_entity_cols = [
        {"key": "", "name": "originZoneCode", "type": "VARCHAR(32)", "attr": "VÙNG GỬI"},
        {"key": "", "name": "destZoneCode", "type": "VARCHAR(32)", "attr": "VÙNG NHẬN"},
        {"key": "", "name": "actualWeightKg", "type": "FLOAT", "attr": "CÂN NẶNG THỰC TẾ"},
        {"key": "", "name": "length / width / height", "type": "FLOAT (cm)", "attr": "KÍCH THƯỚC 3 CHIỀU"},
        {"key": "", "name": "volumetricWeightKg", "type": "FLOAT", "attr": "(L*W*H)/5000 IATA"},
        {"key": "", "name": "chargeableWeightKg", "type": "FLOAT", "attr": "MAX(Actual, Volumetric)"},
        {"key": "", "name": "baseFee / vatAmount", "type": "DECIMAL", "attr": "CƯỚC CƠ BẢN + VAT 8%"},
        {"key": "", "name": "insuranceFee", "type": "DECIMAL", "attr": "0.5% GIÁ TRỊ KHAI GIÁ"}
    ]
    t_price, _ = render_table(20, 20, 470, "PricingQuote (Entity)", "CÔNG THỨC IATA", pricing_entity_cols, "#78350F")

    rate_matrix_cols = [
        {"key": "", "name": "routeType", "type": "ENUM", "attr": "INTRA_PROVINCE, INTER_ZONE..."},
        {"key": "", "name": "weightStepKg", "type": "FLOAT", "attr": "NẤC CÂN NẶNG ĐẦU TIÊN (0.5kg)"},
        {"key": "", "name": "firstStepPrice", "type": "DECIMAL", "attr": "GIÁ NẤC ĐẦU (VNĐ)"},
        {"key": "", "name": "additionalKgPrice", "type": "DECIMAL", "attr": "GIÁ MỖI 0.5KG TIẾP THEO"}
    ]
    t_rmat, _ = render_table(510, 20, 470, "TieredRateMatrix", "BẢNG CƯỚC NẤC LŨY TIẾN", rate_matrix_cols, "#78350F")

    price_sections = [
        {
            "title": "CÔNG THỨC TÍNH CƯỚC BƯU CHÍNH QUỐC TẾ (IATA AIRFREIGHT STANDARD)",
            "bullets": [
                '<tspan class="panel-bold">Quy đổi thể tích:</tspan> Áp dụng chuẩn IATA: <tspan class="panel-code">Khối lượng quy đổi = (Dài × Rộng × Cao) / 5000</tspan>.',
                '<tspan class="panel-bold">Khối lượng tính cước:</tspan> Lấy giá trị lớn nhất: <tspan class="panel-code">Chargeable Weight = MAX(Cân nặng thực tế, Cân nặng quy đổi)</tspan>.',
                '<tspan class="panel-bold">Bảo hiểm &amp; Phụ phí:</tspan> Tự động tính phí bảo hiểm 0.5% đối với hàng có khai giá trị cao trên 1.000.000 VNĐ.'
            ]
        },
        {
            "title": "KIẾN TRÚC KHÔNG LƯU TRẠNG THÁI (STATELESS CALCULATION ENGINE)",
            "bullets": [
                '<tspan class="panel-bold">Hiệu năng cực đại:</tspan> Xử lý tính cước trực tiếp trong bộ nhớ (In-memory) trong thời gian dưới 5ms, phục vụ tra cứu cước tức thì trên Web Shop và Chatbot.'
            ]
        }
    ]

    build_standalone_svg(
        filename="12-pricing-service-erd.svg",
        width=2000, height=750,
        svc_name="12. PRICING-SERVICE (CÔNG CỤ TÍNH CƯỚC QUY ĐỔI HÀNG KHÔNG IATA)",
        port_str="3012", db_str="in-memory",
        desc_str="Công cụ tính cước quy đổi IATA 1:5000, tính cước nấc lũy tiến & phí bảo hiểm khai giá",
        color_accent="#D97706",
        tables_markup=t_price + "\n" + t_rmat,
        connectors_markup="",
        panel_title="GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: PRICING-SERVICE",
        badge_text="PRICING ENGINE",
        sections=price_sections,
        stats_footer="Engine: In-Memory Stateless | Formula: (L*W*H)/5000 IATA Standard | Latency: Sub-5ms Execution",
        saga_footer_text="Cung cấp API tính cước tức thời cho shipment-service khi tạo đơn và chatbot-service khi tư vấn giá"
    )

    # =========================================================================
    # 13. CHATBOT-SERVICE (:3013 | RAG Vector Store)
    # =========================================================================
    rag_cols = [
        {"key": "PK", "name": "chunkId", "type": "VARCHAR(64)", "attr": "NOT NULL"},
        {"key": "DIST", "name": "policySlug", "type": "VARCHAR(64)", "attr": "FK-dist masterdata.policies"},
        {"key": "", "name": "content", "type": "TEXT", "attr": "ĐOẠN VĂN BẢN CHÍNH SÁCH"},
        {"key": "", "name": "embeddingVector", "type": "FLOAT[768]", "attr": "GEMINI EMBEDDING-001"},
        {"key": "", "name": "category / tags", "type": "VARCHAR[]", "attr": "IATA, COMPENSATION..."},
        {"key": "", "name": "tokenCount", "type": "INT", "attr": "ĐỘ DÀI TOKEN"}
    ]
    t_rag, _ = render_table(20, 20, 470, "VectorKnowledge (Chatbot)", "KHO TRI THỨC VECTOR RAG", rag_cols, "#0369A1")

    session_mem_cols = [
        {"key": "PK", "name": "sessionId", "type": "VARCHAR(64)", "attr": "NOT NULL"},
        {"key": "DIST", "name": "userId", "type": "VARCHAR(64)", "attr": "FK-dist auth.users"},
        {"key": "", "name": "dialogueBuffer", "type": "JSONB", "attr": "NGỮ CẢNH HỘI THOẠI"},
        {"key": "", "name": "lastActivityAt", "type": "TIMESTAMP", "attr": "SLIDING WINDOW MEMORY"}
    ]
    t_smem, _ = render_table(510, 20, 470, "ChatSessionMemory", "BỘ NHỚ HỘI THOẠI TRỢ LÝ", session_mem_cols, "#0369A1")

    chat_sections = [
        {
            "title": "TRỢ LÝ ẢO THÔNG MINH TÍCH HỢP RAG HYBRID RETRIEVAL (CHATBOT-SERVICE)",
            "bullets": [
                '<tspan class="panel-bold">Tìm kiếm ngữ nghĩa (Semantic Search):</tspan> Các điều khoản chính sách bưu chính được băm nhỏ và nhúng thành <tspan class="panel-code">Vector 768 chiều</tspan> bằng Gemini Embedding-001.',
                '<tspan class="panel-bold">Chống ảo giác (Anti-hallucination):</tspan> Khi khách hàng hỏi về quy định bồi thường hay cước phí, chatbot truy xuất các đoạn văn bản tương đồng cao nhất (Cosine Similarity) để trả lời chính xác 100% theo quy định.',
                '<tspan class="panel-bold">Truy vấn Live Service Mesh:</tspan> Khi phát hiện mã vận đơn <tspan class="panel-code">NX-...</tspan>, chatbot gọi trực tiếp API sang <tspan class="panel-code">tracking-service</tspan> để lấy vị trí thời gian thực.'
            ]
        }
    ]

    build_standalone_svg(
        filename="13-chatbot-service-erd.svg",
        width=2000, height=750,
        svc_name="13. CHATBOT-SERVICE (TRỢ LÝ ẢO AI & KHO TRI THỨC NHÚNG VECTOR RAG)",
        port_str="3013", db_str="vector-store",
        desc_str="Trợ lý ảo RAG tìm kiếm ngữ nghĩa Cosine Similarity, bộ nhớ ngữ cảnh & tra cứu hành trình bưu phẩm",
        color_accent="#0284C7",
        tables_markup=t_rag + "\n" + t_smem,
        connectors_markup="",
        panel_title="GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: CHATBOT-SERVICE",
        badge_text="AI RAG COGNITION",
        sections=chat_sections,
        stats_footer="Engine: In-Memory / pgvector (PostgreSQL) | Embeddings: Gemini 768-D Vector | Retrieval: Hybrid Cosine + BM25",
        saga_footer_text="Truy vấn dữ liệu thời gian thực từ tracking-service và tri thức chính sách từ masterdata-service"
    )

    print("\nAll 13 standalone service ERDs generated successfully!")

if __name__ == "__main__":
    generate_all_individual_erds()
