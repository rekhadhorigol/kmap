import React, { useState } from "react";
import axios from "axios";
import InputPanel from "./InputPanel";
import KMapVisualization from "./KMapVisualization";
import ResultsPanel from "./ResultsPanel";
import VerilogPanel from "./VerilogPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Grid3x3, Binary, Code, Zap } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function KMapApp() {
  const [numVars, setNumVars] = useState(3);
  const [inputMode, setInputMode] = useState("minterm");
  const [minterms, setMinterms] = useState([0, 2, 5, 7]);
  const [maxterms, setMaxterms] = useState([]);
  const [dontCares, setDontCares] = useState([]);
  const [expression, setExpression] = useState("");
  const [varNames, setVarNames] = useState(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("input");

  const handleMinimize = async () => {
    if (inputMode === "minterm" && minterms.length === 0) {
      toast.error("Please enter at least one minterm");
      return;
    }
    if (inputMode === "maxterm" && maxterms.length === 0) {
      toast.error("Please enter at least one maxterm");
      return;
    }
    if (inputMode === "expression" && !expression.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/minimize`, {
        num_vars: numVars,
        input_mode: inputMode,
        minterms: inputMode === "minterm" ? minterms : [],
        maxterms: inputMode === "maxterm" ? maxterms : [],
        dont_cares: dontCares,
        expression: inputMode === "expression" ? expression : null,
        variable_names: varNames,
      });

      setResults(response.data);
      setActiveTab("kmap");
      toast.success("K-Map minimized successfully!");
    } catch (error) {
      console.error("Minimization error:", error);
      toast.error(error.response?.data?.detail || "Minimization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setNumVars(3);
    setInputMode("minterm");
    setMinterms([]);
    setMaxterms([]);
    setDontCares([]);
    setExpression("");
    setResults(null);
    setActiveTab("input");
    toast.info("Reset to default values");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      {/* Skip to content */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-200 sticky top-0 z-50 shadow-sm" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                <Grid3x3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  K-Map Minimizer
                </h1>
                <p className="text-sm text-slate-500 hidden sm:block">
                  Bit-Slice Exact Minimizer &middot; 2&#8211;15 variables
                </p>
              </div>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-slate-300 hover:bg-slate-100 text-slate-700"
              data-testid="reset-button"
              aria-label="Reset all inputs to default"
            >
              Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-slate-200" aria-label="K-Map sections">
            <TabsTrigger
              value="input"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all"
              data-testid="tab-input"
            >
              <Binary className="w-4 h-4 mr-2" aria-hidden="true" />
              Input
            </TabsTrigger>
            <TabsTrigger
              value="kmap"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all disabled:opacity-40"
              disabled={!results}
              data-testid="tab-kmap"
            >
              <Grid3x3 className="w-4 h-4 mr-2" aria-hidden="true" />
              K-Map
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all disabled:opacity-40"
              disabled={!results}
              data-testid="tab-results"
            >
              <Zap className="w-4 h-4 mr-2" aria-hidden="true" />
              Results
            </TabsTrigger>
            <TabsTrigger
              value="verilog"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all disabled:opacity-40"
              disabled={!results}
              data-testid="tab-verilog"
            >
              <Code className="w-4 h-4 mr-2" aria-hidden="true" />
              Verilog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-6">
            <InputPanel
              numVars={numVars}
              setNumVars={setNumVars}
              inputMode={inputMode}
              setInputMode={setInputMode}
              minterms={minterms}
              setMinterms={setMinterms}
              maxterms={maxterms}
              setMaxterms={setMaxterms}
              dontCares={dontCares}
              setDontCares={setDontCares}
              expression={expression}
              setExpression={setExpression}
              varNames={varNames}
              setVarNames={setVarNames}
              onMinimize={handleMinimize}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="kmap">
            {results && (
              <KMapVisualization
                numVars={numVars}
                varNames={varNames}
                minterms={results.truth_table.filter(r => r.F === 1).map(r => r.minterm)}
                dontCares={results.truth_table.filter(r => r.F === 'X').map(r => r.minterm)}
                groups={results.groups}
              />
            )}
          </TabsContent>

          <TabsContent value="results">
            {results && (
              <ResultsPanel
                results={results}
                varNames={varNames}
                numVars={numVars}
              />
            )}
          </TabsContent>

          <TabsContent value="verilog">
            {results && (
              <VerilogPanel results={results} varNames={varNames} numVars={numVars} />
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-emerald-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-600">
            K-Map Minimizer using Optimized Bit-Slice Quine-McCluskey with Branch-and-Bound | Built with FastAPI + React
          </p>
          {results?.performance_metrics && (
            <p className="text-center text-xs text-emerald-600 mt-2">
              Last minimization: {results.performance_metrics.total_time_ms}ms
              | {results.performance_metrics.num_prime_implicants} PIs
              | {results.performance_metrics.num_selected_pis} selected
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
