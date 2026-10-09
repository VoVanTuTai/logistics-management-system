#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE MINIMALIST ENTERPRISE SYSTEM ARCHITECTURE BLUEPRINT (AI RAG & LOGISTICS)
================================================================================
Bản vẽ Kỹ thuật Thiết kế Kiến trúc Hệ thống Tối giản & Chuẩn mực (Minimalist Enterprise Blueprint)
Mã bản vẽ: ARCH-AI-RAG-03 • Figma Page 2: Section 2.3 (3600 x 2400 px).

TRIỆT TIÊU 100% CẢM GIÁC RỐI MẮT & KHUNG Ô KẺ DÀY ĐẶC:
- KHÔNG lưới ô vuông nền (Zero Background Grid Noise). Nền trắng #FFFFFF tinh khiết.
- KHÔNG lồng hộp trong hộp (Zero Nested Boxes). Mỗi component là 1 thẻ phẳng đơn nhất.
- KHÔNG dùng thanh tiêu đề đen kịt trên từng thẻ con gây xung đột thị giác.
- Sử dụng phân vùng mềm (Soft-tinted Architectural Zones: #F8FAFC viền mỏng #E2E8F0).
- Các đường truyền Manhattan thông thoáng, không chồng chéo, có nhãn giao thức rõ nét.
- 4 Hình trụ 3D Database Cylinders chuẩn kỹ thuật cho các kho dữ liệu thực tế.
- Chữ to rõ ràng (16px - 22px), dễ đọc ở mọi tỉ lệ thu phóng.
- 100% Native Inline Vector (Zero <marker> tags), Strict XML Well-Formedness.
"""

import os
import xml.etree.ElementTree as ET

def xml_esc(s):
    if s is None:
        return ""
    if not isinstance(s, str):
        s = str(s)
    return (str(s)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&apos;"))

def draw_arrow(x, y, direct="right", color="#0F172A", size=14):
    """Vẽ mũi tên inline native vector chuẩn xác, không dùng thẻ <marker>."""
    w = size * 0.45
    if direct == "right":
        return f'<polygon points="{x},{y} {x-size},{y-w} {x-size},{y+w}" fill="{color}"/>'
    elif direct == "left":
        return f'<polygon points="{x},{y} {x+size},{y-w} {x+size},{y+w}" fill="{color}"/>'
    elif direct == "down":
        return f'<polygon points="{x},{y} {x-w},{y-size} {x+w},{y-size}" fill="{color}"/>'
    elif direct == "up":
        return f'<polygon points="{x},{y} {x-w},{y+size} {x+w},{y+size}" fill="{color}"/>'
    return ""

def draw_pill(cx, cy, text, w=220, h=30, bg="#FFFFFF", stroke="#0F172A", color="#0F172A", font_size=13):
    """Vẽ nhãn giao thức có nền bo tròn bảo vệ trên các xa lộ dữ liệu."""
    res = []
    res.append(f'  <rect x="{cx - w/2}" y="{cy - h/2}" width="{w}" height="{h}" fill="{bg}" stroke="{stroke}" stroke-width="1.4" rx="6"/>')
    res.append(f'  <text x="{cx}" y="{cy + 4.5}" font-family="ui-monospace, Menlo, monospace" font-size="{font_size}px" font-weight="800" fill="{color}" text-anchor="middle">{xml_esc(text)}</text>')
    return '\n'.join(res)

def draw_cylinder(x, y, w, h, title, subtitle="", port="", tag="", ry=14):
    """Vẽ hình trụ CSDL 3D chuẩn kỹ thuật với bóng đổ thanh thoát."""
    res = []
    # Body
    res.append(f'    <path d="M {x} {y + ry} L {x} {y + h - ry} A {w/2} {ry} 0 0 0 {x + w} {y + h - ry} L {x + w} {y + ry}" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>')
    # Top Ellipse
    res.append(f'    <ellipse cx="{x + w/2}" cy="{y + ry}" rx="{w/2}" ry="{ry}" fill="#F1F5F9" stroke="#0F172A" stroke-width="1.8"/>')
    # Text
    res.append(f'    <text x="{x + w/2}" y="{y + 44}" font-size="14.5px" font-weight="900" fill="#0F172A" text-anchor="middle">🛢️ {xml_esc(title)}</text>')
    if subtitle:
        res.append(f'    <text x="{x + w/2}" y="{y + 68}" font-size="13px" font-weight="600" fill="#64748B" text-anchor="middle">{xml_esc(subtitle)}</text>')
    if port:
        res.append(f'    <rect x="{x + w/2 - 50}" y="{y + 82}" width="100" height="22" fill="#0F172A" rx="4"/>')
        res.append(f'    <text x="{x + w/2}" y="{y + 97}" class="mono" font-size="11.5px" font-weight="700" fill="#38BDF8" text-anchor="middle">{xml_esc(port)}</text>')
    if tag:
        res.append(f'    <text x="{x + w/2}" y="{y + h - 14}" class="mono" font-size="11.5px" font-weight="700" fill="#059669" text-anchor="middle">{xml_esc(tag)}</text>')
    return '\n'.join(res)

def generate_svg():
    width = 3600
    height = 2400

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="3600" height="2400">')

    # STYLES & DEFINITIONS
    lines.append('  <defs>')
    lines.append('    <style>')
    lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }')
    lines.append('      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }')
    lines.append('      .flow-solid { fill: none; stroke: #0F172A; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .flow-blue { fill: none; stroke: #2563EB; stroke-width: 2.2; stroke-dasharray: 6 4; stroke-linecap: round; }')
    lines.append('      .flow-green { fill: none; stroke: #059669; stroke-width: 2.4; stroke-dasharray: 6 4; stroke-linecap: round; }')
    lines.append('      .flow-amber { fill: none; stroke: #D97706; stroke-width: 2.2; stroke-linecap: round; }')
    lines.append('    </style>')
    lines.append('  </defs>')

    # 1. PURE CLEAN WHITE BACKGROUND (ZERO GRID NOISE!)
    lines.append('  <!-- ==================== BACKGROUND ==================== -->')
    lines.append('  <rect width="3600" height="2400" fill="#FFFFFF"/>')
    # Subtle canvas border
    lines.append('  <rect x="25" y="25" width="3550" height="2350" fill="none" stroke="#0F172A" stroke-width="2.0" rx="10"/>')

    # 2. MASTER HEADER
    lines.append('  <!-- ==================== MASTER HEADER ==================== -->')
    lines.append('  <rect x="60" y="45" width="3480" height="85" fill="#0F172A" rx="8"/>')
    lines.append('  <text x="90" y="85" font-size="24px" font-weight="900" fill="#FFFFFF" letter-spacing="0.5px">HÌNH 2.3: BẢN VẼ THIẾT KẾ KIẾN TRÚC HỆ THỐNG AI RAG &amp; CỤM MICROSERVICES BƯU CHÍNH</text>')
    lines.append('  <text x="90" y="112" font-size="14.5px" font-weight="500" fill="#94A3B8">Kiến trúc Vi dịch vụ Phân tán Độc lập (Clean Architecture &amp; Database-per-Service) • Phân hệ @nexus/chatbot-service (:3013)</text>')
    
    # Header metadata on the right
    lines.append('  <rect x="2820" y="58" width="695" height="58" fill="#1E293B" rx="6"/>')
    lines.append('  <text x="3167" y="82" class="mono" font-size="13px" font-weight="800" fill="#38BDF8" text-anchor="middle">MÃ BẢN VẼ: ARCH-AI-RAG-03 • FIGMA SECTION 2.3</text>')
    lines.append('  <text x="3167" y="103" class="mono" font-size="11.5px" font-weight="600" fill="#94A3B8" text-anchor="middle">TIÊU CHUẨN: IEEE 1471 / C4 CONTAINER MODEL • 100% NATIVE VECTOR</text>')

    # =========================================================================
    # TIER 1: CLIENT PRESENTATION LAYER (Y: 160 -> 410, Height: 250px)
    # =========================================================================
    lines.append('  <!-- ==================== TIER 1: CLIENT TOUCHPOINTS ==================== -->')
    lines.append('  <rect x="60" y="155" width="3480" height="255" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.6" rx="12"/>')
    lines.append('  <text x="90" y="190" font-size="16px" font-weight="900" fill="#0F172A">TẦNG 1: GIAO DIỆN NGƯỜI DÙNG &amp; ĐIỂM CHẠM ĐA KÊNH (CLIENT PRESENTATION LAYER)</text>')
    lines.append('  <text x="3500" y="190" class="mono" font-size="12.5px" font-weight="700" fill="#64748B" text-anchor="end">Omnichannel Touchpoints • Responsive Web &amp; Mobile PWA</text>')

    # 3 Client Cards (Width: 1080px, Height: 180px, Y: 210)
    # Card 1.1: Merchant Web Portal
    lines.append('  <g id="client-merchant">')
    lines.append('    <rect x="90" y="210" width="1090" height="180" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="120" y="244" font-size="18px" font-weight="900" fill="#0F172A">💻 Merchant Web Portal</text>')
    lines.append('    <text x="1150" y="244" class="mono" font-size="13px" font-weight="800" fill="#2563EB" text-anchor="end">React 18 + Vite • :5173</text>')
    lines.append('    <line x1="120" y1="258" x2="1150" y2="258" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="120" y="286" font-size="15px" font-weight="500" fill="#334155">• Bảng điều khiển quản lý đơn hàng, theo dõi hành trình bưu phẩm trực quan real-time.</text>')
    lines.append('    <text x="120" y="316" font-size="15px" font-weight="500" fill="#334155">• Giao diện tạo yêu cầu đền bù sự cố, tải lên chứng từ/ảnh chụp biên bản bất thường.</text>')
    lines.append('    <text x="120" y="346" font-size="15px" font-weight="500" fill="#334155">• Widget AI Chatbot trợ lý bưu chính: tư vấn quy chế, giải đáp SLA, hướng dẫn khiếu nại.</text>')
    lines.append('  </g>')

    # Card 1.2: Courier Mobile App
    lines.append('  <g id="client-courier">')
    lines.append('    <rect x="1255" y="210" width="1090" height="180" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="1285" y="244" font-size="18px" font-weight="900" fill="#0F172A">📱 Courier Mobile Web App</text>')
    lines.append('    <text x="2315" y="244" class="mono" font-size="13px" font-weight="800" fill="#059669" text-anchor="end">Next.js PWA • :8081</text>')
    lines.append('    <line x1="1285" y1="258" x2="2315" y2="258" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="1285" y="286" font-size="15px" font-weight="500" fill="#334155">• Dành riêng cho Bưu tá / Shipper giao hàng: Quét mã Barcode / QR code nhận đơn nhanh.</text>')
    lines.append('    <text x="1285" y="316" font-size="15px" font-weight="500" fill="#334155">• Báo cáo sự cố phát không thành công tại hiện trường, chụp ảnh bằng chứng giao hàng (POD).</text>')
    lines.append('    <text x="1285" y="346" font-size="15px" font-weight="500" fill="#334155">• Đồng bộ tọa độ GPS thời gian thực, tự động kích hoạt tạo biên bản bất thường BBBT.</text>')
    lines.append('  </g>')

    # Card 1.3: Dispatcher Control Tower
    lines.append('  <g id="client-ops">')
    lines.append('    <rect x="2420" y="210" width="1090" height="180" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="2450" y="244" font-size="18px" font-weight="900" fill="#0F172A">🖥️ Dispatcher Control Tower</text>')
    lines.append('    <text x="3480" y="244" class="mono" font-size="13px" font-weight="800" fill="#D97706" text-anchor="end">React + TanStack • :5174</text>')
    lines.append('    <line x1="2450" y1="258" x2="3480" y2="258" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="2450" y="286" font-size="15px" font-weight="500" fill="#334155">• Bàn làm việc Điều phối viên vận hành &amp; Trọng tài giám sát sự cố (Human-in-the-Loop).</text>')
    lines.append('    <text x="2450" y="316" font-size="15px" font-weight="500" fill="#334155">• Tiếp nhận thẩm định các ca khiếu nại vượt thẩm quyền tự động (> 2.000.000 VNĐ).</text>')
    lines.append('    <text x="2450" y="346" font-size="15px" font-weight="500" fill="#334155">• Can thiệp trực tiếp vào phiên trao đổi giữa AI Chatbot và khách hàng khi phát sinh tranh chấp.</text>')
    lines.append('  </g>')

    # Highway 1 -> 2
    lines.append('  <!-- Highway 1 -> 2 -->')
    lines.append('  <line x1="1800" y1="410" x2="1800" y2="475" class="flow-solid"/>')
    lines.append(f'  {draw_arrow(1800, 475, "down")}')
    lines.append(f'  {draw_pill(1800, 442, "① HTTPS / WSS Requests (JWT Bearer Token, Client Metadata)", 490, 28, "#FFFFFF", "#0F172A", "#0F172A", 12.5)}')

    # =========================================================================
    # TIER 2: API GATEWAY & SECURITY PERIMETER (Y: 480 -> 710, Height: 230px)
    # =========================================================================
    lines.append('  <!-- ==================== TIER 2: API GATEWAY ==================== -->')
    lines.append('  <rect x="60" y="475" width="3480" height="235" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.6" rx="12"/>')
    lines.append('  <text x="90" y="508" font-size="16px" font-weight="900" fill="#0F172A">TẦNG 2: CỔNG AN NINH &amp; KIỂM SOÁT BẢO VỆ DỮ LIỆU (API GATEWAY &amp; SECURITY PERIMETER)</text>')
    lines.append('  <text x="3500" y="508" class="mono" font-size="12.5px" font-weight="700" fill="#64748B" text-anchor="end">Gateway Core Service • Port :3000 • Zero-Trust Edge Security</text>')

    # 3 Security Cards (Width: 1090px, Height: 165px, Y: 525)
    # Card 2.1: Reverse Proxy
    lines.append('  <g id="gw-proxy">')
    lines.append('    <rect x="90" y="525" width="1090" height="165" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="120" y="557" font-size="17.5px" font-weight="900" fill="#0F172A">🛡️ Reverse Proxy &amp; SSL Termination</text>')
    lines.append('    <text x="1150" y="557" class="mono" font-size="13px" font-weight="800" fill="#2563EB" text-anchor="end">Gateway Core • :3000</text>')
    lines.append('    <line x1="120" y1="571" x2="1150" y2="571" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="120" y="598" font-size="14.5px" font-weight="500" fill="#334155">• Điểm đón nhận lưu lượng tập trung duy nhất, cân bằng tải HTTP/2 và định tuyến vi dịch vụ.</text>')
    lines.append('    <text x="120" y="626" font-size="14.5px" font-weight="500" fill="#334155">• Giải mã mã hóa SSL/TLS tại biên (Edge Termination), bảo vệ hạ tầng máy chủ nội bộ.</text>')
    lines.append('    <text x="120" y="654" font-size="14.5px" font-weight="500" fill="#334155">• Quản lý chính sách CORS bảo mật, nén dữ liệu truyền tải Gzip/Brotli giảm độ trễ mạng.</text>')
    lines.append('  </g>')

    # Card 2.2: Auth & Rate Limit
    lines.append('  <g id="gw-auth">')
    lines.append('    <rect x="1255" y="525" width="1090" height="165" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="1285" y="557" font-size="17.5px" font-weight="900" fill="#0F172A">🔑 JWT Authentication &amp; Rate Limiter</text>')
    lines.append('    <text x="2315" y="557" class="mono" font-size="13px" font-weight="800" fill="#059669" text-anchor="end">Token Bucket Guard</text>')
    lines.append('    <line x1="1285" y1="571" x2="2315" y2="571" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="1285" y="598" font-size="14.5px" font-weight="500" fill="#334155">• Xác thực chữ ký điện tử qua JWT Bearer Token, giải mã claims nhận diện Merchant / Shipper / Ops.</text>')
    lines.append('    <text x="1285" y="626" font-size="14.5px" font-weight="500" fill="#334155">• Phân quyền kiểm soát truy cập dựa trên vai trò (RBAC) nghiêm ngặt trước khi chuyển tiếp.</text>')
    lines.append('    <text x="1285" y="654" font-size="14.5px" font-weight="500" fill="#334155">• Giới hạn tần suất gọi API (Token Bucket Algorithm: 100 req/phút/IP) chống DDoS và tấn công vét cạn.</text>')
    lines.append('  </g>')

    # Card 2.3: PII Masking & Prompt Firewall
    lines.append('  <g id="gw-pii">')
    lines.append('    <rect x="2420" y="525" width="1090" height="165" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="2450" y="557" font-size="17.5px" font-weight="900" fill="#0F172A">🔒 PII Masking &amp; Prompt Firewall</text>')
    lines.append('    <text x="3480" y="557" class="mono" font-size="13px" font-weight="800" fill="#D97706" text-anchor="end">Nghị định 13/2023/NĐ-CP</text>')
    lines.append('    <line x1="2450" y1="571" x2="3480" y2="571" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="2450" y="598" font-size="14.5px" font-weight="500" fill="#334155">• Tự động che mờ dữ liệu định danh cá nhân nhạy cảm (SĐT: 090****889, CCCD: ******123).</text>')
    lines.append('    <text x="2450" y="626" font-size="14.5px" font-weight="500" fill="#334155">• Đảm bảo tuân thủ 100% Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân trước khi gửi tới LLM Cloud.</text>')
    lines.append('    <text x="2450" y="654" font-size="14.5px" font-weight="500" fill="#334155">• Tường lửa phát hiện và vô hiệu hóa các câu lệnh Prompt Injection, Jailbreak, ngăn chặn rò rỉ tri thức SOP.</text>')
    lines.append('  </g>')

    # Highway 2 -> 3
    lines.append('  <!-- Highway 2 -> 3 -->')
    lines.append('  <line x1="1800" y1="710" x2="1800" y2="765" class="flow-solid"/>')
    lines.append(f'  {draw_arrow(1800, 765, "down")}')
    lines.append(f'  {draw_pill(1800, 738, "② Authenticated, Sanitized & Masked Ingress Payload (HTTP/2 Ingress)", 520, 28, "#FFFFFF", "#0F172A", "#0F172A", 12.5)}')

    # =========================================================================
    # TIER 3: CORE AI RAG & AGENTIC ORCHESTRATION (Y: 770 -> 1530, Height: 760px)
    # =========================================================================
    lines.append('  <!-- ==================== TIER 3: AI RAG ENGINE ==================== -->')
    lines.append('  <rect x="60" y="770" width="3480" height="760" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.2" rx="14"/>')
    lines.append('  <text x="90" y="805" font-size="17px" font-weight="900" fill="#0F172A">TẦNG 3: PHÂN HỆ TRỢ LÝ AI RAG &amp; ĐIỀU PHỐI TÁC NHÂN BƯU CHÍNH (@nexus/chatbot-service:3013)</text>')
    lines.append('  <text x="3500" y="805" class="mono" font-size="12.5px" font-weight="700" fill="#2563EB" text-anchor="end">NestJS / Fastify Core • Zero External Vector DB Cost • Hybrid In-Memory Engine</text>')

    # 4 Core Columns inside Tier 3 (Width: 830px, Height: 685px, Y: 825)
    # Col 3.1: Ingress & Session Memory
    lines.append('  <g id="rag-ingress-session">')
    lines.append('    <rect x="90" y="825" width="830" height="685" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="120" y="860" font-size="17px" font-weight="900" fill="#0F172A">1. Ingress &amp; Session Memory</text>')
    lines.append('    <text x="890" y="860" class="mono" font-size="12.5px" font-weight="800" fill="#2563EB" text-anchor="end">&lt;&lt;Controller &amp; Memory&gt;&gt;</text>')
    lines.append('    <line x1="120" y1="875" x2="890" y2="875" stroke="#E2E8F0" stroke-width="1.2"/>')
    
    lines.append('    <text x="120" y="905" class="mono" font-size="13px" font-weight="700" fill="#0F172A">POST /api/chat &amp; WebSocket /ws/chat</text>')
    lines.append('    <text x="120" y="930" font-size="14.5px" font-weight="500" fill="#334155">• Tiếp nhận hội thoại dạng Server-Sent Events (SSE) Stream Payload.</text>')
    lines.append('    <text x="120" y="955" font-size="14.5px" font-weight="500" fill="#334155">• Phân tích thực thể nhanh: Tách SessionId, MerchantId, TrackingCode.</text>')
    lines.append('    <text x="120" y="980" font-size="14.5px" font-weight="500" fill="#334155">• Khớp Regex mã vận đơn bưu chính: ^(VN|NX)[0-9]{9,12}(VN)?$.</text>')
    
    lines.append('    <line x1="120" y1="1005" x2="890" y2="1005" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="120" y="1035" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Multi-Turn Session Context Manager</text>')
    lines.append('    <text x="120" y="1060" font-size="14.5px" font-weight="500" fill="#334155">• Cửa sổ trượt ghi nhớ ngữ cảnh (Sliding Context Window: 10 Turns).</text>')
    lines.append('    <text x="120" y="1085" font-size="14.5px" font-weight="500" fill="#334155">• Duy trì trạng thái câu hỏi liên tiếp (Ví dụ: "Đơn đó", "Bồi thường sao?").</text>')
    lines.append('    <text x="120" y="1110" font-size="14.5px" font-weight="500" fill="#334155">• Đồng bộ 2 chiều tức thời với Redis Cluster (:6379, TTL: 1800s / 30 phút).</text>')
    lines.append('    <text x="120" y="1135" font-size="14.5px" font-weight="500" fill="#334155">• Giải phóng bộ nhớ tự động khi phiên kết thúc (Automatic Cache Eviction).</text>')

    lines.append('    <line x1="120" y1="1160" x2="890" y2="1160" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="120" y="1190" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Context Pruning &amp; Rate Limiter</text>')
    lines.append('    <text x="120" y="1215" font-size="14.5px" font-weight="500" fill="#334155">• Cắt tỉa token thông minh (Pruning) bảo vệ cửa sổ ngữ cảnh LLM.</text>')
    lines.append('    <text x="120" y="1240" font-size="14.5px" font-weight="500" fill="#334155">• Cơ chế Zero Buffer Overflow: Kiểm soát backpressure luồng stream.</text>')
    lines.append('    <text x="120" y="1265" font-size="14.5px" font-weight="500" fill="#334155">• Tái kết nối WebSocket tự động trong trường hợp ngắt quãng mạng.</text>')
    lines.append('    <text x="120" y="1470" class="mono" font-size="12.5px" font-weight="700" fill="#059669">✓ MULTI-TURN CONSISTENCY • ZERO MEMORY LEAK</text>')
    lines.append('  </g>')

    # Col 3.2: In-Memory Vector Store & Hybrid Search
    lines.append('  <g id="rag-hybrid-search">')
    lines.append('    <rect x="960" y="825" width="830" height="685" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="990" y="860" font-size="17px" font-weight="900" fill="#0F172A">2. Hybrid Retrieval Engine</text>')
    lines.append('    <text x="1760" y="860" class="mono" font-size="12.5px" font-weight="800" fill="#059669" text-anchor="end">&lt;&lt;Vector &amp; BM25&gt;&gt;</text>')
    lines.append('    <line x1="990" y1="875" x2="1760" y2="875" stroke="#E2E8F0" stroke-width="1.2"/>')

    lines.append('    <text x="990" y="905" class="mono" font-size="13px" font-weight="700" fill="#0F172A">In-Memory Matryoshka Vector Store (Heap: 142 KB)</text>')
    lines.append('    <text x="990" y="930" font-size="14.5px" font-weight="500" fill="#334155">• 35 Chunks SOP Quy chế Bưu chính (Nạp tĩnh vào RAM khi khởi động).</text>')
    lines.append('    <text x="990" y="955" font-size="14.5px" font-weight="500" fill="#334155">• Chuẩn nhúng: text-embedding-3-small (MRL 512 Dimensions, L2-norm).</text>')
    lines.append('    <text x="990" y="980" font-size="14.5px" font-weight="500" fill="#334155">• Quét tích vô hướng Dot-Product toàn bộ vector: Thời gian truy xuất &lt; 0.8ms.</text>')
    lines.append('    <text x="990" y="1005" font-size="14.5px" font-weight="500" fill="#334155">• Chi phí phần cứng CSDL Vector ngoại vi: Hoàn toàn bằng 0 VNĐ.</text>')

    lines.append('    <line x1="990" y1="1030" x2="1760" y2="1030" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="990" y="1060" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Hybrid Fusion: Dense Semantic + Sparse BM25</text>')
    lines.append('    <text x="990" y="1085" font-size="14.5px" font-weight="500" fill="#334155">• Nhánh A - Ngữ nghĩa (Trọng số 70%): Cosine Similarity véc tơ nhúng.</text>')
    lines.append('    <text x="990" y="1110" font-size="14.5px" font-weight="500" fill="#334155">  -> Bắt trọn ý định câu hỏi dù người dùng dùng từ đồng nghĩa, tiếng lóng.</text>')
    lines.append('    <text x="990" y="1135" font-size="14.5px" font-weight="500" fill="#334155">• Nhánh B - Từ khóa chính xác (Trọng số 30%): Thuật toán BM25 kinh điển.</text>')
    lines.append('    <text x="990" y="1160" font-size="14.5px" font-weight="500" fill="#334155">  -> Bắt chính xác các thuật ngữ bưu chính đặc thù: "SLA 24h", "IATA", "Pin Li-on".</text>')
    
    lines.append('    <line x1="990" y1="1185" x2="1760" y2="1185" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="990" y="1215" class="mono" font-size="13px" font-weight="700" fill="#0F172A">RRF (Reciprocal Rank Fusion) &amp; Threshold</text>')
    lines.append('    <text x="990" y="1240" font-size="14.5px" font-weight="500" fill="#334155">• Công thức hợp nhất: FinalScore = 0.70·Sim_Dense + 0.30·Score_BM25.</text>')
    lines.append('    <text x="990" y="1265" font-size="14.5px" font-weight="500" fill="#334155">• Ngưỡng lọc tự động: FinalScore >= 0.72 (Loại bỏ 100% tài liệu nhiễu).</text>')
    lines.append('    <text x="990" y="1290" font-size="14.5px" font-weight="500" fill="#334155">• Trích xuất Top-3 Chunks có độ tin cậy cao nhất vào Context Prompt.</text>')
    lines.append('    <text x="990" y="1470" class="mono" font-size="12.5px" font-weight="700" fill="#2563EB">✓ TOP-3 RETRIEVAL • ZERO EXTERNAL DB COST</text>')
    lines.append('  </g>')

    # Col 3.3: Dual-Engine LLM Circuit Breaker
    lines.append('  <g id="rag-dual-engine">')
    lines.append('    <rect x="1830" y="825" width="830" height="685" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="1860" y="860" font-size="17px" font-weight="900" fill="#0F172A">3. Dual-Engine Orchestrator</text>')
    lines.append('    <text x="2630" y="860" class="mono" font-size="12.5px" font-weight="800" fill="#D97706" text-anchor="end">&lt;&lt;Circuit Breaker&gt;&gt;</text>')
    lines.append('    <line x1="1860" y1="875" x2="2630" y2="875" stroke="#E2E8F0" stroke-width="1.2"/>')

    lines.append('    <text x="1860" y="905" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Động cơ chính: Google Gemini 1.5 Flash (98.6% Lưu lượng)</text>')
    lines.append('    <text x="1860" y="930" font-size="14.5px" font-weight="500" fill="#334155">• Tốc độ phản hồi cực nhanh: TTFT &lt; 1.20s toàn trình (240ms native stream).</text>')
    lines.append('    <text x="1860" y="955" font-size="14.5px" font-weight="500" fill="#334155">• Cửa sổ ngữ cảnh cực lớn: 1.000.000 Tokens (Đọc trọn vẹn toàn bộ 9 file SOP).</text>')
    lines.append('    <text x="1860" y="980" font-size="14.5px" font-weight="500" fill="#334155">• Hỗ trợ Native Function Calling với định dạng chuẩn OpenAPI 3.0.</text>')
    lines.append('    <text x="1860" y="1005" font-size="14.5px" font-weight="500" fill="#334155">• Độ chính xác gọi Tool: 99.2% (Trích xuất đúng mã bưu gửi, SLA bưu chính).</text>')
    lines.append('    <text x="1860" y="1030" font-size="14.5px" font-weight="500" fill="#334155">• Chi phí vận hành tối ưu: $0.075 / 1M Input Tokens (Rẻ hơn 90% so với GPT-4o).</text>')

    lines.append('    <line x1="1860" y1="1055" x2="2630" y2="1055" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="1860" y="1085" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Động cơ dự phòng: Groq Cloud LPU LLaMA 3.3 70B (1.4% Fallback)</text>')
    lines.append('    <text x="1860" y="1110" font-size="14.5px" font-weight="500" fill="#334155">• Phần cứng LPU chuyên dụng: Tốc độ suy luận siêu tốc 280 tokens/giây.</text>')
    lines.append('    <text x="1860" y="1135" font-size="14.5px" font-weight="500" fill="#334155">• Mô hình mã nguồn mở Meta LLaMA 3.3 70B có năng lực suy luận tương đương.</text>')
    lines.append('    <text x="1860" y="1160" font-size="14.5px" font-weight="500" fill="#334155">• Tương thích tuyệt đối chuẩn Function Calling OpenAI (Dễ dàng hoán đổi).</text>')
    
    lines.append('    <line x1="1860" y1="1185" x2="2630" y2="1185" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="1860" y="1215" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Cơ chế Tự động Ngắt mạch (Circuit Breaker Failure Fallback)</text>')
    lines.append('    <text x="1860" y="1240" font-size="14.5px" font-weight="500" fill="#334155">• Tự động chuyển mạch tức thì (&lt; 300ms) sang Groq khi Gemini quá tải / lỗi 429.</text>')
    lines.append('    <text x="1860" y="1265" font-size="14.5px" font-weight="500" fill="#334155">• Cơ chế Cooldown 60s trước khi khôi phục lưu lượng về Gemini.</text>')
    lines.append('    <text x="1860" y="1290" font-size="14.5px" font-weight="500" fill="#334155">• Đảm bảo SLA dịch vụ liên tục 99.9% không bao giờ làm gián đoạn người dùng.</text>')
    lines.append('    <text x="1860" y="1470" class="mono" font-size="12.5px" font-weight="700" fill="#D97706">✓ 99.9% UPTIME • DUAL-ENGINE RESILIENCE</text>')
    lines.append('  </g>')

    # Col 3.4: Live Tool Dispatcher & Grounding Guard
    lines.append('  <g id="rag-tool-guard">')
    lines.append('    <rect x="2700" y="825" width="810" height="685" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="2730" y="860" font-size="17px" font-weight="900" fill="#0F172A">4. Tool Dispatcher &amp; Guard</text>')
    lines.append('    <text x="3480" y="860" class="mono" font-size="12.5px" font-weight="800" fill="#7C3AED" text-anchor="end">&lt;&lt;Agent Executor&gt;&gt;</text>')
    lines.append('    <line x1="2730" y1="875" x2="3480" y2="875" stroke="#E2E8F0" stroke-width="1.2"/>')

    lines.append('    <text x="2730" y="905" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Live Function Calling Tool Dispatcher</text>')
    lines.append('    <text x="2730" y="930" font-size="14.5px" font-weight="500" fill="#334155">• check_tracking(code) -> Tra cứu hành trình bưu phẩm real-time (:3001).</text>')
    lines.append('    <text x="2730" y="955" font-size="14.5px" font-weight="500" fill="#334155">• calc_shipping_fee(d,r,c,w) -> Tính cước thể tích chuẩn IATA (:3007).</text>')
    lines.append('    <text x="2730" y="980" font-size="14.5px" font-weight="500" fill="#334155">• get_claim_policy(category) -> Bóc tách điều kiện &amp; hạn mức bồi thường SOP.</text>')
    lines.append('    <text x="2730" y="1005" font-size="14.5px" font-weight="500" fill="#334155">• submit_claim_ticket(payload) -> Tạo hồ sơ sự cố &amp; BBBT tự động (:3011).</text>')
    lines.append('    <text x="2730" y="1030" font-size="14.5px" font-weight="500" fill="#334155">• transfer_human(ticket_id) -> Chuyển điều phối viên HITL xử lý (:3000).</text>')

    lines.append('    <line x1="2730" y1="1055" x2="3480" y2="1055" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="2730" y="1085" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Anti-Hallucination Guardrail &amp; Triad Audit</text>')
    lines.append('    <text x="2730" y="1110" font-size="14.5px" font-weight="500" fill="#334155">• Context Relevance (Độ liên quan ngữ cảnh tài liệu): 98.4%.</text>')
    lines.append('    <text x="2730" y="1135" font-size="14.5px" font-weight="500" fill="#334155">• Grounded Faithfulness (Tính trung thực thực tế với SOP): 99.8%.</text>')
    lines.append('    <text x="2730" y="1160" font-size="14.5px" font-weight="500" fill="#334155">• Answer Relevance (Độ chuẩn xác giải quyết nhu cầu): 97.6%.</text>')
    
    lines.append('    <line x1="2730" y1="1185" x2="3480" y2="1185" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="2730" y="1215" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Nguyên tắc Bất khả Xâm phạm (Zero-Hallucination Policy)</text>')
    lines.append('    <text x="2730" y="1240" font-size="14.5px" font-weight="500" fill="#334155">• Từ chối trả lời: Nếu câu hỏi nằm ngoài tài liệu SOP -> Lịch sự thông báo.</text>')
    lines.append('    <text x="2730" y="1265" font-size="14.5px" font-weight="500" fill="#334155">• Cấm đoán phỏng đoán giá trị: Không tự ý tính mức đền bù nếu chưa có dữ liệu.</text>')
    lines.append('    <text x="2730" y="1290" font-size="14.5px" font-weight="500" fill="#334155">• Bắt buộc trích dẫn nguồn: Mọi chính sách đền bù đều đính kèm trích dẫn văn bản.</text>')
    lines.append('    <text x="2730" y="1470" class="mono" font-size="12.5px" font-weight="700" fill="#059669">✓ ZERO HALLUCINATION (&lt; 0.2%) • STRICT GROUNDING</text>')
    lines.append('  </g>')

    # Internal Horizontal Connections within Tier 3
    # Ingress -> Hybrid Search
    lines.append('  <line x1="920" y1="950" x2="960" y2="950" class="flow-solid"/>')
    lines.append(f'  {draw_arrow(960, 950, "right")}')
    # Hybrid Search -> LLM Orchestrator
    lines.append('  <line x1="1790" y1="950" x2="1830" y2="950" class="flow-solid"/>')
    lines.append(f'  {draw_arrow(1830, 950, "right")}')
    # LLM Orchestrator -> Tool Dispatcher
    lines.append('  <line x1="2660" y1="950" x2="2700" y2="950" class="flow-solid"/>')
    lines.append(f'  {draw_arrow(2700, 950, "right")}')

    # Return SSE Stream Highway from Tier 3 up to Tier 1 Client
    lines.append('  <!-- SSE Stream Return Highway -->')
    lines.append('  <path d="M 505 825 L 505 400" class="flow-green"/>')
    lines.append(f'  {draw_arrow(505, 400, "up", "#059669")}')
    lines.append(f'  {draw_pill(505, 442, "⑦ Server-Sent Events (SSE) Stream Response", 380, 28, "#ECFDF5", "#059669", "#047857", 12.5)}')

    # =========================================================================
    # TIER 4: LOGISTICS CORE MICROSERVICES & PERSISTENCE (Y: 1560 -> 2210, Height: 650px)
    # =========================================================================
    lines.append('  <!-- ==================== TIER 4: MICROSERVICES & DATABASES ==================== -->')
    lines.append('  <rect x="60" y="1560" width="3480" height="650" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.6" rx="14"/>')
    lines.append('  <text x="90" y="1595" font-size="17px" font-weight="900" fill="#0F172A">TẦNG 4: CỤM VI DỊCH VỤ NGHIỆP VỤ &amp; CƠ SỞ DỮ LIỆU ĐỘC LẬP (DATABASE-PER-SERVICE)</text>')
    lines.append('  <text x="3500" y="1595" class="mono" font-size="12.5px" font-weight="700" fill="#059669" text-anchor="end">Ground Truth Core • ACID PostgreSQL 16 &amp; Redis 7.2 Cluster</text>')

    # 4 Microservice & Database Columns (Width: 830px, Height: 585px, Y: 1615)
    # Col 4.1: Shipment Microservice & DB
    lines.append('  <g id="ms-shipment">')
    lines.append('    <rect x="90" y="1615" width="830" height="580" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="120" y="1648" font-size="17.5px" font-weight="900" fill="#0F172A">📦 Shipment Service &amp; Database</text>')
    lines.append('    <text x="890" y="1648" class="mono" font-size="12.5px" font-weight="800" fill="#2563EB" text-anchor="end">Service :3001 • DB :5432</text>')
    lines.append('    <line x1="120" y1="1662" x2="890" y2="1662" stroke="#E2E8F0" stroke-width="1.2"/>')
    
    # Cylinder inside
    lines.append(draw_cylinder(130, 1680, 240, 140, "PostgreSQL 16", "Shipment Schema", "Port :5432", "ACID Saga", 14))
    
    # Specs beside Cylinder
    lines.append('    <text x="400" y="1705" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Bảng thực thể cốt lõi:</text>')
    lines.append('    <text x="400" y="1730" font-size="14.5px" font-weight="500" fill="#334155">• shipments: id, code, sender, recipient, status</text>')
    lines.append('    <text x="400" y="1755" font-size="14.5px" font-weight="500" fill="#334155">• shipment_events: id, shipment_id, event, time</text>')
    lines.append('    <text x="400" y="1780" font-size="14.5px" font-weight="500" fill="#334155">• tracking_checkpoints: id, hub_id, scan_time</text>')
    lines.append('    <text x="400" y="1805" font-size="14.5px" font-weight="500" fill="#334155">• pods: id, photo_url, signature, gps_coords</text>')

    lines.append('    <line x1="120" y1="1840" x2="890" y2="1840" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="120" y="1870" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Nghiệp vụ cốt lõi &amp; Cam kết Dữ liệu (Ground Truth):</text>')
    lines.append('    <text x="120" y="1898" font-size="14.5px" font-weight="500" fill="#334155">• Quản lý vòng đời bưu gửi: 7 trạng thái FSM (Created -> Delivering -> Delivered / Failed).</text>')
    lines.append('    <text x="120" y="1926" font-size="14.5px" font-weight="500" fill="#334155">• Lịch sử quét mã vạch Barcode/QR thời gian thực, đồng bộ vị trí bưu tá trên bản đồ.</text>')
    lines.append('    <text x="120" y="1954" font-size="14.5px" font-weight="500" fill="#334155">• Cam kết ACID: Đảm bảo tính toàn vẹn trạng thái đơn hàng khi xảy ra lỗi mạng bưu tá.</text>')
    lines.append('    <text x="120" y="1982" font-size="14.5px" font-weight="500" fill="#334155">• Read-only Replica phục vụ RAG: Truy vấn tra cứu trạng thái không gây nghẽn giao dịch ghi.</text>')
    lines.append('    <text x="120" y="2170" class="mono" font-size="12.5px" font-weight="700" fill="#059669">✓ 100% PRODUCTION VERIFIED • INDEX B-TREE &lt; 2ms</text>')
    lines.append('  </g>')

    # Col 4.2: Billing Microservice & DB
    lines.append('  <g id="ms-billing">')
    lines.append('    <rect x="960" y="1615" width="830" height="580" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="990" y="1648" font-size="17.5px" font-weight="900" fill="#0F172A">💰 Billing Service &amp; Database</text>')
    lines.append('    <text x="1760" y="1648" class="mono" font-size="12.5px" font-weight="800" fill="#059669" text-anchor="end">Service :3007 • DB :5433</text>')
    lines.append('    <line x1="990" y1="1662" x2="1760" y2="1662" stroke="#E2E8F0" stroke-width="1.2"/>')

    # Cylinder inside
    lines.append(draw_cylinder(1000, 1680, 240, 140, "PostgreSQL 16", "Billing Schema", "Port :5433", "Double Entry", 14))

    # Specs beside Cylinder
    lines.append('    <text x="1270" y="1705" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Bảng thực thể cốt lõi:</text>')
    lines.append('    <text x="1270" y="1730" font-size="14.5px" font-weight="500" fill="#334155">• shipping_tariffs: id, service_type, base_rate</text>')
    lines.append('    <text x="1270" y="1755" font-size="14.5px" font-weight="500" fill="#334155">• cod_ledgers: id, merchant_id, amount, status</text>')
    lines.append('    <text x="1270" y="1780" font-size="14.5px" font-weight="500" fill="#334155">• merchant_wallets: id, balance, frozen_fund</text>')
    lines.append('    <text x="1270" y="1805" font-size="14.5px" font-weight="500" fill="#334155">• invoices: id, invoice_no, total_vat, issued_at</text>')

    lines.append('    <line x1="990" y1="1840" x2="1760" y2="1840" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="990" y="1870" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Nghiệp vụ cốt lõi &amp; Cam kết Dữ liệu (Ground Truth):</text>')
    lines.append('    <text x="990" y="1898" font-size="14.5px" font-weight="500" fill="#334155">• Quy chuẩn tính cước thể tích chuẩn IATA quốc tế: Trọng lượng quy đổi = (DxRxC)/5000.</text>')
    lines.append('    <text x="990" y="1926" font-size="14.5px" font-weight="500" fill="#334155">• Đối soát dòng tiền thu hộ COD minh bạch giữa Merchant, Sàn thương mại và Shipper.</text>')
    lines.append('    <text x="990" y="1954" font-size="14.5px" font-weight="500" fill="#334155">• Sổ cái kép (Double-Entry Bookkeeping): Đảm bảo cân đối tài chính tuyệt đối, chống thất thoát.</text>')
    lines.append('    <text x="990" y="1982" font-size="14.5px" font-weight="500" fill="#334155">• Khóa phân tán Redlock chống trùng lặp giao dịch thanh toán hoặc rút tiền ví merchant.</text>')
    lines.append('    <text x="990" y="2170" class="mono" font-size="12.5px" font-weight="700" fill="#059669">✓ FINANCIAL ACCURACY • DOUBLE-ENTRY LEDGER</text>')
    lines.append('  </g>')

    # Col 4.3: Claims Microservice & DB
    lines.append('  <g id="ms-claims">')
    lines.append('    <rect x="1830" y="1615" width="830" height="580" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="1860" y="1648" font-size="17.5px" font-weight="900" fill="#0F172A">⚖️ Claims Service &amp; Database</text>')
    lines.append('    <text x="2630" y="1648" class="mono" font-size="12.5px" font-weight="800" fill="#D97706" text-anchor="end">Service :3011 • DB :5434</text>')
    lines.append('    <line x1="1860" y1="1662" x2="2630" y2="1662" stroke="#E2E8F0" stroke-width="1.2"/>')

    # Cylinder inside
    lines.append(draw_cylinder(1870, 1680, 240, 140, "PostgreSQL 16", "Claims Schema", "Port :5434", "Audit Logs", 14))

    # Specs beside Cylinder
    lines.append('    <text x="2140" y="1705" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Bảng thực thể cốt lõi:</text>')
    lines.append('    <text x="2140" y="1730" font-size="14.5px" font-weight="500" fill="#334155">• incident_claims: id, claim_code, amount, status</text>')
    lines.append('    <text x="2140" y="1755" font-size="14.5px" font-weight="500" fill="#334155">• claim_timeline: id, claim_id, actor, action, note</text>')
    lines.append('    <text x="2140" y="1780" font-size="14.5px" font-weight="500" fill="#334155">• inspection_reports: id, bbbt_code, damage_pct</text>')
    lines.append('    <text x="2140" y="1805" font-size="14.5px" font-weight="500" fill="#334155">• settlements: id, claim_id, approved_amt, method</text>')

    lines.append('    <line x1="1860" y1="1840" x2="2630" y2="1840" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="1860" y="1870" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Nghiệp vụ cốt lõi &amp; Cam kết Dữ liệu (Ground Truth):</text>')
    lines.append('    <text x="1860" y="1898" font-size="14.5px" font-weight="500" fill="#334155">• Tiếp nhận &amp; xử lý hồ sơ khiếu nại bưu chính, liên kết chặt chẽ với biên bản bất thường (BBBT).</text>')
    lines.append('    <text x="1860" y="1926" font-size="14.5px" font-weight="500" fill="#334155">• Thẩm định tự động: Duyệt chi trả ngay lập tức nếu tổn thất &lt;= 2.000.000 VNĐ và đủ chứng từ.</text>')
    lines.append('    <text x="1860" y="1954" font-size="14.5px" font-weight="500" fill="#334155">• Tự động chuyển trọng tài HITL thẩm tra nếu khiếu nại vượt 2.000.000 VNĐ hoặc có nghi vấn gian lận.</text>')
    lines.append('    <text x="1860" y="1982" font-size="14.5px" font-weight="500" fill="#334155">• Kiểm soát SLA 24h lập biên bản theo quy chế hàng không ICAO và luật bưu chính Việt Nam.</text>')
    lines.append('    <text x="1860" y="2170" class="mono" font-size="12.5px" font-weight="700" fill="#059669">✓ AUTO-APPROVAL &lt;= 2M VND • SLA 24H AUDIT</text>')
    lines.append('  </g>')

    # Col 4.4: Redis Distributed Cache & State Store
    lines.append('  <g id="ms-redis">')
    lines.append('    <rect x="2700" y="1615" width="810" height="580" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="8"/>')
    lines.append('    <text x="2730" y="1648" font-size="17.5px" font-weight="900" fill="#0F172A">⚡ Distributed Cache &amp; Lock</text>')
    lines.append('    <text x="3480" y="1648" class="mono" font-size="12.5px" font-weight="800" fill="#DC2626" text-anchor="end">Redis Cluster :6379</text>')
    lines.append('    <line x1="2730" y1="1662" x2="3480" y2="1662" stroke="#E2E8F0" stroke-width="1.2"/>')

    # Cylinder inside
    lines.append(draw_cylinder(2740, 1680, 240, 140, "Redis Cluster 7.2", "In-Memory Store", "Port :6379", "Distributed Lock", 14))

    # Specs beside Cylinder
    lines.append('    <text x="3010" y="1705" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Cấu trúc dữ liệu chính:</text>')
    lines.append('    <text x="3010" y="1730" font-size="14.5px" font-weight="500" fill="#334155">• Hashes: session:{id}:context (Lịch sử chat)</text>')
    lines.append('    <text x="3010" y="1755" font-size="14.5px" font-weight="500" fill="#334155">• Strings: rate_limit:{ip} (Giới hạn tần suất)</text>')
    lines.append('    <text x="3010" y="1780" font-size="14.5px" font-weight="500" fill="#334155">• Redlock: lock:claim:{id} (Khóa phân tán)</text>')
    lines.append('    <text x="3010" y="1805" font-size="14.5px" font-weight="500" fill="#334155">• Sets: active_tokens (Danh sách phiên hợp lệ)</text>')

    lines.append('    <line x1="2730" y1="1840" x2="3480" y2="1840" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('    <text x="2730" y="1870" class="mono" font-size="13px" font-weight="700" fill="#0F172A">Nghiệp vụ cốt lõi &amp; Cam kết Dữ liệu (Ground Truth):</text>')
    lines.append('    <text x="2730" y="1898" font-size="14.5px" font-weight="500" fill="#334155">• Quản lý phiên hội thoại nhiều lượt: TTL 1800s tự hủy triệt tiêu hoàn toàn rủi ro rò rỉ dữ liệu.</text>')
    lines.append('    <text x="2730" y="1926" font-size="14.5px" font-weight="500" fill="#334155">• Thuật toán khóa phân tán Redlock: Ngăn chặn tuyệt đối tình trạng race condition khi duyệt đền bù.</text>')
    lines.append('    <text x="2730" y="1954" font-size="14.5px" font-weight="500" fill="#334155">• Tương thích chuẩn ACID qua cơ chế Snapshot RDB định kỳ và Append-Only File (AOF) bền vững.</text>')
    lines.append('    <text x="2730" y="1982" font-size="14.5px" font-weight="500" fill="#334155">• Độ trễ truy xuất siêu thấp (&lt; 0.5ms): Đảm bảo trải nghiệm đàm thoại thời gian thực mượt mà.</text>')
    lines.append('    <text x="2730" y="2170" class="mono" font-size="12.5px" font-weight="700" fill="#059669">✓ SUB-MILLISECOND LATENCY (&lt; 0.5ms) • REDLOCK</text>')
    lines.append('  </g>')

    # Highway 3 -> 4: Tool Dispatcher Dispatches to Microservices
    lines.append('  <!-- Highway 3 -> 4: Tool Calling Dispatch -->')
    lines.append('  <path d="M 3105 1510 L 3105 1555" class="flow-solid"/>')
    lines.append(f'  {draw_arrow(3105, 1555, "down")}')
    lines.append(f'  {draw_pill(3105, 1535, "⑤ Tool Execution (Internal gRPC / REST Pool)", 390, 28, "#FFFFFF", "#0F172A", "#0F172A", 12.5)}')

    # =========================================================================
    # FOOTER & ARCHITECTURAL LEGEND (Y: 2235 -> 2345, Height: 110px)
    # =========================================================================
    lines.append('  <!-- ==================== FOOTER & LEGEND ==================== -->')
    lines.append('  <rect x="60" y="2235" width="3480" height="110" fill="#0F172A" rx="8"/>')
    
    # Left: Principles
    lines.append('  <text x="90" y="2268" font-size="14.5px" font-weight="900" fill="#38BDF8">QUY CHUẨN THIẾT KẾ BẢN VẼ KIẾN TRÚC PHẦN MỀM (SOFTWARE ARCHITECTURE BLUEPRINT STANDARDS):</text>')
    lines.append('  <text x="90" y="2294" font-size="13.5px" font-weight="500" fill="#CBD5E1">1. Kiến trúc phân tầng độc lập (Clean Architecture): Tách biệt Presentation, API Gateway, AI RAG Core Engine, Microservices và Cloud AI.</text>')
    lines.append('  <text x="90" y="2318" font-size="13.5px" font-weight="500" fill="#CBD5E1">2. Cơ chế Ground Truth: 100% dữ liệu thực tế được xác thực qua SQL trực tiếp vào các CSDL Microservices bưu chính, triệt tiêu ảo giác.</text>')

    # Center: Legend
    lines.append('  <text x="2100" y="2268" font-size="14px" font-weight="900" fill="#FFFFFF">KÝ HIỆU ĐƯỜNG TRUYỀN &amp; GIAO THỨC (PROTOCOLS):</text>')
    # Legend 1: Solid
    lines.append('  <line x1="2100" y1="2295" x2="2140" y2="2295" stroke="#FFFFFF" stroke-width="2.2"/>')
    lines.append(f'  {draw_arrow(2140, 2295, "right", "#FFFFFF", 10)}')
    lines.append('  <text x="2155" y="2300" font-size="12.5px" font-weight="700" fill="#CBD5E1">HTTPS / Internal gRPC (Đồng bộ)</text>')
    # Legend 2: Green Dash
    lines.append('  <line x1="2500" y1="2295" x2="2540" y2="2295" stroke="#10B981" stroke-width="2.4" stroke-dasharray="5 3"/>')
    lines.append(f'  {draw_arrow(2540, 2295, "right", "#10B981", 10)}')
    lines.append('  <text x="2555" y="2300" font-size="12.5px" font-weight="700" fill="#10B981">Server-Sent Events (SSE Stream)</text>')
    # Legend 3: SQL Pool
    lines.append('  <line x1="2850" y1="2295" x2="2890" y2="2295" stroke="#38BDF8" stroke-width="2.2"/>')
    lines.append(f'  {draw_arrow(2890, 2295, "right", "#38BDF8", 10)}')
    lines.append('  <text x="2905" y="2300" font-size="12.5px" font-weight="700" fill="#38BDF8">SQL Connection Pool (:5432-5434)</text>')

    # Right: Signature
    lines.append('  <text x="3500" y="2295" class="mono" font-size="13px" font-weight="800" fill="#38BDF8" text-anchor="end">100% NATIVE VECTOR • ZERO MARKER DISTORTION</text>')

    lines.append('</svg>')
    return '\n'.join(lines)

def main():
    target_svg = 'docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/03-rag-academic-and-practical-blueprint.svg'
    print(f"Generating clean minimalist architecture blueprint...")
    svg_content = generate_svg()

    # XML Validation
    try:
        ET.fromstring(svg_content)
        print("✓ Strict XML validation PASSED!")
    except ET.ParseError as e:
        print(f"✗ XML validation FAILED: {e}")
        return 1

    # Check for forbidden <marker> tags
    if '<marker' in svg_content:
        print("✗ ERROR: Found forbidden <marker> tags!")
        return 1
    print("✓ Marker check PASSED (0 <marker> tags).")

    with open(target_svg, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print(f"✓ Saved cleanly to: {target_svg}")
    return 0

if __name__ == '__main__':
    exit(main())
