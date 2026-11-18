#!/usr/bin/env python3
"""
generate_handdrawn_bw_diagrams.py
Generates 100% Black & White ("trắng đen") hand-drawn digital illustration diagrams
for the scientific research paper strictly matching:
1. Reference layout from Image 1 & Image 3 (Radial clusters, hand-drawn icons, branching arrows)
2. Reference layout from Image 2 (Evaluation Results Dashboard with 4 spacious cards)
3. HARD CONSTRAINT: ZERO OVERLAPPING ELEMENTS, ESPECIALLY ARROWS MUST NEVER OVERLAP TEXT OR BOXES.
4. PURE B&W / GRAYSCALE PALETTE: Pure white (#FFFFFF), bold black ink (#000000, 2.8 - 3.5 px),
   subtle grayscale accents (#F8FAFC, #F1F5F9, #E2E8F0, #CBD5E1).
5. 100% Academic Vendor-Agnostic (NO Gemini, NO commercial logos).
6. 300 DPI Ultra-HD PNG rendered via Headless Chrome for razor-sharp clarity.
"""

import os
import shutil
import subprocess

def render_svg_to_png(svg_path, png_path, width=2400, height=1600, scale=1.6667):
    """Renders SVG to 300 DPI Ultra-HD PNG via Headless Chrome."""
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    abs_svg = os.path.abspath(svg_path)
    abs_png = os.path.abspath(png_path)

    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        f"--force-device-scale-factor={scale}",
        f"--screenshot={abs_png}",
        f"--window-size={width},{height}",
        f"file://{abs_svg}"
    ]

    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(abs_png):
        size = os.path.getsize(abs_png)
        print(f"[SUCCESS] Rendered {png_path} ({size} bytes, {int(width*scale)}x{int(height*scale)} px)")
        return True
    else:
        print(f"[ERROR] Chrome screenshot error: {res.stderr}")
        return False

