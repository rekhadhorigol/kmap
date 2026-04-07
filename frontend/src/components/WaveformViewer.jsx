import React from "react";
import { Card } from "../components/ui/card";

export default function WaveformViewer({ waveformData, varNames, numVars }) {
  if (!waveformData || !waveformData.signals) {
    return <div>No waveform data available</div>;
  }

  const { signals, time_steps, signal_names } = waveformData;
  const cellWidth = 60;
  const rowHeight = 50;
  const labelWidth = 80;
  const totalWidth = labelWidth + cellWidth * time_steps;
  const totalHeight = rowHeight * signal_names.length + 60;

  return (
    <Card className="bg-white rounded-xl shadow-md p-6 card-hover">
      <h3 className="text-xl font-semibold text-slate-800 mb-4">
        GTKWave-Style Waveform Viewer
      </h3>

      <div className="overflow-x-auto bg-slate-900 rounded-lg p-4">
        <svg width={totalWidth} height={totalHeight} className="mx-auto">
          {/* Title */}
          <text
            x={totalWidth / 2}
            y={25}
            fontSize="16"
            fontWeight="bold"
            textAnchor="middle"
            fill="#10b981"
          >
            Digital Waveform
          </text>

          {/* Time axis labels */}
          {Array.from({ length: time_steps }).map((_, i) => (
            <g key={`time-${i}`}>
              <text
                x={labelWidth + i * cellWidth + cellWidth / 2}
                y={50}
                fontSize="12"
                textAnchor="middle"
                fill="#94a3b8"
              >
                {i}
              </text>
              {/* Vertical grid line */}
              <line
                x1={labelWidth + i * cellWidth}
                y1={60}
                x2={labelWidth + i * cellWidth}
                y2={totalHeight}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            </g>
          ))}

          {/* Waveforms */}
          {signal_names.map((signal, signalIdx) => {
            const yBase = 60 + signalIdx * rowHeight + rowHeight / 2;
            const values = signals[signal];

            return (
              <g key={signal}>
                {/* Signal name label */}
                <text
                  x={10}
                  y={yBase + 5}
                  fontSize="14"
                  fontWeight="bold"
                  fill={signal === 'F' ? '#10b981' : '#60a5fa'}
                >
                  {signal}
                </text>

                {/* Horizontal reference lines */}
                <line
                  x1={labelWidth}
                  y1={yBase - 15}
                  x2={totalWidth}
                  y2={yBase - 15}
                  stroke="#475569"
                  strokeWidth="1"
                  opacity="0.3"
                />
                <line
                  x1={labelWidth}
                  y1={yBase + 15}
                  x2={totalWidth}
                  y2={yBase + 15}
                  stroke="#475569"
                  strokeWidth="1"
                  opacity="0.3"
                />

                {/* Waveform path */}
                {values && values.map((value, i) => {
                  const x = labelWidth + i * cellWidth;
                  const nextX = labelWidth + (i + 1) * cellWidth;
                  const y = value === 1 ? yBase - 15 : yBase + 15;
                  const nextValue = i < values.length - 1 ? values[i + 1] : value;
                  const nextY = nextValue === 1 ? yBase - 15 : yBase + 15;

                  return (
                    <g key={`wave-${signal}-${i}`}>
                      {/* Horizontal line */}
                      <line
                        x1={x}
                        y1={y}
                        x2={nextX}
                        y2={y}
                        stroke={signal === 'F' ? '#10b981' : '#60a5fa'}
                        strokeWidth="2"
                      />
                      {/* Vertical transition */}
                      {i < values.length - 1 && value !== nextValue && (
                        <line
                          x1={nextX}
                          y1={y}
                          x2={nextX}
                          y2={nextY}
                          stroke={signal === 'F' ? '#10b981' : '#60a5fa'}
                          strokeWidth="2"
                        />
                      )}
                      {/* Value label */}
                      <text
                        x={x + cellWidth / 2}
                        y={y - 5}
                        fontSize="10"
                        textAnchor="middle"
                        fill="#e2e8f0"
                      >
                        {value}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-slate-700">
          <strong>Waveform Legend:</strong> Blue signals are inputs ({varNames.slice(0, numVars).join(", ")}),
          Green signal is output (F). Time progresses from left to right.
        </p>
      </div>
    </Card>
  );
}
