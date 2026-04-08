import React from "react";
import { Card } from "../components/ui/card";

function getGrayCode(num) {
  return num ^ (num >> 1);
}

function getKMapLayout(numVars) {
  // Split variables: first half -> rows, second half -> columns
  // Standard K-Map convention:
  //   2 vars: 1 row bit, 1 col bit  (2x2)
  //   3 vars: 1 row bit, 2 col bits (2x4)
  //   4 vars: 2 row bits, 2 col bits (4x4)
  //   5 vars: 2 row bits, 3 col bits (4x8)
  //   6 vars: 3 row bits, 3 col bits (8x8)
  //   7 vars: 3 row bits, 4 col bits (8x16)
  //   8 vars: 4 row bits, 4 col bits (16x16)
  const colBits = Math.ceil(numVars / 2);
  const rowBits = numVars - colBits;
  return {
    rows: 1 << rowBits,
    cols: 1 << colBits,
    rowBits,
    colBits,
  };
}

function getCellValue(row, col, numVars) {
  const layout = getKMapLayout(numVars);
  const rowGray = getGrayCode(row);
  const colGray = getGrayCode(col);
  return (rowGray << layout.colBits) | colGray;
}

function getRowLabel(row, numVars) {
  const layout = getKMapLayout(numVars);
  const gray = getGrayCode(row);
  return gray.toString(2).padStart(layout.rowBits, '0');
}

function getColLabel(col, numVars) {
  const layout = getKMapLayout(numVars);
  const gray = getGrayCode(col);
  return gray.toString(2).padStart(layout.colBits, '0');
}

function getRowVarLabel(numVars, varNames) {
  const layout = getKMapLayout(numVars);
  return varNames.slice(0, layout.rowBits).join("");
}

function getColVarLabel(numVars, varNames) {
  const layout = getKMapLayout(numVars);
  return varNames.slice(layout.rowBits, layout.rowBits + layout.colBits).join("");
}

export default function KMapVisualization({
  numVars,
  varNames,
  minterms,
  dontCares,
  groups,
}) {
  // K-Map grid visualization is practical for up to 8 variables (16x16 = 256 cells)
  if (numVars > 8) {
    return (
      <Card className="bg-white rounded-xl shadow-lg p-6 sm:p-8 card-hover">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Karnaugh Map Visualization
        </h2>
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-slate-700 font-medium mb-2">
            K-Map grid visualization is available for 2-8 variables.
          </p>
          <p className="text-sm text-slate-600">
            For {numVars} variables, please refer to the Results tab for prime implicants,
            the minimized expression, and the Logic Diagram.
          </p>
        </div>

        {groups.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Groupings</h3>
            <div className="flex flex-wrap gap-4">
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
          </div>
        )}
      </Card>
    );
  }

  const layout = getKMapLayout(numVars);

  // Adaptive cell size based on grid dimensions
  const cellSize =
    numVars <= 2 ? 80 :
    numVars <= 3 ? 70 :
    numVars <= 4 ? 60 :
    numVars <= 5 ? 52 :
    numVars <= 6 ? 44 :
    numVars <= 7 ? 38 : 34;

  const fontSize =
    numVars <= 4 ? "text-lg" :
    numVars <= 6 ? "text-sm" : "text-xs";

  const headerFontSize =
    numVars <= 5 ? "text-sm" :
    numVars <= 7 ? "text-xs" : "text-[10px]";

  // Use Sets for fast lookup on large grids
  const mintermSet = new Set(minterms);
  const dontCareSet = new Set(dontCares);

  const getCellColor = (cellValue) => {
    for (const group of groups) {
      if (group.cells.includes(cellValue)) {
        return group.color;
      }
    }
    return "transparent";
  };

  const getCellContent = (cellValue) => {
    if (mintermSet.has(cellValue)) return "1";
    if (dontCareSet.has(cellValue)) return "X";
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
          {/* Column variable label + column headers */}
          <div className="flex mb-1">
            {/* Corner: row\col variable names */}
            <div
              style={{ width: cellSize + 10, minWidth: cellSize + 10 }}
              className={`flex items-end justify-end pr-1 pb-1 font-semibold text-slate-500 ${headerFontSize}`}
            >
              <span>
                <span className="text-blue-600">{getRowVarLabel(numVars, varNames)}</span>
                {" \\ "}
                <span className="text-emerald-600">{getColVarLabel(numVars, varNames)}</span>
              </span>
            </div>
            {Array.from({ length: layout.cols }).map((_, col) => (
              <div
                key={col}
                style={{ width: cellSize, minWidth: cellSize }}
                className={`flex items-center justify-center font-semibold text-emerald-700 ${headerFontSize}`}
              >
                {getColLabel(col, numVars)}
              </div>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: layout.rows }).map((_, row) => (
            <div key={row} className="flex">
              {/* Row Header */}
              <div
                style={{ width: cellSize + 10, minWidth: cellSize + 10, height: cellSize }}
                className={`flex items-center justify-end pr-2 font-semibold text-blue-700 ${headerFontSize}`}
              >
                {getRowLabel(row, numVars)}
              </div>

              {/* Cells */}
              {Array.from({ length: layout.cols }).map((_, col) => {
                const cellValue = getCellValue(row, col, numVars);
                const cellColor = getCellColor(cellValue);
                const content = getCellContent(cellValue);

                return (
                  <div
                    key={col}
                    className={`kmap-cell flex items-center justify-center border border-slate-300 font-bold ${fontSize}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      minWidth: cellSize,
                      backgroundColor: cellColor !== "transparent" ? cellColor : (content === "1" ? "#f0fdf4" : content === "X" ? "#fefce8" : "white"),
                      borderColor: cellColor !== "transparent" ? cellColor : "#cbd5e1",
                    }}
                    title={`m${cellValue}`}
                    data-testid={`kmap-cell-${cellValue}`}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <p className="text-sm text-slate-700">
          <strong>Note:</strong> K-Map uses Gray code ordering. Adjacent cells differ by exactly one variable.
          Grouped cells represent prime implicants in the minimized expression.
          {numVars > 4 && " Hover over cells to see minterm numbers."}
        </p>
      </div>
    </Card>
  );
}
