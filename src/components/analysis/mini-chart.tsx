"use client";

import type { ChartData, ChartPoint } from "@/types/database";

// ── Layout constants ───────────────────────────────────────────────────────────
const W = 480;
const H = 260;
const M = { top: 28, right: 20, bottom: 58, left: 58 };
const CW = W - M.left - M.right; // chart width  = 402
const CH = H - M.top - M.bottom; // chart height = 174

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444",
  "#06B6D4", "#EC4899", "#84CC16",
];

// ── Scale helpers ──────────────────────────────────────────────────────────────
function linScale(domain: [number, number], range: [number, number]) {
  return (v: number) => {
    const t = (domain[1] === domain[0]) ? 0 : (v - domain[0]) / (domain[1] - domain[0]);
    return range[0] + t * (range[1] - range[0]);
  };
}

function niceTicks(min: number, max: number, count = 5): number[] {
  const range = max - min || 1;
  const step = Math.pow(10, Math.floor(Math.log10(range / count)));
  const niceStep = [1, 2, 2.5, 5, 10].find((s) => (range / (step * s)) <= count)! * step;
  const start = Math.floor(min / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let t = start; t <= max + niceStep * 0.01; t += niceStep) {
    ticks.push(+t.toFixed(10));
  }
  return ticks.filter((t) => t >= min * 0.99 && t <= max * 1.01);
}

function fmt(n: number): string {
  if (Math.abs(n) >= 10000) return (n / 1000).toFixed(0) + "k";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "k";
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(n < 1 ? 3 : 1);
}

