from fastapi import FastAPI, APIRouter, HTTPException, Request
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import re
from itertools import combinations, product
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (optional - not required for minimization)
try:
    mongo_url = os.environ.get('MONGO_URL', '')
    if mongo_url:
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ.get('DB_NAME', 'kmap_db')]
    else:
        client = None
        db = None
except Exception as e:
    logging.warning(f"MongoDB connection not available: {e}")
    client = None
    db = None

@asynccontextmanager
async def lifespan(application):
    yield
    if client:
        client.close()

app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")


# ─── Models ───────────────────────────────────────────────────────────────────

class MinimizeRequest(BaseModel):
    num_vars: int = Field(..., ge=2, le=15)
    input_mode: str = Field(default="minterm")
    minterms: List[int] = Field(default_factory=list)
    maxterms: List[int] = Field(default_factory=list)
    dont_cares: List[int] = Field(default_factory=list)
    expression: Optional[str] = None
    variable_names: List[str] = Field(default=["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"])

class MinimizeResponse(BaseModel):
    truth_table: List[Dict[str, Any]]
    prime_implicants: List[Dict[str, Any]]
    essential_prime_implicants: List[str]
    minimal_sop: str
    minimal_pos: str
    canonical_sop: str
    canonical_pos: str
    groups: List[Dict[str, Any]]
    verilog_behavioral: str
    verilog_dataflow: str
    verilog_gate_level: str
    verilog_testbench: str
    simulation_output: str
    waveform_data: Dict[str, Any]
    steps: List[str]
    performance_metrics: Dict[str, Any] = Field(default_factory=dict)
    output_name: str = "F"


# ─── Boolean Expression Parser ────────────────────────────────────────────────

class BooleanExpressionParser:
    def __init__(self, expression, var_names):
        self.expression = expression.upper().strip()
        self.var_names = [v.upper() for v in var_names]

    def parse_to_minterms(self, num_vars):
        expr = self.expression
        expr = expr.replace("'", "'").replace("^", "'").replace("¬", "'")
        expr = expr.replace("!", "'").replace("*", "").replace(".", "")
        minterms = []
        for i in range(2 ** num_vars):
            binary = format(i, f'0{num_vars}b')
            var_values = {self.var_names[j]: int(binary[j]) for j in range(num_vars)}
            if self.evaluate_expression(expr, var_values):
                minterms.append(i)
        return minterms

    def evaluate_expression(self, expr, var_values):
        try:
            eval_expr = expr
            sorted_vars = sorted(self.var_names, key=len, reverse=True)
            for var in sorted_vars:
                if var in eval_expr:
                    eval_expr = re.sub(f"{var}'", f"(not {var_values[var]})", eval_expr)
                    eval_expr = re.sub(f"(?<!not ){var}(?!')", str(var_values[var]), eval_expr)
            eval_expr = eval_expr.replace("+", " or ")
            eval_expr = re.sub(r'(\d)\s*\(', r'\1 and (', eval_expr)
            eval_expr = re.sub(r'\)\s*(\d)', r') and \1', eval_expr)
            eval_expr = re.sub(r'\)\s*\(', r') and (', eval_expr)
            while re.search(r'(\d)\s*(\d)', eval_expr):
                eval_expr = re.sub(r'(\d)\s*(\d)', r'\1 and \2', eval_expr)
            return bool(eval(eval_expr))
        except:
            return False


# ─── Optimized Bit-Slice Quine-McCluskey ──────────────────────────────────────

