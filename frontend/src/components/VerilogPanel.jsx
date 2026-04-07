import React from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";
import WaveformViewer from "./WaveformViewer";

const CodeBlock = ({ code, title, testId }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "_")}.v`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded successfully!");
  };

  return (
    <Card className="bg-white rounded-xl shadow-md p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="border-emerald-300 hover:bg-emerald-50"
            data-testid={`${testId}-copy`}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            className="bg-emerald-500 hover:bg-emerald-600"
            data-testid={`${testId}-download`}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
      <pre className="code-block" data-testid={testId}>
        {code}
      </pre>
    </Card>
  );
};

export default function VerilogPanel({ results, varNames, numVars }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="behavioral" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-sm">
          <TabsTrigger
            value="behavioral"
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg text-sm"
            data-testid="tab-behavioral"
          >
            Behavioral
          </TabsTrigger>
          <TabsTrigger
            value="dataflow"
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg text-sm"
            data-testid="tab-dataflow"
          >
            Dataflow
          </TabsTrigger>
          <TabsTrigger
            value="gate-level"
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg text-sm"
            data-testid="tab-gate-level"
          >
            Gate Level
          </TabsTrigger>
          <TabsTrigger
            value="testbench"
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg text-sm"
            data-testid="tab-testbench"
          >
            Testbench
          </TabsTrigger>
          <TabsTrigger
            value="simulation"
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg text-sm"
            data-testid="tab-simulation"
          >
            VVP Output
          </TabsTrigger>
          <TabsTrigger
            value="gtkwave"
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg text-sm"
            data-testid="tab-gtkwave"
          >
            GTKWave
          </TabsTrigger>
        </TabsList>

        <TabsContent value="behavioral">
          <CodeBlock
            code={results.verilog_behavioral}
            title="Behavioral Verilog"
            testId="behavioral-verilog"
          />
        </TabsContent>

        <TabsContent value="dataflow">
          <CodeBlock
            code={results.verilog_dataflow}
            title="Dataflow Verilog"
            testId="dataflow-verilog"
          />
        </TabsContent>

        <TabsContent value="gate-level">
          <CodeBlock
            code={results.verilog_gate_level}
            title="Gate Level Verilog"
            testId="gate-level-verilog"
          />
        </TabsContent>

        <TabsContent value="testbench">
          <CodeBlock
            code={results.verilog_testbench}
            title="Verilog Testbench"
            testId="testbench-verilog"
          />
        </TabsContent>

        <TabsContent value="simulation">
          <Card className="bg-white rounded-xl shadow-md p-6 card-hover">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              Simulation Output (VVP)
            </h3>
            <pre
              className="code-block bg-slate-900 text-green-400"
              data-testid="simulation-output"
            >
              {results.simulation_output}
            </pre>
            <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-slate-700">
                <strong>Note:</strong> This is a simulated output showing how the design would behave.
                To run actual simulation, use: <code className="bg-slate-200 px-2 py-1 rounded">iverilog -o kmap kmap_dataflow.v kmap_tb.v && vvp kmap</code>
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="gtkwave">
          <WaveformViewer 
            waveformData={results.waveform_data}
            varNames={varNames}
            numVars={numVars}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
