#!/usr/bin/env python3
"""
inject-all-vp-diagrams.py
Injects 8 professionally laid-out diagrams into Visual Paradigm SQLite (.vpp) file:
1. Domain Architecture - 43 Classes (Class Diagram)
2. Master System Use Cases - All 6 Subsystems & 7 Actors (Use Case Diagram)
3. Subsystem 1: Order Intake & Management (Use Case Diagram)
4. Subsystem 2: Hub Operations & Mid-Mile Transit (Use Case Diagram)
5. Subsystem 3: Last-Mile Delivery & Incident Management (Use Case Diagram)
6. Subsystem 4: COD Settlement & Financial Reconciliation (Use Case Diagram)
7. Subsystem 5: AI Logistics Assistant & Tracking RAG (Use Case Diagram)
8. Subsystem 6: System Administration & RBAC Configuration (Use Case Diagram)
"""

import sqlite3
import shutil
import os
import re

VPP_PATH = '/Users/Tai.IS/Documents/VPProjects/Nexus.vpp'
BACKUP_PATH = '/Users/Tai.IS/Documents/VPProjects/Nexus.vpp.before_draw_backup'

def main():
    if not os.path.exists(BACKUP_PATH):
        shutil.copyfile(VPP_PATH, BACKUP_PATH)
        print('Created backup:', BACKUP_PATH)

    conn = sqlite3.connect(VPP_PATH)
    cur = conn.cursor()

    # Clear existing diagrams if any
    cur.execute('DELETE FROM DIAGRAM')
    cur.execute('DELETE FROM DIAGRAM_ELEMENT')

    diagram_ids = []

    # -------------------------------------------------------------
    # 1. DOMAIN ARCHITECTURE - 43 CLASSES (ClassDiagram)
    # -------------------------------------------------------------
    d1_id = 'diag_class_0001.'
    d1_name = '01. Domain Architecture - 43 Classes'
    diagram_ids.append(d1_id)

    # Fetch classes grouped by package
    cur.execute('SELECT ID, NAME FROM MODEL_ELEMENT WHERE MODEL_TYPE="Package" AND NAME in ("Identity_And_Access_Management", "Masterdata_And_Logistics_Network", "Pickup_And_Dispatch", "Shipment_Core_And_Claims", "Mid_Mile_Transit_And_Scan", "Last_Mile_Delivery", "Payment_And_COD_Settlement", "CQRS_Read_Models_And_AI") ORDER BY NAME')
    packages = cur.fetchall()

    d1_children = []
    d1_de_rows = []

    # Layout in 4 columns x 2 rows of Bounded Contexts
    # Each Bounded Context gets its own visual cluster
    bc_layout = [
        # (pkg_name, col, row)
        ("Identity_And_Access_Management", 0, 0),
        ("Masterdata_And_Logistics_Network", 0, 1),
        ("Pickup_And_Dispatch", 1, 0),
        ("Shipment_Core_And_Claims", 1, 1),
        ("Mid_Mile_Transit_And_Scan", 2, 0),
        ("Last_Mile_Delivery", 2, 1),
        ("Payment_And_COD_Settlement", 3, 0),
        ("CQRS_Read_Models_And_AI", 3, 1),
    ]

    col_x_offsets = [50, 480, 910, 1340]
    row_y_offsets = [60, 680]

    de_counter = 0

    for pkg_name, col_idx, row_idx in bc_layout:
        cur.execute('SELECT ID FROM MODEL_ELEMENT WHERE NAME=? AND MODEL_TYPE="Package"', (pkg_name,))
        pkg_row = cur.fetchone()
        if not pkg_row:
            continue
        pkg_id = pkg_row[0]

        cur.execute('SELECT ID, NAME FROM MODEL_ELEMENT WHERE PARENT_ID=? AND MODEL_TYPE="Class" AND NAME NOT IN ("Float","Int","DateTime","Json")', (pkg_id,))
        classes = cur.fetchall()

        base_x = col_x_offsets[col_idx]
        base_y = row_y_offsets[row_idx]

        for c_idx, (cid, cname) in enumerate(classes):
            de_counter += 1
            de_id = f'sh_c_{de_counter:04d}.....'
            cx = base_x
            cy = base_y + c_idx * 160
            cw = 340
            ch = 135

            de_def = f'''{de_id}:"{cname}":Class {{
	showOperationType=1;
	foreground=(
		31, 
		43, 
		111, 
		255
	);
	showAttributeType=1;
	creatorDiagramType="ClassDiagram";
	connectToPoint=T;
	y={cy};
	x={cx};
	metaModelElement=<{pkg_id}:{cid}>;
	height={ch};
	width={cw};
	background=(
		248, 
		250, 
		255, 
		255
	);
}}'''
            d1_children.append(f'<{d1_id}:{de_id}>')
            d1_de_rows.append((de_id, 'Class', d1_id, cid, None, None, None, de_def.encode('utf-8')))

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
    cur.executemany('INSERT INTO DIAGRAM_ELEMENT VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7].decode('utf-8', errors='ignore').encode('utf-8') if isinstance(r[7], bytes) else r[7]) for r in d1_de_rows])
    print(f'Generated {d1_name} with {len(d1_de_rows)} classes')

    # -------------------------------------------------------------
    # 2. MASTER SYSTEM USE CASES - 6 SUBSYSTEMS & 7 ACTORS
    # -------------------------------------------------------------
    d2_id = 'diag_uc_master.'
    d2_name = '02. Master System Use Cases - Overview'
    diagram_ids.append(d2_id)

    cur.execute('SELECT ID, NAME FROM MODEL_ELEMENT WHERE MODEL_TYPE="Actor"')
    actors = cur.fetchall()

    d2_children = []
    d2_de_rows = []

    # Place 7 actors on the left
    actor_shapes = {}
    for a_idx, (aid, aname) in enumerate(actors):
        de_counter += 1
        de_id = f'sh_act_{de_counter:04d}...'
        ax = 80
        ay = 100 + a_idx * 280
        aw = 60
        ah = 90
        de_def = f'''{de_id}:"{aname}":Actor {{
	parentConnectorHeaderLength=40;
	background=(
		224, 
		242, 
		254, 
		255
	);
	foreground=(
		30, 
		58, 
		138, 
		255
	);
	width={aw};
	connectToPoint=T;
	y={ay};
	x={ax};
	height={ah};
	metaModelElement=<{aid}>;
}}'''
        d2_children.append(f'<{d2_id}:{de_id}>')
        d2_de_rows.append((de_id, 'Actor', d2_id, aid, None, None, None, de_def.encode('utf-8')))
        actor_shapes[aid] = de_id

    # Place core use cases per subsystem on the right
    cur.execute('SELECT ID, NAME FROM MODEL_ELEMENT WHERE MODEL_TYPE="Package" AND NAME LIKE "Phân Hệ%" ORDER BY NAME')
    subsystems = cur.fetchall()

    subsystem_colors = [
        (254, 243, 199),  # amber
        (236, 253, 245),  # mint
        (239, 246, 255),  # blue
        (245, 243, 255),  # violet
        (254, 242, 242),  # rose
        (240, 253, 250),  # teal
    ]

    for s_idx, (sid, sname) in enumerate(subsystems):
        cur.execute('SELECT ID, NAME FROM MODEL_ELEMENT WHERE PARENT_ID=? AND MODEL_TYPE="UseCase" LIMIT 6', (sid,))
        core_ucs = cur.fetchall()
        bg_r, bg_g, bg_b = subsystem_colors[s_idx % len(subsystem_colors)]

        # Layout 2 columns of subsystems: Col 1 (x=380), Col 2 (x=880)
        col = s_idx % 2
        row = s_idx // 2
        base_x = 350 + col * 480
        base_y = 80 + row * 650

        for u_idx, (uid, uname) in enumerate(core_ucs):
            de_counter += 1
            de_id = f'sh_uc_{de_counter:04d}....'
            ux = base_x + (u_idx % 2) * 220
            uy = base_y + (u_idx // 2) * 160
            uw = 190
            uh = 75

            de_def = f'''{de_id}:"{uname}":UseCase {{
	parentConnectorHeaderLength=40;
	background=(
		{bg_r}, 
		{bg_g}, 
		{bg_b}, 
		255
	);
	foreground=(
		15, 
		23, 
		42, 
		255
	);
	width={uw};
	height={uh};
	connectToPoint=T;
	y={uy};
	x={ux};
	metaModelElement=<{sid}:{uid}>;
}}'''
            d2_children.append(f'<{d2_id}:{de_id}>')
            d2_de_rows.append((de_id, 'UseCase', d2_id, uid, None, None, None, de_def.encode('utf-8')))

    child_str_2 = ',\n\t\t'.join(d2_children)
    d2_def = f'''{d2_id}:"{d2_name}":UseCaseDiagram {{
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
	showUseCaseExtensionPoint=T;
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
		{child_str_2}
	);
	modelElementNameAlignment=4;
	connectorLineJumps=0;
	gridHeight=10;
	showUseCaseId=F;
	gridColor=(
		192, 
		192, 
		192, 
		255
	);
}}'''
    cur.execute('INSERT INTO DIAGRAM VALUES (?, ?, ?, ?, ?)', (d2_id, 'UseCaseDiagram', None, d2_name, d2_def.encode('utf-8')))
    cur.executemany('INSERT INTO DIAGRAM_ELEMENT VALUES (?, ?, ?, ?, ?, ?, ?, ?)', d2_de_rows)
    print(f'Generated {d2_name} with {len(d2_de_rows)} shapes')

    # -------------------------------------------------------------
    # 3 - 8. DETAILED USE CASE DIAGRAMS PER SUBSYSTEM (6 DIAGRAMS)
    # -------------------------------------------------------------
    for s_idx, (sid, sname) in enumerate(subsystems):
        clean_name = sname.split(':')[1].split('(')[0].strip() if ':' in sname else sname
        sub_d_id = f'diag_sub_{s_idx+1:02d}....'
        sub_d_name = f'0{s_idx+3}. Use Case - {clean_name}'
        diagram_ids.append(sub_d_id)

        cur.execute('SELECT ID, NAME FROM MODEL_ELEMENT WHERE PARENT_ID=? AND MODEL_TYPE="UseCase" ORDER BY NAME', (sid,))
        sub_ucs = cur.fetchall()

        sub_children = []
        sub_de_rows = []

        # Actors related to this subsystem
        # Place 2-3 prominent actors on the left
        cur.execute('SELECT ID, NAME FROM MODEL_ELEMENT WHERE MODEL_TYPE="Actor" LIMIT 4')
        sub_actors = cur.fetchall()
        for a_idx, (aid, aname) in enumerate(sub_actors):
            de_counter += 1
            de_id = f'sh_sa_{de_counter:04d}...'
            ax = 60
            ay = 80 + a_idx * 180
            aw = 60
            ah = 90
            de_def = f'''{de_id}:"{aname}":Actor {{
	parentConnectorHeaderLength=40;
	background=(
		224, 
		242, 
		254, 
		255
	);
	foreground=(
		30, 
		58, 
		138, 
		255
	);
	width={aw};
	height={ah};
	connectToPoint=T;
	y={ay};
	x={ax};
	metaModelElement=<{aid}>;
}}'''
            sub_children.append(f'<{sub_d_id}:{de_id}>')
            sub_de_rows.append((de_id, 'Actor', sub_d_id, aid, None, None, None, de_def.encode('utf-8')))

        # Use cases in 3 neat columns
        bg_r, bg_g, bg_b = subsystem_colors[s_idx % len(subsystem_colors)]
        for u_idx, (uid, uname) in enumerate(sub_ucs):
            de_counter += 1
            de_id = f'sh_su_{de_counter:04d}...'
            col = u_idx % 3
            row = u_idx // 3
            ux = 280 + col * 260
            uy = 80 + row * 130
            uw = 230
            uh = 75

            de_def = f'''{de_id}:"{uname}":UseCase {{
	parentConnectorHeaderLength=40;
	background=(
		{bg_r}, 
		{bg_g}, 
		{bg_b}, 
		255
	);
	foreground=(
		15, 
		23, 
		42, 
		255
	);
	width={uw};
	height={uh};
	connectToPoint=T;
	y={uy};
	x={ux};
	metaModelElement=<{sid}:{uid}>;
}}'''
            sub_children.append(f'<{sub_d_id}:{de_id}>')
            sub_de_rows.append((de_id, 'UseCase', sub_d_id, uid, None, None, None, de_def.encode('utf-8')))

        child_str_sub = ',\n\t\t'.join(sub_children)
        sub_d_def = f'''{sub_d_id}:\"{sub_d_name}\":UseCaseDiagram {{
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
	showUseCaseExtensionPoint=T;
	autoFitShapesSize=F;
	connectorStyle=1;
	diagramPreviewData_name=NULL;
	_globalPaletteOption=T;
	connectionPointStyle=0;
	gridWidth=10;
	alignToGrid=F;
	creationTime=1790775686767;
	pmAuthor=\"Tai.IS\";
	connectorLineJumpsSize=0;
	showStereotypes=T;
	shapePresentationOption=0;
	initializeDiagramForCreate=T;
	Child=(
		{child_str_sub}
	);
	modelElementNameAlignment=4;
	connectorLineJumps=0;
	gridHeight=10;
	showUseCaseId=F;
	gridColor=(
		192, 
		192, 
		192, 
		255
	);
}}'''
        cur.execute('INSERT INTO DIAGRAM VALUES (?, ?, ?, ?, ?)', (sub_d_id, 'UseCaseDiagram', None, sub_d_name, sub_d_def.encode('utf-8')))
        cur.executemany('INSERT INTO DIAGRAM_ELEMENT VALUES (?, ?, ?, ?, ?, ?, ?, ?)', sub_de_rows)
        print(f'Generated {sub_d_name} with {len(sub_de_rows)} shapes')

    # Update PROJECT_INFO DIAGRAMS_DEFINITION
    root_diag_children = ',\n\t\t'.join([f'<{did}>' for did in diagram_ids])
    new_root_diagrams = f'''rootDiagrams:\"rootDiagrams\":rootDiagrams {{
	Child=(
		{root_diag_children}
	);
}}'''
    cur.execute('UPDATE PROJECT_INFO SET DIAGRAMS_DEFINITION=?', (new_root_diagrams,))

    # Also clean projectStatus if any
    cur.execute('SELECT DEFINITION FROM PROJECT_INFO')
    blob = cur.fetchone()[0]
    text = blob.decode('utf-8', errors='ignore')
    pattern = r'\tprojectStatus=\{projectStatus:\"projectStatus\":projectStatus \{[^}]+\}\};\n'
    if re.search(pattern, text):
        new_text = re.sub(pattern, '', text)
        cur.execute('UPDATE PROJECT_INFO SET DEFINITION = ?', (new_text.encode('utf-8'),))
        print('Cleaned projectStatus lock.')

    conn.commit()
    conn.close()
    print('ALL 8 DIAGRAMS SUCCESSFULLY INJECTED INTO Nexus.vpp!')

if __name__ == '__main__':
    main()
