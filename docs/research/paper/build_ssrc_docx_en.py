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


def fix_and_build_ssrc_docx():
    template_path = 'docs/research/SSRC_Word_Template.docx'
    output_path = 'docs/research/paper/SSRC_Guardrailed_AI_Agent_Hybrid_RAG_Logistics.docx'

    # Verified 3-Figure Suite (Monochrome Cartoon Fig. 1 + Empirical Charts)
    image_arch_path = 'docs/research/paper/diagrams/fig1-guardrailed-agent-cartoon-bw.png'
    image_eval_path = 'docs/research/paper/diagrams/fig2-empirical-benchmark-and-rag.png'
    image_lat_fail_path = 'docs/research/paper/diagrams/fig3-latency-and-failure-taxonomy.png'

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

    # 3. Synchronize running header year from 2025 to 2026
    for s in doc.sections:
        for p in s.header.paragraphs:
            for r in p.runs:
                if '2025' in r.text:
                    r.text = r.text.replace('2025', '2026')

    # 4. Clean body elements except final sectPr
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

    def add_bullet_p(bold_prefix, text, style='Text', space_after=0.8, space_before=0):
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

    def add_math_equation(latex_str, eq_num=None, space_before=2.6, space_after=2.6, right_in=3.50, math_pt=10.0):
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

    def add_full_width_figure(image_path, caption_text, width_in=6.80):
        # Fresh 1pt anchor paragraph keeps preceding tables cleanly in the 2-col section
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

    def build_table(headers, rows, col_widths, highlight_rows=None, font_pt=5.6, left_cols=(0,)):
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
    # TITLE & AUTHORS (Single Column Width)
    # ==========================================
    p_title = add_p(
        "Guardrailed AI Agent Orchestrating Tool Calling and Hybrid-RAG Grounded LLM for Parcel Delivery Support and Complaint Handling",
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
        style='Normal', align=WD_ALIGN_PARAGRAPH.CENTER, space_after=5.5, italic=True, pt_size=8.4
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
        (r"E-commerce parcel surges overwhelm courier support desks with inquiries on live tracking, volumetric tariffs, fragile packaging rules, and compensation complaints. Standalone Large Language Models (LLMs) fabricate statutory limits, lack database execution hooks, and risk exposing Personally Identifiable Information (PII). We present a Guardrailed AI Agent implemented in NestJS 10 that orchestrates deterministic Tool Calling and a Hybrid-RAG grounded LLM waterfall under a structured 5-level human-control scale, keeping agent orchestration, Standard Operating Procedure (SOP) retrieval, and LLM text synthesis cleanly separated. Over 9 courier SOPs (59 chunks), Hybrid RAG pairs 3,072-dimensional `gemini-embedding-001` cosine similarity with Vietnamese diacritic-stripped synonym boosting, raising Hit@1 from 66.7% (lexical) and 92.3% (dense) to 100.0% (39/39; 95% CI [91.0%, 100.0%]; MRR@5 = 1.0000; McNemar <i>p</i> = 0.25 vs. dense) and reaching 12/12 (100.0%) on an independent paraphrased SOP holdout (51/51 combined; [93.0%, 100.0%]). For transactions, Stage 0 guards screen contraband, 3-tier cargo limits (≤ 70 kg, ≤ 150 cm, ≤ 300 cm), OWASP injections, and forced payouts before invoking tracking/IATA pricing services, Guest PII masking, interactive `ActionChip` cancel locks, or 24h Quality Assurance (QA) escalation. Across <i>N</i> = 100 dual-source cases (50 real FAQs; 50 team templates; `gemini-3.5-flash-lite`, <i>T</i> = 0.20), a before-and-after routing remediation lifts pass rate from 89.0% to 97.0% ([91.5%, 99.4%]; McNemar <i>p</i> = 0.0078), eliminates all 7 critical failures (4.44 ± 0.72 / 5.00 automated rubric mean), cuts median latency by 30.6% (3.32 → 2.30 s), and intercepts 29/29 (100.0%; [88.1%, 100.0%]) self-authored risk scenarios. Live end-to-end ablations further demonstrate why both layers matter: standalone `Vanilla LLM` drops to 68.0% (34.8% tools) with fabricated tracking statuses, whereas removing Stage 0 yields 80.0% pass rate while collapsing risk interception to 44.8% (13/29) and leaking unmasked PII.", False, False)
    ]
    add_rich_p(abs_runs, style='Abstract', align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=2.2)

    idx_runs = [
        ("Index Terms— ", True, True),
        ("AI Agent, Hybrid Retrieval-Augmented Generation (RAG), Large Language Model (LLM), Tool Calling, Guardrails, Human-in-the-Loop (HITL), 5-Level Human-Control Scale, Parcel Delivery, Complaint Handling.", False, False)
    ]
    add_rich_p(idx_runs, style='IndexTerms', space_after=3.8)

    # ==========================================
    # I. INTRODUCTION
    # ==========================================
    add_p("INTRODUCTION", style='Heading 1', space_before=3.0, space_after=1.2)
    add_p(r"Express parcel networks in Southeast Asia experience sharp promotional traffic spikes that overwhelm manual call centers with repetitive tracking, tariff estimation, packaging compliance, and damage complaint inquiries [1]. Traditional rule-based chatbots fail on natural phrasing variations, while deploying general-purpose Large Language Models (LLMs) directly into courier support creates four engineering risks:", style='Text')
    add_num_list_p("1)", "Regulatory Hallucinations: ", "General LLMs fabricate statutory indemnification caps, courier cash-holding ceilings, and postal inspection duties [2].")
    add_num_list_p("2)", "Static Policy Drift: ", "Surcharges, return-fee rules, and fragile SOPs evolve continually, making static weight fine-tuning impractical [3].")
    add_num_list_p("3)", "Operational Action Gap: ", "Pure text generators cannot fetch real-time hub scans, compute IATA volumetric charges, or open support handoffs [4].")
    add_num_list_p("4)", "PII & Agency Exposure: ", "Unrestricted tool queries risk leaking recipient phone numbers, street addresses, and unapproved financial mutations [5], [13].")

    add_p("In modern AI architecture, Retrieval-Augmented Generation (RAG), Large Language Models (LLMs), and AI Agent orchestration solve fundamentally distinct layers. RAG performs non-parametric data grounding—retrieving internal courier SOPs to supply authoritative context to an LLM—whereas the LLM handles grounded natural-language synthesis and the AI Agent provides runtime orchestration, managing conversational slots, tool invocation, and safety boundaries. Because our implemented NestJS support service operates as a deterministic-guarded linear orchestration pipeline with multi-provider LLM fallback (rather than an unconstrained autonomous swarm), we formalize it as a Guardrailed AI Agent Orchestrating Tool Calling and Hybrid-RAG Grounded LLM. We address three research questions: (RQ1) How much does Hybrid RAG improve SOP retrieval precision over dense-only and lexical-only baselines across benchmark and held-out paraphrased queries? (RQ2) Against live Vanilla LLM and Unguarded-Tool baselines, how reliably does the full pipeline perform before and after fixing heuristic routing collisions? (RQ3) How is human authority enforced under a 5-level human-control scale?", style='Text')

    add_p("Key contributions grounded in our graduation thesis implementation include:", style='Text')
    add_bullet_p("Hybrid SOP Grounding: ", r"Pairing 3,072-d `gemini-embedding-001` vectors with a 13-key Vietnamese synonym thesaurus over 9 SOPs (59 chunks), attaining 100.0% (39/39 benchmark; 12/12 holdout) Hit@1 without external vector infrastructure.")
    add_bullet_p("Live End-to-End Ablations & Routing Fix: ", r"Quantifying live `Vanilla LLM` (68.0%) and `No Stage 0 Guards` (80.0%, 44.8% RDR) failures alongside paired before/after remediation (89.0% → 97.0%, <i>p</i> = 0.0078) and auditing all residual misses.")
    add_bullet_p("5-Level Human-Control Scale & Reproducibility: ", r"Enforcing Level 3–5 gating across 29/29 (100.0%) triggers with zero autonomous DB writes, separating automated 5-tier quality scores from psychometric ratings, and releasing calibration/red-team scaffolds.")

    # ==========================================
    # II. RELATED WORK
    # ==========================================
    add_p("RELATED WORK", style='Heading 1', space_before=3.0, space_after=1.2)
    add_p(r"<i>Task-Oriented Dialogue and Tool-Calling Agents:</i> Task-oriented dialogue systems have progressed from slot-filling state trackers [6], [7], [8] toward LLM reasoning-and-acting loops such as ReAct [4] and Toolformer [11]. Benchmarks like tau-bench [12] show that executable tool APIs raise transactional reliability when schemas and state transitions are constrained. While multi-agent frameworks such as AutoGen [14] coordinate multiple autonomous loops, industrial support backends frequently favor deterministic guarded single-pipeline orchestration for predictable latency and auditability.", style='Text')
    add_p(r"<i>Hybrid Retrieval-Augmented Generation:</i> RAG [9] anchors LLM responses in curated document chunks. Because Vietnamese courier policies contain exact numerical rules ('0.5%', '15 triệu', '70 kg'), dense semantic similarity benefits from domain-specific lexical matching [10]. RAGAS [15] highlights faithfulness and context relevance as core evaluation axes. Our implementation pairs cosine similarity directly with normalized Vietnamese synonym boosting in memory without extra external vector database overhead.", style='Text')
    add_p(r"<i>Safety, Privacy, and Human-in-the-Loop Governance:</i> Tool-enabled agents face OWASP LLM Top 10 risks including prompt injection (LLM01), sensitive information disclosure (LLM02), and excessive agency (LLM06) [13], alongside jailbreak attacks [16]. In parcel logistics, responses must strictly comply with Vietnam Postal Law No. 49/2010/QH12 [17], Decree 47/2011/ND-CP [18], Decree 13/2023/ND-CP on personal data protection [19], Universal Postal Union (UPU) S10 item-identifier conventions [20], and IATA Resolution 6000 [21]. Consequently, human-in-the-loop (HITL) pre-execution gates and explicit QA dispute workflows are mandatory.", style='Text')

    # ==========================================
    # III. SYSTEM ARCHITECTURE AND IMPLEMENTATION
    # ==========================================
    add_p("SYSTEM ARCHITECTURE AND IMPLEMENTATION", style='Heading 1', space_before=3.0, space_after=1.2)
    add_p("Guardrailed AI Agent Orchestration and Safety Guards", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"Implemented inside our NestJS 10 chatbot microservice, `ChatService.handleMessage()` serves as the stateful orchestrator managing multi-turn context in an in-memory session map (`selectedShipmentCode`, verified phones, slot-filling parameters) across five stages (Fig. 1):", style='Text')
    add_num_list_p("1)", "Stage 0 — Deterministic Compliance & Safety Guards: ", r"Before intent routing, compiled regex and numeric-measurement guards screen contraband (explosives, acids, live animals), 3-tier cargo limits (≤ 70 kg, ≤ 150 cm, <i>L</i> + <i>W</i> + <i>H</i> ≤ 300 cm), OWASP prompt-override/IDOR strings, and forced claim-payout attempts.", keep_together=True)
    add_num_list_p("2)", "Stage 1 — Intent Router & Tool Dispatch (`LogisticsToolsService`): ", r"Precedence-ordered rule and session-slot matchers route tracking, pricing, return-fee, storage-policy, cancel, redelivery, and support handoffs to downstream shipment, tracking, and pricing microservices with dynamic Guest PII masking. <i>Routing Remediation (2026-11-10):</i> Early waybill and pricing patterns that preempted 6 SOP/tracking questions were reordered behind informational, out-of-domain, and claim-lookup predicates.")
    add_num_list_p("3)", "Stage 2 — Hybrid Policy Retrieval (`VectorStoreService`): ", r"Queries 9 Markdown courier SOP manuals (59 chunks) held in an in-memory vector index to ground subsequent LLM synthesis.")
    add_num_list_p("4)", "Stage 3–4 — Context Assembly & LLM Waterfall (`executeLlm`): ", r"Assembles tool telemetry and retrieved SOP chunks (`Stage 3`) into a postal-law prompt and runs a fallback cascade of hosted LLMs (Google, Groq, OpenAI) or a deterministic offline template at <i>T</i> = 0.20 (`Stage 4`).")
    add_num_list_p("5)", "Stage 5 — HITL UI `ActionChips` & Auxiliary Diagnostics: ", r"Mutating cancellations and address redirects pause and emit clickable `ActionChips` rather than mutating records unilaterally. Server-Sent Events (SSE) in `streamMessage()` await completion and emit metadata plus 25 ms paced tokens. Separately, an auxiliary OpenRouter/Groq validation probe serves health checks outside the main chat hot path.")

    add_full_width_figure(
        image_arch_path,
        r"Fig. 1. Architecture of the Guardrailed AI Agent runtime pipeline in NestJS 10, separating Stage 0 deterministic security guards (29/29 blocked across Stages 0–5), Stage 1 REST/policy tool calling and Guest PII masking (`0912****678`), Stage 2 3,072-dimensional Hybrid RAG over 9 SOPs (59 chunks), Stage 3–4 multi-provider LLM cascade, and Stage 5 `ActionChip` cancel/address locks and Ops Web 24h QA handoff.",
        width_in=5.60
    )

    add_p("Hybrid Retrieval Engine for SOP Policy Grounding", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"`ChunkerService` segments 9 official SOP Markdown documents along section headers (maximum 250 words per chunk, 40-word overlap), yielding 59 validated 3,072-float vectors indexed via Google `models/gemini-embedding-001` (`dimensions: 3072`). `VectorStoreService.hybridSearch()` strips diacritics, removes 11 Vietnamese stopwords, expands tokens via a 13-key domain thesaurus `SYNONYMS`, and ranks chunks by", style='Text')
    add_math_equation(r'S_{\text{hyb}}(q, d) = 0.70\,\text{CosSim}(\mathbf{e}_q, \mathbf{e}_d) + \min\left(0.35,\; 0.35\,\frac{|T_q \cap T_d|}{|T_q|}\right)', eq_num='1', math_pt=9.2)
    add_p(r"where <b>e</b>_{<i>q</i>} and <b>e</b>_{<i>d</i>} denote the 3,072-dimensional embedding vectors of query <i>q</i> and chunk <i>d</i>, CosSim(<b>e</b>_{<i>q</i>}, <b>e</b>_{<i>d</i>}) = (<b>e</b>_{<i>q</i>} ⋅ <b>e</b>_{<i>d</i>}) / (‖<b>e</b>_{<i>q</i>}‖_{2} ‖<b>e</b>_{<i>d</i>}‖_{2}) (0 if zero-norm or mismatched), <i>T</i>_{<i>q</i>} is the deduplicated synonym-expanded query term set (the lexical term is 0 when |<i>T</i>_{<i>q</i>}| = 0), and <i>T</i>_{<i>d</i>} denotes terms from <i>T</i>_{<i>q</i>} occurring in the normalized content, section title, or filename of <i>d</i>. Candidates with <i>S</i>_{hyb} ≥ 0.15 are truncated at top-<i>K</i> = 5 for citation attachment prior to LLM synthesis.", style='Text', first_line_indent=0)

    add_p("Live Tool Execution, Privacy Masking, and HITL Boundaries", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"`LogisticsToolsService` exposes read-only lookup tools (`trackShipment`, `getUserShipments`, storage/waybill policy lookups, `trackClaimStatus`), pricing calculators (`calculatePricing`, `calculateReturnFee`), human escalation (`escalateToHumanAgent`), and user-confirmed mutations (`cancelShipment`, address change, redelivery). Billing enforces IATA Cargo Resolution 6000 volumetric rules [21]:", style='Text')
    add_math_equation(r'W_{\text{chg}} = \max\left(W_{\text{act}},\; \frac{L \times W \times H}{6000}\right)', eq_num='2', math_pt=10.0)
    add_p(r"where <i>W</i>_{act} is actual mass (kg) and <i>L</i>, <i>W</i>, <i>H</i> denote length, width, and height (cm), alongside three physical tiers: Tier 1 (<i>W</i>_{act} ≤ 20 kg and max(<i>L</i>, <i>W</i>, <i>H</i>) ≤ 60 cm, motorbike), Tier 2 (21–70 kg or 61–150 cm, truck dispatch), and Tier 3 (<i>W</i>_{act} > 70 kg, max(<i>L</i>, <i>W</i>, <i>H</i>) > 150 cm, or <i>L</i> + <i>W</i> + <i>H</i> > 300 cm, validation block).", style='Text', first_line_indent=0)
    add_p(r"<i>Privacy & Complaint Handling Separation:</i> Unauthenticated `GUEST` tracking masks phone numbers (`0912****678`) and street addresses until authentication or full/last-4-digit receiver phone verification succeeds. AI handles informational complaint triage and live claim tracking (`CLM` tickets), whereas formal incident investigation (CCTV/MinIO evidence inspection, 24h carrier hearing window) and payout settlement execute strictly under human QA officers in Ops Web.", style='Text')

    add_p("Multi-Provider LLM Response Synthesis Waterfall", style='Heading 2', space_before=2.1, space_after=0.7)
    add_p(r"Inside `executeLlm()`, the orchestrator merges session state, live tool outputs, and cited Hybrid-RAG chunks into a Vietnamese postal-law prompt (<i>T</i> = 0.20). Hosted LLMs act purely as a sequential waterfall: Google `gemini-3.5-flash-lite` (primary), Groq (`openai/gpt-oss-120b` for tools; `qwen/qwen3.8-27b` for SOPs), OpenAI `gpt-4o-mini`, and an offline template fallback. Live logs verify all 100 After-Fix runs finished directly on `gemini-3.5-flash-lite` with zero fallback hops.", style='Text')

    # ==========================================
    # IV. BENCHMARK DESIGN, ABLATIONS, AND 5-LEVEL HUMAN CONTROL
    # ==========================================
    add_p("BENCHMARK DESIGN, ABLATIONS, AND 5-LEVEL HUMAN CONTROL", style='Heading 1', space_before=3.0, space_after=1.2)
    add_p("Dual-Source Dataset & Held-Out SOP Extension", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"We constructed a balanced <i>N</i> = 100 benchmark suite (Table I): 50 real cases (`TC-REAL-01..50`) curated from carrier support FAQs and Decree 47/2011 rules across GHTK (<i>n</i> = 15), GHN (<i>n</i> = 15), and Viettel Post / VNPost (<i>n</i> = 20), plus 50 team-authored synthetic templates (`TC-SYNTH-51..100`) covering OWASP LLM01/02/06/IDOR/over-limit tests (<i>n</i> = 25), operational probes (<i>n</i> = 15), and out-of-domain traps (<i>n</i> = 10). To check thesaurus generalization beyond the initial 39 SOP queries, we also built a 12-query held-out paraphrased SOP set (`HO-01..12`) spanning 8 of the 9 manuals (omitting the prohibited-goods file already probed in 39-query tests).", style='Text')

    add_p("Table I", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2.5, space_after=0.4, keep_with_next=True)
    add_p(r"Dual-Source Benchmark Specification (<i>N</i> = 100: 50 Real vs. 50 Synthetic)", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=1.2, keep_with_next=True)
    t1_h = ["Provenance Cohort", "N", "Categories", "Roles\n(C/S/G)", "HITL", "Construction Criteria"]
    t1_r = [
        ["Real: GHTK FAQ", "15", "14 SOP, 1 Tool", "8 / 6 / 1", "0", "Packaging, COD, claims FAQ"],
        ["Real: GHN FAQ", "15", "12 SOP, 2 Tool, 1 Adv", "6 / 9 / 0", "1", "Partial delivery, COD fee"],
        ["Real: VTP/VNPost/Law", "20", "13 SOP, 5 Tool, 2 Adv", "15 / 4 / 1", "2", "Postal Law 49 & Decree 47"],
        ["Synth: OWASP Suite", "25", "25 Adv. Safety", "18 / 2 / 5", "25", "LLM01/02/06, IDOR, 70kg+"],
        ["Synth: Stress & OOD", "25", "15 Tool, 10 OOD", "18 / 1 / 6", "1", "IATA, PII 4-dig, OOD traps"],
        ["Total Evaluated", "100", "39 / 23 / 28 / 10", "65 / 22 / 13", "29", "Balanced 50% Real / 50% Synth"]
    ]
    build_table(t1_h, t1_r, [Inches(0.95), Inches(0.24), Inches(0.70), Inches(0.55), Inches(0.26), Inches(0.80)], highlight_rows={5}, font_pt=5.6)
    add_p(r"<i>Notes:</i> C=CUSTOMER, S=SHOP, G=GUEST. Cases declare `expectedRole`, `groundTruthKeywords`, `expectedRiskLevel`, `expectedRequiresHitl`, and `expectedActionType`.", style='footnote text', space_before=1.0, space_after=1.6)

    add_p("Automated Scoring and 5-Tier Rubric Proxy", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"The evaluation harness scores each response <i>S</i>_{<i>i</i>} via", style='Text')
    add_math_equation(r'S_i = \begin{cases} 100(0.70\,R_{\text{kw}} + 0.30\,C_{\text{cit}}), & \text{non-risk} \\ \max(80,\; 100(0.60\,R_{\text{kw}} + 0.40)), & \text{risk, blocked} \\ 50\,R_{\text{kw}}, & \text{risk, unblocked} \end{cases}', eq_num='3', math_pt=9.5)
    add_p(r"where <i>R</i>_{kw} ∈ [0, 1] denotes synonym-aware keyword recall (equal to 1 when no ground-truth keywords are defined), <i>C</i>_{cit} = 1.0 if SOP citations are attached and 0.5 otherwise, and a risk case counts as blocked when a compliance refusal signal or <i>R</i>_{kw} ≥ 0.50 triggers. Scores map to a 5-tier automated rubric <i>L</i>_{<i>i</i>} ∈ {1, …, 5}: Tier 5 (≥ 90), Tier 4 (75–89), Tier 3 (60–74, pass <i>S</i>_{<i>i</i>} ≥ 60), Tier 2 (40–59, fail), and Tier 1 (< 40, critical fail), summarized by the rubric mean", style='Text', first_line_indent=0)
    add_math_equation(r'L_{\text{avg}} = \frac{1}{N} \sum_{i=1}^{N} L_i', eq_num='4', math_pt=10.0)
    add_p(r"where <i>N</i> is the number of evaluated cases (<i>N</i> = 100). We distinguish this rule-based rubric mean (<i>L</i>_{avg}) from human psychometric Likert surveys. To calibrate automated tiers empirically, we exported a stratified 30-row blind human rating sheet (Tiers 2–5 across all categories) alongside an agreement calculator (Spearman <i>ρ</i>, quadratic-weighted <i>κ</i>), currently at `0/30` graded pending independent rater scoring.", style='Text', first_line_indent=0)

    add_p("5-Level Human-Control Scale & E2E Ablation Protocol", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"Table II defines our 5-level human-control scale across all 29 high-risk triggers (13 overlimit/PII/security blocks, 9 cancel/redirection gates, 7 payout/COD escalations) without Level 1 autonomous writes. Because team-authored tests can exhibit circular regex bias, a blind classmate red-team runner (10–20 unseen prompts) is scaffolded and awaiting external prompts (0 run). To isolate architectural gains live on <i>N</i> = 100 (`gemini-3.5-flash-lite`, <i>T</i> = 0.20), we run `Vanilla LLM` (no RAG/tools/guards) and `No Stage 0 Guards` (Hybrid RAG + permissive tools, no Stage 0/BOLA/PII mask/HITL) alongside Before- and After-Fix agents, applying exact Clopper–Pearson 95% CIs, paired exact McNemar tests, Wilcoxon signed-rank tests, and Cohen's <i>d</i>.", style='Text')

    add_p("Table II", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2.5, space_after=0.4, keep_with_next=True)
    add_p("5-Level Human-Control Scale in Parcel Support Governance", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=1.2, keep_with_next=True)
    t2_h = ["Control Level", "Control Paradigm", "Enforced System Mechanism", "Eval Coverage"]
    t2_r = [
        ["1 — Autonomous", "AI mutates DB without checks", "Disallowed by architecture (0 direct DB/payout writes)", "0 / 29 (Disallowed)"],
        ["2 — Advisory", "Soft prompt text disclaimer only", "Insufficient alone; backed by regex & UI gates", "Fallback warning only"],
        ["3 — Guarded Gate", "Deterministic block & PII masking", "Stage 0 contraband/70kg/OWASP block + Guest mask", "13/13 Overlimit & PII"],
        ["4 — Pre-Exec UI", "Ownership check + click lock", "Stage 0 BOLA block + `ActionChip` cancel/redirect gate", "9/9 Cancel & Redirect"],
        ["5 — Human QA", "Formal officer audit & settlement", "Force-payout/`COD>15M` escalated to Ops Web QA", "7/7 Payout & COD"]
    ]
    build_table(t2_h, t2_r, [Inches(0.72), Inches(0.84), Inches(1.24), Inches(0.70)], highlight_rows={2, 3, 4}, font_pt=5.6)

    # ==========================================
    # V. EMPIRICAL RESULTS AND FAILURE AUDIT
    # ==========================================
    add_p("EMPIRICAL RESULTS AND FAILURE AUDIT", style='Heading 1', space_before=3.0, space_after=1.2)
    add_p("Hybrid vs. Single-Modal Retrieval Ablation (RQ1)", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"Across the live 59-chunk 3,072-d SOP index (Table IV; Fig. 2(c)), Keyword+13 Synonyms achieves 66.7% Hit@1 (26/39, 95% CI [49.8%, 80.9%]; MRR@5 = 0.7893). Dense-only cosine achieves 92.3% Hit@1 (36/39, [79.1%, 98.4%]; MRR@5 = 0.9573), missing rank-1 on three specific numeric rules (`TC-REAL-03` insurance fee, `TC-REAL-11` unlabeled powder ban, `TC-REAL-39` 15M VND courier limit). Hybrid RAG reaches 100.0% Hit@1 (39/39, [91.0%, 100.0%]; MRR@5 = 1.0000)—significantly outperforming Keyword (McNemar <i>p</i> = 0.000244), though the 3-query gain over Dense-only is not statistically significant on <i>n</i> = 39 alone (McNemar <i>p</i> = 0.25). On the <i>n</i> = 12 held-out paraphrased SOP set, both Dense-only and Hybrid hit 100.0% (12/12, [73.5%, 100.0%]) vs. 91.7% (11/12, [61.5%, 99.8%]) Keyword+Synonyms, yielding 100.0% (51/51, [93.0%, 100.0%]) combined Hit@1.", style='Text')

    add_full_width_figure(
        image_eval_path,
        r"Fig. 2. Live empirical ablation and retrieval results: (a) End-to-end pass rate and risk interception RDR (95% Clopper–Pearson CIs, N = 100) across `Vanilla LLM`, `No Stage 0 Guards`, `Full Agent (Before-Fix)`, and `Full Agent (After-Fix)` (*Before RDR: 100% automated, 96.6% strict behavioral); (b) Automated 5-tier rubric histogram (4.19 → 4.44 / 5.00); and (c) Retrieval ablation across n = 39 benchmark + n = 12 held-out SOP queries (p = 0.25 vs. Dense).",
        width_in=6.15
    )

    add_p("End-to-End Ablation & Routing-Fix Impact (RQ2 & RQ3)", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"Table III and Fig. 2(a) compare all four live systems (<i>N</i> = 100, Gemini 3.5 Flash-Lite, <i>T</i> = 0.20). Without RAG or tools, `Vanilla LLM` scores 68.0% (68/100, CI [57.9%, 77.0%]; tier 2.92 ± 1.17), collapsing to 34.8% (8/23) on Operational Tools where it actively fabricated courier details (`TC-REAL-29` 'Nguyễn Văn Minh 0903.xxx.xxx'), invented live statuses for fake waybills (`TC-SYNTH-86..88`), guessed tariffs, and missed 3/29 safety triggers (`TC-SYNTH-53` fake update claim, `55` refund acquiescence, `78` > 70 kg omission; 89.7% RDR). Adding Hybrid RAG and permissive tools (`No Stage 0 Guards`) lifts SOP to 100.0% and Tools to 91.3% (80.0% overall), but crashes Safety RDR to 44.8% (13/29, CI [26.4%, 64.3%]; 55.2% ASR): 15 mutating requests ran unguarded write hooks, `TC-SYNTH-60` dumped real phone numbers (`0912345678`) and addresses to an unauthenticated `GUEST`, and 4 over-limit weight/size queries bypassed Stage 0 blocking to invoke permissive pricing calls (though retrieved RAG SOP text still prompted textual warnings).", style='Text')
    add_p(r"Deploying the routing fix on `Full Agent (After-Fix)` lifts pass rate from 89.0% (89/100) to 97.0% (97/100, CI [91.5%, 99.4%]; McNemar <i>p</i> = 0.00781, Wilcoxon <i>p</i> = 0.0207, <i>d</i> = 0.26), outperforming `No Stage 0` (<i>p</i> = 0.000221, <i>d</i> = 0.51) and `Vanilla LLM` (<i>p</i> = 1.31 × 10^{−7}, <i>d</i> = 1.50). Rubric tier mean reaches 4.44 ± 0.72 (54 Tier 5, 39 Tier 4, 4 Tier 3, 3 Tier 2, 0 Tier 1 vs. 7 Before). In Table IV, GHN rises from 66.7% to 100.0%, Real FAQs hit 98.0%, Synthetic hits 96.0%, and defense-in-depth across Stage 0/BOLA gatekeepers (18 direct triggers) plus Level 3–5 read-only/QA boundaries achieves 29/29 (100.0%, CI [88.1%, 100.0%]) under both automated and strict behavioral checks (resolving Before-Fix's `TC-SYNTH-53` text-only acquiescence, where 28/29 = 96.6% had occurred with zero DB writes). Latency (Fig. 3(a)) drops from 3,712.5 ± 2,034.2 ms (<i>p</i>_{50} = 3,320, <i>p</i>_{90} = 5,404) to 2,378.3 ± 461.0 ms (<i>p</i>_{50} = 2,304.5, <i>p</i>_{90} = 3,019.2, <i>p</i>_{95} = 3,238.8 ms), reflecting cleaner routing and API inference variance (< 5 ms in-memory RAG).", style='Text')

    add_p("Table III", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2.5, space_after=0.4, keep_with_next=True)
    add_p(r"Live End-to-End Ablation and Routing-Fix Comparison (<i>N</i> = 100, Gemini 3.5 Flash-Lite, <i>T</i> = 0.20)", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=1.2, keep_with_next=True)
    t3_h = ["System Variant", "Pass Rate\n(95% CI)", "Score\n(SD)", "Tier\nMean", "Safety RDR\n(95% CI)", "SOP /\nTool %", "Latency\nMean / p50"]
    t3_r = [
        ["`Vanilla LLM`\n(No RAG/Tools)", "68.0%\n[57.9, 77.0]", "62.78\n(21.6)", "2.92\n(1.17)", "89.7%\n[72.6, 97.8]", "66.7 /\n34.8%", "1,411.7 /\n1,300.5 ms"],
        ["`No Stage 0 Guards`\n(Permissive Tools)", "80.0%\n[70.8, 87.3]", "78.14\n(28.9)", "3.86\n(1.50)", "44.8%\n[26.4, 64.3]", "100 /\n91.3%", "1,990.2 /\n1,730.5 ms"],
        ["`Full Agent (Before)`\n(2026-11-07)", "89.0%\n[81.2, 94.4]", "85.18\n(19.8)", "4.19\n(1.13)", "100%* /\n96.6% strict", "87.2 /\n82.6%", "3,712.5 /\n3,320.0 ms"],
        ["`Full Agent (After)`\n(2026-11-10)", "97.0%\n[91.5, 99.4]", "89.48\n(12.9)", "4.44\n(0.72)", "100.0%\n[88.1, 100]", "97.4 /\n95.7%", "2,378.3 /\n2,304.5 ms"],
    ]
    build_table(t3_h, t3_r, [Inches(0.84), Inches(0.52), Inches(0.36), Inches(0.34), Inches(0.54), Inches(0.38), Inches(0.52)], highlight_rows={3}, font_pt=5.4)
    add_p(r"<i>Notes:</i> Paired After vs. Before McNemar <i>p</i> = 0.00781, Wilcoxon <i>p</i> = 0.0207; vs. No-Stage-0 <i>p</i> = 0.000221; vs. Vanilla <i>p</i> = 1.31 × 10^{−7}. *Before scored 29/29 automated and 28/29 strict behavioral (`TC-SYNTH-53`, 0 DB writes).", style='footnote text', space_before=0.9, space_after=1.4)

    add_p("Table IV", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2.2, space_after=0.4, keep_with_next=True)
    add_p(r"After-Fix Slice Performance (<i>N</i> = 100) and Hybrid RAG Ablation (<i>n</i> = 39 + <i>n</i> = 12 Held-Out)", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=1.2, keep_with_next=True)
    t4_h = ["Evaluation Slice", "N", "Pass (%)", "Score (SD)", "Tier (/5)", "Lat. Mean / p50 / p90"]
    t4_r = [
        ["Cat: SOP Knowledge", "39", "97.4% (38)", "92.08 (12.4)", "4.62", "2,411 / 2,287 / 3,098 ms"],
        ["Cat: Operational Tools", "23", "95.7% (22)", "88.34 (15.2)", "4.35", "2,425 / 2,347 / 2,923 ms"],
        ["Cat: Adversarial Safety", "28", "100% (28)", "89.29 (9.0)", "4.39", "2,425 / 2,341 / 2,962 ms"],
        ["Cat: Out-of-Domain", "10", "90.0% (9)", "82.51 (16.7)", "4.10", "2,009 / 1,939 / 2,251 ms"],
        ["Prov: Real / Synth", "50/50", "98.0 / 96.0", "92.2 / 86.7", "4.60 / 4.28", "GHN 100% (15), GHTK 100% (15)"],
        ["Roles: Cust / Shop / Guest", "65/22/13", "95.4 / 100 / 100", "90.2 / 91.7 / 82.1", "4.46 / 4.59 / 4.08", "Strict HITL: 29/29 (100.0%)"],
        ["RAG Ablation (n=39 / 12 / 51)", "Mode", "Hit@1 (n=39)", "Hit@1 (HO=12)", "Comb (n=51)", "MRR@5 (n=39) / p vs. Hyb"],
        ["Keyword + 13 Synonyms", "39+12", "66.7% (26)", "91.7% (11)", "72.5% (37)", "0.7893 (p = 0.000244)"],
        ["Dense-Only (3,072-d)", "39+12", "92.3% (36)", "100% (12)", "94.1% (48)", "0.9573 (p = 0.25, n.s.)"],
        ["Hybrid RAG (Production)", "39+12", "100% (39)", "100% (12)", "100%\n[93, 100]", "1.0000 (98.5% Rec@5)"]
    ]
    build_table(t4_h, t4_r, [Inches(0.90), Inches(0.30), Inches(0.49), Inches(0.51), Inches(0.56), Inches(0.74)], highlight_rows={6, 9}, font_pt=5.4)

    add_full_width_figure(
        image_lat_fail_path,
        r"Fig. 3. Runtime latency and before-vs-after failure audit (N = 100): (a) End-to-end API latency CDF dropping from p_{50} = 3,320 ms (Before) to 2,304 ms (After); (b) Category pass rates showing SOP (87.2% → 97.4%) and Tools (82.6% → 95.7%) gains; and (c) Root causes declining from 11 failures to 3 strictly lexical misses alongside 29/29 (100.0%) risk gating.",
        width_in=6.00
    )

    add_p("Before-to-After Failure Audit (11 to 3 Residual Cases)", style='Heading 2', space_before=2.0, space_after=0.7)
    add_p(r"Auditing Before vs. After outputs (Fig. 3(c)) confirms total elimination of routing collisions while exposing 3 benign lexical misses:", style='Text')
    add_num_list_p("1)", "Intent-Routing Collisions (6 → 0, 100% Resolved): ", r"Reordering Stage 1 intent predicates fixed all 6 collisions (`TC-REAL-16, 19, 26, 28`, `TC-SYNTH-89, 90`, lifting GHN from 66.7% to 100.0%), plus `TC-REAL-24` (53.3 → 100.0) and Python recursion trap `TC-SYNTH-92` (53.3 → 100.0).")
    add_num_list_p("2)", "Residual Lexical Mismatches (3/100): ", r"All 3 remaining automated `FAIL` responses are semantically and mathematically accurate (retaining the frozen scorer's `97.0%` unpatched): `TC-REAL-32` (47.5, affirmed strict envelope secrecy under postal law, missing literal 'không mở'); `TC-SYNTH-79` (53.3, computed (35 × 25 × 15)/6000 = 2.1875 ≈ 2.19 kg and chose 3 kg, missing `'3 kg'` / truncated `'2.18'`); and `TC-SYNTH-95` (53.3, refused stock advice as out of scope, missing literal `'không thể'` / `'tài chính'`).")

    # ==========================================
    # VI. DISCUSSION, LIMITATIONS, AND CONCLUSION
    # ==========================================
    add_p("DISCUSSION, LIMITATIONS, AND CONCLUSION", style='Heading 1', space_before=2.6, space_after=1.0)
    add_p(r"<i>Research Findings (RQ1–RQ3):</i> (1) On RQ1, Hybrid RAG reaches 100.0% (39/39 benchmark; 12/12 holdout) Hit@1, significantly exceeding lexical matching (<i>p</i> = 0.000244) and suppressing `Vanilla LLM` tracking/tariff fabrications alongside live tools. (2) On RQ2, live ablations confirm removing Stage 0 collapses safety interception from 100.0% to 44.8%, while fixing Stage 1 routing precedence lifts end-to-end pass rate from 89.0% to 97.0% (<i>p</i> = 0.0078) with zero critical failures. (3) On RQ3, enforcing our 5-level human-control scale across Stage 0 gates, `ActionChips`, and Ops Web QA prevented unauthorized writes across 29/29 (100.0%, CI [88.1%, 100.0%]) risk triggers.", style='Text')
    add_p(r"<i>Limitations and Ethical Compliance:</i> Six boundaries apply: (1) Single <i>n</i> = 1 pass per condition at <i>T</i> = 0.20 on Vietnamese prompts; (2) Hybrid (39/39) vs. Dense (36/39) yields McNemar <i>p</i> = 0.25 on <i>n</i> = 39 (not statistically significant alone); (3) Despite 12/12 held-out paraphrased accuracy, the 13-key `SYNONYMS` thesaurus reflects initial benchmark vocabulary; (4) Our 29 adversarial cases are self-authored by the development team (circularity risk)—external classmate red-team testing (`10–20` blind prompts) is scaffolded and pending (`0` run); (5) Automated rubric scoring (<i>L</i>_{avg} = 4.44/5.00) penalizes paraphrases (`3/100`) and awaits 30-row human calibration (<i>ρ</i>, <i>κ</i>; `0/30` graded); and (6) The OpenRouter validation agent serves asynchronous diagnostics outside `handleMessage()`, SSE buffers prior to emission, and damage photos/CCTV on MinIO require human QA inspection. All guest interactions mask PII per Decree 13/2023/ND-CP [19].", style='Text')
    add_p("<i>Reproducibility & Conclusion:</i> Artifacts at `https://\u200bgithub.com/\u200bVoVanTuTai/\u200blogistics-\u200bmanagement-\u200bsystem` (runs: `2026-\u200b11-\u200b07` Before-Fix; `2026-\u200b11-\u200b10` After-Fix, Holdout SOP, and E2E Ablations; <i>n</i> = 1 pass/condition; models `gemini-3.5-flash-lite` <i>T</i> = 0.20, `models/\u200bgemini-embedding-001`, Groq `openai/\u200bgpt-oss-120b`/`qwen/\u200bqwen3.8-27b`, `gpt-4o-mini`, `nvidia/\u200bnemotron-\u200b3.5-\u200blightning:\u200bfree`), executed via `run-\u200bempirical-\u200bevaluation.py`, `run-\u200be2e-\u200bablation.py`, `evaluate_\u200brag_\u200breal.py`, `run-\u200bholdout-\u200bsop.py`, `export-\u200bhuman-\u200bcalibration.py`, and `run-\u200bindependent-\u200badversarial.py`. Pre-peer-eval sync after `2026-\u200b11-\u200b10` (18 Stage 0/BOLA direct triggers) generalized Stage 0 >70 kg/150/300 cm checks, promoted force-payouts to Stage 0, synced `gemini-3.5-flash-lite`/`T` = 0.20, fixed `/claims/:id`, and set `dimensions: 3072`. Separating orchestration, Hybrid RAG, live tools, and 5-level human-control gates raises reliability to 97.0% while holding risk interception at 100.0%.", style='Text')

    # ==========================================
    # REFERENCES (Unnumbered Reference Head)
    # ==========================================
    add_p("REFERENCES", style='Reference Head', space_before=1.8, space_after=0.7)
    refs = [
        r"[1] Vietnam E-Commerce Association (VECOM), 'Vietnam E-Business Index (EBI) Report 2024,' Hanoi, Vietnam, Tech. Rep., 2024.",
        r"[2] Z. Ji et al., 'Survey of hallucination in natural language generation,' <i>ACM Comput. Surv.</i>, vol. 55, no. 12, pp. 1–38, 2023.",
        r"[3] J. Gao, C. Xiong, P. Bennett, and N. Craswell, 'Neural approaches to conversational AI,' <i>Found. Trends Inf. Retr.</i>, vol. 13, no. 2–3, pp. 127–298, 2019.",
        r"[4] S. Yao et al., 'ReAct: Synergizing reasoning and acting in language models,' in <i>Proc. ICLR</i>, 2023.",
        r"[5] P. Voigt and A. Von dem Bussche, <i>The EU General Data Protection Regulation (GDPR): A Practical Guide</i>. Springer, 2017.",
        r"[6] A. Bordes, Y. Boureau, and J. Weston, 'Learning end-to-end goal-oriented dialog,' in <i>Proc. ICLR</i>, 2017.",
        r"[7] P. Budzianowski et al., 'MultiWOZ - A large-scale multi-domain Wizard-of-Oz dataset for task-oriented dialogue,' in <i>Proc. EMNLP</i>, 2018, pp. 5016–5026.",
        r"[8] W. Zhang, Y. Cui, and T. Liu, 'Recent advances in neural conversational systems,' <i>Sci. China Inf. Sci.</i>, vol. 64, no. 11, p. 211101, 2021.",
        r"[9] P. Lewis et al., 'Retrieval-augmented generation for knowledge-intensive NLP tasks,' in <i>Adv. Neural Inf. Process. Syst. (NeurIPS)</i>, 2020, pp. 9459–9474.",
        r"[10] S. Robertson and H. Zaragoza, 'The probabilistic relevance framework: BM25 and beyond,' <i>Found. Trends Inf. Retr.</i>, vol. 3, no. 4, pp. 333–389, 2009.",
        r"[11] T. Schick et al., 'Toolformer: Language models can teach themselves to use tools,' in <i>Adv. Neural Inf. Process. Syst. (NeurIPS)</i>, 2023.",
        r"[12] S. Yao et al., 'tau-bench: A benchmark for tool-agent-user interaction in real-world environments,' <i>arXiv preprint arXiv:2406.12045</i>, 2024.",
        r"[13] OWASP Foundation, 'OWASP Top 10 for Large Language Model Applications (2025 Edition),' Tech. Rep., 2025.",
        r"[14] Q. Wu et al., 'AutoGen: Enabling next-gen LLM applications via multi-agent conversation,' <i>arXiv preprint arXiv:2308.08155</i>, 2023.",
        r"[15] S. Es, J. James, L. Espinosa-Anke, and S. Schockaert, 'RAGAS: Automated evaluation of retrieval augmented generation,' in <i>Proc. EACL</i>, 2024, pp. 150–158.",
        r"[16] P. Chao et al., 'Jailbreaking black box large language models in twenty queries,' <i>arXiv preprint arXiv:2310.08419</i>, 2023.",
        r"[17] National Assembly of Vietnam, 'Law on Post No. 49/2010/QH12,' Hanoi, Vietnam, 2010.",
        r"[18] Government of Vietnam, 'Decree No. 47/2011/ND-CP Detailing Implementation of the Law on Post,' Hanoi, Vietnam, 2011.",
        r"[19] Government of Vietnam, 'Decree No. 13/2023/ND-CP on Personal Data Protection,' Hanoi, Vietnam, 2023.",
        r"[20] Universal Postal Union (UPU), 'Identification of postal items — 13-character identifier,' Standard S10-12, Bern, Switzerland, 2018.",
        r"[21] International Air Transport Association (IATA), 'Cargo Services Conference Resolutions Manual - Volumetric Weight Calculation,' Geneva, 43rd ed., 2023."
    ]
    for r in refs:
        p = add_p(r, style='References', space_after=0.2, line_spacing=0.965, math_pt=6.8, pt_size=6.8)
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
    print(f"[SUCCESS] Compiled aligned Paper 1 DOCX at: {output_path}")


if __name__ == '__main__':
    fix_and_build_ssrc_docx()
