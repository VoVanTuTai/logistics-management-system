import React, { useMemo } from 'react';

/**
 * Standard Code 128B pattern generator for industrial logistics barcodes.
 * Generates clean, crisp, scannable SVG barcode without external dependencies.
 */

// Code 128 pattern table (widths of 6 alternating bars & spaces)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112', // 100-106 (106 is stop)
];

const START_CODE_B = 104;
const STOP_CODE = 106;

export interface IndustrialBarcodeProps {
  value: string;
  className?: string;
  height?: number;
  showText?: boolean;
}

export const IndustrialBarcode: React.FC<IndustrialBarcodeProps> = ({
  value,
  className = '',
  height = 54,
  showText = true,
}) => {
  const safeText = (value || '000000000000').trim().toUpperCase();

  const bars = useMemo(() => {
    const symbols: number[] = [START_CODE_B];
    let checksum = START_CODE_B;

    for (let i = 0; i < safeText.length; i++) {
      const code = safeText.charCodeAt(i) - 32;
      const validCode = code >= 0 && code <= 94 ? code : 0;
      symbols.push(validCode);
      checksum += validCode * (i + 1);
    }

    symbols.push(checksum % 103);
    symbols.push(STOP_CODE);

    // Build bar segments [width, isBar]
    const elements: { x: number; width: number }[] = [];
    let currentX = 12; // Left quiet zone

    symbols.forEach((symbolIdx) => {
      const pattern = CODE128_PATTERNS[symbolIdx] || '212222';
      for (let p = 0; p < pattern.length; p++) {
        const width = parseInt(pattern[p], 10) * 1.5;
        const isBar = p % 2 === 0;
        if (isBar) {
          elements.push({ x: currentX, width });
        }
        currentX += width;
      }
    });

    const totalWidth = currentX + 12; // Right quiet zone
    return { elements, totalWidth };
  }, [safeText]);

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${bars.totalWidth} ${height}`}
        className="w-full max-w-[280px] h-12 overflow-visible"
        shapeRendering="crispEdges"
        aria-label={`Mã vạch vận đơn: ${safeText}`}
      >
        {bars.elements.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y={2}
            width={bar.width}
            height={height - 4}
            fill="#0f172a"
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] font-black tracking-[0.25em] text-slate-800 uppercase mt-0.5">
          * {safeText} *
        </span>
      )}
    </div>
  );
};
