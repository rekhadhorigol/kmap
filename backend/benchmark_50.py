"""
Comprehensive Benchmark: 50 diverse K-Map minimization test cases.
Tests correctness (accuracy) and performance across 3-15 variables,
with/without don't-cares, varying minterm densities, and edge cases.
"""

import sys
import os
import time
import random
import json

# Add parent dir so we can import from server
sys.path.insert(0, os.path.dirname(__file__))

from server import BitSliceQuineMcCluskey

VAR_NAMES = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O"]

def verify_correctness(num_vars, minterms, dont_cares, selected_pis_compat):
    """
    Verify that the minimized expression covers ALL required minterms
    and does NOT cover any term that is not a minterm or don't-care.
    Returns (all_covered, no_extra, details)
    """
    minterm_set = set(minterms)
    dc_set = set(dont_cares)
    allowed = minterm_set | dc_set

    # Reconstruct which minterms are covered by selected PIs
    covered = set()
    for binary_str, mint_list in selected_pis_compat:
        for m in mint_list:
            covered.add(m)

    # Check 1: All minterms covered
    uncovered = minterm_set - covered
    all_covered = len(uncovered) == 0

    # Check 2: No extra terms outside allowed set
    extra = covered - allowed
    no_extra = len(extra) == 0

    return all_covered, no_extra, uncovered, extra


def run_single_test(test_id, description, num_vars, minterms, dont_cares, category):
    """Run a single test case and return results dict."""
    var_names = VAR_NAMES[:num_vars]
    max_val = 2 ** num_vars

    # Time the minimization
    start = time.perf_counter()
    qm = BitSliceQuineMcCluskey(num_vars, minterms, dont_cares)
    expression, pi_list, essential_compat, selected_compat = qm.minimize(var_names)
    elapsed_ms = (time.perf_counter() - start) * 1000

    # Verify correctness
    all_covered, no_extra, uncovered, extra = verify_correctness(
        num_vars, minterms, dont_cares, selected_compat
    )

    accurate = all_covered and no_extra

    return {
        "id": test_id,
        "description": description,
        "category": category,
        "num_vars": num_vars,
        "total_minterms": len(minterms),
        "total_dont_cares": len(dont_cares),
        "search_space": max_val,
        "num_prime_implicants": len(pi_list),
        "num_essential_pis": len(essential_compat),
        "num_selected_pis": len(selected_compat),
        "minimal_expression": expression,
        "time_ms": round(elapsed_ms, 4),
        "accurate": accurate,
        "all_minterms_covered": all_covered,
        "no_extra_terms": no_extra,
        "uncovered_count": len(uncovered),
        "extra_count": len(extra),
    }


# DEFINE 50 TEST CASES
TEST_CASES = []

# --- Category 1: Small / Classic (3-4 vars) ---
TEST_CASES.append(("Classic 3-var SOP", 3, [0, 2, 5, 7], [], "3-var Classic"))
TEST_CASES.append(("Classic 4-var textbook", 4, [0,1,2,5,6,7,8,9,14], [], "4-var Classic"))
TEST_CASES.append(("3-var with don't-cares", 3, [1,3,5,7], [0,2], "3-var Don't-Care"))
TEST_CASES.append(("4-var with don't-cares", 4, [0,1,2,5,6,7,8,9,14], [3,11], "4-var Don't-Care"))
TEST_CASES.append(("3-var all minterms (F=1)", 3, list(range(8)), [], "Edge Case"))
TEST_CASES.append(("3-var single minterm", 3, [5], [], "Edge Case"))
TEST_CASES.append(("3-var empty (F=0)", 3, [], [], "Edge Case"))
TEST_CASES.append(("4-var adjacent pairs", 4, [0,1,4,5,8,9,12,13], [], "4-var Classic"))
TEST_CASES.append(("4-var checkerboard", 4, [0,3,5,6,9,10,12,15], [], "4-var Classic"))
TEST_CASES.append(("4-var half minterms", 4, [0,1,2,3,4,5,6,7], [], "4-var Classic"))

