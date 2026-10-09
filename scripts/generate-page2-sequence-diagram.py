#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE PAGE 2 - VISUAL PARADIGM UML 2.5 SEQUENCE DIAGRAM (OPTIMIZED BALANCED CANVAS & BOLD FONTS)
===================================================================================================
Bản vẽ Kỹ thuật Tiêu chuẩn: Biểu đồ Tuần tự Hệ thống (UML 2.5 Sequence Diagram)
Tối ưu hóa toàn diện theo chuẩn Visual Paradigm Enterprise Edition:
1. Kích thước cân đối hoàn hảo: 3200 x 2100 px (Chuẩn tỉ lệ 1.52:1, tối ưu cho màn hình, slide và Figma).
2. Hệ thống cỡ chữ phóng to vượt bậc (+60% legibility):
   * Khung sd header: 24px - 26px
   * Actor: Stickman to rõ, nhãn «actor» 15px, tên 20px
   * Lifeline boxes: 270x86px, Stereotype 15px, Instance 20px, Subtitle 14.5px
   * Message labels: 18px - 18.5px (Code/payload: 16.5px - 17.5px)
   * Alt/Loop tags: 21px
   * Guard conditions: 19px - 20px bold
   * Visual Paradigm Notes: Title 17.5px, Body 15.5px
   * Footer legend: 17px - 18px
3. Bố trí vị trí thông minh (Zero Collision):
   * Mọi nhãn đều nằm gọn gàng trong nhịp 480-500px giữa 2 lifeline kế bên.
   * 3 Dog-eared Notes đặt hoàn toàn trong các khoang trống, tuyệt đối không chạm hay cắt ngang lifeline.
   * 100% Native Vector, zero <marker> tags.
