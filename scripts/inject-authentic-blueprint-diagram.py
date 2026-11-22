#!/usr/bin/env python3
"""
inject-authentic-blueprint-diagram.py
Injects the 100% exact authentic blueprint into Visual Paradigm Nexus.vpp:
- 8 Bounded Context Packages with exact coordinates
- 43 Classes with exact coordinates, stereotypes, and 320 attributes
- 32 Relationship connectors with exact orthogonal waypoints, multiplicities & role labels
- 2 SOP Notes with links to Shipment and InvestigationCase
"""

import sqlite3
import re
import os

VPP_PATH = '/Users/Tai.IS/Documents/VPProjects/Nexus.vpp'

def main():
    conn = sqlite3.connect(VPP_PATH)
    cur = conn.cursor()

    # 1. PARSE EVERYTHING FROM generate-authentic-vp-domain-model.py
    with open('/Users/Tai.IS/my-project/logistics-management-system/scripts/generate-authentic-vp-domain-model.py') as f:
        text = f.read()

    # Extract packages
    pkg_matches = re.finditer(r'vp\.draw_package\s*\(\s*px=(\d+),\s*py=(\d+),\s*pw=(\d+),\s*ph=(\d+),\s*title=\"([^\"]+)\"', text)
    packages = []
    for m in pkg_matches:
        packages.append({
            'px': int(m.group(1)),
            'py': int(m.group(2)),
            'pw': int(m.group(3)),
            'ph': int(m.group(4)),
            'title': m.group(5)
        })

    # Extract classes
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
            if m_cx: curr['cx'] = int(m_cx.group(1))
            if m_cy: curr['cy'] = int(m_cy.group(1))
            if m_cw: curr['cw'] = int(m_cw.group(1))
            if m_name: curr['name'] = m_name.group(1)
            if m_st: curr['st'] = m_st.group(1)
            if 'attrs=[' in l:
                curr['attrs'] = []
                curr['in_attrs'] = True
            elif curr.get('in_attrs'):
                if l.strip().startswith(']'):
                    curr['in_attrs'] = False
                    curr['ch'] = 44 + len(curr['attrs']) * 18 + 14
                    classes.append(curr)
                    curr = None
                else:
                    m_a = re.search(r'\"([^\"]+)\"', l)
                    if m_a: curr['attrs'].append(m_a.group(1))

    # Extract relationships
    rel_matches = list(re.finditer(r'vp\.(draw_composition|draw_aggregation|draw_association|draw_dependency)\s*\(\s*points=\[([^\]]+)\]', text))
    relationships = []
    for m in rel_matches:
        rel_type = m.group(1)
        pts_str = m.group(2)
        pts = [(int(x), int(y)) for x, y in re.findall(r'\((\d+),\s*(\d+)\)', pts_str)]
        end_call_idx = text.find(')', m.end())
        full_call = text[m.start():end_call_idx + 1]
        m1 = re.search(r'mult1=\"([^\"]*)\"', full_call)
        m2 = re.search(r'mult2=\"([^\"]*)\"', full_call)
        role = re.search(r'role=\"([^\"]*)\"', full_call)
        lbl = re.search(r'label=\"([^\"]*)\"', full_call)
        relationships.append({
            'type': rel_type,
            'points': pts,
            'mult1': m1.group(1) if m1 else '',
            'mult2': m2.group(1) if m2 else '',
            'role': role.group(1) if role else (lbl.group(1) if lbl else '')
        })

    print(f'Extracted: {len(packages)} packages, {len(classes)} classes, {len(relationships)} relationships')

    # 2. UPDATE MODEL_ELEMENT DEFINITIONS TO INCLUDE 320 ATTRIBUTES
    class_id_map = {}
    for c in classes:
        cname = c['name']
        cur.execute('SELECT ID, DEFINITION FROM MODEL_ELEMENT WHERE NAME=? AND MODEL_TYPE="Class"', (cname,))
        row = cur.fetchone()
        if not row:
            continue
        cid, cdef_raw = row
        class_id_map[cname] = cid
        cdef = cdef_raw.decode('utf-8', errors='ignore')

        attr_defs = []
        for a_idx, a_str in enumerate(c['attrs']):
            clean_attr_name = a_str.strip('+ ').strip()
            aid = f'at_{cid[:8]}_{a_idx:03d}.'
            adef = f'''\t\t{{{aid}:"{clean_attr_name}":Attribute {{
			visibility=71;
			_modelEditable=T;
		}}}}'''
            attr_defs.append(adef)

        child_block = 'Child=(\n' + ',\n'.join(attr_defs) + '\n\t);'
        if 'Child=(' in cdef:
            cdef = re.sub(r'Child=\([^)]+\);', child_block, cdef)
        else:
            last_brace = cdef.rfind('}')
            if last_brace != -1:
                cdef = cdef[:last_brace] + '\t' + child_block + '\n' + cdef[last_brace:]

        cur.execute('UPDATE MODEL_ELEMENT SET DEFINITION=? WHERE ID=?', (cdef.encode('utf-8'), cid))

    # Helper to find class by point
    def find_class_at_point(p):
        px, py = p
        for c in classes:
            if (c['cx'] - 40 <= px <= c['cx'] + c['cw'] + 40) and (c['cy'] - 40 <= py <= c['cy'] + c['ch'] + 40):
                return c['name']
        return None

    # 3. BUILD DIAGRAM 1: DOMAIN ARCHITECTURE (MATCHING SVG 1:1)
    d1_id = 'diag_class_0001.'
    d1_name = '01. Domain Architecture - 43 Classes'

    # Clear diagram 1 elements
    cur.execute('DELETE FROM DIAGRAM WHERE ID=?', (d1_id,))
    cur.execute('DELETE FROM DIAGRAM_ELEMENT WHERE DIAGRAM_ID=?', (d1_id,))

    d1_children = []
    d1_de_rows = []
    de_counter = 0

    # A. Add 8 Package Containers
    pkg_de_map = {}
    for p in packages:
        de_counter += 1
        de_id = f'sh_pkg_{de_counter:04d}...'
        # Find model element for package
        cur.execute('SELECT ID FROM MODEL_ELEMENT WHERE MODEL_TYPE="Package" AND NAME LIKE ?', (f"%{p['title'].split('(')[0].strip()}%",))
        prow = cur.fetchone()
        pid = prow[0] if prow else None

        pkg_def = f'''{de_id}:"{p['title']}":Package {{
	foreground=(
		30, 
		58, 
		138, 
		255
	);
	background=(
		250, 
		251, 
		253, 
		255
	);
	connectToPoint=T;
	y={p['py']};
	x={p['px']};
	width={p['pw']};
	height={p['ph']};
	_elementFont=(
		@name="Dialog";, 
		@size=13;, 
		@style=1;
	);
}}'''
        d1_children.append(f'<{d1_id}:{de_id}>')
        d1_de_rows.append((de_id, 'Package', d1_id, pid, None, None, None, pkg_def.encode('utf-8')))
        pkg_de_map[p['title']] = de_id

    # B. Add 43 Classes with exact coordinates
    class_de_map = {}
    for c in classes:
        cname = c['name']
        cid = class_id_map.get(cname)
        if not cid:
            continue

        de_counter += 1
        de_id = f'sh_c_{de_counter:04d}.....'

        class_def = f'''{de_id}:"{cname}":Class {{
	showOperationType=1;
	foreground=(
		15, 
		23, 
		42, 
		255
	);
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
	_elementFont=(
		@name="Dialog";, 
		@size=11;, 
		@style=0;
	);
}}'''
        d1_children.append(f'<{d1_id}:{de_id}>')
        d1_de_rows.append((de_id, 'Class', d1_id, cid, None, None, None, class_def.encode('utf-8')))
        class_de_map[cname] = de_id

    # C. Add 32 Relationships with exact polyline points & multiplicities
    rel_counter = 0
    for r in relationships:
        c1_name = find_class_at_point(r['points'][0])
        c2_name = find_class_at_point(r['points'][-1])
        if not c1_name or not c2_name or c1_name not in class_de_map or c2_name not in class_de_map:
            continue

        from_de = class_de_map[c1_name]
        to_de = class_de_map[c2_name]

        rel_counter += 1
        de_id = f'sh_rel_{rel_counter:04d}...'

        pts_str = ';'.join([f"{pt[0]},{pt[1]}" for pt in r['points']]) + ';'

        # Distinguish Composition / Aggregation / Association / Dependency
        vp_shape_type = "Association"
        stroke_color = "0, 0, 0, 255" if r['type'] != 'draw_dependency' else "37, 99, 235, 255"
        role_label = r['role']
        if r['mult2']:
            role_label = f"{r['mult2']} {role_label}".strip()

        rel_def = f'''{de_id}:"{role_label}":{vp_shape_type} {{
	foreground=(
		{stroke_color}
	);
	fromPinType=1;
	_points="{pts_str}";
	showStereotypes=T;
	toPinType=1;
	showToRoleName=T;
	showFromRoleName=T;
	useToShapeCenter=T;
	_fromShape=<{d1_id}:{from_de}>;
	useFromShapeCenter=T;
	_toShape=<{d1_id}:{to_de}>;
	_fromRole="{r['mult1']}";
	_toRole="{role_label}";
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
        d1_de_rows.append((de_id, vp_shape_type, d1_id, None, None, None, None, rel_def.encode('utf-8')))

    # D. Add Notes
    note1_id = f'sh_note_0001...'
    note1_def = f'''{note1_id}:"SOP BƯU CHÍNH & VẬN HÀNH (CARRIER DOMAIN)":Note {{
	foreground=(
		180, 
		83, 
		9, 
		255
	);
	background=(
		255, 
		242, 
		204, 
		255
	);
	connectToPoint=T;
	y=2000;
	x=1260;
	width=420;
	height=380;
	documentation="1. 5 Nhóm mặt hàng chuẩn Carrier: GENERAL, FRAGILE (bọc bubble wrap >= 3 lớp), HIGH_VALUE/ELECTRONICS (bắt buộc khai giá, seal bảo an), BULKY/HEAVY (đo 3 chiều, tính thể tích IATA), DOCUMENT (khóa đồng kiểm).\\n2. 3 Tầng trần vật lý: Tầng 1 (<=20kg, cạnh <=60cm) shipper xe máy; Tầng 2 (21-70kg, cạnh <=150cm) điều phối xe tải; Tầng 3 (>70kg, cạnh >150cm) chặn tạo đơn!";
}}'''
    d1_children.append(f'<{d1_id}:{note1_id}>')
    d1_de_rows.append((note1_id, 'Note', d1_id, None, None, None, None, note1_def.encode('utf-8')))

    note2_id = f'sh_note_0002...'
    note2_def = f'''{note2_id}:"QUY CHUẨN GIÁM ĐỊNH ĐƠN LẠC & CỨU ĐƠN":Note {{
	foreground=(
		180, 
		83, 
		9, 
		255
	);
	background=(
		255, 
		242, 
		204, 
		255
	);
	connectToPoint=T;
	y=2000;
	x=1910;
	width=420;
	height=380;
	documentation="Quy trình 4 giai đoạn khép kín:\\n1. Break Point Detection (phát hiện điểm đứt gãy vết quét)\\n2. 24h Dispute Hearing Window (cửa sổ giải trình, nộp CCTV lên MinIO)\\n3. Warehouse Search & Salvage (cứu đơn tìm thấy chuyển RESOLVED_FOUND)\\n4. Adjudication & Auto-Claim (phán quyết chế tài, tự động chuyển hồ sơ bồi thường Claims)";
}}'''
    d1_children.append(f'<{d1_id}:{note2_id}>')
    d1_de_rows.append((note2_id, 'Note', d1_id, None, None, None, None, note2_def.encode('utf-8')))

    # Finalize Diagram 1
    child_str_1 = ',\n\t\t'.join(d1_children)
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
	showDefaultPackage=T;
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
		{child_str_1}
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
    print(f'Diagram 1 populated: {len(d1_de_rows)} elements (8 packages, 43 classes, {rel_counter} connectors, 2 notes)')

    conn.commit()
    conn.close()
    print('SUCCESS: AUTHENTIC BLUEPRINT INJECTED!')

if __name__ == '__main__':
    main()
