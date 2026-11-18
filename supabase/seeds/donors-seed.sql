-- ==============================================================================
-- FSD Donor System - Canonical Donors & Historical Renewals Seed
-- Caritas Manila - Fundraising and Stewardship Division
-- File: supabase/seeds/donors-seed.sql
--
-- Realistic distribution across retention tiers, campaigns, engagement statuses,
-- and assigned officers across all four quarters (Q1, Q2, Q3, Q4) of FY2026,
-- with historical roots in FY2023, FY2024, and FY2025.
--
-- GUARANTEE: Does NOT contain any entities from lead_prospects (prospects pipeline).
-- Active donors represent secured/renewing accounts managed under Donor Retention.
-- ==============================================================================

-- Ensure cod_requested column exists if migrating an existing schema

-- Standardize donor_type_enum to Title Case ('Individual', 'Corporate', 'Community', 'International')
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'donor_type_enum'::regtype AND enumlabel = 'individual'
  ) THEN
    ALTER TYPE donor_type_enum RENAME VALUE 'individual' TO 'Individual';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'donor_type_enum'::regtype AND enumlabel = 'corporate'
  ) THEN
    ALTER TYPE donor_type_enum RENAME VALUE 'corporate' TO 'Corporate';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'donor_type_enum'::regtype AND enumlabel = 'community'
  ) THEN
    ALTER TYPE donor_type_enum RENAME VALUE 'community' TO 'Community';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'donor_type_enum'::regtype AND enumlabel = 'international'
  ) THEN
    ALTER TYPE donor_type_enum RENAME VALUE 'international' TO 'International';
  END IF;
END $$;

ALTER TABLE donor_profiles ADD COLUMN IF NOT EXISTS cod_requested BOOLEAN DEFAULT FALSE;

