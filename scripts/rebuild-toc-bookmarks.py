#!/usr/bin/env python3
"""
Rebuild MỤC LỤC, DANH MỤC HÌNH ẢNH, and DANH MỤC BẢNG BIỂU with 100% live,
valid Word PAGEREF hyperlinks + matched w:bookmarkStart/w:bookmarkEnd pairs
directly on every target Heading 1/2, Heading 5 (Hình), and Heading 6 (Bảng).

Eliminates ALL 'Error! Bookmark not defined.' errors permanently.
"""

import copy
import os
import re
import sys
import docx
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

DOC_PATH = sys.argv[1] if len(sys.argv) > 1 else "docs/BaoCaoKLTN_TranTanTai_VoVanTuTai.docx"


def get_next_bookmark_id(doc):
    max_id = 1000
    for bm in doc.element.body.findall(".//" + qn("w:bookmarkStart")):
        try:
            bid = int(bm.get(qn("w:id"), "0"))
            if bid > max_id:
                max_id = bid
        except ValueError:
            pass
    return max_id + 1


def attach_bookmark(p, bm_id, bm_name):
    """Attach a valid w:bookmarkStart / w:bookmarkEnd pair inside paragraph p."""
    el = p._element
    # Remove any old bookmark with the exact same name if present
    for existing in list(el.findall(qn("w:bookmarkStart"))):
        if existing.get(qn("w:name")) == bm_name:
            old_id = existing.get(qn("w:id"))
            el.remove(existing)
            for end in list(el.findall(qn("w:bookmarkEnd"))):
                if end.get(qn("w:id")) == old_id:
                    el.remove(end)

    bm_start = OxmlElement("w:bookmarkStart")
    bm_start.set(qn("w:id"), str(bm_id))
    bm_start.set(qn("w:name"), bm_name)

    bm_end = OxmlElement("w:bookmarkEnd")
    bm_end.set(qn("w:id"), str(bm_id))

    # Insert bookmarkStart right after pPr (or at index 0), bookmarkEnd at end of p
    insert_idx = 1 if (len(el) > 0 and el[0].tag == qn("w:pPr")) else 0
    el.insert(insert_idx, bm_start)
    el.append(bm_end)


def build_toc_entry(ref_elem, template_pPr, label_text, bm_name, run_rPr_xml=None):
    """Create a native Word TOC/LOF/LOT paragraph with clickable hyperlink + tab + PAGEREF."""
    p = OxmlElement("w:p")
    if template_pPr is not None:
        p.append(copy.deepcopy(template_pPr))

    hl = OxmlElement("w:hyperlink")
    hl.set(qn("w:anchor"), bm_name)
    hl.set(qn("w:history"), "1")

    def make_r(web_hidden=False):
        r = OxmlElement("w:r")
        if run_rPr_xml is not None:
            rPr = copy.deepcopy(run_rPr_xml)
        else:
            rPr = OxmlElement("w:rPr")
            rFonts = OxmlElement("w:rFonts")
            rFonts.set(qn("w:ascii"), "Times New Roman")
            rFonts.set(qn("w:hAnsi"), "Times New Roman")
            rPr.append(rFonts)
            col = OxmlElement("w:color")
            col.set(qn("w:val"), "000000")
            rPr.append(col)
            sz = OxmlElement("w:sz")
            sz.set(qn("w:val"), "26")
            rPr.append(sz)
            szCs = OxmlElement("w:szCs")
            szCs.set(qn("w:val"), "26")
            rPr.append(szCs)
        if web_hidden and rPr.find(qn("w:webHidden")) is None:
            rPr.append(OxmlElement("w:webHidden"))
        if rPr.find(qn("w:noProof")) is None:
            rPr.append(OxmlElement("w:noProof"))
        r.append(rPr)
        return r

    # 1. Label text
    r_txt = make_r(web_hidden=False)
    t = OxmlElement("w:t")
    t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    t.text = label_text
    r_txt.append(t)
    hl.append(r_txt)

    # 2. Tab leader
    r_tab = make_r(web_hidden=True)
    r_tab.append(OxmlElement("w:tab"))
    hl.append(r_tab)

    # 3. PAGEREF field: begin (dirty=true!) -> instrText -> separate -> placeholder -> end
    r_beg = make_r(web_hidden=True)
    fc_beg = OxmlElement("w:fldChar")
    fc_beg.set(qn("w:fldCharType"), "begin")
    fc_beg.set(qn("w:dirty"), "true")
    r_beg.append(fc_beg)
    hl.append(r_beg)

    r_ins = make_r(web_hidden=True)
    ins = OxmlElement("w:instrText")
    ins.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    ins.text = f" PAGEREF {bm_name} \\h "
    r_ins.append(ins)
    hl.append(r_ins)

    r_sep = make_r(web_hidden=True)
    fc_sep = OxmlElement("w:fldChar")
    fc_sep.set(qn("w:fldCharType"), "separate")
    r_sep.append(fc_sep)
    hl.append(r_sep)

    r_num = make_r(web_hidden=True)
    t_num = OxmlElement("w:t")
    t_num.text = "1"
    r_num.append(t_num)
    hl.append(r_num)

    r_end = make_r(web_hidden=True)
    fc_end = OxmlElement("w:fldChar")
    fc_end.set(qn("w:fldCharType"), "end")
    r_end.append(fc_end)
    hl.append(r_end)

    p.append(hl)
    ref_elem.addprevious(p)
    return p