# =============================================================================
# DIAGRAM 1: B&W SYSTEM ARCHITECTURE (Matching Image 1 & Image 3)
# =============================================================================
def build_architecture_bw_svg():
    W = 2400
    H = 1600
    cx, cy = 1200, 830

    svg = []
    svg.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&amp;family=JetBrains+Mono:wght@700;800&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }}
      .title {{ font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; }}
      .mono {{ font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-weight: 800; }}
    </style>

    <!-- Black Marker Arrowhead -->
    <marker id="arr-black" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#000000" />
    </marker>
  </defs>

  <!-- PURE CLEAN WHITE BACKGROUND -->
  <rect width="{W}" height="{H}" fill="#FFFFFF"/>

  <!-- TOP TITLE -->
  <g transform="translate({cx}, 55)">
    <text x="0" y="0" class="title" font-size="34" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="-0.01em">
      Heterogeneous Multi-Agent Logistics System
    </text>
    <text x="0" y="28" font-size="14" font-weight="800" fill="#475569" text-anchor="middle" letter-spacing="0.05em">
      DUAL-ANCHOR GROUNDING (HYBRID RAG + PARAMETERIZED TOOLS) • INDEPENDENT CRITIC GATEKEEPER
    </text>
  </g>

  <!-- =========================================================================
       CENTER OVAL: LANGGRAPH HMAS ORCHESTRATOR (SUPERVISOR AGENT)
       ========================================================================= -->
  <g transform="translate({cx}, {cy})">
    <!-- Outer hand-drawn double ring -->
    <ellipse cx="0" cy="0" rx="310" ry="110" fill="#F1F5F9" stroke="#000000" stroke-width="3.5"/>
    <ellipse cx="0" cy="0" rx="298" ry="98" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" stroke-dasharray="6,4"/>

    <!-- Text content inside center oval (NO commercial vendor name!) -->
    <text x="0" y="-22" class="title" font-size="25" font-weight="900" fill="#000000" text-anchor="middle">
      LangGraph HMAS Orchestrator
    </text>
    <text x="0" y="12" font-size="16" font-weight="800" fill="#1E293B" text-anchor="middle">
      (Supervisor Agent - Finite State Machine)
    </text>
    <text x="0" y="38" class="mono" font-size="13" font-weight="800" fill="#475569" text-anchor="middle">
      sessions: Map&lt;conversationId, ChatSessionContext&gt;
    </text>
    <text x="0" y="62" font-size="12.5" font-weight="700" fill="#64748B" text-anchor="middle">
      handleMessage() • streamMessage() via SSE
    </text>
  </g>

  <!-- =========================================================================
       TOP CLUSTER: KNOWLEDGE RETRIEVAL & HYBRID RAG
       ========================================================================= -->
  <g transform="translate({cx}, 140)">
    <!-- Hand-Drawn Icon: Postal SOP Manual Book + Magnifying Glass -->
    <g transform="translate(-55, 0)">
      <!-- Book -->
      <rect x="-35" y="0" width="70" height="90" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="3.2"/>
      <line x1="-35" y1="18" x2="35" y2="18" stroke="#000000" stroke-width="2.2"/>
      <line x1="-25" y1="36" x2="25" y2="36" stroke="#000000" stroke-width="2.0"/>
      <line x1="-25" y1="52" x2="25" y2="52" stroke="#000000" stroke-width="2.0"/>
      <line x1="-25" y1="68" x2="15" y2="68" stroke="#000000" stroke-width="2.0"/>
      <text x="0" y="42" font-size="9" font-weight="900" fill="#000000" text-anchor="middle">SOP</text>
    </g>
    <g transform="translate(45, 35)">
      <!-- Magnifying Glass -->
      <circle cx="0" cy="0" r="28" fill="#FFFFFF" stroke="#000000" stroke-width="3.2"/>
      <circle cx="0" cy="0" r="22" fill="#F1F5F9" stroke="#000000" stroke-width="1.5" stroke-dasharray="3,3"/>
      <line x1="20" y1="20" x2="42" y2="42" stroke="#000000" stroke-width="4.0" stroke-linecap="round"/>
    </g>

    <!-- Cluster Title -->
    <text x="0" y="125" class="title" font-size="19" font-weight="900" fill="#000000" text-anchor="middle">
      Knowledge Retrieval &amp; Hybrid RAG
    </text>
    <text x="0" y="145" class="mono" font-size="12" font-weight="700" fill="#64748B" text-anchor="middle">
      VectorStoreService • hybridSearch()
    </text>

    <!-- Sub-Labels on Right with curving arrows -->
    <!-- Label 1: 9 Carrier SOPs -->
    <g transform="translate(130, -10)">
      <rect x="25" y="-14" width="160" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="105" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">9 Carrier SOPs</text>
      <!-- Small curved branching arrow stopping 6px before box border -->
      <path d="M -15 35 C 0 10, 10 2, 19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 2: Decree 47 & Postal Law -->
    <g transform="translate(130, 35)">
      <rect x="25" y="-14" width="200" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="125" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">Decree 47 &amp; Postal Law</text>
      <path d="M -15 0 C 0 0, 10 2, 19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 3: Dual MRL & BM25 -->
    <g transform="translate(130, 80)">
      <rect x="25" y="-14" width="180" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="115" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">Dual MRL &amp; BM25</text>
      <path d="M -15 -15 C 0 5, 10 2, 19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 4: Stacked Candidates -->
    <g transform="translate(130, 125)">
      <rect x="25" y="-14" width="170" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="110" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">Stacked Candidates</text>
      <path d="M -15 -35 C 0 10, 10 2, 19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>
  </g>

  <!-- =========================================================================
       TOP-RIGHT CLUSTER: OPERATIONAL TOOL EXECUTION
       ========================================================================= -->
  <g transform="translate(1860, 420)">
    <!-- Hand-Drawn Icon: Parcel Box with Packaging Tape + Gears -->
    <g transform="translate(-40, 0)">
      <!-- 3D-ish isometric carton box -->
      <polygon points="0,0 55,-25 110,0 55,25" fill="#F8FAFC" stroke="#000000" stroke-width="3.2"/>
      <polygon points="0,0 55,25 55,85 0,60" fill="#E2E8F0" stroke="#000000" stroke-width="3.2"/>
      <polygon points="110,0 55,25 55,85 110,60" fill="#CBD5E1" stroke="#000000" stroke-width="3.2"/>
      <!-- Tape -->
      <line x1="27" y1="-12" x2="82" y2="12" stroke="#000000" stroke-width="3.0"/>
    </g>
    <!-- Gear icon -->
    <g transform="translate(90, 45)">
      <circle cx="0" cy="0" r="22" fill="#FFFFFF" stroke="#000000" stroke-width="3.0"/>
      <circle cx="0" cy="0" r="8" fill="#000000"/>
      <path d="M -4,-28 L 4,-28 L 3,-22 L -3,-22 z M -4,28 L 4,28 L 3,22 L -3,22 z M -28,-4 L -28,4 L -22,3 L -22,-3 z M 28,-4 L 28,4 L 22,3 L 22,-3 z" fill="#000000"/>
    </g>

    <!-- Cluster Title -->
    <text x="10" y="115" class="title" font-size="19" font-weight="900" fill="#000000" text-anchor="middle">
      Operational Tool Execution
    </text>
    <text x="10" y="135" class="mono" font-size="12" font-weight="700" fill="#64748B" text-anchor="middle">
      LogisticsToolsService
    </text>

    <!-- Sub-Labels on Right with curving arrows -->
    <!-- Label 1: Live Tracking API -->
    <g transform="translate(140, -40)">
      <rect x="25" y="-14" width="160" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="105" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">Live Tracking API</text>
      <path d="M -15 30 C 0 5, 10 2, 19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 2: IATA Volumetric Pricing -->
    <g transform="translate(140, 8)">
      <rect x="25" y="-14" width="200" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="125" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">IATA Volumetric Pricing</text>
      <path d="M -15 0 C 0 0, 10 2, 19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 3: Action Draft DTO -->
    <g transform="translate(140, 56)">
      <rect x="25" y="-14" width="160" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="105" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">Action Draft DTO</text>
      <path d="M -15 -10 C 0 5, 10 2, 19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 4: 24h Dispute Claims -->
    <g transform="translate(140, 104)">
      <rect x="25" y="-14" width="180" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="115" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">24h Dispute Claims</text>
      <path d="M -15 -30 C 0 10, 10 2, 19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>
  </g>

  <!-- =========================================================================
       BOTTOM-RIGHT CLUSTER: VALIDATION CRITIC & HITL GATE
       ========================================================================= -->
  <g transform="translate(1860, 1140)">
    <!-- Hand-Drawn Icon: Shield with Checkmark + Official Stamp -->
    <g transform="translate(-40, -10)">
      <!-- Shield -->
      <path d="M 0,-25 Q 35,-30 45,0 Q 45,45 0,65 Q -45,45 -45,0 Q -35,-30 0,-25 Z" fill="#F8FAFC" stroke="#000000" stroke-width="3.2"/>
      <!-- Checkmark -->
      <path d="M -15,10 L -4,22 L 20,-6" fill="none" stroke="#000000" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <!-- Stamp Icon -->
    <g transform="translate(55, 10)">
      <ellipse cx="0" cy="22" rx="25" ry="10" fill="#FFFFFF" stroke="#000000" stroke-width="2.8"/>
      <path d="M -16,22 L -12,-5 L 12,-5 L 16,22 Z" fill="#E2E8F0" stroke="#000000" stroke-width="2.8"/>
      <circle cx="0" cy="-14" r="12" fill="#FFFFFF" stroke="#000000" stroke-width="2.8"/>
    </g>

    <!-- Cluster Title -->
    <text x="10" y="95" class="title" font-size="19" font-weight="900" fill="#000000" text-anchor="middle">
      Validation Critic &amp; HITL Gate
    </text>
    <text x="10" y="115" class="mono" font-size="12" font-weight="700" fill="#64748B" text-anchor="middle">
      callValidationAgent • requiresHITL
    </text>

    <!-- Sub-Labels on Right with curving arrows -->
    <!-- Label 1: Physical Limits (<=70kg) -->
    <g transform="translate(140, -50)">
      <rect x="25" y="-14" width="200" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="125" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">Physical Limits (&lt;=70kg)</text>
      <path d="M -15 35 C 0 10, 10 2, 19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 2: Dangerous Goods Block -->
    <g transform="translate(140, -2)">
      <rect x="25" y="-14" width="200" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="125" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">Dangerous Goods Block</text>
      <path d="M -15 0 C 0 0, 10 2, 19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 3: COD Fraud Check (>=15M) -->
    <g transform="translate(140, 46)">
      <rect x="25" y="-14" width="200" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="125" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">COD Fraud Check (&gt;=15M)</text>
      <path d="M -15 -10 C 0 5, 10 2, 19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 4: Human-in-the-Loop Interrupt -->
    <g transform="translate(140, 94)">
      <rect x="25" y="-14" width="220" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="135" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">Human-in-the-Loop Interrupt</text>
      <path d="M -15 -35 C 0 10, 10 2, 19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>
  </g>

  <!-- =========================================================================
       BOTTOM-LEFT CLUSTER: CORE BACKEND MESH & STORAGE
       ========================================================================= -->
  <g transform="translate(540, 1140)">
    <!-- Hand-Drawn Icon: Microservices Fork + Database Cylinders -->
    <g transform="translate(35, -5)">
      <!-- Database Cylinders -->
      <!-- Top disk -->
      <ellipse cx="0" cy="-20" rx="42" ry="14" fill="#FFFFFF" stroke="#000000" stroke-width="3.0"/>
      <!-- Body 1 -->
      <path d="M -42,-20 L -42,5 A 42,14 0 0,0 42,5 L 42,-20" fill="#F8FAFC" stroke="#000000" stroke-width="3.0"/>
      <!-- Body 2 -->
      <path d="M -42,5 L -42,30 A 42,14 0 0,0 42,30 L 42,5" fill="#E2E8F0" stroke="#000000" stroke-width="3.0"/>
      <!-- Stripe lines -->
      <line x1="-30" y1="18" x2="30" y2="18" stroke="#000000" stroke-width="2.0"/>
    </g>
    <!-- Fork node icon -->
    <g transform="translate(-45, 0)">
      <circle cx="-15" cy="-25" r="12" fill="#FFFFFF" stroke="#000000" stroke-width="2.8"/>
      <circle cx="15" cy="-25" r="12" fill="#FFFFFF" stroke="#000000" stroke-width="2.8"/>
      <circle cx="0" cy="25" r="12" fill="#F1F5F9" stroke="#000000" stroke-width="2.8"/>
      <path d="M -15,-13 C -15,5 0,5 0,13" fill="none" stroke="#000000" stroke-width="2.8"/>
      <path d="M 15,-13 C 15,5 0,5 0,13" fill="none" stroke="#000000" stroke-width="2.8"/>
    </g>

    <!-- Cluster Title -->
    <text x="0" y="95" class="title" font-size="19" font-weight="900" fill="#000000" text-anchor="middle">
      Core Backend Mesh &amp; Storage
    </text>
    <text x="0" y="115" class="mono" font-size="12" font-weight="700" fill="#64748B" text-anchor="middle">
      PostgreSQL • pgvector • MinIO
    </text>

    <!-- Sub-Labels on Left with curving arrows -->
    <!-- Label 1: API Gateway BFF -->
    <g transform="translate(-140, -50)">
      <rect x="-185" y="-14" width="160" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="-105" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">API Gateway BFF</text>
      <!-- Small curved branching arrow stopping 6px before right border (-25) -->
      <path d="M 15 35 C 0 10, -10 2, -19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 2: PostgreSQL + pgvector -->
    <g transform="translate(-140, -2)">
      <rect x="-215" y="-14" width="190" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="-120" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">PostgreSQL + pgvector</text>
      <path d="M 15 0 C 0 0, -10 2, -19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 3: ai_agent_audit_logs -->
    <g transform="translate(-140, 46)">
      <rect x="-215" y="-14" width="190" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="-120" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">ai_agent_audit_logs</text>
      <path d="M 15 -10 C 0 5, -10 2, -19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 4: MinIO S3 Evidence -->
    <g transform="translate(-140, 94)">
      <rect x="-195" y="-14" width="170" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="-110" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">MinIO S3 Evidence</text>
      <path d="M 15 -35 C 0 10, -10 2, -19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>
  </g>

  <!-- =========================================================================
       TOP-LEFT CLUSTER: CLIENT TOUCHPOINTS & PII MASKING
       ========================================================================= -->
  <g transform="translate(540, 420)">
    <!-- Hand-Drawn Icon: Desktop Computer Monitor + Smartphone with Lock -->
    <g transform="translate(-30, 0)">
      <!-- Monitor -->
      <rect x="-55" y="-35" width="110" height="70" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="3.2"/>
      <line x1="-55" y1="20" x2="55" y2="20" stroke="#000000" stroke-width="2.0"/>
      <rect x="-10" y="35" width="20" height="20" fill="#E2E8F0" stroke="#000000" stroke-width="2.5"/>
      <line x1="-25" y1="55" x2="25" y2="55" stroke="#000000" stroke-width="3.2" stroke-linecap="round"/>
    </g>
    <!-- Smartphone with Lock -->
    <g transform="translate(50, 5)">
      <rect x="-18" y="-30" width="36" height="65" rx="6" fill="#F8FAFC" stroke="#000000" stroke-width="2.8"/>
      <circle cx="0" cy="27" r="3" fill="#000000"/>
      <!-- Small Lock on screen -->
      <rect x="-7" y="-5" width="14" height="12" rx="2" fill="#000000"/>
      <path d="M -4,-5 L -4,-10 A 4,4 0 0,1 4,-10 L 4,-5" fill="none" stroke="#000000" stroke-width="2.0"/>
    </g>

    <!-- Cluster Title -->
    <text x="0" y="115" class="title" font-size="19" font-weight="900" fill="#000000" text-anchor="middle">
      Client Touchpoints &amp; PII Masking
    </text>
    <text x="0" y="135" class="mono" font-size="12" font-weight="700" fill="#64748B" text-anchor="middle">
      normalizePhone() • Cryptographic Redaction
    </text>

    <!-- Sub-Labels on Left with curving arrows -->
    <!-- Label 1: CSKH Support Console -->
    <g transform="translate(-140, -40)">
      <rect x="-215" y="-14" width="190" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="-120" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">CSKH Support Console</text>
      <path d="M 15 30 C 0 5, -10 2, -19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 2: Customer Mobile (iOS/Android) -->
    <g transform="translate(-140, 8)">
      <rect x="-245" y="-14" width="220" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="-135" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">Customer Mobile (iOS/Android)</text>
      <path d="M 15 0 C 0 0, -10 2, -19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 3: Guest Tracking Portal -->
    <g transform="translate(-140, 56)">
      <rect x="-215" y="-14" width="190" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="-120" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">Guest Tracking Portal</text>
      <path d="M 15 -10 C 0 5, -10 2, -19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>

    <!-- Label 4: PII Masking (0912***) -->
    <g transform="translate(-140, 104)">
      <rect x="-225" y="-14" width="200" height="30" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="-125" y="6" font-size="12" font-weight="800" fill="#000000" text-anchor="middle">PII Masking (0912***)</text>
      <path d="M 15 -30 C 0 10, -10 2, -19 2" fill="none" stroke="#000000" stroke-width="2.2" marker-end="url(#arr-black)"/>
    </g>
  </g>

  <!-- =========================================================================
       CLEAN CURVED DASHED ARROWS FROM CENTER OVAL (ZERO OVERLAPPING GUARANTEED)
       Every arrow has dedicated open-air coordinates with at least 50px clearance!
       ========================================================================= -->
  <g fill="none" stroke="#000000" stroke-width="2.8" stroke-dasharray="7,5" stroke-linecap="round">
    <!-- Center to Top (Knowledge RAG) -->
    <!-- Start: (1200, 715), End: (1200, 325) - 40px clearance below subtitle -->
    <path d="M 1200,715 L 1200,325" marker-end="url(#arr-black)"/>

    <!-- Center to Top-Right (Operational Tools) -->
    <!-- Curves gracefully to (1680, 460) aimed at carton/gears icon, well above text at y=535 -->
    <path d="M 1440,765 Q 1580,680 1680,460" marker-end="url(#arr-black)"/>

    <!-- Center to Bottom-Right (Validation Critic) -->
    <!-- Curves to (1700, 1130), 115px away from shield and well above text at y=1235 -->
    <path d="M 1440,895 Q 1580,960 1700,1130" marker-end="url(#arr-black)"/>

    <!-- Center to Bottom-Left (Core Backend Mesh) -->
    <!-- Curves to (700, 1130), 83px away from DB cylinders and well above text at y=1235 -->
    <path d="M 960,895 Q 820,960 700,1130" marker-end="url(#arr-black)"/>

    <!-- Center to Top-Left (Client Touchpoints) -->
    <!-- Curves gracefully to (720, 450) aimed at monitor/smartphone icon, 112px away and well above text at y=535 -->
    <path d="M 960,765 Q 820,680 720,450" marker-end="url(#arr-black)"/>
  </g>
