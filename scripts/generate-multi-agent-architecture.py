#!/usr/bin/env python3
"""
generate-multi-agent-architecture.py
Monochrome Technical Blueprint for Nexus Logistics Multi-Agent Orchestration & HITL Architecture.
Strict adherence to technical-svg-blueprint standard:
- Pure white canvas (#FFFFFF)
- High-contrast black outlines (#000000) and slate fills (#F8FAFC, #F1F5F9, #E2E8F0)
- 100% Native Inline Vector (Zero <marker> tags, Figma compatible, valid XML).
"""

import os
import html

OUTPUT_FILE = "docs/graduation-thesis/diagrams/architecture/04-architecture-multi-agent-system.svg"

def xml_esc(s):
    if s is None:
        return ""
    clean = str(s).replace("&amp;", "&")
    return html.escape(clean, quote=True)

def draw_arrow(x, y, direction="right", color="#000000", size=16):
    if direction == "right":
        points = f"{x},{y} {x-size},{y-size*0.45:.1f} {x-size},{y+size*0.45:.1f}"
    elif direction == "left":
        points = f"{x},{y} {x+size},{y-size*0.45:.1f} {x+size},{y+size*0.45:.1f}"
    elif direction == "down":
        points = f"{x},{y} {x-size*0.45:.1f},{y-size} {x+size*0.45:.1f},{y-size}"
    elif direction == "up":
        points = f"{x},{y} {x-size*0.45:.1f},{y+size} {x+size*0.45:.1f},{y+size}"
    return f'<polygon points="{points}" fill="{color}"/>'

