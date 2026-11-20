#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Adjust text alignment of thesis document to JUSTIFY (Canh đều 2 bên),
ensuring left and right margins are straight, uniform and professional.
- Preserves all centered covers, headings, figures, captions and signatures.
- Updates all narrative body text paragraphs (Normal, List Paragraph) to JUSTIFIED.
- Fixes any headings that were accidentally justified back to LEFT.
"""

import os
import shutil
import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH

DOC_PATH = "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai.docx"
BAK_PATH = "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai.docx.bak_before_justify"

print(f"Backing up current document to {BAK_PATH}...")
shutil.copyfile(DOC_PATH, BAK_PATH)

print(f"Loading document: {DOC_PATH}...")
doc = docx.Document(DOC_PATH)

# Set base Normal style to JUSTIFY
try:
    doc.styles["Normal"].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    print("Set Normal style base alignment to JUSTIFY.")
except Exception as e:
    print("Note on Normal style:", e)

justified_count = 0
heading_fixed_count = 0
graphic_centered_count = 0

for idx, p in enumerate(doc.paragraphs):
    st = p.style.name
    txt = p.text.strip()
    has_graphic = "graphic" in p._p.xml
    al = p.alignment

    # 1. Preserve or format Graphics
    if has_graphic:
        if p.alignment != WD_ALIGN_PARAGRAPH.CENTER:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            graphic_centered_count += 1
        continue

    # 2. Skip TOC entries (Mục lục, Danh mục hình vẽ, Danh mục bảng biểu)
    if st.startswith("toc"):
        continue

    # 3. Handle Headings
    if st in ("Heading 2", "Heading 3", "Heading 4"):
        if al == WD_ALIGN_PARAGRAPH.JUSTIFY:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            heading_fixed_count += 1
        continue
    if st == "Heading 5":
        # Figure captions must stay CENTER
        if al != WD_ALIGN_PARAGRAPH.CENTER:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        continue
    if st in ("Heading 1", "Heading 6"):
        continue

    if not txt:
        continue

    # 4. Skip Front matter signatures and cover pages
    if idx < 74:
        # Cover pages: keep original alignment (mostly CENTER)
        continue

    if 74 <= idx <= 114:
        # Sign-off lines and dots
        if "……" in txt or "TP. Hồ Chí Minh" in txt or "CHỮ KÝ" in txt or "NHẬN XÉT" in txt:
            continue
        if any(name in txt for name in ["Người thực hiện", "Võ Văn Tú Tài", "Trần Tấn Tài"]):
            continue
        # Titles like "ABSTRACT", "TÓM TẮT", "LỜI CẢM ƠN"
        if al == WD_ALIGN_PARAGRAPH.CENTER:
            continue
        # Body text of Abstract, Tóm tắt, Lời cảm ơn -> JUSTIFY
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        justified_count += 1
        continue

    # 5. Skip Table of Contents section (before Chapter 1)
    if 115 <= idx < 324:
        continue

    # 6. Main Body (Chapter 1 through Chapter 8, References, Appendix)
    if idx >= 324:
        # Preserve explicitly centered short titles or labels
        if al == WD_ALIGN_PARAGRAPH.CENTER and len(txt) < 50 and not ("." in txt and len(txt) > 20):
            continue
        # Preserve right-aligned signatures/dates
        if al == WD_ALIGN_PARAGRAPH.RIGHT:
            continue
        # Justify body prose and lists
        if st in ("Normal", "List Paragraph"):
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            justified_count += 1

print(f"Total paragraphs updated to JUSTIFY (Canh đều 2 bên): {justified_count}")
print(f"Total headings fixed back to LEFT: {heading_fixed_count}")
print(f"Total graphics ensured CENTER: {graphic_centered_count}")

print("Saving modified document...")
doc.save(DOC_PATH)
print("SUCCESS: Document formatting updated and saved successfully!")
