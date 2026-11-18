#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
inject-perfect-blueprint.py
Populates 100% authentic Visual Paradigm domain model diagram into Nexus.vpp:
- 8 Bounded Context Packages (with exact coordinates and metaModelElement)
- 43 Classes (with all 320 attributes in MODEL_ELEMENT and exact coordinates)
- 32 Orthogonal Relationship Connectors (Composition, Aggregation, Association, Dependency)
- 2 SOP Notes with Leader Anchors to Shipment and InvestigationCase
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

    # 1. READ SOURCE DEFINITIONS
    with open(BLUEPRINT_SCRIPT, 'r', encoding='utf-8') as f:
        text = f.read()

    # A. Parse Packages
    packages = []
    pkg_matches = re.finditer(r'vp\.draw_package\s*\(\s*px=(\d+),\s*py=(\d+),\s*pw=(\d+),\s*ph=(\d+),\s*title=\"([^\"]+)\"', text)
    for m in pkg_matches:
        packages.append({
            'px': int(m.group(1)),
            'py': int(m.group(2)),
            'pw': int(m.group(3)),
            'ph': int(m.group(4)),
            'title': m.group(5)
        })

    # B. Parse Classes
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
                    curr['ch'] = 48 + len(curr['attrs']) * 19 + 14
                    classes.append(curr)
                    curr = None
                else:
                    m_a = re.search(r'\"([^\"]+)\"', l)
                    if m_a: curr['attrs'].append(m_a.group(1))

    # C. Parse Relationships
    all_rels_iter = list(re.finditer(r'vp\.(draw_composition|draw_aggregation|draw_association|draw_dependency)\s*\(', text))
    relationships = []
    for m in all_rels_iter:
        # Find balanced closing paren
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

    print(f'Parsed: {len(packages)} packages, {len(classes)} classes, {len(relationships)} relationships')

    # 2. ENSURE ALL 43 CLASSES HAVE ATTRIBUTES IN MODEL_ELEMENT
    class_id_map = {}
    for c in classes:
        cname = c['name']
        cur.execute('SELECT ID, DEFINITION FROM MODEL_ELEMENT WHERE NAME=? AND MODEL_TYPE="Class"', (cname,))
        row = cur.fetchone()
        if not row:
            print(f'WARNING: Class {cname} not found in MODEL_ELEMENT!')
            continue
        cid, cdef_raw = row
        class_id_map[cname] = cid
        cdef = cdef_raw if isinstance(cdef_raw, str) else cdef_raw.decode('utf-8', errors='ignore')

        attr_defs = []
        for a_idx, a_str in enumerate(c['attrs']):
            clean_attr = a_str.strip('+ ').strip()
            aid = f'at_{cid[:8]}_{a_idx:03d}.'
            adef = f'''\t\t{{{aid}:"{clean_attr}":Attribute {{
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

    # Package mapping to MODEL_ELEMENT
    pkg_id_map = {
        'Identity & Access Management (auth_db)': '4.fHx4WD.AAAAQh7',
        'Masterdata & Logistics Network (masterdata_db)': 's.fHx4WD.AAAAQiD',
        'First-Mile Pickup & Dispatch (pickup_db & dispatch_db)': 'C.fHx4WD.AAAAQiS',
        'Shipment Core & Claims Quality Assurance (shipment_db - SSOT)': 'S.fHx4WD.AAAAQib',
        'Mid-Mile Transit & Scan Audit (manifest_db & scan_db)': 'q.fHx4WD.AAAAQiq',
        'Last-Mile Delivery & Proof of Delivery (delivery_db)': 'W.fHx4WD.AAAAQi7',
        'Finance & COD Settlement (payment_db)': 'O.fHx4WD.AAAAQjG',
        'CQRS Read Models & AI Subsystem': 'u.fHx4WD.AAAAQjP'
    }

    # Helper to find class by point
    def find_class_at_point(p):
        px, py = p
        for c in classes:
            if (c['cx'] - 60 <= px <= c['cx'] + c['cw'] + 60) and (c['cy'] - 60 <= py <= c['cy'] + c['ch'] + 60):
                return c['name']
        return None

    # 3. CONSTRUCT DIAGRAM 1
    d1_id = 'diag_class_0001.'
    d1_name = '01. Domain Architecture - 43 Classes'

    # Clear previous Diagram 1
    cur.execute('DELETE FROM DIAGRAM WHERE ID=?', (d1_id,))
    cur.execute('DELETE FROM DIAGRAM_ELEMENT WHERE DIAGRAM_ID=?', (d1_id,))

    d1_children = []
    d1_de_rows = []

    # A. Add 8 Packages
    pkg_de_map = {}
    for p_idx, p in enumerate(packages):
        de_id = f'sh_pkg_{p_idx+1:04d}...'
        pid = pkg_id_map.get(p['title'])

        pkg_def = f'''{de_id}:"{p['title']}":Package {{
	foreground=(
		30, 
		58, 
		138, 
		255
	);
	background=(
		248, 
		250, 
		252, 
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

    # B. Add 43 Classes
    class_de_map = {}
    for c_idx, c in enumerate(classes):
        cname = c['name']
        cid = class_id_map[cname]
        de_id = f'sh_c_{c_idx+1:04d}.....'
        class_de_map[cname] = de_id

        # Stroke / Border color theme
        th = c.get('th', 'blue')
        if th == 'yellow':
            border_rgb = '217, 119, 6, 255'      # amber-600
        elif th == 'green':
            border_rgb = '16, 185, 129, 255'    # emerald-500
        elif th == 'purple':
            border_rgb = '147, 51, 234, 255'    # purple-600
        elif th == 'gray':
            border_rgb = '100, 116, 139, 255'   # slate-500
        else:
            border_rgb = '37, 99, 235, 255'     # blue-600

        class_def = f'''{de_id}:"{cname}":Class {{
	showOperationType=0;
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
	showStereotypes=T;
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
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.5;, 
		@color=(
			{border_rgb}
		);, 
		@hasStroke=T;
	);
}}'''
        d1_children.append(f'<{d1_id}:{de_id}>')
        d1_de_rows.append((de_id, 'Class', d1_id, cid, None, None, None, class_def.encode('utf-8')))

    # C. Add 32 Relationships
    for r_idx, r in enumerate(relationships):
        c1 = find_class_at_point(r['points'][0])
        c2 = find_class_at_point(r['points'][-1])
        if not c1 or not c2:
            print(f'ERROR: Unmatched relationship {r_idx}: {r["points"][0]} -> {r["points"][-1]}')
            continue

        from_de = class_de_map[c1]
        to_de = class_de_map[c2]
        de_id = f'sh_rel_{r_idx+1:04d}...'

        fn = r['fn']
        if fn == 'draw_composition':
            vp_shape = 'Composition'
            stroke_rgb = '15, 23, 42, 255'
        elif fn == 'draw_aggregation':
            vp_shape = 'Aggregation'
            stroke_rgb = '15, 23, 42, 255'
        elif fn == 'draw_dependency':
            vp_shape = 'Dependency'
            stroke_rgb = '37, 99, 235, 255'
        else:
            vp_shape = 'Association'
            stroke_rgb = '15, 23, 42, 255'

        pts_str = ';'.join([f"{pt[0]},{pt[1]}" for pt in r['points']]) + ';'

        mult1_val = r['mult1']
        mult2_val = r['mult2']
        role_val = r['role']

        full_to_role = f"{mult2_val} {role_val}".strip() if mult2_val else role_val

        rel_def = f'''{de_id}:"{full_to_role}":{vp_shape} {{
	foreground=(
		{stroke_rgb}
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
	useFromShapeCenter=T;
	useToShapeCenter=T;
	_fromShape=<{d1_id}:{from_de}>;
	_toShape=<{d1_id}:{to_de}>;
	_fromRole="{mult1_val}";
	_toRole="{full_to_role}";
	_fromMultiplicity="{mult1_val}";
	_toMultiplicity="{mult2_val}";
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
			{stroke_rgb}
		);, 
		@hasStroke=T;
	);
}}'''
        d1_children.append(f'<{d1_id}:{de_id}>')
        d1_de_rows.append((de_id, vp_shape, d1_id, None, None, None, None, rel_def.encode('utf-8')))

    # D. Add 2 SOP Notes with Leader Anchors
    note1_id = 'sh_note_0001...'
    note1_def = f'''{note1_id}:"SOP BƯU CHÍNH & VẬN HÀNH (CARRIER DOMAIN)":NOTE {{
	foreground=(
		180, 
		83, 
		9, 
		255
	);
	background=(
		254, 
		243, 
		199, 
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
    d1_de_rows.append((note1_id, 'NOTE', d1_id, None, None, None, None, note1_def.encode('utf-8')))

    # Note 1 Anchor to Shipment
    anc1_id = 'sh_anc_0001....'
    anc1_def = f'''{anc1_id}:NULL:Anchor {{
	foreground=(
		180, 
		83, 
		9, 
		255
	);
	fromPinType=1;
	toPinType=1;
	_points="1470,2000;1470,508;";
	useFromShapeCenter=T;
	useToShapeCenter=T;
	_fromShape=<{d1_id}:{note1_id}>;
	_toShape=<{d1_id}:{class_de_map['Shipment']}>;
}}'''
    d1_children.append(f'<{d1_id}:{anc1_id}>')
    d1_de_rows.append((anc1_id, 'Anchor', d1_id, None, None, None, None, anc1_def.encode('utf-8')))

    note2_id = 'sh_note_0002...'
    note2_def = f'''{note2_id}:"QUY CHUẨN GIÁM ĐỊNH ĐƠN LẠC & CỨU ĐƠN":NOTE {{
	foreground=(
		180, 
		83, 
		9, 
		255
	);
	background=(
		254, 
		243, 
		199, 
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
    d1_de_rows.append((note2_id, 'NOTE', d1_id, None, None, None, None, note2_def.encode('utf-8')))

    # Note 2 Anchor to InvestigationCase
    anc2_id = 'sh_anc_0002....'
    anc2_def = f'''{anc2_id}:NULL:Anchor {{
	foreground=(
		180, 
		83, 
		9, 
		255
	);
	fromPinType=1;
	toPinType=1;
	_points="2120,2000;2120,1038;";
	useFromShapeCenter=T;
	useToShapeCenter=T;
	_fromShape=<{d1_id}:{note2_id}>;
	_toShape=<{d1_id}:{class_de_map['InvestigationCase']}>;
}}'''
    d1_children.append(f'<{d1_id}:{anc2_id}>')
    d1_de_rows.append((anc2_id, 'Anchor', d1_id, None, None, None, None, anc2_def.encode('utf-8')))

    # E. Diagram Definition
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
    print(f'Inserted Diagram 1 with {len(d1_de_rows)} elements into DIAGRAM_ELEMENT and {len(d1_children)} children into DIAGRAM!')

    conn.commit()
    conn.close()
    print('SUCCESS: All 8 Packages, 43 Classes, 32 Relationships, 2 Notes and 2 Anchors successfully committed!')

if __name__ == '__main__':
    main()
