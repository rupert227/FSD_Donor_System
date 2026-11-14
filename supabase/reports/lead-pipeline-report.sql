CREATE OR REPLACE FUNCTION public.lead_pipeline_report(
    p_donor_type TEXT DEFAULT NULL,
    p_fiscal_year TEXT DEFAULT NULL,
    p_pipeline_stage TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $$
WITH
-- Apply the user-selected filters.
filtered AS (
    SELECT *
    FROM public.lead_prospects
    WHERE
        (
            NULLIF(p_donor_type, '') IS NULL
            OR donor_type::TEXT = p_donor_type
        )
        AND (
            NULLIF(p_fiscal_year, '') IS NULL
            OR EXTRACT(YEAR FROM created_at)::INT =
               NULLIF(p_fiscal_year, '')::INT
        )
        AND (
            NULLIF(p_pipeline_stage, '') IS NULL
            OR pipeline_status::TEXT = p_pipeline_stage
        )
),

-- Q1 through Q4, plus FY total.
periods AS (
    SELECT generate_series(1, 5) AS period
),

-- Assign each prospect to a quarter.
quarterly AS (
    SELECT
        CASE
            WHEN GROUPING(EXTRACT(QUARTER FROM created_at)) = 1
                THEN 5
            ELSE EXTRACT(QUARTER FROM created_at)::INT
        END AS period,

        COUNT(*) AS total_count,

        COALESCE(SUM(target_amount), 0) AS valuation,

        COALESCE(
            SUM(target_amount * probability_score / 100.0)
                FILTER (
                    WHERE probability_score >= 60
                ),
            0
        ) AS probability_value,

        COALESCE(
            SUM(target_amount) FILTER (
                WHERE LOWER(pipeline_status::TEXT) = 'secured donor'
            ),
            0
        ) AS secured_value,

        COUNT(*) FILTER (
            WHERE LOWER(pipeline_status::TEXT) = 'secured donor'
        ) AS secured_count

    FROM filtered
    GROUP BY GROUPING SETS (
        (EXTRACT(QUARTER FROM created_at)),
        ()
    )
),

-- Generate all five periods, including empty quarters.
metrics AS (
    SELECT
        p.period,
        COALESCE(q.total_count, 0) AS total_count,
        COALESCE(q.valuation, 0) AS valuation,
        COALESCE(q.probability_value, 0) AS probability_value,
        COALESCE(q.secured_value, 0) AS secured_value,
        COALESCE(q.secured_count, 0) AS secured_count
    FROM periods p
    LEFT JOIN quarterly q USING (period)
),

-- Lead source breakdown.
origin_counts AS (
    SELECT
        CASE
            WHEN GROUPING(quarter_no) = 1 THEN 5
            ELSE quarter_no
        END AS period,

        COUNT(*) FILTER (
            WHERE LOWER(lead_source_origin::TEXT) LIKE '%referr%'
        ) AS referral,

        COUNT(*) FILTER (
            WHERE LOWER(lead_source_origin::TEXT) LIKE '%research%'
        ) AS research,

        COUNT(*) FILTER (
            WHERE LOWER(lead_source_origin::TEXT) LIKE '%booth%'
        ) AS booths,

        COUNT(*) FILTER (
            WHERE LOWER(lead_source_origin::TEXT) LIKE '%call%'
               OR LOWER(lead_source_origin::TEXT) LIKE '%text%'
        ) AS call_or_text,

        COUNT(*) FILTER (
            WHERE LOWER(lead_source_origin::TEXT) LIKE '%walk%'
        ) AS walk_in

    FROM (
        SELECT
            EXTRACT(QUARTER FROM created_at)::INT AS quarter_no,
            lead_source_origin
        FROM filtered
    ) AS source_data

    GROUP BY GROUPING SETS (
        (quarter_no),
        ()
    )
),

-- Pipeline stage breakdown.
stage_counts AS (
    SELECT
        CASE
            WHEN GROUPING(quarter_no) = 1 THEN 5
            ELSE quarter_no
        END AS period,

        COUNT(*) FILTER (
            WHERE LOWER(pipeline_status::TEXT) = 'new lead'
        ) AS new_lead,

        COUNT(*) FILTER (
            WHERE LOWER(pipeline_status::TEXT) = 'under research'
        ) AS under_research,

        COUNT(*) FILTER (
            WHERE LOWER(pipeline_status::TEXT) = 'outreach started'
        ) AS outreach_started,

        COUNT(*) FILTER (
            WHERE LOWER(pipeline_status::TEXT) = 'proposal sent'
        ) AS proposal_sent,

        COUNT(*) FILTER (
            WHERE LOWER(pipeline_status::TEXT) = 'secured donor'
        ) AS secured_donor

    FROM (
        SELECT
            EXTRACT(QUARTER FROM created_at)::INT AS quarter_no,
            pipeline_status
        FROM filtered
    ) AS stage_data

    GROUP BY GROUPING SETS (
        (quarter_no),
        ()
    )
),

-- Combine lead source data with all five periods.
origins AS (
    SELECT
        p.period,
        COALESCE(o.referral, 0) AS referral,
        COALESCE(o.research, 0) AS research,
        COALESCE(o.booths, 0) AS booths,
        COALESCE(o.call_or_text, 0) AS call_or_text,
        COALESCE(o.walk_in, 0) AS walk_in
    FROM periods p
    LEFT JOIN origin_counts o USING (period)
),

-- Combine pipeline stage data with all five periods.
stages AS (
    SELECT
        p.period,
        COALESCE(s.new_lead, 0) AS new_lead,
        COALESCE(s.under_research, 0) AS under_research,
        COALESCE(s.outreach_started, 0) AS outreach_started,
        COALESCE(s.proposal_sent, 0) AS proposal_sent,
        COALESCE(s.secured_donor, 0) AS secured_donor
    FROM periods p
    LEFT JOIN stage_counts s USING (period)
)

-- Generate the final JSON response.
SELECT jsonb_build_object(

    'fiscalYearOptions', (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'key', year_value,
                    'label', year_value
                ) ORDER BY year_value DESC
            ),
            '[]'::JSONB
        )
        FROM (
            SELECT DISTINCT
                EXTRACT(YEAR FROM created_at)::INT::TEXT AS year_value
            FROM public.lead_prospects
        ) y
    ),

    'donorTypeOptions', (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'key', donor_type::TEXT,
                    'label', donor_type::TEXT
                ) ORDER BY donor_type::TEXT
            ),
            '[]'::JSONB
        )
        FROM (
            SELECT DISTINCT donor_type
            FROM public.lead_prospects
        ) d
    ),

    'pipelineStageOptions', (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'key', pipeline_status::TEXT,
                    'label', pipeline_status::TEXT
                ) ORDER BY pipeline_status
            ),
            '[]'::JSONB
        )
        FROM (
            SELECT DISTINCT pipeline_status
            FROM public.lead_prospects
        ) s
    ),

    'quarterlySummary', jsonb_build_object(

        'headers', jsonb_build_array(
            'Q1', 'Q2', 'Q3', 'Q4', 'FY'
        ),

        'coreMonetaryValue', jsonb_build_object(

            'totalEstimatedValuation', (
                SELECT jsonb_agg(valuation ORDER BY period)
                FROM metrics
            ),

            'probabilityAdjustedValue', (
                SELECT jsonb_agg(probability_value ORDER BY period)
                FROM metrics
            ),

            'securedValue', (
                SELECT jsonb_agg(secured_value ORDER BY period)
                FROM metrics
            ),

            'unsecuredBalance', (
                SELECT jsonb_agg(
                    valuation - secured_value ORDER BY period
                )
                FROM metrics
            )
        ),

        'conversionEfficiencyAndRatios', jsonb_build_object(

            'donorConversionRate', (
                SELECT jsonb_agg(
                    CASE
                        WHEN total_count = 0 THEN 0
                        ELSE ROUND(
                            secured_count::NUMERIC / total_count, 4
                        )
                    END
                    ORDER BY period
                )
                FROM metrics
            ),

            'valueRealizationRate', (
                SELECT jsonb_agg(
                    CASE
                        WHEN valuation = 0 THEN 0
                        ELSE ROUND(
                            secured_value / valuation, 4
                        )
                    END
                    ORDER BY period
                )
                FROM metrics
            )
        ),

        'leadOriginBreakdown', jsonb_build_object(

            'referral', (
                SELECT jsonb_agg(referral ORDER BY period)
                FROM origins
            ),

            'research', (
                SELECT jsonb_agg(research ORDER BY period)
                FROM origins
            ),

            'booths', (
                SELECT jsonb_agg(booths ORDER BY period)
                FROM origins
            ),

            'callOrText', (
                SELECT jsonb_agg(call_or_text ORDER BY period)
                FROM origins
            ),

            'walkIn', (
                SELECT jsonb_agg(walk_in ORDER BY period)
                FROM origins
            ),

            'subTotalLeadIntake', (
                SELECT jsonb_agg(
                    referral + research + booths +
                    call_or_text + walk_in
                    ORDER BY period
                )
                FROM origins
            )
        ),

        'pipelineStageBreakdown', jsonb_build_object(

            'newLead', (
                SELECT jsonb_agg(new_lead ORDER BY period)
                FROM stages
            ),

            'underResearch', (
                SELECT jsonb_agg(under_research ORDER BY period)
                FROM stages
            ),

            'outreachStarted', (
                SELECT jsonb_agg(outreach_started ORDER BY period)
                FROM stages
            ),

            'proposalSent', (
                SELECT jsonb_agg(proposal_sent ORDER BY period)
                FROM stages
            ),

            'securedDonor', (
                SELECT jsonb_agg(secured_donor ORDER BY period)
                FROM stages
            ),

            'subTotalProspectRecords', (
                SELECT jsonb_agg(
                    new_lead + under_research +
                    outreach_started + proposal_sent +
                    secured_donor
                    ORDER BY period
                )
                FROM stages
            )
        )
    )
);
$$;