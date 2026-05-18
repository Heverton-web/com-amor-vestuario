DROP VIEW IF EXISTS public.customer_points_balance;
CREATE VIEW public.customer_points_balance
WITH (security_invoker = on) AS
SELECT customer_id, COALESCE(SUM(delta), 0)::int AS balance
FROM public.points_ledger
GROUP BY customer_id;