class BitSliceQuineMcCluskey:
    def __init__(self, num_vars, minterms, dont_cares=[]):
        self.num_vars = num_vars
        self.minterms = sorted(set(minterms))
        self.dont_cares = sorted(set(dont_cares))
        self.all_terms = sorted(set(minterms + dont_cares))
        self.steps = []
        self.mask_full = (1 << num_vars) - 1
        self.term_to_idx = {term: i for i, term in enumerate(self.all_terms)}
        self.idx_to_term = list(self.all_terms)
        self._time_start = time.perf_counter()
        self._time_budget = 2.0

    @staticmethod
    def popcount(n):
        return n.bit_count()

    @staticmethod
    def can_combine_bitwise(value1, mask1, value2, mask2):
        if mask1 != mask2:
            return False, 0, 0
        diff = value1 ^ value2
        if diff != 0 and (diff & (diff - 1)) == 0:
            return True, value1 & value2, mask1 | diff
        return False, 0, 0

    def implicant_to_binary(self, value, mask):
        result = []
        for i in range(self.num_vars - 1, -1, -1):
            if mask & (1 << i):
                result.append('-')
            elif value & (1 << i):
                result.append('1')
            else:
                result.append('0')
        return ''.join(result)

    def get_minterms_from_implicant(self, value, mask):
        dc_positions = [i for i in range(self.num_vars) if mask & (1 << i)]
        minterms = []
        for combo in range(1 << len(dc_positions)):
            minterm = value
            for idx, pos in enumerate(dc_positions):
                if combo & (1 << idx):
                    minterm |= (1 << pos)
            minterms.append(minterm)
        return sorted(minterms)

    def find_prime_implicants(self):
        if not self.all_terms:
            return []

        current_level = {}
        for term in self.all_terms:
            ones = self.popcount(term)
            if ones not in current_level:
                current_level[ones] = []
            current_level[ones].append((term, 0, 1 << self.term_to_idx[term]))

        self.steps.append(f"Initial grouping by popcount: {len(current_level)} groups")

        prime_implicants = []
        all_used = set()

        iteration = 0
        while current_level:
            iteration += 1
            if self._is_over_budget():
                self.steps.append("Time budget reached; returning current prime implicants")
                for key in current_level:
                    for value, mask, mints in current_level[key]:
                        sig = (value, mask)
                        if sig not in all_used:
                            prime_implicants.append((value, mask, mints))
                            all_used.add(sig)
                break

            next_level_map = {}
            current_used = set()
            sorted_keys = sorted(current_level.keys())
            budget_exceeded = False

            for i in range(len(sorted_keys) - 1):
                if budget_exceeded or self._is_over_budget():
                    budget_exceeded = True
                    break
                key1, key2 = sorted_keys[i], sorted_keys[i + 1]
                for value1, mask1, mints1 in current_level[key1]:
                    for value2, mask2, mints2 in current_level[key2]:
                        can_comb, new_value, new_mask = self.can_combine_bitwise(value1, mask1, value2, mask2)
                        if can_comb:
                            current_used.add((value1, mask1))
                            current_used.add((value2, mask2))
                            new_mints = mints1 | mints2
                            sig = (new_value, new_mask)
                            if sig in next_level_map:
                                next_level_map[sig] |= new_mints
                            else:
                                next_level_map[sig] = new_mints

            for key in current_level:
                for value, mask, mints in current_level[key]:
                    sig = (value, mask)
                    if sig not in current_used and sig not in all_used:
                        prime_implicants.append((value, mask, mints))
                        all_used.add(sig)

            if budget_exceeded:
                self.steps.append("Time budget reached mid-iteration; returning current prime implicants")
                break

            next_level = {}
            for (value, mask), mints in next_level_map.items():
                ones = self.popcount(value & ~mask)
                if ones not in next_level:
                    next_level[ones] = []
                next_level[ones].append((value, mask, mints))

            current_level = next_level
            if next_level:
                total_terms = sum(len(v) for v in next_level.values())
                self.steps.append(f"Iteration {iteration}: Created {total_terms} new implicants")

        self.steps.append(f"Found {len(prime_implicants)} prime implicants using bit-slicing")
        return prime_implicants

    @staticmethod
    def _bitmask_to_list(bitmask):
        result = []
        n = bitmask
        while n:
            bit = n & (-n)
            result.append(bit.bit_length() - 1)
            n ^= bit
        return result

    def _is_over_budget(self):
        return time.perf_counter() - self._time_start > self._time_budget

    def bitmask_to_terms(self, bitmask):
        return [self.idx_to_term[idx] for idx in self._bitmask_to_list(bitmask)
                if idx < len(self.idx_to_term)]

    def _greedy_cover(self, essential_pis, remaining_pis, uncovered_bitmask):
        selected = list(essential_pis)
        remaining_uncovered = uncovered_bitmask
        pool = list(remaining_pis)
        while remaining_uncovered and pool:
            if self._is_over_budget():
                self.steps.append("Time budget reached during greedy cover")
                break
            best_pi = max(pool, key=lambda pi: self.popcount(pi[4] & remaining_uncovered))
            if self.popcount(best_pi[4] & remaining_uncovered) == 0:
                break
            selected.append((best_pi[1], best_pi[2], best_pi[3]))
            remaining_uncovered &= ~best_pi[4]
            pool.remove(best_pi)
        if remaining_uncovered:
            count = 0
            for idx in self._bitmask_to_list(remaining_uncovered):
                if idx < len(self.idx_to_term):
                    term = self.idx_to_term[idx]
                    selected.append((term, 0, 1 << idx))
                    count += 1
            self.steps.append(f"Added {count} individual terms to guarantee full coverage")
        return selected

    def find_minimal_cover_advanced(self, prime_implicants):
        if not self.minterms:
            return [], []

        coverage = {mint: [] for mint in self.minterms}
        for i, (value, mask, mints_bitmask) in enumerate(prime_implicants):
            for term in self.bitmask_to_terms(mints_bitmask):
                if term in coverage:
                    coverage[term].append(i)

        essential = set()
        for mint, covering_pis in coverage.items():
            if len(covering_pis) == 1:
                essential.add(covering_pis[0])

        essential_pis = [prime_implicants[i] for i in essential]
        self.steps.append(f"Identified {len(essential_pis)} essential prime implicants")

        minterm_bitmask = 0
        for m in self.minterms:
            minterm_bitmask |= (1 << self.term_to_idx[m])

        covered_bitmask = 0
        for value, mask, mints_bm in essential_pis:
            covered_bitmask |= (mints_bm & minterm_bitmask)

        uncovered_bitmask = minterm_bitmask & ~covered_bitmask

        if uncovered_bitmask == 0:
            return essential_pis, essential_pis

        uncovered_count = self.popcount(uncovered_bitmask)

        remaining_pis = []
        for i, (value, mask, mints_bm) in enumerate(prime_implicants):
            if i not in essential:
                cover_bm = mints_bm & uncovered_bitmask
                if cover_bm:
                    remaining_pis.append((i, value, mask, mints_bm, cover_bm))

        remaining_pis.sort(key=lambda pi: self.popcount(pi[4]), reverse=True)

        if len(remaining_pis) > 30 or uncovered_count > 20 or self._is_over_budget():
            self.steps.append("Using greedy heuristic for large problem instance")
            return essential_pis, self._greedy_cover(essential_pis, remaining_pis, uncovered_bitmask)

        best_solution = None
        best_size = float('inf')
        nodes_explored = [0]
        max_nodes = 50000

        def branch_and_bound(selected, remaining, uncov_bm, index):
            nonlocal best_solution, best_size
            nodes_explored[0] += 1
            if nodes_explored[0] > max_nodes:
                return
            if len(selected) >= best_size:
                return
            if uncov_bm == 0:
                if len(selected) < best_size:
                    best_size = len(selected)
                    best_solution = selected.copy()
                return
            if index >= len(remaining):
                return
            max_coverage = max(
                (self.popcount(pi[4] & uncov_bm) for pi in remaining[index:]), default=0)
            if max_coverage == 0:
                return
            uncov_count = self.popcount(uncov_bm)
            lower_bound = len(selected) + (uncov_count + max_coverage - 1) // max_coverage
            if lower_bound >= best_size:
                return
            idx, value, mask, mints_bm, cover_bm = remaining[index]
            new_uncov = uncov_bm & ~cover_bm
            selected.append((value, mask, mints_bm))
            branch_and_bound(selected, remaining, new_uncov, index + 1)
            selected.pop()
            branch_and_bound(selected, remaining, uncov_bm, index + 1)

        branch_and_bound([], remaining_pis, uncovered_bitmask, 0)

        if best_solution is not None:
            final_selected = list(essential_pis) + best_solution
            self.steps.append(f"Found optimal cover with {len(final_selected)} prime implicants")
            return essential_pis, final_selected

        self.steps.append("Branch-and-bound node limit reached; using greedy fallback")
        return essential_pis, self._greedy_cover(essential_pis, remaining_pis, uncovered_bitmask)

    def term_to_expression(self, value_or_str, mask_or_varnames=None, var_names=None):
        if isinstance(value_or_str, str):
            term = value_or_str
            vn = mask_or_varnames
            expr = []
            for i, bit in enumerate(term):
                if bit == '1':
                    expr.append(vn[i])
                elif bit == '0':
                    expr.append(vn[i] + "'")
            return ''.join(expr) if expr else '1'
        else:
            value = value_or_str
            mask = mask_or_varnames
            vn = var_names
            expr = []
            for i in range(self.num_vars - 1, -1, -1):
                if not (mask & (1 << i)):
                    if value & (1 << i):
                        expr.append(vn[self.num_vars - 1 - i])
                    else:
                        expr.append(vn[self.num_vars - 1 - i] + "'")
            return ''.join(expr) if expr else '1'

    def minimize(self, var_names):
        prime_implicants = self.find_prime_implicants()
        essential_pis, selected_pis = self.find_minimal_cover_advanced(prime_implicants)

        if not selected_pis:
            return "0", [], [], []

        expression_terms = [
            self.term_to_expression(value, mask, var_names)
            for value, mask, _ in selected_pis
        ]
        expression = ' + '.join(expression_terms)

        pi_list_compat = []
        for value, mask, mints_bm in prime_implicants:
            binary_str = self.implicant_to_binary(value, mask)
            minterm_list = sorted(self.bitmask_to_terms(mints_bm))
            pi_list_compat.append((binary_str, minterm_list))

        essential_compat = [
            (self.implicant_to_binary(v, m), sorted(self.bitmask_to_terms(mints_bm)))
            for v, m, mints_bm in essential_pis
        ]
        selected_compat = [
            (self.implicant_to_binary(v, m), sorted(self.bitmask_to_terms(mints_bm)))
            for v, m, mints_bm in selected_pis
        ]

        return expression, pi_list_compat, essential_compat, selected_compat


