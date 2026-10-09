#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE RAG PRACTICAL SYSTEM DIAGRAM (NEXUS LOGISTICS REALITY)
===============================================================
Bản vẽ Kỹ thuật Sư phạm Thực tế: Kiến trúc & Luồng Xử lý RAG trong Hệ thống Bưu chính Nexus.
Thể hiện trung thực:
- Công nghệ thực tế: Markdown Section Chunker, OpenAI text-embedding-3-small (1536-D),
  Cosine Similarity Search (minScore=0.20, Top-3), vector-index.json / pgvector, OpenAI gpt-4o-mini (temp=0.2).
- Luồng nạp tri thức (Offline Ingestion): docs/knowledge-base/ (9 SOPs) -> Chunks (250 từ, overlap 40 từ)
  -> Embedding 1536-D -> Vector Store.
- Luồng suy luận (Online Retrieval & Generation): Khách hỏi qua Chatbot -> Query Vector -> Cosine Similarity
  -> Top-K Chunks -> Ghép Prompt -> LLM -> Câu trả lời có căn cứ pháp lý.
- 4 Ca nghiệp vụ thực tế: Bồi thường hư hỏng hàng (Điều 4.2 BBBT), Cước cồng kềnh IATA (V/6000),
  Hàng cấm bay (Pin Lithium), Đối soát tiền COD (Kỳ T+2).
