import os, glob, re, json
from collections import defaultdict

def escape_java(s):
    if not s:
        return ""
    return s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '')

def parse_puml_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    lifelines = []
    events = []
    
    in_note = False
    note_text = []
    note_lifelines = []
    
    ll_pattern = re.compile(r'^(actor|boundary|control|entity|database|participant)\s+\"([^\"]+)\"\s+as\s+(\w+)')
    msg_pattern = re.compile(r'^(\w+)\s*(-->>|->>|-->|->)\s*(\w+)\s*:\s*(.*)$')
    note_start = re.compile(r'^note\s+(over|left of|right of)\s+([^\n:]+)(?::\s*(.*))?$')
    alt_start = re.compile(r'^alt\s*(.*)$')
    opt_start = re.compile(r'^opt\s*(.*)$')
    loop_start = re.compile(r'^loop\s*(.*)$')
    else_stmt = re.compile(r'^else\s*(.*)$')
    act_stmt = re.compile(r'^activate\s+(\w+)')
    deact_stmt = re.compile(r'^deactivate\s+(\w+)')

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith('\'') or line.startswith('!theme') or line.startswith('skinparam') or line.startswith('autonumber') or line.startswith('@startuml') or line.startswith('@enduml') or line.startswith('box ') or line == 'end box':
            continue
            
        if in_note:
            if line == 'end note':
                in_note = False
                events.append({
                    'type': 'note',
                    'lifelines': note_lifelines,
                    'text': '\n'.join(note_text).strip()
                })
                note_text = []
                note_lifelines = []
            else:
                note_text.append(raw_line.rstrip('\r\n'))
            continue
            
        m = note_start.match(line)
        if m:
            placement = m.group(1)
            target = [x.strip() for x in m.group(2).split(',') if x.strip()]
            inline_text = m.group(3)
            if inline_text:
                events.append({
                    'type': 'note',
                    'lifelines': target,
                    'text': inline_text.replace('\\n', '\n').strip()
                })
            else:
                in_note = True
                note_lifelines = target
                note_text = []
            continue
            
        m = ll_pattern.match(line)
        if m:
            t = m.group(1)
            if t == 'database': t = 'entity'
            if t == 'participant': t = 'control'
            lifelines.append({
                'id': m.group(3),
                'name': m.group(2).replace('\\n', '\n'),
                'type': t
            })
            continue
            
        m = alt_start.match(line)
        if m:
            events.append({'type': 'fragment_start', 'operator': 'alt', 'guard': m.group(1).strip()})
            continue
            
        m = opt_start.match(line)
        if m:
            events.append({'type': 'fragment_start', 'operator': 'opt', 'guard': m.group(1).strip()})
            continue

        m = loop_start.match(line)
        if m:
            events.append({'type': 'fragment_start', 'operator': 'loop', 'guard': m.group(1).strip()})
            continue
            
        m = else_stmt.match(line)
        if m:
            events.append({'type': 'fragment_operand', 'guard': m.group(1).strip()})
            continue
            
        if line == 'end':
            events.append({'type': 'fragment_end'})
            continue
            
        m = act_stmt.match(line)
        if m:
            events.append({'type': 'activate', 'lifeline': m.group(1)})
            continue

        m = deact_stmt.match(line)
        if m:
            events.append({'type': 'deactivate', 'lifeline': m.group(1)})
            continue
            
        m = msg_pattern.match(line)
        if m:
            src = m.group(1)
            arrow = m.group(2)
            dst = m.group(3)
            text = m.group(4).replace('\\n', '\n').strip()
            action = 'self' if src == dst else ('return' if '-->' in arrow or '-->>' in arrow else 'call')
            events.append({
                'type': 'message',
                'action': action,
                'from': src,
                'to': dst,
                'text': text
            })
            continue

    return lifelines, events

