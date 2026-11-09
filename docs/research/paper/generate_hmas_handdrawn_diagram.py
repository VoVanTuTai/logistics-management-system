#!/usr/bin/env python3
"""
generate_hmas_handdrawn_diagram.py
Generates the publication-grade System Architecture Blueprint matching:
1. The EXACT prompt visual style: Flat, hand-drawn digital illustration,
   bold black outlines (2.5 - 3.5px), pastel yellow (#FEF08A), pastel purple (#E9D5FF),
   light grey (#F1F5F9), pure white background, radial distributed clusters with curved dashed arrows.
2. 100% FAITHFUL to the actual research project and paper:
   - Center: LangGraph HMAS Orchestrator (Supervisor Agent - Google Gemini 2.0 Flash)
   - Top: Knowledge Retrieval & Hybrid RAG (Alibaba Qwen 3.8 27B) -> 9 Carrier SOPs, Decree 47 & Postal Law, Dual MRL & BM25, Stacked Candidates
   - Top-Left: Client Touchpoints & PII Masking -> Merchant Web Portal, Customer App (:8082), Guest Tracking Portal, PII Masking (0912***)
   - Right: Operational Tool Execution (OpenAI GPT-OSS 120B) -> Live Tracking API, IATA Volumetric Pricing, Action Draft DTO, 24h Dispute Claims
   - Bottom-Right: Validation Critic & HITL Gate (NVIDIA Nemotron 3.5) -> Physical Limits (<=70kg), Dangerous Goods Block, COD Fraud Check (>=15M), HITL Interrupt
   - Bottom-Left: Core Backend Mesh & Storage -> API Gateway BFF, PostgreSQL + pgvector, ai_agent_audit_logs, MinIO S3 Evidence
"""

import os
import subprocess
import xml.etree.ElementTree as ET

SVG_OUTPUT = "docs/research/paper/diagrams/hmas-handdrawn-architecture.svg"
PNG_OUTPUT = "docs/research/paper/diagrams/hmas-handdrawn-architecture.png"