"""

import os
import html
import xml.etree.ElementTree as ET

def xml_esc(s):
    if s is None:
        return ""
    if not isinstance(s, str):
        s = str(s)
    return html.escape(s, quote=True)

def generate_svg():
    width = 2200
    height = 1240

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # STYLES DEFINITION (CLEAN ACADEMIC TEXTBOOK + REAL LOGISTICS)
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }')
    lines.append('      .lbl-title { font-size: 20px; font-weight: 700; fill: #000000; }')
    lines.append('      .lbl-main { font-size: 18px; font-weight: 600; fill: #000000; }')
    lines.append('      .lbl-tech { font-family: ui-monospace, Menlo, monospace; font-size: 14px; font-weight: 700; fill: #2563EB; }')
    lines.append('      .lbl-sub { font-size: 14px; font-weight: 500; fill: #4B5563; }')
    lines.append('      .ta-mid { text-anchor: middle; }')
    lines.append('      .ta-start { text-anchor: start; }')
    lines.append('      .ta-end { text-anchor: end; }')
    lines.append('      .math-matrix { font-family: "Cambria Math", "Times New Roman", serif; font-size: 19px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .caption-txt { font-family: "Times New Roman", Times, serif; font-size: 23px; font-weight: 600; fill: #000000; text-anchor: middle; }')
    lines.append('      .flow-line { fill: none; stroke: #000000; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .flow-arrowhead { fill: #000000; }')
    lines.append('      .case-card { fill: #FAFAFA; stroke: #000000; stroke-width: 1.6; rx: 6px; }')
    lines.append('      .case-hdr { fill: #000000; rx: 4px; }')
    lines.append('      .case-hdr-txt { font-size: 14px; font-weight: 800; fill: #FFFFFF; }')
    lines.append('      .case-txt { font-size: 12px; fill: #1F2937; }')
    lines.append('      .case-bold { font-size: 12px; font-weight: 700; fill: #000000; }')
    lines.append('      .case-code { font-family: ui-monospace, monospace; font-size: 11.5px; font-weight: 700; fill: #1D4ED8; }')
    lines.append('    ]]></style>')
    lines.append('  </defs>')
    lines.append('')

    # BACKGROUND
    lines.append(f'  <rect width="{width}" height="{height}" fill="#FFFFFF"/>')

    # HELPER: Arrowhead
    def arrow_head(x, y, direction="right", size=12):
        if direction == "right":
            return f'  <polygon points="{x},{y} {x-size},{y-size/2} {x-size},{y+size/2}" class="flow-arrowhead"/>'
        elif direction == "left":
            return f'  <polygon points="{x},{y} {x+size},{y-size/2} {x+size},{y+size/2}" class="flow-arrowhead"/>'
        elif direction == "down":
            return f'  <polygon points="{x},{y} {x-size/2},{y-size} {x+size/2},{y-size}" class="flow-arrowhead"/>'
        elif direction == "up":
            return f'  <polygon points="{x},{y} {x-size/2},{y+size} {x+size/2},{y+size}" class="flow-arrowhead"/>'

    # =========================================================================
    # HEADER BLOCK (TOP BANNER)
    # =========================================================================
    lines.append('  <!-- ==================== HEADER BLOCK ==================== -->')
    lines.append('  <g id="Header_Banner">')
    lines.append(f'    <text x="{width/2}" y="42" font-size="24" font-weight="900" fill="#000000" class="ta-mid" letter-spacing="-0.3px">KIẾN TRÚC &amp; LUỒNG HOẠT ĐỘNG RAG THỰC TẾ TRONG HỆ THỐNG TRỢ LÝ AI LOGISTICS</text>')
    lines.append(f'    <text x="{width/2}" y="68" font-size="14.5" font-family="ui-monospace, monospace" font-weight="600" fill="#4B5563" class="ta-mid">CÔNG NGHỆ THỰC TẾ: Markdown Section Chunker • OpenAI text-embedding-3-small (1536-D) • Cosine Similarity (Top-3) • OpenAI gpt-4o-mini (temp=0.2)</text>')
    lines.append(f'    <line x1="60" y1="84" x2="{width-60}" y2="84" stroke="#E5E7EB" stroke-width="1.6"/>')
    lines.append('  </g>')

    # =========================================================================
    # 1. DOCUMENTS (TOP-LEFT: SOP & CHÍNH SÁCH BƯU CHÍNH)
    # =========================================================================
    lines.append('  <!-- ==================== 1. DOCUMENTS ==================== -->')
    lines.append('  <g id="Documents_Group">')
    # Doc 1: 01-pricing.md
    doc1_x, doc1_y, doc_w, doc_h = 75, 115, 78, 96
    lines.append(f'    <path d="M {doc1_x} {doc1_y} L {doc1_x+doc_w-18} {doc1_y} L {doc1_x+doc_w} {doc1_y+18} L {doc1_x+doc_w} {doc1_y+doc_h} L {doc1_x} {doc1_y+doc_h} Z" fill="#FFFFFF" stroke="#000000" stroke-width="2.2" rx="4"/>')
    lines.append(f'    <path d="M {doc1_x+doc_w-18} {doc1_y} L {doc1_x+doc_w-18} {doc1_y+18} L {doc1_x+doc_w} {doc1_y+18} Z" fill="#E5E7EB" stroke="#000000" stroke-width="1.8"/>')
    lines.append(f'    <line x1="{doc1_x+10}" y1="{doc1_y+26}" x2="{doc1_x+42}" y2="{doc1_y+26}" stroke="#9CA3AF" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append(f'    <line x1="{doc1_x+10}" y1="{doc1_y+38}" x2="{doc1_x+doc_w-12}" y2="{doc1_y+38}" stroke="#D1D5DB" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append(f'    <rect x="{doc1_x+8}" y="{doc1_y+doc_h-38}" width="{doc_w-16}" height="26" rx="4" fill="#3B82F6" stroke="#1D4ED8" stroke-width="1.2"/>')
    lines.append(f'    <text x="{doc1_x+doc_w/2}" y="{doc1_y+doc_h-21}" font-size="13" font-weight="900" fill="#FFFFFF" class="ta-mid">.MD</text>')

    # Doc 2: 02-claim-policy.md
    doc2_x = 170
    lines.append(f'    <path d="M {doc2_x} {doc1_y} L {doc2_x+doc_w-18} {doc1_y} L {doc2_x+doc_w} {doc1_y+18} L {doc2_x+doc_w} {doc1_y+doc_h} L {doc2_x} {doc1_y+doc_h} Z" fill="#FFFFFF" stroke="#000000" stroke-width="2.2" rx="4"/>')
    lines.append(f'    <path d="M {doc2_x+doc_w-18} {doc1_y} L {doc2_x+doc_w-18} {doc1_y+18} L {doc2_x+doc_w} {doc1_y+18} Z" fill="#FCA5A5" stroke="#000000" stroke-width="1.8"/>')
    lines.append(f'    <line x1="{doc2_x+10}" y1="{doc1_y+26}" x2="{doc2_x+42}" y2="{doc1_y+26}" stroke="#9CA3AF" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append(f'    <line x1="{doc2_x+10}" y1="{doc1_y+38}" x2="{doc2_x+doc_w-12}" y2="{doc1_y+38}" stroke="#D1D5DB" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append(f'    <rect x="{doc2_x+8}" y="{doc1_y+doc_h-38}" width="{doc_w-16}" height="26" rx="4" fill="#EF4444" stroke="#B91C1C" stroke-width="1.2"/>')
    lines.append(f'    <text x="{doc2_x+doc_w/2}" y="{doc1_y+doc_h-21}" font-size="13" font-weight="900" fill="#FFFFFF" class="ta-mid">SOP</text>')

    # Label Documents
    lines.append(f'    <text x="162" y="240" class="lbl-title ta-mid">Tài liệu Nghiệp vụ (SOP Docs)</text>')
    lines.append(f'    <text x="162" y="262" class="lbl-tech ta-mid">docs/knowledge-base/ (9 files)</text>')
    lines.append('  </g>')

    # Arrow: Documents -> Chunks (X: 260 to 325, Y: 162)
    lines.append('  <line x1="260" y1="162" x2="325" y2="162" class="flow-line"/>')
    lines.append(arrow_head(325, 162, "right", 12))

    # =========================================================================
    # 2. CHUNKS (SECTION-AWARE CHUNKER)
    # =========================================================================
    lines.append('  <!-- ==================== 2. CHUNKS ==================== -->')
    lines.append('  <g id="Chunks_Group">')
    lines.append('    <text x="515" y="108" class="lbl-title ta-mid">Phân đoạn Ngữ nghĩa (Section Chunks)</text>')
    lines.append('    <text x="515" y="128" class="lbl-tech ta-mid">chunker.ts: 250 từ • overlap 40 từ</text>')

    chunk_w, chunk_h = 106, 86
    c_y = 145
    chunks_data = [
        (340, "Biểu phí IATA", "#3B82F6"),
        (460, "Điều 4.2 BBBT", "#EF4444"),
        (620, "Pin Lithium", "#10B981")
    ]

    for cx, ctitle, ccolor in chunks_data:
        lines.append(f'    <path d="M {cx} {c_y} L {cx+chunk_w-14} {c_y} L {cx+chunk_w} {c_y+14} L {cx+chunk_w} {c_y+chunk_h} L {cx} {c_y+chunk_h} Z" fill="#FFFFFF" stroke="#000000" stroke-width="2.2" rx="3"/>')
        lines.append(f'    <path d="M {cx+chunk_w-14} {c_y} L {cx+chunk_w-14} {c_y+14} L {cx+chunk_w} {c_y+14} Z" fill="#E5E7EB" stroke="#000000" stroke-width="1.6"/>')
        # Title bar in chunk (generous width)
        lines.append(f'    <rect x="{cx+5}" y="{c_y+6}" width="{chunk_w-18}" height="18" fill="{ccolor}" rx="2"/>')
        lines.append(f'    <text x="{cx+(chunk_w-18)/2+5}" y="{c_y+19}" font-size="10.5" font-weight="800" fill="#FFFFFF" class="ta-mid">{ctitle}</text>')
        # Content horizontal lines
        lines.append(f'    <line x1="{cx+8}" y1="{c_y+36}" x2="{cx+chunk_w-8}" y2="{c_y+36}" stroke="#000000" stroke-width="2.8" stroke-linecap="round"/>')
        lines.append(f'    <line x1="{cx+8}" y1="{c_y+48}" x2="{cx+chunk_w-8}" y2="{c_y+48}" stroke="#000000" stroke-width="2.8" stroke-linecap="round"/>')
        lines.append(f'    <line x1="{cx+8}" y1="{c_y+60}" x2="{cx+chunk_w-20}" y2="{c_y+60}" stroke="#000000" stroke-width="2.8" stroke-linecap="round"/>')

    # Ellipsis dots in between chunk 2 and chunk 3
    lines.append('    <circle cx="580" cy="188" r="4.5" fill="#000000"/>')
    lines.append('    <circle cx="593" cy="188" r="4.5" fill="#000000"/>')
    lines.append('    <circle cx="606" cy="188" r="4.5" fill="#000000"/>')

    # Connectors routing from Chunks down into Embedding Model
    lines.append(f'    <path d="M 393 231 C 393 295, 510 280, 510 320" class="flow-line"/>')
    lines.append(f'    <path d="M 513 231 C 513 285, 510 285, 510 320" class="flow-line"/>')
    lines.append(f'    <path d="M 673 231 C 673 295, 510 280, 510 320" class="flow-line"/>')
    lines.append('    <line x1="510" y1="320" x2="510" y2="400" class="flow-line"/>')
    lines.append(arrow_head(510, 400, "down", 12))
    lines.append('  </g>')

    # =========================================================================
    # 3. EMBEDDING MODEL (Center-Left)
    # =========================================================================
    lines.append('  <!-- ==================== 3. EMBEDDING MODEL ==================== -->')
    lines.append('  <g id="Embedding_Model_Group">')
    lines.append('    <text x="430" y="445" class="lbl-title ta-end">Mô hình Nhúng Vector</text>')
    lines.append('    <text x="430" y="470" class="lbl-tech ta-end">text-embedding-3-small</text>')
    lines.append('    <text x="430" y="492" class="lbl-sub ta-end">(OpenAI • 1536 Chiều)</text>')

    # Neural Graph Cluster (Center around X=510, Y=475)
    nodes = [
        (510, 475, "#EF4444", 16), # Center Red
        (470, 440, "#3B82F6", 14), # Top-Left Blue
        (510, 420, "#8B5CF6", 14), # Top Purple
        (550, 440, "#10B981", 14), # Top-Right Green
        (565, 485, "#F59E0B", 14), # Right Yellow
        (510, 530, "#06B6D4", 14), # Bottom Cyan
        (465, 505, "#EAB308", 14), # Bottom-Left Amber
    ]
    edges = [
        (1, 2), (2, 3), (3, 4), (4, 5), (5, 6), (6, 1),
        (0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (0, 6)
    ]
    for n1, n2 in edges:
        x1, y1 = nodes[n1][0], nodes[n1][1]
        x2, y2 = nodes[n2][0], nodes[n2][1]
        lines.append(f'    <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#000000" stroke-width="2.2"/>')

    for nx, ny, nfill, nr in nodes:
        lines.append(f'    <circle cx="{nx}" cy="{ny}" r="{nr}" fill="{nfill}" stroke="#000000" stroke-width="2.2"/>')
    lines.append('  </g>')

    # =========================================================================
    # 4. CHUNKS VECTOR & VECTOR STORE (Center)
    # =========================================================================
    lines.append('  <!-- ==================== 4. VECTOR STORE ==================== -->')
    lines.append('  <g id="Vector_Store_Group">')
    # 3 ray arrows from Embedding Model to Chunk Vector Matrix
    lines.append('    <line x1="590" y1="455" x2="670" y2="425" class="flow-line"/>')
    lines.append(arrow_head(670, 425, "right", 10))
    lines.append('    <line x1="590" y1="475" x2="670" y2="475" class="flow-line"/>')
    lines.append(arrow_head(670, 475, "right", 10))
    lines.append('    <line x1="590" y1="495" x2="670" y2="525" class="flow-line"/>')
    lines.append(arrow_head(670, 525, "right", 10))

    # Vector Matrix Bracket [0.082, -0.415, ...] (1536-D)
    vx, vy = 720, 475
    lines.append(f'    <path d="M {vx-24} {vy-44} L {vx-32} {vy-44} L {vx-32} {vy+44} L {vx-24} {vy+44}" fill="none" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <path d="M {vx+24} {vy-44} L {vx+32} {vy-44} L {vx+32} {vy+44} L {vx+24} {vy+44}" fill="none" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <text x="{vx}" y="{vy-20}" class="math-matrix">0.082</text>')
    lines.append(f'    <text x="{vx}" y="{vy+8}" class="math-matrix">-0.415</text>')
    lines.append(f'    <text x="{vx}" y="{vy+34}" class="math-matrix">... [1536]</text>')

    # Arrow from Vector to Vector Store
    lines.append('    <line x1="765" y1="475" x2="835" y2="475" class="flow-line"/>')
    lines.append(arrow_head(835, 475, "right", 12))

    # Vector Store Cylinder (Center X=900, Y=475)
    db_x, db_y = 845, 420
    db_w, db_h = 115, 115
    ry = 20

    # Title Vector Store (Positioned clearly above cylinder with comfortable spacing)
    lines.append(f'    <text x="{db_x + db_w/2}" y="{db_y - 46}" class="lbl-title ta-mid">Kho Vector Tri Thức</text>')
    lines.append(f'    <text x="{db_x + db_w/2}" y="{db_y - 24}" class="lbl-tech ta-mid">vector-index.json / pgvector</text>')

    # 3D Cylindrical Layers
    lines.append(f'    <path d="M {db_x} {db_y+70} L {db_x} {db_y+db_h} A {db_w/2} {ry} 0 0 0 {db_x+db_w} {db_y+db_h} L {db_x+db_w} {db_y+70} Z" fill="#3B82F6" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <ellipse cx="{db_x+db_w/2}" cy="{db_y+70}" rx="{db_w/2}" ry="{ry}" fill="#60A5FA" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <path d="M {db_x} {db_y+35} L {db_x} {db_y+70} A {db_w/2} {ry} 0 0 0 {db_x+db_w} {db_y+70} L {db_x+db_w} {db_y+35} Z" fill="#60A5FA" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <ellipse cx="{db_x+db_w/2}" cy="{db_y+35}" rx="{db_w/2}" ry="{ry}" fill="#93C5FD" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <path d="M {db_x} {db_y} L {db_x} {db_y+35} A {db_w/2} {ry} 0 0 0 {db_x+db_w} {db_y+35} L {db_x+db_w} {db_y} Z" fill="#93C5FD" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <ellipse cx="{db_x+db_w/2}" cy="{db_y}" rx="{db_w/2}" ry="{ry}" fill="#BFDBFE" stroke="#000000" stroke-width="2.4"/>')

    # Data lines on cylinder front
    lines.append(f'    <path d="M {db_x+28} {db_y+52} A 28 8 0 0 0 {db_x+87} {db_y+52}" fill="none" stroke="#1D4ED8" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append(f'    <path d="M {db_x+28} {db_y+88} A 28 8 0 0 0 {db_x+87} {db_y+88}" fill="none" stroke="#1E40AF" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append('  </g>')

    # Arrow from Vector Store to Similarity Search (X: 975 to 1180, Y: 475)
    lines.append('  <line x1="975" y1="475" x2="1180" y2="475" class="flow-line"/>')
    lines.append(arrow_head(1180, 475, "right", 12))

    # =========================================================================
    # 5. USER QUERY & REALISTIC LOGISTICS QUESTION
    # =========================================================================
    lines.append('  <!-- ==================== 5. USER & QUERY FLOW ==================== -->')
    lines.append('  <g id="User_Query_Group">')
    # User Avatar (X: 95, Y: 715)
    ux, uy = 95, 715
    lines.append(f'    <circle cx="{ux}" cy="{uy}" r="20" fill="#FFFFFF" stroke="#000000" stroke-width="2.8"/>')
    lines.append(f'    <path d="M {ux-28} {uy+50} C {ux-28} {uy+26}, {ux+28} {uy+26}, {ux+28} {uy+50}" fill="#FFFFFF" stroke="#000000" stroke-width="2.8"/>')
    lines.append(f'    <text x="{ux}" y="{uy+72}" font-size="14.5" font-weight="700" fill="#000000" class="ta-mid">Khách hàng</text>')

    # Speech Bubble with Real Logistics Question
    sb_x, sb_y, sb_w, sb_h = 150, 665, 345, 78
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" rx="18" fill="#E0F7FA" stroke="#000000" stroke-width="2.2"/>')
    lines.append(f'    <path d="M {sb_x+4} {sb_y+42} L {sb_x-20} {sb_y+48} L {sb_x+10} {sb_y+56} Z" fill="#E0F7FA" stroke="#000000" stroke-width="2.2" stroke-linejoin="round"/>')
    lines.append(f'    <path d="M {sb_x+2} {sb_y+38} L {sb_x-16} {sb_y+48} L {sb_x+12} {sb_y+54} Z" fill="#E0F7FA"/>')
    lines.append(f'    <text x="{sb_x+sb_w/2}" y="{sb_y+32}" font-size="16" font-weight="800" fill="#000000" class="ta-mid">"Hàng gốm sứ bị bể vỡ khi nhận,</text>')
    lines.append(f'    <text x="{sb_x+sb_w/2}" y="{sb_y+54}" font-size="16" font-weight="800" fill="#000000" class="ta-mid">bưu cục có bồi thường không?"</text>')
    lines.append(f'    <text x="{sb_x+sb_w/2}" y="{sb_y+70}" font-size="12" font-style="italic" fill="#0E7490" class="ta-mid">(Câu hỏi thực tế qua Chatbot Widget)</text>')

    # Arrow from Speech Bubble UP into Embedding Model
    lines.append(f'    <path d="M {sb_x+sb_w} {sb_y+38} C {sb_x+sb_w+60} {sb_y+38}, 490 600, 490 550" class="flow-line"/>')
    lines.append(arrow_head(490, 550, "up", 12))

    # Arrow from Embedding Model DOWN to Query Vector
    lines.append('    <path d="M 530 550 C 530 700, 580 700, 660 700" class="flow-line"/>')
    lines.append(arrow_head(660, 700, "right", 10))

    # 3 Ray Arrows to Query Vector
    lines.append('    <line x1="620" y1="700" x2="665" y2="670" class="flow-line"/>')
    lines.append(arrow_head(665, 670, "right", 9))
    lines.append('    <line x1="620" y1="700" x2="665" y2="730" class="flow-line"/>')
    lines.append(arrow_head(665, 730, "right", 9))

    # Query Vector Matrix [-0.125, 0.384, ...]
    qvx, qvy = 720, 700
    lines.append(f'    <path d="M {qvx-24} {qvy-44} L {qvx-32} {qvy-44} L {qvx-32} {qvy+44} L {qvx-24} {qvy+44}" fill="none" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <path d="M {qvx+24} {qvy-44} L {qvx+32} {qvy-44} L {qvx+32} {qvy+44} L {qvx+24} {qvy+44}" fill="none" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <text x="{qvx}" y="{qvy-20}" class="math-matrix">-0.125</text>')
    lines.append(f'    <text x="{qvx}" y="{qvy+8}" class="math-matrix">0.384</text>')
    lines.append(f'    <text x="{qvx}" y="{qvy+34}" class="math-matrix">... [1536]</text>')

    # Label Query Vector
    lines.append(f'    <text x="{qvx+56}" y="{qvy-8}" class="lbl-main ta-start">Query Vector</text>')
    lines.append(f'    <text x="{qvx+56}" y="{qvy+14}" class="lbl-sub ta-start">(Vector câu hỏi 1536-D)</text>')

    # Arrow from Query Vector to Similarity Search
    lines.append(f'    <path d="M {qvx+210} {qvy} L 1220 {qvy} L 1220 535" class="flow-line"/>')
    lines.append(arrow_head(1220, 535, "up", 12))

    # Global Anchor for LLM Brain Center
    bx, by = 1720, 475

    # Long Bottom Arrow: User Prompt directly to LLM
    lines.append(f'    <path d="M 260 745 L 260 788 L {bx} 788 L {bx} 532" class="flow-line"/>')
    lines.append(arrow_head(bx, 532, "up", 12))
    lines.append(f'    <text x="{width/2}" y="780" font-size="13" font-style="italic" font-weight="600" fill="#4B5563" class="ta-mid">Prompt Augmentation: Ghép Câu hỏi gốc + Ngữ cảnh Top-3 vào System Prompt của LLM</text>')
    lines.append('  </g>')

    # =========================================================================
    # 6. SIMILARITY SEARCH & TOP-K CONTEXT (Middle-Right)
    # =========================================================================
    lines.append('  <!-- ==================== 6. SIMILARITY SEARCH ==================== -->')
    lines.append('  <g id="Similarity_Search_Group">')
    lines.append('    <text x="1220" y="370" class="lbl-title ta-mid">Tìm kiếm Tương đồng</text>')
    lines.append('    <text x="1220" y="394" class="lbl-tech ta-mid">Cosine Similarity (Top-3)</text>')
    lines.append('    <text x="1220" y="414" class="lbl-sub ta-mid">minScore = 0.20</text>')

    # Magnifying Glass Icon (Center X=1220, Y=475)
    mx, my = 1220, 475
    lines.append(f'    <circle cx="{mx+4}" cy="{my-4}" r="28" fill="#E0F2FE" stroke="#0284C7" stroke-width="4.0"/>')
    lines.append(f'    <path d="M {mx-10} {my-15} A 18 18 0 0 1 {mx+14} {my-19}" fill="none" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round"/>')
    lines.append(f'    <line x1="{mx-16}" y1="{my+16}" x2="{mx-36}" y2="{my+36}" stroke="#0284C7" stroke-width="8.0" stroke-linecap="round"/>')
    lines.append('  </g>')

    # Arrow from Similarity Search to Top-K Context
    lines.append('  <line x1="1265" y1="475" x2="1335" y2="475" class="flow-line"/>')
    lines.append(arrow_head(1335, 475, "right", 12))

    # Top-K Context Stack (X: 1350..1530, Y: 410..525, W=178)
    lines.append('  <!-- ==================== 7. TOP-K CONTEXT ==================== -->')
    lines.append('  <g id="TopK_Context_Group">')
    tk_x, tk_y = 1355, 415
    kw, kh = 178, 112

    # Back page 1
    lines.append(f'    <path d="M {tk_x-18} {tk_y-14} L {tk_x+kw-34} {tk_y-14} L {tk_x+kw-18} {tk_y+2} L {tk_x+kw-18} {tk_y+kh-14} L {tk_x-18} {tk_y+kh-14} Z" fill="#F8FAFC" stroke="#000000" stroke-width="1.8" rx="3"/>')
    # Middle page 2
    lines.append(f'    <path d="M {tk_x-9} {tk_y-7} L {tk_x+kw-25} {tk_y-7} L {tk_x+kw-9} {tk_y+9} L {tk_x+kw-9} {tk_y+kh-7} L {tk_x-9} {tk_y+kh-7} Z" fill="#F1F5F9" stroke="#000000" stroke-width="1.8" rx="3"/>')
    # Front page 3 (Real Citation: 02-claim-policy.md)
    lines.append(f'    <path d="M {tk_x} {tk_y} L {tk_x+kw-16} {tk_y} L {tk_x+kw} {tk_y+16} L {tk_x+kw} {tk_y+kh} L {tk_x} {tk_y+kh} Z" fill="#F0F9FF" stroke="#000000" stroke-width="2.2" rx="3"/>')
    lines.append(f'    <path d="M {tk_x+kw-16} {tk_y} L {tk_x+kw-16} {tk_y+16} L {tk_x+kw} {tk_y+16} Z" fill="#BAE6FD" stroke="#000000" stroke-width="1.6"/>')
    
    # Text inside Top-K Chunk Front
    lines.append(f'    <rect x="{tk_x+8}" y="{tk_y+8}" width="{kw-30}" height="20" fill="#1D4ED8" rx="3"/>')
    lines.append(f'    <text x="{tk_x+kw/2-10}" y="{tk_y+22}" font-size="11" font-weight="800" fill="#FFFFFF" class="ta-mid">02-claim-policy.md (Top-1)</text>')
    lines.append(f'    <text x="{tk_x+10}" y="{tk_y+44}" font-size="12" font-weight="700" fill="#000000">• Điều 4.2: BBBT trong 24h</text>')
    lines.append(f'    <text x="{tk_x+10}" y="{tk_y+62}" font-size="11.5" fill="#1F2937">• Đền bù 100% giá trị khai giá</text>')
    lines.append(f'    <text x="{tk_x+10}" y="{tk_y+80}" font-size="11.5" fill="#1F2937">• Tối đa 2.000.000 VNĐ</text>')
    lines.append(f'    <text x="{tk_x+10}" y="{tk_y+98}" font-size="11.5" font-weight="800" fill="#15803D">Cosine Score: 0.88</text>')

    # Label Top-K Context
    lines.append(f'    <text x="{tk_x+kw/2}" y="{tk_y+kh+25}" class="lbl-main ta-mid">Top-K Ngữ Cảnh</text>')
    lines.append(f'    <text x="{tk_x+kw/2}" y="{tk_y+kh+44}" class="lbl-sub ta-mid">(Trích dẫn 3 chunks chuẩn xác)</text>')
    lines.append('  </g>')

    # Arrow from Top-K Context to LLM
    lines.append('  <line x1="1545" y1="475" x2="1640" y2="475" class="flow-line"/>')
    lines.append(arrow_head(1640, 475, "right", 12))

    # =========================================================================
    # 7. LLM BRAIN (Far-Right)
    # =========================================================================
    lines.append('  <!-- ==================== 8. LLM BRAIN ==================== -->')
    lines.append('  <g id="LLM_Group">')
    # Brain Icon
    lines.append(f'    <path d="M {bx} {by-48} C {bx-38} {by-52}, {bx-60} {by-28}, {bx-46} {by} C {bx-65} {by+16}, {bx-50} {by+48}, {bx-28} {by+46} C {bx-16} {by+52}, {bx-4} {by+48}, {bx} {by+46} Z" fill="#FB7185" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <path d="M {bx-14} {by-32} C {bx-32} {by-28}, {bx-28} {by-10}, {bx-10} {by-8}" fill="none" stroke="#881337" stroke-width="2.2" stroke-linecap="round"/>')
    lines.append(f'    <path d="M {bx-38} {by} C {bx-22} {by+6}, {bx-28} {by+28}, {bx-10} {by+28}" fill="none" stroke="#881337" stroke-width="2.2" stroke-linecap="round"/>')

    lines.append(f'    <path d="M {bx} {by-48} C {bx+38} {by-52}, {bx+60} {by-28}, {bx+46} {by} C {bx+65} {by+16}, {bx+50} {by+48}, {bx+28} {by+46} C {bx+16} {by+52}, {bx+4} {by+48}, {bx} {by+46} Z" fill="#22D3EE" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <path d="M {bx+10} {by-30} L {bx+28} {by-30} L {bx+40} {by-15}" fill="none" stroke="#000000" stroke-width="2.2"/>')
    lines.append(f'    <circle cx="{bx+40}" cy="{by-15}" r="3.5" fill="#000000"/>')
    lines.append(f'    <path d="M {bx+10} {by} L {bx+25} {by} L {bx+35} {by+14} L {bx+45} {by+14}" fill="none" stroke="#000000" stroke-width="2.2"/>')
    lines.append(f'    <circle cx="{bx+45}" cy="{by+14}" r="3.5" fill="#000000"/>')
    lines.append(f'    <path d="M {bx+10} {by+28} L {bx+28} {by+28}" fill="none" stroke="#000000" stroke-width="2.2"/>')
    lines.append(f'    <circle cx="{bx+28}" cy="{by+28}" r="3.5" fill="#000000"/>')

    lines.append(f'    <line x1="{bx}" y1="{by-48}" x2="{bx}" y2="{by+46}" stroke="#000000" stroke-width="2.2"/>')

    # Label LLM on the right
    lines.append(f'    <text x="{bx+75}" y="{by-14}" font-size="24" font-weight="900" fill="#000000" class="ta-start">OpenAI LLM</text>')
    lines.append(f'    <text x="{bx+75}" y="{by+10}" class="lbl-tech ta-start">gpt-4o-mini</text>')
    lines.append(f'    <text x="{bx+75}" y="{by+30}" class="lbl-sub ta-start">temp = 0.2 (Chống ảo giác)</text>')
    lines.append('  </g>')

    # Arrow UP from LLM to Answer
    lines.append(f'  <line x1="{bx}" y1="{by-52}" x2="{bx}" y2="305" class="flow-line"/>')
    lines.append(arrow_head(bx, 305, "up", 12))

    # =========================================================================
    # 8. ANSWER (TOP-RIGHT: REALISTIC GROUNDED RESPONSE)
    # =========================================================================
    lines.append('  <!-- ==================== 9. ANSWER DOCUMENT ==================== -->')
    lines.append('  <g id="Answer_Group">')
    lines.append(f'    <text x="{bx}" y="85" class="lbl-title ta-mid">Phản hồi có Căn cứ (Grounding Answer)</text>')
    lines.append(f'    <text x="{bx}" y="105" class="lbl-tech ta-mid">ask.ts: Trả lời kèm trích dẫn Điều 4.2</text>')

    ans_x, ans_y = bx - 130, 118
    ans_w, ans_h = 260, 172

    # Document shape
    lines.append(f'    <path d="M {ans_x} {ans_y} L {ans_x+ans_w-24} {ans_y} L {ans_x+ans_w} {ans_y+24} L {ans_x+ans_w} {ans_y+ans_h} L {ans_x} {ans_y+ans_h} Z" fill="#FFFFFF" stroke="#000000" stroke-width="2.4" rx="4"/>')
    lines.append(f'    <path d="M {ans_x+ans_w-24} {ans_y} L {ans_x+ans_w-24} {ans_y+24} L {ans_x+ans_w} {ans_y+24} Z" fill="#E5E7EB" stroke="#000000" stroke-width="1.8"/>')

    # Excerpt Text Lines inside Answer document (comfortably below folded corner)
    lines.append(f'    <text x="{ans_x+14}" y="{ans_y+34}" font-size="12" font-weight="700" fill="#000000">"Dạ chào bạn! Căn cứ theo Điều 4.2</text>')
    lines.append(f'    <text x="{ans_x+14}" y="{ans_y+54}" font-size="12" font-weight="700" fill="#000000">Quy chế bồi thường Nexus Logistics:</text>')
    lines.append(f'    <text x="{ans_x+14}" y="{ans_y+76}" font-size="11.5" fill="#1F2937">• Bưu gửi bị bể vỡ có Biên bản bất</text>')
    lines.append(f'    <text x="{ans_x+14}" y="{ans_y+94}" font-size="11.5" fill="#1F2937">  thường (BBBT) lập trong 24 giờ sẽ</text>')
    lines.append(f'    <text x="{ans_x+14}" y="{ans_y+112}" font-size="11.5" fill="#1F2937">  được bồi thường 100% giá trị khai giá.</text>')
    lines.append(f'    <text x="{ans_x+14}" y="{ans_y+132}" font-size="11.5" font-weight="800" fill="#15803D">• Số tiền duyệt tự động: Tối đa 2 Triệu.</text>')
    lines.append(f'    <text x="{ans_x+14}" y="{ans_y+154}" font-size="11" font-style="italic" font-weight="700" fill="#2563EB">Trích dẫn: [02-claim-policy.md &gt; Điều 4.2]</text>')
    lines.append('  </g>')

    # =========================================================================
    # 9. BOTTOM SECTION: 4 PRACTICAL REAL-WORLD CASES HANDLED BY SYSTEM
    # =========================================================================
    lines.append('  <!-- ==================== 10. 4 PRACTICAL CASES ==================== -->')
    lines.append('  <g id="Practical_Cases_Group">')
    # Section Divider with non-intersecting lines and wide clean pill
    pill_w = 840
    pill_x = (width - pill_w) / 2 # 680
    pill_y = 818
    lines.append(f'    <line x1="60" y1="834" x2="{pill_x - 20}" y2="834" stroke="#000000" stroke-width="1.8"/>')
    lines.append(f'    <line x1="{pill_x + pill_w + 20}" y1="834" x2="{width - 60}" y2="834" stroke="#000000" stroke-width="1.8"/>')
    lines.append(f'    <rect x="{pill_x}" y="{pill_y}" width="{pill_w}" height="32" fill="#000000" rx="6"/>')
    lines.append(f'    <text x="{width/2}" y="{pill_y+21}" font-size="14" font-weight="900" fill="#FFFFFF" class="ta-mid" letter-spacing="0.4px">4 CA NGHIỆP VỤ XỬ LÝ THỰC TẾ TRONG HỆ THỐNG NEXUS LOGISTICS (DEMO &amp; TESTED)</text>')

    cards = [
        {
            "case_id": "CA 1: BỒI THƯỜNG HÀNG HƯ HỎNG",
            "tag": "CLAIM_SOP",
            "q": "\"Hàng gốm sứ vỡ nát khi nhận, shop có được đền bù?\"",
            "source": "02-insurance-and-claim-policy.md (Score: 0.88)",
            "rule": "Điều 4.2: Có BBBT lập trong 24h -> Đền bù 100% khai giá",
            "resp": "Duyệt đền bù tối đa 2M, sinh hồ sơ Claim #CLM-88392"
        },
        {
            "case_id": "CA 2: DỰ TOÁN CƯỚC CỒNG KỀNH",
            "tag": "PRICING_IATA",
            "q": "\"Thùng 50x40x30 cm nặng 3kg gửi HN-SG cước bao nhiêu?\"",
            "source": "01-pricing-and-iata-weight.md (Score: 0.91)",
            "rule": "Chuẩn IATA: (50x40x30)/6000 = 10kg > 3kg -> Tính 10kg",
            "resp": "Báo cước nấc 10kg (130.000đ), chiết tính thể tích quy đổi"
        },
        {
            "case_id": "CA 3: KIỂM SOÁT HÀNG CẤM BAY",
            "tag": "PROHIBITED_SOP",
            "q": "\"Sạc dự phòng 20.000mAh gửi chuyển phát bay được không?\"",
            "source": "03-prohibited-and-restricted-goods.md (Score: 0.85)",
            "rule": "Quy chuẩn an toàn: Pin Lithium > 100Wh cấm vận chuyển bay",
            "resp": "Cảnh báo từ chối bay, tự động đề xuất chuyển phát đường bộ"
        },
        {
            "case_id": "CA 4: ĐỐI SOÁT TIỀN THU HỘ COD",
            "tag": "FINANCE_COD",
            "q": "\"Tiền COD đơn giao thành công khi nào đối soát về ví shop?\"",
            "source": "05-cod-policy-and-finance.md (Score: 0.87)",
            "rule": "Chính sách: Chu kỳ đối soát tự động T+2 vào Thứ 3 & Thứ 5",
            "resp": "Thông báo chính xác lịch tiền nổi ví và link xuất bảng kê"
        }
    ]

    card_w = 495
    card_h = 220
    gap = 20
    start_x = (width - (4 * card_w + 3 * gap)) / 2  # 80
    card_y = 868

    for idx, c in enumerate(cards):
        cx = start_x + idx * (card_w + gap)
        lines.append(f'    <rect x="{cx}" y="{card_y}" width="{card_w}" height="{card_h}" class="case-card"/>')
        
        # Header bar
        lines.append(f'    <rect x="{cx}" y="{card_y}" width="{card_w}" height="34" class="case-hdr"/>')
        lines.append(f'    <text x="{cx+14}" y="{card_y+22}" class="case-hdr-txt">{xml_esc(c["case_id"])}</text>')
        # Tag on right
        lines.append(f'    <rect x="{cx+card_w-115}" y="{card_y+5}" width="102" height="24" fill="#374151" rx="3"/>')
        lines.append(f'    <text x="{cx+card_w-64}" y="{card_y+21}" font-size="10.5" font-weight="800" fill="#FFFFFF" font-family="ui-monospace, monospace" class="ta-mid">{xml_esc(c["tag"])}</text>')

        # Content fields with comfortable line-height and strict boundaries
        cur_y = card_y + 58
        lines.append(f'    <text x="{cx+14}" y="{cur_y}">')
        lines.append(f'      <tspan class="case-bold">Khách hỏi: </tspan>')
        lines.append(f'      <tspan class="case-txt">{xml_esc(c["q"])}</tspan>')
        lines.append('    </text>')

        cur_y += 36
        lines.append(f'    <text x="{cx+14}" y="{cur_y}">')
        lines.append(f'      <tspan class="case-bold">Nguồn RAG: </tspan>')
        lines.append(f'      <tspan class="case-code">{xml_esc(c["source"])}</tspan>')
        lines.append('    </text>')

        cur_y += 38
        lines.append(f'    <text x="{cx+14}" y="{cur_y}">')
        lines.append(f'      <tspan class="case-bold">Trích xuất: </tspan>')
        lines.append(f'      <tspan class="case-txt">{xml_esc(c["rule"])}</tspan>')
        lines.append('    </text>')

        cur_y += 38
        lines.append(f'    <text x="{cx+14}" y="{cur_y}">')
        lines.append(f'      <tspan class="case-bold">Xử lý LLM: </tspan>')
        lines.append(f'      <tspan class="case-txt" font-weight="600" fill="#15803D">{xml_esc(c["resp"])}</tspan>')
        lines.append('    </text>')

    lines.append('  </g>')

    # =========================================================================
    # 10. ACADEMIC CAPTION (Bottom Center)
    # =========================================================================
    lines.append('  <!-- ==================== 11. CAPTION ==================== -->')
    lines.append(f'  <text x="{width/2}" y="1150" class="caption-txt">Hình 2.3: Sơ đồ luồng hoạt động RAG thực tế và 4 ca nghiệp vụ xử lý trong Hệ thống Trợ lý Ảo Nexus Logistics.</text>')

    lines.append('</svg>')
    return "\n".join(lines)

if __name__ == "__main__":
    svg_content = generate_svg()

    # Strict XML Validation
    try:
        ET.fromstring(svg_content)
        print("✓ Strict XML validation passed.")
    except Exception as e:
        print(f"✗ XML validation failed: {e}")
        raise e

    # Save to primary targets
    targets = [
        "docs/graduation-thesis/figma-page-2-process-and-ai-pipeline/diagrams/03-rag-chunking-and-vectorization.svg",
        "docs/graduation-thesis/figma-page-1-system-and-data/diagrams/04-rag-ai-chatbot-pipeline.svg"
    ]
    for rel_path in targets:
        target_path = os.path.abspath(rel_path)
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"Generated successfully: {target_path} ({len(svg_content.encode('utf-8'))} bytes)")
