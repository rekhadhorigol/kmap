import React from "react";
import { Card } from "../components/ui/card";

function getGrayCode(num, bits) {
  return num ^ (num >> 1);
}

function getKMapLayout(numVars) {
  if (numVars === 2) {
    return {
      rows: 2,
      cols: 2,
      rowBits: 1,
      colBits: 1,
    };
  } else if (numVars === 3) {
    return {
      rows: 2,
      cols: 4,
      rowBits: 1,
      colBits: 2,
    };
  } else {
    return {
      rows: 4,
      cols: 4,
      rowBits: 2,
      colBits: 2,
    };
  }
}

function getCellValue(row, col, numVars) {
  const layout = getKMapLayout(numVars);
  const rowGray = getGrayCode(row, layout.rowBits);
  const colGray = getGrayCode(col, layout.colBits);
  
  if (numVars === 2) {
    return (rowGray << 1) | colGray;
  } else if (numVars === 3) {
    return (rowGray << 2) | colGray;
  } else {
    return (rowGray << 2) | colGray;
  }
}

function getRowLabel(row, numVars, varNames) {
  const gray = getGrayCode(row, numVars === 2 ? 1 : 2);
  if (numVars === 2) {
    return gray.toString();
  } else if (numVars === 3) {
    return gray.toString();
  } else {
    return gray.toString(2).padStart(2, '0');
  }
}

function getColLabel(col, numVars, varNames) {
  const bits = numVars === 2 ? 1 : 2;
  const gray = getGrayCode(col, bits);
  return gray.toString(2).padStart(bits, '0');
}

export default function KMapVisualization({
  numVars,
  varNames,
  minterms,
  dontCares,
  groups,
}) {
  const layout = getKMapLayout(numVars);
  const cellSize = numVars === 2 ? 80 : numVars === 3 ? 70 : 60;
  
  const getCellColor = (cellValue) => {
    for (const group of groups) {
      if (group.cells.includes(cellValue)) {
        return group.color;
      }
    }
    return "transparent";
  };

  const getCellContent = (cellValue) => {
    if (minterms.includes(cellValue)) return "1";
    if (dontCares.includes(cellValue)) return "X";
    return "0";
  };

  return (
    <Card className="bg-white rounded-xl shadow-lg p-6 sm:p-8 card-hover">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Karnaugh Map Visualization
      </h2>

      {/* Legend */}
      <div className="mb-6 flex flex-wrap gap-4">
        {groups.map((group, idx) => (
          <div key={idx} className="flex items-center gap-2" data-testid={`group-legend-${idx}`}>
            <div
              className="w-6 h-6 rounded border-2 border-slate-300"
              style={{ backgroundColor: group.color }}
            />
            <span className="text-sm font-medium text-slate-700">
              Group {idx + 1}: Cells {group.cells.join(", ")}
            </span>
          </div>
        ))}
      </div>

      {/* K-Map Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Column Headers */}
          <div className="flex mb-2">
            <div style={{ width: cellSize }} className="flex items-center justify-center font-semibold text-slate-700">
              {numVars === 2 ? varNames[1] : numVars === 3 ? `${varNames[1]}${varNames[2]}` : `${varNames[2]}${varNames[3]}`}
            </div>
            {Array.from({ length: layout.cols }).map((_, col) => (
              <div
                key={col}
                style={{ width: cellSize }}
                className="flex items-center justify-center font-semibold text-slate-700"
              >
                {getColLabel(col, numVars, varNames)}
              </div>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: layout.rows }).map((_, row) => (
            <div key={row} className="flex mb-2">
              {/* Row Header */}
              <div
                style={{ width: cellSize }}
                className="flex items-center justify-center font-semibold text-slate-700"
              >
                {getRowLabel(row, numVars, varNames)}
              </div>

              {/* Cells */}
              {Array.from({ length: layout.cols }).map((_, col) => {
                const cellValue = getCellValue(row, col, numVars);
                const cellColor = getCellColor(cellValue);
                const content = getCellContent(cellValue);

                return (
                  <div
                    key={col}
                    className="kmap-cell flex items-center justify-center border-2 border-slate-300 font-bold text-lg rounded-lg"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: cellColor,
                      borderColor: cellColor !== "transparent" ? cellColor : "#cbd5e1",
                    }}
                    data-testid={`kmap-cell-${cellValue}`}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Row Label */}
          <div className="mt-3 text-center font-semibold text-slate-700">
            {numVars === 2 ? varNames[0] : numVars === 3 ? varNames[0] : `${varNames[0]}${varNames[1]}`}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <p className="text-sm text-slate-700">
          <strong>Note:</strong> K-Map uses Gray code ordering. Adjacent cells differ by exactly one variable.
          Grouped cells represent prime implicants in the minimized expression.
        </p>
      </div>
    </Card>
  );
}