"""

import os
import html
import xml.etree.ElementTree as ET

FONT_SANS = 'Inter, Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, sans-serif'
FONT_MONO = 'JetBrains Mono, ui-monospace, Menlo, Consolas, monospace'

def draw_arrow_solid(x, y, direct="right", size=15):
    """Draw solid filled arrowhead for synchronous calls."""
    if direct == "right":
        points = f"{x},{y} {x-size},{y-size*0.42:.1f} {x-size},{y+size*0.42:.1f}"
    elif direct == "left":
        points = f"{x},{y} {x+size},{y-size*0.42:.1f} {x+size},{y+size*0.42:.1f}"
    elif direct == "down":
        points = f"{x},{y} {x-size*0.42:.1f},{y-size} {x+size*0.42:.1f},{y-size}"
    return f'<polygon points="{points}" fill="#000000"/>'

def draw_arrow_open(x, y, direct="right", size=15):
    """Draw open V-shaped arrowhead for asynchronous / return messages."""
    if direct == "right":
        return f'<polyline points="{x-size},{y-size*0.48:.1f} {x},{y} {x-size},{y+size*0.48:.1f}" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
    elif direct == "left":
        return f'<polyline points="{x+size},{y-size*0.48:.1f} {x},{y} {x+size},{y+size*0.48:.1f}" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'

def draw_dogear_note(x, y, w, h, fold=18, bg="#FEF9C3", stroke="#854D0E", flap_color="#FDE047"):
    """Draw a classic Visual Paradigm dog-eared note (gấp góc trên bên phải)."""
    pts = f"{x},{y} {x+w-fold},{y} {x+w},{y+fold} {x+w},{y+h} {x},{y+h}"
    poly = f'<polygon points="{pts}" fill="{bg}" stroke="{stroke}" stroke-width="2.0"/>'
    flap = f'<polygon points="{x+w-fold},{y} {x+w-fold},{y+fold} {x+w},{y+fold}" fill="{flap_color}" stroke="{stroke}" stroke-width="1.8"/>'
    return f'<g id="note_{x}_{y}">{poly}{flap}</g>'

def generate_svg():
    width = 3200
    height = 2100

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="background:#FFFFFF;">')

    # STYLES DEFINITION
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append(f'      text {{ font-family: {FONT_SANS}; }}')
    lines.append(f'      .mono {{ font-family: {FONT_MONO}; }}')
    lines.append('      .bg { fill: #FFFFFF; }')
    lines.append('      .sd-frame { fill: #FFFFFF; stroke: #000000; stroke-width: 2.8; }')
    lines.append('      .sd-tab { fill: #FFFFFF; stroke: #000000; stroke-width: 2.4; }')
    lines.append('      .lifeline { stroke: #000000; stroke-width: 2.0; stroke-dasharray: 8 6; }')
    lines.append('      .activation { fill: #FFFFFF; stroke: #000000; stroke-width: 2.0; }')
    lines.append('      .activation-nested { fill: #F1F5F9; stroke: #000000; stroke-width: 1.8; }')
    lines.append('      .call-sync { stroke: #000000; stroke-width: 2.4; fill: none; }')
    lines.append('      .call-reply { stroke: #000000; stroke-width: 2.2; stroke-dasharray: 7 5; fill: none; }')
    lines.append('      .frag-box { fill: #FFFFFF; fill-opacity: 0.65; stroke: #000000; stroke-width: 2.0; }')
    lines.append('      .frag-tab { fill: #FFFFFF; stroke: #000000; stroke-width: 2.0; }')
    lines.append('      .frag-divider { stroke: #000000; stroke-width: 2.0; stroke-dasharray: 9 6; }')
    lines.append('      .note-line { stroke: #854D0E; stroke-width: 1.6; stroke-dasharray: 6 4; }')
    lines.append('    ]]></style>')
    lines.append('  </defs>')
    lines.append('')

    # CANVAS BACKGROUND
    lines.append(f'  <rect width="{width}" height="{height}" class="bg"/>')

    # =========================================================================
    # 1. VISUAL PARADIGM UML 2.5 INTERACTION FRAME (`sd`)
    # =========================================================================
    fx, fy, fw, fh = 45, 40, 3110, 2020
    tab_w, tab_h = 860, 52
    tab_cut = 18

    lines.append('  <!-- UML 2.5 Outer Interaction Frame (Visual Paradigm sd Frame) -->')
    lines.append(f'  <rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" class="sd-frame"/>')
    # Pentagonal Tab at top-left
    tab_pts = f"{fx},{fy} {fx+tab_w},{fy} {fx+tab_w+tab_cut},{fy+tab_cut} {fx+tab_w+tab_cut},{fy+tab_h} {fx},{fy+tab_h}"
    lines.append(f'  <polygon points="{tab_pts}" class="sd-tab"/>')
    lines.append(f'  <text x="{fx+20}" y="{fy+35}" font-size="25" font-weight="900" fill="#000000">sd</text>')
    lines.append(f'  <text x="{fx+65}" y="{fy+35}" font-size="20" font-weight="800" fill="#1E293B">ClaimInquiryAndAutomatedCompensationProcess [Xử Lý Bồi Thường &amp; RAG]</text>')

    # Academic Documentation Strip on Right side of header
    lines.append(f'  <text x="{fx+fw-25}" y="{fy+35}" class="mono" font-size="15.5" font-weight="700" fill="#4B5563" text-anchor="end">HỆ THỐNG NEXUS LOGISTICS • OMG UML 2.5 INTERACTION DIAGRAM • VISUAL PARADIGM STANDARD</text>')

    # =========================================================================
    # 2. SEVEN LIFELINES (BALANCED FOR 3200px WIDTH)
    # =========================================================================
    lifelines = [
        {
            "id": "p1", "x": 200, "type": "actor",
            "name": "Chủ hàng", "uml_id": "chuhang : Merchant", "sub": "Khách hàng / Client"
        },
        {
            "id": "p2", "x": 680, "type": "classifier",
            "stereo": "«boundary»", "uml_id": "frontend : MerchantWebUI", "sub": "@nexus/merchant-web :5173"
        },
        {
            "id": "p3", "x": 1160, "type": "classifier",
            "stereo": "«boundary»", "uml_id": "gateway : APIGateway", "sub": "@nexus/api-gateway :3000 BFF"
        },
        {
            "id": "p4", "x": 1660, "type": "classifier",
            "stereo": "«control»", "uml_id": "chatbot : ChatbotService", "sub": "@nexus/chatbot-service :3013"
        },
        {
            "id": "p5", "x": 2160, "type": "classifier",
            "stereo": "«entity»", "uml_id": "orderSvc : OrderService", "sub": "@nexus/order-service :3002 Core"
        },
        {
            "id": "p6", "x": 2660, "type": "classifier",
            "stereo": "«datastore»", "uml_id": "vectorDB : InMemoryStore", "sub": "Heap RAM (MRL 512-D)"
        },
        {
            "id": "p7", "x": 3100, "type": "classifier",
            "stereo": "«external»", "uml_id": "llmCloud : GeminiFlashLLM", "sub": "Google AI Studio API / Groq"
        }
    ]

    y_line_end = 1910

    for p in lifelines:
        px = p["x"]
        if p["type"] == "actor":
            lines.append(f'  <!-- Actor Stickman: {p["name"]} -->')
            # Head (Radius 18)
            lines.append(f'  <circle cx="{px}" cy="115" r="18" fill="#FFFFFF" stroke="#000000" stroke-width="2.4"/>')
            # Torso
            lines.append(f'  <line x1="{px}" y1="133" x2="{px}" y2="182" stroke="#000000" stroke-width="2.4"/>')
            # Arms
            lines.append(f'  <line x1="{px-28}" y1="149" x2="{px+28}" y2="149" stroke="#000000" stroke-width="2.4"/>')
            # Legs
            lines.append(f'  <polyline points="{px-24},218 {px},182 {px+24},218" fill="none" stroke="#000000" stroke-width="2.4"/>')
            # Labels
            lines.append(f'  <text x="{px}" y="238" class="mono" font-size="15" font-weight="700" fill="#4B5563" text-anchor="middle">«actor»</text>')
            lines.append(f'  <text x="{px}" y="260" font-size="20" font-weight="900" fill="#000000" text-anchor="middle">{p["uml_id"]}</text>')
            lines.append(f'  <line x1="{px-90}" y1="264" x2="{px+90}" y2="264" stroke="#000000" stroke-width="1.4"/>')
            lines.append(f'  <text x="{px}" y="282" font-size="15" font-weight="600" fill="#2563EB" text-anchor="middle">{p["sub"]}</text>')
            lines.append(f'  <line x1="{px}" y1="293" x2="{px}" y2="{y_line_end}" class="lifeline"/>')
        else:
            bw, bh = 270, 86
            bx = px - bw / 2
            by = 185
            lines.append(f'  <!-- Classifier Lifeline: {p["uml_id"]} -->')
            lines.append(f'  <rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="#FFFFFF" stroke="#000000" stroke-width="2.2" rx="4"/>')
            lines.append(f'  <text x="{px}" y="{by+25}" class="mono" font-size="15" font-weight="700" fill="#4B5563" text-anchor="middle">{p["stereo"]}</text>')
            lines.append(f'  <text x="{px}" y="{by+51}" font-size="19.5" font-weight="900" fill="#000000" text-anchor="middle">{p["uml_id"]}</text>')
            ulen = len(p["uml_id"]) * 6.0
            lines.append(f'  <line x1="{px-ulen}" y1="{by+55}" x2="{px+ulen}" y2="{by+55}" stroke="#000000" stroke-width="1.4"/>')
            lines.append(f'  <text x="{px}" y="{by+74}" class="mono" font-size="14" font-weight="700" fill="#2563EB" text-anchor="middle">{p["sub"]}</text>')
            lines.append(f'  <line x1="{px}" y1="{by+bh}" x2="{px}" y2="{y_line_end}" class="lifeline"/>')

        # Clean bottom stop bar
        lines.append(f'  <line x1="{px-16}" y1="{y_line_end}" x2="{px+16}" y2="{y_line_end}" stroke="#000000" stroke-width="2.4"/>')

    # =========================================================================
    # 3. ACTIVATION BARS (WIDTH: 18px, NESTED: 14px)
    # =========================================================================
    def act(cx, y, h):
        return f'<rect x="{cx-9}" y="{y}" width="18" height="{h}" class="activation"/>'

    def act_nested(cx, y, h):
        return f'<rect x="{cx+2}" y="{y}" width="14" height="{h}" class="activation-nested"/>'

    lines.append('  <!-- ==================== ACTIVATION BARS ==================== -->')
    # p1 (Merchant): distinct interactions
    lines.append(f'  {act(200, 325, 30)}')
    lines.append(f'  {act(200, 1260, 25)}')
    lines.append(f'  {act(200, 1505, 25)}')
    lines.append(f'  {act(200, 1770, 30)}')

    # p2 (Frontend): primary UI lifecycle
    lines.append(f'  {act(680, 330, 1220)}')
    lines.append(f'  {act(680, 1775, 110)}')
    # p2 nested activation on navigation
    lines.append(f'  {act_nested(680, 1835, 42)}')

    # p3 (Gateway): handles chat stream forwarding and SSE
    lines.append(f'  {act(1160, 385, 1120)}')
    # p3 nested activation for JWT check
    lines.append(f'  {act_nested(1160, 435, 38)}')

    # p4 (Chatbot): primary orchestration
    lines.append(f'  {act(1660, 500, 1210)}')
    # p4 nested activation for intent extraction
    lines.append(f'  {act_nested(1660, 555, 42)}')

    # p5 (Order Service): tracking query & escalation
    lines.append(f'  {act(2160, 635, 75)}')
    lines.append(f'  {act(2160, 1610, 75)}')

    # p6 (Vector Store): similarity search
    lines.append(f'  {act(2660, 920, 75)}')

    # p7 (LLM Engine): stream generation
    lines.append(f'  {act(3100, 1045, 125)}')

    # =========================================================================
    # 4. MESSAGES (SYNCHRONOUS CALLS, REPLIES, AND SELF-CALLS)
    # =========================================================================
    lines.append('  <!-- ==================== MESSAGES & INTERACTIONS ==================== -->')

    def msg_sync(x1, x2, y, label, sub_info=None):
        out = []
        out.append(f'  <line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" class="call-sync"/>')
        direct = "right" if x2 > x1 else "left"
        out.append(f'  {draw_arrow_solid(x2, y, direct)}')
        tx = min(x1, x2) + 15
        if sub_info:
            out.append(f'  <text x="{tx}" y="{y-10}" font-size="18.5" font-weight="900" fill="#000000">{html.escape(label)} <tspan class="mono" font-size="16.5" font-weight="700" fill="#2563EB">{html.escape(sub_info)}</tspan></text>')
        else:
            out.append(f'  <text x="{tx}" y="{y-10}" font-size="18.5" font-weight="900" fill="#000000">{html.escape(label)}</text>')
        return "\n".join(out)

    def msg_reply(x1, x2, y, label, success=False):
        out = []
        out.append(f'  <line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" class="call-reply"/>')
        direct = "right" if x2 > x1 else "left"
        out.append(f'  {draw_arrow_open(x2, y, direct)}')
        tx = min(x1, x2) + 15
        fill_color = "#059669" if success else "#374151"
        out.append(f'  <text x="{tx}" y="{y-10}" class="mono" font-size="16.5" font-weight="800" fill="{fill_color}">{html.escape(label)}</text>')
        return "\n".join(out)

    def msg_self(cx, y1, y2, label, sub_label=None):
        out = []
        loop_w = 40
        path = f"M {cx+9} {y1} L {cx+loop_w} {y1} L {cx+loop_w} {y2} L {cx+16} {y2}"
        out.append(f'  <path d="{path}" fill="none" stroke="#000000" stroke-width="2.2"/>')
        out.append(f'  {draw_arrow_solid(cx+16, y2, "left")}')
        out.append(f'  <text x="{cx+loop_w+14}" y="{y1+14}" font-size="18" font-weight="900" fill="#000000">{html.escape(label)}</text>')
        if sub_label:
            out.append(f'  <text x="{cx+loop_w+14}" y="{y1+34}" class="mono" font-size="15.5" font-weight="800" fill="#B45309">{html.escape(sub_label)}</text>')
        return "\n".join(out)

    # 1. User -> Frontend (concise to fit within 480px)
    lines.append(msg_sync(200, 671, 335, '1: submitQuery(message: "NEX-88291 bể vỡ")'))

    # 2. Frontend -> Gateway
    lines.append(msg_sync(689, 1151, 390, '2: POST /api/v1/chat/stream { awb, token }'))

    # 3. Gateway Self Check (Nested Activation)
    lines.append(msg_self(1160, 435, 465, '3: verifyJwtToken() : boolean', 'checkRateLimit(100 req/min)'))

    # 4. Gateway -> Chatbot
    lines.append(msg_sync(1169, 1651, 515, '4: routeChatRequest(merchantId, prompt)'))

    # 5. Chatbot Self Intent & AWB parse (Nested Activation)
    lines.append(msg_self(1660, 555, 590, '5: parseIntentAndRegex(prompt)', 'Intent: CLAIM_DAMAGE | AWB: NEX-88291'))

    # 6. Chatbot -> Order Service
    lines.append(msg_sync(1669, 2151, 645, '6: getOrderTrackingAndClaimContext("NEX-88291")'))

    # 7. Order Service -> Chatbot (Reply)
    lines.append(msg_reply(2151, 1669, 705, '7: return { hasBBBT: true (18h), declaredValue: 1.5M, insured: true }', success=True))

    # =========================================================================
    # 5. COMBINED FRAGMENT: `alt` (MA TRẬN QUYẾT ĐỊNH - DECISION MATRIX)
    # =========================================================================
    alt_x, alt_y, alt_w, alt_h = 610, 755, 2520, 970
    lines.append('\n  <!-- ==================== COMBINED FRAGMENT: alt (DECISION MATRIX) ==================== -->')
    lines.append(f'  <rect x="{alt_x}" y="{alt_y}" width="{alt_w}" height="{alt_h}" class="frag-box"/>')
    # Pentagonal tab for 'alt'
    alt_tab_pts = f"{alt_x},{alt_y} {alt_x+90},{alt_y} {alt_x+105},{alt_y+15} {alt_x+105},{alt_y+38} {alt_x},{alt_y+38}"
    lines.append(f'  <polygon points="{alt_tab_pts}" class="frag-tab"/>')
    lines.append(f'  <text x="{alt_x+18}" y="{alt_y+27}" font-size="22" font-weight="900" fill="#000000">alt</text>')

    # OPERAND 1: AUTOMATED COMPENSATION (DUYỆT TỰ ĐỘNG)
    lines.append(f'  <text x="{alt_x+125}" y="{alt_y+28}" class="mono" font-size="19" font-weight="900" fill="#000000">[hasBBBT == true &amp;&amp; elapsedHours &lt;= 24 &amp;&amp; declaredValue &lt;= 2000000]</text>')
    lines.append(f'  <text x="{alt_x+125}" y="{alt_y+53}" font-size="17" font-weight="800" fill="#059669">// Ma trận: Có Biên bản bất thường ≤ 24h &amp; Khai giá ≤ 2.000.000 VNĐ ➔ Duyệt tự động cấp tốc</text>')

    # 8. Chatbot -> Vector Store (At Y=925)
    lines.append(msg_sync(1669, 2651, 925, '8: similaritySearch(query: "quy chế bồi thường hàng vỡ", topK=3, threshold=0.7)'))

    # 9. Vector Store -> Chatbot
    lines.append(msg_reply(2651, 1669, 985, '9: return { doc: "Điều 4.2: Bồi thường 100% giá trị khai giá", score: 0.89 }', success=True))

    # 10. Chatbot -> LLM Cloud
    lines.append(msg_sync(1669, 3091, 1055, '10: streamGenerateContent(prompt, contextDocs, model="gemini-1.5-flash")'))

    # -------------------------------------------------------------------------
    # SUB-FRAGMENT: `loop` (SERVER-SENT EVENTS STREAMING)
    # -------------------------------------------------------------------------
    loop_x, loop_y, loop_w, loop_h = 630, 1105, 2480, 245
    lines.append('\n  <!-- SUB-FRAGMENT: loop (SSE TOKEN STREAMING) -->')
    lines.append(f'  <rect x="{loop_x}" y="{loop_y}" width="{loop_w}" height="{loop_h}" class="frag-box"/>')
    loop_tab_pts = f"{loop_x},{loop_y} {loop_x+100},{loop_y} {loop_x+115},{loop_y+15} {loop_x+115},{loop_y+36} {loop_x},{loop_y+36}"
    lines.append(f'  <polygon points="{loop_tab_pts}" class="frag-tab"/>')
    lines.append(f'  <text x="{loop_x+18}" y="{loop_y+26}" font-size="21" font-weight="900" fill="#000000">loop</text>')
    lines.append(f'  <text x="{loop_x+135}" y="{loop_y+26}" class="mono" font-size="18" font-weight="900" fill="#000000">[for each token chunk in LLM streaming response]</text>')

    # 11. LLM -> Chatbot
    lines.append(msg_reply(3091, 1669, 1150, '11: yield tokenChunk { text: "Theo Điều 4.2 Quy chế Bưu chính, đơn hàng NEX-88291..." }', success=True))

    # 12. Chatbot -> Gateway (SSE Event)
    lines.append(msg_reply(1651, 1169, 1195, '12: sse.write("event: token", tokenChunk)', success=True))

    # 13. Gateway -> Frontend
    lines.append(msg_reply(1151, 689, 1240, '13: onMessage(chunkEvent) // SSE Stream transfer', success=True))

    # 14. Frontend -> Merchant
    lines.append(msg_reply(671, 200, 1285, '14: renderTypingEffect(tokenChunk) // Hiệu ứng gõ chữ', success=True))

    # 15. Action Card Dispatch (Chatbot -> Gateway)
    lines.append(msg_reply(1651, 1169, 1395, '15: emitActionCard({ type: "CLAIM_CREATE", awb: "NEX-88291", max: 1.5M })', success=True))

    # 16. Gateway -> Frontend
    lines.append(msg_reply(1151, 689, 1450, '16: dispatchEvent("ACTION_CARD", cardPayload)', success=True))

    # 17. Frontend -> Merchant (Action Buttons Render)
    lines.append(msg_reply(671, 200, 1505, '17: renderInteractiveButtons([TẠO BỒI THƯỜNG], [TRA CỨU BBBT])', success=True))

    # -------------------------------------------------------------------------
    # OPERAND 2: ARBITRATION DISPUTE (CHUYỂN TRỌNG TÀI HITL)
    # -------------------------------------------------------------------------
    div_y = 1565
    lines.append(f'\n  <!-- Fragment Divider (alt else branch) -->')
    lines.append(f'  <line x1="{alt_x}" y1="{div_y}" x2="{alt_x+alt_w}" y2="{div_y}" class="frag-divider"/>')
    lines.append(f'  <text x="{alt_x+25}" y="{div_y+28}" class="mono" font-size="19" font-weight="900" fill="#B91C1C">[else: elapsedHours &gt; 24 || declaredValue &gt; 2000000]</text>')
    lines.append(f'  <text x="{alt_x+25}" y="{div_y+53}" font-size="17" font-weight="800" fill="#B91C1C">// Ma trận: Quá hạn 24h hoặc Giá trị &gt; 2.000.000 VNĐ ➔ Chuyển Trọng tài / Thẩm định viên bưu cục (Human-in-the-loop)</text>')

    # 18. Chatbot -> Order Service (Escalate)
    lines.append(msg_sync(1669, 2151, 1615, '18: POST /api/v1/claims/dispute-escalate(awb, reason)'))

    # 19. Order Service -> Chatbot
    lines.append(msg_reply(2151, 1669, 1665, '19: return { status: "PENDING_ARBITRATION", officer: "Inspector-04" }'))

    # 20. Chatbot -> Frontend (Arbitration notice)
    lines.append(msg_reply(1651, 689, 1715, '20: notifyArbitrationHandover("Đã chuyển hồ sơ sang bộ phận Thẩm định viên bưu cục")'))

    # =========================================================================
    # 6. USER ACTION & END-TO-END FLOW (ACTION CARD CLICK & CONTEXT PRE-FILL)
    # =========================================================================
    # 21. Merchant clicks [TẠO BỒI THƯỜNG]
    lines.append(msg_sync(200, 671, 1780, '21: onClickButton("[TẠO BỒI THƯỜNG]")'))

    # 22. Frontend self navigation and pre-fill (Nested Activation)
    lines.append(msg_self(680, 1825, 1865, '22: navigateTo("/merchant/claims/create")', 'Điền sẵn: Mã NEX-88291 | Số tiền 1.5M | BBBT 24h'))

    # =========================================================================
    # 7. VISUAL PARADIGM DOG-EARED NOTES (PLACED IN WIDE OPEN SPACES)
    # =========================================================================
    lines.append('\n  <!-- ==================== VISUAL PARADIGM DOG-EARED NOTES ==================== -->')

    # NOTE 1: DECISION MATRIX RULE (Sits between X5=2160 and X6=2660, completely clear)
    n1_x, n1_y, n1_w, n1_h = 2210, 780, 420, 105
    lines.append(f'  {draw_dogear_note(n1_x, n1_y, n1_w, n1_h, fold=18, bg="#FEF9C3", stroke="#854D0E", flap_color="#FDE047")}')
    lines.append(f'  <text x="{n1_x+18}" y="{n1_y+26}" font-size="17.5" font-weight="900" fill="#854D0E">«Note: Ma Trận Bồi Thường Nhanh»</text>')
    lines.append(f'  <text x="{n1_x+18}" y="{n1_y+50}" font-size="15.5" font-weight="700" fill="#1F2937">Căn cứ Điều 4.2: Đơn có BBBT trong vòng 24h,</text>')
    lines.append(f'  <text x="{n1_x+18}" y="{n1_y+72}" font-size="15.5" font-weight="700" fill="#1F2937">khai giá ≤ 2.000.000 VNĐ ➔ Duyệt tự động.</text>')
    lines.append(f'  <text x="{n1_x+18}" y="{n1_y+94}" font-size="15.5" font-weight="800" fill="#047857">AI tự phát sinh Action Card điền sẵn.</text>')
    # Anchor line from Note 1 to guard condition
    lines.append(f'  <circle cx="1850" cy="770" r="4.5" fill="#854D0E"/>')
    lines.append(f'  <line x1="{n1_x}" y1="{n1_y+40}" x2="1850" y2="770" class="note-line"/>')

    # NOTE 2: SSE STREAMING (Sits between X5=2160 and X6=2660 inside loop, completely clear)
    n2_x, n2_y, n2_w, n2_h = 2210, 1205, 420, 100
    lines.append(f'  {draw_dogear_note(n2_x, n2_y, n2_w, n2_h, fold=18, bg="#F0FDF4", stroke="#166534", flap_color="#BBF7D0")}')
    lines.append(f'  <text x="{n2_x+18}" y="{n2_y+26}" font-size="17.5" font-weight="900" fill="#166534">«Note: Cơ Chế HTTP SSE Streaming»</text>')
    lines.append(f'  <text x="{n2_x+18}" y="{n2_y+50}" font-size="15.5" font-weight="700" fill="#1F2937">Truyền tải từng token qua kết nối Keep-Alive</text>')
    lines.append(f'  <text x="{n2_x+18}" y="{n2_y+72}" font-size="15.5" font-weight="700" fill="#1F2937">độ trễ &lt; 50ms, frontend tạo hiệu ứng typing.</text>')
    lines.append(f'  <text x="{n2_x+18}" y="{n2_y+92}" font-size="15.5" font-weight="800" fill="#15803D">Trải nghiệm tương tác mượt mà.</text>')
    lines.append(f'  <circle cx="1660" cy="1195" r="4.5" fill="#166534"/>')
    lines.append(f'  <line x1="{n2_x}" y1="{n2_y+40}" x2="1660" y2="1195" class="note-line" stroke="#166534"/>')

    # NOTE 3: CLOSED-LOOP UX (Sits between X3=1160 and X4=1660, completely open space)
    n3_x, n3_y, n3_w, n3_h = 1200, 1780, 420, 105
    lines.append(f'  {draw_dogear_note(n3_x, n3_y, n3_w, n3_h, fold=18, bg="#EFF6FF", stroke="#1E40AF", flap_color="#BFDBFE")}')
    lines.append(f'  <text x="{n3_x+18}" y="{n3_y+26}" font-size="17" font-weight="900" fill="#1E40AF">«Note: Khép Kín Hành Động (UX)»</text>')
    lines.append(f'  <text x="{n3_x+18}" y="{n3_y+50}" font-size="15" font-weight="700" fill="#1F2937">Thay vì text tĩnh, AI phát sinh card bấm được.</text>')
    lines.append(f'  <text x="{n3_x+18}" y="{n3_y+72}" font-size="15" font-weight="700" fill="#1F2937">Click [TẠO BỒI THƯỜNG] chuyển sang form</text>')
    lines.append(f'  <text x="{n3_x+18}" y="{n3_y+94}" font-size="15" font-weight="700" fill="#1F2937">khiếu nại đã điền sẵn 100% ngữ cảnh.</text>')
    lines.append(f'  <circle cx="725" cy="1845" r="4.5" fill="#1E40AF"/>')
    lines.append(f'  <line x1="{n3_x}" y1="{n3_y+45}" x2="725" y2="1845" class="note-line" stroke="#1E40AF"/>')

    # =========================================================================
    # 8. VISUAL PARADIGM NOTATION LEGEND (FOOTER STRIP)
    # =========================================================================
    lines.append('\n  <!-- ==================== VISUAL PARADIGM NOTATION LEGEND ==================== -->')
    leg_x, leg_y, leg_w, leg_h = fx + 25, fy + fh - 85, fw - 50, 70
    lines.append(f'  <rect x="{leg_x}" y="{leg_y}" width="{leg_w}" height="{leg_h}" fill="#F8FAFC" stroke="#000000" stroke-width="2.0" rx="4"/>')
    lines.append(f'  <text x="{leg_x+25}" y="{leg_y+27}" class="mono" font-size="15.5" font-weight="900" fill="#000000">QUY CHUẨN VISUAL PARADIGM UML 2.5:</text>')

    # Item 1: Sync call
    lines.append(f'  <g transform="translate({leg_x+25}, {leg_y+38})">')
    lines.append(f'    <line x1="0" y1="12" x2="45" y2="12" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    {draw_arrow_solid(45, 12, "right", size=12)}')
    lines.append(f'    <text x="58" y="17" font-size="15" font-weight="800" fill="#334155">Synchronous Call (Gọi đồng bộ)</text>')
    lines.append(f'  </g>')

    # Item 2: Reply call
    lines.append(f'  <g transform="translate({leg_x+410}, {leg_y+38})">')
    lines.append(f'    <line x1="0" y1="12" x2="45" y2="12" stroke="#000000" stroke-width="2.2" stroke-dasharray="6 4"/>')
    lines.append(f'    {draw_arrow_open(45, 12, "right", size=12)}')
    lines.append(f'    <text x="58" y="17" font-size="15" font-weight="800" fill="#334155">Reply Message (Phản hồi kết quả)</text>')
    lines.append(f'  </g>')

    # Item 3: Self call + Nested
    lines.append(f'  <g transform="translate({leg_x+820}, {leg_y+38})">')
    lines.append(f'    <rect x="0" y="0" width="14" height="24" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>')
    lines.append(f'    <rect x="9" y="4" width="12" height="16" fill="#F1F5F9" stroke="#000000" stroke-width="1.6"/>')
    lines.append(f'    <text x="32" y="17" font-size="15" font-weight="800" fill="#334155">Nested Activation (Gọi nội bộ lồng nấc)</text>')
    lines.append(f'  </g>')

    # Item 4: Fragments alt/loop
    lines.append(f'  <g transform="translate({leg_x+1300}, {leg_y+38})">')
    lines.append(f'    <rect x="0" y="0" width="36" height="24" fill="#FFFFFF" stroke="#000000" stroke-width="1.6"/>')
    lines.append(f'    <text x="18" y="17" font-size="13.5" font-weight="900" fill="#000000" text-anchor="middle">alt</text>')
    lines.append(f'    <text x="48" y="17" font-size="15" font-weight="800" fill="#334155">Combined Fragment (Khối rẽ nhánh / Vòng lặp)</text>')
    lines.append(f'  </g>')

    # Item 5: Dog-eared note
    lines.append(f'  <g transform="translate({leg_x+1840}, {leg_y+38})">')
    lines.append(f'    <polygon points="0,0 22,0 28,6 28,24 0,24" fill="#FEF9C3" stroke="#854D0E" stroke-width="1.6"/>')
    lines.append(f'    <text x="38" y="17" font-size="15" font-weight="800" fill="#334155">UML Note (Ghi chú gấp góc giải thích nghiệp vụ)</text>')
    lines.append(f'  </g>')

    # Right badge
    lines.append(f'  <text x="{leg_x+leg_w-25}" y="{leg_y+44}" class="mono" font-size="14.5" font-weight="800" fill="#64748B" text-anchor="end">100% NATIVE SVG VECTOR • ZERO MARKER TAGS • COMPATIBLE FIGMA &amp; THESIS A4/A3</text>')

    lines.append('</svg>')

    return "\n".join(lines)

def main():
    target_path = os.path.join(
        os.path.dirname(__file__),
        "../docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/02-sequence-and-decision-matrix.svg"
    )
    target_path = os.path.abspath(target_path)

    print(f"Generating optimized Visual Paradigm style UML 2.5 Sequence Diagram to:\n  {target_path}")
    svg_content = generate_svg()

    # XML Validation
    try:
        ET.fromstring(svg_content)
        print(">> XML Validation Passed: Well-formed SVG.")
    except ET.ParseError as e:
        print(f">> XML Validation FAILED: {e}")
        return

    target_paths = [
        target_path,
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../docs/graduation-thesis/diagrams/sequence/01-sequence-claim-resolution-and-rag.svg"))
    ]

    for p in target_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f">> Successfully generated ({os.path.getsize(p)} bytes) at:\n   {p}")

if __name__ == "__main__":
    main()
