#!/usr/bin/env python3
"""
generate-architecture-diagram.py
Generates the Enterprise System Architecture & Deployment Blueprint (5-Tier)
in Genuine Architectural Schematic Layout with Extra-Large, Hyper-Readable Typography.

Design Specifications:
- EXTRA-LARGE, HYPER-READABLE TYPOGRAPHY ("Chữ to, rõ ràng, dễ nhìn mọi cự ly"):
  * Tiêu đề sơ đồ: 30px (font-weight: 900).
  * Tiêu đề tầng: 15.5px (font-weight: 800, tracking 1.5px).
  * Tên Gateway & RabbitMQ: 20px - 20.5px (font-weight: 900).
  * Tiêu đề thẻ dịch vụ & CSDL: 16.5px - 18.5px (font-weight: 800/900).
  * Tên microservice & Port: 14px - 14.5px (font-weight: 800 mono).
  * Nội dung gạch đầu dòng & giải thích: 13px - 13.5px (font-weight: 500/600, màu #1E293B sắc nét).
  * Nhãn kết nối & Thẻ route: 13px - 14px (font-weight: 800).
  * Ghi chú chân trang: 13.5px (font-weight: 700).
- KHÔNG GIAN THOÁNG ĐÃNG (Spacious Architecture):
  * Canvas mở rộng: W=1320, H=1780.
  * Khoảng cách giữa các tầng: 95px - 110px.
  * Thẻ dịch vụ mở rộng lên 350px x 220px, line-height 23px - 25px.
  * Khối trụ CSDL 3D mở rộng lên 350px x 220px.
- SÁNG SỦA & CHUẨN IN ẤN (Print-Ready Aesthetics):
  * Nền trắng tinh khiết (#FFFFFF), Gateway BFF nền sáng (#F0F9FF) viền xanh công nghệ (#0284C7).
  * 100% Native Inline Vector SVG (zero <marker> tags for Figma compatibility).
  * 100% Valid XML syntax.
"""

import os
import html
import re
import xml.etree.ElementTree as ET

OUTPUT_FILES = [
    "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/02-architecture-deployment-4-tier.svg",
    "docs/graduation-thesis/diagrams/architecture/01-architecture-deployment-4-tier.svg"
]

def xml_esc(s):
    if s is None:
        return ""
    clean = str(s).replace("&amp;", "&")
    return html.escape(clean, quote=True)

# =============================================================================
# BESPOKE NATIVE SVG ICONS (100% INLINE VECTORS)
# =============================================================================

def icon_nexus_crest():
    return '''<g class="icon-crest">
      <polygon points="24,2 46,14 46,36 24,48 2,36 2,14" fill="#F8FAFC" stroke="#0F172A" stroke-width="2.6"/>
      <polygon points="24,6 42,16 42,34 24,44 6,34 6,16" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.5"/>
      <path d="M 15 33 L 15 17 L 33 33 L 33 17" fill="none" stroke="#0F172A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="20,13 24,9 28,13" fill="none" stroke="#0284C7" stroke-width="2.6" stroke-linecap="round"/>
    </g>'''

def icon_monitor():
    return '''<g>
      <rect x="2" y="2" width="24" height="16" rx="3" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.8"/>
      <line x1="2" y1="14" x2="26" y2="14" stroke="#0284C7" stroke-width="1.1"/>
      <line x1="14" y1="18" x2="14" y2="23" stroke="#0F172A" stroke-width="2"/>
      <line x1="9" y1="23" x2="19" y2="23" stroke="#0F172A" stroke-width="2" stroke-linecap="round"/>
      <circle cx="6" cy="6" r="1.3" fill="#0284C7"/>
    </g>'''

def icon_hub():
    return '''<g>
      <polygon points="14,2 26,9 26,22 14,29 2,22 2,9" fill="#F0FDF4" stroke="#059669" stroke-width="1.8"/>
      <line x1="14" y1="2" x2="14" y2="15" stroke="#059669" stroke-width="1.3"/>
      <line x1="14" y1="15" x2="2" y2="22" stroke="#059669" stroke-width="1.3"/>
      <line x1="14" y1="15" x2="26" y2="22" stroke="#059669" stroke-width="1.3"/>
      <circle cx="14" cy="15" r="2.6" fill="#059669"/>
    </g>'''

def icon_store():
    return '''<g>
      <path d="M 2 9 L 7 2 L 22 2 L 27 9 Z" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.8"/>
      <rect x="3" y="9" width="23" height="17" rx="2" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>
      <rect x="7" y="14" width="7" height="12" fill="#BAE6FD" stroke="#0284C7" stroke-width="1.1"/>
      <rect x="16" y="14" width="7" height="7" fill="#E2E8F0" stroke="#64748B" stroke-width="1.1"/>
    </g>'''

