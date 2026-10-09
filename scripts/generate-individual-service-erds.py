#!/usr/bin/env python3
"""
generate-individual-service-erds.py
Generates 13 individual, standalone ERD SVG diagrams for each microservice
in the Nexus Logistics Management System graduation thesis.

STANDARDIZED DIMENSIONS & SPECIFICATION (Per User Request):
- Global Canvas: Width = 2000px, Height = 1300px
- Explanation Panel: Fixed Width = 700px, Height = 1020px (X = 1200)
- Table Columns: Width = 480px, Column 1 at X=40, Column 2 at X=680
- Central Connector Highway: Width = 160px (X = 520 to 680)
  * Lane 1 (X = 560): Column 1 internal relationships
  * Lane 2 (X = 600): Column 1 <-> Column 2 cross-relationships
  * Lane 3 (X = 640): Column 2 internal relationships
- Generous table spacing (32px - 60px) to clearly highlight all connectors
- 100% FAITHFUL TO THE ACTUAL PRISMA SCHEMAS (services/*/prisma/schema.prisma)
- Table headers without background fill (clean technical line divider)
- Clean Monochrome Technical Blueprint (Trắng - Đen - Xám)

Outputs to:
  docs/graduation-thesis/figma-page-1-system-and-data/diagrams/erd/
"""

import xml.etree.ElementTree as ET
import html
import os
import re
import textwrap

OUTPUT_DIR = "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/erd"

def escape(text):
    return html.escape(str(text))

def sanitize_xml_text(s):
    return html.escape(str(s))

def render_table(tx, ty, tw, tname, entity_label, columns):
    row_height = 24
    header_height = 36
    th = header_height + len(columns) * row_height + 8
    out = []
    out.append(f'<g transform="translate({tx}, {ty})">')
    # Table Box - Pure white, crisp black stroke
    out.append(f'  <rect width="{tw}" height="{th}" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>')
    # Table Header - NO background fill (clean technical divider line)
    out.append(f'  <line x1="0" y1="{header_height}" x2="{tw}" y2="{header_height}" stroke="#000000" stroke-width="1.2"/>')
    out.append(f'  <text x="14" y="23" class="tbl-header">{escape(tname)}</text>')
    if entity_label:
        lbl = entity_label
        if len(lbl) + len(tname) > 44:
            lbl = lbl[:28] + "..."
        out.append(f'  <text x="{tw - 14}" y="23" class="tbl-tag" text-anchor="end">{escape(lbl)}</text>')
    
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
        max_type_len = 28
        combined_type = f"{type_str} {attr_str}".strip() if attr_str else type_str
        if len(combined_type) > max_type_len:
            avail = max(0, max_type_len - len(type_str) - 1)
            attr_short = attr_str[:avail].rstrip()
            combined_type = f"{type_str} {attr_short}".strip()
        out.append(f'  <text x="{tw - 12}" y="{cy}" class="tbl-type" text-anchor="end">{escape(combined_type)}</text>')
        
    out.append('</g>')
    return "\n".join(out), th

def render_explanation_panel(px, py, pw, ph, title, badge_text, sections, stats_footer=None):
    out = []
    out.append(f'<g transform="translate({px}, {py})">')
    # Panel box
    out.append(f'  <rect width="{pw}" height="{ph}" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>')
    # Header bar
    out.append(f'  <rect x="0" y="0" width="{pw}" height="42" rx="6" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>')
    out.append(f'  <rect x="14" y="12" width="6" height="18" rx="1" fill="#000000"/>')
    out.append(f'  <text x="28" y="26" class="panel-header">{escape(title)}</text>')
    
    badge_w = max(170, int(len(badge_text) * 7.0) + 24)
    out.append(f'  <rect x="{pw - badge_w - 14}" y="9" width="{badge_w}" height="24" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>')
    out.append(f'  <text x="{pw - 14 - badge_w/2}" y="25" font-size="10" font-weight="700" fill="#000000" text-anchor="middle">{escape(badge_text)}</text>')
    
    # Sections with text wrapping (pw=700 -> wrap at 74 chars)
    curr_y = 70
    wrap_chars = 74
    for sec in sections:
        out.append(f'  <text x="18" y="{curr_y}" class="panel-sec-title">▶ {escape(sec["title"])}</text>')
        curr_y += 22
        for bullet in sec["bullets"]:
            wrapped = textwrap.wrap(bullet, width=wrap_chars)
            for idx, line in enumerate(wrapped):
                if idx == 0:
                    out.append(f'  <circle cx="25" cy="{curr_y - 4}" r="2" fill="#000000"/>')
                    out.append(f'  <text x="36" y="{curr_y}" class="panel-body">{escape(line)}</text>')
                else:
                    out.append(f'  <text x="36" y="{curr_y}" class="panel-body">{escape(line)}</text>')
                curr_y += 18
            curr_y += 4
        curr_y += 10
    
    # Stats footer chip
    if stats_footer:
        out.append(f'  <rect x="14" y="{ph - 38}" width="{pw - 28}" height="26" rx="4" fill="#F9FAFB" stroke="#000000" stroke-width="1"/>')
        out.append(f'  <text x="{pw/2}" y="{ph - 21}" font-size="11" font-weight="600" fill="#111827" text-anchor="middle">{escape(stats_footer)}</text>')
        
    out.append('</g>')
    return "\n".join(out)

def process_connector_match(match):
    full_tag = match.group(0)
    
    # Extract d
    m_d = re.search(r'd="([^"]+)"', full_tag)
    if not m_d:
        return full_tag
    d_str = m_d.group(1)
    
    # Extract marker-start and marker-end
    m_start = re.search(r'marker-start="url\(#([^)]+)\)"', full_tag)
    m_end = re.search(r'marker-end="url\(#([^)]+)\)"', full_tag)
    
    start_type = m_start.group(1) if m_start else None
    end_type = m_end.group(1) if m_end else None
    
    # Parse points from d_str
    tokens = d_str.strip().split()
    pts = []
    i = 0
    while i < len(tokens):
        cmd = tokens[i]
        if cmd in ('M', 'L'):
            x = float(tokens[i+1])
            y = float(tokens[i+2])
            pts.append((x, y))
            i += 3
        else:
            i += 1
            
    if len(pts) < 2:
        return full_tag
        
    out = []
    # Base connector line (without marker attributes so Figma won't drop anything)
    out.append(f'  <path d="{d_str}" stroke="#000000" stroke-width="1.8" fill="none"/>')
    
    # 1. Process START endpoint (crow-many, crow-one, 1, N)
    x0, y0 = pts[0]
    x1, y1 = pts[1]
    dx0 = 1 if x1 > x0 else -1
    
    if start_type in ("crow-many", "many", "N"):
        x_base = x0 + 13 * dx0
        out.append(f'  <path d="M {x_base} {y0} L {x0} {y0 - 7} M {x_base} {y0} L {x0} {y0 + 7}" stroke="#000000" stroke-width="1.8" fill="none"/>')
        x_bar = x0 + 17 * dx0
        out.append(f'  <line x1="{x_bar}" y1="{y0 - 6}" x2="{x_bar}" y2="{y0 + 6}" stroke="#000000" stroke-width="1.8"/>')
        lbl_x = x0 + 26 * dx0
        anchor = "start" if dx0 > 0 else "end"
        out.append(f'  <text x="{lbl_x}" y="{y0 - 5}" font-size="11" font-weight="700" fill="#000000" text-anchor="{anchor}">N</text>')
    elif start_type in ("crow-one", "one", "1"):
        b1 = x0 + 7 * dx0
        b2 = x0 + 13 * dx0
        out.append(f'  <line x1="{b1}" y1="{y0 - 6}" x2="{b1}" y2="{y0 + 6}" stroke="#000000" stroke-width="1.8"/>')
        out.append(f'  <line x1="{b2}" y1="{y0 - 6}" x2="{b2}" y2="{y0 + 6}" stroke="#000000" stroke-width="1.8"/>')
        lbl_x = x0 + 22 * dx0
        anchor = "start" if dx0 > 0 else "end"
        out.append(f'  <text x="{lbl_x}" y="{y0 - 5}" font-size="11" font-weight="700" fill="#000000" text-anchor="{anchor}">1</text>')

    # 2. Process END endpoint (crow-many, crow-one, 1, N)
    xe, ye = pts[-1]
    xp, yp = pts[-2]
    dxe = 1 if xe > xp else -1
    
    if end_type in ("crow-many", "many", "N"):
        x_base = xe - 13 * dxe
        out.append(f'  <path d="M {x_base} {ye} L {xe} {ye - 7} M {x_base} {ye} L {xe} {ye + 7}" stroke="#000000" stroke-width="1.8" fill="none"/>')
        x_bar = xe - 17 * dxe
        out.append(f'  <line x1="{x_bar}" y1="{ye - 6}" x2="{x_bar}" y2="{ye + 6}" stroke="#000000" stroke-width="1.8"/>')
        lbl_x = xe - 26 * dxe
        anchor = "end" if dxe > 0 else "start"
        out.append(f'  <text x="{lbl_x}" y="{ye - 5}" font-size="11" font-weight="700" fill="#000000" text-anchor="{anchor}">N</text>')
    elif end_type in ("crow-one", "one", "1"):
        b1 = xe - 7 * dxe
        b2 = xe - 13 * dxe
        out.append(f'  <line x1="{b1}" y1="{ye - 6}" x2="{b1}" y2="{ye + 6}" stroke="#000000" stroke-width="1.8"/>')
        out.append(f'  <line x1="{b2}" y1="{ye - 6}" x2="{b2}" y2="{ye + 6}" stroke="#000000" stroke-width="1.8"/>')
        lbl_x = xe - 22 * dxe
        anchor = "end" if dxe > 0 else "start"
        out.append(f'  <text x="{lbl_x}" y="{ye - 5}" font-size="11" font-weight="700" fill="#000000" text-anchor="{anchor}">1</text>')
        
    return "\n".join(out)

def convert_svg_connectors_for_figma(svg_text):
    """
    Replaces SVG <path ... marker-.../> with explicit inline vector shapes:
    - Three-pronged Crow's foot (<path>) + mandatory vertical bar (<line>)
    - Double vertical ticks (<line> + <line>) for '1'
    - Cardinality text labels '1' and 'N'
    This guarantees 100% vector fidelity in Figma (which discards <marker>).
    """
    pattern = re.compile(r'<path\b[^>]*?(?:marker-start|marker-end)[^>]*?/>', re.DOTALL)
    return pattern.sub(process_connector_match, svg_text)

