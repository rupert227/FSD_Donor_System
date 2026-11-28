create or replace function public.care_report (
  p_base_year INTEGER default null,
  p_compare_year INTEGER default null,
  p_source_of_funds source_of_funds_enum default null
) RETURNS JSONB LANGUAGE SQL as $$
WITH options AS (
  SELECT
    COALESCE((SELECT jsonb_agg(jsonb_build_object('key', y::TEXT, 'label', y::TEXT) ORDER BY y DESC) FROM (SELECT DISTINCT EXTRACT(YEAR FROM transaction_date)::INTEGER AS y FROM transactions) years), '[]'::JSONB) AS year_options,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('key', s, 'label', s) ORDER BY s) FROM (SELECT DISTINCT source_of_funds::TEXT AS s FROM transactions) sources), '[]'::JSONB) AS source_options
),
filtered_transactions AS (
  SELECT
    *,
    regexp_replace(lower(campaign_name::TEXT), '[^a-z]', '', 'g') AS campaign_key
  FROM transactions
  WHERE p_source_of_funds IS NULL OR source_of_funds = p_source_of_funds
),
aggregates AS (
  SELECT
    COALESCE(SUM(amount_collected) FILTER (WHERE p_base_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_base_year), 0)::NUMERIC AS base_collected,
    COALESCE(SUM(amount_collected) FILTER (WHERE p_compare_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_compare_year), 0)::NUMERIC AS compare_collected,
    COALESCE(SUM(amount_pledge) FILTER (WHERE p_base_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_base_year), 0)::NUMERIC AS base_committed,
    COALESCE(SUM(amount_pledge) FILTER (WHERE p_compare_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_compare_year), 0)::NUMERIC AS compare_committed,
    COALESCE(SUM(amount_pledge - amount_collected) FILTER (WHERE p_base_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_base_year), 0)::NUMERIC AS base_uncollected,
    COALESCE(SUM(amount_pledge - amount_collected) FILTER (WHERE p_compare_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_compare_year), 0)::NUMERIC AS compare_uncollected,
    COALESCE(AVG(amount_collected) FILTER (WHERE p_base_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_base_year), 0)::NUMERIC AS base_mean_donation,
    COALESCE(AVG(amount_collected) FILTER (WHERE p_compare_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_compare_year), 0)::NUMERIC AS compare_mean_donation,
    COALESCE(SUM(amount_collected) FILTER (WHERE campaign_key = 'healthanddisasterrelief' AND (p_base_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_base_year)), 0)::NUMERIC AS base_health,
    COALESCE(SUM(amount_collected) FILTER (WHERE campaign_key = 'healthanddisasterrelief' AND (p_compare_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_compare_year)), 0)::NUMERIC AS compare_health,
    COALESCE(SUM(amount_collected) FILTER (WHERE campaign_key = 'youthservantleadership' AND (p_base_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_base_year)), 0)::NUMERIC AS base_youth,
    COALESCE(SUM(amount_collected) FILTER (WHERE campaign_key = 'youthservantleadership' AND (p_compare_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_compare_year)), 0)::NUMERIC AS compare_youth,
    COALESCE(SUM(amount_collected) FILTER (WHERE campaign_key = 'inkindsocialenterprise' AND (p_base_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_base_year)), 0)::NUMERIC AS base_inkind,
    COALESCE(SUM(amount_collected) FILTER (WHERE campaign_key = 'inkindsocialenterprise' AND (p_compare_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_compare_year)), 0)::NUMERIC AS compare_inkind,
    COALESCE(SUM(amount_collected) FILTER (WHERE campaign_key = 'instituteforstewardship' AND (p_base_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_base_year)), 0)::NUMERIC AS base_stewardship,
    COALESCE(SUM(amount_collected) FILTER (WHERE campaign_key = 'instituteforstewardship' AND (p_compare_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_compare_year)), 0)::NUMERIC AS compare_stewardship,
    COALESCE(SUM(amount_collected) FILTER (WHERE campaign_key = 'atriskrestorativejustice' AND (p_base_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_base_year)), 0)::NUMERIC AS base_justice,
    COALESCE(SUM(amount_collected) FILTER (WHERE campaign_key = 'atriskrestorativejustice' AND (p_compare_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_compare_year)), 0)::NUMERIC AS compare_justice,
    COUNT(*) FILTER (WHERE fulfillment_date IS NOT NULL AND (p_base_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_base_year))::NUMERIC AS base_completed,
    COUNT(*) FILTER (WHERE fulfillment_date IS NOT NULL AND (p_compare_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_compare_year))::NUMERIC AS compare_completed,
    COUNT(*) FILTER (WHERE official_receipt_no IS NOT NULL AND (p_base_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_base_year))::NUMERIC AS base_receipts,
    COUNT(*) FILTER (WHERE official_receipt_no IS NOT NULL AND (p_compare_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_compare_year))::NUMERIC AS compare_receipts,
    COUNT(*) FILTER (WHERE tax_certificate_no IS NOT NULL AND (p_base_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_base_year))::NUMERIC AS base_certificates,
    COUNT(*) FILTER (WHERE tax_certificate_no IS NOT NULL AND (p_compare_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_compare_year))::NUMERIC AS compare_certificates,
    COALESCE(AVG(fulfillment_date - transaction_date) FILTER (WHERE fulfillment_date IS NOT NULL AND (p_base_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_base_year)), 0)::NUMERIC AS base_turnaround,
    COALESCE(AVG(fulfillment_date - transaction_date) FILTER (WHERE fulfillment_date IS NOT NULL AND (p_compare_year IS NULL OR EXTRACT(YEAR FROM transaction_date)::INTEGER = p_compare_year)), 0)::NUMERIC AS compare_turnaround
  FROM filtered_transactions
),
metrics AS (
  SELECT
    *,
    compare_collected - base_collected AS diff_collected,
    compare_committed - base_committed AS diff_committed,
    compare_uncollected - base_uncollected AS diff_uncollected,
    compare_mean_donation - base_mean_donation AS diff_mean_donation,
    compare_health - base_health AS diff_health,
    compare_youth - base_youth AS diff_youth,
    compare_inkind - base_inkind AS diff_inkind,
    compare_stewardship - base_stewardship AS diff_stewardship,
    compare_justice - base_justice AS diff_justice,
    compare_completed - base_completed AS diff_completed,
    compare_receipts - base_receipts AS diff_receipts,
    compare_certificates - base_certificates AS diff_certificates,
    compare_turnaround - base_turnaround AS diff_turnaround
  FROM aggregates
)
SELECT jsonb_build_object(
  'timestamp', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'baseYear', p_base_year::TEXT,
  'compareYear', p_compare_year::TEXT,
  'sourceOfFunds', p_source_of_funds::TEXT,
  'baseYearOptions', o.year_options,
  'compareYearOptions', o.year_options,
  'sourceOfFundsOptions', o.source_options,
  'donationVariance', jsonb_build_object(
    'headers', jsonb_build_array('Base Year', 'Compare Year', 'Net Difference', 'Growth Rate'),
    'coreMonetaryMetrics', jsonb_build_object(
      'totalCollectedDonations', jsonb_build_array(m.base_collected, m.compare_collected, m.diff_collected, CASE WHEN m.base_collected = 0 THEN 0 ELSE m.diff_collected / ABS(m.base_collected) END),
      'totalCommittedDonations', jsonb_build_array(m.base_committed, m.compare_committed, m.diff_committed, CASE WHEN m.base_committed = 0 THEN 0 ELSE m.diff_committed / ABS(m.base_committed) END),
      'uncollectedDonationBalance', jsonb_build_array(m.base_uncollected, m.compare_uncollected, m.diff_uncollected, CASE WHEN m.base_uncollected = 0 THEN 0 ELSE m.diff_uncollected / ABS(m.base_uncollected) END),
      'meanDonationPerTransaction', jsonb_build_array(m.base_mean_donation, m.compare_mean_donation, m.diff_mean_donation, CASE WHEN m.base_mean_donation = 0 THEN 0 ELSE m.diff_mean_donation / ABS(m.base_mean_donation) END)
    ),
    'campaignAllocations', jsonb_build_object(
      'healthAndDisasterRelief', jsonb_build_array(m.base_health, m.compare_health, m.diff_health, CASE WHEN m.base_health = 0 THEN 0 ELSE m.diff_health / ABS(m.base_health) END),
      'youthServantLeadership', jsonb_build_array(m.base_youth, m.compare_youth, m.diff_youth, CASE WHEN m.base_youth = 0 THEN 0 ELSE m.diff_youth / ABS(m.base_youth) END),
      'inKindSocialEnterprise', jsonb_build_array(m.base_inkind, m.compare_inkind, m.diff_inkind, CASE WHEN m.base_inkind = 0 THEN 0 ELSE m.diff_inkind / ABS(m.base_inkind) END),
      'instituteForStewardship', jsonb_build_array(m.base_stewardship, m.compare_stewardship, m.diff_stewardship, CASE WHEN m.base_stewardship = 0 THEN 0 ELSE m.diff_stewardship / ABS(m.base_stewardship) END),
      'atRiskRestorativeJustice', jsonb_build_array(m.base_justice, m.compare_justice, m.diff_justice, CASE WHEN m.base_justice = 0 THEN 0 ELSE m.diff_justice / ABS(m.base_justice) END),
      'subtotalCampaignDonations', jsonb_build_array(m.base_collected, m.compare_collected, m.diff_collected, CASE WHEN m.base_collected = 0 THEN 0 ELSE m.diff_collected / ABS(m.base_collected) END)
    ),
    'transactionAuditAndCertificates', jsonb_build_object(
      'completedTransactionsEncoded', jsonb_build_array(m.base_completed, m.compare_completed, m.diff_completed, CASE WHEN m.base_completed = 0 THEN 0 ELSE m.diff_completed / ABS(m.base_completed) END),
      'donationReceiptsDispatched', jsonb_build_array(m.base_receipts, m.compare_receipts, m.diff_receipts, CASE WHEN m.base_receipts = 0 THEN 0 ELSE m.diff_receipts / ABS(m.base_receipts) END),
      'taxCertificatesIssued', jsonb_build_array(m.base_certificates, m.compare_certificates, m.diff_certificates, CASE WHEN m.base_certificates = 0 THEN 0 ELSE m.diff_certificates / ABS(m.base_certificates) END),
      'meanDispatchTurnaround', jsonb_build_array(m.base_turnaround, m.compare_turnaround, m.diff_turnaround, CASE WHEN m.base_turnaround = 0 THEN 0 ELSE m.diff_turnaround / ABS(m.base_turnaround) END)
    )
  )
)
FROM metrics m
CROSS JOIN options o;
$$;