def icon_mobile():
    return '''<g>
      <rect x="5" y="2" width="18" height="26" rx="3.5" fill="#FAF5FF" stroke="#7C3AED" stroke-width="1.8"/>
      <rect x="8" y="6" width="12" height="16" rx="1" fill="#FFFFFF" stroke="#D8B4FE" stroke-width="0.9"/>
      <circle cx="14" cy="25" r="1.4" fill="#7C3AED"/>
      <line x1="11" y1="4" x2="17" y2="4" stroke="#7C3AED" stroke-width="1.1" stroke-linecap="round"/>
    </g>'''

def icon_tracking():
    return '''<g>
      <circle cx="12" cy="12" r="9" fill="#F0FDF4" stroke="#059669" stroke-width="1.8"/>
      <line x1="19" y1="19" x2="25" y2="25" stroke="#0F172A" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M 8 12 L 11 15 L 17 9" fill="none" stroke="#059669" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>'''

def icon_gateway():
    return '''<g>
      <path d="M 16 3 L 29 8 L 29 19 C 29 26.5 16 32 16 32 C 16 32 3 26.5 3 19 L 3 8 Z" fill="#EFF6FF" stroke="#0284C7" stroke-width="2.2"/>
      <rect x="12" y="13" width="8" height="7.5" rx="1" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.3"/>
      <path d="M 13.5 13 L 13.5 10 A 2.5 2.5 0 0 1 18.5 10 L 18.5 13" fill="none" stroke="#0F172A" stroke-width="1.3"/>
    </g>'''

def icon_rabbitmq():
    return '''<g>
      <rect x="2" y="2" width="28" height="28" rx="5" fill="#FFF7ED" stroke="#EA580C" stroke-width="2"/>
      <ellipse cx="16" cy="18" rx="7.5" ry="6" fill="#FDBA74" stroke="#EA580C" stroke-width="1.4"/>
      <ellipse cx="11.5" cy="9.5" rx="2.4" ry="5" fill="#FDBA74" stroke="#EA580C" stroke-width="1.2"/>
      <ellipse cx="20.5" cy="9.5" rx="2.4" ry="5" fill="#FDBA74" stroke="#EA580C" stroke-width="1.2"/>
    </g>'''

# =============================================================================
# 3D CYLINDER DRAWING HELPER (EXTRA-LARGE TYPOGRAPHY, SPACIOUS DATABASE SHAPE)
# =============================================================================

def draw_3d_cylinder(x, y, w, h, title, subtitle, bullets, badge=None, stroke_color="#0284C7", fill_top="#EFF6FF", fill_body="#FFFFFF"):
    """
    Renders an airy, bright 3D cylinder database shape with comfortable text padding and extra-large typography.
    """
    ry = 18
    rx = w / 2
    cx = x + rx
    cy_top = y + ry
    cy_bottom = y + h - ry

    lines = []
    lines.append(f'  <g class="node-shadow">')
    # Cylinder body
    lines.append(f'    <path d="M {x} {cy_top} L {x} {cy_bottom} A {rx} {ry} 0 0 0 {x + w} {cy_bottom} L {x + w} {cy_top} Z" fill="{fill_body}" stroke="{stroke_color}" stroke-width="1.9"/>')
    # Bottom rim arc
    lines.append(f'    <path d="M {x} {cy_bottom} A {rx} {ry} 0 0 0 {x + w} {cy_bottom}" fill="none" stroke="{stroke_color}" stroke-width="1.9"/>')
    # Top lid ellipse
    lines.append(f'    <ellipse cx="{cx}" cy="{cy_top}" rx="{rx}" ry="{ry}" fill="{fill_top}" stroke="{stroke_color}" stroke-width="1.9"/>')
    
    # Text content inside cylinder body (Large, bold, crisp)
    lines.append(f'    <text x="{cx}" y="{cy_top + 34}" font-size="18.5" font-weight="900" fill="#0F172A" text-anchor="middle">{xml_esc(title)}</text>')
    lines.append(f'    <text x="{cx}" y="{cy_top + 55}" class="mono" font-size="13.5" font-weight="800" fill="{stroke_color}" text-anchor="middle">{xml_esc(subtitle)}</text>')
    
    # Bullet points (Comfortable spacing & high-contrast dark text)
    by = cy_top + 84
    for b in bullets:
        lines.append(f'    <text x="{x + 22}" y="{by}" font-size="13" font-weight="500" fill="#1E293B">• {xml_esc(b)}</text>')
        by += 24

    # Optional bottom badge plate
    if badge:
        lines.append(f'    <rect x="{x + 20}" y="{y + h - 38}" width="{w - 40}" height="26" rx="5" fill="{fill_top}" stroke="{stroke_color}" stroke-width="1.2"/>')
        lines.append(f'    <text x="{cx}" y="{y + h - 20}" class="mono" font-size="12.5" font-weight="800" fill="{stroke_color}" text-anchor="middle">{xml_esc(badge)}</text>')

    lines.append('  </g>')
    return "\n".join(lines)

# =============================================================================
# MAIN BUILDER (DECOUPLED, EXTRA-LARGE TYPOGRAPHY SCHEMATIC ARCHITECTURE DIAGRAM)
# =============================================================================

