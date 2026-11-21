"""Rebuild the public, aggregate-only scorecard from the original Olist CSVs."""
import argparse
import csv
import hashlib
import json
import sqlite3
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_OUTPUT = HERE.parent / "dist" / "logistics"


def load(db, folder, table, fields):
    path = folder / f"olist_{table}_dataset.csv"
    with path.open(encoding="utf-8-sig", newline="") as src:
        rows = csv.DictReader(src)
        if not set(fields).issubset(rows.fieldnames or []):
            raise ValueError(f"Missing columns in {path.name}")
        db.execute(f"CREATE TABLE {table} ({fields[0]} TEXT PRIMARY KEY, " +
                   ", ".join(f"{name} TEXT" for name in fields[1:]) + ")")
        db.executemany(f"INSERT INTO {table} VALUES ({','.join('?' for _ in fields)})",
                       (tuple(row[k] or None for k in fields) for row in rows))
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(folder, output):
    db = sqlite3.connect(":memory:")
    db.row_factory = sqlite3.Row
    hashes = {}
    hashes["orders"] = load(db, folder, "orders", ["order_id", "customer_id", "order_status",
        "order_purchase_timestamp", "order_delivered_carrier_date", "order_delivered_customer_date",
        "order_estimated_delivery_date"])
    hashes["customers"] = load(db, folder, "customers", ["customer_id", "customer_state"])
    db.executescript((HERE / "analysis.sql").read_text())
    records = [dict(row) for row in db.execute("SELECT * FROM scorecard ORDER BY month, state")]
    if not records:
        raise ValueError("No eligible orders in the selected period")
    def count(query):
        return db.execute(query).fetchone()[0]
    audit = {
        "source_orders": count("SELECT count(*) FROM orders"),
        "source_customers": count("SELECT count(*) FROM customers"),
        "purchase_cohort": count("SELECT count(*) FROM cohort"),
        "non_delivered": count("SELECT count(*) FROM cohort WHERE order_status <> 'delivered' OR order_status IS NULL"),
        "scored": count("SELECT count(*) FROM scored"),
        "stage_valid": count("SELECT count(dispatch_days) FROM scored"),
    }
    audit["delivered_excluded"] = audit["purchase_cohort"] - audit["non_delivered"] - audit["scored"]
    assert sum(r["orders"] for r in records) == audit["scored"]
    assert sum(r["staged_orders"] for r in records) == audit["stage_valid"]
    assert all(0 <= r["late"] <= r["orders"] and r["late_days"] >= r["late"] for r in records)
    output.mkdir(parents=True, exist_ok=True)
    with (output / "scorecard.csv").open("w", newline="") as dest:
        writer = csv.DictWriter(dest, fieldnames=list(records[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(records)
    (output / "audit.json").write_text(json.dumps({"counts": audit, "sha256": hashes}, indent=2) + "\n")
    db.close()
    print(json.dumps(audit, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("data_dir", type=Path, help="Directory containing the two Olist CSV files")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    build(args.data_dir, args.output)
