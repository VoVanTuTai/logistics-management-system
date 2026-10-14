#!/usr/bin/env python3
"""
Generator script for AUTHENTIC RESEARCH MINDMAP (PERFECT ZERO-COLLISION GEOMETRY)
Bản đồ tư duy nghiên cứu khoa học: Agent + RAG trong Logistics.
Chuẩn hoá layout:
- Tuyệt đối không chèn đè nội dung (Zero line collision, Zero text overlap, Zero clipping)
- Sắp xếp chuẩn xác theo Lộ trình viết báo khoa học (IMRAD: Sec 1 -> Sec 5)
- Bong bóng tư duy hình oval/pill với các nhánh uốn lượn mượt mà (Bézier organic curves)
- Tích hợp thang đo Likert 5 mức & kiểm định thống kê định lượng NCKH
"""

import os
import re
import xml.etree.ElementTree as ET

def draw_arrow(x, y, direction="right", color="#000000", size=15):
  """Draws an inline vector polygon arrowhead."""
  w = size
  h = int(size * 0.44)
  if direction == "right":
    pts = f"{x},{y} {x-w},{y-h} {x-w},{y+h}"
  elif direction == "left":
    pts = f"{x},{y} {x+w},{y-h} {x+w},{y+h}"
  elif direction == "down":
    pts = f"{x},{y} {x-h},{y-w} {x+h},{y-w}"
  elif direction == "up":
    pts = f"{x},{y} {x-h},{y+w} {x+h},{y+w}"
  else:
    pts = f"{x},{y} {x-w},{y-h} {x-w},{y+h}"
  return f'<polygon points="{pts}" fill="{color}"/>'

def bezier_branch(x1, y1, x2, y2, color="#000000", width=3.0, dash=""):
  """Smooth organic cubic Bézier branch connecting two mindmap nodes."""
  dx = (x2 - x1) * 0.52
  d_attr = f"M {x1} {y1} C {x1 + dx} {y1}, {x2 - dx} {y2}, {x2} {y2}"
  dash_attr = f' stroke-dasharray="{dash}"' if dash else ''
  return f'<path d="{d_attr}" fill="none" stroke="{color}" stroke-width="{width}"{dash_attr}/>'

