#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate a Visual-First, Iconic & Abstract RAG Core Components Pipeline SVG
for Nexus Logistics Management System.

Canvas: 2200 x 1280 px
Principles:
- Abstract, rich vector graphics for every stage (folders, sliding rulers, 3D databases, dual funnels, action cards).
- Minimalist text: at most 3 concise bullet lines per component.
- Strictly adheres to Nexus Logistics architecture:
  9 SOP Markdown files, Sliding Window 250w/40w (16%), text-embedding-3-small MRL 512-D,
  In-Memory Vector Heap (142 KB), User Query AWB NEX-88291, Logistics Thesaurus,
  Hybrid Retriever 70/30 (Cosine + BM25), Top-1 Grounded Chunk (Điều 4.2 BBBT 24h),
  Grounded LLM Response with Rich Action Cards.
- 100% Native vector, zero <marker> tags, valid XML.
"""

import xml.etree.ElementTree as ET

def draw_arrow(x, y, direction="right", color="#0F172A", size=8):
    if direction == "right":
        points = f"{x},{y} {x-size},{y-size*0.6:.1f} {x-size},{y+size*0.6:.1f}"
    elif direction == "left":
        points = f"{x},{y} {x+size},{y-size*0.6:.1f} {x+size},{y+size*0.6:.1f}"
    elif direction == "down":
        points = f"{x},{y} {x-size*0.6:.1f},{y-size} {x+size*0.6:.1f},{y-size}"
    elif direction == "up":
        points = f"{x},{y} {x-size*0.6:.1f},{y+size} {x+size*0.6:.1f},{y+size}"
    return f'<polygon points="{points}" fill="{color}"/>'

def build_svg():
    W, H = 2200, 1260
    lines = []
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">')
    
    # Definitions
    lines.append('  <defs>')
    lines.append('    <style>')
    lines.append('      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;family=JetBrains+Mono:wght@500;600;700;800&amp;display=swap");')
    lines.append('      text { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }')
    lines.append('      .mono { font-family: "JetBrains Mono", ui-monospace, Menlo, monospace; }')
    lines.append('      .flow-arrow { stroke: #0F172A; stroke-width: 1.8; fill: none; }')
    lines.append('      .bus-arrow { stroke: #0284C7; stroke-width: 2.2; fill: none; }')
    lines.append('    </style>')
    
    # Gradients & Filters
    lines.append('    <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="0">')
    lines.append('      <stop offset="0%" stop-color="#0F172A"/>')
    lines.append('      <stop offset="100%" stop-color="#1E293B"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="tensorGrad" x1="0" y1="0" x2="1" y2="0">')
    lines.append('      <stop offset="0%" stop-color="#3B82F6"/>')
    lines.append('      <stop offset="50%" stop-color="#8B5CF6"/>')
    lines.append('      <stop offset="100%" stop-color="#EC4899"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="funnelDense" x1="0" y1="0" x2="1" y2="0">')
    lines.append('      <stop offset="0%" stop-color="#0284C7"/>')
    lines.append('      <stop offset="100%" stop-color="#06B6D4"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="funnelSparse" x1="0" y1="0" x2="1" y2="0">')
    lines.append('      <stop offset="0%" stop-color="#D97706"/>')
    lines.append('      <stop offset="100%" stop-color="#F59E0B"/>')
    lines.append('    </linearGradient>')
    lines.append('    <linearGradient id="dbGrad" x1="0" y1="0" x2="0" y2="1">')
    lines.append('      <stop offset="0%" stop-color="#BAE6FD"/>')
    lines.append('      <stop offset="100%" stop-color="#E0F2FE"/>')
    lines.append('    </linearGradient>')
    lines.append('    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">')
    lines.append('      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#0F172A" flood-opacity="0.04"/>')
    lines.append('    </filter>')
    lines.append('  </defs>')

    # Background
    lines.append('  <!-- Canvas Background -->')
    lines.append(f'  <rect width="{W}" height="{H}" fill="#FFFFFF"/>')

    # =========================================================================
    # HEADER BAR
    # =========================================================================
    lines.append('  <!-- ==================== HEADER ==================== -->')
    lines.append('  <rect x="40" y="25" width="2120" height="75" fill="url(#headerGrad)" rx="8"/>')
    lines.append('  <text x="65" y="55" font-size="19px" font-weight="900" fill="#FFFFFF" letter-spacing="-0.3px">HÌNH 2.5: CÁC THÀNH PHẦN CỐT LÕI CỦA PHÂN HỆ AI RAG TRONG HỆ THỐNG QUẢN TRỊ BƯU CHÍNH</text>')
    lines.append('  <text x="65" y="80" font-size="12.5px" font-weight="500" fill="#94A3B8">Kiến trúc Luồng Xử lý Trực quan: Tiến trình Nạp &amp; Đánh chỉ mục Tri thức Ngoại tuyến • Truy hồi Lai &amp; Khử ảo giác Thời gian thực</text>')
    
    # Metadata Badge on Header
    lines.append('  <rect x="1780" y="38" width="360" height="48" fill="#1E293B" stroke="#334155" stroke-width="1.2" rx="6"/>')
    lines.append('  <text x="1960" y="58" class="mono" font-size="11px" font-weight="700" fill="#38BDF8" text-anchor="middle">ARCH-RAG-COMP-05 • @nexus/chatbot-service</text>')
    lines.append('  <text x="1960" y="74" class="mono" font-size="10px" font-weight="600" fill="#94A3B8" text-anchor="middle">SLIDING WINDOW • MRL 512-D • HYBRID SEARCH</text>')

    # =========================================================================
    # GIAI ĐOẠN 1: OFFLINE INGESTION & INDEXING (Y: 120 -> 545, Height: 425)
    # =========================================================================
    lines.append('  <!-- ==================== GIAI ĐOẠN 1 ==================== -->')
    lines.append('  <rect x="40" y="120" width="2120" height="425" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" rx="10"/>')
    lines.append('  <text x="65" y="150" font-size="14px" font-weight="900" fill="#0F172A">GIAI ĐOẠN 1: NẠP &amp; LẬP CHỈ MỤC TRI THỨC BƯU CHÍNH NGOẠI TUYẾN (OFFLINE INGESTION &amp; INDEXING)</text>')
    lines.append('  <text x="2135" y="150" class="mono" font-size="11.5px" font-weight="700" fill="#64748B" text-anchor="end">AST Heading Parser • Breadcrumbs • Sliding Window (16% Overlap) • MRL 512-D</text>')

    # Card dimensions for Stage 1: 5 cards across W=2120.
    # W_card = 390. Spacing = 35. Start X = 65.
    # 65 + 390 = 455 (+35 = 490)
    # 490 + 390 = 880 (+35 = 915)
    # 915 + 390 = 1305 (+35 = 1340)
    # 1340 + 390 = 1730 (+35 = 1765)
    # 1765 + 370 = 2135. Perfect!
    
    # -------------------------------------------------------------------------
    # Station 1.1: Document Loaders (X: 65, W: 390)
    # -------------------------------------------------------------------------
    lines.append('  <!-- Station 1.1 -->')
    lines.append('  <g id="card-loaders" filter="url(#cardShadow)">')
    lines.append('    <rect x="65" y="170" width="390" height="355" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.4" rx="8"/>')
    lines.append('    <text x="85" y="200" font-size="15px" font-weight="800" fill="#0F172A">1. Tài liệu SOP Bưu chính</text>')
    lines.append('    <text x="435" y="200" class="mono" font-size="11px" font-weight="700" fill="#2563EB" text-anchor="end">Markdown AST</text>')
    lines.append('    <line x1="85" y1="212" x2="435" y2="212" stroke="#F1F5F9" stroke-width="1.2"/>')
    
    # Graphic 1.1: 3 Stacked Documents with badges
    lines.append('    <!-- Graphic: Stacked Markdown Documents -->')
    lines.append('    <g transform="translate(95, 230)">')
    # Doc 3 (back)
    lines.append('      <rect x="40" y="0" width="130" height="95" rx="5" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.2"/>')
    lines.append('      <rect x="50" y="12" width="70" height="8" rx="2" fill="#CBD5E1"/>')
    lines.append('      <rect x="50" y="26" width="100" height="6" rx="2" fill="#E2E8F0"/>')
    lines.append('      <rect x="50" y="38" width="90" height="6" rx="2" fill="#E2E8F0"/>')
    # Doc 2 (mid)
    lines.append('      <rect x="20" y="15" width="130" height="95" rx="5" fill="#F8FAFC" stroke="#64748B" stroke-width="1.2"/>')
    lines.append('      <rect x="30" y="27" width="80" height="8" rx="2" fill="#94A3B8"/>')
    lines.append('      <rect x="30" y="41" width="100" height="6" rx="2" fill="#CBD5E1"/>')
    lines.append('      <rect x="30" y="53" width="75" height="6" rx="2" fill="#CBD5E1"/>')
    # Doc 1 (front)
    lines.append('      <rect x="0" y="30" width="130" height="95" rx="5" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.5"/>')
    lines.append('      <rect x="10" y="42" width="40" height="16" rx="3" fill="#EF4444"/>')
    lines.append('      <text x="30" y="54" class="mono" font-size="9.5px" font-weight="900" fill="#FFFFFF" text-anchor="middle">.MD</text>')
    lines.append('      <text x="56" y="54" class="mono" font-size="10.5px" font-weight="700" fill="#0F172A">02-insurance</text>')
    lines.append('      <rect x="10" y="66" width="110" height="6" rx="2" fill="#94A3B8"/>')
    lines.append('      <rect x="10" y="78" width="100" height="6" rx="2" fill="#CBD5E1"/>')
    lines.append('      <rect x="10" y="90" width="85" height="6" rx="2" fill="#E2E8F0"/>')
    lines.append('      <rect x="10" y="102" width="105" height="6" rx="2" fill="#E2E8F0"/>')
    # Schema Pill Floating
    lines.append('      <rect x="150" y="20" width="160" height="24" rx="12" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1"/>')
    lines.append('      <text x="230" y="36" class="mono" font-size="10.5px" font-weight="700" fill="#1D4ED8" text-anchor="middle"># H1 &gt; ## H2 &gt; ### H3</text>')
    lines.append('      <rect x="150" y="52" width="160" height="24" rx="12" fill="#F0FDF4" stroke="#10B981" stroke-width="1"/>')
    lines.append('      <text x="230" y="68" class="mono" font-size="10.5px" font-weight="700" fill="#047857" text-anchor="middle">Bảo toàn bảng cước IATA</text>')
    lines.append('      <rect x="150" y="84" width="160" height="24" rx="12" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1"/>')
    lines.append('      <text x="230" y="100" class="mono" font-size="10.5px" font-weight="700" fill="#B45309" text-anchor="middle">Mã băm SHA-256 Reload</text>')
    lines.append('    </g>')
    
    # 3 Bullet Lines
    lines.append('    <text x="85" y="390" font-size="12.5px" font-weight="600" fill="#1E293B">• Nạp 9 tệp SOP Bưu chính nội bộ từ kho tri thức chuẩn</text>')
    lines.append('    <text x="85" y="415" font-size="12.5px" font-weight="600" fill="#1E293B">• AST Parser bóc tách cấu trúc Heading, giữ nguyên ngữ cảnh</text>')
    lines.append('    <text x="85" y="440" font-size="12.5px" font-weight="600" fill="#1E293B">• Cơ chế phát hiện sửa đổi tự động kích hoạt nạp lại tri thức</text>')
    
    # Chip Bottom
    lines.append('    <rect x="85" y="475" width="350" height="30" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>')
    lines.append('    <text x="260" y="495" class="mono" font-size="11px" font-weight="700" fill="#2563EB" text-anchor="middle">✓ 9 KNOWLEDGE FILES • SHA-256 VERIFIED</text>')
    lines.append('  </g>')

    # Arrow 1.1 -> 1.2
    lines.append('  <line x1="455" y1="345" x2="490" y2="345" class="flow-arrow"/>')
    lines.append(f'  {draw_arrow(490, 345, "right")}')

    # -------------------------------------------------------------------------
    # Station 1.2: Semantic Splitter (X: 490, W: 390)
    # -------------------------------------------------------------------------
    lines.append('  <!-- Station 1.2 -->')
    lines.append('  <g id="card-splitter" filter="url(#cardShadow)">')
    lines.append('    <rect x="490" y="170" width="390" height="355" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.4" rx="8"/>')
    lines.append('    <text x="510" y="200" font-size="15px" font-weight="800" fill="#0F172A">2. Bộ phân tách Ngữ nghĩa</text>')
    lines.append('    <text x="860" y="200" class="mono" font-size="11px" font-weight="700" fill="#D97706" text-anchor="end">Sliding Window</text>')
    lines.append('    <line x1="510" y1="212" x2="860" y2="212" stroke="#F1F5F9" stroke-width="1.2"/>')
    
    # Graphic 1.2: Visual Sliding Window Diagram
    lines.append('    <!-- Graphic: Sliding Window Illustration -->')
    lines.append('    <g transform="translate(510, 235)">')
    # Text Stream Bar
    lines.append('      <rect x="10" y="25" width="330" height="14" rx="3" fill="#E2E8F0"/>')
    # Window 1
    lines.append('      <rect x="10" y="10" width="190" height="44" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.6"/>')
    lines.append('      <text x="75" y="36" class="mono" font-size="10.5px" font-weight="800" fill="#1D4ED8" text-anchor="middle">Window 1: 250 từ</text>')
    # Overlap Zone (striped)
    lines.append('      <rect x="140" y="10" width="60" height="74" rx="4" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.4" stroke-dasharray="3,2"/>')
    lines.append('      <text x="170" y="65" class="mono" font-size="9.5px" font-weight="800" fill="#B45309" text-anchor="middle">GỐI ĐẦU</text>')
    lines.append('      <text x="170" y="77" class="mono" font-size="9px" font-weight="700" fill="#B45309" text-anchor="middle">40 từ (16%)</text>')
    # Window 2
    lines.append('      <rect x="140" y="40" width="190" height="44" rx="6" fill="#F0FDF4" stroke="#10B981" stroke-width="1.6"/>')
    lines.append('      <text x="245" y="66" class="mono" font-size="11px" font-weight="800" fill="#047857" text-anchor="middle">Window 2: 250 từ</text>')
    # Stride indicator
    lines.append('      <line x1="10" y1="105" x2="140" y2="105" stroke="#64748B" stroke-width="1.2" stroke-dasharray="2,2"/>')
    lines.append('      <text x="75" y="120" class="mono" font-size="10px" font-weight="700" fill="#475569" text-anchor="middle">Bước trượt (Stride) = 210 từ</text>')
    lines.append('    </g>')
    
    # 3 Bullet Lines
    lines.append('    <text x="510" y="390" font-size="12.5px" font-weight="600" fill="#1E293B">• Cửa sổ trượt 250 từ (~320 tokens), gối đầu 40 từ (16%)</text>')
    lines.append('    <text x="510" y="415" font-size="12.5px" font-weight="600" fill="#1E293B">• Khắc phục triệt để lỗi cắt ngang câu văn và điều kiện pháp lý</text>')
    lines.append('    <text x="510" y="440" font-size="12.5px" font-weight="600" fill="#1E293B">• Bảo toàn liên kết ràng buộc giữa hành vi vi phạm &amp; mức đền bù</text>')
    
    # Chip Bottom
    lines.append('    <rect x="510" y="475" width="350" height="30" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>')
    lines.append('    <text x="685" y="495" class="mono" font-size="11px" font-weight="700" fill="#D97706" text-anchor="middle">✓ ZERO CONTEXT LOSS • 16% OVERLAP</text>')
    lines.append('  </g>')

    # Arrow 1.2 -> 1.3
    lines.append('  <line x1="880" y1="345" x2="915" y2="345" class="flow-arrow"/>')
    lines.append(f'  {draw_arrow(915, 345, "right")}')

    # -------------------------------------------------------------------------
    # Station 1.3: Standard SOP Chunks (X: 915, W: 390)
    # -------------------------------------------------------------------------
    lines.append('  <!-- Station 1.3 -->')
    lines.append('  <g id="card-chunks" filter="url(#cardShadow)">')
    lines.append('    <rect x="915" y="170" width="390" height="355" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.4" rx="8"/>')
    lines.append('    <text x="935" y="200" font-size="15px" font-weight="800" fill="#0F172A">3. Chunks Bưu chính Chuẩn</text>')
    lines.append('    <text x="1285" y="200" class="mono" font-size="11px" font-weight="700" fill="#059669" text-anchor="end">35 Chunks (142KB)</text>')
    lines.append('    <line x1="935" y1="212" x2="1285" y2="212" stroke="#F1F5F9" stroke-width="1.2"/>')
    
    # Graphic 1.3: 3 Stacked Standard Chunk Cards
    lines.append('    <!-- Graphic: Stacked SOP Chunks -->')
    lines.append('    <g transform="translate(935, 225)">')
    # Chunk 1
    lines.append('      <rect x="10" y="5" width="330" height="34" rx="5" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('      <rect x="20" y="13" width="65" height="18" rx="3" fill="#E0F2FE"/>')
    lines.append('      <text x="52" y="26" class="mono" font-size="9.5px" font-weight="800" fill="#0369A1" text-anchor="middle">#chunk-01</text>')
    lines.append('      <text x="95" y="27" font-size="11px" font-weight="700" fill="#0F172A">Cước IATA = (D x R x C) / 5000</text>')
    # Chunk 2 (Highlighted)
    lines.append('      <rect x="10" y="47" width="330" height="38" rx="5" fill="#F0FDF4" stroke="#10B981" stroke-width="1.6"/>')
    lines.append('      <rect x="20" y="56" width="65" height="18" rx="3" fill="#059669"/>')
    lines.append('      <text x="52" y="69" class="mono" font-size="9.5px" font-weight="800" fill="#FFFFFF" text-anchor="middle">#chunk-04</text>')
    lines.append('      <text x="95" y="70" font-size="11px" font-weight="800" fill="#047857">Điều 4.2 Lập BBBT trong 24h &amp; 100% Khai giá</text>')
    # Chunk 3
    lines.append('      <rect x="10" y="93" width="330" height="34" rx="5" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2"/>')
    lines.append('      <rect x="20" y="101" width="65" height="18" rx="3" fill="#FEF3C7"/>')
    lines.append('      <text x="52" y="114" class="mono" font-size="9.5px" font-weight="800" fill="#B45309" text-anchor="middle">#chunk-09</text>')
    lines.append('      <text x="95" y="115" font-size="11px" font-weight="700" fill="#0F172A">Hạn mức đền bù tối đa 2.000.000 VNĐ</text>')
    lines.append('    </g>')
    
    # 3 Bullet Lines
    lines.append('    <text x="935" y="390" font-size="12.5px" font-weight="600" fill="#1E293B">• Tạo thành công 35 Chunks nghiệp vụ chuẩn hóa (~142 KB)</text>')
    lines.append('    <text x="935" y="415" font-size="12.5px" font-weight="600" fill="#1E293B">• Gắn Breadcrumb: "File &gt; H1 &gt; H2 &gt; H3" vào từng đoạn trích</text>')
    lines.append('    <text x="935" y="440" font-size="12.5px" font-weight="600" fill="#1E293B">• Giữ trọn vẹn số hiệu điều khoản và biểu mẫu bưu chính</text>')
    
    # Chip Bottom
    lines.append('    <rect x="935" y="475" width="350" height="30" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>')
    lines.append('    <text x="1110" y="495" class="mono" font-size="11px" font-weight="700" fill="#059669" text-anchor="middle">✓ BREADCRUMB ENRICHED • 100% SOP COVERAGE</text>')
    lines.append('  </g>')

    # Arrow 1.3 -> 1.4
    lines.append('  <line x1="1305" y1="345" x2="1340" y2="345" class="flow-arrow"/>')
    lines.append(f'  {draw_arrow(1340, 345, "right")}')

    # -------------------------------------------------------------------------
    # Station 1.4: Embedding Model & MRL (X: 1340, W: 390)
    # -------------------------------------------------------------------------
    lines.append('  <!-- Station 1.4 -->')
    lines.append('  <g id="card-embedding" filter="url(#cardShadow)">')
    lines.append('    <rect x="1340" y="170" width="390" height="355" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.4" rx="8"/>')
    lines.append('    <text x="1360" y="200" font-size="15px" font-weight="800" fill="#0F172A">4. Mô hình Nhúng Vector</text>')
    lines.append('    <text x="1710" y="200" class="mono" font-size="10.5px" font-weight="700" fill="#7C3AED" text-anchor="end">text-embedding-3-small</text>')
    lines.append('    <line x1="1360" y1="212" x2="1710" y2="212" stroke="#F1F5F9" stroke-width="1.2"/>')
    
    # Graphic 1.4: Tensor Ribbon & MRL Reduction
    lines.append('    <!-- Graphic: Tensor Ribbon & MRL -->')
    lines.append('    <g transform="translate(1360, 230)">')
    # Neural Layer Icon
    lines.append('      <rect x="10" y="10" width="330" height="32" rx="6" fill="#F5F3FF" stroke="#8B5CF6" stroke-width="1.4"/>')
    lines.append('      <text x="175" y="31" class="mono" font-size="11.5px" font-weight="800" fill="#6D28D9" text-anchor="middle">MRL Cắt tỉa: 1536-D ➔ 512-D (Tiết kiệm 67% RAM)</text>')
    # Gradient Vector Bar
    lines.append('      <rect x="10" y="52" width="330" height="36" rx="6" fill="url(#tensorGrad)"/>')
    lines.append('      <text x="175" y="75" class="mono" font-size="12px" font-weight="900" fill="#FFFFFF" text-anchor="middle">[ +0.0241, -0.0512, ..., +0.0894 ]</text>')
    # L2-Norm Box
    lines.append('      <rect x="10" y="98" width="330" height="28" rx="5" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>')
    lines.append('      <text x="175" y="117" class="mono" font-size="11px" font-weight="700" fill="#0F172A" text-anchor="middle">Chuẩn hóa L2: ||v||₂ = 1.0  ➔  Cosine Sim = Dot Product</text>')
    lines.append('    </g>')
    
    # 3 Bullet Lines
    lines.append('    <text x="1360" y="390" font-size="12.5px" font-weight="600" fill="#1E293B">• Mô hình OpenAI text-embedding-3-small tối ưu chi phí</text>')
    lines.append('    <text x="1360" y="415" font-size="12.5px" font-weight="600" fill="#1E293B">• MRL 512-D bảo toàn &gt; 99.1% độ chính xác ngữ nghĩa</text>')
    lines.append('    <text x="1360" y="440" font-size="12.5px" font-weight="600" fill="#1E293B">• Tích vô hướng SIMD siêu tốc quét toàn bộ kho &lt; 0.8ms</text>')
    
    # Chip Bottom
    lines.append('    <rect x="1360" y="475" width="350" height="30" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>')
    lines.append('    <text x="1535" y="495" class="mono" font-size="11px" font-weight="700" fill="#7C3AED" text-anchor="middle">✓ MRL 512-D • L2-NORMALIZED • SIMD &lt; 0.8ms</text>')
    lines.append('  </g>')

    # Arrow 1.4 -> 1.5
    lines.append('  <line x1="1730" y1="345" x2="1765" y2="345" class="flow-arrow"/>')
    lines.append(f'  {draw_arrow(1765, 345, "right")}')

    # -------------------------------------------------------------------------
    # Station 1.5: In-Memory Vector Store (X: 1765, W: 370)
    # -------------------------------------------------------------------------
    lines.append('  <!-- Station 1.5 -->')
    lines.append('  <g id="card-store" filter="url(#cardShadow)">')
    lines.append('    <rect x="1765" y="170" width="370" height="355" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.6" rx="8"/>')
    lines.append('    <text x="1785" y="200" font-size="15px" font-weight="800" fill="#0F172A">5. Kho Vector Bộ nhớ đệm</text>')
    lines.append('    <text x="2115" y="200" class="mono" font-size="11px" font-weight="700" fill="#0284C7" text-anchor="end">In-Memory Heap</text>')
    lines.append('    <line x1="1785" y1="212" x2="2115" y2="212" stroke="#F1F5F9" stroke-width="1.2"/>')
    
    # Graphic 1.5: 3D Isometric Cylinder Database
    lines.append('    <!-- Graphic: 3D Database Cylinder -->')
    lines.append('    <g transform="translate(1820, 225)">')
    # Cylinder Body
    lines.append('      <path d="M 40 45 L 40 100 A 90 24 0 0 0 220 100 L 220 45 Z" fill="url(#dbGrad)" stroke="#0284C7" stroke-width="1.6"/>')
    # Internal Disk Slices
    lines.append('      <path d="M 40 65 A 90 20 0 0 0 220 65" fill="none" stroke="#0284C7" stroke-width="1.2" stroke-dasharray="4,3"/>')
    lines.append('      <path d="M 40 85 A 90 20 0 0 0 220 85" fill="none" stroke="#0284C7" stroke-width="1.2" stroke-dasharray="4,3"/>')
    # Cylinder Top Cap
    lines.append('      <ellipse cx="130" cy="45" rx="90" ry="24" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.6"/>')
    # File Tag
    lines.append('      <rect x="80" y="32" width="100" height="20" rx="4" fill="#0F172A"/>')
    lines.append('      <text x="130" y="46" class="mono" font-size="9.5px" font-weight="900" fill="#FFFFFF" text-anchor="middle">vector-index.json</text>')
    # Metric Badges
    lines.append('      <rect x="50" y="108" width="75" height="20" rx="4" fill="#0284C7"/>')
    lines.append('      <text x="87" y="122" class="mono" font-size="10px" font-weight="800" fill="#FFFFFF" text-anchor="middle">RAM: 142 KB</text>')
    lines.append('      <rect x="135" y="108" width="75" height="20" rx="4" fill="#059669"/>')
    lines.append('      <text x="172" y="122" class="mono" font-size="10px" font-weight="800" fill="#FFFFFF" text-anchor="middle">COST: 0 VNĐ</text>')
    lines.append('    </g>')
    
    # 3 Bullet Lines
    lines.append('    <text x="1785" y="390" font-size="12.5px" font-weight="600" fill="#1E293B">• Lưu trữ trực tiếp trên Heap RAM Node.js khi khởi động</text>')
    lines.append('    <text x="1785" y="415" font-size="12.5px" font-weight="600" fill="#1E293B">• Không phụ thuộc DB ngoài, triệt tiêu độ trễ mạng</text>')
    lines.append('    <text x="1785" y="440" font-size="12.5px" font-weight="600" fill="#1E293B">• Cấu trúc đóng gói JSON sẵn sàng mở rộng sang pgvector</text>')
    
    # Chip Bottom
    lines.append('    <rect x="1785" y="475" width="330" height="30" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>')
    lines.append('    <text x="1950" y="495" class="mono" font-size="11px" font-weight="700" fill="#0284C7" text-anchor="middle">✓ IN-MEMORY HEAP • ZERO NETWORK LATENCY</text>')
    lines.append('  </g>')

    # =========================================================================
    # HIGHWAY BUS: STAGE 1 -> STAGE 2
    # =========================================================================
    lines.append('  <!-- Connection Trunk: Vector Store down to Hybrid Retriever -->')
    lines.append('  <path d="M 1950 525 L 1950 580 L 820 580 L 820 675" class="bus-arrow"/>')
    lines.append(f'  {draw_arrow(820, 675, "down", "#0284C7", 10)}')
    
    # Central Bus Pill
    lines.append('  <rect x="1220" y="565" width="380" height="30" rx="15" fill="#0284C7" stroke="#0369A1" stroke-width="1.2"/>')
    lines.append('  <text x="1410" y="585" class="mono" font-size="11.5px" font-weight="800" fill="#FFFFFF" text-anchor="middle">⚡ ĐỒNG BỘ CHỈ MỤC VECTOR (IN-MEMORY RETRIEVAL BUS)</text>')

    # =========================================================================
    # GIAI ĐOẠN 2: RUNTIME QUERY & HYBRID RETRIEVAL (Y: 620 -> 1140, Height: 520)
    # =========================================================================
    lines.append('  <!-- ==================== GIAI ĐOẠN 2 ==================== -->')
    lines.append('  <rect x="40" y="620" width="2120" height="520" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" rx="10"/>')
    lines.append('  <text x="65" y="652" font-size="14px" font-weight="900" fill="#0F172A">GIAI ĐOẠN 2: TRUY VẤN THỜI GIAN THỰC &amp; TRUY HỒI LAI (RUNTIME QUERY &amp; HYBRID RETRIEVAL)</text>')
    lines.append('  <text x="2135" y="652" class="mono" font-size="11.5px" font-weight="700" fill="#0284C7" text-anchor="end">Intent Detection • Logistics Thesaurus • Hybrid Search (Cosine + BM25) • Rich Actions</text>')

    # 4 Cards across Stage 2:
    # W1 = 480 (Query & Thesaurus)
    # W2 = 500 (Hybrid Retriever)
    # W3 = 480 (Top Grounded Chunk)
    # W4 = 550 (Response Composer & Actions)
    # Spacing = 36. Start X = 65.
    # 65 + 480 = 545 (+35 = 580)
    # 580 + 500 = 1080 (+35 = 1115)
    # 1115 + 440 = 1555 (+35 = 1590)
    # 1590 + 535 = 2125.
    
    # -------------------------------------------------------------------------
    # Station 2.1: User Query & Thesaurus (X: 65, W: 470)
    # -------------------------------------------------------------------------
    lines.append('  <!-- Station 2.1 -->')
    lines.append('  <g id="card-query" filter="url(#cardShadow)">')
    lines.append('    <rect x="65" y="675" width="470" height="445" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.4" rx="8"/>')
    lines.append('    <text x="85" y="705" font-size="15px" font-weight="800" fill="#0F172A">6. Truy vấn &amp; Bóc tách Thực thể</text>')
    lines.append('    <text x="515" y="705" class="mono" font-size="11px" font-weight="700" fill="#0284C7" text-anchor="end">Merchant Web (:5173)</text>')
    lines.append('    <line x1="85" y1="718" x2="515" y2="718" stroke="#E2E8F0" stroke-width="1.2"/>')
    
    # Graphic 2.1: Modern Chat Bubble & Thesaurus Chips
    lines.append('    <!-- Graphic: User Query & Thesaurus -->')
    lines.append('    <g transform="translate(85, 735)">')
    # Chat Bubble
    lines.append('      <rect x="0" y="0" width="430" height="68" rx="8" fill="#0284C7"/>')
    lines.append('      <text x="20" y="26" font-size="13px" font-weight="700" fill="#FFFFFF">"Đơn hàng NEX-88291 bị bể vỡ do bưu tá làm rơi</text>')
    lines.append('      <text x="20" y="48" font-size="13px" font-weight="700" fill="#FFFFFF">thì quy chế bồi thường của bên mình như thế nào?"</text>')
    # Tail
    lines.append('      <polygon points="30,68 45,68 25,78" fill="#0284C7"/>')
    
    # Extracted Chips
    lines.append('      <g transform="translate(0, 85)">')
    lines.append('        <rect x="0" y="0" width="205" height="34" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.2"/>')
    lines.append('        <text x="10" y="21" class="mono" font-size="11px" font-weight="800" fill="#1D4ED8">AWB: NEX-88291</text>')
    lines.append('        <text x="140" y="21" class="mono" font-size="10px" font-weight="600" fill="#2563EB">(Regex NX...)</text>')
    
    lines.append('        <rect x="220" y="0" width="210" height="34" rx="6" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.2"/>')
    lines.append('        <text x="230" y="21" class="mono" font-size="11px" font-weight="800" fill="#B45309">Intent: CLAIM_DAMAGE</text>')
    lines.append('      </g>')
    
    # Thesaurus Expansion Pill
    lines.append('      <g transform="translate(0, 130)">')
    lines.append('        <rect x="0" y="0" width="430" height="34" rx="6" fill="#FFFBEB" stroke="#F59E0B" stroke-width="1"/>')
    lines.append('        <text x="15" y="21" class="mono" font-size="10.5px" font-weight="700" fill="#92400E">Từ điển bưu chính: "vỡ" ➔ ["hư hỏng", "bể vỡ", "BBBT"]</text>')
    lines.append('      </g>')
    lines.append('    </g>')
    
    # 3 Bullet Lines
    lines.append('    <text x="85" y="960" font-size="12.5px" font-weight="600" fill="#1E293B">• Tiếp nhận truy vấn tự nhiên từ giao diện người dùng qua SSE Stream</text>')
    lines.append('    <text x="85" y="988" font-size="12.5px" font-weight="600" fill="#1E293B">• Bóc tách tức thì mã vận đơn NEX-88291 và ý định khiếu nại bồi thường</text>')
    lines.append('    <text x="85" y="1016" font-size="12.5px" font-weight="600" fill="#1E293B">• Mở rộng từ khóa nghiệp vụ đặc thù nhằm phục vụ truy vấn BM25</text>')
    
    # Chip Bottom
    lines.append('    <rect x="85" y="1065" width="430" height="32" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>')
    lines.append('    <text x="300" y="1086" class="mono" font-size="11px" font-weight="700" fill="#0284C7" text-anchor="middle">✓ AWB EXTRACTED • THESAURUS EXPANDED</text>')
    lines.append('  </g>')

    # Arrow 2.1 -> 2.2
    lines.append('  <line x1="535" y1="895" x2="575" y2="895" class="flow-arrow"/>')
    lines.append(f'  {draw_arrow(575, 895, "right")}')

    # -------------------------------------------------------------------------
    # Station 2.2: Hybrid Retriever (X: 575, W: 490)
    # -------------------------------------------------------------------------
    lines.append('  <!-- Station 2.2 -->')
    lines.append('  <g id="card-hybrid" filter="url(#cardShadow)">')
    lines.append('    <rect x="575" y="675" width="490" height="445" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8" rx="8"/>')
    lines.append('    <text x="595" y="705" font-size="15px" font-weight="800" fill="#0F172A">7. Bộ truy hồi Lai (Hybrid Fusion)</text>')
    lines.append('    <text x="1045" y="705" class="mono" font-size="11px" font-weight="700" fill="#D97706" text-anchor="end">Cosine + BM25</text>')
    lines.append('    <line x1="595" y1="718" x2="1045" y2="718" stroke="#E2E8F0" stroke-width="1.2"/>')
    
    # Graphic 2.2: Dual-Stream Funnel
    lines.append('    <!-- Graphic: Dual Funnel Combiner -->')
    lines.append('    <g transform="translate(595, 735)">')
    # Dense Stream
    lines.append('      <rect x="0" y="0" width="450" height="42" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.4"/>')
    lines.append('      <rect x="10" y="11" width="80" height="20" rx="3" fill="#2563EB"/>')
    lines.append('      <text x="50" y="25" class="mono" font-size="9.5px" font-weight="800" fill="#FFFFFF" text-anchor="middle">DENSE 70%</text>')
    lines.append('      <text x="100" y="26" font-size="11.5px" font-weight="700" fill="#1E40AF">Sim_Cosine(q, d) = q · d (Tìm kiếm Ngữ nghĩa)</text>')
    
    # Sparse Stream
    lines.append('      <rect x="0" y="52" width="450" height="42" rx="6" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.4"/>')
    lines.append('      <rect x="10" y="63" width="80" height="20" rx="3" fill="#D97706"/>')
    lines.append('      <text x="50" y="77" class="mono" font-size="9.5px" font-weight="800" fill="#FFFFFF" text-anchor="middle">SPARSE 30%</text>')
    lines.append('      <text x="100" y="78" font-size="11.5px" font-weight="700" fill="#92400E">BM25 Khóa Bưu chính ("BBBT", "SLA 24h", "bể vỡ")</text>')
    
    # Linear Scoring Formula Box
    lines.append('      <rect x="0" y="104" width="450" height="58" rx="6" fill="#F0FDF4" stroke="#10B981" stroke-width="1.6"/>')
    lines.append('      <text x="225" y="126" class="mono" font-size="12px" font-weight="900" fill="#065F46" text-anchor="middle">FinalScore = 0.70 · Cosine + 0.30 · BM25</text>')
    lines.append('      <text x="225" y="148" class="mono" font-size="11px" font-weight="700" fill="#047857" text-anchor="middle">Ngưỡng Lọc Phê duyệt: Score ≥ 0.52 (Triệt tiêu nhiễu)</text>')
    lines.append('    </g>')
    
    # 3 Bullet Lines
    lines.append('    <text x="595" y="960" font-size="12.5px" font-weight="600" fill="#1E293B">• Hợp nhất nắm bắt ý định (Dense) và từ khóa chính xác (BM25)</text>')
    lines.append('    <text x="595" y="988" font-size="12.5px" font-weight="600" fill="#1E293B">• Bắt trọn thuật ngữ pháp lý "BBBT" mà Vector thuần dễ bỏ sót</text>')
    lines.append('    <text x="595" y="1016" font-size="12.5px" font-weight="600" fill="#1E293B">• Bộ lọc ngưỡng loại bỏ ngay đoạn trích rác điểm thấp (&lt; 0.52)</text>')
    
    # Chip Bottom
    lines.append('    <rect x="595" y="1065" width="450" height="32" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>')
    lines.append('    <text x="820" y="1086" class="mono" font-size="11px" font-weight="700" fill="#059669" text-anchor="middle">✓ HYBRID SCORE = 0.91 (TOP-1 RELEVANCE)</text>')
    lines.append('  </g>')

    # Arrow 2.2 -> 2.3
    lines.append('  <line x1="1065" y1="895" x2="1105" y2="895" class="flow-arrow"/>')
    lines.append(f'  {draw_arrow(1105, 895, "right")}')

    # -------------------------------------------------------------------------
    # Station 2.3: Top Grounded Chunk (X: 1105, W: 450)
    # -------------------------------------------------------------------------
    lines.append('  <!-- Station 2.3 -->')
    lines.append('  <g id="card-grounded" filter="url(#cardShadow)">')
    lines.append('    <rect x="1105" y="675" width="450" height="445" fill="#FFFFFF" stroke="#059669" stroke-width="2" rx="8"/>')
    lines.append('    <rect x="1105" y="675" width="450" height="34" rx="6" fill="#059669"/>')
    lines.append('    <text x="1125" y="698" font-size="14px" font-weight="900" fill="#FFFFFF">8. Căn cứ Pháp lý (Top Grounded Chunk)</text>')
    lines.append('    <rect x="1465" y="681" width="75" height="22" rx="4" fill="#047857"/>')
    lines.append('    <text x="1502" y="696" class="mono" font-size="11px" font-weight="900" fill="#FFFFFF" text-anchor="middle">SCORE 0.91</text>')
    
    # Graphic 2.3: Verified Certificate / Legal Excerpt Card
    lines.append('    <!-- Graphic: Legal Excerpt Box -->')
    lines.append('    <g transform="translate(1125, 725)">')
    lines.append('      <text x="0" y="20" font-size="13px" font-weight="800" fill="#0F172A">Điều 4.2: Quy chế bồi thường hàng bể vỡ</text>')
    lines.append('      <text x="0" y="38" class="mono" font-size="10px" font-weight="700" fill="#059669">Nguồn: 02-insurance-and-claim-policy.md#chunk-4</text>')
    
    # Excerpt Box
    lines.append('      <rect x="0" y="48" width="410" height="105" rx="6" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1.4"/>')
    lines.append('      <text x="15" y="72" font-size="12px" font-style="italic" fill="#14532D">"Khi phát hiện hàng bể vỡ, bưu cục phát phải lập Biên bản</text>')
    lines.append('      <text x="15" y="92" font-size="12px" font-style="italic" font-weight="700" fill="#DC2626">bất thường (BBBT) trong vòng 24 giờ kể từ lúc phát hiện.</text>')
    lines.append('      <text x="15" y="114" class="mono" font-size="11px" font-weight="800" fill="#047857">• Đền bù 100% giá trị khai giá (đơn hàng có bảo hiểm)</text>')
    lines.append('      <text x="15" y="134" class="mono" font-size="11px" font-weight="800" fill="#047857">• Hạn mức duyệt tự động hệ thống: Tối đa 2.000.000 VNĐ"</text>')
    lines.append('    </g>')
    
    # 3 Bullet Lines
    lines.append('    <text x="1125" y="960" font-size="12.5px" font-weight="600" fill="#1E293B">• Trúng đích tuyệt đối điều khoản xử lý sự cố hàng bể vỡ</text>')
    lines.append('    <text x="1125" y="988" font-size="12.5px" font-weight="600" fill="#1E293B">• Bảo toàn điều kiện bắt buộc: Phải lập biên bản BBBT trong 24 giờ</text>')
    lines.append('    <text x="1125" y="1016" font-size="12.5px" font-weight="600" fill="#1E293B">• Cung cấp sự thật xác thực (Grounding) triệt tiêu hoàn toàn ảo giác AI</text>')
    
    # Chip Bottom
    lines.append('    <rect x="1125" y="1065" width="410" height="32" rx="6" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1"/>')
    lines.append('    <text x="1330" y="1086" class="mono" font-size="11px" font-weight="700" fill="#047857" text-anchor="middle">✓ TOP-1 GROUND TRUTH • ZERO HALLUCINATION</text>')
    lines.append('  </g>')

    # Arrow 2.3 -> 2.4
    lines.append('  <line x1="1555" y1="895" x2="1595" y2="895" class="flow-arrow"/>')
    lines.append(f'  {draw_arrow(1595, 895, "right")}')

    # -------------------------------------------------------------------------
    # Station 2.4: Response Composer & Action Dispatcher (X: 1595, W: 535)
    # -------------------------------------------------------------------------
    lines.append('  <!-- Station 2.4 -->')
    lines.append('  <g id="card-response" filter="url(#cardShadow)">')
    lines.append('    <rect x="1595" y="675" width="535" height="445" fill="#FFFFFF" stroke="#0284C7" stroke-width="2" rx="8"/>')
    lines.append('    <rect x="1595" y="675" width="535" height="34" rx="6" fill="#0284C7"/>')
    lines.append('    <text x="1615" y="698" font-size="14px" font-weight="900" fill="#FFFFFF">9. Phản hồi LLM &amp; Thẻ Tương tác Hành động</text>')
    lines.append('    <rect x="2035" y="681" width="80" height="22" rx="4" fill="#0369A1"/>')
    lines.append('    <text x="2075" y="696" class="mono" font-size="11px" font-weight="900" fill="#FFFFFF" text-anchor="middle">ACTION DISPATCH</text>')
    
    # Graphic 2.4: AI Response Bubble with Interactive Buttons
    lines.append('    <!-- Graphic: LLM Answer with Rich Action Buttons -->')
    lines.append('    <g transform="translate(1615, 725)">')
    # Answer Bubble
    lines.append('      <rect x="0" y="0" width="495" height="100" rx="8" fill="#F0F9FF" stroke="#7DD3FC" stroke-width="1.4"/>')
    lines.append('      <text x="15" y="24" font-size="12.5px" font-weight="700" fill="#0369A1">🤖 Trợ lý Nexus AI phản hồi Shop:</text>')
    lines.append('      <text x="15" y="46" font-size="12px" fill="#0F172A">"Theo <tspan font-weight="bold" fill="#0284C7">Điều 4.2 Quy chế Bồi thường</tspan>, đơn <tspan font-weight="bold">NEX-88291</tspan> bị vỡ được xử lý:</text>')
    lines.append('      <text x="15" y="66" font-size="12px" font-weight="600" fill="#059669">• Đền bù 100% Giá trị khai giá (Đơn hàng có tham gia bảo hiểm).</text>')
    lines.append('      <text x="15" y="86" font-size="12px" font-weight="600" fill="#DC2626">• Điều kiện: Đã có Biên bản bất thường (BBBT) lập trong 24 giờ."</text>')
    
    # Rich Interactive Buttons
    lines.append('      <g transform="translate(0, 112)">')
    # Button 1
    lines.append('        <rect x="0" y="0" width="240" height="40" rx="6" fill="#059669"/>')
    lines.append('        <text x="120" y="25" class="mono" font-size="11.5px" font-weight="900" fill="#FFFFFF" text-anchor="middle">📝 TẠO YÊU CẦU BỒI THƯỜNG</text>')
    # Button 2
    lines.append('        <rect x="255" y="0" width="240" height="40" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.6"/>')
    lines.append('        <text x="375" y="25" class="mono" font-size="11.5px" font-weight="800" fill="#0F172A" text-anchor="middle">🔍 TRA CỨU BIÊN BẢN BBBT</text>')
    lines.append('      </g>')
    lines.append('    </g>')
    
    # 3 Bullet Lines
    lines.append('    <text x="1615" y="960" font-size="12.5px" font-weight="600" fill="#1E293B">• Gemini 1.5 Flash / Groq LLaMA 3.3 tổng hợp phản hồi chính xác</text>')
    lines.append('    <text x="1615" y="988" font-size="12.5px" font-weight="600" fill="#1E293B">• Gắn kèm Rich Action Cards cho phép Shop thao tác tức thì</text>')
    lines.append('    <text x="1615" y="1016" font-size="12.5px" font-weight="600" fill="#1E293B">• Đo lường RAG Triad: Faithfulness 99.8%, Relevance 97.6%</text>')
    
    # Chip Bottom
    lines.append('    <rect x="1615" y="1065" width="495" height="32" rx="6" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1"/>')
    lines.append('    <text x="1862" y="1086" class="mono" font-size="11px" font-weight="700" fill="#047857" text-anchor="middle">✓ FAITHFULNESS: 99.8% • ANSWER RELEVANCE: 97.6%</text>')
    lines.append('  </g>')

    # =========================================================================
    # FOOTER & ACADEMIC STANDARDS (Y: 1160 -> 1235, Height: 75)
    # =========================================================================
    lines.append('  <!-- ==================== FOOTER & FORMULAS ==================== -->')
    lines.append('  <rect x="40" y="1160" width="2120" height="75" fill="#0F172A" rx="8"/>')
    
    # Left: Core Formulas
    lines.append('  <text x="65" y="1188" font-size="12px" font-weight="800" fill="#38BDF8">CÔNG THỨC TOÁN HỌC CỐT LÕI (CORE RAG FORMULAS):</text>')
    lines.append('  <text x="65" y="1212" class="mono" font-size="11.5px" fill="#E2E8F0">1. Cosine Dot-Product: Sim(q, d) = q · d khi ||q||₂ = ||d||₂ = 1.0  |  2. Hybrid Fusion: FinalScore = 0.70·Sim_Cosine + 0.30·Score_BM25 (Ngưỡng Tau ≥ 0.52)</text>')

    # Right: Legend
    lines.append('  <g transform="translate(1500, 1180)">')
    lines.append('    <line x1="0" y1="12" x2="30" y2="12" stroke="#FFFFFF" stroke-width="2"/>')
    lines.append(f'    {draw_arrow(30, 12, "right", "#FFFFFF", 7)}')
    lines.append('    <text x="38" y="16" font-size="11px" font-weight="700" fill="#CBD5E1">Ngoại tuyến (Ingestion)</text>')
    
    lines.append('    <line x1="190" y1="12" x2="220" y2="12" stroke="#0284C7" stroke-width="2.2"/>')
    lines.append(f'    {draw_arrow(220, 12, "right", "#0284C7", 7)}')
    lines.append('    <text x="228" y="16" font-size="11px" font-weight="700" fill="#38BDF8">Truy vấn &amp; Bus</text>')
    
    lines.append('    <line x1="340" y1="12" x2="370" y2="12" stroke="#10B981" stroke-width="2"/>')
    lines.append(f'    {draw_arrow(370, 12, "right", "#10B981", 7)}')
    lines.append('    <text x="378" y="16" font-size="11px" font-weight="700" fill="#34D399">Phản hồi &amp; Hành động</text>')
    lines.append('  </g>')

    lines.append('</svg>')
    
    svg_content = '\n'.join(lines)
    return svg_content

if __name__ == '__main__':
    content = build_svg()
    
    # Strict XML Validation
    ET.fromstring(content)
    print("✓ Strict XML validation PASSED!")
    
    if '<marker' in content:
        raise ValueError("Error: <marker> tag found!")
    print("✓ Marker check PASSED (0 <marker> tags).")
    
    # Save to archive and main
    p1 = "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/archive/05-rag-core-components-pipeline.svg"
    p2 = "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/05-rag-core-components-pipeline.svg"
    
    with open(p1, "w", encoding="utf-8") as f:
        f.write(content)
    with open(p2, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"✓ Saved to {p1}")
    print(f"✓ Saved to {p2}")