def process_diagram(diag_name, puml_path, output_filename=None):
    lifelines, raw_events = parse_puml_file(puml_path)
    
    # Calculate lifeline X positions
    ll_count = len(lifelines)
    startX = 80
    colWidth = 380 if ll_count <= 8 else 340
    ll_positions = {}
    centerXs = {}
    for i, ll in enumerate(lifelines):
        x = startX + i * colWidth
        ll_positions[ll['id']] = x
        centerXs[ll['id']] = x + 35
        
    y = 140
    active = defaultdict(list)
    activations = []
    
    frag_stack = []
    completed_fragments = []
    timed_events = []
    
    step_num = 1
    
    for ev in raw_events:
        t = ev['type']
        if t == 'message':
            src = ev['from']
            dst = ev['to']
            act = ev['action']
            raw_text = ev['text']
            
            # Format numbered step text if not already starting with a number
            clean_text = raw_text.strip()
            if not re.match(r'^\d+[\.\)]\s*', clean_text):
                formatted_text = f"{step_num}. {clean_text}"
            else:
                formatted_text = clean_text
            step_num += 1
            
            for f in frag_stack:
                f['coveredLifelines'].add(src)
                f['coveredLifelines'].add(dst)
                
            if act == 'call':
                y += 75
                if not active[dst]:
                    active[dst].append(y)
                timed_events.append({'type': 'call', 'from': src, 'to': dst, 'text': formatted_text, 'y': y})
            elif act == 'self':
                y += 85
                if not active[src]:
                    active[src].append(y)
                timed_events.append({'type': 'self', 'from': src, 'to': src, 'text': formatted_text, 'y': y})
            elif act == 'return':
                y += 70
                if active[src]:
                    sy = active[src].pop()
                    activations.append({'lifeline': src, 'start_y': sy, 'end_y': y})
                timed_events.append({'type': 'return', 'from': src, 'to': dst, 'text': formatted_text, 'y': y})
                
        elif t == 'activate':
            ll_id = ev['lifeline']
            if not active[ll_id]:
                active[ll_id].append(y)
                
        elif t == 'deactivate':
            ll_id = ev['lifeline']
            if active[ll_id]:
                sy = active[ll_id].pop()
                activations.append({'lifeline': ll_id, 'start_y': sy, 'end_y': y})
                
        elif t == 'note':
            y += 35
            text_lines = ev['text'].count('\n') + 1
            note_h = max(65, text_lines * 18 + 32)
            
            target_lls = ev['lifelines']
            if len(target_lls) == 1:
                cx = centerXs.get(target_lls[0], startX)
                nx = cx + 30
                nw = 270
            elif len(target_lls) >= 2:
                cx1 = centerXs.get(target_lls[0], startX)
                cx2 = centerXs.get(target_lls[-1], startX + colWidth)
                nx = min(cx1, cx2) + 25
                nw = max(260, abs(cx2 - cx1) - 50)
            else:
                nx = startX + 50
                nw = 270
                
            timed_events.append({'type': 'note', 'text': ev['text'], 'x': nx, 'y': y, 'w': nw, 'h': note_h})
            y += note_h + 35
            
        elif t == 'fragment_start':
            y += 70
            f_obj = {
                'operator': ev['operator'],
                'topY': y,
                'operands': [{'guard': ev['guard'], 'startY': y}],
                'coveredLifelines': set()
            }
            frag_stack.append(f_obj)
            y += 40  # breathing room for guard constraint label
            
        elif t == 'fragment_operand':
            y += 65
            if frag_stack:
                cur = frag_stack[-1]
                cur['operands'][-1]['endY'] = y
                cur['operands'].append({'guard': ev['guard'], 'startY': y})
                y += 40  # breathing room for operand guard constraint label
                
        elif t == 'fragment_end':
            y += 35
            if frag_stack:
                cur = frag_stack.pop()
                cur['operands'][-1]['endY'] = y
                cur['endY'] = y
                completed_fragments.append(cur)
                
    while frag_stack:
        cur = frag_stack.pop()
        cur['operands'][-1]['endY'] = y
        cur['endY'] = y
        completed_fragments.append(cur)
        
    for ll_id, starts in active.items():
        for sy in starts:
            activations.append({'lifeline': ll_id, 'start_y': sy, 'end_y': y + 20})
            
    total_height = max(y + 250, 1500)
    
    for f in completed_fragments:
        cov = f['coveredLifelines']
        if not cov:
            fx = startX - 20
            fw = (ll_count - 1) * colWidth + 140
        else:
            xs = [centerXs[lid] for lid in cov if lid in centerXs]
            if xs:
                fx = max(20, min(xs) - 80)
                fw = max(xs) - min(xs) + 160
            else:
                fx = startX - 20
                fw = (ll_count - 1) * colWidth + 140
        f['x'] = fx
        f['w'] = fw
        f['h'] = f['endY'] - f['topY']
        for op in f['operands']:
            op['h'] = op.get('endY', f['endY']) - op['startY']
            
    return {
        'name': diag_name,
        'filename': output_filename or diag_name.replace('/', '_').replace(':', '_'),
        'lifelines': lifelines,
        'll_positions': ll_positions,
        'centerXs': centerXs,
        'total_height': total_height,
        'timed_events': timed_events,
        'activations': activations,
        'fragments': completed_fragments
    }

