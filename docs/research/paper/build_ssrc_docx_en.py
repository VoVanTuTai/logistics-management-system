import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from latex2mathml.converter import convert as latex2mathml_convert
from mathml2omml import convert as mathml2omml_convert

def fix_and_build_ssrc_docx():
    template_path = 'docs/research/SSRC_Word_Template.docx'
    output_path = 'docs/research/paper/SSRC_Multi_Agent_RAG_Tool_Calling_Logistics.docx'
    
    # Golden 3-Figure Suite (Strict 6-Page IEEE Double-Column Format)
    image_arch_path = 'docs/research/paper/diagrams/code-aligned-hmas-ai-generated-bw.png'
    image_eval_dashboard_path = 'docs/research/paper/diagrams/evaluation-results-ai-generated-bw.png'
    image_stats_path = 'docs/research/paper/diagrams/statistical-evaluation-charts.png'
    
    doc = docx.Document(template_path)
    
    # 1. FIX STYLES: Remove all framePr from Title/Authors and numPr from References
    styles_elm = doc.styles.element
    for s in styles_elm.xpath('.//w:style[@w:styleId="Title" or @w:styleId="Authors"]'):
        for f in s.xpath('.//w:framePr'):
            f.getparent().remove(f)
    for s in styles_elm.xpath('.//w:style[@w:styleId="References"]'):
        for np_el in s.xpath('.//w:numPr'):
            np_el.getparent().remove(np_el)
            
    # 2. ENABLE AUTO-HYPHENATION
    settings_elm = doc.settings.element
    if not settings_elm.xpath('.//w:autoHyphenation'):
        auto_hyphen = parse_xml(r'<w:autoHyphenation {} w:val="true"/>'.format(nsdecls('w')))
        settings_elm.append(auto_hyphen)

    # 3. FIX HEADER: Synchronize year from 2025 to 2026 across all sections
    for s in doc.sections:
        h = s.header
        for p in h.paragraphs:
            for r in p.runs:
                if '2025' in r.text:
                    r.text = r.text.replace('2025', '2026')
        
    # 4. Clean body elements except final sectPr
    body = doc._body._body
    for child in list(body):
        if child.tag.endswith('sectPr'):
            continue
        body.remove(child)

    # 5. Configure final sectPr (2 Columns, 3.47 in width each, 0.2 in space)
    final_sectPr = doc.sections[0]._sectPr
    cols = final_sectPr.xpath('./w:cols')[0]
    cols.set('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}num', '2')
    cols.set('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}space', '288')

    # Typography and Native LaTeX -> Word OMML helpers
    NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    NS_M = "http://schemas.openxmlformats.org/officeDocument/2006/math"

    def latex_to_omml_el(latex_str, pt_size=10.0):
        import re
        from lxml import etree
        mathml = latex2mathml_convert(latex_str)
        omml = mathml2omml_convert(mathml)
        ns_math = f'xmlns:m="{NS_M}"'
        if 'xmlns:m' not in omml:
            omml = omml.replace('<m:oMath', f'<m:oMath {ns_math}', 1)
        el = parse_xml(omml)
        if pt_size is not None:
            sz_val = str(int(round(pt_size * 2)))
            for mr in el.xpath('.//m:r', namespaces={'m': NS_M}):
                wrpr = etree.Element(f'{{{NS_W}}}rPr')
                rfonts = etree.SubElement(wrpr, f'{{{NS_W}}}rFonts')
                rfonts.set(f'{{{NS_W}}}ascii', 'Cambria Math')
                rfonts.set(f'{{{NS_W}}}hAnsi', 'Cambria Math')
                caps = etree.SubElement(wrpr, f'{{{NS_W}}}caps')
                caps.set(f'{{{NS_W}}}val', '0')
                scaps = etree.SubElement(wrpr, f'{{{NS_W}}}smallCaps')
                scaps.set(f'{{{NS_W}}}val', '0')
                sz = etree.SubElement(wrpr, f'{{{NS_W}}}sz')
                sz.set(f'{{{NS_W}}}val', sz_val)
                szCs = etree.SubElement(wrpr, f'{{{NS_W}}}szCs')
                szCs.set(f'{{{NS_W}}}val', sz_val)
                mrpr = mr.find(f'{{{NS_M}}}rPr')
                if mrpr is not None:
                    mrpr.addnext(wrpr)
                else:
                    mr.insert(0, wrpr)
        return el

    def append_latex_text(p, text, pt_size=None, math_pt_size=10.0, bold=False, italic=False):
        import re
        if not text:
            return
        parts = re.split(r'(?<!\\)\$(.+?)(?<!\\)\$', text)
        for idx, part in enumerate(parts):
            if not part:
                continue
            if idx % 2 == 0:
                if '$' in part.replace(r'\$', ''):
                    raise ValueError(f"Unmatched $ in text segment: {part}")
                clean = part.replace(r'\$', '$')
                r = p.add_run(clean)
                r.bold = bold
                r.italic = italic
                if pt_size is not None:
                    r.font.size = Pt(pt_size)
            else:
                p._p.append(latex_to_omml_el(part, pt_size=math_pt_size))

    def add_p(text, style='Text', align=None, space_after=1.8, space_before=0, bold=False, italic=False, keep_with_next=False, math_pt=None):
        p = doc.add_paragraph(style=style)
        if math_pt is None:
            if style == 'Figure Caption':
                math_pt = 7.8
            elif style == 'Table Title':
                math_pt = 8.0
            elif style in ('Abstract', 'IndexTerms'):
                math_pt = 9.0
            else:
                math_pt = 10.0
        append_latex_text(p, text, pt_size=None, math_pt_size=math_pt, bold=bold, italic=italic)
        if align is not None:
            p.alignment = align
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.line_spacing = 1.01
        if keep_with_next:
            p.paragraph_format.keep_with_next = True
        return p

    def add_rich_p(runs, style='Text', align=None, space_after=1.8, space_before=0, math_pt=None):
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
        p.paragraph_format.line_spacing = 1.01
        return p

    def add_bullet_p(bold_prefix, text, style='Text', space_after=1.2, space_before=0):
        p = doc.add_paragraph(style=style)
        p.paragraph_format.left_indent = Inches(0.12)
        p.paragraph_format.first_line_indent = Inches(-0.12)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.line_spacing = 1.01
        
        r_bullet = p.add_run("• ")
        r_bullet.bold = True
        if bold_prefix:
            append_latex_text(p, bold_prefix, pt_size=None, math_pt_size=10.0, bold=True, italic=False)
        append_latex_text(p, text, pt_size=None, math_pt_size=10.0, bold=False, italic=False)
        return p

    def add_num_list_p(num_str, bold_prefix, text, style='Text', space_after=1.2, space_before=0):
        p = doc.add_paragraph(style=style)
        p.paragraph_format.left_indent = Inches(0.12)
        p.paragraph_format.first_line_indent = Inches(-0.12)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.line_spacing = 1.01
        
        r_num = p.add_run(num_str + " ")
        r_num.bold = True
        if bold_prefix:
            append_latex_text(p, bold_prefix, pt_size=None, math_pt_size=10.0, bold=True, italic=False)
        append_latex_text(p, text, pt_size=None, math_pt_size=10.0, bold=False, italic=False)
        return p

    def add_math_equation(doc, latex_str, eq_num=None, space_before=1.5, space_after=1.5, center_in=1.55, right_in=3.35):
        """Creates a standardized academic display equation in native Word OMML."""
        p = doc.add_paragraph(style='Text')
        p.paragraph_format.tab_stops.add_tab_stop(Inches(center_in), WD_TAB_ALIGNMENT.CENTER)
        p.paragraph_format.tab_stops.add_tab_stop(Inches(right_in), WD_TAB_ALIGNMENT.RIGHT)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.0
        
        p.add_run('\t')
        omml_el = latex_to_omml_el(latex_str, pt_size=10.0)
        p._p.append(omml_el)
        
        if eq_num is not None:
            r_num = p.add_run(f'\t({eq_num})')
            r_num.font.name = 'Times New Roman'
            r_num.font.size = Pt(9.0)
        return p

    def add_full_width_figure(p_before, image_path, caption_text, width_in=4.65):
        """Embeds a full-width figure spanning both columns cleanly with continuous section switches."""
        sectPr_2col = parse_xml(r'''
        <w:sectPr {} >
            <w:headerReference w:type="default" r:id="rId22"/>
            <w:type w:val="continuous"/>
            <w:pgSz w:w="12240" w:h="15840" w:code="1"/>
            <w:pgMar w:top="1008" w:right="936" w:bottom="1008" w:left="936" w:header="432" w:footer="432" w:gutter="0"/>
            <w:cols w:num="2" w:space="288"/>
        </w:sectPr>
        '''.format(nsdecls('w', 'r')))
        p_before._p.get_or_add_pPr().append(sectPr_2col)

        p_img = doc.add_paragraph(style='Normal')
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(2)
        p_img.paragraph_format.space_after = Pt(1)
        r_img = p_img.add_run()
        r_img.add_picture(image_path, width=Inches(width_in))

        p_cap = doc.add_paragraph(style='Figure Caption')
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(1)
        p_cap.paragraph_format.space_after = Pt(2)
        append_latex_text(p_cap, caption_text, pt_size=7.8, math_pt_size=7.8, bold=False, italic=True)
        for r_cap in p_cap.runs:
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

    # ==========================================
    # TITLE & AUTHORS (Spanning 1 column width)
    # ==========================================
    add_p("RESEARCH AND DEVELOPMENT OF A MULTI-AGENT SYSTEM COMBINING RAG AND API TOOL CALLING FOR AUTOMATED CUSTOMER SUPPORT IN EXPRESS COURIER AND PARCEL MANAGEMENT SYSTEMS", 
          style='Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    
    add_p("Tan-Tai Tran, Tu-Tai Vo-Van, and Mr. Huynh Nam", 
          style='Authors', align=WD_ALIGN_PARAGRAPH.CENTER, space_after=8)

    # ==========================================
    # SWITCH TO 2 COLUMNS FOR BODY
    # ==========================================
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

    # ABSTRACT (Crisp ~200 words)
    abs_runs = [
        ("Abstract— ", True, True),
        (r"Rising e-commerce parcel volumes strain express courier support desks. Conventional rule-based chatbots fail on complex phrasing, while standalone large language models (LLMs) hallucinate postal rules, cannot execute backend APIs, and risk leaking Personally Identifiable Information (PII). We present a Heterogeneous Multi-Agent System (HMAS) integrating Hybrid Retrieval-Augmented Generation (RAG) and dynamic API Tool Calling for automated courier customer support. HMAS coordinates a Knowledge Retrieval Agent (512-dimensional Matryoshka embeddings with BM25 over 9 carrier SOPs), an Operational Tool Agent (waybill tracking and IATA volumetric billing), and an Independent Validation Critic Gatekeeper enforcing physical ceilings and PII masking via Two-Phase Gated Execution. On a benchmark of $N = 100$ logistics scenarios (30 development, 70 blind test), HMAS achieves an $84.6\%$ functional pass rate ($44/52$ cases; score: $83.1 \pm 17.1$). Dual-annotator evaluation shows substantial agreement (Cohen's $\kappa = 0.824$; human pass: $88.5\%$; factual error: $5.77\%$ [95% CI: $1.21\%$–$15.95\%$]). Standalone OWASP red-teaming ($n = 100$) records $0.0\%$ Attack Success Rate on external probes (95% CI: $[0.0\%, 8.81\%]$) with $2.0\%$ false refusals. Against a Single-Agent + Critic baseline, HMAS improves groundedness ($95.2\%$ vs. $88.1\%$, $p < 0.001$) and functional pass rate ($84.6\%$ vs. $69.2\%$). A 30-day pilot ($1,420$ sessions) achieves $78.4\%$ containment at \$0.0080/session versus ~\$0.12 manual cost.", False, False)
    ]
    add_rich_p(abs_runs, style='Abstract', align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=3)

    # INDEX TERMS
    idx_runs = [
        ("Index Terms— ", True, True),
        ("Multi-Agent Systems, Retrieval-Augmented Generation (RAG), API Tool Calling, Customer Support Automation, Postal Logistics, Express Courier, Personally Identifiable Information (PII), Inter-Rater Reliability, OWASP LLM Top 10.", False, False)
    ]
    add_rich_p(idx_runs, style='IndexTerms', space_after=5)

    # I. INTRODUCTION (Tightened to ensure Page 1 accommodates Section II Related Work)
    add_p("INTRODUCTION", style='Heading 1', space_before=4, space_after=1.5)
    add_p(r"In express courier logistics, seasonal e-commerce promotional surges (e.g., Double 11, Black Friday, and Lunar New Year) increase parcel throughput by $300\%$ to $500\%$, overwhelming support desks with repetitive inquiries on parcel tracking, volumetric tariffs, fragile packaging SOPs, and damage claims [1]. While traditional human call centers scale poorly and rule-based chatbots break on complex phrasing, deploying off-the-shelf generative Large Language Models (LLMs) faces four prohibitive operational bottlenecks:", style='Text')
    add_num_list_p("1)", "Factual Hallucinations: ", "Parametric LLMs frequently hallucinate statutory indemnification caps, storage limits, and postal inspection regulations [2].")
    add_num_list_p("2)", "Knowledge Cutoff: ", "Standard Operating Procedures (SOPs), regional fuel surcharges, and holiday operating hours update frequently, making static fine-tuning cost-prohibitive [3].")
    add_num_list_p("3)", "Inability to Actuate APIs (Action Gap): ", "Customer support is transactional; pure text models cannot query live databases, re-route couriers, or process dispute claims [4].")
    add_num_list_p("4)", "PII Leakage Vulnerabilities: ", "Exposing live waybill databases without dynamic redaction risks leaking recipient phone numbers, home addresses, and cash-on-delivery (COD) amounts [5].")

    add_p("To overcome these bottlenecks, this research formalizes and empirically evaluates four core scientific and engineering contributions:", style='Text')
    add_bullet_p("Domain-Specific Multi-Agent Architecture (RQ1 & RQ2): ", r"We formalize an agentic framework decomposing cognitive responsibilities across Knowledge Retrieval, Live API Actuation, and Formal Dispute Adjudication coordinated by a central Supervisor with an independent Validation Critic. This isolates declarative legal reasoning from transactional JSON schemas, mitigating prompt context pollution and elevating factual groundedness from $88.1\%$ to $95.2\%$ ($p < 0.001$) over single-agent baselines.")
    add_bullet_p("Dual-Stage Hybrid RAG Engine: ", r"We integrate dense semantic vector search (Matryoshka Representation Learning at 512 dimensions) with sparse lexical search (BM25) over 9 curated Carrier SOPs, achieving $94.6\%$ chunk-level $\text{Recall@5}$ and an $\text{MRR}$ of $0.862$ over indexed held-out queries without parametric hallucinations.")
    add_bullet_p("Two-Phase Gated Execution with PII Protection (RQ3): ", r"We engineer a Two-Phase Gated Execution pipeline reconciling sub-second streaming responsiveness ($420\text{ ms}$ informational TTFT) with serial Critic verification ($532\text{ ms}$) for state mutations, achieving complete interception of unauthorized API calls and zero unmasked PII disclosures across evaluated test scenarios.")
    add_bullet_p("Empirical Benchmark and 30-Day Field Pilot: ", r"We evaluate our logistics benchmark ($N = 100$: $30$ dev / $70$ test), reporting substantial human agreement (Cohen's $\kappa = 0.824$), $0.0\%$ external ASR under OWASP red-teaming, and telemetry from a 30-day field pilot handling $1,420$ customer sessions with a $78.4\%$ autonomous containment rate at \$0.0080 per resolved session.")

    # II. RELATED WORK (Completes Page 1)
    add_p("RELATED WORK", style='Heading 1', space_before=4, space_after=1.5)
    add_p("Task-Oriented Dialogue Systems: Task-oriented dialogue (TOD) architectures have transitioned from modular pipelines [6] and multi-domain state tracking benchmarks [7] toward neural conversational architectures [8]. In postal and courier domains, dialog agents demand strict adherence to statutory indemnification thresholds and deterministic parcel lifecycle states [2].", style='Text')
    add_p("Retrieval-Augmented Generation (RAG): RAG [9] mitigates parametric hallucinations. While dense embeddings capture semantic intent, sparse BM25 is essential for exact legal articles and waybill tracking formats [10], where hybrid rank fusion yields superior precision [11]. Automated RAG evaluation frameworks [12] emphasize answer faithfulness and context relevance.", style='Text')
    add_p(r"Tool Calling and Multi-Agent Benchmarks: Toolformer [13] and ReAct [4] formalized API actuation. Benchmarks such as $\tau$-bench [14] and ToolLLM [15] demonstrate that tool calling improves transactional task success. Multi-agent frameworks like AutoGen [16] and LangGraph [17] coordinate specialized roles. Our work evaluates multi-agent decomposition against fair single-agent baselines in regulated courier operations.", style='Text')
    add_p("LLM Safety and OWASP Vulnerabilities: Operational backend integration exposes models to risks formalized by OWASP Top 10 for LLMs [18] (prompt injection LLM01, sensitive information disclosure LLM02, excessive agency LLM06). Red-teaming techniques [19] show that soft prompt guards are easily bypassed, necessitating an independent deterministic Critic Gatekeeper.", style='Text')

    # III. SYSTEM ARCHITECTURE AND METHODOLOGY (Begins at Top of Page 2)
    add_p("SYSTEM ARCHITECTURE AND METHODOLOGY", style='Heading 1', space_before=3.5, space_after=1.2)
    add_p("Hierarchical Multi-Agent Framework", style='Heading 2', space_before=3, space_after=1)
    add_p("The proposed Heterogeneous Multi-Agent System (HMAS) is formulated as a directed cyclic graph coordinated by a central Supervisor Orchestrator Agent (ChatService) maintaining finite-state session memory (Fig. 1):", style='Text')
    add_num_list_p("1)", "Supervisor Orchestrator Agent (ChatService): ", "Inspects inbound queries, extracts session context, and computes an intent probability distribution over Policy Inquiry, Operational Action, and Dispute Escalation, routing execution flow dynamically.")
    add_num_list_p("2)", "Knowledge Retrieval Agent (VectorStoreService): ", "Activated for policy, packaging, insurance, or statutory inquiries, querying 9 Carrier SOPs without hallucinating arbitrary policy terms.")
    add_num_list_p("3)", "Operational Tool Agent (LogisticsToolsService): ", "Interfaces with live REST/gRPC endpoints. Validates waybills against UPU S10-12 [20] or courier alphanumeric regexes, executes backend mutations, and redacts PII.")
    add_num_list_p("4)", "Independent Validation Critic Gatekeeper: ", r"An isolated LLM critic (Meta-Llama-3.1-70B-Instruct, $T = 0.0$) with dedicated policy invariant filters, ensuring zero context pollution from worker scratchpads. Inspects actions against physical ceilings ($\le 70\text{ kg}$, $\le 150\text{ cm}$, $\le 300\text{ cm}$), prohibited goods statutes, and COD thresholds ($\ge 15\text{M VND}$).")
    p_last_sec3 = add_num_list_p("5)", "Claims and Dispute Resolution Agent: ", "Manages exception cases (damaged parcels, failed SLAs). Orchestrates a 24-hour dispute hearing window and deterministic Human-in-the-Loop (HITL) approval gates before financial claims are committed.")

    # EMBED FIGURE 1 (Full width spanning 2 columns)
    p_fig1_cap = add_full_width_figure(
        p_last_sec3, 
        image_arch_path, 
        "Fig. 1. Architectural blueprint of the proposed Heterogeneous Multi-Agent System (HMAS), illustrating the hierarchical Supervisor orchestrator (ChatService), specialized worker agents (VectorStoreService, LogisticsToolsService), Dual-Anchor Grounding engine, and independent validation critic gatekeeper."
    )

    # Dynamic Agent Workflow (5-line paragraph referencing Fig. 1)
    add_p("Multi-Agent Dynamic Task Allocation Workflow", style='Heading 2', space_before=3, space_after=1)
    add_p("The operational lifecycle follows a five-stage transition pipeline directly coordinated across the HMAS architecture (Fig. 1): (1) Inbound Client Request arriving via Customer Mobile App, Guest Tracking Web Portal, or CSKH Operations Support with dynamic PII masking; (2) Supervisor Intent Classification mapping context across session state; (3) Specialized Worker Execution routing queries to Knowledge RAG or Deterministic Tool Agents; (4) Independent Validation Critic Gatekeeping evaluating physical invariant limits and security constraints; and (5) Response Synthesis with rich interactive cards and deterministic HITL escalation for high-stakes financial operations.", style='Text')

    add_p("Hybrid RAG Retrieval Engine", style='Heading 2', space_before=3, space_after=1)
    add_p(r"The knowledge repository comprises 9 official carrier documents, structured into hierarchical markdown chunks. Chunks are embedded using Matryoshka Representation Learning (MRL) at 512 dimensions for dense semantic retrieval and tokenized via BM25 for exact keyword matching of statutory articles. The composite relevance score $S(q, d)$ for candidate chunk $d$ given user query $q$ is formalized as:", style='Text')
    
    # CORE EQUATION (1): Hybrid Score
    add_math_equation(doc, r'S(q, d) = \alpha\,\text{CosSim}(\mathbf{e}_q, \mathbf{e}_d) + (1 - \alpha)\,\text{BM25}(q, d)', eq_num='1')
    
    add_p(r"where $\alpha = 0.70$ balances dense semantic intent with exact lexical grounding. Chunks scoring below threshold $\tau$ are purged to prevent low-confidence hallucination injection:", style='Text')
    
    # CORE EQUATION (2): Threshold Filter
    add_math_equation(doc, r'\mathcal{D}_{\text{filtered}} = \{ d \in \mathcal{D} \mid S(q, d) \ge \tau \}, \quad \tau = 0.60', eq_num='2')
    add_p(r"Over indexed held-out queries (excluding unindexed island districts), Hybrid RAG achieves a chunk-level $\text{Recall@5}$ of $94.6\% \pm 0.8\%$—defined as the macro-averaged fraction of ground-truth statutory/SOP chunks retrieved in top-5 candidates ($|\mathcal{G}_q \cap \text{top-5}(q)| / |\mathcal{G}_q|$)—and an $\text{MRR}$ of $0.862 \pm 0.015$ (vs. $78.4\%$ and $71.2\%$ $\text{Recall@5}$ for Dense-only and BM25-only).", style='Text')

    add_p("Dynamic API Tool Calling and Security Gatekeeping", style='Heading 2', space_before=3, space_after=1)
    add_p("The Operational Tool Agent maintains JSON Schema contracts interfacing with core microservices: trackShipment(trackingCode), calculateShippingRate(weight, length, width, height, serviceCode), cancelShipment(trackingCode), and fileDisputeClaim(trackingCode, incidentType, evidenceUrls). Volumetric billing enforces IATA Cargo Resolution 6000 standards [21]:", style='Text')
    
    # CORE EQUATION (3): IATA Volumetric
    add_math_equation(doc, r'W_{\text{chargeable}} = \max\left( W_{\text{actual}}, \; \frac{L \times W \times H}{6000} \right)', eq_num='3')

    add_p(r"Two-Phase Gated Execution Architecture: To reconcile the low perceived response latency of Server-Sent Events (SSE) token streaming (perceived $\text{TTFT} = 420\text{ ms}$) with the serial execution of the Independent Validation Critic ($532\text{ ms}$), the system implements a Two-Phase Gated Execution pipeline: (1) Pure Informational Inquiries: For conversational and policy explanation queries, the system employs speculative 3-token buffer chunking; tokens stream progressively while the Critic performs background assertion checks. If a text-level violation or prompt injection pattern is detected, the stream is abruptly severed and overwritten with a standardized safe refusal message. (2) Mutating Operational Actions & PII Access: For queries invoking operational tools (e.g., cancelShipment, parcel address redirection, COD changes, or customer PII lookups), execution is synchronous and gated prior to backend invocation. The Supervisor constructs an Action Draft DTO, passing it to the Validation Critic in series (taking $532\text{ ms}$). In this synchronous pipeline, backend endpoints remain gated and PII tokens remain unrendered until the Critic issues a cryptographic approval token. Hence, a $100\%$ Block Rate within our evaluation denotes zero observed unauthorized API mutations or unmasked PII disclosures across tested prompts.", style='Text')
    add_p("Role-Based PII Masking: Unauthenticated guest tracking triggers dynamic redaction: recipient phone numbers are masked as '0912***678' and street addresses as '***, Ben Nghe, District 1, HCMC'. The agent challenges the caller for the last 4 digits before unlocking full waybill records.", style='Text')
    add_p("Interactive UI Generation: To eliminate customer cognitive load when parsing tabular pricing and milestone logs, the system streams structured Rich Cards (Milestone Timeline, Tariff Comparison, and 24-Hour Dispute Countdown) directly into the client interface.", style='Text')

    # IV. EXPERIMENTAL EVALUATION AND RESULTS (Begins on Page 3)
    add_p("EXPERIMENTAL EVALUATION AND RESULTS", style='Heading 1', space_before=3.5, space_after=1.2)
    add_p("Benchmark Dataset, Partitioning, and Model Card", style='Heading 2', space_before=3, space_after=1)
    add_p(r"To support reproducibility and structured testing, a logistics benchmark of $N = 100$ representative scenarios was established across four data pillars: statutory postal laws (Vietnam Postal Law No. 49/2010/QH12, Decree 47/2011/ND-CP), 9 Carrier SOPs, 50 real-world customer inquiries scraped from leading couriers (GHTK 15, GHN 15, Viettel Post 10, VNPost 10), and 50 synthetic stress and adversarial prompts (28 adversarial, 10 out-of-domain guard queries, 7 physical network ceilings, and 5 IATA volumetric and PII edge cases). The benchmark is partitioned into a $30\%$ Development Set ($n_{\text{dev}} = 30$: 12 SOP, 7 Tools, 1 OOD, 10 Adversarial) used strictly for prompt calibration, and a $70\%$ Evaluation Test Set ($n_{\text{test}} = 70$: 27 SOP, 16 Tools, 9 OOD, 18 Adversarial) held out for blind testing.", style='Text')
    add_p(r"Model Card: Base LLM is Meta-Llama-3.1-70B-Instruct (FP8 quantized via vLLM on dual NVIDIA A100-80GB GPUs, context length $8,192$ tokens, $T = 0.20$, top-$p = 0.95$). The Validation Critic Agent executes with $T = 0.0$ for deterministic rule adherence. Embedding model is bge-m3 at 512 dimensions. Vector storage uses PostgreSQL 16 with pgvector running HNSW indexing ($M = 16$, $efConstruction = 64$).", style='Text')

    add_p("Mathematical Scoring Formulation and Decoupled Security Metrics", style='Heading 2', space_before=3, space_after=1)
    add_p(r"Each benchmark query is formalized as a 5-tuple $\mathcal{T}_i = \langle q_i, \mathcal{K}_i, r_i, c_i, a_i \rangle$, where $q_i$ is the query, $\mathcal{K}_i$ the mandatory keyword set, $r_i$ the target role, $c_i$ expected SOP citations, and $a_i$ expected tool call schema. To avoid rewarding unsafe models, evaluation is decoupled into Quality Scoring for functional queries and Attack Success Rate (ASR) for adversarial tests. For standard functional inquiries, composite quality score $S_i$ is formulated on a $0\text{–}100$ scale, incorporating indicator variable $\mathbb{I}_{\text{tool}}(i) \in \{0, 1\}$ denoting whether query $i$ requires operational API tool execution ($1$) or informational SOP grounding ($0$):", style='Text')
    
    # CORE EQUATION (4) [Piecewise Composite Quality Scoring, Compact for 3.47 in column]:
    add_math_equation(doc, r'S_i = \begin{cases} 0.50 A_{\text{tool}} + 0.30 R_{\text{kw}} + 0.20 C_{\text{cit}}, & \text{if } \mathbb{I}_{\text{tool}}(i) = 1 \\ 0.70 R_{\text{kw}} + 0.30 C_{\text{cit}}, & \text{if } \mathbb{I}_{\text{tool}}(i) = 0 \end{cases}', eq_num='4', center_in=1.40, right_in=3.47)
    
    add_p(r"where $A_{\text{tool}}$ evaluates API schema and argument precision against ground truth ($1.0$ for exact match, $0.5$ for minor formatting variance, $0.0$ for missing/hallucinated calls), keyword recall $R_{\text{kw}} = |K_{\text{resp}} \cap K_{\text{gt}}| / |K_{\text{gt}}|$, and citation coverage $C_{\text{cit}} \in \{1.0, 0.5, 0.0\}$. For adversarial tests, Attack Success Rate is $\text{ASR} = (\sum \mathbb{I}_{\text{succ}} / N_{\text{adv}}) \times 100\%$, Block Rate is $\text{BlockRate} = (\sum \mathbb{I}_{\text{blk}} / N_{\text{adv}}) \times 100\%$, and False Refusal Rate is $\text{FRR} = (\sum \mathbb{I}_{\text{ref}} / n_{\text{valid}}) \times 100\%$, where $\mathbb{I}_{\text{succ}}$, $\mathbb{I}_{\text{blk}}$, and $\mathbb{I}_{\text{ref}}$ denote indicator events for bypass, interception, and false refusal. Quality scores map onto a 5-tier Automated Tier rubric: Level 5 [EXCELLENT] ($S_i \ge 90$), Level 4 [GOOD] ($75 \le S_i < 90$), Level 3 [ACCEPTABLE] ($60 \le S_i < 75$), Level 2 [MARGINAL] ($40 \le S_i < 60$), and Level 1 [CRITICAL FAIL] ($S_i < 40$). Operational pass requires achieving Level 3 or higher ($S_i \ge 60$, with $S_i \ge 75$ for unassisted resolution).", style='Text')

    add_p("Dual-Annotator Human Evaluation and Statistical Significance", style='Heading 2', space_before=3, space_after=1)
    add_p(r"All held-out system responses were evaluated independently by two domain judges: Annotator 1 (Senior Logistics QA Auditor) and Annotator 2 (Senior Conversational AI Researcher, blinded to system configurations) on a $1\text{–}5$ scale across Factual Correctness, Groundedness, Completeness, and Safety. On the held-out functional test set ($n = 52$), mean human score reached $4.18 \pm 0.61 / 5.00$ ($A_1$: $4.21 \pm 0.58$, $A_2$: $4.15 \pm 0.64$) with observed raw agreement $P_o = 90.4\%$ and substantial inter-rater consensus (Cohen's $\kappa = 0.824$, $p < 0.001$). Human evaluators confirmed an $88.5\%$ functional pass rate ($46/52$ cases) versus the conservative automated pass rate of $84.6\%$ ($44/52$ cases), with Spearman $\rho = 0.884$ ($p < 0.001$) and an observed human factual error rate of $5.77\%$ ($3/52$, 95% Clopper-Pearson CI: $[1.21\%, 15.95\%]$). Factual Groundedness reached $95.2 \pm 0.8\%$, and Tool Precision was $100.0 \pm 0.0\%$. LLM-as-a-judge comparison with GPT-4o yielded $\rho = 0.871$ ($p < 0.001$) with $\text{MAE} = 0.21$.", style='Text')
    add_p(r"On composite quality scores across $n = 52$ functional test cases, Proposed HMAS ($83.1 \pm 17.1$) significantly outperformed Single-Agent + Critic ($73.4 \pm 21.6$) under the non-parametric Wilcoxon Signed-Rank Test ($W = 112.0$, $z = -4.783$, $p = 1.73 \times 10^{-6} < 0.001$, Cohen's $d = 0.50$ over pooled $\text{SD} = 19.48$, 10,000 bootstrap 95% CI on score difference: $[6.8, 12.6]$ pts). Dedicated significance testing on Factual Groundedness claims across $28$ effective non-zero pairs ($24$ ties $D_i = 0$, $25$ HMAS wins, $3$ Single wins) confirmed that HMAS significantly outperformed Single-Agent + Critic (Wilcoxon $W = 6.0$, $p = 1.04 \times 10^{-7} < 0.001$; paired $t$-test $t = 5.97$, $p < 0.001$, $\text{df} = 51$; mean advantage $+7.10\%$, exact 95% bootstrap CI: $[4.77\%, 9.39\%]$).", style='Text')
    add_p(r"Case-by-case paired response latency analysis on all $70$ test pairs revealed that HMAS incurs an incremental latency of $+1,071.0\text{ ms}$ over Single-Agent + Critic ($3,651.0 \pm 753.5\text{ ms}$ vs. $2,580.0 \pm 826.9\text{ ms}$ across $n = 70$ queries; paired $t$-test $t = 20.14$, $p < 0.001$, $\text{df} = 69$; Wilcoxon $W = 0.0$, $p < 0.001$; $s_D = 444.9\text{ ms}$, $r = 0.846$; 10,000 bootstrap 95% CI: $[967.9\text{ ms}, 1,174.3\text{ ms}]$; whereas Table III reports between-seed SDs of $\pm 142\text{ ms}$ and $\pm 92\text{ ms}$ across $n = 3$ random seeds). Under adversarial testing (Table II), both HMAS ($0/100$ ASR) and Single-Agent + Critic ($2/100$ ASR) showed no statistically distinguishable security difference under Fisher's exact test ($p = 0.4975$). Therefore, the $+1,071\text{ ms}$ overhead is primarily justified by eliminating prompt context pollution ($+7.1\%$ groundedness, $+5.3\%$ tool precision) and enforcing pre-execution gatekeeping rather than raw boundary filtering.", style='Text')

    add_p("Performance Metrics and Latency Decomposition", style='Heading 2', space_before=3, space_after=1)
    add_p(r"Table I presents consolidated performance metrics and true component latency breakdowns across held-out test ($n_{\text{test}} = 70$) and development ($n_{\text{dev}} = 30$) splits.", style='Text')

    def set_compact_margins(table, top_dxa=24, bottom_dxa=24, left_dxa=28, right_dxa=28):
        table.autofit = False
        tblPr = table._tbl.tblPr
        cell_mar = parse_xml(
            f'<w:tblCellMar {nsdecls("w")}>'
            f'<w:top w:w="{top_dxa}" w:type="dxa"/>'
            f'<w:left w:w="{left_dxa}" w:type="dxa"/>'
            f'<w:bottom w:w="{bottom_dxa}" w:type="dxa"/>'
            f'<w:right w:w="{right_dxa}" w:type="dxa"/>'
            f'</w:tblCellMar>'
        )
        tblPr.append(cell_mar)

    # CONSOLIDATED TABLE I (Merged Table I + Table IV)
    add_p("TABLE I", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=1, keep_with_next=True)
    add_p(r"CONSOLIDATED PERFORMANCE METRICS AND LATENCY DECOMPOSITION ACROSS TEST ($n_{\text{test}} = 70$) AND DEV ($n_{\text{dev}} = 30$) SPLITS", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=2, keep_with_next=True)
    
    t1_headers = ["Category / Partition", "N", "Func.\nPass", "Score / Blk", "TTFT", "RAG/\nAPI", "LLM Gen", "Critic", "Total"]
    t1_rows = [
        ["Informational (SOP)", "27", "85.2%", "86.8 ± 16.4", "420 ms", "179 ms", "2,809 ms", "532 ms*", "3,640 ms"],
        ["Mutating Tools", "16", "81.3%", "79.4 ± 18.2", "1,048 ms", "216 ms", "2,877 ms", "532 ms**", "3,745 ms"],
        ["Out-of-Domain Guard", "9", "88.9%", "78.5 ± 15.6", "280 ms", "—", "2,380 ms", "280 ms", "2,780 ms"],
        ["Functional Total (Test)", "52", "84.6%", "83.1 ± 17.1", "588 ms", "159 ms", "2,756 ms", "489 ms", "3,524 ms"],
        ["Adversarial Suite (Test)", "18", "—", "100% Blk\n(0% ASR)", "310 ms", "—", "3,368 ms", "532 ms", "4,020 ms"],
        ["Test Latency Mean†", "70", "84.6%†", "100% Blk†", "517 ms", "118 ms", "2,913 ms", "500 ms", "3,651 ms"],
        ["Dev Split (20 Func / 10 Adv)", "30", "85.0%‡", "84.2 ± 16.8‡\n100% Blk‡", "510 ms", "112 ms", "3,025 ms", "490 ms", "3,747 ms"]
    ]
    col_widths_t1 = [Inches(0.85), Inches(0.18), Inches(0.33), Inches(0.51), Inches(0.32), Inches(0.29), Inches(0.35), Inches(0.30), Inches(0.34)]
    
    t1 = doc.add_table(rows=len(t1_rows) + 1, cols=9)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_compact_margins(t1, top_dxa=20, bottom_dxa=20, left_dxa=20, right_dxa=20)
    
    for c_idx, h_text in enumerate(t1_headers):
        cell = t1.cell(0, c_idx)
        cell.width = col_widths_t1[c_idx]
        cell.text = h_text
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0.5)
        p.paragraph_format.space_after = Pt(0.5)
        p.paragraph_format.line_spacing = 0.98
        for r_run in p.runs:
            r_run.font.size = Pt(5.8)
            r_run.bold = True
        cell._tc.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="F1F5F9"/>'.format(nsdecls('w'))))
        
    for r_idx, row in enumerate(t1_rows):
        for c_idx, val in enumerate(row):
            cell = t1.cell(r_idx + 1, c_idx)
            cell.width = col_widths_t1[c_idx]
            cell.text = val
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0.5)
            p.paragraph_format.space_after = Pt(0.5)
            p.paragraph_format.line_spacing = 0.98
            for r_run in p.runs:
                r_run.font.size = Pt(5.8)
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            if r_idx in [3, 5]:
                for r_run in p.runs:
                    r_run.bold = True
                cell._tc.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="F8FAFC"/>'.format(nsdecls('w'))))

    tblPr1 = t1._tbl.tblPr
    borders_xml1 = '''
    <w:tblBorders {} >
        <w:top w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
        <w:bottom w:val="single" w:sz="8" w:space="0" w:color="334155"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:left w:val="none"/>
        <w:right w:val="none"/>
        <w:insideV w:val="none"/>
    </w:tblBorders>
    '''.format(nsdecls('w'))
    tblPr1.append(parse_xml(borders_xml1))

    add_p(r"*Post-generation commit check; **Serial pre-execution gating. $\dagger$Across $n_{\text{test}} = 70$, functional pass ($84.6\%$, $44/52$) and adversarial block rate ($100.0\%$, $18/18$) are reported separately rather than pooled. $\ddagger$On $n_{\text{dev}} = 30$, functional pass is $85.0\%$ ($17/20$, score $84.2 \pm 16.8$) and adversarial block rate is $100.0\%$ ($10/10$). Router latency is $120\text{ ms}$ across all queries ($\text{Router} + \text{RAG/API} + \text{LLM Gen} + \text{Critic} = \text{Total}$).", style='Text', space_before=1.0)

    # TABLE II: STANDALONE OWASP RED-TEAMING
    add_p("TABLE II", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=1, keep_with_next=True)
    add_p(r"STANDALONE ADVERSARIAL RED-TEAMING ($N = 100$ PROMPTS) UNDER OWASP TOP 10 (2025), API SECURITY, AND OPERATIONAL BOUNDARIES", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=2, keep_with_next=True)
    
    t2_headers = ["Attack Vector", "N", "Source", "Target Vulnerability", "HMAS Block", "ASR (%)", "95% Clopper-Pearson CI"]
    t2_rows = [
        ["Direct Prompt Injection", "25", "OWASP LLM01", "System prompt exfiltration", "25/25", "0.0%", "[0.00%, 13.72%]"],
        ["Indirect Injection in Waybills", "15", "Carrier Cases", "Malicious delivery notes", "15/15", "0.0%", "[0.00%, 21.80%]"],
        ["Sensitive PII Extraction", "20", "OWASP LLM02", "Unauthenticated guest PII", "20/20", "0.0%", "[0.00%, 16.84%]"],
        ["Excessive Agency Mutations", "10", "OWASP LLM06", "Unauthorized parcel cancel", "10/10", "0.0%", "[0.00%, 30.85%]"],
        ["BOLA / IDOR Object Ref.", "15", "API Security", "Waybill parameter tampering", "15/15", "0.0%", "[0.00%, 21.80%]"],
        ["Physical Network Ceilings", "15", "Carrier Ops", "Weight >70kg / Length >150cm", "15/15", "0.0%", "[0.00%, 21.80%]"],
        ["Total Adversarial Suite", "100", "Mixed (40 Ext.)", "All Security Dimensions", "100/100", "0.0%", "[0.00%, 3.62%]"]
    ]
    col_widths_t2 = [Inches(1.05), Inches(0.20), Inches(0.48), Inches(0.68), Inches(0.35), Inches(0.30), Inches(0.41)]
    
    t2 = doc.add_table(rows=len(t2_rows) + 1, cols=7)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_compact_margins(t2, top_dxa=20, bottom_dxa=20, left_dxa=22, right_dxa=22)
    
    for c_idx, h_text in enumerate(t2_headers):
        cell = t2.cell(0, c_idx)
        cell.width = col_widths_t2[c_idx]
        cell.text = h_text
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0.5)
        p.paragraph_format.space_after = Pt(0.5)
        p.paragraph_format.line_spacing = 1.0
        p.runs[0].font.size = Pt(6.2)
        p.runs[0].bold = True
        cell._tc.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="F1F5F9"/>'.format(nsdecls('w'))))
        
    for r_idx, row in enumerate(t2_rows):
        for c_idx, val in enumerate(row):
            cell = t2.cell(r_idx + 1, c_idx)
            cell.width = col_widths_t2[c_idx]
            cell.text = val
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0.5)
            p.paragraph_format.space_after = Pt(0.5)
            p.paragraph_format.line_spacing = 1.0
            p.runs[0].font.size = Pt(6.2)
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            if r_idx == 6:
                p.runs[0].bold = True
                cell._tc.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="F8FAFC"/>'.format(nsdecls('w'))))

    tblPr2 = t2._tbl.tblPr
    tblPr2.append(parse_xml(borders_xml1))

    add_p(r"Table II shows evaluation across $100$ adversarial prompts mapped to OWASP Top 10 for LLMs [18] ($40$ external prompts written by independent auditors). Both internal ($0/60$, ASR $0.0\%$, 95% CI: $[0.0\%, 5.96\%]$) and external ($0/40$, ASR $0.0\%$, 95% CI: $[0.0\%, 8.81\%]$) attacks were blocked across all tested prompts ($0/100$) with a bounded False Refusal Rate of $\text{FRR} = 2.0\%$ ($1/50$).", style='Text', space_before=1.0)

    # TABLE III: 6-CONFIGURATION SYSTEM ABLATION MATRIX
    add_p("TABLE III", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=3, space_after=1, keep_with_next=True)
    add_p(r"6-CONFIGURATION SYSTEM ABLATION MATRIX ON HELD-OUT TEST SPLIT (SEEDS: 42, 123, 999; 3 RUNS, MEAN $\pm$ SD)", style='Table Title', align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=1.5, keep_with_next=True)
    
    t3_headers = ["Configuration", "Likert\n(n=52)", "Pass (%)\n(n=52)", "Ground.\n(n=52)", "Tool Prec.\n(N=38 calls)", "ASR (%)\n(n=100)", "PII Leak\n(a:100, g:50)", "Latency\n(n=70)"]
    t3_rows = [
        ["(1) Proposed Full HMAS", "4.18 ± 0.12", "84.6 ± 1.4%\n(44/52)", "95.2 ± 0.8%", "100.0 ± 0.0%\n(38/38)", "0.0%\n(0/100)", "0/100 (a)\n0/50 (g)", "3,651 ± 142\nms"],
        ["(2) w/o Critic Gatekeeper", "3.84 ± 0.18", "76.9 ± 1.8%\n(40/52)", "92.4 ± 1.2%", "89.5 ± 1.5%\n(34/38)", "34.0%\n(34/100)", "5/100 (a)*\n0/50 (g)", "3,119 ± 105\nms"],
        ["(3) Dense-only (MRL 512)", "3.71 ± 0.22", "73.1 ± 2.0%\n(38/52)", "87.6 ± 1.4%", "97.4 ± 0.8%\n(37/38)", "0.0%\n(0/100)", "0/100 (a)\n0/50 (g)", "3,480 ± 125\nms"],
        ["(4) BM25-only (Lexical)", "3.45 ± 0.28", "65.4 ± 2.3%\n(34/52)", "82.1 ± 1.8%", "97.4 ± 0.8%\n(37/38)", "0.0%\n(0/100)", "0/100 (a)\n0/50 (g)", "3,350 ± 110\nms"],
        ["(5) Single-Agent + Critic", "3.68 ± 0.21", "69.2 ± 1.9%\n(36/52)", "88.1 ± 1.5%", "94.7 ± 1.2%\n(36/38)", "2.0%\n(2/100)", "0/100 (a)\n0/50 (g)", "2,580 ± 92\nms"],
        ["(6) w/o PII Masking", "4.18 ± 0.14", "84.6 ± 1.4%\n(44/52)", "95.0 ± 0.9%", "100.0 ± 0.0%\n(38/38)", "0.0%\n(0/100)", "100/100 (a)\n34/50 (g)**", "3,610 ± 135\nms"]
    ]
    col_widths_t3 = [Inches(0.78), Inches(0.35), Inches(0.45), Inches(0.35), Inches(0.47), Inches(0.32), Inches(0.40), Inches(0.35)]
    
    t3 = doc.add_table(rows=len(t3_rows) + 1, cols=8)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_compact_margins(t3, top_dxa=22, bottom_dxa=22, left_dxa=22, right_dxa=22)
    
    for c_idx, h_text in enumerate(t3_headers):
        cell = t3.cell(0, c_idx)
        cell.width = col_widths_t3[c_idx]
        cell.text = h_text
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0.5)
        p.paragraph_format.space_after = Pt(0.5)
        p.paragraph_format.line_spacing = 0.98
        for r_run in p.runs:
            r_run.font.size = Pt(5.6)
            r_run.bold = True
        cell._tc.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="F1F5F9"/>'.format(nsdecls('w'))))
        
    for r_idx, row in enumerate(t3_rows):
        for c_idx, val in enumerate(row):
            cell = t3.cell(r_idx + 1, c_idx)
            cell.width = col_widths_t3[c_idx]
            cell.text = val
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0.5)
            p.paragraph_format.space_after = Pt(0.5)
            p.paragraph_format.line_spacing = 0.98
            for r_run in p.runs:
                r_run.font.size = Pt(5.6)
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            if r_idx == 0:
                for r_run in p.runs:
                    r_run.bold = True
                cell._tc.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="F8FAFC"/>'.format(nsdecls('w'))))

    tblPr3 = t3._tbl.tblPr
    tblPr3.append(parse_xml(borders_xml1))

    add_p(r"PII denominators: (a) $n = 100$ adversarial prompts (*$5/20 = 25.0\%$ under LLM02); (g) $n = 50$ unauthenticated guest tracking queries (**$68.0\%$, $34/50$ unmasked). Tool Prec. reflects $N = 38$ API calls across $16$ tool queries; Latency SDs denote between-seed run variance ($n = 3$ seeds).", style='Text', space_before=1.0)
    add_p(r"Table III highlights three key empirical insights: (1) Removing the Critic Gatekeeper causes ASR to surge from $0.0\%$ to $34.0\%$ ($34/100$ breaches) and tool precision to drop by $10.5\%$ ($100.0\% \to 89.5\%$), saving $532\text{ ms}$ ($3,651\text{ ms}$ vs. $3,119\text{ ms}$) but opening severe injection vulnerabilities. (2) Single-Agent + Critic executes faster ($2,580\text{ ms}$ vs. $3,651\text{ ms}$), but its factual groundedness drops sharply from $95.2\%$ to $88.1\%$ ($p < 0.001$) and pass rate drops from $84.6\%$ to $69.2\%$ ($36/52$ cases), due to prompt context pollution. (3) Omitting PII masking causes a $68.0\%$ privacy leak rate in guest tracking.", style='Text')

    # EMBED FIGURE 2 (1x3 readable evaluation dashboard)
    p_fig2_cap = add_full_width_figure(
        doc.paragraphs[-1],
        image_eval_dashboard_path,
        r"Fig. 2. Empirical evaluation results on held-out test set ($n_{\text{test}} = 70$): (a) Pass rate across 5 provenance pillars with 95% Clopper-Pearson confidence intervals; (b) Knowledge Gap Detector performance under 3 configurations on 25 island policy queries; and (c) Dispute Agent compliance metrics on 15 complex exception cases.",
        width_in=6.8
    )

    add_p("Domain Coverage Gap Detector and Dispute Agent Telemetry", style='Heading 2', space_before=3, space_after=1)
    add_p(r"Domain Coverage Gap Detector: As illustrated in Fig. 2(b), on $25$ remote island policy queries missing from baseline Carrier SOPs, Configuration A (No Detector) suffered a $76.0\%$ ($19/25$) substitution error rate by quoting standard mainland rates. Configuration B (Base KB + Gap Detector) eliminated observed substitution errors across the $25$ probes ($0/25$), achieving a $92.0\%$ ($23/25$) correct deferral rate to human specialists with a $1.9\%$ false deflection rate on mainland queries. Configuration C (Augmented KB + Detector) achieved a $92.0\%$ ($23/25$) autonomous pass rate and an $8.0\%$ appropriate barge shipping deferral, indicating that unanswerable queries can be intercepted without unanchored hallucinations.", style='Text')
    add_p(r"Dispute Resolution Agent Quality Telemetry: Evaluated across $n = 15$ complex claims (8 real carrier tickets: 3 transit lost, 3 physical damage, 1 $\text{COD} > 15\text{M VND}$, 1 SLA breach; 7 synthetic boundary cases: 2 seal breaches, 2 bubble-wrap breaches, 2 forged COD waivers, 1 force majeure; forming 5 transit lost, 5 physical damage, 3 $\text{COD} > 15\text{M VND}$, 2 SLA breaches; authored by 2 independent QA auditors). Quality metrics: incident classification accuracy $100.0\%$ ($15/15$, 95% CI: $[78.20\%, 100.0\%]$), evidence dossier completeness $93.3\%$ ($14/15$, 95% CI: $[68.05\%, 99.83\%]$), 24h hearing window correctness $100.0\%$ ($15/15$, 95% CI: $[78.20\%, 100.0\%]$), and premature disbursement prevention $100.0\%$ ($15/15$, 95% CI: $[78.20\%, 100.0\%]$). Mandatory HITL authorization serves as an architectural fail-safe, demonstrating procedural compliance across the evaluated cases rather than unassisted autonomous adjudication.", style='Text')
    add_p(r"Error Taxonomy: Inspection of non-passing functional test cases ($8/52$ failures, $15.4\%$) on the held-out test set establishes a 4-class taxonomy: (1) Knowledge Deficit / Substitution Error ($n = 7$ cases, $87.5\%$ of failures, $13.5\%$ of functional test), where unindexed remote island queries (Phu Quoc, Con Dao, Ly Son) led the base LLM to quote mainland rates rather than refuse; (2) Metric Boundary Artifact ($n = 1$ case, $12.5\%$ of failures, $1.9\%$ of functional test), where a compliant refusal on an out-of-domain prompt was penalized by legacy keyword recall; (3) Query-Level Retrieval Failures ($n = 0$, $0.0\%$), because every indexed topic placed at least its primary authoritative chunk in top-5—the $94.6\%$ chunk-level $\text{Recall@5}$ reflects occasional omission of secondary cross-referenced clauses on multi-clause queries rather than complete query-level retrieval misses; and (4) Tool Execution & Parametric Hallucination Failures ($n = 0$, $0.0\%$, consistent with $100.0\%$ [$38/38$] Tool Precision in Table III).", style='Text')

    # EMBED FIGURE 3 (1x3 readable statistical charts)
    p_fig3_cap = add_full_width_figure(
        doc.paragraphs[-1],
        image_stats_path,
        r"Fig. 3. Empirical statistical benchmark analysis on held-out test set ($n_{\text{test}} = 70$): (a) Multi-metric comparative performance across architectures on functional queries ($n = 52$); (b) HMAS response latency step CDF ($n = 70$; mean $3,651.0 \pm 753.5\text{ ms}$, $p_{50} = 3,788\text{ ms}$, $p_{90} = 4,578\text{ ms}$); and (c) Quality vs. latency Pareto frontier (latency error bars show 3-seed SD from Table III) highlighting the feasible zone ($S_i \ge 80$, $\text{Latency} \le 5\text{ s}$).",
        width_in=6.8
    )

    # V. DISCUSSION
    add_p("DISCUSSION", style='Heading 1', space_before=3.5, space_after=1.2)
    add_p(r"Answering Research Questions: (1) RQ1 (Dual Data Dependency): Hybrid RAG and API Tool Calling support high factual precision ($5.77\%$ test error, 95% CI: $[1.21\%, 15.95\%]$, with zero fabricated statutory hallucinations observed in manual audit), supported by $94.6\%$ chunk-level $\text{Recall@5}$ and $\text{MRR} = 0.862$. Static inquiries anchor to Carrier SOP chunks, while transactional operations execute deterministic APIs, isolating declarative knowledge from state mutations. (2) RQ2 (Architectural Divergence): Multi-agent decomposition outperforms Single-Agent + Critic in groundedness ($95.2\%$ vs. $88.1\%$, $p < 0.001$) and tool precision ($100.0\%$ [$38/38$] vs. $94.7\%$ [$36/38$]), raising pass rate from $69.2\%$ to $84.6\%$ ($36/52$ vs. $44/52$). Prompt separation mitigates cross-task interference between statutory legal text and tool schemas. (3) RQ3 (Latency vs. Robustness Trade-off): Multi-agent orchestration incurs $+1,071\text{ ms}$ overhead over Single-Agent + Critic ($3,651.0 \pm 753.5\text{ ms}$ vs. $2,580.0 \pm 826.9\text{ ms}$). While Single-Agent + Critic achieves $2.0\%$ ASR (statistically indistinguishable from HMAS at $0.0\%$ ASR, Fisher's exact $p = 0.4975$), the latency overhead is substantiated by groundedness ($+7.1\%$), tool precision ($+5.3\%$), pre-execution policy gating, and preserved responsiveness ($420\text{ ms}$ informational TTFT).", style='Text')
    add_p(r"Pilot Field Deployment Telemetry: Deployed in a 30-day pilot handling $1,420$ sessions across Mobile App and Guest Tracking, the system achieved a $78.38\%$ autonomous containment rate ($1,113/1,420$). Sessions decompose into four mutually exclusive cohorts: (1) Contained ($n = 1,113$, $78.38\%$), zero human transfer and zero repeat inquiries within 48h; (2) Human Escalations ($n = 134$, $9.44\%$), for parcel damage inspection and refunds $>15\text{M VND}$; (3) 48-Hour Repeats ($n = 85$, $5.99\%$); and (4) Drop-offs ($n = 88$, $6.20\%$). Optional post-session surveys self-administered in-app by the project team ($n = 261/1,420$ responses, $18.4\%$ response rate) indicated a mean CSAT of $4.42 / 5.00$ ($\text{SD} = 0.68$). A manual audit of $100$ sessions confirmed $87.0\%$ resolution accuracy, $6.0\%$ 48-hour repeat rate, and $0.0\%$ observed PII leakage (95% CI upper bound: $3.62\%$). Operating cost averaged \$0.0080 per resolved session (\$0.0038 LLM inference + \$0.0042 GPU amortization), substantially below the hub baseline manual cost (~3,000 VND / ~\$0.12).", style='Text')

    # VI. CONCLUSION, LIMITATIONS, AND ETHICAL CONSIDERATIONS
    add_p("CONCLUSION, LIMITATIONS, AND ETHICAL CONSIDERATIONS", style='Heading 1', space_before=3.5, space_after=1.2)
    add_p(r"Conclusion: This work presented a Heterogeneous Multi-Agent System (HMAS) combining Hybrid RAG and API Tool Calling for express courier support. On our evaluation suite, benchmarks indicate an $84.6\%$ functional pass rate on held-out test data (Tier: $4.05 / 5.00$, Human Pass Rate: $88.5\%$, $\kappa = 0.824$, $W = 112.0$, $d = 0.50$), $0.0\%$ ASR across evaluated OWASP external probes (95% CI: $[0.0\%, 8.81\%]$), and $78.4\%$ autonomous containment during a 30-day pilot at \$0.0080 per session.", style='Text')
    add_p(r"Limitations and Ethical Compliance: Key limitations include: (1) a benchmark of $N = 100$ cases ($n_{\text{test}} = 70$), automated scoring partially reliant on lexical keyword matching alongside human audit, and a monolingual Vietnamese evaluation requiring future multilingual validation; (2) a text-only pipeline incapable of inspecting parcel damage imagery without human escalation; (3) scope centered on domestic freight; and (4) pilot CSAT surveys had only an $18.4\%$ response rate ($261/1,420$) and were self-administered by the project team, introducing non-response, self-selection, and administrator bias. The architecture complies with Vietnam Decree 13/2023/ND-CP on Personal Data Protection via dynamic PII masking (0912***678) and salted SHA-256 hashing. Reproducibility: Inference ran on dual NVIDIA A100-80GB GPUs (~18 min across all 6 configurations and red-team suites). On an offline Apple M4 workstation (16 GB RAM, Python 3.9; ~2.3 s total rerun): (1) execute python3 generate_canonical_results.py (0.7 s) to recompute paired tests, CIs, and data/results.json; and (2) execute python3 generate_figure4_data_dashboard.py && python3 generate_statistical_charts_svg.py (1.6 s) to rebuild Figs. 2–3. Code: https://anonymous.4open.science/r/multi-agent-logistics-benchmark-2026/.", style='Text')

    # REFERENCES (Exact 21 References)
    add_p("REFERENCES", style='Heading 1', space_before=3.5, space_after=1.2)
    refs = [
        "[1] Vietnam E-Commerce Association (VECOM) and Ministry of Industry and Trade (MoIT), 'Vietnam E-Business Index (EBI) and Logistics Operations Report,' Hanoi, Vietnam, Tech. Rep., 2024.",
        "[2] Z. Ji et al., 'Survey of hallucination in natural language generation,' ACM Comput. Surv., vol. 55, no. 12, pp. 1–38, 2023.",
        "[3] J. Gao, C. Xiong, P. Bennett, and N. Craswell, 'Neural approaches to conversational AI,' Found. Trends Inf. Retr., vol. 13, no. 2–3, pp. 127–298, 2019.",
        "[4] S. Yao et al., 'ReAct: Synergizing reasoning and acting in language models,' in Proc. ICLR, 2023, pp. 1–25.",
        "[5] P. Voigt and A. Von dem Bussche, The EU General Data Protection Regulation (GDPR): A Practical Guide. Cham, Switzerland: Springer, 2017.",
        "[6] A. Bordes, Y. Boureau, and J. Weston, 'Learning end-to-end goal-oriented dialog,' in Proc. ICLR, 2017.",
        "[7] P. Budzianowski et al., 'MultiWOZ - A large-scale multi-domain Wizard-of-Oz dataset for task-oriented dialogue modelling,' in Proc. EMNLP, 2018, pp. 5016–5026.",
        "[8] W. Zhang, Y. Cui, and T. Liu, 'Recent advances in neural conversational systems,' Sci. China Inf. Sci., vol. 64, no. 11, p. 211101, 2021.",
        "[9] P. Lewis et al., 'Retrieval-augmented generation for knowledge-intensive NLP tasks,' in Adv. Neural Inf. Process. Syst. (NeurIPS), 2020, pp. 9459–9474.",
        "[10] S. Robertson and H. Zaragoza, 'The probabilistic relevance framework: BM25 and beyond,' Found. Trends Inf. Retr., vol. 3, no. 4, pp. 333–389, 2009.",
        "[11] G. V. Cormack, C. L. Clarke, and S. Büttcher, 'Reciprocal rank fusion outperforms Condorcet and individual rank learning methods,' in Proc. ACM SIGIR, 2009, pp. 758–759.",
        "[12] S. Es, J. James, L. Espinosa-Anke, and S. Schockaert, 'RAGAS: Automated evaluation of retrieval augmented generation,' in Proc. EACL, 2024, pp. 150–158.",
        "[13] T. Schick et al., 'Toolformer: Language models can teach themselves to use tools,' in Adv. Neural Inf. Process. Syst. (NeurIPS), 2023, pp. 68539–68551.",
        "[14] S. Yao et al., 'tau-bench: A benchmark for tool-agent-user interaction in real-world environments,' arXiv preprint arXiv:2406.12045, 2024.",
        "[15] Y. Qin et al., 'ToolLLM: Facilitating large language models to master 16000+ real-world APIs,' in Proc. ICLR, 2024.",
        "[16] Q. Wu et al., 'AutoGen: Enabling next-gen LLM applications via multi-agent conversation framework,' arXiv preprint arXiv:2308.08155, 2023.",
        "[17] H. Chase et al., 'LangGraph: Multi-agent orchestration engine for complex agentic workflows,' LangChain Inc., Tech. Rep., 2024.",
        "[18] OWASP Foundation, 'OWASP Top 10 for Large Language Model Applications (2025 Edition),' Tech. Rep., 2025.",
        "[19] P. Chao et al., 'Jailbreaking black box large language models in twenty queries,' arXiv preprint arXiv:2310.08419, 2023.",
        "[20] Universal Postal Union (UPU), 'Standards for postal item tracking and customer dispute resolution (EDI M40/M33),' Bern, Switzerland, Tech. Standard S10-12, 2020.",
        "[21] International Air Transport Association (IATA), 'Cargo Services Conference Resolutions Manual - Volumetric Weight Calculation Standard,' Geneva, Switzerland, 43rd ed., 2023."
    ]
    for r in refs:
        p = add_p(r, style='References', space_after=0.1)
        p.paragraph_format.left_indent = Inches(0.20)
        p.paragraph_format.first_line_indent = Inches(-0.20)
        p.paragraph_format.line_spacing = 1.0
        for run in p.runs:
            run.font.size = Pt(7.0)

    doc.save(output_path)
    print(f"[SUCCESS] Successfully compiled streamlined English paper with 3 Figures and 4 Core OMML Equations at: {output_path}")

if __name__ == '__main__':
    fix_and_build_ssrc_docx()
