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
    fig2_path = 'docs/research/paper/diagrams/fig2-write-scaling-ablation.png'
    fig3_path = 'docs/research/paper/diagrams/fig3-cqrs-read-isolation.png'
    fig4_path = 'docs/research/paper/diagrams/fig4-propagation-lag-ecdf.png'
    fig5_path = 'docs/research/paper/diagrams/fig5-outbox-burst-drain.png'
    fig6_path = 'docs/research/paper/diagrams/fig6-dual-layer-idempotency.png'
    fig7_path = 'docs/research/paper/diagrams/fig7-ttl-dlq-recovery.png'

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
            if lim_text.strip() in ('―', '¯', '—', 'ˉ', '\u00AF', '\u02C9', '\u2014', '\u2015', '\u203E'):
                bar = etree.Element(f'{{{NS_M}}}bar')
                barPr = etree.SubElement(bar, f'{{{NS_M}}}barPr')
                pos = etree.SubElement(barPr, f'{{{NS_M}}}pos')
                pos.set(f'{{{NS_M}}}val', 'top')
                ctrlPr = etree.SubElement(barPr, f'{{{NS_M}}}ctrlPr')
                ctrlPr.append(make_w_rpr(pt_size, bold=bold))
                e_node = limupp.find(f'{{{NS_M}}}e')
                bar.append(e_node)
                limupp.getparent().replace(limupp, bar)

        for grp in el.xpath('.//m:groupChr', namespaces=NS):
            chr_el = grp.find(f'./{{{NS_M}}}groupChrPr/{{{NS_M}}}chr')
            chr_val = chr_el.get(f'{{{NS_M}}}val', '') if chr_el is not None else ''
            if chr_val in ('―', '¯', '—', 'ˉ', '\u00AF', '\u02C9', '\u2014', '\u2015', '\u203E'):
                bar = etree.Element(f'{{{NS_M}}}bar')
                barPr = etree.SubElement(bar, f'{{{NS_M}}}barPr')
                pos = etree.SubElement(barPr, f'{{{NS_M}}}pos')
                pos.set(f'{{{NS_M}}}val', 'top')
                ctrlPr = etree.SubElement(barPr, f'{{{NS_M}}}ctrlPr')
                ctrlPr.append(make_w_rpr(pt_size, bold=bold))
                e_node = grp.find(f'{{{NS_M}}}e')
                # Unwrap inner <m:box><m:e>...</m:e></m:box> if present so Word centers the bar cleanly
                inner_box = e_node.find(f'{{{NS_M}}}box') if e_node is not None else None
                if inner_box is not None and len(e_node) == 1:
                    inner_e = inner_box.find(f'{{{NS_M}}}e')
                    if inner_e is not None:
                        e_node.remove(inner_box)
                        for ch in list(inner_e):
                            e_node.append(ch)
                bar.append(e_node)
                parent_el = grp.getparent()
                parent_el.replace(grp, bar)
                # Also unwrap outer <m:box><m:e><m:bar>...</m:bar></m:e></m:box> if parent is box/e
                if parent_el.tag == f'{{{NS_M}}}e':
                    box_el = parent_el.getparent()
                    if box_el is not None and box_el.tag == f'{{{NS_M}}}box' and len(parent_el) == 1:
                        box_parent = box_el.getparent()
                        if box_parent is not None:
                            box_parent.replace(box_el, bar)

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

    def soft_wrap_code(seg):
        tokens = seg.split(' ')
        out = []
        for tok in tokens:
            if '\u200b' not in tok and (len(tok) >= 13 or ('/' in tok and len(tok) >= 10)):
                # Break at URL/path slashes, long snake_case underscores, hyphens between word chunks, dots/colons in long identifiers
                tok = re.sub(r'(https?://)(?=[A-Za-z0-9])', '\\1\u200b', tok)
                tok = re.sub(r'([A-Za-z0-9.-]{3,}/)(?=[:A-Za-z0-9])', '\\1\u200b', tok)
                tok = re.sub(r'([A-Za-z0-9]{3,}_)(?=[A-Za-z0-9]{4,})', '\\1\u200b', tok)
                tok = re.sub(r'([A-Za-z]{4,}-)(?=[A-Za-z0-9]{4,})', '\\1\u200b', tok)
                tok = re.sub(r'([A-Za-z]{4,}\.)(?=[$A-Za-z]{5,})', '\\1\u200b', tok)
                tok = re.sub(r'([A-Za-z]{3,}:)(?=[A-Za-z]{5,})', '\\1\u200b', tok)
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

    def add_math_equation(latex_str, eq_num=None, space_before=2.2, space_after=2.2, right_in=3.50, math_pt=9.8):
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

    def add_column_figure(image_path, caption_text, width_in=3.48, space_before=1.8, space_after=2.0):
        p_img = doc.add_paragraph(style='Normal')
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.left_indent = Pt(0)
        p_img.paragraph_format.right_indent = Pt(0)
        p_img.paragraph_format.first_line_indent = Pt(0)
        p_img.paragraph_format.space_before = Pt(space_before)
        p_img.paragraph_format.space_after = Pt(1.0)
        p_img.paragraph_format.keep_with_next = True
        r_img = p_img.add_run()
        r_img.add_picture(image_path, width=Inches(width_in))

        p_cap = doc.add_paragraph(style='Figure Caption')
        p_cap.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_cap.paragraph_format.left_indent = Pt(0)
        p_cap.paragraph_format.right_indent = Pt(0)
        p_cap.paragraph_format.first_line_indent = Pt(0)
        p_cap.paragraph_format.space_before = Pt(0.6)
        p_cap.paragraph_format.space_after = Pt(space_after)
        p_cap.paragraph_format.line_spacing = 0.97
        append_latex_text(p_cap, caption_text, pt_size=8.0, math_pt_size=8.0, italic=False, code_pt_delta=0.4)
        for r_cap in p_cap.runs:
            r_cap.font.name = 'Times New Roman'
            r_cap.italic = False
            r_cap.font.size = Pt(8.0)
        return p_cap

    def build_table(headers, rows, col_widths, highlight_rows=None, font_pt=5.4, left_cols=(0,), keep_with_notes=False):
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
            f'<w:top w:w="20" w:type="dxa"/><w:left w:w="28" w:type="dxa"/>'
            f'<w:bottom w:w="20" w:type="dxa"/><w:right w:w="28" w:type="dxa"/>'
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
            p.paragraph_format.space_before = Pt(0.4)
            p.paragraph_format.space_after = Pt(0.4)
            p.paragraph_format.line_spacing = 0.94
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
                p.paragraph_format.space_before = Pt(0.4)
                p.paragraph_format.space_after = Pt(0.4)
                p.paragraph_format.line_spacing = 0.94
                p._p.get_or_add_pPr().append(parse_xml(f'<w:suppressAutoHyphens {nsdecls("w")}/>'))
                if r_idx < len(rows) - 1:
                    p.paragraph_format.keep_with_next = True
                elif keep_with_notes:
                    p.paragraph_format.keep_with_next = True
        return tbl

    # ==========================================
    # TITLE & AUTHORS
    # ==========================================
    p_title = add_p(
        "An Empirical Evaluation of Event-Driven Outbox and CQRS Architectures for High\u2011Concurrency Courier Logistics",
        style='Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_after=3.0
    )
    p_title._p.get_or_add_pPr().append(parse_xml(f'<w:suppressAutoHyphens {nsdecls("w")}/>'))

    add_p(
        "Vo Van Tu Tai, Tran Tan Tai, Tran Van Truong, Nguyen Hai Dang, and Huynh Nam",
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
    # ABSTRACT & INDEX TERMS (7-Part SSRC Structure)
    # ==========================================
    abs_runs = [
        ("Abstract— ", True, True),
        (r"In express courier logistics, regional sorting hubs and delivery couriers generate massive surges of barcode scans during peak shifts that must be ingested and reflected in tracking queries without data loss. In conventional monolithic architectures, updating shipment status, scan history, and operational KPI counters within a single database transaction creates severe row-level lock contention, causing worker pools to stall under high concurrency. In this paper, we evaluate an event-driven architecture that decouples barcode scan ingestion using the Transactional Outbox pattern and isolates tracking queries via Command Query Responsibility Segregation (CQRS). Developed in NestJS with PostgreSQL and RabbitMQ, the system employs dedicated per-service schemas, two-tier idempotency (memory cache and database constraints), a dead-letter retry ladder, and monotonic state machine version guards. Across five trials from 1 to 100 concurrent clients, we benchmark the live system against single-row (`Sync_ALL`), 16-shard (`Sync_Sharded`), and raw SQL Outbox baselines using continuous `pg_locks` profiling. Synchronous baselines stall at 753.0 ± 58.1 req/s with 97.7% lock-wait ratios, whereas raw SQL Outbox writes sustain 2,380.8 ± 92.9 req/s (+216.2% throughput, −63.9% tail latency, <i>p</i> = 3.0 × 10^{−7}). Under 50 background writers, CQRS read projections eliminate lock contention entirely (0.0%), reducing <i>p</i>_{95} read latency by 29.7% with 300/300 verified idempotent commits. Our findings demonstrate that removing transactional cross-table dependencies via Outbox and CQRS is essential for high-throughput logistics, while revealing practical connection pool and ORM overheads in production microservices.", True, False)
    ]
    add_rich_p(abs_runs, style='Abstract', align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=2.0)

    idx_runs = [
        ("Index Terms— ", True, True),
        ("Event-Driven Architecture, Transactional Outbox, CQRS, Information Systems, Lock Contention, Idempotency, Courier Logistics, Telemetry.", True, False)
    ]
    add_rich_p(idx_runs, style='IndexTerms', space_after=3.2)

    # ==========================================
    # I. INTRODUCTION
    # ==========================================
    add_p("INTRODUCTION", style='Heading 1', space_before=1.6, space_after=0.6)
    add_p(r"In express parcel delivery networks, regional sorting hubs and delivery couriers generate massive spikes of barcode scans during shift changeovers and dispatch hours [1], [2]. In traditional monolithic backends, recording each scan while simultaneously updating shipment tracking status, sorting histories, and operational KPI counters in a single database transaction triggers intense row-level lock contention [14]. This contention saturates database connection pools and causes scan requests to queue up during peak sorting windows.", style='Text')
    add_p(r"Splitting monolithic databases into microservices removes shared table locks [7], [8], but it creates four classic distributed consistency challenges that we encountered while developing our courier backend:", style='Text')
    add_num_list_p("1)", "Dual-Write Consistency Hazards: ", r"Updating a local database and publishing to an event broker across separate network calls risks losing events or creating orphan records if a service crashes [1].")
    add_num_list_p("2)", "Outbox Dwell vs. Connection Overhead: ", r"Fixed polling intervals (<i>T</i>_{poll}) and HTTP relays introduce end-to-end synchronization lag, while small connection pools can erode outbox throughput gains [3], [4].")
    add_num_list_p("3)", "Duplicate Delivery & Consumer Races: ", r"Network retries from handheld scanners and child scan events arriving before waybills are committed can corrupt KPI summaries or cause premature lookup failures [11].")
    add_num_list_p("4)", "Event Reordering: ", r"Out-of-order event delivery risks corrupting terminal shipment states (`DELIVERED`, `CANCELLED`) unless strict version guards and dead-letter escalation ladders are enforced [12], [15].")

    add_p(r"To address these issues without introducing heavy distributed consensus protocols (such as two-phase commit or large Kafka clusters), we examine one core Research Question (RQ) across <i>R</i> = 5 independent runs: <i>To what extent does decoupling barcode scan ingestion through a database-backed Transactional Outbox and CQRS projections eliminate PostgreSQL transaction-lock contention and read-tail degradation compared with unsharded, 16-shard, and deferred-KPI synchronous baselines under live microservice constraints?</i>", style='Text')

    add_p("Our main contributions are as follows:", style='Text')
    add_bullet_p("Lock-Wait Proof & Ablation: ", r"Using `pg_locks` profiling, we demonstrate that monolithic `Sync_ALL` (97.7%) and 16-shard `Sync_Sharded` (91.8%) designs suffer from severe lock waits, whereas raw SQL Outbox increases throughput by +216.2% (<i>p</i> = 3.0 × 10^{−7}) after accounting for small connection pools (`pool=3`, −38.6%) and ORM overheads (−53.4%).")
    add_bullet_p("CQRS Read Isolation: ", r"We demonstrate that CQRS projections reduce <i>p</i>_{95} read latency by 29.7% under <i>c</i> = 50 background writers with 0.0% lock contention, validate theoretical queue drain lag non-circularly, and achieve a 29.78× speedup using batch-50 AMQP publisher confirms.")
    add_bullet_p("Architecture & Codebase Audit (F1–F3): ", r"We verify 300/300 database commits, 60/60 state machine guards, and exact 60 s dead-letter queue TTLs, while uncovering and patching three real-world implementation defects (`F1`–`F3`).")

    # ==========================================
    # II. RELATED WORK
    # ==========================================
    add_p("RELATED WORK", style='Heading 1', space_before=1.6, space_after=0.6)
    add_p(r"<i>Distributed Data & Microservices:</i> The PACELC theorem [10] formalizes latency-consistency trade-offs across replicated partitions and normal operation. Empirical studies by Laigner et al. [2], [3] and event benchmarks [4], [5] show database-per-service decomposition [7], [8] shifts consistency guarantees from SQL locks to asynchronous handlers, creating real engineering challenges around event ordering, payload inflation, and distributed auditing.", style='Text')
    add_p(r"<i>Transactional Outbox, Polling vs. Log-Based CDC:</i> Richardson [1] defines the Transactional Outbox with Polling Publishers to prevent dual-write loss without XA distributed locks [9]. Alternatively, log-based Change Data Capture (CDC) tools such as Debezium [13] tail PostgreSQL Write-Ahead Log (WAL) logical replication slots directly, eliminating <i>T</i>_{poll}/2 wait and `SELECT` polling overhead. However, WAL CDC requires managing distributed Kafka Connect pipelines and guarding against PostgreSQL replication-slot WAL disk bloat if connectors stall [8], [13]. For our platform, a database-backed Polling Publisher paired with RabbitMQ [15] topic routing and Dead-Letter Exchange (DLX) retries provides operational simplicity and high throughput without dedicated CDC infrastructure.", style='Text')
    add_p(r"<i>CQRS, Idempotency & Monotonic Ordering:</i> Event-driven CQRS [6], [8] separates write commands from read projections under eventual consistency. Helland [11] motivates idempotent receivers via unique operation keys, while Lamport [12] formalizes logical event ordering across asynchronous processes—directly motivating monotonic version guards to prevent OOO projection overwrites. Unlike simulator-only studies, we benchmark live cluster telemetry paired with PostgreSQL `pg_locks` profiling [14] and surface active bugs (`F1`–`F3`).", style='Text')

    # ==========================================
    # III. PROPOSED METHODOLOGY AND SYSTEM ARCHITECTURE
    # ==========================================
    add_p("PROPOSED METHODOLOGY AND SYSTEM ARCHITECTURE", style='Heading 1', space_before=1.6, space_after=0.6)
    add_p("Bounded-Context Topology and Workflow Walkthrough", style='Heading 2', space_before=1.2, space_after=0.4)
    add_p(r"To eliminate cross-table lock blocking on write paths while serving isolated tracking queries, the Nexus platform splits its backend into PM2 Node.js services backed by four dedicated PostgreSQL 16 schemas (`scan_db`, `shipment_db`, `tracking_db`, and `reporting_db`, Fig. 1). Gateway Redis is used solely for WebSocket chat pub/sub.", style='Text')

    add_column_figure(
        fig1_path,
        r"Fig. 1. Vertical operational flow of the Nexus Outbox and CQRS pipeline across isolated PostgreSQL 16 schemas and RabbitMQ 3.13.",
        width_in=2.95,
        space_before=0.6,
        space_after=0.4
    )

    add_p("Following Fig. 1 from top to bottom, each barcode scan proceeds through four stages:", style='Text', space_after=0.5)
    add_num_list_p("1)", "PDA Ingress and Lock Check: ", r"Handheld scanners submit `POST /scans/inbound` requests with a scoped `idempotencyKey`. `ScanService` checks parcel lock state over synchronous HTTP (`GET /shipments/:code`) against `ShipmentService` (`pool = 15`), blocking locked shipments unless the request carries an audit token (`INVENTORY_CHECK`) or active return status (`RETURN_STARTED`).")
    add_num_list_p("2)", "Scan Deduplication and Outbox Write (scan_db): ", r"`ScanService` (`pool = 3`) filters repeated requests using Layer-1 lookup and Layer-2 unique-key recovery, updates `CurrentLocation`, inserts a `PENDING` `OutboxEvent`, saves `IdempotencyRecord`, and records an audit entry.")
    add_num_list_p("3)", "Outbox Relay and RabbitMQ Retry Ladder: ", r"A polling worker (`T = 1 s`, `B = 50`) forwards rows to the durable RabbitMQ `domain.events` topic exchange (`delivery_mode = 2`) [15]. Failed consumers ACK the main queue and requeue via `x-retry-count` through `.retry.10s` (10 s TTL), `.retry.1m` (60 s TTL), and `.dlq` quarantine (retry ≥ 2).")
    add_num_list_p("4)", "19-State FSM and CQRS Read Views: ", r"`ShipmentService` consumes broker pushes (`noAck: false`) through a 19-state whitelist, while `TrackingService` (`pool = 3`) maintains `TimelineEvent/TrackingCurrent` projections and `ReportingService` (`pool = 3`) polls 8-way `KpiDaily/KpiMonthly` summaries via `AggregationJob`.")

    add_p("Dual-Layer Idempotency and Outbox Persistence", style='Heading 2', space_before=1.2, space_after=0.4)
    add_p(r"In Layer 1, incoming requests query `IdempotencyRecord` by `flow:idempotencyKey` and return the saved JSON response directly (4.10 ms pooled median; 4.88 ± 2.87 ms run mean). When parallel bursts bypass Layer 1 at the same instant, concurrent inserts collide on the unique key of `ScanEvent.idempotencyKey` (Prisma `P2002`), causing losers to read back and return the winning transaction's result across 7 sequential Prisma statements (`F3` notes transaction wrapping).", style='Text')

    add_p("Outbox Relays and Propagation Lag Formulation", style='Heading 2', space_before=1.2, space_after=0.4)
    add_p(r"We compare `ScanService`'s sequential RabbitMQ HTTP Management `/publish` relay with `ShipmentService`'s persistent AMQP `ConfirmChannel` [15] (both draining up to <i>B</i> = 50 rows per <i>T</i>_{poll} = 1,000 ms). Client-to-projection visibility decomposes as", style='Text')

    add_math_equation(r'L_{\text{E2E}} = L_{\text{ingest}} + L_{\text{dwell}} + L_{\text{broker}} + L_{\text{cons}}', eq_num='1', math_pt=9.6)
    add_p(r"where <i>L</i>_{ingest} is HTTP write latency, <i>L</i>_{dwell} is outbox wait before publish confirmation, <i>L</i>_{broker} is broker-to-consumer transfer delay, and <i>L</i>_{cons} is consumer database write time (post-commit convergence omits <i>L</i>_{ingest}). For steady arrivals across <i>T</i>_{poll} intervals, mean dwell follows", style='Text', first_line_indent=0)

    add_math_equation(r'L_{\text{dwell}} \approx \frac{T_{\text{poll}}}{2} + L_{\text{batch}}', eq_num='2', math_pt=9.6)
    add_p(r"where $L_{\text{batch}} = \delta_{\text{timer}} + t_{\text{select}} + \frac{\bar{k}+1}{2}(t_{\text{pub}} + t_{\text{mark}})$ captures timer jitter, SQL `SELECT`, and per-row publish/mark overhead measured <i>independently</i> of E2E dwell. Under queue bursts (<i>N</i>_{0} > <i>B</i>), drain time scales in discrete polling steps:", style='Text', first_line_indent=0)

    add_math_equation(r'T_{\text{drain}}(N_0) \approx \left\lceil \frac{N_0}{B} \right\rceil T_{\text{poll}}', eq_num='3', math_pt=9.8)
    add_p(r"where ⌈<i>N</i>_{0}/<i>B</i>⌉ rounds up to discrete ticks, giving ⌈200/50⌉ = 4 ticks (4.00 s) for <i>N</i>_{0} = 200 rows at <i>B</i> = 50. Downstream, `ShipmentService` protects absorbing states (`DELIVERED`, `RETURN_COMPLETED`, `CANCELLED`) using `VALID_TRANSITIONS`, `TrackingService` deduplicates on `eventId` (`P2002`), and `ReportingService` fetches 20-message batches via HTTP (`/get`, `T = 1,000 ms`, `ack_requeue_false`) into `AggregationJob`.", style='Text', first_line_indent=0)

    # ==========================================
    # IV. EXPERIMENTAL DATA, DESIGN, AND RESULTS
    # ==========================================
    add_p("EXPERIMENTAL DATA, DESIGN, AND RESULTS", style='Heading 1', space_before=1.6, space_after=0.6)
    add_p("Data Collection, Telemetry Schema, and Testbed Setup", style='Heading 2', space_before=1.2, space_after=0.4)
    add_p(r"We ran all benchmarks against the local cluster on an Apple M4 host (10 cores, 16 GB RAM, macOS 15.8, Node.js v26.0.0) backed by PostgreSQL 16.15 (`max_connections = 100`) [14] and RabbitMQ 3.13.7 (`rates_mode = basic`) [15]. Prior to timed tests, a 1,995 ms warmup (40 writes + 60 reads/target) warmed connection pools; pre-benchmark SQL dumps were restored afterward. During each run, `run_benchmarks.mjs` and `baseline_worker.mjs` recorded structured traces into CSV files (`exp1_scaling_runs.csv` with `run`, `architecture`, `concurrency`, `ok_cnt`, `wall_ms`, `throughput_rps`, `p50_ms`, `p95_ms`; `exp1_resource_telemetry.csv` polling `pg_stat_activity`, `pg_locks WHERE NOT granted`, and `os.cpus()` every 5 ms for `lock_wait_sample_pct`, `lock_txid_waits`, `ungranted_locks_max`, `host_cpu_busy_pct`; `exp2a_e2e_stage_lags.csv` joining per-event `ingest_http_ms`, `outbox_dwell_ms`, `track_broker_ms`, `ship_fsm_ms`, `rep_poll_ms`; and `exp4b_dlq_recovery_timeline.csv` with raw AMQP `x-death` headers). Each scaling experiment used <i>R</i> = 5 block-rotated runs compared with paired <i>t</i>-tests (<i>df</i> = 4; exact two-sided Wilcoxon min <i>p</i> = 0.0625) and Clopper–Pearson 95% CIs [4].", style='Text')

    add_p("Table I", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0.9, space_after=0.15, keep_with_next=True)
    add_p(r"Evaluated Architectures, Pool Settings, and <i>R</i> = 5 Workloads", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0.5, keep_with_next=True)
    t1_headers = ["Suite / Target", "Pool & Path", "Workload (<i>R</i> = 5 Runs)"]
    t1_rows = [
        ["`Nexus_EDA` (:3006)", "PM2 Prisma (pool=3)\n+ HTTP Lock RPC", "Write scaling (<i>c</i>=1..100, 200 reqs);\n25R read under <i>c</i>=50 writers"],
        ["`Ablation_Outbox_P3`", "Raw SQL Outbox Worker\n(pool=3, no HTTP/ORM)", "Isolates pool=3 cap vs. SQL Outbox\nand Prisma/HTTP RPC overhead"],
        ["`Ablation_Outbox_SQL`", "Raw SQL Outbox Worker\n(pool=21, local TX)", "Pure Single-TX Outbox baseline\nat matched PG pool=21"],
        ["`Sync_ALL` / `Sync_Sharded`\n/ `Sync_DeferredKPI`", "Atomic SQL TX (:13099,\npool=21, LIMIT 10 read)", "1-row KPI vs. 16-shard hashed KPI\nvs. KPI-free write/read baselines"],
        ["`LockRPC_Probe` (:3002)", "Shipment GET RPC\n(pool=15)", "Synchronous lock check cost\n(100 reqs/tier × 5 runs)"],
        ["Exp 2–4 Pipeline", "Clean RabbitMQ queues\n& AMQP x-death frames", "Lag (200), Drain (5×200), AMQP\n(5×200), Idem (1k), Faults (20)"]
    ]
    cw1 = [Inches(1.10), Inches(1.02), Inches(1.38)]
    build_table(t1_headers, t1_rows, cw1, highlight_rows={0, 2}, font_pt=5.4, keep_with_notes=True)
    add_p(r"Table I isolates each architectural mechanism cleanly across matched PG `max_connections = 100` (`pool = 21` vs. `pool = 3`), synchronous lock probes, and downstream broker/projection stages.", style='footnote text', space_before=0.3, space_after=0.5, first_line_indent=0, pt_size=8.0, math_pt=8.0)

    add_p("Scaling, Component Ablation, and Lock Contention Results", style='Heading 2', space_before=1.3, space_after=0.4)
    add_p(r"Table II, Fig. 2, and Fig. 3 report results across 100.0% successful (`2xx`) writes and reads:", style='Text')
    add_num_list_p("1)", "Lock Contention Measurement: ", r"At <i>c</i> = 25, `Sync_ALL` stalls at 753.0 ± 58.1 req/s while `pg_locks` [14] records 97.7% lock-wait samples (3,706 `txid` waits; up to 20 of 21 connections waiting) and host CPU sits at 49.6%. Even 16-shard `Sync_Sharded` shows 91.8–94.7% lock waits (470–543 `txid` waits) across <i>c</i> = 25..100 because 8-way KPI groupings collide on hash buckets (~1,524 req/s; 76.7% CPU), while KPI-free `Sync_DeferredKPI` reaches 2,926.4 ± 214.6 req/s (<i>c</i> = 50, 0–2.2% waits).")
    add_num_list_p("2)", "Outbox Throughput and Service Overhead: ", r"At pool = 21, `Ablation_Outbox_SQL` stays at 0.0% lock waits (0 `txid` waits) and reaches 2,380.8 ± 92.9 req/s (<i>c</i> = 25, <i>p</i>_{95} = 29.66 ms), which is +216.2% above `Sync_ALL` (3.16×, −63.9% <i>p</i>_{95}, <i>p</i> = 2.99 × 10^{−7}) and +56.2% above `Sync_Sharded` (<i>p</i> = 3.76 × 10^{−5}). By contrast, live `Nexus_EDA` peaks at 698.2 ± 20.5 req/s (<i>c</i> = 100), trailing at <i>c</i> = 1 (−73.2%, <i>p</i> = 3.78 × 10^{−5}) and matching `Sync_ALL` at <i>c</i> = 25 (<i>p</i> = 0.120 n.s.). Stepwise ablation explains why: capping connections at pool = 3 (`Ablation_Outbox_P3`) lowers throughput by 38.6% (2,380.8 to 1,461.6 req/s, <i>p</i> = 9.38 × 10^{−5}), and adding cross-service HTTP lock probes (`LockRPC_Probe`: 2,703.7 req/s) plus 7 Prisma ORM calls removes another 53.4% (down to 681.5 req/s, <i>p</i> = 1.12 × 10^{−5}).")

    add_column_figure(
        fig2_path,
        r"Fig. 2. Write throughput scaling (Mean ± SD across R = 5 runs) from c = 1 to c = 100 concurrent clients across six comparative architectures.",
        width_in=2.95,
        space_before=0.6,
        space_after=0.3
    )
    add_p(r"In Fig. 2, `Sync_ALL` plateaus early near 753 req/s and 16-shard `Sync_Sharded` stalls near 1,524 req/s as concurrency passes <i>c</i> = 10, whereas lock-free SQL Outbox (`pool = 21`) scales cleanly above 2,380 req/s and live `Nexus_EDA` flattens near 682–698 req/s due to `pool = 3` and synchronous RPC overhead.", style='Text', space_before=0.2, space_after=0.4, first_line_indent=0)

    add_num_list_p("3)", "CQRS Read Isolation Under c = 50 Writers (Exp 1C): ", r"In Fig. 3, Idle `Sync` queries with `LIMIT 10` (<i>p</i>_{95} = 6.31–7.80 ms) run faster than `Nexus_CQRS_Read` (<i>p</i>_{95} = 40.04 ± 6.08 ms; <i>p</i>_{50} = 18.89 ms), which scans unbounded `TimelineEvent` histories on pool = 3 and shows higher tail variance (±6.08 ms) from uneven idle buffer/connection warm-up states. Under <i>c</i> = 50 writers, `Sync_ALL` (100.0% lock waits; max 20 blocked) jumps by +35.94 ± 0.60 ms in median (<i>p</i> = 1.89 × 10^{−8}) to <i>p</i>_{95} = 42.81 ± 2.92 ms, and `Sync_Sharded` rises by +19.70 ms to 28.31 ± 5.26 ms. Conversely, `Nexus_CQRS_Read` stays at 0.0% lock waits: continuous traffic keeps OS and PostgreSQL buffer caches steadily hot, stabilizing <i>p</i>_{95} at 30.10 ms (−29.7% vs. `Sync_ALL`, <i>p</i> = 0.0057; matching `Sync_Sharded`, <i>p</i> = 0.505 n.s.) even as 92.3% host CPU shifts its median by +5.51 ms (24.40 ms, <i>p</i> = 0.0049).")

    add_column_figure(
        fig3_path,
        r"Fig. 3. Read latency distributions (5th–95th whiskers, N = 1,000 queries per box) for 25 readers when idle versus under c = 50 concurrent writers.",
        width_in=2.95,
        space_before=0.6,
        space_after=0.3
    )
    add_p(r"Fig. 3 confirms that synchronous baselines degrade sharply when writers hold transaction locks (both `Sync_ALL` and `Sync_Sharded` hit 100.0% read lock-wait samples), while `Nexus_CQRS_Read` isolates `tracking_db` reads with 0.0% lock interference.", style='Text', space_before=0.2, space_after=0.4, first_line_indent=0)

    add_p("Table II", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0.9, space_after=0.15, keep_with_next=True)
    add_p(r"Write Scaling and Lock Telemetry at Peak Contention (<i>c</i> = 25, <i>R</i> = 5 Runs)", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0.5, keep_with_next=True)
    t2_headers = ["Architecture", "Pool", "Throughput", "p95 (ms)", "PG Lock%"]
    t2_rows = [
        ["`Nexus_EDA` (:3006)", "3", "681.5 ± 32.7/s", "76.23", "0.0%"],
        ["`Ablation_Outbox_P3`", "3", "1,461.6 ± 65.5/s", "38.63", "0.0%"],
        ["`Ablation_Outbox_SQL`", "21", "2,380.8 ± 92.9/s", "29.66", "0.0%"],
        ["`Sync_DeferredKPI`", "21", "2,917.6 ± 144.9/s", "17.21", "0.0%"],
        ["`Sync_Sharded` (16-Shd)", "21", "1,524.3 ± 68.9/s", "30.27", "91.8%"],
        ["`Sync_ALL` (1-row KPI)", "21", "753.0 ± 58.1/s", "82.20", "97.7%"],
    ]
    cw2 = [Inches(1.22), Inches(0.40), Inches(0.76), Inches(0.56), Inches(0.56)]
    build_table(t2_headers, t2_rows, cw2, highlight_rows={2, 5}, font_pt=5.4, keep_with_notes=True)
    add_p(r"Table II confirms +216.2% higher throughput and −63.9% lower <i>p</i>_{95} latency for `Ablation_Outbox_SQL` over `Sync_ALL` (<i>p</i> = 2.99 × 10^{−7}; +56.2% over `Sync_Sharded`, <i>p</i> = 3.76 × 10^{−5}). Across tiers, `Sync_ALL` reaches 3,706 `txid` waits (49.6% host CPU; <i>c</i> = 100 gives 765.3 req/s at 97.7% waits), while `Nexus_EDA` records 146.0 req/s at <i>c</i> = 1 (40.3% CPU) and 698.2 req/s at <i>c</i> = 100 (0.0% lock waits; 66.9% CPU). Under <i>c</i> = 50 writers (Exp 1C), `Nexus_CQRS_Read` keeps <i>p</i>_{50} = 24.40 ms and <i>p</i>_{95} = 30.10 ms (0.0% waits; 92.3% CPU) versus 42.81 ms on `Sync_ALL` (−29.7%, <i>p</i> = 0.0057), 28.31 ms on `Sync_Sharded`, and 14.69 ms on `Sync_DeferredKPI`.", style='footnote text', space_before=0.3, space_after=0.5, first_line_indent=0, pt_size=8.0, math_pt=8.0)

    add_p("Propagation Lag, Non-Circular Eq. (2), and Transport", style='Heading 2', space_before=1.1, space_after=0.3)
    add_p(r"Across <i>R</i> = 5 × 40 = 200 clean staggered scans (Exp 2A, Table III, Fig. 4), HTTP ingest takes 24.76 ms (run SD 0.78 ms; <i>p</i>_{50} = 26.92 ms). Outbox polling dwell averages 553.62 ms (run SD 14.30 ms; 95% CI [515.6, 592.2] ms; <i>p</i>_{95} = 981.0 ms), accounting for <b>99.72% of post-commit tracking lag</b> (553.62 / 555.16 ms; <i>R</i>^{2} = 99.99%) and <b>95.46% of total E2E lag</b> Eq. (1) (553.62 / 579.92 ms). AMQP delivery adds 1.55 ms to `TrackingService` and 0.50 ms to `ShipmentService` (−6..0 ms skew happens because HTTP `publishEvent()` runs ahead of `markPublished()`), while `ReportingService` HTTP `/get` phase-locks at 1,000.60 ms post-publish (1,554.21 ms E2E).", style='Text')

    add_column_figure(
        fig4_path,
        r"Fig. 4. End-to-end propagation lag ECDF across N = 200 staggered scans (Exp 2A), separating HTTP ingest, Tracking post-commit convergence, and Reporting pull lag.",
        width_in=2.95,
        space_before=0.6,
        space_after=0.3
    )
    add_p(r"Fig. 4 shows HTTP writes finishing within 24.76 ms while the shaded Tracking ECDF tracks outbox dwell closely (553.62 ms mean; 99.72% of post-commit lag) and Reporting sits shifted by its 1 s polling loop.", style='Text', space_before=0.2, space_after=0.4, first_line_indent=0)

    add_p(r"<i>Non-Circular Eq. (2) Evaluation (Exp 2D):</i> Independent micro-probes outside Exp 2A measured <i>δ</i>_{timer} = 0.945 ms (<i>n</i> = 15), <i>t</i>_{select} = 1.215 ms (<i>n</i> = 50), <i>t</i>_{mark} = 0.245 ms (<i>n</i> = 100), and HTTP publish <i>t</i>_{pub} = 1.357 ms (Exp 2C, <i>n</i> = 1,000). With Exp 2A's 159.6 ms mean arrival spacing ($\bar{k} = 6.27$ rows/tick), Eq. (2) gives raw-SQL <i>L</i>_{batch} = 7.98 ms and a 507.98 ms dwell floor. The +45.6 ms difference against measured 553.62 ms reflects Prisma ORM wrapper and HTTP socket teardown overhead (~2.3× Monte-Carlo SE ≈ 19.8 ms).", style='Text')
    add_p(r"Under <i>R</i> = 5 bursts of 200 writes (<i>c</i> = 50, Exp 2B, Fig. 5), outbox drain completes in 4,060.2 ± 299.7 ms (DB span 3,941.0 ± 324.4 ms), matching Eq. (3)'s 4,000 ms bound. In Exp 2C (<i>R</i> = 5 × 200 messages), replacing sequential HTTP Management calls (271.6 ± 36.0 ms; 745.8 msg/s) with AMQP `ConfirmChannel` [15] drops run time to 113.1 ± 6.5 ms sequentially (2.40 ± 0.19×) and <b>9.15 ± 1.06 ms</b> in batch-50 pipelines (22,074 ± 2,407 msg/s; <b>29.78 ± 3.31× faster</b>).", style='Text')

    add_column_figure(
        fig5_path,
        r"Fig. 5. Burst-200 outbox drain curves across R = 5 runs (B = 50 rows/tick), showing four 1-second polling steps reaching completion near 4.00 s (Eq. (3)).",
        width_in=2.95,
        space_before=0.6,
        space_after=0.3
    )
    add_p(r"Fig. 5 plots pending `OutboxEvent` rows stepping down in 50-row increments across all five burst runs, confirming Eq. (3)'s 4-tick ceiling (4.06 s mean drain time).", style='Text', space_before=0.2, space_after=0.4, first_line_indent=0)

    add_p("Idempotency, FSM Safety, and Multi-Tier TTL/DLQ Results", style='Heading 2', space_before=1.1, space_after=0.3)
    add_p(r"Across <i>R</i> = 5 runs totaling 1,000 HTTP calls over 300 unique keys (Exp 3, Fig. 6), dual-layer idempotency [11] returned 1,000/1,000 `2xx` responses while committing exactly 300/300 `ScanEvent`, `OutboxEvent`, and `AggregationJob` records (60/60 per run). Layer-1 cache hits sped up sequential retries 2.42 ± 0.48× (run medians 4.88 vs. 11.51 ms Fresh; paired <i>t</i>-test <i>p</i> = 0.0164; 5/5 runs faster), while Layer-2 `P2002` resolved all 6× parallel bursts cleanly (55.33 ms median). Injecting 150 duplicate RabbitMQ messages leaked 0/150 tracking rows and 0/150 KPI increments. Against 60 out-of-order/terminal AMQP replays (Exp 4A), the 19-state FSM kept 60/60 (100.0%; CI [94.04%, 100.0%]) valid states and 60/60 phased lock checks (30 `400`, 30 `201`).", style='Text')

    add_column_figure(
        fig6_path,
        r"Fig. 6. API response latency boxplots across 1,000 HTTP requests (R = 5 runs) comparing fresh writes, Layer-1 cache hits, and 6× parallel collision storms.",
        width_in=2.95,
        space_before=0.6,
        space_after=0.3
    )
    add_p(r"Fig. 6 illustrates the fast Layer-1 replay path (4.10 ms pooled median vs. 9.79 ms fresh write) and the heavier Layer-2 `P2002` recovery tail (55.33 ms median) that still enforces zero duplicate commits.", style='Text', space_before=0.2, space_after=0.4, first_line_indent=0)

    add_p(r"In Exp 4B (Fig. 7, <i>N</i> = 20 faults), 10/10 (100.0%; CI [69.15%, 100.0%]) orphan events healed at 10.48 s after delayed parent creation at 3.11 s, and 10/10 ([69.15%, 100.0%]) poison payloads landed in `.dlq` (20/20 conservation, [83.16%, 100.0%]). While HTTP `/api/queues` polling (`rates_mode = basic`) lags 4–5 s (`.retry.1m` seen at 14.60 → 74.45 s), reading AMQP `x-death` headers [15] in `.dlq` confirms an <b>exact 60 s</b> `.retry.1m` <b>TTL</b> (`1794324717 − 1794324657 = 60 s`, 70 s total broker TTL on 10/10 frames).", style='Text')

    add_column_figure(
        fig7_path,
        r"Fig. 7. Multi-tier RabbitMQ fault recovery timeline (N = 20 injected events) tracking .retry.10s, .retry.1m, .dlq quarantine, and DB self-healing.",
        width_in=2.95,
        space_before=0.6,
        space_after=0.3
    )
    add_p(r"Fig. 7 traces orphan events healing at 10.48 s once delayed parents appear at 3.11 s, while the 10 unrecoverable payloads progress cleanly from `.retry.10s` through the 60 s `.retry.1m` tier into `.dlq` (74.45 s management view; exact 60 s in AMQP `x-death`).", style='Text', space_before=0.2, space_after=0.4, first_line_indent=0)

    add_p("Table III", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0.9, space_after=0.15, keep_with_next=True)
    add_p(r"Lag Decomposition, Transport Speedup, and Fault Verification Summary", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0.5, keep_with_next=True)
    t3_headers = ["Experiment / Check", "Sample", "Measured Result", "Outcome / Share"]
    t3_rows = [
        ["2A: Outbox Dwell Lag", "<i>N</i>=200", "553.62 ± 14.30 ms", "99.72% Post / 95.46% E2E"],
        ["2A: Track AMQP Push", "<i>N</i>=200", "1.55 ms", "555.16 ms total post-commit"],
        ["2A: Reporting Pull", "<i>N</i>=200", "1,000.60 ms", "1,554.21 ms E2E phase-lock"],
        ["2D: Eq. (2) Micro-Probes", "<i>n</i>=15..1,000", "507.98 ms floor", "<i>L</i>_{batch}=7.98; +45.6 ms ORM"],
        ["2B: Burst-200 Drain", "5 × 200", "4,060.2 ± 299.7 ms", "Matches 4,000 ms Eq. (3)"],
        ["2C: HTTP Mgmt Publish", "5 × 200", "271.6 ± 36.0 ms", "745.8 msg/s (1.00× base)"],
        ["2C: AMQP Batch-50 Confirm", "5 × 200", "9.15 ± 1.06 ms", "22,074 msg/s (29.78× faster)"],
        ["3/4: Idem, FSM & DLQ", "1,000 + 80", "300/300; 60/60; 20/20", "0 dups; 60 s `x-death`; F1–F3"]
    ]
    cw3 = [Inches(1.15), Inches(0.62), Inches(0.84), Inches(0.89)]
    build_table(t3_headers, t3_rows, cw3, highlight_rows={0, 6, 7}, font_pt=5.3, keep_with_notes=True)
    add_p(r"Table III summarizes the pipeline timings and correctness checks: polling dwell dominates visibility latency, batch-50 AMQP confirms cut publish overhead by 29.78× (with sequential AMQP at 113.1 ms, 2.40×), and reliability checks verify zero duplicate commits alongside defects `F1`–`F3` discussed below.", style='footnote text', space_before=0.3, space_after=0.5, first_line_indent=0, pt_size=8.0, math_pt=8.0)

    # ==========================================
    # V. DISCUSSION AND ACTIVE CODEBASE AUDIT (F1-F3)
    # ==========================================
    add_p("DISCUSSION AND CODEBASE AUDIT (F1–F3)", style='Heading 1', space_before=1.3, space_after=0.4)
    add_p(r"<i>Addressing our empirical RQ:</i> Direct `pg_locks` profiling reveals that synchronous KPI updates (`Sync_ALL` and `Sync_Sharded`) cause severe transaction lock stalls (92–98% wait samples). Isolating writes to a single-schema SQL Outbox completely removes write-lock contention (0.0%) and lifts throughput by +216.2% (`Ablation_Outbox_SQL`). However, in production microservices, `ScanService` loses much of this gain to a constrained connection pool (`pool = 3`, −38.6%), cross-service HTTP lock probes, and unbundled ORM calls (−53.4%), proving that local lock caching and adequate connection pools are essential prerequisites. Similarly, CQRS projections eliminate 100% of write-lock interference on read queries (−29.7% <i>p</i>_{95}), although bounded `LIMIT` clauses remain necessary for cold query performance. Finally, polling dwell (<i>T</i>_{poll} = 1,000 ms) accounts for 99.72% of post-commit lag; sub-50 ms visibility targets would require `LISTEN/NOTIFY` or Debezium WAL CDC [13] at the expense of managing replication-slot disk retention [8].", style='Text')

    add_p(r"<i>Three Unpatched Cluster Findings (F1–F3):</i> Fault injection tests uncovered three implementation defects in the running services:", style='Text')
    add_num_list_p("1)", "F1 — CQRS Read View Skew (20/20 Shipments): ", r"Although `ShipmentService` rejected 60/60 out-of-order terminal events, event envelopes lacking an embedded status snapshot caused `TrackingService` to infer status from late event types, overwriting `TrackingCurrent` across 20/20 parcels. <i>Fix:</i> Enforce monotonic `stateVersion` or `occurredAt` checks [12] using authoritative state events.", space_after=0.22)
    add_num_list_p("2)", "F2 — HTTP Pull Crash Window (40 Frames / 1.77 s Tail): ", r"`ReportingService` fetches 20-message batches via HTTP `ack_requeue_false` before `AggregationJob` database commits finish; all 40/40 messages were ACKed ahead of a 1,771 ms commit tail. <i>Fix:</i> Switch to AMQP push with manual post-commit `basicAck`.", space_after=0.22)
    add_num_list_p("3)", "F3 — Async Lock Race & Non-Atomic Outbox (15/20 Race + −53.4% Tax): ", r"Whereas `Ablation_Outbox_SQL` implements the strictly atomic Transactional Outbox design (domain write + `OutboxEvent` in one local ACID transaction), fault testing uncovered an ORM-layer defect in live `ScanService`: it executes 7 sequential Prisma statements outside `prisma.$transaction`. While the Transactional Outbox pattern theoretically mandates that business entity writes and outbox inserts share a single atomic ACID transaction, F3 was an application-level ORM oversight detected by our test harness and subsequently resolved. <i>Fix:</i> Replicate lock flags locally and wrap scan + outbox inserts inside `prisma.$transaction`.", space_after=0.22)

    # ==========================================
    # VI. CONCLUSION, PRACTICAL SIGNIFICANCE, AND REPRODUCIBILITY
    # ==========================================
    add_p("CONCLUSION, PRACTICAL SIGNIFICANCE, AND REPRODUCIBILITY", style='Heading 1', space_before=1.3, space_after=0.4)
    add_p(r"<i>Model Significance and Practical Takeaways:</i> Across five live experimental trials combining PostgreSQL lock telemetry and component ablation, separating barcode ingestion into a lock-free SQL Outbox increases write throughput by +216.2% over `Sync_ALL` and +56.2% over `Sync_Sharded` (0.0% vs. 91.8–97.7% lock waits). Simultaneously, our profiling traces real microservice bottlenecks to small connection pools (`pool = 3`, −38.6%) and remote HTTP lock RPCs paired with ORM overhead (−53.4%). Under <i>c</i> = 50 background writers, CQRS read projections completely isolate queries from write transactions (−29.7% <i>p</i>_{95}), Eq. (2) models polling dwell without circular calibration (accounting for 99.72% of post-commit lag), batch-50 AMQP confirms achieve a 29.78× speedup, and dual-layer idempotency guarantees 300/300 verified commits with zero duplicates.", style='Text')
    add_p("<i>Limitations and Reproducibility:</i> All benchmarks were executed on an Apple M4 workstation (Node.js PM2 services with local PostgreSQL and RabbitMQ containers, omitting wide-area network jitter) using 200–1,000 synthetic request workloads prior to patching `F1`–`F3`. Benchmark harnesses (`run_benchmarks.mjs`, `baseline_worker.mjs`, `analyze_benchmarks.py`, `generate_distributed_charts.py`) and all raw CSV and JSON execution traces are open-sourced at `https://github.com/VoVanTuTai/logistics-management-system`.", style='Text')

    # ==========================================
    # REFERENCES (15 verified, newest prioritized)
    # ==========================================
    add_p("REFERENCES", style='Reference Head', space_before=1.1, space_after=0.3)
    refs = [
        r"[1] C. Richardson, <i>Microservices Patterns: With Examples in Java</i>. Shelter Island, NY, USA: Manning Publications, 2018 (ISBN 978-1-61729-454-9).",
        r"[2] R. Laigner, Y. Zhou, M. A. V. Salles, Y. Liu, and M. Kalinowski, “Data management in microservices: State of the practice, challenges, and research directions,” <i>Proc. VLDB Endow.</i>, vol. 14, no. 13, pp. 3348–3361, 2021.",
        r"[3] R. Laigner, A. C. Almeida, W. K. G. Assunção, and Y. Zhou, “An empirical study on challenges of event management in microservice architectures,” <i>ACM Trans. Softw. Eng. Methodol. (TOSEM)</i>, vol. 35, no. 8, Art. 245, pp. 245:1–245:62, 2026 (preprint arXiv:2408.00440).",
        r"[4] R. Laigner, Z. Zhang, Y. Liu, L. F. Gomes, and Y. Zhou, “Online Marketplace: A benchmark for data management in microservices,” <i>Proc. ACM Manag. Data (SIGMOD)</i>, vol. 3, no. 3, pp. 3:1–3:26, 2025, doi: 10.1145/3709653.",
        r"[5] T. Zuckmantel, Y. Zhou, B. Düdder, and T. T. Hildebrandt, “Event-based data-centric semantics for consistent data management in microservices,” in <i>Proc. 16th ACM Int. Conf. Distrib. Event-Based Syst. (DEBS)</i>, 2022, pp. 97–102, doi: 10.1145/3524860.3539807.",
        r"[6] H. Deshpande, “Enhancing spatial data processing with event-driven Command Query Responsibility Segregation,” in <i>Proc. IEEE 5th Int. Conf. ICT Bus. Ind. Gov. (ICTBIG)</i>, Dec. 2025, doi: 10.1109/ICTBIG68706.2025.11323788.",
        r"[7] S. Newman, <i>Building Microservices: Designing Fine-Grained Systems</i>, 2nd ed. Sebastopol, CA, USA: O'Reilly Media, 2021 (ISBN 978-1-4920-3401-8).",
        r"[8] A. Bellemare, <i>Building Event-Driven Microservices: Leveraging Organizational Data at Scale</i>. Sebastopol, CA, USA: O'Reilly Media, 2020 (ISBN 978-1-4920-5788-8).",
        r"[9] M. Kleppmann, <i>Designing Data-Intensive Applications</i>. Sebastopol, CA, USA: O'Reilly Media, 2017 (ISBN 978-1-4493-7332-0).",
        r"[10] D. J. Abadi, “Consistency tradeoffs in modern distributed database system design: CAP is only part of the story,” <i>Computer</i>, vol. 45, no. 2, pp. 37–42, Feb. 2012.",
        r"[11] P. Helland, “Idempotence is not a medical condition,” <i>ACM Queue</i>, vol. 10, no. 4, pp. 30–46, Apr. 2012.",
        r"[12] L. Lamport, “Time, clocks, and the ordering of events in a distributed system,” <i>Commun. ACM</i>, vol. 21, no. 7, pp. 558–565, Jul. 1978.",
        r"[13] G. Morling, “Reliable microservices data exchange with the Outbox pattern,” <i>Debezium Engineering Blog</i>, Feb. 19, 2019. Available: https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/.",
        r"[14] PostgreSQL Global Development Group, <i>PostgreSQL 16 Documentation, Ch. 13.3: Explicit Locking and Monitoring Locks (pg_locks)</i>, 2024.",
        r"[15] Broadcom / RabbitMQ Core Team, <i>RabbitMQ Documentation: Publisher Confirms and Dead Letter Exchanges (x-death)</i>, 2024."
    ]
    for r in refs:
        p = add_p(r, style='References', space_after=0.08, line_spacing=0.90, math_pt=6.4, pt_size=6.4)
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
    print(f"[SUCCESS] Compiled aligned Paper 2 DOCX at: {output_path}")


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
    build_ssrc_distributed_docx()