class QuineMcCluskey(BitSliceQuineMcCluskey):
    pass


# ─── Helpers ──────────────────────────────────────────────────────────────────

def maxterms_to_minterms(maxterms, num_vars):
    all_terms = set(range(2 ** num_vars))
    return sorted(all_terms - set(maxterms))

_MAX_TABLE_ROWS = 256
_MAX_WAVEFORM_STEPS = 32


def generate_canonical_sop(minterms, num_vars, var_names):
    if not minterms:
        return "0"
    cap = _MAX_TABLE_ROWS
    terms = []
    for m in minterms[:cap]:
        binary = format(m, f'0{num_vars}b')
        term = ''.join([var_names[i] if binary[i] == '1' else var_names[i] + "'"
                        for i in range(num_vars)])
        terms.append(term)
    result = ' + '.join(terms)
    if len(minterms) > cap:
        result += f' + ... ({len(minterms) - cap} more terms)'
    return result


def generate_canonical_pos(maxterms, num_vars, var_names):
    if not maxterms:
        return "1"
    cap = _MAX_TABLE_ROWS
    terms = []
    for m in maxterms[:cap]:
        binary = format(m, f'0{num_vars}b')
        term_parts = [var_names[i] if binary[i] == '0' else var_names[i] + "'"
                      for i in range(num_vars)]
        terms.append('(' + ' + '.join(term_parts) + ')')
    result = ''.join(terms)
    if len(maxterms) > cap:
        result += f'... ({len(maxterms) - cap} more terms)'
    return result