def build_architecture_diagram():
    W = 1320
    H = 1780
    lines = []

    lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;family=JetBrains+Mono:wght@500;600;700;800&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
      .mono {{ font-family: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace; }}
      .node-shadow {{ filter: drop-shadow(0 4px 12px rgba(15, 23, 42, 0.08)); }}
      .hub-shadow {{ filter: drop-shadow(0 6px 18px rgba(15, 23, 42, 0.12)); }}
    </style>
  </defs>

  <!-- PURE CRISP WHITE CANVAS (ZERO DOCUMENT FRAMES, ZERO PAPER BORDERS) -->
  <rect width="{W}" height="{H}" fill="#FFFFFF"/>

  <!-- =========================================================================
       DIAGRAM TITLE HEADER (CLEAN ARCHITECTURAL TITLE, NO HEAVY BOX)
       ========================================================================= -->
  <g id="Diagram_Header" transform="translate(660, 52)">
    <g transform="translate(-480, -28)">{icon_nexus_crest()}</g>
    <text x="0" y="0" font-size="30" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="-0.02em">SƠ ĐỒ KIẾN TRÚC TỔNG THỂ &amp; DỊCH VỤ PHÂN TÁN</text>
    <text x="0" y="32" font-size="15" font-weight="500" fill="#475569" text-anchor="middle">Nexus Express System • Event-Driven Microservices Architecture, API Gateway BFF &amp; Polyglot Persistence</text>
  </g>''')

    # =========================================================================
    # TIER 1: CLIENT APPLICATIONS (OPEN FLOATING NODES, NO ENCLOSING BOX)
    # y: 130 to 255, Width = 210 each, Gap = 24
    # =========================================================================
    lines.append('''  <!-- Tier 1: Client Applications (Lớp ứng dụng người dùng - Open Floating Nodes) -->
  <g id="Tier_1_Clients">
    <text x="660" y="132" font-size="15.5" font-weight="800" fill="#475569" letter-spacing="1.5px" text-anchor="middle">LỚP ỨNG DỤNG NGƯỜI DÙNG (CLIENT APPLICATIONS LAYER)</text>''')

    # 5 Standalone Client Cards (w: 210, h: 95, gap: 24)
    # x start = 110, y = 160
    clients = [
        {"x": 110, "name": "Admin Web", "sub": "Quản trị hệ thống", "tech": "React 18", "port": ":5173", "icon": icon_monitor(), "color": "#0284C7", "border": "#0284C7"},
        {"x": 344, "name": "Ops Web", "sub": "Vận hành kho/hub", "tech": "React 18", "port": ":5173", "icon": icon_hub(), "color": "#059669", "border": "#059669"},
        {"x": 578, "name": "Merchant Web", "sub": "Tạo đơn, pickup", "tech": "React 18", "port": ":5174", "icon": icon_store(), "color": "#0284C7", "border": "#0284C7"},
        {"x": 812, "name": "Courier Mobile", "sub": "Task, scan, POD", "tech": "React Native", "port": ":8082", "icon": icon_mobile(), "color": "#7C3AED", "border": "#7C3AED"},
        {"x": 1046, "name": "Public Tracking", "sub": "Tra cứu vận đơn", "tech": "React 18", "port": ":5177", "icon": icon_tracking(), "color": "#059669", "border": "#059669"},
    ]

    for c in clients:
        lines.append(f'''    <!-- Client Node: {c['name']} -->
    <g transform="translate({c['x']}, 160)" class="node-shadow">
      <rect x="0" y="0" width="210" height="95" rx="10" fill="#FFFFFF" stroke="{c['border']}" stroke-width="1.8"/>
      <g transform="translate(14, 15)">{c['icon']}</g>
      <text x="50" y="28" font-size="16.5" font-weight="800" fill="#0F172A">{c['name']}</text>
      <text x="50" y="49" font-size="13.5" font-weight="500" fill="#334155">{c['sub']}</text>
      <rect x="14" y="64" width="62" height="21" rx="4" fill="#F1F5F9" stroke="{c['color']}" stroke-width="1.1"/>
      <text x="45" y="79" class="mono" font-size="12" font-weight="800" fill="{c['color']}" text-anchor="middle">{c['port']}</text>
      <text x="86" y="79" class="mono" font-size="12" font-weight="600" fill="#475569">• {c['tech']}</text>
    </g>''')
    lines.append('  </g>')

    # Aggregation bus lines from 5 clients into central trunk
    lines.append('''  <!-- Client Aggregation Bus Line -->
  <path d="M 215 255 L 215 280 L 1151 280 L 1151 255" fill="none" stroke="#64748B" stroke-width="1.8" stroke-dasharray="6,4"/>
  <line x1="449" y1="255" x2="449" y2="280" stroke="#64748B" stroke-width="1.8" stroke-dasharray="6,4"/>
  <line x1="683" y1="255" x2="683" y2="280" stroke="#64748B" stroke-width="1.8" stroke-dasharray="6,4"/>
  <line x1="917" y1="255" x2="917" y2="280" stroke="#64748B" stroke-width="1.8" stroke-dasharray="6,4"/>''')

    # =========================================================================
    # INGRESS CONNECTOR: CLIENTS ➔ GATEWAY (y: 280 to 365, h: 85)
    # =========================================================================
    lines.append('''  <!-- Ingress Flow: Clients to Gateway BFF -->
  <g id="Connector_Clients_Gateway">
    <line x1="660" y1="280" x2="660" y2="365" stroke="#0F172A" stroke-width="2.8"/>
    <polygon points="653,351 660,366 667,351" fill="#0F172A"/>
    <rect x="560" y="306" width="200" height="34" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.6"/>
    <text x="660" y="328" class="mono" font-size="13.5" font-weight="800" fill="#0F172A" text-anchor="middle">HTTP / REST Ingress</text>
  </g>''')

    # =========================================================================
    # GATEWAY BFF HUB (STANDALONE FLOATING NODE, WIDTH: 780, x: 270, y: 365, h: 110)
    # Luminous, Print-Ready Tech Blue Styling with Extra-Large Typography
    # =========================================================================
    gw_x = 270
    gw_y = 365
    gw_w = 780
    gw_h = 110

    lines.append(f'''  <!-- Gateway BFF Hub (Central Ingress Node - Bright Print-Ready) -->
  <g id="Gateway_BFF_Hub" transform="translate({gw_x}, {gw_y})" class="hub-shadow">
    <rect x="0" y="0" width="{gw_w}" height="{gw_h}" rx="12" fill="#F0F9FF" stroke="#0284C7" stroke-width="2.4"/>
    <g transform="translate(20, 18)">{icon_gateway()}</g>
    <text x="62" y="36" font-size="20.5" font-weight="900" fill="#0F172A">Gateway BFF (:3000 / HTTPS :443)</text>
    <text x="62" y="60" font-size="14.5" font-weight="500" fill="#334155">Điểm vào duy nhất cho web/mobile • Reverse Proxy • JWT RBAC &amp; Sliding Rate Limiter</text>
    
    <!-- Route Chips Strip -->
    <g transform="translate(62, 72)">
      <text x="0" y="18" class="mono" font-size="13" font-weight="800" fill="#475569">ROUTES:</text>
      <rect x="76" y="0" width="86" height="26" rx="5" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.3"/>
      <text x="119" y="18" class="mono" font-size="13" font-weight="800" fill="#0284C7" text-anchor="middle">/admin</text>
      <rect x="172" y="0" width="76" height="26" rx="5" fill="#FFFFFF" stroke="#059669" stroke-width="1.3"/>
      <text x="210" y="18" class="mono" font-size="13" font-weight="800" fill="#059669" text-anchor="middle">/ops</text>
      <rect x="258" y="0" width="112" height="26" rx="5" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.3"/>
      <text x="314" y="18" class="mono" font-size="13" font-weight="800" fill="#0284C7" text-anchor="middle">/merchant</text>
      <rect x="380" y="0" width="96" height="26" rx="5" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.3"/>
      <text x="428" y="18" class="mono" font-size="13" font-weight="800" fill="#7C3AED" text-anchor="middle">/courier</text>
      <rect x="486" y="0" width="96" height="26" rx="5" fill="#FFFFFF" stroke="#D97706" stroke-width="1.3"/>
      <text x="534" y="18" class="mono" font-size="13" font-weight="800" fill="#D97706" text-anchor="middle">/finance</text>
      <rect x="592" y="0" width="76" height="26" rx="5" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.3"/>
      <text x="630" y="18" class="mono" font-size="13" font-weight="800" fill="#7C3AED" text-anchor="middle">/ai</text>
    </g>
  </g>''')

    # =========================================================================
    # INTERNAL NETWORK CONNECTOR: GATEWAY ➔ MICROSERVICES (y: 475 to 570, h: 95)
    # =========================================================================
    lines.append('''  <!-- Internal HTTP Dispatch Connector -->
  <g id="Connector_Gateway_Services">
    <line x1="660" y1="475" x2="660" y2="570" stroke="#0F172A" stroke-width="2.8"/>
    <polygon points="653,556 660,571 667,556" fill="#0F172A"/>
    <rect x="545" y="504" width="230" height="34" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.6"/>
    <text x="660" y="526" font-size="13.5" font-weight="800" fill="#0F172A" text-anchor="middle">HTTP nội bộ (Proxy Router)</text>
  </g>''')

    # =========================================================================
    # TIER 2: DOMAIN MICROSERVICES MESH (y: 570, h: 530, w: 1150, x: 85)
    # 6 Decoupled Floating Domain Nodes (2 rows of 3 columns, w: 350, h: 220)
    # Row gap: 20px, Column gap: 25px, Extra-Large 13px-14.5px Typography
    # =========================================================================
    t2_x = 85
    t2_y = 570
    t2_w = 1150
    t2_h = 530

    lines.append(f'''  <!-- Tier 2: Domain Microservices Mesh (Internal Docker Network Cluster) -->
  <g id="Tier_2_Microservices_Zone">
    <!-- Faint Docker Network Cluster Boundary -->
    <rect x="{t2_x}" y="{t2_y}" width="{t2_w}" height="{t2_h}" rx="14" fill="#F8FAFC" fill-opacity="0.35" stroke="#CBD5E1" stroke-width="1.3" stroke-dasharray="6,4"/>
    <text x="{t2_x + 28}" y="{t2_y + 32}" font-size="15" font-weight="800" fill="#475569" letter-spacing="1px">LỚP MICROSERVICES NGHIỆP VỤ (INTERNAL DOCKER NETWORK)</text>''')

    # 6 Decoupled Domain Cards:
    # Row 1: y = 620, h = 220
    # Row 2: y = 860, h = 220  (Gap between rows = 20px)
    # Col 1: x = 115, Col 2: x = 490, Col 3: x = 865, w = 350 (Gap between cols = 25px)

    # Card 1: Core Domain (x: 115, y: 620)
    lines.append('''    <!-- Card 1: Nhóm lõi hệ thống -->
    <g transform="translate(115, 620)" class="node-shadow">
      <rect x="0" y="0" width="350" height="220" rx="9" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.8"/>
      <rect x="0" y="0" width="350" height="40" rx="9" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.8"/>
      <text x="18" y="27" font-size="16.5" font-weight="800" fill="#0369A1">Nhóm lõi hệ thống (Core Domain)</text>
      
      <g transform="translate(18, 56)">
        <text x="0" y="16" class="mono" font-size="14.5" font-weight="800" fill="#0F172A">auth-service (:3010)</text>
        <text x="0" y="36" font-size="13" font-weight="500" fill="#334155">• User, session, Argon2id, JWT RBAC</text>

        <text x="0" y="66" class="mono" font-size="14.5" font-weight="800" fill="#0F172A">masterdata-service (:3011)</text>
        <text x="0" y="86" font-size="13" font-weight="500" fill="#334155">• Hub 4 cấp, zone, SLA matrix</text>

        <text x="0" y="116" class="mono" font-size="14.5" font-weight="800" fill="#0F172A">pricing-service (:3012)</text>
        <text x="0" y="136" font-size="13" font-weight="600" fill="#059669">• Bảng cước tức thời (RAM compute &lt; 2ms)</text>
      </g>
    </g>''')

    # Card 2: Shipment Domain Core (x: 490, y: 620)
    lines.append('''    <!-- Card 2: Shipment Domain (Source of Truth) -->
    <g transform="translate(490, 620)" class="node-shadow">
      <rect x="0" y="0" width="350" height="220" rx="9" fill="#FFFFFF" stroke="#DC2626" stroke-width="2"/>
      <rect x="0" y="0" width="350" height="40" rx="9" fill="#FEF2F2" stroke="#DC2626" stroke-width="2"/>
      <text x="18" y="27" font-size="16.5" font-weight="900" fill="#B91C1C">Shipment domain (Source of Truth)</text>
      
      <g transform="translate(18, 56)">
        <text x="0" y="16" class="mono" font-size="14.5" font-weight="900" fill="#0F172A">shipment-service (:3001)</text>
        <text x="0" y="37" font-size="13" font-weight="600" fill="#1E293B">• Sở hữu vòng đời 19 trạng thái FSM</text>
        <text x="0" y="58" font-size="13" font-weight="500" fill="#334155">• Lưu snapshot pricing khi tạo đơn</text>
        <text x="0" y="82" class="mono" font-size="13" font-weight="800" fill="#DC2626">&#128274; Distributed Lock: isLocked = true</text>
        <text x="0" y="103" font-size="13" font-weight="600" fill="#334155">Bảo vệ đối soát COD &amp; Biên bản BBBT</text>
        <text x="0" y="126" class="mono" font-size="13" font-weight="800" fill="#059669">&#10003; Transactional Outbox Table Pattern</text>
      </g>
    </g>''')

    # Card 3: Custody & Linehaul (x: 865, y: 620)
    lines.append('''    <!-- Card 3: Nhóm vận hành & linehaul -->
    <g transform="translate(865, 620)" class="node-shadow">
      <rect x="0" y="0" width="350" height="220" rx="9" fill="#FFFFFF" stroke="#059669" stroke-width="1.8"/>
      <rect x="0" y="0" width="350" height="40" rx="9" fill="#F0FDF4" stroke="#059669" stroke-width="1.8"/>
      <text x="18" y="27" font-size="16.5" font-weight="800" fill="#047857">Nhóm vận hành &amp; Linehaul</text>
      
      <g transform="translate(18, 56)">
        <text x="0" y="16" class="mono" font-size="14.5" font-weight="800" fill="#0F172A">pickup-service (:3003)</text>
        <text x="0" y="36" font-size="13" font-weight="500" fill="#334155">• Yêu cầu thu gom kiện hàng merchant</text>

        <text x="0" y="66" class="mono" font-size="14.5" font-weight="800" fill="#0F172A">manifest-service (:3005)</text>
        <text x="0" y="86" font-size="13" font-weight="500" fill="#334155">• Đóng bao niêm phong &amp; chuyến xe hub</text>

        <text x="0" y="116" class="mono" font-size="14.5" font-weight="800" fill="#0F172A">scan-service (:3006)</text>
        <text x="0" y="136" font-size="13" font-weight="700" fill="#DC2626">• Quét In/Outbound, lập BBBT sự cố 24h</text>
      </g>
    </g>''')

    # Card 4: Scan & Delivery (x: 115, y: 860)
    lines.append('''    <!-- Card 4: Chặng cuối & POD -->
    <g transform="translate(115, 860)" class="node-shadow">
      <rect x="0" y="0" width="350" height="220" rx="9" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.8"/>
      <rect x="0" y="0" width="350" height="40" rx="9" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.8"/>
      <text x="18" y="27" font-size="16.5" font-weight="800" fill="#0369A1">Chặng cuối &amp; POD (Fulfillment)</text>
      
      <g transform="translate(18, 56)">
        <text x="0" y="16" class="mono" font-size="14.5" font-weight="800" fill="#0F172A">dispatch-service (:3004)</text>
        <text x="0" y="36" font-size="13" font-weight="500" fill="#334155">• Phân ca giao &amp; cân bằng tải shipper</text>

        <text x="0" y="66" class="mono" font-size="14.5" font-weight="800" fill="#0F172A">delivery-service (:3007)</text>
        <text x="0" y="86" font-size="13" font-weight="500" fill="#334155">• Chữ ký số, ảnh POD, mã OTP phát hàng</text>

        <rect x="0" y="104" width="318" height="42" rx="5" fill="#F8FAFC" stroke="#BFDBFE" stroke-width="1.1"/>
        <text x="12" y="122" font-size="13" font-weight="800" fill="#0369A1">CƠ CHẾ HOÀN RTO:</text>
        <text x="12" y="138" font-size="12.5" font-weight="600" fill="#334155">3 lần giao hỏng (failed x3) ➔ Hoàn hàng</text>
      </g>
    </g>''')

    # Card 5: COD & Payment (x: 490, y: 860)
    lines.append('''    <!-- Card 5: COD & Thanh toán -->
    <g transform="translate(490, 860)" class="node-shadow">
      <rect x="0" y="0" width="350" height="220" rx="9" fill="#FFFFFF" stroke="#D97706" stroke-width="1.8"/>
      <rect x="0" y="0" width="350" height="40" rx="9" fill="#FFFBEB" stroke="#D97706" stroke-width="1.8"/>
      <text x="18" y="27" font-size="16.5" font-weight="800" fill="#92400E">COD &amp; Thanh toán (Payment)</text>
      
      <g transform="translate(18, 56)">
        <text x="0" y="16" class="mono" font-size="14.5" font-weight="900" fill="#0F172A">payment-service (:3011)</text>
        <text x="0" y="37" font-size="13" font-weight="700" fill="#92400E">• Double-Entry Ledger (Sổ cái kép Nợ/Có)</text>
        <text x="0" y="58" font-size="13" font-weight="500" fill="#334155">• Đối soát COD kỳ thanh toán &amp; bồi thường</text>
        <text x="0" y="80" font-size="13" font-weight="700" fill="#B45309">&#128179; Dynamic VietQR: Nộp tiền Shipper</text>
        <text x="0" y="101" font-size="13" font-weight="500" fill="#334155">• Webhook IPN ngân hàng xác thực tức thì</text>
        <text x="0" y="124" class="mono" font-size="13" font-weight="800" fill="#059669">&#10003; Merchant Wallet Balance Sync</text>
      </g>
    </g>''')

    # Card 6: Read model & AI (x: 865, y: 860)
    lines.append('''    <!-- Card 6: Read Model & AI RAG -->
    <g transform="translate(865, 860)" class="node-shadow">
      <rect x="0" y="0" width="350" height="220" rx="9" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.8"/>
      <rect x="0" y="0" width="350" height="40" rx="9" fill="#FAF5FF" stroke="#7C3AED" stroke-width="1.8"/>
      <text x="18" y="27" font-size="16.5" font-weight="800" fill="#6D28D9">Read Model &amp; Phân hệ AI RAG</text>
      
      <g transform="translate(18, 56)">
        <text x="0" y="16" class="mono" font-size="14.5" font-weight="800" fill="#0F172A">tracking-service (:3008)</text>
        <text x="0" y="36" font-size="13" font-weight="500" fill="#334155">• Lịch sử hành trình AWB • Read cache &lt; 15ms</text>

        <text x="0" y="66" class="mono" font-size="14.5" font-weight="800" fill="#0F172A">reporting-service (:3009)</text>
        <text x="0" y="86" font-size="13" font-weight="500" fill="#334155">• Kho OLAP tổng hợp KPI hub, SLA, doanh số</text>

        <text x="0" y="116" class="mono" font-size="14.5" font-weight="800" fill="#7C3AED">chatbot-service (:3013)</text>
        <text x="0" y="136" font-size="13" font-weight="700" fill="#7C3AED">• Hybrid RAG 768-D + Google Gemini 2.5 API</text>
      </g>
    </g>''')
    lines.append('  </g>')

    # =========================================================================
    # EVENT BUS CONNECTOR: SERVICES ➔ RABBITMQ (y: 1100 to 1195, h: 95)
    # =========================================================================
    lines.append('''  <!-- Event Bus Connector -->
  <g id="Connector_Services_RabbitMQ">
    <line x1="660" y1="1100" x2="660" y2="1195" stroke="#EA580C" stroke-width="2.8" stroke-dasharray="6,4"/>
    <polygon points="653,1181 660,1196 667,1181" fill="#EA580C"/>
    <rect x="540" y="1133" width="240" height="34" rx="6" fill="#FFFFFF" stroke="#EA580C" stroke-width="1.6"/>
    <text x="660" y="1155" font-size="13" font-weight="800" fill="#EA580C" text-anchor="middle">publish / consume events</text>
  </g>''')

    # =========================================================================
    # RABBITMQ EVENT BUS (STANDALONE FLOATING NODE, WIDTH: 780, x: 270, y: 1195, h: 100)
    # =========================================================================
    rb_x = 270
    rb_y = 1195
    rb_w = 780
    rb_h = 100

    lines.append(f'''  <!-- RabbitMQ Event Bus Node -->
  <g id="RabbitMQ_Event_Bus" transform="translate({rb_x}, {rb_y})" class="hub-shadow">
    <rect x="0" y="0" width="{rb_w}" height="{rb_h}" rx="12" fill="#FFF7ED" stroke="#EA580C" stroke-width="2.4"/>
    <g transform="translate(20, 20)">{icon_rabbitmq()}</g>
    <text x="62" y="35" font-size="20" font-weight="900" fill="#C2410C">RabbitMQ - domain.events (AMQP :5672)</text>
    <text x="62" y="59" font-size="14.5" font-weight="500" fill="#9A3412">Đồng bộ bất đồng bộ qua Topic Exchange: nexus.logistics.topic</text>
    <text x="62" y="82" class="mono" font-size="12.5" font-weight="700" fill="#EA580C">Routing keys: shipment.*, pickup.*, manifest.*, delivery.*, cod.* • DLQ Quarantine</text>
  </g>''')

    # Up-arrow from RabbitMQ back up to Read Model / Projection (exits right side cleanly)
    lines.append('''  <!-- Projection Update Arrow (Event-driven CQRS Projection) -->
  <g id="Arrow_RabbitMQ_Projection">
    <path d="M 1050 1235 L 1095 1235 L 1095 1100 L 1040 1100 L 1040 1080" fill="none" stroke="#7C3AED" stroke-width="2.6" stroke-dasharray="6,4"/>
    <polygon points="1033,1093 1040,1078 1047,1093" fill="#7C3AED"/>
    <rect x="1038" y="1138" width="114" height="28" rx="5" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.4"/>
    <text x="1095" y="1157" class="mono" font-size="12.5" font-weight="800" fill="#7C3AED" text-anchor="middle">CQRS Sync</text>
  </g>''')

    # Direct database link from Core/Shipment down to PostgreSQL (Routed cleanly at x=220)
    lines.append('''  <!-- Direct Own Database Arrow -->
  <g id="Arrow_Services_PostgreSQL">
    <path d="M 220 1080 L 220 1410" fill="none" stroke="#0284C7" stroke-width="2.8"/>
    <polygon points="213,1396 220,1412 227,1396" fill="#0284C7"/>
    <rect x="156" y="1228" width="128" height="30" rx="5" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.4"/>
    <text x="220" y="1248" font-size="13" font-weight="800" fill="#0284C7" text-anchor="middle">own database</text>
  </g>''')

    # =========================================================================
    # TIER 3: POLYGLOT PERSISTENCE LAYER (OPEN FLOATING CYLINDERS, NO ENCLOSING BOX)
    # y: 1375 to 1630, Gap between RabbitMQ and Cylinders = 115px
    # =========================================================================
    lines.append('''  <!-- Tier 3: Polyglot Persistence Layer (Lớp dữ liệu và hạ tầng - Open Floating Cylinders) -->
  <g id="Tier_3_Persistence">
    <text x="660" y="1375" font-size="15.5" font-weight="800" fill="#475569" letter-spacing="1.5px" text-anchor="middle">LỚP DỮ LIỆU VÀ HẠ TẦNG PHÂN TÁN (POLYGLOT PERSISTENCE LAYER)</text>''')

    # 3 Database Cylinders (Floating freely with generous spacing):
    # Cylinder 1: PostgreSQL 16 (x: 115, y: 1410, w: 350, h: 220)
    cyl1 = draw_3d_cylinder(
        x=115, y=1410, w=350, h=220,
        title="PostgreSQL 16",
        subtitle="Database-per-service (11 DBs)",
        bullets=[
            "11 CSDL phân tán hoàn toàn độc lập",
            "Mỗi service sở hữu riêng schema & user",
            "Kết nối qua Prisma ORM (TCP:5432)"
        ],
        badge="✓ 100% Zero Cross-DB Joins",
        stroke_color="#0284C7",
        fill_top="#EFF6FF",
        fill_body="#FFFFFF"
    )
    lines.append(cyl1)

    # Cylinder 2: MinIO S3 (x: 490, y: 1410, w: 350, h: 220)
    cyl2 = draw_3d_cylinder(
        x=490, y=1410, w=350, h=220,
        title="MinIO / S3 Storage",
        subtitle="Object Storage (Port :9000)",
        bullets=[
            "Lưu ảnh chữ ký & ảnh giao hàng POD",
            "Ảnh hư hỏng & biên bản bất thường BBBT",
            "Xuất file Excel báo cáo đối soát COD"
        ],
        badge="Presigned URL: Hết hạn 15 phút",
        stroke_color="#D97706",
        fill_top="#FFFBEB",
        fill_body="#FFFFFF"
    )
    lines.append(cyl2)

    # Cylinder 3: Redis 7 (x: 865, y: 1410, w: 350, h: 220)
    cyl3 = draw_3d_cylinder(
        x=865, y=1410, w=350, h=220,
        title="Redis 7 + Docker",
        subtitle="In-Memory Cache (Port :6379)",
        bullets=[
            "Tracking cache (TTL 300s < 15ms)",
            "Token blacklist thu hồi phiên tức thì",
            "Sliding window rate limiting theo IP"
        ],
        badge="Pub/Sub Realtime GPS & WSS",
        stroke_color="#DC2626",
        fill_top="#FEF2F2",
        fill_body="#FFFFFF"
    )
    lines.append(cyl3)
    lines.append('  </g>')

    # =========================================================================
    # SIDE BYPASS HIGHWAYS (CLEANLY ROUTED OUTSIDE ALL BOUNDARIES)
    # =========================================================================
    # Left Bypass: Gateway to MinIO S3 (/media upload)
    # Routed outside down x = 45 to y = 1660, across to x = 665, up into MinIO bottom
    lines.append('''  <!-- Side Bypass Conduits -->
  <!-- Left Bypass: Gateway to MinIO S3 (/media upload) -->
  <path d="M 270 420 L 45 420 L 45 1660 L 665 1660 L 665 1630" fill="none" stroke="#D97706" stroke-width="2.4" stroke-dasharray="6,4"/>
  <polygon points="658,1644 665,1628 672,1644" fill="#D97706"/>
  <g transform="translate(24, 860) rotate(-90)">
    <rect x="-70" y="-15" width="140" height="30" rx="5" fill="#FFFFFF" stroke="#D97706" stroke-width="1.5"/>
    <text x="0" y="6" class="mono" font-size="13" font-weight="800" fill="#D97706" text-anchor="middle">/media</text>
  </g>

  <!-- Right Bypass: Gateway to Redis (chat/realtime) -->
  <path d="M 1050 420 L 1275 420 L 1275 1520 L 1215 1520" fill="none" stroke="#DC2626" stroke-width="2.4" stroke-dasharray="6,4"/>
  <polygon points="1229,1513 1213,1520 1229,1527" fill="#DC2626"/>
  <g transform="translate(1296, 860) rotate(90)">
    <rect x="-95" y="-15" width="190" height="30" rx="5" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5"/>
    <text x="0" y="6" class="mono" font-size="13" font-weight="800" fill="#DC2626" text-anchor="middle">chat / realtime</text>
  </g>''')

    # =========================================================================
    # TECHNICAL NOTE PLATE AT BOTTOM (y: 1690, h: 52, w: 1150, x: 85)
    # =========================================================================
    lines.append('''  <!-- Architectural Footnote -->
  <g id="Technical_Note" transform="translate(85, 1690)">
    <rect x="0" y="0" width="1150" height="52" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.4"/>
    <circle cx="26" cy="26" r="6" fill="#0284C7"/>
    <text x="46" y="31" font-size="13.5" font-weight="700" fill="#0F172A">Ghi chú kiến trúc: <tspan font-weight="500" fill="#334155">shipment-service sở hữu trạng thái đơn SOT; nhóm vận hành kiểm soát linehaul; tracking/reporting là CQRS read model; CSDL cách ly 100%.</tspan></text>
  </g>

</svg>''')

    svg_content = "\n".join(lines)

    # Sanitize any raw unescaped '&' and '<' characters
    svg_content = re.sub(r'&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[a-fA-F0-9]+);)', '&amp;', svg_content)

    return svg_content

def main():
    svg_content = build_architecture_diagram()

    # XML Validation
    try:
        ET.fromstring(svg_content)
        print("XML Syntax Validation: PASSED (Well-formed XML)")
    except ET.ParseError as e:
        print(f"XML Validation FAILED: {e}")
        return 1

    # Write to target files
    for file_path in OUTPUT_FILES:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"Successfully generated {file_path} ({len(svg_content.encode('utf-8'))} bytes)")

    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
