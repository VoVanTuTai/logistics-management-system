#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE RAG WORKFLOW DIAGRAM (TEXTBOOK / ACADEMIC STYLE)
=========================================================
Bản vẽ Kỹ thuật Sư phạm: Sơ đồ Luồng hoạt động cơ bản của RAG (Retrieval-Augmented Generation).
Phong cách: Tối giản, trực quan, sư phạm, chuẩn mực tài liệu học tập và đồ án tốt nghiệp.
Khắc phục triệt để:
- Loại bỏ các khung viền kỹ thuật lồng ghép rối rắm, bảng biểu dày đặc khó nhìn.
- Thay thế bằng các biểu tượng vector đồ họa trực quan (Iconography):
  + Tài liệu nguồn (TXT, PDF) & Các khối đoạn phân tách (Chunks).
  + Mạng nơ-ron nhúng (Embedding Model) đa sắc thái.
  + Ma trận vector toán học & Kho lưu trữ Vector Store 3D.
  + Kính lúp tìm kiếm tương đồng (Similarity Search) & Tập ngữ cảnh Top-K Context.
  + Não bộ LLM (bán cầu hồng tư duy & bán cầu xanh nơ-ron số).
  + Văn bản phản hồi (Answer) & Người dùng với bong bóng hội thoại.
