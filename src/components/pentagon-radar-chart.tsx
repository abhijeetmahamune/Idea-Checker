'use client';

import { useCountUp } from '@/lib/use-count-up';

interface PentagonRadarChartProps {
  feasibility: number;
  effectiveness: number;
  scalability: number;
  costEfficiency: number;
  innovation: number;
  overallScore: number;
}

export function PentagonRadarChart({
  feasibility, effectiveness, scalability, costEfficiency, innovation, overallScore,
}: PentagonRadarChartProps) {
  // Geometry constants
  const cx = 150;
  const cy = 135;
  const maxR = 80;
  const labelR = maxR + 24;

  const dims = [
    { shortLabel: 'Feasibility',  score: feasibility },
    { shortLabel: 'Effectiveness', score: effectiveness },
    { shortLabel: 'Scalability',   score: scalability },
    { shortLabel: 'Cost Eff.',     score: costEfficiency },
    { shortLabel: 'Innovation',    score: innovation },
  ];

  const n = 5;
  const step = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const pt = (i: number, r: number) => ({
    x: cx + r * Math.cos(startAngle + i * step),
    y: cy + r * Math.sin(startAngle + i * step),
  });

  const ringPts = (fraction: number) =>
    Array.from({ length: n }, (_, i) => {
      const p = pt(i, fraction * maxR);
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    }).join(' ');

  const dataPts = dims
    .map((d, i) => {
      const p = pt(i, (d.score / 10) * maxR);
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(' ');

  const color = overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#f43f5e';
  const colorFill = overallScore >= 80 ? '#10b98122' : overallScore >= 60 ? '#f59e0b22' : '#f43f5e22';
  const centerLabel = overallScore >= 80 ? 'Promising' : overallScore >= 60 ? 'Viable' : 'At Risk';

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const labelAxis = 1;

  // ── Animated center score ────────────────────────────────────────────────────
  // Safe here because this is a 'use client' component
  const animatedScore = useCountUp(overallScore, 1400);

  return (
    <svg
      viewBox="0 0 300 280"
      className="w-full h-full"
      style={{ overflow: 'visible' }}
      aria-label="Pentagon radar chart showing 5 evaluation dimensions"
    >
      {/* Grid rings */}
      {gridLevels.map((f, i) => (
        <polygon
          key={i}
          points={ringPts(f)}
          fill="none"
          stroke="currentColor"
          strokeOpacity={f === 1.0 ? 0.30 : 0.13}
          strokeWidth={f === 1.0 ? 1.5 : 0.75}
          className="text-muted-foreground"
        />
      ))}

      {/* Grid level numbers */}
      {gridLevels.map((f, i) => {
        const p = pt(labelAxis, f * maxR);
        return (
          <text
            key={i}
            x={(p.x + 3).toFixed(1)}
            y={(p.y + 1).toFixed(1)}
            fontSize="6"
            fill="currentColor"
            className="text-muted-foreground"
            opacity={0.5}
          >
            {Math.round(f * 10)}
          </text>
        );
      })}

      {/* Axis spokes */}
      {dims.map((_, i) => {
        const outer = pt(i, maxR);
        return (
          <line
            key={i}
            x1={cx.toFixed(2)} y1={cy.toFixed(2)}
            x2={outer.x.toFixed(2)} y2={outer.y.toFixed(2)}
            stroke="currentColor"
            strokeOpacity={0.20}
            strokeWidth={0.75}
            className="text-muted-foreground"
          />
        );
      })}

      {/* Data filled area */}
      <polygon
        points={dataPts}
        fill={colorFill}
        stroke={color}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />

      {/* Data point dots */}
      {dims.map((d, i) => {
        const p = pt(i, (d.score / 10) * maxR);
        return <circle key={i} cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r={3.8} fill={color} />;
      })}

      {/* Center: IC Score — animated count-up (safe because this file is 'use client') */}
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize="22" fontWeight="900" fill={color}>
        {animatedScore}
      </text>
      <text
        x={cx} y={cy + 5} textAnchor="middle" fontSize="6" fontWeight="700"
        letterSpacing="1.2" fill="currentColor" className="text-muted-foreground" opacity={0.7}
      >
        IC SCORE
      </text>
      <text x={cx} y={cy + 17} textAnchor="middle" fontSize="6.5" fontWeight="600" fill={color} opacity={0.85}>
        {centerLabel}
      </text>

      {/* Vertex labels */}
      {dims.map((d, i) => {
        const lp = pt(i, labelR);
        let anchor: 'middle' | 'start' | 'end' = 'middle';
        if (lp.x < cx - 12) anchor = 'end';
        else if (lp.x > cx + 12) anchor = 'start';
        const dy = lp.y < cy ? -2 : 2;

        return (
          <g key={i}>
            <text
              x={lp.x.toFixed(2)} y={(lp.y + dy - 5).toFixed(2)}
              textAnchor={anchor} fontSize="8" fontWeight="700"
              fill="currentColor" className="text-foreground"
            >
              {d.shortLabel}
            </text>
            <text
              x={lp.x.toFixed(2)} y={(lp.y + dy + 6).toFixed(2)}
              textAnchor={anchor} fontSize="7"
              fill="currentColor" className="text-muted-foreground" opacity={0.8}
            >
              {d.score}/10
            </text>
          </g>
        );
      })}
    </svg>
  );
}
