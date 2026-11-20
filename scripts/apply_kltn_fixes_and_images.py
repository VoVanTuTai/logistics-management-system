#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Precise, verified script to apply all fixes and deployment figures to
docs/BaoCaoKLTN_TranTanTai_VoVanTuTai.docx.
"""

import os
import shutil
import docx
from docx.shared import Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

DOC_PATH = "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai.docx"
BAK_PATH = "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai.docx.bak_before_fixes"

# 1. Restore clean backup
print(f"Restoring clean backup from {BAK_PATH}...")
shutil.copyfile(BAK_PATH, DOC_PATH)

doc = docx.Document(DOC_PATH)
body = doc._body._element

print("Document loaded. Total body elements:", len(body))

# -------------------------------------------------------------------------
# A. FIX HEADING 2 IN CHAPTER 1 BODY (Elements 321, 328, 341, 344, 374, 385, 423)
# -------------------------------------------------------------------------
h2_fixes = {
    321: "1.1. Giới thiệu đề tài",
    328: "1.2. Mục đích, mục tiêu của đề tài",
    341: "1.3. Yêu cầu ban đầu của đề tài",
    344: "1.4. Đối tượng nghiên cứu và phạm vi của đề tài",
    374: "1.5. Ý nghĩa khoa học và thực tiễn của đề tài",
    385: "1.6. Đề xuất giải pháp",
    423: "1.7. Bố cục báo cáo Khóa luận tốt nghiệp",
}

for idx, new_text in h2_fixes.items():
    el = body[idx]
    # Update text runs in this paragraph
    # First clear existing text in <w:t> tags
    t_tags = el.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t')
    if t_tags:
        t_tags[0].text = new_text
        for t in t_tags[1:]:
            t.text = ""
        print(f"  [Fixed Heading 2 at element {idx}] -> {new_text}")
    else:
        print(f"  Warning: no <w:t> found at element {idx}")

# -------------------------------------------------------------------------
# B. FIX BẢNG 0.1 -> BẢNG 1.1
# -------------------------------------------------------------------------
# 1. In Danh mục bảng biểu (Element 221)
el_221 = body[221]
for t in el_221.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
    if "Bảng 0.1" in (t.text or ""):
        t.text = t.text.replace("Bảng 0.1", "Bảng 1.1.")
        print("  [Fixed List of Tables entry] ->", t.text)

# 2. In Chapter 1 body (Element 420)
el_420 = body[420]
for t in el_420.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
    if t.text == "0":
        t.text = "1"
        print("  [Fixed Element 420 cached STYLEREF 0 -> 1]")

# -------------------------------------------------------------------------
# C. UPDATE LIST OF FIGURES (DANH MỤC HÌNH VẼ)
# -------------------------------------------------------------------------
target_toc_tbl = body[220] # DANH MỤC BẢNG BIỂU
toc_figures = [
    "Hình 6.1 Ảnh minh chứng trạng thái vận hành của 15 tiến trình Node.js trên PM2\t367",
    "Hình 6.2 Ảnh minh chứng các container hạ tầng nền tảng trên Docker Desktop\t368",
    "Hình 6.3 Ảnh minh chứng cấu trúc 12 cơ sở dữ liệu phân tán (Database-per-Service)\t370",
    "Hình 6.4 Ảnh minh chứng quy trình CI/CD tự động và bảng điều khiển giám sát tài nguyên máy chủ\t372",
]

for item in toc_figures:
    p = doc.add_paragraph(item, style="toc 5")
    target_toc_tbl.addprevious(p._p)
    print("  [Added to List of Figures] ->", item)

# -------------------------------------------------------------------------
# D. INSERT DEPLOYMENT FIGURES INTO SECTION 6.3
# -------------------------------------------------------------------------
img_pm2 = os.path.abspath("docs/images/deployment/hinh6_1_pm2_status.png")
img_docker = os.path.abspath("docs/images/deployment/hinh6_2_docker_containers.png")
img_dbeaver = os.path.abspath("docs/images/deployment/hinh6_3_dbeaver_12_databases.png")
img_cicd = os.path.abspath("docs/images/deployment/hinh6_4_cicd_monitoring.png")

def create_figure_block(doc, img_path, caption_text, intro_text=None):
    elems = []
    if intro_text:
        p_intro = doc.add_paragraph(intro_text, style="Normal")
        elems.append(p_intro._p)
    
    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p_img.add_run()
    run.add_picture(img_path, width=Inches(6.2))
    elems.append(p_img._p)
    
    p_cap = doc.add_paragraph(caption_text, style="Heading 5")
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elems.append(p_cap._p)
    
    return elems

# Find body targets (idx > 1800)
target_6_3_3 = None
target_6_3_4 = None
target_6_4 = None

for idx, el in enumerate(body):
    if idx > 1800 and el.tag.endswith("p"):
        txt = "".join(el.itertext()).strip()
        if txt.startswith("6.3.3. Phân vùng dữ liệu độc lập") and target_6_3_3 is None:
            target_6_3_3 = el
        elif txt.startswith("6.3.4. Cơ chế bảo mật SSL/TLS") and target_6_3_4 is None:
            target_6_3_4 = el
        elif txt.startswith("6.4. Kiểm thử hệ thống") and target_6_4 is None:
            target_6_4 = el

assert target_6_3_3 is not None, "target_6_3_3 not found"
assert target_6_3_4 is not None, "target_6_3_4 not found"
assert target_6_4 is not None, "target_6_4 not found"

print("Found all body targets. Inserting figures...")

# Group 1: Figures 6.1 & 6.2 before 6.3.3
group1 = create_figure_block(
    doc,
    img_pm2,
    "Hình 6.1 Ảnh minh chứng trạng thái vận hành của 15 tiến trình Node.js trên PM2",
    "Trạng thái vận hành thực tế của 15 tiến trình Node.js trên máy chủ Apple Silicon qua lệnh pm2 status và 4 container hạ tầng trên Docker Desktop được minh chứng chi tiết tại Hình 6.1 và Hình 6.2."
)
group2 = create_figure_block(
    doc,
    img_docker,
    "Hình 6.2 Ảnh minh chứng các container hạ tầng nền tảng trên Docker Desktop"
)
for el in group1 + group2:
    target_6_3_3.addprevious(el)
print("  Inserted Figures 6.1 & 6.2 before 6.3.3")

# Group 2: Figure 6.3 before 6.3.4
group3 = create_figure_block(
    doc,
    img_dbeaver,
    "Hình 6.3 Ảnh minh chứng cấu trúc 12 cơ sở dữ liệu phân tán (Database-per-Service)",
    "Cấu trúc phân vùng 12 cơ sở dữ liệu PostgreSQL độc lập trên máy chủ quản trị CSDL được thể hiện trực quan qua Hình 6.3, bảo đảm tính tự chủ và toàn vẹn dữ liệu cho từng dịch vụ nghiệp vụ."
)
for el in group3:
    target_6_3_4.addprevious(el)
print("  Inserted Figure 6.3 before 6.3.4")

# Group 3: Figure 6.4 before 6.4
group4 = create_figure_block(
    doc,
    img_cicd,
    "Hình 6.4 Ảnh minh chứng quy trình CI/CD tự động và bảng điều khiển giám sát tài nguyên máy chủ",
    "Quy trình đóng gói, tự động triển khai mã nguồn qua CI/CD và bảng điều khiển giám sát độ sẵn sàng của máy chủ đám mây được minh chứng tại Hình 6.4."
)
for el in group4:
    target_6_4.addprevious(el)
print("  Inserted Figure 6.4 before 6.4")

# Save document
print("Saving document to", DOC_PATH)
doc.save(DOC_PATH)
print("DONE! File updated successfully.")
