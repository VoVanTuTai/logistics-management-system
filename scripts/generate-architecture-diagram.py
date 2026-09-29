#!/usr/bin/env python3
"""
generate-architecture-diagram.py
Generates the ultra-spacious, high-legibility Enterprise Architecture & Deployment Diagram (5-Tier)
for the Nexus Logistics Management System graduation thesis.

Outputs to:
  docs/graduation-thesis/figma-page-1-system-and-data/diagrams/02-architecture-deployment-4-tier.svg
Standardized Dimensions (Ultra-Spacious & High Breathing Room):
  Width: 3200px, Height: 2500px
Style:
  Monochrome Technical Blueprint (Trắng - Đen - Xám chuẩn kỹ thuật, Figma 100% vector-safe)
"""

import xml.etree.ElementTree as ET
import html
import os

OUTPUT_FILE = "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/02-architecture-deployment-4-tier.svg"

def escape(text):
    return html.escape(str(text))

def build_architecture_svg():
    width = 3200
    height = 2500
    lines = []

    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # Double Blueprint Frame
    lines.append(f'''
  <!-- Double Technical Blueprint Frame -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <rect x="18" y="18" width="{width - 36}" height="{height - 36}" fill="none" stroke="#000000" stroke-width="2.6"/>
  <rect x="28" y="28" width="{width - 56}" height="{height - 56}" fill="none" stroke="#000000" stroke-width="1.2"/>

  <style>
    text {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }}
    
    .hdr-badge {{ font-size: 14px; font-weight: 700; fill: #FFFFFF; letter-spacing: 1.5px; text-transform: uppercase; }}
    .hdr-title {{ font-size: 30px; font-weight: 800; fill: #000000; letter-spacing: -0.6px; }}
    .hdr-sub {{ font-size: 16px; font-weight: 500; fill: #374151; }}
    
    .tier-header {{ font-size: 16px; font-weight: 800; fill: #000000; letter-spacing: 1px; text-transform: uppercase; }}
    .tier-badge {{ font-size: 13px; font-weight: 700; fill: #000000; text-transform: uppercase; letter-spacing: 0.6px; }}
    
    .cluster-title {{ font-size: 15.5px; font-weight: 800; fill: #000000; letter-spacing: 0.5px; text-transform: uppercase; }}
    
    .card-title {{ font-size: 16px; font-weight: 700; fill: #000000; }}
    .card-meta {{ font-size: 13px; font-weight: 600; fill: #4B5563; font-family: ui-monospace, Menlo, monospace; }}
    .card-body {{ font-size: 13.5px; font-weight: 400; fill: #1F2937; line-height: 1.6; }}
    .card-bullet {{ font-size: 13px; font-weight: 500; fill: #374151; }}
    .card-bullet-bold {{ font-size: 13px; font-weight: 700; fill: #111827; }}
    
    .flow-label {{ font-size: 13.5px; font-weight: 700; fill: #000000; letter-spacing: 0.8px; text-transform: uppercase; }}
    .chip-text {{ font-size: 13px; font-weight: 700; fill: #000000; font-family: ui-monospace, Menlo, monospace; }}
    .chip-sub {{ font-size: 11.5px; font-weight: 500; fill: #4B5563; }}
  </style>
''')

    # Dimensions setup
    margin_x = 60
    content_w = width - margin_x * 2  # 3080px
    c_w = 730                         # 4 columns of 730px each = 2920px
    c_gap = (content_w - c_w * 4) // 3 # (3080 - 2920) / 3 = 53px

    # =========================================================================
    # HEADER (y: 45 to 150, h: 105)
    # =========================================================================
    lines.append(f'''
  <!-- HEADER BAR -->
  <g id="HeaderBar" transform="translate({margin_x}, 45)">
    <rect width="{content_w}" height="105" rx="8" fill="#F9FAFB" stroke="#000000" stroke-width="2"/>
    
    <!-- Left Meta Badge -->
    <rect x="28" y="16" width="410" height="26" rx="4" fill="#000000"/>
    <text x="42" y="34" class="hdr-badge">NEXUS ENTERPRISE LOGISTICS ARCHITECTURE</text>
    
    <!-- Title & Desc -->
    <text x="28" y="68" class="hdr-title">HÌNH 1.2: SƠ ĐỒ KIẾN TRÚC TỔNG THỂ HỆ THỐNG LOGISTICS &amp; VẬN TẢI ĐA KÊNH PHÂN TÁN</text>
    <text x="28" y="92" class="hdr-sub">Kiến trúc Triển khai Doanh nghiệp Toàn diện: 4 Giao diện Đa kênh, API Gateway &amp; PII Sanitizer, 13 Microservices, Trục Sự kiện RabbitMQ Saga &amp; 11 Cơ sở Dữ liệu Độc lập</text>
    
    <!-- Right Tech Specs Chips -->
    <g transform="translate({content_w - 630}, 18)">
      <!-- Arch Chip -->
      <rect x="0" y="0" width="185" height="34" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <circle cx="18" cy="17" r="5" fill="#000000"/>
      <text x="34" y="22" font-size="12.5" font-weight="700" fill="#000000">ARCH: 5-TIER MESH</text>
      
      <!-- Messaging Chip -->
      <rect x="200" y="0" width="215" height="34" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <rect x="214" y="10" width="11" height="14" rx="1.5" fill="#000000"/>
      <text x="235" y="22" font-size="12.5" font-weight="700" fill="#000000">BROKER: RABBITMQ</text>

      <!-- DB Chip -->
      <rect x="430" y="0" width="190" height="34" rx="5" fill="#000000"/>
      <text x="525" y="22" font-size="12.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">11x POSTGRESQL 16</text>

      <text x="620" y="62" font-size="13" font-weight="600" fill="#4B5563" text-anchor="end">Decoupled Database-per-Service &amp; Distributed Saga Keys</text>
    </g>
  </g>
''')

    # =========================================================================
    # TẦNG 1: MULTI-CHANNEL CLIENT APPS (y: 205 to 425, h: 220)
    # =========================================================================
    lines.append(f'''
  <!-- TIER 1: CLIENT APPS -->
  <g id="Tier_1_Clients" transform="translate({margin_x}, 205)">
    <rect width="{content_w}" height="220" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{content_w}" height="40" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="18" y="11" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="34" y="27" class="tier-header">TẦNG 1: MULTI-CHANNEL CLIENT APPLICATIONS (GIAO DIỆN NGƯỜI DÙNG ĐA KÊNH)</text>
    <text x="{content_w - 24}" y="27" class="tier-badge" text-anchor="end">EDGE CLIENT PROTOCOLS: HTTPS / RESTFUL API / WEBSOCKET REAL-TIME EVENT STREAM</text>
    
    <!-- 4 Client Cards -->
    <!-- Card 1: Merchant Web -->
    <g transform="translate(20, 56)">
      <rect width="{c_w}" height="144" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <line x1="0" y1="36" x2="{c_w}" y2="36" stroke="#000000" stroke-width="1"/>
      <text x="20" y="25" class="card-title">Merchant Web Portal (:5174)</text>
      <text x="{c_w - 20}" y="25" class="card-meta" text-anchor="end">REACTJS 18 / VITE / TAILWIND</text>
      <text x="20" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Đối tượng sử dụng:</tspan> Chủ shop thương mại điện tử, Doanh nghiệp gửi bưu phẩm định kỳ</text>
      <text x="20" y="88" class="card-bullet"><tspan class="card-bullet-bold">• Chức năng cốt lõi:</tspan> Tạo đơn hàng loạt (Excel/API), Đặt lịch gom hàng tận nơi, Quản lý kho hàng shop</text>
      <text x="20" y="114" class="card-bullet"><tspan class="card-bullet-bold">• Quản lý tài chính:</tspan> Theo dõi đối soát tiền thu hộ COD theo đơn, Nạp/rút tiền ví điện tử Merchant</text>
    </g>

    <!-- Card 2: Operations Web -->
    <g transform="translate({20 + c_w + c_gap}, 56)">
      <rect width="{c_w}" height="144" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <line x1="0" y1="36" x2="{c_w}" y2="36" stroke="#000000" stroke-width="1"/>
      <text x="20" y="25" class="card-title">Operations Platform (:5173)</text>
      <text x="{c_w - 20}" y="25" class="card-meta" text-anchor="end">REACTJS / LEAFLET / RECHARTS</text>
      <text x="20" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Đối tượng sử dụng:</tspan> Trưởng bưu cục (Station Ops), Điều hành viên trung tâm (Dispatchers)</text>
      <text x="20" y="88" class="card-bullet"><tspan class="card-bullet-bold">• Chức năng cốt lõi:</tspan> Phân tuyến bưu tá theo phường/xã, Giám sát tồn kho bưu cục, Đóng chuyến xe</text>
      <text x="20" y="114" class="card-bullet"><tspan class="card-bullet-bold">• Sự cố &amp; Bồi thường:</tspan> Tiếp nhận kiện hàng hư hỏng/thất lạc, Thẩm định biên bản bồi thường (HITL)</text>
    </g>

    <!-- Card 3: Courier Mobile App -->
    <g transform="translate({20 + (c_w + c_gap)*2}, 56)">
      <rect width="{c_w}" height="144" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <line x1="0" y1="36" x2="{c_w}" y2="36" stroke="#000000" stroke-width="1"/>
      <text x="20" y="25" class="card-title">Courier &amp; Customer Mobile App (:8082)</text>
      <text x="{c_w - 20}" y="25" class="card-meta" text-anchor="end">REACT NATIVE / EXPO</text>
      <text x="20" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Đối tượng sử dụng:</tspan> Bưu tá thu gom / Giao hàng chặng cuối &amp; Khách hàng cá nhân gửi/nhận</text>
      <text x="20" y="88" class="card-bullet"><tspan class="card-bullet-bold">• Tác nghiệp bưu tá:</tspan> Quét mã vạch thu gom tại shop, Điều hướng lộ trình, Chụp ảnh POD ký nhận</text>
      <text x="20" y="114" class="card-bullet"><tspan class="card-bullet-bold">• Thu tiền COD:</tspan> Sinh mã VietQR động thu tiền chuyển khoản, Lập phiên nộp tiền về bưu cục</text>
    </g>

    <!-- Card 4: Guest Tracking Portal -->
    <g transform="translate({20 + (c_w + c_gap)*3}, 56)">
      <rect width="{c_w}" height="144" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <line x1="0" y1="36" x2="{c_w}" y2="36" stroke="#000000" stroke-width="1"/>
      <text x="20" y="25" class="card-title">Guest Public Tracking Portal (:5177)</text>
      <text x="{c_w - 20}" y="25" class="card-meta" text-anchor="end">REACTJS SPA / LIGHTWEIGHT</text>
      <text x="20" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Đối tượng sử dụng:</tspan> Khách vãng lai, Người nhận hàng tra cứu tiến độ bưu kiện công khai</text>
      <text x="20" y="88" class="card-bullet"><tspan class="card-bullet-bold">• Tra cứu hành trình:</tspan> Nhập mã NX-XXXXXX xem timeline chi tiết từng trạm quét (Scan Milestones)</text>
      <text x="20" y="114" class="card-bullet"><tspan class="card-bullet-bold">• Bảo mật PII:</tspan> Tự động che mờ SĐT (098***) và địa chỉ nhà riêng để bảo vệ quyền riêng tư</text>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTOR: TIER 1 -> TIER 2 (y: 425 to 495, gap = 70)
    # =========================================================================
    p1 = margin_x + 20 + c_w // 2
    p2 = margin_x + 20 + c_w + c_gap + c_w // 2
    p3 = margin_x + 20 + (c_w + c_gap)*2 + c_w // 2
    p4 = margin_x + 20 + (c_w + c_gap)*3 + c_w // 2

    lines.append(f'''
  <!-- CONNECTOR BUS: TIER 1 -> TIER 2 -->
  <g id="Bus_1_to_2">
    <line x1="{p1}" y1="425" x2="{p1}" y2="495" stroke="#000000" stroke-width="1.8"/>
    <line x1="{p2}" y1="425" x2="{p2}" y2="495" stroke="#000000" stroke-width="1.8"/>
    <line x1="{p3}" y1="425" x2="{p3}" y2="495" stroke="#000000" stroke-width="1.8"/>
    <line x1="{p4}" y1="425" x2="{p4}" y2="495" stroke="#000000" stroke-width="1.8"/>
    
    <!-- Central Bus Line -->
    <line x1="{p1 - 100}" y1="460" x2="{p4 + 100}" y2="460" stroke="#000000" stroke-width="1.6" stroke-dasharray="8,5"/>
    <rect x="{width//2 - 250}" y="444" width="500" height="32" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
    <text x="{width//2}" y="465" class="flow-label" text-anchor="middle">HTTPS / TLS 1.3 • RESTful JSON • WebSocket Event Stream</text>
    
    <polygon points="{width//2 - 8},484 {width//2},494 {width//2 + 8},484" fill="#000000"/>
  </g>
''')

    # =========================================================================
    # TẦNG 2: EDGE INGRESS, API GATEWAY & SECURITY (y: 495 to 670, h: 175)
    # =========================================================================
    lines.append(f'''
  <!-- TIER 2: API GATEWAY & SECURITY -->
  <g id="Tier_2_Gateway" transform="translate({margin_x}, 495)">
    <rect width="{content_w}" height="175" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{content_w}" height="38" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="18" y="10" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="34" y="26" class="tier-header">TẦNG 2: EDGE INGRESS, API GATEWAY &amp; SECURITY PROXY (:3000)</text>
    <text x="{content_w - 24}" y="26" class="tier-badge" text-anchor="end">SINGLE ENTRYPOINT • REVERSE PROXY • AUTHENTICATION &amp; PII PIPELINE</text>
    
    <!-- 4 Functional Gateway Blocks -->
    <!-- Block 1 -->
    <g transform="translate(20, 52)">
      <rect width="{c_w}" height="105" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <text x="20" y="28" class="card-title">Reverse Proxy &amp; Dynamic Router</text>
      <text x="20" y="58" class="card-bullet"><tspan class="card-bullet-bold">• Cửa ngõ định tuyến duy nhất:</tspan> Phân luồng URL /api/v1/* tới 13 microservices nội bộ</text>
      <text x="20" y="84" class="card-bullet"><tspan class="card-bullet-bold">• Cân bằng tải &amp; Giám sát:</tspan> Round-Robin, Kiểm tra nhịp tim định kỳ (:3000/health)</text>
    </g>

    <!-- Block 2 -->
    <g transform="translate({20 + c_w + c_gap}, 52)">
      <rect width="{c_w}" height="105" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <text x="20" y="28" class="card-title">JWT Claims &amp; RBAC Guard</text>
      <text x="20" y="58" class="card-bullet"><tspan class="card-bullet-bold">• Xác thực Access Token:</tspan> Giải mã chữ ký HMAC-SHA256, kiểm tra thời hạn (15 phút)</text>
      <text x="20" y="84" class="card-bullet"><tspan class="card-bullet-bold">• Bóc tách quyền hạn:</tspan> ADMIN, OPS, COURIER, MERCHANT; Chuyển tiếp Header nội bộ</text>
    </g>

    <!-- Block 3 -->
    <g transform="translate({20 + (c_w + c_gap)*2}, 52)">
      <rect width="{c_w}" height="105" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <text x="20" y="28" class="card-title">PII Sanitizer &amp; Data Masking</text>
      <text x="20" y="58" class="card-bullet"><tspan class="card-bullet-bold">• Khử định danh dữ liệu:</tspan> Tự động che mờ SĐT (098***) &amp; địa chỉ nhà riêng người nhận</text>
      <text x="20" y="84" class="card-bullet"><tspan class="card-bullet-bold">• Chống rò rỉ thông tin:</tspan> Bảo vệ quyền riêng tư người dùng khi tra cứu bưu kiện công khai</text>
    </g>

    <!-- Block 4 -->
    <g transform="translate({20 + (c_w + c_gap)*3}, 52)">
      <rect width="{c_w}" height="105" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <text x="20" y="28" class="card-title">Traffic Shaping &amp; Security Guard</text>
      <text x="20" y="58" class="card-bullet"><tspan class="card-bullet-bold">• Giới hạn tần suất:</tspan> Rate Limiting 60 req/min/IP chống brute-force mã vận đơn</text>
      <text x="20" y="84" class="card-bullet"><tspan class="card-bullet-bold">• Phòng thủ biên:</tspan> CORS Whitelist nghiêm ngặt, Helmet Security Headers, Chống DoS API</text>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTOR: TIER 2 -> TIER 3 (y: 670 to 740, gap = 70)
    # =========================================================================
    lines.append(f'''
  <!-- CONNECTOR BUS: TIER 2 -> TIER 3 -->
  <g id="Bus_2_to_3">
    <line x1="{p1}" y1="670" x2="{p1}" y2="740" stroke="#000000" stroke-width="1.8"/>
    <line x1="{p2}" y1="670" x2="{p2}" y2="740" stroke="#000000" stroke-width="1.8"/>
    <line x1="{p3}" y1="670" x2="{p3}" y2="740" stroke="#000000" stroke-width="1.8"/>
    <line x1="{p4}" y1="670" x2="{p4}" y2="740" stroke="#000000" stroke-width="1.8"/>
    
    <line x1="{p1 - 100}" y1="705" x2="{p4 + 100}" y2="705" stroke="#000000" stroke-width="1.6" stroke-dasharray="8,5"/>
    <rect x="{width//2 - 300}" y="689" width="600" height="32" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
    <text x="{width//2}" y="710" class="flow-label" text-anchor="middle">Internal Private Network (mTLS / VPC) • JSON RPC • Header Propagation</text>
    
    <polygon points="{p1 - 8},730 {p1},740 {p1 + 8},730" fill="#000000"/>
    <polygon points="{p2 - 8},730 {p2},740 {p2 + 8},730" fill="#000000"/>
    <polygon points="{p3 - 8},730 {p3},740 {p3 + 8},730" fill="#000000"/>
    <polygon points="{p4 - 8},730 {p4},740 {p4 + 8},730" fill="#000000"/>
  </g>
''')

    # =========================================================================
    # TẦNG 3: 13 MICROSERVICES BUSINESS DOMAIN MESH (y: 740 to 1570, h: 830)
    # =========================================================================
    lines.append(f'''
  <!-- TIER 3: MICROSERVICES MESH -->
  <g id="Tier_3_Microservices" transform="translate({margin_x}, 740)">
    <rect width="{content_w}" height="830" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{content_w}" height="42" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="18" y="12" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="34" y="28" class="tier-header">TẦNG 3: 13 MICROSERVICES BUSINESS DOMAIN MESH (LÕI NGHIỆP VỤ VẬN HÀNH PHÂN TÁN)</text>
    <text x="{content_w - 24}" y="28" class="tier-badge" text-anchor="end">13 ISOLATED BOUNDED CONTEXTS • NESTJS / EXPRESS • 100% PRISMA ORM FIDELITY</text>
    
    <!-- 4 DOMAIN CLUSTERS (w: 730 each, gap: 53) -->
    
    <!-- ================= CLUSTER 1: FIRST & MIDDLE-MILE ================= -->
    <g transform="translate(20, 58)">
      <rect width="{c_w}" height="750" rx="7" fill="#FAFAFA" stroke="#000000" stroke-width="1.5"/>
      <rect width="{c_w}" height="36" rx="7" fill="#E5E7EB" stroke="#000000" stroke-width="1.2"/>
      <text x="20" y="24" class="cluster-title">CỤM 1: FIRST &amp; MIDDLE-MILE (THU GOM &amp; KHO)</text>

      <!-- Svc 1: pickup-service -->
      <g transform="translate(18, 52)">
        <rect width="{c_w - 36}" height="210" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="36" x2="{c_w - 36}" y2="36" stroke="#000000" stroke-width="1"/>
        <text x="18" y="25" class="card-title">1. pickup-service (:3003)</text>
        <rect x="{c_w - 36 - 120}" y="9" width="105" height="20" rx="3" fill="#000000"/>
        <text x="{c_w - 36 - 67}" y="24" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">FIRST-MILE</text>
        
        <text x="18" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Tiếp nhận yêu cầu lấy hàng:</tspan> Tiếp nhận lệnh gom từ Portal Shop, xếp lịch theo ca</text>
        <text x="18" y="88" class="card-bullet"><tspan class="card-bullet-bold">• Quản lý danh mục kiện gom:</tspan> PickupRequest, danh sách PickupItem cần thu</text>
        <text x="18" y="114" class="card-bullet"><tspan class="card-bullet-bold">• Tác nghiệp bưu tá:</tspan> Quét mã vạch xác nhận thu gom, phát sự kiện PICKUP.COLLECTED</text>
        <text x="18" y="140" class="card-bullet"><tspan class="card-bullet-bold">• Xử lý ngoại lệ:</tspan> Ghi nhận lý do shop chưa sẵn sàng hàng, hủy hoặc dời lịch thu</text>
        
        <rect x="18" y="165" width="{c_w - 72}" height="28" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="30" y="184" class="card-meta">DB: pickup_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 2: manifest-service -->
      <g transform="translate(18, 282)">
        <rect width="{c_w - 36}" height="210" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="36" x2="{c_w - 36}" y2="36" stroke="#000000" stroke-width="1"/>
        <text x="18" y="25" class="card-title">2. manifest-service (:3005)</text>
        <rect x="{c_w - 36 - 120}" y="9" width="105" height="20" rx="3" fill="#000000"/>
        <text x="{c_w - 36 - 67}" y="24" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">MIDDLE-MILE</text>
        
        <text x="18" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Đóng bao niêm phong (SealBag):</tspan> Gom hàng trăm bưu kiện cùng tuyến vào 1 bao</text>
        <text x="18" y="88" class="card-bullet"><tspan class="card-bullet-bold">• Bảng kê trung chuyển (Manifest):</tspan> Lập danh mục bưu phẩm chuyển giữa các Hub</text>
        <text x="18" y="114" class="card-bullet"><tspan class="card-bullet-bold">• Bàn giao xe tải:</tspan> Quản lý biên bản bàn giao xe tải đường trục, kiểm soát mã niêm chì</text>
        <text x="18" y="140" class="card-bullet"><tspan class="card-bullet-bold">• Đồng bộ hành trình:</tspan> Theo dõi chuyến xe liên tỉnh và xác nhận mở bao tại kho đích</text>
        
        <rect x="18" y="165" width="{c_w - 72}" height="28" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="30" y="184" class="card-meta">DB: manifest_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 3: scan-service -->
      <g transform="translate(18, 512)">
        <rect width="{c_w - 36}" height="218" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="36" x2="{c_w - 36}" y2="36" stroke="#000000" stroke-width="1"/>
        <text x="18" y="25" class="card-title">3. scan-service (:3006)</text>
        <rect x="{c_w - 36 - 120}" y="9" width="105" height="20" rx="3" fill="#000000"/>
        <text x="{c_w - 36 - 67}" y="24" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">INVENTORY</text>
        
        <text x="18" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Trạm quét mã tốc độ cao:</tspan> Nhập kho (INBOUND), Xuất kho (OUTBOUND), Trung chuyển</text>
        <text x="18" y="88" class="card-bullet"><tspan class="card-bullet-bold">• Sổ cái kiểm kê tồn kho:</tspan> HubInventoryLedger cập nhật tức thì vị trí kiện hàng</text>
        <text x="18" y="114" class="card-bullet"><tspan class="card-bullet-bold">• Phát hiện bất thường:</tspan> Cảnh báo kiện thừa, kiện thiếu, rách vỡ bao bì (DamageReport)</text>
        <text x="18" y="140" class="card-bullet"><tspan class="card-bullet-bold">• Biên bản bất thường (BBBT):</tspan> Lập hồ sơ bằng chứng trong vòng 24h quy định</text>
        
        <rect x="18" y="172" width="{c_w - 72}" height="28" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="30" y="191" class="card-meta">DB: scan_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>
    </g>

    <!-- ================= CLUSTER 2: DISPATCH & LAST-MILE ================= -->
    <g transform="translate({20 + c_w + c_gap}, 58)">
      <rect width="{c_w}" height="750" rx="7" fill="#FAFAFA" stroke="#000000" stroke-width="1.5"/>
      <rect width="{c_w}" height="36" rx="7" fill="#E5E7EB" stroke="#000000" stroke-width="1.2"/>
      <text x="20" y="24" class="cluster-title">CỤM 2: DISPATCH &amp; LAST-MILE (ĐIỀU PHỐI &amp; GIAO HÀNG)</text>

      <!-- Svc 4: dispatch-service -->
      <g transform="translate(18, 52)">
        <rect width="{c_w - 36}" height="335" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="36" x2="{c_w - 36}" y2="36" stroke="#000000" stroke-width="1"/>
        <text x="18" y="25" class="card-title">4. dispatch-service (:3004)</text>
        <rect x="{c_w - 36 - 120}" y="9" width="105" height="20" rx="3" fill="#000000"/>
        <text x="{c_w - 36 - 67}" y="24" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">DISPATCHING</text>
        
        <text x="18" y="64" class="card-bullet"><tspan class="card-bullet-bold">• Phân bổ tác vụ tự động:</tspan> Tự động gán nhiệm vụ gom (Pickup) &amp; phát (Delivery)</text>
        <text x="18" y="92" class="card-bullet"><tspan class="card-bullet-bold">• Thuật toán tuyến địa giới:</tspan> Gom đơn theo polygon ranh giới phường/xã phụ trách</text>
        <text x="18" y="120" class="card-bullet"><tspan class="card-bullet-bold">• Cân bằng tải bưu tá:</tspan> Courier Workload Balancing theo số đơn và lịch sử cuốc</text>
        <text x="18" y="148" class="card-bullet"><tspan class="card-bullet-bold">• Can thiệp điều hành Ops:</tspan> Cho phép Trưởng bưu cục gán lại việc khẩn cấp (Reassign)</text>
        <text x="18" y="176" class="card-bullet"><tspan class="card-bullet-bold">• Nhật ký kiểm toán phân công:</tspan> OpsAuditLog lưu vết toàn bộ thay đổi người thực hiện</text>
        <text x="18" y="204" class="card-bullet"><tspan class="card-bullet-bold">• Giám sát hạn chót (SLA):</tspan> Cảnh báo tác vụ sắp quá hạn deadline cam kết khách hàng</text>
        <text x="18" y="232" class="card-bullet"><tspan class="card-bullet-bold">• Đánh giá hiệu suất:</tspan> Ghi nhận tỷ lệ tài xế chấp nhận/từ chối cuốc tác nghiệp</text>
        
        <rect x="18" y="285" width="{c_w - 72}" height="32" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="30" y="306" class="card-meta">DB: dispatch_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 5: delivery-service -->
      <g transform="translate(18, 405)">
        <rect width="{c_w - 36}" height="325" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="36" x2="{c_w - 36}" y2="36" stroke="#000000" stroke-width="1"/>
        <text x="18" y="25" class="card-title">5. delivery-service (:3007)</text>
        <rect x="{c_w - 36 - 120}" y="9" width="105" height="20" rx="3" fill="#000000"/>
        <text x="{c_w - 36 - 67}" y="24" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">LAST-MILE</text>
        
        <text x="18" y="64" class="card-bullet"><tspan class="card-bullet-bold">• Quản lý chuyến phát hàng:</tspan> Tổ chức theo ca phát DeliveryRun &amp; điểm dừng DeliveryStop</text>
        <text x="18" y="92" class="card-bullet"><tspan class="card-bullet-bold">• Bằng chứng điện tử (POD):</tspan> Ảnh chụp gói hàng thực tế + Chữ ký số người nhận</text>
        <text x="18" y="120" class="card-bullet"><tspan class="card-bullet-bold">• Xử lý giao thất bại:</tspan> DeliveryIncident phân loại lý do (Khách dời ngày, Sai địa chỉ)</text>
        <text x="18" y="148" class="card-bullet"><tspan class="card-bullet-bold">• Cơ chế hẹn giao lại:</tspan> Tự động lập lịch phát lại (Tối đa 3 lần) trước khi chuyển hoàn</text>
        <text x="18" y="176" class="card-bullet"><tspan class="card-bullet-bold">• Kích hoạt đối soát COD:</tspan> Sự kiện DELIVERY.DELIVERED kích hoạt ghi nhận tiền tức thì</text>
        <text x="18" y="204" class="card-bullet"><tspan class="card-bullet-bold">• Tích hợp định vị GPS:</tspan> Ghi nhận tọa độ bưu tá tại thời điểm xác nhận giao thành công</text>
        
        <rect x="18" y="275" width="{c_w - 72}" height="32" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="30" y="296" class="card-meta">DB: delivery_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>
    </g>

    <!-- ================= CLUSTER 3: CORE SHIPMENT & IDENTITY ================= -->
    <g transform="translate({20 + (c_w + c_gap)*2}, 58)">
      <rect width="{c_w}" height="750" rx="7" fill="#FAFAFA" stroke="#000000" stroke-width="1.5"/>
      <rect width="{c_w}" height="36" rx="7" fill="#E5E7EB" stroke="#000000" stroke-width="1.2"/>
      <text x="20" y="24" class="cluster-title">CỤM 3: CORE SHIPMENT &amp; IDENTITY (VẬN ĐƠN &amp; NỀN TẢNG)</text>

      <!-- Svc 6: shipment-service -->
      <g transform="translate(18, 52)">
        <rect width="{c_w - 36}" height="295" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>
        <line x1="0" y1="36" x2="{c_w - 36}" y2="36" stroke="#000000" stroke-width="1.2"/>
        <text x="18" y="25" class="card-title">6. shipment-service (:3002) [CANONICAL OWNER]</text>
        <rect x="{c_w - 36 - 130}" y="9" width="115" height="20" rx="3" fill="#000000"/>
        <text x="{c_w - 36 - 72}" y="24" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">SINGLE TRUTH</text>
        
        <text x="18" y="64" class="card-bullet"><tspan class="card-bullet-bold">• Chân lý trạng thái duy nhất:</tspan> Quản lý toàn vẹn máy FSM 19 trạng thái vận đơn</text>
        <text x="18" y="92" class="card-bullet"><tspan class="card-bullet-bold">• Khóa bi quan (Pessimistic Lock):</tspan> Cờ isLocked = true khi có tranh chấp / đổi địa chỉ</text>
        <text x="18" y="120" class="card-bullet"><tspan class="card-bullet-bold">• Quản lý kiện hàng chi tiết:</tspan> Người gửi, người nhận, kích thước &amp; gói hàng con</text>
        <text x="18" y="148" class="card-bullet"><tspan class="card-bullet-bold">• Phân hệ Điều tra (Investigation):</tspan> Hồ sơ thất lạc, rách vỡ &amp; biên bản giải trình 24h</text>
        <text x="18" y="176" class="card-bullet"><tspan class="card-bullet-bold">• Quyết toán Bồi thường (Claim):</tspan> Phân định tỷ lệ lỗi bưu tá/bưu cục, duyệt tiền đền bù</text>
        <text x="18" y="204" class="card-bullet"><tspan class="card-bullet-bold">• Phát hành sự kiện gốc:</tspan> SHIPMENT.CREATED, CANCELLED, ADDRESS_CHANGED</text>
        
        <rect x="18" y="245" width="{c_w - 72}" height="32" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="30" y="266" class="card-meta">DB: shipment_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 7: auth-service -->
      <g transform="translate(18, 365)">
        <rect width="{c_w - 36}" height="175" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="36" x2="{c_w - 36}" y2="36" stroke="#000000" stroke-width="1"/>
        <text x="18" y="25" class="card-title">7. auth-service (:3010)</text>
        <rect x="{c_w - 36 - 120}" y="9" width="105" height="20" rx="3" fill="#000000"/>
        <text x="{c_w - 36 - 67}" y="24" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">IAM &amp; RBAC</text>
        
        <text x="18" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Định danh người dùng:</tspan> Quản lý tài khoản toàn hệ thống, mã hóa chuẩn Argon2id</text>
        <text x="18" y="88" class="card-bullet"><tspan class="card-bullet-bold">• Quản lý phiên làm việc:</tspan> Bảng auth_sessions, Thu hồi Refresh Token tức thì</text>
        <text x="18" y="114" class="card-bullet"><tspan class="card-bullet-bold">• Phân quyền 2 lớp:</tspan> RBAC trên Web + Mobile Permission Overrides cho bưu tá</text>
        
        <rect x="18" y="132" width="{c_w - 72}" height="28" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="30" y="151" class="card-meta">DB: auth_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 8: masterdata-service -->
      <g transform="translate(18, 558)">
        <rect width="{c_w - 36}" height="172" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="36" x2="{c_w - 36}" y2="36" stroke="#000000" stroke-width="1"/>
        <text x="18" y="25" class="card-title">8. masterdata-service (:3001)</text>
        <rect x="{c_w - 36 - 120}" y="9" width="105" height="20" rx="3" fill="#000000"/>
        <text x="{c_w - 36 - 67}" y="24" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">MASTERDATA</text>
        
        <text x="18" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Mạng lưới bưu cục:</tspan> Mã hub toàn quốc, tọa độ định vị GPS, bán kính phục vụ</text>
        <text x="18" y="88" class="card-bullet"><tspan class="card-bullet-bold">• Bản đồ hành chính:</tspan> 63 tỉnh/thành phố, ranh giới tuyến bưu tá, SLA giao hàng</text>
        <text x="18" y="114" class="card-bullet"><tspan class="card-bullet-bold">• Chính sách vùng miền:</tspan> Quy định phụ phí hải đảo, vùng sâu vùng xa, biên giới</text>
        
        <rect x="18" y="130" width="{c_w - 72}" height="28" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="30" y="149" class="card-meta">DB: masterdata_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>
    </g>

    <!-- ================= CLUSTER 4: FINANCE, PRICING & ANALYTICS ================= -->
    <g transform="translate({20 + (c_w + c_gap)*3}, 58)">
      <rect width="{c_w}" height="750" rx="7" fill="#FAFAFA" stroke="#000000" stroke-width="1.5"/>
      <rect width="{c_w}" height="36" rx="7" fill="#E5E7EB" stroke="#000000" stroke-width="1.2"/>
      <text x="20" y="24" class="cluster-title">CỤM 4: FINANCE, PRICING &amp; ANALYTICS (TÀI CHÍNH &amp; GIÁ)</text>

      <!-- Svc 9: payment-service -->
      <g transform="translate(18, 52)">
        <rect width="{c_w - 36}" height="175" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="36" x2="{c_w - 36}" y2="36" stroke="#000000" stroke-width="1"/>
        <text x="18" y="25" class="card-title">9. payment-service (:3011)</text>
        <rect x="{c_w - 36 - 120}" y="9" width="105" height="20" rx="3" fill="#000000"/>
        <text x="{c_w - 36 - 67}" y="24" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">COD &amp; PAY</text>
        
        <text x="18" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Dòng tiền COD:</tspan> Quản lý tiền thu hộ, sinh mã VietQR động theo từng vận đơn</text>
        <text x="18" y="88" class="card-bullet"><tspan class="card-bullet-bold">• Nộp tiền bưu tá:</tspan> Phiên nộp tiền mặt về bưu cục (CodRemittanceSession)</text>
        <text x="18" y="114" class="card-bullet"><tspan class="card-bullet-bold">• Đối soát Shop:</tspan> Quyết toán ví Merchant, Webhook ngân hàng tự động gạch nợ</text>
        
        <rect x="18" y="132" width="{c_w - 72}" height="28" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="30" y="151" class="card-meta">DB: payment_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 10: pricing-service -->
      <g transform="translate(18, 245)">
        <rect width="{c_w - 36}" height="145" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="36" x2="{c_w - 36}" y2="36" stroke="#000000" stroke-width="1"/>
        <text x="18" y="25" class="card-title">10. pricing-service (:3012)</text>
        <rect x="{c_w - 36 - 120}" y="9" width="105" height="20" rx="3" fill="#000000"/>
        <text x="{c_w - 36 - 67}" y="24" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">PRICING</text>
        
        <text x="18" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Quy chuẩn cước IATA:</tspan> Trọng lượng thực vs Thể tích quy đổi (D x R x C / 5000)</text>
        <text x="18" y="88" class="card-bullet"><tspan class="card-bullet-bold">• Bảng giá bậc thang:</tspan> Tính cước theo vùng miền, phụ phí bảo hiểm &amp; chiết khấu</text>
        <text x="18" y="114" class="card-bullet"><tspan class="card-bullet-bold">• Dự toán chi phí:</tspan> Cung cấp API tính trước giá cước tức thì cho Portal Shop</text>
      </g>

      <!-- Svc 11: reporting-service -->
      <g transform="translate(18, 408)">
        <rect width="{c_w - 36}" height="155" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="36" x2="{c_w - 36}" y2="36" stroke="#000000" stroke-width="1"/>
        <text x="18" y="25" class="card-title">11. reporting-service (:3009)</text>
        <rect x="{c_w - 36 - 120}" y="9" width="105" height="20" rx="3" fill="#000000"/>
        <text x="{c_w - 36 - 67}" y="24" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">ANALYTICS</text>
        
        <text x="18" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Tổng hợp OLAP:</tspan> Chụp snapshot hiệu suất bưu cục hàng ngày (DailySnapshot)</text>
        <text x="18" y="88" class="card-bullet"><tspan class="card-bullet-bold">• Chỉ số KPI bưu tá:</tspan> Tỷ lệ phát thành công, Tốc độ giao hàng, Tỷ lệ trễ SLA</text>
        
        <rect x="18" y="112" width="{c_w - 72}" height="28" rx="4" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
        <text x="30" y="131" class="card-meta">DB: reporting_db (PostgreSQL 16) | Pattern: CQRS Read-Model</text>
      </g>

      <!-- Svc 12 & 13: tracking-service & ai-assistant-service -->
      <g transform="translate(18, 581)">
        <rect width="{c_w - 36}" height="148" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <line x1="0" y1="36" x2="{c_w - 36}" y2="36" stroke="#000000" stroke-width="1"/>
        <text x="18" y="25" class="card-title">12. tracking (:3008) &amp; 13. ai-assistant (:3013)</text>
        <rect x="{c_w - 36 - 120}" y="9" width="105" height="20" rx="3" fill="#000000"/>
        <text x="{c_w - 36 - 67}" y="24" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">EXTENSIONS</text>
        
        <text x="18" y="62" class="card-bullet"><tspan class="card-bullet-bold">• tracking-service:</tspan> Lưu trữ Timeline truy vết bưu phẩm (DB: tracking_db)</text>
        <text x="18" y="88" class="card-bullet"><tspan class="card-bullet-bold">• ai-assistant-service:</tspan> Trợ lý thông minh hỗ trợ tra cứu nhanh &amp; điều hướng</text>
        <text x="18" y="118" class="card-meta">Mô hình AI chuyên sâu sẽ được biểu diễn độc lập tại Figma Page 2</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTOR: TIER 3 -> TIERS 4 & 5 (y: 1570 to 1645, gap = 75)
    # =========================================================================
    infra_w = (content_w - 60) // 2  # (3080 - 60) / 2 = 1510px
    p_left = margin_x + infra_w // 2
    p_right = margin_x + infra_w + 60 + infra_w // 2

    lines.append(f'''
  <!-- CONNECTOR BUS: TIER 3 -> TIERS 4 & 5 -->
  <g id="Bus_3_to_4_and_5">
    <!-- Left Branch to RabbitMQ -->
    <line x1="{p_left}" y1="1570" x2="{p_left}" y2="1645" stroke="#000000" stroke-width="2"/>
    <polygon points="{p_left - 8},1633 {p_left},1647 {p_left + 8},1633" fill="#000000"/>
    <rect x="{p_left - 340}" y="1590" width="680" height="34" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
    <text x="{p_left}" y="1612" class="flow-label" text-anchor="middle">Transactional Outbox Workers • AMQP 0-9-1 Reliable Publish</text>

    <!-- Right Branch to Databases & Redis -->
    <line x1="{p_right}" y1="1570" x2="{p_right}" y2="1645" stroke="#000000" stroke-width="2"/>
    <polygon points="{p_right - 8},1633 {p_right},1647 {p_right + 8},1633" fill="#000000"/>
    <rect x="{p_right - 340}" y="1590" width="680" height="34" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
    <text x="{p_right}" y="1612" class="flow-label" text-anchor="middle">Decoupled Connection Pools • Prisma Engine • Redis Pipeline</text>
  </g>
''')

    # =========================================================================
    # TẦNG 4 & TẦNG 5: DUAL INFRASTRUCTURE TIER (y: 1645 to 2400, h: 755)
    # =========================================================================
    lines.append(f'''
  <!-- TIER 4: EVENT-DRIVEN MESSAGE BROKER (LEFT HALF, w: 1510) -->
  <g id="Tier_4_RabbitMQ" transform="translate({margin_x}, 1645)">
    <rect width="{infra_w}" height="755" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{infra_w}" height="42" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="18" y="12" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="34" y="28" class="tier-header">TẦNG 4: EVENT-DRIVEN MESSAGE BROKER &amp; ASYNC SAGA MESH (RABBITMQ AMQP)</text>
    <text x="{infra_w - 24}" y="28" class="tier-badge" text-anchor="end">EVENTUAL CONSISTENCY • TRANSACTIONAL OUTBOX PATTERN</text>
    
    <!-- Exchange Architecture Box -->
    <g transform="translate(24, 62)">
      <rect width="{infra_w - 48}" height="115" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <text x="22" y="30" class="card-title">Cấu trúc Sàn giao dịch Thông điệp (RabbitMQ Exchange Topology)</text>
      <text x="22" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Topic Exchange trung tâm (nexus.logistics.topic):</tspan> Phân phối sự kiện bất đồng bộ theo Routing Key phân cấp (vd: shipment.event.created)</text>
      <text x="22" y="90" class="card-bullet"><tspan class="card-bullet-bold">• Xử lý lỗi &amp; Tự phục hồi (Dead Letter Exchange - nexus.dlx):</tspan> Hàng đợi Retry lũy tiến (Exponential Backoff) bảo toàn 100% thông điệp</text>
    </g>

    <!-- Outbox Pattern & Reliability Box -->
    <g transform="translate(24, 195)">
      <rect width="{(infra_w - 72) // 2}" height="535" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <text x="22" y="32" class="card-title">Cơ chế Transactional Outbox Pattern</text>
      
      <text x="22" y="70" class="card-bullet-bold">• 1. Triệt tiêu rủi ro Dual-Write Hazard:</text>
      <text x="38" y="96" class="card-bullet">Dữ liệu nghiệp vụ và bản ghi OutboxEvent được ghi</text>
      <text x="38" y="120" class="card-bullet">vào cùng một transaction cục bộ (ACID) của PostgreSQL.</text>
      <text x="38" y="144" class="card-bullet">Nếu DB lỗi, sự kiện không bao giờ bị bắn mồ côi ra ngoài.</text>

      <text x="22" y="185" class="card-bullet-bold">• 2. Luồng Outbox Publisher Worker:</text>
      <text x="38" y="211" class="card-bullet">Worker tiến trình nền độc lập liên tục thăm dò các bản ghi</text>
      <text x="38" y="235" class="card-bullet">có status = PENDING, bắn sự kiện vào RabbitMQ an toàn,</text>
      <text x="38" y="259" class="card-bullet">sau đó cập nhật trạng thái sang PUBLISHED.</text>

      <text x="22" y="300" class="card-bullet-bold">• 3. Đảm bảo Idempotent Consumer:</text>
      <text x="38" y="326" class="card-bullet">Các dịch vụ nhận sự kiện luôn kiểm tra idempotencyKey</text>
      <text x="38" y="350" class="card-bullet">trong bảng sự kiện đã xử lý, ngăn chặn hoàn toàn việc</text>
      <text x="38" y="374" class="card-bullet">cộng tiền COD hoặc trừ hàng tồn kho 2 lần.</text>

      <text x="22" y="415" class="card-bullet-bold">• 4. Cam kết giao nhận (At-Least-Once Delivery):</text>
      <text x="38" y="441" class="card-bullet">Bảo đảm 100% sự kiện được giao thành công tới Consumer,</text>
      <text x="38" y="465" class="card-bullet">kết hợp cơ chế ack/nack từ RabbitMQ Channel.</text>
    </g>

    <!-- Distributed Saga Choreography Box -->
    <g transform="translate({24 + (infra_w - 72) // 2 + 24}, 195)">
      <rect width="{(infra_w - 72) // 2}" height="535" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <text x="22" y="32" class="card-title">Chuỗi Saga Phân tán Xuyên Dịch vụ (Saga Pipelines)</text>
      
      <text x="22" y="68" class="card-bullet-bold">• 1. Luồng Thu gom Hàng tận nơi (First-Mile Saga):</text>
      <rect x="25" y="80" width="{(infra_w - 72) // 2 - 50}" height="38" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <text x="35" y="104" class="card-meta">SHIPMENT.CREATED → PICKUP.ASSIGNED → PICKUP.COLLECTED</text>

      <text x="22" y="146" class="card-bullet-bold">• 2. Luồng Trung chuyển Đường trục (Middle-Mile Saga):</text>
      <rect x="25" y="158" width="{(infra_w - 72) // 2 - 50}" height="38" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <text x="35" y="182" class="card-meta">MANIFEST.SEALED → DISPATCH.TRANSIT → SCAN.HUB_ARRIVED</text>

      <text x="22" y="224" class="card-bullet-bold">• 3. Luồng Giao hàng &amp; Đối soát tiền COD (Last-Mile Saga):</text>
      <rect x="25" y="236" width="{(infra_w - 72) // 2 - 50}" height="38" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <text x="35" y="260" class="card-meta">DELIVERY.DELIVERED → PAYMENT.COD_COLLECTED → WALLET.CREDITED</text>

      <text x="22" y="302" class="card-bullet-bold">• 4. Luồng Xử lý Sự cố &amp; Bồi thường (Claim &amp; Incident Saga):</text>
      <rect x="25" y="314" width="{(infra_w - 72) // 2 - 50}" height="38" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <text x="35" y="338" class="card-meta">DAMAGE.REPORTED → INVESTIGATION.LOCKED → CLAIM.APPROVED</text>

      <text x="22" y="380" class="card-bullet-bold">• 5. Luồng Trả hàng &amp; Chuyển hoàn (Return-to-Origin Saga):</text>
      <rect x="25" y="392" width="{(infra_w - 72) // 2 - 50}" height="38" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <text x="35" y="416" class="card-meta">DELIVERY.FAILED_3RD → RETURN.INITIATED → SHIPMENT.RETURNING</text>

      <text x="25" y="475" font-size="13" font-weight="600" fill="#4B5563">Giao tiếp hoàn toàn hướng sự kiện, loại bỏ tuyệt đối 2-Phase Commit (2PC)</text>
    </g>
  </g>

  <!-- TIER 5: PERSISTENCE & CACHE INFRASTRUCTURE (RIGHT HALF, w: 1510) -->
  <g id="Tier_5_Persistence" transform="translate({margin_x + infra_w + 60}, 1645)">
    <rect width="{infra_w}" height="755" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{infra_w}" height="42" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="18" y="12" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="34" y="28" class="tier-header">TẦNG 5: DECOUPLED PERSISTENCE &amp; CACHE (DATABASE-PER-SERVICE)</text>
    <text x="{infra_w - 24}" y="28" class="tier-badge" text-anchor="end">11x ISOLATED POSTGRESQL 16 • DISTRIBUTED REDIS CACHE MESH</text>
    
    <!-- 11 Databases Grid Box -->
    <g transform="translate(24, 62)">
      <rect width="{infra_w - 48}" height="385" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <text x="22" y="30" class="card-title">Hệ Sinh Thái 11 Cơ Sở Dữ Liệu PostgreSQL 16 Độc Lập (Database-per-Service Architecture)</text>
      <text x="22" y="56" class="card-bullet"><tspan class="card-bullet-bold">• Nguyên tắc Vàng:</tspan> Tuyệt đối không dùng Foreign Key giữa các cơ sở dữ liệu; Mỗi service hoàn toàn tự chủ schema</text>
      <text x="22" y="80" class="card-bullet"><tspan class="card-bullet-bold">• Khóa phân tán (Distributed Saga Keys):</tspan> shipmentCode, hubCode, courierId, merchantId là cầu nối liên kết logic</text>

      <!-- 11 Database Cards (3 Rows) -->
      <!-- Row 1 (4 DBs) -->
      <g transform="translate(20, 100)">
        <rect width="335" height="78" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="16" y="25" class="chip-text">1. auth_db (:3010)</text>
        <text x="315" y="25" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="16" y="49" class="card-bullet">• UserAccount, AuthSession, Roles</text>
        <text x="16" y="67" class="card-meta">IAM, RBAC &amp; Mobile Overrides</text>

        <rect x="360" y="0" width="335" height="78" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="376" y="25" class="chip-text">2. masterdata_db (:3001)</text>
        <text x="675" y="25" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="376" y="49" class="card-bullet">• Hubs, GPS Zones, SLA Configs</text>
        <text x="376" y="67" class="card-meta">Bưu cục, Tuyến xã/phường</text>

        <rect x="720" y="0" width="335" height="78" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="736" y="25" class="chip-text">3. shipment_db (:3002)</text>
        <text x="1035" y="25" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="736" y="49" class="card-bullet">• Shipments, ChangeRequests, Claims</text>
        <text x="736" y="67" class="card-meta">Canonical 19-State FSM</text>

        <rect x="1080" y="0" width="335" height="78" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="1096" y="25" class="chip-text">4. pickup_db (:3003)</text>
        <text x="1395" y="25" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="1096" y="49" class="card-bullet">• PickupRequests, PickupItems</text>
        <text x="1096" y="67" class="card-meta">Gom hàng tận nơi tại Shop</text>
      </g>

      <!-- Row 2 (4 DBs) -->
      <g transform="translate(20, 192)">
        <rect width="335" height="78" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="16" y="25" class="chip-text">5. dispatch_db (:3004)</text>
        <text x="315" y="25" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="16" y="49" class="card-bullet">• Tasks, TaskAssignments, OpsLogs</text>
        <text x="16" y="67" class="card-meta">Điều phối bưu tá theo tuyến</text>

        <rect x="360" y="0" width="335" height="78" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="376" y="25" class="chip-text">6. manifest_db (:3005)</text>
        <text x="675" y="25" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="376" y="49" class="card-bullet">• Manifests, SealBags, Linehaul</text>
        <text x="376" y="67" class="card-meta">Bảng kê &amp; Niêm phong trung chuyển</text>

        <rect x="720" y="0" width="335" height="78" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="736" y="25" class="chip-text">7. scan_db (:3006)</text>
        <text x="1035" y="25" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="736" y="49" class="card-bullet">• ScanAudits, InventoryLedgers</text>
        <text x="736" y="67" class="card-meta">Kiểm kê tồn kho bưu cục</text>

        <rect x="1080" y="0" width="335" height="78" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="1096" y="25" class="chip-text">8. delivery_db (:3007)</text>
        <text x="1395" y="25" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="1096" y="49" class="card-bullet">• DeliveryRuns, Stops, POD Proofs</text>
        <text x="1096" y="67" class="card-meta">Chuyến phát chặng cuối &amp; POD</text>
      </g>

      <!-- Row 3 (3 DBs) -->
      <g transform="translate(20, 284)">
        <rect width="455" height="78" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="16" y="25" class="chip-text">9. payment_db (:3011)</text>
        <text x="435" y="25" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="16" y="49" class="card-bullet">• PaymentRecords, CodSessions, Wallets</text>
        <text x="16" y="67" class="card-meta">Dòng tiền COD, VietQR &amp; Đối soát ví</text>

        <rect x="480" y="0" width="455" height="78" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="496" y="25" class="chip-text">10. tracking_db (:3008)</text>
        <text x="915" y="25" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="496" y="49" class="card-bullet">• TrackingCheckpoints, PublicCache</text>
        <text x="496" y="67" class="card-meta">Timeline hành trình kiện hàng thời gian thực</text>

        <rect x="960" y="0" width="455" height="78" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
        <text x="976" y="25" class="chip-text">11. reporting_db (:3009)</text>
        <text x="1395" y="25" class="chip-sub" text-anchor="end">PostgreSQL 16</text>
        <text x="976" y="49" class="card-bullet">• DailySnapshots, CourierKPIs, SLA Stats</text>
        <text x="976" y="67" class="card-meta">Kho tổng hợp OLAP &amp; Báo cáo điều hành</text>
      </g>
    </g>

    <!-- Redis Distributed Cache Cluster Box -->
    <g transform="translate(24, 465)">
      <rect width="{infra_w - 48}" height="265" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
      <text x="22" y="30" class="card-title">Cụm Bộ Nhớ Đệm Phân Tán (Redis Distributed Cache Mesh :6379)</text>
      
      <g transform="translate(20, 50)">
        <rect width="{(infra_w - 96) // 3}" height="190" rx="5" fill="#FAFAFA" stroke="#000000" stroke-width="1.2"/>
        <text x="18" y="26" class="chip-text">1. PublicTrackingCache</text>
        <text x="18" y="56" class="card-bullet">• Bộ đệm Timeline hành trình đơn hàng</text>
        <text x="18" y="82" class="card-bullet">• TTL = 300s (5 phút) cho các mốc quét</text>
        <text x="18" y="108" class="card-bullet">• Giải tỏa 92% tải đọc trực tiếp từ</text>
        <text x="18" y="132" class="card-bullet">cơ sở dữ liệu tracking_db chính</text>
        <text x="18" y="165" class="card-meta">Key: tracking:shipment:NX-XXXXXX</text>
      </g>

      <g transform="translate({20 + (infra_w - 96) // 3 + 24}, 50)">
        <rect width="{(infra_w - 96) // 3}" height="190" rx="5" fill="#FAFAFA" stroke="#000000" stroke-width="1.2"/>
        <text x="18" y="26" class="chip-text">2. Session &amp; Token Blacklist</text>
        <text x="18" y="56" class="card-bullet">• Quản lý phiên đăng nhập phân tán</text>
        <text x="18" y="82" class="card-bullet">• Danh sách đen thu hồi Refresh Token</text>
        <text x="18" y="108" class="card-bullet">• Đăng xuất lập tức trên mọi thiết bị khi</text>
        <text x="18" y="132" class="card-bullet">phát hiện tài khoản bị xâm phạm</text>
        <text x="18" y="165" class="card-meta">Key: session:revoked:TOKEN_JTI</text>
      </g>

      <g transform="translate({20 + ((infra_w - 96) // 3 + 24)*2}, 50)">
        <rect width="{(infra_w - 96) // 3}" height="190" rx="5" fill="#FAFAFA" stroke="#000000" stroke-width="1.2"/>
        <text x="18" y="26" class="chip-text">3. RateLimitRegistry</text>
        <text x="18" y="56" class="card-bullet">• Đồng hồ đếm tần suất truy cập API</text>
        <text x="18" y="82" class="card-bullet">• Sliding-Window Counter theo IP &amp; Token</text>
        <text x="18" y="108" class="card-bullet">• Ngăn chặn tấn công Brute-force và</text>
        <text x="18" y="132" class="card-bullet">cào dữ liệu bưu kiện tự động</text>
        <text x="18" y="165" class="card-meta">Key: ratelimit:ip:CLIENT_IP</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # FOOTER BAR (y: 2420 to 2478, h: 58)
    # =========================================================================
    lines.append(f'''
  <!-- FOOTER BAR -->
  <g id="FooterBar" transform="translate({margin_x}, 2420)">
    <rect width="{content_w}" height="58" rx="8" fill="#F9FAFB" stroke="#000000" stroke-width="1.8"/>
    <circle cx="28" cy="29" r="6" fill="#000000"/>
    <text x="48" y="34" font-size="14" font-weight="700" fill="#000000">GHI CHÚ KỸ THUẬT KIẾN TRÚC:</text>
    <text x="295" y="34" font-size="13.5" fill="#1F2937">Bản vẽ kiến trúc hệ thống tổng thể theo chuẩn UML Component &amp; Enterprise Architecture Deployment Blueprint • Ánh xạ 100% dịch vụ và cơ sở dữ liệu thực tế trong mã nguồn dự án</text>
    <text x="{content_w - 28}" y="34" font-size="13.5" font-weight="600" fill="#4B5563" text-anchor="end">Nexus Express Software Engineering Thesis • Section 1.2</text>
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
