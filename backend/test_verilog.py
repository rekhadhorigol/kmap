"""Comprehensive verification of Verilog output, VVP simulation, and waveform data."""
import os
import time
import re
import sys

os.environ.setdefault("MONGO_URL", "")
os.environ.setdefault("DB_NAME", "test_db")

# Load server module
with open("server.py", "r") as f:
    source = f.read()

exec_ns = {"__name__": "__test__", "__builtins__": __builtins__, "__file__": os.path.join(os.getcwd(), "server.py")}
exec(compile(source, "server.py", "exec"), exec_ns)

QM = exec_ns["QuineMcCluskey"]
sop_to_verilog = exec_ns["sop_to_verilog"]
generate_verilog_behavioral = exec_ns["generate_verilog_behavioral"]
generate_verilog_dataflow = exec_ns["generate_verilog_dataflow"]
generate_verilog_gate_level = exec_ns["generate_verilog_gate_level"]
generate_verilog_testbench = exec_ns["generate_verilog_testbench"]
generate_simulation_output = exec_ns["generate_simulation_output"]
generate_waveform_data = exec_ns["generate_waveform_data"]
generate_truth_table = exec_ns["generate_truth_table"]
_output_name = exec_ns["_output_name"]

errors = []

test_cases = [
    {"name": "2var [1,3]", "nv": 2, "mints": [1, 3], "dcs": [], "vars": ["A", "B"]},
    {"name": "3var [0,2,5,7]", "nv": 3, "mints": [0, 2, 5, 7], "dcs": [], "vars": ["A", "B", "C"]},
    {"name": "4var [0,1,2,5,6,7,8,9,14]", "nv": 4, "mints": [0, 1, 2, 5, 6, 7, 8, 9, 14], "dcs": [], "vars": ["A", "B", "C", "D"]},
    {"name": "4var DC [4,8,10,11,12,15] dc=[9,14]", "nv": 4, "mints": [4, 8, 10, 11, 12, 15], "dcs": [9, 14], "vars": ["A", "B", "C", "D"]},
    {"name": "3var all", "nv": 3, "mints": list(range(8)), "dcs": [], "vars": ["A", "B", "C"]},
    {"name": "3var none", "nv": 3, "mints": [], "dcs": [], "vars": ["A", "B", "C"]},
    {"name": "3var single [5]", "nv": 3, "mints": [5], "dcs": [], "vars": ["A", "B", "C"]},
    {"name": "4var [0,2,8,10]", "nv": 4, "mints": [0, 2, 8, 10], "dcs": [], "vars": ["A", "B", "C", "D"]},
    {"name": "F-collision", "nv": 3, "mints": [1, 3, 5, 7], "dcs": [], "vars": ["F", "B", "C"]},
    {"name": "5var [0,1,4,5,16,17,20,21]", "nv": 5, "mints": [0, 1, 4, 5, 16, 17, 20, 21], "dcs": [], "vars": ["A", "B", "C", "D", "E"]},
    {"name": "2var [0]", "nv": 2, "mints": [0], "dcs": [], "vars": ["A", "B"]},
    {"name": "4var [15]", "nv": 4, "mints": [15], "dcs": [], "vars": ["A", "B", "C", "D"]},
]


def eval_verilog_expr(vexpr, nv, vn, var_vals):
    """Evaluate a Verilog-style expression with given variable values."""
    e = vexpr
    # Replace ~var with (not var_val) - longest names first
    sorted_vn = sorted(vn[:nv], key=len, reverse=True)
    for var in sorted_vn:
        e = e.replace(f"~{var}", f"(not {var_vals[var]})")
    for var in sorted_vn:
        e = re.sub(rf"(?<!\w){re.escape(var)}(?!\w)", str(var_vals[var]), e)
    e = e.replace("&", " and ")
    e = e.replace("|", " or ")
    e = e.replace("1'b0", "0").replace("1'b1", "1")
    try:
        return 1 if eval(e) else 0
    except Exception as ex:
        return -1


