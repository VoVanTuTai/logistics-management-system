#!/usr/bin/env python3
"""
Generator script for Scientific Research & Evaluation Framework Diagram (MINDMAP VERSION)
Bản đồ tư duy nghiên cứu khoa học & đánh giá thực nghiệm: Agent + RAG trong Logistics.
Thiết kế theo phong cách Mindmap chuyên nghiệp, trực quan, dễ trình bày trước Hội đồng.
Tuân thủ 100% skill technical-svg-blueprint:
- Monochrome Technical Blueprint palette (#000000, #FFFFFF, subtle slate grays)
- Zero <marker> tags (all arrowheads native polygons)
- Đường cong Bézier uốn lượn đặc trưng của Mindmap (organic branch flow)
- 4 Nhánh chính phân cấp rõ rệt: Vấn đề & Gap -> Giải pháp (Agent+RAG) -> Phương pháp luận & Evaluate -> Thực nghiệm (Cào 100 & Data+Label 1/0)
"""

import os
import re
import xml.etree.ElementTree as ET

def draw_arrow(x, y, direction="right", color="#000000", size=16):
  """Draws a crisp native inline vector polygon arrowhead."""
  w = size
  h = int(size * 0.42)
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

def bezier_branch(x1, y1, x2, y2, color="#000000", width=2.8, dash=""):
  """Creates a smooth horizontal S-curve Bézier branch typical of mindmaps."""
  dx = (x2 - x1) * 0.5
  d_attr = f"M {x1} {y1} C {x1 + dx} {y1}, {x2 - dx} {y2}, {x2} {y2}"
  dash_attr = f' stroke-dasharray="{dash}"' if dash else ''
  return f'<path d="{d_attr}" fill="none" stroke="{color}" stroke-width="{width}"{dash_attr}/>'

