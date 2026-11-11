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

    def add_full_width_figure(image_path, caption_text, width_in=5.85):
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

    def build_table(headers, rows, col_widths, highlight_rows=None, font_pt=5.4, left_cols=(0,), keep_with_notes=False):
        highlight_rows = set(highlight_rows or [])
        tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tblPr = tbl._tbl.tblPr
        tblPr.append(parse_xml(
            f'<w:tblCellMar {nsdecls("w")}>'
            f'<w:top w:w="15" w:type="dxa"/><w:left w:w="18" w:type="dxa"/>'
            f'<w:bottom w:w="15" w:type="dxa"/><w:right w:w="18" w:type="dxa"/>'
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
            append_latex_text(p, h_text, pt_size=font_pt, math_pt_size=font_pt, bold=True, code_pt_delta=0.2, allow_code_wrap=False)
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx in left_cols else WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0.4)
            p.paragraph_format.space_after = Pt(0.4)
            p.paragraph_format.line_spacing = 0.95
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
                append_latex_text(p, val, pt_size=font_pt, math_pt_size=font_pt, bold=is_hi, code_pt_delta=0.2, allow_code_wrap=False)
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx in left_cols else WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(0.4)
                p.paragraph_format.space_after = Pt(0.4)
                p.paragraph_format.line_spacing = 0.95
                p._p.get_or_add_pPr().append(parse_xml(f'<w:suppressAutoHyphens {nsdecls("w")}/>'))
                if keep_with_notes or r_idx < len(rows) - 1:
                    p.paragraph_format.keep_with_next = True
                if is_hi:
                    cell._tc.get_or_add_tcPr().append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="F8FAFC"/>'))
        return tbl

    # ==========================================
    # TITLE & AUTHORS
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
    # ABSTRACT & INDEX TERMS (~200 words)
    # ==========================================
    abs_runs = [
        ("Abstract— ", True, True),
        (r"High-concurrency courier platforms must ingest barcode scans without relational lock stalls or dual-write loss. We evaluate the live Nexus Event-Driven Outbox and Command Query Responsibility Segregation (CQRS) platform across <i>R</i> = 5 runs on NestJS 10 PM2 services, isolated PostgreSQL 16 schemas, and RabbitMQ 3.13 against unsharded (`Sync_ALL`), 16-shard (`Sync_Sharded`), deferred-KPI (`Sync_DeferredKPI`), and SQL Outbox baselines. Across <i>c</i> ∈ {1..100}, PostgreSQL lock profiling shows `Sync_ALL` stalls at 753.0 ± 58.1 req/s (<i>c</i> = 25, 97.7% lock waits), whereas lock-free SQL Outbox isolation (`pool=21`, 0.0% lock waits) lifts throughput +216.2% over `Sync_ALL` (2,380.8 ± 92.9 req/s, −63.9% <i>p</i>_{95}, <i>p</i> = 3.0 × 10^{−7}) and +56.2% over `Sync_Sharded` (91.8% lock waits). Conversely, component ablation exposes why live Nexus ingress (681.5 ± 32.7 req/s) trails at <i>c</i> = 1 (−73.2%) and loses that headroom to `pool=3` limits (−38.6%) plus HTTP lock RPCs and ORM serialization (−53.4%). Under <i>c</i> = 50 writers, CQRS reads maintain 0.0% lock waits and cut <i>p</i>_{95} latency −29.7% versus `Sync_ALL` (30.10 vs. 42.81 ms, <i>p</i> = 0.0057), while outbox dwell drives 99.72% of post-commit tracking lag. Dual-layer idempotency (300/300 DB writes/1,000 calls), 60/60 FSM guards, 60 s `.retry.1m` quarantine (10/10 healed, 10/10 DLQ), and defects `F1`–`F3` are quantified.", False, False)
    ]
    add_rich_p(abs_runs, style='Abstract', align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=2.2)

    idx_runs = [
        ("Index Terms— ", True, True),
        ("Event-Driven Architecture, Transactional Outbox, CQRS, Log-Based CDC, Idempotency, Lock Contention Ablation, RabbitMQ Dead-Letter Exchange.", False, False)
    ]
    add_rich_p(idx_runs, style='IndexTerms', space_after=3.8)

    # ==========================================
    # I. INTRODUCTION
    # ==========================================
    add_p("INTRODUCTION", style='Heading 1', space_before=2.6, space_after=1.0)
    add_p(r"Modern express courier platforms ingest concurrent barcode scans from sorting hubs and handheld Personal Digital Assistants (PDAs) alongside latency-sensitive public tracking reads [1], [5]. Coupling scan ingestion, transition validation, and multi-dimensional KPI counters inside a single shared ACID transaction causes severe row lock contention, blocking worker pools and degrading tail latency.", style='Text')
    add_p(r"Decomposing the monolith into bounded-context microservices eliminates single-schema row locks [6], [7], yet introduces four distributed consistency hazards examined on our running platform:", style='Text')
    add_num_list_p("1)", "Dual-Write Consistency Anomaly: ", r"Updating a local database and publishing to a broker outside a single atomic flow risks lost events or phantom states on crashes [1].")
    add_num_list_p("2)", "Outbox Dwell vs. Service Overhead: ", r"Fixed polling intervals (<i>T</i>_{poll}) and HTTP relays dominate convergence lag, while cross-service RPC locks and small connection pools can erode outbox throughput gains.")
    add_num_list_p("3)", "Retry Storms & Consumer Races: ", r"Duplicate PDA retries and child scan events arriving ahead of parent waybill creation threaten duplicate KPI rollups or premature failures.")
    add_num_list_p("4)", "Event Reordering & Queue Stalls: ", r"Delayed or out-of-order (OOO) messages risk corrupting terminal shipment states (`DELIVERED`, `CANCELLED`) unless monotonic state guards and dead-letter escalation are enforced [16].")

    add_p(r"Without heavy two-phase commit (2PC) or Kafka clusters, we evaluate our live NestJS 10 + PostgreSQL 16 + RabbitMQ 3.13 platform across <i>R</i> = 5 independent runs per workload: (RQ1) How much do Outbox decoupling and CQRS isolation reduce relational lock contention and tracking tail latency compared with unsharded, sharded, and deferred-KPI synchronous baselines—and which service overheads explain live ingress gaps via component ablation? (RQ2) Which stage dominates convergence lag using non-circular timing probes, and how fast is pipelined AMQP `ConfirmChannel` batching versus HTTP Management relays? (RQ3) How reliably do dual-layer idempotency, 19-state FSM whitelisting, and multi-tier TTL/DLQ recovery preserve data integrity while exposing active codebase flaws (`F1`–`F3`)?", style='Text')

    add_p("Key contributions grounded in our live implementation include:", style='Text')
    add_bullet_p("Lock-Wait Proof & Ablation: ", r"`pg_locks` profiling proves `Sync_ALL` (97.7%) & 16-shard `Sync_Sharded` (91.8%) stall, while pure SQL Outbox lifts throughput +216.2% (<i>p</i> = 3.0 × 10^{−7}) minus live `pool=3` (−38.6%) and RPC/ORM (−53.4%) taxes.")
    add_bullet_p("CQRS Isolation & Lag Model: ", r"Cuts read <i>p</i>_{95} −29.7% under <i>c</i> = 50 writers (0.0% lock waits), validates Eq. (2) non-circularly (508.0 vs. 553.6 ms), and reaches 29.78× speedup with batch-50 AMQP confirms.")
    add_bullet_p("Integrity & Code Audit (`F1`–`F3`): ", r"Verifies 300/300 DB commits (1,000 calls), 60/60 FSM guards, exact 60 s `x-death` DLQ TTLs (10/10), and exposes three defects (`F1`–`F3`) with patches.")

    # ==========================================
    # II. RELATED WORK
    # ==========================================
    add_p("RELATED WORK", style='Heading 1', space_before=2.6, space_after=1.0)
    add_p(r"<i>Distributed Data & Microservices:</i> The CAP [3] and PACELC [2] theorems formalize latency-consistency trade-offs underlying BASE workflows [4]. Empirical analysis by Laigner et al. [5] shows database-per-service decomposition [6], [7] shifts consistency guarantees from SQL engines to messaging handlers, necessitating rigorous verification of idempotent consumers and failure semantics.", style='Text')
    add_p(r"<i>Transactional Outbox, Polling vs. Log-Based CDC:</i> Hohpe and Woolf [8] and Richardson [1] define the Transactional Outbox with Polling Publishers to prevent dual-write loss without XA locks [9], [15]. Alternatively, log-based Change Data Capture (CDC) tools such as Debezium [18] tail PostgreSQL Write-Ahead Log (WAL) logical replication slots directly, eliminating <i>T</i>_{poll}/2 wait and `SELECT` polling overhead. However, WAL CDC requires managing distributed Kafka Connect pipelines and guarding against PostgreSQL replication-slot WAL disk bloat if connectors stall [18]. Our implementation pairs a lightweight Polling Publisher with RabbitMQ [12] topic routing and Dead-Letter Exchange (DLX) retries, while contrasting latency boundaries against WAL CDC.", style='Text')
    add_p(r"<i>CQRS, Idempotency & Event Ordering:</i> CQRS [13], [17] separates write commands from read projections under eventual consistency. Helland [14] motivates idempotent receivers via unique operation keys, while Lamport [16] formalizes logical event ordering and clock skew across asynchronous nodes—directly relevant to preventing OOO projection overwrites without misusing logical clocks as human workflows. Unlike simulator-only evaluations, we benchmark live cluster telemetry and expose concrete service bottlenecks (`F1`–`F3`).", style='Text')

    # ==========================================
    # III. SYSTEM ARCHITECTURE AND CORE MECHANISMS
    # ==========================================
    add_p("SYSTEM ARCHITECTURE AND CORE MECHANISMS", style='Heading 1', space_before=2.6, space_after=1.0)
    add_p("Bounded-Context Topology and Service Separation", style='Heading 2', space_before=1.9, space_after=0.65)
    add_p(r"As illustrated in Fig. 1, the live platform executes natively via PM2 Node.js workers across four isolated PostgreSQL 16 domain schemas (`scan_db`, `shipment_db`, `tracking_db`, `reporting_db`, alongside companion dispatch and payment services): `ScanService` (`scan_db`, `connection_limit = 3`) owns scan ingestion and `CurrentLocation`; `ShipmentService` (`shipment_db`, pool = 15) holds authoritative `Shipment` state; `TrackingService` (`tracking_db`, pool = 3) serves public reads (`TimelineEvent`, `TrackingCurrent`); and `ReportingService` (`reporting_db`, pool = 3) aggregates 8-way `KpiDaily/KpiMonthly` rollups (`AggregationJob`). Redis in the gateway BFF handles exclusively WebSocket chat pub/sub. Persistent domain events (`delivery_mode = 2`) route through RabbitMQ's `domain.events` topic exchange.", style='Text')

    add_full_width_figure(
        fig1_path,
        r"Fig. 1. Live Nexus Event-Driven Outbox and CQRS pipeline across isolated PostgreSQL 16 schemas and RabbitMQ 3.13 (`R = 5` verified metrics), spanning PDA ingress, dual-layer deduplication, outbox relays, 19-state FSM governance, CQRS views, multi-tier TTL/DLQ recovery, and active codebase audit findings (`F1`–`F3`).",
        width_in=5.55
    )

    add_p("Dual-Layer Idempotency and Persistent Outbox Writes", style='Heading 2', space_before=1.9, space_after=0.65)
    add_p(r"Before persisting an inbound scan (`POST /scans/inbound`), `ScanService` executes a synchronous HTTP lock probe (`GET /shipments/:code`) against `ShipmentService`, rejecting locked parcels (HTTP 400) unless authorized by an audit token (`INVENTORY_CHECK`) or active reverse transit (`RETURN_STARTED`). Permitted commands scope keys as `flow:idempotencyKey` through two deduplication layers:", style='Text')
    add_num_list_p("1)", "Layer 1 — Sequential Cache Lookup: ", r"Queries `IdempotencyRecord` by scoped key, returning the cached response immediately (4.10 ms pooled median; 4.88 ± 2.87 ms across <i>R</i> = 5 runs) on sequential PDA retries.")
    add_num_list_p("2)", "Layer 2 — Parallel Race Recovery (`P2002`): ", r"Concurrent duplicates bypassing Layer 1 collide on PostgreSQL's unique constraint over `ScanEvent.idempotencyKey` (Prisma error `P2002`), triggering clean read-back of the winner's committed record.")
    add_num_list_p("3)", "Outbox Append & Audit: ", r"`ScanService` updates `CurrentLocation`, writes a `PENDING` `OutboxEvent` (polled at <i>T</i>_{poll} = 1,000 ms, <i>B</i> = 50), saves `IdempotencyRecord`, and logs an audit entry via 7 sequential Prisma operations (atomicity hardening noted under `F3`).")

    add_p("Outbox Relays and Propagation Lag Formulation", style='Heading 2', space_before=1.9, space_after=0.65)
    add_p(r"Our implementation contrasts two outbox relays flushing up to <i>B</i> = 50 rows every <i>T</i>_{poll} = 1,000 ms: `ScanService` publishes sequentially via RabbitMQ's HTTP Management `/publish` endpoint, whereas `ShipmentService` maintains a persistent AMQP `ConfirmChannel` [12]. End-to-end client-to-projection visibility decomposes additively:", style='Text')

    add_math_equation(r'L_{\text{E2E}} = L_{\text{ingest}} + L_{\text{dwell}} + L_{\text{broker}} + L_{\text{cons}}', eq_num='1', math_pt=9.6)
    add_p(r"where <i>L</i>_{ingest} is HTTP ingest commit latency, <i>L</i>_{dwell} is outbox queue wait before broker publish confirmation, <i>L</i>_{broker} is broker-to-consumer delivery latency, and <i>L</i>_{cons} is consumer DB commit time (post-commit tracking convergence excludes <i>L</i>_{ingest}). For asynchronous arrivals across periodic <i>T</i>_{poll} ticks, expected dwell is", style='Text', first_line_indent=0)

    add_math_equation(r'L_{\text{dwell}} \approx \frac{T_{\text{poll}}}{2} + L_{\text{batch}}', eq_num='2', math_pt=9.6)
    add_p(r"where $L_{\text{batch}} = \delta_{\text{timer}} + t_{\text{select}} + \frac{\bar{k}+1}{2}(t_{\text{pub}} + t_{\text{mark}})$ captures timer overshoot, SQL `SELECT`, and intra-batch publish/update time measured <i>independently</i> from E2E dwell. Under concurrent bursts (<i>N</i>_{0} > <i>B</i>), drain time quantizes across polling intervals:", style='Text', first_line_indent=0)

    add_math_equation(r'T_{\text{drain}}(N_0) \approx \left\lceil \frac{N_0}{B} \right\rceil T_{\text{poll}}', eq_num='3', math_pt=9.8)
    add_p(r"predicting 4 ticks (4.00 s) for bursts of <i>N</i>_{0} = 200 events at <i>B</i> = 50.", style='Text', first_line_indent=0)

    add_p("FSM Whitelist, CQRS Views, and TTL/DLQ Escalation", style='Heading 2', space_before=1.9, space_after=0.65)
    add_p(r"Downstream, `ShipmentService` enforces a 19-state finite-state machine (`VALID_TRANSITIONS`) via AMQP push (`noAck: false`), permitting only self-idempotent replays once shipments enter absorbing states (`DELIVERED`, `RETURN_COMPLETED`, `CANCELLED`). `TrackingService` pushes into `TimelineEvent` (`P2002` on `eventId`) and upserts `TrackingCurrent/TrackingIndex`, whereas `ReportingService` polls via HTTP (`/get`, <i>T</i> = 1,000 ms, <i>B</i> = 20, `ack_requeue_false`) into `AggregationJob`-deduplicated 8-way KPI tables. Consumer faults ACK the main queue immediately and route via `x-retry-count` across `.retry.10s` (10 s TTL), `.retry.1m` (60 s TTL), and permanent `.dlq` quarantine (retry ≥ 2) for operator triage.", style='Text')

    # ==========================================
    # IV. EXPERIMENTAL SETUP AND EMPIRICAL RESULTS
    # ==========================================
    add_p("EXPERIMENTAL SETUP AND EMPIRICAL RESULTS", style='Heading 1', space_before=2.6, space_after=1.0)
    add_p("Testbed, Stronger Baselines, and Ablation Design", style='Heading 2', space_before=1.9, space_after=0.65)
    add_p(r"All benchmarks executed against the live cluster on an Apple M4 host (10 cores, 16 GB RAM, macOS 15.8, Node.js v26.0.0) backed by PostgreSQL 16.15 (`max_connections = 100`) and RabbitMQ 3.13.7 (`rates_mode = basic`). Before timed measurements, a 1,995 ms warmup (40 writes + 60 reads/target) warmed HTTP sockets and Prisma engines; pre-benchmark SQL dumps were restored afterward. Every latency/scaling experiment executed <i>R</i> = 5 independent block-rotated repetitions, sampling `pg_stat_activity`, `pg_locks WHERE NOT granted`, and `os.cpus()` busy time at 5 ms resolution. Statistical tests compare <i>n</i> = 5 independent run summaries (paired <i>t</i>-tests, <i>df</i> = 4; exact two-sided Wilcoxon `min p = 0.0625` at <i>n</i> = 5) alongside exact Clopper–Pearson 95% binomial intervals, eliminating intra-run pseudoreplication.", style='Text')

    add_p("Table I", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2.0, space_after=0.35, keep_with_next=True)
    add_p(r"Live Comparators, Pool Settings, and R = 5 Synthetic Workloads", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0.9, keep_with_next=True)
    t1_headers = ["Suite / Target", "Config & Pool", "Workload (<i>R</i> = 5) & Measurement"]
    t1_rows = [
        ["`Nexus_EDA` (`:3006`)", "PM2 NestJS/Prisma;\npool = 3 + HTTP Lock RPC", "Exp 1: <i>c</i> ∈ {1, 10, 25, 50, 100} × 200 × 5 runs;\nExp 1C: 25R vs Idle & <i>c</i>=50W (200 × 5 reads)"],
        ["`Ablation_Outbox_P3`", "Raw PG Outbox Worker;\npool = 3 (no HTTP/Prisma)", "Isolates `connection_limit=3` PM2 pool cap\nvs `Ablation_Outbox_SQL` & Prisma/HTTP tax"],
        ["`Ablation_Outbox_SQL`", "Raw PG Outbox Worker;\npool = 21 (local lock/tx)", "Isolates pure Single-TX SQL Outbox pattern\nat matched PostgreSQL pool = 21"],
        ["`Sync_ALL` / `Sync_Sharded`\n/ `Sync_DeferredKPI`", "Atomic SQL TX (`:13099`,\npool = 21, `LIMIT 10` read)", "1-row `ALL|ALL|ALL` KPI vs 16-shard hashed KPI\nvs KPI-free write/read baselines"],
        ["`LockRPC_Probe` (`:3002`)", "Live Shipment GET RPC\n(pool = 15)", "Isolates synchronous HTTP lock check cost;\n100 reqs/tier × 5 runs"],
        ["Exp 2A–2D / 3 / 4A–4B", "Isolated cluster sweep;\nclean queues & <i>x-death</i>", "2A: 200 staggered; 2B/C: 5 × 200; 2D: independent\nmicro-probes; 3: 1,000 HTTP + 150 dup; 4A/B faults"]
    ]
    cw1 = [Inches(0.98), Inches(1.04), Inches(1.48)]
    build_table(t1_headers, t1_rows, cw1, highlight_rows={0, 2}, font_pt=5.4, keep_with_notes=True)
    add_p(r"<i>Notes:</i> Warmup 1,995 ms; `max_connections=100`; 5 ms `pg_locks` & `os.cpus()` polling.", style='footnote text', space_before=0.7, space_after=1.2)

    add_p("Scaling, Component Ablation, and Lock Proof (RQ1)", style='Heading 2', space_before=1.9, space_after=0.65)
    add_p(r"Table II and Fig. 2(a) expose three structural findings across 100.0% successful (`2xx`) requests:", style='Text')
    add_num_list_p("1)", "Direct Lock-Contention Proof: ", r"At <i>c</i> = 25, `Sync_ALL` stalls at 753.0 ± 58.1 req/s while PostgreSQL sampling captures 97.7% lock-wait intervals (3,706 `txid` waits; up to 20 of 21 connections blocked) leaving host CPU under-utilized at 49.6%. Contrary to naive intuition, even 16-shard `Sync_Sharded` still suffers 91.8–94.7% lock-wait sampling (470–543 `txid` waits, max 9–12 blocked) across <i>c</i> = 25..100 because 8-way KPI groupings hash-collide across concurrent updates, capping throughput near ~1,524 req/s (76.7% CPU). Removing synchronous KPI updates (`Sync_DeferredKPI`) eliminates lock waits (0–2.2%) and scales to 2,926.4 ± 214.6 req/s (<i>c</i> = 50).")
    add_num_list_p("2)", "Pure Outbox Gains & Honest Ablation Tax: ", r"Matched at pool = 21, `Ablation_Outbox_SQL` maintains 0.0% lock waits (0 `txid` waits) and reaches 2,380.8 ± 92.9 req/s (<i>c</i> = 25, <i>p</i>_{95} = 29.66 ms), outperforming `Sync_ALL` by +216.2% (3.16×, −63.9% <i>p</i>_{95}, <i>p</i> = 2.99 × 10^{−7}) and `Sync_Sharded` by +56.2% (<i>p</i> = 3.76 × 10^{−5}). Conversely, live `Nexus_EDA` peaks at only 698.2 ± 20.5 req/s (<i>c</i> = 100), trailing `Sync_ALL` at <i>c</i> = 1 (146.0 vs. 545.0 req/s, −73.2%, <i>p</i> = 3.78 × 10^{−5}) and tying `Sync_ALL` at <i>c</i> = 25 (681.5 vs. 753.0 req/s, <i>p</i> = 0.120 n.s.; <i>p</i>_{95} −7.3%, <i>p</i> = 0.044) while trailing `Sync_Sharded` (−55.3%). Two-step ablation attributes this loss cleanly: (a) capping pool size at 3 (`Ablation_Outbox_P3`) cuts SQL Outbox throughput −38.6% (2,380.8 → 1,461.6 req/s, <i>p</i> = 9.38 × 10^{−5}), and (b) adding cross-service HTTP lock checks (`LockRPC_Probe`: 2,703.7 ± 315.3 req/s at <i>c</i> = 25) plus 7 Prisma ORM calls imposes an additional −53.4% ingress penalty (1,461.6 → 681.5 req/s, <i>p</i> = 1.12 × 10^{−5}).")
    add_num_list_p("3)", "CQRS Read Isolation Under c = 50 Writes (Exp 1C): ", r"As shown in Table II and Fig. 2(b), under Idle load `Sync` bounded `LIMIT 10` queries (<i>p</i>_{95} = 6.31–7.80 ms) run much faster than `Nexus_CQRS_Read` (<i>p</i>_{95} = 40.04 ± 6.08 ms; <i>p</i>_{50} = 18.89 ms), which scans unbounded `TimelineEvent` histories on `pool=3`. However, under <i>c</i> = 50 writers, `Sync_ALL` (100.0% read-period lock waits; max 20 blocked) jumps +35.94 ± 0.60 ms in median latency (<i>p</i> = 1.89 × 10^{−8}) to <i>p</i>_{95} = 42.81 ± 2.92 ms, and `Sync_Sharded` (100.0% lock waits) jumps +19.70 ms in median (+22.00 ms <i>p</i>_{95}) to 28.31 ± 5.26 ms. Meanwhile `Nexus_CQRS_Read` sustains 0.0% lock waits—shifting +5.51 ± 2.19 ms in median (<i>p</i> = 0.0049) purely from shared-host CPU saturation (92.3%)—cutting <i>p</i>_{95} tail read latency −29.7% versus `Sync_ALL` (30.10 vs. 42.81 ms, <i>p</i> = 0.0057; −37.0% mean across 5/5 runs) and matching `Sync_Sharded` (<i>p</i> = 0.505 n.s.).")

    add_full_width_figure(
        fig2_path,
        r"Fig. 2. Genuine <i>R</i> = 5 cluster telemetry: (a) Write scaling & 4-step ablation with PostgreSQL lock-wait breakdown (Mean ± SD); (b) CQRS read isolation under 25 readers vs. Idle and <i>c</i> = 50 concurrent writers (5th–95th whiskers, <i>N</i> = 1,000 queries/box); and (c) Post-commit stage propagation ECDF (<i>N</i> = 200 joined scans).",
        width_in=5.95
    )

    add_p("Table II", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2.0, space_after=0.35, keep_with_next=True)
    add_p(r"R = 5 Scaling, Component Ablation, PG Lock/CPU Telemetry (Exp 1) & CQRS Read Isolation (Exp 1C)", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0.9, keep_with_next=True)
    t2_headers = ["Experiment / Architecture", "Tier / Cond.", "req/s or Read <i>p</i>_{50}", "<i>p</i>_{95} (ms)\nMean ± SD", "PG Lock%\n(maxBlk)", "Host CPU% /\nKey Finding"]
    t2_rows = [
        ["`Nexus_EDA` (`:3006`)", "Write <i>c</i>=1", "146.0 ± 30.0/s", "18.45 ± 2.77", "0.0% (0)", "40.3% (−73% Sync)"],
        ["`Nexus_EDA` (`:3006`)", "Write <i>c</i>=25", "681.5 ± 32.7/s", "76.23 ± 5.62", "0.0% (0)", "65.0% (−53% RPC/ORM)"],
        ["`Ablation_Outbox_P3`", "Write <i>c</i>=25", "1,461.6 ± 65.5/s", "38.63 ± 4.75", "0.0% (0)", "55.2% (−39% pool=3)"],
        ["`Ablation_Outbox_SQL`", "Write <i>c</i>=25", "2,380.8 ± 92.9/s", "29.66 ± 6.39", "0.0% (0)", "78.1% (+216% ALL)"],
        ["`Sync_DeferredKPI`", "Write <i>c</i>=25", "2,917.6 ± 144.9/s", "17.21 ± 3.43", "0.0% (0)", "78.0% (KPI-free)"],
        ["`Sync_Sharded` (16-Shd)", "Write <i>c</i>=25", "1,524.3 ± 68.9/s", "30.27 ± 3.63", "91.8% (9)", "76.7% (470 txid)"],
        ["`Sync_ALL` (1-row KPI)", "Write <i>c</i>=25", "753.0 ± 58.1/s", "82.20 ± 3.57", "97.7% (20)", "49.6% (3,706 txid)"],
        ["`Nexus_EDA` / `Sync_ALL`", "Write <i>c</i>=100", "698.2 / 765.3/s", "187.8 / 159.7", "0.0 / 97.7%", "66.9% / 47.7% CPU"],
        ["`Nexus_CQRS_Read`", "Idle → <i>c</i>=50", "18.89 → 24.40 ms", "40.04 → 30.10", "0.0 → 0.0%", "92.3% (−29.7% ALL)"],
        ["`Sync_Sharded` Read", "Idle → <i>c</i>=50", "2.12 → 21.82 ms", "6.31 → 28.31", "0.0 → 100%", "83.9% (maxBlk=11)"],
        ["`Sync_DeferredKPI` Read", "Idle → <i>c</i>=50", "1.83 → 12.00 ms", "7.80 → 14.69", "0.0 → 0.0%", "85.4% (`LIMIT 10`)"],
        ["`Sync_ALL` Read", "Idle → <i>c</i>=50", "2.25 → 38.19 ms", "7.76 → 42.81", "0.0 → 100%", "49.5% (+35.9ms p50)"]
    ]
    cw2 = [Inches(0.86), Inches(0.48), Inches(0.61), Inches(0.50), Inches(0.45), Inches(0.60)]
    build_table(t2_headers, t2_rows, cw2, highlight_rows={3, 6, 8}, font_pt=5.15, keep_with_notes=True)
    add_p(r"<i>Notes:</i> Paired `Ablation_Outbox_SQL` vs. `Sync_ALL` <i>p</i> = 2.99 × 10^{−7}; vs. `Sync_Sharded` <i>p</i> = 3.76 × 10^{−5}. Read <i>c</i> = 50 `Nexus_CQRS` vs. `Sync_ALL`: −29.7% <i>p</i>_{95} (<i>p</i> = 0.0057).", style='footnote text', space_before=0.7, space_after=1.1)

    add_p("Propagation Lag, Non-Circular Eq. (2), and Transport (RQ2)", style='Heading 2', space_before=1.9, space_after=0.65)
    add_p(r"Across <i>R</i> = 5 × 40 = 200 clean staggered scans (Exp 2A, Table III, Fig. 2c), HTTP ingest finishes in 24.76 ms (`run SD` 0.78 ms; <i>p</i>_{50} = 26.92 ms). Outbox polling dwell averages 553.62 ms (`run SD` 14.30 ms; pooled 95% CI [515.6, 592.2] ms; <i>p</i>_{95} = 981.0 ms)—contributing <b>99.72% of post-commit tracking convergence</b> (553.62 / 555.16 ms; <i>R</i>^{2} = 99.99%) and <b>95.46% of full client E2E lag</b> Eq. (1) (553.62 / 579.92 ms). AMQP push adds only 1.55 ms to `TrackingService` and 0.50 ms to `ShipmentService` (−6..0 ms timestamp ordering skew arises because `ScanService` calls HTTP `publishEvent()` immediately before SQL `markPublished()`), whereas `ReportingService`'s 1,000 ms HTTP `/get` pull phase-locks at 1,000.60 ms post-publish (1,554.21 ms post-commit).", style='Text')
    add_p(r"<i>Non-Circular Eq. (2) Evaluation (Exp 2D):</i> Independent component probes measured outside Exp 2A give <i>δ</i>_{timer} = 0.945 ms (<i>n</i> = 15), <i>t</i>_{select} = 1.215 ms (<i>n</i> = 50), <i>t</i>_{mark} = 0.245 ms (<i>n</i> = 100), and HTTP publish <i>t</i>_{pub} = 1.357 ms (Exp 2C, <i>n</i> = 1,000). With Exp 2A's 159.6 ms mean inter-arrival interval ($\bar{k} = 6.27$ rows/tick), Eq. (2) predicts raw-SQL <i>L</i>_{batch} = 7.98 ms and a lower-bound dwell floor of 507.98 ms—leaving a transparent +45.6 ms margin relative to measured 553.62 ms attributable to Prisma query-engine wrappers and sequential HTTP connection teardown in the relay worker (within ~2.3× Monte-Carlo SE ≈ 19.8 ms).", style='Text')
    add_p(r"Under <i>R</i> = 5 bursts of 200 writes (<i>c</i> = 50, Exp 2B, Fig. 3a), outbox draining finishes in 4,060.2 ± 299.7 ms (DB span 3,941.0 ± 324.4 ms), tracking Eq. (3)'s 4,000 ms prediction. In Exp 2C (<i>R</i> = 5 × 200 messages), switching HTTP Management sequential publishing (271.6 ± 36.0 ms; 745.8 msg/s) to native AMQP `ConfirmChannel` cuts run totals to 113.1 ± 6.5 ms sequentially (2.40 ± 0.19×) and <b>9.15 ± 1.06 ms</b> when pipelined in batches of 50 (22,074 ± 2,407 msg/s; <b>29.78 ± 3.31× speedup</b>).", style='Text')

    add_p("Idempotency, FSM Safety, Locks, and TTL/DLQ Proof (RQ3)", style='Heading 2', space_before=1.9, space_after=0.65)
    add_p(r"Across <i>R</i> = 5 clean runs covering 1,000 HTTP calls over 300 unique keys (Exp 3, Fig. 3b), dual-layer idempotency returned 1,000/1,000 (100.0%) `2xx` responses while creating strictly 300/300 `ScanEvent`, 300/300 `OutboxEvent`, and 300/300 `AggregationJob` records (60/60 per run). Layer-1 cache replay sped up sequential retries 2.42 ± 0.48× across runs (run medians 4.88 vs. 11.51 ms Fresh; paired <i>t</i>-test <i>p</i> = 0.0164; 5/5 runs faster), while Layer-2 `P2002` resolved all 6× parallel storms cleanly (55.33 ms median). Injecting 150 duplicate RabbitMQ envelopes (5 × 30) leaked 0/150 tracking rows and 0/150 KPI increments. Against 60 OOO/terminal AMQP attacks (Exp 4A), the 19-state FSM preserved 60/60 (100.0%; Clopper–Pearson 95% CI [94.04%, 100.0%]) authoritative states and 60/60 phased lock probes (30 blocked `400`, 30 overridden `201`).", style='Text')
    add_p(r"In Exp 4B (Fig. 3c, <i>N</i> = 20 faults), 10/10 (100.0%; 95% CI [69.15%, 100.0%]) orphan events healed automatically at 10.48 s after delayed parent creation at 3.11 s, and 10/10 ([69.15%, 100.0%]) permanent poison tokens reached `.dlq` (20/20 conservation, [83.16%, 100.0%]). Crucially, Management API queue polling (`/api/queues` under `rates_mode = basic`) exhibits a ~4–5 s stats-collection lag (`.retry.1m` observed 14.60 → 74.45 s), whereas extracting raw AMQP `x-death` headers directly from `.dlq` messages verifies an <b>exact 60 s</b> `.retry.1m` <b>TTL</b> (`1794324717 − 1794324657 = 60 s`, 70 s total broker TTL across 10/10 frames).", style='Text')

    add_full_width_figure(
        fig3_path,
        r"Fig. 3. Burst drain, deduplication, and DLQ telemetry: (a) <i>R</i> = 5 burst-200 drain staircases (<i>T</i>_{poll} = 1,000 ms, <i>B</i> = 50) + Exp 2C transport inset; (b) Dual-layer idempotency latency across 1,000 HTTP calls (<i>R</i> = 5); and (c) Live TTL retry recovery (`10/10` healed @ 10.48 s) and broker `x-death`-verified 60 s `.retry.1m` quarantine (`10/10` → `.dlq`).",
        width_in=5.95
    )

    add_p("Table III", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2.0, space_after=0.35, keep_with_next=True)
    add_p(r"Lag Decomposition (Exp 2A/2D), Transport (Exp 2C), and Reliability/Audit Summary (Exp 2B–4B)", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0.9, keep_with_next=True)
    t3_headers = ["Pipeline / Verification Target", "Sample (<i>R</i>=5)", "Mean / Outcome", "SD / CI_{95} / Rate", "Share / Key Finding"]
    t3_rows = [
        ["2A: Ingest → Outbox Dwell", "<i>N</i>=200 (5×40)", "24.76 → 553.62 ms", "SD 14.30 (run)\n<i>p</i>_{95} = 981 ms", "99.72% Post / 95.46% E2E"],
        ["2A: AMQP Push / Rep. Pull", "<i>N</i>=200 (5×40)", "1.55 / 1,000.6 ms", "555.2 / 1,554 ms", "FSM 0.50 ms; 1 s phase-lock"],
        ["2D: Non-Circular Eq. (2)", "<i>n</i>=15..1,000", "Floor 507.98 ms", "<i>L</i>_{batch} = 7.98 ms", "+45.6 ms ORM relay margin"],
        ["2B: Burst-200 Drain Curve", "5 × 200 writes", "4,060.2 ms", "SD 299.7 (DB 3,941)", "Matches Eq. (3) 4,000 ms"],
        ["2C: HTTP / AMQP Seq / B50", "5 × 200 msgs", "271.6 / 113.1 / 9.15", "0.75k / 1.77k / 22.1k/s", "2.40× Seq / 29.78× Batch50"],
        ["3/3C: Dual-Layer Idem. & F2", "1,000 + 150 dup", "300/300 Exact; 0 dup", "2.42× L1 (<i>p</i>=0.016)", "F2: 40 popped / 1.77 s tail"],
        ["4A: FSM OOO & Lock Probes", "60 + 60 + 20", "60/60 FSM; 60/60 Ph.", "[94.04%, 100.0%]", "F1: 20/20 Skew; F3: 15/20 Race"],
        ["4B: Retry Heal & `.dlq` TTL", "10 + 10 faults", "10/10 Heal; 10/10 DLQ", "[69.15%, 100%]; [83.2, 100%]", "60 s exact AMQP `x-death` TTL"]
    ]
    cw3 = [Inches(0.92), Inches(0.53), Inches(0.68), Inches(0.67), Inches(0.70)]
    build_table(t3_headers, t3_rows, cw3, highlight_rows={0, 4, 7}, font_pt=5.25, keep_with_notes=True)
    add_p(r"<i>Notes:</i> Post-commit convergence excludes HTTP ingest (24.76 ms). AMQP −6..0 ms skew stems from publishing ahead of SQL `markPublished()`. `.dlq` verify 60 s `x-death` TTL.", style='footnote text', space_before=0.7, space_after=1.1)

    # ==========================================
    # V. DISCUSSION AND ACTIVE CODEBASE AUDIT (F1-F3)
    # ==========================================
    add_p("DISCUSSION AND ACTIVE CODEBASE AUDIT (F1–F3)", style='Heading 1', space_before=2.4, space_after=0.9)
    add_p(r"<i>Synthesizing RQ1–RQ3:</i> Live lock profiling confirms that single-row (`Sync_ALL`) and even 16-shard (`Sync_Sharded`) synchronous KPI counters trigger severe PostgreSQL `txid` lock contention (92–98% lock-wait sampling). Outbox isolation completely eliminates write-side lock contention (0.0%), unlocking +216.2% speedup in raw SQL (`Ablation_Outbox_SQL`). Yet real microservice boundaries must earn that headroom: running `ScanService` on `connection_limit=3` alongside cross-service HTTP Lock RPCs and ORM serialization drops ingress −38.6% then −53.4%, showing why local lock replication and pooled connections are prerequisite to realizing Outbox throughput gains. Likewise, CQRS shields tracking queries from 100% `Sync_ALL` write-lock stalls (−29.7% <i>p</i>_{95}), yet bounded `LIMIT` projections remain essential so idle reads match SQL speed. Finally, while <i>T</i>_{poll} = 1,000 ms explains 99.72% of post-commit lag, sub-50 ms SLOs warrant PostgreSQL `LISTEN/NOTIFY` or Debezium WAL CDC [18] (trading polling wait for replication-slot management).", style='Text')

    add_p(r"<i>Three Unpatched Cluster Findings (F1–F3):</i> Fault instrumentation exposed three active defects in the evaluated binaries with concrete remediations:", style='Text')
    add_num_list_p("1)", "F1 — CQRS Read View Skew (20/20 Shipments): ", r"While `ShipmentService` rejected 60/60 OOO terminal attacks, missing-snapshot OOO envelopes cause `TrackingService` to infer status directly from the late event type, overwriting `TrackingCurrent` across all 20/20 test parcels. <i>Fix:</i> Enforce monotonic `stateVersion` or `occurredAt` guards on projection writes using authoritative state events.")
    add_num_list_p("2)", "F2 — HTTP Pull Crash Exposure (40 Frames / 1.77 s Tail): ", r"`ReportingService` pulls 20-message batches via HTTP `ack_requeue_false` before `AggregationJob` commits complete; our live 40-frame probe showed all 40/40 messages popped prematurely ahead of a 1,771 ms DB commit tail (at-most-once crash gap). <i>Fix:</i> Migrate to AMQP push with manual `basicAck` executed strictly post-commit.")
    add_num_list_p("3)", "F3 — Async Lock TOCTOU & Non-Atomic Outbox (15/20 Race + −53.4% Tax): ", r"Interleaved `INVENTORY_CHECK` bursts triggered an asynchronous unlock event that cleared `isLocked = false` mid-tick, allowing 5/10 subsequent locked scans to pass (`15/20` overall). Moreover, sequential HTTP Lock RPCs plus unbundled `ScanEvent` and `OutboxEvent` writes halve ingress throughput. <i>Fix:</i> Replicate lock flags asynchronously into `scan_db` and wrap local scan + outbox writes in `prisma.$transaction`.")

    # ==========================================
    # VI. CONCLUSION, LIMITATIONS, AND REPRODUCIBILITY
    # ==========================================
    add_p("CONCLUSION, LIMITATIONS, AND REPRODUCIBILITY", style='Heading 1', space_before=2.4, space_after=0.9)
    add_p(r"<i>Conclusion:</i> Across <i>R</i> = 5 repeated live-cluster runs paired with PostgreSQL lock telemetry and component ablation, we demonstrate that lock-free SQL Outbox isolation raises write throughput +216.2% over unsharded `Sync_ALL` and +56.2% over 16-shard `Sync_Sharded` (`0.0%` vs `91.8–97.7%` lock waits), while pinpointing how `pool=3` limits (−38.6%) and synchronous HTTP Lock RPCs + ORM costs (−53.4%) bottleneck the deployed service (`F3`). Under <i>c</i> = 50 writers, CQRS read isolation eliminates 100% write-lock bleed (−29.7% <i>p</i>_{95} vs. `Sync_ALL`), non-circular Eq. (2) bounds outbox dwell (99.72% post-commit share), batch-50 AMQP confirms reach 29.78× speedup, dual-layer idempotency holds 300/300 exact commits (1,000 calls), and broker `x-death` headers confirm exact 60 s retry-queue TTL quarantine alongside code findings `F1`–`F3`.", style='Text')
    add_p("<i>Limitations & Reproducibility:</i> All tests ran on a single Apple M4 host (native PM2 services + Docker PG/RabbitMQ, excluding WAN latency) using synthetic 200–1,000 call bursts and remain intentionally pre-patch for `F1`–`F3`. Harness scripts (`run_benchmarks.mjs`, `baseline_worker.mjs`, `analyze_benchmarks.py`, `generate_distributed_charts.py`) and raw <i>R</i> = 5 CSV/JSON traces are archived at `https://github.com/VoVanTuTai/logistics-management-system`.", style='Text')

    # ==========================================
    # REFERENCES (18 directly cited references)
    # ==========================================
    add_p("REFERENCES", style='Reference Head', space_before=2.0, space_after=0.8)
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
        r"[17] M. Fowler, “CQRS,” <i>MartinFowler.com Architecture Series</i>, Jul. 2011.",
        r"[18] G. Morling, “Reliable microservices data exchange with the Outbox pattern,” <i>Debezium Engineering Blog</i>, Feb. 2019."
    ]
    for r in refs:
        p = add_p(r, style='References', space_after=0.25, line_spacing=0.96, math_pt=6.8, pt_size=6.8)
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