def remove_elem(el):
    parent = el.getparent()
    if parent is not None:
        parent.remove(el)


def main():
    assert os.path.exists(DOC_PATH), f"Missing {DOC_PATH}"
    doc = docx.Document(DOC_PATH)
    paras = doc.paragraphs

    # Locate the 4 front-matter anchor titles
    idx_toc_title = None
    idx_lof_title = None
    idx_lot_title = None
    idx_acr_title = None
    idx_ch1 = None

    for i, p in enumerate(paras):
        t = p.text.strip()
        st = p.style.name if p.style else ""
        if t == "MỤC LỤC" and idx_toc_title is None:
            idx_toc_title = i
        elif t == "DANH MỤC HÌNH ẢNH" and idx_lof_title is None:
            idx_lof_title = i
        elif t == "DANH MỤC BẢNG BIỂU" and idx_lot_title is None:
            idx_lot_title = i
        elif t == "DANH MỤC CÁC THUẬT NGỮ VIẾT TẮT" and idx_acr_title is None:
            idx_acr_title = i
        elif st == "Heading 1" and t.startswith("CHƯƠNG 1") and idx_ch1 is None:
            idx_ch1 = i

    assert all(x is not None for x in (idx_toc_title, idx_lof_title, idx_lot_title, idx_acr_title, idx_ch1)), (
        f"Anchors missing: {idx_toc_title}, {idx_lof_title}, {idx_lot_title}, {idx_acr_title}, {idx_ch1}"
    )
    print(f"Anchors: TOC={idx_toc_title}, LOF={idx_lof_title}, LOT={idx_lot_title}, ACR={idx_acr_title}, CH1={idx_ch1}")

    # Capture intact pPr templates for TOC, LOF, LOT
    tpl_toc_pPr = paras[idx_toc_title + 1]._element.find(qn("w:pPr"))
    tpl_lof_pPr = paras[idx_lof_title + 1]._element.find(qn("w:pPr"))
    # Find an intact LOT paragraph with w:hyperlink for its exact pPr
    tpl_lot_pPr = None
    for j in range(idx_lot_title + 1, idx_acr_title):
        if paras[j]._element.findall(".//" + qn("w:hyperlink")):
            tpl_lot_pPr = paras[j]._element.find(qn("w:pPr"))
            break
    if tpl_lot_pPr is None:
        tpl_lot_pPr = paras[idx_lot_title + 1]._element.find(qn("w:pPr"))

    # Create a clean Times New Roman 13pt (26 half-pt) black rPr for TOC1, LOF, LOT
    def make_tnr_rPr(sz_val="26", bold=False):
        rPr = OxmlElement("w:rPr")
        rf = OxmlElement("w:rFonts")
        rf.set(qn("w:ascii"), "Times New Roman")
        rf.set(qn("w:hAnsi"), "Times New Roman")
        rPr.append(rf)
        if bold:
            rPr.append(OxmlElement("w:b"))
        col = OxmlElement("w:color")
        col.set(qn("w:val"), "000000")
        rPr.append(col)
        sz = OxmlElement("w:sz")
        sz.set(qn("w:val"), sz_val)
        rPr.append(sz)
        szCs = OxmlElement("w:szCs")
        szCs.set(qn("w:val"), sz_val)
        rPr.append(szCs)
        return rPr

    rPr_h1 = make_tnr_rPr("26", bold=True)
    rPr_h2 = make_tnr_rPr("26", bold=False)
    rPr_fig_tbl = make_tnr_rPr("26", bold=False)

    # Ensure TOC/LOF/LOT pPr has exact right-aligned dot-leader tab stop (9062 twips = Sec 2/3 printable width)
    def ensure_dot_tab(pPr, indent_left=None):
        pPr_copy = copy.deepcopy(pPr) if pPr is not None else OxmlElement("w:pPr")
        old_tabs = pPr_copy.find(qn("w:tabs"))
        if old_tabs is not None:
            pPr_copy.remove(old_tabs)
        tabs = OxmlElement("w:tabs")
        tab = OxmlElement("w:tab")
        tab.set(qn("w:val"), "right")
        tab.set(qn("w:leader"), "dot")
        tab.set(qn("w:pos"), "9062")
        tabs.append(tab)
        pPr_copy.append(tabs)
        if indent_left is not None:
            ind = pPr_copy.find(qn("w:ind"))
            if ind is None:
                ind = OxmlElement("w:ind")
                pPr_copy.append(ind)
            ind.set(qn("w:left"), str(indent_left))
            ind.set(qn("w:firstLine"), "0")
        return pPr_copy

    toc_h1_pPr = ensure_dot_tab(tpl_toc_pPr, indent_left=0)
    toc_h2_pPr = ensure_dot_tab(tpl_toc_pPr, indent_left=360)
    lof_pPr = ensure_dot_tab(tpl_lof_pPr, indent_left=0)
    lot_pPr = ensure_dot_tab(tpl_lot_pPr, indent_left=0)

    next_bm_id = get_next_bookmark_id(doc)

    # First strip ALL previous _TocSec* / _TocFig* / _TocTbl* bookmarks across the entire body
    # so re-running after adding/removing figures never causes duplicate bookmark name collisions!
    body_el = doc.element.body
    stale_ids = set()
    for bm_s in list(body_el.findall(".//" + qn("w:bookmarkStart"))):
        bname = bm_s.get(qn("w:name"), "")
        if bname.startswith(("_TocSec", "_TocFig", "_TocTbl")):
            stale_ids.add(bm_s.get(qn("w:id")))
            parent = bm_s.getparent()
            if parent is not None:
                parent.remove(bm_s)
    if stale_ids:
        for bm_e in list(body_el.findall(".//" + qn("w:bookmarkEnd"))):
            if bm_e.get(qn("w:id")) in stale_ids:
                parent = bm_e.getparent()
                if parent is not None:
                    parent.remove(bm_e)
        print(f"Cleared {len(stale_ids)} previous _TocSec/_TocFig/_TocTbl bookmarks before re-attaching.")

    # 1. Collect all body Heading 1 & Heading 2 and attach fresh bookmarks
    toc_entries = []
    ch1_h2_counter = 0
    in_ch1 = False
    sec_num = 0
    for i in range(idx_ch1, len(paras)):
        p = paras[i]
        st = p.style.name if p.style else ""
        t = p.text.strip()
        if not t:
            continue
        if st == "Heading 1":
            in_ch1 = t.startswith("CHƯƠNG 1")
            sec_num += 1
            bm = f"_TocSec{sec_num:03d}"
            attach_bookmark(p, next_bm_id, bm)
            next_bm_id += 1
            toc_entries.append(("H1", t, bm))
        elif st == "Heading 2":
            sec_num += 1
            bm = f"_TocSec{sec_num:03d}"
            attach_bookmark(p, next_bm_id, bm)
            next_bm_id += 1
            label = t
            if in_ch1 and not re.match(r"^1\.\d+", t):
                ch1_h2_counter += 1
                label = f"1.{ch1_h2_counter}. {t}"
            toc_entries.append(("H2", label, bm))

    # 2. Collect all body Hình captions (Heading 5 starting with Hình X.Y)
    lof_entries = []
    fig_num = 0
    for i in range(idx_ch1, len(paras)):
        p = paras[i]
        t = p.text.strip()
        if re.match(r"^Hình \d+\.\d+", t):
            fig_num += 1
            bm = f"_TocFig{fig_num:03d}"
            attach_bookmark(p, next_bm_id, bm)
            next_bm_id += 1
            # Clean any multi-spaces inside caption for display
            clean_label = re.sub(r"\s+", " ", t)
            lof_entries.append((clean_label, bm))

    # 3. Collect all body Bảng captions (Heading 6 starting with Bảng X.Y)
    lot_entries = []
    tbl_num = 0
    for i in range(idx_ch1, len(paras)):
        p = paras[i]
        t = p.text.strip()
        if re.match(r"^Bảng (?:\d+|A)\.\d+", t):
            tbl_num += 1
            bm = f"_TocTbl{tbl_num:03d}"
            attach_bookmark(p, next_bm_id, bm)
            next_bm_id += 1
            clean_label = re.sub(r"\s+", " ", t)
            lot_entries.append((clean_label, bm))

    print(f"Collected & bookmarked: {len(toc_entries)} TOC headings, {len(lof_entries)} Figures, {len(lot_entries)} Tables")

    # 4. Rebuild MỤC LỤC (between idx_toc_title and idx_lof_title)
    lof_title_el = paras[idx_lof_title]._element
    old_toc_els = [paras[j]._element for j in range(idx_toc_title + 1, idx_lof_title)]
    for lvl, label, bm in toc_entries:
        build_toc_entry(
            lof_title_el,
            toc_h1_pPr if lvl == "H1" else toc_h2_pPr,
            label,
            bm,
            rPr_h1 if lvl == "H1" else rPr_h2,
        )
    for el in old_toc_els:
        remove_elem(el)

    # 5. Rebuild DANH MỤC HÌNH ẢNH (between idx_lof_title and idx_lot_title)
    lot_title_el = paras[idx_lot_title]._element
    old_lof_els = [paras[j]._element for j in range(idx_lof_title + 1, idx_lot_title)]
    for label, bm in lof_entries:
        build_toc_entry(lot_title_el, lof_pPr, label, bm, rPr_fig_tbl)
    for el in old_lof_els:
        remove_elem(el)

    # 6. Rebuild DANH MỤC BẢNG BIỂU (between idx_lot_title and idx_acr_title)
    acr_title_el = paras[idx_acr_title]._element
    old_lot_els = [paras[j]._element for j in range(idx_lot_title + 1, idx_acr_title)]
    for label, bm in lot_entries:
        build_toc_entry(acr_title_el, lot_pPr, label, bm, rPr_fig_tbl)
    for el in old_lot_els:
        remove_elem(el)

    # 7. Ensure w:updateFields=true so Word computes exact page numbers on open
    settings = doc.settings.element
    uf = settings.find(qn("w:updateFields"))
    if uf is None:
        uf = OxmlElement("w:updateFields")
        settings.append(uf)
    uf.set(qn("w:val"), "true")

    doc.save(DOC_PATH)
    print(f"Saved {DOC_PATH} with 100% matched TOC/LOF/LOT bookmarks!")


if __name__ == "__main__":
    main()
