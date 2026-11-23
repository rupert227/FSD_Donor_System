create or replace function public.conversion_report (
  p_year INTEGER default null,
  p_donor_type donor_type_enum default null,
  p_target_campaign target_campaign_enum default null
) RETURNS JSONB LANGUAGE SQL as $$
WITH options AS (
  SELECT
    COALESCE((SELECT jsonb_agg(jsonb_build_object('key', y::TEXT, 'label', y::TEXT) ORDER BY y DESC) FROM (SELECT DISTINCT EXTRACT(YEAR FROM created_at)::INTEGER AS y FROM lead_prospects) years), '[]'::JSONB) AS year_options,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('key', d, 'label', d) ORDER BY d) FROM (SELECT DISTINCT donor_type::TEXT AS d FROM lead_prospects) donors), '[]'::JSONB) AS donor_type_options,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('key', c, 'label', c) ORDER BY c) FROM (SELECT DISTINCT target_campaign::TEXT AS c FROM lead_prospects) campaigns), '[]'::JSONB) AS target_campaign_options
),
filtered AS (
  SELECT *, EXTRACT(QUARTER FROM created_at)::INTEGER AS quarter
  FROM lead_prospects
  WHERE (p_year IS NULL OR EXTRACT(YEAR FROM created_at)::INTEGER = p_year)
    AND (p_donor_type IS NULL OR donor_type = p_donor_type)
    AND (p_target_campaign IS NULL OR target_campaign = p_target_campaign)
),
agg AS (
  SELECT
    CASE WHEN GROUPING(quarter) = 1 THEN 5 ELSE quarter END AS period,
    COALESCE(SUM(target_amount), 0) AS total_valuation,
    COALESCE(SUM(target_amount * probability_score / 100.0) FILTER (WHERE probability_score >= 60), 0) AS probability_adjusted,
    COALESCE(SUM(target_amount) FILTER (WHERE regexp_replace(lower(pipeline_status::TEXT), '[^a-z]', '', 'g') = 'secureddonor'), 0) AS secured_value,
    COUNT(*) AS total_records,
    COUNT(*) FILTER (WHERE regexp_replace(lower(pipeline_status::TEXT), '[^a-z]', '', 'g') = 'secureddonor') AS secured_records,
    COUNT(*) FILTER (WHERE regexp_replace(lower(lead_source_origin::TEXT), '[^a-z]', '', 'g') = 'referral') AS referral,
    COUNT(*) FILTER (WHERE regexp_replace(lower(lead_source_origin::TEXT), '[^a-z]', '', 'g') = 'research') AS research,
    COUNT(*) FILTER (WHERE regexp_replace(lower(lead_source_origin::TEXT), '[^a-z]', '', 'g') = 'booths') AS booths,
    COUNT(*) FILTER (WHERE regexp_replace(lower(lead_source_origin::TEXT), '[^a-z]', '', 'g') IN ('callortext', 'directcall')) AS call_or_text,
    COUNT(*) FILTER (WHERE regexp_replace(lower(lead_source_origin::TEXT), '[^a-z]', '', 'g') = 'walkin') AS walk_in,
    COUNT(*) FILTER (WHERE regexp_replace(lower(pipeline_status::TEXT), '[^a-z]', '', 'g') = 'newlead') AS new_lead,
    COUNT(*) FILTER (WHERE regexp_replace(lower(pipeline_status::TEXT), '[^a-z]', '', 'g') = 'underresearch') AS under_research,
    COUNT(*) FILTER (WHERE regexp_replace(lower(pipeline_status::TEXT), '[^a-z]', '', 'g') = 'outreachstarted') AS outreach_started,
    COUNT(*) FILTER (WHERE regexp_replace(lower(pipeline_status::TEXT), '[^a-z]', '', 'g') = 'proposalsent') AS proposal_sent,
    COUNT(*) FILTER (WHERE regexp_replace(lower(pipeline_status::TEXT), '[^a-z]', '', 'g') = 'secureddonor') AS secured_donor
  FROM filtered
  GROUP BY GROUPING SETS ((quarter), ())
),
periods AS (
  SELECT generate_series(1, 5) AS period
),
summary AS (
  SELECT jsonb_build_object(
    'headers', jsonb_build_array('Q1', 'Q2', 'Q3', 'Q4', 'All Years'),
    'coreMonetaryValue', jsonb_build_object(
      'totalEstimatedValuation', (SELECT jsonb_agg(COALESCE(a.total_valuation, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'probabilityAdjustedValue', (SELECT jsonb_agg(COALESCE(a.probability_adjusted, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'securedValue', (SELECT jsonb_agg(COALESCE(a.secured_value, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'unsecuredBalance', (SELECT jsonb_agg(COALESCE(a.total_valuation, 0) - COALESCE(a.secured_value, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period))
    ),
    'conversionEfficiencyAndRatios', jsonb_build_object(
      'donorConversionRate', (SELECT jsonb_agg(COALESCE(a.secured_records::DECIMAL / NULLIF(a.total_records, 0), 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'valueRealizationRate', (SELECT jsonb_agg(COALESCE(a.secured_value / NULLIF(a.total_valuation, 0), 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period))
    ),
    'leadOriginBreakdown', jsonb_build_object(
      'referral', (SELECT jsonb_agg(COALESCE(a.referral, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'research', (SELECT jsonb_agg(COALESCE(a.research, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'booths', (SELECT jsonb_agg(COALESCE(a.booths, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'callOrText', (SELECT jsonb_agg(COALESCE(a.call_or_text, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'walkIn', (SELECT jsonb_agg(COALESCE(a.walk_in, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'subtotalLeadIntake', (SELECT jsonb_agg(COALESCE(a.total_records, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period))
    ),
    'pipelineStageBreakdown', jsonb_build_object(
      'newLead', (SELECT jsonb_agg(COALESCE(a.new_lead, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'underResearch', (SELECT jsonb_agg(COALESCE(a.under_research, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'outreachStarted', (SELECT jsonb_agg(COALESCE(a.outreach_started, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'proposalSent', (SELECT jsonb_agg(COALESCE(a.proposal_sent, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'securedDonor', (SELECT jsonb_agg(COALESCE(a.secured_donor, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period)),
      'subtotalProspectRecords', (SELECT jsonb_agg(COALESCE(a.total_records, 0) ORDER BY p.period) FROM periods p LEFT JOIN agg a USING (period))
    )
  ) AS data
)
SELECT jsonb_build_object(
  'timestamp', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'year', p_year::TEXT,
  'donorType', p_donor_type::TEXT,
  'targetCampaign', p_target_campaign::TEXT,
  'yearOptions', o.year_options,
  'donorTypeOptions', o.donor_type_options,
  'targetCampaignOptions', o.target_campaign_options,
  'quarterlySummary', s.data
)
FROM options o CROSS JOIN summary s;
$$;