import React, { useRef } from "react";
import { Stage, Layer, Line, Circle, Text, Rect } from "react-konva";

const INPUT_X = 40;
const NOT_X = 120;
const AND_X = 260;
const OR_X = 460;

const GATE_H = 40;
const BASE_SPACING = 70;
const LIT_SPACING = 50;

const parseSOP = (sop) => {
  const clean = sop.replace(/\s+/g, "");
  if (!clean) return { terms: [] };
  const terms = clean.split("+").map(t => t.match(/[A-Z]'?/g) || []);
  return { terms };
};

const NotGate = ({ x, y }) => {
  return (
    <>
      {/* Triangle body */}
      <Line 
        points={[x, y, x + 40, y + GATE_H / 2, x, y + GATE_H, x, y]} 
        closed 
        fill="white"
        stroke="black" 
        strokeWidth={2}
        lineJoin="miter"
      />
      {/* Inversion bubble */}
      <Circle 
        x={x + 46} 
        y={y + GATE_H / 2} 
        radius={6} 
        fill="white"
        stroke="black" 
        strokeWidth={2}
      />
    </>
  );
};

const AndGate = ({ x, y }) => {
  const height = GATE_H;
  const rectWidth = 3; 
  const centerY = y + height / 2;
  const radius = height / 2;
  
  // Create perfect D-shape using arc
  const arcPoints = [];
  const numPoints = 20;
  
  // Generate semicircle points from top to bottom
  for (let i = 0; i <= numPoints; i++) {
    const angle = (Math.PI * i) / numPoints - Math.PI / 2; // -90° to +90°
    const px = x + rectWidth + radius + radius * Math.cos(angle);
    const py = centerY + radius * Math.sin(angle);
    arcPoints.push(px, py);
  }
  
  const points = [
    x, y,                    // Top left corner
    x + rectWidth, y,        // Top right corner (start of curve)
    ...arcPoints,            // Semicircle curve
    x + rectWidth, y + height, // Bottom right corner (end of curve)
    x, y + height,           // Bottom left corner
    x, y                     // Back to start
  ];
  
  return (
    <Line
      points={points}
      closed
      fill="white"
      stroke="black"
      strokeWidth={2}
    />
  );
};


const OrGate = ({ x, y }) => {
  const width = 52;
  const height = GATE_H;
  const centerY = y + height / 2;
  
  // Highly refined OR gate with sharp tip and smooth curves
  const points = [
    x, y,                                    // Top back start
    x + 6, y + height * 0.12,               
    x + 9, y + height * 0.25,               
    x + 11, y + height * 0.38,              
    x + 11, centerY,                         // Back deepest point
    x + 11, y + height * 0.62,              
    x + 9, y + height * 0.75,               
    x + 6, y + height * 0.88,               
    x, y + height,                           // Bottom back end
    x + width * 0.3, y + height,            // Bottom curve start
    x + width * 0.5, y + height * 0.92,     
    x + width * 0.65, y + height * 0.82,    
    x + width * 0.78, y + height * 0.68,    
    x + width * 0.9, y + height * 0.55,     
    x + width, centerY,                      // Sharp tip point
    x + width * 0.9, y + height * 0.45,     
    x + width * 0.78, y + height * 0.32,    
    x + width * 0.65, y + height * 0.18,    
    x + width * 0.5, y + height * 0.08,     
    x + width * 0.3, y,                     // Top curve start
    x, y                                     // Close
  ];
  
  return (
    <Line
      points={points}
      closed
      fill="white"
      stroke="black"
      strokeWidth={2}
      tension={0.25}
    />
  );
};




const Legend = () => (
  <div
    style={{
      display: "flex",
      gap: "30px",
      alignItems: "center",
      marginBottom: "14px",
      fontSize: "13px",
      fontWeight: "500",
    }}
  >
    {["NOT", "AND", "OR"].map((g, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Stage width={55} height={30}>
          <Layer scale={{ x: 0.6, y: 0.6 }}>
            {g === "NOT" && <NotGate x={5} y={2} />}
            {g === "AND" && <AndGate x={5} y={2} />}
            {g === "OR" && <OrGate x={5} y={2} />}
          </Layer>
        </Stage>
        <span>{g}</span>
      </div>
    ))}
  </div>
);

export default function LogicDiagram({ sop }) {
  const stageRef = useRef(null);
  if (!sop) return null;

  const clean = sop.replace(/\s+/g, "");
  if (clean === "1") {
    return (
      <div style={{ marginTop: "20px" }}>
        <Legend />
        <Stage ref={stageRef} width={300} height={120}>
          <Layer>
            <Rect width={300} height={120} fill="white" />
            <Text x={100} y={40} text="F = 1" fontSize={22} fontStyle="bold" />
          </Layer>
        </Stage>
      </div>
    );
  }

  const { terms } = parseSOP(sop);
  if (terms.length === 0) return null;

  // Special case: single literal only (non-complement) -> just show F = literal
  if (terms.length === 1 && terms[0].length === 1 && !terms[0][0].endsWith("'")) {
    return (
      <div style={{ marginTop: "20px" }}>
        <Legend />
        <Stage ref={stageRef} width={300} height={120}>
          <Layer>
            <Rect width={300} height={120} fill="white" />
            <Text
              x={80}
              y={40}
              text={`F = ${terms[0][0]}`}
              fontSize={22}
              fontStyle="bold"
            />
          </Layer>
        </Stage>
      </div>
    );
  }

  let currentY = 60;
  const termPositions = terms.map(term => {
    const pos = currentY;
    currentY += Math.max(1, term.length) * LIT_SPACING + BASE_SPACING;
    return pos;
  });

  const hasOR = terms.length > 1;
  const height = currentY + 60;

  const termOutputYs = terms.map((term, i) => {
    const baseY = termPositions[i];
    if (term.length > 1) {
      return term.reduce((sum, _lit, li) => sum + (baseY + li * LIT_SPACING), 0) / term.length;
    } else {
      return baseY;
    }
  });
  const orCenterY = hasOR ? termOutputYs.reduce((a, b) => a + b, 0) / termOutputYs.length : null;

  const FINAL_X = hasOR
    ? OR_X + 40
    : (terms[0].length > 1 ? AND_X + 40 : (clean.includes("'") ? NOT_X + 50 : INPUT_X + 30));

  return (
    <div style={{ marginTop: "20px" }}>
      <Legend />
      <Stage ref={stageRef} width={650} height={height}>
        <Layer>
          <Rect width={650} height={height} fill="white" />

          {terms.map((term, ti) => {
            const baseY = termPositions[ti];
            const isMultiLiteral = term.length > 1;
            const avgLitY = isMultiLiteral
              ? term.reduce((sum, _lit, li) => sum + (baseY + li * LIT_SPACING), 0) / term.length
              : baseY;

            return (
              <React.Fragment key={ti}>
                {term.map((lit, li) => {
                  const inp = lit[0];
                  const neg = lit.endsWith("'");
                  const litY = baseY + li * LIT_SPACING;

                  const destX = isMultiLiteral ? AND_X : hasOR ? OR_X : FINAL_X;
                  const destY = isMultiLiteral ? avgLitY : hasOR ? orCenterY : litY;

                  return (
                    <React.Fragment key={`${ti}_${li}`}>
                      <Text x={INPUT_X} y={litY - 8} text={inp} fontSize={16} />
                      <Circle x={INPUT_X + 30} y={litY} radius={4} fill="black" />

                      {neg ? (
                        <>
                          <Line points={[INPUT_X + 30, litY, NOT_X, litY]} stroke="black" />
                          <NotGate x={NOT_X} y={litY - 20} />
                          <Line points={[NOT_X + 50, litY, destX, destY]} stroke="black" />
                        </>
                      ) : (
                        <Line points={[INPUT_X + 30, litY, destX, destY]} stroke="black" />
                      )}
                    </React.Fragment>
                  );
                })}

                {isMultiLiteral && <AndGate x={AND_X} y={avgLitY - GATE_H / 2} />}

                {hasOR && isMultiLiteral && (
                  <Line points={[AND_X + 40, avgLitY, OR_X, orCenterY]} stroke="black" />
                )}
              </React.Fragment>
            );
          })}

          {hasOR && <OrGate x={OR_X} y={orCenterY - GATE_H / 2} />}

          <Text
            x={FINAL_X + 25}
            y={hasOR ? orCenterY - 8 : termOutputYs[0] - 8}
            text="F"
            fontSize={16}
            fontStyle="bold"
          />
        </Layer>
      </Stage>
    </div>
  );
}
