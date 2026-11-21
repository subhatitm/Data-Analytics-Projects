# Delivery reliability in Brazilian e-commerce
**Independent logistics portfolio project · Subhatit Maity**

[Open the interactive dashboard](https://subhatitm.github.io/Data-Analytics-Projects/logistics/) · [Download the monthly state scorecard](../dist/logistics/scorecard.csv) · [Inspect the data audit](../dist/logistics/audit.json)

## Decision

Which destination warrants a delivery-reliability review first? The operations team has two different priorities: protecting the most customers and identifying destinations where a missed promise is unusually frequent. Count, rate and delay severity answer different parts of that decision.

| Destination | Delivered orders scored | Late orders | Late rate | Mean delay when late |
| --- | ---: | ---: | ---: | ---: |
| All destinations | 96,203 | 6,531 | 6.79% | 10.6 days |
| São Paulo | 40,399 | 1,817 | 4.50% | 8.3 days |
| Rio de Janeiro | 12,310 | 1,495 | 12.14% | 13.5 days |

São Paulo accounts for the largest count of misses. Rio de Janeiro has only 30% of São Paulo’s order volume, yet it has 82% as many late orders. Investigate Rio first for the combination of scale, risk and severity. Ceará also warrants monitoring: 176 of its 1,273 orders missed promise (13.83%). Always inspect counts alongside rates.

March 2018 had the highest monthly late rate, with 1,328 misses in 7,003 orders (18.96%). A network-wide average hides that time concentration. Across the period, average purchase-to-handoff time was 3.2 days and handoff-to-receipt time was 9.3 days for records with valid stage timestamps. A longer transit stage alone cannot establish that a carrier caused lateness.

## Proposed operational test

Review a stratified sample of Rio orders from the March purchase cohort and adjacent months. Request origin, carrier, service level, promise buffer and scan history. Compare misses across comparable lanes and service levels before changing a contract or extending delivery estimates. Track late-order rate, volume and mean delay in a pilot. A one-percentage-point reduction across 12,310 Rio orders corresponds to about 123 avoided misses at that volume. This is a scenario, not a measured saving.

## Source, grain and audit

Source: [Olist Brazilian E-Commerce Public Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce). The anonymized historical orders are from Olist’s Brazilian marketplaces. This is a public-data case study. It uses no employer or client records. Published aggregates are an adaptation under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); attribution belongs to Olist. Raw customer and order records are not distributed here.

1. Load orders and customers with primary keys. Join on order-specific customer ID. Joining to order items would duplicate multi-item orders unless aggregated first.
2. Use purchases from 1 January 2017 through 31 August 2018 (end exclusive 1 September). The fixed window omits sparse launch and tail months. Of 99,441 source orders, 99,092 were placed in the window.
3. Drop 2,881 non-delivered orders. Exclude 8 more delivered orders with unusable receipt, promise, destination or chronology. The resulting 96,203 orders form the reliability denominator. This conditional rate excludes unresolved orders and may flatter recent cohorts. A destination is a customer state, not an origin–destination lane.
4. Score late when the **receipt calendar date is after the estimated calendar date**. An evening receipt on the estimated date is on time. Average days late uses only late orders. Stage durations use fractional elapsed days and only the 96,018 orders whose handoff falls between purchase and delivery. No carrier identifiers or contractual SLA are available.
5. Aggregate by purchase month and destination state. For a filtered or total KPI, sum the numerators and denominators before dividing. Never average the state percentages directly.

## Reproduce

Requires Python 3.9+ with the standard SQLite module. Download and extract the two CSV files from the original dataset into one folder: `olist_orders_dataset.csv` and `olist_customers_dataset.csv`. From the repository root:

```sh
python logistics/build.py path/to/extracted/data
python -m unittest discover -s logistics -p 'test_*.py'
python -m http.server 8000 --directory dist
```

Open `http://localhost:8000/logistics/`. The build imports the source into SQLite, executes [analysis.sql](analysis.sql), validates the totals, and writes the static CSV and audit JSON. Compare the source SHA-256 values and regenerated outputs against the committed [audit](../dist/logistics/audit.json). The dashboard reads the same CSV that is available to download.

## Use the output in Excel or Power BI

Import `scorecard.csv` with **Data → From Text/CSV**. Keep `month` as text (YYYY-MM) and `state` as text. For a PivotTable use state as rows and the sums of orders, late and late_days as values. Divide summed late by summed orders for late rate, or summed late_days by summed late for severity. A zero-late group has undefined severity. For stage averages divide the relevant days sum by summed staged_orders. The coverage count differs from the main KPI denominator.

## Interview walkthrough

Explain the join grain, then compare São Paulo with Rio using the table above. Show how switching from late count to late rate changes the priority list, and why tiny groups need a volume check. Finish by distinguishing an observed association from a proposed operational test. The project does not establish employer results or realized savings.
