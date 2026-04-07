import React from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Calculator, Loader2, Info } from "lucide-react";

export default function InputPanel({
  numVars,
  setNumVars,
  inputMode,
  setInputMode,
  minterms,
  setMinterms,
  maxterms,
  setMaxterms,
  dontCares,
  setDontCares,
  expression,
  setExpression,
  varNames,
  setVarNames,
  onMinimize,
  loading,
}) {
  const parseNumbers = (value, maxValue) => {
    const nums = value
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n !== "")
      .map((n) => parseInt(n, 10))
      .filter((n) => !isNaN(n) && n >= 0 && n < maxValue);
    return [...new Set(nums)];
  };

  const handleMintermChange = (e) => {
    const nums = parseNumbers(e.target.value, 2 ** numVars);
    setMinterms(nums);
  };

  const handleMaxtermChange = (e) => {
    const nums = parseNumbers(e.target.value, 2 ** numVars);
    setMaxterms(nums);
  };

  const handleDontCareChange = (e) => {
    const nums = parseNumbers(e.target.value, 2 ** numVars);
    setDontCares(nums);
  };

  const hasValidInput = () => {
    if (inputMode === "minterm") return minterms.length > 0;
    if (inputMode === "maxterm") return maxterms.length > 0;
    return false;
  };

  return (
    <Card className="bg-white rounded-xl shadow-lg p-6 sm:p-8 card-hover">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Configure K-Map Parameters
      </h2>

      {/* Input Mode */}
      <div className="space-y-4 mb-6">
        <Label className="text-base font-semibold text-slate-700">
          Input Mode
        </Label>
        <RadioGroup
          value={inputMode}
          onValueChange={(val) => {
            setInputMode(val);
            setMinterms([]);
            setMaxterms([]);
            setDontCares([]);
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="minterm" id="mode-minterm" />
            <Label htmlFor="mode-minterm">Minterm (Sum of Products)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="maxterm" id="mode-maxterm" />
            <Label htmlFor="mode-maxterm">Maxterm (Product of Sums)</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Number of Variables */}
      <div className="space-y-4 mb-6">
        <Label className="text-base font-semibold text-slate-700">
          Number of Variables
        </Label>
        <Select
          value={numVars.toString()}
          onValueChange={(val) => {
            setNumVars(parseInt(val));
            setMinterms([]);
            setMaxterms([]);
            setDontCares([]);
          }}
        >
          <SelectTrigger className="w-full border-emerald-300 focus:border-emerald-500">
            <SelectValue placeholder="Select number of variables" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 14 }, (_, i) => i + 2).map((n) => (
              <SelectItem key={n} value={n.toString()}>
                {n} Variables {n > 4 && n <= 8 ? "(Standard)" : n > 8 ? "(Large - Optimized)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {numVars > 8 && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <Info className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Using bit-slice optimization for {numVars} variables.
              This handles up to {Math.pow(2, numVars).toLocaleString()} minterms efficiently.
            </p>
          </div>
        )}
      </div>

      {/* Variable Names */}
      <div className="space-y-3 mb-6">
        <Label className="text-base font-semibold text-slate-700">
          Variable Names
        </Label>
        <div className="flex flex-wrap gap-3">
          {varNames.slice(0, numVars).map((name, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Var {idx}</span>
              <Input
                type="text"
                value={name}
                maxLength={4}
                onChange={(e) => {
                  const updated = [...varNames];
                  updated[idx] = e.target.value.toUpperCase();
                  setVarNames(updated);
                }}
                className="input-field border-emerald-300 focus:border-emerald-500 w-20 text-center"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Minterms */}
      {inputMode === "minterm" && (
        <div className="space-y-3 mb-6">
          <Label>Minterms (comma-separated)</Label>
          <Input
            type="text"
            placeholder="e.g., 0, 2, 5, 7"
            defaultValue={minterms.join(", ")}
            onChange={handleMintermChange}
            className="input-field border-emerald-300 focus:border-emerald-500"
          />
        </div>
      )}

      {/* Maxterms */}
      {inputMode === "maxterm" && (
        <div className="space-y-3 mb-6">
          <Label>Maxterms (comma-separated)</Label>
          <Input
            type="text"
            placeholder="e.g., 1, 3, 4, 6"
            defaultValue={maxterms.join(", ")}
            onChange={handleMaxtermChange}
            className="input-field border-emerald-300 focus:border-emerald-500"
          />
        </div>
      )}

      {/* Don't Cares */}
      {(inputMode === "minterm" || inputMode === "maxterm") && (
        <div className="space-y-3 mb-6">
          <Label>Don't Cares (optional)</Label>
          <Input
            type="text"
            placeholder="e.g., 1, 4"
            defaultValue={dontCares.join(", ")}
            onChange={handleDontCareChange}
            className="input-field border-emerald-300 focus:border-emerald-500"
          />
        </div>
      )}

      {/* Minimize Button */}
      <Button
        onClick={onMinimize}
        disabled={loading || !hasValidInput()}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-6 text-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Minimizing...
          </>
        ) : (
          <>
            <Calculator className="w-5 h-5 mr-2" /> Minimize K-Map
          </>
        )}
      </Button>
    </Card>
  );
}