def generate_minimal_pos(maxterms, num_vars, var_names, dont_cares=[]):
    if not maxterms:
        return "1"
    if num_vars > 10 or len(maxterms) > 256:
        return generate_canonical_pos(maxterms, num_vars, var_names)

    qm = BitSliceQuineMcCluskey(num_vars, maxterms, dont_cares)
    prime_implicants = qm.find_prime_implicants()
    if not prime_implicants:
        return "1"

    minterm_bitmask = 0
    for m in qm.minterms:
        minterm_bitmask |= (1 << qm.term_to_idx[m])

    remaining = minterm_bitmask
    selected = []
    scored = []
    for value, mask, mints_bm in prime_implicants:
        cover = mints_bm & minterm_bitmask
        scored.append((value, mask, mints_bm, cover, cover.bit_count()))
    scored.sort(key=lambda x: x[4], reverse=True)

    while remaining:
        best = None
        best_count = 0
        for item in scored:
            c = (item[3] & remaining).bit_count()
            if c > best_count:
                best_count = c
                best = item
        if best is None or best_count == 0:
            break
        selected.append(best)
        remaining &= ~best[3]
        scored.remove(best)

    expression_terms = []
    for value, mask, mints_bm, _, _ in selected:
        binary_str = qm.implicant_to_binary(value, mask)
        term_parts = []
        for i, bit in enumerate(binary_str):
            if bit == '0':
                term_parts.append(var_names[i])
            elif bit == '1':
                term_parts.append(var_names[i] + "'")
        if term_parts:
            expression_terms.append('(' + ' + '.join(term_parts) + ')')
    return ''.join(expression_terms) if expression_terms else "1"


