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

    # 3. Synchronize running header to SSRC 2026
    for s in doc.sections:
        for p in s.header.paragraphs:
            if 'STUDENT SCIENTIFIC RESEARCH' in p.text:
                for r in p.runs:
                    if '2025' in r.text or '2026' in r.text:
                        r.text = '2026'

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

    def soft_wrap_code(seg):
        tokens = seg.split(' ')
        out = []
        for tok in tokens:
            if '\u200b' not in tok and (len(tok) >= 10 or ('/' in tok and len(tok) >= 8)):
                tok = re.sub(r'(https?://)(?=[A-Za-z0-9])', '\\1\u200b', tok)
                tok = re.sub(r'([A-Za-z0-9.-]{3,}/)(?=[:A-Za-z0-9])', '\\1\u200b', tok)
                tok = re.sub(r'([A-Za-z0-9]{3,}_)(?=[A-Za-z0-9]{3,})', '\\1\u200b', tok)
                tok = re.sub(r'([A-Za-z]{3,}-)(?=[A-Za-z0-9]{3,})', '\\1\u200b', tok)
                tok = re.sub(r'([A-Za-z]{4,}\.)(?=[$A-Za-z]{4,})', '\\1\u200b', tok)
                tok = re.sub(r'([A-Za-z]{3,}:)(?=[A-Za-z]{4,})', '\\1\u200b', tok)
            out.append(tok)
        return ' '.join(out)

    def emit_plain_and_tags(p, seg, pt_size=None, bold=False, italic=False, is_code=False, code_pt_delta=0.8, superscript=False, subscript=False, no_smallcaps=False, allow_code_wrap=True):
        if not seg:
            return
        if is_code:
            code_txt = soft_wrap_code(seg) if allow_code_wrap else seg
            r = p.add_run(code_txt)
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

    def append_latex_text(p, text, pt_size=None, math_pt_size=10.0, bold=False, italic=False, code_pt_delta=0.8, allow_code_wrap=True):
        if not text:
            return
        code_parts = re.split(r'(`[^`]+`)', text)
        for cp in code_parts:
            if not cp:
                continue
            if cp.startswith('`') and cp.endswith('`') and len(cp) >= 2:
                emit_plain_and_tags(
                    p, cp[1:-1], pt_size=(pt_size if pt_size is not None else math_pt_size),
                    bold=bold, italic=False, is_code=True, code_pt_delta=code_pt_delta, allow_code_wrap=allow_code_wrap
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

    def add_column_figure(image_path, caption_text, width_in=3.48, space_before=2.2, space_after=2.6):
        p_img = doc.add_paragraph(style='Normal')
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.left_indent = Pt(0)
        p_img.paragraph_format.right_indent = Pt(0)
        p_img.paragraph_format.first_line_indent = Pt(0)
        p_img.paragraph_format.space_before = Pt(space_before)
        p_img.paragraph_format.space_after = Pt(1.2)
        p_img.paragraph_format.keep_with_next = True
        r_img = p_img.add_run()
        r_img.add_picture(image_path, width=Inches(width_in))

        p_cap = doc.add_paragraph(style='Figure Caption')
        p_cap.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_cap.paragraph_format.left_indent = Pt(0)
        p_cap.paragraph_format.right_indent = Pt(0)
        p_cap.paragraph_format.first_line_indent = Pt(0)
        p_cap.paragraph_format.space_before = Pt(0.8)
        p_cap.paragraph_format.space_after = Pt(space_after)
        p_cap.paragraph_format.line_spacing = 0.98
        append_latex_text(p_cap, caption_text, pt_size=8.0, math_pt_size=8.0, italic=False, code_pt_delta=0.4)
        for r_cap in p_cap.runs:
            r_cap.font.name = 'Times New Roman'
            r_cap.italic = False
            r_cap.font.size = Pt(8.0)
        return p_cap

    def build_table(headers, rows, col_widths, highlight_rows=None, font_pt=5.6, left_cols=(0,)):
        highlight_rows = set(highlight_rows or [])
        tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tblPr = tbl._tbl.tblPr
        for old_tag in tblPr.xpath('./w:tblW | ./w:tblLayout | ./w:tblCellMar | ./w:tblBorders'):
            tblPr.remove(old_tag)
        grid_dxa = [int(round(w.inches * 1440)) for w in col_widths]
        total_dxa = sum(grid_dxa)
        tblPr.append(parse_xml(f'<w:tblW {nsdecls("w")} w:w="{total_dxa}" w:type="dxa"/>'))
        tblPr.append(parse_xml(f'<w:tblLayout {nsdecls("w")} w:type="fixed"/>'))
        tblPr.append(parse_xml(
            f'<w:tblCellMar {nsdecls("w")}>'
            f'<w:top w:w="24" w:type="dxa"/><w:left w:w="32" w:type="dxa"/>'
            f'<w:bottom w:w="24" w:type="dxa"/><w:right w:w="32" w:type="dxa"/>'
            f'</w:tblCellMar>'
        ))
        tblPr.append(parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="10" w:space="0" w:color="auto"/>'
            f'<w:bottom w:val="single" w:sz="10" w:space="0" w:color="auto"/>'
            f'<w:insideH w:val="none"/><w:insideV w:val="none"/>'
            f'<w:left w:val="none"/><w:right w:val="none"/>'
            f'</w:tblBorders>'
        ))
        old_grid = tbl._tbl.find(f'{{{NS_W}}}tblGrid')
        if old_grid is not None:
            new_grid = parse_xml(
                f'<w:tblGrid {nsdecls("w")}>'
                + ''.join(f'<w:gridCol w:w="{gw}"/>' for gw in grid_dxa)
                + '</w:tblGrid>'
            )
            tbl._tbl.replace(old_grid, new_grid)

        tbl.rows[0]._tr.get_or_add_trPr().append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
        tbl.rows[0]._tr.get_or_add_trPr().append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

        for c_idx, h_text in enumerate(headers):
            cell = tbl.cell(0, c_idx)
            cell.width = col_widths[c_idx]
            tcPr = cell._tc.get_or_add_tcPr()
            tcPr.append(parse_xml(
                f'<w:tcBorders {nsdecls("w")}>'
                f'<w:top w:val="double" w:sz="6" w:space="0" w:color="auto"/>'
                f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="auto"/>'
                f'<w:left w:val="nil"/><w:right w:val="nil"/>'
                f'</w:tcBorders>'
            ))
            tcPr.append(parse_xml(f'<w:vAlign {nsdecls("w")} w:val="center"/>'))
            p = cell.paragraphs[0]
            p.text = ""
            append_latex_text(p, h_text, pt_size=font_pt, math_pt_size=font_pt, bold=True, code_pt_delta=0.2, allow_code_wrap=False)
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx in left_cols else WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0.5)
            p.paragraph_format.space_after = Pt(0.5)
            p.paragraph_format.line_spacing = 0.96
            p.paragraph_format.keep_with_next = True
            p._p.get_or_add_pPr().append(parse_xml(f'<w:suppressAutoHyphens {nsdecls("w")}/>'))

        num_rows = len(rows)
        for r_idx, row in enumerate(rows):
            is_last = (r_idx == num_rows - 1)
            tbl.rows[r_idx + 1]._tr.get_or_add_trPr().append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
            is_hi = r_idx in highlight_rows
            for c_idx, val in enumerate(row):
                cell = tbl.cell(r_idx + 1, c_idx)
                cell.width = col_widths[c_idx]
                tcPr = cell._tc.get_or_add_tcPr()
                tcPr.append(parse_xml(f'<w:vAlign {nsdecls("w")} w:val="center"/>'))
                if is_last:
                    tcPr.append(parse_xml(
                        f'<w:tcBorders {nsdecls("w")}>'
                        f'<w:top w:val="nil"/>'
                        f'<w:bottom w:val="double" w:sz="6" w:space="0" w:color="auto"/>'
                        f'<w:left w:val="nil"/><w:right w:val="nil"/>'
                        f'</w:tcBorders>'
                    ))
                else:
                    tcPr.append(parse_xml(
                        f'<w:tcBorders {nsdecls("w")}>'
                        f'<w:top w:val="nil"/><w:bottom w:val="nil"/>'
                        f'<w:left w:val="nil"/><w:right w:val="nil"/>'
                        f'</w:tcBorders>'
                    ))
                p = cell.paragraphs[0]
                p.text = ""
                append_latex_text(p, val, pt_size=font_pt, math_pt_size=font_pt, bold=is_hi, code_pt_delta=0.2, allow_code_wrap=False)
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx in left_cols else WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(0.5)
                p.paragraph_format.space_after = Pt(0.5)
                p.paragraph_format.line_spacing = 0.96
                p._p.get_or_add_pPr().append(parse_xml(f'<w:suppressAutoHyphens {nsdecls("w")}/>'))
                if r_idx < len(rows) - 1:
                    p.paragraph_format.keep_with_next = True
        return tbl

    # ==========================================
    # TITLE & AUTHORS (Single Column Width)
    # ==========================================
    p_title = add_p(
        "A Guardrailed AI Agent Architecture Integrating Hybrid-RAG and Tool Calling for Express Logistics Customer Support",
        style='Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_after=3.0
    )
    p_title._p.get_or_add_pPr().append(parse_xml(f'<w:suppressAutoHyphens {nsdecls("w")}/>'))

    add_p(
        "Vo Van Tu Tai, Tran Tan Tai, and Huynh Nam",
        style='Authors', align=WD_ALIGN_PARAGRAPH.CENTER, space_after=3.5
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
    # ==========================================
    # ABSTRACT & INDEX TERMS (7-Part SSRC Structure)
    # ==========================================
    abs_runs = [
        ("Abstract— ", True, True),
        (r"Customer support in express parcel logistics involves answering high-volume inquiries regarding tracking status, shipping tariffs, and packaging compliance while strictly upholding postal regulations. Directly deploying general-purpose Large Language Models (LLMs) creates severe production hazards: models hallucinate statutory compensation rules, execute unauthorized database mutations, and leak recipient contact information. In this paper, we design and evaluate a multi-stage guarded AI agent architecture that decouples policy compliance checking, domain Standard Operating Procedure (SOP) retrieval, and live REST tool actuation. Implemented in NestJS, the system uses a six-stage pipeline featuring deterministic Stage 0 filters (blocking contraband and personal data leaks), an in-memory Hybrid-RAG engine combining 3,072-dimensional embeddings with domain synonym expansion over 9 courier SOPs (59 chunks), and human-in-the-loop (HITL) confirmation chips for parcel state mutations. We evaluate the architecture on a dual-source benchmark of <i>N</i> = 100 cases (50 real carrier FAQs and 50 adversarial prompts) across four ablation configurations using Gemini 3.5 Flash-Lite. The proposed agent achieves 100.0% Hit@1 SOP retrieval, raises end-to-end task completion from 89.0% to 97.0% (<i>p</i> = 0.0078), intercepts 29/29 risk cases with zero unauthorized writes, and reduces median response latency from 3.32 s to 2.30 s. Without Stage 0 guards, safety interception plunges to 44.8%, while unassisted LLMs fail on live tool tasks (68.0% pass). These results demonstrate that externalizing compliance rules into deterministic pre-execution guards delivers reliable, low-latency automated customer service for regulated logistics operations.", True, False)
    ]
    add_rich_p(abs_runs, style='Abstract', align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=2.0)

    idx_runs = [
        ("Index Terms— ", True, True),
        ("AI Agent, Hybrid Retrieval-Augmented Generation (RAG), Large Language Model (LLM), Tool Calling, Guardrails, Human-in-the-Loop, Information Systems, Logistics Customer Support.", True, False)
    ]
    add_rich_p(idx_runs, style='IndexTerms', space_after=3.5)

    # ==========================================
    # I. INTRODUCTION
    # ==========================================
    add_p("INTRODUCTION", style='Heading 1', space_before=3.0, space_after=1.2)
    add_p(r"Express logistics networks handle thousands of packages daily, triggering heavy customer inquiry surges during seasonal e-commerce sales. Operational support centers spend most of their time answering repetitive inquiries regarding parcel tracking status, weight-based tariffs, and fragile packaging compliance [1]. While basic rule-based chatbots break when customers use colloquial phrasing or regional slang, connecting off-the-shelf Large Language Models (LLMs) directly to customer service introduces four serious operational hazards:", style='Text')
    add_num_list_p("1)", "Regulatory Hallucinations: ", "General LLMs frequently invent statutory compensation limits, maximum cash-on-delivery amounts, and postal inspection rights [2].")
    add_num_list_p("2)", "Rapid Policy Drift: ", "Surcharges, return-fee schedules, and packaging SOPs change frequently, making parametric weight fine-tuning brittle and costly [3].")
    add_num_list_p("3)", "Operational Action Gap: ", "Standalone language models cannot query live warehouse scans, calculate IATA volumetric freight charges, or dispatch delivery drivers [4].")
    add_num_list_p("4)", "Privacy and Agency Hazards: ", "Granting LLMs unchecked tool execution risks exposing recipient phone numbers and street addresses, or executing unapproved parcel cancellations [10], [14].")

    add_p("In production support systems, Retrieval-Augmented Generation (RAG) grounds replies in official carrier documentation, the LLM generates clear natural responses, and an orchestration layer manages dialogue state, tool execution, and safety validation. To evaluate this approach systematically, we address one core Research Question (RQ): <i>To what extent does decoupling deterministic Stage 0–5 safety filters from Hybrid-RAG SOP retrieval and live REST tool execution improve task reliability and policy compliance compared with unshielded LLMs and single-modal retrieval baselines?</i>", style='Text')

    add_p("Our main contributions are as follows:", style='Text')
    add_bullet_p("Hybrid SOP Grounding: ", r"Pairing 3,072-dimensional `gemini-embedding-001` embeddings with a 13-key Vietnamese logistics synonym dictionary across 9 SOPs (59 chunks), achieving 100.0% Hit@1 (39/39 benchmark; 12/12 holdout) without requiring external vector database infrastructure.")
    add_bullet_p("Live End-to-End Ablations & Routing Study: ", r"Quantifying real failure modes across Vanilla LLM (68.0%) and an unguarded agent (80.0% pass, 44.8% safety defense), and measuring a paired routing remediation that raises task success from 89.0% to 97.0% (<i>p</i> = 0.0078) while auditing every residual miss.")
    add_bullet_p("Deterministic HITL Gating & Reproducibility Scaffolds: ", r"Enforcing strict pre-execution approvals across all 29/29 safety triggers, eliminating unauthorized database mutations, and releasing calibration templates and red-team test harnesses for reproducible evaluation.")

    # ==========================================
    # II. RELATED WORK
    # ==========================================
    add_p("RELATED WORK", style='Heading 1', space_before=3.0, space_after=1.2)
    add_p(r"<i>Task-Oriented Dialogue and Tool Calling:</i> Augmenting language models with tools allows agents to interleave natural language reasoning with live API queries, as demonstrated in ReAct [4] and Toolformer [5]. Real-world benchmarks such as τ-bench [7] show that tool integration enhances task completion only when parameter schemas and state transitions are strictly governed. While multi-agent frameworks like AutoGen [6] orchestrate complex agent dialogues, enterprise customer service backends generally favor deterministic, linear pipeline architectures to maintain predictable latencies, tight audit logs, and clear operational boundaries.", style='Text')
    add_p(r"<i>Hybrid Retrieval-Augmented Generation:</i> Retrieval-Augmented Generation (RAG) [3], [8] anchors model responses in verified operational documents rather than static training weights. In courier logistics, policies rely heavily on exact numeric thresholds ('0.5%', '15 triệu', '70 kg'). Combining dense semantic vectors with lexical keyword matching substantially improves retrieval precision on numeric constraints [8], while frameworks like RAGAS [9] help evaluate faithfulness and context relevance. Our implementation combines cosine similarity with normalized synonym expansion directly in memory, avoiding the operational complexity of managing external vector clusters.", style='Text')
    add_p(r"<i>Safety, Privacy, and Human Governance:</i> Tool-calling agents are vulnerable to prompt injections (OWASP LLM01), sensitive data exposure (LLM02), and excessive agency (LLM06) [10], as well as multi-turn jailbreaks [11]. In Vietnamese express logistics, support agents must strictly comply with Vietnam Postal Law No. 49/2010/QH12 [12], Decree 47/2011/ND-CP [13], Decree 13/2023/ND-CP on personal data protection [14], and IATA TACT volumetric rules [15]. Consequently, incorporating deterministic pre-execution guardrails and human-in-the-loop (HITL) approval gates is an absolute operational requirement.", style='Text')

    # ==========================================
    # III. PROPOSED METHODOLOGY AND SYSTEM ARCHITECTURE
    # ==========================================
    add_p("PROPOSED METHODOLOGY AND SYSTEM ARCHITECTURE", style='Heading 1', space_before=3.0, space_after=1.2)
    add_p("Guarded Linear Pipeline and Stage Design", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"Instead of relying on an open-ended autonomous agent loop where the LLM freely selects tools, we implemented `ChatService.handleMessage()` in NestJS 10 as a deterministic six-stage pipeline (Fig. 1). Below the summary diagram, each component has a fixed, well-defined responsibility:", style='Text')

    add_column_figure(
        image_arch_path,
        r"Fig. 1. High-level runtime pipeline of the guarded NestJS 10 support agent connecting deterministic compliance checks, live tools, Hybrid RAG, LLM generation, and human approval.",
        width_in=3.48
    )

    add_num_list_p("1)", "Ingress & Session Store: ", r"Customer, shop, and unauthenticated guest requests enter over REST or SSE. An in-memory session manager tracks the active `selectedShipmentCode`, phone verification state, and conversation slots.")
    add_num_list_p("2)", "Stage 0 (Guardrails): ", r"Before any model or database call, regex pattern matchers and numeric bounds block contraband (explosives, toxic chemicals, live animals), enforce parcel limits (≤ 70 kg, ≤ 150 cm per edge, <i>L</i> + <i>W</i> + <i>H</i> ≤ 300 cm), strip prompt-override attempts, and block unauthorized claim payouts.", keep_together=True)
    add_num_list_p("3)", "Stage 1 (REST Tools): ", r"Rule-based matchers in `LogisticsToolsService` route tracking, tariff, return-fee, storage, cancellation, redelivery, and human-handoff requests while masking `GUEST` PII. During development, we adjusted matcher precedence to ensure general SOP questions and claim lookups are evaluated before early tracking regexes, preventing misrouted intent collisions.")
    add_num_list_p("4)", "Stage 2 (Hybrid RAG): ", r"Policy queries invoke `VectorStoreService` against an in-memory index of 9 SOP Markdown files (59 chunks) with no external vector database.")
    add_num_list_p("5)", "Stage 3–4 (Prompt Assembly & LLM Generation): ", r"Verified tool records and retrieved SOP chunks are packed into a postal-law prompt (`Stage 3`) and answered via a fallback chain (Google, Groq, OpenAI, or an offline template) at <i>T</i> = 0.20 (`Stage 4`).")
    add_num_list_p("6)", "Stage 5 (HITL & QA Handoff): ", r"State mutations such as parcel cancellations or address updates pause and return interactive `ActionChips` for user confirmation. Streaming responses emit 25 ms-paced SSE tokens, while disputed compensation claims route to Ops Web QA personnel. Service health is monitored separately.")

    add_p("In-Memory Hybrid Dense–Lexical SOP Grounding", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"To eliminate external vector-database hosting, synchronization lag, and operational cost for bounded SMB and single-domain courier deployments, the knowledge base is intentionally scoped as an in-memory, zero-infrastructure micro-corpus: `ChunkerService` splits 9 domain SOP Markdown files at section headers using a 250-word cap and 40-word overlap, yielding 59 chunks embedded with Google `models/gemini-embedding-001` (`dimensions: 3072`). Because Vietnamese courier rules depend heavily on exact numbers (such as '0.5%', '15 triệu', and '70 kg'), dense similarity alone can miss exact threshold clauses. `VectorStoreService.hybridSearch()` therefore strips Vietnamese diacritics, removes 11 common stopwords, expands words using a compact 13-key domain thesaurus `SYNONYMS`, and ranks chunks via", style='Text')
    add_math_equation(r'S_{\text{hyb}}(q, d) = 0.70\,\text{CosSim}(\mathbf{e}_q, \mathbf{e}_d) + \min\left(0.35,\; 0.35\,\frac{|T_q \cap T_d|}{|T_q|}\right)', eq_num='1', math_pt=9.2)
    add_p(r"where <b>e</b>_{<i>q</i>} and <b>e</b>_{<i>d</i>} are the 3,072-d embeddings of query <i>q</i> and chunk <i>d</i>, CosSim(<b>e</b>_{<i>q</i>}, <b>e</b>_{<i>d</i>}) = (<b>e</b>_{<i>q</i>} ⋅ <b>e</b>_{<i>d</i>}) / (‖<b>e</b>_{<i>q</i>}‖_{2} ‖<b>e</b>_{<i>d</i>}‖_{2}) (set to 0 if either norm is zero), <i>T</i>_{<i>q</i>} is the expanded query token set (lexical term = 0 when |<i>T</i>_{<i>q</i>}| = 0), and <i>T</i>_{<i>d</i>} is the overlap found in the normalized body, heading, or filename of <i>d</i>. Because <i>S</i>_{hyb} is used solely as a ranking score, the bounded 0.35 term (giving a theoretical ceiling of 0.70 + 0.35 = 1.05 > 1.0) acts as an intentional <i>lexical boost cap</i> so chunks matching exact numeric rules outrank merely semantically similar neighbors. Chunks scoring <i>S</i>_{hyb} ≥ 0.15 up to top-<i>K</i> = 5 are attached as citations before generation.", style='Text', first_line_indent=0)

    add_p("Tool Execution, Privacy Masking, and HITL Scope", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"`LogisticsToolsService` provides read-only lookups (`trackShipment`, `getUserShipments`, storage/waybill rules, `trackClaimStatus`), tariff calculators (`calculatePricing`, `calculateReturnFee`), human handoff (`escalateToHumanAgent`), and user-confirmed updates (`cancelShipment`, address change, redelivery). Pricing calculations follow IATA TACT volumetric weight [15]:", style='Text')
    add_math_equation(r'W_{\text{chg}} = \max\left(W_{\text{act}},\; \frac{L \times W \times H}{6000}\right)', eq_num='2', math_pt=10.0)
    add_p(r"where <i>W</i>_{act} is actual weight (kg) and <i>L</i>, <i>W</i>, <i>H</i> are box dimensions (cm). Parcels fall into three handling tiers: Tier 1 (<i>W</i>_{act} ≤ 20 kg and max edge ≤ 60 cm, motorbike), Tier 2 (21–70 kg or 61–150 cm, truck dispatch), and Tier 3 (> 70 kg, any edge > 150 cm, or sum > 300 cm, rejected upfront). For unauthenticated `GUEST` sessions, tool outputs mask phone numbers (`0912****678`) and street addresses until authentication or receiver phone verification passes. Complaint triage and `CLM` ticket lookups run in chat, whereas MinIO photo/CCTV checks and 24-hour carrier compensation reviews remain strictly inside Ops Web under human QA staff.", style='Text', first_line_indent=0)

    add_p("Multi-Provider LLM Response Generation", style='Heading 2', space_before=2.1, space_after=0.7)
    add_p(r"Inside `executeLlm()`, the pipeline places verified tool outputs and cited SOP chunks into a Vietnamese postal-law prompt at <i>T</i> = 0.20. Hosted models serve only as a sequential fallback chain: Google `gemini-3.5-flash-lite` (primary), Groq (`openai/gpt-oss-120b` for tools; `qwen/qwen3.8-27b` for SOPs), OpenAI `gpt-4o-mini`, and an offline template. Execution logs show all 100 post-fix test queries completed directly on `gemini-3.5-flash-lite` with zero fallback switches.", style='Text')

    # ==========================================
    # IV. EXPERIMENTAL DATA, STRUCTURE, AND PROTOCOL
    # ==========================================
    add_p("EXPERIMENTAL DATA, STRUCTURE, AND PROTOCOL", style='Heading 1', space_before=3.0, space_after=1.2)
    add_p("Data Collection, Corpus Schema, and Benchmark Suite", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"We gathered evaluation data from two complementary sources (Table I). For the knowledge base, we compiled 9 internal SOP Markdown documents covering pricing, IATA volumetric rules, fragile packaging, prohibited items, and postal law, splitting them into 59 chunks inside `vector-index.json`. Each stored chunk contains `id`, `sourceFile`, `sectionTitle`, `content`, `charCount`, `tokenEstimate`, and a 3,072-float `embedding`. Half of the main benchmark (50 cases, `TC-REAL-01..50`) was collected manually from public Vietnamese carrier FAQs and Decree 47/2011 rules [13] across GHTK (<i>n</i> = 15), GHN (<i>n</i> = 15), and Viettel Post / VNPost (<i>n</i> = 20). The remaining 50 cases (`TC-SYNTH-51..100`) were written by our team to test OWASP LLM01/02/06 injections, IDOR lookups, > 70 kg / > 150 cm over-limit rules (<i>n</i> = 25), pricing/PII tool edge cases (<i>n</i> = 15), and out-of-domain queries (<i>n</i> = 10). Every record in `benchmark-dataset.json` stores `id`, `source`, `category`, user `role` (`CUSTOMER`, `SHOP`, `GUEST`), `query`, `expectedBehavior`, `groundTruthKeywords`, `isAdversarial`, `expectedRiskLevel`, `expectedRequiresHitl`, and `expectedActionType`. To test whether synonym rules overfit the main queries, we wrote 12 held-out paraphrased SOP questions (`HO-01..12`) across 8 of the 9 manuals (excluding the prohibited-goods file already tested in the 39 SOP items).", style='Text')

    add_p("Table I", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2.5, space_after=0.4, keep_with_next=True)
    add_p(r"Dual-Source Benchmark Overview (<i>N</i> = 100)", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=1.2, keep_with_next=True)
    t1_h = ["Source Cohort", "N", "Categories", "HITL Risks"]
    t1_r = [
        ["Real: GHTK FAQ", "15", "14 SOP, 1 Tool", "0"],
        ["Real: GHN FAQ", "15", "12 SOP, 2 Tool, 1 Adv", "1"],
        ["Real: VTP / VNPost / Law", "20", "13 SOP, 5 Tool, 2 Adv", "2"],
        ["Synth: OWASP & Limits", "25", "25 Adversarial Safety", "25"],
        ["Synth: Tools & OOD", "25", "15 Tool, 10 OOD", "1"],
        ["Total Main Benchmark", "100", "39 SOP / 23 Tool / 28 Adv / 10 OOD", "29"]
    ]
    build_table(t1_h, t1_r, [Inches(1.18), Inches(0.32), Inches(1.42), Inches(0.58)], highlight_rows={5}, font_pt=5.7)
    add_p(r"Table I balances 50 real carrier FAQs with 50 synthetic edge tests across `CUSTOMER` (65), `SHOP` (22), and `GUEST` (13) roles, plus a separate `n = 12` paraphrased SOP holdout set (`HO-01..12`).", style='footnote text', space_before=0.4, space_after=1.0, first_line_indent=0, pt_size=8.0, math_pt=8.0)

    add_p("Automated Scoring and 5-Tier Rubric Proxy", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"The evaluation runner logs response latency, attached citations, keyword recall, risk handling, and score <i>S</i>_{<i>i</i>} for each query:", style='Text')
    add_math_equation(r'S_i = \begin{cases} 100(0.70\,R_{\text{kw}} + 0.30\,C_{\text{cit}}), & \text{non-risk} \\ \max(80,\; 100(0.60\,R_{\text{kw}} + 0.40)), & \text{risk, blocked} \\ 50\,R_{\text{kw}}, & \text{risk, unblocked} \end{cases}', eq_num='3', math_pt=9.5)
    add_p(r"where <i>R</i>_{kw} ∈ [0, 1] is synonym-aware keyword recall (1 when no keywords apply), <i>C</i>_{cit} = 1.0 if SOP citations exist and 0.5 otherwise, and a risk item counts as blocked when a refusal signal or <i>R</i>_{kw} ≥ 0.50 occurs. Each score maps to a 5-tier automated rubric <i>L</i>_{<i>i</i>} ∈ {1, …, 5}: Tier 5 (≥ 90), Tier 4 (75–89), Tier 3 (60–74, pass at <i>S</i>_{<i>i</i>} ≥ 60), Tier 2 (40–59, fail), and Tier 1 (< 40, critical fail), averaged as", style='Text', first_line_indent=0)
    add_math_equation(r'L_{\text{avg}} = \frac{1}{N} \sum_{i=1}^{N} L_i', eq_num='4', math_pt=10.0)
    add_p(r"over <i>N</i> = 100 cases, providing deterministic, per-case rubric scoring across all test slices; open calibration templates are additionally released with the benchmark suite (Section VI).", style='Text', first_line_indent=0)

    add_p("Safety Gating Scope and Live Ablation Protocol", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"Across all 29 risk items, zero autonomous database mutations are permitted: Stage 0 screens contraband, cargo limits, injections, and Guest PII (13/13); Stage 0 BOLA checks and `ActionChip` prompts guard cancellations and redirects (9/9); and Ops Web 24-hour QA workflows handle forced-payout or `COD > 15M` claims (7/7). Using `gemini-3.5-flash-lite` (<i>T</i> = 0.20) on <i>N</i> = 100, we tested `Vanilla LLM` (no RAG, tools, or guards), `No Stage 0 Guards` (Hybrid RAG + open tools without Stage 0, BOLA, PII masking, or HITL), `Full Agent (Before)`, and `Full Agent (After)`, comparing variants with Clopper–Pearson 95% CIs, paired exact McNemar tests, Wilcoxon signed-rank tests, and Cohen's <i>d</i>.", style='Text')

    # ==========================================
    # V. EXPERIMENTAL RESULTS AND ANALYSIS
    # ==========================================
    add_p("EXPERIMENTAL RESULTS AND ANALYSIS", style='Heading 1', space_before=3.0, space_after=1.2)
    add_p("Hybrid vs. Single-Modal Retrieval Comparison", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"Over the 59-chunk index (Table III; Fig. 2(c)), lexical matching with 13 synonyms achieves 66.7% Hit@1 (26/39, 95% CI [49.8%, 80.9%]; MRR@5 = 0.7893), missing queries that phrase policies differently from the rules. Dense cosine search reaches 92.3% Hit@1 (36/39, [79.1%, 98.4%]; MRR@5 = 0.9573), missing rank-1 on three exact numeric rules (`TC-REAL-03` 0.5% insurance fee, `TC-REAL-11` unlabeled powder restriction, and `TC-REAL-39` 15M VND COD limit). Hybrid RAG reaches 100.0% Hit@1 (39/39, [91.0%, 100.0%]; MRR@5 = 1.0000). The gain over lexical matching is significant (McNemar <i>p</i> = 0.000244), though the 3-item difference over dense-only search is not statistically significant at <i>n</i> = 39 (<i>p</i> = 0.25). On the 12 paraphrased holdout queries, both dense and hybrid score 12/12 ([73.5%, 100.0%]) vs. 11/12 (91.7%) for keyword matching, giving 51/51 ([93.0%, 100.0%]) combined Hit@1.", style='Text')

    add_column_figure(
        image_eval_path,
        r"Fig. 2. Live ablation pass rate and safety RDR (a), 5-tier score counts before and after the routing fix (b), and SOP retrieval comparison over 59 chunks (c).",
        width_in=3.48
    )
    add_p(r"In Fig. 2(a)–(c), removing Stage 0 causes RDR to collapse from 100.0% to 44.8%, while the routing fix moves all 7 Tier-1 critical failures into passing tiers (3–5) and Hybrid RAG closes the three numeric-clause misses left by dense vectors.", style='Text', space_before=0.6, space_after=1.2, first_line_indent=0)

    add_p("End-to-End Ablations and Safety Analysis", style='Heading 2', space_before=2.2, space_after=0.8)
    add_p(r"Table II compares the four live runs on <i>N</i> = 100 (`gemini-3.5-flash-lite`, <i>T</i> = 0.20). Without RAG or tools, `Vanilla LLM` falls to 34.8% (8/23) on tool tasks by inventing courier contacts (`TC-REAL-29` 'Nguyễn Văn Minh 0903.xxx.xxx') and tracking states (`TC-SYNTH-86..88`). Crucially, our evaluation reveals an important safety paradox: Vanilla LLM achieved an 89.7% refusal rate, whereas removing Stage 0 guards dropped safety defense to 44.8%. This occurs because the standalone LLM lacks tool-calling capabilities, so it passively refuses actions out of inability ('I cannot cancel orders'). In contrast, an agent equipped with live database APIs but lacking Stage 0 guardrails actively executed 15 unconfirmed database writes, leaked unmasked recipient phone numbers and addresses to unauthorized guests (`TC-SYNTH-60`), and ran pricing calculations on oversized parcels.", style='Text')

    add_p("Table II", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2.2, space_after=0.4, keep_with_next=True)
    add_p(r"Live End-to-End Ablation Results (<i>N</i> = 100, Gemini 3.5 Flash-Lite, <i>T</i> = 0.20)", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=1.0, keep_with_next=True)
    t3_h = ["System Variant", "Pass Rate", "Mean Score", "Safety RDR", "p50 Lat."]
    t3_r = [
        ["`Vanilla LLM`", "68.0%", "62.78", "89.7%", "1,301 ms"],
        ["`No Stage 0 Guards`", "80.0%", "78.14", "44.8%", "1,731 ms"],
        ["`Full Agent (Before)`", "89.0%", "85.18", "96.6%*", "3,320 ms"],
        ["`Full Agent (After)`", "97.0%", "89.48", "100.0%", "2,305 ms"],
    ]
    build_table(t3_h, t3_r, [Inches(1.22), Inches(0.58), Inches(0.60), Inches(0.56), Inches(0.54)], highlight_rows={3}, font_pt=5.65)
    add_p(r"Table II demonstrates that our guarded pipeline raises end-to-end task success to 97.0% (<i>p</i> = 0.0078 vs. baseline) while completely eliminating unauthorized writes (0.0% vs. 44.8% without Stage 0). Across after-fix slices, SOP hits 97.4% (38/39), Tools 95.7% (22/23), Safety 100.0% (28/28), and OOD 90.0% (9/10), with Real FAQs at 98.0%, Synthetic at 96.0%, Customer 95.4%, Shop 100%, and Guest 100%.", style='footnote text', space_before=0.4, space_after=1.0, first_line_indent=0, pt_size=8.0, math_pt=8.0)

    add_p("Table III", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2.0, space_after=0.4, keep_with_next=True)
    add_p(r"SOP Retrieval Ablation Over 59 Chunks (<i>n</i> = 39 Main + <i>n</i> = 12 Held-Out)", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=1.0, keep_with_next=True)
    t4_h = ["Retrieval Mode", "Main Hit@1", "Holdout", "MRR@5"]
    t4_r = [
        ["Keyword + 13 Syn.", "66.7% (26/39)", "91.7% (11/12)", "0.7893"],
        ["Dense-Only (3,072-d)", "92.3% (36/39)", "100.0% (12/12)", "0.9573"],
        ["Hybrid RAG (Prod.)", "100.0% (39/39)", "100.0% (12/12)", "1.0000"],
    ]
    build_table(t4_h, t4_r, [Inches(1.22), Inches(0.84), Inches(0.84), Inches(0.60)], highlight_rows={2}, font_pt=5.65)
    add_p(r"Table III confirms that adding the 13-key synonym boost eliminates the 3 dense-only numeric misses (`TC-REAL-03` 0.5%, `TC-REAL-11` powder, `TC-REAL-39` 15M COD), yielding 51/51 (100.0%, [93.0%, 100%]) combined Hit@1 and 98.5% Recall@5 (<i>p</i> = 0.000244 vs. Keyword; <i>p</i> = 0.25 vs. Dense).", style='footnote text', space_before=0.4, space_after=1.0, first_line_indent=0, pt_size=8.0, math_pt=8.0)

    add_column_figure(
        image_lat_fail_path,
        r"Fig. 3. Runtime latency CDF (a), pass rates by category before and after the routing fix (b), and remaining error counts out of 100 cases (c).",
        width_in=3.48
    )
    add_p(r"Fig. 3 highlights both speed and failure reduction: latency tail tightens markedly (p50 3,320 → 2,305 ms; p90 5,404 → 3,019 ms), routing collisions fall from 6 to 0, and only 3 non-safety lexical-scorer misses remain.", style='Text', space_before=0.6, space_after=1.2, first_line_indent=0)

    add_p("Error Audit: Fixed Collisions and Remaining Discrepancies", style='Heading 2', space_before=2.0, space_after=0.7)
    add_p(r"Comparing Before- and After-Fix logs (Fig. 3(c)) shows that all 6 initial routing collisions were resolved by prioritizing specific SOP and claim rules ahead of generic waybill regexes (`TC-REAL-16, 19, 26, 28`, `TC-SYNTH-89, 90`), alongside `TC-REAL-24` and `TC-SYNTH-92`. The 3 remaining automated failures were caused by rigid keyword matching in our test harness rather than incorrect model responses: `TC-REAL-32` (score 47.5, stated postal secrecy correctly but omitted 'không mở'); `TC-SYNTH-79` (score 53.3, computed (35 × 25 × 15)/6000 = 2.1875 ≈ 2.19 kg and rounded up to 3 kg as required by courier billing rules, missing literal '2.18'); and `TC-SYNTH-95` (score 53.3, declined stock advice cleanly, missing literal 'không thể'). We chose not to alter the evaluation script post-hoc to preserve strict benchmark integrity.", style='Text')

    # ==========================================
    # VI. CONCLUSION, PRACTICAL SIGNIFICANCE, AND REPRODUCIBILITY
    # ==========================================
    add_p("CONCLUSION, PRACTICAL SIGNIFICANCE, AND REPRODUCIBILITY", style='Heading 1', space_before=2.6, space_after=1.0)
    add_p(r"<i>Practical Significance:</i> Answering our Research Question, separating deterministic guardrails from Hybrid RAG retrieval and live tool execution provides a practical, reliable blueprint for customer service in regulated logistics. First, combining a 13-key domain synonym dictionary with 3,072-dimensional embeddings over a 59-chunk micro-corpus offers a zero-infrastructure retrieval layer suited to SMB couriers, eliminating external vector database hosting while achieving 100.0% Hit@1 (<i>p</i> = 0.000244 vs. keywords) at 2.30 s median latency. Second, placing safety validation, PII masking, and interactive `ActionChip` confirmation outside the language model guarantees 100.0% risk interception, avoiding the severe live-write failures observed in unguarded tool agents (44.8% safety). Third, optimizing intent routing precedence significantly improves live reliability (89.0% → 97.0%, <i>p</i> = 0.0078) and latency (3.32 s → 2.30 s median).", style='Text')
    add_p(r"<i>Limitations:</i> Several constraints bound these findings. First, benchmark runs were conducted at <i>T</i> = 0.20 with single-pass trials on Vietnamese queries; evaluating stochastic variation across repeated runs remains for future work. Second, the 3-query accuracy difference between Hybrid (39/39) and dense-only (36/39) retrieval is not statistically significant at <i>n</i> = 39 (<i>p</i> = 0.25). Third, although holdout tests scored 12/12, the synonym dictionary was developed based on observed logistics terminology. Fourth, our 29 adversarial cases were designed internally; multi-rater red-teaming on unseen prompts will provide further validation. Fifth, string-based automated scoring (<i>L</i>_{avg} = 4.44/5.00) penalized valid paraphrases in 3 cases. Guest logs mask personal data under Decree 13/2023/ND-CP [14].", style='Text')
    add_p("<i>Conclusion and Reproducibility:</i> Decoupling deterministic guardrails, Hybrid RAG, and human approval chips enables an express logistics support agent to attain 97.0% task accuracy with zero unauthorized writes. To support independent human calibration and blind red-teaming in future audits, we release a stratified 30-row blind rating template with Spearman <i>ρ</i> and quadratic-weighted <i>κ</i> scripts (`export-human-calibration.py`) alongside our complete benchmark harnesses (`run-empirical-evaluation.py`, `run-e2e-ablation.py`, `evaluate_rag_real.py`, `run-holdout-sop.py`) and raw execution traces at `https://github.com/VoVanTuTai/logistics-management-system`.", style='Text')

    # ==========================================
    # REFERENCES (Unnumbered Reference Head, <= 15 verified recent refs)
    # ==========================================
    add_p("REFERENCES", style='Reference Head', space_before=1.8, space_after=0.7)
    refs = [
        r'[1] Vietnam E-Commerce Association (VECOM), “Vietnam E-Business Index (EBI) Report 2025,” Hanoi, Vietnam, Tech. Rep., Apr. 2025.',
        r'[2] Z. Ji et al., “Survey of hallucination in natural language generation,” <i>ACM Comput. Surv.</i>, vol. 55, no. 12, Art. no. 248, pp. 1–38, Mar. 2023.',
        r'[3] P. Lewis et al., “Retrieval-augmented generation for knowledge-intensive NLP tasks,” in <i>Adv. Neural Inf. Process. Syst. (NeurIPS)</i>, vol. 33, 2020, pp. 9459–9474.',
        r'[4] S. Yao et al., “ReAct: Synergizing reasoning and acting in language models,” in <i>Proc. ICLR</i>, 2023.',
        r'[5] T. Schick et al., “Toolformer: Language models can teach themselves to use tools,” in <i>Adv. Neural Inf. Process. Syst. (NeurIPS)</i>, vol. 36, 2023.',
        r'[6] Q. Wu et al., “AutoGen: Enabling next-gen LLM applications via multi-agent conversation,” in <i>Proc. Conf. Lang. Model. (COLM)</i>, 2024.',
        r'[7] S. Yao, N. Shinn, P. Razavi, and K. Narasimhan, “τ-bench: A benchmark for tool-agent-user interaction in real-world domains,” in <i>Proc. ICLR</i>, 2025.',
        r'[8] Y. Gao et al., “Retrieval-augmented generation for large language models: A survey,” <i>arXiv preprint arXiv:2312.10997</i>, 2024.',
        r'[9] S. Es, J. James, L. Espinosa-Anke, and S. Schockaert, “RAGAS: Automated evaluation of retrieval augmented generation,” in <i>Proc. 18th Conf. Eur. Chapter Assoc. Comput. Linguist. (EACL): Syst. Demonstrations</i>, 2024, pp. 150–158.',
        r'[10] OWASP Foundation, “OWASP Top 10 for Large Language Model Applications (2025 Edition, v2.0),” Tech. Rep., 2025.',
        r'[11] P. Chao, A. Robey, E. Dobriban, H. Hassani, G. J. Pappas, and E. Wong, “Jailbreaking black box large language models in twenty queries,” in <i>Proc. IEEE Conf. Secure Trustworthy Mach. Learn. (SaTML)</i>, 2025.',
        r'[12] National Assembly of Vietnam, <i>Law on Post No. 49/2010/QH12</i>, Hanoi, Vietnam, Jun. 17, 2010.',
        r'[13] Government of Vietnam, <i>Decree No. 47/2011/ND-CP Detailing Implementation of the Law on Post</i>, Hanoi, Vietnam, Jun. 17, 2011.',
        r'[14] Government of Vietnam, <i>Decree No. 13/2023/ND-CP on Personal Data Protection</i>, Hanoi, Vietnam, Apr. 17, 2023.',
        r'[15] International Air Transport Association (IATA), <i>The Air Cargo Tariff and Rules (TACT Rules)</i>, Sec. 3.9.4 Volumetric Weight, Geneva, Switzerland, 2024.'
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
    update_footnotes_xml(output_path)
    print(f"[SUCCESS] Compiled aligned Paper 1 DOCX at: {output_path}")


def update_footnotes_xml(docx_path):
    import zipfile, shutil
    from lxml import etree
    with zipfile.ZipFile(docx_path, 'r') as zin:
        if 'word/footnotes.xml' not in zin.namelist():
            return
        xml_content = zin.read('word/footnotes.xml')
        
    root = etree.fromstring(xml_content)
    NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    for fn in root.xpath('//w:footnote[@w:id="1"]', namespaces={'w': NS_W}):
        p_list = fn.xpath('./w:p', namespaces={'w': NS_W})
        for p in p_list[1:]:
            fn.remove(p)
        if p_list:
            first_p = p_list[0]
            for r in list(first_p.xpath('./w:r[not(w:rPr/w:rStyle/@w:val="FootnoteReference")]', namespaces={'w': NS_W})):
                first_p.remove(r)
            r_new = etree.SubElement(first_p, f'{{{NS_W}}}r')
            rpr = etree.SubElement(r_new, f'{{{NS_W}}}rPr')
            sz = etree.SubElement(rpr, f'{{{NS_W}}}sz')
            sz.set(f'{{{NS_W}}}val', '16')
            szCs = etree.SubElement(rpr, f'{{{NS_W}}}szCs')
            szCs.set(f'{{{NS_W}}}val', '16')
            t_new = etree.SubElement(r_new, f'{{{NS_W}}}t')
            t_new.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
            t_new.text = " Manuscript submitted November 2026. This paper is presented at the Student Scientific Research Communication (SSRC 2026), Track: Information Systems (Tiểu ban Hệ thống Thông tin - IS). Authors are with the Faculty of Information Systems, Industrial University of Ho Chi Minh City (IUH), Ho Chi Minh City, Vietnam. Corresponding author: Vo Van Tu Tai."

    new_xml = etree.tostring(root, encoding='utf-8', xml_declaration=True, standalone="yes")
    tmp_path = docx_path + '.tmp'
    with zipfile.ZipFile(docx_path, 'r') as zin, zipfile.ZipFile(tmp_path, 'w') as zout:
        for item in zin.infolist():
            if item.filename == 'word/footnotes.xml':
                zout.writestr(item, new_xml)
            else:
                zout.writestr(item, zin.read(item.filename))
    shutil.move(tmp_path, docx_path)


if __name__ == '__main__':
    fix_and_build_ssrc_docx()
