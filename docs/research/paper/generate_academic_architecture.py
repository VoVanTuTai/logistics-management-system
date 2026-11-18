#!/usr/bin/env python3
"""
generate_academic_architecture.py
Generates the publication-grade System Architecture Blueprint (Fig. 1)
strictly adhering to IEEE Transactions / ACM Conference publication standards:
- Typography: Times New Roman / Serif matching IEEE journal typesetting
- Styling: Clean academic structure, formal mathematical notation, zero UI gimmicks/buttons,
  disciplined academic palette with high contrast and publication readability.
- Layout: Widescreen horizontal 3-Tier Pipeline (Aspect Ratio ~2.15 : 1):
    I. Client Touchpoints, PII Obfuscation & Transport Highway
    II. LangGraph Heterogeneous Multi-Agent Orchestration Engine (@NEXUS/chatbot-service:3013)
        - Supervisor Orchestrator Agent (Google Gemini 2.0 Flash)
        - Shared State Tuple & Context Memory (S_t)
        - 3 Specialized Sub-Agents (Alibaba Qwen, OpenAI GPT-OSS, NVIDIA Nemotron)
        - Dynamic Conditional Routing & 5-Step Transaction Safety Lifecycle
    III. Core Logistics Microservices Mesh & Storage Persistence Tier
- Outputs:
    docs/research/paper/diagrams/system-architecture-hmas.png (300 DPI)
    docs/research/paper/diagrams/system-architecture-hmas.svg (Vector)
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle

def generate_academic_architecture():
    png_out = 'docs/research/paper/diagrams/system-architecture-hmas.png'
    svg_out = 'docs/research/paper/diagrams/system-architecture-hmas.svg'

    # Configure strictly academic IEEE publication typography & style
    plt.rcParams['font.family'] = 'serif'
    plt.rcParams['font.serif'] = ['Times New Roman', 'Times', 'DejaVu Serif', 'Liberation Serif']
    plt.rcParams['mathtext.fontset'] = 'stix'
    plt.rcParams['axes.edgecolor'] = '#1e293b'
    plt.rcParams['axes.linewidth'] = 1.0

    # Canvas dimensions: 14.0 x 6.5 inches (Aspect Ratio: 2.15 : 1, perfectly matches IEEE 7.0 in width)
    fig, ax = plt.subplots(figsize=(14.0, 6.5), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Outer master boundary box
    outer_box = FancyBboxPatch((0.5, 0.5), 99.0, 99.0, boxstyle="round,pad=0.2,rounding_size=0.8",
                               linewidth=1.2, edgecolor='#cbd5e1', facecolor='#ffffff')
    ax.add_patch(outer_box)

    # Master Top Header Banner
    header_box = FancyBboxPatch((0.5, 93.2), 99.0, 6.3, boxstyle="round,pad=0.1,rounding_size=0.6",
                                linewidth=0, facecolor='#0f172a')
    ax.add_patch(header_box)

    ax.text(2.0, 96.5, "Fig. 1. Heterogeneous Multi-Agent Architecture (HMAS) with Dual-Anchor Grounding & Safe Human-in-the-Loop Actuation",
            fontsize=10.5, fontweight='bold', color='#ffffff', va='center')
    ax.text(98.0, 96.5, "IEEE / SSRC SPECIFICATION  •  @NEXUS/chatbot-service:3013",
            fontsize=8.5, fontweight='bold', color='#94a3b8', ha='right', va='center')

    # =========================================================================
    # SECTION I: CLIENT EXPERIENCE & TOUCHPOINTS TIER (Left, x: 1.5 -> 22.0, w: 20.5)
    # =========================================================================
    col1_bg = FancyBboxPatch((1.5, 2.0), 20.5, 90.0, boxstyle="round,pad=0.2,rounding_size=0.8",
                             linewidth=1.0, edgecolor='#94a3b8', facecolor='#f8fafc')
    ax.add_patch(col1_bg)

    col1_hdr = FancyBboxPatch((1.5, 86.5), 20.5, 5.5, boxstyle="round,pad=0.1,rounding_size=0.6",
                              linewidth=0, facecolor='#1e293b')
    ax.add_patch(col1_hdr)
    ax.text(11.75, 89.25, "I. CLIENT TIER & INGRESS", fontsize=9.0, fontweight='bold', color='#ffffff', ha='center', va='center')

    # Box 1.1: Omnichannel Frontends
    b1_1 = FancyBboxPatch((2.5, 63.5), 18.5, 21.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                          linewidth=0.8, edgecolor='#cbd5e1', facecolor='#ffffff')
    ax.add_patch(b1_1)
    ax.text(3.5, 82.5, "1. Omnichannel Touchpoints", fontsize=8.2, fontweight='bold', color='#0f172a')
    ax.text(3.5, 78.5, "• Merchant Web Portal (:5174)", fontsize=7.2, fontweight='bold', color='#1d4ed8')
    ax.text(4.5, 75.2, "Role: MERCHANT_ADMIN (Shop Owner / Dispatcher)", fontsize=6.5, color='#475569')
    ax.text(3.5, 71.5, "• Customer Mobile App (iOS / Android)", fontsize=7.2, fontweight='bold', color='#047857')
    ax.text(4.5, 68.2, "Role: CUSTOMER_CONSIGNEE (Recipient / Consignor)", fontsize=6.5, color='#475569')
    ax.text(3.5, 64.5, "• Guest Tracking Portal (:5177)", fontsize=7.2, fontweight='bold', color='#b45309')

    # Box 1.2: PII Obfuscation & Security Guard
    b1_2 = FancyBboxPatch((2.5, 36.5), 18.5, 25.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                          linewidth=0.8, edgecolor='#fca5a5', facecolor='#fef2f2')
    ax.add_patch(b1_2)
    ax.text(3.5, 59.5, "2. Role-Based Data Sanitization", fontsize=8.2, fontweight='bold', color='#991b1b')
    ax.text(3.5, 55.5, r"Mathematical Filter: $\pi_{\mathrm{mask}}(q, r)$", fontsize=7.2, fontweight='bold', color='#b91c1c')
    ax.text(3.5, 51.5, "• Unauthenticated Guest Obfuscation:", fontsize=6.8, fontweight='bold', color='#334155')
    ax.text(4.5, 48.0, "Phone: 0912345678  ->  0912***678", fontsize=6.5, family='monospace', color='#475569')
    ax.text(4.5, 44.8, "Address: 123 Nguyen Hue  ->  ***, Q1, HCMC", fontsize=6.5, family='monospace', color='#475569')
    ax.text(3.5, 41.5, "• Challenge Response Verification:", fontsize=6.8, fontweight='bold', color='#334155')
    ax.text(4.5, 38.0, "Requires last 4 digits of phone before unmasking", fontsize=6.5, color='#475569')

    # Box 1.3: Human-in-the-Loop (HITL) Safety Gate
    b1_3 = FancyBboxPatch((2.5, 3.5), 18.5, 31.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                          linewidth=1.0, edgecolor='#dc2626', facecolor='#fff1f2')
    ax.add_patch(b1_3)
    ax.text(3.5, 32.5, "3. Human-in-the-Loop (HITL) Gate", fontsize=8.2, fontweight='bold', color='#991b1b')
    ax.text(3.5, 28.5, r"State Interruption Signal: $\sigma_{\mathrm{HITL}} \in \{0, 1\}$", fontsize=7.2, fontweight='bold', color='#b91c1c')
    ax.text(3.5, 25.0, "• Two-Phase Execution Protocol:", fontsize=6.8, fontweight='bold', color='#1e293b')
    ax.text(4.5, 21.8, "Phase 1: Agent drafts proposal (Non-mutating)", fontsize=6.5, color='#475569')
    ax.text(4.5, 18.8, "Phase 2: User signature required before DB write", fontsize=6.5, color='#475569')
    ax.text(3.5, 15.5, "• Exemplar In-Flight Mutation (NX-889922):", fontsize=6.8, fontweight='bold', color='#1e293b')
    ax.text(4.5, 12.3, "Cancel Shipment: Deducts 50% return fee (Art. 25)", fontsize=6.5, color='#b91c1c')
    ax.text(4.5, 9.3, "Decision: Approved -> Commit  |  Rejected -> Abort", fontsize=6.5, fontweight='bold', color='#15803d')
    ax.text(3.5, 5.5, "Guarantees 0% unauthorized state mutation", fontsize=6.6, style='italic', color='#475569')

    # =========================================================================
    # SECTION II: LANGGRAPH HMAS ORCHESTRATION ENGINE (Center, x: 23.5 -> 74.5, w: 51.0)
    # =========================================================================
    col2_bg = FancyBboxPatch((23.5, 2.0), 51.0, 90.0, boxstyle="round,pad=0.2,rounding_size=0.8",
                             linewidth=1.2, edgecolor='#1d4ed8', facecolor='#f8faff')
    ax.add_patch(col2_bg)

    col2_hdr = FancyBboxPatch((23.5, 86.5), 51.0, 5.5, boxstyle="round,pad=0.1,rounding_size=0.6",
                              linewidth=0, facecolor='#1e3a8a')
    ax.add_patch(col2_hdr)
    ax.text(49.0, 89.25, "II. LANGGRAPH HETEROGENEOUS MULTI-AGENT ORCHESTRATION ENGINE (:3013)",
            fontsize=9.0, fontweight='bold', color='#ffffff', ha='center', va='center')

    # Row 1 Left: Supervisor Orchestrator Agent (Google Gemini)
    b2_sup = FancyBboxPatch((24.5, 62.0), 24.5, 23.0, boxstyle="round,pad=0.2,rounding_size=0.6",
                            linewidth=0.9, edgecolor='#fdba74', facecolor='#fff7ed')
    ax.add_patch(b2_sup)
    ax.text(25.5, 82.0, r"Supervisor Agent ($\mathcal{A}_{\mathrm{sup}}$: Gemini 2.0 Flash)", fontsize=8.2, fontweight='bold', color='#9a3412')
    ax.text(25.5, 78.5, "DAG Planner, Intent Router & Stream Aggregator", fontsize=6.8, fontweight='bold', color='#c2410c')
    ax.text(25.5, 74.5, r"• Intent Probability: $p(I \mid q, \mathcal{H}) \in \{\mathrm{QA}, \mathrm{TOOL}, \mathrm{TRANS}\}$", fontsize=6.8, color='#334155')
    ax.text(25.5, 71.0, "• Entity Parser: AWB Tracking Code, PII entities, weight/dim", fontsize=6.6, color='#334155')
    ax.text(25.5, 67.5, "• Dynamic Task Dispatcher: Dispatches workers in parallel", fontsize=6.6, color='#334155')
    ax.text(25.5, 64.0, r"• Response Streamer: TTFT $\leq 420\,\mathrm{ms}$ via SSE chunking", fontsize=6.6, fontweight='bold', color='#059669')

    # Row 1 Right: Shared Context Memory & State Tuple
    b2_state = FancyBboxPatch((49.5, 62.0), 24.0, 23.0, boxstyle="round,pad=0.2,rounding_size=0.6",
                              linewidth=0.9, edgecolor='#c4b5fd', facecolor='#faf5ff')
    ax.add_patch(b2_state)
    ax.text(50.5, 82.0, r"Shared State Machine Tuple ($\mathcal{S}_t$)", fontsize=8.2, fontweight='bold', color='#581c87')
    ax.text(50.5, 78.5, r"LangGraph Cyclic Context: $\mathcal{S}_t = ( \mathcal{M}_t, \mathcal{U}_t, \mathcal{I}_t, \mathcal{D}_t, \mathcal{V}_t, \mathcal{R}_t )$",
            fontsize=6.8, fontweight='bold', color='#6b21a8')
    ax.text(50.5, 74.5, r"• $\mathcal{M}_t$: 6-turn rolling session message history buffer", fontsize=6.6, color='#334155')
    ax.text(50.5, 71.0, r"• $\mathcal{U}_t$: Caller role context $\{\mathrm{userId}, \mathrm{role}, \mathrm{shopTier}\}$", fontsize=6.6, color='#334155')
    ax.text(50.5, 67.5, r"• $\mathcal{D}_t$: Action Draft DTO $\{\mathrm{endpoint}, \mathbf{x}_{\mathrm{params}}, \mathrm{hash}\}$", fontsize=6.6, color='#334155')
    ax.text(50.5, 64.0, r"• Checkpoint: Serialized to Redis :6379 for instant state recovery", fontsize=6.6, fontweight='bold', color='#1d4ed8')

    # Row 2: 3 Specialized Sub-Agents (Workers)
    # Worker 1: Knowledge Retrieval Agent (Alibaba Qwen 3.8 27B)
    b2_w1 = FancyBboxPatch((24.5, 23.5), 16.0, 36.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                           linewidth=0.9, edgecolor='#7dd3fc', facecolor='#f0f9ff')
    ax.add_patch(b2_w1)
    ax.text(25.5, 57.2, r"Knowledge Agent ($\mathcal{A}_{\mathrm{know}}$)", fontsize=7.8, fontweight='bold', color='#0369a1')
    ax.text(25.5, 54.2, "Alibaba Qwen 3.8 27B (Groq LPU)", fontsize=6.6, fontweight='bold', color='#0284c7')
    ax.text(25.5, 50.5, "• Dual-Anchor Hybrid RAG:", fontsize=6.8, fontweight='bold', color='#1e293b')
    ax.text(25.5, 47.5, r"Dense: MRL 512-dim ($\mathbf{e}_q, \mathbf{e}_d$)", fontsize=6.5, color='#475569')
    ax.text(25.5, 44.8, r"Sparse: BM25 Keyword Index (30%)", fontsize=6.5, color='#475569')
    ax.text(25.5, 41.8, r"$S(q,d) = 0.70\cdot\mathrm{Cos} + 0.30\cdot\mathrm{BM25}$", fontsize=6.4, fontweight='bold', color='#0369a1')
    ax.text(25.5, 38.5, "• 9 Official Carrier SOPs:", fontsize=6.8, fontweight='bold', color='#1e293b')
    ax.text(25.5, 35.8, "SOP-01 Tariff  •  SOP-02 Claims", fontsize=6.5, color='#475569')
    ax.text(25.5, 33.2, r"SOP-06 Fragile ($\geq 3$ bubble layers)", fontsize=6.5, color='#475569')
    ax.text(25.5, 30.0, "• Statutory Citations:", fontsize=6.8, fontweight='bold', color='#1e293b')
    ax.text(25.5, 27.2, "Decree 47 Đ.25 & Law 49 Đ.40", fontsize=6.5, color='#b45309')
    ax.text(25.5, 24.6, r"Indemnity capped at $4\times\mathrm{tariff}$", fontsize=6.5, fontweight='bold', color='#b45309')

    # Worker 2: Operational Tool Agent (OpenAI GPT-OSS 120B)
    b2_w2 = FancyBboxPatch((41.0, 23.5), 16.0, 36.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                           linewidth=0.9, edgecolor='#86efac', facecolor='#f0fdf4')
    ax.add_patch(b2_w2)
    ax.text(42.0, 57.2, r"Operational Agent ($\mathcal{A}_{\mathrm{oper}}$)", fontsize=7.8, fontweight='bold', color='#15803d')
    ax.text(42.0, 54.2, "OpenAI GPT-OSS 120B (Groq LPU)", fontsize=6.6, fontweight='bold', color='#166534')
    ax.text(42.0, 50.5, "• Deterministic Tool Registry:", fontsize=6.8, fontweight='bold', color='#1e293b')
    ax.text(42.0, 47.5, "1. trackShipment(AWB)", fontsize=6.5, family='monospace', color='#0f172a')
    ax.text(42.0, 44.8, "   Milestone logs & GPS coords", fontsize=6.5, color='#475569')
    ax.text(42.0, 41.8, "2. calculateShippingRate()", fontsize=6.5, family='monospace', color='#0f172a')
    ax.text(42.0, 39.0, r"   IATA $V/6000$: $\max(W, \frac{L\cdot W\cdot H}{6000})$", fontsize=6.3, fontweight='bold', color='#15803d')
    ax.text(42.0, 36.0, "3. fileDisputeClaim()", fontsize=6.5, family='monospace', color='#0f172a')
    ax.text(42.0, 33.2, "   24h dispute window & CCTV", fontsize=6.5, color='#475569')
    ax.text(42.0, 30.0, "• Action Draft Synthesis:", fontsize=6.8, fontweight='bold', color='#1e293b')
    ax.text(42.0, 27.2, "Validates JSON schema contract", fontsize=6.5, color='#475569')
    ax.text(42.0, 24.6, "Does NOT execute mutating DB calls", fontsize=6.5, fontweight='bold', color='#991b1b')

    # Worker 3: Validation Critic Agent (NVIDIA Nemotron 3.5)
    b2_w3 = FancyBboxPatch((57.5, 23.5), 16.0, 36.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                           linewidth=0.9, edgecolor='#f472b6', facecolor='#fff1f2')
    ax.add_patch(b2_w3)
    ax.text(58.5, 57.2, r"Validation Critic ($\mathcal{A}_{\mathrm{val}}$)", fontsize=7.8, fontweight='bold', color='#9d174d')
    ax.text(58.5, 54.2, "NVIDIA Nemotron 3.5 (Critic)", fontsize=6.6, fontweight='bold', color='#be185d')
    ax.text(58.5, 50.5, "• 5 Operational Gatekeepers:", fontsize=6.8, fontweight='bold', color='#1e293b')
    ax.text(58.5, 47.5, r"1. $\mathcal{C}_{\mathrm{danger}}$: Weapons, lithium cells", fontsize=6.5, color='#475569')
    ax.text(58.5, 44.8, r"2. $\mathcal{C}_{\mathrm{limit}}$: $\leq 70\mathrm{kg}, 150\mathrm{cm}, 300\mathrm{cm}$", fontsize=6.5, fontweight='bold', color='#9d174d')
    ax.text(58.5, 41.8, r"3. $\mathcal{C}_{\mathrm{ins}}$: Value $\geq 30\mathrm{M}$ mandatory", fontsize=6.5, color='#475569')
    ax.text(58.5, 39.0, r"4. $\mathcal{C}_{\mathrm{cod}}$: COD $\geq 15\mathrm{M}$ cash risk", fontsize=6.5, color='#475569')
    ax.text(58.5, 36.0, r"5. $\mathcal{C}_{\mathrm{pii}}$: Cross-account data leak", fontsize=6.5, color='#475569')
    ax.text(58.5, 32.5, "• Interruption Gate Decision:", fontsize=6.8, fontweight='bold', color='#1e293b')
    ax.text(58.5, 29.5, r"If $\mathrm{Risk} > \tau$ or Mutating = True:", fontsize=6.5, fontweight='bold', color='#991b1b')
    ax.text(58.5, 26.8, r"$\rightarrow$ Trigger LangGraph interrupt()", fontsize=6.5, fontweight='bold', color='#b91c1c')
    ax.text(58.5, 24.2, "-> Escalates to Section I (HITL)", fontsize=6.5, fontweight='bold', color='#b91c1c')

    # Row 3: Conditional Workflow Router & 5-Step Transaction Safety Lifecycle
    b2_flow = FancyBboxPatch((24.5, 3.5), 49.0, 18.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                             linewidth=0.8, edgecolor='#cbd5e1', facecolor='#ffffff')
    ax.add_patch(b2_flow)
    ax.text(25.5, 19.5, "Conditional Routing Branches & 5-Step Transaction Safety Lifecycle:",
            fontsize=7.8, fontweight='bold', color='#0f172a')
    
    # 3 Branches
    ax.text(25.5, 16.5, r"Branch 1 [Read-Only]: Tracking/Tariff $\rightarrow$ Fast Direct Response ($\mathrm{Latency} < 850\,\mathrm{ms}$)",
            fontsize=6.8, color='#047857')
    ax.text(25.5, 13.8, r"Branch 2 [Policy QA]: Statutory SOPs $\rightarrow$ Grounded Answer with Legal Citations",
            fontsize=6.8, color='#1d4ed8')
    ax.text(25.5, 11.0, r"Branch 3 [Mutation]: Cancel / Address / Claim $\rightarrow$ Triggers $\sigma_{\mathrm{HITL}}$ Interrupt Gate",
            fontsize=6.8, fontweight='bold', color='#b91c1c')

    # 5-Step Badges
    steps = [
        ("1. Draft Proposal", "#2563eb", 25.5),
        ("2. Risk Evaluation", "#9d174d", 35.5),
        ("3. Graph Interrupt", "#dc2626", 45.5),
        ("4. Backend Actuation", "#059669", 56.5),
        ("5. Immutable Audit", "#0f172a", 67.0)
    ]
    for label, col, x_pos in steps:
        s_box = FancyBboxPatch((x_pos, 4.5), 9.0, 5.0, boxstyle="round,pad=0.1,rounding_size=0.4",
                               linewidth=0.8, edgecolor=col, facecolor='#ffffff')
        ax.add_patch(s_box)
        ax.text(x_pos + 4.5, 7.0, label, fontsize=6.4, fontweight='bold', color=col, ha='center', va='center')

    # Small arrows between 5 steps
    for x_arr in [34.7, 44.7, 54.7, 65.7]:
        ax.annotate('', xy=(x_arr + 0.6, 7.0), xytext=(x_arr - 0.2, 7.0),
                    arrowprops=dict(arrowstyle="->", color="#64748b", lw=1.0))

    # =========================================================================
    # SECTION III: BACKEND LOGISTICS MICROSERVICES & STORAGE (Right, x: 76.0 -> 98.5, w: 22.5)
    # =========================================================================
    col3_bg = FancyBboxPatch((76.0, 2.0), 22.5, 90.0, boxstyle="round,pad=0.2,rounding_size=0.8",
                             linewidth=1.0, edgecolor='#94a3b8', facecolor='#f8fafc')
    ax.add_patch(col3_bg)

    col3_hdr = FancyBboxPatch((76.0, 86.5), 22.5, 5.5, boxstyle="round,pad=0.1,rounding_size=0.6",
                              linewidth=0, facecolor='#1e293b')
    ax.add_patch(col3_hdr)
    ax.text(87.25, 89.25, "III. BACKEND MICROSERVICES & PERSISTENCE", fontsize=8.8, fontweight='bold', color='#ffffff', ha='center', va='center')

    # Box 3.1: API Gateway BFF (:3000)
    b3_1 = FancyBboxPatch((77.0, 68.5), 20.5, 16.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                          linewidth=0.8, edgecolor='#cbd5e1', facecolor='#ffffff')
    ax.add_patch(b3_1)
    ax.text(78.0, 82.2, "1. API Gateway BFF (:3000)", fontsize=8.2, fontweight='bold', color='#0f172a')
    ax.text(78.0, 78.5, "NestJS Reverse Proxy & Auth Guard", fontsize=6.8, fontweight='bold', color='#2563eb')
    ax.text(78.0, 75.0, "• JWT Bearer Token & RBAC Scopes", fontsize=6.6, color='#475569')
    ax.text(78.0, 72.0, "• Token-bucket Rate Limiter (60 req/min)", fontsize=6.6, color='#475569')
    ax.text(78.0, 69.2, "• Anti-BOLA/IDOR Ownership Check", fontsize=6.6, fontweight='bold', color='#059669')

    # Box 3.2: Core Logistics Microservices Mesh
    b3_2 = FancyBboxPatch((77.0, 34.5), 20.5, 32.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                          linewidth=0.8, edgecolor='#cbd5e1', facecolor='#ffffff')
    ax.add_patch(b3_2)
    ax.text(78.0, 64.2, "2. Core Microservices Mesh", fontsize=8.2, fontweight='bold', color='#0f172a')
    ax.text(78.0, 60.5, "• @NEXUS/tracking-service (:3008)", fontsize=7.2, fontweight='bold', color='#0284c7')
    ax.text(79.0, 57.5, "Real-time hub scan logs & chain of custody", fontsize=6.4, color='#475569')
    ax.text(78.0, 54.0, "• @NEXUS/pricing-service (:3012)", fontsize=7.2, fontweight='bold', color='#6d28d9')
    ax.text(79.0, 51.0, "Master tariff matrix & IATA volumetric rule", fontsize=6.4, color='#475569')
    ax.text(78.0, 47.5, "• @NEXUS/shipments-service (:3002)", fontsize=7.2, fontweight='bold', color='#047857')
    ax.text(79.0, 44.5, "Order state machine & atomic lifecycle commit", fontsize=6.4, color='#475569')
    ax.text(78.0, 41.0, "• Claims & Dispute Resolution Module", fontsize=7.2, fontweight='bold', color='#be185d')
    ax.text(79.0, 38.0, "24-Hour dispute hearing window & arbitration", fontsize=6.4, color='#475569')
    ax.text(78.0, 35.2, "Only executes upon verified HITL approval", fontsize=6.5, style='italic', color='#991b1b')

    # Box 3.3: Data Persistence Tier
    b3_3 = FancyBboxPatch((77.0, 3.5), 20.5, 29.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                          linewidth=0.8, edgecolor='#cbd5e1', facecolor='#ffffff')
    ax.add_patch(b3_3)
    ax.text(78.0, 30.2, "3. Persistence & Vector Tier", fontsize=8.2, fontweight='bold', color='#0f172a')
    ax.text(78.0, 26.5, "• PostgreSQL 16 + pgvector", fontsize=7.2, fontweight='bold', color='#0f172a')
    ax.text(79.0, 23.5, "MRL 512-dim RAM Index (< 5ms dot product)", fontsize=6.4, color='#475569')
    ax.text(78.0, 20.2, r"• Table: $\mathrm{ai\_agent\_audit\_logs}$", fontsize=7.2, fontweight='bold', color='#1d4ed8')
    ax.text(79.0, 17.2, "Immutable legal trace: prompt, hash, signature", fontsize=6.4, color='#475569')
    ax.text(78.0, 14.0, "• Redis Cache :6379", fontsize=7.2, fontweight='bold', color='#dc2626')
    ax.text(79.0, 11.2, "LangGraph Checkpointer & FAQ Semantic Cache", fontsize=6.4, color='#475569')
    ax.text(78.0, 8.0, "• MinIO S3 Object Storage", fontsize=7.2, fontweight='bold', color='#059669')
    ax.text(79.0, 5.0, "CCTV evidence videos & damage photos", fontsize=6.4, color='#475569')

    # =========================================================================
    # MAJOR SYSTEM DATA HIGHWAYS & FLOW ANNOTATIONS
    # =========================================================================
    # Inbound Query: Client -> Supervisor
    ax.annotate('', xy=(24.5, 75.0), xytext=(22.0, 75.0),
                arrowprops=dict(arrowstyle="->", color="#1d4ed8", lw=1.4))
    ax.text(23.25, 76.5, r"Query $q$", fontsize=6.5, fontweight='bold', color='#1d4ed8', ha='center')

    # Outbound SSE: Supervisor -> Client
    ax.annotate('', xy=(22.0, 70.0), xytext=(24.5, 70.0),
                arrowprops=dict(arrowstyle="->", color="#059669", lw=1.4, linestyle="--"))
    ax.text(23.25, 68.0, "SSE", fontsize=6.5, fontweight='bold', color='#059669', ha='center')

    # Sub-agent coordination arrows from Supervisor
    # Supervisor -> Knowledge
    ax.annotate('', xy=(32.5, 60.0), xytext=(32.5, 62.0),
                arrowprops=dict(arrowstyle="->", color="#0284c7", lw=1.2))
    # Supervisor -> Operation
    ax.annotate('', xy=(49.0, 60.0), xytext=(45.0, 62.0),
                arrowprops=dict(arrowstyle="->", color="#166534", lw=1.2))
    # Supervisor -> Validation
    ax.annotate('', xy=(65.5, 60.0), xytext=(60.0, 62.0),
                arrowprops=dict(arrowstyle="->", color="#be185d", lw=1.2))

    # Interrupt Signal: Validation Critic -> HITL Gate in Section I
    ax.annotate('', xy=(21.0, 18.0), xytext=(57.5, 25.0),
                arrowprops=dict(arrowstyle="->", color="#dc2626", lw=1.5, linestyle=":",
                                connectionstyle="arc3,rad=0.15"))
    ax.text(39.0, 21.0, r"$\sigma_{\mathrm{HITL}}$ Interrupt Signal (State Mutation)",
            fontsize=7.0, fontweight='bold', color='#dc2626', ha='center',
            bbox=dict(boxstyle="round,pad=0.2", facecolor="#ffffff", edgecolor="#f87171", lw=0.8))

    # Approved Execution: HITL Gate -> API Gateway BFF
    ax.annotate('', xy=(77.0, 72.0), xytext=(21.0, 8.0),
                arrowprops=dict(arrowstyle="->", color="#15803d", lw=1.5, linestyle="--",
                                connectionstyle="arc3,rad=-0.22"))
    ax.text(50.0, 1.2, r"Approved Transaction $\sigma_{\mathrm{sign}}=1$ $\rightarrow$ POST /api/v1/chat/execute",
            fontsize=7.0, fontweight='bold', color='#15803d', ha='center',
            bbox=dict(boxstyle="round,pad=0.2", facecolor="#ffffff", edgecolor="#86efac", lw=0.8))

    # Operation Agent -> Backend Microservices
    ax.annotate('', xy=(77.0, 50.0), xytext=(57.0, 42.0),
                arrowprops=dict(arrowstyle="->", color="#0284c7", lw=1.2, linestyle="--"))

    plt.tight_layout(pad=0.2)
    
    # Save high-res PNG & vector SVG
    os.makedirs(os.path.dirname(png_out), exist_ok=True)
    plt.savefig(png_out, dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.savefig(svg_out, format='svg', bbox_inches='tight', facecolor='#ffffff')
    plt.close()

    print(f"Successfully generated {png_out} (300 DPI)")
    print(f"Successfully generated {svg_out} (Vector SVG)")

if __name__ == '__main__':
    generate_academic_architecture()