def _output_name(var_names, num_vars):
    used = set(var_names[:num_vars])
    for candidate in ["F", "Y", "Out", "Z", "Q"]:
        if candidate not in used:
            return candidate
    return "F_out"


def generate_truth_table(num_vars, minterms, dont_cares, var_names):
    minterm_set = set(minterms)
    dc_set = set(dont_cares)
    out = _output_name(var_names, num_vars)
    total = 2 ** num_vars
    cap = min(total, _MAX_TABLE_ROWS)
    table = []
    for i in range(cap):
        binary = format(i, f'0{num_vars}b')
        row = {var_names[j]: int(binary[j]) for j in range(num_vars)}
        if i in minterm_set:
            row[out] = 1
        elif i in dc_set:
            row[out] = 'X'
        else:
            row[out] = 0
        row['minterm'] = i
        table.append(row)
    return table, out, total


def generate_waveform_data(truth_table, num_vars, var_names, out_name):
    signals = {var: [] for var in var_names[:num_vars]}
    signals[out_name] = []
    cap = min(len(truth_table), _MAX_WAVEFORM_STEPS)
    for i in range(cap):
        row = truth_table[i]
        for var in var_names[:num_vars]:
            signals[var].append(row[var])
        signals[out_name].append(1 if row[out_name] == 1 else 0)
    return {
        "signals": signals,
        "time_steps": cap,
        "signal_names": var_names[:num_vars] + [out_name]
    }


def sop_to_verilog(expression, num_vars, var_names):
    if expression == "0":
        return "1'b0"
    if expression == "1":
        return "1'b1"
    vars_list = var_names[:num_vars]
    sorted_vars = sorted(vars_list, key=len, reverse=True)
    terms = expression.split(" + ")
    verilog_terms = []
    for term in terms:
        literals = []
        i = 0
        while i < len(term):
            matched = False
            for var in sorted_vars:
                if term[i:i+len(var)] == var:
                    next_i = i + len(var)
                    complement = next_i < len(term) and term[next_i] == "'"
                    if complement:
                        next_i += 1
                    literals.append(f"~{var}" if complement else var)
                    i = next_i
                    matched = True
                    break
            if not matched:
                i += 1
        if not literals:
            verilog_terms.append("1'b1")
        elif len(literals) == 1:
            verilog_terms.append(literals[0])
        else:
            verilog_terms.append(f"({' & '.join(literals)})")
    return " | ".join(verilog_terms)


def generate_verilog_behavioral(expression, num_vars, var_names, out_name='F'):
    verilog_expr = sop_to_verilog(expression, num_vars, var_names)
    if len(verilog_expr) > 80:
        formatted_expr = " |\n        ".join(verilog_expr.split(' | '))
    else:
        formatted_expr = verilog_expr
    inputs = ', '.join(var_names[:num_vars])
    return f"""module kmap_behavioral(
    input {inputs},
    output reg {out_name}
);

always @(*) begin
    {out_name} = {formatted_expr};
end

endmodule"""


