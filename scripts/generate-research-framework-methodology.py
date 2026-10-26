#!/usr/bin/env python3
"""
Generator script for Scientific Research & Evaluation Framework Diagram
(Khung Nghiên Cứu Khoa Học & Đánh Giá Thực Nghiệm: Agent + RAG trong Logistics)
Complies 100% with technical-svg-blueprint skill:
- Monochrome Technical Blueprint palette (#000000, #FFFFFF, subtle slate grays)
- Zero <marker> tags (all arrowheads native polygons)
- Pill plates on connectors with white backgrounds
- High-contrast text hierarchy
- Output: 
  - docs/graduation-thesis/diagrams/architecture/06-scientific-research-framework-methodology.svg
  - docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/06-scientific-research-framework-methodology.svg
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

def generate_svg():
  width = 2400
  height = 1450

  lines = []
  lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">
  <defs>
    <style>
      .main-title {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 30px; font-weight: 900; fill: #000000; letter-spacing: 0.5px; }}
      .sub-title {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; fill: #334155; }}
      .sec-title {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 17px; font-weight: 900; fill: #000000; letter-spacing: 1px; }}
      .card-title {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 19px; font-weight: 900; fill: #000000; }}
      .card-sub {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; fill: #475569; }}
      .body-txt {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; font-weight: 600; fill: #1E293B; }}
      .bullet-txt {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 13.5px; font-weight: 600; fill: #334155; }}
      .mono {{ font-family: "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }}
      .badge-txt {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 12.5px; font-weight: 900; fill: #FFFFFF; letter-spacing: 0.8px; }}
      .badge-txt-black {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 12.5px; font-weight: 900; fill: #000000; letter-spacing: 0.8px; }}
      .flow-badge {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 900; fill: #FFFFFF; }}
      .pill-txt {{ font-family: "SF Mono", Monaco, Consolas, monospace; font-size: 13.5px; font-weight: 900; fill: #000000; }}
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
    <text x="32" y="44" class="main-title">KHUNG PHƯƠNG PHÁP NGHIÊN CỨU &amp; ĐÁNH GIÁ THỰC NGHIỆM HỆ THỐNG AI</text>
    <text x="32" y="74" class="sub-title">Scientific Research Logic &amp; Empirical Evaluation Pipeline: Tác Tử AI Kết Hợp RAG Lai Trong Logistics</text>
    <text x="32" y="94" class="mono" font-size="13" font-weight="800" fill="#64748B">STANDARDS: IEEE TRANSACTIONS ON KNOWLEDGE AND DATA ENGINEERING • EVALUATION MATRIX (N = 100 SAMPLES)</text>

    <!-- Top Right ID Plate -->
    <g transform="translate({width - 450}, 20)">
      <rect x="0" y="0" width="320" height="66" rx="6" fill="#000000" stroke="#000000" stroke-width="1.5"/>
      <text x="160" y="28" font-size="11.5" font-weight="900" fill="#94A3B8" text-anchor="middle" letter-spacing="1.5px">RESEARCH BLUEPRINT</text>
      <text x="160" y="52" class="mono" font-size="17" font-weight="900" fill="#FFFFFF" text-anchor="middle">FRAMEWORK-MTH-01</text>
    </g>
  </g>''')

  # =========================================================================
  # 4 MAJOR PIPELINE CLUSTERS (Y: 176 -> 1320)
  # Cluster 1: x=48, w=480
  # Corridor 1-2: 40px (x=528..568)
  # Cluster 2: x=568, w=540
  # Corridor 2-3: 40px (x=1108..1148)
  # Cluster 3: x=1148, w=480
  # Corridor 3-4: 40px (x=1628..1668)
  # Cluster 4: x=1668, w=684
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
  # CLUSTER 1: CỤM KHỞI TẠO (VẤN ĐỀ & GAP)
  # -------------------------------------------------------------------------
  lines.append(f'''
  <!-- ================= CLUSTER 1: PROBLEM & GAP ================= -->
  <g id="Cluster_1_Problem_And_Gap" transform="translate({c1_x}, {c_y})">
    <!-- Outer Container -->
    <rect x="0" y="0" width="{c1_w}" height="{c_h}" rx="10" fill="#FAFAFA" stroke="#000000" stroke-width="2.2"/>
    <rect x="0" y="0" width="{c1_w}" height="48" rx="10" fill="#E2E8F0" stroke="#000000" stroke-width="2.2"/>
    <circle cx="28" cy="24" r="14" fill="#000000"/>
    <text x="28" y="30" class="flow-badge" text-anchor="middle">1</text>
    <text x="54" y="30" class="sec-title">CỤM KHỞI TẠO (VẤN ĐỀ)</text>
    <text x="{c1_w - 20}" y="30" class="mono" font-size="13" font-weight="800" fill="#475569" text-anchor="end">«Problem Space»</text>

    <!-- Node 1A: Lý do Abstract -->
    <g transform="translate(24, 76)" class="shadow-blueprint">
      <rect x="0" y="0" width="{c1_w - 48}" height="240" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
      <!-- Header pill -->
      <rect x="14" y="14" width="170" height="26" rx="4" fill="#000000"/>
      <text x="99" y="31" class="badge-txt" text-anchor="middle">BỐI CẢNH TỔNG QUAN</text>
      <text x="194" y="32" class="card-title">Lý Do Abstract</text>
      
      <line x1="14" y1="52" x2="{c1_w - 62}" y2="52" stroke="#E2E8F0" stroke-width="1.5"/>

      <text x="16" y="80" class="bullet-txt">• Áp lực vận hành chuỗi cung ứng logistics e-commerce.</text>
      <text x="16" y="108" class="bullet-txt">• Tỷ lệ khiếu nại (bể vỡ, mất hàng, giao chậm) tăng cao.</text>
      <text x="16" y="136" class="bullet-txt">• CSKH thủ công quá tải, độ trễ phản hồi SLA &gt; 24h.</text>
      <text x="16" y="164" class="bullet-txt">• Nhu cầu cấp thiết: Tự động hóa thẩm định khiếu nại,</text>
      <text x="30" y="188" class="bullet-txt">hỗ trợ tra cứu tức thì 24/7 và minh bạch chính sách.</text>
      <text x="16" y="218" class="mono" font-size="12" font-weight="800" fill="#64748B">» Domain: Bưu chính, Thương mại điện tử, CSKH AI</text>
    </g>

    <!-- Node 1B: Related Work -->
    <g transform="translate(24, 346)" class="shadow-blueprint">
      <rect x="0" y="0" width="{c1_w - 48}" height="254" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="1.8"/>
      <!-- Header pill -->
      <rect x="14" y="14" width="180" height="26" rx="4" fill="#334155"/>
      <text x="104" y="31" class="badge-txt" text-anchor="middle">NGHIÊN CỨU LIÊN QUAN</text>
      <text x="204" y="32" class="card-title">Related Work</text>

      <line x1="14" y1="52" x2="{c1_w - 62}" y2="52" stroke="#E2E8F0" stroke-width="1.5"/>

      <text x="16" y="80" class="bullet-txt">• Chatbot dựa trên Rule-based (FAQ tĩnh): Thiếu linh hoạt,</text>
      <text x="30" y="104" class="bullet-txt">không thể hiểu ngôn ngữ tự nhiên phức tạp của khách.</text>
      <text x="16" y="132" class="bullet-txt">• LLM độc lập (Zero-shot GPT): Ảo giác (Hallucination),</text>
      <text x="30" y="156" class="bullet-txt">không có dữ liệu vận đơn thực, không biết chính sách công ty.</text>
      <text x="16" y="184" class="bullet-txt">• RAG cơ bản (Naive Vector RAG): Thường bỏ sót con số</text>
      <text x="30" y="208" class="bullet-txt">bồi thường cụ thể (ví dụ 30 triệu, 4 lần cước) và mã luật.</text>
      <text x="16" y="234" class="mono" font-size="12" font-weight="800" fill="#64748B">» Limitations: Mất kiểm soát dữ liệu, tỷ lệ sai sót cao</text>
    </g>

    <!-- Converging Arrows into GAP (Node 1A and 1B into 1C) -->
    <!-- Center x of cards = 24 + (480-48)/2 = 240 -->
    <line x1="240" y1="316" x2="240" y2="346" stroke="#000000" stroke-width="2.5"/>
    {draw_arrow(240, 346, "down", "#000000", 14)}

    <line x1="240" y1="600" x2="240" y2="650" stroke="#000000" stroke-width="2.5"/>
    {draw_arrow(240, 650, "down", "#000000", 14)}

    <!-- Central Node 1C: GAP (High-Emphasis Double Bordered / Ringed) -->
    <g transform="translate(24, 650)" class="shadow-blueprint">
      <!-- High emphasis frame: outer double stroke & corner markers -->
      <rect x="0" y="0" width="{c1_w - 48}" height="454" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>
      <rect x="6" y="6" width="{c1_w - 60}" height="442" rx="9" fill="none" stroke="#000000" stroke-width="1.4" stroke-dasharray="6,4"/>

      <!-- Accent Top Banner -->
      <rect x="18" y="18" width="{c1_w - 84}" height="40" rx="6" fill="#000000"/>
      <text x="{(c1_w - 84)//2 + 18}" y="43" font-size="17" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1px">★ KHOẢNG TRỐNG NGHIÊN CỨU (GAP) ★</text>

      <g transform="translate(18, 76)">
        <text x="0" y="20" class="card-title" font-size="18">Điểm Giao Thoa Chưa Được Giải Quyết:</text>
        
        <rect x="0" y="36" width="{c1_w - 84}" height="106" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="14" y="62" class="body-txt" font-weight="800">1. Đứt gãy Dữ liệu Động &amp; Tĩnh:</text>
        <text x="14" y="86" class="bullet-txt">Chưa có cơ chế kết hợp giữa tra cứu chính sách (SOP tĩnh)</text>
        <text x="14" y="110" class="bullet-txt">với trạng thái đơn hàng thời gian thực (Microservices DTOs).</text>

        <rect x="0" y="156" width="{c1_w - 84}" height="106" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="14" y="182" class="body-txt" font-weight="800">2. Độ chính xác Pháp lý &amp; Nghiệp vụ:</text>
        <text x="14" y="206" class="bullet-txt">RAG thông thường hay lẫn lộn giữa các hạn mức đền bù,</text>
        <text x="14" y="230" class="bullet-txt">dễ gây tổn thất tài chính nếu phán quyết bồi thường sai luật.</text>

        <rect x="0" y="276" width="{c1_w - 84}" height="76" rx="6" fill="#000000"/>
        <text x="{(c1_w - 84)//2}" y="306" class="mono" font-size="14.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">MỤC TIÊU CỐT LÕI CẦN LẤP ĐẦY:</text>
        <text x="{(c1_w - 84)//2}" y="332" font-size="14" font-weight="800" fill="#E2E8F0" text-anchor="middle">Hệ thống Tác tử Điều phối + RAG Lai In-Memory</text>
      </g>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # CONNECTOR 1 -> 2: Orthogonal Manhattan line from GAP to PROPOSE
  # From right edge of GAP (x = c1_x + c1_w - 24, y = c_y + 877)
  # out to corridor (x = 528), UP to Propose entry (y = c_y + 156), and into Propose (x = c2_x + 24)
  # -------------------------------------------------------------------------
  gap_exit_x = c1_x + c1_w  # 528
  gap_exit_y = c_y + 877
  propose_enter_x = c2_x    # 568
  propose_enter_y = c_y + 156

  lines.append(f'''
  <!-- Connector: GAP -> Propose (Orthogonal Manhattan Routing) -->
  <g id="Connector_GAP_To_Propose">
    <path d="M {gap_exit_x - 24} {gap_exit_y} L {gap_exit_x + 20} {gap_exit_y} L {gap_exit_x + 20} {propose_enter_y} L {propose_enter_x + 24} {propose_enter_y}" fill="none" stroke="#000000" stroke-width="3.2"/>
    {draw_arrow(propose_enter_x + 24, propose_enter_y, "right", "#000000", 18)}

    <!-- Compact Junction Badge on Corridor Line (x=548) -->
    <g transform="translate(533, {c_y + 500})">
      <rect x="0" y="0" width="30" height="30" rx="6" fill="#000000" stroke="#000000" stroke-width="1.5"/>
      <text x="15" y="20" class="mono" font-size="10.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">GAP</text>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # CLUSTER 2: CỤM ĐỀ XUẤT (GIẢI PHÁP - AGENT + RAG)
  # -------------------------------------------------------------------------
  lines.append(f'''
  <!-- ================= CLUSTER 2: PROPOSED SOLUTION ================= -->
  <g id="Cluster_2_Proposed_Solution" transform="translate({c2_x}, {c_y})">
    <!-- Outer Container -->
    <rect x="0" y="0" width="{c2_w}" height="{c_h}" rx="10" fill="#FAFAFA" stroke="#000000" stroke-width="2.2"/>
    <rect x="0" y="0" width="{c2_w}" height="48" rx="10" fill="#E2E8F0" stroke="#000000" stroke-width="2.2"/>
    <circle cx="28" cy="24" r="14" fill="#000000"/>
    <text x="28" y="30" class="flow-badge" text-anchor="middle">2</text>
    <text x="54" y="30" class="sec-title">CỤM ĐỀ XUẤT (GIẢI PHÁP)</text>
    <text x="{c2_w - 20}" y="30" class="mono" font-size="13" font-weight="800" fill="#475569" text-anchor="end">«Solution Space»</text>

    <!-- Node 2A: Propose -->
    <g transform="translate(24, 76)" class="shadow-blueprint">
      <rect x="0" y="0" width="{c2_w - 48}" height="160" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <rect x="16" y="16" width="130" height="26" rx="4" fill="#000000"/>
      <text x="81" y="33" class="badge-txt" text-anchor="middle">ĐỀ XUẤT</text>
      <text x="156" y="34" class="card-title">Propose Architecture</text>

      <line x1="16" y1="54" x2="{c2_w - 64}" y2="54" stroke="#E2E8F0" stroke-width="1.5"/>

      <text x="18" y="82" class="body-txt" font-weight="800">• Đề xuất kiến trúc Trợ lý AI Bưu chính Đa Tác tử (Multi-Agent)</text>
      <text x="32" y="106" class="bullet-txt">kết hợp cơ chế Hồi xuất Tăng cường Lai (Hybrid RAG).</text>
      <text x="18" y="132" class="body-txt" font-weight="800">• Mục tiêu:</text>
      <text x="100" y="132" class="bullet-txt">Tự động hóa giải quyết khiếu nại, tra cứu cước &amp; hành trình.</text>
    </g>

    <!-- Connector: Propose down into AGENT + RAG -->
    <line x1="{c2_w // 2}" y1="236" x2="{c2_w // 2}" y2="276" stroke="#000000" stroke-width="3.2"/>
    {draw_arrow(c2_w // 2, 276, "down", "#000000", 18)}

    <!-- Node 2B: TRỌNG TÂM CỐT LÕI - AGENT + RAG (Prominent Core Innovation Frame) -->
    <g transform="translate(24, 276)" class="shadow-blueprint">
      <!-- Prominent Core Frame: double contour with dark header plate -->
      <rect x="0" y="0" width="{c2_w - 48}" height="828" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>
      <rect x="8" y="8" width="{c2_w - 64}" height="812" rx="8" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="6,4"/>

      <!-- Core Badge & Title -->
      <g transform="translate(20, 20)">
        <rect x="0" y="0" width="{c2_w - 88}" height="52" rx="6" fill="#000000"/>
        <text x="{(c2_w - 88)//2}" y="33" font-size="19" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1px">TRỌNG TÂM: AGENT + RAG SYSTEM</text>
        <text x="{(c2_w - 88)//2}" y="48" class="mono" font-size="10.5" font-weight="900" fill="#94A3B8" text-anchor="middle">CORE TECHNOLOGICAL INNOVATION</text>
      </g>

      <!-- Sub-block 1: AI AGENT (Autonomous Reasoning & Tool Use) -->
      <g transform="translate(20, 92)">
        <rect x="0" y="0" width="{c2_w - 88}" height="220" rx="8" fill="#F8FAFC" stroke="#000000" stroke-width="1.8"/>
        <rect x="14" y="14" width="130" height="24" rx="4" fill="#334155"/>
        <text x="79" y="30" class="badge-txt" text-anchor="middle">AI AGENT CORE</text>
        <text x="154" y="31" class="card-title" font-size="17">Tác Tử Điều Phối Ý Định</text>

        <text x="16" y="66" class="bullet-txt">• Phân tích ý định người dùng (Intent Classifier &amp; Router).</text>
        <text x="16" y="92" class="bullet-txt">• Kích hoạt Function Calling / Live Microservices APIs:</text>
        <g transform="translate(16, 104)">
          <rect x="0" y="0" width="140" height="26" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="70" y="17" class="mono" font-size="11.5" font-weight="900" fill="#000000" text-anchor="middle">trackShipment()</text>

          <rect x="150" y="0" width="140" height="26" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="220" y="17" class="mono" font-size="11.5" font-weight="900" fill="#000000" text-anchor="middle">calculateFee()</text>

          <rect x="300" y="0" width="140" height="26" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
          <text x="370" y="17" class="mono" font-size="11.5" font-weight="900" fill="#000000" text-anchor="middle">reportIncident()</text>
        </g>
        <text x="16" y="156" class="bullet-txt">• Hàng rào an toàn: [SEC-01] Rate Limit, [SEC-02] PII Masking.</text>
        <text x="16" y="180" class="bullet-txt">• Quản lý ngữ cảnh: Bộ đệm hội thoại 6 lượt (Rolling 6 Turns).</text>
        <text x="16" y="204" class="mono" font-size="11.5" font-weight="800" fill="#64748B">» Vai trò: Bộ não điều hướng, lấy dữ liệu động thực tế</text>
      </g>

      <!-- Bridge Connector between Agent and RAG -->
      <line x1="{(c2_w - 48)//2}" y1="312" x2="{(c2_w - 48)//2}" y2="340" stroke="#000000" stroke-width="2.5" stroke-dasharray="4,3"/>
      {draw_arrow((c2_w - 48)//2, 340, "down", "#000000", 14)}

      <!-- Sub-block 2: RAG LAI (Hybrid In-Memory Retrieval) -->
      <g transform="translate(20, 340)">
        <rect x="0" y="0" width="{c2_w - 88}" height="248" rx="8" fill="#F8FAFC" stroke="#000000" stroke-width="1.8"/>
        <rect x="14" y="14" width="140" height="24" rx="4" fill="#334155"/>
        <text x="84" y="30" class="badge-txt" text-anchor="middle">HYBRID RAG CORE</text>
        <text x="164" y="31" class="card-title" font-size="17">Hồi Xuất Tri Thức Lai (SOP)</text>

        <text x="16" y="66" class="bullet-txt">• Kho tài liệu SOP chuẩn Markdown (Bảo hiểm, bồi thường, cước).</text>
        <text x="16" y="92" class="bullet-txt">• Phân đoạn AST + Cửa sổ trượt (250 từ / gối đầu 40 từ).</text>
        <text x="16" y="118" class="bullet-txt">• Hồi xuất kết hợp 2 kỹ thuật (Hybrid Fusion):</text>
        <g transform="translate(16, 128)">
          <rect x="0" y="0" width="216" height="34" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
          <text x="108" y="22" class="mono" font-size="12" font-weight="900" fill="#000000" text-anchor="middle">Dense Vector (Cosine 70%)</text>

          <rect x="226" y="0" width="216" height="34" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="1.4"/>
          <text x="334" y="22" class="mono" font-size="12" font-weight="900" fill="#000000" text-anchor="middle">Sparse Lexical (BM25 30%)</text>
        </g>
        <text x="16" y="188" class="bullet-txt">• Vector Store In-Memory: Tra cứu siêu tốc độ trễ &lt; 5ms.</text>
        <text x="16" y="214" class="bullet-txt">• Trích xuất Top-5 Chunks sát nhất với câu hỏi người dùng.</text>
        <text x="16" y="238" class="mono" font-size="11.5" font-weight="800" fill="#64748B">» Vai trò: Khóa chặt quy chế bưu chính, triệt tiêu bịa đặt</text>
      </g>

      <!-- Sub-block 3: Context Sandwich Assembly -->
      <g transform="translate(20, 608)">
        <rect x="0" y="0" width="{c2_w - 88}" height="184" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
        <text x="16" y="28" class="card-title" font-size="16">Cấu Trúc Bánh Mì Kẹp Ngữ Cảnh (Context Sandwich)</text>
        <line x1="16" y1="38" x2="{c2_w - 104}" y2="38" stroke="#E2E8F0" stroke-width="1.5"/>

        <g transform="translate(16, 48)">
          <rect x="0" y="0" width="{c2_w - 120}" height="24" rx="3" fill="#000000"/>
          <text x="{(c2_w - 120)//2}" y="16" class="mono" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">TẦNG 1: DIRECTIVES (Rào chắn nghiêm ngặt chống ảo giác)</text>

          <rect x="0" y="30" width="{c2_w - 120}" height="24" rx="3" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
          <text x="{(c2_w - 120)//2}" y="46" class="mono" font-size="11" font-weight="900" fill="#000000" text-anchor="middle">TẦNG 2: SOP CHUNKS (5 đoạn quy chế bồi thường từ RAG)</text>

          <rect x="0" y="60" width="{c2_w - 120}" height="24" rx="3" fill="#E2E8F0" stroke="#000000" stroke-width="1"/>
          <text x="{(c2_w - 120)//2}" y="76" class="mono" font-size="11" font-weight="900" fill="#000000" text-anchor="middle">TẦNG 3: LIVE DTOs (Dữ liệu đơn hàng thật từ Microservices)</text>

          <rect x="0" y="90" width="{c2_w - 120}" height="24" rx="3" fill="#000000"/>
          <text x="{(c2_w - 120)//2}" y="106" class="mono" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">TẦNG 4: CONVERSATION HISTORY (6 lượt trao đổi gần nhất)</text>
        </g>
      </g>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # CONNECTOR 2 -> 3: From AGENT+RAG to METHODOLOGY
  # -------------------------------------------------------------------------
  c2_to_c3_y = c_y + 350
  lines.append(f'''
  <!-- Connector: Cluster 2 -> Cluster 3 -->
  <g id="Connector_Cluster2_To_Cluster3">
    <line x1="{c2_x + c2_w}" y1="{c2_to_c3_y}" x2="{c3_x}" y2="{c2_to_c3_y}" stroke="#000000" stroke-width="3.2"/>
    {draw_arrow(c3_x, c2_to_c3_y, "right", "#000000", 18)}

    <g transform="translate(1113, {c2_to_c3_y - 15})">
      <rect x="0" y="0" width="30" height="30" rx="6" fill="#000000" stroke="#000000" stroke-width="1.5"/>
      <text x="15" y="19" class="mono" font-size="9.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">MTH</text>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # CLUSTER 3: CỤM PHƯƠNG PHÁP LUẬN (METHODOLOGY & EVALUATE)
  # -------------------------------------------------------------------------
  lines.append(f'''
  <!-- ================= CLUSTER 3: METHODOLOGY & EVALUATION ================= -->
  <g id="Cluster_3_Methodology" transform="translate({c3_x}, {c_y})">
    <!-- Outer Container -->
    <rect x="0" y="0" width="{c3_w}" height="{c_h}" rx="10" fill="#FAFAFA" stroke="#000000" stroke-width="2.2"/>
    <rect x="0" y="0" width="{c3_w}" height="48" rx="10" fill="#E2E8F0" stroke="#000000" stroke-width="2.2"/>
    <circle cx="28" cy="24" r="14" fill="#000000"/>
    <text x="28" y="30" class="flow-badge" text-anchor="middle">3</text>
    <text x="54" y="30" class="sec-title">CỤM PHƯƠNG PHÁP LUẬN</text>
    <text x="{c3_w - 20}" y="30" class="mono" font-size="13" font-weight="800" fill="#475569" text-anchor="end">«Methodology»</text>

    <!-- Node 3A: Methodology Specification -->
    <g transform="translate(24, 76)" class="shadow-blueprint">
      <rect x="0" y="0" width="{c3_w - 48}" height="470" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <!-- Method distinct badge -->
      <rect x="16" y="16" width="160" height="28" rx="4" fill="#000000"/>
      <text x="96" y="35" class="badge-txt" text-anchor="middle">PHƯƠNG PHÁP LUẬN</text>
      <text x="186" y="36" class="card-title">Methodology</text>

      <line x1="16" y1="56" x2="{c3_w - 64}" y2="56" stroke="#E2E8F0" stroke-width="1.5"/>

      <text x="18" y="86" class="body-txt" font-weight="800">1. Mô hình Hóa Toán học:</text>
      <text x="18" y="112" class="bullet-txt">• Không gian Vector: d = 1.536 chiều (text-embedding).</text>
      <text x="18" y="136" class="bullet-txt">• Phép đo Cosine:</text>
      <g transform="translate(18, 148)">
        <rect x="0" y="0" width="{c3_w - 84}" height="32" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
        <text x="{(c3_w - 84)//2}" y="21" class="mono" font-size="12.5" font-weight="900" fill="#000000" text-anchor="middle">Sim(q, d) = (q · d) / (||q|| × ||d||)</text>
      </g>
      <text x="18" y="204" class="bullet-txt">• Hàm mục tiêu Hybrid Score:</text>
      <g transform="translate(18, 214)">
        <rect x="0" y="0" width="{c3_w - 84}" height="32" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
        <text x="{(c3_w - 84)//2}" y="21" class="mono" font-size="12" font-weight="900" fill="#000000" text-anchor="middle">Score = 0.70 × Sim_Dense + 0.30 × Score_Sparse</text>
      </g>

      <text x="18" y="272" class="body-txt" font-weight="800">2. Đặc tả Kỹ thuật Hệ thống:</text>
      <text x="18" y="298" class="bullet-txt">• Streaming Protocol: Server-Sent Events (SSE).</text>
      <text x="18" y="322" class="bullet-txt">• Độ trễ sinh từ đầu (TTFT): Mục tiêu &lt; 500ms.</text>
      <text x="18" y="346" class="bullet-txt">• Ngôn ngữ nền tảng: NestJS TypeScript + React Web.</text>
      <text x="18" y="370" class="bullet-txt">• LLM Backend: Google Gemini 1.5 / 2.5 Flash API.</text>
      <text x="18" y="394" class="bullet-txt">• Fallback: Rule-based Circuit Breaker khi LLM timeout.</text>

      <g transform="translate(18, 414)">
        <rect x="0" y="0" width="{c3_w - 84}" height="36" rx="4" fill="#000000"/>
        <text x="{(c3_w - 84)//2}" y="23" class="mono" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">TÍNH KHẢ THI • CHUẨN XÁC • MỞ RỘNG CAO</text>
      </g>
    </g>

    <!-- Connector: Methodology down into Evaluate -->
    <line x1="{c3_w // 2}" y1="546" x2="{c3_w // 2}" y2="600" stroke="#000000" stroke-width="3.2"/>
    {draw_arrow(c3_w // 2, 600, "down", "#000000", 18)}

    <!-- Node 3B: EVALUATE (Prominently Enclosed Major Stage) -->
    <g transform="translate(24, 600)" class="shadow-blueprint">
      <!-- High emphasis framed evaluation container -->
      <rect x="0" y="0" width="{c3_w - 48}" height="504" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>
      <rect x="6" y="6" width="{c3_w - 60}" height="492" rx="9" fill="none" stroke="#000000" stroke-width="1.4" stroke-dasharray="6,4"/>

      <!-- Header Banner -->
      <rect x="18" y="18" width="{c3_w - 84}" height="46" rx="6" fill="#000000"/>
      <text x="{(c3_w - 84)//2 + 18}" y="42" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.2px">★ ĐÁNH GIÁ THỰC NGHIỆM ★</text>
      <text x="{(c3_w - 84)//2 + 18}" y="56" class="mono" font-size="10.5" font-weight="900" fill="#94A3B8" text-anchor="middle">EVALUATE: EMPIRICAL BENCHMARKING</text>

      <g transform="translate(18, 80)">
        <text x="0" y="20" class="card-title" font-size="17">Mục Tiêu Thẩm Định Khoa Học:</text>

        <rect x="0" y="34" width="{c3_w - 84}" height="96" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="14" y="58" class="body-txt" font-weight="800">1. Đo lường Độ chính xác (Accuracy):</text>
        <text x="14" y="80" class="bullet-txt">Đảm bảo AI không sinh ảo giác, trả lời đúng</text>
        <text x="14" y="102" class="bullet-txt">các mức bồi thường và chính sách công ty.</text>

        <rect x="0" y="142" width="{c3_w - 84}" height="96" rx="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.2"/>
        <text x="14" y="166" class="body-txt" font-weight="800">2. Kiểm tra Độ tin cậy (Reliability):</text>
        <text x="14" y="188" class="bullet-txt">Khả năng tự động gọi đúng API Microservices</text>
        <text x="14" y="210" class="bullet-txt">với tỷ lệ lỗi dưới ngưỡng cho phép (&lt; 2%).</text>

        <rect x="0" y="250" width="{c3_w - 84}" height="140" rx="6" fill="#000000"/>
        <text x="{(c3_w - 84)//2}" y="278" class="mono" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">TIÊU CHUẨN THỰC NGHIỆM KÉP</text>
        <text x="{(c3_w - 84)//2}" y="306" font-size="14" font-weight="800" fill="#E2E8F0" text-anchor="middle">• Nhánh 1: Cào 100 kịch bản thực tế</text>
        <text x="{(c3_w - 84)//2}" y="334" font-size="14" font-weight="800" fill="#E2E8F0" text-anchor="middle">• Nhánh 2: Đối chiếu nhãn Ground Truth (1 / 0)</text>
        <text x="{(c3_w - 84)//2}" y="362" class="mono" font-size="11.5" font-weight="900" fill="#94A3B8" text-anchor="middle">Xuất ma trận nhầm lẫn (Confusion Matrix)</text>
      </g>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # CONNECTORS 3 -> 4: Branching from EVALUATE into 2 parallel pipelines in Cluster 4
  # Exit from EVALUATE right edge: x = c3_x + c3_w (1628), y = c_y + 852 (1028)
  # Branch 1 enters Cluster 4 at y = c_y + 160 (336)
  # Branch 2 enters Cluster 4 at y = c_y + 610 (786)
  # -------------------------------------------------------------------------
  eval_out_x = c3_x + c3_w  # 1628
  eval_out_y = c_y + 852   # 1028
  br1_target_y = c_y + 160 # 336
  br2_target_y = c_y + 610 # 786

  lines.append(f'''
  <!-- Dual Branching Manhattan Connectors from EVALUATE to Cluster 4 -->
  <g id="Connectors_Cluster3_To_Cluster4">
    <!-- Main stem from Evaluate container -->
    <path d="M {eval_out_x - 24} {eval_out_y} L {eval_out_x + 20} {eval_out_y} L {eval_out_x + 20} {br1_target_y} L {c4_x} {br1_target_y}" fill="none" stroke="#000000" stroke-width="3.2"/>
    {draw_arrow(c4_x, br1_target_y, "right", "#000000", 18)}

    <path d="M {eval_out_x + 20} {eval_out_y} L {eval_out_x + 20} {br2_target_y} L {c4_x} {br2_target_y}" fill="none" stroke="#000000" stroke-width="3.2"/>
    {draw_arrow(c4_x, br2_target_y, "right", "#000000", 18)}

    <!-- Branch 1 Label Badge (x=1648) -->
    <g transform="translate(1633, {br1_target_y - 15})">
      <rect x="0" y="0" width="30" height="30" rx="6" fill="#000000" stroke="#000000" stroke-width="1.5"/>
      <text x="15" y="20" class="mono" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">N1</text>
    </g>

    <!-- Branch 2 Label Badge (x=1648) -->
    <g transform="translate(1633, {br2_target_y - 15})">
      <rect x="0" y="0" width="30" height="30" rx="6" fill="#000000" stroke="#000000" stroke-width="1.5"/>
      <text x="15" y="20" class="mono" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle">N2</text>
    </g>
  </g>''')

  # -------------------------------------------------------------------------
  # CLUSTER 4: CỤM TRIỂN KHAI ĐÁNH GIÁ & DỮ LIỆU
  # -------------------------------------------------------------------------
  lines.append(f'''
  <!-- ================= CLUSTER 4: EVALUATION & DATA EXECUTION ================= -->
  <g id="Cluster_4_Execution_And_Data" transform="translate({c4_x}, {c_y})">
    <!-- Outer Container -->
    <rect x="0" y="0" width="{c4_w}" height="{c_h}" rx="10" fill="#FAFAFA" stroke="#000000" stroke-width="2.2"/>
    <rect x="0" y="0" width="{c4_w}" height="48" rx="10" fill="#E2E8F0" stroke="#000000" stroke-width="2.2"/>
    <circle cx="28" cy="24" r="14" fill="#000000"/>
    <text x="28" y="30" class="flow-badge" text-anchor="middle">4</text>
    <text x="54" y="30" class="sec-title">CỤM TRIỂN KHAI ĐÁNH GIÁ &amp; DỮ LIỆU</text>
    <text x="{c4_w - 20}" y="30" class="mono" font-size="13" font-weight="800" fill="#475569" text-anchor="end">«Empirical Pipeline»</text>

    <!-- ================= NHÁNH 1: THU THẬP DỮ LIỆU ================= -->
    <g transform="translate(24, 68)" class="shadow-blueprint">
      <rect x="0" y="0" width="{c4_w - 48}" height="480" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>

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
        <rect x="0" y="0" width="{c4_w - 80}" height="106" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="1.8"/>
        <rect x="14" y="12" width="130" height="24" rx="4" fill="#334155"/>
        <text x="79" y="28" class="badge-txt" text-anchor="middle">TỪ KHÓA: HYBRID</text>
        <text x="154" y="29" class="card-title" font-size="16">Phương Pháp Lai (Hybrid Engine)</text>

        <text x="14" y="62" class="bullet-txt">• 100 mẫu dữ liệu được đưa qua quy trình hồi xuất lai (Hybrid Retrieval).</text>
        <text x="14" y="86" class="bullet-txt">• Kết hợp: Vector 70% + BM25 Lexical 30% + Mở rộng từ điển Logistics SYNONYMS.</text>
      </g>

      <!-- Sub-Box 2: "AI -> Test Service 100" Note Box -->
      <g transform="translate(16, 342)">
        <rect x="0" y="0" width="{c4_w - 80}" height="118" rx="6" fill="#000000"/>
        <rect x="14" y="12" width="180" height="24" rx="4" fill="#FFFFFF"/>
        <text x="104" y="28" class="badge-txt-black" text-anchor="middle">KIỂM THỬ TỰ ĐỘNG HÓA</text>
        <text x="204" y="29" class="card-title" font-size="16" fill="#FFFFFF">AI ➔ Test Service 100</text>

        <text x="14" y="64" class="mono" font-size="13" font-weight="700" fill="#CBD5E1">• Test Runner: Script tự động bắn 100 câu hỏi qua REST / SSE</text>
        <text x="14" y="88" class="mono" font-size="13" font-weight="700" fill="#CBD5E1">• Đo lường: Độ trễ (ms), token tiêu thụ, phản hồi mã HTTP 200</text>
        <text x="14" y="108" class="mono" font-size="12" font-weight="900" fill="#94A3B8">» Output: JSON Logs lưu trữ toàn bộ 100 câu trả lời của AI</text>
      </g>
    </g>

    <!-- Connector: Data collection stream down into Ground Truth matching -->
    <path d="M {c4_w // 2} 548 L {c4_w // 2} 578" fill="none" stroke="#000000" stroke-width="2.6" stroke-dasharray="6,4"/>
    {draw_arrow(c4_w // 2, 578, "down", "#000000", 16)}

    <!-- ================= NHÁNH 2: XỬ LÝ & ĐÁNH GIÁ (DATA + LABEL) ================= -->
    <g transform="translate(24, 578)" class="shadow-blueprint">
      <rect x="0" y="0" width="{c4_w - 48}" height="526" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.2"/>

      <!-- Primary Node: "(Data + label)" -->
      <g transform="translate(16, 16)">
        <rect x="0" y="0" width="{c4_w - 80}" height="64" rx="8" fill="#F1F5F9" stroke="#000000" stroke-width="2.2"/>
        <rect x="16" y="16" width="170" height="32" rx="4" fill="#000000"/>
        <text x="101" y="38" class="badge-txt" font-size="14" text-anchor="middle">GROUND TRUTH</text>
        <text x="200" y="40" class="card-title" font-size="22">(Data + label)</text>
        <text x="{c4_w - 100}" y="40" class="mono" font-size="14" font-weight="900" fill="#475569" text-anchor="end">100 Gán Nhãn Chuẩn</text>
      </g>

      <text x="18" y="106" class="bullet-txt">• Mỗi câu trong 100 mẫu được Chuyên gia nghiệp vụ bưu chính gắn nhãn chuẩn:</text>
      <text x="32" y="130" class="bullet-txt">Đúng chính sách bồi thường nào? Cần gọi tool API nào? Kết quả mong đợi là gì?</text>

      <line x1="16" y1="146" x2="{c4_w - 64}" y2="146" stroke="#E2E8F0" stroke-width="1.5"/>

      <!-- Forking into 2 Branches: YES (1) and NO (0) -->
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
        <text x="124" y="35" class="card-title" font-size="16">Khớp Nhãn</text>

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
        <text x="124" y="35" class="card-title" font-size="16">Lệch Nhãn</text>

        <line x1="14" y1="54" x2="{sub_card_w - 14}" y2="54" stroke="#CBD5E1" stroke-width="1"/>

        <text x="14" y="80" class="body-txt" font-weight="800">• False / Fail / Ảo giác:</text>
        <text x="14" y="104" class="bullet-txt">AI trích xuất nhầm chính sách.</text>
        <text x="14" y="128" class="bullet-txt">Sai lệch con số tiền bồi thường.</text>
        <text x="14" y="152" class="bullet-txt">Gọi nhầm tool hoặc timeout.</text>
        <text x="14" y="180" class="mono" font-size="14" font-weight="900" fill="#000000">Ghi nhận: Score = 0</text>
      </g>

      <!-- Summary Metrics Bar (Confusion Matrix Output) -->
      <g transform="translate(16, 400)">
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

    <text x="54" y="30" font-size="15" font-weight="900" fill="#000000">TƯ DUY NGHIÊN CỨU KHOA HỌC (RESEARCH LOGIC):</text>
    <text x="490" y="30" class="bullet-txt">Quy trình vận hành theo chuẩn 4 bước của luận văn nghiên cứu ứng dụng AI:</text>
    
    <text x="54" y="55" class="mono" font-size="13" font-weight="800" fill="#1E293B">BƯỚC 1: Vấn Đề &amp; Gap (Abstract + Related Work) ➔ BƯỚC 2: Đề Xuất (Agent + RAG) ➔ BƯỚC 3: Phương Pháp Luận &amp; Tiêu Chuẩn ➔ BƯỚC 4: Đánh Giá 100 Mẫu Thực Nghiệm (1/0 Matrix).</text>
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

  # File targets
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
