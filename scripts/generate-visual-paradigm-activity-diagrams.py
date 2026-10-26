#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE ULTRA-HIGH-DENSITY VISUAL PARADIGM STANDARD UML 2.5 ACTIVITY DIAGRAMS
=============================================================================
Bản vẽ Sơ đồ Hoạt động Kỹ thuật Đồ án Tốt nghiệp (OMG UML 2.5 / Visual Paradigm):
1. ACT-AI-RAG-01: Quy trình Vận hành Trợ lý AI & Truy xuất RAG Thời gian thực (5 Swimlanes)
2. ACT-KNOW-INGEST-02: Quy trình Phân đoạn Ngữ nghĩa (Chunking) & Vector hóa Tri thức Ngoại tuyến (4 Swimlanes)
3. ACT-SHIP-03: Quy trình Nghiệp vụ Vòng đời Vận đơn & Trung chuyển Đa Hub (5 Swimlanes)

QUY CHUẨN KỸ THUẬT & TYPOGRAPHY CỰC ĐẠI:
- Canvas 3600 x 2400 px (3:2 đồng bộ toàn dự án).
- Header: Y = 38 -> 144. Swimlane Header: Y = 160 -> 218.
- Vùng nội dung tối ưu: Y = 230 -> 2250 (Tránh va chạm với Legend tại Y = 2270).
- Action Boxes lớn, chữ to đậm (Bold 900 / 800), cỡ chữ 18px - 25px nhìn rõ mồn một.
- Zero Dead Space: Phủ kín tất cả các làn bơi bằng nghiệp vụ thực tế (đạt >= 85% diện tích), loại bỏ hoàn toàn bậc thang chết.
- Zero Line Collision: Tất cả các đường nối Manhattan 90° đi trong hành lang riêng, không cắt qua hộp chữ.
- 100% Native Inline Vector (Zero <marker> tags, Manhattan 90° routing).
"""

import os
import html

def xml_esc(s):
    if s is None:
        return ""
    if not isinstance(s, str):
        s = str(s)
    return html.escape(s, quote=True)

class VisualParadigmSvgBuilder:
    def __init__(self, width=3600, height=2400, doc_id="ACT-01", title="", subtitle="", spec="OMG UML 2.5 ACTIVITY DIAGRAM"):
        self.w = width
        self.h = height
        self.doc_id = doc_id
        self.title = title
        self.subtitle = subtitle
        self.spec = spec
        self.lines = []
        self._init_canvas()

    def _init_canvas(self):
        self.lines.append('<?xml version="1.0" encoding="UTF-8"?>')
        self.lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="background:#FFFFFF;">')
        self.lines.append('  <defs>')
        self.lines.append('    <style type="text/css"><![CDATA[')
        self.lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }')
        self.lines.append('      .mono { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }')
        self.lines.append('      .bg { fill: #FFFFFF; }')
        self.lines.append('      .frame-outer { fill: none; stroke: #000000; stroke-width: 3.2; }')
        self.lines.append('      .frame-inner { fill: none; stroke: #000000; stroke-width: 1.2; stroke-dasharray: 8 4; }')
        self.lines.append('      .lane-bg { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; }')
        self.lines.append('      .lane-hdr { fill: #F1F5F9; stroke: #000000; stroke-width: 1.8; }')
        self.lines.append('      .lane-hdr-txt { font-size: 25px; font-weight: 900; fill: #000000; letter-spacing: 0.5px; text-anchor: middle; }')
        self.lines.append('      .lane-hdr-sub { font-size: 16.5px; fill: #1E293B; font-weight: 800; font-family: ui-monospace, Menlo, monospace; text-anchor: middle; }')
        self.lines.append('      .action-rect { fill: #FFFFFF; stroke: #000000; stroke-width: 2.4; rx: 18px; ry: 18px; }')
        self.lines.append('      .action-title { font-size: 22.5px; font-weight: 900; fill: #000000; text-anchor: middle; }')
        self.lines.append('      .action-body { font-size: 18.5px; font-weight: 700; fill: #0F172A; text-anchor: middle; }')
        self.lines.append('      .action-code { font-family: ui-monospace, Menlo, monospace; font-size: 17.5px; font-weight: 900; fill: #000000; text-anchor: middle; }')
        self.lines.append('      .action-note { font-size: 17px; font-weight: 700; fill: #334155; text-anchor: middle; }')
        self.lines.append('      .obj-rect { fill: #F8FAFC; stroke: #000000; stroke-width: 2.2; }')
        self.lines.append('      .obj-title { font-size: 21px; font-weight: 900; fill: #000000; text-anchor: middle; }')
        self.lines.append('      .obj-state { font-size: 18px; font-weight: 900; fill: #000000; font-family: ui-monospace, Menlo, monospace; text-anchor: middle; }')
        self.lines.append('      .flow-line { stroke: #000000; stroke-width: 2.8; fill: none; stroke-linecap: round; stroke-linejoin: round; }')
        self.lines.append('      .flow-dash { stroke: #000000; stroke-width: 2.4; stroke-dasharray: 8 5; fill: none; stroke-linecap: round; }')
        self.lines.append('      .guard-plate { fill: #FFFFFF; stroke: #000000; stroke-width: 1.8; rx: 6px; }')
        self.lines.append('      .guard-txt { font-family: ui-monospace, Menlo, monospace; font-size: 18px; font-weight: 900; fill: #000000; text-anchor: middle; }')
        self.lines.append('      .t-main { font-size: 34px; font-weight: 900; fill: #000000; letter-spacing: -0.3px; }')
        self.lines.append('      .t-sub { font-size: 19px; fill: #1E293B; font-weight: 700; }')
        self.lines.append('      .legend-lbl { font-size: 17px; font-weight: 800; fill: #000000; }')
        self.lines.append('    ]]></style>')
        self.lines.append('  </defs>')
        self.lines.append('')
        # Borders
        self.lines.append(f'  <rect width="{self.w}" height="{self.h}" class="bg"/>')
        self.lines.append(f'  <rect x="18" y="18" width="{self.w-36}" height="{self.h-36}" class="frame-outer"/>')
        self.lines.append(f'  <rect x="26" y="26" width="{self.w-52}" height="{self.h-52}" class="frame-inner"/>')
        self.lines.append('')
        # Header Block
        self.lines.append('  <!-- ==================== HEADER BLOCK ==================== -->')
        self.lines.append('  <g id="Header_Block">')
        self.lines.append(f'    <rect x="40" y="38" width="{self.w-80}" height="106" fill="#FFFFFF" stroke="#000000" stroke-width="2.2"/>')
        self.lines.append(f'    <text x="65" y="80" class="t-main">{xml_esc(self.title)}</text>')
        self.lines.append(f'    <text x="65" y="112" class="t-sub">{xml_esc(self.subtitle)}</text>')
        self.lines.append(f'    <text x="65" y="134" font-size="15" class="mono" font-weight="900" fill="#000000">{xml_esc(self.spec)}</text>')
        # Right info box
        bx = self.w - 640
        self.lines.append(f'    <rect x="{bx}" y="48" width="580" height="86" fill="#F8FAFC" stroke="#000000" stroke-width="1.8" rx="4"/>')
        self.lines.append(f'    <text x="{bx+20}" y="78" font-size="21" font-weight="900" fill="#000000">MÃ BẢN VẼ: {xml_esc(self.doc_id)}</text>')
        self.lines.append(f'    <text x="{bx+20}" y="103" class="mono" font-size="16.5" font-weight="800" fill="#1E293B">FIGMA PAGE 2 • ACTIVITY BLUEPRINT</text>')
        self.lines.append(f'    <text x="{bx+20}" y="124" class="mono" font-size="14.5" font-weight="800" fill="#475569">ULTRA-HIGH DENSITY • 100% NATIVE VECTOR</text>')
        self.lines.append('  </g>')
        self.lines.append('')

    def draw_swimlanes(self, lanes, top_y=160, height=2090):
        self.lines.append('  <!-- ==================== ACTIVITY PARTITIONS (SWIMLANES) ==================== -->')
        self.lines.append('  <g id="Swimlanes">')
        cur_x = 40
        for i, (title, sub, w) in enumerate(lanes):
            self.lines.append(f'    <!-- Swimlane {i+1}: {title} -->')
            self.lines.append(f'    <rect x="{cur_x}" y="{top_y}" width="{w}" height="{height}" class="lane-bg"/>')
            self.lines.append(f'    <rect x="{cur_x}" y="{top_y}" width="{w}" height="58" class="lane-hdr"/>')
            self.lines.append(f'    <text x="{cur_x + w/2}" y="{top_y + 32}" class="lane-hdr-txt">{xml_esc(title)}</text>')
            self.lines.append(f'    <text x="{cur_x + w/2}" y="{top_y + 51}" class="lane-hdr-sub">{xml_esc(sub)}</text>')
            cur_x += w
        self.lines.append('  </g>')
        self.lines.append('')

    def draw_initial_node(self, cx, cy, label=None):
        res = [
            f'  <g id="Initial_Node_{int(cx)}_{int(cy)}">',
            f'    <circle cx="{cx}" cy="{cy}" r="17" fill="#000000" stroke="#000000" stroke-width="1.8"/>'
        ]
        if label:
            res.append(f'    <text x="{cx + 30}" y="{cy + 7}" font-size="17" font-weight="900" class="mono" fill="#000000" text-anchor="start">{xml_esc(label)}</text>')
        res.append('  </g>')
        self.lines.append("\n".join(res))

    def draw_final_node(self, cx, cy, label=None):
        res = [
            f'  <g id="Final_Node_{int(cx)}_{int(cy)}">',
            f'    <circle cx="{cx}" cy="{cy}" r="22" fill="#FFFFFF" stroke="#000000" stroke-width="2.8"/>',
            f'    <circle cx="{cx}" cy="{cy}" r="12" fill="#000000"/>'
        ]
        if label:
            res.append(f'    <text x="{cx + 34}" y="{cy + 7}" font-size="17" font-weight="900" class="mono" fill="#000000" text-anchor="start">{xml_esc(label)}</text>')
        res.append('  </g>')
        self.lines.append("\n".join(res))

    def draw_action(self, cx, cy, w, h, title, lines_text):
        res = [
            f'  <g id="Action_{int(cx)}_{int(cy)}">',
            f'    <rect x="{cx - w/2}" y="{cy - h/2}" width="{w}" height="{h}" class="action-rect"/>'
        ]
        total_lines = 1 + len(lines_text)
        line_height = 27
        start_y = cy - ((total_lines - 1) * line_height) / 2
        res.append(f'    <text x="{cx}" y="{start_y}" class="action-title">{xml_esc(title)}</text>')
        
        cur_y = start_y + line_height + 2
        for lt in lines_text:
            if lt.startswith("`") or lt.startswith("POST") or lt.startswith("GET") or lt.startswith("CLI:") or lt.startswith("Header:") or lt.startswith("Score") or lt.startswith("Regex") or lt.startswith("saveIndex") or lt.startswith("Payload:") or lt.startswith("SETEX") or lt.startswith("Publish") or lt.startswith("EventSource"):
                clean = lt.replace("`", "")
                res.append(f'    <text x="{cx}" y="{cur_y}" class="action-code">{xml_esc(clean)}</text>')
            elif lt.startswith("•") or lt.startswith("Status:") or lt.startswith("Quy chuẩn:") or lt.startswith("Tham số:") or lt.startswith("Lưu trữ:") or lt.startswith("Thống kê:") or lt.startswith("Trạng thái"):
                res.append(f'    <text x="{cx}" y="{cur_y}" class="action-note">{xml_esc(lt)}</text>')
            else:
                res.append(f'    <text x="{cx}" y="{cur_y}" class="action-body">{xml_esc(lt)}</text>')
            cur_y += line_height

        res.append('  </g>')
        self.lines.append("\n".join(res))

    def draw_decision(self, cx, cy, w=76, h=76, label=None):
        p1 = f"{cx},{cy - h/2}"
        p2 = f"{cx + w/2},{cy}"
        p3 = f"{cx},{cy + h/2}"
        p4 = f"{cx - w/2},{cy}"
        res = [
            f'  <g id="Decision_{int(cx)}_{int(cy)}">',
            f'    <polygon points="{p1} {p2} {p3} {p4}" fill="#FFFFFF" stroke="#000000" stroke-width="2.8"/>'
        ]
        if label:
            res.append(f'    <text x="{cx}" y="{cy - h/2 - 14}" font-size="18.5" font-weight="900" fill="#000000" text-anchor="middle">{xml_esc(label)}</text>')
        res.append('  </g>')
        self.lines.append("\n".join(res))

    def draw_merge(self, cx, cy, w=66, h=66):
        self.draw_decision(cx, cy, w, h)

    def draw_sync_bar(self, cx, cy, length=300, orientation="h", thickness=8):
        res = [f'  <g id="Sync_Bar_{int(cx)}_{int(cy)}">']
        if orientation == "h":
            res.append(f'    <rect x="{cx - length/2}" y="{cy - thickness/2}" width="{length}" height="{thickness}" rx="3" fill="#000000"/>')
        else:
            res.append(f'    <rect x="{cx - thickness/2}" y="{cy - length/2}" width="{thickness}" height="{length}" rx="3" fill="#000000"/>')
        res.append('  </g>')
        self.lines.append("\n".join(res))

    def draw_object_node(self, cx, cy, w, h, name, state):
        res = [
            f'  <g id="ObjectNode_{int(cx)}_{int(cy)}">',
            f'    <rect x="{cx - w/2}" y="{cy - h/2}" width="{w}" height="{h}" class="obj-rect"/>',
            f'    <text x="{cx}" y="{cy - 8}" class="obj-title">{xml_esc(name)}</text>',
            f'    <text x="{cx}" y="{cy + 20}" class="obj-state">[{xml_esc(state)}]</text>',
            '  </g>'
        ]
        self.lines.append("\n".join(res))

    def draw_arrow(self, points, guard=None, guard_pos=None, is_dashed=False):
        res = []
        pts_str = " ".join([f"{p[0]},{p[1]}" for p in points])
        cls_line = "flow-dash" if is_dashed else "flow-line"
        res.append(f'  <polyline points="{pts_str}" class="{cls_line}"/>')
        
        p_last = points[-1]
        p_prev = points[-2]
        dx = p_last[0] - p_prev[0]
        dy = p_last[1] - p_prev[1]
        
        # Native arrowhead: length 18px, width 14px
        if abs(dy) >= abs(dx):
            if dy > 0:  # down
                res.append(f'  <polygon points="{p_last[0]},{p_last[1]} {p_last[0]-7},{p_last[1]-18} {p_last[0]+7},{p_last[1]-18}" fill="#000000"/>')
            else:  # up
                res.append(f'  <polygon points="{p_last[0]},{p_last[1]} {p_last[0]-7},{p_last[1]+18} {p_last[0]+7},{p_last[1]+18}" fill="#000000"/>')
        else:
            if dx > 0:  # right
                res.append(f'  <polygon points="{p_last[0]},{p_last[1]} {p_last[0]-18},{p_last[1]-7} {p_last[0]-18},{p_last[1]+7}" fill="#000000"/>')
            else:  # left
                res.append(f'  <polygon points="{p_last[0]},{p_last[1]} {p_last[0]+18},{p_last[1]-7} {p_last[0]+18},{p_last[1]+7}" fill="#000000"/>')

        if guard and guard_pos:
            gx, gy = guard_pos
            w = len(guard) * 11 + 30
            h = 36
            res.append(f'  <rect x="{gx - w/2}" y="{gy - h/2}" width="{w}" height="{h}" class="guard-plate"/>')
            res.append(f'  <text x="{gx}" y="{gy + 7}" class="guard-txt">[{xml_esc(guard)}]</text>')

        self.lines.append("\n".join(res))

    def draw_legend(self, y=2270):
        res = [
            '  <!-- ==================== LEGEND BLOCK ==================== -->',
            '  <g id="UML_Legend">',
            f'    <rect x="40" y="{y}" width="{self.w-80}" height="86" fill="#F8FAFC" stroke="#000000" stroke-width="1.8"/>',
            f'    <text x="65" y="{y+32}" font-size="17" font-weight="900" fill="#000000">KÝ HIỆU CHUẨN OMG UML 2.5 / VISUAL PARADIGM:</text>',
            f'    <circle cx="560" cy="{y+26}" r="13" fill="#000000"/>',
            f'    <text x="585" y="{y+32}" class="legend-lbl">Initial Node (Khởi đầu)</text>',
            f'    <circle cx="880" cy="{y+26}" r="16" fill="#FFFFFF" stroke="#000000" stroke-width="2.4"/>',
            f'    <circle cx="880" cy="{y+26}" r="9" fill="#000000"/>',
            f'    <text x="910" y="{y+32}" class="legend-lbl">Activity Final (Kết thúc)</text>',
            f'    <rect x="1200" y="{y+14}" width="60" height="26" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>',
            f'    <text x="1272" y="{y+32}" class="legend-lbl">Action Node (Hành động bo góc)</text>',
            f'    <polygon points="1630,{y+11} 1645,{y+26} 1630,{y+41} 1615,{y+26}" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>',
            f'    <text x="1658" y="{y+32}" class="legend-lbl">Decision / Merge (Rẽ nhánh / Gộp)</text>',
            f'    <rect x="2070" y="{y+22}" width="42" height="8" rx="2" fill="#000000"/>',
            f'    <text x="2122" y="{y+32}" class="legend-lbl">Fork / Join Bar (Đồng bộ song song)</text>',
            f'    <rect x="2490" y="{y+14}" width="50" height="26" fill="#F8FAFC" stroke="#000000" stroke-width="1.8"/>',
            f'    <text x="2550" y="{y+32}" class="legend-lbl">Object Node (Đối tượng / Trạng thái)</text>',
            f'    <line x1="2920" y1="{y+26}" x2="2965" y2="{y+26}" stroke="#000000" stroke-width="2.6"/>',
            f'    <polygon points="2965,{y+26} 2953,{y+21} 2953,{y+31}" fill="#000000"/>',
            f'    <text x="2980" y="{y+32}" class="legend-lbl">Control Flow (Luồng điều khiển 90°)</text>',
            f'    <text x="65" y="{y+66}" font-size="15" fill="#1E293B" font-weight="700">Bản vẽ kỹ thuật chuẩn mực phục vụ Thuyết minh Khóa luận Tốt nghiệp &amp; Trình chiếu Hội đồng • Ultra-High Density Large Bold Typography • Zero Dead Space</text>',
            f'    <text x="{self.w-540}" y="{y+66}" class="mono" font-size="14.5" font-weight="900" fill="#000000">100% NATIVE VECTOR • ZERO MARKER TAGS</text>',
            '  </g>'
        ]
        self.lines.append("\n".join(res))

    def save(self, filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        content = "\n".join(self.lines) + '\n</svg>'
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Exported: {filepath}")

# ==============================================================================
# 1. SƠ ĐỒ 1: ACT-AI-RAG-01 - RUNTIME RAG & DYNAMIC TOOLS ORCHESTRATION
# ==============================================================================
def generate_diagram_1(out_paths):
    b = VisualParadigmSvgBuilder(
        width=3600, height=2400,
        doc_id="ACT-AI-RAG-01",
        title="SƠ ĐỒ HOẠT ĐỘNG: VẬN HÀNH TRỢ LÝ AI & TRUY XUẤT RAG THỜI GIAN THỰC (HYBRID RAG & DYNAMIC TOOLS)",
        subtitle="Đồ Án Tốt Nghiệp Kỹ Sư CNTT • Phân Hệ Trợ Lý AI Logistics (@NEXUS/chatbot-service :3013) • Chuẩn Mô Hình Hóa OMG UML 2.5 / Visual Paradigm",
        spec="OMG UML 2.5 ACTIVITY DIAGRAM • 5 SWIMLANES • ULTRA-HIGH DENSITY SCALE"
    )

    # 5 Làn bơi: 680, 680, 760, 680, 720 (Tổng = 3520, từ X = 40 -> 3560)
    lanes = [
        ("LÀN 1: KHÁCH HÀNG / CLIENT APPS", "customer-mobile • merchant-web • guest-web", 680),
        ("LÀN 2: API GATEWAY & BFF (:3000)", "Reverse Proxy • Auth Guard • PII Data Masking", 680),
        ("LÀN 3: CHATBOT ORCHESTRATOR (:3013)", "Intent Router • Tool Engine • SSE Token Stream", 760),
        ("LÀN 4: DỊCH VỤ LÕI LOGISTICS MESH", "tracking-service :3008 • pricing-service :3012", 680),
        ("LÀN 5: VECTOR STORE & CLOUD LLM", "In-Memory Vector Heap • Gemini Flash • GPT-4o-mini", 720)
    ]
    b.draw_swimlanes(lanes, top_y=160, height=2090)

    # Tâm tọa độ các làn
    c1, c2, c3, c4, c5 = 380, 1060, 1780, 2500, 3200

    # -------------------------------------------------------------------------
    # GIAI ĐOẠN 1: KHỞI TẠO, BẢO VỆ VÀ TIỀN XỬ LÝ (Y = 240 -> 680)
    # -------------------------------------------------------------------------
    b.draw_initial_node(c1, 260, label="Khởi đầu phiên")
    b.draw_action(c1, 380, 620, 140, "1. Nhập Câu Hỏi & Khởi Tạo Phiên Chat", [
        "Người dùng gửi truy vấn tra cứu đơn, tính cước hoặc hỗ trợ khiếu nại",
        "POST /api/v1/chat/stream • Content-Type: application/json",
        "Payload: { message, conversationId, role }"
    ])
    b.draw_object_node(c1, 530, 580, 70, "Phiên Truy Vấn Khách Hàng (Active Session)", "CLIENT_QUERY_SUBMITTED")

    b.draw_action(c2, 380, 620, 140, "2A. Tiếp Nhận Request & Reverse Proxy BFF", [
        "Kiểm tra JWT Bearer Token, gán Request ID tương quan",
        "Header: Bearer <JWT> | Correlation-ID: UUID",
        "Phân tách quyền: GUEST vãng lai & MERCHANT đăng nhập"
    ])
    b.draw_action(c2, 550, 620, 140, "2B. Bảo Vệ Dữ Liệu PII & Rate Limiter Redis", [
        "Khử định danh tự động (PII Masking): Che Họ tên, SĐT, Địa chỉ",
        "Redis Token Bucket: Rate Limit 60 req/phút/IP • Anti-Spam",
        "Chuyển tiếp yêu cầu an toàn tới http://chatbot-service:3013"
    ])

    b.draw_action(c3, 380, 700, 140, "3. Tiền Xử Lý Văn Bản & Nhận Diện Thực Thể (NER)", [
        "normalizeVietnamese(): Khử dấu thanh, chuẩn hóa chữ thường và ký tự",
        "Regex: /NX[-_]?[A-Z0-9]{4,14}/ • Hotline /1900\\d{4}/",
        "Trích xuất thực thể: Trọng lượng, Kích thước, Tỉnh/Thành gửi-nhận"
    ])
    b.draw_action(c3, 560, 700, 130, "4. Động Cơ Phân Loại Ý Định (Intent Engine)", [
        "Định tuyến thông minh theo quy tắc ưu tiên & ngữ cảnh lịch sử",
        "Ngưỡng tin cậy: Intent_Score >= 0.85 (Tracking / Pricing / RAG)"
    ])

    # -------------------------------------------------------------------------
    # GIAI ĐOẠN 2: PHÂN NHÁNH Ý ĐỊNH & THỰC THI SONG SONG (Y = 680 -> 1420)
    # -------------------------------------------------------------------------
    b.draw_decision(c3, 730, 80, 80, label="Phân Loại Ý Định (Intent)?")

    # Bổ sung các bước nghiệp vụ nâng cao độ phủ Lane 1 & Lane 2
    b.draw_action(c1, 720, 620, 140, "1B. Hiển Thị Loading Skeleton & Kênh Chờ SSE", [
        "Lắng nghe kết nối Server-Sent Events, kích hoạt khung chờ mượt mà",
        "GET /api/v1/chat/stream • Connection: keep-alive",
        "Trạng thái giao diện: UI_AWAITING_STREAM_BUFFER"
    ])
    b.draw_object_node(c1, 880, 580, 70, "Kênh Nhận Dữ Liệu Tức Thời (SSE Channel)", "SSE_STREAM_CONNECTED")

    b.draw_action(c1, 1040, 620, 140, "1C. Hiển Thị Gợi Ý Thao Tác (Action Chips)", [
        "Render phím tắt: Tra cước nhanh, Khiếu nại bồi thường, Quy chế SOP",
        "Component: QuickPromptChips • Auto-Suggest Context",
        "Hỗ trợ khách bấm 1 chạm tra cứu không cần nhập tay"
    ])
    b.draw_object_node(c1, 1200, 580, 70, "Danh Sách Phím Tắt Tương Tác", "ACTION_CHIPS_RENDERED")

    b.draw_action(c2, 720, 620, 140, "2C. Quản Lý Phiên & Lưu Session Hội Thoại Redis", [
        "Lưu trữ ngữ cảnh hội thoại đa lượt vào bộ nhớ đệm phân tán Redis",
        "SETEX session:{conversationId} 86400 (TTL: 24 giờ)",
        "Khôi phục 5 lượt hỏi đáp gần nhất để duy trì mạch đàm thoại"
    ])
    b.draw_object_node(c2, 880, 580, 70, "Ngữ Cảnh Hội Thoại Đã Xác Thực (Redis)", "REDIS_SESSION_ACTIVE")

    b.draw_action(c2, 1040, 620, 140, "2D. Giám Sát APM & Kiểm Soát Quota Gọi Mô Hình AI", [
        "Kiểm tra định mức gọi AI theo vai trò (Guest: 20 req, Merchant: 500)",
        "Prometheus APM: gateway_requests_total • Circuit Breaker",
        "Chặn request bất thường, chống tấn công DDoS tự động"
    ])
    b.draw_object_node(c2, 1200, 580, 70, "Chứng Chỉ Định Mức Truy Vấn Hợp Lệ", "RATE_LIMIT_PASSED")

    # Sync Bar (Fork) tại Y = 840
    b.draw_sync_bar(c3, 840, length=260, orientation="h", thickness=8)

    # Nhánh Logistics Tools (Làn 4)
    b.draw_action(c4, 940, 620, 140, "5A. Tra Cứu Vận Đơn Thực Thời (Tracking Tool)", [
        "Kiểm tra Redis Cache trước khi query CSDL PostgreSQL",
        "GET /api/v1/tracking/:code (tracking-service :3008)",
        "Trích xuất: 5 mốc lịch trình mới nhất, Hub hiện tại, Trạng thái phát"
    ])
    b.draw_action(c4, 1120, 620, 140, "5B. Động Cơ Báo Giá Cước Động (Pricing Tool)", [
        "Tính toán cước bưu chính theo chuẩn IATA V/6000 & cự ly",
        "POST /api/v1/pricing/quote (pricing-service :3012)",
        "Quy đổi: max(Khối lượng thực, D x R x C / 6000) • Giảm VIP Shop"
    ])
    b.draw_object_node(c4, 1285, 580, 70, "Dữ Liệu Vận Hành Thời Gian Thực", "RealtimeTrackingData | PricingQuoteSnapshot")

    b.draw_action(c4, 1460, 620, 140, "5F. Ghi Nhật Ký Truy Vấn & Kiểm Định Quota", [
        "Ghi nhận vết truy vết nghiệp vụ (Audit Trail) cho toàn bộ API calls",
        "Prometheus Metrics: logistics_tool_calls_total • Latency < 15ms",
        "Bảo đảm tính toàn vẹn và đối soát lưu lượng giữa các dịch vụ"
    ])
    b.draw_object_node(c4, 1600, 580, 70, "Nhật Ký Nghiệp Vụ Đã Xác Nhận (Audit Log)", "AUDIT_TRAIL_COMMITTED")

    b.draw_action(c4, 1820, 620, 140, "5G. Tra Cứu Trạng Thái Khiếu Nại Bưu Chính", [
        "Tra cứu tự động tiến độ xử lý biên bản bất thường và đền bù",
        "GET /api/v1/claims/check/:shipmentCode (claims-service :3010)",
        "Hạn mức giải quyết bồi thường tự động: Dưới 500,000 VNĐ"
    ])
    b.draw_object_node(c4, 1970, 580, 70, "Hồ Sơ Khiếu Nại & Bồi Thường Tức Thời", "CLAIM_STATUS_RETRIEVED")

    # Nhánh Vector RAG Retrieval (Làn 5)
    b.draw_action(c5, 940, 660, 140, "5C. Vector Hóa Câu Hỏi (Query Embedding)", [
        "Chuyển đổi truy vấn thành vector không gian ngữ nghĩa 768 chiều",
        "Google Gemini models/embedding-004 (768-D) • Batch Token Size",
        "Dự phòng cấp 3: Deterministic Semantic Hash L2 khi mất mạng"
    ])
    b.draw_action(c5, 1120, 660, 140, "5D. Truy Vấn Chỉ Mục Tri Thức Lai (Hybrid Search)", [
        "Kết hợp Vector Cosine Similarity và Từ khóa chuyên ngành",
        "Score = CosineSim * 0.70 + ThesaurusKeywordBonus * 0.35",
        "Từ điển mở rộng: bồi thường, mất hàng, cước vượt cân, POD"
    ])
    b.draw_action(c5, 1290, 660, 130, "5E. Rerank & Lọc Ngưỡng Đoạn Tri Thức (Top-5)", [
        "Loại bỏ đoạn không liên quan, sắp xếp theo điểm tin cậy giảm dần",
        "Lọc ngưỡng nghiêm ngặt: Score >= 0.15 • Trích xuất Top-5 Chunks"
    ])
    b.draw_object_node(c5, 1425, 620, 70, "Tập Hợp Đoạn Tri Thức Quy Chuẩn", "Top-5 Chunks with Citations & Breadcrumbs")

    # -------------------------------------------------------------------------
    # GIAI ĐOẠN 3: ĐỒNG BỘ, GROUNDED PROMPT & LLM GENERATION (Y = 1420 -> 1880)
    # -------------------------------------------------------------------------
    # Join Bar tại Y = 1460
    b.draw_sync_bar(c3, 1460, length=260, orientation="h", thickness=8)

    b.draw_action(c3, 1580, 700, 150, "6. Ghép Nối Ngữ Cảnh Grounded Prompting", [
        "Ghép [DỮ LIỆU THỜI GIAN THỰC] + [TÀI LIỆU QUY CHUẨN TRÍCH XUẤT]",
        "Inject System Prompt: Luật Bưu chính Đ25, hạn mức bồi thường 30 Triệu",
        "Quy định nghiêm ngặt: Tuyệt đối không ảo giác, bắt buộc kèm trích dẫn"
    ])

    b.draw_decision(c3, 1740, 80, 80, label="Mô Hình LLM Sẵn Sàng?")

    # Nhánh Cloud LLM (Làn 5)
    b.draw_action(c5, 1740, 660, 150, "7A. Sinh Phản Hồi Ngữ Nghĩa Qua Cloud LLM", [
        "Gửi Prompt hoàn chỉnh tới Google Gemini Flash / GPT-4o-mini",
        "Thiết lập nhiệt độ kiểm soát ảo giác: Temperature = 0.2",
        "Tự động xâu chuỗi thông tin: Trạng thái đơn, biểu phí và chính sách"
    ])
    b.draw_action(c5, 1940, 660, 140, "7C. Cập Nhật Bộ Nhớ Đệm Tri Thức (Semantic Cache)", [
        "Lưu trữ cặp [Vector Query -> AI Response] vào Redis Semantic Cache",
        "Tối ưu chi phí API: Tái sử dụng câu trả lời cho câu hỏi tương đồng",
        "Ngưỡng tương đồng cosine cache hit: Score >= 0.95 (TTL: 7 ngày)"
    ])
    b.draw_object_node(c5, 2100, 620, 70, "Bộ Nhớ Đệm Phản Hồi Tri Thức (Semantic Cache)", "SEMANTIC_RESPONSE_CACHED")

    # Nhánh Fallback Cục Bộ (Làn 3)
    b.draw_action(c3, 1900, 700, 140, "7B. Kích Hoạt Dự Phòng Ngoại Tuyến (Zero-Downtime)", [
        "Zero-Downtime Semantic Fallback Engine & CSDL Quy định Cục bộ",
        "Trích xuất mẫu câu trả lời chuẩn từ tài liệu pháp lý có sẵn",
        "Bảo đảm phản hồi 100% không bị sập mạng, đầy đủ tính pháp lý"
    ])

    # Merge Node tại Y = 2040
    b.draw_merge(c3, 2040, 70, 70)

    # -------------------------------------------------------------------------
    # GIAI ĐOẠN 4: LÀM SẠCH ĐỊNH DẠNG, PHÁT SSE STREAM & CLIENT RENDERING (Y = 1940 -> 2250)
    # -------------------------------------------------------------------------
    b.draw_action(c3, 2160, 700, 130, "8. Làm Sạch Định Dạng & Phát Luồng SSE Stream", [
        "cleanBotFormatting(): Xóa backtick, chuẩn hóa bullet •, gộp dòng trống",
        "Server-Sent Events: event: metadata -> event: token (delay 25ms)",
        "Tạo DTO tương tác: ShipmentCardDto, ActionChipDto & CitationsDrawer"
    ])

    b.draw_action(c2, 2160, 620, 130, "9. BFF Proxy Stream SSE & Ghi Nhật Ký Audit Trail", [
        "Keep-Alive HTTP/2: Proxy trực tiếp token về Client",
        "Audit Log: Ghi nhận câu hỏi, độ trễ phản hồi (latency), số lượng token",
        "Prometheus APM: chatbot_requests_total, latency_seconds"
    ])

    b.draw_action(c1, 1960, 620, 140, "10. Lắng Nghe Sự Kiện SSE & Render Typing Effect", [
        "Frontend nhận token stream theo thời gian thực, hiệu ứng gõ mượt mà",
        "EventSource / Fetch Stream API: Đọc chunk nhị phân TextDecoder",
        "Tự động scroll khung chat, hỗ trợ dừng luồng phản hồi tức thời"
    ])
    b.draw_action(c1, 2140, 620, 130, "11. Hiển Thị Giao Diện Tương Tác Trực Quan", [
        "Render thẻ tương tác: Thẻ theo dõi đơn, Nút gợi ý thao tác tiếp theo",
        "Thành phần: ShipmentTrackingCard, ActionChips, CitationsDrawer",
        "Khách hàng bấm trực tiếp tra cứu chi tiết hoặc đánh giá câu trả lời"
    ])
    b.draw_final_node(c1, 2245, label="Hoàn tất truy vấn")

    # -------------------------------------------------------------------------
    # VẼ CÁC ĐƯỜNG KẾT NỐI MANHATTAN 90° (CONTROL & DATA FLOWS)
    # -------------------------------------------------------------------------
    # 1. Khởi đầu -> Action 1
    b.draw_arrow([(c1, 277), (c1, 310)])
    # 2. Action 1 -> Object Node
    b.draw_arrow([(c1, 450), (c1, 495)], is_dashed=True)
    # 3. Object Node -> Action 2A
    b.draw_arrow([(c1 + 290, 530), (740, 530), (740, 380), (c2 - 310, 380)])
    # 4. Action 2A -> Action 2B
    b.draw_arrow([(c2, 450), (c2, 480)])
    # 5. Action 2B -> Action 3
    b.draw_arrow([(c2 + 310, 550), (1420, 550), (1420, 380), (c3 - 350, 380)])
    # 6. Action 3 -> Action 4
    b.draw_arrow([(c3, 450), (c3, 495)])
    # 7. Action 4 -> Decision
    b.draw_arrow([(c3, 625), (c3, 690)])

    # 8. Decision -> Fork Bar (Phức hợp)
    b.draw_arrow([(c3, 770), (c3, 836)], guard="Truy Vấn Phức Hợp", guard_pos=(c3, 805))
    # 9. Decision -> Logistics Tools (Nhánh đơn lẻ, đi phía trên hành lang Y = 820)
    b.draw_arrow([(c3 - 40, 730), (1520, 730), (1520, 820), (c4 - 80, 820), (c4 - 80, 870)], guard="Tra Cứu Đơn / Giá", guard_pos=(1600, 715))
    # 10. Decision -> Vector RAG (Nhánh đơn lẻ, đi phía trên hành lang Y = 820)
    b.draw_arrow([(c3 + 40, 730), (2040, 730), (2040, 820), (c5 + 80, 820), (c5 + 80, 870)], guard="Hỏi Quy Chế / RAG", guard_pos=(1960, 715))

    # 11. Fork Bar -> Lane 4 & Lane 5 (Đồng thời)
    b.draw_arrow([(c3 - 80, 844), (c3 - 80, 855), (c4, 855), (c4, 870)])
    b.draw_arrow([(c3 + 80, 844), (c3 + 80, 855), (c5, 855), (c5, 870)])

    # 12. Lane 4: 5A -> 5B -> Object Node
    b.draw_arrow([(c4, 1010), (c4, 1050)])
    b.draw_arrow([(c4, 1190), (c4, 1250)], is_dashed=True)
    # 13. Object Node Lane 4 -> Join Bar
    b.draw_arrow([(c4, 1320), (c4, 1460), (c3 + 90, 1460)])

    # 14. Lane 5: 5C -> 5D -> 5E -> Object Node
    b.draw_arrow([(c5, 1010), (c5, 1050)])
    b.draw_arrow([(c5, 1190), (c5, 1225)])
    b.draw_arrow([(c5, 1355), (c5, 1390)], is_dashed=True)
    # 15. Object Node Lane 5 -> Join Bar
    b.draw_arrow([(c5, 1460), (c3 + 130, 1460)])

    # 16. Join Bar -> Action 6
    b.draw_arrow([(c3, 1464), (c3, 1505)])
    # 17. Action 6 -> Decision LLM
    b.draw_arrow([(c3, 1655), (c3, 1700)])

    # 18. Decision LLM -> 7A (Cloud LLM) - Đi qua hành lang Y = 1690 an toàn, KHÔNG cắt qua 5G
    b.draw_arrow([(c3 + 40, 1740), (1850, 1740), (1850, 1690), (c5 - 330, 1690)], guard="API Key Hợp Lệ", guard_pos=(2150, 1670))
    # 19. Decision LLM -> 7B (Fallback)
    b.draw_arrow([(c3, 1780), (c3, 1830)], guard="Mất Mạng / Hết Quota", guard_pos=(c3 + 85, 1805))

    # 20. 7A (Cloud LLM) -> Merge Node - Đi xuống hành lang X = 2840 rồi sang Merge tại Y = 2040, KHÔNG cắt 5G
    b.draw_arrow([(c5 - 330, 1760), (2840, 1760), (2840, 2040), (c3 + 35, 2040)])
    # 21. 7B (Fallback) -> Merge Node
    b.draw_arrow([(c3, 1970), (c3, 2007)])

    # 22. Merge Node -> Action 8 (Clean & SSE)
    b.draw_arrow([(c3, 2073), (c3, 2095)])
    # 23. Action 8 -> Action 9 (BFF Proxy)
    b.draw_arrow([(c3 - 350, 2160), (c2 + 310, 2160)])
    # 24. Action 9 -> Action 10 (Client SSE)
    b.draw_arrow([(c2 - 310, 2160), (740, 2160), (740, 1960), (c1 + 310, 1960)])
    # 25. Action 10 -> Action 11 (Interactive UI)
    b.draw_arrow([(c1, 2030), (c1, 2075)])
    # 26. Action 11 -> Final Node
    b.draw_arrow([(c1, 2205), (c1, 2223)])

    # Vẽ Legend
    b.draw_legend(y=2270)

    for p in out_paths:
        b.save(p)

# ==============================================================================
# 2. SƠ ĐỒ 2: ACT-KNOW-INGEST-02 - KNOWLEDGE CHUNKING & OFFLINE VECTOR INGESTION
# ==============================================================================
def generate_diagram_2(out_paths):
    b = VisualParadigmSvgBuilder(
        width=3600, height=2400,
        doc_id="ACT-KNOW-INGEST-02",
        title="SƠ ĐỒ HOẠT ĐỘNG: PHÂN ĐOẠN NGỮ NGHĨA (CHUNKING) & VECTOR HÓA TRI THỨC NGOẠI TUYẾN",
        subtitle="Đồ Án Tốt Nghiệp Kỹ Sư CNTT • Pipeline Nạp Tri Thức Logistics (docs/knowledge-base/) • Chuẩn Mô Hình Hóa OMG UML 2.5 / Visual Paradigm",
        spec="OMG UML 2.5 ACTIVITY DIAGRAM • 4 SWIMLANES • ULTRA-HIGH DENSITY SCALE"
    )

    # 4 Làn bơi: Mỗi làn 880px (Tổng = 3520, từ X = 40 -> 3560)
    lanes = [
        ("LÀN 1: CHUYÊN VIÊN NGHIỆP VỤ / QUẢN TRỊ VIÊN OPS", "Knowledge Curator • Quản lý SOP & Chính Sách Bưu Chính", 880),
        ("LÀN 2: BỘ PHÂN TÍCH CÚ PHÁP MARKDOWN (AST PARSER)", "Markdown Parser • Regex Quét Tiêu Đề Heading & Bảng", 880),
        ("LÀN 3: BỘ PHÂN MẢNH CỬA SỔ TRƯỢT (CHUNKER SERVICE)", "ChunkerService • Sliding Window Overlap 250/40 words", 880),
        ("LÀN 4: ĐỘNG CƠ VECTOR & LƯU TRỮ BỀN VỮNG", "Gemini Batch Embeddings • In-Memory Vector Store Heap", 880)
    ]
    b.draw_swimlanes(lanes, top_y=160, height=2090)

    c1, c2, c3, c4 = 480, 1360, 2240, 3120

    # -------------------------------------------------------------------------
    # GIAI ĐOẠN 1: SOẠN THẢO, GÁN NHÃN VÀ KÍCH HOẠT (LÀN 1: Y = 240 -> 800)
    # -------------------------------------------------------------------------
    b.draw_initial_node(c1, 260, label="Khởi tạo tài liệu")
    b.draw_action(c1, 380, 780, 140, "1. Biên Soạn 10 Bộ Quy Chuẩn Nghiệp Vụ (.md)", [
        "Soạn thảo biểu phí IATA, bảo hiểm Đ25, quy cách đóng gói 5cm, ngoại lệ",
        "Lưu trữ: docs/knowledge-base/ (01-pricing... đến 09-negative...)",
        "Định dạng Markdown tiêu chuẩn với cấu trúc phân cấp Heading H1-H4"
    ])
    b.draw_action(c1, 550, 780, 140, "2. Thẩm Định & Gán Nhãn Metadata Nghiệp Vụ", [
        "Xác thực tính pháp lý và hiệu lực của các điều khoản theo quy chuẩn",
        "Metadata Frontmatter: { category: \"SOP\", version: \"2026.1\", active: true }",
        "Phê duyệt hạn mức đền bù tối đa 30 Triệu và miễn trừ trách nhiệm"
    ])
    b.draw_action(c1, 720, 780, 130, "3. Kích Hoạt Tiến Trình Nạp Tri Thức Ngoại Tuyến", [
        "Thực thi script dòng lệnh hoặc kích hoạt qua API Quản trị viên hệ thống",
        "CLI: npm run ingest hoặc curl -X POST /api/v1/chat/ingest",
        "Khởi tạo đối tượng xử lý: KnowledgeService.reindexAll()"
    ])

    # Thêm các bước nâng cao phủ kín Lane 1
    b.draw_action(c1, 890, 780, 140, "3B. Thiết Lập Tham Số Cửa Sổ Trượt & Quy Tắc Cắt Đoạn", [
        "Cấu hình kích thước cửa sổ cắt: MaxWords = 250, Overlap = 40 từ",
        "Thiết lập quy tắc bảo toàn: Không chia cắt bảng biểu cước và điều khoản",
        "Ngưỡng phạt độ dài: Chunk tối thiểu >= 30 từ, tối đa <= 350 từ"
    ])
    b.draw_object_node(c1, 1050, 700, 70, "Cấu Hình Ingestion Tham Số Hóa (Preset)", "CHUNKING_PARAMETERS_APPLIED")

    b.draw_action(c1, 1210, 780, 140, "3C. Giám Sát Tiến Trình Nạp Tri Thức Qua SSE Stream", [
        "Lắng nghe tiến độ parse và embedding thời gian thực trên Web Admin",
        "EventSource: /api/v1/chat/ingest/progress • Hiển thị thanh tiến trình %",
        "Tự động cảnh báo lỗi định dạng cú pháp hoặc tệp tin bị hỏng"
    ])
    b.draw_object_node(c1, 1370, 700, 70, "Nhật Ký Tiến Độ Ingestion Thời Gian Thực", "PROGRESS_STREAMING_ACTIVE")

    # -------------------------------------------------------------------------
    # GIAI ĐOẠN 2: PARSE MARKDOWN & TRÍCH XUẤT SECTION (LÀN 2: Y = 700 -> 1450)
    # -------------------------------------------------------------------------
    b.draw_action(c2, 720, 780, 140, "4A. Quét Thư Mục & Đọc Dữ Liệu Markdown Thô", [
        "Quét đệ quy thư mục tài liệu nghiệp vụ, lọc các tệp đuôi .md",
        "fs.readdirSync(docsDir).filter(f => f.endsWith('.md') && !f.startsWith('readme'))",
        "Đọc toàn bộ văn bản thô UTF-8 và xác định đường dẫn thư mục tri thức"
    ])
    b.draw_object_node(c2, 890, 700, 70, "Tập Hợp Tài Liệu Nghiệp Vụ Bưu Chính Thô", "MarkdownFiles: 10 tệp SOP bưu chính thô")

    b.draw_action(c2, 1030, 780, 140, "4B. Phân Tích Cú Pháp AST Theo Dòng (Heading Regex)", [
        "Quét từng dòng văn bản, kiểm tra biểu thức chính quy nhận diện tiêu đề",
        "Heading Regex: /^#{1,4}\\s+(.+)$/ • Nhận diện cấp bậc H1, H2, H3, H4",
        "Tách biệt ranh giới Section độc lập, ngăn cắt đôi bảng cước và điều khoản"
    ])
    b.draw_action(c2, 1210, 780, 140, "4C. Trích Xuất Bảng Biểu & Danh Sách Đặc Thù", [
        "Nhận diện bảng Markdown (cột | dòng) và khối danh sách điều khoản",
        "Regex Table: /^\\|(.+)\\|$/ • Giữ nguyên khối bảng giá cước trọn vẹn",
        "Bảo toàn cấu trúc Markdown hoàn chỉnh để LLM đọc hiểu bảng"
    ])
    b.draw_object_node(c2, 1380, 700, 70, "Danh Sách Các Section Ngữ Nghĩa Độc Lập", "SemanticSections: [ { title, level, text } ]")

    b.draw_action(c2, 1550, 780, 140, "4D. Lọc Khử Ký Tự Nhiễu & Chuẩn Hóa Chuỗi Ký Tự", [
        "cleanMarkdownNoise(): Xóa bỏ tag HTML thừa, link hỏng và khoảng trắng kép",
        "Chuẩn hóa định dạng số, mã bưu chính và ký hiệu tiền tệ VNĐ",
        "Ngăn chặn lỗi parse token khi gửi sang mô hình Embedding API"
    ])
    b.draw_object_node(c2, 1710, 700, 70, "Dữ Liệu Văn Bản Sạch Chuẩn Hóa AST", "CLEAN_SECTIONS_NORMALIZED")

    # -------------------------------------------------------------------------
    # GIAI ĐOẠN 3: GOM CỤM & CỬA SỔ TRƯỢT OVERLAP (LÀN 3: Y = 700 -> 1800)
    # -------------------------------------------------------------------------
    b.draw_action(c3, 720, 780, 140, "5A. Khởi Tạo Bộ Đếm Từ & Phân Vùng Khối Nội Dung", [
        "Khởi tạo cấu trúc bộ đệm nội dung (Buffer Manager) trong bộ nhớ",
        "Tách từ tiếng Việt bằng Regex: words = text.split(/\\s+/).filter(Boolean)",
        "Thiết lập con trỏ sliding window bắt đầu từ vị trí wordIndex = 0"
    ])
    b.draw_object_node(c3, 890, 700, 70, "Bộ Đệm Phân Đoạn Sẵn Sàng (Word Buffer)", "WORD_BUFFER_INITIALIZED")

    b.draw_action(c3, 1030, 780, 140, "5. Gom Cụm Dữ Liệu & Bảo Lưu Breadcrumb Cha-Con", [
        "Trích xuất nội dung văn bản thuần, lưu trữ đường dẫn breadcrumb phân cấp",
        "currentBuffer.join('\\n').trim() • Breadcrumb: Tiêu đề Cha > Tiêu đề Con",
        "Đếm tổng số từ: words = section.text.split(/\\s+/).filter(Boolean)"
    ])

    b.draw_decision(c3, 1200, 80, 80, label="Độ Dài Đoạn Văn Bản W <= 250 Từ?")

    b.draw_action(c3 - 200, 1350, 370, 130, "6A. Đóng Gói Single Chunk", [
        "Bảo toàn nguyên vẹn bảng biểu cước",
        "tokenEstimate = round(words * 1.3)",
        "Không chia cắt điều khoản pháp lý"
    ])
    b.draw_action(c3 + 200, 1350, 370, 130, "6B. Cắt Cửa Sổ Trượt Overlap", [
        "Cắt đoạn 250 từ, lùi gối đầu 40 từ",
        "Start += (MaxWords - OverlapWords)",
        "Gắn nhãn Breadcrumb: Tiêu đề (phần n)"
    ])

    b.draw_merge(c3, 1490, 70, 70)

    b.draw_action(c3, 1610, 780, 140, "7. Đóng Gói Metadata Mảng KnowledgeChunk[]", [
        "Gán UUID duy nhất, số thứ tự chunkSeq và siêu dữ liệu chuyên ngành",
        "chunkId = fileName#chunk-seq • tokenCount • sourcePath • createdAt",
        "Tổng hợp toàn bộ mảng Chunks sẵn sàng cho bước tạo Vector nhúng"
    ])
    b.draw_object_node(c3, 1760, 700, 70, "Tập Hợp Phân Đoạn Tri Thức Chuẩn Hóa", "KnowledgeChunks[]: Mảng chứa 142 Chunks chuẩn")

    # -------------------------------------------------------------------------
    # GIAI ĐOẠN 4: VECTOR EMBEDDING & LƯU TRỮ (LÀN 4: Y = 700 -> 2100)
    # -------------------------------------------------------------------------
    b.draw_action(c4, 720, 780, 140, "8A. Xác Thực Kết Nối Gemini API & Kiểm Tra Quota", [
        "Kiểm tra biến môi trường process.env.GEMINI_API_KEY trong hệ thống",
        "Gửi yêu cầu ping thử nghiệm xác định kết nối mạng ra internet",
        "Tự động chuyển chế độ Offline Hash nếu mất kết nối hoặc hết quota"
    ])
    b.draw_object_node(c4, 890, 700, 70, "Trạng Thái Sẵn Sàng Của Động Cơ Vector", "EMBEDDING_ENGINE_READY")

    b.draw_action(c4, 1030, 780, 140, "8B. Tải Chỉ Mục Vector Cũ Lên RAM Để Đối Chiếu", [
        "Đọc docs/knowledge-base/vector-index.json nếu tệp tin đã tồn tại",
        "Lập bản đồ tra cứu theo chunkId để giữ nguyên vector cũ không đổi",
        "Bảo đảm tính liên tục của dữ liệu và tối ưu thời gian xử lý"
    ])

    b.draw_action(c4, 1200, 780, 130, "8. Đánh Giá Khóa API Gemini & Cấu Hình Nhúng", [
        "Xác định chế độ sinh vector: Kết nối API Google Cloud hay Ngoại tuyến",
        "process.env.GEMINI_API_KEY ? CLOUD_EMBEDDING : OFFLINE_DETERMINISTIC"
    ])

    b.draw_decision(c4, 1360, 80, 80, label="Có Khóa API Gemini & Online?")

    b.draw_action(c4 - 200, 1510, 370, 130, "9A. Gọi Gemini Batch API", [
        "batchEmbedContents (768 Dimensions)",
        "Xử lý hàng loạt toàn bộ Chunks trong 1 lượt",
        "Hiệu năng cao, độ trễ nhúng cực thấp"
    ])
    b.draw_action(c4 + 200, 1510, 370, 130, "9B. Băm Ngữ Nghĩa Nội Bộ", [
        "Deterministic Semantic Hash (768-D L2)",
        "Tạo vector cục bộ không phụ thuộc mạng",
        "Bảo đảm zero-downtime trong mọi hoàn cảnh"
    ])

    b.draw_merge(c4, 1650, 70, 70)

    b.draw_action(c4, 1780, 780, 140, "9C. Ghi File Bền Vững Ra Ổ Đĩa (vector-index.json)", [
        "Tuần tự hóa toàn bộ vector embedding và metadata ra tệp tin JSON tĩnh",
        "saveIndex(chunks, dimensions=768) -> docs/knowledge-base/vector-index.json",
        "Kích thước tệp tin tối ưu: ~850KB, cho phép commit vào Git repo"
    ])
    b.draw_action(c4, 1950, 780, 140, "9D. Nạp Bộ Nhớ Đệm RAM Heap & Khởi Động Tra Cứu", [
        "Nạp chỉ mục trực tiếp vào mảng in-memory trong RAM của Node.js Process",
        "VectorStoreService.loadIndex(): Vector hóa sẵn sàng trong bộ nhớ RAM",
        "Tốc độ tìm kiếm Cosine Similarity: < 2ms cho toàn bộ 142 chunks"
    ])

    # -------------------------------------------------------------------------
    # GIAI ĐOẠN 5: KIỂM THỬ, BÁO CÁO & HOÀN TẤT (LÀN 1: Y = 1950 -> 2250)
    # -------------------------------------------------------------------------
    b.draw_action(c1, 1950, 780, 140, "10. Nhận Báo Cáo Thống Kê & Kiểm Thử Chỉ Mục", [
        "Xem tổng kết số lượng tài liệu đã nạp, số đoạn chunk và dung lượng index",
        "Thống kê: 10 Files -> 142 Chunks • Tỷ lệ phủ: 100% • Độ trễ: 1.8ms",
        "Thực hiện câu hỏi thử nghiệm tra cứu kiểm tra độ chính xác (Precision@5)"
    ])
    b.draw_action(c1, 2130, 780, 130, "11. Sẵn Sàng Phục Vụ Truy Vấn Trực Tuyến", [
        "Toàn bộ tri thức mới có hiệu lực ngay lập tức, không cần khởi động lại app",
        "Trạng thái hệ thống: KNOWLEDGE_STORE_ACTIVE (Zero-Downtime Hot Reload)"
    ])
    b.draw_final_node(c1, 2245, label="Hoàn tất nạp tri thức")

    # -------------------------------------------------------------------------
    # KẾT NỐI LUỒNG MANHATTAN 90°
    # -------------------------------------------------------------------------
    # Lane 1: Khởi đầu -> 1 -> 2 -> 3
    b.draw_arrow([(c1, 277), (c1, 310)])
    b.draw_arrow([(c1, 450), (c1, 480)])
    b.draw_arrow([(c1, 620), (c1, 655)])
    # 3 -> 4A (Lane 2)
    b.draw_arrow([(c1 + 390, 720), (c2 - 390, 720)])
    # Lane 2: 4A -> Object Node -> 4B -> 4C -> Object Node
    b.draw_arrow([(c2, 790), (c2, 855)], is_dashed=True)
    b.draw_arrow([(c2, 925), (c2, 960)])
    b.draw_arrow([(c2, 1100), (c2, 1140)])
    b.draw_arrow([(c2, 1280), (c2, 1345)], is_dashed=True)
    # Object Node -> 5 (Lane 3)
    b.draw_arrow([(c2 + 350, 1380), (1800, 1380), (1800, 1030), (c3 - 390, 1030)])
    # Lane 3: 5 -> Decision
    b.draw_arrow([(c3, 1100), (c3, 1160)])
    # Decision -> 6A & 6B
    b.draw_arrow([(c3 - 40, 1200), (c3 - 200, 1200), (c3 - 200, 1285)], guard="W <= 250 từ", guard_pos=(c3 - 120, 1180))
    b.draw_arrow([(c3 + 40, 1200), (c3 + 200, 1200), (c3 + 200, 1285)], guard="W > 250 từ", guard_pos=(c3 + 120, 1180))
    # 6A & 6B -> Merge
    b.draw_arrow([(c3 - 200, 1415), (c3 - 200, 1490), (c3 - 35, 1490)])
    b.draw_arrow([(c3 + 200, 1415), (c3 + 200, 1490), (c3 + 35, 1490)])
    # Merge -> 7 -> Object Node
    b.draw_arrow([(c3, 1525), (c3, 1540)])
    b.draw_arrow([(c3, 1680), (c3, 1725)], is_dashed=True)
    # Object Node -> 8 (Lane 4)
    b.draw_arrow([(c3 + 350, 1760), (2680, 1760), (2680, 1200), (c4 - 390, 1200)])
    # Lane 4: 8 -> Decision
    b.draw_arrow([(c4, 1265), (c4, 1320)])
    # Decision -> 9A & 9B
    b.draw_arrow([(c4 - 40, 1360), (c4 - 200, 1360), (c4 - 200, 1445)], guard="Có API Key", guard_pos=(c4 - 120, 1340))
    b.draw_arrow([(c4 + 40, 1360), (c4 + 200, 1360), (c4 + 200, 1445)], guard="Offline / No Key", guard_pos=(c4 + 120, 1340))
    # 9A & 9B -> Merge
    b.draw_arrow([(c4 - 200, 1575), (c4 - 200, 1650), (c4 - 35, 1650)])
    b.draw_arrow([(c4 + 200, 1575), (c4 + 200, 1650), (c4 + 35, 1650)])
    # Merge -> 9C -> 9D
    b.draw_arrow([(c4, 1685), (c4, 1710)])
    b.draw_arrow([(c4, 1850), (c4, 1880)])
    # 9D -> 10 (Quay về Lane 1)
    b.draw_arrow([(c4 - 390, 1950), (c1 + 390, 1950)])
    # Lane 1: 10 -> 11 -> Final Node
    b.draw_arrow([(c1, 2020), (c1, 2065)])
    b.draw_arrow([(c1, 2195), (c1, 2223)])

    # Legend
    b.draw_legend(y=2270)

    for p in out_paths:
        b.save(p)

# ==============================================================================
# 3. SƠ ĐỒ 3: ACT-SHIP-03 - SHIPMENT LIFECYCLE & MULTI-HUB LINEHAUL DISPATCH
# ==============================================================================
def generate_diagram_3(out_paths):
    b = VisualParadigmSvgBuilder(
        width=3600, height=2400,
        doc_id="ACT-SHIP-03",
        title="SƠ ĐỒ HOẠT ĐỘNG: VÒNG ĐỜI VẬN ĐƠN & ĐIỀU PHỐI LOGISTICS TRUNG CHUYỂN ĐA HUB",
        subtitle="Đồ Án Tốt Nghiệp Kỹ Sư CNTT • Quy Trình Vận Hành Bưu Chính Lõi (SOP Bưu Cục, Xe Tải Linehaul & Giao Hàng Cuối) • Chuẩn OMG UML 2.5",
        spec="OMG UML 2.5 ACTIVITY DIAGRAM • 5 SWIMLANES • ULTRA-HIGH DENSITY SCALE"
    )

    # 5 Làn bơi: Mỗi làn 704px (Tổng = 3520, từ X = 40 -> 3560)
    lanes = [
        ("LÀN 1: KHÁCH GỬI (MERCHANT / SHOP)", "Tạo đơn hàng • In nhãn A6/A7 • Nhận tiền COD", 704),
        ("LÀN 2: DỊCH VỤ VẬN ĐƠN & TÍNH CƯỚC", "shipment-service :3002 • pricing-service :3012", 704),
        ("LÀN 3: ĐIỀU PHỐI & BƯU TÁ (COURIER)", "dispatch :3004 • courier-mobile • POD OTP", 704),
        ("LÀN 4: BƯU CỤC GỐC & HUB KHAI THÁC", "station :3006 • manifest • Cân DWS • Kẹp seal", 704),
        ("LÀN 5: VẬN TẢI TUYẾN CHÍNH & HUB ĐÍCH", "linehaul-service :3014 • Xe tải trung chuyển", 704)
    ]
    b.draw_swimlanes(lanes, top_y=160, height=2090)

    c1 = 40 + 352
    c2 = 40 + 704 + 352
    c3 = 40 + 1408 + 352
    c4 = 40 + 2112 + 352
    c5 = 40 + 2816 + 352

    # -------------------------------------------------------------------------
    # GIAI ĐOẠN 1: TẠO ĐƠN, TÍNH CƯỚC & GÁN SHIPPER (Y = 240 -> 800)
    # -------------------------------------------------------------------------
    b.draw_initial_node(c1, 260, label="Khởi tạo đơn gửi")
    b.draw_action(c1, 380, 630, 140, "1. Tạo Yêu Cầu Gửi Hàng Trên Web / App", [
        "Nhập thông tin người nhận, địa chỉ, số điện thoại, tiền COD",
        "POST /api/v1/shipments • Auth: Bearer Token Merchant",
        "Hình thức thanh toán: Người gửi trả ngay hoặc Người nhận trả"
    ])
    b.draw_action(c1, 550, 630, 130, "2. Nhập Kích Thước & In Vận Đơn Khổ A6/A7", [
        "Nhập chiều Dài x Rộng x Cao (cm) và khối lượng ước tính",
        "In tem bưu chính: Barcode Code128 / QR Code chuẩn quốc gia"
    ])

    # Bổ sung các bước nghiệp vụ nâng cao độ phủ Lane 1
    b.draw_action(c1, 720, 630, 140, "2B. Bàn Giao Kiện Hàng Cho Bưu Tá & Ký Xác Nhận", [
        "Bưu tá đến kho shop lấy hàng, đối soát mã bưu chính trên tem A6/A7",
        "Ký biên bản bàn giao điện tử (Digital Handover) trên ứng dụng",
        "Trạng thái shop: HANDOVER_CONFIRMED • Nhận phiếu tức thời"
    ])
    b.draw_object_node(c1, 880, 580, 70, "Biên Bản Bàn Giao Hàng Thu Gom", "MERCHANT_HANDOVER_CONFIRMED")

    b.draw_action(c1, 1040, 630, 140, "2C. Giám Sát Cảnh Báo Lệch Trọng Lượng DWS", [
        "Nhận thông báo khi cổng DWS tại bưu cục phát hiện sai lệch",
        "Nếu lệch >15%: Hệ thống tự động khấu trừ ví cước điện tử",
        "Shop có quyền khiếu nại online kèm ảnh chụp kích thước ban đầu"
    ])
    b.draw_object_node(c1, 1200, 580, 70, "Phiếu Xử Lý Chênh Lệch Cước DWS", "DWS_ADJUSTMENT_RESOLVED")

    b.draw_action(c1, 1370, 630, 140, "2D. Xử Lý Báo Cáo Sự Cố Giao Hàng & Đặt Lịch NDR", [
        "Nhận thông báo khi shipper báo phát không thành công (Vắng mặt)",
        "Merchant chủ động liên hệ người mua: Chọn Giao lại / Chuyển hoàn",
        "POST /api/v1/shipments/ndr-action • Cập nhật chỉ dẫn trong 24h"
    ])
    b.draw_object_node(c1, 1530, 580, 70, "Lệnh Chỉ Dẫn Xử Lý NDR Merchant", "NDR_INSTRUCTION_COMMITTED")

    # Lane 2 (Dịch vụ Vận đơn & Tính cước)
    b.draw_action(c2, 380, 630, 140, "3. Động Cơ Định Giá Chuẩn Hóa IATA V/6000", [
        "Quy đổi khối lượng thể tích: Thể tích = (D x R x C) / 6000 kg",
        "Cân nặng tính cước = max(Khối lượng thực, Thể tích quy đổi)",
        "Tính cước 3 vùng: Nội tỉnh (0đ), Trục chính (+7k), Liên tỉnh (+12k)"
    ])
    b.draw_action(c2, 550, 630, 140, "4. Cấp Mã Vận Đơn & Lưu CSDL PostgreSQL", [
        "Cấp mã tiêu chuẩn quốc gia NX-XXXXXX (10-14 chữ số)",
        "Lưu bản ghi vào PostgreSQL • Khởi tạo trạng thái CREATED",
        "Phát sự kiện (Domain Event): shipment.created qua RabbitMQ"
    ])
    b.draw_object_node(c2, 700, 580, 70, "Hồ Sơ Vận Đơn Bưu Chính Mới", "Shipment Status: CREATED")

    # Bổ sung các bước nghiệp vụ nâng cao độ phủ Lane 2
    b.draw_action(c2, 870, 630, 140, "4B. Phát Sự Kiện Nghiệp Vụ Ra Hàng Đợi RabbitMQ", [
        "Publish Domain Event: exchange: logistics.events • shipment.created",
        "Kích hoạt các consumer: Hệ thống điều phối bưu tá và cổng SMS",
        "Đảm bảo kiến trúc hướng sự kiện (EDA) bất đồng bộ, chịu tải cao"
    ])
    b.draw_object_node(c2, 1030, 580, 70, "Sự Kiện Bưu Chính Đã Xuất Bản", "SHIPMENT_CREATED_PUBLISHED")

    b.draw_action(c2, 1200, 630, 140, "4C. Động Cơ Audit Cước Phạt DWS & Cập Nhật Sổ Cái", [
        "Nhận dữ liệu cân tự động từ cổng DWS bưu cục phát (Station :3006)",
        "Tính toán lại cước: newFee = calculateFee(dwsWeight)",
        "Tạo giao dịch trừ ví: TRANSACTION_TYPE: DWS_PENALTY_SURCHARGE"
    ])
    b.draw_object_node(c2, 1360, 580, 70, "Bản Ghi Trừ Cước Phí Tự Động", "DWS_SURCHARGE_APPLIED")

    b.draw_action(c2, 1520, 630, 140, "4D. Phân Tuyến Lộ Trình Linehaul Tối Ưu (Router)", [
        "Xác định chuỗi Hub trung chuyển tối ưu theo ma trận cự ly GIS",
        "Gán mã luồng: Origin_Station -> Hub_Phat -> Hub_Dich -> Dest_Station",
        "SLA cam kết: Nội thành 12h, Liên tỉnh tuyến trục Bắc-Nam 48h"
    ])
    b.draw_object_node(c2, 1680, 580, 70, "Lộ Trình Trung Chuyển Tuyến Trục", "OPTIMAL_LINEHAUL_ROUTED")

    # -------------------------------------------------------------------------
    # GIAI ĐOẠN 2: THU GOM & CÂN QUÉT DWS TẠI BƯU CỤC (Y = 700 -> 1180)
    # -------------------------------------------------------------------------
    b.draw_action(c3, 700, 630, 140, "5. Thuật Toán Auto-Dispatch Gán Shipper", [
        "Quét bán kính bưu tá gần nhất theo phân tuyến bưu cục",
        "Tự động phân công nhiệm vụ lấy hàng: Trạng thái TASK_ASSIGNED",
        "Thông báo đẩy (Push Notification) đến app di động bưu tá"
    ])
    b.draw_action(c3, 870, 630, 140, "6. Bưu Tá Tiếp Nhận & Xác Nhận Thu Gom", [
        "Bưu tá đến địa chỉ người gửi, kiểm tra ngoại quan kiện hàng",
        "Dán nhãn barcode và tem HÀNG DỄ VỠ (nếu có)",
        "Quét barcode xác nhận lấy: Chuyển trạng thái PICKUP_COMPLETED"
    ])
    b.draw_object_node(c3, 1020, 580, 70, "Kiện Hàng Đã Được Thu Gom", "Shipment Status: PICKUP_COMPLETED")

    b.draw_action(c3, 1180, 630, 140, "6C. Vận Chuyển Hàng Thu Gom Về Bưu Cục Phát", [
        "Shipper gom toàn bộ kiện trong ca, di chuyển về bưu cục quản lý",
        "Quét mã bàn giao tại cửa tiếp nhận cho thủ kho bưu cục",
        "Cập nhật trạng thái lô hàng thu gom: PICKUP_TRANSIT_TO_STATION"
    ])
    b.draw_object_node(c3, 1340, 580, 70, "Lô Hàng Thu Gom Nhập Cửa Bưu Cục Phát", "READY_FOR_DWS_SCANNING")

    b.draw_action(c4, 870, 630, 140, "7. Bưu Cục Gốc Tiếp Nhận & Cân Quét DWS", [
        "Bưu tá bàn giao kiện hàng về bưu cục xuất phát (Origin Station)",
        "Cổng DWS cân quét tự động trọng lượng & kích thước 3 chiều",
        "Nếu lệch >15%: Tự động truy thu cước phạt • SCAN_INBOUND"
    ])

    b.draw_decision(c4, 1050, 80, 80, label="Tuyến Vận Chuyển?")

    # -------------------------------------------------------------------------
    # GIAI ĐOẠN 3: ĐÓNG BAO MANIFEST & TRUNG CHUYỂN LINEHAUL (Y = 1180 -> 1720)
    # -------------------------------------------------------------------------
    b.draw_action(c4, 1200, 630, 140, "8A. Đóng Bao Manifest & Kẹp Chì Tem Seal", [
        "Gom các bưu kiện cùng tuyến đích vào bao tải trung chuyển",
        "Cấp mã tem bao bưu phẩm và kẹp chì niêm phong an toàn",
        "Cập nhật trạng thái nghiệp vụ: MANIFEST_SEALED"
    ])
    b.draw_object_node(c4, 1360, 580, 70, "Bao Bưu Kiện Đã Đóng Niêm Phong", "Manifest Status: MANIFEST_SEALED")

    b.draw_action(c4, 1520, 630, 140, "8F. Bắn Barcode Bàn Giao Bao Hàng Cho Xe Tuyến Trục", [
        "Thủ kho xuất phát đối soát danh sách bao kiện với tài xế xe tải",
        "Quét mã tem seal niêm phong, ký biên bản bàn giao điện tử",
        "Cập nhật trạng thái kiện hàng trong bao: LINEHAUL_DISPATCHED"
    ])
    b.draw_object_node(c4, 1680, 580, 70, "Biên Bản Bàn Giao Xe Tải Tuyến Trục", "MANIFEST_HANDOVER_COMPLETE")

    b.draw_action(c5, 1200, 630, 140, "8B. Bốc Xếp Lên Xe Tải Tuyến Chính Linehaul", [
        "Quét mã tem bao và tem kiện rời đưa lên thùng xe tải Linehaul",
        "Quét tem xe tải trung chuyển (Mã xe XT) và ghi nhận SEND_GOODS",
        "Kẹp chì tem seal niêm phong cửa thùng xe, chụp ảnh bàn giao"
    ])
    b.draw_action(c5, 1380, 630, 140, "8C. Xe Lăn Bánh & Giám Sát GPS Hành Trình", [
        "Xe tải trung chuyển khởi hành xuất phát theo lịch trình cố định",
        "Cập nhật trạng thái vận đơn bưu chính toàn bộ lô: IN_TRANSIT",
        "Hệ thống IoT / GPS truyền tọa độ thực thời về trung tâm"
    ])
    b.draw_action(c5, 1560, 630, 140, "8D. Xe Đến Hub Đích & Mở Bao Phân Tuyến", [
        "Xe tải cập bến Hub dỡ hàng: Đối chứng tem seal cửa thùng xe",
        "Quét dỡ hàng nhập kho Hub phát: Cập nhật SCAN_INBOUND",
        "Gỡ bao niêm phong Manifest và phân chia kiện về trạm phát"
    ])

    b.draw_action(c5, 1740, 630, 140, "8G. Băng Chuyền Phân Tuyến Về Trạm Phát Vệ Tinh", [
        "Hệ thống camera quét barcode đa hướng trên băng chuyền tự động",
        "Cánh tay cơ học gạt kiện vào máng trượt tương ứng với bưu cục phát",
        "Cập nhật: SORTED_TO_DESTINATION_STATION (Chờ xe trung chuyển)"
    ])
    b.draw_object_node(c5, 1900, 580, 70, "Bưu Kiện Đã Phân Tuyến Sẵn Sàng Giao", "READY_FOR_LAST_MILE_DELIVERY")

    # -------------------------------------------------------------------------
    # GIAI ĐOẠN 4: XUẤT KHO PHÁT, GIAO HÀNG TẬN NƠI & ĐỐI SOÁT COD (Y = 1720 -> 2250)
    # -------------------------------------------------------------------------
    b.draw_merge(c3, 1720, 70, 70)

    b.draw_action(c3, 1850, 630, 140, "9. Xuất Kho & Phân Công Giao Hàng Tận Nơi", [
        "Phân công bưu tá tuyến giao phụ trách, tải danh sách lên app",
        "Xuất kho bưu cục phát: Cập nhật trạng thái OUT_FOR_DELIVERY",
        "Gửi tin SMS / Zalo tới người nhận về mã vận đơn"
    ])
    b.draw_action(c3, 2030, 630, 140, "10. Giao Hàng Tận Tay, Thu COD & Xác Thực OTP", [
        "Bưu tá giao hàng tận nhà, thu tiền COD và xác thực mã OTP 6 số",
        "Chụp ảnh bằng chứng phát hàng (POD) kèm chữ ký điện tử",
        "Cập nhật trạng thái đơn hàng thành công: DELIVERED"
    ])

    b.draw_action(c2, 1850, 630, 140, "11. Cập Nhật Sổ Cái Trạng Thái & Lịch Sử", [
        "Ghi nhận nhật ký di chuyển (Audit Trail) cho từng lần quét mã",
        "Append tracking_history: { timestamp, hub_id, action }",
        "Đồng bộ tức thời lên Redis Cache để phục vụ API tra cứu"
    ])

    b.draw_action(c1, 1850, 630, 140, "12. Theo Dõi Tiến Độ Thực Thời & Nhận Webhook", [
        "Nhận thông báo trạng thái qua WebSocket & Push Event",
        "Tracking: PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY",
        "Xem vị trí shipper trên bản đồ số và thời gian giao dự kiến"
    ])
    b.draw_action(c1, 2030, 630, 130, "13. Đối Soát Tiền Thu Hộ COD & Hoàn Tất", [
        "Hệ thống tự động đối soát tiền COD vào ví điện tử của shop",
        "Status: COMPLETED • Giao dịch tài chính: COD_RECONCILED",
        "Shop nhận hóa đơn điện tử cước phí vận chuyển hoàn chỉnh"
    ])
    b.draw_final_node(c1, 2245, label="Vận đơn hoàn tất")

    # -------------------------------------------------------------------------
    # KẾT NỐI LUỒNG MANHATTAN 90° (ZERO COLLISION)
    # -------------------------------------------------------------------------
    # Lane 1: Khởi đầu -> 1 -> 2
    b.draw_arrow([(c1, 277), (c1, 310)])
    b.draw_arrow([(c1, 450), (c1, 485)])
    # 2 -> 3 (Lane 2)
    b.draw_arrow([(c1 + 315, 550), (740, 550), (740, 380), (c2 - 315, 380)])
    # Lane 2: 3 -> 4 -> Object Node
    b.draw_arrow([(c2, 450), (c2, 480)])
    b.draw_arrow([(c2, 620), (c2, 665)], is_dashed=True)
    # Object Node -> 5 (Lane 3)
    b.draw_arrow([(c2 + 290, 700), (c3 - 315, 700)])
    # Lane 3: 5 -> 6 -> Object Node
    b.draw_arrow([(c3, 770), (c3, 800)])
    b.draw_arrow([(c3, 940), (c3, 985)], is_dashed=True)
    # Object Node -> 7 (Lane 4)
    b.draw_arrow([(c3 + 290, 1020), (2150, 1020), (2150, 870), (c4 - 315, 870)])
    # Lane 4: 7 -> Decision
    b.draw_arrow([(c4, 940), (c4, 1010)])
    # Decision -> 8A (Liên tỉnh)
    b.draw_arrow([(c4, 1090), (c4, 1130)], guard="Liên Tỉnh / Qua Hub", guard_pos=(c4 + 110, 1105))
    
    # Decision -> Merge (Nội tỉnh / Cùng trạm phát: đi trong hành lang X = 2140 an toàn, KHÔNG cắt Object Node 3.3)
    b.draw_arrow([(c4 - 40, 1050), (2140, 1050), (2140, 1720), (c3 + 35, 1720)], guard="Nội Tỉnh / Cùng Trạm Phát", guard_pos=(2300, 1030))

    # Lane 4: 8A -> Object Node
    b.draw_arrow([(c4, 1270), (c4, 1325)], is_dashed=True)
    # Object Node -> 8B (Lane 5)
    b.draw_arrow([(c4 + 290, 1360), (2840, 1360), (2840, 1200), (c5 - 315, 1200)])
    # Lane 5: 8B -> 8C -> 8D
    b.draw_arrow([(c5, 1270), (c5, 1310)])
    b.draw_arrow([(c5, 1450), (c5, 1490)])
    # 8D -> Merge (Lane 3: đi qua hành lang X = 2855 xuống Y = 1735 rồi vào Merge, KHÔNG cắt qua 8F)
    b.draw_arrow([(c5 - 315, 1560), (2855, 1560), (2855, 1735), (c3 + 35, 1735), (c3 + 35, 1720)])
    
    # Merge -> 9 -> 10
    b.draw_arrow([(c3, 1755), (c3, 1780)])
    b.draw_arrow([(c3, 1920), (c3, 1960)])

    # Luồng tuần tự cập nhật & thông báo: 9 (Lane 3) -> 11 (Lane 2) -> 12 (Lane 1)
    b.draw_arrow([(c3 - 315, 1850), (c2 + 315, 1850)])
    b.draw_arrow([(c2 - 315, 1850), (c1 + 315, 1850)])
    
    # Luồng thanh toán: 10 (Lane 3, Y=2030) -> 13 (Lane 1, Y=2030)
    b.draw_arrow([(c3 - 315, 2030), (c1 + 315, 2030)], guard="Đối Soát COD", guard_pos=(c2, 2010))
    
    # Lane 1: 12 -> 13 -> Final Node
    b.draw_arrow([(c1, 1920), (c1, 1965)])
    b.draw_arrow([(c1, 2095), (c1, 2223)])

    # Legend
    b.draw_legend(y=2270)

    for p in out_paths:
        b.save(p)

if __name__ == "__main__":
    print("Generating Ultra-High-Density Visual Paradigm Standard Activity Diagrams...")

    # Diagram 1
    generate_diagram_1([
        "docs/graduation-thesis/diagrams/activity/01-activity-ai-chatbot-runtime-rag.svg",
        "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/01-activity-ai-chatbot-runtime-rag.svg",
        "docs/graduation-thesis/diagrams/activity/01-activity-chunking-and-chatbot-runtime.svg"
    ])

    # Diagram 2
    generate_diagram_2([
        "docs/graduation-thesis/diagrams/activity/02-activity-knowledge-chunking-and-ingestion.svg",
        "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/02-activity-knowledge-chunking-and-ingestion.svg"
    ])

    # Diagram 3
    generate_diagram_3([
        "docs/graduation-thesis/diagrams/activity/03-activity-shipment-order-dispatch-lifecycle.svg",
        "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/03-activity-shipment-order-dispatch-lifecycle.svg"
    ])

    print("All Ultra-High-Density Activity Diagrams generated successfully!")
