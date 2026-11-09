#!/usr/bin/env python3
"""
generate_agent_collaboration_diagram.py
Generates the publication-grade Multi-Agent Collaboration and Task Allocation Architecture diagram
strictly adhering to scientific standards:
- 100% VENDOR-AGNOSTIC: ZERO commercial brand names (no Google, Alibaba, OpenAI, NVIDIA, Gemini, Qwen, GPT).
- Represents purely scientific roles, task division of labor, state graph transitions, and collaboration protocol.
- Style: Flat, hand-drawn digital illustration aesthetic with bold black outlines (stroke 2.5 - 3.5px),
  minimal pastel palette (pastel yellow #FEF08A, pastel purple #E9D5FF, light grey #F1F5F9), pure white background.
- Outputs:
    docs/research/paper/diagrams/multi-agent-task-collaboration.svg
    docs/research/paper/diagrams/multi-agent-task-collaboration.png (300 DPI, 4000x2500 px)
"""

import os
import subprocess
import xml.etree.ElementTree as ET

SVG_OUTPUT = "docs/research/paper/diagrams/multi-agent-task-collaboration.svg"
PNG_OUTPUT = "docs/research/paper/diagrams/multi-agent-task-collaboration.png"

def build_svg():
    W = 2400
    H = 1500
    lines = []

    lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&amp;family=JetBrains+Mono:wght@700;800&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }}
      .hand-title {{ font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; }}
      .mono {{ font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-weight: 800; }}
      .pill-text {{ font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; }}
    </style>
  </defs>

  <!-- PURE CLEAN WHITE BACKGROUND -->
  <rect width="{W}" height="{H}" fill="#FFFFFF"/>

  <!-- MASTER DIAGRAM HEADER -->
  <g transform="translate(1200, 55)">
    <text x="0" y="0" class="hand-title" font-size="34" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="-0.02em">
      Multi-Agent Collaboration &amp; Task Allocation Architecture
    </text>
    <text x="0" y="28" font-size="14.5" font-weight="800" fill="#64748B" text-anchor="middle" letter-spacing="0.05em">
      STATEFUL DAG ORCHESTRATION • ROLE DECOMPOSITION • HUMAN-IN-THE-LOOP SAFETY GATE
    </text>
  </g>

  <!-- DECORATIVE HAND-DRAWN SPARKLES -->
  <g stroke="#CBD5E1" stroke-width="2.2" stroke-linecap="round" fill="none">
    <path d="M 360 160 L 360 176 M 352 168 L 368 168"/>
    <path d="M 1020 120 L 1020 136 M 1012 128 L 1028 128" stroke="#FDE047"/>
    <path d="M 2150 140 L 2150 156 M 2142 148 L 2158 148"/>
    <path d="M 980 880 L 980 896 M 972 888 L 988 888" stroke="#DDD6FE"/>
    <path d="M 2200 1320 L 2200 1336 M 2192 1328 L 2208 1328"/>
  </g>''')

    # =========================================================================
    # COLUMN 1: USER TASK INGRESS (Left, x: 80 -> 340)
    # =========================================================================
    u_x, u_y = 180, 720
    lines.append(f'''
  <!-- =========================================================================
       COLUMN 1: USER TASK INGRESS
       ========================================================================= -->
  <g id="Col_User_Ingress">
    <!-- User Card -->
    <g transform="translate({u_x}, {u_y})">
      <rect x="-110" y="-120" width="220" height="240" rx="26" fill="#F8FAFC" stroke="#1E293B" stroke-width="3.5"/>
      
      <!-- Hand-drawn User Avatar -->
      <g transform="translate(0, -45)">
        <circle cx="0" cy="0" r="26" fill="#FEF08A" stroke="#1E293B" stroke-width="2.6"/>
        <path d="M -24 38 C -24 16 24 16 24 38 Z" fill="#E9D5FF" stroke="#1E293B" stroke-width="2.6"/>
      </g>

      <text x="0" y="30" class="hand-title" font-size="20" font-weight="900" fill="#0F172A" text-anchor="middle">
        User Ingress
      </text>
      <text x="0" y="52" font-size="12" font-weight="800" fill="#64748B" text-anchor="middle">
        Merchant / Consignee / Guest
      </text>

      <!-- Task Query Pill -->
      <g transform="translate(0, 82)">
        <rect x="-85" y="-14" width="170" height="28" rx="14" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.0"/>
        <text x="0" y="5" class="mono" font-size="11" font-weight="800" fill="#1D4ED8" text-anchor="middle">
          Query q &#x2208; Q
        </text>
      </g>
    </g>

    <!-- Inbound Arrow: User -> Supervisor -->
    <path d="M {u_x + 110} {u_y - 20} Q 360 {u_y - 40} 420 {u_y - 20}" fill="none" stroke="#1E293B" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="9,7"/>
    <polygon points="420,{u_y - 20} 404,{u_y - 28} 404,{u_y - 12}" fill="#1E293B"/>
    <text x="360" y="{u_y - 45}" class="mono" font-size="11" font-weight="800" fill="#1E293B" text-anchor="middle">Task Request</text>

    <!-- Outbound SSE Stream Arrow: Supervisor -> User -->
    <path d="M 420 {u_y + 40} Q 360 {u_y + 60} {u_x + 110} {u_y + 40}" fill="none" stroke="#059669" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="9,7"/>
    <polygon points="{u_x + 110},{u_y + 40} {u_x + 126},{u_y + 32} {u_x + 126},{u_y + 48}" fill="#059669"/>
    <text x="360" y="{u_y + 75}" class="mono" font-size="11" font-weight="800" fill="#059669" text-anchor="middle">SSE Token Stream</text>
  </g>''')

    # =========================================================================
    # COLUMN 2: SUPERVISOR ORCHESTRATOR AGENT (Center-Left, x: 580, y: 720)
    # =========================================================================
    sup_x, sup_y = 600, 720
    lines.append(f'''
  <!-- =========================================================================
       COLUMN 2: SUPERVISOR ORCHESTRATOR AGENT
       ========================================================================= -->
  <g id="Col_Supervisor">
    <!-- Supervisor Master Card -->
    <g transform="translate({sup_x}, {sup_y})">
      <rect x="-170" y="-190" width="340" height="380" rx="30" fill="#F1F5F9" stroke="#1E293B" stroke-width="3.8"/>

      <!-- Supervisor Brain / Core Icon -->
      <g transform="translate(0, -125)">
        <circle cx="0" cy="0" r="30" fill="#FEF08A" stroke="#1E293B" stroke-width="2.6"/>
        <path d="M 0 -22 L 0 22 M -22 0 L 22 0" stroke="#1E293B" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="-12" cy="-12" r="4" fill="#E9D5FF" stroke="#1E293B" stroke-width="1.8"/>
        <circle cx="12" cy="-12" r="4" fill="#E9D5FF" stroke="#1E293B" stroke-width="1.8"/>
        <circle cx="-12" cy="12" r="4" fill="#E9D5FF" stroke="#1E293B" stroke-width="1.8"/>
        <circle cx="12" cy="12" r="4" fill="#E9D5FF" stroke="#1E293B" stroke-width="1.8"/>
      </g>

      <text x="0" y="-68" class="hand-title" font-size="22" font-weight="900" fill="#0F172A" text-anchor="middle">
        Supervisor Orchestrator
      </text>
      <text x="0" y="-46" font-size="13" font-weight="800" fill="#1D4ED8" text-anchor="middle">
        TÁC TỬ CHỈ HUY &amp; ĐIỀU PHỐI
      </text>

      <!-- Task Allocation Box -->
      <g transform="translate(0, 10)">
        <rect x="-145" y="-35" width="290" height="70" rx="14" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.2"/>
        <text x="0" y="-12" font-size="12.5" font-weight="800" fill="#0F172A" text-anchor="middle">
          1. Intent Classification &amp; Entity Parsing
        </text>
        <text x="0" y="8" font-size="12.5" font-weight="800" fill="#0F172A" text-anchor="middle">
          2. Dynamic Task Allocation (DAG)
        </text>
        <text x="0" y="26" font-size="11.5" font-weight="700" fill="#64748B" text-anchor="middle">
          Routes tasks to specialized worker sub-agents
        </text>
      </g>

      <!-- Shared State Context Box -->
      <g transform="translate(0, 115)">
        <rect x="-145" y="-30" width="290" height="60" rx="14" fill="#FAF5FF" stroke="#C4B5FD" stroke-width="2.0"/>
        <text x="0" y="-8" class="hand-title" font-size="12.5" font-weight="900" fill="#6B21A8" text-anchor="middle">
          Shared State Context S_t
        </text>
        <text x="0" y="12" class="mono" font-size="10.5" font-weight="700" fill="#4C1D95" text-anchor="middle">
          (Messages, Context, Intent, Draft DTO, Risks)
        </text>
      </g>
    </g>
  </g>''')

    # =========================================================================
    # TASK ALLOCATION CONNECTOR ARROWS FROM SUPERVISOR TO 3 WORKERS
    # =========================================================================
    lines.append(f'''
  <!-- =========================================================================
       TASK DISPATCH CONNECTOR ARROWS (SUPERVISOR -> 3 WORKERS)
       ========================================================================= -->
  <g stroke="#1E293B" stroke-width="3.2" stroke-linecap="round" fill="none">
    <!-- Arrow 1: Supervisor -> Worker 1 (Knowledge Agent - Upward Branch) -->
    <path d="M {sup_x + 170} {sup_y - 80} Q 920 {sup_y - 280} 1070 310" stroke-dasharray="9,7"/>
    <polygon points="1070,310 1054,302 1054,318" fill="#1E293B"/>

    <!-- Arrow 2: Supervisor -> Worker 2 (Operational Tool Agent - Center Horizontal Branch) -->
    <path d="M {sup_x + 170} {sup_y} L 1070 {sup_y}" stroke-dasharray="9,7"/>
    <polygon points="1070,{sup_y} 1054,{sup_y - 8} 1054,{sup_y + 8}" fill="#1E293B"/>

    <!-- Arrow 3: Supervisor -> Worker 3 (Validation Critic Agent - Downward Branch) -->
    <path d="M {sup_x + 170} {sup_y + 80} Q 920 {sup_y + 280} 1070 1130" stroke-dasharray="9,7"/>
    <polygon points="1070,1130 1054,1122 1054,1138" fill="#1E293B"/>
  </g>

  <!-- Labels on Dispatch Arrows -->
  <g transform="translate(860, 480)">
    <rect x="-80" y="-14" width="160" height="28" rx="8" fill="#FEF9C3" stroke="#1E293B" stroke-width="1.8"/>
    <text x="0" y="5" class="pill-text" font-size="11.5" fill="#1E293B" text-anchor="middle">Task 1: Policy QA</text>
  </g>

  <g transform="translate(880, 695)">
    <rect x="-85" y="-14" width="170" height="28" rx="8" fill="#E9D5FF" stroke="#1E293B" stroke-width="1.8"/>
    <text x="0" y="5" class="pill-text" font-size="11.5" fill="#1E293B" text-anchor="middle">Task 2: Tool Execution</text>
  </g>

  <g transform="translate(860, 950)">
    <rect x="-85" y="-14" width="170" height="28" rx="8" fill="#F1F5F9" stroke="#1E293B" stroke-width="1.8"/>
    <text x="0" y="5" class="pill-text" font-size="11.5" fill="#1E293B" text-anchor="middle">Task 3: Safety Audit</text>
  </g>''')

    # =========================================================================
    # COLUMN 3: THE 3 SPECIALIZED WORKER AGENTS (x: 1080 -> 1680)
    # =========================================================================
    # Worker 1: Knowledge Retrieval Agent (Top, y: 310)
    w1_x, w1_y = 1380, 310
    lines.append(f'''
  <!-- =========================================================================
       WORKER 1: KNOWLEDGE RETRIEVAL AGENT (HYBRID RAG)
       ========================================================================= -->
  <g id="Worker_Knowledge_Agent">
    <g transform="translate({w1_x}, {w1_y})">
      <rect x="-300" y="-105" width="600" height="210" rx="26" fill="#FEF9C3" stroke="#1E293B" stroke-width="3.5"/>

      <!-- Icon: SOP Manual & Magnifying Glass -->
      <g transform="translate(-215, 0)">
        <rect x="-24" y="-30" width="48" height="60" rx="4" fill="#FDE047" stroke="#1E293B" stroke-width="2.5"/>
        <line x1="-16" y1="-16" x2="16" y2="-16" stroke="#1E293B" stroke-width="2"/>
        <line x1="-16" y1="-4" x2="16" y2="-4" stroke="#1E293B" stroke-width="2"/>
        <line x1="-16" y1="8" x2="6" y2="8" stroke="#1E293B" stroke-width="2"/>
        <!-- Magnifying glass overlay -->
        <circle cx="20" cy="14" r="14" fill="#E9D5FF" stroke="#1E293B" stroke-width="2.4"/>
        <line x1="30" y1="24" x2="42" y2="36" stroke="#1E293B" stroke-width="3.2" stroke-linecap="round"/>
      </g>

      <!-- Worker Title & Role -->
      <g transform="translate(40, -55)">
        <text x="0" y="0" class="hand-title" font-size="21" font-weight="900" fill="#0F172A" text-anchor="middle">
          Knowledge Retrieval Agent
        </text>
        <text x="0" y="22" font-size="13" font-weight="800" fill="#92400E" text-anchor="middle">
          PHÂN HỆ TRÍCH XUẤT TRI THỨC &amp; QUY CHUẨN (HYBRID RAG)
        </text>
      </g>

      <!-- Sub-task tags -->
      <g transform="translate(40, 18)">
        <!-- Tag 1 -->
        <g transform="translate(-150, 0)">
          <rect x="-85" y="-18" width="170" height="36" rx="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
          <text x="0" y="5" class="pill-text" font-size="12" fill="#1E293B" text-anchor="middle">9 Carrier SOP Corpus</text>
        </g>
        <!-- Tag 2 -->
        <g transform="translate(30, 0)">
          <rect x="-85" y="-18" width="170" height="36" rx="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
          <text x="0" y="5" class="pill-text" font-size="12" fill="#1E293B" text-anchor="middle">Decree 47 &amp; Postal Law</text>
        </g>
        <!-- Tag 3 -->
        <g transform="translate(195, 0)">
          <rect x="-70" y="-18" width="140" height="36" rx="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
          <text x="0" y="5" class="pill-text" font-size="12" fill="#1E293B" text-anchor="middle">Dense + BM25</text>
        </g>
      </g>

      <text x="40" y="78" class="mono" font-size="11.5" font-weight="700" fill="#78350F" text-anchor="middle">
        &#10148; Outputs verified legal policy text + traceable statutory citations
      </text>
    </g>
  </g>''')

    # Worker 2: Operational Tool Agent (Middle, y: 720)
    w2_x, w2_y = 1380, 720
    lines.append(f'''
  <!-- =========================================================================
       WORKER 2: OPERATIONAL TOOL AGENT (DETERMINISTIC TOOLS)
       ========================================================================= -->
  <g id="Worker_Operational_Agent">
    <g transform="translate({w2_x}, {w2_y})">
      <rect x="-300" y="-105" width="600" height="210" rx="26" fill="#E9D5FF" stroke="#1E293B" stroke-width="3.5"/>

      <!-- Icon: Logistics Box + Interlocking Gears -->
      <g transform="translate(-215, 0)">
        <!-- Parcel box -->
        <polygon points="-24,-6 0,-18 24,-6 0,6" fill="#FEF08A" stroke="#1E293B" stroke-width="2.4" stroke-linejoin="round"/>
        <polygon points="-24,-6 0,6 0,26 -24,14" fill="#FDE047" stroke="#1E293B" stroke-width="2.4" stroke-linejoin="round"/>
        <polygon points="24,-6 0,6 0,26 24,14" fill="#FEF9C3" stroke="#1E293B" stroke-width="2.4" stroke-linejoin="round"/>
        <!-- Gear -->
        <circle cx="26" cy="-12" r="14" fill="#DDD6FE" stroke="#1E293B" stroke-width="2.2"/>
        <circle cx="26" cy="-12" r="4.5" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.8"/>
      </g>

      <!-- Worker Title & Role -->
      <g transform="translate(40, -55)">
        <text x="0" y="0" class="hand-title" font-size="21" font-weight="900" fill="#0F172A" text-anchor="middle">
          Operational Tool Agent
        </text>
        <text x="0" y="22" font-size="13" font-weight="800" fill="#581C87" text-anchor="middle">
          PHÂN HỆ THỰC THI CÔNG CỤ &amp; SOẠN THẢO NGHIỆP VỤ
        </text>
      </g>

      <!-- Sub-task tags -->
      <g transform="translate(40, 18)">
        <!-- Tag 1 -->
        <g transform="translate(-150, 0)">
          <rect x="-85" y="-18" width="170" height="36" rx="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
          <text x="0" y="5" class="pill-text" font-size="12" fill="#1E293B" text-anchor="middle">Live Tracking API</text>
        </g>
        <!-- Tag 2 -->
        <g transform="translate(30, 0)">
          <rect x="-85" y="-18" width="170" height="36" rx="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
          <text x="0" y="5" class="pill-text" font-size="12" fill="#1E293B" text-anchor="middle">IATA Tariff V/6000</text>
        </g>
        <!-- Tag 3 -->
        <g transform="translate(195, 0)">
          <rect x="-70" y="-18" width="140" height="36" rx="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
          <text x="0" y="5" class="pill-text" font-size="12" fill="#1E293B" text-anchor="middle">Action Draft DTO</text>
        </g>
      </g>

      <text x="40" y="78" class="mono" font-size="11.5" font-weight="700" fill="#4C1D95" text-anchor="middle">
        &#10148; Synthesizes deterministic JSON Draft DTO (Strictly non-mutating)
      </text>
    </g>
  </g>''')

    # Worker 3: Validation Critic Agent (Bottom, y: 1130)
    w3_x, w3_y = 1380, 1130
    lines.append(f'''
  <!-- =========================================================================
       WORKER 3: VALIDATION CRITIC AGENT (SAFETY GATEKEEPER)
       ========================================================================= -->
  <g id="Worker_Validation_Agent">
    <g transform="translate({w3_x}, {w3_y})">
      <rect x="-300" y="-105" width="600" height="210" rx="26" fill="#F1F5F9" stroke="#1E293B" stroke-width="3.5"/>

      <!-- Icon: Security Shield + Checkmark -->
      <g transform="translate(-215, 0)">
        <path d="M 0 -28 C -22 -28 -28 -12 -28 6 C -28 24 0 34 0 34 C 0 34 28 24 28 6 C 28 -12 22 -28 0 -28 Z" fill="#DDD6FE" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M 0 -28 C 22 -28 28 -12 28 6 C 28 24 0 34 0 34 Z" fill="#FDE047" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
        <!-- Checkmark inside -->
        <path d="M -10 4 L -2 12 L 14 -4" fill="none" stroke="#1E293B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </g>

      <!-- Worker Title & Role -->
      <g transform="translate(40, -55)">
        <text x="0" y="0" class="hand-title" font-size="21" font-weight="900" fill="#0F172A" text-anchor="middle">
          Validation Critic Agent
        </text>
        <text x="0" y="22" font-size="13" font-weight="800" fill="#991B1B" text-anchor="middle">
          PHÂN HỆ THẨM ĐỊNH ĐỘC LẬP &amp; PHẢN BIỆN AN TOÀN
        </text>
      </g>

      <!-- Sub-task tags -->
      <g transform="translate(40, 18)">
        <!-- Tag 1 -->
        <g transform="translate(-150, 0)">
          <rect x="-85" y="-18" width="170" height="36" rx="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
          <text x="0" y="5" class="pill-text" font-size="12" fill="#1E293B" text-anchor="middle">Limits (&#x2264;70kg, 150cm)</text>
        </g>
        <!-- Tag 2 -->
        <g transform="translate(30, 0)">
          <rect x="-85" y="-18" width="170" height="36" rx="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
          <text x="0" y="5" class="pill-text" font-size="12" fill="#1E293B" text-anchor="middle">Dangerous Goods Block</text>
        </g>
        <!-- Tag 3 -->
        <g transform="translate(195, 0)">
          <rect x="-70" y="-18" width="140" height="36" rx="10" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
          <text x="0" y="5" class="pill-text" font-size="12" fill="#1E293B" text-anchor="middle">COD Fraud &#x2265;15M</text>
        </g>
      </g>

      <text x="40" y="78" class="mono" font-size="11.5" font-weight="700" fill="#B91C1C" text-anchor="middle">
        &#10148; Enforces 5 Operational Gatekeepers &amp; triggers HITL State Interruption
      </text>
    </g>
  </g>''')

    # =========================================================================
    # COLUMN 4: HUMAN-IN-THE-LOOP (HITL) GATE & BACKEND ACTUATION (Right, x: 1980 -> 2320)
    # =========================================================================
    hitl_x, hitl_y = 2080, 720
    lines.append(f'''
  <!-- =========================================================================
       COLUMN 4: HUMAN-IN-THE-LOOP (HITL) GATE & BACKEND ACTUATION
       ========================================================================= -->
  <g id="Col_HITL_Backend">
    <!-- HITL Card -->
    <g transform="translate({hitl_x}, {hitl_y})">
      <rect x="-140" y="-190" width="280" height="380" rx="30" fill="#FFF1F2" stroke="#E11D48" stroke-width="3.5"/>

      <!-- Stamp / Seal Icon -->
      <g transform="translate(0, -125)">
        <circle cx="0" cy="0" r="28" fill="#FFFFFF" stroke="#E11D48" stroke-width="2.6"/>
        <path d="M -12 6 L 12 -18 M -12 -18 L 12 6" stroke="#E11D48" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="0" cy="0" r="14" fill="#FCE7F3" stroke="#E11D48" stroke-width="1.8"/>
      </g>

      <text x="0" y="-70" class="hand-title" font-size="20" font-weight="900" fill="#9F1239" text-anchor="middle">
        Human-in-the-Loop
      </text>
      <text x="0" y="-48" font-size="12.5" font-weight="800" fill="#BE185D" text-anchor="middle">
        CỔNG PHÊ DUYỆT CON NGƯỜI
      </text>

      <!-- Interrupt Rule Box -->
      <g transform="translate(0, 10)">
        <rect x="-120" y="-35" width="240" height="70" rx="14" fill="#FFFFFF" stroke="#FDA4AF" stroke-width="2.0"/>
        <text x="0" y="-12" font-size="12" font-weight="900" fill="#9F1239" text-anchor="middle">
          State Mutation Interruption
        </text>
        <text x="0" y="8" font-size="11" font-weight="700" fill="#475569" text-anchor="middle">
          Requires user signature on
        </text>
        <text x="0" y="24" class="mono" font-size="11" font-weight="800" fill="#BE185D" text-anchor="middle">
          Cancel / Address / Claims
        </text>
      </g>

      <!-- Execution Target Box -->
      <g transform="translate(0, 115)">
        <rect x="-120" y="-30" width="240" height="60" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.0"/>
        <text x="0" y="-8" font-size="12" font-weight="900" fill="#0F172A" text-anchor="middle">
          Backend API Actuation
        </text>
        <text x="0" y="12" class="mono" font-size="10.5" font-weight="800" fill="#059669" text-anchor="middle">
          &#10003; Commits to ai_agent_audit_logs
        </text>
      </g>
    </g>

    <!-- Arrow from Validation Agent up into HITL -->
    <path d="M {w3_x + 300} {w3_y - 20} Q 1920 1050 {hitl_x - 140} {hitl_y + 80}" fill="none" stroke="#E11D48" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="9,7"/>
    <polygon points="{hitl_x - 140},{hitl_y + 80} {hitl_x - 156},{hitl_y + 88} {hitl_x - 156},{hitl_y + 72}" fill="#E11D48"/>
    <text x="1850" y="930" class="mono" font-size="11" font-weight="900" fill="#E11D48" text-anchor="middle">[INTERRUPT_HITL]</text>

    <!-- Arrow from Operational Agent into HITL -->
    <path d="M {w2_x + 300} {w2_y} L {hitl_x - 140} {hitl_y}" fill="none" stroke="#1E293B" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="9,7"/>
    <polygon points="{hitl_x - 140},{hitl_y} {hitl_x - 156},{hitl_y - 8} {hitl_x - 156},{hitl_y + 8}" fill="#1E293B"/>
    <text x="1850" y="{hitl_y - 12}" class="mono" font-size="11" font-weight="800" fill="#1E293B" text-anchor="middle">Action Payload</text>

    <!-- Arrow from HITL loopback to Supervisor for response aggregation -->
    <path d="M {hitl_x} {hitl_y - 190} Q {hitl_x} 140 {sup_x} 140 Q {sup_x} 420 {sup_x} {sup_y - 190}" fill="none" stroke="#059669" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="9,7"/>
    <polygon points="{sup_x},{sup_y - 190} {sup_x - 8},{sup_y - 206} {sup_x + 8},{sup_y - 206}" fill="#059669"/>
    <text x="1380" y="130" class="mono" font-size="12" font-weight="900" fill="#059669" text-anchor="middle">
      Verified Execution State Return &#x2794; Supervisor Synthesis &amp; SSE Stream
    </text>
  </g>

</svg>''')

    svg_content = "\n".join(lines)
    return svg_content

def main():
    svg_content = build_svg()

    # Validate XML Syntax
    try:
        ET.fromstring(svg_content)
        print("XML Syntax Validation: PASSED (Well-formed XML)")
    except ET.ParseError as e:
        print(f"XML Validation FAILED: {e}")
        return 1

    # Write SVG to target file
    os.makedirs(os.path.dirname(SVG_OUTPUT), exist_ok=True)
    with open(SVG_OUTPUT, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Successfully generated {SVG_OUTPUT} ({len(svg_content.encode('utf-8'))} bytes)")

    # Render PNG using Chrome Headless at 300 DPI (width=2400, height=1500, scale=1.666 -> ~4000x2500)
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    abs_svg = os.path.abspath(SVG_OUTPUT)
    abs_png = os.path.abspath(PNG_OUTPUT)

    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--force-device-scale-factor=1.6667",
        f"--screenshot={abs_png}",
        "--window-size=2400,1500",
        f"file://{abs_svg}"
    ]

    print("Rendering publication-grade 300 DPI PNG via Headless Chrome...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(abs_png):
        size = os.path.getsize(abs_png)
        print(f"Successfully rendered {PNG_OUTPUT} ({size} bytes, 4000x2500 px)")
    else:
        print(f"Chrome screenshot error: {res.stderr}")
        return 1

    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