for tc in test_cases:
    name = tc["name"]
    nv = tc["nv"]
    mints = tc["mints"]
    dcs = tc["dcs"]
    vn = tc["vars"]
    mint_set = set(mints)

    print(f"=== {name} ===")

    # Run minimization
    qm = QM(nv, mints, dcs)
    expr, pis, epis, spis = qm.minimize(vn)
    print(f"  SOP: F = {expr}")

    # Truth table
    tt, out_name, total = generate_truth_table(nv, mints, dcs, vn)
    print(f"  Output name: {out_name}")

    # ---- 1. sop_to_verilog functional correctness ----
    verilog_expr = sop_to_verilog(expr, nv, vn)
    print(f"  Verilog expr: {verilog_expr}")

    dc_set = set(dcs)
    mismatches = 0
    for i in range(min(2 ** nv, 256)):
        binary = format(i, f"0{nv}b")
        var_vals = {vn[j]: int(binary[j]) for j in range(nv)}
        expected = 1 if i in mint_set else 0
        got = eval_verilog_expr(verilog_expr, nv, vn, var_vals)
        # Don't-cares can be 0 or 1 in the minimized expression
        if i in dc_set:
            continue
        if got != expected:
            mismatches += 1
            if mismatches <= 3:
                print(f"    MISMATCH m{i}: expected={expected}, got={got}, expr={verilog_expr}")
    if mismatches:
        errors.append(f"{name}: sop_to_verilog has {mismatches} mismatches")
        print(f"  FAIL: {mismatches} Verilog expression mismatches")
    else:
        print(f"  PASS: Verilog expr correct for all {min(2**nv, 256)} inputs")

    # ---- 2. Behavioral Verilog structure ----
    beh = generate_verilog_behavioral(expr, nv, vn, out_name)
    if "module kmap_behavioral" not in beh:
        errors.append(f"{name}: behavioral missing module declaration")
    if "always @(*)" not in beh and "always @" not in beh:
        errors.append(f"{name}: behavioral missing always block")
    if "endmodule" not in beh:
        errors.append(f"{name}: behavioral missing endmodule")

    # ---- 3. Dataflow Verilog structure ----
    df = generate_verilog_dataflow(expr, nv, vn, out_name)
    if "module kmap_dataflow" not in df:
        errors.append(f"{name}: dataflow missing module declaration")
    if f"assign {out_name}" not in df:
        errors.append(f"{name}: dataflow missing assign {out_name}")
    if "endmodule" not in df:
        errors.append(f"{name}: dataflow missing endmodule")

    # ---- 4. Gate-level Verilog structure ----
    gl = generate_verilog_gate_level(spis, nv, vn, out_name)
    if "module kmap_gate_level" not in gl:
        errors.append(f"{name}: gate-level missing module")
    if "endmodule" not in gl:
        errors.append(f"{name}: gate-level missing endmodule")

    # Verify gate-level has NOT gates for all variables
    for var in vn[:nv]:
        if f"{var}_n" not in gl:
            errors.append(f"{name}: gate-level missing NOT wire for {var}")

    # ---- 5. Testbench structure ----
    tb = generate_verilog_testbench(nv, vn, tt, out_name)
    if "module kmap_tb" not in tb:
        errors.append(f"{name}: testbench missing module")
    if "kmap_dataflow dut" not in tb:
        errors.append(f"{name}: testbench missing DUT")
    if "$finish" not in tb:
        errors.append(f"{name}: testbench missing $finish")
    if "$dumpfile" not in tb:
        errors.append(f"{name}: testbench missing $dumpfile")
    if "$dumpvars" not in tb:
        errors.append(f"{name}: testbench missing $dumpvars")

    # Verify test vector count matches truth table
    tv_count = tb.count("test_vectors[")
    # Each row appears twice: once in init, once is the loop `test_vectors[i]`
    init_count = len([line for line in tb.split("\n") if "test_vectors[" in line and "=" in line and "'b" in line])
    if init_count != len(tt):
        errors.append(f"{name}: testbench has {init_count} test vectors but truth table has {len(tt)} rows")

    # ---- 6. Waveform data consistency ----
    wf = generate_waveform_data(tt, nv, vn, out_name)
    expected_names = vn[:nv] + [out_name]
    if wf["signal_names"] != expected_names:
        errors.append(f"{name}: waveform signal_names={wf['signal_names']} expected={expected_names}")

    wf_mismatches = 0
    for t in range(min(wf["time_steps"], len(tt))):
        row = tt[t]
        for var in vn[:nv]:
            if wf["signals"][var][t] != row[var]:
                wf_mismatches += 1
        expected_out = 1 if row[out_name] == 1 else 0
        if wf["signals"][out_name][t] != expected_out:
            wf_mismatches += 1
    if wf_mismatches:
        errors.append(f"{name}: waveform has {wf_mismatches} mismatches with truth table")
        print(f"  FAIL: waveform {wf_mismatches} mismatches")
    else:
        print(f"  Waveform: OK ({wf['time_steps']} steps)")

    # ---- 7. Simulation output structure ----
    sim = generate_simulation_output(tt, nv, vn, out_name)
    if "VVP Simulation Output" not in sim:
        errors.append(f"{name}: sim output missing header")
    if "Simulation completed" not in sim:
        errors.append(f"{name}: sim output missing completion")
    # Count data lines (excluding header/footer)
    data_lines = [l for l in sim.split("\n") if "|" in l and "Expected" not in l and "---" not in l]
    if len(data_lines) != len(tt):
        errors.append(f"{name}: sim output has {len(data_lines)} data rows but truth table has {len(tt)}")

    # ---- 8. Output name collision check ----
    if "F" in vn[:nv]:
        if out_name == "F":
            errors.append(f"{name}: output name 'F' collides with input variable 'F'!")
            print(f"  BUG: Output name collision!")
        else:
            # Verify Verilog uses the correct non-colliding output name
            if f"output reg {out_name}" not in beh and f"output {out_name}" not in beh:
                errors.append(f"{name}: behavioral Verilog doesn't use correct output name '{out_name}'!")
                print(f"  BUG: Verilog doesn't use output name '{out_name}'!")
            else:
                print(f"  OK: Verilog correctly uses output name '{out_name}' to avoid F collision")

    print(f"  All checks done.")
    print()