def build_svg():
    W = 1920
    H = 1350
    lines = []

    lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800;900&amp;family=JetBrains+Mono:wght@700;800;900&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Inter', system-ui, -apple-system, sans-serif; }}
      .mono {{ font-family: 'JetBrains Mono', monospace; }}
      .badge {{ font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 900; }}
    </style>
  </defs>

  <!-- PURE WHITE CANVAS -->
  <rect width="{W}" height="{H}" fill="#FFFFFF"/>

  <!-- TECHNICAL BORDER -->
  <rect x="18" y="18" width="{W - 36}" height="{H - 36}" fill="none" stroke="#000000" stroke-width="2.8" rx="8"/>
  <rect x="28" y="28" width="{W - 56}" height="{H - 56}" fill="none" stroke="#CBD5E1" stroke-width="1.2" stroke-dasharray="6,4" rx="6"/>

  <!-- HEADER -->
  <g id="Diagram_Header" transform="translate({W//2}, 65)">
    <rect x="-95" y="-32" width="190" height="28" rx="6" fill="#F1F5F9" stroke="#000000" stroke-width="1.8"/>
    <text x="0" y="-13" class="mono" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">RESEARCH-ARCH-MAS-04</text>
    <text x="0" y="26" font-size="30" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="-0.02em">KIẾN TRÚC HỆ THỐNG ĐA TÁC TỬ (MULTI-AGENT) VÀ KIỂM SOÁT AN TOÀN HUMAN-IN-THE-LOOP</text>
    <text x="0" y="54" font-size="16" font-weight="700" fill="#475569" text-anchor="middle">Stateful Multi-Agent Orchestration with LangGraph, Domain Specialization &amp; Safe Transaction Execution</text>
  </g>

  <!-- =========================================================================
       COLUMN 1: CLIENT APPLICATIONS (x=60, y=140, w=280, h=1130)
       ========================================================================= -->
  <g id="Col_Clients">
    <rect x="60" y="140" width="280" height="1130" fill="#F8FAFC" stroke="#000000" stroke-width="2.0" rx="8"/>
    <rect x="60" y="140" width="280" height="42" fill="#E2E8F0" stroke="#000000" stroke-width="2.0" rx="8 8 0 0"/>
    <text x="200" y="167" font-size="16" font-weight="900" fill="#000000" text-anchor="middle">TẦNG TRẢI NGHIỆM CLIENT</text>

    <!-- Client Cards -->
    <g transform="translate(80, 220)">
      <rect width="240" height="130" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" rx="6"/>
      <text x="120" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">Merchant Web Portal</text>
      <text x="120" y="58" font-size="13" font-weight="600" fill="#475569" text-anchor="middle">Giao diện Chủ Shop / Bưu tá</text>
      <text x="120" y="80" class="mono" font-size="12" font-weight="700" fill="#0F172A" text-anchor="middle">React 18 + SSE Stream</text>
      <text x="120" y="104" font-size="12" font-weight="700" fill="#2563EB" text-anchor="middle">Yêu cầu hủy đơn / Đổi địa chỉ</text>
    </g>

    <g transform="translate(80, 380)">
      <rect width="240" height="130" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" rx="6"/>
      <text x="120" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">Customer Mobile App</text>
      <text x="120" y="58" font-size="13" font-weight="600" fill="#475569" text-anchor="middle">Khách hàng nhận / Gửi cá nhân</text>
      <text x="120" y="80" class="mono" font-size="12" font-weight="700" fill="#0F172A" text-anchor="middle">React Native / Flutter</text>
      <text x="120" y="104" font-size="12" font-weight="700" fill="#2563EB" text-anchor="middle">Khiếu nại vỡ / Tra cứu thời gian</text>
    </g>

    <g transform="translate(80, 540)">
      <rect width="240" height="130" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" rx="6"/>
      <text x="120" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">Guest Tracking Portal</text>
      <text x="120" y="58" font-size="13" font-weight="600" fill="#475569" text-anchor="middle">Khách vãng lai (Chưa đăng nhập)</text>
      <text x="120" y="80" class="mono" font-size="12" font-weight="700" fill="#0F172A" text-anchor="middle">Che giấu PII dữ liệu cá nhân</text>
      <text x="120" y="104" font-size="12" font-weight="700" fill="#2563EB" text-anchor="middle">Hỏi biểu phí IATA / Tra đơn NX</text>
    </g>

    <!-- Client Human-in-the-Loop Display Card -->
    <g transform="translate(80, 750)">
      <rect width="240" height="480" fill="#EFF6FF" stroke="#2563EB" stroke-width="2.2" rx="8"/>
      <rect width="240" height="38" fill="#DBEAFE" stroke="#2563EB" stroke-width="1.8" rx="8 8 0 0"/>
      <text x="120" y="25" font-size="14" font-weight="900" fill="#1E40AF" text-anchor="middle">HUMAN-IN-THE-LOOP (HITL)</text>
      <text x="120" y="60" font-size="13" font-weight="800" fill="#000000" text-anchor="middle">Thẻ Phê Duyệt An Toàn</text>
      
      <!-- Mini Mockup Card inside -->
      <rect x="15" y="85" width="210" height="230" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.5" rx="6"/>
      <text x="25" y="112" class="mono" font-size="13" font-weight="900" fill="#DC2626">CẢNH BÁO THAO TÁC</text>
      <text x="25" y="136" font-size="12" font-weight="700" fill="#000000">Xác nhận hủy đơn: NX-9988</text>
      <text x="25" y="160" font-size="11" font-weight="600" fill="#475569">Trạng thái: Chờ lấy hàng</text>
      <text x="25" y="180" font-size="11" font-weight="600" fill="#475569">Phí hủy: 0 VNĐ (Trong hạn)</text>
      <text x="25" y="200" font-size="11" font-weight="600" fill="#475569">Rủi ro: Hủy không thể đảo ngược</text>
      
      <!-- Buttons -->
      <rect x="25" y="225" width="90" height="32" fill="#DC2626" rx="4"/>
      <text x="70" y="246" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">HỦY ĐƠN</text>
      
      <rect x="125" y="225" width="90" height="32" fill="#E2E8F0" rx="4"/>
      <text x="170" y="246" font-size="11" font-weight="900" fill="#0F172A" text-anchor="middle">BỎ QUA</text>

      <text x="120" y="340" font-size="12" font-weight="700" fill="#0F172A" text-anchor="middle">Cơ Chế Ngắt (Interrupt):</text>
      <text x="20" y="370" font-size="11" font-weight="600" fill="#334155">• AI không tự ý bấm API hủy</text>
      <text x="20" y="392" font-size="11" font-weight="600" fill="#334155">• Bắt buộc người dùng ký xác thực</text>
      <text x="20" y="414" font-size="11" font-weight="600" fill="#334155">• Ghi vết Audit Log chống chối bỏ</text>
      <text x="20" y="436" font-size="11" font-weight="600" fill="#334155">• Giải quyết trọn vẹn AI Safety</text>
    </g>
  </g>

  <!-- =========================================================================
       COLUMN 2: MULTI-AGENT ORCHESTRATION ENGINE (x=380, y=140, w=1080, h=1130)
       ========================================================================= -->
  <g id="Col_MultiAgent">
    <rect x="380" y="140" width="1080" height="1130" fill="#F8FAFC" stroke="#000000" stroke-width="2.2" rx="8"/>
    <rect x="380" y="140" width="1080" height="42" fill="#E2E8F0" stroke="#000000" stroke-width="2.2" rx="8 8 0 0"/>
    <text x="920" y="167" font-size="16" font-weight="900" fill="#000000" text-anchor="middle">PHÂN HỆ ĐIỀU PHỐI ĐA TÁC TỬ (@NEXUS/chatbot-service :3013 - LangGraph Engine)</text>

    <!-- TOP SECTION: SUPERVISOR & SHARED STATE -->
    <!-- Supervisor Agent -->
    <g transform="translate(420, 210)">
      <rect width="480" height="210" fill="#FFFFFF" stroke="#000000" stroke-width="2.0" rx="8"/>
      <rect width="480" height="36" fill="#F1F5F9" stroke="#000000" stroke-width="1.8" rx="8 8 0 0"/>
      <text x="240" y="24" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">SUPERVISOR AGENT (Orchestrator / Planner)</text>
      
      <text x="25" y="66" font-size="13" font-weight="800" fill="#0F172A">Mô hình:</text>
      <text x="90" y="66" class="mono" font-size="13" font-weight="800" fill="#2563EB">Gemini 2.0 Flash / GPT-4o-mini (Reasoning Speed)</text>
      
      <text x="25" y="94" font-size="13" font-weight="800" fill="#0F172A">Nhiệm vụ cốt lõi:</text>
      <text x="40" y="118" font-size="12" font-weight="600" fill="#334155">1. Tiếp nhận câu hỏi &amp; Lập kế hoạch thực thi dạng DAG (State Graph)</text>
      <text x="40" y="140" font-size="12" font-weight="600" fill="#334155">2. Nhận diện ý định (Intent): FAQ, Tra đơn, Báo giá, Hủy đơn, Khiếu nại</text>
      <text x="40" y="162" font-size="12" font-weight="600" fill="#334155">3. Phân bổ nhiệm vụ song song/tuần tự cho 3 Sub-Agents chuyên trách</text>
      <text x="40" y="184" font-size="12" font-weight="600" fill="#334155">4. Tổng hợp (Synthesis) kết quả cuối cùng phản hồi dạng SSE Token Stream</text>
    </g>

    <!-- Shared State & Context Memory -->
    <g transform="translate(930, 210)">
      <rect width="490" height="210" fill="#FFFFFF" stroke="#000000" stroke-width="2.0" rx="8"/>
      <rect width="490" height="36" fill="#F1F5F9" stroke="#000000" stroke-width="1.8" rx="8 8 0 0"/>
      <text x="245" y="24" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">SHARED STATE &amp; CONTEXT MEMORY (Tuple Trạng Thái)</text>
      
      <text x="25" y="65" font-size="13" font-weight="800" fill="#0F172A">Cấu trúc Trạng Thái LangGraph (State Definition):</text>
      <text x="40" y="90" class="mono" font-size="12" font-weight="700" fill="#047857">• messages: BaseMessage[] (Lịch sử hội thoại đầy đủ)</text>
      <text x="40" y="112" class="mono" font-size="12" font-weight="700" fill="#047857">• userContext: {{ userId, role, isGuest, shopTier }}</text>
      <text x="40" y="134" class="mono" font-size="12" font-weight="700" fill="#047857">• targetIntent: 'POLICY_QA' | 'TOOL_OP' | 'TRANSACTION'</text>
      <text x="40" y="156" class="mono" font-size="12" font-weight="700" fill="#047857">• actionDraft: {{ service, endpoint, payload, params }}</text>
      <text x="40" y="178" class="mono" font-size="12" font-weight="700" fill="#047857">• validationScore: {{ isValid, risks: [], requireHITL }}</text>
      <text x="40" y="200" class="mono" font-size="12" font-weight="700" fill="#047857">• executionResult: {{ statusCode, auditLogId, responseData }}</text>
    </g>

    <!-- Connect Supervisor <-> Shared State -->
    <line x1="900" y1="315" x2="930" y2="315" stroke="#000000" stroke-width="2.0"/>
    {draw_arrow(930, 315, "right", size=14)}
    {draw_arrow(900, 315, "left", size=14)}

    <!-- SUB-AGENTS LAYER -->
    <!-- 1. Knowledge Agent -->
    <g transform="translate(420, 480)">
      <rect width="320" height="340" fill="#FFFFFF" stroke="#000000" stroke-width="2.0" rx="8"/>
      <rect width="320" height="36" fill="#F1F5F9" stroke="#000000" stroke-width="1.8" rx="8 8 0 0"/>
      <text x="160" y="24" font-size="14" font-weight="900" fill="#000000" text-anchor="middle">KNOWLEDGE AGENT (RAG)</text>
      
      <text x="20" y="64" font-size="12" font-weight="800" fill="#0F172A">Mô hình gợi ý:</text>
      <text x="20" y="84" class="mono" font-size="12" font-weight="700" fill="#2563EB">Qwen 2.5 7B / MRL Embeddings</text>
      
      <text x="20" y="112" font-size="12" font-weight="800" fill="#0F172A">Phạm vi trách nhiệm:</text>
      <text x="20" y="134" font-size="11" font-weight="600" fill="#334155">• Tra cứu Luật Bưu chính (Điều 25)</text>
      <text x="20" y="154" font-size="11" font-weight="600" fill="#334155">• Biểu phí &amp; Phụ phí vượt nấc</text>
      <text x="20" y="174" font-size="11" font-weight="600" fill="#334155">• Quy chuẩn đóng gói hàng vỡ bubble</text>
      <text x="20" y="194" font-size="11" font-weight="600" fill="#334155">• Chính sách miễn hoàn trả Shop VIP</text>
      <text x="20" y="214" font-size="11" font-weight="600" fill="#334155">• Trích xuất nguồn (Citations 100%)</text>

      <rect x="20" y="240" width="280" height="80" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="6"/>
      <text x="160" y="262" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle">KẾT NỐI KHO TRI THỨC</text>
      <text x="35" y="284" font-size="11" font-weight="600" fill="#475569">• Cosine Similarity Vector Search</text>
      <text x="35" y="304" font-size="11" font-weight="600" fill="#475569">• Triệt tiêu ảo giác (Zero Hallucination)</text>
    </g>

    <!-- 2. Logistics Operation Agent -->
    <g transform="translate(760, 480)">
      <rect width="320" height="340" fill="#FFFFFF" stroke="#000000" stroke-width="2.0" rx="8"/>
      <rect width="320" height="36" fill="#F1F5F9" stroke="#000000" stroke-width="1.8" rx="8 8 0 0"/>
      <text x="160" y="24" font-size="14" font-weight="900" fill="#000000" text-anchor="middle">OPERATION AGENT (Tools)</text>
      
      <text x="20" y="64" font-size="12" font-weight="800" fill="#0F172A">Mô hình gợi ý:</text>
      <text x="20" y="84" class="mono" font-size="12" font-weight="700" fill="#2563EB">Cohere Command / Function Calling</text>
      
      <text x="20" y="112" font-size="12" font-weight="800" fill="#0F172A">Phạm vi trách nhiệm:</text>
      <text x="20" y="134" font-size="11" font-weight="600" fill="#334155">• Tra cứu vận đơn NX (GET :3008)</text>
      <text x="20" y="154" font-size="11" font-weight="600" fill="#334155">• Tính cước IATA (POST :3012)</text>
      <text x="20" y="174" font-size="11" font-weight="600" fill="#334155">• Soạn thảo lệnh Hủy đơn (Drafting)</text>
      <text x="20" y="194" font-size="11" font-weight="600" fill="#334155">• Soạn hồ sơ Khiếu nại (Claim Draft)</text>
      <text x="20" y="214" font-size="11" font-weight="600" fill="#334155">• Trích xuất thông tin người gửi/nhận</text>

      <rect x="20" y="240" width="280" height="80" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="6"/>
      <text x="160" y="262" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle">CHUẨN BỊ PAYLOAD CHÍNH XÁC</text>
      <text x="35" y="284" font-size="11" font-weight="600" fill="#475569">• Map đúng schema DTO backend</text>
      <text x="35" y="304" font-size="11" font-weight="600" fill="#475569">• Không tự ý bắn lệnh ghi dữ liệu</text>
    </g>

    <!-- 3. Validation Agent -->
    <g transform="translate(1100, 480)">
      <rect width="320" height="340" fill="#FFFFFF" stroke="#000000" stroke-width="2.0" rx="8"/>
      <rect width="320" height="36" fill="#F1F5F9" stroke="#000000" stroke-width="1.8" rx="8 8 0 0"/>
      <text x="160" y="24" font-size="14" font-weight="900" fill="#000000" text-anchor="middle">VALIDATION AGENT (Critic)</text>
      
      <text x="20" y="64" font-size="12" font-weight="800" fill="#0F172A">Mô hình gợi ý:</text>
      <text x="20" y="84" class="mono" font-size="12" font-weight="700" fill="#2563EB">Nemotron / Strict Rule Evaluator</text>
      
      <text x="20" y="112" font-size="12" font-weight="800" fill="#0F172A">Phạm vi trách nhiệm (Độc lập):</text>
      <text x="20" y="134" font-size="11" font-weight="600" fill="#334155">• Kiểm tra quyền (Authorization check)</text>
      <text x="20" y="154" font-size="11" font-weight="600" fill="#334155">• Đơn đã xuất kho có được hủy không?</text>
      <text x="20" y="174" font-size="11" font-weight="600" fill="#334155">• Hàng vỡ có đủ biên bản &lt;24h không?</text>
      <text x="20" y="194" font-size="11" font-weight="600" fill="#334155">• Đánh giá mức độ rủi ro (Risk Tier)</text>
      <text x="20" y="214" font-size="11" font-weight="600" fill="#334155">• Kích hoạt ngắt yêu cầu xác nhận HITL</text>

      <rect x="20" y="240" width="280" height="80" fill="#FEF2F2" stroke="#EF4444" stroke-width="1.5" rx="6"/>
      <text x="160" y="262" font-size="11" font-weight="800" fill="#DC2626" text-anchor="middle">CHỐT CHẶN AN TOÀN (GATEKEEPER)</text>
      <text x="35" y="284" font-size="11" font-weight="600" fill="#7F1D1D">• Từ chối lệnh nếu vi phạm chính sách</text>
      <text x="35" y="304" font-size="11" font-weight="600" fill="#7F1D1D">• Ngăn chặn 100% giao dịch trái phép</text>
    </g>

    <!-- Connect Supervisor down to Sub-Agents -->
    <!-- Down pipe from Supervisor -->
    <line x1="660" y1="420" x2="660" y2="450" stroke="#000000" stroke-width="2.0"/>
    <line x1="580" y1="450" x2="1260" y2="450" stroke="#000000" stroke-width="2.0"/>
    
    <line x1="580" y1="450" x2="580" y2="480" stroke="#000000" stroke-width="2.0"/>
    {draw_arrow(580, 480, "down", size=14)}
    
    <line x1="920" y1="450" x2="920" y2="480" stroke="#000000" stroke-width="2.0"/>
    {draw_arrow(920, 480, "down", size=14)}
    
    <line x1="1260" y1="450" x2="1260" y2="480" stroke="#000000" stroke-width="2.0"/>
    {draw_arrow(1260, 480, "down", size=14)}

    <!-- Collaboration arrow between Operation and Validation Agent -->
    <line x1="1080" y1="640" x2="1100" y2="640" stroke="#000000" stroke-width="2.0"/>
    {draw_arrow(1100, 640, "right", size=14)}
    {draw_arrow(1080, 640, "left", size=14)}

    <!-- BOTTOM SECTION: LANGGRAPH DECISION ROUTER & EXECUTION CONTROLLER -->
    <g transform="translate(420, 870)">
      <rect width="1000" height="360" fill="#FFFFFF" stroke="#000000" stroke-width="2.0" rx="8"/>
      <rect width="1000" height="36" fill="#F1F5F9" stroke="#000000" stroke-width="1.8" rx="8 8 0 0"/>
      <text x="500" y="24" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">LANGGRAPH CONDITIONAL WORKFLOW ROUTER &amp; EXECUTION CONTROLLER</text>

      <!-- Decision Step 1: Read-Only Query -->
      <g transform="translate(30, 60)">
        <rect width="280" height="110" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.8" rx="6"/>
        <text x="140" y="28" font-size="13" font-weight="900" fill="#15803D" text-anchor="middle">NHÁNH 1: TRUY VẤN READ-ONLY</text>
        <text x="15" y="55" font-size="12" font-weight="700" fill="#000000">• Tra cứu mã vận đơn NX-...</text>
        <text x="15" y="75" font-size="12" font-weight="700" fill="#000000">• Tra cứu biểu phí theo trọng lượng</text>
        <text x="15" y="95" font-size="11" font-weight="600" fill="#166534">-> Phản hồi trực tiếp không cần HITL</text>
      </g>

      <!-- Decision Step 2: Policy & FAQ -->
      <g transform="translate(350, 60)">
        <rect width="280" height="110" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.8" rx="6"/>
        <text x="140" y="28" font-size="13" font-weight="900" fill="#15803D" text-anchor="middle">NHÁNH 2: HỎI ĐÁP QUY CHẾ</text>
        <text x="15" y="55" font-size="12" font-weight="700" fill="#000000">• Quy định hàng vỡ &amp; đền bù 4x</text>
        <text x="15" y="75" font-size="12" font-weight="700" fill="#000000">• Trích xuất điều khoản và nguồn dẫn</text>
        <text x="15" y="95" font-size="11" font-weight="600" fill="#166534">-> Tổng hợp câu trả lời kèm Citations</text>
      </g>

      <!-- Decision Step 3: Transactional Action with HITL -->
      <g transform="translate(670, 60)">
        <rect width="300" height="110" fill="#FEF2F2" stroke="#DC2626" stroke-width="2.0" rx="6"/>
        <text x="150" y="28" font-size="13" font-weight="900" fill="#B91C1C" text-anchor="middle">NHÁNH 3: GIAO DỊCH THAY ĐỔI DỮ LIỆU</text>
        <text x="15" y="55" font-size="12" font-weight="700" fill="#000000">• Yêu cầu hủy đơn hàng</text>
        <text x="15" y="75" font-size="12" font-weight="700" fill="#000000">• Yêu cầu tạo phiếu khiếu nại bồi thường</text>
        <text x="15" y="95" font-size="11" font-weight="800" fill="#DC2626">-> KÍCH HOẠT NGẮT: INTERRUPT HITL</text>
      </g>

      <!-- Flow Execution sequence under router -->
      <g transform="translate(30, 200)">
        <rect width="940" height="130" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.5" rx="6"/>
        <text x="470" y="28" font-size="13" font-weight="900" fill="#0F172A" text-anchor="middle">CHU TRÌNH XỬ LÝ GIAO DỊCH AN TOÀN (TRANSACTION SAFETY LIFECYCLE)</text>
        
        <!-- Step pills -->
        <rect x="25" y="50" width="160" height="60" fill="#FFFFFF" stroke="#000000" stroke-width="1.5" rx="4"/>
        <text x="105" y="75" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">1. Soạn Draft</text>
        <text x="105" y="95" font-size="11" font-weight="600" fill="#475569" text-anchor="middle">Payload &amp; Params</text>

        {draw_arrow(200, 80, "right", size=14)}

        <rect x="215" y="50" width="160" height="60" fill="#FFFFFF" stroke="#000000" stroke-width="1.5" rx="4"/>
        <text x="295" y="75" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">2. Kiểm Tra Rủi Ro</text>
        <text x="295" y="95" font-size="11" font-weight="600" fill="#475569" text-anchor="middle">Validation Agent</text>

        {draw_arrow(390, 80, "right", size=14)}

        <rect x="405" y="50" width="160" height="60" fill="#EFF6FF" stroke="#2563EB" stroke-width="1.8" rx="4"/>
        <text x="485" y="75" font-size="12" font-weight="900" fill="#1E40AF" text-anchor="middle">3. Tạm Dừng Graph</text>
        <text x="485" y="95" font-size="11" font-weight="700" fill="#2563EB" text-anchor="middle">Chờ User bấm Duyệt</text>

        {draw_arrow(580, 80, "right", size=14)}

        <rect x="595" y="50" width="160" height="60" fill="#FFFFFF" stroke="#000000" stroke-width="1.5" rx="4"/>
        <text x="675" y="75" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">4. Gọi Backend API</text>
        <text x="675" y="95" font-size="11" font-weight="600" fill="#475569" text-anchor="middle">Thực thi giao dịch</text>

        {draw_arrow(770, 80, "right", size=14)}

        <rect x="785" y="50" width="130" height="60" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.8" rx="4"/>
        <text x="850" y="75" font-size="12" font-weight="900" fill="#15803D" text-anchor="middle">5. Audit Log</text>
        <text x="850" y="95" font-size="11" font-weight="700" fill="#166534" text-anchor="middle">Lưu vết DB</text>
      </g>
    </g>
  </g>

  <!-- =========================================================================
       COLUMN 3: BACKEND MICROSERVICES & STORAGE (x=1490, y=140, w=370, h=1130)
       ========================================================================= -->
  <g id="Col_Backend">
    <rect x="1490" y="140" width="370" height="1130" fill="#F8FAFC" stroke="#000000" stroke-width="2.0" rx="8"/>
    <rect x="1490" y="140" width="370" height="42" fill="#E2E8F0" stroke="#000000" stroke-width="2.0" rx="8 8 0 0"/>
    <text x="1675" y="167" font-size="16" font-weight="900" fill="#000000" text-anchor="middle">BACKEND LOGISTICS &amp; DATA TIER</text>

    <!-- Gateway BFF -->
    <g transform="translate(1510, 210)">
      <rect width="330" height="110" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" rx="6"/>
      <text x="165" y="28" font-size="14" font-weight="900" fill="#000000" text-anchor="middle">API Gateway BFF (:3000)</text>
      <text x="165" y="50" class="mono" font-size="12" font-weight="700" fill="#047857" text-anchor="middle">NestJS Reverse Proxy &amp; Auth Guard</text>
      <text x="20" y="76" font-size="11" font-weight="600" fill="#334155">• Xác thực JWT Bearer Token &amp; Roles</text>
      <text x="20" y="96" font-size="11" font-weight="600" fill="#334155">• Proxy SSE Token Stream về Client</text>
    </g>

    <!-- Core Services Box -->
    <g transform="translate(1510, 345)">
      <rect width="330" height="340" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" rx="6"/>
      <rect width="330" height="32" fill="#F1F5F9" stroke="#000000" stroke-width="1.5" rx="6 6 0 0"/>
      <text x="165" y="22" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">DỊCH VỤ NGHIỆP VỤ LÕI (CORE APIS)</text>

      <g transform="translate(15, 45)">
        <rect width="300" height="55" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2" rx="4"/>
        <text x="12" y="22" font-size="12" font-weight="800" fill="#000000">@NEXUS/shipments-service (:3002)</text>
        <text x="12" y="42" font-size="11" font-weight="600" fill="#475569">CRUD Vận đơn, Hủy đơn, Đổi địa chỉ</text>
      </g>

      <g transform="translate(15, 110)">
        <rect width="300" height="55" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2" rx="4"/>
        <text x="12" y="22" font-size="12" font-weight="800" fill="#000000">@NEXUS/tracking-service (:3008)</text>
        <text x="12" y="42" font-size="11" font-weight="600" fill="#475569">Hành trình vết quét, Scan Inbound/Outbound</text>
      </g>

      <g transform="translate(15, 175)">
        <rect width="300" height="55" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2" rx="4"/>
        <text x="12" y="22" font-size="12" font-weight="800" fill="#000000">@NEXUS/pricing-service (:3012)</text>
        <text x="12" y="42" font-size="11" font-weight="600" fill="#475569">Bảng cước ma trận, Cân IATA V/6000</text>
      </g>

      <g transform="translate(15, 240)">
        <rect width="300" height="80" fill="#FEF2F2" stroke="#EF4444" stroke-width="1.5" rx="4"/>
        <text x="12" y="22" font-size="12" font-weight="900" fill="#DC2626">Claims &amp; Compensation Module</text>
        <text x="12" y="42" font-size="11" font-weight="600" fill="#7F1D1D">Hồ sơ khiếu nại, chế tài bồi thường</text>
        <text x="12" y="62" font-size="11" font-weight="700" fill="#B91C1C">Thực thi khi có chữ ký phê duyệt HITL</text>
      </g>
    </g>

    <!-- Storage Tier (PostgreSQL + pgvector + Audit Log) -->
    <g transform="translate(1510, 710)">
      <rect width="330" height="520" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" rx="6"/>
      <rect width="330" height="32" fill="#F1F5F9" stroke="#000000" stroke-width="1.5" rx="6 6 0 0"/>
      <text x="165" y="22" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">KHO DỮ LIỆU &amp; VECTOR TRI THỨC</text>

      <!-- PostgreSQL Card -->
      <g transform="translate(15, 45)">
        <rect width="300" height="130" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2" rx="4"/>
        <text x="15" y="25" font-size="13" font-weight="900" fill="#0F172A">PostgreSQL + pgvector Extension</text>
        <text x="15" y="50" font-size="11" font-weight="600" fill="#334155">• Lưu trữ vector 1536 chiều (MRL 512)</text>
        <text x="15" y="70" font-size="11" font-weight="600" fill="#334155">• Chỉ mục HNSW tra cứu siêu tốc</text>
        <text x="15" y="90" font-size="11" font-weight="600" fill="#334155">• Toàn bộ SOP, biểu phí, Luật Bưu chính</text>
        <text x="15" y="110" font-size="11" font-weight="700" fill="#047857">• Đạt độ chính xác tương đồng ngữ nghĩa</text>
      </g>

      <!-- Audit Log DB Table Card -->
      <g transform="translate(15, 195)">
        <rect width="300" height="150" fill="#EFF6FF" stroke="#2563EB" stroke-width="1.5" rx="4"/>
        <text x="15" y="25" font-size="13" font-weight="900" fill="#1E40AF">Bảng AI Transaction Audit Log</text>
        <text x="15" y="50" class="mono" font-size="11" font-weight="700" fill="#0F172A">Table: ai_agent_audit_logs</text>
        <text x="15" y="72" font-size="11" font-weight="600" fill="#334155">• session_id &amp; trace_id</text>
        <text x="15" y="92" font-size="11" font-weight="600" fill="#334155">• agent_role (Supervisor/Validator)</text>
        <text x="15" y="112" font-size="11" font-weight="600" fill="#334155">• raw_user_prompt &amp; hitl_decision</text>
        <text x="15" y="132" font-size="11" font-weight="600" fill="#334155">• executed_payload &amp; ip_address</text>
      </g>

      <!-- Redis Cache Card -->
      <g transform="translate(15, 365)">
        <rect width="300" height="135" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2" rx="4"/>
        <text x="15" y="25" font-size="13" font-weight="900" fill="#0F172A">Redis Semantic Cache &amp; State</text>
        <text x="15" y="50" font-size="11" font-weight="600" fill="#334155">• Checkpoint lưu Shared State LangGraph</text>
        <text x="15" y="72" font-size="11" font-weight="600" fill="#334155">• Phục hồi luồng hội thoại khi khách F5</text>
        <text x="15" y="94" font-size="11" font-weight="600" fill="#334155">• Semantic Cache giảm 50% chi phí LLM</text>
        <text x="15" y="116" font-size="11" font-weight="700" fill="#047857">• Phản hồi truy vấn trùng lặp &lt; 20ms</text>
      </g>
    </g>
  </g>

  <!-- =========================================================================
       CONNECTORS BETWEEN COLUMNS (MANHATTAN ORTHOGONAL LINES)
       ========================================================================= -->
  <!-- 1. Client -> Gateway BFF -->
  <path d="M 340 280 L 360 280 L 360 185 L 1490 185 L 1490 240 L 1510 240" fill="none" stroke="#000000" stroke-width="2.0"/>
  {draw_arrow(1510, 240, "right", size=14)}

  <!-- 2. Gateway BFF -> Supervisor -->
  <path d="M 1510 280 L 900 280" fill="none" stroke="#000000" stroke-width="2.0"/>
  {draw_arrow(900, 280, "left", size=14)}

  <!-- 3. Operation Agent -> Backend Core APIs -->
  <path d="M 1080 680 L 1470 680 L 1470 450 L 1510 450" fill="none" stroke="#000000" stroke-width="2.0"/>
  {draw_arrow(1510, 450, "right", size=14)}

  <!-- 4. Execution Controller -> HITL on Client (Interrupt signal) -->
  <path d="M 670 950 L 340 950" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-dasharray="6,4"/>
  {draw_arrow(340, 950, "left", color="#DC2626", size=16)}

  <!-- 5. Client HITL Confirmation -> Execution Controller -->
  <path d="M 340 1020 L 595 1020" fill="none" stroke="#16A34A" stroke-width="2.5"/>
  {draw_arrow(595, 1020, "right", color="#16A34A", size=16)}

  <!-- 6. Execution Controller -> Audit Log & Backend execution -->
  <path d="M 915 1100 L 1470 1100 L 1470 780 L 1510 780" fill="none" stroke="#000000" stroke-width="2.0"/>
  {draw_arrow(1510, 780, "right", size=14)}

  <!-- Badges on major flows -->
  <g transform="translate(450, 935)">
    <rect x="-80" y="-14" width="160" height="28" rx="6" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.8"/>
    <text x="0" y="5" class="badge" fill="#DC2626" text-anchor="middle">[INTERRUPT_HITL]</text>
  </g>

  <g transform="translate(450, 1005)">
    <rect x="-85" y="-14" width="170" height="28" rx="6" fill="#FFFFFF" stroke="#16A34A" stroke-width="1.8"/>
    <text x="0" y="5" class="badge" fill="#16A34A" text-anchor="middle">[CONFIRM_APPROVED]</text>
  </g>

</svg>
''')

    svg_content = "\n".join(lines)
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated SVG: {OUTPUT_FILE}")

if __name__ == "__main__":
    build_svg()