// ── Shared SVG elements ────────────────────────────────────────────────────────
function Axes({
  xLabel,
  yLabel,
  yTicks,
  xCategories,
  yScale,
}: {
  xLabel?: string;
  yLabel?: string;
  yTicks: number[];
  xCategories?: string[];
  yScale: (v: number) => number;
}) {
  return (
    <>
      {/* Y gridlines + ticks */}
      {yTicks.map((t) => {
        const y = yScale(t);
        return (
          <g key={t}>
            <line x1={0} y1={y} x2={CW} y2={y} stroke="#E2E8F0" strokeWidth={1} />
            <text x={-6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94A3B8">
              {fmt(t)}
            </text>
          </g>
        );
      })}
      {/* X category labels */}
      {xCategories?.map((label, i) => {
        const barSlot = CW / xCategories.length;
        const x = barSlot * i + barSlot / 2;
        return (
          <text key={i} x={x} y={CH + 12} textAnchor="middle" fontSize={9} fill="#64748B">
            {label.length > 12 ? label.slice(0, 11) + "…" : label}
          </text>
        );
      })}
      {/* Axes lines */}
      <line x1={0} y1={0} x2={0} y2={CH} stroke="#CBD5E1" strokeWidth={1} />
      <line x1={0} y1={CH} x2={CW} y2={CH} stroke="#CBD5E1" strokeWidth={1} />
      {/* Axis labels */}
      {xLabel && (
        <text x={CW / 2} y={CH + 34} textAnchor="middle" fontSize={10} fill="#475569" fontWeight="500">
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text
          x={-CH / 2}
          y={-38}
          textAnchor="middle"
          fontSize={10}
          fill="#475569"
          fontWeight="500"
          transform="rotate(-90)"
        >
          {yLabel}
        </text>
      )}
    </>
  );
}

// ── Bar chart with optional error bars ────────────────────────────────────────
function BarChart({ data, xLabel, yLabel }: { data: ChartPoint[]; xLabel?: string; yLabel?: string }) {
  if (!data.length) return null;

  const maxY = Math.max(...data.map((d) => d.y + (d.error ?? 0))) * 1.15 || 1;
  const yScale = linScale([0, maxY], [CH, 0]);
  const ticks = niceTicks(0, maxY);
  const barW = Math.min((CW / data.length) * 0.6, 72);
  const slotW = CW / data.length;

  const groups = [...new Set(data.map((d) => d.group))].filter(Boolean) as string[];
  const multiGroup = groups.length > 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <g transform={`translate(${M.left},${M.top})`}>
        <Axes
          xLabel={xLabel}
          yLabel={yLabel}
          yTicks={ticks}
          xCategories={data.map((d) => String(d.x))}
          yScale={yScale}
        />
        {data.map((d, i) => {
          const cx = slotW * i + slotW / 2;
          const barX = cx - barW / 2;
          const barY = yScale(d.y);
          const barH = CH - barY;
          const color = multiGroup
            ? COLORS[groups.indexOf(d.group ?? "") % COLORS.length]
            : COLORS[i % COLORS.length];

          return (
            <g key={i}>
              <rect x={barX} y={barY} width={barW} height={Math.max(barH, 1)} fill={color} rx={3} opacity={0.85} />
              {d.error !== undefined && d.error > 0 && (
                <g stroke={color} strokeWidth={1.5}>
                  <line x1={cx} y1={yScale(d.y + d.error)} x2={cx} y2={yScale(Math.max(d.y - d.error, 0))} />
                  <line x1={cx - 5} y1={yScale(d.y + d.error)} x2={cx + 5} y2={yScale(d.y + d.error)} />
                  <line x1={cx - 5} y1={yScale(Math.max(d.y - d.error, 0))} x2={cx + 5} y2={yScale(Math.max(d.y - d.error, 0))} />
                </g>
              )}
              {d.n && (
                <text x={cx} y={barY - 4} textAnchor="middle" fontSize={8} fill="#64748B">
                  n={d.n}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ── Box plot ──────────────────────────────────────────────────────────────────
function BoxPlot({ data, xLabel, yLabel }: { data: ChartPoint[]; xLabel?: string; yLabel?: string }) {
  if (!data.length) return null;

  const allVals = data.flatMap((d) =>
    [d.y, d.q1, d.q3, d.min, d.max, ...(d.outliers ?? [])].filter((v): v is number => v !== undefined)
  );
  const minY = Math.min(...allVals);
  const maxY = Math.max(...allVals);
  const pad = (maxY - minY) * 0.1 || 1;
  const yScale = linScale([minY - pad, maxY + pad], [CH, 0]);
  const ticks = niceTicks(minY - pad, maxY + pad);
  const slotW = CW / data.length;
  const boxW = Math.min(slotW * 0.5, 60);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <g transform={`translate(${M.left},${M.top})`}>
        <Axes
          xLabel={xLabel}
          yLabel={yLabel}
          yTicks={ticks}
          xCategories={data.map((d) => String(d.x))}
          yScale={yScale}
        />
        {data.map((d, i) => {
          const cx = slotW * i + slotW / 2;
          const color = COLORS[i % COLORS.length];
          const q1Y = d.q1 !== undefined ? yScale(d.q1) : yScale(d.y);
          const q3Y = d.q3 !== undefined ? yScale(d.q3) : yScale(d.y);
          const medY = yScale(d.y);
          const minY2 = d.min !== undefined ? yScale(d.min) : q1Y;
          const maxY2 = d.max !== undefined ? yScale(d.max) : q3Y;

          return (
            <g key={i}>
              {/* Whiskers */}
              <line x1={cx} y1={maxY2} x2={cx} y2={q3Y} stroke={color} strokeWidth={1.5} strokeDasharray="3,2" />
              <line x1={cx} y1={q1Y} x2={cx} y2={minY2} stroke={color} strokeWidth={1.5} strokeDasharray="3,2" />
              <line x1={cx - 8} y1={maxY2} x2={cx + 8} y2={maxY2} stroke={color} strokeWidth={1.5} />
              <line x1={cx - 8} y1={minY2} x2={cx + 8} y2={minY2} stroke={color} strokeWidth={1.5} />
              {/* Box */}
              <rect
                x={cx - boxW / 2}
                y={q3Y}
                width={boxW}
                height={Math.max(q1Y - q3Y, 1)}
                fill={color}
                fillOpacity={0.15}
                stroke={color}
                strokeWidth={1.5}
                rx={2}
              />
              {/* Median */}
              <line x1={cx - boxW / 2} y1={medY} x2={cx + boxW / 2} y2={medY} stroke={color} strokeWidth={2.5} />
              {/* Outliers */}
              {d.outliers?.map((o, oi) => (
                <circle key={oi} cx={cx} cy={yScale(o)} r={3} fill="none" stroke={color} strokeWidth={1.5} />
              ))}
              {/* N label */}
              {d.n && (
                <text x={cx} y={CH + 24} textAnchor="middle" fontSize={8} fill="#94A3B8">
                  n={d.n}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ── Scatter plot ──────────────────────────────────────────────────────────────
function ScatterPlot({ data, xLabel, yLabel }: { data: ChartPoint[]; xLabel?: string; yLabel?: string }) {
  if (!data.length) return null;

  const xVals = data.map((d) => Number(d.x));
  const yVals = data.map((d) => d.y);
  const xPad = (Math.max(...xVals) - Math.min(...xVals)) * 0.08 || 1;
  const yPad = (Math.max(...yVals) - Math.min(...yVals)) * 0.08 || 1;

  const xScale = linScale([Math.min(...xVals) - xPad, Math.max(...xVals) + xPad], [0, CW]);
  const yScale = linScale([Math.min(...yVals) - yPad, Math.max(...yVals) + yPad], [CH, 0]);
  const yTicks = niceTicks(Math.min(...yVals) - yPad, Math.max(...yVals) + yPad);
  const xTicks = niceTicks(Math.min(...xVals) - xPad, Math.max(...xVals) + xPad);

  const groups = [...new Set(data.map((d) => d.group))].filter(Boolean) as string[];
  const multiGroup = groups.length > 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <g transform={`translate(${M.left},${M.top})`}>
        <Axes xLabel={xLabel} yLabel={yLabel} yTicks={yTicks} yScale={yScale} />
        {/* X ticks */}
        {xTicks.map((t) => (
          <text key={t} x={xScale(t)} y={CH + 12} textAnchor="middle" fontSize={9} fill="#94A3B8">
            {fmt(t)}
          </text>
        ))}
        {/* Points */}
        {data.map((d, i) => {
          const color = multiGroup
            ? COLORS[groups.indexOf(d.group ?? "") % COLORS.length]
            : "#3B82F6";
          return (
            <circle
              key={i}
              cx={xScale(Number(d.x))}
              cy={yScale(d.y)}
              r={4}
              fill={color}
              fillOpacity={0.65}
              stroke={color}
              strokeWidth={1}
            />
          );
        })}
        {/* Legend */}
        {multiGroup && groups.slice(0, 5).map((g, i) => (
          <g key={g} transform={`translate(${CW - 100},${i * 14})`}>
            <circle cx={5} cy={5} r={4} fill={COLORS[i % COLORS.length]} fillOpacity={0.7} />
            <text x={13} y={9} fontSize={9} fill="#475569">
              {g.length > 12 ? g.slice(0, 11) + "…" : g}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ── Histogram / Frequency bar chart ──────────────────────────────────────────
function FrequencyChart({ data, xLabel, yLabel }: { data: ChartPoint[]; xLabel?: string; yLabel?: string }) {
  if (!data.length) return null;

  const maxY = Math.max(...data.map((d) => d.y)) * 1.15 || 1;
  const yScale = linScale([0, maxY], [CH, 0]);
  const ticks = niceTicks(0, maxY);
  const slotW = CW / data.length;
  const barW = Math.min(slotW * 0.8, 80);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <g transform={`translate(${M.left},${M.top})`}>
        <Axes
          xLabel={xLabel}
          yLabel={yLabel ?? "Frequenza"}
          yTicks={ticks}
          xCategories={data.map((d) => String(d.x))}
          yScale={yScale}
        />
        {data.map((d, i) => {
          const cx = slotW * i + slotW / 2;
          const barX = cx - barW / 2;
          const barY = yScale(d.y);
          return (
            <g key={i}>
              <rect
                x={barX}
                y={barY}
                width={barW}
                height={Math.max(CH - barY, 1)}
                fill={COLORS[0]}
                fillOpacity={0.8}
                rx={2}
              />
              <text x={cx} y={barY - 4} textAnchor="middle" fontSize={8} fill="#64748B">
                {fmt(d.y)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export function MiniChart({ chart }: { chart: ChartData }) {
  if (!chart.data?.length) return null;

  const title = (
    <p className="text-xs font-medium text-slate-600 text-center mb-1">{chart.title}</p>
  );

  const props = { data: chart.data, xLabel: chart.xLabel, yLabel: chart.yLabel };

  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
      {title}
      {chart.type === "bar" && <BarChart {...props} />}
      {chart.type === "boxplot" && <BoxPlot {...props} />}
      {chart.type === "scatter" && <ScatterPlot {...props} />}
      {(chart.type === "histogram" || chart.type === "frequency") && <FrequencyChart {...props} />}
    </div>
  );
}