def generate_svg():
  width = 2400
  height = 1450

  lines = []
  lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">
  <defs>
    <style>
      .main-title {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 30px; font-weight: 900; fill: #000000; letter-spacing: 0.5px; }}
      .sub-title {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; fill: #334155; }}
      .branch-title {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 19px; font-weight: 900; fill: #000000; letter-spacing: 0.8px; }}
      .node-title {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 17.5px; font-weight: 900; fill: #000000; }}
      .node-sub {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 13.5px; font-weight: 700; fill: #475569; }}
      .body-txt {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; fill: #1E293B; }}
      .bullet-txt {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; fill: #334155; }}
      .mono {{ font-family: "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }}
      .badge-txt {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 900; fill: #FFFFFF; letter-spacing: 0.8px; }}
      .badge-txt-black {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 900; fill: #000000; letter-spacing: 0.8px; }}
      .flow-badge {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 900; fill: #FFFFFF; }}
      .pill-txt {{ font-family: "SF Mono", Monaco, Consolas, monospace; font-size: 12.5px; font-weight: 900; fill: #000000; }}
      .shadow-blueprint {{ filter: drop-shadow(0 3px 6px rgba(0,0,0,0.08)); }}
    </style>
  </defs>

  <!-- Background Canvas -->
  <rect width="{width}" height="{height}" fill="#FFFFFF"/>

  <!-- Outer Blueprint Technical Double Frame -->
  <rect x="22" y="22" width="{width - 44}" height="{height - 44}" fill="none" stroke="#000000" stroke-width="3.2"/>
  <rect x="32" y="32" width="{width - 64}" height="{height - 64}" fill="none" stroke="#CBD5E1" stroke-width="1.2" stroke-dasharray="8,5"/>

  <!-- ========================================================================= -->
  <!-- HEADER BLOCK (y: 46 -> 150) -->
  <!-- ========================================================================= -->
  <g id="Header_Block" transform="translate(48, 46)">
    <rect x="0" y="0" width="{width - 96}" height="106" rx="8" fill="#F8FAFC" stroke="#000000" stroke-width="2.2"/>
    
    <!-- Title & Subtitle -->
    <text x="32" y="44" class="main-title">BẢN ĐỒ TƯ DUY NGHIÊN CỨU KHOA HỌC &amp; ĐÁNH GIÁ THỰC NGHIỆM (MINDMAP)</text>
    <text x="32" y="74" class="sub-title">Khung Phương Pháp Luận Trợ Lý AI Logistics: Tác Tử Điều Phối (Agent) Kết Hợp Hồi Xuất Tri Thức Lai (Hybrid RAG)</text>
    <text x="32" y="94" class="mono" font-size="13" font-weight="800" fill="#64748B">DIAGRAM TYPE: 4-CLUSTER LOGICAL FLOW MINDMAP • PRESENTATION READY • EMPIRICAL EVALUATION MATRIX</text>

    <!-- Top Right ID Plate -->
    <g transform="translate({width - 450}, 20)">
      <rect x="0" y="0" width="320" height="66" rx="6" fill="#000000" stroke="#000000" stroke-width="1.5"/>
      <text x="160" y="28" font-size="11.5" font-weight="900" fill="#94A3B8" text-anchor="middle" letter-spacing="1.5px">RESEARCH MINDMAP</text>
      <text x="160" y="52" class="mono" font-size="17" font-weight="900" fill="#FFFFFF" text-anchor="middle">MINDMAP-FRAMEWORK-01</text>
    </g>
  </g>''')

  # =========================================================================
  # MINDMAP 4-CLUSTER LAYOUT (Y: 176 -> 1320)
  # Usable width = 2304.
  # Cluster 1 (Khởi tạo: Vấn đề & Gap): x=48, w=480
  # Cluster 2 (Đề xuất: Agent + RAG): x=568, w=540
  # Cluster 3 (Phương pháp luận & Evaluate): x=1148, w=480
  # Cluster 4 (Thực nghiệm & Dữ liệu 100): x=1668, w=684
  # =========================================================================
  c_y = 176
  c_h = 1144

  c1_x = 48
  c1_w = 480

  c2_x = 568
  c2_w = 540

  c3_x = 1148
  c3_w = 480

  c4_x = 1668
  c4_w = 684

  # -------------------------------------------------------------------------
  # CLUSTER 1: CỤM KHỞI TẠO (VẤN ĐỀ) - MINDMAP BRANCH 1
  # -------------------------------------------------------------------------
  lines.append(f'''
  <!-- ================= MINDMAP BRANCH 1: KHỞI TẠO (VẤN ĐỀ) ================= -->
  <g id="Branch_1_Problem_And_Gap" transform="translate({c1_x}, {c_y})">
    <!-- Branch Container Frame with Mindmap Pill Header -->
    <rect x="0" y="0" width="{c1_w}" height="{c_h}" rx="16" fill="#FAFAFA" stroke="#000000" stroke-width="2.2"/>
    <rect x="0" y="0" width="{c1_w}" height="52" rx="16" fill="#E2E8F0" stroke="#000000" stroke-width="2.2"/>
    <circle cx="32" cy="26" r="15" fill="#000000"/>
    <text x="32" y="32" class="flow-badge" text-anchor="middle">1</text>
    <text x="60" y="33" class="branch-title">CỤM KHỞI TẠO (VẤN ĐỀ)</text>
    <text x="{c1_w - 20}" y="33" class="mono" font-size="12" font-weight="900" fill="#475569" text-anchor="end">«Problem Space»</text>

    <!-- Sub-node 1A: Lý do Abstract (Mindmap Bubble Card) -->
    <g transform="translate(24, 78)" class="shadow-blueprint">
      <rect x="0" y="0" width="{c1_w - 48}" height="236" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <rect x="16" y="14" width="160" height="28" rx="6" fill="#000000"/>
      <text x="96" y="33" class="badge-txt" text-anchor="middle">BỐI CẢNH THỰC TIỄN</text>
      <text x="186" y="34" class="node-title">Lý Do Abstract</text>

      <line x1="16" y1="52" x2="{c1_w - 64}" y2="52" stroke="#E2E8F0" stroke-width="1.5"/>

      <text x="18" y="78" class="bullet-txt">• Áp lực vận hành chuỗi cung ứng logistics e-commerce.</text>
      <text x="18" y="104" class="bullet-txt">• Tỷ lệ khiếu nại (bể vỡ, mất hàng, giao chậm) tăng cao.</text>
      <text x="18" y="130" class="bullet-txt">• CSKH thủ công quá tải, thời gian phản hồi SLA &gt; 24h.</text>
      <text x="18" y="156" class="bullet-txt">• Nhu cầu cấp thiết: Tự động hóa thẩm định khiếu nại,</text>
      <text x="30" y="178" class="bullet-txt">hỗ trợ tra cứu tức thì 24/7 và minh bạch chính sách.</text>
      <text x="18" y="212" class="mono" font-size="11.5" font-weight="800" fill="#64748B">» Xuất phát điểm: Bài toán bưu chính thực tế</text>
    </g>

    <!-- Sub-node 1B: Related Work (Mindmap Bubble Card) -->
    <g transform="translate(24, 344)" class="shadow-blueprint">
      <rect x="0" y="0" width="{c1_w - 48}" height="248" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <rect x="16" y="14" width="170" height="28" rx="6" fill="#334155"/>
      <text x="101" y="33" class="badge-txt" text-anchor="middle">TỔNG QUAN NGHIÊN CỨU</text>
      <text x="198" y="34" class="node-title">Related Work</text>

      <line x1="16" y1="52" x2="{c1_w - 64}" y2="52" stroke="#E2E8F0" stroke-width="1.5"/>

      <text x="18" y="78" class="bullet-txt">• Chatbot Rule-based (FAQ tĩnh): Cứng nhắc, không hiểu</text>
      <text x="30" y="100" class="bullet-txt">ngôn ngữ tự nhiên đa dạng của khách hàng.</text>
      <text x="18" y="126" class="bullet-txt">• LLM độc lập (Zero-shot GPT): Ảo giác (Hallucination),</text>
      <text x="30" y="148" class="bullet-txt">thiếu dữ liệu vận đơn nội bộ thời gian thực.</text>
      <text x="18" y="174" class="bullet-txt">• RAG cơ bản (Naive Vector RAG): Dễ bỏ sót các con số</text>
      <text x="30" y="196" class="bullet-txt">hạn mức đền bù cụ thể (30 triệu, 4 lần cước) và mã điều khoản.</text>
      <text x="18" y="226" class="mono" font-size="11.5" font-weight="800" fill="#64748B">» Giới hạn: Chưa đáp ứng tính chính xác pháp lý</text>
    </g>

    <!-- Mindmap Converging Curved Branch Lines into GAP -->
    {bezier_branch(240, 314, 240, 630, "#000000", 3.0)}
    {bezier_branch(240, 592, 240, 630, "#000000", 3.0)}
    {draw_arrow(240, 635, "down", "#000000", 16)}

    <!-- Central Node 1C: KHOẢNG TRỐNG (GAP) (Khoanh viền kép đậm & nổi bật) -->
    <g transform="translate(24, 636)" class="shadow-blueprint">
      <!-- High-emphasis double border with corner styling -->
      <rect x="0" y="0" width="{c1_w - 48}" height="474" rx="16" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>
      <rect x="6" y="6" width="{c1_w - 60}" height="462" rx="12" fill="none" stroke="#000000" stroke-width="1.5" stroke-dasharray="6,4"/>

      <!-- Accent Top Banner -->
      <rect x="18" y="18" width="{c1_w - 84}" height="44" rx="8" fill="#000000"/>
      <text x="{(c1_w - 84)//2 + 18}" y="45" font-size="17" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.2px">★ KHOẢNG TRỐNG NGHIÊN CỨU (GAP) ★</text>

      <g transform="translate(18, 80)">
        <text x="0" y="20" class="node-title" font-size="17">Điểm Giao Thoa Chưa Được Giải Quyết:</text>

        <rect x="0" y="34" width="{c1_w - 84}" height="108" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.4"/>
        <text x="14" y="60" class="body-txt" font-weight="800">1. Đứt Gãy Dữ Liệu Động &amp; Tĩnh:</text>
        <text x="14" y="84" class="bullet-txt">Chưa có cơ chế kết hợp giữa tra cứu chính sách (SOP tĩnh)</text>
        <text x="14" y="108" class="bullet-txt">với trạng thái đơn hàng thời gian thực (Microservices DTOs).</text>

        <rect x="0" y="156" width="{c1_w - 84}" height="108" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.4"/>
        <text x="14" y="182" class="body-txt" font-weight="800">2. Độ Chính Xác Pháp Lý &amp; Nghiệp Vụ:</text>
        <text x="14" y="206" class="bullet-txt">RAG thông thường hay lẫn lộn giữa các hạn mức đền bù,</text>
        <text x="14" y="230" class="bullet-txt">dễ gây tổn thất tài chính nếu phán quyết bồi thường sai luật.</text>

        <rect x="0" y="280" width="{c1_w - 84}" height="90" rx="8" fill="#000000"/>
        <text x="{(c1_w - 84)//2}" y="312" class="mono" font-size="14.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">MỤC TIÊU LẤP ĐẦY KHOẢNG TRỐNG:</text>
        <text x="{(c1_w - 84)//2}" y="340" font-size="14" font-weight="800" fill="#E2E8F0" text-anchor="middle">Kiến Trúc Tác Tử AI + Hồi Xuất Tri Thức Lai</text>
      </g>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # MINDMAP CONNECTOR 1 -> 2: Curved Flowing Branch from GAP to Propose
  # From right edge of GAP (x = 504, y = c_y + 873)
  # to left entry of Propose (x = 592, y = c_y + 158)
  # -------------------------------------------------------------------------
  c1_exit_x = c1_x + c1_w - 24  # 504
  c1_exit_y = c_y + 873
  c2_enter_x = c2_x + 24        # 592
  c2_enter_y = c_y + 158

  lines.append(f'''
  <!-- Mindmap Backbone Curve: GAP -> Propose -->
  <g id="Mindmap_Backbone_1_To_2">
    {bezier_branch(c1_exit_x, c1_exit_y, c2_enter_x, c2_enter_y, "#000000", 3.2)}
    {draw_arrow(c2_enter_x, c2_enter_y, "right", "#000000", 18)}

    <!-- Junction Badge centered on curve midpoint -->
    <g transform="translate(533, {c_y + 500})">
      <rect x="0" y="0" width="30" height="30" rx="6" fill="#000000" stroke="#000000" stroke-width="1.5"/>
      <text x="15" y="20" class="mono" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">GAP</text>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # CLUSTER 2: CỤM ĐỀ XUẤT (GIẢI PHÁP - AGENT + RAG) - MINDMAP BRANCH 2
  # -------------------------------------------------------------------------
  lines.append(f'''
  <!-- ================= MINDMAP BRANCH 2: ĐỀ XUẤT (GIẢI PHÁP) ================= -->
  <g id="Branch_2_Proposed_Solution" transform="translate({c2_x}, {c_y})">
    <!-- Branch Container Frame -->
    <rect x="0" y="0" width="{c2_w}" height="{c_h}" rx="16" fill="#FAFAFA" stroke="#000000" stroke-width="2.2"/>
    <rect x="0" y="0" width="{c2_w}" height="52" rx="16" fill="#E2E8F0" stroke="#000000" stroke-width="2.2"/>
    <circle cx="32" cy="26" r="15" fill="#000000"/>
    <text x="32" y="32" class="flow-badge" text-anchor="middle">2</text>
    <text x="60" y="33" class="branch-title">CỤM ĐỀ XUẤT (GIẢI PHÁP)</text>
    <text x="{c2_w - 20}" y="33" class="mono" font-size="12" font-weight="900" fill="#475569" text-anchor="end">«Solution Space»</text>

    <!-- Node 2A: Propose Architecture (Mindmap Node) -->
    <g transform="translate(24, 78)" class="shadow-blueprint">
      <rect x="0" y="0" width="{c2_w - 48}" height="154" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="2.2"/>
      <rect x="16" y="14" width="130" height="28" rx="6" fill="#000000"/>
      <text x="81" y="33" class="badge-txt" text-anchor="middle">ĐỀ XUẤT</text>
      <text x="156" y="34" class="node-title">Propose Architecture</text>

      <line x1="16" y1="52" x2="{c2_w - 64}" y2="52" stroke="#E2E8F0" stroke-width="1.5"/>

      <text x="18" y="78" class="body-txt" font-weight="800">• Đề xuất kiến trúc Trợ lý AI Bưu chính Đa Tác tử (Multi-Agent)</text>
      <text x="32" y="102" class="bullet-txt">kết hợp cơ chế Hồi xuất Tăng cường Lai (Hybrid RAG).</text>
      <text x="18" y="128" class="body-txt" font-weight="800">• Mục tiêu:</text>
      <text x="96" y="128" class="bullet-txt">Tự động hóa giải quyết khiếu nại, tra cứu cước &amp; hành trình.</text>
    </g>

    <!-- Mindmap Stem Curve from Propose down to AGENT + RAG Core -->
    {bezier_branch(c2_w // 2, 232, c2_w // 2, 266, "#000000", 3.2)}
    {draw_arrow(c2_w // 2, 268, "down", "#000000", 16)}

    <!-- Node 2B: TRỌNG TÂM CỐT LÕI - AGENT + RAG (Prominent Central Mindmap Box) -->
    <g transform="translate(24, 268)" class="shadow-blueprint">
      <!-- Prominent Core Frame: High emphasis double contour -->
      <rect x="0" y="0" width="{c2_w - 48}" height="842" rx="16" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>
      <rect x="8" y="8" width="{c2_w - 64}" height="826" rx="12" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="6,4"/>

      <!-- Core Badge & Title -->
      <g transform="translate(20, 20)">
        <rect x="0" y="0" width="{c2_w - 88}" height="54" rx="8" fill="#000000"/>
        <text x="{(c2_w - 88)//2}" y="34" font-size="19" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1px">TRỌNG TÂM: AGENT + RAG SYSTEM</text>
        <text x="{(c2_w - 88)//2}" y="49" class="mono" font-size="11" font-weight="900" fill="#94A3B8" text-anchor="middle">CORE TECHNOLOGICAL INNOVATION</text>
      </g>

      <!-- Sub-branch 1: AI AGENT (Multi-Agent Coordinator & Live Tools) -->
      <g transform="translate(20, 94)">
        <rect x="0" y="0" width="{c2_w - 88}" height="226" rx="10" fill="#F8FAFC" stroke="#000000" stroke-width="1.8"/>
        <rect x="14" y="14" width="130" height="26" rx="4" fill="#334155"/>
        <text x="79" y="31" class="badge-txt" text-anchor="middle">AI AGENT CORE</text>
        <text x="154" y="32" class="node-title" font-size="17">Tác Tử Điều Phối Ý Định</text>

        <text x="16" y="66" class="bullet-txt">• Phân tích ý định người dùng (Intent Classifier &amp; Router).</text>
        <text x="16" y="92" class="bullet-txt">• Kích hoạt Function Calling / Live Microservices APIs:</text>
        <g transform="translate(16, 104)">
          <rect x="0" y="0" width="140" height="28" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
          <text x="70" y="18" class="mono" font-size="11.5" font-weight="900" fill="#000000" text-anchor="middle">trackShipment()</text>

          <rect x="150" y="0" width="140" height="28" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
          <text x="220" y="18" class="mono" font-size="11.5" font-weight="900" fill="#000000" text-anchor="middle">calculateFee()</text>

          <rect x="300" y="0" width="140" height="28" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.3"/>
          <text x="370" y="18" class="mono" font-size="11.5" font-weight="900" fill="#000000" text-anchor="middle">reportIncident()</text>
        </g>
        <text x="16" y="158" class="bullet-txt">• Hàng rào an toàn: [SEC-01] Rate Limit, [SEC-02] PII Masking.</text>
        <text x="16" y="182" class="bullet-txt">• Quản lý ngữ cảnh: Bộ đệm hội thoại 6 lượt (Rolling 6 Turns).</text>
        <text x="16" y="206" class="mono" font-size="11.5" font-weight="800" fill="#64748B">» Vai trò: Bộ não điều hướng, lấy dữ liệu động thực tế</text>
      </g>

      <!-- Mindmap Connector between Agent and RAG -->
      {bezier_branch((c2_w - 48)//2, 320, (c2_w - 48)//2, 348, "#000000", 2.6, "4,3")}
      {draw_arrow((c2_w - 48)//2, 348, "down", "#000000", 14)}

      <!-- Sub-branch 2: HYBRID RAG CORE (In-Memory Knowledge Retrieval) -->
      <g transform="translate(20, 348)">
        <rect x="0" y="0" width="{c2_w - 88}" height="252" rx="10" fill="#F8FAFC" stroke="#000000" stroke-width="1.8"/>
        <rect x="14" y="14" width="140" height="26" rx="4" fill="#334155"/>
        <text x="84" y="31" class="badge-txt" text-anchor="middle">HYBRID RAG CORE</text>
        <text x="164" y="32" class="node-title" font-size="17">Hồi Xuất Tri Thức Lai (SOP)</text>

        <text x="16" y="66" class="bullet-txt">• Kho tài liệu SOP chuẩn Markdown (Bảo hiểm, bồi thường, cước).</text>
        <text x="16" y="92" class="bullet-txt">• Phân đoạn AST + Cửa sổ trượt (250 từ / gối đầu 40 từ).</text>
        <text x="16" y="118" class="bullet-txt">• Hồi xuất kết hợp 2 kỹ thuật (Hybrid Fusion):</text>
        <g transform="translate(16, 128)">
          <rect x="0" y="0" width="216" height="36" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
          <text x="108" y="23" class="mono" font-size="12" font-weight="900" fill="#000000" text-anchor="middle">Dense Vector (Cosine 70%)</text>

          <rect x="226" y="0" width="216" height="36" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
          <text x="334" y="23" class="mono" font-size="12" font-weight="900" fill="#000000" text-anchor="middle">Sparse Lexical (BM25 30%)</text>
        </g>
        <text x="16" y="190" class="bullet-txt">• Vector Store In-Memory: Tra cứu siêu tốc độ trễ &lt; 5ms.</text>
        <text x="16" y="216" class="bullet-txt">• Trích xuất Top-5 Chunks sát nhất với câu hỏi người dùng.</text>
        <text x="16" y="240" class="mono" font-size="11.5" font-weight="800" fill="#64748B">» Vai trò: Khóa chặt quy chế bưu chính, triệt tiêu bịa đặt</text>
      </g>

      <!-- Sub-branch 3: Context Sandwich Assembly -->
      <g transform="translate(20, 622)">
        <rect x="0" y="0" width="{c2_w - 88}" height="192" rx="10" fill="#FFFFFF" stroke="#000000" stroke-width="2.2"/>
        <text x="16" y="30" class="node-title" font-size="16">Cấu Trúc Bánh Mì Kẹp Ngữ Cảnh (Context Sandwich)</text>
        <line x1="16" y1="42" x2="{c2_w - 104}" y2="42" stroke="#E2E8F0" stroke-width="1.5"/>

        <g transform="translate(16, 52)">
          <rect x="0" y="0" width="{c2_w - 120}" height="26" rx="4" fill="#000000"/>
          <text x="{(c2_w - 120)//2}" y="18" class="mono" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">TẦNG 1: DIRECTIVES (Rào chắn nghiêm ngặt chống ảo giác)</text>

          <rect x="0" y="32" width="{c2_w - 120}" height="26" rx="4" fill="#F1F5F9" stroke="#000000" stroke-width="1.2"/>
          <text x="{(c2_w - 120)//2}" y="50" class="mono" font-size="11" font-weight="900" fill="#000000" text-anchor="middle">TẦNG 2: SOP CHUNKS (5 đoạn quy chế bồi thường từ RAG)</text>

          <rect x="0" y="64" width="{c2_w - 120}" height="26" rx="4" fill="#E2E8F0" stroke="#000000" stroke-width="1.2"/>
          <text x="{(c2_w - 120)//2}" y="82" class="mono" font-size="11" font-weight="900" fill="#000000" text-anchor="middle">TẦNG 3: LIVE DTOs (Dữ liệu đơn hàng thật từ Microservices)</text>

          <rect x="0" y="96" width="{c2_w - 120}" height="26" rx="4" fill="#000000"/>
          <text x="{(c2_w - 120)//2}" y="114" class="mono" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">TẦNG 4: CONVERSATION HISTORY (6 lượt trao đổi gần nhất)</text>
        </g>
      </g>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # MINDMAP CONNECTOR 2 -> 3: Flowing Branch from AGENT+RAG to Methodology
  # From right edge of AGENT+RAG (x = 1108, y = c_y + 350)
  # to left entry of Methodology (x = 1148, y = c_y + 350)
  # -------------------------------------------------------------------------
  c2_exit_x = c2_x + c2_w  # 1108
  c2_exit_y = c_y + 350
  c3_enter_x = c3_x        # 1148
  c3_enter_y = c_y + 350

  lines.append(f'''
  <!-- Mindmap Backbone Curve: Agent+RAG -> Methodology -->
  <g id="Mindmap_Backbone_2_To_3">
    <line x1="{c2_exit_x}" y1="{c2_exit_y}" x2="{c3_enter_x}" y2="{c3_enter_y}" stroke="#000000" stroke-width="3.2"/>
    {draw_arrow(c3_enter_x, c3_enter_y, "right", "#000000", 18)}

    <g transform="translate(1113, {c2_exit_y - 15})">
      <rect x="0" y="0" width="30" height="30" rx="6" fill="#000000" stroke="#000000" stroke-width="1.5"/>
      <text x="15" y="19" class="mono" font-size="9.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">MTH</text>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # CLUSTER 3: CỤM PHƯƠNG PHÁP LUẬN (METHODOLOGY & EVALUATE) - MINDMAP BRANCH 3
  # -------------------------------------------------------------------------
  lines.append(f'''
  <!-- ================= MINDMAP BRANCH 3: PHƯƠNG PHÁP LUẬN ================= -->
  <g id="Branch_3_Methodology" transform="translate({c3_x}, {c_y})">
    <!-- Branch Container Frame -->
    <rect x="0" y="0" width="{c3_w}" height="{c_h}" rx="16" fill="#FAFAFA" stroke="#000000" stroke-width="2.2"/>
    <rect x="0" y="0" width="{c3_w}" height="52" rx="16" fill="#E2E8F0" stroke="#000000" stroke-width="2.2"/>
    <circle cx="32" cy="26" r="15" fill="#000000"/>
    <text x="32" y="32" class="flow-badge" text-anchor="middle">3</text>
    <text x="60" y="33" class="branch-title">CỤM PHƯƠNG PHÁP LUẬN</text>
    <text x="{c3_w - 20}" y="33" class="mono" font-size="12" font-weight="900" fill="#475569" text-anchor="end">«Methodology»</text>

    <!-- Node 3A: Methodology Specification (Mindmap Bubble Card) -->
    <g transform="translate(24, 78)" class="shadow-blueprint">
      <rect x="0" y="0" width="{c3_w - 48}" height="474" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="2.2"/>
      <rect x="16" y="16" width="160" height="28" rx="6" fill="#000000"/>
      <text x="96" y="35" class="badge-txt" text-anchor="middle">PHƯƠNG PHÁP LUẬN</text>
      <text x="186" y="36" class="node-title">Methodology</text>

      <line x1="16" y1="56" x2="{c3_w - 64}" y2="56" stroke="#E2E8F0" stroke-width="1.5"/>

      <text x="18" y="86" class="body-txt" font-weight="800">1. Mô hình Hóa Toán học:</text>
      <text x="18" y="112" class="bullet-txt">• Không gian Vector: d = 1.536 chiều (text-embedding).</text>
      <text x="18" y="136" class="bullet-txt">• Phép đo Cosine:</text>
      <g transform="translate(18, 148)">
        <rect x="0" y="0" width="{c3_w - 84}" height="32" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="{(c3_w - 84)//2}" y="21" class="mono" font-size="12.5" font-weight="900" fill="#000000" text-anchor="middle">Sim(q, d) = (q · d) / (||q|| × ||d||)</text>
      </g>
      <text x="18" y="204" class="bullet-txt">• Hàm mục tiêu Hybrid Score:</text>
      <g transform="translate(18, 214)">
        <rect x="0" y="0" width="{c3_w - 84}" height="32" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="{(c3_w - 84)//2}" y="21" class="mono" font-size="12" font-weight="900" fill="#000000" text-anchor="middle">Score = 0.70 × Sim_Dense + 0.30 × Score_Sparse</text>
      </g>

      <text x="18" y="272" class="body-txt" font-weight="800">2. Đặc tả Kỹ thuật Hệ thống:</text>
      <text x="18" y="298" class="bullet-txt">• Streaming Protocol: Server-Sent Events (SSE).</text>
      <text x="18" y="322" class="bullet-txt">• Độ trễ sinh từ đầu (TTFT): Mục tiêu &lt; 500ms.</text>
      <text x="18" y="346" class="bullet-txt">• Ngôn ngữ nền tảng: NestJS TypeScript + React Web.</text>
      <text x="18" y="370" class="bullet-txt">• LLM Backend: Google Gemini 1.5 / 2.5 Flash API.</text>
      <text x="18" y="394" class="bullet-txt">• Fallback: Rule-based Circuit Breaker khi LLM timeout.</text>

      <g transform="translate(18, 416)">
        <rect x="0" y="0" width="{c3_w - 84}" height="38" rx="6" fill="#000000"/>
        <text x="{(c3_w - 84)//2}" y="24" class="mono" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">TÍNH KHẢ THI • CHUẨN XÁC • MỞ RỘNG CAO</text>
      </g>
    </g>

    <!-- Mindmap Stem Curve down into EVALUATE -->
    {bezier_branch(c3_w // 2, 552, c3_w // 2, 600, "#000000", 3.2)}
    {draw_arrow(c3_w // 2, 600, "down", "#000000", 18)}

    <!-- Node 3B: EVALUATE (Được đóng khung bo tròn nhấn mạnh giai đoạn lớn) -->
    <g transform="translate(24, 600)" class="shadow-blueprint">
      <!-- High emphasis framed evaluation container -->
      <rect x="0" y="0" width="{c3_w - 48}" height="510" rx="16" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>
      <rect x="6" y="6" width="{c3_w - 60}" height="498" rx="12" fill="none" stroke="#000000" stroke-width="1.5" stroke-dasharray="6,4"/>

      <!-- Header Banner -->
      <rect x="18" y="18" width="{c3_w - 84}" height="48" rx="8" fill="#000000"/>
      <text x="{(c3_w - 84)//2 + 18}" y="42" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.2px">★ ĐÁNH GIÁ THỰC NGHIỆM ★</text>
      <text x="{(c3_w - 84)//2 + 18}" y="57" class="mono" font-size="11" font-weight="900" fill="#94A3B8" text-anchor="middle">EVALUATE: EMPIRICAL BENCHMARKING</text>

      <g transform="translate(18, 82)">
        <text x="0" y="20" class="node-title" font-size="17">Mục Tiêu Thẩm Định Khoa Học:</text>

        <rect x="0" y="34" width="{c3_w - 84}" height="98" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.3"/>
        <text x="14" y="58" class="body-txt" font-weight="800">1. Đo lường Độ chính xác (Accuracy):</text>
        <text x="14" y="80" class="bullet-txt">Đảm bảo AI không sinh ảo giác, trả lời đúng</text>
        <text x="14" y="102" class="bullet-txt">các mức bồi thường và chính sách công ty.</text>

        <rect x="0" y="144" width="{c3_w - 84}" height="98" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.3"/>
        <text x="14" y="168" class="body-txt" font-weight="800">2. Kiểm tra Độ tin cậy (Reliability):</text>
        <text x="14" y="190" class="bullet-txt">Khả năng tự động gọi đúng API Microservices</text>
        <text x="14" y="212" class="bullet-txt">với tỷ lệ lỗi dưới ngưỡng cho phép (&lt; 2%).</text>

        <rect x="0" y="254" width="{c3_w - 84}" height="142" rx="8" fill="#000000"/>
        <text x="{(c3_w - 84)//2}" y="282" class="mono" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">TIÊU CHUẨN THỰC NGHIỆM KÉP</text>
        <text x="{(c3_w - 84)//2}" y="310" font-size="14" font-weight="800" fill="#E2E8F0" text-anchor="middle">• Nhánh 1: Cào 100 kịch bản thực tế</text>
        <text x="{(c3_w - 84)//2}" y="338" font-size="14" font-weight="800" fill="#E2E8F0" text-anchor="middle">• Nhánh 2: Đối chiếu nhãn Ground Truth (1 / 0)</text>
        <text x="{(c3_w - 84)//2}" y="366" class="mono" font-size="11.5" font-weight="900" fill="#94A3B8" text-anchor="middle">Xuất ma trận nhầm lẫn (Confusion Matrix)</text>
      </g>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # MINDMAP CONNECTORS 3 -> 4: Branching from EVALUATE into 2 parallel pipelines
  # Exit from EVALUATE right edge: x = c3_x + c3_w (1628), y = c_y + 852 (1028)
  # Branch 1 enters Cluster 4 at y = c_y + 160 (336)
  # Branch 2 enters Cluster 4 at y = c_y + 610 (786)
  # -------------------------------------------------------------------------
  eval_out_x = c3_x + c3_w - 24  # 1604
  eval_out_y = c_y + 855        # 1031
  br1_target_y = c_y + 160      # 336
  br2_target_y = c_y + 610      # 786

  lines.append(f'''
  <!-- Mindmap Dual Branching Curves from EVALUATE to Cluster 4 -->
  <g id="Mindmap_Backbone_3_To_4">
    <!-- Branch 1: Up and Right into Crawl 100 -->
    {bezier_branch(eval_out_x, eval_out_y, c4_x, br1_target_y, "#000000", 3.2)}
    {draw_arrow(c4_x, br1_target_y, "right", "#000000", 18)}

    <!-- Branch 2: Right into Data + Label -->
    {bezier_branch(eval_out_x, eval_out_y, c4_x, br2_target_y, "#000000", 3.2)}
    {draw_arrow(c4_x, br2_target_y, "right", "#000000", 18)}

    <!-- Junction Badge 1 (N1) -->
    <g transform="translate(1633, {br1_target_y - 15})">
      <rect x="0" y="0" width="30" height="30" rx="6" fill="#000000" stroke="#000000" stroke-width="1.5"/>
      <text x="15" y="20" class="mono" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">N1</text>
    </g>

    <!-- Junction Badge 2 (N2) -->
    <g transform="translate(1633, {br2_target_y - 15})">
      <rect x="0" y="0" width="30" height="30" rx="6" fill="#000000" stroke="#000000" stroke-width="1.5"/>
      <text x="15" y="20" class="mono" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">N2</text>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # CLUSTER 4: CỤM TRIỂN KHAI ĐÁNH GIÁ & DỮ LIỆU - MINDMAP BRANCH 4
  # -------------------------------------------------------------------------
  lines.append(f'''
  <!-- ================= MINDMAP BRANCH 4: TRIỂN KHAI ĐÁNH GIÁ & DỮ LIỆU ================= -->
  <g id="Branch_4_Execution_And_Data" transform="translate({c4_x}, {c_y})">
    <!-- Branch Container Frame -->
    <rect x="0" y="0" width="{c4_w}" height="{c_h}" rx="16" fill="#FAFAFA" stroke="#000000" stroke-width="2.2"/>
    <rect x="0" y="0" width="{c4_w}" height="52" rx="16" fill="#E2E8F0" stroke="#000000" stroke-width="2.2"/>
    <circle cx="32" cy="26" r="15" fill="#000000"/>
    <text x="32" y="32" class="flow-badge" text-anchor="middle">4</text>
    <text x="60" y="33" class="branch-title">CỤM TRIỂN KHAI ĐÁNH GIÁ &amp; DỮ LIỆU</text>
    <text x="{c4_w - 20}" y="33" class="mono" font-size="12" font-weight="900" fill="#475569" text-anchor="end">«Empirical Pipeline»</text>

    <!-- ================= NHÁNH 1 (THU THẬP DỮ LIỆU): CÀO 100 ================= -->
    <g transform="translate(24, 70)" class="shadow-blueprint">
      <rect x="0" y="0" width="{c4_w - 48}" height="480" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="2.2"/>

      <!-- Primary Node: "Cào" & "100" -->
      <g transform="translate(16, 16)">
        <rect x="0" y="0" width="310" height="70" rx="8" fill="#000000"/>
        <text x="22" y="45" font-size="26" font-weight="900" fill="#FFFFFF">CÀO DỮ LIỆU</text>
        <text x="210" y="45" class="mono" font-size="15" font-weight="900" fill="#CBD5E1">[CRAWL]</text>
      </g>

      <!-- Prominent 100 Sample Counter Plate -->
      <g transform="translate(340, 16)">
        <rect x="0" y="0" width="{c4_w - 48 - 356}" height="70" rx="8" fill="#F1F5F9" stroke="#000000" stroke-width="2.2"/>
        <text x="20" y="30" class="mono" font-size="11.5" font-weight="900" fill="#475569">DATASET SIZE</text>
        <text x="20" y="58" class="mono" font-size="26" font-weight="900" fill="#000000">N = 100</text>
        <text x="135" y="54" class="body-txt" font-weight="800">Mẫu kiểm thử</text>
      </g>

      <line x1="16" y1="102" x2="{c4_w - 64}" y2="102" stroke="#E2E8F0" stroke-width="1.5"/>

      <!-- Description of Crawl source -->
      <text x="16" y="130" class="body-txt" font-weight="800">Mô Tả Nguồn Dữ Liệu Thu Thập (Crawl Pipeline):</text>
      <text x="16" y="156" class="bullet-txt">• Cào 100 câu hỏi / tình huống thực tế từ diễn đàn, group chủ shop e-commerce.</text>
      <text x="16" y="180" class="bullet-txt">• Đa dạng hóa: 40 câu khiếu nại bể vỡ/đền bù, 30 câu tra cứu hành trình, 30 câu hỏi cước.</text>
      <text x="16" y="204" class="bullet-txt">• Bao gồm cả ngôn ngữ đời thường, tiếng lóng, viết tắt (*"móp hộp"*, *"bom hàng"*, *"đền"*).</text>

      <!-- Sub-Box 1: "hybrid" Note Box -->
      <g transform="translate(16, 222)">
        <rect x="0" y="0" width="{c4_w - 80}" height="106" rx="8" fill="#F8FAFC" stroke="#000000" stroke-width="1.8"/>
        <rect x="14" y="12" width="130" height="24" rx="4" fill="#334155"/>
        <text x="79" y="28" class="badge-txt" text-anchor="middle">TỪ KHÓA: HYBRID</text>
        <text x="154" y="29" class="node-title" font-size="16">Phương Pháp Lai (Hybrid Engine)</text>

        <text x="14" y="62" class="bullet-txt">• 100 mẫu dữ liệu được đưa qua quy trình hồi xuất lai (Hybrid Retrieval).</text>
        <text x="14" y="86" class="bullet-txt">• Kết hợp: Vector 70% + BM25 Lexical 30% + Mở rộng từ điển Logistics SYNONYMS.</text>
      </g>

      <!-- Sub-Box 2: "AI -> Test Service 100" Note Box -->
      <g transform="translate(16, 342)">
        <rect x="0" y="0" width="{c4_w - 80}" height="118" rx="8" fill="#000000"/>
        <rect x="14" y="12" width="180" height="24" rx="4" fill="#FFFFFF"/>
        <text x="104" y="28" class="badge-txt-black" text-anchor="middle">KIỂM THỬ TỰ ĐỘNG HÓA</text>
        <text x="204" y="29" class="node-title" font-size="16" fill="#FFFFFF">AI ➔ Test Service 100</text>

        <text x="14" y="64" class="mono" font-size="13" font-weight="700" fill="#CBD5E1">• Test Runner: Script tự động bắn 100 câu hỏi qua REST / SSE</text>
        <text x="14" y="88" class="mono" font-size="13" font-weight="700" fill="#CBD5E1">• Đo lường: Độ trễ (ms), token tiêu thụ, phản hồi mã HTTP 200</text>
        <text x="14" y="108" class="mono" font-size="12" font-weight="900" fill="#94A3B8">» Output: JSON Logs lưu trữ toàn bộ 100 câu trả lời của AI</text>
      </g>
    </g>

    <!-- Mindmap Branch Curve from Data collection to Ground Truth matching -->
    {bezier_branch(c4_w // 2, 550, c4_w // 2, 580, "#000000", 2.6, "6,4")}
    {draw_arrow(c4_w // 2, 580, "down", "#000000", 16)}

    <!-- ================= NHÁNH 2 (XỬ LÝ & ĐÁNH GIÁ): (DATA + LABEL) ================= -->
    <g transform="translate(24, 580)" class="shadow-blueprint">
      <rect x="0" y="0" width="{c4_w - 48}" height="524" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="2.2"/>

      <!-- Primary Node: "(Data + label)" -->
      <g transform="translate(16, 16)">
        <rect x="0" y="0" width="{c4_w - 80}" height="64" rx="8" fill="#F1F5F9" stroke="#000000" stroke-width="2.2"/>
        <rect x="16" y="16" width="170" height="32" rx="4" fill="#000000"/>
        <text x="101" y="38" class="badge-txt" font-size="14" text-anchor="middle">GROUND TRUTH</text>
        <text x="200" y="40" class="node-title" font-size="22">(Data + label)</text>
        <text x="{c4_w - 100}" y="40" class="mono" font-size="14" font-weight="900" fill="#475569" text-anchor="end">100 Gán Nhãn Chuẩn</text>
      </g>

      <text x="18" y="106" class="bullet-txt">• Mỗi câu trong 100 mẫu được Chuyên gia nghiệp vụ bưu chính gắn nhãn chuẩn:</text>
      <text x="32" y="130" class="bullet-txt">Đúng chính sách bồi thường nào? Cần gọi tool API nào? Kết quả mong đợi là gì?</text>

      <line x1="16" y1="146" x2="{c4_w - 64}" y2="146" stroke="#E2E8F0" stroke-width="1.5"/>

      <!-- Forking into 2 Branches: YES (1/0) and NO (1/0) -->
      <text x="18" y="172" class="body-txt" font-weight="900">Kết Quả Kiểm Thử Đối Chiếu Nhị Phân (Binary Test Outcomes):</text>''')

  # Calculate side-by-side coordinates for YES and NO cards
  usable_card_w = c4_w - 80
  gap_sub = 16
  sub_card_w = (usable_card_w - gap_sub) // 2  # ~270
  yes_card_x = 16
  no_card_x = 16 + sub_card_w + gap_sub

  lines.append(f'''
      <!-- YES (1/0) Sub-card -->
      <g transform="translate({yes_card_x}, 188)">
        <rect x="0" y="0" width="{sub_card_w}" height="196" rx="8" fill="#F8FAFC" stroke="#000000" stroke-width="2.2"/>
        <!-- Header Yes -->
        <rect x="14" y="14" width="100" height="30" rx="4" fill="#000000"/>
        <text x="64" y="35" class="mono" font-size="17" font-weight="900" fill="#FFFFFF" text-anchor="middle">YES (1)</text>
        <text x="124" y="35" class="node-title" font-size="16">Khớp Nhãn</text>

        <line x1="14" y1="54" x2="{sub_card_w - 14}" y2="54" stroke="#CBD5E1" stroke-width="1"/>

        <text x="14" y="80" class="body-txt" font-weight="800">• True Positive / Pass:</text>
        <text x="14" y="104" class="bullet-txt">AI trích xuất đúng điều khoản.</text>
        <text x="14" y="128" class="bullet-txt">Số tiền đền bù chính xác 100%.</text>
        <text x="14" y="152" class="bullet-txt">Gọi đúng API microservice.</text>
        <text x="14" y="180" class="mono" font-size="14" font-weight="900" fill="#000000">Ghi nhận: Score = 1</text>
      </g>

      <!-- NO (1/0) Sub-card -->
      <g transform="translate({no_card_x}, 188)">
        <rect x="0" y="0" width="{sub_card_w}" height="196" rx="8" fill="#F8FAFC" stroke="#000000" stroke-width="2.2"/>
        <!-- Header No -->
        <rect x="14" y="14" width="100" height="30" rx="4" fill="#000000"/>
        <text x="64" y="35" class="mono" font-size="17" font-weight="900" fill="#FFFFFF" text-anchor="middle">NO (0)</text>
        <text x="124" y="35" class="node-title" font-size="16">Lệch Nhãn</text>

        <line x1="14" y1="54" x2="{sub_card_w - 14}" y2="54" stroke="#CBD5E1" stroke-width="1"/>

        <text x="14" y="80" class="body-txt" font-weight="800">• False / Fail / Ảo giác:</text>
        <text x="14" y="104" class="bullet-txt">AI trích xuất nhầm chính sách.</text>
        <text x="14" y="128" class="bullet-txt">Sai lệch con số tiền bồi thường.</text>
        <text x="14" y="152" class="bullet-txt">Gọi nhầm tool hoặc timeout.</text>
        <text x="14" y="180" class="mono" font-size="14" font-weight="900" fill="#000000">Ghi nhận: Score = 0</text>
      </g>

      <!-- Summary Metrics Bar (Confusion Matrix Output) -->
      <g transform="translate(16, 398)">
        <rect x="0" y="0" width="{c4_w - 80}" height="110" rx="8" fill="#000000"/>
        <text x="20" y="32" class="mono" font-size="14.5" font-weight="900" fill="#FFFFFF">XUẤT MA TRẬN ĐÁNH GIÁ (EVALUATION METRICS MATRIX):</text>
        
        <g transform="translate(20, 48)">
          <rect x="0" y="0" width="135" height="46" rx="4" fill="#1E293B" stroke="#475569" stroke-width="1"/>
          <text x="67" y="20" class="mono" font-size="11" font-weight="800" fill="#94A3B8" text-anchor="middle">ACCURACY</text>
          <text x="67" y="38" class="mono" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">≥ 94.0%</text>

          <rect x="145" y="0" width="135" height="46" rx="4" fill="#1E293B" stroke="#475569" stroke-width="1"/>
          <text x="212" y="20" class="mono" font-size="11" font-weight="800" fill="#94A3B8" text-anchor="middle">PRECISION</text>
          <text x="212" y="38" class="mono" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">≥ 93.5%</text>

          <rect x="290" y="0" width="135" height="46" rx="4" fill="#1E293B" stroke="#475569" stroke-width="1"/>
          <text x="357" y="20" class="mono" font-size="11" font-weight="800" fill="#94A3B8" text-anchor="middle">RECALL</text>
          <text x="357" y="38" class="mono" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">≥ 95.0%</text>

          <rect x="435" y="0" width="145" height="46" rx="4" fill="#1E293B" stroke="#475569" stroke-width="1"/>
          <text x="507" y="20" class="mono" font-size="11" font-weight="800" fill="#94A3B8" text-anchor="middle">RETRIEVAL HIT@5</text>
          <text x="507" y="38" class="mono" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">≥ 98.0%</text>
        </g>
      </g>
    </g>
  </g>''')

  # =========================================================================
  # FOOTER & RESEARCH LOGIC BAR (Y: 1338 -> 1410)
  # =========================================================================
  lines.append(f'''  <!-- ================= RESEARCH LOGIC FOOTER BAR ================= -->
  <g id="Research_Logic_Footer" transform="translate(48, 1338)">
    <rect x="0" y="0" width="{width - 96}" height="74" rx="8" fill="#F8FAFC" stroke="#000000" stroke-width="2.2"/>
    <circle cx="28" cy="37" r="14" fill="#000000"/>
    <text x="28" y="43" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">§</text>

    <text x="54" y="30" font-size="15" font-weight="900" fill="#000000">TƯ DUY THUYẾT TRÌNH MINDMAP (PRESENTATION SCRIPT):</text>
    <text x="545" y="30" class="bullet-txt">Trình bày tuần tự 4 bước: Vấn đề ➔ Khoảng trống (Gap) ➔ Giải pháp (Agent + RAG) ➔ Phương pháp luận ➔ Thực nghiệm 100 mẫu (1/0 Matrix).</text>
    
    <text x="54" y="55" class="mono" font-size="13" font-weight="800" fill="#1E293B">BƯỚC 1: Thực tiễn &amp; Hạn chế ➔ BƯỚC 2: GAP pháp lý ➔ BƯỚC 3: Kiến trúc Lõi Tác tử + RAG Lai ➔ BƯỚC 4: Benchmark 100 kịch bản thực tế (Đo lường 1/0).</text>
  </g>

</svg>''')

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

  # Output target: 1 file duy nhất cho luận văn và 1 file mirror cho Figma
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