# --- Category 2: Medium (5-6 vars) ---
TEST_CASES.append(("5-var random sparse", 5, [1,5,11,17,23,29,31], [], "5-var"))
TEST_CASES.append(("5-var random dense", 5, [0,1,2,3,4,5,8,9,10,11,16,17,18,19,24,25,26,27], [], "5-var"))
TEST_CASES.append(("5-var with don't-cares", 5, [0,2,4,8,16,3,5,10,20], [1,6,7,12], "5-var Don't-Care"))
TEST_CASES.append(("6-var sparse", 6, [0,7,14,21,28,35,42,49,56,63], [], "6-var"))
TEST_CASES.append(("6-var medium density", 6, list(range(0,64,2)) + [1,3,5], [], "6-var"))
TEST_CASES.append(("6-var with don't-cares", 6, [0,1,2,3,8,9,10,11,32,33,34,35,40,41], [4,5,12,13,36,37,44,45], "6-var Don't-Care"))
TEST_CASES.append(("5-var all minterms", 5, list(range(32)), [], "Edge Case"))
TEST_CASES.append(("6-var single minterm", 6, [42], [], "Edge Case"))

# --- Category 3: Larger (7-8 vars) ---
random.seed(42)  # Reproducibility
TEST_CASES.append(("7-var 20 minterms", 7, sorted(random.sample(range(128), 20)), [], "7-var"))
random.seed(43)
TEST_CASES.append(("7-var 50 minterms", 7, sorted(random.sample(range(128), 50)), [], "7-var"))
random.seed(44)
TEST_CASES.append(("7-var 30 + 10 DC", 7, sorted(random.sample(range(128), 30)), sorted(random.sample(list(set(range(128)) - set(random.sample(range(128), 30))), 10)), "7-var Don't-Care"))

random.seed(45)
TEST_CASES.append(("8-var 40 minterms", 8, sorted(random.sample(range(256), 40)), [], "8-var"))
random.seed(46)
TEST_CASES.append(("8-var 80 minterms", 8, sorted(random.sample(range(256), 80)), [], "8-var"))
random.seed(47)
m8 = sorted(random.sample(range(256), 60))
random.seed(48)
dc8 = sorted(random.sample(list(set(range(256)) - set(m8)), 20))
TEST_CASES.append(("8-var 60 + 20 DC", 8, m8, dc8, "8-var Don't-Care"))
random.seed(49)
TEST_CASES.append(("8-var 120 dense", 8, sorted(random.sample(range(256), 120)), [], "8-var"))

# --- Category 4: Large (9-10 vars) ---
random.seed(50)
TEST_CASES.append(("9-var 50 minterms", 9, sorted(random.sample(range(512), 50)), [], "9-var"))
random.seed(51)
TEST_CASES.append(("9-var 100 minterms", 9, sorted(random.sample(range(512), 100)), [], "9-var"))
random.seed(52)
m9 = sorted(random.sample(range(512), 80))
random.seed(53)
dc9 = sorted(random.sample(list(set(range(512)) - set(m9)), 30))
TEST_CASES.append(("9-var 80 + 30 DC", 9, m9, dc9, "9-var Don't-Care"))

random.seed(54)
TEST_CASES.append(("10-var 60 minterms", 10, sorted(random.sample(range(1024), 60)), [], "10-var"))
random.seed(55)
TEST_CASES.append(("10-var 150 minterms", 10, sorted(random.sample(range(1024), 150)), [], "10-var"))
random.seed(56)
TEST_CASES.append(("10-var 200 minterms", 10, sorted(random.sample(range(1024), 200)), [], "10-var"))
random.seed(57)
m10 = sorted(random.sample(range(1024), 120))
random.seed(58)
dc10 = sorted(random.sample(list(set(range(1024)) - set(m10)), 40))
TEST_CASES.append(("10-var 120 + 40 DC", 10, m10, dc10, "10-var Don't-Care"))

# --- Category 5: Very Large (11-13 vars) ---
random.seed(59)
TEST_CASES.append(("11-var 100 minterms", 11, sorted(random.sample(range(2048), 100)), [], "11-var"))
random.seed(60)
TEST_CASES.append(("11-var 300 minterms", 11, sorted(random.sample(range(2048), 300)), [], "11-var"))
random.seed(61)
m11 = sorted(random.sample(range(2048), 200))
random.seed(62)
dc11 = sorted(random.sample(list(set(range(2048)) - set(m11)), 60))
TEST_CASES.append(("11-var 200 + 60 DC", 11, m11, dc11, "11-var Don't-Care"))

random.seed(63)
TEST_CASES.append(("12-var 150 minterms", 12, sorted(random.sample(range(4096), 150)), [], "12-var"))
random.seed(64)
TEST_CASES.append(("12-var 400 minterms", 12, sorted(random.sample(range(4096), 400)), [], "12-var"))
random.seed(65)
m12 = sorted(random.sample(range(4096), 300))
random.seed(66)
dc12 = sorted(random.sample(list(set(range(4096)) - set(m12)), 80))
TEST_CASES.append(("12-var 300 + 80 DC", 12, m12, dc12, "12-var Don't-Care"))

