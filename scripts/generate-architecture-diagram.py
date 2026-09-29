#!/usr/bin/env python3
"""
generate-architecture-diagram.py
Generates the comprehensive Enterprise Architecture & Deployment Diagram (5-Tier)
for the Nexus Logistics Management System graduation thesis.

Outputs to:
  docs/graduation-thesis/figma-page-1-system-and-data/diagrams/02-architecture-deployment-4-tier.svg
Standardized Dimensions:
  Width: 2000px, Height: 1300px
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
    width = 2000
    height = 1300
    lines = []

    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # Double Blueprint Frame
    lines.append(f'''
  <!-- Double Frame -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <rect x="15" y="15" width="{width - 30}" height="{height - 30}" fill="none" stroke="#000000" stroke-width="2"/>
  <rect x="20" y="20" width="{width - 40}" height="{height - 40}" fill="none" stroke="#000000" stroke-width="0.8"/>

  <style>
    text {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }}
    .hdr-badge {{ font-size: 11px; font-weight: 700; fill: #FFFFFF; letter-spacing: 1.2px; text-transform: uppercase; }}
    .hdr-title {{ font-size: 20px; font-weight: 800; fill: #000000; letter-spacing: -0.4px; }}
    .hdr-sub {{ font-size: 12px; font-weight: 500; fill: #374151; }}
    
    .tier-header {{ font-size: 12px; font-weight: 800; fill: #000000; letter-spacing: 0.8px; text-transform: uppercase; }}
    .tier-badge {{ font-size: 10px; font-weight: 700; fill: #000000; text-transform: uppercase; }}
    
    .card-title {{ font-size: 12.5px; font-weight: 700; fill: #000000; }}
    .card-meta {{ font-size: 10px; font-weight: 600; fill: #4B5563; font-family: ui-monospace, Menlo, monospace; }}
    .card-body {{ font-size: 10.5px; font-weight: 400; fill: #1F2937; line-height: 1.4; }}
    .card-bullet {{ font-size: 10px; font-weight: 500; fill: #374151; }}
    
    .flow-label {{ font-size: 10px; font-weight: 700; fill: #000000; letter-spacing: 0.5px; text-transform: uppercase; }}
    .chip-text {{ font-size: 9.5px; font-weight: 700; fill: #000000; font-family: ui-monospace, Menlo, monospace; }}
  </style>
''')

    # =========================================================================
    # HEADER (y: 30 to 105, h: 75)
    # =========================================================================
    lines.append(f'''
  <!-- HEADER BAR -->
  <g id="HeaderBar" transform="translate(40, 30)">
    <rect width="{width - 80}" height="75" rx="6" fill="#F9FAFB" stroke="#000000" stroke-width="1.6"/>
    
    <!-- Left Meta Badge -->
    <rect x="20" y="12" width="310" height="20" rx="3" fill="#000000"/>
    <text x="30" y="26" class="hdr-badge">NEXUS ENTERPRISE LOGISTICS ARCHITECTURE</text>
    
    <!-- Title & Desc -->
    <text x="20" y="48" class="hdr-title">HÌNH 1.2: SƠ ĐỒ KIẾN TRÚC TỔNG THỂ HỆ THỐNG LOGISTICS &amp; VẬN TẢI ĐA KÊNH PHÂN TÁN</text>
    <text x="20" y="65" class="hdr-sub">Kiến trúc Triển khai Toàn diện: 4 Client Apps, API Gateway &amp; PII Sanitizer, 13 Microservices, Trục Sự kiện RabbitMQ Saga &amp; 11 Cơ sở Dữ liệu Độc lập</text>
    
    <!-- Right Tech Specs Chips -->
    <g transform="translate({width - 80 - 450}, 14)">
      <!-- Arch Chip -->
      <rect x="0" y="0" width="135" height="24" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <circle cx="12" cy="12" r="3.5" fill="#000000"/>
      <text x="22" y="16" font-size="9.5" font-weight="700" fill="#000000">ARCH: 5-TIER MESH</text>
      
      <!-- Messaging Chip -->
      <rect x="145" y="0" width="155" height="24" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <rect x="155" y="7" width="8" height="10" rx="1" fill="#000000"/>
      <text x="170" y="16" font-size="9.5" font-weight="700" fill="#000000">BROKER: RABBITMQ</text>

      <!-- DB Chip -->
      <rect x="310" y="0" width="130" height="24" rx="4" fill="#000000"/>
      <text x="375" y="16" font-size="9.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">11x POSTGRESQL 16</text>

      <text x="440" y="44" font-size="10" font-weight="600" fill="#4B5563" text-anchor="end">Decoupled Database-per-Service &amp; Distributed Saga Keys</text>
    </g>
  </g>
''')

    # =========================================================================
    # TẦNG 1: MULTI-CHANNEL CLIENT APPS (y: 120 to 255, h: 135)
    # =========================================================================
    lines.append(f'''
  <!-- TIER 1: CLIENT APPS -->
  <g id="Tier_1_Clients" transform="translate(40, 120)">
    <rect width="{width - 80}" height="135" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
    <rect width="{width - 80}" height="30" rx="6" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
    <rect x="14" y="8" width="5" height="14" rx="1" fill="#000000"/>
    <text x="26" y="20" class="tier-header">TẦNG 1: MULTI-CHANNEL CLIENT APPLICATIONS (GIAO DIỆN NGƯỜI DÙNG ĐA KÊNH)</text>
    <text x="{width - 80 - 18}" y="20" class="tier-badge" text-anchor="end">EDGE CLIENT PROTOCOLS: HTTPS / RESTFUL API / WEBSOCKET EVENT STREAM</text>
    
    <!-- 4 Client Cards -->
    <!-- Card 1: Merchant Web -->
    <g transform="translate(18, 40)">
      <rect width="450" height="83" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <line x1="0" y1="24" x2="450" y2="24" stroke="#000000" stroke-width="0.8"/>
      <text x="12" y="16" class="card-title">Merchant Web Portal (:5174)</text>
      <text x="438" y="16" class="card-meta" text-anchor="end">REACTJS / VITE / TAILWIND</text>
      <text x="12" y="40" class="card-bullet">• Đối tượng: Chủ cửa hàng thương mại điện tử, Đối tác gửi bưu phẩm định kỳ</text>
      <text x="12" y="56" class="card-bullet">• Nghiệp vụ: Tạo đơn hàng loạt (Excel/API), Đặt lịch lấy hàng tận nơi, Quản lý kho hàng shop</text>
      <text x="12" y="72" class="card-bullet">• Tài chính: Theo dõi dòng tiền COD theo đơn, Báo cáo phiên đối soát ví &amp; Rút tiền ngân hàng</text>
    </g>

    <!-- Card 2: Operations Web -->
    <g transform="translate(486, 40)">
      <rect width="460" height="83" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <line x1="0" y1="24" x2="460" y2="24" stroke="#000000" stroke-width="0.8"/>
      <text x="12" y="16" class="card-title">Operations Platform (:5173)</text>
      <text x="448" y="16" class="card-meta" text-anchor="end">REACTJS / LEAFLET / RECHARTS</text>
      <text x="12" y="40" class="card-bullet">• Đối tượng: Trưởng bưu cục (Station Ops), Điều hành viên trung tâm (Dispatchers)</text>
      <text x="12" y="56" class="card-bullet">• Nghiệp vụ: Phân tuyến bưu tá theo phường/xã, Giám sát tồn kho bưu cục, Đóng chuyến xe</text>
      <text x="12" y="72" class="card-bullet">• Sự cố &amp; Khiếu nại: Tiếp nhận bưu phẩm hư hỏng/thất lạc, Quyết định bồi thường (HITL)</text>
    </g>

    <!-- Card 3: Courier Mobile App -->
    <g transform="translate(964, 40)">
      <rect width="460" height="83" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <line x1="0" y1="24" x2="460" y2="24" stroke="#000000" stroke-width="0.8"/>
      <text x="12" y="16" class="card-title">Courier &amp; Customer Mobile App (:8082)</text>
      <text x="448" y="16" class="card-meta" text-anchor="end">REACT NATIVE / EXPO</text>
      <text x="12" y="40" class="card-bullet">• Đối tượng: Bưu tá thu gom / Giao hàng chặng cuối &amp; Khách hàng nhận/gửi cá nhân</text>
      <text x="12" y="56" class="card-bullet">• Bưu tá: Quét mã vạch thu hàng tại shop, Điều hướng lộ trình, Chụp ảnh POD ký nhận điện tử</text>
      <text x="12" y="72" class="card-bullet">• Thu COD: Sinh mã VietQR động thu tiền mặt/chuyển khoản, Tạo phiên nộp tiền bưu cục</text>
    </g>

    <!-- Card 4: Guest Tracking Portal -->
    <g transform="translate(1442, 40)">
      <rect width="460" height="83" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <line x1="0" y1="24" x2="460" y2="24" stroke="#000000" stroke-width="0.8"/>
      <text x="12" y="16" class="card-title">Guest Public Tracking Portal (:5177)</text>
      <text x="448" y="16" class="card-meta" text-anchor="end">REACTJS SPA / LIGHTWEIGHT</text>
      <text x="12" y="40" class="card-bullet">• Đối tượng: Khách vãng lai, Người nhận hàng tra cứu tiến độ bưu kiện công khai</text>
      <text x="12" y="56" class="card-bullet">• Truy vết: Nhập mã NX-XXXXXX xem timeline chi tiết từng trạm quét (Scan Milestones)</text>
      <text x="12" y="72" class="card-bullet">• Bảo mật PII: Tự động che mờ SĐT (098***) và địa chỉ nhà để chống rò rỉ dữ liệu cá nhân</text>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTOR: TIER 1 -> TIER 2 (y: 255 to 285, gap = 30)
    # =========================================================================
    lines.append(f'''
  <!-- CONNECTOR BUS: TIER 1 -> TIER 2 -->
  <g id="Bus_1_to_2">
    <line x1="260" y1="255" x2="260" y2="285" stroke="#000000" stroke-width="1.5"/>
    <line x1="720" y1="255" x2="720" y2="285" stroke="#000000" stroke-width="1.5"/>
    <line x1="1200" y1="255" x2="1200" y2="285" stroke="#000000" stroke-width="1.5"/>
    <line x1="1680" y1="255" x2="1680" y2="285" stroke="#000000" stroke-width="1.5"/>
    
    <!-- Central Bus Line -->
    <line x1="200" y1="270" x2="1740" y2="270" stroke="#000000" stroke-width="1.2" stroke-dasharray="4,3"/>
    <rect x="850" y="260" width="300" height="20" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    <text x="1000" y="274" class="flow-label" text-anchor="middle">HTTPS / TLS 1.3 • RESTful JSON • WebSocket Stream</text>
    
    <!-- Down Arrow into Tier 2 -->
    <path d="M 1000 280 L 1000 285" stroke="#000000" stroke-width="1.5"/>
    <polygon points="996,285 1000,292 1004,285" fill="#000000"/>
  </g>
''')

    # =========================================================================
    # TẦNG 2: EDGE INGRESS, API GATEWAY & SECURITY (y: 295 to 400, h: 105)
    # =========================================================================
    lines.append(f'''
  <!-- TIER 2: API GATEWAY & SECURITY -->
  <g id="Tier_2_Gateway" transform="translate(40, 295)">
    <rect width="{width - 80}" height="105" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
    <rect width="{width - 80}" height="28" rx="6" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
    <rect x="14" y="7" width="5" height="14" rx="1" fill="#000000"/>
    <text x="26" y="19" class="tier-header">TẦNG 2: EDGE INGRESS, API GATEWAY &amp; SECURITY PROXY (:3000)</text>
    <text x="{width - 80 - 18}" y="19" class="tier-badge" text-anchor="end">SINGLE ENTRYPOINT • REVERSE PROXY • AUTH &amp; PII PIPELINE</text>
    
    <!-- 4 Functional Gateway Blocks -->
    <!-- Block 1 -->
    <g transform="translate(18, 36)">
      <rect width="450" height="60" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <text x="12" y="20" class="card-title">Reverse Proxy &amp; Dynamic Router</text>
      <text x="12" y="38" class="card-bullet">• Cửa ngõ định tuyến duy nhất: Ánh xạ prefix /api/v1/* tới 13 dịch vụ nội bộ</text>
      <text x="12" y="52" class="card-bullet">• Tải cân bằng vòng tròn (Round-Robin) &amp; Kiểm tra nhịp tim (Health Check :3000/health)</text>
    </g>

    <!-- Block 2 -->
    <g transform="translate(486, 36)">
      <rect width="460" height="60" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <text x="12" y="20" class="card-title">JWT Claims &amp; RBAC Guard</text>
      <text x="12" y="38" class="card-bullet">• Xác thực chữ ký số HMAC-SHA256, Bóc tách Role: ADMIN, OPS, COURIER, MERCHANT</text>
      <text x="12" y="52" class="card-bullet">• Truyền tải Header nội bộ: x-user-id, x-role, x-hub-code, x-correlation-id</text>
    </g>

    <!-- Block 3 -->
    <g transform="translate(964, 36)">
      <rect width="460" height="60" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <text x="12" y="20" class="card-title">PII Sanitizer &amp; Data Masking</text>
      <text x="12" y="38" class="card-bullet">• Khử định danh dữ liệu người dùng cuối: Tự động che SĐT (098***) &amp; địa chỉ nhà</text>
      <text x="12" y="52" class="card-bullet">• Ngăn chặn rò rỉ thông tin cá nhân khi tra cứu bưu kiện công khai qua Guest Portal</text>
    </g>

    <!-- Block 4 -->
    <g transform="translate(1442, 36)">
      <rect width="460" height="60" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <text x="12" y="20" class="card-title">Traffic Shaping &amp; Security Guard</text>
      <text x="12" y="38" class="card-bullet">• Chống tấn công dò quét mã vận đơn (Rate Limiting: 60 req/min/IP)</text>
      <text x="12" y="52" class="card-bullet">• CORS Whitelist, WAF cơ bản, Helmet Security Headers, Chống DoS API</text>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTOR: TIER 2 -> TIER 3 (y: 400 to 425, gap = 25)
    # =========================================================================
    lines.append(f'''
  <!-- CONNECTOR BUS: TIER 2 -> TIER 3 -->
  <g id="Bus_2_to_3">
    <line x1="260" y1="400" x2="260" y2="425" stroke="#000000" stroke-width="1.5"/>
    <line x1="720" y1="400" x2="720" y2="425" stroke="#000000" stroke-width="1.5"/>
    <line x1="1200" y1="400" x2="1200" y2="425" stroke="#000000" stroke-width="1.5"/>
    <line x1="1680" y1="400" x2="1680" y2="425" stroke="#000000" stroke-width="1.5"/>
    
    <line x1="200" y1="412" x2="1740" y2="412" stroke="#000000" stroke-width="1.2" stroke-dasharray="4,3"/>
    <rect x="800" y="403" width="400" height="18" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    <text x="1000" y="416" class="flow-label" text-anchor="middle">Internal Private Network (mTLS / VPC) • JSON RPC • Header Propagation</text>
    
    <polygon points="256,425 260,432 264,425" fill="#000000"/>
    <polygon points="716,425 720,432 724,425" fill="#000000"/>
    <polygon points="1196,425 1200,432 1204,425" fill="#000000"/>
    <polygon points="1676,425 1680,432 1684,425" fill="#000000"/>
  </g>
''')

    # =========================================================================
    # TẦNG 3: 13 MICROSERVICES BUSINESS DOMAIN MESH (y: 435 to 870, h: 435)
    # =========================================================================
    lines.append(f'''
  <!-- TIER 3: MICROSERVICES MESH -->
  <g id="Tier_3_Microservices" transform="translate(40, 435)">
    <rect width="{width - 80}" height="435" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
    <rect width="{width - 80}" height="30" rx="6" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
    <rect x="14" y="8" width="5" height="14" rx="1" fill="#000000"/>
    <text x="26" y="20" class="tier-header">TẦNG 3: 13 MICROSERVICES BUSINESS DOMAIN MESH (LÕI NGHIỆP VỤ VẬN HÀNH PHÂN TÁN)</text>
    <text x="{width - 80 - 18}" y="20" class="tier-badge" text-anchor="end">ISOLATED BOUNDED CONTEXTS • NESTJS &amp; EXPRESS FRAMEWORKS • 100% PRISMA ORM</text>
    
    <!-- 4 DOMAIN CLUSTERS -->
    
    <!-- ================= CLUSTER 1: FIRST & MIDDLE-MILE (w: 450) ================= -->
    <g transform="translate(18, 40)">
      <rect width="450" height="382" rx="5" fill="#FAFAFA" stroke="#000000" stroke-width="1.2"/>
      <rect width="450" height="26" rx="5" fill="#E5E7EB" stroke="#000000" stroke-width="1"/>
      <text x="12" y="18" class="card-title">CỤM 1: FIRST &amp; MIDDLE-MILE (THU GOM &amp; KHO)</text>

      <!-- Svc 1: pickup-service -->
      <g transform="translate(10, 36)">
        <rect width="430" height="104" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="card-title">1. pickup-service (:3003)</text>
        <rect x="330" y="7" width="90" height="16" rx="3" fill="#000000"/>
        <text x="375" y="18" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">FIRST-MILE</text>
        <text x="10" y="36" class="card-bullet">• Tiếp nhận yêu cầu lấy hàng tận nơi từ Merchant Web Portal</text>
        <text x="10" y="52" class="card-bullet">• Quản lý PickupRequest, danh mục kiện hàng thu gom (PickupItem)</text>
        <text x="10" y="68" class="card-bullet">• Bưu tá quét mã xác nhận nhận hàng, phát hành sự kiện PICKUP.COLLECTED</text>
        <text x="10" y="88" class="card-meta">DB: pickup_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 2: manifest-service -->
      <g transform="translate(10, 150)">
        <rect width="430" height="104" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="card-title">2. manifest-service (:3005)</text>
        <rect x="330" y="7" width="90" height="16" rx="3" fill="#000000"/>
        <text x="375" y="18" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">MIDDLE-MILE</text>
        <text x="10" y="36" class="card-bullet">• Đóng bao niêm phong (SealBag) gom hàng nghìn kiện hàng cùng tuyến</text>
        <text x="10" y="52" class="card-bullet">• Lập bảng kê trung chuyển (Manifest) giữa các Hub trung tâm &amp; bưu cục</text>
        <text x="10" y="68" class="card-bullet">• Quản lý bàn giao xe tải đường trục, giám sát niêm chì bảo mật hàng hóa</text>
        <text x="10" y="88" class="card-meta">DB: manifest_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 3: scan-service -->
      <g transform="translate(10, 264)">
        <rect width="430" height="106" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="card-title">3. scan-service (:3006)</text>
        <rect x="330" y="7" width="90" height="16" rx="3" fill="#000000"/>
        <text x="375" y="18" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">INVENTORY</text>
        <text x="10" y="36" class="card-bullet">• Trạm quét mã barcode/QR tốc độ cao: Nhập kho (INBOUND), Xuất kho (OUTBOUND)</text>
        <text x="10" y="52" class="card-bullet">• Sổ cái kiểm kê tồn kho thời gian thực tại từng bưu cục (HubInventoryLedger)</text>
        <text x="10" y="68" class="card-bullet">• Phát hiện bất thường: Thừa đơn, thiếu đơn, rách vỡ bao bì (DamageReport)</text>
        <text x="10" y="88" class="card-meta">DB: scan_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>
    </g>

    <!-- ================= CLUSTER 2: DISPATCH & LAST-MILE (w: 460) ================= -->
    <g transform="translate(486, 40)">
      <rect width="460" height="382" rx="5" fill="#FAFAFA" stroke="#000000" stroke-width="1.2"/>
      <rect width="460" height="26" rx="5" fill="#E5E7EB" stroke="#000000" stroke-width="1"/>
      <text x="12" y="18" class="card-title">CỤM 2: DISPATCH &amp; LAST-MILE (ĐIỀU PHỐI &amp; GIAO HÀNG)</text>

      <!-- Svc 4: dispatch-service -->
      <g transform="translate(10, 36)">
        <rect width="440" height="160" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="card-title">4. dispatch-service (:3004)</text>
        <rect x="340" y="7" width="90" height="16" rx="3" fill="#000000"/>
        <text x="385" y="18" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">DISPATCHING</text>
        <text x="10" y="38" class="card-bullet">• Công cụ phân bổ tác vụ tự động: Gán nhiệm vụ gom (Pickup) &amp; phát (Delivery)</text>
        <text x="10" y="56" class="card-bullet">• Thuật toán định tuyến: Gom bưu phẩm theo địa giới polygon phường/xã</text>
        <text x="10" y="74" class="card-bullet">• Cân bằng tải bưu tá (Courier Workload Balancing), quản lý ca làm việc</text>
        <text x="10" y="92" class="card-bullet">• Can thiệp điều hành: Cho phép Trưởng bưu cục gán lại việc khẩn cấp (Reassign)</text>
        <text x="10" y="110" class="card-bullet">• Nhật ký kiểm toán phân công (OpsAuditLog) lưu vết mọi thay đổi điều phối</text>
        <text x="10" y="142" class="card-meta">DB: dispatch_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 5: delivery-service -->
      <g transform="translate(10, 208)">
        <rect width="440" height="162" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="card-title">5. delivery-service (:3007)</text>
        <rect x="340" y="7" width="90" height="16" rx="3" fill="#000000"/>
        <text x="385" y="18" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">LAST-MILE</text>
        <text x="10" y="38" class="card-bullet">• Quản lý chuyến đi phát hàng chặng cuối của bưu tá (DeliveryRun &amp; DeliveryStop)</text>
        <text x="10" y="56" class="card-bullet">• Bằng chứng giao hàng điện tử (POD): Ảnh chụp gói hàng thực tế + Chữ ký người nhận</text>
        <text x="10" y="74" class="card-bullet">• Xử lý giao thất bại (DeliveryIncident): Không liên lạc được, Khách dời ngày nhận</text>
        <text x="10" y="92" class="card-bullet">• Cơ chế giao lại tự động (Tối đa 3 lần) trước khi chuyển trạng thái Lưu kho trả hàng</text>
        <text x="10" y="110" class="card-bullet">• Kích hoạt sự kiện đối soát tức thì: DELIVERY.DELIVERED → Ghi nhận thu tiền COD</text>
        <text x="10" y="144" class="card-meta">DB: delivery_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>
    </g>

    <!-- ================= CLUSTER 3: CORE SHIPMENT & IDENTITY (w: 460) ================= -->
    <g transform="translate(964, 40)">
      <rect width="460" height="382" rx="5" fill="#FAFAFA" stroke="#000000" stroke-width="1.2"/>
      <rect width="460" height="26" rx="5" fill="#E5E7EB" stroke="#000000" stroke-width="1"/>
      <text x="12" y="18" class="card-title">CỤM 3: CORE SHIPMENT &amp; IDENTITY (VẬN ĐƠN &amp; NỀN TẢNG)</text>

      <!-- Svc 6: shipment-service -->
      <g transform="translate(10, 36)">
        <rect width="440" height="142" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
        <text x="10" y="18" class="card-title">6. shipment-service (:3002) [CANONICAL OWNER]</text>
        <rect x="330" y="7" width="100" height="16" rx="3" fill="#000000"/>
        <text x="380" y="18" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">SINGLE TRUTH</text>
        <text x="10" y="38" class="card-bullet">• Nơi duy nhất nắm giữ chân lý trạng thái đơn hàng (FSM 19 trạng thái máy chuẩn)</text>
        <text x="10" y="54" class="card-bullet">• Cơ chế khóa bi quan (Pessimistic Lock: isLocked = true) khi có yêu cầu đổi địa chỉ</text>
        <text x="10" y="70" class="card-bullet">• Quản lý kiện hàng, kích thước, khối lượng, thông tin người gửi &amp; người nhận</text>
        <text x="10" y="86" class="card-bullet">• Phân hệ Điều tra Sự cố (InvestigationCase) &amp; Quyết toán Bồi thường (Claim)</text>
        <text x="10" y="104" class="card-bullet">• Phát hành sự kiện gốc SHIPMENT.CREATED, CANCELLED, UPDATED</text>
        <text x="10" y="126" class="card-meta">DB: shipment_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 7: auth-service -->
      <g transform="translate(10, 188)">
        <rect width="440" height="88" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="card-title">7. auth-service (:3010)</text>
        <rect x="340" y="7" width="90" height="16" rx="3" fill="#000000"/>
        <text x="385" y="18" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">IAM &amp; RBAC</text>
        <text x="10" y="36" class="card-bullet">• Quản lý danh tính tài khoản toàn hệ thống, mã hóa mật khẩu chuẩn Argon2id</text>
        <text x="10" y="52" class="card-bullet">• Quản lý phiên đăng nhập (AuthSession), Thu hồi Refresh Token tức thì</text>
        <text x="10" y="68" class="card-bullet">• Phân quyền 2 lớp: RBAC trên Web + Mobile Permission Overrides cho bưu tá</text>
        <text x="10" y="79" class="card-meta">DB: auth_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 8: masterdata-service -->
      <g transform="translate(10, 286)">
        <rect width="440" height="84" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="card-title">8. masterdata-service (:3001)</text>
        <rect x="340" y="7" width="90" height="16" rx="3" fill="#000000"/>
        <text x="385" y="18" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">MASTERDATA</text>
        <text x="10" y="36" class="card-bullet">• Mạng lưới bưu cục/hub toàn quốc (Mã bưu cục, tọa độ GPS, bán kính phục vụ)</text>
        <text x="10" y="52" class="card-bullet">• Bản đồ địa giới hành chính 63 tỉnh/thành, Tuyến bưu tá, Cấu hình SLA vận hành</text>
        <text x="10" y="73" class="card-meta">DB: masterdata_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>
    </g>

    <!-- ================= CLUSTER 4: FINANCE, PRICING & ANALYTICS (w: 460) ================= -->
    <g transform="translate(1442, 40)">
      <rect width="460" height="382" rx="5" fill="#FAFAFA" stroke="#000000" stroke-width="1.2"/>
      <rect width="460" height="26" rx="5" fill="#E5E7EB" stroke="#000000" stroke-width="1"/>
      <text x="12" y="18" class="card-title">CỤM 4: FINANCE, PRICING &amp; ANALYTICS (TÀI CHÍNH &amp; GIÁ)</text>

      <!-- Svc 9: payment-service -->
      <g transform="translate(10, 36)">
        <rect width="440" height="98" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="card-title">9. payment-service (:3011)</text>
        <rect x="340" y="7" width="90" height="16" rx="3" fill="#000000"/>
        <text x="385" y="18" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">COD &amp; PAY</text>
        <text x="10" y="36" class="card-bullet">• Quản lý dòng tiền thu hộ COD, Sinh mã VietQR động theo từng vận đơn</text>
        <text x="10" y="52" class="card-bullet">• Phiên nộp tiền mặt của bưu tá về bưu cục (CodRemittanceSession)</text>
        <text x="10" y="68" class="card-bullet">• Quyết toán ví Shop, Webhook ngân hàng tự động gạch nợ thanh toán</text>
        <text x="10" y="88" class="card-meta">DB: payment_db (PostgreSQL 16) | Pattern: Transactional Outbox</text>
      </g>

      <!-- Svc 10: pricing-service -->
      <g transform="translate(10, 142)">
        <rect width="440" height="68" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="card-title">10. pricing-service (:3012)</text>
        <rect x="340" y="7" width="90" height="16" rx="3" fill="#000000"/>
        <text x="385" y="18" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">PRICING</text>
        <text x="10" y="36" class="card-bullet">• Tính cước bưu chính IATA: So sánh Trọng lượng thực vs Thể tích (D x R x C / 5000)</text>
        <text x="10" y="52" class="card-bullet">• Bảng giá bậc thang theo vùng miền, phụ phí bảo hiểm, phụ phí giao vùng sâu</text>
      </g>

      <!-- Svc 11: reporting-service -->
      <g transform="translate(10, 218)">
        <rect width="440" height="74" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="card-title">11. reporting-service (:3009)</text>
        <rect x="340" y="7" width="90" height="16" rx="3" fill="#000000"/>
        <text x="385" y="18" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">ANALYTICS</text>
        <text x="10" y="36" class="card-bullet">• Tổng hợp dữ liệu OLAP, Snapshot hiệu suất bưu cục hàng ngày (DailySnapshot)</text>
        <text x="10" y="52" class="card-bullet">• Tính điểm KPI giao hàng thành công bưu tá, Tỷ lệ giao trễ SLA bưu phẩm</text>
        <text x="10" y="66" class="card-meta">DB: reporting_db (PostgreSQL 16) | Pattern: CQRS Read-Model</text>
      </g>

      <!-- Svc 12 & 13: tracking-service & ai-assistant-service -->
      <g transform="translate(10, 300)">
        <rect width="440" height="70" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="card-title">12. tracking-service (:3008) &amp; 13. ai-assistant (:3013)</text>
        <rect x="340" y="7" width="90" height="16" rx="3" fill="#000000"/>
        <text x="385" y="18" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">EXTENSIONS</text>
        <text x="10" y="36" class="card-bullet">• tracking-service: Lưu trữ Timeline truy vết bưu phẩm (DB: tracking_db)</text>
        <text x="10" y="52" class="card-bullet">• ai-assistant: Trợ lý thông minh hỗ trợ tra cứu nhanh &amp; điều hướng tác vụ</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # CONNECTOR: TIER 3 -> TIERS 4 & 5 (y: 870 to 905, gap = 35)
    # =========================================================================
    lines.append(f'''
  <!-- CONNECTOR BUS: TIER 3 -> TIERS 4 & 5 -->
  <g id="Bus_3_to_4_and_5">
    <!-- Left Branch to RabbitMQ -->
    <line x1="500" y1="870" x2="500" y2="905" stroke="#000000" stroke-width="1.5"/>
    <polygon points="496,905 500,912 504,905" fill="#000000"/>
    <rect x="250" y="880" width="460" height="18" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    <text x="480" y="893" class="flow-label" text-anchor="middle">Transactional Outbox Workers • AMQP 0-9-1 Reliable Publish</text>

    <!-- Right Branch to Databases & Redis -->
    <line x1="1500" y1="870" x2="1500" y2="905" stroke="#000000" stroke-width="1.5"/>
    <polygon points="1496,905 1500,912 1504,905" fill="#000000"/>
    <rect x="1270" y="880" width="460" height="18" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    <text x="1500" y="893" class="flow-label" text-anchor="middle">Isolated TCP Connections • Prisma Connection Pool • Redis Pipeline</text>
  </g>
''')

    # =========================================================================
    # TẦNG 4 & TẦNG 5: DUAL INFRASTRUCTURE TIER (y: 915 to 1215, h: 300)
    # =========================================================================
    lines.append(f'''
  <!-- TIER 4: EVENT-DRIVEN MESSAGE BROKER (LEFT HALF, w: 940) -->
  <g id="Tier_4_RabbitMQ" transform="translate(40, 915)">
    <rect width="940" height="300" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
    <rect width="940" height="28" rx="6" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
    <rect x="14" y="7" width="5" height="14" rx="1" fill="#000000"/>
    <text x="26" y="19" class="tier-header">TẦNG 4: EVENT-DRIVEN MESSAGE BROKER &amp; ASYNC SAGA MESH (RABBITMQ AMQP)</text>
    <text x="922" y="19" class="tier-badge" text-anchor="end">EVENTUAL CONSISTENCY • OUTBOX PATTERN</text>
    
    <!-- Exchange Architecture Box -->
    <g transform="translate(18, 36)">
      <rect width="904" height="68" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <text x="12" y="18" class="card-title">Cấu trúc Sàn giao dịch Thông điệp (RabbitMQ Exchange Topology)</text>
      <text x="12" y="36" class="card-bullet">• Topic Exchange trung tâm: nexus.logistics.topic định tuyến sự kiện theo routing key phân cấp</text>
      <text x="12" y="52" class="card-bullet">• Xử lý lỗi &amp; Tự phục hồi: Dead Letter Exchange (DLX: nexus.dlx) kết hợp chính sách Retry theo số mũ (Exponential Backoff)</text>
    </g>

    <!-- Outbox Pattern & Reliability Box -->
    <g transform="translate(18, 112)">
      <rect width="440" height="172" rx="4" fill="#FAFAFA" stroke="#000000" stroke-width="1"/>
      <text x="12" y="18" class="card-title">Cơ chế Transactional Outbox Pattern</text>
      <text x="12" y="38" class="card-bullet">• Chống Dual-Write Hazard: Bản ghi sự kiện</text>
      <text x="20" y="54" class="card-bullet">được lưu vào bảng OutboxEvent trong cùng</text>
      <text x="20" y="70" class="card-bullet">giao dịch ACID cục bộ với dữ liệu nghiệp vụ.</text>
      <text x="12" y="90" class="card-bullet">• Outbox Publisher Worker: Luồng nền quét các</text>
      <text x="20" y="106" class="card-bullet">sự kiện PENDING, bắn lên RabbitMQ an toàn.</text>
      <text x="12" y="126" class="card-bullet">• Idempotent Consumer: Kiểm tra trùng lặp qua</text>
      <text x="20" y="142" class="card-bullet">idempotencyKey đảm bảo đúng 1 lần (Exactly-once).</text>
    </g>

    <!-- Distributed Saga Choreography Box -->
    <g transform="translate(472, 112)">
      <rect width="450" height="172" rx="4" fill="#FAFAFA" stroke="#000000" stroke-width="1"/>
      <text x="12" y="18" class="card-title">Chuỗi Saga Phân tán Xuyên Dịch vụ (Saga Pipelines)</text>
      <text x="12" y="38" class="card-bullet">• Luồng Gom hàng (First-Mile Saga):</text>
      <text x="20" y="54" class="card-meta">SHIPMENT.CREATED → PICKUP.ASSIGNED → PICKUP.COLLECTED</text>
      <text x="12" y="74" class="card-bullet">• Luồng Trung chuyển (Middle-Mile Saga):</text>
      <text x="20" y="90" class="card-meta">MANIFEST.SEALED → DISPATCH.TRANSIT → SCAN.HUB_ARRIVED</text>
      <text x="12" y="110" class="card-bullet">• Luồng Giao &amp; Đối soát tiền (Last-Mile &amp; COD Saga):</text>
      <text x="20" y="126" class="card-meta">DELIVERY.DELIVERED → PAYMENT.COD_COLLECTED → WALLET.CREDIT</text>
      <text x="12" y="146" class="card-bullet">• Luồng Khiếu nại (Claim Saga):</text>
      <text x="20" y="162" class="card-meta">DAMAGE.REPORTED → INVESTIGATION.LOCKED → CLAIM.APPROVED</text>
    </g>
  </g>

  <!-- TIER 5: PERSISTENCE & CACHE INFRASTRUCTURE (RIGHT HALF, w: 940) -->
  <g id="Tier_5_Persistence" transform="translate(1020, 915)">
    <rect width="940" height="300" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
    <rect width="940" height="28" rx="6" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
    <rect x="14" y="7" width="5" height="14" rx="1" fill="#000000"/>
    <text x="26" y="19" class="tier-header">TẦNG 5: DECOUPLED PERSISTENCE &amp; CACHE (DATABASE-PER-SERVICE)</text>
    <text x="922" y="19" class="tier-badge" text-anchor="end">11x ISOLATED POSTGRESQL 16 • DISTRIBUTED REDIS CACHE</text>
    
    <!-- 11 Databases Grid -->
    <g transform="translate(18, 36)">
      <rect width="904" height="150" rx="4" fill="#FAFAFA" stroke="#000000" stroke-width="1.2"/>
      <text x="12" y="18" class="card-title">Hệ Sinh Thái 11 Cơ Sở Dữ Liệu PostgreSQL 16 Độc Lập (Database-per-Service)</text>
      <text x="12" y="34" class="card-bullet">Nguyên tắc: Không dùng Foreign Key giữa các database; Phân định ranh giới sở hữu dữ liệu tuyệt đối</text>

      <!-- 11 Database Chips in 3 Rows -->
      <!-- Row 1 -->
      <g transform="translate(12, 44)">
        <rect width="210" height="28" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="chip-text">1. auth_db (:3010)</text>
        <text x="200" y="18" font-size="9" fill="#4B5563" text-anchor="end">PostgreSQL</text>

        <rect x="220" y="0" width="210" height="28" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="230" y="18" class="chip-text">2. masterdata_db (:3001)</text>
        <text x="420" y="18" font-size="9" fill="#4B5563" text-anchor="end">PostgreSQL</text>

        <rect x="440" y="0" width="210" height="28" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="450" y="18" class="chip-text">3. shipment_db (:3002)</text>
        <text x="640" y="18" font-size="9" fill="#4B5563" text-anchor="end">PostgreSQL</text>

        <rect x="660" y="0" width="210" height="28" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="670" y="18" class="chip-text">4. pickup_db (:3003)</text>
        <text x="860" y="18" font-size="9" fill="#4B5563" text-anchor="end">PostgreSQL</text>
      </g>

      <!-- Row 2 -->
      <g transform="translate(12, 78)">
        <rect width="210" height="28" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="chip-text">5. dispatch_db (:3004)</text>
        <text x="200" y="18" font-size="9" fill="#4B5563" text-anchor="end">PostgreSQL</text>

        <rect x="220" y="0" width="210" height="28" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="230" y="18" class="chip-text">6. manifest_db (:3005)</text>
        <text x="420" y="18" font-size="9" fill="#4B5563" text-anchor="end">PostgreSQL</text>

        <rect x="440" y="0" width="210" height="28" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="450" y="18" class="chip-text">7. scan_db (:3006)</text>
        <text x="640" y="18" font-size="9" fill="#4B5563" text-anchor="end">PostgreSQL</text>

        <rect x="660" y="0" width="210" height="28" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="670" y="18" class="chip-text">8. delivery_db (:3007)</text>
        <text x="860" y="18" font-size="9" fill="#4B5563" text-anchor="end">PostgreSQL</text>
      </g>

      <!-- Row 3 -->
      <g transform="translate(12, 112)">
        <rect width="280" height="28" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="10" y="18" class="chip-text">9. payment_db (:3011)</text>
        <text x="270" y="18" font-size="9" fill="#4B5563" text-anchor="end">PostgreSQL (COD/Wallet)</text>

        <rect x="295" y="0" width="280" height="28" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="305" y="18" class="chip-text">10. tracking_db (:3008)</text>
        <text x="565" y="18" font-size="9" fill="#4B5563" text-anchor="end">PostgreSQL (Milestones)</text>

        <rect x="590" y="0" width="280" height="28" rx="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
        <text x="600" y="18" class="chip-text">11. reporting_db (:3009)</text>
        <text x="860" y="18" font-size="9" fill="#4B5563" text-anchor="end">PostgreSQL (OLAP Data)</text>
      </g>
    </g>

    <!-- Redis Distributed Cache Cluster Box -->
    <g transform="translate(18, 196)">
      <rect width="904" height="88" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <text x="12" y="18" class="card-title">Cụm Bộ Nhớ Đệm Phân Tán (Redis Distributed Cache Mesh :6379)</text>
      <text x="12" y="38" class="card-bullet">• PublicTrackingCache: Lưu bộ nhớ đệm hành trình bưu kiện (TTL = 300s), giải tỏa 92% tải đọc trực tiếp từ database</text>
      <text x="12" y="54" class="card-bullet">• SessionStore &amp; TokenRevocation: Quản lý danh sách đen thu hồi JWT Refresh Token và phiên người dùng đăng nhập</text>
      <text x="12" y="70" class="card-bullet">• RateLimitRegistry: Đồng hồ đếm tần suất truy cập API Gateway theo IP và Token chống cào dữ liệu đơn hàng trái phép</text>
    </g>
  </g>
''')

    # =========================================================================
    # FOOTER BAR (y: 1225 to 1275, h: 50)
    # =========================================================================
    lines.append(f'''
  <!-- FOOTER -->
  <g id="FooterBar" transform="translate(40, 1225)">
    <rect width="{width - 80}" height="45" rx="6" fill="#F9FAFB" stroke="#000000" stroke-width="1.4"/>
    <circle cx="22" cy="22" r="4.5" fill="#000000"/>
    <text x="36" y="26" font-size="11" font-weight="700" fill="#000000">GHI CHÚ KỸ THUẬT KIẾN TRÚC:</text>
    <text x="235" y="26" font-size="10.5" fill="#1F2937">Bản vẽ kiến trúc hệ thống tổng thể theo chuẩn UML Component &amp; Deployment Blueprint • Ánh xạ 100% dịch vụ và cơ sở dữ liệu thực tế trong mã nguồn dự án</text>
    <text x="{width - 80 - 20}" y="26" font-size="11" font-weight="600" fill="#4B5563" text-anchor="end">Nexus Express Software Engineering Thesis • Section 1.2</text>
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
