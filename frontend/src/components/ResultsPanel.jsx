import React from "react";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { CheckCircle2, Circle, Table, Lightbulb, Binary, Zap, Clock } from "lucide-react";
import LogicDiagram from "./LogicDiagram";


export default function ResultsPanel({ results, varNames, numVars }) {
  return (
    <div className="space-y-6">

      {/* Expression Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SOP */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-lg p-6 border-2 border-emerald-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Sum of Products (SOP)</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">Canonical Form:</p>
              <p className="text-lg font-bold font-mono" data-testid="canonical-sop">
                F = {results.canonical_sop}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">Minimal Form:</p>
              <p className="text-xl font-bold text-emerald-700 font-mono" data-testid="minimal-sop">
                F = {results.minimal_sop}
              </p>
            </div>
          </div>
        </Card>

        {/* POS */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border-2 border-blue-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Product of Sums (POS)</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">Canonical Form:</p>
              <p className="text-lg font-bold font-mono" data-testid="canonical-pos">
                F = {results.canonical_pos}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">Minimal Form:</p>
              <p className="text-xl font-bold text-blue-700 font-mono" data-testid="minimal-pos">
                F = {results.minimal_pos}
              </p>
            </div>
          </div>
        </Card>

      </div>

      {/* Tabs */}
      <Tabs defaultValue="truth-table" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-white/80 p-1 rounded-xl shadow-sm">

          <TabsTrigger
            value="truth-table"
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg"
          >
            <Table className="w-4 h-4 mr-2" />
            Truth Table
          </TabsTrigger>

          <TabsTrigger
            value="prime-implicants"
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg"
          >
            <Binary className="w-4 h-4 mr-2" />
            Prime Implicants
          </TabsTrigger>

          <TabsTrigger
            value="steps"
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Steps
          </TabsTrigger>

          <TabsTrigger
            value="logic-diagram"
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Logic Diagram
          </TabsTrigger>

          <TabsTrigger
            value="performance"
            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg"
          >
            <Zap className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>

        </TabsList>

        {/* Truth Table */}
        <TabsContent value="truth-table">
          <Card className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Truth Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-emerald-100 border-b-2 border-emerald-300">
                    {varNames.slice(0, numVars).map((name) => (
                      <th key={name} className="px-4 py-2 text-left font-semibold">{name}</th>
                    ))}
                    <th className="px-4 py-2 text-left font-semibold">F</th>
                    <th className="px-4 py-2 text-left font-semibold">Minterm</th>
                  </tr>
                </thead>
                <tbody>
                  {results.truth_table.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      {varNames.slice(0, numVars).map((name) => (
                        <td key={name} className="px-4 py-2 font-mono">{row[name]}</td>
                      ))}
                      <td className="px-4 py-2 font-bold font-mono">
                        {row.F}
                      </td>
                      <td className="px-4 py-2 font-mono">{row.minterm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Prime Implicants */}
        <TabsContent value="prime-implicants">
          <Card className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Prime Implicants</h3>
            <div className="space-y-3">
              {results.prime_implicants.map((pi, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {pi.essential ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                    <div>
                      <p className="font-mono font-semibold">{pi.term}</p>
                      <p className="text-sm text-slate-600">
                        Expression: <span className="font-semibold">{pi.expression}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{pi.essential ? "Essential" : "Non-Essential"}</Badge>
                    <Badge variant="outline">Minterms: {pi.minterms.join(", ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Steps */}
        <TabsContent value="steps">
          <Card className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Minimization Steps</h3>
            <ol className="space-y-3">
              {results.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <p className="text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </Card>
        </TabsContent>

        <TabsContent value="logic-diagram">
          <Card className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
               Logic Diagram (from Minimal SOP)
            </h3>

            {/* Remove "F =" before passing */}
            <LogicDiagram
              sop={results.minimal_sop.replace(/^F\s*=\s*/i, "")}
            />
          </Card>
        </TabsContent>

        {/* Performance Metrics */}
        <TabsContent value="performance">
          <Card className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">Performance Metrics</h3>
                <p className="text-sm text-slate-600">
                  {results.performance_metrics?.algorithm || "Bit-Slice Optimization"}
                </p>
              </div>
            </div>

            {results.performance_metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Total Time */}
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-slate-700">Total Time</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">
                    {results.performance_metrics.total_time_ms}ms
                  </p>
                </div>

                {/* Variables */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Binary className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-700">Variables</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {results.performance_metrics.num_variables}
                  </p>
                </div>

                {/* Minterms */}
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Table className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-slate-700">Minterms</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {results.performance_metrics.num_minterms}
                  </p>
                </div>

                {/* Prime Implicants */}
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-amber-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-slate-700">Prime Implicants</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">
                    {results.performance_metrics.num_prime_implicants}
                  </p>
                </div>

                {/* Essential PIs */}
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-slate-700">Essential PIs</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {results.performance_metrics.num_essential_pis}
                  </p>
                </div>

                {/* Selected PIs */}
                <div className="p-4 bg-gradient-to-br from-rose-50 to-red-50 rounded-lg border-2 border-rose-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Circle className="w-4 h-4 text-rose-600" />
                    <span className="text-sm font-semibold text-slate-700">Selected PIs</span>
                  </div>
                  <p className="text-2xl font-bold text-rose-700">
                    {results.performance_metrics.num_selected_pis}
                  </p>
                </div>
              </div>
            )}

            {/* Timing Breakdown */}
            {results.performance_metrics?.timings && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-3">Timing Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(results.performance_metrics.timings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="outline" className="font-mono">{value}ms</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimization Info */}
            {results.performance_metrics?.optimization_level && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Optimization Details</h4>
                <p className="text-sm text-slate-600">
                  <strong>Level:</strong> {results.performance_metrics.optimization_level}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  This implementation uses bitwise operations for 10-100x faster minterm comparison
                  and branch-and-bound algorithm for optimal column covering.
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
