#!/usr/bin/env python3
"""
generate-chatbot-subsystem-architecture.py
Generates the high-level structural component architecture diagram for the Nexus AI Chatbot Subsystem
for Figma Page 1 (Section 1.4A) in the Nexus Logistics Management System graduation thesis.

Outputs to:
  docs/graduation-thesis/figma-page-1-system-and-data/diagrams/04-architecture-ai-chatbot-subsystem.svg

Dimensions:
  Width: 3600px, Height: 2550px
Style:
  Monochrome Technical Blueprint (Trắng - Đen - Xám chuẩn kỹ thuật)
  Strict Figma Compatibility: 100% inline vector shapes (<polygon>, <rect>, <circle>, <path>, <line>), ZERO SVG <marker> tags.
  Grounding: 100% matched to services/chatbot-service architecture and schemas.
"""

import xml.etree.ElementTree as ET
import html
import os

OUTPUT_FILE = "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/04-architecture-ai-chatbot-subsystem.svg"

def build_architecture_svg():
    width = 3600
    height = 2550
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
    
    .hdr-title {{ font-size: 28px; font-weight: 800; fill: #000000; letter-spacing: -0.5px; }}
    .hdr-sub {{ font-size: 15.5px; font-weight: 500; fill: #374151; }}
    .hdr-tag {{ font-size: 13px; font-weight: 700; fill: #FFFFFF; font-family: ui-monospace, Menlo, monospace; }}
    
    .tier-header {{ font-size: 16px; font-weight: 800; fill: #000000; letter-spacing: 0.8px; text-transform: uppercase; }}
    .block-title {{ font-size: 15px; font-weight: 800; fill: #000000; letter-spacing: 0.4px; }}
    .block-meta {{ font-size: 12.5px; font-weight: 600; fill: #4B5563; font-family: ui-monospace, Menlo, monospace; }}
    
    .card-title {{ font-size: 14.5px; font-weight: 700; fill: #000000; }}
    .card-code {{ font-size: 12px; font-weight: 600; fill: #111827; font-family: ui-monospace, Menlo, monospace; }}
    .card-bullet {{ font-size: 13px; font-weight: 500; fill: #374151; }}
    .card-bullet-bold {{ font-size: 13px; font-weight: 700; fill: #111827; }}
    .card-desc {{ font-size: 12px; font-weight: 500; fill: #4B5563; line-height: 1.4; }}
    
    .tag-badge {{ font-size: 11px; font-weight: 700; fill: #FFFFFF; font-family: ui-monospace, Menlo, monospace; }}
    .flow-label {{ font-size: 12px; font-weight: 700; fill: #000000; font-family: ui-monospace, Menlo, monospace; text-transform: uppercase; }}
    
    .cyl-label {{ font-size: 13.5px; font-weight: 800; fill: #000000; text-anchor: middle; }}
    .cyl-sub {{ font-size: 11.5px; font-weight: 600; fill: #4B5563; text-anchor: middle; font-family: ui-monospace, Menlo, monospace; }}
  </style>
''')

    # Dimensions setup
    margin_x = 70
    content_w = width - margin_x * 2  # 3460px

    # =========================================================================
    # HEADER BAR (y: 45 to 145, h: 100)
    # =========================================================================
    lines.append(f'''
  <!-- HEADER BAR -->
  <g id="HeaderBar" transform="translate({margin_x}, 45)">
    <rect width="{content_w}" height="100" rx="8" fill="#F9FAFB" stroke="#000000" stroke-width="2"/>
    
    <text x="30" y="42" class="hdr-title">HÌNH 1.4: SƠ ĐỒ KIẾN TRÚC THÀNH PHẦN PHÂN HỆ AI CHATBOT (NEXUS AI ASSISTANT SUBSYSTEM)</text>
    <text x="30" y="74" class="hdr-sub">Kiến trúc khối chức năng đa tầng: Giao diện Client, Cổng kiểm soát bảo mật PII, Lõi suy luận nhận thức, Phân hệ gọi Tool, Chỉ mục tri thức RAG và Tầng Adapter tích hợp</text>
    
    <!-- Top-Right Architectural Badges -->
    <g transform="translate({content_w - 710}, 30)">
      <rect x="0" y="0" width="165" height="34" rx="4" fill="#000000"/>
      <text x="82" y="22" text-anchor="middle" class="hdr-tag">COMPONENT MESH</text>
      
      <rect x="175" y="0" width="165" height="34" rx="4" fill="#000000"/>
      <text x="257" y="22" text-anchor="middle" class="hdr-tag">DUAL-ENGINE CORE</text>
      
      <rect x="350" y="0" width="165" height="34" rx="4" fill="#000000"/>
      <text x="432" y="22" text-anchor="middle" class="hdr-tag">TOOL ORCHESTRATOR</text>
      
      <rect x="525" y="0" width="165" height="34" rx="4" fill="#000000"/>
      <text x="607" y="22" text-anchor="middle" class="hdr-tag">VECTOR STORE</text>
    </g>
  </g>
''')

    # =========================================================================
    # TẦNG 1: CLIENT & PRESENTATION LAYER (y: 170 to 440, h: 270)
    # =========================================================================
    t1_y = 170
    t1_h = 270
    c_w = 820
    c_gap = (content_w - c_w * 4) // 3  # (3460 - 3280) // 3 = 60px

    lines.append(f'''
  <!-- TIER 1: CLIENT APPS LAYER -->
  <g id="Tier_1_Clients" transform="translate({margin_x}, {t1_y})">
    <rect width="{content_w}" height="{t1_h}" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{content_w}" height="42" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="20" y="12" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="36" y="28" class="tier-header">TẦNG 1: GIAO DIỆN NGƯỜI DÙNG &amp; CÁC KÊNH TƯƠNG TÁC (CLIENT &amp; PRESENTATION LAYER)</text>

    <!-- Client Card 1: Merchant Web Dashboard -->
    <g transform="translate(0, 56)">
      <rect width="{c_w}" height="200" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      
      <!-- Icon & Header -->
      <circle cx="36" cy="32" r="16" fill="#111827"/>
      <text x="36" y="38" text-anchor="middle" font-size="14" fill="#FFFFFF">💬</text>
      <text x="64" y="28" class="block-title">MERCHANT DASHBOARD CHAT</text>
      <text x="64" y="44" class="block-meta">React 18 • TypeScript • Tailwind CSS • Lucide</text>
      
      <g transform="translate(18, 56)">
        <rect width="{c_w - 36}" height="128" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>
        <text x="14" y="24" class="card-bullet"><tspan class="card-bullet-bold">• Giao diện ngăn kéo (Chat Drawer):</tspan> Tích hợp góc phải màn hình Merchant Portal.</text>
        <text x="14" y="46" class="card-bullet"><tspan class="card-bullet-bold">• Ngữ cảnh tài khoản Shop:</tspan> Tự động đính kèm <tspan font-family="monospace">userId, role='MERCHANT'</tspan> vào Header.</text>
        <text x="14" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Thao tác nhanh 1-Click:</tspan> Gợi ý câu hỏi cước phí, hạn mức bồi thường, đối soát COD.</text>
        <text x="14" y="90" class="card-bullet"><tspan class="card-bullet-bold">• Hiển thị Thẻ vận đơn (Cards):</tspan> Xem nhanh danh sách đơn hàng đang phát trực tiếp.</text>
        <text x="14" y="112" class="card-bullet"><tspan class="card-bullet-bold">• Kênh kết nối:</tspan> Gọi REST API <tspan font-family="monospace">POST /api/v1/chat/message</tspan> nhận JSON DTO.</text>
      </g>
    </g>

    <!-- Client Card 2: Customer Tracking Portal -->
    <g transform="translate({c_w + c_gap}, 56)">
      <rect width="{c_w}" height="200" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      
      <circle cx="36" cy="32" r="16" fill="#111827"/>
      <text x="36" y="38" text-anchor="middle" font-size="14" fill="#FFFFFF">👥</text>
      <text x="64" y="28" class="block-title">CUSTOMER PORTAL CHAT WIDGET</text>
      <text x="64" y="44" class="block-meta">Public Tracking Web • SSE Stream Subscriber</text>
      
      <g transform="translate(18, 56)">
        <rect width="{c_w - 36}" height="128" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>
        <text x="14" y="24" class="card-bullet"><tspan class="card-bullet-bold">• Widget tra cứu công khai:</tspan> Dành cho người nhận tra cứu hành trình không cần đăng nhập.</text>
        <text x="14" y="46" class="card-bullet"><tspan class="card-bullet-bold">• Chế độ khách vãng lai (GUEST):</tspan> Kích hoạt cơ chế che dấu thông tin PII bảo mật.</text>
        <text x="14" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Luồng sinh từ ngữ tức thì (SSE):</tspan> Đăng ký kênh <tspan font-family="monospace">POST /api/v1/chat/stream</tspan>.</text>
        <text x="14" y="90" class="card-bullet"><tspan class="card-bullet-bold">• Hiệu ứng gõ phím mượt mà:</tspan> Nhận từng <tspan font-family="monospace">event: token</tspan> delay 25ms tạo trải nghiệm sống động.</text>
        <text x="14" y="112" class="card-bullet"><tspan class="card-bullet-bold">• Trích dẫn nguồn tài liệu:</tspan> Cho phép bấm mở văn bản quy định đóng gói, giao nhận.</text>
      </g>
    </g>

    <!-- Client Card 3: Mobile Driver App -->
    <g transform="translate({(c_w + c_gap) * 2}, 56)">
      <rect width="{c_w}" height="200" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      
      <circle cx="36" cy="32" r="16" fill="#111827"/>
      <text x="36" y="38" text-anchor="middle" font-size="14" fill="#FFFFFF">📱</text>
      <text x="64" y="28" class="block-title">DRIVER &amp; COURIER MOBILE APP</text>
      <text x="64" y="44" class="block-meta">React Native • Mobile Carrier Voice Assistant</text>
      
      <g transform="translate(18, 56)">
        <rect width="{c_w - 36}" height="128" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>
        <text x="14" y="24" class="card-bullet"><tspan class="card-bullet-bold">• Trợ lý bưu tá ngoài hiện trường:</tspan> Hỗ trợ tra cứu quy chuẩn đồng kiểm, hàng vỡ.</text>
        <text x="14" y="46" class="card-bullet"><tspan class="card-bullet-bold">• Tiếp nhận cờ ưu tiên phát:</tspan> Nhận thông báo tức thời khi hệ thống kích hoạt giục đơn.</text>
        <text x="14" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Hướng dẫn lập Biên bản sự cố:</tspan> Hướng dẫn chụp ảnh 4 góc và điền mã bất thường.</text>
        <text x="14" y="90" class="card-bullet"><tspan class="card-bullet-bold">• Kiểm tra tiền COD &amp; Nợ trần:</tspan> Tra cứu chính sách thu hộ và khóa app khi nợ quá hạn.</text>
        <text x="14" y="112" class="card-bullet"><tspan class="card-bullet-bold">• Phản hồi nhanh (Quick Replies):</tspan> Phím tắt báo bận hoặc liên hệ trực tiếp người nhận.</text>
      </g>
    </g>

    <!-- Client Card 4: Operations & Admin Console -->
    <g transform="translate({(c_w + c_gap) * 3}, 56)">
      <rect width="{c_w}" height="200" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      
      <circle cx="36" cy="32" r="16" fill="#111827"/>
      <text x="36" y="38" text-anchor="middle" font-size="14" fill="#FFFFFF">⚙️</text>
      <text x="64" y="28" class="block-title">OPERATIONS &amp; ADMIN CONSOLE</text>
      <text x="64" y="44" class="block-meta">Internal Hub Dashboard • Knowledge Reindexer</text>
      
      <g transform="translate(18, 56)">
        <rect width="{c_w - 36}" height="128" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>
        <text x="14" y="24" class="card-bullet"><tspan class="card-bullet-bold">• Bảng điều phối vé CSKH:</tspan> Tiếp nhận các phiên Handover từ AI vào hàng đợi ưu tiên.</text>
        <text x="14" y="46" class="card-bullet"><tspan class="card-bullet-bold">• Đồng bộ tri thức tức thì:</tspan> Kích hoạt <tspan font-family="monospace">POST /api/v1/chat/ingest</tspan> khi sửa đổi SOP.</text>
        <text x="14" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Giám sát hiệu năng RAG:</tspan> Theo dõi chỉ số Latency (ms), Top-5 Matches và Hit Rate.</text>
        <text x="14" y="90" class="card-bullet"><tspan class="card-bullet-bold">• Kiểm soát tồn kho Hub:</tspan> Xem danh sách bưu gửi lưu kho quá hạn theo Điều 18 &amp; 28.</text>
        <text x="14" y="112" class="card-bullet"><tspan class="card-bullet-bold">• Audit Log bảo mật:</tspan> Ghi vết 100% truy vấn và phát hiện hành vi dò quét PII.</text>
      </g>
    </g>
  </g>
''')

    # Connector 1 -> 2
    y_c12 = t1_y + t1_h
    lines.append(f'''
  <!-- Connector Tier 1 -> Tier 2 -->
  <g id="Connector_T1_T2">
    <line x1="{width // 2}" y1="{y_c12}" x2="{width // 2}" y2="{y_c12 + 45}" stroke="#000000" stroke-width="2.2"/>
    <polygon points="{width // 2 - 8},{y_c12 + 45} {width // 2},{y_c12 + 58} {width // 2 + 8},{y_c12 + 45}" fill="#000000"/>
    <rect x="{width // 2 - 160}" y="{y_c12 + 12}" width="320" height="24" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    <text x="{width // 2}" y="{y_c12 + 28}" text-anchor="middle" class="flow-label">HTTP REST / SSE STREAMING PROTOCOL (:3010)</text>
  </g>
''')

    # =========================================================================
    # TẦNG 2: CONTROLLER, SECURITY & SESSION LAYER (y: 500 to 860, h: 360)
    # =========================================================================
    t2_y = 500
    t2_h = 360
    b2_w = (content_w - 40) // 3  # (3460 - 40) // 3 = 1140px

    lines.append(f'''
  <!-- TIER 2: CONTROLLER & SECURITY LAYER -->
  <g id="Tier_2_Gateway_Security" transform="translate({margin_x}, {t2_y})">
    <rect width="{content_w}" height="{t2_h}" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{content_w}" height="42" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="20" y="12" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="36" y="28" class="tier-header">TẦNG 2: CỔNG TIẾP NHẬN, ĐIỀU KHIỂN &amp; HÀNG RÀO BẢO VỆ DỮ LIỆU (CONTROLLER &amp; SECURITY LAYER)</text>

    <!-- Block 2.1: ChatController & API Handlers -->
    <g transform="translate(0, 56)">
      <rect width="{b2_w}" height="290" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <circle cx="36" cy="32" r="16" fill="#111827"/>
      <text x="36" y="38" text-anchor="middle" font-size="14" fill="#FFFFFF">🚪</text>
      <text x="64" y="28" class="block-title">CHATBOT API CONTROLLER &amp; EVENT STREAMER</text>
      <text x="64" y="44" class="block-meta">ChatController • NestJS @Controller('api/v1/chat')</text>

      <g transform="translate(18, 56)">
        <rect width="{b2_w - 36}" height="218" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>
        
        <!-- Endpoint 1 -->
        <rect x="12" y="12" width="{b2_w - 60}" height="46" rx="3" fill="#F9FAFB" stroke="#000000" stroke-width="0.8"/>
        <text x="22" y="30" class="card-code">POST /api/v1/chat/message (Standard REST API)</text>
        <text x="22" y="48" class="card-desc">Tiếp nhận ChatRequestDto ➔ Trả về JSON ChatResponseDto đầy đủ (citations, tools, cards).</text>

        <!-- Endpoint 2 -->
        <rect x="12" y="66" width="{b2_w - 60}" height="46" rx="3" fill="#F9FAFB" stroke="#000000" stroke-width="0.8"/>
        <text x="22" y="84" class="card-code">POST /api/v1/chat/stream (Server-Sent Events / SSE)</text>
        <text x="22" y="102" class="card-desc">Thiết lập luồng Text-Event-Stream: metadata ➔ token ➔ done với AsyncGenerator.</text>

        <!-- Endpoint 3 -->
        <rect x="12" y="120" width="{b2_w - 60}" height="46" rx="3" fill="#F9FAFB" stroke="#000000" stroke-width="0.8"/>
        <text x="22" y="138" class="card-code">POST /api/v1/chat/ingest (Knowledge Reindex Trigger)</text>
        <text x="22" y="156" class="card-desc">Endpoint quản trị nội bộ quét toàn bộ 9 SOPs và sinh lại vector index hàng loạt.</text>

        <!-- Rate Limiter Note -->
        <text x="14" y="184" class="card-bullet"><tspan class="card-bullet-bold">• Kiểm soát lưu lượng:</tspan> Rate Limiting 60 req/phút/IP chống tấn công vét cạn tài nguyên.</text>
        <text x="14" y="204" class="card-bullet"><tspan class="card-bullet-bold">• Bộ lọc dữ liệu rỗng:</tspan> Validate payload và tự động hủy bỏ các tin nhắn trắng hoặc spam.</text>
      </g>
    </g>

    <!-- Block 2.2: PII Security & Data Protection Guardrail -->
    <g transform="translate({b2_w + 20}, 56)">
      <rect width="{b2_w}" height="290" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <circle cx="36" cy="32" r="16" fill="#111827"/>
      <text x="36" y="38" text-anchor="middle" font-size="14" fill="#FFFFFF">🛡️</text>
      <text x="64" y="28" class="block-title">HÀNG RÀO BẢO VỆ DỮ LIỆU CÁ NHÂN (PII SANITIZER)</text>
      <text x="64" y="44" class="block-meta">Nghị định 13/2023/NĐ-CP • Luật Bưu chính 2010</text>

      <g transform="translate(18, 56)">
        <rect width="{b2_w - 36}" height="218" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>

        <!-- PII Masking Box -->
        <rect x="12" y="12" width="{b2_w - 60}" height="66" rx="3" fill="#FEF2F2" stroke="#EF4444" stroke-width="1"/>
        <text x="22" y="30" font-size="12" font-weight="700" fill="#991B1B">MẶT NẠ DỮ LIỆU TỰ ĐỘNG (PII DATA MASKING ENGINE):</text>
        <text x="22" y="48" font-size="12" font-weight="600" fill="#1F2937">SĐT: 0987654321 ➔ 098****321 | Tên: Nguyễn Văn An ➔ Nguyễn V** A*</text>
        <text x="22" y="66" font-size="12" font-weight="600" fill="#1F2937">Địa chỉ chi tiết: Số 12A Ngõ 99 Cầu Giấy ➔ Số 12***, Q. Cầu Giấy, Hà Nội</text>

        <text x="14" y="98" class="card-bullet"><tspan class="card-bullet-bold">• Kiểm soát phân quyền RBAC:</tspan> Phân loại vai trò <tspan font-family="monospace">GUEST</tspan> vs <tspan font-family="monospace">CUSTOMER / MERCHANT</tspan>.</text>
        <text x="14" y="120" class="card-bullet"><tspan class="card-bullet-bold">• Chặn tiết lộ thông tin đơn hàng:</tspan> Khách vãng lai bắt buộc phải cung cấp mã vận đơn cụ thể.</text>
        <text x="14" y="142" class="card-bullet"><tspan class="card-bullet-bold">• Chống tấn công Prompt Injection:</tspan> Ngăn ngừa người dùng nhập lệnh phá vỡ vai trò (Jailbreak).</text>
        <text x="14" y="164" class="card-bullet"><tspan class="card-bullet-bold">• Bảo mật tài chính COD:</tspan> Số tài khoản và số dư ví chỉ hiển thị trong giao dịch nội bộ có mã hóa.</text>
        <text x="14" y="186" class="card-bullet"><tspan class="card-bullet-bold">• Cảnh báo bảo mật hệ thống:</tspan> Nhắc nhở khách đăng nhập để bảo vệ toàn vẹn dữ liệu cá nhân.</text>
        <text x="14" y="206" class="card-bullet"><tspan class="card-bullet-bold">• Tiêu chuẩn tuân thủ:</tspan> Đáp ứng yêu cầu cách ly dữ liệu bưu chính theo Điều 25 Luật Bưu chính.</text>
      </g>
    </g>

    <!-- Block 2.3: Session & Conversation Manager -->
    <g transform="translate({(b2_w + 20) * 2}, 56)">
      <rect width="{b2_w}" height="290" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <circle cx="36" cy="32" r="16" fill="#111827"/>
      <text x="36" y="38" text-anchor="middle" font-size="14" fill="#FFFFFF">🔄</text>
      <text x="64" y="28" class="block-title">QUẢN LÝ PHIÊN &amp; NGỮ CẢNH HỘI THOẠI (SESSION)</text>
      <text x="64" y="44" class="block-meta">Conversation State Manager • Multi-turn Memory Window</text>

      <g transform="translate(18, 56)">
        <rect width="{b2_w - 36}" height="218" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>

        <!-- Session Box -->
        <rect x="12" y="12" width="{b2_w - 60}" height="46" rx="3" fill="#F8FAFC" stroke="#000000" stroke-width="0.8"/>
        <text x="22" y="30" class="card-code">Định danh hội thoại: conversationId = `conv-${{Date.now()}}-${{uuid}}`</text>
        <text x="22" y="48" class="card-desc">Tự động duy trì chuỗi ngữ cảnh liên tục qua các lượt đối thoại (Multi-turn).</text>

        <text x="14" y="78" class="card-bullet"><tspan class="card-bullet-bold">• Cửa sổ bộ nhớ ngữ cảnh:</tspan> Lưu trữ 6 lượt tin nhắn gần nhất để hiểu đại từ thay thế (nó, đơn này).</text>
        <text x="14" y="100" class="card-bullet"><tspan class="card-bullet-bold">• Truy vết thực thể (Entity Tracking):</tspan> Nhớ mã vận đơn đã nhắc tới ở câu trước để tra cứu tiếp.</text>
        <text x="14" y="122" class="card-bullet"><tspan class="card-bullet-bold">• Hủy phiên tự động (TTL):</tspan> Giải phóng bộ nhớ phiên sau 30 phút không phát sinh tương tác mới.</text>
        <text x="14" y="144" class="card-bullet"><tspan class="card-bullet-bold">• Đo lường thời gian đáp ứng:</tspan> Tích hợp bộ đếm <tspan font-family="monospace">latencyMs = Date.now() - startTime</tspan>.</text>
        <text x="14" y="166" class="card-bullet"><tspan class="card-bullet-bold">• Tích hợp thẻ tương tác:</tspan> Gắn kết mảng <tspan font-family="monospace">shipmentCards[]</tspan> tương ứng với phiên người dùng.</text>
        <text x="14" y="188" class="card-bullet"><tspan class="card-bullet-bold">• Chuyển đổi trạng thái:</tspan> Đánh dấu cờ Handover khi khách yêu cầu gặp nhân viên CSKH.</text>
        <text x="14" y="208" class="card-bullet"><tspan class="card-bullet-bold">• Tối ưu hóa Ram:</tspan> Dữ liệu ngữ cảnh tạm thời lưu trữ phân tán, đảm bảo khả năng mở rộng.</text>
      </g>
    </g>
  </g>
''')

    # Connector 2 -> 3
    y_c23 = t2_y + t2_h
    lines.append(f'''
  <!-- Connector Tier 2 -> Tier 3 -->
  <g id="Connector_T2_T3">
    <line x1="{width // 2}" y1="{y_c23}" x2="{width // 2}" y2="{y_c23 + 45}" stroke="#000000" stroke-width="2.2"/>
    <polygon points="{width // 2 - 8},{y_c23 + 45} {width // 2},{y_c23 + 58} {width // 2 + 8},{y_c23 + 45}" fill="#000000"/>
    <rect x="{width // 2 - 180}" y="{y_c23 + 12}" width="360" height="24" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    <text x="{width // 2}" y="{y_c23 + 28}" text-anchor="middle" class="flow-label">CLEANED QUERY &amp; SECURITY CONTEXT DISPATCH</text>
  </g>
''')

    # =========================================================================
    # TẦNG 3: COGNITIVE CORE & ORCHESTRATION ENGINE (y: 920 to 1570, h: 650)
    # =========================================================================
    t3_y = 920
    t3_h = 650

    lines.append(f'''
  <!-- TIER 3: COGNITIVE CORE & ORCHESTRATION ENGINE -->
  <g id="Tier_3_Cognitive_Core" transform="translate({margin_x}, {t3_y})">
    <rect width="{content_w}" height="{t3_h}" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{content_w}" height="42" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="20" y="12" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="36" y="28" class="tier-header">TẦNG 3: LÕI SUY LUẬN NHẬN THỨC, PHÂN LOẠI Ý ĐỊNH &amp; ĐIỀU PHỐI TOOL (COGNITIVE ORCHESTRATOR)</text>

    <!-- Sub-row 3A: 3 Upper Cognitive Blocks (w = 1140, h = 230) -->
    <!-- Block 3.1: Query Preprocessor & Entity Matcher -->
    <g transform="translate(0, 54)">
      <rect width="{b2_w}" height="230" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <circle cx="36" cy="30" r="15" fill="#111827"/>
      <text x="36" y="36" text-anchor="middle" font-size="13" fill="#FFFFFF">🔍</text>
      <text x="64" y="26" class="block-title">CHUẨN HÓA &amp; BÓC TÁCH THỰC THỂ (EXTRACTOR)</text>
      <text x="64" y="42" class="block-meta">Vietnamese Normalizer • Regex Entity Pattern Matcher</text>

      <g transform="translate(18, 52)">
        <rect width="{b2_w - 36}" height="162" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>
        <text x="14" y="22" class="card-bullet"><tspan class="card-bullet-bold">• Chuẩn hóa tiếng Việt NFD:</tspan> Loại bỏ dấu thanh, chuyển <tspan font-family="monospace">đ -&gt; d</tspan>, khử ký tự đặc biệt.</text>
        <text x="14" y="42" class="card-bullet"><tspan class="card-bullet-bold">• Bóc tách Mã vận đơn:</tspan> Regex <tspan font-family="monospace">NX-[A-Z0-9]{{4,14}}</tspan> hoặc dải 12 số (<tspan font-family="monospace">101/111/333/222</tspan>).</text>
        <text x="14" y="62" class="card-bullet"><tspan class="card-bullet-bold">• Bóc tách Mã khiếu nại:</tspan> Regex <tspan font-family="monospace">CLM-[A-Z0-9]+</tspan> nhận diện hồ sơ đền bù sự cố.</text>
        <text x="14" y="82" class="card-bullet"><tspan class="card-bullet-bold">• Bóc tách Cân nặng &amp; Kích thước:</tspan> Regex trích xuất cân thực tế và kích thước 3 chiều.</text>
        <text x="14" y="102" class="card-bullet"><tspan class="card-bullet-bold">• Nhận diện Tuyến đường:</tspan> Bóc tách thành phố gửi và nhận (Hà Nội, TP.HCM, Đà Nẵng).</text>
        <text x="14" y="122" class="card-bullet"><tspan class="card-bullet-bold">• Khử hư từ (Stopwords):</tspan> Loại bỏ <tspan font-family="monospace">cho, cua, nay, voi, khi, duoc, trong, thi, sao...</tspan></text>
        <text x="14" y="144" class="card-bullet"><tspan class="card-bullet-bold">• Chuẩn bị truy vấn kép:</tspan> Trích xuất đồng thời cho cả Live Tool và véc-tơ hóa RAG.</text>
      </g>
    </g>

    <!-- Block 3.2: Dual-Engine Intent Switcher -->
    <g transform="translate({b2_w + 20}, 54)">
      <rect width="{b2_w}" height="230" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <circle cx="36" cy="30" r="15" fill="#111827"/>
      <text x="36" y="36" text-anchor="middle" font-size="13" fill="#FFFFFF">🔀</text>
      <text x="64" y="26" class="block-title">BỘ ĐỊNH TUYẾN Ý ĐỊNH KÉP (DUAL-ENGINE ROUTER)</text>
      <text x="64" y="42" class="block-meta">Deterministic Rule Switcher • Knowledge vs Live Tools</text>

      <g transform="translate(18, 52)">
        <rect width="{b2_w - 36}" height="162" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>
        
        <!-- Dual Branches Box -->
        <g transform="translate(12, 10)">
          <rect width="{(b2_w - 60)//2 - 6}" height="56" rx="3" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
          <text x="12" y="22" class="card-code">NHÁNH A: LIVE TOOLS ENGINE</text>
          <text x="12" y="40" class="card-desc">Gọi trực tiếp API Microservices nội bộ</text>

          <rect x="{(b2_w - 60)//2 + 6}" y="0" width="{(b2_w - 60)//2 - 6}" height="56" rx="3" fill="#F3F4F6" stroke="#000000" stroke-width="1"/>
          <text x="{(b2_w - 60)//2 + 18}" y="22" class="card-code">NHÁNH B: VECTOR RAG ENGINE</text>
          <text x="{(b2_w - 60)//2 + 18}" y="40" class="card-desc">Tìm kiếm tri thức trong Vector Store</text>
        </g>

        <text x="14" y="86" class="card-bullet"><tspan class="card-bullet-bold">• Phối hợp đa luồng đồng thời:</tspan> Khi câu hỏi vừa hỏi trạng thái đơn vừa hỏi quy định bồi thường.</text>
        <text x="14" y="106" class="card-bullet"><tspan class="card-bullet-bold">• Ưu tiên nghiệp vụ:</tspan> Ưu tiên gọi Tool lấy dữ liệu sống (Live State) trước khi suy luận RAG.</text>
        <text x="14" y="126" class="card-bullet"><tspan class="card-bullet-bold">• Cơ chế Fallback an toàn:</tspan> Nếu Microservice gián đoạn, tự chuyển sang văn bản chính sách tĩnh.</text>
        <text x="14" y="146" class="card-bullet"><tspan class="card-bullet-bold">• Đóng gói ngữ cảnh phụ:</tspan> Gom kết quả Tool vào <tspan font-family="monospace">toolAugmentedContext</tspan> gửi sang Prompt Builder.</text>
      </g>
    </g>

    <!-- Block 3.3: In-Context Prompt Augmentation Builder -->
    <g transform="translate({(b2_w + 20) * 2}, 54)">
      <rect width="{b2_w}" height="230" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <circle cx="36" cy="30" r="15" fill="#111827"/>
      <text x="36" y="36" text-anchor="middle" font-size="13" fill="#FFFFFF">🧩</text>
      <text x="64" y="26" class="block-title">BỘ TỔNG HỢP PROMPT NGỮ CẢNH (PROMPT BUILDER)</text>
      <text x="64" y="42" class="block-meta">In-Context Augmentation • Anti-Hallucination Framework</text>

      <g transform="translate(18, 52)">
        <rect width="{b2_w - 36}" height="162" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>
        
        <!-- 4 Prompt Layers Mini -->
        <g transform="translate(12, 10)">
          <rect width="{b2_w - 60}" height="22" rx="2" fill="#F3F4F6"/>
          <text x="10" y="15" font-size="11" font-weight="700" fill="#000000">LAYER 1: SYSTEM PERSONA (Chuyên viên Cao cấp Nghiệp vụ &amp; Vận hành Nexus)</text>

          <rect y="26" width="{b2_w - 60}" height="22" rx="2" fill="#F3F4F6"/>
          <text x="10" y="41" font-size="11" font-weight="700" fill="#000000">LAYER 2: LIVE SYSTEM CONTEXT (toolAugmentedContext trích xuất từ Microservices)</text>

          <rect y="52" width="{b2_w - 60}" height="22" rx="2" fill="#F3F4F6"/>
          <text x="10" y="67" font-size="11" font-weight="700" fill="#000000">LAYER 3: GROUNDED CITATIONS (Top-5 Chunks trích xuất từ Vector Store)</text>

          <rect y="78" width="{b2_w - 60}" height="22" rx="2" fill="#111827"/>
          <text x="10" y="93" font-size="11" font-weight="700" fill="#FFFFFF">LAYER 4: USER QUESTION &amp; MEMORY (Câu hỏi chuẩn hóa &amp; Lịch sử hội thoại)</text>
        </g>

        <text x="14" y="126" class="card-bullet"><tspan class="card-bullet-bold">• Chống ảo giác (Anti-Hallucination):</tspan> Nghiêm cấm phịa lộ trình bưu tá hoặc tự sáng tác số tiền COD.</text>
        <text x="14" y="148" class="card-bullet"><tspan class="card-bullet-bold">• Đề xuất tương tác (Call to Action):</tspan> Tự động hỏi khách có muốn tra cứu chi tiết từng kiện đơn.</text>
      </g>
    </g>

    <!-- Sub-row 3B: Logistics Tools Orchestration Engine (y: 298, h: 330) -->
    <g transform="translate(0, 298)">
      <rect width="{content_w}" height="336" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <circle cx="36" cy="30" r="15" fill="#111827"/>
      <text x="36" y="36" text-anchor="middle" font-size="13" fill="#FFFFFF">⚙️</text>
      <text x="64" y="26" class="block-title">PHÂN HỆ ĐIỀU PHỐI GỌI HÀM NGHIỆP VỤ LOGISTICS (LOGISTICS TOOLS ORCHESTRATION ENGINE)</text>
      <text x="64" y="42" class="block-meta">LogisticsToolsService • 5 Bộ công cụ kết nối Microservices thời gian thực</text>

      <!-- 5 Tools Cards side-by-side -->
      <g transform="translate(18, 52)">
        <!-- Tool 1: Tracking -->
        <g transform="translate(0, 0)">
          <rect width="{660}" height="268" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <rect width="{660}" height="32" rx="5" fill="#F3F4F6" stroke="#000000" stroke-width="0.8"/>
          <text x="14" y="21" class="card-title">1. TRACKING TOOL</text>
          <text x="14" y="48" class="card-code">trackShipment(code, isGuest)</text>
          <text x="14" y="66" class="card-code">getUserShipments(userId, limit=5)</text>
          
          <text x="14" y="92" class="card-bullet"><tspan class="card-bullet-bold">• Tra cứu hành trình live:</tspan> Gọi Shipment Service lấy lộ trình di chuyển thực tế.</text>
          <text x="14" y="112" class="card-bullet"><tspan class="card-bullet-bold">• Trích xuất thông số:</tspan> Bưu cục hiện tại, tên Shipper, giờ dự kiến giao hàng.</text>
          <text x="14" y="132" class="card-bullet"><tspan class="card-bullet-bold">• Cơ chế PII Masking:</tspan> Nếu là khách vãng lai, tự che số điện thoại và địa chỉ.</text>
          <text x="14" y="152" class="card-bullet"><tspan class="card-bullet-bold">• Chế độ nhiều đơn hàng:</tspan> Trả về tóm tắt danh sách 5 đơn hàng gần nhất của Shop.</text>
          <text x="14" y="172" class="card-bullet"><tspan class="card-bullet-bold">• Đính kèm Thẻ trực quan:</tspan> Trả về mảng <tspan font-family="monospace">shipmentCards[]</tspan> để hiển thị UI.</text>
          <text x="14" y="192" class="card-bullet"><tspan class="card-bullet-bold">• Trạng thái bưu kiện:</tspan> Khớp 9 trạng thái chuẩn: CREATED ➔ DELIVERED.</text>
          <text x="14" y="212" class="card-bullet"><tspan class="card-bullet-bold">• Không phịa dữ liệu:</tspan> Báo rõ nếu mã đơn không tồn tại trên hệ thống.</text>
          <text x="14" y="232" class="card-bullet"><tspan class="card-bullet-bold">• Tích hợp bản đồ:</tspan> Cung cấp tọa độ Hub hỗ trợ vẽ tuyến đường vệ tinh.</text>
          <text x="14" y="252" class="card-bullet"><tspan class="card-bullet-bold">• Kênh phản hồi:</tspan> Gắn nhãn tiến độ giao hàng theo thời gian thực.</text>
        </g>

        <!-- Tool 2: Pricing -->
        <g transform="translate(685, 0)">
          <rect width="{660}" height="268" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <rect width="{660}" height="32" rx="5" fill="#F3F4F6" stroke="#000000" stroke-width="0.8"/>
          <text x="14" y="21" class="card-title">2. VOLUMETRIC PRICING TOOL</text>
          <text x="14" y="48" class="card-code">calculatePricing(w, tier, from, to, role, dims)</text>
          <text x="14" y="66" class="card-code">calculateReturnFee(forwardFee, role)</text>
          
          <text x="14" y="92" class="card-bullet"><tspan class="card-bullet-bold">• Quy chuẩn hàng không IATA:</tspan> Tính thể tích <tspan class="math-text">W_v = (D × R × C) / 6000</tspan>.</text>
          <text x="14" y="112" class="card-bullet"><tspan class="card-bullet-bold">• Trọng lượng tính cước:</tspan> Áp dụng giá trị lớn hơn <tspan class="math-text">max(W_thực, W_thể_tích)</tspan>.</text>
          <text x="14" y="132" class="card-bullet"><tspan class="card-bullet-bold">• Cước cơ sở &amp; Nấc vượt:</tspan> 0.5kg đầu (18k-28k) + mỗi 0.5kg vượt (+3.5k-5k).</text>
          <text x="14" y="152" class="card-bullet"><tspan class="card-bullet-bold">• Phụ phí vùng miền:</tspan> Nội tỉnh (0đ), Trục Metro (+7.000đ), Liên tỉnh (+12.000đ).</text>
          <text x="14" y="172" class="card-bullet"><tspan class="card-bullet-bold">• Dự toán đa gói dịch vụ:</tspan> Báo đồng thời Gói Tiêu Chuẩn và Gói Nhanh Express.</text>
          <text x="14" y="192" class="card-bullet"><tspan class="card-bullet-bold">• Cước chuyển hoàn bưu gửi:</tspan> Tự động tính phí 50% cước chiều đi khi bị bom hàng.</text>
          <text x="14" y="212" class="card-bullet"><tspan class="card-bullet-bold">• Ưu đãi hợp đồng Shop:</tspan> Chiết khấu bảng cước theo cấp VIP Doanh nghiệp.</text>
          <text x="14" y="232" class="card-bullet"><tspan class="card-bullet-bold">• Cam kết SLA thời gian:</tspan> Đính kèm cam kết phát hàng (24h Express, 48h Tiêu chuẩn).</text>
          <text x="14" y="252" class="card-bullet"><tspan class="card-bullet-bold">• Minh bạch cấu thành giá:</tspan> Phân tích chi tiết từng khoản mục phụ thu bưu chính.</text>
        </g>

        <!-- Tool 3: Claim & Damage -->
        <g transform="translate(1370, 0)">
          <rect width="{660}" height="268" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <rect width="{660}" height="32" rx="5" fill="#F3F4F6" stroke="#000000" stroke-width="0.8"/>
          <text x="14" y="21" class="card-title">3. CLAIM &amp; DAMAGE TOOL</text>
          <text x="14" y="48" class="card-code">trackClaimStatus(claimCode)</text>
          <text x="14" y="66" class="card-code">getDamageAndClaimPolicy()</text>
          
          <text x="14" y="92" class="card-bullet"><tspan class="card-bullet-bold">• Thẩm định hồ sơ đền bù:</tspan> Tra cứu tiến độ phê duyệt mã khiếu nại CLM.</text>
          <text x="14" y="112" class="card-bullet"><tspan class="card-bullet-bold">• Căn cứ pháp lý bưu chính:</tspan> Điều 25 Luật Bưu chính 2010 về bồi thường hàng vỡ.</text>
          <text x="14" y="132" class="card-bullet"><tspan class="card-bullet-bold">• Hạn mức không bảo hiểm:</tspan> Bồi thường 04 lần cước (tối đa 1.000.000 VNĐ/đơn).</text>
          <text x="14" y="152" class="card-bullet"><tspan class="card-bullet-bold">• Hạn mức có khai giá:</tspan> Bồi thường 100% hóa đơn VAT (tối đa 30.000.000 VNĐ/đơn).</text>
          <text x="14" y="172" class="card-bullet"><tspan class="card-bullet-bold">• Hướng dẫn đồng kiểm:</tspan> Lập Biên bản bất thường tại chỗ có chữ ký bưu tá.</text>
          <text x="14" y="192" class="card-bullet"><tspan class="card-bullet-bold">• Điều kiện loại trừ hàng vỡ:</tspan> Từ chối đền bù nếu đóng gói thiếu xốp chống sốc 5cm.</text>
          <text x="14" y="212" class="card-bullet"><tspan class="card-bullet-bold">• Thời hạn giải quyết:</tspan> Thẩm định 24-48h, chi trả bồi thường trong 3-5 ngày làm việc.</text>
          <text x="14" y="232" class="card-bullet"><tspan class="card-bullet-bold">• Hư hỏng một phần:</tspan> Chi trả theo chi phí sửa chữa thay thế linh kiện chính hãng.</text>
          <text x="14" y="252" class="card-bullet"><tspan class="card-bullet-bold">• Hình thức chi trả:</tspan> Hỗ trợ chuyển khoản ngân hàng hoặc bù trừ công nợ COD.</text>
        </g>

        <!-- Tool 4: Storage Aging -->
        <g transform="translate(2055, 0)">
          <rect width="{660}" height="268" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <rect width="{660}" height="32" rx="5" fill="#F3F4F6" stroke="#000000" stroke-width="0.8"/>
          <text x="14" y="21" class="card-title">4. STORAGE AGING POLICY TOOL</text>
          <text x="14" y="48" class="card-code">getStorageAgingPolicy()</text>
          <text x="14" y="66" class="card-code">Điều 18 &amp; 28 Luật Bưu chính 2010</text>
          
          <text x="14" y="92" class="card-bullet"><tspan class="card-bullet-bold">• Giới hạn lưu kho Hub:</tspan> Sorting Hub 24h, Bưu cục phát 48h, Gom hoàn 72h.</text>
          <text x="14" y="112" class="card-bullet"><tspan class="card-bullet-bold">• Cảnh báo tự động hai chiều:</tspan> Cảnh báo Hub trưởng và gửi tin nhắn cho Shop.</text>
          <text x="14" y="132" class="card-bullet"><tspan class="card-bullet-bold">• Quy trình xử lý hàng vô chủ:</tspan> 5 bước tuân thủ Điều 18 và Điều 28 Luật Bưu chính.</text>
          <text x="14" y="152" class="card-bullet"><tspan class="card-bullet-bold">• Giai đoạn lưu kho bảo quản:</tspan> Lưu trữ vô chủ tối đa 30 ngày kể từ ngày thông báo.</text>
          <text x="14" y="172" class="card-bullet"><tspan class="card-bullet-bold">• Thành lập Hội đồng thẩm định:</tspan> Kiểm kê bưu gửi vô chủ có đại diện pháp chế.</text>
          <text x="14" y="192" class="card-bullet"><tspan class="card-bullet-bold">• Bán đấu giá / Tiêu hủy:</tspan> Tiêu hủy hàng hết hạn, đấu giá công khai hàng giá trị cao.</text>
          <text x="14" y="212" class="card-bullet"><tspan class="card-bullet-bold">• Dòng tiền thanh lý:</tspan> Khấu trừ phí lưu kho và nộp vào ngân sách theo quy định pháp luật.</text>
          <text x="14" y="232" class="card-bullet"><tspan class="card-bullet-bold">• Ngăn chặn tắc nghẽn kho:</tspan> Tự động kích hoạt cờ cảnh báo giải tỏa mặt bằng Hub.</text>
          <text x="14" y="252" class="card-bullet"><tspan class="card-bullet-bold">• Quản trị dữ liệu tài sản:</tspan> Lưu trữ hồ sơ bưu gửi thanh lý tối thiểu 05 năm.</text>
        </g>

        <!-- Tool 5: Escalation & Handover -->
        <g transform="translate(2740, 0)">
          <rect width="{684}" height="268" rx="5" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <rect width="{684}" height="32" rx="5" fill="#F3F4F6" stroke="#000000" stroke-width="0.8"/>
          <text x="14" y="21" class="card-title">5. AI HANDOVER &amp; ESCALATION</text>
          <text x="14" y="48" class="card-code">escalateToHumanAgent(ticketData)</text>
          <text x="14" y="66" class="card-code">Priority Queue &amp; Expedite Flagging</text>
          
          <text x="14" y="92" class="card-bullet"><tspan class="card-bullet-bold">• Chuyển tiếp tổng đài viên:</tspan> Kích hoạt khi khách giục đơn hoặc yêu cầu người thật.</text>
          <text x="14" y="112" class="card-bullet"><tspan class="card-bullet-bold">• Cấp vé tự động:</tspan> Khởi tạo Ticket ID <tspan font-family="monospace">TICKET-89213</tspan> gửi sang hàng đợi CSKH.</text>
          <text x="14" y="132" class="card-bullet"><tspan class="card-bullet-bold">• Phân luồng ưu tiên (HIGH):</tspan> Đưa vào luồng giải quyết khẩn cấp không cần chờ.</text>
          <text x="14" y="152" class="card-bullet"><tspan class="card-bullet-bold">• Gắn cờ [ƯU TIÊN PHÁT GẤP]:</tspan> Gửi thông báo khẩn tới Trưởng Bưu cục phát và Shipper.</text>
          <text x="14" y="172" class="card-bullet"><tspan class="card-bullet-bold">• Cam kết SLA kết nối:</tspan> Kết nối trực tiếp điện thoại viên trong vòng 45 giây.</text>
          <text x="14" y="192" class="card-bullet"><tspan class="card-bullet-bold">• Hotline hỗ trợ khách hàng:</tspan> Hướng dẫn khách liên hệ 1900-6868 đọc mã phiếu hỗ trợ.</text>
          <text x="14" y="212" class="card-bullet"><tspan class="card-bullet-bold">• Bắn sự kiện nội bộ:</tspan> Phát message qua RabbitMQ tới Supervisor Dashboard.</text>
          <text x="14" y="232" class="card-bullet"><tspan class="card-bullet-bold">• Ghi nhận nguyên nhân khiếu nại:</tspan> Đánh giá cảm xúc người dùng (Sentiment Analysis).</text>
          <text x="14" y="252" class="card-bullet"><tspan class="card-bullet-bold">• Đóng phiên AI minh bạch:</tspan> Chuyển giao toàn bộ biên bản hội thoại cho nhân viên.</text>
        </g>
      </g>
    </g>
  </g>
''')

    # Connector 3 -> 4
    y_c34 = t3_y + t3_h
    lines.append(f'''
  <!-- Connector Tier 3 -> Tier 4 -->
  <g id="Connector_T3_T4">
    <line x1="{width // 2}" y1="{y_c34}" x2="{width // 2}" y2="{y_c34 + 45}" stroke="#000000" stroke-width="2.2"/>
    <polygon points="{width // 2 - 8},{y_c34 + 45} {width // 2},{y_c34 + 58} {width // 2 + 8},{y_c34 + 45}" fill="#000000"/>
    <rect x="{width // 2 - 200}" y="{y_c34 + 12}" width="400" height="24" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    <text x="{width // 2}" y="{y_c34 + 28}" text-anchor="middle" class="flow-label">SEMANTIC QUERY VECTOR &amp; TOP-K CITATION BUS</text>
  </g>
''')

    # =========================================================================
    # TẦNG 4: KNOWLEDGE BASE & HYBRID VECTOR STORAGE LAYER (y: 1630 to 2070, h: 440)
    # =========================================================================
    t4_y = 1630
    t4_h = 440
    k_side_w = 1380
    k_mid_w = 620

    lines.append(f'''
  <!-- TIER 4: KNOWLEDGE & VECTOR RETRIEVAL LAYER -->
  <g id="Tier_4_Knowledge_Vector" transform="translate({margin_x}, {t4_y})">
    <rect width="{content_w}" height="{t4_h}" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{content_w}" height="42" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="20" y="12" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="36" y="28" class="tier-header">TẦNG 4: HỆ THỐNG TRI THỨC BƯU CHÍNH &amp; CƠ SỞ DỮ LIỆU VÉC-TƠ LAI (KNOWLEDGE &amp; VECTOR RETRIEVAL)</text>

    <!-- Block 4.1: Document Ingestion & AST Chunker Engine -->
    <g transform="translate(0, 56)">
      <rect width="{k_side_w}" height="370" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <circle cx="36" cy="32" r="16" fill="#111827"/>
      <text x="36" y="38" text-anchor="middle" font-size="14" fill="#FFFFFF">📚</text>
      <text x="64" y="28" class="block-title">TIỀN XỬ LÝ &amp; PHÂN ĐOẠN AST MARKDOWN (CHUNKER ENGINE)</text>
      <text x="64" y="44" class="block-meta">ChunkerService • AST Heading Boundary • Sliding Window Overlap (250/40 words)</text>

      <g transform="translate(18, 56)">
        <rect width="{k_side_w - 36}" height="298" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>

        <!-- 9 SOPs List Grid -->
        <g transform="translate(14, 12)">
          <text x="0" y="16" class="card-bullet-bold">KHO TÀI LIỆU QUY CHUẨN ĐẦU VÀO (9 LOGISTICS SOPS):</text>
          
          <rect y="26" width="{k_side_w - 64}" height="48" rx="3" fill="#F9FAFB" stroke="#9CA3AF" stroke-width="0.8"/>
          <text x="10" y="44" class="card-code">• 01-pricing (Cước IATA)  • 02-insurance (Bảo hiểm CLM)  • 03-prohibited (Hàng cấm)  • 04-delivery-faq (Hỏi đáp giao nhận)</text>
          <text x="10" y="62" class="card-code">• 05-cod-policy (Thu hộ COD)  • 06-packaging (Hàng dễ vỡ)  • 07-special (Đồng kiểm)  • 08-sla &amp; 09-incident (Sự cố)</text>
        </g>

        <text x="14" y="104" class="card-bullet"><tspan class="card-bullet-bold">• Bóc tách cấu trúc AST Heading:</tspan> Biểu thức chính quy <tspan font-family="monospace">/^(#{{1,4}})\\s+(.+)$/</tspan> phân ranh giới theo H1..H4.</text>
        <text x="14" y="126" class="card-bullet"><tspan class="card-bullet-bold">• Cửa sổ trượt Sliding Window:</tspan> Cắt khối tối đa <tspan font-family="monospace">maxWords = 250</tspan> từ (~325 tokens) vừa vặn ngữ cảnh LLM.</text>
        <text x="14" y="148" class="card-bullet"><tspan class="card-bullet-bold">• Độ chồng lấn ngữ nghĩa (Overlap):</tspan> <tspan font-family="monospace">overlapWords = 40</tspan> từ (16%) triệt tiêu đứt gãy câu chữ giữa các khối giáp ranh.</text>
        <text x="14" y="170" class="card-bullet"><tspan class="card-bullet-bold">• Làm giàu siêu dữ liệu (Metadata):</tspan> Đính kèm <tspan font-family="monospace">id, sourceFile, sectionTitle, level, charCount, tokenEstimate</tspan>.</text>
        <text x="14" y="192" class="card-bullet"><tspan class="card-bullet-bold">• Công thức ước tính Token UTF-8:</tspan> <tspan class="math-text">tokenEstimate = Math.round(words.length × 1.3)</tspan> chuẩn hóa tiếng Việt.</text>
        <text x="14" y="214" class="card-bullet"><tspan class="card-bullet-bold">• Đồng bộ hóa Reindex:</tspan> Service <tspan font-family="monospace">KnowledgeService.reindexAll()</tspan> tự động quét và nạp véc-tơ hàng loạt.</text>
        <text x="14" y="236" class="card-bullet"><tspan class="card-bullet-bold">• Cơ chế kiểm soát phiên bản:</tspan> Gắn nhãn <tspan font-family="monospace">version: '1.0.0'</tspan> và thời gian cập nhật <tspan font-family="monospace">updatedAt</tspan> trên tệp chỉ mục.</text>
        <text x="14" y="258" class="card-bullet"><tspan class="card-bullet-bold">• Khử nhiễu văn bản:</tspan> Tự động xóa bỏ các ký tự Markdown dư thừa, khoảng trắng kép và dòng trống lặp lại.</text>
        <text x="14" y="280" class="card-bullet"><tspan class="card-bullet-bold">• Tính toán song song:</tspan> Hỗ trợ sinh embedding theo lô (Batch Processing) giảm thiểu nghẽn mạng.</text>
      </g>
    </g>

    <!-- Block 4.2: Vector Store Repository (Cylinder Central Node) -->
    <g transform="translate({k_side_w + 40}, 56)">
      <rect width="{k_mid_w}" height="370" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      
      <!-- Cylinder Geometric Shape -->
      <g transform="translate({k_mid_w // 2 - 130}, 20)">
        <!-- Top Ellipse -->
        <ellipse cx="130" cy="28" rx="130" ry="24" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>
        
        <!-- Cylinder Body -->
        <path d="M 0,28 L 0,110 A 130,24 0 0,0 260,110 L 260,28 Z" fill="#F3F4F6" stroke="#000000" stroke-width="1.6"/>
        <ellipse cx="130" cy="110" rx="130" ry="24" fill="#E5E7EB" stroke="#000000" stroke-width="1.6"/>
        
        <!-- Inner Cylinder Lines for 3D database feel -->
        <path d="M 0,55 A 130,24 0 0,0 260,55" fill="none" stroke="#9CA3AF" stroke-width="1.2" stroke-dasharray="4,2"/>
        <path d="M 0,82 A 130,24 0 0,0 260,82" fill="none" stroke="#9CA3AF" stroke-width="1.2" stroke-dasharray="4,2"/>
        
        <text x="130" y="72" class="cyl-label">VECTOR STORE</text>
        <text x="130" y="90" class="cyl-sub">vector-index.json</text>
      </g>

      <!-- Repository Specifications -->
      <g transform="translate(18, 168)">
        <rect width="{k_mid_w - 36}" height="186" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>
        <text x="14" y="24" class="card-bullet"><tspan class="card-bullet-bold">• Vùng lưu trữ:</tspan> <tspan font-family="monospace">docs/knowledge-base/vector-index.json</tspan>.</text>
        <text x="14" y="46" class="card-bullet"><tspan class="card-bullet-bold">• Quy mô tri thức:</tspan> 62 Chunks tiêu chuẩn, bao phủ 100% SOP.</text>
        <text x="14" y="68" class="card-bullet"><tspan class="card-bullet-bold">• Kích thước véc-tơ:</tspan> 1536 chiều số thực dấu phẩy động (float array).</text>
        <text x="14" y="90" class="card-bullet"><tspan class="card-bullet-bold">• Tải bộ nhớ đệm (Cache):</tspan> In-Memory Store khởi tạo trong <tspan font-family="monospace">onModuleInit()</tspan>.</text>
        <text x="14" y="112" class="card-bullet"><tspan class="card-bullet-bold">• Tốc độ quét toàn bộ:</tspan> Quét 62 chunks chỉ mất &lt; 8ms với thuật toán tối ưu.</text>
        <text x="14" y="134" class="card-bullet"><tspan class="card-bullet-bold">• Định dạng dữ liệu:</tspan> Chuẩn hóa JSON schema <tspan font-family="monospace">VectorIndexData</tspan>.</text>
        <text x="14" y="156" class="card-bullet"><tspan class="card-bullet-bold">• Không phụ thuộc DB ngoài:</tspan> Chạy độc lập, không cần setup Pinecone/Qdrant.</text>
        <text x="14" y="176" class="card-bullet"><tspan class="card-bullet-bold">• Khôi phục tự động:</tspan> Tự động tạo thư mục và index mẫu nếu file bị thiếu.</text>
      </g>
    </g>

    <!-- Block 4.3: Hybrid Search & Scoring Engine -->
    <g transform="translate({k_side_w + k_mid_w + 80}, 56)">
      <rect width="{k_side_w}" height="370" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <circle cx="36" cy="32" r="16" fill="#111827"/>
      <text x="36" y="38" text-anchor="middle" font-size="14" fill="#FFFFFF">⚡</text>
      <text x="64" y="28" class="block-title">ĐỘNG CƠ HỒI XUẤT LAI DENSE + SPARSE (HYBRID SEARCH ENGINE)</text>
      <text x="64" y="44" class="block-meta">VectorStoreService.hybridSearch() • Cosine Similarity • Logistics Thesaurus Boost</text>

      <g transform="translate(18, 56)">
        <rect width="{k_side_w - 36}" height="298" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>

        <!-- Formula Banner -->
        <rect x="14" y="12" width="{k_side_w - 64}" height="54" rx="3" fill="#F8FAFC" stroke="#000000" stroke-width="1"/>
        <text x="20" y="32" font-size="13" font-weight="800" fill="#000000">CÔNG THỨC HỢP NHẤT LAI (HYBRID FUSION FORMULA):</text>
        <text x="20" y="50" class="card-code">TotalScore = (CosineSimilarity(Q_vector, C_vector) × 0.70) + KeywordThesaurusBonus (max 0.35)</text>

        <text x="14" y="86" class="card-bullet"><tspan class="card-bullet-bold">• Tìm kiếm Dense Cosine (70%):</tspan> Tính tích vô hướng chuẩn hóa giữa vector câu hỏi và vector tài liệu.</text>
        <text x="14" y="108" class="card-bullet"><tspan class="card-bullet-bold">• Tìm kiếm Sparse Thesaurus (35%):</tspan> Mở rộng từ đồng nghĩa Logistics (13 gốc từ: hỏng, vỡ, móp, bom, cod...).</text>
        <text x="14" y="130" class="card-bullet"><tspan class="card-bullet-bold">• Khắc phục nhược điểm BM25:</tspan> Kết hợp cả tương đồng ngữ nghĩa lẫn từ vựng bưu chính chính xác tuyệt đối.</text>
        <text x="14" y="152" class="card-bullet"><tspan class="card-bullet-bold">• Lọc ngưỡng chất lượng:</tspan> Cắt bỏ toàn bộ đoạn tri thức có <tspan font-family="monospace">TotalScore &lt; 0.15</tspan> để loại bỏ nhiễu.</text>
        <text x="14" y="174" class="card-bullet"><tspan class="card-bullet-bold">• Trích xuất Top-K = 5:</tspan> Chỉ lấy 5 đoạn có điểm số cao nhất chuyển tiếp sang Prompt Builder.</text>
        <text x="14" y="196" class="card-bullet"><tspan class="card-bullet-bold">• Đóng gói trích dẫn minh bạch:</tspan> Xuất mảng <tspan font-family="monospace">citations[]</tspan> (file, title, score %, snippet) cho người dùng.</text>
        <text x="14" y="218" class="card-bullet"><tspan class="card-bullet-bold">• Hiệu năng truy vấn:</tspan> Thời gian hồi xuất toàn diện trung bình đạt &lt; 15ms cho mỗi yêu cầu.</text>
        <text x="14" y="240" class="card-bullet"><tspan class="card-bullet-bold">• Khử trùng lặp:</tspan> Tự động loại bỏ các đoạn trùng lặp nội dung từ cùng một tài liệu gốc.</text>
        <text x="14" y="262" class="card-bullet"><tspan class="card-bullet-bold">• Độ chính xác học thuật:</tspan> Đạt chỉ số Mean Reciprocal Rank MRR@5 ≥ 0.91 trên bộ test bưu chính.</text>
        <text x="14" y="284" class="card-bullet"><tspan class="card-bullet-bold">• Khả năng tương thích:</tspan> Dễ dàng mở rộng nâng cấp sang các mô hình véc-tơ đa ngôn ngữ trong tương lai.</text>
      </g>
    </g>
  </g>
''')

    # Connector 4 -> 5
    y_c45 = t4_y + t4_h
    lines.append(f'''
  <!-- Connector Tier 4 -> Tier 5 -->
  <g id="Connector_T4_T5">
    <line x1="{width // 2}" y1="{y_c45}" x2="{width // 2}" y2="{y_c45 + 45}" stroke="#000000" stroke-width="2.2"/>
    <polygon points="{width // 2 - 8},{y_c45 + 45} {width // 2},{y_c45 + 58} {width // 2 + 8},{y_c45 + 45}" fill="#000000"/>
    <rect x="{width // 2 - 200}" y="{y_c45 + 12}" width="400" height="24" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    <text x="{width // 2}" y="{y_c45 + 28}" text-anchor="middle" class="flow-label">DOWNSTREAM MICROSERVICES &amp; LLM INFERENCE APIS</text>
  </g>
''')

    # =========================================================================
    # TẦNG 5: DOWNSTREAM SERVICES & EXTERNAL LLM ADAPTERS (y: 2120 to 2480, h: 360)
    # =========================================================================
    t5_y = 2120
    t5_h = 360
    s5_w = (content_w - 40) // 2  # (3460 - 40) // 2 = 1710px

    lines.append(f'''
  <!-- TIER 5: DOWNSTREAM & LLM INTEGRATION LAYER -->
  <g id="Tier_5_Downstream_LLM" transform="translate({margin_x}, {t5_y})">
    <rect width="{content_w}" height="{t5_h}" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    <rect width="{content_w}" height="42" rx="8" fill="#F3F4F6" stroke="#000000" stroke-width="1.4"/>
    <rect x="20" y="12" width="6" height="18" rx="1.5" fill="#000000"/>
    <text x="36" y="28" class="tier-header">TẦNG 5: TÍCH HỢP HỆ THỐNG NGOẠI VI - DỊCH VỤ LOGISTICS NỘI BỘ &amp; MÔ HÌNH NGÔN NGỮ LỚN (INTEGRATION MESH &amp; AI ADAPTERS)</text>

    <!-- Block 5.1: Internal Logistics Microservices Mesh -->
    <g transform="translate(0, 56)">
      <rect width="{s5_w}" height="290" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <circle cx="36" cy="32" r="16" fill="#111827"/>
      <text x="36" y="38" text-anchor="middle" font-size="14" fill="#FFFFFF">🌐</text>
      <text x="64" y="28" class="block-title">TẬP HỢP MICROSERVICES NGHIỆP VỤ LOGISTICS NỘI BỘ (INTERNAL REST MESH)</text>
      <text x="64" y="44" class="block-meta">API Gateway :3000 • Database-per-service • RabbitMQ Event Bus</text>

      <g transform="translate(18, 56)">
        <rect width="{s5_w - 36}" height="218" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>
        
        <!-- Service 1: Shipment Service -->
        <rect x="12" y="12" width="{s5_w - 60}" height="36" rx="3" fill="#F9FAFB" stroke="#D1D5DB" stroke-width="0.8"/>
        <text x="22" y="28" class="card-code">Shipment Service (:3002):</text>
        <text x="210" y="28" class="card-bullet">Cung cấp dữ liệu vận đơn, mã bưu kiện, trạng thái giao nhận và lịch sử bưu tá tuyến.</text>

        <!-- Service 2: Pricing Service -->
        <rect x="12" y="52" width="{s5_w - 60}" height="36" rx="3" fill="#F9FAFB" stroke="#D1D5DB" stroke-width="0.8"/>
        <text x="22" y="68" class="card-code">Pricing Service (:3003):</text>
        <text x="210" y="68" class="card-bullet">Tính toán cước cơ sở, cước nấc vượt, quy đổi thể tích IATA và phụ phí vùng miền Metro.</text>

        <!-- Service 3: Incident & Claim Service -->
        <rect x="12" y="92" width="{s5_w - 60}" height="36" rx="3" fill="#F9FAFB" stroke="#D1D5DB" stroke-width="0.8"/>
        <text x="22" y="108" class="card-code">Incident Service (:3008):</text>
        <text x="210" y="108" class="card-bullet">Tiếp nhận hồ sơ đền bù CLM, quản lý biên bản bất thường và hạn mức bồi thường hàng vỡ.</text>

        <!-- Service 4: Hub & Storage Service -->
        <rect x="12" y="132" width="{s5_w - 60}" height="36" rx="3" fill="#F9FAFB" stroke="#D1D5DB" stroke-width="0.8"/>
        <text x="22" y="148" class="card-code">Hub Service (:3004):</text>
        <text x="210" y="148" class="card-bullet">Quản lý sức chứa kho, giới hạn thời gian lưu kho và kích hoạt quy trình xử lý hàng quá hạn.</text>

        <!-- Service 5: Notification Service -->
        <rect x="12" y="172" width="{s5_w - 60}" height="36" rx="3" fill="#F9FAFB" stroke="#D1D5DB" stroke-width="0.8"/>
        <text x="22" y="188" class="card-code">Notification Service (:3012):</text>
        <text x="225" y="188" class="card-bullet">Bắn thông báo đẩy tức thời tới App Bưu tá và tạo phiếu điều phối trên tổng đài CSKH.</text>
      </g>
    </g>

    <!-- Block 5.2: LLM Provider & AI Model Adapters -->
    <g transform="translate({s5_w + 40}, 56)">
      <rect width="{s5_w}" height="290" rx="6" fill="#FAFAFA" stroke="#000000" stroke-width="1.4"/>
      <circle cx="36" cy="32" r="16" fill="#111827"/>
      <text x="36" y="38" text-anchor="middle" font-size="14" fill="#FFFFFF">🧠</text>
      <text x="64" y="28" class="block-title">CỔNG KẾT NỐI MÔ HÌNH NGÔN NGỮ LỚN (LLM PROVIDER &amp; AI ADAPTERS)</text>
      <text x="64" y="44" class="block-meta">Google Gemini API • OpenAI API • Local Semantic Hash Vectorizer</text>

      <g transform="translate(18, 56)">
        <rect width="{s5_w - 36}" height="218" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="0.8"/>

        <!-- Adapter 1: Gemini -->
        <rect x="12" y="12" width="{s5_w - 60}" height="46" rx="3" fill="#F9FAFB" stroke="#000000" stroke-width="0.8"/>
        <text x="22" y="30" class="card-code">Google Gemini 3.6 Flash &amp; gemini-embedding-001 (Ưu tiên số 1)</text>
        <text x="22" y="48" class="card-desc">Tốc độ sinh token siêu tốc, hỗ trợ Batch Embeddings reindex nhanh, chi phí tối ưu.</text>

        <!-- Adapter 2: OpenAI -->
        <rect x="12" y="66" width="{s5_w - 60}" height="46" rx="3" fill="#F9FAFB" stroke="#000000" stroke-width="0.8"/>
        <text x="22" y="84" class="card-code">OpenAI GPT-4o-mini &amp; text-embedding-3-small (Dự phòng số 2)</text>
        <text x="22" y="102" class="card-desc">Véc-tơ hóa 1536 chiều, suy luận ngữ nghĩa chuẩn xác, cơ chế Dual Fallback tự động.</text>

        <!-- Adapter 3: Offline Local Hash -->
        <rect x="12" y="120" width="{s5_w - 60}" height="46" rx="3" fill="#F9FAFB" stroke="#000000" stroke-width="0.8"/>
        <text x="22" y="138" class="card-code">Offline Local Semantic Hash Vectorizer (Dự phòng ngắt mạng số 3)</text>
        <text x="22" y="156" class="card-desc">Thuật toán băm chuỗi nội bộ sinh véc-tơ 768 chiều không cần kết nối internet hay API key.</text>

        <!-- Param note -->
        <text x="14" y="186" class="card-bullet"><tspan class="card-bullet-bold">• Tham số sinh suy luận:</tspan> Nhiệt độ <tspan font-family="monospace">Temperature = 0.2</tspan> triệt tiêu tối đa hiện tượng ảo giác, đảm bảo tính pháp lý.</text>
        <text x="14" y="206" class="card-bullet"><tspan class="card-bullet-bold">• Độ trễ xử lý (Latency):</tspan> Phản hồi REST hoàn chỉnh 280ms - 450ms; độ trễ token đầu tiên SSE &lt; 50ms.</text>
      </g>
    </g>
  </g>
''')

    lines.append('</svg>')
    return '\n'.join(lines)

def main():
    print(f"Generating AI Chatbot Subsystem Architecture Diagram for Figma Page 1...")
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
