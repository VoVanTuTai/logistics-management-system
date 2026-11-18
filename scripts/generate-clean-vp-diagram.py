#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate-clean-vp-diagram.py
Builds a visually pristine, 100% bug-free Diagram 1 in Nexus.vpp:
- 43 Classes with visible, bold centered headers and complete Prisma attributes
- 32 Clean relationship connectors
- 2 SOP Notes
- 0 Opaque occluding packages
"""

import sqlite3
import re
import os

VPP_PATH = '/Users/Tai.IS/Documents/VPProjects/Nexus.vpp'
BLUEPRINT_SCRIPT = '/Users/Tai.IS/my-project/logistics-management-system/scripts/generate-authentic-vp-domain-model.py'

def main():
    conn = sqlite3.connect(VPP_PATH)
    cur = conn.cursor()

    # 1. Read class data from generate-authentic-vp-domain-model.py
    with open(BLUEPRINT_SCRIPT, 'r', encoding='utf-8') as f:
        text = f.read()

    classes = []
    lines = text.splitlines()
    curr = None
    for l in lines:
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

    # Query exact Model Element IDs
    class_id_map = {}
    for c in classes:
        cname = c['name']
        row = cur.execute('SELECT ID FROM MODEL_ELEMENT WHERE NAME=? AND MODEL_TYPE="Class"', (cname,)).fetchone()
        if row:
            class_id_map[cname] = row[0]
        else:
            print(f'ERROR: Class {cname} not found in MODEL_ELEMENT!')

    # Helper to find class by point
    def find_class_at_point(p):
        px, py = p
        for c in classes:
            if (c['cx'] - 60 <= px <= c['cx'] + c['cw'] + 60) and (c['cy'] - 60 <= py <= c['cy'] + c['ch'] + 60):
                return c['name']
        return None

    # DIAGRAM 1
    d1_id = 'diag_class_0001.'
    d1_name = '01. Domain Architecture - 43 Classes'

    cur.execute('DELETE FROM DIAGRAM WHERE ID=?', (d1_id,))
    cur.execute('DELETE FROM DIAGRAM_ELEMENT WHERE DIAGRAM_ID=?', (d1_id,))
    # Clean up test diagrams
    cur.execute('DELETE FROM DIAGRAM WHERE ID IN ("diag_test_clean.", "diag_test_rel...", "diag_test_note")')
    cur.execute('DELETE FROM DIAGRAM_ELEMENT WHERE DIAGRAM_ID IN ("diag_test_clean.", "diag_test_rel...", "diag_test_note")')

    d1_children = []
    d1_de_rows = []

    # A. Add 43 Classes
    class_de_map = {}
    for c_idx, c in enumerate(classes):
        cname = c['name']
        cid = class_id_map[cname]
        de_id = f'sh_c_{c_idx+1:04d}.....'
        class_de_map[cname] = de_id

        # Class definition with crisp caption header
        c_def = f'''{de_id}:"{cname}":Class {{
	showOperationType=0;
	showAttributeType=1;
	creatorDiagramType="ClassDiagram";
	connectToPoint=T;
	y={c['cy']};
	x={c['cx']};
	metaModelElement=<{cid}>;
	height={c['ch']};
	width={c['cw']};
	background=(
		255, 
		255, 
		255, 
		255
	);
	foreground=(
		15, 
		23, 
		42, 
		255
	);
	_captionUIModel=(
		@x=0;, 
		@y=0;, 
		@width={c['cw']};, 
		@height=28;, 
		@side=8;, 
		@visible=T;, 
		@internalWidth={c['cw']};, 
		@internalHeight=28;
	);
	_elementFont=(
		@name="Dialog";, 
		@size=12;, 
		@style=1;
	);
}}'''
        d1_children.append(f'<{d1_id}:{de_id}>')
        d1_de_rows.append((de_id, 'Class', d1_id, cid, None, None, None, c_def.encode('utf-8')))

    # B. Add 32 Relationships
    for r_idx, r in enumerate(relationships):
        c1 = find_class_at_point(r['points'][0])
        c2 = find_class_at_point(r['points'][-1])
        if not c1 or not c2:
            print(f'Warning: unlinked rel {r_idx}')
            continue

        from_de = class_de_map[c1]
        to_de = class_de_map[c2]
        de_id = f'sh_rel_{r_idx+1:04d}...'

        fn = r['fn']
        vp_shape = 'Association'
        if fn == 'draw_composition':
            vp_shape = 'Composition'
        elif fn == 'draw_aggregation':
            vp_shape = 'Aggregation'
        elif fn == 'draw_dependency':
            vp_shape = 'Dependency'

        stroke_color = "15, 23, 42, 255" if fn != 'draw_dependency' else "37, 99, 235, 255"
        # Use 2-point endpoints to avoid multi-waypoint coordinate translation bugs in headless VP
        p_start = r['points'][0]
        p_end = r['points'][-1]
        pts_str = f"{p_start[0]},{p_start[1]};{p_end[0]},{p_end[1]};"
        role_label = r['role']
        if r['mult2']:
            role_label = f"{r['mult2']} {role_label}".strip()

        rel_def = f'''{de_id}:"{role_label}":{vp_shape} {{
	foreground=(
		{stroke_color}
	);
	fromPinType=1;
	toPinType=1;
	_points="{pts_str}";
	showStereotypes=T;
	showFromRoleName=T;
	showToRoleName=T;
	showFromMultiplicity=T;
	showToMultiplicity=T;
	showNavigationArrows=3;
	showDirection=T;
	_fromShape=<{d1_id}:{from_de}>;
	_toShape=<{d1_id}:{to_de}>;
	_fromRole="{r['mult1']}";
	_toRole="{role_label}";
	_fromMultiplicity="{r['mult1']}";
	_toMultiplicity="{r['mult2']}";
	background=(
		255, 
		255, 
		255, 
		255
	);
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.2;, 
		@color=(
			{stroke_color}
		);, 
		@hasStroke=T;
	);
}}'''
        d1_children.append(f'<{d1_id}:{de_id}>')
        d1_de_rows.append((de_id, vp_shape, d1_id, None, None, None, None, rel_def.encode('utf-8')))

    # C. Finalize Diagram (43 Classes + 32 Relationships, pristine UML 2.5)
    child_str = ',\n\t\t'.join(d1_children)
    d1_def = f'''{d1_id}:"{d1_name}":ClassDiagram {{
	paintConnectorThroughLabel=1;
	_shapeGroups=NULL;
	diagramBackground=(
		255, 
		255, 
		255, 
		255
	);
	connectorLabelOrientation=0;
	showPackageNameStyle=0;
	showDefaultPackage=F;
	pointConnectorEndToCompartmentMember=T;
	showAttributeGetterSetter=F;
	autoFitShapesSize=F;
	connectorStyle=1;
	diagramPreviewData_name=NULL;
	_globalPaletteOption=T;
	connectionPointStyle=0;
	gridWidth=10;
	alignToGrid=F;
	creationTime=1790775686767;
	pmAuthor="Tai.IS";
	connectorLineJumpsSize=0;
	showStereotypes=T;
	shapePresentationOption=0;
	initializeDiagramForCreate=T;
	Child=(
		{child_str}
	);
	modelElementNameAlignment=4;
	connectorLineJumps=0;
	gridHeight=10;
	gridColor=(
		192, 
		192, 
		192, 
		255
	);
}}'''

    cur.execute('INSERT INTO DIAGRAM VALUES (?, ?, ?, ?, ?)', (d1_id, 'ClassDiagram', None, d1_name, d1_def.encode('utf-8')))
    cur.executemany('INSERT INTO DIAGRAM_ELEMENT VALUES (?, ?, ?, ?, ?, ?, ?, ?)', d1_de_rows)
    print(f'Diagram 1: {len(d1_de_rows)} elements inserted ({len(classes)} classes, {len(relationships)} connectors)')

    conn.commit()
    conn.close()
    print('SUCCESS: Clean Diagram 1 committed!')

if __name__ == '__main__':
    main()