def build_standalone_svg(filename, width, height, svc_name, port_str, db_str, desc_str, 
                         tables_markup, connectors_markup, panel_title, badge_text, sections, stats_footer,
                         saga_footer_text):
    lines = []
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')
    lines.append(f'''
  <!-- Technical Blueprint Double Frame -->
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
    container_h = height - content_y - 90
    lines.append(f'''
  <!-- MAIN SERVICE CONTAINER -->
  <g id="ServiceBody" transform="translate(40, {content_y})">
    <rect width="{width - 80}" height="{container_h}" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>
''')

    # Tables & Connectors (Converted to Figma-compatible inline vectors)
    lines.append(tables_markup)
    lines.append(convert_svg_connectors_for_figma(connectors_markup))

    # Explanation Panel (Fixed Width = 700px per user requirement)
    panel_w = 700
    panel_x = (width - 80) - panel_w - 20  # 1920 - 700 - 20 = 1200
    panel_h = container_h - 40
    panel_svg = render_explanation_panel(panel_x, 20, panel_w, panel_h, panel_title, badge_text, sections, stats_footer)
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
    # 1. AUTH-SERVICE (:3010 | auth_db) - 100% PRISMA EXACT
    # =========================================================================
    user_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "NOT NULL (CUID)"},
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
    sess_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
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
    prof_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "actor", "type": "VARCHAR(32)", "attr": "UNIQUE (COURIER/OPS)"},
        {"key": "", "name": "permissions", "type": "JSONB", "attr": "ALLOWED ACTIONS"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"},
        {"key": "", "name": "updatedAt", "type": "TIMESTAMP", "attr": "ON UPDATE"}
    ]
    over_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "userId", "type": "VARCHAR(64)", "attr": "UNIQUE FK -> UserAccount"},
        {"key": "", "name": "permissions", "type": "JSONB", "attr": "OVERRIDE ACTIONS"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"},
        {"key": "", "name": "updatedAt", "type": "TIMESTAMP", "attr": "ON UPDATE"}
    ]
    audit_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "actorId", "type": "VARCHAR(64)", "attr": "ID TÁC NHÂN"},
        {"key": "", "name": "actorUsername", "type": "VARCHAR(64)", "attr": "TÊN ĐĂNG NHẬP"},
        {"key": "", "name": "action", "type": "VARCHAR(64)", "attr": "LOGIN, GRANT, REVOKE"},
        {"key": "", "name": "targetType", "type": "VARCHAR(64)", "attr": "LOẠI ĐỐI TƯỢNG"},
        {"key": "", "name": "targetId", "type": "VARCHAR(64)", "attr": "ID ĐỐI TƯỢNG"},
        {"key": "", "name": "ipAddress", "type": "VARCHAR(45)", "attr": "IP CLIENT"},
        {"key": "", "name": "before", "type": "JSONB", "attr": "TRƯỚC THAY ĐỔI"},
        {"key": "", "name": "after", "type": "JSONB", "attr": "SAU THAY ĐỔI"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM GHI"}
    ]
    outbox_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType", "type": "VARCHAR(64)", "attr": "USER.CREATED, ..."},
        {"key": "", "name": "aggregateType", "type": "VARCHAR(64)", "attr": "UserAccount"},
        {"key": "", "name": "aggregateId", "type": "VARCHAR(64)", "attr": "ID TÀI KHOẢN"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "EVENT PAYLOAD"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, PUBLISHED"},
        {"key": "", "name": "retryCount", "type": "INT", "attr": "SỐ LẦN THỬ LẠI"},
        {"key": "", "name": "occurredAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM PHÁT SINH"}
    ]

    s1_t1, s1_h1 = render_table(40, 30, 480, "UserAccount", "USERS", user_cols)
    s1_t2, s1_h2 = render_table(680, 30, 480, "AuthSession", "AUTH_SESSIONS", sess_cols)
    s1_t3, s1_h3 = render_table(40, 30 + s1_h1 + 48, 480, "MobilePermissionProfile", "MOBILE_PROFILES", prof_cols)
    s1_t4, s1_h4 = render_table(680, 30 + s1_h2 + 48, 480, "MobilePermissionOverride", "PERM_OVERRIDES", over_cols)
    s1_t5, s1_h5 = render_table(40, 30 + s1_h1 + 48 + s1_h3 + 48, 480, "AdminAuditLog", "ADMIN_AUDIT_LOGS", audit_cols)
    s1_t6, s1_h6 = render_table(680, 30 + s1_h2 + 48 + s1_h4 + 48, 480, "OutboxEvent (Auth)", "OUTBOX_EVENTS", outbox_cols)

    y_over = 30 + s1_h2 + 48 + 40
    s1_connectors = f'''
    <!-- UserAccount (1) -> AuthSession (N) Direct Cross -->
    <path d="M 520 75 L 680 75" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <!-- UserAccount (1) -> MobilePermissionOverride (N) via Center Highway Lane 2 -->
    <path d="M 520 160 L 600 160 L 600 {y_over} L 680 {y_over}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <!-- MobilePermissionProfile (1) -> MobilePermissionOverride (N) Direct Cross -->
    <path d="M 520 {30 + s1_h1 + 48 + 50} L 680 {30 + s1_h1 + 48 + 50}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    '''

    s1_sections = [
        {
            "title": "VAI TRÒ & TRÁCH NHIỆM DỮ LIỆU",
            "bullets": [
                "Trung tâm định danh: Lưu trữ tài khoản, mật khẩu băm Argon2id và quản lý phiên đăng nhập tại auth_sessions.",
                "Phân quyền 2 lớp (Dual Authorization): RBAC cho Web kết hợp phân quyền chi tiết (Granular Mobile Permissions) cho tài xế và nhân viên bưu cục trên app.",
                "Nhật ký an ninh (Audit Trail): Bảng admin_audit_logs ghi nhận chính xác vết diff (before/after) mọi thay đổi quyền hạn."
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                "hubCodes: Mảng mã bưu cục gắn cho nhân sự, ánh xạ sang masterdata.hubs.code để kiểm soát phạm vi tác nghiệp.",
                "userId: Khóa định danh nhúng trong JWT claims, dùng đối soát quyền tại tất cả các Microservices khác."
            ]
        },
        {
            "title": "QUY TẮC TOÀN VẸN & BẢO MẬT",
            "bullets": [
                "Thu hồi phiên tức thì: Khi phát hiện gian lận hoặc đăng xuất, cờ status = REVOKED được kích hoạt ngay lập tức.",
                "Transactional Outbox: Sự kiện tài khoản được lưu đồng thời cùng transaction DB, luồng Outbox Publisher đảm bảo đồng bộ 100% sang RabbitMQ."
            ]
        }
    ]

    build_standalone_svg("01-auth-service-erd.svg", 2000, 1300,
                         "1. AUTH-SERVICE (DỊCH VỤ ĐỊNH DANH & PHÂN QUYỀN TRUY CẬP)",
                         "3010", "auth_db",
                         "Quản lý vòng đời tài khoản, xác thực Argon2id, quản lý phiên JWT kép & phân quyền Mobile",
                         f"{s1_t1}\n{s1_t2}\n{s1_t3}\n{s1_t4}\n{s1_t5}\n{s1_t6}",
                         s1_connectors,
                         "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: AUTH-SERVICE",
                         "SECURITY BOUNDARY",
                         s1_sections,
                         "Engine: PostgreSQL 16 | Isolation: Read Committed | Password: Argon2id | Auth: Dual JWT Bearer",
                         "Phát hành sự kiện USER.CREATED, USER.STATUS_CHANGED qua RabbitMQ tới masterdata-service & dispatch-service")

    # =========================================================================
    # 2. MASTERDATA-SERVICE (:3001 | masterdata_db) - 100% PRISMA EXACT
    # =========================================================================
    hub_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "code", "type": "VARCHAR(32)", "attr": "UNIQUE (HUB-SGN-01)"},
        {"key": "", "name": "name", "type": "VARCHAR(128)", "attr": "TÊN BƯU CỤC/KHO"},
        {"key": "", "name": "level", "type": "INT", "attr": "0:HQ, 1:REG, 2:PROV, 3:WARD"},
        {"key": "FK", "name": "parentCode", "type": "VARCHAR(32)", "attr": "NULLABLE -> Hub.code"},
        {"key": "FK", "name": "zoneCode", "type": "VARCHAR(32)", "attr": "NULLABLE -> Zone.code"},
        {"key": "", "name": "address / ward", "type": "VARCHAR(255)", "attr": "ĐỊA CHỈ HÀNH CHÍNH"},
        {"key": "", "name": "province / district", "type": "VARCHAR(64)", "attr": "TỈNH & QUẬN/HUYỆN"},
        {"key": "", "name": "latitude / longitude", "type": "FLOAT", "attr": "TỌA ĐỘ GPS BƯU CỤC"},
        {"key": "", "name": "boundaryPolygon", "type": "JSONB", "attr": "ĐA GIÁC ĐỊA BÀN PHỤ TRÁCH"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "ACTIVE, INACTIVE"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    zone_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "code", "type": "VARCHAR(32)", "attr": "UNIQUE (ZONE-HCM-NOITHANH)"},
        {"key": "", "name": "name", "type": "VARCHAR(64)", "attr": "TÊN VÙNG CƯỚC"},
        {"key": "", "name": "colorHex", "type": "VARCHAR(16)", "attr": "MÃ MÀU HIỂN THỊ MAP"},
        {"key": "", "name": "description", "type": "VARCHAR(255)", "attr": "MÔ TẢ VÙNG TÍNH GIÁ"},
        {"key": "", "name": "isActive", "type": "BOOLEAN", "attr": "DEFAULT TRUE"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    courier_area_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "FK-dist auth.users"},
        {"key": "FK", "name": "hubCode", "type": "VARCHAR(32)", "attr": "FK -> Hub.code"},
        {"key": "FK", "name": "zoneCode", "type": "VARCHAR(32)", "attr": "NULLABLE -> Zone.code"},
        {"key": "", "name": "ward / district", "type": "VARCHAR(64)", "attr": "ĐỊA BÀN PHỤ TRÁCH"},
        {"key": "", "name": "polygon", "type": "JSONB", "attr": "RANH GIỚI TUYẾN GIAO"},
        {"key": "", "name": "color", "type": "VARCHAR(16)", "attr": "MÃ MÀU TRÊN MAP"},
        {"key": "", "name": "isActive", "type": "BOOLEAN", "attr": "DEFAULT TRUE"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    merchant_prof_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "userId", "type": "VARCHAR(64)", "attr": "UNIQUE FK-dist auth.users"},
        {"key": "", "name": "businessName", "type": "VARCHAR(128)", "attr": "TÊN DOANH NGHIỆP/SHOP"},
        {"key": "", "name": "taxCode", "type": "VARCHAR(32)", "attr": "MÃ SỐ THUẾ"},
        {"key": "", "name": "bankAccount", "type": "VARCHAR(64)", "attr": "SỐ TK ĐỐI SOÁT COD"},
        {"key": "", "name": "bankName", "type": "VARCHAR(64)", "attr": "NGÂN HÀNG THỤ HƯỞNG"}
    ]
    cust_prof_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "userId", "type": "VARCHAR(64)", "attr": "UNIQUE FK-dist auth.users"},
        {"key": "", "name": "phone", "type": "VARCHAR(20)", "attr": "INDEX SĐT NGƯỜI NHẬN"},
        {"key": "", "name": "fullName", "type": "VARCHAR(128)", "attr": "HỌ VÀ TÊN KHÁCH"},
        {"key": "", "name": "defaultAddress", "type": "VARCHAR(255)", "attr": "ĐỊA CHỈ NHẬN MẶC ĐỊNH"}
    ]
    ndr_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "code", "type": "VARCHAR(32)", "attr": "UNIQUE (NDR_CUST_UNREACHABLE)"},
        {"key": "", "name": "description", "type": "VARCHAR(255)", "attr": "LÝ DO GIAO THẤT BẠI"},
        {"key": "", "name": "isActive", "type": "BOOLEAN", "attr": "DEFAULT TRUE"}
    ]
    config_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "key", "type": "VARCHAR(64)", "attr": "UNIQUE CẤU HÌNH HỆ THỐNG"},
        {"key": "", "name": "value", "type": "JSONB", "attr": "GIÁ TRỊ CẤU HÌNH"},
        {"key": "", "name": "scope", "type": "VARCHAR(32)", "attr": "GLOBAL, HUB, DISPATCH"}
    ]
    policy_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "title / slug", "type": "VARCHAR(255)", "attr": "CHÍNH SÁCH BƯU CHÍNH"},
        {"key": "", "name": "category", "type": "ENUM", "attr": "CLAIM, PRICING, PROHIBITED"},
        {"key": "", "name": "summary / content", "type": "TEXT", "attr": "VĂN BẢN QUY PHẠM"},
        {"key": "", "name": "status / version", "type": "ENUM / INT", "attr": "PUBLISHED, DRAFT"}
    ]
    md_outbox_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE SỰ KIỆN"},
        {"key": "", "name": "eventType", "type": "VARCHAR(64)", "attr": "MASTERDATA.HUB_UPDATED"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "DỮ LIỆU ĐỒNG BỘ"}
    ]

    s2_t1, s2_h1 = render_table(40, 25, 480, "Hub", "HUBS (MẠNG LƯỚI KHO BƯU CỤC)", hub_cols)
    s2_t2, s2_h2 = render_table(680, 25, 480, "Zone", "ZONES (VÙNG ĐỊA LÝ TÍNH CƯỚC)", zone_cols)
    s2_t3, s2_h3 = render_table(40, 25 + s2_h1 + 32, 480, "CourierAreaAssignment", "COURIER_AREAS (PHÂN TUYẾN GIAO)", courier_area_cols)
    s2_t4, s2_h4 = render_table(680, 25 + s2_h2 + 32, 480, "MerchantProfile", "MERCHANT_PROFILES (HỒ SƠ SHOP)", merchant_prof_cols)
    s2_t5, s2_h5 = render_table(680, 25 + s2_h2 + 32 + s2_h4 + 32, 480, "CustomerProfile", "CUSTOMER_PROFILES (HỒ SƠ KHÁCH)", cust_prof_cols)
    s2_t6, s2_h6 = render_table(40, 25 + s2_h1 + 32 + s2_h3 + 32, 480, "NdrReason", "NDR_REASONS (DANH MỤC LỖI GIAO)", ndr_cols)
    s2_t7, s2_h7 = render_table(40, 25 + s2_h1 + 32 + s2_h3 + 32 + s2_h6 + 32, 480, "Config", "CONFIGS (THAM SỐ HỆ THỐNG)", config_cols)
    s2_t8, s2_h8 = render_table(680, 25 + s2_h2 + 32 + s2_h4 + 32 + s2_h5 + 32, 480, "Policy", "POLICIES (CHÍNH SÁCH BƯU CHÍNH)", policy_cols)
    s2_t9, s2_h9 = render_table(680, 25 + s2_h2 + 32 + s2_h4 + 32 + s2_h5 + 32 + s2_h8 + 32, 480, "OutboxEvent (MasterData)", "OUTBOX_EVENTS", md_outbox_cols)

    y_ca = 25 + s2_h1 + 32 + 50
    s2_connectors = f'''
    <!-- Hub (N) -> Zone (1) Direct Cross -->
    <path d="M 520 75 L 680 75" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-many)" marker-end="url(#crow-one)"/>
    <!-- Hub (1) -> CourierAreaAssignment (N) via Center Highway Lane 1 -->
    <path d="M 520 200 L 560 200 L 560 {y_ca} L 520 {y_ca}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <!-- Zone (1) -> CourierAreaAssignment (N) via Center Highway Lane 2 -->
    <path d="M 680 140 L 600 140 L 600 {y_ca + 30} L 520 {y_ca + 30}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    '''

    s2_sections = [
        {
            "title": "VAI TRÒ & TRÁCH NHIỆM DỮ LIỆU CỐT LÕI",
            "bullets": [
                "Cung cấp danh mục dùng chung (Single Source of Master Data) cho toàn bộ 12 Microservices khác.",
                "Quản lý mạng lưới bưu cục (Hub): Phân cấp 4 tầng (HQ -> Regional -> Provincial -> Ward), lưu trữ tọa độ GPS và đa giác ranh giới GeoJSON boundaryPolygon.",
                "Phân tuyến bưu tá (CourierAreaAssignment): Định danh bưu tá chịu trách nhiệm trên từng phường/xã, gắn mã màu hiển thị trên bản đồ điều hành."
            ]
        },
        {
            "title": "HIỆU NĂNG & ĐỒNG BỘ CACHE",
            "bullets": [
                "Read-Heavy Caching: Dữ liệu Hub, Zone và Config được cache tại tầng Redis với TTL dài (24h) để phục vụ tra cứu tốc độ cao.",
                "Sự kiện thay đổi (OutboxEvent): Phát sự kiện MASTERDATA.HUB_UPDATED qua RabbitMQ fanout tới scan-service, dispatch-service và routing engine."
            ]
        }
    ]

    build_standalone_svg("02-masterdata-service-erd.svg", 2000, 1300,
                         "2. MASTERDATA-SERVICE (DỊCH VỤ DỮ LIỆU DANH MỤC & MẠNG LƯỚI BƯU CỤC)",
                         "3001", "masterdata_db",
                         "Quản trị mạng lưới bưu cục, phân vùng cước, phân tuyến bưu tá, hồ sơ Shop/Khách & danh mục quy chuẩn",
                         f"{s2_t1}\n{s2_t2}\n{s2_t3}\n{s2_t4}\n{s2_t5}\n{s2_t6}\n{s2_t7}\n{s2_t8}\n{s2_t9}",
                         s2_connectors,
                         "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: MASTERDATA-SERVICE",
                         "MASTER REGISTRY",
                         s2_sections,
                         "Engine: PostgreSQL 16 | Spatial: GeoJSON Polygons | Caching: Redis Read-Through | Consistency: Strong",
                         "Phát sự kiện MASTERDATA.HUB_UPDATED, ZONE_UPDATED tới dispatch-service, scan-service & tracking-service")

    # =========================================================================
    # 3. SHIPMENT-SERVICE (:3002 | shipment_db) - 100% PRISMA EXACT
    # =========================================================================
    ship_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "code", "type": "VARCHAR(32)", "attr": "UNIQUE (NX-123456)"},
        {"key": "DIST", "name": "merchantId", "type": "VARCHAR(64)", "attr": "FK-dist masterdata.merchant"},
        {"key": "", "name": "senderAddress", "type": "VARCHAR(255)", "attr": "ĐỊA CHỈ GỬI CHI TIẾT"},
        {"key": "", "name": "receiverName", "type": "VARCHAR(128)", "attr": "TÊN NGƯỜI NHẬN"},
        {"key": "", "name": "receiverPhone", "type": "VARCHAR(20)", "attr": "INDEX SĐT NHẬN"},
        {"key": "", "name": "receiverAddress", "type": "VARCHAR(255)", "attr": "ĐỊA CHỈ NHẬN"},
        {"key": "DIST", "name": "originHubCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC GỐC CHẤP NHẬN"},
        {"key": "DIST", "name": "destinationHubCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC ĐÍCH PHÁT"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "19 TRẠNG THÁI FSM CANONICAL"},
        {"key": "", "name": "codAmount / fee", "type": "FLOAT", "attr": "TIỀN THU HỘ & CƯỚC PHÍ"},
        {"key": "", "name": "isLocked", "type": "BOOLEAN", "attr": "DEFAULT FALSE (LOCK KHI SỰ CỐ)"}
    ]
    cr_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "shipmentId", "type": "VARCHAR(64)", "attr": "FK -> Shipment.id"},
        {"key": "", "name": "type", "type": "ENUM", "attr": "CHANGE_ADDRESS, CHANGE_COD"},
        {"key": "", "name": "oldPayload", "type": "JSONB", "attr": "DỮ LIỆU CŨ TRƯỚC ĐỔI"},
        {"key": "", "name": "newPayload", "type": "JSONB", "attr": "DỮ LIỆU MỚI YÊU CẦU"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, APPROVED, REJECTED"},
        {"key": "", "name": "reviewNote", "type": "TEXT", "attr": "LÝ DO DUYỆT / TỪ CHỐI"},
        {"key": "", "name": "requestedBy", "type": "VARCHAR(64)", "attr": "USER YÊU CẦU THAY ĐỔI"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    inv_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "shipmentId", "type": "VARCHAR(64)", "attr": "FK -> Shipment.id"},
        {"key": "", "name": "reason", "type": "VARCHAR(64)", "attr": "LOST, DAMAGE, DELAY, SUSPECT"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "INVESTIGATING, RESOLVED, CLOSED"},
        {"key": "DIST", "name": "lastScanHubCode", "type": "VARCHAR(32)", "attr": "VẾT QUÉT CUỐI CÙNG"},
        {"key": "", "name": "disputeCountdown", "type": "TIMESTAMP", "attr": "SLA 24H GIẢI TRÌNH"},
        {"key": "DIST", "name": "responsibleCourierId", "type": "VARCHAR(64)", "attr": "BƯU TÁ TRÁCH NHIỆM"},
        {"key": "DIST", "name": "responsibleHubCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC QUẢN LÝ"},
        {"key": "", "name": "conclusionNote", "type": "TEXT", "attr": "KẾT LUẬN ĐIỀU TRA"},
        {"key": "", "name": "liabilityRatio", "type": "FLOAT", "attr": "TỶ LỆ LỖI (0.0 - 1.0)"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"},
        {"key": "", "name": "resolvedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM ĐÓNG HỒ SƠ"}
    ]
    scan_audit_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "caseId", "type": "VARCHAR(64)", "attr": "FK -> InvestigationCase.id"},
        {"key": "", "name": "scanType", "type": "VARCHAR(32)", "attr": "INBOUND, OUTBOUND, SORT"},
        {"key": "DIST", "name": "hubCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC THỰC HIỆN QUÉT"},
        {"key": "DIST", "name": "scannedBy", "type": "VARCHAR(64)", "attr": "NHÂN SỰ BẮN MÃ VẠCH"},
        {"key": "", "name": "scannedAt", "type": "TIMESTAMP", "attr": "MỐC THỜI GIAN QUÉT"}
    ]
    disp_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "caseId", "type": "VARCHAR(64)", "attr": "FK -> InvestigationCase.id"},
        {"key": "DIST", "name": "claimantId", "type": "VARCHAR(64)", "attr": "BƯU TÁ HOẶC BƯU CỤC KHIẾU NẠI"},
        {"key": "", "name": "reason", "type": "TEXT", "attr": "LÝ DO KHÔNG NHẬN TRÁCH NHIỆM"},
        {"key": "", "name": "proofImageUrls", "type": "TEXT[]", "attr": "ẢNH BẰNG CHỨNG GIẢI TRÌNH"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "SUBMITTED, ACCEPTED, REJECTED"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    claim_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "caseId", "type": "VARCHAR(64)", "attr": "UNIQUE FK -> InvestigationCase"},
        {"key": "", "name": "claimAmount", "type": "FLOAT", "attr": "TIỀN BỒI THƯỜNG YÊU CẦU"},
        {"key": "", "name": "approvedAmount", "type": "FLOAT", "attr": "TIỀN ĐƯỢC KẾ TOÁN DUYỆT"},
        {"key": "", "name": "payoutStatus", "type": "ENUM", "attr": "PENDING, PAID, REJECTED"},
        {"key": "", "name": "compensatedTo", "type": "VARCHAR(64)", "attr": "NGƯỜI THỤ HƯỞNG (SHOP)"},
        {"key": "", "name": "approvedBy", "type": "VARCHAR(64)", "attr": "QUẢN TRỊ VIÊN DUYỆT CHI"}
    ]
    ship_outbox_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType", "type": "VARCHAR(64)", "attr": "SHIPMENT.CREATED, ..."},
        {"key": "", "name": "aggregateType", "type": "VARCHAR(64)", "attr": "Shipment"},
        {"key": "", "name": "aggregateId", "type": "VARCHAR(64)", "attr": "ID ĐƠN HÀNG"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "SNAPSHOT ĐƠN HÀNG"}
    ]

    s3_t1, s3_h1 = render_table(40, 25, 480, "Shipment", "SHIPMENTS (VẬN ĐƠN BƯU CHÍNH)", ship_cols)
    s3_t2, s3_h2 = render_table(680, 25, 480, "ChangeRequest", "CHANGE_REQUESTS (ĐỔI ĐỊA CHỈ/COD)", cr_cols)
    s3_t3, s3_h3 = render_table(40, 25 + s3_h1 + 38, 480, "InvestigationCase", "INVESTIGATION_CASES (ĐIỀU TRA SỰ CỐ)", inv_cols)
    s3_t4, s3_h4 = render_table(680, 25 + s3_h2 + 38, 480, "InvestigationAuditScan", "AUDIT_SCANS (VẾT QUÉT ĐIỀU TRA)", scan_audit_cols)
    s3_t5, s3_h5 = render_table(680, 25 + s3_h2 + 38 + s3_h4 + 38, 480, "InvestigationDispute", "DISPUTES (BẰNG CHỨNG GIẢI TRÌNH)", disp_cols)
    s3_t6, s3_h6 = render_table(40, 25 + s3_h1 + 38 + s3_h3 + 38, 480, "CompensationClaim", "COMPENSATION_CLAIMS (BỒI THƯỜNG)", claim_cols)
    s3_t7, s3_h7 = render_table(680, 25 + s3_h2 + 38 + s3_h4 + 38 + s3_h5 + 38, 480, "OutboxEvent (Shipment)", "OUTBOX_EVENTS", ship_outbox_cols)

    y_inv_top = 25 + s3_h1 + 38
    y_scan_top = 25 + s3_h2 + 38
    y_disp_top = 25 + s3_h2 + 38 + s3_h4 + 38
    y_claim_top = 25 + s3_h1 + 38 + s3_h3 + 38
    s3_connectors = f'''
    <!-- Shipment (1) -> ChangeRequest (N) Direct Cross -->
    <path d="M 520 75 L 680 75" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <!-- Shipment (1) -> InvestigationCase (N) via Center Highway Lane 1 -->
    <path d="M 520 220 L 560 220 L 560 {y_inv_top + 40} L 520 {y_inv_top + 40}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <!-- InvestigationCase (1) -> InvestigationAuditScan (N) via Center Highway Lane 2 -->
    <path d="M 520 {y_inv_top + 80} L 600 {y_inv_top + 80} L 600 {y_scan_top + 40} L 680 {y_scan_top + 40}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <!-- InvestigationCase (1) -> InvestigationDispute (N) via Center Highway Lane 2 -->
    <path d="M 520 {y_inv_top + 130} L 600 {y_inv_top + 130} L 600 {y_disp_top + 40} L 680 {y_disp_top + 40}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <!-- InvestigationCase (1) -> CompensationClaim (1) via Center Highway Lane 1 -->
    <path d="M 520 {y_inv_top + 280} L 560 {y_inv_top + 280} L 560 {y_claim_top + 40} L 520 {y_claim_top + 40}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>
    '''

    s3_sections = [
        {
            "title": "VAI TRÒ & QUYỀN SỞ HỮU TRẠNG THÁI VẬN ĐƠN (CANONICAL STATUS OWNER)",
            "bullets": [
                "Chủ quyền trạng thái duy nhất: shipment-service là nơi duy nhất giữ chân lý (Single Source of Truth) cho trạng thái đơn qua 19 trạng thái máy FSM.",
                "Khóa bi quan (Pessimistic Lock): Cờ isLocked = true tự động kích hoạt khi có yêu cầu đổi địa chỉ hoặc điều tra sự cố để ngăn chặn tài xế tiếp tục phát hàng.",
                "Xử lý yêu cầu thay đổi (ChangeRequest): Cho phép Shop đổi SĐT, địa chỉ nhận hoặc tiền COD trước khi bưu kiện xuất kho giao chặng cuối."
            ]
        },
        {
            "title": "QUY TRÌNH ĐIỀU TRA ĐIỂM GÃY (BREAKPOINT ANALYSIS) & BỒI THƯỜNG",
            "bullets": [
                "Tự động mở hồ sơ điều tra: Khi đơn quá hạn SLA quét hoặc bưu tá báo mất bưu phẩm, InvestigationCase được khởi tạo tự động.",
                "Đếm ngược giải trình SLA 24h: Bưu tá/Bưu cục có 24h để tải ảnh chứng từ vào InvestigationDispute trước khi hệ thống tự động phán định trách nhiệm.",
                "Quyết toán bồi thường: CompensationClaim kết nối trực tiếp với payment-service để hoàn tiền tự động vào ví Shop."
            ]
        }
    ]

    build_standalone_svg("03-shipment-service-erd.svg", 2000, 1300,
                         "3. SHIPMENT-SERVICE (DỊCH VỤ VẬN ĐƠN, KHIẾU NẠI & ĐIỀU TRA SỰ CỐ)",
                         "3002", "shipment_db",
                         "Trọng tâm nghiệp vụ: Máy trạng thái 19 bước FSM, Điều tra thất lạc điểm gãy & Quyết toán bồi thường",
                         f"{s3_t1}\n{s3_t2}\n{s3_t3}\n{s3_t4}\n{s3_t5}\n{s3_t6}\n{s3_t7}",
                         s3_connectors,
                         "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: SHIPMENT-SERVICE",
                         "CANONICAL STATE MACHINE",
                         s3_sections,
                         "Engine: PostgreSQL 16 | Isolation: Repeatable Read | Lock: Optimistic + Pessimistic Lock | FSM: 19 Canonical States",
                         "Phát hành sự kiện SHIPMENT.CREATED, STATUS_CHANGED, IS_LOCKED tới tracking-service, dispatch-service & payment-service")

    # =========================================================================
    # 4. PICKUP-SERVICE (:3003 | pickup_db) - 100% PRISMA EXACT
    # =========================================================================
    req_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "pickupCode", "type": "VARCHAR(32)", "attr": "UNIQUE (PU-123456)"},
        {"key": "DIST", "name": "merchantId", "type": "VARCHAR(64)", "attr": "FK-dist masterdata.merchant"},
        {"key": "", "name": "pickupAddress", "type": "VARCHAR(255)", "attr": "ĐỊA CHỈ SHOP LẤY HÀNG"},
        {"key": "DIST", "name": "hubCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC PHỤ TRÁCH LẤY"},
        {"key": "DIST", "name": "assignedCourierId", "type": "VARCHAR(64)", "attr": "TÀI XẾ ĐƯỢC ĐIỀU PHỐI"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "REQUESTED, ASSIGNED, COMPLETED"},
        {"key": "", "name": "packageCount", "type": "INT", "attr": "SỐ LƯỢNG GÓI HÀNG DỰ KIẾN"},
        {"key": "", "name": "scheduledDate", "type": "DATE", "attr": "NGÀY HẸN LẤY HÀNG"},
        {"key": "", "name": "scheduledSlot", "type": "VARCHAR(32)", "attr": "CA LẤY (VD: SÁNG, CHIỀU)"},
        {"key": "", "name": "note", "type": "TEXT", "attr": "LƯU Ý CỦA CHỦ SHOP"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    pitem_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "pickupRequestId", "type": "VARCHAR(64)", "attr": "FK -> PickupRequest.id"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "MÃ VẬN ĐƠN BƯU PHẨM"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, COLLECTED, FAILED"},
        {"key": "", "name": "collectedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM QUÉT THU GOM"},
        {"key": "", "name": "failureReason", "type": "VARCHAR(128)", "attr": "LÝ DO KHÔNG LẤY ĐƯỢC"}
    ]
    p_outbox_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType", "type": "VARCHAR(64)", "attr": "PICKUP.ASSIGNED, COLLECTED"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "DỮ LIỆU ĐỢT THU GOM"}
    ]

    s4_t1, s4_h1 = render_table(40, 80, 480, "PickupRequest", "PICKUP_REQUESTS (YÊU CẦU THU GOM)", req_cols)
    s4_t2, s4_h2 = render_table(680, 80, 480, "PickupItem", "PICKUP_ITEMS (DANH MỤC ĐƠN THU)", pitem_cols)
    s4_t3, s4_h3 = render_table(680, 80 + s4_h2 + 50, 480, "OutboxEvent (Pickup)", "OUTBOX_EVENTS", p_outbox_cols)

    s4_connectors = '''
    <!-- PickupRequest (1) -> PickupItem (N) Direct Cross -->
    <path d="M 520 140 L 680 140" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    '''

    s4_sections = [
        {
            "title": "VAI TRÒ & NGHIỆP VỤ THU GOM",
            "bullets": [
                "Khởi tạo ca lấy hàng tận nơi: Tiếp nhận lệnh gom từ Portal Shop, tổng hợp danh mục bưu phẩm cần lấy theo khung giờ.",
                "Quản lý danh sách đơn con (PickupItem): Bưu tá quét mã từng bưu kiện tại kho Shop; ghi nhận bưu kiện thu thành công hoặc thất bại."
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                "assignedCourierId: Liên kết bưu tá từ auth-service và phân công qua dispatch-service.",
                "shipmentCode: Đồng bộ chuyển trạng thái đơn sang PICKED_UP trên shipment-service."
            ]
        }
    ]

    build_standalone_svg("04-pickup-service-erd.svg", 2000, 1300,
                         "4. PICKUP-SERVICE (DỊCH VỤ QUẢN LÝ THU GOM ĐƠN HÀNG TẬN NƠI)",
                         "3003", "pickup_db",
                         "Tiếp nhận yêu cầu lấy hàng, chia ca gom hàng bưu tá và xác thực mã đơn thu gom tại shop",
                         f"{s4_t1}\n{s4_t2}\n{s4_t3}",
                         s4_connectors,
                         "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: PICKUP-SERVICE",
                         "FIRST-MILE OPERATIONS",
                         s4_sections,
                         "Engine: PostgreSQL 16 | Pattern: Transactional Outbox | Message Broker: RabbitMQ (Topic Exchange)",
                         "Phát hành sự kiện PICKUP.ASSIGNED, PICKUP.COLLECTED tới dispatch-service & tracking-service")


    # =========================================================================
    # 5. DISPATCH-SERVICE (:3004 | dispatch_db) - 100% PRISMA EXACT
    # =========================================================================
    task_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "taskCode", "type": "VARCHAR(32)", "attr": "UNIQUE (TSK-123456)"},
        {"key": "", "name": "type", "type": "ENUM", "attr": "PICKUP, DELIVERY"},
        {"key": "DIST", "name": "hubCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC ĐIỀU PHỐI"},
        {"key": "DIST", "name": "zoneCode", "type": "VARCHAR(32)", "attr": "TUYẾN ĐỊA BÀN PHỤ TRÁCH"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "MÃ VẬN ĐƠN (GIAO)"},
        {"key": "DIST", "name": "pickupRequestId", "type": "VARCHAR(64)", "attr": "MÃ LỆNH LẤY (GOM)"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, ASSIGNED, COMPLETED"},
        {"key": "", "name": "priority", "type": "INT", "attr": "MỨC ƯU TIÊN (1-5)"},
        {"key": "", "name": "deadline", "type": "TIMESTAMP", "attr": "HẠN CHÓT HOÀN THÀNH"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    assign_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "taskId", "type": "VARCHAR(64)", "attr": "FK -> Task.id"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "TÀI XẾ ĐƯỢC CHỈ ĐỊNH"},
        {"key": "", "name": "assignedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM GÁN VIỆC"},
        {"key": "", "name": "acceptedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM TÀI XẾ NHẬN"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "OFFERED, ACCEPTED, REJECTED"},
        {"key": "", "name": "rejectionReason", "type": "VARCHAR(128)", "attr": "LÝ DO TỪ CHỐI TÁC VỤ"}
    ]
    ops_audit_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "taskId", "type": "VARCHAR(64)", "attr": "FK -> Task.id"},
        {"key": "", "name": "actorId", "type": "VARCHAR(64)", "attr": "ĐIỀU PHỐI VIÊN THAO TÁC"},
        {"key": "", "name": "action", "type": "VARCHAR(64)", "attr": "REASSIGN, CANCEL, ESCALATE"},
        {"key": "", "name": "reason", "type": "TEXT", "attr": "LÝ DO CAN THIỆP ĐIỀU HÀNH"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    disp_outbox_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType", "type": "VARCHAR(64)", "attr": "TASK.ASSIGNED, REASSIGNED"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "DỮ LIỆU ĐIỀU PHỐI"}
    ]

    s5_t1, s5_h1 = render_table(40, 60, 480, "Task", "TASKS (NHIỆM VỤ ĐIỀU PHỐI)", task_cols)
    s5_t2, s5_h2 = render_table(680, 60, 480, "TaskAssignment", "TASK_ASSIGNMENTS (PHÂN CÔNG TÀI XẾ)", assign_cols)
    s5_t3, s5_h3 = render_table(40, 60 + s5_h1 + 50, 480, "OpsAuditLog", "OPS_AUDIT_LOGS (NHẬT KÝ ĐIỀU PHỐI)", ops_audit_cols)
    s5_t4, s5_h4 = render_table(680, 60 + s5_h2 + 50, 480, "OutboxEvent (Dispatch)", "OUTBOX_EVENTS", disp_outbox_cols)

    s5_connectors = f'''
    <!-- Task (1) -> TaskAssignment (N) Direct Cross -->
    <path d="M 520 120 L 680 120" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <!-- Task (1) -> OpsAuditLog (N) via Center Highway Lane 1 -->
    <path d="M 520 250 L 560 250 L 560 {60 + s5_h1 + 50 + 50} L 520 {60 + s5_h1 + 50 + 50}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    '''

    s5_sections = [
        {
            "title": "TRỌNG TÂM ĐIỀU PHỐI & PHÂN BỔ NHIỆM VỤ",
            "bullets": [
                "Khởi tạo tác vụ tự động: Tự động gom đơn theo tuyến bưu tá dựa trên địa chỉ phường/xã và ranh giới polygon từ masterdata-service.",
                "Cân bằng tải tài xế: Thuật toán phân bổ công việc theo số lượng đơn hiện tại và lịch sử chấp nhận cuốc của từng bưu tá.",
                "Nhật ký can thiệp Ops: Ghi nhận vết điều phối thủ công khi trưởng bưu cục gán lại việc khẩn cấp (Reassign)."
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                "courierId: Ánh xạ chuẩn xác tới tài khoản auth-service và phân tuyến masterdata-service.",
                "shipmentCode / pickupRequestId: Đồng bộ trạng thái thực thi tác vụ sang shipment-service & pickup-service."
            ]
        }
    ]

    build_standalone_svg("05-dispatch-service-erd.svg", 2000, 1300,
                         "5. DISPATCH-SERVICE (DỊCH VỤ ĐIỀU PHỐI & PHÂN CÔNG TÁC VỤ)",
                         "3004", "dispatch_db",
                         "Khởi tạo tác vụ gom/giao, tự động gán tài xế theo khu vực phụ trách & nhật ký can thiệp điều phối",
                         f"{s5_t1}\n{s5_t2}\n{s5_t3}\n{s5_t4}",
                         s5_connectors,
                         "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: DISPATCH-SERVICE",
                         "DISPATCH ENGINE",
                         s5_sections,
                         "Engine: PostgreSQL 16 | Assignment: Automated Polygon Matching | SLA: Real-time Dispatch",
                         "Phát hành sự kiện TASK.ASSIGNED, TASK.ACCEPTED qua RabbitMQ tới mobile-push & tracking-service")

    # =========================================================================
    # 6. MANIFEST-SERVICE (:3005 | manifest_db) - 100% PRISMA EXACT
    # =========================================================================
    man_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "manifestCode", "type": "VARCHAR(32)", "attr": "UNIQUE (MNF-123456)"},
        {"key": "DIST", "name": "originHubCode", "type": "VARCHAR(32)", "attr": "KHO ĐÓNG BAO/TẢI HÀNG"},
        {"key": "DIST", "name": "destinationHubCode", "type": "VARCHAR(32)", "attr": "KHO TIẾP NHẬN ĐÍCH"},
        {"key": "", "name": "type", "type": "ENUM", "attr": "OUTBOUND, INBOUND, INTER_HUB"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "CREATED, SEALED, DISPATCHED"},
        {"key": "", "name": "totalShipments", "type": "INT", "attr": "TỔNG SỐ BƯU KIỆN TRONG BAO"},
        {"key": "", "name": "totalWeightKg", "type": "FLOAT", "attr": "TỔNG TRỌNG LƯỢNG BAO TẢI"},
        {"key": "", "name": "vehiclePlate", "type": "VARCHAR(32)", "attr": "BIỂN SỐ XE TẢI TRUNG CHUYỂN"},
        {"key": "DIST", "name": "driverId", "type": "VARCHAR(64)", "attr": "TÀI XẾ XE TRUNG CHUYỂN"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    mitem_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "manifestId", "type": "VARCHAR(64)", "attr": "FK -> Manifest.id"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "MÃ ĐƠN TRONG BẢNG KÊ"},
        {"key": "", "name": "scannedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM BẮN MÃ VÀO BAO"},
        {"key": "DIST", "name": "scannedBy", "type": "VARCHAR(64)", "attr": "NHÂN VIÊN ĐÓNG BAO"}
    ]
    seal_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "manifestId", "type": "VARCHAR(64)", "attr": "FK -> Manifest.id"},
        {"key": "", "name": "sealCode", "type": "VARCHAR(64)", "attr": "MÃ CHÌ NIÊM PHONG VẬT LÝ"},
        {"key": "", "name": "sealImageUrl", "type": "VARCHAR(255)", "attr": "ẢNH CHỤP KẸP CHÌ TRƯỚC XUẤT"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "INTACT, BROKEN, INSPECTED"},
        {"key": "DIST", "name": "sealedBy", "type": "VARCHAR(64)", "attr": "THỦ KHO KẸP CHÌ"},
        {"key": "", "name": "sealedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM NIÊM PHONG"}
    ]
    rec_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "manifestId", "type": "VARCHAR(64)", "attr": "FK -> Manifest.id"},
        {"key": "DIST", "name": "receivingHubCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC ĐÍCH TIẾP NHẬN"},
        {"key": "DIST", "name": "receivedBy", "type": "VARCHAR(64)", "attr": "THỦ KHO NHẬN BÀN GIAO"},
        {"key": "", "name": "receivedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM CẮT CHÌ MỞ BAO"},
        {"key": "", "name": "isSealIntact", "type": "BOOLEAN", "attr": "XÁC NHẬN CHÌ CÒN NGUYÊN VẸN"},
        {"key": "", "name": "discrepancyCount", "type": "INT", "attr": "SỐ LƯỢNG ĐƠN LỆCH THỰC TẾ"},
        {"key": "", "name": "note", "type": "TEXT", "attr": "BIÊN BẢN BẤT THƯỜNG"}
    ]
    man_outbox_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType", "type": "VARCHAR(64)", "attr": "MANIFEST.SEALED, RECEIVED"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "DỮ LIỆU TẢI HÀNG"}
    ]

    s6_t1, s6_h1 = render_table(40, 40, 480, "Manifest", "MANIFESTS (BẢNG KÊ NIÊM PHONG)", man_cols)
    s6_t2, s6_h2 = render_table(680, 40, 480, "ManifestItem", "MANIFEST_ITEMS (BƯU KIỆN TRONG BAO)", mitem_cols)
    s6_t3, s6_h3 = render_table(40, 40 + s6_h1 + 45, 480, "SealRecord", "SEAL_RECORDS (KẸP CHÌ NIÊM PHONG)", seal_cols)
    s6_t4, s6_h4 = render_table(680, 40 + s6_h2 + 45, 480, "ReceiveRecord", "RECEIVE_RECORDS (BÀN GIAO ĐÍCH)", rec_cols)
    s6_t5, s6_h5 = render_table(680, 40 + s6_h2 + 45 + s6_h4 + 45, 480, "OutboxEvent (Manifest)", "OUTBOX_EVENTS", man_outbox_cols)

    y_rec = 40 + s6_h2 + 45 + 50
    s6_connectors = f'''
    <!-- Manifest (1) -> ManifestItem (N) Direct Cross -->
    <path d="M 520 110 L 680 110" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <!-- Manifest (1) -> SealRecord (N) via Center Highway Lane 1 -->
    <path d="M 520 220 L 560 220 L 560 {40 + s6_h1 + 45 + 50} L 520 {40 + s6_h1 + 45 + 50}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <!-- ManifestItem (1) -> ReceiveRecord (N) via Center Highway Lane 3 -->
    <path d="M 680 140 L 640 140 L 640 {y_rec} L 680 {y_rec}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    '''

    s6_sections = [
        {
            "title": "NGHIỆP VỤ ĐÓNG BAO & NIÊM PHONG TRUNG CHUYỂN",
            "bullets": [
                "Gom tải trung chuyển đường trục: Đóng hàng trăm đơn hàng lẻ vào một bảng kê lớn (Manifest), gắn với biển số xe tải và tài xế liên tỉnh.",
                "Kiểm soát chì niêm phong (SealRecord): Bắt buộc chụp ảnh và ghi nhận số kẹp chì vật lý trước khi cho xe lăn bánh rời kho xuất.",
                "Biên bản bàn giao đích (ReceiveRecord): Kho đích đối soát số seal, cắt chì và tự động phát hiện số bưu kiện thừa/thiếu (Discrepancy Check)."
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                "originHubCode / destinationHubCode: Điều phối luồng xe tải trung chuyển giữa các bưu cục trên mạng lưới.",
                "shipmentCode: Tự động cập nhật trạng thái IN_TRANSIT hàng loạt cho toàn bộ bưu kiện trong bao."
            ]
        }
    ]

    build_standalone_svg("06-manifest-service-erd.svg", 2000, 1300,
                         "6. MANIFEST-SERVICE (DỊCH VỤ BẢNG KÊ & NIÊM PHONG TRUNG CHUYỂN)",
                         "3005", "manifest_db",
                         "Gom bưu kiện vào bảng kê tải hàng, kiểm soát mã kẹp chì xe tải đường trục & bàn giao bưu cục đích",
                         f"{s6_t1}\n{s6_t2}\n{s6_t3}\n{s6_t4}\n{s6_t5}",
                         s6_connectors,
                         "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: MANIFEST-SERVICE",
                         "LINE-HAUL LOGISTICS",
                         s6_sections,
                         "Engine: PostgreSQL 16 | Integrity: Digital Seal Verification | Aggregation: High-throughput Batching",
                         "Phát hành sự kiện MANIFEST.SEALED, MANIFEST.RECEIVED tới scan-service & tracking-service")

    # =========================================================================
    # 7. SCAN-SERVICE (:3006 | scan_db) - 100% PRISMA EXACT
    # =========================================================================
    scan_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "INDEX (NX-123456)"},
        {"key": "DIST", "name": "manifestCode", "type": "VARCHAR(32)", "attr": "NULLABLE MÃ BAO TẢI"},
        {"key": "", "name": "scanType", "type": "ENUM", "attr": "INBOUND, OUTBOUND, HUB_SORT"},
        {"key": "DIST", "name": "hubCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC GHI NHẬN QUÉT"},
        {"key": "DIST", "name": "scannedBy", "type": "VARCHAR(64)", "attr": "NHÂN SỰ BẮN MÃ VẠCH"},
        {"key": "", "name": "scannedAt", "type": "TIMESTAMP", "attr": "MỐC THỜI GIAN CHÍNH XÁC"},
        {"key": "", "name": "deviceInfo", "type": "VARCHAR(128)", "attr": "THIẾT BỊ QUÉT PDA/MOBILE"},
        {"key": "", "name": "locationLat / Lng", "type": "FLOAT", "attr": "TỌA ĐỘ GPS KHI BẮN MÃ"}
    ]
    loc_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "UNIQUE MÃ ĐƠN HÀNG"},
        {"key": "DIST", "name": "currentHubCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC ĐANG GIỮ HÀNG"},
        {"key": "DIST", "name": "currentCourierId", "type": "VARCHAR(64)", "attr": "BƯU TÁ ĐANG CẦM ĐƠN"},
        {"key": "", "name": "status", "type": "VARCHAR(32)", "attr": "VỊ TRÍ THỰC THỜI GIAN THỰC"},
        {"key": "", "name": "updatedAt", "type": "TIMESTAMP", "attr": "LẦN CẬP NHẬT GẦN NHẤT"}
    ]
    ccl_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "UNIQUE MÃ TÀI XẾ"},
        {"key": "", "name": "latitude", "type": "FLOAT", "attr": "VĨ ĐỘ GPS HIỆN TẠI"},
        {"key": "", "name": "longitude", "type": "FLOAT", "attr": "KINH ĐỘ GPS HIỆN TẠI"},
        {"key": "", "name": "batteryPct", "type": "INT", "attr": "DUNG LƯỢNG PIN THIẾT BỊ"},
        {"key": "DIST", "name": "currentTaskId", "type": "VARCHAR(64)", "attr": "TÁC VỤ ĐANG THỰC HIỆN"},
        {"key": "", "name": "updatedAt", "type": "TIMESTAMP", "attr": "MỐC BẮN TỌA ĐỘ CUỐI"}
    ]
    clh_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "INDEX MÃ TÀI XẾ"},
        {"key": "", "name": "latitude", "type": "FLOAT", "attr": "VĨ ĐỘ LỊCH SỬ HÀNH TRÌNH"},
        {"key": "", "name": "longitude", "type": "FLOAT", "attr": "KINH ĐỘ LỊCH SỬ HÀNH TRÌNH"},
        {"key": "", "name": "recordedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM GHI NHẬN GPS"},
        {"key": "", "name": "speedKmh", "type": "FLOAT", "attr": "TỐC ĐỘ DI CHUYỂN (KM/H)"}
    ]
    scan_idemp_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "idempotencyKey", "type": "VARCHAR(128)", "attr": "UNIQUE CHỐNG TRÙNG VẾT"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    scan_outbox_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType", "type": "VARCHAR(64)", "attr": "SCAN.INBOUND, OUTBOUND"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "SNAPSHOT VẾT QUÉT"}
    ]

    s7_t1, s7_h1 = render_table(40, 30, 480, "ScanEvent", "SCAN_EVENTS (VẾT QUÉT BƯU KIỆN)", scan_cols)
    s7_t2, s7_h2 = render_table(680, 30, 480, "CurrentLocation", "CURRENT_LOCATIONS (VỊ TRÍ HIỆN TẠI)", loc_cols)
    s7_t3, s7_h3 = render_table(40, 30 + s7_h1 + 40, 480, "CourierCurrentLocation", "COURIER_CURRENT_LOCATIONS (GPS)", ccl_cols)
    s7_t4, s7_h4 = render_table(680, 30 + s7_h2 + 40, 480, "CourierLocationHistory", "COURIER_LOCATION_HISTORIES", clh_cols)
    s7_t5, s7_h5 = render_table(40, 30 + s7_h1 + 40 + s7_h3 + 40, 480, "IdempotencyRecord (Scan)", "IDEMPOTENCY_RECORDS", scan_idemp_cols)
    s7_t6, s7_h6 = render_table(680, 30 + s7_h2 + 40 + s7_h4 + 40, 480, "OutboxEvent (Scan)", "OUTBOX_EVENTS", scan_outbox_cols)

    y_ccl = 30 + s7_h1 + 40 + 50
    y_clh = 30 + s7_h2 + 40 + 50
    s7_connectors = f'''
    <!-- ScanEvent (N) -> CurrentLocation (1) Direct Cross -->
    <path d="M 520 100 L 680 100" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-many)" marker-end="url(#crow-one)"/>
    <!-- CourierCurrentLocation (1) -> CourierLocationHistory (N) via Center Highway Lane 2 -->
    <path d="M 520 {y_ccl} L 600 {y_ccl} L 600 {y_clh} L 680 {y_clh}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    '''

    s7_sections = [
        {
            "title": "GHI LOG BẤT BIẾN & HIỆU NĂNG CAO",
            "bullets": [
                "Bản ghi vết quét chỉ ghi (Append-Only): ScanEvent lưu lại mọi thao tác quét mã vạch vật lý tại cửa kho và bưu cục trung chuyển.",
                "Cập nhật vị trí tức thời (CurrentLocation): Upsert vị trí mới nhất của bưu kiện để phục vụ API tra cứu đơn hàng tốc độ cao.",
                "Giám sát hành trình GPS bưu tá: CourierCurrentLocation lưu tọa độ bưu tá thời gian thực (Heartbeat 30s) và ghi lịch sử vào CourierLocationHistory."
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                "shipmentCode: Cung cấp chuỗi vết quét làm bằng chứng điều tra cho shipment-service.",
                "courierId: Phục vụ giám sát lộ trình di chuyển bưu tá cho dispatch-service."
            ]
        }
    ]

    build_standalone_svg("07-scan-service-erd.svg", 2000, 1300,
                         "7. SCAN-SERVICE (DỊCH VỤ QUÉT MÃ BƯU KIỆN & GIÁM SÁT TỌA ĐỘ GPS)",
                         "3006", "scan_db",
                         "Ghi nhận vết quét mã vạch tốc độ cao, cập nhật vị trí tức thời & theo dõi dòng tọa độ GPS bưu tá",
                         f"{s7_t1}\n{s7_t2}\n{s7_t3}\n{s7_t4}\n{s7_t5}\n{s7_t6}",
                         s7_connectors,
                         "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: SCAN-SERVICE",
                         "HIGH-FREQUENCY EVENT LOG",
                         s7_sections,
                         "Engine: PostgreSQL 16 | Write Load: 15,000 scans/sec | Stream: Append-Only Immutable Log",
                         "Phát hành sự kiện SCAN.INBOUND, SCAN.OUTBOUND tới tracking-service & reporting-service")

    # =========================================================================
    # 8. DELIVERY-SERVICE (:3007 | delivery_db) - 100% PRISMA EXACT
    # =========================================================================
    del_att_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "INDEX (NX-123456)"},
        {"key": "DIST", "name": "taskId", "type": "VARCHAR(64)", "attr": "FK-dist dispatch.tasks"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "TÀI XẾ THỰC HIỆN GIAO"},
        {"key": "DIST", "name": "locationCode", "type": "VARCHAR(32)", "attr": "MÃ BƯU CỤC PHÁT"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "DELIVERED, FAILED, RETRY"},
        {"key": "", "name": "failReasonCode", "type": "VARCHAR(32)", "attr": "NULLABLE LÝ DO LỖI GIAO"},
        {"key": "", "name": "note", "type": "TEXT", "attr": "GHI CHÚ NGƯỜI GIAO HÀNG"},
        {"key": "", "name": "occurredAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM GIAO THỰC TẾ"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    pod_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "deliveryAttemptId", "type": "VARCHAR(64)", "attr": "UNIQUE FK -> DeliveryAttempt"},
        {"key": "", "name": "imageUrl", "type": "VARCHAR(255)", "attr": "ẢNH CHỤP GIAO HÀNG (S3)"},
        {"key": "", "name": "note", "type": "TEXT", "attr": "GHI CHÚ NGƯỜI NHẬN"},
        {"key": "DIST", "name": "capturedBy", "type": "VARCHAR(64)", "attr": "TÀI XẾ TẢI ẢNH LÊN"},
        {"key": "", "name": "capturedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM CHỤP ẢNH"}
    ]
    otp_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "INDEX (NX-123456)"},
        {"key": "", "name": "otpCode", "type": "VARCHAR(8)", "attr": "MÃ OTP XÁC THỰC 6 SỐ"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, VERIFIED, EXPIRED"},
        {"key": "", "name": "sentAt", "type": "TIMESTAMP", "attr": "THỜI GIAN GỬI SMS"}
    ]
    ndr_case_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "INDEX (NX-123456)"},
        {"key": "FK", "name": "deliveryAttemptId", "type": "VARCHAR(64)", "attr": "FK -> DeliveryAttempt.id"},
        {"key": "DIST", "name": "reasonCode", "type": "VARCHAR(32)", "attr": "MÃ LÝ DO MASTERDATA"},
        {"key": "", "name": "issueCategory", "type": "VARCHAR", "attr": "PHÂN LOẠI SỰ CỐ"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, RESOLVED, RETURN"},
        {"key": "", "name": "rescheduleAt", "type": "TIMESTAMP", "attr": "LỊCH HẸN GIAO LẠI"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    return_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "INDEX (NX-123456)"},
        {"key": "FK", "name": "ndrCaseId", "type": "VARCHAR(64)", "attr": "NULLABLE -> NdrCase.id"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "INITIATED, IN_TRANSIT, RETURNED"},
        {"key": "", "name": "note", "type": "TEXT", "attr": "LÝ DO CHUYỂN HOÀN KHO SHOP"},
        {"key": "", "name": "startedAt", "type": "TIMESTAMP", "attr": "BẮT ĐẦU QUY TRÌNH HOÀN"}
    ]
    del_outbox_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType", "type": "VARCHAR(64)", "attr": "DELIVERY.DELIVERED, FAILED"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "KẾT QUẢ GIAO HÀNG"}
    ]

    s8_t1, s8_h1 = render_table(40, 40, 480, "DeliveryAttempt", "DELIVERY_ATTEMPTS (LẦN PHÁT HÀNG)", del_att_cols)
    s8_t2, s8_h2 = render_table(680, 40, 480, "Pod", "PODS (BẰNG CHỨNG ẢNH GIAO HÀNG)", pod_cols)
    s8_t3, s8_h3 = render_table(680, 40 + s8_h2 + 45, 480, "OtpRecord", "OTP_RECORDS (MÃ XÁC THỰC NGƯỜI NHẬN)", otp_cols)
    s8_t4, s8_h4 = render_table(40, 40 + s8_h1 + 45, 480, "NdrCase", "NDR_CASES (BIÊN BẢN GIAO THẤT BẠI)", ndr_case_cols)
    s8_t5, s8_h5 = render_table(680, 40 + s8_h2 + 45 + s8_h3 + 45, 480, "ReturnCase", "RETURN_CASES (QUY TRÌNH CHUYỂN HOÀN)", return_cols)
    s8_t6, s8_h6 = render_table(40, 40 + s8_h1 + 45 + s8_h4 + 45, 480, "OutboxEvent (Delivery)", "OUTBOX_EVENTS", del_outbox_cols)

    y_ndr = 40 + s8_h1 + 45
    y_ret = 40 + s8_h2 + 45 + s8_h3 + 45
    s8_connectors = f'''
    <!-- DeliveryAttempt (1) -> Pod (1) Direct Cross -->
    <path d="M 520 95 L 680 95" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>
    <!-- DeliveryAttempt (1) -> NdrCase (1) via Center Highway Lane 1 -->
    <path d="M 520 200 L 560 200 L 560 {y_ndr + 40} L 520 {y_ndr + 40}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>
    <!-- NdrCase (1) -> ReturnCase (1) via Center Highway Lane 2 -->
    <path d="M 520 {y_ndr + 80} L 600 {y_ndr + 80} L 600 {y_ret + 40} L 680 {y_ret + 40}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>
    '''

    s8_sections = [
        {
            "title": "BẰNG CHỨNG PHÁT HÀNG CHẶNG CUỐI (LAST-MILE POD)",
            "bullets": [
                "Bảo mật giao hàng 2 yếu tố: Kết hợp ảnh chụp thực tế vị trí giao hàng (Pod.imageUrl) và mã xác nhận OTP SMS người nhận (OtpRecord.otpCode).",
                "Quan hệ 1:1 nghiêm ngặt: Mỗi DeliveryAttempt thành công chỉ gắn duy nhất với một Pod, ngăn chặn tải ảnh giả mạo nhiều lần."
            ]
        },
        {
            "title": "XỬ LÝ GIAO KHÔNG THÀNH CÔNG (NDR) & CHUYỂN HOÀN",
            "bullets": [
                "Lập biên bản sự cố (NdrCase): Tự động kích hoạt khi giao thất bại (khách không nghe máy, sai địa chỉ), hỗ trợ hẹn lịch giao lại (rescheduleAt).",
                "Chuyển hoàn bưu phẩm (ReturnCase): Sau 3 lần giao thất bại hoặc khách từ chối nhận, kích hoạt quy trình chuyển hoàn ngược về kho Shop."
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                "shipmentCode: Đồng bộ trạng thái đơn sang DELIVERED hoặc DELIVERY_FAILED trên shipment-service.",
                "Kích hoạt thu tiền: Sự kiện DELIVERY.DELIVERED báo hiệu payment-service bắt đầu giai đoạn thu tiền và nộp tiền ca COD."
            ]
        }
    ]

    build_standalone_svg("08-delivery-service-erd.svg", 2000, 1300,
                         "8. DELIVERY-SERVICE (DỊCH VỤ PHÁT HÀNG, BẰNG CHỨNG POD & XỬ LÝ SỰ CỐ NDR)",
                         "3007", "delivery_db",
                         "Ghi nhận kết quả giao hàng, xác thực mã OTP, lưu bằng chứng ảnh POD và điều phối chuyển hoàn",
                         f"{s8_t1}\n{s8_t2}\n{s8_t3}\n{s8_t4}\n{s8_t5}\n{s8_t6}",
                         s8_connectors,
                         "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: DELIVERY-SERVICE",
                         "LAST-MILE EVIDENCE",
                         s8_sections,
                         "Engine: PostgreSQL 16 | Evidence: Image POD + OTP Verification | NDR Lifecycle: 3-Attempt Rule",
                         "Phát hành sự kiện DELIVERY.DELIVERED, DELIVERY.FAILED, RETURN.INITIATED qua RabbitMQ")


    # =========================================================================
    # 9. PAYMENT-SERVICE (:3011 | payment_db) - 100% PRISMA EXACT
    # =========================================================================
    cod_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "UNIQUE (NX-123456)"},
        {"key": "DIST", "name": "merchantId", "type": "VARCHAR(64)", "attr": "CHỦ SHOP HƯỞNG COD"},
        {"key": "", "name": "codAmount", "type": "FLOAT", "attr": "TIỀN CẦN THU (VND)"},
        {"key": "", "name": "currency", "type": "VARCHAR(8)", "attr": "DEFAULT 'VND'"},
        {"key": "", "name": "paymentMethod", "type": "ENUM", "attr": "COD, BANK, VIETQR"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "PENDING, COLLECTED"},
        {"key": "DIST", "name": "hubCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC THU TIỀN"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "TÀI XẾ THU TIỀN"},
        {"key": "", "name": "collectedAmount", "type": "FLOAT", "attr": "TIỀN THỰC THU"},
        {"key": "", "name": "collectedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM THU"},
        {"key": "", "name": "remittedAmount", "type": "FLOAT", "attr": "TIỀN NỘP BƯU CỤC"},
        {"key": "", "name": "remittedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM NỘP"},
        {"key": "", "name": "remittedBy", "type": "VARCHAR(64)", "attr": "TÀI XẾ NỘP TIỀN"},
        {"key": "", "name": "note", "type": "TEXT", "attr": "GHI CHÚ ĐỐI SOÁT"}
    ]
    batch_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "settlementCode", "type": "VARCHAR(32)", "attr": "UNIQUE (STL-123456)"},
        {"key": "", "name": "reportDate", "type": "TIMESTAMP", "attr": "NGÀY NỘP BÁO CÁO"},
        {"key": "DIST", "name": "hubCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC NỘP TIỀN"},
        {"key": "DIST", "name": "courierId", "type": "VARCHAR(64)", "attr": "TÀI XẾ NỘP TIỀN"},
        {"key": "", "name": "totalAmount", "type": "FLOAT", "attr": "TỔNG TIỀN NỘP CA"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "WAITING, PAID, CONFIRMED"},
        {"key": "", "name": "qrUrl", "type": "VARCHAR(255)", "attr": "MÃ VIETQR ĐỘNG"},
        {"key": "", "name": "transferMemo", "type": "VARCHAR(64)", "attr": "CÚ PHÁP DUY NHẤT"},
        {"key": "", "name": "confirmedBy", "type": "VARCHAR(64)", "attr": "KẾ TOÁN BƯU CỤC"},
        {"key": "", "name": "confirmedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM DUYỆT"}
    ]
    item_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "batchId", "type": "VARCHAR(64)", "attr": "FK -> Batch.id"},
        {"key": "DIST", "name": "codRecordId", "type": "VARCHAR(64)", "attr": "FK-dist CodRecord.id"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "MÃ VẬN ĐƠN CA"},
        {"key": "", "name": "amount", "type": "FLOAT", "attr": "SỐ TIỀN KHỚP ĐƠN"}
    ]
    event_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "provider", "type": "VARCHAR(32)", "attr": "VIETQR / PAYOS"},
        {"key": "", "name": "providerEventId", "type": "VARCHAR(128)", "attr": "MÃ GD NGÂN HÀNG"},
        {"key": "DIST", "name": "settlementBatchId", "type": "VARCHAR(64)", "attr": "ÁNH XẠ ĐỢT NỘP CA"},
        {"key": "", "name": "amount", "type": "FLOAT", "attr": "SỐ TIỀN GD"},
        {"key": "", "name": "accountNumber", "type": "VARCHAR(32)", "attr": "SỐ TÀI KHOẢN NHẬN"},
        {"key": "", "name": "referenceCode", "type": "VARCHAR(64)", "attr": "MÃ THAM CHIẾU GD"},
        {"key": "", "name": "processingStatus", "type": "VARCHAR(32)", "attr": "SUCCESS, PROCESSED"},
        {"key": "", "name": "rawPayload", "type": "JSONB", "attr": "WEBHOOK GỐC NGÂN HÀNG"}
    ]
    pay_idemp_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "idempotencyKey", "type": "VARCHAR(128)", "attr": "UNIQUE CHỐNG TRÙNG"},
        {"key": "", "name": "scope", "type": "VARCHAR(64)", "attr": "SETTLEMENT_WEBHOOK"},
        {"key": "", "name": "responsePayload", "type": "JSONB", "attr": "KẾT QUẢ CACHED"}
    ]
    pay_outbox_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "eventId", "type": "VARCHAR(64)", "attr": "UNIQUE"},
        {"key": "", "name": "eventType", "type": "VARCHAR(64)", "attr": "PAYMENT.COD_SETTLED"},
        {"key": "", "name": "routingKey", "type": "VARCHAR(64)", "attr": "payment.settled"},
        {"key": "", "name": "payload", "type": "JSONB", "attr": "QUYẾT TOÁN TÀI CHÍNH"}
    ]

    s9_t1, s9_h1 = render_table(40, 30, 480, "CodRecord", "COD_RECORDS (THEO DÕI THU HỘ TIỀN)", cod_cols)
    s9_t2, s9_h2 = render_table(680, 30, 480, "CodSettlementBatch", "COD_BATCHES (PHIÊN NỘP TIỀN CA)", batch_cols)
    s9_t3, s9_h3 = render_table(680, 30 + s9_h2 + 45, 480, "CodSettlementItem", "COD_ITEMS (DANH SÁCH ĐƠN PHIÊN)", item_cols)
    s9_t4, s9_h4 = render_table(40, 30 + s9_h1 + 45, 480, "CodSettlementPaymentEvent", "PAYMENT_EVENTS (WEBHOOK NGÂN HÀNG)", event_cols)
    s9_t5, s9_h5 = render_table(40, 30 + s9_h1 + 45 + s9_h4 + 45, 480, "IdempotencyRecord (Pay)", "IDEMPOTENCY_RECORDS", pay_idemp_cols)
    s9_t6, s9_h6 = render_table(680, 30 + s9_h2 + 45 + s9_h3 + 45, 480, "OutboxEvent (Payment)", "OUTBOX_EVENTS", pay_outbox_cols)

    y_item = 30 + s9_h2 + 45 + 50
    y_event = 30 + s9_h1 + 45 + 50
    s9_connectors = f'''
    <!-- CodRecord (1) -> CodSettlementItem (N) via Center Highway Lane 2 -->
    <path d="M 520 80 L 600 80 L 600 {y_item} L 680 {y_item}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <!-- CodSettlementBatch (1) -> CodSettlementItem (N) via Center Highway Lane 3 -->
    <path d="M 680 140 L 640 140 L 640 {y_item + 30} L 680 {y_item + 30}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <!-- CodSettlementPaymentEvent (N) -> CodSettlementBatch (1) via Center Highway Lane 2 -->
    <path d="M 520 {y_event} L 600 {y_event} L 600 200 L 680 200" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-many)" marker-end="url(#crow-one)"/>
    '''

    s9_sections = [
        {
            "title": "QUẢN TRỊ DÒNG TIỀN COD & NỘP TIỀN CA PHÁT",
            "bullets": [
                "Ghi nhận công nợ đơn hàng: CodRecord theo dõi chính xác từng đồng tiền mặt COD cần thu, số tiền thực tế tài xế nhận và thời điểm nộp.",
                "Phiên nộp tiền ca (CodSettlementBatch): Hết ca phát, bưu tá tổng hợp toàn bộ tiền mặt thu được vào một phiên nộp duy nhất.",
                "Tích hợp VietQR động: Tự động sinh mã VietQR chuẩn NAPAS với transferMemo định danh duy nhất (VD: STL123456) giúp tài xế quét chuyển khoản ngay trên app."
            ]
        },
        {
            "title": "TỰ ĐỘNG GẠCH NỢ QUA WEBHOOK (AUTOMATED RECONCILIATION)",
            "bullets": [
                "Nhận biến động số dư qua Webhook PayOS/VietQR lưu vào CodSettlementPaymentEvent.",
                "Cơ chế Idempotency: Kiểm tra khóa trùng giao dịch (providerEventId), gạch nợ tức thời phiên nộp tiền và tự động cộng số dư ví cho Shop."
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                "shipmentCode: Ánh xạ chuẩn xác tới đơn hàng trên shipment-service.",
                "courierId / hubCode: Đối soát công nợ bưu tá với thủ quỹ bưu cục."
            ]
        }
    ]

    build_standalone_svg("09-payment-service-erd.svg", 2000, 1300,
                         "9. PAYMENT-SERVICE (DỊCH VỤ QUẢN LÝ DÒNG TIỀN COD & ĐỐI SOÁT TỰ ĐỘNG)",
                         "3011", "payment_db",
                         "Theo dõi tiền thu hộ COD, quyết toán phiên nộp tiền bưu tá, tích hợp VietQR động & gạch nợ tự động",
                         f"{s9_t1}\n{s9_t2}\n{s9_t3}\n{s9_t4}\n{s9_t5}\n{s9_t6}",
                         s9_connectors,
                         "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: PAYMENT-SERVICE",
                         "FINANCIAL RECONCILIATION",
                         s9_sections,
                         "Engine: PostgreSQL 16 | Gateway: VietQR / PayOS Webhook | Reconciliation: Automated Dynamic QR Matching",
                         "Phát hành sự kiện PAYMENT.COD_SETTLED, WALLET_CREDITED qua RabbitMQ tới reporting-service")

    # =========================================================================
    # 10. TRACKING-SERVICE (:3008 | tracking_db) - 100% PRISMA EXACT
    # =========================================================================
    time_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "INDEX (NX-123456)"},
        {"key": "", "name": "statusCode", "type": "VARCHAR(32)", "attr": "MÃ TRẠNG THÁI HIỂN THỊ"},
        {"key": "", "name": "statusTitle", "type": "VARCHAR(128)", "attr": "TIÊU ĐỀ TRẠNG THÁI TIẾNG VIỆT"},
        {"key": "", "name": "description", "type": "VARCHAR(255)", "attr": "CHI TIẾT DIỄN BIẾN ĐƠN"},
        {"key": "DIST", "name": "locationCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC PHÁT SINH SỰ KIỆN"},
        {"key": "DIST", "name": "actor", "type": "VARCHAR(64)", "attr": "NHÂN SỰ HOẶC TIẾN TRÌNH HỆ THỐNG"},
        {"key": "", "name": "eventTime", "type": "TIMESTAMP", "attr": "MỐC THỜI GIAN HIỂN THỊ APP"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    cur_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "UNIQUE (NX-123456)"},
        {"key": "", "name": "lastStatusCode", "type": "VARCHAR(32)", "attr": "TRẠNG THÁI CUỐI CÙNG"},
        {"key": "DIST", "name": "lastLocationCode", "type": "VARCHAR(32)", "attr": "VỊ TRÍ BƯU CỤC MỚI NHẤT"},
        {"key": "", "name": "lastEventTime", "type": "TIMESTAMP", "attr": "MỐC SỰ KIỆN GẦN NHẤT"},
        {"key": "", "name": "isDelivered", "type": "BOOLEAN", "attr": "CỜ ĐÃ PHÁT THÀNH CÔNG"},
        {"key": "", "name": "isReturned", "type": "BOOLEAN", "attr": "CỜ ĐÃ CHUYỂN HOÀN SHOP"},
        {"key": "", "name": "updatedAt", "type": "TIMESTAMP", "attr": "LẦN ĐỒNG BỘ GẦN NHẤT"}
    ]
    idx_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "MÃ VẬN ĐƠN TRA CỨU"},
        {"key": "", "name": "searchKey", "type": "VARCHAR(128)", "attr": "SĐT NGƯỜI NHẬN, TÊN, ĐỊA CHỈ"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]

    s10_t1, s10_h1 = render_table(40, 80, 480, "TimelineEvent", "TIMELINE_EVENTS (LỊCH SỬ TRUY VẾT)", time_cols)
    s10_t2, s10_h2 = render_table(680, 80, 480, "TrackingCurrent", "TRACKING_CURRENTS (TRẠNG THÁI HIỆN TẠI)", cur_cols)
    s10_t3, s10_h3 = render_table(680, 80 + s10_h2 + 50, 480, "TrackingIndex", "TRACKING_INDEXES (CHỈ MỤC TÌM KIẾM)", idx_cols)

    s10_connectors = f'''
    <!-- TimelineEvent (N) -> TrackingCurrent (1) Direct Cross -->
    <path d="M 520 140 L 680 140" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-many)" marker-end="url(#crow-one)"/>
    <!-- TrackingCurrent (1) -> TrackingIndex (N) via Center Highway Lane 3 -->
    <path d="M 680 200 L 640 200 L 640 {80 + s10_h2 + 50 + 50} L 680 {80 + s10_h2 + 50 + 50}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    '''

    s10_sections = [
        {
            "title": "MÔ HÌNH CQRS & TRUY VẾT CÔNG KHAI TỐC ĐỘ CAO",
            "bullets": [
                "Phân tách Đọc/Ghi (CQRS): tracking-service đóng vai trò Read-Model, nhận sự kiện từ tất cả các dịch vụ (scan, shipment, delivery) để tổng hợp dòng thời gian.",
                "Trạng thái tức thời (TrackingCurrent): 1 bản ghi duy nhất cho mỗi đơn hàng giúp phục vụ hàng triệu lượt tra cứu mã vận đơn công khai mà không phải quét bảng lịch sử.",
                "Chỉ mục tìm kiếm mờ (TrackingIndex): Tối ưu hóa truy vấn theo số điện thoại người nhận hoặc tên khách hàng."
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                "shipmentCode: Khóa định danh liên kết toàn bộ hành trình từ lúc tạo đến phát thành công.",
                "Public API Cache: Cache kết quả tra cứu tại Cloudflare CDN & Redis để giảm tải tối đa cho DB."
            ]
        }
    ]

    build_standalone_svg("10-tracking-service-erd.svg", 2000, 1300,
                         "10. TRACKING-SERVICE (DỊCH VỤ TRUY VẾT HÀNH TRÌNH ĐƠN HÀNG CQRS)",
                         "3008", "tracking_db",
                         "Lược đồ dòng thời gian bưu kiện bất biến, bảng trạng thái hiện tại phục vụ tra cứu công khai siêu tốc",
                         f"{s10_t1}\n{s10_t2}\n{s10_t3}",
                         s10_connectors,
                         "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: TRACKING-SERVICE",
                         "CQRS READ MODEL",
                         s10_sections,
                         "Engine: PostgreSQL 16 | Architecture: CQRS Pattern | Read Scale: 50,000 req/sec (Redis/CDN)",
                         "Cung cấp REST API tra cứu hành trình công khai cho Web Portal Khách hàng & Mobile Tracking")

    # =========================================================================
    # 11. REPORTING-SERVICE (:3009 | reporting_db) - 100% PRISMA EXACT
    # =========================================================================
    daily_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "reportDate", "type": "DATE", "attr": "INDEX NGÀY BÁO CÁO"},
        {"key": "DIST", "name": "hubCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC THỐNG KÊ"},
        {"key": "", "name": "totalInbound", "type": "INT", "attr": "TỔNG ĐƠN NHẬP KHO"},
        {"key": "", "name": "totalOutbound", "type": "INT", "attr": "TỔNG ĐƠN XUẤT KHO"},
        {"key": "", "name": "totalDelivered", "type": "INT", "attr": "SỐ ĐƠN GIAO THÀNH CÔNG"},
        {"key": "", "name": "totalFailed", "type": "INT", "attr": "SỐ ĐƠN GIAO THẤT BẠI"},
        {"key": "", "name": "totalCodCollected", "type": "FLOAT", "attr": "TỔNG TIỀN COD THU TRONG NGÀY"},
        {"key": "", "name": "slaSuccessRate", "type": "FLOAT", "attr": "TỶ LỆ ĐẠT CHUẨN SLA (0-100%)"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    mon_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "monthYear", "type": "VARCHAR(7)", "attr": "INDEX (2026-09)"},
        {"key": "DIST", "name": "hubCode", "type": "VARCHAR(32)", "attr": "BƯU CỤC THỐNG KÊ"},
        {"key": "", "name": "monthlyVolume", "type": "INT", "attr": "TỔNG SẢN LƯỢNG THÁNG"},
        {"key": "", "name": "monthlyRevenue", "type": "FLOAT", "attr": "TỔNG DOANH THU CƯỚC THÁNG"},
        {"key": "", "name": "monthlyCodRemitted", "type": "FLOAT", "attr": "TỔNG TIỀN COD ĐÃ ĐỐI SOÁT"},
        {"key": "", "name": "lossRatio", "type": "FLOAT", "attr": "TỶ LỆ THẤT THOÁT / HƯ HỎNG"},
        {"key": "", "name": "onTimeDeliveryPct", "type": "FLOAT", "attr": "TỶ LỆ GIAO ĐÚNG HẠN TOÀN THÁNG"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"}
    ]
    job_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "", "name": "jobName", "type": "VARCHAR(64)", "attr": "DAILY_AGGREGATE, MONTHLY_KPI"},
        {"key": "", "name": "status", "type": "ENUM", "attr": "RUNNING, SUCCESS, FAILED"},
        {"key": "", "name": "startedAt", "type": "TIMESTAMP", "attr": "MỐC KHỞI CHẠY CRONJOB"},
        {"key": "", "name": "finishedAt", "type": "TIMESTAMP", "attr": "MỐC HOÀN THÀNH TIẾN TRÌNH"},
        {"key": "", "name": "processedRecords", "type": "INT", "attr": "SỐ BẢN GHI ĐÃ TÍNH TOÁN"},
        {"key": "", "name": "errorMessage", "type": "TEXT", "attr": "LOG LỖI NẾU CÓ"}
    ]
    proj_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "DIST", "name": "shipmentCode", "type": "VARCHAR(32)", "attr": "UNIQUE MÃ ĐƠN HÀNG"},
        {"key": "DIST", "name": "merchantId", "type": "VARCHAR(64)", "attr": "CHỦ SHOP GỬI"},
        {"key": "", "name": "currentStatus", "type": "VARCHAR(32)", "attr": "TRẠNG THÁI HIỆN THỜI"},
        {"key": "", "name": "totalDaysInTransit", "type": "INT", "attr": "SỐ NGÀY ĐANG LƯU THÔNG"},
        {"key": "", "name": "isSlaBreached", "type": "BOOLEAN", "attr": "CỜ VI PHẠM SLA GIAO HÀNG"}
    ]

    s11_t1, s11_h1 = render_table(40, 80, 480, "KpiDaily", "KPI_DAILIES (CHỈ SỐ HIỆU SUẤT NGÀY)", daily_cols)
    s11_t2, s11_h2 = render_table(680, 80, 480, "KpiMonthly", "KPI_MONTHLIES (TỔNG HỢP THÁNG)", mon_cols)
    s11_t3, s11_h3 = render_table(40, 80 + s11_h1 + 50, 480, "AggregationJob", "AGGREGATION_JOBS (TIẾN TRÌNH BATCH)", job_cols)
    s11_t4, s11_h4 = render_table(680, 80 + s11_h2 + 50, 480, "ShipmentStatusProjection", "STATUS_PROJECTIONS (BẢN CHIẾU OLAP)", proj_cols)

    s11_connectors = f'''
    <!-- KpiDaily (N) -> KpiMonthly (1) Direct Cross -->
    <path d="M 520 140 L 680 140" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-many)" marker-end="url(#crow-one)"/>
    <!-- AggregationJob (1) -> KpiDaily (N) via Center Highway Lane 1 -->
    <path d="M 520 {80 + s11_h1 + 50 + 50} L 560 {80 + s11_h1 + 50 + 50} L 560 220 L 520 220" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    '''

    s11_sections = [
        {
            "title": "BẢN CHIẾU OLAP & PHÂN TÍCH HIỆU SUẤT VẬN HÀNH",
            "bullets": [
                "Bản chiếu phân tích OLAP: Tách biệt hoàn toàn cơ sở dữ liệu phân tích báo cáo với CSDL giao dịch (OLTP), ngăn chặn nghẽn hệ thống.",
                "Tổng hợp chỉ số KPI tự động: Cronjob ban đêm tự động tính toán tỷ lệ giao đúng hạn (On-Time Delivery %), năng suất xử lý bưu cục và doanh thu theo bưu tá.",
                "Cảnh báo vi phạm cam kết SLA: Cờ isSlaBreached tự động đánh dấu các bưu kiện bị giam giữ quá thời gian quy định tại kho."
            ]
        },
        {
            "title": "CƠ CHẾ LIÊN KẾT PHÂN TÁN (SAGA LINKAGE)",
            "bullets": [
                "Tiêu thụ sự kiện từ RabbitMQ: Lắng nghe toàn bộ sự kiện từ shipment, scan, delivery và payment để cập nhật các bảng tổng hợp.",
                "hubCode / merchantId: Cho phép lọc báo cáo linh hoạt theo từng chi nhánh hoặc từng đối tác thương mại điện tử."
            ]
        }
    ]

    build_standalone_svg("11-reporting-service-erd.svg", 2000, 1300,
                         "11. REPORTING-SERVICE (DỊCH VỤ BÁO CÁO HIỆU SUẤT KPI & DỮ LIỆU TỔNG HỢP)",
                         "3009", "reporting_db",
                         "Lưu trữ chỉ số KPI bưu cục ngày/tháng, nhật ký tiến trình tổng hợp số liệu và bản chiếu trạng thái",
                         f"{s11_t1}\n{s11_t2}\n{s11_t3}\n{s11_t4}",
                         s11_connectors,
                         "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: REPORTING-SERVICE",
                         "ANALYTICS & BI ENGINE",
                         s11_sections,
                         "Engine: PostgreSQL 16 | Workload: OLAP & Batch Aggregation | Indexing: BRIN on reportDate",
                         "Cung cấp REST API số liệu Dashboard cho Giám đốc điều hành & Trưởng bưu cục")

    # =========================================================================
    # 12. PRICING-SERVICE (:3012 | In-Memory Engine) - CODE STRUCTURE
    # =========================================================================
    tm_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "ID MA TRẬN GIÁ"},
        {"key": "DIST", "name": "originZoneCode", "type": "VARCHAR(32)", "attr": "VÙNG GỬI (ZONE A)"},
        {"key": "DIST", "name": "destZoneCode", "type": "VARCHAR(32)", "attr": "VÙNG NHẬN (ZONE B)"},
        {"key": "", "name": "baseWeightKg", "type": "FLOAT", "attr": "MỨC CÂN CƠ BẢN (VD: 0.5 KG)"},
        {"key": "", "name": "basePrice", "type": "FLOAT", "attr": "CƯỚC CƠ BẢN (VD: 22,000 VND)"},
        {"key": "", "name": "nextStepWeightKg", "type": "FLOAT", "attr": "BƯỚC CÂN LŨY TIẾN (0.5 KG)"},
        {"key": "", "name": "nextStepPrice", "type": "FLOAT", "attr": "CƯỚC LŨY TIẾN TIẾP THEO"},
        {"key": "", "name": "isActive", "type": "BOOLEAN", "attr": "DEFAULT TRUE"},
        {"key": "", "name": "updatedAt", "type": "TIMESTAMP", "attr": "LẦN ĐIỀU CHỈNH GẦN NHẤT"}
    ]
    dim_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "ID QUY TẮC IATA"},
        {"key": "", "name": "divisor", "type": "INT", "attr": "HỆ SỐ QUY ĐỔI HÀNG KHÔNG (5000)"},
        {"key": "", "name": "minChargeableWeight", "type": "FLOAT", "attr": "TRỌNG LƯỢNG TỐI THIỂU TÍNH CƯỚC"},
        {"key": "", "name": "roundingStepKg", "type": "FLOAT", "attr": "BƯỚC LÀM TRÒN CÂN (0.1 KG)"},
        {"key": "", "name": "formulaDesc", "type": "VARCHAR(128)", "attr": "(L x W x H cm) / 5000"},
        {"key": "", "name": "effectiveFrom", "type": "DATE", "attr": "NGÀY BẮT ĐẦU ÁP DỤNG"}
    ]
    fuel_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "ID QUY TẮC PHỤ PHÍ"},
        {"key": "", "name": "percentage", "type": "FLOAT", "attr": "TỶ LỆ PHỤ PHÍ NHIÊN LIỆU (VD: 12%)"},
        {"key": "", "name": "minFee", "type": "FLOAT", "attr": "PHÍ TỐI THIỂU"},
        {"key": "", "name": "scope", "type": "VARCHAR(32)", "attr": "AIR_CARGO, ROAD_LINEHAUL"},
        {"key": "", "name": "effectiveFrom", "type": "DATE", "attr": "NGÀY CÔNG BỐ ÁP DỤNG"},
        {"key": "", "name": "effectiveTo", "type": "DATE", "attr": "NGÀY HẾT HẠN HIỆU LỰC"}
    ]
    vas_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "ID DỊCH VỤ VAS"},
        {"key": "", "name": "vasCode", "type": "VARCHAR(32)", "attr": "UNIQUE (INSURANCE, COD_COLLECT)"},
        {"key": "", "name": "vasName", "type": "VARCHAR(64)", "attr": "BẢO HIỂM HÀNG HOÁ, ĐỒNG KIỂM"},
        {"key": "", "name": "ratePct", "type": "FLOAT", "attr": "TỶ LỆ % GIÁ TRỊ KHAI GIÁ (VD: 0.5%)"},
        {"key": "", "name": "minVasFee", "type": "FLOAT", "attr": "MỨC PHÍ TỐI THIỂU (VD: 5,000 VND)"},
        {"key": "", "name": "isActive", "type": "BOOLEAN", "attr": "DEFAULT TRUE"}
    ]

    s12_t1, s12_h1 = render_table(40, 80, 480, "TariffMatrix", "TARIFF_MATRICES (BẢNG GIÁ THEO TUYẾN)", tm_cols)
    s12_t2, s12_h2 = render_table(680, 80, 480, "DimensionalRule", "DIMENSIONAL_RULES (CÔNG THỨC IATA)", dim_cols)
    s12_t3, s12_h3 = render_table(40, 80 + s12_h1 + 50, 480, "FuelSurchargeRule", "FUEL_RULES (PHỤ PHÍ XĂNG DẦU)", fuel_cols)
    s12_t4, s12_h4 = render_table(680, 80 + s12_h2 + 50, 480, "VasCatalog", "VAS_CATALOG (DỊCH VỤ CỘNG THÊM)", vas_cols)

    s12_connectors = f'''
    <!-- TariffMatrix (1) -> DimensionalRule (1) Direct Cross -->
    <path d="M 520 140 L 680 140" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>
    <!-- TariffMatrix (1) -> FuelSurchargeRule (1) via Center Highway Lane 1 -->
    <path d="M 520 220 L 560 220 L 560 {80 + s12_h1 + 50 + 50} L 520 {80 + s12_h1 + 50 + 50}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-one)"/>
    '''

    s12_sections = [
        {
            "title": "ĐỘNG CƠ TÍNH CƯỚC TỐC ĐỘ CAO (IN-MEMORY PRICING ENGINE)",
            "bullets": [
                "Kiến trúc không trạng thái (Stateless Engine): pricing-service tải ma trận bảng cước và quy tắc phụ phí lên bộ nhớ RAM để tính toán siêu tốc (< 5ms).",
                "Quy chuẩn cước hàng không IATA: Tự động so sánh giữa trọng lượng thực tế (Gross Weight) và trọng lượng quy đổi thể tích (Volumetric Weight = L x W x H / 5000), lấy giá trị lớn hơn để tính cước.",
                "Dịch vụ giá trị gia tăng (VAS): Tự động tính phí bảo hiểm bưu gửi và phí thu hộ COD theo tỷ lệ lũy tiến."
            ]
        }
    ]

    build_standalone_svg("12-pricing-service-erd.svg", 2000, 1300,
                         "12. PRICING-SERVICE (ĐỘNG CƠ TÍNH CƯỚC TỰ ĐỘNG CHUẨN QUỐC TẾ IATA)",
                         "3012", "pricing_engine",
                         "Tính cước thời gian thực, quy đổi thể tích hàng không IATA, phụ phí nhiên liệu & dịch vụ cộng thêm",
                         f"{s12_t1}\n{s12_t2}\n{s12_t3}\n{s12_t4}",
                         s12_connectors,
                         "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: PRICING-SERVICE",
                         "IATA STANDARD CALCULATION",
                         s12_sections,
                         "Engine: In-Memory Rule Engine (TypeScript) | Standards: IATA Cargo Dimensional Rules | Latency: < 5ms",
                         "Cung cấp REST API tính cước bưu kiện thời gian thực cho Portal và Mobile App")

    # =========================================================================
    # 13. CHATBOT-SERVICE (:3013 | RAG Vector Engine & Session) - CODE STRUCTURE
    # =========================================================================
    vec_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "ID PHÂN ĐOẠN TRI THỨC"},
        {"key": "", "name": "chunkId", "type": "VARCHAR(64)", "attr": "UNIQUE MÃ ĐOẠN VĂN BẢN"},
        {"key": "", "name": "documentSlug", "type": "VARCHAR(64)", "attr": "01-PRICING, 02-INSURANCE..."},
        {"key": "", "name": "sectionTitle", "type": "VARCHAR(128)", "attr": "TIÊU ĐỀ ĐIỀU KHOẢN"},
        {"key": "", "name": "textContent", "type": "TEXT", "attr": "NỘI DUNG VĂN BẢN QUY PHẠM"},
        {"key": "", "name": "embeddingVector", "type": "VECTOR(768)", "attr": "GOOGLE GEMINI 768 CHIỀU"},
        {"key": "", "name": "tokenCount", "type": "INT", "attr": "SỐ TOKEN TRONG PHÂN ĐOẠN"}
    ]
    chat_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "ID PHIÊN HỘI THOẠI"},
        {"key": "", "name": "sessionId", "type": "VARCHAR(64)", "attr": "UNIQUE MÃ PHIÊN CHAT"},
        {"key": "DIST", "name": "userId", "type": "VARCHAR(64)", "attr": "FK-dist auth.users / GUEST"},
        {"key": "", "name": "role", "type": "VARCHAR(32)", "attr": "GUEST, CUSTOMER, MERCHANT"},
        {"key": "", "name": "intentDetected", "type": "VARCHAR(64)", "attr": "Ý ĐỊNH BÓC TÁCH (TRACK_ORDER)"},
        {"key": "", "name": "isEscalatedToHuman", "type": "BOOLEAN", "attr": "CHUYỂN TIẾP CSKH (HITL)"},
        {"key": "", "name": "satisfactionScore", "type": "INT", "attr": "ĐIỂM ĐÁNH GIÁ (1-5 SAO)"},
        {"key": "", "name": "createdAt", "type": "TIMESTAMP", "attr": "DEFAULT NOW()"},
        {"key": "", "name": "closedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM KẾT THÚC PHIÊN"}
    ]
    intent_cols = [
        {"key": "PK", "name": "id", "type": "VARCHAR(64)", "attr": "CUID NOT NULL"},
        {"key": "FK", "name": "sessionId", "type": "VARCHAR(64)", "attr": "FK -> ChatSessionLog.id"},
        {"key": "", "name": "extractedShipmentCode", "type": "VARCHAR(32)", "attr": "MÃ VẬN ĐƠN BÓC TÁCH"},
        {"key": "", "name": "extractedPhone", "type": "VARCHAR(20)", "attr": "SĐT ĐƯỢC BẢO VỆ PII MASK"},
        {"key": "", "name": "confidenceScore", "type": "FLOAT", "attr": "ĐỘ TIN CẬY MÔ HÌNH (0-1.0)"},
        {"key": "", "name": "matchedAt", "type": "TIMESTAMP", "attr": "THỜI ĐIỂM TRÍCH XUẤT"}
    ]

    s13_t1, s13_h1 = render_table(40, 80, 480, "FaqVectorStore", "FAQ_VECTORS (KHO TRI THỨC NHÚNG)", vec_cols)
    s13_t2, s13_h2 = render_table(680, 80, 480, "ChatSessionLog", "CHAT_SESSIONS (LỊCH SỬ HỘI THOẠI)", chat_cols)
    s13_t3, s13_h3 = render_table(680, 80 + s13_h2 + 50, 480, "IntentEntityMap", "INTENT_ENTITIES (Ý ĐỊNH & THỰC THỂ)", intent_cols)

    s13_connectors = f'''
    <!-- ChatSessionLog (1) -> FaqVectorStore (N) Direct Cross -->
    <path d="M 680 140 L 520 140" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    <!-- ChatSessionLog (1) -> IntentEntityMap (N) via Center Highway Lane 3 -->
    <path d="M 680 220 L 640 220 L 640 {80 + s13_h2 + 50 + 50} L 680 {80 + s13_h2 + 50 + 50}" stroke="#000000" stroke-width="1.8" fill="none" marker-start="url(#crow-one)" marker-end="url(#crow-many)"/>
    '''

    s13_sections = [
        {
            "title": "KHO TRI THỨC NHÚNG VECTOR & PHIÊN HỘI THOẠI AI (RAG ENGINE)",
            "bullets": [
                "Lưu trữ Vector Embedding: FaqVectorStore lưu các đoạn tri thức phân đoạn (Chunk 450 tokens) được nhúng qua Google Gemini Text-Embedding-004 (768 chiều).",
                "Quản lý phiên hội thoại (ChatSessionLog): Ghi nhận toàn bộ ngữ cảnh trao đổi, bóc tách ý định (Intent Extraction) và tự động lọc dữ liệu nhạy cảm PII.",
                "Cơ chế chuyển tiếp người thật (Human-in-the-Loop): Khi điểm tự tin confidenceScore < 0.65, kích hoạt cờ isEscalatedToHuman để chuyển giao điện thoại thoại viên."
            ]
        }
    ]

    build_standalone_svg("13-chatbot-service-erd.svg", 2000, 1300,
                         "13. CHATBOT-SERVICE (KHO TRI THỨC NHÚNG VECTOR RAG AI & QUẢN LÝ PHIÊN CHAT)",
                         "3013", "vector_rag_db",
                         "Lưu trữ phân đoạn tri thức văn bản bưu chính nhúng 768 chiều & lịch sử hội thoại khách hàng",
                         f"{s13_t1}\n{s13_t2}\n{s13_t3}",
                         s13_connectors,
                         "GIẢI THÍCH SƠ BỘ & QUY TẮC DỮ LIỆU: CHATBOT-SERVICE",
                         "VECTOR DATABASE & RAG",
                         s13_sections,
                         "Vector DB: PostgreSQL pgvector / HNSW Index | Embedding: Gemini 768d | HITL Escalation: Enabled",
                         "Cung cấp REST & WebSocket API hỗ trợ giải đáp tự động chính sách, giá cước & khiếu nại 24/7")

if __name__ == "__main__":
    generate_all_individual_erds()
