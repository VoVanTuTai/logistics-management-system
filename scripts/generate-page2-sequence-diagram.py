#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
100% AUTHENTIC VISUAL PARADIGM UML 2.5 SEQUENCE DIAGRAM
Matches Visual Paradigm UI & headless export pixel-for-pixel:
- Flat #7ACFF5 fill on lifelines & actors
- Sharp black #000000 borders (1.2px - 1.5px), zero border-radius
- Pure white #FFFFFF activation bars with black #000000 borders
- All lines, arrows, dashed lines, and texts in black #000000
- Classic VP sticky note (#FFF2CC / #FFE599) with black border and black text
- Pure Segoe UI / Arial font family
- Zero gradients, zero drop-shadows, zero colorful web-app styling
"""

import os
import html
import xml.etree.ElementTree as ET

FONT_VP = '"Segoe UI", Arial, Helvetica, sans-serif'
FONT_MONO = '"Segoe UI Mono", "Courier New", monospace'

def draw_arrow_solid(x, y, direct="right", size=13):
    if direct == "right":
        points = f"{x},{y} {x-size},{y-size*0.4:.1f} {x-size},{y+size*0.4:.1f}"
    elif direct == "left":
        points = f"{x},{y} {x+size},{y-size*0.4:.1f} {x+size},{y+size*0.4:.1f}"
    elif direct == "down":
        points = f"{x},{y} {x-size*0.4:.1f},{y-size} {x+size*0.4:.1f},{y-size}"
    return f'<polygon points="{points}" fill="#000000" stroke="#000000" stroke-width="1.0"/>'

def draw_arrow_open(x, y, direct="right", size=13):
    if direct == "right":
        return f'<polyline points="{x-size},{y-size*0.45:.1f} {x},{y} {x-size},{y+size*0.45:.1f}" fill="none" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
    elif direct == "left":
        return f'<polyline points="{x+size},{y-size*0.45:.1f} {x},{y} {x+size},{y+size*0.45:.1f}" fill="none" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'

def draw_dogear_note(x, y, w, h, fold=16, bg="#FFF2CC", stroke="#000000", flap_color="#FFE599"):
    pts = f"{x},{y} {x+w-fold},{y} {x+w},{y+fold} {x+w},{y+h} {x},{y+h}"
    poly = f'<polygon points="{pts}" fill="{bg}" stroke="{stroke}" stroke-width="1.2"/>'
    flap = f'<polygon points="{x+w-fold},{y} {x+w-fold},{y+fold} {x+w},{y+fold}" fill="{flap_color}" stroke="{stroke}" stroke-width="1.0"/>'
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
    lines.append(f'      text {{ font-family: {FONT_VP}; fill: #000000; }}')
    lines.append(f'      .mono {{ font-family: {FONT_MONO}; fill: #000000; }}')
    lines.append('      .sd-frame { fill: none; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .sd-tab { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; }')
    lines.append('      .lifeline { stroke: #000000; stroke-width: 1.2; stroke-dasharray: 6 4; }')
    lines.append('      .activation { fill: #FFFFFF; stroke: #000000; stroke-width: 1.2; }')
    lines.append('      .call-sync { stroke: #000000; stroke-width: 1.3; fill: none; }')
    lines.append('      .call-reply { stroke: #000000; stroke-width: 1.2; stroke-dasharray: 6 4; fill: none; }')
    lines.append('      .frag-box { fill: #FFFFFF; fill-opacity: 0.4; stroke: #000000; stroke-width: 1.2; }')
    lines.append('      .frag-tab { fill: #FFFFFF; stroke: #000000; stroke-width: 1.2; }')
    lines.append('      .frag-divider { stroke: #000000; stroke-width: 1.2; stroke-dasharray: 6 4; }')
    lines.append('      .note-line { stroke: #000000; stroke-width: 1.2; stroke-dasharray: 4 3; }')
    lines.append('    ]]></style>')
    lines.append('  </defs>')
    lines.append('')

    # CANVAS BACKGROUND
    lines.append(f'  <rect width="{width}" height="{height}" fill="#FFFFFF"/>')

    # =========================================================================
    # 1. VISUAL PARADIGM UML 2.5 INTERACTION FRAME (`sd`)
    # =========================================================================
    fx, fy, fw, fh = 45, 40, 3110, 2020
    tab_w, tab_h = 860, 52
    tab_cut = 18

    lines.append('  <!-- UML 2.5 Outer Interaction Frame (Visual Paradigm sd Frame) -->')
    lines.append(f'  <rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" class="sd-frame"/>')
    tab_pts = f"{fx},{fy} {fx+tab_w},{fy} {fx+tab_w+tab_cut},{fy+tab_cut} {fx+tab_w+tab_cut},{fy+tab_h} {fx},{fy+tab_h}"
    lines.append(f'  <polygon points="{tab_pts}" class="sd-tab"/>')
    lines.append(f'  <text x="{fx+20}" y="{fy+35}" font-size="24" font-weight="bold">sd</text>')
    lines.append(f'  <text x="{fx+65}" y="{fy+35}" font-size="20" font-weight="bold">ClaimInquiryAndAutomatedCompensationProcess [Xử Lý Bồi Thường &amp; RAG]</text>')
    lines.append(f'  <text x="{fx+fw-25}" y="{fy+35}" class="mono" font-size="14.5" text-anchor="end">HỆ THỐNG NEXUS LOGISTICS • OMG UML 2.5 INTERACTION DIAGRAM • VISUAL PARADIGM STANDARD</text>')

    # =========================================================================
    # 2. SEVEN LIFELINES (BALANCED FOR 3200px WIDTH, SOLID #7ACFF5 FILL, SHARP CORNERS)
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

    y_line_end = 1925

    for p in lifelines:
        px = p["x"]
        if p["type"] == "actor":
            lines.append(f'  <!-- Actor Stickman: {p["name"]} -->')
            # Head (Radius 18) filled with authentic VP #7ACFF5
            lines.append(f'  <circle cx="{px}" cy="115" r="18" fill="#7ACFF5" stroke="#000000" stroke-width="1.5"/>')
            # Torso
            lines.append(f'  <line x1="{px}" y1="133" x2="{px}" y2="182" stroke="#000000" stroke-width="1.5"/>')
            # Arms
            lines.append(f'  <line x1="{px-28}" y1="149" x2="{px+28}" y2="149" stroke="#000000" stroke-width="1.5"/>')
            # Legs
            lines.append(f'  <polyline points="{px-24},218 {px},182 {px+24},218" fill="none" stroke="#000000" stroke-width="1.5"/>')
            # Labels
            lines.append(f'  <text x="{px}" y="238" font-size="14.5" text-anchor="middle">«actor»</text>')
            lines.append(f'  <text x="{px}" y="260" font-size="19" font-weight="bold" text-anchor="middle">{p["uml_id"]}</text>')
            lines.append(f'  <line x1="{px-85}" y1="264" x2="{px+85}" y2="264" stroke="#000000" stroke-width="1.2"/>')
            lines.append(f'  <text x="{px}" y="282" font-size="14" text-anchor="middle">{p["sub"]}</text>')
            lines.append(f'  <line x1="{px}" y1="293" x2="{px}" y2="{y_line_end}" class="lifeline"/>')
        else:
            bw, bh = 270, 86
            bx = px - bw / 2
            by = 185
            lines.append(f'  <!-- Classifier Lifeline: {p["uml_id"]} -->')
            # SHARP SQUARE RECTANGLE with authentic flat #7ACFF5 fill and black border
            lines.append(f'  <rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="#7ACFF5" stroke="#000000" stroke-width="1.3"/>')
            lines.append(f'  <text x="{px}" y="{by+25}" font-size="14.5" text-anchor="middle">{p["stereo"]}</text>')
            lines.append(f'  <text x="{px}" y="{by+51}" font-size="19" font-weight="bold" text-anchor="middle">{p["uml_id"]}</text>')
            ulen = len(p["uml_id"]) * 5.8
            lines.append(f'  <line x1="{px-ulen}" y1="{by+55}" x2="{px+ulen}" y2="{by+55}" stroke="#000000" stroke-width="1.2"/>')
            lines.append(f'  <text x="{px}" y="{by+74}" class="mono" font-size="13.5" text-anchor="middle">{p["sub"]}</text>')
            lines.append(f'  <line x1="{px}" y1="{by+bh}" x2="{px}" y2="{y_line_end}" class="lifeline"/>')

        # Clean bottom stop bar
        lines.append(f'  <line x1="{px-16}" y1="{y_line_end}" x2="{px+16}" y2="{y_line_end}" stroke="#000000" stroke-width="1.8"/>')

    # =========================================================================
    # 3. ACTIVATION BARS (AUTHENTIC VP WHITE BARS WITH BLACK BORDER)
    # =========================================================================
    def act(cx, y, h):
        return f'<rect x="{cx-9}" y="{y}" width="18" height="{h}" class="activation"/>'

    def act_nested(cx, y, h):
        return f'<rect x="{cx+2}" y="{y}" width="14" height="{h}" class="activation"/>'

    lines.append('  <!-- ==================== ACTIVATION BARS ==================== -->')
    lines.append(f'  {act(200, 325, 30)}')
    lines.append(f'  {act(200, 1260, 25)}')
    lines.append(f'  {act(200, 1505, 25)}')
    lines.append(f'  {act(200, 1800, 30)}')

    lines.append(f'  {act(680, 330, 1220)}')
    lines.append(f'  {act(680, 1800, 105)}')
    lines.append(f'  {act_nested(680, 1850, 42)}')

    lines.append(f'  {act(1160, 385, 1120)}')
    lines.append(f'  {act_nested(1160, 435, 38)}')

    lines.append(f'  {act(1660, 500, 1210)}')
    lines.append(f'  {act_nested(1660, 555, 42)}')

    lines.append(f'  {act(2160, 635, 75)}')
    lines.append(f'  {act(2160, 1635, 65)}')

    lines.append(f'  {act(2660, 920, 75)}')

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
            out.append(f'  <text x="{tx}" y="{y-10}" font-size="18" font-weight="bold">{html.escape(label)} <tspan class="mono" font-size="16">{html.escape(sub_info)}</tspan></text>')
        else:
            out.append(f'  <text x="{tx}" y="{y-10}" font-size="18" font-weight="bold">{html.escape(label)}</text>')
        return "\n".join(out)

    def msg_reply(x1, x2, y, label):
        out = []
        out.append(f'  <line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" class="call-reply"/>')
        direct = "right" if x2 > x1 else "left"
        out.append(f'  {draw_arrow_open(x2, y, direct)}')
        tx = min(x1, x2) + 15
        out.append(f'  <text x="{tx}" y="{y-10}" class="mono" font-size="16">{html.escape(label)}</text>')
        return "\n".join(out)

    def msg_self(cx, y1, y2, label, sub_label=None):
        out = []
        loop_w = 40
        path = f"M {cx+9} {y1} L {cx+loop_w} {y1} L {cx+loop_w} {y2} L {cx+16} {y2}"
        out.append(f'  <path d="{path}" fill="none" stroke="#000000" stroke-width="1.3"/>')
        out.append(f'  {draw_arrow_solid(cx+16, y2, "left")}')
        out.append(f'  <text x="{cx+loop_w+14}" y="{y1+14}" font-size="17" font-weight="bold">{html.escape(label)}</text>')
        if sub_label:
            out.append(f'  <text x="{cx+loop_w+14}" y="{y1+34}" class="mono" font-size="15">{html.escape(sub_label)}</text>')
        return "\n".join(out)

    lines.append(msg_sync(200, 671, 335, '1: submitQuery(message: "NEX-88291 bể vỡ")'))
    lines.append(msg_sync(689, 1151, 390, '2: POST /api/v1/chat/stream { awb, token }'))
    lines.append(msg_self(1160, 435, 465, '3: verifyJwtToken() : boolean', 'checkRateLimit(100 req/min)'))
    lines.append(msg_sync(1169, 1651, 515, '4: routeChatRequest(merchantId, prompt)'))
    lines.append(msg_self(1660, 555, 590, '5: parseIntentAndRegex(prompt)', 'Intent: CLAIM_DAMAGE | AWB: NEX-88291'))
    lines.append(msg_sync(1669, 2151, 645, '6: getOrderTrackingAndClaimContext("NEX-88291")'))
    lines.append(msg_reply(2151, 1669, 705, '7: return { hasBBBT: true (18h), declaredValue: 1.5M, insured: true }'))

    # =========================================================================
    # 5. COMBINED FRAGMENT: `alt` (MA TRẬN QUYẾT ĐỊNH - DECISION MATRIX)
    # =========================================================================
    alt_x, alt_y, alt_w, alt_h = 610, 755, 2520, 1015
    lines.append('\n  <!-- ==================== COMBINED FRAGMENT: alt (DECISION MATRIX) ==================== -->')
    lines.append(f'  <rect x="{alt_x}" y="{alt_y}" width="{alt_w}" height="{alt_h}" class="frag-box"/>')
    alt_tab_pts = f"{alt_x},{alt_y} {alt_x+90},{alt_y} {alt_x+105},{alt_y+15} {alt_x+105},{alt_y+38} {alt_x},{alt_y+38}"
    lines.append(f'  <polygon points="{alt_tab_pts}" class="frag-tab"/>')
    lines.append(f'  <text x="{alt_x+18}" y="{alt_y+27}" font-size="22" font-weight="bold">alt</text>')

    # OPERAND 1: AUTOMATED COMPENSATION (DUYỆT TỰ ĐỘNG)
    lines.append(f'  <text x="{alt_x+125}" y="{alt_y+28}" class="mono" font-size="18" font-weight="bold">[hasBBBT == true &amp;&amp; elapsedHours &lt;= 24 &amp;&amp; declaredValue &lt;= 2000000]</text>')
    lines.append(f'  <text x="{alt_x+125}" y="{alt_y+53}" font-size="16">// Ma trận: Có Biên bản bất thường ≤ 24h &amp; Khai giá ≤ 2.000.000 VNĐ ➔ Duyệt tự động cấp tốc</text>')

    lines.append(msg_sync(1669, 2651, 925, '8: similaritySearch(query: "quy chế bồi thường hàng vỡ", topK=3, threshold=0.7)'))
    lines.append(msg_reply(2651, 1669, 985, '9: return { doc: "Điều 4.2: Bồi thường 100% giá trị khai giá", score: 0.89 }'))
    lines.append(msg_sync(1669, 3091, 1055, '10: streamGenerateContent(prompt, contextDocs, model="gemini-1.5-flash")'))

    # SUB-FRAGMENT: loop (SSE TOKEN STREAMING)
    loop_x, loop_y, loop_w, loop_h = 630, 1105, 2480, 245
    lines.append('\n  <!-- SUB-FRAGMENT: loop (SSE TOKEN STREAMING) -->')
    lines.append(f'  <rect x="{loop_x}" y="{loop_y}" width="{loop_w}" height="{loop_h}" class="frag-box"/>')
    loop_tab_pts = f"{loop_x},{loop_y} {loop_x+100},{loop_y} {loop_x+115},{loop_y+15} {loop_x+115},{loop_y+36} {loop_x},{loop_y+36}"
    lines.append(f'  <polygon points="{loop_tab_pts}" class="frag-tab"/>')
    lines.append(f'  <text x="{loop_x+18}" y="{loop_y+26}" font-size="21" font-weight="bold">loop</text>')
    lines.append(f'  <text x="{loop_x+135}" y="{loop_y+26}" class="mono" font-size="17" font-weight="bold">[for each token chunk in LLM streaming response]</text>')

    lines.append(msg_reply(3091, 1669, 1150, '11: yield tokenChunk { text: "Theo Điều 4.2 Quy chế Bưu chính, đơn hàng NEX-88291..." }'))
    lines.append(msg_reply(1651, 1169, 1195, '12: sse.write("event: token", tokenChunk)'))
    lines.append(msg_reply(1151, 689, 1240, '13: onMessage(chunkEvent) // SSE Stream transfer'))
    lines.append(msg_reply(671, 200, 1285, '14: renderTypingEffect(tokenChunk) // Hiệu ứng gõ chữ'))
    lines.append(msg_reply(1651, 1169, 1395, '15: emitActionCard({ type: "CLAIM_CREATE", awb: "NEX-88291", max: 1.5M })'))
    lines.append(msg_reply(1151, 689, 1450, '16: dispatchEvent("ACTION_CARD", cardPayload)'))
    lines.append(msg_reply(671, 200, 1505, '17: renderInteractiveButtons([TẠO BỒI THƯỜNG], [TRA CỨU BBBT])'))

    # OPERAND 2: ARBITRATION DISPUTE (CHUYỂN TRỌNG TÀI HITL)
    div_y = 1555
    lines.append(f'\n  <!-- Fragment Divider (alt else branch) -->')
    lines.append(f'  <line x1="{alt_x}" y1="{div_y}" x2="{alt_x+alt_w}" y2="{div_y}" class="frag-divider"/>')
    lines.append(f'  <text x="{alt_x+25}" y="{div_y+25}" class="mono" font-size="18" font-weight="bold">[else: elapsedHours &gt; 24 || declaredValue &gt; 2000000]</text>')
    lines.append(f'  <text x="{alt_x+25}" y="{div_y+48}" font-size="16">// Ma trận: Quá hạn 24h hoặc Giá trị &gt; 2.000.000 VNĐ ➔ Chuyển Trọng tài / Thẩm định viên (HITL)</text>')

    lines.append(msg_sync(1669, 2151, 1640, '18: POST /api/v1/claims/dispute-escalate(awb, reason)'))
    lines.append(msg_reply(2151, 1669, 1685, '19: return { status: "PENDING_ARBITRATION", officer: "Inspector-04" }'))
    lines.append(msg_reply(1651, 689, 1730, '20: notifyArbitrationHandover("Đã chuyển hồ sơ sang bộ phận Thẩm định viên bưu cục")'))

    # USER ACTION
    lines.append(msg_sync(200, 671, 1805, '21: onClickButton("[TẠO BỒI THƯỜNG]")'))
    lines.append(msg_self(680, 1845, 1885, '22: navigateTo("/merchant/claims/create")', 'Điền sẵn: Mã NEX-88291 | Số tiền 1.5M | BBBT 24h'))

    # =========================================================================
    # 6. VISUAL PARADIGM DOG-EARED NOTES (CLASSIC VP NOTE YELLOW #FFF2CC)
    # =========================================================================
    lines.append('\n  <!-- ==================== VISUAL PARADIGM DOG-EARED NOTES ==================== -->')

    # NOTE 1: DECISION MATRIX RULE
    n1_x, n1_y, n1_w, n1_h = 2210, 780, 420, 105
    lines.append(f'  {draw_dogear_note(n1_x, n1_y, n1_w, n1_h, fold=18, bg="#FFF2CC", stroke="#000000", flap_color="#FFE599")}')
    lines.append(f'  <text x="{n1_x+18}" y="{n1_y+26}" font-size="16.5" font-weight="bold">«Note: Ma Trận Bồi Thường Nhanh»</text>')
    lines.append(f'  <text x="{n1_x+18}" y="{n1_y+50}" font-size="14.5">Căn cứ Điều 4.2: Đơn có BBBT trong vòng 24h,</text>')
    lines.append(f'  <text x="{n1_x+18}" y="{n1_y+72}" font-size="14.5">khai giá ≤ 2.000.000 VNĐ ➔ Duyệt tự động.</text>')
    lines.append(f'  <text x="{n1_x+18}" y="{n1_y+94}" font-size="14.5" font-weight="bold">AI tự phát sinh Action Card điền sẵn.</text>')
    lines.append(f'  <circle cx="1850" cy="770" r="3.5" fill="#000000"/>')
    lines.append(f'  <line x1="{n1_x}" y1="{n1_y+40}" x2="1850" y2="770" class="note-line"/>')

    # NOTE 2: SSE STREAMING
    n2_x, n2_y, n2_w, n2_h = 2210, 1205, 420, 100
    lines.append(f'  {draw_dogear_note(n2_x, n2_y, n2_w, n2_h, fold=18, bg="#FFF2CC", stroke="#000000", flap_color="#FFE599")}')
    lines.append(f'  <text x="{n2_x+18}" y="{n2_y+26}" font-size="16.5" font-weight="bold">«Note: Cơ Chế HTTP SSE Streaming»</text>')
    lines.append(f'  <text x="{n2_x+18}" y="{n2_y+50}" font-size="14.5">Truyền tải từng token qua kết nối Keep-Alive</text>')
    lines.append(f'  <text x="{n2_x+18}" y="{n2_y+72}" font-size="14.5">độ trễ &lt; 50ms, frontend tạo hiệu ứng typing.</text>')
    lines.append(f'  <text x="{n2_x+18}" y="{n2_y+92}" font-size="14.5" font-weight="bold">Trải nghiệm tương tác mượt mà.</text>')
    lines.append(f'  <circle cx="1660" cy="1195" r="3.5" fill="#000000"/>')
    lines.append(f'  <line x1="{n2_x}" y1="{n2_y+40}" x2="1660" y2="1195" class="note-line"/>')

    # NOTE 3: CLOSED-LOOP UX
    n3_x, n3_y, n3_w, n3_h = 1200, 1795, 420, 105
    lines.append(f'  {draw_dogear_note(n3_x, n3_y, n3_w, n3_h, fold=18, bg="#FFF2CC", stroke="#000000", flap_color="#FFE599")}')
    lines.append(f'  <text x="{n3_x+18}" y="{n3_y+26}" font-size="16.5" font-weight="bold">«Note: Khép Kín Hành Động (UX)»</text>')
    lines.append(f'  <text x="{n3_x+18}" y="{n3_y+50}" font-size="14.5">Thay vì text tĩnh, AI phát sinh card bấm được.</text>')
    lines.append(f'  <text x="{n3_x+18}" y="{n3_y+72}" font-size="14.5">Click [TẠO BỒI THƯỜNG] chuyển sang form</text>')
    lines.append(f'  <text x="{n3_x+18}" y="{n3_y+94}" font-size="14.5">khiếu nại đã điền sẵn 100% ngữ cảnh.</text>')
    lines.append(f'  <circle cx="725" cy="1860" r="3.5" fill="#000000"/>')
    lines.append(f'  <line x1="{n3_x}" y1="{n3_y+45}" x2="725" y2="1860" class="note-line"/>')

    # =========================================================================
    # 7. VISUAL PARADIGM NOTATION LEGEND (FOOTER STRIP)
    # =========================================================================
    leg_x, leg_y, leg_w, leg_h = fx + 25, fy + fh - 85, fw - 50, 70
    lines.append(f'  <rect x="{leg_x}" y="{leg_y}" width="{leg_w}" height="{leg_h}" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>')
    lines.append(f'  <text x="{leg_x+25}" y="{leg_y+27}" font-size="15" font-weight="bold">QUY CHUẨN VISUAL PARADIGM UML 2.5:</text>')

    # Item 1: Sync call
    lines.append(f'  <g transform="translate({leg_x+25}, {leg_y+38})">')
    lines.append(f'    <line x1="0" y1="12" x2="45" y2="12" stroke="#000000" stroke-width="1.3"/>')
    lines.append(f'    {draw_arrow_solid(45, 12, "right", size=10)}')
    lines.append(f'    <text x="58" y="16" font-size="14">Synchronous Call (Gọi đồng bộ)</text>')
    lines.append(f'  </g>')

    # Item 2: Reply call
    lines.append(f'  <g transform="translate({leg_x+410}, {leg_y+38})">')
    lines.append(f'    <line x1="0" y1="12" x2="45" y2="12" stroke="#000000" stroke-width="1.2" stroke-dasharray="6 4"/>')
    lines.append(f'    {draw_arrow_open(45, 12, "right", size=10)}')
    lines.append(f'    <text x="58" y="16" font-size="14">Reply Message (Phản hồi kết quả)</text>')
    lines.append(f'  </g>')

    # Item 3: Self call + Nested
    lines.append(f'  <g transform="translate({leg_x+820}, {leg_y+38})">')
    lines.append(f'    <rect x="0" y="0" width="14" height="24" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>')
    lines.append(f'    <rect x="9" y="4" width="12" height="16" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>')
    lines.append(f'    <text x="32" y="16" font-size="14">Nested Activation (Gọi nội bộ lồng nấc)</text>')
    lines.append(f'  </g>')

    # Item 4: Fragments alt/loop
    lines.append(f'  <g transform="translate({leg_x+1300}, {leg_y+38})">')
    lines.append(f'    <rect x="0" y="0" width="36" height="24" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>')
    lines.append(f'    <text x="18" y="16" font-size="13" font-weight="bold" text-anchor="middle">alt</text>')
    lines.append(f'    <text x="48" y="16" font-size="14">Combined Fragment (Khối rẽ nhánh / Vòng lặp)</text>')
    lines.append(f'  </g>')

    # Item 5: Dog-eared note
    lines.append(f'  <g transform="translate({leg_x+1840}, {leg_y+38})">')
    lines.append(f'    <polygon points="0,0 22,0 28,6 28,24 0,24" fill="#FFF2CC" stroke="#000000" stroke-width="1.2"/>')
    lines.append(f'    <text x="38" y="16" font-size="14">UML Note (Ghi chú gấp góc giải thích nghiệp vụ)</text>')
    lines.append(f'  </g>')

    # Right badge
    lines.append(f'  <text x="{leg_x+leg_w-25}" y="{leg_y+44}" class="mono" font-size="14" text-anchor="end">100% NATIVE SVG VECTOR • AUTHENTIC VISUAL PARADIGM LOOK &amp; FEEL</text>')

    lines.append('</svg>')
    return "\n".join(lines)

def main():
    target_path = os.path.join(
        os.path.dirname(__file__),
        "../docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/02-sequence-and-decision-matrix.svg"
    )
    target_path = os.path.abspath(target_path)

    print(f"Generating authentic Visual Paradigm UML 2.5 Sequence Diagram to:\n  {target_path}")
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
