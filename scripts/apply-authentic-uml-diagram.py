#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
apply-authentic-uml-diagram.py
Injects authentic, 100% textbook OMG UML 2.5 Diagram 1 into Nexus.vpp:
- 43 Classes with visible, bold centered headers and complete Prisma attributes
- 16 Compositions with native solid diamonds (◆)
- 2 Aggregations with native hollow diamonds (◇)
- 13 Associations with native navigability arrows (───>) and Multiplicities (1, 1..*, 0..*, 0..1)
- 1 Dependency with native dashed line and open stick arrow (- - - >)
- Zero occlusions, clean background
"""

import sqlite3
import re
import os
import subprocess

VPP_PATH = '/Users/Tai.IS/Documents/VPProjects/Nexus.vpp'
BLUEPRINT_SCRIPT = '/Users/Tai.IS/my-project/logistics-management-system/scripts/generate-authentic-vp-domain-model.py'

def main():
    conn = sqlite3.connect(VPP_PATH)
    cur = conn.cursor()

    # 1. Parse class coordinates and attributes from blueprint
    with open(BLUEPRINT_SCRIPT, 'r', encoding='utf-8') as f:
        text = f.read()

    classes = []
    curr = None
    for l in text.splitlines():
        if 'vp.draw_class(' in l or 'draw_class(' in l:
            curr = {}
        if curr is not None:
            m_cx = re.search(r'cx=(\d+)', l)
            m_cy = re.search(r'cy=(\d+)', l)
            m_cw = re.search(r'cw=(\d+)', l)
            m_name = re.search(r'name=\"([^\"]+)\"', l)
            m_st = re.search(r'stereotype=\"([^\"]+)\"', l)
            m_th = re.search(r'theme=\"([^\"]+)\"', l)
            if m_cx: curr['cx'] = int(m_cx.group(1))
            if m_cy: curr['cy'] = int(m_cy.group(1))
            if m_cw: curr['cw'] = int(m_cw.group(1))
            if m_name: curr['name'] = m_name.group(1)
            if m_st: curr['st'] = m_st.group(1)
            if m_th: curr['th'] = m_th.group(1)
            if 'attrs=[' in l:
                curr['attrs'] = []
                curr['in_attrs'] = True
            elif curr.get('in_attrs'):
                if l.strip().startswith(']'):
                    curr['in_attrs'] = False
                    curr['ch'] = 46 + len(curr['attrs']) * 19
                    classes.append(curr)
                    curr = None
                else:
                    m_a = re.search(r'\"([^\"]+)\"', l)
                    if m_a: curr['attrs'].append(m_a.group(1))

    # Parse relationships
    all_rels_iter = list(re.finditer(r'vp\.(draw_composition|draw_aggregation|draw_association|draw_dependency)\s*\(', text))
    relationships = []
    for m in all_rels_iter:
        depth = 0
        pos = m.start()
        end = pos
        while pos < len(text):
            if text[pos] == '(':
                depth += 1
            elif text[pos] == ')':
                depth -= 1
                if depth == 0:
                    end = pos
                    break
            pos += 1
        call_str = text[m.start():end+1]
        fn = re.search(r'vp\.(\w+)', call_str).group(1)
        pts_match = re.search(r'points=\[([^\]]+)\]', call_str)
        m1_match = re.search(r'mult1=\"([^\"]*)\"', call_str)
        m2_match = re.search(r'mult2=\"([^\"]*)\"', call_str)
        role_match = re.search(r'role=\"([^\"]*)\"', call_str)
        lbl_match = re.search(r'label=\"([^\"]*)\"', call_str)
        pts_val = [(int(x), int(y)) for x, y in re.findall(r'\((\d+),\s*(\d+)\)', pts_match.group(1))] if pts_match else []

        relationships.append({
            'fn': fn,
            'points': pts_val,
            'mult1': m1_match.group(1) if m1_match else '',
            'mult2': m2_match.group(1) if m2_match else '',
            'role': role_match.group(1) if role_match else (lbl_match.group(1) if lbl_match else '')
        })

    print(f'Parsed: {len(classes)} classes, {len(relationships)} relationships')

    # Helper to find class by point
    def find_class_at_point(p):
        px, py = p
        for c in classes:
            if (c['cx'] - 60 <= px <= c['cx'] + c['cw'] + 60) and (c['cy'] - 60 <= py <= c['cy'] + c['ch'] + 60):
                return c['name']
        return None

    # Query class model IDs and paths
    class_id_map = {}
    class_path_map = {}
    for c in classes:
        cname = c['name']
        row = cur.execute('SELECT ID, PARENT_ID FROM MODEL_ELEMENT WHERE NAME=? AND MODEL_TYPE="Class"', (cname,)).fetchone()
        if row:
            cid, cparent = row
            class_id_map[cname] = cid
            class_path_map[cname] = f'{cparent}:{cid}' if cparent else cid
        else:
            print(f'ERROR: Class {cname} not found in MODEL_ELEMENT!')

    # Helper to strip all Child=(...) blocks safely
    def strip_all_child_blocks(cdef):
        while True:
            idx = cdef.find('Child=(')
            if idx == -1:
                break
            start_search = idx + 7
            paren_count = 1
            end_idx = idx
            for i in range(start_search, len(cdef)):
                if cdef[i] == '(':
                    paren_count += 1
                elif cdef[i] == ')':
                    paren_count -= 1
                    if paren_count == 0:
                        end_idx = i + 1
                        if end_idx < len(cdef) and cdef[end_idx] == ';':
                            end_idx += 1
                        break
            cdef = cdef[:idx] + cdef[end_idx:]
        return cdef

    # Sync class attributes to MODEL_ELEMENT
    for c in classes:
        cname = c['name']
        cid = class_id_map.get(cname)
        if not cid:
            continue
        cur.execute('SELECT DEFINITION FROM MODEL_ELEMENT WHERE ID=?', (cid,))
        row = cur.fetchone()
        if not row or not row[0]:
            continue
        cdef = row[0].decode('utf-8', errors='ignore')
        clean_cdef = strip_all_child_blocks(cdef)

        attr_defs = []
        for a_idx, a_str in enumerate(c['attrs']):
            clean_attr_name = a_str.strip('+ ').strip()
            aid = f'at_{cid[:8]}_{a_idx:03d}.'
            adef = f'''\t\t{{{aid}:"{clean_attr_name}":Attribute {{
\t\t\tvisibility=71;
\t\t\t_modelEditable=T;
\t\t}}}}'''
            attr_defs.append(adef)

        child_block = 'Child=(\n' + ',\n'.join(attr_defs) + '\n\t);'
        last_brace = clean_cdef.rfind('}')
        if last_brace != -1:
            new_cdef = clean_cdef[:last_brace] + '\t' + child_block + '\n' + clean_cdef[last_brace:]
        else:
            new_cdef = clean_cdef + '\n\t' + child_block

        cur.execute('UPDATE MODEL_ELEMENT SET DEFINITION=? WHERE ID=?', (new_cdef.encode('utf-8'), cid))
    print(f'Synchronized attributes for {len(classes)} classes into MODEL_ELEMENT')

    # 2. Setup Container Hierarchy for Relationships
    rel_c = cur.execute('SELECT ID FROM MODEL_ELEMENT WHERE MODEL_TYPE="ModelRelationshipContainer" AND NAME="relationships"').fetchone()
    rel_c_id = rel_c[0] if rel_c else 'wYsxTwWD.AAAAQwL'

    assoc_c = cur.execute('SELECT ID FROM MODEL_ELEMENT WHERE MODEL_TYPE="ModelRelationshipContainer" AND NAME="Association"').fetchone()
    if not assoc_c:
        assoc_c_id = 'c_assoc_cont...'
        c_def = f'{assoc_c_id}:"Association":ModelRelationshipContainer {{\n}}'
        cur.execute('INSERT INTO MODEL_ELEMENT VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    (assoc_c_id, None, None, 'ModelRelationshipContainer', rel_c_id, 'Association', c_def.encode('utf-8'), None, 'Tai.IS', 1790775710000, 1790775710000))
    else:
        assoc_c_id = assoc_c[0]

    dep_c = cur.execute('SELECT ID FROM MODEL_ELEMENT WHERE MODEL_TYPE="ModelRelationshipContainer" AND NAME="Dependency"').fetchone()
    if not dep_c:
        dep_c_id = 'c_dep_cont....'
        c_def = f'{dep_c_id}:"Dependency":ModelRelationshipContainer {{\n}}'
        cur.execute('INSERT INTO MODEL_ELEMENT VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    (dep_c_id, None, None, 'ModelRelationshipContainer', rel_c_id, 'Dependency', c_def.encode('utf-8'), None, 'Tai.IS', 1790775710000, 1790775710000))
    else:
        dep_c_id = dep_c[0]

    # DIAGRAM 1
    d1_id = 'diag_class_0001.'
    d1_name = '01. Domain Architecture - 43 Classes'

    # Clean existing Diagram 1 and test diagrams
    cur.execute('DELETE FROM DIAGRAM WHERE ID=?', (d1_id,))
    cur.execute('DELETE FROM DIAGRAM_ELEMENT WHERE DIAGRAM_ID=?', (d1_id,))
    cur.execute('DELETE FROM DIAGRAM WHERE ID LIKE "diag_test%"')
    cur.execute('DELETE FROM DIAGRAM_ELEMENT WHERE DIAGRAM_ID LIKE "diag_test%"')

    # Delete previously injected diagram 1 model relationships and notes
    cur.execute('DELETE FROM MODEL_ELEMENT WHERE ID LIKE "m_d1_rel_%"')
    cur.execute('DELETE FROM MODEL_ELEMENT WHERE ID LIKE "m_d1_note_%"')

    d1_children = []
    d1_de_rows = []

    # A. Add 43 Classes
    class_de_map = {}
    for c_idx, c in enumerate(classes):
        cname = c['name']
        cid = class_id_map[cname]
        cpath = class_path_map[cname]
        de_id = f'sh_c_{c_idx+1:04d}.....'
        class_de_map[cname] = de_id

        # Class shape definition
        c_def = f'''{de_id}:"{cname}":Class {{
\tshowOperationType=0;
\tshowAttributeType=1;
\tcreatorDiagramType="ClassDiagram";
\tconnectToPoint=T;
\ty={c['cy']};
\tx={c['cx']};
\tmetaModelElement=<{cpath}>;
\theight={c['ch']};
\twidth={c['cw']};
\tbackground=(
\t\t255, 
\t\t255, 
\t\t255, 
\t\t255
\t);
\tforeground=(
\t\t15, 
\t\t23, 
\t\t42, 
\t\t255
\t);
\t_captionUIModel=(
\t\t@x=0;, 
\t\t@y=0;, 
\t\t@width={c['cw']};, 
\t\t@height=28;, 
\t\t@side=8;, 
\t\t@visible=T;, 
\t\t@internalWidth={c['cw']};, 
\t\t@internalHeight=28;
\t);
\t_elementFont=(
\t\t@name="Dialog";, 
\t\t@size=12;, 
\t\t@style=1;
\t);
}}'''
        d1_children.append(f'<{d1_id}:{de_id}>')
        d1_de_rows.append((de_id, 'Class', d1_id, cid, None, None, None, c_def.encode('utf-8')))

    # Helper to compute exact boundary-docked canvas points (0px gap)
    def snap_boundary_points(c1_obj, c2_obj, pts):
        p0 = list(pts[0])
        pn = list(pts[-1])

        c1_l, c1_r = c1_obj['cx'], c1_obj['cx'] + c1_obj['cw']
        c1_t, c1_b = c1_obj['cy'], c1_obj['cy'] + c1_obj['ch']

        d_r = abs(p0[0] - c1_r)
        d_l = abs(p0[0] - c1_l)
        d_b = abs(p0[1] - c1_b)
        d_t = abs(p0[1] - c1_t)
        m1 = min(d_r, d_l, d_b, d_t)
        if m1 == d_r: p0[0] = c1_r
        elif m1 == d_l: p0[0] = c1_l
        elif m1 == d_b: p0[1] = c1_b
        else: p0[1] = c1_t

        c2_l, c2_r = c2_obj['cx'], c2_obj['cx'] + c2_obj['cw']
        c2_t, c2_b = c2_obj['cy'], c2_obj['cy'] + c2_obj['ch']

        d2_r = abs(pn[0] - c2_r)
        d2_l = abs(pn[0] - c2_l)
        d2_b = abs(pn[1] - c2_b)
        d2_t = abs(pn[1] - c2_t)
        m2 = min(d2_r, d2_l, d2_b, d2_t)
        if m2 == d2_l: pn[0] = c2_l
        elif m2 == d2_r: pn[0] = c2_r
        elif m2 == d2_t: pn[1] = c2_t
        else: pn[1] = c2_b

        res = [tuple(p0)] + pts[1:-1] + [tuple(pn)]
        return ';'.join([f'{p[0]},{p[1]}' for p in res]) + ';'

    # B. Add 32 Relationships with authentic OMG UML 2.5 Model Elements
    class_obj_map = {c['name']: c for c in classes}
    for r_idx, r in enumerate(relationships):
        c1 = find_class_at_point(r['points'][0])
        c2 = find_class_at_point(r['points'][-1])
        if not c1 or not c2:
            print(f'Warning: unlinked rel {r_idx}: pts={r["points"][0]} to {r["points"][-1]}')
            continue

        c1_obj = class_obj_map[c1]
        c2_obj = class_obj_map[c2]

        from_de = class_de_map[c1]
        to_de = class_de_map[c2]
        c1_path = class_path_map[c1]
        c2_path = class_path_map[c2]

        de_id = f'sh_rel_{r_idx+1:04d}...'
        fn = r['fn']
        clean_role = r['role'].replace('▶', '').replace('▼', '').replace('▲', '').replace('◀', '').strip()

        # Compute exact boundary points
        # For multi-bend mid-mile lines, simplify to direct 2-point boundary connections to prevent VP auto-routing loops
        if r_idx in (18, 19, 23, 25): # 0-indexed: Rel 19, 20, 24, 26
            raw_pts_to_use = [r['points'][0], r['points'][-1]]
        else:
            raw_pts_to_use = r['points']

        pts_str = snap_boundary_points(c1_obj, c2_obj, raw_pts_to_use)

        if fn == 'draw_dependency':
            # 1. Dependency Model Element
            m_rel_id = f'm_d1_rel_{r_idx+1:04d}..'
            m_dep_path = f'{rel_c_id}:{dep_c_id}:{m_rel_id}'
            m_def = f'''{m_rel_id}:"«events»":Dependency {{
\t_masterViewId="{de_id}";
\tfromModel=<{c1_path}>;
\ttoModel=<{c2_path}>;
\t_modelViews=(
\t\t{{v_d1_rel_{r_idx+1:04d}:"View":ModelView {{
\t\t\tcontainer=<{d1_id}>;
\t\t\tview="{de_id}";
\t\t}}}}
\t);
\t_modelEditable=T;
}}'''
            cur.execute('INSERT INTO MODEL_ELEMENT VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        (m_rel_id, None, None, 'Dependency', dep_c_id, clean_role, m_def.encode('utf-8'), None, 'Tai.IS', 1790775710000, 1790775710000))

            # 2. Dependency Diagram Element
            rel_def = f'''{de_id}:"{clean_role}":Dependency {{
\tmetaModelElement=<{m_dep_path}>;
\t_fromShape=<{d1_id}:{from_de}>;
\t_toShape=<{d1_id}:{to_de}>;
\t_points="{pts_str}";
\tshowStereotypes=T;
\t_lineModel=(@cap=0;, @weight=1.5;, @color=(37, 99, 235, 255);, @hasStroke=T;);
}}'''
            d1_children.append(f'<{d1_id}:{de_id}>')
            d1_de_rows.append((de_id, 'Dependency', d1_id, m_rel_id, None, None, None, rel_def.encode('utf-8')))

        else:
            # Association / Composition / Aggregation
            m_rel_id = f'm_d1_rel_{r_idx+1:04d}..'
            m_assoc_path = f'{rel_c_id}:{assoc_c_id}:{m_rel_id}'

            # AggregationKind: 67=Composited (◆), 66=Aggregation (◇), 65=None (───)
            # In Visual Paradigm, to make the navigability arrow point towards _toShape,
            # navigable=1 is set on the 'from' AssociationEnd (or Direction=0).
            if fn == 'draw_composition':
                agg_kind = 67
                nav_from = 0
            elif fn == 'draw_aggregation':
                agg_kind = 66
                nav_from = 0
            else: # Association
                agg_kind = 65
                nav_from = 1

            m1_val = r['mult1'] if r['mult1'] else '1'
            m2_val = r['mult2'] if r['mult2'] else '*'

            m_def = f'''{m_rel_id}:"{clean_role}":Association {{
\t_masterViewId="{de_id}";
\t_modelViews=(
\t\t{{v_d1_rel_{r_idx+1:04d}:"View":ModelView {{
\t\t\tcontainer=<{d1_id}>;
\t\t\tview="{de_id}";
\t\t}}}}
\t);
\t_modelEditable=T;
\tfrom={{m_end_{r_idx+1:04d}a:NULL:AssociationEnd {{
\t\tmultiplicity="{m1_val}";
\t\taggregationKind={agg_kind};
\t\ttype=<{c1_path}>;
\t\tEndModelElement=<{c1_path}>;
\t\tDirection=0;
\t\tnavigable={nav_from};
\t\t_modelEditable=T;
\t}}}};
\tto={{m_end_{r_idx+1:04d}b:NULL:AssociationEnd {{
\t\tmultiplicity="{m2_val}";
\t\taggregationKind=65;
\t\ttype=<{c2_path}>;
\t\tEndModelElement=<{c2_path}>;
\t\tDirection=1;
\t\tnavigable=0;
\t\t_modelEditable=T;
\t}}}};
}}'''
            cur.execute('INSERT INTO MODEL_ELEMENT VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        (m_rel_id, None, None, 'Association', assoc_c_id, clean_role, m_def.encode('utf-8'), None, 'Tai.IS', 1790775710000, 1790775710000))

            # Determine orientation and calculate calibrated multiplicity docking coordinates
            p_start = r['points'][0]
            p_end = r['points'][-1]
            dx_span = abs(c2_obj['cx'] - c1_obj['cx'])
            dy_span = abs(c2_obj['cy'] - c1_obj['cy'])

            is_vert = dy_span > dx_span
            if is_vert:
                if c2_obj['cy'] > c1_obj['cy']:
                    # Top to Bottom
                    rx_A, ry_A = 10, 10
                    rx_B, ry_B = 10, -15
                else:
                    # Bottom to Top (e.g. CodSettlementBatch -> CodRecord)
                    rx_A, ry_A = 10, -15
                    rx_B, ry_B = 10, 10
            else:
                # Horizontal Left to Right
                rx_A, ry_A = 64, 26
                # Compute connector width approximation: distance between classes + 98
                approx_cw = (c2_obj['cx'] - (c1_obj['cx'] + c1_obj['cw'])) + 98
                rx_B, ry_B = max(approx_cw - 85, 120), 26

            mult_block = f'''\thasMultiplicityAShape=T;
\thasMultiplicityBShape=T;
\tmultiplicityARectangle=(
\t\t{rx_A}, 
\t\t{ry_A}, 
\t\t30, 
\t\t20
\t);
\tmultiplicityBRectangle=(
\t\t{rx_B}, 
\t\t{ry_B}, 
\t\t35, 
\t\t20
\t);'''

            rel_def = f'''{de_id}:"{clean_role}":Association {{
\tmetaModelElement=<{m_assoc_path}>;
\t_fromShape=<{d1_id}:{from_de}>;
\t_toShape=<{d1_id}:{to_de}>;
\t_points="{pts_str}";
\tshowStereotypes=T;
\tshowFromRoleName=F;
\tshowToRoleName=F;
\tshowFromMultiplicity=T;
\tshowToMultiplicity=T;
{mult_block}
\tshowNavigationArrows=3;
\tshowDirection=T;
\t_lineModel=(@cap=0;, @weight=1.2;, @color=(15, 23, 42, 255);, @hasStroke=T;);
}}'''
            d1_children.append(f'<{d1_id}:{de_id}>')
            d1_de_rows.append((de_id, 'Association', d1_id, m_rel_id, None, None, None, rel_def.encode('utf-8')))

    # C. Add 2 SOP Notes with Leader Anchors (Carrier Domain & Stray Investigation)
    # Model Element for Note 1
    m_note1_id = 'm_d1_note_1...'
    doc1 = (
        '<html>'
        '<b>«Standard Note: Carrier Physical Ceilings»</b><br/>'
        '• <b>Phân loại 5 nhóm:</b> GENERAL, FRAGILE, HIGH_VALUE, BULKY, DOCUMENT.<br/>'
        '• <b>Quy chuẩn tính cước IATA / VLA:</b><br/>'
        '  Chargeable Weight = max(Cân thực tế, (D x R x C)/6000).<br/>'
        '• <b>Tầng 1 (Tiêu chuẩn):</b> Khối lượng &lt;= 20kg &amp; Cạnh &lt;= 60cm.<br/>'
        '• <b>Tầng 2 (Cồng kềnh xe tải):</b> 21-70kg HOẶC cạnh 61-150cm.<br/>'
        '• <b>Tầng 3 (Vượt trần mạng lưới):</b> Chặn tạo đơn nếu &gt; 70kg / cạnh &gt; 150cm / D+R+C &gt; 300cm.'
        '</html>'
    )
    m_note1_def = f'''{m_note1_id}:"«Standard Note: Carrier Physical Ceilings»":NOTE {{
\tdocumentation="{doc1}";
}}'''
    cur.execute('INSERT INTO MODEL_ELEMENT VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                (m_note1_id, None, None, 'NOTE', None, 'Carrier Physical Ceilings SOP', m_note1_def.encode('utf-8'), None, 'Tai.IS', 1790775710000, 1790775710000))

    note1_id = 'sh_note_0001...'
    note1_def = f'''{note1_id}:"«Standard Note: Carrier Physical Ceilings»":NOTE {{
\tmetaModelElement=<{m_note1_id}>;
\tconnectToPoint=T;
\ty=930;
\tx=1910;
\twidth=440;
\theight=270;
\tbackground=(
\t\t254, 
\t\t243, 
\t\t199, 
\t\t255
\t);
\tforeground=(
\t\t180, 
\t\t83, 
\t\t9, 
\t\t255
\t);
\t_lineModel=(
\t\t@cap=0;, 
\t\t@weight=1.2;, 
\t\t@color=(
\t\t\t180, 
\t\t\t83, 
\t\t\t9, 
\t\t\t255
\t\t);, 
\t\t@hasStroke=T;
\t);
}}'''
    d1_children.append(f'<{d1_id}:{note1_id}>')
    d1_de_rows.append((note1_id, 'NOTE', d1_id, m_note1_id, None, None, None, note1_def.encode('utf-8')))

    anc1_id = 'sh_anc_0001....'
    anc1_def = f'''{anc1_id}:NULL:Anchor {{
\tforeground=(
\t\t180, 
\t\t83, 
\t\t9, 
\t\t255
\t);
\t_points="1910,1030;1690,950;";
\t_fromShape=<{d1_id}:{note1_id}>;
\t_toShape=<{d1_id}:{class_de_map['InvestigationCase']}>;
\t_lineModel=(
\t\t@cap=0;, 
\t\t@weight=1.2;, 
\t\t@color=(
\t\t\t180, 
\t\t\t83, 
\t\t\t9, 
\t\t\t255
\t\t);, 
\t\t@hasStroke=T;
\t);
}}'''
    d1_children.append(f'<{d1_id}:{anc1_id}>')
    d1_de_rows.append((anc1_id, 'Anchor', d1_id, None, None, None, None, anc1_def.encode('utf-8')))

    # Model Element for Note 2
    m_note2_id = 'm_d1_note_2...'
    doc2 = (
        '<html>'
        '<b>«SOP Note: Stray Parcel Investigation &amp; Hearing»</b><br/>'
        '• <b>4 Điểm gãy Audit Engine:</b> WAREHOUSE_STALE_LOSS, LINEHAUL_IN_TRANSIT, MISROUTED, LAST_MILE.<br/>'
        '• <b>Cửa sổ giải trình 24h:</b> Nghi can trích xuất CCTV bàn dỡ &amp; biên bản giao xe tuyến.<br/>'
        '• <b>Gia hạn tối đa:</b> +12h khi xin trích xuất camera liên Hub.<br/>'
        '• <b>Mục tiêu tối thượng:</b> Rà soát hiện trường kho &amp; Cứu đơn.<br/>'
        '• <b>Quá 24h không giải trình:</b> Phán quyết chế tài bồi thường 100% lương/KPI.'
        '</html>'
    )
    m_note2_def = f'''{m_note2_id}:"«SOP Note: Stray Parcel Investigation & Hearing»":NOTE {{
\tdocumentation="{doc2}";
}}'''
    cur.execute('INSERT INTO MODEL_ELEMENT VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                (m_note2_id, None, None, 'NOTE', None, 'Stray Parcel Investigation SOP', m_note2_def.encode('utf-8'), None, 'Tai.IS', 1790775710000, 1790775710000))

    note2_id = 'sh_note_0002...'
    note2_def = f'''{note2_id}:"«SOP Note: Stray Parcel Investigation & Hearing»":NOTE {{
\tmetaModelElement=<{m_note2_id}>;
\tconnectToPoint=T;
\ty=1240;
\tx=1910;
\twidth=440;
\theight=270;
\tbackground=(
\t\t254, 
\t\t243, 
\t\t199, 
\t\t255
\t);
\tforeground=(
\t\t180, 
\t\t83, 
\t\t9, 
\t\t255
\t);
\t_lineModel=(
\t\t@cap=0;, 
\t\t@weight=1.2;, 
\t\t@color=(
\t\t\t180, 
\t\t\t83, 
\t\t\t9, 
\t\t\t255
\t\t);, 
\t\t@hasStroke=T;
\t);
}}'''
    d1_children.append(f'<{d1_id}:{note2_id}>')
    d1_de_rows.append((note2_id, 'NOTE', d1_id, m_note2_id, None, None, None, note2_def.encode('utf-8')))

    anc2_id = 'sh_anc_0002....'
    anc2_def = f'''{anc2_id}:NULL:Anchor {{
\tforeground=(
\t\t180, 
\t\t83, 
\t\t9, 
\t\t255
\t);
\t_points="1910,1340;1690,1320;";
\t_fromShape=<{d1_id}:{note2_id}>;
\t_toShape=<{d1_id}:{class_de_map['CompensationClaim']}>;
\t_lineModel=(
\t\t@cap=0;, 
\t\t@weight=1.2;, 
\t\t@color=(
\t\t\t180, 
\t\t\t83, 
\t\t\t9, 
\t\t\t255
\t\t);, 
\t\t@hasStroke=T;
\t);
}}'''
    d1_children.append(f'<{d1_id}:{anc2_id}>')
    d1_de_rows.append((anc2_id, 'Anchor', d1_id, None, None, None, None, anc2_def.encode('utf-8')))

    # D. Finalize Diagram 1
    child_str = ',\n\t\t'.join(d1_children)
    d1_def = f'''{d1_id}:"{d1_name}":ClassDiagram {{
\tpaintConnectorThroughLabel=1;
\t_shapeGroups=NULL;
\tdiagramBackground=(
\t\t255, 
\t\t255, 
\t\t255, 
\t\t255
\t);
\tconnectorLabelOrientation=0;
\tshowPackageNameStyle=0;
\tshowDefaultPackage=F;
\tpointConnectorEndToCompartmentMember=T;
\tshowAttributeGetterSetter=F;
\tautoFitShapesSize=F;
\tconnectorStyle=1;
\tdiagramPreviewData_name=NULL;
\t_globalPaletteOption=T;
\tconnectionPointStyle=0;
\tgridWidth=10;
\talignToGrid=F;
\tcreationTime=1790775686767;
\tpmAuthor="Tai.IS";
\tconnectorLineJumpsSize=0;
\tshowStereotypes=T;
\tshapePresentationOption=0;
\tinitializeDiagramForCreate=T;
\tChild=(
\t\t{child_str}
\t);
\tmodelElementNameAlignment=4;
\tconnectorLineJumps=0;
\tgridHeight=10;
\tgridColor=(
\t\t192, 
\t\t192, 
\t\t192, 
\t\t255
\t);
}}'''

    cur.execute('INSERT INTO DIAGRAM VALUES (?, ?, ?, ?, ?)', (d1_id, 'ClassDiagram', None, d1_name, d1_def.encode('utf-8')))
    cur.executemany('INSERT INTO DIAGRAM_ELEMENT VALUES (?, ?, ?, ?, ?, ?, ?, ?)', d1_de_rows)
    print(f'Diagram 1: {len(d1_de_rows)} elements inserted ({len(classes)} classes, {len(relationships)} connectors)')

    conn.commit()
    conn.close()
    print('SUCCESS: Authentic UML 2.5 Diagram 1 committed to Nexus.vpp!')

if __name__ == '__main__':
    main()