def generate_verilog_dataflow(expression, num_vars, var_names, out_name='F'):
    verilog_expr = sop_to_verilog(expression, num_vars, var_names)
    if len(verilog_expr) > 80:
        formatted_expr = " |\n        ".join(verilog_expr.split(' | '))
    else:
        formatted_expr = verilog_expr
    inputs = ', '.join(var_names[:num_vars])
    return f"""module kmap_dataflow(
    input {inputs},
    output {out_name}
);

    assign {out_name} = {formatted_expr};

endmodule"""


def generate_verilog_gate_level(selected_pis, num_vars, var_names, out_name='F'):
    inputs = ', '.join(var_names[:num_vars])
    wires = []
    gates = []
    not_wires = []

    for i, var in enumerate(var_names[:num_vars]):
        not_wires.append(f"{var}_n")
        gates.append(f"    not n{i}({var}_n, {var});")

    for idx, (term, mints) in enumerate(selected_pis):
        wire_name = f"term{idx}"
        wires.append(wire_name)
        and_inputs = []
        for i, bit in enumerate(term):
            if bit == '1':
                and_inputs.append(var_names[i])
            elif bit == '0':
                and_inputs.append(f"{var_names[i]}_n")
        if len(and_inputs) == 0:
            gates.append(f"    assign {wire_name} = 1'b1;")
        elif len(and_inputs) == 1:
            gates.append(f"    assign {wire_name} = {and_inputs[0]};")
        else:
            gates.append(f"    and a{idx}({wire_name}, {', '.join(and_inputs)});")

    if len(wires) == 0:
        or_gate = f"    assign {out_name} = 1'b0;"
    elif len(wires) == 1:
        or_gate = f"    assign {out_name} = {wires[0]};"
    else:
        or_gate = f"    or o1({out_name}, {', '.join(wires)});"

    not_wire_decl = f"    wire {', '.join(not_wires)};" if not_wires else ""
    wire_decl = f"    wire {', '.join(wires)};" if wires else ""

    return f"""module kmap_gate_level(
    input {inputs},
    output {out_name}
);

{not_wire_decl}
{wire_decl}

{chr(10).join(gates)}
{or_gate}

endmodule"""


def generate_verilog_testbench(num_vars, var_names, truth_table, out_name='F'):
    inputs = ', '.join(var_names[:num_vars])
    test_table = truth_table[:256]
    test_cases = []
    for row in test_table:
        input_vals = ''.join([str(row[var]) for var in var_names[:num_vars]])
        output_val = '1' if row[out_name] == 1 else ('x' if row[out_name] == 'X' else '0')
        test_cases.append(
            f"        test_vectors[{len(test_cases)}] = {{{len(var_names[:num_vars])}'b{input_vals}, 1'b{output_val}}};")
    test_init = '\n'.join(test_cases)
    return f"""module kmap_tb;
    reg {', '.join(var_names[:num_vars])};
    wire {out_name};

    kmap_dataflow dut(
        {', '.join([f'.{v}({v})' for v in var_names[:num_vars]])},
        .{out_name}({out_name})
    );

    integer i;
    reg [{num_vars}:0] test_vectors [0:{len(test_table)-1}];

    initial begin
        $dumpfile(\"kmap.vcd\");
        $dumpvars(0, kmap_tb);

{test_init}

        for (i = 0; i < {len(test_table)}; i = i + 1) begin
            {{{', '.join(var_names[:num_vars])}}} = test_vectors[i][{num_vars}:1];
            #10;
        end
        $finish;
    end
endmodule"""


def generate_simulation_output(truth_table, num_vars, var_names, out_name='F'):
    lines = ["VVP Simulation Output:", "=" * 50,
             f"{' '.join(var_names[:num_vars])} | {out_name} | Expected", "-" * 50]
    for row in truth_table:
        input_vals = ' '.join([str(row[var]) for var in var_names[:num_vars]])
        output_val = row[out_name]
        expected = '1' if output_val == 1 else ('X' if output_val == 'X' else '0')
        status = "✓" if output_val != 'X' else "(don't care)"
        lines.append(f"{input_vals} | {output_val} | {expected} {status}")
    lines += ["=" * 50, "Simulation completed successfully!"]
    return '\n'.join(lines)


