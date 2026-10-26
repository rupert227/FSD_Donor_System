## 1. `lead_prospects`

Records prospective donors and monitors pipeline conversion steps prior to commitment.

- **`id`** (`INTEGER`, `PK`, `AUTO_INCREMENT`, `UNIQUE`)  
  Unique prospect record identifier.
- **`month`** (`ENUM`, `NULLABLE`)  
  Calendar month label (JAN to DEC).
- **`status`** (`ENUM`, `NULLABLE`)  
  Operational status of record.
- **`prospect_name`** (`VARCHAR(100)`, `NOT NULL`)  
  Corporate entity or prospect title.
- **`donor_type`** (`ENUM`, `NOT NULL`)  
  *Permitted values: `individual`, `corporate`, `community`, `international`*
- **`lead_source_origin`** (`ENUM`, `NOT NULL`)  
  Source channel of prospect lead.  
  *Permitted values: `Referral`, `Research`, `Booths`, `Direct Call`, `Walk-in`*
- **`primary_contact_person`** (`VARCHAR(100)`, `NOT NULL`)  
  Primary contact person for communication.
- **`title_designation`** (`VARCHAR(100)`, `NULLABLE`)  
  Official corporate title or role.
- **`email_address`** (`VARCHAR(150)`, `NULLABLE`)  
  Contact email address for formal outreach.
- **`phone_number`** (`VARCHAR(50)`, `NOT NULL`)  
  Telephone or mobile contact number.
- **`street_address`** (`VARCHAR(255)`, `NULLABLE`)  
  Street and office address details.
- **`city_province`** (`VARCHAR(100)`, `NULLABLE`)  
  City and provincial location.
- **`target_campaign`** (`ENUM`, `NOT NULL`)  
  Charitable initiative or allocation program.  
  *Permitted values:*
  - *`Youth Servant Leadership`*
  - *`Health and Disaster Relief`*
  - *`In-Kind Social Enterprise`*
  - *`At-Risk Restorative Justice`*
  - *`Institute for Stewardship`*
- **`target_amount`** (`DECIMAL(14,2)`, `NOT NULL`)  
  Target cash donation forecast value.
- **`pipeline_status`** (`ENUM`, `NOT NULL`)  
  Current phase in conversion pipeline.  
  *Permitted values:*
  - *`New Lead`*
  - *`Under Research`*
  - *`Outreach Started`*
  - *`Proposal Sent`*
  - *`Secured Donor`*
- **`probability_score`** (`INTEGER`, `DEFAULT 20`)  
  Likelihood score of successful conversion.
- **`assigned_officer`** (`VARCHAR(100)`, `NOT NULL`)  
  Staff member assigned to lead outreach.
- **`target_followup_date`** (`DATE`, `NULLABLE`)  
  Next scheduled touchpoint date.
- **`next_step_action_plan`** (`TEXT`, `NULLABLE`)  
  Planned action steps for conversion team.

## 2. `donor_profiles`

Stores active donor records, contact details, and historical loyalty metrics.

- **`id`** (`INTEGER`, `PK`, `AUTO_INCREMENT`, `UNIQUE`)  
  Unique donor record identifier.
- **`donor_name`** (`VARCHAR(150)`, `NOT NULL`)  
  Official donor or corporate foundation title.
- **`donor_type`** (`ENUM`, `NOT NULL`)  
  Legal entity classification of donor.  
  *Permitted values: `individual`, `corporate`, `community`, `international`*
- **`primary_contact_person`** (`VARCHAR(100)`, `NOT NULL`)  
  Lead representative for donor relations.
- **`title_designation`** (`VARCHAR(100)`, `NULLABLE`)  
  Designation of primary contact person.
- **`email_address`** (`VARCHAR(150)`, `NOT NULL`)  
  Official email address for communication.
- **`mobile_number`** (`VARCHAR(50)`, `NOT NULL`)  
  Primary phone or mobile contact details.
- **`tax_id`** (`VARCHAR(50)`, `NULLABLE`)  
  Official Bureau of Internal Revenue tax identification number.
- **`delivery_address`** (`TEXT`, `NOT NULL`)  
  Postal street address for receipt dispatch.
- **`target_campaign`** (`ENUM`, `NOT NULL`)  
  Primary supported program cause.  
  *Permitted values:*
  - *`Youth Servant Leadership`*
  - *`Health and Disaster Relief`*
  - *`In-Kind Social Enterprise`*
  - *`At-Risk Restorative Justice`*
  - *`Institute for Stewardship`*
- **`engagement_status`** (`ENUM`, `NOT NULL`)  
  Current outreach and renewal status.  
  *Permitted values:*
  - *`Uncontacted`*
  - *`Followed-up`*
  - *`Renewal Started`*
  - *`Recommitted`*
  - *`Lapsed Donor`*
- **`donor_tenure`** (`ENUM`, `NOT NULL`)  
  Donor retention and loyalty category.  
  *Permitted values:*
  - *`3+ Years Loyal`*
  - *`2 Years Retained`*
  - *`1 Year Retained`*
  - *`New Renewal`*
- **`assigned_officer`** (`VARCHAR(100)`, `NOT NULL`)  
  Staff member assigned to donor account.