-- 1. SEED DONOR PROFILES (27 Canonical Accounts)
INSERT INTO donor_profiles (
  id,
  donor_name,
  donor_type,
  primary_contact_person,
  title_designation,
  email_address,
  mobile_number,
  tax_id,
  delivery_address,
  target_campaign,
  engagement_status,
  donor_tenure,
  assigned_officer,
  converted_from_lead_id,
  cod_requested,
  last_contact_date,
  target_followup_date,
  created_at,
  updated_at
) VALUES
  -- 1. First Pacific Leadership Academy (CORPORATE - Recommitted)
  (
    1,
    'First Pacific Leadership Academy',
    'Corporate'::donor_type_enum,
    'Ramon Villaflor',
    'CSR & External Relations Director',
    'rvillaflor@fpla.com.ph',
    '+63 2 8696 5000',
    '000-234-567-000',
    'Km 27 Sumulong Highway, Antipolo, Rizal',
    'Youth Servant Leadership'::target_campaign_enum,
    'Recommitted'::engagement_status_enum,
    '3+ Years Loyal'::donor_tenure_enum,
    'Officer A. Tan',
    NULL,
    TRUE,
    '2026-02-18',
    '2027-01-20',
    '2023-01-15T08:30:00Z',
    '2026-02-18T10:15:00Z'
  ),

  -- 2. Globe Telecom, Inc. (CORPORATE - Followed-up)
  (
    2,
    'Globe Telecom, Inc.',
    'Corporate'::donor_type_enum,
    'Maria Yoly Crisanto',
    'Chief Sustainability Officer',
    'mcrisanto@globe.com.ph',
    '+63 2 7730 2000',
    '000-112-890-000',
    'The Globe Tower, 32nd St. cor. 7th Ave., Bonifacio Global City, Taguig City',
    'Health and Disaster Relief'::target_campaign_enum,
    'Followed-up'::engagement_status_enum,
    '3+ Years Loyal'::donor_tenure_enum,
    'Officer J. Reyes',
    NULL,
    TRUE,
    '2026-11-04',
    '2026-11-25',
    '2023-10-10T09:00:00Z',
    '2026-11-04T14:30:00Z'
  ),

  -- 3. Century Pacific Food, Inc. (CORPORATE - Renewal Started)
  (
    3,
    'Century Pacific Food, Inc.',
    'Corporate'::donor_type_enum,
    'Kam Leong',
    'Vice President for Corporate Affairs',
    'kleong@centurypacific.com.ph',
    '+63 2 8633 8555',
    '000-456-123-000',
    'Centerpoint Building, Garnet Road cor. Julia Vargas Ave., Ortigas Center, Pasig City',
    'In-Kind Social Enterprise'::target_campaign_enum,
    'Renewal Started'::engagement_status_enum,
    '2 Years Retained'::donor_tenure_enum,
    'Officer M. Cruz',
    NULL,
    FALSE,
    '2026-08-15',
    '2026-09-10',
    '2024-07-20T10:45:00Z',
    '2026-08-15T16:20:00Z'
  ),

  -- 4. BPI Foundation, Inc. (CORPORATE - Recommitted)
  (
    4,
    'BPI Foundation, Inc.',
    'Corporate'::donor_type_enum,
    'Carmina Marquez',
    'Executive Director',
    'cmarquez@bpi.com.ph',
    '+63 2 8818 5541',
    '000-789-012-000',
    '109 Paseo de Roxas, Legaspi Village, Makati City',
    'Youth Servant Leadership'::target_campaign_enum,
    'Recommitted'::engagement_status_enum,
    '3+ Years Loyal'::donor_tenure_enum,
    'Officer J. Reyes',
    NULL,
    TRUE,
    '2026-05-20',
    '2027-02-15',
    '2023-04-12T09:15:00Z',
    '2026-05-20T11:00:00Z'
  ),

  -- 5. Wilcon Depot Foundation (CORPORATE - Uncontacted)
  (
    5,
    'Wilcon Depot Foundation',
    'Corporate'::donor_type_enum,
    'Rosemarie Bosch-Ong',
    'SEVP & Chief Operating Officer',
    'rosemarie_ong@wilcon.com.ph',
    '+63 2 8634 8387',
    '005-321-789-000',
    '90 E. Rodriguez Jr. Ave., Ugong Norte, Quezon City',
    'At-Risk Restorative Justice'::target_campaign_enum,
    'Uncontacted'::engagement_status_enum,
    'New Renewal'::donor_tenure_enum,
    'Officer A. Tan',
    NULL,
    FALSE,
    NULL,
    '2026-11-22',
    '2025-11-10T13:20:00Z',
    '2025-11-10T13:20:00Z'
  ),

  -- 6. Pilmico Foods Community Fund (CORPORATE - Followed-up)
  (
    6,
    'Pilmico Foods Community Fund',
    'Corporate'::donor_type_enum,
    'Tristan Aboitiz',
    'Community Relations Manager',
    'tristan.aboitiz@pilmico.com',
    '+63 2 8886 2800',
    '000-654-321-000',
    'Aboitiz Corporate Center, Gov. Manuel A. Cuenco Ave., Kasambagan, Cebu City',
    'In-Kind Social Enterprise'::target_campaign_enum,
    'Followed-up'::engagement_status_enum,
    '1 Year Retained'::donor_tenure_enum,
    'Officer M. Cruz',
    NULL,
    FALSE,
    '2026-05-10',
    '2026-06-15',
    '2025-05-18T14:00:00Z',
    '2026-05-10T15:30:00Z'
  ),

  -- 7. Megaworld Foundation, Inc. (CORPORATE - Recommitted)
  (
    7,
    'Megaworld Foundation, Inc.',
    'Corporate'::donor_type_enum,
    'Francis Canuto',
    'Treasurer & Executive Committee Member',
    'fcanuto@megaworldcorp.com',
    '+63 2 8894 6300',
    '004-567-890-000',
    '30th Floor Alliance Global Tower, 36th St. cor. 11th Ave., Uptown Bonifacio, Taguig City',
    'Institute for Stewardship'::target_campaign_enum,
    'Recommitted'::engagement_status_enum,
    '3+ Years Loyal'::donor_tenure_enum,
    'Officer J. Reyes',
    NULL,
    TRUE,
    '2026-01-25',
    '2027-01-15',
    '2023-02-28T09:30:00Z',
    '2026-01-25T11:45:00Z'
  ),

  -- 8. Monde Nissin Community Outreach (CORPORATE - Lapsed Donor)
  (
    8,
    'Monde Nissin Community Outreach',
    'Corporate'::donor_type_enum,
    'Grace Hernandez',
    'CSR & Corporate Affairs Head',
    'ghernandez@mondenissin.com',
    '+63 2 8759 7000',
    '000-998-334-000',
    'Felix Reyes St., Balibago, City of Santa Rosa, Laguna',
    'Health and Disaster Relief'::target_campaign_enum,
    'Lapsed Donor'::engagement_status_enum,
    '2 Years Retained'::donor_tenure_enum,
    'Officer A. Tan',
    NULL,
    FALSE,
    '2026-08-15',
    '2026-09-30',
    '2024-08-15T11:00:00Z',
    '2026-08-15T16:00:00Z'
  ),

  -- 9. Dr. Cecilia Hernandez-Velasco (INDIVIDUAL - Recommitted)
  (
    9,
    'Dr. Cecilia Hernandez-Velasco',
    'Individual'::donor_type_enum,
    'Dr. Cecilia Hernandez-Velasco',
    'Chief Medical Consultant',
    'chvelasco.md@gmail.com',
    '+63 917 554 1234',
    '123-456-789-000',
    '24 McKinley Road, Forbes Park, Makati City',
    'Health and Disaster Relief'::target_campaign_enum,
    'Recommitted'::engagement_status_enum,
    '3+ Years Loyal'::donor_tenure_enum,
    'Officer M. Cruz',
    NULL,
    TRUE,
    '2026-03-05',
    '2027-02-28',
    '2023-03-10T14:15:00Z',
    '2026-03-05T15:30:00Z'
  ),

  -- 10. Engr. Rolando & Brenda Gopez (INDIVIDUAL - Followed-up)
  (
    10,
    'Engr. Rolando & Brenda Gopez',
    'Individual'::donor_type_enum,
    'Engr. Rolando Gopez',
    'Managing Partner',
    'rgopez@gopezengineering.ph',
    '+63 918 901 2345',
    '234-567-890-000',
    '88 Tamarind Road, Dasmariñas Village, Makati City',
    'Youth Servant Leadership'::target_campaign_enum,
    'Followed-up'::engagement_status_enum,
    '2 Years Retained'::donor_tenure_enum,
    'Officer A. Tan',
    NULL,
    FALSE,
    '2026-10-25',
    '2026-11-20',
    '2024-10-05T09:40:00Z',
    '2026-10-25T11:20:00Z'
  ),

  -- 11. Teresa Cojuangco-Yulo (INDIVIDUAL - Recommitted)
  (
    11,
    'Teresa Cojuangco-Yulo',
    'Individual'::donor_type_enum,
    'Teresa Cojuangco-Yulo',
    'Philanthropist & Trustee',
    'tyulo.stewardship@gmail.com',
    '+63 917 812 3456',
    '345-678-901-000',
    '12 Palm Avenue, Dasmariñas Village, Makati City',
    'Institute for Stewardship'::target_campaign_enum,
    'Recommitted'::engagement_status_enum,
    '3+ Years Loyal'::donor_tenure_enum,
    'Officer J. Reyes',
    NULL,
    TRUE,
    '2026-06-10',
    '2027-03-15',
    '2023-06-15T15:00:00Z',
    '2026-06-10T16:30:00Z'
  ),

  -- 12. Arch. Felipe & Maria Mendoza (INDIVIDUAL - Uncontacted)
  (
    12,
    'Arch. Felipe & Maria Mendoza',
    'Individual'::donor_type_enum,
    'Arch. Felipe Mendoza',
    'Principal Architect',
    'fmendoza@mendoza-associates.ph',
    '+63 920 334 5678',
    '456-789-012-000',
    '45 Valley Drive, Loyola Grand Villas, Quezon City',
    'At-Risk Restorative Justice'::target_campaign_enum,
    'Uncontacted'::engagement_status_enum,
    '1 Year Retained'::donor_tenure_enum,
    'Officer M. Cruz',
    NULL,
    FALSE,
    NULL,
    '2026-11-28',
    '2025-11-02T10:10:00Z',
    '2025-11-02T10:10:00Z'
  ),

  -- 13. Justice Florentino P. Feliciano Trust (INDIVIDUAL - Renewal Started)
  (
    13,
    'Justice Florentino P. Feliciano Trust',
    'Individual'::donor_type_enum,
    'Ma. Elena Feliciano-Reyes',
    'Trustee Administrator',
    'efeliciano@felicianotrust.org',
    '+63 2 8810 9876',
    '567-890-123-000',
    '7th Floor SEDCCO I Bldg., Legaspi cor. Rada St., Legaspi Village, Makati City',
    'At-Risk Restorative Justice'::target_campaign_enum,
    'Renewal Started'::engagement_status_enum,
    '3+ Years Loyal'::donor_tenure_enum,
    'Officer J. Reyes',
    NULL,
    TRUE,
    '2026-09-12',
    '2026-10-15',
    '2022-09-15T08:45:00Z',
    '2026-09-12T14:10:00Z'
  ),

  -- 14. Carmelita \ (INDIVIDUAL - Followed-up)
  (
    14,
    'Carmelita \',
    'Individual'::donor_type_enum,
    'Carmelita Ocampo-Cruz',
    'Independent Educational Consultant',
    'lita.ocampo@gmail.com',
    '+63 917 234 5678',
    '678-901-234-000',
    '18 Narra Avenue, South Forbes Park, Makati City',
    'Health and Disaster Relief'::target_campaign_enum,
    'Followed-up'::engagement_status_enum,
    '1 Year Retained'::donor_tenure_enum,
    'Officer A. Tan',
    NULL,
    FALSE,
    '2026-04-18',
    '2026-05-20',
    '2025-04-20T11:20:00Z',
    '2026-04-18T13:00:00Z'
  ),

  -- 15. Atty. Manuel & Patricia Arnaldo (INDIVIDUAL - Lapsed Donor)
  (
    15,
    'Atty. Manuel & Patricia Arnaldo',
    'Individual'::donor_type_enum,
    'Patricia Arnaldo',
    'Family Trust Administrator',
    'parnaldo@arnaldotrust.ph',
    '+63 918 776 5432',
    '789-012-345-000',
    '15 Cambridge Circle, North Forbes, Makati City',
    'Youth Servant Leadership'::target_campaign_enum,
    'Lapsed Donor'::engagement_status_enum,
    '2 Years Retained'::donor_tenure_enum,
    'Officer J. Reyes',
    NULL,
    FALSE,
    '2026-07-20',
    '2026-08-30',
    '2024-07-20T09:10:00Z',
    '2026-07-20T15:00:00Z'
  ),

  -- 16. St. Jude Catholic School Alumni (COMMUNITY - Recommitted)
  (
    16,
    'St. Jude Catholic School Alumni',
    'Community'::donor_type_enum,
    'Wilson Tan',
    'Alumni Association President',
    'alumni@stjude.edu.ph',
    '+63 2 8733 6789',
    '001-234-567-000',
    '327 Ycaza St., San Miguel, Manila',
    'Youth Servant Leadership'::target_campaign_enum,
    'Recommitted'::engagement_status_enum,
    '2 Years Retained'::donor_tenure_enum,
    'Officer M. Cruz',
    NULL,
    TRUE,
    '2026-02-10',
    '2027-02-01',
    '2024-01-30T10:00:00Z',
    '2026-02-10T14:40:00Z'
  ),

  -- 17. Brotherhood of Christian Businessmen (BCBP) (COMMUNITY - Recommitted)
  (
    17,
    'Brotherhood of Christian Businessmen (BCBP)',
    'Community'::donor_type_enum,
    'Eduardo Montinola',
    'Makati Chapter Head',
    'makatichapter@bcbp.com.ph',
    '+63 2 8892 4567',
    '002-345-678-000',
    'Unit 201 Jaka Center, 2111 Chino Roces Ave., Makati City',
    'Institute for Stewardship'::target_campaign_enum,
    'Recommitted'::engagement_status_enum,
    '3+ Years Loyal'::donor_tenure_enum,
    'Officer A. Tan',
    NULL,
    TRUE,
    '2026-05-15',
    '2027-03-01',
    '2023-05-10T11:30:00Z',
    '2026-05-15T16:15:00Z'
  ),

  -- 18. Couples for Christ - St. Michael Chapter (COMMUNITY - Renewal Started)
  (
    18,
    'Couples for Christ - St. Michael Chapter',
    'Community'::donor_type_enum,
    'Rene & Marivic Santos',
    'Chapter Leaders',
    'stmichael.cfc@gmail.com',
    '+63 917 334 9876',
    '003-456-789-000',
    'St. Michael the Archangel Parish, 10th Ave. cor. 39th St., BGC, Taguig City',
    'Health and Disaster Relief'::target_campaign_enum,
    'Renewal Started'::engagement_status_enum,
    '1 Year Retained'::donor_tenure_enum,
    'Officer J. Reyes',
    NULL,
    FALSE,
    '2026-11-05',
    '2026-11-26',
    '2025-10-15T14:00:00Z',
    '2026-11-05T15:20:00Z'
  ),

  -- 19. Knights of Columbus Council 3205 (COMMUNITY - Recommitted)
  (
    19,
    'Knights of Columbus Council 3205',
    'Community'::donor_type_enum,
    'Grand Knight Rodolfo Dizon',
    'Grand Knight',
    'kofc.council3205@gmail.com',
    '+63 2 8521 3456',
    '004-567-890-000',
    'K of C Center, Gen. Luna cor. Sta. Potenciana St., Intramuros, Manila',
    'At-Risk Restorative Justice'::target_campaign_enum,
    'Recommitted'::engagement_status_enum,
    '3+ Years Loyal'::donor_tenure_enum,
    'Officer M. Cruz',
    NULL,
    TRUE,
    '2026-08-10',
    '2027-02-10',
    '2022-08-20T09:15:00Z',
    '2026-08-10T11:00:00Z'
  ),

  -- 20. Santuario de San Antonio Parish Tithing Community (COMMUNITY - Followed-up)
  (
    20,
    'Santuario de San Antonio Parish Tithing Community',
    'Community'::donor_type_enum,
    'Bernadette Romero',
    'Parish Stewardship Council Coordinator',
    'stewardship@ssaparish.com',
    '+63 2 8843 8830',
    '005-678-901-000',
    '3117 McKinley Road, Forbes Park, Makati City',
    'Institute for Stewardship'::target_campaign_enum,
    'Followed-up'::engagement_status_enum,
    '2 Years Retained'::donor_tenure_enum,
    'Officer A. Tan',
    NULL,
    TRUE,
    '2026-11-08',
    '2026-11-30',
    '2024-11-12T10:30:00Z',
    '2026-11-08T12:00:00Z'
  ),

  -- 21. Assumption Convent Alumnae Class 1994 (COMMUNITY - Uncontacted)
  (
    21,
    'Assumption Convent Alumnae Class 1994',
    'Community'::donor_type_enum,
    'Beatriz Rufino-Zobel',
    'Class Foundation Chairperson',
    'ac94foundation@gmail.com',
    '+63 917 554 8901',
    '006-789-012-000',
    'San Lorenzo Drive, San Lorenzo Village, Makati City',
    'Youth Servant Leadership'::target_campaign_enum,
    'Uncontacted'::engagement_status_enum,
    'New Renewal'::donor_tenure_enum,
    'Officer J. Reyes',
    NULL,
    FALSE,
    NULL,
    '2026-11-24',
    '2025-12-05T13:45:00Z',
    '2025-12-05T13:45:00Z'
  ),

  -- 22. Caritas Internationalis Emergency Appeal Fund (INTERNATIONAL - Recommitted)
  (
    22,
    'Caritas Internationalis Emergency Appeal Fund',
    'International'::donor_type_enum,
    'Dr. Alistair Dutton',
    'Secretary General',
    'dutton@caritas.va',
    '+39 06 698 7979',
    'VA-00193-CI',
    'Palazzo San Calisto, 00120 Vatican City State',
    'Health and Disaster Relief'::target_campaign_enum,
    'Recommitted'::engagement_status_enum,
    '3+ Years Loyal'::donor_tenure_enum,
    'Officer A. Tan',
    NULL,
    TRUE,
    '2026-02-20',
    '2027-01-30',
    '2022-01-10T11:00:00Z',
    '2026-02-20T16:30:00Z'
  ),

  -- 23. Misericordia Stiftung Germany (INTERNATIONAL - Renewal Started)
  (
    23,
    'Misericordia Stiftung Germany',
    'International'::donor_type_enum,
    'Klaus Bergmann',
    'Head of International Solidarity',
    'k.bergmann@misericordia-stiftung.de',
    '+49 241 4420',
    'DE-811-234-567',
    'Postfach 10 15 45, 52015 Aachen, Germany',
    'At-Risk Restorative Justice'::target_campaign_enum,
    'Renewal Started'::engagement_status_enum,
    '2 Years Retained'::donor_tenure_enum,
    'Officer J. Reyes',
    NULL,
    FALSE,
    '2026-09-15',
    '2026-10-20',
    '2024-09-05T08:30:00Z',
    '2026-09-15T14:15:00Z'
  ),

  -- 24. Misereor Pastoral Development Fund (INTERNATIONAL - Recommitted)
  (
    24,
    'Misereor Pastoral Development Fund',
    'International'::donor_type_enum,
    'Dr. Pirmin Spiegel',
    'Director General',
    'info@misereor.de',
    '+49 241 442 0',
    'DE-812-345-678',
    'Mozartstraße 9, 52064 Aachen, Germany',
    'Institute for Stewardship'::target_campaign_enum,
    'Recommitted'::engagement_status_enum,
    '3+ Years Loyal'::donor_tenure_enum,
    'Officer M. Cruz',
    NULL,
    TRUE,
    '2026-06-25',
    '2027-03-01',
    '2023-06-01T10:45:00Z',
    '2026-06-25T15:00:00Z'
  ),

  -- 25. Catholic Relief Services (CRS) Philippines (INTERNATIONAL - Followed-up)
  (
    25,
    'Catholic Relief Services (CRS) Philippines',
    'International'::donor_type_enum,
    'Jonas Tetangco',
    'Country Representative',
    'jonas.tetangco@crs.org',
    '+63 2 8555 9900',
    '000-889-445-000',
    '4th Floor CBCP Building, 470 General Luna St., Intramuros, Manila',
    'Health and Disaster Relief'::target_campaign_enum,
    'Followed-up'::engagement_status_enum,
    '2 Years Retained'::donor_tenure_enum,
    'Officer A. Tan',
    NULL,
    TRUE,
    '2026-11-01',
    '2026-11-21',
    '2024-11-05T09:00:00Z',
    '2026-11-01T11:30:00Z'
  ),

  -- 26. Papal Foundation Grants Program (INTERNATIONAL - Uncontacted)
  (
    26,
    'Papal Foundation Grants Program',
    'International'::donor_type_enum,
    'Monsignor Dennis Kuruppassery',
    'Grants Administrator',
    'grants@thepapalfoundation.org',
    '+1 610 651 8400',
    'US-23-7429812',
    '100 Matsonford Road, Building 3, Suite 210, Radnor, PA 19087, USA',
    'Youth Servant Leadership'::target_campaign_enum,
    'Uncontacted'::engagement_status_enum,
    'New Renewal'::donor_tenure_enum,
    'Officer M. Cruz',
    NULL,
    FALSE,
    NULL,
    '2026-12-05',
    '2025-12-10T14:15:00Z',
    '2025-12-10T14:15:00Z'
  ),

  -- 27. Porticus Asia Foundation (INTERNATIONAL - Lapsed Donor)
  (
    27,
    'Porticus Asia Foundation',
    'International'::donor_type_enum,
    'Clarissa Delgado',
    'Regional Programme Manager',
    'cdelgado@porticus.com',
    '+852 2845 0000',
    'HK-98765432',
    'Suite 3201, Two Exchange Square, 8 Connaught Place, Central, Hong Kong',
    'At-Risk Restorative Justice'::target_campaign_enum,
    'Lapsed Donor'::engagement_status_enum,
    '1 Year Retained'::donor_tenure_enum,
    'Officer M. Cruz',
    NULL,
    FALSE,
    '2026-08-10',
    '2026-09-30',
    '2025-08-10T09:30:00Z',
    '2026-08-10T14:00:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  donor_name = EXCLUDED.donor_name,
  donor_type = EXCLUDED.donor_type,
  primary_contact_person = EXCLUDED.primary_contact_person,
  title_designation = EXCLUDED.title_designation,
  email_address = EXCLUDED.email_address,
  mobile_number = EXCLUDED.mobile_number,
  tax_id = EXCLUDED.tax_id,
  delivery_address = EXCLUDED.delivery_address,
  target_campaign = EXCLUDED.target_campaign,
  engagement_status = EXCLUDED.engagement_status,
  donor_tenure = EXCLUDED.donor_tenure,
  assigned_officer = EXCLUDED.assigned_officer,
  cod_requested = EXCLUDED.cod_requested,
  last_contact_date = EXCLUDED.last_contact_date,
  target_followup_date = EXCLUDED.target_followup_date,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

-- Reset sequence to ensure subsequent manual inserts don't collide
SELECT setval('donor_profiles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM donor_profiles));

-- ==============================================================================
-- 2. SEED HISTORICAL TRANSACTIONS & RENEWAL LEDGERS
-- Reflects donor tenure and past contributions from FY2023, FY2024, FY2025, & FY2026
-- ==============================================================================

INSERT INTO transactions (
  donor_id,
  source_of_funds,
  campaign_name,
  amount_pledge,
  amount_collected,
  transaction_date,
  payment_method,
  deposit_bank,
  bank_reference_no,
  official_receipt_no,
  tax_certificate_no,
  cod_requested,
  treasury_clearance_status,
  deposit_clearance_date,
  fulfillment_date,
  created_at,
  updated_at
) VALUES
  (
    1,
    'Corporate Partners'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    325000.00,
    325000.00,
    '2026-10-13',
    'Check Payment'::payment_method_enum,
    'BPI',
    'DEP-REF-20261013-10',
    'OR-2026-00011',
    'COD-2026-00011',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2026-10-13',
    '2026-10-13',
    '2026-10-13T08:00:00Z',
    '2026-10-13T16:00:00Z'
  ),

  (
    1,
    'Corporate Partners'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    310000.00,
    310000.00,
    '2025-08-18',
    'Direct Deposit'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20250818-11',
    'OR-2025-00012',
    'COD-2025-00012',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-08-18',
    '2025-08-18',
    '2025-08-18T08:00:00Z',
    '2025-08-18T16:00:00Z'
  ),

  (
    1,
    'Corporate Partners'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    295000.00,
    295000.00,
    '2024-06-23',
    'Cash'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20240623-12',
    'OR-2024-00013',
    'COD-2024-00013',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-06-23',
    '2024-06-23',
    '2024-06-23T08:00:00Z',
    '2024-06-23T16:00:00Z'
  ),

  (
    1,
    'Corporate Partners'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    275000.00,
    275000.00,
    '2023-10-10',
    'Bank Transfer'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20231010-13',
    'OR-2023-00014',
    'COD-2023-00014',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-10-10',
    '2023-10-10',
    '2023-10-10T08:00:00Z',
    '2023-10-10T16:00:00Z'
  ),

  (
    2,
    'Corporate Partners'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    400000.00,
    400000.00,
    '2025-09-16',
    'Direct Deposit'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20250916-20',
    'OR-2025-00021',
    'COD-2025-00021',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-09-16',
    '2025-09-16',
    '2025-09-16T08:00:00Z',
    '2025-09-16T16:00:00Z'
  ),

  (
    2,
    'Corporate Partners'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    380000.00,
    380000.00,
    '2024-07-21',
    'Cash'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20240721-21',
    'OR-2024-00022',
    'COD-2024-00022',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-07-21',
    '2024-07-21',
    '2024-07-21T08:00:00Z',
    '2024-07-21T16:00:00Z'
  ),

  (
    2,
    'Corporate Partners'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    360000.00,
    360000.00,
    '2023-11-26',
    'Bank Transfer'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20231126-22',
    'OR-2023-00023',
    'COD-2023-00023',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-11-26',
    '2023-11-26',
    '2023-11-26T08:00:00Z',
    '2023-11-26T16:00:00Z'
  ),

  (
    2,
    'Corporate Partners'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    340000.00,
    340000.00,
    '2022-09-13',
    'Check Payment'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20220913-23',
    'OR-2022-00024',
    'COD-2022-00024',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2022-09-13',
    '2022-09-13',
    '2022-09-13T08:00:00Z',
    '2022-09-13T16:00:00Z'
  ),

  (
    3,
    'Corporate Partners'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    475000.00,
    475000.00,
    '2025-08-19',
    'Cash'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20250819-30',
    'OR-2025-00031',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-08-19',
    '2025-08-19',
    '2025-08-19T08:00:00Z',
    '2025-08-19T16:00:00Z'
  ),

  (
    3,
    'Corporate Partners'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    450000.00,
    450000.00,
    '2024-06-24',
    'Bank Transfer'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20240624-31',
    'OR-2024-00032',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-06-24',
    '2024-06-24',
    '2024-06-24T08:00:00Z',
    '2024-06-24T16:00:00Z'
  ),

  (
    3,
    'Corporate Partners'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    430000.00,
    430000.00,
    '2023-10-11',
    'Check Payment'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20231011-32',
    'OR-2023-00033',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-10-11',
    '2023-10-11',
    '2023-10-11T08:00:00Z',
    '2023-10-11T16:00:00Z'
  ),

  (
    4,
    'Corporate Partners'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    550000.00,
    550000.00,
    '2026-07-22',
    'Bank Transfer'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20260722-40',
    'OR-2026-00041',
    'COD-2026-00041',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2026-07-22',
    '2026-07-22',
    '2026-07-22T08:00:00Z',
    '2026-07-22T16:00:00Z'
  ),

  (
    4,
    'Corporate Partners'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    525000.00,
    525000.00,
    '2025-11-27',
    'Check Payment'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20251127-41',
    'OR-2025-00042',
    'COD-2025-00042',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-11-27',
    '2025-11-27',
    '2025-11-27T08:00:00Z',
    '2025-11-27T16:00:00Z'
  ),

  (
    4,
    'Corporate Partners'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    495000.00,
    495000.00,
    '2024-09-14',
    'Direct Deposit'::payment_method_enum,
    'BPI',
    'DEP-REF-20240914-42',
    'OR-2024-00043',
    'COD-2024-00043',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-09-14',
    '2024-09-14',
    '2024-09-14T08:00:00Z',
    '2024-09-14T16:00:00Z'
  ),

  (
    4,
    'Corporate Partners'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    470000.00,
    470000.00,
    '2023-07-19',
    'Cash'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20230719-43',
    'OR-2023-00044',
    'COD-2023-00044',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-07-19',
    '2023-07-19',
    '2023-07-19T08:00:00Z',
    '2023-07-19T16:00:00Z'
  ),

  (
    5,
    'Corporate Partners'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    625000.00,
    625000.00,
    '2025-06-25',
    'Check Payment'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20250625-50',
    'OR-2025-00051',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-06-25',
    '2025-06-25',
    '2025-06-25T08:00:00Z',
    '2025-06-25T16:00:00Z'
  ),

  (
    6,
    'Corporate Partners'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    700000.00,
    700000.00,
    '2025-11-10',
    'Direct Deposit'::payment_method_enum,
    'BPI',
    'DEP-REF-20251110-60',
    'OR-2025-00061',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-11-10',
    '2025-11-10',
    '2025-11-10T08:00:00Z',
    '2025-11-10T16:00:00Z'
  ),

  (
    6,
    'Corporate Partners'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    665000.00,
    665000.00,
    '2024-09-15',
    'Cash'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20240915-61',
    'OR-2024-00062',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-09-15',
    '2024-09-15',
    '2024-09-15T08:00:00Z',
    '2024-09-15T16:00:00Z'
  ),

  (
    7,
    'Corporate Partners'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    775000.00,
    775000.00,
    '2026-10-13',
    'Cash'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20261013-70',
    'OR-2026-00071',
    'COD-2026-00071',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2026-10-13',
    '2026-10-13',
    '2026-10-13T08:00:00Z',
    '2026-10-13T16:00:00Z'
  ),

  (
    7,
    'Corporate Partners'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    735000.00,
    735000.00,
    '2025-08-18',
    'Bank Transfer'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20250818-71',
    'OR-2025-00072',
    'COD-2025-00072',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-08-18',
    '2025-08-18',
    '2025-08-18T08:00:00Z',
    '2025-08-18T16:00:00Z'
  ),

  (
    7,
    'Corporate Partners'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    700000.00,
    700000.00,
    '2024-06-23',
    'Check Payment'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20240623-72',
    'OR-2024-00073',
    'COD-2024-00073',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-06-23',
    '2024-06-23',
    '2024-06-23T08:00:00Z',
    '2024-06-23T16:00:00Z'
  ),

  (
    7,
    'Corporate Partners'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    660000.00,
    660000.00,
    '2023-10-10',
    'Direct Deposit'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20231010-73',
    'OR-2023-00074',
    'COD-2023-00074',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-10-10',
    '2023-10-10',
    '2023-10-10T08:00:00Z',
    '2023-10-10T16:00:00Z'
  ),

  (
    8,
    'Corporate Partners'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    850000.00,
    850000.00,
    '2025-09-16',
    'Bank Transfer'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20250916-80',
    'OR-2025-00081',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-09-16',
    '2025-09-16',
    '2025-09-16T08:00:00Z',
    '2025-09-16T16:00:00Z'
  ),

  (
    8,
    'Corporate Partners'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    810000.00,
    810000.00,
    '2024-07-21',
    'Check Payment'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20240721-81',
    'OR-2024-00082',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-07-21',
    '2024-07-21',
    '2024-07-21T08:00:00Z',
    '2024-07-21T16:00:00Z'
  ),

  (
    8,
    'Corporate Partners'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    765000.00,
    765000.00,
    '2023-11-26',
    'Direct Deposit'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20231126-82',
    'OR-2023-00083',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-11-26',
    '2023-11-26',
    '2023-11-26T08:00:00Z',
    '2023-11-26T16:00:00Z'
  ),

  (
    9,
    'Direct (Individual)'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    75000.00,
    75000.00,
    '2026-08-19',
    'Check Payment'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20260819-90',
    'OR-2026-00091',
    'COD-2026-00091',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2026-08-19',
    '2026-08-19',
    '2026-08-19T08:00:00Z',
    '2026-08-19T16:00:00Z'
  ),

  (
    9,
    'Direct (Individual)'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    70000.00,
    70000.00,
    '2025-06-24',
    'Direct Deposit'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20250624-91',
    'OR-2025-00092',
    'COD-2025-00092',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-06-24',
    '2025-06-24',
    '2025-06-24T08:00:00Z',
    '2025-06-24T16:00:00Z'
  ),

  (
    9,
    'Direct (Individual)'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    70000.00,
    70000.00,
    '2024-10-11',
    'Cash'::payment_method_enum,
    'BPI',
    'DEP-REF-20241011-92',
    'OR-2024-00093',
    'COD-2024-00093',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-10-11',
    '2024-10-11',
    '2024-10-11T08:00:00Z',
    '2024-10-11T16:00:00Z'
  ),

  (
    9,
    'Direct (Individual)'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    65000.00,
    65000.00,
    '2023-08-16',
    'Bank Transfer'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20230816-93',
    'OR-2023-00094',
    'COD-2023-00094',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-08-16',
    '2023-08-16',
    '2023-08-16T08:00:00Z',
    '2023-08-16T16:00:00Z'
  ),

  (
    10,
    'Direct (Individual)'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    90000.00,
    90000.00,
    '2025-07-22',
    'Direct Deposit'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20250722-100',
    'OR-2025-00101',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-07-22',
    '2025-07-22',
    '2025-07-22T08:00:00Z',
    '2025-07-22T16:00:00Z'
  ),

  (
    10,
    'Direct (Individual)'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    85000.00,
    85000.00,
    '2024-11-27',
    'Cash'::payment_method_enum,
    'BPI',
    'DEP-REF-20241127-101',
    'OR-2024-00102',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-11-27',
    '2024-11-27',
    '2024-11-27T08:00:00Z',
    '2024-11-27T16:00:00Z'
  ),

  (
    10,
    'Direct (Individual)'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    80000.00,
    80000.00,
    '2023-09-14',
    'Bank Transfer'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20230914-102',
    'OR-2023-00103',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-09-14',
    '2023-09-14',
    '2023-09-14T08:00:00Z',
    '2023-09-14T16:00:00Z'
  ),

  (
    11,
    'Direct (Individual)'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    105000.00,
    105000.00,
    '2026-06-25',
    'Cash'::payment_method_enum,
    'BPI',
    'DEP-REF-20260625-110',
    'OR-2026-00111',
    'COD-2026-00111',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2026-06-25',
    '2026-06-25',
    '2026-06-25T08:00:00Z',
    '2026-06-25T16:00:00Z'
  ),

  (
    11,
    'Direct (Individual)'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    100000.00,
    100000.00,
    '2025-10-12',
    'Bank Transfer'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20251012-111',
    'OR-2025-00112',
    'COD-2025-00112',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-10-12',
    '2025-10-12',
    '2025-10-12T08:00:00Z',
    '2025-10-12T16:00:00Z'
  ),

  (
    11,
    'Direct (Individual)'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    95000.00,
    95000.00,
    '2024-08-17',
    'Check Payment'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20240817-112',
    'OR-2024-00113',
    'COD-2024-00113',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-08-17',
    '2024-08-17',
    '2024-08-17T08:00:00Z',
    '2024-08-17T16:00:00Z'
  ),

  (
    11,
    'Direct (Individual)'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    90000.00,
    90000.00,
    '2023-06-22',
    'Direct Deposit'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20230622-113',
    'OR-2023-00114',
    'COD-2023-00114',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-06-22',
    '2023-06-22',
    '2023-06-22T08:00:00Z',
    '2023-06-22T16:00:00Z'
  ),

  (
    12,
    'Direct (Individual)'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    35000.00,
    35000.00,
    '2025-11-10',
    'Bank Transfer'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20251110-120',
    'OR-2025-00121',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-11-10',
    '2025-11-10',
    '2025-11-10T08:00:00Z',
    '2025-11-10T16:00:00Z'
  ),

  (
    12,
    'Direct (Individual)'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    35000.00,
    35000.00,
    '2024-09-15',
    'Check Payment'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20240915-121',
    'OR-2024-00122',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-09-15',
    '2024-09-15',
    '2024-09-15T08:00:00Z',
    '2024-09-15T16:00:00Z'
  ),

  (
    13,
    'Direct (Individual)'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    50000.00,
    50000.00,
    '2025-10-13',
    'Check Payment'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20251013-130',
    'OR-2025-00131',
    'COD-2025-00131',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-10-13',
    '2025-10-13',
    '2025-10-13T08:00:00Z',
    '2025-10-13T16:00:00Z'
  ),

  (
    13,
    'Direct (Individual)'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    50000.00,
    50000.00,
    '2024-08-18',
    'Direct Deposit'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20240818-131',
    'OR-2024-00132',
    'COD-2024-00132',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-08-18',
    '2024-08-18',
    '2024-08-18T08:00:00Z',
    '2024-08-18T16:00:00Z'
  ),

  (
    13,
    'Direct (Individual)'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    45000.00,
    45000.00,
    '2023-06-23',
    'Cash'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20230623-132',
    'OR-2023-00133',
    'COD-2023-00133',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-06-23',
    '2023-06-23',
    '2023-06-23T08:00:00Z',
    '2023-06-23T16:00:00Z'
  ),

  (
    13,
    'Direct (Individual)'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    45000.00,
    45000.00,
    '2022-10-10',
    'Bank Transfer'::payment_method_enum,
    'BPI',
    'DEP-REF-20221010-133',
    'OR-2022-00134',
    'COD-2022-00134',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2022-10-10',
    '2022-10-10',
    '2022-10-10T08:00:00Z',
    '2022-10-10T16:00:00Z'
  ),

  (
    14,
    'Direct (Individual)'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    65000.00,
    65000.00,
    '2025-09-16',
    'Direct Deposit'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20250916-140',
    'OR-2025-00141',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-09-16',
    '2025-09-16',
    '2025-09-16T08:00:00Z',
    '2025-09-16T16:00:00Z'
  ),

  (
    14,
    'Direct (Individual)'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    60000.00,
    60000.00,
    '2024-07-21',
    'Cash'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20240721-141',
    'OR-2024-00142',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-07-21',
    '2024-07-21',
    '2024-07-21T08:00:00Z',
    '2024-07-21T16:00:00Z'
  ),

  (
    15,
    'Direct (Individual)'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    80000.00,
    80000.00,
    '2025-08-19',
    'Cash'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20250819-150',
    'OR-2025-00151',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-08-19',
    '2025-08-19',
    '2025-08-19T08:00:00Z',
    '2025-08-19T16:00:00Z'
  ),

  (
    15,
    'Direct (Individual)'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    75000.00,
    75000.00,
    '2024-06-24',
    'Bank Transfer'::payment_method_enum,
    'BPI',
    'DEP-REF-20240624-151',
    'OR-2024-00152',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-06-24',
    '2024-06-24',
    '2024-06-24T08:00:00Z',
    '2024-06-24T16:00:00Z'
  ),

  (
    15,
    'Direct (Individual)'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    70000.00,
    70000.00,
    '2023-10-11',
    'Check Payment'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20231011-152',
    'OR-2023-00153',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-10-11',
    '2023-10-11',
    '2023-10-11T08:00:00Z',
    '2023-10-11T16:00:00Z'
  ),

  (
    16,
    'Community/Association'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    175000.00,
    175000.00,
    '2026-07-22',
    'Bank Transfer'::payment_method_enum,
    'BPI',
    'DEP-REF-20260722-160',
    'OR-2026-00161',
    'COD-2026-00161',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2026-07-22',
    '2026-07-22',
    '2026-07-22T08:00:00Z',
    '2026-07-22T16:00:00Z'
  ),

  (
    16,
    'Community/Association'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    165000.00,
    165000.00,
    '2025-11-27',
    'Check Payment'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20251127-161',
    'OR-2025-00162',
    'COD-2025-00162',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-11-27',
    '2025-11-27',
    '2025-11-27T08:00:00Z',
    '2025-11-27T16:00:00Z'
  ),

  (
    16,
    'Community/Association'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    160000.00,
    160000.00,
    '2024-09-14',
    'Direct Deposit'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20240914-162',
    'OR-2024-00163',
    'COD-2024-00163',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-09-14',
    '2024-09-14',
    '2024-09-14T08:00:00Z',
    '2024-09-14T16:00:00Z'
  ),

  (
    17,
    'Community/Association'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    200000.00,
    200000.00,
    '2026-06-25',
    'Check Payment'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20260625-170',
    'OR-2026-00171',
    'COD-2026-00171',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2026-06-25',
    '2026-06-25',
    '2026-06-25T08:00:00Z',
    '2026-06-25T16:00:00Z'
  ),

  (
    17,
    'Community/Association'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    190000.00,
    190000.00,
    '2025-10-12',
    'Direct Deposit'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20251012-171',
    'OR-2025-00172',
    'COD-2025-00172',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-10-12',
    '2025-10-12',
    '2025-10-12T08:00:00Z',
    '2025-10-12T16:00:00Z'
  ),

  (
    17,
    'Community/Association'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    180000.00,
    180000.00,
    '2024-08-17',
    'Cash'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20240817-172',
    'OR-2024-00173',
    'COD-2024-00173',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-08-17',
    '2024-08-17',
    '2024-08-17T08:00:00Z',
    '2024-08-17T16:00:00Z'
  ),

  (
    17,
    'Community/Association'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    170000.00,
    170000.00,
    '2023-06-22',
    'Bank Transfer'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20230622-173',
    'OR-2023-00174',
    'COD-2023-00174',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-06-22',
    '2023-06-22',
    '2023-06-22T08:00:00Z',
    '2023-06-22T16:00:00Z'
  ),

  (
    18,
    'Community/Association'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    75000.00,
    75000.00,
    '2025-11-10',
    'Direct Deposit'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20251110-180',
    'OR-2025-00181',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-11-10',
    '2025-11-10',
    '2025-11-10T08:00:00Z',
    '2025-11-10T16:00:00Z'
  ),

  (
    18,
    'Community/Association'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    70000.00,
    70000.00,
    '2024-09-15',
    'Cash'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20240915-181',
    'OR-2024-00182',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-09-15',
    '2024-09-15',
    '2024-09-15T08:00:00Z',
    '2024-09-15T16:00:00Z'
  ),

  (
    19,
    'Community/Association'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    100000.00,
    100000.00,
    '2026-10-13',
    'Cash'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20261013-190',
    'OR-2026-00191',
    'COD-2026-00191',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2026-10-13',
    '2026-10-13',
    '2026-10-13T08:00:00Z',
    '2026-10-13T16:00:00Z'
  ),

  (
    19,
    'Community/Association'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    95000.00,
    95000.00,
    '2025-08-18',
    'Bank Transfer'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20250818-191',
    'OR-2025-00192',
    'COD-2025-00192',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-08-18',
    '2025-08-18',
    '2025-08-18T08:00:00Z',
    '2025-08-18T16:00:00Z'
  ),

  (
    19,
    'Community/Association'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    90000.00,
    90000.00,
    '2024-06-23',
    'Check Payment'::payment_method_enum,
    'BPI',
    'DEP-REF-20240623-192',
    'OR-2024-00193',
    'COD-2024-00193',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-06-23',
    '2024-06-23',
    '2024-06-23T08:00:00Z',
    '2024-06-23T16:00:00Z'
  ),

  (
    19,
    'Community/Association'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    85000.00,
    85000.00,
    '2023-10-10',
    'Direct Deposit'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20231010-193',
    'OR-2023-00194',
    'COD-2023-00194',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-10-10',
    '2023-10-10',
    '2023-10-10T08:00:00Z',
    '2023-10-10T16:00:00Z'
  ),

  (
    20,
    'Community/Association'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    125000.00,
    125000.00,
    '2025-09-16',
    'Bank Transfer'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20250916-200',
    'OR-2025-00201',
    'COD-2025-00201',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-09-16',
    '2025-09-16',
    '2025-09-16T08:00:00Z',
    '2025-09-16T16:00:00Z'
  ),

  (
    20,
    'Community/Association'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    120000.00,
    120000.00,
    '2024-07-21',
    'Check Payment'::payment_method_enum,
    'BPI',
    'DEP-REF-20240721-201',
    'OR-2024-00202',
    'COD-2024-00202',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-07-21',
    '2024-07-21',
    '2024-07-21T08:00:00Z',
    '2024-07-21T16:00:00Z'
  ),

  (
    20,
    'Community/Association'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    115000.00,
    115000.00,
    '2023-11-26',
    'Direct Deposit'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20231126-202',
    'OR-2023-00203',
    'COD-2023-00203',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-11-26',
    '2023-11-26',
    '2023-11-26T08:00:00Z',
    '2023-11-26T16:00:00Z'
  ),

  (
    21,
    'Community/Association'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    150000.00,
    150000.00,
    '2025-08-19',
    'Check Payment'::payment_method_enum,
    'BPI',
    'DEP-REF-20250819-210',
    'OR-2025-00211',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-08-19',
    '2025-08-19',
    '2025-08-19T08:00:00Z',
    '2025-08-19T16:00:00Z'
  ),

  (
    22,
    'Church Institutions'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    700000.00,
    700000.00,
    '2026-07-22',
    'Direct Deposit'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20260722-220',
    'OR-2026-00221',
    'COD-2026-00221',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2026-07-22',
    '2026-07-22',
    '2026-07-22T08:00:00Z',
    '2026-07-22T16:00:00Z'
  ),

  (
    22,
    'Church Institutions'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    665000.00,
    665000.00,
    '2025-11-27',
    'Cash'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20251127-221',
    'OR-2025-00222',
    'COD-2025-00222',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-11-27',
    '2025-11-27',
    '2025-11-27T08:00:00Z',
    '2025-11-27T16:00:00Z'
  ),

  (
    22,
    'Church Institutions'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    630000.00,
    630000.00,
    '2024-09-14',
    'Bank Transfer'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20240914-222',
    'OR-2024-00223',
    'COD-2024-00223',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-09-14',
    '2024-09-14',
    '2024-09-14T08:00:00Z',
    '2024-09-14T16:00:00Z'
  ),

  (
    22,
    'Church Institutions'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    595000.00,
    595000.00,
    '2023-07-19',
    'Check Payment'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20230719-223',
    'OR-2023-00224',
    'COD-2023-00224',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-07-19',
    '2023-07-19',
    '2023-07-19T08:00:00Z',
    '2023-07-19T16:00:00Z'
  ),

  (
    23,
    'Church Institutions'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    800000.00,
    800000.00,
    '2025-06-25',
    'Cash'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20250625-230',
    'OR-2025-00231',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-06-25',
    '2025-06-25',
    '2025-06-25T08:00:00Z',
    '2025-06-25T16:00:00Z'
  ),

  (
    23,
    'Church Institutions'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    760000.00,
    760000.00,
    '2024-10-12',
    'Bank Transfer'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20241012-231',
    'OR-2024-00232',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-10-12',
    '2024-10-12',
    '2024-10-12T08:00:00Z',
    '2024-10-12T16:00:00Z'
  ),

  (
    23,
    'Church Institutions'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    720000.00,
    720000.00,
    '2023-08-17',
    'Check Payment'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20230817-232',
    'OR-2023-00233',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-08-17',
    '2023-08-17',
    '2023-08-17T08:00:00Z',
    '2023-08-17T16:00:00Z'
  ),

  (
    24,
    'Church Institutions'::source_of_funds_enum,
    'Institute for Stewardship'::target_campaign_enum,
    900000.00,
    900000.00,
    '2026-11-10',
    'Bank Transfer'::payment_method_enum,
    'UnionBank',
    'DEP-REF-20261110-240',
    'OR-2026-00241',
    'COD-2026-00241',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2026-11-10',
    '2026-11-10',
    '2026-11-10T08:00:00Z',
    '2026-11-10T16:00:00Z'
  ),

  (
    24,
    'Church Institutions'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    855000.00,
    855000.00,
    '2025-09-15',
    'Check Payment'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20250915-241',
    'OR-2025-00242',
    'COD-2025-00242',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-09-15',
    '2025-09-15',
    '2025-09-15T08:00:00Z',
    '2025-09-15T16:00:00Z'
  ),

  (
    24,
    'Church Institutions'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    810000.00,
    810000.00,
    '2024-07-20',
    'Direct Deposit'::payment_method_enum,
    'BPI',
    'DEP-REF-20240720-242',
    'OR-2024-00243',
    'COD-2024-00243',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-07-20',
    '2024-07-20',
    '2024-07-20T08:00:00Z',
    '2024-07-20T16:00:00Z'
  ),

  (
    24,
    'Church Institutions'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    765000.00,
    765000.00,
    '2023-11-25',
    'Cash'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20231125-243',
    'OR-2023-00244',
    'COD-2023-00244',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-11-25',
    '2023-11-25',
    '2023-11-25T08:00:00Z',
    '2023-11-25T16:00:00Z'
  ),

  (
    25,
    'Church Institutions'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    1000000.00,
    1000000.00,
    '2025-10-13',
    'Check Payment'::payment_method_enum,
    'BDO Unibank',
    'DEP-REF-20251013-250',
    'OR-2025-00251',
    'COD-2025-00251',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-10-13',
    '2025-10-13',
    '2025-10-13T08:00:00Z',
    '2025-10-13T16:00:00Z'
  ),

  (
    25,
    'Church Institutions'::source_of_funds_enum,
    'Health and Disaster Relief'::target_campaign_enum,
    950000.00,
    950000.00,
    '2024-08-18',
    'Direct Deposit'::payment_method_enum,
    'BPI',
    'DEP-REF-20240818-251',
    'OR-2024-00252',
    'COD-2024-00252',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-08-18',
    '2024-08-18',
    '2024-08-18T08:00:00Z',
    '2024-08-18T16:00:00Z'
  ),

  (
    25,
    'Church Institutions'::source_of_funds_enum,
    'In-Kind Social Enterprise'::target_campaign_enum,
    900000.00,
    900000.00,
    '2023-06-23',
    'Cash'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20230623-252',
    'OR-2023-00253',
    'COD-2023-00253',
    TRUE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2023-06-23',
    '2023-06-23',
    '2023-06-23T08:00:00Z',
    '2023-06-23T16:00:00Z'
  ),

  (
    26,
    'Church Institutions'::source_of_funds_enum,
    'Youth Servant Leadership'::target_campaign_enum,
    1100000.00,
    1100000.00,
    '2025-09-16',
    'Direct Deposit'::payment_method_enum,
    'BPI',
    'DEP-REF-20250916-260',
    'OR-2025-00261',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-09-16',
    '2025-09-16',
    '2025-09-16T08:00:00Z',
    '2025-09-16T16:00:00Z'
  ),

  (
    27,
    'Church Institutions'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    1200000.00,
    1200000.00,
    '2025-08-19',
    'Cash'::payment_method_enum,
    'Metrobank',
    'DEP-REF-20250819-270',
    'OR-2025-00271',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2025-08-19',
    '2025-08-19',
    '2025-08-19T08:00:00Z',
    '2025-08-19T16:00:00Z'
  ),

  (
    27,
    'Church Institutions'::source_of_funds_enum,
    'At-Risk Restorative Justice'::target_campaign_enum,
    1140000.00,
    1140000.00,
    '2024-06-24',
    'Bank Transfer'::payment_method_enum,
    'Security Bank',
    'DEP-REF-20240624-271',
    'OR-2024-00272',
    NULL,
    FALSE,
    'Transaction Finalized'::treasury_clearance_status_enum,
    '2024-06-24',
    '2024-06-24',
    '2024-06-24T08:00:00Z',
    '2024-06-24T16:00:00Z'
  )
ON CONFLICT (official_receipt_no) DO NOTHING;

-- Reset transactions sequence
SELECT setval('transactions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM transactions));

-- ==============================================================================
-- 3. SEED OUTREACH TOUCHPOINTS TIMELINE (donor_outreach_activities)
-- Strictly persisted in database for the History tab. Notes default to empty.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS donor_outreach_activities (
  id BIGSERIAL PRIMARY KEY,
  donor_id BIGINT NOT NULL REFERENCES donor_profiles(id) ON DELETE CASCADE,
  status engagement_status_enum NOT NULL,
  followup_date DATE,
  notes TEXT NOT NULL DEFAULT '',
  author_officer VARCHAR(100) DEFAULT 'System Admin',
  recorded_by BIGINT REFERENCES user_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donor_outreach_donor_id ON donor_outreach_activities(donor_id);
CREATE INDEX IF NOT EXISTS idx_donor_outreach_created_at ON donor_outreach_activities(created_at DESC);

ALTER TABLE donor_outreach_activities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow authenticated users full access to donor_outreach_activities"
    ON donor_outreach_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

INSERT INTO donor_outreach_activities (
  donor_id,
  status,
  followup_date,
  notes,
  author_officer,
  created_at
) VALUES
  (
    1,
    'Recommitted'::engagement_status_enum,
    '2027-01-20',
    '',
    'Officer A. Tan',
    '2026-02-18T16:00:00Z'
  ),

  (
    1,
    'Renewal Started'::engagement_status_enum,
    '2026-02-18',
    '',
    'Officer A. Tan',
    '2026-02-01T10:00:00Z'
  ),

  (
    1,
    'Uncontacted'::engagement_status_enum,
    '2026-02-01',
    '',
    'System Admin',
    '2023-01-15T08:30:00Z'
  ),

  (
    2,
    'Followed-up'::engagement_status_enum,
    '2026-11-25',
    '',
    'Officer J. Reyes',
    '2026-11-04T10:30:00Z'
  ),

  (
    2,
    'Uncontacted'::engagement_status_enum,
    '2026-11-04',
    '',
    'System Admin',
    '2023-10-10T09:00:00Z'
  ),

  (
    3,
    'Renewal Started'::engagement_status_enum,
    '2026-09-10',
    '',
    'Officer M. Cruz',
    '2026-08-15T14:15:00Z'
  ),

  (
    3,
    'Followed-up'::engagement_status_enum,
    '2026-08-15',
    '',
    'Officer M. Cruz',
    '2026-10-14T11:00:00Z'
  ),

  (
    3,
    'Uncontacted'::engagement_status_enum,
    '2026-10-14',
    '',
    'System Admin',
    '2024-07-20T10:45:00Z'
  ),

  (
    4,
    'Recommitted'::engagement_status_enum,
    '2027-02-15',
    '',
    'Officer J. Reyes',
    '2026-05-20T16:00:00Z'
  ),

  (
    4,
    'Renewal Started'::engagement_status_enum,
    '2026-05-20',
    '',
    'Officer J. Reyes',
    '2026-02-01T10:00:00Z'
  ),

  (
    4,
    'Uncontacted'::engagement_status_enum,
    '2026-02-01',
    '',
    'System Admin',
    '2023-04-12T09:15:00Z'
  ),

  (
    5,
    'Uncontacted'::engagement_status_enum,
    '2026-11-22',
    '',
    'System Admin',
    '2025-11-10T13:20:00Z'
  ),

  (
    6,
    'Followed-up'::engagement_status_enum,
    '2026-06-15',
    '',
    'Officer M. Cruz',
    '2026-05-10T10:30:00Z'
  ),

  (
    6,
    'Uncontacted'::engagement_status_enum,
    '2026-05-10',
    '',
    'System Admin',
    '2025-05-18T14:00:00Z'
  ),

  (
    7,
    'Recommitted'::engagement_status_enum,
    '2027-01-15',
    '',
    'Officer J. Reyes',
    '2026-01-25T16:00:00Z'
  ),

  (
    7,
    'Renewal Started'::engagement_status_enum,
    '2026-01-25',
    '',
    'Officer J. Reyes',
    '2026-02-01T10:00:00Z'
  ),

  (
    7,
    'Uncontacted'::engagement_status_enum,
    '2026-02-01',
    '',
    'System Admin',
    '2023-02-28T09:30:00Z'
  ),

  (
    8,
    'Lapsed Donor'::engagement_status_enum,
    '2026-09-30',
    '',
    'Officer A. Tan',
    '2026-08-15T15:30:00Z'
  ),

  (
    8,
    'Followed-up'::engagement_status_enum,
    '2026-08-15',
    '',
    'Officer A. Tan',
    '2026-08-01T09:45:00Z'
  ),

  (
    8,
    'Uncontacted'::engagement_status_enum,
    '2026-08-01',
    '',
    'System Admin',
    '2024-08-15T11:00:00Z'
  ),

  (
    9,
    'Recommitted'::engagement_status_enum,
    '2027-02-28',
    '',
    'Officer M. Cruz',
    '2026-03-05T16:00:00Z'
  ),

  (
    9,
    'Renewal Started'::engagement_status_enum,
    '2026-03-05',
    '',
    'Officer M. Cruz',
    '2026-02-01T10:00:00Z'
  ),

  (
    9,
    'Uncontacted'::engagement_status_enum,
    '2026-02-01',
    '',
    'System Admin',
    '2023-03-10T14:15:00Z'
  ),

  (
    10,
    'Followed-up'::engagement_status_enum,
    '2026-11-20',
    '',
    'Officer A. Tan',
    '2026-10-25T10:30:00Z'
  ),

  (
    10,
    'Uncontacted'::engagement_status_enum,
    '2026-10-25',
    '',
    'System Admin',
    '2024-10-05T09:40:00Z'
  ),

  (
    11,
    'Recommitted'::engagement_status_enum,
    '2027-03-15',
    '',
    'Officer J. Reyes',
    '2026-06-10T16:00:00Z'
  ),

  (
    11,
    'Renewal Started'::engagement_status_enum,
    '2026-06-10',
    '',
    'Officer J. Reyes',
    '2026-02-01T10:00:00Z'
  ),

  (
    11,
    'Uncontacted'::engagement_status_enum,
    '2026-02-01',
    '',
    'System Admin',
    '2023-06-15T15:00:00Z'
  ),

  (
    12,
    'Uncontacted'::engagement_status_enum,
    '2026-11-28',
    '',
    'System Admin',
    '2025-11-02T10:10:00Z'
  ),

  (
    13,
    'Renewal Started'::engagement_status_enum,
    '2026-10-15',
    '',
    'Officer J. Reyes',
    '2026-09-12T14:15:00Z'
  ),

  (
    13,
    'Followed-up'::engagement_status_enum,
    '2026-09-12',
    '',
    'Officer J. Reyes',
    '2026-10-14T11:00:00Z'
  ),

  (
    13,
    'Uncontacted'::engagement_status_enum,
    '2026-10-14',
    '',
    'System Admin',
    '2022-09-15T08:45:00Z'
  ),

  (
    14,
    'Followed-up'::engagement_status_enum,
    '2026-05-20',
    '',
    'Officer A. Tan',
    '2026-04-18T10:30:00Z'
  ),

  (
    14,
    'Uncontacted'::engagement_status_enum,
    '2026-04-18',
    '',
    'System Admin',
    '2025-04-20T11:20:00Z'
  ),

  (
    15,
    'Lapsed Donor'::engagement_status_enum,
    '2026-08-30',
    '',
    'Officer J. Reyes',
    '2026-07-20T15:30:00Z'
  ),

  (
    15,
    'Followed-up'::engagement_status_enum,
    '2026-07-20',
    '',
    'Officer J. Reyes',
    '2026-08-01T09:45:00Z'
  ),

  (
    15,
    'Uncontacted'::engagement_status_enum,
    '2026-08-01',
    '',
    'System Admin',
    '2024-07-20T09:10:00Z'
  ),

  (
    16,
    'Recommitted'::engagement_status_enum,
    '2027-02-01',
    '',
    'Officer M. Cruz',
    '2026-02-10T16:00:00Z'
  ),

  (
    16,
    'Renewal Started'::engagement_status_enum,
    '2026-02-10',
    '',
    'Officer M. Cruz',
    '2026-02-01T10:00:00Z'
  ),

  (
    16,
    'Uncontacted'::engagement_status_enum,
    '2026-02-01',
    '',
    'System Admin',
    '2024-01-30T10:00:00Z'
  ),

  (
    17,
    'Recommitted'::engagement_status_enum,
    '2027-03-01',
    '',
    'Officer A. Tan',
    '2026-05-15T16:00:00Z'
  ),

  (
    17,
    'Renewal Started'::engagement_status_enum,
    '2026-05-15',
    '',
    'Officer A. Tan',
    '2026-02-01T10:00:00Z'
  ),

  (
    17,
    'Uncontacted'::engagement_status_enum,
    '2026-02-01',
    '',
    'System Admin',
    '2023-05-10T11:30:00Z'
  ),

  (
    18,
    'Renewal Started'::engagement_status_enum,
    '2026-11-26',
    '',
    'Officer J. Reyes',
    '2026-11-05T14:15:00Z'
  ),

  (
    18,
    'Followed-up'::engagement_status_enum,
    '2026-11-05',
    '',
    'Officer J. Reyes',
    '2026-10-14T11:00:00Z'
  ),

  (
    18,
    'Uncontacted'::engagement_status_enum,
    '2026-10-14',
    '',
    'System Admin',
    '2025-10-15T14:00:00Z'
  ),

  (
    19,
    'Recommitted'::engagement_status_enum,
    '2027-02-10',
    '',
    'Officer M. Cruz',
    '2026-08-10T16:00:00Z'
  ),

  (
    19,
    'Renewal Started'::engagement_status_enum,
    '2026-08-10',
    '',
    'Officer M. Cruz',
    '2026-02-01T10:00:00Z'
  ),

  (
    19,
    'Uncontacted'::engagement_status_enum,
    '2026-02-01',
    '',
    'System Admin',
    '2022-08-20T09:15:00Z'
  ),

  (
    20,
    'Followed-up'::engagement_status_enum,
    '2026-11-30',
    '',
    'Officer A. Tan',
    '2026-11-08T10:30:00Z'
  ),

  (
    20,
    'Uncontacted'::engagement_status_enum,
    '2026-11-08',
    '',
    'System Admin',
    '2024-11-12T10:30:00Z'
  ),

  (
    21,
    'Uncontacted'::engagement_status_enum,
    '2026-11-24',
    '',
    'System Admin',
    '2025-12-05T13:45:00Z'
  ),

  (
    22,
    'Recommitted'::engagement_status_enum,
    '2027-01-30',
    '',
    'Officer A. Tan',
    '2026-02-20T16:00:00Z'
  ),

  (
    22,
    'Renewal Started'::engagement_status_enum,
    '2026-02-20',
    '',
    'Officer A. Tan',
    '2026-02-01T10:00:00Z'
  ),

  (
    22,
    'Uncontacted'::engagement_status_enum,
    '2026-02-01',
    '',
    'System Admin',
    '2022-01-10T11:00:00Z'
  ),

  (
    23,
    'Renewal Started'::engagement_status_enum,
    '2026-10-20',
    '',
    'Officer J. Reyes',
    '2026-09-15T14:15:00Z'
  ),

  (
    23,
    'Followed-up'::engagement_status_enum,
    '2026-09-15',
    '',
    'Officer J. Reyes',
    '2026-10-14T11:00:00Z'
  ),

  (
    23,
    'Uncontacted'::engagement_status_enum,
    '2026-10-14',
    '',
    'System Admin',
    '2024-09-05T08:30:00Z'
  ),

  (
    24,
    'Recommitted'::engagement_status_enum,
    '2027-03-01',
    '',
    'Officer M. Cruz',
    '2026-06-25T16:00:00Z'
  ),

  (
    24,
    'Renewal Started'::engagement_status_enum,
    '2026-06-25',
    '',
    'Officer M. Cruz',
    '2026-02-01T10:00:00Z'
  ),

  (
    24,
    'Uncontacted'::engagement_status_enum,
    '2026-02-01',
    '',
    'System Admin',
    '2023-06-01T10:45:00Z'
  ),

  (
    25,
    'Followed-up'::engagement_status_enum,
    '2026-11-21',
    '',
    'Officer A. Tan',
    '2026-11-01T10:30:00Z'
  ),

  (
    25,
    'Uncontacted'::engagement_status_enum,
    '2026-11-01',
    '',
    'System Admin',
    '2024-11-05T09:00:00Z'
  ),

  (
    26,
    'Uncontacted'::engagement_status_enum,
    '2026-12-05',
    '',
    'System Admin',
    '2025-12-10T14:15:00Z'
  ),

  (
    27,
    'Lapsed Donor'::engagement_status_enum,
    '2026-09-30',
    '',
    'Officer M. Cruz',
    '2026-08-10T15:30:00Z'
  ),

  (
    27,
    'Followed-up'::engagement_status_enum,
    '2026-08-10',
    '',
    'Officer M. Cruz',
    '2026-08-01T09:45:00Z'
  ),

  (
    27,
    'Uncontacted'::engagement_status_enum,
    '2026-08-01',
    '',
    'System Admin',
    '2025-08-10T09:30:00Z'
  );

-- Reset donor outreach activities sequence
SELECT setval('donor_outreach_activities_id_seq', (SELECT COALESCE(MAX(id), 1) FROM donor_outreach_activities));
