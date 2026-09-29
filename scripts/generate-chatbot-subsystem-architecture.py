#!/usr/bin/env python3
"""
generate-chatbot-subsystem-architecture.py
Generates the formal UML 2.5 Component & Software Architecture Diagram for the AI Chatbot Subsystem
for Figma Page 1 (Section 1.4A) in the Nexus Logistics Management System graduation thesis.

Outputs to:
  docs/graduation-thesis/figma-page-1-system-and-data/diagrams/04-architecture-ai-chatbot-subsystem.svg

Style:
  Monochrome Technical Blueprint (Black, White, Neutral Slate Gray)
  Rigorous Software Engineering Standard: UML 2.5 Component Specification / C4 Component Model
  100% Free of AI buzzwords, conversational fluff, and emojis.
  Features standard UML 2 Component glyphs [=], structured compartments (Stereotypes, Interfaces, Methods, Dependencies),
  orthogonal communication buses, and an ISO 7200 compliant Technical Title Block.
  Strict Figma Compatibility: 100% inline vector geometries (<polygon>, <rect>, <ellipse>, <path>), ZERO SVG <marker> tags.
"""

import xml.etree.ElementTree as ET
import os

OUTPUT_FILE = "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/04-architecture-ai-chatbot-subsystem.svg"

def uml_comp_glyph(x, y):
    """Generates the official UML 2 Component Icon: [=]"""
    return f'''
    <g transform="translate({x}, {y})">
      <rect x="0" y="0" width="20" height="14" rx="1" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      <rect x="-4" y="2.5" width="6" height="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
      <rect x="-4" y="8.5" width="6" height="3" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    </g>'''