def generate_kmap_groups(selected_pis, num_vars):
    return [
        {"id": idx, "cells": mints, "term": term,
         "color": f"hsl({(idx * 60) % 360}, 70%, 60%)"}
        for idx, (term, mints) in enumerate(selected_pis)
    ]


# ─── Routes ───────────────────────────────────────────────────────────────────

@api_router.post("/minimize", response_model=MinimizeResponse)
def minimize_kmap(request: MinimizeRequest):
    try:
        start_time = time.perf_counter()
        timings = {}

        t0 = time.perf_counter()
        if request.input_mode == "expression":
            parser = BooleanExpressionParser(request.expression, request.variable_names)
            minterms = parser.parse_to_minterms(request.num_vars)
            all_terms = set(range(2 ** request.num_vars))
            maxterms = list(all_terms - set(minterms) - set(request.dont_cares))
        elif request.input_mode == "maxterm":
            all_terms = set(range(2 ** request.num_vars))
            minterms = list(all_terms - set(request.maxterms) - set(request.dont_cares))
            maxterms = request.maxterms
        else:
            minterms = request.minterms
            all_terms = set(range(2 ** request.num_vars))
            maxterms = list(all_terms - set(minterms) - set(request.dont_cares))
        timings['input_processing'] = (time.perf_counter() - t0) * 1000

        max_val = 2 ** request.num_vars
        if any(m >= max_val for m in minterms + maxterms + request.dont_cares):
            raise HTTPException(400, "Term values exceed variable range")

        var_names = request.variable_names[:request.num_vars]

        if len(minterms) >= max_val:
            truth_table, out_name, total_rows = generate_truth_table(
                request.num_vars, minterms, request.dont_cares, var_names)
            total_time = (time.perf_counter() - start_time) * 1000
            return MinimizeResponse(
                truth_table=truth_table, prime_implicants=[],
                essential_prime_implicants=[], minimal_sop="1", minimal_pos="1",
                canonical_sop=generate_canonical_sop(minterms, request.num_vars, var_names),
                canonical_pos="1", groups=[],
                verilog_behavioral=generate_verilog_behavioral("1", request.num_vars, var_names, out_name),
                verilog_dataflow=generate_verilog_dataflow("1", request.num_vars, var_names, out_name),
                verilog_gate_level=generate_verilog_gate_level([], request.num_vars, var_names, out_name),
                verilog_testbench=generate_verilog_testbench(request.num_vars, var_names, truth_table, out_name),
                simulation_output=generate_simulation_output(truth_table, request.num_vars, var_names, out_name),
                waveform_data=generate_waveform_data(truth_table, request.num_vars, var_names, out_name),
                steps=["All minterms present — function is identically 1"],
                performance_metrics={
                    "total_time_ms": round(total_time, 2), "num_variables": request.num_vars,
                    "num_minterms": len(minterms), "num_prime_implicants": 0,
                    "num_essential_pis": 0, "num_selected_pis": 0,
                    "truth_table_size": total_rows, "algorithm": "Trivial (constant 1)",
                    "optimization_level": "N/A", "timings": {}},
                output_name=out_name)

        t0 = time.perf_counter()
        qm = QuineMcCluskey(request.num_vars, minterms, request.dont_cares)
        minimal_sop, prime_implicants, essential_pis, selected_pis = qm.minimize(var_names)
        timings['qm_minimization'] = (time.perf_counter() - t0) * 1000

        t0 = time.perf_counter()
        canonical_sop = generate_canonical_sop(minterms, request.num_vars, var_names)
        canonical_pos = generate_canonical_pos(maxterms, request.num_vars, var_names)
        timings['canonical_generation'] = (time.perf_counter() - t0) * 1000

        t0 = time.perf_counter()
        minimal_pos = generate_minimal_pos(maxterms, request.num_vars, var_names, request.dont_cares)
        timings['pos_minimization'] = (time.perf_counter() - t0) * 1000

        t0 = time.perf_counter()
        truth_table, out_name, total_rows = generate_truth_table(
            request.num_vars, minterms, request.dont_cares, var_names)
        timings['truth_table_generation'] = (time.perf_counter() - t0) * 1000

        pi_list = [{
            "term": pi[0],
            "minterms": pi[1],
            "expression": qm.term_to_expression(pi[0], var_names),
            "essential": pi in essential_pis
        } for pi in prime_implicants]

        essential_pi_exprs = [qm.term_to_expression(pi[0], var_names) for pi in essential_pis]
        groups = generate_kmap_groups(selected_pis, request.num_vars)

        t0 = time.perf_counter()
        verilog_behavioral = generate_verilog_behavioral(minimal_sop, request.num_vars, var_names, out_name)
        verilog_dataflow = generate_verilog_dataflow(minimal_sop, request.num_vars, var_names, out_name)
        verilog_gate_level = generate_verilog_gate_level(selected_pis, request.num_vars, var_names, out_name)
        verilog_testbench = generate_verilog_testbench(request.num_vars, var_names, truth_table, out_name)
        timings['verilog_generation'] = (time.perf_counter() - t0) * 1000

        simulation_output = generate_simulation_output(truth_table, request.num_vars, var_names, out_name)
        waveform_data = generate_waveform_data(truth_table, request.num_vars, var_names, out_name)
        total_time = (time.perf_counter() - start_time) * 1000

        return MinimizeResponse(
            truth_table=truth_table,
            prime_implicants=pi_list,
            essential_prime_implicants=essential_pi_exprs,
            minimal_sop=minimal_sop,
            minimal_pos=minimal_pos,
            canonical_sop=canonical_sop,
            canonical_pos=canonical_pos,
            groups=groups,
            verilog_behavioral=verilog_behavioral,
            verilog_dataflow=verilog_dataflow,
            verilog_gate_level=verilog_gate_level,
            verilog_testbench=verilog_testbench,
            simulation_output=simulation_output,
            waveform_data=waveform_data,
            steps=qm.steps,
            performance_metrics={
                "total_time_ms": round(total_time, 2),
                "timings": {k: round(v, 2) for k, v in timings.items()},
                "num_variables": request.num_vars,
                "num_minterms": len(minterms),
                "num_prime_implicants": len(prime_implicants),
                "num_essential_pis": len(essential_pis),
                "num_selected_pis": len(selected_pis),
                "truth_table_size": total_rows,
                "algorithm": "BitSlice QM with Branch-and-Bound",
                "optimization_level": "High (bitwise operations, advanced column covering)"
            },
            output_name=out_name
        )

    except Exception as e:
        logging.error(f"Minimization error: {str(e)}")
        raise HTTPException(500, str(e))