def generate_java_source(diagram_list, class_name="NexusBatchSequencePlugin", output_png_dir="/Users/Tai.IS/my-project/logistics-management-system/docs/sequence-diagrams/Visual_Paradigm"):
    lines = []
    def w(s): lines.append(s)

    w("package nexus;")
    w("")
    w("import com.vp.plugin.VPPlugin;")
    w("import com.vp.plugin.VPPluginInfo;")
    w("import com.vp.plugin.VPPluginCommandLineSupport;")
    w("import com.vp.plugin.ApplicationManager;")
    w("import com.vp.plugin.DiagramManager;")
    w("import com.vp.plugin.ModelConvertionManager;")
    w("import com.vp.plugin.ExportDiagramAsImageOption;")
    w("import com.vp.plugin.diagram.IDiagramUIModel;")
    w("import com.vp.plugin.diagram.IDiagramElement;")
    w("import com.vp.plugin.diagram.IShapeUIModel;")
    w("import com.vp.plugin.diagram.IInteractionDiagramUIModel;")
    w("import com.vp.plugin.diagram.shape.IInteractionLifeLineUIModel;")
    w("import com.vp.plugin.diagram.shape.IInteractionActorUIModel;")
    w("import com.vp.plugin.diagram.shape.ICombinedFragmentUIModel;")
    w("import com.vp.plugin.diagram.shape.IInteractionOperandUIModel;")
    w("import com.vp.plugin.diagram.shape.INoteUIModel;")
    w("import com.vp.plugin.diagram.format.IShapeUIModelFillColor;")
    w("import com.vp.plugin.diagram.connector.IMessageUIModel;")
    w("import com.vp.plugin.model.factory.IModelElementFactory;")
    w("import com.vp.plugin.model.IProject;")
    w("import com.vp.plugin.model.IModelElement;")
    w("import com.vp.plugin.model.IInteractionLifeLine;")
    w("import com.vp.plugin.model.IInteractionActor;")
    w("import com.vp.plugin.model.IActivation;")
    w("import com.vp.plugin.model.ICombinedFragment;")
    w("import com.vp.plugin.model.IInteractionOperand;")
    w("import com.vp.plugin.model.IInteractionConstraint;")
    w("import com.vp.plugin.model.IMessage;")
    w("import com.vp.plugin.model.INOTE;")
    w("import java.awt.Color;")
    w("import java.awt.Point;")
    w("import java.io.File;")
    w("import java.util.HashMap;")
    w("import java.util.Map;")
    w("import java.util.List;")
    w("import java.util.ArrayList;")
    w("")
    w(f"public class {class_name} implements VPPlugin, VPPluginCommandLineSupport {{")
    w("")
    w("    private DiagramManager dm;")
    w("    private IModelElementFactory factory;")
    w("    private IProject project;")
    w("    private IInteractionDiagramUIModel diagram;")
    w("")
    w("    private Map<String, IModelElement> models = new HashMap<>();")
    w("    private Map<String, IDiagramElement> shapes = new HashMap<>();")
    w("    private Map<String, Integer> centerXs = new HashMap<>();")
    w("    private List<IShapeUIModel> backShapes = new ArrayList<>();")
    w("")
    w("    public void loaded(VPPluginInfo pluginInfo) {}")
    w("    public void unloaded() {}")
    w("")
    w("    public void invoke(String[] args) {")
    w("        try {")
    w("            System.out.println(\"===============================================================\");")
    w("            System.out.println(\"  NEXUS: BATCH INJECTING SEQUENCE DIAGRAMS (UML 2.5 BCE)\");")
    w("            System.out.println(\"===============================================================\");")
    w("")
    w("            dm = ApplicationManager.instance().getDiagramManager();")
    w("            factory = IModelElementFactory.instance();")
    w("            project = ApplicationManager.instance().getProjectManager().getProject();")
    w("")
    for idx, d in enumerate(diagram_list):
        w(f"            buildDiagram_{idx}();")
    w("")
    w("            ApplicationManager.instance().getProjectManager().saveProject();")
    w("            System.out.println(\"===============================================================\");")
    w("            System.out.println(\">>> ALL DIAGRAMS SAVED & EXPORTED SUCCESSFULLY! <<<\");")
    w("            System.out.println(\"===============================================================\");")
    w("        } catch (Throwable t) {")
    w("            System.err.println(\"FATAL ERROR in Batch Plugin: \" + t.getMessage());")
    w("            t.printStackTrace();")
    w("        }")
    w("    }")
    w("")

    # Diagram methods
    for idx, d in enumerate(diagram_list):
        d_name = d['name']
        f_name = d.get('filename', d_name.replace('/', '_').replace(':', '_'))
        height = d['total_height']

        w(f"    private void buildDiagram_{idx}() throws Throwable {{")
        w(f'        String diagName = "{escape_java(d_name)}";')
        w(f'        System.out.println(">>> [Diagram {idx+1}/{len(diagram_list)}] Building: " + diagName);')
        w("")
        w("        IDiagramUIModel[] existingDiagrams = project.toDiagramArray();")
        w("        if (existingDiagrams != null) {")
        w("            for (IDiagramUIModel d : existingDiagrams) {")
        w("                if (diagName.equals(d.getName())) {")
        w("                    d.delete();")
        w("                }")
        w("            }")
        w("        }")
        w("")
        w("        diagram = (IInteractionDiagramUIModel) dm.createDiagram(DiagramManager.DIAGRAM_TYPE_INTERACTION_DIAGRAM);")
        w("        diagram.setName(diagName);")
        w("        diagram.setDisplayLifeLinesAsRobustnessAnalysisIcon(IInteractionDiagramUIModel.DISPLAY_LIFELINE_AS_ROBUSTNESS_ANALYSIS_ICON_YES);")
        w("        diagram.setShowSequenceNumbers(true);")
        w("        diagram.setShowActivations(true);")
        w("        diagram.setShowMessageName(true);")
        w("")
        w("        models.clear();")
        w("        shapes.clear();")
        w("        centerXs.clear();")
        w("        backShapes.clear();")
        w("")
        w(f"        int lifeLineHeight = {height};")
        w("        int startY = 40;")
        w("        int lifeLineWidth = 70;")
        w("")

        for ll in d['lifelines']:
            lid = ll['id']
            lname = escape_java(ll['name'])
            ltype = ll['type']
            lx = d['ll_positions'][lid]
            if ltype == 'actor':
                w(f'        addActor("{lid}", "{lname}", {lx}, startY, lifeLineWidth, lifeLineHeight);')
            else:
                w(f'        addLifeLine("{lid}", "{lname}", "{ltype}", {lx}, startY, lifeLineWidth, lifeLineHeight);')
        w("")

        for act in d['activations']:
            lid = act['lifeline']
            sy = act['start_y']
            h = max(30, act['end_y'] - sy)
            w(f'        addActivation("{lid}", {sy}, {h});')
        w("")

        for ev in d['timed_events']:
            et = ev['type']
            if et == 'call':
                f_id = ev['from']
                t_id = ev['to']
                txt = escape_java(ev['text'])
                y = ev['y']
                w(f'        addCall("{f_id}", "{t_id}", "{txt}", {y});')
            elif et == 'return':
                f_id = ev['from']
                t_id = ev['to']
                txt = escape_java(ev['text'])
                y = ev['y']
                w(f'        addReturn("{f_id}", "{t_id}", "{txt}", {y});')
            elif et == 'self':
                f_id = ev['from']
                txt = escape_java(ev['text'])
                y = ev['y']
                w(f'        addSelf("{f_id}", "{txt}", {y});')
            elif et == 'note':
                txt = escape_java(ev['text'])
                nx = ev['x']
                ny = ev['y']
                nw = ev['w']
                nh = ev['h']
                w(f'        addNote("{txt}", {nx}, {ny}, {nw}, {nh});')
        w("")

        for frag_i, frag in enumerate(d['fragments']):
            fop = frag['operator'].upper()
            fx = frag['x']
            fy = frag['topY']
            fw = frag['w']
            fh = max(100, frag['h'])
            cov_ids = list(frag['coveredLifelines'])
            cov_str = ', '.join([f'"{cid}"' for cid in cov_ids if cid in d['ll_positions']])
            
            w(f"        // Fragment {frag_i+1}: {fop}")
            w("        {")
            w("            ICombinedFragment frag = factory.createCombinedFragment();")
            w(f"            frag.setInteractionOperator(ICombinedFragment.INTERACTION_OPERATOR_{fop});")
            w(f"            for (String lid : new String[]{{{cov_str}}}) {{")
            w("                IModelElement m = models.get(lid);")
            w("                if (m instanceof IInteractionLifeLine) frag.addCoveredLifeLine((IInteractionLifeLine) m);")
            w("            }")
            w("            ICombinedFragmentUIModel fragShape = (ICombinedFragmentUIModel) dm.createDiagramElement(diagram, frag);")
            w(f"            fragShape.setBounds({fx}, {fy}, {fw}, {fh});")
            w("            backShapes.add(fragShape);")
            w("")
            for op_i, op in enumerate(frag['operands']):
                oguard = escape_java(op.get('guard', ''))
                osy = op['startY']
                osh = max(50, op.get('h', 80))
                w("            {")
                w("                IInteractionOperand op = frag.createInteractionOperand();")
                w("                IInteractionConstraint constraint = factory.createInteractionConstraint();")
                w(f'                constraint.setConstraint("{oguard}");')
                w(f'                constraint.setName("{oguard}");')
                w("                op.setGuard(constraint);")
                w(f'                op.setName("[{oguard}]");')
                w("                IInteractionOperandUIModel opShape = (IInteractionOperandUIModel) dm.createDiagramElement(diagram, op);")
                w(f"                opShape.setBounds({fx}, {osy}, {fw}, {osh});")
                w("                backShapes.add(opShape);")
                w("            }")
            w("        }")
            w("")

        w("        for (IShapeUIModel bs : backShapes) {")
        w("            bs.sendToBack();")
        w("        }")
        w("")
        w("        try {")
        w(f'            File outFile = new File("{output_png_dir}", "{escape_java(f_name)}.png");')
        w("            ExportDiagramAsImageOption opt = new ExportDiagramAsImageOption(ExportDiagramAsImageOption.IMAGE_TYPE_PNG);")
        w("            ApplicationManager.instance().getModelConvertionManager().exportDiagramAsImage(diagram, outFile, opt);")
        w('            System.out.println("   [Exported PNG]: " + outFile.getAbsolutePath());')
        w("        } catch (Throwable ex) {")
        w('            System.err.println("   [Export Error]: " + ex.getMessage());')
        w("        }")
        w("    }")
        w("")

    # Helper methods
    w("    private void addActor(String id, String name, int x, int y, int w, int h) {")
    w("        IInteractionActor model = factory.createInteractionActor();")
    w("        model.setName(name);")
    w("        IDiagramElement shape = dm.createDiagramElement(diagram, model);")
    w("        shape.setBounds(x, y, w, h);")
    w("        models.put(id, model);")
    w("        shapes.put(id, shape);")
    w("        centerXs.put(id, x + w / 2);")
    w("    }")
    w("")
    w("    private void addLifeLine(String id, String name, String stereotype, int x, int y, int w, int h) {")
    w("        IInteractionLifeLine model = factory.createInteractionLifeLine();")
    w("        model.setName(name);")
    w("        if (stereotype != null && !stereotype.isEmpty()) {")
    w("            model.addStereotype(stereotype);")
    w("        }")
    w("        IInteractionLifeLineUIModel shape = (IInteractionLifeLineUIModel) dm.createDiagramElement(diagram, model);")
    w("        shape.setBounds(x, y, w, h);")
    w("        models.put(id, model);")
    w("        shapes.put(id, shape);")
    w("        centerXs.put(id, x + w / 2);")
    w("    }")
    w("")
    w("    private IDiagramElement addActivation(String lifelineId, int yStart, int height) {")
    w("        IModelElement model = models.get(lifelineId);")
    w("        if (!(model instanceof IInteractionLifeLine)) return null;")
    w("        IInteractionLifeLine lifeLineModel = (IInteractionLifeLine) model;")
    w("        int x = centerXs.getOrDefault(lifelineId, 100);")
    w("        IActivation act = factory.createActivation();")
    w("        lifeLineModel.addActivation(act);")
    w("        IDiagramElement actShape = dm.createDiagramElement(diagram, act);")
    w("        actShape.setBounds(x - 5, yStart, 10, height);")
    w("        return actShape;")
    w("    }")
    w("")
    w("    private void addCall(String fromId, String toId, String label, int y) {")
    w("        IModelElement fromModel = models.get(fromId);")
    w("        IModelElement toModel = models.get(toId);")
    w("        IDiagramElement fromShape = shapes.get(fromId);")
    w("        IDiagramElement toShape = shapes.get(toId);")
    w("        if (fromModel == null || toModel == null) return;")
    w("        int x1 = centerXs.getOrDefault(fromId, 100);")
    w("        int x2 = centerXs.getOrDefault(toId, 200);")
    w("")
    w("        IMessage msg = factory.createMessage();")
    w("        msg.setName(label);")
    w("        msg.setFrom(fromModel);")
    w("        msg.setTo(toModel);")
    w("        msg.setActionType(factory.createActionTypeCall());")
    w("")
    w("        Point[] pts = new Point[] { new Point(x1, y), new Point(x2, y) };")
    w("        IMessageUIModel msgShape = (IMessageUIModel) dm.createConnector(diagram, msg, fromShape, toShape, pts);")
    w("        msgShape.setShowMessageName(IMessageUIModel.SHOW_MESSAGE_NAME_YES);")
    w("        msgShape.resetCaption();")
    w("    }")
    w("")
    w("    private void addReturn(String fromId, String toId, String label, int y) {")
    w("        IModelElement fromModel = models.get(fromId);")
    w("        IModelElement toModel = models.get(toId);")
    w("        IDiagramElement fromShape = shapes.get(fromId);")
    w("        IDiagramElement toShape = shapes.get(toId);")
    w("        if (fromModel == null || toModel == null) return;")
    w("        int x1 = centerXs.getOrDefault(fromId, 100);")
    w("        int x2 = centerXs.getOrDefault(toId, 200);")
    w("")
    w("        IMessage msg = factory.createMessage();")
    w("        msg.setName(label);")
    w("        msg.setFrom(fromModel);")
    w("        msg.setTo(toModel);")
    w("        msg.setActionType(factory.createActionTypeReturn());")
    w("")
    w("        Point[] pts = new Point[] { new Point(x1, y), new Point(x2, y) };")
    w("        IMessageUIModel msgShape = (IMessageUIModel) dm.createConnector(diagram, msg, fromShape, toShape, pts);")
    w("        msgShape.setShowMessageName(IMessageUIModel.SHOW_MESSAGE_NAME_YES);")
    w("        msgShape.resetCaption();")
    w("    }")
    w("")
    w("    private void addSelf(String id, String label, int y) {")
    w("        IModelElement model = models.get(id);")
    w("        IDiagramElement shape = shapes.get(id);")
    w("        if (model == null) return;")
    w("        int x = centerXs.getOrDefault(id, 100);")
    w("")
    w("        IMessage msg = factory.createMessage();")
    w("        msg.setName(label);")
    w("        msg.setFrom(model);")
    w("        msg.setTo(model);")
    w("        msg.setType(IMessage.TYPE_SELF_MESSAGE);")
    w("        msg.setActionType(factory.createActionTypeCall());")
    w("")
    w("        Point[] pts = new Point[] {")
    w("            new Point(x, y),")
    w("            new Point(x + 50, y),")
    w("            new Point(x + 50, y + 35),")
    w("            new Point(x, y + 35)")
    w("        };")
    w("        IMessageUIModel msgShape = (IMessageUIModel) dm.createConnector(diagram, msg, shape, shape, pts);")
    w("        msgShape.setShowMessageName(IMessageUIModel.SHOW_MESSAGE_NAME_YES);")
    w("        msgShape.resetCaption();")
    w("    }")
    w("")
    w("    private void addNote(String text, int x, int y, int w, int h) {")
    w("        INOTE note = factory.createNOTE();")
    w("        note.setDescription(text);")
    w("        INoteUIModel noteShape = (INoteUIModel) dm.createDiagramElement(diagram, note);")
    w("        noteShape.setBounds(x, y, w, h);")
    w("        IShapeUIModelFillColor fill = noteShape.getFillColor();")
    w("        if (fill != null) {")
    w("            Color yellow = new Color(254, 243, 199);")
    w("            fill.setColor1(yellow);")
    w("            fill.setColor2(yellow);")
    w("            fill.applySetting();")
    w("        }")
    w("    }")
    w("}")
    return "\n".join(lines)

print("generate_vp_batch.py updated with academic sequential numbering & guard breathing room.")