random.seed(67)
TEST_CASES.append(("13-var 200 minterms", 13, sorted(random.sample(range(8192), 200)), [], "13-var"))
random.seed(68)
TEST_CASES.append(("13-var 500 minterms", 13, sorted(random.sample(range(8192), 500)), [], "13-var"))

# --- Category 6: Extreme (14-15 vars) ---
random.seed(69)
TEST_CASES.append(("14-var 300 minterms", 14, sorted(random.sample(range(16384), 300)), [], "14-var"))
random.seed(70)
TEST_CASES.append(("14-var 600 minterms", 14, sorted(random.sample(range(16384), 600)), [], "14-var"))
random.seed(71)
m14 = sorted(random.sample(range(16384), 400))
random.seed(72)
dc14 = sorted(random.sample(list(set(range(16384)) - set(m14)), 100))
TEST_CASES.append(("14-var 400 + 100 DC", 14, m14, dc14, "14-var Don't-Care"))

random.seed(73)
TEST_CASES.append(("15-var 500 minterms", 15, sorted(random.sample(range(32768), 500)), [], "15-var"))
random.seed(74)
TEST_CASES.append(("15-var 1000 minterms", 15, sorted(random.sample(range(32768), 1000)), [], "15-var"))

# --- Category 7: Special patterns ---
TEST_CASES.append(("4-var XOR pattern", 4, [i for i in range(16) if bin(i).count('1') % 2 == 1], [], "Special Pattern"))
TEST_CASES.append(("6-var all evens", 6, list(range(0,64,2)), [], "Special Pattern"))
TEST_CASES.append(("4-var all ones count=2", 4, [i for i in range(16) if bin(i).count('1') == 2], [], "Special Pattern"))
random.seed(75)
m13dc = sorted(random.sample(range(8192), 300))
random.seed(76)
dc13 = sorted(random.sample(list(set(range(8192)) - set(m13dc)), 80))
TEST_CASES.append(("13-var 300 + 80 DC", 13, m13dc, dc13, "13-var Don't-Care"))
random.seed(77)
TEST_CASES.append(("15-var 750 + 50 DC", 15, sorted(random.sample(range(32768), 750)), sorted(random.sample(list(set(range(32768)) - set(random.sample(range(32768), 750))), 50)), "15-var Don't-Care"))


