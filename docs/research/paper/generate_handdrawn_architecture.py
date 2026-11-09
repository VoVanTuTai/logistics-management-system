#!/usr/bin/env python3
"""
generate_handdrawn_architecture.py
Generates an enterprise IT system architecture diagram in a flat, hand-drawn digital illustration style
matching the user's exact specification:
- Style: Flat, hand-drawn digital illustration with bold black outlines (stroke 2.5-3.5px),
  clean white background, minimal pastel palette:
    * Pastel Yellow (#FEF08A, #FDE047)
    * Pastel Purple (#E9D5FF, #DDD6FE)
    * Light Grey (#F1F5F9, #E2E8F0)
- Layout: Distributed radial clusters connected by curved dashed black arrows:
    * Center: Light grey oval "Enterprise AI Platform" radiating outward
    * Top: "Data Ingestion & Pipelines" (Gears + Funnel) -> Streaming, Batch Processing, API Connectors
    * Top-Left: "Storage & Databases" (Disk stack + Folder) -> NoSQL Databases, Vector Storage, Data Lake
    * Right: "Model Training & Serving" (Half-purple half-yellow Brain + Computer) -> LLMs, Custom Fine-tuning, Vision Models, Inference API
    * Bottom-Left: "Application & API Gateway" (Web browser + Yellow magnifying glass + Smartphone) -> User UI, REST APIs, GraphQL
    * Bottom-Right: "Security & Monitoring" (Shield + Purple/Yellow bar chart) -> RBAC & Auth, Audit Logs, Performance Metrics
- Typography: Clean, natural sans-serif (Plus Jakarta Sans, Quicksand, Inter), high readability, zero 3D, zero shadows.
Outputs:
  docs/research/paper/diagrams/enterprise-ai-handdrawn-architecture.svg
  docs/research/paper/diagrams/enterprise-ai-handdrawn-architecture.png (300 DPI, 4000x2800 px)
"""

import os
import re
import subprocess
import xml.etree.ElementTree as ET

SVG_OUTPUT = "docs/research/paper/diagrams/enterprise-ai-handdrawn-architecture.svg"
PNG_OUTPUT = "docs/research/paper/diagrams/enterprise-ai-handdrawn-architecture.png"

def draw_arrow_head(x, y, angle_deg, size=14, color="#1E293B"):
    """Generates an arrow head rotated by angle_deg in degrees."""
    import math
    rad = math.radians(angle_deg)
    # Arrow tip is at (x, y)
    # Left barb
    rad_left = rad + math.radians(150)
    x1 = x + size * math.cos(rad_left)
    y1 = y + size * math.sin(rad_left)
    # Right barb
    rad_right = rad - math.radians(150)
    x2 = x + size * math.cos(rad_right)
    y2 = y + size * math.sin(rad_right)
    return f'<polygon points="{x:.1f},{y:.1f} {x1:.1f},{y1:.1f} {x2:.1f},{y2:.1f}" fill="{color}" stroke="{color}" stroke-width="1.5" stroke-linejoin="round"/>'