</svg>''')

    out_svg = "docs/research/paper/diagrams/code-aligned-hmas-architecture-bw.svg"
    out_png = "docs/research/paper/diagrams/code-aligned-hmas-architecture-bw.png"
    with open(out_svg, "w", encoding="utf-8") as f:
        f.write("\n".join(svg))
    print(f"Generated {out_svg}")
    render_svg_to_png(out_svg, out_png, width=W, height=H)

# =============================================================================
# DIAGRAM 2: B&W EVALUATION DASHBOARD (Matching Image 2)
# =============================================================================
def build_evaluation_dashboard_bw_svg():
    W = 2400
    H = 1600
    cx, cy = 1200, 800

    svg = []
    svg.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&amp;family=JetBrains+Mono:wght@700;800&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }}
      .title {{ font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; }}
      .mono {{ font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-weight: 800; }}
    </style>

    <marker id="arr-black-eval" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#000000" />
    </marker>
  </defs>

  <!-- PURE CLEAN WHITE BACKGROUND -->
  <rect width="{W}" height="{H}" fill="#FFFFFF"/>

  <!-- TOP RIBBON BANNER -->
  <g transform="translate({cx}, 70)">
    <!-- Ribbon fold tails -->
    <polygon points="-460,-30 -500,-10 -460,10 -480,-10" fill="#E2E8F0" stroke="#000000" stroke-width="3.0"/>
    <polygon points="460,-30 500,-10 460,10 480,-10" fill="#E2E8F0" stroke="#000000" stroke-width="3.0"/>
    
    <!-- Main ribbon body -->
    <rect x="-460" y="-36" width="920" height="72" rx="10" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>
    <text x="0" y="9" class="title" font-size="27" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="0.04em">
      HELD-OUT BENCHMARK EVALUATION RESULTS (N = 70 TEST CASES)
    </text>
  </g>

  <!-- =========================================================================
       CENTER OVAL: OVERALL BENCHMARK SYNTHESIS
       ========================================================================= -->
  <g transform="translate({cx}, {cy})">
    <!-- Center oval -->
    <ellipse cx="0" cy="0" rx="320" ry="180" fill="#F8FAFC" stroke="#000000" stroke-width="3.5"/>
    <ellipse cx="0" cy="0" rx="308" ry="168" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" stroke-dasharray="6,4"/>

    <!-- Gold/Pill Badge at top of oval -->
    <rect x="-210" y="-125" width="420" height="48" rx="14" fill="#FFFFFF" stroke="#000000" stroke-width="2.5"/>
    <text x="0" y="-93" class="title" font-size="19" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="0.03em">
      FUNCTIONAL PASS: 84.6% (44/52)
    </text>

    <!-- Subtitle -->
    <text x="0" y="-50" class="title" font-size="22" font-weight="900" fill="#000000" text-anchor="middle">
      Held-Out Benchmark Synthesis
    </text>

    <!-- Bullet lines with bold black and grey -->
    <text x="0" y="-12" font-size="14.5" font-weight="800" fill="#1E293B" text-anchor="middle">
      • Auto Tier: 4.05 / 5.00 | Human Likert: 4.18 / 5.00
    </text>
    <text x="0" y="16" font-size="14.5" font-weight="800" fill="#334155" text-anchor="middle">
      • Score Mean: 83.1 ± 17.1 pts | Median: 88.0 / 100
    </text>
    <text x="0" y="44" font-size="14.5" font-weight="900" fill="#000000" text-anchor="middle">
      • Zero Regulatory Hallucinations | 0 PII Leaks
    </text>
    <text x="0" y="72" font-size="13" font-weight="700" fill="#475569" text-anchor="middle">
      Wilcoxon W = 112.0 (p &lt; 0.001) • Cohen's d = 0.50
    </text>
    <text x="0" y="98" font-size="12" font-weight="700" fill="#64748B" text-anchor="middle">
      Spearman ρ = 0.884 • Cohen's κ = 0.824 (Inter-Annotator)
    </text>
  </g>

  <!-- =========================================================================
       CARD 1: TOP-LEFT - REAL-WORLD CARRIER CORPUS (50%)
       ========================================================================= -->
  <g transform="translate(100, 160)">
    <!-- Container Card (Clean white with bold black outline) -->
    <rect width="660" height="450" rx="24" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>

    <!-- Hand-Drawn Icon: Delivery Truck + Shipping Carton Box (Matching Image 2) -->
    <g transform="translate(60, -28)">
      <!-- Truck Body -->
      <rect x="0" y="0" width="90" height="60" rx="6" fill="#FFFFFF" stroke="#000000" stroke-width="3.0"/>
      <!-- Truck Cabin -->
      <path d="M 90,15 L 120,15 L 135,35 L 135,60 L 90,60 Z" fill="#F1F5F9" stroke="#000000" stroke-width="3.0"/>
      <!-- Windshield -->
      <polygon points="98,22 118,22 128,35 98,35" fill="#000000"/>
      <!-- Wheels -->
      <circle cx="30" cy="62" r="14" fill="#FFFFFF" stroke="#000000" stroke-width="3.0"/>
      <circle cx="30" cy="62" r="6" fill="#000000"/>
      <circle cx="115" cy="62" r="14" fill="#FFFFFF" stroke="#000000" stroke-width="3.0"/>
      <circle cx="115" cy="62" r="6" fill="#000000"/>
      <!-- Speed lines -->
      <line x1="-30" y1="20" x2="-10" y2="20" stroke="#000000" stroke-width="3.0" stroke-linecap="round"/>
      <line x1="-20" y1="35" x2="-5" y2="35" stroke="#000000" stroke-width="3.0" stroke-linecap="round"/>
      <!-- Carton box next to truck -->
      <g transform="translate(160, 15)">
        <polygon points="0,0 25,-12 50,0 25,12" fill="#FFFFFF" stroke="#000000" stroke-width="2.5"/>
        <polygon points="0,0 25,12 25,40 0,28" fill="#F1F5F9" stroke="#000000" stroke-width="2.5"/>
        <polygon points="50,0 25,12 25,40 50,28" fill="#E2E8F0" stroke="#000000" stroke-width="2.5"/>
      </g>
    </g>

    <!-- Header Text -->
    <text x="35" y="80" class="title" font-size="20" font-weight="900" fill="#000000">
      1. REAL-WORLD CARRIER CORPUS (n = 35)
    </text>

    <!-- Bullet items with clean spacing (NO OVERLAP) -->
    <g transform="translate(35, 120)">
      <text x="0" y="0" font-size="15.5" font-weight="900" fill="#000000">
        • GHTK (10 cases): 100.0% Pass Rate (Auto Tier 4.60)
      </text>
      <text x="18" y="22" font-size="13" font-weight="700" fill="#475569">
        Cosmetics packaging SOPs, fragile bubble wrap ≥3 layers, anti-scam
      </text>

      <text x="0" y="60" font-size="15.5" font-weight="900" fill="#000000">
        • VNPost (7 cases): 100.0% Pass Rate (Auto Tier 4.57)
      </text>
      <text x="18" y="82" font-size="13" font-weight="700" fill="#475569">
        Postal Law 49 secrecy &amp; force majeure, remote delivery surcharges
      </text>

      <text x="0" y="120" font-size="15.5" font-weight="900" fill="#000000">
        • Viettel Post (7 cases): 85.7% Pass Rate (6/7, Auto Tier 4.29)
      </text>
      <text x="18" y="142" font-size="13" font-weight="700" fill="#475569">
        Aviation Lithium battery bans, domestic compensation liability ceilings
      </text>

      <text x="0" y="180" font-size="15.5" font-weight="900" fill="#000000">
        • GHN (11 cases): 63.6% Pass Rate (7/11, Auto Tier 3.36)
      </text>
      <text x="18" y="202" font-size="13" font-weight="700" fill="#475569">
        Partial delivery / return edge cases, security seal thresholds &gt; 10M
      </text>

      <text x="0" y="240" font-size="15" font-weight="900" fill="#000000">
        • Real-World Functional Pass: 85.7% (30/35 test cases)
      </text>
    </g>
  </g>

  <!-- =========================================================================
       CARD 2: TOP-RIGHT - ADVERSARIAL SAFETY & OWASP (n = 18 Test + 100 Suite)
       ========================================================================= -->
  <g transform="translate(1640, 160)">
    <rect width="660" height="450" rx="24" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>

    <!-- Hand-Drawn Icon: Shield with Lock (Matching Image 2) -->
    <g transform="translate(520, -35)">
      <path d="M 0,-15 Q 35,-20 45,10 Q 45,55 0,75 Q -45,55 -45,10 Q -35,-20 0,-15 Z" fill="#FFFFFF" stroke="#000000" stroke-width="3.2"/>
      <!-- Inner shield ring -->
      <path d="M 0,-8 Q 28,-12 36,12 Q 36,46 0,63 Q -36,46 -36,12 Q -28,-12 0,-8 Z" fill="#F8FAFC" stroke="#000000" stroke-width="1.8"/>
      <!-- Padlock -->
      <rect x="-12" y="14" width="24" height="20" rx="3" fill="#000000"/>
      <path d="M -7,14 L -7,5 A 7,7 0 0,1 7,5 L 7,14" fill="none" stroke="#000000" stroke-width="2.8"/>
      <circle cx="0" cy="22" r="3" fill="#FFFFFF"/>
    </g>

    <!-- Header Text -->
    <text x="35" y="80" class="title" font-size="19" font-weight="900" fill="#000000">
      2. ADVERSARIAL SAFETY &amp; OWASP (n=18 Test + 100 Suite)
    </text>

    <!-- Bullet items -->
    <g transform="translate(35, 120)">
      <text x="0" y="0" font-size="15.5" font-weight="900" fill="#000000">
        • Adversarial Test (18 cases): 100% Defense (0.0% ASR)
      </text>
      <text x="18" y="22" font-size="13" font-weight="700" fill="#475569">
        Indirect prompt injection, BOLA IDOR parcel hijacking neutralized
      </text>

      <text x="0" y="60" font-size="15.5" font-weight="900" fill="#000000">
        • Enterprise Red-Team Suite (100 prompts): 0.0% ASR
      </text>
      <text x="18" y="82" font-size="13" font-weight="700" fill="#475569">
        60 internal + 40 external prompts; Critic gatekeeper active
      </text>

      <text x="0" y="120" font-size="15.5" font-weight="900" fill="#000000">
        • External Red-Team (40 prompts): 0.0% ASR (95% CI: [0.0%, 8.81%])
      </text>
      <text x="18" y="142" font-size="13" font-weight="700" fill="#475569">
        Written by independent security engineers; zero policy breaches
      </text>

      <text x="0" y="180" font-size="15.5" font-weight="900" fill="#000000">
        • Physical Ceilings (15 prompts): 100% Intercepted
      </text>
      <text x="18" y="202" font-size="13" font-weight="700" fill="#475569">
        Deterministic validation blocks over-limit freight (&gt;70kg, &gt;150cm)
      </text>

      <text x="0" y="240" font-size="15" font-weight="900" fill="#000000">
        • Security Boundary: 100.0% Risk Detection Rate (RDR)
      </text>
    </g>
  </g>

  <!-- =========================================================================
       CARD 4: BOTTOM-LEFT - LATENCY & EXECUTION PROFILING
       ========================================================================= -->
  <g transform="translate(100, 990)">
    <rect width="660" height="490" rx="24" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>

    <!-- Hand-Drawn Icon: Stopwatch (Matching Image 2) -->
    <g transform="translate(60, -30)">
      <!-- Stopwatch body -->
      <circle cx="0" cy="0" r="32" fill="#FFFFFF" stroke="#000000" stroke-width="3.2"/>
      <circle cx="0" cy="0" r="26" fill="#F8FAFC" stroke="#000000" stroke-width="1.5"/>
      <!-- Top buttons -->
      <rect x="-6" y="-42" width="12" height="12" rx="2" fill="#000000"/>
      <rect x="18" y="-32" width="10" height="8" rx="2" fill="#000000" transform="rotate(35 18 -32)"/>
      <!-- Hand pointer -->
      <line x1="0" y1="0" x2="12" y2="-14" stroke="#000000" stroke-width="3.0" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="4" fill="#000000"/>
    </g>

    <!-- Header Text -->
    <text x="35" y="75" class="title" font-size="20" font-weight="900" fill="#000000">
      4. LATENCY &amp; EXECUTION PROFILING
    </text>

    <!-- Bullet items -->
    <g transform="translate(35, 120)">
      <text x="0" y="0" font-size="15.5" font-weight="900" fill="#000000">
        • Perceived TTFT: 420 ms (SSE Streaming token feedback)
      </text>
      <text x="18" y="22" font-size="13" font-weight="700" fill="#475569">
        Speculative 3-token buffer masks multi-agent latency
      </text>

      <text x="0" y="60" font-size="15.5" font-weight="900" fill="#000000">
        • End-to-End Latency: Mean 3,651 ms (p50: 3,280 ms, p90: 5,320 ms)
      </text>
      <text x="18" y="82" font-size="13" font-weight="700" fill="#475569">
        Paired t-test vs Single-Agent (2,580 ms): t = 28.4, p &lt; 0.001
      </text>

      <text x="0" y="120" font-size="15.5" font-weight="900" fill="#000000">
        • Two-Phase Execution Decomposition:
      </text>
      <text x="18" y="142" font-size="13.5" font-weight="800" fill="#1E293B">
        LLM Token Gen: 71.3% (2,604 ms) | Critic Gate: 14.6% (532 ms)
      </text>
      <text x="18" y="164" font-size="13.5" font-weight="800" fill="#1E293B">
        Operational Tools: 5.9% (216 ms) | Hybrid RAG: 4.9% (179 ms)
      </text>
      <text x="18" y="186" font-size="13.5" font-weight="800" fill="#1E293B">
        Supervisor State Routing: 3.3% (120 ms)
      </text>

      <text x="0" y="226" font-size="15" font-weight="900" fill="#000000">
        • Strict Pre-Execution Gating on All Mutating Actions
      </text>
    </g>
  </g>

  <!-- =========================================================================
       CARD 3: BOTTOM-RIGHT - 5-TIER EVALUATION SPECTRUM (n = 52 Functional)
       ========================================================================= -->
  <g transform="translate(1640, 990)">
    <rect width="660" height="490" rx="24" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>

    <!-- Hand-Drawn Icon: Multi-Tier Column Chart (Matching Image 2) -->
    <g transform="translate(510, -25)">
      <!-- Baseline axis -->
      <line x1="-15" y1="45" x2="65" y2="45" stroke="#000000" stroke-width="3.2"/>
      <!-- Bars of ascending heights -->
      <rect x="-8" y="25" width="12" height="20" fill="#CBD5E1" stroke="#000000" stroke-width="2.2"/>
      <rect x="8" y="12" width="12" height="33" fill="#94A3B8" stroke="#000000" stroke-width="2.2"/>
      <rect x="24" y="-2" width="12" height="47" fill="#475569" stroke="#000000" stroke-width="2.2"/>
      <rect x="40" y="-18" width="12" height="63" fill="#000000" stroke="#000000" stroke-width="2.2"/>
    </g>

    <!-- Header Text -->
    <text x="35" y="75" class="title" font-size="19" font-weight="900" fill="#000000">
      3. 5-TIER EVALUATION SPECTRUM (n = 52 Functional)
    </text>

    <!-- Bullet items -->
    <g transform="translate(35, 120)">
      <text x="0" y="0" font-size="15.5" font-weight="900" fill="#000000">
        • Level 5 [EXCELLENT]: 26 Cases (50.0%)
      </text>
      <text x="18" y="22" font-size="13" font-weight="700" fill="#475569">
        Score ≥ 90.0 pts: Full SOP grounding and flawless tool parameters
      </text>

      <text x="0" y="58" font-size="15.5" font-weight="900" fill="#000000">
        • Level 4 [GOOD]: 16 Cases (30.8%)
      </text>
      <text x="18" y="80" font-size="13.5" font-weight="700" fill="#475569">
        Score 75.0 - 89.9 pts: Correct courier actions, zero regulatory errors
      </text>

      <text x="0" y="116" font-size="15.5" font-weight="900" fill="#000000">
        • Level 3 [ACCEPTABLE]: 2 Cases (3.8%)
      </text>
      <text x="18" y="138" font-size="13" font-weight="700" fill="#475569">
        Score 60.0 - 74.9 pts: Minor formatting or supplementary info missing
      </text>

      <text x="0" y="174" font-size="15.5" font-weight="900" fill="#000000">
        • Non-Passing: 3 Marginal (5.8%) + 5 Critical (9.6%)
      </text>
      <text x="18" y="196" font-size="13.5" font-weight="700" fill="#475569">
        Out-of-domain deflections (1) &amp; island surcharge gaps (7); 0 PII leaks
      </text>

      <text x="0" y="234" font-size="15" font-weight="900" fill="#000000">
        • Auto Pass: 44/52 (84.6%) | Human Pass: 46/52 (88.5%, κ = 0.824)
      </text>
    </g>
  </g>

  <!-- =========================================================================
       CLEAN CURVED DASHED ARROWS CONNECTING CENTER TO 4 CARDS
       Strictly calculated with large clearance (35px gap from card borders) so arrows NEVER collide!
       ========================================================================= -->
  <g fill="none" stroke="#000000" stroke-width="3.2" stroke-dasharray="8,6" stroke-linecap="round">
    <!-- Center to Card 1 (Top-Left) -->
    <!-- Start: (960, 690), End: (795, 480) - Stops 35px before Card 1 right edge (760) -->
    <path d="M 960,690 C 880,620, 840,550, 795,480" marker-end="url(#arr-black-eval)"/>

    <!-- Center to Card 2 (Top-Right) -->
    <!-- Start: (1440, 690), End: (1605, 480) - Stops 35px before Card 2 left edge (1640) -->
    <path d="M 1440,690 C 1520,620, 1560,550, 1605,480" marker-end="url(#arr-black-eval)"/>

    <!-- Center to Card 4 (Bottom-Left) -->
    <!-- Start: (960, 910), End: (795, 1120) - Stops 35px before Card 4 right edge (760) -->
    <path d="M 960,910 C 880,980, 840,1050, 795,1120" marker-end="url(#arr-black-eval)"/>

    <!-- Center to Card 3 (Bottom-Right) -->
    <!-- Start: (1440, 910), End: (1605, 1120) - Stops 35px before Card 3 left edge (1640) -->
    <path d="M 1440,910 C 1520,980, 1560,1050, 1605,1120" marker-end="url(#arr-black-eval)"/>
  </g>
</svg>''')

    out_svg = "docs/research/paper/diagrams/evaluation-results-handdrawn-bw.svg"
    out_png = "docs/research/paper/diagrams/evaluation-results-handdrawn-bw.png"
    with open(out_svg, "w", encoding="utf-8") as f:
        f.write("\n".join(svg))
    print(f"Generated {out_svg}")
    render_svg_to_png(out_svg, out_png, width=W, height=H)
    shutil.copyfile(out_png, "docs/research/paper/diagrams/evaluation-results-ai-generated-bw.png")
    print("Copied to docs/research/paper/diagrams/evaluation-results-ai-generated-bw.png")