# RUN ALL TESTS
def main():
    print("=" * 120)
    print("K-MAP MINIMIZER COMPREHENSIVE BENCHMARK - 50 TEST CASES")
    print("Algorithm: BitSlice Quine-McCluskey with Branch-and-Bound Covering")
    print("=" * 120)
    print()

    results = []
    passed = 0
    failed = 0

    for idx, (desc, num_vars, minterms, dont_cares, category) in enumerate(TEST_CASES, 1):
        print(f"  Running test {idx:2d}/50: {desc:35s} ({num_vars:2d} vars, {len(minterms):5d} minterms, {len(dont_cares):4d} DCs) ... ", end="", flush=True)

        try:
            result = run_single_test(idx, desc, num_vars, minterms, dont_cares, category)
            results.append(result)

            status = "PASS" if result["accurate"] else "FAIL"
            if result["accurate"]:
                passed += 1
            else:
                failed += 1
            print(f"{status}  {result['time_ms']:10.4f} ms  |  PIs: {result['num_prime_implicants']:4d}  Essential: {result['num_essential_pis']:4d}  Selected: {result['num_selected_pis']:4d}")
        except Exception as e:
            failed += 1
            print(f"ERROR: {e}")
            results.append({
                "id": idx, "description": desc, "category": category,
                "num_vars": num_vars, "total_minterms": len(minterms),
                "total_dont_cares": len(dont_cares), "search_space": 2**num_vars,
                "num_prime_implicants": 0, "num_essential_pis": 0, "num_selected_pis": 0,
                "minimal_expression": f"ERROR: {e}", "time_ms": 0,
                "accurate": False, "all_minterms_covered": False, "no_extra_terms": False,
                "uncovered_count": -1, "extra_count": -1,
            })

    # PRINT RESULTS TABLE
    print()
    print("=" * 170)
    print(f"{'#':>3} | {'Description':35s} | {'Cat':18s} | {'Vars':>4} | {'Mints':>6} | {'DCs':>4} | {'Space':>7} | {'PIs':>5} | {'Ess.':>4} | {'Sel.':>4} | {'Time(ms)':>10} | {'Status':>6} | Minimal Expression")
    print("-" * 170)

    for r in results:
        status = "PASS" if r["accurate"] else "FAIL"
        expr_display = r["minimal_expression"][:50] + ("..." if len(r["minimal_expression"]) > 50 else "")
        print(f"{r['id']:3d} | {r['description']:35s} | {r['category']:18s} | {r['num_vars']:4d} | {r['total_minterms']:6d} | {r['total_dont_cares']:4d} | {r['search_space']:7d} | {r['num_prime_implicants']:5d} | {r['num_essential_pis']:4d} | {r['num_selected_pis']:4d} | {r['time_ms']:10.4f} | {status:>6} | {expr_display}")

    # SUMMARY STATISTICS
    print()
    print("=" * 120)
    print("SUMMARY STATISTICS")
    print("=" * 120)

    times = [r["time_ms"] for r in results if r["time_ms"] > 0]
    total_time = sum(times)
    avg_time = total_time / len(times) if times else 0
    min_time = min(times) if times else 0
    max_time = max(times) if times else 0
    median_time = sorted(times)[len(times) // 2] if times else 0

    print(f"  Total tests:          {len(results)}")
    print(f"  Passed:               {passed}")
    print(f"  Failed:               {failed}")
    print(f"  Accuracy:             {(passed / len(results)) * 100:.1f}%")
    print()
    print(f"  Total time:           {total_time:.4f} ms")
    print(f"  Average time:         {avg_time:.4f} ms")
    print(f"  Median time:          {median_time:.4f} ms")
    print(f"  Min time:             {min_time:.4f} ms")
    print(f"  Max time:             {max_time:.4f} ms")
    print()

    # Per-category breakdown
    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"times": [], "passed": 0, "total": 0}
        categories[cat]["total"] += 1
        if r["accurate"]:
            categories[cat]["passed"] += 1
        if r["time_ms"] > 0:
            categories[cat]["times"].append(r["time_ms"])

    print(f"  {'Category':22s} | {'Tests':>5} | {'Pass':>4} | {'Acc%':>6} | {'Avg(ms)':>10} | {'Min(ms)':>10} | {'Max(ms)':>10}")
    print(f"  {'-'*22}-+-{'-'*5}-+-{'-'*4}-+-{'-'*6}-+-{'-'*10}-+-{'-'*10}-+-{'-'*10}")

    for cat in sorted(categories.keys()):
        c = categories[cat]
        t = c["times"]
        avg = sum(t)/len(t) if t else 0
        mn = min(t) if t else 0
        mx = max(t) if t else 0
        acc = (c["passed"]/c["total"])*100 if c["total"] else 0
        print(f"  {cat:22s} | {c['total']:5d} | {c['passed']:4d} | {acc:5.1f}% | {avg:10.4f} | {mn:10.4f} | {mx:10.4f}")

    # Variable count breakdown
    print()
    print(f"  {'Var Count':>12} | {'Tests':>5} | {'Avg Time(ms)':>12} | {'Avg PIs':>8} | {'Avg Selected':>12}")
    print(f"  {'-'*12}-+-{'-'*5}-+-{'-'*12}-+-{'-'*8}-+-{'-'*12}")
    var_groups = {}
    for r in results:
        nv = r["num_vars"]
        if nv not in var_groups:
            var_groups[nv] = {"times": [], "pis": [], "selected": []}
        var_groups[nv]["times"].append(r["time_ms"])
        var_groups[nv]["pis"].append(r["num_prime_implicants"])
        var_groups[nv]["selected"].append(r["num_selected_pis"])

    for nv in sorted(var_groups.keys()):
        g = var_groups[nv]
        print(f"  {nv:12d} | {len(g['times']):5d} | {sum(g['times'])/len(g['times']):12.4f} | {sum(g['pis'])/len(g['pis']):8.1f} | {sum(g['selected'])/len(g['selected']):12.1f}")

    print()
    print("=" * 120)
    print("BENCHMARK COMPLETE")
    print("=" * 120)

    # Save raw results to JSON
    with open(os.path.join(os.path.dirname(__file__), "benchmark_results.json"), "w") as f:
        json.dump({
            "test_results": results,
            "summary": {
                "total_tests": len(results),
                "passed": passed,
                "failed": failed,
                "accuracy_pct": round((passed / len(results)) * 100, 1),
                "total_time_ms": round(total_time, 4),
                "avg_time_ms": round(avg_time, 4),
                "median_time_ms": round(median_time, 4),
                "min_time_ms": round(min_time, 4),
                "max_time_ms": round(max_time, 4),
            }
        }, f, indent=2)
    print(f"\nResults saved to benchmark_results.json")


if __name__ == "__main__":
    main()
