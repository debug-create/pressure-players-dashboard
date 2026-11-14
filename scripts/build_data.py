"""Build the public dashboard data from the audited Phase 3 result files."""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parents[1] / "data.json"


def read(name):
    with (ROOT / "p3" / "results" / name).open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def number(value):
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


result = {}
for role, suffix in (("batters", "batter"), ("bowlers", "bowler")):
    final = read(f"FINAL3_TOP10_{role}.csv")
    cards = {row["id"]: row for row in read(f"w5_cards_{suffix}.csv")}
    players = []
    for row in final:
        card = cards[row["id"]]
        players.append({
            "rank": int(row["rank"]),
            "id": row["id"],
            "name": row["name"],
            "teams": row["teams"],
            "rating": number(row["rating"]) * 1000,
            "low": number(row["ci80_low"]) * 1000,
            "high": number(row["ci80_high"]) * 1000,
            "balls": int(number(row["pressure_balls"])),
            "matches": int(number(row["pressure_matches"])),
            "e0Rank": int(row["E0_rank"]),
            "top10Probability": number(row["P_top10"]),
            "methodsTop10": int(row["n_methods_in_top10"]),
            "pressureRate": number(card["E1_pressure"]) * 1000,
            "normalRate": number(card["E1_normal"]) * 1000,
            "pressureBetterProbability": number(card["P_D_gt0"]),
            "leaveBestRank": int(card["leave_best_rank"]),
            "survivesBest": card["survives_leave_best_top10"] == "True",
            "consistent": card["IPL_T20I_consistent"] == "True",
            "positiveShare": number(card["share_positive_matches"]),
            "pressureContext": json.loads(card["pressure_context"]),
            "normalContext": json.loads(card["normal_context"]),
            "splits": json.loads(card["splits"]),
            "top3": json.loads(card["top3"]),
        })
    result[role] = players

OUT.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"Wrote {OUT} with {sum(map(len, result.values()))} players")
