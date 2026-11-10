#!/usr/bin/env python3
"""
plot_data_provenance.py (generate_provenance_svg.py)
Generates academic publication-grade framework diagram (Fig. 1)
using matplotlib with precise publication layout, exact typography,
and no manual SVG coordinate guesswork.
Outputs:
  - docs/research/paper/diagrams/data-provenance-and-benchmark-framework.png (300 DPI)
  - docs/research/paper/diagrams/data-provenance-and-benchmark-framework.svg (Vector)
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Arrow

def generate_academic_data_provenance_diagram():
    png_out = 'docs/research/paper/diagrams/data-provenance-and-benchmark-framework.png'
    svg_out = 'docs/research/paper/diagrams/data-provenance-and-benchmark-framework.svg'

    # 11.5 inches x 5.0 inches (Aspect ratio: 2.3 : 1, matches 7.0 in IEEE paper width)
    fig, ax = plt.subplots(figsize=(11.5, 5.0), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#f8fafc')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Border
    outer_box = FancyBboxPatch((0.5, 0.5), 99.0, 99.0, boxstyle="round,pad=0.2,rounding_size=1.2",
                               linewidth=1.2, edgecolor='#cbd5e1', facecolor='#f8fafc')
    ax.add_patch(outer_box)

    # =========================================================================
    # COLUMN 1: DATA PROVENANCE (LEFT: x: 2.5 to 32.5)
    # =========================================================================
    col1_bg = FancyBboxPatch((2.5, 2.5), 29.5, 95.0, boxstyle="round,pad=0.2,rounding_size=1.0",
                             linewidth=1.0, edgecolor='#94a3b8', facecolor='#ffffff')
    ax.add_patch(col1_bg)

    col1_hdr = FancyBboxPatch((2.5, 89.5), 29.5, 8.0, boxstyle="round,pad=0.1,rounding_size=0.8",
                              linewidth=0, facecolor='#1e293b')
    ax.add_patch(col1_hdr)
    ax.text(17.25, 93.5, "I. DATA PROVENANCE PILLARS", fontsize=8.8, fontweight='bold',
            color='#ffffff', ha='center', va='center')

    # Card 1.1: Statutory Legal
    c1_1 = FancyBboxPatch((4.0, 68.5), 26.5, 19.0, boxstyle="round,pad=0.2,rounding_size=0.6",
                          linewidth=0.8, edgecolor='#93c5fd', facecolor='#eff6ff')
    ax.add_patch(c1_1)
    ax.text(5.5, 84.5, "1. Statutory Laws & Global Standards", fontsize=8.2, fontweight='bold', color='#1e3a8a')
    ax.text(5.5, 80.5, "POSTAL LAW NO. 49, IATA 6000 & UPU", fontsize=6.8, fontweight='bold', color='#2563eb')
    ax.text(5.5, 75.5, "• Vietnam Postal Law 49/2010 (Art. 18/28), Dec. 47 (Art. 25)", fontsize=6.6, color='#334155')
    ax.text(5.5, 71.5, "• IATA Cargo Res. 6000 (L×W×H/6000) & UPU EDI M40/M33", fontsize=6.6, color='#334155')

    # Card 1.2: Carrier SOPs
    c1_2 = FancyBboxPatch((4.0, 44.5), 26.5, 22.0, boxstyle="round,pad=0.2,rounding_size=0.6",
                          linewidth=0.8, edgecolor='#6ee7b7', facecolor='#ecfdf5')
    ax.add_patch(c1_2)
    ax.text(5.5, 63.5, "2. Enterprise Carrier SOP Corpus (9 SOPs)", fontsize=8.2, fontweight='bold', color='#065f46')
    ax.text(5.5, 59.5, "NEXUS COURIER OPERATIONAL CORPUS", fontsize=6.8, fontweight='bold', color='#059669')
    ax.text(5.5, 54.5, "• SOP-01/02: 3 Physical Ceilings (70kg/150cm/300cm), Rates", fontsize=6.6, color='#334155')
    ax.text(5.5, 50.5, "• SOP-04/06: 3 Delivery Attempts, COD Audit, Bubble Wrap ≥3", fontsize=6.6, color='#334155')
    ax.text(5.5, 46.5, "• SOP-07/09: Stray Parcel Investigation, 24h Window & Claims", fontsize=6.6, color='#334155')

    # Card 1.3: Live DB & PII Shield
    c1_3 = FancyBboxPatch((4.0, 21.5), 26.5, 21.0, boxstyle="round,pad=0.2,rounding_size=0.6",
                          linewidth=0.8, edgecolor='#c4b5fd', facecolor='#f5f3ff')
    ax.add_patch(c1_3)
    ax.text(5.5, 39.5, "3. Live Microservice DB & PII Shield", fontsize=8.2, fontweight='bold', color='#4c1d95')
    ax.text(5.5, 35.5, "13 MICROSERVICES & PII FIREWALL", fontsize=6.8, fontweight='bold', color='#7c3aed')
    ax.text(5.5, 30.5, "• Real Waybill DB (Scan Milestones, GPS Chain of Custody)", fontsize=6.6, color='#334155')
    ax.text(5.5, 26.5, "• PII Masking (Phone: 0912***678, Addr: ***, Dist 1, HCMC)", fontsize=6.6, color='#334155')
    ax.text(5.5, 23.0, "• Role-Based Access: GUEST, SHOP, CARRIER, QA AUDITOR", fontsize=6.6, color='#334155')

    # Pillar 1 Summary Pill
    c1_foot = FancyBboxPatch((4.0, 4.5), 26.5, 15.0, boxstyle="round,pad=0.2,rounding_size=0.6",
                             linewidth=0.8, edgecolor='#bfdbfe', facecolor='#eff6ff')
    ax.add_patch(c1_foot)
    ax.text(5.5, 16.0, "Dual-Anchor Grounding Principle:", fontsize=7.6, fontweight='bold', color='#1d4ed8')
    ax.text(5.5, 11.5, "Zero Hallucinations: Static policies anchor to 9 SOPs,", fontsize=6.6, color='#1e40af')
    ax.text(5.5, 7.0, "dynamic operational lookups anchor to live Microservices.", fontsize=6.6, color='#1e40af')

    # =========================================================================
    # CONNECTOR 1 -> 2
    # =========================================================================
    ax.annotate('', xy=(34.8, 50.0), xytext=(32.2, 50.0),
                arrowprops=dict(arrowstyle="->", color="#2563eb", lw=2.2))

    # =========================================================================
    # COLUMN 2: BENCHMARK DATASET (CENTER: x: 35.5 to 66.5)
    # =========================================================================
    col2_bg = FancyBboxPatch((35.5, 2.5), 30.5, 95.0, boxstyle="round,pad=0.2,rounding_size=1.0",
                             linewidth=1.0, edgecolor='#94a3b8', facecolor='#ffffff')
    ax.add_patch(col2_bg)

    col2_hdr = FancyBboxPatch((35.5, 89.5), 30.5, 8.0, boxstyle="round,pad=0.1,rounding_size=0.8",
                              linewidth=0, facecolor='#2563eb')
    ax.add_patch(col2_hdr)
    ax.text(50.75, 93.5, "II. DUAL-SOURCE BENCHMARK (N = 100)", fontsize=8.8, fontweight='bold',
            color='#ffffff', ha='center', va='center')

    # Dual-source proportion banner
    c2_ratio = FancyBboxPatch((37.0, 77.0), 27.5, 10.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                              linewidth=0.8, edgecolor='#93c5fd', facecolor='#eff6ff')
    ax.add_patch(c2_ratio)
    r1 = FancyBboxPatch((38.0, 78.5), 12.2, 7.5, boxstyle="round,pad=0.1,rounding_size=0.4",
                        linewidth=0, facecolor='#1d4ed8')
    ax.add_patch(r1)
    ax.text(44.1, 82.2, "REAL-WORLD: 50%", fontsize=6.8, fontweight='bold', color='#ffffff', ha='center', va='center')

    r2 = FancyBboxPatch((51.2, 78.5), 12.2, 7.5, boxstyle="round,pad=0.1,rounding_size=0.4",
                        linewidth=0, facecolor='#dc2626')
    ax.add_patch(r2)
    ax.text(57.3, 82.2, "SYNTHETIC: 50%", fontsize=6.8, fontweight='bold', color='#ffffff', ha='center', va='center')

    # Provenance 1: Real World
    c2_1 = FancyBboxPatch((37.0, 52.5), 27.5, 22.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                          linewidth=0.8, edgecolor='#e2e8f0', facecolor='#f8fafc')
    ax.add_patch(c2_1)
    ax.text(38.5, 71.5, "50 Real-World Logistics Cases (Scraped)", fontsize=8.0, fontweight='bold', color='#0f172a')
    ax.text(38.5, 66.5, "• GHTK (15 cases): Cosmetics packaging, scam protection", fontsize=6.6, color='#334155')
    ax.text(38.5, 62.5, "• GHN (15 cases): Partial delivery/return, security seal >10M", fontsize=6.6, color='#334155')
    ax.text(38.5, 58.5, "• Viettel Post (10 cases): Lithium battery aviation ban", fontsize=6.6, color='#334155')
    ax.text(38.5, 54.5, "• VNPost (10 cases): Mail confidentiality, force majeure", fontsize=6.6, color='#334155')

    # Provenance 2: Synthetic Stress
    c2_2 = FancyBboxPatch((37.0, 27.5), 27.5, 23.0, boxstyle="round,pad=0.2,rounding_size=0.6",
                          linewidth=0.8, edgecolor='#e2e8f0', facecolor='#f8fafc')
    ax.add_patch(c2_2)
    ax.text(38.5, 47.0, "50 Synthetic Stress & OWASP Red-Teaming", fontsize=8.0, fontweight='bold', color='#0f172a')
    ax.text(38.5, 42.0, "• 28 Adversarial / Jailbreak: OWASP LLM Top 10 Red-Teaming", fontsize=6.6, color='#334155')
    ax.text(38.5, 38.0, "• 10 Out-of-Domain: Boundary guard deflections (1 Dev, 9 Test)", fontsize=6.6, color='#334155')
    ax.text(38.5, 34.0, "• 7 Physical Ceilings: Over-limit (70kg/150cm/300cm, 2 Dev, 5 Test)", fontsize=6.6, color='#334155')
    ax.text(38.5, 30.0, "• 5 IATA Volumetric & PII Edge Cases (2 Dev, 3 Test)", fontsize=6.6, color='#334155')

    # 4 Category Pills Grid
    c2_cat = FancyBboxPatch((37.0, 4.5), 27.5, 21.0, boxstyle="round,pad=0.2,rounding_size=0.6",
                            linewidth=0.8, edgecolor='#cbd5e1', facecolor='#f1f5f9')
    ax.add_patch(c2_cat)
    ax.text(38.5, 22.0, "4 Standardized Functional Categories:", fontsize=7.5, fontweight='bold', color='#1e293b')

    p1 = FancyBboxPatch((38.0, 12.5), 12.5, 6.5, boxstyle="round,pad=0.1,rounding_size=0.3",
                        linewidth=0.6, edgecolor='#93c5fd', facecolor='#ffffff')
    ax.add_patch(p1)
    ax.text(44.25, 15.7, "SOP_KNOWLEDGE (39)", fontsize=5.8, fontweight='bold', color='#1d4ed8', ha='center', va='center')

    p2 = FancyBboxPatch((51.0, 12.5), 12.5, 6.5, boxstyle="round,pad=0.1,rounding_size=0.3",
                        linewidth=0.6, edgecolor='#6ee7b7', facecolor='#ffffff')
    ax.add_patch(p2)
    ax.text(57.25, 15.7, "OPERATIONAL_TOOLS (23)", fontsize=5.8, fontweight='bold', color='#047857', ha='center', va='center')

    p3 = FancyBboxPatch((38.0, 5.2), 12.5, 6.5, boxstyle="round,pad=0.1,rounding_size=0.3",
                        linewidth=0.6, edgecolor='#fca5a5', facecolor='#ffffff')
    ax.add_patch(p3)
    ax.text(44.25, 8.4, "ADVERSARIAL_SAFETY (28)", fontsize=5.8, fontweight='bold', color='#b91c1c', ha='center', va='center')

    p4 = FancyBboxPatch((51.0, 5.2), 12.5, 6.5, boxstyle="round,pad=0.1,rounding_size=0.3",
                        linewidth=0.6, edgecolor='#cbd5e1', facecolor='#ffffff')
    ax.add_patch(p4)
    ax.text(57.25, 8.4, "OUT_OF_DOMAIN (10)", fontsize=5.8, fontweight='bold', color='#374151', ha='center', va='center')

    # =========================================================================
    # CONNECTOR 2 -> 3
    # =========================================================================
    ax.annotate('', xy=(68.8, 50.0), xytext=(66.2, 50.0),
                arrowprops=dict(arrowstyle="->", color="#2563eb", lw=2.2))

    # =========================================================================
    # COLUMN 3: AUTOMATED EVALUATION & 5-TIER RUBRIC (RIGHT: x: 69.5 to 97.5)
    # =========================================================================
    col3_bg = FancyBboxPatch((69.5, 2.5), 28.0, 95.0, boxstyle="round,pad=0.2,rounding_size=1.0",
                             linewidth=1.0, edgecolor='#94a3b8', facecolor='#ffffff')
    ax.add_patch(col3_bg)

    col3_hdr = FancyBboxPatch((69.5, 89.5), 28.0, 8.0, boxstyle="round,pad=0.1,rounding_size=0.8",
                              linewidth=0, facecolor='#047857')
    ax.add_patch(col3_hdr)
    ax.text(83.5, 93.5, "III. EVALUATION & 5-TIER RUBRIC", fontsize=8.8, fontweight='bold',
            color='#ffffff', ha='center', va='center')

    # Formula Box
    c3_eq = FancyBboxPatch((71.0, 68.5), 25.0, 19.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                           linewidth=0.8, edgecolor='#cbd5e1', facecolor='#f8fafc')
    ax.add_patch(c3_eq)
    ax.text(72.5, 84.5, "Mathematical Scoring Formulation (S_i)", fontsize=8.0, fontweight='bold', color='#0f172a')
    
    eq_badge = FancyBboxPatch((72.0, 77.0), 23.0, 5.8, boxstyle="round,pad=0.1,rounding_size=0.3",
                              linewidth=0.6, edgecolor='#bfdbfe', facecolor='#eff6ff')
    ax.add_patch(eq_badge)
    ax.text(83.5, 79.9, "S_i = [(1-I_tool)(0.7 R_kw + 0.3 C_cit) + I_tool(0.5 A_tool + 0.3 R_kw + 0.2 C_cit)] * 100", fontsize=4.9, fontweight='bold',
            color='#1d4ed8', ha='center', va='center')

    ax.text(72.5, 73.5, "• A_tool: Function schema & argument execution precision", fontsize=6.3, color='#334155')
    ax.text(72.5, 70.0, "• R_kw: Statutory keyword recall | C_cit: Verifiable SOP citation", fontsize=6.3, color='#334155')

    # 5-Tier Rubric Visual Stack
    c3_tiers = FancyBboxPatch((71.0, 24.5), 25.0, 42.0, boxstyle="round,pad=0.2,rounding_size=0.6",
                             linewidth=0.8, edgecolor='#cbd5e1', facecolor='#f8fafc')
    ax.add_patch(c3_tiers)
    ax.text(72.5, 63.5, "Standardized 5-Tier Likert Rubric (n = 52):", fontsize=8.0, fontweight='bold', color='#0f172a')

    # Level rows
    tiers = [
        ("L5 [EXCELLENT]: 50.0%", "≥90 pts | 26/52 Grounded in SOP & Tools", "#eff6ff", "#bfdbfe", "#1d4ed8"),
        ("L4 [GOOD]: 34.6%", "75-89 pts | 18/52 Correct Action & Safe", "#ecfdf5", "#a7f3d0", "#047857"),
        ("L3 [ACCEPTABLE]: 3.8%", "60-74 pts | 2/52 Meets Baseline Criteria", "#fefce8", "#fde047", "#b45309"),
        ("L2 [MARGINAL]: 3.8%", "40-59 pts | 2/52 Out-of-Domain Deflections", "#fff7ed", "#fed7aa", "#c2410c"),
        ("L1 [CRITICAL]: 7.7%", "<40 pts | 4/52 Missing Secondary Params", "#fef2f2", "#fecaca", "#dc2626")
    ]
    y_tier = 55.5
    for title, desc, f_col, e_col, t_col in tiers:
        tb = FancyBboxPatch((72.0, y_tier), 23.0, 6.2, boxstyle="round,pad=0.1,rounding_size=0.3",
                            linewidth=0.5, edgecolor=e_col, facecolor=f_col)
        ax.add_patch(tb)
        ax.text(73.2, y_tier + 3.1, title, fontsize=6.3, fontweight='bold', color=t_col, va='center')
        ax.text(94.0, y_tier + 3.1, desc, fontsize=5.5, color='#475569', ha='right', va='center')
        y_tier -= 7.4

    # KPI Summary Card
    c3_kpi = FancyBboxPatch((71.0, 4.5), 25.0, 18.5, boxstyle="round,pad=0.2,rounding_size=0.6",
                            linewidth=0.8, edgecolor='#a7f3d0', facecolor='#ecfdf5')
    ax.add_patch(c3_kpi)
    ax.text(72.5, 19.5, "Held-Out Test Findings (n_test = 70, n_func = 52):", fontsize=7.4, fontweight='bold', color='#065f46')
    ax.text(72.5, 15.0, "• Operational Pass Rate: 84.6% (44/52, Likert Mean: 4.05 / 5.00)", fontsize=6.3, fontweight='bold', color='#047857')
    ax.text(72.5, 11.0, "• Functional Quality: 83.1 ± 17.1 / 100 (Cohen's d = 0.50)", fontsize=6.3, color='#047857')
    ax.text(72.5, 7.0, "• Wilcoxon W = 112.0 (z = -4.783, p = 1.73e-6, n_eff = 47)", fontsize=6.3, color='#047857')

    plt.tight_layout(pad=0.2)
    plt.savefig(png_out, dpi=300, bbox_inches='tight', facecolor='#ffffff')
    plt.savefig(svg_out, format='svg', bbox_inches='tight', facecolor='#ffffff')
    plt.close()
    print(f"[SUCCESS] Generated academic provenance framework:\n  -> PNG: {png_out}\n  -> SVG: {svg_out}")

if __name__ == '__main__':
    generate_academic_data_provenance_diagram()