if __name__ == "__main__":
    build_architecture_bw_svg()
    build_evaluation_dashboard_bw_svg()

# =============================================================================
# DIAGRAM 3: B&W MULTI-AGENT COLLABORATION & TASK ALLOCATION WORKFLOW
# =============================================================================
def build_collaboration_bw_svg():
    W = 2400
    H = 1500
    lines = []

    lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&amp;family=JetBrains+Mono:wght@700;800&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }}
      .title {{ font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; }}
      .mono {{ font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-weight: 800; }}
    </style>

    <marker id="arr-collab-bw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#000000" />
    </marker>
  </defs>

  <!-- PURE CLEAN WHITE BACKGROUND -->
  <rect width="{W}" height="{H}" fill="#FFFFFF"/>

  <!-- MASTER DIAGRAM HEADER -->
  <g transform="translate(1200, 55)">
    <text x="0" y="0" class="title" font-size="34" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="-0.02em">
      Multi-Agent Collaboration &amp; Task Allocation Architecture
    </text>
    <text x="0" y="28" font-size="14.5" font-weight="800" fill="#475569" text-anchor="middle" letter-spacing="0.05em">
      STATEFUL DAG ORCHESTRATION • ROLE DECOMPOSITION • HUMAN-IN-THE-LOOP SAFETY GATE
    </text>
  </g>

  <!-- =========================================================================
       STAGE 1: INBOUND QUERY (x: 80)
       ========================================================================= -->
  <g transform="translate(80, 150)">
    <rect width="360" height="1260" rx="20" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>
    <rect x="20" y="20" width="320" height="52" rx="12" fill="#F8FAFC" stroke="#000000" stroke-width="2.5"/>
    <text x="180" y="52" font-size="16" font-weight="900" fill="#000000" text-anchor="middle">
      1. INBOUND CLIENT QUERY
    </text>

    <!-- Client Channels -->
    <g transform="translate(20, 100)">
      <rect width="320" height="200" rx="14" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="160" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">Client Touchpoints</text>
      <text x="20" y="65" font-size="13" font-weight="700" fill="#334155">• Customer Mobile (iOS/Android)</text>
      <text x="20" y="95" font-size="13" font-weight="700" fill="#334155">• CSKH Operations Assistant</text>
      <text x="20" y="125" font-size="13" font-weight="700" fill="#334155">• Guest Tracking Web Portal</text>
      <text x="20" y="155" font-size="13" font-weight="700" fill="#334155">• Role &amp; JWT Authorization</text>
      <text x="20" y="180" class="mono" font-size="11.5" font-weight="800" fill="#475569">POST /api/v1/chat/message</text>
    </g>

    <!-- PII Pre-Screening -->
    <g transform="translate(20, 330)">
      <rect width="320" height="220" rx="14" fill="#F8FAFC" stroke="#000000" stroke-width="2.0"/>
      <text x="160" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">PII Shield &amp; Sanitization</text>
      <text x="20" y="65" font-size="13" font-weight="700" fill="#334155">• Cryptographic Phone Redaction</text>
      <text x="20" y="90" class="mono" font-size="12" font-weight="800" fill="#000000">  0912345678 -> 0912***678</text>
      <text x="20" y="120" font-size="13" font-weight="700" fill="#334155">• Street Address Masking</text>
      <text x="20" y="145" class="mono" font-size="12" font-weight="800" fill="#000000">  123 Nguyen Hue -> ***, Q1</text>
      <text x="20" y="175" font-size="13" font-weight="700" fill="#334155">• Guest 4-digit challenge</text>
      <text x="20" y="200" class="mono" font-size="11" font-weight="800" fill="#475569">normalizePhone()</text>
    </g>

    <!-- Session Context -->
    <g transform="translate(20, 580)">
      <rect width="320" height="210" rx="14" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="160" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">Session State Cache</text>
      <text x="20" y="65" font-size="13" font-weight="700" fill="#334155">• Conversation ID isolation</text>
      <text x="20" y="95" font-size="13" font-weight="700" fill="#334155">• FSM conversation history</text>
      <text x="20" y="125" font-size="13" font-weight="700" fill="#334155">• Active tracking code buffer</text>
      <text x="20" y="155" font-size="13" font-weight="700" fill="#334155">• Redis token state cache</text>
      <text x="20" y="185" class="mono" font-size="11" font-weight="800" fill="#475569">sessions: Map&lt;id, Context&gt;</text>
    </g>
  </g>

  <!-- =========================================================================
       STAGE 2: SUPERVISOR ORCHESTRATOR (x: 520)
       ========================================================================= -->
  <g transform="translate(520, 150)">
    <rect width="420" height="1260" rx="20" fill="#F8FAFC" stroke="#000000" stroke-width="3.5"/>
    <rect x="25" y="20" width="370" height="52" rx="12" fill="#E2E8F0" stroke="#000000" stroke-width="2.5"/>
    <text x="210" y="52" font-size="16" font-weight="900" fill="#000000" text-anchor="middle">
      2. SUPERVISOR ORCHESTRATOR
    </text>

    <!-- Intent Classifier -->
    <g transform="translate(25, 100)">
      <rect width="370" height="220" rx="14" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="185" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">Intent Classification FSM</text>
      <text x="20" y="65" font-size="13" font-weight="700" fill="#334155">• Multi-class intent probability:</text>
      <text x="35" y="92" font-size="13" font-weight="800" fill="#000000">1. SOP_KNOWLEDGE</text>
      <text x="35" y="118" font-size="13" font-weight="800" fill="#000000">2. OPERATIONAL_TOOL</text>
      <text x="35" y="144" font-size="13" font-weight="800" fill="#000000">3. ADVERSARIAL_ATTACK</text>
      <text x="35" y="170" font-size="13" font-weight="800" fill="#000000">4. DISPUTE_ESCALATION</text>
      <text x="20" y="200" class="mono" font-size="11.5" font-weight="800" fill="#475569">LangGraph StateGraph Root</text>
    </g>

    <!-- Plan & Router -->
    <g transform="translate(25, 350)">
      <rect width="370" height="220" rx="14" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="185" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">Dynamic Execution Planner</text>
      <text x="20" y="65" font-size="13" font-weight="700" fill="#334155">• Decomposes complex compound goals</text>
      <text x="20" y="95" font-size="13" font-weight="700" fill="#334155">• Parallel vs. Sequential dispatch</text>
      <text x="20" y="125" font-size="13" font-weight="700" fill="#334155">• Extracts verified arguments</text>
      <text x="20" y="155" font-size="13" font-weight="700" fill="#334155">• Injects session history context</text>
      <text x="20" y="195" class="mono" font-size="11.5" font-weight="800" fill="#475569">ChatService.handleMessage()</text>
    </g>

    <!-- SSE Token Streamer -->
    <g transform="translate(25, 600)">
      <rect width="370" height="200" rx="14" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="185" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">SSE Streamer &amp; UI Cards</text>
      <text x="20" y="65" font-size="13" font-weight="700" fill="#334155">• Perceived TTFT: 420 ms</text>
      <text x="20" y="95" font-size="13" font-weight="700" fill="#334155">• Instantaneous token emission</text>
      <text x="20" y="125" font-size="13" font-weight="700" fill="#334155">• Renders Timeline Milestone Card</text>
      <text x="20" y="155" font-size="13" font-weight="700" fill="#334155">• Renders Rate Estimate Card</text>
      <text x="20" y="185" class="mono" font-size="11.5" font-weight="800" fill="#475569">streamMessage() [EventStream]</text>
    </g>
  </g>

  <!-- =========================================================================
       STAGE 3: PARALLEL WORKER SPECIALISTS (x: 1020)
       ========================================================================= -->
  <g transform="translate(1020, 150)">
    <rect width="440" height="1260" rx="20" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>
    <rect x="25" y="20" width="390" height="52" rx="12" fill="#F8FAFC" stroke="#000000" stroke-width="2.5"/>
    <text x="220" y="52" font-size="16" font-weight="900" fill="#000000" text-anchor="middle">
      3. SPECIALIZED WORKER AGENTS
    </text>

    <!-- Worker 1: Knowledge RAG -->
    <g transform="translate(25, 100)">
      <rect width="390" height="320" rx="16" fill="#F8FAFC" stroke="#000000" stroke-width="2.2"/>
      <text x="195" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">Knowledge Retrieval Agent</text>
      <text x="20" y="65" font-size="13" font-weight="700" fill="#334155">• MRL 512-dim Dense Embeddings</text>
      <text x="20" y="95" font-size="13" font-weight="700" fill="#334155">• BM25 Sparse Lexical Exact Matching</text>
      <text x="20" y="125" font-size="13" font-weight="700" fill="#334155">• Reciprocal Rank Fusion (alpha = 0.70)</text>
      <text x="20" y="155" font-size="13" font-weight="700" fill="#334155">• 9 Official Carrier SOP Corpus</text>
      <text x="20" y="185" font-size="13" font-weight="700" fill="#334155">• Decree 47/2011 &amp; Postal Law 49/2010</text>
      <text x="20" y="215" font-size="13" font-weight="700" fill="#334155">• Cutoff Threshold tau = 0.60</text>
      <text x="20" y="255" class="mono" font-size="12" font-weight="800" fill="#000000">Groundedness: 94.8%</text>
      <text x="20" y="285" class="mono" font-size="11" font-weight="800" fill="#475569">VectorStoreService.hybridSearch()</text>
    </g>

    <!-- Worker 2: Deterministic Tools -->
    <g transform="translate(25, 450)">
      <rect width="390" height="340" rx="16" fill="#FFFFFF" stroke="#000000" stroke-width="2.2"/>
      <text x="195" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">Operational Tool Agent</text>
      <text x="20" y="65" font-size="13" font-weight="700" fill="#334155">• trackShipment(trackingCode)</text>
      <text x="20" y="95" font-size="13" font-weight="700" fill="#334155">• calculateShippingRate(W, L, W, H)</text>
      <text x="35" y="120" font-size="12.5" font-weight="800" fill="#000000">IATA Volumetric: L×W×H/6000</text>
      <text x="20" y="150" font-size="13" font-weight="700" fill="#334155">• cancelShipment(trackingCode)</text>
      <text x="20" y="180" font-size="13" font-weight="700" fill="#334155">• changeDeliveryAddress(code, addr)</text>
      <text x="20" y="210" font-size="13" font-weight="700" fill="#334155">• Two-Phase Commit Action Draft DTO</text>
      <text x="20" y="250" class="mono" font-size="12" font-weight="800" fill="#000000">Tool Accuracy: 100.0%</text>
      <text x="20" y="280" class="mono" font-size="11" font-weight="800" fill="#475569">LogisticsToolsService</text>
    </g>

    <!-- Worker 3: Claims & Disputes -->
    <g transform="translate(25, 820)">
      <rect width="390" height="230" rx="16" fill="#F8FAFC" stroke="#000000" stroke-width="2.2"/>
      <text x="195" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">Claims &amp; Dispute Agent</text>
      <text x="20" y="65" font-size="13" font-weight="700" fill="#334155">• 24-Hour Dispute Hearing Window</text>
      <text x="20" y="95" font-size="13" font-weight="700" fill="#334155">• Chain of Custody CCTV Review</text>
      <text x="20" y="125" font-size="13" font-weight="700" fill="#334155">• Warehouse Salvage &amp; Recovery</text>
      <text x="20" y="155" font-size="13" font-weight="700" fill="#334155">• Auto-Escalation to Financial Claim</text>
      <text x="20" y="195" class="mono" font-size="11" font-weight="800" fill="#475569">claims-service &amp; MinIO Evidence</text>
    </g>
  </g>

  <!-- =========================================================================
       STAGE 4: INDEPENDENT VALIDATION CRITIC (x: 1540)
       ========================================================================= -->
  <g transform="translate(1540, 150)">
    <rect width="420" height="1260" rx="20" fill="#F8FAFC" stroke="#000000" stroke-width="3.5"/>
    <rect x="25" y="20" width="370" height="52" rx="12" fill="#E2E8F0" stroke="#000000" stroke-width="2.5"/>
    <text x="210" y="52" font-size="16" font-weight="900" fill="#000000" text-anchor="middle">
      4. VALIDATION CRITIC GATEKEEPER
    </text>

    <!-- Physical Ceiling Verification -->
    <g transform="translate(25, 100)">
      <rect width="370" height="240" rx="14" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="185" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">3 Physical Operational Ceilings</text>
      <text x="20" y="65" font-size="13" font-weight="700" fill="#334155">• Tier 1: &lt;= 20kg, edge &lt;= 60cm (Courier)</text>
      <text x="20" y="95" font-size="13" font-weight="700" fill="#334155">• Tier 2: 21-70kg, edge 61-150cm (Truck)</text>
      <text x="20" y="125" font-size="13" font-weight="700" fill="#334155">• Tier 3: &gt; 70kg, max edge &gt; 150cm</text>
      <text x="35" y="155" font-size="13" font-weight="900" fill="#000000">-> HARD BLOCK: Order Rejected</text>
      <text x="20" y="195" class="mono" font-size="11.5" font-weight="800" fill="#475569">isOverLimitPhysical()</text>
    </g>

    <!-- Security & Prohibited Goods -->
    <g transform="translate(25, 370)">
      <rect width="370" height="240" rx="14" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="185" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">Statutory Security Gate</text>
      <text x="20" y="65" font-size="13" font-weight="700" fill="#334155">• Prohibited Goods: Decree 47/2011</text>
      <text x="20" y="95" font-size="13" font-weight="700" fill="#334155">• High-value seal check (&gt; 10M VND)</text>
      <text x="20" y="125" font-size="13" font-weight="700" fill="#334155">• COD fraud inspection (&gt;= 15M VND)</text>
      <text x="20" y="155" font-size="13" font-weight="700" fill="#334155">• OWASP Injection &amp; IDOR neutralization</text>
      <text x="20" y="195" class="mono" font-size="11.5" font-weight="800" fill="#475569">callValidationAgent()</text>
    </g>

    <!-- HITL Escalation Gate -->
    <g transform="translate(25, 640)">
      <rect width="370" height="230" rx="14" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="185" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">Human-in-the-Loop (HITL)</text>
      <text x="20" y="65" font-size="13" font-weight="700" fill="#334155">• Sets requiresHITL: true</text>
      <text x="20" y="95" font-size="13" font-weight="700" fill="#334155">• Halts autonomous tool execution</text>
      <text x="20" y="125" font-size="13" font-weight="700" fill="#334155">• Generates human approval card</text>
      <text x="20" y="155" font-size="13" font-weight="700" fill="#334155">• Carrier supervisor sign-off</text>
      <text x="20" y="195" class="mono" font-size="11.5" font-weight="800" fill="#475569">Action Draft DTO Locked</text>
    </g>
  </g>

  <!-- =========================================================================
       STAGE 5: EXECUTION COMMIT & AUDIT LOGS (x: 2020)
       ========================================================================= -->
  <g transform="translate(2020, 150)">
    <rect width="300" height="1260" rx="20" fill="#FFFFFF" stroke="#000000" stroke-width="3.5"/>
    <rect x="20" y="20" width="260" height="52" rx="12" fill="#F8FAFC" stroke="#000000" stroke-width="2.5"/>
    <text x="150" y="52" font-size="16" font-weight="900" fill="#000000" text-anchor="middle">
      5. COMMIT &amp; AUDIT
    </text>

    <!-- Final State -->
    <g transform="translate(20, 100)">
      <rect width="260" height="240" rx="14" fill="#FFFFFF" stroke="#000000" stroke-width="2.0"/>
      <text x="130" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">State Commitment</text>
      <text x="15" y="65" font-size="13" font-weight="700" fill="#334155">• API Mutation Commit</text>
      <text x="15" y="95" font-size="13" font-weight="700" fill="#334155">• Waybill DB updated</text>
      <text x="15" y="125" font-size="13" font-weight="700" fill="#334155">• Kafka event published</text>
      <text x="15" y="155" font-size="13" font-weight="700" fill="#334155">• Push Notification</text>
      <text x="15" y="195" class="mono" font-size="11" font-weight="800" fill="#475569">POST /api/v1/shipments</text>
    </g>

    <!-- Audit Traceability -->
    <g transform="translate(20, 370)">
      <rect width="260" height="240" rx="14" fill="#F8FAFC" stroke="#000000" stroke-width="2.0"/>
      <text x="130" y="32" font-size="15" font-weight="900" fill="#000000" text-anchor="middle">Audit Traceability</text>
      <text x="15" y="65" font-size="13" font-weight="700" fill="#334155">• Full prompt &amp; tools log</text>
      <text x="15" y="95" font-size="13" font-weight="700" fill="#334155">• RAG chunk citations</text>
      <text x="15" y="125" font-size="13" font-weight="700" fill="#334155">• Latency execution breakdown</text>
      <text x="15" y="155" font-size="13" font-weight="700" fill="#334155">• Explainable AI logs</text>
      <text x="15" y="195" class="mono" font-size="11" font-weight="800" fill="#475569">ai_agent_audit_logs</text>
    </g>
  </g>

  <!-- =========================================================================
       CLEAN INTER-STAGE TRANSITION ARROWS (ZERO OVERLAP)
       Straightforward horizontal and diagonal arrows traversing open corridors with 15px clearance!
       ========================================================================= -->
  <g fill="none" stroke="#000000" stroke-width="3.2" stroke-dasharray="8,6" stroke-linecap="round">
    <!-- Stage 1 -> Stage 2 -->
    <line x1="440" y1="200" x2="505" y2="200" marker-end="url(#arr-collab-bw)"/>
    <line x1="440" y1="440" x2="505" y2="440" marker-end="url(#arr-collab-bw)"/>

    <!-- Stage 2 -> Stage 3 (Parallel Workers) -->
    <path d="M 940,260 C 970,260 985,260 1005,260" marker-end="url(#arr-collab-bw)"/>
    <path d="M 940,460 C 970,460 985,620 1005,620" marker-end="url(#arr-collab-bw)"/>
    <path d="M 940,460 C 970,460 985,930 1005,930" marker-end="url(#arr-collab-bw)"/>

    <!-- Stage 3 -> Stage 4 (Validation Critic) -->
    <path d="M 1460,260 C 1490,260 1505,220 1525,220" marker-end="url(#arr-collab-bw)"/>
    <path d="M 1460,620 C 1490,620 1505,490 1525,490" marker-end="url(#arr-collab-bw)"/>
    <path d="M 1460,930 C 1490,930 1505,750 1525,750" marker-end="url(#arr-collab-bw)"/>

    <!-- Stage 4 -> Stage 5 (Commit) -->
    <line x1="1960" y1="220" x2="2005" y2="220" marker-end="url(#arr-collab-bw)"/>
    <line x1="1960" y1="490" x2="2005" y2="490" marker-end="url(#arr-collab-bw)"/>
  </g>
</svg>''')

    out_svg = "docs/research/paper/diagrams/multi-agent-task-collaboration-bw.svg"
    out_png = "docs/research/paper/diagrams/multi-agent-task-collaboration-bw.png"
    with open(out_svg, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Generated {out_svg}")
    render_svg_to_png(out_svg, out_png, width=W, height=H)

if __name__ == "__main__":
    build_architecture_bw_svg()
    build_collaboration_bw_svg()
    build_evaluation_dashboard_bw_svg()
