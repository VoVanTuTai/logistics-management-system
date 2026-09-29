#!/usr/bin/env python3
"""
generate-thesis-erd-diagram.py
Comprehensive, high-resolution Entity Relationship Diagram (ERD)
for the Nexus Logistics Management System graduation thesis.

Features:
- Complete Database-per-Service architecture (11 Microservices in PostgreSQL)
- Full Prisma schema models & field definitions with zero overlapping
- Crow's foot notation (1:1, 1:N) for intra-service table relationships
- Wide 450px tables ensuring ample clearance for all column names and data types
- Integrated side-by-side executive explanation panels adjacent to each microservice
- Distributed Saga & Transactional Outbox pattern pipeline
"""

import xml.etree.ElementTree as ET
import html
import os
import re

OUTPUT_SVG = "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/03-erd-data-model-and-money-flow.svg"

CANVAS_WIDTH = 6000
CANVAS_HEIGHT = 4920

def escape(text):
    return html.escape(str(text))

def sanitize_xml_text(s):
    """Replaces bare ampersands that are not valid XML entities."""
    return re.sub(r'&(?!(?:amp|lt|gt|quot|apos);)', '&amp;', str(s))

def generate_svg():
    lines = []
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS_WIDTH} {CANVAS_HEIGHT}" width="100%" height="100%" style="background:#FFFFFF;">')
    
    # CSS & Definitions
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
  <rect x="20" y="20" width="{CANVAS_WIDTH - 40}" height="{CANVAS_HEIGHT - 40}" fill="none" stroke="#000000" stroke-width="2.4"/>
  <rect x="25" y="25" width="{CANVAS_WIDTH - 50}" height="{CANVAS_HEIGHT - 50}" fill="none" stroke="#000000" stroke-width="1.1"/>

  <style>
    text {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }}
    .doc-badge {{ font-size: 13px; font-weight: 700; fill: #000000; letter-spacing: 1.5px; text-transform: uppercase; }}
    .doc-title {{ font-size: 28px; font-weight: 800; fill: #000000; letter-spacing: -0.5px; }}
    .doc-subtitle {{ font-size: 14.5px; font-weight: 400; fill: #374151; }}
    .meta-tag {{ font-size: 12px; font-weight: 600; fill: #000000; }}
    
    .svc-title {{ font-size: 18px; font-weight: 800; fill: #000000; }}
    .svc-sub {{ font-size: 12px; font-weight: 500; fill: #4B5563; }}
    .svc-port {{ font-size: 12px; font-weight: 700; font-family: ui-monospace, Menlo, monospace; fill: #000000; }}

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

    .panel-header {{ font-size: 14px; font-weight: 800; fill: #000000; text-transform: uppercase; letter-spacing: 0.5px; }}
    .panel-sec-title {{ font-size: 12px; font-weight: 700; fill: #000000; }}
    .panel-body {{ font-size: 11.5px; font-weight: 400; fill: #1F2937; }}
    .panel-bold {{ font-weight: 700; fill: #000000; }}
    .panel-code {{ font-family: ui-monospace, Menlo, monospace; font-size: 11px; font-weight: 700; fill: #000000; }}
  </style>
''')

    # ==================== 1. GRAND HEADER BANNER ====================
    lines.append(f'''
  <!-- HEADER BANNER -->
  <g id="GrandHeader">
    <rect x="60" y="45" width="{CANVAS_WIDTH - 120}" height="135" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.2"/>
    <line x1="60" y1="85" x2="{CANVAS_WIDTH - 60}" y2="85" stroke="#E5E7EB" stroke-width="1"/>
    <text x="95" y="74" class="doc-badge">HỌC VIỆN CÔNG NGHỆ / ĐỒ ÁN TỐT NGHIỆP KỸ SƯ CNTT - HỆ THỐNG QUẢN LÝ VẬN TẢI LOGISTICS NEXUS</text>
    <text x="95" y="116" class="doc-title">HÌNH 1.3: ĐẶC TẢ LƯỢC ĐỒ CƠ SỞ DỮ LIỆU MICROSERVICES TOÀN HỆ THỐNG (DATABASE-PER-SERVICE ERD)</text>
    <text x="95" y="148" class="doc-subtitle">Kiến trúc 11 Cơ sở dữ liệu phân tán (PostgreSQL 16) độc lập, quan hệ nội bộ chuẩn Crow's Foot và cơ chế liên kết khóa nghiệp vụ phân tán (Distributed Saga Linkage via RabbitMQ)</text>
    
    <!-- Meta badges on the right -->
    <rect x="{CANVAS_WIDTH - 1050}" y="65" width="950" height="95" rx="6" fill="#F9FAFB" stroke="#000000" stroke-width="1.2"/>
    <g transform="translate({CANVAS_WIDTH - 1030}, 95)">
      <circle cx="10" cy="10" r="5" fill="#000000"/>
      <text x="24" y="14" class="meta-tag">11 ISOLATED DATABASES</text>
      
      <circle cx="230" cy="10" r="5" fill="#000000"/>
      <text x="244" y="14" class="meta-tag">PRISMA ORM / POSTGRESQL</text>

      <circle cx="480" cy="10" r="5" fill="#000000"/>
      <text x="494" y="14" class="meta-tag">TRANSACTIONAL OUTBOX PATTERN</text>

      <circle cx="750" cy="10" r="5" fill="#000000"/>
      <text x="764" y="14" class="meta-tag">EVENTUAL CONSISTENCY</text>
    </g>
    <g transform="translate({CANVAS_WIDTH - 1030}, 135)">
      <text x="10" y="12" font-size="12" fill="#1F2937">Khóa phân tán cốt lõi (Saga Keys): <tspan fill="#000000" font-weight="700">shipmentCode</tspan> (Vận đơn), <tspan fill="#000000" font-weight="700">hubCode</tspan> (Bưu cục), <tspan fill="#000000" font-weight="700">courierId</tspan> (Tài xế), <tspan fill="#000000" font-weight="700">merchantId</tspan> (Chủ shop)</text>
    </g>
  </g>
''')

    # ==================== RENDERING HELPERS ====================
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
            
            # Key indicator
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
            
            # Field name (Left aligned)
            col_x = 42 if ktype else 30
            out.append(f'  <text x="{col_x}" y="{cy}" class="{name_class}">{escape(col["name"])}</text>')
            
            # Type and constraint (Right aligned)
            type_str = col.get("type", "")
            attr_str = col.get("attr", "")
            full_type = f"{type_str} {attr_str}".strip()
            out.append(f'  <text x="{tw - 12}" y="{cy}" class="tbl-type" text-anchor="end">{escape(full_type)}</text>')
            
        out.append('</g>')
        return "\n".join(out), th

    def render_explanation_panel(px, py, pw, ph, title, badge_text, badge_color, sections, stats_footer=None):
        out = []
        out.append(f'<g transform="translate({px}, {py})">')
        out.append(f'  <rect width="{pw}" height="{ph}" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>')
        # Header bar
        out.append(f'  <rect x="0" y="0" width="{pw}" height="42" rx="6" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>')
        out.append(f'  <rect x="14" y="12" width="6" height="18" rx="1" fill="#000000"/>')
        out.append(f'  <text x="28" y="26" class="panel-header">{escape(title)}</text>')
        out.append(f'  <rect x="{pw - 170}" y="9" width="156" height="24" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>')
        out.append(f'  <text x="{pw - 92}" y="25" font-size="11" font-weight="700" fill="#000000" text-anchor="middle">{escape(badge_text)}</text>')
        
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
            out.append(f'  <text x="{pw/2}" y="{ph - 21}" font-size="10.5" font-weight="600" fill="#111827" text-anchor="middle">{escape(stats_footer)}</text>')
            
        out.append('</g>')
        return "\n".join(out)

    def render_service_container(sx, sy, sw, sh, svc_name, port_str, db_str, desc_str, color_accent=None):
        out = []
        out.append(f'<g transform="translate({sx}, {sy})">')
        out.append(f'  <rect width="{sw}" height="{sh}" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>')
        # Service top banner
        out.append(f'  <path d="M 0 8 Q 0 0 8 0 L {sw-8} 0 Q {sw} 0 {sw} 8 L {sw} 52 L 0 52 Z" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>')
        out.append(f'  <rect x="0" y="0" width="8" height="52" rx="2" fill="#000000"/>')
        
        out.append(f'  <text x="24" y="26" class="svc-title">{escape(svc_name)}</text>')
        out.append(f'  <text x="24" y="44" class="svc-sub">{escape(desc_str)}</text>')
        
        # Port & DB badges
        out.append(f'  <rect x="{sw - 330}" y="12" width="140" height="28" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>')
        out.append(f'  <text x="{sw - 260}" y="30" class="svc-port" text-anchor="middle">PORT :{escape(port_str)}</text>')
        
        out.append(f'  <rect x="{sw - 175}" y="12" width="155" height="28" rx="4" fill="#F9FAFB" stroke="#000000" stroke-width="1"/>')
        out.append(f'  <text x="{sw - 97}" y="30" font-size="11.5" font-weight="700" fill="#000000" text-anchor="middle">DB: {escape(db_str)}</text>')
        out.append('</g>')
        return "\n".join(out)

    # ==================== LAYOUT CONFIGURATION ====================
    # 3 Distinct Columns across 6000px canvas:
    # Column 1: x = 60, width = 1900
    # Column 2: x = 2020, width = 1960
    # Column 3: x = 4040, width = 1900

    c1_x = 60
    c1_w = 1900

    c2_x = 2020
    c2_w = 1960

    c3_x = 4040
    c3_w = 1900

    # Inside each column:
    # Table 1: x = col_x + 20, w = 470
    # Table 2: x = col_x + 510, w = 470
    # Explanation Panel: x = col_x + 1000, w = col_w - 1020 (~880px to 940px)

    # =========================================================================
    # COLUMN 1 - ROW 1: AUTH-SERVICE (:3010 | auth_db)
    # =========================================================================
    auth_y = 210
    auth_h = 1000
    lines.append(render_service_container(c1_x, auth_y, c1_w, auth_h, 
                                          "1. AUTH-SERVICE (DỊCH VỤ ĐỊNH DANH & PHÂN QUYỀN TRUY CẬP)", 
                                          "3010", "auth_db", 
                                          "Xác thực đa tác nhân (JWT, Argon2id, Session Cache), cấp quyền RBAC & phân quyền Mobile", 
                                          "#4338CA"))
    
    # UserAccount (x: 20, w: 470)
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
    t1_svg, _ = render_table(c1_x + 20, auth_y + 75, 470, "UserAccount", "users", user_cols, "#312E81")
    lines.append(t1_svg)

    # AuthSession (x: 510, w: 470)
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
    t2_svg, _ = render_table(c1_x + 510, auth_y + 75, 470, "AuthSession", "auth_sessions", session_cols, "#312E81")
    lines.append(t2_svg)

    # MobilePermissionProfile & Override
    perm_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "actor", "type": "VARCHAR(32)", "attr": "UNIQUE (COURIER/OPS)"},
        {"key": "", "name": "permissions", "type": "JSONB", "attr": "ALLOWED ACTIONS"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"},
        {"key": "", "name": "updatedAt", "type": "TIMESTAMP", "attr": "ON UPDATE"}
    ]
    t3_svg, _ = render_table(c1_x + 20, auth_y + 395, 470, "MobilePermissionProfile", "mobile_profiles", perm_cols, "#4338CA")
    lines.append(t3_svg)

    override_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "userId", "type": "VARCHAR(64)", "attr": "UNIQUE FK -> UserAccount"},
        {"key": "", "name": "permissions", "type": "JSONB", "attr": "OVERRIDE ACTIONS"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"},
        {"key": "", "name": "updatedAt", "type": "TIMESTAMP", "attr": "ON UPDATE"}
    ]
    t4_svg, _ = render_table(c1_x + 510, auth_y + 395, 470, "MobilePermissionOverride", "perm_overrides", override_cols, "#4338CA")
    lines.append(t4_svg)

    # AdminAuditLog & OutboxEvent
    audit_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "actorId / actorUsername", "type": "VARCHAR(64)", "attr": "INDEX"},
        {"key": "", "name": "action / targetType", "type": "VARCHAR(64)", "attr": "LOGIN, GRANT, REVOKE"},
        {"key": "", "name": "targetId / ipAddress", "type": "VARCHAR(64)", "attr": "NULLABLE"},
        {"key": "", "name": "before / after", "type": "JSONB", "attr": "AUDIT DIFF"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "INDEX"}
    ]
    t5_svg, _ = render_table(c1_x + 20, auth_y + 595, 470, "AdminAuditLog", "admin_audit_logs", audit_cols, "#475569")
    lines.append(t5_svg)

    outbox_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType / routingKey", "type": "VARCHAR(64)", "attr": "USER.CREATED, ..."},
        {"key": "", "name": "aggregateType / aggregateId", "type": "VARCHAR(64)", "attr": "UserAccount / id"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "EVENT PAYLOAD"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, PUBLISHED"},
        {"key": "", "name": "retryCount / occurredAt", "type": "INT / TIME", "attr": "SLA RESILIENT"}
    ]
    t6_svg, _ = render_table(c1_x + 510, auth_y + 615, 470, "OutboxEvent (Auth)", "outbox_events", outbox_cols, "#475569")
    lines.append(t6_svg)

    # Intra-Auth Crow's Foot Connector Lines
    # UserAccount (1) -> (N) AuthSession
    lines.append(f'<path d="M {c1_x + 490} {auth_y + 115} L {c1_x + 510} {auth_y + 115}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>')
    # UserAccount (1) -> (1) MobilePermissionOverride
    lines.append(f'<path d="M {c1_x + 450} {auth_y + 345} L {c1_x + 450} {auth_y + 440} L {c1_x + 510} {auth_y + 440}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>')

    # Side Explanation Panel for Auth (x: 1000, w: 875)
    auth_panel_sections = [
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
    lines.append(render_explanation_panel(c1_x + 1000, auth_y + 75, 875, 895, 
                                           "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: AUTH-SERVICE", 
                                           "SECURITY BOUNDARY", "#4338CA", auth_panel_sections,
                                           "Engine: PostgreSQL 16 | Isolation: Read Committed | Password: Argon2id | Auth: Dual JWT Bearer"))

    # =========================================================================
    # COLUMN 1 - ROW 2: MASTERDATA-SERVICE (:3001 | masterdata_db)
    # =========================================================================
    md_y = 1240
    md_h = 1680
    lines.append(render_service_container(c1_x, md_y, c1_w, md_h, 
                                          "2. MASTERDATA-SERVICE (DỊCH VỤ DỮ LIỆU DANH MỤC & CHÍNH SÁCH CỐT LÕI)", 
                                          "3001", "masterdata_db", 
                                          "Quản lý cây phân cấp Bưu cục (Hub), Vùng địa lý (Zone), Phân vùng Courier, Hồ sơ Merchant & Policy", 
                                          "#0284C7"))
    
    # Hub table
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
    t_hub, _ = render_table(c1_x + 20, md_y + 75, 470, "Hub (hubs)", "CÂY BƯU CỤC 4 CẤP", hub_cols, "#0369A1")
    lines.append(t_hub)

    # Zone table
    zone_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "code", "type": "VARCHAR(32)", "attr": "UNIQUE (MIEN_NAM, NOI_TINH)"},
        {"key": "", "name": "name", "type": "VARCHAR(64)", "attr": "TÊN VÙNG CƯỚC"},
        {"key": "", "name": "parentCode", "type": "VARCHAR(32)", "attr": "NULLABLE"},
        {"key": "", "name": "isActive", "type": "BOOLEAN", "attr": "DEFAULT TRUE"}
    ]
    t_zone, _ = render_table(c1_x + 510, md_y + 75, 470, "Zone (zones)", "VÙNG TÍNH CƯỚC", zone_cols, "#0369A1")
    lines.append(t_zone)

    # CourierAreaAssignment
    area_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "FK-dist auth.users.id"},
        {"key": "FK", "name": "hubCode", "type": "VARCHAR(32)", "attr": "FK -> hubs.code"},
        {"key": "", "name": "province / district / ward", "type": "VARCHAR", "attr": "ĐỊA BÀN PHÂN CÔNG"},
        {"key": "", "name": "zoneName / colorHex", "type": "VARCHAR", "attr": "MÃ MÀU BẢN ĐỒ"},
        {"key": "", "name": "boundaryPolygon", "type": "JSONB", "attr": "ĐA GIÁC TUYẾN GIAO"},
        {"key": "", "name": "isActive", "type": "BOOLEAN", "attr": "DEFAULT TRUE"}
    ]
    t_area, _ = render_table(c1_x + 510, md_y + 245, 470, "CourierAreaAssignment", "PHÂN TUYẾN TÀI XẾ", area_cols, "#0284C7")
    lines.append(t_area)

    # MerchantProfile
    merchant_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "username", "type": "VARCHAR(64)", "attr": "UNIQUE (auth_db)"},
        {"key": "", "name": "citizenId", "type": "VARCHAR(20)", "attr": "CCCD CHỦ SHOP"},
        {"key": "", "name": "regionCode / regionLabel", "type": "VARCHAR", "attr": "VÙNG HOẠT ĐỘNG"},
        {"key": "FK", "name": "defaultHubCode / HubName", "type": "VARCHAR", "attr": "BƯU CỤC MẶC ĐỊNH"},
        {"key": "", "name": "defaultSenderAddress", "type": "TEXT", "attr": "ĐỊA CHỈ KHO GOM"},
        {"key": "", "name": "latitude / longitude", "type": "FLOAT", "attr": "GPS VỊ TRÍ KHO"}
    ]
    t_merch, _ = render_table(c1_x + 20, md_y + 395, 470, "MerchantProfile", "HỒ SƠ CHỦ SHOP", merchant_cols, "#0284C7")
    lines.append(t_merch)

    # CustomerProfile
    cust_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "userId", "type": "VARCHAR(64)", "attr": "UNIQUE (auth_db)"},
        {"key": "", "name": "fullName / email", "type": "VARCHAR", "attr": "HỌ TÊN & EMAIL"},
        {"key": "", "name": "phone", "type": "VARCHAR(20)", "attr": "UNIQUE INDEX [PII]"},
        {"key": "", "name": "defaultAddress", "type": "TEXT", "attr": "ĐỊA CHỈ GIAO TẬN NƠI"}
    ]
    t_cust, _ = render_table(c1_x + 510, md_y + 475, 470, "CustomerProfile", "HỒ SƠ KHÁCH HÀNG", cust_cols, "#0284C7")
    lines.append(t_cust)

    # Policy & PolicyVersion
    policy_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "title / slug", "type": "VARCHAR", "attr": "UNIQUE SLUG"},
        {"key": "", "name": "category", "type": "ENUM", "attr": "COMPENSATION, RETURN..."},
        {"key": "", "name": "summary / content", "type": "TEXT", "attr": "NỘI DUNG MARKDOWN"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "DRAFT, PUBLISHED"},
        {"key": "", "name": "version / displayOrder", "type": "INT", "attr": "SỐ HIỆU PHIÊN BẢN"}
    ]
    t_pol, _ = render_table(c1_x + 20, md_y + 630, 470, "Policy (policies)", "CHÍNH SÁCH BƯU CHÍNH", policy_cols, "#0C4A6E")
    lines.append(t_pol)

    pver_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "policyId", "type": "CUID", "attr": "FK -> policies.id CASCADE"},
        {"key": "", "name": "version", "type": "INT", "attr": "LỊCH SỬ PHIÊN BẢN"},
        {"key": "", "name": "title / content", "type": "TEXT", "attr": "NỘI DUNG LƯU TRỮ"},
        {"key": "", "name": "status / changeNote", "type": "VARCHAR", "attr": "GHI CHÚ SỬA ĐỔI"}
    ]
    t_pver, _ = render_table(c1_x + 510, md_y + 665, 470, "PolicyVersion", "LỊCH SỬ CHÍNH SÁCH", pver_cols, "#0C4A6E")
    lines.append(t_pver)

    # NdrReason & Config
    ndr_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "code", "type": "VARCHAR(32)", "attr": "UNIQUE (NDR_KH_HEN_LAI)"},
        {"key": "", "name": "description", "type": "VARCHAR(255)", "attr": "LÝ DO GIAO KHÔNG THÀNH"},
        {"key": "", "name": "isActive", "type": "BOOLEAN", "attr": "DEFAULT TRUE"}
    ]
    t_ndr, _ = render_table(c1_x + 20, md_y + 840, 470, "NdrReason", "LÝ DO SỰ CỐ NDR", ndr_cols, "#475569")
    lines.append(t_ndr)

    cfg_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "key", "type": "VARCHAR(64)", "attr": "UNIQUE (MAX_SLA_DAYS...)"},
        {"key": "", "name": "value", "type": "JSONB", "attr": "THAM SỐ HỆ THỐNG"},
        {"key": "", "name": "scope", "type": "VARCHAR(32)", "attr": "GLOBAL, REGIONAL"}
    ]
    t_cfg, _ = render_table(c1_x + 510, md_y + 845, 470, "Config (configs)", "CẤU HÌNH ĐIỀU HÀNH", cfg_cols, "#475569")
    lines.append(t_cfg)

    # Masterdata Relations
    lines.append(f'<path d="M {c1_x + 490} {md_y + 115} L {c1_x + 510} {md_y + 115}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-many)" marker-end="url(#crow-one)"/>')
    lines.append(f'<path d="M {c1_x + 490} {md_y + 700} L {c1_x + 510} {md_y + 700}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>')
    lines.append(f'<path d="M {c1_x + 490} {md_y + 160} L {c1_x + 500} {md_y + 160} L {c1_x + 500} {md_y + 275} L {c1_x + 510} {md_y + 275}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>')

    # Side Explanation Panel for Masterdata
    md_panel_sections = [
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
    lines.append(render_explanation_panel(c1_x + 1000, md_y + 75, 875, 1575, 
                                           "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: MASTERDATA-SERVICE", 
                                           "FOUNDATION DOMAIN", "#0284C7", md_panel_sections,
                                           "Engine: PostgreSQL 16 | Entities: 10 Tables | Geo: WGS84 GeoJSON Polygons | RAG: Versioned Policy Store"))

    # =========================================================================
    # COLUMN 1 - ROW 3: PICKUP-SERVICE (:3003) & PRICING-SERVICE (:3012)
    # =========================================================================
    pck_y = 2950
    pck_h = 1650
    lines.append(render_service_container(c1_x, pck_y, c1_w, pck_h, 
                                          "3. PICKUP-SERVICE (:3003) & PRICING-SERVICE (:3012)", 
                                          "3003 / 3012", "pickup_db / in-memory", 
                                          "Xử lý yêu cầu gom hàng tận nơi từ Shop & Công cụ tính cước quy đổi chuẩn hàng không IATA", 
                                          "#D97706"))
    
    # PickupRequest
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
    t_pck, _ = render_table(c1_x + 20, pck_y + 75, 470, "PickupRequest", "PHIẾU YÊU CẦU GOM", pickup_cols, "#B45309")
    lines.append(t_pck)

    # PickupItem
    pitem_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "pickupRequestId", "type": "CUID", "attr": "FK -> pickup_requests.id"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "", "name": "quantity", "type": "INT", "attr": "SỐ LƯỢNG GOM"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    t_pitem, _ = render_table(c1_x + 510, pck_y + 75, 470, "PickupItem", "KIỆN HÀNG CẦN GOM", pitem_cols, "#B45309")
    lines.append(t_pitem)

    # Pickup Outbox
    p_outbox_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType / routingKey", "type": "VARCHAR(64)", "attr": "PICKUP.APPROVED, ..."},
        {"key": "", "name": "aggregateType / aggregateId", "type": "VARCHAR(64)", "attr": "PickupRequest / id"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "DATA GOM HÀNG"}
    ]
    t_pout, _ = render_table(c1_x + 20, pck_y + 355, 470, "OutboxEvent (Pickup)", "outbox_events", p_outbox_cols, "#475569")
    lines.append(t_pout)

    # Pricing-service (Stateless domain entity)
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
    t_price, _ = render_table(c1_x + 510, pck_y + 250, 470, "PricingQuote (Entity)", "CÔNG THỨC IATA", pricing_entity_cols, "#78350F")
    lines.append(t_price)

    # Pickup Relations
    lines.append(f'<path d="M {c1_x + 490} {pck_y + 115} L {c1_x + 510} {pck_y + 115}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>')

    # Side Explanation Panel for Pickup & Pricing
    pck_panel_sections = [
        {
            "title": "VAI TRÒ & QUY TRÌNH GOM HÀNG (FIRST-MILE PICKUP)",
            "bullets": [
                '<tspan class="panel-bold">Tiếp nhận yêu cầu gom:</tspan> Merchant gửi yêu cầu gom theo lô nhiều vận đơn qua Web Dashboard hoặc API.',
                '<tspan class="panel-bold">Phê duyệt &amp; Bắn sự kiện:</tspan> Khi điều phối viên duyệt gom, hệ thống ghi bản ghi Outbox <tspan class="panel-code">PICKUP.APPROVED</tspan> để dispatch-service sinh nhiệm vụ tài xế.',
                '<tspan class="panel-bold">Gom thực tế:</tspan> Tài xế đến kho shop quét mã vận đơn, hoàn tất yêu cầu gom chuyển trạng thái sang <tspan class="panel-code">COMPLETED</tspan>.'
            ]
        },
        {
            "title": "CƠ CHẾ TÍNH CƯỚC CHUẨN QUỐC TẾ IATA (PRICING-SERVICE)",
            "bullets": [
                '<tspan class="panel-bold">Quy đổi khối lượng cồng kềnh:</tspan> Áp dụng công thức IATA: <tspan class="panel-code">Khối lượng quy đổi = (Dài × Rộng × Cao) / 5000</tspan>.',
                '<tspan class="panel-bold">Khối lượng tính cước:</tspan> Lấy giá trị lớn nhất: <tspan class="panel-code">Chargeable Weight = MAX(Cân nặng thực tế, Cân nặng quy đổi)</tspan>.',
                '<tspan class="panel-bold">Bảo hiểm &amp; Phụ phí:</tspan> Tự động cộng phí bảo hiểm đối với hàng hóa khai giá trị cao trên 1.000.000 VNĐ.'
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                '<tspan class="panel-code">shipmentCode</tspan>: Danh sách mã vận đơn thuộc yêu cầu gom trong bảng <tspan class="panel-code">pickup_items</tspan>.',
                '<tspan class="panel-code">pickupRequestId</tspan>: Khóa tham chiếu để <tspan class="panel-code">dispatch-service</tspan> tạo nhiệm vụ gán cho Courier.'
            ]
        }
    ]
    lines.append(render_explanation_panel(c1_x + 1000, pck_y + 75, 875, 1545, 
                                           "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: PICKUP & PRICING SERVICE", 
                                           "FIRST-MILE & CALCULATION", "#D97706", pck_panel_sections,
                                           "Engine: pickup_db (PostgreSQL) + pricing-service (Stateless Rule Engine) | Standard: IATA Airfreight 1:5000"))

    # =========================================================================
    # COLUMN 2 - ROW 1: SHIPMENT-SERVICE (:3002 | shipment_db)
    # =========================================================================
    shp_y = 210
    shp_h = 1750
    lines.append(render_service_container(c2_x, shp_y, c2_w, shp_h, 
                                          "4. SHIPMENT-SERVICE (DỊCH VỤ VẬN ĐƠN, KHIẾU NẠI & ĐIỀU TRA SỰ CỐ)", 
                                          "3002", "shipment_db", 
                                          "Quản lý vòng đời vận đơn (19 trạng thái FSM), yêu cầu thay đổi thông tin, điều tra thất lạc & bồi thường", 
                                          "#059669"))
    
    # Shipment table
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
    t_shp, _ = render_table(c2_x + 20, shp_y + 75, 470, "Shipment (shipments)", "VẬN ĐƠN BƯU CHÍNH", shipment_cols, "#065F46")
    lines.append(t_shp)

    # ChangeRequest table
    change_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK -> shipments.code"},
        {"key": "", "name": "requestType", "type": "VARCHAR(64)", "attr": "CHANGE_ADDRESS, COD..."},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "DỮ LIỆU ĐỀ XUẤT ĐỔI"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, APPROVED..."},
        {"key": "DIST", "name": "requestedBy / approvedBy", "type": "VARCHAR", "attr": "FK-dist auth.users"},
        {"key": "", "name": "approvedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM DUYỆT"}
    ]
    t_chg, _ = render_table(c2_x + 510, shp_y + 75, 470, "ChangeRequest", "YÊU CẦU ĐỔI ĐỊA CHỈ/COD", change_cols, "#047857")
    lines.append(t_chg)

    # InvestigationCase
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
    t_inv, _ = render_table(c2_x + 20, shp_y + 420, 470, "InvestigationCase", "HỒ SƠ ĐIỀU TRA SỰ CỐ", inv_cols, "#064E3B")
    lines.append(t_inv)

    # InvestigationAuditScan & Dispute
    inv_scan_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "investigationCaseId", "type": "CUID", "attr": "FK -> investigations"},
        {"key": "", "name": "timestamp / locationCode", "type": "TIME / VARCHAR", "attr": "ĐỊA ĐIỂM QUÉT"},
        {"key": "", "name": "action / operator", "type": "VARCHAR", "attr": "THAO TÁC / NHÂN SỰ"},
        {"key": "", "name": "recordedWeightKg / DeltaKg", "type": "FLOAT", "attr": "ĐỘ LỆCH CÂN NẶNG"},
        {"key": "", "name": "isBreakPoint / anomalyNote", "type": "BOOL / TEXT", "attr": "ĐIỂM GÃY BƯU GỬI"}
    ]
    t_iscan, _ = render_table(c2_x + 510, shp_y + 335, 470, "InvestigationAuditScan", "VẾT QUÉT ĐIỀU TRA", inv_scan_cols, "#047857")
    lines.append(t_iscan)

    disp_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "investigationCaseId", "type": "CUID", "attr": "FK -> investigations"},
        {"key": "", "name": "submittedBy / partyName", "type": "VARCHAR", "attr": "BƯU CỤC GIẢI TRÌNH"},
        {"key": "", "name": "cctvVideoUrl / timestamp", "type": "VARCHAR / RANGE", "attr": "BẰNG CHỨNG CAMERA"},
        {"key": "", "name": "handoverSlipUrl / notes", "type": "VARCHAR / TEXT", "attr": "BIÊN BẢN BÀN GIAO"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, ACCEPTED..."}
    ]
    t_disp, _ = render_table(c2_x + 510, shp_y + 555, 470, "InvestigationDispute", "BẰNG CHỨNG GIẢI TRÌNH", disp_cols, "#047857")
    lines.append(t_disp)

    # CompensationClaim
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
    t_clm, _ = render_table(c2_x + 20, shp_y + 775, 470, "CompensationClaim", "HỒ SƠ BỒI THƯỜNG", claim_cols, "#065F46")
    lines.append(t_clm)

    # Shipment Outbox
    s_outbox_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType / routingKey", "type": "VARCHAR(64)", "attr": "SHIPMENT.CREATED, ..."},
        {"key": "", "name": "aggregateType / aggregateId", "type": "VARCHAR(64)", "attr": "Shipment / code"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "SNAPSHOT ĐƠN HÀNG"}
    ]
    t_sout, _ = render_table(c2_x + 510, shp_y + 795, 470, "OutboxEvent (Shipment)", "outbox_events", s_outbox_cols, "#475569")
    lines.append(t_sout)

    # Shipment Relations
    lines.append(f'<path d="M {c2_x + 490} {shp_y + 115} L {c2_x + 510} {shp_y + 115}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>')
    lines.append(f'<path d="M {c2_x + 250} {shp_y + 395} L {c2_x + 250} {shp_y + 420}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>')
    lines.append(f'<path d="M {c2_x + 490} {shp_y + 450} L {c2_x + 510} {shp_y + 450}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>')
    lines.append(f'<path d="M {c2_x + 490} {shp_y + 550} L {c2_x + 500} {shp_y + 550} L {c2_x + 500} {shp_y + 610} L {c2_x + 510} {shp_y + 610}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>')
    lines.append(f'<path d="M {c2_x + 250} {shp_y + 740} L {c2_x + 250} {shp_y + 775}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>')

    # Side Explanation Panel for Shipment
    shp_panel_sections = [
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
    lines.append(render_explanation_panel(c2_x + 1000, shp_y + 75, 935, 1645, 
                                           "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: SHIPMENT-SERVICE", 
                                           "CORE AGGREGATE ROOT", "#059669", shp_panel_sections,
                                           "Engine: shipment_db (PostgreSQL) | Canonical State Machine: 19 Statuses | Lock: Pessimistic Concurrency"))

    # =========================================================================
    # COLUMN 2 - ROW 2: MANIFEST-SERVICE (:3005 | manifest_db)
    # =========================================================================
    mnf_y = 1990
    mnf_h = 1250
    lines.append(render_service_container(c2_x, mnf_y, c2_w, mnf_h, 
                                          "5. MANIFEST-SERVICE (DỊCH VỤ BẢNG KÊ & VẬN CHUYỂN LIÊN BƯU CỤC - LINEHAUL)", 
                                          "3005", "manifest_db", 
                                          "Đóng chuyến thư, niêm phong kẹp chì (Seal), bàn giao xe tải đường trục & nhận bảng kê tại Hub đích", 
                                          "#0891B2"))
    
    # Manifest table
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
    t_mnf, _ = render_table(c2_x + 20, mnf_y + 75, 470, "Manifest (manifests)", "BẢNG KÊ LIÊN BƯU CỤC", mnf_cols, "#0E7490")
    lines.append(t_mnf)

    # ManifestItem table
    mnf_item_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "manifestId", "type": "CUID", "attr": "FK -> manifests.id CASCADE"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    t_mitem, _ = render_table(c2_x + 510, mnf_y + 75, 470, "ManifestItem", "DANH SÁCH KIỆN TRONG BẢNG KÊ", mnf_item_cols, "#0891B2")
    lines.append(t_mitem)

    # SealRecord table
    seal_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "manifestId", "type": "CUID", "attr": "UNIQUE FK -> manifests.id"},
        {"key": "DIST", "name": "sealedBy", "type": "VARCHAR(64)", "attr": "FK-dist auth.users"},
        {"key": "", "name": "note", "type": "VARCHAR(255)", "attr": "MÃ CHÌ SEAL TRUCK"},
        {"key": "", "name": "sealedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM NIÊM PHONG"}
    ]
    t_seal, _ = render_table(c2_x + 20, mnf_y + 355, 470, "SealRecord", "BIÊN BẢN NIÊM PHONG KẸP CHÌ", seal_cols, "#155E75")
    lines.append(t_seal)

    # ReceiveRecord table
    recv_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "manifestId", "type": "CUID", "attr": "UNIQUE FK -> manifests.id"},
        {"key": "DIST", "name": "receivedBy", "type": "VARCHAR(64)", "attr": "FK-dist auth.users"},
        {"key": "", "name": "note", "type": "VARCHAR(255)", "attr": "TÌNH TRẠNG KẸP CHÌ XE"},
        {"key": "", "name": "receivedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM MỞ NIÊM PHONG"}
    ]
    t_recv, _ = render_table(c2_x + 510, mnf_y + 275, 470, "ReceiveRecord", "BIÊN BẢN NHẬN BẢNG KÊ ĐÍCH", recv_cols, "#155E75")
    lines.append(t_recv)

    # Manifest Outbox
    m_outbox_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType / routingKey", "type": "VARCHAR(64)", "attr": "MANIFEST.SEALED, ..."},
        {"key": "", "name": "aggregateType / aggregateId", "type": "VARCHAR(64)", "attr": "Manifest / id"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "DANH SÁCH MÃ VẬN ĐƠN"}
    ]
    t_mout, _ = render_table(c2_x + 510, mnf_y + 490, 470, "OutboxEvent (Manifest)", "outbox_events", m_outbox_cols, "#475569")
    lines.append(t_mout)

    # Manifest Relations
    lines.append(f'<path d="M {c2_x + 490} {mnf_y + 115} L {c2_x + 510} {mnf_y + 115}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>')
    lines.append(f'<path d="M {c2_x + 250} {mnf_y + 325} L {c2_x + 250} {mnf_y + 355}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>')
    lines.append(f'<path d="M {c2_x + 490} {mnf_y + 200} L {c2_x + 500} {mnf_y + 200} L {c2_x + 500} {mnf_y + 310} L {c2_x + 510} {mnf_y + 310}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>')

    # Side Explanation Panel for Manifest
    mnf_panel_sections = [
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
    lines.append(render_explanation_panel(c2_x + 1000, mnf_y + 75, 935, 1145, 
                                           "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: MANIFEST-SERVICE", 
                                           "LINEHAUL LOGISTICS", "#0891B2", mnf_panel_sections,
                                           "Engine: manifest_db (PostgreSQL) | Seal: Physical Truck Lead Seal | Dispatch: Inter-hub Linehaul"))

    # =========================================================================
    # COLUMN 2 - ROW 3: DISPATCH-SERVICE (:3004) & SCAN-SERVICE (:3006)
    # =========================================================================
    dsp_y = 3270
    dsp_h = 1330
    lines.append(render_service_container(c2_x, dsp_y, c2_w, dsp_h, 
                                          "6. DISPATCH-SERVICE (:3004) & SCAN-SERVICE (:3006)", 
                                          "3004 / 3006", "dispatch_db / scan_db", 
                                          "Điều phối nhiệm vụ giao/nhận cho tài xế & Quét mã vạch Inbound/Outbound, định vị thời gian thực", 
                                          "#7C3AED"))
    
    # Task table
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
    t_tsk, _ = render_table(c2_x + 20, dsp_y + 75, 470, "Task (tasks)", "NHIỆM VỤ COURIER", task_cols, "#6D28D9")
    lines.append(t_tsk)

    # TaskAssignment
    task_asgn_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "taskId", "type": "CUID", "attr": "FK -> tasks.id"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "FK-dist auth.users"},
        {"key": "", "name": "assignedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM GÁN"},
        {"key": "", "name": "unassignedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM ĐỔI TÀI XẾ"}
    ]
    t_tasgn, _ = render_table(c2_x + 510, dsp_y + 75, 470, "TaskAssignment", "LỊCH SỬ GÁN TÀI XẾ", task_asgn_cols, "#6D28D9")
    lines.append(t_tasgn)

    # ScanEvent table
    scan_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "", "name": "scanType", "type": "ENUM", "attr": "PICKUP, INBOUND, OUTBOUND"},
        {"key": "DIST", "name": "locationCode", "type": "VARCHAR(32)", "attr": "FK-dist masterdata.hubs"},
        {"key": "DIST", "name": "manifestCode", "type": "VARCHAR(32)", "attr": "FK-dist manifests"},
        {"key": "", "name": "idempotencyKey", "type": "VARCHAR(64)", "attr": "UNIQUE (CHỐNG TRÙNG)"},
        {"key": "", "name": "occurredAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM QUÉT"}
    ]
    t_scan, _ = render_table(c2_x + 20, dsp_y + 345, 470, "ScanEvent", "SỰ KIỆN QUÉT BƯU PHẨM", scan_cols, "#0D9488")
    lines.append(t_scan)

    # CurrentLocation & CourierLocation
    loc_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "UNIQUE (VỊ TRÍ HIỆN TẠI)"},
        {"key": "", "name": "locationCode / lastScanType", "type": "VARCHAR / ENUM", "attr": "BƯU CỤC MỚI NHẤT"},
        {"key": "DIST", "name": "courierId / taskId", "type": "VARCHAR", "attr": "TÀI XẾ ĐANG GIỮ"},
        {"key": "", "name": "latitude / longitude", "type": "FLOAT", "attr": "TỌA ĐỘ GPS WGS84"},
        {"key": "", "name": "source", "type": "ENUM", "attr": "GPS, SCAN, MANUAL"}
    ]
    t_loc, _ = render_table(c2_x + 510, dsp_y + 275, 470, "CurrentLocation", "VỊ TRÍ BƯU KIỆN REALTIME", loc_cols, "#0D9488")
    lines.append(t_loc)

    cloc_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "UNIQUE (GPS TÀI XẾ)"},
        {"key": "DIST", "name": "taskId / shipmentCode", "type": "VARCHAR", "attr": "ĐANG GIAO ĐƠN NÀO"},
        {"key": "", "name": "latitude / longitude / accuracy", "type": "FLOAT", "attr": "GPS & ĐỘ CHÍNH XÁC (M)"},
        {"key": "", "name": "capturedAt", "type": "TIMESTAMP", "attr": "THỜI GIAN NHẬN GPS"}
    ]
    t_cloc, _ = render_table(c2_x + 510, dsp_y + 495, 470, "CourierCurrentLocation", "GPS TÀI XẾ TRỰC TIẾP", cloc_cols, "#0F766E")
    lines.append(t_cloc)

    # Dispatch Relations
    lines.append(f'<path d="M {c2_x + 490} {dsp_y + 115} L {c2_x + 510} {dsp_y + 115}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>')

    # Side Explanation Panel for Dispatch & Scan
    dsp_panel_sections = [
        {
            "title": "ĐIỀU PHỐI TỰ ĐỘNG & BÀN GIAO NHIỆM VỤ (DISPATCH-SERVICE)",
            "bullets": [
                '<tspan class="panel-bold">Phân công nhiệm vụ linh hoạt:</tspan> Quản lý 3 loại nhiệm vụ: <tspan class="panel-code">PICKUP</tspan> (Gom hàng shop), <tspan class="panel-code">DELIVERY</tspan> (Phát hàng cho khách), <tspan class="panel-code">RETURN</tspan> (Chuyển hoàn).',
                '<tspan class="panel-bold">Lịch sử điều chuyển:</tspan> Bảng <tspan class="panel-code">task_assignments</tspan> cho phép đổi tài xế nếu Courier bị sự cố xe cộ mà vẫn bảo toàn lịch sử bàn giao.'
            ]
        },
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
    lines.append(render_explanation_panel(c2_x + 1000, dsp_y + 75, 935, 1225, 
                                           "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: DISPATCH & SCAN SERVICE", 
                                           "OPERATIONS & SCANNING", "#7C3AED", dsp_panel_sections,
                                           "Engines: dispatch_db + scan_db | Idempotency: Redis + PostgreSQL Unique | Location: Realtime WGS84 GPS"))

    # =========================================================================
    # COLUMN 3 - ROW 1: DELIVERY-SERVICE (:3007 | delivery_db)
    # =========================================================================
    dlv_y = 210
    dlv_h = 1350
    lines.append(render_service_container(c3_x, dlv_y, c3_w, dlv_h, 
                                          "7. DELIVERY-SERVICE (DỊCH VỤ PHÁT HÀNG CHẶNG CUỐI, POD & SỰ CỐ NDR)", 
                                          "3007", "delivery_db", 
                                          "Giao hàng chặng cuối (Last-mile), xác thực mã OTP, ảnh bằng chứng POD & quy trình chuyển hoàn 3 lần", 
                                          "#E11D48"))
    
    # DeliveryAttempt table
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
    t_dlv, _ = render_table(c3_x + 20, dlv_y + 75, 470, "DeliveryAttempt", "LẦN GIAO HÀNG", dlv_cols, "#BE123C")
    lines.append(t_dlv)

    # Pod table (Proof of Delivery)
    pod_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "deliveryAttemptId", "type": "CUID", "attr": "UNIQUE FK -> DeliveryAttempt"},
        {"key": "", "name": "imageUrl", "type": "VARCHAR(255)", "attr": "ẢNH CHỤP GIAO HÀNG"},
        {"key": "DIST", "name": "capturedBy", "type": "VARCHAR(64)", "attr": "FK-dist auth.users"},
        {"key": "", "name": "capturedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM CHỤP"}
    ]
    t_pod, _ = render_table(c3_x + 510, dlv_y + 75, 470, "Pod (Proof of Delivery)", "BẰNG CHỨNG PHÁT THÀNH CÔNG", pod_cols, "#BE123C")
    lines.append(t_pod)

    # OtpRecord table
    otp_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "", "name": "otpCode", "type": "VARCHAR(10)", "attr": "MÃ OTP XÁC NHẬN GIAO"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "SENT, VERIFIED"},
        {"key": "", "name": "sentAt / verifiedAt", "type": "TIMESTAMP", "attr": "MỐC XÁC THỰC"}
    ]
    t_otp, _ = render_table(c3_x + 510, dlv_y + 245, 470, "OtpRecord", "XÁC NHẬN MÃ OTP", otp_cols, "#E11D48")
    lines.append(t_otp)

    # NdrCase (Non-Delivery Report)
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
    t_ndrc, _ = render_table(c3_x + 20, dlv_y + 355, 470, "NdrCase", "HỒ SƠ SỰ CỐ GIAO (NDR)", ndr_cols, "#9F1239")
    lines.append(t_ndrc)

    # ReturnCase
    ret_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "FK", "name": "ndrCaseId", "type": "CUID", "attr": "UNIQUE FK -> NdrCase"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "STARTED, COMPLETED"},
        {"key": "", "name": "startedAt / completedAt", "type": "TIMESTAMP", "attr": "MỐC CHUYỂN HOÀN"}
    ]
    t_ret, _ = render_table(c3_x + 510, dlv_y + 435, 470, "ReturnCase", "QUY TRÌNH CHUYỂN HOÀN", ret_cols, "#9F1239")
    lines.append(t_ret)

    # Delivery Outbox
    d_outbox_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType / routingKey", "type": "VARCHAR(64)", "attr": "DELIVERY.DELIVERED, ..."},
        {"key": "", "name": "aggregateType / aggregateId", "type": "VARCHAR(64)", "attr": "DeliveryAttempt / id"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "POD & COD COLLECTED"}
    ]
    t_dout, _ = render_table(c3_x + 510, dlv_y + 600, 470, "OutboxEvent (Delivery)", "outbox_events", d_outbox_cols, "#475569")
    lines.append(t_dout)

    # Delivery Relations
    lines.append(f'<path d="M {c3_x + 490} {dlv_y + 115} L {c3_x + 510} {dlv_y + 115}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>')
    lines.append(f'<path d="M {c3_x + 250} {dlv_y + 325} L {c3_x + 250} {dlv_y + 355}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>')
    lines.append(f'<path d="M {c3_x + 490} {dlv_y + 460} L {c3_x + 510} {dlv_y + 460}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>')

    # Side Explanation Panel for Delivery
    dlv_panel_sections = [
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
    lines.append(render_explanation_panel(c3_x + 1000, dlv_y + 75, 875, 1245, 
                                           "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: DELIVERY-SERVICE", 
                                           "LAST-MILE FULFILLMENT", "#E11D48", dlv_panel_sections,
                                           "Engine: delivery_db (PostgreSQL) | SLA: 3 Delivery Attempts Max | Verification: GPS Geofence + Photo POD + OTP"))

    # =========================================================================
    # COLUMN 3 - ROW 2: PAYMENT-SERVICE (:3011 | payment_db)
    # =========================================================================
    pay_y = 1590
    pay_h = 1400
    lines.append(render_service_container(c3_x, pay_y, c3_w, pay_h, 
                                          "8. PAYMENT-SERVICE (DỊCH VỤ THANH TOÁN, ĐỐI SOÁT COD & QUYẾT TOÁN TỰ ĐỘNG)", 
                                          "3011", "payment_db", 
                                          "Thu hộ tiền mặt (COD), kết toán theo phiên nộp tiền của Courier, tạo mã VietQR động PayOS & webhook ngân hàng", 
                                          "#16A34A"))
    
    # CodRecord table
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
    t_cod, _ = render_table(c3_x + 20, pay_y + 75, 470, "CodRecord (cod_records)", "HỒ SƠ THU HỘ COD", cod_cols, "#15803D")
    lines.append(t_cod)

    # CodSettlementBatch table
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
    t_bat, _ = render_table(c3_x + 510, pay_y + 75, 470, "CodSettlementBatch", "PHIÊN KẾT TOÁN TIỀN TÀI XẾ", batch_cols, "#15803D")
    lines.append(t_bat)

    # CodSettlementItem
    sitem_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "FK", "name": "batchId", "type": "CUID", "attr": "FK -> CodSettlementBatch"},
        {"key": "FK", "name": "codRecordId", "type": "CUID", "attr": "UNIQUE FK -> CodRecord"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "FK-dist shipment.code"},
        {"key": "", "name": "amount", "type": "FLOAT", "attr": "TIỀN TỪNG ĐƠN"}
    ]
    t_sitem, _ = render_table(c3_x + 510, pay_y + 355, 470, "CodSettlementItem", "CHI TIẾT VẬN ĐƠN NỘP TIỀN", sitem_cols, "#166534")
    lines.append(t_sitem)

    # CodSettlementPaymentEvent (Webhook log)
    pay_evt_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "provider / providerEventId", "type": "VARCHAR", "attr": "UNIQUE (PAYOS_WEBHOOK)"},
        {"key": "", "name": "settlementCode / BatchId", "type": "VARCHAR", "attr": "MÃ PHIÊN NỘP TIỀN"},
        {"key": "", "name": "amount / accountNumber", "type": "FLOAT / STR", "attr": "SỐ TIỀN & STK NGÂN HÀNG"},
        {"key": "", "name": "referenceCode / memo", "type": "VARCHAR", "attr": "NỘI DUNG CHUYỂN KHOẢN"},
        {"key": "", "name": "processingStatus", "type": "VARCHAR", "attr": "PROCESSED, DUPLICATE..."}
    ]
    t_pevt, _ = render_table(c3_x + 20, pay_y + 385, 470, "CodSettlementPaymentEvent", "WEBHOOK BIẾN ĐỘNG SỐ DƯ", pay_evt_cols, "#166534")
    lines.append(t_pevt)

    # Payment Outbox
    p_out_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType / routingKey", "type": "VARCHAR(64)", "attr": "COD.SETTLED, ..."},
        {"key": "", "name": "aggregateType / aggregateId", "type": "VARCHAR(64)", "attr": "CodSettlementBatch / id"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "DATA QUYẾT TOÁN CHO SHOP"}
    ]
    t_pout2, _ = render_table(c3_x + 510, pay_y + 535, 470, "OutboxEvent (Payment)", "outbox_events", p_out_cols, "#475569")
    lines.append(t_pout2)

    # Payment Relations
    lines.append(f'<path d="M {c3_x + 745} {pay_y + 325} L {c3_x + 745} {pay_y + 355}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>')
    lines.append(f'<path d="M {c3_x + 490} {pay_y + 200} L {c3_x + 500} {pay_y + 200} L {c3_x + 500} {pay_y + 390} L {c3_x + 510} {pay_y + 390}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>')

    # Side Explanation Panel for Payment
    pay_panel_sections = [
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
    lines.append(render_explanation_panel(c3_x + 1000, pay_y + 75, 875, 1295, 
                                           "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: PAYMENT-SERVICE", 
                                           "FINANCIAL SETTLEMENT", "#16A34A", pay_panel_sections,
                                           "Engine: payment_db (PostgreSQL) | Gateway: VietQR / PayOS Banking Webhook | Reconciliation: Automated Zero-Touch"))

    # =========================================================================
    # COLUMN 3 - ROW 3: TRACKING (:3008), REPORTING (:3009) & CHATBOT (:3013)
    # =========================================================================
    trk_y = 3020
    trk_h = 1580
    lines.append(render_service_container(c3_x, trk_y, c3_w, trk_h, 
                                          "9. TRACKING (:3008), REPORTING (:3009) & CHATBOT AI (:3013)", 
                                          "3008 / 3009 / 3013", "tracking_db / reporting_db / vector-store", 
                                          "Dòng thời gian sự kiện kiện hàng, báo cáo KPI đa chiều & Trợ lý ảo RAG tìm kiếm ngữ nghĩa", 
                                          "#2563EB"))
    
    # TimelineEvent
    tl_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType", "type": "VARCHAR(64)", "attr": "MANIFEST, SCAN, DELIVERY..."},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "INDEX (MÃ ĐƠN)"},
        {"key": "", "name": "actor / locationCode", "type": "VARCHAR", "attr": "NGƯỜI LÀM / BƯU CỤC"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "SNAPSHOT DỮ LIỆU"},
        {"key": "", "name": "occurredAt", "type": "TIMESTAMP", "attr": "INDEX TIME"}
    ]
    t_tl, _ = render_table(c3_x + 20, trk_y + 75, 470, "TimelineEvent", "LỊCH TRÌNH BƯU PHẨM", tl_cols, "#1D4ED8")
    lines.append(t_tl)

    # TrackingCurrent
    tcurr_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "UNIQUE (READ-MODEL)"},
        {"key": "", "name": "currentStatus / Location", "type": "VARCHAR", "attr": "TRẠNG THÁI HIỆN TẠI"},
        {"key": "", "name": "lastEventType / lastEventAt", "type": "VARCHAR / TIME", "attr": "SỰ KIỆN MỚI NHẤT"},
        {"key": "", "name": "viewPayload", "type": "JSONB", "attr": "DỮ LIỆU ĐÃ CHE PII"}
    ]
    t_tcur, _ = render_table(c3_x + 510, trk_y + 75, 470, "TrackingCurrent", "BẢN GHI TRA CỨU NHANH", tcurr_cols, "#1D4ED8")
    lines.append(t_tcur)

    # KpiDaily
    kpi_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "", "name": "metricDate", "type": "DATE", "attr": "NGÀY THỐNG KÊ"},
        {"key": "DIST", "name": "hubCode / zoneCode / courierCode", "type": "VARCHAR", "attr": "4 ĐỐI TƯỢNG PHÂN TÍCH"},
        {"key": "", "name": "shipmentsCreated / Picked", "type": "INT", "attr": "SỐ ĐƠN TẠO / GOM"},
        {"key": "", "name": "deliveriesDelivered / Failed", "type": "INT", "attr": "GIAO THÀNH CÔNG / THẤT BẠI"},
        {"key": "", "name": "codCollected / codRemitted", "type": "INT", "attr": "TIỀN COD THU / NỘP"}
    ]
    t_kpi, _ = render_table(c3_x + 20, trk_y + 325, 470, "KpiDaily (reporting_db)", "CHỈ SỐ KPI NGÀY", kpi_cols, "#7E22CE")
    lines.append(t_kpi)

    # ShipmentStatusProjection
    proj_cols = [
        {"key": "PK", "name": "id", "type": "CUID", "attr": "NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "UNIQUE (CQRS PROJECTION)"},
        {"key": "", "name": "currentStatus / lastEventAt", "type": "VARCHAR / TIME", "attr": "TRẠNG THÁI BÁO CÁO"},
        {"key": "DIST", "name": "courierCode / hubCode", "type": "VARCHAR", "attr": "PHÂN QUYỀN TRUY VẤN"}
    ]
    t_proj, _ = render_table(c3_x + 510, trk_y + 265, 470, "ShipmentStatusProjection", "BẢN CHIẾU CQRS BÁO CÁO", proj_cols, "#7E22CE")
    lines.append(t_proj)

    # Chatbot RAG Vector Model (In-memory / pgvector)
    rag_cols = [
        {"key": "PK", "name": "chunkId", "type": "VARCHAR(64)", "attr": "NOT NULL"},
        {"key": "DIST", "name": "policySlug", "type": "VARCHAR(64)", "attr": "FK-dist masterdata.policies"},
        {"key": "", "name": "content", "type": "TEXT", "attr": "ĐOẠN VĂN CHÍNH SÁCH"},
        {"key": "", "name": "embeddingVector", "type": "FLOAT[768]", "attr": "GEMINI EMBEDDING-001"},
        {"key": "", "name": "category / tags", "type": "VARCHAR[]", "attr": "IATA, COMPENSATION..."},
        {"key": "", "name": "tokenCount", "type": "INT", "attr": "ĐỘ DÀI TOKEN"}
    ]
    t_rag, _ = render_table(c3_x + 510, trk_y + 445, 470, "VectorKnowledge (Chatbot)", "KHO TRI THỨC VECTOR RAG", rag_cols, "#0369A1")
    lines.append(t_rag)

    # Side Explanation Panel for Tracking, Reporting & Chatbot
    trk_panel_sections = [
        {
            "title": "MÔ HÌNH DÒNG SỰ KIỆN (EVENT SOURCING READ-MODEL) - TRACKING",
            "bullets": [
                '<tspan class="panel-bold">Bất biến (Append-only):</tspan> <tspan class="panel-code">TimelineEvent</tspan> lưu giữ toàn bộ các sự kiện xảy ra với kiện hàng theo trật tự thời gian chính xác.',
                '<tspan class="panel-bold">Bảo mật thông tin cá nhân (PII Masking):</tspan> Bảng <tspan class="panel-code">TrackingCurrent</tspan> tự động ẩn SĐT và địa chỉ chi tiết khi phục vụ cổng tra cứu công khai cho khách vãng lai (Guest).'
            ]
        },
        {
            "title": "KIẾN TRÚC TÁCH BIỆT TRUY VẤN (CQRS) & BÁO CÁO BI - REPORTING",
            "bullets": [
                '<tspan class="panel-bold">Không nghẽn DB vận hành:</tspan> Reporting-service tổng hợp dữ liệu bất đồng bộ qua RabbitMQ vào <tspan class="panel-code">KpiDaily / KpiMonthly</tspan>, giúp cấp quản lý xuất báo cáo BI mà không ảnh hưởng tải vận đơn.'
            ]
        },
        {
            "title": "TRỢ LÝ ẢO THÔNG MINH RAG VECTOR STORE - CHATBOT SERVICE",
            "bullets": [
                '<tspan class="panel-bold">Tìm kiếm tương đồng ngữ nghĩa (Cosine):</tspan> Lưu trữ các đoạn văn bản chính sách bưu chính cùng vector 768 chiều nhúng bởi Gemini để trả lời khách hàng chuẩn xác, không ảo giác.'
            ]
        }
    ]
    lines.append(render_explanation_panel(c3_x + 1000, trk_y + 75, 875, 1475, 
                                           "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: TRACKING, REPORTING & AI", 
                                           "ANALYTICS & AI COGNITION", "#2563EB", trk_panel_sections,
                                           "Engines: tracking_db + reporting_db (CQRS Projections) | AI: Gemini 768-D Vector Cosine Similarity"))

    # =========================================================================
    # GRAND BOTTOM BANNER: DISTRIBUTED SAGA & CROSS-SERVICE INTEGRATION
    # =========================================================================
    bot_y = 4640
    bot_h = 240
    lines.append(f'''
  <!-- GRAND BOTTOM ARCHITECTURE & LEGEND BANNER -->
  <g id="GrandBottomBanner" transform="translate(60, {bot_y})">
    <rect width="{CANVAS_WIDTH - 120}" height="{bot_h}" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    
    <!-- Title -->
    <text x="35" y="38" font-size="16" font-weight="800" fill="#000000" letter-spacing="0.5px">CƠ CHẾ ĐẢM BẢO TÍNH TOÀN VẸN DỮ LIỆU PHÂN TÁN (DISTRIBUTED SAGA &amp; TRANSACTIONAL OUTBOX PATTERN)</text>
    <text x="35" y="62" font-size="12.5" fill="#374151">Trong kiến trúc Database-per-Service, tuyệt đối không dùng Foreign Key cứng giữa các Database. Mọi giao dịch phân tán được điều phối hướng sự kiện qua RabbitMQ Event Mesh với tính nhất quán cuối cùng (Eventual Consistency).</text>

    <!-- Visual Saga Flow Nodes -->
    <g transform="translate(35, 95)">
      <!-- Step 1 -->
      <rect x="0" y="0" width="320" height="85" rx="6" fill="#F9FAFB" stroke="#000000" stroke-width="1.4"/>
      <text x="16" y="26" font-size="12.5" font-weight="800" fill="#000000">1. KHỞI TẠO VẬN ĐƠN</text>
      <text x="16" y="48" font-size="11" fill="#1F2937">shipment-service (Status: CREATED)</text>
      <text x="16" y="68" font-size="10.5" fill="#4B5563">Lưu DB + Ghi Transactional Outbox Event</text>

      <path d="M 325 42 L 360 42" stroke="#000000" stroke-width="2" marker-end="url(#arrow-dist)"/>

      <!-- Step 2 -->
      <rect x="365" y="0" width="320" height="85" rx="6" fill="#F9FAFB" stroke="#000000" stroke-width="1.4"/>
      <text x="381" y="26" font-size="12.5" font-weight="800" fill="#000000">2. ĐIỀU PHỐI GOM HÀNG</text>
      <text x="381" y="48" font-size="11" fill="#1F2937">pickup-service &amp; dispatch-service</text>
      <text x="381" y="68" font-size="10.5" fill="#4B5563">Gán Courier thu gom tại địa chỉ kho Shop</text>

      <path d="M 690 42 L 725 42" stroke="#000000" stroke-width="2" marker-end="url(#arrow-dist)"/>

      <!-- Step 3 -->
      <rect x="730" y="0" width="320" height="85" rx="6" fill="#F9FAFB" stroke="#000000" stroke-width="1.4"/>
      <text x="746" y="26" font-size="12.5" font-weight="800" fill="#000000">3. KHAI THÁC &amp; ĐƯỜNG TRỤC</text>
      <text x="746" y="48" font-size="11" fill="#1F2937">scan-service &amp; manifest-service</text>
      <text x="746" y="68" font-size="10.5" fill="#4B5563">Quét Inbound/Outbound, kẹp chì Seal xe tải</text>

      <path d="M 1055 42 L 1090 42" stroke="#000000" stroke-width="2" marker-end="url(#arrow-dist)"/>

      <!-- Step 4 -->
      <rect x="1095" y="0" width="320" height="85" rx="6" fill="#F9FAFB" stroke="#000000" stroke-width="1.4"/>
      <text x="1111" y="26" font-size="12.5" font-weight="800" fill="#000000">4. PHÁT HÀNG CHẶNG CUỐI</text>
      <text x="1111" y="48" font-size="11" fill="#1F2937">delivery-service (Last-mile)</text>
      <text x="1111" y="68" font-size="10.5" fill="#4B5563">Chụp ảnh POD / OTP, lập biên bản NDR nếu lỗi</text>

      <path d="M 1420 42 L 1455 42" stroke="#000000" stroke-width="2" marker-end="url(#arrow-dist)"/>

      <!-- Step 5 -->
      <rect x="1460" y="0" width="320" height="85" rx="6" fill="#F9FAFB" stroke="#000000" stroke-width="1.4"/>
      <text x="1476" y="26" font-size="12.5" font-weight="800" fill="#000000">5. KẾT TOÁN COD &amp; ĐỐI SOÁT</text>
      <text x="1476" y="48" font-size="11" fill="#1F2937">payment-service (VietQR / PayOS)</text>
      <text x="1476" y="68" font-size="10.5" fill="#4B5563">Tài xế nộp tiền ca, tự động gạch nợ ví Shop</text>

      <path d="M 1785 42 L 1820 42" stroke="#000000" stroke-width="2" marker-end="url(#arrow-dist)"/>

      <!-- Step 6 -->
      <rect x="1825" y="0" width="320" height="85" rx="6" fill="#F9FAFB" stroke="#000000" stroke-width="1.4"/>
      <text x="1841" y="26" font-size="12.5" font-weight="800" fill="#000000">6. DÒNG THỜI GIAN &amp; BÁO CÁO BI</text>
      <text x="1841" y="48" font-size="11" fill="#1F2937">tracking-service &amp; reporting-service</text>
      <text x="1841" y="68" font-size="10.5" fill="#4B5563">Event Sourcing lịch trình &amp; KPI đa chiều</text>
    </g>

    <!-- Legend box on the right -->
    <g transform="translate({CANVAS_WIDTH - 1620}, 25)">
      <rect width="1520" height="190" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <text x="25" y="32" font-size="13" font-weight="800" fill="#000000">KÝ HIỆU LƯỢC ĐỒ (ERD &amp; SAGA LEGEND):</text>
      
      <!-- Row 1 -->
      <rect x="25" y="52" width="24" height="16" rx="2" fill="#000000"/>
      <text x="37" y="64" class="badge-pk" text-anchor="middle">PK</text>
      <text x="56" y="64" font-size="11.5" fill="#1F2937">Primary Key (Khóa chính bảng nội bộ)</text>

      <rect x="330" y="52" width="24" height="16" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <text x="342" y="64" class="badge-fk" text-anchor="middle">FK</text>
      <text x="362" y="64" font-size="11.5" fill="#1F2937">Foreign Key (Khóa ngoại nội bộ Database dịch vụ)</text>

      <rect x="700" y="52" width="30" height="16" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="1" stroke-dasharray="2 1.5"/>
      <text x="715" y="64" class="badge-dist" text-anchor="middle">DIST</text>
      <text x="738" y="64" font-size="11.5" fill="#1F2937">Distributed Saga Key (Khóa nghiệp vụ liên kết liên dịch vụ)</text>

      <!-- Row 2 -->
      <line x1="25" y1="108" x2="95" y2="108" stroke="#000000" stroke-width="2" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
      <text x="110" y="112" font-size="11.5" fill="#1F2937">Quan hệ Crow's Foot: 1 Cha liên kết Nhiều Con (1 : N)</text>

      <line x1="500" y1="108" x2="570" y2="108" stroke="#000000" stroke-width="2" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>
      <text x="585" y="112" font-size="11.5" fill="#1F2937">Quan hệ Crow's Foot: 1 Cha liên kết Duy nhất 1 Con (1 : 1)</text>

      <line x1="960" y1="108" x2="1030" y2="108" stroke="#000000" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#arrow-dist)"/>
      <text x="1045" y="112" font-size="11.5" fill="#1F2937">Luồng sự kiện RabbitMQ Outbox Eventual Consistency</text>

      <line x1="25" y1="145" x2="1490" y2="145" stroke="#E5E7EB" stroke-width="1"/>
      <text x="25" y="168" font-size="11" fill="#4B5563">Chuẩn hóa thiết kế: Antigravity AI Engineering Team | Định dạng Vector SVG 1:1 tương thích Figma Canvas &amp; LaTeX Thesis Publication</text>
    </g>
  </g>
''')

    lines.append('</svg>')
    
    content = "\n".join(lines)
    os.makedirs(os.path.dirname(OUTPUT_SVG), exist_ok=True)
    with open(OUTPUT_SVG, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"Generated successfully: {OUTPUT_SVG} ({len(content)} bytes)")
    
    try:
        ET.fromstring(content)
        print("XML Validation PASSED! Clean, well-formed SVG.")
    except Exception as e:
        print(f"XML Validation FAILED: {e}")
        raise

if __name__ == "__main__":
    generate_svg()
