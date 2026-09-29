#!/usr/bin/env python3
"""
generate-chatbot-subsystem-architecture.py
Generates a human-engineered, expressive, and high-level architectural diagram for the Nexus AI Chatbot Subsystem.

Aesthetics:
  - Nexus LMS Brand Blue Palette:
    * Primary Brand Navy: #003D9B
    * Primary Container Blue: #0052CC
    * Vivid Tech Blue: #1D4ED8 / #2563EB
    * Soft Background Tint: #F0F7FF / #EFF6FF
    * High-contrast technical accents.
  - Standard System Engineering Geometric Symbols:
    * UML 2.0 Component Glyphs (rectangle with dual tabs) on all major components.
    * Formal UML Stereotypes («subsystem», «api controller», «security guardrail», «decision router», «orchestrator», «retrieval engine», «datastore», «foundation model»).
    * Architectural Ports (■ with port labels :3009, :3000, :3002, etc.) on the subsystem boundary.
    * Interface Lollipops (—(o with interface names IChatEndpoint, IToolDispatcher, IVectorSearch, ISSEStreamer).
    * Formal UML Decision Diamond with Guard Conditions [intent == "policy_rag"], [intent == "live_tool"], [intent == "hybrid"].
    * 3D Database Cylinder with magnetic disk platter rings.
    * Conveyor Buffer Queue for Sliding Window Memory.
  - 3-Column Macro Topology: Client Touchpoints (Left) -> Subsystem Boundary (Center) -> External Integrations (Right).
  - 7-Step Interactive Flow Badges (① -> ⑦) in Nexus Blue (#0052CC).
  - Strict Figma Compatibility: 100% native vector elements, ZERO <marker> tags.
"""

import xml.etree.ElementTree as ET
import os

OUTPUT_FILE = "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/04-architecture-ai-chatbot-subsystem.svg"

def uml_component_glyph(x, y):
    """Draws standard UML 2.0 component icon (box with 2 protruding tabs on left)"""
    return f'''
    <g transform="translate({x}, {y})">
      <rect x="0" y="0" width="16" height="12" rx="1.5" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.1"/>
      <rect x="-3.5" y="2" width="5" height="2.5" rx="0.5" fill="#EFF6FF" stroke="#0052CC" stroke-width="0.9"/>
      <rect x="-3.5" y="6.5" width="5" height="2.5" rx="0.5" fill="#EFF6FF" stroke="#0052CC" stroke-width="0.9"/>
    </g>'''

def interface_lollipop(x, y, label, direction="right"):
    """Draws standard UML provided interface lollipop —(o"""
    if direction == "right":
        return f'''
        <g transform="translate({x}, {y})">
          <line x1="0" y1="0" x2="16" y2="0" stroke="#0052CC" stroke-width="1.6"/>
          <circle cx="21" cy="0" r="5" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.6"/>
          <text x="30" y="3.5" font-size="10.5" font-weight="700" fill="#003D9B" font-family="ui-monospace, monospace">{label}</text>
        </g>'''
    elif direction == "left":
        return f'''
        <g transform="translate({x}, {y})">
          <line x1="0" y1="0" x2="-16" y2="0" stroke="#0052CC" stroke-width="1.6"/>
          <circle cx="-21" cy="0" r="5" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.6"/>
          <text x="-30" y="3.5" text-anchor="end" font-size="10.5" font-weight="700" fill="#003D9B" font-family="ui-monospace, monospace">{label}</text>
        </g>'''

def port_boundary_box(x, y, port_label, align="left"):
    """Draws architectural port square on system boundary with port number/spec"""
    text_x = x - 12 if align == "left" else x + 20
    anchor = "end" if align == "left" else "start"
    return f'''
    <g>
      <rect x="{x - 6}" y="{y - 6}" width="12" height="12" rx="2" fill="#0052CC" stroke="#FFFFFF" stroke-width="1.8"/>
      <text x="{text_x}" y="{y + 3.5}" text-anchor="{anchor}" font-size="10.5" font-weight="800" fill="#003D9B" font-family="ui-monospace, monospace">{port_label}</text>
    </g>'''

def step_badge(cx, cy, step_num, label=""):
    """Numbered flow circle badge in Nexus Brand Blue #0052CC"""
    svg = f'''
    <g transform="translate({cx}, {cy})">
      <circle cx="0" cy="0" r="13" fill="#0052CC" stroke="#FFFFFF" stroke-width="2"/>
      <text x="0" y="4.5" text-anchor="middle" font-size="11.5" font-weight="800" fill="#FFFFFF" font-family="monospace">{step_num}</text>'''
    if label:
        svg += f'''<text x="18" y="4" font-size="11" font-weight="700" fill="#003D9B" font-family="monospace">{label}</text>'''
    svg += '</g>'
    return svg