def build_svg():
    W = 2400
    H = 1700
    cx, cy = 1200, 850

    lines = []
    lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&amp;family=Fredoka:wght@600;700&amp;display=swap');
      * {{ box-sizing: border-box; }}
      text {{ font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }}
      .hand-title {{ font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; }}
      .pill-text {{ font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; }}
    </style>
  </defs>

  <!-- PURE CLEAN WHITE BACKGROUND -->
  <rect width="{W}" height="{H}" fill="#FFFFFF"/>

  <!-- =========================================================================
       DECORATIVE HAND-DRAWN DOODLES / SPARKLES
       ========================================================================= -->
  <g id="Background_Doodles" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round" fill="none">
    <!-- Star sparkles -->
    <path d="M 680 220 L 680 240 M 670 230 L 690 230"/>
    <path d="M 1720 250 L 1720 270 M 1710 260 L 1730 260"/>
    <path d="M 1120 700 L 1120 716 M 1112 708 L 1128 708" stroke="#FDE047"/>
    <path d="M 1280 990 L 1280 1006 M 1272 998 L 1288 998" stroke="#DDD6FE"/>
    <path d="M 320 950 L 320 970 M 310 960 L 330 960"/>
    <path d="M 2150 1200 L 2150 1220 M 2140 1210 L 2160 1210"/>
  </g>''')

    # =========================================================================
    # 5 MAIN CONNECTORS FROM CENTER OVAL TO CLUSTERS (CURVED DASHED BLACK ARROWS)
    # =========================================================================
    lines.append('''
  <!-- =========================================================================
       CURVED DASHED CONNECTING ARROWS (CENTER TO CLUSTERS)
       ========================================================================= -->
  <g id="Radial_Connectors" stroke="#1E293B" stroke-width="3.2" stroke-linecap="round" fill="none">
    <!-- Arrow 1: Center -> Top (Data Ingestion & Pipelines) -->
    <path d="M 1200 750 Q 1180 580 1200 440" stroke-dasharray="9,7"/>
    <!-- Arrowhead at (1200, 440) pointing up -->
    <polygon points="1200,432 1192,448 1208,448" fill="#1E293B"/>

    <!-- Arrow 2: Center -> Top-Left (Storage & Databases) -->
    <path d="M 1040 800 Q 820 720 660 560" stroke-dasharray="9,7"/>
    <!-- Arrowhead at (660, 560) pointing up-left -->
    <polygon points="652,554 669,559 660,573" fill="#1E293B"/>

    <!-- Arrow 3: Center -> Right (Model Training & Serving) -->
    <path d="M 1370 850 Q 1540 850 1710 850" stroke-dasharray="9,7"/>
    <!-- Arrowhead at (1710, 850) pointing right -->
    <polygon points="1722,850 1706,842 1706,858" fill="#1E293B"/>

    <!-- Arrow 4: Center -> Bottom-Left (Application & API Gateway) -->
    <path d="M 1060 910 Q 850 1020 680 1140" stroke-dasharray="9,7"/>
    <!-- Arrowhead at (680, 1140) pointing down-left -->
    <polygon points="672,1146 680,1130 691,1143" fill="#1E293B"/>

    <!-- Arrow 5: Center -> Bottom-Right (Security & Monitoring) -->
    <path d="M 1340 915 Q 1510 1020 1630 1140" stroke-dasharray="9,7"/>
    <!-- Arrowhead at (1630, 1140) pointing down-right -->
    <polygon points="1638,1146 1619,1142 1630,1129" fill="#1E293B"/>
  </g>''')

    # =========================================================================
    # CENTER OVAL: ENTERPRISE AI PLATFORM
    # =========================================================================
    lines.append(f'''
  <!-- =========================================================================
       CENTER: ENTERPRISE AI PLATFORM
       ========================================================================= -->
  <g id="Center_Enterprise_AI_Platform" transform="translate({cx}, {cy})">
    <!-- Subtle secondary offset hand-drawn outline -->
    <ellipse cx="2" cy="3" rx="198" ry="102" fill="none" stroke="#E2E8F0" stroke-width="3" stroke-dasharray="6,6"/>

    <!-- Main Light Grey Oval -->
    <ellipse cx="0" cy="0" rx="195" ry="98" fill="#F1F5F9" stroke="#1E293B" stroke-width="3.8"/>

    <!-- Inner decorative border ring -->
    <ellipse cx="0" cy="0" rx="182" ry="86" fill="none" stroke="#CBD5E1" stroke-width="1.8" stroke-dasharray="5,4"/>

    <!-- Central Icon: AI Spark Core -->
    <g transform="translate(0, -32)">
      <circle cx="0" cy="0" r="15" fill="#FEF08A" stroke="#1E293B" stroke-width="2.6"/>
      <path d="M 0 -22 L 0 -15 M 0 15 L 0 22 M -22 0 L -15 0 M 15 0 L 22 0" stroke="#1E293B" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="-32" cy="-6" r="5" fill="#E9D5FF" stroke="#1E293B" stroke-width="2"/>
      <circle cx="32" cy="-6" r="5" fill="#E9D5FF" stroke="#1E293B" stroke-width="2"/>
    </g>

    <!-- Text: Enterprise AI Platform -->
    <text x="0" y="16" class="hand-title" font-size="25" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="-0.01em">
      Enterprise AI Platform
    </text>
    <text x="0" y="42" font-size="13" font-weight="800" fill="#64748B" text-anchor="middle" letter-spacing="0.08em">
      CORE INTEGRATION BUS
    </text>
  </g>''')

    # =========================================================================
    # CLUSTER 1 (TOP): DATA INGESTION & PIPELINES
    # =========================================================================
    top_x, top_y = 1200, 310
    lines.append(f'''
  <!-- =========================================================================
       CLUSTER 1 (TOP): DATA INGESTION & PIPELINES
       ========================================================================= -->
  <g id="Cluster_Data_Ingestion">
    <!-- Sub-Branches from Data Ingestion to Pills -->
    <g stroke="#1E293B" stroke-width="2.5" stroke-dasharray="6,5" stroke-linecap="round" fill="none">
      <!-- To Streaming -->
      <path d="M 1080 {top_y - 45} Q 1000 230 960 185"/>
      <!-- To Batch Processing -->
      <path d="M 1200 {top_y - 55} L 1200 185"/>
      <!-- To API Connectors -->
      <path d="M 1320 {top_y - 45} Q 1400 230 1440 185"/>
    </g>

    <!-- Sub-Pill 1: Streaming (Pastel Purple) -->
    <g transform="translate(960, 150)">
      <rect x="-85" y="-24" width="170" height="48" rx="24" fill="#E9D5FF" stroke="#1E293B" stroke-width="3"/>
      <!-- Pulse stream wave icon -->
      <path d="M -60 0 L -50 0 L -43 -10 L -33 10 L -25 -6 L -17 0 L -8 0" stroke="#1E293B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <text x="14" y="6" class="pill-text" font-size="16" fill="#1E293B" text-anchor="middle">Streaming</text>
    </g>

    <!-- Sub-Pill 2: Batch Processing (Light Grey) -->
    <g transform="translate(1200, 150)">
      <rect x="-105" y="-24" width="210" height="48" rx="24" fill="#F1F5F9" stroke="#1E293B" stroke-width="3"/>
      <!-- Stack boxes icon -->
      <rect x="-82" y="-10" width="18" height="8" rx="2" fill="#FEF08A" stroke="#1E293B" stroke-width="2"/>
      <rect x="-82" y="2" width="18" height="8" rx="2" fill="#E9D5FF" stroke="#1E293B" stroke-width="2"/>
      <text x="10" y="6" class="pill-text" font-size="16" fill="#1E293B" text-anchor="middle">Batch Processing</text>
    </g>

    <!-- Sub-Pill 3: API Connectors (Pastel Yellow) -->
    <g transform="translate(1440, 150)">
      <rect x="-95" y="-24" width="190" height="48" rx="24" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <!-- Plugs icon -->
      <path d="M -70 -5 L -60 -5 M -70 5 L -60 5 M -60 -9 L -60 9 M -60 0 L -48 0" stroke="#1E293B" stroke-width="2.4" stroke-linecap="round"/>
      <text x="12" y="6" class="pill-text" font-size="16" fill="#1E293B" text-anchor="middle">API Connectors</text>
    </g>

    <!-- Main Card: Data Ingestion & Pipelines -->
    <g transform="translate({top_x}, {top_y})">
      <!-- Shadow-offset card shape -->
      <rect x="-222" y="-57" width="444" height="114" rx="26" fill="#FEF9C3" stroke="#1E293B" stroke-width="3.5"/>

      <!-- Hand-drawn Illustration: Gears and Funnel -->
      <g transform="translate(-145, 0)">
        <!-- Yellow Gear -->
        <g transform="translate(-18, -12)">
          <circle cx="0" cy="0" r="18" fill="#FDE047" stroke="#1E293B" stroke-width="2.6"/>
          <!-- 6 Gear teeth -->
          <rect x="-4" y="-26" width="8" height="8" rx="2" fill="#FDE047" stroke="#1E293B" stroke-width="2"/>
          <rect x="-4" y="18" width="8" height="8" rx="2" fill="#FDE047" stroke="#1E293B" stroke-width="2"/>
          <rect x="-26" y="-4" width="8" height="8" rx="2" fill="#FDE047" stroke="#1E293B" stroke-width="2"/>
          <rect x="18" y="-4" width="8" height="8" rx="2" fill="#FDE047" stroke="#1E293B" stroke-width="2"/>
          <circle cx="0" cy="0" r="7" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.2"/>
        </g>
        <!-- Purple Small Gear -->
        <g transform="translate(8, 14)">
          <circle cx="0" cy="0" r="13" fill="#E9D5FF" stroke="#1E293B" stroke-width="2.4"/>
          <circle cx="0" cy="0" r="4.5" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
        </g>
        <!-- Funnel (Purple/Yellow) -->
        <g transform="translate(36, -4)">
          <!-- Top wide cone -->
          <polygon points="0,-18 32,-18 20,4 12,4" fill="#E9D5FF" stroke="#1E293B" stroke-width="2.4" stroke-linejoin="round"/>
          <!-- Spout tube -->
          <rect x="12" y="4" width="8" height="16" rx="1" fill="#FEF08A" stroke="#1E293B" stroke-width="2.2"/>
          <!-- Drops coming out -->
          <circle cx="16" cy="26" r="2.5" fill="#1E293B"/>
        </g>
      </g>

      <!-- Cluster Title -->
      <g transform="translate(25, 0)">
        <text x="0" y="-3" class="hand-title" font-size="21" font-weight="900" fill="#0F172A" text-anchor="middle">
          Data Ingestion &amp; Pipelines
        </text>
        <text x="0" y="24" font-size="12.5" font-weight="800" fill="#64748B" text-anchor="middle">
          ETL • Real-time Streams • Queue Brokers
        </text>
      </g>
    </g>
  </g>''')

    # =========================================================================
    # CLUSTER 2 (TOP-LEFT): STORAGE & DATABASES
    # =========================================================================
    sto_x, sto_y = 500, 480
    lines.append(f'''
  <!-- =========================================================================
       CLUSTER 2 (TOP-LEFT): STORAGE & DATABASES
       ========================================================================= -->
  <g id="Cluster_Storage_Databases">
    <!-- Sub-Branches to Pills -->
    <g stroke="#1E293B" stroke-width="2.5" stroke-dasharray="6,5" stroke-linecap="round" fill="none">
      <!-- To NoSQL Databases -->
      <path d="M {sto_x - 170} {sto_y - 20} Q 320 400 230 350"/>
      <!-- To Vector Storage -->
      <path d="M {sto_x - 190} {sto_y + 15} Q 280 500 210 520"/>
      <!-- To Data Lake -->
      <path d="M {sto_x - 130} {sto_y + 55} Q 260 620 220 680"/>
    </g>

    <!-- Sub-Pill 1: NoSQL Databases (Pastel Purple) -->
    <g transform="translate(200, 340)">
      <rect x="-95" y="-24" width="190" height="48" rx="24" fill="#E9D5FF" stroke="#1E293B" stroke-width="3"/>
      <!-- Document icon -->
      <rect x="-75" y="-12" width="16" height="22" rx="3" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <line x1="-70" y1="-5" x2="-63" y2="-5" stroke="#1E293B" stroke-width="2"/>
      <line x1="-70" y1="0" x2="-63" y2="0" stroke="#1E293B" stroke-width="2"/>
      <text x="12" y="6" class="pill-text" font-size="15.5" fill="#1E293B" text-anchor="middle">NoSQL Databases</text>
    </g>

    <!-- Sub-Pill 2: Vector Storage (Light Grey) -->
    <g transform="translate(190, 520)">
      <rect x="-90" y="-24" width="180" height="48" rx="24" fill="#F1F5F9" stroke="#1E293B" stroke-width="3"/>
      <!-- Vector cube / embedding icon -->
      <circle cx="-68" cy="0" r="4" fill="#FEF08A" stroke="#1E293B" stroke-width="2"/>
      <circle cx="-52" cy="-8" r="4" fill="#E9D5FF" stroke="#1E293B" stroke-width="2"/>
      <circle cx="-52" cy="8" r="4" fill="#E9D5FF" stroke="#1E293B" stroke-width="2"/>
      <line x1="-68" y1="0" x2="-52" y2="-8" stroke="#1E293B" stroke-width="1.8"/>
      <line x1="-68" y1="0" x2="-52" y2="8" stroke="#1E293B" stroke-width="1.8"/>
      <text x="14" y="6" class="pill-text" font-size="15.5" fill="#1E293B" text-anchor="middle">Vector Storage</text>
    </g>

    <!-- Sub-Pill 3: Data Lake (Pastel Yellow) -->
    <g transform="translate(200, 690)">
      <rect x="-80" y="-24" width="160" height="48" rx="24" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <!-- Lake waves icon -->
      <path d="M -64 -4 C -58 -10 -52 -10 -46 -4 C -40 2 -34 2 -28 -4" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path d="M -64 6 C -58 0 -52 0 -46 6 C -40 12 -34 12 -28 6" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <text x="12" y="6" class="pill-text" font-size="15.5" fill="#1E293B" text-anchor="middle">Data Lake</text>
    </g>

    <!-- Main Card: Storage & Databases -->
    <g transform="translate({sto_x}, {sto_y})">
      <rect x="-215" y="-55" width="430" height="110" rx="26" fill="#FEF08A" stroke="#1E293B" stroke-width="3.5"/>

      <!-- Hand-drawn Illustration: Disk Stack + Folders -->
      <g transform="translate(-135, 0)">
        <!-- Cylinder 1 (Bottom Disk) -->
        <g transform="translate(-15, 14)">
          <path d="M -22 0 L -22 14 C -22 22 22 22 22 14 L 22 0" fill="#FDE047" stroke="#1E293B" stroke-width="2.4"/>
          <ellipse cx="0" cy="0" rx="22" ry="8" fill="#FEF9C3" stroke="#1E293B" stroke-width="2.4"/>
        </g>
        <!-- Cylinder 2 (Middle Disk) -->
        <g transform="translate(-15, -2)">
          <path d="M -22 0 L -22 14 C -22 22 22 22 22 14 L 22 0" fill="#FDE047" stroke="#1E293B" stroke-width="2.4"/>
          <ellipse cx="0" cy="0" rx="22" ry="8" fill="#FEF9C3" stroke="#1E293B" stroke-width="2.4"/>
        </g>
        <!-- Cylinder 3 (Top Disk) -->
        <g transform="translate(-15, -18)">
          <path d="M -22 0 L -22 14 C -22 22 22 22 22 14 L 22 0" fill="#FDE047" stroke="#1E293B" stroke-width="2.4"/>
          <ellipse cx="0" cy="0" rx="22" ry="8" fill="#FEF9C3" stroke="#1E293B" stroke-width="2.4"/>
        </g>

        <!-- Folder Icon (Purple) -->
        <g transform="translate(25, 2)">
          <!-- Back tab -->
          <path d="M -18 -16 L -6 -16 L -2 -10 L 16 -10 L 16 14 L -18 14 Z" fill="#DDD6FE" stroke="#1E293B" stroke-width="2.2" stroke-linejoin="round"/>
          <!-- Front flap -->
          <polygon points="-20,-8 14,-8 20,16 -14,16" fill="#E9D5FF" stroke="#1E293B" stroke-width="2.2" stroke-linejoin="round"/>
        </g>
      </g>

      <!-- Cluster Title -->
      <g transform="translate(30, 0)">
        <text x="0" y="-3" class="hand-title" font-size="21" font-weight="900" fill="#0F172A" text-anchor="middle">
          Storage &amp; Databases
        </text>
        <text x="0" y="24" font-size="12.5" font-weight="800" fill="#64748B" text-anchor="middle">
          Structured • Unstructured • Vector Embeddings
        </text>
      </g>
    </g>
  </g>''')

    # =========================================================================
    # CLUSTER 3 (RIGHT): MODEL TRAINING & SERVING
    # =========================================================================
    mod_x, mod_y = 1920, 850
    lines.append(f'''
  <!-- =========================================================================
       CLUSTER 3 (RIGHT): MODEL TRAINING & SERVING
       ========================================================================= -->
  <g id="Cluster_Model_Training_Serving">
    <!-- Sub-Branches to 4 Pills radiating rightward -->
    <g stroke="#1E293B" stroke-width="2.5" stroke-dasharray="6,5" stroke-linecap="round" fill="none">
      <!-- To LLMs -->
      <path d="M {mod_x + 190} {mod_y - 35} Q 2120 730 2200 680"/>
      <!-- To Custom Fine-tuning -->
      <path d="M {mod_x + 210} {mod_y - 12} Q 2140 800 2220 790"/>
      <!-- To Vision Models -->
      <path d="M {mod_x + 210} {mod_y + 15} Q 2140 900 2210 920"/>
      <!-- To Inference API -->
      <path d="M {mod_x + 190} {mod_y + 40} Q 2120 1010 2190 1040"/>
    </g>

    <!-- Sub-Pill 1: LLMs (Pastel Yellow) -->
    <g transform="translate(2250, 670)">
      <rect x="-65" y="-24" width="130" height="48" rx="24" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <!-- Chat bubbles icon -->
      <circle cx="-38" cy="-4" r="7" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <circle cx="-25" cy="4" r="6" fill="#E9D5FF" stroke="#1E293B" stroke-width="1.8"/>
      <text x="12" y="6" class="pill-text" font-size="16" fill="#1E293B" text-anchor="middle">LLMs</text>
    </g>

    <!-- Sub-Pill 2: Custom Fine-tuning (Light Grey) -->
    <g transform="translate(2250, 790)">
      <rect x="-105" y="-24" width="210" height="48" rx="24" fill="#F1F5F9" stroke="#1E293B" stroke-width="3"/>
      <!-- Sliders / tuning icon -->
      <line x1="-85" y1="-8" x2="-60" y2="-8" stroke="#1E293B" stroke-width="2"/>
      <circle cx="-72" cy="-8" r="3.5" fill="#FEF08A" stroke="#1E293B" stroke-width="1.8"/>
      <line x1="-85" y1="4" x2="-60" y2="4" stroke="#1E293B" stroke-width="2"/>
      <circle cx="-78" cy="4" r="3.5" fill="#E9D5FF" stroke="#1E293B" stroke-width="1.8"/>
      <text x="12" y="6" class="pill-text" font-size="15" fill="#1E293B" text-anchor="middle">Custom Fine-tuning</text>
    </g>

    <!-- Sub-Pill 3: Vision Models (Pastel Purple) -->
    <g transform="translate(2240, 920)">
      <rect x="-85" y="-24" width="170" height="48" rx="24" fill="#E9D5FF" stroke="#1E293B" stroke-width="3"/>
      <!-- Eye / Lens icon -->
      <path d="M -68 0 C -60 -9 -44 -9 -36 0 C -44 9 -60 9 -68 0 Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <circle cx="-52" cy="0" r="4.5" fill="#FEF08A" stroke="#1E293B" stroke-width="1.8"/>
      <text x="12" y="6" class="pill-text" font-size="15.5" fill="#1E293B" text-anchor="middle">Vision Models</text>
    </g>

    <!-- Sub-Pill 4: Inference API (Pastel Yellow) -->
    <g transform="translate(2230, 1045)">
      <rect x="-85" y="-24" width="170" height="48" rx="24" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <!-- Flash lightning bolt icon -->
      <polygon points="-58,-12 -66,0 -59,0 -64,12 -50,-2 -57,-2" fill="#FDE047" stroke="#1E293B" stroke-width="2" stroke-linejoin="round"/>
      <text x="12" y="6" class="pill-text" font-size="15.5" fill="#1E293B" text-anchor="middle">Inference API</text>
    </g>

    <!-- Main Card: Model Training & Serving -->
    <g transform="translate({mod_x}, {mod_y})">
      <rect x="-225" y="-60" width="450" height="120" rx="26" fill="#E9D5FF" stroke="#1E293B" stroke-width="3.5"/>

      <!-- Hand-drawn Illustration: Half-Purple Half-Yellow Brain + Computer -->
      <g transform="translate(-142, 0)">
        <!-- Computer Monitor (Light Grey) -->
        <g transform="translate(38, 2)">
          <!-- Screen bezel -->
          <rect x="-20" y="-18" width="40" height="28" rx="4" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.4"/>
          <!-- Inner screen -->
          <rect x="-16" y="-14" width="32" height="20" rx="2" fill="#F1F5F9" stroke="#1E293B" stroke-width="1.4"/>
          <!-- Stand & base -->
          <line x1="0" y1="10" x2="0" y2="18" stroke="#1E293B" stroke-width="2.6"/>
          <line x1="-12" y1="18" x2="12" y2="18" stroke="#1E293B" stroke-width="2.6" stroke-linecap="round"/>
        </g>

        <!-- Brain: Split Half-Purple (Left) & Half-Yellow (Right) -->
        <g transform="translate(-18, -4)">
          <!-- Left Hemisphere (Pastel Purple) -->
          <path d="M 0 -24 C -14 -24 -24 -14 -24 0 C -24 14 -14 24 0 24 Z" fill="#DDD6FE" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
          <!-- Left folds -->
          <path d="M -6 -14 C -14 -12 -16 -4 -8 0 C -16 6 -12 14 -4 16" fill="none" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round"/>

          <!-- Right Hemisphere (Pastel Yellow) -->
          <path d="M 0 -24 C 14 -24 24 -14 24 0 C 24 14 14 24 0 24 Z" fill="#FDE047" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
          <!-- Right folds -->
          <path d="M 6 -14 C 14 -12 16 -4 8 0 C 16 6 12 14 4 16" fill="none" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round"/>

          <!-- Center dividing fissure line -->
          <line x1="0" y1="-24" x2="0" y2="24" stroke="#1E293B" stroke-width="2.4"/>
        </g>
      </g>

      <!-- Cluster Title -->
      <g transform="translate(32, 0)">
        <text x="0" y="-4" class="hand-title" font-size="21" font-weight="900" fill="#0F172A" text-anchor="middle">
          Model Training &amp; Serving
        </text>
        <text x="0" y="24" font-size="12.5" font-weight="800" fill="#64748B" text-anchor="middle">
          Fine-Tuning • Distributed Inference • Weights
        </text>
      </g>
    </g>
  </g>''')

    # =========================================================================
    # CLUSTER 4 (BOTTOM-LEFT): APPLICATION & API GATEWAY
    # =========================================================================
    app_x, app_y = 500, 1220
    lines.append(f'''
  <!-- =========================================================================
       CLUSTER 4 (BOTTOM-LEFT): APPLICATION & API GATEWAY
       ========================================================================= -->
  <g id="Cluster_App_Gateway">
    <!-- Sub-Branches to 3 Pills radiating downwards/leftwards -->
    <g stroke="#1E293B" stroke-width="2.5" stroke-dasharray="6,5" stroke-linecap="round" fill="none">
      <!-- To User UI -->
      <path d="M {app_x - 170} {app_y - 20} Q 320 1170 230 1190"/>
      <!-- To REST APIs -->
      <path d="M {app_x - 160} {app_y + 35} Q 300 1320 250 1370"/>
      <!-- To GraphQL -->
      <path d="M {app_x - 60} {app_y + 55} Q 400 1420 440 1470"/>
    </g>

    <!-- Sub-Pill 1: User UI (Pastel Yellow) -->
    <g transform="translate(190, 1190)">
      <rect x="-70" y="-24" width="140" height="48" rx="24" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <!-- User profile icon -->
      <circle cx="-42" cy="-5" r="6" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.8"/>
      <path d="M -52 11 C -52 4 -32 4 -32 11" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.8"/>
      <text x="12" y="6" class="pill-text" font-size="16" fill="#1E293B" text-anchor="middle">User UI</text>
    </g>

    <!-- Sub-Pill 2: REST APIs (Pastel Purple) -->
    <g transform="translate(240, 1370)">
      <rect x="-80" y="-24" width="160" height="48" rx="24" fill="#E9D5FF" stroke="#1E293B" stroke-width="3"/>
      <!-- Code brackets icon -->
      <path d="M -58 -7 L -66 0 L -58 7" fill="none" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M -44 -7 L -36 0 L -44 7" fill="none" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round"/>
      <text x="12" y="6" class="pill-text" font-size="16" fill="#1E293B" text-anchor="middle">REST APIs</text>
    </g>

    <!-- Sub-Pill 3: GraphQL (Light Grey) -->
    <g transform="translate(460, 1480)">
      <rect x="-75" y="-24" width="150" height="48" rx="24" fill="#F1F5F9" stroke="#1E293B" stroke-width="3"/>
      <!-- Hexagon / GraphQL nodes icon -->
      <polygon points="-56,-8 -46,-14 -36,-8 -36,4 -46,10 -56,4" fill="#FEF08A" stroke="#1E293B" stroke-width="1.8"/>
      <circle cx="-46" cy="-2" r="3" fill="#E9D5FF" stroke="#1E293B" stroke-width="1.4"/>
      <text x="12" y="6" class="pill-text" font-size="16" fill="#1E293B" text-anchor="middle">GraphQL</text>
    </g>

    <!-- Main Card: Application & API Gateway -->
    <g transform="translate({app_x}, {app_y})">
      <rect x="-225" y="-55" width="450" height="110" rx="26" fill="#F1F5F9" stroke="#1E293B" stroke-width="3.5"/>

      <!-- Hand-drawn Illustration: Web Browser + Yellow Magnifying Glass + Smartphone -->
      <g transform="translate(-142, 0)">
        <!-- Web Browser Window -->
        <g transform="translate(-16, -2)">
          <rect x="-26" y="-20" width="46" height="34" rx="4" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.4"/>
          <!-- Browser header bar -->
          <line x1="-26" y1="-10" x2="20" y2="-10" stroke="#1E293B" stroke-width="1.8"/>
          <!-- 3 dots -->
          <circle cx="-20" cy="-15" r="1.8" fill="#1E293B"/>
          <circle cx="-14" cy="-15" r="1.8" fill="#1E293B"/>
          <circle cx="-8" cy="-15" r="1.8" fill="#1E293B"/>
        </g>

        <!-- Smartphone (Purple) -->
        <g transform="translate(28, 4)">
          <rect x="-10" y="-18" width="20" height="34" rx="4" fill="#E9D5FF" stroke="#1E293B" stroke-width="2.2"/>
          <rect x="-7" y="-14" width="14" height="24" rx="2" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.2"/>
          <!-- Speaker notch & home indicator -->
          <line x1="-3" y1="-16" x2="3" y2="-16" stroke="#1E293B" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="0" cy="13" r="1.5" fill="#1E293B"/>
        </g>

        <!-- Yellow Magnifying Glass (Overlapping front) -->
        <g transform="translate(0, 10)">
          <circle cx="0" cy="0" r="11" fill="#FEF08A" stroke="#1E293B" stroke-width="2.5"/>
          <circle cx="0" cy="0" r="6" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.5"/>
          <!-- Handle -->
          <line x1="8" y1="8" x2="18" y2="18" stroke="#1E293B" stroke-width="3.2" stroke-linecap="round"/>
        </g>
      </g>

      <!-- Cluster Title -->
      <g transform="translate(32, 0)">
        <text x="0" y="-3" class="hand-title" font-size="20.5" font-weight="900" fill="#0F172A" text-anchor="middle">
          Application &amp; API Gateway
        </text>
        <text x="0" y="24" font-size="12.5" font-weight="800" fill="#64748B" text-anchor="middle">
          Reverse Proxy • Web Client • Mobile Apps
        </text>
      </g>
    </g>
  </g>''')

    # =========================================================================
    # CLUSTER 5 (BOTTOM-RIGHT): SECURITY & MONITORING
    # =========================================================================
    sec_x, sec_y = 1780, 1260
    lines.append(f'''
  <!-- =========================================================================
       CLUSTER 5 (BOTTOM-RIGHT): SECURITY & MONITORING
       ========================================================================= -->
  <g id="Cluster_Security_Monitoring">
    <!-- Sub-Branches to 3 Pills radiating downwards/rightwards -->
    <g stroke="#1E293B" stroke-width="2.5" stroke-dasharray="6,5" stroke-linecap="round" fill="none">
      <!-- To RBAC & Auth -->
      <path d="M {sec_x - 140} {sec_y + 45} Q 1580 1390 1520 1450"/>
      <!-- To Audit Logs -->
      <path d="M {sec_x - 20} {sec_y + 55} Q 1720 1420 1740 1480"/>
      <!-- To Performance Metrics -->
      <path d="M {sec_x + 130} {sec_y + 45} Q 1920 1380 2000 1440"/>
    </g>

    <!-- Sub-Pill 1: RBAC & Auth (Pastel Purple) -->
    <g transform="translate(1480, 1470)">
      <rect x="-85" y="-24" width="170" height="48" rx="24" fill="#E9D5FF" stroke="#1E293B" stroke-width="3"/>
      <!-- Key icon -->
      <circle cx="-62" cy="0" r="6" fill="#FEF08A" stroke="#1E293B" stroke-width="1.8"/>
      <line x1="-56" y1="0" x2="-40" y2="0" stroke="#1E293B" stroke-width="2.2"/>
      <line x1="-45" y1="0" x2="-45" y2="5" stroke="#1E293B" stroke-width="2"/>
      <line x1="-40" y1="0" x2="-40" y2="5" stroke="#1E293B" stroke-width="2"/>
      <text x="12" y="6" class="pill-text" font-size="15.5" fill="#1E293B" text-anchor="middle">RBAC &amp; Auth</text>
    </g>

    <!-- Sub-Pill 2: Audit Logs (Light Grey) -->
    <g transform="translate(1740, 1500)">
      <rect x="-75" y="-24" width="150" height="48" rx="24" fill="#F1F5F9" stroke="#1E293B" stroke-width="3"/>
      <!-- Checklist ledger icon -->
      <rect x="-56" y="-12" width="16" height="22" rx="2" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
      <line x1="-51" y1="-5" x2="-44" y2="-5" stroke="#1E293B" stroke-width="1.8"/>
      <line x1="-51" y1="0" x2="-44" y2="0" stroke="#1E293B" stroke-width="1.8"/>
      <line x1="-51" y1="5" x2="-44" y2="5" stroke="#1E293B" stroke-width="1.8"/>
      <text x="12" y="6" class="pill-text" font-size="15.5" fill="#1E293B" text-anchor="middle">Audit Logs</text>
    </g>

    <!-- Sub-Pill 3: Performance Metrics (Pastel Yellow) -->
    <g transform="translate(2020, 1460)">
      <rect x="-110" y="-24" width="220" height="48" rx="24" fill="#FEF08A" stroke="#1E293B" stroke-width="3"/>
      <!-- Gauge dial icon -->
      <path d="M -88 4 A 12 12 0 0 1 -64 4" fill="none" stroke="#1E293B" stroke-width="2.2"/>
      <line x1="-76" y1="4" x2="-70" y2="-4" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round"/>
      <text x="14" y="6" class="pill-text" font-size="15" fill="#1E293B" text-anchor="middle">Performance Metrics</text>
    </g>

    <!-- Main Card: Security & Monitoring -->
    <g transform="translate({sec_x}, {sec_y})">
      <rect x="-220" y="-55" width="440" height="110" rx="26" fill="#FEF08A" stroke="#1E293B" stroke-width="3.5"/>

      <!-- Hand-drawn Illustration: Shield + Bar Chart (Purple/Yellow) -->
      <g transform="translate(-138, 0)">
        <!-- Security Shield (Pastel Purple & Yellow) -->
        <g transform="translate(-16, 0)">
          <!-- Left half shield (Purple) -->
          <path d="M 0 -22 C -18 -22 -22 -10 -22 4 C -22 18 0 26 0 26 Z" fill="#DDD6FE" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
          <!-- Right half shield (Yellow) -->
          <path d="M 0 -22 C 18 -22 22 -10 22 4 C 22 18 0 26 0 26 Z" fill="#FEF08A" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round"/>
          <!-- Center dividing line -->
          <line x1="0" y1="-22" x2="0" y2="26" stroke="#1E293B" stroke-width="2.4"/>
          <!-- Lock keyhole emblem in center -->
          <circle cx="0" cy="0" r="4.5" fill="#1E293B"/>
          <polygon points="-2.5,0 2.5,0 3.5,8 -3.5,8" fill="#1E293B"/>
        </g>

        <!-- Analytics Bar Chart (Purple/Yellow bars) -->
        <g transform="translate(36, 4)">
          <!-- Axis baseline -->
          <line x1="-24" y1="18" x2="24" y2="18" stroke="#1E293B" stroke-width="2.4" stroke-linecap="round"/>
          <!-- Bar 1 (Yellow) -->
          <rect x="-20" y="4" width="8" height="14" rx="2" fill="#FDE047" stroke="#1E293B" stroke-width="1.8"/>
          <!-- Bar 2 (Purple) -->
          <rect x="-9" y="-6" width="8" height="24" rx="2" fill="#E9D5FF" stroke="#1E293B" stroke-width="1.8"/>
          <!-- Bar 3 (Yellow) -->
          <rect x="2" y="-14" width="8" height="32" rx="2" fill="#FDE047" stroke="#1E293B" stroke-width="1.8"/>
          <!-- Bar 4 (Purple) -->
          <rect x="13" y="-2" width="8" height="20" rx="2" fill="#E9D5FF" stroke="#1E293B" stroke-width="1.8"/>
          <!-- Upward Trend Line -->
          <path d="M -16 6 L -5 -4 L 6 -12 L 17 -1" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      </g>

      <!-- Cluster Title -->
      <g transform="translate(32, 0)">
        <text x="0" y="-3" class="hand-title" font-size="21" font-weight="900" fill="#0F172A" text-anchor="middle">
          Security &amp; Monitoring
        </text>
        <text x="0" y="24" font-size="12.5" font-weight="800" fill="#64748B" text-anchor="middle">
          Threat Detection • Access Logs • Observability
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
        print(f"Successfully rendered {PNG_OUTPUT} ({size} bytes)")
    else:
        print(f"Chrome screenshot error: {res.stderr}")
        return 1

    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
