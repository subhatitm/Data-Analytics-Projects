-- Grain: one row per order; the customer join is on the order-specific customer_id.
CREATE VIEW cohort AS
SELECT o.order_id, substr(o.order_purchase_timestamp, 1, 7) AS month,
       c.customer_state AS state, o.order_status,
       julianday(o.order_purchase_timestamp) AS purchased,
       julianday(o.order_delivered_carrier_date) AS handoff,
       julianday(o.order_delivered_customer_date) AS received,
       date(o.order_delivered_customer_date) AS received_day,
       date(o.order_estimated_delivery_date) AS promised_day
FROM orders o LEFT JOIN customers c USING (customer_id)
WHERE date(o.order_purchase_timestamp) >= '2017-01-01'
  AND date(o.order_purchase_timestamp) < '2018-09-01';

CREATE VIEW scored AS
SELECT *, CAST(julianday(received_day) - julianday(promised_day) AS INTEGER) AS days_vs_promise,
       CASE WHEN handoff BETWEEN purchased AND received THEN handoff - purchased END AS dispatch_days,
       CASE WHEN handoff BETWEEN purchased AND received THEN received - handoff END AS transit_days
FROM cohort
WHERE order_status = 'delivered' AND received >= purchased
  AND promised_day >= date(purchased) AND state IS NOT NULL;

CREATE VIEW scorecard AS
SELECT month, state, count(*) AS orders,
       sum(days_vs_promise > 0) AS late,
       sum(max(days_vs_promise, 0)) AS late_days,
       count(dispatch_days) AS staged_orders,
       round(sum(coalesce(dispatch_days, 0)), 6) AS dispatch_days_sum,
       round(sum(coalesce(transit_days, 0)), 6) AS transit_days_sum
FROM scored GROUP BY month, state ORDER BY month, state;
