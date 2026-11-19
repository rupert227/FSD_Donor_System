create or replace function public.retention_report (
  p_year INTEGER default null,
  p_target_campaign target_campaign_enum default null,
  p_engagement_status engagement_status_enum default null
) RETURNS JSONB LANGUAGE SQL as $$
WITH options AS (
  SELECT
    COALESCE((SELECT jsonb_agg(jsonb_build_object('key', y::TEXT, 'label', y::TEXT) ORDER BY y DESC) FROM (SELECT EXTRACT(YEAR FROM created_at)::INTEGER AS y FROM donor_profiles UNION SELECT EXTRACT(YEAR FROM transaction_date)::INTEGER AS y FROM transactions) years), '[]'::JSONB) AS year_options,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('key', c, 'label', c) ORDER BY c) FROM (SELECT DISTINCT target_campaign::TEXT AS c FROM donor_profiles) campaigns), '[]'::JSONB) AS target_campaign_options,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('key', e, 'label', e) ORDER BY e) FROM (SELECT DISTINCT engagement_status::TEXT AS e FROM donor_profiles) engagements), '[]'::JSONB) AS engagement_status_options
),
filtered_donors AS (
  SELECT *
  FROM donor_profiles
  WHERE (p_target_campaign IS NULL OR target_campaign = p_target_campaign)
    AND (p_engagement_status IS NULL OR engagement_status = p_engagement_status)
),
donor_agg AS (
  SELECT
    CASE WHEN GROUPING(quarter) = 1 THEN 5 ELSE quarter END AS period,
    COUNT(*) AS total_donors,
    COUNT(*) FILTER (WHERE regexp_replace(lower(engagement_status::TEXT), '[^a-z]', '', 'g') IN ('recommitted', 'renewalstarted', 'followedup')) AS active_retained_donors,
    COUNT(*) FILTER (WHERE regexp_replace(lower(engagement_status::TEXT), '[^a-z]', '', 'g') = 'recommitted') AS recommitted,
    COUNT(*) FILTER (WHERE regexp_replace(lower(engagement_status::TEXT), '[^a-z]', '', 'g') = 'renewalstarted') AS renewal_started,
    COUNT(*) FILTER (WHERE regexp_replace(lower(engagement_status::TEXT), '[^a-z]', '', 'g') = 'followedup') AS followed_up,
    COUNT(*) FILTER (WHERE regexp_replace(lower(engagement_status::TEXT), '[^a-z]', '', 'g') = 'uncontacted') AS uncontacted,
    COUNT(*) FILTER (WHERE regexp_replace(lower(engagement_status::TEXT), '[^a-z]', '', 'g') = 'lapseddonor') AS lapsed_donor,
    COUNT(*) FILTER (WHERE created_at::DATE <= CURRENT_DATE - INTERVAL '3 years') AS three_plus_years_loyal,
    COUNT(*) FILTER (WHERE created_at::DATE <= CURRENT_DATE - INTERVAL '2 years' AND created_at::DATE > CURRENT_DATE - INTERVAL '3 years') AS two_years_retained,
    COUNT(*) FILTER (WHERE created_at::DATE <= CURRENT_DATE - INTERVAL '1 year' AND created_at::DATE > CURRENT_DATE - INTERVAL '2 years') AS one_year_retained,
    COUNT(*) FILTER (WHERE created_at::DATE > CURRENT_DATE - INTERVAL '1 year') AS new_renewal
  FROM (
    SELECT *,
      EXTRACT(QUARTER FROM created_at)::INTEGER AS quarter
    FROM filtered_donors
    WHERE p_year IS NULL OR EXTRACT(YEAR FROM created_at)::INTEGER = p_year
  ) donors
  GROUP BY GROUPING SETS ((quarter), ())
),
transaction_agg AS (
  SELECT
    CASE WHEN GROUPING(quarter) = 1 THEN 5 ELSE quarter END AS period,
    COALESCE(SUM(amount_pledge), 0) AS total_estimated_renewal_amount,
    COALESCE(SUM(amount_collected), 0) AS realized_renewal_amount,
    COALESCE(SUM(amount_pledge - amount_collected), 0) AS uncollected_renewal_amount,
    COALESCE(AVG(amount_pledge), 0) AS mean_renewal_value
  FROM (
    SELECT
      t.*,
      EXTRACT(QUARTER FROM t.transaction_date)::INTEGER AS quarter
    FROM transactions t
    INNER JOIN filtered_donors d ON d.id = t.donor_id
    WHERE (p_year IS NULL OR EXTRACT(YEAR FROM t.transaction_date)::INTEGER = p_year)
      AND (p_target_campaign IS NULL OR t.campaign_name = p_target_campaign)
  ) tx
  GROUP BY GROUPING SETS ((quarter), ())
),
periods AS (
  SELECT generate_series(1, 5) AS period
),
period_data AS (
  SELECT
    p.period,
    COALESCE(t.total_estimated_renewal_amount, 0) AS total_estimated_renewal_amount,
    COALESCE(t.realized_renewal_amount, 0) AS realized_renewal_amount,
    COALESCE(t.uncollected_renewal_amount, 0) AS uncollected_renewal_amount,
    COALESCE(t.mean_renewal_value, 0) AS mean_renewal_value,
    COALESCE(d.total_donors, 0) AS total_donors,
    COALESCE(d.active_retained_donors, 0) AS active_retained_donors,
    COALESCE(d.recommitted, 0) AS recommitted,
    COALESCE(d.renewal_started, 0) AS renewal_started,
    COALESCE(d.followed_up, 0) AS followed_up,
    COALESCE(d.uncontacted, 0) AS uncontacted,
    COALESCE(d.lapsed_donor, 0) AS lapsed_donor,
    COALESCE(d.three_plus_years_loyal, 0) AS three_plus_years_loyal,
    COALESCE(d.two_years_retained, 0) AS two_years_retained,
    COALESCE(d.one_year_retained, 0) AS one_year_retained,
    COALESCE(d.new_renewal, 0) AS new_renewal
  FROM periods p
  LEFT JOIN donor_agg d USING (period)
  LEFT JOIN transaction_agg t USING (period)
),
summary AS (
  SELECT jsonb_build_object(
    'headers', jsonb_build_array('Q1', 'Q2', 'Q3', 'Q4', 'All Years'),
    'renewalValue', jsonb_build_object(
      'totalEstimatedRenewalAmount', (SELECT jsonb_agg(total_estimated_renewal_amount ORDER BY period) FROM period_data),
      'realizedRenewalAmount', (SELECT jsonb_agg(realized_renewal_amount ORDER BY period) FROM period_data),
      'uncollectedRenewalAmount', (SELECT jsonb_agg(uncollected_renewal_amount ORDER BY period) FROM period_data),
      'meanRenewalValue', (SELECT jsonb_agg(mean_renewal_value ORDER BY period) FROM period_data)
    ),
    'portfolio', jsonb_build_object(
      'activeRetainedDonors', (SELECT jsonb_agg(active_retained_donors ORDER BY period) FROM period_data),
      'donorRetentionRate', (SELECT jsonb_agg(COALESCE(active_retained_donors::DECIMAL / NULLIF(total_donors, 0), 0) ORDER BY period) FROM period_data),
      'realizedRenewalValueRate', (SELECT jsonb_agg(COALESCE(realized_renewal_amount / NULLIF(total_estimated_renewal_amount, 0), 0) ORDER BY period) FROM period_data)
    ),
    'engagementStatus', jsonb_build_object(
      'recommitted', (SELECT jsonb_agg(recommitted ORDER BY period) FROM period_data),
      'renewalStarted', (SELECT jsonb_agg(renewal_started ORDER BY period) FROM period_data),
      'followedUp', (SELECT jsonb_agg(followed_up ORDER BY period) FROM period_data),
      'uncontacted', (SELECT jsonb_agg(uncontacted ORDER BY period) FROM period_data),
      'lapsedDonor', (SELECT jsonb_agg(lapsed_donor ORDER BY period) FROM period_data),
      'subtotalRetentionAccounts', (SELECT jsonb_agg(total_donors ORDER BY period) FROM period_data)
    ),
    'donorTenure', jsonb_build_object(
      'threePlusYearsLoyal', (SELECT jsonb_agg(three_plus_years_loyal ORDER BY period) FROM period_data),
      'twoYearsRetained', (SELECT jsonb_agg(two_years_retained ORDER BY period) FROM period_data),
      'oneYearRetained', (SELECT jsonb_agg(one_year_retained ORDER BY period) FROM period_data),
      'newRenewal', (SELECT jsonb_agg(new_renewal ORDER BY period) FROM period_data),
      'subtotalLoyaltyAccounts', (SELECT jsonb_agg(total_donors ORDER BY period) FROM period_data)
    )
  ) AS data
)
SELECT jsonb_build_object(
  'timestamp', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'year', p_year::TEXT,
  'targetCampaign', p_target_campaign::TEXT,
  'engagementStatus', p_engagement_status::TEXT,
  'yearOptions', o.year_options,
  'targetCampaignOptions', o.target_campaign_options,
  'engagementStatusOptions', o.engagement_status_options,
  'quarterlySummary', s.data
)
FROM options o CROSS JOIN summary s;
$$;