# ===== SPECIAL: Detailed F-collision analysis =====
print("=== Detailed F-Collision Analysis ===")
vn_f = ["F", "B", "C"]
out_f = _output_name(vn_f, 3)
print(f"  _output_name(['F','B','C'], 3) = '{out_f}'")

qm_f = QM(3, [1, 3, 5, 7])
expr_f, _, _, spis_f = qm_f.minimize(vn_f)
print(f"  Expression: {expr_f}")

beh_f = generate_verilog_behavioral(expr_f, 3, vn_f, out_f)
df_f = generate_verilog_dataflow(expr_f, 3, vn_f, out_f)
gl_f = generate_verilog_gate_level(spis_f, 3, vn_f, out_f)
tb_f = generate_verilog_testbench(3, vn_f, generate_truth_table(3, [1, 3, 5, 7], [], vn_f)[0], out_f)

print(f"\n  --- Behavioral Verilog ---")
print(beh_f)
print(f"\n  --- Dataflow Verilog ---")
print(df_f)
print(f"\n  --- Gate-Level Verilog ---")
print(gl_f)
print(f"\n  --- Testbench (first 20 lines) ---")
for line in tb_f.split("\n")[:20]:
    print(f"  {line}")

# Check for F collision in port declarations
for code_name, code in [("behavioral", beh_f), ("dataflow", df_f), ("gate-level", gl_f)]:
    # Extract everything between first ( and first )
    m = re.search(r"module \w+\((.*?)\)", code, re.DOTALL)
    if m:
        ports = m.group(1)
        # Count how many times F appears as a port
        f_count = len(re.findall(r"\bF\b", ports))
        if f_count > 1:
            errors.append(f"F-collision in {code_name}: 'F' appears {f_count} times in port list")
            print(f"\n  BUG: {code_name} has 'F' {f_count} times in ports: {ports.strip()}")
        elif f_count == 1:
            # Check if it's input or output
            if "input" in ports and "F" in ports.split("input")[1].split("output")[0] if "output" in ports else "":
                pass  # Check more carefully
    # Simpler check: does the code have both "input F" and "output F" or "output reg F"?
    has_input_f = bool(re.search(r"input\b.*\bF\b", code))
    has_output_f = bool(re.search(r"output\b.*\bF\b", code))
    if has_input_f and has_output_f:
        errors.append(f"F-collision: {code_name} has F as both input AND output!")
        print(f"\n  CRITICAL BUG in {code_name}: F is both input AND output!")

print()
print("=" * 60)
if errors:
    print(f"FOUND {len(errors)} ISSUES:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
else:
    print("ALL VERILOG/VVP/WAVEFORM CHECKS PASSED")
print("=" * 60)
