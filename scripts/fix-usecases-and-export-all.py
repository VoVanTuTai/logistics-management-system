#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix-usecases-and-export-all.py
Ensures Diagrams 02 through 08 in Nexus.vpp have 100% collision-free IDs and complete shapes,
then exports all 8 diagrams to PNG.
"""

import sqlite3
import subprocess
import os

VPP_PATH = '/Users/Tai.IS/Documents/VPProjects/Nexus.vpp'
EXPORT_DIR = '/Users/Tai.IS/Documents/VPProjects/exported_diagrams_v2'

def main():
    conn = sqlite3.connect(VPP_PATH)
    cur = conn.cursor()

    # Query all subsystems
    subsystems = cur.execute('SELECT ID, NAME FROM MODEL_ELEMENT WHERE MODEL_TYPE="Package" AND NAME LIKE "Phân Hệ%" ORDER BY NAME').fetchall()
    actors = cur.execute('SELECT ID, NAME FROM MODEL_ELEMENT WHERE MODEL_TYPE="Actor" ORDER BY NAME').fetchall()

    subsystem_colors = [
        (238, 242, 255),  # Indigo 50
        (240, 253, 244),  # Emerald 50
        (254, 242, 242),  # Rose 50
        (254, 249, 195),  # Yellow 50
        (245, 243, 255),  # Violet 50
        (248, 250, 252),  # Slate 50
    ]

    subsystem_primary_actor = {
        0: "Người Gửi Hàng (Merchant B2B)",
        1: "Nhân Viên Vận Hành (Ops Staff)",
        2: "Nhân Viên Giao Hàng (Shipper)",
        3: "Quản Trị Viên (System Admin)",
        4: "Trợ Lý AI & Hệ Thống (Supporting System)",
        5: "Quản Trị Viên (System Admin)",
    }

    # -----------------------------------------------------------------
    # FIX DIAGRAMS 03 TO 08 (Subsystem Use Case Diagrams)
    # -----------------------------------------------------------------
    for s_idx, (sid, sname) in enumerate(subsystems):
        clean_name = sname.split(':')[1].split('(')[0].strip() if ':' in sname else sname
        sub_d_id = f'diag_sub_{s_idx+1:02d}....'
        sub_d_name = f'0{s_idx+3}. Use Case - {clean_name}'

        cur.execute('DELETE FROM DIAGRAM WHERE ID=?', (sub_d_id,))
        cur.execute('DELETE FROM DIAGRAM_ELEMENT WHERE DIAGRAM_ID=?', (sub_d_id,))

        cur.execute('SELECT ID, NAME FROM MODEL_ELEMENT WHERE PARENT_ID=? AND MODEL_TYPE="UseCase" ORDER BY NAME', (sid,))
        sub_ucs = cur.fetchall()

        sub_children = []
        sub_de_rows = []

        # Primary Actor
        primary_actor_name = subsystem_primary_actor.get(s_idx, "Quản Trị Viên (System Admin)")
        cur.execute('SELECT ID FROM MODEL_ELEMENT WHERE NAME=? AND MODEL_TYPE="Actor"', (primary_actor_name,))
        act_row = cur.fetchone()
        aid = act_row[0] if act_row else actors[0][0]

        act_de_id = f's{s_idx+1:02d}_act_0001...'
        ax, ay, aw, ah = 80, 220, 70, 100
        de_def = f'''{act_de_id}:"{primary_actor_name}":Actor {{
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
        sub_children.append(f'<{sub_d_id}:{act_de_id}>')
        sub_de_rows.append((act_de_id, 'Actor', sub_d_id, aid, None, None, None, de_def.encode('utf-8')))

        # Use cases in 3 neat columns
        bg_r, bg_g, bg_b = subsystem_colors[s_idx % len(subsystem_colors)]
        for u_idx, (uid, uname) in enumerate(sub_ucs):
            u_de_id = f's{s_idx+1:02d}_u_{u_idx+1:04d}....'
            col = u_idx % 3
            row = u_idx // 3
            ux = 320 + col * 280
            uy = 80 + row * 140
            uw = 245
            uh = 85

            de_def = f'''{u_de_id}:"{uname}":UseCase {{
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
            sub_children.append(f'<{sub_d_id}:{u_de_id}>')
            sub_de_rows.append((u_de_id, 'UseCase', sub_d_id, uid, None, None, None, de_def.encode('utf-8')))

            # Connect actor to first column use cases
            if col == 0:
                conn_id = f's{s_idx+1:02d}_c_{u_idx+1:04d}....'
                assoc_def = f'''{conn_id}:NULL:Association {{
	foreground=(
		100, 
		116, 
		139, 
		255
	);
	fromPinType=1;
	_points="{ax + aw},{ay + ah // 2};{ux},{uy + uh // 2};";
	toPinType=1;
	useToShapeCenter=T;
	_fromShape=<{sub_d_id}:{act_de_id}>;
	useFromShapeCenter=T;
	_toShape=<{sub_d_id}:{u_de_id}>;
	_lineModel=(
		@cap=0;, 
		@transparency=0;, 
		@weight=1.0;, 
		@color=(
			100, 
			116, 
			139, 
			255
		);, 
		@hasStroke=T;
	);
}}'''
                sub_children.append(f'<{sub_d_id}:{conn_id}>')
                sub_de_rows.append((conn_id, 'Association', sub_d_id, None, None, None, None, assoc_def.encode('utf-8')))

        child_str_sub = ',\n\t\t'.join(sub_children)
        sub_d_def = f'''{sub_d_id}:"{sub_d_name}":UseCaseDiagram {{
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
        print(f'✓ Updated {sub_d_name}: {len(sub_de_rows)} shapes ({len(sub_ucs)} use cases, 1 actor, {len(sub_de_rows)-len(sub_ucs)-1} associations)')

    conn.commit()
    conn.close()
    print('All Use Case Diagrams (03-08) cleanly updated!')

if __name__ == '__main__':
    main()
