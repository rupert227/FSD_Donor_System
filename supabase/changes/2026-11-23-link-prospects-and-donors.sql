-- ==============================================================================
-- Link prospects and donors, and grow the prospect pipeline.
-- File: supabase/changes/2026-11-23-link-prospects-and-donors.sql
--
-- APPLIED to the live Supabase project on 2026-11-23 (run as one script).
-- Before running, the id sequences had to be resynced because earlier seeds inserted
-- explicit ids:
--   SELECT setval('donor_profiles_id_seq', (SELECT max(id) FROM donor_profiles));
--   SELECT setval('lead_prospects_id_seq', (SELECT max(id) FROM lead_prospects));
--
-- 1. Every existing "Secured Donor" prospect gets a donor account (the prospect is
--    kept and linked through donor_profiles.converted_from_lead_id).
-- 2. 153 existing donors (added 2025-03-01 or later) get the "Secured Donor"
--    prospect they were converted from, created 14 to 43 days before the donor.
--    With step 1 this gives 170 secured prospects.
-- 3. 600 new prospects in the earlier stages (New Lead, Under Research,
--    Outreach Started, Proposal Sent), created across 2025 and 2026.
-- 4. Secured prospects and Recommitted donors have no follow-up date: the
--    prospect is closed, and the donor's next renewal cycle has not opened.
--
-- Every follow-up date is in the same quarter as the date the record was added.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Donors for the existing Secured Donor prospects
-- ------------------------------------------------------------------------------
WITH sec AS (
  SELECT p.* FROM lead_prospects p
  WHERE p.pipeline_status = 'Secured Donor'
    AND NOT EXISTS (SELECT 1 FROM donor_profiles d WHERE d.converted_from_lead_id = p.id)
)
INSERT INTO donor_profiles (
  donor_name, donor_type, primary_contact_person, title_designation, email_address,
  mobile_number, tax_id, delivery_address, target_campaign, engagement_status,
  donor_tenure, assigned_officer, converted_from_lead_id, cod_requested,
  last_contact_date, target_followup_date, created_at
)
SELECT
  p.prospect_name, p.donor_type, p.primary_contact_person, p.title_designation,
  p.email_address, COALESCE(p.phone_number, 'N/A'),
  format('%s-%s-%s-000', 600 + (p.id % 300), 100 + ((p.id * 37) % 900), 100 + ((p.id * 53) % 900)),
  concat_ws(', ', p.street_address, p.city_province), p.target_campaign,
  'Uncontacted'::engagement_status_enum, 'New Renewal'::donor_tenure_enum,
  p.assigned_officer, p.id, FALSE, NULL::date,
  LEAST((date_trunc('quarter', x.dc::date) + INTERVAL '3 months' - INTERVAL '1 day')::date, x.dc::date + 14),
  x.dc
FROM sec p
CROSS JOIN LATERAL (
  SELECT LEAST(p.created_at + INTERVAL '14 days',
               date_trunc('year', p.created_at) + INTERVAL '1 year' - INTERVAL '1 hour') AS dc
) x;

-- ------------------------------------------------------------------------------
-- 2. Secured Donor prospects behind 153 existing donors
-- ------------------------------------------------------------------------------
WITH pick AS (
  SELECT d.*, row_number() OVER (ORDER BY md5(d.id::text)) AS k
  FROM donor_profiles d
  WHERE d.converted_from_lead_id IS NULL AND d.created_at >= '2025-03-01'
),
src AS (
  SELECT k_.*, k_.created_at - ((14 + k_.id % 30) || ' days')::interval AS pc
  FROM (SELECT * FROM pick WHERE k <= 153) k_
),
ins AS (
  INSERT INTO lead_prospects (
    month, status, prospect_name, donor_type, lead_source_origin, primary_contact_person,
    title_designation, email_address, phone_number, street_address, city_province,
    target_campaign, target_amount, pipeline_status, probability_score, assigned_officer,
    target_followup_date, next_step_action_plan, created_at
  )
  SELECT
    upper(to_char(pc, 'MON'))::month_enum, 'Active'::record_status_enum, donor_name, donor_type,
    (ARRAY['Referral','Research','Booths','Direct Call','Walk-in'])[(id % 5) + 1]::lead_source_origin_enum,
    primary_contact_person, title_designation, email_address, mobile_number,
    split_part(delivery_address, ', ', 1),
    NULLIF(substr(delivery_address, length(split_part(delivery_address, ', ', 1)) + 3), ''),
    target_campaign,
    COALESCE((SELECT GREATEST(150000, round(avg(t.amount_pledge) / 50000) * 50000)
              FROM transactions t WHERE t.donor_id = src.id), 250000),
    'Secured Donor'::pipeline_status_enum, 100, assigned_officer, NULL::date,
    'Converted to donor account; stewardship handed to Donor Retention.', pc
  FROM src
  RETURNING id, email_address
)
UPDATE donor_profiles d SET converted_from_lead_id = ins.id
FROM ins WHERE d.email_address = ins.email_address;