- Luồng 1 (Offline Ingestion): Documents -> Chunks -> Embedding -> Vector Store.
- Luồng 2 (Online Retrieval & Generation): User Query -> Embedding -> Query Vector -> Similarity Search -> Top-K Context -> LLM -> Answer.
"""

import os
import html
import xml.etree.ElementTree as ET

def generate_svg():
    width = 1800
    height = 920

    lines = []
    lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#FFFFFF;">')

    # GLOBAL ANCHOR COORDINATES
    bx, by = 1435, 470  # LLM Brain Center

    # STYLES DEFINITION (CLEAN ACADEMIC TEXTBOOK STYLE)
    lines.append('  <defs>')
    lines.append('    <style type="text/css"><![CDATA[')
    lines.append('      text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Times New Roman", Arial, sans-serif; }')
    lines.append('      .lbl-title { font-size: 21px; font-weight: 700; fill: #000000; text-anchor: middle; }')
    lines.append('      .lbl-main { font-size: 19px; font-weight: 600; fill: #000000; text-anchor: middle; }')
    lines.append('      .lbl-sub { font-size: 16px; font-weight: 500; fill: #374151; text-anchor: middle; }')
    lines.append('      .math-matrix { font-family: "Cambria Math", "Times New Roman", serif; font-size: 20px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    lines.append('      .caption-txt { font-family: "Times New Roman", Times, serif; font-size: 26px; font-weight: 500; fill: #000000; text-anchor: middle; }')
    lines.append('      .flow-line { fill: none; stroke: #000000; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }')
    lines.append('      .flow-arrowhead { fill: #000000; }')
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
    # 1. TOP-LEFT: DOCUMENTS (TXT, PDF)
    # =========================================================================
    lines.append('  <!-- ==================== 1. DOCUMENTS ==================== -->')
    lines.append('  <g id="Documents_Group">')
    # Document 1: TXT (X: 70..135, Y: 80..165)
    doc1_x, doc1_y, doc_w, doc_h = 75, 80, 65, 85
    lines.append(f'    <path d="M {doc1_x} {doc1_y} L {doc1_x+doc_w-16} {doc1_y} L {doc1_x+doc_w} {doc1_y+16} L {doc1_x+doc_w} {doc1_y+doc_h} L {doc1_x} {doc1_y+doc_h} Z" fill="#FFFFFF" stroke="#000000" stroke-width="2.2" rx="4"/>')
    lines.append(f'    <path d="M {doc1_x+doc_w-16} {doc1_y} L {doc1_x+doc_w-16} {doc1_y+16} L {doc1_x+doc_w} {doc1_y+16} Z" fill="#E5E7EB" stroke="#000000" stroke-width="1.8"/>')
    # Text lines in Doc 1
    lines.append(f'    <line x1="{doc1_x+10}" y1="{doc1_y+24}" x2="{doc1_x+36}" y2="{doc1_y+24}" stroke="#9CA3AF" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append(f'    <line x1="{doc1_x+10}" y1="{doc1_y+34}" x2="{doc1_x+doc_w-12}" y2="{doc1_y+34}" stroke="#D1D5DB" stroke-width="2.5" stroke-linecap="round"/>')
    # Badge TXT
    lines.append(f'    <rect x="{doc1_x+8}" y="{doc1_y+doc_h-36}" width="{doc_w-16}" height="24" rx="4" fill="#3B82F6" stroke="#1D4ED8" stroke-width="1.2"/>')
    lines.append(f'    <text x="{doc1_x+doc_w/2}" y="{doc1_y+doc_h-20}" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">TXT</text>')

    # Document 2: PDF (X: 155..220, Y: 80..165)
    doc2_x = 155
    lines.append(f'    <path d="M {doc2_x} {doc1_y} L {doc2_x+doc_w-16} {doc1_y} L {doc2_x+doc_w} {doc1_y+16} L {doc2_x+doc_w} {doc1_y+doc_h} L {doc2_x} {doc1_y+doc_h} Z" fill="#FFFFFF" stroke="#000000" stroke-width="2.2" rx="4"/>')
    lines.append(f'    <path d="M {doc2_x+doc_w-16} {doc1_y} L {doc2_x+doc_w-16} {doc1_y+16} L {doc2_x+doc_w} {doc1_y+16} Z" fill="#FCA5A5" stroke="#000000" stroke-width="1.8"/>')
    # Text lines in Doc 2
    lines.append(f'    <line x1="{doc2_x+10}" y1="{doc1_y+24}" x2="{doc2_x+36}" y2="{doc1_y+24}" stroke="#9CA3AF" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append(f'    <line x1="{doc2_x+10}" y1="{doc1_y+34}" x2="{doc2_x+doc_w-12}" y2="{doc1_y+34}" stroke="#D1D5DB" stroke-width="2.5" stroke-linecap="round"/>')
    # Badge PDF
    lines.append(f'    <rect x="{doc2_x+8}" y="{doc1_y+doc_h-36}" width="{doc_w-16}" height="24" rx="4" fill="#EF4444" stroke="#B91C1C" stroke-width="1.2"/>')
    lines.append(f'    <text x="{doc2_x+doc_w/2}" y="{doc1_y+doc_h-20}" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle">PDF</text>')

    # Label Documents
    lines.append(f'    <text x="147" y="200" class="lbl-title">Documents</text>')
    lines.append('  </g>')

    # Arrow: Documents -> Chunks (X: 235 to 295, Y: 122)
    lines.append('  <line x1="235" y1="122" x2="295" y2="122" class="flow-line"/>')
    lines.append(arrow_head(295, 122, "right", 12))

    # =========================================================================
    # 2. CHUNKS (Top Center-Left)
    # =========================================================================
    lines.append('  <!-- ==================== 2. CHUNKS ==================== -->')
    lines.append('  <g id="Chunks_Group">')
    lines.append('    <text x="460" y="55" class="lbl-title">Chunks</text>')

    chunk_w, chunk_h = 58, 76
    c_y = 85
    chunks_x = [330, 410, 530]

    for idx, cx in enumerate(chunks_x):
        lines.append(f'    <path d="M {cx} {c_y} L {cx+chunk_w-14} {c_y} L {cx+chunk_w} {c_y+14} L {cx+chunk_w} {c_y+chunk_h} L {cx} {c_y+chunk_h} Z" fill="#FFFFFF" stroke="#000000" stroke-width="2.2" rx="3"/>')
        lines.append(f'    <path d="M {cx+chunk_w-14} {c_y} L {cx+chunk_w-14} {c_y+14} L {cx+chunk_w} {c_y+14} Z" fill="#E5E7EB" stroke="#000000" stroke-width="1.6"/>')
        # Content horizontal lines
        lines.append(f'    <line x1="{cx+10}" y1="{c_y+28}" x2="{cx+chunk_w-10}" y2="{c_y+28}" stroke="#000000" stroke-width="3.2" stroke-linecap="round"/>')
        lines.append(f'    <line x1="{cx+10}" y1="{c_y+42}" x2="{cx+chunk_w-10}" y2="{c_y+42}" stroke="#000000" stroke-width="3.2" stroke-linecap="round"/>')
        lines.append(f'    <line x1="{cx+10}" y1="{c_y+56}" x2="{cx+chunk_w-18}" y2="{c_y+56}" stroke="#000000" stroke-width="3.2" stroke-linecap="round"/>')

    # Ellipsis dots in between chunk 2 and chunk 3
    lines.append('    <circle cx="482" cy="123" r="5" fill="#000000"/>')
    lines.append('    <circle cx="496" cy="123" r="5" fill="#000000"/>')
    lines.append('    <circle cx="510" cy="123" r="5" fill="#000000"/>')

    # Connectors routing from Chunks down into Embedding Model
    # 3 branches converging at (460, 240) then vertical down to (460, 395)
    lines.append(f'    <path d="M 359 161 C 359 220, 460 210, 460 250" class="flow-line"/>')
    lines.append(f'    <path d="M 439 161 C 439 210, 460 210, 460 250" class="flow-line"/>')
    lines.append(f'    <path d="M 559 161 C 559 220, 460 210, 460 250" class="flow-line"/>')
    lines.append('    <line x1="460" y1="250" x2="460" y2="400" class="flow-line"/>')
    lines.append(arrow_head(460, 400, "down", 12))
    lines.append('  </g>')

    # =========================================================================
    # 3. EMBEDDING MODEL (Center-Left)
    # =========================================================================
    lines.append('  <!-- ==================== 3. EMBEDDING MODEL ==================== -->')
    lines.append('  <g id="Embedding_Model_Group">')
    # Label to the left
    lines.append('    <text x="350" y="460" class="lbl-title" text-anchor="end">Embedding</text>')
    lines.append('    <text x="350" y="486" class="lbl-title" text-anchor="end">Model</text>')

    # Neural Graph Cluster (Center around X=460, Y=470)
    # Connecting edges
    nodes = [
        (460, 470, "#EF4444", 15), # 0 Center Red
        (425, 435, "#3B82F6", 13), # 1 Top-Left Blue
        (460, 420, "#8B5CF6", 13), # 2 Top-Center Purple
        (495, 435, "#10B981", 13), # 3 Top-Right Green
        (510, 480, "#F59E0B", 13), # 4 Right Yellow
        (460, 520, "#06B6D4", 13), # 5 Bottom Cyan
        (420, 495, "#EAB308", 13), # 6 Bottom-Left Amber
    ]
    edges = [
        (1, 2), (2, 3), (3, 4), (4, 5), (5, 6), (6, 1),
        (0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (0, 6)
    ]
    for n1, n2 in edges:
        x1, y1 = nodes[n1][0], nodes[n1][1]
        x2, y2 = nodes[n2][0], nodes[n2][1]
        lines.append(f'    <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#000000" stroke-width="2.2"/>')

    # Draw Nodes
    for nx, ny, nfill, nr in nodes:
        lines.append(f'    <circle cx="{nx}" cy="{ny}" r="{nr}" fill="{nfill}" stroke="#000000" stroke-width="2.2"/>')
    lines.append('  </g>')

    # =========================================================================
    # 4. CHUNKS VECTOR & VECTOR STORE (Center)
    # =========================================================================
    lines.append('  <!-- ==================== 4. VECTOR STORE ==================== -->')
    lines.append('  <g id="Vector_Store_Group">')
    # 3 ray arrows from Embedding Model to Chunk Vector Matrix
    lines.append('    <line x1="530" y1="450" x2="600" y2="420" class="flow-line"/>')
    lines.append(arrow_head(600, 420, "right", 10))
    lines.append('    <line x1="530" y1="470" x2="600" y2="470" class="flow-line"/>')
    lines.append(arrow_head(600, 470, "right", 10))
    lines.append('    <line x1="530" y1="490" x2="600" y2="520" class="flow-line"/>')
    lines.append(arrow_head(600, 520, "right", 10))

    # Vector Matrix Bracket [0.1, -0.5, ...]
    vx, vy = 640, 470
    lines.append(f'    <path d="M {vx-20} {vy-42} L {vx-28} {vy-42} L {vx-28} {vy+42} L {vx-20} {vy+42}" fill="none" stroke="#000000" stroke-width="2.2"/>')
    lines.append(f'    <path d="M {vx+20} {vy-42} L {vx+28} {vy-42} L {vx+28} {vy+42} L {vx+20} {vy+42}" fill="none" stroke="#000000" stroke-width="2.2"/>')
    lines.append(f'    <text x="{vx}" y="{vy-18}" class="math-matrix">0.1</text>')
    lines.append(f'    <text x="{vx}" y="{vy+8}" class="math-matrix">-0.5</text>')
    lines.append(f'    <text x="{vx}" y="{vy+32}" class="math-matrix">...</text>')

    # Arrow from Vector to Vector Store
    lines.append('    <line x1="680" y1="470" x2="740" y2="470" class="flow-line"/>')
    lines.append(arrow_head(740, 470, "right", 12))

    # Vector Store Cylinder (Center X=800, Y=470)
    db_x, db_y = 750, 415
    db_w, db_h = 100, 115
    ry = 18

    # Title Vector Store
    lines.append(f'    <text x="{db_x + db_w/2}" y="{db_y - 28}" class="lbl-title">Vector Store</text>')

    # 3D Cylindrical Layers
    # Bottom layer
    lines.append(f'    <path d="M {db_x} {db_y+65} L {db_x} {db_y+db_h} A {db_w/2} {ry} 0 0 0 {db_x+db_w} {db_y+db_h} L {db_x+db_w} {db_y+65} Z" fill="#3B82F6" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <ellipse cx="{db_x+db_w/2}" cy="{db_y+65}" rx="{db_w/2}" ry="{ry}" fill="#60A5FA" stroke="#000000" stroke-width="2.4"/>')
    # Middle layer
    lines.append(f'    <path d="M {db_x} {db_y+32} L {db_x} {db_y+65} A {db_w/2} {ry} 0 0 0 {db_x+db_w} {db_y+65} L {db_x+db_w} {db_y+32} Z" fill="#60A5FA" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <ellipse cx="{db_x+db_w/2}" cy="{db_y+32}" rx="{db_w/2}" ry="{ry}" fill="#93C5FD" stroke="#000000" stroke-width="2.4"/>')
    # Top layer
    lines.append(f'    <path d="M {db_x} {db_y} L {db_x} {db_y+32} A {db_w/2} {ry} 0 0 0 {db_x+db_w} {db_y+32} L {db_x+db_w} {db_y} Z" fill="#93C5FD" stroke="#000000" stroke-width="2.4"/>')
    lines.append(f'    <ellipse cx="{db_x+db_w/2}" cy="{db_y}" rx="{db_w/2}" ry="{ry}" fill="#BFDBFE" stroke="#000000" stroke-width="2.4"/>')

    # Data lines on cylinder front
    lines.append(f'    <path d="M {db_x+25} {db_y+48} A 25 8 0 0 0 {db_x+75} {db_y+48}" fill="none" stroke="#1D4ED8" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append(f'    <path d="M {db_x+25} {db_y+82} A 25 8 0 0 0 {db_x+75} {db_y+82}" fill="none" stroke="#1E40AF" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append('  </g>')

    # Arrow from Vector Store to Similarity Search (X: 860 to 1020, Y: 470)
    lines.append('  <line x1="860" y1="470" x2="1020" y2="470" class="flow-line"/>')
    lines.append(arrow_head(1020, 470, "right", 12))

    # =========================================================================
    # 5. USER & QUERY FLOW (Bottom-Left)
    # =========================================================================
    lines.append('  <!-- ==================== 5. USER & QUERY FLOW ==================== -->')
    lines.append('  <g id="User_Query_Group">')
    # User Avatar (X: 90, Y: 720)
    ux, uy = 90, 715
    # Head
    lines.append(f'    <circle cx="{ux}" cy="{uy}" r="18" fill="#FFFFFF" stroke="#000000" stroke-width="2.8"/>')
    # Shoulders
    lines.append(f'    <path d="M {ux-26} {uy+46} C {ux-26} {uy+24}, {ux+26} {uy+24}, {ux+26} {uy+46}" fill="#FFFFFF" stroke="#000000" stroke-width="2.8"/>')

    # Speech Bubble (X: 145..315, Y: 670..740)
    sb_x, sb_y, sb_w, sb_h = 145, 672, 175, 68
    lines.append(f'    <rect x="{sb_x}" y="{sb_y}" width="{sb_w}" height="{sb_h}" rx="20" fill="#E0F7FA" stroke="#000000" stroke-width="2.2"/>')
    # Speech bubble tail pointing left to user
    lines.append(f'    <path d="M {sb_x+4} {sb_y+40} L {sb_x-18} {sb_y+46} L {sb_x+10} {sb_y+52} Z" fill="#E0F7FA" stroke="#000000" stroke-width="2.2" stroke-linejoin="round"/>')
    # Clean inner fill to hide overlapping stroke
    lines.append(f'    <path d="M {sb_x+2} {sb_y+36} L {sb_x-14} {sb_y+46} L {sb_x+12} {sb_y+50} Z" fill="#E0F7FA"/>')
    lines.append(f'    <text x="{sb_x+sb_w/2}" y="{sb_y+41}" font-size="19" font-weight="600" fill="#000000" text-anchor="middle">What is RAG?</text>')

    # Arrow from Speech Bubble UP into Embedding Model
    lines.append(f'    <path d="M {sb_x+sb_w} {sb_y+34} C {sb_x+sb_w+60} {sb_y+34}, 440 600, 440 545" class="flow-line"/>')
    lines.append(arrow_head(440, 545, "up", 12))

    # Arrow from Embedding Model DOWN to Query Vector
    lines.append('    <path d="M 480 545 C 480 685, 520 685, 600 685" class="flow-line"/>')
    lines.append(arrow_head(600, 685, "right", 10))

    # 3 Ray Arrows to Query Vector
    lines.append('    <line x1="560" y1="685" x2="600" y2="655" class="flow-line"/>')
    lines.append(arrow_head(600, 655, "right", 9))
    lines.append('    <line x1="560" y1="685" x2="600" y2="715" class="flow-line"/>')
    lines.append(arrow_head(600, 715, "right", 9))

    # Query Vector Matrix [-0.2, 0.3, ...]
    qvx, qvy = 640, 685
    lines.append(f'    <path d="M {qvx-20} {qvy-42} L {qvx-28} {qvy-42} L {qvx-28} {qvy+42} L {qvx-20} {qvy+42}" fill="none" stroke="#000000" stroke-width="2.2"/>')
    lines.append(f'    <path d="M {qvx+20} {qvy-42} L {qvx+28} {qvy-42} L {qvx+28} {qvy+42} L {qvx+20} {qvy+42}" fill="none" stroke="#000000" stroke-width="2.2"/>')
    lines.append(f'    <text x="{qvx}" y="{qvy-18}" class="math-matrix">-0.2</text>')
    lines.append(f'    <text x="{qvx}" y="{qvy+8}" class="math-matrix">0.3</text>')
    lines.append(f'    <text x="{qvx}" y="{qvy+32}" class="math-matrix">...</text>')

    # Label Query Vector
    lines.append(f'    <text x="{qvx+54}" y="{qvy-5}" class="lbl-main" text-anchor="start">Query</text>')
    lines.append(f'    <text x="{qvx+54}" y="{qvy+22}" class="lbl-main" text-anchor="start">Vector</text>')

    # Arrow from Query Vector to Similarity Search
    lines.append(f'    <path d="M {qvx+125} {qvy} L 1055 {qvy} L 1055 520" class="flow-line"/>')
    lines.append(arrow_head(1055, 520, "up", 12))

    # Long Bottom Arrow: User Prompt directly to LLM
    lines.append(f'    <path d="M 150 740 L 150 785 L {bx} 785 L {bx} 522" class="flow-line"/>')
    lines.append(arrow_head(bx, 522, "up", 12))
    lines.append('  </g>')

    # =========================================================================
    # 6. SIMILARITY SEARCH & TOP-K CONTEXT (Middle-Right)
    # =========================================================================
    lines.append('  <!-- ==================== 6. SIMILARITY SEARCH ==================== -->')
    lines.append('  <g id="Similarity_Search_Group">')
    lines.append('    <text x="1055" y="380" class="lbl-title">Similarity</text>')
    lines.append('    <text x="1055" y="405" class="lbl-title">Search</text>')

    # Magnifying Glass Icon (Center X=1055, Y=470)
    mx, my = 1055, 465
    # Glass Circle
    lines.append(f'    <circle cx="{mx+4}" cy="{my-4}" r="26" fill="#E0F2FE" stroke="#0284C7" stroke-width="4.0"/>')
    # Inner light glint arc
    lines.append(f'    <path d="M {mx-10} {my-14} A 16 16 0 0 1 {mx+12} {my-18}" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>')
    # Handle
    lines.append(f'    <line x1="{mx-14}" y1="{my+14}" x2="{mx-32}" y2="{my+32}" stroke="#0284C7" stroke-width="7.0" stroke-linecap="round"/>')
    lines.append('  </g>')

    # Arrow from Similarity Search to Top-K Context
    lines.append('  <line x1="1095" y1="470" x2="1180" y2="470" class="flow-line"/>')
    lines.append(arrow_head(1180, 470, "right", 12))

    # Top-K Context Stack (X: 1200..1290, Y: 420..520)
    lines.append('  <!-- ==================== 7. TOP-K CONTEXT ==================== -->')
    lines.append('  <g id="TopK_Context_Group">')
    tk_x, tk_y = 1200, 420
    kw, kh = 65, 85

    # Back page 1
    lines.append(f'    <path d="M {tk_x-16} {tk_y-12} L {tk_x+kw-30} {tk_y-12} L {tk_x+kw-16} {tk_y+2} L {tk_x+kw-16} {tk_y+kh-12} L {tk_x-16} {tk_y+kh-12} Z" fill="#F8FAFC" stroke="#000000" stroke-width="1.8" rx="3"/>')
    # Middle page 2
    lines.append(f'    <path d="M {tk_x-8} {tk_y-6} L {tk_x+kw-22} {tk_y-6} L {tk_x+kw-8} {tk_y+8} L {tk_x+kw-8} {tk_y+kh-6} L {tk_x-8} {tk_y+kh-6} Z" fill="#F1F5F9" stroke="#000000" stroke-width="1.8" rx="3"/>')
    # Front page 3
    lines.append(f'    <path d="M {tk_x} {tk_y} L {tk_x+kw-14} {tk_y} L {tk_x+kw} {tk_y+14} L {tk_x+kw} {tk_y+kh} L {tk_x} {tk_y+kh} Z" fill="#F0F9FF" stroke="#000000" stroke-width="2.2" rx="3"/>')
    lines.append(f'    <path d="M {tk_x+kw-14} {tk_y} L {tk_x+kw-14} {tk_y+14} L {tk_x+kw} {tk_y+14} Z" fill="#BAE6FD" stroke="#000000" stroke-width="1.6"/>')
    # Lines inside front page
    lines.append(f'    <line x1="{tk_x+10}" y1="{tk_y+26}" x2="{tk_x+kw-12}" y2="{tk_y+26}" stroke="#0284C7" stroke-width="2.8" stroke-linecap="round"/>')
    lines.append(f'    <line x1="{tk_x+10}" y1="{tk_y+38}" x2="{tk_x+kw-12}" y2="{tk_y+38}" stroke="#64748B" stroke-width="2.4" stroke-linecap="round"/>')
    lines.append(f'    <line x1="{tk_x+10}" y1="{tk_y+50}" x2="{tk_x+kw-12}" y2="{tk_y+50}" stroke="#64748B" stroke-width="2.4" stroke-linecap="round"/>')
    lines.append(f'    <line x1="{tk_x+10}" y1="{tk_y+62}" x2="{tk_x+kw-20}" y2="{tk_y+62}" stroke="#64748B" stroke-width="2.4" stroke-linecap="round"/>')

    # Label Top-K Context
    lines.append(f'    <text x="{tk_x+kw/2}" y="{tk_y+kh+26}" class="lbl-main">Top-K</text>')
    lines.append(f'    <text x="{tk_x+kw/2}" y="{tk_y+kh+48}" class="lbl-main">Context</text>')
    lines.append('  </g>')

    # Arrow from Top-K Context to LLM
    lines.append('  <line x1="1285" y1="470" x2="1375" y2="470" class="flow-line"/>')
    lines.append(arrow_head(1375, 470, "right", 12))

    # =========================================================================
    # 7. LLM (Far-Right)
    # =========================================================================
    lines.append('  <!-- ==================== 8. LLM BRAIN ==================== -->')
    lines.append('  <g id="LLM_Group">')
    bx, by = 1435, 470

    # Brain Icon (Left Pink Hemisphere + Right Cyan Hemisphere)
    # Left Hemisphere (Pink Folds - Biological / Intuitive)
    lines.append(f'    <path d="M {bx} {by-44} C {bx-35} {by-48}, {bx-55} {by-25}, {bx-42} {by} C {bx-60} {by+15}, {bx-45} {by+45}, {bx-25} {by+42} C {bx-15} {by+48}, {bx-4} {by+44}, {bx} {by+42} Z" fill="#FB7185" stroke="#000000" stroke-width="2.4"/>')
    # Inner pink gyri lines
    lines.append(f'    <path d="M {bx-12} {by-30} C {bx-30} {by-25}, {bx-25} {by-10}, {bx-10} {by-8}" fill="none" stroke="#881337" stroke-width="2.2" stroke-linecap="round"/>')
    lines.append(f'    <path d="M {bx-35} {by} C {bx-20} {by+5}, {bx-25} {by+25}, {bx-10} {by+26}" fill="none" stroke="#881337" stroke-width="2.2" stroke-linecap="round"/>')

    # Right Hemisphere (Cyan Neural Circuits - Logical / Computational)
    lines.append(f'    <path d="M {bx} {by-44} C {bx+35} {by-48}, {bx+55} {by-25}, {bx+42} {by} C {bx+60} {by+15}, {bx+45} {by+45}, {bx+25} {by+42} C {bx+15} {by+48}, {bx+4} {by+44}, {bx} {by+42} Z" fill="#22D3EE" stroke="#000000" stroke-width="2.4"/>')
    # Circuit tracks & nodes
    lines.append(f'    <path d="M {bx+8} {by-28} L {bx+26} {by-28} L {bx+36} {by-14}" fill="none" stroke="#000000" stroke-width="2.2"/>')
    lines.append(f'    <circle cx="{bx+36}" cy="{by-14}" r="3.5" fill="#000000"/>')
    lines.append(f'    <path d="M {bx+8} {by} L {bx+22} {by} L {bx+32} {by+12} L {bx+42} {by+12}" fill="none" stroke="#000000" stroke-width="2.2"/>')
    lines.append(f'    <circle cx="{bx+42}" cy="{by+12}" r="3.5" fill="#000000"/>')
    lines.append(f'    <path d="M {bx+8} {by+26} L {bx+24} {by+26}" fill="none" stroke="#000000" stroke-width="2.2"/>')
    lines.append(f'    <circle cx="{bx+24}" cy="{by+26}" r="3.5" fill="#000000"/>')

    # Central divider line
    lines.append(f'    <line x1="{bx}" y1="{by-44}" x2="{bx}" y2="{by+42}" stroke="#000000" stroke-width="2.0"/>')

    # Label LLM on the right
    lines.append(f'    <text x="{bx+68}" y="{by+8}" font-size="25" font-weight="900" fill="#000000" text-anchor="start">LLM</text>')
    lines.append('  </g>')

    # Arrow UP from LLM to Answer
    lines.append(f'  <line x1="{bx}" y1="{by-48}" x2="{bx}" y2="305" class="flow-line"/>')
    lines.append(arrow_head(bx, 305, "up", 12))

    # =========================================================================
    # 8. ANSWER (Top-Right)
    # =========================================================================
    lines.append('  <!-- ==================== 9. ANSWER DOCUMENT ==================== -->')
    lines.append('  <g id="Answer_Group">')
    lines.append(f'    <text x="{bx}" y="55" class="lbl-title">Answer</text>')

    ans_x, ans_y = bx - 75, 75
    ans_w, ans_h = 150, 195

    # Document shape
    lines.append(f'    <path d="M {ans_x} {ans_y} L {ans_x+ans_w-26} {ans_y} L {ans_x+ans_w} {ans_y+26} L {ans_x+ans_w} {ans_y+ans_h} L {ans_x} {ans_y+ans_h} Z" fill="#FFFFFF" stroke="#000000" stroke-width="2.4" rx="4"/>')
    lines.append(f'    <path d="M {ans_x+ans_w-26} {ans_y} L {ans_x+ans_w-26} {ans_y+26} L {ans_x+ans_w} {ans_y+26} Z" fill="#E5E7EB" stroke="#000000" stroke-width="2.0"/>')

    # Excerpt Text Lines inside Answer document
    lines.append(f'    <text x="{ans_x+16}" y="{ans_y+38}" font-size="16" font-family="Times New Roman, serif" font-weight="600" fill="#000000">Retrieval-</text>')
    lines.append(f'    <text x="{ans_x+16}" y="{ans_y+62}" font-size="16" font-family="Times New Roman, serif" font-weight="600" fill="#000000">augmented</text>')
    lines.append(f'    <text x="{ans_x+16}" y="{ans_y+86}" font-size="16" font-family="Times New Roman, serif" font-weight="600" fill="#000000">generation is a</text>')
    lines.append(f'    <text x="{ans_x+16}" y="{ans_y+110}" font-size="16" font-family="Times New Roman, serif" font-weight="600" fill="#000000">technique that</text>')
    lines.append(f'    <text x="{ans_x+16}" y="{ans_y+134}" font-size="16" font-family="Times New Roman, serif" font-weight="600" fill="#000000">...</text>')

    # Subtle decorative base lines
    lines.append(f'    <line x1="{ans_x+16}" y1="{ans_y+156}" x2="{ans_x+ans_w-24}" y2="{ans_y+156}" stroke="#E5E7EB" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append(f'    <line x1="{ans_x+16}" y1="{ans_y+170}" x2="{ans_x+ans_w-40}" y2="{ans_y+170}" stroke="#E5E7EB" stroke-width="2.5" stroke-linecap="round"/>')
    lines.append('  </g>')

    # =========================================================================
    # 9. ACADEMIC CAPTION (Bottom Center)
    # =========================================================================
    lines.append('  <!-- ==================== 10. ACADEMIC CAPTION ==================== -->')
    lines.append(f'  <text x="{width/2}" y="875" class="caption-txt">Hình 3: Sơ đồ luồng hoạt động cơ bản của RAG.</text>')

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
