import re
import docx
from lxml import etree
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from latex2mathml.converter import convert as latex2mathml_convert
from mathml2omml import convert as mathml2omml_convert


def build_ssrc_distributed_docx():
    template_path = 'docs/research/SSRC_Word_Template.docx'
    output_path = 'docs/research/paper/SSRC_Distributed_Outbox_CQRS_Logistics.docx'

    fig1_path = 'docs/research/paper/diagrams/fig1-distributed-outbox-cqrs-cartoon-bw.png'
    fig2_path = 'docs/research/paper/diagrams/distributed-scaling-latency-charts.png'
    fig3_path = 'docs/research/paper/diagrams/distributed-resilience-drain-charts.png'

    doc = docx.Document(template_path)

    # 1. Clean template style framePr / numPr artifacts
    styles_elm = doc.styles.element
    for s in styles_elm.xpath('.//w:style[@w:styleId="Title" or @w:styleId="Authors"]'):
        for f in s.xpath('.//w:framePr'):
            f.getparent().remove(f)
    for s in styles_elm.xpath('.//w:style[@w:styleId="References"]'):
        for np_el in s.xpath('.//w:numPr'):
            np_el.getparent().remove(np_el)

    # 2. Enable Word automatic hyphenation
    settings_elm = doc.settings.element
    if not settings_elm.xpath('.//w:autoHyphenation'):
        auto_hyphen = parse_xml(r'<w:autoHyphenation {} w:val="true"/>'.format(nsdecls('w')))
        settings_elm.append(auto_hyphen)

    # 3. Synchronize running header year to 2026 across sections
    for s in doc.sections:
        for p in s.header.paragraphs:
            for r in p.runs:
                if '2025' in r.text:
                    r.text = r.text.replace('2025', '2026')

    # 4. Clear placeholder body while keeping final sectPr
    body = doc._body._body
    for child in list(body):
        if child.tag.endswith('sectPr'):
            continue
        body.remove(child)

    # 5. Final section properties (IEEE 2-column geometry: 3.50 in columns, 0.20 in gutter)
    final_sectPr = doc.sections[0]._sectPr
    pgMar = final_sectPr.xpath('./w:pgMar')[0]
    pgMar.set('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}top', '1008')
    pgMar.set('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}right', '936')
    pgMar.set('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}bottom', '1008')
    pgMar.set('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}left', '936')
    cols = final_sectPr.xpath('./w:cols')[0]
    cols.set('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}num', '2')
    cols.set('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}space', '288')

    NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    NS_M = "http://schemas.openxmlformats.org/officeDocument/2006/math"
    NS = {'w': NS_W, 'm': NS_M}
    XML_SPACE = '{http://www.w3.org/XML/1998/namespace}space'

    def make_w_rpr(pt_size=10.0, bold=False, font_name='Cambria Math'):
        sz_val = str(int(round(pt_size * 2)))
        wrpr = etree.Element(f'{{{NS_W}}}rPr')
        rfonts = etree.SubElement(wrpr, f'{{{NS_W}}}rFonts')
        rfonts.set(f'{{{NS_W}}}ascii', font_name)
        rfonts.set(f'{{{NS_W}}}hAnsi', font_name)
        if not bold:
            b = etree.SubElement(wrpr, f'{{{NS_W}}}b')
            b.set(f'{{{NS_W}}}val', '0')
            bcs = etree.SubElement(wrpr, f'{{{NS_W}}}bCs')
            bcs.set(f'{{{NS_W}}}val', '0')
        caps = etree.SubElement(wrpr, f'{{{NS_W}}}caps')
        caps.set(f'{{{NS_W}}}val', '0')
        scaps = etree.SubElement(wrpr, f'{{{NS_W}}}smallCaps')
        scaps.set(f'{{{NS_W}}}val', '0')
        sz = etree.SubElement(wrpr, f'{{{NS_W}}}sz')
        sz.set(f'{{{NS_W}}}val', sz_val)
        szCs = etree.SubElement(wrpr, f'{{{NS_W}}}szCs')
        szCs.set(f'{{{NS_W}}}val', sz_val)
        return wrpr

    def latex_to_omml_el(latex_str, pt_size=10.0, bold=False):
        latex_str = re.sub(r'(?<!\.)\b(\d{1,3}),(\d{3})\b(?!\.\d)', r'\1{,}\2', latex_str)
        mathml = latex2mathml_convert(latex_str)
        omml = mathml2omml_convert(mathml)
        omml = omml.replace('</m:groupChr><m:e>', '</m:groupChrPr><m:e>')
        if 'xmlns:m' not in omml:
            omml = omml.replace('<m:oMath', f'<m:oMath xmlns:m="{NS_M}" xmlns:w="{NS_W}"', 1)
        el = parse_xml(omml)

        for limupp in el.xpath('.//m:limUpp', namespaces=NS):
            lim_text = ''.join(limupp.xpath('./m:lim//m:t/text()', namespaces=NS))
            if lim_text.strip() in ('―', '¯', '—', 'ˉ', '\u00AF', '\u02C9', '\u2014', '\u2015'):
                bar = etree.Element(f'{{{NS_M}}}bar')
                barPr = etree.SubElement(bar, f'{{{NS_M}}}barPr')
                pos = etree.SubElement(barPr, f'{{{NS_M}}}pos')
                pos.set(f'{{{NS_M}}}val', 'top')
                ctrlPr = etree.SubElement(barPr, f'{{{NS_M}}}ctrlPr')
                ctrlPr.append(make_w_rpr(pt_size, bold=bold))
                e_node = limupp.find(f'{{{NS_M}}}e')
                bar.append(e_node)
                limupp.getparent().replace(limupp, bar)

        for narypr in el.xpath('.//m:naryPr', namespaces=NS):
            limloc = narypr.find(f'{{{NS_M}}}limLoc')
            if limloc is None:
                limloc = etree.SubElement(narypr, f'{{{NS_M}}}limLoc')
            limloc.set(f'{{{NS_M}}}val', 'subSup')

        for m_el in el.xpath('.//m:m', namespaces=NS):
            if m_el.find(f'{{{NS_M}}}mPr') is None:
                first_mr = m_el.find(f'{{{NS_M}}}mr')
                col_cnt = len(first_mr.findall(f'{{{NS_M}}}e')) if first_mr is not None else 2
                mpr = etree.Element(f'{{{NS_M}}}mPr')
                mcs = etree.SubElement(mpr, f'{{{NS_M}}}mcs')
                mc = etree.SubElement(mcs, f'{{{NS_M}}}mc')
                mcpr = etree.SubElement(mc, f'{{{NS_M}}}mcPr')
                cnt = etree.SubElement(mcpr, f'{{{NS_M}}}count')
                cnt.set(f'{{{NS_M}}}val', str(col_cnt))
                jc = etree.SubElement(mcpr, f'{{{NS_M}}}mcJc')
                jc.set(f'{{{NS_M}}}val', 'left')
                m_el.insert(0, mpr)

        # Convert ceiling pairs (⌈ ... ⌉) into expandable Word OMML delimiters (<m:d>)
        for parent in list(el.xpath('.//*[m:r[m:t="⌈"]]', namespaces=NS)):
            children = list(parent)
            i = 0
            while i < len(children):
                ch = children[i]
                if ch.tag == f'{{{NS_M}}}r' and ch.findtext(f'{{{NS_M}}}t') == '⌈':
                    j = i + 1
                    while j < len(children) and not (
                        children[j].tag == f'{{{NS_M}}}r' and children[j].findtext(f'{{{NS_M}}}t') == '⌉'
                    ):
                        j += 1
                    if j < len(children):
                        d_el = etree.Element(f'{{{NS_M}}}d')
                        dPr = etree.SubElement(d_el, f'{{{NS_M}}}dPr')
                        beg = etree.SubElement(dPr, f'{{{NS_M}}}begChr')
                        beg.set(f'{{{NS_M}}}val', '⌈')
                        end = etree.SubElement(dPr, f'{{{NS_M}}}endChr')
                        end.set(f'{{{NS_M}}}val', '⌉')
                        ctrlPr = etree.SubElement(dPr, f'{{{NS_M}}}ctrlPr')
                        ctrlPr.append(make_w_rpr(pt_size, bold=bold))
                        e_box = etree.SubElement(d_el, f'{{{NS_M}}}e')
                        for k in range(i + 1, j):
                            e_box.append(children[k])
                        parent.insert(i, d_el)
                        parent.remove(ch)
                        parent.remove(children[j])
                        children = list(parent)
                        continue
                i += 1

        all_mr = list(el.xpath('.//m:r', namespaces=NS))
        for mr in all_mr:
            mt = mr.find(f'{{{NS_M}}}t')
            if mt is None:
                continue
            txt = mt.text or ''
            if txt in ('·', '\u00B7', '\u22C5'):
                mrpr = mr.find(f'{{{NS_M}}}rPr')
                if mrpr is None:
                    mrpr = etree.Element(f'{{{NS_M}}}rPr')
                    mr.insert(0, mrpr)
                sty = mrpr.find(f'{{{NS_M}}}sty')
                if sty is None:
                    sty = etree.SubElement(mrpr, f'{{{NS_M}}}sty')
                sty.set(f'{{{NS_M}}}val', 'p')
                mt.text = '\u22C5'
                continue
            if txt == '' and mr.find(f'{{{NS_M}}}rPr') is None:
                mt.text = '\u2009'
                mt.set(XML_SPACE, 'preserve')
                mrpr = etree.Element(f'{{{NS_M}}}rPr')
                sty = etree.SubElement(mrpr, f'{{{NS_M}}}sty')
                sty.set(f'{{{NS_M}}}val', 'p')
                mr.insert(0, mrpr)
                continue
            if txt == ':':
                mrpr = mr.find(f'{{{NS_M}}}rPr')
                if mrpr is not None:
                    sty = mrpr.find(f'{{{NS_M}}}sty')
                    if sty is not None:
                        sty.set(f'{{{NS_M}}}val', 'p')
                mt.text = ':\u2009'
                mt.set(XML_SPACE, 'preserve')
            elif txt == ',':
                prev = mr.getprevious()
                nxt = mr.getnext()
                prev_txt = prev.findtext(f'{{{NS_M}}}t') if (prev is not None and prev.tag == f'{{{NS_M}}}r') else ''
                nxt_txt = nxt.findtext(f'{{{NS_M}}}t') if (nxt is not None and nxt.tag == f'{{{NS_M}}}r') else ''
                is_thousands = bool(re.search(r'\d$', prev_txt or '') and re.match(r'^\d{3}\b', nxt_txt or ''))
                if not is_thousands and nxt_txt not in (')', ']', '}', '', '\u2009'):
                    mt.text = ',\u2009'
                    mt.set(XML_SPACE, 'preserve')
            elif '\u00A0' in txt or ' ' in txt:
                mt.set(XML_SPACE, 'preserve')

        for mr in el.xpath('.//m:r', namespaces=NS):
            mrpr = mr.find(f'{{{NS_M}}}rPr')
            wrpr = make_w_rpr(pt_size, bold=bold)
            if mrpr is not None:
                mrpr.addnext(wrpr)
            else:
                mr.insert(0, wrpr)
        return el

    INLINE_TAG_RE = re.compile(r'<i>(.*?)</i>|<b>(.*?)</b>|\^\{([^}]+)\}|_\{([^}]+)\}')

    def emit_plain_and_tags(p, seg, pt_size=None, bold=False, italic=False, is_code=False, code_pt_delta=0.8, superscript=False, subscript=False, no_smallcaps=False):
        if not seg:
            return
        if is_code:
            r = p.add_run(seg)
            r.font.name = 'Consolas'
            r.bold = bold
            r.italic = False
            if superscript:
                r.font.superscript = True
            if subscript:
                r.font.subscript = True
            base_sz = pt_size if pt_size is not None else 10.0
            r.font.size = Pt(max(5.2, base_sz - code_pt_delta))
            r._element.get_or_add_rPr().append(parse_xml(f'<w:noProof {nsdecls("w")}/>'))
            return

        pos = 0
        for m in INLINE_TAG_RE.finditer(seg):
            if m.start() > pos:
                chunk = seg[pos:m.start()]
                r = p.add_run(chunk)
                r.bold = bold
                r.italic = italic
                if superscript:
                    r.font.superscript = True
                if subscript:
                    r.font.subscript = True
                if pt_size is not None:
                    r.font.size = Pt(pt_size)
                if no_smallcaps:
                    r._element.get_or_add_rPr().append(parse_xml(f'<w:smallCaps {nsdecls("w")} w:val="0"/>'))
            if m.group(1) is not None:
                emit_plain_and_tags(p, m.group(1), pt_size=pt_size, bold=bold, italic=True, superscript=superscript, subscript=subscript, no_smallcaps=True)
            elif m.group(2) is not None:
                emit_plain_and_tags(p, m.group(2), pt_size=pt_size, bold=True, italic=italic, superscript=superscript, subscript=subscript, no_smallcaps=no_smallcaps)
            elif m.group(3) is not None:
                emit_plain_and_tags(p, m.group(3), pt_size=pt_size, bold=bold, italic=italic, superscript=True, subscript=False, no_smallcaps=no_smallcaps)
            elif m.group(4) is not None:
                emit_plain_and_tags(p, m.group(4), pt_size=pt_size, bold=bold, italic=italic, superscript=False, subscript=True, no_smallcaps=no_smallcaps)
            pos = m.end()
        if pos < len(seg):
            r = p.add_run(seg[pos:])
            r.bold = bold
            r.italic = italic
            if superscript:
                r.font.superscript = True
            if subscript:
                r.font.subscript = True
            if pt_size is not None:
                r.font.size = Pt(pt_size)
            if no_smallcaps:
                r._element.get_or_add_rPr().append(parse_xml(f'<w:smallCaps {nsdecls("w")} w:val="0"/>'))

    def append_latex_text(p, text, pt_size=None, math_pt_size=10.0, bold=False, italic=False, code_pt_delta=0.8):
        if not text:
            return
        code_parts = re.split(r'(`[^`]+`)', text)
        for cp in code_parts:
            if not cp:
                continue
            if cp.startswith('`') and cp.endswith('`') and len(cp) >= 2:
                emit_plain_and_tags(
                    p, cp[1:-1], pt_size=(pt_size if pt_size is not None else math_pt_size),
                    bold=bold, italic=False, is_code=True, code_pt_delta=code_pt_delta
                )
            else:
                parts = re.split(r'(?<!\\)\$(.+?)(?<!\\)\$', cp)
                for idx, part in enumerate(parts):
                    if not part:
                        continue
                    if idx % 2 == 0:
                        if '$' in part.replace(r'\$', ''):
                            raise ValueError(f"Unmatched $ in text segment: {part}")
                        clean = part.replace(r'\$', '$')
                        emit_plain_and_tags(p, clean, pt_size=pt_size, bold=bold, italic=italic, is_code=False)
                    else:
                        p._p.append(latex_to_omml_el(part, pt_size=math_pt_size, bold=False))

    def add_p(text, style='Text', align=None, space_after=1.0, space_before=0, bold=False, italic=False, keep_with_next=False, math_pt=None, pt_size=None, line_spacing=0.975, first_line_indent=None):
        p = doc.add_paragraph(style=style)
        if math_pt is None:
            if style == 'Figure Caption':
                math_pt = 8.0
            elif style == 'Table Title':
                math_pt = 8.0
            elif style == 'footnote text':
                math_pt = 7.6
            elif style in ('Abstract', 'IndexTerms'):
                math_pt = 9.0
            else:
                math_pt = 10.0
        append_latex_text(p, text, pt_size=pt_size, math_pt_size=math_pt, bold=bold, italic=italic)
        if align is not None:
            p.alignment = align
        if first_line_indent is not None:
            p.paragraph_format.first_line_indent = Pt(first_line_indent)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.line_spacing = line_spacing
        if keep_with_next:
            p.paragraph_format.keep_with_next = True
        return p

    def add_rich_p(runs, style='Text', align=None, space_after=1.1, space_before=0, math_pt=None, line_spacing=0.975):
        p = doc.add_paragraph(style=style)
        if math_pt is None:
            math_pt = 9.0 if style in ('Abstract', 'IndexTerms') else 10.0
        for item in runs:
            text = item[0]
            bold = item[1] if len(item) > 1 else False
            italic = item[2] if len(item) > 2 else False
            append_latex_text(p, text, pt_size=None, math_pt_size=math_pt, bold=bold, italic=italic)
        if align is not None:
            p.alignment = align
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.line_spacing = line_spacing
        return p

    def add_bullet_p(bold_prefix, text, style='Text', space_after=0.75, space_before=0):
        p = doc.add_paragraph(style=style)
        p.paragraph_format.left_indent = Inches(0.12)
        p.paragraph_format.first_line_indent = Inches(-0.12)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.line_spacing = 0.975
        r_b = p.add_run("• ")
        r_b.bold = True
        if bold_prefix:
            append_latex_text(p, bold_prefix, math_pt_size=10.0, bold=True)
        append_latex_text(p, text, math_pt_size=10.0)
        return p

    def add_num_list_p(num_str, bold_prefix, text, style='Text', space_after=0.75, space_before=0, keep_together=False):
        p = doc.add_paragraph(style=style)
        p.paragraph_format.left_indent = Inches(0.12)
        p.paragraph_format.first_line_indent = Inches(-0.12)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.line_spacing = 0.975
        if keep_together:
            p.paragraph_format.keep_together = True
        r_n = p.add_run(num_str + " ")
        r_n.bold = True
        if bold_prefix:
            append_latex_text(p, bold_prefix, math_pt_size=10.0, bold=True)
        append_latex_text(p, text, math_pt_size=10.0)
        return p

    # Flush-left equations with right-aligned numbering matching Paper_PT_Matching_IEEE_v2.pdf & Paper 1
    def add_math_equation(latex_str, eq_num=None, space_before=2.0, space_after=2.0, right_in=3.50, math_pt=9.6):
        p = doc.add_paragraph(style='Equation')
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.left_indent = Pt(0)
        p.paragraph_format.first_line_indent = Pt(0)
        p.paragraph_format.tab_stops.clear_all()
        p.paragraph_format.tab_stops.add_tab_stop(Inches(right_in), WD_TAB_ALIGNMENT.RIGHT)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.0
        p._p.append(latex_to_omml_el(latex_str, pt_size=math_pt))
        if eq_num is not None:
            r_num = p.add_run(f'\t({eq_num})')
            r_num.font.name = 'Times New Roman'
            r_num.font.size = Pt(10.0)
        return p

    def add_full_width_figure(image_path, caption_text, width_in=5.90):
        p_anchor = doc.add_paragraph(style='Normal')
        p_anchor.paragraph_format.space_before = Pt(0)
        p_anchor.paragraph_format.space_after = Pt(0)
        p_anchor.paragraph_format.line_spacing = 0.2
        r_a = p_anchor.add_run("")
        r_a.font.size = Pt(1.0)

        sectPr_2col = parse_xml(r'''
        <w:sectPr {} >
            <w:headerReference w:type="default" r:id="rId22"/>
            <w:type w:val="continuous"/>
            <w:pgSz w:w="12240" w:h="15840" w:code="1"/>
            <w:pgMar w:top="1008" w:right="936" w:bottom="1008" w:left="936" w:header="432" w:footer="432" w:gutter="0"/>
            <w:cols w:num="2" w:space="288"/>
        </w:sectPr>
        '''.format(nsdecls('w', 'r')))
        p_anchor._p.get_or_add_pPr().append(sectPr_2col)

        p_img = doc.add_paragraph(style='Normal')
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(1.5)
        p_img.paragraph_format.space_after = Pt(1.0)
        p_img.paragraph_format.keep_with_next = True
        r_img = p_img.add_run()
        r_img.add_picture(image_path, width=Inches(width_in))

        p_cap = doc.add_paragraph(style='Figure Caption')
        p_cap.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_cap.paragraph_format.space_before = Pt(1.0)
        p_cap.paragraph_format.space_after = Pt(1.5)
        append_latex_text(p_cap, caption_text, pt_size=8.0, math_pt_size=8.0, italic=True, code_pt_delta=0.5)
        for r_cap in p_cap.runs:
            if r_cap.font.name != 'Consolas':
                r_cap.font.name = 'Times New Roman'

        sectPr_1col = parse_xml(r'''
        <w:sectPr {} >
            <w:headerReference w:type="default" r:id="rId22"/>
            <w:type w:val="continuous"/>
            <w:pgSz w:w="12240" w:h="15840" w:code="1"/>
            <w:pgMar w:top="1008" w:right="936" w:bottom="1008" w:left="936" w:header="432" w:footer="432" w:gutter="0"/>
            <w:cols w:num="1"/>
        </w:sectPr>
        '''.format(nsdecls('w', 'r')))
        p_cap._p.get_or_add_pPr().append(sectPr_1col)
        return p_cap

    def build_table(headers, rows, col_widths, highlight_rows=None, font_pt=5.5, left_cols=(0,)):
        highlight_rows = set(highlight_rows or [])
        tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tblPr = tbl._tbl.tblPr
        tblPr.append(parse_xml(
            f'<w:tblCellMar {nsdecls("w")}>'
            f'<w:top w:w="16" w:type="dxa"/><w:left w:w="18" w:type="dxa"/>'
            f'<w:bottom w:w="16" w:type="dxa"/><w:right w:w="18" w:type="dxa"/>'
            f'</w:tblCellMar>'
        ))
        tblPr.append(parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>'
            f'<w:bottom w:val="single" w:sz="8" w:space="0" w:color="334155"/>'
            f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
            f'<w:left w:val="none"/><w:right w:val="none"/><w:insideV w:val="none"/>'
            f'</w:tblBorders>'
        ))
        tbl.rows[0]._tr.get_or_add_trPr().append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
        tbl.rows[0]._tr.get_or_add_trPr().append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

        for c_idx, h_text in enumerate(headers):
            cell = tbl.cell(0, c_idx)
            cell.width = col_widths[c_idx]
            p = cell.paragraphs[0]
            p.text = ""
            append_latex_text(p, h_text, pt_size=font_pt, math_pt_size=font_pt, bold=True, code_pt_delta=0.2)
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx in left_cols else WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0.5)
            p.paragraph_format.space_after = Pt(0.5)
            p.paragraph_format.line_spacing = 0.96
            p.paragraph_format.keep_with_next = True
            p._p.get_or_add_pPr().append(parse_xml(f'<w:suppressAutoHyphens {nsdecls("w")}/>'))
            cell._tc.get_or_add_tcPr().append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="EFF6FF"/>'))

        for r_idx, row in enumerate(rows):
            tbl.rows[r_idx + 1]._tr.get_or_add_trPr().append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
            is_hi = r_idx in highlight_rows
            for c_idx, val in enumerate(row):
                cell = tbl.cell(r_idx + 1, c_idx)
                cell.width = col_widths[c_idx]
                p = cell.paragraphs[0]
                p.text = ""
                append_latex_text(p, val, pt_size=font_pt, math_pt_size=font_pt, bold=is_hi, code_pt_delta=0.2)
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx in left_cols else WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(0.5)
                p.paragraph_format.space_after = Pt(0.5)
                p.paragraph_format.line_spacing = 0.96
                p._p.get_or_add_pPr().append(parse_xml(f'<w:suppressAutoHyphens {nsdecls("w")}/>'))
                if r_idx < len(rows) - 1:
                    p.paragraph_format.keep_with_next = True
                if is_hi:
                    cell._tc.get_or_add_tcPr().append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="F8FAFC"/>'))
        return tbl

    # ==========================================
    # TITLE & AUTHORS (Single-Column Full Span — Exact Match with Paper 1)
    # ==========================================
    p_title = add_p(
        "Design and Empirical Evaluation of an Event-Driven Outbox and CQRS Architecture for High\u2011Concurrency Courier Logistics",
        style='Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_after=3.5
    )
    p_title._p.get_or_add_pPr().append(parse_xml(f'<w:suppressAutoHyphens {nsdecls("w")}/>'))

    add_p(
        "Võ Văn Tú Tài, Trần Tấn Tài, and Huỳnh Nam",
        style='Authors', align=WD_ALIGN_PARAGRAPH.CENTER, space_after=1
    )
    add_p(
        "Faculty of Information System, Industrial University of Ho Chi Minh City",
        style='Normal', align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0.5, italic=True, pt_size=8.6
    )
    add_p(
        "22655911.tai@student.iuh.edu.vn, 22727771.tai@student.iuh.edu.vn",
        style='Normal', align=WD_ALIGN_PARAGRAPH.CENTER, space_after=5.0, italic=True, pt_size=8.4
    )

    p_last_meta = doc.paragraphs[-1]
    sectPr_meta = parse_xml(r'''
    <w:sectPr {} >
        <w:headerReference w:type="default" r:id="rId22"/>
        <w:type w:val="continuous"/>
        <w:pgSz w:w="12240" w:h="15840" w:code="1"/>
        <w:pgMar w:top="1008" w:right="936" w:bottom="1008" w:left="936" w:header="432" w:footer="432" w:gutter="0"/>
        <w:cols w:num="1"/>
    </w:sectPr>
    '''.format(nsdecls('w', 'r')))
    p_last_meta._p.get_or_add_pPr().append(sectPr_meta)

    # ==========================================
    # ABSTRACT & INDEX TERMS
    # ==========================================
    abs_runs = [
        ("Abstract— ", True, True),
        (r"Express courier platforms endure intense burst write amplification across barcode scans, waybill transitions, and real-time analytics. Shared relational schemas suffer row-level lock contention under concurrent load, while naive dual-writes risk losing domain events on process crashes. We design and empirically evaluate the Nexus Event-Driven Outbox and Command Query Responsibility Segregation (CQRS) architecture built on NestJS 10 microservices, isolated PostgreSQL 16 databases, and RabbitMQ 3.13. Our implementation integrates: (1) a dual-layer idempotency guard pairing fast-path key lookup with PostgreSQL `P2002` unique-constraint recovery; (2) persistent outbox relays contrasting HTTP Management API publishing against native AMQP `ConfirmChannel` transport; (3) a deterministic 19-state shipment finite-state machine (FSM) whitelist; (4) decoupled tracking and 8-way KPI read projections; and (5) multi-tier Dead-Letter TTL retry queues (`10 s` → `1 min` → `.dlq`) governed under a structured 5-level human-control scale classifying operational governance rather than psychometric user ratings. Live benchmarks on the running cluster show 7.52× write throughput scaling to 783.36 req/s (<i>c</i> = 25), a 65.59% reduction in <i>p</i>_{95} tracking read tail latency under <i>c</i> = 50 concurrent writers (15.73 vs. 45.73 ms, <i>p</i> = 4.83 × 10^{−67}), a 28.25× publish speedup in a pipelined batch-50 AMQP probe (2.84× sequential relay), 150/150 exact-once writes across 500 duplicate HTTP calls, 60/60 (100.0%; 95% CI [94.04%, 100.0%]) FSM invariant preservation against out-of-order attacks, and 5/5 ([47.82%, 100.0%]) self-healing at 10.36 s alongside 5/5 poison quarantine to `.dlq`, while exposing three active code findings (`F1`–`F3`) with targeted engineering remediations.", False, False)
    ]
    add_rich_p(abs_runs, style='Abstract', align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=2.0)

    idx_runs = [
        ("Index Terms— ", True, True),
        ("Event-Driven Architecture, Transactional Outbox Pattern, Command Query Responsibility Segregation (CQRS), Idempotency, RabbitMQ Dead-Letter Exchange, 5-Level Human-Control Scale, Courier Logistics.", False, False)
    ]
    add_rich_p(idx_runs, style='IndexTerms', space_after=3.6)

    # ==========================================
    # I. INTRODUCTION
    # ==========================================
    add_p("INTRODUCTION", style='Heading 1', space_before=2.8, space_after=1.1)
    add_p(r"Modern express courier networks generate continuous streams of domain events across sorting hubs, handheld Personal Digital Assistants (PDAs), dispatch consoles, and public tracking portals. During promotional surges, concurrent inbound, outbound, and delivery scans create sharp write bursts alongside latency-sensitive read queries from merchants and recipients [1], [5]. Consolidating command ingestion, multi-table state validation, and multi-dimensional KPI rollups within one shared ACID transaction induces row-level lock contention, pool saturation, and tail-latency spikes.", style='Text')
    add_p(r"Decomposing the platform into autonomous bounded-context microservices avoids single-schema coupling [6], [7], yet introduces four practical data management hazards examined empirically in our graduation thesis implementation:", style='Text')
    add_num_list_p("1)", "Dual-Write Consistency Anomaly: ", r"Updating a service's local database and publishing to a broker outside a coordinated persistence flow risks permanently lost events or phantom downstream states on process crashes [1].")
    add_num_list_p("2)", "Outbox Dwell & Transport Bottlenecks: ", r"While the Transactional Outbox guarantees at-least-once emission, polling intervals (<i>T</i>_{poll}), batch caps (<i>B</i>), and HTTP Management API serialization dominate convergence lag.")
    add_num_list_p("3)", "Retry Storms & Consumer Race Conditions: ", r"Unstable wireless PDA links emit sequential and parallel duplicate writes, whereas asynchronous broker delivery can deliver child scan events before parent waybills materialize.")
    add_num_list_p("4)", "Out-of-Order State Skew & Operator Control: ", r"Delayed or reordered events reaching terminal shipments (`DELIVERED`, `CANCELLED`) can regress states unless guarded deterministically alongside clear human escalation for dead-letter faults [16].")

    add_p(r"Without heavyweight two-phase commit (2PC) or Kafka cluster overhead, we evaluate the live Nexus Event-Driven Outbox and CQRS platform across three research questions: (RQ1) How much does Outbox + CQRS decoupling improve write scaling and isolate public tracking read tail latency (<i>p</i>_{95}) compared with a synchronized RDBMS baseline? (RQ2) Which pipeline stage dominates cross-database convergence lag, and how much faster is native AMQP `ConfirmChannel` batching than sequential HTTP publishing? (RQ3) How reliably do dual-layer idempotency, the 19-state FSM whitelist, and 5-level human-control TTL/DLQ governance preserve integrity—and what active code defects surface under faults?", style='Text')

    # ==========================================
    # II. RELATED WORK
    # ==========================================
    add_p("RELATED WORK", style='Heading 1', space_before=2.8, space_after=1.1)
    add_p(r"<i>Distributed Data Management & Microservices:</i> The CAP theorem [3] and PACELC formulation [2] frame trade-offs between strong consistency and low-latency availability, motivating BASE workflows [4]. Empirical studies by Laigner et al. [5] show that database-per-service decomposition [6], [7] shifts consistency burdens from SQL engines into messaging handlers, requiring strict verification of idempotency, single-writer ownership, and asynchronous fault handling.", style='Text')
    add_p(r"<i>Transactional Outbox & Message Brokers:</i> Hohpe and Woolf [8] and Richardson [1] establish the Transactional Outbox and Polling Publisher patterns to prevent dual-write event loss without distributed XA locks [9], [15]. While partitioned logs such as Apache Kafka [10], [11] target high-volume replay, AMQP brokers like RabbitMQ [12] fit polyglot service backbones via flexible topic routing and native Dead-Letter Exchange (DLX) TTL queues.", style='Text')
    add_p(r"<i>CQRS, Idempotency & Ordering Safety:</i> CQRS [13], [17] isolates write commands from denormalized read views optimized for point lookups and analytics. Helland [14] emphasizes idempotent receivers keyed by unique operation tokens, while Lamport [16] highlights logical ordering hazards across asynchronous messages. Rather than relying on abstract queue simulators, this work audits our live NestJS + PostgreSQL 16 + RabbitMQ 3.13 cluster under disclosed synthetic bursts and fault workloads, surfacing active codebase vulnerabilities (`F1`–`F3`) and targeted engineering fixes.", style='Text')

    # ==========================================
    # III. SYSTEM ARCHITECTURE AND CORE MECHANISMS
    # ==========================================
    add_p("SYSTEM ARCHITECTURE AND CORE MECHANISMS", style='Heading 1', space_before=2.8, space_after=1.1)
    add_p("Bounded-Context Topology and Service Separation", style='Heading 2', space_before=2.0, space_after=0.7)
    add_p(r"As shown in Fig. 1 and Table I, the Nexus backend deploys 12 isolated PostgreSQL 16 domain databases across NestJS 10 TypeScript microservices, centering this study on four core event-driven contexts alongside companion dispatch, manifest, delivery, and payment stores: `ScanService` (`scan_db`), `ShipmentService` (`shipment_db`), `TrackingService` (`tracking_db`), and `ReportingService` (`reporting_db`). Single-writer ownership is strictly enforced (`scan_db` owns `CurrentLocation`; `shipment_db` holds authoritative `Shipment` state; `tracking_db` serves public reads; `reporting_db` maintains 8-way KPI rollups), while Redis 7 in the gateway BFF is scoped strictly to WebSocket chat pub/sub with zero role in outbox or CQRS. Services exchange persistent events (`delivery_mode = 2`) over RabbitMQ's durable `domain.events` topic exchange (65 active queue bindings).", style='Text')

    add_p("Table I", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2.2, space_after=0.35, keep_with_next=True)
    add_p(r"Nexus Bounded-Context Services, Schema Ownership, and Messaging Contracts", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=1.0, keep_with_next=True)
    t0_headers = ["Service / DB", "Owned State / Model", "Relay / Consumer Mode", "Safety & Dedup Contract"]
    t0_rows = [
        ["`ScanService`\n(`scan_db`)", "`ScanEvent`, `OutboxEvent`,\n`CurrentLocation`", "HTTP Mgmt Relay\n(<i>T</i>_{poll} = 1,000 ms, <i>B</i> = 50)", "`IdempotencyRecord`\n+ `ScanEvent` `P2002`"],
        ["`ShipmentService`\n(`shipment_db`)", "`Shipment` (19-state FSM),\n`outbox_events`", "AMQP Confirm Outbox +\nPush (`noAck: false`)", "`VALID_TRANSITIONS`;\n`.retry.10s`/`.1m` → `.dlq`"],
        ["`TrackingService`\n(`tracking_db`)", "`TimelineEvent`, `TrackingIndex`,\n`TrackingCurrent`", "AMQP Push Consumer\n(`tracking-service.q`)", "`TimelineEvent.eventId`\n`P2002` deduplication"],
        ["`ReportingService`\n(`reporting_db`)", "`KpiDaily`, `KpiMonthly` (8-way),\n`AggregationJob`", "HTTP Pull (1,000 ms, <i>B</i> = 20,\n`ack_requeue_false`)", "`AggregationJob.jobKey`\n`P2002` deduplication"],
        ["`CoupledSyncBaseline`\n(shared PG DB)", "Monolithic SQL tables +\n8-way KPI row counters", "Single-TX SQL ACID\n(PG pool = 21)", "Synchronous row locks +\nmulti-table SQL JOINs"]
    ]
    cw0 = [Inches(0.80), Inches(0.84), Inches(0.90), Inches(0.96)]
    build_table(t0_headers, t0_rows, cw0, highlight_rows={0, 1}, font_pt=5.5)

    add_full_width_figure(
        fig1_path,
        r"Fig. 1. Architecture of the live Nexus Event-Driven Outbox and CQRS pipeline across isolated PostgreSQL 16 databases and RabbitMQ 3.13, illustrating ingress and `ScanService` dual-layer deduplication, outbox relays and TTL/DLQ recovery, `ShipmentService` 19-state FSM governance, decoupled CQRS projections, and Level-5 operator control alongside proposed code-audit remediations (`F1`–`F3`).",
        width_in=5.55
    )

    add_p("Dual-Layer Idempotency and Persistent Outbox Writes", style='Heading 2', space_before=2.0, space_after=0.7)
    add_p(r"Before persisting an inbound scan, `ScanService` runs a synchronous HTTP lock check against `ShipmentService` (`assertShipmentNotLocked`), rejecting locked parcels (HTTP 400) unless an authorized audit override (`INBOUND` with note `INVENTORY_CHECK` or Vietnamese 'Kiểm tồn kho') or active reverse-logistics transit (`RETURN_STARTED`) applies. Once permitted, the handler scopes the key as `flow:idempotencyKey` and executes two-tier deduplication:", style='Text')
    add_num_list_p("1)", "Layer 1 — Fast Sequential Lookup: ", r"Queries `IdempotencyRecord` by `scopedIdempotencyKey` and returns the cached JSON snapshot immediately (1.825 ms median) for sequential PDA retries.")
    add_num_list_p("2)", "Layer 2 — Parallel Race Recovery (`P2002`): ", r"Inserts into `ScanEvent` guarded by a unique constraint on `idempotencyKey`. When concurrent duplicate requests bypass Layer 1 simultaneously, PostgreSQL rejects losing inserts with Prisma unique error `P2002`, prompting `createIfAbsent()` to fetch and replay the winner's committed record.")
    add_num_list_p("3)", "Outbox Persistence: ", r"For each new scan, the service upserts `CurrentLocation`, appends a `PENDING` `OutboxEvent`, saves the idempotent snapshot, and records `OpsAuditLog` before returning HTTP 201 (wrapping `ScanEvent` + `OutboxEvent` inside `prisma.$transaction` is noted under finding `F3` in Section V).")

    add_p("Outbox Relays and Propagation Lag Formulation", style='Heading 2', space_before=2.0, space_after=0.7)
    add_p(r"Pending outbox records drain periodically every <i>T</i>_{poll} = 1,000 ms in batches up to <i>B</i> = 50 rows. Notably, our codebase contrasts two relay designs: `ScanOutboxRelayService` publishes sequentially via RabbitMQ's HTTP Management API, whereas `ShipmentOutboxRelayService` keeps a persistent TCP AMQP `ConfirmChannel` flushing batch entries sequentially [12]. Client-to-projection visibility lag decomposes linearly across four stages:", style='Text')

    add_math_equation(r'L_{\text{E2E}} = L_{\text{ingest}} + L_{\text{dwell}} + L_{\text{broker}} + L_{\text{cons}}', eq_num='1', math_pt=9.6)
    add_p(r"where <i>L</i>_{ingest} is HTTP command validation and ingest commit latency, <i>L</i>_{dwell} is outbox queue wait prior to broker confirmation, <i>L</i>_{broker} is broker-to-consumer transport delay, and <i>L</i>_{cons} denotes downstream consumer commit time (with post-commit convergence defined as <i>L</i>_{conv} = <i>L</i>_{dwell} + <i>L</i>_{broker} + <i>L</i>_{cons}). Because scans arrive asynchronously between periodic ticks, expected outbox dwell follows", style='Text', first_line_indent=0)

    add_math_equation(r'L_{\text{dwell}} \approx \frac{T_{\text{poll}}}{2} + L_{\text{batch}}', eq_num='2', math_pt=9.6)
    add_p(r"where <i>T</i>_{poll} = 1,000 ms yields a 500 ms midpoint delay and <i>L</i>_{batch} denotes intra-batch serialization overhead (≈ 32 ms), closely matching the measured 531.96 ms mean dwell. When concurrent bursts exceed capacity (<i>N</i>_{0} > <i>B</i>), outbox draining quantizes across multiple polling intervals:", style='Text', first_line_indent=0)

    add_math_equation(r'T_{\text{drain}}(N_0) \approx \left\lceil \frac{N_0}{B} \right\rceil T_{\text{poll}}', eq_num='3', math_pt=9.6)
    add_p(r"where <i>N</i>_{0} is the concurrent burst volume and <i>B</i> = 50 is the batch cap (predicting 4 ticks ≈ 3.8–4.0 s for <i>N</i>_{0} = 200 writes).", style='Text', first_line_indent=0)

    add_p("19-State Authority FSM, CQRS Views, and 5-Level Control", style='Heading 2', space_before=2.0, space_after=0.7)
    add_p(r"Downstream, `ShipmentService` consumes events via AMQP push (`noAck: false`) and guards status changes inside `ShipmentStateMachine` using an explicit `VALID_TRANSITIONS` whitelist spanning 19 lifecycle statuses and 15 consumed domain event types from `CREATED`. Three absorbing terminal states (`DELIVERED`, `RETURN_COMPLETED`, `CANCELLED`) permit only self-idempotent replays, rejecting backward transitions. Independently, `TrackingService` deduplicates `TimelineEvent` (`P2002` on `eventId`) and updates `TrackingCurrent`/`TrackingIndex`, while `ReportingService` polls via HTTP (1,000 ms, <i>B</i> = 20, `ack_requeue_false`) into 8-way KPI rollups (`KpiDaily`/`KpiMonthly` across `{courier, hub, zone}` × `ALL`) keyed by `AggregationJob.jobKey`. Transient errors invoke `moveToRetryOrDlq()`, ACKing the main queue immediately so healthy traffic never stalls while routing retries via `x-retry-count` across `.retry.10s` (10 s TTL), `.retry.1m` (60 s TTL), and `.dlq` (count ≥ 2) under a 5-level human-control scale categorizing system authority rather than psychometric user ratings.", style='Text')

    # ==========================================
    # IV. EXPERIMENTAL SETUP, SYNTHETIC WORKLOAD & RESULTS
    # ==========================================
    add_p("EXPERIMENTAL SETUP, SYNTHETIC WORKLOAD & RESULTS", style='Heading 1', space_before=2.8, space_after=1.1)
    add_p("Cluster Testbed, Synthetic Workload Criteria, and Baseline", style='Heading 2', space_before=2.0, space_after=0.7)
    add_p(r"Experiments executed live against the running microservice cluster on an Apple M4 host (10-core CPU, 16 GB RAM, macOS 15.8), Node.js v26.0.0, PostgreSQL `16-alpine` (`max_connections = 100`), and RabbitMQ `3.13-management-alpine`, restoring pre-test SQL snapshots post-run. An auxiliary synchronous baseline (`CoupledSyncBaseline`) shares the same PostgreSQL 16 engine (pool = 21, matching Prisma defaults) to execute lock checking, scan insert, timeline append, `TrackingCurrent` upsert, and 8-way `KpiDaily` updates inside one atomic SQL `BEGIN/COMMIT` transaction.", style='Text')
    add_p(r"Table II discloses every synthetic cohort generated by the benchmark suite: 220 seeded synthetic shipments (`333991000001..220`) distributed round-robin across 3 hubs (`HUB_HCM_01`, `HUB_DN_01`, `HUB_HN_01`), 3 zones (`SOUTH`, `CENTRAL`, `NORTH`), and 5 couriers (`C01..C05`), standardized at `1.5 kg`, `500,000 VND`, `GENERAL`, `STANDARD` (Exp 2A staggers 120 clean scans with 60–210 ms random gaps to avoid timer aliasing). Statistical uncertainty uses two-sided Mann–Whitney <i>U</i> tests, 10,000-resample bootstrap 95% CIs, and exact two-sided Clopper–Pearson 95% CIs.", style='Text')

    add_p("Table II", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2.2, space_after=0.35, keep_with_next=True)
    add_p(r"Synthetic Benchmark Workload and Fault-Injection Specification", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=1.0, keep_with_next=True)
    tsyn_headers = ["Exp ID", "Synthetic Pool / Volume", "Construction & Stagger Rules", "Measured Objective"]
    tsyn_rows = [
        ["Exp 1 / 1C", "100 parcels; 150/tier;\n<i>N</i> = 200 reads (25R / 50W)", "Round-robin 3 hubs × 5 couriers;\n50 background writers (`1C`)", "Write scaling crossover &\nCQRS read isolation (<i>p</i>_{95})"],
        ["Exp 2A / 2B\n& Exp 2C", "120 clean (`2A`); 200 burst\n(`2B`); 200 direct (`2C`)", "Random 60–210 ms stagger (`2A`);\n<i>c</i> = 50 burst; direct RMQ (`2C`)", "UUID E2E lag breakdown &\nHTTP vs. AMQP Confirm"],
        ["Exp 3 / 3C", "500 HTTP calls (150 keys);\n+50 RMQ dup frames", "100 fresh + 100 replay + 300 6×\nrace (<i>c</i> = 60) + RMQ inject", "L1/L2 `P2002` dedup &\nconsumer `ackmode` audit"],
        ["Exp 4A / 4B", "20 locked/terminal (`4A`);\n10 orphan faults (`4B`)", "60 OOO + 20 lock probes; 5 delay\n@3.09 s + 5 poison (`333993999*`)", "FSM terminal safety, lock\nTOCTOU & `.retry`/`.dlq`"]
    ]
    cwsyn = [Inches(0.58), Inches(0.88), Inches(1.04), Inches(1.00)]
    build_table(tsyn_headers, tsyn_rows, cwsyn, highlight_rows={2, 3}, font_pt=5.4)

    add_p("Concurrency Scaling and CQRS Read Isolation (RQ1)", style='Heading 2', space_before=2.0, space_after=0.7)
    add_p(r"Table III and Fig. 2(a)–(b) report write scaling across <i>c</i> ∈ {1, 10, 25, 50, 100} (100% HTTP `2xx` over 750 writes/system) and concurrent tracking read isolation (<i>N</i> = 200 queries at 25 concurrent readers under Idle vs. <i>c</i> = 50 background writers).", style='Text')

    add_p("Table III", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1.8, space_after=0.3, keep_with_next=True)
    add_p(r"Concurrency Scaling (Exp 1) and CQRS Read Isolation (Exp 1C) vs. Synchronous RDBMS Baseline", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0.8, keep_with_next=True)
    t1_headers = ["Tier / Condition", "Nexus\nrps", "Nexus\n<i>p</i>_{50}", "Nexus\n<i>p</i>_{95}", "Sync\nrps", "Sync\n<i>p</i>_{50}", "Sync\n<i>p</i>_{95}", "Gain & Mann–Whitney <i>p</i>"]
    t1_rows = [
        ["Write <i>c</i> = 1 (<i>n</i> = 150)", "104.2", "6.91", "19.96", "423.1", "1.89", "3.36", "Sync 4.1× (8.77 × 10^{−47})"],
        ["Write <i>c</i> = 10 (<i>n</i> = 150)", "727.3", "12.66", "21.41", "670.0", "8.38", "43.54", "+8.6% / -50.8% <i>p</i>_{95} (.00071)"],
        ["Write <i>c</i> = 25 (Peak)", "783.4", "29.52", "45.89", "597.6", "26.99", "108.59", "+31.1% / -57.7% <i>p</i>_{95} (.177 n.s.)"],
        ["Write <i>c</i> = 50 (<i>n</i> = 150)", "757.1", "62.07", "90.85", "598.7", "63.87", "136.22", "+26.5% / -33.3% <i>p</i>_{95} (.0118)"],
        ["Write <i>c</i> = 100 (<i>n</i> = 150)", "614.8", "156.8", "183.0", "582.4", "122.8", "190.3", "+5.6% / -3.8% <i>p</i>_{95} (.0105)"],
        ["Read Idle (25R)*", "—", "8.46", "33.70*", "—", "2.82", "8.50", "Sync faster (3.31 × 10^{−55})"],
        ["Read (25R / 50W)", "—", "13.03", "15.73", "—", "41.26", "45.73", "-65.59% <i>p</i>_{95} (4.83 × 10^{−67})"]
    ]
    cw1 = [Inches(0.74), Inches(0.28), Inches(0.27), Inches(0.29), Inches(0.28), Inches(0.27), Inches(0.29), Inches(1.08)]
    build_table(t1_headers, t1_rows, cw1, highlight_rows={2, 6}, font_pt=5.2)

    add_p(r"<i>Notes:</i> Latencies in ms; two-sided Mann–Whitney <i>U</i> tests over single-request latencies. *Idle Nexus <i>p</i>_{95} reflects cold TCP/Prisma pool warmup on early reads (mean 10.74 ± 7.33 ms idle vs. 12.60 ± 2.14 ms under write load).", style='footnote text', space_before=0.8, space_after=1.1, first_line_indent=0)
    add_p(r"Two regimes emerge in Fig. 2(a): (1) <i>Single-Thread Overhead</i> (<i>c</i> = 1): Coupled Sync runs faster (423.05 vs. 104.17 req/s; <i>p</i> = 8.77 × 10^{−47}) because `ScanService` calls HTTP `assertShipmentNotLocked` and executes seven Prisma steps. (2) <i>Lock-Contention Inversion</i> (<i>c</i> ≥ 10): Nexus scales 7.52× to 783.36 req/s (<i>c</i> = 25) while cutting write <i>p</i>_{95} tail latency by 57.7% (45.89 vs. 108.59 ms; <i>p</i>_{99} 60.84 vs. 175.53 ms)—note that the per-request median test at <i>c</i> = 25 is non-significant (<i>p</i> = 0.177) whereas <i>c</i> = 50 reaches <i>p</i> = 0.0118, while Coupled Sync plateaus near ~598 req/s (<i>p</i>_{99} = 233.19 ms, max = 243.06 ms at <i>c</i> = 100) due to shared `ALL|ALL|ALL` KPI counter row locks. Under <i>c</i> = 50 writers (Exp 1C, Fig. 2b), Sync joins degrade +38.45 ms in median latency (95% CI [37.89, 39.13] ms, <i>p</i> = 4.83 × 10^{−67}), whereas CQRS views shift only +4.57 ms (CI [4.18, 4.75] ms, <i>p</i> = 1.75 × 10^{−33}), achieving 65.59% lower <i>p</i>_{95} tail latency (15.73 vs. 45.73 ms) and 69.48% lower mean latency (<i>U</i> = 0.0, <i>p</i> = 4.83 × 10^{−67}).", style='Text')

    add_full_width_figure(
        fig2_path,
        r"Fig. 2. Measured telemetry across live Dockerized services: (a) Write throughput scaling (<i>c</i> ∈ {1..100}, <i>n</i> = 150/tier); (b) Tracking read latency distributions (5th–95th whiskers, <i>N</i> = 200 queries at 25 concurrent readers under Idle vs. <i>c</i> = 50 writers); and (c) Post-commit stage propagation ECDF (<i>N</i> = 120 joined scans).",
        width_in=6.00
    )

    add_p("Stage Propagation Lag & Transport Speedup (RQ2)", style='Heading 2', space_before=1.8, space_after=0.6)
    add_p(r"Correlating <i>N</i> = 120 clean synthetic events across databases via UUID `eventId` (Exp 2A, Table IV, Fig. 2c) shows Fast-Path HTTP Ingest finishes in 20.27 ms (95% bootstrap CI [19.52, 21.01] ms; <i>p</i>_{50} = 21.17 ms), while Outbox Polling Dwell averages 531.96 ms (CI [480.93, 581.24] ms; <i>p</i>_{95} = 970.45 ms)—closely matching Eq. (2) and representing 99.69% of mean post-commit Tracking convergence (99.98% of variance; ≈ 553.3 ms total client-to-view Eq. (1)). AMQP push delivery takes only 1.03 ms ([0.89, 1.18] ms) to `TrackingService` and 0.19 ms ([0.02, 0.36] ms) to `ShipmentStateMachine` (±1–3 ms container clock precision yields minor min clamping), whereas `ReportingService`'s HTTP `/get` pull adds 363.18 ms ([360.81, 365.63] ms; 895.14 ms [845.60, 942.71] post-commit E2E).", style='Text')

    add_p("Table IV", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1.8, space_after=0.3, keep_with_next=True)
    add_p(r"Stage Lag Decomposition (Exp 2A, <i>N</i> = 120) and Transport Micro-Benchmark (Exp 2C, <i>N</i> = 200)", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0.8, keep_with_next=True)
    t2_headers = ["Stage / Transport Channel", "<i>N</i>", "Mean [95% CI]", "SD", "<i>p</i>_{50}", "<i>p</i>_{95}", "Rate / Lag Share"]
    t2_rows = [
        ["Ingest HTTP ACK (<i>L</i>_{ingest})", "120", "20.27 [19.5, 21.0]", "4.16", "21.17", "25.50", "Client Write Edge"],
        ["Outbox Dwell (<i>T</i>_{poll} = 1 s)", "120", "531.96 [480.9, 581.2]", "278.3", "546.0", "970.5", "99.69% (99.98% Var.)"],
        ["AMQP Push → Shipment FSM", "120", "0.19 [0.02, 0.36]", "0.92", "0.00", "1.00", "532.15 ms Post-Commit"],
        ["AMQP Push → Tracking DB", "120", "1.03 [0.89, 1.18]", "0.77", "1.00", "2.00", "532.99 ms Post-Commit"],
        ["HTTP Pull → Reporting Cube", "120", "363.18 [360.8, 365.6]", "13.59", "360.0", "387.0", "895.14 ms Post-Commit"],
        ["Exp 2C: HTTP Seq. (Relay A)", "200", "1.665 (total 333.4)", "0.846", "1.454", "2.824", "599.9 msg/s (1.0×)"],
        ["Exp 2C: AMQP Seq. (Relay B)", "200", "0.586 (total 117.4)", "0.197", "0.575", "0.736", "1,703.9/s (2.84×)"],
        ["Exp 2C: AMQP Batch-50 Probe", "200", "0.058 (total 11.8)", "0.007", "0.060", "0.065", "16,949.2/s (28.25×)"]
    ]
    cw2 = [Inches(0.99), Inches(0.20), Inches(0.75), Inches(0.25), Inches(0.25), Inches(0.26), Inches(0.80)]
    build_table(t2_headers, t2_rows, cw2, highlight_rows={1, 7}, font_pt=5.2)

    add_p(r"Under a 200-scan burst (<i>c</i> = 50, Exp 2B, Fig. 3a), `ScanOutboxRelayService` drains across 4 quantized batches of <i>B</i> = 50 rows in 3,817 ms (3.82 s, matching Eq. (3)). In Exp 2C, replacing sequential HTTP Management requests (333.38 ms total) with persistent AMQP `ConfirmChannel` cuts 200-message publish time to 117.38 ms sequentially (Relay B, 2.84×) and 11.80 ms in a pipelined batch-50 micro-benchmark probe (16,949.2 msg/s, 28.25×).", style='Text')

    add_p("Idempotency, FSM Safety & 5-Level Human Control (RQ3)", style='Heading 2', space_before=2.0, space_after=0.7)
    add_p(r"Across 500 synthetic HTTP calls covering 150 unique keys (Exp 3, Fig. 3b), Dual-Layer Idempotency returned 500/500 (100.0%) HTTP `2xx` while inserting strictly 150/150 `ScanEvent` and `OutboxEvent` records. Layer-1 cache lookup accelerated sequential retries 2.12× (1.825 ms [1.82 ms rounded] vs. 3.873 ms Fresh; median gain 2.05 ms, CI [1.57, 3.95] ms, <i>p</i> = 9.61 × 10^{−13}), while Layer-2 `P2002` resolved every 6-way parallel race (68.09 ms median). Re-injecting 50 duplicate RabbitMQ envelopes yielded 0/50 Tracking leaks and 0/50 clean KPI leaks (1,750 → 1,750, 60/60 distinct `AggregationJob` commits), while SQL audit timestamps explained a transient +50 initial probe offset (`07:51:07.224Z` vs. `10.085Z`, 2.86 s SQL tail under `ack_requeue_false`). Against 60 illegal out-of-order and terminal AMQP attacks (Exp 4A), `ShipmentStateMachine` protected 60/60 (100.0%; exact Clopper–Pearson 95% CI [94.04%, 100.0%]) authoritative states, while Exp 4B (Fig. 3c) verified 5/5 (100.0%; CI [47.82%, 100.0%]) delayed parent faults self-healed on `.retry.10s` at 10.36 s and 5/5 poison events escalated cleanly to `.retry.1m` (17.03 s) and `.dlq` (71.97 s) under our 5-level human-control scale (Table V).", style='Text')

    add_p("Table V", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1.8, space_after=0.3, keep_with_next=True)
    add_p(r"Verification Telemetry (Exp 3–4B) Mapped to 5-Level Human-Control Scale", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0.8, keep_with_next=True)
    t3_headers = ["Verification Scope", "Human-Control Scale Tier", "Measured Outcome", "Verified Mechanism & Audit Finding"]
    t3_rows = [
        ["Terminal OOO & View\n(Exp 4A FSM + Track)", "L1: Unchecked Auto\n(Disallowed)", "0 FSM jumps;\n20/20 View Skew", "`VALID_TRANSITIONS` blocks 60/60 attacks;\n`TrackingCurrent` F1 exposes view skew"],
        ["Non-Blocking Offload\n(Exp 4B Main Queue)", "L2: Blocking Retry\n(Disallowed)", "0 main-queue\nstalls", "Consumer ACKs main queue immediately;\nroutes retries via `x-retry-count`"],
        ["Exp 3 / 3C / 4A: Guards\n& Idempotent Gate", "L3: Auto Guard &\nDedup Gate", "150/150 Exact;\n0/50 Dup Leak", "L1 (1.825 ms, 2.12×) + L2 `P2002` dedup;\n`AggregationJob` 150/150 (+2.86 s F2)"],
        ["Exp 4B: Transient\nOrphan Self-Healing", "L4: Bounded Auto\nTTL Retry (10 s / 1 m)", "5/5 Healed (10.36 s)\nCI [47.8, 100.0%]", "`.retry.10s` resolves race after parent\ncreate @ 3.09 s (0 human alerts)"],
        ["Exp 4B Poison `.dlq` &\nExp 4A Lock Gate", "L5: Human Operator\nQuarantine & Override", "5/5 `.dlq` (71.97 s)\n20/20 Phased Locks", "Poison isolates in `.dlq`; locked scans\noverride via `INVENTORY_CHECK` (F3)"]
    ]
    cw3 = [Inches(0.82), Inches(0.80), Inches(0.68), Inches(1.20)]
    build_table(t3_headers, t3_rows, cw3, highlight_rows={2, 3, 4}, font_pt=5.3)

    add_full_width_figure(
        fig3_path,
        r"Fig. 3. Burst drain, deduplication, and self-healing telemetry: (a) Outbox Batch-50 burst drain staircase (<i>N</i> = 200 writes, <i>T</i>_{poll} = 1,000 ms) with Exp 2C transport inset; (b) Dual-Layer Idempotency latency speedup (<i>N</i> = 500 requests / 150 unique keys); and (c) Live multi-tier TTL retry recovery and `.dlq` quarantine trajectory over 72.5 s (<i>N</i> = 10 faults).",
        width_in=5.95
    )

    # ==========================================
    # V. DISCUSSION, CODE FINDINGS & REMEDIATIONS
    # ==========================================
    add_p("DISCUSSION, CODE FINDINGS & TARGETED REMEDIATIONS", style='Heading 1', space_before=2.2, space_after=0.9)
    add_p(r"<i>Answering RQ1–RQ3:</i> (1) On RQ1, Outbox + CQRS eliminates shared KPI row-locks above <i>c</i> = 10 (783.36 req/s peak) and reduces <i>p</i>_{95} tracking read latency by 65.59% under write saturation (15.73 vs. 45.73 ms, <i>p</i> = 4.83 × 10^{−67}). (2) On RQ2, fixed 1,000 ms polling dwell explains 99.69% of mean post-commit lag (531.96 ms) and 99.98% of variance, whereas pipelined AMQP `ConfirmChannel` probing boosts broker publish throughput up to 28.25× over HTTP Management relays. (3) On RQ3, combining L1/L2 `P2002` idempotency, 19-state FSM whitelisting (60/60), and 5-level human-control `.retry`/`.dlq` ladders enforces safe convergence while preserving human governance.", style='Text')
    add_p(r"<i>Three Active Codebase Findings & Targeted Remediations (Table VI):</i> Live fault injection exposed three active engineering gaps in the running codebase, paired below with proposed patches (unapplied during the frozen benchmark sweep):", style='Text')
    add_num_list_p("1)", "CQRS Read-Model View Skew (F1): ", r"Inside `TrackingDisplayMapper`, out-of-order events omitting `data.shipment.currentStatus` fall back to event-to-status mapping and overwrite `TrackingCurrent` across all 20/20 test parcels even while `ShipmentService` rejected all 60 attacks. <i>Fix:</i> Guard `TrackingCurrent` updates with monotonic `stateVersion` or `occurredAt` checks and derive status strictly from authoritative `shipment.state_changed` events.")
    add_num_list_p("2)", "HTTP Pull Ackmode Crash Window (F2): ", r"`ReportingRabbitmqConsumerService` pops 20-message batches via `ack_requeue_false` up to 2.86 s ahead of sequential SQL `AggregationJob` commits. <i>Fix:</i> Switch to persistent AMQP push with manual `basicAck` executed strictly post-commit.")
    add_num_list_p("3)", "Inter-Service Lock TOCTOU & Outbox Atomicity (F3): ", r"Interleaved `INVENTORY_CHECK` bursts triggered 18/20 lock probes (vs. 20/20 phased) because `ShipmentsService` clears `isLocked = false` asynchronously mid-tick while `ScansService` queries locks over HTTP and persists `ScanEvent` and `OutboxEvent` sequentially outside `prisma.$transaction`. <i>Fix:</i> Replicate lock flags locally into `scan_db` via domain events and wrap writes atomically in `prisma.$transaction`.")

    add_p("Table VI", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1.8, space_after=0.3, keep_with_next=True)
    add_p(r"Active Codebase Audit Findings and Targeted Remediations", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0.8, keep_with_next=True)
    t5_headers = ["Finding ID", "Active Service Component", "Measured Cluster Evidence", "Proposed Engineering Remediation"]
    t5_rows = [
        ["F1: CQRS Read View\nSkew", "`TrackingDisplayMapper` /\n`TrackingProjection-\nStore`", "20/20 overwritten views on\nmissing-snapshot OOO", "Guard `TrackingCurrent` by monotonic\n`occurredAt` / `stateVersion`"],
        ["F2: HTTP Pull Crash\nWindow", "`ReportingRabbitmq-`\n`ConsumerService`", "+50 in-flight / 2.86 s lag\nunder `ack_requeue_false`", "Switch HTTP `/get` to AMQP\nmanual `basicAck` post-commit"],
        ["F3: Async Lock\nTOCTOU", "`ScansService` &\n`ShipmentsService`", "18/20 interleaved vs. 20/20\nphased; 6.91 ms, <i>c</i> = 1 HTTP", "Sync lock flag into `scan_db`;\nwrap writes in `prisma.$transaction`"]
    ]
    cw5 = [Inches(0.72), Inches(0.92), Inches(0.88), Inches(0.98)]
    build_table(t5_headers, t5_rows, cw5, highlight_rows={0}, font_pt=5.3)

    # ==========================================
    # VI. CONCLUSION, LIMITATIONS, AND REPRODUCIBILITY
    # ==========================================
    add_p("CONCLUSION, LIMITATIONS, AND REPRODUCIBILITY", style='Heading 1', space_before=2.2, space_after=0.9)
    add_p(r"<i>Conclusion:</i> Evaluating the live Nexus Transactional Outbox, Dual-Layer Idempotency, 19-State FSM, and CQRS architecture against a shared-database baseline confirms 7.52× write scaling (783.36 req/s), 65.59% lower tracking read <i>p</i>_{95} latency (<i>p</i> = 4.83 × 10^{−67}), 28.25× batched AMQP publish speedup in micro-benchmark probing, 100.0% FSM invariant safety (60/60, [94.04%, 100.0%]), 5/5 transient self-healing at 10.36 s balanced with Level-5 `.dlq` quarantine at 71.97 s, and three concrete active code findings (`F1`–`F3`).", style='Text')
    add_p("<i>Limitations & Reproducibility:</i> Four boundaries frame our results: (1) Single-host Apple M4 Docker runs (<i>n</i> = 1 live sweep, executed `2026-\u200b11-\u200b09T14:48:54Z` plus follow-up SQL/clean/phased addendum) exclude WAN jitter; (2) Burst suites (100–500 requests) reflect synthetic fault workloads rather than multi-day production traces; (3) At <i>c</i> = 25 writes, single-request latency medians do not differ significantly (<i>p</i> = 0.177) despite 57.7% lower <i>p</i>_{95} tails, while Exp 4B's 5/5 heal rate spans [47.82%, 100.0%] at <i>N</i> = 5; and (4) Findings `F1`–`F3` remain unpatched in evaluated binaries alongside priority upgrades (`LISTEN/\u200bNOTIFY` wakeups and pipelined AMQP confirms). Code, frozen JSON datasets (`canonical_\u200bstats.json`, raw summaries, and addendum JSONs under `data_\u200bdistributed/`), and the cluster harness (`run_\u200bbenchmarks.mjs`, plus Python analysis and figure generators under `docs/\u200bresearch/\u200bpaper/`) are archived at `https://\u200bgithub.com/\u200bVoVanTuTai/\u200blogistics-\u200bmanagement-\u200bsystem`.", style='Text')

    # ==========================================
    # REFERENCES (17 directly cited references — tight Paper 1 density)
    # ==========================================
    add_p("REFERENCES", style='Reference Head', space_before=1.8, space_after=0.7)
    refs = [
        r"[1] C. Richardson, <i>Microservices Patterns: With Examples in Java</i>. Shelter Island, NY, USA: Manning Publications, 2018 (520 pp., ISBN 978-1-61729-454-9).",
        r"[2] D. J. Abadi, “Consistency tradeoffs in modern distributed database system design: CAP is only part of the story,” <i>Computer</i>, vol. 45, no. 2, pp. 37–42, Feb. 2012.",
        r"[3] S. Gilbert and N. Lynch, “Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services,” <i>ACM SIGACT News</i>, vol. 33, no. 2, pp. 51–59, Jun. 2002.",
        r"[4] D. Pritchett, “BASE: An Acid alternative,” <i>ACM Queue</i>, vol. 6, no. 3, pp. 48–55, May 2008.",
        r"[5] R. Laigner, Y. Zhou, M. A. V. Salles, Y. Liu, and M. Kalinowski, “Data management in microservices: State of the practice, challenges, and research directions,” <i>Proc. VLDB Endow.</i>, vol. 14, no. 13, pp. 3348–3361, 2021.",
        r"[6] S. Newman, <i>Building Microservices: Designing Fine-Grained Systems</i>, 2nd ed. Sebastopol, CA, USA: O'Reilly Media, 2021 (616 pp., ISBN 978-1-4920-3401-8).",
        r"[7] V. Vernon, <i>Implementing Domain-Driven Design</i>. Upper Saddle River, NJ, USA: Addison-Wesley, 2013 (656 pp., ISBN 978-0-321-83457-7).",
        r"[8] G. Hohpe and B. Woolf, <i>Enterprise Integration Patterns: Designing, Building, and Deploying Messaging Solutions</i>. Boston, MA, USA: Addison-Wesley, 2003 (ISBN 978-0-321-20068-6).",
        r"[9] M. Kleppmann, <i>Designing Data-Intensive Applications</i>. Sebastopol, CA, USA: O'Reilly Media, 2017 (616 pp., ISBN 978-1-4493-7332-0).",
        r"[10] J. Kreps, N. Narkhede, and J. Rao, “Kafka: A distributed messaging system for log processing,” in <i>Proc. NetDB Workshop</i>, Athens, Greece, 2011, pp. 1–7.",
        r"[11] J. Kreps, “The Log: What every software engineer should know about real-time data's unifying abstraction,” <i>LinkedIn Engineering Blog</i>, Dec. 2013.",
        r"[12] A. Videla and J. J. W. Williams, <i>RabbitMQ in Action: Distributed Messaging for Everyone</i>. Shelter Island, NY, USA: Manning Publications, 2012 (312 pp., ISBN 978-1-935182-97-9).",
        r"[13] G. Young, “CQRS Documents,” <i>CQRS Info Technical Notes</i>, Nov. 2010.",
        r"[14] P. Helland, “Idempotence is not a medical condition,” <i>ACM Queue</i>, vol. 10, no. 4, pp. 30–46, Apr. 2012.",
        r"[15] H. Garcia-Molina and K. Salem, “Sagas,” in <i>Proc. ACM SIGMOD Int. Conf. Manage. Data</i>, San Francisco, CA, USA, 1987, pp. 249–259.",
        r"[16] L. Lamport, “Time, clocks, and the ordering of events in a distributed system,” <i>Commun. ACM</i>, vol. 21, no. 7, pp. 558–565, Jul. 1978.",
        r"[17] M. Fowler, “CQRS,” <i>MartinFowler.com Architecture Series</i>, Jul. 2011."
    ]
    for r in refs:
        p = add_p(r, style='References', space_after=0.25, line_spacing=0.965, math_pt=6.8, pt_size=6.8)
        p.paragraph_format.left_indent = Inches(0.20)
        p.paragraph_format.first_line_indent = Inches(-0.20)

    # Balance final 2-column page cleanly via continuous 2-col -> 1-col section pair
    p_end = doc.add_paragraph(style='Normal')
    p_end.paragraph_format.space_before = Pt(0)
    p_end.paragraph_format.space_after = Pt(0)
    p_end.paragraph_format.line_spacing = 0.2
    p_end.add_run("").font.size = Pt(1.0)
    sectPr_bal = parse_xml(r'''
    <w:sectPr {} >
        <w:headerReference w:type="default" r:id="rId22"/>
        <w:type w:val="continuous"/>
        <w:pgSz w:w="12240" w:h="15840" w:code="1"/>
        <w:pgMar w:top="1008" w:right="936" w:bottom="1008" w:left="936" w:header="432" w:footer="432" w:gutter="0"/>
        <w:cols w:num="2" w:space="288"/>
    </w:sectPr>
    '''.format(nsdecls('w', 'r')))
    p_end._p.get_or_add_pPr().append(sectPr_bal)
    final_type = final_sectPr.xpath('./w:type')
    if not final_type:
        t_el = etree.Element(f'{{{NS_W}}}type')
        t_el.set(f'{{{NS_W}}}val', 'continuous')
        final_sectPr.insert(0, t_el)
    cols.set('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}num', '1')

    doc.save(output_path)
    print(f"[SUCCESS] Compiled aligned Paper 2 DOCX at: {output_path}")


if __name__ == '__main__':
    build_ssrc_distributed_docx()