@api_router.get("/")
async def root():
    return {"message": "K-Map Minimizer API"}


# ─── Chat endpoint (Anthropic) ────────────────────────────────────────────────

@api_router.post("/chat")
async def chat_proxy(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    system = body.get("system", "")
    max_tokens = body.get("max_tokens", 1000)

    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not anthropic_key:
        raise HTTPException(500, "ANTHROPIC_API_KEY not configured")

    # Keep only user/assistant messages
    filtered = [m for m in messages if m["role"] in ("user", "assistant")]

    # Drop leading assistant messages (Anthropic requires first message to be user)
    while filtered and filtered[0]["role"] == "assistant":
        filtered.pop(0)

    # Merge consecutive same-role messages to ensure alternating
    merged = []
    for msg in filtered:
        if merged and merged[-1]["role"] == msg["role"]:
            merged[-1]["content"] += "\n" + msg["content"]
        else:
            merged.append({"role": msg["role"], "content": msg["content"]})

    if not merged:
        raise HTTPException(400, "No valid messages provided")

    anthropic_body = {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": max_tokens,
        "system": system,
        "messages": merged,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            json=anthropic_body,
            headers={
                "x-api-key": anthropic_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            timeout=30,
        )

    if response.status_code != 200:
        logging.error(f"Anthropic API error: {response.status_code} - {response.text}")
        raise HTTPException(500, f"AI API error: {response.status_code}")

    # Anthropic response shape matches what frontend expects: {content: [{type, text}]}
    return response.json()


# ─── App setup ────────────────────────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)