-- ------------------------------------------------------------------------------
-- 3. 600 new prospects in the earlier stages
-- ------------------------------------------------------------------------------
WITH a AS (SELECT
  ARRAY['Alfredo','Beatriz','Cristina','Danilo','Edgardo','Fe','Gloria','Hector','Irene','Jaime','Karina','Leonardo','Mercedes','Nestor','Olivia','Patricio','Renato','Soledad','Tomas','Ursula','Vicente','Wilma','Xenia','Yolanda','Zenaida','Arturo','Bernadette','Cesar','Dolores','Eduardo','Felicidad'] pf,
  ARRAY['Agoncillo','Baltazar','Cordero','Dalisay','Evangelista','Francisco','Galang','Herrera','Ignacio','Javier','Kintanar','Layug','Manalastas','Nolasco','Olivares','Padilla','Querubin','Rivera','Sarmiento','Tuazon','Umali','Villareal','Wong','Yambao','Zuniga','Arellano','Buenaventura','Concepcion','Dantes'] ps,
  ARRAY['Abuel','Basa','Cabral','Dayrit','Estrada','Fontanilla','Gaerlan','Hontiveros','Isidro','Jocson','Kapunan','Lagdameo','Madrigal','Navarro','Oledan','Pacheco','Quiambao','Ramos','Sison','Tiongson','Unson','Villamor','Yap','Zaragoza','Alvarado','Bonifacio','Cordova','Dimagiba','Enriquez','Fabella','Gamboa'] cs,
  ARRAY['Steel','Cement','Banking','Retail','Mining','Hospitality','Biotech','Software','Construction','Publishing','Aviation','Fisheries','Apparel'] sec,
  ARRAY['Industries','Ventures'] frm,
  ARRAY['Atty.','Dr.','Engr.','Hon.','Mr.','Mrs.','Dra.'] hon,
  ARRAY['Alberto','Benilda','Casiano','Dionisia','Esteban','Florentina','Gaudencio','Herminia','Inocencio','Josefina','Kalixto','Lourdes','Marcelino','Nieves','Octavio','Pacita','Quintin'] jf,
  ARRAY['Abella','Bagtas','Carandang','Dayao','Escalona','Fortunato','Gatdula','Hipolito','Ilustre','Jumalon','Kasilag'] js,
  ARRAY['Parish Youth Ministry','Mothers'' League','Knights of Columbus Council','Catechetical Guild','Livelihood Cooperative','Senior Citizens Federation','Parish Pastoral Council','Lay Ministers Guild','Basic Ecclesial Community','Barangay Health Workers Association','Altar Servers Society'] kd,
  ARRAY['Cainta','Antipolo','Rodriguez','Binangonan','San Mateo','Bacoor','Imus','Dasmariñas','Cabuyao','Calamba','Santa Rosa','Biñan','San Pedro'] pl,
  ARRAY['Kreuz','Esperanza','Horizon','Cedar','Marlowe','Tessera','Orchard','Linden','Ardent','Nordic','Alpine','Coastal','Ember'] ib,
  ARRAY['Austria','Canada','Australia','Japan','Norway','Italy'] ic,
  ARRAY['Mabini St.','Rizal Ave.','Quezon Ave.','Bonifacio St.','Luna St.','Aguinaldo Hwy.','Katipunan Ave.','Ortigas Ave.','Shaw Blvd.','Taft Ave.','Del Pilar St.','Jacinto St.','Sampaguita St.','Narra St.','Acacia Rd.','Molave St.','Kamagong St.'] st,
  ARRAY['Makati City','Quezon City','Pasig City','Manila','Mandaluyong City','San Juan City','Taguig City','Parañaque City','Muntinlupa City','Marikina City','Cebu City','Davao City','Iloilo City','Baguio City','Cagayan de Oro City','Bacolod City','Angeles City','Zamboanga City','Tagaytay City'] ct,
  ARRAY['Youth Servant Leadership','Health and Disaster Relief','In-Kind Social Enterprise','At-Risk Restorative Justice','Institute for Stewardship'] cp,
  ARRAY['Referral','Research','Booths','Direct Call','Walk-in'] ls,
  ARRAY['Officer A. Tan','Officer J. Reyes','Officer M. Cruz'] off,
  ARRAY[150000,200000,250000,300000,350000,450000,500000,750000,1000000,1500000,2000000,2800000] amt
),
g AS (
  SELECT rn,
    CASE WHEN rn <= 270 THEN 'Corporate' WHEN rn <= 390 THEN 'Individual'
         WHEN rn <= 522 THEN 'Community' ELSE 'International' END AS t,
    (rn * 7) % 20 AS sv,
    '2025-01-03 00:30:00+00'::timestamptz + (((rn * 61) % 720) || ' days')::interval AS ts
  FROM generate_series(1, 600) rn
),
b AS (SELECT g.*, row_number() OVER (PARTITION BY t ORDER BY rn) AS rt FROM g),
c AS (
  SELECT b.*,
    CASE WHEN sv < 4 THEN 'New Lead' WHEN sv < 9 THEN 'Under Research'
         WHEN sv < 15 THEN 'Outreach Started' ELSE 'Proposal Sent' END AS stage,
    pf[(rn - 1) % 31 + 1] AS fn, ps[(rn - 1) % 29 + 1] AS sn,
    CASE t
      WHEN 'Corporate' THEN cs[(rt - 1) % 31 + 1] || ' ' || sec[(rt - 1) % 13 + 1] || ' ' || frm[(rt - 1) % 2 + 1]
      WHEN 'Individual' THEN hon[(rt - 1) % 7 + 1] || ' ' || jf[(rt - 1) % 17 + 1] || ' ' || js[(rt - 1) % 11 + 1] || ' Memorial Fund'
      WHEN 'Community' THEN kd[(rt - 1) % 11 + 1] || ' - ' || pl[(rt - 1) % 13 + 1]
      ELSE ib[(rt - 1) % 13 + 1] || ' Charitable Trust (' || ic[(rt - 1) % 6 + 1] || ')' END AS pname,
    CASE t WHEN 'Corporate' THEN 'enterprise-ph.com' WHEN 'Individual' THEN 'mail-ph.net'
           WHEN 'Community' THEN 'parish-network.ph' ELSE 'overseas-partners.org' END AS dom,
    CASE t
      WHEN 'Corporate' THEN (ARRAY['VP Corporate Communications','CSR Manager','Foundation Director','Chief Sustainability Officer'])[rn % 4 + 1]
      WHEN 'Individual' THEN (ARRAY['Principal Benefactor','Trustee','Philanthropist'])[rn % 3 + 1]
      WHEN 'Community' THEN (ARRAY['Parish Priest','Council President','Lay Coordinator'])[rn % 3 + 1]
      ELSE (ARRAY['Programme Director','Head of Partnerships','Country Representative'])[rn % 3 + 1] END AS title
  FROM b CROSS JOIN a
)
INSERT INTO lead_prospects (
  month, status, prospect_name, donor_type, lead_source_origin, primary_contact_person,
  title_designation, email_address, phone_number, street_address, city_province,
  target_campaign, target_amount, pipeline_status, probability_score, assigned_officer,
  target_followup_date, next_step_action_plan, created_at
)
SELECT
  upper(to_char(ts, 'MON'))::month_enum, 'Active'::record_status_enum, pname, t::donor_type_enum,
  ls[rn % 5 + 1]::lead_source_origin_enum, fn || ' ' || sn, title,
  lower(fn) || '.' || lower(sn) || '@' || dom,
  '(02) 8' || lpad(((rn * 53) % 900 + 100)::text, 3, '0') || '-' || lpad(((rn * 7919) % 10000)::text, 4, '0'),
  ((rn * 41) % 900 + 10) || ' ' || st[(rn - 1) % 17 + 1], ct[(rn * 3) % 19 + 1],
  cp[(rn * 3) % 5 + 1]::target_campaign_enum, amt[(rn * 5) % 12 + 1],
  stage::pipeline_status_enum,
  CASE stage WHEN 'New Lead' THEN 20 WHEN 'Under Research' THEN 40 WHEN 'Outreach Started' THEN 60 ELSE 80 END,
  off[rn % 3 + 1],
  LEAST((date_trunc('quarter', ts::date) + INTERVAL '3 months' - INTERVAL '1 day')::date, ts::date + 7 + (rn % 24)),
  CASE stage
    WHEN 'New Lead' THEN 'Initial discovery call and verify current CSR focal person.'
    WHEN 'Under Research' THEN 'Compile financial stewardship kit and CSR alignment brief.'
    WHEN 'Outreach Started' THEN 'Present program presentation to executive committee.'
    ELSE 'Clarify proposal terms and budget allocation schedule.' END,
  ts
FROM c CROSS JOIN a;

-- ------------------------------------------------------------------------------
-- 4. No follow-up date once the record is closed or renewed
-- ------------------------------------------------------------------------------
UPDATE lead_prospects
SET target_followup_date = NULL,
    next_step_action_plan = 'Converted to donor account; stewardship handed to Donor Retention.'
WHERE pipeline_status = 'Secured Donor';

UPDATE donor_profiles SET target_followup_date = NULL WHERE engagement_status = 'Recommitted';

COMMIT;