def build_svg():
    W = 2400
    H = 1700
    cx, cy = 1200, 850

    lines = []
    lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&amp;family=JetBrains+Mono:wght@700;800&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }}
      .hand-title {{ font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; }}
      .pill-text {{ font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; }}
      .mono {{ font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-weight: 800; }}
    </style>
  </defs>

  <!-- PURE CLEAN WHITE BACKGROUND -->
  <rect width="{W}" height="{H}" fill="#FFFFFF"/>

  <!-- MASTER HEADER -->
  <g transform="translate({cx}, 55)">
    <text x="0" y="0" class="hand-title" font-size="34" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="-0.02em">
      Heterogeneous Multi-Agent Logistics System
    </text>
  </g>

  <!-- DECORATIVE HAND-DRAWN SPARKLES -->
  <g id="Sparkles" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round" fill="none">
    <path d="M 680 220 L 680 240 M 670 230 L 690 230"/>
    <path d="M 1720 250 L 1720 270 M 1710 260 L 1730 260"/>
    <path d="M 1120 700 L 1120 716 M 1112 708 L 1128 708" stroke="#FDE047"/>
    <path d="M 1280 990 L 1280 1006 M 1272 998 L 1288 998" stroke="#DDD6FE"/>
    <path d="M 320 950 L 320 970 M 310 960 L 330 960"/>
    <path d="M 2150 1200 L 2150 1220 M 2140 1210 L 2160 1210"/>
  </g>

  <!-- =========================================================================
       5 MAIN CURVED DASHED ARROWS FROM CENTER OVAL TO CLUSTERS
       ========================================================================= -->
  <g id="Radial_Connectors" stroke="#1E293B" stroke-width="3.2" stroke-linecap="round" fill="none">
    <!-- 1. Center -> Top (Knowledge Retrieval & Hybrid RAG) -->
    <path d="M 1200 740 Q 1180 570 1200 440" stroke-dasharray="9,7"/>
    <polygon points="1200,432 1192,448 1208,448" fill="#1E293B"/>

    <!-- 2. Center -> Top-Left (Client Touchpoints & PII Masking) -->
    <path d="M 1030 800 Q 820 710 660 560" stroke-dasharray="9,7"/>
    <polygon points="652,554 669,559 660,573" fill="#1E293B"/>

    <!-- 3. Center -> Right (Operational Tool Execution) -->
    <path d="M 1390 850 Q 1550 850 1700 850" stroke-dasharray="9,7"/>
    <polygon points="1712,850 1696,842 1696,858" fill="#1E293B"/>

    <!-- 4. Center -> Bottom-Left (Core Backend Mesh & Storage) -->
    <path d="M 1050 910 Q 840 1030 680 1140" stroke-dasharray="9,7"/>
    <polygon points="672,1146 680,1130 691,1143" fill="#1E293B"/>

    <!-- 5. Center -> Bottom-Right (Validation Critic & HITL Gate) -->
    <path d="M 1350 915 Q 1520 1020 1640 1140" stroke-dasharray="9,7"/>
    <polygon points="1648,1146 1629,1142 1640,1129" fill="#1E293B"/>
  </g>

  <!-- =========================================================================
       CENTER: LANGGRAPH HMAS ORCHESTRATOR (SUPERVISOR - GOOGLE GEMINI)
       ========================================================================= -->
  <g id="Center_Supervisor_HMAS" transform="translate({cx}, {cy})">
    <!-- Offset decorative outer line -->
    <ellipse cx="2" cy="3" rx="208" ry="106" fill="none" stroke="#E2E8F0" stroke-width="3" stroke-dasharray="6,6"/>

    <!-- Main Light Grey Oval -->
    <ellipse cx="0" cy="0" rx="205" ry="102" fill="#F1F5F9" stroke="#1E293B" stroke-width="3.8"/>

    <!-- Inner decorative border -->
    <ellipse cx="0" cy="0" rx="192" ry="90" fill="none" stroke="#CBD5E1" stroke-width="1.8" stroke-dasharray="5,4"/>

    <!-- Supervisor Badge & AI Star Core -->
    <g transform="translate(0, -36)">
      <circle cx="0" cy="0" r="16" fill="#FEF08A" stroke="#1E293B" stroke-width="2.6"/>
      <path d="M 0 -24 L 0 -16 M 0 16 L 0 24 M -24 0 L -16 0 M 16 0 L 24 0" stroke="#1E293B" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="-34" cy="-6" r="5" fill="#E9D5FF" stroke="#1E293B" stroke-width="2"/>
      <circle cx="34" cy="-6" r="5" fill="#E9D5FF" stroke="#1E293B" stroke-width="2"/>
    </g>

    <text x="0" y="10" class="hand-title" font-size="22" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="-0.01em">
      LangGraph HMAS Orchestrator
    </text>
    <text x="0" y="32" font-size="12.5" font-weight="800" fill="#1D4ED8" text-anchor="middle">
      SUPERVISOR: Google Gemini 2.0 Flash
    </text>
    <text x="0" y="50" class="mono" font-size="10.5" font-weight="700" fill="#64748B" text-anchor="middle">
      Shared State S_t = (M_t, U_t, I_t, D_t, V_t, R_t)
    </text>
  </g>''')

    # =========================================================================
    # CLUSTER 1 (TOP): KNOWLEDGE RETRIEVAL & HYBRID RAG (ALIBABA QWEN 27B)
    # =========================================================================
    top_x, top_y = 1200, 310
    lines.append(f'''
  <!-- =========================================================================
       CLUSTER 1 (TOP): KNOWLEDGE RETRIEVAL & HYBRID RAG
       ========================================================================= -->
  <g id="Cluster_Knowledge_RAG">
    <!-- Connecting dashed branches to pills -->
    <g stroke="#1E293B" stroke-width="2.5" stroke-dasharray="6,5" stroke-linecap="round" fill="none">
      <path d="M 1070 {top_y - 50} Q 980 230 940 185"/>
      <path d="M 1150 {top_y - 60} Q 1170 230 1180 185"/>
      <path d="M 1250 {top_y - 60} Q 1330 230 1420 185"/>
      <path d="M 1200 {top_y - 60} L 1200 95"/>
    </g>

    <!-- Sub-Pill 1: 9 Carrier SOPs (Pastel Purple) -->
    <g transform="translate(930, 150)">
      <rect x="-85" y="-24" width="170" height="48" rx="24" fill="#E9D5FF" stroke="#1E293B" stroke-width="3"/>
      <rect x="-70" y="-10" width="16" height="20" rx="3" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <line x1="-66" y1="-4" x2="-58" y2="-4" stroke="#1E293B" stroke-width="1.8"/>
      <line x1="-66" y1="1" x2="-58" y2="1" stroke="#1E293B" stroke-width="1.8"/>
      <text x="12" y="6" class="pill-text" font-size="15" fill="#1E293B" text-anchor="middle">9 Carrier SOPs</text>
    </g>

    <!-- Sub-Pill 2: Decree 47 & Postal Law (Light Grey) -->
    <g transform="translate(1180, 150)">
      <rect x="-115" y="-24" width="230" height="48" rx="24" fill="#F1F5F9" stroke="#1E293B" stroke-width="3"/>
      <!-- Balance scale icon -->
      <line x1="-96" y1="-8" x2="-80" y2="-8" stroke="#1E293B" stroke-width="2"/>
      <line x1="-88" y1="-8" x2="-88" y2="10" stroke="#1E293B" stroke-width="2"/>
      <line x1="-94" y1="10" x2="-82" y2="10" stroke="#1E293B" stroke-width="2"/>
      <text x="12" y="6" class="pill-text" font-size="14.5" fill="#1E293B" text-anchor="middle">Decree 47 &amp; Postal Law</text>
    </g>

    <!-- Sub-Pill 3: Dual MRL & BM25 (Pastel Yellow) -->
    <g transform="translate(1440, 150)">
      <rect x="-105" y="-24" width="210" height="48" rx="24" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <!-- Search vector icon -->
      <circle cx="-82" cy="-2" r="7" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <line x1="-77" y1="3" x2="-71" y2="9" stroke="#1E293B" stroke-width="2.4" stroke-linecap="round"/>
      <text x="12" y="6" class="pill-text" font-size="15" fill="#1E293B" text-anchor="middle">Dual MRL &amp; BM25</text>
    </g>

    <!-- Sub-Pill 4: Stacked Candidates (Pastel Purple) -->
    <g transform="translate(1200, 70)">
      <rect x="-95" y="-22" width="190" height="44" rx="22" fill="#E9D5FF" stroke="#1E293B" stroke-width="3"/>
      <rect x="-76" y="-7" width="14" height="14" rx="2" fill="#FEF08A" stroke="#1E293B" stroke-width="1.8"/>
      <rect x="-72" y="-11" width="14" height="14" rx="2" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.6"/>
      <text x="10" y="5" class="pill-text" font-size="14" fill="#1E293B" text-anchor="middle">Stacked Candidates</text>
    </g>

    <!-- Main Card: Knowledge Retrieval & Hybrid RAG -->
    <g transform="translate({top_x}, {top_y})">
      <rect x="-240" y="-58" width="480" height="116" rx="26" fill="#FEF9C3" stroke="#1E293B" stroke-width="3.5"/>

      <!-- Hand-drawn Illustration: SOP Book + Vector Glass -->
      <g transform="translate(-155, 0)">
        <!-- Book Icon -->
        <g transform="translate(-16, -2)">
          <path d="M -22 -16 C -12 -18 0 -14 0 -14 C 0 -14 12 -18 22 -16 L 22 18 C 12 16 0 20 0 20 C 0 20 -12 16 -22 18 Z" fill="#FDE047" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
          <line x1="0" y1="-14" x2="0" y2="20" stroke="#1E293B" stroke-width="2.4"/>
          <!-- Page lines -->
          <line x1="-16" y1="-6" x2="-6" y2="-5" stroke="#1E293B" stroke-width="1.8"/>
          <line x1="-16" y1="2" x2="-6" y2="3" stroke="#1E293B" stroke-width="1.8"/>
          <line x1="6" y1="-5" x2="16" y2="-6" stroke="#1E293B" stroke-width="1.8"/>
          <line x1="6" y1="3" x2="16" y2="2" stroke="#1E293B" stroke-width="1.8"/>
        </g>
        <!-- Vector Magnifying Glass (Purple) -->
        <g transform="translate(26, 12)">
          <circle cx="0" cy="0" r="13" fill="#E9D5FF" stroke="#1E293B" stroke-width="2.5"/>
          <circle cx="0" cy="0" r="7" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.6"/>
          <line x1="9" y1="9" x2="19" y2="19" stroke="#1E293B" stroke-width="3.4" stroke-linecap="round"/>
        </g>
      </g>

      <!-- Cluster Title -->
      <g transform="translate(32, 0)">
        <text x="0" y="-8" class="hand-title" font-size="20.5" font-weight="900" fill="#0F172A" text-anchor="middle">
          Knowledge Retrieval &amp; Hybrid RAG
        </text>
        <text x="0" y="14" font-size="13" font-weight="800" fill="#0369A1" text-anchor="middle">
          WORKER: Alibaba Qwen 3.8 27B (Groq LPU)
        </text>
        <text x="0" y="32" class="mono" font-size="11" font-weight="700" fill="#64748B" text-anchor="middle">
          Score: S(q,d) = 0.70·Cos(e_q, e_d) + 0.30·BM25
        </text>
      </g>
    </g>
  </g>''')

    # =========================================================================
    # CLUSTER 2 (TOP-LEFT): CLIENT TOUCHPOINTS & PII MASKING
    # =========================================================================
    clt_x, clt_y = 500, 480
    lines.append(f'''
  <!-- =========================================================================
       CLUSTER 2 (TOP-LEFT): CLIENT TOUCHPOINTS & PII MASKING
       ========================================================================= -->
  <g id="Cluster_Client_Touchpoints">
    <!-- Connecting dashed branches to pills -->
    <g stroke="#1E293B" stroke-width="2.5" stroke-dasharray="6,5" stroke-linecap="round" fill="none">
      <path d="M {clt_x - 170} {clt_y - 20} Q 320 400 230 350"/>
      <path d="M {clt_x - 190} {clt_y + 15} Q 280 500 210 520"/>
      <path d="M {clt_x - 130} {clt_y + 55} Q 260 620 220 680"/>
      <path d="M {clt_x - 70} {clt_y - 55} Q 400 320 390 260"/>
    </g>

    <!-- Sub-Pill 1: Merchant Web Portal -->
    <g transform="translate(200, 340)">
      <rect x="-95" y="-24" width="190" height="48" rx="24" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <!-- Laptop icon -->
      <rect x="-76" y="-8" width="18" height="12" rx="2" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <line x1="-80" y1="7" x2="-54" y2="7" stroke="#1E293B" stroke-width="2.4"/>
      <text x="14" y="6" class="pill-text" font-size="14.5" fill="#1E293B" text-anchor="middle">Merchant Web Portal</text>
    </g>

    <!-- Sub-Pill 2: Customer App (iOS / Android) -->
    <g transform="translate(190, 520)">
      <rect x="-110" y="-24" width="220" height="48" rx="24" fill="#E9D5FF" stroke="#1E293B" stroke-width="3"/>
      <!-- Mobile icon -->
      <rect x="-90" y="-12" width="14" height="24" rx="3" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <circle cx="-83" cy="8" r="1.5" fill="#1E293B"/>
      <text x="14" y="6" class="pill-text" font-size="14" fill="#1E293B" text-anchor="middle">Customer App (iOS/Android)</text>
    </g>

    <!-- Sub-Pill 3: Guest Tracking Portal -->
    <g transform="translate(200, 690)">
      <rect x="-95" y="-24" width="190" height="48" rx="24" fill="#F1F5F9" stroke="#1E293B" stroke-width="3"/>
      <!-- Public world icon -->
      <circle cx="-72" cy="0" r="9" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <line x1="-81" y1="0" x2="-63" y2="0" stroke="#1E293B" stroke-width="1.8"/>
      <ellipse cx="-72" cy="0" rx="4" ry="9" fill="none" stroke="#1E293B" stroke-width="1.6"/>
      <text x="14" y="6" class="pill-text" font-size="14.5" fill="#1E293B" text-anchor="middle">Guest Tracking Portal</text>
    </g>

    <!-- Sub-Pill 4: PII Masking (0912***) -->
    <g transform="translate(390, 240)">
      <rect x="-105" y="-22" width="210" height="44" rx="22" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <text x="0" y="5" class="mono" font-size="13" font-weight="900" fill="#DC2626" text-anchor="middle">🔒 PII Mask: 0912***678</text>
    </g>

    <!-- Main Card: Client Touchpoints & PII Masking -->
    <g transform="translate({clt_x}, {clt_y})">
      <rect x="-225" y="-55" width="450" height="110" rx="26" fill="#FEF08A" stroke="#1E293B" stroke-width="3.5"/>

      <!-- Hand-drawn Illustration: Browser + Phone + Shield Lock -->
      <g transform="translate(-145, 0)">
        <!-- Web Browser -->
        <g transform="translate(-16, -4)">
          <rect x="-24" y="-18" width="44" height="32" rx="4" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.4"/>
          <line x1="-24" y1="-8" x2="20" y2="-8" stroke="#1E293B" stroke-width="1.8"/>
          <circle cx="-18" cy="-13" r="1.6" fill="#1E293B"/>
          <circle cx="-12" cy="-13" r="1.6" fill="#1E293B"/>
        </g>
        <!-- Smartphone -->
        <g transform="translate(24, 2)">
          <rect x="-9" y="-16" width="18" height="30" rx="3" fill="#E9D5FF" stroke="#1E293B" stroke-width="2.2"/>
          <rect x="-6" y="-12" width="12" height="20" rx="1.5" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.2"/>
        </g>
        <!-- Lock Mask Icon -->
        <g transform="translate(4, 14)">
          <rect x="-9" y="-6" width="18" height="14" rx="3" fill="#FDE047" stroke="#1E293B" stroke-width="2.2"/>
          <path d="M -5 -6 L -5 -11 C -5 -14 5 -14 5 -11 L 5 -6" fill="none" stroke="#1E293B" stroke-width="2.2"/>
        </g>
      </g>

      <!-- Cluster Title -->
      <g transform="translate(32, 0)">
        <text x="0" y="-8" class="hand-title" font-size="20.5" font-weight="900" fill="#0F172A" text-anchor="middle">
          Client Touchpoints &amp; PII Masking
        </text>
        <text x="0" y="14" font-size="13" font-weight="800" fill="#1D4ED8" text-anchor="middle">
          Omnichannel Access • Dynamic Obfuscation
        </text>
        <text x="0" y="32" class="mono" font-size="11" font-weight="700" fill="#64748B" text-anchor="middle">
          SSE Token Streaming • TTFT &lt; 420ms
        </text>
      </g>
    </g>
  </g>''')

    # =========================================================================
    # CLUSTER 3 (RIGHT): OPERATIONAL TOOL EXECUTION (OPENAI GPT-OSS 120B)
    # =========================================================================
    ops_x, ops_y = 1920, 850
    lines.append(f'''
  <!-- =========================================================================
       CLUSTER 3 (RIGHT): OPERATIONAL TOOL EXECUTION
       ========================================================================= -->
  <g id="Cluster_Operational_Tools">
    <!-- Connecting dashed branches to pills -->
    <g stroke="#1E293B" stroke-width="2.5" stroke-dasharray="6,5" stroke-linecap="round" fill="none">
      <path d="M {ops_x + 190} {ops_y - 35} Q 2120 730 2200 680"/>
      <path d="M {ops_x + 210} {ops_y - 12} Q 2140 800 2220 790"/>
      <path d="M {ops_x + 210} {ops_y + 15} Q 2140 900 2210 920"/>
      <path d="M {ops_x + 190} {ops_y + 40} Q 2120 1010 2190 1040"/>
    </g>

    <!-- Sub-Pill 1: Live Tracking API -->
    <g transform="translate(2250, 670)">
      <rect x="-85" y="-24" width="170" height="48" rx="24" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <!-- Pin / GPS icon -->
      <circle cx="-62" cy="-4" r="6" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <polygon points="-65,-2 -59,-2 -62,8" fill="#1E293B"/>
      <text x="14" y="6" class="pill-text" font-size="14.5" fill="#1E293B" text-anchor="middle">Live Tracking API</text>
    </g>

    <!-- Sub-Pill 2: IATA Volumetric Pricing -->
    <g transform="translate(2250, 790)">
      <rect x="-105" y="-24" width="210" height="48" rx="24" fill="#F1F5F9" stroke="#1E293B" stroke-width="3"/>
      <!-- Calculator / scale icon -->
      <rect x="-88" y="-12" width="18" height="22" rx="2" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <line x1="-83" y1="-6" x2="-75" y2="-6" stroke="#1E293B" stroke-width="1.8"/>
      <text x="12" y="6" class="pill-text" font-size="14.5" fill="#1E293B" text-anchor="middle">IATA Volumetric Pricing</text>
    </g>

    <!-- Sub-Pill 3: Action Draft DTO -->
    <g transform="translate(2240, 920)">
      <rect x="-85" y="-24" width="170" height="48" rx="24" fill="#E9D5FF" stroke="#1E293B" stroke-width="3"/>
      <!-- Code brackets icon -->
      <path d="M -68 -6 L -74 0 L -68 6 M -56 -6 L -50 0 L -56 6" fill="none" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round"/>
      <text x="12" y="6" class="pill-text" font-size="15" fill="#1E293B" text-anchor="middle">Action Draft DTO</text>
    </g>

    <!-- Sub-Pill 4: 24h Dispute Claims -->
    <g transform="translate(2230, 1045)">
      <rect x="-95" y="-24" width="190" height="48" rx="24" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <!-- Clock icon -->
      <circle cx="-70" cy="0" r="9" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <line x1="-70" y1="-5" x2="-70" y2="0" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="-70" y1="0" x2="-65" y2="3" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <text x="12" y="6" class="pill-text" font-size="14.5" fill="#1E293B" text-anchor="middle">24h Dispute Claims</text>
    </g>

    <!-- Main Card: Operational Tool Execution -->
    <g transform="translate({ops_x}, {ops_y})">
      <rect x="-230" y="-60" width="460" height="120" rx="26" fill="#E9D5FF" stroke="#1E293B" stroke-width="3.5"/>

      <!-- Hand-drawn Illustration: Logistics Parcel Box + Tool Gear -->
      <g transform="translate(-145, 0)">
        <!-- Parcel Carton Box (Pastel Yellow) -->
        <g transform="translate(-18, 0)">
          <!-- Box isometric / 2D perspective -->
          <polygon points="-20,-8 0,-18 20,-8 0,2" fill="#FEF08A" stroke="#1E293B" stroke-width="2.4" stroke-linejoin="round"/>
          <polygon points="-20,-8 0,2 0,20 -20,10" fill="#FDE047" stroke="#1E293B" stroke-width="2.4" stroke-linejoin="round"/>
          <polygon points="20,-8 0,2 0,20 20,10" fill="#FEF9C3" stroke="#1E293B" stroke-width="2.4" stroke-linejoin="round"/>
          <!-- Tape line -->
          <line x1="-10" y1="-13" x2="10" y2="-3" stroke="#1E293B" stroke-width="2"/>
        </g>
        <!-- Gear Icon (Purple) -->
        <g transform="translate(28, 8)">
          <circle cx="0" cy="0" r="14" fill="#DDD6FE" stroke="#1E293B" stroke-width="2.5"/>
          <circle cx="0" cy="0" r="5" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
          <!-- Teeth -->
          <rect x="-3" y="-19" width="6" height="5" rx="1" fill="#DDD6FE" stroke="#1E293B" stroke-width="1.8"/>
          <rect x="-3" y="14" width="6" height="5" rx="1" fill="#DDD6FE" stroke="#1E293B" stroke-width="1.8"/>
          <rect x="-19" y="-3" width="5" height="6" rx="1" fill="#DDD6FE" stroke="#1E293B" stroke-width="1.8"/>
          <rect x="14" y="-3" width="5" height="6" rx="1" fill="#DDD6FE" stroke="#1E293B" stroke-width="1.8"/>
        </g>
      </g>

      <!-- Cluster Title -->
      <g transform="translate(32, 0)">
        <text x="0" y="-8" class="hand-title" font-size="20.5" font-weight="900" fill="#0F172A" text-anchor="middle">
          Operational Tool Execution
        </text>
        <text x="0" y="14" font-size="13" font-weight="800" fill="#15803D" text-anchor="middle">
          WORKER: OpenAI GPT-OSS 120B (Groq LPU)
        </text>
        <text x="0" y="32" class="mono" font-size="11" font-weight="700" fill="#64748B" text-anchor="middle">
          Deterministic Tool Calling • Strict JSON Schema
        </text>
      </g>
    </g>
  </g>''')

    # =========================================================================
    # CLUSTER 4 (BOTTOM-RIGHT): VALIDATION CRITIC & HITL GATE (NVIDIA NEMOTRON 3.5)
    # =========================================================================
    val_x, val_y = 1780, 1260
    lines.append(f'''
  <!-- =========================================================================
       CLUSTER 4 (BOTTOM-RIGHT): VALIDATION CRITIC & HITL GATE
       ========================================================================= -->
  <g id="Cluster_Validation_HITL">
    <!-- Connecting dashed branches to pills -->
    <g stroke="#1E293B" stroke-width="2.5" stroke-dasharray="6,5" stroke-linecap="round" fill="none">
      <path d="M {val_x - 140} {val_y + 45} Q 1580 1390 1510 1450"/>
      <path d="M {val_x - 20} {val_y + 55} Q 1720 1420 1740 1480"/>
      <path d="M {val_x + 130} {val_y + 45} Q 1920 1380 2000 1440"/>
      <path d="M {val_x + 40} {val_y + 55} Q 1850 1400 1880 1360"/>
    </g>

    <!-- Sub-Pill 1: Physical Limits (<=70kg) -->
    <g transform="translate(1480, 1470)">
      <rect x="-95" y="-24" width="190" height="48" rx="24" fill="#E9D5FF" stroke="#1E293B" stroke-width="3"/>
      <!-- Weight kettlebell icon -->
      <rect x="-76" y="-6" width="16" height="16" rx="4" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <path d="M -72 -6 L -72 -10 C -72 -13 -64 -13 -64 -10 L -64 -6" fill="none" stroke="#1E293B" stroke-width="2"/>
      <text x="14" y="6" class="pill-text" font-size="14.5" fill="#1E293B" text-anchor="middle">Limits (≤70kg/150cm)</text>
    </g>

    <!-- Sub-Pill 2: Dangerous Goods Block -->
    <g transform="translate(1740, 1500)">
      <rect x="-95" y="-24" width="190" height="48" rx="24" fill="#F1F5F9" stroke="#1E293B" stroke-width="3"/>
      <!-- Warning triangle icon -->
      <polygon points="-75,8 -63,-12 -51,8" fill="#FEF08A" stroke="#1E293B" stroke-width="2" stroke-linejoin="round"/>
      <line x1="-63" y1="-4" x2="-63" y2="1" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
      <circle cx="-63" cy="5" r="1.2" fill="#1E293B"/>
      <text x="14" y="6" class="pill-text" font-size="14.5" fill="#1E293B" text-anchor="middle">Dangerous Goods Block</text>
    </g>

    <!-- Sub-Pill 3: COD Fraud Check (>=15M) -->
    <g transform="translate(2020, 1460)">
      <rect x="-105" y="-24" width="210" height="48" rx="24" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <!-- Dollar banknote icon -->
      <rect x="-86" y="-10" width="20" height="14" rx="2" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <circle cx="-76" cy="-3" r="2.5" fill="#1E293B"/>
      <text x="12" y="6" class="pill-text" font-size="14.5" fill="#1E293B" text-anchor="middle">COD Fraud (≥15M)</text>
    </g>

    <!-- Sub-Pill 4: HITL Interrupt Approval -->
    <g transform="translate(1920, 1340)">
      <rect x="-115" y="-22" width="230" height="44" rx="22" fill="#FCE7F3" stroke="#BE185D" stroke-width="3"/>
      <text x="0" y="5" class="mono" font-size="13" font-weight="900" fill="#BE185D" text-anchor="middle">⚠ HITL Interrupt: User Sign</text>
    </g>

    <!-- Main Card: Validation Critic & HITL Gate -->
    <g transform="translate({val_x}, {val_y})">
      <rect x="-225" y="-55" width="450" height="110" rx="26" fill="#FEF08A" stroke="#1E293B" stroke-width="3.5"/>

      <!-- Hand-drawn Illustration: Shield 5 Gatekeepers + Pen Signature -->
      <g transform="translate(-142, 0)">
        <!-- Security Shield (Purple & Yellow) -->
        <g transform="translate(-16, 0)">
          <path d="M 0 -22 C -18 -22 -22 -10 -22 4 C -22 18 0 26 0 26 Z" fill="#DDD6FE" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M 0 -22 C 18 -22 22 -10 22 4 C 22 18 0 26 0 26 Z" fill="#FDE047" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
          <line x1="0" y1="-22" x2="0" y2="26" stroke="#1E293B" stroke-width="2.4"/>
          <!-- Star emblem -->
          <circle cx="0" cy="0" r="4.5" fill="#1E293B"/>
        </g>
        <!-- Signature Pen / Stamp -->
        <g transform="translate(28, 4)">
          <!-- Quill / Pen diagonal -->
          <line x1="-12" y1="16" x2="16" y2="-16" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
          <polygon points="12,-12 16,-16 20,-12 16,-8" fill="#1E293B"/>
          <!-- Signature wave -->
          <path d="M -16 18 Q -10 14 -4 18 Q 2 22 8 18" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
        </g>
      </g>

      <!-- Cluster Title -->
      <g transform="translate(32, 0)">
        <text x="0" y="-8" class="hand-title" font-size="20.5" font-weight="900" fill="#0F172A" text-anchor="middle">
          Validation Critic &amp; HITL Gate
        </text>
        <text x="0" y="14" font-size="13" font-weight="800" fill="#9D174D" text-anchor="middle">
          CRITIC: NVIDIA Nemotron 3.5 Lightning
        </text>
        <text x="0" y="32" class="mono" font-size="11" font-weight="700" fill="#64748B" text-anchor="middle">
          5 Gatekeepers • Zero-Trust Interruption Gate
        </text>
      </g>
    </g>
  </g>''')

    # =========================================================================
    # CLUSTER 5 (BOTTOM-LEFT): CORE BACKEND MESH & STORAGE
    # =========================================================================
    bk_x, bk_y = 500, 1220
    lines.append(f'''
  <!-- =========================================================================
       CLUSTER 5 (BOTTOM-LEFT): CORE BACKEND MESH & STORAGE
       ========================================================================= -->
  <g id="Cluster_Backend_Storage">
    <!-- Connecting dashed branches to pills -->
    <g stroke="#1E293B" stroke-width="2.5" stroke-dasharray="6,5" stroke-linecap="round" fill="none">
      <path d="M {bk_x - 170} {bk_y - 20} Q 320 1170 230 1190"/>
      <path d="M {bk_x - 160} {bk_y + 35} Q 300 1320 250 1370"/>
      <path d="M {bk_x - 60} {bk_y + 55} Q 400 1420 440 1470"/>
      <path d="M {bk_x - 140} {bk_y - 45} Q 320 1090 270 1060"/>
    </g>

    <!-- Sub-Pill 1: API Gateway BFF -->
    <g transform="translate(190, 1190)">
      <rect x="-85" y="-24" width="170" height="48" rx="24" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <!-- Gateway arch icon -->
      <path d="M -68 8 L -68 -6 C -68 -14 -50 -14 -50 -6 L -50 8" fill="none" stroke="#1E293B" stroke-width="2.2"/>
      <text x="12" y="6" class="pill-text" font-size="14.5" fill="#1E293B" text-anchor="middle">API Gateway BFF</text>
    </g>

    <!-- Sub-Pill 2: PostgreSQL + pgvector -->
    <g transform="translate(240, 1370)">
      <rect x="-95" y="-24" width="190" height="48" rx="24" fill="#E9D5FF" stroke="#1E293B" stroke-width="3"/>
      <!-- Elephant / DB icon -->
      <ellipse cx="-72" cy="-4" rx="8" ry="6" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <ellipse cx="-72" cy="4" rx="8" ry="6" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <text x="12" y="6" class="pill-text" font-size="14.5" fill="#1E293B" text-anchor="middle">PostgreSQL + pgvector</text>
    </g>

    <!-- Sub-Pill 3: ai_agent_audit_logs -->
    <g transform="translate(460, 1480)">
      <rect x="-95" y="-24" width="190" height="48" rx="24" fill="#F1F5F9" stroke="#1E293B" stroke-width="3"/>
      <!-- Audit document icon -->
      <rect x="-76" y="-12" width="16" height="22" rx="2" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <line x1="-71" y1="-5" x2="-65" y2="-5" stroke="#1E293B" stroke-width="1.8"/>
      <line x1="-71" y1="0" x2="-65" y2="0" stroke="#1E293B" stroke-width="1.8"/>
      <line x1="-71" y1="5" x2="-65" y2="5" stroke="#1E293B" stroke-width="1.8"/>
      <text x="12" y="6" class="pill-text" font-size="14" fill="#1E293B" text-anchor="middle">ai_agent_audit_logs</text>
    </g>

    <!-- Sub-Pill 4: MinIO S3 Evidence -->
    <g transform="translate(260, 1060)">
      <rect x="-85" y="-22" width="170" height="44" rx="22" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <!-- Cloud S3 icon -->
      <path d="M -68 3 C -72 3 -74 0 -72 -3 C -71 -7 -65 -8 -62 -4 C -60 -7 -54 -6 -53 -2 C -50 -2 -50 3 -54 3 Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.8"/>
      <text x="10" y="5" class="pill-text" font-size="14" fill="#1E293B" text-anchor="middle">MinIO S3 Evidence</text>
    </g>

    <!-- Main Card: Core Backend Mesh & Storage -->
    <g transform="translate({bk_x}, {bk_y})">
      <rect x="-225" y="-55" width="450" height="110" rx="26" fill="#F1F5F9" stroke="#1E293B" stroke-width="3.5"/>

      <!-- Hand-drawn Illustration: Gateway Portal + Database Stack -->
      <g transform="translate(-142, 0)">
        <!-- Database Disk Stack (Yellow) -->
        <g transform="translate(-18, 12)">
          <path d="M -18 0 L -18 12 C -18 18 18 18 18 12 L 18 0" fill="#FDE047" stroke="#1E293B" stroke-width="2.2"/>
          <ellipse cx="0" cy="0" rx="18" ry="7" fill="#FEF9C3" stroke="#1E293B" stroke-width="2.2"/>
        </g>
        <g transform="translate(-18, -2)">
          <path d="M -18 0 L -18 12 C -18 18 18 18 18 12 L 18 0" fill="#FDE047" stroke="#1E293B" stroke-width="2.2"/>
          <ellipse cx="0" cy="0" rx="18" ry="7" fill="#FEF9C3" stroke="#1E293B" stroke-width="2.2"/>
        </g>
        <!-- Gateway Arch (Purple) -->
        <g transform="translate(26, 2)">
          <path d="M -16 18 L -16 -4 C -16 -16 16 -16 16 -4 L 16 18" fill="#DDD6FE" stroke="#1E293B" stroke-width="2.4"/>
          <line x1="-20" y1="18" x2="20" y2="18" stroke="#1E293B" stroke-width="2.6" stroke-linecap="round"/>
          <circle cx="0" cy="-2" r="3" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.8"/>
        </g>
      </g>

      <!-- Cluster Title -->
      <g transform="translate(32, 0)">
        <text x="0" y="-8" class="hand-title" font-size="20.5" font-weight="900" fill="#0F172A" text-anchor="middle">
          Core Backend Mesh &amp; Storage
        </text>
        <text x="0" y="14" font-size="13" font-weight="800" fill="#1E3A8A" text-anchor="middle">
          NestJS API Gateway BFF • Microservices
        </text>
        <text x="0" y="32" class="mono" font-size="11" font-weight="700" fill="#64748B" text-anchor="middle">
          PostgreSQL pgvector • Redis :6379 • MinIO
        </text>
      </g>
    </g>
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

    # Render PNG using Chrome Headless at 300 DPI (width=2400, height=1700, scale=1.666 -> ~4000x2833)
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    abs_svg = os.path.abspath(SVG_OUTPUT)
    abs_png = os.path.abspath(PNG_OUTPUT)

    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--force-device-scale-factor=1.6667",
        f"--screenshot={abs_png}",
        "--window-size=2400,1700",
        f"file://{abs_svg}"
    ]

    print("Rendering publication-grade 300 DPI PNG via Headless Chrome...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(abs_png):
        size = os.path.getsize(abs_png)
        print(f"Successfully rendered {PNG_OUTPUT} ({size} bytes, 4000x2833 px)")
    else:
        print(f"Chrome screenshot error: {res.stderr}")
        return 1

    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
