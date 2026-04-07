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

export default function KMapApp({ onResult }) {
  const [numVars, setNumVars] = useState(3);
  const [inputMode, setInputMode] = useState("minterm");
  const [minterms, setMinterms] = useState([0, 2, 5, 7]);
  const [maxterms, setMaxterms] = useState([]);
  const [dontCares, setDontCares] = useState([]);
  const [expression, setExpression] = useState("");
  const [varNames, setVarNames] = useState(["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O"]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("input");

  const handleMinimize = async () => {
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

      if (onResult) {
        onResult({
          variables: varNames.slice(0, numVars),
          sop: response.data?.minimal_sop || "",
          pos: response.data?.minimal_pos || "",
        });
      }

    } catch (error) {
      console.error(error);
      toast.error("Minimization failed");
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
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between">
          <div className="flex items-center gap-3">
            <Grid3x3 className="w-6 h-6 text-white bg-emerald-500 p-1 rounded" />
            <h1 className="text-xl font-bold">K-Map Minimizer</h1>
          </div>
          <Button onClick={handleReset}>Reset</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="kmap" disabled={!results}>KMap</TabsTrigger>
            <TabsTrigger value="results" disabled={!results}>Results</TabsTrigger>
            <TabsTrigger value="verilog" disabled={!results}>Verilog</TabsTrigger>
          </TabsList>

          <TabsContent value="input">
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
            {results && <ResultsPanel results={results} />}
          </TabsContent>

          <TabsContent value="verilog">
            {results && <VerilogPanel results={results} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}