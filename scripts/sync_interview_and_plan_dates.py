#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Synchronize interview dates in Appendix A with the project plan timeline in Table 1.1 (Chapter 1).
Task 1 (06/08/2026 - 10/08/2026): Lập bảng câu hỏi khảo sát, form khảo sát
Task 2 (11/08/2026 - 24/08/2026): Khảo sát thực tế tại bưu cục và khách hàng
Task 3 (16/08/2026 - 27/08/2026): Phân tích dữ liệu khảo sát
Interview dates synchronized to 12/08/2026 - 23/08/2026.
"""

import docx
import re
from docx.enum.text import WD_ALIGN_PARAGRAPH

DOC_PATH = "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai.docx"

print(f"Loading document: {DOC_PATH}...")
doc = docx.Document(DOC_PATH)

# 1. Update List of Tables entry for Table A.1
for p in doc.paragraphs:
    if "Bảng A.1" in p.text and "06/2026" in p.text:
        p.text = p.text.replace("06/2026", "08/2026")
        print("  [Updated List of Tables / Title] ->", p.text)

# 2. Update intro paragraph 1886
for p in doc.paragraphs:
    if "03/06/2026" in p.text and "16/06/2026" in p.text:
        p.text = p.text.replace("03/06/2026 đến ngày 16/06/2026", "12/08/2026 đến ngày 23/08/2026")
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        print("  [Updated Appendix A Intro text] ->", p.text[:80])

# 3. Update Table A.1 dates (Table 223)
tbl_a1 = doc.tables[223]
new_dates = {
    1: "12/08/2026",
    2: "14/08/2026",
    3: "17/08/2026",
    4: "19/08/2026",
    5: "21/08/2026",
    6: "23/08/2026",
}

for row_idx, d_str in new_dates.items():
    cell = tbl_a1.rows[row_idx].cells[3]
    old_text = cell.text.strip().replace("\n", " ")
    cell.text = d_str
    # format cell
    cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    print(f"  [Updated Table A.1 Row {row_idx}] '{old_text}' -> '{d_str}'")

# 4. Update individual Interview forms headings (A.1 to A.6)
date_replacements = [
    ("03/06/2026", "12/08/2026"),
    ("05/06/2026", "14/08/2026"),
    ("08/06/2026", "17/08/2026"),
    ("10/06/2026", "19/08/2026"),
    ("12/06/2026", "21/08/2026"),
    ("16/06/2026", "23/08/2026"),
]

for p in doc.paragraphs:
    for old_d, new_d in date_replacements:
        if old_d in p.text and "Ngày phỏng vấn:" in p.text:
            p.text = p.text.replace(old_d, new_d)
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            print(f"  [Updated Form Header] -> {p.text}")

print(f"Saving updated document: {DOC_PATH}...")
doc.save(DOC_PATH)
print("SUCCESS: Interview dates fully synchronized with project timeline!")