- **`last_contact_date`** (`DATE`, `NULLABLE`)  
  Date of most recent outreach touchpoint.
- **`target_followup_date`** (`DATE`, `NULLABLE`)  
  Next scheduled renewal contact date.

## 3. `transactions`

Maintains cash remittance ledgers, deposit records, and receipt clearance statuses.

- **`id`** (`INTEGER`, `PK`, `AUTO_INCREMENT`, `UNIQUE`)  
  Unique transaction record identifier.
- **`donor_id`** (`INTEGER`, `FK`, `NOT NULL`)  
  Foreign key link to donor profile record.
- **`source_of_funds`** (`ENUM`, `NOT NULL`)  
  Revenue channel for transaction intake.  
  *Permitted values:*
  - *`Corporate Partners`*
  - *`Direct (Individual)`*
  - *`Church Institutions`*
  - *`Community/Association`*
  - *`Social Enterprise`*
- **`campaign_name`** (`ENUM`, `NOT NULL`)  
  Fund allocation program for received remittance.  
  *Permitted values:*
  - *`Youth Servant Leadership`*
  - *`Health and Disaster Relief`*
  - *`In-Kind Social Enterprise`*
  - *`At-Risk Restorative Justice`*
  - *`Institute for Stewardship`*
- **`amount_pledge`** (`DECIMAL(14,2)`, `NOT NULL`)  
  Committed donation value for current fiscal period.
- **`amount_collected`** (`DECIMAL(14,2)`, `NOT NULL`)  
  Actual cash remittance cleared by Treasury.
- **`transaction_date`** (`DATE`, `NOT NULL`)  
  Calendar date of bank deposit or transfer.
- **`payment_method`** (`ENUM`, `NOT NULL`)  
  Financial channel used for cash transfer.  
  *Permitted values: `Bank Transfer`, `Check Payment`, `Direct Deposit`, `Cash`*
- **`deposit_bank`** (`VARCHAR(100)`, `NOT NULL`)  
  Depository bank institution.
- **`bank_reference_no`** (`VARCHAR(100)`, `NOT NULL`)  
  Bank transaction code or check serial number.
- **`official_receipt_no`** (`VARCHAR(50)`, `UNIQUE`, `NOT NULL`)  
  Sequential official donation receipt number.
- **`tax_certificate_no`** (`VARCHAR(50)`, `NULLABLE`)  
  Bureau of Internal Revenue Certificate of Donation number.
- **`cod_requested`** (`BOOLEAN`, `DEFAULT FALSE`)  
  Flag to indicate if donor requested tax certificate.
- **`treasury_clearance_status`** (`ENUM`, `NOT NULL`)  
  Current workflow status in Donor Care.  
  *Permitted values:*
  - *`Receipt Verification`*
  - *`Certificate Creation`*
  - *`Dispatch Prepared`*
  - *`Transaction Finalized`*
- **`deposit_clearance_date`** (`DATE`, `NULLABLE`)  
  Date Treasury verified the cash deposit.
- **`fulfillment_date`** (`DATE`, `NULLABLE`)  
  Date official receipt was dispatched to donor.

## 4. `certificate_of_donation`

Records certified tax deduction documents prepared for eligible donors.

- **`id`** (`INTEGER`, `PK`, `AUTO_INCREMENT`, `UNIQUE`)  
  Unique certificate record identifier.
- **`certificate_no`** (`VARCHAR(50)`, `UNIQUE`, `NOT NULL`)  
  Official control number for BIR tax documentation.
- **`transaction_id`** (`INTEGER`, `FK`, `NOT NULL`)  
  Foreign key reference to related transaction.
- **`donor_id`** (`INTEGER`, `FK`, `NOT NULL`)  
  Foreign key reference to donor account.
- **`certified_amount`** (`DECIMAL(14,2)`, `NOT NULL`)  
  Total monetary donation amount declared for tax deduction.
- **`issuance_date`** (`DATE`, `NOT NULL`)  
  Date certificate received executive approval.
- **`delivery_preference`** (`ENUM`, `NOT NULL`)  
  Selected method for document dispatch.  
  *Permitted values: `Email PDF (Softcopy)`, `Postal Mail`, `Hand Delivered`*
- **`dispatch_date`** (`DATE`, `NULLABLE`)  
  Date document was dispatched to donor.

## 5. `user_accounts`

Controls platform access, staff sign-in credentials, and role privileges.

- **`id`** (`INTEGER`, `PK`, `AUTO_INCREMENT`, `UNIQUE`)  
  Unique system user identifier.
- **`email_address`** (`VARCHAR(150)`, `UNIQUE`, `NOT NULL`)  
  Corporate email address used for portal access.
- **`password_hash`** (`VARCHAR(255)`, `NOT NULL`)  
  Encrypted credential hash for authentication.
- **`user_role`** (`ENUM`, `NOT NULL`)  
  Division role and system permissions.  
  *Permitted values:*
  - *`Conversion Officer`*
  - *`Retention Officer`*
  - *`Donor Care Officer`*
  - *`Division Head`*
  - *`System Administrator`*
- **`account_status`** (`ENUM`, `NOT NULL`)  
  Current status of user account.  
  *Permitted values: `Active`, `Suspended`*