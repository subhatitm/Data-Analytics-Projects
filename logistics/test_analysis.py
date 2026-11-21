import csv
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

from build import HERE, build

SITE = HERE.parent / "dist" / "logistics"


class DeliveryTests(unittest.TestCase):
    def test_boundary_dates_and_stage_eligibility(self):
        with tempfile.TemporaryDirectory() as folder:
            raw = Path(folder)
            with (raw / "olist_customers_dataset.csv").open("w", newline="") as f:
                csv.writer(f).writerows([["customer_id", "customer_state"], ["cust", "RJ"]])
            with (raw / "olist_orders_dataset.csv").open("w", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(["order_id", "customer_id", "order_status", "order_purchase_timestamp",
                                 "order_delivered_carrier_date", "order_delivered_customer_date", "order_estimated_delivery_date"])
                def add(key, purchase, handoff, receipt, status="delivered"):
                    writer.writerow([key, "cust", status, purchase, handoff, receipt, "2018-08-31"])
                add("on_time", "2018-08-20", "2018-08-22", "2018-08-31 23:59:59")
                add("late", "2018-08-25", "2018-08-14", "2018-09-03")
                add("missing", "2018-08-25", "", "")
                add("cancelled", "2018-08-25", "", "", "canceled")
                add("outside", "2018-09-01", "", "")
            build(raw, raw)
            with (raw / "scorecard.csv").open() as f:
                row, = list(csv.DictReader(f))
            self.assertEqual([row[k] for k in ["orders","late","late_days","staged_orders"]], ["2","1","3","1"])
            counts = json.loads((raw / "audit.json").read_text())["counts"]
            self.assertEqual([counts[k] for k in ["purchase_cohort","non_delivered","delivered_excluded"]], [4,1,1])

    def test_published_findings_against_scorecard(self):
        db = sqlite3.connect(":memory:")
        db.execute("CREATE TABLE s(month,state,orders INT,late INT,late_days INT,staged INT,dispatch REAL,transit REAL)")
        with (SITE / "scorecard.csv").open() as f:
            rows = csv.reader(f)
            next(rows)
            db.executemany("INSERT INTO s VALUES (?,?,?,?,?,?,?,?)", rows)
        q = "SELECT sum(orders),sum(late),round(1.0*sum(late_days)/sum(late),1) FROM s"
        self.assertEqual(db.execute(q).fetchone(), (96203,6531,10.6))
        self.assertEqual(db.execute(q+" WHERE state='SP'").fetchone(), (40399,1817,8.3))
        self.assertEqual(db.execute(q+" WHERE state='RJ'").fetchone(), (12310,1495,13.5))
        peak = db.execute("SELECT month,sum(orders),sum(late) FROM s GROUP BY month ORDER BY sum(late)*1.0/sum(orders) DESC LIMIT 1").fetchone()
        self.assertEqual(peak, ("2018-03",7003,1328))
        audit = json.loads((SITE / "audit.json").read_text())["counts"]
        self.assertEqual(audit["source_orders"], 99441)
        self.assertEqual(audit["purchase_cohort"], audit["scored"] + audit["non_delivered"] + audit["delivered_excluded"])
        self.assertEqual(audit["stage_valid"], db.execute("SELECT sum(staged) FROM s").fetchone()[0])
        db.close()
