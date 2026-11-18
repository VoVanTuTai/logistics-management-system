#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
INJECT FULL SPIDERWEB USE CASE DIAGRAM INTO VISUAL PARADIGM (Nexus.vpp)
======================================================================
Khớp 100% với cấu trúc hình học chuẩn trong scripts/generate-thesis-usecase-diagram.py:
- 1 System Boundary lớn (310, 120, 2380, 2470)
- 7 Subsystem Packages (Phân Hệ 1..6 + Central Auth Gateway)
- 6 Actors (4 cánh trái, 2 cánh phải)
- 79 Use Cases được định vị chính xác tọa độ
- 49 Dependencies («include» / «extend») liên kết nghiệp vụ như mạng nhện
- 7 Generalizations (6 internal UC + 1 Actor Customer -> Guest)
- 43 Actor Associations
"""

import sqlite3
import re
import os

VPP_PATH = '/Users/Tai.IS/Documents/VPProjects/Nexus.vpp'
EXPORT_DIR = '/Users/Tai.IS/Documents/VPProjects/exported_diagrams_v2'
os.makedirs(EXPORT_DIR, exist_ok=True)

def escape_str(s):
    if not s: return ""
    return s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '')

def main():
    conn = sqlite3.connect(VPP_PATH)
    cur = conn.cursor()

    # Read the geometry source
    with open('/Users/Tai.IS/my-project/logistics-management-system/scripts/generate-thesis-usecase-diagram.py', 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Parse UCs: uc(cx, cy, rx, ry, ucid, title, uctype)
    uc_pattern = re.compile(r'uc\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*\"([^\"]+)\",\s*\"([^\"]+)\"(?:,\s*\"([^\"]+)\")?\)')
    raw_ucs = uc_pattern.findall(code)
    print(f"Parsed {len(raw_ucs)} Use Cases from geometry source.")

    # 2. Parse internal deps: direct_dep_arrow(cx1, cy1, rx1, ry1, cx2, cy2, rx2, ry2, label, offset)
    dep_pattern = re.compile(r'direct_dep_arrow\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*\"([^\"]+)\"')
    raw_deps = dep_pattern.findall(code)
    print(f"Parsed {len(raw_deps)} Dependencies from geometry source.")

    # 3. Parse gens: direct_gen_arrow(cx1, cy1, rx1, ry1, cx2, cy2, rx2, ry2)
    gen_pattern = re.compile(r'direct_gen_arrow\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)')
    raw_gens = gen_pattern.findall(code)
    print(f"Parsed {len(raw_gens)} Generalizations from geometry source.")

    # Coordinate mapping: (cx, cy) -> UC info
    coord_to_uc = {}
    ucid_to_info = {}
    for cx, cy, rx, ry, ucid, title, uctype in raw_ucs:
        pt = (int(cx), int(cy))
        info = {
            'ucid': ucid,
            'title': title,
            'rx': int(rx),
            'ry': int(ry),
            'uctype': uctype or 'uc',
            'cx': int(cx),
            'cy': int(cy)
        }
        coord_to_uc[pt] = info
        ucid_to_info[ucid] = info

    # Ensure MODEL_ELEMENTs exist for all 79 UCs
    cur.execute("SELECT ID, NAME FROM MODEL_ELEMENT WHERE MODEL_TYPE='UseCase'")
    db_ucs = dict(cur.fetchall())
    
    ucid_to_mid = {}
    for ucid, info in ucid_to_info.items():
        title = info['title']
        found_mid = None
        for mid, mname in db_ucs.items():
            if ucid in mname or title.lower() in mname.lower():
                found_mid = mid
                break
        if found_mid:
            ucid_to_mid[ucid] = found_mid
            # normalize name
            cur.execute("UPDATE MODEL_ELEMENT SET NAME=? WHERE ID=?", (f"{ucid}: {title}", found_mid))
        else:
            new_mid = f"mid_uc_{ucid.replace('-', '_').lower()[:10]}."[:16]
            m_def = f'''{new_mid}:"{escape_str(f"{ucid}: {title}")}":UseCase {{\n\tpmAuthor="Tai.IS";\n}}\n'''.encode('utf-8')
            cur.execute("INSERT INTO MODEL_ELEMENT (ID, MODEL_TYPE, NAME, DEFINITION) VALUES (?, 'UseCase', ?, ?)",
                        (new_mid, f"{ucid}: {title}", m_def))
            ucid_to_mid[ucid] = new_mid
            print(f"Created new MODEL_ELEMENT for {ucid}: {title} -> {new_mid}")

    # Actor MODEL_ELEMENT mapping
    actor_mids = {
        'Merchant': '4osxTwWD.AAAAQuK',
        'Guest': 'YosxTwWD.AAAAQuH',
        'Customer': 'YosxTwWD.AAAAQuI',
        'Admin': 'EosxTwWD.AAAAQuO',
        'Ops': 'EosxTwWD.AAAAQuL',
        'Courier': 'EosxTwWD.AAAAQuN'
    }

    # Package MODEL_ELEMENT mapping
    pkg_mids = {
        'Boundary': 'pkg_sys_bnd_01..',
        'Pkg1': 'UosxTwWD.AAAAQuW',
        'Pkg2': 'sosxTwWD.AAAAQup',
        'Pkg3': 'iosxTwWD.AAAAQvA',
        'Pkg4': 'KosxTwWD.AAAAQvR',
        'Pkg5': 'aosxTwWD.AAAAQvd',
        'Pkg6': 'WosxTwWD.AAAAQv7',
        'Auth': 'kosxTwWD.AAAAQuQ'
    }

    # Ensure system boundary package model exists
    cur.execute("SELECT ID FROM MODEL_ELEMENT WHERE ID=?", (pkg_mids['Boundary'],))
    if not cur.fetchone():
        bnd_name = "NEXUS LOGISTICS PLATFORM (CORE SERVICES)"
        bnd_def = f'''{pkg_mids['Boundary']}:"{escape_str(bnd_name)}":Package {{\n\tpmAuthor="Tai.IS";\n}}\n'''.encode('utf-8')
        cur.execute("INSERT INTO MODEL_ELEMENT (ID, MODEL_TYPE, NAME, DEFINITION) VALUES (?, 'Package', ?, ?)",
                    (pkg_mids['Boundary'], bnd_name, bnd_def))

    diag_id = 'diag_uc_master.'
    diag_name = '02. Master System Use Cases - Overview'

    # Clear existing diagram elements
    cur.execute("DELETE FROM DIAGRAM_ELEMENT WHERE DIAGRAM_ID=?", (diag_id,))
    cur.execute("DELETE FROM DIAGRAM WHERE ID=?", (diag_id,))

    child_shapes = []
    de_rows = []
    shape_counter = 0

    def make_id(prefix):
        nonlocal shape_counter
        shape_counter += 1
        return f"{prefix[:4]}_{diag_id[-4:]}_{shape_counter:04d}."[:16]

    # 1. System Boundary Package
    sb_id = make_id('sh_sys')
    sb_x, sb_y, sb_w, sb_h = 310, 120, 2380, 2470
    sb_def = f'''{sb_id}:"«system» RANH GIỚI HỆ THỐNG: NEXUS LOGISTICS PLATFORM (CORE SERVICES)":Package {{
	parentConnectorHeaderLength=40;
	background=(255, 255, 255, 255);
	foreground=(30, 41, 59, 255);
	width={sb_w};
	height={sb_h};
	x={sb_x};
	y={sb_y};
	metaModelElement=<{pkg_mids['Boundary']}>;
	_elementFont=(
		@name="Dialog";, 
		@color=(15, 23, 42, 255);, 
		@size=14;, 
		@style=1;
	);
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=2.0;, 
		@color=(30, 41, 59, 255);, 
		@hasStroke=T;
	);
}}'''
    child_shapes.append(f'<{diag_id}:{sb_id}>')
    de_rows.append((sb_id, 'Package', diag_id, pkg_mids['Boundary'], None, None, None, sb_def.encode('utf-8')))

    # 2. Subsystem Packages
    subsystems = [
        ('Pkg1', 'Phân Hệ 1: Tiếp Nhận & Quản Lý Đơn Hàng (shipment • pickup)', 340, 170, 1090, 690, (254, 243, 199), (146, 64, 14)),
        ('Pkg2', 'Phân Hệ 2: Bưu Cục, Điều Phối & Trung Chuyển (scan • manifest • dispatch)', 1530, 170, 1130, 690, (236, 253, 245), (6, 95, 70)),
        ('Pkg5', 'Phân Hệ 5: Trợ Lý AI Logistics RAG & Tra Cứu (ai • tracking • pricing)', 340, 940, 710, 810, (245, 243, 255), (107, 33, 168)),
        ('Auth', 'Cổng Xác Thực & Bảo Mật Hệ Thống (Central Identity Provider IdP)', 1110, 940, 780, 810, (238, 242, 255), (67, 56, 202)),
        ('Pkg3', 'Phân Hệ 3: Giao Hàng Chặng Cuối & Xử Lý Sự Cố (delivery • ndr • return)', 1950, 940, 710, 810, (240, 249, 255), (3, 105, 161)),
        ('Pkg6', 'Phân Hệ 6: Quản Trị Hệ Thống, RBAC & Cấu Hình (masterdata • admin • rbac)', 340, 1830, 1090, 700, (241, 245, 249), (51, 65, 85)),
        ('Pkg4', 'Phân Hệ 4: Tài Chính, Thu Hộ COD & Đối Soát (finance • payment • cod)', 1530, 1830, 1130, 700, (255, 241, 242), (159, 18, 57))
    ]

    for pkey, pname, px, py, pw, ph, bg_c, fg_c in subsystems:
        p_de = make_id(f'sh_{pkey.lower()}')
        pmid = pkg_mids[pkey]
        pdef = f'''{p_de}:"{escape_str(pname)}":Package {{
	parentConnectorHeaderLength=40;
	background=({bg_c[0]}, {bg_c[1]}, {bg_c[2]}, 255);
	foreground=({fg_c[0]}, {fg_c[1]}, {fg_c[2]}, 255);
	width={pw};
	height={ph};
	x={px};
	y={py};
	metaModelElement=<{pmid}>;
	_elementFont=(
		@name="Dialog";, 
		@color=({fg_c[0]}, {fg_c[1]}, {fg_c[2]}, 255);, 
		@size=12;, 
		@style=1;
	);
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.5;, 
		@color=({fg_c[0]}, {fg_c[1]}, {fg_c[2]}, 255);, 
		@hasStroke=T;
	);
}}'''
        child_shapes.append(f'<{diag_id}:{p_de}>')
        de_rows.append((p_de, 'Package', diag_id, pmid, None, None, None, pdef.encode('utf-8')))

    # 3. Actors (Left: Merchant, Guest, Customer, Admin; Right: Ops, Courier)
    actors = [
        ('Merchant', 'Người Gửi Hàng\n(Merchant)', 110, 380, 70, 95),
        ('Guest', 'Khách Vãng Lai\n(Guest)', 110, 990, 70, 95),
        ('Customer', 'Khách Hàng Cá Nhân\n(Customer)', 110, 1370, 70, 95),
        ('Admin', 'Quản Trị Viên\n(System Admin)', 110, 2100, 70, 95),
        ('Ops', 'Nhân Viên Vận Hành\n(Ops Staff)', 2820, 380, 70, 95),
        ('Courier', 'Nhân Viên Giao Hàng\n(Courier)', 2820, 1300, 70, 95),
    ]

    actor_shapes = {} # akey -> (de_id, x, y, w, h, cx, cy)
    for akey, aname, ax, ay, aw, ah in actors:
        a_de = make_id(f'sh_{akey.lower()[:3]}')
        amid = actor_mids[akey]
        adef = f'''{a_de}:"{escape_str(aname)}":Actor {{
	parentConnectorHeaderLength=40;
	background=(224, 242, 254, 255);
	foreground=(30, 58, 138, 255);
	width={aw};
	height={ah};
	connectToPoint=T;
	x={ax};
	y={ay};
	metaModelElement=<{amid}>;
	_elementFont=(
		@name="Dialog";, 
		@color=(30, 58, 138, 255);, 
		@size=11;, 
		@style=1;
	);
}}'''
        child_shapes.append(f'<{diag_id}:{a_de}>')
        de_rows.append((a_de, 'Actor', diag_id, amid, None, None, None, adef.encode('utf-8')))
        actor_shapes[akey] = (a_de, ax, ay, aw, ah, ax + aw//2, ay + ah//2)

    # 4. 79 Use Cases
    uc_shapes = {} # ucid -> (de_id, x, y, w, h, cx, cy)
    for pt, info in coord_to_uc.items():
        ucid = info['ucid']
        title = info['title']
        rx = info['rx']
        ry = info['ry']
        cx = info['cx']
        cy = info['cy']
        uctype = info['uctype']
        mid = ucid_to_mid[ucid]

        uw = max(240, rx * 2)
        uh = max(55, ry * 2 + 15)
        ux = cx - uw // 2
        uy = cy - uh // 2

        uc_de = make_id('sh_uc')
        
        stroke_color = "0, 0, 0, 255"
        bg_color = "255, 255, 255, 255"
        if uctype == "uc-core":
            bg_color = "240, 249, 255, 255"
            stroke_color = "30, 58, 138, 255"
        elif uctype == "uc-abstract":
            bg_color = "248, 250, 252, 255"
            stroke_color = "71, 85, 105, 255"

        full_label = f"{ucid}\\n{title}"
        uc_def = f'''{uc_de}:"{escape_str(full_label)}":UseCase {{
	parentConnectorHeaderLength=40;
	background=({bg_color});
	foreground=(15, 23, 42, 255);
	width={uw};
	height={uh};
	connectToPoint=T;
	x={ux};
	y={uy};
	metaModelElement=<{mid}>;
	_elementFont=(
		@name="Dialog";, 
		@color=(15, 23, 42, 255);, 
		@size=10;, 
		@style=1;
	);
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.2;, 
		@color=({stroke_color});, 
		@hasStroke=T;
	);
}}'''
        child_shapes.append(f'<{diag_id}:{uc_de}>')
        de_rows.append((uc_de, 'UseCase', diag_id, mid, None, None, None, uc_def.encode('utf-8')))
        uc_shapes[ucid] = (uc_de, ux, uy, uw, uh, cx, cy)

    # 5. Dependencies (49 total: 43 internal + 6 to Central Auth)
    for cx1, cy1, rx1, ry1, cx2, cy2, rx2, ry2, lbl in raw_deps:
        pt1 = (int(cx1), int(cy1))
        pt2 = (int(cx2), int(cy2))
        u1 = coord_to_uc.get(pt1)
        u2 = coord_to_uc.get(pt2)
        if not u1 or not u2:
            continue
        
        uc1_id = u1['ucid']
        uc2_id = u2['ucid']
        s1 = uc_shapes[uc1_id]
        s2 = uc_shapes[uc2_id]

        dep_de = make_id('sh_dep')
        clean_lbl = lbl.replace('<<', '«').replace('>>', '»')
        dep_def = f'''{dep_de}:"{clean_lbl}":Dependency {{
	foreground=(79, 70, 229, 255);
	fromPinType=1;
	toPinType=1;
	useFromShapeCenter=T;
	useToShapeCenter=T;
	_points="{s1[5]},{s1[6]};{s2[5]},{s2[6]};";
	_fromShape=<{diag_id}:{s1[0]}>;
	_toShape=<{diag_id}:{s2[0]}>;
	_elementFont=(
		@name="Dialog";, 
		@color=(79, 70, 229, 255);, 
		@size=10;, 
		@style=2;
	);
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.2;, 
		@color=(99, 102, 241, 255);, 
		@hasStroke=T;
	);
}}'''
        de_rows.append((dep_de, 'Dependency', diag_id, None, None, None, None, dep_def.encode('utf-8')))

    # 6. Central Auth 6 Symmetrical Includes
    auth_includes = [
        ('UC-ORD-03', 'UC-AUTH-01'), # Pkg 1
        ('UC-TRK-02', 'UC-AUTH-01'), # Pkg 5
        ('UC-ADM-01', 'UC-AUTH-01'), # Pkg 6
        ('UC-HUB-12', 'UC-AUTH-01'), # Pkg 2
        ('UC-DEL-05', 'UC-AUTH-01'), # Pkg 3
        ('UC-FIN-09', 'UC-AUTH-01')  # Pkg 4
    ]

    for from_uc, to_uc in auth_includes:
        if from_uc in uc_shapes and to_uc in uc_shapes:
            s1 = uc_shapes[from_uc]
            s2 = uc_shapes[to_uc]
            dep_de = make_id('sh_auth_dep')
            dep_def = f'''{dep_de}:"«include»":Dependency {{
	foreground=(79, 70, 229, 255);
	fromPinType=1;
	toPinType=1;
	useFromShapeCenter=T;
	useToShapeCenter=T;
	_points="{s1[5]},{s1[6]};{s2[5]},{s2[6]};";
	_fromShape=<{diag_id}:{s1[0]}>;
	_toShape=<{diag_id}:{s2[0]}>;
	_elementFont=(
		@name="Dialog";, 
		@color=(79, 70, 229, 255);, 
		@size=10;, 
		@style=2;
	);
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.2;, 
		@color=(99, 102, 241, 255);, 
		@hasStroke=T;
	);
}}'''
            de_rows.append((dep_de, 'Dependency', diag_id, None, None, None, None, dep_def.encode('utf-8')))

    # 7. Generalizations (6 internal + 1 actor)
    for cx1, cy1, rx1, ry1, cx2, cy2, rx2, ry2 in raw_gens:
        pt1 = (int(cx1), int(cy1))
        pt2 = (int(cx2), int(cy2))
        u1 = coord_to_uc.get(pt1)
        u2 = coord_to_uc.get(pt2)
        if not u1 or not u2:
            continue
        s1 = uc_shapes[u1['ucid']]
        s2 = uc_shapes[u2['ucid']]

        gen_de = make_id('sh_gen')
        gen_def = f'''{gen_de}:NULL:Generalization {{
	foreground=(15, 23, 42, 255);
	fromPinType=1;
	toPinType=1;
	useFromShapeCenter=T;
	useToShapeCenter=T;
	_points="{s1[5]},{s1[6]};{s2[5]},{s2[6]};";
	_fromShape=<{diag_id}:{s1[0]}>;
	_toShape=<{diag_id}:{s2[0]}>;
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.5;, 
		@color=(30, 41, 59, 255);, 
		@hasStroke=T;
	);
}}'''
        de_rows.append((gen_de, 'Generalization', diag_id, None, None, None, None, gen_def.encode('utf-8')))

    # Actor Generalization: Customer -> Guest
    c_act = actor_shapes['Customer']
    g_act = actor_shapes['Guest']
    gen_act_de = make_id('sh_gen_act')
    gen_act_def = f'''{gen_act_de}:NULL:Generalization {{
	foreground=(30, 58, 138, 255);
	fromPinType=1;
	toPinType=1;
	useFromShapeCenter=T;
	useToShapeCenter=T;
	_points="{c_act[5]},{c_act[6]};{g_act[5]},{g_act[6]};";
	_fromShape=<{diag_id}:{c_act[0]}>;
	_toShape=<{diag_id}:{g_act[0]}>;
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.8;, 
		@color=(30, 58, 138, 255);, 
		@hasStroke=T;
	);
}}'''
    de_rows.append((gen_act_de, 'Generalization', diag_id, None, None, None, None, gen_act_def.encode('utf-8')))

    # 8. Actor Associations (43 total)
    actor_assocs = [
        # Merchant (5)
        ('Merchant', ['UC-ORD-01', 'UC-ORD-03', 'UC-ORD-04', 'UC-TRK-03', 'UC-FIN-01']),
        # Guest (5)
        ('Guest', ['UC-TRK-01', 'UC-TRK-04', 'UC-TRK-05', 'UC-TRK-06', 'UC-TRK-07']),
        # Customer (7)
        ('Customer', ['UC-ORD-02', 'UC-ORD-05', 'UC-TRK-02', 'UC-TRK-08', 'UC-AUTH-05', 'UC-AUTH-03', 'UC-FIN-02']),
        # Admin (7)
        ('Admin', ['UC-ADM-01', 'UC-ADM-02', 'UC-ADM-03', 'UC-ADM-04', 'UC-ADM-05', 'UC-ADM-06', 'UC-ADM-08']),
        # Ops Staff (12)
        ('Ops', ['UC-HUB-12', 'UC-HUB-13', 'UC-HUB-09', 'UC-HUB-10', 'UC-HUB-07', 'UC-HUB-08',
                 'UC-HUB-01', 'UC-HUB-02', 'UC-HUB-03', 'UC-HUB-04', 'UC-HUB-05', 'UC-FIN-09']),
        # Courier (7)
        ('Courier', ['UC-DEL-05', 'UC-DEL-06', 'UC-DEL-08', 'UC-DEL-09', 'UC-FIN-05', 'UC-FIN-06', 'UC-FIN-07'])
    ]

    for akey, target_uids in actor_assocs:
        act = actor_shapes[akey]
        for tuid in target_uids:
            if tuid not in uc_shapes:
                print(f"Warning: {tuid} not found for actor {akey}")
                continue
            ucs = uc_shapes[tuid]
            asc_de = make_id('sh_asc')
            asc_def = f'''{asc_de}:NULL:Association {{
	foreground=(71, 85, 105, 255);
	fromPinType=1;
	toPinType=1;
	useFromShapeCenter=T;
	useToShapeCenter=T;
	_points="{act[5]},{act[6]};{ucs[5]},{ucs[6]};";
	_fromShape=<{diag_id}:{act[0]}>;
	_toShape=<{diag_id}:{ucs[0]}>;
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.2;, 
		@color=(71, 85, 105, 255);, 
		@hasStroke=T;
	);
}}'''
            de_rows.append((asc_de, 'Association', diag_id, None, None, None, None, asc_def.encode('utf-8')))

    # Diagram Definition
    children_str = ', \n\t\t'.join(child_shapes)
    diag_def = f'''{diag_id}:"{diag_name}":UseCaseDiagram {{
	paintConnectorThroughLabel=1;
	_shapeGroups=NULL;
	diagramBackground=(255, 255, 255, 255);
	connectorLabelOrientation=0;
	showPackageNameStyle=0;
	showDefaultPackage=F;
	pointConnectorEndToCompartmentMember=T;
	showUseCaseExtensionPoint=T;
	autoFitShapesSize=F;
	showDiagramFrame=T;
	connectorStyle=1;
	creationTime=1790775686767;
	pmAuthor="Tai.IS";
	Child=(
		{children_str}
	);
	modelElementNameAlignment=4;
	connectorLineJumps=0;
	showUseCaseId=F;
}}'''

    cur.execute("INSERT INTO DIAGRAM (ID, DIAGRAM_TYPE, NAME, DEFINITION) VALUES (?, 'UseCaseDiagram', ?, ?)",
                (diag_id, diag_name, diag_def.encode('utf-8')))
    cur.executemany("INSERT INTO DIAGRAM_ELEMENT (ID, SHAPE_TYPE, DIAGRAM_ID, MODEL_ELEMENT_ID, COMPOSITE_MODEL_ELEMENT_ADDRESS, REF_MODEL_ELEMENT_ADDRESS, PARENT_ID, DEFINITION) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", de_rows)
    
    conn.commit()
    conn.close()

    num_shapes = len(child_shapes)
    num_connectors = len(de_rows) - num_shapes
    print(f"\nSUCCESSFULLY INJECTED MASTER USE CASE SPIDERWEB:")
    print(f"  - Shapes in Child=(...): {num_shapes} (1 Boundary + 7 Packages + 6 Actors + 79 UseCases)")
    print(f"  - Connectors in DIAGRAM_ELEMENT: {num_connectors} (49 Dependencies + 7 Generalizations + 43 Associations)")
    print(f"  - Total Elements: {len(de_rows)}")

if __name__ == '__main__':
    main()