def build_architecture_svg():
    width = 3600
    height = 2650
    lines = []

    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # Double Technical Blueprint Frame
    lines.append(f'''
  <!-- Double Technical Blueprint Frame -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <rect x="20" y="20" width="{width - 40}" height="{height - 40}" fill="none" stroke="#000000" stroke-width="2.6"/>
  <rect x="32" y="32" width="{width - 64}" height="{height - 64}" fill="none" stroke="#000000" stroke-width="1.2"/>

  <style>
    text {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }}
    
    .hdr-title {{ font-size: 26px; font-weight: 800; fill: #000000; letter-spacing: -0.4px; }}
    .hdr-sub {{ font-size: 14.5px; font-weight: 500; fill: #334155; }}
    .meta-code {{ font-size: 12px; font-weight: 600; fill: #0F172A; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; }}
    
    .tier-title {{ font-size: 15px; font-weight: 800; fill: #000000; letter-spacing: 0.8px; text-transform: uppercase; }}
    .tier-sub {{ font-size: 12px; font-weight: 600; fill: #475569; font-family: ui-monospace, monospace; }}
    
    .comp-stereotype {{ font-size: 11px; font-weight: 700; fill: #475569; font-family: ui-monospace, monospace; text-transform: lowercase; }}
    .comp-name {{ font-size: 14px; font-weight: 800; fill: #000000; letter-spacing: -0.2px; }}
    .comp-tech {{ font-size: 11.5px; font-weight: 600; fill: #334155; font-family: ui-monospace, monospace; }}
    
    .section-label {{ font-size: 11px; font-weight: 700; fill: #64748B; font-family: ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.5px; }}
    .code-line {{ font-size: 11.5px; font-weight: 500; fill: #0F172A; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; }}
    .code-bold {{ font-size: 11.5px; font-weight: 700; fill: #000000; font-family: ui-monospace, monospace; }}
    .desc-line {{ font-size: 11.5px; font-weight: 500; fill: #334155; }}
    
    .bus-text {{ font-size: 11.5px; font-weight: 700; fill: #000000; font-family: ui-monospace, monospace; text-transform: uppercase; }}
    .port-label {{ font-size: 10.5px; font-weight: 700; fill: #475569; font-family: ui-monospace, monospace; }}

    .tb-label {{ font-size: 10px; font-weight: 700; fill: #64748B; font-family: ui-monospace, monospace; text-transform: uppercase; }}
    .tb-val {{ font-size: 12px; font-weight: 800; fill: #000000; font-family: ui-monospace, monospace; }}
  </style>
''')

    margin_x = 70
    content_w = width - margin_x * 2  # 3460px

    # =========================================================================
    # HEADER BAR (y: 45, h: 90)
    # =========================================================================
    lines.append(f'''
  <!-- FORMAL SPECIFICATION HEADER -->
  <g id="HeaderBar" transform="translate({margin_x}, 45)">
    <rect width="{content_w}" height="90" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    
    <text x="24" y="38" class="hdr-title">HÌNH 1.4A: SƠ ĐỒ KIẾN TRÚC THÀNH PHẦN PHÂN HỆ AI CHATBOT (UML 2.5 COMPONENT TOPOLOGY)</text>
    <text x="24" y="66" class="hdr-sub">Mô hình kiến trúc phân tầng (Layered Architecture): Đặc tả cấu trúc khối phần mềm, cổng giao tiếp (Ports/Interfaces), phân định trách nhiệm module và liên kết ngoại vi</text>
    
    <!-- Technical Metadata Panel -->
    <g transform="translate({content_w - 740}, 16)">
      <rect width="720" height="58" rx="3" fill="#F8FAFC" stroke="#000000" stroke-width="1"/>
      <line x1="240" y1="0" x2="240" y2="58" stroke="#000000" stroke-width="1"/>
      <line x1="480" y1="0" x2="480" y2="58" stroke="#000000" stroke-width="1"/>
      
      <text x="14" y="22" class="section-label">SYSTEM CONTEXT</text>
      <text x="14" y="42" class="meta-code">Nexus LMS • chatbot-service</text>
      
      <text x="254" y="22" class="section-label">STANDARD SPECIFICATION</text>
      <text x="254" y="42" class="meta-code">ISO/IEC 42010 • UML 2.5</text>
      
      <text x="494" y="22" class="section-label">RUNTIME ENVIRONMENT</text>
      <text x="494" y="42" class="meta-code">Node.js 20 LTS • TCP 3009</text>
    </g>
  </g>
''')

    # =========================================================================
    # LAYER 1: CLIENT BOUNDARY LAYER (y: 155, h: 290)
    # =========================================================================
    l1_y = 155
    l1_h = 290
    c_w = 820
    c_gap = (content_w - c_w * 4) // 3  # 60px

    lines.append(f'''
  <!-- LAYER 1: CLIENT BOUNDARY & INTERACTION CHANNELS -->
  <g id="Layer_1_Client_Boundary" transform="translate({margin_x}, {l1_y})">
    <rect width="{content_w}" height="{l1_h}" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.6"/>
    <rect width="{content_w}" height="36" rx="6" fill="#000000"/>
    <text x="20" y="24" fill="#FFFFFF" class="tier-title">LAYER 1: CLIENT BOUNDARY &amp; INTERACTION INTERFACES («boundary»)</text>
    <text x="{content_w - 20}" y="24" text-anchor="end" fill="#E2E8F0" class="tier-sub">HTTP/1.1 REST • Server-Sent Events (SSE) • JSON Protocol</text>

    <!-- Component 1.1: Merchant Web Dashboard -->
    <g transform="translate(0, 48)">
      <rect width="{c_w}" height="230" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <!-- Component Header -->
      <path d="M 0,0 L {c_w},0 L {c_w},34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="{c_w}" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«boundary :: web-client»</text>
      <text x="16" y="30" class="comp-name">MerchantDashboardChat</text>
      <text x="250" y="30" class="comp-tech">[apps/merchant-frontend • React 18 / Tailwind]</text>
      {uml_comp_glyph(c_w - 28, 10)}

      <!-- Compartment: Consumed Endpoints -->
      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">CONSUMED PORTS &amp; PROTOCOLS:</text>
        <text x="0" y="18" class="code-line">• POST /api/v1/chat/message [HTTPS / JSON DTO]</text>
        <text x="0" y="34" class="code-line">• Headers: Authorization: Bearer &lt;JWT&gt;, X-Shop-Id: &lt;UUID&gt;</text>
        
        <line x1="0" y1="46" x2="{c_w - 28}" y2="46" stroke="#E2E8F0" stroke-width="1"/>
        
        <text x="0" y="62" class="section-label">UI COMPONENTS &amp; PRESENTATION CONTROLLERS:</text>
        <text x="0" y="80" class="desc-line">• <tspan class="code-bold">ChatDrawerContainer:</tspan> Ngăn kéo hội thoại trượt tích hợp góc phải màn hình.</text>
        <text x="0" y="98" class="desc-line">• <tspan class="code-bold">ShipmentCardRenderer:</tspan> Parse JSON payload render thẻ vận đơn tương tác.</text>
        <text x="0" y="116" class="desc-line">• <tspan class="code-bold">ActionQuickReplyToolbar:</tspan> Thanh phím tắt tạo lệnh tra cước, bồi thường, đối soát.</text>
        <text x="0" y="134" class="desc-line">• <tspan class="code-bold">IdentityContextBinding:</tspan> Tự động inject userId và role='MERCHANT' vào payload.</text>
      </g>
    </g>

    <!-- Component 1.2: Customer Tracking Portal -->
    <g transform="translate({c_w + c_gap}, 48)">
      <rect width="{c_w}" height="230" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L {c_w},0 L {c_w},34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="{c_w}" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«boundary :: public-client»</text>
      <text x="16" y="30" class="comp-name">CustomerPortalChatWidget</text>
      <text x="260" y="30" class="comp-tech">[apps/tracking-portal • SSE Stream Consumer]</text>
      {uml_comp_glyph(c_w - 28, 10)}

      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">CONSUMED PORTS &amp; PROTOCOLS:</text>
        <text x="0" y="18" class="code-line">• POST /api/v1/chat/stream [Server-Sent Events / SSE]</text>
        <text x="0" y="34" class="code-line">• Headers: Accept: text/event-stream, X-Client-Role: GUEST</text>
        
        <line x1="0" y1="46" x2="{c_w - 28}" y2="46" stroke="#E2E8F0" stroke-width="1"/>
        
        <text x="0" y="62" class="section-label">UI COMPONENTS &amp; PRESENTATION CONTROLLERS:</text>
        <text x="0" y="80" class="desc-line">• <tspan class="code-bold">PublicTrackingChatWidget:</tspan> Cửa sổ chat tra cứu công khai không cần login.</text>
        <text x="0" y="98" class="desc-line">• <tspan class="code-bold">TypewriterStreamBuffer:</tspan> Nhận stream token chunk render hiệu ứng gõ phím.</text>
        <text x="0" y="116" class="desc-line">• <tspan class="code-bold">CitationDocInspector:</tspan> Drawer xem nhanh trích dẫn văn bản SOP pháp lý.</text>
        <text x="0" y="134" class="desc-line">• <tspan class="code-bold">PIIMaskingObserver:</tspan> Hiển thị nhãn thông báo dữ liệu cá nhân đã được che mặt nạ.</text>
      </g>
    </g>

    <!-- Component 1.3: Mobile Driver App -->
    <g transform="translate({(c_w + c_gap) * 2}, 48)">
      <rect width="{c_w}" height="230" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L {c_w},0 L {c_w},34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="{c_w}" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«boundary :: mobile-app»</text>
      <text x="16" y="30" class="comp-name">DriverCourierAssistant</text>
      <text x="240" y="30" class="comp-tech">[apps/driver-mobile • React Native / iOS-Android]</text>
      {uml_comp_glyph(c_w - 28, 10)}

      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">CONSUMED PORTS &amp; PROTOCOLS:</text>
        <text x="0" y="18" class="code-line">• POST /api/v1/chat/message [HTTPS / Mobile REST Client]</text>
        <text x="0" y="34" class="code-line">• Headers: Authorization: Bearer &lt;JWT&gt;, role='DRIVER'</text>
        
        <line x1="0" y1="46" x2="{c_w - 28}" y2="46" stroke="#E2E8F0" stroke-width="1"/>
        
        <text x="0" y="62" class="section-label">UI COMPONENTS &amp; PRESENTATION CONTROLLERS:</text>
        <text x="0" y="80" class="desc-line">• <tspan class="code-bold">DeliverySOPQueryView:</tspan> Tra cứu quy trình phát bưu kiện, đồng kiểm, hẹn lại.</text>
        <text x="0" y="98" class="desc-line">• <tspan class="code-bold">IncidentFilingHelper:</tspan> Hướng dẫn lập biên bản bất thường và chụp ảnh 4 góc.</text>
        <text x="0" y="116" class="desc-line">• <tspan class="code-bold">CODLimitWarningView:</tspan> Cảnh báo hạn mức nợ thu hộ tồn đọng tại túi bưu tá.</text>
        <text x="0" y="134" class="desc-line">• <tspan class="code-bold">PushPriorityConsumer:</tspan> Tiếp nhận chỉ lệnh giục phát tức thời từ tổng đài.</text>
      </g>
    </g>

    <!-- Component 1.4: Operations & Admin Console -->
    <g transform="translate({(c_w + c_gap) * 3}, 48)">
      <rect width="{c_w}" height="230" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L {c_w},0 L {c_w},34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="{c_w}" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«boundary :: admin-client»</text>
      <text x="16" y="30" class="comp-name">OperationsAdminConsole</text>
      <text x="245" y="30" class="comp-tech">[apps/admin-frontend • Next.js Internal Portal]</text>
      {uml_comp_glyph(c_w - 28, 10)}

      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">CONSUMED PORTS &amp; PROTOCOLS:</text>
        <text x="0" y="18" class="code-line">• POST /api/v1/chat/ingest [Admin Ingestion Trigger]</text>
        <text x="0" y="34" class="code-line">• GET /api/v1/chat/metrics [Latency, Citations, Hit-Rate]</text>
        
        <line x1="0" y1="46" x2="{c_w - 28}" y2="46" stroke="#E2E8F0" stroke-width="1"/>
        
        <text x="0" y="62" class="section-label">UI COMPONENTS &amp; PRESENTATION CONTROLLERS:</text>
        <text x="0" y="80" class="desc-line">• <tspan class="code-bold">SupervisorEscalationBoard:</tspan> Hàng đợi tiếp nhận phiên Handover từ AI.</text>
        <text x="0" y="98" class="desc-line">• <tspan class="code-bold">KnowledgeSyncManager:</tspan> Kích hoạt reindex hàng loạt khi có văn bản SOP mới.</text>
        <text x="0" y="116" class="desc-line">• <tspan class="code-bold">StorageAgingMonitor:</tspan> Quản lý kiện hàng quá hạn Điều 18 &amp; 28 Luật Bưu chính.</text>
        <text x="0" y="134" class="desc-line">• <tspan class="code-bold">SecurityAuditViewer:</tspan> Giám sát nhật ký truy vấn và cảnh báo dò quét PII.</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # COMMUNICATION BUS 1 -> 2
    # =========================================================================
    b12_y = l1_y + l1_h
    lines.append(f'''
  <!-- PROTOCOL BUS: LAYER 1 TO LAYER 2 -->
  <g id="Bus_L1_L2">
    <!-- Orthogonal Bus Bar -->
    <line x1="200" y1="{b12_y + 25}" x2="{width - 200}" y2="{b12_y + 25}" stroke="#000000" stroke-width="2"/>
    
    <!-- Connectors from Clients down to Bus -->
    <line x1="{margin_x + c_w // 2}" y1="{b12_y}" x2="{margin_x + c_w // 2}" y2="{b12_y + 25}" stroke="#000000" stroke-width="1.6"/>
    <line x1="{margin_x + c_w + c_gap + c_w // 2}" y1="{b12_y}" x2="{margin_x + c_w + c_gap + c_w // 2}" y2="{b12_y + 25}" stroke="#000000" stroke-width="1.6"/>
    <line x1="{margin_x + (c_w + c_gap) * 2 + c_w // 2}" y1="{b12_y}" x2="{margin_x + (c_w + c_gap) * 2 + c_w // 2}" y2="{b12_y + 25}" stroke="#000000" stroke-width="1.6"/>
    <line x1="{margin_x + (c_w + c_gap) * 3 + c_w // 2}" y1="{b12_y}" x2="{margin_x + (c_w + c_gap) * 3 + c_w // 2}" y2="{b12_y + 25}" stroke="#000000" stroke-width="1.6"/>
    
    <!-- Drops from Bus to Layer 2 Controllers -->
    <line x1="{margin_x + 570}" y1="{b12_y + 25}" x2="{margin_x + 570}" y2="{b12_y + 50}" stroke="#000000" stroke-width="2"/>
    <polygon points="{margin_x + 564},{b12_y + 44} {margin_x + 570},{b12_y + 52} {margin_x + 576},{b12_y + 44}" fill="#000000"/>
    
    <line x1="{margin_x + 1730}" y1="{b12_y + 25}" x2="{margin_x + 1730}" y2="{b12_y + 50}" stroke="#000000" stroke-width="2"/>
    <polygon points="{margin_x + 1724},{b12_y + 44} {margin_x + 1730},{b12_y + 52} {margin_x + 1736},{b12_y + 44}" fill="#000000"/>

    <line x1="{margin_x + 2890}" y1="{b12_y + 25}" x2="{margin_x + 2890}" y2="{b12_y + 50}" stroke="#000000" stroke-width="2"/>
    <polygon points="{margin_x + 2884},{b12_y + 44} {margin_x + 2890},{b12_y + 52} {margin_x + 2896},{b12_y + 44}" fill="#000000"/>

    <!-- Central Bus Protocol Tag -->
    <rect x="{width // 2 - 220}" y="{b12_y + 13}" width="440" height="24" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
    <text x="{width // 2}" y="{b12_y + 29}" text-anchor="middle" class="bus-text">HTTP/1.1 REST • TEXT/EVENT-STREAM (SSE) • TCP PORT :3009</text>
  </g>
''')

    # =========================================================================
    # LAYER 2: CONTROLLER, ADMISSION & SECURITY LAYER (y: 500, h: 360)
    # =========================================================================
    l2_y = 500
    l2_h = 360
    b2_w = (content_w - 40) // 3  # 1140px

    lines.append(f'''
  <!-- LAYER 2: API GATEWAY, ADMISSION CONTROL & SECURITY BOUNDARY -->
  <g id="Layer_2_Controller_Security" transform="translate({margin_x}, {l2_y})">
    <rect width="{content_w}" height="{l2_h}" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.6"/>
    <rect width="{content_w}" height="36" rx="6" fill="#000000"/>
    <text x="20" y="24" fill="#FFFFFF" class="tier-title">LAYER 2: API ADMISSION CONTROL, SECURITY &amp; SESSION BOUNDARY («controller» / «guard»)</text>
    <text x="{content_w - 20}" y="24" text-anchor="end" fill="#E2E8F0" class="tier-sub">Input Validation • Legal PII Sanitization • Conversation Window Manager</text>

    <!-- Component 2.1: ChatController -->
    <g transform="translate(0, 48)">
      <rect width="{b2_w}" height="300" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L {b2_w},0 L {b2_w},34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="{b2_w}" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«controller :: nestjs»</text>
      <text x="16" y="30" class="comp-name">ChatController</text>
      <text x="140" y="30" class="comp-tech">[services/chatbot-service/src/chat/chat.controller.ts]</text>
      {uml_comp_glyph(b2_w - 28, 10)}

      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">EXPOSED REST &amp; SSE ENDPOINTS:</text>
        <rect x="0" y="8" width="{b2_w - 28}" height="44" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="24" class="code-bold">POST /api/v1/chat/message</text>
        <text x="10" y="40" class="desc-line">Accepts: ChatRequestDto ➔ Returns: Promise&lt;ChatResponseDto&gt; (Sync JSON)</text>

        <rect x="0" y="58" width="{b2_w - 28}" height="44" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="74" class="code-bold">POST /api/v1/chat/stream</text>
        <text x="10" y="90" class="desc-line">Headers: text/event-stream ➔ Pipe: AsyncGenerator&lt;{{event, data}}&gt; (SSE)</text>

        <rect x="0" y="108" width="{b2_w - 28}" height="44" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="124" class="code-bold">POST /api/v1/chat/ingest</text>
        <text x="10" y="140" class="desc-line">Admin Trigger: KnowledgeService.reindexAll() ➔ Returns: IngestSummaryDto</text>

        <line x1="0" y1="160" x2="{b2_w - 28}" y2="160" stroke="#E2E8F0" stroke-width="1"/>
        <text x="0" y="176" class="section-label">ADMISSION &amp; VALIDATION PIPES:</text>
        <text x="0" y="194" class="desc-line">• <tspan class="code-bold">EmptyPayloadFilter:</tspan> dto.message.trim().length === 0 ➔ HTTP 400 Bad Request.</text>
        <text x="0" y="212" class="desc-line">• <tspan class="code-bold">RateLimitGuard:</tspan> Giới hạn 60 req/phút/IP chống DoS và cạn kiệt LLM quota.</text>
        <text x="0" y="230" class="desc-line">• <tspan class="code-bold">LifecycleEventFlusher:</tspan> res.write('event: error') &amp; res.end() khi có ngắt kết nối.</text>
      </g>
    </g>

    <!-- Component 2.2: PIISanitizerGuard -->
    <g transform="translate({b2_w + 20}, 48)">
      <rect width="{b2_w}" height="300" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L {b2_w},0 L {b2_w},34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="{b2_w}" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«guardrail :: legal-compliance»</text>
      <text x="16" y="30" class="comp-name">PIISanitizerGuard</text>
      <text x="165" y="30" class="comp-tech">[Nghị định 13/2023/NĐ-CP • Luật Bưu chính 2010]</text>
      {uml_comp_glyph(b2_w - 28, 10)}

      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">DATA SANITIZATION &amp; MASKING ALGORITHMS:</text>
        
        <rect x="0" y="8" width="{b2_w - 28}" height="76" rx="2" fill="#FEF2F2" stroke="#EF4444" stroke-width="0.8"/>
        <text x="10" y="24" font-size="11.5" font-weight="700" fill="#991B1B">MẶT NẠ DỮ LIỆU ĐỊNH DANH CÁ NHÂN (PII MASKING RULES):</text>
        <text x="10" y="42" class="code-line">• SĐT Người nhận: Regex `(0\d{{2}})(\d{{4}})(\d{{3}})` ➔ `$1****$3` (VD: 098****321)</text>
        <text x="10" y="58" class="code-line">• Địa chỉ chi tiết: Che số nhà/tổ dân phố cho khách vãng lai (GUEST)</text>
        <text x="10" y="74" class="code-line">• Họ tên khách hàng: Che ký tự giữa ➔ Nguyễn V** A*</text>

        <line x1="0" y1="94" x2="{b2_w - 28}" y2="94" stroke="#E2E8F0" stroke-width="1"/>
        <text x="0" y="110" class="section-label">ACCESS CONTROL &amp; INJECTION DEFENSE:</text>
        <text x="0" y="128" class="desc-line">• <tspan class="code-bold">Role-Based Access Control (RBAC):</tspan> Phân định nghiêm ngặt GUEST vs SHOP/ADMIN.</text>
        <text x="0" y="146" class="desc-line">• <tspan class="code-bold">Guest Order Protection:</tspan> Khách vãng lai bắt buộc nhập chính xác mã vận đơn cụ thể.</text>
        <text x="0" y="164" class="desc-line">• <tspan class="code-bold">Prompt Injection Guard:</tspan> Lọc các mẫu câu phá vỡ vai trò (Jailbreak / System bypass).</text>
        <text x="0" y="182" class="desc-line">• <tspan class="code-bold">COD Privacy Isolation:</tspan> Tuyệt đối không để lộ số dư ví shop hoặc tài khoản ngân hàng.</text>
        <text x="0" y="200" class="desc-line">• <tspan class="code-bold">Audit Logger:</tspan> Ghi vết 100% truy vấn có dấu hiệu dò quét dữ liệu bưu gửi bất thường.</text>
        <text x="0" y="218" class="desc-line">• <tspan class="code-bold">Compliance Reference:</tspan> Tuân thủ Điều 25 Luật Bưu chính về an toàn bí mật thư tín.</text>
      </g>
    </g>

    <!-- Component 2.3: SessionMemoryManager -->
    <g transform="translate({(b2_w + 20) * 2}, 48)">
      <rect width="{b2_w}" height="300" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L {b2_w},0 L {b2_w},34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="{b2_w}" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«manager :: memory-state»</text>
      <text x="16" y="30" class="comp-name">SessionMemoryManager</text>
      <text x="210" y="30" class="comp-tech">[services/chatbot-service/src/chat/chat.service.ts]</text>
      {uml_comp_glyph(b2_w - 28, 10)}

      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">CONVERSATION STATE &amp; CONTEXT BUFFER:</text>
        <rect x="0" y="8" width="{b2_w - 28}" height="44" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="24" class="code-bold">conversationId: `conv-${{Date.now()}}-${{uuid}}`</text>
        <text x="10" y="40" class="desc-line">State Map: InMemorySessionBuffer: Map&lt;string, TurnContext[]&gt;</text>

        <line x1="0" y1="62" x2="{b2_w - 28}" y2="62" stroke="#E2E8F0" stroke-width="1"/>
        <text x="0" y="78" class="section-label">OPERATIONS &amp; CONTEXT POLICIES:</text>
        <text x="0" y="96" class="desc-line">• <tspan class="code-bold">Sliding Memory Window (K=6):</tspan> Lưu giữ 6 lượt tin nhắn gần nhất duy trì mạch đàm thoại.</text>
        <text x="0" y="114" class="desc-line">• <tspan class="code-bold">Entity Resolution:</tspan> Tự động phân giải đại từ ("nó", "đơn này") về mã vận đơn gần nhất.</text>
        <text x="0" y="132" class="desc-line">• <tspan class="code-bold">Auto Pruning TTL:</tspan> Tự động hủy dọn giải phóng bộ nhớ sau 30 phút không hoạt động.</text>
        <text x="0" y="150" class="desc-line">• <tspan class="code-bold">Latency Tracker:</tspan> Đo đạc chính xác thời gian hoàn thành (latencyMs = Date.now() - t0).</text>
        <text x="0" y="168" class="desc-line">• <tspan class="code-bold">Shipment Card State:</tspan> Đính kèm mảng shipmentCards[] phục vụ hiển thị UI client.</text>
        <text x="0" y="186" class="desc-line">• <tspan class="code-bold">Handover Flag:</tspan> Đánh dấu trạng thái chuyển giao tổng đài khi hội thoại bế tắc.</text>
        <text x="0" y="204" class="desc-line">• <tspan class="code-bold">Distributed Ready:</tspan> Thiết kế sẵn interface chuyển sang Redis Cluster khi scale ngang.</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # COMMUNICATION BUS 2 -> 3
    # =========================================================================
    b23_y = l2_y + l2_h
    lines.append(f'''
  <!-- PROTOCOL BUS: LAYER 2 TO LAYER 3 -->
  <g id="Bus_L2_L3">
    <line x1="250" y1="{b23_y + 25}" x2="{width - 250}" y2="{b23_y + 25}" stroke="#000000" stroke-width="2"/>
    
    <line x1="{margin_x + b2_w // 2}" y1="{b23_y}" x2="{margin_x + b2_w // 2}" y2="{b23_y + 25}" stroke="#000000" stroke-width="1.6"/>
    <line x1="{margin_x + b2_w + 20 + b2_w // 2}" y1="{b23_y}" x2="{margin_x + b2_w + 20 + b2_w // 2}" y2="{b23_y + 25}" stroke="#000000" stroke-width="1.6"/>
    <line x1="{margin_x + (b2_w + 20) * 2 + b2_w // 2}" y1="{b23_y}" x2="{margin_x + (b2_w + 20) * 2 + b2_w // 2}" y2="{b23_y + 25}" stroke="#000000" stroke-width="1.6"/>
    
    <line x1="{margin_x + 570}" y1="{b23_y + 25}" x2="{margin_x + 570}" y2="{b23_y + 50}" stroke="#000000" stroke-width="2"/>
    <polygon points="{margin_x + 564},{b23_y + 44} {margin_x + 570},{b23_y + 52} {margin_x + 576},{b23_y + 44}" fill="#000000"/>

    <line x1="{margin_x + 1730}" y1="{b23_y + 25}" x2="{margin_x + 1730}" y2="{b23_y + 50}" stroke="#000000" stroke-width="2"/>
    <polygon points="{margin_x + 1724},{b23_y + 44} {margin_x + 1730},{b23_y + 52} {margin_x + 1736},{b23_y + 44}" fill="#000000"/>

    <line x1="{margin_x + 2890}" y1="{b23_y + 25}" x2="{margin_x + 2890}" y2="{b23_y + 50}" stroke="#000000" stroke-width="2"/>
    <polygon points="{margin_x + 2884},{b23_y + 44} {margin_x + 2890},{b23_y + 52} {margin_x + 2896},{b23_y + 44}" fill="#000000"/>

    <rect x="{width // 2 - 250}" y="{b23_y + 13}" width="500" height="24" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
    <text x="{width // 2}" y="{b23_y + 29}" text-anchor="middle" class="bus-text">INTERNAL IN-PROCESS INVOCATION • NESTJS DEPENDENCY INJECTION</text>
  </g>
''')

    # =========================================================================
    # LAYER 3: CORE LOGISTICS ORCHESTRATION & REASONING (y: 910, h: 580)
    # =========================================================================
    l3_y = 910
    l3_h = 580
    b3_w = (content_w - 40) // 3  # 1140px

    lines.append(f'''
  <!-- LAYER 3: CORE LOGISTICS ORCHESTRATION & REASONING ENGINE -->
  <g id="Layer_3_Cognitive_Core" transform="translate({margin_x}, {l3_y})">
    <rect width="{content_w}" height="{l3_h}" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.6"/>
    <rect width="{content_w}" height="36" rx="6" fill="#000000"/>
    <text x="20" y="24" fill="#FFFFFF" class="tier-title">LAYER 3: CORE LOGISTICS ORCHESTRATION &amp; REASONING ENGINE («service» / «orchestrator»)</text>
    <text x="{content_w - 20}" y="24" text-anchor="end" fill="#E2E8F0" class="tier-sub">Intent Classification • Dual-Engine Decision • Logistics Tools Service • Prompt Assembler</text>

    <!-- Component 3.1: QueryProcessor & IntentRouter -->
    <g transform="translate(0, 48)">
      <rect width="{b3_w}" height="520" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L {b3_w},0 L {b3_w},34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="{b3_w}" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«router :: nlu-processor»</text>
      <text x="16" y="30" class="comp-name">QueryProcessor &amp; IntentRouter</text>
      <text x="250" y="30" class="comp-tech">[normalizeVietnamese() • Regex Engine]</text>
      {uml_comp_glyph(b3_w - 28, 10)}

      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">TEXT NORMALIZATION &amp; ENTITY EXTRACTION:</text>
        <rect x="0" y="8" width="{b3_w - 28}" height="76" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="24" class="code-bold">normalizeVietnamese(text: string): string</text>
        <text x="10" y="40" class="desc-line">• NFD Unicode decomposition + Strips diacritics: [\\u0300-\\u036f] + đ➔d</text>
        <text x="10" y="56" class="code-line">• Regex Tracking: \\b(NX[-_]?[A-Z0-9]{{4,14}})\\b | \\b(101\\d{{9}}|\\d{{10,14}})\\b</text>
        <text x="10" y="72" class="code-line">• Regex Dimensions: (\\d+(?:\\.\\d+)?)\\s*(?:kg|gam|g|cm|m)</text>

        <line x1="0" y1="94" x2="{b3_w - 28}" y2="94" stroke="#E2E8F0" stroke-width="1"/>
        <text x="0" y="110" class="section-label">INTENT CLASSIFICATION TAXONOMY (5 DOMAINS):</text>
        
        <rect x="0" y="118" width="{b3_w - 28}" height="42" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="0.8"/>
        <text x="10" y="134" class="code-bold">1. INTENT_TRACKING (Tra cứu hành trình đơn)</text>
        <text x="10" y="150" class="desc-line">Trigger: Có mã vận đơn ➔ Gọi Tool `trackShipment` ➔ Trả trạng thái &amp; bưu tá.</text>

        <rect x="0" y="166" width="{b3_w - 28}" height="42" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="0.8"/>
        <text x="10" y="182" class="code-bold">2. INTENT_PRICING (Tính cước phí &amp; Báo giá)</text>
        <text x="10" y="198" class="desc-line">Trigger: Tuyến đi - đến, khối lượng ➔ Gọi Tool `calculateShippingFee` IATA.</text>

        <rect x="0" y="214" width="{b3_w - 28}" height="42" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="0.8"/>
        <text x="10" y="230" class="code-bold">3. INTENT_INCIDENT (Khiếu nại &amp; Báo hỏng hàng)</text>
        <text x="10" y="246" class="desc-line">Trigger: "vỡ", "mất", "đền bù" ➔ Gọi Tool `reportIncident` ➔ Hướng dẫn chụp ảnh.</text>

        <rect x="0" y="262" width="{b3_w - 28}" height="42" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="0.8"/>
        <text x="10" y="278" class="code-bold">4. INTENT_STORAGE (Kiểm tra lưu kho quá hạn)</text>
        <text x="10" y="294" class="desc-line">Trigger: "lưu kho", "quá hạn", "tồn" ➔ Gọi Tool `checkStorageAging` Điều 18 &amp; 28.</text>

        <rect x="0" y="310" width="{b3_w - 28}" height="42" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="0.8"/>
        <text x="10" y="326" class="code-bold">5. INTENT_KNOWLEDGE_RAG (Quy định &amp; Chính sách)</text>
        <text x="10" y="342" class="desc-line">Trigger: Câu hỏi chính sách chung ➔ Chuyển giao sang Layer 4 Hybrid RAG Engine.</text>

        <line x1="0" y1="364" x2="{b3_w - 28}" y2="364" stroke="#E2E8F0" stroke-width="1"/>
        <text x="0" y="380" class="section-label">DUAL-ENGINE ROUTING DECISION MATRIX:</text>
        <text x="0" y="400" class="desc-line">• <tspan class="code-bold">Live Action Path:</tspan> Query khớp Regex Tool ➔ Bỏ qua RAG hoặc chạy song song để tối ưu p95.</text>
        <text x="0" y="420" class="desc-line">• <tspan class="code-bold">Knowledge Path:</tspan> Query nghiệp vụ thuần túy ➔ Kích hoạt Dense Vector Search.</text>
        <text x="0" y="440" class="desc-line">• <tspan class="code-bold">Hybrid Blend Path:</tspan> Vừa tra cứu đơn vừa hỏi chính sách ➔ Gộp Tool Output + Citations.</text>
        <text x="0" y="460" class="desc-line">• <tspan class="code-bold">Fallback Policy:</tspan> Không nhận diện được intent ➔ Kích hoạt gợi ý 3 nút bấm tương tác.</text>
      </g>
    </g>

    <!-- Component 3.2: LogisticsToolsService -->
    <g transform="translate({b3_w + 20}, 48)">
      <rect width="{b3_w}" height="520" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L {b3_w},0 L {b3_w},34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="{b3_w}" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«service :: tool-orchestrator»</text>
      <text x="16" y="30" class="comp-name">LogisticsToolsService</text>
      <text x="195" y="30" class="comp-tech">[services/chatbot-service/src/tools/logistics-tools.service.ts]</text>
      {uml_comp_glyph(b3_w - 28, 10)}

      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">REGISTERED LOGISTICS LIVE TOOLS &amp; METHODS:</text>

        <!-- Method 1 -->
        <rect x="0" y="8" width="{b3_w - 28}" height="70" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="24" class="code-bold">+ trackShipment(trackingCode: string): Promise&lt;ShipmentDetailDto&gt;</text>
        <text x="10" y="40" class="desc-line">Truy vấn trạng thái bưu gửi thời gian thực: PICKED_UP ➔ IN_TRANSIT ➔ DELIVERED.</text>
        <text x="10" y="56" class="desc-line">Bảo mật: Tự động che SĐT người nhận nếu requester là GUEST. Trả kèm Thẻ vận đơn UI.</text>

        <!-- Method 2 -->
        <rect x="0" y="84" width="{b3_w - 28}" height="70" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="100" class="code-bold">+ calculateShippingFee(origin, dest, weight, vol): Promise&lt;PricingQuoteDto&gt;</text>
        <text x="10" y="116" class="desc-line">Áp dụng công thức IATA: `vw = (dài x rộng x cao) / 5000`; `billableWeight = max(w, vw)`.</text>
        <text x="10" y="132" class="desc-line">Tính cước nấc vượt 0.5kg và phụ phí giao hàng vùng sâu vùng xa nội tỉnh / liên tỉnh.</text>

        <!-- Method 3 -->
        <rect x="0" y="160" width="{b3_w - 28}" height="70" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="176" class="code-bold">+ reportIncident(orderId: string, reason, damageRatio): Promise&lt;TicketDto&gt;</text>
        <text x="10" y="192" class="desc-line">Khởi tạo biên bản sự cố bưu gửi: Mã vé `CLM-${{Date.now()}}`, ghi nhận tỷ lệ hư hại.</text>
        <text x="10" y="208" class="desc-line">Kiểm tra điều kiện bồi thường: Tối đa 100% giá trị khai giá COD hoặc 4x cước chuyển phát.</text>

        <!-- Method 4 -->
        <rect x="0" y="236" width="{b3_w - 28}" height="70" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="252" class="code-bold">+ checkStorageAging(orderId: string, hubId: string): Promise&lt;StorageDto&gt;</text>
        <text x="10" y="268" class="desc-line">Tính số ngày lưu kho: `daysInHub = (Date.now() - arrivalDate) / 86400000`.</text>
        <text x="10" y="284" class="desc-line">Cảnh báo pháp lý: Ngày 1-7 (miễn phí), Ngày 8-15 (tính phí lưu), Ngày &gt;30 (Điều 18 xử lý vô chủ).</text>

        <!-- Method 5 -->
        <rect x="0" y="312" width="{b3_w - 28}" height="70" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="328" class="code-bold">+ handoverToAgent(orderId: string, priority, reason): Promise&lt;HandoverDto&gt;</text>
        <text x="10" y="344" class="desc-line">Chuyển tiếp phiên chat sang tổng đài CSKH người thật: Bắn cờ priority='URGENT'.</text>
        <text x="10" y="360" class="desc-line">Bắn thông báo đẩy Socket/Push Notification tới bưu tá phụ trách tuyến để hỗ trợ khẩn.</text>

        <line x1="0" y1="392" x2="{b3_w - 28}" y2="392" stroke="#E2E8F0" stroke-width="1"/>
        <text x="0" y="408" class="section-label">FAULT TOLERANCE &amp; CIRCUIT BREAKER:</text>
        <text x="0" y="426" class="desc-line">• <tspan class="code-bold">Timeout Defense:</tspan> Giới hạn 2000ms cho mỗi cuộc gọi REST xuống microservices.</text>
        <text x="0" y="444" class="desc-line">• <tspan class="code-bold">Graceful Degradation:</tspan> Khi service đích sập, trả dữ liệu mẫu/hướng dẫn thay vì crash.</text>
        <text x="0" y="462" class="desc-line">• <tspan class="code-bold">Idempotency Key:</tspan> Tránh tạo trùng lặp biên bản sự cố khi khách bấm nhiều lần.</text>
      </g>
    </g>

    <!-- Component 3.3: InContextPromptBuilder -->
    <g transform="translate({(b3_w + 20) * 2}, 48)">
      <rect width="{b3_w}" height="520" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L {b3_w},0 L {b3_w},34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="{b3_w}" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«orchestrator :: prompt-engineer»</text>
      <text x="16" y="30" class="comp-name">InContextPromptBuilder</text>
      <text x="210" y="30" class="comp-tech">[4-Layer Structured System Prompt Builder]</text>
      {uml_comp_glyph(b3_w - 28, 10)}

      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">4-TIER PROMPT CONTEXT ASSEMBLY PIPELINE:</text>

        <!-- Layer 1 -->
        <rect x="0" y="8" width="{b3_w - 28}" height="70" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="24" class="code-bold">PROMPT LAYER 1: Core System Directives &amp; Identity</text>
        <text x="10" y="40" class="desc-line">Định danh: "Bạn là Trợ lý AI Hệ thống Logistics Nexus (Nexus Logistics Assistant)".</text>
        <text x="10" y="56" class="desc-line">Nguyên tắc: Trung thực, khách quan, căn cứ 100% vào tài liệu SOP, tuyệt đối không bịa đặt số liệu.</text>

        <!-- Layer 2 -->
        <rect x="0" y="84" width="{b3_w - 28}" height="70" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="100" class="code-bold">PROMPT LAYER 2: Retrieved RAG Knowledge Chunks</text>
        <text x="10" y="116" class="desc-line">Nhúng Top-5 văn bản trích dẫn đạt ngưỡng tương đồng Cosine Similarity &gt;= 0.58.</text>
        <text x="10" y="132" class="desc-line">Định dạng: `[Nguồn: SOP-XX / Điều YY]: "Nội dung đoạn trích dẫn pháp lý..."`</text>

        <!-- Layer 3 -->
        <rect x="0" y="160" width="{b3_w - 28}" height="70" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="176" class="code-bold">PROMPT LAYER 3: Dynamic Tool Execution Results</text>
        <text x="10" y="192" class="desc-line">Dữ liệu thời gian thực được serialize từ DTO của LogisticsToolsService.</text>
        <text x="10" y="208" class="desc-line">Ví dụ: `DỮ LIỆU ĐƠN: NX-8842, Người nhận: 098****321, Trạng thái: Đang giao, Bưu tá: Hoàng Nam`</text>

        <!-- Layer 4 -->
        <rect x="0" y="236" width="{b3_w - 28}" height="70" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="252" class="code-bold">PROMPT LAYER 4: Multi-Turn Conversation History</text>
        <text x="10" y="268" class="desc-line">Nạp chuỗi 6 tin nhắn đối thoại gần nhất từ SessionMemoryManager.</text>
        <text x="10" y="284" class="desc-line">Đảm bảo ngữ cảnh liên tục khi khách hỏi tắt: "thế còn cước phí thì sao?", "giao lại được không?"</text>

        <line x1="0" y1="316" x2="{b3_w - 28}" y2="316" stroke="#E2E8F0" stroke-width="1"/>
        <text x="0" y="332" class="section-label">INFERENCE PARAMETERS &amp; CONSTRAINTS:</text>
        <text x="0" y="352" class="desc-line">• <tspan class="code-bold">Temperature = 0.2:</tspan> Triệt tiêu hoàn toàn tính ngẫu nhiên, đảm bảo câu trả lời nhất quán.</text>
        <text x="0" y="372" class="desc-line">• <tspan class="code-bold">Top_P = 0.85 &amp; MaxTokens = 1024:</tspan> Tối ưu tốc độ trả lời và giới hạn độ dài phản hồi gọn gàng.</text>
        <text x="0" y="392" class="desc-line">• <tspan class="code-bold">Citation Enforcement:</tspan> Ép mô hình chỉ dẫn số điều, tên SOP ở cuối mỗi câu trả lời tri thức.</text>
        <text x="0" y="412" class="desc-line">• <tspan class="code-bold">JSON DTO Marshalling:</tspan> Parse đầu ra LLM thành cấu trúc ChatResponseDto chuẩn xác.</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # COMMUNICATION BUS 3 -> 4 / 5
    # =========================================================================
    b34_y = l3_y + l3_h
    lines.append(f'''
  <!-- PROTOCOL BUS: LAYER 3 TO LAYERS 4 & 5 -->
  <g id="Bus_L3_L4">
    <line x1="200" y1="{b34_y + 25}" x2="{width - 200}" y2="{b34_y + 25}" stroke="#000000" stroke-width="2"/>
    
    <!-- Connectors down from Tier 3 -->
    <line x1="{margin_x + b3_w // 2}" y1="{b34_y}" x2="{margin_x + b3_w // 2}" y2="{b34_y + 25}" stroke="#000000" stroke-width="1.6"/>
    <line x1="{margin_x + b3_w + 20 + b3_w // 2}" y1="{b34_y}" x2="{margin_x + b3_w + 20 + b3_w // 2}" y2="{b34_y + 25}" stroke="#000000" stroke-width="1.6"/>
    <line x1="{margin_x + (b3_w + 20) * 2 + b3_w // 2}" y1="{b34_y}" x2="{margin_x + (b3_w + 20) * 2 + b3_w // 2}" y2="{b34_y + 25}" stroke="#000000" stroke-width="1.6"/>
    
    <!-- Connectors down to Tier 4 (Knowledge) & Tier 5 (Integration) -->
    <line x1="{margin_x + 850}" y1="{b34_y + 25}" x2="{margin_x + 850}" y2="{b34_y + 50}" stroke="#000000" stroke-width="2"/>
    <polygon points="{margin_x + 844},{b34_y + 44} {margin_x + 850},{b34_y + 52} {margin_x + 856},{b34_y + 44}" fill="#000000"/>

    <line x1="{margin_x + 2550}" y1="{b34_y + 25}" x2="{margin_x + 2550}" y2="{b34_y + 50}" stroke="#000000" stroke-width="2"/>
    <polygon points="{margin_x + 2544},{b34_y + 44} {margin_x + 2550},{b34_y + 52} {margin_x + 2556},{b34_y + 44}" fill="#000000"/>

    <rect x="{width // 2 - 270}" y="{b34_y + 13}" width="540" height="24" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
    <text x="{width // 2}" y="{b34_y + 29}" text-anchor="middle" class="bus-text">HYBRID RETRIEVAL IO &amp; DOWNSTREAM MICROSERVICES DISPATCH</text>
  </g>
''')

    # =========================================================================
    # LAYER 4: KNOWLEDGE RETRIEVAL & VECTOR REPOSITORY (y: 1570, h: 440)
    # =========================================================================
    l4_y = 1570
    l4_h = 440
    lines.append(f'''
  <!-- LAYER 4: KNOWLEDGE RETRIEVAL & HYBRID VECTOR STORAGE LAYER -->
  <g id="Layer_4_Knowledge_Base" transform="translate({margin_x}, {l4_y})">
    <rect width="{content_w}" height="{l4_h}" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.6"/>
    <rect width="{content_w}" height="36" rx="6" fill="#000000"/>
    <text x="20" y="24" fill="#FFFFFF" class="tier-title">LAYER 4: KNOWLEDGE RETRIEVAL &amp; HYBRID VECTOR REPOSITORY («repository» / «indexer»)</text>
    <text x="{content_w - 20}" y="24" text-anchor="end" fill="#E2E8F0" class="tier-sub">Markdown Heading AST • Sliding Window 250w/40w • In-Memory Vector Store • Cosine Hybrid Search</text>

    <!-- Sub-block 4.1: Document Ingestion & AST Chunker -->
    <g transform="translate(0, 48)">
      <rect width="1050" height="375" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L 1050,0 L 1050,34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="1050" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«indexer :: chunker»</text>
      <text x="16" y="30" class="comp-name">DocumentIngestor &amp; ChunkerService</text>
      <text x="310" y="30" class="comp-tech">[services/chatbot-service/src/rag/chunker.service.ts]</text>
      {uml_comp_glyph(1050 - 28, 10)}

      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">INPUT CORPUS &amp; KNOWLEDGE DOCUMENTS:</text>
        <text x="0" y="18" class="code-line">• 9 Standard Operating Procedures (SOP-01 ➔ SOP-09) tại `docs/knowledge-base/`</text>
        <text x="0" y="34" class="desc-line">Bao gồm: Quy chuẩn đóng gói hàng dễ vỡ, Biểu cước bưu chính, Quy định xử lý hàng Điều 18 &amp; 28.</text>

        <line x1="0" y1="48" x2="1022" y2="48" stroke="#E2E8F0" stroke-width="1"/>
        <text x="0" y="64" class="section-label">AST PARSING &amp; SLIDING WINDOW CHUNKING SPECIFICATION:</text>
        <text x="0" y="82" class="desc-line">• <tspan class="code-bold">Markdown Heading AST Traversal:</tspan> Phân tích cú pháp tiêu đề `#`, `##`, `###` bảo toàn ngữ cảnh điều luật.</text>
        <text x="0" y="100" class="desc-line">• <tspan class="code-bold">Window Configuration:</tspan> Cửa sổ trượt kích thước cố định <tspan class="code-bold">W = 250 từ</tspan>, độ gối đầu <tspan class="code-bold">Overlap O = 40 từ</tspan>.</text>
        <text x="0" y="118" class="desc-line">• <tspan class="code-bold">Semantic Metadata Header Injection:</tspan> Mỗi chunk tự động đính kèm breadcrumb điều luật:</text>
        
        <rect x="0" y="126" width="1022" height="34" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="148" class="code-line">metadata: {{"docId": "SOP-08", "section": "Điều 18: Bưu gửi không người nhận", "tokens": 242}}</text>

        <text x="0" y="180" class="desc-line">• <tspan class="code-bold">Total Corpus Volume:</tspan> Toàn bộ 9 văn bản SOP được phân đoạn thành chính xác <tspan class="code-bold">62 Chunks tri thức</tspan>.</text>
        <text x="0" y="198" class="desc-line">• <tspan class="code-bold">Vector Ingestion Pipeline:</tspan> Chạy batch qua Google Gemini Embedding hoặc OpenAI text-embedding-3.</text>
        <text x="0" y="216" class="desc-line">• <tspan class="code-bold">Reindex Trigger:</tspan> Cung cấp endpoint quản trị reindex đồng bộ không cần khởi động lại service.</text>
      </g>
    </g>

    <!-- Sub-block 4.2: 3D Isometric Cylinder Database Vector Store -->
    <g transform="translate(1070, 48)">
      <rect width="1320" height="375" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L 1320,0 L 1320,34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="1320" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«repository :: vector-store»</text>
      <text x="16" y="30" class="comp-name">VectorStoreRepository &amp; Local Index File</text>
      <text x="340" y="30" class="comp-tech">[services/chatbot-service/src/rag/vector-store.service.ts]</text>
      {uml_comp_glyph(1320 - 28, 10)}

      <!-- Visual Cylinder Node Stack on Left -->
      <g transform="translate(24, 52)">
        <!-- Top Cylinder: Embedding Matrix -->
        <g transform="translate(0, 0)">
          <path d="M 0,16 C 0,7 35,0 80,0 C 125,0 160,7 160,16 L 160,60 C 160,69 125,76 80,76 C 35,76 0,69 0,60 Z" fill="#F8FAFC" stroke="#000000" stroke-width="1.6"/>
          <ellipse cx="80" cy="16" rx="80" ry="16" fill="#E2E8F0" stroke="#000000" stroke-width="1.6"/>
          <text x="80" y="44" text-anchor="middle" font-size="12" font-weight="800">EMBEDDINGS</text>
          <text x="80" y="58" text-anchor="middle" font-size="10.5" font-family="monospace">dim = 768 / 1536</text>
        </g>
        
        <!-- Mid Cylinder: Metadata Store -->
        <g transform="translate(0, 68)">
          <path d="M 0,16 C 0,7 35,0 80,0 C 125,0 160,7 160,16 L 160,60 C 160,69 125,76 80,76 C 35,76 0,69 0,60 Z" fill="#F8FAFC" stroke="#000000" stroke-width="1.6"/>
          <ellipse cx="80" cy="16" rx="80" ry="16" fill="#E2E8F0" stroke="#000000" stroke-width="1.6"/>
          <text x="80" y="44" text-anchor="middle" font-size="12" font-weight="800">METADATA CHUNKS</text>
          <text x="80" y="58" text-anchor="middle" font-size="10.5" font-family="monospace">62 Document Chunks</text>
        </g>

        <!-- Bot Cylinder: In-Memory Cache -->
        <g transform="translate(0, 136)">
          <path d="M 0,16 C 0,7 35,0 80,0 C 125,0 160,7 160,16 L 160,60 C 160,69 125,76 80,76 C 35,76 0,69 0,60 Z" fill="#F8FAFC" stroke="#000000" stroke-width="1.6"/>
          <ellipse cx="80" cy="16" rx="80" ry="16" fill="#E2E8F0" stroke="#000000" stroke-width="1.6"/>
          <text x="80" y="44" text-anchor="middle" font-size="12" font-weight="800">MEMORY CACHE</text>
          <text x="80" y="58" text-anchor="middle" font-size="10.5" font-family="monospace">Cosine Matrix &lt;5ms</text>
        </g>
      </g>

      <!-- Details on Right -->
      <g transform="translate(210, 46)">
        <text x="0" y="0" class="section-label">PHYSICAL PERSISTENCE SCHEMA (vector-index.json):</text>
        
        <rect x="0" y="8" width="1090" height="120" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="12" y="24" class="code-bold">Interface VectorChunkRecord {{</text>
        <text x="24" y="42" class="code-line">id: string; // "SOP-08-c003"</text>
        <text x="24" y="58" class="code-line">docId: string; // "SOP-08-xu-ly-hang-luu-kho.md"</text>
        <text x="24" y="74" class="code-line">title: string; // "Điều 18: Quy trình xử lý bưu gửi vô chủ quá 30 ngày"</text>
        <text x="24" y="90" class="code-line">content: string; // Text thuần chứa nội dung quy định chi tiết</text>
        <text x="24" y="106" class="code-line">embedding: number[]; // Vector nhúng dense float array 768 / 1536 chiều</text>
        <text x="12" y="120" class="code-bold">}}</text>

        <line x1="0" y1="140" x2="1090" y2="140" stroke="#E2E8F0" stroke-width="1"/>
        <text x="0" y="156" class="section-label">IN-MEMORY RETRIEVAL ACCELERATION:</text>
        <text x="0" y="174" class="desc-line">• <tspan class="code-bold">RAM Residency:</tspan> Tải toàn bộ 62 vectors vào mảng định kiểu Float32Array ngay khi service khởi động.</text>
        <text x="0" y="192" class="desc-line">• <tspan class="code-bold">Ultra-low Latency:</tspan> Phép nhân vô hướng Dot-Product tính độ tương đồng hoàn tất trong chưa đầy 3.2ms.</text>
        <text x="0" y="210" class="desc-line">• <tspan class="code-bold">No External Vector DB Overhead:</tspan> Loại bỏ hoàn toàn sự phụ thuộc vào Pinecone/Milvus ngoài luồng.</text>
      </g>
    </g>

    <!-- Sub-block 4.3: Hybrid Search Engine -->
    <g transform="translate(2410, 48)">
      <rect width="1050" height="375" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L 1050,0 L 1050,34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="1050" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«search :: hybrid-retriever»</text>
      <text x="16" y="30" class="comp-name">HybridSearchEngine</text>
      <text x="180" y="30" class="comp-tech">[Dense Cosine + Sparse Keyword Boost]</text>
      {uml_comp_glyph(1050 - 28, 10)}

      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">HYBRID RETRIEVAL MATHEMATICAL FORMULATION:</text>

        <rect x="0" y="8" width="1022" height="60" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="10" y="26" class="code-bold">FinalScore(q, d) = 0.70 × CosineSim(V_q, V_d) + 0.35 × ThesaurusMatch(q, d)</text>
        <text x="10" y="44" class="desc-line">Trong đó: CosineSim = (V_q · V_d) / (||V_q|| × ||V_d||); ThesaurusMatch tính tỷ lệ khớp từ điển logistics.</text>

        <line x1="0" y1="78" x2="1022" y2="78" stroke="#E2E8F0" stroke-width="1"/>
        <text x="0" y="94" class="section-label">LOGISTICS THESAURUS &amp; KEYWORD DICTIONARY:</text>
        <text x="0" y="112" class="desc-line">• Từ khóa đặc thù ngành: "đồng kiểm", "bồi thường", "hàng cồng kềnh", "thể tích IATA", "lưu kho Điều 18".</text>
        <text x="0" y="130" class="desc-line">• Tự động mở rộng từ đồng nghĩa: "hỏng" ➔ "hư hại", "vỡ", "móp méo", "rách bao bì".</text>

        <line x1="0" y1="144" x2="1022" y2="144" stroke="#E2E8F0" stroke-width="1"/>
        <text x="0" y="160" class="section-label">RE-RANKING &amp; THRESHOLD FILTERING PIPELINE:</text>
        <text x="0" y="178" class="desc-line">• <tspan class="code-bold">Top-K Selection:</tspan> Lấy Top K=5 đoạn trích có FinalScore cao nhất.</text>
        <text x="0" y="196" class="desc-line">• <tspan class="code-bold">Relevance Cutoff Threshold:</tspan> Lọc bỏ triệt để các đoạn có FinalScore &lt; 0.58.</text>
        <text x="0" y="214" class="desc-line">• <tspan class="code-bold">Document Deduplication:</tspan> Giới hạn tối đa 2 chunks từ cùng một văn bản SOP tránh tràn ngữ cảnh.</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # COMMUNICATION BUS 4 -> 5
    # =========================================================================
    b45_y = l4_y + l4_h
    lines.append(f'''
  <!-- PROTOCOL BUS: LAYER 4 TO LAYER 5 -->
  <g id="Bus_L4_L5">
    <line x1="200" y1="{b45_y + 25}" x2="{width - 200}" y2="{b45_y + 25}" stroke="#000000" stroke-width="2"/>
    
    <line x1="{margin_x + 850}" y1="{b45_y}" x2="{margin_x + 850}" y2="{b45_y + 25}" stroke="#000000" stroke-width="1.6"/>
    <line x1="{margin_x + 2550}" y1="{b45_y}" x2="{margin_x + 2550}" y2="{b45_y + 25}" stroke="#000000" stroke-width="1.6"/>
    
    <line x1="{margin_x + 850}" y1="{b45_y + 25}" x2="{margin_x + 850}" y2="{b45_y + 50}" stroke="#000000" stroke-width="2"/>
    <polygon points="{margin_x + 844},{b45_y + 44} {margin_x + 850},{b45_y + 52} {margin_x + 856},{b45_y + 44}" fill="#000000"/>

    <line x1="{margin_x + 2550}" y1="{b45_y + 25}" x2="{margin_x + 2550}" y2="{b45_y + 50}" stroke="#000000" stroke-width="2"/>
    <polygon points="{margin_x + 2544},{b45_y + 44} {margin_x + 2550},{b45_y + 52} {margin_x + 2556},{b45_y + 44}" fill="#000000"/>

    <rect x="{width // 2 - 270}" y="{b45_y + 13}" width="540" height="24" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
    <text x="{width // 2}" y="{b45_y + 29}" text-anchor="middle" class="bus-text">INTERNAL SERVICE MESH RPC &amp; EXTERNAL LLM API ADAPTERS</text>
  </g>
''')

    # =========================================================================
    # LAYER 5: DOWNSTREAM MESH & EXTERNAL LLM ADAPTERS (y: 2070, h: 420)
    # =========================================================================
    l5_y = 2070
    l5_h = 420
    s5_w = (content_w - 40) // 2  # 1710px

    lines.append(f'''
  <!-- LAYER 5: DOWNSTREAM SERVICES MESH & EXTERNAL AI PROVIDER ADAPTERS -->
  <g id="Layer_5_Downstream_LLM" transform="translate({margin_x}, {l5_y})">
    <rect width="{content_w}" height="{l5_h}" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.6"/>
    <rect width="{content_w}" height="36" rx="6" fill="#000000"/>
    <text x="20" y="24" fill="#FFFFFF" class="tier-title">LAYER 5: INFRASTRUCTURE ADAPTERS - INTERNAL MICROSERVICES MESH &amp; AI PROVIDERS («adapter»)</text>
    <text x="{content_w - 20}" y="24" text-anchor="end" fill="#E2E8F0" class="tier-sub">Database-per-Service Architecture • HTTP/REST Clients • Dual LLM Fallback (Gemini / OpenAI)</text>

    <!-- Component 5.1: Internal Logistics Microservices Mesh -->
    <g transform="translate(0, 48)">
      <rect width="{s5_w}" height="365" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L {s5_w},0 L {s5_w},34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="{s5_w}" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«adapter :: microservices-mesh»</text>
      <text x="16" y="30" class="comp-name">Internal Logistics Microservices Mesh</text>
      <text x="320" y="30" class="comp-tech">[Database-per-Service • API Gateway :3000 • RabbitMQ Bus]</text>
      {uml_comp_glyph(s5_w - 28, 10)}

      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">CONNECTED INTERNAL DOMAIN SERVICES &amp; API SPECIFICATION:</text>

        <!-- Service 1: Shipment -->
        <rect x="0" y="8" width="{s5_w - 28}" height="42" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="12" y="24" class="code-bold">ShipmentService (:3002) ➔ GET /api/v1/shipments/track/:trackingNumber</text>
        <text x="12" y="38" class="desc-line">Truy vấn trạng thái bưu gửi, kiện hàng, bưu tá tuyến và tọa độ chặng quét mã vạch gần nhất.</text>

        <!-- Service 2: Pricing -->
        <rect x="0" y="56" width="{s5_w - 28}" height="42" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="12" y="72" class="code-bold">PricingService (:3003) ➔ POST /api/v1/pricing/calculate</text>
        <text x="12" y="86" class="desc-line">Cung cấp bảng giá cước dịch vụ Chuẩn (STD) / Hỏa tốc (EXP), phụ phí vùng sâu vùng xa Metro.</text>

        <!-- Service 3: Incident -->
        <rect x="0" y="104" width="{s5_w - 28}" height="42" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="12" y="120" class="code-bold">IncidentService (:3008) ➔ POST /api/v1/incidents/claim</text>
        <text x="12" y="134" class="desc-line">Mở hồ sơ bồi thường hàng vỡ/thất lạc, quản lý bằng chứng hình ảnh và hạn mức đền bù tối đa.</text>

        <!-- Service 4: Hub -->
        <rect x="0" y="152" width="{s5_w - 28}" height="42" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="12" y="168" class="code-bold">HubService (:3004) ➔ GET /api/v1/hubs/storage/aging/:orderId</text>
        <text x="12" y="182" class="desc-line">Kiểm tra tuổi thọ tồn kho bưu gửi tại các trung tâm khai thác (SOC), áp dụng quy định Điều 18 &amp; 28.</text>

        <!-- Service 5: Notification -->
        <rect x="0" y="200" width="{s5_w - 28}" height="42" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="12" y="216" class="code-bold">NotificationService (:3012) ➔ POST /api/v1/notifications/push</text>
        <text x="12" y="230" class="desc-line">Bắn thông báo đẩy khẩn cấp tới App Bưu tá và đưa vé hỗ trợ vào hàng đợi CSKH cấp 1.</text>

        <line x1="0" y1="254" x2="{s5_w - 28}" y2="254" stroke="#E2E8F0" stroke-width="1"/>
        <text x="0" y="270" class="section-label">COMMUNICATION CHARACTERISTICS:</text>
        <text x="0" y="288" class="desc-line">• Giao thức: RESTful JSON over HTTP/1.1; Kèm Header chuẩn hóa: `X-Internal-Token`, `X-Correlation-Id`.</text>
        <text x="0" y="304" class="desc-line">• Cơ chế chịu lỗi: Circuit Breaker Timeout 2000ms, Fallback trả dữ liệu hướng dẫn khi service quá tải.</text>
      </g>
    </g>

    <!-- Component 5.2: LLM Provider & AI Model Adapters -->
    <g transform="translate({s5_w + 40}, 48)">
      <rect width="{s5_w}" height="365" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
      
      <path d="M 0,0 L {s5_w},0 L {s5_w},34 L 0,34 Z" fill="#F1F5F9"/>
      <line x1="0" y1="34" x2="{s5_w}" y2="34" stroke="#000000" stroke-width="1"/>
      <text x="16" y="16" class="comp-stereotype">«adapter :: llm-gateway»</text>
      <text x="16" y="30" class="comp-name">AIProviderAdapters &amp; Embedding Gateway</text>
      <text x="350" y="30" class="comp-tech">[Google Gemini API • OpenAI API • Local Hash Fallback]</text>
      {uml_comp_glyph(s5_w - 28, 10)}

      <g transform="translate(14, 46)">
        <text x="0" y="0" class="section-label">INTEGRATED LARGE LANGUAGE MODEL CLIENTS &amp; FALLBACK MATRIX:</text>

        <!-- Primary: Gemini -->
        <rect x="0" y="8" width="{s5_w - 28}" height="52" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="12" y="24" class="code-bold">PRIMARY: Google Gemini 3.6 Flash &amp; gemini-embedding-001 (Priority #1)</text>
        <text x="12" y="40" class="desc-line">Tối ưu chi phí và độ trễ sinh từ ngữ (TTFT &lt; 50ms); Hỗ trợ batching embedding tái tạo chỉ mục nhanh chóng.</text>

        <!-- Secondary: OpenAI -->
        <rect x="0" y="66" width="{s5_w - 28}" height="52" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="12" y="82" class="code-bold">SECONDARY: OpenAI GPT-4o-mini &amp; text-embedding-3-small (Priority #2 Fallback)</text>
        <text x="12" y="98" class="desc-line">Kích hoạt khi Gemini gặp lỗi 429 Quota Exceeded hoặc 503 Service Unavailable; Nhúng vector 1536 chiều.</text>

        <!-- Tertiary: Local Hash -->
        <rect x="0" y="124" width="{s5_w - 28}" height="52" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
        <text x="12" y="140" class="code-bold">OFFLINE: Local Deterministic Semantic Hash Vectorizer (Priority #3 Emergency)</text>
        <text x="12" y="156" class="desc-line">Thuật toán băm chuỗi cục bộ sinh vector 768 chiều cho phép vận hành offline 100% không cần internet.</text>

        <line x1="0" y1="188" x2="{s5_w - 28}" y2="188" stroke="#E2E8F0" stroke-width="1"/>
        <text x="0" y="204" class="section-label">OPERATIONAL METRICS &amp; SLA OBJECTIVES:</text>
        <text x="0" y="222" class="desc-line">• <tspan class="code-bold">End-to-End Latency:</tspan> REST Response hoàn chỉnh: 280ms - 450ms (p95); Token đầu tiên SSE: &lt; 50ms.</text>
        <text x="0" y="240" class="desc-line">• <tspan class="code-bold">Strict Temperature Lock:</tspan> Khóa chặt <tspan class="code-bold">T = 0.2</tspan> ngăn ngừa sinh nội dung sai lệch chính sách bưu chính.</text>
        <text x="0" y="258" class="desc-line">• <tspan class="code-bold">Safety Settings:</tspan> BLOCK_NONE cho câu từ logistics, chặn 100% nội dung thù địch hoặc độc hại.</text>
        <text x="0" y="276" class="desc-line">• <tspan class="code-bold">System Resilience:</tspan> Tự động chuyển đổi giữa 3 providers đảm bảo 99.9% uptime sẵn sàng.</text>
      </g>
    </g>
  </g>
''')

    # =========================================================================
    # FORMAL ENGINEERING TITLE BLOCK (Khung tên bản vẽ kỹ thuật chuẩn ISO 7200)
    # y: 2505, x: width - margin_x - 900, w: 900, h: 105
    # =========================================================================
    tb_w = 920
    tb_h = 100
    tb_x = width - margin_x - tb_w
    tb_y = height - margin_x - tb_h + 30

    lines.append(f'''
  <!-- FORMAL ISO 7200 / ASME TECHNICAL TITLE BLOCK -->
  <g id="Technical_Title_Block" transform="translate({tb_x}, {tb_y})">
    <rect width="{tb_w}" height="{tb_h}" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
    
    <!-- Dividing Lines -->
    <line x1="0" y1="36" x2="{tb_w}" y2="36" stroke="#000000" stroke-width="1.2"/>
    <line x1="0" y1="68" x2="{tb_w}" y2="68" stroke="#000000" stroke-width="1.2"/>
    <line x1="500" y1="0" x2="500" y2="{tb_h}" stroke="#000000" stroke-width="1.2"/>
    <line x1="710" y1="36" x2="710" y2="{tb_h}" stroke="#000000" stroke-width="1.2"/>

    <!-- Row 1: Project Title -->
    <text x="14" y="16" class="tb-label">ĐỒ ÁN TỐT NGHIỆP KỸ SƯ CÔNG NGHỆ THÔNG TIN</text>
    <text x="14" y="30" class="tb-val">HỆ THỐNG QUẢN LÝ VẬN TẢI &amp; LOGISTICS TOÀN TRÌNH (NEXUS LMS)</text>
    
    <text x="514" y="16" class="tb-label">MÃ PHÂN HỆ / SUBSYSTEM</text>
    <text x="514" y="30" class="tb-val">services/chatbot-service (:3009)</text>

    <!-- Row 2: Diagram Title & Doc ID -->
    <text x="14" y="50" class="tb-label">TÊN BẢN VẼ / DRAWING TITLE</text>
    <text x="14" y="63" class="tb-val">KIẾN TRÚC THÀNH PHẦN PHÂN HỆ AI CHATBOT (COMPONENT TOPOLOGY)</text>

    <text x="514" y="50" class="tb-label">MÃ TÀI LIỆU / DOC ID</text>
    <text x="514" y="63" class="tb-val">BVT-LMS-CB-04A</text>

    <text x="724" y="50" class="tb-label">PHIÊN BẢN / REVISION</text>
    <text x="724" y="63" class="tb-val">v2.1 (FINAL DEFENSE)</text>

    <!-- Row 3: Standard, Date, Scale -->
    <text x="14" y="82" class="tb-label">TIÊU CHUẨN ĐẶC TẢ / SPECIFICATION STANDARD</text>
    <text x="14" y="94" class="tb-val">UML 2.5 COMPONENT MODEL • ISO/IEC/IEEE 42010</text>

    <text x="514" y="82" class="tb-label">NGÀY PHÁT HÀNH / DATE</text>
    <text x="514" y="94" class="tb-val">2026-09-29</text>

    <text x="724" y="82" class="tb-label">TỶ LỆ / FORMAT</text>
    <text x="724" y="94" class="tb-val">1:1 VECTOR BLUEPRINT</text>
  </g>
''')

    lines.append('</svg>')
    return '\n'.join(lines)

def main():
    print(f"Generating Formal UML 2.5 AI Chatbot Architecture Diagram for Figma Page 1...")
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