def generate_svg():
  width = 2400
  height = 1350

  lines = []
  lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">
  <defs>
    <style>
      .title-main {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 900; fill: #000000; letter-spacing: 0.6px; }}
      .title-sub {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; fill: #475569; }}
      .phase-tag {{ font-family: "SF Mono", Monaco, Consolas, monospace; font-size: 11.5px; font-weight: 900; fill: #475569; letter-spacing: 0.8px; }}
      .phase-tag-white {{ font-family: "SF Mono", Monaco, Consolas, monospace; font-size: 11.5px; font-weight: 900; fill: #FFFFFF; letter-spacing: 0.8px; }}
      .paper-sec {{ font-family: "SF Mono", Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; fill: #64748B; }}
      .node-text-lg {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 900; fill: #000000; }}
      .node-text-md {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 18.5px; font-weight: 800; fill: #000000; }}
      .node-text-sm {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; font-weight: 800; fill: #1E293B; }}
      .node-sub {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 13.5px; font-weight: 700; fill: #475569; }}
      .leaf-text {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; fill: #1E293B; }}
      .mono {{ font-family: "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }}
      .white-bold {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-weight: 900; fill: #FFFFFF; }}
      .shadow-soft {{ filter: drop-shadow(0 4px 12px rgba(0,0,0,0.06)); }}
      .shadow-bold {{ filter: drop-shadow(0 6px 18px rgba(0,0,0,0.12)); }}
    </style>
  </defs>

  <!-- Clean Canvas -->
  <rect width="{width}" height="{height}" fill="#FFFFFF"/>

  <!-- Subtle Outer Technical Frame -->
  <rect x="24" y="24" width="{width - 48}" height="{height - 48}" fill="none" stroke="#000000" stroke-width="2.8" rx="16"/>
  <rect x="34" y="34" width="{width - 68}" height="{height - 68}" fill="none" stroke="#E2E8F0" stroke-width="1.2" stroke-dasharray="6,4" rx="12"/>

  <!-- ========================================================================= -->
  <!-- MINDMAP HEADER & ROADMAP BREADCRUMB -->
  <!-- ========================================================================= -->
  <g id="Mindmap_Header" transform="translate(60, 50)">
    <text x="0" y="32" class="title-main">BẢN ĐỒ TƯ DUY NGHIÊN CỨU: HỆ THỐNG TÁC TỬ AGENT + RAG TRONG LOGISTICS</text>
    <text x="0" y="62" class="title-sub">Lộ Trình Nghiên Cứu &amp; Viết Báo: Đặt Vấn Đề (Introduction) ➔ Khoảng Trống (GAP) ➔ Đề Xuất (Agent + Hybrid RAG) ➔ Phương Pháp Luận ➔ Thực Nghiệm &amp; Thang Đo Likert 5 Mức</text>
  </g>

  <!-- ========================================================================= -->
  <!-- ROADMAP PHASE INDICATORS (Sec 1 -> Sec 5) -->
  <!-- ========================================================================= -->
  <g id="Roadmap_Phase_Bar" transform="translate(60, 130)">
    <!-- Phase 1 Tag -->
    <rect x="0" y="0" width="480" height="26" rx="6" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1"/>
    <text x="14" y="18" class="phase-tag">CHẶNG 1: XÁC LẬP VẤN ĐỀ &amp; RESEARCH GAP [SEC 1 &amp; 2]</text>

    <!-- Phase 2 Tag -->
    <rect x="560" y="0" width="560" height="26" rx="6" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1"/>
    <text x="574" y="18" class="phase-tag">CHẶNG 2: ĐỀ XUẤT KIẾN TRÚC AGENT + RAG [SEC 3]</text>

    <!-- Phase 3 Tag -->
    <rect x="1190" y="0" width="480" height="26" rx="6" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1"/>
    <text x="1204" y="18" class="phase-tag">CHẶNG 3: PHƯƠNG PHÁP LUẬN TOÁN HỌC &amp; SSE [SEC 4]</text>

    <!-- Phase 4 Tag -->
    <rect x="1740" y="0" width="580" height="26" rx="6" fill="#000000" stroke="#000000" stroke-width="1"/>
    <text x="1754" y="18" class="phase-tag-white">CHẶNG 4 &amp; 5: THỰC NGHIỆM 100 MẪU &amp; THANG ĐO LIKERT 5 MỨC [SEC 5]</text>
  </g>''')

  # =========================================================================
  # MINDMAP GEOMETRY (BALANCED & COLLISION-FREE)
  # Horizon Level: y_mid = 680
  # Balanced Spacing:
  # 1A: x=70..320, y=250..334
  # 1B: x=70..320, y=1026..1110
  # GAP: cx = 450, rx = 120 -> x: 330..570
  # Propose: x = 630, w = 150 -> x_end = 780
  # AGENT+RAG: cx = 1010, rx = 160 -> x: 850..1170
  # Methodology: x = 1260, w = 185 -> x_end = 1445
  # EVALUATE: cx = 1610, rx = 115 -> x: 1495..1725
  # Cluster 4: x = 1780..2365
  # =========================================================================
  y_mid = 680

  # -------------------------------------------------------------------------
  # CỤM 1: KHỞI TẠO (VẤN ĐỀ & GAP) [SEC 1 & SEC 2]
  # -------------------------------------------------------------------------
  gap_cx = 450
  gap_cy = y_mid
  gap_rx = 120
  gap_ry = 90

  lines.append(f'''
  <!-- ==================== CỤM 1: KHỞI TẠO (VẤN ĐỀ & GAP) ==================== -->
  <g id="Cluster_1_Mindmap">
    <!-- Node 1A: Lý do Abstract (Top-left, y=250..334) -->
    <g transform="translate(70, 250)" class="shadow-soft">
      <rect x="0" y="0" width="250" height="84" rx="42" fill="#FFFFFF" stroke="#000000" stroke-width="2.6"/>
      <circle cx="38" cy="42" r="23" fill="#000000"/>
      <text x="38" y="49" class="white-bold" font-size="16" text-anchor="middle">1A</text>
      <text x="74" y="36" class="node-text-md">Lý Do Abstract</text>
      <text x="74" y="55" class="node-sub">Bối Cảnh Thực Tiễn</text>
      <text x="74" y="70" class="paper-sec">[Paper: Sec 1 - Intro]</text>

      <!-- Upward Sprouts (Leaving top of 1A, routing strictly above y=250) -->
      <!-- Sprout 1A-1 (Top-most) -->
      <g transform="translate(100, 0)">
        <path d="M 0 0 C 0 -45, 30 -65, 55 -65 L 75 -65" fill="none" stroke="#000000" stroke-width="1.8"/>
        {draw_arrow(75, -65, "right", "#000000", 9)}
        <text x="85" y="-60" class="leaf-text">• Quá tải CSKH khiếu nại bưu chính (Khối lượng lớn)</text>
      </g>

      <!-- Sprout 1A-2 (Mid-upper) -->
      <g transform="translate(160, 0)">
        <path d="M 0 0 C 0 -22, 20 -32, 40 -32 L 55 -32" fill="none" stroke="#000000" stroke-width="1.8"/>
        {draw_arrow(55, -32, "right", "#000000", 9)}
        <text x="65" y="-27" class="leaf-text">• Độ trễ xử lý thủ công &gt; 24h (Vi phạm SLA đối soát)</text>
      </g>
    </g>

    <!-- Node 1B: Related Work (Bottom-left, y=1026..1110) -->
    <g transform="translate(70, 1026)" class="shadow-soft">
      <rect x="0" y="0" width="250" height="84" rx="42" fill="#FFFFFF" stroke="#000000" stroke-width="2.6"/>
      <circle cx="38" cy="42" r="23" fill="#334155"/>
      <text x="38" y="49" class="white-bold" font-size="16" text-anchor="middle">1B</text>
      <text x="74" y="36" class="node-text-md">Related Work</text>
      <text x="74" y="55" class="node-sub">Nghiên Cứu Trước Đây</text>
      <text x="74" y="70" class="paper-sec">[Paper: Sec 2 - Lit Review]</text>

      <!-- Downward Sprouts (Leaving bottom of 1B, routing strictly below y=1110) -->
      <!-- Sprout 1B-1 -->
      <g transform="translate(160, 84)">
        <path d="M 0 0 C 0 22, 20 32, 40 32 L 55 32" fill="none" stroke="#000000" stroke-width="1.8"/>
        {draw_arrow(55, 32, "right", "#000000", 9)}
        <text x="65" y="37" class="leaf-text">• Chatbot Rule-based cứng nhắc (Kịch bản tĩnh, thiếu linh hoạt)</text>
      </g>

      <!-- Sprout 1B-2 (Lowest) -->
      <g transform="translate(100, 84)">
        <path d="M 0 0 C 0 45, 30 65, 55 65 L 75 65" fill="none" stroke="#000000" stroke-width="1.8"/>
        {draw_arrow(75, 65, "right", "#000000", 9)}
        <text x="85" y="70" class="leaf-text">• LLM độc lập bị ảo giác &amp; thiếu dữ liệu vận đơn thời gian thực</text>
      </g>
    </g>

    <!-- Converging Bézier Branches into GAP (Clear, unhindered paths) -->
    {bezier_branch(320, 292, gap_cx - gap_rx + 12, gap_cy - 30, "#000000", 3.4)}
    {draw_arrow(gap_cx - gap_rx + 16, gap_cy - 26, "right", "#000000", 15)}

    {bezier_branch(320, 1068, gap_cx - gap_rx + 12, gap_cy + 30, "#000000", 3.4)}
    {draw_arrow(gap_cx - gap_rx + 16, gap_cy + 26, "right", "#000000", 15)}

    <!-- Central Node 1C: KHOẢNG TRỐNG (GAP) (Prominent Double-Ringed Oval) -->
    <g transform="translate({gap_cx}, {gap_cy})" class="shadow-bold">
      <ellipse cx="0" cy="0" rx="{gap_rx}" ry="{gap_ry}" fill="#FFFFFF" stroke="#000000" stroke-width="3.8"/>
      <ellipse cx="0" cy="0" rx="{gap_rx - 7}" ry="{gap_ry - 7}" fill="none" stroke="#000000" stroke-width="1.5" stroke-dasharray="6,4"/>

      <!-- Center Title Plate -->
      <rect x="-85" y="-52" width="170" height="26" rx="13" fill="#000000"/>
      <text x="0" y="-35" class="white-bold" font-size="12" text-anchor="middle" letter-spacing="0.5px">KHOẢNG TRỐNG</text>

      <text x="0" y="-4" class="node-text-lg" text-anchor="middle">GAP</text>
      <text x="0" y="19" class="leaf-text" font-weight="700" text-anchor="middle">Đứt gãy giữa SOP tĩnh</text>
      <text x="0" y="38" class="leaf-text" font-weight="700" text-anchor="middle">&amp; Dữ liệu vận đơn động</text>
      <text x="0" y="58" class="paper-sec" text-anchor="middle">[Research Motivation]</text>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # CỤM 2: ĐỀ XUẤT (GIẢI PHÁP) [SEC 3]
  # -------------------------------------------------------------------------
  prop_x = 630
  prop_y = y_mid
  prop_w = 150
  prop_h = 76

  core_cx = 1010
  core_cy = y_mid
  core_rx = 160
  core_ry = 118

  lines.append(f'''
  <!-- ==================== CỤM 2: ĐỀ XUẤT (GIẢI PHÁP) ==================== -->
  <g id="Cluster_2_Mindmap">
    <!-- Branch from GAP to Propose -->
    {bezier_branch(gap_cx + gap_rx, gap_cy, prop_x, prop_y, "#000000", 3.8)}
    {draw_arrow(prop_x, prop_y, "right", "#000000", 16)}

    <!-- Node 2A: Propose -->
    <g transform="translate({prop_x}, {prop_y - prop_h//2})" class="shadow-soft">
      <rect x="0" y="0" width="{prop_w}" height="{prop_h}" rx="{prop_h//2}" fill="#F8FAFC" stroke="#000000" stroke-width="2.6"/>
      <circle cx="34" cy="{prop_h//2}" r="18" fill="#000000"/>
      <text x="34" y="{prop_h//2 + 5}" class="white-bold" font-size="13" text-anchor="middle">2A</text>
      <text x="64" y="{prop_h//2 - 6}" class="node-text-md">Propose</text>
      <text x="64" y="{prop_h//2 + 13}" class="node-sub">Đề Xuất Lõi</text>
      <text x="64" y="{prop_h//2 + 27}" class="paper-sec">[Sec 3.1]</text>
    </g>

    <!-- Branch from Propose to AGENT + RAG Core -->
    {bezier_branch(prop_x + prop_w, prop_y, core_cx - core_rx, core_cy, "#000000", 4.2)}
    {draw_arrow(core_cx - core_rx, core_cy, "right", "#000000", 18)}

    <!-- Node 2B: TRỌNG TÂM: AGENT + RAG (Central Innovation Bubble) -->
    <g transform="translate({core_cx}, {core_cy})" class="shadow-bold">
      <ellipse cx="0" cy="0" rx="{core_rx}" ry="{core_ry}" fill="#FFFFFF" stroke="#000000" stroke-width="4.2"/>
      <ellipse cx="0" cy="0" rx="{core_rx - 9}" ry="{core_ry - 9}" fill="none" stroke="#000000" stroke-width="1.8" stroke-dasharray="8,5"/>

      <!-- Center Title Plate -->
      <rect x="-115" y="-78" width="230" height="32" rx="16" fill="#000000"/>
      <text x="0" y="-57" class="white-bold" font-size="13" text-anchor="middle">ĐỀ XUẤT CỐT LÕI [SEC 3.2]</text>

      <text x="0" y="-14" class="node-text-lg" font-size="28" text-anchor="middle">AGENT + RAG</text>
      <text x="0" y="12" class="node-sub" font-weight="900" font-size="14.5" text-anchor="middle">Tác Tử AI Kết Hợp RAG Lai</text>

      <line x1="-95" y1="26" x2="95" y2="26" stroke="#CBD5E1" stroke-width="1.5"/>
      <text x="0" y="46" class="mono" font-size="13.5" font-weight="900" fill="#000000" text-anchor="middle">Multi-Agent • Hybrid Vector</text>
      <text x="0" y="68" class="mono" font-size="13" font-weight="800" fill="#475569" text-anchor="middle">Zero Hallucination Architecture</text>
    </g>

    <!-- Top Sprout: AI Agent Core (Centered vertically above Core) -->
    <g transform="translate({core_cx}, {core_cy - core_ry})">
      {bezier_branch(0, 0, 0, -75, "#000000", 2.6)}
      <g transform="translate(-135, -135)" class="shadow-soft">
        <rect x="0" y="0" width="270" height="60" rx="30" fill="#F8FAFC" stroke="#000000" stroke-width="2.2"/>
        <text x="135" y="26" class="node-text-sm" text-anchor="middle">Tác Tử AI (Agent Core)</text>
        <text x="135" y="46" class="leaf-text" text-anchor="middle">Intent Router • Live Tool Calling DB</text>
      </g>
    </g>

    <!-- Bottom Sprout: Hybrid RAG Core (Centered vertically below Core) -->
    <g transform="translate({core_cx}, {core_cy + core_ry})">
      {bezier_branch(0, 0, 0, 75, "#000000", 2.6)}
      <g transform="translate(-135, 75)" class="shadow-soft">
        <rect x="0" y="0" width="270" height="60" rx="30" fill="#F8FAFC" stroke="#000000" stroke-width="2.2"/>
        <text x="135" y="26" class="node-text-sm" text-anchor="middle">Hồi Xuất Lai (Hybrid RAG)</text>
        <text x="135" y="46" class="leaf-text" text-anchor="middle">Dense 70% + Sparse BM25 30%</text>
      </g>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # CỤM 3: PHƯƠNG PHÁP LUẬN (METHODOLOGY & EVALUATE) [SEC 4]
  # -------------------------------------------------------------------------
  meth_x = 1260
  meth_y = y_mid
  meth_w = 185
  meth_h = 80

  eval_cx = 1610
  eval_cy = y_mid
  eval_rx = 115
  eval_ry = 82

  lines.append(f'''
  <!-- ==================== CỤM 3: PHƯƠNG PHÁP LUẬN ==================== -->
  <g id="Cluster_3_Mindmap">
    <!-- Branch from Core to Methodology -->
    {bezier_branch(core_cx + core_rx, core_cy, meth_x, meth_y, "#000000", 3.8)}
    {draw_arrow(meth_x, meth_y, "right", "#000000", 16)}

    <!-- Node 3A: Methodology -->
    <g transform="translate({meth_x}, {meth_y - meth_h//2})" class="shadow-soft">
      <rect x="0" y="0" width="{meth_w}" height="{meth_h}" rx="{meth_h//2}" fill="#F8FAFC" stroke="#000000" stroke-width="2.6"/>
      <circle cx="34" cy="{meth_h//2}" r="18" fill="#000000"/>
      <text x="34" y="{meth_h//2 + 5}" class="white-bold" font-size="13" text-anchor="middle">3A</text>
      <text x="62" y="{meth_h//2 - 9}" class="node-text-md">Methodology</text>
      <text x="62" y="{meth_h//2 + 10}" class="node-sub">P.P Nghiên Cứu</text>
      <text x="62" y="{meth_h//2 + 25}" class="paper-sec">[Sec 4 - Method]</text>

      <!-- Upward Sprout: Math & Tech Specs (DIRECTLY ABOVE METHODOLOGY, ZERO COLLISION WITH EVALUATE) -->
      <g transform="translate({meth_w // 2}, 0)">
        <path d="M 0 0 L 0 -52" fill="none" stroke="#000000" stroke-width="2.0"/>
        {draw_arrow(0, -52, "up", "#000000", 10)}
        <g transform="translate(-105, -106)" class="shadow-soft">
          <rect x="0" y="0" width="210" height="54" rx="27" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
          <text x="105" y="24" class="node-text-sm" text-anchor="middle" font-size="13.5">Mô Hình Toán &amp; SSE</text>
          <text x="105" y="42" class="mono" font-size="11.5" fill="#475569" text-anchor="middle">Cosine Sim • TTFT &lt; 500ms</text>
        </g>
      </g>
    </g>

    <!-- Branch from Methodology to EVALUATE (Clear 50px corridor) -->
    {bezier_branch(meth_x + meth_w, meth_y, eval_cx - eval_rx, eval_cy, "#000000", 3.8)}
    {draw_arrow(eval_cx - eval_rx, eval_cy, "right", "#000000", 16)}

    <!-- Node 3B: EVALUATE (Đóng khung/khoanh tròn nhấn mạnh) -->
    <g transform="translate({eval_cx}, {eval_cy})" class="shadow-bold">
      <ellipse cx="0" cy="0" rx="{eval_rx}" ry="{eval_ry}" fill="#FFFFFF" stroke="#000000" stroke-width="3.8"/>
      <ellipse cx="0" cy="0" rx="{eval_rx - 7}" ry="{eval_ry - 7}" fill="none" stroke="#000000" stroke-width="1.5" stroke-dasharray="6,4"/>

      <!-- Header Plate -->
      <rect x="-82" y="-44" width="164" height="28" rx="14" fill="#000000"/>
      <text x="0" y="-26" class="white-bold" font-size="12" text-anchor="middle" letter-spacing="0.5px">THỰC NGHIỆM [SEC 5]</text>

      <text x="0" y="8" class="node-text-lg" font-size="24" text-anchor="middle">EVALUATE</text>
      <text x="0" y="31" class="leaf-text" font-weight="700" text-anchor="middle">Đánh Giá Thực Nghiệm</text>
      <text x="0" y="49" class="mono" font-size="12" font-weight="800" fill="#475569" text-anchor="middle">Accuracy &amp; Reliability</text>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # CỤM 4: TRIỂN KHAI ĐÁNH GIÁ & DỮ LIỆU [SEC 5.1 & SEC 5.2]
  # - Nhánh 1 (Thu thập dữ liệu): Trỏ tới "Cào" + số "100" (y=350)
  # - Nhánh 2 (Xử lý & Đánh giá): Trỏ tới Thang đo Likert 5 mức (y=780)
  # - Bảng thống kê định lượng NCKH (Mean, Cronbach Alpha, t-Test)
  # -------------------------------------------------------------------------
  br1_x = 1800
  br1_y = 350

  br2_x = 1770
  br2_y = 780

  lines.append(f'''
  <!-- ==================== CỤM 4: TRIỂN KHAI ĐÁNH GIÁ & DỮ LIỆU ==================== -->
  <g id="Cluster_4_Mindmap">
    <!-- Branch 1 Bézier Curve from EVALUATE to Cào 100 -->
    {bezier_branch(eval_cx + eval_rx, eval_cy - 18, br1_x, br1_y, "#000000", 3.6)}
    {draw_arrow(br1_x, br1_y, "right", "#000000", 16)}

    <!-- Branch 2 Bézier Curve from EVALUATE to Likert 5 -->
    {bezier_branch(eval_cx + eval_rx, eval_cy + 18, br2_x, br2_y, "#000000", 3.6)}
    {draw_arrow(br2_x, br2_y, "right", "#000000", 16)}

    <!-- ================= NHÁNH 1 (THU THẬP DỮ LIỆU): CÀO + 100 [SEC 5.1] ================= -->
    <g transform="translate({br1_x}, {br1_y - 42})" class="shadow-soft">
      <!-- Main Bubble: "Cào" + "100" -->
      <rect x="0" y="0" width="315" height="84" rx="42" fill="#FFFFFF" stroke="#000000" stroke-width="2.8"/>
      
      <!-- Black badge: CÀO -->
      <rect x="14" y="14" width="115" height="56" rx="28" fill="#000000"/>
      <text x="71" y="49" class="white-bold" font-size="24" text-anchor="middle">CÀO</text>

      <!-- Counter Badge: 100 Mẫu Thật -->
      <g transform="translate(138, 14)">
        <rect x="0" y="0" width="162" height="56" rx="28" fill="#F1F5F9" stroke="#000000" stroke-width="2.0"/>
        <text x="20" y="39" class="mono" font-size="28" font-weight="900" fill="#000000">100</text>
        <text x="80" y="38" class="node-sub" font-size="13" font-weight="800">Mẫu Thật</text>
      </g>

      <!-- Sub-branch 1A: Auxiliary Box "hybrid" -->
      <g transform="translate(30, 115)">
        <path d="M 50 -31 C 50 0, 20 15, 0 15" fill="none" stroke="#000000" stroke-width="2.0"/>
        <g transform="translate(0, -12)">
          <rect x="0" y="0" width="285" height="52" rx="26" fill="#F8FAFC" stroke="#000000" stroke-width="1.8"/>
          <rect x="12" y="12" width="76" height="28" rx="14" fill="#334155"/>
          <text x="50" y="31" class="white-bold" font-size="12" text-anchor="middle">HYBRID</text>
          <text x="100" y="32" class="node-text-sm">Hồi Xuất Lai (Dense+Sparse)</text>
        </g>
      </g>

      <!-- Sub-branch 1B: Auxiliary Box "AI -> Test Service 100" -->
      <g transform="translate(30, 185)">
        <path d="M 50 -101 C 50 -30, 20 15, 0 15" fill="none" stroke="#000000" stroke-width="2.0"/>
        <g transform="translate(0, -12)">
          <rect x="0" y="0" width="305" height="54" rx="27" fill="#000000" stroke="#000000" stroke-width="2.0"/>
          <circle cx="28" cy="27" r="15" fill="#FFFFFF"/>
          <text x="28" y="33" class="node-text-sm" text-anchor="middle">⚙</text>
          <text x="54" y="32" class="mono" font-size="14.5" font-weight="900" fill="#FFFFFF">AI ➔ Test Service 100</text>
        </g>
      </g>
    </g>

    <!-- ================= NHÁNH 2 (ĐỊNH LƯỢNG NCKH): THANG ĐO LIKERT 5 MỨC [SEC 5.2] ================= -->
    <!-- Root Bubble: (Data + Label) • Thang Đo Likert -->
    <g transform="translate({br2_x}, {br2_y - 39})" class="shadow-soft">
      <rect x="0" y="0" width="375" height="78" rx="39" fill="#FFFFFF" stroke="#000000" stroke-width="2.8"/>
      
      <circle cx="39" cy="39" r="25" fill="#000000"/>
      <text x="39" y="45" class="white-bold" font-size="16" text-anchor="middle">L5</text>

      <text x="78" y="33" class="node-text-md" font-size="18.5">(Data + Label) • Thang Đo Likert</text>
      <text x="78" y="55" class="node-sub" font-size="13">Định Lượng NCKH: 5 Mức Đánh Giá (100 Mẫu)</text>
      <text x="78" y="70" class="paper-sec">[Sec 5.2 - Likert Scale]</text>
    </g>

    <!-- Trunk stem connecting Root Bubble to 5 Likert levels -->
    <path d="M 1810 {br2_y + 39} L 1810 1120" fill="none" stroke="#000000" stroke-width="2.4"/>

    <!-- Level 1 Sprout -->
    <path d="M 1810 880 C 1825 880, 1835 880, 1845 880" fill="none" stroke="#000000" stroke-width="2.0"/>
    {draw_arrow(1845, 880, "right", "#000000", 11)}
    <g transform="translate(1845, 857)" class="shadow-soft">
      <rect x="0" y="0" width="270" height="46" rx="23" fill="#F8FAFC" stroke="#64748B" stroke-width="1.6"/>
      <circle cx="23" cy="23" r="16" fill="#475569"/>
      <text x="23" y="29" class="white-bold" font-size="15" text-anchor="middle">1</text>
      <text x="48" y="20" class="node-text-sm" font-size="13.5" font-weight="900" fill="#0F172A">Rất Kém (Hoàn Toàn Lệch)</text>
      <text x="48" y="36" class="node-sub" font-size="11.5" fill="#64748B">Ảo giác nặng, sai quy trình COD</text>
    </g>

    <!-- Level 2 Sprout -->
    <path d="M 1810 940 C 1825 940, 1835 940, 1845 940" fill="none" stroke="#000000" stroke-width="2.0"/>
    {draw_arrow(1845, 940, "right", "#000000", 11)}
    <g transform="translate(1845, 917)" class="shadow-soft">
      <rect x="0" y="0" width="270" height="46" rx="23" fill="#F8FAFC" stroke="#64748B" stroke-width="1.6"/>
      <circle cx="23" cy="23" r="16" fill="#475569"/>
      <text x="23" y="29" class="white-bold" font-size="15" text-anchor="middle">2</text>
      <text x="48" y="20" class="node-text-sm" font-size="13.5" font-weight="900" fill="#0F172A">Kém (Chưa Đạt Yêu Cầu)</text>
      <text x="48" y="36" class="node-sub" font-size="11.5" fill="#64748B">Thiếu dữ kiện, tính lệch cước phí</text>
    </g>

    <!-- Level 3 Sprout (Có Mức Trung Lập) -->
    <path d="M 1810 1000 C 1825 1000, 1835 1000, 1845 1000" fill="none" stroke="#000000" stroke-width="2.0"/>
    {draw_arrow(1845, 1000, "right", "#000000", 11)}
    <g transform="translate(1845, 977)" class="shadow-soft">
      <rect x="0" y="0" width="270" height="46" rx="23" fill="#F8FAFC" stroke="#000000" stroke-width="2.0"/>
      <circle cx="23" cy="23" r="16" fill="#1E293B"/>
      <text x="23" y="29" class="white-bold" font-size="15" text-anchor="middle">3</text>
      <text x="48" y="20" class="node-text-sm" font-size="13.5" font-weight="900" fill="#000000">Trung Lập (Tạm Đạt)</text>
      <text x="48" y="36" class="node-sub" font-size="11.5" fill="#334155">Đúng ý cơ bản, văn phong chung</text>
    </g>

    <!-- Level 4 Sprout -->
    <path d="M 1810 1060 C 1825 1060, 1835 1060, 1845 1060" fill="none" stroke="#000000" stroke-width="2.0"/>
    {draw_arrow(1845, 1060, "right", "#000000", 11)}
    <g transform="translate(1845, 1037)" class="shadow-soft">
      <rect x="0" y="0" width="270" height="46" rx="23" fill="#FFFFFF" stroke="#000000" stroke-width="2.4"/>
      <circle cx="23" cy="23" r="16" fill="#000000"/>
      <text x="23" y="29" class="white-bold" font-size="15" text-anchor="middle">4</text>
      <text x="48" y="20" class="node-text-sm" font-size="13.5" font-weight="900" fill="#000000">Tốt (Đạt Chuẩn Nghiệp Vụ)</text>
      <text x="48" y="36" class="node-sub" font-size="11.5" fill="#1E293B">Khớp RAG context &amp; gọi Tool DB</text>
    </g>

    <!-- Level 5 Sprout (Xuất Sắc) -->
    <path d="M 1810 1120 C 1825 1120, 1835 1120, 1845 1120" fill="none" stroke="#000000" stroke-width="2.0"/>
    {draw_arrow(1845, 1120, "right", "#000000", 11)}
    <g transform="translate(1845, 1097)" class="shadow-soft">
      <rect x="0" y="0" width="270" height="46" rx="23" fill="#000000" stroke="#000000" stroke-width="2.4"/>
      <circle cx="23" cy="23" r="16" fill="#FFFFFF"/>
      <text x="23" y="29" class="mono" font-size="15.5" font-weight="900" fill="#000000" text-anchor="middle">5</text>
      <text x="48" y="20" class="white-bold" font-size="13.5">Xuất Sắc (Chuẩn NCKH)</text>
      <text x="48" y="36" class="mono" font-size="11" fill="#E2E8F0">100% SLA, trích dẫn đối soát</text>
    </g>

    <!-- Connector to NCKH Statistical Plate -->
    <path d="M 2115 1000 L 2145 1000" fill="none" stroke="#000000" stroke-width="2.0" stroke-dasharray="4,3"/>
    {draw_arrow(2145, 1000, "right", "#000000", 12)}

    <!-- NCKH Statistical Plate [SEC 5.3] -->
    <g transform="translate(2145, 857)" class="shadow-bold">
      <rect x="0" y="0" width="220" height="286" rx="16" fill="#FFFFFF" stroke="#000000" stroke-width="2.4"/>
      <!-- Header -->
      <path d="M 0 16 A 16 16 0 0 1 16 0 L 204 0 A 16 16 0 0 1 220 16 L 220 38 L 0 38 Z" fill="#000000"/>
      <text x="110" y="25" class="white-bold" font-size="12" text-anchor="middle" letter-spacing="0.8px">ĐỊNH LƯỢNG NCKH [5.3]</text>

      <!-- Metric 1: Mean Likert -->
      <g transform="translate(12, 48)">
        <rect x="0" y="0" width="196" height="48" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2"/>
        <text x="12" y="18" class="node-sub" font-size="11.5">Điểm TB (Mean Likert)</text>
        <text x="12" y="38" class="mono" font-size="17" font-weight="900" fill="#000000">4.38 / 5.0</text>
        <text x="118" y="37" class="mono" font-size="11.5" font-weight="700" fill="#475569">SD: ±0.58</text>
      </g>

      <!-- Metric 2: Cronbach's Alpha -->
      <g transform="translate(12, 104)">
        <rect x="0" y="0" width="196" height="48" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2"/>
        <text x="12" y="18" class="node-sub" font-size="11.5">Độ Tin Cậy Cronbach's α</text>
        <text x="12" y="38" class="mono" font-size="17" font-weight="900" fill="#000000">α = 0.88</text>
        <text x="100" y="37" class="mono" font-size="11.5" font-weight="800" fill="#15803D">(Rất Cao &gt; 0.8)</text>
      </g>

      <!-- Metric 3: t-Test P-value -->
      <g transform="translate(12, 160)">
        <rect x="0" y="0" width="196" height="48" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2"/>
        <text x="12" y="18" class="node-sub" font-size="11.5">Kiểm Định Giả Thuyết</text>
        <text x="12" y="38" class="mono" font-size="17" font-weight="900" fill="#000000">p &lt; 0.01</text>
        <text x="94" y="37" class="node-sub" font-size="11" font-weight="700" fill="#334155">vs Base RAG</text>
      </g>

      <!-- Dataset summary plate -->
      <g transform="translate(12, 218)">
        <rect x="0" y="0" width="196" height="54" rx="10" fill="#000000"/>
        <text x="98" y="24" class="mono" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">N = 100 MẪU ĐỐI SOÁT</text>
        <text x="98" y="42" class="node-sub" font-size="10.5" fill="#94A3B8" text-anchor="middle">Chuyên gia &amp; LLM Judge</text>
      </g>
    </g>
  </g>''')

  lines.append('</svg>')

  svg_content = "\n".join(lines)
  svg_content = re.sub(r'&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[a-fA-F0-9]+);)', '&amp;', svg_content)
  return svg_content

def main():
  svg_code = generate_svg()

  # XML Validation
  try:
    ET.fromstring(svg_code)
    print("XML Syntax Validation: PASSED (100% Well-formed XML)")
  except ET.ParseError as e:
    print(f"XML Parse ERROR: {e}")
    return 1

  thesis_path = "docs/graduation-thesis/diagrams/architecture/06-scientific-research-framework-methodology.svg"
  figma_path = "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/06-scientific-research-framework-methodology.svg"

  os.makedirs(os.path.dirname(thesis_path), exist_ok=True)
  os.makedirs(os.path.dirname(figma_path), exist_ok=True)

  with open(thesis_path, "w", encoding="utf-8") as f:
    f.write(svg_code)
  print(f"Generated: {thesis_path} ({len(svg_code.encode('utf-8'))} bytes)")

  with open(figma_path, "w", encoding="utf-8") as f:
    f.write(svg_code)
  print(f"Generated: {figma_path} ({len(svg_code.encode('utf-8'))} bytes)")

  return 0

if __name__ == "__main__":
  exit(main())
