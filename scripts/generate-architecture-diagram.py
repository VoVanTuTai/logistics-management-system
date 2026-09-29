#!/usr/bin/env python3
"""
generate-architecture-diagram.py
Generates the ultra-spacious, high-legibility Enterprise Architecture & Deployment Diagram (5-Tier)
for the Nexus Logistics Management System graduation thesis.

Outputs to:
  docs/graduation-thesis/figma-page-1-system-and-data/diagrams/02-architecture-deployment-4-tier.svg

Standardized Dimensions (Ultra-Spacious, High Breathing Room & 100% Figma Vector-Safe):
  Width: 3600px, Height: 3000px
Style:
  Monochrome Technical Blueprint (Trắng - Đen - Xám chuẩn kỹ thuật)
  Figma Compatibility: 100% inline vector shapes (<polygon>, <path>, <line>), ZERO SVG <marker> tags.
"""

import xml.etree.ElementTree as ET
import html
import os

OUTPUT_FILE = "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/02-architecture-deployment-4-tier.svg"

def escape(text):
    return html.escape(str(text))

def build_architecture_svg():
    width = 3600
    height = 3000
    lines = []

    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # Double Blueprint Frame
    lines.append(f'''
  <!-- Double Technical Blueprint Frame -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <rect x="20" y="20" width="{width - 40}" height="{height - 40}" fill="none" stroke="#000000" stroke-width="2.6"/>
  <rect x="32" y="32" width="{width - 64}" height="{height - 64}" fill="none" stroke="#000000" stroke-width="1.2"/>

  <style>
    text {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }}
    
    .hdr-badge {{ font-size: 14.5px; font-weight: 700; fill: #FFFFFF; letter-spacing: 1.5px; text-transform: uppercase; }}
    .hdr-title {{ font-size: 32px; font-weight: 800; fill: #000000; letter-spacing: -0.6px; }}
    .hdr-sub {{ font-size: 17px; font-weight: 500; fill: #374151; }}
    
    .tier-header {{ font-size: 17px; font-weight: 800; fill: #000000; letter-spacing: 1px; text-transform: uppercase; }}
    .tier-badge {{ font-size: 13.5px; font-weight: 700; fill: #000000; text-transform: uppercase; letter-spacing: 0.6px; }}
    
    .cluster-title {{ font-size: 16px; font-weight: 800; fill: #000000; letter-spacing: 0.5px; text-transform: uppercase; }}
    
    .card-title {{ font-size: 16.5px; font-weight: 700; fill: #000000; }}
    .card-meta {{ font-size: 13.5px; font-weight: 600; fill: #4B5563; font-family: ui-monospace, Menlo, monospace; }}
    .card-body {{ font-size: 14px; font-weight: 400; fill: #1F2937; line-height: 1.6; }}
    .card-bullet {{ font-size: 13.5px; font-weight: 500; fill: #374151; }}
    .card-bullet-bold {{ font-size: 13.5px; font-weight: 700; fill: #111827; }}
    
    .flow-label {{ font-size: 14px; font-weight: 700; fill: #000000; letter-spacing: 0.8px; text-transform: uppercase; }}
    .chip-text {{ font-size: 13.5px; font-weight: 700; fill: #000000; font-family: ui-monospace, Menlo, monospace; }}
    .chip-sub {{ font-size: 12px; font-weight: 500; fill: #4B5563; }}
  </style>
''')

    # Dimensions setup
    margin_x = 70
    content_w = width - margin_x * 2  # 3460px
    inner_pad = 35
    c_w = 785
    c_gap = (content_w - inner_pad * 2 - c_w * 4) // 3  # (3390 - 3140) // 3 = 83px

    # Column center points for vertical bus connectors
    p1 = margin_x + inner_pad + c_w // 2
    p2 = margin_x + inner_pad + c_w + c_gap + c_w // 2
    p3 = margin_x + inner_pad + (c_w + c_gap) * 2 + c_w // 2
    p4 = margin_x + inner_pad + (c_w + c_gap) * 3 + c_w // 2

    # =========================================================================
    # HEADER (y: 45 to 155, h: 110)
    # =========================================================================
    lines.append(f'''
  <!-- HEADER BAR -->
  <g id="HeaderBar" transform="translate({margin_x}, 45)">
    <rect width="{content_w}" height="110" rx="8" fill="#F9FAFB" stroke="#000000" stroke-width="2"/>
    
    <!-- Left Meta Badge -->
    <rect x="28" y="16" width="430" height="28" rx="4" fill="#000000"/>
    <text x="42" y="35" class="hdr-badge">NEXUS ENTERPRISE LOGISTICS ARCHITECTURE</text>
    
    <!-- Title & Desc -->
    <text x="28" y="72" class="hdr-title">HÌNH 1.2: SƠ ĐỒ KIẾN TRÚC TỔNG THỂ HỆ THỐNG LOGISTICS &amp; VẬN TẢI ĐA KÊNH PHÂN TÁN</text>
    <text x="28" y="96" class="hdr-sub">Kiến trúc Triển khai Doanh nghiệp Toàn diện: 4 Giao diện Đa kênh, API Gateway &amp; PII Sanitizer, 13 Microservices, Trục Sự kiện RabbitMQ Saga &amp; 11 Cơ sở Dữ liệu Độc lập</text>
    
    <!-- Right Tech Specs Chips -->
    <g transform="translate({content_w - 710}, 18)">
      <!-- Arch Chip -->
      <rect x="0" y="0" width="205" height="36" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <circle cx="20" cy="18" r="5" fill="#000000"/>
      <text x="38" y="23" font-size="13" font-weight="700" fill="#000000">ARCH: 5-TIER MESH</text>
      
      <!-- Messaging Chip -->
      <rect x="220" y="0" width="245" height="36" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <rect x="236" y="11" width="12" height="14" rx="1.5" fill="#000000"/>
      <text x="258" y="23" font-size="13" font-weight="700" fill="#000000">BROKER: RABBITMQ AMQP</text>

      <!-- DB Chip -->
      <rect x="480" y="0" width="215" height="36" rx="5" fill="#000000"/>
      <text x="587" y="23" font-size="13" font-weight="700" fill="#FFFFFF" text-anchor="middle">11x POSTGRESQL 16</text>

      <text x="695" y="66" font-size="13.5" font-weight="600" fill="#4B5563" text-anchor="end">Decoupled Database-per-Service &amp; Distributed Saga Keys</text>
    </g>
  </g>
''')

    # =========================================================================
    # TẦNG 1: MULTI-CHANNEL CLIENT APPS (y: 215 to 455, h: 240)
    # =========================================================================
    lines.append(f'''
  <!-- TIER 1: CLIENT APPS -->
  <g id="Tier_1_Clients" transform="translate({margin_x}, 215)">
    <rect width="{content_w}" height="240" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{content_w}" height="42" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="20" y="12" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="36" y="28" class="tier-header">TẦNG 1: MULTI-CHANNEL CLIENT APPLICATIONS (GIAO DIỆN NGƯỜI DÙNG ĐA KÊNH)</text>
    <text x="{content_w - 24}" y="28" class="tier-badge" text-anchor="end">EDGE CLIENT PROTOCOLS: HTTPS / RESTFUL API / WEBSOCKET REAL-TIME EVENT STREAM</text>
    
    <!-- 4 Client Cards (w=785, h=165) -->
    <!-- Card 1: Merchant Web -->
    <g transform="translate({inner_pad}, 58)">
      <rect width="{c_w}" height="165" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <line x1="0" y1="38" x2="{c_w}" y2="38" stroke="#000000" stroke-width="1"/>
      <text x="22" y="26" class="card-title">Merchant Web Portal (:5174)</text>
      <text x="{c_w - 22}" y="26" class="card-meta" text-anchor="end">REACTJS 18 / VITE / TAILWIND</text>
      <text x="22" y="66" class="card-bullet"><tspan class="card-bullet-bold">• Đối tượng sử dụng:</tspan> Chủ shop thương mại điện tử, Doanh nghiệp gửi bưu phẩm định kỳ</text>
      <text x="22" y="96" class="card-bullet"><tspan class="card-bullet-bold">• Chức năng cốt lõi:</tspan> Tạo đơn hàng loạt (Excel/API), Đặt lịch gom hàng tận nơi, Quản lý kho hàng shop</text>
      <text x="22" y="126" class="card-bullet"><tspan class="card-bullet-bold">• Quản lý tài chính:</tspan> Theo dõi đối soát tiền thu hộ COD theo đơn, Nạp/rút tiền ví điện tử Merchant</text>
    </g>

    <!-- Card 2: Operations Web -->
    <g transform="translate({inner_pad + c_w + c_gap}, 58)">
      <rect width="{c_w}" height="165" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <line x1="0" y1="38" x2="{c_w}" y2="38" stroke="#000000" stroke-width="1"/>
      <text x="22" y="26" class="card-title">Operations Platform (:5173)</text>
      <text x="{c_w - 22}" y="26" class="card-meta" text-anchor="end">REACTJS / LEAFLET / RECHARTS</text>
      <text x="22" y="66" class="card-bullet"><tspan class="card-bullet-bold">• Đối tượng sử dụng:</tspan> Trưởng bưu cục (Station Ops), Điều hành viên trung tâm (Dispatchers)</text>
      <text x="22" y="96" class="card-bullet"><tspan class="card-bullet-bold">• Chức năng cốt lõi:</tspan> Phân tuyến bưu tá theo phường/xã, Giám sát tồn kho bưu cục, Đóng chuyến xe</text>
      <text x="22" y="126" class="card-bullet"><tspan class="card-bullet-bold">• Sự cố &amp; Bồi thường:</tspan> Tiếp nhận kiện hàng hư hỏng/thất lạc, Thẩm định biên bản bồi thường (HITL)</text>
    </g>

    <!-- Card 3: Courier Mobile App -->
    <g transform="translate({inner_pad + (c_w + c_gap)*2}, 58)">
      <rect width="{c_w}" height="165" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <line x1="0" y1="38" x2="{c_w}" y2="38" stroke="#000000" stroke-width="1"/>
      <text x="22" y="26" class="card-title">Courier &amp; Customer Mobile App (:8082)</text>
      <text x="{c_w - 22}" y="26" class="card-meta" text-anchor="end">REACT NATIVE / EXPO</text>
      <text x="22" y="66" class="card-bullet"><tspan class="card-bullet-bold">• Đối tượng sử dụng:</tspan> Bưu tá thu gom / Giao hàng chặng cuối &amp; Khách hàng cá nhân gửi/nhận</text>
      <text x="22" y="96" class="card-bullet"><tspan class="card-bullet-bold">• Tác nghiệp bưu tá:</tspan> Quét mã vạch thu gom tại shop, Điều hướng lộ trình, Chụp ảnh POD ký nhận</text>
      <text x="22" y="126" class="card-bullet"><tspan class="card-bullet-bold">• Thu tiền COD:</tspan> Sinh mã VietQR động thu tiền chuyển khoản, Lập phiên nộp tiền về bưu cục</text>
    </g>

    <!-- Card 4: Guest Public Tracking -->
    <g transform="translate({inner_pad + (c_w + c_gap)*3}, 58)">
      <rect width="{c_w}" height="165" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <line x1="0" y1="38" x2="{c_w}" y2="38" stroke="#000000" stroke-width="1"/>
      <text x="22" y="26" class="card-title">Guest Public Tracking (:5177)</text>
      <text x="{c_w - 22}" y="26" class="card-meta" text-anchor="end">REACTJS / VITE LIGHTWEIGHT</text>
      <text x="22" y="66" class="card-bullet"><tspan class="card-bullet-bold">• Đối tượng sử dụng:</tspan> Người nhận bưu phẩm vãng lai, Khách hàng tra cứu nhanh không cần tài khoản</text>
      <text x="22" y="96" class="card-bullet"><tspan class="card-bullet-bold">• Chức năng cốt lõi:</tspan> Tra cứu thời gian thực trạng thái đơn hàng (Tracking Code), Xem mốc hành trình</text>
      <text x="22" y="126" class="card-bullet"><tspan class="card-bullet-bold">• Bảo mật quyền riêng tư:</tspan> 100% dữ liệu hiển thị đã qua bộ lọc che mờ PII Sanitizer (:3000)</text>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTOR BUS: TIER 1 -> TIER 2 (y: 455 to 575, gap = 120)
    # 100% FIGMA-SAFE INLINE VECTOR ARROWS (POLYGONS)
    # =========================================================================
    lines.append(f'''
  <!-- CONNECTOR BUS: TIER 1 -> TIER 2 -->
  <g id="Bus_1_to_2">
    <!-- 4 Vertical Trunk Lines with Solid Figma-Safe Vector Arrowheads -->
    <!-- Col 1 -->
    <line x1="{p1}" y1="455" x2="{p1}" y2="575" stroke="#000000" stroke-width="2"/>
    <polygon points="{p1 - 9},561 {p1},575 {p1 + 9},561" fill="#000000"/>

    <!-- Col 2 -->
    <line x1="{p2}" y1="455" x2="{p2}" y2="575" stroke="#000000" stroke-width="2"/>
    <polygon points="{p2 - 9},561 {p2},575 {p2 + 9},561" fill="#000000"/>

    <!-- Col 3 -->
    <line x1="{p3}" y1="455" x2="{p3}" y2="575" stroke="#000000" stroke-width="2"/>
    <polygon points="{p3 - 9},561 {p3},575 {p3 + 9},561" fill="#000000"/>

    <!-- Col 4 -->
    <line x1="{p4}" y1="455" x2="{p4}" y2="575" stroke="#000000" stroke-width="2"/>
    <polygon points="{p4 - 9},561 {p4},575 {p4 + 9},561" fill="#000000"/>
    
    <!-- Central Bus Highway Line -->
    <line x1="{p1 - 40}" y1="515" x2="{p4 + 40}" y2="515" stroke="#000000" stroke-width="1.8" stroke-dasharray="10,6"/>
    <polygon points="{p1 - 50},515 {p1 - 38},509 {p1 - 38},521" fill="#000000"/>
    <polygon points="{p4 + 50},515 {p4 + 38},509 {p4 + 38},521" fill="#000000"/>
    
    <!-- Center Protocol Badge -->
    <rect x="{width//2 - 340}" y="497" width="680" height="36" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
    <text x="{width//2}" y="520" class="flow-label" text-anchor="middle">EDGE PROTOCOLS: HTTPS / TLS 1.3 • RESTful JSON • WebSocket Duplex Stream</text>
  </g>
''')

    # =========================================================================
    # TẦNG 2: EDGE INGRESS, API GATEWAY & SECURITY (y: 575 to 775, h: 200)
    # =========================================================================
    lines.append(f'''
  <!-- TIER 2: API GATEWAY & SECURITY -->
  <g id="Tier_2_Gateway" transform="translate({margin_x}, 575)">
    <rect width="{content_w}" height="200" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{content_w}" height="42" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="20" y="12" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="36" y="28" class="tier-header">TẦNG 2: EDGE INGRESS, API GATEWAY &amp; SECURITY PROXY (:3000)</text>
    <text x="{content_w - 24}" y="28" class="tier-badge" text-anchor="end">SINGLE ENTRYPOINT • REVERSE PROXY • AUTHENTICATION &amp; PII PIPELINE</text>
    
    <!-- 4 Functional Gateway Blocks (w: 785, h: 126) -->
    <!-- Block 1 -->
    <g transform="translate({inner_pad}, 58)">
      <rect width="{c_w}" height="126" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <text x="22" y="30" class="card-title">Reverse Proxy &amp; Dynamic Router</text>
      <text x="22" y="64" class="card-bullet"><tspan class="card-bullet-bold">• Cửa ngõ định tuyến duy nhất:</tspan> Phân luồng URL /api/v1/* tới 13 microservices nội bộ</text>
      <text x="22" y="94" class="card-bullet"><tspan class="card-bullet-bold">• Cân bằng tải &amp; Giám sát:</tspan> Round-Robin, Kiểm tra nhịp tim định kỳ (:3000/health)</text>
    </g>

    <!-- Block 2 -->
    <g transform="translate({inner_pad + c_w + c_gap}, 58)">
      <rect width="{c_w}" height="126" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <text x="22" y="30" class="card-title">JWT Claims &amp; RBAC Guard</text>
      <text x="22" y="64" class="card-bullet"><tspan class="card-bullet-bold">• Xác thực Access Token:</tspan> Giải mã chữ ký HMAC-SHA256, kiểm tra thời hạn (15 phút)</text>
      <text x="22" y="94" class="card-bullet"><tspan class="card-bullet-bold">• Bóc tách quyền hạn:</tspan> ADMIN, OPS, COURIER, MERCHANT; Chuyển tiếp Header nội bộ</text>
    </g>

    <!-- Block 3 -->
    <g transform="translate({inner_pad + (c_w + c_gap)*2}, 58)">
      <rect width="{c_w}" height="126" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <text x="22" y="30" class="card-title">PII Sanitizer &amp; Data Masking</text>
      <text x="22" y="64" class="card-bullet"><tspan class="card-bullet-bold">• Khử định danh dữ liệu:</tspan> Tự động che mờ SĐT (098***) &amp; địa chỉ nhà riêng người nhận</text>
      <text x="22" y="94" class="card-bullet"><tspan class="card-bullet-bold">• Chống rò rỉ thông tin:</tspan> Bảo vệ quyền riêng tư người dùng khi tra cứu bưu kiện công khai</text>
    </g>

    <!-- Block 4 -->
    <g transform="translate({inner_pad + (c_w + c_gap)*3}, 58)">
      <rect width="{c_w}" height="126" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <text x="22" y="30" class="card-title">Traffic Shaping &amp; Security Guard</text>
      <text x="22" y="64" class="card-bullet"><tspan class="card-bullet-bold">• Giới hạn tần suất:</tspan> Rate Limiting 60 req/min/IP chống brute-force mã vận đơn</text>
      <text x="22" y="94" class="card-bullet"><tspan class="card-bullet-bold">• Phòng thủ biên:</tspan> CORS Whitelist nghiêm ngặt, Helmet Security Headers, Chống DoS API</text>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTOR BUS: TIER 2 -> TIER 3 (y: 775 to 895, gap = 120)
    # 100% FIGMA-SAFE INLINE VECTOR ARROWS (POLYGONS)
    # =========================================================================
    lines.append(f'''
  <!-- CONNECTOR BUS: TIER 2 -> TIER 3 -->
  <g id="Bus_2_to_3">
    <!-- 4 Vertical Trunk Lines with Solid Figma-Safe Vector Arrowheads -->
    <!-- Col 1 -->
    <line x1="{p1}" y1="775" x2="{p1}" y2="895" stroke="#000000" stroke-width="2"/>
    <polygon points="{p1 - 9},881 {p1},895 {p1 + 9},881" fill="#000000"/>

    <!-- Col 2 -->
    <line x1="{p2}" y1="775" x2="{p2}" y2="895" stroke="#000000" stroke-width="2"/>
    <polygon points="{p2 - 9},881 {p2},895 {p2 + 9},881" fill="#000000"/>

    <!-- Col 3 -->
    <line x1="{p3}" y1="775" x2="{p3}" y2="895" stroke="#000000" stroke-width="2"/>
    <polygon points="{p3 - 9},881 {p3},895 {p3 + 9},881" fill="#000000"/>

    <!-- Col 4 -->
    <line x1="{p4}" y1="775" x2="{p4}" y2="895" stroke="#000000" stroke-width="2"/>
    <polygon points="{p4 - 9},881 {p4},895 {p4 + 9},881" fill="#000000"/>
    
    <!-- Central Bus Line -->
    <line x1="{p1 - 40}" y1="835" x2="{p4 + 40}" y2="835" stroke="#000000" stroke-width="1.8" stroke-dasharray="10,6"/>
    <polygon points="{p1 - 50},835 {p1 - 38},829 {p1 - 38},841" fill="#000000"/>
    <polygon points="{p4 + 50},835 {p4 + 38},829 {p4 + 38},841" fill="#000000"/>

    <!-- Center Transport Badge -->
    <rect x="{width//2 - 360}" y="817" width="720" height="36" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
    <text x="{width//2}" y="840" class="flow-label" text-anchor="middle">INTERNAL TRANSPORT: VPC PRIVATE NETWORK • JSON RPC • TraceContext &amp; User Headers</text>
  </g>
''')

    # =========================================================================
    # TẦNG 3: 13 MICROSERVICES BUSINESS DOMAIN MESH (y: 895 to 1885, h: 990)
    # ULTRA-SPACIOUS: CLUSTER H: 910px
    # =========================================================================
    lines.append(f'''
  <!-- TIER 3: MICROSERVICES MESH -->
  <g id="Tier_3_Microservices" transform="translate({margin_x}, 895)">
    <rect width="{content_w}" height="990" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{content_w}" height="44" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="20" y="13" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="36" y="29" class="tier-header">TẦNG 3: 13 MICROSERVICES BUSINESS DOMAIN MESH (LÕI NGHIỆP VỤ VẬN HÀNH PHÂN TÁN)</text>
    <text x="{content_w - 24}" y="29" class="tier-badge" text-anchor="end">13 ISOLATED BOUNDED CONTEXTS • NESTJS / EXPRESS • 100% PRISMA ORM FIDELITY</text>
    
    <!-- ================= HORIZONTAL CROSS-DOMAIN EVENT CONNECTORS (INLINE VECTOR ARROWS) ================= -->
    <!-- Flow 1: Cluster 1 -> Cluster 2 (Middle-Mile to Last-Mile Handover) -->
    <g id="InterCluster_1_to_2">
      <line x1="{inner_pad + c_w}" y1="495" x2="{inner_pad + c_w + c_gap}" y2="495" stroke="#000000" stroke-width="1.8" stroke-dasharray="6,4"/>
      <polygon points="{inner_pad + c_w + c_gap - 10},489 {inner_pad + c_w + c_gap},495 {inner_pad + c_w + c_gap - 10},501" fill="#000000"/>
      <rect x="{inner_pad + c_w + 8}" y="475" width="{c_gap - 16}" height="18" rx="3" fill="#000000"/>
      <text x="{inner_pad + c_w + c_gap//2}" y="488" font-size="10.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">BÀN GIAO</text>
    </g>

    <!-- Flow 2: Cluster 3 <-> Cluster 2 (Canonical FSM & Dispatch Sync) -->
    <g id="InterCluster_3_to_2">
      <line x1="{inner_pad + (c_w + c_gap)*2}" y1="235" x2="{inner_pad + (c_w + c_gap) + c_w}" y2="235" stroke="#000000" stroke-width="1.8" stroke-dasharray="6,4"/>
      <polygon points="{inner_pad + (c_w + c_gap) + c_w + 10},229 {inner_pad + (c_w + c_gap) + c_w},235 {inner_pad + (c_w + c_gap) + c_w + 10},241" fill="#000000"/>
      <rect x="{inner_pad + (c_w + c_gap) + c_w + 8}" y="215" width="{c_gap - 16}" height="18" rx="3" fill="#000000"/>
      <text x="{inner_pad + (c_w + c_gap) + c_w + c_gap//2}" y="228" font-size="10.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">FSM SYNC</text>
    </g>

    <!-- Flow 3: Cluster 2 -> Cluster 4 (POD Delivered to COD & Wallet) -->
    <g id="InterCluster_2_to_4">
      <line x1="{inner_pad + (c_w + c_gap)*2 + c_w}" y1="160" x2="{inner_pad + (c_w + c_gap)*3}" y2="160" stroke="#000000" stroke-width="1.8" stroke-dasharray="6,4"/>
      <polygon points="{inner_pad + (c_w + c_gap)*3 - 10},154 {inner_pad + (c_w + c_gap)*3},160 {inner_pad + (c_w + c_gap)*3 - 10},166" fill="#000000"/>
      <rect x="{inner_pad + (c_w + c_gap)*2 + c_w + 8}" y="140" width="{c_gap - 16}" height="18" rx="3" fill="#000000"/>
      <text x="{inner_pad + (c_w + c_gap)*2 + c_w + c_gap//2}" y="153" font-size="10.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">COD PAY</text>
    </g>

    <!-- 4 DOMAIN CLUSTERS (w: 785 each, gap: 83, height: 910) -->
    
    <!-- ================= CLUSTER 1: FIRST & MIDDLE-MILE ================= -->
    <g transform="translate({inner_pad}, 60)">
      <rect width="{c_w}" height="910" rx="7" fill="#FAFAFA" stroke="#000000" stroke-width="1.5"/>
      <rect width="{c_w}" height="38" rx="7" fill="#E5E7EB" stroke="#000000" stroke-width="1.2"/>
      <text x="22" y="25" class="cluster-title">CỤM 1: FIRST &amp; MIDDLE-MILE (THU GOM &amp; KHO)</text>

      <!-- Svc 1: pickup-service -->
      <g transform="translate(20, 55)">
        <rect width="{c_w - 40}" height="255" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="38" x2="{c_w - 40}" y2="38" stroke="#000000" stroke-width="1"/>
        <text x="20" y="26" class="card-title">1. pickup-service (:3003)</text>
        <rect x="{c_w - 40 - 130}" y="9" width="112" height="22" rx="3" fill="#000000"/>
        <text x="{c_w - 40 - 74}" y="25" font-size="11.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">FIRST-MILE</text>
        
        <text x="20" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Tiếp nhận yêu cầu lấy hàng:</tspan> Tiếp nhận lệnh gom từ Portal Shop, xếp lịch theo ca</text>
        <text x="20" y="96" class="card-bullet"><tspan class="card-bullet-bold">• Quản lý danh mục kiện gom:</tspan> PickupRequest, danh sách PickupItem cần thu</text>
        <text x="20" y="124" class="card-bullet"><tspan class="card-bullet-bold">• Tác nghiệp bưu tá:</tspan> Quét mã vạch xác nhận thu gom, phát sự kiện PICKUP.COLLECTED</text>
        <text x="20" y="152" class="card-bullet"><tspan class="card-bullet-bold">• Xử lý ngoại lệ:</tspan> Ghi nhận lý do shop chưa sẵn sàng hàng, hủy hoặc dời lịch thu</text>
        
        <rect x="20" y="195" width="{c_w - 80}" height="34" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="32" y="217" class="card-meta">DB: pickup_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 2: manifest-service -->
      <g transform="translate(20, 340)">
        <rect width="{c_w - 40}" height="255" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="38" x2="{c_w - 40}" y2="38" stroke="#000000" stroke-width="1"/>
        <text x="20" y="26" class="card-title">2. manifest-service (:3005)</text>
        <rect x="{c_w - 40 - 130}" y="9" width="112" height="22" rx="3" fill="#000000"/>
        <text x="{c_w - 40 - 74}" y="25" font-size="11.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">MIDDLE-MILE</text>
        
        <text x="20" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Đóng bao niêm phong (SealBag):</tspan> Gom hàng trăm bưu kiện cùng tuyến vào 1 bao</text>
        <text x="20" y="96" class="card-bullet"><tspan class="card-bullet-bold">• Bảng kê trung chuyển (Manifest):</tspan> Lập danh mục bưu phẩm chuyển giữa các Hub</text>
        <text x="20" y="124" class="card-bullet"><tspan class="card-bullet-bold">• Bàn giao xe tải:</tspan> Quản lý biên bản bàn giao xe tải đường trục, kiểm soát mã niêm chì</text>
        <text x="20" y="152" class="card-bullet"><tspan class="card-bullet-bold">• Đồng bộ hành trình:</tspan> Theo dõi chuyến xe liên tỉnh và xác nhận mở bao tại kho đích</text>
        
        <rect x="20" y="195" width="{c_w - 80}" height="34" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="32" y="217" class="card-meta">DB: manifest_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 3: scan-service -->
      <g transform="translate(20, 625)">
        <rect width="{c_w - 40}" height="265" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="38" x2="{c_w - 40}" y2="38" stroke="#000000" stroke-width="1"/>
        <text x="20" y="26" class="card-title">3. scan-service (:3006)</text>
        <rect x="{c_w - 40 - 130}" y="9" width="112" height="22" rx="3" fill="#000000"/>
        <text x="{c_w - 40 - 74}" y="25" font-size="11.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">INVENTORY</text>
        
        <text x="20" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Trạm quét mã tốc độ cao:</tspan> Nhập kho (INBOUND), Xuất kho (OUTBOUND), Trung chuyển</text>
        <text x="20" y="96" class="card-bullet"><tspan class="card-bullet-bold">• Sổ cái kiểm kê tồn kho:</tspan> HubInventoryLedger cập nhật tức thì vị trí kiện hàng</text>
        <text x="20" y="124" class="card-bullet"><tspan class="card-bullet-bold">• Phát hiện bất thường:</tspan> Cảnh báo kiện thừa, kiện thiếu, rách vỡ bao bì (DamageReport)</text>
        <text x="20" y="152" class="card-bullet"><tspan class="card-bullet-bold">• Biên bản bất thường (BBBT):</tspan> Lập hồ sơ bằng chứng trong vòng 24h quy định</text>
        
        <rect x="20" y="205" width="{c_w - 80}" height="34" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="32" y="227" class="card-meta">DB: scan_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>
    </g>

    <!-- ================= CLUSTER 2: DISPATCH & LAST-MILE ================= -->
    <g transform="translate({inner_pad + c_w + c_gap}, 60)">
      <rect width="{c_w}" height="910" rx="7" fill="#FAFAFA" stroke="#000000" stroke-width="1.5"/>
      <rect width="{c_w}" height="38" rx="7" fill="#E5E7EB" stroke="#000000" stroke-width="1.2"/>
      <text x="22" y="25" class="cluster-title">CỤM 2: DISPATCH &amp; LAST-MILE (ĐIỀU PHỐI &amp; GIAO HÀNG)</text>

      <!-- Svc 4: dispatch-service -->
      <g transform="translate(20, 55)">
        <rect width="{c_w - 40}" height="405" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="38" x2="{c_w - 40}" y2="38" stroke="#000000" stroke-width="1"/>
        <text x="20" y="26" class="card-title">4. dispatch-service (:3004)</text>
        <rect x="{c_w - 40 - 130}" y="9" width="112" height="22" rx="3" fill="#000000"/>
        <text x="{c_w - 40 - 74}" y="25" font-size="11.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">DISPATCHING</text>
        
        <text x="20" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Phân bổ tác vụ tự động:</tspan> Tự động gán nhiệm vụ gom (Pickup) &amp; phát (Delivery)</text>
        <text x="20" y="100" class="card-bullet"><tspan class="card-bullet-bold">• Thuật toán tuyến địa giới:</tspan> Gom đơn theo polygon ranh giới phường/xã phụ trách</text>
        <text x="20" y="132" class="card-bullet"><tspan class="card-bullet-bold">• Cân bằng tải bưu tá:</tspan> Courier Workload Balancing theo số đơn và lịch sử cuốc</text>
        <text x="20" y="164" class="card-bullet"><tspan class="card-bullet-bold">• Can thiệp điều hành Ops:</tspan> Cho phép Trưởng bưu cục gán lại việc khẩn cấp (Reassign)</text>
        <text x="20" y="196" class="card-bullet"><tspan class="card-bullet-bold">• Nhật ký kiểm toán phân công:</tspan> OpsAuditLog lưu vết toàn bộ thay đổi người thực hiện</text>
        <text x="20" y="228" class="card-bullet"><tspan class="card-bullet-bold">• Giám sát hạn chót (SLA):</tspan> Cảnh báo tác vụ sắp quá hạn deadline cam kết khách hàng</text>
        <text x="20" y="260" class="card-bullet"><tspan class="card-bullet-bold">• Đánh giá hiệu suất:</tspan> Ghi nhận tỷ lệ tài xế chấp nhận/từ chối cuốc tác nghiệp</text>
        <text x="20" y="292" class="card-bullet"><tspan class="card-bullet-bold">• Dự báo tải bưu cục:</tspan> Thuật toán thống kê phân bổ ca kíp trực giờ cao điểm</text>
        
        <rect x="20" y="338" width="{c_w - 80}" height="36" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="32" y="361" class="card-meta">DB: dispatch_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 5: delivery-service -->
      <g transform="translate(20, 495)">
        <rect width="{c_w - 40}" height="395" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="38" x2="{c_w - 40}" y2="38" stroke="#000000" stroke-width="1"/>
        <text x="20" y="26" class="card-title">5. delivery-service (:3007)</text>
        <rect x="{c_w - 40 - 130}" y="9" width="112" height="22" rx="3" fill="#000000"/>
        <text x="{c_w - 40 - 74}" y="25" font-size="11.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">LAST-MILE</text>
        
        <text x="20" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Quản lý chuyến phát hàng:</tspan> Tổ chức theo ca phát DeliveryRun &amp; điểm dừng DeliveryStop</text>
        <text x="20" y="100" class="card-bullet"><tspan class="card-bullet-bold">• Bằng chứng điện tử (POD):</tspan> Ảnh chụp gói hàng thực tế + Chữ ký số người nhận</text>
        <text x="20" y="132" class="card-bullet"><tspan class="card-bullet-bold">• Xử lý giao thất bại:</tspan> DeliveryIncident phân loại lý do (Khách dời ngày, Sai địa chỉ)</text>
        <text x="20" y="164" class="card-bullet"><tspan class="card-bullet-bold">• Cơ chế hẹn giao lại:</tspan> Tự động lập lịch phát lại (Tối đa 3 lần) trước khi chuyển hoàn</text>
        <text x="20" y="196" class="card-bullet"><tspan class="card-bullet-bold">• Kích hoạt đối soát COD:</tspan> Sự kiện DELIVERY.DELIVERED kích hoạt ghi nhận tiền tức thì</text>
        <text x="20" y="228" class="card-bullet"><tspan class="card-bullet-bold">• Tích hợp định vị GPS:</tspan> Ghi nhận tọa độ bưu tá tại thời điểm xác nhận giao thành công</text>
        <text x="20" y="260" class="card-bullet"><tspan class="card-bullet-bold">• Mã hóa chứng từ bảo mật:</tspan> Lưu trữ an toàn chứng từ chữ ký và ảnh chụp hiện trường</text>
        
        <rect x="20" y="328" width="{c_w - 80}" height="36" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="32" y="351" class="card-meta">DB: delivery_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>
    </g>

    <!-- ================= CLUSTER 3: CORE SHIPMENT & IDENTITY ================= -->
    <g transform="translate({inner_pad + (c_w + c_gap)*2}, 60)">
      <rect width="{c_w}" height="910" rx="7" fill="#FAFAFA" stroke="#000000" stroke-width="1.5"/>
      <rect width="{c_w}" height="38" rx="7" fill="#E5E7EB" stroke="#000000" stroke-width="1.2"/>
      <text x="22" y="25" class="cluster-title">CỤM 3: CORE SHIPMENT &amp; IDENTITY (VẬN ĐƠN &amp; NỀN TẢNG)</text>

      <!-- Svc 6: shipment-service -->
      <g transform="translate(20, 55)">
        <rect width="{c_w - 40}" height="360" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>
        <line x1="0" y1="38" x2="{c_w - 40}" y2="38" stroke="#000000" stroke-width="1.2"/>
        <text x="20" y="26" class="card-title">6. shipment-service (:3002) [CANONICAL OWNER]</text>
        <rect x="{c_w - 40 - 140}" y="9" width="122" height="22" rx="3" fill="#000000"/>
        <text x="{c_w - 40 - 79}" y="25" font-size="11.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">SINGLE TRUTH</text>
        
        <text x="20" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Chân lý trạng thái duy nhất:</tspan> Quản lý toàn vẹn máy FSM 19 trạng thái vận đơn</text>
        <text x="20" y="98" class="card-bullet"><tspan class="card-bullet-bold">• Khóa bi quan (Pessimistic Lock):</tspan> Cờ isLocked = true khi có tranh chấp / đổi địa chỉ</text>
        <text x="20" y="128" class="card-bullet"><tspan class="card-bullet-bold">• Quản lý kiện hàng chi tiết:</tspan> Người gửi, người nhận, kích thước &amp; gói hàng con</text>
        <text x="20" y="158" class="card-bullet"><tspan class="card-bullet-bold">• Phân hệ Điều tra (Investigation):</tspan> Hồ sơ thất lạc, rách vỡ &amp; biên bản giải trình 24h</text>
        <text x="20" y="188" class="card-bullet"><tspan class="card-bullet-bold">• Quyết toán Bồi thường (Claim):</tspan> Phân định tỷ lệ lỗi bưu tá/bưu cục, duyệt tiền đền bù</text>
        <text x="20" y="218" class="card-bullet"><tspan class="card-bullet-bold">• Phát hành sự kiện gốc:</tspan> SHIPMENT.CREATED, CANCELLED, ADDRESS_CHANGED</text>
        <text x="20" y="248" class="card-bullet"><tspan class="card-bullet-bold">• Thẩm định tranh chấp tự động:</tspan> Tích hợp logic khóa đơn tức thời khi phát hiện bất thường</text>
        
        <rect x="20" y="295" width="{c_w - 80}" height="36" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="32" y="318" class="card-meta">DB: shipment_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 7: auth-service -->
      <g transform="translate(20, 440)">
        <rect width="{c_w - 40}" height="205" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="38" x2="{c_w - 40}" y2="38" stroke="#000000" stroke-width="1"/>
        <text x="20" y="26" class="card-title">7. auth-service (:3010)</text>
        <rect x="{c_w - 40 - 130}" y="9" width="112" height="22" rx="3" fill="#000000"/>
        <text x="{c_w - 40 - 74}" y="25" font-size="11.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">IAM &amp; RBAC</text>
        
        <text x="20" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Định danh người dùng:</tspan> Quản lý tài khoản toàn hệ thống, mã hóa chuẩn Argon2id</text>
        <text x="20" y="98" class="card-bullet"><tspan class="card-bullet-bold">• Quản lý phiên làm việc:</tspan> Bảng auth_sessions, Thu hồi Refresh Token tức thì</text>
        <text x="20" y="128" class="card-bullet"><tspan class="card-bullet-bold">• Phân quyền 2 lớp:</tspan> RBAC trên Web + Mobile Permission Overrides cho bưu tá</text>
        
        <rect x="20" y="152" width="{c_w - 80}" height="34" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="32" y="174" class="card-meta">DB: auth_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 8: masterdata-service -->
      <g transform="translate(20, 670)">
        <rect width="{c_w - 40}" height="220" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="38" x2="{c_w - 40}" y2="38" stroke="#000000" stroke-width="1"/>
        <text x="20" y="26" class="card-title">8. masterdata-service (:3001)</text>
        <rect x="{c_w - 40 - 130}" y="9" width="112" height="22" rx="3" fill="#000000"/>
        <text x="{c_w - 40 - 74}" y="25" font-size="11.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">MASTERDATA</text>
        
        <text x="20" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Mạng lưới bưu cục:</tspan> Mã hub toàn quốc, tọa độ định vị GPS, bán kính phục vụ</text>
        <text x="20" y="98" class="card-bullet"><tspan class="card-bullet-bold">• Bản đồ hành chính:</tspan> 63 tỉnh/thành phố, ranh giới tuyến bưu tá, SLA giao hàng</text>
        <text x="20" y="128" class="card-bullet"><tspan class="card-bullet-bold">• Chính sách vùng miền:</tspan> Quy định phụ phí hải đảo, vùng sâu vùng xa, biên giới</text>
        
        <rect x="20" y="165" width="{c_w - 80}" height="34" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="32" y="187" class="card-meta">DB: masterdata_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>
    </g>

    <!-- ================= CLUSTER 4: FINANCE, PRICING & ANALYTICS ================= -->
    <g transform="translate({inner_pad + (c_w + c_gap)*3}, 60)">
      <rect width="{c_w}" height="910" rx="7" fill="#FAFAFA" stroke="#000000" stroke-width="1.5"/>
      <rect width="{c_w}" height="38" rx="7" fill="#E5E7EB" stroke="#000000" stroke-width="1.2"/>
      <text x="22" y="25" class="cluster-title">CỤM 4: FINANCE, PRICING &amp; ANALYTICS (TÀI CHÍNH &amp; GIÁ)</text>

      <!-- Svc 9: payment-service -->
      <g transform="translate(20, 55)">
        <rect width="{c_w - 40}" height="210" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="38" x2="{c_w - 40}" y2="38" stroke="#000000" stroke-width="1"/>
        <text x="20" y="26" class="card-title">9. payment-service (:3011)</text>
        <rect x="{c_w - 40 - 130}" y="9" width="112" height="22" rx="3" fill="#000000"/>
        <text x="{c_w - 40 - 74}" y="25" font-size="11.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">COD &amp; PAY</text>
        
        <text x="20" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Dòng tiền COD:</tspan> Quản lý tiền thu hộ, sinh mã VietQR động theo từng vận đơn</text>
        <text x="20" y="98" class="card-bullet"><tspan class="card-bullet-bold">• Nộp tiền bưu tá:</tspan> Phiên nộp tiền mặt về bưu cục (CodRemittanceSession)</text>
        <text x="20" y="128" class="card-bullet"><tspan class="card-bullet-bold">• Đối soát Shop:</tspan> Quyết toán ví Merchant, Webhook ngân hàng tự động gạch nợ</text>
        
        <rect x="20" y="155" width="{c_w - 80}" height="34" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="32" y="177" class="card-meta">DB: payment_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 10: pricing-service -->
      <g transform="translate(20, 285)">
        <rect width="{c_w - 40}" height="180" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="38" x2="{c_w - 40}" y2="38" stroke="#000000" stroke-width="1"/>
        <text x="20" y="26" class="card-title">10. pricing-service (:3012)</text>
        <rect x="{c_w - 40 - 130}" y="9" width="112" height="22" rx="3" fill="#000000"/>
        <text x="{c_w - 40 - 74}" y="25" font-size="11.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">PRICING</text>
        
        <text x="20" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Quy chuẩn cước IATA:</tspan> Trọng lượng thực vs Thể tích quy đổi (D x R x C / 5000)</text>
        <text x="20" y="98" class="card-bullet"><tspan class="card-bullet-bold">• Bảng giá bậc thang:</tspan> Tính cước theo vùng miền, phụ phí bảo hiểm &amp; chiết khấu</text>
        <text x="20" y="128" class="card-bullet"><tspan class="card-bullet-bold">• Dự toán chi phí:</tspan> Cung cấp API tính trước giá cước tức thì cho Portal Shop</text>
      </g>

      <!-- Svc 11: reporting-service -->
      <g transform="translate(20, 485)">
        <rect width="{c_w - 40}" height="190" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="38" x2="{c_w - 40}" y2="38" stroke="#000000" stroke-width="1"/>
        <text x="20" y="26" class="card-title">11. reporting-service (:3009)</text>
        <rect x="{c_w - 40 - 130}" y="9" width="112" height="22" rx="3" fill="#000000"/>
        <text x="{c_w - 40 - 74}" y="25" font-size="11.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">ANALYTICS</text>
        
        <text x="20" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Tổng hợp OLAP:</tspan> Chụp snapshot hiệu suất bưu cục hàng ngày (DailySnapshot)</text>
        <text x="20" y="98" class="card-bullet"><tspan class="card-bullet-bold">• Chỉ số KPI bưu tá:</tspan> Tỷ lệ phát thành công, Tốc độ giao hàng, Tỷ lệ trễ SLA</text>
        
        <rect x="20" y="135" width="{c_w - 80}" height="34" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="32" y="157" class="card-meta">DB: reporting_db (PostgreSQL 16) | Pattern: CQRS Read-Model</text>
      </g>

      <!-- Svc 12 & 13: tracking-service & ai-assistant-service -->
      <g transform="translate(20, 695)">
        <rect width="{c_w - 40}" height="195" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="38" x2="{c_w - 40}" y2="38" stroke="#000000" stroke-width="1"/>
        <text x="20" y="26" class="card-title">12. tracking (:3008) &amp; 13. ai-assistant (:3013)</text>
        <rect x="{c_w - 40 - 130}" y="9" width="112" height="22" rx="3" fill="#000000"/>
        <text x="{c_w - 40 - 74}" y="25" font-size="11.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">EXTENSIONS</text>
        
        <text x="20" y="68" class="card-bullet"><tspan class="card-bullet-bold">• tracking-service:</tspan> Lưu trữ Timeline truy vết bưu phẩm (DB: tracking_db)</text>
        <text x="20" y="98" class="card-bullet"><tspan class="card-bullet-bold">• ai-assistant-service:</tspan> Trợ lý thông minh hỗ trợ tra cứu nhanh &amp; điều hướng</text>
        <text x="20" y="140" class="card-meta">Mô hình AI chuyên sâu sẽ được biểu diễn độc lập tại Figma Page 2</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTOR: TIER 3 -> TIERS 4 & 5 (y: 1885 to 2015, gap = 130)
    # 100% FIGMA-SAFE INLINE VECTOR ARROWS (BIDIRECTIONAL)
    # =========================================================================
    infra_gap = 70
    infra_w = (content_w - infra_gap) // 2  # (3460 - 70) // 2 = 1695px
    p_left = margin_x + infra_w // 2
    p_right = margin_x + infra_w + infra_gap + infra_w // 2

    lines.append(f'''
  <!-- CONNECTOR BUS: TIER 3 -> TIERS 4 & 5 -->
  <g id="Bus_3_to_4_and_5">
    <!-- ================= Left Branch to RabbitMQ ================= -->
    <!-- Downward Publish Trunk (left - 180) -->
    <line x1="{p_left - 180}" y1="1885" x2="{p_left - 180}" y2="2015" stroke="#000000" stroke-width="2"/>
    <polygon points="{p_left - 189},2001 {p_left - 180},2015 {p_left - 171},2001" fill="#000000"/>

    <!-- Upward Subscribe Trunk (left + 180) -->
    <line x1="{p_left + 180}" y1="1885" x2="{p_left + 180}" y2="2015" stroke="#000000" stroke-width="2"/>
    <polygon points="{p_left + 171},1899 {p_left + 180},1885 {p_left + 189},1899" fill="#000000"/>

    <!-- Center Badge Left -->
    <rect x="{p_left - 360}" y="1932" width="720" height="36" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
    <text x="{p_left}" y="1955" class="flow-label" text-anchor="middle">EVENT BUS: Transactional Outbox Workers • AMQP 0-9-1 Reliable Publish &amp; Consume</text>

    <!-- ================= Right Branch to Databases & Redis ================= -->
    <!-- Downward Query Trunk (right - 180) -->
    <line x1="{p_right - 180}" y1="1885" x2="{p_right - 180}" y2="2015" stroke="#000000" stroke-width="2"/>
    <polygon points="{p_right - 189},2001 {p_right - 180},2015 {p_right - 171},2001" fill="#000000"/>

    <!-- Upward Return Trunk (right + 180) -->
    <line x1="{p_right + 180}" y1="1885" x2="{p_right + 180}" y2="2015" stroke="#000000" stroke-width="2"/>
    <polygon points="{p_right + 171},1899 {p_right + 180},1885 {p_right + 189},1899" fill="#000000"/>

    <!-- Center Badge Right -->
    <rect x="{p_right - 360}" y="1932" width="720" height="36" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
    <text x="{p_right}" y="1955" class="flow-label" text-anchor="middle">STORAGE MESH: Decoupled Connection Pools • Prisma Engine • Redis Cache Mesh</text>
  </g>
''')

    # =========================================================================
    # TẦNG 4 & TẦNG 5: DUAL INFRASTRUCTURE TIER (y: 2015 to 2905, h: 890)
    # ULTRA-SPACIOUS: INFRA_W = 1695px
    # =========================================================================
    sub_col_w = (infra_w - 48 - 24) // 2  # (1695 - 72) // 2 = 811px

    lines.append(f'''
  <!-- TIER 4: EVENT-DRIVEN MESSAGE BROKER (LEFT HALF, w: {infra_w}) -->
  <g id="Tier_4_RabbitMQ" transform="translate({margin_x}, 2015)">
    <rect width="{infra_w}" height="890" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{infra_w}" height="44" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="20" y="13" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="36" y="29" class="tier-header">TẦNG 4: EVENT-DRIVEN MESSAGE BROKER &amp; ASYNC SAGA MESH (RABBITMQ AMQP)</text>
    <text x="{infra_w - 24}" y="29" class="tier-badge" text-anchor="end">EVENTUAL CONSISTENCY • TRANSACTIONAL OUTBOX PATTERN</text>
    
    <!-- Exchange Architecture Box -->
    <g transform="translate(24, 60)">
      <rect width="{infra_w - 48}" height="135" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <text x="24" y="30" class="card-title">Cấu trúc Sàn giao dịch Thông điệp (RabbitMQ Exchange Topology)</text>
      <text x="24" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Topic Exchange trung tâm (nexus.logistics.topic):</tspan> Phân phối sự kiện bất đồng bộ theo Routing Key phân cấp (vd: shipment.event.created)</text>
      <text x="24" y="88" class="card-bullet"><tspan class="card-bullet-bold">• Xử lý lỗi &amp; Tự phục hồi (Dead Letter Exchange - nexus.dlx):</tspan> Hàng đợi Retry lũy tiến (Exponential Backoff) bảo toàn 100% thông điệp</text>
      
      <!-- Mini Flow Vector Badges inside Exchange -->
      <g transform="translate(24, 100)">
        <rect x="0" y="0" width="160" height="24" rx="3" fill="#000000"/>
        <text x="80" y="16" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">PUBLISHER SERVICES</text>
        
        <line x1="165" y1="12" x2="205" y2="12" stroke="#000000" stroke-width="1.6"/>
        <polygon points="201,8 209,12 201,16" fill="#000000"/>

        <rect x="215" y="0" width="220" height="24" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
        <text x="325" y="16" font-size="11.5" font-weight="700" fill="#000000" text-anchor="middle">nexus.logistics.topic</text>
        
        <line x1="440" y1="12" x2="480" y2="12" stroke="#000000" stroke-width="1.6"/>
        <polygon points="476,8 484,12 476,16" fill="#000000"/>

        <rect x="490" y="0" width="230" height="24" rx="3" fill="#F3F4F6" stroke="#000000" stroke-width="1.2"/>
        <text x="605" y="16" font-size="11.5" font-weight="700" fill="#000000" text-anchor="middle">Routing Key Matching (*.#)</text>

        <line x1="725" y1="12" x2="765" y2="12" stroke="#000000" stroke-width="1.6"/>
        <polygon points="761,8 769,12 761,16" fill="#000000"/>

        <rect x="775" y="0" width="240" height="24" rx="3" fill="#000000"/>
        <text x="895" y="16" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">SUBSCRIBER SERVICE QUEUES</text>
      </g>
    </g>

    <!-- Outbox Pattern & Reliability Box (Left Sub-column, w: 811, h: 650) -->
    <g transform="translate(24, 215)">
      <rect width="{sub_col_w}" height="650" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <text x="24" y="32" class="card-title">Cơ chế Transactional Outbox Pattern</text>
      
      <!-- Visual 4-Step Outbox Pipeline -->
      <g transform="translate(20, 52)">
        <rect x="0" y="0" width="165" height="32" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
        <text x="82" y="21" font-size="12" font-weight="700" fill="#000000" text-anchor="middle">1. ACID Transaction</text>

        <line x1="170" y1="16" x2="198" y2="16" stroke="#000000" stroke-width="1.8"/>
        <polygon points="194,12 202,16 194,20" fill="#000000"/>

        <rect x="206" y="0" width="165" height="32" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
        <text x="288" y="21" font-size="12" font-weight="700" fill="#000000" text-anchor="middle">2. OutboxEvent Table</text>

        <line x1="375" y1="16" x2="403" y2="16" stroke="#000000" stroke-width="1.8"/>
        <polygon points="399,12 407,16 399,20" fill="#000000"/>

        <rect x="411" y="0" width="165" height="32" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
        <text x="493" y="21" font-size="12" font-weight="700" fill="#000000" text-anchor="middle">3. Publisher Worker</text>

        <line x1="580" y1="16" x2="608" y2="16" stroke="#000000" stroke-width="1.8"/>
        <polygon points="604,12 612,16 604,20" fill="#000000"/>

        <rect x="616" y="0" width="150" height="32" rx="4" fill="#000000"/>
        <text x="691" y="21" font-size="12" font-weight="700" fill="#FFFFFF" text-anchor="middle">4. RabbitMQ Broker</text>
      </g>

      <text x="24" y="125" class="card-bullet-bold">• 1. Triệt tiêu rủi ro Dual-Write Hazard:</text>
      <text x="40" y="153" class="card-bullet">Dữ liệu nghiệp vụ và bản ghi OutboxEvent được ghi vào cùng một transaction</text>
      <text x="40" y="179" class="card-bullet">cục bộ (ACID) của PostgreSQL. Nếu DB lỗi, sự kiện không bao giờ bị mồ côi.</text>

      <text x="24" y="228" class="card-bullet-bold">• 2. Luồng Outbox Publisher Worker:</text>
      <text x="40" y="256" class="card-bullet">Worker tiến trình nền độc lập liên tục thăm dò các bản ghi có status = PENDING,</text>
      <text x="40" y="282" class="card-bullet">bắn sự kiện vào RabbitMQ an toàn, sau đó cập nhật trạng thái sang PUBLISHED.</text>

      <text x="24" y="331" class="card-bullet-bold">• 3. Đảm bảo Idempotent Consumer:</text>
      <text x="40" y="359" class="card-bullet">Các dịch vụ nhận sự kiện luôn kiểm tra idempotencyKey trong bảng sự kiện</text>
      <text x="40" y="385" class="card-bullet">đã xử lý, ngăn chặn hoàn toàn việc cộng tiền COD hoặc trừ hàng tồn kho 2 lần.</text>

      <text x="24" y="434" class="card-bullet-bold">• 4. Cam kết giao nhận (At-Least-Once Delivery):</text>
      <text x="40" y="462" class="card-bullet">Bảo đảm 100% sự kiện được giao thành công tới Consumer, kết hợp</text>
      <text x="40" y="488" class="card-bullet">cơ chế xác nhận tường minh ack/nack từ RabbitMQ Channel.</text>

      <rect x="24" y="550" width="{sub_col_w - 48}" height="76" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <text x="40" y="574" font-size="13" font-weight="700" fill="#000000">KIỂM SOÁT TÍNH NHẤT QUÁN DỮ LIỆU ĐẾN CÙNG (EVENTUAL CONSISTENCY):</text>
      <text x="40" y="596" font-size="12.5" fill="#4B5563">Hệ thống chấp nhận độ trễ vài mili-giây để đổi lấy tính độc lập, sẵn sàng 99.99%</text>
      <text x="40" y="614" font-size="12.5" fill="#4B5563">và khả năng mở rộng quy mô dịch vụ vô hạn mà không bị thắt nút cổ chai.</text>
    </g>

    <!-- Distributed Saga Choreography Box (Right Sub-column, w: 811, h: 650) -->
    <!-- 100% FIGMA-SAFE INLINE VECTOR ARROWS FOR SAGA STEPS -->
    <g transform="translate({24 + sub_col_w + 24}, 215)">
      <rect width="{sub_col_w}" height="650" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <text x="24" y="32" class="card-title">Chuỗi Saga Phân tán Xuyên Dịch vụ (Saga Pipelines)</text>
      
      <!-- Pipeline 1: First-Mile -->
      <g transform="translate(20, 55)">
        <text x="0" y="16" class="card-bullet-bold">• 1. Luồng Thu gom Hàng tận nơi (First-Mile Saga):</text>
        <g transform="translate(0, 26)">
          <rect x="0" y="0" width="220" height="34" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="110" y="22" class="card-meta" text-anchor="middle">SHIPMENT.CREATED</text>

          <line x1="228" y1="17" x2="262" y2="17" stroke="#000000" stroke-width="1.8"/>
          <polygon points="258,12 268,17 258,22" fill="#000000"/>

          <rect x="274" y="0" width="225" height="34" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="386" y="22" class="card-meta" text-anchor="middle">PICKUP.ASSIGNED</text>

          <line x1="507" y1="17" x2="541" y2="17" stroke="#000000" stroke-width="1.8"/>
          <polygon points="537,12 547,17 537,22" fill="#000000"/>

          <rect x="553" y="0" width="215" height="34" rx="4" fill="#000000"/>
          <text x="660" y="22" font-size="12.5" font-weight="700" fill="#FFFFFF" font-family="ui-monospace, Menlo, monospace" text-anchor="middle">PICKUP.COLLECTED</text>
        </g>
      </g>

      <!-- Pipeline 2: Middle-Mile -->
      <g transform="translate(20, 155)">
        <text x="0" y="16" class="card-bullet-bold">• 2. Luồng Trung chuyển Đường trục (Middle-Mile Saga):</text>
        <g transform="translate(0, 26)">
          <rect x="0" y="0" width="220" height="34" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="110" y="22" class="card-meta" text-anchor="middle">MANIFEST.SEALED</text>

          <line x1="228" y1="17" x2="262" y2="17" stroke="#000000" stroke-width="1.8"/>
          <polygon points="258,12 268,17 258,22" fill="#000000"/>

          <rect x="274" y="0" width="225" height="34" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="386" y="22" class="card-meta" text-anchor="middle">DISPATCH.TRANSIT</text>

          <line x1="507" y1="17" x2="541" y2="17" stroke="#000000" stroke-width="1.8"/>
          <polygon points="537,12 547,17 537,22" fill="#000000"/>

          <rect x="553" y="0" width="215" height="34" rx="4" fill="#000000"/>
          <text x="660" y="22" font-size="12.5" font-weight="700" fill="#FFFFFF" font-family="ui-monospace, Menlo, monospace" text-anchor="middle">SCAN.HUB_ARRIVED</text>
        </g>
      </g>

      <!-- Pipeline 3: Last-Mile -->
      <g transform="translate(20, 255)">
        <text x="0" y="16" class="card-bullet-bold">• 3. Luồng Giao hàng &amp; Đối soát tiền COD (Last-Mile Saga):</text>
        <g transform="translate(0, 26)">
          <rect x="0" y="0" width="220" height="34" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="110" y="22" class="card-meta" text-anchor="middle">DELIVERY.DELIVERED</text>

          <line x1="228" y1="17" x2="262" y2="17" stroke="#000000" stroke-width="1.8"/>
          <polygon points="258,12 268,17 258,22" fill="#000000"/>

          <rect x="274" y="0" width="225" height="34" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="386" y="22" class="card-meta" text-anchor="middle">PAYMENT.COLLECTED</text>

          <line x1="507" y1="17" x2="541" y2="17" stroke="#000000" stroke-width="1.8"/>
          <polygon points="537,12 547,17 537,22" fill="#000000"/>

          <rect x="553" y="0" width="215" height="34" rx="4" fill="#000000"/>
          <text x="660" y="22" font-size="12.5" font-weight="700" fill="#FFFFFF" font-family="ui-monospace, Menlo, monospace" text-anchor="middle">WALLET.CREDITED</text>
        </g>
      </g>

      <!-- Pipeline 4: Claim -->
      <g transform="translate(20, 355)">
        <text x="0" y="16" class="card-bullet-bold">• 4. Luồng Xử lý Sự cố &amp; Bồi thường (Claim &amp; Incident Saga):</text>
        <g transform="translate(0, 26)">
          <rect x="0" y="0" width="220" height="34" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="110" y="22" class="card-meta" text-anchor="middle">DAMAGE.REPORTED</text>

          <line x1="228" y1="17" x2="262" y2="17" stroke="#000000" stroke-width="1.8"/>
          <polygon points="258,12 268,17 258,22" fill="#000000"/>

          <rect x="274" y="0" width="225" height="34" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="386" y="22" class="card-meta" text-anchor="middle">INVESTIGATION.LOCK</text>

          <line x1="507" y1="17" x2="541" y2="17" stroke="#000000" stroke-width="1.8"/>
          <polygon points="537,12 547,17 537,22" fill="#000000"/>

          <rect x="553" y="0" width="215" height="34" rx="4" fill="#000000"/>
          <text x="660" y="22" font-size="12.5" font-weight="700" fill="#FFFFFF" font-family="ui-monospace, Menlo, monospace" text-anchor="middle">CLAIM.APPROVED</text>
        </g>
      </g>

      <!-- Pipeline 5: Return -->
      <g transform="translate(20, 455)">
        <text x="0" y="16" class="card-bullet-bold">• 5. Luồng Trả hàng &amp; Chuyển hoàn (Return-to-Origin Saga):</text>
        <g transform="translate(0, 26)">
          <rect x="0" y="0" width="220" height="34" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="110" y="22" class="card-meta" text-anchor="middle">DELIVERY.FAILED_3RD</text>

          <line x1="228" y1="17" x2="262" y2="17" stroke="#000000" stroke-width="1.8"/>
          <polygon points="258,12 268,17 258,22" fill="#000000"/>

          <rect x="274" y="0" width="225" height="34" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="386" y="22" class="card-meta" text-anchor="middle">RETURN.INITIATED</text>

          <line x1="507" y1="17" x2="541" y2="17" stroke="#000000" stroke-width="1.8"/>
          <polygon points="537,12 547,17 537,22" fill="#000000"/>

          <rect x="553" y="0" width="215" height="34" rx="4" fill="#000000"/>
          <text x="660" y="22" font-size="12.5" font-weight="700" fill="#FFFFFF" font-family="ui-monospace, Menlo, monospace" text-anchor="middle">SHIPMENT.RETURNING</text>
        </g>
      </g>

      <rect x="20" y="550" width="{sub_col_w - 40}" height="76" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <text x="36" y="574" font-size="13" font-weight="700" fill="#000000">ĐIỀU PHỐI PHÂN TÁN CHOREOGRAPHY SAGA:</text>
      <text x="36" y="596" font-size="12.5" fill="#4B5563">Giao tiếp hoàn toàn hướng sự kiện (Event-Driven), loại bỏ tuyệt đối cơ chế khóa 2PC,</text>
      <text x="36" y="614" font-size="12.5" fill="#4B5563">bảo đảm tính tự chủ hoàn toàn của từng Bounded Context trong hệ thống.</text>
    </g>
  </g>

  <!-- TIER 5: PERSISTENCE & CACHE INFRASTRUCTURE (RIGHT HALF, w: {infra_w}) -->
  <g id="Tier_5_Persistence" transform="translate({margin_x + infra_w + infra_gap}, 2015)">
    <rect width="{infra_w}" height="890" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{infra_w}" height="44" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="20" y="13" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="36" y="29" class="tier-header">TẦNG 5: DECOUPLED PERSISTENCE &amp; CACHE (DATABASE-PER-SERVICE)</text>
    <text x="{infra_w - 24}" y="29" class="tier-badge" text-anchor="end">11x ISOLATED POSTGRESQL 16 • DISTRIBUTED REDIS CACHE MESH</text>
    
    <!-- 11 Databases Grid Box (w: 1647, h: 480) -->
    <g transform="translate(24, 60)">
      <rect width="{infra_w - 48}" height="480" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <text x="24" y="32" class="card-title">Hệ Sinh Thái 11 Cơ Sở Dữ Liệu PostgreSQL 16 Độc Lập (Database-per-Service Architecture)</text>
      <text x="24" y="60" class="card-bullet"><tspan class="card-bullet-bold">• Nguyên tắc Vàng:</tspan> Tuyệt đối không dùng Foreign Key giữa các cơ sở dữ liệu; Mỗi service hoàn toàn tự chủ schema</text>
      <text x="24" y="86" class="card-bullet"><tspan class="card-bullet-bold">• Khóa phân tán (Distributed Saga Keys):</tspan> shipmentCode, hubCode, courierId, merchantId là cầu nối liên kết logic</text>

      <!-- 11 Database Cards (3 Rows, Huge & Spacious) -->
      <!-- Row 1 (4 DBs, w: 388 each) -->
      <g transform="translate(20, 110)">
        <rect width="388" height="100" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="18" y="28" class="chip-text">1. auth_db (:3010)</text>
        <text x="370" y="28" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="18" y="58" class="card-bullet">• UserAccount, AuthSession, Roles</text>
        <text x="18" y="82" class="card-meta">IAM, RBAC &amp; Mobile Overrides</text>

        <rect x="408" y="0" width="388" height="100" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="426" y="28" class="chip-text">2. masterdata_db (:3001)</text>
        <text x="778" y="28" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="426" y="58" class="card-bullet">• Hubs, GPS Zones, SLA Configs</text>
        <text x="426" y="82" class="card-meta">Bưu cục, Tuyến xã/phường</text>

        <rect x="816" y="0" width="388" height="100" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="834" y="28" class="chip-text">3. shipment_db (:3002)</text>
        <text x="1186" y="28" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="834" y="58" class="card-bullet">• Shipments, ChangeRequests, Claims</text>
        <text x="834" y="82" class="card-meta">Canonical 19-State FSM</text>

        <rect x="1224" y="0" width="388" height="100" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="1242" y="28" class="chip-text">4. pickup_db (:3003)</text>
        <text x="1594" y="28" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="1242" y="58" class="card-bullet">• PickupRequests, PickupItems</text>
        <text x="1242" y="82" class="card-meta">Gom hàng tận nơi tại Shop</text>
      </g>

      <!-- Row 2 (4 DBs, w: 388 each) -->
      <g transform="translate(20, 225)">
        <rect width="388" height="100" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="18" y="28" class="chip-text">5. dispatch_db (:3004)</text>
        <text x="370" y="28" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="18" y="58" class="card-bullet">• Tasks, TaskAssignments, OpsLogs</text>
        <text x="18" y="82" class="card-meta">Điều phối bưu tá theo tuyến</text>

        <rect x="408" y="0" width="388" height="100" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="426" y="28" class="chip-text">6. manifest_db (:3005)</text>
        <text x="778" y="28" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="426" y="58" class="card-bullet">• Manifests, SealBags, Linehaul</text>
        <text x="426" y="82" class="card-meta">Bảng kê &amp; Niêm phong trung chuyển</text>

        <rect x="816" y="0" width="388" height="100" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="834" y="28" class="chip-text">7. scan_db (:3006)</text>
        <text x="1186" y="28" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="834" y="58" class="card-bullet">• ScanAudits, InventoryLedgers</text>
        <text x="834" y="82" class="card-meta">Kiểm kê tồn kho bưu cục</text>

        <rect x="1224" y="0" width="388" height="100" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="1242" y="28" class="chip-text">8. delivery_db (:3007)</text>
        <text x="1594" y="28" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="1242" y="58" class="card-bullet">• DeliveryRuns, Stops, POD Proofs</text>
        <text x="1242" y="82" class="card-meta">Chuyến phát chặng cuối &amp; POD</text>
      </g>

      <!-- Row 3 (3 DBs, w: 524 each) -->
      <g transform="translate(20, 340)">
        <rect width="524" height="100" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="18" y="28" class="chip-text">9. payment_db (:3011)</text>
        <text x="506" y="28" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="18" y="58" class="card-bullet">• PaymentRecords, CodSessions, Wallets</text>
        <text x="18" y="82" class="card-meta">Dòng tiền COD, VietQR &amp; Đối soát ví</text>

        <rect x="544" y="0" width="524" height="100" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="562" y="28" class="chip-text">10. tracking_db (:3008)</text>
        <text x="1050" y="28" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="562" y="58" class="card-bullet">• TrackingCheckpoints, PublicCache</text>
        <text x="562" y="82" class="card-meta">Timeline hành trình kiện hàng thời gian thực</text>

        <rect x="1088" y="0" width="524" height="100" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="1106" y="28" class="chip-text">11. reporting_db (:3009)</text>
        <text x="1594" y="28" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="1106" y="58" class="card-bullet">• DailySnapshots, CourierKPIs, SLA Stats</text>
        <text x="1106" y="82" class="card-meta">Kho tổng hợp OLAP &amp; Báo cáo điều hành</text>
      </g>
    </g>

    <!-- Redis Distributed Cache Cluster Box (w: 1647, h: 305) -->
    <g transform="translate(24, 560)">
      <rect width="{infra_w - 48}" height="305" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <text x="24" y="32" class="card-title">Cụm Bộ Nhớ Đệm Phân Tán (Redis Distributed Cache Mesh :6379)</text>
      
      <g transform="translate(20, 52)">
        <rect width="{(infra_w - 48 - 40 - 40) // 3}" height="225" rx="5" fill="#FAFAFA" stroke="#000000" stroke-width="1.2"/>
        <text x="20" y="30" class="chip-text">1. PublicTrackingCache</text>
        <text x="20" y="66" class="card-bullet">• Bộ đệm Timeline hành trình đơn hàng</text>
        <text x="20" y="96" class="card-bullet">• TTL = 300s (5 phút) cho các mốc quét</text>
        <text x="20" y="126" class="card-bullet">• Giải tỏa 92% tải đọc trực tiếp từ</text>
        <text x="20" y="152" class="card-bullet">cơ sở dữ liệu tracking_db chính</text>
        <text x="20" y="195" class="card-meta">Key: tracking:shipment:NX-XXXXXX</text>
      </g>

      <g transform="translate({20 + (infra_w - 48 - 40 - 40) // 3 + 20}, 52)">
        <rect width="{(infra_w - 48 - 40 - 40) // 3}" height="225" rx="5" fill="#FAFAFA" stroke="#000000" stroke-width="1.2"/>
        <text x="20" y="30" class="chip-text">2. Session &amp; Token Blacklist</text>
        <text x="20" y="66" class="card-bullet">• Quản lý phiên đăng nhập phân tán</text>
        <text x="20" y="96" class="card-bullet">• Danh sách đen thu hồi Refresh Token</text>
        <text x="20" y="126" class="card-bullet">• Đăng xuất lập tức trên mọi thiết bị khi</text>
        <text x="20" y="152" class="card-bullet">phát hiện tài khoản bị xâm phạm</text>
        <text x="20" y="195" class="card-meta">Key: session:revoked:TOKEN_JTI</text>
      </g>

      <g transform="translate({20 + ((infra_w - 48 - 40 - 40) // 3 + 20)*2}, 52)">
        <rect width="{(infra_w - 48 - 40 - 40) // 3}" height="225" rx="5" fill="#FAFAFA" stroke="#000000" stroke-width="1.2"/>
        <text x="20" y="30" class="chip-text">3. RateLimitRegistry</text>
        <text x="20" y="66" class="card-bullet">• Đồng hồ đếm tần suất truy cập API</text>
        <text x="20" y="96" class="card-bullet">• Sliding-Window Counter theo IP &amp; Token</text>
        <text x="20" y="126" class="card-bullet">• Ngăn chặn tấn công Brute-force và</text>
        <text x="20" y="152" class="card-bullet">cào dữ liệu bưu kiện tự động</text>
        <text x="20" y="195" class="card-meta">Key: ratelimit:ip:CLIENT_IP</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # FOOTER BAR (y: 2920 to 2978, h: 58)
    # =========================================================================
    lines.append(f'''
  <!-- FOOTER BAR -->
  <g id="FooterBar" transform="translate({margin_x}, 2920)">
    <rect width="{content_w}" height="58" rx="8" fill="#F9FAFB" stroke="#000000" stroke-width="1.8"/>
    <circle cx="28" cy="29" r="6" fill="#000000"/>
    <text x="48" y="34" font-size="14.5" font-weight="700" fill="#000000">GHI CHÚ KỸ THUẬT KIẾN TRÚC:</text>
    <text x="305" y="34" font-size="14" fill="#1F2937">Bản vẽ kiến trúc hệ thống tổng thể theo chuẩn UML Component &amp; Enterprise Architecture Deployment Blueprint • Ánh xạ 100% dịch vụ và cơ sở dữ liệu thực tế trong mã nguồn dự án</text>
    <text x="{content_w - 28}" y="34" font-size="14" font-weight="600" fill="#4B5563" text-anchor="end">Nexus Express Software Engineering Thesis • Section 1.2</text>
  </g>
</svg>
''')

    full_svg = "\n".join(lines)
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(full_svg)

    # Validate XML
    ET.fromstring(full_svg)
    print(f"Generated and validated: {OUTPUT_FILE} ({len(full_svg)} bytes)")

if __name__ == "__main__":
    build_architecture_svg()