def build_architecture_svg():
    width = 3600
    height = 2050
    lines = []

    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # Double Blueprint Frame with subtle Nexus Navy accent
    lines.append(f'''
  <!-- Double Technical Blueprint Frame -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <rect x="20" y="20" width="{width - 40}" height="{height - 40}" fill="none" stroke="#003D9B" stroke-width="2.6"/>
  <rect x="32" y="32" width="{width - 64}" height="{height - 64}" fill="none" stroke="#0052CC" stroke-width="1.2"/>

  <style>
    text {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }}
    
    .hdr-title {{ font-size: 26px; font-weight: 800; fill: #003D9B; letter-spacing: -0.4px; }}
    .hdr-sub {{ font-size: 14.5px; font-weight: 500; fill: #475569; }}
    .meta-code {{ font-size: 12px; font-weight: 700; fill: #003D9B; font-family: ui-monospace, Menlo, monospace; }}
    
    .col-header {{ font-size: 14.5px; font-weight: 800; fill: #003D9B; letter-spacing: 0.8px; text-transform: uppercase; }}
    .col-tag {{ font-size: 11px; font-weight: 700; fill: #64748B; font-family: ui-monospace, monospace; }}
    
    .zone-title {{ font-size: 13.5px; font-weight: 800; fill: #003D9B; letter-spacing: 0.6px; text-transform: uppercase; }}
    .zone-tag {{ font-size: 11px; font-weight: 700; fill: #475569; font-family: ui-monospace, monospace; }}
    
    .stereotype {{ font-size: 10px; font-weight: 700; fill: #0052CC; font-family: ui-monospace, Menlo, monospace; text-transform: uppercase; }}
    
    .card-title {{ font-size: 14px; font-weight: 800; fill: #0F172A; letter-spacing: -0.2px; }}
    .card-sub {{ font-size: 11px; font-weight: 600; fill: #64748B; }}
    
    .chip-text {{ font-size: 11px; font-weight: 700; fill: #003D9B; font-family: ui-monospace, Menlo, monospace; }}
    .chip-code {{ font-size: 11px; font-weight: 600; fill: #0052CC; font-family: ui-monospace, monospace; }}
    .desc-text {{ font-size: 11.5px; font-weight: 500; fill: #334155; line-height: 1.4; }}
    .desc-bold {{ font-weight: 700; fill: #0F172A; }}
    
    .guard-cond {{ font-size: 10.5px; font-weight: 700; fill: #0052CC; font-family: ui-monospace, monospace; }}
    .bus-lbl {{ font-size: 11px; font-weight: 700; fill: #003D9B; font-family: ui-monospace, Menlo, monospace; text-transform: uppercase; }}
    
    .tb-label {{ font-size: 10px; font-weight: 700; fill: #64748B; font-family: ui-monospace, monospace; text-transform: uppercase; }}
    .tb-val {{ font-size: 12px; font-weight: 800; fill: #003D9B; font-family: ui-monospace, monospace; }}
  </style>
''')

    margin_x = 70
    content_w = width - margin_x * 2  # 3460px

    # =========================================================================
    # HEADER BAR (y: 45, h: 80)
    # =========================================================================
    lines.append(f'''
  <!-- HEADER BAR -->
  <g id="HeaderBar" transform="translate({margin_x}, 45)">
    <rect width="{content_w}" height="80" rx="4" fill="#F0F7FF" stroke="#0052CC" stroke-width="1.8"/>
    <rect x="0" y="0" width="8" height="80" rx="4" fill="#003D9B"/>
    
    <text x="28" y="34" class="hdr-title">HÌNH 1.4A: KIẾN TRÚC TỔNG THỂ PHÂN HỆ AI CHATBOT (NEXUS AI ASSISTANT OVERVIEW)</text>
    <text x="28" y="58" class="hdr-sub">Bản vẽ kiến trúc thành phần chuẩn UML/C4 và quy trình tương tác 7 bước: Kênh người dùng, Biên giới Subsystem NestJS, Lõi suy luận kép và Hạ tầng ngoại vi</text>
    
    <!-- Top-Right Badges in Nexus Brand Blue -->
    <g transform="translate({content_w - 740}, 20)">
      <rect width="230" height="38" rx="3" fill="#FFFFFF" stroke="#003D9B" stroke-width="1.4"/>
      <text x="115" y="24" text-anchor="middle" class="meta-code">HỆ THỐNG: NEXUS LMS</text>

      <rect x="245" y="0" width="240" height="38" rx="3" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.4"/>
      <text x="365" y="24" text-anchor="middle" class="meta-code">SUBSYSTEM: CHATBOT (:3009)</text>

      <rect x="500" y="0" width="230" height="38" rx="3" fill="#0052CC"/>
      <text x="615" y="24" text-anchor="middle" class="meta-code" fill="#FFFFFF">7-STEP ARCHITECTURE</text>
    </g>
  </g>
''')

    # =========================================================================
    # 3-COLUMN MACRO ARCHITECTURE LAYOUT
    # Left: Client Presentation (w: 520)
    # Center: Subsystem Boundary (w: 2000)
    # Right: External Integrations & Storage (w: 860)
    # Total w = 520 + 40 + 2000 + 40 + 860 = 3460px
    # =========================================================================
    main_y = 145
    main_h = 1705

    col1_x = margin_x
    col1_w = 520

    col2_x = col1_x + col1_w + 40  # 70 + 520 + 40 = 630
    col2_w = 2000

    col3_x = col2_x + col2_w + 40  # 630 + 2000 + 40 = 2670
    col3_w = content_w - (col1_w + col2_w + 80) # 860

    # =========================================================================
    # COLUMN 1: CLIENT PRESENTATION & TOUCHPOINTS
    # =========================================================================
    lines.append(f'''
  <!-- COLUMN 1: CLIENT PRESENTATION & USER TOUCHPOINTS -->
  <g id="Col_1_Clients" transform="translate({col1_x}, {main_y})">
    <rect width="{col1_w}" height="{main_h}" rx="6" fill="#FFFFFF" stroke="#003D9B" stroke-width="1.6"/>
    <rect width="{col1_w}" height="32" rx="6" fill="#F0F7FF" stroke="#0052CC" stroke-width="1"/>
    <text x="16" y="21" class="col-header">GIAO DIỆN &amp; KÊNH TƯƠNG TÁC</text>
    <text x="{col1_w - 16}" y="21" text-anchor="end" class="col-tag">«CLIENT PRESENTATION»</text>

    <!-- Client 1: Merchant Web Dashboard -->
    <g transform="translate(16, 50)">
      <rect width="{col1_w - 32}" height="145" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="14" y="20" class="stereotype">«Web Application»</text>
      {uml_component_glyph(col1_w - 60, 10)}
      
      <!-- Monitor Icon Vector in Nexus Blue -->
      <g transform="translate(14, 28)">
        <rect x="0" y="0" width="22" height="15" rx="1.5" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2"/>
        <line x1="11" y1="15" x2="11" y2="19" stroke="#0052CC" stroke-width="1.2"/>
        <line x1="6" y1="19" x2="16" y2="19" stroke="#0052CC" stroke-width="1.2"/>
      </g>
      <text x="46" y="38" class="card-title">Merchant Web Dashboard</text>
      <text x="46" y="54" class="card-sub">React 18 • Shop &amp; Người gửi thương mại</text>

      <g transform="translate(14, 65)">
        <rect width="115" height="20" rx="3" fill="#EFF6FF" stroke="#BFDBFE"/>
        <text x="57" y="14" text-anchor="middle" class="chip-text">Drawer Chat UI</text>
        
        <rect x="123" y="0" width="130" height="20" rx="3" fill="#EFF6FF" stroke="#BFDBFE"/>
        <text x="188" y="14" text-anchor="middle" class="chip-text">Thẻ Vận Đơn Live</text>
      </g>

      <g transform="translate(14, 98)">
        <text x="0" y="14" class="desc-text">• Tra cứu hành trình đơn bưu chính, cước nấc vượt.</text>
        <text x="0" y="32" class="desc-text">• Quản lý số dư ví COD và chính sách đền bù bưu gửi.</text>
      </g>
    </g>

    <!-- Client 2: Tracking Portal -->
    <g transform="translate(16, 215)">
      <rect width="{col1_w - 32}" height="145" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="14" y="20" class="stereotype">«Public Portal»</text>
      {uml_component_glyph(col1_w - 60, 10)}
      
      <!-- Browser Window Vector -->
      <g transform="translate(14, 28)">
        <rect x="0" y="0" width="22" height="17" rx="1.5" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2"/>
        <line x1="0" y1="5" x2="22" y2="5" stroke="#0052CC" stroke-width="1"/>
        <circle cx="4" cy="2.5" r="1" fill="#0052CC"/>
        <circle cx="8" cy="2.5" r="1" fill="#0052CC"/>
      </g>
      <text x="46" y="38" class="card-title">Customer Tracking Portal</text>
      <text x="46" y="54" class="card-sub">Public Web • Khách vãng lai &amp; Người nhận</text>

      <g transform="translate(14, 65)">
        <rect width="125" height="20" rx="3" fill="#EFF6FF" stroke="#BFDBFE"/>
        <text x="62" y="14" text-anchor="middle" class="chip-text">SSE Streaming</text>
        
        <rect x="133" y="0" width="120" height="20" rx="3" fill="#EFF6FF" stroke="#BFDBFE"/>
        <text x="193" y="14" text-anchor="middle" class="chip-text">Khử Dữ Liệu PII</text>
      </g>

      <g transform="translate(14, 98)">
        <text x="0" y="14" class="desc-text">• Tra cứu hành trình công khai không cần đăng nhập.</text>
        <text x="0" y="32" class="desc-text">• Trả lời chính sách giao nhận và hỗ trợ tự động 24/7.</text>
      </g>
    </g>

    <!-- Client 3: Driver Courier Mobile App -->
    <g transform="translate(16, 380)">
      <rect width="{col1_w - 32}" height="145" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="14" y="20" class="stereotype">«Mobile App»</text>
      {uml_component_glyph(col1_w - 60, 10)}
      
      <!-- Mobile Phone Vector -->
      <g transform="translate(16, 28)">
        <rect x="0" y="0" width="14" height="21" rx="2" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2"/>
        <line x1="4" y1="2" x2="10" y2="2" stroke="#0052CC" stroke-width="1"/>
        <circle cx="7" cy="18" r="1" fill="#0052CC"/>
      </g>
      <text x="46" y="38" class="card-title">Driver Courier Mobile App</text>
      <text x="46" y="54" class="card-sub">React Native • Bưu tá phát hàng &amp; Tài xế</text>

      <g transform="translate(14, 65)">
        <rect width="115" height="20" rx="3" fill="#EFF6FF" stroke="#BFDBFE"/>
        <text x="57" y="14" text-anchor="middle" class="chip-text">Tuyến Phát Hàng</text>
        
        <rect x="123" y="0" width="130" height="20" rx="3" fill="#EFF6FF" stroke="#BFDBFE"/>
        <text x="188" y="14" text-anchor="middle" class="chip-text">Biên Bản Sự Cố</text>
      </g>

      <g transform="translate(14, 98)">
        <text x="0" y="14" class="desc-text">• Hướng dẫn bưu tá xử lý đồng kiểm, chụp ảnh móp vỡ.</text>
        <text x="0" y="32" class="desc-text">• Chỉ dẫn quy chuẩn giao nhận ngoại thành và liên tỉnh.</text>
      </g>
    </g>

    <!-- Client 4: Operations & Admin Console -->
    <g transform="translate(16, 545)">
      <rect width="{col1_w - 32}" height="145" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2"/>
      <text x="14" y="20" class="stereotype">«Admin Console»</text>
      {uml_component_glyph(col1_w - 60, 10)}
      
      <!-- Hub Vector -->
      <g transform="translate(14, 28)">
        <rect x="0" y="0" width="22" height="7" rx="1" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2"/>
        <rect x="0" y="9" width="22" height="7" rx="1" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2"/>
        <circle cx="4" cy="3.5" r="0.8" fill="#0052CC"/>
        <circle cx="4" cy="12.5" r="0.8" fill="#0052CC"/>
      </g>
      <text x="46" y="38" class="card-title">Operations &amp; CSKH Console</text>
      <text x="46" y="54" class="card-sub">Next.js • Điều hành trung tâm &amp; Chuyên viên CSKH</text>

      <g transform="translate(14, 65)">
        <rect width="130" height="20" rx="3" fill="#EFF6FF" stroke="#BFDBFE"/>
        <text x="65" y="14" text-anchor="middle" class="chip-text">Chuyển Giao CSKH</text>
        
        <rect x="138" y="0" width="115" height="20" rx="3" fill="#EFF6FF" stroke="#BFDBFE"/>
        <text x="195" y="14" text-anchor="middle" class="chip-text">Nạp Tri Thức SOP</text>
      </g>

      <g transform="translate(14, 98)">
        <text x="0" y="14" class="desc-text">• Tiếp nhận phiên trò chuyện chuyển tiếp từ AI Chatbot.</text>
        <text x="0" y="32" class="desc-text">• Kích hoạt nạp lại tri thức SOP và giám sát chất lượng.</text>
      </g>
    </g>

    <!-- Client Communication Protocol Box -->
    <g transform="translate(16, 715)">
      <rect width="{col1_w - 32}" height="280" rx="4" fill="#F0F7FF" stroke="#0052CC" stroke-width="1.2"/>
      <rect width="{col1_w - 32}" height="26" rx="4" fill="#003D9B"/>
      <text x="14" y="18" class="card-title" font-size="12" fill="#FFFFFF">GIAO THỨC TRUYỀN THÔNG CLIENT-SERVER</text>

      <g transform="translate(14, 40)">
        <text x="0" y="14" class="desc-bold" fill="#003D9B">1. REST JSON Message Endpoint:</text>
        <rect x="0" y="22" width="{col1_w - 60}" height="24" rx="2" fill="#FFFFFF" stroke="#93C5FD"/>
        <text x="10" y="38" class="chip-code">POST /api/v1/chat/message</text>

        <text x="0" y="74" class="desc-bold" fill="#003D9B">2. Server-Sent Events (SSE) Stream:</text>
        <rect x="0" y="82" width="{col1_w - 60}" height="24" rx="2" fill="#FFFFFF" stroke="#93C5FD"/>
        <text x="10" y="98" class="chip-code">POST /api/v1/chat/stream</text>

        <text x="0" y="134" class="desc-bold" fill="#003D9B">3. Admin Knowledge Ingestion Trigger:</text>
        <rect x="0" y="142" width="{col1_w - 60}" height="24" rx="2" fill="#FFFFFF" stroke="#93C5FD"/>
        <text x="10" y="158" class="chip-code">POST /api/v1/chat/ingest</text>

        <text x="0" y="194" class="desc-bold" fill="#003D9B">4. Health &amp; Readiness Probe:</text>
        <rect x="0" y="202" width="{col1_w - 60}" height="24" rx="2" fill="#FFFFFF" stroke="#93C5FD"/>
        <text x="10" y="218" class="chip-code">GET  /api/v1/chat/health</text>
      </g>
    </g>

    <!-- Client Architecture Specification Box -->
    <g transform="translate(16, 1020)">
      <rect width="{col1_w - 32}" height="660" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
      <rect width="{col1_w - 32}" height="26" rx="4" fill="#EFF6FF" stroke="#0052CC" stroke-width="1"/>
      <text x="14" y="18" class="card-title" font-size="12" fill="#003D9B">ĐẶC TẢ TƯƠNG TÁC NGƯỜI DÙNG</text>

      <g transform="translate(14, 42)">
        <text x="0" y="14" class="desc-bold">• Cơ chế đàm thoại tức thời:</text>
        <text x="10" y="34" class="desc-text">- Hỗ trợ nhập liệu tự nhiên, không ép khuôn mẫu.</text>
        <text x="10" y="52" class="desc-text">- Tự động bắt mã vận đơn dạng NX-XXXX, 101XXXXXXXXX.</text>
        
        <text x="0" y="86" class="desc-bold">• Hiển thị thẻ giao diện động (Dynamic UI):</text>
        <text x="10" y="106" class="desc-text">- Thẻ bưu gửi (ShipmentCard) kèm thanh tiến trình.</text>
        <text x="10" y="124" class="desc-text">- Bảng cước vận chuyển kèm phụ phí vùng sâu vùng xa.</text>
        <text x="10" y="142" class="desc-text">- Nút bấm hành động nhanh: Tạo khiếu nại, Gặp CSKH.</text>

        <text x="0" y="176" class="desc-bold">• Trải nghiệm truyền phát (Typing Experience):</text>
        <text x="10" y="196" class="desc-text">- SSE đẩy từng token chữ mô phỏng gõ phím trực tiếp.</text>
        <text x="10" y="214" class="desc-text">- Giảm thiểu thời gian chờ cảm nhận (Perceived Latency).</text>

        <text x="0" y="248" class="desc-bold">• Khử rủi ro rò rỉ dữ liệu người nhận:</text>
        <text x="10" y="268" class="desc-text">- Khách vãng lai chỉ xem trạng thái rút gọn.</text>
        <text x="10" y="286" class="desc-text">- Ẩn thông tin số điện thoại người nhận (098****321).</text>

        <!-- Visual Flow Guide Badge 1 -->
        <g transform="translate(10, 340)">
          <rect width="{col1_w - 80}" height="64" rx="3" fill="#F0F7FF" stroke="#0052CC" stroke-width="1.4"/>
          {step_badge(24, 32, "1", "")}
          <text x="46" y="26" font-size="12" font-weight="800" fill="#003D9B">BƯỚC 1: PHÁT LỆNH TRUY VẤN</text>
          <text x="46" y="46" font-size="11" font-weight="500" fill="#475569">Gửi câu hỏi tự nhiên qua HTTP REST / SSE Stream</text>
        </g>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTOR COL 1 -> COL 2 WITH FLOW STEP ① AND ⑦
    # =========================================================================
    lines.append(f'''
  <!-- CONNECTOR COL 1 -> COL 2 (STEP 1 & 7) -->
  <g id="Connector_Col1_Col2">
    <!-- Flow Arrow 1: User Request in Nexus Blue -->
    <path d="M {col1_x + col1_w} 280 L {col2_x} 280" fill="none" stroke="#0052CC" stroke-width="2.4"/>
    <polygon points="{col2_x - 9},275 {col2_x},280 {col2_x - 9},285" fill="#0052CC"/>
    
    <!-- Flow Badge 1 -->
    {step_badge((col1_x + col1_w + col2_x) // 2, 260, "1", "")}

    <!-- Flow Arrow 7 (Return SSE Stream): Back to Client -->
    <path d="M {col2_x} 1750 L {col1_x + col1_w} 1750" fill="none" stroke="#0052CC" stroke-width="2.4" stroke-dasharray="6,4"/>
    <polygon points="{col1_x + col1_w + 9},1745 {col1_x + col1_w},1750 {col1_x + col1_w + 9},1755" fill="#0052CC"/>
    
    <!-- Flow Badge 7 -->
    {step_badge((col1_x + col1_w + col2_x) // 2, 1770, "7", "")}
  </g>
''')

    # =========================================================================
    # COLUMN 2: AI CHATBOT SUBSYSTEM (:3009) [NESTJS BOUNDARY]
    # =========================================================================
    lines.append(f'''
  <!-- COLUMN 2: AI CHATBOT SUBSYSTEM (:3009) - NESTJS MICROSERVICE BOUNDARY -->
  <g id="Col_2_Subsystem" transform="translate({col2_x}, {main_y})">
    <!-- Grand Subsystem Boundary in Nexus Navy -->
    <rect width="{col2_w}" height="{main_h}" rx="6" fill="#FFFFFF" stroke="#003D9B" stroke-width="2.4"/>
    <rect width="{col2_w}" height="32" rx="6" fill="#003D9B" stroke="#003D9B" stroke-width="1"/>
    <text x="16" y="21" class="col-header" fill="#FFFFFF">«SUBSYSTEM» PHÂN HỆ TRỢ LÝ AI CHATBOT (SERVICES/CHATBOT-SERVICE :3009)</text>
    <text x="{col2_w - 16}" y="21" text-anchor="end" class="col-tag" fill="#DAE2FF">NESTJS • HEXAGONAL ARCHITECTURE • IN-MEMORY RAG</text>

    <!-- Boundary Ports (■ Geometric Symbol) -->
    {port_boundary_box(0, 135, ":3009 [REST/SSE INGRESS]", "left")}
    {port_boundary_box(col2_w, 315, "[HTTP PROXY :3000]", "right")}
    {port_boundary_box(col2_w, 905, "[IN-MEMORY BUS]", "right")}
    {port_boundary_box(col2_w, 1275, "[HTTPS TLS 1.3]", "right")}
    {port_boundary_box(0, 1605, "[SSE OUT STREAM]", "left")}

    <!-- TIER A: INGRESS, SECURITY & SESSION MANAGEMENT (h: 220) -->
    <g id="Sub_Tier_A" transform="translate(16, 48)">
      <rect width="{col2_w - 32}" height="225" rx="4" fill="#F0F7FF" stroke="#BFDBFE" stroke-width="1.4"/>
      <rect width="{col2_w - 32}" height="26" rx="4" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
      <rect x="0" y="0" width="5" height="26" fill="#0052CC"/>
      <text x="14" y="18" class="zone-title">A. CỔNG TIẾP NHẬN, ĐIỀU KHIỂN &amp; HÀNG RÀO BẢO VỆ DỮ LIỆU CÁ NHÂN (SECURITY &amp; ADMISSION)</text>
      <text x="{col2_w - 46}" y="18" text-anchor="end" class="zone-tag">NGHỊ ĐỊNH 13/2023/NĐ-CP • ĐIỀU 25 LUẬT BƯU CHÍNH</text>

      <!-- Box A1: API Controller (w: 620) -->
      <g transform="translate(14, 38)">
        <rect width="620" height="170" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
        <text x="14" y="20" class="stereotype">«REST / SSE Controller»</text>
        {uml_component_glyph(585, 10)}
        {interface_lollipop(450, 20, "IChatEndpoint", "right")}
        
        <text x="14" y="38" class="card-title">Chatbot API Controller</text>
        <text x="14" y="52" class="card-sub">NestJS @Controller('api/v1/chat') • HTTP Rest &amp; SSE</text>

        <g transform="translate(14, 66)">
          <text x="0" y="14" class="desc-text">• <tspan class="desc-bold">POST /message:</tspan> Tiếp nhận ChatRequestDto ➔ JSON ChatResponseDto.</text>
          <text x="0" y="34" class="desc-text">• <tspan class="desc-bold">POST /stream:</tspan> Server-Sent Events (SSE) phát token thời gian thực.</text>
          <text x="0" y="54" class="desc-text">• <tspan class="desc-bold">Rate Limiting:</tspan> Chặn Spam 60 req/phút • Lọc khoảng trắng &amp; DTO Validation.</text>
          <text x="0" y="74" class="desc-text">• <tspan class="desc-bold">Mô hình phân luồng:</tspan> Định tuyến thông minh theo quyền RBAC người gọi.</text>
        </g>
      </g>

      <!-- Box A2: PII Sanitizer & Masking (w: 660) -->
      <g transform="translate(650, 38)">
        <rect width="660" height="170" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
        <text x="36" y="20" class="stereotype">«Security Guardrail»</text>
        {uml_component_glyph(625, 10)}
        
        <!-- Shield Vector in Nexus Blue -->
        <g transform="translate(14, 10)">
          <path d="M 0,0 L 14,0 L 14,8 C 14,13 7,16 7,16 C 7,16 0,13 0,8 Z" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.4"/>
        </g>
        <text x="36" y="38" class="card-title">Hàng Rào Bảo Vệ PII (Sanitizer Guardrail)</text>
        
        <!-- Masking Pill -->
        <g transform="translate(420, 32)">
          <rect width="225" height="24" rx="3" fill="#FEF2F2" stroke="#EF4444" stroke-width="1"/>
          <text x="112" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="#991B1B" font-family="monospace">0987654321 ➔ 098****321</text>
        </g>

        <g transform="translate(14, 66)">
          <text x="0" y="14" class="desc-text">• <tspan class="desc-bold">Khử định danh tự động:</tspan> Che số điện thoại, địa chỉ nhận đối với khách vãng lai.</text>
          <text x="0" y="34" class="desc-text">• <tspan class="desc-bold">Phân quyền RBAC:</tspan> Phân tách nghiêm ngặt quyền giữa GUEST vs SHOP/ADMIN.</text>
          <text x="0" y="54" class="desc-text">• <tspan class="desc-bold">Phòng vệ tiêm lệnh:</tspan> Chống tấn công Prompt Injection, bảo vệ an toàn tiền COD.</text>
          <text x="0" y="74" class="desc-text">• <tspan class="desc-bold">Chuẩn hóa dữ liệu:</tspan> Loại bỏ ký tự độc hại trước khi chuyển xuống tầng NLU.</text>
        </g>
      </g>

      <!-- Box A3: Session Memory Manager (w: 615) -->
      <g transform="translate(1325, 38)">
        <rect width="625" height="170" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
        <text x="14" y="20" class="stereotype">«State &amp; Context Buffer»</text>
        {uml_component_glyph(590, 10)}
        
        <text x="14" y="38" class="card-title">Quản Lý Phiên &amp; Ngữ Cảnh (Session Memory)</text>
        
        <!-- Sliding Window Conveyor Slots -->
        <g transform="translate(390, 32)">
          <rect width="32" height="22" rx="2" fill="#EFF6FF" stroke="#93C5FD"/>
          <text x="16" y="15" text-anchor="middle" font-size="10" font-family="monospace" fill="#003D9B">T-5</text>
          <rect x="35" y="0" width="32" height="22" rx="2" fill="#EFF6FF" stroke="#93C5FD"/>
          <text x="51" y="15" text-anchor="middle" font-size="10" font-family="monospace" fill="#003D9B">T-4</text>
          <rect x="70" y="0" width="32" height="22" rx="2" fill="#EFF6FF" stroke="#93C5FD"/>
          <text x="86" y="15" text-anchor="middle" font-size="10" font-family="monospace" fill="#003D9B">T-3</text>
          <rect x="105" y="0" width="32" height="22" rx="2" fill="#EFF6FF" stroke="#93C5FD"/>
          <text x="121" y="15" text-anchor="middle" font-size="10" font-family="monospace" fill="#003D9B">T-2</text>
          <rect x="140" y="0" width="32" height="22" rx="2" fill="#DBEAFE" stroke="#2563EB"/>
          <text x="156" y="15" text-anchor="middle" font-size="10" font-family="monospace" fill="#003D9B">T-1</text>
          <rect x="175" y="0" width="45" height="22" rx="2" fill="#0052CC"/>
          <text x="197" y="15" text-anchor="middle" font-size="10" font-weight="700" fill="#FFFFFF" font-family="monospace">NOW</text>
        </g>

        <g transform="translate(14, 66)">
          <text x="0" y="14" class="desc-text">• <tspan class="desc-bold">Cửa sổ trượt (K=6 lượt):</tspan> Duy trì mạch đàm thoại liên tục, hiểu đại từ thay thế.</text>
          <text x="0" y="34" class="desc-text">• <tspan class="desc-bold">Truy vết thực thể:</tspan> Tự động ghi nhớ mã vận đơn đã nhắc để tiếp tục tra cứu.</text>
          <text x="0" y="54" class="desc-text">• <tspan class="desc-bold">Vòng đời bộ nhớ:</tspan> Tự hủy sau 30 phút không hoạt động (TTL) • Đo độ trễ latencyMs.</text>
          <text x="0" y="74" class="desc-text">• <tspan class="desc-bold">Đồng bộ đa kênh:</tspan> Hỗ trợ tiếp tục phiên hội thoại giữa Web và Mobile.</text>
        </g>
      </g>
    </g>

    <!-- Connector Tier A -> Tier B with Step Badge ② in Nexus Blue -->
    <g transform="translate(0, 280)">
      <line x1="{col2_w // 2}" y1="0" x2="{col2_w // 2}" y2="35" stroke="#0052CC" stroke-width="2.2"/>
      <polygon points="{col2_w // 2 - 6},25 {col2_w // 2},35 {col2_w // 2 + 6},25" fill="#0052CC"/>
      {step_badge(col2_w // 2 - 280, 18, "2", "KHỬ PII, LÀM SẠCH VÀ GẮN KẾT NGỮ CẢNH PHIÊN")}
    </g>

    <!-- TIER B: COGNITIVE REASONING & TOOLS ORCHESTRATION (h: 530) -->
    <g id="Sub_Tier_B" transform="translate(16, 320)">
      <rect width="{col2_w - 32}" height="535" rx="4" fill="#F0F7FF" stroke="#BFDBFE" stroke-width="1.4"/>
      <rect width="{col2_w - 32}" height="26" rx="4" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
      <rect x="0" y="0" width="5" height="26" fill="#0052CC"/>
      <text x="14" y="18" class="zone-title">B. LÕI SUY LUẬN, PHÂN TÍCH Ý ĐỊNH &amp; ĐIỀU PHỐI TÁC VỤ (COGNITIVE &amp; ORCHESTRATION ENGINE)</text>
      <text x="{col2_w - 46}" y="18" text-anchor="end" class="zone-tag">services/chatbot-service/src/chat/ • tools/ • rag/</text>

      <!-- Sub-block B1: Intent Classifier & Decision Diamond (w: 920) -->
      <g transform="translate(14, 38)">
        <rect width="920" height="480" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
        <text x="14" y="20" class="stereotype">«Decision &amp; NLU Router»</text>
        {uml_component_glyph(885, 10)}

        <text x="14" y="38" class="card-title">1. Phân Tích Câu Hỏi &amp; Rẽ Nhánh Ý Định (NLU Router)</text>
        <text x="14" y="52" class="card-sub">Unicode NFC Normalizer • Regex Entity Extractor</text>

        <g transform="translate(14, 66)">
          <text x="0" y="14" class="desc-text">• <tspan class="desc-bold">Chuẩn hóa tiếng Việt:</tspan> Bóc tách dấu câu, chuẩn hóa từ viết tắt bưu chính.</text>
          <text x="0" y="34" class="desc-text">• <tspan class="desc-bold">Trích xuất thực thể Regex:</tspan> Tự bắt mã <tspan class="chip-code">NX-XXXX</tspan>, <tspan class="chip-code">101XXXXXXXXX</tspan>, khối lượng, kích thước.</text>
        </g>

        <!-- Visual Decision Diamond (UML Decision Node với Guard Conditions) -->
        <g transform="translate(460, 235)">
          <polygon points="0,-48 140,0 0,48 -140,0" fill="#F0F7FF" stroke="#0052CC" stroke-width="2.2"/>
          <text x="0" y="-8" text-anchor="middle" font-size="12" font-weight="800" fill="#003D9B">PHÂN LOẠI Ý ĐỊNH</text>
          <text x="0" y="10" text-anchor="middle" font-size="10.5" font-family="monospace" fill="#0052CC">(Dual-Engine Intent)</text>
          
          <!-- Left Exit: RAG Policy -->
          <line x1="-140" y1="0" x2="-230" y2="0" stroke="#0052CC" stroke-width="2"/>
          <polygon points="-220,-5 -230,0 -220,5" fill="#0052CC"/>
          <rect x="-420" y="-24" width="180" height="48" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
          <text x="-330" y="-8" text-anchor="middle" class="guard-cond">[intent == "policy_sop"]</text>
          <text x="-330" y="8" text-anchor="middle" font-size="11.5" font-weight="800" fill="#003D9B">Ý ĐỊNH TRI THỨC</text>
          <text x="-330" y="20" text-anchor="middle" font-size="9.5" font-family="monospace" fill="#64748B">Kích hoạt RAG SOP</text>

          <!-- Right Exit: Live Action -->
          <line x1="140" y1="0" x2="230" y2="0" stroke="#0052CC" stroke-width="2"/>
          <polygon points="220,-5 230,0 220,5" fill="#0052CC"/>
          <rect x="240" y="-24" width="180" height="48" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.4"/>
          <text x="330" y="-8" text-anchor="middle" class="guard-cond">[intent == "live_tool"]</text>
          <text x="330" y="8" text-anchor="middle" font-size="11.5" font-weight="800" fill="#003D9B">Ý ĐỊNH TÁC VỤ</text>
          <text x="330" y="20" text-anchor="middle" font-size="9.5" font-family="monospace" fill="#64748B">Gọi Live Tools</text>

          <!-- Bottom Exit: Hybrid -->
          <line x1="0" y1="48" x2="0" y2="105" stroke="#0052CC" stroke-width="2"/>
          <polygon points="-5,97 0,107 5,97" fill="#0052CC"/>
          <rect x="-120" y="110" width="240" height="38" rx="3" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.4"/>
          <text x="0" y="125" text-anchor="middle" class="guard-cond">[intent == "hybrid_rag_tool"]</text>
          <text x="0" y="141" text-anchor="middle" font-size="11.5" font-weight="800" fill="#003D9B">HỖN HỢP: GỘP RAG + TOOL</text>
        </g>

        <!-- Step 3 Badge -->
        <g transform="translate(14, 435)">
          <rect width="892" height="32" rx="3" fill="#F0F7FF" stroke="#BFDBFE"/>
          {step_badge(20, 16, "3", "BƯỚC 3: PHÂN LOẠI Ý ĐỊNH")}
          <text x="220" y="20" font-size="11" fill="#475569">• Rẽ nhánh truy vấn chính sách bưu chính (RAG) hoặc gọi công cụ thời gian thực (Tools)</text>
        </g>
      </g>

      <!-- Sub-block B2: Logistics Tools Orchestrator (w: 1000) -->
      <g transform="translate(950, 38)">
        <rect width="1000" height="480" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
        <text x="14" y="20" class="stereotype">«Tool Orchestration Engine»</text>
        {uml_component_glyph(965, 10)}
        {interface_lollipop(830, 20, "IToolDispatcher", "right")}

        <text x="14" y="38" class="card-title">2. Dịch Vụ Điều Phối Công Cụ Thời Gian Thực (Tools Orchestrator)</text>
        <text x="14" y="52" class="card-sub">Dynamic Function Calling • Microservices Proxy &amp; Circuit Breaker</text>

        <!-- 4 Modular Tool Cards -->
        <g transform="translate(14, 60)">
          <!-- Tool 1: Tracking -->
          <g transform="translate(0, 0)">
            <rect width="475" height="110" rx="3" fill="#F0F7FF" stroke="#BFDBFE" stroke-width="1.2"/>
            <text x="12" y="22" class="card-title" font-size="12.5" fill="#003D9B">trackShipment(trackingCode)</text>
            <text x="12" y="42" class="desc-text">Tra cứu hành trình bưu gửi thời gian thực, bưu tá phát.</text>
            <text x="12" y="62" class="desc-text"><tspan class="desc-bold">Kết nối:</tspan> ShipmentService (:3002) qua API Gateway.</text>
            <text x="12" y="82" class="desc-text"><tspan class="desc-bold">Đầu ra:</tspan> Thẻ vận đơn UI (ShipmentCard) trạng thái live.</text>
          </g>

          <!-- Tool 2: Fee -->
          <g transform="translate(495, 0)">
            <rect width="475" height="110" rx="3" fill="#F0F7FF" stroke="#BFDBFE" stroke-width="1.2"/>
            <text x="12" y="22" class="card-title" font-size="12.5" fill="#003D9B">calculateShippingFee(origin, dest, w, v)</text>
            <text x="12" y="42" class="desc-text">Quy đổi thể tích chuẩn IATA <tspan class="chip-code">vw=(D×R×C)/5000</tspan>.</text>
            <text x="12" y="62" class="desc-text"><tspan class="desc-bold">Kết nối:</tspan> PricingService (:3003) bảng cước bưu chính.</text>
            <text x="12" y="82" class="desc-text"><tspan class="desc-bold">Đầu ra:</tspan> Báo giá cước tiêu chuẩn / hỏa tốc và phụ phí.</text>
          </g>

          <!-- Tool 3: Incident -->
          <g transform="translate(0, 125)">
            <rect width="475" height="110" rx="3" fill="#F0F7FF" stroke="#BFDBFE" stroke-width="1.2"/>
            <text x="12" y="22" class="card-title" font-size="12.5" fill="#003D9B">reportIncident(orderId, reason, damage)</text>
            <text x="12" y="42" class="desc-text">Khởi tạo vé sự cố <tspan class="chip-code">CLM</tspan>, chỉ dẫn bưu tá chụp ảnh 4 góc.</text>
            <text x="12" y="62" class="desc-text"><tspan class="desc-bold">Kết nối:</tspan> IncidentService (:3008) quản lý hồ sơ bồi thường.</text>
            <text x="12" y="82" class="desc-text"><tspan class="desc-bold">Đầu ra:</tspan> Mã biên bản sự cố và hạn mức đền bù tối đa.</text>
          </g>

          <!-- Tool 4: Storage & Handover -->
          <g transform="translate(495, 125)">
            <rect width="475" height="110" rx="3" fill="#F0F7FF" stroke="#BFDBFE" stroke-width="1.2"/>
            <text x="12" y="22" class="card-title" font-size="12.5" fill="#003D9B">checkStorageAging() &amp; handoverToAgent()</text>
            <text x="12" y="42" class="desc-text">Kiểm tra tuổi thọ tồn kho SOC Điều 18 &amp; 28 Luật Bưu chính.</text>
            <text x="12" y="62" class="desc-text"><tspan class="desc-bold">Kết nối:</tspan> HubService (:3004) &amp; Hàng đợi CSKH.</text>
            <text x="12" y="82" class="desc-text"><tspan class="desc-bold">Đầu ra:</tspan> Cảnh báo hàng quá hạn hoặc đẩy vào queue hỗ trợ.</text>
          </g>
        </g>

        <!-- Tool Execution Resilience Note -->
        <g transform="translate(14, 320)">
          <rect width="970" height="42" rx="3" fill="#FFFFFF" stroke="#93C5FD" stroke-width="1.2"/>
          <text x="14" y="26" class="desc-text"><tspan class="desc-bold">• Khả năng chịu lỗi (Circuit Breaker):</tspan> Giới hạn chờ 2000ms; khi microservice quá tải, tự động phản hồi hướng dẫn thay vì báo lỗi hệ thống.</text>
        </g>

        <!-- Step 4b Flow Guide -->
        <g transform="translate(14, 435)">
          <rect width="970" height="32" rx="3" fill="#F0F7FF" stroke="#BFDBFE"/>
          {step_badge(20, 16, "4b", "BƯỚC 4b: GỌI MICROSERVICES")}
          <text x="235" y="20" font-size="11" fill="#475569">• Gọi HTTP REST JSON sang Lưới Microservices nội bộ (:3000 API Gateway)</text>
        </g>
      </g>
    </g>

    <!-- Connector Tier B -> Tier C with Step Badge ⑤ in Nexus Blue -->
    <g transform="translate(0, 865)">
      <line x1="{col2_w // 2}" y1="0" x2="{col2_w // 2}" y2="35" stroke="#0052CC" stroke-width="2.2"/>
      <polygon points="{col2_w // 2 - 6},25 {col2_w // 2},35 {col2_w // 2 + 6},25" fill="#0052CC"/>
      {step_badge(col2_w // 2 - 310, 18, "5", "GHÉP PROMPT ĐA TẦNG VỚI TRI THỨC VÀ DỮ LIỆU ĐỘNG")}
    </g>

    <!-- TIER C: RAG RETRIEVAL & PROMPT CONTEXT ASSEMBLER (h: 530) -->
    <g id="Sub_Tier_C" transform="translate(16, 910)">
      <rect width="{col2_w - 32}" height="535" rx="4" fill="#F0F7FF" stroke="#BFDBFE" stroke-width="1.4"/>
      <rect width="{col2_w - 32}" height="26" rx="4" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
      <rect x="0" y="0" width="5" height="26" fill="#0052CC"/>
      <text x="14" y="18" class="zone-title">C. BỘ MÁY TRUY VẤN TRI THỨC VÉC-TƠ &amp; LẮP RÁP NGỮ CẢNH (RAG &amp; PROMPT ASSEMBLER)</text>
      <text x="{col2_w - 46}" y="18" text-anchor="end" class="zone-tag">HYBRID SCORING • TOP-5 RERANKING • CONTEXT SANDWICH</text>

      <!-- Sub-block C1: RAG Retrieval Engine (w: 920) -->
      <g transform="translate(14, 38)">
        <rect width="920" height="480" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
        <text x="14" y="20" class="stereotype">«Hybrid Retrieval Engine»</text>
        {uml_component_glyph(885, 10)}
        {interface_lollipop(760, 20, "IVectorSearch", "right")}

        <text x="14" y="38" class="card-title">1. Bộ Máy Truy Vấn Tri Thức Véc-Tơ &amp; Tìm Kiếm Lai (RAG Engine)</text>
        <text x="14" y="52" class="card-sub">Cosine Similarity Dot-Product • In-Memory Cache &lt; 5ms</text>

        <g transform="translate(14, 66)">
          <text x="0" y="14" class="desc-text">• <tspan class="desc-bold">Công thức tính điểm lai (Hybrid Score):</tspan></text>
          
          <rect x="0" y="26" width="892" height="40" rx="3" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2"/>
          <text x="446" y="51" text-anchor="middle" font-size="13" font-weight="800" font-family="monospace" fill="#003D9B">Score = 0.70 × CosineSimilarity + 0.35 × KeywordMatch</text>

          <g transform="translate(0, 85)">
            <text x="0" y="14" class="desc-text">• <tspan class="desc-bold">Từ điển Logistics chuyên ngành:</tspan> Tự động mở rộng từ đồng nghĩa: hỏng, móp, vỡ, đền bù.</text>
            <text x="0" y="34" class="desc-text">• <tspan class="desc-bold">Lọc ngưỡng tương đồng:</tspan> Cắt bỏ hoàn toàn các đoạn trích có <tspan class="desc-bold">Sim &lt; 0.58</tspan>.</text>
            <text x="0" y="54" class="desc-text">• <tspan class="desc-bold">Chiến lược Re-ranking:</tspan> Sắp xếp lấy Top K=5 đoạn trích có điểm lai cao nhất.</text>
            <text x="0" y="74" class="desc-text">• <tspan class="desc-bold">Chống tràn ngữ cảnh:</tspan> Giới hạn tối đa 2 chunks trích xuất từ cùng một văn bản SOP.</text>
            <text x="0" y="94" class="desc-text">• <tspan class="desc-bold">Bảo toàn tham chiếu:</tspan> Giữ nguyên số thứ tự Điều, Khoản bưu chính để LLM trích dẫn.</text>
          </g>
        </g>

        <!-- Step 4a Flow Guide -->
        <g transform="translate(14, 435)">
          <rect width="892" height="32" rx="3" fill="#F0F7FF" stroke="#BFDBFE"/>
          {step_badge(20, 16, "4a", "BƯỚC 4a: TRUY VẤN VÉC-TƠ")}
          <text x="220" y="20" font-size="11" fill="#475569">• Tính tích vô hướng ma trận với 62 embeddings lưu trong vector-index.json</text>
        </g>
      </g>

      <!-- Sub-block C2: Multi-Layer Prompt Assembler (w: 1000) -->
      <g transform="translate(950, 38)">
        <rect width="1000" height="480" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
        <text x="14" y="20" class="stereotype">«In-Context Prompt Synthesizer»</text>
        {uml_component_glyph(965, 10)}

        <text x="14" y="38" class="card-title">2. Bộ Lắp Ráp Ngữ Cảnh Đa Tầng (In-Context Prompt Assembler)</text>
        <text x="14" y="52" class="card-sub">4-Tier Stacked Context Sandwich • Hallucination Suppression</text>

        <!-- 4-Tier Stacked Context Sandwich in Graduated Nexus Blues -->
        <g transform="translate(14, 66)">
          <!-- Tier 1: Deepest Navy -->
          <rect width="970" height="46" rx="3" fill="#001848"/>
          <text x="16" y="28" font-size="12" font-weight="700" fill="#FFFFFF">TẦNG 1: QUY TẮC ĐỊNH DANH VÀ VAI TRÒ HỆ THỐNG (SYSTEM DIRECTIVES)</text>
          <text x="954" y="28" text-anchor="end" font-size="11" fill="#93C5FD" font-family="monospace">Trợ lý Logistics trung thực, không bịa đặt</text>

          <!-- Tier 2: Nexus Primary -->
          <rect x="0" y="54" width="970" height="46" rx="3" fill="#003D9B"/>
          <text x="16" y="82" font-size="12" font-weight="700" fill="#FFFFFF">TẦNG 2: TRI THỨC TRÍCH DẪN TỪ VECTOR STORE (TOP-5 RAG CHUNKS)</text>
          <text x="954" y="82" text-anchor="end" font-size="11" fill="#BFDBFE" font-family="monospace">Đoạn trích chính sách SOP kèm mã điều luật</text>

          <!-- Tier 3: Nexus Container Blue -->
          <rect x="0" y="108" width="970" height="46" rx="3" fill="#0052CC"/>
          <text x="16" y="136" font-size="12" font-weight="700" fill="#FFFFFF">TẦNG 3: DỮ LIỆU ĐỘNG TỪ LIVE TOOLS (REAL-TIME DTO PAYLOAD)</text>
          <text x="954" y="136" text-anchor="end" font-size="11" fill="#DBEAFE" font-family="monospace">Mã đơn, lộ trình thực tế, bảng cước tính toán</text>

          <!-- Tier 4: Tech Blue -->
          <rect x="0" y="162" width="970" height="46" rx="3" fill="#1D4ED8"/>
          <text x="16" y="190" font-size="12" font-weight="700" fill="#FFFFFF">TẦNG 4: LỊCH SỬ ĐỐI THOẠI ĐA VÒNG (MULTI-TURN CONVERSATION BUFFER)</text>
          <text x="954" y="190" text-anchor="end" font-size="11" fill="#EFF6FF" font-family="monospace">6 lượt đàm thoại gần nhất (User &amp; AI)</text>
        </g>

        <!-- Generation Parameter Pill -->
        <g transform="translate(14, 310)">
          <rect width="970" height="50" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
          <text x="16" y="24" class="desc-text"><tspan class="desc-bold">Khóa nhiệt độ suy luận:</tspan> Cố định <tspan class="desc-bold" fill="#003D9B">Temperature = 0.2</tspan> triệt tiêu hiện tượng ảo giác (Zero-Hallucination Policy).</text>
          <text x="16" y="40" class="desc-text"><tspan class="desc-bold">Ràng buộc định dạng:</tspan> Ép đầu ra tuân thủ nghiêm ngặt JSON Schema DTO hoặc văn bản có cấu trúc chuẩn.</text>
        </g>

        <!-- Step 5 Flow Guide -->
        <g transform="translate(14, 435)">
          <rect width="970" height="32" rx="3" fill="#F0F7FF" stroke="#BFDBFE"/>
          {step_badge(20, 16, "5", "BƯỚC 5: GHÉP PROMPT ĐA TẦNG")}
          <text x="235" y="20" font-size="11" fill="#475569">• Gói toàn bộ ngữ cảnh thành Payload hoàn chỉnh gửi sang Cổng Mô hình AI ngoại vi</text>
        </g>
      </g>
    </g>

    <!-- Connector Tier C -> Tier D in Nexus Blue -->
    <g transform="translate(0, 1455)">
      <line x1="{col2_w // 2}" y1="0" x2="{col2_w // 2}" y2="35" stroke="#0052CC" stroke-width="2.2"/>
      <polygon points="{col2_w // 2 - 6},25 {col2_w // 2},35 {col2_w // 2 + 6},25" fill="#0052CC"/>
    </g>

    <!-- TIER D: RESPONSE STREAMING & OUTPUT ENGINE (h: 180) -->
    <g id="Sub_Tier_D" transform="translate(16, 1495)">
      <rect width="{col2_w - 32}" height="195" rx="4" fill="#F0F7FF" stroke="#BFDBFE" stroke-width="1.4"/>
      <rect width="{col2_w - 32}" height="26" rx="4" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
      <rect x="0" y="0" width="5" height="26" fill="#0052CC"/>
      <text x="14" y="18" class="zone-title">D. ĐIỀU PHỐI ĐẦU RA &amp; TRUYỀN PHÁT LUỒNG DỮ LIỆU (RESPONSE STREAMING &amp; DISPATCHER)</text>
      <text x="{col2_w - 46}" y="18" text-anchor="end" class="zone-tag">SERVER-SENT EVENTS (SSE) • JSON FALLBACK • AUDIT LOGGING</text>

      <g transform="translate(14, 38)">
        <rect width="920" height="145" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
        <text x="14" y="20" class="stereotype">«Event Stream Publisher»</text>
        {uml_component_glyph(885, 10)}
        {interface_lollipop(750, 20, "ISSEStreamer", "right")}

        <text x="14" y="38" class="card-title">SSE Streaming Controller (Text/Event-Stream)</text>
        <g transform="translate(14, 56)">
          <text x="0" y="14" class="desc-text">• <tspan class="desc-bold">Truyền phát từng Token:</tspan> Nhận luồng token từ LLM và phát ngay lập tức về Client.</text>
          <text x="0" y="34" class="desc-text">• <tspan class="desc-bold">Độ trễ First-Token &lt; 50ms:</tspan> Người dùng nhìn thấy chữ gõ tức thì mà không cần chờ.</text>
          <text x="0" y="54" class="desc-text">• <tspan class="desc-bold">Đóng ngắt kênh sạch:</tspan> Phát sự kiện <tspan class="chip-code">[DONE]</tspan> kèm trích dẫn văn bản SOP nguồn.</text>
        </g>
      </g>

      <g transform="translate(950, 38)">
        <rect width="1000" height="145" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
        <text x="14" y="20" class="stereotype">«DTO Response Dispatcher»</text>
        {uml_component_glyph(965, 10)}

        <text x="14" y="38" class="card-title">JSON DTO Packaging &amp; Fallback Dispatcher</text>
        <g transform="translate(14, 56)">
          <text x="0" y="14" class="desc-text">• <tspan class="desc-bold">Đóng gói JSON phản hồi:</tspan> Trả lời các yêu cầu phi luồng (Mobile Carrier, Batch Tra Cứu).</text>
          <text x="0" y="34" class="desc-text">• <tspan class="desc-bold">Tự động bắt lỗi mạng:</tspan> Chuyển đổi mượt mà giữa luồng SSE sang JSON khi ngắt kết nối.</text>
          <text x="0" y="54" class="desc-text">• <tspan class="desc-bold">Ghi nhận độ trễ:</tspan> Lưu vết thời gian phản hồi latencyMs và số token tiêu thụ vào hệ thống.</text>
        </g>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # COLUMN 3: EXTERNAL INTEGRATIONS & STORAGE (w: 860)
    # Perfectly aligned with Subsystem tiers:
    # Top: Logistics Microservices (Aligns with Tier B Tools)
    # Middle: Knowledge Base & Vector Store (Aligns with Tier C RAG)
    # Bottom: Foundation LLMs (Aligns with Tier C Prompt & Tier D Streaming)
    # =========================================================================
    lines.append(f'''
  <!-- COLUMN 3: EXTERNAL INTEGRATIONS & DATA STORES -->
  <g id="Col_3_External" transform="translate({col3_x}, {main_y})">
    <rect width="{col3_w}" height="{main_h}" rx="6" fill="#FFFFFF" stroke="#003D9B" stroke-width="1.6"/>
    <rect width="{col3_w}" height="32" rx="6" fill="#F0F7FF" stroke="#0052CC" stroke-width="1"/>
    <text x="16" y="21" class="col-header">HẠ TẦNG NGOẠI VI &amp; LƯU TRỮ</text>
    <text x="{col3_w - 16}" y="21" text-anchor="end" class="col-tag">«EXTERNAL ENVIRONMENT»</text>

    <!-- BLOCK 3.1: LOGISTICS MICROSERVICES MESH (Top, h: 540) -->
    <g id="Ext_Block_Services" transform="translate(16, 50)">
      <rect width="{col3_w - 32}" height="540" rx="4" fill="#F0F7FF" stroke="#BFDBFE" stroke-width="1.4"/>
      <rect width="{col3_w - 32}" height="26" rx="4" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
      <rect x="0" y="0" width="5" height="26" fill="#0052CC"/>
      
      <!-- Network Nodes Vector in Nexus Blue -->
      <g transform="translate(14, 7)">
        <circle cx="4" cy="4" r="2.5" fill="#0052CC"/>
        <circle cx="14" cy="4" r="2.5" fill="#0052CC"/>
        <circle cx="9" cy="13" r="2.5" fill="#0052CC"/>
        <line x1="4" y1="4" x2="9" y2="13" stroke="#0052CC" stroke-width="1"/>
        <line x1="14" y1="4" x2="9" y2="13" stroke="#0052CC" stroke-width="1"/>
      </g>
      <text x="36" y="18" class="zone-title">LƯỚI MICROSERVICES NGHIỆP VỤ (LOGISTICS BACKEND)</text>
      <text x="{col3_w - 46}" y="18" text-anchor="end" class="zone-tag">«API GATEWAY :3000»</text>

      <g transform="translate(14, 38)">
        <!-- Service 1 -->
        <g transform="translate(0, 0)">
          <rect width="{col3_w - 60}" height="76" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
          <text x="14" y="18" class="stereotype">«Microservice»</text>
          {uml_component_glyph(col3_w - 90, 8)}
          <text x="14" y="34" class="card-title">ShipmentService (:3002)</text>
          <text x="210" y="34" class="card-sub">• Quản lý đơn hàng &amp; hành trình</text>
          <text x="14" y="52" class="desc-text">• Lấy trạng thái bưu kiện theo mã <tspan class="chip-code">NX-XXXX</tspan>, bưu tá phát, mốc quét mã vạch.</text>
          <text x="14" y="68" class="desc-text">• Cung cấp tọa độ GPS phục vụ vẽ bản đồ hành trình.</text>
        </g>

        <!-- Service 2 -->
        <g transform="translate(0, 86)">
          <rect width="{col3_w - 60}" height="76" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
          <text x="14" y="18" class="stereotype">«Microservice»</text>
          {uml_component_glyph(col3_w - 90, 8)}
          <text x="14" y="34" class="card-title">PricingService (:3003)</text>
          <text x="195" y="34" class="card-sub">• Biểu cước &amp; Phụ phí bưu chính</text>
          <text x="14" y="52" class="desc-text">• Bảng cước chuẩn nội tỉnh, liên tỉnh, hỏa tốc theo nấc khối lượng 0.5kg.</text>
          <text x="14" y="68" class="desc-text">• Áp dụng công thức quy đổi IATA và tính phụ phí bảo hiểm hàng dễ vỡ.</text>
        </g>

        <!-- Service 3 -->
        <g transform="translate(0, 172)">
          <rect width="{col3_w - 60}" height="76" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
          <text x="14" y="18" class="stereotype">«Microservice»</text>
          {uml_component_glyph(col3_w - 90, 8)}
          <text x="14" y="34" class="card-title">IncidentService (:3008)</text>
          <text x="200" y="34" class="card-sub">• Khiếu nại &amp; Bồi thường hư hỏng</text>
          <text x="14" y="52" class="desc-text">• Tiếp nhận hồ sơ khiếu nại, tạo mã biên bản sự cố <tspan class="chip-code">CLM</tspan>.</text>
          <text x="14" y="68" class="desc-text">• Tính toán mức bồi thường theo tỷ lệ hư hỏng và Điều 25 Luật Bưu chính.</text>
        </g>

        <!-- Service 4 -->
        <g transform="translate(0, 258)">
          <rect width="{col3_w - 60}" height="76" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
          <text x="14" y="18" class="stereotype">«Microservice»</text>
          {uml_component_glyph(col3_w - 90, 8)}
          <text x="14" y="34" class="card-title">HubService (:3004)</text>
          <text x="165" y="34" class="card-sub">• Kiểm soát kho bãi &amp; Tuổi thọ tồn</text>
          <text x="14" y="52" class="desc-text">• Kiểm soát thời gian lưu kho tại trung tâm khai thác SOC (Cảnh báo hàng &gt;30 ngày).</text>
          <text x="14" y="68" class="desc-text">• Điều phối luân chuyển bưu kiện giữa các kho trung chuyển toàn quốc.</text>
        </g>

        <!-- Service 5 -->
        <g transform="translate(0, 344)">
          <rect width="{col3_w - 60}" height="76" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
          <text x="14" y="18" class="stereotype">«Microservice»</text>
          {uml_component_glyph(col3_w - 90, 8)}
          <text x="14" y="34" class="card-title">NotificationService (:3012)</text>
          <text x="220" y="34" class="card-sub">• Thông báo đẩy thời gian thực</text>
          <text x="14" y="52" class="desc-text">• Bắn cảnh báo tức thời tới Mobile App của bưu tá và SMS người nhận.</text>
          <text x="14" y="68" class="desc-text">• Giao tiếp: HTTP RESTful JSON • Timeout bảo vệ tối đa 2000ms.</text>
        </g>

        <!-- Resilience Pill -->
        <g transform="translate(0, 430)">
          <rect width="{col3_w - 60}" height="55" rx="3" fill="#FFFFFF" stroke="#93C5FD"/>
          <text x="14" y="24" class="desc-text"><tspan class="desc-bold">• Chuẩn kết nối nội bộ:</tspan> Toàn bộ các dịch vụ giao tiếp qua HTTP RESTful JSON có bảo vệ API Token.</text>
          <text x="14" y="42" class="desc-text"><tspan class="desc-bold">• Circuit Breaker:</tspan> Ngắt mạch tự động khi dịch vụ quá tải để bảo vệ hệ sinh thái.</text>
        </g>
      </g>
    </g>

    <!-- BLOCK 3.2: KNOWLEDGE BASE & VECTOR STORE (Middle, h: 560) -->
    <g id="Ext_Block_Knowledge" transform="translate(16, 605)">
      <rect width="{col3_w - 32}" height="560" rx="4" fill="#F0F7FF" stroke="#BFDBFE" stroke-width="1.4"/>
      <rect width="{col3_w - 32}" height="26" rx="4" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
      <rect x="0" y="0" width="5" height="26" fill="#0052CC"/>
      
      <!-- Database Cylinder Vector in Nexus Blue -->
      <g transform="translate(14, 6)">
        <ellipse cx="8" cy="4" rx="8" ry="3" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2"/>
        <path d="M 0,4 L 0,13 C 0,15 16,15 16,13 L 16,4" fill="none" stroke="#0052CC" stroke-width="1.2"/>
      </g>
      <text x="36" y="18" class="zone-title">CƠ SỞ TRI THỨC BƯU CHÍNH &amp; KHO VÉC-TƠ (KNOWLEDGE BASE)</text>
      <text x="{col3_w - 46}" y="18" text-anchor="end" class="zone-tag">«IN-MEMORY DOT-PRODUCT»</text>

      <g transform="translate(14, 38)">
        <!-- 9 SOP Documents -->
        <g transform="translate(0, 0)">
          <rect width="{col3_w - 60}" height="225" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
          <text x="44" y="20" class="stereotype">«Document Repository»</text>
          {uml_component_glyph(col3_w - 90, 8)}

          <!-- Folded Document Vector -->
          <g transform="translate(14, 14)">
            <path d="M 0,0 L 14,0 L 20,6 L 20,24 L 0,24 Z" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2"/>
            <polyline points="14,0 14,6 20,6" fill="none" stroke="#0052CC" stroke-width="1.2"/>
          </g>
          <text x="44" y="38" class="card-title">9 Tài Liệu Quy Chuẩn SOP Bưu Chính</text>
          <text x="44" y="52" class="card-sub">docs/knowledge-base/ (SOP-01 ➔ SOP-09)</text>

          <g transform="translate(14, 68)">
            <text x="0" y="14" class="desc-text">• <tspan class="desc-bold">Đóng gói hàng dễ vỡ:</tspan> Bọc xốp bóng khí 3 lớp, chèn mút định hình.</text>
            <text x="0" y="34" class="desc-text">• <tspan class="desc-bold">Biểu cước bưu chính:</tspan> Giá cước dịch vụ Chuẩn / Hỏa tốc, phụ phí Metro.</text>
            <text x="0" y="54" class="desc-text">• <tspan class="desc-bold">Bồi thường &amp; Khiếu nại:</tspan> Đền bù 100% khai giá hoặc 4x cước phát.</text>
            <text x="0" y="74" class="desc-text">• <tspan class="desc-bold">Quy định lưu kho:</tspan> Tuân thủ Điều 18 &amp; 28 Luật Bưu chính 2010.</text>
            <text x="0" y="94" class="desc-text">• <tspan class="desc-bold">Phân đoạn AST:</tspan> Cắt theo Markdown Heading, cửa sổ 250 từ, gối 40 từ.</text>
            <text x="0" y="114" class="desc-text">• <tspan class="desc-bold">Dung lượng:</tspan> Toàn bộ 9 văn bản SOP được chuẩn hóa thành <tspan class="desc-bold" fill="#003D9B">62 Chunks tri thức</tspan>.</text>
          </g>
        </g>

        <!-- Vector Index Store -->
        <g transform="translate(0, 240)">
          <rect width="{col3_w - 60}" height="225" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
          <text x="44" y="20" class="stereotype">«In-Memory Vector Cache»</text>
          {uml_component_glyph(col3_w - 90, 8)}

          <!-- 3D Database Cylinder Graphic with Platter Lines -->
          <g transform="translate(14, 14)">
            <ellipse cx="10" cy="5" rx="10" ry="4" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.3"/>
            <path d="M 0,5 L 0,20 C 0,23 20,23 20,20 L 20,5" fill="none" stroke="#0052CC" stroke-width="1.3"/>
            <path d="M 0,10 C 0,13 20,13 20,10" fill="none" stroke="#0052CC" stroke-width="1"/>
            <path d="M 0,15 C 0,18 20,18 20,15" fill="none" stroke="#0052CC" stroke-width="1"/>
          </g>
          <text x="44" y="38" class="card-title">Kho Chỉ Mục Véc-Tơ &amp; Bộ Đệm Bộ Nhớ</text>
          <text x="44" y="52" class="card-sub">vector-index.json • In-Memory Dot-Product Matrix Cache</text>

          <g transform="translate(14, 68)">
            <text x="0" y="14" class="desc-text">• <tspan class="desc-bold">Cấu trúc tệp:</tspan> Chứa 62 vector embeddings kích thước 768/1536 chiều.</text>
            <text x="0" y="34" class="desc-text">• <tspan class="desc-bold">Tốc độ siêu tốc:</tspan> Tải sẵn toàn bộ vào RAM, tính tích ma trận <tspan class="desc-bold" fill="#003D9B">&lt; 5ms</tspan>.</text>
            <text x="0" y="54" class="desc-text">• <tspan class="desc-bold">Tìm kiếm tương đồng:</tspan> Cosine Similarity kết hợp từ khóa Logistics chuyên ngành.</text>
            <text x="0" y="74" class="desc-text">• <tspan class="desc-bold">Cơ chế nạp lại (Reindex):</tspan> Hỗ trợ cập nhật SOP tức thì qua endpoint POST /ingest.</text>
            <text x="0" y="94" class="desc-text">• <tspan class="desc-bold">Chi phí vận hành:</tspan> Zero database dependency, không cần cài Milvus hay Pinecone.</text>
          </g>
        </g>

        <!-- Status Summary Pill -->
        <g transform="translate(0, 480)">
          <rect width="{col3_w - 60}" height="32" rx="3" fill="#EFF6FF" stroke="#0052CC"/>
          <text x="14" y="20" font-size="11" font-weight="700" fill="#003D9B">TỔNG QUAN TRI THỨC: 9 VĂN BẢN SOP • 62 CHUNKS • IN-MEMORY DOT-PRODUCT &lt; 5MS</text>
        </g>
      </g>
    </g>

    <!-- BLOCK 3.3: FOUNDATION AI MODELS (Bottom, h: 510) -->
    <g id="Ext_Block_LLM" transform="translate(16, 1180)">
      <rect width="{col3_w - 32}" height="500" rx="4" fill="#F0F7FF" stroke="#BFDBFE" stroke-width="1.4"/>
      <rect width="{col3_w - 32}" height="26" rx="4" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
      <rect x="0" y="0" width="5" height="26" fill="#0052CC"/>

      <!-- AI Chip Vector in Nexus Blue -->
      <g transform="translate(12, 5)">
        <rect x="0" y="0" width="16" height="16" rx="2" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2"/>
        <rect x="4" y="4" width="8" height="8" fill="#0052CC"/>
      </g>
      <text x="36" y="18" class="zone-title">CỔNG MÔ HÌNH AI SUY LUẬN (FOUNDATION LLM PROVIDERS)</text>
      <text x="{col3_w - 46}" y="18" text-anchor="end" class="zone-tag">«TRIPLE FALLBACK ARCHITECTURE»</text>

      <!-- Tier 1: Gemini -->
      <g transform="translate(14, 38)">
        <rect width="{col3_w - 60}" height="105" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
        <text x="14" y="18" class="stereotype">«Primary Cloud LLM»</text>
        {uml_component_glyph(col3_w - 90, 8)}
        <text x="14" y="34" class="card-title">Ưu tiên 1 (Primary): Google Gemini 3.6 Flash</text>
        <text x="14" y="48" class="card-sub">gemini-3.6-flash • gemini-embedding-001 (Google AI Studio)</text>
        <g transform="translate(14, 64)">
          <text x="0" y="14" class="desc-text">• Tốc độ suy luận cao, hỗ trợ sinh token trực tiếp luồng SSE.</text>
          <text x="0" y="32" class="desc-text">• Cửa sổ ngữ cảnh lớn (1M tokens), xử lý mượt mà tài liệu SOP bưu chính.</text>
        </g>
      </g>

      <!-- Tier 2: OpenAI -->
      <g transform="translate(14, 150)">
        <rect width="{col3_w - 60}" height="105" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
        <text x="14" y="18" class="stereotype">«Secondary Fallback LLM»</text>
        {uml_component_glyph(col3_w - 90, 8)}
        <text x="14" y="34" class="card-title">Ưu tiên 2 (Fallback): OpenAI GPT-4o-mini</text>
        <text x="14" y="48" class="card-sub">gpt-4o-mini • text-embedding-3-small (OpenAI API)</text>
        <g transform="translate(14, 64)">
          <text x="0" y="14" class="desc-text">• Tự động chuyển tiếp khi Google API chạm ngưỡng Rate Limit.</text>
          <text x="0" y="32" class="desc-text">• Đảm bảo độ sẵn sàng 99.9% cho các dịch vụ CSKH trọng yếu.</text>
        </g>
      </g>

      <!-- Tier 3: Local Offline -->
      <g transform="translate(14, 262)">
        <rect width="{col3_w - 60}" height="105" rx="3" fill="#FFFFFF" stroke="#0052CC" stroke-width="1.2"/>
        <text x="14" y="18" class="stereotype">«Offline Embedded Engine»</text>
        {uml_component_glyph(col3_w - 90, 8)}
        <text x="14" y="34" class="card-title">Ưu tiên 3 (Offline): Local Hash Vectorizer</text>
        <text x="14" y="48" class="card-sub">Thuật toán băm chuỗi nội bộ sinh véc-tơ 768 chiều</text>
        <g transform="translate(14, 64)">
          <text x="0" y="14" class="desc-text">• Hoạt động độc lập không cần kết nối mạng quốc tế.</text>
          <text x="0" y="32" class="desc-text">• Trả về câu trả lời mẫu lưu sẵn đối với các câu hỏi thường gặp.</text>
        </g>
      </g>

      <!-- Step 6 Flow Guide -->
      <g transform="translate(14, 380)">
        <rect width="{col3_w - 60}" height="75" rx="3" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2"/>
        {step_badge(20, 24, "6", "")}
        <text x="44" y="22" font-size="12" font-weight="800" fill="#003D9B">BƯỚC 6: SUY LUẬN MÔ HÌNH NGÔN NGỮ LỚN</text>
        <text x="44" y="42" font-size="11" font-weight="500" fill="#475569">Mô hình AI tiếp nhận Prompt 4 tầng và sinh chuỗi token câu trả lời</text>
        <text x="44" y="58" font-size="11" font-weight="500" fill="#475569">Phản hồi theo thời gian thực về Bộ Điều phối Luồng SSE (Bước 7)</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTIONS & INTER-COMPONENT FLOW ARROWS (COL 2 <-> COL 3)
    # Perfectly horizontal and direct in Nexus Blue (#0052CC)!
    # =========================================================================
    lines.append(f'''
  <!-- CROSS-SUBSYSTEM CONNECTION PATHS (FLOW BADGES 4b, 4a, 6, 7) -->
  <g id="Cross_Connectors">
    <!-- Flow 4b: Tools Orchestrator <-> Logistics Microservices (around y: 460) -->
    <path d="M {col2_x + col2_w} 460 L {col3_x} 460" fill="none" stroke="#0052CC" stroke-width="2.2"/>
    <polygon points="{col3_x - 9},455 {col3_x},460 {col3_x - 9},465" fill="#0052CC"/>
    <path d="M {col3_x} 480 L {col2_x + col2_w} 480" fill="none" stroke="#0052CC" stroke-width="2.2" stroke-dasharray="5,4"/>
    <polygon points="{col2_x + col2_w + 9},475 {col2_x + col2_w},480 {col2_x + col2_w + 9},485" fill="#0052CC"/>
    {step_badge((col2_x + col2_w + col3_x) // 2, 440, "4b", "")}

    <!-- Flow 4a: RAG Engine <-> Knowledge Base & Vector Store (around y: 1050) -->
    <path d="M {col2_x + col2_w} 1050 L {col3_x} 1050" fill="none" stroke="#0052CC" stroke-width="2.2"/>
    <polygon points="{col3_x - 9},1045 {col3_x},1050 {col3_x - 9},1055" fill="#0052CC"/>
    <path d="M {col3_x} 1070 L {col2_x + col2_w} 1070" fill="none" stroke="#0052CC" stroke-width="2.2" stroke-dasharray="5,4"/>
    <polygon points="{col2_x + col2_w + 9},1065 {col2_x + col2_w},1070 {col2_x + col2_w + 9},1075" fill="#0052CC"/>
    {step_badge((col2_x + col2_w + col3_x) // 2, 1030, "4a", "")}

    <!-- Flow 6: Prompt Assembler -> LLM Providers (around y: 1420) -->
    <path d="M {col2_x + col2_w} 1420 L {col3_x} 1420" fill="none" stroke="#0052CC" stroke-width="2.4"/>
    <polygon points="{col3_x - 9},1415 {col3_x},1420 {col3_x - 9},1425" fill="#0052CC"/>
    {step_badge((col2_x + col2_w + col3_x) // 2, 1400, "6", "")}

    <!-- Return Flow from LLM Providers -> SSE Streamer (around y: 1680) -->
    <path d="M {col3_x} 1680 L {col2_x + col2_w} 1680" fill="none" stroke="#0052CC" stroke-width="2.2" stroke-dasharray="5,4"/>
    <polygon points="{col2_x + col2_w + 9},1675 {col2_x + col2_w},1680 {col2_x + col2_w + 9},1685" fill="#0052CC"/>
    {step_badge((col2_x + col2_w + col3_x) // 2, 1700, "7", "")}
  </g>
''')

    # =========================================================================
    # FOOTER: NARRATIVE LEGEND & TECHNICAL TITLE BLOCK (y: 1870, h: 125)
    # =========================================================================
    f_y = 1870
    f_h = 125
    tb_w = 1000
    lg_w = content_w - tb_w - 30

    lines.append(f'''
  <!-- FOOTER: INTERACTION LIFECYCLE LEGEND & ISO 7200 TITLE BLOCK -->
  <!-- Narrative Legend -->
  <g id="Footer_Legend" transform="translate({margin_x}, {f_y})">
    <rect width="{lg_w}" height="{f_h}" rx="4" fill="#F0F7FF" stroke="#0052CC" stroke-width="1.6"/>
    <rect x="0" y="0" width="6" height="{f_h}" rx="4" fill="#003D9B"/>
    <text x="22" y="24" class="tb-label" fill="#003D9B">CHU KỲ VẬN HÀNH 7 BƯỚC CỦA HỆ THỐNG TRỢ LÝ AI (7-STEP INTERACTION LIFECYCLE):</text>
    
    <g transform="translate(22, 42)">
      <text x="0" y="14" class="desc-text"><tspan class="desc-bold" fill="#003D9B">① Gửi truy vấn:</tspan> Client gọi REST/SSE ➔ <tspan class="desc-bold" fill="#003D9B">② Cổng bảo mật:</tspan> Khử PII, gắn Session ➔ <tspan class="desc-bold" fill="#003D9B">③ Phân loại NLU:</tspan> Rẽ nhánh Tri thức (RAG) hoặc Tác vụ Live.</text>
      <text x="0" y="36" class="desc-text"><tspan class="desc-bold" fill="#003D9B">④a Truy vấn RAG:</tspan> Lấy Top-5 SOP véc-tơ ➔ <tspan class="desc-bold" fill="#003D9B">④b Gọi Live Tool:</tspan> Truy vấn Microservices (:3000) ➔ <tspan class="desc-bold" fill="#003D9B">⑤ Ghép Prompt:</tspan> Lắp ráp 4 tầng ngữ cảnh.</text>
      <text x="0" y="58" class="desc-text"><tspan class="desc-bold" fill="#003D9B">⑥ Suy luận LLM:</tspan> Gemini 3.6 Flash / GPT-4o-mini suy luận ➔ <tspan class="desc-bold" fill="#003D9B">⑦ Phản hồi Client:</tspan> Stream từng token qua SSE hoặc gói JSON hoàn chỉnh.</text>
    </g>
  </g>

  <!-- FORMAL TECHNICAL TITLE BLOCK (ISO 7200) with Nexus Navy & Blue -->
  <g id="Technical_Title_Block" transform="translate({margin_x + lg_w + 30}, {f_y})">
    <rect width="{tb_w}" height="{f_h}" fill="#FFFFFF" stroke="#003D9B" stroke-width="1.8"/>
    
    <line x1="0" y1="42" x2="{tb_w}" y2="42" stroke="#0052CC" stroke-width="1"/>
    <line x1="0" y1="84" x2="{tb_w}" y2="84" stroke="#0052CC" stroke-width="1"/>
    <line x1="560" y1="0" x2="560" y2="{f_h}" stroke="#0052CC" stroke-width="1"/>
    <line x1="780" y1="42" x2="780" y2="{f_h}" stroke="#0052CC" stroke-width="1"/>

    <!-- Row 1 -->
    <text x="16" y="20" class="tb-label">ĐỒ ÁN TỐT NGHIỆP KỸ SƯ CÔNG NGHỆ THÔNG TIN</text>
    <text x="16" y="34" class="tb-val">HỆ THỐNG QUẢN LÝ VẬN TẢI &amp; LOGISTICS TOÀN TRÌNH (NEXUS LMS)</text>
    
    <text x="576" y="20" class="tb-label">PHÂN HỆ / SUBSYSTEM</text>
    <text x="576" y="34" class="tb-val">services/chatbot-service (:3009)</text>

    <!-- Row 2 -->
    <text x="16" y="58" class="tb-label">TÊN BẢN VẼ / DRAWING TITLE</text>
    <text x="16" y="73" class="tb-val">KIẾN TRÚC TỔNG THỂ PHÂN HỆ AI CHATBOT (COMPONENT TOPOLOGY)</text>

    <text x="576" y="58" class="tb-label">MÃ BẢN VẼ / DOC ID</text>
    <text x="576" y="73" class="tb-val">ARCH-LMS-CB-04A</text>

    <text x="796" y="58" class="tb-label">PHIÊN BẢN / REVISION</text>
    <text x="796" y="73" class="tb-val">v4.5 (NEXUS BLUE &amp; UML)</text>

    <!-- Row 3 -->
    <text x="16" y="100" class="tb-label">MÔ HÌNH KIẾN TRÚC / ARCHITECTURE MODEL</text>
    <text x="16" y="113" class="tb-val">3-COLUMN UML TOPOLOGY • IN-MEMORY RAG • 7-STEP FLOW</text>

    <text x="576" y="100" class="tb-label">NGÀY PHÁT HÀNH</text>
    <text x="576" y="113" class="tb-val">2026-09-29</text>

    <text x="796" y="100" class="tb-label">ĐỊNH DẠNG / TỶ LỆ</text>
    <text x="796" y="113" class="tb-val">1:1 VECTOR BLUEPRINT</text>
  </g>
''')

    lines.append('</svg>')
    return '\n'.join(lines)

def main():
    print(f"Generating Nexus Blue & UML-Engineered AI Chatbot Architecture Overview Diagram for Figma Page 1...")
    svg_content = build_architecture_svg()

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(svg_content)

    print(f"Successfully generated: {OUTPUT_FILE}")
    print(f"File size: {os.path.getsize(OUTPUT_FILE):,} bytes")

    # Validate XML parsing
    try:
        ET.fromstring(svg_content)
        print("SVG XML Validation: PASSED (Well-formed XML)")
    except Exception as e:
        print(f"SVG XML Validation ERROR: {e}")
        raise

if __name__ == "__main__":
    main()
